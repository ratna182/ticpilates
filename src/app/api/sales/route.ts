import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '50', 10);

    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const [y, m, d] = dateFrom.split('-').map(Number);
        where.createdAt.gte = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      if (dateTo) {
        const [y, m, d] = dateTo.split('-').map(Number);
        where.createdAt.lte = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          client: true,
          pricingPlan: true,
          promoCode: true,
          invoice: true,
          booking: {
            include: {
              classSession: {
                include: { service: true, instructor: true },
              },
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Summary stats
    const paidSum = await prisma.transaction.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true },
      _count: { id: true },
    });

    return NextResponse.json({
      ok: true,
      data: transactions,
      total,
      summary: {
        totalRevenue: paidSum._sum.amount || 0,
        totalPaidCount: paidSum._count.id,
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Gagal memuat data transaksi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { clientId, pricingPlanId, amount, method, status = 'paid', promoCodeId, notes } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Klien wajib dipilih' }, { status: 400 });
    }
    if (!pricingPlanId) {
      return NextResponse.json({ error: 'Paket harga wajib dipilih' }, { status: 400 });
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Jumlah pembayaran tidak valid' }, { status: 400 });
    }
    if (!method) {
      return NextResponse.json({ error: 'Metode pembayaran wajib dipilih' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: 'Klien tidak ditemukan' }, { status: 404 });
    }

    const plan = await prisma.pricingPlan.findUnique({ where: { id: pricingPlanId } });
    if (!plan) {
      return NextResponse.json({ error: 'Paket harga tidak ditemukan' }, { status: 404 });
    }

    const branch = await prisma.branch.findFirst();
    if (!branch) {
      return NextResponse.json({ error: 'Data cabang tidak ditemukan' }, { status: 500 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Validate promo code if given
      let appliedPromoId: string | null = promoCodeId || null;
      let finalAmount = parseFloat(amount);

      if (promoCodeId) {
        const promo = await tx.promoCode.findUnique({ where: { id: promoCodeId } });
        if (promo) {
          const now = new Date();
          if (promo.validUntil < now || promo.validFrom > now) {
            throw new Error('Kode promo sudah tidak berlaku');
          }
          if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
            throw new Error('Kode promo sudah mencapai batas penggunaan');
          }
          // Apply discount
          if (promo.discountType === 'percent') {
            finalAmount = finalAmount * (1 - promo.discountValue / 100);
          } else {
            finalAmount = Math.max(0, finalAmount - promo.discountValue);
          }
          // Increment usage
          await tx.promoCode.update({
            where: { id: promoCodeId },
            data: { usageCount: { increment: 1 } },
          });
        } else {
          appliedPromoId = null;
        }
      }

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          branchId: branch.id,
          clientId,
          amount: finalAmount,
          method,
          status,
          pricingPlanId,
          promoCodeId: appliedPromoId,
        },
      });

      // Create invoice
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const invoiceNumber = `INV-${datePart}-${transaction.id.slice(-6).toUpperCase()}`;
      const invoice = await tx.invoice.create({
        data: {
          transactionId: transaction.id,
          invoiceNumber,
        },
      });

      // If paid and plan is bundle/membership -> create or extend ClientMembership
      if (status === 'paid' && (plan.type === 'bundle' || plan.type === 'membership')) {
        const validUntil = plan.durationDays
          ? new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)
          : null;

        await tx.clientMembership.create({
          data: {
            clientId,
            pricingPlanId,
            sessionsLeft: plan.sessionCount ?? null,
            validUntil,
            status: 'active',
          },
        });
      }

      return { transaction, invoice };
    });

    const fullTx = await prisma.transaction.findUnique({
      where: { id: result.transaction.id },
      include: {
        client: true,
        pricingPlan: true,
        promoCode: true,
        invoice: true,
      },
    });

    return NextResponse.json({ ok: true, data: fullTx }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat transaksi' }, { status: 400 });
  }
}

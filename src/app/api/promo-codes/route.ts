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
    const statusFilter = searchParams.get('status') || 'all';

    const where: any = {};
    if (statusFilter !== 'all') {
      const now = new Date();
      if (statusFilter === 'active') {
        where.status = 'active';
        where.validUntil = { gt: now };
        where.OR = [
          { usageLimit: null },
          { usageLimit: { gt: prisma.promoCode.fields.usageCount } },
        ];
      } else if (statusFilter === 'expired') {
        where.OR = [
          { validUntil: { lt: now } },
          { AND: [{ usageLimit: { not: null } }] },
        ];
      }
    }

    const promoCodes = await prisma.promoCode.findMany({
      where: statusFilter === 'all' ? {} : statusFilter === 'active' ? {
        status_computed: undefined,
        validUntil: { gt: new Date() },
        validFrom: { lte: new Date() },
      } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    // Compute live status
    const now = new Date();
    const withStatus = promoCodes.map((p) => {
      let computedStatus = 'active';
      if (p.validUntil < now) computedStatus = 'expired';
      else if (p.validFrom > now) computedStatus = 'scheduled';
      else if (p.usageLimit !== null && p.usageCount >= p.usageLimit) computedStatus = 'exhausted';

      return { ...p, computedStatus };
    });

    const filtered = statusFilter !== 'all'
      ? withStatus.filter((p) => p.computedStatus === statusFilter)
      : withStatus;

    return NextResponse.json({ ok: true, data: filtered });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json({ error: 'Gagal memuat kode promo' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      validFrom,
      validUntil,
      usageLimit,
    } = body;

    if (!code?.trim()) {
      return NextResponse.json({ error: 'Kode promo wajib diisi' }, { status: 400 });
    }
    if (!discountType || !['percent', 'fixed'].includes(discountType)) {
      return NextResponse.json({ error: 'Tipe diskon tidak valid' }, { status: 400 });
    }
    if (!discountValue || isNaN(parseFloat(discountValue)) || parseFloat(discountValue) <= 0) {
      return NextResponse.json({ error: 'Nilai diskon tidak valid' }, { status: 400 });
    }
    if (discountType === 'percent' && parseFloat(discountValue) > 100) {
      return NextResponse.json({ error: 'Diskon persen tidak boleh melebihi 100%' }, { status: 400 });
    }
    if (!validFrom || !validUntil) {
      return NextResponse.json({ error: 'Tanggal berlaku wajib diisi' }, { status: 400 });
    }

    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);
    if (untilDate <= fromDate) {
      return NextResponse.json({ error: 'Tanggal berakhir harus setelah tanggal mulai' }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst();
    if (!branch) {
      return NextResponse.json({ error: 'Data cabang tidak ditemukan' }, { status: 500 });
    }

    const upperCode = code.trim().toUpperCase().replace(/\s+/g, '');
    const existing = await prisma.promoCode.findFirst({ where: { code: upperCode } });
    if (existing) {
      return NextResponse.json({ error: 'Kode promo sudah digunakan, pilih kode lain' }, { status: 409 });
    }

    const promo = await prisma.promoCode.create({
      data: {
        branchId: branch.id,
        code: upperCode,
        discountType,
        discountValue: parseFloat(discountValue),
        validFrom: fromDate,
        validUntil: untilDate,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        usageCount: 0,
      },
    });

    return NextResponse.json({ ok: true, data: promo }, { status: 201 });
  } catch (error) {
    console.error('Error creating promo code:', error);
    return NextResponse.json({ error: 'Gagal membuat kode promo' }, { status: 500 });
  }
}

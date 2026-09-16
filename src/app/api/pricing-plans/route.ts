import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const plans = await prisma.pricingPlan.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: {
          select: { memberships: true, transactions: true },
        },
      },
    });
    return NextResponse.json({ ok: true, data: plans });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    return NextResponse.json({ error: 'Gagal mengambil data paket harga' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, type, price, sessionCount, durationDays, active } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama paket wajib diisi' }, { status: 400 });
    }
    if (!type || !['single', 'bundle', 'membership'].includes(type)) {
      return NextResponse.json({ error: 'Tipe paket harus berupa single, bundle, atau membership' }, { status: 400 });
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ error: 'Harga harus berupa angka lebih dari 0' }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst();
    if (!branch) {
      return NextResponse.json({ error: 'Data cabang tidak ditemukan' }, { status: 500 });
    }

    const plan = await prisma.pricingPlan.create({
      data: {
        branchId: branch.id,
        name: name.trim(),
        type,
        price: numPrice,
        sessionCount: sessionCount ? parseInt(sessionCount, 10) : null,
        durationDays: durationDays ? parseInt(durationDays, 10) : null,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return NextResponse.json({ ok: true, data: plan }, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing plan:', error);
    return NextResponse.json({ error: 'Gagal menyimpan paket harga baru' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, type, price, sessionCount, durationDays, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID paket diperlukan' }, { status: 400 });
    }

    const updated = await prisma.pricingPlan.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(type && { type }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(sessionCount !== undefined && { sessionCount: sessionCount ? parseInt(sessionCount, 10) : null }),
        ...(durationDays !== undefined && { durationDays: durationDays ? parseInt(durationDays, 10) : null }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error('Error updating pricing plan:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data paket harga' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID paket diperlukan' }, { status: 400 });
    }

    // Check if plan has been bought or has active memberships
    const usageCount = await prisma.clientMembership.count({
      where: { pricingPlanId: id },
    });

    if (usageCount > 0) {
      const deactivated = await prisma.pricingPlan.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json({
        ok: true,
        message: 'Paket dinonaktifkan karena sudah digunakan oleh klien aktif',
        data: deactivated,
      });
    }

    await prisma.pricingPlan.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, message: 'Paket harga berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting pricing plan:', error);
    return NextResponse.json({ error: 'Gagal menghapus paket harga' }, { status: 500 });
  }
}

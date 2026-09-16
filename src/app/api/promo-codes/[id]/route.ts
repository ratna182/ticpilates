import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { code, discountType, discountValue, validFrom, validUntil, usageLimit } = body;

    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Kode promo tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {};
    if (code !== undefined) {
      const upperCode = code.trim().toUpperCase().replace(/\s+/g, '');
      const dup = await prisma.promoCode.findFirst({ where: { code: upperCode, id: { not: id } } });
      if (dup) return NextResponse.json({ error: 'Kode promo sudah digunakan' }, { status: 409 });
      updateData.code = upperCode;
    }
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil);
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit, 10) : null;

    const updated = await prisma.promoCode.update({ where: { id }, data: updateData });
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error('Error updating promo code:', error);
    return NextResponse.json({ error: 'Gagal memperbarui kode promo' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.promoCode.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: 'Kode promo berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    return NextResponse.json({ error: 'Gagal menghapus kode promo' }, { status: 500 });
  }
}

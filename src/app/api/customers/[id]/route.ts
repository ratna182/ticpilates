import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        memberships: {
          include: { pricingPlan: true },
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            classSession: {
              include: { service: true, instructor: true },
            },
            transaction: true,
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { invoice: true, pricingPlan: true },
        },
        notifications: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
        feedback: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Klien tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: client });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Gagal memuat data klien' }, { status: 500 });
  }
}

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
    const { name, phone, email, notes } = body;

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Klien tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim().replace(/[^0-9+]/g, '');
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    const updated = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data klien' }, { status: 500 });
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
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: 'Data klien berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Gagal menghapus data klien' }, { status: 500 });
  }
}

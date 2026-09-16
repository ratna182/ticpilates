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
    const q = searchParams.get('q') || '';
    const take = parseInt(searchParams.get('take') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          memberships: {
            where: { status: 'active' },
            include: { pricingPlan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          bookings: {
            where: { status: { in: ['confirmed', 'checked-in'] } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              classSession: {
                include: { service: true, instructor: true },
              },
            },
          },
          transactions: {
            where: { status: 'paid' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              bookings: true,
              transactions: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({ ok: true, data: clients, total });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Gagal memuat data klien' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, email, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama klien wajib diisi' }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: 'Nomor WhatsApp wajib diisi' }, { status: 400 });
    }

    const sanitizedPhone = phone.trim().replace(/[^0-9+]/g, '');

    const existing = await prisma.client.findFirst({ where: { phone: sanitizedPhone } });
    if (existing) {
      return NextResponse.json({ error: 'Nomor WhatsApp sudah terdaftar untuk klien lain' }, { status: 409 });
    }

    const branch = await prisma.branch.findFirst();
    if (!branch) {
      return NextResponse.json({ error: 'Data cabang studio tidak ditemukan' }, { status: 500 });
    }

    const client = await prisma.client.create({
      data: {
        branchId: branch.id,
        name: name.trim(),
        phone: sanitizedPhone,
        email: email?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true, data: client }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Gagal membuat data klien baru' }, { status: 500 });
  }
}

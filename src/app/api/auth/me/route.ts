import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      branch: {
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
        },
      },
    },
  });

  if (!admin) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user: admin });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const logs = await prisma.notification.findMany({
      orderBy: { sentAt: 'desc' },
      take: 100,
      include: { client: true },
    });

    return NextResponse.json({ ok: true, data: logs });
  } catch (error) {
    console.error('Error fetching notification logs:', error);
    return NextResponse.json({ error: 'Gagal memuat log notifikasi' }, { status: 500 });
  }
}

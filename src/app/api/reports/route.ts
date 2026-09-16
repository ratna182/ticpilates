import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Monthly revenue for last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const paidTransactions = await prisma.transaction.findMany({
      where: {
        status: 'paid',
        createdAt: { gte: sixMonthsAgo },
      },
      select: { amount: true, createdAt: true },
    });

    // Build monthly buckets
    const monthlyRevenue: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      monthlyRevenue[key] = 0;
    }
    for (const tx of paidTransactions) {
      const key = new Date(tx.createdAt).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      if (key in monthlyRevenue) monthlyRevenue[key] += tx.amount;
    }

    // This month vs last month revenue
    const thisMonthRevenue = await prisma.transaction.aggregate({
      where: { status: 'paid', createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: { id: true },
    });
    const lastMonthRevenue = await prisma.transaction.aggregate({
      where: { status: 'paid', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Total clients, bookings, check-ins
    const [totalClients, totalBookings, totalCheckins, newClientsThisMonth] = await Promise.all([
      prisma.client.count(),
      prisma.booking.count({ where: { status: { in: ['confirmed', 'checked-in'] } } }),
      prisma.booking.count({ where: { status: 'checked-in' } }),
      prisma.client.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    // Top services by confirmed booking count
    const bookingsByService = await prisma.classSession.findMany({
      include: {
        service: true,
        bookings: {
          where: { status: { in: ['confirmed', 'checked-in'] } },
        },
      },
    });

    const serviceMap: Record<string, { name: string; count: number }> = {};
    for (const cs of bookingsByService) {
      const key = cs.service.id;
      if (!serviceMap[key]) serviceMap[key] = { name: cs.service.name, count: 0 };
      serviceMap[key].count += cs.bookings.length;
    }
    const topServices = Object.values(serviceMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Attendance per day (last 14 days)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const recentCheckins = await prisma.booking.findMany({
      where: { status: 'checked-in', createdAt: { gte: twoWeeksAgo } },
      select: { createdAt: true },
    });

    const dailyAttendance: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      dailyAttendance[key] = 0;
    }
    for (const b of recentCheckins) {
      const key = new Date(b.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (key in dailyAttendance) dailyAttendance[key]++;
    }

    return NextResponse.json({
      ok: true,
      data: {
        monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
        thisMonthRevenue: thisMonthRevenue._sum.amount || 0,
        lastMonthRevenue: lastMonthRevenue._sum.amount || 0,
        thisMonthTransactions: thisMonthRevenue._count.id,
        totalClients,
        totalBookings,
        totalCheckins,
        newClientsThisMonth,
        topServices,
        dailyAttendance: Object.entries(dailyAttendance).map(([date, count]) => ({ date, count })),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Gagal memuat laporan' }, { status: 500 });
  }
}

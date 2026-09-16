import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Auto cleanup expired pending holds (> 10 minutes)
    await prisma.booking.updateMany({
      where: {
        status: 'pending',
        heldUntil: {
          lt: new Date(),
        },
      },
      data: {
        status: 'cancelled',
      },
    });

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date'); // YYYY-MM-DD
    const serviceType = searchParams.get('type'); // 'group' | 'private'

    const whereClause: any = {
      status: 'scheduled',
      // Only show sessions from beginning of today or selected date
      startTime: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    };

    if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      whereClause.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (serviceType && serviceType !== 'all') {
      whereClause.service = {
        type: serviceType,
      };
    }

    const sessions = await prisma.classSession.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' },
      include: {
        service: true,
        instructor: true,
        bookings: {
          where: {
            status: { in: ['pending', 'confirmed', 'checked-in'] },
          },
          select: {
            id: true,
            status: true,
            heldUntil: true,
          },
        },
      },
    });

    // Get default single pass pricing for reference
    const defaultPricing = await prisma.pricingPlan.findFirst({
      where: { type: 'single', active: true },
      orderBy: { price: 'asc' },
    });

    const defaultPrice = defaultPricing ? defaultPricing.price : 250000;

    const data = sessions.map((s) => {
      // Active bookings count
      const activeBookings = s.bookings.filter(
        (b) =>
          b.status === 'confirmed' ||
          b.status === 'checked-in' ||
          (b.status === 'pending' && b.heldUntil && b.heldUntil > new Date())
      );

      const bookedCount = activeBookings.length;
      const availableSlots = Math.max(0, s.capacity - bookedCount);

      return {
        id: s.id,
        serviceId: s.serviceId,
        serviceName: s.service.name,
        serviceType: s.service.type,
        durationMin: s.service.durationMin,
        description: s.service.description,
        instructorName: s.instructor.name,
        instructorPhoto: s.instructor.photoUrl,
        startTime: s.startTime,
        endTime: s.endTime,
        capacity: s.capacity,
        bookedCount,
        availableSlots,
        isFull: availableSlots <= 0,
        price: defaultPrice,
      };
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('Error fetching public store sessions:', error);
    return NextResponse.json({ error: 'Gagal memuat jadwal sesi kelas' }, { status: 500 });
  }
}

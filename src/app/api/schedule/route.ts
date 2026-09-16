import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Helper to auto-cancel expired pending holds
async function cleanupExpiredHolds() {
  try {
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
  } catch (err) {
    console.error('Error cleaning up expired holds:', err);
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  await cleanupExpiredHolds();

  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date'); // Format: YYYY-MM-DD
    const instructorId = searchParams.get('instructorId');
    const serviceId = searchParams.get('serviceId');
    const status = searchParams.get('status');

    const whereClause: any = {};

    if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      whereClause.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (instructorId && instructorId !== 'all') {
      whereClause.instructorId = instructorId;
    }

    if (serviceId && serviceId !== 'all') {
      whereClause.serviceId = serviceId;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
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
          include: {
            client: true,
            transaction: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Augment with calculated slots
    const formatted = sessions.map((s) => {
      const activeBookings = s.bookings.filter(
        (b) => b.status === 'confirmed' || b.status === 'checked-in' || (b.status === 'pending' && (!b.heldUntil || b.heldUntil > new Date()))
      );
      const bookedCount = activeBookings.length;
      const availableSlots = Math.max(0, s.capacity - bookedCount);

      return {
        ...s,
        bookedCount,
        availableSlots,
        isFull: availableSlots <= 0,
      };
    });

    return NextResponse.json({ ok: true, data: formatted });
  } catch (error) {
    console.error('Error fetching schedule sessions:', error);
    return NextResponse.json({ error: 'Gagal memuat jadwal kelas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { serviceId, instructorId, startTime, endTime, capacity } = body;

    if (!serviceId || !instructorId) {
      return NextResponse.json(
        { error: 'Layanan dan instruktur wajib dipilih' },
        { status: 400 }
      );
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Waktu mulai dan selesai wajib ditentukan' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Format waktu tidak valid' }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'Waktu selesai harus lebih lambat dari waktu mulai' },
        { status: 400 }
      );
    }

    // Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      return NextResponse.json({ error: 'Layanan tidak ditemukan' }, { status: 404 });
    }

    // Verify instructor exists
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      return NextResponse.json({ error: 'Instruktur tidak ditemukan' }, { status: 404 });
    }

    // Check Instructor Conflict (Overlapping session that is not cancelled)
    const conflict = await prisma.classSession.findFirst({
      where: {
        instructorId,
        status: { not: 'cancelled' },
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
      include: {
        service: true,
        instructor: true,
      },
    });

    if (conflict) {
      const conflictStart = new Date(conflict.startTime).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const conflictEnd = new Date(conflict.endTime).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      return NextResponse.json(
        {
          error: `Konflik Jadwal: Instruktur ${conflict.instructor.name} sudah terdaftar mengajar kelas "${conflict.service.name}" pada jam ${conflictStart} - ${conflictEnd} WIB. Silakan pilih instruktur lain atau sesuaikan jam sesi.`,
        },
        { status: 409 }
      );
    }

    const sessionCapacity = capacity ? parseInt(capacity, 10) : service.defaultCapacity;
    if (isNaN(sessionCapacity) || sessionCapacity <= 0) {
      return NextResponse.json(
        { error: 'Kapasitas sesi harus lebih besar dari 0' },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findFirst();
    if (!branch) {
      return NextResponse.json({ error: 'Data cabang studio tidak ditemukan' }, { status: 500 });
    }

    const newSession = await prisma.classSession.create({
      data: {
        branchId: branch.id,
        serviceId,
        instructorId,
        startTime: start,
        endTime: end,
        capacity: sessionCapacity,
        status: 'scheduled',
      },
      include: {
        service: true,
        instructor: true,
      },
    });

    return NextResponse.json({ ok: true, data: newSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating class session:', error);
    return NextResponse.json({ error: 'Gagal membuat sesi kelas baru' }, { status: 500 });
  }
}

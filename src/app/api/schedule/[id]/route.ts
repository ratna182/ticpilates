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
    const classSession = await prisma.classSession.findUnique({
      where: { id },
      include: {
        service: true,
        instructor: true,
        bookings: {
          include: {
            client: true,
            transaction: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: 'Sesi kelas tidak ditemukan' }, { status: 404 });
    }

    const activeBookings = classSession.bookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'checked-in' || (b.status === 'pending' && (!b.heldUntil || b.heldUntil > new Date()))
    );

    return NextResponse.json({
      ok: true,
      data: {
        ...classSession,
        bookedCount: activeBookings.length,
        availableSlots: Math.max(0, classSession.capacity - activeBookings.length),
      },
    });
  } catch (error) {
    console.error('Error fetching session detail:', error);
    return NextResponse.json({ error: 'Gagal memuat detail sesi kelas' }, { status: 500 });
  }
}

export async function PUT(
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
    const { status, capacity, instructorId, startTime, endTime } = body;

    const existing = await prisma.classSession.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Sesi kelas tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {};

    if (status) {
      if (!['scheduled', 'cancelled', 'completed'].includes(status)) {
        return NextResponse.json({ error: 'Status sesi tidak valid' }, { status: 400 });
      }
      updateData.status = status;
    }

    if (capacity !== undefined) {
      const cap = parseInt(capacity, 10);
      if (isNaN(cap) || cap <= 0) {
        return NextResponse.json({ error: 'Kapasitas harus lebih besar dari 0' }, { status: 400 });
      }
      updateData.capacity = cap;
    }

    // If rescheduling or changing instructor, check conflicts
    const targetInstructorId = instructorId || existing.instructorId;
    const targetStartTime = startTime ? new Date(startTime) : existing.startTime;
    const targetEndTime = endTime ? new Date(endTime) : existing.endTime;

    if (startTime || endTime || instructorId) {
      if (targetEndTime <= targetStartTime) {
        return NextResponse.json(
          { error: 'Waktu selesai harus lebih lambat dari waktu mulai' },
          { status: 400 }
        );
      }

      // Check conflict excluding current session
      const conflict = await prisma.classSession.findFirst({
        where: {
          id: { not: id },
          instructorId: targetInstructorId,
          status: { not: 'cancelled' },
          AND: [
            { startTime: { lt: targetEndTime } },
            { endTime: { gt: targetStartTime } },
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
            error: `Konflik Jadwal: Instruktur ${conflict.instructor.name} sudah memiliki sesi "${conflict.service.name}" pada ${conflictStart} - ${conflictEnd} WIB.`,
          },
          { status: 409 }
        );
      }

      updateData.instructorId = targetInstructorId;
      updateData.startTime = targetStartTime;
      updateData.endTime = targetEndTime;
    }

    const updated = await prisma.classSession.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
        instructor: true,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Gagal memperbarui sesi kelas' }, { status: 500 });
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
    const existing = await prisma.classSession.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { in: ['confirmed', 'checked-in'] },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Sesi kelas tidak ditemukan' }, { status: 404 });
    }

    // If session has confirmed/checked-in bookings, do not hard delete; prompt or soft-cancel
    if (existing.bookings.length > 0) {
      const cancelled = await prisma.classSession.update({
        where: { id },
        data: { status: 'cancelled' },
      });
      return NextResponse.json({
        ok: true,
        message: 'Sesi memiliki pesanan klien aktif, status diubah menjadi Dibatalkan (Cancelled)',
        data: cancelled,
      });
    }

    // Delete any orphan pending/cancelled bookings first
    await prisma.booking.deleteMany({
      where: { classSessionId: id },
    });

    await prisma.classSession.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, message: 'Sesi kelas berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Gagal menghapus sesi kelas' }, { status: 500 });
  }
}

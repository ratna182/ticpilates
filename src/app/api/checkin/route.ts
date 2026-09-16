import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { qrCode } = body;

    if (!qrCode?.trim()) {
      return NextResponse.json({ error: 'Kode QR wajib disertakan' }, { status: 400 });
    }

    // Support both full format "TICPILATES:BOOKING:TP-BK-XXXXX" and just the code
    const normalizedCode = qrCode.trim().startsWith('TICPILATES:BOOKING:')
      ? qrCode.trim()
      : `TICPILATES:BOOKING:${qrCode.trim()}`;

    const booking = await prisma.booking.findUnique({
      where: { qrCode: normalizedCode },
      include: {
        client: true,
        classSession: {
          include: { service: true, instructor: true },
        },
        transaction: {
          include: { invoice: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Kode QR tidak ditemukan. Pastikan tiket booking valid.' },
        { status: 404 }
      );
    }

    // Validate session date (must be today)
    const sessionDate = new Date(booking.classSession.startTime);
    const today = new Date();
    const isSameDay =
      sessionDate.getFullYear() === today.getFullYear() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getDate() === today.getDate();

    if (!isSameDay) {
      const sessionDateStr = sessionDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return NextResponse.json(
        {
          error: `Tiket ini untuk sesi pada ${sessionDateStr}. Check-in hanya bisa dilakukan pada hari sesi berlangsung.`,
          booking: {
            clientName: booking.client.name,
            serviceName: booking.classSession.service.name,
            sessionDate: sessionDateStr,
            status: booking.status,
          },
        },
        { status: 422 }
      );
    }

    // Already checked in?
    if (booking.status === 'checked-in') {
      return NextResponse.json(
        {
          error: 'Klien ini sudah check-in sebelumnya untuk sesi ini.',
          booking: {
            clientName: booking.client.name,
            serviceName: booking.classSession.service.name,
            status: booking.status,
          },
        },
        { status: 422 }
      );
    }

    // Must be confirmed to check in
    if (booking.status !== 'confirmed') {
      const statusLabels: Record<string, string> = {
        pending: 'masih menunggu pembayaran',
        cancelled: 'sudah dibatalkan',
        failed: 'pembayaran gagal',
      };
      const label = statusLabels[booking.status] || booking.status;
      return NextResponse.json(
        {
          error: `Check-in tidak dapat dilakukan. Status reservasi: ${label}.`,
          booking: {
            clientName: booking.client.name,
            status: booking.status,
          },
        },
        { status: 422 }
      );
    }

    // Perform check-in
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'checked-in' },
      include: {
        client: true,
        classSession: {
          include: { service: true, instructor: true },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Check-in berhasil!',
      data: {
        clientName: updatedBooking.client.name,
        clientPhone: updatedBooking.client.phone,
        serviceName: updatedBooking.classSession.service.name,
        instructorName: updatedBooking.classSession.instructor.name,
        sessionTime: updatedBooking.classSession.startTime,
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
      },
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    return NextResponse.json({ error: 'Gagal memproses check-in' }, { status: 500 });
  }
}

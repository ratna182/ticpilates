import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, paymentMethod = 'qris' } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'ID Reservasi diperlukan' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        classSession: {
          include: {
            service: true,
            instructor: true,
            branch: true,
          },
        },
        transaction: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Data reservasi tidak ditemukan' }, { status: 404 });
    }

    // Already confirmed? Return existing
    if (booking.status === 'confirmed' || booking.status === 'checked-in') {
      const qrDataUrl = await QRCode.toDataURL(booking.qrCode, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 320,
        color: { dark: '#1C2427', light: '#FFFFFF' },
      });

      return NextResponse.json({
        ok: true,
        message: 'Reservasi sudah berhasil dikonfirmasi sebelumnya.',
        data: {
          booking,
          qrDataUrl,
        },
      });
    }

    // Check expiry
    if (booking.heldUntil && booking.heldUntil < new Date()) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'cancelled' },
      });
      return NextResponse.json(
        {
          error:
            'Batas waktu pembayaran 10 menit telah kedaluwarsa. Kuota kelas telah dilepaskan kembali.',
        },
        { status: 400 }
      );
    }

    // Process payment & confirmation in transaction
    const confirmed = await prisma.$transaction(async (tx) => {
      // 1. Update Transaction
      let transactionId = booking.transactionId;
      let transaction;

      if (transactionId) {
        transaction = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'paid',
            method: paymentMethod,
          },
        });
      } else {
        transaction = await tx.transaction.create({
          data: {
            branchId: booking.classSession.branchId,
            clientId: booking.clientId,
            amount: 250000,
            method: paymentMethod,
            status: 'paid',
          },
        });
        transactionId = transaction.id;
      }

      // 2. Update Booking
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'confirmed',
          transactionId,
        },
        include: {
          client: true,
          classSession: {
            include: {
              service: true,
              instructor: true,
              branch: true,
            },
          },
          transaction: true,
        },
      });

      // 3. Create or find Invoice
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const invoiceNumber = `INV-${datePart}-${booking.id.slice(-6).toUpperCase()}`;

      const invoice = await tx.invoice.upsert({
        where: { transactionId },
        update: {},
        create: {
          transactionId,
          invoiceNumber,
        },
      });

      // 4. Create Notification Log (Simulated WhatsApp confirmation)
      const sessionDateStr = new Date(booking.classSession.startTime).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const sessionTimeStr = new Date(booking.classSession.startTime).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const waMessage = `Halo ${booking.client.name}! Pembayaran Anda telah DITERIMA. Reservasi kelas ${booking.classSession.service.name} di TICPILATES Kemang telah terkonfirmasi untuk hari ${sessionDateStr}, pukul ${sessionTimeStr} WIB bersama Instruktur ${booking.classSession.instructor.name}. Kode Tiket: ${booking.qrCode.replace('TICPILATES:BOOKING:', '')}. Sampai jumpa di studio!`;

      await tx.notification.create({
        data: {
          clientId: booking.clientId,
          channel: 'wa',
          type: 'booking_confirmation',
          message: waMessage,
          status: 'sent',
        },
      });

      return { updatedBooking, invoice, waMessage };
    });

    const qrDataUrl = await QRCode.toDataURL(confirmed.updatedBooking.qrCode, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 360,
      color: { dark: '#1C2427', light: '#FFFFFF' },
    });

    return NextResponse.json({
      ok: true,
      message: 'Pembayaran berhasil dikonfirmasi! Tiket Anda telah aktif.',
      data: {
        booking: confirmed.updatedBooking,
        invoice: confirmed.invoice,
        qrDataUrl,
        waMessage: confirmed.waMessage,
      },
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses konfirmasi pembayaran' },
      { status: 500 }
    );
  }
}

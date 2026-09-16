import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      classSessionId,
      clientName,
      clientPhone,
      clientEmail,
      paymentMethod = 'qris',
    } = body;

    if (!classSessionId) {
      return NextResponse.json({ error: 'Sesi kelas wajib dipilih' }, { status: 400 });
    }
    if (!clientName?.trim()) {
      return NextResponse.json({ error: 'Nama pemesan wajib diisi' }, { status: 400 });
    }
    if (!clientPhone?.trim()) {
      return NextResponse.json({ error: 'Nomor WhatsApp wajib diisi' }, { status: 400 });
    }

    const sanitizedPhone = clientPhone.trim().replace(/[^0-9+]/g, '');

    // Execute atomic booking hold inside Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Auto expire old pending holds
      await tx.booking.updateMany({
        where: {
          classSessionId,
          status: 'pending',
          heldUntil: {
            lt: new Date(),
          },
        },
        data: {
          status: 'cancelled',
        },
      });

      // 2. Fetch session with current bookings
      const session = await tx.classSession.findUnique({
        where: { id: classSessionId },
        include: {
          service: true,
          instructor: true,
          branch: true,
          bookings: {
            where: {
              status: { in: ['pending', 'confirmed', 'checked-in'] },
            },
          },
        },
      });

      if (!session) {
        throw new Error('Sesi kelas tidak ditemukan');
      }

      if (session.status !== 'scheduled') {
        throw new Error('Sesi kelas ini sudah tidak tersedia atau dibatalkan');
      }

      // Count active bookings (confirmed, checked-in, or pending hold)
      const activeBookings = session.bookings.filter(
        (b) =>
          b.status === 'confirmed' ||
          b.status === 'checked-in' ||
          (b.status === 'pending' && b.heldUntil && b.heldUntil > new Date())
      );

      if (activeBookings.length >= session.capacity) {
        throw new Error('Mohon maaf, kuota sesi kelas ini baru saja terisi penuh.');
      }

      // 3. Find or Create Client
      let client = await tx.client.findFirst({
        where: {
          phone: sanitizedPhone,
        },
      });

      if (!client) {
        client = await tx.client.create({
          data: {
            branchId: session.branchId,
            name: clientName.trim(),
            phone: sanitizedPhone,
            email: clientEmail?.trim() || null,
          },
        });
      } else {
        // Update name/email if provided
        client = await tx.client.update({
          where: { id: client.id },
          data: {
            name: clientName.trim(),
            ...(clientEmail ? { email: clientEmail.trim() } : {}),
          },
        });
      }

      // 4. Determine Price
      const defaultPricing = await tx.pricingPlan.findFirst({
        where: { type: 'single', active: true },
        orderBy: { price: 'asc' },
      });
      const price = defaultPricing ? defaultPricing.price : 250000;

      // 5. Generate unique booking code & QR Code string
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const bookingCode = `TP-BK-${Date.now().toString().slice(-4)}${randomSuffix}`;
      const qrCodeString = `TICPILATES:BOOKING:${bookingCode}`;

      // 6. Hold timer (10 minutes)
      const heldUntil = new Date(Date.now() + 10 * 60 * 1000);

      // 7. Create Pending Transaction
      const transaction = await tx.transaction.create({
        data: {
          branchId: session.branchId,
          clientId: client.id,
          amount: price,
          method: paymentMethod,
          status: 'pending',
          pricingPlanId: defaultPricing?.id || null,
        },
      });

      // 8. Create Pending Booking
      const booking = await tx.booking.create({
        data: {
          clientId: client.id,
          classSessionId: session.id,
          status: 'pending',
          qrCode: qrCodeString,
          heldUntil,
          transactionId: transaction.id,
        },
        include: {
          client: true,
          classSession: {
            include: {
              service: true,
              instructor: true,
            },
          },
          transaction: true,
        },
      });

      return { booking, transaction, session, bookingCode };
    });

    // Generate QR Code image data URL for instant display
    const qrDataUrl = await QRCode.toDataURL(result.booking.qrCode, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#1C2427',
        light: '#FFFFFF',
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        bookingId: result.booking.id,
        bookingCode: result.bookingCode,
        client: result.booking.client,
        session: result.booking.classSession,
        transaction: result.transaction,
        heldUntil: result.booking.heldUntil,
        qrCode: result.booking.qrCode,
        qrDataUrl,
        expiresInSeconds: 600,
      },
    });
  } catch (error: any) {
    console.error('Error creating booking hold:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses reservasi kelas' },
      { status: 400 }
    );
  }
}

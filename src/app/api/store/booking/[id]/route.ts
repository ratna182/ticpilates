import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { id },
          { qrCode: id },
          { qrCode: `TICPILATES:BOOKING:${id}` },
        ],
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
        transaction: {
          include: {
            invoice: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Tiket reservasi tidak ditemukan' }, { status: 404 });
    }

    const qrDataUrl = await QRCode.toDataURL(booking.qrCode, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 360,
      color: { dark: '#1C2427', light: '#FFFFFF' },
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...booking,
        bookingCode: booking.qrCode.replace('TICPILATES:BOOKING:', ''),
        qrDataUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching public booking:', error);
    return NextResponse.json({ error: 'Gagal memuat detail tiket' }, { status: 500 });
  }
}

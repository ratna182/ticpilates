import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import {
  Sparkles,
  MapPin,
  Clock,
  User,
  Calendar,
  ShieldCheck,
  Printer,
  ExternalLink,
  Phone,
  ArrowLeft,
} from 'lucide-react';
import PrintButton from '@/components/store/PrintButton';

export const dynamic = 'force-dynamic';

export default async function BookingTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ id }, { qrCode: id }, { qrCode: `TICPILATES:BOOKING:${id}` }],
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
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FDF2F2] text-[#D92D20] flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          !
        </div>
        <h1 className="text-xl font-bold text-[#1C2427]">Tiket Tidak Ditemukan</h1>
        <p className="text-xs text-[#667085] mt-1 max-w-sm">
          Kode tiket atau ID reservasi tidak valid atau sudah kedaluwarsa.
        </p>
        <Link
          href="/store"
          className="mt-6 px-4 py-2 bg-[#2D6A4F] text-white text-xs font-semibold rounded-xl"
        >
          Kembali ke Online Store
        </Link>
      </div>
    );
  }

  // Generate QR Code data URL
  const qrDataUrl = await QRCode.toDataURL(booking.qrCode, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
    color: {
      dark: '#1C2427',
      light: '#FFFFFF',
    },
  });

  const session = booking.classSession;
  const bookingCode = booking.qrCode.replace('TICPILATES:BOOKING:', '');

  const dateStr = new Date(session.startTime).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const startTimeStr = new Date(session.startTime).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTimeStr = new Date(session.endTime).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 flex flex-col items-center justify-center">
      {/* Top Back Navigation */}
      <div className="max-w-md w-full mb-4 flex items-center justify-between">
        <Link
          href="/store"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#475467] hover:text-[#1C2427]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Store</span>
        </Link>

        <PrintButton />
      </div>

      {/* Boarding Pass Ticket Container */}
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#EAE6DF] shadow-xl overflow-hidden relative">
        {/* Ticket Header */}
        <div className="bg-[#1C2427] text-white p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-sm">
                TP
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight">TICPILATES</div>
                <div className="text-[10px] text-[#52B788]">Studio Kemang Jakarta</div>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                booking.status === 'checked-in'
                  ? 'bg-[#EBF7EE] text-[#2D6A4F]'
                  : booking.status === 'confirmed'
                  ? 'bg-[#EBF7EE] text-[#2D6A4F]'
                  : 'bg-[#FDF4E7] text-[#C08A3E]'
              }`}
            >
              {booking.status === 'checked-in'
                ? 'CHECKED-IN'
                : booking.status === 'confirmed'
                ? 'CONFIRMED'
                : 'PENDING'}
            </span>
          </div>

          <div className="mt-6">
            <span className="text-[10px] text-[#98A2B3] uppercase tracking-wider font-semibold">
              Kelas Terpilih
            </span>
            <h2 className="text-xl font-extrabold text-white mt-0.5">{session.service.name}</h2>
            <p className="text-xs text-[#52B788] font-medium mt-0.5">
              Instruktur: Coach {session.instructor.name}
            </p>
          </div>
        </div>

        {/* Notched perforated line */}
        <div className="relative flex items-center justify-between px-3 py-1 bg-white">
          <div className="w-4 h-8 rounded-r-full bg-[#FAF8F5] -ml-5 border-r border-[#EAE6DF]" />
          <div className="w-full border-t-2 border-dashed border-[#EAE6DF] mx-2" />
          <div className="w-4 h-8 rounded-l-full bg-[#FAF8F5] -mr-5 border-l border-[#EAE6DF]" />
        </div>

        {/* Ticket Body with QR Code */}
        <div className="p-6 space-y-6">
          {/* QR Code Container */}
          <div className="text-center">
            <div className="w-52 h-52 mx-auto p-3 bg-white rounded-3xl border-2 border-[#1C2427]/10 shadow-sm flex items-center justify-center">
              <img src={qrDataUrl} alt="QR Code Tiket" className="w-full h-full object-contain" />
            </div>

            <div className="mt-3">
              <div className="text-[10px] text-[#667085] uppercase tracking-wider font-semibold">
                Kode Reservasi Klien
              </div>
              <div className="text-lg font-mono font-extrabold text-[#1C2427] tracking-widest mt-0.5">
                {bookingCode}
              </div>
            </div>

            <p className="text-[11px] text-[#667085] mt-1">
              Tunjukkan QR Code ini kepada resepsionis saat tiba di studio untuk check-in otomatis.
            </p>
          </div>

          {/* Details Grid */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#667085]">
                <User className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Nama Klien:</span>
              </div>
              <span className="font-bold text-[#1C2427]">{booking.client.name}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#667085]">
                <Calendar className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Hari & Tanggal:</span>
              </div>
              <span className="font-semibold text-[#1C2427]">{dateStr}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#667085]">
                <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Waktu Sesi:</span>
              </div>
              <span className="font-bold text-[#2D6A4F]">
                {startTimeStr} - {endTimeStr} WIB ({session.service.durationMin} Menit)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#667085]">
                <MapPin className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Lokasi Studio:</span>
              </div>
              <span className="font-semibold text-[#1C2427]">TICPILATES Kemang</span>
            </div>

            {booking.transaction?.invoice && (
              <div className="flex items-center justify-between pt-2 border-t border-[#EAE6DF]">
                <span className="text-[#667085]">No. Invoice:</span>
                <span className="font-mono text-[#1C2427]">{booking.transaction.invoice.invoiceNumber}</span>
              </div>
            )}
          </div>

          {/* Studio Address Note */}
          <div className="text-center text-[11px] text-[#667085] leading-relaxed">
            <span className="font-semibold text-[#1C2427]">TICPILATES Kemang Studio</span>
            <br />
            Jl. Menteng III No.1, Pd. Ranji, Kec. Ciputat Tim., Kota Tangerang Selatan, Banten 15412 (Telp: 0812-9876-5432)
            <br />
            Harap tiba 10 menit sebelum kelas dimulai mengenakan grip socks.
          </div>
        </div>
      </div>
    </div>
  );
}

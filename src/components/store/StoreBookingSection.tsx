'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  QrCode,
  CreditCard,
  Printer,
  ExternalLink,
  MessageSquare,
  Timer,
  X,
  ChevronRight,
} from 'lucide-react';

interface PublicSession {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceType: 'group' | 'private';
  durationMin: number;
  description?: string | null;
  instructorName: string;
  instructorPhoto?: string | null;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  availableSlots: number;
  isFull: boolean;
  price: number;
}

export default function StoreBookingSection() {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Flow State
  const [activeSession, setActiveSession] = useState<PublicSession | null>(null);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);

  // Step 1 Form Data
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Step 2 Hold Data
  const [heldBooking, setHeldBooking] = useState<any | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);
  const [payLoading, setPayLoading] = useState(false);

  // Step 3 Confirmation Data
  const [confirmedData, setConfirmedData] = useState<any | null>(null);

  // Quick Date Helpers
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const dayAfterTomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }, []);

  // Fetch Public Sessions
  const fetchSessions = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/store/sessions?date=${date}`);
      const json = await res.json();
      if (res.ok && json.ok) {
        setSessions(json.data);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(selectedDate);
  }, [selectedDate]);

  // Hold Countdown Timer Effect
  useEffect(() => {
    if (bookingStep !== 2 || !heldBooking) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setBookingError('Waktu hold 10 menit telah habis. Kuota telah dikembalikan.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [bookingStep, heldBooking]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Open Modal
  const startBooking = (session: PublicSession) => {
    setActiveSession(session);
    setBookingStep(1);
    setBookingError(null);
    setHeldBooking(null);
    setConfirmedData(null);
    setSecondsRemaining(600);
  };

  // Close Modal
  const closeModal = () => {
    setActiveSession(null);
    setBookingStep(1);
    setBookingError(null);
    fetchSessions(selectedDate);
  };

  // Step 1 -> Step 2: Lock Slot (Hold)
  const handleHoldBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await fetch('/api/store/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classSessionId: activeSession.id,
          clientName,
          clientPhone,
          clientEmail,
          paymentMethod: 'qris',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        setBookingError(json.error || 'Gagal mereservasi slot kelas.');
        setBookingLoading(false);
        return;
      }

      setHeldBooking(json.data);
      setSecondsRemaining(json.data.expiresInSeconds || 600);
      setBookingStep(2);
    } catch (err: any) {
      setBookingError('Terjadi kesalahan koneksi saat memproses reservasi.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Step 2 -> Step 3: Instant Payment Simulation Callback
  const handleConfirmPayment = async () => {
    if (!heldBooking) return;

    setPayLoading(true);
    setBookingError(null);

    try {
      const res = await fetch('/api/store/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: heldBooking.bookingId,
          paymentMethod: 'qris',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        setBookingError(json.error || 'Gagal memproses pembayaran');
        setPayLoading(false);
        return;
      }

      setConfirmedData(json.data);
      setBookingStep(3);
    } catch (err) {
      setBookingError('Terjadi kesalahan jaringan.');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Section Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7EE] text-[#2D6A4F] text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Jadwal Real-Time Studio</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#1C2427] tracking-tight">
            Pilih Jadwal Kelas & Booking Mandiri
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Reservasi kuota instan tanpa perlu mendaftar akun. Tiket digital ber-QR Code langsung aktif di ponsel Anda.
          </p>
        </div>

        {/* Date Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`text-xs px-3.5 py-2 rounded-xl font-semibold border transition-all ${
              selectedDate === todayStr
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-xs'
                : 'bg-white text-[#475467] border-[#EAE6DF] hover:bg-[#FAF8F5]'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setSelectedDate(tomorrowStr)}
            className={`text-xs px-3.5 py-2 rounded-xl font-semibold border transition-all ${
              selectedDate === tomorrowStr
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-xs'
                : 'bg-white text-[#475467] border-[#EAE6DF] hover:bg-[#FAF8F5]'
            }`}
          >
            Besok
          </button>
          <button
            onClick={() => setSelectedDate(dayAfterTomorrowStr)}
            className={`text-xs px-3.5 py-2 rounded-xl font-semibold border transition-all ${
              selectedDate === dayAfterTomorrowStr
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-xs'
                : 'bg-white text-[#475467] border-[#EAE6DF] hover:bg-[#FAF8F5]'
            }`}
          >
            Lusa
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#EAE6DF] bg-white text-[#1C2427] focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Session Cards Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE6DF]">
          <div className="inline-block w-8 h-8 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-[#667085]">Memuat jadwal kelas yang tersedia...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-[#D1C9BE]">
          <Calendar className="w-10 h-10 text-[#C08A3E] mx-auto mb-2 opacity-60" />
          <h3 className="text-base font-bold text-[#1C2427]">Belum Ada Sesi Kelas pada Tanggal Ini</h3>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            Silakan pilih tanggal lain untuk melihat jadwal kelas Reformer, Tower, atau Mat Pilates kami.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map((session) => {
            const startTimeStr = new Date(session.startTime).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const endTimeStr = new Date(session.endTime).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={session.id}
                className={`bg-white rounded-3xl p-6 border transition-all subtle-shadow flex flex-col justify-between ${
                  session.isFull
                    ? 'border-[#EAE6DF] opacity-80'
                    : 'border-[#EAE6DF] hover:border-[#2D6A4F]/40 card-hover'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg ${
                        session.serviceType === 'group'
                          ? 'bg-[#EBF7EE] text-[#2D6A4F]'
                          : 'bg-[#FDF4E7] text-[#C08A3E]'
                      }`}
                    >
                      {session.serviceType === 'group' ? 'Group Class' : 'Private 1-on-1'}
                    </span>

                    {/* Slot Availability Pill */}
                    {session.isFull ? (
                      <span className="text-[10px] font-bold bg-[#FDF2F2] text-[#D92D20] px-2.5 py-0.5 rounded-lg">
                        Penuh (Full)
                      </span>
                    ) : session.availableSlots <= 2 ? (
                      <span className="text-[10px] font-bold bg-[#FEF3F2] text-[#B42318] px-2.5 py-0.5 rounded-lg animate-pulse">
                        Sisa {session.availableSlots} Slot!
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-[#EBF7EE] text-[#2D6A4F] px-2.5 py-0.5 rounded-lg">
                        {session.availableSlots} Slot Tersedia
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-[#1C2427] mb-1">{session.serviceName}</h3>

                  {/* Instructor */}
                  <div className="flex items-center gap-2 text-xs text-[#475467] mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#EAE6DF] overflow-hidden flex items-center justify-center text-[9px] font-bold text-[#475467]">
                      {session.instructorPhoto ? (
                        <img
                          src={session.instructorPhoto}
                          alt={session.instructorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        session.instructorName[0]
                      )}
                    </div>
                    <span>Coach {session.instructorName}</span>
                  </div>

                  {/* Time & Duration Info Box */}
                  <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE6DF] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#1C2427]">
                      <Clock className="w-4 h-4 text-[#2D6A4F]" />
                      <span>
                        {startTimeStr} - {endTimeStr} WIB
                      </span>
                    </div>
                    <span className="text-[11px] text-[#667085] font-medium">
                      {session.durationMin} Menit
                    </span>
                  </div>
                </div>

                {/* Bottom Price & Booking CTA */}
                <div className="mt-5 pt-4 border-t border-[#F2EFE9] flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-[#667085]">Mulai Dari</div>
                    <div className="text-sm font-extrabold text-[#1C2427]">
                      {formatIDR(session.price)}
                    </div>
                  </div>

                  <button
                    onClick={() => startBooking(session)}
                    disabled={session.isFull}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      session.isFull
                        ? 'bg-[#F2F4F7] text-[#98A2B3] cursor-not-allowed'
                        : 'bg-[#2D6A4F] hover:bg-[#1E4633] text-white'
                    }`}
                  >
                    <span>{session.isFull ? 'Habis' : 'Booking Slot'}</span>
                    {!session.isFull && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3-STEP INTERACTIVE BOOKING MODAL */}
      {activeSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#EAE6DF] shadow-2xl my-8 space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-[#EBF7EE] text-[#2D6A4F]">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-[#1C2427]">
                    {bookingStep === 1
                      ? 'Konfirmasi Pemesanan Kelas'
                      : bookingStep === 2
                      ? 'Selesaikan Pembayaran Instan'
                      : 'Tiket Reservasi Resmi'}
                  </h3>
                </div>
                <div className="text-[11px] text-[#667085] mt-0.5">
                  Langkah {bookingStep} dari 3 • Studio Kemang, Jakarta Selatan
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-[#667085] hover:text-[#1C2427] hover:bg-[#FAF8F5] rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error notice */}
            {bookingError && (
              <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#FECDCA] text-xs font-semibold text-[#D92D20] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* STEP 1: Client Data Input */}
            {bookingStep === 1 && (
              <form onSubmit={handleHoldBooking} className="space-y-4">
                {/* Session Summary Card */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-1.5">
                  <div className="text-xs font-bold text-[#1C2427]">{activeSession.serviceName}</div>
                  <div className="text-[11px] text-[#667085] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>
                      {new Date(activeSession.startTime).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      •{' '}
                      {new Date(activeSession.startTime).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </span>
                  </div>
                  <div className="text-[11px] text-[#475467] font-medium">
                    Coach {activeSession.instructorName} • Sisa {activeSession.availableSlots} slot
                  </div>
                </div>

                {/* Form Fields */}
                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1">
                    Nama Lengkap Pemesan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sarah Nadia"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] bg-white text-[#1C2427] focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1">
                    Nomor WhatsApp Aktif *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] bg-white text-[#1C2427] focus:outline-none focus:border-[#2D6A4F]"
                  />
                  <span className="text-[10px] text-[#667085] mt-1 block">
                    Tiket ber-QR code dan konfirmasi jadwal akan dikirimkan ke nomor ini.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1">
                    Alamat Email (Opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] bg-white text-[#1C2427] focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>

                {/* Price summary */}
                <div className="pt-2 border-t border-[#EAE6DF] flex items-center justify-between text-xs">
                  <span className="text-[#667085]">Total Biaya (Single Pass):</span>
                  <span className="text-base font-extrabold text-[#1C2427]">
                    {formatIDR(activeSession.price)}
                  </span>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold text-[#667085] hover:bg-[#FAF8F5] rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {bookingLoading ? (
                      'Mengunci Slot...'
                    ) : (
                      <>
                        <span>Lanjut ke Pembayaran</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Hold Countdown & Instant Mock Payment Gateway */}
            {bookingStep === 2 && heldBooking && (
              <div className="space-y-4">
                {/* Hold Timer Alert Banner */}
                <div className="p-3.5 rounded-2xl bg-[#FFF9F2] border border-[#FEE4C8] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-[#C08A3E] animate-spin" />
                    <div>
                      <div className="text-xs font-bold text-[#1C2427]">Slot Anda Telah Dikunci!</div>
                      <div className="text-[10px] text-[#667085]">
                        Selesaikan pembayaran sebelum batas waktu habis.
                      </div>
                    </div>
                  </div>
                  <div className="text-base font-mono font-extrabold text-[#C08A3E]">
                    {formatTimer(secondsRemaining)}
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-2 text-xs">
                  <div className="flex justify-between text-[#667085]">
                    <span>Kode Reservasi:</span>
                    <span className="font-mono font-bold text-[#1C2427]">
                      {heldBooking.bookingCode}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#667085]">
                    <span>Nama Klien:</span>
                    <span className="font-semibold text-[#1C2427]">{clientName}</span>
                  </div>
                  <div className="flex justify-between text-[#667085]">
                    <span>Kelas Pilates:</span>
                    <span className="font-semibold text-[#1C2427]">{activeSession.serviceName}</span>
                  </div>
                  <div className="pt-2 border-t border-[#EAE6DF] flex justify-between items-center">
                    <span className="font-bold text-[#1C2427]">Total Pembayaran:</span>
                    <span className="text-base font-extrabold text-[#2D6A4F]">
                      {formatIDR(heldBooking.transaction?.amount || activeSession.price)}
                    </span>
                  </div>
                </div>

                {/* Simulated QRIS Box */}
                <div className="p-5 rounded-2xl border-2 border-dashed border-[#2D6A4F]/40 bg-white text-center space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center justify-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>QRIS Instan (Semua Bank / E-Wallet)</span>
                  </div>

                  {heldBooking.qrDataUrl && (
                    <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl border border-[#EAE6DF] shadow-xs flex items-center justify-center">
                      <img
                        src={heldBooking.qrDataUrl}
                        alt="QR Code Pembayaran"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="text-[11px] text-[#667085]">
                    Scan QRIS di atas dengan BCA Mobile, GoPay, OVO, Livin, atau ShopeePay.
                  </div>

                  {/* Simulator Button */}
                  <button
                    onClick={handleConfirmPayment}
                    disabled={payLoading || secondsRemaining <= 0}
                    className="w-full py-2.5 px-4 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {payLoading ? (
                      'Memverifikasi Pembayaran...'
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>⚡ Simulasikan Pembayaran Berhasil (Instant Gateway)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Confirmed Ticket & QR Code */}
            {bookingStep === 3 && confirmedData && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <div className="w-12 h-12 bg-[#EBF7EE] text-[#2D6A4F] rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-[#1C2427]">Reservasi Dikonfirmasi!</h4>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Tiket digital Pilates Anda telah aktif. Tunjukkan QR Code saat tiba di studio.
                  </p>
                </div>

                {/* Digital Ticket Card */}
                <div className="bg-[#FAF8F5] rounded-3xl p-5 border border-[#EAE6DF] space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-[#2D6A4F] text-white text-[10px] font-bold rounded-bl-xl uppercase tracking-wider">
                    CONFIRMED
                  </div>

                  <div>
                    <div className="text-base font-extrabold text-[#1C2427]">
                      {confirmedData.booking.classSession.service.name}
                    </div>
                    <div className="text-xs text-[#667085] mt-0.5">
                      Coach {confirmedData.booking.classSession.instructor.name} • TICPILATES Kemang
                    </div>
                  </div>

                  {/* High-res QR code image */}
                  {confirmedData.qrDataUrl && (
                    <div className="w-48 h-48 mx-auto p-3 bg-white rounded-2xl border border-[#EAE6DF] shadow-xs flex items-center justify-center">
                      <img
                        src={confirmedData.qrDataUrl}
                        alt="Tiket QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="text-center">
                    <div className="text-[10px] text-[#667085] uppercase tracking-wider">
                      Kode Tiket Masuk
                    </div>
                    <div className="text-sm font-mono font-extrabold text-[#2D6A4F]">
                      {confirmedData.booking.qrCode.replace('TICPILATES:BOOKING:', '')}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EAE6DF] space-y-1 text-xs text-[#475467]">
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Nama Klien:</span>
                      <span className="font-semibold text-[#1C2427]">{confirmedData.booking.client.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">No. WhatsApp:</span>
                      <span className="font-semibold text-[#1C2427]">{confirmedData.booking.client.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Jadwal:</span>
                      <span className="font-semibold text-[#1C2427]">
                        {new Date(confirmedData.booking.classSession.startTime).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">No. Invoice:</span>
                      <span className="font-mono text-[#1C2427]">{confirmedData.invoice?.invoiceNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <Link
                    href={`/booking/${confirmedData.booking.id}`}
                    target="_blank"
                    className="w-full py-2.5 px-4 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Halaman Tiket Digital Penuh</span>
                  </Link>

                  <button
                    onClick={closeModal}
                    className="w-full py-2 px-4 bg-white border border-[#EAE6DF] text-[#475467] hover:bg-[#FAF8F5] text-xs font-semibold rounded-xl transition-all"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

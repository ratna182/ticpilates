'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  QrCode, CheckCircle2, XCircle, AlertCircle, Loader2,
  Camera, Keyboard, RotateCcw, User, Dumbbell, Clock,
} from 'lucide-react';

type ScanResult = {
  ok: boolean;
  message?: string;
  error?: string;
  data?: {
    clientName: string;
    clientPhone: string;
    serviceName: string;
    instructorName: string;
    sessionTime: string;
    bookingId: string;
    status: string;
  };
  booking?: {
    clientName?: string;
    serviceName?: string;
    sessionDate?: string;
    status?: string;
  };
};

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function ScanCustomerPage() {
  const [mode, setMode] = useState<'idle' | 'manual' | 'camera'>('idle');
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submitCheckin = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: code.trim() }),
      });
      const json = await res.json();
      setResult(json);
    } catch {
      setResult({ ok: false, error: 'Gagal terhubung ke server. Periksa koneksi internet.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCheckin(manualCode);
  };

  const reset = () => {
    setResult(null);
    setManualCode('');
    setMode('idle');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-[#1C2427] flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#2D6A4F]" />
          Scan Customer — QR Check-in
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Validasi kehadiran klien secara instan dengan kode QR tiket booking
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-[#EAE6DF] overflow-hidden">
        {/* Idle / Mode Select */}
        {mode === 'idle' && !result && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#EBF7EE] text-[#2D6A4F] flex items-center justify-center mx-auto mb-5 border border-[#D8F3DC]">
              <QrCode className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-extrabold text-[#1C2427] mb-2">Pilih Metode Check-in</h2>
            <p className="text-xs text-[#667085] mb-7 max-w-xs mx-auto leading-relaxed">
              Gunakan kamera untuk scan QR Code dari tiket klien, atau masukkan kode booking secara manual.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto">
              <button
                onClick={() => setMode('manual')}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-[#EAE6DF] hover:border-[#2D6A4F] bg-[#FAF8F5] hover:bg-[#F0FAF4] transition-all cursor-pointer group"
              >
                <Keyboard className="w-6 h-6 text-[#98A2B3] group-hover:text-[#2D6A4F] transition-colors" />
                <div className="text-xs font-bold text-[#1C2427]">Input Manual</div>
                <div className="text-[10px] text-[#98A2B3]">Ketik kode booking</div>
              </button>
              <button
                onClick={() => setMode('camera')}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-[#EAE6DF] hover:border-[#2D6A4F] bg-[#FAF8F5] hover:bg-[#F0FAF4] transition-all cursor-pointer group"
              >
                <Camera className="w-6 h-6 text-[#98A2B3] group-hover:text-[#2D6A4F] transition-colors" />
                <div className="text-xs font-bold text-[#1C2427]">Kamera QR Scan</div>
                <div className="text-[10px] text-[#98A2B3]">Gunakan kamera device</div>
              </button>
            </div>
          </div>
        )}

        {/* Manual Input Mode */}
        {mode === 'manual' && !result && (
          <div className="p-8">
            <button
              onClick={() => setMode('idle')}
              className="flex items-center gap-1.5 text-xs text-[#667085] hover:text-[#2D6A4F] mb-5 cursor-pointer transition-colors"
            >
              ← Kembali
            </button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#EBF7EE] text-[#2D6A4F] flex items-center justify-center mx-auto mb-3">
                <Keyboard className="w-7 h-7" />
              </div>
              <h2 className="text-base font-extrabold text-[#1C2427]">Masukkan Kode Booking</h2>
              <p className="text-xs text-[#667085] mt-1">Format: TP-BK-XXXXXX atau scan langsung dari tiket</p>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                ref={inputRef}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="TP-BK-123ABCDE"
                autoFocus
                className="w-full px-4 py-4 text-center text-lg font-mono font-bold bg-[#FAF8F5] border-2 border-[#EAE6DF] rounded-2xl focus:outline-none focus:border-[#2D6A4F] text-[#1C2427] tracking-widest uppercase"
              />
              <button
                type="submit"
                disabled={loading || !manualCode.trim()}
                className="w-full py-3.5 bg-[#2D6A4F] hover:bg-[#1E4633] disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Memvalidasi...</>
                ) : (
                  <><QrCode className="w-5 h-5" /> Validasi Check-in</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Camera Mode */}
        {mode === 'camera' && !result && (
          <div className="p-8 text-center">
            <button
              onClick={() => setMode('idle')}
              className="flex items-center gap-1.5 text-xs text-[#667085] hover:text-[#2D6A4F] mb-5 cursor-pointer transition-colors"
            >
              ← Kembali
            </button>
            {/* Camera scanner area */}
            <div className="relative w-full aspect-square max-w-xs mx-auto mb-5 rounded-2xl overflow-hidden bg-[#1C2427] flex items-center justify-center border-4 border-[#2D6A4F]">
              {/* Scanning overlay */}
              <div className="absolute inset-4 border-2 border-white/40 rounded-xl" />
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#D8F3DC] rounded-tl" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#D8F3DC] rounded-tr" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#D8F3DC] rounded-bl" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#D8F3DC] rounded-br" />
              <div className="text-center text-white/70 text-xs p-8">
                <Camera className="w-10 h-10 mx-auto mb-3 text-white/40" />
                <div className="font-semibold text-white/80 mb-1">Kamera QR Scanner</div>
                <div className="text-[11px] leading-relaxed mb-4">
                  Fitur scan kamera memerlukan library js-qr atau zxing yang terintegrasi dengan komponen kamera browser (getUserMedia API).
                </div>
                <div className="text-[10px] text-white/50">
                  Untuk MVP: gunakan mode Input Manual atau hardware barcode scanner USB yang mengemulasi keyboard
                </div>
              </div>
            </div>
            <p className="text-xs text-[#667085] mb-4">
              Arahkan kamera ke QR Code pada tiket klien
            </p>
            <button
              onClick={() => setMode('manual')}
              className="px-4 py-2 rounded-xl border border-[#EAE6DF] text-xs font-semibold text-[#475467] hover:bg-[#FAF8F5] cursor-pointer transition-all"
            >
              Beralih ke Input Manual
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#EBF7EE] text-[#2D6A4F] flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="text-base font-bold text-[#1C2427]">Memvalidasi Tiket...</div>
            <div className="text-xs text-[#667085] mt-1">Sedang mencocokkan kode dengan database</div>
          </div>
        )}

        {/* Result – SUCCESS */}
        {result?.ok && result.data && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-3">
              Check-in Berhasil!
            </div>
            <h2 className="text-xl font-extrabold text-[#1C2427] mb-1">{result.data.clientName}</h2>
            <div className="text-sm text-[#667085] mb-5">{result.data.clientPhone}</div>

            <div className="bg-[#F0FAF4] border border-[#D8F3DC] rounded-2xl p-5 text-left space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EBF7EE] text-[#2D6A4F] flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-[#98A2B3] font-semibold uppercase tracking-wider">Kelas</div>
                  <div className="text-sm font-bold text-[#1C2427]">{result.data.serviceName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EBF7EE] text-[#2D6A4F] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-[#98A2B3] font-semibold uppercase tracking-wider">Instruktur</div>
                  <div className="text-sm font-bold text-[#1C2427]">{result.data.instructorName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EBF7EE] text-[#2D6A4F] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-[#98A2B3] font-semibold uppercase tracking-wider">Jadwal</div>
                  <div className="text-sm font-bold text-[#1C2427]">
                    {formatDate(result.data.sessionTime)} — {formatTime(result.data.sessionTime)} WIB
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full py-3 rounded-2xl bg-[#2D6A4F] hover:bg-[#1E4633] text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Scan Klien Berikutnya
            </button>
          </div>
        )}

        {/* Result – ERROR */}
        {result && !result.ok && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <XCircle className="w-10 h-10" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200 mb-3">
              Check-in Ditolak
            </div>
            <h2 className="text-base font-extrabold text-[#1C2427] mb-2">Validasi Gagal</h2>
            <p className="text-sm text-[#667085] leading-relaxed mb-5 max-w-sm mx-auto">
              {result.error}
            </p>

            {result.booking && (
              <div className="bg-[#FFF9F0] border border-[#FDECD2] rounded-2xl p-4 text-left text-xs text-[#475467] mb-5 space-y-1">
                {result.booking.clientName && <div><span className="font-semibold">Klien:</span> {result.booking.clientName}</div>}
                {result.booking.serviceName && <div><span className="font-semibold">Kelas:</span> {result.booking.serviceName}</div>}
                {result.booking.sessionDate && <div><span className="font-semibold">Tanggal Sesi:</span> {result.booking.sessionDate}</div>}
                {result.booking.status && <div><span className="font-semibold">Status:</span> {result.booking.status}</div>}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-2.5 rounded-xl border border-[#EAE6DF] text-xs font-semibold text-[#475467] hover:bg-[#FAF8F5] cursor-pointer transition-all"
              >
                Kembali ke Awal
              </button>
              <button
                onClick={() => { setResult(null); setManualCode(''); }}
                className="flex-1 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Coba Lagi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tips Card */}
      {mode === 'idle' && !result && (
        <div className="bg-[#FFF9F0] border border-[#FDECD2] rounded-2xl p-4">
          <div className="text-xs font-bold text-[#C08A3E] mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> Tips Penggunaan
          </div>
          <ul className="text-xs text-[#475467] space-y-1.5 leading-relaxed">
            <li>• Check-in <strong>hanya bisa</strong> dilakukan pada hari sesi berlangsung</li>
            <li>• Tiket klien harus berstatus <strong>Terkonfirmasi</strong> (sudah bayar)</li>
            <li>• Satu kode QR hanya bisa di-scan <strong>satu kali</strong> (anti double check-in)</li>
            <li>• Gunakan <strong>hardware barcode scanner USB</strong> yang mengemulasi keyboard untuk pengalaman resepsionis terbaik</li>
          </ul>
        </div>
      )}
    </div>
  );
}

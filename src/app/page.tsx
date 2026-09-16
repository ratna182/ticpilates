import React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, ArrowRight, ShieldCheck, MapPin, Store, Check, Heart } from 'lucide-react';

export default function RootHomePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between">
      {/* Navbar */}
      <header className="px-6 py-5 border-b border-[#EAE6DF] bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              TP
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#1C2427]">TICPILATES</span>
              <span className="text-[10px] text-[#667085] block font-medium">Studio Kemang, Jakarta</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/store"
              className="px-4 py-2 text-xs font-semibold text-[#1C2427] hover:text-[#2D6A4F] transition-colors"
            >
              Lihat Jadwal Kelas
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Portal Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF7EE] text-[#2D6A4F] border border-[#D8F3DC] text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sistem Manajemen Studio & Booking Mandiri Klien</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-[#1C2427] tracking-tight max-w-3xl mx-auto leading-[1.15]">
          Eksklusif, Teratur, dan Terhubung untuk Studio Pilates Anda
        </h1>

        <p className="text-sm md:text-base text-[#667085] mt-6 max-w-2xl mx-auto leading-relaxed">
          TICPILATES menyatukan seluruh siklus operasional studio Pilates Anda: mulai dari kalender jadwal sesi, kuota kelas real-time, booking mandiri klien tanpa ribet, hingga check-in instan dengan QR Code.
        </p>

        {/* Portal Action Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
          {/* Admin Card */}
          <div className="bg-white rounded-3xl p-7 border border-[#EAE6DF] subtle-shadow card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EBF7EE] text-[#2D6A4F] flex items-center justify-center mb-5 border border-[#D8F3DC]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1C2427]">Portal Admin Studio</h2>
              <p className="text-xs text-[#667085] mt-2 leading-relaxed">
                Kelola jadwal kelas, katalog layanan (Reformer, Tower, Mat), profil instruktur, paket membership, dan pantau operasional studio secara terpusat.
              </p>

              <div className="mt-5 space-y-1.5 text-xs text-[#475467]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#2D6A4F]" />
                  <span>13 Modul Lengkap Sesuai PRD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#2D6A4F]" />
                  <span>Prisma ORM & Autentikasi Terenkripsi</span>
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="mt-8 w-full py-3 px-4 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <span>Masuk Dashboard Admin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Client Store Card */}
          <div className="bg-white rounded-3xl p-7 border border-[#EAE6DF] subtle-shadow card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FDF4E7] text-[#C08A3E] flex items-center justify-center mb-5 border border-[#FDECD2]">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1C2427]">Online Store Klien</h2>
              <p className="text-xs text-[#667085] mt-2 leading-relaxed">
                Kanal self-service booking publik untuk klien: lihat kuota sesi real-time, pilih jadwal Pilates favorit, beli paket kelas, dan dapatkan tiket QR Code instan.
              </p>

              <div className="mt-5 space-y-1.5 text-xs text-[#475467]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#C08A3E]" />
                  <span>Guest Checkout Cepat Tanpa Akun</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#C08A3E]" />
                  <span>Anti Overbooking & QR Code Tiket</span>
                </div>
              </div>
            </div>

            <Link
              href="/store"
              className="mt-8 w-full py-3 px-4 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#1C2427] border border-[#EAE6DF] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <span>Buka Jadwal & Online Store</span>
              <ArrowRight className="w-4 h-4 text-[#667085]" />
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 pt-12 border-t border-[#EAE6DF] grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-4 rounded-2xl bg-white/60 border border-[#EAE6DF]">
            <div className="text-xs font-bold text-[#1C2427] mb-1">Reformer & Tower Specialized</div>
            <p className="text-xs text-[#667085] leading-relaxed">
              Konfigurasi kapasitas presisi untuk studio peralatan khusus (4–8 reformer/tower per kelas).
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/60 border border-[#EAE6DF]">
            <div className="text-xs font-bold text-[#1C2427] mb-1">Multi-Cabang Ready</div>
            <p className="text-xs text-[#667085] leading-relaxed">
              Struktur data Branch bawaan siap ekspansi ke studio multi-lokasi tanpa migrasi arsitektur.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/60 border border-[#EAE6DF]">
            <div className="text-xs font-bold text-[#1C2427] mb-1">Kehadiran Cepat QR Scan</div>
            <p className="text-xs text-[#667085] leading-relaxed">
              Check-in kehadiran member langsung di resepsionis dalam hitungan detik dengan kamera tablet.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-[#EAE6DF] bg-white text-center text-xs text-[#667085]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© 2026 TICPILATES — All rights reserved. Sesuai PRD V1.0.</div>
          <div className="flex items-center gap-1 text-[11px] text-[#98A2B3]">
            <MapPin className="w-3 h-3 text-[#2D6A4F]" />
            <span>Kemang Studio, Jakarta Selatan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

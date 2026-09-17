import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, MapPin, Store, Check } from 'lucide-react';

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
              Lihat Jadwal Minggu Ini
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
          <span>Setup 1 hari · Tanpa double-booking</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1C2427] tracking-tight max-w-3xl mx-auto leading-[1.1]">
          Satu sistem untuk jadwal, booking, dan pembayaran studio
        </h1>

        <p className="text-sm md:text-base text-[#667085] mt-6 max-w-2xl mx-auto leading-relaxed">
          Jadwal manual di Excel, kuota yang tak termonitor, booking lewat WhatsApp yang berantakan — semua itu bikin studio kehilangan waktu dan uang. TICPILATES ganti seluruh operasional jadi satu sistem yang jalan sendiri.
        </p>

        {/* Portal Action Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto text-left">
          {/* Admin Card — primary treatment */}
          <div className="bg-[#2D6A4F] rounded-2xl p-7 text-white flex flex-col justify-between card-hover">
            <div>
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-5">
                <ShieldCheck className="w-5.5 h-5.5" />
              </div>
              <h2 className="text-lg font-bold">Dashboard Admin</h2>
              <p className="text-xs text-white/70 mt-2 leading-relaxed">
                Kelola jadwal, membership, transaksi, dan laporan dari satu tempat.
              </p>

              <div className="mt-5 space-y-1.5 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#A7F3D0]" />
                  <span>Kalender jadwal real-time</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#A7F3D0]" />
                  <span>Data studio aman terenkripsi</span>
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="mt-8 w-full py-3 px-4 bg-white text-[#2D6A4F] hover:bg-white/90 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <span>Buka Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Client Store Card — secondary treatment */}
          <div className="bg-white rounded-2xl p-7 border border-[#EAE6DF] subtle-shadow card-hover flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#FDF4E7] text-[#C08A3E] flex items-center justify-center mb-5 border border-[#FDECD2]">
                <Store className="w-5.5 h-5.5" />
              </div>
              <h2 className="text-lg font-bold text-[#1C2427]">Online Store</h2>
              <p className="text-xs text-[#667085] mt-2 leading-relaxed">
                Klien booking sendiri, bayar online, dapat tiket QR — tanpa chat admin.
              </p>

              <div className="mt-5 space-y-1.5 text-xs text-[#475467]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#C08A3E]" />
                  <span>Tanpa akun, langsung booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#C08A3E]" />
                  <span>Zero overbooking</span>
                </div>
              </div>
            </div>

            <Link
              href="/store"
              className="mt-8 w-full py-3 px-4 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#1C2427] border border-[#EAE6DF] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <span>Booking Sekarang</span>
              <ArrowRight className="w-4 h-4 text-[#667085]" />
            </Link>
          </div>
        </div>

        {/* Key Benefits — bento layout */}
        <div className="mt-16 pt-12 border-t border-[#EAE6DF] grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {/* Large card — spans 2 cols on md */}
          <div className="md:col-span-2 bg-[#1C2427] text-white rounded-2xl p-7 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-[#A7F3D0] uppercase tracking-wider mb-3">Check-in</div>
              <h3 className="text-xl font-bold leading-snug">3 detik scan, kehadiran tercatat.</h3>
              <p className="text-sm text-white/60 mt-3 max-w-md leading-relaxed">
                Klien tiba di studio, admin scan QR — selesai. Tidak ada clipboard, tidak ada Excel, tidak ada antrian.
              </p>
            </div>
          </div>

          {/* Small card */}
          <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] subtle-shadow">
            <div className="text-xs font-semibold text-[#2D6A4F] uppercase tracking-wider mb-3">Kapasitas</div>
            <h3 className="text-base font-bold text-[#1C2427] leading-snug">Presisi untuk Reformer & Tower.</h3>
            <p className="text-xs text-[#667085] mt-2 leading-relaxed">
              Set kapasitas per kelas — 4, 6, atau 8 slot — tanpa overbooking.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-[#EAE6DF] bg-white text-center text-xs text-[#667085]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© 2026 TICPILATES</div>
          <div className="flex items-center gap-1 text-[11px] text-[#98A2B3]">
            <MapPin className="w-3 h-3 text-[#2D6A4F]" />
            <span>Kemang Studio, Jakarta Selatan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

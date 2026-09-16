import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Sparkles, Calendar, Clock, Users, ArrowRight, ShieldCheck, Check, MapPin, Store, QrCode } from 'lucide-react';
import StoreBookingSection from '@/components/store/StoreBookingSection';

export const dynamic = 'force-dynamic';

export default async function OnlineStorePage() {
  const [services, pricingPlans, branch] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { type: 'asc' } }),
    prisma.pricingPlan.findMany({ where: { active: true }, orderBy: { price: 'asc' } }),
    prisma.branch.findFirst(),
  ]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between">
      {/* Client Header */}
      <header className="px-6 py-4 border-b border-[#EAE6DF] bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-base shadow-sm">
                TP
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-[#1C2427]">TICPILATES</span>
                <span className="text-[10px] text-[#2D6A4F] block font-semibold">Online Booking Portal</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#667085]">
              <MapPin className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>{branch?.name || 'Kemang Studio'}</span>
            </div>
            <Link
              href="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#EAE6DF] text-[#475467] hover:bg-[#FAF8F5]"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* Banner */}
        <div className="bg-[#FFFFFF] rounded-3xl p-8 border border-[#EAE6DF] subtle-shadow flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7EE] text-[#2D6A4F] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Self-Service Booking Pilates Tanpa Ribet</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#1C2427] tracking-tight">
              Pilih Kelas & Mulai Latihan Pilates Anda
            </h1>
            <p className="text-xs md:text-sm text-[#667085] mt-2 leading-relaxed">
              Jadwal real-time studio Reformer & Tower kami. Pilih sesi yang sesuai dengan preferensi Anda, bayar instan, dan dapatkan tiket QR Code langsung di ponsel Anda.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] text-center shrink-0 w-full md:w-64">
            <div className="text-xs text-[#667085]">Booking Terbuka untuk</div>
            <div className="text-lg font-bold text-[#1C2427] mt-1">Hari Ini & Pekan Ini</div>
            <div className="mt-3 text-[11px] text-[#2D6A4F] font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Konfirmasi Otomatis</span>
            </div>
          </div>
        </div>

        {/* Interactive Real-Time Schedule & Booking Section (Sesi 2) */}
        <StoreBookingSection />

        {/* Section 1: Catalog of Services */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1C2427]">Pilihan Jenis Kelas (Services)</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Kombinasi latihan kekuatan otot inti, fleksibilitas, dan stabilitas postur.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="bg-white rounded-3xl p-6 border border-[#EAE6DF] subtle-shadow card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                        srv.type === 'group'
                          ? 'bg-[#EBF7EE] text-[#2D6A4F]'
                          : 'bg-[#FDF4E7] text-[#C08A3E]'
                      }`}
                    >
                      {srv.type === 'group' ? 'Group Class' : 'Private 1-on-1'}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-[#667085]">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                        {srv.durationMin} Min
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-[#2D6A4F]" />
                        Maks. {srv.defaultCapacity}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#1C2427] mb-2">{srv.name}</h3>
                  <p className="text-xs text-[#667085] leading-relaxed line-clamp-3">
                    {srv.description || 'Latihan Pilates dipandu oleh instruktur tersertifikasi.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F2EFE9] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#2D6A4F]">
                    Kapasitas Intim & Terkontrol
                  </span>
                  <a
                    href="#schedule"
                    className="text-xs font-semibold text-[#1C2427] bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#EAE6DF] hover:bg-[#EBF7EE]"
                  >
                    Booking Sesi
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Pricing Plans */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#1C2427]">Pilihan Paket & Membership</h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Pilih single pass untuk coba kelas atau bundle paket hemat untuk latihan rutin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-3xl p-6 border border-[#EAE6DF] subtle-shadow card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] mb-1">
                    {plan.type === 'single' ? 'Single Pass' : plan.type === 'bundle' ? 'Class Pack' : 'Membership'}
                  </div>
                  <h3 className="text-base font-bold text-[#1C2427]">{plan.name}</h3>

                  <div className="mt-4 mb-4">
                    <div className="text-xl font-extrabold text-[#1C2427]">
                      {formatIDR(plan.price)}
                    </div>
                    <div className="text-[11px] text-[#667085] mt-0.5">
                      {plan.sessionCount ? `${plan.sessionCount} Sesi Latihan` : 'Akses Unlimited'}
                    </div>
                  </div>

                  <div className="space-y-2 py-3 border-t border-[#F2EFE9] text-xs text-[#475467]">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" />
                      <span>{plan.durationDays ? `Masa aktif ${plan.durationDays} hari` : 'Tanpa kadaluarsa'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" />
                      <span>Termasuk Reformer Studio</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F2EFE9]">
                  <button
                    type="button"
                    className="w-full py-2 px-3 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Beli Paket
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Studio Reception QR Check-In Guide Banner */}
        <div className="bg-[#FAF8F5] rounded-3xl p-6 border border-[#EAE6DF] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF7EE] text-[#2D6A4F] flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C2427]">
                Check-In Mandiri Cepat di Resepsionis Studio Kemang
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Cukup scan QR Code pada tiket digital ponsel Anda di meja resepsionis studio untuk verifikasi instan.
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-[#2D6A4F] bg-white px-3 py-1.5 rounded-xl border border-[#EAE6DF] shrink-0">
            Tanpa Perlu Cetak Kertas
          </div>
        </div>
      </main>

      {/* Client Footer */}
      <footer className="py-6 px-6 border-t border-[#EAE6DF] bg-white text-center text-xs text-[#667085] mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>TICPILATES Online Store — Sistem Pemesanan Kelas Pilates Mandiri</div>
          <div>Alamat: Jl. Kemang Raya No. 18, Jakarta Selatan</div>
        </div>
      </footer>
    </div>
  );
}

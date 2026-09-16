import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Sparkles,
  Users,
  CreditCard,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Store,
  Clock,
  MapPin,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [servicesCount, instructorsCount, plansCount, branch] = await Promise.all([
    prisma.service.count(),
    prisma.instructor.count({ where: { active: true } }),
    prisma.pricingPlan.count({ where: { active: true } }),
    prisma.branch.findFirst(),
  ]);

  const [recentServices, recentInstructors, recentPlans] = await Promise.all([
    prisma.service.findMany({ take: 3, orderBy: { createdAt: 'desc' } }),
    prisma.instructor.findMany({ take: 3, orderBy: { createdAt: 'desc' } }),
    prisma.pricingPlan.findMany({ take: 3, orderBy: { price: 'asc' } }),
  ]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Studio Banner */}
      <div className="bg-gradient-to-r from-[#2D6A4F] to-[#1E4633] rounded-3xl p-6 md:p-8 text-white subtle-shadow relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#D8F3DC]" />
            <span>{branch?.name || 'TICPILATES Kemang Studio'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Selamat Datang di Studio Management TICPILATES
          </h1>
          <p className="text-white/80 text-xs md:text-sm mt-2 max-w-2xl leading-relaxed">
            Pondasi sistem operasional studio, database 14 entitas, dan katalog master data telah siap.
            Semua parameter kelas dan paket harga siap dialokasikan ke jadwal sesi.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/admin/services"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#2D6A4F] rounded-xl text-xs font-bold shadow-xs hover:bg-[#FAF8F5] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kelola Layanan ({servicesCount})</span>
            </Link>
            <Link
              href="/admin/instructors"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Instruktur ({instructorsCount})</span>
            </Link>
            <Link
              href="/admin/pricing-plans"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Paket Harga ({plansCount})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] subtle-shadow card-hover">
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-xs font-semibold">Jenis Layanan</span>
            <div className="p-2 rounded-xl bg-[#EBF7EE] text-[#2D6A4F]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1C2427]">{servicesCount}</div>
          <div className="text-[11px] text-[#667085] mt-1 flex items-center gap-1">
            <span className="text-[#2D6A4F] font-semibold">Group & Private</span>
            <span>siap dijadwalkan</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] subtle-shadow card-hover">
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-xs font-semibold">Instruktur Terdaftar</span>
            <div className="p-2 rounded-xl bg-[#EBF7EE] text-[#2D6A4F]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1C2427]">{instructorsCount}</div>
          <div className="text-[11px] text-[#667085] mt-1 flex items-center gap-1">
            <span className="text-[#2D6A4F] font-semibold">Pelatih Bersertifikat</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] subtle-shadow card-hover">
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-xs font-semibold">Paket Aktif</span>
            <div className="p-2 rounded-xl bg-[#EBF7EE] text-[#2D6A4F]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1C2427]">{plansCount}</div>
          <div className="text-[11px] text-[#667085] mt-1 flex items-center gap-1">
            <span className="text-[#2D6A4F] font-semibold">Single, Bundle & Member</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] subtle-shadow card-hover">
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-xs font-semibold">Pondasi Sistem</span>
            <div className="p-2 rounded-xl bg-[#EBF7EE] text-[#2D6A4F]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2D6A4F]">100% Siap</div>
          <div className="text-[11px] text-[#667085] mt-1">
            Sesi 1 (Milestone 1) Selesai
          </div>
        </div>
      </div>

      {/* Sesi 1 Milestone Progress & Readiness */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border border-[#EAE6DF] subtle-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-[#F2EFE9]">
          <div>
            <h2 className="text-base font-bold text-[#1C2427]">
              Roadmap Implementasi PRD TICPILATES
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Pelaksanaan bertahap 4 Sesi sesuai kesepakatan dokumen PRD Section 20 & 22.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-[#EBF7EE] text-[#2D6A4F] rounded-full border border-[#D8F3DC] w-fit">
            Sesi 1 Sukses Dijalankan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border-2 border-[#2D6A4F] relative">
            <div className="flex items-center gap-2 mb-2 text-[#2D6A4F] font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
              <span>Sesi 1: Foundation & Data</span>
            </div>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              Prisma 14 entitas, Auth admin, Shell 13 modul, CRUD Layanan, Instruktur, & Paket Harga.
            </p>
            <div className="mt-3 text-[10px] font-bold text-[#2D6A4F] uppercase tracking-wider">
              Status: SELESAI
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] relative">
            <div className="flex items-center gap-2 mb-2 text-[#1C2427] font-bold text-xs">
              <Calendar className="w-4 h-4 text-[#C08A3E]" />
              <span>Sesi 2: Schedule & Store</span>
            </div>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              Kalender jadwal sesi, web booking online publik klien, anti-race condition kuota, QR code tiket.
            </p>
            <div className="mt-3 text-[10px] font-bold text-[#C08A3E] uppercase tracking-wider">
              Status: BERIKUTNYA
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] relative">
            <div className="flex items-center gap-2 mb-2 text-[#1C2427] font-bold text-xs">
              <CreditCard className="w-4 h-4 text-[#98A2B3]" />
              <span>Sesi 3: Transaksi & Check-in</span>
            </div>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              Input manual penjualan, generator invoice, kode promo diskon, dan QR scanner kehadiran.
            </p>
            <div className="mt-3 text-[10px] font-bold text-[#98A2B3] uppercase tracking-wider">
              Status: TERJADWAL
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EAE6DF] relative">
            <div className="flex items-center gap-2 mb-2 text-[#1C2427] font-bold text-xs">
              <Sparkles className="w-4 h-4 text-[#98A2B3]" />
              <span>Sesi 4: Laporan & Polish</span>
            </div>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              Database klien member, analitik pendapatan, marketing WA broadcast, settings, dan pengujian.
            </p>
            <div className="mt-3 text-[10px] font-bold text-[#98A2B3] uppercase tracking-wider">
              Status: TERJADWAL
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Snapshot */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF] subtle-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2D6A4F]" />
                <h3 className="text-sm font-bold text-[#1C2427]">Katalog Layanan</h3>
              </div>
              <Link
                href="/admin/services"
                className="text-xs text-[#2D6A4F] font-semibold hover:underline"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentServices.map((srv) => (
                <div
                  key={srv.id}
                  className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-[#1C2427]">{srv.name}</div>
                    <div className="text-[10px] text-[#667085] mt-0.5 flex items-center gap-2">
                      <span>{srv.durationMin} Menit</span>
                      <span>•</span>
                      <span>Maks. {srv.defaultCapacity} Orang</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-[#EAE6DF] text-[#2D6A4F] capitalize">
                    {srv.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/admin/services"
            className="mt-4 w-full py-2 px-3 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#1C2427] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Buka Modul Layanan</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#667085]" />
          </Link>
        </div>

        {/* Instructors Snapshot */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF] subtle-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2D6A4F]" />
                <h3 className="text-sm font-bold text-[#1C2427]">Instruktur Studio</h3>
              </div>
              <Link
                href="/admin/instructors"
                className="text-xs text-[#2D6A4F] font-semibold hover:underline"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentInstructors.map((inst) => (
                <div
                  key={inst.id}
                  className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-[#EAE6DF] flex items-center justify-center font-bold text-[11px] text-[#2D6A4F] shrink-0">
                      {inst.photoUrl ? (
                        <img src={inst.photoUrl} alt={inst.name} className="w-full h-full object-cover" />
                      ) : (
                        inst.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1C2427]">{inst.name}</div>
                      <div className="text-[10px] text-[#667085] truncate max-w-[140px]">
                        {inst.phone || 'Instruktur Bersertifikat'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#2D6A4F] bg-[#EBF7EE] px-2 py-0.5 rounded-md">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/admin/instructors"
            className="mt-4 w-full py-2 px-3 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#1C2427] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Buka Modul Instruktur</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#667085]" />
          </Link>
        </div>

        {/* Pricing Plans Snapshot */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF] subtle-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#2D6A4F]" />
                <h3 className="text-sm font-bold text-[#1C2427]">Paket Harga Aktif</h3>
              </div>
              <Link
                href="/admin/pricing-plans"
                className="text-xs text-[#2D6A4F] font-semibold hover:underline"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-[#1C2427]">{plan.name}</div>
                    <div className="text-[10px] text-[#667085]">
                      {plan.sessionCount ? `${plan.sessionCount} Sesi` : 'Unlimited Sesi'}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-[#2D6A4F]">
                    {formatIDR(plan.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/admin/pricing-plans"
            className="mt-4 w-full py-2 px-3 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#1C2427] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Buka Modul Paket Harga</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#667085]" />
          </Link>
        </div>
      </div>
    </div>
  );
}

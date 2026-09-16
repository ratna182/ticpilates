'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Users, CheckCircle2, ShoppingBag,
  Activity, Loader2, Calendar, Award,
} from 'lucide-react';

interface ReportData {
  monthlyRevenue: { month: string; revenue: number }[];
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  thisMonthTransactions: number;
  totalClients: number;
  totalBookings: number;
  totalCheckins: number;
  newClientsThisMonth: number;
  topServices: { name: string; count: number }[];
  dailyAttendance: { date: string; count: number }[];
}

const formatIDR = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

function SimpleBarChart({ data, color = '#2D6A4F' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md transition-all hover:opacity-80 cursor-default"
            style={{
              height: `${Math.max(4, (d.value / max) * 100)}%`,
              backgroundColor: color,
              opacity: 0.7 + (i / data.length) * 0.3,
            }}
            title={`${d.label}: ${d.value}`}
          />
          <div className="text-[9px] text-[#98A2B3] text-center truncate w-full">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#667085]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat laporan...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <BarChart3 className="w-10 h-10 text-[#EAE6DF] mb-3" />
        <div className="text-sm font-semibold text-[#667085]">Gagal memuat laporan</div>
      </div>
    );
  }

  const revenueGrowth = data.lastMonthRevenue > 0
    ? ((data.thisMonthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100
    : data.thisMonthRevenue > 0 ? 100 : 0;

  const attendanceRate = data.totalBookings > 0
    ? Math.round((data.totalCheckins / data.totalBookings) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-[#1C2427] flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#2D6A4F]" />
          Laporan &amp; Analitik Studio
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">Performa bisnis, pendapatan, dan kehadiran real-time</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Pendapatan Bulan Ini',
            value: formatIDR(data.thisMonthRevenue),
            sub: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs bulan lalu`,
            icon: TrendingUp,
            positive: revenueGrowth >= 0,
            color: 'text-[#2D6A4F]',
            bg: 'bg-[#EBF7EE]',
          },
          {
            label: 'Total Klien',
            value: data.totalClients,
            sub: `+${data.newClientsThisMonth} klien baru bulan ini`,
            icon: Users,
            positive: true,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Tingkat Kehadiran',
            value: `${attendanceRate}%`,
            sub: `${data.totalCheckins} check-in dari ${data.totalBookings} booking`,
            icon: CheckCircle2,
            positive: attendanceRate >= 70,
            color: attendanceRate >= 70 ? 'text-emerald-600' : 'text-amber-600',
            bg: attendanceRate >= 70 ? 'bg-emerald-50' : 'bg-amber-50',
          },
          {
            label: 'Transaksi Bulan Ini',
            value: data.thisMonthTransactions,
            sub: formatIDR(data.lastMonthRevenue) + ' bulan lalu',
            icon: ShoppingBag,
            positive: true,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider leading-tight max-w-[100px]">
                  {kpi.label}
                </div>
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className={`text-xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
              <div className={`text-[10px] mt-1 ${kpi.positive ? 'text-[#667085]' : 'text-amber-600'}`}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1C2427]">Pendapatan 6 Bulan Terakhir</h3>
              <p className="text-[11px] text-[#667085] mt-0.5">Transaksi dengan status Lunas</p>
            </div>
            <div className="text-xs font-bold text-[#2D6A4F]">{formatIDR(data.thisMonthRevenue)}</div>
          </div>
          {data.monthlyRevenue.every((d) => d.revenue === 0) ? (
            <div className="h-28 flex items-center justify-center text-xs text-[#98A2B3]">
              Belum ada data pendapatan
            </div>
          ) : (
            <SimpleBarChart
              data={data.monthlyRevenue.map((d) => ({ label: d.month, value: d.revenue }))}
              color="#2D6A4F"
            />
          )}
        </div>

        {/* Daily Attendance Chart */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1C2427]">Kehadiran 14 Hari Terakhir</h3>
              <p className="text-[11px] text-[#667085] mt-0.5">Jumlah check-in per hari</p>
            </div>
            <div className="text-xs font-bold text-blue-600">{data.totalCheckins} total</div>
          </div>
          {data.dailyAttendance.every((d) => d.count === 0) ? (
            <div className="h-28 flex items-center justify-center text-xs text-[#98A2B3]">
              Belum ada data kehadiran
            </div>
          ) : (
            <SimpleBarChart
              data={data.dailyAttendance.map((d) => ({ label: d.date, value: d.count }))}
              color="#3B82F6"
            />
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF]">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-[#C08A3E]" />
            <h3 className="text-sm font-bold text-[#1C2427]">Kelas Terpopuler</h3>
          </div>
          {data.topServices.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-[#98A2B3]">
              Belum ada data booking
            </div>
          ) : (
            <div className="space-y-3">
              {data.topServices.map((s, i) => {
                const maxCount = Math.max(...data.topServices.map((x) => x.count), 1);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#EBF7EE] text-[#2D6A4F] font-bold text-[10px] flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-xs font-semibold text-[#1C2427]">{s.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[#2D6A4F]">{s.count} booking</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#F2EFE9] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2D6A4F] transition-all"
                        style={{ width: `${(s.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF]">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#2D6A4F]" />
            <h3 className="text-sm font-bold text-[#1C2427]">Ringkasan Keseluruhan</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Total Klien Terdaftar', value: data.totalClients, icon: Users },
              { label: 'Total Booking (Confirmed + Check-in)', value: data.totalBookings, icon: Calendar },
              { label: 'Total Check-in Kehadiran', value: data.totalCheckins, icon: CheckCircle2 },
              { label: 'Klien Baru Bulan Ini', value: data.newClientsThisMonth, icon: TrendingUp },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-[#475467]">
                    <Icon className="w-4 h-4 text-[#98A2B3] shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-sm font-extrabold text-[#1C2427]">{item.value}</span>
                </div>
              );
            })}
            <div className="pt-3 border-t border-[#F2EFE9]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#667085]">Attendance Rate</span>
                <span className={`text-sm font-extrabold ${attendanceRate >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {attendanceRate}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F2EFE9] mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${attendanceRate >= 70 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

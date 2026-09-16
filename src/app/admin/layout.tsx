'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  CreditCard,
  Users,
  Receipt,
  BarChart3,
  Tag,
  QrCode,
  Megaphone,
  HeartHandshake,
  Settings,
  Store,
  LogOut,
  Menu,
  X,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isExternal?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    label: 'Operasional',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Schedule (Jadwal)', href: '/admin/schedule', icon: Calendar },
      { name: 'Scan Customer (QR)', href: '/admin/scan', icon: QrCode },
    ],
  },
  {
    label: 'Katalog & Paket',
    items: [
      { name: 'Services (Layanan)', href: '/admin/services', icon: Sparkles },
      { name: 'Pricing Plans', href: '/admin/pricing-plans', icon: CreditCard },
      { name: 'Promo Codes', href: '/admin/promo-codes', icon: Tag },
    ],
  },
  {
    label: 'Klien & Transaksi',
    items: [
      { name: 'Customers (Klien)', href: '/admin/customers', icon: Users },
      { name: 'Sales & Invoices', href: '/admin/sales', icon: Receipt },
    ],
  },
  {
    label: 'Analitik & Retensi',
    items: [
      { name: 'Reports (Laporan)', href: '/admin/reports', icon: BarChart3 },
      { name: 'Marketing', href: '/admin/marketing', icon: Megaphone },
      { name: 'Customer Centricity', href: '/admin/customer-centricity', icon: HeartHandshake },
    ],
  },
  {
    label: 'Sistem & Toko',
    items: [
      { name: 'Settings', href: '/admin/settings', icon: Settings },
      { name: 'Online Store', href: '/store', icon: Store, isExternal: true },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#FFFFFF] border-r border-[#EAE6DF]">
      {/* Studio Brand */}
      <div className="p-6 pb-4 border-b border-[#F2EFE9]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            TP
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#1C2427]">
              TICPILATES
            </h1>
            <div className="flex items-center gap-1 text-[11px] text-[#667085] mt-0.5">
              <MapPin className="w-3 h-3 text-[#2D6A4F]" />
              <span className="truncate max-w-[130px]">Kemang Studio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {navigationGroups.map((group, gIdx) => (
          <div key={gIdx}>
            <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && !item.isExternal && pathname.startsWith(item.href));

                if (item.isExternal) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#475467] hover:bg-[#FAF8F5] hover:text-[#1C2427] transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#98A2B3] group-hover:text-[#2D6A4F] transition-colors" />
                        <span>{item.name}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#98A2B3]" />
                    </a>
                  );
                }

                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      router.push(item.href);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#2D6A4F] text-white shadow-sm font-semibold'
                        : 'text-[#475467] hover:bg-[#FAF8F5] hover:text-[#1C2427]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-white' : 'text-[#98A2B3]'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-[#EBF7EE] text-[#2D6A4F] font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-[#F2EFE9] bg-[#FAF8F5]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EBF7EE] text-[#2D6A4F] font-bold text-xs flex items-center justify-center border border-[#D8F3DC]">
              AD
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1C2427] leading-tight">
                Head Admin
              </div>
              <div className="text-[11px] text-[#667085] leading-tight">
                admin@ticpilates.com
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Keluar dari akun"
            className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#FAF8F5]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-full h-full z-10">
            <NavContent />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#FAF8F5] text-[#475467] hover:bg-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 px-4 md:px-8 border-b border-[#EAE6DF] bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-xl text-[#475467] hover:bg-[#FAF8F5] md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs text-[#667085] hidden sm:flex items-center gap-2">
              <span className="font-medium text-[#1C2427]">TICPILATES</span>
              <span>/</span>
              <span className="capitalize">
                {pathname.replace('/admin/', '').replace('-', ' ') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/store"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EBF7EE] text-[#2D6A4F] border border-[#D8F3DC] hover:bg-[#D8F3DC] transition-all"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Lihat Online Store</span>
            </a>
            <div className="h-4 w-px bg-[#EAE6DF] hidden sm:block" />
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#EAE6DF] text-[#475467] font-medium">
              Cabang Kemang
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

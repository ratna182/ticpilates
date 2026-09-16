'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/admin/dashboard';

  const [email, setEmail] = useState('admin@ticpilates.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk ke sistem');
      }

      router.push(nextUrl);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan tidak terduga');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('admin@ticpilates.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2D6A4F] text-white shadow-lg shadow-[#2D6A4F]/20 mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1C2427]">TICPILATES</h1>
        <p className="text-sm text-[#667085] mt-1.5 font-medium">
          Studio Management & Operations Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-3xl p-8 border border-[#EAE6DF] subtle-shadow">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#1C2427]">Masuk ke Akun Admin</h2>
          <p className="text-xs text-[#667085] mt-1">
            Kelola jadwal, membership, instruktur, dan operasional studio Anda.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
              Alamat Email Admin
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ticpilates.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-sm text-[#1C2427] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#1C2427]">
                Kata Sandi
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-sm text-[#1C2427] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Quick Demo Access Box */}
          <div className="p-3 bg-[#EBF7EE] border border-[#D8F3DC] rounded-xl flex items-center justify-between">
            <div className="text-[11px] text-[#2D6A4F]">
              <span className="font-semibold block">Akun Demo Siap Pakai:</span>
              <span>admin@ticpilates.com / admin123</span>
            </div>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-xs font-semibold text-[#2D6A4F] hover:text-[#1E4633] px-2.5 py-1 bg-white rounded-lg shadow-sm border border-[#D8F3DC] transition-all"
            >
              Gunakan
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#2D6A4F] hover:bg-[#1E4633] active:scale-[0.99] text-white rounded-xl font-semibold text-sm shadow-md shadow-[#2D6A4F]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#F2EFE9] flex items-center justify-center gap-2 text-xs text-[#98A2B3]">
          <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
          <span>Autentikasi Terenkripsi & Sesi Aman</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#2D6A4F]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#C08A3E]/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-white rounded-3xl subtle-shadow text-center">
          <div className="w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings, MapPin, Phone, Globe, Clock, Shield,
  Save, Loader2, CheckCircle2, AlertCircle, CreditCard,
  Building, Lock, Eye, EyeOff,
} from 'lucide-react';

const DAYS_ID = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'studio' | 'payment' | 'account'>('studio');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [studioForm, setStudioForm] = useState({
    name: 'TICPILATES',
    address: 'Jl. Kemang Raya No. 99, Jakarta Selatan 12730',
    phone: '0812-3456-7890',
    website: 'https://ticpilates.com',
    openHour: '07:00',
    closeHour: '20:00',
    openDays: [0, 1, 2, 3, 4, 5], // Mon-Sat
    maxCapacityDefault: '8',
    currency: 'IDR',
  });

  const [paymentForm, setPaymentForm] = useState({
    provider: 'midtrans',
    serverKey: '',
    clientKey: '',
    isProduction: false,
  });

  const [accountForm, setAccountForm] = useState({
    name: 'Head Admin',
    email: 'admin@ticpilates.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleDay = (dayIdx: number) => {
    setStudioForm((f) => ({
      ...f,
      openDays: f.openDays.includes(dayIdx)
        ? f.openDays.filter((d) => d !== dayIdx)
        : [...f.openDays, dayIdx],
    }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-[#1C2427] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#2D6A4F]" />
          Pengaturan Studio
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">Konfigurasi identitas studio, integrasi payment, dan akun admin</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#FAF8F5] p-1 rounded-2xl border border-[#EAE6DF] w-fit">
        {([
          { id: 'studio', label: '🏢 Profil Studio' },
          { id: 'payment', label: '💳 Payment Gateway' },
          { id: 'account', label: '👤 Akun Admin' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-[#2D6A4F] shadow-sm border border-[#EAE6DF]'
                : 'text-[#667085] hover:text-[#1C2427]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Studio Profile Tab */}
      {activeTab === 'studio' && (
        <div className="bg-white rounded-3xl border border-[#EAE6DF] p-6 space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-[#F2EFE9]">
            <Building className="w-4 h-4 text-[#2D6A4F]" />
            <h2 className="text-sm font-bold text-[#1C2427]">Identitas Studio</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                Nama Studio <span className="text-rose-500">*</span>
              </label>
              <input
                value={studioForm.name}
                onChange={(e) => setStudioForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">Alamat Studio</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#98A2B3]" />
                <textarea
                  rows={2}
                  value={studioForm.address}
                  onChange={(e) => setStudioForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427] resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">Nomor WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                <input
                  value={studioForm.phone}
                  onChange={(e) => setStudioForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">Website / Instagram</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                <input
                  value={studioForm.website}
                  onChange={(e) => setStudioForm((f) => ({ ...f, website: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                />
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="pt-4 border-t border-[#F2EFE9]">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#2D6A4F]" />
              <h3 className="text-xs font-bold text-[#1C2427]">Jam Operasional</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">Buka</label>
                <input
                  type="time"
                  value={studioForm.openHour}
                  onChange={(e) => setStudioForm((f) => ({ ...f, openHour: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">Tutup</label>
                <input
                  type="time"
                  value={studioForm.closeHour}
                  onChange={(e) => setStudioForm((f) => ({ ...f, closeHour: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-2">Hari Buka</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_ID.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      studioForm.openDays.includes(i)
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                        : 'bg-[#FAF8F5] text-[#667085] border-[#EAE6DF]'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Tab */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-3xl border border-[#EAE6DF] p-6 space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-[#F2EFE9]">
            <CreditCard className="w-4 h-4 text-[#2D6A4F]" />
            <h2 className="text-sm font-bold text-[#1C2427]">Integrasi Payment Gateway</h2>
          </div>

          <div className="bg-[#FFF9F0] border border-[#FDECD2] rounded-2xl p-4">
            <div className="text-xs font-bold text-[#C08A3E] mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Status: Belum Terkonfigurasi (Simulasi Mode)
            </div>
            <p className="text-[11px] text-[#475467] leading-relaxed">
              Online Store saat ini berjalan dalam mode simulasi — pembayaran dikonfirmasi otomatis tanpa gateway nyata.
              Konfigurasi Midtrans atau Xendit di bawah untuk mengaktifkan pembayaran real.
            </p>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-2">Payment Provider</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'midtrans', label: 'Midtrans', sub: 'VA, QRIS, GoPay, OVO' },
                { id: 'xendit', label: 'Xendit', sub: 'VA, QRIS, e-Wallet' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPaymentForm((f) => ({ ...f, provider: p.id }))}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    paymentForm.provider === p.id
                      ? 'border-[#2D6A4F] bg-[#F0FAF4]'
                      : 'border-[#EAE6DF] hover:border-[#2D6A4F]/30'
                  }`}
                >
                  <div className="text-sm font-bold text-[#1C2427]">{p.label}</div>
                  <div className="text-[10px] text-[#667085] mt-0.5">{p.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                {paymentForm.provider === 'midtrans' ? 'Server Key' : 'Secret Key'}
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                <input
                  type="password"
                  value={paymentForm.serverKey}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, serverKey: e.target.value }))}
                  placeholder="••••••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">Client Key / Public Key</label>
              <input
                value={paymentForm.clientKey}
                onChange={(e) => setPaymentForm((f) => ({ ...f, clientKey: e.target.value }))}
                placeholder="Masukkan Client Key"
                className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
              <div>
                <div className="text-xs font-semibold text-[#1C2427]">Mode Produksi</div>
                <div className="text-[10px] text-[#667085]">Aktifkan setelah selesai testing di Sandbox</div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentForm((f) => ({ ...f, isProduction: !f.isProduction }))}
                className={`relative w-10 h-5 rounded-full transition-all cursor-pointer ${paymentForm.isProduction ? 'bg-[#2D6A4F]' : 'bg-[#D0D5DD]'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${paymentForm.isProduction ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-3xl border border-[#EAE6DF] p-6 space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-[#F2EFE9]">
            <Lock className="w-4 h-4 text-[#2D6A4F]" />
            <h2 className="text-sm font-bold text-[#1C2427]">Akun Admin</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">Nama Admin</label>
              <input
                value={accountForm.name}
                onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">Email Login</label>
              <input
                type="email"
                value={accountForm.email}
                onChange={(e) => setAccountForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#F2EFE9]">
            <h3 className="text-xs font-bold text-[#1C2427] mb-3">Ganti Kata Sandi</h3>
            <div className="space-y-3">
              {[
                { key: 'currentPassword', label: 'Kata Sandi Saat Ini' },
                { key: 'newPassword', label: 'Kata Sandi Baru' },
                { key: 'confirmPassword', label: 'Konfirmasi Kata Sandi Baru' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={(accountForm as any)[key]}
                      onChange={(e) => setAccountForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />Pengaturan berhasil disimpan!
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-[#2D6A4F] hover:bg-[#1E4633] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </div>
  );
}

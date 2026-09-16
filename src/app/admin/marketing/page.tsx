'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone, MessageCircle, Send, Users, Bell, CheckCircle2,
  Loader2, AlertCircle, Clock, Phone, Filter,
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface NotificationLog {
  id: string;
  clientId: string;
  channel: string;
  type: string;
  message: string;
  sentAt: string;
  status: string;
  client: Client;
}

const TYPE_LABELS: Record<string, string> = {
  booking_confirmation: 'Konfirmasi Booking',
  reminder: 'Reminder Kelas',
  promo: 'Broadcast Promo',
};
const TYPE_COLORS: Record<string, string> = {
  booking_confirmation: 'bg-blue-50 text-blue-700 border-blue-200',
  reminder: 'bg-amber-50 text-amber-700 border-amber-200',
  promo: 'bg-purple-50 text-purple-700 border-purple-200',
};

const TEMPLATES = [
  {
    id: 'promo',
    label: 'Broadcast Promo',
    icon: Megaphone,
    template: (studioName: string) =>
      `Halo! 🌟 ${studioName} punya penawaran spesial untuk kamu! Dapatkan diskon eksklusif untuk paket Pilates terpilih. Booking sekarang sebelum kuota penuh. Klik link berikut untuk lihat jadwal: [link]`,
  },
  {
    id: 'reminder',
    label: 'Reminder Sesi',
    icon: Bell,
    template: (studioName: string) =>
      `Hei! 👋 Pengingat: kamu punya kelas Pilates besok di ${studioName}. Jangan lupa hadir ya! Kalau ada kendala, segera kabari kami. Sampai jumpa di studio!`,
  },
  {
    id: 'reactivation',
    label: 'Reaktivasi Member',
    icon: Users,
    template: (studioName: string) =>
      `Hai, kami kangen kamu di ${studioName}! 💚 Sudah lama tidak terlihat di kelas. Yuk kembali ke rutinitas Pilates-mu — tubuh yang sehat butuh konsistensi. Ada promo khusus untuk member yang sudah lama tidak hadir!`,
  },
];

export default function MarketingPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [customMessage, setCustomMessage] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'compose' | 'logs'>('compose');

  useEffect(() => {
    fetch('/api/customers?take=200')
      .then((r) => r.json())
      .then((j) => { if (j.ok) setClients(j.data); });

    // Load notification logs
    fetch('/api/marketing/logs')
      .then((r) => r.json())
      .then((j) => { if (j.ok) setLogs(j.data); })
      .finally(() => setLoadingLogs(false));
  }, []);

  const template = TEMPLATES.find((t) => t.id === selectedTemplate);
  const studioName = 'TICPILATES Kemang';
  const messageText = template ? template.template(studioName) : '';

  const waLink = (phone: string, msg: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '').replace(/^0/, '62');
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
  };

  const handleSendWA = () => {
    if (!targetPhone.trim()) {
      setSendResult({ ok: false, msg: 'Masukkan nomor WhatsApp tujuan' });
      return;
    }
    const msg = customMessage.trim() || messageText;
    const link = waLink(targetPhone, msg);
    window.open(link, '_blank');
    setSendResult({ ok: true, msg: 'WhatsApp dibuka di tab baru. Kirim pesan secara manual.' });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-[#1C2427] flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[#2D6A4F]" />
          Marketing &amp; Broadcast
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">Kirim pesan promosi dan pengingat ke klien via WhatsApp</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#EAE6DF] pb-0">
        {(['compose', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-[#2D6A4F] text-[#2D6A4F] bg-[#F0FAF4]'
                : 'border-transparent text-[#667085] hover:text-[#1C2427]'
            }`}
          >
            {tab === 'compose' ? '✏️ Buat Pesan' : '📋 Log Pengiriman'}
          </button>
        ))}
      </div>

      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template Picker */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF]">
              <h3 className="text-sm font-bold text-[#1C2427] mb-3">Pilih Template Pesan</h3>
              <div className="space-y-2">
                {TEMPLATES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTemplate(t.id); setCustomMessage(''); }}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedTemplate === t.id
                          ? 'border-[#2D6A4F] bg-[#F0FAF4]'
                          : 'border-[#EAE6DF] hover:border-[#2D6A4F]/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedTemplate === t.id ? 'bg-[#2D6A4F] text-white' : 'bg-[#FAF8F5] text-[#98A2B3]'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-[#1C2427]">{t.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Client */}
            <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF]">
              <h3 className="text-sm font-bold text-[#1C2427] mb-3">Tujuan Pesan</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Pilih Klien</label>
                  <select
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                  >
                    <option value="">-- Pilih dari daftar klien --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.phone}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-center text-[10px] text-[#98A2B3]">atau</div>
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Input Nomor Manual</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#98A2B3]" />
                    <input
                      value={targetPhone}
                      onChange={(e) => setTargetPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full pl-8 pr-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Message Preview & Send */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF]">
              <h3 className="text-sm font-bold text-[#1C2427] mb-3">Preview Pesan</h3>
              <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-none p-4 mb-3 shadow-xs">
                <p className="text-xs text-[#1C2427] leading-relaxed whitespace-pre-wrap">
                  {customMessage || messageText}
                </p>
                <div className="text-right text-[9px] text-[#667085] mt-1 flex items-center justify-end gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Sekarang
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Ubah Pesan (opsional)
                </label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Edit pesan atau biarkan kosong untuk pakai template..."
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427] resize-none"
                />
              </div>
            </div>

            {sendResult && (
              <div className={`flex items-center gap-2 text-xs rounded-xl p-3 border ${sendResult.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                {sendResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {sendResult.msg}
              </div>
            )}

            <button
              onClick={handleSendWA}
              disabled={!targetPhone.trim()}
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#20B958] disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-5 h-5" />
              Buka WhatsApp &amp; Kirim
            </button>

            <div className="bg-[#FFF9F0] border border-[#FDECD2] rounded-2xl p-3">
              <p className="text-[10px] text-[#C08A3E] leading-relaxed">
                💡 Integrasi WA Business API (Wablas / Zenziva / Fonnte) dapat mengotomasi pengiriman tanpa membuka WA secara manual.
                Konfigurasi di modul <strong>Settings</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-[#EAE6DF] overflow-hidden">
          {loadingLogs ? (
            <div className="flex items-center justify-center h-48 text-[#667085]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat log...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-8">
              <Bell className="w-10 h-10 text-[#EAE6DF] mb-3" />
              <div className="text-sm font-semibold text-[#667085]">Belum ada riwayat pengiriman</div>
              <div className="text-xs text-[#98A2B3] mt-1">Notifikasi dari konfirmasi booking akan tampil di sini</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#F2EFE9] bg-[#FAF8F5]">
                    {['Klien', 'Tipe', 'Pesan', 'Channel', 'Waktu', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-[#F2EFE9] hover:bg-[#FAF8F5]/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#1C2427]">{log.client?.name || '—'}</div>
                        <div className="text-[10px] text-[#98A2B3]">{log.client?.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${TYPE_COLORS[log.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {TYPE_LABELS[log.type] || log.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="truncate text-[#475467]">{log.message}</p>
                      </td>
                      <td className="px-4 py-3 text-[#667085] uppercase font-semibold">{log.channel}</td>
                      <td className="px-4 py-3 text-[#667085]">{formatDate(log.sentAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${log.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                          {log.status === 'sent' ? 'Terkirim' : 'Gagal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Plus, X, Phone, Mail, StickyNote,
  ChevronRight, Loader2, AlertCircle, CheckCircle2,
  Calendar, CreditCard, Activity,
} from 'lucide-react';

interface Membership {
  id: string;
  status: string;
  sessionsLeft: number | null;
  validUntil: string | null;
  pricingPlan: { name: string; type: string };
}

interface Booking {
  id: string;
  status: string;
  createdAt: string;
  classSession: {
    startTime: string;
    service: { name: string };
    instructor: { name: string };
  };
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  memberships: Membership[];
  bookings: Booking[];
  _count: { bookings: number; transactions: number };
}

const formatIDR = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const statusStyle: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'checked-in': 'bg-blue-50 text-blue-700 border-blue-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
};
const statusLabel: Record<string, string> = {
  confirmed: 'Terkonfirmasi',
  'checked-in': 'Hadir',
  pending: 'Menunggu',
  cancelled: 'Dibatalkan',
};

export default function CustomersPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: search, take: '50' });
      const res = await fetch(`/api/customers?${params}`);
      const json = await res.json();
      if (json.ok) {
        setClients(json.data);
        setTotal(json.total);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => fetchClients(q), 300);
    return () => clearTimeout(delay);
  }, [q, fetchClients]);

  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      const json = await res.json();
      if (json.ok) setSelectedClient(json.data);
    } catch {
      /* ignore */
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal membuat klien');
      setFormSuccess(`Klien "${json.data.name}" berhasil ditambahkan.`);
      setFormData({ name: '', phone: '', email: '', notes: '' });
      fetchClients(q);
      setTimeout(() => { setShowForm(false); setFormSuccess(''); }, 2000);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeMembership = (client: Client) =>
    client.memberships.find((m) => m.status === 'active');

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left Panel – List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#1C2427] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2D6A4F]" />
              Database Klien
            </h1>
            <p className="text-xs text-[#667085] mt-0.5">{total} klien terdaftar</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setFormError(''); setFormSuccess(''); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Klien
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, nomor WhatsApp, atau email..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[#667085]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat data klien...
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Users className="w-10 h-10 text-[#EAE6DF] mb-3" />
              <div className="text-sm font-semibold text-[#667085]">
                {q ? 'Tidak ada klien yang sesuai' : 'Belum ada klien terdaftar'}
              </div>
              <div className="text-xs text-[#98A2B3] mt-1">
                {q ? 'Coba kata kunci lain' : 'Klik "Tambah Klien" untuk mulai'}
              </div>
            </div>
          ) : (
            clients.map((client) => {
              const mem = activeMembership(client);
              const isSelected = selectedClient?.id === client.id;
              return (
                <button
                  key={client.id}
                  onClick={() => fetchDetail(client.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all hover:shadow-sm cursor-pointer ${
                    isSelected
                      ? 'border-[#2D6A4F] bg-[#F0FAF4] shadow-sm'
                      : 'border-[#EAE6DF] bg-white hover:border-[#2D6A4F]/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#EBF7EE] text-[#2D6A4F] font-bold text-sm flex items-center justify-center shrink-0 border border-[#D8F3DC]">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#1C2427] truncate">{client.name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-[#667085] mt-0.5">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {mem && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EBF7EE] text-[#2D6A4F] border border-[#D8F3DC]">
                          {mem.pricingPlan.name}
                        </span>
                      )}
                      <div className="text-right">
                        <div className="text-[11px] font-semibold text-[#1C2427]">
                          {client._count.bookings} booking
                        </div>
                        <div className="text-[10px] text-[#98A2B3]">
                          {formatDate(client.createdAt)}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#98A2B3]" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel – Detail */}
      <div className="w-[380px] shrink-0 bg-white border border-[#EAE6DF] rounded-3xl overflow-hidden flex flex-col">
        {detailLoading ? (
          <div className="flex items-center justify-center flex-1 text-[#667085]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Memuat detail...
          </div>
        ) : selectedClient ? (
          <>
            {/* Client Header */}
            <div className="bg-gradient-to-br from-[#2D6A4F] to-[#1E4633] p-6 text-white">
              <div className="flex items-start justify-between mb-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 text-white font-bold text-xl flex items-center justify-center border border-white/30">
                  {selectedClient.name.substring(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-lg font-extrabold leading-tight">{selectedClient.name}</div>
              <div className="flex items-center gap-1.5 mt-1 text-white/80 text-xs">
                <Phone className="w-3.5 h-3.5" />{selectedClient.phone}
              </div>
              {selectedClient.email && (
                <div className="flex items-center gap-1.5 mt-0.5 text-white/80 text-xs">
                  <Mail className="w-3.5 h-3.5" />{selectedClient.email}
                </div>
              )}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
                <div className="text-center">
                  <div className="text-lg font-black">{selectedClient._count.bookings}</div>
                  <div className="text-[10px] text-white/70">Total Booking</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black">
                    {selectedClient.bookings.filter((b) => b.status === 'checked-in').length}
                  </div>
                  <div className="text-[10px] text-white/70">Hadir</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black">{selectedClient._count.transactions}</div>
                  <div className="text-[10px] text-white/70">Transaksi</div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Active Membership */}
              {selectedClient.memberships.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3] mb-2">Paket Aktif</div>
                  {selectedClient.memberships.slice(0, 2).map((mem) => (
                    <div key={mem.id} className={`p-3 rounded-xl border text-xs ${mem.status === 'active' ? 'bg-[#F0FAF4] border-[#D8F3DC]' : 'bg-[#FAF8F5] border-[#EAE6DF]'}`}>
                      <div className="font-bold text-[#1C2427]">{mem.pricingPlan.name}</div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[#667085]">
                        {mem.sessionsLeft !== null && (
                          <span className="text-[#2D6A4F] font-semibold">{mem.sessionsLeft} sesi tersisa</span>
                        )}
                        {mem.validUntil && (
                          <span>s/d {formatDate(mem.validUntil)}</span>
                        )}
                        <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold ${mem.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {mem.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              {selectedClient.notes && (
                <div className="p-3 rounded-xl bg-[#FFF9F0] border border-[#FDECD2]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#C08A3E] mb-1">
                    <StickyNote className="w-3 h-3" /> Catatan
                  </div>
                  <p className="text-xs text-[#475467] leading-relaxed">{selectedClient.notes}</p>
                </div>
              )}

              {/* Booking History */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3] mb-2">
                  Riwayat Booking Terakhir
                </div>
                {selectedClient.bookings.length === 0 ? (
                  <div className="text-xs text-[#98A2B3] text-center py-4">Belum ada riwayat booking</div>
                ) : (
                  <div className="space-y-2">
                    {selectedClient.bookings.slice(0, 8).map((bk) => (
                      <div key={bk.id} className="flex items-start gap-2 p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-[#1C2427] truncate">
                            {bk.classSession.service.name}
                          </div>
                          <div className="text-[10px] text-[#667085] mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {formatDateTime(bk.classSession.startTime)}
                          </div>
                          <div className="text-[10px] text-[#98A2B3]">
                            Instruktur: {bk.classSession.instructor.name}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${statusStyle[bk.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {statusLabel[bk.status] || bk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Joined */}
              <div className="text-[11px] text-[#98A2B3] text-center pt-2 border-t border-[#F2EFE9]">
                Terdaftar sejak {formatDate(selectedClient.createdAt)}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-[#F2EFE9] text-[#C8C4BC] flex items-center justify-center mb-4">
              <Users className="w-8 h-8" />
            </div>
            <div className="text-sm font-semibold text-[#667085]">Pilih Klien</div>
            <div className="text-xs text-[#98A2B3] mt-1 leading-relaxed">
              Klik nama klien di sebelah kiri untuk melihat detail profil, riwayat kelas, dan paket aktif.
            </div>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-extrabold text-[#1C2427]">Tambah Klien Baru</h2>
                <p className="text-xs text-[#667085] mt-0.5">Daftarkan member atau klien drop-in studio</p>
              </div>
              <button
                onClick={() => { setShowForm(false); setFormError(''); }}
                className="p-2 rounded-xl hover:bg-[#FAF8F5] text-[#667085] cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Anisa Rahardjo"
                  className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Nomor WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                  <input
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">Email (opsional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                  <input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    type="email"
                    placeholder="klien@email.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Catatan (riwayat cedera, preferensi) (opsional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Contoh: Punya riwayat sakit punggung, prefer sesi pagi"
                  className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427] resize-none"
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />{formError}
                </div>
              )}
              {formSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />{formSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-[#EAE6DF] text-xs font-semibold text-[#475467] hover:bg-[#FAF8F5] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4633] disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Menyimpan...' : 'Simpan Klien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

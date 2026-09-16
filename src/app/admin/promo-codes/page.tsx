'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag, Plus, X, Loader2, AlertCircle, CheckCircle2,
  Calendar, Percent, DollarSign, Trash2, Edit2, Clock,
} from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number | null;
  usageCount: number;
  computedStatus: string;
  _count: { transactions: number };
}

const formatIDR = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const statusStyle: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expired: 'bg-rose-50 text-rose-600 border-rose-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  exhausted: 'bg-gray-100 text-gray-500 border-gray-200',
};
const statusLabel: Record<string, string> = {
  active: 'Aktif',
  expired: 'Kadaluarsa',
  scheduled: 'Terjadwal',
  exhausted: 'Habis Kuota',
};

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percent',
    discountValue: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/promo-codes');
      const json = await res.json();
      if (json.ok) setPromoCodes(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  const filtered = statusFilter === 'all'
    ? promoCodes
    : promoCodes.filter((p) => p.computedStatus === statusFilter);

  const resetForm = () => {
    setFormData({ code: '', discountType: 'percent', discountValue: '', validFrom: '', validUntil: '', usageLimit: '' });
    setFormError('');
    setFormSuccess('');
    setEditId(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (p: PromoCode) => {
    setEditId(p.id);
    setFormData({
      code: p.code,
      discountType: p.discountType,
      discountValue: String(p.discountValue),
      validFrom: new Date(p.validFrom).toISOString().slice(0, 10),
      validUntil: new Date(p.validUntil).toISOString().slice(0, 10),
      usageLimit: p.usageLimit !== null ? String(p.usageLimit) : '',
    });
    setFormError('');
    setFormSuccess('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);
    try {
      const url = editId ? `/api/promo-codes/${editId}` : '/api/promo-codes';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan kode promo');
      setFormSuccess(`Kode promo "${json.data?.code}" berhasil ${editId ? 'diperbarui' : 'dibuat'}!`);
      fetchPromos();
      setTimeout(() => { setShowForm(false); resetForm(); }, 1800);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/promo-codes/${id}`, { method: 'DELETE' });
      fetchPromos();
      setDeleteId(null);
    } catch {
      /* ignore */
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#1C2427] flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#2D6A4F]" />
            Kode Promo &amp; Diskon
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">{promoCodes.length} kode promo terdaftar</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Buat Kode Promo
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'active', 'scheduled', 'expired', 'exhausted'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === s
                ? 'bg-[#2D6A4F] text-white shadow-sm'
                : 'bg-white text-[#475467] border border-[#EAE6DF] hover:border-[#2D6A4F]/30'
            }`}
          >
            {s === 'all' ? 'Semua' : statusLabel[s]}
          </button>
        ))}
      </div>

      {/* Promo Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#667085]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat kode promo...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center bg-white rounded-3xl border border-[#EAE6DF]">
          <Tag className="w-10 h-10 text-[#EAE6DF] mb-3" />
          <div className="text-sm font-semibold text-[#667085]">Belum ada kode promo</div>
          <div className="text-xs text-[#98A2B3] mt-1">Klik "Buat Kode Promo" untuk mulai</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-[#EAE6DF] p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-base font-extrabold text-[#1C2427] tracking-wider font-mono">{p.code}</div>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mt-1 ${statusStyle[p.computedStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {statusLabel[p.computedStatus] || p.computedStatus}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-1.5 rounded-lg hover:bg-[#FAF8F5] text-[#667085] cursor-pointer transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-[#667085] hover:text-rose-600 cursor-pointer transition-all"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Discount value */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#FDF4E7] text-[#C08A3E] flex items-center justify-center">
                  {p.discountType === 'percent' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#1C2427]">
                    {p.discountType === 'percent' ? `${p.discountValue}% OFF` : `${formatIDR(p.discountValue)} OFF`}
                  </div>
                  <div className="text-[10px] text-[#667085]">
                    {p.discountType === 'percent' ? 'Diskon persentase' : 'Diskon nominal'}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-[11px] text-[#667085]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-[#98A2B3]" />
                  <span>{formatDate(p.validFrom)} — {formatDate(p.validUntil)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-[#98A2B3]" />
                    <span>Digunakan: <strong className="text-[#1C2427]">{p.usageCount}</strong>
                      {p.usageLimit !== null ? ` / ${p.usageLimit}` : ' (unlimited)'}</span>
                  </div>
                  <span className="text-[10px] text-[#2D6A4F] font-semibold">
                    {p._count.transactions} transaksi
                  </span>
                </div>
              </div>

              {/* Usage bar */}
              {p.usageLimit !== null && (
                <div className="mt-3">
                  <div className="w-full h-1.5 rounded-full bg-[#F2EFE9] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        p.usageCount >= p.usageLimit ? 'bg-rose-400' : 'bg-[#2D6A4F]'
                      }`}
                      style={{ width: `${Math.min(100, (p.usageCount / p.usageLimit) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-[#1C2427] mb-2">Hapus Kode Promo?</h3>
            <p className="text-xs text-[#667085] mb-5">Kode promo akan dihapus permanen. Transaksi yang sudah menggunakan kode ini tetap tersimpan.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#EAE6DF] text-xs font-semibold text-[#475467] hover:bg-[#FAF8F5] cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-extrabold text-[#1C2427]">
                  {editId ? 'Edit Kode Promo' : 'Buat Kode Promo Baru'}
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">Atur diskon untuk klien studio</p>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-xl hover:bg-[#FAF8F5] cursor-pointer">
                <X className="w-5 h-5 text-[#667085]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Kode Promo <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="CONTOH: PILATESFIRST"
                  className="w-full px-3 py-2.5 text-sm font-mono bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427] uppercase tracking-widest"
                />
                <p className="text-[10px] text-[#98A2B3] mt-1">Huruf kapital, tanpa spasi</p>
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">Tipe Diskon</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 'percent', label: '% Persen', icon: Percent },
                    { v: 'fixed', label: 'Rp Nominal', icon: DollarSign },
                  ].map(({ v, label, icon: Icon }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, discountType: v }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        formData.discountType === v
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                          : 'bg-[#FAF8F5] text-[#475467] border-[#EAE6DF] hover:border-[#2D6A4F]/40'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Nilai Diskon <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  max={formData.discountType === 'percent' ? 100 : undefined}
                  value={formData.discountValue}
                  onChange={(e) => setFormData((f) => ({ ...f, discountValue: e.target.value }))}
                  placeholder={formData.discountType === 'percent' ? 'Contoh: 20' : 'Contoh: 50000'}
                  className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Berlaku Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData((f) => ({ ...f, validFrom: e.target.value }))}
                    className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Berlaku Sampai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData((f) => ({ ...f, validUntil: e.target.value }))}
                    className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                  />
                </div>
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Batas Penggunaan (kosongkan = unlimited)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.usageLimit}
                  onChange={(e) => setFormData((f) => ({ ...f, usageLimit: e.target.value }))}
                  placeholder="Contoh: 100"
                  className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
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
                  onClick={() => { setShowForm(false); resetForm(); }}
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
                  {submitting ? 'Menyimpan...' : editId ? 'Perbarui Promo' : 'Buat Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

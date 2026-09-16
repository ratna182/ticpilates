'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Check, Edit2, Trash2, CheckCircle2, AlertCircle, X, CreditCard, Sparkles } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  type: 'single' | 'bundle' | 'membership';
  price: number;
  sessionCount: number | null;
  durationDays: number | null;
  active: boolean;
  _count?: {
    memberships: number;
    transactions: number;
  };
}

export default function PricingPlansPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'single' | 'bundle' | 'membership'>('all');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bundle' as 'single' | 'bundle' | 'membership',
    price: 500000,
    sessionCount: 5 as number | null,
    durationDays: 30 as number | null,
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/pricing-plans');
      const data = await res.json();
      if (res.ok && data.ok) {
        setPlans(data.data);
      }
    } catch {
      showAlert('error', 'Gagal memuat paket harga');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      type: 'bundle',
      price: 1150000,
      sessionCount: 5,
      durationDays: 45,
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      type: plan.type,
      price: plan.price,
      sessionCount: plan.sessionCount,
      durationDays: plan.durationDays,
      active: plan.active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = '/api/pricing-plans';
      const method = editingPlan ? 'PUT' : 'POST';
      const body = editingPlan ? { id: editingPlan.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan paket harga');
      }

      showAlert('success', editingPlan ? 'Paket harga diperbarui' : 'Paket harga baru berhasil ditambahkan');
      setModalOpen(false);
      fetchPlans();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showAlert('error', err.message);
      } else {
        showAlert('error', 'Terjadi kesalahan sistem');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus paket harga "${name}"? Jika sudah dibeli oleh klien aktif, paket akan dinonaktifkan secara aman.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/pricing-plans?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus');
      showAlert('success', data.message || 'Paket harga berhasil diproses');
      fetchPlans();
    } catch (err: unknown) {
      if (err instanceof Error) showAlert('error', err.message);
    }
  };

  const filteredPlans = plans.filter((p) => {
    return typeFilter === 'all' || p.type === typeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1C2427]">Paket Harga & Membership</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EBF7EE] text-[#2D6A4F] font-semibold">
              {plans.length} Paket
            </span>
          </div>
          <p className="text-sm text-[#667085] mt-1">
            Kelola Single Pass, Bundling Sesi, dan Langganan Bulanan untuk klien studio.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2D6A4F] hover:bg-[#1E4633] text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Paket Baru</span>
        </button>
      </div>

      {/* Floating Alert */}
      {alert && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
            alert.type === 'success'
              ? 'bg-[#EBF7EE] border border-[#D8F3DC] text-[#2D6A4F]'
              : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)}>
            <X className="w-4 h-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Type Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            typeFilter === 'all'
              ? 'bg-[#2D6A4F] text-white shadow-xs'
              : 'bg-white text-[#667085] hover:text-[#1C2427] border border-[#EAE6DF]'
          }`}
        >
          Semua Paket
        </button>
        <button
          onClick={() => setTypeFilter('single')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            typeFilter === 'single'
              ? 'bg-[#2D6A4F] text-white shadow-xs'
              : 'bg-white text-[#667085] hover:text-[#1C2427] border border-[#EAE6DF]'
          }`}
        >
          Single Pass
        </button>
        <button
          onClick={() => setTypeFilter('bundle')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            typeFilter === 'bundle'
              ? 'bg-[#2D6A4F] text-white shadow-xs'
              : 'bg-white text-[#667085] hover:text-[#1C2427] border border-[#EAE6DF]'
          }`}
        >
          Class Pack / Bundle
        </button>
        <button
          onClick={() => setTypeFilter('membership')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            typeFilter === 'membership'
              ? 'bg-[#2D6A4F] text-white shadow-xs'
              : 'bg-white text-[#667085] hover:text-[#1C2427] border border-[#EAE6DF]'
          }`}
        >
          Membership Bulanan
        </button>
      </div>

      {/* Pricing Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#667085]">Memuat katalog paket harga...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#D1C9BE] p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#98A2B3] flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#1C2427]">Belum ada paket harga</h3>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            Buat paket harga pertama agar klien dapat membeli sesi atau langganan kelas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-6 border subtle-shadow card-hover flex flex-col justify-between relative overflow-hidden ${
                plan.type === 'membership'
                  ? 'border-[#2D6A4F] ring-1 ring-[#2D6A4F]/20'
                  : 'border-[#EAE6DF]'
              }`}
            >
              {plan.type === 'membership' && (
                <div className="absolute top-0 right-0 bg-[#2D6A4F] text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Favorit</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      plan.type === 'single'
                        ? 'bg-blue-50 text-blue-700'
                        : plan.type === 'bundle'
                        ? 'bg-[#EBF7EE] text-[#2D6A4F]'
                        : 'bg-[#FDF4E7] text-[#C08A3E]'
                    }`}
                  >
                    {plan.type === 'single'
                      ? 'Single Pass'
                      : plan.type === 'bundle'
                      ? 'Bundle Pack'
                      : 'Monthly Member'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(plan)}
                      className="p-1 text-[#98A2B3] hover:text-[#2D6A4F] rounded-lg transition-colors cursor-pointer"
                      title="Edit Paket"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id, plan.name)}
                      className="p-1 text-[#98A2B3] hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Paket"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#1C2427] leading-snug">{plan.name}</h3>

                <div className="mt-4 mb-5">
                  <div className="text-2xl font-extrabold text-[#1C2427]">
                    {formatIDR(plan.price)}
                  </div>
                  <div className="text-[11px] text-[#667085] mt-0.5">
                    {plan.sessionCount ? `${plan.sessionCount} Sesi Kelas` : 'Unlimited Akses Sesi'}
                  </div>
                </div>

                <div className="space-y-2 py-4 border-t border-[#F2EFE9] text-xs text-[#475467]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                    <span>
                      {plan.durationDays ? `Masa aktif ${plan.durationDays} hari` : 'Tanpa batas masa aktif'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                    <span>Termasuk Reformer & Tower</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                    <span>Self check-in QR Code</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#F2EFE9] flex items-center justify-between text-[11px] text-[#98A2B3]">
                <span>Status:</span>
                <span
                  className={`font-semibold ${
                    plan.active ? 'text-[#2D6A4F]' : 'text-gray-400'
                  }`}
                >
                  {plan.active ? 'Aktif Dijual' : 'Nonaktif'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Pricing Plan */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 subtle-shadow border border-[#EAE6DF] z-10 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-[#F2EFE9] mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#1C2427]">
                  {editingPlan ? 'Edit Paket Harga' : 'Tambah Paket Harga Baru'}
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Atur paket kelas, kuota sesi, dan masa berlaku.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#98A2B3] hover:text-[#1C2427] hover:bg-[#FAF8F5] rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                  Nama Paket *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Starter 5-Class Pack"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                    Tipe Paket *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as 'single' | 'bundle' | 'membership',
                        sessionCount: e.target.value === 'single' ? 1 : e.target.value === 'membership' ? null : 5,
                      })
                    }
                    className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  >
                    <option value="single">Single Class Pass</option>
                    <option value="bundle">Bundle Sesi</option>
                    <option value="membership">Membership Bulanan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                    Harga (IDR) *
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                    Jumlah Sesi (Kosongkan jika Unlimited)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.sessionCount === null ? '' : formData.sessionCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sessionCount: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                    Masa Berlaku (Hari)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 30"
                    value={formData.durationDays === null ? '' : formData.durationDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationDays: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>
              </div>

              <div className="flex items-center h-10">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1C2427]">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-[#2D6A4F] rounded border-[#EAE6DF] focus:ring-[#2D6A4F]"
                  />
                  <span>Tampilkan & Jual di Online Store</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#F2EFE9]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#667085] hover:bg-[#FAF8F5] rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {submitting ? 'Menyimpan...' : editingPlan ? 'Simpan Perubahan' : 'Buat Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

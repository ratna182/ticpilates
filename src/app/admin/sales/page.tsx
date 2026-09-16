'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Plus, X, Filter, Search, Loader2, AlertCircle,
  CheckCircle2, CreditCard, ChevronDown, FileText, Calendar, User,
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface PricingPlan {
  id: string;
  name: string;
  type: string;
  price: number;
}

interface PromoCode {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
}

interface Transaction {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  client: Client;
  pricingPlan: PricingPlan | null;
  promoCode: PromoCode | null;
  invoice: { invoiceNumber: string } | null;
}

const formatIDR = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const statusColor: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-rose-50 text-rose-600 border-rose-200',
};
const statusLabel: Record<string, string> = {
  paid: 'Lunas',
  pending: 'Menunggu',
  failed: 'Gagal',
};
const methodLabel: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer Bank',
  qris: 'QRIS',
  online: 'Online',
};

const METHODS = ['cash', 'transfer', 'qris'];

export default function SalesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalPaidCount: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [formData, setFormData] = useState({
    clientId: '',
    pricingPlanId: '',
    amount: '',
    method: 'cash',
    promoCodeId: '',
    status: 'paid',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTx = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter, take: '100' });
      const res = await fetch(`/api/sales?${params}`);
      const json = await res.json();
      if (json.ok) {
        setTransactions(json.data);
        setTotal(json.total);
        setSummary(json.summary);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const loadFormData = async () => {
    const [cr, pr, po] = await Promise.all([
      fetch('/api/customers?take=200').then((r) => r.json()),
      fetch('/api/pricing-plans').then((r) => r.json()),
      fetch('/api/promo-codes').then((r) => r.json()),
    ]);
    if (cr.ok) setClients(cr.data);
    if (pr.ok) setPlans(pr.data);
    if (po.ok) setPromoCodes(po.data);
  };

  const openForm = () => {
    setShowForm(true);
    setFormError('');
    setFormSuccess('');
    setFormData({ clientId: '', pricingPlanId: '', amount: '', method: 'cash', promoCodeId: '', status: 'paid' });
    loadFormData();
  };

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    setFormData((f) => ({
      ...f,
      pricingPlanId: planId,
      amount: plan ? String(plan.price) : f.amount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal membuat transaksi');
      setFormSuccess(`Transaksi berhasil! Invoice: ${json.data?.invoice?.invoiceNumber || '-'}`);
      fetchTx();
      setTimeout(() => { setShowForm(false); setFormSuccess(''); }, 2000);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#1C2427] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#2D6A4F]" />
            Sales &amp; Invoices
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">{total} transaksi tercatat</p>
        </div>
        <button
          onClick={openForm}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Input Transaksi Manual
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Pendapatan', value: formatIDR(summary.totalRevenue), sub: 'semua waktu (lunas)', color: 'text-[#2D6A4F]' },
          { label: 'Jumlah Lunas', value: `${summary.totalPaidCount} transaksi`, sub: 'semua waktu', color: 'text-[#2D6A4F]' },
          { label: 'Tampil Sekarang', value: `${transactions.length}`, sub: statusFilter === 'all' ? 'semua status' : statusFilter, color: 'text-[#1C2427]' },
          { label: 'Total Transaksi', value: total, sub: 'terdaftar di sistem', color: 'text-[#1C2427]' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-xs">
            <div className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider mb-1">{s.label}</div>
            <div className={`text-lg font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-[#98A2B3] mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'paid', 'pending', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === s
                ? 'bg-[#2D6A4F] text-white shadow-sm'
                : 'bg-white text-[#475467] border border-[#EAE6DF] hover:border-[#2D6A4F]/30'
            }`}
          >
            {s === 'all' ? 'Semua Status' : statusLabel[s] || s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-[#EAE6DF] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[#667085]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat transaksi...
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Receipt className="w-10 h-10 text-[#EAE6DF] mb-3" />
            <div className="text-sm font-semibold text-[#667085]">Belum ada transaksi</div>
            <div className="text-xs text-[#98A2B3] mt-1">Input transaksi manual atau tunggu pembelian dari Online Store</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#F2EFE9] bg-[#FAF8F5]">
                  {['Invoice', 'Klien', 'Paket / Item', 'Metode', 'Jumlah', 'Status', 'Tanggal'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-[#F2EFE9] hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[#2D6A4F] font-semibold">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        {tx.invoice?.invoiceNumber || <span className="text-[#98A2B3]">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1C2427]">{tx.client.name}</div>
                      <div className="text-[10px] text-[#98A2B3]">{tx.client.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      {tx.pricingPlan ? (
                        <div>
                          <div className="font-semibold text-[#1C2427]">{tx.pricingPlan.name}</div>
                          {tx.promoCode && (
                            <div className="text-[10px] text-[#C08A3E]">Promo: {tx.promoCode.code}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#98A2B3]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#475467]">
                        {methodLabel[tx.method] || tx.method}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-[#1C2427]">{formatIDR(tx.amount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusColor[tx.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {statusLabel[tx.status] || tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#667085]">{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Transaction Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-extrabold text-[#1C2427]">Input Transaksi Manual</h2>
                <p className="text-xs text-[#667085] mt-0.5">Catat penjualan paket yang dibayar langsung di studio</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-[#FAF8F5] cursor-pointer">
                <X className="w-5 h-5 text-[#667085]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Client */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Klien <span className="text-rose-500">*</span>
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#98A2B3]" />
                  <input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Cari nama atau nomor..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
                  />
                </div>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData((f) => ({ ...f, clientId: e.target.value }))}
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                >
                  <option value="">-- Pilih Klien --</option>
                  {filteredClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing Plan */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Paket Harga <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.pricingPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                >
                  <option value="">-- Pilih Paket --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatIDR(p.price)} ({p.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Jumlah Pembayaran (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  value={formData.amount}
                  onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="250000"
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                />
              </div>

              {/* Method */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Metode Pembayaran <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, method: m }))}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        formData.method === m
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                          : 'bg-[#FAF8F5] text-[#475467] border-[#EAE6DF] hover:border-[#2D6A4F]/40'
                      }`}
                    >
                      {methodLabel[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo Code */}
              {promoCodes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Kode Promo (opsional)</label>
                  <select
                    value={formData.promoCodeId}
                    onChange={(e) => setFormData((f) => ({ ...f, promoCodeId: e.target.value }))}
                    className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1C2427]"
                  >
                    <option value="">-- Tanpa Promo --</option>
                    {promoCodes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} ({p.discountType === 'percent' ? `${p.discountValue}%` : formatIDR(p.discountValue)} off)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">Status Pembayaran</label>
                <div className="flex gap-2">
                  {['paid', 'pending'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, status: s }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        formData.status === s
                          ? s === 'paid'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-amber-500 text-white border-amber-500'
                          : 'bg-[#FAF8F5] text-[#475467] border-[#EAE6DF] hover:border-[#2D6A4F]/40'
                      }`}
                    >
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>
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
                  onClick={() => setShowForm(false)}
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
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

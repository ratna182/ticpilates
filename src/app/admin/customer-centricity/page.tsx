'use client';

import React, { useState, useEffect } from 'react';
import {
  HeartHandshake, Star, MessageSquare, TrendingUp,
  Loader2, Users, CheckCircle2, AlertCircle, ThumbsUp, Award,
} from 'lucide-react';

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  client: { name: string; phone: string };
}

interface Client {
  id: string;
  name: string;
  phone: string;
  _count: { bookings: number };
  bookings: { status: string; createdAt: string }[];
}

const STAR_COLORS = ['', 'text-rose-500', 'text-orange-400', 'text-amber-400', 'text-lime-500', 'text-emerald-500'];

export default function CustomerCentricityPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [topClients, setTopClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ clientId: '', rating: 5, comment: '' });
  const [clients, setClients] = useState<Client[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/customer-centricity/feedbacks').then((r) => r.json()),
      fetch('/api/customers?take=200').then((r) => r.json()),
    ]).then(([feedbackJson, clientsJson]) => {
      if (feedbackJson.ok) setFeedbacks(feedbackJson.data);
      if (clientsJson.ok) {
        setClients(clientsJson.data);
        // Top clients by bookings
        const sorted = [...clientsJson.data].sort((a: Client, b: Client) => b._count.bookings - a._count.bookings);
        setTopClients(sorted.slice(0, 5));
      }
    }).finally(() => setLoading(false));
  }, []);

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '—';

  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: feedbacks.filter((f) => f.rating === r).length,
  }));

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackData.clientId) {
      setSubmitResult({ ok: false, msg: 'Pilih klien terlebih dahulu' });
      return;
    }
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch('/api/customer-centricity/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan feedback');
      setSubmitResult({ ok: true, msg: 'Feedback berhasil dicatat!' });
      setFeedbacks((prev) => [{ ...json.data, client: clients.find(c => c.id === feedbackData.clientId) || { name: '—', phone: '' } }, ...prev]);
      setFeedbackData({ clientId: '', rating: 5, comment: '' });
      setTimeout(() => { setShowFeedbackForm(false); setSubmitResult(null); }, 1800);
    } catch (err: any) {
      setSubmitResult({ ok: false, msg: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#667085]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#1C2427] flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#2D6A4F]" />
            Customer Centricity
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">Riwayat interaksi, rating, dan retensi klien studio</p>
        </div>
        <button
          onClick={() => { setShowFeedbackForm(true); setSubmitResult(null); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Star className="w-4 h-4" />
          Input Feedback
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Rata-rata Rating', value: avgRating, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Total Feedback', value: feedbacks.length, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Klien', value: clients.length, icon: Users, color: 'text-[#2D6A4F]', bg: 'bg-[#EBF7EE]' },
          { label: 'Member Aktif', value: topClients.filter(c => c._count.bookings > 0).length, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-4 border border-[#EAE6DF]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider">{stat.label}</div>
                <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF]">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="w-4 h-4 text-[#2D6A4F]" />
            <h3 className="text-sm font-bold text-[#1C2427]">Distribusi Rating</h3>
          </div>
          {feedbacks.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-[#98A2B3]">Belum ada feedback</div>
          ) : (
            <div className="space-y-2.5">
              {ratingDistribution.map(({ rating, count }) => {
                const pct = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16 shrink-0">
                      <Star className={`w-3.5 h-3.5 ${STAR_COLORS[rating]} fill-current`} />
                      <span className="text-xs font-semibold text-[#1C2427]">{rating}</span>
                    </div>
                    <div className="flex-1 h-2.5 rounded-full bg-[#F2EFE9] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#667085] w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Loyal Clients */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF]">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-[#C08A3E]" />
            <h3 className="text-sm font-bold text-[#1C2427]">Member Paling Loyal</h3>
          </div>
          {topClients.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-[#98A2B3]">Belum ada data klien</div>
          ) : (
            <div className="space-y-3">
              {topClients.map((client, i) => (
                <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-[#EBF7EE] text-[#2D6A4F]'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#1C2427] truncate">{client.name}</div>
                    <div className="text-[10px] text-[#98A2B3]">{client.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-[#2D6A4F]">{client._count.bookings}</div>
                    <div className="text-[9px] text-[#98A2B3]">booking</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Feedbacks */}
      <div className="bg-white rounded-3xl border border-[#EAE6DF] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F2EFE9] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#2D6A4F]" />
          <h3 className="text-sm font-bold text-[#1C2427]">Riwayat Feedback Terbaru</h3>
        </div>
        {feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Star className="w-8 h-8 text-[#EAE6DF] mb-2" />
            <div className="text-xs text-[#98A2B3]">Belum ada feedback yang direkam</div>
          </div>
        ) : (
          <div className="divide-y divide-[#F2EFE9]">
            {feedbacks.slice(0, 10).map((fb) => (
              <div key={fb.id} className="px-6 py-4 hover:bg-[#FAF8F5]/60 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#EBF7EE] text-[#2D6A4F] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D8F3DC]">
                      {fb.client?.name?.substring(0, 2).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1C2427]">{fb.client?.name || '—'}</div>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= fb.rating ? 'text-amber-400 fill-current' : 'text-[#D0D5DD]'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#98A2B3] whitespace-nowrap shrink-0">{formatDate(fb.createdAt)}</span>
                </div>
                {fb.comment && (
                  <p className="text-xs text-[#475467] mt-2 leading-relaxed pl-11">{fb.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-extrabold text-[#1C2427]">Input Feedback Klien</h2>
              <button onClick={() => setShowFeedbackForm(false)} className="p-2 rounded-xl hover:bg-[#FAF8F5] cursor-pointer">
                <span className="text-[#667085] text-lg">×</span>
              </button>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">Klien *</label>
                <select
                  required
                  value={feedbackData.clientId}
                  onChange={(e) => setFeedbackData((f) => ({ ...f, clientId: e.target.value }))}
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
                >
                  <option value="">-- Pilih Klien --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-2">Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFeedbackData((f) => ({ ...f, rating: r }))}
                      className="cursor-pointer"
                    >
                      <Star className={`w-8 h-8 transition-all ${r <= feedbackData.rating ? 'text-amber-400 fill-current' : 'text-[#D0D5DD]'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">Komentar (opsional)</label>
                <textarea
                  rows={3}
                  value={feedbackData.comment}
                  onChange={(e) => setFeedbackData((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Pengalaman klien di studio..."
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 resize-none"
                />
              </div>
              {submitResult && (
                <div className={`flex items-center gap-2 text-xs rounded-xl p-3 border ${submitResult.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                  {submitResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {submitResult.msg}
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowFeedbackForm(false)} className="flex-1 py-2.5 rounded-xl border border-[#EAE6DF] text-xs font-semibold text-[#475467] hover:bg-[#FAF8F5] cursor-pointer">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Menyimpan...' : 'Simpan Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

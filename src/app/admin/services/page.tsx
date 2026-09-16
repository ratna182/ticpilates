'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Search, Users, Clock, Edit2, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  type: 'group' | 'private';
  durationMin: number;
  defaultCapacity: number;
  description: string | null;
  active: boolean;
  _count?: {
    classSessions: number;
  };
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'group' | 'private'>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'group' as 'group' | 'private',
    durationMin: 50,
    defaultCapacity: 6,
    description: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (res.ok && data.ok) {
        setServices(data.data);
      }
    } catch {
      showAlert('error', 'Gagal memuat data layanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      type: 'group',
      durationMin: 50,
      defaultCapacity: 6,
      description: '',
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (srv: Service) => {
    setEditingService(srv);
    setFormData({
      name: srv.name,
      type: srv.type,
      durationMin: srv.durationMin,
      defaultCapacity: srv.defaultCapacity,
      description: srv.description || '',
      active: srv.active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = '/api/services';
      const method = editingService ? 'PUT' : 'POST';
      const body = editingService ? { id: editingService.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan layanan');
      }

      showAlert('success', editingService ? 'Layanan berhasil diperbarui' : 'Layanan baru berhasil ditambahkan');
      setModalOpen(false);
      fetchServices();
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
    if (!confirm(`Hapus layanan "${name}"? Jika sudah terkait jadwal kelas, layanan akan dinonaktifkan secara aman.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus');
      showAlert('success', data.message || 'Layanan berhasil diproses');
      fetchServices();
    } catch (err: unknown) {
      if (err instanceof Error) showAlert('error', err.message);
    }
  };

  const filteredServices = services.filter((srv) => {
    const matchSearch = srv.name.toLowerCase().includes(search.toLowerCase()) ||
      (srv.description && srv.description.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === 'all' || srv.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1C2427]">Katalog Layanan (Services)</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EBF7EE] text-[#2D6A4F] font-semibold">
              {services.length} Layanan
            </span>
          </div>
          <p className="text-sm text-[#667085] mt-1">
            Atur jenis kelas Pilates (Group / Private), durasi, dan kapasitas default untuk jadwal studio.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2D6A4F] hover:bg-[#1E4633] text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Layanan</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] flex flex-col sm:flex-row gap-3 items-center justify-between subtle-shadow">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama layanan atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE6DF] w-full sm:w-auto justify-center">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === 'all' ? 'bg-white text-[#1C2427] shadow-xs font-semibold' : 'text-[#667085] hover:text-[#1C2427]'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setTypeFilter('group')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === 'group' ? 'bg-white text-[#1C2427] shadow-xs font-semibold' : 'text-[#667085] hover:text-[#1C2427]'
            }`}
          >
            Group Class
          </button>
          <button
            onClick={() => setTypeFilter('private')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === 'private' ? 'bg-white text-[#1C2427] shadow-xs font-semibold' : 'text-[#667085] hover:text-[#1C2427]'
            }`}
          >
            Private 1-on-1
          </button>
        </div>
      </div>

      {/* Services Grid / Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#667085]">Memuat katalog layanan studio...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#D1C9BE] p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#98A2B3] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#1C2427]">Tidak ada layanan ditemukan</h3>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            {search ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan menambahkan layanan Pilates baru untuk studio Anda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl p-5 border border-[#EAE6DF] subtle-shadow card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          srv.type === 'group'
                            ? 'bg-[#EBF7EE] text-[#2D6A4F]'
                            : 'bg-[#FDF4E7] text-[#C08A3E]'
                        }`}
                      >
                        {srv.type === 'group' ? 'Group Class' : 'Private Session'}
                      </span>
                      {!srv.active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#1C2427] mt-1.5">{srv.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(srv)}
                      className="p-1.5 text-[#667085] hover:text-[#2D6A4F] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                      title="Edit Layanan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(srv.id, srv.name)}
                      className="p-1.5 text-[#667085] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Layanan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#667085] line-clamp-2 mb-4 leading-relaxed">
                  {srv.description || 'Tidak ada keterangan tambahan untuk layanan ini.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#F2EFE9] flex items-center justify-between text-xs text-[#667085]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 font-medium text-[#1C2427]">
                    <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>{srv.durationMin} Menit</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-[#1C2427]">
                    <Users className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>Maks. {srv.defaultCapacity} Peserta</span>
                  </div>
                </div>

                <div className="text-[11px] text-[#98A2B3]">
                  {srv._count?.classSessions || 0} Sesi terjadwal
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Service */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 subtle-shadow border border-[#EAE6DF] z-10 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-[#F2EFE9] mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#1C2427]">
                  {editingService ? 'Edit Layanan Pilates' : 'Tambah Layanan Baru'}
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Isi parameter kelas untuk katalog studio.
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
                  Nama Layanan / Kelas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Reformer Foundation (Group)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                    Tipe Kelas *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'group' | 'private' })}
                    className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  >
                    <option value="group">Group Class</option>
                    <option value="private">Private 1-on-1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                    Durasi (Menit) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    required
                    value={formData.durationMin}
                    onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                    Kapasitas Default (Orang) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formData.defaultCapacity}
                    onChange={(e) => setFormData({ ...formData, defaultCapacity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                    Status Layanan
                  </label>
                  <div className="flex items-center h-10">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1C2427]">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 text-[#2D6A4F] rounded border-[#EAE6DF] focus:ring-[#2D6A4F]"
                      />
                      <span>Tampilkan & Aktifkan</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                  Deskripsi & Fokus Latihan
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan fokus gerakan, peralatan yang digunakan, atau tingkat kesulitan..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
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
                  {submitting ? 'Menyimpan...' : editingService ? 'Simpan Perubahan' : 'Buat Layanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

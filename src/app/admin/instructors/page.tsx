'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, Calendar, Edit2, Trash2, CheckCircle2, AlertCircle, X, Award } from 'lucide-react';

interface Instructor {
  id: string;
  name: string;
  phone: string | null;
  bio: string | null;
  photoUrl: string | null;
  active: boolean;
  _count?: {
    classSessions: number;
  };
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Instructor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    photoUrl: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInstructors = async () => {
    try {
      const res = await fetch('/api/instructors');
      const data = await res.json();
      if (res.ok && data.ok) {
        setInstructors(data.data);
      }
    } catch {
      showAlert('error', 'Gagal memuat data instruktur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingInst(null);
    setFormData({
      name: '',
      phone: '',
      bio: '',
      photoUrl: '',
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (inst: Instructor) => {
    setEditingInst(inst);
    setFormData({
      name: inst.name,
      phone: inst.phone || '',
      bio: inst.bio || '',
      photoUrl: inst.photoUrl || '',
      active: inst.active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = '/api/instructors';
      const method = editingInst ? 'PUT' : 'POST';
      const body = editingInst ? { id: editingInst.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan instruktur');
      }

      showAlert('success', editingInst ? 'Data instruktur diperbarui' : 'Instruktur baru berhasil didaftarkan');
      setModalOpen(false);
      fetchInstructors();
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
    if (!confirm(`Hapus data instruktur "${name}"? Jika sudah mengajar sesi kelas, status akan dinonaktifkan secara aman.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/instructors?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus');
      showAlert('success', data.message || 'Instruktur berhasil diproses');
      fetchInstructors();
    } catch (err: unknown) {
      if (err instanceof Error) showAlert('error', err.message);
    }
  };

  const filteredInstructors = instructors.filter((inst) => {
    const matchSearch =
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      (inst.bio && inst.bio.toLowerCase().includes(search.toLowerCase())) ||
      (inst.phone && inst.phone.includes(search));
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1C2427]">Instruktur Pilates</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EBF7EE] text-[#2D6A4F] font-semibold">
              {instructors.length} Instruktur
            </span>
          </div>
          <p className="text-sm text-[#667085] mt-1">
            Data referensi pelatih & pengajar untuk alokasi jadwal kelas di studio TICPILATES.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2D6A4F] hover:bg-[#1E4633] text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Instruktur</span>
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] flex gap-3 items-center subtle-shadow">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama instruktur, keahlian, atau nomor HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>
      </div>

      {/* Instructors Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#667085]">Memuat data instruktur...</p>
        </div>
      ) : filteredInstructors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#D1C9BE] p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#98A2B3] flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#1C2427]">Tidak ada instruktur</h3>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            {search ? 'Coba ubah kata kunci pencarian Anda' : 'Daftarkan pelatih Pilates pertama untuk studio Anda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredInstructors.map((inst) => (
            <div
              key={inst.id}
              className="bg-white rounded-2xl p-5 border border-[#EAE6DF] subtle-shadow card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-center font-bold text-[#2D6A4F] text-base shrink-0">
                      {inst.photoUrl ? (
                        <img
                          src={inst.photoUrl}
                          alt={inst.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        inst.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1C2427] leading-tight">{inst.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            inst.active ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}
                        />
                        <span className="text-[11px] text-[#667085]">
                          {inst.active ? 'Aktif Mengajar' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(inst)}
                      className="p-1.5 text-[#667085] hover:text-[#2D6A4F] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                      title="Edit Instruktur"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(inst.id, inst.name)}
                      className="p-1.5 text-[#667085] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Instruktur"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#667085] line-clamp-3 mb-4 leading-relaxed">
                  {inst.bio || 'Belum ada catatan bio atau sertifikasi untuk instruktur ini.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#F2EFE9] space-y-2 text-xs">
                {inst.phone && (
                  <div className="flex items-center gap-2 text-[#667085]">
                    <Phone className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>{inst.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-[#98A2B3]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" />
                    <span>{inst._count?.classSessions || 0} Sesi terjadwal</span>
                  </div>
                  <span className="font-semibold text-[#2D6A4F]">Sertifikasi Pilates</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Instructor */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 subtle-shadow border border-[#EAE6DF] z-10 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-[#F2EFE9] mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#1C2427]">
                  {editingInst ? 'Edit Profil Instruktur' : 'Daftarkan Instruktur Baru'}
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Lengkapi data profil pelatih studio Pilates.
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
                  Nama Lengkap Instruktur *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sarah Jenkins"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                    Status Mengajar
                  </label>
                  <div className="flex items-center h-10">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1C2427]">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 text-[#2D6A4F] rounded border-[#EAE6DF] focus:ring-[#2D6A4F]"
                      />
                      <span>Aktif Mengajar</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                  URL Foto Profil (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1C2427] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C2427] mb-1.5">
                  Bio, Sertifikasi & Spesialisasi
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Comprehensive Reformer Instructor, spesialis skoliosis & rehabilitasi postur..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
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
                  {submitting ? 'Menyimpan...' : editingInst ? 'Simpan Perubahan' : 'Daftarkan Instruktur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

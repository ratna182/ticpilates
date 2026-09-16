'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Phone,
  Trash2,
  XCircle,
  Sparkles,
  QrCode,
  ArrowUpRight,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';

interface Instructor {
  id: string;
  name: string;
  photoUrl?: string | null;
  active: boolean;
}

interface Service {
  id: string;
  name: string;
  type: 'group' | 'private';
  durationMin: number;
  defaultCapacity: number;
  active: boolean;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
}

interface Booking {
  id: string;
  status: 'pending' | 'confirmed' | 'checked-in' | 'cancelled';
  qrCode: string;
  heldUntil?: string | null;
  client: Client;
  transaction?: {
    id: string;
    amount: number;
    method: string;
    status: string;
  } | null;
}

interface ClassSession {
  id: string;
  serviceId: string;
  instructorId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: 'scheduled' | 'cancelled' | 'completed';
  service: Service;
  instructor: Instructor;
  bookings: Booking[];
  bookedCount: number;
  availableSlots: number;
  isFull: boolean;
}

export default function SchedulePage() {
  // Current selected date in 'YYYY-MM-DD'
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [instructorFilter, setInstructorFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // New Session Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: '',
    instructorId: '',
    date: todayStr,
    startTimeHour: '08:00',
    endTimeHour: '08:50',
    capacity: 6,
  });

  // Attendee Modal
  const [selectedSessionForAttendees, setSelectedSessionForAttendees] = useState<ClassSession | null>(null);

  // Notification Toast
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Fetch initial master data
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [resSrv, resInst] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/instructors'),
        ]);
        const dataSrv = await resSrv.json();
        const dataInst = await resInst.json();

        if (resSrv.ok && dataSrv.ok) setServices(dataSrv.data.filter((s: Service) => s.active));
        if (resInst.ok && dataInst.ok) setInstructors(dataInst.data.filter((i: Instructor) => i.active));
      } catch (err) {
        console.error('Error fetching master data:', err);
      }
    };
    fetchMasters();
  }, []);

  // Fetch sessions when selectedDate or filters change
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.set('date', selectedDate);
      if (instructorFilter !== 'all') params.set('instructorId', instructorFilter);
      if (serviceFilter !== 'all') params.set('serviceId', serviceFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/schedule?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setSessions(data.data);
      } else {
        showAlert('error', data.error || 'Gagal memuat jadwal sesi');
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      showAlert('error', 'Terjadi kesalahan koneksi saat memuat jadwal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedDate, instructorFilter, serviceFilter, statusFilter]);

  // Date Shift Helpers
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().slice(0, 10));
  };

  // Human readable date format
  const formattedDateTitle = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  // Quick date tags
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const dayAfterTomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }, []);

  // Compute Daily Statistics
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => s.status === 'scheduled');
    const totalCapacity = activeSessions.reduce((acc, s) => acc + s.capacity, 0);
    const totalBooked = activeSessions.reduce((acc, s) => acc + s.bookedCount, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
    const uniqueInstructors = new Set(sessions.map((s) => s.instructorId)).size;

    return {
      totalSessions,
      totalCapacity,
      totalBooked,
      occupancyRate,
      uniqueInstructors,
    };
  }, [sessions]);

  // Handle service change in new session form -> auto duration & capacity
  const handleServiceSelect = (serviceId: string) => {
    const selected = services.find((s) => s.id === serviceId);
    if (!selected) {
      setFormData((prev) => ({ ...prev, serviceId: '' }));
      return;
    }

    // calculate end time from start time + duration
    const [h, m] = formData.startTimeHour.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(h, m, 0, 0);
    const endDate = new Date(startDate.getTime() + selected.durationMin * 60 * 1000);
    const endH = String(endDate.getHours()).padStart(2, '0');
    const endM = String(endDate.getMinutes()).padStart(2, '0');

    setFormData((prev) => ({
      ...prev,
      serviceId,
      capacity: selected.defaultCapacity,
      endTimeHour: `${endH}:${endM}`,
    }));
  };

  const handleStartTimeChange = (startHour: string) => {
    const selectedSrv = services.find((s) => s.id === formData.serviceId);
    const duration = selectedSrv ? selectedSrv.durationMin : 50;

    const [h, m] = startHour.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(h, m, 0, 0);
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
    const endH = String(endDate.getHours()).padStart(2, '0');
    const endM = String(endDate.getMinutes()).padStart(2, '0');

    setFormData((prev) => ({
      ...prev,
      startTimeHour: startHour,
      endTimeHour: `${endH}:${endM}`,
    }));
  };

  // Client-side conflict detection preview
  const conflictWarning = useMemo(() => {
    if (!formData.instructorId || !formData.date || !formData.startTimeHour || !formData.endTimeHour) {
      return null;
    }

    const start = new Date(`${formData.date}T${formData.startTimeHour}:00`);
    const end = new Date(`${formData.date}T${formData.endTimeHour}:00`);

    const conflict = sessions.find((s) => {
      if (s.instructorId !== formData.instructorId || s.status === 'cancelled') return false;
      const sStart = new Date(s.startTime);
      const sEnd = new Date(s.endTime);
      return sStart < end && sEnd > start;
    });

    if (conflict) {
      const sStartStr = new Date(conflict.startTime).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const sEndStr = new Date(conflict.endTime).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `⚠️ Konflik: Instruktur ${conflict.instructor.name} sudah memiliki jadwal "${conflict.service.name}" pada ${sStartStr} - ${sEndStr} WIB.`;
    }
    return null;
  }, [formData, sessions]);

  // Submit New Session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceId || !formData.instructorId) {
      showAlert('error', 'Pilih layanan dan instruktur terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      const startDateTime = `${formData.date}T${formData.startTimeHour}:00`;
      const endDateTime = `${formData.date}T${formData.endTimeHour}:00`;

      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          instructorId: formData.instructorId,
          startTime: startDateTime,
          endTime: endDateTime,
          capacity: formData.capacity,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        showAlert('success', 'Sesi kelas baru berhasil ditambahkan ke kalender');
        setModalOpen(false);
        fetchSessions();
      } else {
        showAlert('error', data.error || 'Gagal menambahkan sesi kelas');
      }
    } catch (err) {
      console.error('Error creating session:', err);
      showAlert('error', 'Terjadi kesalahan sistem saat membuat sesi');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel / Toggle Session Status
  const handleToggleStatus = async (session: ClassSession, newStatus: 'scheduled' | 'cancelled' | 'completed') => {
    const confirmMsg =
      newStatus === 'cancelled'
        ? `Apakah Anda yakin ingin membatalkan sesi "${session.service.name}"? Klien yang sudah memesan akan diberitahu.`
        : `Ubah status sesi menjadi "${newStatus}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/schedule/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showAlert('success', `Status sesi berhasil diubah menjadi ${newStatus}`);
        fetchSessions();
      } else {
        showAlert('error', data.error || 'Gagal mengubah status sesi');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Gagal memperbarui status');
    }
  };

  // Delete Session
  const handleDeleteSession = async (session: ClassSession) => {
    if (!window.confirm(`Hapus sesi "${session.service.name}" secara permanen?`)) return;

    try {
      const res = await fetch(`/api/schedule/${session.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showAlert('success', data.message || 'Sesi kelas berhasil dihapus');
        fetchSessions();
      } else {
        showAlert('error', data.error || 'Gagal menghapus sesi');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Gagal menghapus sesi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alert && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm transition-all ${
            alert.type === 'success'
              ? 'bg-[#EBF7EE] text-[#2D6A4F] border border-[#B7E4C7]'
              : 'bg-[#FDF2F2] text-[#D92D20] border border-[#FECDCA]'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#D92D20]" />
            )}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Date Controller */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAE6DF] subtle-shadow">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#EBF7EE] text-[#2D6A4F]">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-[#1C2427]">Jadwal Kelas Pilates (Schedule)</h1>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Atur kalender harian studio Kemang, alokasi instruktur, kapasitas slot, dan status kehadiran kelas.
          </p>
        </div>

        {/* Date Navigator Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#FAF8F5] p-1 rounded-2xl border border-[#EAE6DF]">
            <button
              onClick={() => shiftDate(-1)}
              title="Hari Sebelumnya"
              className="p-1.5 text-[#475467] hover:text-[#1C2427] hover:bg-white rounded-xl transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 text-xs font-bold text-[#1C2427] bg-transparent border-0 focus:outline-none cursor-pointer"
            />

            <button
              onClick={() => shiftDate(1)}
              title="Hari Berikutnya"
              className="p-1.5 text-[#475467] hover:text-[#1C2427] hover:bg-white rounded-xl transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Date Pills */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                selectedDate === todayStr
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-white text-[#475467] border-[#EAE6DF] hover:bg-[#FAF8F5]'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                selectedDate === tomorrowStr
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-white text-[#475467] border-[#EAE6DF] hover:bg-[#FAF8F5]'
              }`}
            >
              Besok
            </button>
            <button
              onClick={() => setSelectedDate(dayAfterTomorrowStr)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                selectedDate === dayAfterTomorrowStr
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-white text-[#475467] border-[#EAE6DF] hover:bg-[#FAF8F5]'
              }`}
            >
              Lusa
            </button>
          </div>

          <button
            onClick={() => {
              setFormData({
                serviceId: services[0]?.id || '',
                instructorId: instructors[0]?.id || '',
                date: selectedDate,
                startTimeHour: '08:00',
                endTimeHour: '08:50',
                capacity: services[0]?.defaultCapacity || 6,
              });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-semibold rounded-2xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Sesi Kelas</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] subtle-shadow">
          <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
            Total Sesi Hari Ini
          </div>
          <div className="text-2xl font-extrabold text-[#1C2427] mt-1">{stats.totalSessions}</div>
          <div className="text-[11px] text-[#2D6A4F] font-medium mt-1">{formattedDateTitle}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] subtle-shadow">
          <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
            Peserta / Kapasitas
          </div>
          <div className="text-2xl font-extrabold text-[#1C2427] mt-1">
            {stats.totalBooked}{' '}
            <span className="text-xs font-semibold text-[#667085]">/ {stats.totalCapacity} slot</span>
          </div>
          <div className="text-[11px] text-[#667085] mt-1">
            Sisa {Math.max(0, stats.totalCapacity - stats.totalBooked)} slot tersedia
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] subtle-shadow">
          <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
            Tingkat Okupansi
          </div>
          <div className="text-2xl font-extrabold text-[#2D6A4F] mt-1">{stats.occupancyRate}%</div>
          <div className="w-full bg-[#FAF8F5] rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                stats.occupancyRate > 80 ? 'bg-[#2D6A4F]' : stats.occupancyRate > 40 ? 'bg-[#52B788]' : 'bg-[#D1C9BE]'
              }`}
              style={{ width: `${Math.min(100, stats.occupancyRate)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] subtle-shadow">
          <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
            Instruktur Bertugas
          </div>
          <div className="text-2xl font-extrabold text-[#1C2427] mt-1">
            {stats.uniqueInstructors}{' '}
            <span className="text-xs font-semibold text-[#667085]">Coach</span>
          </div>
          <div className="text-[11px] text-[#667085] mt-1">Terjadwal mengajar hari ini</div>
        </div>
      </div>

      {/* Filter & View Mode Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] subtle-shadow flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-[#667085]">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filter:</span>
          </div>

          {/* Instruktur Filter */}
          <select
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] text-[#1C2427] focus:outline-none"
          >
            <option value="all">Semua Instruktur</option>
            {instructors.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>

          {/* Layanan Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] text-[#1C2427] focus:outline-none"
          >
            <option value="all">Semua Jenis Layanan</option>
            {services.map((srv) => (
              <option key={srv.id} value={srv.id}>
                {srv.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] text-[#1C2427] focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="scheduled">Terjadwal (Scheduled)</option>
            <option value="completed">Selesai (Completed)</option>
            <option value="cancelled">Dibatalkan (Cancelled)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchSessions()}
            className="p-1.5 rounded-xl border border-[#EAE6DF] hover:bg-[#FAF8F5] text-[#667085] transition-all"
            title="Refresh Jadwal"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE6DF]">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'cards' ? 'bg-white shadow-xs text-[#1C2427]' : 'text-[#667085]'
              }`}
            >
              Timeline Kartu
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white shadow-xs text-[#1C2427]' : 'text-[#667085]'
              }`}
            >
              Tabel
            </button>
          </div>
        </div>
      </div>

      {/* Main Schedule Display */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE6DF]">
          <div className="inline-block w-8 h-8 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-[#667085]">Memuat jadwal kelas studio...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-[#D1C9BE]">
          <CalendarIcon className="w-10 h-10 text-[#C08A3E] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-[#1C2427]">Belum Ada Sesi Kelas pada Tanggal Ini</h3>
          <p className="text-xs text-[#667085] max-w-md mx-auto mt-1">
            Tidak ada jadwal Pilates yang sesuai dengan filter tanggal {formattedDateTitle}. Klik tombol di bawah untuk membuat sesi baru.
          </p>
          <button
            onClick={() => {
              setFormData({
                serviceId: services[0]?.id || '',
                instructorId: instructors[0]?.id || '',
                date: selectedDate,
                startTimeHour: '08:00',
                endTimeHour: '08:50',
                capacity: services[0]?.defaultCapacity || 6,
              });
              setModalOpen(true);
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Sesi Kelas Baru</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Card Timeline View */
        <div className="space-y-4">
          {sessions.map((session) => {
            const startTimeStr = new Date(session.startTime).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const endTimeStr = new Date(session.endTime).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const pct = Math.round((session.bookedCount / session.capacity) * 100);

            return (
              <div
                key={session.id}
                className={`bg-white rounded-3xl p-6 border transition-all subtle-shadow ${
                  session.status === 'cancelled'
                    ? 'border-[#FECDCA] bg-[#FFFBFB] opacity-75'
                    : session.isFull
                    ? 'border-[#B7E4C7]'
                    : 'border-[#EAE6DF] hover:border-[#2D6A4F]/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Time and Service Info */}
                  <div className="flex items-start gap-4">
                    {/* Time Pill */}
                    <div className="w-28 shrink-0 text-center p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF]">
                      <div className="text-base font-extrabold text-[#1C2427] leading-none">
                        {startTimeStr}
                      </div>
                      <div className="text-[11px] font-semibold text-[#667085] mt-1">s/d {endTimeStr}</div>
                      <span className="text-[10px] text-[#2D6A4F] block font-bold mt-1">
                        {session.service.durationMin} Menit
                      </span>
                    </div>

                    {/* Class Details */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg ${
                            session.service.type === 'group'
                              ? 'bg-[#EBF7EE] text-[#2D6A4F]'
                              : 'bg-[#FDF4E7] text-[#C08A3E]'
                          }`}
                        >
                          {session.service.type === 'group' ? 'Group Class' : 'Private 1-on-1'}
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                            session.status === 'scheduled'
                              ? 'bg-[#EBF7EE] text-[#2D6A4F]'
                              : session.status === 'cancelled'
                              ? 'bg-[#FDF2F2] text-[#D92D20]'
                              : 'bg-[#F2F4F7] text-[#475467]'
                          }`}
                        >
                          {session.status === 'scheduled'
                            ? 'Terjadwal'
                            : session.status === 'cancelled'
                            ? 'Dibatalkan'
                            : 'Selesai'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#1C2427]">{session.service.name}</h3>

                      {/* Instructor */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full bg-[#EAE6DF] overflow-hidden flex items-center justify-center text-[10px] font-bold text-[#475467]">
                          {session.instructor.photoUrl ? (
                            <img
                              src={session.instructor.photoUrl}
                              alt={session.instructor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            session.instructor.name[0]
                          )}
                        </div>
                        <span className="text-xs font-semibold text-[#475467]">
                          Coach {session.instructor.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Capacity Progress */}
                  <div className="lg:w-60 shrink-0 bg-[#FAF8F5] p-3 rounded-2xl border border-[#EAE6DF]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-[#475467]">Kapasitas Kuota</span>
                      <span
                        className={`font-bold ${
                          session.isFull ? 'text-[#D92D20]' : session.bookedCount > 0 ? 'text-[#2D6A4F]' : 'text-[#667085]'
                        }`}
                      >
                        {session.bookedCount} / {session.capacity} Klien ({pct}%)
                      </span>
                    </div>

                    <div className="w-full bg-[#EAE6DF] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          session.isFull ? 'bg-[#D92D20]' : pct >= 70 ? 'bg-[#C08A3E]' : 'bg-[#2D6A4F]'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#667085] mt-2">
                      <span>Sisa: {session.availableSlots} slot</span>
                      {session.isFull ? (
                        <span className="text-[#D92D20] font-bold">Kapasitas Penuh</span>
                      ) : (
                        <span className="text-[#2D6A4F] font-medium">Buka Pemesanan</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    {/* View Attendees Button */}
                    <button
                      onClick={() => setSelectedSessionForAttendees(session)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#EBF7EE] text-[#1C2427] hover:text-[#2D6A4F] text-xs font-semibold rounded-xl border border-[#EAE6DF] transition-all"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Peserta</span>
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#2D6A4F] text-white text-[10px] font-bold">
                        {session.bookedCount}
                      </span>
                    </button>

                    {/* Status Actions */}
                    {session.status === 'scheduled' ? (
                      <button
                        onClick={() => handleToggleStatus(session, 'cancelled')}
                        title="Batalkan Sesi"
                        className="p-2 rounded-xl border border-[#FECDCA] text-[#D92D20] hover:bg-[#FDF2F2] transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    ) : session.status === 'cancelled' ? (
                      <button
                        onClick={() => handleToggleStatus(session, 'scheduled')}
                        title="Aktifkan Kembali Sesi"
                        className="px-3 py-2 rounded-xl border border-[#B7E4C7] text-[#2D6A4F] hover:bg-[#EBF7EE] text-xs font-semibold transition-all"
                      >
                        Aktifkan
                      </button>
                    ) : null}

                    {/* Delete button if no confirmed bookings */}
                    <button
                      onClick={() => handleDeleteSession(session)}
                      title="Hapus Sesi"
                      className="p-2 rounded-xl border border-[#EAE6DF] text-[#667085] hover:text-[#D92D20] hover:bg-[#FDF2F2] transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-[#EAE6DF] overflow-hidden subtle-shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#475467] font-semibold">
                <tr>
                  <th className="py-3 px-4">Jam Sesi</th>
                  <th className="py-3 px-4">Nama Layanan</th>
                  <th className="py-3 px-4">Instruktur</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Kapasitas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {sessions.map((session) => {
                  const sTime = new Date(session.startTime).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const eTime = new Date(session.endTime).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <tr key={session.id} className="hover:bg-[#FAF8F5] transition-all">
                      <td className="py-3 px-4 font-bold text-[#1C2427]">
                        {sTime} - {eTime}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#1C2427]">
                        {session.service.name}
                      </td>
                      <td className="py-3 px-4 text-[#475467]">Coach {session.instructor.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            session.service.type === 'group'
                              ? 'bg-[#EBF7EE] text-[#2D6A4F]'
                              : 'bg-[#FDF4E7] text-[#C08A3E]'
                          }`}
                        >
                          {session.service.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#1C2427]">{session.bookedCount}</span> /{' '}
                        {session.capacity}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            session.status === 'scheduled'
                              ? 'bg-[#EBF7EE] text-[#2D6A4F]'
                              : session.status === 'cancelled'
                              ? 'bg-[#FDF2F2] text-[#D92D20]'
                              : 'bg-[#F2F4F7] text-[#475467]'
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedSessionForAttendees(session)}
                          className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#EBF7EE] rounded-lg border border-[#EAE6DF] text-[#2D6A4F] font-semibold text-[11px]"
                        >
                          Peserta ({session.bookedCount})
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Buat Sesi Kelas Baru */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#EAE6DF] shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#EBF7EE] text-[#2D6A4F]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-[#1C2427]">Jadwalkan Sesi Kelas Baru</h2>
                  <p className="text-[11px] text-[#667085]">Tambahkan sesi kelas ke kalender studio Kemang.</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#667085] hover:text-[#1C2427] hover:bg-[#FAF8F5] rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#1C2427] mb-1">
                  Pilih Layanan Pilates *
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => handleServiceSelect(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] text-[#1C2427] focus:outline-none focus:border-[#2D6A4F]"
                >
                  <option value="">-- Pilih Layanan --</option>
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} ({srv.type === 'group' ? 'Group' : 'Private'} - {srv.durationMin} Menit)
                    </option>
                  ))}
                </select>
              </div>

              {/* Instructor Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#1C2427] mb-1">
                  Pilih Instruktur Pelatih *
                </label>
                <select
                  value={formData.instructorId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, instructorId: e.target.value }))}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] text-[#1C2427] focus:outline-none focus:border-[#2D6A4F]"
                >
                  <option value="">-- Pilih Instruktur --</option>
                  {instructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      Coach {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1">
                    Tanggal Sesi *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] text-[#1C2427] focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1">
                    Jam Mulai *
                  </label>
                  <input
                    type="time"
                    value={formData.startTimeHour}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] text-[#1C2427] focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C2427] mb-1">
                    Jam Selesai *
                  </label>
                  <input
                    type="time"
                    value={formData.endTimeHour}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endTimeHour: e.target.value }))}
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] text-[#1C2427] focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-xs font-semibold text-[#1C2427] mb-1">
                  Kapasitas Peserta (Kuota Slot) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, capacity: parseInt(e.target.value, 10) || 1 }))
                    }
                    required
                    className="w-32 text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] text-[#1C2427] focus:outline-none focus:border-[#2D6A4F]"
                  />
                  <span className="text-xs text-[#667085]">
                    Slot Reformer/Mat maksimum yang dapat di-booking klien
                  </span>
                </div>
              </div>

              {/* Real-time Conflict Warning Notice */}
              {conflictWarning && (
                <div className="p-3 bg-[#FDF2F2] rounded-2xl border border-[#FECDCA] text-[11px] text-[#D92D20] font-semibold leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{conflictWarning}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#EAE6DF] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#667085] hover:bg-[#FAF8F5] border border-[#EAE6DF]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#2D6A4F] hover:bg-[#1E4633] text-white text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan & Jadwalkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Daftar Peserta Kelas (Attendees) */}
      {selectedSessionForAttendees && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-[#EAE6DF] shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-[#EBF7EE] text-[#2D6A4F]">
                    <Users className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-[#1C2427]">
                    Daftar Peserta: {selectedSessionForAttendees.service.name}
                  </h2>
                </div>
                <div className="text-xs text-[#667085] mt-1 flex items-center gap-3">
                  <span>
                    {new Date(selectedSessionForAttendees.startTime).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(selectedSessionForAttendees.endTime).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </span>
                  <span>•</span>
                  <span>Coach {selectedSessionForAttendees.instructor.name}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSessionForAttendees(null)}
                className="p-1.5 text-[#667085] hover:text-[#1C2427] hover:bg-[#FAF8F5] rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attendees list */}
            {selectedSessionForAttendees.bookings.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#D1C9BE]">
                <Users className="w-8 h-8 text-[#667085] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-[#1C2427]">Belum ada pesanan klien untuk sesi ini.</p>
                <p className="text-[11px] text-[#667085] mt-0.5">
                  Slot masih terbuka untuk reservasi publik via Online Store.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {selectedSessionForAttendees.bookings.map((booking) => {
                  const bookingCode = booking.qrCode.replace('TICPILATES:BOOKING:', '');
                  const waNumber = booking.client.phone.replace(/[^0-9]/g, '');
                  const waLink = `https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}?text=${encodeURIComponent(
                    `Halo ${booking.client.name}, ini pengingat sesi kelas ${selectedSessionForAttendees.service.name} di TICPILATES Kemang. Tiket: ${bookingCode}`
                  )}`;

                  return (
                    <div
                      key={booking.id}
                      className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-[#EAE6DF] flex items-center justify-center font-bold text-xs text-[#2D6A4F]">
                          {booking.client.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1C2427]">{booking.client.name}</span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                booking.status === 'checked-in'
                                  ? 'bg-[#EBF7EE] text-[#2D6A4F]'
                                  : booking.status === 'confirmed'
                                  ? 'bg-[#EBF7EE] text-[#2D6A4F]'
                                  : 'bg-[#FDF4E7] text-[#C08A3E]'
                              }`}
                            >
                              {booking.status === 'checked-in'
                                ? 'Hadir (Checked-In)'
                                : booking.status === 'confirmed'
                                ? 'Dikonfirmasi'
                                : 'Pending Hold'}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#667085] mt-0.5 flex items-center gap-2">
                            <span>{booking.client.phone}</span>
                            <span>•</span>
                            <span className="font-mono text-[#2D6A4F]">{bookingCode}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          onClick={async () => {
                            // Check-in status toggle
                            try {
                              const newStatus = booking.status === 'checked-in' ? 'confirmed' : 'checked-in';
                              const res = await fetch(`/api/schedule/${selectedSessionForAttendees.id}`);
                              showAlert(
                                'success',
                                `Status kehadiran ${booking.client.name}: ${
                                  newStatus === 'checked-in' ? 'Telah Check-In' : 'Batal Check-In'
                                }`
                              );
                              fetchSessions();
                              setSelectedSessionForAttendees(null);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                            booking.status === 'checked-in'
                              ? 'bg-[#EBF7EE] text-[#2D6A4F] border-[#B7E4C7]'
                              : 'bg-white text-[#1C2427] border-[#EAE6DF] hover:bg-[#EBF7EE]'
                          }`}
                        >
                          {booking.status === 'checked-in' ? '✓ Sudah Hadir' : 'Check-In'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 border-t border-[#EAE6DF] flex justify-end">
              <button
                onClick={() => setSelectedSessionForAttendees(null)}
                className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#EAE6DF] rounded-xl text-xs font-semibold text-[#1C2427]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

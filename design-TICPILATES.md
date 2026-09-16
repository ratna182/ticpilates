# Design Reference: TICPILATES

**Sumber:** 4 screenshot yang kamu kirim menunjukkan bisnis "Tic Pilates Group Space" saat ini beroperasi di atas **Rezerv for Business** (business.rezerv.co) — sebuah SaaS booking software untuk gym/fitness/studio yang sudah dipakai. Ini bukan desain baru dari nol; ini adalah **dokumentasi visual dari sistem existing** yang jadi referensi untuk build TICPILATES versi kamu sendiri.

> **Catatan penting:** Warna di bawah ini diekstrak dari foto layar (bukan screenshot asli/inspect element), jadi ada variasi akibat pencahayaan & kualitas kamera. Anggap sebagai **approximate palette** — sebelum dev/finalisasi, sebaiknya inspect langsung situs `rezerv.co/id` atau `business.rezerv.co` untuk ambil hex value pasti. Saya tandai ini sebagai **OPEN QUESTION** di bagian akhir.

---

## 1. Ringkasan Sistem

| Bagian | Deskripsi |
|---|---|
| Admin Dashboard | Layout sidebar dark di kiri + konten light di kanan, gaya SaaS dashboard klasik |
| Login Page | Split-screen: panel brand di kiri, form login di kanan |
| Public Marketing Site | Landing page mobile-first, hero gelap dengan foto, headline besar putih + hijau, CTA hijau |
| Brand mark | Logo swirl/spiral hijau (ikon) + wordmark "rezerv" huruf kecil semua, sans-serif |

## 2. Color Tokens (approximate — verifikasi ulang)

| Token | Approx Hex | Penggunaan |
|---|---|---|
| `--color-brand-green` | `#1EB980` (hijau teal medium-vivid) | CTA button, logo icon, highlight text di headline, accent card |
| `--color-brand-green-dark` | `#0F3D2E` (hijau tua nyaris hitam) | Panel kiri halaman login, background gelap dengan aksen |
| `--color-sidebar-bg` | `#111318` (hitam kebiruan/near-black) | Background sidebar admin |
| `--color-sidebar-active` | `#2A2D35` (abu gelap, sedikit lebih terang dari sidebar) | Pill highlight untuk menu aktif (contoh: "Schedule") |
| `--color-avatar-accent` | `#E08A3C` (oranye/amber) | Avatar bulat inisial "T" di sidebar |
| `--color-surface` | `#FFFFFF` | Background dashboard/konten utama |
| `--color-surface-muted` | `#F5F6F8` | Background halaman/area sekunder |
| `--color-text-primary` | `#1A1A1A` | Heading & teks utama |
| `--color-text-muted` | `#6B7280` | Teks sekunder, label |
| `--color-calendar-event` | `#3FBF9F` / `#5AD8B0` (hijau teal lebih terang) | Blok event di kalender Schedule |

**Pola pemakaian warna:** hijau adalah satu-satunya accent color yang konsisten dipakai di semua touchpoint (dashboard cards, CTA landing page, logo) — bukan multi-color. Ini pola "single accent, disiplin" yang worth dipertahankan di TICPILATES, bukan ditambah warna lain tanpa alasan.

## 3. Typography

- Sans-serif grotesk modern (mirip kelas *Inter*, *Poppins*, atau *Aeonik*) — tidak ada serif di manapun pada 4 screenshot ini.
- **Landing page (mobile):** headline sangat besar & bold (`Sistem Booking Gym & Fitness Nomor #1 di Indonesia`), line-height rapat, sebagian kata di-highlight hijau bukan dengan italic/warna beda per-kata acak, tapi per-baris/frasa penuh ("Nomor #1 di Indonesia" jadi 1 blok hijau) — ini pola yang jelas, bukan sekadar 1 kata diwarnai.
- **Dashboard:** heading sedang-besar untuk sapaan ("Hi Anisa! Welcome back to..."), body text ukuran normal, sidebar label ukuran kecil-sedang dengan icon di kiri.
- **Login page:** heading besar ("Log in"), subheading kecil abu-abu, label form kecil di atas/dalam input.

Rekomendasi font untuk TICPILATES: **Inter** atau **Plus Jakarta Sans** — dua-duanya grotesk modern, gratis, dan render bagus untuk dashboard + marketing site sekaligus, konsisten dengan gaya yang terlihat di referensi.

## 4. Layout Structure

### 4a. Admin Dashboard
```
┌──────────┬─────────────────────────────────────────┐
│          │  [search]      [location] [user ▾]       │
│ Sidebar  ├─────────────────────────────────────────┤
│  (dark)  │  Hi {name}!                               │
│          │  Welcome back to {studio name}.           │
│  Home    │                                            │
│  Schedule│  ┌─────────────────────┐  ┌─────────────┐ │
│  Services│  │ Feature announcement │  │ What's new  │ │
│  ...     │  │ card (illustration)  │  │ (green card)│ │
│          │  └─────────────────────┘  └─────────────┘ │
│          │                             ┌─────────────┐│
│          │  Complete your space         │ Support     ││
│          │  (checklist/onboarding)      │ (green card)││
│          │                             └─────────────┘│
└──────────┴─────────────────────────────────────────┘
```
- Sidebar fixed-width kiri, dark background, scroll independen dari konten.
- Menu dikelompokkan dengan section label tanpa dekorasi berlebih: grup utama (Home s/d Promo Codes), lalu label kecil **"SALES CHANNEL"** sebelum Online Store, lalu divider tipis sebelum Scan Customer & Settings.
- Item aktif ditandai pill/rounded highlight dengan background sedikit lebih terang, bukan garis kiri atau warna teks berbeda.
- Konten kanan pakai card-based layout, rounded corners sedang, warna card umumnya putih dengan 1 card hijau solid untuk item yang ingin ditonjolkan (what's new, support).

### 4b. Schedule / Calendar View
- Time-based vertical calendar (per jam: 3 PM, 4 PM, dst), event ditampilkan sebagai blok warna solid dengan label singkat di dalamnya.
- Warna event konsisten hijau/teal (bukan multi-warna per kategori) — kemungkinan multi-warna dipakai untuk membedakan jenis service, perlu dicek langsung ke live product (OPEN QUESTION).

### 4c. Login Page
```
┌───────────────┬───────────────────────┐
│               │                        │
│  [logo mark]  │      Log in            │
│  brand panel  │      Enter your email  │
│  (dark green, │      address and pw.   │
│   geometric   │                        │
│   shapes)     │  [ Email address ]     │
│               │  [ Password       👁]   │
│               │  Forgot password?      │
│               │           [ Log in ]   │
│               │  Don't have an account?│
│               │  Sign Up               │
└───────────────┴───────────────────────┘
```
- Split-screen 40/60 atau 35/65 (panel kiri lebih sempit).
- Panel kiri: dark green/near-black dengan bentuk geometris melengkung (quarter-circle) warna hijau muda sebagai aksen dekoratif, bukan foto.
- Form kanan: minimal, whitespace besar, 2 input field standar, tombol primary hijau solid (rounded, full-width atau lebar-medium).

### 4d. Landing Page (mobile)
- Hero full-bleed image (foto orang olahraga/pilates) dengan overlay gelap agar teks putih terbaca.
- Headline besar putih + 1 frasa di-highlight hijau, paragraf deskripsi pendek di bawahnya (putih, opacity sedikit lebih rendah).
- Dua CTA bertumpuk: primary solid hijau ("Jadwalkan Demo"), secondary outline putih/transparent ("Coba Gratis 1 Bulan").
- Trust badges (Capterra, Software Advice, GetApp) di bagian bawah viewport pertama — social proof ditaruh sangat awal, bukan di footer.
- Logo di top-left: ikon swirl hijau + wordmark lowercase, hamburger menu di top-right (mobile nav pattern standar).

## 5. Component Patterns

| Komponen | Karakteristik |
|---|---|
| Sidebar nav item | Icon (outline, ~20px) + label, padding vertikal cukup besar, active state = pill background |
| Primary button | Solid hijau, rounded (radius sedang-besar, bukan full pill kecuali di landing page CTA), white text |
| Secondary button | Outline, border putih/hijau tergantung background |
| Card (info/announcement) | Rounded corners, padding generous, ilustrasi/icon di kiri untuk card penjelasan, card hijau solid untuk CTA-style content |
| Form input | Border tipis abu-abu, rounded, label di atas (bukan floating label), placeholder abu muda |
| Avatar | Bulat, inisial huruf, warna solid (oranye di contoh) |

## 6. Prinsip Desain yang Terlihat

1. **Single accent color disiplin** — hijau dipakai konsisten di semua touchpoint, tidak ada warna kompetisi lain untuk perhatian.
2. **Dark sidebar + light canvas** — pola dashboard SaaS klasik, familiar untuk pengguna B2B software.
3. **Copy langsung & actionable** — CTA landing page berbahasa Indonesia kasual ("Buat Ngembangin Bisnis Kamu Biar Makin Cuan!"), bukan formal/korporat kaku.
4. **Social proof di atas fold** — trust badge software review platform ditaruh sangat awal di landing page.
5. **Minim dekorasi di form** — login page & form input dashboard bersih, tanpa ornamen berlebih.

## 7. Rekomendasi Implementasi (Tailwind + Next.js)

```
// tailwind.config token suggestion
colors: {
  brand: {
    DEFAULT: '#1EB980',
    dark: '#0F3D2E',
  },
  sidebar: {
    DEFAULT: '#111318',
    active: '#2A2D35',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    muted: '#F5F6F8',
  },
}
```
- Gunakan CSS variable, bukan hardcode hex, supaya gampang di-adjust setelah verifikasi warna asli (lihat Open Questions).
- Sidebar sebagai komponen terpisah dengan state aktif dikontrol via route matching (Next.js `usePathname`), bukan class manual per halaman.
- Card component reusable dengan variant `default` (putih) dan `accent` (hijau solid) sesuai pola di Section 5.

## 8. Open Questions

**Q1.** Hex color pasti untuk brand green, sidebar dark, dan warna event kalender — foto layar tidak 100% akurat karena pencahayaan/kamera.
Impact: Sedang
Recommended action: Inspect element langsung di `business.rezerv.co` atau `rezerv.co/id`, atau ambil dari brand asset kalau ada.

**Q2.** Apakah TICPILATES (versi kamu) akan **visually identical** dengan Rezerv, atau cuma referensi layout/pola (dengan brand identity beda — warna, logo, nama sendiri)?
Impact: Tinggi
Reason: Kalau tujuannya bikin produk kompetitor/alternatif ke Rezerv untuk klien lain, meniru brand identity persis (warna hijau + logo swirl yang sangat mirip) berisiko dianggap copy identitas visual brand orang lain, bukan cuma pola UX. Kalau ini murni internal tool buat bisnis "Tic Pilates Group Space" sendiri (bukan dijual ke pihak lain), risikonya lebih rendah tapi tetap sebaiknya beda cukup jauh di brand mark & palet supaya bisa didaftarkan sebagai identitas sendiri.
Recommended default: Ambil **pola layout & UX** (sidebar structure, card pattern, split-screen login, landing page structure) sebagai referensi, tapi ganti **brand mark, warna accent, dan tone visual** jadi identitas TICPILATES sendiri.

**Q3.** Warna event kalender di Schedule — di foto cuma terlihat 1-2 warna (hijau/teal), apakah di produk asli ada multi-warna per jenis kelas/instruktur? Perlu dicek di live product untuk direplikasi dengan benar.
Impact: Rendah
Recommended action: Cek langsung tampilan Schedule di akun Rezerv yang aktif.

---

Dokumen ini siap dipakai sebagai referensi visual saat implementasi UI TICPILATES — tapi **Q2 sebaiknya kamu putuskan dulu** sebelum tim/AI coding agent mulai styling, supaya arah brand-nya jelas dari awal.

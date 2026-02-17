# PRD Final v2.0 — Website LMS & Ujian Online PKBM An-Najah

> Dokumen ini adalah versi final yang telah diverifikasi dengan klien (Mas Fakih).
> Tanggal: 17 Februari 2026

---

## 1. Identitas Proyek

| Item | Detail |
|---|---|
| **Institusi** | PKBM An-Najah (Pusat Kegiatan Belajar Masyarakat) |
| **Lokasi** | Distrik Bombar, Kabupaten Fakfak, Papua Barat |
| **Berdiri** | Sejak 2008 |
| **Infrastruktur** | Listrik masuk 2022, WiFi masuk 2025 |
| **Hosting** | Free tier Supabase + Vercel |
| **Domain** | Belum ditentukan |

**Masalah Utama:**
- Siswa adalah pekerja (kebun/sawit) atau berkeluarga → kehadiran fisik tidak rutin
- Distribusi materi via WhatsApp tidak efektif (tertumpuk chat lain)

**Tujuan:** Digitalisasi materi dan latihan soal agar siswa belajar fleksibel dan mandiri

---

## 2. Target Pengguna

### Siswa
- Total populasi: **±60 siswa** (Paket A, B, C)
- Literasi teknologi: 50:50 (sebagian familiar dari ANBK)
- Akses utama: **Handphone (mobile-first)**
- Perilaku: akses saat senggang / tidak sedang panen

### Admin (Tutor)
- **Banyak admin**, masing-masing mengelola mata pelajaran tertentu
- Role di sistem: hanya satu jenis **"admin"** (tidak dibedakan per tutor)
- Aktivitas: input soal, kunci jawaban, upload materi

> [!NOTE]
> Hanya ada **2 role** di sistem: `admin` dan `student`. Tidak ada role kepala PKBM / pengawas.

---

## 3. Autentikasi & Registrasi

| Aspek | Keputusan |
|---|---|
| Approval registrasi | ❌ **Tidak perlu** — siswa langsung bisa akses setelah register |
| Data wajib | Nama, Email, Password |
| Data opsional | Tahun masuk, Jenjang (Paket A/B/C), Nomor HP, Alamat |
| Pemilihan jenjang | Dipilih sendiri oleh siswa saat registrasi |
| Notifikasi | ❌ Tidak ada sistem notifikasi |

---

## 4. Struktur Jenjang & Mata Pelajaran

> [!IMPORTANT]
> Tidak ada pembagian kelas per jenjang (mis: Paket C **tidak** dibagi kelas 10/11/12). Hanya per paket.
> Siswa **hanya bisa akses materi & soal jenjangnya sendiri** (tidak bisa lintas jenjang).

### Paket A (Setara SD) — 🔴 Nuansa Merah
| No | Mata Pelajaran |
|---|---|
| 1 | Bahasa Indonesia |
| 2 | Matematika |
| 3 | Ilmu Pengetahuan Alam dan Sosial (IPAS) |
| 4 | Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK) |
| 5 | Pendidikan Agama Islam |
| 6 | Bahasa Inggris |
| 7 | Pendidikan Pancasila |

### Paket B (Setara SMP) — 🟢 Nuansa Hijau
| No | Mata Pelajaran |
|---|---|
| 1 | Bahasa Indonesia |
| 2 | Bahasa Inggris |
| 3 | Matematika |
| 4 | Ilmu Pengetahuan Alam (IPA) |
| 5 | Ilmu Pengetahuan Sosial (IPS) |
| 6 | Pendidikan Agama dan Budi Pekerti |
| 7 | Pendidikan Pancasila |

### Paket C (Setara SMA) — 🟡 Nuansa Kuning

**Mata Pelajaran Umum:**

| No | Mata Pelajaran |
|---|---|
| 1 | Bahasa Indonesia |
| 2 | Bahasa Indonesia Tingkat Lanjut |
| 3 | Bahasa Inggris |
| 4 | Bahasa Inggris Tingkat Lanjut |
| 5 | Matematika |
| 6 | Matematika Tingkat Lanjut |
| 7 | Pendidikan Agama dan Budi Pekerti |
| 8 | Pendidikan Pancasila |
| 9 | PJOK |
| 10 | Seni Budaya |
| 11 | Informatika |

**Mata Pelajaran Peminatan:**

| No | Mata Pelajaran |
|---|---|
| 12 | Fisika |
| 13 | Kimia |
| 14 | Biologi |
| 15 | Sejarah |
| 16 | Ekonomi |
| 17 | Geografi |
| 18 | Sosiologi |
| 19 | Antropologi |

---

## 5. Fitur: Manajemen Soal & Ujian

### A. Sisi Admin — Input Soal

| Aspek | Detail |
|---|---|
| **Mode Manual (Prioritas)** | Admin ketik soal + opsi A/B/C/D + kunci jawaban langsung di CMS |
| **Mode PDF (Cadangan)** | Upload PDF (maks **5 MB**), admin input jumlah soal & kunci jawaban manual |
| **Gambar dalam soal** | ✅ **Bisa** — soal bisa mengandung gambar/diagram |
| **Kategori ujian** | Generik: **"Latihan Soal"** saja (tidak dibedakan UTS/UAS) |
| **Jumlah soal** | Fleksibel sesuai admin |

### B. Sisi Siswa — Pengerjaan

| Aspek | Detail |
|---|---|
| **Mode Manual** | Soal + pilihan ganda tampil langsung di layar |
| **Mode PDF** | PDF di-embed di browser (atas/samping) + Lembar Jawab Digital (A/B/C/D) di bawah |
| **Timer/Batas waktu** | ❌ **Tidak ada** — siswa bebas mengerjakan kapan saja |
| **Pengerjaan ulang** | ✅ **Boleh berkali-kali** |
| **Skor yang disimpan** | **Yang terbaru** |
| **Acak soal** | ❌ Tidak perlu |
| **Passing grade / KKM** | ❌ Tidak ada nilai minimum |

### C. Sistem Penilaian

- **Real-time Score:** Skor langsung muncul setelah menekan "Selesai"
- **Evaluasi:** Tampilkan jawaban benar vs salah sebagai bahan belajar
- Grading otomatis berdasarkan kunci jawaban yang diinput admin

---

## 6. Fitur: Manajemen Materi

| Aspek | Detail |
|---|---|
| **Format materi** | **PDF** dan **Gambar** (JPEG/PNG/JPG). Tidak ada video/text |
| **Organisasi** | Daftar flat per mata pelajaran (tidak ada sub-bab/topik) |
| **Urutan belajar** | Bebas — siswa bisa pilih materi mana saja |
| **Batas ukuran file** | **5 MB** |
| **Viewer** | Di-embed langsung di browser |

> [!WARNING]
> Codebase saat ini sudah memiliki support untuk `video` dan `text` sebagai tipe materi. Berdasarkan konfirmasi klien, **hanya PDF dan Gambar yang dibutuhkan**. Fitur video/text perlu dihapus atau disembunyikan.

---

## 7. Fitur: Dashboard & Reporting

### Dashboard Siswa
- ✅ Riwayat semua ujian yang pernah dikerjakan
- ✅ Progress belajar per mata pelajaran
- ❌ Tidak ada ranking/peringkat

### Dashboard Admin
- ✅ Daftar siswa yang sudah/belum mengerjakan ujian tertentu
- ✅ Rata-rata nilai per kelas/jenjang
- ✅ Export ke Excel (PDF tidak diperlukan)

---

## 8. Halaman Publik (Landing Page)

Halaman tanpa login yang menampilkan informasi PKBM An-Najah:

### Struktur Konten

**Hero Section:**
> "Raih Kesempatan Kedua, Tata Kembali Masa Depan Lewat Pendidikan"
> "Pendidikan adalah hak semua usia. Jangan biarkan keadaan mengubur potensimu."

**Bagian 1 — Pendahuluan (Emosional):**
- Mengapa PKBM An-Najah Hadir?
- Banyak orang pintar terpaksa berhenti sekolah bukan karena malas, tapi karena keadaan
- PKBM An-Najah hadir sebagai kesempatan kedua

**Bagian 2 — Legalitas & Kepercayaan:**
- ✅ Terdaftar di Dapodik
- ✅ Memiliki SK & Pengakuan Pemerintah
- ✅ Terakreditasi

**Bagian 3 — Manfaat Ijazah:**
- 💼 Untuk Bekerja (CPNS/BUMN/Swasta)
- 🎓 Untuk Kuliah
- 🏢 Untuk Wirausaha

**Bagian 4 — Call to Action / Kontak:**
- 📞 Telepon/WA: 0821-9684-8763 (Drs. Abdullah)
- 🌐 Instagram: pkbm.annajah
- Tagline: "Bangkit Lewat Pendidikan, Menyongsong Masa Depan"

---

## 9. Desain UI/UX

| Aspek | Detail |
|---|---|
| **Branding** | Logo "PKBM AN-NAJAH" (lingkaran biru) — file belum tersedia, akan di-replace nanti |
| **Color coding** | Merah (Paket A), Hijau (Paket B), Kuning (Paket C) — berlaku **per jenjang paket** |
| **Desain** | Sederhana, mirip LJK digital |
| **Responsif** | **Mobile-first** (prioritas handphone) |
| **PWA/Offline** | ❌ Tidak diperlukan |

---

## 10. Batasan & Catatan Teknis

| Item | Detail |
|---|---|
| Max file upload | 5 MB (PDF) |
| Hosting | Supabase free tier + Vercel free tier |
| Concurrent users | ~60 siswa, tidak ada ujian serentak yang bermasalah |
| Offline mode | Tidak diperlukan |
| Notifikasi | Tidak ada |
| Race condition | Tidak relevan — setiap siswa mengerjakan soal secara independen |

---

## 11. Gap Analysis: PRD vs Codebase Saat Ini

| Area | Status | Catatan |
|---|---|---|
| Approval system | ⚠️ Perlu dihapus | Codebase punya `/waiting-approval`, tapi klien tidak ingin approval |
| Tipe materi video/text | ⚠️ Perlu dihapus | Codebase support video/text, klien hanya butuh PDF & gambar |
| Mata pelajaran lengkap | ❌ Belum ada | Perlu di-seed ke database |
| Halaman publik/landing | ⚠️ Partial | Ada `/structure`, perlu di-expand dengan konten copywriting |
| Color coding per jenjang | ❌ Belum ada | Perlu implementasi warna Merah/Hijau/Kuning |
| Gambar dalam soal | ❌ Belum ada | Schema `questions.question_text` perlu support gambar |
| Export Excel (admin) | ❌ Belum ada | Perlu fitur export Excel di reporting admin |
| Riwayat & progress siswa | ⚠️ Partial | Ada `/student/progress`, perlu validasi kelengkapan |
| Mobile-first responsive | ⚠️ Perlu review | Perlu audit semua halaman untuk mobile responsiveness |
| Skor terbaru (bukan tertinggi) | ⚠️ Perlu validasi | Pastikan logic grading menyimpan skor terbaru |

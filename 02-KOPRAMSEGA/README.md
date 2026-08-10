<div align="center">

# 🏕️ KOPRAMSEGA

### Komando Pramuka SMEA 3 — Sistem Informasi Gugus Depan

Aplikasi web internal untuk anggota Pramuka SMEA 3 — login keanggotaan, jadwal kegiatan dengan hitung mundur (timer), dan papan pengumuman, dibangun di atas Google Apps Script & Google Sheets.

[![Made with Google Apps Script](https://img.shields.io/badge/Made%20with-Google%20Apps%20Script-4285F4?style=flat-square&logo=google&logoColor=white)](https://developers.google.com/apps-script)
[![Database](https://img.shields.io/badge/Database-Google%20Sheets-34A853?style=flat-square&logo=googlesheets&logoColor=white)](https://www.google.com/sheets/about/)
[![Status](https://img.shields.io/badge/status-active-success?style=flat-square)]()
[![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)]()

[Demo](#-demo) · [Fitur](#-fitur) · [Instalasi](#️-instalasi--deployment) · [Struktur Data](#️-struktur-data) · [Kontribusi](#-kontribusi)

</div>

---

## 📖 Tentang Project

**KOPRAMSEGA** adalah sistem informasi berbasis web yang dibuat untuk memudahkan anggota Pramuka SMEA 3 mengakses informasi gugus depan secara digital — mulai dari login keanggotaan, melihat jadwal kegiatan lengkap dengan hitung mundur menuju waktu pelaksanaan, hingga membaca pengumuman terbaru dari pembina/pengurus.

Project ini dibangun tanpa server eksternal — seluruh backend berjalan di atas **Google Apps Script**, dengan **Google Sheets** sebagai database-nya. Cocok untuk organisasi sekolah yang butuh sistem manajemen ringan, gratis, dan mudah di-maintain oleh non-developer sekalipun.

<br>

## 🎬 Demo

[![Demo Aplikasi KOPRAMSEGA](https://img.youtube.com/vi/NsqOLiUKRME/maxresdefault.jpg)](https://youtu.be/NsqOLiUKRME)

> Klik gambar di atas untuk menonton demo penggunaan aplikasi.

<br>

## ✨ Fitur

| Modul | Deskripsi |
|---|---|
| 🔐 **Login** | Anggota masuk menggunakan email & password yang sudah terdaftar |
| 🏠 **Beranda** | Halaman utama setelah login — ringkasan informasi untuk anggota |
| 🗓️ **Jadwal Timer** | Daftar jadwal kegiatan Pramuka, lengkap dengan hitung mundur (timer) menuju waktu pelaksanaan |
| 📢 **Pengumuman** | Papan informasi/pengumuman terbaru dari pembina atau pengurus gugus depan |

<br>

## 🛠️ Tech Stack

- **Backend:** [Google Apps Script](https://developers.google.com/apps-script) (JavaScript runtime di Google Cloud)
- **Database:** Google Sheets
- **Frontend:** HTML Service + CSS + JavaScript (native, tanpa framework eksternal)

<br>

## 🗂️ Struktur Data

Data disimpan dalam satu Google Spreadsheet dengan tabel-tabel berikut:

```
📁 spreadsheet-template/
├── User.csv          → Data akun anggota (untuk login)
├── Jadwal.csv         → Daftar jadwal kegiatan (kategori, tanggal, materi, pembina)
└── Pengumuman.csv     → Daftar pengumuman yang tampil di aplikasi
```

**Skema tabel `Jadwal`:**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `ID_Jadwal` | Text (auto) | ID unik tiap jadwal |
| `Kategori` | Text | Jenis kegiatan (contoh: Pioneering) |
| `Tanggal` | Date/DateTime | Tanggal & waktu pelaksanaan (dipakai untuk hitung mundur) |
| `Materi` | Text | Materi yang dibahas pada kegiatan tersebut |
| `Pembina` | Text | Nama pembina penanggung jawab kegiatan |

**Skema tabel `Pengumuman`:**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `ID_Pengumuman` | Text (auto) | ID unik tiap pengumuman |
| `Judul` | Text | Judul pengumuman |
| `Isi` | Text | Isi lengkap pengumuman |
| `Tanggal` | Date | Tanggal pengumuman dipublikasikan |

<br>

## ⚙️ Instalasi & Deployment

Karena berbasis Google Apps Script, tidak perlu server atau hosting tambahan.

1. **Salin spreadsheet template**
   Buka folder `spreadsheet-template/`, import file `.csv` ke satu Google Spreadsheet baru (satu sheet per file: `User`, `Jadwal`, `Pengumuman`).

2. **Buka Apps Script Editor**
   Di spreadsheet tadi → `Extensions` → `Apps Script`.

3. **Salin kode project**
   Copy seluruh file `.gs`/`.html` dari repo ini ke dalam Apps Script Editor.

4. **Hubungkan ID Spreadsheet**
   Isi `SPREADSHEET_ID` di file konfigurasi (`Code.gs` / `Config.gs`) dengan ID spreadsheet kamu.

5. **Deploy sebagai Web App**
   `Deploy` → `New deployment` → pilih tipe **Web app** → atur akses sesuai kebutuhan (misalnya "Anyone with the link") → `Deploy`.

6. **Selesai!**
   Buka link web app yang muncul, lalu login menggunakan akun anggota yang sudah didaftarkan di tabel `User`.

<br>

## 🚀 Roadmap

- [x] Sistem login anggota
- [x] Halaman beranda
- [x] Jadwal kegiatan dengan timer
- [x] Papan pengumuman
- [ ] Notifikasi otomatis untuk jadwal yang akan datang
- [ ] Riwayat kehadiran anggota

<br>

## 🤝 Kontribusi

Kontribusi, saran, dan laporan bug sangat terbuka!

1. Fork repository ini
2. Buat branch baru (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambahkan fitur X'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buka Pull Request

<br>

## 📄 Lisensi

Project ini dilisensikan di bawah [MIT License](../LICENSE) — bebas digunakan dan dimodifikasi dengan tetap mencantumkan kredit.

<br>

## 👤 Kontak

Dibuat dan dikelola oleh **[@sandygifta-ui](https://github.com/sandygifta-ui)**

Bagian dari koleksi [`Web-Projects`](https://github.com/sandygifta-ui/Web-Projects)

---

<div align="center">
<sub>Dibuat dengan 🤍 untuk Pramuka SMEA 3</sub>
</div>

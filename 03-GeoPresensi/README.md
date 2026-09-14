<div align="center">

<img src="https://img.icons8.com/color/96/geo-fence.png" width="80" alt="location icon"/>

# 📍 GeoPresensi

### Smart Attendance Web App

*Sistem absensi digital berbasis foto dan lokasi — cepat, akurat, dan anti-titip absen.*

<br/>

[![Live App](https://img.shields.io/badge/🔗_LIVE_APP-2E7D32?style=for-the-badge)](https://script.google.com/macros/s/AKfycbzZ4PaC2Q9ZOMTBXZqPlWmTDlfrCFnqT8YFufp8Hv2XTCWAI8I3FeWbF_2p9ynI46oBkA/exec)
[![Apps Script](https://img.shields.io/badge/Apps_Script-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://script.google.com/u/0/home/projects/1YBWoR2zQ5IdI56CEz__Iv3my4ME2t4JvwUsm_kV4ru-89FILSUWvSZWZ/edit)
[![Database](https://img.shields.io/badge/📄_Database-6D4C2F?style=for-the-badge)](https://docs.google.com/spreadsheets/d/1fvmllheFzTEdvJtHjJQBoe-xsSUz1vW64VQmsl5eflA/edit?gid=1693181949#gid=1693181949)
[![Edusoft Portfolio](https://img.shields.io/badge/🎓_Edusoft_Portfolio-7C3AED?style=for-the-badge)](https://edusoft.id/portfolio)

</div>

<br/>

## 📖 Tentang Project

**GeoPresensi** adalah aplikasi web absensi digital yang memanfaatkan akses kamera untuk memverifikasi kehadiran pengguna secara langsung. Dibangun dengan Google Apps Script dan Google Sheets sebagai database, aplikasi ini dirancang agar proses absensi lebih akuntabel dan mudah dipantau.

<br/>

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 📷 **Absen via Kamera** | Verifikasi kehadiran langsung lewat foto real-time |
| 📍 **Validasi GPS** | Lokasi karyawan divalidasi otomatis terhadap radius kantor |
| 🕒 **Pencatatan Waktu** | Rekam waktu masuk & pulang secara otomatis |
| 📊 **Rekap & Laporan** | Data absensi tersimpan rapi di Google Sheets, bisa export CSV/Excel |
| 📧 **Notifikasi Email** | Peringatan otomatis ke HRD jika karyawan telat atau di luar radius |
| 🔐 **Autentikasi Role** | Login terpisah untuk Admin/HRD dan Karyawan |

<br/>

## 🛠️ Tech Stack

<div align="center">

![Google Sheets](https://img.shields.io/badge/Google_Sheets-34A853?style=flat-square&logo=googlesheets&logoColor=white)
![Apps Script](https://img.shields.io/badge/Apps_Script-4285F4?style=flat-square&logo=google&logoColor=white)
![Google Drive](https://img.shields.io/badge/Google_Drive-4285F4?style=flat-square&logo=googledrive&logoColor=white)
![Gmail API](https://img.shields.io/badge/Gmail_API_(MailApp)-EA4335?style=flat-square&logo=gmail&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

</div>

> **Catatan:** Notifikasi email dikirim via `MailApp` bawaan Google Apps Script (Gmail API). Foto selfie disimpan ke Google Drive. Tidak menggunakan layanan hosting atau database berbayar.

<br/>

## 🖼️ Screenshot

<div align="center">

| Login | Dashboard |
|:---:|:---:|
| ![Login](https://github.com/sandygifta-ui/Web-Projects/blob/main/03-GeoPresensi/Documentation/1-Tampilan_Login_Presensi.png?raw=true) | ![Dashboard](https://github.com/sandygifta-ui/Web-Projects/blob/main/03-GeoPresensi/Documentation/2-Halaman_Dashboard.png?raw=true) |

| Form Absen | Master Karyawan |
|:---:|:---:|
| ![Form Absen](https://github.com/sandygifta-ui/Web-Projects/blob/main/03-GeoPresensi/Documentation/3-Form_absen.png?raw=true) | ![Master Karyawan](https://github.com/sandygifta-ui/Web-Projects/blob/main/03-GeoPresensi/Documentation/4-Master_Karyawan.png?raw=true) |

| Report & Laporan |
|:---:|
| ![Report](https://github.com/sandygifta-ui/Web-Projects/blob/main/03-GeoPresensi/Documentation/5-Report_Laporan.png?raw=true) |

</div>

<br/>

## 🚀 Cara Install & Menjalankan

### Prasyarat
- Akun Google (Gmail)
- Akses ke [Google Apps Script](https://script.google.com)
- Google Spreadsheet baru sebagai database

### Langkah-langkah

**1. Buat Spreadsheet Database**
- Buka [Google Sheets](https://sheets.google.com) dan buat spreadsheet baru
- Catat **Spreadsheet ID** dari URL-nya (bagian antara `/d/` dan `/edit`)

**2. Buat Project Apps Script**
- Buka [script.google.com](https://script.google.com) → **+ New Project**
- Ganti nama project menjadi `GeoPresensi`

**3. Upload File ke Apps Script**
- Hapus konten default `Code.gs`, lalu paste isi file `Code.gs` dari repo ini
- Buat file HTML baru untuk setiap file `.html` di repo ini:
  - `Index.html`
  - `Login.html`
  - `Karyawan.html`
  - `Rekap.html`
- Paste isi masing-masing file sesuai namanya

**4. Hubungkan ke Spreadsheet**
- Di `Code.gs`, pastikan fungsi `getSheetsApp()` mengembalikan spreadsheet yang benar.  
  Jika menggunakan spreadsheet terpisah (bukan yang terikat ke script), ganti:
  ```javascript
  function getSheetsApp() {
    return SpreadsheetApp.openById("SPREADSHEET_ID_KAMU");
  }
  ```

**5. Inisialisasi Data Awal**
- Di Apps Script Editor, jalankan fungsi `setupUsers()` satu kali untuk membuat sheet **Users** dan akun default
- Buat sheet berikut secara manual di Spreadsheet: `Karyawan`, `Absensi`, `Pengaturan`, `Rekap`
- Isi sheet **Pengaturan** dengan kolom A (Key) dan B (Value):

  | Key | Contoh Value |
  |---|---|
  | Latitude Kantor | -7.612345 |
  | Longitude Kantor | 110.789012 |
  | Radius Toleransi (meter) | 100 |
  | Jam Masuk Default | 08:00 |
  | Toleransi Keterlambatan (menit) | 15 |
  | Email Penerima Notifikasi | hrd@toko.com |
  | Nomor WhatsApp Admin | 628123456789 |

**6. Deploy sebagai Web App**
- Klik **Deploy** → **New Deployment**
- Pilih tipe: **Web App**
- Atur:
  - **Execute as:** Me
  - **Who has access:** Anyone
- Klik **Deploy** → salin URL yang diberikan
- Buka URL tersebut di browser untuk mengakses aplikasi

<br/>

## 🔑 Akun Demo

> ⚠️ Akun berikut hanya untuk keperluan demo/review. Jangan gunakan untuk data produksi.

| Role | Username | Password |
|---|---|---|
| Admin / HRD | `admin` | `AdminKantor` |
| Admin / HRD | `hrd` | `AdminKantor` |
| Karyawan | `K001` | `passwordK001` |
| Karyawan | `K002` | `passwprdK002` |
| Karyawan | `K003` | `passwordK003` |

Untuk login sebagai karyawan, pilih tab **"Karyawan"** di halaman login sebelum memasukkan username.

> **❗ Tidak bisa login?** Ikuti langkah berikut:
> 1. Buka **Apps Script Editor** → pilih fungsi `setupUsers` dari dropdown
> 2. Klik **▶ Run** — ini akan **menghapus & membuat ulang** sheet Users dengan password yang sudah di-hash dengan benar
> 3. Berikan izin akses jika diminta (Authorization required)
> 4. Setelah selesai, coba login kembali dengan kredensial di atas
>
> **Penyebab umum:** Jika sheet Users pernah diisi manual (bukan via `setupUsers()`), password tidak akan ter-hash dengan benar dan login akan selalu gagal.

<br/>

## 📁 Struktur Project

```
GeoPresensi/
├── Code.gs          # Backend: auth, absensi, rekap, notifikasi email
├── Index.html       # Halaman utama: dashboard, form absen, rekap, master karyawan
├── Login.html       # Halaman login (standalone, untuk navigasi langsung)
├── Karyawan.html    # Halaman master karyawan (standalone)
├── Rekap.html       # Halaman rekap & laporan (standalone)
├── SETUP.md         # Panduan setup detail
└── README.md        # Dokumentasi project
```

<br/>

<div align="center">

### 👩‍💻 Developer

**Sandya Gifta**

*PKL Sesi 1 — Edusoft*

</div>

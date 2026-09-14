# GeoPresensi — Panduan Setup Lengkap

Sistem absensi karyawan berbasis foto selfie + GPS, dibangun di atas Google Apps Script, Google Sheets, dan Google Drive. **100% gratis**, tidak butuh hosting berbayar.

---

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Buat Google Spreadsheet](#2-buat-google-spreadsheet)
3. [Buat Project Apps Script](#3-buat-project-apps-script)
4. [Salin Kode ke Apps Script](#4-salin-kode-ke-apps-script)
5. [Jalankan Setup Sheets](#5-jalankan-setup-sheets)
6. [Isi Pengaturan Kantor](#6-isi-pengaturan-kantor)
7. [Deploy sebagai Web App](#7-deploy-sebagai-web-app)
8. [Bagikan URL ke Karyawan](#8-bagikan-url-ke-karyawan)
9. [Aktifkan Trigger Rekap Otomatis](#9-aktifkan-trigger-rekap-otomatis)
10. [Struktur Folder Google Drive](#10-struktur-folder-google-drive)
11. [Pertanyaan Umum (FAQ)](#11-pertanyaan-umum-faq)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prasyarat

| Kebutuhan | Keterangan |
|---|---|
| Akun Google | Gmail biasa sudah cukup, tidak perlu Google Workspace berbayar |
| Browser modern | Chrome, Edge, Firefox, atau Safari versi terbaru |
| Perangkat karyawan | HP Android/iOS atau laptop yang punya kamera + GPS |
| Koneksi internet | Diperlukan saat absen (untuk upload foto ke Drive) |

---

## 2. Buat Google Spreadsheet

1. Buka [sheets.google.com](https://sheets.google.com) → klik **"+ Spreadsheet kosong"**
2. Ganti nama file menjadi: `GeoPresensi - Data Absensi`
3. Catat **URL spreadsheet** di address bar — formatnya:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
   Simpan `SPREADSHEET_ID` tersebut, akan dibutuhkan di langkah berikutnya.

> Jangan ubah apapun di spreadsheet dulu. Semua sheet dan header akan dibuat otomatis oleh script.

---

## 3. Buat Project Apps Script

### Cara A — Terhubung langsung ke Spreadsheet (Disarankan)

1. Di spreadsheet yang baru dibuat, klik menu **Extensions** (Ekstensi) → **Apps Script**
2. Tab baru akan terbuka dengan editor Apps Script
3. Ganti nama project (pojok kiri atas) dari "Untitled project" menjadi: `GeoPresensi`

### Cara B — Project standalone

1. Buka [script.google.com](https://script.google.com) → klik **"New project"**
2. Jika menggunakan Cara B, ubah fungsi `getSheetsApp()` di `Code.gs`:
   ```javascript
   // Ganti baris ini:
   return SpreadsheetApp.getActiveSpreadsheet();

   // Menjadi (isi dengan Spreadsheet ID kamu):
   return SpreadsheetApp.openById("SPREADSHEET_ID_KAMU_DI_SINI");
   ```

---

## 4. Salin Kode ke Apps Script

### 4.1 File Code.gs

1. Di editor Apps Script, klik file **`Code.gs`** di panel kiri
2. **Hapus semua isi** yang ada (Ctrl+A → Delete)
3. **Salin seluruh isi** file `Code.gs` dari project ini → paste ke editor
4. Klik ikon 💾 **Save** (atau Ctrl+S)

### 4.2 File HTML

Untuk setiap file HTML, buat file baru di Apps Script:

1. Di panel kiri, klik ikon **"+"** → pilih **"HTML"**
2. Beri nama file sesuai tabel di bawah (tanpa ekstensi `.html`, Apps Script menambahnya otomatis):

| Nama File di Apps Script | File Sumber |
|---|---|
| `Index` | `Index.html` |
| `Karyawan` | `Karyawan.html` |
| `Rekap` | `Rekap.html` |

3. Hapus isi default, salin isi dari masing-masing file, paste, simpan.

### Hasil akhir struktur file di Apps Script:

```
GeoPresensi (project)
├── Code.gs
├── Index.html
├── Karyawan.html
└── Rekap.html
```

---

## 5. Jalankan Setup Sheets

Langkah ini membuat semua sheet dengan struktur yang benar, termasuk data karyawan contoh.

1. Di editor Apps Script, pastikan file **`Code.gs`** sedang aktif
2. Pada dropdown fungsi di toolbar (biasanya bertuliskan "select function"), pilih **`setupSheets`**
3. Klik tombol **▶ Run** (atau tekan Ctrl+R)
4. Saat muncul popup izin **"Authorization required"**:
   - Klik **"Review permissions"**
   - Pilih akun Google kamu
   - Klik **"Advanced"** → **"Go to GeoPresensi (unsafe)"**
   - Klik **"Allow"**

   > Peringatan "unsafe" muncul karena script belum diverifikasi Google. Ini normal untuk script pribadi.

5. Tunggu beberapa detik → akan muncul popup: **"✅ Setup selesai!"**
6. Buka spreadsheet → verifikasi 4 sheet sudah terbuat:
   - `Karyawan` — berisi 3 data karyawan contoh
   - `Absensi` — kosong, siap menerima data
   - `Pengaturan` — berisi nilai default
   - `Rekap` — kosong

---

## 6. Isi Pengaturan Kantor

### Cara Mendapatkan Koordinat Kantor

1. Buka [maps.google.com](https://maps.google.com)
2. Cari lokasi kantor kamu
3. **Klik kanan** tepat di lokasi kantor → klik koordinat yang muncul (format: `-6.200000, 106.816666`) untuk menyalinnya
4. Angka pertama = **Latitude**, angka kedua = **Longitude**

### Isi ke Sheet Pengaturan

Buka sheet **`Pengaturan`** di spreadsheet, isi kolom B sesuai kondisi kantor:

| Setting | Contoh Nilai | Keterangan |
|---|---|---|
| Latitude Kantor | `-6.200000` | Koordinat lintang kantor |
| Longitude Kantor | `106.816666` | Koordinat bujur kantor |
| Radius Toleransi (meter) | `100` | Jarak maks karyawan bisa absen. Untuk minimarket kecil: 50–100 m |
| Jam Masuk Default | `08:00` | Format 24 jam (HH:mm) |
| Toleransi Keterlambatan (menit) | `15` | Karyawan masuk setelah jam 08:15 dianggap Telat |
| Email Penerima Notifikasi | `hrd@toko.com` | Email HRD/owner penerima notifikasi |

> Atau isi via halaman **Karyawan → tab Pengaturan Sistem** di Web App setelah deploy.

---

## 7. Deploy sebagai Web App

1. Di editor Apps Script, klik menu **Deploy** → **New deployment**
2. Klik ikon ⚙️ di sebelah **"Select type"** → pilih **"Web app"**
3. Isi form deployment:

   | Field | Nilai |
   |---|---|
   | Description | `GeoPresensi v1.0` |
   | Execute as | **Me** (akun kamu) |
   | Who has access | **Anyone** *(agar karyawan bisa akses tanpa login Google)* |

4. Klik **Deploy**
5. Salin **Web App URL** yang muncul. Formatnya:
   ```
   https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec
   ```

> **Penting:** Setiap kali kamu mengubah `Code.gs` atau file HTML, harus deploy ulang dengan cara:
> Deploy → **Manage deployments** → klik ✏️ Edit → versi: **"New version"** → Deploy

---

## 8. Bagikan URL ke Karyawan

### URL yang dibagikan:

| Halaman | URL |
|---|---|
| Form Absen (default) | `https://script.google.com/macros/s/[ID]/exec` |
| Master Karyawan | `https://script.google.com/macros/s/[ID]/exec?page=Karyawan` |
| Rekap & Laporan | `https://script.google.com/macros/s/[ID]/exec?page=Rekap` |

### Tips distribusi:

- **Buat QR Code** dari URL form absen di [qr-code-generator.com](https://www.qr-code-generator.com) → cetak dan tempel di kasir/pintu masuk
- **WhatsApp** — kirim URL ke grup karyawan
- **Simpan ke homescreen HP** — buka URL di Chrome → klik ⋮ → "Add to Home screen" agar terasa seperti app

---

## 9. Aktifkan Trigger Rekap Otomatis

Trigger ini menjalankan rekap bulanan otomatis setiap tanggal 1 bulan baru pukul 07:00.

1. Di editor Apps Script, pada dropdown fungsi pilih **`buatTriggerBulanan`**
2. Klik **▶ Run**
3. Verifikasi trigger terdaftar: klik ikon ⏰ **Triggers** di panel kiri → pastikan ada trigger `jalankanRekapOtomatis`

---

## 10. Struktur Folder Google Drive

Folder foto selfie dibuat **otomatis** saat pertama kali ada absensi masuk. Lokasinya:

```
Google Drive (My Drive)
└── GeoPresensi_Foto/
    ├── absen_K001_20250115_081523.jpg
    ├── absen_K002_20250115_082001.jpg
    └── ...
```

- Setiap file foto diberi akses **"Anyone with the link can view"** secara otomatis
- Nama file format: `absen_[ID]_[YYYYMMDD]_[HHmmss].jpg`
- Foto tidak otomatis terhapus — kelola manual jika storage penuh

---

## 11. Pertanyaan Umum (FAQ)

**Q: Apakah karyawan harus punya akun Google?**
A: Tidak. Dengan setting "Who has access: Anyone", siapa pun bisa mengakses Web App tanpa login.

**Q: Apakah bisa digunakan di banyak cabang?**
A: Buat satu project Apps Script per cabang dengan spreadsheet dan koordinat kantor masing-masing.

**Q: Foto selfie disimpan di Drive siapa?**
A: Di Google Drive akun yang menjalankan script (pemilik project). Pastikan akun tersebut punya cukup storage.

**Q: Bagaimana cara menambah karyawan baru?**
A: Lewat halaman Web App → **Master Karyawan → tab Tambah Karyawan**, atau langsung edit sheet `Karyawan` di Google Sheets.

**Q: Apakah bisa diakses dari laptop juga?**
A: Ya. Tampilan responsif, tapi fitur kamera dan GPS mungkin membutuhkan izin browser di laptop juga.

**Q: Notifikasi email tidak masuk, kenapa?**
A: Cek:
1. Email di Sheet `Pengaturan` sudah benar
2. Akun Google kamu belum melebihi kuota `MailApp` (100 email/hari untuk akun gratis)
3. Cek folder Spam di email penerima

**Q: Quota Apps Script habis?**
A: Google Apps Script memiliki batas harian. Untuk UMKM kecil (<50 karyawan, <200 absen/hari) biasanya tidak masalah. Lihat batas di [developers.google.com/apps-script/guides/services/quotas](https://developers.google.com/apps-script/guides/services/quotas).

---

## 12. Troubleshooting

### Error: "Sheet 'Karyawan' tidak ditemukan"
**Penyebab:** `setupSheets()` belum dijalankan, atau nama sheet berubah.
**Solusi:** Jalankan ulang fungsi `setupSheets()` dari editor Apps Script.

---

### Karyawan tidak muncul di dropdown form absen
**Penyebab:** Sheet `Karyawan` kosong atau data dimulai dari baris yang salah.
**Solusi:** Pastikan baris 1 adalah header, data karyawan mulai baris 2. Kolom A wajib diisi (ID Karyawan).

---

### GPS tidak aktif / error "Izin lokasi ditolak"
**Penyebab:** Browser memblokir akses lokasi.
**Solusi:**
- Chrome Android: Ketuk ikon 🔒 di address bar → Izin → Lokasi → Izinkan
- Chrome Desktop: Ketuk ikon 🔒 di address bar → Location → Allow
- Pastikan URL Web App menggunakan **HTTPS** (URL `script.google.com` otomatis HTTPS)

---

### Kamera tidak muncul / error "NotAllowedError"
**Penyebab:** Browser memblokir akses kamera.
**Solusi:** Sama seperti GPS — beri izin kamera di pengaturan browser. Kamera hanya bisa diakses dari koneksi HTTPS (sudah terpenuhi oleh URL Apps Script).

---

### Foto gagal upload ke Drive
**Penyebab:** Ukuran foto terlalu besar atau quota Drive penuh.
**Solusi:** Kualitas foto sudah dikompres ke 85% JPEG di kode. Pastikan akun Google masih punya storage tersisa (cek di [drive.google.com/settings/storage](https://drive.google.com/settings/storage)).

---

### Error saat deploy: "Script function not found: doGet"
**Penyebab:** File `Code.gs` tidak tersimpan sebelum deploy.
**Solusi:** Ctrl+S di editor untuk save, lalu deploy ulang.

---

### Setelah update kode, tampilan tidak berubah
**Penyebab:** Web App masih menggunakan versi lama.
**Solusi:** Deploy → Manage deployments → Edit → pilih **"New version"** → Deploy. Lalu hard refresh browser (Ctrl+Shift+R).

---

## Struktur File Project

```
GeoPresensi/
├── Code.gs          ← Semua logika backend (Apps Script)
├── Index.html       ← Halaman utama: form absen, kamera, GPS, dashboard
├── Karyawan.html    ← Master karyawan + pengaturan sistem
├── Rekap.html       ← Rekap bulanan, slip PDF, log aktivitas
└── SETUP.md         ← Panduan ini
```

## Struktur Google Sheets

```
GeoPresensi - Data Absensi (Spreadsheet)
├── Sheet: Karyawan    ← Master data karyawan
├── Sheet: Absensi     ← Log transaksi absensi (otomatis terisi)
├── Sheet: Pengaturan  ← Konfigurasi sistem
└── Sheet: Rekap       ← Rekap bulanan (dibuat otomatis oleh script)
```

---

*GeoPresensi — Dibuat dengan Google Apps Script. Gratis selamanya.*

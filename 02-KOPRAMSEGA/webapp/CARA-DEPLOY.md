# Cara Deploy KOPRAMSEGA Web App

## LANGKAH 1 — Siapkan Spreadsheet

1. Buka KOPRAMSEGA_DB di Google Sheets
2. Ekstensi -> Apps Script -> paste isi file `setup_sheets.js`
3. Jalankan fungsi `setupSheetsTambahan`
4. Ini akan tambah sheet Timer, Latihan, Pengumuman + kolom Password di User

## LANGKAH 2 — Ambil Spreadsheet ID

1. Lihat URL Google Sheets kamu:
   `https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXX/edit`
2. Copy bagian XXXXXXXXXXXXXXX — itu adalah Spreadsheet ID

## LANGKAH 3 — Buat Project Apps Script Baru

1. Buka script.google.com
2. Klik "Proyek Baru"
3. Ganti nama project jadi "KOPRAMSEGA"

## LANGKAH 4 — Upload File

Di Apps Script editor:

### File Code.gs (sudah ada):
- Paste isi file `Code.gs`
- Ganti baris: `const SPREADSHEET_ID = 'GANTI_DENGAN_ID_SPREADSHEET_KAMU';`
  dengan ID spreadsheet kamu dari Langkah 2

### File index.html (buat baru):
- Klik + di sebelah Files -> HTML
- Nama file: `index`
- Paste isi file `index.html`

### File style.html (buat baru):
- Klik + -> HTML
- Nama file: `style`
- Paste isi file `style.html`

### File app.html (buat baru):
- Klik + -> HTML
- Nama file: `app`
- Paste isi file `app.html`

## LANGKAH 5 — Deploy

1. Klik tombol "Deploy" (kanan atas) -> "New deployment"
2. Klik ikon gear -> pilih "Web app"
3. Isi:
   - Description: KOPRAMSEGA v1.0
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Klik "Deploy"
5. Klik "Authorize access" -> pilih akun Google -> Allow
6. COPY LINK yang muncul — itu link app kamu!

## LANGKAH 6 — Setup User

Buka sheet User di KOPRAMSEGA_DB, tambah data anggota:
- ID_User: USR-XXX
- Nama: (nama anggota)
- Kelas: (kelas)
- Email: (email)
- ID_Role: SA / ADM / USR
- Status: Aktif
- Foto: (kosong)
- Password: (password pilihan)

## LANGKAH 7 — Share Link

Bagikan link deploy ke semua anggota.
Mereka langsung bisa akses tanpa install apapun!

## Login Default (setelah setup_sheets.js dijalankan)
- Username: (nama yang ada di sheet User kolom Nama)
- Password: admin123 (untuk USR-001, ganti setelah login pertama)

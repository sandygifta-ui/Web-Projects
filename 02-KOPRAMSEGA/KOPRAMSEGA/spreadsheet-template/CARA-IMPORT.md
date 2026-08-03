# Cara Setup Google Spreadsheet KOPRAMSEGA_DB

## Langkah 1 — Buat Spreadsheet Baru
1. Buka https://sheets.new di browser
2. Rename file menjadi: KOPRAMSEGA_DB

## Langkah 2 — Import Tiap Sheet (lakukan 9 kali)

Untuk setiap file CSV di folder ini, lakukan langkah berikut:

1. Di Google Sheets, klik tanda + di bawah (tambah sheet baru)
2. Rename sheet sesuai nama berikut (urutan penting):
     Sheet 1  -> Role
     Sheet 2  -> User
     Sheet 3  -> Periode
     Sheet 4  -> Jabatan
     Sheet 5  -> Kandidat
     Sheet 6  -> Voting
     Sheet 7  -> Riwayat_Voting
     Sheet 8  -> Setting
     Sheet 9  -> Dokumentasi

3. Klik pada sheet yang sudah dibuat (misal: Role)
4. Menu: File -> Import
5. Tab: Upload -> pilih file CSV yang sesuai:
     Sheet Role           -> 01_Role.csv
     Sheet User           -> 02_User.csv
     Sheet Periode        -> 03_Periode.csv
     Sheet Jabatan        -> 04_Jabatan.csv
     Sheet Kandidat       -> 05_Kandidat.csv
     Sheet Voting         -> 06_Voting.csv
     Sheet Riwayat_Voting -> 07_Riwayat_Voting.csv
     Sheet Setting        -> 08_Setting.csv
     Sheet Dokumentasi    -> 09_Dokumentasi.csv
6. Pilihan import:
     Import location  : Replace current sheet
     Separator type   : Comma
     Convert text to numbers and dates: YES
7. Klik Import data

## Langkah 3 — Setup Formula Token_Hash di Sheet Voting

Setelah import sheet Voting, kolom _Token_Raw masih kosong.
Isi formula di sel G2:

  =IF(A2="","",DEC2HEX(MOD(SUMPRODUCT(
    CODE(MID(CONCATENATE(C2,B2,"KOPRAMSEGA_SALT_2025"),
      ROW(INDIRECT("1:"&LEN(CONCATENATE(C2,B2,"KOPRAMSEGA_SALT_2025")))),1))
    *ROW(INDIRECT("1:"&LEN(CONCATENATE(C2,B2,"KOPRAMSEGA_SALT_2025"))))
  ),16^8)))

Drag formula G2 ke bawah sampai G500.
Klik kanan header kolom G -> Hide column.

## Langkah 4 — Update Data di Sheet User

Buka sheet User, ganti baris 2:
  - Email: ganti dengan email Google Pembina (Super Admin) yang asli
  - Nama : ganti dengan nama Pembina
  - Kelas: sesuaikan

## Langkah 5 — Freeze Header Semua Sheet

Untuk tiap sheet:
  1. Klik baris 1
  2. Menu: View -> Freeze -> 1 row

## Langkah 6 — Batasi Akses Spreadsheet

1. Klik tombol Share (kanan atas)
2. Pastikan hanya email Pembina (SA) yang punya akses Editor
3. Anggota biasa TIDAK boleh diberi akses ke Spreadsheet ini
4. AppSheet akan dapat akses otomatis melalui akun Google yang
   dipakai saat membuat app

## Selesai!

Spreadsheet KOPRAMSEGA_DB siap dihubungkan ke AppSheet.
Lanjutkan ke FASE 2 di tasks.md.

// Jalankan fungsi ini DI SPREADSHEET KOPRAMSEGA_DB yang sudah ada
// Ekstensi -> Apps Script -> paste -> Run setupSheetsTambahan()

function setupSheetsTambahan() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Update sheet User - tambah kolom Password
  var user = ss.getSheetByName('User');
  if (user) {
    var headers = user.getRange(1,1,1,user.getLastColumn()).getValues()[0];
    if (headers.indexOf('Password') === -1) {
      user.getRange(1, user.getLastColumn()+1).setValue('Password');
      // Set password default untuk USR-001
      var data = user.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === 'USR-001') {
          user.getRange(i+1, user.getLastColumn()).setValue('admin123');
        }
      }
    }
  }

  // Buat sheet Timer
  var timer = ss.getSheetByName('Timer');
  if (!timer) {
    timer = ss.insertSheet('Timer');
    timer.getRange('A1:D1').setValues([['ID_Timer','Nama_Preset','Durasi_Detik','Dibuat_Oleh']]);
    timer.getRange('A1:D1').setFontWeight('bold').setBackground('#1565C0').setFontColor('#FFFFFF');
    timer.setFrozenRows(1);
    // Preset default
    timer.getRange('A2:C5').setValues([
      ['TMR-001','Sesi Materi 45 Menit', 2700],
      ['TMR-002','Sesi Diskusi 30 Menit', 1800],
      ['TMR-003','Istirahat 15 Menit', 900],
      ['TMR-004','Latihan Fisik 60 Menit', 3600]
    ]);
  }

  // Buat sheet Latihan
  var lat = ss.getSheetByName('Latihan');
  if (!lat) {
    lat = ss.insertSheet('Latihan');
    lat.getRange('A1:G1').setValues([['ID_Latihan','Judul','Deskripsi','Link_Google_Form','Tanggal_Buka','Tanggal_Tutup','Dibuat_Oleh']]);
    lat.getRange('A1:G1').setFontWeight('bold').setBackground('#1565C0').setFontColor('#FFFFFF');
    lat.setFrozenRows(1);
  }

  // Buat sheet Pengumuman
  var png = ss.getSheetByName('Pengumuman');
  if (!png) {
    png = ss.insertSheet('Pengumuman');
    png.getRange('A1:H1').setValues([['ID_Pengumuman','Judul','Isi','Kategori','File_Lampiran','Tanggal_Publish','Dibuat_Oleh','Pin_Atas']]);
    png.getRange('A1:H1').setFontWeight('bold').setBackground('#1565C0').setFontColor('#FFFFFF');
    png.setFrozenRows(1);
    // Pengumuman welcome
    png.getRange('A2:H2').setValues([[
      'PNG-001',
      'Selamat Datang di KOPRAMSEGA!',
      'Sistem Digital Komando Pramuka SMEA 3 telah resmi diluncurkan. Gunakan aplikasi ini untuk mengakses jadwal latihan, timer kegiatan, latihan soal, dan pengumuman terbaru.',
      'Pengumuman',
      '',
      new Date(),
      'SA',
      true
    ]]);
  }

  SpreadsheetApp.getUi().alert(
    'Setup selesai!\n\n' +
    'Sheet yang ditambahkan/diupdate:\n' +
    '✓ User (kolom Password ditambah)\n' +
    '✓ Timer (+ 4 preset default)\n' +
    '✓ Latihan\n' +
    '✓ Pengumuman (+ 1 pengumuman welcome)\n\n' +
    'Selanjutnya:\n' +
    '1. Buat project Apps Script BARU\n' +
    '2. Paste Code.gs\n' +
    '3. Ganti SPREADSHEET_ID\n' +
    '4. Deploy sebagai Web App\n' +
    '5. Share link ke semua anggota!'
  );
}

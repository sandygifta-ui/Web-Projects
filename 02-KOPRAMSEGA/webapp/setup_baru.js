function setupKOPRAMSEGABaru() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var user = ss.insertSheet('User');
  user.getRange('A1:H1').setValues([['ID_User','Nama','Kelas','Email','ID_Role','Status','Foto','Password']]);
  styleH(user,'A1:H1');
  user.setFrozenRows(1);
  user.getRange('A2:H3').setValues([
    ['USR-001','Admin KOPRAMSEGA','-','admin@kopramsega.id','SA','Aktif','','admin123'],
    ['USR-002','Dewan Ambalan','-','dewan@kopramsega.id','ADM','Aktif','','dewan123']
  ]);

  var jadwal = ss.insertSheet('Jadwal');
  jadwal.getRange('A1:J1').setValues([['ID_Jadwal','Kategori','Judul','Tanggal','Jam','Materi','Pembina','Lokasi','Keterangan','Dibuat_Oleh']]);
  styleH(jadwal,'A1:J1'); jadwal.setFrozenRows(1);

  var timer = ss.insertSheet('Timer');
  timer.getRange('A1:D1').setValues([['ID_Timer','Nama_Preset','Durasi_Detik','Dibuat_Oleh']]);
  styleH(timer,'A1:D1'); timer.setFrozenRows(1);
  timer.getRange('A2:C5').setValues([
    ['TMR-001','Sesi Materi 45 Menit',2700],
    ['TMR-002','Sesi Diskusi 30 Menit',1800],
    ['TMR-003','Istirahat 15 Menit',900],
    ['TMR-004','Latihan Fisik 60 Menit',3600]
  ]);

  var lat = ss.insertSheet('Latihan');
  lat.getRange('A1:G1').setValues([['ID_Latihan','Judul','Deskripsi','Link_Google_Form','Tanggal_Buka','Tanggal_Tutup','Dibuat_Oleh']]);
  styleH(lat,'A1:G1'); lat.setFrozenRows(1);

  var png = ss.insertSheet('Pengumuman');
  png.getRange('A1:H1').setValues([['ID_Pengumuman','Judul','Isi','Kategori','File_Lampiran','Tanggal_Publish','Dibuat_Oleh','Pin_Atas']]);
  styleH(png,'A1:H1'); png.setFrozenRows(1);
  png.getRange('A2:H2').setValues([[
    'PNG-001','Selamat Datang di KOPRAMSEGA!',
    'Sistem Digital Komando Pramuka SMEA 3 telah resmi diluncurkan.',
    'Pengumuman','',new Date(),'SA',true
  ]]);

  ss.deleteSheet(ss.getSheetByName('__TEMP__'));
  ss.rename('KOPRAMSEGA_DB');

  SpreadsheetApp.getUi().alert('SELESAI!\n\nLogin default:\nSA: admin@kopramsega.id / admin123\nAdmin: dewan@kopramsega.id / dewan123\n\nSekarang copy ID dari URL spreadsheet ini!');
}

function styleH(sheet, range) {
  sheet.getRange(range).setFontWeight('bold').setBackground('#1565C0').setFontColor('#FFFFFF');
}

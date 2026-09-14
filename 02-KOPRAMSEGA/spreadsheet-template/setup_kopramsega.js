function setupKOPRAMSEGA() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  buatSheet(ss, "Role", ["ID_Role","Nama_Role"]);
  buatSheet(ss, "User", ["ID_User","Nama","Kelas","Email","ID_Role","Status","Foto"]);
  buatSheet(ss, "Periode", ["ID_Periode","Nama_Periode","Tahun_Mulai","Tahun_Selesai","Status"]);
  buatSheet(ss, "Jabatan", ["ID_Jabatan","Nama_Jabatan","ID_Periode","Urutan_Tampil"]);
  buatSheet(ss, "Kandidat", ["ID_Kandidat","ID_User","ID_Jabatan","Riwayat_Organisasi","Prestasi","Motto","Visi","Misi","Program_Kerja","Nomor_Urut","Status"]);
  buatSheet(ss, "Voting", ["ID_Voting","ID_Periode","ID_Jabatan","ID_Kandidat_Dipilih","Timestamp","Token_Hash","_Token_Raw"]);
  buatSheet(ss, "Riwayat_Voting", ["ID_Riwayat","ID_User","ID_Jabatan","Sudah_Voting","Timestamp"]);
  buatSheet(ss, "Setting", ["Key","Value"]);
  buatSheet(ss, "Dokumentasi", ["ID_Dokumentasi","ID_Periode","Judul","File","Tanggal"]);

  isiData(ss);

  SpreadsheetApp.getUi().alert("SELESAI! Ganti EMAIL_KAMU di sheet User baris 2!");
}

function buatSheet(ss, nama, headers) {
  var s = ss.getSheetByName(nama);
  if (!s) s = ss.insertSheet(nama);
  s.clearContents();
  var r = s.getRange(1, 1, 1, headers.length);
  r.setValues([headers]);
  r.setFontWeight("bold").setBackground("#1565C0").setFontColor("#FFFFFF");
  s.setFrozenRows(1);
}

function isiData(ss) {
  ss.getSheetByName("Role").getRange("A2:B4").setValues([
    ["SA","Super Admin"],["ADM","Admin"],["USR","User"]
  ]);
  ss.getSheetByName("User").getRange("A2:F2").setValues([
    ["USR-001","Nama Pembina","-","EMAIL_KAMU","SA","Aktif"]
  ]);
  ss.getSheetByName("Periode").getRange("A2:E2").setValues([
    ["PRD-2526","Angkatan 25-26",2025,2026,"Aktif"]
  ]);
  ss.getSheetByName("Jabatan").getRange("A2:D7").setValues([
    ["JAB-01","Pradana Putra","PRD-2526",1],
    ["JAB-02","Pradana Putri","PRD-2526",2],
    ["JAB-03","Wakil Pradana Putra","PRD-2526",3],
    ["JAB-04","Wakil Pradana Putri","PRD-2526",4],
    ["JAB-05","Pemangku Adat Putra","PRD-2526",5],
    ["JAB-06","Pemangku Adat Putri","PRD-2526",6]
  ]);
  ss.getSheetByName("Setting").getRange("A2:B5").setValues([
    ["voting_status","Ditutup"],
    ["voting_start",""],
    ["voting_end",""],
    ["periode_aktif","PRD-2526"]
  ]);
  ss.getSheetByName("Voting").getRange("G2")
    .setFormula('=IF(A2="","",BASE64ENCODE(CONCATENATE(C2,B2,"KOPRAMSEGA_SALT_2025")))');
}

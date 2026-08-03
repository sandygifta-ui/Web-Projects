// KOPRAMSEGA - Google Apps Script Backend
// Deploy sebagai Web App: Execute as Me, Who has access: Anyone

const SPREADSHEET_ID = '16a_MN_LLz83AhW4pvIwzgxQvOo1Bo4tSYthySRDqjAA';

function getSheet(nama) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(nama);
}

// =============================================
// ROUTING
// =============================================
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('KOPRAMSEGA')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =============================================
// AUTH
// Login ditangani langsung di frontend (app.html) secara hardcode.
// Untuk menambah/mengubah akun, edit array USERS di app.html.
// =============================================

// =============================================
// JADWAL
// =============================================
function getJadwal() {
  try {
    var sheet = getSheet('Jadwal');
    var data = sheet.getDataRange().getValues();
    var result = [];
    var today = new Date();
    today.setHours(0,0,0,0);
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === '') continue;
      var tgl = new Date(data[i][3]);
      tgl.setHours(0,0,0,0);
      result.push({
        id: data[i][0],
        kategori: data[i][1],
        judul: data[i][2],
        tanggal: data[i][3] ? Utilities.formatDate(new Date(data[i][3]), 'Asia/Jakarta', 'dd MMM yyyy') : '-',
        jam: data[i][4],
        materi: data[i][5],
        pembina: data[i][6],
        lokasi: data[i][7],
        keterangan: data[i][8],
        status: tgl < today ? 'Selesai' : 'Mendatang',
        rawTanggal: data[i][3] ? new Date(data[i][3]).getTime() : 0
      });
    }
    result.sort(function(a,b) { return a.rawTanggal - b.rawTanggal; });
    return { success: true, data: result };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function addJadwal(data) {
  try {
    var sheet = getSheet('Jadwal');
    var id = 'JDW-' + new Date().getTime();
    sheet.appendRow([id, data.kategori, data.judul, data.tanggal, data.jam, data.materi, data.pembina, data.lokasi, data.keterangan, data.dibuatOleh]);
    return { success: true };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function deleteJadwal(id) {
  try {
    var sheet = getSheet('Jadwal');
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: 'Data tidak ditemukan.' };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// =============================================
// TIMER PRESET
// =============================================
function getTimerPresets() {
  try {
    var sheet = getSheet('Timer');
    var data = sheet.getDataRange().getValues();
    var result = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === '') continue;
      result.push({
        id: data[i][0],
        nama: data[i][1],
        durasi: data[i][2]
      });
    }
    return { success: true, data: result };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function addTimerPreset(data) {
  try {
    var sheet = getSheet('Timer');
    var id = 'TMR-' + new Date().getTime();
    sheet.appendRow([id, data.nama, data.durasi, data.dibuatOleh]);
    return { success: true };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function deleteTimerPreset(id) {
  try {
    var sheet = getSheet('Timer');
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// =============================================
// LATIHAN SOAL
// =============================================
function getLatihan() {
  try {
    var sheet = getSheet('Latihan');
    var data = sheet.getDataRange().getValues();
    var result = [];
    var now = new Date();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === '') continue;
      var buka = new Date(data[i][4]);
      var tutup = new Date(data[i][5]);
      var status = '';
      if (now < buka) status = 'Belum Dibuka';
      else if (now > tutup) status = 'Sudah Ditutup';
      else status = 'Aktif';
      result.push({
        id: data[i][0],
        judul: data[i][1],
        deskripsi: data[i][2],
        link: data[i][3],
        tanggalBuka: data[i][4] ? Utilities.formatDate(new Date(data[i][4]), 'Asia/Jakarta', 'dd MMM yyyy HH:mm') : '-',
        tanggalTutup: data[i][5] ? Utilities.formatDate(new Date(data[i][5]), 'Asia/Jakarta', 'dd MMM yyyy HH:mm') : '-',
        status: status
      });
    }
    return { success: true, data: result };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function addLatihan(data) {
  try {
    var sheet = getSheet('Latihan');
    var id = 'LAT-' + new Date().getTime();
    sheet.appendRow([id, data.judul, data.deskripsi, data.link, data.tanggalBuka, data.tanggalTutup, data.dibuatOleh]);
    return { success: true };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function deleteLatihan(id) {
  try {
    var sheet = getSheet('Latihan');
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// =============================================
// PENGUMUMAN
// =============================================
function getPengumuman() {
  try {
    var sheet = getSheet('Pengumuman');
    var data = sheet.getDataRange().getValues();
    var result = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === '') continue;
      result.push({
        id: data[i][0],
        judul: data[i][1],
        isi: data[i][2],
        kategori: data[i][3],
        file: data[i][4],
        tanggal: data[i][5] ? Utilities.formatDate(new Date(data[i][5]), 'Asia/Jakarta', 'dd MMM yyyy') : '-',
        dibuatOleh: data[i][6],
        pin: data[i][7] === true || data[i][7] === 'TRUE',
        rawTanggal: data[i][5] ? new Date(data[i][5]).getTime() : 0
      });
    }
    result.sort(function(a,b) {
      if (a.pin && !b.pin) return -1;
      if (!a.pin && b.pin) return 1;
      return b.rawTanggal - a.rawTanggal;
    });
    return { success: true, data: result };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function addPengumuman(data) {
  try {
    var sheet = getSheet('Pengumuman');
    var id = 'PNG-' + new Date().getTime();
    var tgl = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
    sheet.appendRow([id, data.judul, data.isi, data.kategori, data.file || '', tgl, data.dibuatOleh, data.pin || false]);
    return { success: true };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function deletePengumuman(id) {
  try {
    var sheet = getSheet('Pengumuman');
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// =============================================
// DASHBOARD
// =============================================
function getDashboard() {
  try {
    var jadwal = getJadwal();
    var pengumuman = getPengumuman();
    var latihan = getLatihan();

    var jadwalTerdekat = null;
    if (jadwal.success && jadwal.data.length > 0) {
      var mendatang = jadwal.data.filter(function(j) { return j.status === 'Mendatang'; });
      jadwalTerdekat = mendatang.length > 0 ? mendatang[0] : null;
    }

    var pinned = pengumuman.success ? pengumuman.data.filter(function(p) { return p.pin; }).slice(0,2) : [];
    var latihanAktif = latihan.success ? latihan.data.filter(function(l) { return l.status === 'Aktif'; }) : [];

    return {
      success: true,
      jadwalTerdekat: jadwalTerdekat,
      pengumumanPin: pinned,
      latihanAktif: latihanAktif.length
    };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}



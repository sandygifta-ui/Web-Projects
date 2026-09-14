// =============================================================
// JEJAK — Google Apps Script Backend
// =============================================================
// SETUP: Isi SPREADSHEET_ID dengan ID dari Google Sheets kamu.
// Ambil dari URL: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
// =============================================================

const SPREADSHEET_ID = '1tvS_2ZUKLgXTpaf3TekxtT-CsbR1zKfXKetXHMFomjA';

// Sheet names
const SHEET_TUGAS      = 'Tugas';
const SHEET_PENGELUARAN = 'Pengeluaran';
const SHEET_CATATAN    = 'Catatan_Harian';
const SHEET_USER       = 'User';

// ---------------------------------------------------------------
// ENTRY POINTS
// ---------------------------------------------------------------

function doGet(e) {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Jejak')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action  = payload.action;
    const data    = payload.data || {};

    const handlers = {
      login         : () => login(data),
      getTodayData  : () => getTodayData(),
      getTasks      : () => getTasks(data),
      addTask       : () => addTask(data),
      updateTask    : () => updateTask(data),
      deleteTask    : () => deleteRecord(SHEET_TUGAS, 'Tugas_ID', data.id),
      getExpenses   : () => getExpenses(data),
      addExpense    : () => addExpense(data),
      deleteExpense : () => deleteRecord(SHEET_PENGELUARAN, 'Pengeluaran_ID', data.id),
      getNotes      : () => getNotes(),
      addNote       : () => addNote(data),
      getNoteDetail : () => getNoteDetail(data),
      deleteNote    : () => deleteRecord(SHEET_CATATAN, 'Catatan_ID', data.id),
    };

    if (!handlers[action]) {
      return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
    }

    const result = handlers[action]();
    return jsonResponse({ status: 'success', data: result });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" tidak ditemukan.');
  return sheet;
}

/**
 * Konversi semua data sheet ke array of objects menggunakan baris header.
 */
function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map((row, i) => {
    const obj = { _rowIndex: i + 2 }; // 1-indexed, +1 for header
    headers.forEach((h, j) => {
      // Format Date objects ke string YYYY-MM-DD
      if (row[j] instanceof Date) {
        obj[h] = Utilities.formatDate(row[j], Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        obj[h] = row[j];
      }
    });
    return obj;
  });
}

/**
 * Generate ID otomatis: prefix + 3-digit number berdasarkan jumlah baris data.
 */
function generateId(sheet, prefix) {
  const lastRow = sheet.getLastRow(); // termasuk header
  const num = lastRow; // row 1 = header, row 2 = record ke-1 → ID = prefix + "001"
  return prefix + String(num).padStart(3, '0');
}

/**
 * Hapus baris berdasarkan nilai di kolom ID tertentu.
 */
function deleteRecord(sheetName, idColumn, idValue) {
  const sheet = getSheet(sheetName);
  const data  = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIdx = headers.indexOf(idColumn);
  if (idColIdx === -1) throw new Error('Kolom ' + idColumn + ' tidak ditemukan.');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(idValue)) {
      sheet.deleteRow(i + 1); // +1 karena array 0-indexed tapi sheet 1-indexed
      return { deleted: idValue };
    }
  }
  throw new Error('Record dengan ID ' + idValue + ' tidak ditemukan.');
}

/**
 * Ambil tanggal hari ini sebagai string YYYY-MM-DD di timezone script.
 */
function getTodayString() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// ---------------------------------------------------------------
// HANDLER: LOGIN
// ---------------------------------------------------------------

function login(data) {
  if (!data.username) throw new Error('Username wajib diisi.');
  if (!data.password) throw new Error('Password wajib diisi.');

  const sheet = getSheet(SHEET_USER);
  const users = sheetToObjects(sheet);

  const user = users.find(u =>
    String(u['Username']).toLowerCase() === String(data.username).toLowerCase() &&
    String(u['Password']) === String(data.password)
  );

  if (!user) {
    throw new Error('Username atau password salah.');
  }

  return {
    user_id     : user['User_ID'],
    username    : user['Username'],
    nama_lengkap: user['Nama_Lengkap'],
  };
}

// ---------------------------------------------------------------
// HANDLER: TODAY DATA
// ---------------------------------------------------------------

function getTodayData() {
  const today = getTodayString();

  // Tugas: deadline <= hari ini dan status bukan Selesai
  const tugasSheet = getSheet(SHEET_TUGAS);
  const semuaTugas = sheetToObjects(tugasSheet);
  const tugasHariIni = semuaTugas.filter(t => {
    return t['Deadline'] && t['Deadline'] <= today && t['Status'] !== 'Selesai';
  });

  // Pengeluaran hari ini
  const expSheet = getSheet(SHEET_PENGELUARAN);
  const semuaExp = sheetToObjects(expSheet);
  const expHariIni = semuaExp.filter(e => e['Tanggal'] === today);

  const totalHariIni = expHariIni.reduce((sum, e) => sum + (Number(e['Jumlah']) || 0), 0);

  // Breakdown per kategori
  const breakdown = {};
  expHariIni.forEach(e => {
    const kat = e['Kategori'] || 'Lainnya';
    breakdown[kat] = (breakdown[kat] || 0) + (Number(e['Jumlah']) || 0);
  });

  return {
    today      : today,
    tugas      : tugasHariIni,
    totalHariIni: totalHariIni,
    breakdown  : breakdown,
    expenses   : expHariIni,
  };
}

// ---------------------------------------------------------------
// HANDLER: TUGAS
// ---------------------------------------------------------------

function getTasks(data) {
  const sheet = getSheet(SHEET_TUGAS);
  let tasks = sheetToObjects(sheet);

  // Filter by status
  if (data.status && data.status !== 'Semua') {
    tasks = tasks.filter(t => t['Status'] === data.status);
  }

  // Urutkan by Deadline terdekat (null/kosong di bawah)
  tasks.sort((a, b) => {
    if (!a['Deadline']) return 1;
    if (!b['Deadline']) return -1;
    return a['Deadline'].localeCompare(b['Deadline']);
  });

  return tasks;
}

function addTask(data) {
  const sheet = getSheet(SHEET_TUGAS);
  const id = generateId(sheet, 'TSK');

  // Validasi
  if (!data.Judul_Tugas) throw new Error('Judul tugas wajib diisi.');
  if (!data.Kategori)    throw new Error('Kategori wajib diisi.');
  if (!data.Deadline)    throw new Error('Deadline wajib diisi.');
  if (!data.Prioritas)   throw new Error('Prioritas wajib diisi.');

  sheet.appendRow([
    id,
    data.Judul_Tugas,
    data.Kategori,
    data.Deadline,
    data.Prioritas,
    data.Status || 'Belum',
  ]);

  return { id: id };
}

function updateTask(data) {
  const sheet   = getSheet(SHEET_TUGAS);
  const rows    = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol   = headers.indexOf('Tugas_ID');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(data.id)) {
      const rowNum = i + 1;
      // Update hanya kolom yang dikirim
      const fieldMap = {
        Judul_Tugas : headers.indexOf('Judul_Tugas'),
        Kategori    : headers.indexOf('Kategori'),
        Deadline    : headers.indexOf('Deadline'),
        Prioritas   : headers.indexOf('Prioritas'),
        Status      : headers.indexOf('Status'),
      };
      Object.keys(fieldMap).forEach(field => {
        if (data[field] !== undefined && fieldMap[field] !== -1) {
          sheet.getRange(rowNum, fieldMap[field] + 1).setValue(data[field]);
        }
      });
      return { updated: data.id };
    }
  }
  throw new Error('Tugas dengan ID ' + data.id + ' tidak ditemukan.');
}

// ---------------------------------------------------------------
// HANDLER: PENGELUARAN
// ---------------------------------------------------------------

function getExpenses(data) {
  const sheet = getSheet(SHEET_PENGELUARAN);
  let expenses = sheetToObjects(sheet);

  // Default: bulan berjalan
  const now = new Date();
  const defaultMonth = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM');

  const filterMonth    = data.month    || defaultMonth;
  const filterKategori = data.kategori || '';
  const filterFrom     = data.from     || '';
  const filterTo       = data.to       || '';

  expenses = expenses.filter(e => {
    const tgl = e['Tanggal'] || '';
    // Filter rentang tanggal custom
    if (filterFrom && filterTo) {
      if (tgl < filterFrom || tgl > filterTo) return false;
    } else {
      // Default filter bulan
      if (!tgl.startsWith(filterMonth)) return false;
    }
    // Filter kategori
    if (filterKategori && e['Kategori'] !== filterKategori) return false;
    return true;
  });

  // Urutkan terbaru dulu
  expenses.sort((a, b) => b['Tanggal'].localeCompare(a['Tanggal']));

  // Hitung total & breakdown
  const total = expenses.reduce((sum, e) => sum + (Number(e['Jumlah']) || 0), 0);
  const breakdown = {};
  expenses.reduce((_, e) => {
    const kat = e['Kategori'] || 'Lainnya';
    breakdown[kat] = (breakdown[kat] || 0) + (Number(e['Jumlah']) || 0);
  }, null);

  return { expenses, total, breakdown };
}

function addExpense(data) {
  const sheet = getSheet(SHEET_PENGELUARAN);
  const id = generateId(sheet, 'EXP');

  // Validasi
  if (!data.Tanggal)   throw new Error('Tanggal wajib diisi.');
  if (!data.Kategori)  throw new Error('Kategori wajib diisi.');
  if (!data.Deskripsi) throw new Error('Deskripsi wajib diisi.');
  if (data.Jumlah === undefined || data.Jumlah === '') throw new Error('Jumlah wajib diisi.');
  const jumlah = Number(data.Jumlah);
  if (isNaN(jumlah) || jumlah <= 0) throw new Error('Jumlah harus angka positif.');

  sheet.appendRow([
    id,
    data.Tanggal,
    data.Kategori,
    data.Deskripsi,
    jumlah,
    data.Catatan || '',
  ]);

  return { id: id };
}

// ---------------------------------------------------------------
// HANDLER: CATATAN HARIAN
// ---------------------------------------------------------------

function getNotes() {
  const sheet = getSheet(SHEET_CATATAN);
  let notes = sheetToObjects(sheet);

  // Urutkan terbaru dulu
  notes.sort((a, b) => b['Tanggal'].localeCompare(a['Tanggal']));

  // Tambahkan field preview (100 karakter pertama)
  notes = notes.map(n => ({
    ...n,
    preview: String(n['Isi_Catatan'] || '').substring(0, 100),
  }));

  return notes;
}

function getNoteDetail(data) {
  const sheet = getSheet(SHEET_CATATAN);
  const notes = sheetToObjects(sheet);
  const note  = notes.find(n => String(n['Catatan_ID']) === String(data.id));
  if (!note) throw new Error('Catatan dengan ID ' + data.id + ' tidak ditemukan.');
  return note;
}

function addNote(data) {
  const sheet = getSheet(SHEET_CATATAN);
  const id = generateId(sheet, 'NTE');

  // Validasi
  if (!data.Tanggal)     throw new Error('Tanggal wajib diisi.');
  if (!data.Isi_Catatan) throw new Error('Isi catatan wajib diisi.');

  sheet.appendRow([
    id,
    data.Tanggal,
    data.Isi_Catatan,
    data.Mood || '',
  ]);

  return { id: id };
}

// ---------------------------------------------------------------
// INCLUDE helper untuk HtmlService
// ---------------------------------------------------------------
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

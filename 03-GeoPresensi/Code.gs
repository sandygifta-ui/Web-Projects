// ============================================================
// GeoPresensi - Google Apps Script Backend
// Sistem Absensi Karyawan Berbasis Foto Selfie & GPS
// ============================================================

// ---- KONFIGURASI NAMA SHEET & FOLDER ----
var SHEET_KARYAWAN    = "Karyawan";
var SHEET_ABSENSI     = "Absensi";
var SHEET_PENGATURAN  = "Pengaturan";
var SHEET_REKAP       = "Rekap";
var SHEET_USERS       = "Users";
var FOLDER_NAME       = "GeoPresensi_Foto";
// Durasi sesi login: 8 jam (dalam milidetik)
var DURASI_SESI_MS    = 8 * 60 * 60 * 1000;

// Halaman yang boleh diakses setiap role
// admin : semua halaman
// karyawan : hanya Index (form absen)
var AKSES_ROLE = {
  admin    : ["Index", "Karyawan", "Rekap", "Log", "Pengaturan"],
  karyawan : ["Index"]
};

// ============================================================
// doGet(e) — Entry point utama Web App
// Cek token sesi dari URL param. Jika tidak valid, redirect
// ke halaman Login. Jika valid, tampilkan halaman yang diminta.
// ============================================================
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : "Index";

  var judulHalaman = {
    Index     : "GeoPresensi — Dashboard Absensi",
    Karyawan  : "GeoPresensi — Master Karyawan",
    Rekap     : "GeoPresensi — Rekap & Laporan",
    Pengaturan: "GeoPresensi — Pengaturan",
    Log       : "GeoPresensi — Log Aktivitas"
  };

  if (!judulHalaman[page]) page = "Index";
  var judul = judulHalaman[page];

  try {
    return HtmlService.createHtmlOutputFromFile(page)
      .setTitle(judul)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
  } catch(err) {
    return HtmlService.createHtmlOutput(
      "<h2>Error: " + err.message + "</h2>"
    );
  }
}

// ============================================================
// getWebAppUrl(page) — Mengembalikan URL Web App dengan parameter page
// Dipanggil dari frontend untuk navigasi antar halaman.
// ============================================================
function getWebAppUrl(page) {
  var url = ScriptApp.getService().getUrl();
  return url + "?page=" + (page || "Index");
}

// ============================================================
// buatHalaman(page, judul) — Helper render HtmlTemplate
// ============================================================
function buatHalaman(page, judul) {
  try {
    return HtmlService.createHtmlOutputFromFile(page)
      .setTitle(judul)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
  } catch (err) {
    return HtmlService.createHtmlOutputFromFile("Login")
      .setTitle("GeoPresensi — Login")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
  }
}

// ============================================================
// loginUser(username, password, role) — Proses autentikasi
// Dipanggil dari Login.html via google.script.run.
// Mencari user di Sheet "Users", verifikasi password (hash SHA-256),
// buat token sesi unik, simpan ke PropertiesService.
// Mengembalikan { sukses, token, role, nama, pesan }
// ============================================================
function loginUser(username, password, role) {
  try {
    if (!username || !password) {
      return { sukses: false, pesan: "Username dan password wajib diisi." };
    }

    var ss    = getSheetsApp();
    var sheet = ss.getSheetByName(SHEET_USERS);
    if (!sheet) {
      // Jika sheet Users belum ada, jalankan setupUsers() otomatis
      setupUsers();
      sheet = ss.getSheetByName(SHEET_USERS);
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { sukses: false, pesan: "Belum ada data user. Jalankan setupUsers() terlebih dahulu." };
    }

    // Kolom: A=Username, B=PasswordHash, C=Role, D=Nama, E=Aktif
    var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    var userDitemukan = null;

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      if (row[0].toString().toLowerCase() === username.toLowerCase()) {
        userDitemukan = {
          username: row[0].toString(),
          pwHash  : row[1].toString(),
          role    : row[2].toString().toLowerCase(),
          nama    : row[3].toString(),
          aktif   : row[4].toString().toLowerCase() === "true" || row[4] === true || row[4] === 1
        };
        break;
      }
    }

    if (!userDitemukan) {
      return { sukses: false, pesan: "Username tidak ditemukan." };
    }

    if (!userDitemukan.aktif) {
      return { sukses: false, pesan: "Akun ini tidak aktif. Hubungi admin." };
    }

    // Verifikasi role yang dipilih cocok dengan role di database
    if (userDitemukan.role !== role.toLowerCase()) {
      return { sukses: false, pesan: "Role tidak sesuai. Pilih role yang benar." };
    }

    // Verifikasi password dengan SHA-256
    var hashInput = hashPassword(password);
    if (hashInput !== userDitemukan.pwHash) {
      return { sukses: false, pesan: "Password salah." };
    }

    // Buat token sesi unik
    var token   = buatToken();
    var expired = new Date().getTime() + DURASI_SESI_MS;

    // Simpan token ke PropertiesService (per-script, bukan per-user)
    // Key: "sesi_[token]", Value: JSON { username, role, nama, expired }
    var props = PropertiesService.getScriptProperties();
    props.setProperty("sesi_" + token, JSON.stringify({
      username: userDitemukan.username,
      role    : userDitemukan.role,
      nama    : userDitemukan.nama,
      expired : expired
    }));

    // Catat log login (opsional, untuk audit)
    Logger.log("[LOGIN] " + userDitemukan.username + " (" + userDitemukan.role + ") — " + new Date().toISOString());

    return {
      sukses: true,
      token : token,
      role  : userDitemukan.role,
      nama  : userDitemukan.nama,
      pesan : "Login berhasil."
    };

  } catch (err) {
    Logger.log("Error loginUser: " + err.message);
    return { sukses: false, pesan: "Error server: " + err.message };
  }
}

// ============================================================
// cekSesi(token) — Validasi token sesi yang tersimpan
// Dipanggil dari frontend saat halaman dimuat.
// Mengembalikan objek sesi { valid, role, nama } atau { valid: false }
// ============================================================
function cekSesi(token) {
  try {
    if (!token) return { valid: false };

    var props = PropertiesService.getScriptProperties();
    var raw   = props.getProperty("sesi_" + token);
    if (!raw)  return { valid: false };

    var sesi  = JSON.parse(raw);

    // Cek expired
    if (new Date().getTime() > sesi.expired) {
      props.deleteProperty("sesi_" + token); // hapus sesi expired
      return { valid: false, pesan: "Sesi telah berakhir. Silakan login ulang." };
    }

    // Perpanjang sesi (sliding expiry) setiap validasi berhasil
    sesi.expired = new Date().getTime() + DURASI_SESI_MS;
    props.setProperty("sesi_" + token, JSON.stringify(sesi));

    return {
      valid   : true,
      role    : sesi.role,
      nama    : sesi.nama,
      username: sesi.username
    };

  } catch (err) {
    return { valid: false };
  }
}

// ============================================================
// logoutUser(token) — Menghapus token sesi
// Dipanggil dari frontend saat user klik tombol Logout.
// ============================================================
function logoutUser(token) {
  try {
    if (!token) return { sukses: true };
    var props = PropertiesService.getScriptProperties();
    props.deleteProperty("sesi_" + token);
    return { sukses: true };
  } catch (err) {
    return { sukses: false };
  }
}

// ============================================================
// gantiPassword(token, passwordLama, passwordBaru) — Ganti password
// User yang sudah login bisa ganti password sendiri.
// ============================================================
function gantiPassword(token, passwordLama, passwordBaru) {
  try {
    var sesiInfo = cekSesi(token);
    if (!sesiInfo.valid) return { sukses: false, pesan: "Sesi tidak valid. Login ulang." };

    if (!passwordBaru || passwordBaru.length < 6) {
      return { sukses: false, pesan: "Password baru minimal 6 karakter." };
    }

    var ss    = getSheetsApp();
    var sheet = ss.getSheetByName(SHEET_USERS);
    if (!sheet) return { sukses: false, pesan: "Sheet Users tidak ditemukan." };

    var lastRow = sheet.getLastRow();
    var data    = sheet.getRange(2, 1, lastRow - 1, 2).getValues();

    for (var i = 0; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === sesiInfo.username.toLowerCase()) {
        // Verifikasi password lama
        if (hashPassword(passwordLama) !== data[i][1].toString()) {
          return { sukses: false, pesan: "Password lama tidak cocok." };
        }
        // Update password baru
        sheet.getRange(i + 2, 2).setValue(hashPassword(passwordBaru));
        return { sukses: true, pesan: "Password berhasil diubah." };
      }
    }

    return { sukses: false, pesan: "User tidak ditemukan." };
  } catch (err) {
    return { sukses: false, pesan: "Error: " + err.message };
  }
}

// ============================================================
// hashPassword(password) — Hash SHA-256 sederhana via Utilities
// Google Apps Script menyediakan Utilities.computeDigest()
// untuk hashing. Hasilnya di-encode ke hex string.
// ============================================================
function hashPassword(password) {
  var raw  = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  // Konversi byte array ke hex string
  return raw.map(function(b) {
    var hex = (b & 0xFF).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

// ============================================================
// buatToken() — Generate token unik untuk sesi
// Menggabungkan timestamp + random string + UUID-like format
// ============================================================
function buatToken() {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var token = "";
  for (var i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token + "_" + new Date().getTime();
}

// ============================================================
// bersihkanSesiExpired() — Hapus semua token yang sudah expired
// Jalankan manual atau via trigger time-based (misal tiap malam)
// untuk menjaga PropertiesService tidak penuh.
// ============================================================
function bersihkanSesiExpired() {
  var props = PropertiesService.getScriptProperties();
  var all   = props.getProperties();
  var now   = new Date().getTime();
  var count = 0;

  Object.keys(all).forEach(function(key) {
    if (key.startsWith("sesi_")) {
      try {
        var sesi = JSON.parse(all[key]);
        if (now > sesi.expired) {
          props.deleteProperty(key);
          count++;
        }
      } catch (e) {
        props.deleteProperty(key); // hapus data rusak
      }
    }
  });

  Logger.log("Sesi expired dihapus: " + count);
}

// ============================================================
// setupUsers() — Inisialisasi Sheet "Users" dengan akun default
// Jalankan SATU KALI, atau otomatis dipanggil saat loginUser()
// tidak menemukan sheet Users.
// Password default:
//   admin    → admin123
//   hrd      → hrd12345
//   K001–K003 → presensi123
// ============================================================
function setupUsers() {
  var ss    = getSheetsApp();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) sheet = ss.insertSheet(SHEET_USERS);
  sheet.clearContents();

  // Header
  sheet.appendRow(["Username", "Password (SHA-256)", "Role", "Nama Lengkap", "Aktif"]);
  sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#1E1B4B").setFontColor("white");

  // Data akun default
  var akuns = [
    ["admin",  hashPassword("admin123"),    "admin",    "Administrator",   true],
    ["hrd",    hashPassword("hrd12345"),    "admin",    "Staff HRD",       true],
    ["K001",   hashPassword("presensi123"), "karyawan", "Budi Santoso",    true],
    ["K002",   hashPassword("presensi123"), "karyawan", "Siti Rahayu",     true],
    ["K003",   hashPassword("presensi123"), "karyawan", "Ahmad Fauzi",     true]
  ];

  akuns.forEach(function(row) { sheet.appendRow(row); });

  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidth(2, 280); // kolom hash lebar
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 80);

  Logger.log("Sheet Users berhasil dibuat dengan " + akuns.length + " akun default.");
}

// ============================================================
// include(filename) — Helper untuk include file HTML partial
// Digunakan di template HTML agar bisa include CSS/JS terpisah.
// ============================================================
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================
// getSheetsApp() — Helper mendapatkan Spreadsheet aktif
// Mengembalikan objek SpreadsheetApp.getActiveSpreadsheet()
// ============================================================
function getSheetsApp() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ============================================================
// getOrCreateFolder() — Mendapatkan atau membuat folder Drive
// Folder digunakan untuk menyimpan foto selfie karyawan.
// Jika folder belum ada, otomatis dibuat.
// ============================================================
function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(FOLDER_NAME);
}

// ============================================================
// getPengaturan() — Mengambil konfigurasi dari Sheet "Pengaturan"
// Mengembalikan objek dengan semua nilai konfigurasi sistem.
// Dapat dipanggil dari frontend via google.script.run
// ============================================================
function getPengaturan() {
  var ss    = getSheetsApp();
  var sheet = ss.getSheetByName(SHEET_PENGATURAN);
  if (!sheet) throw new Error("Sheet 'Pengaturan' tidak ditemukan.");

  // Kolom A = key, Kolom B = value (mulai baris 2, baris 1 adalah header)
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var config = {};
  data.forEach(function(row) {
    if (row[0]) config[row[0]] = row[1];
  });
  return config;
}

// ============================================================
// getKaryawanList() — Mengambil daftar karyawan dari Sheet
// Dipanggil oleh frontend via google.script.run untuk
// mengisi dropdown pemilihan karyawan pada form absen.
// ============================================================
function getKaryawanList() {
  var ss    = getSheetsApp();
  var sheet = ss.getSheetByName(SHEET_KARYAWAN);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // Ambil kolom: ID, Nama, Jabatan, Email, Jam Masuk, Jam Pulang
  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  return data
    .filter(function(row) { return row[0] && row[1]; }) // filter baris kosong
    .map(function(row) {
      return {
        id       : row[0].toString(),
        nama     : row[1].toString(),
        jabatan  : row[2].toString(),
        email    : row[3].toString(),
        jamMasuk : row[4].toString(),
        jamPulang: row[5].toString()
      };
    });
}

// ============================================================
// getDashboardStats() — Mengambil statistik untuk dashboard
// Mengembalikan data ringkasan absensi hari ini untuk
// ditampilkan pada kartu statistik di halaman utama.
// ============================================================
function getDashboardStats() {
  var ss           = getSheetsApp();
  var sheetAbsensi = ss.getSheetByName(SHEET_ABSENSI);
  var sheetKaryawan= ss.getSheetByName(SHEET_KARYAWAN);

  var today        = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var stats = {
    absenMasuk   : 0,
    absenPulang  : 0,
    telat        : 0,
    alpha        : 0,
    totalKaryawan: 0,
    logTerbaru   : []
  };

  // Hitung total karyawan aktif
  if (sheetKaryawan && sheetKaryawan.getLastRow() > 1) {
    stats.totalKaryawan = sheetKaryawan.getLastRow() - 1;
  }

  if (!sheetAbsensi || sheetAbsensi.getLastRow() < 2) return stats;

  var lastRow = sheetAbsensi.getLastRow();
  // Ambil semua kolom data absensi (10 kolom)
  var data    = sheetAbsensi.getRange(2, 1, lastRow - 1, 10).getValues();

  // Set untuk tracking ID unik hari ini
  var masukIds  = {};
  var pulangIds = {};
  var telatIds  = {};
  var alphaIds  = {};

  data.forEach(function(row) {
    // row[0] = Timestamp, row[1] = ID Karyawan, row[2] = Nama,
    // row[3] = Jenis Absen, row[9] = Status Kehadiran
    if (!row[0]) return;
    var tgl = Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "yyyy-MM-dd");
    if (tgl !== today) return;

    var id     = row[1].toString();
    var jenis  = row[3].toString();
    var status = row[9].toString();

    if (jenis === "Masuk")  masukIds[id]  = true;
    if (jenis === "Pulang") pulangIds[id] = true;
    if (status === "Telat") telatIds[id]  = true;
    if (status === "Alpha") alphaIds[id]  = true;
  });

  stats.absenMasuk  = Object.keys(masukIds).length;
  stats.absenPulang = Object.keys(pulangIds).length;
  stats.telat       = Object.keys(telatIds).length;
  stats.alpha       = Object.keys(alphaIds).length;

  // Ambil 5 log terbaru hari ini
  var logsHariIni = data.filter(function(row) {
    if (!row[0]) return false;
    var tgl = Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "yyyy-MM-dd");
    return tgl === today;
  }).reverse().slice(0, 5);

  stats.logTerbaru = logsHariIni.map(function(row) {
    return {
      waktu      : row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "HH:mm") : "-",
      nama       : row[2].toString(),
      jenis      : row[3].toString(),
      statusLokasi: row[8].toString(),
      statusHadir: row[9].toString()
    };
  });

  return stats;
}

// ============================================================
// cekAbsenHariIni(idKaryawan, jenisAbsen) — Validasi duplikasi
// Mengecek apakah karyawan sudah absen (jenis yang sama)
// di hari yang sama untuk mencegah double absen.
// Mengembalikan true jika sudah absen, false jika belum.
// ============================================================
function cekAbsenHariIni(idKaryawan, jenisAbsen) {
  var ss    = getSheetsApp();
  var sheet = ss.getSheetByName(SHEET_ABSENSI);
  if (!sheet || sheet.getLastRow() < 2) return false;

  var today   = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var lastRow = sheet.getLastRow();
  var data    = sheet.getRange(2, 1, lastRow - 1, 4).getValues();

  return data.some(function(row) {
    if (!row[0]) return false;
    var tgl   = Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "yyyy-MM-dd");
    var id    = row[1].toString();
    var jenis = row[3].toString();
    return tgl === today && id === idKaryawan.toString() && jenis === jenisAbsen;
  });
}

// ============================================================
// getStatusAbsenKaryawan(idKaryawan) — Cek status absen hari ini
// Dipanggil dari frontend saat karyawan dipilih di dropdown.
// Mengembalikan objek { sudahMasuk, sudahPulang, jamMasuk, jamPulang }
// ============================================================
function getStatusAbsenKaryawan(idKaryawan) {
  var ss    = getSheetsApp();
  var sheet = ss.getSheetByName(SHEET_ABSENSI);

  var result = { sudahMasuk: false, sudahPulang: false, jamMasuk: null, jamPulang: null };
  if (!sheet || sheet.getLastRow() < 2 || !idKaryawan) return result;

  var today   = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var lastRow = sheet.getLastRow();
  var data    = sheet.getRange(2, 1, lastRow - 1, 4).getValues();

  data.forEach(function(row) {
    if (!row[0]) return;
    var tgl   = Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "yyyy-MM-dd");
    var id    = row[1].toString();
    var jenis = row[3].toString();
    if (tgl !== today || id !== idKaryawan.toString()) return;

    var jam = Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "HH:mm");
    if (jenis === "Masuk")  { result.sudahMasuk  = true; result.jamMasuk  = jam; }
    if (jenis === "Pulang") { result.sudahPulang = true; result.jamPulang = jam; }
  });

  return result;
}

// ============================================================
// hitungJarakHaversine(lat1, lon1, lat2, lon2) — Rumus Haversine
// Menghitung jarak (dalam meter) antara dua titik koordinat GPS
// menggunakan rumus Haversine.
// lat1/lon1: koordinat karyawan, lat2/lon2: koordinat kantor
// ============================================================
function hitungJarakHaversine(lat1, lon1, lat2, lon2) {
  var R    = 6371000; // radius bumi dalam meter
  var phi1 = lat1 * Math.PI / 180;
  var phi2 = lat2 * Math.PI / 180;
  var dPhi = (lat2 - lat1) * Math.PI / 180;
  var dLam = (lon2 - lon1) * Math.PI / 180;

  var a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) *
          Math.sin(dLam / 2) * Math.sin(dLam / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // jarak dalam meter
}

// ============================================================
// simpanFotoDrive(base64Data, namaFile) — Upload foto ke Drive
// Mengkonversi data base64 (dari kamera browser) menjadi file,
// lalu menyimpannya ke folder GeoPresensi di Google Drive.
// Mengembalikan URL publik untuk diakses siapa saja.
// ============================================================
function simpanFotoDrive(base64Data, namaFile) {
  try {
    // Hapus prefix data URI jika ada (contoh: "data:image/jpeg;base64,")
    var cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

    // Decode base64 menjadi blob
    var blob = Utilities.newBlob(
      Utilities.base64Decode(cleanBase64),
      "image/jpeg",
      namaFile
    );

    var folder = getOrCreateFolder();
    var file   = folder.createFile(blob);

    // Set permission agar link bisa diakses siapa saja (untuk preview)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return file.getUrl();
  } catch (err) {
    Logger.log("Error simpanFotoDrive: " + err.message);
    throw new Error("Gagal menyimpan foto: " + err.message);
  }
}

// ============================================================
// tentukanStatusKehadiran(jamAbsen, jamStandar, toleransiMenit, jenisAbsen)
// Menentukan status kehadiran karyawan berdasarkan jam absen.
// Untuk absen masuk: "Hadir" atau "Telat"
// Untuk absen pulang: selalu "Hadir" (sudah bekerja)
// ============================================================
function tentukanStatusKehadiran(jamAbsen, jamStandar, toleransiMenit, jenisAbsen) {
  if (jenisAbsen === "Pulang") return "Hadir";

  // Parse jam standar (format "HH:mm")
  var bagian     = jamStandar.toString().split(":");
  var jamStd     = parseInt(bagian[0], 10);
  var menitStd   = parseInt(bagian[1], 10);
  var totalMenitStd = jamStd * 60 + menitStd + parseInt(toleransiMenit, 10);

  // Ambil jam sekarang
  var now        = jamAbsen;
  var totalMenitSekarang = now.getHours() * 60 + now.getMinutes();

  return totalMenitSekarang <= totalMenitStd ? "Hadir" : "Telat";
}

// ============================================================
// submitAbsen(data) — Fungsi utama proses absensi
// Dipanggil dari frontend via google.script.run.withSuccessHandler()
// Parameter 'data' adalah objek dengan properti:
//   - idKaryawan, namaKaryawan, jenisAbsen (Masuk/Pulang)
//   - fotoBase64 (string base64 dari kamera)
//   - latitude, longitude (angka dari GPS browser)
// ============================================================
function submitAbsen(data) {
  try {
    var ss           = getSheetsApp();
    var sheetAbsensi = ss.getSheetByName(SHEET_ABSENSI);
    if (!sheetAbsensi) throw new Error("Sheet 'Absensi' tidak ditemukan.");

    var jenisAbsen = data.jenisAbsen; // Masuk / Pulang / Izin / Sakit

    // 1. Validasi duplikasi — Izin & Sakit hanya bisa sekali per hari
    if (cekAbsenHariIni(data.idKaryawan, jenisAbsen)) {
      return {
        sukses : false,
        pesan  : "Kamu sudah mengajukan " + jenisAbsen + " hari ini."
      };
    }

    var timestamp = new Date();

    // 2. Proses khusus Izin & Sakit — tidak perlu GPS dan foto wajib
    if (jenisAbsen === "Izin" || jenisAbsen === "Sakit") {
      var linkBukti = "-";

      // Upload bukti jika ada (opsional)
      if (data.fotoBase64 && data.fotoBase64.length > 100) {
        try {
          var namaFileBukti = jenisAbsen.toLowerCase() + "_" + data.idKaryawan + "_" +
            Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "yyyyMMdd_HHmmss") + ".jpg";
          linkBukti = simpanFotoDrive(data.fotoBase64, namaFileBukti);
        } catch(e) {
          linkBukti = "-"; // Gagal upload tidak blocking
        }
      }

      // Simpan ke sheet — lokasi & jarak tidak relevan untuk Izin/Sakit
      sheetAbsensi.appendRow([
        timestamp,
        data.idKaryawan,
        data.namaKaryawan,
        jenisAbsen,
        linkBukti,
        data.latitude  || 0,
        data.longitude || 0,
        0,
        "Tidak Hadir",
        jenisAbsen  // Status kehadiran = Izin atau Sakit
      ]);

      // Kirim notifikasi ke HRD
      var config   = getPengaturan();
      var emailHRD = config["Email Penerima Notifikasi"] || "";
      if (emailHRD) {
        var alasan = data.alasan || "Tidak ada keterangan";
        try {
          MailApp.sendEmail(emailHRD,
            "[GeoPresensi] " + jenisAbsen + " - " + data.namaKaryawan,
            "Karyawan " + data.namaKaryawan + " mengajukan " + jenisAbsen + ".\n" +
            "Tanggal : " + Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "dd/MM/yyyy") + "\n" +
            "Alasan  : " + alasan + "\n" +
            (linkBukti !== "-" ? "Bukti   : " + linkBukti : "Bukti   : Tidak dilampirkan")
          );
        } catch(e) {}
      }

      return {
        sukses          : true,
        pesan           : jenisAbsen + " berhasil diajukan!",
        statusLokasi    : "Tidak Hadir",
        statusKehadiran : jenisAbsen,
        jarak           : 0,
        linkFoto        : linkBukti
      };
    }

    // 3. Proses normal Masuk / Pulang
    var config  = getPengaturan();
    var latKantor   = parseFloat(config["Latitude Kantor"]) || 0;
    var lonKantor   = parseFloat(config["Longitude Kantor"]) || 0;
    var radiusToleransi = parseFloat(config["Radius Toleransi (meter)"]) || 100;
    var jamMasukDefault  = config["Jam Masuk Default"] || "08:00";
    var toleransiMenit   = parseInt(config["Toleransi Keterlambatan (menit)"]) || 15;
    var emailHRD         = config["Email Penerima Notifikasi"] || "";

    var jarak = hitungJarakHaversine(
      parseFloat(data.latitude),
      parseFloat(data.longitude),
      latKantor,
      lonKantor
    );
    var statusLokasi = jarak <= radiusToleransi ? "Dalam Radius" : "Luar Radius";

    var namaFile = "absen_" + data.idKaryawan + "_" +
                   Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "yyyyMMdd_HHmmss") + ".jpg";
    var linkFoto = simpanFotoDrive(data.fotoBase64, namaFile);

    var statusKehadiran = tentukanStatusKehadiran(
      timestamp, jamMasukDefault, toleransiMenit, jenisAbsen
    );

    sheetAbsensi.appendRow([
      timestamp,
      data.idKaryawan,
      data.namaKaryawan,
      jenisAbsen,
      linkFoto,
      parseFloat(data.latitude),
      parseFloat(data.longitude),
      Math.round(jarak),
      statusLokasi,
      statusKehadiran
    ]);

    if (emailHRD && (statusLokasi === "Luar Radius" || statusKehadiran === "Telat")) {
      kirimNotifikasiEmail(emailHRD, data, timestamp, jarak, statusLokasi, statusKehadiran);
    }

    return {
      sukses          : true,
      pesan           : "Absen " + jenisAbsen + " berhasil dicatat!",
      statusLokasi    : statusLokasi,
      statusKehadiran : statusKehadiran,
      jarak           : Math.round(jarak),
      linkFoto        : linkFoto
    };

  } catch (err) {
    Logger.log("Error submitAbsen: " + err.message);
    return { sukses: false, pesan: "Error: " + err.message };
  }
}

// ============================================================
// kirimNotifikasiEmail(...) — Kirim email peringatan ke HRD
// Dikirim otomatis jika karyawan: (1) di luar radius kantor,
// atau (2) terlambat masuk. Menggunakan MailApp bawaan GAS.
// ============================================================
function kirimNotifikasiEmail(emailHRD, data, timestamp, jarak, statusLokasi, statusKehadiran) {
  try {
    var waktu = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    var alerts = [];
    if (statusLokasi   === "Luar Radius") alerts.push("📍 Di luar radius kantor (" + Math.round(jarak) + " meter)");
    if (statusKehadiran === "Telat")      alerts.push("⏰ Terlambat masuk");

    var subject = "[GeoPresensi] Peringatan Absen - " + data.namaKaryawan + " (" + data.jenisAbsen + ")";
    var body =
      "Halo, ada notifikasi absensi dari GeoPresensi:\n\n" +
      "Karyawan  : " + data.namaKaryawan + "\n" +
      "ID        : " + data.idKaryawan + "\n" +
      "Jenis     : Absen " + data.jenisAbsen + "\n" +
      "Waktu     : " + waktu + "\n" +
      "Peringatan: " + alerts.join(", ") + "\n\n" +
      "Detail Lokasi:\n" +
      "  Latitude : " + data.latitude + "\n" +
      "  Longitude: " + data.longitude + "\n" +
      "  Jarak dari kantor: " + Math.round(jarak) + " meter\n\n" +
      "Cek foto: " + (data.linkFoto || "-") + "\n\n" +
      "— GeoPresensi System";

    MailApp.sendEmail(emailHRD, subject, body);
  } catch (err) {
    Logger.log("Gagal kirim email: " + err.message);
    // Tidak throw agar proses absen tetap lanjut
  }
}

// ============================================================
// getAllAbsensi() — Mengambil semua data absensi
// Digunakan oleh halaman Rekap untuk menampilkan tabel log.
// ============================================================
function getAllAbsensi() {
  var ss    = getSheetsApp();
  var sheet = ss.getSheetByName(SHEET_ABSENSI);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var lastRow = sheet.getLastRow();
  var data    = sheet.getRange(2, 1, lastRow - 1, 10).getValues();

  return data
    .filter(function(row) { return row[0]; })
    .map(function(row) {
      return {
        timestamp     : row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm") : "-",
        idKaryawan    : row[1].toString(),
        namaKaryawan  : row[2].toString(),
        jenisAbsen    : row[3].toString(),
        linkFoto      : row[4].toString(),
        latitude      : row[5],
        longitude     : row[6],
        jarak         : row[7],
        statusLokasi  : row[8].toString(),
        statusKehadiran: row[9].toString()
      };
    })
    .reverse(); // terbaru di atas
}

// ============================================================
// generateRekapBulanan(bulan, tahun) — Rekap kehadiran bulanan
// Menghitung total Hadir, Telat, Alpha per karyawan untuk
// bulan dan tahun yang dipilih, lalu menulis ke Sheet "Rekap".
// bulan: angka 1-12, tahun: angka 4 digit (contoh: 2025)
// ============================================================
function generateRekapBulanan(bulan, tahun) {
  try {
    var ss           = getSheetsApp();
    var sheetAbsensi = ss.getSheetByName(SHEET_ABSENSI);
    var sheetRekap   = ss.getSheetByName(SHEET_REKAP);

    // Buat sheet Rekap jika belum ada
    if (!sheetRekap) {
      sheetRekap = ss.insertSheet(SHEET_REKAP);
    } else {
      sheetRekap.clearContents();
    }

    if (!sheetAbsensi || sheetAbsensi.getLastRow() < 2) {
      return { sukses: false, pesan: "Tidak ada data absensi." };
    }

    // Header rekap
    var namaBulan = ["", "Januari","Februari","Maret","April","Mei","Juni",
                     "Juli","Agustus","September","Oktober","November","Desember"];
    sheetRekap.appendRow([
      "REKAP KEHADIRAN — " + namaBulan[parseInt(bulan)] + " " + tahun
    ]);
    sheetRekap.appendRow([" "]); // baris kosong
    sheetRekap.appendRow([
      "ID Karyawan","Nama Karyawan","Total Hadir","Total Telat","Total Alpha",
      "Total Izin","Total Sakit","Total Hari Kerja","Persentase Kehadiran"
    ]);

    // Format bold untuk header
    sheetRekap.getRange(3, 1, 1, 9).setFontWeight("bold");

    var lastRow = sheetAbsensi.getLastRow();
    var data    = sheetAbsensi.getRange(2, 1, lastRow - 1, 10).getValues();

    // Filter data sesuai bulan & tahun
    // Masuk → untuk Hadir/Telat/Alpha
    // Izin/Sakit → berdasarkan kolom Jenis Absen
    var rekap = {};
    data.forEach(function(row) {
      if (!row[0]) return;
      var tgl = new Date(row[0]);
      if (tgl.getMonth() + 1 !== parseInt(bulan) || tgl.getFullYear() !== parseInt(tahun)) return;

      var id    = row[1].toString();
      var nama  = row[2].toString();
      var jenis = row[3].toString();
      var status= row[9].toString();

      if (!rekap[id]) rekap[id] = { id: id, nama: nama, hadir: 0, telat: 0, alpha: 0, izin: 0, sakit: 0 };

      if (jenis === "Masuk") {
        if (status === "Hadir")      rekap[id].hadir++;
        else if (status === "Telat") rekap[id].telat++;
        else if (status === "Alpha") rekap[id].alpha++;
      } else if (jenis === "Izin")  { rekap[id].izin++;  }
        else if (jenis === "Sakit") { rekap[id].sakit++; }
    });

    // Tulis rekap ke sheet
    Object.values(rekap).forEach(function(r) {
      var totalHariKerja = r.hadir + r.telat + r.alpha + r.izin + r.sakit;
      var persen = totalHariKerja > 0
        ? ((r.hadir / totalHariKerja) * 100).toFixed(1) + "%"
        : "0%";
      sheetRekap.appendRow([r.id, r.nama, r.hadir, r.telat, r.alpha, r.izin, r.sakit, totalHariKerja, persen]);
    });

    // Format kolom agar rapi
    sheetRekap.setColumnWidth(1, 120);
    sheetRekap.setColumnWidth(2, 200);

    return {
      sukses: true,
      pesan : "Rekap bulan " + namaBulan[parseInt(bulan)] + " " + tahun +
              " berhasil dibuat di Sheet 'Rekap'. Total karyawan: " + Object.keys(rekap).length
    };

  } catch (err) {
    Logger.log("Error generateRekapBulanan: " + err.message);
    return { sukses: false, pesan: "Error: " + err.message };
  }
}

// ============================================================
// kirimSlipPDF(idKaryawan, bulan, tahun) — Kirim slip PDF
// Membuat dokumen Google Docs berisi laporan kehadiran karyawan,
// mengekspornya sebagai PDF, lalu mengirim ke email karyawan.
// ============================================================
function kirimSlipPDF(idKaryawan, bulan, tahun) {
  try {
    var ss           = getSheetsApp();
    var sheetAbsensi = ss.getSheetByName(SHEET_ABSENSI);
    var sheetKaryawan= ss.getSheetByName(SHEET_KARYAWAN);

    if (!sheetAbsensi || !sheetKaryawan) {
      return { sukses: false, pesan: "Sheet tidak ditemukan." };
    }

    // Cari data karyawan
    var lastRowK = sheetKaryawan.getLastRow();
    var dataK    = sheetKaryawan.getRange(2, 1, lastRowK - 1, 6).getValues();
    var karyawan = null;
    dataK.forEach(function(row) {
      if (row[0].toString() === idKaryawan.toString()) {
        karyawan = { id: row[0], nama: row[1], jabatan: row[2], email: row[3] };
      }
    });

    if (!karyawan) return { sukses: false, pesan: "Karyawan tidak ditemukan." };
    if (!karyawan.email) return { sukses: false, pesan: "Email karyawan tidak tersedia." };

    // Ambil data absensi bulan tersebut
    var lastRowA = sheetAbsensi.getLastRow();
    var dataA    = sheetAbsensi.getRange(2, 1, lastRowA - 1, 10).getValues();
    var namaBulan= ["","Januari","Februari","Maret","April","Mei","Juni",
                    "Juli","Agustus","September","Oktober","November","Desember"];
    var absensiKaryawan = dataA.filter(function(row) {
      if (!row[0] || row[1].toString() !== idKaryawan.toString()) return false;
      var tgl = new Date(row[0]);
      return tgl.getMonth() + 1 === parseInt(bulan) && tgl.getFullYear() === parseInt(tahun);
    });

    // Hitung ringkasan
    var totalHadir = 0, totalTelat = 0, totalAlpha = 0;
    absensiKaryawan.forEach(function(row) {
      if (row[3].toString() !== "Masuk") return;
      if (row[9].toString() === "Hadir") totalHadir++;
      else if (row[9].toString() === "Telat") totalTelat++;
      else if (row[9].toString() === "Alpha") totalAlpha++;
    });

    // Buat dokumen Google Docs sebagai laporan
    var doc    = DocumentApp.create("Slip Kehadiran - " + karyawan.nama + " - " + namaBulan[parseInt(bulan)] + " " + tahun);
    var body   = doc.getBody();

    body.appendParagraph("LAPORAN KEHADIRAN KARYAWAN")
        .setHeading(DocumentApp.ParagraphHeading.HEADING1)
        .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph("GeoPresensi System")
        .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph("Periode: " + namaBulan[parseInt(bulan)] + " " + tahun)
        .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph(""); // spasi

    body.appendParagraph("Data Karyawan:");
    body.appendParagraph("  Nama    : " + karyawan.nama);
    body.appendParagraph("  ID      : " + karyawan.id);
    body.appendParagraph("  Jabatan : " + karyawan.jabatan);
    body.appendParagraph("");

    body.appendParagraph("Ringkasan Kehadiran:");
    body.appendParagraph("  Total Hadir : " + totalHadir + " hari");
    body.appendParagraph("  Total Telat : " + totalTelat + " hari");
    body.appendParagraph("  Total Alpha : " + totalAlpha + " hari");
    body.appendParagraph("");

    // Detail log absensi
    body.appendParagraph("Detail Log Absensi:");
    absensiKaryawan.forEach(function(row) {
      var waktu = row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm") : "-";
      body.appendParagraph("  " + waktu + " | " + row[3] + " | " + row[9] + " | " + row[8]);
    });

    doc.saveAndClose();

    // Export sebagai PDF dan kirim email
    var docFile = DriveApp.getFileById(doc.getId());
    var pdfBlob = docFile.getAs("application/pdf");
    pdfBlob.setName("Slip_Kehadiran_" + karyawan.nama + "_" + namaBulan[parseInt(bulan)] + tahun + ".pdf");

    MailApp.sendEmail({
      to         : karyawan.email,
      subject    : "[GeoPresensi] Slip Kehadiran " + namaBulan[parseInt(bulan)] + " " + tahun,
      body       : "Halo " + karyawan.nama + ",\n\nTerlampir slip kehadiran Anda untuk bulan " +
                   namaBulan[parseInt(bulan)] + " " + tahun + ".\n\n— GeoPresensi System",
      attachments: [pdfBlob]
    });

    // Hapus dokumen sementara dari Drive
    docFile.setTrashed(true);

    return {
      sukses: true,
      pesan : "Slip kehadiran berhasil dikirim ke " + karyawan.email
    };

  } catch (err) {
    Logger.log("Error kirimSlipPDF: " + err.message);
    return { sukses: false, pesan: "Error: " + err.message };
  }
}

// ============================================================
// tambahKaryawan(data) — Menambahkan karyawan baru ke sheet
// Dipanggil dari halaman Master Karyawan.
// ============================================================
function tambahKaryawan(data) {
  try {
    var ss    = getSheetsApp();
    var sheet = ss.getSheetByName(SHEET_KARYAWAN);
    if (!sheet) throw new Error("Sheet 'Karyawan' tidak ditemukan.");

    // Cek duplikasi ID
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      if (ids.map(String).includes(data.id.toString())) {
        return { sukses: false, pesan: "ID Karyawan sudah digunakan." };
      }
    }

    sheet.appendRow([
      data.id, data.nama, data.jabatan, data.email, data.jamMasuk, data.jamPulang
    ]);

    return { sukses: true, pesan: "Karyawan " + data.nama + " berhasil ditambahkan." };
  } catch (err) {
    return { sukses: false, pesan: "Error: " + err.message };
  }
}

// ============================================================
// hapusKaryawan(idKaryawan) — Menghapus karyawan berdasarkan ID
// ============================================================
function hapusKaryawan(idKaryawan) {
  try {
    var ss    = getSheetsApp();
    var sheet = ss.getSheetByName(SHEET_KARYAWAN);
    if (!sheet || sheet.getLastRow() < 2) {
      return { sukses: false, pesan: "Data tidak ditemukan." };
    }

    var lastRow = sheet.getLastRow();
    var data    = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      if (data[i][0].toString() === idKaryawan.toString()) {
        sheet.deleteRow(i + 2); // +2 karena index 0 + header row 1
        return { sukses: true, pesan: "Karyawan berhasil dihapus." };
      }
    }

    return { sukses: false, pesan: "Karyawan dengan ID tersebut tidak ditemukan." };
  } catch (err) {
    return { sukses: false, pesan: "Error: " + err.message };
  }
}

// ============================================================
// simpanPengaturan(data) — Menyimpan konfigurasi ke Sheet
// Dipanggil dari halaman Pengaturan di dashboard.
// ============================================================
function simpanPengaturan(data) {
  try {
    var ss    = getSheetsApp();
    var sheet = ss.getSheetByName(SHEET_PENGATURAN);
    if (!sheet) throw new Error("Sheet 'Pengaturan' tidak ditemukan.");

    // Konversi koordinat — ganti koma desimal ke titik lalu parse ke float
    // Ini menangani locale Indonesia yang pakai koma sebagai desimal
    function parseKoordinat(val) {
      if (val === null || val === undefined || val === "") return 0;
      var str = val.toString().trim();
      // Jika format ribuan pakai titik dan desimal pakai koma: "110,7833248"
      // Ganti koma jadi titik
      str = str.replace(",", ".");
      return parseFloat(str) || 0;
    }

    var latKantor  = parseKoordinat(data.latKantor);
    var lonKantor  = parseKoordinat(data.lonKantor);
    var radius     = parseFloat(data.radius) || 100;
    var tolMenit   = parseInt(data.toleransiMenit) || 15;

    var keys = [
      "Latitude Kantor",
      "Longitude Kantor",
      "Radius Toleransi (meter)",
      "Jam Masuk Default",
      "Toleransi Keterlambatan (menit)",
      "Email Penerima Notifikasi",
      "Nomor WhatsApp Admin"
    ];
    var values = [
      latKantor, lonKantor, radius,
      data.jamMasuk, tolMenit, data.emailHRD, data.nomorWA || ""
    ];

    if (sheet.getLastRow() < 1) {
      sheet.appendRow(["Setting", "Nilai"]);
    }

    var maxRow = sheet.getMaxRows();
    if (maxRow > 1) {
      sheet.getRange(2, 1, maxRow - 1, 2).clearContent();
    }

    keys.forEach(function(key, i) {
      sheet.getRange(i + 2, 1).setValue(key);
      sheet.getRange(i + 2, 2).setValue(values[i]);
    });

    return { sukses: true, pesan: "Pengaturan berhasil disimpan. Lat: " + latKantor + ", Lon: " + lonKantor };
  } catch (err) {
    return { sukses: false, pesan: "Error: " + err.message };
  }
}

// ============================================================
// setupSheets() — Inisialisasi struktur Google Sheets
// Fungsi ini dijalankan SATU KALI saat pertama setup.
// Membuat semua sheet dengan header yang diperlukan.
// Jalankan manual dari Apps Script Editor: Run → setupSheets
// ============================================================
function setupSheets() {
  var ss = getSheetsApp();

  // ---- Sheet Karyawan ----
  var sheetK = ss.getSheetByName(SHEET_KARYAWAN);
  if (!sheetK) sheetK = ss.insertSheet(SHEET_KARYAWAN);
  sheetK.clearContents();
  sheetK.appendRow(["ID Karyawan","Nama Lengkap","Jabatan","Email","Jam Masuk Standar","Jam Pulang Standar"]);
  // Data contoh
  sheetK.appendRow(["K001","Budi Santoso","Kasir","budi@email.com","08:00","17:00"]);
  sheetK.appendRow(["K002","Siti Rahayu","Staf Gudang","siti@email.com","08:00","17:00"]);
  sheetK.appendRow(["K003","Ahmad Fauzi","Supervisor","ahmad@email.com","07:30","16:30"]);
  sheetK.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#1E1B4B").setFontColor("white");

  // ---- Sheet Absensi ----
  var sheetA = ss.getSheetByName(SHEET_ABSENSI);
  if (!sheetA) sheetA = ss.insertSheet(SHEET_ABSENSI);
  sheetA.clearContents();
  sheetA.appendRow([
    "Timestamp","ID Karyawan","Nama Karyawan","Jenis Absen",
    "Link Foto Selfie","Latitude","Longitude","Jarak dari Kantor (m)",
    "Status Lokasi","Status Kehadiran"
  ]);
  sheetA.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#1E1B4B").setFontColor("white");
  sheetA.setColumnWidth(1, 160);
  sheetA.setColumnWidth(5, 200);

  // ---- Sheet Pengaturan ----
  var sheetP = ss.getSheetByName(SHEET_PENGATURAN);
  if (!sheetP) sheetP = ss.insertSheet(SHEET_PENGATURAN);
  sheetP.clearContents();
  sheetP.appendRow(["Setting","Nilai"]);
  sheetP.appendRow(["Latitude Kantor", -6.200000]);
  sheetP.appendRow(["Longitude Kantor", 106.816666]);
  sheetP.appendRow(["Radius Toleransi (meter)", 100]);
  sheetP.appendRow(["Jam Masuk Default", "08:00"]);
  sheetP.appendRow(["Toleransi Keterlambatan (menit)", 15]);
  sheetP.appendRow(["Email Penerima Notifikasi", "hrd@perusahaan.com"]);
  sheetP.appendRow(["Nomor WhatsApp Admin", "628123456789"]);
  sheetP.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#1E1B4B").setFontColor("white");
  sheetP.setColumnWidth(1, 260);
  sheetP.setColumnWidth(2, 200);

  // ---- Sheet Rekap ----
  var sheetR = ss.getSheetByName(SHEET_REKAP);
  if (!sheetR) sheetR = ss.insertSheet(SHEET_REKAP);

  // ---- Sheet Users (akun login) ----
  setupUsers();

  Logger.log("✅ Setup selesai! Sheet yang dibuat: Karyawan, Absensi, Pengaturan, Rekap, Users.");
}

// ============================================================
// buatTriggerBulanan() — Membuat trigger otomatis rekap bulanan
// Jalankan SATU KALI dari editor untuk mendaftarkan trigger
// yang secara otomatis membuat rekap di akhir setiap bulan.
// ============================================================
function buatTriggerBulanan() {
  // Hapus trigger lama dengan nama yang sama agar tidak duplikat
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "jalankanRekapOtomatis") {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Buat trigger bulanan — berjalan setiap tanggal 1 pukul 07:00
  ScriptApp.newTrigger("jalankanRekapOtomatis")
    .timeBased()
    .onMonthDay(1)
    .atHour(7)
    .create();

  Logger.log("Trigger rekap bulanan berhasil dibuat.");
}

// ============================================================
// jalankanRekapOtomatis() — Dipanggil oleh trigger bulanan
// Menghitung rekap untuk bulan sebelumnya secara otomatis.
// ============================================================
function jalankanRekapOtomatis() {
  var sekarang = new Date();
  var bulanLalu = new Date(sekarang.getFullYear(), sekarang.getMonth() - 1, 1);
  var bulan = bulanLalu.getMonth() + 1;
  var tahun = bulanLalu.getFullYear();
  generateRekapBulanan(bulan, tahun);
  Logger.log("Rekap otomatis selesai untuk bulan " + bulan + "/" + tahun);
}

// ============================================================
// getNomorWAAdmin() — Ambil nomor WA admin dari Sheet Pengaturan
// Dipanggil dari frontend untuk membuat link wa.me
// ============================================================
function getNomorWAAdmin() {
  try {
    var config = getPengaturan();
    var nomor  = (config["Nomor WhatsApp Admin"] || "").toString().trim();
    // Bersihkan karakter non-angka kecuali tanda +
    nomor = nomor.replace(/[^0-9]/g, "");
    // Kalau diawali 0, ganti dengan 62 (Indonesia)
    if (nomor.startsWith("0")) nomor = "62" + nomor.substring(1);
    return nomor;
  } catch(e) {
    return "";
  }
}
// Dipanggil dari halaman Pengaturan via google.script.run
// role: "admin" atau "karyawan"
// ============================================================
function tambahUser(data) {
  try {
    var sheet = getSheetsApp().getSheetByName(SHEET_USERS);
    if (!sheet) return { sukses: false, pesan: "Sheet Users tidak ditemukan." };

    // Cek apakah username sudah ada
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var existing = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      if (existing.map(String).map(function(s){ return s.toLowerCase(); }).includes(data.username.toLowerCase())) {
        return { sukses: false, pesan: "Username '" + data.username + "' sudah digunakan." };
      }
    }

    sheet.appendRow([
      data.username,
      hashPassword(data.password),
      data.role || "karyawan",
      data.nama || data.username,
      true
    ]);

    return { sukses: true, pesan: "Akun '" + data.username + "' berhasil ditambahkan." };
  } catch(err) {
    return { sukses: false, pesan: "Error: " + err.message };
  }
}

// ============================================================
// hapusUser(username) — Hapus akun login
// ============================================================
function hapusUser(username) {
  try {
    var sheet = getSheetsApp().getSheetByName(SHEET_USERS);
    if (!sheet) return { sukses: false, pesan: "Sheet Users tidak ditemukan." };

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { sukses: false, pesan: "Tidak ada user." };

    var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      if (data[i][0].toString().toLowerCase() === username.toLowerCase()) {
        sheet.deleteRow(i + 2);
        return { sukses: true, pesan: "Akun '" + username + "' berhasil dihapus." };
      }
    }
    return { sukses: false, pesan: "Username tidak ditemukan." };
  } catch(err) {
    return { sukses: false, pesan: "Error: " + err.message };
  }
}

// ============================================================
// getDaftarUser() — Ambil semua akun dari Sheet Users
// ============================================================
function getDaftarUser() {
  try {
    var sheet = getSheetsApp().getSheetByName(SHEET_USERS);
    if (!sheet || sheet.getLastRow() < 2) return [];

    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
    return data
      .filter(function(r){ return r[0]; })
      .map(function(r){
        return {
          username : r[0].toString(),
          role     : r[2].toString(),
          nama     : r[3].toString(),
          aktif    : r[4] === true || r[4].toString() === "true" || r[4] === 1
        };
      });
  } catch(err) {
    return [];
  }
}

// ============================================================
// ubahPasswordUser(username, passwordBaru) — Ubah password user
// ============================================================
function ubahPasswordUser(username, passwordBaru) {
  try {
    if (!passwordBaru || passwordBaru.length < 4) {
      return { sukses: false, pesan: "Password minimal 4 karakter." };
    }
    var sheet = getSheetsApp().getSheetByName(SHEET_USERS);
    if (!sheet) return { sukses: false, pesan: "Sheet Users tidak ditemukan." };

    var lastRow = sheet.getLastRow();
    var data    = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === username.toLowerCase()) {
        sheet.getRange(i + 2, 2).setValue(hashPassword(passwordBaru));
        return { sukses: true, pesan: "Password berhasil diubah." };
      }
    }
    return { sukses: false, pesan: "Username tidak ditemukan." };
  } catch(err) {
    return { sukses: false, pesan: "Error: " + err.message };
  }
}

// ============================================================
// getExportInfo() — Ambil info untuk export rekap ke Excel
// Mengembalikan Spreadsheet ID dan Sheet ID sheet Rekap
// ============================================================
function getExportInfo() {
  try {
    var ss    = getSheetsApp();
    var sheet = ss.getSheetByName(SHEET_REKAP);
    if (!sheet) return { sukses: false, pesan: "Sheet Rekap belum dibuat. Generate rekap dulu." };

    return {
      sukses        : true,
      spreadsheetId : ss.getId(),
      sheetId       : sheet.getSheetId()
    };
  } catch(err) {
    return { sukses: false, pesan: err.message };
  }
}

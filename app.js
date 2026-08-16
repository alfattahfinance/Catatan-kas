// ======================================================
// CATATAN KAS - APP.JS
// DASHBOARD KEUANGAN
// FIREBASE FIRESTORE REAL-TIME
// ======================================================

import { db } from "./firebase-config.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================================
// VARIABEL
// ======================================================

let semuaPembayaran = [];
let semuaPengeluaran = [];
let semuaSantri = [];

let unsubscribePayments = null;
let unsubscribeExpenses = null;
let unsubscribeSantri = null;


// ======================================================
// HELPER
// ======================================================

const $ = (id) => document.getElementById(id);


// ======================================================
// LOGO DASHBOARD - SINKRON DENGAN PENGATURAN
// ======================================================

function muatLogoDashboard() {
    const logo = localStorage.getItem("logoDashboard");
    if (!logo) return;

    const kandidat = document.querySelectorAll(
        ".app-logo, #logoDashboard, #dashboardLogo, #logoPreviewV2, img[alt='Logo Dashboard']"
    );

    kandidat.forEach((element) => {
        if (element && element.tagName === "IMG") {
            element.src = logo;
        }
    });
}


// ======================================================
// RUPIAH
// ======================================================

function rupiah(nilai) {
    const angka = Number(nilai) || 0;
    return "Rp" + angka.toLocaleString("id-ID");
}


// ======================================================
// NOMINAL PEMBAYARAN
// ======================================================

function ambilNominal(item) {
    const nilai = item?.nominal ?? item?.jumlah ?? item?.nilai ?? 0;
    return Number(nilai) || 0;
}


// ======================================================
// NOMINAL PENGELUARAN
// ======================================================

function ambilNominalPengeluaran(item) {
    const nilai = item?.nominal ?? item?.jumlah ?? item?.nilai ?? item?.harga ?? item?.total ?? 0;
    return Number(nilai) || 0;
}


// ======================================================
// KATEGORI PEMBAYARAN
// ======================================================

function ambilKategoriPembayaran(item) {
    return String(item?.jenis ?? item?.kategori ?? "").trim();
}


// ======================================================
// KATEGORI PENGELUARAN
// ======================================================

function ambilKategoriPengeluaran(item) {
    return String(item?.jenis ?? item?.kategori ?? item?.keterangan ?? "").trim();
}


// ======================================================
// FILTER KATEGORI
// ======================================================

function cocokKategori(nilai, filter) {
    if (!filter || filter === "Semua") return true;
    return String(nilai).trim().toLowerCase() === String(filter).trim().toLowerCase();
}


// ======================================================
// HITUNG DASHBOARD
// ======================================================

function hitungDashboard() {
    const filterElement = $("filterKategori");
    const filter = filterElement ? filterElement.value : "Semua";

    const pembayaranTerfilter = semuaPembayaran.filter((item) =>
        cocokKategori(ambilKategoriPembayaran(item), filter)
    );

    let totalMasuk = 0;
    pembayaranTerfilter.forEach((item) => {
        totalMasuk += ambilNominal(item);
    });

    const pengeluaranTerfilter = semuaPengeluaran.filter((item) =>
        cocokKategori(ambilKategoriPengeluaran(item), filter)
    );

    let totalKeluar = 0;
    pengeluaranTerfilter.forEach((item) => {
        totalKeluar += ambilNominalPengeluaran(item);
    });

    return {
        totalMasuk,
        totalKeluar,
        saldo: totalMasuk - totalKeluar,
        totalSantri: semuaSantri.length,
        filter
    };
}


// ======================================================
// TAMPILKAN DASHBOARD
// ======================================================

function tampilkanDashboard() {
    const hasil = hitungDashboard();

    const totalMasuk = $("totalMasuk");
    if (totalMasuk) totalMasuk.textContent = rupiah(hasil.totalMasuk);

    const totalKeluar = $("totalKeluar");
    if (totalKeluar) totalKeluar.textContent = rupiah(hasil.totalKeluar);

    const totalSaldo = $("totalSaldo");
    if (totalSaldo) totalSaldo.textContent = rupiah(hasil.saldo);

    const totalSantri = $("totalSantri");
    if (totalSantri) totalSantri.textContent = hasil.totalSantri.toLocaleString("id-ID");

    const saldo = $("saldo") || $("saldoSaatIni");
    if (saldo) saldo.textContent = rupiah(hasil.saldo);

    const pemasukan = $("pemasukan") || $("jumlahPemasukan");
    if (pemasukan) pemasukan.textContent = rupiah(hasil.totalMasuk);

    const pengeluaran = $("pengeluaran") || $("jumlahPengeluaran");
    if (pengeluaran) pengeluaran.textContent = rupiah(hasil.totalKeluar);

    try {
        localStorage.setItem("catatanKasDashboard", JSON.stringify(hasil));
    } catch (error) {
        console.warn("Gagal menyimpan cache dashboard:", error);
    }

    window.catatanKasDashboard = hasil;
}


// ======================================================
// FIRESTORE - PEMBAYARAN
// ======================================================

function mulaiPembayaran() {
    if (unsubscribePayments) unsubscribePayments();

    unsubscribePayments = onSnapshot(
        collection(db, "payments"),
        function (snapshot) {
            semuaPembayaran = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
            tampilkanDashboard();
            window.dispatchEvent(new CustomEvent("dataKeuanganBerubah", { detail: { tipe: "pembayaran" } }));
        },
        function (error) {
            console.error("Gagal membaca payments:", error);
        }
    );
}


// ======================================================
// FIRESTORE - PENGELUARAN
// ======================================================

function mulaiPengeluaran() {
    if (unsubscribeExpenses) unsubscribeExpenses();

    unsubscribeExpenses = onSnapshot(
        collection(db, "expenses"),
        function (snapshot) {
            semuaPengeluaran = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
            tampilkanDashboard();
            window.dispatchEvent(new CustomEvent("dataKeuanganBerubah", { detail: { tipe: "pengeluaran" } }));
        },
        function (error) {
            console.error("Gagal membaca expenses:", error);
        }
    );
}


// ======================================================
// FIRESTORE - SANTRI
// ======================================================

function mulaiSantri() {
    if (unsubscribeSantri) unsubscribeSantri();

    unsubscribeSantri = onSnapshot(
        collection(db, "santri"),
        function (snapshot) {
            semuaSantri = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
            tampilkanDashboard();
        },
        function (error) {
            console.error("Gagal membaca santri:", error);
        }
    );
}


// ======================================================
// REFRESH
// ======================================================

window.refreshDashboard = function () {
    tampilkanDashboard();
    muatLogoDashboard();
};


// ======================================================
// EVENT DATA BERUBAH
// ======================================================

window.addEventListener("dataKeuanganBerubah", function () {
    tampilkanDashboard();
});

window.addEventListener("refreshDashboard", function () {
    tampilkanDashboard();
});

window.addEventListener("storage", function (event) {
    if (event.key === "catatanKasDataBerubah" || event.key === "logoDashboard") {
        tampilkanDashboard();
        muatLogoDashboard();
    }
});


// ======================================================
// FILTER
// ======================================================

function pasangFilter() {
    const filter = $("filterKategori");
    if (!filter) return;

    filter.addEventListener("change", function () {
        tampilkanDashboard();
    });
}


// ======================================================
// INIT
// ======================================================

function initApp() {
    console.log("================================");
    console.log("CATATAN KAS APP.JS AKTIF");
    console.log("================================");

    pasangFilter();
    muatLogoDashboard();
    tampilkanDashboard();

    mulaiPembayaran();
    mulaiPengeluaran();
    mulaiSantri();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

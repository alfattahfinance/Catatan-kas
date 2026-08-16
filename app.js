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
// RUPIAH
// ======================================================

function rupiah(nilai) {

    const angka =
        Number(nilai) || 0;

    return (
        "Rp" +
        angka.toLocaleString("id-ID")
    );

}


// ======================================================
// NOMINAL PEMBAYARAN
// ======================================================

function ambilNominal(item) {

    const nilai =
        item?.nominal ??
        item?.jumlah ??
        item?.nilai ??
        0;

    return Number(nilai) || 0;

}


// ======================================================
// NOMINAL PENGELUARAN
// ======================================================

function ambilNominalPengeluaran(item) {

    const nilai =
        item?.nominal ??
        item?.jumlah ??
        item?.nilai ??
        item?.harga ??
        item?.total ??
        0;

    return Number(nilai) || 0;

}


// ======================================================
// KATEGORI PEMBAYARAN
// ======================================================

function ambilKategoriPembayaran(item) {

    return String(
        item?.jenis ??
        item?.kategori ??
        ""
    ).trim();

}


// ======================================================
// KATEGORI PENGELUARAN
// ======================================================

function ambilKategoriPengeluaran(item) {

    return String(
        item?.jenis ??
        item?.kategori ??
        item?.keterangan ??
        ""
    ).trim();

}


// ======================================================
// FILTER KATEGORI
// ======================================================

function cocokKategori(nilai, filter) {

    if (
        !filter ||
        filter === "Semua"
    ) {

        return true;

    }

    return (
        String(nilai)
            .trim()
            .toLowerCase()
        ===
        String(filter)
            .trim()
            .toLowerCase()
    );

}


// ======================================================
// HITUNG DASHBOARD
// ======================================================

function hitungDashboard() {

    const filterElement =
        $("filterKategori");

    const filter =
        filterElement
            ? filterElement.value
            : "Semua";


    // --------------------------------------------------
    // PEMASUKAN
    // --------------------------------------------------

    const pembayaranTerfilter =
        semuaPembayaran.filter(
            function (item) {

                return cocokKategori(
                    ambilKategoriPembayaran(item),
                    filter
                );

            }
        );


    let totalMasuk = 0;


    pembayaranTerfilter.forEach(
        function (item) {

            totalMasuk +=
                ambilNominal(item);

        }
    );


    // --------------------------------------------------
    // PENGELUARAN
    //
    // Untuk kategori "Beras", pengeluaran tetap
    // dihitung jika kategorinya cocok.
    // --------------------------------------------------

    const pengeluaranTerfilter =
        semuaPengeluaran.filter(
            function (item) {

                return cocokKategori(
                    ambilKategoriPengeluaran(item),
                    filter
                );

            }
        );


    let totalKeluar = 0;


    pengeluaranTerfilter.forEach(
        function (item) {

            totalKeluar +=
                ambilNominalPengeluaran(item);

        }
    );


    // --------------------------------------------------
    // SALDO
    // --------------------------------------------------

    const saldo =
        totalMasuk -
        totalKeluar;


    return {

        totalMasuk:
            totalMasuk,

        totalKeluar:
            totalKeluar,

        saldo:
            saldo,

        totalSantri:
            semuaSantri.length,

        filter:
            filter

    };

}


// ======================================================
// TAMPILKAN DASHBOARD
// ======================================================

function tampilkanDashboard() {

    const hasil =
        hitungDashboard();


    // --------------------------------------------------
    // TOTAL PEMASUKAN
    // --------------------------------------------------

    const totalMasuk =
        $("totalMasuk");

    if (totalMasuk) {

        totalMasuk.textContent =
            rupiah(
                hasil.totalMasuk
            );

    }


    // --------------------------------------------------
    // TOTAL PENGELUARAN
    // --------------------------------------------------

    const totalKeluar =
        $("totalKeluar");

    if (totalKeluar) {

        totalKeluar.textContent =
            rupiah(
                hasil.totalKeluar
            );

    }


    // --------------------------------------------------
    // SALDO
    // --------------------------------------------------

    const totalSaldo =
        $("totalSaldo");

    if (totalSaldo) {

        totalSaldo.textContent =
            rupiah(
                hasil.saldo
            );

    }


    // --------------------------------------------------
    // JUMLAH SANTRI
    // --------------------------------------------------

    const totalSantri =
        $("totalSantri");

    if (totalSantri) {

        totalSantri.textContent =
            hasil.totalSantri
                .toLocaleString(
                    "id-ID"
                );

    }


    // --------------------------------------------------
    // BEBERAPA ID ALTERNATIF
    // --------------------------------------------------

    const saldo =
        $("saldo") ||
        $("saldoSaatIni");

    if (saldo) {

        saldo.textContent =
            rupiah(
                hasil.saldo
            );

    }


    const pemasukan =
        $("pemasukan") ||
        $("jumlahPemasukan");

    if (pemasukan) {

        pemasukan.textContent =
            rupiah(
                hasil.totalMasuk
            );

    }


    const pengeluaran =
        $("pengeluaran") ||
        $("jumlahPengeluaran");

    if (pengeluaran) {

        pengeluaran.textContent =
            rupiah(
                hasil.totalKeluar
            );

    }


    // --------------------------------------------------
    // SIMPAN CACHE DASHBOARD
    // --------------------------------------------------

    try {

        localStorage.setItem(
            "catatanKasDashboard",
            JSON.stringify(hasil)
        );

    }

    catch (error) {

        console.warn(
            "Gagal menyimpan cache dashboard:",
            error
        );

    }


    // --------------------------------------------------
    // GLOBAL
    // --------------------------------------------------

    window.catatanKasDashboard =
        hasil;


    console.log(
        "Dashboard:",
        hasil
    );

}


// ======================================================
// FIRESTORE - PEMBAYARAN
// ======================================================

function mulaiPembayaran() {

    if (unsubscribePayments) {

        unsubscribePayments();

        unsubscribePayments =
            null;

    }


    unsubscribePayments =
        onSnapshot(

            collection(
                db,
                "payments"
            ),

            function (snapshot) {

                semuaPembayaran =
                    snapshot.docs.map(
                        function (item) {

                            return {

                                id:
                                    item.id,

                                ...item.data()

                            };

                        }
                    );


                console.log(
                    "Payments:",
                    semuaPembayaran.length
                );


                tampilkanDashboard();


                window.dispatchEvent(
                    new CustomEvent(
                        "dataKeuanganBerubah",
                        {
                            detail: {
                                tipe:
                                    "pembayaran"
                            }
                        }
                    )
                );

            },

            function (error) {

                console.error(
                    "Gagal membaca payments:",
                    error
                );

            }

        );

}


// ======================================================
// FIRESTORE - PENGELUARAN
// ======================================================

function mulaiPengeluaran() {

    if (unsubscribeExpenses) {

        unsubscribeExpenses();

        unsubscribeExpenses =
            null;

    }


    unsubscribeExpenses =
        onSnapshot(

            collection(
                db,
                "expenses"
            ),

            function (snapshot) {

                semuaPengeluaran =
                    snapshot.docs.map(
                        function (item) {

                            return {

                                id:
                                    item.id,

                                ...item.data()

                            };

                        }
                    );


                console.log(
                    "Expenses:",
                    semuaPengeluaran.length
                );


                tampilkanDashboard();


                window.dispatchEvent(
                    new CustomEvent(
                        "dataKeuanganBerubah",
                        {
                            detail: {
                                tipe:
                                    "pengeluaran"
                            }
                        }
                    )
                );

            },

            function (error) {

                console.error(
                    "Gagal membaca expenses:",
                    error
                );

            }

        );

}


// ======================================================
// FIRESTORE - SANTRI
// ======================================================

function mulaiSantri() {

    if (unsubscribeSantri) {

        unsubscribeSantri();

        unsubscribeSantri =
            null;

    }


    unsubscribeSantri =
        onSnapshot(

            collection(
                db,
                "santri"
            ),

            function (snapshot) {

                semuaSantri =
                    snapshot.docs.map(
                        function (item) {

                            return {

                                id:
                                    item.id,

                                ...item.data()

                            };

                        }
                    );


                console.log(
                    "Santri:",
                    semuaSantri.length
                );


                tampilkanDashboard();

            },

            function (error) {

                console.error(
                    "Gagal membaca santri:",
                    error
                );

            }

        );

}


// ======================================================
// REFRESH
// ======================================================

window.refreshDashboard =
    function () {

        tampilkanDashboard();

    };


// ======================================================
// EVENT DATA BERUBAH
// ======================================================

window.addEventListener(
    "dataKeuanganBerubah",
    function () {

        tampilkanDashboard();

    }
);


window.addEventListener(
    "refreshDashboard",
    function () {

        tampilkanDashboard();

    }
);


// ======================================================
// STORAGE
// ======================================================

window.addEventListener(
    "storage",
    function (event) {

        if (
            event.key ===
            "catatanKasDataBerubah"
        ) {

            tampilkanDashboard();

        }

    }
);


// ======================================================
// FILTER
// ======================================================

function pasangFilter() {

    const filter =
        $("filterKategori");


    if (!filter) {

        return;

    }


    filter.addEventListener(
        "change",
        function () {

            tampilkanDashboard();

        }
    );

}


// ======================================================
// INIT
// ======================================================

function initApp() {

    console.log(
        "================================"
    );

    console.log(
        "CATATAN KAS APP.JS AKTIF"
    );

    console.log(
        "================================"
    );


    pasangFilter();


    // Tampilkan Rp0 dahulu
    tampilkanDashboard();


    // Jalankan Firebase
    mulaiPembayaran();

    mulaiPengeluaran();

    mulaiSantri();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initApp
    );

}

else {

    initApp();

}

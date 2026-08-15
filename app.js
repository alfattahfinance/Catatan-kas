// ======================================
// CATATAN KAS - APP.JS
// Versi Final - Dashboard + Firebase
// ======================================

import {
    db,
    auth
} from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// ======================================
// FORMAT RUPIAH
// ======================================

function rupiah(nilai) {

    const angka = Number(nilai) || 0;

    return "Rp " + angka.toLocaleString("id-ID");

}


// ======================================
// VARIABEL GLOBAL
// ======================================

let totalSantri = 0;

let totalMasuk = 0;

let totalKeluar = 0;

let stokBeras = 0;


// ======================================
// DATA FIREBASE
// ======================================

let semuaPembayaran = [];

let semuaPengeluaran = [];


// ======================================
// REKAP JENIS
// ======================================

const pemasukan = {

    SPP: 0,
    Syahriyyah: 0,
    Infaq: 0,
    Kas: 0,
    Beras: 0,
    Lainnya: 0

};


const pengeluaran = {

    SPP: 0,
    Syahriyyah: 0,
    Infaq: 0,
    Kas: 0,
    Beras: 0,
    Lainnya: 0

};


// ======================================
// NORMALISASI JENIS
// ======================================

function normalisasiJenis(nilai) {

    return String(nilai || "")
        .trim()
        .toLowerCase();

}


// ======================================
// RESET DATA
// ======================================

function resetData() {

    totalMasuk = 0;

    totalKeluar = 0;

    stokBeras = 0;


    Object.keys(pemasukan).forEach(
        key => {

            pemasukan[key] = 0;

        }
    );


    Object.keys(pengeluaran).forEach(
        key => {

            pengeluaran[key] = 0;

        }
    );

}


// ======================================
// BACA TANGGAL FIREBASE
// Mendukung:
// Timestamp
// Date
// angka timestamp
// YYYY-MM-DD
// DD/MM/YYYY
// DD-MM-YYYY
// ======================================

function bacaTanggal(data) {

    const nilai =
        data?.tanggal ??
        data?.date ??
        data?.createdAt ??
        data?.waktu ??
        null;


    if (!nilai) {

        return null;

    }


    // ==================================
    // FIRESTORE TIMESTAMP
    // ==================================

    if (
        typeof nilai === "object" &&
        typeof nilai.toDate === "function"
    ) {

        const tanggal =
            nilai.toDate();

        return isNaN(tanggal.getTime())
            ? null
            : tanggal;

    }


    // ==================================
    // FIRESTORE TIMESTAMP OBJECT
    // seconds / nanoseconds
    // ==================================

    if (
        typeof nilai === "object" &&
        typeof nilai.seconds === "number"
    ) {

        const tanggal =
            new Date(
                nilai.seconds * 1000
            );

        return isNaN(tanggal.getTime())
            ? null
            : tanggal;

    }


    // ==================================
    // JAVASCRIPT DATE
    // ==================================

    if (nilai instanceof Date) {

        return isNaN(nilai.getTime())
            ? null
            : nilai;

    }


    // ==================================
    // ANGKA TIMESTAMP
    // ==================================

    if (typeof nilai === "number") {

        const tanggal =
            new Date(nilai);

        return isNaN(tanggal.getTime())
            ? null
            : tanggal;

    }


    // ==================================
    // STRING
    // ==================================

    if (typeof nilai === "string") {

        const teks =
            nilai.trim();


        if (!teks) {

            return null;

        }


        // --------------------------------
        // YYYY-MM-DD
        // --------------------------------

        let cocok =
            teks.match(
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/
            );


        if (cocok) {

            const tahun =
                Number(cocok[1]);

            const bulan =
                Number(cocok[2]) - 1;

            const hari =
                Number(cocok[3]);


            const tanggal =
                new Date(
                    tahun,
                    bulan,
                    hari
                );


            if (
                tanggal.getFullYear() === tahun &&
                tanggal.getMonth() === bulan &&
                tanggal.getDate() === hari
            ) {

                return tanggal;

            }

        }


        // --------------------------------
        // DD/MM/YYYY
        // --------------------------------

        cocok =
            teks.match(
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
            );


        if (cocok) {

            const hari =
                Number(cocok[1]);

            const bulan =
                Number(cocok[2]) - 1;

            const tahun =
                Number(cocok[3]);


            const tanggal =
                new Date(
                    tahun,
                    bulan,
                    hari
                );


            if (
                tanggal.getFullYear() === tahun &&
                tanggal.getMonth() === bulan &&
                tanggal.getDate() === hari
            ) {

                return tanggal;

            }

        }


        // --------------------------------
        // DD-MM-YYYY
        // --------------------------------

        cocok =
            teks.match(
                /^(\d{1,2})-(\d{1,2})-(\d{4})$/
            );


        if (cocok) {

            const hari =
                Number(cocok[1]);

            const bulan =
                Number(cocok[2]) - 1;

            const tahun =
                Number(cocok[3]);


            const tanggal =
                new Date(
                    tahun,
                    bulan,
                    hari
                );


            if (
                tanggal.getFullYear() === tahun &&
                tanggal.getMonth() ===

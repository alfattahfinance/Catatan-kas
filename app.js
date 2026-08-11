// ======================================
// Syahriyyah App v2
// app.js
// ======================================

import {
    db,
    auth
} from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

// ======================================
// FORMAT RUPIAH
// ======================================

function rupiah(nilai) {

    return "Rp " +
        Number(nilai || 0).toLocaleString("id-ID");

}


// ======================================
// VARIABEL GLOBAL
// ======================================

let totalSantri = 0;

let totalMasuk = 0;

let totalKeluar = 0;

let stokBeras = 0;


// ======================================
// DATA LAPORAN
// ======================================

let semuaPembayaran = [];

let semuaPengeluaran = [];


// ======================================
// REKAP PERIODE
// ======================================

let masukHariIni = 0;

let masukBulanIni = 0;

let masukTahunIni = 0;

let keluarHariIni = 0;

let keluarBulanIni = 0;

let keluarTahunIni = 0;


// ======================================
// REKAP JENIS PEMASUKAN
// ======================================

const pemasukan = {

    SPP: 0,

    Syahriyyah: 0,

    Infaq: 0,

    Kas: 0,

    Beras: 0,

    Lainnya: 0

};


// ======================================
// REKAP JENIS PENGELUARAN
// ======================================

const pengeluaran = {

    SPP: 0,

    Syahriyyah: 0,

    Infaq: 0,

    Kas: 0,

    Beras: 0,

    Lainnya: 0

};


// ======================================
// RESET DATA
// ======================================

function resetData() {

    totalMasuk = 0;

    totalKeluar = 0;

    stokBeras = 0;


    masukHariIni = 0;

    masukBulanIni = 0;

    masukTahunIni = 0;


    keluarHariIni = 0;

    keluarBulanIni = 0;

    keluarTahunIni = 0;


    Object.keys(pemasukan).forEach(key => {

        pemasukan[key] = 0;

    });


    Object.keys(pengeluaran).forEach(key => {

        pengeluaran[key] = 0;

    });

}


// ======================================
// BACA TANGGAL TRANSAKSI
// ======================================

function bacaTanggal(data) {

    const nilaiTanggal =
        data.tanggal ||
        data.date ||
        data.createdAt ||
        data.waktu;


    if (!nilaiTanggal) {

        return null;

    }


    // Firebase Timestamp
    if (nilaiTanggal?.toDate) {

        return nilaiTanggal.toDate();

    }


    // JavaScript Date
    if (nilaiTanggal instanceof Date) {

        return nilaiTanggal;

    }


    // Timestamp angka
    if (typeof nilaiTanggal === "number") {

        return new Date(nilaiTanggal);

    }


    // String tanggal
    if (typeof nilaiTanggal === "string") {

        const tanggal =
            new Date(nilaiTanggal);


        if (!isNaN(tanggal.getTime())) {

            return tanggal;

        }

    }


    return null;

}


// ======================================
// CEK HARI INI
// ======================================

function tanggalHariIni(tanggal) {

    if (!tanggal) {

        return false;

    }


    const sekarang =
        new Date();


    return (

        tanggal.getDate() ===
        sekarang.getDate()

        &&

        tanggal.getMonth() ===
        sekarang.getMonth()

        &&

        tanggal.getFullYear() ===
        sekarang.getFullYear()

    );

}


// ======================================
// CEK BULAN INI
// ======================================

function tanggalBulanIni(tanggal) {

    if (!tanggal) {

        return false;

    }


    const sekarang =
        new Date();


    return (

        tanggal.getMonth() ===
        sekarang.getMonth()

        &&

        tanggal.getFullYear() ===
        sekarang.getFullYear()

    );

}


// ======================================
// CEK TAHUN INI
// ======================================

function tanggalTahunIni(tanggal) {

    if (!tanggal) {

        return false;

    }


    const sekarang =
        new Date();


    return (

        tanggal.getFullYear() ===
        sekarang.getFullYear()

    );

}


// ======================================
// AMBIL SEMUA DATA FIREBASE
// ======================================

async function ambilDataFirebase() {

    resetData();


    // SANTRI
    const santriSnapshot =
        await getDocs(
            collection(db, "santri")
        );


    // PEMBAYARAN
    const pembayaranSnapshot =
        await getDocs(
            collection(db, "payments")
        );


    // PENGELUARAN
    const pengeluaranSnapshot =
        await getDocs(
            collection(db, "expenses")
        );


    // ==================================
    // SIMPAN PEMBAYARAN
    // ==================================

    semuaPembayaran = [];


    pembayaranSnapshot.forEach(item => {

        semuaPembayaran.push({

            id: item.id,

            ...item.data()

        });

    });


    // ==================================
    // SIMPAN PENGELUARAN
    // ==================================

    semuaPengeluaran = [];


    pengeluaranSnapshot.forEach(item => {

        semuaPengeluaran.push({

            id: item.id,

            ...item.data()

        });

    });


    totalSantri =
        santriSnapshot.size;


    return {

        pembayaranSnapshot,

        pengeluaranSnapshot

    };

}


// ======================================
// HITUNG PEMASUKAN
// ======================================

function hitungPemasukan(snapshot) {

    snapshot.forEach(item => {

        const data =
            item.data();


        const tanggal =
            bacaTanggal(data);


        // ==================================
        // BERAS
        // ==================================

        if (data.satuan === "Liter") {

            const liter =
                Number(data.jumlah || 0);


            stokBeras += liter;

            pemasukan.Beras += liter;


            if (tanggal) {

                if (
                    tanggalHariIni(tanggal)
                ) {

                    masukHariIni += liter;

                }


                if (
                    tanggalBulanIni(tanggal)
                ) {

                    masukBulanIni += liter;

                }


                if (
                    tanggalTahunIni(tanggal)
                ) {

                    masukTahunIni += liter;

                }

            }


            return;

        }


        // ==================================
        // UANG
        // ==================================

        const nominal =
            Number(
                data.nominal ||
                data.jumlah ||
                0
            );


        totalMasuk += nominal;


        if (tanggal) {

            if (
                tanggalHariIni(tanggal)
            ) {

                masukHariIni += nominal;

            }


            if (
                tanggalBulanIni(tanggal)
            ) {

                masukBulanIni += nominal;

            }


            if (
                tanggalTahunIni(tanggal)
            ) {

                masukTahunIni += nominal;

            }

        }


        // ==================================
        // JENIS
        // ==================================

        switch (data.jenis) {

            case "SPP":

                pemasukan.SPP += nominal;

                break;


            case "Syahriyyah":

                pemasukan.Syahriyyah += nominal;

                break;


            case "Infaq":

                pemasukan.Infaq += nominal;

                break;


            case "Kas":

                pemasukan.Kas += nominal;

                break;


            case "Beras":

                pemasukan.Beras += nominal;

                break;


            default:

                pemasukan.Lainnya += nominal;

        }

    });

}


// ======================================
// HITUNG PENGELUARAN
// ======================================

function hitungPengeluaran(snapshot) {

    snapshot.forEach(item => {

        const data =
            item.data();


        const tanggal =
            bacaTanggal(data);


        // ==================================
        // BERAS
        // ==================================

        if (data.satuan === "Liter") {

            const liter =
                Number(data.jumlah || 0);


            stokBeras -= liter;

            pengeluaran.Beras += liter;


            if (tanggal) {

                if (
                    tanggalHariIni(tanggal)
                ) {

                    keluarHariIni += liter;

                }


                if (
                    tanggalBulanIni(tanggal)
                ) {

                    keluarBulanIni += liter;

                }


                if (
                    tanggalTahunIni(tanggal)
                ) {

                    keluarTahunIni += liter;

                }

            }


            return;

        }


        // ==================================
        // UANG
        // ==================================

        const nominal =
            Number(
                data.jumlah ||
                data.nominal ||
                0
            );


        totalKeluar += nominal;


        if (tanggal) {

            if (
                tanggalHariIni(tanggal)
            ) {

                keluarHariIni += nominal;

            }


            if (
                tanggalBulanIni(tanggal)
            ) {

                keluarBulanIni += nominal;

            }


            if (
                tanggalTahunIni(tanggal)
            ) {

                keluarTahunIni += nominal;

            }

        }


        // ==================================
        // JENIS
        // ==================================

        switch (data.jenis) {

            case "SPP":

                pengeluaran.SPP += nominal;

                break;


            case "Syahriyyah":

                pengeluaran.Syahriyyah += nominal;

                break;


            case "Infaq":

                pengeluaran.Infaq += nominal;

                break;


            case "Kas":

                pengeluaran.Kas += nominal;

                break;


            case "Beras":

                pengeluaran.Beras += nominal;

                break;


            default:

                pengeluaran.Lainnya += nominal;

        }

    });

}

// ======================================
// HAPUS KARTU RINGKASAN JENIS
// ======================================

function hapusKartuJenis() {

    const judulEl =
        document.getElementById("judulJenis");

    if (!judulEl) {
        return;
    }

    const kartu =
        judulEl.closest(".card, .card-stat");

    if (kartu) {
        kartu.remove();
    }

}

// ======================================
// HITUNG DASHBOARD BERDASARKAN TAHUN
// ======================================

function hitungDashboardTahun(tahun, jenis) {

    let masuk = 0;
    let keluar = 0;
    let berasMasuk = 0;
    let berasKeluar = 0;

    // ================================
    // PEMASUKAN
    // ================================

    semuaPembayaran.forEach(data => {

        const tanggal = bacaTanggal(data);

        if (!tanggal) return;

        // Hanya tahun yang dipilih
        if (tanggal.getFullYear() !== tahun) {
            return;
        }

        // Beras
        if (data.satuan === "Liter") {

            if (jenis === "beras") {

                berasMasuk += Number(
                    data.jumlah || 0
                );

            }

            return;
        }

        // Jenis transaksi
        const jenisData =
            data.jenis || "";

        const nominal =
            Number(
                data.nominal ||
                data.jumlah ||
                0
            );

        if (
            jenis === "syahriyyah" &&
            jenisData === "Syahriyyah"
        ) {

            masuk += nominal;

        }

        else if (
            jenis === "kas" &&
            jenisData === "Kas"
        ) {

            masuk += nominal;

        }

        else if (
            jenis === "beras" &&
            jenisData === "Beras"
        ) {

            masuk += nominal;

        }

    });


    // ================================
    // PENGELUARAN
    // ================================

    semuaPengeluaran.forEach(data => {

        const tanggal = bacaTanggal(data);

        if (!tanggal) return;

        // Hanya tahun yang dipilih
        if (tanggal.getFullYear() !== tahun) {
            return;
        }

        // Beras
        if (data.satuan === "Liter") {

            if (jenis === "beras") {

                berasKeluar += Number(
                    data.jumlah || 0
                );

            }

            return;
        }

        const jenisData =
            data.jenis || "";

        const nominal =
            Number(
                data.jumlah ||
                data.nominal ||
                0
            );

        if (
            jenis === "syahriyyah" &&
            jenisData === "Syahriyyah"
        ) {

            keluar += nominal;

        }

        else if (
            jenis === "kas" &&
            jenisData === "Kas"
        ) {

            keluar += nominal;

        }

        else if (
            jenis === "beras" &&
            jenisData === "Beras"
        ) {

            keluar += nominal;

        }

    });


    // ================================
    // BERAS
    // ================================

    if (jenis === "beras") {

        return {

            masuk: berasMasuk,
            keluar: berasKeluar,
            saldo: berasMasuk - berasKeluar

        };

    }


    // ================================
    // UANG
    // ================================

    return {

        masuk: masuk,
        keluar: keluar,
        saldo: masuk - keluar

    };

}

// ======================================
// TAMPILKAN DASHBOARD
// ======================================

function tampilkanDashboard() {

    // Hapus kartu Syahriyyah/Ringkasan Jenis
    // tetapi dropdown Jenis tetap berfungsi
    hapusKartuJenis();

    const jenis =
        document
            .getElementById("jenisDashboard")
            ?.value || "syahriyyah";

    const tahunDashboard =
    Number(
        document.getElementById("tahunDashboard")?.value
    ) || new Date().getFullYear();
    
    const mode =
        document
            .getElementById("modeBeras")
            ?.value || "liter";
    
    const tahunDipilih =
    Number(
        document.getElementById("tahunDashboard")?.value
    ) || new Date().getFullYear();

const hasilTahun =
    hitungDashboardTahun(
        tahunDipilih,
        jenis
    );
    
    const totalSantriEl =
        document.getElementById("totalSantri");


    const totalSaldoEl =
        document.getElementById("totalSaldo");


    const totalMasukEl =
        document.getElementById("totalMasuk");


    const totalKeluarEl =
        document.getElementById("totalKeluar");


    const judulEl =
        document.getElementById("judulJenis");


    const masukEl =
        document.getElementById("masuk");


    const keluarEl =
        document.getElementById("keluar");


    const saldoEl =
        document.getElementById("saldo");


    if (totalSantriEl) {

        totalSantriEl.textContent =
            totalSantri;

    }


    const namaJenis = {

        syahriyyah: "Syahriyyah",

        spp: "SPP",

        kas: "Kas",

        infaq: "Infaq",

        beras: "Beras"

    };

    // ======================================
// FILTER DASHBOARD BERDASARKAN TAHUN
// ======================================

let masukTahunDashboard = 0;
let keluarTahunDashboard = 0;
let stokBerasTahun = 0;

semuaPembayaran.forEach(data => {

    const tanggal = bacaTanggal(data);

    if (!tanggal) return;

    if (tanggal.getFullYear() !== tahunDashboard) {
        return;
    }

    if (data.satuan === "Liter") {

        stokBerasTahun +=
            Number(data.jumlah || 0);

        return;
    }

    masukTahunDashboard +=
        Number(
            data.nominal ||
            data.jumlah ||
            0
        );

});


semuaPengeluaran.forEach(data => {

    const tanggal = bacaTanggal(data);

    if (!tanggal) return;

    if (tanggal.getFullYear() !== tahunDashboard) {
        return;
    }

    if (data.satuan === "Liter") {

        stokBerasTahun -=
            Number(data.jumlah || 0);

        return;
    }

    keluarTahunDashboard +=
        Number(
            data.jumlah ||
            data.nominal ||
            0
        );

});

    // ==================================
    // DASHBOARD BERAS
    // ==================================

    if (jenis === "beras") {

        if (mode === "liter") {

            if (totalMasukEl) {

                totalMasukEl.textContent =
                    hasilTahun.masuk + " Liter"

            }


            if (totalKeluarEl) {

                totalKeluarEl.textContent =
                    hasilTahun.keluar + " Liter"

            }


            if (totalSaldoEl) {

                totalSaldoEl.textContent =
                    hasilTahun.saldo + " Liter"

            }


            if (masukEl) {

                masukEl.textContent =
                    pemasukan.Beras +
                    " Liter";

            }


            if (keluarEl) {

                keluarEl.textContent =
                    pengeluaran.Beras +
                    " Liter";

            }


            if (saldoEl) {

                saldoEl.textContent =
                    stokBeras +
                    " Liter";

            }

        } else {

            const saldo =
                pemasukan.Beras -
                pengeluaran.Beras;


            if (totalMasukEl) {

                totalMasukEl.textContent =
                    rupiah(pemasukan.Beras);

            }


            if (totalKeluarEl) {

                totalKeluarEl.textContent =
                    rupiah(pengeluaran.Beras);

            }


            if (totalSaldoEl) {

                totalSaldoEl.textContent =
                    rupiah(saldo);

            }


            if (masukEl) {

                masukEl.textContent =
                    rupiah(pemasukan.Beras);

            }


            if (keluarEl) {

                keluarEl.textContent =
                    rupiah(pengeluaran.Beras);

            }


            if (saldoEl) {

                saldoEl.textContent =
                    rupiah(saldo);

            }

        }


        if (judulEl) {

            judulEl.textContent =
                "Beras";

        }


        return;

    }


    // ==================================
    // DASHBOARD UANG
    // ==================================

const key =
    namaJenis[jenis];

const masuk =
    hasilTahun.masuk;

const keluar =
    hasilTahun.keluar;

const saldo =
    hasilTahun.saldo;

    if (totalMasukEl) {

        totalMasukEl.textContent =
            rupiah(masuk);

    }


    if (totalKeluarEl) {

        totalKeluarEl.textContent =
            rupiah(keluar);

    }


    if (totalSaldoEl) {

        totalSaldoEl.textContent =
            rupiah(saldo);

    }


    if (masukEl) {

        masukEl.textContent =
            rupiah(masuk);

    }


    if (keluarEl) {

        keluarEl.textContent =
            rupiah(keluar);

    }


    if (saldoEl) {

        saldoEl.textContent =
            rupiah(saldo);

    }


    if (judulEl) {

        judulEl.textContent =
            key;

    }

}


// ======================================
// ISI FILTER BULAN & TAHUN
// ======================================

function isiFilter() {

    const bulan =
        document.getElementById("bulan");


    const tahun =
        document.getElementById("tahun");


    if (!bulan || !tahun) {

        return;

    }


    const namaBulan = [

        "Januari",

        "Februari",

        "Maret",

        "April",

        "Mei",

        "Juni",

        "Juli",

        "Agustus",

        "September",

        "Oktober",

        "November",

        "Desember"

    ];


    bulan.innerHTML = "";


    namaBulan.forEach((nama, index) => {

        bulan.innerHTML += `

            <option value="${index + 1}">
                ${nama}
            </option>

        `;

    });


    tahun.innerHTML = "";


    const sekarang =
        new Date().getFullYear();


    for (
        let i = sekarang - 2;
        i <= sekarang + 2;
        i++
    ) {

        tahun.innerHTML += `

            <option value="${i}">
                ${i}
            </option>

        `;

    }


    bulan.value =
        new Date().getMonth() + 1;


    tahun.value =
        sekarang;

}

// ======================================
// ISI TAHUN DASHBOARD
// ======================================

function isiTahunDashboard() {

    const tahunEl =
        document.getElementById("tahunDashboard");

    if (!tahunEl) {
        return;
    }

    const sekarang =
        new Date().getFullYear();

    tahunEl.innerHTML = "";

    for (
        let tahun = sekarang - 2;
        tahun <= sekarang + 2;
        tahun++
    ) {

        tahunEl.innerHTML += `
            <option value="${tahun}">
                ${tahun}
            </option>
        `;

    }

    tahunEl.value = sekarang;

}

// ======================================
// TAMPILKAN LAPORAN
// ======================================

function tampilkanLaporan() {

    const totalSaldoEl =
        document.getElementById("totalSaldo");


    const hariIniEl =
        document.getElementById("hariIni");


    const bulanIniEl =
        document.getElementById("bulanIni");


    const tahunIniEl =
        document.getElementById("tahunIni");


    const pengeluaranHariIniEl =
        document.getElementById(
            "pengeluaranHariIni"
        );


    const pengeluaranBulanIniEl =
        document.getElementById(
            "pengeluaranBulanIni"
        );


    const pengeluaranTahunIniEl =
        document.getElementById(
            "pengeluaranTahunIni"
        );


    // ==================================
    // CEK HALAMAN
    // ==================================

    if (
        !totalSaldoEl &&
        !hariIniEl &&
        !bulanIniEl &&
        !tahunIniEl &&
        !pengeluaranHariIniEl &&
        !pengeluaranBulanIniEl &&
        !pengeluaranTahunIniEl
    ) {

        return;

    }


    // ==================================
    // FILTER
    // ==================================

    const bulanEl =
        document.getElementById("bulan");


    const tahunEl =
        document.getElementById("tahun");


    const jenisEl =
        document.getElementById("filterJenis");


    const bulanDipilih =
        Number(bulanEl?.value);


    const tahunDipilih =
        Number(tahunEl?.value);


    const jenisDipilih =
        jenisEl?.value || "semua";


    // ==================================
    // VARIABEL
    // ==================================

    let pemasukanBulan = 0;

    let pengeluaranBulan = 0;


    let pemasukanTahun = 0;

    let pengeluaranTahun = 0;


    let pemasukanHariIni = 0;

    let pengeluaranHariIni = 0;


    // ==================================
    // HITUNG PEMASUKAN
    // ==================================

    semuaPembayaran.forEach(data => {

        const tanggal =
            bacaTanggal(data);


        if (!tanggal) {

            return;

        }


        const jenis =
            data.jenis || "";


        // Filter jenis
        if (
            jenisDipilih !== "semua" &&
            jenis !== jenisDipilih
        ) {

            return;

        }


        const nominal =
            Number(
                data.nominal ||
                data.jumlah ||
                0
            );


        // ------------------------------
        // HARI INI
        // ------------------------------

        if (
            tanggalHariIni(tanggal)
        ) {

            pemasukanHariIni += nominal;

        }


        // ------------------------------
        // BULAN TERPILIH
        // ------------------------------

        if (

            tanggal.getMonth() + 1 ===
            bulanDipilih

            &&

            tanggal.getFullYear() ===
            tahunDipilih

        ) {

            pemasukanBulan += nominal;

        }


        // ------------------------------
        // TAHUN TERPILIH
        // ------------------------------

        if (
            tanggal.getFullYear() ===
            tahunDipilih
        ) {

            pemasukanTahun += nominal;

        }

    });


    // ==================================
    // HITUNG PENGELUARAN
    // ==================================

    semuaPengeluaran.forEach(data => {

        const tanggal =
            bacaTanggal(data);


        if (!tanggal) {

            return;

        }


        const jenis =
            data.jenis || "";


        // Filter jenis
        if (
            jenisDipilih !== "semua" &&
            jenis !== jenisDipilih
        ) {

            return;

        }


        const nominal =
            Number(
                data.jumlah ||
                data.nominal ||
                0
            );


        // ------------------------------
        // HARI INI
        // ------------------------------

        if (
            tanggalHariIni(tanggal)
        ) {

            pengeluaranHariIni += nominal;

        }


        // ------------------------------
        // BULAN TERPILIH
        // ------------------------------

        if (

            tanggal.getMonth() + 1 ===
            bulanDipilih

            &&

            tanggal.getFullYear() ===
            tahunDipilih

        ) {

            pengeluaranBulan += nominal;

        }


        // ------------------------------
        // TAHUN TERPILIH
        // ------------------------------

        if (
            tanggal.getFullYear() ===
            tahunDipilih
        ) {

            pengeluaranTahun += nominal;

        }

    });


    // ==================================
    // HITUNG SALDO
    // ==================================

    const saldoBulan =
        pemasukanBulan -
        pengeluaranBulan;


    // ==================================
    // TAMPILKAN PEMASUKAN
    // ==================================

    if (totalSaldoEl) {

        totalSaldoEl.textContent =
            rupiah(saldoBulan);

    }


    if (hariIniEl) {

        hariIniEl.textContent =
            rupiah(pemasukanHariIni);

    }


    if (bulanIniEl) {

        bulanIniEl.textContent =
            rupiah(pemasukanBulan);

    }


    if (tahunIniEl) {

        tahunIniEl.textContent =
            rupiah(pemasukanTahun);

    }


    // ==================================
    // TAMPILKAN PENGELUARAN
    // ==================================

    if (pengeluaranHariIniEl) {

        pengeluaranHariIniEl.textContent =
            rupiah(pengeluaranHariIni);

    }


    if (pengeluaranBulanIniEl) {

        pengeluaranBulanIniEl.textContent =
            rupiah(pengeluaranBulan);

    }


    if (pengeluaranTahunIniEl) {

        pengeluaranTahunIniEl.textContent =
            rupiah(pengeluaranTahun);

    }

}


// ======================================
// TAMPILKAN TABEL LAPORAN
// ======================================

function tampilkanTabelLaporan() {

    const tbody =
        document.getElementById(
            "dataPembayaran"
        );


    if (!tbody) {

        return;

    }


    const bulanEl =
        document.getElementById("bulan");


    const tahunEl =
        document.getElementById("tahun");


    const jenisEl =
        document.getElementById(
            "filterJenis"
        );


    const bulanDipilih =
        Number(bulanEl?.value);


    const tahunDipilih =
        Number(tahunEl?.value);


    const jenisDipilih =
        jenisEl?.value || "semua";


    tbody.innerHTML = "";


    const transaksi = [];


    // ==================================
    // PEMASUKAN
    // ==================================

    semuaPembayaran.forEach(data => {

        const tanggal =
            bacaTanggal(data);


        if (!tanggal) {

            return;

        }


        // Filter bulan dan tahun
        if (

            tanggal.getMonth() + 1 !==
            bulanDipilih

            ||

            tanggal.getFullYear() !==
            tahunDipilih

        ) {

            return;

        }


        // Filter jenis
        if (

            jenisDipilih !== "semua"

            &&

            data.jenis !==
            jenisDipilih

        ) {

            return;

        }


        transaksi.push({

            tanggal: tanggal,


            nama:
                data.namaSantri ||
                data.nama ||
                data.santri ||
                "-",


            jenis:
                data.jenis ||
                "-",


            jumlah:
                Number(
                    data.nominal ||
                    data.jumlah ||
                    0
                ),


            tipe:
                "Pemasukan"

        });

    });


    // ==================================
    // PENGELUARAN
    // ==================================

    semuaPengeluaran.forEach(data => {

        const tanggal =
            bacaTanggal(data);


        if (!tanggal) {

            return;

        }


        // Filter bulan dan tahun
        if (

            tanggal.getMonth() + 1 !==
            bulanDipilih

            ||

            tanggal.getFullYear() !==
            tahunDipilih

        ) {

            return;

        }


        // Filter jenis
        if (

            jenisDipilih !== "semua"

            &&

            data.jenis !==
            jenisDipilih

        ) {

            return;

        }


        transaksi.push({

            tanggal: tanggal,


            nama:
                data.keterangan ||
                data.namaSantri ||
                data.nama ||
                data.santri ||
                "-",


            jenis:
                data.jenis ||
                "-",


            jumlah:
                Number(
                    data.jumlah ||
                    data.nominal ||
                    0
                ),


            tipe:
                "Pengeluaran"

        });

    });


    // ==================================
    // URUTKAN TERBARU
    // ==================================

    transaksi.sort((a, b) => {

        const tanggalA =
            a.tanggal
                ? a.tanggal.getTime()
                : 0;


        const tanggalB =
            b.tanggal
                ? b.tanggal.getTime()
                : 0;


        return tanggalB - tanggalA;

    });


    // ==================================
    // TIDAK ADA DATA
    // ==================================

    if (transaksi.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="text-center text-muted py-4">

                    Tidak ada transaksi
                    pada bulan, tahun,
                    dan jenis yang dipilih.

                </td>

            </tr>

        `;


        return;

    }


    // ==================================
    // TAMPILKAN DATA
    // ==================================

    transaksi.forEach(item => {

        const tanggal =
            item.tanggal
                ? item.tanggal.toLocaleDateString(
                    "id-ID"
                )
                : "-";


        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>
                ${tanggal}
            </td>

            <td>
                ${item.nama}
            </td>

            <td>

                <span class="badge ${
                    item.tipe === "Pemasukan"
                        ? "bg-success"
                        : "bg-danger"
                }">

                    ${item.jenis}

                </span>

            </td>

            <td class="${
                item.tipe === "Pemasukan"
                    ? "text-success"
                    : "text-danger"
            } fw-bold">

                ${rupiah(item.jumlah)}

            </td>

        `;


        tbody.appendChild(tr);

    });

}


// ======================================
// SIMPAN PENGELUARAN
// ======================================

async function simpanPengeluaran(event) {

    // Mencegah reload
    if (event) {

        event.preventDefault();

    }


    const jenisEl =
        document.getElementById(
            "jenisPengeluaran"
        );


    const keteranganEl =
        document.getElementById(
            "keterangan"
        );


    const tanggalEl =
        document.getElementById(
            "tanggal"
        );


    const nominalEl =
        document.getElementById(
            "nominal"
        );


    const satuanEl =
        document.getElementById(
            "satuan"
        );


    const jenis =
        jenisEl?.value || "";


    const keterangan =
        keteranganEl?.value.trim() || "";


    const tanggal =
        tanggalEl?.value || "";


    const nominal =
        Number(
            nominalEl?.value || 0
        );


    const satuan =
        satuanEl?.value || "Rupiah";


    // ==================================
    // VALIDASI
    // ==================================

    if (!jenis) {

        alert(
            "Silakan pilih jenis pengeluaran."
        );

        return;

    }


    if (!keterangan) {

        alert(
            "Silakan isi keterangan."
        );

        return;

    }


    if (!tanggal) {

        alert(
            "Silakan pilih tanggal."
        );

        return;

    }


    if (nominal <= 0) {

        alert(
            "Nominal harus lebih dari 0."
        );

        return;

    }


    // ==================================
    // SIMPAN FIRESTORE
    // ==================================

    try {

        console.log(
            "Mencoba menyimpan pengeluaran..."
        );


        const dataPengeluaran = {

            jenis: jenis,

            keterangan: keterangan,

            tanggal: tanggal,

            jumlah: nominal,

            nominal: nominal,

            satuan: satuan,

            createdAt:
                serverTimestamp()

        };


        console.log(
            "Data yang dikirim:",
            dataPengeluaran
        );


        const docRef =
            await addDoc(

                collection(
                    db,
                    "expenses"
                ),

                dataPengeluaran

            );


        console.log(
            "BERHASIL DISIMPAN!",
            docRef.id
        );


        alert(
            "Pengeluaran berhasil disimpan!"
        );


        // ==================================
        // KOSONGKAN FORM
        // ==================================

        if (jenisEl) {

            jenisEl.value = "";

        }


        if (keteranganEl) {

            keteranganEl.value = "";

        }


        if (tanggalEl) {

            tanggalEl.value = "";

        }


        if (nominalEl) {

            nominalEl.value = "";

        }


        // ==================================
        // LOAD ULANG
        // ==================================

        await loadSemua();


    } catch (error) {

        console.error(
            "ERROR FIRESTORE:",
            error
        );


        alert(
            "GAGAL MENYIMPAN!\n\n" +
            "Kode: " +
            (error.code || "-") +
            "\n\n" +
            error.message
        );

    }

}


// ======================================
// LOAD SEMUA DATA
// ======================================

async function loadSemua() {

    try {

        const data =
            await ambilDataFirebase();


        // Hitung pemasukan
        hitungPemasukan(
            data.pembayaranSnapshot
        );


        // Hitung pengeluaran
        hitungPengeluaran(
            data.pengeluaranSnapshot
        );


        // Dashboard
        tampilkanDashboard();


        // Filter
        isiFilter();


        // Laporan
        tampilkanLaporan();


        // Tabel
        tampilkanTabelLaporan();


    } catch (error) {

        console.error(
            "Gagal memuat data:",
            error
        );

    }

}


// ======================================
// EVENT GLOBAL
// ======================================

function jalankanAplikasi() {

    console.log("Aplikasi siap dijalankan");

    // ==================================
    // LOAD AWAL
    // ==================================

    loadSemua();


    // ==================================
    // TOMBOL SIMPAN PENGELUARAN
    // ==================================

    const tombolSimpan =
        document.getElementById(
            "simpanPengeluaran"
        );

    if (tombolSimpan) {

        tombolSimpan.addEventListener(
            "click",
            simpanPengeluaran
        );

    }


    // ==================================
    // DASHBOARD - JENIS
    // ==================================

    document
        .getElementById("jenisDashboard")
        ?.addEventListener(
            "change",
            () => {

                tampilkanDashboard();

            }
        );


    // ==================================
    // DASHBOARD - TAHUN
    // ==================================

    document
        .getElementById("tahunDashboard")
        ?.addEventListener(
            "change",
            () => {

                tampilkanDashboard();

            }
        );


    // ==================================
    // DASHBOARD - MODE BERAS
    // ==================================

    document
        .getElementById("modeBeras")
        ?.addEventListener(
            "change",
            () => {

                tampilkanDashboard();

            }
        );


    // ==================================
    // FILTER BULAN
    // ==================================

    document
        .getElementById("bulan")
        ?.addEventListener(
            "change",
            () => {

                tampilkanLaporan();

                tampilkanTabelLaporan();

            }
        );


    // ==================================
    // FILTER TAHUN
    // ==================================

    document
        .getElementById("tahun")
        ?.addEventListener(
            "change",
            () => {

                tampilkanLaporan();

                tampilkanTabelLaporan();

            }
        );


    // ==================================
    // FILTER JENIS
    // ==================================

    document
        .getElementById("filterJenis")
        ?.addEventListener(
            "change",
            () => {

                tampilkanLaporan();

                tampilkanTabelLaporan();

            }
        );

}


// ======================================
// CEK LOGIN FIREBASE
// ======================================

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            console.log(
                "Belum login Firebase."
            );

            return;

        }

        console.log(
            "LOGIN TERDETEKSI:",
            user.email
        );


        // Jika DOM sudah selesai
        if (
            document.readyState ===
            "loading"
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                jalankanAplikasi,
                {
                    once: true
                }
            );

        } else {

            // DOM sudah selesai
            jalankanAplikasi();

        }

    }
);

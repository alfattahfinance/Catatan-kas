// ======================================
// CATATAN KAS - APP.JS
// Versi Stabil Dashboard + Firebase
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

    return "Rp " + Number(nilai || 0).toLocaleString("id-ID");

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
// RESET DATA
// ======================================

function resetData() {

    totalMasuk = 0;

    totalKeluar = 0;

    stokBeras = 0;


    Object.keys(pemasukan).forEach(key => {

        pemasukan[key] = 0;

    });


    Object.keys(pengeluaran).forEach(key => {

        pengeluaran[key] = 0;

    });

}


// ======================================
// FORMAT / BACA TANGGAL
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


    // Firestore Timestamp
    if (
        typeof nilai === "object" &&
        typeof nilai.toDate === "function"
    ) {

        return nilai.toDate();

    }


    // JavaScript Date
    if (nilai instanceof Date) {

        return nilai;

    }


    // Angka timestamp
    if (typeof nilai === "number") {

        const tanggal = new Date(nilai);

        return isNaN(tanggal.getTime())
            ? null
            : tanggal;

    }


    // String
    if (typeof nilai === "string") {

        // Format YYYY-MM-DD
        // Dibaca sebagai tanggal lokal Indonesia
        const cocok =
            nilai.match(
                /^(\d{4})-(\d{2})-(\d{2})$/
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


            return isNaN(tanggal.getTime())
                ? null
                : tanggal;

        }


        const tanggal =
            new Date(nilai);


        return isNaN(tanggal.getTime())
            ? null
            : tanggal;

    }


    return null;

}


// ======================================
// CEK TANGGAL
// ======================================

function tanggalHariIni(tanggal) {

    if (!tanggal) return false;

    const sekarang = new Date();

    return (

        tanggal.getDate() === sekarang.getDate()

        &&

        tanggal.getMonth() === sekarang.getMonth()

        &&

        tanggal.getFullYear() === sekarang.getFullYear()

    );

}


function tanggalBulanIni(tanggal) {

    if (!tanggal) return false;

    const sekarang = new Date();

    return (

        tanggal.getMonth() === sekarang.getMonth()

        &&

        tanggal.getFullYear() === sekarang.getFullYear()

    );

}


function tanggalTahunIni(tanggal) {

    if (!tanggal) return false;

    return (

        tanggal.getFullYear() ===
        new Date().getFullYear()

    );

}


// ======================================
// AMBIL DATA FIREBASE
// ======================================

async function ambilDataFirebase() {

    resetData();


    // ------------------------------
    // SANTRI
    // ------------------------------

    const santriSnapshot =
        await getDocs(
            collection(db, "santri")
        );


    // ------------------------------
    // PEMBAYARAN
    // ------------------------------

    const pembayaranSnapshot =
        await getDocs(
            collection(db, "payments")
        );


    // ------------------------------
    // PENGELUARAN
    // ------------------------------

    const pengeluaranSnapshot =
        await getDocs(
            collection(db, "expenses")
        );


    // ------------------------------
    // SIMPAN PEMBAYARAN
    // ------------------------------

    semuaPembayaran =
        pembayaranSnapshot.docs.map(doc => ({

            id: doc.id,

            ...doc.data()

        }));


    // ------------------------------
    // SIMPAN PENGELUARAN
    // ------------------------------

    semuaPengeluaran =
        pengeluaranSnapshot.docs.map(doc => ({

            id: doc.id,

            ...doc.data()

        }));


    totalSantri =
        santriSnapshot.size;


    return {

        pembayaranSnapshot,

        pengeluaranSnapshot

    };

}


// ======================================
// AMBIL DATA SANTRI UNTUK PEMBAYARAN
// ======================================

async function muatDaftarSantriPilih() {
    const datalist = document.getElementById("datalistSantri");
    if (!datalist) return;

    try {
        const santriSnapshot = await getDocs(collection(db, "santri"));
        datalist.innerHTML = "";

        santriSnapshot.forEach(doc => {
            const data = doc.data();
            const nama = data.namaSantri || data.nama || "";
            
            if (nama) {
                const option = document.createElement("option");
                option.value = nama;
                datalist.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Gagal memuat daftar santri:", error);
    }
}


// ======================================
// SIMPAN PEMASUKAN
// ======================================

async function simpanPemasukan(event) {

    if (event) {
        event.preventDefault();
    }

    const jenisEl = document.getElementById("jenisPemasukan");
    const namaSantriEl = document.getElementById("namaSantriPemasukan");
    const tanggalEl = document.getElementById("tanggalPemasukan");
    const nominalEl = document.getElementById("nominalPemasukan");
    const satuanEl = document.getElementById("satuanPemasukan");

    const jenis = jenisEl?.value || "";
    const namaSantri = namaSantriEl?.value.trim() || "";
    const tanggal = tanggalEl?.value || "";
    const nominal = Number(nominalEl?.value || 0);
    const satuan = satuanEl?.value || "Rupiah";

    // ==================================
    // VALIDASI
    // ==================================

    if (!jenis) {
        alert("Silakan pilih jenis pemasukan.");
        return;
    }

    if (!namaSantri) {
        alert("Silakan isi nama santri / keterangan.");
        return;
    }

    if (!tanggal) {
        alert("Silakan pilih tanggal.");
        return;
    }

    if (nominal <= 0) {
        alert("Nominal/jumlah harus lebih dari 0.");
        return;
    }

    // ==================================
    // CEK LOGIN
    // ==================================

    if (!auth.currentUser) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    // ==================================
    // SIMPAN KE FIRESTORE (koleksi "payments")
    // ==================================

    try {
        const dataPemasukan = {
            jenis,
            namaSantri,
            tanggal,
            nominal,
            jumlah: nominal,
            satuan,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, "payments"), dataPemasukan);

        alert("Pemasukan berhasil disimpan!");

        // Reset Form
        if (jenisEl) jenisEl.value = "";
        if (namaSantriEl) namaSantriEl.value = "";
        if (tanggalEl) tanggalEl.value = "";
        if (nominalEl) nominalEl.value = "";

        // Refresh Data Dashboard & Tabel
        await loadSemua();

    } catch (error) {
        console.error("Gagal menyimpan pemasukan:", error);
        alert("Gagal menyimpan pemasukan: " + error.message);
    }
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


        // ==============================
        // BERAS LITER
        // ==============================

        if (
            String(data.satuan || "").toLowerCase()
            === "liter"
        ) {

            const liter =
                Number(data.jumlah || 0);


            stokBeras += liter;

            pemasukan.Beras += liter;


            return;

        }


        // ==============================
        // UANG
        // ==============================

        const nominal =
            Number(
                data.nominal ??
                data.jumlah ??
                0
            );


        totalMasuk += nominal;


        // ==============================
        // JENIS
        // ==============================

        const jenis =
            data.jenis || "";


        switch (jenis) {

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


        // ==============================
        // BERAS LITER
        // ==============================

        if (
            String(data.satuan || "").toLowerCase()
            === "liter"
        ) {

            const liter =
                Number(data.jumlah || 0);


            stokBeras -= liter;

            pengeluaran.Beras += liter;


            return;

        }


        // ==============================
        // UANG
        // ==============================

        const nominal =
            Number(
                data.jumlah ??
                data.nominal ??
                0
            );


        totalKeluar += nominal;


        // ==============================
        // JENIS
        // ==============================

        const jenis =
            data.jenis || "";


        switch (jenis) {

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
// HITUNG DASHBOARD TAHUN
// ======================================

function hitungDashboardTahun(
    tahun,
    jenis
) {

    let masuk = 0;

    let keluar = 0;

    let berasMasuk = 0;

    let berasKeluar = 0;


    // ==================================
    // PEMASUKAN
    // ==================================

    semuaPembayaran.forEach(data => {

        const tanggal =
            bacaTanggal(data);


        if (!tanggal) return;


        if (
            tanggal.getFullYear() !== tahun
        ) {

            return;

        }


        // ------------------------------
        // BERAS LITER
        // ------------------------------

        if (
            String(data.satuan || "").toLowerCase()
            === "liter"
        ) {

            if (jenis === "beras") {

                berasMasuk +=
                    Number(data.jumlah || 0);

            }

            return;

        }


        const jenisData =
            data.jenis || "";


        const nominal =
            Number(
                data.nominal ??
                data.jumlah ??
                0
            );


        // ------------------------------
        // SYAHRiYYAH
        // ------------------------------

        if (
            jenis === "syahriyyah" &&
            jenisData === "Syahriyyah"
        ) {

            masuk += nominal;

        }


        // ------------------------------
        // KAS
        // ------------------------------

        else if (
            jenis === "kas" &&
            jenisData === "Kas"
        ) {

            masuk += nominal;

        }


        // ------------------------------
        // BERAS UANG
        // ------------------------------

        else if (
            jenis === "beras" &&
            jenisData === "Beras"
        ) {

            masuk += nominal;

        }

    });


    // ==================================
    // PENGELUARAN
    // ==================================

    semuaPengeluaran.forEach(data => {

        const tanggal =
            bacaTanggal(data);


        if (!tanggal) return;


        if (
            tanggal.getFullYear() !== tahun
        ) {

            return;

        }


        // ------------------------------
        // BERAS LITER
        // ------------------------------

        if (
            String(data.satuan || "").toLowerCase()
            === "liter"
        ) {

            if (jenis === "beras") {

                berasKeluar +=
                    Number(data.jumlah || 0);

            }

            return;

        }


        const jenisData =
            data.jenis || "";


        const nominal =
            Number(
                data.jumlah ??
                data.nominal ??
                0
            );


        // ------------------------------
        // SYAHRIYYAH
        // ------------------------------

        if (
            jenis === "syahriyyah" &&
            jenisData === "Syahriyyah"
        ) {

            keluar += nominal;

        }


        // ------------------------------
        // KAS
        // ------------------------------

        else if (
            jenis === "kas" &&
            jenisData === "Kas"
        ) {

            keluar += nominal;

        }


        // ------------------------------
        // BERAS UANG
        // ------------------------------

        else if (
            jenis === "beras" &&
            jenisData === "Beras"
        ) {

            keluar += nominal;

        }

    });


    // ==================================
    // HASIL BERAS
    // ==================================

    if (jenis === "beras") {

        return {

            masuk: berasMasuk,

            keluar: berasKeluar,

            saldo:
                berasMasuk -
                berasKeluar

        };

    }


    // ==================================
    // HASIL UANG
    // ==================================

    return {

        masuk,

        keluar,

        saldo:
            masuk -
            keluar

    };

}


// ======================================
// TAMPILKAN DASHBOARD
// ======================================

function tampilkanDashboard() {

    const jenisEl =
        document.getElementById(
            "jenisDashboard"
        );


    const tahunEl =
        document.getElementById(
            "tahunDashboard"
        );


    const modeEl =
        document.getElementById(
            "modeBeras"
        );


    const jenis =
        jenisEl?.value ||
        "syahriyyah";


    const tahun =
        Number(
            tahunEl?.value
        ) ||
        new Date().getFullYear();


    const mode =
        modeEl?.value ||
        "liter";


    // ==================================
    // ELEMENT DASHBOARD
    // ==================================

    const totalSantriEl =
        document.getElementById(
            "totalSantri"
        );


    const totalSaldoEl =
        document.getElementById(
            "totalSaldo"
        );


    const totalMasukEl =
        document.getElementById(
            "totalMasuk"
        );


    const totalKeluarEl =
        document.getElementById(
            "totalKeluar"
        );


    const judulEl =
        document.getElementById(
            "judulJenis"
        );


    const masukEl =
        document.getElementById(
            "masuk"
        );


    const keluarEl =
        document.getElementById(
            "keluar"
        );


    const saldoEl =
        document.getElementById(
            "saldo"
        );


    // ==================================
    // TOTAL SANTRI
    // ==================================

    if (totalSantriEl) {

        totalSantriEl.textContent =
            totalSantri;

    }


    // ==================================
    // HITUNG
    // ==================================

    const hasil =
        hitungDashboardTahun(
            tahun,
            jenis
        );


    // ==================================
    // BERAS
    // ==================================

    if (jenis === "beras") {

        if (mode === "liter") {

            if (totalMasukEl) {

                totalMasukEl.textContent =
                    hasil.masuk.toLocaleString(
                        "id-ID"
                    ) + " Liter";

            }


            if (totalKeluarEl) {

                totalKeluarEl.textContent =
                    hasil.keluar.toLocaleString(
                        "id-ID"
                    ) + " Liter";

            }


            if (totalSaldoEl) {

                totalSaldoEl.textContent =
                    hasil.saldo.toLocaleString(
                        "id-ID"
                    ) + " Liter";

            }

        }

        else {

            // Mode UANG
            if (totalMasukEl) {

                totalMasukEl.textContent =
                    rupiah(
                        pemasukan.Beras
                    );

            }


            if (totalKeluarEl) {

                totalKeluarEl.textContent =
                    rupiah(
                        pengeluaran.Beras
                    );

            }


            if (totalSaldoEl) {

                totalSaldoEl.textContent =
                    rupiah(
                        pemasukan.Beras -
                        pengeluaran.Beras
                    );

            }

        }


        if (judulEl) {

            judulEl.textContent =
                "Beras";

        }


        return;

    }


    // ==================================
    // UANG
    // ==================================

    if (totalMasukEl) {

        totalMasukEl.textContent =
            rupiah(hasil.masuk);

    }


    if (totalKeluarEl) {

        totalKeluarEl.textContent =
            rupiah(hasil.keluar);

    }


    if (totalSaldoEl) {

        totalSaldoEl.textContent =
            rupiah(hasil.saldo);

    }


    // ==================================
    // KARTU LAMA JIKA ADA
    // ==================================

    if (masukEl) {

        masukEl.textContent =
            rupiah(hasil.masuk);

    }


    if (keluarEl) {

        keluarEl.textContent =
            rupiah(hasil.keluar);

    }


    if (saldoEl) {

        saldoEl.textContent =
            rupiah(hasil.saldo);

    }


    if (judulEl) {

        const namaJenis = {

            syahriyyah:
                "Syahriyyah",

            kas:
                "Kas",

            beras:
                "Beras",

            spp:
                "SPP",

            infaq:
                "Infaq"

        };


        judulEl.textContent =
            namaJenis[jenis] ||
            jenis;

    }

}


// ======================================
// ISI FILTER LAPORAN
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


    // ==================================
    // BULAN
    // ==================================

    if (!bulan.options.length) {

        namaBulan.forEach(
            (nama, index) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    index + 1;


                option.textContent =
                    nama;


                bulan.appendChild(
                    option
                );

            }
        );

    }


    // ==================================
    // TAHUN
    // ==================================

    if (!tahun.options.length) {

        const sekarang =
            new Date().getFullYear();


        for (
            let i = sekarang - 2;
            i <= sekarang + 2;
            i++
        ) {

            const option =
                document.createElement(
                    "option"
                );


            option.value = i;

            option.textContent = i;


            tahun.appendChild(
                option
            );

        }

    }


    if (!bulan.value) {

        bulan.value =
            new Date().getMonth() + 1;

    }


    if (!tahun.value) {

        tahun.value =
            new Date().getFullYear();

    }

}


// ======================================
// TAMPILKAN LAPORAN
// ======================================

function tampilkanLaporan() {

    const totalSaldoEl =
        document.getElementById(
            "totalSaldo"
        );


    const hariIniEl =
        document.getElementById(
            "hariIni"
        );


    const bulanIniEl =
        document.getElementById(
            "bulanIni"
        );


    const tahunIniEl =
        document.getElementById(
            "tahunIni"
        );


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


    // Jika bukan halaman laporan
    if (

        !hariIniEl &&
        !bulanIniEl &&
        !tahunIniEl &&
        !pengeluaranHariIniEl &&
        !pengeluaranBulanIniEl &&
        !pengeluaranTahunIniEl

    ) {

        return;

    }


    const bulanEl =
        document.getElementById(
            "bulan"
        );


    const tahunEl =
        document.getElementById(
            "tahun"
        );


    const jenisEl =
        document.getElementById(
            "filterJenis"
        );


    const bulan =
        Number(
            bulanEl?.value
        );


    const tahun =
        Number(
            tahunEl?.value
        );


    const jenisDipilih =
        jenisEl?.value ||
        "semua";


    let masukBulan = 0;

    let keluarBulan = 0;

    let masukTahun = 0;

    let keluarTahun = 0;

    let masukHari = 0;

    let keluarHari = 0;


    // ==================================
    // PEMASUKAN
    // ==================================

    semuaPembayaran.forEach(data => {

        const tanggal =
            bacaTanggal(data);


        if (!tanggal) return;


        const jenis =
            data.jenis || "";


        if (

            jenisDipilih !== "semua" &&

            jenis !== jenisDipilih

        ) {

            return;

        }


        if (
            String(data.satuan || "").toLowerCase()
            === "liter"
        ) {

            return;

        }


        const nominal =
            Number(
                data.nominal ??
                data.jumlah ??
                0
            );


        if (
            tanggalHariIni(tanggal)
        ) {

            masukHari += nominal;

        }


        if (

            tanggal.getMonth() + 1 === bulan &&

            tanggal.getFullYear() === tahun

        ) {

            masukBulan += nominal;

        }


        if (
            tanggal.getFullYear() === tahun
        ) {

            masukTahun += nominal;

        }

    });


    // ==================================
    // PENGELUARAN
    // ==================================

    semuaPengeluaran.forEach(data => {

        const tanggal =
            bacaTanggal(data);


        if (!tanggal) return;


        const jenis =
            data.jenis || "";


        if (

            jenisDipilih !== "semua" &&

            jenis !== jenisDipilih

        ) {

            return;

        }


        if (
            String(data.satuan || "").toLowerCase()
            === "liter"
        ) {

            return;

        }


        const nominal =
            Number(
                data.jumlah ??
                data.nominal ??
                0
            );


        if (
            tanggalHariIni(tanggal)
        ) {

            keluarHari += nominal;

        }


        if (

            tanggal.getMonth() + 1 === bulan &&

            tanggal.getFullYear() === tahun

        ) {

            keluarBulan += nominal;

        }


        if (
            tanggal.getFullYear() === tahun
        ) {

            keluarTahun += nominal;

        }

    });


    // ==================================
    // SALDO BULAN
    // ==================================

    const saldo =
        masukBulan -
        keluarBulan;


    // ==================================
    // TAMPILKAN
    // ==================================

    if (totalSaldoEl) {

        totalSaldoEl.textContent =
            rupiah(saldo);

    }


    if (hariIniEl) {

        hariIniEl.textContent =
            rupiah(masukHari);

    }


    if (bulanIniEl) {

        bulanIniEl.textContent =
            rupiah(masukBulan);

    }


    if (tahunIniEl) {

        tahunIniEl.textContent =
            rupiah(masukTahun);

    }


    if (pengeluaranHariIniEl) {

        pengeluaranHariIniEl.textContent =
            rupiah(keluarHari);

    }


    if (pengeluaranBulanIniEl) {

        pengeluaranBulanIniEl.textContent =
            rupiah(keluarBulan);

    }


    if (pengeluaranTahunIniEl) {

        pengeluaranTahunIniEl.textContent =
            rupiah(keluarTahun);

    }

}


// ======================================
// TABEL LAPORAN
// ======================================

function tampilkanTabelLaporan() {

    const tbody =
        document.getElementById(
            "dataPembayaran"
        );


    if (!tbody) return;


    const bulan =
        Number(
            document.getElementById(
                "bulan"
            )?.value
        );


    const tahun =
        Number(
            document.getElementById(
                "tahun"
            )?.value
        );


    const jenisDipilih =
        document.getElementById(
            "filterJenis"
        )?.value ||
        "semua";


    tbody.innerHTML = "";


    const transaksi = [];


    // ==================================
    // PEMASUKAN
    // ==================================

    semuaPembayaran.forEach(data => {

        const tanggal =
            bacaTanggal(data);


        if (!tanggal) return;


        if (

            tanggal.getMonth() + 1 !== bulan ||

            tanggal.getFullYear() !== tahun

        ) {

            return;

        }


        if (

            jenisDipilih !== "semua" &&

            data.jenis !== jenisDipilih

        ) {

            return;

        }


        const jumlah =
            Number(
                data.nominal ??
                data.jumlah ??
                0
            );


        transaksi.push({

            tanggal,

            nama:
                data.namaSantri ||
                data.nama ||
                data.santri ||
                "-",

            jenis:
                data.jenis ||
                "-",

            jumlah,

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


        if (!tanggal) return;


        if (

            tanggal.getMonth() + 1 !== bulan ||

            tanggal.getFullYear() !== tahun

        ) {

            return;

        }


        if (

            jenisDipilih !== "semua" &&

            data.jenis !== jenisDipilih

        ) {

            return;

        }


        const jumlah =
            Number(
                data.jumlah ??
                data.nominal ??
                0
            );


        transaksi.push({

            tanggal,

            nama:
                data.keterangan ||
                data.namaSantri ||
                data.nama ||
                data.santri ||
                "-",

            jenis:
                data.jenis ||
                "-",

            jumlah,

            tipe:
                "Pengeluaran"

        });

    });


    // ==================================
    // URUTKAN TERBARU
    // ==================================

    transaksi.sort(
        (a, b) =>
            b.tanggal.getTime() -
            a.tanggal.getTime()
    );


    // ==================================
    // KOSONG
    // ==================================

    if (!transaksi.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="text-center text-muted py-4">

                    Tidak ada transaksi.

                </td>

            </tr>

        `;

        return;

    }


    // ==================================
    // TAMPILKAN
    // ==================================

    transaksi.forEach(item => {

        const tr =
            document.createElement(
                "tr"
            );


        const tanggal =
            item.tanggal.toLocaleDateString(
                "id-ID"
            );


        const warna =
            item.tipe === "Pemasukan"
                ? "text-success"
                : "text-danger";


        const badge =
            item.tipe === "Pemasukan"
                ? "bg-success"
                : "bg-danger";


        tr.innerHTML = `

            <td>
                ${tanggal}
            </td>

            <td>
                ${item.nama}
            </td>

            <td>

                <span class="badge ${badge}">

                    ${item.jenis}

                </span>

            </td>

            <td class="${warna} fw-bold">

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
        satuanEl?.value ||
        "Rupiah";


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
    // CEK LOGIN
    // ==================================

    if (!auth.currentUser) {

        alert(
            "Silakan login terlebih dahulu."
        );

        return;

    }


    // ==================================
    // SIMPAN
    // ==================================

    try {

        const dataPengeluaran = {

            jenis,

            keterangan,

            tanggal,

            jumlah: nominal,

            nominal,

            satuan,

            createdAt:
                serverTimestamp()

        };


        await addDoc(

            collection(
                db,
                "expenses"
            ),

            dataPengeluaran

        );


        alert(
            "Pengeluaran berhasil disimpan!"
        );


        // ==================================
        // RESET FORM
        // ==================================

        if (jenisEl)
            jenisEl.value = "";


        if (keteranganEl)
            keteranganEl.value = "";


        if (tanggalEl)
            tanggalEl.value = "";


        if (nominalEl)
            nominalEl.value = "";


        // ==================================
        // REFRESH
        // ==================================

        await loadSemua();

    }

    catch (error) {

        console.error(
            "Gagal menyimpan pengeluaran:",
            error
        );


        alert(

            "Gagal menyimpan pengeluaran.\n\n" +

            "Kode: " +
            (error.code || "-") +

            "\n\n" +

            error.message

        );

    }

}


// ======================================
// LOAD SEMUA
// ======================================

async function loadSemua() {

    try {

        const data =
            await ambilDataFirebase();


        // ------------------------------
        // HITUNG PEMASUKAN
        // ------------------------------

        hitungPemasukan(
            data.pembayaranSnapshot
        );


        // ------------------------------
        // HITUNG PENGELUARAN
        // ------------------------------

        hitungPengeluaran(
            data.pengeluaranSnapshot
        );


        // ------------------------------
        // DASHBOARD
        // ------------------------------

        tampilkanDashboard();


        // ------------------------------
        // FILTER LAPORAN
        // ------------------------------

        isiFilter();


        // ------------------------------
        // LAPORAN
        // ------------------------------

        tampilkanLaporan();


        // ------------------------------
        // TABEL
        // ------------------------------

        tampilkanTabelLaporan();


        console.log(
            "Data berhasil dimuat:",
            {
                santri: totalSantri,
                pemasukan: totalMasuk,
                pengeluaran: totalKeluar,
                beras: stokBeras
            }
        );

    }

    catch (error) {

        console.error(
            "Gagal memuat data Firebase:",
            error
        );

    }

}


// ======================================
// EVENT APLIKASI
// ======================================

function jalankanAplikasi() {

    console.log(
        "Catatan Kas siap dijalankan."
    );

    // Muat daftar santri untuk fitur ketik otomatis nama santri
    muatDaftarSantriPilih();

    // ==================================
    // SIMPAN PEMASUKAN
    // ==================================

    const tombolSimpanMasuk = document.getElementById("simpanPemasukan");

    if (tombolSimpanMasuk) {
        tombolSimpanMasuk.addEventListener("click", simpanPemasukan);
    }


    // ==================================
    // LOAD
    // ==================================

    loadSemua();


    // ==================================
    // SIMPAN PENGELUARAN
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
    // DASHBOARD JENIS
    // ==================================

    document
        .getElementById(
            "jenisDashboard"
        )
        ?.addEventListener(
            "change",
            () => {

                const jenis =
                    document.getElementById(
                        "jenisDashboard"
                    )?.value;


                const modeDiv =
                    document.getElementById(
                        "modeBerasDiv"
                    );


                if (modeDiv) {

                    modeDiv.style.display =
                        jenis === "beras"
                            ? "block"
                            : "none";

                }


                tampilkanDashboard();

            }
        );


    // ==================================
    // DASHBOARD TAHUN
    // ==================================

    document
        .getElementById(
            "tahunDashboard"
        )
        ?.addEventListener(
            "change",
            tampilkanDashboard
        );


    // ==================================
    // MODE BERAS
    // ==================================

    document
        .getElementById(
            "modeBeras"
        )
        ?.addEventListener(
            "change",
            tampilkanDashboard
        );


    // ==================================
    // FILTER BULAN
    // ==================================

    document
        .getElementById(
            "bulan"
        )
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
        .getElementById(
            "tahun"
        )
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
        .getElementById(
            "filterJenis"
        )
        ?.addEventListener(
            "change",
            () => {

                tampilkanLaporan();

                tampilkanTabelLaporan();

            }
        );

}


// ======================================
// FIREBASE AUTH
// ======================================

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            console.log(
                "Belum login Firebase."
            );

            return;

        }


        console.log(
            "Login terdeteksi:",
            user.email
        );


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

        }

        else {

            jalankanAplikasi();

        }

    }
);

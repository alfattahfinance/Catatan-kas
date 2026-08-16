// ======================================================
// CATATAN KAS - PENGELUARAN
// VERSI PERBAIKAN WEB + APK
// FIREBASE FIRESTORE
//
// FITUR:
// - Simpan
// - Edit
// - Hapus
// - Riwayat real-time
// - Refresh dashboard
// - Firebase Auth
// - UID pengguna
// ======================================================


// ======================================================
// FIREBASE
// ======================================================

import {
    db,
    auth
} from "./firebase-config.js";


import {
    collection,
    addDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// ======================================================
// VARIABEL
// ======================================================

let userAktif = null;

let idEdit = null;

let unsubscribePengeluaran = null;

let sudahInit = false;

let authSiap = false;


// ======================================================
// HELPER
// ======================================================

const $ = (id) => {
    return document.getElementById(id);
};


// ======================================================
// FORMAT RUPIAH
// ======================================================

function rupiah(nilai) {

    const angka =
        Number(nilai) || 0;

    return (
        "Rp " +
        angka.toLocaleString("id-ID")
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function amanHTML(teks) {

    return String(teks ?? "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ======================================================
// AMBIL KETERANGAN
// ======================================================

function ambilKeterangan() {

    const element =

        $("keteranganPengeluaran") ||

        $("keterangan") ||

        $("namaPengeluaran") ||

        $("nama") ||

        $("deskripsi");


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


// ======================================================
// AMBIL JENIS
// ======================================================

function ambilJenis() {

    const element =

        $("jenisPengeluaran") ||

        $("jenis") ||

        $("kategoriPengeluaran") ||

        $("kategori");


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


// ======================================================
// AMBIL NOMINAL
// ======================================================

function ambilNominal() {

    const element =

        $("nominalPengeluaran") ||

        $("nominal") ||

        $("jumlah") ||

        $("total");


    if (!element) {

        return 0;

    }


    let nilai =
        element.value;


    if (
        typeof nilai ===
        "string"
    ) {

        nilai =

            nilai
                .replace(
                    /Rp/gi,
                    ""
                )
                .replace(
                    /\s/g,
                    ""
                )
                .replace(
                    /\./g,
                    ""
                )
                .replace(
                    /,/g,
                    "");

    }


    const angka =
        Number(nilai);


    if (
        !Number.isFinite(
            angka
        )
    ) {

        return 0;

    }


    return angka;

}


// ======================================================
// AMBIL TANGGAL
// ======================================================

function ambilTanggal() {

    const element =

        $("tanggalPengeluaran") ||

        $("tanggal") ||

        $("tglPengeluaran");


    if (
        !element ||
        !element.value
    ) {

        return null;

    }


    return String(
        element.value
    );

}


// ======================================================
// TOMBOL SIMPAN
// ======================================================

function tombolSimpan() {

    return (

        $("btnSimpanPengeluaran") ||

        $("simpanPengeluaran") ||

        document.querySelector(
            "button[onclick*='simpanPengeluaran']"
        )

    );

}


// ======================================================
// REFRESH DASHBOARD
// ======================================================

function refreshDashboard() {

    const waktu =
        Date.now();


    try {

        localStorage.setItem(
            "catatanKasDataBerubah",
            String(waktu)
        );

    }

    catch (error) {

        console.warn(
            "LocalStorage tidak tersedia:",
            error
        );

    }


    try {

        window.dispatchEvent(
            new CustomEvent(
                "dataKeuanganBerubah",
                {
                    detail: {
                        tipe:
                            "pengeluaran",
                        waktu:
                            waktu
                    }
                }
            )
        );


        window.dispatchEvent(
            new Event(
                "refreshDashboard"
            )
        );

    }

    catch (error) {

        console.warn(
            "Event refresh gagal:",
            error
        );

    }

}


// ======================================================
// CEK LOGIN
// ======================================================

function cekLogin() {

    if (!authSiap) {

        alert(
            "Firebase Auth belum siap. Tunggu sebentar lalu coba lagi."
        );

        return false;

    }


    if (!userAktif) {

        alert(
            "Anda belum login.\n\nSilakan login terlebih dahulu."
        );

        return false;

    }


    return true;

}


// ======================================================
// SIMPAN PENGELUARAN
// ======================================================

window.simpanPengeluaran =
    async function () {

        console.log(
            "================================"
        );

        console.log(
            "MULAI SIMPAN PENGELUARAN"
        );

        console.log(
            "USER:",
            userAktif
                ? userAktif.uid
                : "TIDAK LOGIN"
        );


        // --------------------------------------------------
        // CEK LOGIN
        // --------------------------------------------------

        if (!cekLogin()) {

            return;

        }


        // --------------------------------------------------
        // AMBIL DATA
        // --------------------------------------------------

        const keterangan =
            ambilKeterangan();

        const jenis =
            ambilJenis();

        const nominal =
            ambilNominal();

        const tanggal =
            ambilTanggal();


        console.log(
            "Keterangan:",
            keterangan
        );

        console.log(
            "Jenis:",
            jenis
        );

        console.log(
            "Nominal:",
            nominal
        );

        console.log(
            "Tanggal:",
            tanggal
        );


        // --------------------------------------------------
        // VALIDASI
        // --------------------------------------------------

        if (!keterangan) {

            alert(
                "Keterangan pengeluaran belum diisi."
            );

            return;

        }


        if (!jenis) {

            alert(
                "Jenis pengeluaran belum dipilih."
            );

            return;

        }


        if (
            !nominal ||
            nominal <= 0
        ) {

            alert(
                "Nominal pengeluaran belum benar."
            );

            return;

        }


        const tombol =
            tombolSimpan();


        try {

            // ------------------------------------------------
            // LOCK TOMBOL
            // ------------------------------------------------

            if (tombol) {

                tombol.disabled =
                    true;

                tombol.dataset.text =
                    tombol.innerHTML;

                tombol.innerHTML =
                    "⏳ Menyimpan...";

            }


            // =================================================
            // EDIT DATA
            // =================================================

            if (idEdit) {

                console.log(
                    "UPDATE EXPENSE:",
                    idEdit
                );


                const ref =
                    doc(
                        db,
                        "expenses",
                        idEdit
                    );


                await updateDoc(
                    ref,
                    {

                        keterangan:
                            keterangan,

                        nama:
                            keterangan,

                        deskripsi:
                            keterangan,

                        jenis:
                            jenis,

                        kategori:
                            jenis,

                        nominal:
                            nominal,

                        jumlah:
                            nominal,

                        total:
                            nominal,

                        satuan:
                            "Rupiah",

                        tanggal:
                            tanggal || null,

                        updatedAt:
                            serverTimestamp()

                    }
                );


                console.log(
                    "PENGELUARAN BERHASIL DIUPDATE"
                );


                alert(
                    "Pengeluaran berhasil diperbarui."
                );

            }


            // =================================================
            // DATA BARU
            // =================================================

            else {

                console.log(
                    "ADD EXPENSE"
                );


                const dataPengeluaran = {

                    keterangan:
                        keterangan,

                    nama:
                        keterangan,

                    deskripsi:
                        keterangan,

                    jenis:
                        jenis,

                    kategori:
                        jenis,

                    nominal:
                        nominal,

                    jumlah:
                        nominal,

                    total:
                        nominal,

                    satuan:
                        "Rupiah",

                    tanggal:
                        tanggal || null,

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp(),

                    uid:
                        userAktif.uid,

                    userId:
                        userAktif.uid

                };


                console.log(
                    "DATA FIRESTORE:",
                    dataPengeluaran
                );


                const hasil =
                    await addDoc(

                        collection(
                            db,
                            "expenses"
                        ),

                        dataPengeluaran

                    );


                console.log(
                    "PENGELUARAN TERSIMPAN:",
                    hasil.id
                );


                alert(
                    "Pengeluaran berhasil disimpan."
                );

            }


            // ------------------------------------------------
            // RESET
            // ------------------------------------------------

            kosongkanForm();


            idEdit =
                null;


            refreshDashboard();

        }

        catch (error) {

            console.error(
                "================================"
            );

            console.error(
                "GAGAL SIMPAN PENGELUARAN"
            );

            console.error(
                "CODE:",
                error.code
            );

            console.error(
                "MESSAGE:",
                error.message
            );

            console.error(
                error
            );


            let pesan =
                error.message ||
                String(error);


            // ----------------------------------------------
            // PESAN KHUSUS FIRESTORE
            // ----------------------------------------------

            if (
                error.code ===
                "permission-denied"
            ) {

                pesan =
                    "Firestore menolak akses.\n\n" +
                    "Kemungkinan Firebase Rules masih mengharuskan login.";

            }


            if (
                error.code ===
                "unauthenticated"
            ) {

                pesan =
                    "Login Firebase tidak terdeteksi.\n\n" +
                    "Silakan login kembali.";

            }


            if (
                error.code ===
                "failed-precondition"
            ) {

                pesan =
                    "Firestore belum siap atau konfigurasi Firebase bermasalah.";

            }


            alert(
                "Gagal menyimpan pengeluaran.\n\n" +
                pesan
            );

        }

        finally {

            if (tombol) {

                tombol.disabled =
                    false;


                tombol.innerHTML =
                    idEdit
                        ? "✓ Simpan Perubahan"
                        : "Simpan Pengeluaran";

            }

        }

    };


// ======================================================
// MUAT RIWAYAT PENGELUARAN
// ======================================================

function muatPengeluaran() {

    const container =

        $("daftarPengeluaran") ||

        $("riwayatPengeluaran") ||

        $("listPengeluaran") ||

        $("riwayat");


    if (!container) {

        console.warn(
            "Container pengeluaran tidak ditemukan."
        );

        return;

    }


    // --------------------------------------------------
    // HENTIKAN LISTENER LAMA
    // --------------------------------------------------

    if (
        unsubscribePengeluaran
    ) {

        unsubscribePengeluaran();

        unsubscribePengeluaran =
            null;

    }


    container.innerHTML = `

        <div class="text-center text-muted p-4">

            <div class="spinner-border spinner-border-sm"></div>

            <div class="mt-2">
                Memuat riwayat pengeluaran...
            </div>

        </div>

    `;


    // --------------------------------------------------
    // REAL-TIME FIRESTORE
    // --------------------------------------------------

    unsubscribePengeluaran =
        onSnapshot(

            collection(
                db,
                "expenses"
            ),

            function (snapshot) {

                const data =
                    [];


                snapshot.forEach(
                    function (item) {

                        data.push({

                            id:
                                item.id,

                            ...item.data()

                        });

                    }
                );


                // ------------------------------------------
                // SORT TERBARU
                // ------------------------------------------

                data.sort(
                    function (
                        a,
                        b
                    ) {

                        return (
                            waktuData(b) -
                            waktuData(a)
                        );

                    }
                );


                // ------------------------------------------
                // KOSONG
                // ------------------------------------------

                if (!data.length) {

                    container.innerHTML = `

                        <div class="text-center text-muted p-4">

                            <i class="bi bi-wallet2 fs-1"></i>

                            <div class="mt-2">
                                Belum ada pengeluaran.
                            </div>

                        </div>

                    `;

                    return;

                }


                // ------------------------------------------
                // RENDER
                // ------------------------------------------

                container.innerHTML =
                    "";


                data.forEach(
                    function (item) {

                        const keterangan =

                            item.keterangan ||

                            item.nama ||

                            item.deskripsi ||

                            "-";


                        const jenis =

                            item.jenis ||

                            item.kategori ||

                            "-";


                        const nominal =

                            Number(
                                item.nominal ??
                                item.jumlah ??
                                item.total ??
                                0
                            );


                        const tanggal =
                            formatTanggal(
                                item.tanggal ||
                                item.createdAt
                            );


                        const card =
                            document.createElement(
                                "div"
                            );


                        card.className =
                            "card mb-2";


                        card.innerHTML = `

                            <div class="card-body">

                                <div
                                    class="
                                        d-flex
                                        justify-content-between
                                        align-items-start
                                        gap-2
                                    "
                                >

                                    <div>

                                        <div class="fw-bold">

                                            ${amanHTML(
                                                keterangan
                                            )}

                                        </div>


                                        <div class="text-muted small">

                                            ${amanHTML(
                                                jenis
                                            )}

                                        </div>


                                        ${
                                            tanggal
                                                ? `
                                                    <div class="text-muted small mt-1">

                                                        <i class="bi bi-calendar3"></i>

                                                        ${amanHTML(
                                                            tanggal
                                                        )}

                                                    </div>
                                                  `
                                                : ""
                                        }

                                    </div>


                                    <div
                                        class="
                                            fw-bold
                                            text-danger
                                        "
                                    >

                                        - ${rupiah(
                                            nominal
                                        )}

                                    </div>

                                </div>


                                <div
                                    class="
                                        d-flex
                                        gap-2
                                        mt-3
                                    "
                                >

                                    <button
                                        type="button"
                                        class="
                                            btn
                                            btn-sm
                                            btn-outline-primary
                                            flex-fill
                                        "
                                        data-action="edit"
                                        data-id="${amanHTML(
                                            item.id
                                        )}"
                                    >

                                        <i class="bi bi-pencil"></i>

                                        Edit

                                    </button>


                                    <button
                                        type="button"
                                        class="
                                            btn
                                            btn-sm
                                            btn-outline-danger
                                            flex-fill
                                        "
                                        data-action="delete"
                                        data-id="${amanHTML(
                                            item.id
                                        )}"
                                    >

                                        <i class="bi bi-trash"></i>

                                        Hapus

                                    </button>

                                </div>

                            </div>

                        `;


                        container.appendChild(
                            card
                        );

                    }
                );

            },

            function (error) {

                console.error(
                    "Gagal membaca expenses:",
                    error
                );


                container.innerHTML = `

                    <div class="alert alert-danger">

                        <strong>
                            Gagal memuat riwayat pengeluaran.
                        </strong>

                        <div class="small mt-2">

                            ${amanHTML(
                                error.message ||
                                error
                            )}

                        </div>

                    </div>

                `;

            }

        );

}


// ======================================================
// WAKTU DATA
// ======================================================

function waktuData(data) {

    if (

        data.createdAt &&

        typeof data.createdAt.toDate ===
        "function"

    ) {

        return data.createdAt
            .toDate()
            .getTime();

    }


    if (

        data.updatedAt &&

        typeof data.updatedAt.toDate ===
        "function"

    ) {

        return data.updatedAt
            .toDate()
            .getTime();

    }


    if (data.tanggal) {

        const waktu =
            new Date(
                data.tanggal
            ).getTime();


        if (
            !Number.isNaN(
                waktu
            )
        ) {

            return waktu;

        }

    }


    return 0;

}


// ======================================================
// FORMAT TANGGAL
// ======================================================

function formatTanggal(nilai) {

    if (!nilai) {

        return "";

    }


    if (

        typeof nilai.toDate ===
        "function

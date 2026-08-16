// ======================================================
// CATATAN KAS - PEMBAYARAN
// FINAL - WEB + APK
// Firebase Firestore
// Simpan + Riwayat Real-time + Edit + Hapus + Refresh
// ======================================================

import { db, auth } from "../firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
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
let unsubscribePembayaran = null;

const $ = (id) => document.getElementById(id);


// ======================================================
// FORMAT RUPIAH
// ======================================================

function rupiah(nilai) {

    const angka = Number(nilai) || 0;

    return "Rp " + angka.toLocaleString("id-ID");

}


// ======================================================
// ESCAPE HTML
// ======================================================

function amanHTML(teks) {

    return String(teks ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// AMBIL INPUT NAMA
// ======================================================

function ambilNama() {

    const element =
        $("namaSantriPemasukan") ||
        $("namaSantri") ||
        $("santri") ||
        $("nama") ||
        $("keterangan");

    return element
        ? String(element.value || "").trim()
        : "";

}


// ======================================================
// AMBIL JENIS
// ======================================================

function ambilJenis() {

    const element =
        $("jenis") ||
        $("jenisPembayaran") ||
        $("kategori");

    return element
        ? String(element.value || "").trim()
        : "";

}


// ======================================================
// AMBIL NOMINAL
// ======================================================

function ambilNominal() {

    const element =
        $("nominal") ||
        $("nominalPembayaran") ||
        $("jumlah");

    if (!element) {
        return 0;
    }

    let nilai = element.value;

    if (typeof nilai === "string") {

        nilai = nilai
            .replace(/Rp/gi, "")
            .replace(/\s/g, "")
            .replace(/\./g, "")
            .replace(/,/g, "");

    }

    const angka = Number(nilai);

    return Number.isFinite(angka)
        ? angka
        : 0;

}


// ======================================================
// AMBIL TANGGAL
// ======================================================

function ambilTanggal() {

    const element =
        $("tanggalPembayaran") ||
        $("tanggal") ||
        $("tglPembayaran");

    if (!element || !element.value) {
        return null;
    }

    return element.value;

}


// ======================================================
// TOMBOL
// ======================================================

function tombolSimpan() {

    return (
        $("btnSimpanPembayaran") ||
        document.querySelector(
            "button[onclick*='simpanPembayaran']"
        )
    );

}


// ======================================================
// EVENT UNTUK DASHBOARD
// ======================================================

function refreshDashboard() {

    try {

        const waktu = Date.now();

        localStorage.setItem(
            "catatanKasDataBerubah",
            String(waktu)
        );

    } catch (error) {

        console.warn(
            "LocalStorage tidak tersedia:",
            error
        );

    }

    window.dispatchEvent(
        new CustomEvent(
            "dataKeuanganBerubah",
            {
                detail: {
                    tipe: "pembayaran",
                    waktu: Date.now()
                }
            }
        )
    );

    window.dispatchEvent(
        new Event("refreshDashboard")
    );

}


// ======================================================
// SIMPAN PEMBAYARAN
// ======================================================

window.simpanPembayaran = async function () {

    console.log(
        "=== MULAI SIMPAN PEMBAYARAN ==="
    );

    const nama =
        ambilNama();

    const jenis =
        ambilJenis();

    const nominal =
        ambilNominal();

    const tanggal =
        ambilTanggal();

    console.log("Nama:", nama);
    console.log("Jenis:", jenis);
    console.log("Nominal:", nominal);
    console.log("Tanggal:", tanggal);
    console.log("User:", userAktif);


    // --------------------------------------------------
    // VALIDASI
    // --------------------------------------------------

    if (!nama) {

        alert(
            "Nama santri / keterangan belum diisi."
        );

        return;

    }

    if (!jenis) {

        alert(
            "Jenis pembayaran belum dipilih."
        );

        return;

    }

    if (!nominal || nominal <= 0) {

        alert(
            "Nominal pembayaran belum benar."
        );

        return;

    }


    const tombol =
        tombolSimpan();


    try {

        if (tombol) {

            tombol.disabled = true;

            tombol.dataset.text =
                tombol.innerHTML;

            tombol.innerHTML =
                "⏳ Menyimpan...";

        }


        // ------------------------------------------------
        // DATA FIRESTORE
        // ------------------------------------------------

        const dataPembayaran = {

            nama:
                nama,

            namaSantri:
                nama,

            nama_santri:
                nama,

            keterangan:
                nama,

            jenis:
                jenis,

            kategori:
                jenis,

            nominal:
                nominal,

            jumlah:
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
                userAktif
                    ? userAktif.uid
                    : null

        };


        // ------------------------------------------------
        // EDIT
        // ------------------------------------------------

        if (idEdit) {

            await updateDoc(

                doc(
                    db,
                    "payments",
                    idEdit
                ),

                {

                    nama:
                        nama,

                    namaSantri:
                        nama,

                    nama_santri:
                        nama,

                    keterangan:
                        nama,

                    jenis:
                        jenis,

                    kategori:
                        jenis,

                    nominal:
                        nominal,

                    jumlah:
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
                "PEMBAYARAN DIUPDATE:",
                idEdit
            );

            alert(
                "Pembayaran berhasil diperbarui."
            );

        }


        // ------------------------------------------------
        // DATA BARU
        // ------------------------------------------------

        else {

            const hasil =
                await addDoc(

                    collection(
                        db,
                        "payments"
                    ),

                    dataPembayaran

                );

            console.log(
                "PEMBAYARAN TERSIMPAN:",
                hasil.id
            );

            alert(
                "Pembayaran berhasil disimpan."
            );

        }


        // ------------------------------------------------
        // RESET
        // ------------------------------------------------

        kosongkanForm();

        idEdit = null;

        refreshDashboard();

    }

    catch (error) {

        console.error(
            "GAGAL SIMPAN PEMBAYARAN:",
            error
        );

        alert(
            "Gagal menyimpan pembayaran.\n\n" +
            (error.message || error)
        );

    }

    finally {

        if (tombol) {

            tombol.disabled = false;

            tombol.innerHTML =
                tombol.dataset.text ||
                "Simpan Pembayaran";

        }

    }

};


// ======================================================
// MUAT RIWAYAT REAL-TIME
// ======================================================

function muatPembayaran() {

    const container =
        $("daftarPembayaran") ||
        $("riwayatPembayaran") ||
        $("listPembayaran") ||
        $("riwayat");


    if (!container) {

        console.warn(
            "Container riwayat pembayaran tidak ditemukan."
        );

        return;

    }


    // Hentikan listener sebelumnya
    if (unsubscribePembayaran) {

        unsubscribePembayaran();

        unsubscribePembayaran =
            null;

    }


    container.innerHTML = `

        <div class="text-center text-muted p-4">

            <div class="spinner-border spinner-border-sm"></div>

            <div class="mt-2">
                Memuat riwayat pembayaran...
            </div>

        </div>

    `;


    unsubscribePembayaran =
        onSnapshot(

            collection(
                db,
                "payments"
            ),

            function (snapshot) {

                const data = [];


                snapshot.forEach(
                    function (item) {

                        data.push({

                            id:
                                item.id,

                            ...item.data()

                        });

                    }
                );


                // ----------------------------------------
                // SORT TERBARU
                // ----------------------------------------

                data.sort(
                    function (a, b) {

                        const waktuA =
                            waktuData(a);

                        const waktuB =
                            waktuData(b);

                        return (
                            waktuB -
                            waktuA
                        );

                    }
                );


                // ----------------------------------------
                // KOSONG
                // ----------------------------------------

                if (!data.length) {

                    container.innerHTML = `

                        <div class="text-center text-muted p-4">

                            <i class="bi bi-receipt fs-1"></i>

                            <div class="mt-2">
                                Belum ada pembayaran.
                            </div>

                        </div>

                    `;

                    return;

                }


                // ----------------------------------------
                // RENDER
                // ----------------------------------------

                container.innerHTML = "";


                data.forEach(
                    function (item) {

                        const nama =
                            item.namaSantri ||
                            item.nama_santri ||
                            item.nama ||
                            item.keterangan ||
                            "-";


                        const jenis =
                            item.jenis ||
                            item.kategori ||
                            "-";


                        const nominal =
                            Number(
                                item.nominal ??
                                item.jumlah ??
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
                                    class="d-flex
                                    justify-content-between
                                    align-items-start
                                    gap-2"
                                >

                                    <div>

                                        <div class="fw-bold">

                                            ${amanHTML(nama)}

                                        </div>

                                        <div class="text-muted small">

                                            ${amanHTML(jenis)}

                                        </div>

                                        ${
                                            tanggal
                                            ? `
                                            <div class="text-muted small mt-1">
                                                <i class="bi bi-calendar3"></i>
                                                ${amanHTML(tanggal)}
                                            </div>
                                            `
                                            : ""
                                        }

                                    </div>


                                    <div
                                        class="fw-bold text-success"
                                    >

                                        + ${rupiah(nominal)}

                                    </div>

                                </div>


                                <div
                                    class="d-flex
                                    gap-2
                                    mt-3"
                                >

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-primary"
                                        data-action="edit"
                                        data-id="${item.id}"
                                    >

                                        <i class="bi bi-pencil"></i>
                                        Edit

                                    </button>


                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-danger"
                                        data-action="delete"
                                        data-id="${item.id}"
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
                    "Gagal memuat payments:",
                    error
                );

                container.innerHTML = `

                    <div class="alert alert-danger">

                        Gagal memuat riwayat pembayaran.

                        <div class="small mt-2">
                            ${amanHTML(error.message || error)}
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
        typeof data.createdAt.toDate === "function"
    ) {

        return data.createdAt
            .toDate()
            .getTime();

    }


    if (
        data.updatedAt &&
        typeof data.updatedAt.toDate === "function"
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

        if (!Number.isNaN(waktu)) {

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
        nilai &&
        typeof nilai.toDate === "function"
    ) {

        return nilai
            .toDate()
            .toLocaleDateString(
                "id-ID"
            );

    }


    const tanggal =
        new Date(nilai);


    if (
        Number.isNaN(
            tanggal.getTime()
        )
    ) {

        return String(nilai);

    }


    return tanggal.toLocaleDateString(
        "id-ID"
    );

}


// ======================================================
// EDIT PEMBAYARAN
// ======================================================

window.editPembayaran = async function (id) {

    try {

        const ref =
            doc(
                db,
                "payments",
                id
            );


        const snapshot =
            await getDoc(ref);


        if (!snapshot.exists()) {

            alert(
                "Data pembayaran tidak ditemukan."
            );

            return;

        }


        const data =
            snapshot.data();


        idEdit =
            id;


        const nama =
            $("namaSantriPemasukan") ||
            $("namaSantri") ||
            $("santri") ||
            $("nama") ||
            $("keterangan");


        const jenis =
            $("jenis") ||
            $("jenisPembayaran") ||
            $("kategori");


        const nominal =
            $("nominal") ||
            $("nominalPembayaran") ||
            $("jumlah");


        const tanggal =
            $("tanggalPembayaran") ||
            $("tanggal") ||
            $("tglPembayaran");


        if (nama) {

            nama.value =
                data.namaSantri ||
                data.nama_santri ||
                data.nama ||
                data.keterangan ||
                "";

        }


        if (jenis) {

            jenis.value =
                data.jenis ||
                data.kategori ||
                "";

        }


        if (nominal) {

            nominal.value =
                data.nominal ??
                data.jumlah ??
                "";

        }


        if (
            tanggal &&
            typeof data.tanggal === "string"
        ) {

            tanggal.value =
                data.tanggal;

        }


        const tombol =
            tombolSimpan();


        if (tombol) {

            tombol.innerHTML =
                "✓ Simpan Perubahan";

        }


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }

    catch (error) {

        console.error(
            "Gagal edit pembayaran:",
            error
        );

        alert(
            "Gagal mengambil data pembayaran.\n\n" +
            (error.message || error)
        );

    }

};


// ======================================================
// HAPUS PEMBAYARAN
// ======================================================

window.hapusPembayaran = async function (id) {

    if (
        !confirm(
            "Yakin ingin menghapus pembayaran ini?"
        )
    ) {

        return;

    }


    try {

        await deleteDoc(

            doc(
                db,
                "payments",
                id
            )

        );


        console.log(
            "PEMBAYARAN DIHAPUS:",
            id
        );


        alert(
            "Pembayaran berhasil dihapus."
        );


        refreshDashboard();

    }

    catch (error) {

        console.error(
            "Gagal menghapus pembayaran:",
            error
        );

        alert(
            "Gagal menghapus pembayaran.\n\n" +
            (error.message || error)
        );

    }

};


// ======================================================
// RESET FORM
// ======================================================

function kosongkanForm() {

    idEdit = null;


    const nama =
        $("namaSantriPemasukan") ||
        $("namaSantri") ||
        $("santri") ||
        $("nama") ||
        $("keterangan");


    const jenis =
        $("jenis") ||
        $("jenisPembayaran") ||
        $("kategori");


    const nominal =
        $("nominal") ||
        $("nominalPembayaran") ||
        $("jumlah");


    const tanggal =
        $("tanggalPembayaran") ||
        $("tanggal") ||
        $("tglPembayaran");


    if (nama) {

        nama.value = "";

    }


    if (jenis) {

        jenis.value = "";

    }


    if (nominal) {

        nominal.value = "";

    }


    if (tanggal) {

        tanggal.value = "";

    }


    const tombol =
        tombolSimpan();


    if (tombol) {

        tombol.innerHTML =
            "Simpan Pembayaran";

    }

}


// ======================================================
// PILIH PEMBAYARAN
// ======================================================

window.pilihPembayaran = function () {

    const jenis =
        $("jenis");

    const nominal =
        $("nominal");


    if (!jenis || !nominal) {

        return;

    }


    if (
        jenis.value === "SPP"
    ) {

        nominal.value =
            "50000";

    }

    else if (
        jenis.value === "Syahriyyah"
    ) {

        nominal.value =
            "80000";

    }

    else if (
        jenis.value === "Kas"
    ) {

        nominal.value =
            "30000";

    }

};


// ======================================================
// EVENT RIWAYAT
// ======================================================

document.addEventListener(
    "click",
    function (event) {

        const tombol =
            event.target.closest(
                "[data-action]"
            );


        if (!tombol) {

            return;

        }


        const action =
            tombol.dataset.action;


        const id =
            tombol.dataset.id;


        if (!id) {

            return;

        }


        if (
            action === "edit"
        ) {

            window.editPembayaran(
                id
            );

        }


        if (
            action === "delete"
        ) {

            window.hapusPembayaran(
                id
            );

        }

    }
);


// ======================================================
// TOMBOL SIMPAN
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const tombol =
            tombolSimpan();


        if (tombol) {

            tombol.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.simpanPembayaran();

                }
            );

        }


        // Muat langsung.
        // TIDAK MENUNGGU LOGIN.

        muatPembayaran();


        console.log(
            "Catatan Kas: pembayaran.js aktif."
        );

    }
);


// ======================================================
// AUTH
// HANYA UNTUK MENYIMPAN UID.
// BUKAN SYARAT FIRESTORE.
// ======================================================

try {

    onAuthStateChanged(
        auth,
        function (user) {

            userAktif =
                user || null;

            console.log(
                "PEMBAYARAN - USER:",
                user
                    ? user.uid
                    : "TIDAK LOGIN"
            );

        }
    );

}

catch (error) {

    console.warn(
        "Auth tidak tersedia:",
        error
    );

}


// ======================================================
// REFRESH SAAT DATA BERUBAH
// ======================================================

window.addEventListener(
    "dataKeuanganBerubah",
    function () {

        console.log(
            "Pembayaran: data keuangan berubah."
        );

    }
);

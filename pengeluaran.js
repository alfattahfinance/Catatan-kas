// ======================================================
// CATATAN KAS - PENGELUARAN
// VERSI PERBAIKAN
// FIREBASE FIRESTORE
//
// FITUR:
// - Simpan pengeluaran
// - Edit
// - Hapus
// - Riwayat realtime
// - Firebase Auth
// - Refresh dashboard
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


// ======================================================
// HELPER
// ======================================================

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
// AMBIL KETERANGAN
// ======================================================

function ambilKeterangan() {

    const el =
        $("keteranganPengeluaran") ||
        $("keterangan") ||
        $("namaPengeluaran") ||
        $("nama") ||
        $("deskripsi");

    return el
        ? String(el.value || "").trim()
        : "";

}


// ======================================================
// AMBIL JENIS
// ======================================================

function ambilJenis() {

    const el =
        $("jenisPengeluaran") ||
        $("jenis") ||
        $("kategoriPengeluaran") ||
        $("kategori");

    return el
        ? String(el.value || "").trim()
        : "";

}


// ======================================================
// AMBIL NOMINAL
// ======================================================

function ambilNominal() {

    const el =
        $("nominalPengeluaran") ||
        $("nominal") ||
        $("jumlah") ||
        $("total");

    if (!el) {
        return 0;
    }

    let nilai = el.value;

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

    const el =
        $("tanggalPengeluaran") ||
        $("tanggal") ||
        $("tglPengeluaran");

    if (!el || !el.value) {
        return null;
    }

    return String(el.value);

}


// ======================================================
// AMBIL SATUAN
// ======================================================

function ambilSatuan() {

    const el =
        $("satuanPengeluaran") ||
        $("satuan");

    return el
        ? String(el.value || "Rupiah")
        : "Rupiah";

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
// RESET FORM
// ======================================================

function kosongkanForm() {

    const ids = [
        "keteranganPengeluaran",
        "keterangan",
        "namaPengeluaran",
        "nama",
        "deskripsi",
        "nominalPengeluaran",
        "nominal",
        "jumlah",
        "total"
    ];

    ids.forEach(id => {

        const el = $(id);

        if (el) {
            el.value = "";
        }

    });

    const tanggal =
        $("tanggalPengeluaran") ||
        $("tanggal") ||
        $("tglPengeluaran");

    if (tanggal) {

        const sekarang =
            new Date();

        const yyyy =
            sekarang.getFullYear();

        const mm =
            String(
                sekarang.getMonth() + 1
            ).padStart(2, "0");

        const dd =
            String(
                sekarang.getDate()
            ).padStart(2, "0");

        tanggal.value =
            `${yyyy}-${mm}-${dd}`;

    }

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

    if (data.tanggal) {

        const waktu =
            new Date(
                data.tanggal + "T00:00:00"
            ).getTime();

        if (!Number.isNaN(waktu)) {
            return waktu;
        }

    }

    if (
        data.updatedAt &&
        typeof data.updatedAt.toDate === "function"
    ) {

        return data.updatedAt
            .toDate()
            .getTime();

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
        typeof nilai.toDate === "function"
    ) {

        return nilai
            .toDate()
            .toLocaleDateString("id-ID");

    }

    const teks =
        String(nilai);

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(teks)
    ) {

        const [tahun, bulan, hari] =
            teks.split("-");

        return `${hari}/${bulan}/${tahun}`;

    }

    const tanggal =
        new Date(teks);

    if (
        Number.isNaN(
            tanggal.getTime()
        )
    ) {

        return teks;

    }

    return tanggal
        .toLocaleDateString("id-ID");

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

    } catch (error) {

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
                        tipe: "pengeluaran",
                        waktu: waktu
                    }
                }
            )
        );

        window.dispatchEvent(
            new Event(
                "refreshDashboard"
            )
        );

    } catch (error) {

        console.warn(
            "Refresh dashboard gagal:",
            error
        );

    }

}


// ======================================================
// SIMPAN PENGELUARAN
// ======================================================

window.simpanPengeluaran =
    async function () {

        if (!userAktif) {

            alert(
                "Anda belum login ke Firebase.\n\n" +
                "Silakan login terlebih dahulu."
            );

            return;

        }

        const keterangan =
            ambilKeterangan();

        const jenis =
            ambilJenis();

        const nominal =
            ambilNominal();

        const tanggal =
            ambilTanggal();

        const satuan =
            ambilSatuan();


        // -----------------------------------------------
        // VALIDASI
        // -----------------------------------------------

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

            if (tombol) {

                tombol.disabled = true;

                tombol.innerHTML =
                    "⏳ Menyimpan...";

            }


            // =========================================
            // EDIT
            // =========================================

            if (idEdit) {

                await updateDoc(

                    doc(
                        db,
                        "expenses",
                        idEdit
                    ),

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
                            satuan,

                        tanggal:
                            tanggal || null,

                        updatedAt:
                            serverTimestamp()

                    }

                );

                alert(
                    "Pengeluaran berhasil diperbarui."
                );

            }


            // =========================================
            // DATA BARU
            // =========================================

            else {

                const data = {

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
                        satuan,

                    tanggal:
                        tanggal || null,

                    uid:
                        userAktif.uid,

                    userId:
                        userAktif.uid,

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                };


                const hasil =
                    await addDoc(

                        collection(
                            db,
                            "expenses"
                        ),

                        data

                    );


                console.log(
                    "Pengeluaran tersimpan:",
                    hasil.id
                );


                alert(
                    "Pengeluaran berhasil disimpan."
                );

            }


            idEdit = null;

            kosongkanForm();

            refreshDashboard();

        }

        catch (error) {

            console.error(
                "Gagal menyimpan pengeluaran:",
                error
            );

            let pesan =
                error.message ||
                String(error);

            if (
                error.code ===
                "permission-denied"
            ) {

                pesan =
                    "Firestore menolak akses.\n\n" +
                    "Periksa Firebase Rules dan pastikan akun sudah login.";

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
                        ? "Simpan Perubahan"
                        : "Simpan Pengeluaran";

            }

        }

    };


// ======================================================
// EDIT PENGELUARAN
// ======================================================

window.editPengeluaran =
    async function (id) {

        try {

            const snapshot =
                await getDoc(
                    doc(
                        db,
                        "expenses",
                        id
                    )
                );

            if (
                !snapshot.exists()
            ) {

                alert(
                    "Data pengeluaran tidak ditemukan."
                );

                return;

            }

            const data =
                snapshot.data();

            idEdit =
                id;


            const keterangan =
                $("keteranganPengeluaran") ||
                $("keterangan") ||
                $("namaPengeluaran") ||
                $("nama") ||
                $("deskripsi");

            if (keterangan) {

                keterangan.value =
                    data.keterangan ||
                    data.nama ||
                    data.deskripsi ||
                    "";

            }


            const jenis =
                $("jenisPengeluaran") ||
                $("jenis") ||
                $("kategoriPengeluaran") ||
                $("kategori");

            if (jenis) {

                jenis.value =
                    data.jenis ||
                    data.kategori ||
                    "";

            }


            const nominal =
                $("nominalPengeluaran") ||
                $("nominal") ||
                $("jumlah") ||
                $("total");

            if (nominal) {

                nominal.value =
                    data.nominal ??
                    data.jumlah ??
                    data.total ??
                    "";

            }


            const tanggal =
                $("tanggalPengeluaran") ||
                $("tanggal") ||
                $("tglPengeluaran");

            if (tanggal) {

                tanggal.value =
                    data.tanggal || "";

            }


            const satuan =
                $("satuanPengeluaran") ||
                $("satuan");

            if (satuan) {

                satuan.value =
                    data.satuan ||
                    "Rupiah";

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
                "Gagal mengambil data:",
                error
            );

            alert(
                "Gagal membuka data pengeluaran.\n\n" +
                error.message
            );

        }

    };


// ======================================================
// HAPUS PENGELUARAN
// ======================================================

window.hapusPengeluaran =
    async function (id) {

        if (!id) {
            return;
        }

        const yakin =
            confirm(
                "Apakah pengeluaran ini benar-benar ingin dihapus?"
            );

        if (!yakin) {
            return;
        }

        try {

            await deleteDoc(
                doc(
                    db,
                    "expenses",
                    id
                )
            );

            alert(
                "Pengeluaran berhasil dihapus."
            );

            refreshDashboard();

        }

        catch (error) {

            console.error(
                "Gagal menghapus:",
                error
            );

            alert(
                "Gagal menghapus pengeluaran.\n\n" +
                error.message
            );

        }

    };


// ======================================================
// MUAT RIWAYAT
// ======================================================

function muatPengeluaran() {

    const container =
        $("daftarPengeluaran") ||
        $("riwayatPengeluaran") ||
        $("listPengeluaran") ||
        $("riwayat");

    if (!container) {

        console.warn(
            "Container riwayat pengeluaran tidak ditemukan."
        );

        return;

    }


    if (unsubscribePengeluaran) {

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


    unsubscribePengeluaran =
        onSnapshot(

            collection(
                db,
                "expenses"
            ),

            function (snapshot) {

                const data = [];


                snapshot.forEach(
                    item => {

                        data.push({

                            id:
                                item.id,

                            ...item.data()

                        });

                    }
                );


                data.sort(
                    (a, b) =>
                        waktuData(b) -
                        waktuData(a)
                );


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


                container.innerHTML = "";


                data.forEach(
                    item => {

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
                            "list-group-item";


                        card.innerHTML = `

                            <div class="d-flex justify-content-between align-items-start gap-2">

                                <div>

                                    <div class="fw-bold">
                                        ${amanHTML(keterangan)}
                                    </div>

                                    <div class="text-muted small">
                                        ${amanHTML(jenis)}
                                    </div>

                                    <div class="text-muted small mt-1">

                                        <i class="bi bi-calendar3"></i>

                                        ${amanHTML(tanggal)}

                                    </div>

                                </div>


                                <div class="text-danger fw-bold text-nowrap">

                                    - ${rupiah(nominal)}

                                </div>

                            </div>


                            <div class="d-flex gap-2 mt-3">

                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-primary flex-fill"
                                    data-action="edit"
                                    data-id="${item.id}"
                                >

                                    <i class="bi bi-pencil"></i>
                                    Edit

                                </button>


                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-danger flex-fill"
                                    data-action="delete"
                                    data-id="${item.id}"
                                >

                                    <i class="bi bi-trash"></i>
                                    Hapus

                                </button>

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
                    "Gagal memuat riwayat:",
                    error
                );

                container.innerHTML = `

                    <div class="alert alert-danger">

                        Gagal memuat riwayat pengeluaran.

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
// EVENT TOMBOL RIWAYAT
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

            window.editPengeluaran(id);

        }


        if (
            action === "delete"
        ) {

            window.hapusPengeluaran(id);

        }

    }
);


// ======================================================
// AUTH FIREBASE
// ======================================================

onAuthStateChanged(
    auth,
    function (user) {

        userAktif =
            user || null;


        console.log(
            "Firebase Auth:",
            user
                ? user.uid
                : "BELUM LOGIN"
        );


        if (user) {

            muatPengeluaran();

        }
        else {

            const container =
                $("daftarPengeluaran") ||
                $("riwayatPengeluaran") ||
                $("listPengeluaran") ||
                $("riwayat");

            if (container) {

                container.innerHTML = `

                    <div class="alert alert-warning">

                        <i class="bi bi-person-lock"></i>

                        Silakan login terlebih dahulu
                        untuk melihat riwayat pengeluaran.

                    </div>

                `;

            }

        }

    }
);


// ======================================================
// INISIALISASI
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const tanggal =
            $("tanggalPengeluaran") ||
            $("tanggal") ||
            $("tglPengeluaran");

        if (
            tanggal &&
            !tanggal.value
        ) {

            const sekarang =
                new Date();

            const yyyy =
                sekarang.getFullYear();

            const mm =
                String(
                    sekarang.getMonth() + 1
                ).padStart(2, "0");

            const dd =
                String(
                    sekarang.getDate()
                ).padStart(2, "0");

            tanggal.value =
                `${yyyy}-${mm}-${dd}`;

        }


        const tombol =
            tombolSimpan();

        if (tombol) {

            tombol.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.simpanPengeluaran();

                }
            );

        }

    }
);

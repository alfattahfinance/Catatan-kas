// ======================================================
// CATATAN KAS - PENGELUARAN
// FINAL - WEB + APK
// Firebase Firestore
// Simpan + Riwayat Real-time + Edit + Hapus + Refresh
// ======================================================

import { db, auth } from "./firebase-config.js";

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

const $ = (id) => document.getElementById(id);


// ======================================================
// FORMAT RUPIAH
// ======================================================

function rupiah(nilai) {

    const angka =
        Number(nilai) || 0;

    return (
        "Rp " +
        angka.toLocaleString(
            "id-ID"
        )
    );

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

    const element =
        $("keterangan") ||
        $("namaPengeluaran") ||
        $("deskripsi") ||
        $("uraian") ||
        $("nama");


    return element
        ? String(
            element.value || ""
        ).trim()
        : "";

}


// ======================================================
// AMBIL JENIS
// ======================================================

function ambilJenis() {

    const element =
        $("jenisPengeluaran") ||
        $("jenis") ||
        $("kategori");


    return element
        ? String(
            element.value || ""
        ).trim()
        : "";

}


// ======================================================
// AMBIL NOMINAL
// ======================================================

function ambilNominal() {

    const element =
        $("nominalPengeluaran") ||
        $("nominal") ||
        $("jumlah");


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
                    ""
                );

    }


    const angka =
        Number(nilai);


    return Number.isFinite(
        angka
    )
        ? angka
        : 0;

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


    return element.value;

}


// ======================================================
// TOMBOL SIMPAN
// ======================================================

function tombolSimpan() {

    return (
        $("btnSimpanPengeluaran") ||
        document.querySelector(
            "button[onclick*='simpanPengeluaran']"
        )
    );

}


// ======================================================
// REFRESH DASHBOARD
// ======================================================

function refreshDashboard() {

    try {

        localStorage.setItem(
            "catatanKasDataBerubah",
            String(Date.now())
        );

    }

    catch (error) {

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
                    tipe:
                        "pengeluaran",

                    waktu:
                        Date.now()
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


// ======================================================
// SIMPAN PENGELUARAN
// ======================================================

window.simpanPengeluaran =
    async function () {

        console.log(
            "=== MULAI SIMPAN PENGELUARAN ==="
        );


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

        console.log(
            "User:",
            userAktif
        );


        // ------------------------------------------------
        // VALIDASI
        // ------------------------------------------------

        if (!keterangan) {

            alert(
                "Keterangan pengeluaran belum diisi."
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

                tombol.disabled =
                    true;

                tombol.dataset.text =
                    tombol.innerHTML;

                tombol.innerHTML =
                    "⏳ Menyimpan...";

            }


            // ------------------------------------------------
            // DATA
            // ------------------------------------------------

            const dataPengeluaran = {

                keterangan:
                    keterangan,

                nama:
                    keterangan,

                deskripsi:
                    keterangan,

                jenis:
                    jenis ||
                    "Lainnya",

                kategori:
                    jenis ||
                    "Lainnya",

                nominal:
                    nominal,

                jumlah:
                    nominal,

                satuan:
                    "Rupiah",

                tanggal:
                    tanggal ||
                    null,

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
                            jenis ||
                            "Lainnya",

                        kategori:
                            jenis ||
                            "Lainnya",

                        nominal:
                            nominal,

                        jumlah:
                            nominal,

                        satuan:
                            "Rupiah",

                        tanggal:
                            tanggal ||
                            null,

                        updatedAt:
                            serverTimestamp()

                    }

                );


                console.log(
                    "PENGELUARAN DIUPDATE:",
                    idEdit
                );


                alert(
                    "Pengeluaran berhasil diperbarui."
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
                "GAGAL SIMPAN PENGELUARAN:",
                error
            );


            alert(
                "Gagal menyimpan pengeluaran.\n\n" +
                (
                    error.message ||
                    error
                )
            );

        }


        finally {

            if (tombol) {

                tombol.disabled =
                    false;

                tombol.innerHTML =
                    tombol.dataset.text ||
                    "Simpan Pengeluaran";

            }

        }

    };


// ======================================================
// MUAT RIWAYAT REAL-TIME
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


    unsubscribePengeluaran =
        onSnapshot(

            collection(
                db,
                "expenses"
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
                // SORT
                // ----------------------------------------

                data.sort(
                    function (a, b) {

                        return (
                            waktuData(b) -
                            waktuData(a)
                        );

                    }
                );


                // ----------------------------------------
                // KOSONG
                // ----------------------------------------

                if (
                    !data.length
                ) {

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


                // ----------------------------------------
                // RENDER
                // ----------------------------------------

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
                            "Lainnya";


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

                                            ${amanHTML(
                                                keterangan
                                            )}

                                        </div>


                                        <div
                                            class="text-muted small"
                                        >

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
                                        class="fw-bold text-danger"
                                    >

                                        - ${rupiah(
                                            nominal
                                        )}

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
                                        data-action="edit-pengeluaran"
                                        data-id="${item.id}"
                                    >

                                        <i class="bi bi-pencil"></i>
                                        Edit

                                    </button>


                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-danger"
                                        data-action="delete-pengeluaran"
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
                    "Gagal memuat expenses:",
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
            !Number.isNaN(waktu)
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
        nilai &&
        typeof nilai.toDate ===
            "function"
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
// EDIT PENGELUARAN
// ======================================================

window.editPengeluaran =
    async function (id) {

        try {

            const ref =
                doc(
                    db,
                    "expenses",
                    id
                );


            const snapshot =
                await getDoc(ref);


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
                $("keterangan") ||
                $("namaPengeluaran") ||
                $("deskripsi") ||
                $("uraian") ||
                $("nama");


            const jenis =
                $("jenisPengeluaran") ||
                $("jenis") ||
                $("kategori");


            const nominal =
                $("nominalPengeluaran") ||
                $("nominal") ||
                $("jumlah");


            const tanggal =
                $("tanggalPengeluaran") ||
                $("tanggal") ||
                $("tglPengeluaran");


            if (keterangan) {

                keterangan.value =
                    data.keterangan ||
                    data.nama ||
                    data.deskripsi ||
                    "";

            }


            if (jenis) {

                jenis.value =
                    data.jenis ||
                    data.kategori ||
                    "Lainnya";

            }


            if (nominal) {

                nominal.value =
                    data.nominal ??
                    data.jumlah ??
                    "";

            }


            if (
                tanggal &&
                typeof data.tanggal ===
                    "string"
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
                "Gagal edit pengeluaran:",
                error
            );


            alert(
                "Gagal mengambil data pengeluaran.\n\n" +
                (
                    error.message ||
                    error
                )
            );

        }

    };


// ======================================================
// HAPUS PENGELUARAN
// ======================================================

window.hapusPengeluaran =
    async function (id) {

        if (
            !confirm(
                "Yakin ingin menghapus pengeluaran ini?"
            )
        ) {

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


            console.log(
                "PENGELUARAN DIHAPUS:",
                id
            );


            alert(
                "Pengeluaran berhasil dihapus."
            );


            refreshDashboard();

        }


        catch (error) {

            console.error(
                "Gagal menghapus pengeluaran:",
                error
            );


            alert(
                "Gagal menghapus pengeluaran.\n\n" +
                (
                    error.message ||
                    error
                )
            );

        }

    };


// ======================================================
// RESET FORM
// ======================================================

function kosongkanForm() {

    idEdit =
        null;


    const keterangan =
        $("keterangan") ||
        $("namaPengeluaran") ||
        $("deskripsi") ||
        $("uraian") ||
        $("nama");


    const jenis =
        $("jenisPengeluaran") ||
        $("jenis") ||
        $("kategori");


    const nominal =
        $("nominalPengeluaran") ||
        $("nominal") ||
        $("jumlah");


    const tanggal =
        $("tanggalPengeluaran") ||
        $("tanggal") ||
        $("tglPengeluaran");


    if (keterangan) {

        keterangan.value =
            "";

    }


    if (jenis) {

        jenis.value =
            "";

    }


    if (nominal) {

        nominal.value =
            "";

    }


    if (tanggal) {

        tanggal.value =
            "";

    }


    const tombol =
        tombolSimpan();


    if (tombol) {

        tombol.innerHTML =
            "Simpan Pengeluaran";

    }

}


// ======================================================
// EVENT EDIT / HAPUS
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


        const id =
            tombol.dataset.id;


        if (!id) {

            return;

        }


        const action =
            tombol.dataset.action;


        if (
            action ===
            "edit-pengeluaran"
        ) {

            window.editPengeluaran(
                id
            );

        }


        if (
            action ===
            "delete-pengeluaran"
        ) {

            window.hapusPengeluaran(
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

                    window.simpanPengeluaran();

                }
            );

        }


        // ----------------------------------------------
        // PENTING:
        // TIDAK MENUNGGU LOGIN
        // ----------------------------------------------

        muatPengeluaran();


        console.log(
            "Catatan Kas: pengeluaran.js aktif."
        );

    }
);


// ======================================================
// AUTH
// HANYA UNTUK UID
// BUKAN SYARAT FIRESTORE
// ======================================================

try {

    onAuthStateChanged(
        auth,
        function (user) {

            userAktif =
                user || null;


            console.log(
                "PENGELUARAN - USER:",
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
// EVENT DATA BERUBAH
// ======================================================

window.addEventListener(
    "dataKeuanganBerubah",
    function () {

        console.log(
            "Pengeluaran: data keuangan berubah."
        );

    }
);

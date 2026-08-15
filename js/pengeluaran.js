// ======================================================
// CATATAN KAS - PENGELUARAN
// Versi perbaikan lengkap
// - Simpan
// - Edit
// - Hapus
// - Riwayat
// - Support ID HTML lama & baru
// - Firebase Authentication
// ======================================================

import {
    db,
    auth
} from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// ======================================================
// VARIABEL
// ======================================================

let idEditPengeluaran = null;
let userSiap = false;


// ======================================================
// HELPER ELEMENT
// ======================================================

function el(id) {

    return document.getElementById(id);

}


// ======================================================
// FORMAT RUPIAH
// ======================================================

function rupiah(nilai) {

    return "Rp " +
        Number(nilai || 0)
            .toLocaleString("id-ID");

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// CARI ELEMENT JENIS
// ======================================================

function getJenisEl() {

    return (
        el("jenisPengeluaran") ||
        el("jenis")
    );

}


// ======================================================
// CARI ELEMENT NOMINAL
// ======================================================

function getNominalEl() {

    return (
        el("nominal") ||
        el("jumlah")
    );

}


// ======================================================
// CARI TOMBOL SIMPAN
// ======================================================

function getTombolSimpan() {

    return (
        el("btnSimpanPengeluaran") ||
        document.querySelector(
            "button[onclick*='simpanPengeluaran']"
        ) ||
        document.querySelector(
            ".btn-simpan"
        )
    );

}


// ======================================================
// BACA TANGGAL
// ======================================================

function bacaTanggal(data) {

    if (!data) return null;


    const nilai =
        data.tanggal ||
        data.date ||
        data.createdAt ||
        null;


    if (!nilai) {

        return null;

    }


    if (
        typeof nilai === "object" &&
        typeof nilai.toDate === "function"
    ) {

        return nilai.toDate();

    }


    if (
        nilai instanceof Date
    ) {

        return nilai;

    }


    if (
        typeof nilai === "string"
    ) {

        // YYYY-MM-DD
        const cocok =
            nilai.match(
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/
            );


        if (cocok) {

            return new Date(

                Number(cocok[1]),

                Number(cocok[2]) - 1,

                Number(cocok[3])

            );

        }


        const tanggal =
            new Date(nilai);


        if (
            !isNaN(
                tanggal.getTime()
            )
        ) {

            return tanggal;

        }

    }


    return null;

}


// ======================================================
// FORMAT TANGGAL
// ======================================================

function formatTanggal(data) {

    const tanggal =
        bacaTanggal(data);


    if (!tanggal) {

        return data?.tanggal ||
            data?.date ||
            "-";

    }


    return tanggal.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ======================================================
// RESET FORM
// ======================================================

function resetFormPengeluaran() {

    const jenisEl =
        getJenisEl();

    const keteranganEl =
        el("keterangan");

    const tanggalEl =
        el("tanggal");

    const nominalEl =
        getNominalEl();

    const satuanEl =
        el("satuan");

    const tombol =
        getTombolSimpan();


    if (jenisEl) {

        jenisEl.value =
            "";

    }


    if (keteranganEl) {

        keteranganEl.value =
            "";

    }


    if (tanggalEl) {

        tanggalEl.value =
            "";

    }


    if (nominalEl) {

        nominalEl.value =
            "";

    }


    if (satuanEl) {

        satuanEl.value =
            "Rupiah";

    }


    idEditPengeluaran =
        null;


    if (tombol) {

        tombol.disabled =
            false;

        tombol.innerHTML =
            '<i class="bi bi-check-circle me-1"></i> Simpan Pengeluaran';

    }

}


// ======================================================
// SIMPAN / UPDATE PENGELUARAN
// ======================================================

window.simpanPengeluaran =
    async function () {

        const jenisEl =
            getJenisEl();

        const keteranganEl =
            el("keterangan");

        const tanggalEl =
            el("tanggal");

        const nominalEl =
            getNominalEl();

        const satuanEl =
            el("satuan");

        const tombol =
            getTombolSimpan();


        // ------------------------------------------
        // PASTIKAN FORM ADA
        // ------------------------------------------

        if (
            !jenisEl ||
            !keteranganEl ||
            !tanggalEl ||
            !nominalEl
        ) {

            alert(
                "Form pengeluaran tidak ditemukan. Silakan refresh aplikasi."
            );

            return;

        }


        // ------------------------------------------
        // AMBIL DATA
        // ------------------------------------------

        const jenis =
            String(
                jenisEl.value || ""
            ).trim();


        const keterangan =
            String(
                keteranganEl.value || ""
            ).trim();


        const tanggal =
            String(
                tanggalEl.value || ""
            ).trim();


        let jumlah =
            Number(
                nominalEl.value || 0
            );


        const satuan =
            satuanEl?.value ||
            "Rupiah";


        // ------------------------------------------
        // VALIDASI
        // ------------------------------------------

        if (!jenis) {

            alert(
                "Silakan pilih jenis pengeluaran."
            );

            jenisEl.focus();

            return;

        }


        if (!keterangan) {

            alert(
                "Silakan isi keterangan pengeluaran."
            );

            keteranganEl.focus();

            return;

        }


        if (!tanggal) {

            alert(
                "Silakan pilih tanggal pengeluaran."
            );

            tanggalEl.focus();

            return;

        }


        if (
            !Number.isFinite(jumlah) ||
            jumlah <= 0
        ) {

            alert(
                "Nominal / jumlah harus lebih dari 0."
            );

            nominalEl.focus();

            return;

        }


        if (!userSiap) {

            alert(
                "Silakan login terlebih dahulu."
            );

            return;

        }


        // ------------------------------------------
        // DATA FIREBASE
        // ------------------------------------------

        const dataPengeluaran = {

            jenis:
                jenis,

            keterangan:
                keterangan,

            tanggal:
                tanggal,

            jumlah:
                jumlah,

            nominal:
                jumlah,

            satuan:
                satuan

        };


        // ------------------------------------------
        // TOMBOL
        // ------------------------------------------

        if (tombol) {

            tombol.disabled =
                true;

            tombol.innerHTML =
                '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

        }


        try {

            // --------------------------------------
            // TAMBAH
            // --------------------------------------

            if (
                idEditPengeluaran === null
            ) {

                dataPengeluaran.createdAt =
                    serverTimestamp();


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

            }

            // --------------------------------------
            // UPDATE
            // --------------------------------------

            else {

                await updateDoc(
                    doc(
                        db,
                        "expenses",
                        idEditPengeluaran
                    ),
                    dataPengeluaran
                );


                alert(
                    "Pengeluaran berhasil diperbarui!"
                );

            }


            // --------------------------------------
            // RESET
            // --------------------------------------

            resetFormPengeluaran();


            await muatRiwayatPengeluaran();


            window.dispatchEvent(
                new CustomEvent(
                    "dataKeuanganBerubah"
                )
            );


        } catch (error) {

            console.error(
                "Gagal menyimpan pengeluaran:",
                error
            );


            alert(
                "Gagal menyimpan pengeluaran:\n" +
                (
                    error?.message ||
                    "Terjadi kesalahan."
                )
            );


            if (tombol) {

                tombol.disabled =
                    false;

                tombol.innerHTML =
                    '<i class="bi bi-check-circle me-1"></i> Simpan Pengeluaran';

            }

        }

    };


// ======================================================
// EDIT PENGELUARAN
// ======================================================

window.mulaiEditPengeluaran =
    function (
        idDoc,
        jenis,
        keterangan,
        tanggal,
        jumlah,
        satuan
    ) {

        const jenisEl =
            getJenisEl();

        const keteranganEl =
            el("keterangan");

        const tanggalEl =
            el("tanggal");

        const nominalEl =
            getNominalEl();

        const satuanEl =
            el("satuan");

        const tombol =
            getTombolSimpan();


        if (
            !jenisEl ||
            !keteranganEl ||
            !tanggalEl ||
            !nominalEl
        ) {

            alert(
                "Form pengeluaran tidak ditemukan."
            );

            return;

        }


        idEditPengeluaran =
            idDoc;


        jenisEl.value =
            jenis || "";


        keteranganEl.value =
            keterangan || "";


        tanggalEl.value =
            tanggal || "";


        nominalEl.value =
            jumlah || "";


        if (satuanEl) {

            satuanEl.value =
                satuan || "Rupiah";

        }


        if (tombol) {

            tombol.disabled =
                false;

            tombol.innerHTML =
                '<i class="bi bi-check-circle me-1"></i> Simpan Perubahan';

        }


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    };


// ======================================================
// HAPUS PENGELUARAN
// ======================================================

window.hapusPengeluaran =
    async function (idDoc) {

        if (!idDoc) return;


        if (!userSiap) {

            alert(
                "Silakan login terlebih dahulu."
            );

            return;

        }


        const yakin =
            confirm(
                "Apakah Anda yakin ingin menghapus pengeluaran ini?"
            );


        if (!yakin) return;


        try {

            await deleteDoc(
                doc(
                    db,
                    "expenses",
                    idDoc
                )
            );


            alert(
                "Pengeluaran berhasil dihapus."
            );


            await muatRiwayatPengeluaran();


            window.dispatchEvent(
                new CustomEvent(
                    "dataKeuanganBerubah"
                )
            );


        } catch (error) {

            console.error(
                "Gagal menghapus pengeluaran:",
                error
            );


            alert(
                "Gagal menghapus pengeluaran:\n" +
                (
                    error?.message ||
                    "Terjadi kesalahan."
                )
            );

        }

    };


// ======================================================
// RIWAYAT PENGELUARAN
// ======================================================

async function muatRiwayatPengeluaran() {

    const container =
        el("daftarPengeluaran");


    if (!container) {

        console.warn(
            "Elemen #daftarPengeluaran tidak ditemukan."
        );

        return;

    }


    container.innerHTML = `

        <li class="list-group-item text-center text-muted py-3">

            Memuat riwayat...

        </li>

    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "expenses"
                )
            );


        const data =
            [];


        snapshot.forEach(
            (docItem) => {

                data.push({

                    id:
                        docItem.id,

                    ...docItem.data()

                });

            }
        );


        // ------------------------------------------
        // URUTKAN TERBARU
        // ------------------------------------------

        data.sort(
            (a, b) => {

                const ta =
                    bacaTanggal(a)?.getTime() ||
                    0;


                const tb =
                    bacaTanggal(b)?.getTime() ||
                    0;


                return tb - ta;

            }
        );


        if (
            data.length === 0
        ) {

            container.innerHTML = `

                <li class="list-group-item text-center text-muted py-4">

                    <i class="bi bi-wallet2 fs-2 d-block mb-2"></i>

                    Belum ada riwayat pengeluaran.

                </li>

            `;

            return;

        }


        container.innerHTML =
            "";


        data.forEach(
            (item) => {

                const nominal =
                    Number(
                        item.jumlah ??
                        item.nominal ??
                        0
                    );


                let nilai;


                if (
                    String(
                        item.satuan || ""
                    ).toLowerCase() ===
                    "liter"
                ) {

                    nilai =
                        nominal
                            .toLocaleString(
                                "id-ID"
                            ) +
                        " Liter";

                }

                else {

                    nilai =
                        rupiah(
                            nominal
                        );

                }


                const li =
                    document.createElement(
                        "li"
                    );


                li.className =
                    "list-group-item d-flex justify-content-between align-items-center border-0 border-bottom py-3";


                li.innerHTML = `

                    <div>

                        <strong>

                            ${escapeHtml(
                                item.keterangan
                            )}

                        </strong>

                        <br>

                        <small class="text-muted">

                            ${escapeHtml(
                                item.jenis
                            )}

                            •
                            
                            ${escapeHtml(
                                formatTanggal(item)
                            )}

                        </small>

                    </div>


                    <div class="text-end ms-2">

                        <div class="text-danger fw-bold mb-2">

                            -${escapeHtml(
                                nilai
                            )}

                        </div>


                        <button
                            type="button"
                            class="btn btn-sm btn-outline-primary mb-1"
                            data-edit
                        >

                            <i class="bi bi-pencil"></i>

                            Edit

                        </button>


                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            data-hapus
                        >

                            <i class="bi bi-trash"></i>

                            Hapus

                        </button>

                    </div>

                `;


                li
                    .querySelector("[data-edit]")
                    .addEventListener(
                        "click",
                        function () {

                            window.mulaiEditPengeluaran(

                                item.id,

                                item.jenis,

                                item.keterangan,

                                item.tanggal || "",

                                nominal,

                                item.satuan || "Rupiah"

                            );

                        }
                    );


                li
                    .querySelector("[data-hapus]")
                    .addEventListener(
                        "click",
                        function () {

                            window.hapusPengeluaran(
                                item.id
                            );

                        }
                    );


                container.appendChild(
                    li
                );

            }
        );


    } catch (error) {

        console.error(
            "Gagal memuat riwayat:",
            error
        );


        container.innerHTML = `

            <li class="list-group-item text-center text-danger py-4">

                <i class="bi bi-exclamation-triangle fs-3 d-block mb-2"></i>

                Gagal memuat data riwayat.

            </li>

        `;

    }

}


// ======================================================
// PASANG EVENT TOMBOL
// ======================================================

function pasangEventPengeluaran() {

    const tombol =
        getTombolSimpan();


    if (!tombol) {

        console.warn(
            "Tombol simpan pengeluaran tidak ditemukan."
        );

        return;

    }


    // Hapus onclick lama agar tidak double
    tombol.removeAttribute(
        "onclick"
    );


    tombol.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            window.simpanPengeluaran();

        }
    );

}


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(
    auth,
    async function (user) {

        userSiap =
            !!user;


        if (!user) {

            return;

        }


        await muatRiwayatPengeluaran();

    }
);


// ======================================================
// INIT
// ======================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        pasangEventPengeluaran
    );

}

else {

    pasangEventPengeluaran();

}

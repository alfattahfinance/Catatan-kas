// ======================================================
// CATATAN KAS - PENGELUARAN
// FIREBASE FIRESTORE
// SIMPAN + EDIT + HAPUS + REAL-TIME
// ======================================================

import {
    db,
    auth
} from "../firebase-config.js";

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

let userAktif =
    null;

let idEdit =
    null;

let unsubscribePengeluaran =
    null;


// ======================================================
// HELPER
// ======================================================

const $ =
    (id) =>
        document.getElementById(id);


// ======================================================
// RUPIAH
// ======================================================

function rupiah(nilai) {

    return (
        "Rp " +
        (
            Number(nilai) || 0
        ).toLocaleString(
            "id-ID"
        )
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function amanHTML(teks) {

    return String(
        teks ?? ""
    )

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
// KETERANGAN
// ======================================================

function ambilKeterangan() {

    const element =

        $("keteranganPengeluaran") ||

        $("keterangan") ||

        $("namaPengeluaran") ||

        $("nama") ||

        $("deskripsi");


    return element

        ? String(
            element.value || ""
        ).trim()

        : "";

}


// ======================================================
// JENIS / KATEGORI
// ======================================================

function ambilJenis() {

    const element =

        $("jenisPengeluaran") ||

        $("jenis") ||

        $("kategoriPengeluaran") ||

        $("kategori");


    return element

        ? String(
            element.value || ""
        ).trim()

        : "";

}


// ======================================================
// NOMINAL
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


    return Number.isFinite(
        angka
    )
        ? angka
        : 0;

}


// ======================================================
// TANGGAL
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

    try {

        localStorage.setItem(
            "catatanKasDataBerubah",
            String(
                Date.now()
            )
        );

    }

    catch (error) {

        console.warn(
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

        const keterangan =
            ambilKeterangan();

        const jenis =
            ambilJenis();

        const nominal =
            ambilNominal();

        const tanggal =
            ambilTanggal();


        console.log(
            "Pengeluaran:",
            {
                keterangan,
                jenis,
                nominal,
                tanggal
            }
        );


        // ==============================================
        // VALIDASI
        // ==============================================

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

                tombol.disabled =
                    true;

                tombol.dataset.text =
                    tombol.innerHTML;

                tombol.innerHTML =
                    "⏳ Menyimpan...";

            }


            // ==========================================
            // EDIT
            // ==========================================

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


                alert(
                    "Pengeluaran berhasil diperbarui."
                );

            }


            // ==========================================
            // BARU
            // ==========================================

            else {

                await addDoc(

                    collection(
                        db,
                        "expenses"
                    ),

                    {

                        keterangan:
                            keterangan,

                        nama:
                            keterangan,

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

                    }

                );


                alert(
                    "Pengeluaran berhasil disimpan."
                );

            }


            kosongkanForm();


            idEdit =
                null;


            refreshDashboard();

        }

        catch (error) {

            console.error(
                "Gagal menyimpan pengeluaran:",
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
                    "Simpan Pengeluaran";

            }

        }

    };


// ======================================================
// RIWAYAT PENGELUARAN
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


    if (
        unsubscribePengeluaran
    ) {

        unsubscribePengeluaran();

        unsubscribePengeluaran =
            null;

    }


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

                                <div class="d-flex justify-content-between align-items-start gap-2">

                                    <div>

                                        <div class="fw-bold">

                                            ${amanHTML(keterangan)}

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

                                    <div class="fw-bold text-danger">

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

                        Gagal memuat riwayat pengeluaran.

                        <div class="small mt-2">
                            ${amanHTML(error.message || error)}
                        </div>

                    </div>

                `;

            }

        );

}


// ======================================================
// WAKTU
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


    return tanggal
        .toLocaleDateString(
            "id-ID"
        );

}


// ======================================================
// EDIT
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

                $("keteranganPengeluaran") ||

                $("keterangan") ||

                $("namaPengeluaran") ||

                $("nama") ||

                $("deskripsi");


            const jenis =

                $("jenisPengeluaran") ||

                $("jenis") ||

                $("kategoriPengeluaran") ||

                $("kategori");


            const nominal =

                $("nominalPengeluaran") ||

                $("nominal") ||

                $("jumlah") ||

                $("total");


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

                    "";

            }


            if (nominal) {

                nominal.value =

                    data.nominal ??

                    data.jumlah ??

                    data.total ??

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


            window.scrollTo(
                {
                    top: 0,
                    behavior:
                        "smooth"
                }
            );

        }

        catch (error) {

            console.error(
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
// HAPUS
// ======================================================

window.hapusPengeluaran =
    async function (id) {

        const yakin =
            window.confirm(
                "Yakin ingin menghapus pengeluaran ini?"
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
                (
                    error.message ||
                    error
                )
            );

        }

    };


// ======================================================
// RESET
// ======================================================

function kosongkanForm() {

    idEdit =
        null;


    const keterangan =

        $("keteranganPengeluaran") ||

        $("keterangan") ||

        $("namaPengeluaran") ||

        $("nama") ||

        $("deskripsi");


    const jenis =

        $("jenisPengeluaran") ||

        $("jenis") ||

        $("kategoriPengeluaran") ||

        $("kategori");


    const nominal =

        $("nominalPengeluaran") ||

        $("nominal") ||

        $("jumlah") ||

        $("total");


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


        const action =
            tombol.dataset.action;


        const id =
            tombol.dataset.id;


        if (!id) {

            return;

        }


        if (
            action ===
            "edit"
        ) {

            window.editPengeluaran(
                id
            );

        }


        if (
            action ===
            "delete"
        ) {

            window.hapusPengeluaran(
                id
            );

        }

    }
);


// ======================================================
// INIT
// ======================================================

function initPengeluaran() {

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


    muatPengeluaran();


    console.log(
        "Catatan Kas: pengeluaran.js aktif."
    );

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initPengeluaran
    );

}

else {

    initPengeluaran();

}


// ======================================================
// AUTH
// ======================================================

try {

    onAuthStateChanged(
        auth,
        function (user) {

            userAktif =
                user || null;


            console.log(
                "Pengeluaran USER:",
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

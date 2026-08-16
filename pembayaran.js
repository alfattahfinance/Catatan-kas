// ======================================================
// CATATAN KAS - PEMBAYARAN
// FIREBASE FIRESTORE
// SIMPAN + EDIT + HAPUS + REAL-TIME
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

let userAktif =
    null;

let idEdit =
    null;

let unsubscribePembayaran =
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
// NAMA
// ======================================================

function ambilNama() {

    const element =

        $("namaSantriPemasukan") ||

        $("namaSantri") ||

        $("santri") ||

        $("nama") ||

        $("keterangan");


    return element

        ? String(
            element.value || ""
        ).trim()

        : "";

}


// ======================================================
// JENIS
// ======================================================

function ambilJenis() {

    const element =

        $("jenis") ||

        $("jenisPembayaran") ||

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

        $("nominal") ||

        $("nominalPembayaran") ||

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
// TANGGAL
// ======================================================

function ambilTanggal() {

    const element =

        $("tanggalPembayaran") ||

        $("tanggal") ||

        $("tglPembayaran");


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

        $("btnSimpanPembayaran") ||

        $("simpanPembayaran") ||

        document.querySelector(
            "button[onclick*='simpanPembayaran']"
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
                        "pembayaran",
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
// SIMPAN
// ======================================================

window.simpanPembayaran =
    async function () {

        const nama =
            ambilNama();

        const jenis =
            ambilJenis();

        const nominal =
            ambilNominal();

        const tanggal =
            ambilTanggal();


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


        if (
            !nominal ||
            nominal <= 0
        ) {

            alert(
                "Nominal pembayaran belum benar."
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


                alert(
                    "Pembayaran berhasil diperbarui."
                );

            }


            // ==========================================
            // BARU
            // ==========================================

            else {

                await addDoc(

                    collection(
                        db,
                        "payments"
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
                    "Pembayaran berhasil disimpan."
                );

            }


            kosongkanForm();

            idEdit =
                null;


            refreshDashboard();

        }

        catch (error) {

            console.error(
                "Gagal menyimpan pembayaran:",
                error
            );


            alert(
                "Gagal menyimpan pembayaran.\n\n" +
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
                    "Simpan Pembayaran";

            }

        }

    };


// ======================================================
// MUAT RIWAYAT
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


    if (
        unsubscribePembayaran
    ) {

        unsubscribePembayaran();

        unsubscribePembayaran =
            null;

    }


    unsubscribePembayaran =
        onSnapshot(

            collection(
                db,
                "payments"
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

                            <i class="bi bi-receipt fs-1"></i>

                            <div class="mt-2">
                                Belum ada pembayaran.
                            </div>

                        </div>

                    `;

                    return;

                }


                container.innerHTML =
                    "";


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

                                <div class="d-flex justify-content-between align-items-start gap-2">

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

                                    <div class="fw-bold text-success">

                                        + ${rupiah(nominal)}

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
                    "Gagal memuat pembayaran:",
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
// TANGGAL
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

window.editPembayaran =
    async function (id) {

        try {

            const ref =
                doc(
                    db,
                    "payments",
                    id
                );


            const snapshot =
                await getDoc(ref);


            if (
                !snapshot.exists()
            ) {

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
                "Gagal mengambil data pembayaran.\n\n" +
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

window.hapusPembayaran =
    async function (id) {

        const yakin =
            window.confirm(
                "Yakin ingin menghapus pembayaran ini?"
            );


        if (!yakin) {

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


            alert(
                "Pembayaran berhasil dihapus."
            );


            refreshDashboard();

        }

        catch (error) {

            console.error(
                "Gagal menghapus:",
                error
            );


            alert(
                "Gagal menghapus pembayaran.\n\n" +
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
            "Simpan Pembayaran";

    }

}


// ======================================================
// PILIH PEMBAYARAN
// ======================================================

window.pilihPembayaran =
    function () {

        const jenis =
            $("jenis");

        const nominal =
            $("nominal");


        if (
            !jenis ||
            !nominal
        ) {

            return;

        }


        if (
            jenis.value ===
            "SPP"
        ) {

            nominal.value =
                "50000";

        }

        else if (
            jenis.value ===
            "Syahriyyah"
        ) {

            nominal.value =
                "80000";

        }

        else if (
            jenis.value ===
            "Kas"
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
            action ===
            "edit"
        ) {

            window.editPembayaran(
                id
            );

        }


        if (
            action ===
            "delete"
        ) {

            window.hapusPembayaran(
                id
            );

        }

    }
);


// ======================================================
// INIT
// ======================================================

function initPembayaran() {

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


    muatPembayaran();


    console.log(
        "Catatan Kas: pembayaran.js aktif."
    );

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initPembayaran
    );

}

else {

    initPembayaran();

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
                "User:",
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

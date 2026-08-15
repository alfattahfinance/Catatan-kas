// ======================================================
// CATATAN KAS - PEMBAYARAN SANTRI
// Versi perbaikan lengkap
// - Simpan
// - Edit
// - Hapus
// - Riwayat
// - Firebase Authentication
// - Support ID HTML lama & baru
// ======================================================

import {
    db,
    auth
} from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
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

let idEditPembayaran = null;
let userSiap = false;


// ======================================================
// HELPER ELEMENT
// ======================================================

function el(id) {
    return document.getElementById(id);
}


// Nama santri mendukung HTML lama dan terbaru
function getInputSantri() {

    return (
        el("namaSantriPemasukan") ||
        el("santri") ||
        el("namaSantri")
    );

}


// ======================================================
// FORMAT RUPIAH
// ======================================================

function rupiah(nilai) {

    const angka = Number(nilai) || 0;

    return "Rp " +
        angka.toLocaleString("id-ID");

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
// FORMAT TANGGAL
// ======================================================

function formatTanggal(data) {

    if (!data) return "-";

    const nilai =
        data.tanggal ||
        data.createdAt ||
        null;

    if (
        nilai &&
        typeof nilai.toDate === "function"
    ) {

        return nilai
            .toDate()
            .toLocaleDateString("id-ID");

    }

    if (nilai instanceof Date) {

        return nilai.toLocaleDateString("id-ID");

    }

    if (typeof nilai === "string") {

        const tanggal =
            new Date(nilai);

        if (!isNaN(tanggal.getTime())) {

            return tanggal
                .toLocaleDateString("id-ID");

        }

        return nilai;

    }

    return "-";

}


// ======================================================
// TAMPILKAN SANTRI
// ======================================================

async function tampilkanSantri() {

    const input =
        getInputSantri();

    const select =
        el("santri");

    const datalist =
        el("datalistSantri");

    try {

        const snapshot =
            await getDocs(
                collection(db, "santri")
            );


        // ------------------------------------------
        // JIKA HTML MENGGUNAKAN SELECT
        // ------------------------------------------

        if (select && select.tagName === "SELECT") {

            select.innerHTML = `
                <option value="">
                    Pilih Santri
                </option>
            `;

            snapshot.forEach((docItem) => {

                const data =
                    docItem.data();

                if (!data.nama) return;

                const option =
                    document.createElement("option");

                option.value =
                    data.nama;

                option.textContent =
                    data.nama;

                select.appendChild(option);

            });

        }


        // ------------------------------------------
        // JIKA HTML MENGGUNAKAN DATALIST
        // ------------------------------------------

        if (datalist) {

            datalist.innerHTML = "";

            snapshot.forEach((docItem) => {

                const data =
                    docItem.data();

                if (!data.nama) return;

                const option =
                    document.createElement("option");

                option.value =
                    data.nama;

                datalist.appendChild(option);

            });

        }


        // Mencegah warning jika input tidak ditemukan
        if (!input) {

            console.warn(
                "Input nama santri tidak ditemukan."
            );

        }

    } catch (error) {

        console.error(
            "Gagal mengambil data santri:",
            error
        );

    }

}


// ======================================================
// PILIH JENIS PEMBAYARAN
// ======================================================

window.pilihPembayaran = function () {

    const jenisEl =
        el("jenis");

    const nominalEl =
        el("nominal");

    const berasEl =
        el("berasPilihan");


    if (!jenisEl || !nominalEl) {

        console.warn(
            "Elemen jenis atau nominal tidak ditemukan."
        );

        return;

    }


    const jenis =
        jenisEl.value;


    if (berasEl) {

        berasEl.style.display =
            "none";

    }


    nominalEl.placeholder =
        "Masukkan nominal";


    nominalEl.step =
        "1";


    if (jenis === "SPP") {

        nominalEl.value =
            "50000";

    }

    else if (jenis === "Syahriyyah") {

        nominalEl.value =
            "80000";

    }

    else if (jenis === "Kas") {

        nominalEl.value =
            "30000";

    }

    else if (jenis === "Infaq") {

        nominalEl.value =
            "";

    }

    else if (jenis === "Beras") {

        nominalEl.value =
            "";

        if (berasEl) {

            berasEl.style.display =
                "block";

        }

    }

    else {

        nominalEl.value =
            "";

    }

};


// ======================================================
// PENGATURAN BERAS
// ======================================================

window.aturBeras = function () {

    const tipeEl =
        el("tipeBeras");

    const nominalEl =
        el("nominal");


    if (!tipeEl || !nominalEl) {

        return;

    }


    if (tipeEl.value === "uang") {

        nominalEl.placeholder =
            "Masukkan nominal";

        nominalEl.step =
            "1";

        if (
            !nominalEl.value ||
            Number(nominalEl.value) <= 0
        ) {

            nominalEl.value =
                "120000";

        }

    }

    else {

        nominalEl.placeholder =
            "Masukkan jumlah liter";

        nominalEl.step =
            "0.1";

        nominalEl.value =
            "";

    }

};


// ======================================================
// AMBIL TOMBOL SIMPAN
// ======================================================

function getTombolSimpan() {

    return (
        el("btnSimpanPembayaran") ||
        document.querySelector(
            "button[onclick*='simpanPembayaran']"
        ) ||
        document.querySelector(
            "#formPembayaran button[type='submit']"
        )
    );

}


// ======================================================
// RESET FORM
// ======================================================

function resetFormPembayaran() {

    const namaEl =
        getInputSantri();

    const jenisEl =
        el("jenis");

    const nominalEl =
        el("nominal");

    const tipeEl =
        el("tipeBeras");

    const berasEl =
        el("berasPilihan");

    const tombol =
        getTombolSimpan();


    if (namaEl) {

        namaEl.value =
            "";

    }


    if (
        jenisEl &&
        jenisEl.tagName === "SELECT"
    ) {

        jenisEl.value =
            "";

    }


    if (nominalEl) {

        nominalEl.value =
            "";

        nominalEl.placeholder =
            "Masukkan nominal";

        nominalEl.step =
            "1";

    }


    if (tipeEl) {

        tipeEl.value =
            "uang";

    }


    if (berasEl) {

        berasEl.style.display =
            "none";

    }


    idEditPembayaran =
        null;


    if (tombol) {

        tombol.disabled =
            false;

        tombol.innerHTML =
            '<i class="bi bi-check-circle me-1"></i> Simpan Pembayaran';

    }

}


// ======================================================
// SIMPAN PEMBAYARAN
// ======================================================

window.simpanPembayaran = async function () {

    const namaEl =
        getInputSantri();

    const jenisEl =
        el("jenis");

    const nominalEl =
        el("nominal");

    const tipeEl =
        el("tipeBeras");

    const tombol =
        getTombolSimpan();


    if (
        !namaEl ||
        !jenisEl ||
        !nominalEl
    ) {

        alert(
            "Form pembayaran tidak ditemukan. Silakan refresh aplikasi."
        );

        return;

    }


    const nama =
        String(
            namaEl.value || ""
        ).trim();


    const jenis =
        String(
            jenisEl.value || ""
        ).trim();


    const nilai =
        Number(
            nominalEl.value
        );


    const tipeBeras =
        tipeEl?.value ||
        "uang";


    // ------------------------------------------
    // VALIDASI
    // ------------------------------------------

    if (!nama) {

        alert(
            "Silakan isi atau pilih nama santri."
        );

        namaEl.focus();

        return;

    }


    if (!jenis) {

        alert(
            "Silakan pilih jenis pembayaran."
        );

        jenisEl.focus();

        return;

    }


    if (
        !Number.isFinite(nilai) ||
        nilai <= 0
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

    const data = {

        nama_santri:
            nama,

        jenis:
            jenis,

        nominal:
            0,

        jumlah:
            0,

        satuan:
            "Rupiah"

    };


    if (
        jenis === "Beras" &&
        tipeBeras === "liter"
    ) {

        data.nominal =
            0;

        data.jumlah =
            nilai;

        data.satuan =
            "Liter";

    }

    else {

        data.nominal =
            nilai;

        data.jumlah =
            0;

        data.satuan =
            "Rupiah";

    }


    // ------------------------------------------
    // DISABLE TOMBOL
    // ------------------------------------------

    if (tombol) {

        tombol.disabled =
            true;

        tombol.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

    }


    try {

        // --------------------------------------
        // TAMBAH BARU
        // --------------------------------------

        if (
            idEditPembayaran === null
        ) {

            data.tanggal =
                serverTimestamp();

            data.bulan =
                new Date().getMonth() + 1;

            data.tahun =
                new Date().getFullYear();


            await addDoc(
                collection(
                    db,
                    "payments"
                ),
                data
            );


            alert(
                "Pembayaran berhasil disimpan!"
            );

        }

        // --------------------------------------
        // UPDATE
        // --------------------------------------

        else {

            await updateDoc(
                doc(
                    db,
                    "payments",
                    idEditPembayaran
                ),
                data
            );


            alert(
                "Pembayaran berhasil diperbarui!"
            );

        }


        // --------------------------------------
        // RESET
        // --------------------------------------

        resetFormPembayaran();


        await tampilkanRiwayat();


        // Beritahu halaman lain
        window.dispatchEvent(
            new CustomEvent(
                "dataKeuanganBerubah"
            )
        );


    } catch (error) {

        console.error(
            "Gagal menyimpan pembayaran:",
            error
        );


        alert(
            "Gagal menyimpan pembayaran:\n" +
            (
                error?.message ||
                "Terjadi kesalahan."
            )
        );


        if (tombol) {

            tombol.disabled =
                false;

            tombol.innerHTML =
                '<i class="bi bi-check-circle me-1"></i> Simpan Pembayaran';

        }

    }

};


// ======================================================
// HAPUS PEMBAYARAN
// ======================================================

window.hapusPembayaran =
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
                "Apakah Anda yakin ingin menghapus pembayaran ini?"
            );


        if (!yakin) return;


        try {

            await deleteDoc(
                doc(
                    db,
                    "payments",
                    idDoc
                )
            );


            alert(
                "Data pembayaran berhasil dihapus."
            );


            await tampilkanRiwayat();


            window.dispatchEvent(
                new CustomEvent(
                    "dataKeuanganBerubah"
                )
            );


        } catch (error) {

            console.error(
                "Gagal menghapus pembayaran:",
                error
            );


            alert(
                "Gagal menghapus pembayaran:\n" +
                (
                    error?.message ||
                    "Terjadi kesalahan."
                )
            );

        }

    };


// ======================================================
// MULAI EDIT
// ======================================================

window.mulaiEditPembayaran =
    function (
        idDoc,
        nama,
        jenis,
        nominal,
        jumlah,
        satuan
    ) {

        const namaEl =
            getInputSantri();

        const jenisEl =
            el("jenis");

        const nominalEl =
            el("nominal");

        const tipeEl =
            el("tipeBeras");

        const berasEl =
            el("berasPilihan");

        const tombol =
            getTombolSimpan();


        if (
            !namaEl ||
            !jenisEl ||
            !nominalEl
        ) {

            alert(
                "Form pembayaran tidak ditemukan."
            );

            return;

        }


        idEditPembayaran =
            idDoc;


        namaEl.value =
            nama || "";


        jenisEl.value =
            jenis || "";


        if (
            jenis === "Beras"
        ) {

            if (berasEl) {

                berasEl.style.display =
                    "block";

            }


            if (
                satuan === "Liter"
            ) {

                if (tipeEl) {

                    tipeEl.value =
                        "liter";

                }


                nominalEl.value =
                    jumlah || "";


                nominalEl.placeholder =
                    "Masukkan jumlah liter";


                nominalEl.step =
                    "0.1";

            }

            else {

                if (tipeEl) {

                    tipeEl.value =
                        "uang";

                }


                nominalEl.value =
                    nominal || "";


                nominalEl.placeholder =
                    "Masukkan nominal";


                nominalEl.step =
                    "1";

            }

        }

        else {

            if (berasEl) {

                berasEl.style.display =
                    "none";

            }


            nominalEl.value =
                nominal || "";


            nominalEl.placeholder =
                "Masukkan nominal";


            nominalEl.step =
                "1";

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
// RIWAYAT PEMBAYARAN
// ======================================================

async function tampilkanRiwayat() {

    const riwayat =
        el("riwayat");


    if (!riwayat) {

        console.warn(
            "Elemen #riwayat tidak ditemukan."
        );

        return;

    }


    riwayat.innerHTML = `

        <li class="list-group-item text-center text-muted border-0 py-3">

            Memuat data...

        </li>

    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "payments"
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
                    a.tanggal &&
                    typeof a.tanggal.toDate === "function"

                        ? a.tanggal.toDate().getTime()

                        : 0;


                const tb =
                    b.tanggal &&
                    typeof b.tanggal.toDate === "function"

                        ? b.tanggal.toDate().getTime()

                        : 0;


                return tb - ta;

            }
        );


        if (
            data.length === 0
        ) {

            riwayat.innerHTML = `

                <li class="list-group-item text-center text-muted border-0 py-4">

                    <i class="bi bi-receipt fs-2 d-block mb-2"></i>

                    Belum ada pembayaran.

                </li>

            `;

            return;

        }


        riwayat.innerHTML =
            "";


        data.forEach(
            (item) => {

                let nilai;


                if (
                    item.satuan === "Liter"
                ) {

                    nilai =
                        Number(
                            item.jumlah || 0
                        ).toLocaleString(
                            "id-ID"
                        ) +
                        " Liter";

                }

                else {

                    nilai =
                        rupiah(
                            item.nominal ||
                            item.jumlah ||
                            0
                        );

                }


                const li =
                    document.createElement(
                        "li"
                    );


                li.className =
                    "list-group-item d-flex justify-content-between align-items-center py-3";


                li.innerHTML = `

                    <div>

                        <strong class="riwayat-nama">

                            ${escapeHtml(
                                item.nama_santri
                            )}

                        </strong>

                        <br>

                        <span class="text-muted">

                            ${escapeHtml(
                                item.jenis
                            )}

                        </span>

                        <br>

                        <span class="riwayat-nominal">

                            ${escapeHtml(
                                nilai
                            )}

                        </span>

                        <br>

                        <small class="text-muted">

                            ${escapeHtml(
                                formatTanggal(item)
                            )}

                        </small>

                    </div>


                    <div class="text-end ms-2">

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-primary mb-1 d-block"
                            data-edit
                        >

                            <i class="bi bi-pencil"></i>
                            Edit

                        </button>


                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger d-block"
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

                            window.mulaiEditPembayaran(

                                item.id,

                                item.nama_santri,

                                item.jenis,

                                item.nominal || 0,

                                item.jumlah || 0,

                                item.satuan || ""

                            );

                        }
                    );


                li
                    .querySelector("[data-hapus]")
                    .addEventListener(
                        "click",
                        function () {

                            window.hapusPembayaran(
                                item.id
                            );

                        }
                    );


                riwayat.appendChild(
                    li
                );

            }
        );


    } catch (error) {

        console.error(
            "Gagal memuat riwayat pembayaran:",
            error
        );


        riwayat.innerHTML = `

            <li class="list-group-item text-center text-danger border-0 py-4">

                <i class="bi bi-exclamation-triangle fs-3 d-block mb-2"></i>

                Gagal memuat riwayat pembayaran.

            </li>

        `;

    }

}


// ======================================================
// PASANG EVENT
// ======================================================

function pasangEventPembayaran() {

    const jenisEl =
        el("jenis");

    const tipeEl =
        el("tipeBeras");

    const tombol =
        getTombolSimpan();


    if (jenisEl) {

        jenisEl.addEventListener(
            "change",
            window.pilihPembayaran
        );

    }


    if (tipeEl) {

        tipeEl.addEventListener(
            "change",
            window.aturBeras
        );

    }


    if (tombol) {

        // Hapus onclick lama agar tidak terjadi double submit
        tombol.removeAttribute(
            "onclick"
        );


        tombol.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                window.simpanPembayaran();

            }
        );

    }

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


        await tampilkanSantri();

        await tampilkanRiwayat();

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
        pasangEventPembayaran
    );

}

else {

    pasangEventPembayaran();

}

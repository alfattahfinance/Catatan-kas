// ======================================
// Pengeluaran Pondok
// js/pengeluaran.js
// Versi: 1.0.1
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// REFERENSI COLLECTION
// ======================================

const expensesRef = collection(db, "expenses");


// ======================================
// FORMAT RUPIAH
// ======================================

function formatRupiah(nilai) {

    return (
        "Rp " +
        Number(nilai || 0)
            .toLocaleString("id-ID")
    );

}


// ======================================
// ESCAPE HTML
// ======================================

function escapeHTML(nilai) {

    return String(nilai ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================
// FORMAT TANGGAL
// ======================================

function formatTanggal(tanggal) {

    if (!tanggal) {
        return "-";
    }

    const bagian =
        String(tanggal).split("-");

    if (bagian.length !== 3) {
        return tanggal;
    }

    return (
        `${bagian[2]}-${bagian[1]}-${bagian[0]}`
    );

}


// ======================================
// SIMPAN PENGELUARAN
// ======================================

window.simpanPengeluaran = async function () {

    console.log(
        "Tombol Simpan Pengeluaran ditekan"
    );


    const jenisEl =
        document.getElementById("jenis");

    const keteranganEl =
        document.getElementById("keterangan");

    const tanggalEl =
        document.getElementById("tanggal");

    const jumlahEl =
        document.getElementById("jumlah");

    const satuanEl =
        document.getElementById("satuan");


    if (
        !jenisEl ||
        !keteranganEl ||
        !tanggalEl ||
        !jumlahEl ||
        !satuanEl
    ) {

        alert(
            "❌ Form pengeluaran tidak lengkap."
        );

        console.error(
            "Element form pengeluaran tidak ditemukan."
        );

        return;
    }


    const jenis =
        jenisEl.value.trim();

    const keterangan =
        keteranganEl.value.trim();

    const tanggal =
        tanggalEl.value;

    const jumlah =
        Number(jumlahEl.value);

    const satuan =
        satuanEl.value || "Rupiah";


    // ======================================
    // VALIDASI
    // ======================================

    if (!jenis) {

        alert(
            "Pilih jenis pengeluaran terlebih dahulu."
        );

        jenisEl.focus();

        return;
    }


    if (!keterangan) {

        alert(
            "Keterangan belum diisi."
        );

        keteranganEl.focus();

        return;
    }


    if (!tanggal) {

        alert(
            "Tanggal belum dipilih."
        );

        tanggalEl.focus();

        return;
    }


    if (
        !Number.isFinite(jumlah) ||
        jumlah <= 0
    ) {

        alert(
            "Masukkan jumlah pengeluaran yang valid."
        );

        jumlahEl.focus();

        return;
    }


    try {

        console.log(
            "Menyimpan ke Firestore..."
        );


        const docRef =
            await addDoc(
                expensesRef,
                {

                    jenis:
                        jenis,

                    keterangan:
                        keterangan,

                    tanggal:
                        tanggal,

                    jumlah:
                        jumlah,

                    satuan:
                        satuan,

                    createdAt:
                        serverTimestamp()

                }
            );


        console.log(
            "Berhasil disimpan:",
            docRef.id
        );


        alert(
            "✅ Pengeluaran berhasil disimpan!"
        );


        // ======================================
        // RESET FORM
        // ======================================

        jenisEl.value = "";

        keteranganEl.value = "";

        jumlahEl.value = "";

        satuanEl.value = "Rupiah";


        // Tanggal kembali hari ini

        isiTanggalHariIni();


        await tampilkanRiwayatPengeluaran();


    } catch (error) {

        console.error(
            "ERROR FIREBASE:",
            error
        );


        alert(
            "❌ Gagal menyimpan pengeluaran!\n\n" +
            (error.code || "unknown-error") +
            "\n" +
            error.message
        );

    }

};


// ======================================
// EDIT PENGELUARAN
// ======================================

window.editPengeluaran =
    async function (
        id,
        jenisLama,
        keteranganLama,
        tanggalLama,
        jumlahLama,
        satuanLama
    ) {

        if (!id) {

            alert(
                "❌ ID pengeluaran tidak ditemukan."
            );

            return;
        }


        // ==================================
        // JENIS
        // ==================================

        const jenis =
            prompt(
                "Jenis pengeluaran:",
                jenisLama || ""
            );


        if (jenis === null) {
            return;
        }


        if (!jenis.trim()) {

            alert(
                "Jenis pengeluaran tidak boleh kosong."
            );

            return;
        }


        // ==================================
        // KETERANGAN
        // ==================================

        const keterangan =
            prompt(
                "Keterangan:",
                keteranganLama || ""
            );


        if (keterangan === null) {
            return;
        }


        if (!keterangan.trim()) {

            alert(
                "Keterangan tidak boleh kosong."
            );

            return;
        }


        // ==================================
        // TANGGAL
        // ==================================

        const tanggal =
            prompt(
                "Tanggal (YYYY-MM-DD):",
                tanggalLama || ""
            );


        if (tanggal === null) {
            return;
        }


        if (!tanggal.trim()) {

            alert(
                "Tanggal tidak boleh kosong."
            );

            return;
        }


        // ==================================
        // SATUAN
        // ==================================

        const satuan =
            prompt(
                "Satuan (Rupiah / Liter):",
                satuanLama || "Rupiah"
            );


        if (satuan === null) {
            return;
        }


        const satuanNormal =
            satuan.trim().toLowerCase();


        let satuanFinal;


        if (
            satuanNormal === "liter"
        ) {

            satuanFinal = "Liter";

        } else {

            satuanFinal = "Rupiah";

        }


        // ==================================
        // JUMLAH
        // ==================================

        const jumlahInput =
            prompt(
                satuanFinal === "Liter"
                    ? "Jumlah (Liter):"
                    : "Jumlah (Rupiah):",
                jumlahLama || 0
            );


        if (jumlahInput === null) {
            return;
        }


        const jumlah =
            Number(
                String(jumlahInput)
                    .replace(/\./g, "")
                    .replace(/,/g, ".")
            );


        if (
            !Number.isFinite(jumlah) ||
            jumlah <= 0
        ) {

            alert(
                "❌ Jumlah tidak valid."
            );

            return;
        }


        // ==================================
        // KONFIRMASI
        // ==================================

        const yakin =
            confirm(
                "Apakah data pengeluaran akan diperbarui?"
            );


        if (!yakin) {
            return;
        }


        try {

            console.log(
                "Mengubah data:",
                id
            );


            await updateDoc(
                doc(
                    db,
                    "expenses",
                    id
                ),
                {

                    jenis:
                        jenis.trim(),

                    keterangan:
                        keterangan.trim(),

                    tanggal:
                        tanggal.trim(),

                    jumlah:
                        jumlah,

                    satuan:
                        satuanFinal

                }
            );


            console.log(
                "Berhasil mengubah:",
                id
            );


            alert(
                "✅ Pengeluaran berhasil diubah!"
            );


            await tampilkanRiwayatPengeluaran();


        } catch (error) {

            console.error(
                "Gagal mengubah pengeluaran:",
                error
            );


            alert(
                "❌ Gagal mengubah pengeluaran!\n\n" +
                (error.code || "unknown-error") +
                "\n" +
                error.message
            );

        }

    };


// ======================================
// HAPUS PENGELUARAN
// ======================================

window.hapusPengeluaran =
    async function (id) {

        if (!id) {

            alert(
                "❌ ID pengeluaran tidak ditemukan."
            );

            return;
        }


        const yakin =
            confirm(
                "⚠️ Apakah kamu yakin ingin menghapus pengeluaran ini?\n\n" +
                "Data yang dihapus tidak dapat dikembalikan."
            );


        if (!yakin) {
            return;
        }


        try {

            console.log(
                "Menghapus data:",
                id
            );


            await deleteDoc(
                doc(
                    db,
                    "expenses",
                    id
                )
            );


            console.log(
                "Berhasil menghapus:",
                id
            );


            alert(
                "✅ Pengeluaran berhasil dihapus!"
            );


            await tampilkanRiwayatPengeluaran();


        } catch (error) {

            console.error(
                "Gagal menghapus pengeluaran:",
                error
            );


            alert(
                "❌ Gagal menghapus pengeluaran!\n\n" +
                (error.code || "unknown-error") +
                "\n" +
                error.message
            );

        }

    };


// ======================================
// TAMPILKAN RIWAYAT PENGELUARAN
// ======================================

async function tampilkanRiwayatPengeluaran() {

    const daftar =
        document.getElementById(
            "daftarPengeluaran"
        );


    if (!daftar) {

        console.error(
            "Element #daftarPengeluaran tidak ditemukan!"
        );

        return;
    }


    try {

        console.log(
            "Mengambil data expenses..."
        );


        const snapshot =
            await getDocs(
                expensesRef
            );


        console.log(
            "Jumlah data:",
            snapshot.size
        );


        daftar.innerHTML = "";


        if (snapshot.empty) {

            daftar.innerHTML = `

                <li
                    class="list-group-item
                           text-center
                           text-muted"
                >

                    Belum ada pengeluaran.

                </li>

            `;

            return;
        }


        // ==================================
        // AMBIL DATA
        // ==================================

        const dataPengeluaran = [];


        snapshot.forEach(
            (docSnapshot) => {

                const data =
                    docSnapshot.data();


                dataPengeluaran.push({

                    id:
                        docSnapshot.id,

                    ...data

                });

            }
        );


        // ==================================
        // URUTKAN TANGGAL TERBARU
        // ==================================

        dataPengeluaran.sort(
            (a, b) => {

                const tanggalA =
                    new Date(
                        a.tanggal ||
                        "1970-01-01"
                    );


                const tanggalB =
                    new Date(
                        b.tanggal ||
                        "1970-01-01"
                    );


                return (
                    tanggalB -
                    tanggalA
                );

            }
        );


        // ==================================
        // TAMPILKAN DATA
        // ==================================

        dataPengeluaran.forEach(
            (data) => {

                const satuan =
                    data.satuan ||
                    "Rupiah";


                let jumlahTampil;


                if (
                    satuan === "Liter"
                ) {

                    jumlahTampil =
                        Number(
                            data.jumlah || 0
                        )
                        .toLocaleString(
                            "id-ID"
                        ) +
                        " Liter";

                } else {

                    jumlahTampil =
                        formatRupiah(
                            data.jumlah
                        );

                }


                const item =
                    document.createElement(
                        "li"
                    );


                item.className =
                    "list-group-item";


                // ==================================
                // DATA AMAN UNTUK HTML
                // ==================================

                const id =
                    escapeHTML(
                        data.id
                    );


                const jenis =
                    escapeHTML(
                        data.jenis || "-"
                    );


                const keterangan =
                    escapeHTML(
                        data.keterangan || "-"
                    );


                const tanggal =
                    escapeHTML(
                        data.tanggal || "-"
                    );


                const tanggalTampil =
                    escapeHTML(
                        formatTanggal(
                            data.tanggal
                        )
                    );


                const jumlah =
                    escapeHTML(
                        data.jumlah || 0
                    );


                const satuanAman =
                    escapeHTML(
                        satuan
                    );


                // ==================================
                // HTML
                // ==================================

                item.innerHTML = `

                    <div
                        class="d-flex
                               justify-content-between
                               align-items-start
                               gap-2"
                    >

                        <div class="me-2">

                            <strong>
                                ${jenis}
                            </strong>

                            <br>

                            <small
                                class="text-muted"
                            >
                                ${keterangan}
                            </small>

                            <br>

                            <small
                                class="text-muted"
                            >
                                📅 ${tanggalTampil}
                            </small>

                        </div>


                        <div class="text-end">

                            <div
                                class="text-danger
                                       fw-bold
                                       mb-2"
                            >
                                ${jumlahTampil}
                            </div>


                            <div
                                class="d-flex
                                       gap-1
                                       justify-content-end"
                            >

                                <button
                                    type="button"
                                    class="btn
                                           btn-sm
                                           btn-warning"
                                    data-action="edit"
                                    data-id="${id}"
                                    data-jenis="${escapeHTML(data.jenis || "")}"
                                    data-keterangan="${escapeHTML(data.keterangan || "")}"
                                    data-tanggal="${escapeHTML(data.tanggal || "")}"
                                    data-jumlah="${jumlah}"
                                    data-satuan="${satuanAman}"
                                >
                                    ✏️ Edit
                                </button>


                                <button
                                    type="button"
                                    class="btn
                                           btn-sm
                                           btn-danger"
                                    data-action="hapus"
                                    data-id="${id}"
                                >
                                    🗑️ Hapus
                                </button>

                            </div>

                        </div>

                    </div>

                `;


                daftar.appendChild(
                    item
                );


            }
        );


        // ==================================
        // EVENT EDIT / HAPUS
        // ==================================

        daftar
            .querySelectorAll(
                '[data-action="edit"]'
            )
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        () => {

                            window.editPengeluaran(

                                button.dataset.id,

                                button.dataset.jenis,

                                button.dataset.keterangan,

                                button.dataset.tanggal,

                                button.dataset.jumlah,

                                button.dataset.satuan

                            );

                        }
                    );

                }
            );


        daftar
            .querySelectorAll(
                '[data-action="hapus"]'
            )
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        () => {

                            window.hapusPengeluaran(
                                button.dataset.id
                            );

                        }
                    );

                }
            );


    } catch (error) {

        console.error(
            "Gagal mengambil riwayat:",
            error
        );


        daftar.innerHTML = `

            <li
                class="list-group-item
                       text-center
                       text-danger"
            >

                ❌ Gagal memuat
                riwayat pengeluaran.

                <br>

                <small>
                    ${escapeHTML(
                        error.message
                    )}
                </small>

            </li>

        `;

    }

}


// ======================================
// TANGGAL HARI INI
// ======================================

function isiTanggalHariIni() {

    const tanggal =
        document.getElementById(
            "tanggal"
        );


    if (!tanggal) {
        return;
    }


    const sekarang =
        new Date();


    const tahun =
        sekarang.getFullYear();


    const bulan =
        String(
            sekarang.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const hari =
        String(
            sekarang.getDate()
        ).padStart(
            2,
            "0"
        );


    tanggal.value =
        `${tahun}-${bulan}-${hari}`;

}


// ======================================
// SAAT HALAMAN SIAP
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        isiTanggalHariIni();

        tampilkanRiwayatPengeluaran();

    }
);

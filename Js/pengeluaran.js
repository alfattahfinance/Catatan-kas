// ======================================
// CATATAN KAS
// Pengeluaran
// js/pengeluaran.js
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
// SIMPAN PENGELUARAN
// ======================================

window.simpanPengeluaran = async function () {

    const jenisElement = document.getElementById("jenis");
    const keteranganElement = document.getElementById("keterangan");
    const tanggalElement = document.getElementById("tanggal");
    const jumlahElement = document.getElementById("jumlah");
    const satuanElement = document.getElementById("satuan");

    if (
        !jenisElement ||
        !keteranganElement ||
        !tanggalElement ||
        !jumlahElement ||
        !satuanElement
    ) {
        console.error("Form pengeluaran tidak lengkap.");
        return;
    }

    const jenis = jenisElement.value;
    const keterangan = keteranganElement.value.trim();
    const tanggal = tanggalElement.value;
    const jumlah = Number(jumlahElement.value);
    const satuan = satuanElement.value;


    if (!jenis) {
        alert("Pilih jenis pengeluaran terlebih dahulu.");
        return;
    }

    if (!keterangan) {
        alert("Keterangan belum diisi.");
        return;
    }

    if (!tanggal) {
        alert("Tanggal belum dipilih.");
        return;
    }

    if (!jumlah || jumlah <= 0) {
        alert("Masukkan jumlah pengeluaran.");
        return;
    }


    try {

        console.log("Menyimpan pengeluaran...");

        const docRef = await addDoc(
            collection(db, "expenses"),
            {
                jenis: jenis,
                keterangan: keterangan,
                tanggal: tanggal,
                jumlah: jumlah,
                satuan: satuan,
                createdAt: serverTimestamp()
            }
        );


        console.log(
            "Pengeluaran berhasil disimpan:",
            docRef.id
        );


        alert("✅ Pengeluaran berhasil disimpan!");


        // Kosongkan form
        jenisElement.value = "";
        keteranganElement.value = "";
        jumlahElement.value = "";
        satuanElement.value = "Rupiah";


        // Reset tampilan satuan
        if (typeof window.ubahSatuan === "function") {
            window.ubahSatuan();
        }


        // Tampilkan ulang riwayat
        await tampilkanRiwayatPengeluaran();


    } catch (error) {

        console.error(
            "Gagal menyimpan pengeluaran:",
            error
        );

        alert(
            "❌ Gagal menyimpan pengeluaran!\n\n" +
            error.message
        );

    }

};


// ======================================
// EDIT PENGELUARAN
// ======================================

window.editPengeluaran = async function (id) {

    try {

        const snapshot = await getDocs(
            collection(db, "expenses")
        );

        let dataLama = null;

        snapshot.forEach((item) => {

            if (item.id === id) {

                dataLama = {
                    id: item.id,
                    ...item.data()
                };

            }

        });


        if (!dataLama) {

            alert(
                "❌ Data pengeluaran tidak ditemukan."
            );

            return;

        }


        // Jenis
        const jenis = prompt(
            "Jenis pengeluaran:",
            dataLama.jenis || ""
        );

        if (jenis === null) return;


        // Keterangan
        const keterangan = prompt(
            "Keterangan:",
            dataLama.keterangan || ""
        );

        if (keterangan === null) return;


        // Tanggal
        const tanggal = prompt(
            "Tanggal (YYYY-MM-DD):",
            dataLama.tanggal || ""
        );

        if (tanggal === null) return;


        // Jumlah
        const jumlahInput = prompt(
            dataLama.satuan === "Liter"
                ? "Jumlah (Liter):"
                : "Jumlah (Rupiah):",
            dataLama.jumlah || 0
        );

        if (jumlahInput === null) return;


        const jumlah = Number(jumlahInput);


        if (!jumlah || jumlah <= 0) {

            alert(
                "❌ Jumlah tidak valid."
            );

            return;

        }


        // Tentukan satuan berdasarkan jenis
        const satuan =
            jenis.trim().toLowerCase() === "beras"
                ? "Liter"
                : "Rupiah";


        await updateDoc(
            doc(db, "expenses", id),
            {
                jenis: jenis.trim(),
                keterangan: keterangan.trim(),
                tanggal: tanggal.trim(),
                jumlah: jumlah,
                satuan: satuan
            }
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
            error.message
        );

    }

};


// ======================================
// HAPUS PENGELUARAN
// ======================================

window.hapusPengeluaran = async function (id) {

    const yakin = confirm(
        "⚠️ Apakah kamu yakin ingin menghapus pengeluaran ini?"
    );

    if (!yakin) return;


    try {

        await deleteDoc(
            doc(db, "expenses", id)
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
            error.message
        );

    }

};


// ======================================
// FORMAT TEKS AMAN
// ======================================

function escapeHTML(teks) {

    return String(teks ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================
// TAMPILKAN RIWAYAT
// ======================================

async function tampilkanRiwayatPengeluaran() {

    const daftar =
        document.getElementById(
            "daftarPengeluaran"
        );


    if (!daftar) {

        console.error(
            "Element daftarPengeluaran tidak ditemukan."
        );

        return;

    }


    try {

        const snapshot =
            await getDocs(
                collection(db, "expenses")
            );


        daftar.innerHTML = "";


        if (snapshot.empty) {

            daftar.innerHTML = `
                <li class="list-group-item text-center text-muted">
                    Belum ada pengeluaran.
                </li>
            `;

            return;

        }


        const dataPengeluaran = [];


        snapshot.forEach((docSnapshot) => {

            dataPengeluaran.push({
                id: docSnapshot.id,
                ...docSnapshot.data()
            });

        });


        // Urutkan tanggal terbaru
        dataPengeluaran.sort((a, b) => {

            const tanggalA =
                new Date(
                    a.tanggal || "1970-01-01"
                );

            const tanggalB =
                new Date(
                    b.tanggal || "1970-01-01"
                );

            return tanggalB - tanggalA;

        });


        // ======================================
        // TAMPILKAN
        // ======================================

        dataPengeluaran.forEach((data) => {

            const jumlah =
                Number(data.jumlah || 0);


            let jumlahTampil;


            if (data.satuan === "Liter") {

                jumlahTampil =
                    jumlah.toLocaleString("id-ID") +
                    " Liter";

            } else {

                jumlahTampil =
                    "Rp " +
                    jumlah.toLocaleString("id-ID");

            }


            const item =
                document.createElement("li");


            item.className =
                "list-group-item";


            item.innerHTML = `

                <div class="d-flex justify-content-between align-items-start gap-2">

                    <div class="me-2">

                        <strong>
                            ${escapeHTML(data.jenis || "-")}
                        </strong>

                        <br>

                        <small class="text-muted">
                            ${escapeHTML(data.keterangan || "-")}
                        </small>

                        <br>

                        <small class="text-muted">
                            📅 ${escapeHTML(data.tanggal || "-")}
                        </small>

                    </div>


                    <div class="text-end">

                        <div class="text-danger fw-bold mb-2">

                            ${jumlahTampil}

                        </div>


                        <div class="d-flex gap-1">

                            <button
                                type="button"
                                class="btn btn-sm btn-warning"
                                data-action="edit"
                                data-id="${escapeHTML(data.id)}"
                            >
                                ✏️ Edit
                            </button>


                            <button
                                type="button"
                                class="btn btn-sm btn-danger"
                                data-action="hapus"
                                data-id="${escapeHTML(data.id)}"
                            >
                                🗑️ Hapus
                            </button>

                        </div>

                    </div>

                </div>

            `;


            daftar.appendChild(item);

        });


    } catch (error) {

        console.error(
            "Gagal mengambil riwayat:",
            error
        );


        daftar.innerHTML = `

            <li class="list-group-item text-center text-danger">

                ❌ Gagal memuat riwayat pengeluaran.

                <br>

                <small>
                    ${escapeHTML(error.message)}
                </small>

            </li>

        `;

    }

}


// ======================================
// EVENT EDIT / HAPUS
// ======================================

document.addEventListener(
    "click",
    function (event) {

        const tombol =
            event.target.closest(
                "[data-action]"
            );


        if (!tombol) return;


        const action =
            tombol.dataset.action;


        const id =
            tombol.dataset.id;


        if (!id) return;


        if (action === "edit") {

            window.editPengeluaran(id);

        }


        if (action === "hapus") {

            window.hapusPengeluaran(id);

        }

    }
);


// ======================================
// TANGGAL HARI INI
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const tanggal =
            document.getElementById(
                "tanggal"
            );


        if (tanggal && !tanggal.value) {

            const sekarang =
                new Date();


            const tahun =
                sekarang.getFullYear();


            const bulan =
                String(
                    sekarang.getMonth() + 1
                ).padStart(2, "0");


            const hari =
                String(
                    sekarang.getDate()
                ).padStart(2, "0");


            tanggal.value =
                `${tahun}-${bulan}-${hari}`;

        }


        tampilkanRiwayatPengeluaran();

    }
);

// ======================================
// Pengeluaran Pondok
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
// Simpan Pengeluaran
// ======================================

window.simpanPengeluaran = async function () {

    console.log("Tombol Simpan Pengeluaran ditekan");

    const jenis = document.getElementById("jenis").value;
    const keterangan = document.getElementById("keterangan").value.trim();
    const tanggal = document.getElementById("tanggal").value;
    const jumlah = Number(document.getElementById("jumlah").value);
    const satuan = document.getElementById("satuan").value;

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

        console.log("Menyimpan ke Firestore...");

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

        console.log("Berhasil disimpan:", docRef.id);

        alert("✅ Pengeluaran berhasil disimpan!");

        document.getElementById("jenis").value = "";
        document.getElementById("keterangan").value = "";
        document.getElementById("jumlah").value = "";
        document.getElementById("satuan").value = "Rupiah";

        await tampilkanRiwayatPengeluaran();

    } catch (error) {

        console.error("ERROR FIREBASE:", error);

        alert(
            "❌ Gagal menyimpan pengeluaran!\n\n" +
            error.code +
            "\n" +
            error.message
        );
    }
};


// ======================================
// EDIT PENGELUARAN
// ======================================

window.editPengeluaran = async function (id, jenisLama, keteranganLama, tanggalLama, jumlahLama, satuanLama) {

    const jenis = prompt(
        "Jenis pengeluaran:",
        jenisLama
    );

    if (jenis === null) return;

    const keterangan = prompt(
        "Keterangan:",
        keteranganLama
    );

    if (keterangan === null) return;

    const tanggal = prompt(
        "Tanggal (YYYY-MM-DD):",
        tanggalLama
    );

    if (tanggal === null) return;

    const jumlahInput = prompt(
        satuanLama === "Liter"
            ? "Jumlah (Liter):"
            : "Jumlah (Rupiah):",
        jumlahLama
    );

    if (jumlahInput === null) return;

    const jumlah = Number(jumlahInput);

    if (!jumlah || jumlah <= 0) {
        alert("❌ Jumlah tidak valid.");
        return;
    }

    try {

        console.log("Mengubah data:", id);

        await updateDoc(
            doc(db, "expenses", id),
            {
                jenis: jenis.trim(),
                keterangan: keterangan.trim(),
                tanggal: tanggal.trim(),
                jumlah: jumlah
            }
        );

        alert("✅ Pengeluaran berhasil diubah!");

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

        console.log("Menghapus data:", id);

        await deleteDoc(
            doc(db, "expenses", id)
        );

        alert("✅ Pengeluaran berhasil dihapus!");

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
// Tampilkan Riwayat Pengeluaran
// ======================================

async function tampilkanRiwayatPengeluaran() {

    const daftar =
        document.getElementById("daftarPengeluaran");

    if (!daftar) {
        console.error(
            "Element daftarPengeluaran tidak ditemukan!"
        );
        return;
    }

    try {

        console.log("Mengambil data expenses...");

        const snapshot = await getDocs(
            collection(db, "expenses")
        );

        console.log(
            "Jumlah data:",
            snapshot.size
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

        let dataPengeluaran = [];

        snapshot.forEach((docSnapshot) => {

            const data = docSnapshot.data();

            dataPengeluaran.push({
                id: docSnapshot.id,
                ...data
            });

        });

        dataPengeluaran.sort((a, b) => {

            const tanggalA =
                new Date(a.tanggal || "1970-01-01");

            const tanggalB =
                new Date(b.tanggal || "1970-01-01");

            return tanggalB - tanggalA;

        });


        // ======================================
        // Tampilkan Data
        // ======================================

        dataPengeluaran.forEach((data) => {

            let jumlahTampil;

            if (data.satuan === "Liter") {

                jumlahTampil =
                    Number(data.jumlah || 0)
                    .toLocaleString("id-ID") +
                    " Liter";

            } else {

                jumlahTampil =
                    "Rp " +
                    Number(data.jumlah || 0)
                    .toLocaleString("id-ID");

            }


            const item =
                document.createElement("li");

            item.className =
                "list-group-item";


            item.innerHTML = `

                <div class="d-flex justify-content-between align-items-start">

                    <div class="me-2">

                        <strong>
                            ${data.jenis || "-"}
                        </strong>

                        <br>

                        <small class="text-muted">
                            ${data.keterangan || "-"}
                        </small>

                        <br>

                        <small class="text-muted">
                            📅 ${data.tanggal || "-"}
                        </small>

                    </div>

                    <div class="text-end">

                        <div class="text-danger fw-bold mb-2">

                            ${jumlahTampil}

                        </div>

                        <div class="d-flex gap-1">

                            <button
                                class="btn btn-sm btn-warning"
                                onclick="editPengeluaran(
                                    '${data.id}',
                                    '${String(data.jenis || "").replace(/'/g, "\\'")}',
                                    '${String(data.keterangan || "").replace(/'/g, "\\'")}',
                                    '${data.tanggal || ""}',
                                    '${data.jumlah || 0}',
                                    '${data.satuan || "Rupiah"}'
                                )">

                                ✏️ Edit

                            </button>

                            <button
                                class="btn btn-sm btn-danger"
                                onclick="hapusPengeluaran('${data.id}')">

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
                    ${error.message}
                </small>

            </li>

        `;
    }
}


// ======================================
// Tanggal Hari Ini
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const tanggal =
            document.getElementById("tanggal");

        if (tanggal) {

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

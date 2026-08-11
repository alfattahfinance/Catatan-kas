// ======================================
// Syahriyyah App
// Pembayaran Santri
// Bagian 1 & 2 (Lengkap dengan Edit & Hapus Firebase)
// ======================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ======================================
// Elemen HTML
// ======================================

const selectSantri = document.getElementById("santri");
const riwayat = document.getElementById("riwayat");

// Variabel global untuk mode Edit database
let idEditPembayaran = null;


// ======================================
// Tampilkan Data Santri
// ======================================

async function tampilkanSantri() {

    try {

        selectSantri.innerHTML = `
            <option value="">
                Pilih Santri
            </option>
        `;

        const snapshot = await getDocs(
            collection(db, "santri")
        );

        snapshot.forEach((docItem) => {

            const data = docItem.data();

            selectSantri.innerHTML += `
                <option value="${data.nama}">
                    ${data.nama}
                </option>
            `;

        });

    } catch (error) {

        console.error(error);

        alert("Gagal mengambil data santri.");

    }

}


// ======================================
// Pilihan Pembayaran
// ======================================

window.pilihPembayaran = function () {

    const jenis = document.getElementById("jenis").value;

    const nominal = document.getElementById("nominal");

    const beras = document.getElementById("berasPilihan");

    beras.style.display = "none";

    nominal.placeholder = "Masukkan nominal";

    if (jenis === "SPP") {

        nominal.value = 50000;

    }

    else if (jenis === "Syahriyyah") {

        nominal.value = 80000;

    }

    else if (jenis === "Kas") {

        nominal.value = 30000;

    }

    else if (jenis === "Infaq") {

        nominal.value = "";

    }

    else if (jenis === "Beras") {

        nominal.value = "";

        beras.style.display = "block";

    }

    else {

        nominal.value = "";

    }

};


// ======================================
// Pengaturan Beras
// ======================================

window.aturBeras = function () {

    const tipe = document.getElementById("tipeBeras").value;

    const nominal = document.getElementById("nominal");

    if (tipe === "uang") {

        nominal.placeholder = "Masukkan nominal";

        nominal.value = 120000;

    }

    else {

        nominal.placeholder = "Masukkan jumlah liter";

        nominal.value = "";

    }

};


// ======================================
// Simpan / Perbarui Pembayaran (Firebase)
// ======================================

window.simpanPembayaran = async function () {

    const nama = document.getElementById("santri").value;
    const jenis = document.getElementById("jenis").value;
    const nilai = document.getElementById("nominal").value;
    const tipeBeras = document.getElementById("tipeBeras").value;

    if (!nama || !jenis || !nilai) {

        alert("Silakan lengkapi data pembayaran.");
        return;

    }

    const data = {
        nama_santri: nama,
        jenis: jenis,
    };

    // ==========================
    // Pembayaran Beras
    // ==========================

    if (jenis === "Beras") {

        if (tipeBeras === "liter") {

            data.nominal = 0;
            data.jumlah = Number(nilai);
            data.satuan = "Liter";

        } else {

            data.nominal = Number(nilai);
            data.jumlah = 0;
            data.satuan = "Rupiah";

        }

    }

    // ==========================
    // Pembayaran Uang
    // ==========================

    else {

        data.nominal = Number(nilai);
        data.jumlah = 0;
        data.satuan = "Rupiah";

    }

    try {

        if (idEditPembayaran === null) {
            // Mode Tambah Baru
            data.tanggal = serverTimestamp();
            data.bulan = new Date().getMonth() + 1;
            data.tahun = new Date().getFullYear();

            await addDoc(collection(db, "payments"), data);
            alert("Pembayaran berhasil disimpan.");

        } else {
            // Mode Edit (Update data di Firebase berdasarkan ID dokumen)
            await updateDoc(doc(db, "payments", idEditPembayaran), data);
            alert("Pembayaran berhasil diperbarui.");

            // Reset mode edit
            idEditPembayaran = null;
            document.querySelector("button[onclick='simpanPembayaran()']").textContent = "Simpan Pembayaran";
        }

        // Reset Form
        document.getElementById("nominal").value = "";
        document.getElementById("jenis").value = "";
        document.getElementById("santri").value = "";
        document.getElementById("berasPilihan").style.display = "none";

        tampilkanRiwayat();

    } catch (error) {

        console.error(error);

        alert("Gagal menyimpan pembayaran ke database.");

    }

};


// ======================================
// Hapus Pembayaran (Firebase)
// ======================================

window.hapusPembayaran = async function (idDoc) {
    if (confirm("Apakah Anda yakin ingin menghapus data pembayaran ini dari database?")) {
        try {
            await deleteDoc(doc(db, "payments", idDoc));
            alert("Data berhasil dihapus.");
            tampilkanRiwayat();
        } catch (error) {
            console.error(error);
            alert("Gagal menghapus data.");
        }
    }
};


// ======================================
// Ambil Data untuk Diedit
// ======================================

window.mulaiEditPembayaran = async function (idDoc, nama, jenis, nominal, jumlah, satuan) {
    idEditPembayaran = idDoc;

    document.getElementById("santri").value = nama;
    document.getElementById("jenis").value = jenis;

    const inputNominal = document.getElementById("nominal");
    const berasPilihan = document.getElementById("berasPilihan");

    berasPilihan.style.display = "none";

    if (jenis === "Beras") {
        berasPilihan.style.display = "block";
        if (satuan === "Liter") {
            document.getElementById("tipeBeras").value = "liter";
            inputNominal.value = jumlah;
            inputNominal.placeholder = "Masukkan jumlah liter";
        } else {
            document.getElementById("tipeBeras").value = "uang";
            inputNominal.value = nominal;
            inputNominal.placeholder = "Masukkan nominal";
        }
    } else {
        inputNominal.value = nominal;
    }

    // Ubah teks tombol simpan
    document.querySelector("button[onclick='simpanPembayaran()']").textContent = "Simpan Perubahan";
    
    // Gulir ke atas form
    window.scrollTo({ top: 0, behavior: 'smooth' });
};


// ======================================
// Tampilkan Riwayat Pembayaran
// ======================================

async function tampilkanRiwayat() {

    if (!riwayat) return;

    riwayat.innerHTML = `
        <li class="list-group-item text-center">
            Memuat data...
        </li>
    `;

    try {

        const q = query(
            collection(db, "payments"),
            orderBy("tanggal", "desc")
        );

        const snapshot = await getDocs(q);

        riwayat.innerHTML = "";

        if (snapshot.empty) {

            riwayat.innerHTML = `
                <li class="list-group-item text-center text-muted">
                    Belum ada pembayaran.
                </li>
            `;

            return;

        }

        snapshot.forEach((docItem) => {

            const data = docItem.data();
            const idDoc = docItem.id; // ID Unik dari Firebase Firestore

            let nilai = "";

            if (data.satuan === "Liter") {

                nilai = `${data.jumlah} Liter`;

            } else {

                nilai = "Rp " + Number(data.nominal || 0)
                    .toLocaleString("id-ID");

            }

            let tanggal = "-";

            if (data.tanggal) {

                tanggal = data.tanggal
                    .toDate()
                    .toLocaleDateString("id-ID");

            }

            riwayat.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                    <div>
                        <strong>${data.nama_santri}</strong>
                        <br>
                        ${data.jenis}
                        <br>
                        <span class="text-success fw-bold">${nilai}</span>
                        <br>
                        <small class="text-muted">${tanggal}</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary mb-1 d-block" onclick="mulaiEditPembayaran('${idDoc}', '${data.nama_santri}', '${data.jenis}', '${data.nominal || 0}', '${data.jumlah || 0}', '${data.satuan || ''}')">
                            Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger d-block" onclick="hapusPembayaran('${idDoc}')">
                            Hapus
                        </button>
                    </div>
                </li>
            `;

        });

    } catch (error) {

        console.error(error);

        riwayat.innerHTML = `
            <li class="list-group-item text-danger">
                Gagal memuat riwayat pembayaran.
            </li>
        `;

    }

}


// ======================================
// Jalankan Saat Halaman Dibuka
// ======================================

window.addEventListener("DOMContentLoaded", async () => {

    await tampilkanSantri();

    await tampilkanRiwayat();

});

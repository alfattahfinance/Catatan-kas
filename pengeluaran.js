// ======================================================
// CATATAN KAS - PENGELUARAN
// PERBAIKAN STABIL
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

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

let userAktif = null;
let idEdit = null;
let unsubscribePengeluaran = null;
let sedangMemuat = false;

const $ = (id) => document.getElementById(id);

function cari(...ids) {
    for (const id of ids) {
        const el = $(id);
        if (el) return el;
    }
    return null;
}

function rupiah(nilai) {
    const angka = Number(nilai) || 0;
    return "Rp " + angka.toLocaleString("id-ID");
}

function amanHTML(teks) {
    return String(teks ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Mendukung 15000, 15.000, Rp 15.000 dan 15.000,00.
function parseNominal(nilai) {
    if (nilai === null || nilai === undefined) return 0;

    let s = String(nilai)
        .trim()
        .replace(/rp/gi, "")
        .replace(/\s/g, "");

    if (!s) return 0;

    if (s.includes(".") && s.includes(",")) {
        s = s.replace(/\./g, "").replace(",", ".");
    } else if (s.includes(",")) {
        const bagian = s.split(",");
        if (bagian.length === 2 && /^\d{1,2}$/.test(bagian[1])) {
            s = bagian[0].replace(/\./g, "") + "." + bagian[1];
        } else {
            s = s.replace(/,/g, "");
        }
    } else if (s.includes(".")) {
        s = s.replace(/\./g, "");
    }

    const angka = Number(s.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(angka) ? angka : 0;
}

function ambilKeterangan() {
    const el = cari("keteranganPengeluaran", "keterangan", "namaPengeluaran", "nama", "deskripsi");
    return el ? String(el.value || "").trim() : "";
}

function ambilJenis() {
    const el = cari("jenisPengeluaran", "jenis", "kategoriPengeluaran", "kategori");
    return el ? String(el.value || "").trim() : "";
}

function ambilNominal() {
    const el = cari("nominalPengeluaran", "nominal", "jumlah", "total");
    return el ? parseNominal(el.value) : 0;
}

function ambilTanggal() {
    const el = cari("tanggalPengeluaran", "tanggal", "tglPengeluaran");
    return el && el.value ? String(el.value) : null;
}

function ambilSatuan() {
    const el = cari("satuanPengeluaran", "satuan");
    return el ? String(el.value || "Rupiah") : "Rupiah";
}

function tombolSimpan() {
    return cari("btnSimpanPengeluaran", "simpanPengeluaran") ||
        document.querySelector("button[onclick*='simpanPengeluaran']");
}

function tanggalHariIni() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function kosongkanForm() {
    const keterangan = cari("keteranganPengeluaran", "keterangan", "namaPengeluaran", "nama", "deskripsi");
    const nominal = cari("nominalPengeluaran", "nominal", "jumlah", "total");
    const tanggal = cari("tanggalPengeluaran", "tanggal", "tglPengeluaran");

    if (keterangan) keterangan.value = "";
    if (nominal) nominal.value = "";
    if (tanggal) tanggal.value = tanggalHariIni();

    idEdit = null;
    const tombol = tombolSimpan();
    if (tombol) {
        tombol.disabled = false;
        tombol.innerHTML = "Simpan Pengeluaran";
    }
}

function refreshDashboard() {
    const waktu = Date.now();
    try { localStorage.setItem("catatanKasDataBerubah", String(waktu)); } catch (_) {}
    try {
        window.dispatchEvent(new CustomEvent("dataKeuanganBerubah", {
            detail: { tipe: "pengeluaran", waktu }
        }));
        window.dispatchEvent(new Event("refreshDashboard"));
    } catch (_) {}
}

function ambilNominalData(data) {
    return parseNominal(data?.nominal ?? data?.jumlah ?? data?.nilai ?? data?.harga ?? data?.total ?? 0);
}

function ambilKeteranganData(data) {
    return String(data?.keterangan ?? data?.nama ?? data?.deskripsi ?? data?.uraian ?? "Pengeluaran");
}

function ambilJenisData(data) {
    return String(data?.jenis ?? data?.kategori ?? "Lainnya");
}

function formatTanggal(nilai) {
    if (!nilai) return "";
    if (typeof nilai.toDate === "function") return nilai.toDate().toLocaleDateString("id-ID");

    const teks = String(nilai);
    if (/^\d{4}-\d{2}-\d{2}$/.test(teks)) {
        const [tahun, bulan, hari] = teks.split("-");
        return `${hari}/${bulan}/${tahun}`;
    }

    const d = new Date(teks);
    return Number.isNaN(d.getTime()) ? teks : d.toLocaleDateString("id-ID");
}

function waktuUrut(data) {
    if (data?.createdAt && typeof data.createdAt.toDate === "function") return data.createdAt.toDate().getTime();
    if (data?.tanggal) {
        const d = new Date(`${data.tanggal}T00:00:00`);
        if (!Number.isNaN(d.getTime())) return d.getTime();
    }
    if (data?.updatedAt && typeof data.updatedAt.toDate === "function") return data.updatedAt.toDate().getTime();
    return 0;
}

function renderPengeluaran(snapshot) {
    const wadah = $("daftarPengeluaran");
    if (!wadah) return;

    const daftar = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    daftar.sort((a, b) => waktuUrut(b) - waktuUrut(a));

    if (!daftar.length) {
        wadah.innerHTML = `
            <div class="list-group-item text-center text-muted py-4">
                <i class="bi bi-receipt fs-3 d-block mb-2"></i>
                Belum ada data pengeluaran.
            </div>`;
        return;
    }

    wadah.innerHTML = daftar.map((item) => {
        const id = amanHTML(item.id);
        const keterangan = amanHTML(ambilKeteranganData(item));
        const jenis = amanHTML(ambilJenisData(item));
        const nominal = rupiah(ambilNominalData(item));
        const tanggal = amanHTML(formatTanggal(item.tanggal || item.createdAt));

        return `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <div class="flex-grow-1 min-width-0">
                        <div class="fw-bold text-danger">${keterangan}</div>
                        <div class="small text-muted">${jenis}${tanggal ? " • " + tanggal : ""}</div>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold text-danger">${nominal}</div>
                        <div class="mt-2 d-flex gap-1 justify-content-end">
                            <button type="button" class="btn btn-sm btn-outline-primary" onclick="editPengeluaran('${id}')">
                                <i class="bi bi-pencil"></i> Edit
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="hapusPengeluaran('${id}')">
                                <i class="bi bi-trash"></i> Hapus
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join("");
}

function mulaiRealtime() {
    if (unsubscribePengeluaran) {
        unsubscribePengeluaran();
        unsubscribePengeluaran = null;
    }

    unsubscribePengeluaran = onSnapshot(
        collection(db, "expenses"),
        (snapshot) => {
            console.log("Expenses realtime:", snapshot.size);
            renderPengeluaran(snapshot);
            refreshDashboard();
        },
        (error) => {
            console.error("Gagal membaca expenses:", error);
            const wadah = $("daftarPengeluaran");
            if (wadah) {
                wadah.innerHTML = `
                    <div class="list-group-item text-danger">
                        <i class="bi bi-exclamation-triangle"></i>
                        Gagal membaca data pengeluaran. Periksa koneksi dan Firebase Rules.
                    </div>`;
            }
        }
    );
}

window.simpanPengeluaran = async function () {
    if (!userAktif) {
        alert("Anda belum login ke Firebase. Silakan login terlebih dahulu.");
        return;
    }
    if (sedangMemuat) return;

    const keterangan = ambilKeterangan();
    const jenis = ambilJenis() || "Lainnya";
    const nominal = ambilNominal();
    const tanggal = ambilTanggal() || tanggalHariIni();
    const satuan = ambilSatuan();

    if (!keterangan) {
        alert("Keterangan pengeluaran belum diisi.");
        return;
    }
    if (!(nominal > 0)) {
        alert("Nominal pengeluaran belum benar.");
        return;
    }

    const tombol = tombolSimpan();
    sedangMemuat = true;
    if (tombol) {
        tombol.disabled = true;
        tombol.innerHTML = idEdit ? "Menyimpan perubahan..." : "Menyimpan...";
    }

    try {
        const data = {
            keterangan,
            nama: keterangan,
            deskripsi: keterangan,
            jenis,
            kategori: jenis,
            nominal,
            jumlah: nominal,
            total: nominal,
            satuan,
            tanggal,
            uid: userAktif.uid,
            userId: userAktif.uid,
            updatedAt: serverTimestamp()
        };

        if (idEdit) {
            await updateDoc(doc(db, "expenses", idEdit), data);
            alert("Pengeluaran berhasil diperbarui.");
        } else {
            data.createdAt = serverTimestamp();
            const hasil = await addDoc(collection(db, "expenses"), data);
            console.log("Pengeluaran tersimpan:", hasil.id);
            alert("Pengeluaran berhasil disimpan.");
        }

        kosongkanForm();
        refreshDashboard();
    } catch (error) {
        console.error("Gagal menyimpan pengeluaran:", error);
        let pesan = error?.message || String(error);
        if (error?.code === "permission-denied") {
            pesan = "Firestore menolak akses. Pastikan akun login dan Firebase Rules mengizinkan operasi expenses.";
        }
        alert(`Gagal menyimpan pengeluaran.\n\n${pesan}`);
    } finally {
        sedangMemuat = false;
        if (tombol) {
            tombol.disabled = false;
            tombol.innerHTML = idEdit ? "Simpan Perubahan" : "Simpan Pengeluaran";
        }
    }
};

window.editPengeluaran = async function (id) {
    if (!userAktif) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    try {
        const snapshot = await getDoc(doc(db, "expenses", id));
        if (!snapshot.exists()) {
            alert("Data pengeluaran tidak ditemukan.");
            return;
        }

        const data = snapshot.data();
        idEdit = id;

        const keterangan = cari("keteranganPengeluaran", "keterangan", "namaPengeluaran", "nama", "deskripsi");
        const jenis = cari("jenisPengeluaran", "jenis", "kategoriPengeluaran", "kategori");
        const nominal = cari("nominalPengeluaran", "nominal", "jumlah", "total");
        const tanggal = cari("tanggalPengeluaran", "tanggal", "tglPengeluaran");
        const satuan = cari("satuanPengeluaran", "satuan");

        if (keterangan) keterangan.value = ambilKeteranganData(data);
        if (jenis) jenis.value = data.jenis || data.kategori || "";
        if (nominal) nominal.value = ambilNominalData(data);
        if (tanggal) tanggal.value = data.tanggal || tanggalHariIni();
        if (satuan) satuan.value = data.satuan || "Rupiah";

        const tombol = tombolSimpan();
        if (tombol) tombol.innerHTML = "Simpan Perubahan";
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
        console.error("Gagal membuka data pengeluaran:", error);
        alert(`Gagal membuka data pengeluaran.\n\n${error?.message || error}`);
    }
};

window.hapusPengeluaran = async function (id) {
    if (!userAktif) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    if (!confirm("Hapus data pengeluaran ini?\n\nData yang sudah dihapus tidak dapat dikembalikan.")) return;

    try {
        await deleteDoc(doc(db, "expenses", id));
        if (idEdit === id) kosongkanForm();
        alert("Pengeluaran berhasil dihapus.");
        refreshDashboard();
    } catch (error) {
        console.error("Gagal menghapus pengeluaran:", error);
        let pesan = error?.message || String(error);
        if (error?.code === "permission-denied") {
            pesan = "Firestore menolak penghapusan. Periksa Firebase Rules dan pastikan akun memiliki izin.";
        }
        alert(`Gagal menghapus pengeluaran.\n\n${pesan}`);
    }
};

window.batalEditPengeluaran = function () {
    kosongkanForm();
};

function init() {
    const tanggal = cari("tanggalPengeluaran", "tanggal", "tglPengeluaran");
    if (tanggal && !tanggal.value) tanggal.value = tanggalHariIni();

    onAuthStateChanged(auth, (user) => {
        userAktif = user || null;
        if (userAktif) {
            mulaiRealtime();
        } else if (unsubscribePengeluaran) {
            unsubscribePengeluaran();
            unsubscribePengeluaran = null;
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

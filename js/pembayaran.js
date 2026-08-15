// ======================================================
// CATATAN KAS - PEMBAYARAN
// FIX SIMPAN + RIWAYAT + EDIT + HAPUS
// ======================================================

import { db, auth } from "./firebase-config.js";

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

let idEditPembayaran = null;
let userSiap = false;

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function rupiah(value) {
    return "Rp " + Number(value || 0).toLocaleString("id-ID");
}

function getNama() {
    return (
        $("namaSantriPemasukan") ||
        $("namaSantri") ||
        $("santri")
    );
}

function getJenis() {
    return $("jenis");
}

function getNominal() {
    return $("nominal");
}

function getTombol() {
    return (
        $("btnSimpanPembayaran") ||
        document.querySelector(
            "button[onclick*='simpanPembayaran']"
        )
    );
}

// ======================================================
// LOGIN
// ======================================================

onAuthStateChanged(auth, async (user) => {

    userSiap = !!user;

    if (user) {
        console.log("Pembayaran: user login", user.uid);

        await isiDaftarSantri();
        await tampilkanRiwayat();
    } else {
        console.warn("Pembayaran: belum login");
    }

});

// ======================================================
// DAFTAR SANTRI
// ======================================================

async function isiDaftarSantri() {

    const input = getNama();
    const select = $("santri");
    const datalist = $("datalistSantri");

    try {

        const snap = await getDocs(
            collection(db, "santri")
        );

        if (select && select.tagName === "SELECT") {

            select.innerHTML =
                '<option value="">Pilih Santri</option>';

        }

        if (datalist) {
            datalist.innerHTML = "";
        }

        snap.forEach((item) => {

            const data = item.data();

            if (!data.nama) return;

            if (
                select &&
                select.tagName === "SELECT"
            ) {

                const option =
                    document.createElement("option");

                option.value = data.nama;
                option.textContent = data.nama;

                select.appendChild(option);
            }

            if (datalist) {

                const option =
                    document.createElement("option");

                option.value = data.nama;

                datalist.appendChild(option);
            }

        });

    } catch (error) {

        console.error(
            "Gagal memuat santri:",
            error
        );

    }

}

// ======================================================
// PILIH PEMBAYARAN
// ======================================================

window.pilihPembayaran = function () {

    const jenis = getJenis();
    const nominal = getNominal();

    if (!jenis || !nominal) return;

    const nilai = jenis.value;

    if (nilai === "SPP") {
        nominal.value = "50000";
    }

    else if (nilai === "Syahriyyah") {
        nominal.value = "80000";
    }

    else if (nilai === "Kas") {
        nominal.value = "30000";
    }

    else {
        nominal.value = "";
    }

};

// ======================================================
// SIMPAN PEMBAYARAN
// ======================================================

window.simpanPembayaran = async function () {

    const namaEl = getNama();
    const jenisEl = getJenis();
    const nominalEl = getNominal();
    const tombol = getTombol();

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
        String(namaEl.value || "").trim();

    const jenis =
        String(jenisEl.value || "").trim();

    const nominal =
        Number(nominalEl.value);

    // VALIDASI

    if (!nama) {

        alert("Silakan isi nama santri.");

        namaEl.focus();

        return;
    }

    if (!jenis) {

        alert("Silakan pilih jenis pembayaran.");

        jenisEl.focus();

        return;
    }

    if (
        !Number.isFinite(nominal) ||
        nominal <= 0
    ) {

        alert("Nominal harus lebih dari 0.");

        nominalEl.focus();

        return;
    }

    if (!userSiap) {

        alert(
            "Belum login ke Firebase. Silakan login terlebih dahulu."
        );

        return;
    }

    if (tombol) {

        tombol.disabled = true;

        tombol.innerHTML =
            "⏳ Menyimpan...";

    }

    try {

        const data = {

            nama_santri:
                nama,

            namaSantri:
                nama,

            jenis:
                jenis,

            nominal:
                nominal,

            jumlah:
                nominal,

            satuan:
                "Rupiah",

            tanggal:
                serverTimestamp(),

            createdAt:
                serverTimestamp(),

            bulan:
                new Date().getMonth() + 1,

            tahun:
                new Date().getFullYear(),

            uid:
                auth.currentUser?.uid || null

        };

        // EDIT

        if (idEditPembayaran) {

            delete data.tanggal;
            delete data.createdAt;

            await updateDoc(
                doc(
                    db,
                    "payments",
                    idEditPembayaran
                ),
                data
            );

            alert(
                "Pembayaran berhasil diperbarui."
            );

        }

        // TAMBAH

        else {

            await addDoc(
                collection(
                    db,
                    "payments"
                ),
                data
            );

            alert(
                "Pembayaran berhasil disimpan."
            );

        }

        resetForm();

        await tampilkanRiwayat();

        window.dispatchEvent(
            new Event("dataKeuanganBerubah")
        );

    }

    catch (error) {

        console.error(
            "ERROR SIMPAN PEMBAYARAN:",
            error
        );

        alert(
            "Gagal menyimpan pembayaran:\n\n" +
            (error?.message || error)
        );

    }

    finally {

        if (tombol) {

            tombol.disabled = false;

            tombol.innerHTML =
                "✓ Simpan Pembayaran";

        }

    }

};

// ======================================================
// RIWAYAT
// ======================================================

async function tampilkanRiwayat() {

    const container =
        $("daftarPembayaran") ||
        $("riwayatPembayaran") ||
        $("listPembayaran");

    if (!container) {

        console.warn(
            "Container riwayat pembayaran tidak ditemukan."
        );

        return;
    }

    container.innerHTML =
        `<div class="text-center text-muted p-3">
            Memuat data...
        </div>`;

    try {

        const snap =
            await getDocs(
                collection(
                    db,
                    "payments"
                )
            );

        const data = [];

        snap.forEach((item) => {

            data.push({
                id: item.id,
                ...item.data()
            });

        });

        data.sort((a, b) => {

            const ta =
                a.createdAt?.toDate?.()?.getTime() ||
                a.tanggal?.toDate?.()?.getTime() ||
                0;

            const tb =
                b.createdAt?.toDate?.()?.getTime() ||
                b.tanggal?.toDate?.()?.getTime() ||
                0;

            return tb - ta;

        });

        if (!data.length) {

            container.innerHTML =
                `<div class="text-center text-muted p-4">
                    Belum ada pembayaran.
                </div>`;

            return;
        }

        container.innerHTML =
            data.map((item) => {

                const nama =
                    item.nama_santri ||
                    item.namaSantri ||
                    "-";

                const jenis =
                    item.jenis ||
                    "-";

                const jumlah =
                    Number(
                        item.nominal ??
                        item.jumlah ??
                        0
                    );

                return `
                <div class="card mb-2">
                    <div class="card-body">

                        <div class="d-flex justify-content-between">

                            <div>
                                <strong>
                                    ${escapeHtml(nama)}
                                </strong>

                                <div class="text-muted small">
                                    ${escapeHtml(jenis)}
                                </div>
                            </div>

                            <strong class="text-success">
                                ${rupiah(jumlah)}
                            </strong>

                        </div>

                        <div class="mt-2 d-flex gap-2">

                            <button
                                class="btn btn-sm btn-outline-primary"
                                onclick="editPembayaran('${item.id}')">
                                Edit
                            </button>

                            <button
                                class="btn btn-sm btn-outline-danger"
                                onclick="hapusPembayaran('${item.id}')">
                                Hapus
                            </button>

                        </div>

                    </div>
                </div>
                `;

            }).join("");

    }

    catch (error) {

        console.error(
            "Gagal memuat riwayat pembayaran:",
            error
        );

        container.innerHTML =
            `<div class="text-danger p-3">
                Gagal memuat riwayat.
            </div>`;

    }

}

// ======================================================
// EDIT
// ======================================================

window.editPembayaran =
    async function (id) {

        try {

            const snap =
                await getDocs(
                    collection(
                        db,
                        "payments"
                    )
                );

            let data = null;

            snap.forEach((item) => {

                if (item.id === id) {

                    data = {
                        id: item.id,
                        ...item.data()
                    };

                }

            });

            if (!data) {

                alert(
                    "Data pembayaran tidak ditemukan."
                );

                return;
            }

            idEditPembayaran =
                id;

            const namaEl =
                getNama();

            const jenisEl =
                getJenis();

            const nominalEl =
                getNominal();

            if (namaEl) {

                namaEl.value =
                    data.nama_santri ||
                    data.namaSantri ||
                    "";

            }

            if (jenisEl) {

                jenisEl.value =
                    data.jenis ||
                    "";

            }

            if (nominalEl) {

                nominalEl.value =
                    data.nominal ??
                    data.jumlah ??
                    "";

            }

            const tombol =
                getTombol();

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

            console.error(error);

            alert(
                "Gagal mengambil data pembayaran."
            );

        }

    };

// ======================================================
// HAPUS
// ======================================================

window.hapusPembayaran =
    async function (id) {

        if (!userSiap) {

            alert(
                "Silakan login terlebih dahulu."
            );

            return;
        }

        if (
            !confirm(
                "Hapus pembayaran ini?"
            )
        ) return;

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

            await tampilkanRiwayat();

            window.dispatchEvent(
                new Event("dataKeuanganBerubah")
            );

        }

        catch (error) {

            console.error(error);

            alert(
                "Gagal menghapus pembayaran:\n\n" +
                (error?.message || error)
            );

        }

    };

// ======================================================
// RESET
// ======================================================

function resetForm() {

    idEditPembayaran =
        null;

    const nama =
        getNama();

    const jenis =
        getJenis();

    const nominal =
        getNominal();

    if (nama) nama.value = "";

    if (jenis) jenis.value = "";

    if (nominal) nominal.value = "";

}

// ======================================================
// PASTIKAN TOMBOL TERHUBUNG
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const tombol =
            getTombol();

        if (tombol) {

            tombol.onclick =
                window.simpanPembayaran;

        }

        isiDaftarSantri();

    }
);

console.log(
    "Catatan Kas: pembayaran.js aktif."
);

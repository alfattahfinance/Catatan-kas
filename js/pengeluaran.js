// ======================================================
// CATATAN KAS - PENGELUARAN
// FIX SIMPAN + RIWAYAT + EDIT + HAPUS
// ======================================================

import { db, auth } from "../firebase-config.js";

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

let idEditPengeluaran = null;
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

    return "Rp " +
        Number(value || 0)
            .toLocaleString("id-ID");

}

function getJenis() {

    return (
        $("jenisPengeluaran") ||
        $("jenis")
    );

}

function getKeterangan() {

    return $("keterangan");

}

function getTanggal() {

    return $("tanggal");

}

function getNominal() {

    return (
        $("nominal") ||
        $("jumlah")
    );

}

function getSatuan() {

    return $("satuan");

}

function getTombol() {

    return (
        $("btnSimpanPengeluaran") ||
        document.querySelector(
            "button[onclick*='simpanPengeluaran']"
        ) ||
        document.querySelector(
            ".btn-simpan"
        )
    );

}

// ======================================================
// LOGIN
// ======================================================

onAuthStateChanged(auth, async (user) => {

    userSiap = !!user;

    if (user) {

        console.log(
            "Pengeluaran: user login",
            user.uid
        );

        await muatRiwayatPengeluaran();

    }

});

// ======================================================
// SIMPAN
// ======================================================

window.simpanPengeluaran =
    async function () {

        const jenisEl =
            getJenis();

        const ketEl =
            getKeterangan();

        const tanggalEl =
            getTanggal();

        const nominalEl =
            getNominal();

        const satuanEl =
            getSatuan();

        const tombol =
            getTombol();

        if (
            !jenisEl ||
            !ketEl ||
            !tanggalEl ||
            !nominalEl
        ) {

            alert(
                "Form pengeluaran tidak ditemukan. Silakan refresh aplikasi."
            );

            return;
        }

        const jenis =
            String(
                jenisEl.value || ""
            ).trim();

        const keterangan =
            String(
                ketEl.value || ""
            ).trim();

        const tanggal =
            String(
                tanggalEl.value || ""
            ).trim();

        const jumlah =
            Number(
                nominalEl.value
            );

        const satuan =
            satuanEl?.value ||
            "Rupiah";

        // VALIDASI

        if (!jenis) {

            alert(
                "Silakan pilih jenis pengeluaran."
            );

            jenisEl.focus();

            return;
        }

        if (!keterangan) {

            alert(
                "Silakan isi keterangan."
            );

            ketEl.focus();

            return;
        }

        if (!tanggal) {

            alert(
                "Silakan pilih tanggal."
            );

            tanggalEl.focus();

            return;
        }

        if (
            !Number.isFinite(jumlah) ||
            jumlah <= 0
        ) {

            alert(
                "Nominal harus lebih dari 0."
            );

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

            tombol.disabled =
                true;

            tombol.innerHTML =
                "⏳ Menyimpan...";

        }

        try {

            const data = {

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
                    satuan,

                uid:
                    auth.currentUser?.uid ||
                    null

            };

            // UPDATE

            if (idEditPengeluaran) {

                await updateDoc(
                    doc(
                        db,
                        "expenses",
                        idEditPengeluaran
                    ),
                    data
                );

                alert(
                    "Pengeluaran berhasil diperbarui."
                );

            }

            // TAMBAH

            else {

                data.createdAt =
                    serverTimestamp();

                await addDoc(
                    collection(
                        db,
                        "expenses"
                    ),
                    data
                );

                alert(
                    "Pengeluaran berhasil disimpan."
                );

            }

            resetForm();

            await muatRiwayatPengeluaran();

            window.dispatchEvent(
                new Event(
                    "dataKeuanganBerubah"
                )
            );

        }

        catch (error) {

            console.error(
                "ERROR SIMPAN PENGELUARAN:",
                error
            );

            alert(
                "Gagal menyimpan pengeluaran:\n\n" +
                (error?.message || error)
            );

        }

        finally {

            if (tombol) {

                tombol.disabled =
                    false;

                tombol.innerHTML =
                    "✓ Simpan Pengeluaran";

            }

        }

    };

// ======================================================
// RIWAYAT
// ======================================================

async function muatRiwayatPengeluaran() {

    const container =
        $("daftarPengeluaran");

    if (!container) {

        console.warn(
            "Elemen #daftarPengeluaran tidak ditemukan."
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
                    "expenses"
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
                new Date(
                    a.tanggal || 0
                ).getTime();

            const tb =
                new Date(
                    b.tanggal || 0
                ).getTime();

            return tb - ta;

        });

        if (!data.length) {

            container.innerHTML =
                `<div class="text-center text-muted p-4">
                    Belum ada pengeluaran.
                </div>`;

            return;
        }

        container.innerHTML =
            data.map((item) => {

                const jumlah =
                    Number(
                        item.jumlah ??
                        item.nominal ??
                        0
                    );

                return `
                <div class="card mb-2">

                    <div class="card-body">

                        <div class="d-flex justify-content-between">

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        item.jenis || "-"
                                    )}
                                </strong>

                                <div class="text-muted small">
                                    ${escapeHtml(
                                        item.keterangan || "-"
                                    )}
                                </div>

                                <div class="text-muted small">
                                    ${escapeHtml(
                                        item.tanggal || "-"
                                    )}
                                </div>

                            </div>

                            <strong class="text-danger">
                                ${rupiah(jumlah)}
                            </strong>

                        </div>

                        <div class="mt-2 d-flex gap-2">

                            <button
                                class="btn btn-sm btn-outline-primary"
                                onclick="editPengeluaran('${item.id}')">
                                Edit
                            </button>

                            <button
                                class="btn btn-sm btn-outline-danger"
                                onclick="hapusPengeluaran('${item.id}')">
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
            "Gagal memuat pengeluaran:",
            error
        );

        container.innerHTML =
            `<div class="text-danger p-3">
                Gagal memuat data pengeluaran.
            </div>`;

    }

}

// ======================================================
// EDIT
// ======================================================

window.editPengeluaran =
    async function (id) {

        try {

            const snap =
                await getDocs(
                    collection(
                        db,
                        "expenses"
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
                    "Data pengeluaran tidak ditemukan."
                );

                return;
            }

            idEditPengeluaran =
                id;

            const jenis =
                getJenis();

            const ket =
                getKeterangan();

            const tanggal =
                getTanggal();

            const nominal =
                getNominal();

            const satuan =
                getSatuan();

            if (jenis)
                jenis.value =
                    data.jenis || "";

            if (ket)
                ket.value =
                    data.keterangan || "";

            if (tanggal)
                tanggal.value =
                    data.tanggal || "";

            if (nominal)
                nominal.value =
                    data.jumlah ??
                    data.nominal ??
                    "";

            if (satuan)
                satuan.value =
                    data.satuan ||
                    "Rupiah";

            const tombol =
                getTombol();

            if (tombol)
                tombol.innerHTML =
                    "✓ Simpan Perubahan";

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }

        catch (error) {

            console.error(error);

            alert(
                "Gagal mengambil data pengeluaran."
            );

        }

    };

// ======================================================
// HAPUS
// ======================================================

window.hapusPengeluaran =
    async function (id) {

        if (!userSiap) {

            alert(
                "Silakan login terlebih dahulu."
            );

            return;
        }

        if (
            !confirm(
                "Hapus pengeluaran ini?"
            )
        ) return;

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

            await muatRiwayatPengeluaran();

            window.dispatchEvent(
                new Event(
                    "dataKeuanganBerubah"
                )
            );

        }

        catch (error) {

            console.error(error);

            alert(
                "Gagal menghapus pengeluaran:\n\n" +
                (error?.message || error)
            );

        }

    };

// ======================================================
// RESET
// ======================================================

function resetForm() {

    idEditPengeluaran =
        null;

    const jenis =
        getJenis();

    const ket =
        getKeterangan();

    const tanggal =
        getTanggal();

    const nominal =
        getNominal();

    if (jenis)
        jenis.value = "";

    if (ket)
        ket.value = "";

    if (tanggal)
        tanggal.value = "";

    if (nominal)
        nominal.value = "";

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
                window.simpanPengeluaran;

        }

        if (auth.currentUser) {

            userSiap = true;

            muatRiwayatPengeluaran();

        }

    }
);

console.log(
    "Catatan Kas: pengeluaran.js aktif."
);

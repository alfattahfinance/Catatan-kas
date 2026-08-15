"js/pengeluaran.js"

// ======================================================
// CATATAN KAS - PENGELUARAN
// Versi perbaikan Firebase untuk WEB + APK
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

let userAktif = null;
let idEdit = null;

const $ = (id) => document.getElementById(id);

// ======================================================
// FORMAT RUPIAH
// ======================================================

function rupiah(nilai) {

    const angka = Number(nilai) || 0;

    return "Rp " + angka.toLocaleString("id-ID");

}

// ======================================================
// AMBIL FORM
// ======================================================

function ambilKeterangan() {

    const element =
        $("keterangan") ||
        $("namaPengeluaran") ||
        $("deskripsi") ||
        $("uraian");

    return element
        ? String(element.value || "").trim()
        : "";

}

function ambilJenis() {

    const element =
        $("jenisPengeluaran") ||
        $("jenis") ||
        $("kategori");

    return element
        ? String(element.value || "").trim()
        : "";

}

function ambilNominal() {

    const element =
        $("nominalPengeluaran") ||
        $("nominal") ||
        $("jumlah");

    if (!element) return 0;

    let nilai = element.value;

    if (typeof nilai === "string") {

        nilai = nilai
            .replace(/Rp/gi, "")
            .replace(/\s/g, "")
            .replace(/\./g, "")
            .replace(/,/g, ".");

    }

    return Number(nilai) || 0;

}

// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(auth, function (user) {

    userAktif = user || null;

    console.log(
        "PENGELUARAN - STATUS LOGIN:",
        user ? user.uid : "BELUM LOGIN"
    );

    if (user) {

        muatPengeluaran();

    }

});

// ======================================================
// SIMPAN PENGELUARAN
// ======================================================

window.simpanPengeluaran = async function () {

    console.log("================================");
    console.log("MULAI SIMPAN PENGELUARAN");
    console.log("================================");

    const keterangan =
        ambilKeterangan();

    const jenis =
        ambilJenis();

    const nominal =
        ambilNominal();

    console.log(
        "Keterangan:",
        keterangan
    );

    console.log(
        "Jenis:",
        jenis
    );

    console.log(
        "Nominal:",
        nominal
    );

    console.log(
        "User:",
        userAktif
    );

    if (!keterangan) {

        alert(
            "Keterangan pengeluaran belum diisi."
        );

        return;

    }

    if (!nominal || nominal <= 0) {

        alert(
            "Nominal pengeluaran belum benar."
        );

        return;

    }

    if (!db) {

        alert(
            "Firebase belum terhubung."
        );

        console.error(
            "db tidak ditemukan."
        );

        return;

    }

    const tombol =
        $("btnSimpanPengeluaran") ||
        document.querySelector(
            "button[onclick*='simpanPengeluaran']"
        );

    try {

        if (tombol) {

            tombol.disabled = true;

            tombol.dataset.text =
                tombol.innerHTML;

            tombol.innerHTML =
                "⏳ Menyimpan...";

        }

        const dataPengeluaran = {

            keterangan:
                keterangan,

            nama:
                keterangan,

            jenis:
                jenis || "Lainnya",

            kategori:
                jenis || "Lainnya",

            nominal:
                nominal,

            jumlah:
                nominal,

            tanggal:
                serverTimestamp(),

            createdAt:
                serverTimestamp(),

            uid:
                userAktif
                    ? userAktif.uid
                    : null

        };

        // ==================================================
        // EDIT
        // ==================================================

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
                        jenis || "Lainnya",

                    kategori:
                        jenis || "Lainnya",

                    nominal:
                        nominal,

                    jumlah:
                        nominal,

                    updatedAt:
                        serverTimestamp()

                }

            );

            console.log(
                "PENGELUARAN BERHASIL DIUPDATE:",
                idEdit
            );

            alert(
                "Pengeluaran berhasil diperbarui."
            );

            idEdit = null;

        }

        // ==================================================
        // DATA BARU
        // ==================================================

        else {

            const hasil = await addDoc(

                collection(
                    db,
                    "expenses"
                ),

                dataPengeluaran

            );

            console.log(
                "PENGELUARAN BERHASIL DISIMPAN:",
                hasil.id
            );

            alert(
                "Pengeluaran berhasil disimpan."
            );

        }

        kosongkanForm();

        await muatPengeluaran();

        window.dispatchEvent(
            new Event(
                "dataKeuanganBerubah"
            )
        );

    }

    catch (error) {

        console.error(
            "================================"
        );

        console.error(
            "GAGAL SIMPAN PENGELUARAN"
        );

        console.error(error);

        console.error(
            "================================"
        );

        alert(
            "Gagal menyimpan pengeluaran.\n\n" +
            error.message
        );

    }

    finally {

        if (tombol) {

            tombol.disabled = false;

            tombol.innerHTML =
                tombol.dataset.text ||
                "Simpan Pengeluaran";

        }

    }

};

// ======================================================
// MUAT DATA PENGELUARAN
// ======================================================

async function muatPengeluaran() {

    const container =
        $("daftarPengeluaran") ||
        $("riwayatPengeluaran") ||
        $("listPengeluaran");

    if (!container) {

        console.log(
            "Container riwayat pengeluaran tidak ditemukan."
        );

        return;

    }

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "expenses"
                )
            );

        const data = [];

        snapshot.forEach(
            function (item) {

                data.push({

                    id: item.id,

                    ...item.data()

                });

            }
        );

        data.sort(
            function (a, b) {

                const waktuA =
                    a.createdAt?.toDate?.()?.getTime() ||
                    a.tanggal?.toDate?.()?.getTime() ||
                    0;

                const waktuB =
                    b.createdAt?.toDate?.()?.getTime() ||
                    b.tanggal?.toDate?.()?.getTime() ||
                    0;

                return waktuB - waktuA;

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

        container.innerHTML = "";

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
                    "Lainnya";

                const nominal =
                    Number(
                        item.nominal ??
                        item.jumlah ??
                        0
                    );

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "card mb-2";

                card.innerHTML = `

                    <div class="card-body">

                        <div
                            class="d-flex justify-content-between
                            align-items-start gap-2"
                        >

                            <div>

                                <div class="fw-bold">

                                    ${amanHTML(keterangan)}

                                </div>

                                <div class="text-muted small">

                                    ${amanHTML(jenis)}

                                </div>

                            </div>

                            <div
                                class="fw-bold text-danger"
                            >

                                - ${rupiah(nominal)}

                            </div>

                        </div>

                        <div
                            class="d-flex gap-2 mt-3"
                        >

                            <button
                                type="button"
                                class="btn btn-sm
                                btn-outline-primary"
                                onclick="
                                    editPengeluaran('${item.id}')
                                "
                            >

                                <i class="bi bi-pencil"></i>
                                Edit

                            </button>

                            <button
                                type="button"
                                class="btn btn-sm
                                btn-outline-danger"
                                onclick="
                                    hapusPengeluaran('${item.id}')
                                "
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

    }

    catch (error) {

        console.error(
            "Gagal memuat expenses:",
            error
        );

        container.innerHTML = `

            <div
                class="alert alert-danger"
            >

                Gagal memuat riwayat pengeluaran.

            </div>

        `;

    }

}

// ======================================================
// EDIT
// ======================================================

window.editPengeluaran = async function (id) {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "expenses"
                )
            );

        let data = null;

        snapshot.forEach(
            function (item) {

                if (item.id === id) {

                    data = {

                        id: item.id,

                        ...item.data()

                    };

                }

            }
        );

        if (!data) {

            alert(
                "Data pengeluaran tidak ditemukan."
            );

            return;

        }

        idEdit = id;

        const keterangan =
            $("keterangan") ||
            $("namaPengeluaran") ||
            $("deskripsi") ||
            $("uraian");

        const jenis =
            $("jenisPengeluaran") ||
            $("jenis") ||
            $("kategori");

        const nominal =
            $("nominalPengeluaran") ||
            $("nominal") ||
            $("jumlah");

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
                "Lainnya";

        }

        if (nominal) {

            nominal.value =
                data.nominal ??
                data.jumlah ??
                "";

        }

        const tombol =
            $("btnSimpanPengeluaran") ||
            document.querySelector(
                "button[onclick*='simpanPengeluaran']"
            );

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
            "Gagal mengambil data pengeluaran."
        );

    }

};

// ======================================================
// HAPUS
// ======================================================

window.hapusPengeluaran = async function (id) {

    if (
        !confirm(
            "Yakin ingin menghapus pengeluaran ini?"
        )
    ) {

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

        await muatPengeluaran();

        window.dispatchEvent(
            new Event(
                "dataKeuanganBerubah"
            )
        );

    }

    catch (error) {

        console.error(
            "Gagal menghapus:",
            error
        );

        alert(
            "Gagal menghapus pengeluaran.\n\n" +
            error.message
        );

    }

};

// ======================================================
// KOSONGKAN FORM
// ======================================================

function kosongkanForm() {

    idEdit = null;

    const keterangan =
        $("keterangan") ||
        $("namaPengeluaran") ||
        $("deskripsi") ||
        $("uraian");

    const jenis =
        $("jenisPengeluaran") ||
        $("jenis") ||
        $("kategori");

    const nominal =
        $("nominalPengeluaran") ||
        $("nominal") ||
        $("jumlah");

    if (keterangan) {

        keterangan.value = "";

    }

    if (jenis) {

        jenis.value = "";

    }

    if (nominal) {

        nominal.value = "";

    }

}

// ======================================================
// CEGAH HTML INJECTION
// ======================================================

function amanHTML(teks) {

    return String(teks ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// ======================================================
// INIT
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const tombol =
            $("btnSimpanPengeluaran");

        if (tombol) {

            tombol.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.simpanPengeluaran();

                }
            );

        }

        console.log(
            "Catatan Kas: pengeluaran.js aktif."
        );

    }
);

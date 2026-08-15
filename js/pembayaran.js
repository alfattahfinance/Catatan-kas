"js/pembayaran.js"

// ======================================================
// CATATAN KAS - PEMBAYARAN
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
// AMBIL NILAI FORM
// ======================================================

function ambilNama() {

    const element =
        $("namaSantriPemasukan") ||
        $("namaSantri") ||
        $("santri");

    return element
        ? String(element.value || "").trim()
        : "";

}

function ambilJenis() {

    const element = $("jenis");

    return element
        ? String(element.value || "").trim()
        : "";

}

function ambilNominal() {

    const element = $("nominal");

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
        "PEMBAYARAN - STATUS LOGIN:",
        user ? user.uid : "BELUM LOGIN"
    );

    if (user) {

        muatPembayaran();

    }

});

// ======================================================
// SIMPAN PEMBAYARAN
// ======================================================

window.simpanPembayaran = async function () {

    console.log("================================");
    console.log("MULAI SIMPAN PEMBAYARAN");
    console.log("================================");

    const nama = ambilNama();
    const jenis = ambilJenis();
    const nominal = ambilNominal();

    console.log("Nama:", nama);
    console.log("Jenis:", jenis);
    console.log("Nominal:", nominal);
    console.log("User:", userAktif);

    if (!nama) {

        alert("Nama santri belum diisi.");

        return;

    }

    if (!jenis) {

        alert("Jenis pembayaran belum dipilih.");

        return;

    }

    if (!nominal || nominal <= 0) {

        alert("Nominal pembayaran belum benar.");

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
        $("btnSimpanPembayaran") ||
        document.querySelector(
            "button[onclick*='simpanPembayaran']"
        );

    try {

        if (tombol) {

            tombol.disabled = true;

            tombol.dataset.text =
                tombol.innerHTML;

            tombol.innerHTML =
                "⏳ Menyimpan...";

        }

        const dataPembayaran = {

            nama: nama,

            namaSantri: nama,

            nama_santri: nama,

            jenis: jenis,

            kategori: jenis,

            nominal: nominal,

            jumlah: nominal,

            satuan: "Rupiah",

            tanggal: serverTimestamp(),

            createdAt: serverTimestamp(),

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
                    "payments",
                    idEdit
                ),

                {

                    nama: nama,

                    namaSantri: nama,

                    nama_santri: nama,

                    jenis: jenis,

                    kategori: jenis,

                    nominal: nominal,

                    jumlah: nominal,

                    satuan: "Rupiah",

                    updatedAt:
                        serverTimestamp()

                }

            );

            console.log(
                "PEMBAYARAN BERHASIL DIUPDATE:",
                idEdit
            );

            alert(
                "Pembayaran berhasil diperbarui."
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
                    "payments"
                ),

                dataPembayaran

            );

            console.log(
                "PEMBAYARAN BERHASIL DISIMPAN:",
                hasil.id
            );

            alert(
                "Pembayaran berhasil disimpan."
            );

        }

        kosongkanForm();

        await muatPembayaran();

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
            "GAGAL SIMPAN PEMBAYARAN"
        );

        console.error(error);

        console.error(
            "================================"
        );

        alert(
            "Gagal menyimpan pembayaran.\n\n" +
            error.message
        );

    }

    finally {

        if (tombol) {

            tombol.disabled = false;

            tombol.innerHTML =
                tombol.dataset.text ||
                "Simpan Pembayaran";

        }

    }

};

// ======================================================
// MUAT DATA PEMBAYARAN
// ======================================================

async function muatPembayaran() {

    const container =
        $("daftarPembayaran") ||
        $("riwayatPembayaran") ||
        $("listPembayaran");

    if (!container) {

        console.log(
            "Container riwayat pembayaran tidak ditemukan."
        );

        return;

    }

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "payments"
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

                    <i class="bi bi-receipt fs-1"></i>

                    <div class="mt-2">
                        Belum ada pembayaran.
                    </div>

                </div>

            `;

            return;

        }

        container.innerHTML = "";

        data.forEach(
            function (item) {

                const nama =
                    item.namaSantri ||
                    item.nama_santri ||
                    item.nama ||
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

                                    ${amanHTML(nama)}

                                </div>

                                <div class="text-muted small">

                                    ${amanHTML(jenis)}

                                </div>

                            </div>

                            <div
                                class="fw-bold text-success"
                            >

                                + ${rupiah(nominal)}

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
                                    editPembayaran('${item.id}')
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
                                    hapusPembayaran('${item.id}')
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
            "Gagal memuat payments:",
            error
        );

        container.innerHTML = `

            <div
                class="alert alert-danger"
            >

                Gagal memuat riwayat pembayaran.

            </div>

        `;

    }

}

// ======================================================
// EDIT
// ======================================================

window.editPembayaran = async function (id) {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "payments"
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
                "Data pembayaran tidak ditemukan."
            );

            return;

        }

        idEdit = id;

        const nama =
            $("namaSantriPemasukan") ||
            $("namaSantri") ||
            $("santri");

        const jenis =
            $("jenis");

        const nominal =
            $("nominal");

        if (nama) {

            nama.value =
                data.namaSantri ||
                data.nama_santri ||
                data.nama ||
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

        const tombol =
            $("btnSimpanPembayaran") ||
            document.querySelector(
                "button[onclick*='simpanPembayaran']"
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
            "Gagal mengambil data pembayaran."
        );

    }

};

// ======================================================
// HAPUS
// ======================================================

window.hapusPembayaran = async function (id) {

    if (
        !confirm(
            "Yakin ingin menghapus pembayaran ini?"
        )
    ) {

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

        await muatPembayaran();

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
            "Gagal menghapus pembayaran.\n\n" +
            error.message
        );

    }

};

// ======================================================
// KOSONGKAN FORM
// ======================================================

function kosongkanForm() {

    idEdit = null;

    const nama =
        $("namaSantriPemasukan") ||
        $("namaSantri") ||
        $("santri");

    const jenis =
        $("jenis");

    const nominal =
        $("nominal");

    if (nama) nama.value = "";

    if (jenis) jenis.value = "";

    if (nominal) nominal.value = "";

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
// PILIH JENIS PEMBAYARAN
// ======================================================

window.pilihPembayaran = function () {

    const jenis =
        $("jenis");

    const nominal =
        $("nominal");

    if (!jenis || !nominal) {

        return;

    }

    if (jenis.value === "SPP") {

        nominal.value = "50000";

    }

    else if (
        jenis.value === "Syahriyyah"
    ) {

        nominal.value = "80000";

    }

    else if (
        jenis.value === "Kas"
    ) {

        nominal.value = "30000";

    }

};

// ======================================================
// INIT
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const tombol =
            $("btnSimpanPembayaran");

        if (tombol) {

            tombol.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.simpanPembayaran();

                }
            );

        }

        console.log(
            "Catatan Kas: pembayaran.js aktif."
        );

    }
);

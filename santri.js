// ======================================
// DATA SANTRI - JS
// ======================================

import {
    db,
    auth
} from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// ======================================
// SIMPAN / TAMBAH SANTRI
// ======================================

window.simpanSantri = async function() {
    const inputNama = document.getElementById("nama");
    const inputKelas = document.getElementById("kelas");
    const inputWali = document.getElementById("wali");
    const idSantriEl = document.getElementById("idSantri");

    const nama = inputNama?.value.trim() || "";
    const kelas = inputKelas?.value.trim() || "";
    const wali = inputWali?.value.trim() || "";
    const idSantri = idSantriEl?.value || "";

    if (!nama) {
        alert("Silakan isi nama santri.");
        return;
    }

    if (!auth.currentUser) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    try {
        if (idSantri) {
            // Logika Edit (jika diperlukan di kemudian hari)
            // Untuk saat ini fokus pada penambahan data baru
        } else {
            // Tambah Baru ke koleksi "santri"
            await addDoc(collection(db, "santri"), {
                nama,
                kelas: kelas || "-",
                wali: wali || "-",
                createdAt: serverTimestamp()
            });

            alert("Santri berhasil ditambahkan!");
        }

        // Reset Form
        if (inputNama) inputNama.value = "";
        if (inputKelas) inputKelas.value = "";
        if (inputWali) inputWali.value = "";
        if (idSantriEl) idSantriEl.value = "";

        // Refresh Daftar Santri
        muatDataSantri();

    } catch (error) {
        console.error("Gagal menyimpan santri:", error);
        alert("Gagal menyimpan data santri: " + error.message);
    }
};


// ======================================
// MUAT DAFTAR SANTRI
// ======================================

async function muatDataSantri() {
    const daftarEl = document.getElementById("daftarSantri");
    if (!daftarEl) return;

    daftarEl.innerHTML = `
        <li class="list-group-item text-center text-muted py-3">
            Memuat data santri...
        </li>
    `;

    try {
        const querySnapshot = await getDocs(collection(db, "santri"));
        let santriList = [];

        querySnapshot.forEach(docSnap => {
            santriList.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        if (santriList.length === 0) {
            daftarEl.innerHTML = `
                <li class="list-group-item text-center text-muted py-3">
                    Belum ada data santri.
                </li>
            `;
            return;
        }

        daftarEl.innerHTML = "";

        santriList.forEach((item, index) => {
            daftarEl.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                    <div>
                        <b class="d-block text-dark">${index + 1}. ${item.nama}</b>
                        <small class="text-muted">Kelas: ${item.kelas} • Wali: ${item.wali}</small>
                    </div>
                    <button class="btn btn-outline-danger btn-sm" onclick="hapusSantri('${item.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </li>
            `;
        });

    } catch (error) {
        console.error("Gagal memuat santri:", error);
        daftarEl.innerHTML = `
            <li class="list-group-item text-center text-danger py-3">
                Gagal memuat daftar santri.
            </li>
        `;
    }
}


// ======================================
// HAPUS SANTRI
// ======================================

window.hapusSantri = async function(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus santri ini?")) {
        return;
    }

    try {
        await deleteDoc(doc(db, "santri", id));
        alert("Santri berhasil dihapus.");
        muatDataSantri();
    } catch (error) {
        console.error("Gagal menghapus santri:", error);
        alert("Gagal menghapus santri: " + error.message);
    }
};


// ======================================
// INISIALISASI SAAT AUTH SIAP
// ======================================

onAuthStateChanged(auth, user => {
    if (user) {
        muatDataSantri();
    }
});

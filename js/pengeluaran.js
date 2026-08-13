// ======================================
// PENGELUARAN - JS
// ======================================

import {
    db,
    auth
} from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// ======================================
// FORMAT RUPIAH
// ======================================

function rupiah(nilai) {
    return "Rp " + Number(nilai || 0).toLocaleString("id-ID");
}


// ======================================
// FORMAT / BACA TANGGAL
// ======================================

function bacaTanggal(data) {
    const nilai = data?.tanggal ?? data?.date ?? data?.createdAt ?? null;
    if (!nilai) return null;

    if (typeof nilai === "object" && typeof nilai.toDate === "function") {
        return nilai.toDate();
    }
    if (nilai instanceof Date) return nilai;
    
    if (typeof nilai === "string") {
        const cocok = nilai.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (cocok) {
            return new Date(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3]));
        }
        const parsed = new Date(nilai);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}


// ======================================
// SIMPAN PENGELUARAN
// ======================================

window.simpanPengeluaran = async function() {
    const jenisEl = document.getElementById("jenis");
    const keteranganEl = document.getElementById("keterangan");
    const tanggalEl = document.getElementById("tanggal");
    const jumlahEl = document.getElementById("jumlah");
    const satuanEl = document.getElementById("satuan");

    const jenis = jenisEl?.value || "";
    const keterangan = keteranganEl?.value.trim() || "";
    const tanggal = tanggalEl?.value || "";
    const jumlah = Number(jumlahEl?.value || 0);
    const satuan = satuanEl?.value || "Rupiah";

    // Validasi Form
    if (!jenis) {
        alert("Silakan pilih jenis pengeluaran.");
        return;
    }
    if (!keterangan) {
        alert("Silakan isi keterangan.");
        return;
    }
    if (!tanggal) {
        alert("Silakan pilih tanggal.");
        return;
    }
    if (jumlah <= 0) {
        alert("Jumlah / nominal harus lebih dari 0.");
        return;
    }

    // Cek Login
    if (!auth.currentUser) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    try {
        const dataPengeluaran = {
            jenis,
            keterangan,
            tanggal,
            jumlah,
            nominal: jumlah,
            satuan,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, "expenses"), dataPengeluaran);

        alert("Pengeluaran berhasil disimpan!");

        // Reset Form
        if (jenisEl) jenisEl.value = "";
        if (keteranganEl) keteranganEl.value = "";
        if (tanggalEl) tanggalEl.value = "";
        if (jumlahEl) jumlahEl.value = "";

        // Refresh Riwayat
        muatRiwayatPengeluaran();

    } catch (error) {
        console.error("Gagal menyimpan pengeluaran:", error);
        alert("Gagal menyimpan pengeluaran: " + error.message);
    }
};


// ======================================
// MUAT RIWAYAT PENGELUARAN
// ======================================

async function muatRiwayatPengeluaran() {
    const containerRiwayat = document.getElementById("daftarPengeluaran");
    if (!containerRiwayat) return;

    containerRiwayat.innerHTML = `
        <li class="list-group-item text-center text-muted py-3">
            Memuat riwayat...
        </li>
    `;

    try {
        const snapshot = await getDocs(collection(db, "expenses"));
        let dataRiwayat = [];

        snapshot.forEach(doc => {
            dataRiwayat.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Urutkan berdasarkan tanggal terbaru
        dataRiwayat.sort((a, b) => {
            const tA = bacaTanggal(a) || new Date(0);
            const tB = bacaTanggal(b) || new Date(0);
            return tB.getTime() - tA.getTime();
        });

        if (dataRiwayat.length === 0) {
            containerRiwayat.innerHTML = `
                <li class="list-group-item text-center text-muted py-3">
                    Belum ada riwayat pengeluaran.
                </li>
            `;
            return;
        }

        containerRiwayat.innerHTML = "";

        dataRiwayat.forEach(item => {
            const tglObj = bacaTanggal(item);
            const tglFormat = tglObj ? tglObj.toLocaleDateString("id-ID") : (item.tanggal || "-");
            const nominalFormatted = String(item.satuan || "").toLowerCase() === "liter" 
                ? `${Number(item.jumlah || 0).toLocaleString("id-ID")} Liter`
                : rupiah(item.jumlah ?? item.nominal ?? 0);

            containerRiwayat.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center border-0 border-bottom py-3">
                    <div>
                        <b class="d-block text-dark dark-text-light">${item.keterangan}</b>
                        <small class="text-muted">${item.jenis} • ${tglFormat}</small>
                    </div>
                    <div class="text-danger fw-bold">
                        -${nominalFormatted}
                    </div>
                </li>
            `;
        });

    } catch (error) {
        console.error("Gagal memuat riwayat:", error);
        containerRiwayat.innerHTML = `
            <li class="list-group-item text-center text-danger py-3">
                Gagal memuat data riwayat.
            </li>
        `;
    }
}


// ======================================
// INISIALISASI SAAT AUTH SIAP
// ======================================

onAuthStateChanged(auth, user => {
    if (user) {
        muatRiwayatPengeluaran();
    }
});

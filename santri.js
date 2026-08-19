// DATA SANTRI - Firebase Firestore
import { db, auth } from "./firebase-config.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));

function muatLogoDashboardSantri() {
    let logo = "assets/logo-catatan-kas.jpg";
    try { logo = localStorage.getItem("logoDashboard") || logo; } catch (_) {}
    document.querySelectorAll(".app-logo,.ck-logo,#logoDashboard,#dashboardLogo,#logoPreviewV2,#logoPreview,img[alt='Logo Dashboard'],img[alt='Logo aplikasi'],[data-dashboard-logo]").forEach(img => {
        if (img?.tagName === "IMG") { img.src = logo; img.removeAttribute("srcset"); }
    });
}
window.addEventListener("logoDashboardChanged", muatLogoDashboardSantri);
window.addEventListener("storage", e => { if (e.key === "logoDashboard") muatLogoDashboardSantri(); });

// ============================================================
// IMPORT BANYAK SANTRI - Excel (.xlsx/.xls) atau CSV
// Ditambahkan terpisah agar fitur lama tidak berubah.
// Kolom yang dikenali: Nama, Kelas, Wali. Jika tanpa header,
// kolom 1=Nama, kolom 2=Kelas, kolom 3=Wali.
// ============================================================
let xlsxLoaderPromise = null;

function normalisasiHeader(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s_\-]+/g, "")
        .replace(/[()]/g, "");
}

function nilaiKolom(row, headers, aliases, fallbackIndex) {
    for (const alias of aliases) {
        const key = normalisasiHeader(alias);
        const index = headers.findIndex(h => normalisasiHeader(h) === key);
        if (index >= 0) return String(row[index] ?? "").trim();
    }
    return String(row[fallbackIndex] ?? "").trim();
}

function parseCSV(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];
        if (ch === '"') {
            if (quoted && next === '"') { cell += '"'; i++; }
            else quoted = !quoted;
        } else if (ch === ',' && !quoted) {
            row.push(cell); cell = "";
        } else if ((ch === '\n' || ch === '\r') && !quoted) {
            if (ch === '\r' && next === '\n') i++;
            row.push(cell); cell = "";
            if (row.some(v => String(v).trim() !== "")) rows.push(row);
            row = [];
        } else {
            cell += ch;
        }
    }
    row.push(cell);
    if (row.some(v => String(v).trim() !== "")) rows.push(row);
    return rows;
}

function rowsToSantri(rows) {
    if (!rows.length) return [];
    const first = rows[0].map(v => String(v ?? "").trim());
    const headerNames = first.map(normalisasiHeader);
    const hasHeader = headerNames.some(h => [
        "nama", "namasantri", "name", "santri", "kelas", "class", "wali", "orangtua", "walisantri"
    ].includes(h));
    const headers = hasHeader ? first : ["Nama", "Kelas", "Wali"];
    const dataRows = hasHeader ? rows.slice(1) : rows;

    return dataRows.map(row => ({
        nama: nilaiKolom(row, headers, ["Nama", "Nama Santri", "Name", "Santri"], 0),
        kelas: nilaiKolom(row, headers, ["Kelas", "Class"], 1) || "-",
        wali: nilaiKolom(row, headers, ["Wali", "Wali Santri", "Orang Tua", "OrangTua"], 2) || "-"
    })).filter(item => item.nama);
}

function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxLoaderPromise) return xlsxLoaderPromise;
    xlsxLoaderPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
        script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error("Library Excel tidak tersedia."));
        script.onerror = () => reject(new Error("Gagal memuat pembaca Excel. Pastikan internet aktif."));
        document.head.appendChild(script);
    });
    return xlsxLoaderPromise;
}

async function bacaFileImport(file) {
    const namaFile = String(file.name || "").toLowerCase();
    if (namaFile.endsWith(".csv") || namaFile.endsWith(".txt")) {
        return rowsToSantri(parseCSV(await file.text()));
    }
    if (namaFile.endsWith(".xlsx") || namaFile.endsWith(".xls")) {
        const XLSX = await loadXLSX();
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) return [];
        return rowsToSantri(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }));
    }
    throw new Error("Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv.");
}

function buatUIImportSantri() {
    if (document.getElementById("importSantriCard")) return;
    const anchor = document.getElementById("daftarSantri")?.closest(".custom-card") || document.getElementById("daftarSantri")?.parentElement;
    if (!anchor?.parentElement) return;

    const card = document.createElement("div");
    card.id = "importSantriCard";
    card.className = "card custom-card mb-4";
    card.innerHTML = `
        <div class="card-body">
            <h5 class="mb-2"><i class="bi bi-file-earmark-spreadsheet me-2"></i>Import Banyak Santri</h5>
            <p class="text-muted small mb-3">Pilih Excel atau CSV untuk memasukkan banyak nama sekaligus. Kolom: <b>Nama</b>, <b>Kelas</b>, <b>Wali</b>.</p>
            <input id="fileImportSantri" class="form-control mb-2" type="file" accept=".xlsx,.xls,.csv,text/csv">
            <div id="importSantriStatus" class="small text-muted mb-2"></div>
            <button id="btnImportSantri" type="button" class="btn btn-success w-100">
                <i class="bi bi-cloud-upload me-1"></i> Import & Simpan Banyak Santri
            </button>
            <button id="btnTemplateSantri" type="button" class="btn btn-outline-secondary w-100 mt-2">
                <i class="bi bi-download me-1"></i> Download Template CSV
            </button>
        </div>`;
    anchor.parentElement.insertBefore(card, anchor);

    $("fileImportSantri")?.addEventListener("change", async e => {
        const file = e.target.files?.[0];
        const status = $("importSantriStatus");
        if (!file || !status) return;
        status.textContent = "Membaca file...";
        try {
            const list = await bacaFileImport(file);
            status.textContent = list.length ? `Ditemukan ${list.length} data santri. Tekan tombol Import untuk menyimpan.` : "Tidak ditemukan data nama santri.";
            status.dataset.count = String(list.length);
        } catch (error) {
            console.error(error);
            status.textContent = error.message || "Gagal membaca file.";
            status.classList.add("text-danger");
        }
    });

    $("btnImportSantri")?.addEventListener("click", importBanyakSantri);
    $("btnTemplateSantri")?.addEventListener("click", downloadTemplateSantri);
}

async function importBanyakSantri() {
    if (!auth.currentUser) return alert("Silakan login terlebih dahulu.");
    const file = $("fileImportSantri")?.files?.[0];
    if (!file) return alert("Pilih file Excel atau CSV terlebih dahulu.");

    const button = $("btnImportSantri");
    const status = $("importSantriStatus");
    const oldText = button?.innerHTML;
    if (button) { button.disabled = true; button.innerHTML = "<span class=\"spinner-border spinner-border-sm me-1\"></span> Memproses..."; }

    try {
        const incoming = await bacaFileImport(file);
        if (!incoming.length) throw new Error("File tidak berisi nama santri yang dapat diimpor.");

        // Ambil nama yang sudah ada untuk mencegah duplikasi.
        const snapshot = await getDocs(collection(db, "santri"));
        const existing = new Set(snapshot.docs.map(d => normalisasiNama(d.data()?.nama)).filter(Boolean));
        const seen = new Set(existing);
        const unique = [];
        let duplicates = 0;

        for (const item of incoming) {
            const key = normalisasiNama(item.nama);
            if (!key || seen.has(key)) { duplicates++; continue; }
            seen.add(key);
            unique.push(item);
        }

        if (!unique.length) {
            alert(`Tidak ada nama baru untuk disimpan. ${duplicates} data sudah ada atau duplikat.`);
            return;
        }

        // Firestore batch maksimal 500 operasi per batch.
        let saved = 0;
        for (let i = 0; i < unique.length; i += 500) {
            const batch = writeBatch(db);
            unique.slice(i, i + 500).forEach(item => {
                const ref = doc(collection(db, "santri"));
                batch.set(ref, {
                    nama: item.nama,
                    kelas: item.kelas || "-",
                    wali: item.wali || "-",
                    createdAt: serverTimestamp(),
                    uid: auth.currentUser.uid
                });
            });
            await batch.commit();
            saved += Math.min(500, unique.length - i);
        }

        if (status) status.textContent = `${saved} santri berhasil disimpan${duplicates ? ` • ${duplicates} dilewati` : ""}.`;
        alert(`${saved} santri berhasil diimpor.${duplicates ? `\n${duplicates} data dilewati karena nama sudah ada/duplikat.` : ""}`);
        $("fileImportSantri").value = "";
        await muatDataSantri();
    } catch (error) {
        console.error(error);
        alert("Gagal mengimpor data santri.\n\n" + (error.message || error));
    } finally {
        if (button) { button.disabled = false; button.innerHTML = oldText; }
    }
}

function normalisasiNama(value) {
    return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function downloadTemplateSantri() {
    const csv = "Nama,Kelas,Wali\nAhmad,1,Abdullah\nAli,1,Hasan\n";
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-daftar-santri.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

window.simpanSantri = async function () {
    if (!auth.currentUser) return alert("Silakan login terlebih dahulu.");
    const nama = $("nama")?.value.trim() || "";
    const kelas = $("kelas")?.value.trim() || "-";
    const wali = $("wali")?.value.trim() || "-";
    const id = $("idSantri")?.value || "";
    if (!nama) return alert("Silakan isi nama santri.");
    try {
        if (id) {
            await updateDoc(doc(db, "santri", id), { nama, kelas, wali, updatedAt: serverTimestamp() });
            alert("Data santri berhasil diperbarui.");
        } else {
            await addDoc(collection(db, "santri"), { nama, kelas, wali, createdAt: serverTimestamp(), uid: auth.currentUser.uid });
            alert("Santri berhasil ditambahkan.");
        }
        kosongkanFormSantri();
        await muatDataSantri();
    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan data santri.\n\n" + (error.message || error));
    }
};

function kosongkanFormSantri() {
    if ($("nama")) $("nama").value = "";
    if ($("kelas")) $("kelas").value = "";
    if ($("wali")) $("wali").value = "";
    if ($("idSantri")) $("idSantri").value = "";
    const btn = document.querySelector("button[onclick*='simpanSantri'],#btnSimpanSantri");
    if (btn) btn.innerHTML = "Simpan Santri";
}

window.editSantri = async function (id) {
    if (!auth.currentUser) return alert("Silakan login terlebih dahulu.");
    try {
        const snap = await getDocs(collection(db, "santri"));
        const found = snap.docs.find(d => d.id === id);
        if (!found) return alert("Data santri tidak ditemukan.");
        const data = found.data();
        if ($("nama")) $("nama").value = data.nama || "";
        if ($("kelas")) $("kelas").value = data.kelas || "";
        if ($("wali")) $("wali").value = data.wali || "";
        if ($("idSantri")) $("idSantri").value = id;
        const btn = document.querySelector("button[onclick*='simpanSantri'],#btnSimpanSantri");
        if (btn) btn.innerHTML = "Simpan Perubahan";
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
        console.error(error);
        alert("Gagal membuka data santri.\n\n" + (error.message || error));
    }
};

async function muatDataSantri() {
    const daftarEl = $("daftarSantri");
    if (!daftarEl) return;
    daftarEl.innerHTML = `<li class="list-group-item text-center text-muted py-3">Memuat data santri...</li>`;
    try {
        const snapshot = await getDocs(collection(db, "santri"));
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!list.length) {
            daftarEl.innerHTML = `<li class="list-group-item text-center text-muted py-3">Belum ada data santri.</li>`;
            return;
        }
        daftarEl.innerHTML = list.map((item, index) => `
            <li class="list-group-item d-flex justify-content-between align-items-center py-3 gap-2">
                <div class="flex-grow-1">
                    <b class="d-block text-dark">${index + 1}. ${esc(item.nama)}</b>
                    <small class="text-muted">Kelas: ${esc(item.kelas || "-")} • Wali: ${esc(item.wali || "-")}</small>
                </div>
                <div class="d-flex gap-1">
                    <button type="button" class="btn btn-outline-primary btn-sm" data-santri-action="edit" data-id="${esc(item.id)}" title="Edit"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn btn-outline-danger btn-sm" data-santri-action="delete" data-id="${esc(item.id)}" title="Hapus"><i class="bi bi-trash"></i></button>
                </div>
            </li>`).join("");
    } catch (error) {
        console.error(error);
        daftarEl.innerHTML = `<li class="list-group-item text-center text-danger py-3">Gagal memuat daftar santri.</li>`;
    }
}

window.hapusSantri = async function (id) {
    if (!auth.currentUser) return alert("Silakan login terlebih dahulu.");
    if (!window.confirm("Hapus data santri ini?\n\nData yang dihapus tidak dapat dikembalikan.")) return;
    try {
        await deleteDoc(doc(db, "santri", id));
        if ($("idSantri")?.value === id) kosongkanFormSantri();
        alert("Santri berhasil dihapus.");
        await muatDataSantri();
    } catch (error) {
        console.error(error);
        alert("Gagal menghapus data santri.\n\n" + (error.message || error));
    }
};

document.addEventListener("click", event => {
    const btn = event.target.closest("[data-santri-action]");
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    const id = btn.dataset.id;
    if (!id) return;
    if (btn.dataset.santriAction === "edit") window.editSantri(id);
    if (btn.dataset.santriAction === "delete") window.hapusSantri(id);
});

document.addEventListener("DOMContentLoaded", () => {
    muatLogoDashboardSantri();
    buatUIImportSantri();
});
onAuthStateChanged(auth, user => { if (user) muatDataSantri(); });

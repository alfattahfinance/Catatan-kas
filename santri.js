// DATA SANTRI - Firebase Firestore
import { db, auth } from "./firebase-config.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
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

document.addEventListener("DOMContentLoaded", muatLogoDashboardSantri);
onAuthStateChanged(auth, user => { if (user) muatDataSantri(); });

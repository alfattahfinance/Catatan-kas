// DATA PESERTA DIDIK - Firebase Firestore
import { db, auth } from "./firebase-config.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
let userAktif = null;
let unsubscribe = null;

function muatLogoDashboardSantri() {
    let logo = "assets/logo-catatan-kas.jpg";
    try { logo = localStorage.getItem("logoDashboard") || logo; } catch (_) {}
    document.querySelectorAll(".app-logo,.ck-logo,#logoDashboard,#dashboardLogo,#logoPreviewV2,#logoPreview,img[alt='Logo Dashboard'],img[alt='Logo aplikasi'],[data-dashboard-logo]").forEach(img => {
        if (img?.tagName === "IMG") { img.src = logo; img.removeAttribute("srcset"); }
    });
}

function normalisasiNama(value) { return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " "); }
function kosongkanFormSantri() {
    if ($("nama")) $("nama").value = "";
    if ($("kelas")) $("kelas").value = "";
    if ($("wali")) $("wali").value = "";
    if ($("idSantri")) $("idSantri").value = "";
    const btn = document.querySelector("button[onclick*='simpanSantri'],#btnSimpanSantri");
    if (btn) btn.innerHTML = "Simpan Peserta Didik";
}
function refresh() {
    try { localStorage.setItem("catatanKasDataBerubah", String(Date.now())); } catch (_) {}
    window.dispatchEvent(new CustomEvent("daftarSantriBerubah"));
    window.dispatchEvent(new CustomEvent("dataKeuanganBerubah"));
}

async function loadSantri() {
    const daftarEl = $("daftarSantri");
    if (!daftarEl) return;
    if (!userAktif) { daftarEl.innerHTML = `<li class="list-group-item text-center text-muted py-3">Silakan login terlebih dahulu.</li>`; return; }
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    daftarEl.innerHTML = `<li class="list-group-item text-center text-muted py-3">Memuat data peserta didik...</li>`;
    try {
        const q = query(collection(db, "santri"), where("uid", "==", userAktif.uid));
        unsubscribe = (await import("https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js")).onSnapshot(q, snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            if (!list.length) {
                daftarEl.innerHTML = `<li class="list-group-item text-center text-muted py-3">Belum ada data peserta didik.</li>`;
                return;
            }
            daftarEl.innerHTML = list.map((item, index) => `
                <li class="list-group-item d-flex justify-content-between align-items-center py-3 gap-2">
                    <div class="flex-grow-1"><b class="d-block text-dark">${index + 1}. ${esc(item.nama)}</b><small class="text-muted">Kelas: ${esc(item.kelas || "-")} • Wali: ${esc(item.wali || "-")}</small></div>
                    <div class="d-flex gap-1"><button type="button" class="btn btn-outline-primary btn-sm" data-santri-action="edit" data-id="${esc(item.id)}"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-outline-danger btn-sm" data-santri-action="delete" data-id="${esc(item.id)}"><i class="bi bi-trash"></i></button></div>
                </li>`).join("");
        }, error => {
            console.error(error);
            daftarEl.innerHTML = `<li class="list-group-item text-center text-danger py-3">Gagal memuat data peserta didik.</li>`;
        });
    } catch (error) {
        console.error(error);
        daftarEl.innerHTML = `<li class="list-group-item text-center text-danger py-3">Gagal memuat data peserta didik.</li>`;
    }
}

window.simpanSantri = async function () {
    if (!userAktif) return alert("Silakan login terlebih dahulu.");
    const nama = $("nama")?.value.trim() || "";
    const kelas = $("kelas")?.value.trim() || "-";
    const wali = $("wali")?.value.trim() || "-";
    const id = $("idSantri")?.value || "";
    if (!nama) return alert("Silakan isi nama peserta didik.");
    try {
        if (id) {
            const ref = doc(db, "santri", id);
            const old = await (await import("https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js")).getDoc(ref);
            if (!old.exists() || old.data()?.uid !== userAktif.uid) return alert("Data ini bukan milik akun Anda.");
            await updateDoc(ref, { nama, kelas, wali, updatedAt: serverTimestamp() });
            alert("Data peserta didik berhasil diperbarui.");
        } else {
            await addDoc(collection(db, "santri"), { nama, kelas, wali, createdAt: serverTimestamp(), uid: userAktif.uid });
            alert("Peserta didik berhasil ditambahkan.");
        }
        kosongkanFormSantri(); refresh();
    } catch (error) { console.error(error); alert("Gagal menyimpan data peserta didik.\n\n" + (error.message || error)); }
};

window.editSantri = async function (id) {
    if (!userAktif) return alert("Silakan login terlebih dahulu.");
    try {
        const snap = await (await import("https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js")).getDoc(doc(db, "santri", id));
        if (!snap.exists() || snap.data()?.uid !== userAktif.uid) return alert("Data peserta didik tidak ditemukan pada akun ini.");
        const data = snap.data();
        if ($("nama")) $("nama").value = data.nama || "";
        if ($("kelas")) $("kelas").value = data.kelas || "";
        if ($("wali")) $("wali").value = data.wali || "";
        if ($("idSantri")) $("idSantri").value = id;
        const btn = document.querySelector("button[onclick*='simpanSantri'],#btnSimpanSantri");
        if (btn) btn.innerHTML = "Simpan Perubahan";
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) { console.error(error); alert("Gagal membuka data peserta didik.\n\n" + (error.message || error)); }
};

window.hapusSantri = async function (id) {
    if (!userAktif) return alert("Silakan login terlebih dahulu.");
    if (!confirm("Hapus data peserta didik ini?\n\nData yang dihapus tidak dapat dikembalikan.")) return;
    try {
        const ref = doc(db, "santri", id);
        const snap = await (await import("https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js")).getDoc(ref);
        if (!snap.exists() || snap.data()?.uid !== userAktif.uid) return alert("Data peserta didik tidak ditemukan pada akun ini.");
        await deleteDoc(ref);
        if ($("idSantri")?.value === id) kosongkanFormSantri();
        alert("Peserta didik berhasil dihapus."); refresh();
    } catch (error) { console.error(error); alert("Gagal menghapus data peserta didik.\n\n" + (error.message || error)); }
};

document.addEventListener("click", event => {
    const btn = event.target.closest("[data-santri-action]");
    if (!btn) return;
    event.preventDefault(); event.stopPropagation();
    const id = btn.dataset.id;
    if (!id) return;
    if (btn.dataset.santriAction === "edit") window.editSantri(id);
    if (btn.dataset.santriAction === "delete") window.hapusSantri(id);
});

window.addEventListener("logoDashboardChanged", muatLogoDashboardSantri);
window.addEventListener("storage", e => { if (e.key === "logoDashboard") muatLogoDashboardSantri(); });
document.addEventListener("DOMContentLoaded", () => { muatLogoDashboardSantri(); });
onAuthStateChanged(auth, user => { userAktif = user || null; loadSantri(); });

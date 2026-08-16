// CATATAN KAS - PEMASUKAN / PEMBAYARAN
import { db, auth } from "./firebase-config.js";
import { collection, addDoc, getDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

let userAktif = null;
let idEdit = null;
let unsubscribe = null;

const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const rp = v => "Rp " + (Number(v) || 0).toLocaleString("id-ID");
const nominalData = x => Number(x?.nominal ?? x?.jumlah ?? x?.nilai ?? x?.total ?? 0) || 0;
const namaData = x => String(x?.namaSantri ?? x?.nama_santri ?? x?.nama ?? x?.keterangan ?? "-");
const jenisData = x => String(x?.jenis ?? x?.kategori ?? "Lainnya");

function tanggalData(x) {
  const v = x?.tanggal ?? x?.createdAt;
  if (v?.toDate) return v.toDate();
  if (typeof v === "string") {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + "T00:00:00") : new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function tanggalTeks(x) {
  const d = tanggalData(x);
  return d ? d.toLocaleDateString("id-ID") : "-";
}

function ambil(ids) {
  for (const id of ids) {
    const e = $(id);
    if (e) return e;
  }
  return null;
}

function tombolSimpan() {
  return ambil(["btnSimpanPembayaran", "simpanPembayaran"]) || document.querySelector("button[onclick*='simpanPembayaran']");
}

function pasangStyleRiwayat() {
  if ($( "ckPaymentHistoryStyle" )) return;
  const style = document.createElement("style");
  style.id = "ckPaymentHistoryStyle";
  style.textContent = `
    #riwayat, #daftarPembayaran { width:100%; overflow:hidden; }
    .ck-history-payment { width:100%; }
    .ck-history-head { display:grid; grid-template-columns:1fr 1.15fr 2fr 1.5fr; gap:10px; padding:9px 12px; font-size:.68rem; font-weight:800; color:#728078; border-bottom:1px solid rgba(31,72,55,.12); }
    .ck-history-row { display:grid; grid-template-columns:1fr 1.15fr 2fr 1.5fr; gap:10px; align-items:center; padding:11px 12px; border-bottom:1px solid rgba(31,72,55,.10); background:transparent; }
    .ck-history-row:last-child { border-bottom:0; }
    .ck-history-date { font-size:.72rem; color:#728078; }
    .ck-history-kind { font-size:.72rem; font-weight:800; color:#198754; }
    .ck-history-name { font-size:.78rem; font-weight:800; color:#1d2924; overflow-wrap:anywhere; }
    .ck-history-right { text-align:right; }
    .ck-history-amount { font-size:.84rem; font-weight:900; color:#198754; white-space:nowrap; }
    .ck-history-actions { display:flex; justify-content:flex-end; gap:6px; margin-top:5px; }
    .ck-history-actions .btn { font-size:.68rem; padding:4px 9px; border-radius:8px; }
    html.dark-mode .ck-history-head { color:#a7b2ac; border-color:#34423b; }
    html.dark-mode .ck-history-row { border-color:#34423b; }
    html.dark-mode .ck-history-name { color:#eef4f0; }
    html.dark-mode .ck-history-date { color:#a7b2ac; }
    html.dark-mode .ck-history-kind, html.dark-mode .ck-history-amount { color:#5dd39e; }
    @media(max-width:699px){
      .ck-history-head { display:none; }
      .ck-history-row { grid-template-columns:1fr 1fr; gap:6px 12px; padding:12px; }
      .ck-history-date { grid-column:1; }
      .ck-history-kind { grid-column:2; text-align:right; }
      .ck-history-name { grid-column:1 / -1; }
      .ck-history-right { grid-column:1 / -1; text-align:left; }
      .ck-history-actions { justify-content:flex-start; }
    }
  `;
  document.head.appendChild(style);
}

function refreshDashboard() {
  try { localStorage.setItem("catatanKasDataBerubah", String(Date.now())); } catch (_) {}
  window.dispatchEvent(new Event("refreshDashboard"));
  window.dispatchEvent(new CustomEvent("dataKeuanganBerubah", { detail:{ tipe:"pembayaran", waktu:Date.now() } }));
}

function kosongkanForm() {
  idEdit = null;
  const n = ambil(["namaSantriPemasukan","namaSantri","santri","nama","keterangan"]);
  const j = ambil(["jenis","jenisPembayaran","kategori"]);
  const m = ambil(["nominal","nominalPembayaran","jumlah"]);
  const t = ambil(["tanggalPembayaran","tanggal","tglPembayaran"]);
  if (n) n.value = "";
  if (j) j.value = "";
  if (m) m.value = "";
  if (t) t.value = "";
  const b = tombolSimpan();
  if (b) { b.disabled = false; b.innerHTML = "Simpan Pembayaran"; }
}

window.simpanPembayaran = async function() {
  if (!userAktif) return alert("Silakan login terlebih dahulu.");
  const nama = ambil(["namaSantriPemasukan","namaSantri","santri","nama","keterangan"])?.value.trim() || "";
  const jenis = ambil(["jenis","jenisPembayaran","kategori"])?.value.trim() || "";
  const m = ambil(["nominal","nominalPembayaran","jumlah"]);
  const nominal = Number(String(m?.value || "").replace(/[^0-9]/g, "")) || 0;
  const tanggal = ambil(["tanggalPembayaran","tanggal","tglPembayaran"])?.value || null;
  if (!nama) return alert("Nama santri / keterangan belum diisi.");
  if (!jenis) return alert("Jenis pembayaran belum dipilih.");
  if (nominal <= 0) return alert("Nominal pembayaran belum benar.");
  const b = tombolSimpan();
  try {
    if (b) { b.disabled = true; b.innerHTML = idEdit ? "Menyimpan perubahan..." : "Menyimpan..."; }
    const data = { nama, namaSantri:nama, nama_santri:nama, keterangan:nama, jenis, kategori:jenis, nominal, jumlah:nominal, satuan:"Rupiah", tanggal, uid:userAktif.uid, updatedAt:serverTimestamp() };
    if (idEdit) await updateDoc(doc(db, "payments", idEdit), data);
    else { data.createdAt = serverTimestamp(); await addDoc(collection(db, "payments"), data); }
    alert(idEdit ? "Pembayaran berhasil diperbarui." : "Pembayaran berhasil disimpan.");
    kosongkanForm();
    refreshDashboard();
  } catch (e) {
    console.error(e);
    alert("Gagal menyimpan pembayaran.\n\n" + (e.message || e));
  } finally {
    if (b) { b.disabled = false; b.innerHTML = "Simpan Pembayaran"; }
  }
};

window.editPembayaran = async function(id) {
  try {
    const snap = await getDoc(doc(db, "payments", id));
    if (!snap.exists()) return alert("Data pembayaran tidak ditemukan.");
    const d = snap.data();
    idEdit = id;
    const n = ambil(["namaSantriPemasukan","namaSantri","santri","nama","keterangan"]);
    const j = ambil(["jenis","jenisPembayaran","kategori"]);
    const m = ambil(["nominal","nominalPembayaran","jumlah"]);
    const t = ambil(["tanggalPembayaran","tanggal","tglPembayaran"]);
    if (n) n.value = namaData(d);
    if (j) j.value = d.jenis || d.kategori || "";
    if (m) m.value = nominalData(d);
    if (t) t.value = typeof d.tanggal === "string" ? d.tanggal : "";
    const b = tombolSimpan();
    if (b) b.innerHTML = "Simpan Perubahan";
    window.scrollTo({ top:0, behavior:"smooth" });
  } catch (e) {
    console.error(e);
    alert("Gagal membuka pembayaran.\n\n" + (e.message || e));
  }
};

window.hapusPembayaran = async function(id) {
  if (!userAktif) return alert("Silakan login terlebih dahulu.");
  if (!window.confirm("Hapus pembayaran ini?\n\nData yang dihapus tidak dapat dikembalikan.")) return;
  try {
    await deleteDoc(doc(db, "payments", id));
    if (idEdit === id) kosongkanForm();
    alert("Pembayaran berhasil dihapus.");
    refreshDashboard();
  } catch (e) {
    console.error(e);
    alert("Gagal menghapus pembayaran.\n\n" + (e.message || e));
  }
};

function render(snapshot) {
  const c = $("daftarPembayaran") || $("riwayatPembayaran") || $("listPembayaran") || $("riwayat");
  if (!c) return;
  pasangStyleRiwayat();
  const data = snapshot.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b) => (tanggalData(b)?.getTime()||0) - (tanggalData(a)?.getTime()||0));
  if (!data.length) {
    c.innerHTML = `<div class="text-center text-muted p-4">Belum ada pemasukan.</div>`;
    return;
  }
  c.innerHTML = `<div class="ck-history-payment">
    <div class="ck-history-head"><div>Tanggal</div><div>Jenis</div><div>Nama / Keterangan</div><div class="text-end">Nominal & Aksi</div></div>
    ${data.map(x => `<div class="ck-history-row">
      <div class="ck-history-date">${esc(tanggalTeks(x))}</div>
      <div class="ck-history-kind">${esc(jenisData(x))}</div>
      <div class="ck-history-name">${esc(namaData(x))}</div>
      <div class="ck-history-right">
        <div class="ck-history-amount">+${esc(rp(nominalData(x)))}</div>
        <div class="ck-history-actions">
          <button type="button" class="btn btn-outline-primary" data-payment-action="edit" data-id="${esc(x.id)}"><i class="bi bi-pencil"></i> Edit</button>
          <button type="button" class="btn btn-outline-danger" data-payment-action="delete" data-id="${esc(x.id)}"><i class="bi bi-trash"></i> Hapus</button>
        </div>
      </div>
    </div>`).join("")}
  </div>`;
}

function mulaiRealtime() {
  if (unsubscribe) unsubscribe();
  const c = $("daftarPembayaran") || $("riwayatPembayaran") || $("listPembayaran") || $("riwayat");
  if (!c) return;
  unsubscribe = onSnapshot(collection(db, "payments"), render, e => {
    console.error(e);
    c.innerHTML = `<div class="alert alert-danger m-3">Gagal memuat riwayat pembayaran.<br><small>${esc(e.message || e)}</small></div>`;
  });
}

document.addEventListener("click", e => {
  const b = e.target.closest("[data-payment-action]");
  if (!b) return;
  e.preventDefault();
  e.stopPropagation();
  const id = b.dataset.id;
  if (!id) return;
  if (b.dataset.paymentAction === "edit") window.editPembayaran(id);
  if (b.dataset.paymentAction === "delete") window.hapusPembayaran(id);
});

document.addEventListener("DOMContentLoaded", () => {
  const b = tombolSimpan();
  if (b) b.addEventListener("click", e => { e.preventDefault(); window.simpanPembayaran(); });
  mulaiRealtime();
});

onAuthStateChanged(auth, user => { userAktif = user || null; });

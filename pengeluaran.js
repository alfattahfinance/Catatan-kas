// CATATAN KAS - PENGELUARAN
import { db, auth } from "./firebase-config.js";
import { collection, addDoc, getDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

let userAktif = null;
let idEdit = null;
let unsubscribe = null;

const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const rp = v => "Rp " + (Number(v) || 0).toLocaleString("id-ID");
const amount = x => Number(x?.nominal ?? x?.jumlah ?? x?.nilai ?? x?.total ?? 0) || 0;
const jenis = x => String(x?.jenis ?? x?.kategori ?? "Lainnya");
const ket = x => String(x?.keterangan ?? x?.nama ?? x?.deskripsi ?? x?.uraian ?? "Pengeluaran");

function dateOf(x) {
  const v = x?.tanggal ?? x?.createdAt;
  if (v?.toDate) return v.toDate();
  if (typeof v === "string") {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + "T00:00:00") : new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function dateText(x) {
  const d = dateOf(x);
  return d ? d.toLocaleDateString("id-ID") : "-";
}

function ambil(ids) {
  for (const id of ids) {
    const e = $(id);
    if (e) return e;
  }
  return null;
}

function btn() {
  return ambil(["btnSimpanPengeluaran", "simpanPengeluaran"]) || document.querySelector("button[onclick*='simpanPengeluaran']");
}

function pasangStyleRiwayat() {
  if ($( "ckExpenseHistoryStyle" )) return;
  const style = document.createElement("style");
  style.id = "ckExpenseHistoryStyle";
  style.textContent = `
    #daftarPengeluaran { width:100%; overflow:hidden; }
    .ck-history-expense { width:100%; }
    .ck-expense-head { display:grid; grid-template-columns:1fr 1.15fr 2fr 1.5fr; gap:10px; padding:9px 12px; font-size:.68rem; font-weight:800; color:#728078; border-bottom:1px solid rgba(31,72,55,.12); }
    .ck-expense-row { display:grid; grid-template-columns:1fr 1.15fr 2fr 1.5fr; gap:10px; align-items:center; padding:11px 12px; border-bottom:1px solid rgba(31,72,55,.10); background:transparent; }
    .ck-expense-row:last-child { border-bottom:0; }
    .ck-expense-date { font-size:.72rem; color:#728078; }
    .ck-expense-kind { font-size:.72rem; font-weight:800; color:#dc5b58; }
    .ck-expense-name { font-size:.78rem; font-weight:800; color:#1d2924; overflow-wrap:anywhere; }
    .ck-expense-right { text-align:right; }
    .ck-expense-amount { font-size:.84rem; font-weight:900; color:#dc5b58; white-space:nowrap; }
    .ck-expense-actions { display:flex; justify-content:flex-end; gap:6px; margin-top:5px; }
    .ck-expense-actions .btn { font-size:.68rem; padding:4px 9px; border-radius:8px; }
    html.dark-mode .ck-expense-head { color:#a7b2ac; border-color:#34423b; }
    html.dark-mode .ck-expense-row { border-color:#34423b; }
    html.dark-mode .ck-expense-name { color:#eef4f0; }
    html.dark-mode .ck-expense-date { color:#a7b2ac; }
    html.dark-mode .ck-expense-kind, html.dark-mode .ck-expense-amount { color:#ff7772; }
    @media(max-width:699px){
      .ck-expense-head { display:none; }
      .ck-expense-row { grid-template-columns:1fr 1fr; gap:6px 12px; padding:12px; }
      .ck-expense-date { grid-column:1; }
      .ck-expense-kind { grid-column:2; text-align:right; }
      .ck-expense-name { grid-column:1 / -1; }
      .ck-expense-right { grid-column:1 / -1; text-align:left; }
      .ck-expense-actions { justify-content:flex-start; }
    }
  `;
  document.head.appendChild(style);
}

function refresh() {
  try { localStorage.setItem("catatanKasDataBerubah", String(Date.now())); } catch (_) {}
  window.dispatchEvent(new Event("refreshDashboard"));
  window.dispatchEvent(new CustomEvent("dataKeuanganBerubah", { detail:{ tipe:"pengeluaran", waktu:Date.now() } }));
}

function reset() {
  idEdit = null;
  const k = ambil(["keteranganPengeluaran","keterangan","namaPengeluaran","nama","deskripsi"]);
  const j = ambil(["jenisPengeluaran","jenis","kategoriPengeluaran","kategori"]);
  const n = ambil(["nominalPengeluaran","nominal","jumlah","total"]);
  const t = ambil(["tanggalPengeluaran","tanggal","tglPengeluaran"]);
  const s = ambil(["satuanPengeluaran","satuan"]);
  if (k) k.value = "";
  if (j) j.value = "";
  if (n) n.value = "";
  if (t) t.value = "";
  if (s) s.value = "Rupiah";
  const b = btn();
  if (b) { b.disabled = false; b.innerHTML = "Simpan Pengeluaran"; }
}

function parseNominal(v) {
  return Number(String(v ?? "").replace(/[^0-9]/g, "")) || 0;
}

window.simpanPengeluaran = async function() {
  if (!userAktif) return alert("Silakan login terlebih dahulu.");
  const k = ambil(["keteranganPengeluaran","keterangan","namaPengeluaran","nama","deskripsi"])?.value.trim() || "";
  const j = ambil(["jenisPengeluaran","jenis","kategoriPengeluaran","kategori"])?.value.trim() || "Lainnya";
  const n = parseNominal(ambil(["nominalPengeluaran","nominal","jumlah","total"])?.value);
  const t = ambil(["tanggalPengeluaran","tanggal","tglPengeluaran"])?.value || null;
  const s = ambil(["satuanPengeluaran","satuan"])?.value || "Rupiah";
  if (!k) return alert("Keterangan pengeluaran belum diisi.");
  if (n <= 0) return alert("Nominal pengeluaran belum benar.");
  const b = btn();
  try {
    if (b) { b.disabled = true; b.innerHTML = idEdit ? "Menyimpan perubahan..." : "Menyimpan..."; }
    const data = { keterangan:k, nama:k, deskripsi:k, jenis:j, kategori:j, nominal:n, jumlah:n, total:n, satuan:s, tanggal:t, uid:userAktif.uid, updatedAt:serverTimestamp() };
    if (idEdit) await updateDoc(doc(db, "expenses", idEdit), data);
    else { data.createdAt = serverTimestamp(); await addDoc(collection(db, "expenses"), data); }
    alert(idEdit ? "Pengeluaran berhasil diperbarui." : "Pengeluaran berhasil disimpan.");
    reset();
    refresh();
  } catch (e) {
    console.error(e);
    alert("Gagal menyimpan pengeluaran.\n\n" + (e.message || e));
  } finally {
    if (b) { b.disabled = false; b.innerHTML = "Simpan Pengeluaran"; }
  }
};

window.editPengeluaran = async function(id) {
  try {
    const snap = await getDoc(doc(db, "expenses", id));
    if (!snap.exists()) return alert("Data pengeluaran tidak ditemukan.");
    const d = snap.data();
    idEdit = id;
    const k = ambil(["keteranganPengeluaran","keterangan","namaPengeluaran","nama","deskripsi"]);
    const j = ambil(["jenisPengeluaran","jenis","kategoriPengeluaran","kategori"]);
    const n = ambil(["nominalPengeluaran","nominal","jumlah","total"]);
    const t = ambil(["tanggalPengeluaran","tanggal","tglPengeluaran"]);
    const s = ambil(["satuanPengeluaran","satuan"]);
    if (k) k.value = ket(d);
    if (j) j.value = d.jenis || d.kategori || "Lainnya";
    if (n) n.value = amount(d);
    if (t) t.value = typeof d.tanggal === "string" ? d.tanggal : "";
    if (s) s.value = d.satuan || "Rupiah";
    const b = btn();
    if (b) b.innerHTML = "Simpan Perubahan";
    window.scrollTo({ top:0, behavior:"smooth" });
  } catch (e) {
    console.error(e);
    alert("Gagal membuka pengeluaran.\n\n" + (e.message || e));
  }
};

window.hapusPengeluaran = async function(id) {
  if (!userAktif) return alert("Silakan login terlebih dahulu.");
  if (!window.confirm("Hapus data pengeluaran ini?\n\nData yang dihapus tidak dapat dikembalikan.")) return;
  try {
    await deleteDoc(doc(db, "expenses", id));
    if (idEdit === id) reset();
    alert("Pengeluaran berhasil dihapus.");
    refresh();
  } catch (e) {
    console.error(e);
    alert("Gagal menghapus pengeluaran.\n\n" + (e.message || e));
  }
};

function render(snapshot) {
  const c = $("daftarPengeluaran");
  if (!c) return;
  pasangStyleRiwayat();
  const data = snapshot.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b) => (dateOf(b)?.getTime()||0) - (dateOf(a)?.getTime()||0));
  if (!data.length) {
    c.innerHTML = `<div class="text-center text-muted p-4">Belum ada pengeluaran.</div>`;
    return;
  }
  c.innerHTML = `<div class="ck-history-expense">
    <div class="ck-expense-head"><div>Tanggal</div><div>Jenis</div><div>Keterangan</div><div class="text-end">Nominal & Aksi</div></div>
    ${data.map(x => `<div class="ck-expense-row">
      <div class="ck-expense-date">${esc(dateText(x))}</div>
      <div class="ck-expense-kind">${esc(jenis(x))}</div>
      <div class="ck-expense-name">${esc(ket(x))}</div>
      <div class="ck-expense-right">
        <div class="ck-expense-amount">-${esc(rp(amount(x)))}</div>
        <div class="ck-expense-actions">
          <button type="button" class="btn btn-outline-primary" data-expense-action="edit" data-id="${esc(x.id)}"><i class="bi bi-pencil"></i> Edit</button>
          <button type="button" class="btn btn-outline-danger" data-expense-action="delete" data-id="${esc(x.id)}"><i class="bi bi-trash"></i> Hapus</button>
        </div>
      </div>
    </div>`).join("")}
  </div>`;
}

function start() {
  if (unsubscribe) unsubscribe();
  const c = $("daftarPengeluaran");
  if (!c) return;
  unsubscribe = onSnapshot(collection(db, "expenses"), render, e => {
    console.error(e);
    c.innerHTML = `<div class="alert alert-danger m-3">Gagal memuat riwayat pengeluaran.<br><small>${esc(e.message || e)}</small></div>`;
  });
}

document.addEventListener("click", e => {
  const b = e.target.closest("[data-expense-action]");
  if (!b) return;
  e.preventDefault();
  e.stopPropagation();
  const id = b.dataset.id;
  if (!id) return;
  if (b.dataset.expenseAction === "edit") window.editPengeluaran(id);
  if (b.dataset.expenseAction === "delete") window.hapusPengeluaran(id);
});

document.addEventListener("DOMContentLoaded", () => {
  const b = btn();
  if (b) b.addEventListener("click", e => { e.preventDefault(); window.simpanPengeluaran(); });
  start();
});

onAuthStateChanged(auth, user => { userAktif = user || null; });

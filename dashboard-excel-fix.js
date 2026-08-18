import { db, auth } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const $ = id => document.getElementById(id);
const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
let santri = [], payments = [];

const amount = x => Number(x?.nominal ?? x?.jumlah ?? x?.nilai ?? x?.total ?? 0) || 0;
const name = x => String(x?.namaSantri ?? x?.nama_santri ?? x?.nama ?? x?.keterangan ?? "").trim();
const kind = x => String(x?.jenis ?? x?.kategori ?? "Lainnya").trim() || "Lainnya";
const rp = n => "Rp " + (Number(n) || 0).toLocaleString("id-ID");
const clean = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const esc = v => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));

function dateOf(x) {
  const v = x?.tanggal ?? x?.createdAt;
  if (v?.toDate) return v.toDate();
  if (typeof v === "string") {
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? v + "T00:00:00" : v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function names() {
  const set = new Set();
  [...santri, ...payments].forEach(x => { const n = name(x); if (n) set.add(n); });
  return [...set].sort((a,b) => a.localeCompare(b, "id"));
}

function render() {
  if (!$('body') || !$('tahun') || !$('jenis') || !$('cari')) return;
  const year = Number($('tahun').value) || new Date().getFullYear();
  const type = $('jenis').value;
  const q = clean($('cari').value);
  const filtered = payments.filter(x => {
    const d = dateOf(x);
    return d && d.getFullYear() === year && (type === "Semua" || kind(x).toLowerCase() === type.toLowerCase());
  });
  const all = names();
  const list = all.filter(n => !q || clean(n).includes(q));
  const rows = list.map(n => {
    const statuses = months.map((_, i) => filtered.some(x => name(x) === n && dateOf(x)?.getMonth() === i));
    const paid = statuses.filter(Boolean).length;
    const total = filtered.filter(x => name(x) === n).reduce((s,x) => s + amount(x), 0);
    let last = "Belum bayar";
    for (let i = 11; i >= 0; i--) if (statuses[i]) { last = months[i]; break; }
    return { n, statuses, paid, total, last };
  });

  $('mSantri').textContent = all.length.toLocaleString("id-ID");
  $('mLengkap').textContent = rows.filter(x => x.paid === 12).length.toLocaleString("id-ID");
  $('mBelum').textContent = rows.filter(x => x.paid < 12).length.toLocaleString("id-ID");
  $('mTotal').textContent = rp(filtered.reduce((s,x) => s + amount(x), 0));
  $('body').innerHTML = rows.length ? rows.map(r => `<tr><td><b>${esc(r.n)}</b></td>${r.statuses.map(v => `<td class="${v ? "ok" : "no"}">${v ? "✓" : "✗"}</td>`).join("")}<td><b>${r.paid}/12</b></td><td class="last">${esc(r.last)}</td><td>${rp(r.total)}</td></tr>`).join("") : `<tr><td colspan="16" class="empty">Tidak ada data yang cocok.</td></tr>`;
  const first = rows[0];
  $('detail').innerHTML = first ? `<b>${esc(first.n)}</b><br>Sudah bayar sampai: <b class="last">${esc(first.last)}</b><br>Jumlah bulan: <b>${first.paid}/12</b><br>Total pembayaran: <b>${rp(first.total)}</b>` : "Pilih/ketik nama pada kolom pencarian untuk melihat detail.";
}

function errorBox(title, e) {
  console.error(title, e);
  const old = document.getElementById("dashboardExcelError");
  if (old) old.remove();
  const el = document.createElement("div");
  el.id = "dashboardExcelError";
  el.className = "alert alert-danger m-2";
  el.innerHTML = `<b>${esc(title)}</b><br><small>${esc(e?.message || e || "Kesalahan tidak diketahui")}</small>`;
  document.body.prepend(el);
}

function start() {
  onSnapshot(collection(db, "santri"), snap => { santri = snap.docs.map(d => ({id:d.id, ...d.data()})); render(); }, e => errorBox("Data santri tidak dapat dimuat.", e));
  onSnapshot(collection(db, "payments"), snap => { payments = snap.docs.map(d => ({id:d.id, ...d.data()})); render(); }, e => errorBox("Data pembayaran tidak dapat dimuat.", e));
}

function boot() {
  ["cari","tahun","jenis"].forEach(id => $(id)?.addEventListener(id === "cari" ? "input" : "change", render));
  start();
}

onAuthStateChanged(auth, user => {
  if (user) boot();
});

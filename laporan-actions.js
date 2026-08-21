import { db, auth } from "./firebase-config.js";
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

let currentUser = null;
const esc = v => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const amount = x => Number(x?.nominal ?? x?.jumlah ?? x?.nilai ?? x?.total ?? 0) || 0;
const type = x => String(x?.jenis ?? x?.kategori ?? "Lainnya");
const name = x => String(x?.namaSantri ?? x?.nama_santri ?? x?.nama ?? x?.keterangan ?? "-");

function parseDate(v) {
  if (v?.toDate) return v.toDate();
  if (typeof v === "string") { const d = new Date(v); if (!isNaN(d)) return d; }
  return null;
}

function addActions() {
  const tbody = document.getElementById("rows");
  if (!tbody) return;
  tbody.querySelectorAll("tr").forEach(row => {
    if (row.dataset.reportActions === "1") return;
    const cells = row.querySelectorAll("td");
    if (cells.length < 5) return;
    const id = row.dataset.transactionId;
    const collection = row.dataset.transactionCollection;
    if (!id || !collection) return;
    row.dataset.reportActions = "1";
    const cell = document.createElement("td");
    cell.className = "text-nowrap";
    cell.innerHTML = `<button type="button" class="btn btn-sm btn-outline-primary me-1" data-report-edit="1" title="Edit"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-sm btn-outline-danger" data-report-delete="1" title="Hapus"><i class="bi bi-trash"></i></button>`;
    row.appendChild(cell);
  });
}

async function getOwn(id, collectionName) {
  if (!currentUser) throw new Error("Silakan login terlebih dahulu.");
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) throw new Error("Transaksi tidak ditemukan.");
  const data = snap.data();
  if (data.uid && data.uid !== currentUser.uid) throw new Error("Transaksi ini bukan milik akun Anda.");
  return data;
}

async function editTransaction(row) {
  try {
    const collectionName = row.dataset.transactionCollection;
    const id = row.dataset.transactionId;
    const data = await getOwn(id, collectionName);
    const oldAmount = amount(data);
    const oldType = type(data);
    const oldName = name(data);
    const oldDate = data.tanggal || "";
    const label = collectionName === "payments" ? "Pemasukan" : "Pengeluaran";
    const nominal = prompt(`Edit nominal ${label}:`, String(oldAmount));
    if (nominal === null) return;
    const n = Number(String(nominal).replace(/[^0-9]/g, ""));
    if (!n || n < 0) return alert("Nominal tidak valid.");
    const jenis = prompt("Edit jenis/kategori:", oldType);
    if (jenis === null || !jenis.trim()) return;
    const keterangan = prompt("Edit keterangan/nama:", oldName);
    if (keterangan === null || !keterangan.trim()) return;
    const tanggal = prompt("Edit tanggal (YYYY-MM-DD):", oldDate);
    if (tanggal === null) return;
    await updateDoc(doc(db, collectionName, id), {
      nominal: n,
      jumlah: n,
      jenis: jenis.trim(),
      kategori: jenis.trim(),
      nama: keterangan.trim(),
      namaSantri: keterangan.trim(),
      nama_santri: keterangan.trim(),
      keterangan: keterangan.trim(),
      tanggal: tanggal || oldDate,
      updatedAt: new Date()
    });
    alert("Transaksi berhasil diperbarui. Laporan dan riwayat akan mengikuti perubahan.");
    window.dispatchEvent(new Event("dataKeuanganBerubah"));
  } catch (e) { console.error(e); alert(e.message || "Gagal mengedit transaksi."); }
}

async function deleteTransaction(row) {
  try {
    const collectionName = row.dataset.transactionCollection;
    const id = row.dataset.transactionId;
    const data = await getOwn(id, collectionName);
    if (!confirm(`Hapus transaksi ${name(data)} sebesar Rp ${amount(data).toLocaleString("id-ID")}?\n\nTransaksi akan dihapus dari riwayat dan otomatis tidak dihitung lagi dalam laporan.`)) return;
    await deleteDoc(doc(db, collectionName, id));
    alert("Transaksi berhasil dihapus. Laporan akan mengikuti riwayat transaksi.");
    window.dispatchEvent(new Event("dataKeuanganBerubah"));
  } catch (e) { console.error(e); alert(e.message || "Gagal menghapus transaksi."); }
}

document.addEventListener("click", e => {
  const edit = e.target.closest("[data-report-edit]");
  const del = e.target.closest("[data-report-delete]");
  if (edit) { e.preventDefault(); editTransaction(edit.closest("tr")); }
  if (del) { e.preventDefault(); deleteTransaction(del.closest("tr")); }
});

const observer = new MutationObserver(() => addActions());
function start() {
  currentUser = auth.currentUser;
  const tbody = document.getElementById("rows");
  if (tbody) observer.observe(tbody, { childList: true, subtree: true });
  addActions();
}
onAuthStateChanged(auth, user => { currentUser = user || null; if (currentUser) start(); });

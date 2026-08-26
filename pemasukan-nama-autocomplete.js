import { db } from "./firebase-config.js";
import { collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

(() => {
  if (window.__ckPemasukanAutocompleteStarted) return;
  window.__ckPemasukanAutocompleteStarted = true;

  let namaList = [];
  let stop = null;
  const input = () => document.getElementById("namaSiswaSiswiPemasukan");
  const box = () => document.getElementById("saranNamaPemasukan");
  const normal = v => String(v ?? "").trim().toLocaleLowerCase("id-ID");

  function clean(list) {
    const seen = new Set();
    return (list || []).map(x => String(x ?? "").trim()).filter(Boolean).filter(n => {
      const k = normal(n);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((a,b) => a.localeCompare(b, "id", {sensitivity:"base"}));
  }

  function render() {
    const el = input(), panel = box();
    if (!el || !panel) return;
    const q = normal(el.value);
    panel.innerHTML = "";
    if (!q) { panel.style.display = "none"; return; }

    // WAJIB cocok dari awal nama: A/a hanya menampilkan nama yang diawali A/a.
    const hasil = namaList.filter(n => normal(n).startsWith(q)).slice(0, 30);
    for (const n of hasil) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = n;
      b.setAttribute("role", "option");
      b.addEventListener("mousedown", e => {
        e.preventDefault();
        el.value = n;
        panel.style.display = "none";
        el.dispatchEvent(new Event("input", {bubbles:true}));
      });
      panel.appendChild(b);
    }
    panel.style.display = hasil.length ? "block" : "none";
  }

  function bind() {
    const el = input(), panel = box();
    if (!el || !panel || el.dataset.ckPrefixAutocomplete === "1") return;
    el.dataset.ckPrefixAutocomplete = "1";
    el.setAttribute("autocomplete", "off");
    el.addEventListener("input", render);
    el.addEventListener("focus", render);
    document.addEventListener("click", e => {
      if (!el.contains(e.target) && !panel.contains(e.target)) panel.style.display = "none";
    });
  }

  async function load() {
    if (stop) { stop(); stop = null; }
    try {
      // Sumber nama tunggal: koleksi santri. Ini juga mencakup data lama.
      const snap = await getDocs(collection(db, "santri"));
      namaList = clean(snap.docs.map(d => {
        const x = d.data() || {};
        return x.nama ?? x.namaSiswaSiswi ?? x.namaSiswa ?? x.nama_siswa ?? "";
      }));
      render();
      stop = onSnapshot(collection(db, "santri"), s => {
        namaList = clean(s.docs.map(d => {
          const x = d.data() || {};
          return x.nama ?? x.namaSiswaSiswi ?? x.namaSiswa ?? x.nama_siswa ?? "";
        }));
        render();
      });
    } catch (e) {
      console.warn("Autocomplete nama Pemasukan gagal memuat santri:", e);
      namaList = [];
      render();
    }
  }

  function start() {
    bind();
    load();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
  else start();
})();

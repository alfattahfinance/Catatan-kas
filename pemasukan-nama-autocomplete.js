import { db, auth } from "./firebase-config.js";
import { collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

(() => {
  let namaList = [];
  let stop = null;
  const input = () => document.getElementById("namaSiswaSiswiPemasukan");
  const box = () => document.getElementById("saranNamaPemasukan");
  const normal = v => String(v ?? "").trim().toLocaleLowerCase("id-ID");
  const clean = list => [...new Set((list || []).map(x => String(x ?? "").trim()).filter(Boolean))]
    .sort((a,b) => a.localeCompare(b, "id", { sensitivity: "base" }));

  function render() {
    const el = input(), panel = box();
    if (!el || !panel) return;
    const q = normal(el.value);
    panel.innerHTML = "";
    if (!q) { panel.style.display = "none"; return; }

    // Pencarian HARUS dari AWAL nama. A/a => semua nama yang diawali A/a.
    const hasil = namaList.filter(n => normal(n).startsWith(q)).slice(0, 30);
    hasil.forEach(n => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = n;
      b.setAttribute("role", "option");
      b.addEventListener("mousedown", e => {
        e.preventDefault();
        el.value = n;
        panel.style.display = "none";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      panel.appendChild(b);
    });
    panel.style.display = hasil.length ? "block" : "none";
  }

  async function load() {
    if (stop) { stop(); stop = null; }
    try {
      // Jangan bergantung pada field uid yang mungkin tidak ada pada data lama.
      // Daftar nama utama tetap berasal dari koleksi santri.
      const snap = await getDocs(collection(db, "santri"));
      namaList = clean(snap.docs.map(d => {
        const x = d.data() || {};
        return x.nama ?? x.namaSiswaSiswi ?? x.namaSiswa ?? "";
      }));
      render();

      stop = onSnapshot(collection(db, "santri"), s => {
        namaList = clean(s.docs.map(d => {
          const x = d.data() || {};
          return x.nama ?? x.namaSiswaSiswi ?? x.namaSiswa ?? "";
        }));
        render();
      });
    } catch (e) {
      console.warn("Autocomplete nama pembayaran gagal memuat santri:", e);
      namaList = [];
      render();
    }
  }

  function bind() {
    const el = input(), panel = box();
    if (!el || !panel || el.dataset.ckPrefixAutocomplete === "1") return;
    el.dataset.ckPrefixAutocomplete = "1";
    el.addEventListener("input", render);
    el.addEventListener("focus", render);
    document.addEventListener("click", e => {
      if (!el.contains(e.target) && !panel.contains(e.target)) panel.style.display = "none";
    });
  }

  function start() {
    bind();
    onAuthStateChanged(auth, () => load());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

import { db, auth } from "./firebase-config.js";
import { collection, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
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

    // WAJIB cocok dari awal nama, bukan contains().
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
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      panel.appendChild(b);
    }
    panel.style.display = hasil.length ? "block" : "none";
  }

  async function load(uid) {
    if (stop) { stop(); stop = null; }
    namaList = [];
    if (!uid) { render(); return; }
    const q = query(collection(db, "santri"), where("uid", "==", uid));
    try {
      const snap = await getDocs(q);
      namaList = clean(snap.docs.map(d => d.data()?.nama));
      render();
      stop = onSnapshot(q, s => {
        namaList = clean(s.docs.map(d => d.data()?.nama));
        render();
      });
    } catch (e) {
      console.warn("Autocomplete nama pemasukan gagal memuat daftar nama:", e);
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

  const start = () => {
    bind();
    onAuthStateChanged(auth, user => load(user?.uid || null));
    window.addEventListener("daftarSantriBerubah", () => auth.currentUser && load(auth.currentUser.uid));
    window.addEventListener("santriDataReady", e => {
      const list = e.detail?.list || [];
      if (list.length) { namaList = clean(list.map(x => x.nama)); render(); }
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();

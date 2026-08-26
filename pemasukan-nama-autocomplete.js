import { db, auth } from "./firebase-config.js";
import { collection, getDocs, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

(() => {
  if (window.__ckPemasukanAutocompleteStarted) return;
  window.__ckPemasukanAutocompleteStarted = true;

  let namaList = [];
  let stop = null;
  let user = null;
  let bound = false;
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

  function fromCache() {
    const out = [];
    try {
      const direct = Array.isArray(window.__daftarSantri) ? window.__daftarSantri : [];
      direct.forEach(x => out.push(x?.nama ?? x?.namaSantri ?? x?.name ?? x));
      const keys = [];
      if (user?.uid) keys.push(`daftarSantri_${user.uid}`);
      keys.push("daftarSantri");
      keys.forEach(k => {
        const data = JSON.parse(localStorage.getItem(k) || "[]");
        if (Array.isArray(data)) data.forEach(x => out.push(x?.nama ?? x?.namaSantri ?? x?.name ?? x));
      });
    } catch (_) {}
    return clean(out);
  }

  function render() {
    const el = input(), panel = box();
    if (!el || !panel) return;
    const q = normal(el.value);
    panel.innerHTML = "";
    if (!q) { panel.style.display = "none"; return; }
    const hasil = namaList.filter(n => normal(n).startsWith(q)).slice(0, 50);
    hasil.forEach(n => {
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
    });
    // Autocomplete hanya saran. Jika tidak ada kecocokan, biarkan kosong.
    panel.style.display = hasil.length ? "block" : "none";
  }

  function bind() {
    const el = input(), panel = box();
    if (!el || !panel || bound) return;
    bound = true;
    el.dataset.ckPrefixAutocomplete = "1";
    el.setAttribute("autocomplete", "off");
    el.addEventListener("input", render);
    el.addEventListener("focus", () => { namaList = clean([...namaList, ...fromCache()]); render(); });
    document.addEventListener("click", e => {
      if (!el.contains(e.target) && !panel.contains(e.target)) panel.style.display = "none";
    });
    window.addEventListener("santriDataReady", e => {
      const list = e.detail?.list || [];
      namaList = clean([...namaList, ...list.map(x => x?.nama ?? x?.namaSantri ?? x?.name ?? "")]);
      render();
    });
  }

  async function load() {
    if (stop) { stop(); stop = null; }
    namaList = fromCache();
    bind();
    render();
    if (!user) return;
    try {
      const q = query(collection(db, "santri"), where("uid", "==", user.uid));
      const snap = await getDocs(q);
      if (auth.currentUser?.uid !== user.uid) return;
      namaList = clean([
        ...fromCache(),
        ...snap.docs.map(d => {
          const x = d.data() || {};
          return x.nama ?? x.namaSantri ?? x.namaSiswaSiswi ?? x.namaSiswa ?? x.nama_siswa ?? "";
        })
      ]);
      render();
      stop = onSnapshot(q, s => {
        if (auth.currentUser?.uid !== user.uid) return;
        namaList = clean([
          ...fromCache(),
          ...s.docs.map(d => {
            const x = d.data() || {};
            return x.nama ?? x.namaSantri ?? x.namaSiswaSiswi ?? x.namaSiswa ?? x.nama_siswa ?? "";
          })
        ]);
        render();
      }, e => console.warn("Autocomplete santri listener:", e));
    } catch (e) {
      console.warn("Autocomplete nama Pemasukan gagal memuat santri:", e);
      namaList = fromCache();
      render();
    }
  }

  function start() { bind(); load(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
  else start();
  onAuthStateChanged(auth, u => { user = u || null; bind(); load(); });
})();

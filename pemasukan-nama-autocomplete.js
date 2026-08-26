import { db, auth } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

(() => {
  if (window.__ckPemasukanAutocompleteStarted) return;
  window.__ckPemasukanAutocompleteStarted = true;

  let namaList = [];
  let user = null;
  let boundInput = null;

  const getInput = () => document.getElementById("namaSiswaSiswiPemasukan");
  const getBox = () => document.getElementById("saranNamaPemasukan");
  const norm = v => String(v ?? "").trim().toLocaleLowerCase("id-ID");

  function extract(x) {
    if (typeof x === "string") return x;
    if (!x || typeof x !== "object") return "";
    return x.nama ?? x.namaSiswaSiswi ?? x.namaSiswa ?? x.nama_siswa_siswi ?? x.keterangan ?? x.namaSantri ?? x.name ?? "";
  }

  function clean(list) {
    const seen = new Set();
    return list.map(extract).map(v => String(v).trim()).filter(Boolean).filter(v => {
      const k = norm(v);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((a,b) => a.localeCompare(b, "id", { sensitivity: "base" }));
  }

  // Daftar Nama menyimpan cache dengan kunci daftarNama_UID.
  function loadLocal() {
    const result = [];
    try {
      if (Array.isArray(window.__daftarSantri)) result.push(...window.__daftarSantri);
      const keys = user?.uid ? [`daftarNama_${user.uid}`, `daftarSantri_${user.uid}`] : ["daftarNama", "daftarSantri"];
      keys.forEach(key => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (Array.isArray(data)) result.push(...data);
      });
    } catch (_) {}
    return result;
  }

  function render() {
    const input = getInput();
    const box = getBox();
    if (!input || !box) return;
    const text = norm(input.value);
    box.innerHTML = "";
    if (!text) { box.style.display = "none"; return; }

    const matches = namaList.filter(n => norm(n).startsWith(text)).slice(0, 50);
    matches.forEach(name => {
      const item = document.createElement("button");
      item.type = "button";
      item.textContent = name;
      item.setAttribute("role", "option");
      item.addEventListener("mousedown", e => {
        e.preventDefault();
        input.value = name;
        box.style.display = "none";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      box.appendChild(item);
    });
    box.style.display = matches.length ? "block" : "none";
  }

  function refreshLocal() {
    namaList = clean([...namaList, ...loadLocal()]);
    render();
  }

  function bind() {
    const input = getInput();
    if (!input || boundInput === input) return;
    boundInput = input;
    input.setAttribute("autocomplete", "off");
    input.addEventListener("input", render);
    input.addEventListener("focus", refreshLocal);
    document.addEventListener("click", e => {
      const box = getBox();
      if (box && !input.contains(e.target) && !box.contains(e.target)) box.style.display = "none";
    });
  }

  async function loadFirebase() {
    if (!user) return;
    try {
      // Gunakan sumber yang sama dengan Daftar Nama: santri.uid == akun aktif.
      const snap = await getDocs(query(collection(db, "santri"), where("uid", "==", user.uid)));
      if (auth.currentUser?.uid !== user.uid) return;
      namaList = clean([...loadLocal(), ...snap.docs.map(d => d.data())]);
      render();
    } catch (e) {
      console.warn("Autocomplete nama Pemasukan:", e);
      namaList = clean(loadLocal());
      render();
    }
  }

  function start() {
    bind();
    namaList = clean(loadLocal());
    render();
    loadFirebase();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  // Daftar Nama memberi tahu halaman lain ketika daftar berubah.
  window.addEventListener("daftarNamaBerubah", e => {
    const list = e.detail?.nama || [];
    namaList = clean(list);
    render();
  });

  onAuthStateChanged(auth, u => {
    user = u || null;
    namaList = clean(loadLocal());
    bind();
    render();
    loadFirebase();
  });
})();

import { db, auth } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
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

  function clean(list) {
    const seen = new Set();
    return list.map(v => String(v ?? "").trim()).filter(Boolean).filter(v => {
      const k = norm(v);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((a,b) => a.localeCompare(b, "id", { sensitivity: "base" }));
  }

  function extract(x) {
    if (typeof x === "string") return x;
    if (!x || typeof x !== "object") return "";
    return x.nama ?? x.namaSantri ?? x.namaSiswaSiswi ?? x.namaSiswa ?? x.nama_siswa ?? x.name ?? "";
  }

  function loadLocal() {
    const result = [];
    try {
      if (Array.isArray(window.__daftarSantri)) window.__daftarSantri.forEach(x => result.push(extract(x)));
      const keys = user?.uid ? [`daftarSantri_${user.uid}`, "daftarSantri"] : ["daftarSantri"];
      keys.forEach(key => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (Array.isArray(data)) data.forEach(x => result.push(extract(x)));
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
    if (!text) {
      box.style.display = "none";
      return;
    }

    const matches = namaList.filter(n => norm(n).startsWith(text)).slice(0, 50);
    for (const name of matches) {
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
    }
    box.style.display = matches.length ? "block" : "none";
  }

  function bind() {
    const input = getInput();
    if (!input || boundInput === input) return;
    boundInput = input;
    input.setAttribute("autocomplete", "off");
    input.addEventListener("input", render);
    input.addEventListener("focus", () => {
      namaList = clean([...namaList, ...loadLocal()]);
      render();
    });
    document.addEventListener("click", e => {
      const box = getBox();
      if (box && !input.contains(e.target) && !box.contains(e.target)) box.style.display = "none";
    });
  }

  async function loadFirebase() {
    if (!user) return;
    try {
      // Ambil seluruh daftar santri milik akun ini; autocomplete tidak mengubah data.
      const snap = await getDocs(collection(db, "santri"));
      if (auth.currentUser?.uid !== user.uid) return;
      const remote = [];
      snap.forEach(doc => {
        const data = doc.data() || {};
        if (!data.uid || data.uid === user.uid) remote.push(extract(data));
      });
      namaList = clean([...namaList, ...remote, ...loadLocal()]);
      render();
    } catch (e) {
      console.warn("Autocomplete nama Pemasukan:", e);
      namaList = clean([...namaList, ...loadLocal()]);
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
  onAuthStateChanged(auth, u => {
    user = u || null;
    namaList = clean(loadLocal());
    bind();
    loadFirebase();
  });
})();

// Autocomplete nama santri khusus halaman Pembayaran.
// Tidak mengubah proses simpan pembayaran.
import { db } from "../firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

(() => {
  const inputIds = ["namaSantriPemasukan", "namaSantri", "santri"];
  let input = null;
  let box = null;
  let names = [];
  let unsubscribe = null;

  const findInput = () => inputIds.map(id => document.getElementById(id)).find(Boolean) || null;

  const ensureUI = () => {
    input = findInput();
    if (!input || box) return;
    const wrapper = input.parentElement;
    if (!wrapper) return;
    wrapper.style.position = "relative";
    box = document.createElement("div");
    box.id = "ckNamaSantriSuggestions";
    box.hidden = true;
    box.style.cssText = "position:absolute;left:0;right:0;top:100%;z-index:2000;background:#fff;border:1px solid #ced4da;border-radius:0 0 12px 12px;box-shadow:0 6px 18px rgba(0,0,0,.12);max-height:240px;overflow:auto;";
    wrapper.appendChild(box);

    input.setAttribute("autocomplete", "off");
    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    input.addEventListener("keydown", e => {
      if (e.key === "Escape") hide();
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      if (e.key === "Enter" && !box.hidden) {
        const active = box.querySelector(".ck-suggest-active");
        if (active) { e.preventDefault(); active.click(); }
      }
    });
  };

  const hide = () => { if (box) box.hidden = true; };

  const render = () => {
    ensureUI();
    if (!input || !box) return;
    const q = input.value.trim().toLocaleLowerCase("id-ID");
    if (!q) { hide(); return; }
    const matches = names.filter(n => n.toLocaleLowerCase("id-ID").startsWith(q)).slice(0, 20);
    box.innerHTML = "";
    if (!matches.length) { hide(); return; }
    matches.forEach(name => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "list-group-item list-group-item-action border-0 text-start ck-suggest-item";
      b.textContent = name;
      b.style.cssText = "display:block;width:100%;padding:10px 12px;background:transparent;cursor:pointer;";
      b.addEventListener("mousedown", e => e.preventDefault());
      b.addEventListener("click", () => { input.value = name; hide(); input.dispatchEvent(new Event("change", { bubbles:true })); });
      box.appendChild(b);
    });
    box.hidden = false;
  };

  const move = delta => {
    if (!box || box.hidden) return;
    const items = [...box.querySelectorAll(".ck-suggest-item")];
    if (!items.length) return;
    let index = items.findIndex(x => x.classList.contains("ck-suggest-active"));
    index = Math.max(0, Math.min(items.length - 1, index + delta));
    items.forEach(x => x.classList.remove("ck-suggest-active"));
    items[index].classList.add("ck-suggest-active");
    items[index].scrollIntoView({ block:"nearest" });
  };

  const start = () => {
    ensureUI();
    if (unsubscribe) unsubscribe();
    unsubscribe = onSnapshot(collection(db, "santri"), snap => {
      const unique = new Set();
      snap.forEach(d => {
        const x = d.data() || {};
        const name = String(x.nama || x.namaSantri || x.nama_santri || "").trim();
        if (name) unique.add(name);
      });
      names = [...unique].sort((a,b) => a.localeCompare(b, "id", { sensitivity:"base" }));
      if (input && input.value.trim()) render();
    }, err => console.warn("Autocomplete santri tidak dapat memuat daftar:", err));
  };

  document.addEventListener("DOMContentLoaded", () => setTimeout(start, 0));
  document.addEventListener("click", e => { if (box && !box.contains(e.target) && e.target !== input) hide(); });
})();

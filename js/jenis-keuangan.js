// KEUANGAN - jenis/pos keuangan bersama untuk pembayaran dan pengeluaran.
// Tidak menghapus jenis lama; hanya menambahkan jenis umum dan jenis custom.
(() => {
  "use strict";

  const KEY = "jenisKeuanganCustom";
  const DEFAULTS = [
    "SPP",
    "Uang Kegiatan",
    "Uang Gedung",
    "Seragam",
    "Ujian",
    "Syahriyyah",
    "Infaq",
    "Kas",
    "Beras"
  ];

  const norm = value => String(value ?? "").trim().replace(/\s+/g, " ");
  const key = value => norm(value).toLocaleLowerCase("id-ID");

  function getCustom() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data.map(norm).filter(Boolean) : [];
    } catch (_) { return []; }
  }

  function saveCustom(list) {
    const seen = new Set();
    const clean = [];
    [...list].forEach(item => {
      const value = norm(item);
      const k = key(value);
      if (!value || seen.has(k)) return;
      seen.add(k);
      clean.push(value);
    });
    localStorage.setItem(KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent("jenisKeuanganBerubah", { detail: { jenis: clean } }));
    return clean;
  }

  function allTypes(extra = []) {
    const seen = new Set();
    const result = [];
    [...DEFAULTS, ...getCustom(), ...extra].forEach(item => {
      const value = norm(item);
      const k = key(value);
      if (!value || seen.has(k)) return;
      seen.add(k);
      result.push(value);
    });
    return result;
  }

  function addCustom(value) {
    const name = norm(value);
    if (!name) return "";
    saveCustom([...getCustom(), name]);
    return name;
  }

  function findSelect() {
    for (const id of ["jenis", "jenisPembayaran", "kategori", "jenisPengeluaran", "kategoriPengeluaran"]) {
      const el = document.getElementById(id);
      if (el && el.tagName === "SELECT") return el;
    }
    return null;
  }

  function findOtherInput(select) {
    return select?.parentElement?.querySelector("#ckJenisLainnya") || document.getElementById("ckJenisLainnya");
  }

  function populate(select, extra = []) {
    if (!select || select.tagName !== "SELECT") return;
    const current = select.value;
    const types = allTypes(extra);
    const existing = [...select.options].map(o => norm(o.value || o.textContent)).filter(Boolean);
    const existingSet = new Set(existing.map(key));

    types.forEach(type => {
      if (existingSet.has(key(type)) || key(type) === "lainnya") return;
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      select.appendChild(option);
      existingSet.add(key(type));
    });

    let other = [...select.options].find(o => key(o.value) === "lainnya" || key(o.textContent) === "lainnya");
    if (!other) {
      other = document.createElement("option");
      other.value = "Lainnya";
      other.textContent = "Lainnya — isi sendiri";
      select.appendChild(other);
    } else {
      other.value = "Lainnya";
      other.textContent = "Lainnya — isi sendiri";
    }

    if (current && [...select.options].some(o => key(o.value) === key(current))) select.value = current;
  }

  function injectOtherInput(select) {
    if (!select || select.dataset.ckJenisReady === "1") return;
    select.dataset.ckJenisReady = "1";
    populate(select);

    const wrapper = document.createElement("div");
    wrapper.id = "ckJenisLainnyaWrap";
    wrapper.className = "mt-2";
    wrapper.style.display = "none";
    wrapper.innerHTML = `
      <label class="form-label" for="ckJenisLainnya">Nama jenis/pos keuangan</label>
      <input id="ckJenisLainnya" class="form-control" type="text" maxlength="80" placeholder="Contoh: Buku Paket">
      <div class="form-text">Jenis ini akan disimpan dan dapat digunakan kembali pada pembayaran maupun pengeluaran.</div>`;
    select.parentElement?.appendChild(wrapper);

    const input = wrapper.querySelector("#ckJenisLainnya");
    const toggle = () => {
      const isOther = key(select.value) === "lainnya";
      wrapper.style.display = isOther ? "block" : "none";
      if (!isOther) input.value = "";
    };
    select.addEventListener("change", toggle);
    input.addEventListener("input", () => {
      const value = norm(input.value);
      if (key(select.value) !== "lainnya" || !value) return;
      const option = [...select.options].find(o => key(o.value) === key(value));
      if (option) option.remove();
      const custom = document.createElement("option");
      custom.value = value;
      custom.textContent = value;
      custom.dataset.ckCustom = "1";
      select.appendChild(custom);
      select.value = "Lainnya";
    });
    toggle();
  }

  function resolve(selectOrIds) {
    const select = typeof selectOrIds === "string" ? document.getElementById(selectOrIds) : (selectOrIds || findSelect());
    if (!select) return "";
    if (key(select.value) !== "lainnya") return norm(select.value);
    const input = findOtherInput(select);
    const value = norm(input?.value);
    if (!value) return "";
    addCustom(value);
    const exists = [...select.options].find(o => key(o.value) === key(value));
    if (!exists) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    }
    select.value = value;
    return value;
  }

  function reset(selectOrIds) {
    const select = typeof selectOrIds === "string" ? document.getElementById(selectOrIds) : (selectOrIds || findSelect());
    if (!select) return;
    select.value = "";
    const input = findOtherInput(select);
    if (input) input.value = "";
    const wrap = document.getElementById("ckJenisLainnyaWrap");
    if (wrap) wrap.style.display = "none";
  }

  function init() {
    const select = findSelect();
    if (!select) return;
    populate(select);
    injectOtherInput(select);
  }

  window.ckJenisKeuangan = { DEFAULTS, allTypes, addCustom, populate, resolve, reset, init };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
  setTimeout(init, 300);
  setTimeout(init, 1000);
  window.addEventListener("jenisKeuanganBerubah", init);
})();

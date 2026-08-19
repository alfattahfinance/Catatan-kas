// CATATAN KAS - bridge tema + fitur tambah banyak santri
(() => {
  "use strict";

  // ============================================================
  // FITUR TAMBAH BANYAK SANTRI
  // Sengaja dibuat mandiri di file ini agar WebView APK tidak
  // bergantung pada pemuatan script kedua.
  // Penyimpanan mengikuti halaman Santri yang sekarang: localStorage
  // dengan key "daftarSantri".
  // ============================================================
  const norm = v => String(v ?? "").trim().replace(/\s+/g, " ");
  const key = v => norm(v).toLocaleLowerCase("id-ID");

  function isSantriPage() {
    return /data santri|santri/i.test(document.title || "") ||
      !!document.getElementById("namaSantri") ||
      !!document.getElementById("kelasSantri") ||
      !!document.getElementById("tbodySantri");
  }

  function getSantri() {
    try {
      const data = JSON.parse(localStorage.getItem("daftarSantri") || "[]");
      return Array.isArray(data) ? data : [];
    } catch (_) { return []; }
  }

  function setSantri(data) {
    localStorage.setItem("daftarSantri", JSON.stringify(data));
  }

  function parseCSV(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i], n = text[i + 1];
      if (c === '"' && quoted && n === '"') { cell += '"'; i++; continue; }
      if (c === '"') { quoted = !quoted; continue; }
      if (c === ',' && !quoted) { row.push(cell); cell = ""; continue; }
      if ((c === "\n" || c === "\r") && !quoted) {
        if (c === "\r" && n === "\n") i++;
        row.push(cell); cell = "";
        if (row.some(v => norm(v))) rows.push(row);
        row = [];
        continue;
      }
      cell += c;
    }
    row.push(cell);
    if (row.some(v => norm(v))) rows.push(row);
    return rows;
  }

  function header(v) {
    return key(v).replace(/[._()\-]/g, "").replace(/\s+/g, "");
  }

  function rowsToSantri(rows) {
    if (!rows.length) return [];
    const h = rows[0].map(header);
    const ni = h.findIndex(x => ["nama", "namasantri", "name", "santri"].includes(x));
    const ki = h.findIndex(x => ["kelas", "kelassantri", "class"].includes(x));
    const hi = h.findIndex(x => ["hp", "nohp", "nomorhp", "nowali", "wali"].includes(x));
    const hasHeader = ni >= 0 || ki >= 0 || hi >= 0;
    const start = hasHeader ? 1 : 0;
    const nameIndex = ni >= 0 ? ni : 0;
    const classIndex = ki >= 0 ? ki : 1;
    const hpIndex = hi >= 0 ? hi : 2;
    return rows.slice(start).map(r => ({
      nama: norm(r[nameIndex]),
      kelas: norm(r[classIndex]) || "-",
      hp: norm(r[hpIndex]) || ""
    })).filter(x => x.nama);
  }

  let excelPromise;
  function loadExcel() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (excelPromise) return excelPromise;
    excelPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      s.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error("Pembaca Excel tidak tersedia."));
      s.onerror = () => reject(new Error("Gagal memuat pembaca Excel. Pastikan internet aktif."));
      document.head.appendChild(s);
    });
    return excelPromise;
  }

  async function readImportFile(file) {
    const name = String(file?.name || "").toLowerCase();
    if (name.endsWith(".csv") || name.endsWith(".txt")) {
      return rowsToSantri(parseCSV(await file.text()));
    }
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const XLSX = await loadExcel();
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      return sheet ? rowsToSantri(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })) : [];
    }
    throw new Error("Gunakan file Excel (.xlsx/.xls) atau CSV.");
  }

  function addBulkCard() {
    if (!isSantriPage() || document.getElementById("ckBulkSantriCard")) return true;

    // Tempatkan setelah form tambah santri yang sudah ada.
    const normalForm = document.getElementById("btnSimpanSantri")?.closest(".custom-card") ||
      document.getElementById("namaSantri")?.closest(".custom-card") ||
      document.querySelector(".page-title")?.closest(".mb-3");
    if (!normalForm?.parentElement) return false;

    const card = document.createElement("div");
    card.id = "ckBulkSantriCard";
    card.className = "card custom-card mb-3";
    card.innerHTML = `
      <div class="card-body">
        <h5 class="fw-bold mb-2 text-success"><i class="bi bi-people-fill me-2"></i>Tambah Banyak Santri</h5>
        <p class="text-muted small mb-3">Masukkan banyak santri sekaligus dari <b>Excel</b> atau <b>CSV</b>. Kolom: <b>Nama, Kelas, No. HP Wali</b>.</p>
        <input id="ckBulkSantriFile" class="form-control mb-2" type="file" accept=".xlsx,.xls,.csv,text/csv">
        <div id="ckBulkSantriInfo" class="small text-muted mb-2">Belum ada file dipilih.</div>
        <button id="ckBulkSantriImport" type="button" class="btn btn-success w-100 fw-bold" disabled><i class="bi bi-cloud-upload me-1"></i>Simpan Semua Santri</button>
        <button id="ckBulkSantriTemplate" type="button" class="btn btn-outline-success w-100 fw-bold mt-2"><i class="bi bi-download me-1"></i>Download Template CSV</button>
      </div>`;
    normalForm.parentElement.insertBefore(card, normalForm.nextSibling);

    const input = card.querySelector("#ckBulkSantriFile");
    const info = card.querySelector("#ckBulkSantriInfo");
    const button = card.querySelector("#ckBulkSantriImport");
    let pending = [];

    input.addEventListener("change", async () => {
      pending = [];
      button.disabled = true;
      info.className = "small text-muted mb-2";
      const file = input.files?.[0];
      if (!file) { info.textContent = "Belum ada file dipilih."; return; }
      info.textContent = "Membaca file...";
      try {
        pending = await readImportFile(file);
        info.textContent = pending.length ? `Ditemukan ${pending.length} santri. Siap disimpan.` : "Tidak ditemukan data santri.";
        button.disabled = pending.length === 0;
      } catch (e) {
        info.textContent = e.message || "File tidak dapat dibaca.";
        info.className = "small text-danger mb-2";
      }
    });

    button.addEventListener("click", () => {
      if (!pending.length) return;
      const existing = getSantri();
      const seen = new Set(existing.map(x => key(x.nama)).filter(Boolean));
      let added = 0, skipped = 0;
      for (const item of pending) {
        const k = key(item.nama);
        if (!k || seen.has(k)) { skipped++; continue; }
        existing.push({ id: Date.now() + added, nama: item.nama, kelas: item.kelas, hp: item.hp });
        seen.add(k);
        added++;
      }
      if (!added) { alert("Tidak ada santri baru untuk ditambahkan."); return; }
      setSantri(existing);
      // Gunakan renderer halaman Santri yang sudah ada.
      if (typeof window.tampilkanSantri === "function") window.tampilkanSantri();
      const count = document.getElementById("jumlahSantri");
      if (count) count.textContent = existing.length + " santri";
      alert(`✅ ${added} santri berhasil ditambahkan.${skipped ? `\n${skipped} nama dilewati karena duplikat.` : ""}`);
      input.value = "";
      pending = [];
      info.textContent = "Belum ada file dipilih.";
      button.disabled = true;
    });

    card.querySelector("#ckBulkSantriTemplate").addEventListener("click", () => {
      const csv = "Nama,Kelas,No. HP Wali\nAhmad,1 Ula,08123456789\nAli,1 Ula,08123456780\n";
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template-santri.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    return true;
  }

  function startBulkFeature() {
    if (!isSantriPage()) return;
    if (addBulkCard()) return;
    setTimeout(startBulkFeature, 250);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startBulkFeature, { once: true });
  else startBulkFeature();
  setTimeout(startBulkFeature, 700);
  setTimeout(startBulkFeature, 1600);
})();

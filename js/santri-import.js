// Fitur Tambah Banyak Santri untuk halaman Santri.
(() => {
  'use strict';

  if (window.__ckBulkSantriFeature) return;
  window.__ckBulkSantriFeature = true;

  const norm = x => String(x ?? '').trim().replace(/\s+/g, ' ');
  const key = x => norm(x).toLocaleLowerCase('id-ID');

  function readList() {
    try {
      const x = JSON.parse(localStorage.getItem('daftarSantri') || '[]');
      return Array.isArray(x) ? x : [];
    } catch (_) { return []; }
  }

  function saveList(x) {
    localStorage.setItem('daftarSantri', JSON.stringify(x));
  }

  function parseCSV(text) {
    const rows = [];
    let row = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i], n = text[i + 1];
      if (c === '"' && quoted && n === '"') { cell += '"'; i++; continue; }
      if (c === '"') { quoted = !quoted; continue; }
      if (c === ',' && !quoted) { row.push(cell); cell = ''; continue; }
      if ((c === '\n' || c === '\r') && !quoted) {
        if (c === '\r' && n === '\n') i++;
        row.push(cell); cell = '';
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

  function rowsToStudents(rows) {
    if (!rows.length) return [];
    const h = rows[0].map(x => key(x).replace(/[._-]/g, '').replace(/\s+/g, ''));
    const ni = Math.max(0, h.findIndex(x => ['nama','namasantri','name','santri'].includes(x)));
    const ci = h.findIndex(x => ['kelas','kelassantri','class'].includes(x));
    const hi = h.findIndex(x => ['hp','nohp','nomorhp','wali'].includes(x));
    const hasHeader = h.some(x => ['nama','namasantri','name','santri','kelas','kelassantri','class'].includes(x));
    return rows.slice(hasHeader ? 1 : 0).map(r => ({
      nama: norm(r[ni]),
      kelas: norm(r[ci >= 0 ? ci : 1]) || '-',
      hp: norm(r[hi >= 0 ? hi : 2]) || ''
    })).filter(x => x.nama);
  }

  async function readFile(file) {
    const name = String(file?.name || '').toLowerCase();
    if (name.endsWith('.csv') || name.endsWith('.txt')) {
      return rowsToStudents(parseCSV(await file.text()));
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      if (!window.XLSX) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
          s.onload = resolve;
          s.onerror = () => reject(new Error('Pembaca Excel gagal dimuat. Pastikan internet aktif.'));
          document.head.appendChild(s);
        });
      }
      const wb = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      return sheet ? rowsToStudents(window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })) : [];
    }
    throw new Error('Gunakan file CSV, XLSX, atau XLS.');
  }

  function makeUI() {
    if (document.getElementById('ckBulkSantriCard')) return true;
    const anchor = document.getElementById('ckBulkSantriAnchor') ||
      document.getElementById('formSantri')?.closest('.card') ||
      document.querySelector('.page-title')?.closest('.mb-3') ||
      document.querySelector('.custom-card');
    if (!anchor || !anchor.parentNode) return false;

    const card = document.createElement('div');
    card.id = 'ckBulkSantriCard';
    card.className = 'card custom-card mb-3';
    card.innerHTML = `
      <div class="card-body">
        <h5 class="fw-bold mb-2 text-success"><i class="bi bi-people-fill me-1"></i>Tambah Banyak Santri</h5>
        <div class="text-muted small mb-3">Masukkan banyak santri sekaligus dari Excel atau CSV. Kolom: <b>Nama, Kelas, HP</b>.</div>
        <input id="ckBulkSantriFile" type="file" class="form-control mb-2" accept=".xlsx,.xls,.csv,text/csv">
        <div id="ckBulkSantriInfo" class="small text-muted mb-2">Belum ada file dipilih.</div>
        <button id="ckBulkSantriImport" type="button" class="btn btn-success w-100 fw-bold" disabled><i class="bi bi-upload me-1"></i>Simpan Semua Santri</button>
        <button id="ckBulkSantriTemplate" type="button" class="btn btn-outline-success w-100 fw-bold mt-2"><i class="bi bi-download me-1"></i>Download Template CSV</button>
      </div>`;
    anchor.parentNode.insertBefore(card, anchor);

    const input = card.querySelector('#ckBulkSantriFile');
    const info = card.querySelector('#ckBulkSantriInfo');
    const btn = card.querySelector('#ckBulkSantriImport');
    let pending = [];

    input.addEventListener('change', async () => {
      pending = [];
      btn.disabled = true;
      const f = input.files && input.files[0];
      if (!f) return;
      info.textContent = 'Membaca file...';
      try {
        pending = await readFile(f);
        info.textContent = pending.length ? `Ditemukan ${pending.length} santri. Siap disimpan.` : 'Tidak ditemukan data santri.';
        btn.disabled = !pending.length;
      } catch (e) {
        info.textContent = e.message || 'File tidak dapat dibaca.';
        info.classList.add('text-danger');
      }
    });

    btn.addEventListener('click', () => {
      if (!pending.length) return;
      const existing = readList();
      const seen = new Set(existing.map(x => key(x.nama)).filter(Boolean));
      let added = 0, skipped = 0;
      pending.forEach(s => {
        const k = key(s.nama);
        if (!k || seen.has(k)) { skipped++; return; }
        existing.push({ id: Date.now() + added, nama: s.nama, kelas: s.kelas, hp: s.hp });
        seen.add(k);
        added++;
      });
      if (!added) { alert('Tidak ada santri baru untuk ditambahkan.'); return; }
      saveList(existing);
      if (typeof window.tampilkanSantri === 'function') window.tampilkanSantri();
      const count = document.getElementById('jumlahSantri');
      if (count) count.textContent = existing.length + ' santri';
      alert(`✅ ${added} santri berhasil ditambahkan.${skipped ? `\n${skipped} nama dilewati karena duplikat.` : ''}`);
      input.value = '';
      pending = [];
      info.classList.remove('text-danger');
      info.textContent = 'Belum ada file dipilih.';
      window.dispatchEvent(new Event('santriDataChanged'));
    });

    card.querySelector('#ckBulkSantriTemplate').addEventListener('click', () => {
      const csv = 'Nama,Kelas,HP\nAhmad,1 Ula,08123456789\nAli,1 Ula,08123456780\n';
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-santri.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    return true;
  }

  function start() {
    if (makeUI()) return;
    setTimeout(start, 300);
  }
  start();
})();

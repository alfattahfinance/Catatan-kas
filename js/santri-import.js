// Import banyak santri - hanya aktif di santri.html.
// Menggunakan localStorage yang dipakai halaman Santri saat ini agar fitur lama tetap utuh.
(() => {
  if (!/santri\.html$/i.test(location.pathname)) return;
  if (window.__ckBulkSantriLoaded) return;
  window.__ckBulkSantriLoaded = true;

  const readList = () => {
    try {
      const x = JSON.parse(localStorage.getItem('daftarSantri') || '[]');
      return Array.isArray(x) ? x : [];
    } catch (_) { return []; }
  };
  const saveList = x => localStorage.setItem('daftarSantri', JSON.stringify(x));
  const norm = x => String(x ?? '').trim().replace(/\s+/g, ' ');
  const key = x => norm(x).toLocaleLowerCase('id-ID');

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
        row = []; continue;
      }
      cell += c;
    }
    row.push(cell);
    if (row.some(v => norm(v))) rows.push(row);
    return rows;
  }

  function rowsToStudents(rows) {
    if (!rows.length) return [];
    const first = rows[0].map(x => key(x));
    const nameIndex = first.findIndex(x => ['nama','nama santri','namasantri'].includes(x));
    const classIndex = first.findIndex(x => ['kelas','kelas santri','kelassantri'].includes(x));
    const hpIndex = first.findIndex(x => ['hp','no hp','no. hp','no hp wali','wali'].includes(x));
    const start = nameIndex >= 0 ? 1 : 0;
    const ni = nameIndex >= 0 ? nameIndex : 0;
    return rows.slice(start).map(r => ({
      nama: norm(r[ni]),
      kelas: norm(r[classIndex >= 0 ? classIndex : 1]) || '-',
      hp: norm(r[hpIndex >= 0 ? hpIndex : 2]) || ''
    })).filter(x => x.nama);
  }

  function updateCount() {
    const el = document.getElementById('jumlahSantri');
    if (el) el.textContent = readList().length + ' santri';
  }

  function makeUI() {
    if (document.getElementById('ckBulkSantriCard')) return;
    const title = document.querySelector('.page-title');
    const anchor = title?.closest('.mb-3') || document.querySelector('.custom-card');
    if (!anchor) return setTimeout(makeUI, 250);

    const card = document.createElement('div');
    card.id = 'ckBulkSantriCard';
    card.className = 'card custom-card';
    card.innerHTML = `
      <div class="card-body">
        <h5 class="fw-bold mb-2 text-success"><i class="bi bi-file-earmark-spreadsheet"></i> Import Banyak Santri</h5>
        <p class="text-muted small mb-3">Pilih CSV dengan kolom <b>Nama, Kelas, HP</b>. Jika hanya nama, cukup satu kolom Nama.</p>
        <input id="ckBulkSantriFile" type="file" class="form-control mb-2" accept=".csv,text/csv">
        <div id="ckBulkSantriInfo" class="small text-muted mb-2"></div>
        <button id="ckBulkSantriImport" type="button" class="btn btn-success w-100 fw-bold" disabled>
          <i class="bi bi-upload"></i> Import & Simpan Banyak Santri
        </button>
        <button id="ckBulkSantriTemplate" type="button" class="btn btn-outline-success w-100 fw-bold mt-2">
          <i class="bi bi-download"></i> Download Template CSV
        </button>
      </div>`;
    anchor.parentNode.insertBefore(card, anchor);

    const file = card.querySelector('#ckBulkSantriFile');
    const importBtn = card.querySelector('#ckBulkSantriImport');
    const info = card.querySelector('#ckBulkSantriInfo');
    let pending = [];

    file.addEventListener('change', () => {
      pending = [];
      importBtn.disabled = true;
      const f = file.files?.[0];
      if (!f) { info.textContent = ''; return; }
      if (!/\.csv$/i.test(f.name)) { info.textContent = 'Untuk keamanan, gunakan file CSV.'; return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          pending = rowsToStudents(parseCSV(String(reader.result || '')));
          info.textContent = pending.length ? `Ditemukan ${pending.length} santri. Siap diimport.` : 'Tidak ditemukan nama santri.';
          importBtn.disabled = !pending.length;
        } catch (e) { info.textContent = 'File CSV tidak dapat dibaca.'; }
      };
      reader.readAsText(f, 'UTF-8');
    });

    importBtn.addEventListener('click', () => {
      const existing = readList();
      const seen = new Set(existing.map(x => key(x.nama)));
      let added = 0, skipped = 0;
      for (const s of pending) {
        const k = key(s.nama);
        if (!k || seen.has(k)) { skipped++; continue; }
        existing.push({ id: Date.now() + added, nama: s.nama, kelas: s.kelas, hp: s.hp });
        seen.add(k); added++;
      }
      if (!added) return alert('Tidak ada santri baru untuk ditambahkan.');
      saveList(existing);
      if (typeof window.tampilkanSantri === 'function') window.tampilkanSantri();
      updateCount();
      alert(`✅ ${added} santri berhasil ditambahkan.${skipped ? `\n${skipped} nama dilewati karena duplikat.` : ''}`);
      file.value = ''; pending = []; importBtn.disabled = true; info.textContent = '';
      window.dispatchEvent(new Event('santriDataChanged'));
    });

    card.querySelector('#ckBulkSantriTemplate').addEventListener('click', () => {
      const csv = 'Nama,Kelas,HP\nAhmad,1 Ula,08123456789\nAli,1 Ula,08123456780\n';
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'template-santri.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', makeUI, {once:true});
  else makeUI();
})();

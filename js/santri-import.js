// Import banyak santri - aktif di santri.html.
// Menyimpan ke daftarSantri agar tetap kompatibel dengan halaman Santri yang sekarang.
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

  function headerKey(x) {
    return key(x).replace(/[._-]/g, '').replace(/\s+/g, '');
  }

  function rowsToStudents(rows) {
    if (!rows.length) return [];
    const first = rows[0].map(headerKey);
    const nameIndex = first.findIndex(x => ['nama','namasantri','name','santri'].includes(x));
    const classIndex = first.findIndex(x => ['kelas','kelassantri','class'].includes(x));
    const hpIndex = first.findIndex(x => ['hp','nohp','nohphone','nohPwali','nohPwali','wali','nomorhp'].includes(x));
    const start = nameIndex >= 0 ? 1 : 0;
    const ni = nameIndex >= 0 ? nameIndex : 0;
    return rows.slice(start).map(r => ({
      nama: norm(r[ni]),
      kelas: norm(r[classIndex >= 0 ? classIndex : 1]) || '-',
      hp: norm(r[hpIndex >= 0 ? hpIndex : 2]) || ''
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
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Gagal memuat pembaca Excel. Pastikan internet aktif.'));
          document.head.appendChild(script);
        });
      }
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) return [];
      return rowsToStudents(window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }));
    }
    throw new Error('Format file tidak didukung. Gunakan CSV, XLSX, atau XLS.');
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
        <h5 class="fw-bold mb-2 text-success"><i class="bi bi-people-fill me-1"></i> Tambah Banyak Santri</h5>
        <p class="text-muted small mb-3">Masukkan banyak santri sekaligus memakai <b>Excel (.xlsx/.xls)</b> atau <b>CSV</b>. Kolom yang dibaca: <b>Nama</b>, <b>Kelas</b>, <b>HP</b>.</p>
        <input id="ckBulkSantriFile" type="file" class="form-control mb-2" accept=".xlsx,.xls,.csv,text/csv">
        <div id="ckBulkSantriInfo" class="small text-muted mb-2">Belum ada file dipilih.</div>
        <button id="ckBulkSantriImport" type="button" class="btn btn-success w-100 fw-bold" disabled>
          <i class="bi bi-upload me-1"></i> Simpan Semua Santri
        </button>
        <button id="ckBulkSantriTemplate" type="button" class="btn btn-outline-success w-100 fw-bold mt-2">
          <i class="bi bi-download me-1"></i> Download Template CSV
        </button>
      </div>`;
    anchor.parentNode.insertBefore(card, anchor);

    const file = card.querySelector('#ckBulkSantriFile');
    const importBtn = card.querySelector('#ckBulkSantriImport');
    const info = card.querySelector('#ckBulkSantriInfo');
    let pending = [];

    file.addEventListener('change', async () => {
      pending = [];
      importBtn.disabled = true;
      const f = file.files?.[0];
      if (!f) { info.textContent = 'Belum ada file dipilih.'; return; }
      info.textContent = 'Membaca file...';
      try {
        pending = await readFile(f);
        info.textContent = pending.length ? `Ditemukan ${pending.length} santri. Siap disimpan.` : 'Tidak ditemukan nama santri.';
        importBtn.disabled = !pending.length;
      } catch (e) {
        console.error(e);
        info.textContent = e.message || 'File tidak dapat dibaca.';
        info.classList.add('text-danger');
      }
    });

    importBtn.addEventListener('click', async () => {
      if (!pending.length) return;
      importBtn.disabled = true;
      const old = importBtn.innerHTML;
      importBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Menyimpan...';
      try {
        const existing = readList();
        const seen = new Set(existing.map(x => key(x.nama)).filter(Boolean));
        let added = 0, skipped = 0;
        for (const s of pending) {
          const k = key(s.nama);
          if (!k || seen.has(k)) { skipped++; continue; }
          existing.push({ id: Date.now() + added, nama: s.nama, kelas: s.kelas, hp: s.hp });
          seen.add(k); added++;
        }
        if (!added) {
          alert('Tidak ada santri baru untuk ditambahkan.');
          return;
        }
        saveList(existing);
        if (typeof window.tampilkanSantri === 'function') window.tampilkanSantri();
        updateCount();
        alert(`✅ ${added} santri berhasil ditambahkan.${skipped ? `\n${skipped} nama dilewati karena duplikat.` : ''}`);
        file.value = '';
        pending = [];
        info.classList.remove('text-danger');
        info.textContent = 'Belum ada file dipilih.';
        window.dispatchEvent(new Event('santriDataChanged'));
      } catch (e) {
        console.error(e);
        alert('Gagal menyimpan daftar santri.\n\n' + (e.message || e));
      } finally {
        importBtn.disabled = !pending.length;
        importBtn.innerHTML = old;
      }
    });

    card.querySelector('#ckBulkSantriTemplate').addEventListener('click', () => {
      const csv = 'Nama,Kelas,HP\nAhmad,1 Ula,08123456789\nAli,1 Ula,08123456780\n';
      const blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-santri.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', makeUI, {once:true});
  else makeUI();
})();
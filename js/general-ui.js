/*
 * General UI labels for the public release of Keuangan.
 * Text nodes only: icons/HTML inside buttons are preserved.
 */
(() => {
  'use strict';

  const replacements = [
    ['Pembayaran Santri', 'Pembayaran'],
    ['Data Santri', 'Data Peserta Didik'],
    ['Daftar Santri', 'Daftar Peserta Didik'],
    ['Tambah Santri Baru', 'Tambah Peserta Didik'],
    ['Tambah Santri', 'Tambah Peserta Didik'],
    ['Import Banyak Santri', 'Import Banyak Peserta Didik'],
    ['Import & Simpan Banyak Santri', 'Import & Simpan Banyak Peserta Didik'],
    ['Kelola data santri pondok', 'Kelola data peserta didik'],
    ['Nama Santri', 'Nama Siswa / Peserta Didik'],
    ['Nama santri / keterangan', 'Nama siswa / peserta didik / keterangan'],
    ['Masukkan nama santri', 'Masukkan nama siswa / peserta didik'],
    ['Dashboard Keuangan Pondok', 'Dashboard Keuangan'],
    ['Santri', 'Peserta Didik'],
    ['santri', 'peserta didik']
  ];

  function replaceTextNodes(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    for (const textNode of nodes) {
      let text = textNode.nodeValue || '';
      const before = text;
      for (const [from, to] of replacements) {
        if (text.includes(from)) text = text.replaceAll(from, to);
      }
      if (text !== before) textNode.nodeValue = text;
    }
  }

  function updateAttributes() {
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
      for (const [from, to] of replacements) {
        if (el.placeholder.includes(from)) el.placeholder = el.placeholder.replaceAll(from, to);
      }
    });
  }

  function ensureJenisKeuangan() {
    if (window.ckJenisKeuangan) return;
    if (!document.querySelector('#jenis, #jenisPembayaran, #jenisPengeluaran, #filterKategori, #ckDaftarJenis')) return;
    if (document.querySelector('script[data-ck-jenis-keuangan="1"]')) return;
    const script = document.createElement('script');
    script.src = 'js/jenis-keuangan.js';
    script.dataset.ckJenisKeuangan = '1';
    document.body.appendChild(script);
  }

  function improveExcelDownload() {
    if (!location.pathname.endsWith('dashboard-excel.html')) return;
    if (!window.XLSX || window.__ckExcelDownloadFixed) return;
    window.__ckExcelDownloadFixed = true;
    const originalWriteFile = window.XLSX.writeFile.bind(window.XLSX);
    window.XLSX.writeFile = function (workbook, filename) {
      try {
        const bytes = window.XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'Rekap-Pembayaran.xlsx';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
      } catch (e) {
        console.error('Excel download fallback failed:', e);
        originalWriteFile(workbook, filename);
      }
    };
  }

  function run() {
    replaceTextNodes(document.body);
    updateAttributes();
    ensureJenisKeuangan();
    improveExcelDownload();
    if (location.pathname.endsWith('dashboard-excel.html')) setTimeout(improveExcelDownload, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) replaceTextNodes(node);
        });
      } else if (mutation.type === 'characterData') {
        replaceTextNodes(mutation.target.parentElement || document.body);
      }
    }
    updateAttributes();
  });

  const startObserver = () => {
    if (document.body) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  else startObserver();
})();
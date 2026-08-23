/*
 * General UI labels for the public release of Keuangan.
 * IMPORTANT: this changes visible labels only. Firebase collection/field names
 * such as "santri" are intentionally NOT renamed so existing data remains safe.
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
    ['SANTRI', 'PESERTA DIDIK'],
    ['santri', 'peserta didik']
  ];

  function replaceString(text) {
    let result = String(text ?? '');
    for (const [from, to] of replacements) {
      if (result.includes(from)) result = result.replaceAll(from, to);
    }
    return result;
  }

  function replaceTextNodes(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    for (const textNode of nodes) {
      const before = textNode.nodeValue || '';
      const after = replaceString(before);
      if (after !== before) textNode.nodeValue = after;
    }
  }

  function updateVisibleAttributes() {
    document.querySelectorAll('[title],[aria-label],input[placeholder],textarea[placeholder]').forEach(el => {
      for (const attr of ['title', 'aria-label', 'placeholder']) {
        if (el.hasAttribute(attr)) {
          const before = el.getAttribute(attr) || '';
          const after = replaceString(before);
          if (after !== before) el.setAttribute(attr, after);
        }
      }
    });

    if (document.title) document.title = replaceString(document.title);
    document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]').forEach(el => {
      const before = el.getAttribute('content') || '';
      const after = replaceString(before);
      if (after !== before) el.setAttribute('content', after);
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

  // WebView-safe navigation for the Peserta Didik page.
  // Keep the normal href as the primary route, but explicitly navigate on click
  // so the APK cannot leave this one bottom-nav item unresponsive.
  function ensureStudentNavigation() {
    if (window.__ckStudentNavigationFixed) return;
    window.__ckStudentNavigationFixed = true;
    document.addEventListener('click', event => {
      const link = event.target instanceof Element ? event.target.closest('a[href="santri.html"]') : null;
      if (!link || link.dataset.ckStudentNav === '1') return;
      link.dataset.ckStudentNav = '1';
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(new URL('santri.html', document.baseURI).href);
    }, true);
  }

  function run() {
    replaceTextNodes(document.body);
    updateVisibleAttributes();
    ensureJenisKeuangan();
    improveExcelDownload();
    ensureStudentNavigation();
    if (location.pathname.endsWith('dashboard-excel.html')) setTimeout(improveExcelDownload, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  /* Observe only newly inserted DOM nodes. Do not observe characterData. */
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList' || !mutation.addedNodes.length) continue;
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          replaceTextNodes(node);
          updateVisibleAttributes();
        }
      });
    }
  });

  const startObserver = () => {
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  else startObserver();
})();
/*
 * General UI for Keuangan.
 * Satu pengelola logo untuk semua halaman:
 * - tanpa akun -> logo bawaan
 * - dengan akun -> logo milik akun
 * - tidak pernah memakai logo akun lain / logo lama
 */
(() => {
  'use strict';

  const DEFAULT_LOGO = 'Photoroom_20260812_224807.png?v=20260826';
  const LOGO_SELECTOR = [
    '.app-logo', '.ck-logo', '.logo', '#logoDashboard', '#dashboardLogo',
    '#logo', '#laporanLogo', '#logoPreviewV2', '#logoPreview',
    '#previewLogoDashboard', 'img[alt="Logo Catatan Kas"]',
    'img[alt="Logo Dashboard"]', 'img[alt="Logo aplikasi"]',
    'img[alt="Logo Keuangan"]', '[data-dashboard-logo]'
  ].join(',');

  const replacements = [
    ['Pembayaran Santri', 'Pembayaran'],
    ['Pembayaran Peserta Didik', 'Pembayaran'],
    ['Data Peserta Didik', 'Daftar Nama'],
    ['Data Santri', 'Daftar Nama'],
    ['Daftar Peserta Didik', 'Daftar Nama'],
    ['Daftar Santri', 'Daftar Nama'],
    ['Tambah Peserta Didik Baru', 'Tambah Nama Baru'],
    ['Tambah Peserta Didik', 'Tambah Nama'],
    ['Tambah Santri Baru', 'Tambah Nama Baru'],
    ['Tambah Santri', 'Tambah Nama'],
    ['Import Banyak Peserta Didik', 'Import Banyak Nama'],
    ['Import Banyak Santri', 'Import Banyak Nama'],
    ['Import & Simpan Banyak Peserta Didik', 'Import & Simpan Banyak Nama'],
    ['Import & Simpan Banyak Santri', 'Import & Simpan Banyak Nama'],
    ['Kelola data peserta didik', 'Kelola daftar nama'],
    ['Kelola data santri pondok', 'Kelola daftar nama'],
    ['Nama Siswa / Peserta Didik', 'Nama Lengkap'],
    ['Nama Santri', 'Nama Lengkap'],
    ['Nama siswa / peserta didik / keterangan', 'Nama / Keterangan'],
    ['Nama santri / keterangan', 'Nama / Keterangan'],
    ['Masukkan nama siswa / peserta didik', 'Masukkan nama'],
    ['Masukkan nama santri', 'Masukkan nama'],
    ['Dashboard Keuangan Pondok', 'Dashboard Keuangan'],
    ['Peserta Didik', 'Daftar Nama'],
    ['PESERTA DIDIK', 'DAFTAR NAMA'],
    ['Santri', 'Daftar Nama'],
    ['SANTRI', 'DAFTAR NAMA'],
    ['peserta didik', 'daftar nama'],
    ['santri', 'daftar nama']
  ];

  function replaceString(text) {
    let result = String(text ?? '');
    for (const [from, to] of replacements) result = result.replaceAll(from, to);
    return result;
  }

  function replaceTextNodes(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(textNode => {
      const before = textNode.nodeValue || '';
      const after = replaceString(before);
      if (after !== before) textNode.nodeValue = after;
    });
  }

  function updateVisibleAttributes() {
    document.querySelectorAll('[title],[aria-label],input[placeholder],textarea[placeholder]').forEach(el => {
      ['title', 'aria-label', 'placeholder'].forEach(attr => {
        if (!el.hasAttribute(attr)) return;
        const before = el.getAttribute(attr) || '';
        const after = replaceString(before);
        if (after !== before) el.setAttribute(attr, after);
      });
    });
    if (document.title) document.title = replaceString(document.title);
    document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]').forEach(el => {
      el.setAttribute('content', replaceString(el.getAttribute('content') || ''));
    });
    document.querySelectorAll('a[href="santri.html"]').forEach(el => el.setAttribute('href', 'siswa-siswi.html'));
  }

  function currentUid() {
    return String(window.currentFirebaseUid || '').trim();
  }

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch (_) { return {}; }
  }

  function validLogo(value) {
    const v = String(value || '').trim();
    if (!v || /logo-catatan-kas\.(?:jpg|jpeg|png|webp)$/i.test(v)) return false;
    return /^data:image\//i.test(v) || /^https?:\/\//i.test(v) ||
      /^(?:\.\/)?[\w./-]+\.(?:png|jpe?g|webp|gif|svg)(?:\?.*)?$/i.test(v);
  }

  function configuredLogo() {
    const uid = currentUid();
    if (!uid) return DEFAULT_LOGO;

    const scopedLogo = String(localStorage.getItem(`logoDashboard_${uid}`) || '').trim();
    if (validLogo(scopedLogo)) return scopedLogo;

    const scopedSettings = readJson(`pengaturanAplikasi_${uid}`);
    const fromSettings = scopedSettings.logoDashboard || scopedSettings.logo || scopedSettings.logoUrl;
    if (validLogo(fromSettings)) return fromSettings;

    return DEFAULT_LOGO;
  }

  function applyLogos(root = document) {
    const logo = configuredLogo();
    const nodes = root.querySelectorAll ? root.querySelectorAll(LOGO_SELECTOR) : [];
    nodes.forEach(img => {
      if (!(img instanceof HTMLImageElement)) return;
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.removeAttribute('data-src');
      img.dataset.logoManager = 'account-single-source';
      img.onerror = () => {
        img.onerror = null;
        img.src = DEFAULT_LOGO;
      };
      if (img.getAttribute('src') !== logo) img.src = logo;
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

  function smoothNavigate(link) {
    if (!link || link.dataset.ckSmoothNav === '1') return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    let target;
    try { target = new URL(href, document.baseURI); } catch (_) { return; }
    if (target.origin !== location.origin || !/\.html(?:$|[?#])/i.test(target.pathname)) return;
    link.dataset.ckSmoothNav = '1';
    document.body.classList.add('ck-page-leaving');
    window.setTimeout(() => window.location.assign(target.href), 150);
  }

  function ensureSmoothBottomNavigation() {
    if (window.__ckSmoothBottomNavigationFixed) return;
    window.__ckSmoothBottomNavigationFixed = true;
    document.addEventListener('click', event => {
      const link = event.target instanceof Element ? event.target.closest('.ck-bottom a') : null;
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = link.getAttribute('href');
      if (!href) return;
      const target = new URL(href, document.baseURI);
      if (target.href === location.href) return;
      event.preventDefault();
      event.stopPropagation();
      smoothNavigate(link);
    }, true);
  }

  function ensureDaftarNamaNavigation() {
    if (window.__ckDaftarNamaNavigationFixed) return;
    window.__ckDaftarNamaNavigationFixed = true;
    document.addEventListener('click', event => {
      const link = event.target instanceof Element ? event.target.closest('a[href="siswa-siswi.html"], a[href="santri.html"]') : null;
      if (!link || link.dataset.ckStudentNav === '1' || link.dataset.ckSmoothNav === '1') return;
      link.dataset.ckStudentNav = '1';
      event.preventDefault();
      event.stopPropagation();
      document.body.classList.add('ck-page-leaving');
      window.setTimeout(() => window.location.assign(new URL('siswa-siswi.html', document.baseURI).href), 150);
    }, true);
  }

  function run() {
    replaceTextNodes(document.body);
    updateVisibleAttributes();
    applyLogos();
    ensureJenisKeuangan();
    improveExcelDownload();
    ensureSmoothBottomNavigation();
    ensureDaftarNamaNavigation();
    if (location.pathname.endsWith('dashboard-excel.html')) setTimeout(improveExcelDownload, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  window.addEventListener('accountReady', applyLogos);
  window.addEventListener('accountDataReady', applyLogos);
  window.addEventListener('logoDashboardChanged', applyLogos);
  window.addEventListener('settingsChanged', applyLogos);
  window.addEventListener('pageshow', applyLogos);
  window.addEventListener('focus', applyLogos);

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList' || !mutation.addedNodes.length) continue;
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        replaceTextNodes(node);
        updateVisibleAttributes();
        applyLogos(node);
      });
    }
  });

  const startObserver = () => {
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  else startObserver();
})();
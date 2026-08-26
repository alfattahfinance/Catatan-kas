/*
 * General UI for Keuangan.
 * Satu sumber tampilan aplikasi untuk semua halaman:
 * - nama lembaga + subjudul selalu mengikuti Pengaturan Aplikasi
 * - logo mengikuti akun yang sedang aktif
 * - tanpa akun memakai nilai bawaan
 */
(() => {
  'use strict';

  const DEFAULT_LOGO = 'Photoroom_20260812_224807.png?v=20260826';
  const DEFAULT_APP_NAME = 'Keuangan';
  const DEFAULT_APP_SUBTITLE = 'Dashboard Keuangan';
  const LOGO_SELECTOR = [
    '.app-logo', '.ck-logo', '.logo', '#logoDashboard', '#dashboardLogo',
    '#logo', '#laporanLogo', '#logoPreviewV2', '#logoPreview',
    '#previewLogoDashboard', 'img[alt="Logo Catatan Kas"]',
    'img[alt="Logo Dashboard"]', 'img[alt="Logo aplikasi"]',
    'img[alt="Logo Keuangan"]', '[data-dashboard-logo]'
  ].join(',');
  const APP_NAME_SELECTOR = '[data-app-name], .app-name, .ck-title';
  const APP_SUBTITLE_SELECTOR = '[data-app-subtitle], .app-subtitle, .ck-subtitle';

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
    return String(window.currentFirebaseUid || window.currentFirebaseUser?.uid || '').trim();
  }

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch (_) { return {}; }
  }

  function readSettings() {
    const uid = currentUid();
    const scoped = uid ? readJson(`pengaturanAplikasi_${uid}`) : {};
    const direct = readJson('pengaturanAplikasi');
    return { ...direct, ...scoped };
  }

  function configuredAppText() {
    const settings = readSettings();
    const namaLembaga = String(settings.namaLembaga ?? settings.namaPondok ?? settings.namaSekolah ?? settings.lembaga ?? '').trim();
    const subJudul = String(settings.subJudul ?? settings.subjudul ?? settings.subTitle ?? '').trim();
    return {
      namaLembaga: namaLembaga || DEFAULT_APP_NAME,
      subJudul: subJudul || DEFAULT_APP_SUBTITLE
    };
  }

  function applyAppText(root = document) {
    const { namaLembaga, subJudul } = configuredAppText();
    const scope = root?.querySelectorAll ? root : document;
    scope.querySelectorAll(APP_NAME_SELECTOR).forEach(el => {
      el.textContent = namaLembaga;
      el.dataset.settingsAppName = '1';
    });
    scope.querySelectorAll(APP_SUBTITLE_SELECTOR).forEach(el => {
      el.textContent = subJudul;
      el.dataset.settingsAppSubtitle = '1';
    });

    // Semua halaman tetap memiliki judul browser yang relevan, tetapi memakai
    // nama lembaga dari Pengaturan sebagai identitas aplikasi.
    const pageTitle = String(document.title || '').trim();
    if (pageTitle) {
      const parts = pageTitle.split('|').map(x => x.trim()).filter(Boolean);
      const pagePart = parts.length > 1 ? parts.slice(1).join(' | ') : parts[0];
      if (pagePart && !/^keuangan$/i.test(pagePart)) document.title = `${namaLembaga} | ${pagePart}`;
      else document.title = namaLembaga;
    }
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

  function scheduleApply() {
    window.setTimeout(() => { applyAppText(); applyLogos(); }, 0);
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
    applyAppText();
    applyLogos();
    ensureJenisKeuangan();
    improveExcelDownload();
    ensureSmoothBottomNavigation();
    ensureDaftarNamaNavigation();
    if (location.pathname.endsWith('dashboard-excel.html')) setTimeout(improveExcelDownload, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  window.addEventListener('accountReady', scheduleApply);
  window.addEventListener('accountDataReady', scheduleApply);
  window.addEventListener('logoDashboardChanged', scheduleApply);
  window.addEventListener('settingsChanged', scheduleApply);
  window.addEventListener('pageshow', scheduleApply);
  window.addEventListener('focus', scheduleApply);

  const observer = new MutationObserver(mutations => {
    let logoAttributeChanged = false;
    let appTextChanged = false;
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) {
        logoAttributeChanged = true;
        continue;
      }
      if (mutation.type !== 'childList' || !mutation.addedNodes.length) continue;
      appTextChanged = true;
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        replaceTextNodes(node);
        updateVisibleAttributes();
        applyAppText(node);
        applyLogos(node);
      });
    }
    if (logoAttributeChanged || appTextChanged) scheduleApply();
  });

  const startObserver = () => {
    if (document.body) observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset', 'data-src']
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  else startObserver();
})();
// Bridge halaman Santri + loader fitur import banyak santri.
(() => {
  "use strict";

  function isSantriPage() {
    return !!(
      document.getElementById('ckBulkSantriAnchor') ||
      document.getElementById('formSantri') ||
      document.getElementById('daftarSantri') ||
      document.querySelector('[data-page="santri"]') ||
      /santri/i.test(document.title || '')
    );
  }

  function loadBulk() {
    if (!isSantriPage()) return;
    if (window.__ckBulkSantriLoading || window.__ckBulkSantriLoaded) return;
    window.__ckBulkSantriLoading = true;

    const script = document.createElement('script');
    script.src = 'js/santri-import.js?v=1.0.7';
    script.async = false;
    script.onload = () => {
      window.__ckBulkSantriLoaded = true;
      window.__ckBulkSantriLoading = false;
      console.log('Fitur Tambah Banyak Santri berhasil dimuat.');
    };
    script.onerror = () => {
      window.__ckBulkSantriLoading = false;
      console.error('Fitur Tambah Banyak Santri gagal dimuat:', script.src);
    };
    document.head.appendChild(script);
  }

  // Jangan mengubah theme manager yang sudah berjalan.
  if (!window.themeManager && !document.getElementById('catatanKasThemeBridge')) {
    const theme = document.createElement('script');
    theme.id = 'catatanKasThemeBridge';
    theme.src = 'theme.js';
    theme.async = false;
    document.head.appendChild(theme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBulk, { once: true });
  } else {
    loadBulk();
  }

  // WebView kadang menyelesaikan DOM setelah DOMContentLoaded.
  setTimeout(loadBulk, 500);
  setTimeout(loadBulk, 1500);
})();

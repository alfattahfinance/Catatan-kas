// KEUANGAN - importer peserta didik tambahan/kompatibilitas
// santri.js adalah importer utama karena menyimpan data langsung ke Firestore.
// File ini hanya menjadi fallback jika halaman lama belum memuat santri.js.
(() => {
  'use strict';

  if (window.__ckBulkSantriFeature) return;
  window.__ckBulkSantriFeature = true;

  // Jangan membuat importer kedua pada halaman yang sudah memakai santri.js.
  // santri.js menyediakan importer Firestore yang menjadi sumber data utama.
  function coreSantriReady() {
    return typeof window.simpanSantri === 'function' ||
           !!document.getElementById('importSantriCard');
  }

  function start() {
    if (coreSantriReady()) return;
    // Beri kesempatan santri.js menyelesaikan inisialisasi sebelum fallback aktif.
    setTimeout(() => {
      if (coreSantriReady()) return;
      // Halaman lama yang tidak memiliki santri.js tidak boleh gagal hanya karena
      // script kompatibilitas ini ada; fitur utama tetap berada di santri.js.
      console.info('KEUANGAN: importer santri utama belum terdeteksi; fallback tidak diaktifkan untuk mencegah data tersimpan di sumber berbeda.');
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

// Bridge halaman Santri + loader fitur import banyak santri.
(() => {
  "use strict";

  // Tetap aktifkan theme manager utama.
  if (!window.themeManager && !document.getElementById("catatanKasThemeBridge")) {
    const theme = document.createElement("script");
    theme.id = "catatanKasThemeBridge";
    theme.src = "../theme.js";
    theme.async = false;
    document.head.appendChild(theme);
  }

  // Loader khusus halaman Santri. Cache-busting memastikan APK mengambil file baru.
  function loadBulk() {
    if (!/santri\.html$/i.test(location.pathname)) return;
    if (window.__ckBulkSantriLoaded) return;
    window.__ckBulkSantriLoaded = true;

    const script = document.createElement("script");
    script.src = "js/santri-import.js?v=1.0.6";
    script.async = false;
    script.onload = () => console.log("Fitur Tambah Banyak Santri berhasil dimuat.");
    script.onerror = () => {
      window.__ckBulkSantriLoaded = false;
      console.error("Fitur tambah banyak santri gagal dimuat.");
    };
    document.head.appendChild(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadBulk, { once: true });
  } else {
    loadBulk();
  }
})();

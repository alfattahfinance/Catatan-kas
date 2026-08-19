// Bridge untuk halaman santri.html.
// santri.html memanggil js/theme.js, sedangkan theme manager utama berada di /theme.js.
(() => {
  if (window.themeManager) return;
  if (document.getElementById('catatanKasThemeBridge')) return;
  const script = document.createElement('script');
  script.id = 'catatanKasThemeBridge';
  script.src = '../theme.js';
  script.async = false;
  document.head.appendChild(script);
})();

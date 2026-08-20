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
    ['Data Santri', 'Data Peserta Didik']
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

  function run() {
    replaceTextNodes(document.body);
    updateAttributes();
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
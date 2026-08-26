/* Export Excel universal untuk dashboard-excel.html.
 * APK: AndroidWebUpdater.saveExcelBase64().
 * Browser: XLSX.writeFile().
 */
import { auth } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const $ = id => document.getElementById(id);
let xlsxLoading = null;

function status(msg, ok = true) {
    const e = $('excelStatus');
    if (!e) return;
    e.textContent = msg;
    e.style.color = ok ? '#198754' : '#dc3545';
    e.style.fontWeight = '700';
}

function syncDashboardIdentity() {
    const uid = String(window.currentFirebaseUid || window.currentFirebaseUser?.uid || '').trim();
    let s = {};
    try {
        s = JSON.parse(localStorage.getItem(uid ? `pengaturanAplikasi_${uid}` : 'pengaturanAplikasi') || '{}') || {};
    } catch (_) {}
    const nama = String(s.namaLembaga || s.namaPondok || s.namaSekolah || s.lembaga || '').trim();
    const sub = String(s.subJudul || s.subjudul || s.subTitle || '').trim();
    const logo = String(uid ? localStorage.getItem(`logoDashboard_${uid}`) : '') || String(s.logoDashboard || '');
    const nameEl = $('appName');
    const subEl = $('appSub');
    const logoEl = $('logo');
    if (nameEl && nama) nameEl.textContent = nama;
    if (subEl && sub) subEl.textContent = sub;
    if (logoEl && logo) {
        logoEl.removeAttribute('srcset');
        logoEl.removeAttribute('data-src');
        logoEl.src = logo;
    }
}

function ensureXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxLoading) return xlsxLoading;
    xlsxLoading = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
        s.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error('Library Excel tidak tersedia.'));
        s.onerror = () => reject(new Error('Library Excel gagal dimuat.'));
        document.head.appendChild(s);
    });
    return xlsxLoading;
}

function collectRows() {
    const rows = [];
    const body = document.querySelector('#body');
    if (!body) return rows;

    body.querySelectorAll('tr').forEach(tr => {
        const td = Array.from(tr.querySelectorAll('td'));
        if (!td.length) return;
        if (td.length === 1 && td[0].colSpan) return;
        if (td.length < 17) return;

        rows.push({
            Nama: td[0].textContent.trim(),
            Jan: td[1].textContent.trim(),
            Feb: td[2].textContent.trim(),
            Mar: td[3].textContent.trim(),
            Apr: td[4].textContent.trim(),
            Mei: td[5].textContent.trim(),
            Jun: td[6].textContent.trim(),
            Jul: td[7].textContent.trim(),
            Agu: td[8].textContent.trim(),
            Sep: td[9].textContent.trim(),
            Okt: td[10].textContent.trim(),
            Nov: td[11].textContent.trim(),
            Des: td[12].textContent.trim(),
            'Periode Wajib': td[13].textContent.trim(),
            'Jumlah Bulan': td[14].textContent.trim(),
            'Sudah Bayar Sampai': td[15].textContent.trim(),
            'Total Masuk': td[16].textContent.trim()
        });
    });
    return rows;
}

function buildWorkbook(XLSX, rows) {
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
        {wch:28}, ...Array(12).fill({wch:7}),
        {wch:25}, {wch:15}, {wch:22}, {wch:18}
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Pemasukan');
    return wb;
}

function saveAndroid(XLSX, wb, filename) {
    if (!window.AndroidWebUpdater || typeof window.AndroidWebUpdater.saveExcelBase64 !== 'function') {
        return false;
    }
    const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const saved = window.AndroidWebUpdater.saveExcelBase64(base64, filename);
    if (!saved) throw new Error('Excel berhasil dibuat tetapi gagal disimpan ke Download.');
    status('✓ Excel tersimpan di Download.');
    setTimeout(() => {
        try {
            if (typeof window.AndroidWebUpdater.openLastExcel === 'function') {
                window.AndroidWebUpdater.openLastExcel();
            }
        } catch (_) {}
    }, 350);
    return true;
}

async function exportExcel(event) {
    if (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    const btn = $('browserExportExcel') || $('webExportExcel');
    if (btn) btn.disabled = true;
    status('Menyiapkan Excel...');

    try {
        const XLSX = await ensureXLSX();
        const rows = collectRows();
        const year = Number($('tahun')?.value) || new Date().getFullYear();
        const filename = `Rekap-Pemasukan-${year}.xlsx`;

        if (!rows.length) {
            throw new Error('Data tabel belum siap. Silakan tunggu sampai daftar pembayaran tampil.');
        }

        const wb = buildWorkbook(XLSX, rows);

        if (saveAndroid(XLSX, wb, filename)) return;

        XLSX.writeFile(wb, filename);
        status(`✓ Excel berhasil diekspor (${rows.length} nama).`);
    } catch (e) {
        console.error('Export Excel:', e);
        status('Export Excel gagal: ' + (e?.message || 'kesalahan tidak diketahui.'), false);
    } finally {
        setTimeout(() => { if (btn) btn.disabled = false; }, 700);
    }
}

function connectButton() {
    const buttons = [$('browserExportExcel'), $('webExportExcel')].filter(Boolean);
    buttons.forEach(button => {
        if (button.dataset.excelBridgeConnected === '1') return;
        button.dataset.excelBridgeConnected = '1';
        button.innerHTML = '<i class="bi bi-file-earmark-excel me-1"></i>Export Excel';
        button.title = 'Export data ke file Excel';
        button.addEventListener('click', exportExcel, true);
    });
    return buttons.length > 0;
}

function init() {
    syncDashboardIdentity();
    connectButton();
    setTimeout(() => { syncDashboardIdentity(); connectButton(); }, 250);
    setTimeout(() => { syncDashboardIdentity(); connectButton(); }, 700);
    setTimeout(() => { syncDashboardIdentity(); connectButton(); }, 1500);
    setTimeout(() => { syncDashboardIdentity(); connectButton(); }, 3000);
    window.addEventListener('accountDataReady', () => { syncDashboardIdentity(); connectButton(); });
    window.addEventListener('settingsChanged', syncDashboardIdentity);
    window.addEventListener('logoDashboardChanged', syncDashboardIdentity);
    window.addEventListener('dataKeuanganBerubah', connectButton);
}

onAuthStateChanged(auth, () => init());
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}

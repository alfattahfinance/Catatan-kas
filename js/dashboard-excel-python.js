/* Bridge Export Excel untuk APK Updatable + Chaquopy.
   Menggunakan AndroidWebUpdater yang tersedia di UpdatableMainActivity.
*/
import { auth } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const $ = id => document.getElementById(id);

let initialized = false;
let xlsxLoading = null;

function status(msg, ok = true) {
    const e = $('excelStatus');

    if (!e) return;

    e.textContent = msg;
    e.style.color = ok ? '#198754' : '#dc3545';
    e.style.fontWeight = '700';
}

function collectRows() {
    const rows = [];

    document.querySelectorAll('#body tr').forEach(tr => {

        const td = tr.querySelectorAll('td');

        if (td.length < 16) return;

        const bulan = [];

        for (let i = 1; i <= 12; i++) {
            bulan.push(td[i].textContent.trim());
        }

        rows.push({
            Nama: td[0].textContent.trim(),
            Jan: bulan[0],
            Feb: bulan[1],
            Mar: bulan[2],
            Apr: bulan[3],
            Mei: bulan[4],
            Jun: bulan[5],
            Jul: bulan[6],
            Agu: bulan[7],
            Sep: bulan[8],
            Okt: bulan[9],
            Nov: bulan[10],
            Des: bulan[11],
            'Periode Wajib': td[13].textContent.trim(),
            'Sudah Bayar Sampai': td[14].textContent.trim(),
            'Total Masuk': td[15].textContent.trim()
        });
    });

    return rows;
}

function ensureXLSX() {

    if (window.XLSX) {
        return Promise.resolve();
    }

    if (xlsxLoading) {
        return xlsxLoading;
    }

    xlsxLoading = new Promise((resolve, reject) => {

        const script = document.createElement('script');

        script.src =
            'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';

        script.onload = () => {
            if (window.XLSX) {
                resolve();
            } else {
                reject(
                    new Error('Library Excel tidak tersedia.')
                );
            }
        };

        script.onerror = () => {
            reject(
                new Error('Library Excel gagal dimuat.')
            );
        };

        document.head.appendChild(script);
    });

    return xlsxLoading;
}

async function exportExcel() {

    try {

        /*
         * Pastikan bridge Android yang benar tersedia.
         */
        if (
            !window.AndroidWebUpdater ||
            typeof window.AndroidWebUpdater.saveExcelBase64 !== 'function'
        ) {
            status(
                'Fitur penyimpanan Excel Android belum tersedia.',
                false
            );
            return;
        }

        const rows = collectRows();

        if (!rows.length) {
            status(
                'Tidak ada data untuk diekspor.',
                false
            );
            return;
        }

        status('Membuat file Excel...');

        await ensureXLSX();

        const year =
            Number($('tahun')?.value) ||
            new Date().getFullYear();

        const filename =
            `Rekap-Pembayaran-${year}.xlsx`;

        /*
         * Buat workbook Excel dari tabel yang sedang tampil.
         */
        const workbook =
            XLSX.utils.book_new();

        const worksheet =
            XLSX.utils.json_to_sheet(rows);

        /*
         * Lebar kolom supaya hasil Excel lebih rapi.
         */
        worksheet['!cols'] = [
            { wch: 28 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 16 },
            { wch: 22 },
            { wch: 18 }
        ];

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            'Rekap Pembayaran'
        );

        /*
         * Ubah workbook menjadi Base64.
         */
        const base64 =
            XLSX.write(
                workbook,
                {
                    bookType: 'xlsx',
                    type: 'base64'
                }
            );

        /*
         * Kirim ke Android.
         *
         * UpdatableMainActivity.java sudah menyediakan:
         * AndroidWebUpdater.saveExcelBase64()
         */
        const saved =
            window.AndroidWebUpdater.saveExcelBase64(
                base64,
                filename
            );

        if (!saved) {
            status(
                'Excel berhasil dibuat tetapi gagal disimpan.',
                false
            );
            return;
        }

        status(
            '✓ Excel tersimpan di Download.',
            true
        );

        /*
         * Buka Excel setelah berhasil disimpan.
         */
        setTimeout(() => {

            try {

                if (
                    typeof window.AndroidWebUpdater.openLastExcel ===
                    'function'
                ) {
                    window.AndroidWebUpdater.openLastExcel();
                }

            } catch (e) {
                console.error(
                    'Gagal membuka Excel:',
                    e
                );
            }

        }, 350);

    } catch (e) {

        console.error(
            'Export Excel:',
            e
        );

        status(
            'Export Excel gagal: ' +
            (e?.message || e),
            false
        );
    }
}

function connectButton() {

    /*
     * Mendukung tombol yang sudah ada.
     */
    const buttons = [
        $('browserExportExcel'),
        $('webExportExcel')
    ].filter(Boolean);

    if (!buttons.length) {
        return false;
    }

    buttons.forEach(button => {

        if (
            button.dataset.excelBridgeConnected === '1'
        ) {
            return;
        }

        button.dataset.excelBridgeConnected = '1';

        button.innerHTML =
            '<i class="bi bi-file-earmark-excel me-1"></i>' +
            'Export Excel';

        button.title =
            'Export data ke file Excel';

        button.addEventListener(
            'click',
            event => {

                event.preventDefault();
                event.stopPropagation();

                exportExcel();

            },
            true
        );
    });

    return true;
}

function init() {

    if (initialized) {
        connectButton();
        return;
    }

    initialized = true;

    connectButton();

    /*
     * Beberapa halaman membuat tombol setelah data selesai dimuat.
     */
    setTimeout(connectButton, 250);
    setTimeout(connectButton, 700);
    setTimeout(connectButton, 1500);
    setTimeout(connectButton, 3000);

    window.addEventListener(
        'accountDataReady',
        connectButton
    );

    window.addEventListener(
        'dataKeuanganBerubah',
        connectButton
    );
}

onAuthStateChanged(auth, () => {
    init();
});

if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        init,
        { once: true }
    );

} else {

    init();
}

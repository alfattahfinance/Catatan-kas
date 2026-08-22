"""
Catatan Kas - Rekap Pembayaran Perorang
Dipakai oleh Dashboard Excel dan dapat dijalankan langsung di Android melalui Chaquopy.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any, Iterable
import base64
import io
import json

BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]


def _tanggal(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(value / 1000 if value > 10_000_000_000 else value)
        except (ValueError, OSError):
            return None
    if isinstance(value, str):
        s = value.strip().replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(s).replace(tzinfo=None)
        except ValueError:
            pass
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
            try:
                return datetime.strptime(s, fmt)
            except ValueError:
                pass
    if isinstance(value, dict):
        seconds = value.get("seconds", value.get("_seconds"))
        if seconds is not None:
            try:
                return datetime.fromtimestamp(float(seconds))
            except (ValueError, OSError):
                pass
    return None


def _ambil_nama(t: dict[str, Any]) -> str:
    for key in ("nama", "namaSantri", "santriNama", "name", "santri"):
        value = t.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return "Tanpa Nama"


def rekap_pembayaran(transaksi: Iterable[dict[str, Any]], tahun: int | None = None) -> list[dict[str, Any]]:
    data: dict[str, set[int]] = defaultdict(set)
    terakhir: dict[str, datetime] = {}
    total: dict[str, float] = defaultdict(float)
    for t in transaksi:
        if not isinstance(t, dict):
            continue
        dt = _tanggal(t.get("tanggal", t.get("date", t.get("createdAt", t.get("waktu")))))
        if dt is None or (tahun is not None and dt.year != tahun):
            continue
        nama = _ambil_nama(t)
        data[nama].add(dt.month)
        terakhir[nama] = max(terakhir.get(nama, dt), dt)
        try:
            total[nama] += float(t.get("jumlah", t.get("nominal", t.get("amount", 0))) or 0)
        except (TypeError, ValueError):
            pass

    hasil = []
    for nama in sorted(data, key=str.casefold):
        row = {"Santri": nama}
        for nomor, bulan in enumerate(BULAN, 1):
            row[bulan] = "✓" if nomor in data[nama] else "—"
        row["Total Pembayaran"] = total[nama]
        row["Terakhir Bayar"] = terakhir[nama].strftime("%d-%m-%Y")
        row["Bulan Terakhir"] = BULAN[terakhir[nama].month - 1]
        hasil.append(row)
    return hasil


def simpan_excel(rekap: list[dict[str, Any]], path: str) -> None:
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font
    wb = Workbook()
    ws = wb.active
    ws.title = "Rekap Pembayaran"
    if not rekap:
        ws.append(["Belum ada data pembayaran"])
    else:
        headers = list(rekap[0].keys())
        ws.append(headers)
        for row in rekap:
            ws.append([row.get(h, "") for h in headers])
        for cell in ws[1]:
            cell.font = Font(bold=True)
            cell.alignment = Alignment(horizontal="center")
        ws.freeze_panes = "B2"
        ws.auto_filter.ref = ws.dimensions
        for col in ws.columns:
            letter = col[0].column_letter
            ws.column_dimensions[letter].width = min(max(max(len(str(c.value or "")) for c in col) + 2, 10), 24)
    wb.save(path)


def export_excel_base64(payload_json: str) -> str:
    """Dipanggil Java/Android: menerima JSON transaksi + tahun, mengembalikan XLSX base64."""
    payload = json.loads(payload_json or "{}")
    transaksi = payload.get("transaksi", [])
    tahun = payload.get("tahun")
    tahun = int(tahun) if tahun not in (None, "") else None
    hasil = rekap_pembayaran(transaksi, tahun)
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font
    wb = Workbook()
    ws = wb.active
    ws.title = "Rekap Pembayaran"
    headers = ["Santri", *BULAN, "Jumlah Bulan", "Sudah Bayar Sampai", "Total Bayar"]
    ws.append(headers)
    for row in hasil:
        jumlah_bulan = sum(row.get(b) == "✓" for b in BULAN)
        ws.append([row.get("Santri", ""), *[row.get(b, "—") for b in BULAN], jumlah_bulan,
                   row.get("Bulan Terakhir", "Belum bayar"), row.get("Total Pembayaran", 0)])
    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")
    ws.freeze_panes = "B2"
    ws.auto_filter.ref = ws.dimensions
    for col in ws.columns:
        letter = col[0].column_letter
        ws.column_dimensions[letter].width = min(max(max(len(str(c.value or "")) for c in col) + 2, 10), 24)
    buf = io.BytesIO()
    wb.save(buf)
    return base64.b64encode(buf.getvalue()).decode("ascii")


if __name__ == "__main__":
    contoh = [
        {"namaSantri": "Ahmad", "tanggal": "2026-01-10", "jumlah": 100000},
        {"namaSantri": "Ahmad", "tanggal": "2026-02-10", "jumlah": 100000},
        {"namaSantri": "Ahmad", "tanggal": "2026-04-10", "jumlah": 100000},
    ]
    print(rekap_pembayaran(contoh, 2026))

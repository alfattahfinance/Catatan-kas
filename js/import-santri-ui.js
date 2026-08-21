import { db, auth } from "../firebase-config.js";
import { collection, getDocs, writeBatch, doc, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

(() => {
  const norm = v => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const header = v => norm(v).replace(/[\s_-]+/g, "");
  const $ = id => document.getElementById(id);

  function parseCsv(text) {
    const rows = []; let row = [], cell = "", quote = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i], n = text[i + 1];
      if (c === '"') { if (quote && n === '"') { cell += '"'; i++; } else quote = !quote; }
      else if (c === ',' && !quote) { row.push(cell); cell = ""; }
      else if ((c === '\n' || c === '\r') && !quote) { if (c === '\r' && n === '\n') i++; row.push(cell); cell = ""; if (row.some(x => String(x).trim())) rows.push(row); row = []; }
      else cell += c;
    }
    row.push(cell); if (row.some(x => String(x).trim())) rows.push(row); return rows;
  }

  async function readFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv') || name.endsWith('.txt')) return parseCsv(await file.text());
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) throw new Error('Gunakan file .xlsx, .xls, atau .csv.');
    if (!window.XLSX) await new Promise((resolve, reject) => { const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'; s.onload=resolve; s.onerror=()=>reject(new Error('Library Excel gagal dimuat. Pastikan internet aktif.')); document.head.appendChild(s); });
    const wb = XLSX.read(await file.arrayBuffer(), { type:'array' }); const ws=wb.Sheets[wb.SheetNames[0]]; return XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
  }

  function toItems(rows) {
    if (!rows.length) return [];
    const first=rows[0].map(header); const hasHeader=first.some(x=>['nama','namasantri','name','santri','kelas','class','wali','walisantri'].includes(x));
    const heads=hasHeader?first:['nama','kelas','wali']; const data=hasHeader?rows.slice(1):rows;
    const idx=(...aliases)=>aliases.map(header).map(x=>heads.indexOf(x)).find(i=>i>=0);
    const ni=idx('nama','namasantri','name','santri')??0, ki=idx('kelas','class')??1, wi=idx('wali','walisantri','orangtua')??2;
    return data.map(r=>({nama:String(r[ni]??'').trim(),kelas:String(r[ki]??'').trim()||'-',wali:String(r[wi]??'').trim()||'-'})).filter(x=>x.nama);
  }

  async function importNow() {
    const file=$('fileImportSantri'), status=$('importSantriStatus'), button=$('btnImportSantri');
    if (!auth.currentUser) return alert('Silakan login terlebih dahulu.');
    if (!file?.files?.[0]) return alert('Pilih file Excel atau CSV terlebih dahulu.');
    button.disabled=true; status.textContent='Membaca dan memeriksa data...';
    try {
      const incoming=toItems(await readFile(file.files[0])); if(!incoming.length) throw new Error('Tidak ditemukan nama santri dalam file.');
      const snap=await getDocs(query(collection(db,'santri'),where('uid','==',auth.currentUser.uid)));
      const seen=new Set(snap.docs.map(d=>norm(d.data()?.nama)).filter(Boolean)); const unique=[]; let skipped=0;
      for(const x of incoming){const k=norm(x.nama); if(seen.has(k)) skipped++; else {seen.add(k);unique.push(x);}}
      if(!unique.length){status.textContent=`Tidak ada nama baru. ${skipped} data dilewati.`;return;}
      for(let i=0;i<unique.length;i+=500){const batch=writeBatch(db);unique.slice(i,i+500).forEach(x=>batch.set(doc(collection(db,'santri')),{nama:x.nama,kelas:x.kelas,wali:x.wali,uid:auth.currentUser.uid,createdAt:serverTimestamp()}));await batch.commit();}
      status.textContent=`${unique.length} santri berhasil diimpor${skipped?` • ${skipped} dilewati`:''}.`; alert(`${unique.length} santri berhasil diimpor.${skipped?`\n${skipped} data dilewati karena sudah ada/duplikat.`:''}`); file.value='';
      window.dispatchEvent(new CustomEvent('daftarSantriBerubah'));
    } catch(e){console.error(e);status.textContent=e.message||'Import gagal.';alert('Import gagal.\n\n'+(e.message||e));}
    finally{button.disabled=false;}
  }

  function install(){
    if($('importSantriCard'))return;
    const table=$('tabelSantri'); const listCard=table?.closest('.custom-card'); if(!listCard?.parentElement)return;
    const card=document.createElement('div'); card.id='importSantriCard'; card.className='card custom-card mb-4';
    card.innerHTML=`<div class="card-body"><h5 class="fw-bold text-success mb-2"><i class="bi bi-file-earmark-spreadsheet me-2"></i>Import Banyak Santri</h5><p class="text-muted small mb-3">Masukkan banyak nama sekaligus dari Excel atau CSV.</p><input id="fileImportSantri" type="file" class="form-control mb-2" accept=".xlsx,.xls,.csv,text/csv"><div id="importSantriStatus" class="small text-muted mb-2">Belum ada file dipilih.</div><button id="btnImportSantri" type="button" class="btn btn-success w-100"><i class="bi bi-cloud-upload me-1"></i> Import & Simpan Banyak Santri</button><button id="btnTemplateSantri" type="button" class="btn btn-outline-secondary w-100 mt-2"><i class="bi bi-download me-1"></i> Download Template CSV</button></div>`;
    listCard.parentElement.insertBefore(card,listCard);
    $('fileImportSantri').addEventListener('change',async()=>{try{const items=toItems(await readFile($('fileImportSantri').files[0]));$('importSantriStatus').textContent=items.length?`Ditemukan ${items.length} nama santri.`:'Tidak ditemukan nama.';}catch(e){$('importSantriStatus').textContent=e.message;}});
    $('btnImportSantri').addEventListener('click',importNow);
    $('btnTemplateSantri').addEventListener('click',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeffNama,Kelas,Wali\nAhmad,1,Abdullah\nAli,1,Hasan\n'],{type:'text/csv;charset=utf-8'}));a.download='template-daftar-santri.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(install,50));
})();

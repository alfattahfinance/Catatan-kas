/* Bridge Export Excel untuk APK Python/Chaquopy. */
import { auth } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
const $=id=>document.getElementById(id);
let readyListener=false;
function status(msg,ok=true){const e=$('excelStatus');if(e){e.textContent=msg;e.style.color=ok?'#198754':'#dc3545';e.style.fontWeight='700'}}
function collectRows(){
  const rows=[];
  document.querySelectorAll('#body tr').forEach(tr=>{
    const td=tr.querySelectorAll('td');
    if(td.length<16)return;
    const bulan=[];for(let i=1;i<=12;i++)bulan.push(td[i].textContent.trim());
    rows.push({nama:td[0].textContent.trim(),bulan,jumlah_bulan:td[13].textContent.trim(),sudah_bayar_sampai:td[14].textContent.trim(),total_bayar:td[15].textContent.replace(/[^0-9-]/g,'')});
  });
  return rows;
}
function installResultListener(){
  if(readyListener)return;readyListener=true;
  window.addEventListener('pythonExcelReady',e=>{
    const d=e.detail||{};
    if(!d.base64){status('Excel gagal dibuat.',false);return}
    const filename=d.filename||'Rekap-Pembayaran.xlsx';
    if(window.AndroidWebUpdater&&typeof window.AndroidWebUpdater.saveExcelBase64==='function'){
      const saved=window.AndroidWebUpdater.saveExcelBase64(d.base64,filename);
      if(saved){status('✓ Excel tersimpan di Download.',true);setTimeout(()=>{if(typeof window.AndroidWebUpdater.openLastExcel==='function')window.AndroidWebUpdater.openLastExcel()},300)}
      else status('Excel berhasil dibuat tetapi gagal disimpan.',false);
    }else status('Penyimpanan Excel Android belum tersedia.',false);
  });
  window.addEventListener('pythonExcelError',e=>status('Export Excel gagal: '+((e.detail||{}).message||'Kesalahan Python'),false));
}
function exportPython(){
  installResultListener();
  if(!window.AndroidPython||typeof window.AndroidPython.exportExcel!=='function'){status('Export Excel belum tersedia di APK ini.',false);return}
  const rows=collectRows();
  if(!rows.length){status('Tidak ada data untuk diekspor.',false);return}
  try{
    const year=Number($('tahun')?.value)||new Date().getFullYear();
    const filename='Rekap-Pembayaran-'+year+'.xlsx';
    status('Membuat file Excel...');
    window.AndroidPython.exportExcel(JSON.stringify(rows),filename);
  }catch(e){console.error(e);status('Export Excel gagal: '+(e?.message||e),false)}
}
function connectButton(){
  const b=$('browserExportExcel');
  if(!b||!window.AndroidPython)return false;
  if(b.dataset.pythonConnected==='1')return true;
  b.dataset.pythonConnected='1';
  b.innerHTML='<i class="bi bi-file-earmark-excel me-1"></i>Export Excel';
  b.title='Export data ke file Excel';
  b.onclick=null;
  b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();exportPython()},true);
  const statusEl=$('excelStatus');if(statusEl)statusEl.textContent='';
  return true;
}
function init(){installResultListener();connectButton();setTimeout(connectButton,250);setTimeout(connectButton,1000);setTimeout(connectButton,2000);setTimeout(connectButton,4000)}
onAuthStateChanged(()=>init());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
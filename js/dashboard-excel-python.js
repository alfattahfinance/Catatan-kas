/* Bridge Export Excel untuk APK Python/Chaquopy. */
import { auth, db } from '../firebase-config.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
const $=id=>document.getElementById(id);
function status(msg,ok=true){const e=$('excelStatus');if(e){e.textContent=msg;e.style.color=ok?'#198754':'#dc3545';e.style.fontWeight='700'}}
async function exportPython(){
  if(!window.AndroidPython||typeof window.AndroidPython.exportExcel!=='function'){status('Python belum tersedia di APK ini.',false);return}
  const user=auth.currentUser;if(!user){status('Silakan login terlebih dahulu.',false);return}
  try{
    status('Membuat Excel dengan Python + openpyxl...');
    const snap=await getDocs(query(collection(db,'payments'),where('uid','==',user.uid)));
    const transaksi=snap.docs.map(d=>({id:d.id,...d.data()}));
    const payload=JSON.stringify({transaksi,tahun:Number($('tahun')?.value)||new Date().getFullYear()});
    const filename=window.AndroidPython.exportExcel(payload);
    if(!filename){status('Python gagal membuat file Excel.',false);return}
    status('✓ Excel tersimpan di Download: '+filename);
    setTimeout(()=>{
      if(typeof window.AndroidPython.openLastExcel==='function'){
        const opened=window.AndroidPython.openLastExcel();
        if(!opened)status('✓ Excel tersimpan di Download: '+filename);
      }
    },300);
  }catch(e){console.error(e);status('Gagal Export Excel: '+(e?.message||e),false)}
}
function connectButton(){
  const b=$('browserExportExcel');
  if(!b||!window.AndroidPython)return false;
  if(b.dataset.pythonConnected==='1')return true;
  b.dataset.pythonConnected='1';b.onclick=null;
  b.innerHTML='<i class="bi bi-file-earmark-excel me-1"></i>Export Excel <span style="font-size:.6rem;opacity:.9">(Python)</span>';
  b.title='Export Excel menggunakan Python + openpyxl';
  b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();exportPython()},true);
  status('✓ Python Excel siap (openpyxl)');
  return true;
}
function init(){connectButton();setTimeout(connectButton,250);setTimeout(connectButton,1000)}
onAuthStateChanged(()=>init());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();

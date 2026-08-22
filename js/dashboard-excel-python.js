/* Bridge Export Excel untuk APK Python/Chaquopy. Web/Updatable tetap memakai exporter JavaScript. */
import { auth, db } from '../firebase-config.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const $=id=>document.getElementById(id);
function status(msg,ok=true){const e=$('excelStatus');if(e){e.textContent=msg;e.style.color=ok?'#198754':'#dc3545';}}
async function exportPython(){
  if(!window.AndroidPython||typeof window.AndroidPython.exportExcel!=='function'){status('Python belum tersedia di APK ini.',false);return;}
  const user=auth.currentUser;if(!user){status('Silakan login terlebih dahulu.',false);return;}
  try{
    status('Membuat Excel dengan Python...');
    const snap=await getDocs(query(collection(db,'payments'),where('uid','==',user.uid)));
    const transaksi=snap.docs.map(d=>({id:d.id,...d.data()}));
    const payload=JSON.stringify({transaksi,tahun:Number($('tahun')?.value)||new Date().getFullYear()});
    const filename=window.AndroidPython.exportExcel(payload);
    if(filename){status('Excel berhasil dibuat oleh Python: '+filename);}
    else status('Python gagal membuat file Excel.',false);
  }catch(e){console.error(e);status('Gagal Export Excel: '+(e?.message||e),false);}
}
function connectButton(){
  const b=$('browserExportExcel');
  if(!b||!window.AndroidPython)return false;
  if(b.dataset.pythonConnected==='1')return true;
  b.dataset.pythonConnected='1';
  b.onclick=null;
  b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();exportPython();},true);
  const label=b.querySelector('i');
  b.title='Export Excel menggunakan Python';
  b.setAttribute('data-python-export','true');
  status('Python Excel siap');
  return true;
}
function init(){connectButton();setTimeout(connectButton,250);setTimeout(connectButton,1000);}
onAuthStateChanged(()=>init());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();

/* Bridge UI for the Python-powered Dashboard Excel. Loaded only by the Python APK build. */
import { db, auth } from '../firebase-config.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const $ = id => document.getElementById(id);
function amount(x){ return Number(x?.nominal ?? x?.jumlah ?? x?.nilai ?? x?.total ?? 0) || 0; }
function name(x){ return String(x?.namaSantri ?? x?.nama_santri ?? x?.nama ?? '').trim(); }
function kind(x){ return String(x?.jenis ?? x?.kategori ?? x?.jenisPembayaran ?? 'Lainnya').trim() || 'Lainnya'; }
function dateOf(x){
  const v=x?.tanggal ?? x?.date ?? x?.createdAt ?? x?.waktu;
  if(v?.toDate) return v.toDate();
  if(v instanceof Date) return v;
  if(typeof v==='number'){ const d=new Date(v); return Number.isNaN(d.getTime())?null:d; }
  if(typeof v==='string'){ const d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(v)?v+'T00:00:00':v); return Number.isNaN(d.getTime())?null:d; }
  return null;
}
function toast(msg){
  const old=$('pythonExcelToast'); if(old) old.remove();
  const el=document.createElement('div'); el.id='pythonExcelToast'; el.textContent=msg;
  el.style.cssText='position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:3000;background:#198754;color:#fff;padding:9px 14px;border-radius:10px;font-size:.72rem;font-weight:800;box-shadow:0 5px 18px rgba(0,0,0,.2)';
  document.body.appendChild(el); setTimeout(()=>el.remove(),2600);
}

function addButton(){
  if($('pythonExportExcel')) return;
  const section=document.querySelector('.cardx');
  if(!section) return;
  const btn=document.createElement('button'); btn.id='pythonExportExcel'; btn.type='button';
  btn.className='btn btn-success btn-sm mt-2';
  btn.innerHTML='<i class="bi bi-file-earmark-excel me-1"></i>Export Excel dengan Python';
  btn.addEventListener('click', exportExcel);
  section.appendChild(btn);
}

async function exportExcel(){
  if(!window.AndroidPython || typeof window.AndroidPython.exportExcel !== 'function'){
    toast('Fitur Python belum tersedia di APK ini.'); return;
  }
  const user=auth.currentUser;
  if(!user){ toast('Silakan login terlebih dahulu.'); return; }
  const year=Number($('tahun')?.value) || new Date().getFullYear();
  const type=$('jenis')?.value || 'Semua';
  toast('Menyiapkan Excel...');
  try{
    const snap=await getDocs(query(collection(db,'payments'),where('uid','==',user.uid)));
    const transaksi=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>{
      const d=dateOf(x);
      return d && d.getFullYear()===year && (type==='Semua' || kind(x).toLowerCase()===type.toLowerCase());
    });
    const payload=JSON.stringify({tahun:year,transaksi});
    const result=window.AndroidPython.exportExcel(payload);
    if(!result) throw new Error('Python tidak mengembalikan file');
    toast('Excel berhasil dibuat di folder Download.');
  }catch(err){ console.error(err); toast('Gagal membuat Excel: '+(err?.message||err)); }
}

onAuthStateChanged(()=>addButton());
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addButton); else addButton();

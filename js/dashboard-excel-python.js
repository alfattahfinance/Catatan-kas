/* Optional Python bridge for the APK. The Dashboard Excel page now has a shared Export Excel button which also works in the normal/updatable APK through SheetJS. */
import { auth } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

function addButton(){
  // dashboard-excel.html already contains the shared Export Excel button.
  // Do not create a second button in the Python APK build.
  const existing=document.getElementById('browserExportExcel');
  if(existing) return;
  if(document.getElementById('pythonExportExcel')) return;
  const section=document.querySelector('.cardx');
  if(!section) return;
  const btn=document.createElement('button'); btn.id='pythonExportExcel'; btn.type='button';
  btn.className='btn btn-success btn-sm mt-2';
  btn.innerHTML='<i class="bi bi-file-earmark-excel me-1"></i>Export Excel';
  btn.addEventListener('click',()=>{
    if(window.AndroidPython&&typeof window.AndroidPython.exportExcel==='function'){
      const year=Number(document.getElementById('tahun')?.value)||new Date().getFullYear();
      const type=document.getElementById('jenis')?.value||'Semua';
      const user=auth.currentUser;
      if(!user){alert('Silakan login terlebih dahulu.');return;}
      // The shared browser exporter is preferred; this fallback only exists for legacy pages.
      alert('Gunakan tombol Export Excel setelah halaman selesai memuat.');
    }
  });
  section.appendChild(btn);
}

onAuthStateChanged(()=>addButton());
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addButton); else addButton();

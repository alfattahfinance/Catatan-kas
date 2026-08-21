// Pengaturan aplikasi: satu sumber data per akun Firebase.
(function(){
  const SETTINGS='pengaturanAplikasi', LOGO='logoDashboard', DEFAULT={namaPondok:'',subJudul:'',mataUang:'Rupiah',tema:'light'};
  let authReady=false, activeUid='';
  const uid=()=>String(activeUid||window.currentFirebaseUid||window.currentFirebaseUser?.uid||'').trim();
  const key=k=>{const u=uid();return u?`${k}_${u}`:k};
  const readLocal=()=>{try{return {...DEFAULT,...JSON.parse(localStorage.getItem(key(SETTINGS))||'{}')}}catch(_){return {...DEFAULT}}};
  const writeLocal=d=>{try{localStorage.setItem(key(SETTINGS),JSON.stringify(d));return true}catch(_){return false}};
  const logo=()=>{try{return localStorage.getItem(key(LOGO))||'logo-catatan-kas.jpg'}catch(_){return 'logo-catatan-kas.jpg'}};
  const applyTheme=v=>{let dark=v==='dark';if(v==='system')dark=window.matchMedia?.('(prefers-color-scheme: dark)')?.matches===true;document.documentElement.classList.toggle('dark-mode',dark);document.body?.classList.toggle('dark-mode',dark);document.documentElement.setAttribute('data-theme',dark?'dark':'light');window.dispatchEvent(new CustomEvent('themeChanged',{detail:{theme:v,dark}}));};
  const fill=d=>{const n=document.getElementById('namaPondok'),s=document.getElementById('subJudul'),m=document.getElementById('mataUang'),t=document.getElementById('tema');if(n)n.value=d.namaPondok||'';if(s)s.value=d.subJudul||'';if(m)m.value=d.mataUang||'Rupiah';if(t)t.value=d.tema||'light';applyTheme(d.tema||'light');};
  const showLogo=()=>{const src=logo();document.querySelectorAll('#previewLogoDashboard,#logoPreviewV2,#logoPreview,#logoDashboard,.app-logo,.ck-logo,#dashboardLogo,#logo,#laporanLogo,[data-dashboard-logo]').forEach(e=>{if(e?.tagName==='IMG'){e.src=src;e.removeAttribute('srcset')}});window.dispatchEvent(new CustomEvent('logoDashboardChanged',{detail:{logo:src,uid:uid()}}));};
  function bindTheme(){document.getElementById('tema')?.addEventListener('change',e=>{const d=readLocal();d.tema=e.target.value;writeLocal(d);applyTheme(d.tema);});}
  async function initFirebase(){try{
    const [{db,auth},{doc,getDoc,setDoc},{onAuthStateChanged}]=await Promise.all([
      import('../firebase-config.js'),
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js')
    ]);
    const cloud=()=>doc(db,'users',uid());
    async function loadAccount(user){
      activeUid=user?.uid||''; window.currentFirebaseUid=activeUid; window.currentFirebaseUser=user||null;
      if(!user){authReady=true;return;}
      try{
        const snap=await getDoc(cloud());
        const p=snap.exists()&&snap.data()?.pengaturan&&typeof snap.data().pengaturan==='object'?snap.data().pengaturan:null;
        if(p){const d={...DEFAULT,...p};writeLocal(d);if(p.logoDashboard)try{localStorage.setItem(key(LOGO),p.logoDashboard)}catch(_){};fill(d);showLogo();}
        else fill(readLocal());
      }catch(e){console.warn('Gagal membaca pengaturan akun:',e);fill(readLocal());}
      authReady=true;window.dispatchEvent(new CustomEvent('accountSettingsReady',{detail:{uid:uid()}}));
    }
    async function save(){
      if(!authReady||!uid())return alert('Akun belum siap. Tunggu sampai proses login selesai.');
      const data={namaPondok:document.getElementById('namaPondok')?.value.trim()||'',subJudul:document.getElementById('subJudul')?.value.trim()||'',mataUang:document.getElementById('mataUang')?.value||'Rupiah',tema:document.getElementById('tema')?.value||'light'};
      if(!data.namaPondok)return alert('Nama lembaga belum diisi.');
      const btn=document.getElementById('simpanPengaturanButton'),status=document.getElementById('statusPengaturan');if(btn)btn.disabled=true;
      try{
        writeLocal(data);applyTheme(data.tema);
        await setDoc(cloud(),{pengaturan:{...data,logoDashboard:logo()},updatedAt:new Date().toISOString()},{merge:true});
        fill(data);showLogo();if(status)status.textContent='✅ Pengaturan berhasil disimpan.';alert('✅ Pengaturan berhasil disimpan.');
      }catch(e){if(status)status.textContent='❌ Gagal menyimpan ke server: '+(e.message||e);alert('❌ Pengaturan belum tersimpan ke server.\n\n'+(e.message||e));}
      finally{if(btn)btn.disabled=false;}
    }
    window.CatatanKasSettings={get:readLocal,getLogo:logo,applyTheme,applyLogo:showLogo,getUid:uid};
    const start=()=>{fill(readLocal());showLogo();bindTheme();document.getElementById('simpanPengaturanButton')?.addEventListener('click',e=>{e.preventDefault();save()});};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
    onAuthStateChanged(auth,loadAccount);
  }catch(e){console.error('Modul Pengaturan gagal:',e);}}
  initFirebase();
})();
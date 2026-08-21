// Pengaturan aplikasi: satu sumber data per akun Firebase.
(function(){
  const SETTINGS='pengaturanAplikasi', LOGO='logoDashboard', DEFAULT={namaPondok:'',subJudul:'',mataUang:'Rupiah',tema:'light'};
  let authReady=false, activeUid='', saveInProgress=false;
  const uid=()=>String(activeUid||window.currentFirebaseUid||window.currentFirebaseUser?.uid||'').trim();
  const key=k=>{const u=uid();return u?`${k}_${u}`:k};
  const readLocal=()=>{try{return {...DEFAULT,...JSON.parse(localStorage.getItem(key(SETTINGS))||'{}')}}catch(_){return {...DEFAULT}}};
  const writeLocal=d=>{try{localStorage.setItem(key(SETTINGS),JSON.stringify({...DEFAULT,...d}));return true}catch(_){return false}};
  const logo=()=>{try{return localStorage.getItem(key(LOGO))||'logo-catatan-kas.jpg'}catch(_){return 'logo-catatan-kas.jpg'}};
  const writeLogo=v=>{try{localStorage.setItem(key(LOGO),v);return true}catch(_){return false}};
  const applyTheme=v=>{let dark=v==='dark';if(v==='system')dark=window.matchMedia?.('(prefers-color-scheme: dark)')?.matches===true;document.documentElement.classList.toggle('dark-mode',dark);document.body?.classList.toggle('dark-mode',dark);document.documentElement.setAttribute('data-theme',dark?'dark':'light');window.dispatchEvent(new CustomEvent('themeChanged',{detail:{theme:v,dark}}));};
  const fill=d=>{const n=document.getElementById('namaPondok'),s=document.getElementById('subJudul'),m=document.getElementById('mataUang'),t=document.getElementById('tema');if(n)n.value=d.namaPondok||'';if(s)s.value=d.subJudul||'';if(m)m.value=d.mataUang||'Rupiah';if(t)t.value=d.tema||'light';applyTheme(d.tema||'light');};
  const showLogo=()=>{const src=logo();document.querySelectorAll('#previewLogoDashboard,#logoPreviewV2,#logoPreview,#logoDashboard,.app-logo,.ck-logo,#dashboardLogo,#logo,#laporanLogo,[data-dashboard-logo]').forEach(e=>{if(e?.tagName==='IMG'){e.src=src;e.removeAttribute('srcset')}});window.dispatchEvent(new CustomEvent('logoDashboardChanged',{detail:{logo:src,uid:uid()}}));};
  function bindTheme(){document.getElementById('tema')?.addEventListener('change',e=>{const d=readLocal();d.tema=e.target.value;writeLocal(d);applyTheme(d.tema);});}
  function bindLogo(){const input=document.getElementById('logoDashboardInput');input?.addEventListener('change',()=>{const file=input.files?.[0];if(!file)return;if(!file.type.startsWith('image/'))return alert('Pilih file gambar.');if(file.size>2*1024*1024)return alert('Ukuran logo maksimal 2 MB.');const r=new FileReader();r.onload=()=>{writeLogo(String(r.result));showLogo()};r.readAsDataURL(file)});document.getElementById('resetLogoButton')?.addEventListener('click',()=>{if(!confirm('Gunakan kembali logo bawaan?'))return;try{localStorage.removeItem(key(LOGO))}catch(_){}showLogo()});}
  async function initFirebase(){try{
    const [{db,auth},{doc,getDoc,setDoc},{onAuthStateChanged}]=await Promise.all([
      import('../firebase-config.js'),import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js'),import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js')
    ]);
    const cloud=()=>doc(db,'users',uid());
    async function loadAccount(user){
      activeUid=user?.uid||'';window.currentFirebaseUid=activeUid;window.currentFirebaseUser=user||null;
      authReady=false;
      if(!user){fill({...DEFAULT});authReady=true;return;}
      try{const snap=await getDoc(cloud());const p=snap.exists()&&snap.data()?.pengaturan&&typeof snap.data().pengaturan==='object'?snap.data().pengaturan:null;if(p){const d={...DEFAULT,...p};writeLocal(d);if(p.logoDashboard)writeLogo(p.logoDashboard);fill(d);showLogo()}else{fill(readLocal());showLogo()}}catch(e){console.warn('Gagal membaca pengaturan akun:',e);fill(readLocal());showLogo()}
      authReady=true;window.dispatchEvent(new CustomEvent('accountSettingsReady',{detail:{uid:uid()}}));
    }
    async function save(){
      if(saveInProgress)return;if(!authReady||!uid())return alert('Akun belum siap. Tunggu sampai login selesai lalu coba lagi.');
      const data={namaPondok:document.getElementById('namaPondok')?.value.trim()||'',subJudul:document.getElementById('subJudul')?.value.trim()||'',mataUang:document.getElementById('mataUang')?.value||'Rupiah',tema:document.getElementById('tema')?.value||'light'};
      if(!data.namaPondok)return alert('Nama lembaga belum diisi.');
      const btn=document.getElementById('simpanPengaturanButton'),spin=document.getElementById('loadingSpinner'),txt=document.getElementById('btnText'),status=document.getElementById('statusPengaturan');saveInProgress=true;if(btn)btn.disabled=true;if(spin)spin.classList.remove('d-none');if(txt)txt.textContent=' Menyimpan...';
      try{writeLocal(data);applyTheme(data.tema);const logoValue=logo();await setDoc(cloud(),{pengaturan:{...data,logoDashboard:logoValue},updatedAt:new Date().toISOString()},{merge:true});fill(data);showLogo();if(status)status.textContent='✅ Pengaturan berhasil disimpan.';if(txt)txt.innerHTML='<i class="bi bi-save"></i> Simpan Pengaturan';alert('✅ Pengaturan berhasil disimpan.')}catch(e){if(status)status.textContent='❌ Gagal menyimpan: '+(e.message||e);alert('❌ Pengaturan gagal disimpan ke server.\n\n'+(e.message||e))}finally{saveInProgress=false;if(btn)btn.disabled=false;if(spin)spin.classList.add('d-none');if(txt)txt.innerHTML='<i class="bi bi-save"></i> Simpan Pengaturan'}}
    async function resetSettings(){if(!authReady||!uid())return alert('Akun belum siap.');if(!confirm('Kembalikan pengaturan akun ini ke pengaturan awal?'))return;const fresh={...DEFAULT};writeLocal(fresh);try{await setDoc(cloud(),{pengaturan:{...fresh,logoDashboard:'logo-catatan-kas.jpg'},updatedAt:new Date().toISOString()},{merge:true});writeLogo('logo-catatan-kas.jpg');fill(fresh);showLogo();document.getElementById('statusPengaturan').textContent='✅ Pengaturan awal berhasil dipulihkan.'}catch(e){alert('Gagal mengembalikan pengaturan: '+(e.message||e))}}
    window.CatatanKasSettings={get:readLocal,getLogo:logo,applyTheme,applyLogo:showLogo,getUid:uid};
    const start=()=>{fill(readLocal());showLogo();bindTheme();bindLogo();document.getElementById('simpanPengaturanButton')?.addEventListener('click',e=>{e.preventDefault();save()});document.getElementById('resetPengaturanButton')?.addEventListener('click',e=>{e.preventDefault();resetSettings()})};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();onAuthStateChanged(auth,loadAccount);
  }catch(e){console.error('Modul Pengaturan gagal:',e)}}
  initFirebase();
})();
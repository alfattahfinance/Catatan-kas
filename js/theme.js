// KEUANGAN - UI umum + sinkronisasi peserta didik per akun
(()=>{
  'use strict';

  const norm=v=>String(v??'').trim().replace(/\s+/g,' ');
  const key=v=>norm(v).toLocaleLowerCase('id-ID');
  const $=id=>document.getElementById(id);
  const isStudentPage=()=>/data santri|data siswa|peserta didik|santri/i.test(document.title||'')||!!$('namaSantri')||!!$('tbodySantri');
  const accountKey=uid=>uid?`daftarSantri_${uid}`:'daftarSantri';
  let firebasePromise=null, syncBusy=false, cloudUser=null;

  function firebase(){
    if(firebasePromise)return firebasePromise;
    firebasePromise=Promise.all([
      import('../firebase-config.js'),
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js')
    ]).then(([cfg,fs,fa])=>({db:cfg.db,auth:cfg.auth,...fs,...fa}));
    return firebasePromise;
  }

  function localStudents(uid){
    try{
      const d=JSON.parse(localStorage.getItem(accountKey(uid))||'[]');
      return Array.isArray(d)?d:[];
    }catch(_){return[]}
  }
  function saveLocal(uid,data){
    localStorage.setItem(accountKey(uid),JSON.stringify(data));
    // santri.html versi lama membaca key ini; isinya selalu disalin dari akun aktif.
    localStorage.setItem('daftarSantri',JSON.stringify(data));
  }
  function readGlobal(){
    try{const d=JSON.parse(localStorage.getItem('daftarSantri')||'[]');return Array.isArray(d)?d:[]}catch(_){return[]}
  }

  function generalizeLabels(){
    const map=[['Pembayaran Santri','Pembayaran'],['Data Santri','Data Peserta Didik'],['Daftar Santri','Daftar Peserta Didik'],['Tambah Santri Baru','Tambah Peserta Didik'],['Tambah Santri','Tambah Peserta Didik'],['Kelola data santri pondok','Kelola data peserta didik'],['Nama Santri','Nama Siswa / Peserta Didik'],['Nama santri / keterangan','Nama siswa / peserta didik / keterangan']];
    document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,small,label,button,a,span,th').forEach(el=>{
      if(el.dataset.ckGeneralized==='1')return;
      let t=el.textContent;map.forEach(([a,b])=>{t=t.replaceAll(a,b)});
      if(t!==el.textContent){el.textContent=t;el.dataset.ckGeneralized='1'}
    });
  }

  function parseCSV(text){
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){
      const c=text[i],n=text[i+1];
      if(c==='"'&&quoted&&n==='"'){cell+='"';i++;continue}
      if(c==='"'){quoted=!quoted;continue}
      if(c===','&&!quoted){row.push(cell);cell='';continue}
      if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(cell);cell='';if(row.some(v=>norm(v)))rows.push(row);row=[];continue}
      cell+=c;
    }
    row.push(cell);if(row.some(v=>norm(v)))rows.push(row);return rows;
  }
  const header=v=>key(v).replace(/[._()\-]/g,'').replace(/\s+/g,'');
  function rowsToStudents(rows){
    if(!rows.length)return[];
    const h=rows[0].map(header);
    const ni=h.findIndex(x=>['nama','namasantri','namasiswa','pesertadidik','name','santri','siswa'].includes(x));
    const ki=h.findIndex(x=>['kelas','kelassantri','kelassiswa','class'].includes(x));
    const wi=h.findIndex(x=>['hp','nohp','nomorhp','nowali','wali','walisantri','orangtua'].includes(x));
    const start=ni>=0||ki>=0||wi>=0?1:0;
    return rows.slice(start).map(r=>({nama:norm(r[ni>=0?ni:0]),kelas:norm(r[ki>=0?ki:1])||'-',hp:norm(r[wi>=0?wi:2])||'',wali:norm(r[wi>=0?wi:2])||'-'})).filter(x=>x.nama);
  }
  let excelPromise;
  function loadExcel(){
    if(window.XLSX)return Promise.resolve(window.XLSX);
    if(excelPromise)return excelPromise;
    excelPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=()=>window.XLSX?resolve(window.XLSX):reject(new Error('Pembaca Excel tidak tersedia.'));s.onerror=()=>reject(new Error('Gagal memuat pembaca Excel. Pastikan internet aktif.'));document.head.appendChild(s)});
    return excelPromise;
  }
  async function readImportFile(file){
    const n=String(file?.name||'').toLowerCase();
    if(n.endsWith('.csv')||n.endsWith('.txt'))return rowsToStudents(parseCSV(await file.text()));
    if(n.endsWith('.xlsx')||n.endsWith('.xls')){const X=await loadExcel(),w=X.read(await file.arrayBuffer(),{type:'array'}),s=w.Sheets[w.SheetNames[0]];return s?rowsToStudents(X.utils.sheet_to_json(s,{header:1,defval:''})):[]}
    throw new Error('Gunakan file Excel (.xlsx/.xls) atau CSV.');
  }

  function renderFromLocal(){
    try{window.tampilkanSantri?.()}catch(e){console.warn('Render santri:',e)}
  }

  async function loadCloud(user){
    if(!isStudentPage()||!user)return;
    const f=await firebase();
    const q=f.query(f.collection(f.db,'santri'),f.where('uid','==',user.uid));
    const snap=await f.getDocs(q);
    const data=snap.docs.map(d=>({id:d.id,firestoreId:d.id,...d.data()})).sort((a,b)=>key(a.nama).localeCompare(key(b.nama),'id'));
    syncBusy=true;saveLocal(user.uid,data);syncBusy=false;renderFromLocal();
  }

  async function pushLocalToCloud(user){
    if(!isStudentPage()||!user||syncBusy)return;
    const local=readGlobal();
    if(!Array.isArray(local))return;
    const f=await firebase();
    const q=f.query(f.collection(f.db,'santri'),f.where('uid','==',user.uid));
    const snap=await f.getDocs(q);
    const byId=new Map(snap.docs.map(d=>[d.id,d]));
    const byName=new Map(snap.docs.map(d=>[key(d.data()?.nama),d]));
    const batch=f.writeBatch(f.db);let changed=false;
    for(const x of local){
      if(!x?.nama)continue;
      const existing=(x.firestoreId&&byId.get(x.firestoreId))||byName.get(key(x.nama));
      const payload={nama:norm(x.nama),kelas:norm(x.kelas)||'-',wali:norm(x.wali)||'-',hp:norm(x.hp)||'',uid:user.uid,updatedAt:f.serverTimestamp()};
      if(existing)batch.set(existing.ref,payload,{merge:true});
      else {const ref=f.doc(f.collection(f.db,'santri'));batch.set(ref,{...payload,createdAt:f.serverTimestamp()})}
      changed=true;
    }
    if(changed)await batch.commit();
    await loadCloud(user);
  }

  async function importToFirestore(items){
    if(!cloudUser)throw new Error('Silakan login terlebih dahulu.');
    const f=await firebase();
    const q=f.query(f.collection(f.db,'santri'),f.where('uid','==',cloudUser.uid));
    const snap=await f.getDocs(q);
    const seen=new Set(snap.docs.map(d=>key(d.data()?.nama)).filter(Boolean));
    const unique=[];let skipped=0;
    for(const x of items){const k=key(x.nama);if(!k||seen.has(k)){skipped++;continue}seen.add(k);unique.push(x)}
    for(let i=0;i<unique.length;i+=450){
      const batch=f.writeBatch(f.db);
      unique.slice(i,i+450).forEach(x=>{const ref=f.doc(f.collection(f.db,'santri'));batch.set(ref,{nama:x.nama,kelas:x.kelas||'-',wali:x.wali||'-',hp:x.hp||'',uid:cloudUser.uid,createdAt:f.serverTimestamp()})});
      await batch.commit();
    }
    await loadCloud(cloudUser);
    return {added:unique.length,skipped};
  }

  function addBulkCard(){
    if(!isStudentPage()||$('importSantriCard'))return true;
    const normal=$('btnSimpanSantri')?.closest('.custom-card')||$('namaSantri')?.closest('.custom-card')||$('nama')?.closest('.custom-card');
    if(!normal?.parentElement)return false;
    const card=document.createElement('div');card.id='importSantriCard';card.className='card custom-card mb-4';
    card.innerHTML='<div class="card-body"><h5 class="fw-bold mb-2 text-success"><i class="bi bi-people-fill me-2"></i>Tambah Banyak Peserta Didik</h5><p class="text-muted small mb-3">Import dari Excel atau CSV.</p><input id="ckBulkSantriFile" class="form-control mb-2" type="file" accept=".xlsx,.xls,.csv,text/csv"><div id="ckBulkSantriInfo" class="small text-muted mb-2">Belum ada file dipilih.</div><button id="ckBulkSantriImport" type="button" class="btn btn-success w-100 fw-bold" disabled>Simpan Semua</button></div>';
    normal.parentElement.insertBefore(card,normal.nextSibling);
    const input=$('ckBulkSantriFile'),info=$('ckBulkSantriInfo'),button=$('ckBulkSantriImport');let pending=[];
    input.addEventListener('change',async()=>{pending=[];button.disabled=true;const file=input.files?.[0];if(!file)return;info.textContent='Membaca file...';try{pending=await readImportFile(file);info.textContent=pending.length?`Ditemukan ${pending.length} peserta didik.`:'Tidak ditemukan nama.';button.disabled=!pending.length}catch(e){info.textContent=e.message;info.className='small text-danger mb-2'}});
    button.addEventListener('click',async()=>{button.disabled=true;info.textContent='Menyimpan ke akun Anda...';try{const r=await importToFirestore(pending);info.textContent=`${r.added} peserta didik berhasil disimpan${r.skipped?` • ${r.skipped} dilewati`:''}.`;alert(`✅ ${r.added} peserta didik berhasil ditambahkan.${r.skipped?`\n${r.skipped} data dilewati karena sudah ada/duplikat.`:''}`);input.value='';pending=[];window.dispatchEvent(new CustomEvent('daftarSantriBerubah',{detail:{source:'cloud-import'}}))}catch(e){console.error(e);info.textContent=e.message||'Import gagal.';alert('Import gagal.\n\n'+(e.message||e))}finally{button.disabled=!pending.length}});
    return true;
  }

  async function startStudentSync(){
    if(!isStudentPage())return;
    try{
      const f=await firebase();
      f.onAuthStateChanged(f.auth,async user=>{
        cloudUser=user||null;
        if(!user)return;
        try{await loadCloud(user)}catch(e){console.error('Sinkronisasi santri:',e);const cached=localStudents(user.uid);if(cached.length){saveLocal(user.uid,cached);renderFromLocal()}}
      });
    }catch(e){console.error('Firebase santri:',e)}
  }

  window.addEventListener('daftarSantriBerubah',async e=>{
    generalizeLabels();
    if(syncBusy||e?.detail?.source==='cloud-import')return;
    if(cloudUser){try{await pushLocalToCloud(cloudUser)}catch(err){console.error('Sinkronisasi perubahan santri:',err)}}
  });

  async function start(){
    generalizeLabels();
    if(isStudentPage()){
      if(!addBulkCard())setTimeout(start,300);
      startStudentSync();
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  setTimeout(start,700);setTimeout(start,1600);
})();

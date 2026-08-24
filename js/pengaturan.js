import { db, auth } from "./firebase-config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const $=id=>document.getElementById(id);
let uid = '';

// Load Pengaturan dari Firestore / LocalStorage
async function loadSettings(userUid) {
  uid = userUid;
  const storageKey = `pengaturanAplikasi_${uid}`;
  let data = {};

  try {
    const docRef = doc(db, "settings", uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      data = snap.data();
    } else {
      data = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('pengaturanAplikasi') || '{}');
    }
  } catch (e) {
    data = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('pengaturanAplikasi') || '{}');
  }

  // Isi form input jika elemen tersedia
  if ($('namaLembaga')) $('namaLembaga').value = data.namaPondok || data.namaLembaga || '';
  if ($('subJudul')) $('subJudul').value = data.subJudul || data.subjudul || '';
  if ($('temaAplikasi')) $('temaAplikasi').value = data.tema || 'light';
  
  const savedLogo = localStorage.getItem(`logoDashboard_${uid}`) || data.logoDashboard;
  if (savedLogo && $('logoPreview')) $('logoPreview').src = savedLogo;

  // Simpan ke localStorage untuk dibaca oleh dashboard-excel.html
  localStorage.setItem(storageKey, JSON.stringify(data));
  window.dispatchEvent(new Event("settingsChanged"));
}

// Simpan Pengaturan ke Firestore & LocalStorage
async function saveSettings() {
  if (!uid) return;

  const storageKey = `pengaturanAplikasi_${uid}`;
  const currentData = JSON.parse(localStorage.getItem(storageKey) || '{}');

  const newSettings = {
    ...currentData,
    namaPondok: $('namaLembaga')?.value?.trim() || '',
    subJudul: $('subJudul')?.value?.trim() || '',
    tema: $('temaAplikasi')?.value || 'light',
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(newSettings));
    await setDoc(doc(db, "settings", uid), newSettings, { merge: true });
    window.dispatchEvent(new Event("settingsChanged"));
  } catch (err) {
    console.error("Gagal menyimpan pengaturan:", err);
  }
}

// Upload & Convert Logo ke Base64
function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (evt) {
    const base64Img = evt.target.result;
    if ($('logoPreview')) $('logoPreview').src = base64Img;
    
    if (uid) {
      localStorage.setItem(`logoDashboard_${uid}`, base64Img);
      try {
        await setDoc(doc(db, "settings", uid), { logoDashboard: base64Img }, { merge: true });
      } catch (err) {
        console.error("Gagal menyimpan logo:", err);
      }
    }
  };
  reader.readAsDataURL(file);
}

// Event Listeners Input
['namaLembaga', 'subJudul', 'temaAplikasi'].forEach(id => {
  $(id)?.addEventListener('change', saveSettings);
  $(id)?.addEventListener('input', saveSettings);
});

$('inputLogo')?.addEventListener('change', handleLogoUpload);

// Logout Handler
$('btnKeluar')?.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});

// Auth Observer
onAuthStateChanged(auth, u => {
  if (u) {
    if ($('userEmail')) $('userEmail').textContent = u.email;
    loadSettings(u.uid);
  } else {
    window.location.href = "login.html";
  }
});

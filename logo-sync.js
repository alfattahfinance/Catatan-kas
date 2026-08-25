(function(){"use strict";
const DEFAULT_LOGO="Photoroom_20260812_224807.png?v=20260825";
function applyLogo(){
  const logo=DEFAULT_LOGO;
  document.querySelectorAll(".app-logo,.ck-logo,.logo,.logo-preview,#logo,#logoDashboard,#dashboardLogo,#laporanLogo,#logoPreview,#logoPreviewV2,#previewLogoDashboard,img[alt='Logo Dashboard'],img[alt='Logo aplikasi'],img[alt='Photoroom_20260812_224807'],[data-dashboard-logo]").forEach(img=>{
    if(!img||img.tagName!=="IMG")return;
    if(img.dataset.logoSyncApplied===logo)return;
    img.dataset.logoSyncApplied=logo;
    img.removeAttribute("srcset");
    img.removeAttribute("data-src");
    img.onerror=null;
    img.src=logo;
  });
}
function start(){
  applyLogo();
  if(window.MutationObserver&&document.body){
    const observer=new MutationObserver(applyLogo);
    observer.observe(document.body,{childList:true,subtree:true});
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();

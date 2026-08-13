// ======================================
// PENGATURAN APLIKASI - JS
// ======================================

document.addEventListener("DOMContentLoaded", function () {
    const formPengaturan = document.getElementById("formPengaturan"); // Sesuaikan dengan id form di HTML Anda
    const inputLogo = document.getElementById("inputLogo");
    const selectTema = document.getElementById("temaAplikasi");
    const inputNamaPondok = document.getElementById("namaPondok");

    // 1. Muat data pengaturan saat halaman dibuka
    const pengaturan = JSON.parse(localStorage.getItem("pengaturanAplikasi")) || {};
    if (inputNamaPondok && pengaturan.namaPondok) {
        inputNamaPondok.value = pengaturan.namaPondok;
    }
    if (selectTema && pengaturan.tema) {
        selectTema.value = pengaturan.tema;
    }

    // Tampilkan preview logo yang tersimpan jika ada
    const savedLogo = localStorage.getItem("logoDashboard");
    const logoPreview = document.getElementById("logoPreview");
    if (savedLogo && logoPreview) {
        logoPreview.src = savedLogo;
    }

    // 2. Event saat form disubmit atau tombol simpan diklik
    window.simpanPengaturanAplikasi = function () {
        const namaPondokBaru = inputNamaPondok ? inputNamaPondok.value.trim() : "";
        const temaBaru = selectTema ? selectTema.value : "light";

        let pengaturanTerkini = JSON.parse(localStorage.getItem("pengaturanAplikasi")) || {};
        pengaturanTerkini.namaPondok = namaPondokBaru;
        pengaturanTerkini.tema = temaBaru;

        // Cek apakah user mengunggah logo baru
        if (inputLogo && inputLogo.files && inputLogo.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const base64Logo = e.target.result;
                // Simpan logo ke localStorage terpisah agar mudah dipanggil di semua halaman
                localStorage.setItem("logoDashboard", base64Logo);
                
                // Simpan pengaturan teks & tema
                localStorage.setItem("pengaturanAplikasi", JSON.stringify(pengaturanTerkini));

                alert("Pengaturan dan logo berhasil disimpan!");
                location.reload();
            };
            reader.readAsDataURL(inputLogo.files[0]);
        } else {
            // Jika tidak ganti logo, simpan teks & tema saja
            localStorage.setItem("pengaturanAplikasi", JSON.stringify(pengaturanTerkini));

            alert("Pengaturan berhasil disimpan!");
            location.reload();
        }
    };
});

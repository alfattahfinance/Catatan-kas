/* =====================================================
   CATATAN KAS
   SISTEM UPDATE APK
   ===================================================== */

(function () {

    "use strict";


    /* =================================================
       KONFIGURASI
    ================================================= */

    const VERSION_URL =
        "https://raw.githubusercontent.com/alfattahfinance/Catatan-kas/main/version.json";

    const RELEASE_BASE_URL =
        "https://github.com/alfattahfinance/Catatan-kas/releases/download/";

    const APK_NAME_PREFIX =
        "Keuangan-v";

    const APK_NAME_SUFFIX =
        ".apk";


    /* =================================================
       VERSI APLIKASI
    ================================================= */

    const CURRENT_VERSION =
        window.APP_VERSION || "2.0";


    /* =================================================
       BERSIHKAN VERSI
    ================================================= */

    function cleanVersion(version) {

        return String(version || "")
            .trim()
            .replace(/^v/i, "");

    }


    /* =================================================
       VERSI KE ANGKA
    ================================================= */

    function versionToNumber(version) {

        const clean =
            cleanVersion(version);

        if (!clean) {
            return 0;
        }

        return clean
            .split(".")
            .map(function (number) {

                return parseInt(number, 10) || 0;

            })
            .reduce(function (
                total,
                number
            ) {

                return total * 1000 + number;

            }, 0);

    }


    /* =================================================
       URL APK
    ================================================= */

    function getApkDownloadUrl(version) {

        const clean =
            cleanVersion(version);

        if (!clean) {
            return null;
        }

        return (
            RELEASE_BASE_URL +
            "v" +
            encodeURIComponent(clean) +
            "/" +
            APK_NAME_PREFIX +
            encodeURIComponent(clean) +
            APK_NAME_SUFFIX
        );

    }


    /* =================================================
       CEK VERSI LEBIH BARU
    ================================================= */

    function isNewerVersion(
        latestVersion,
        currentVersion
    ) {

        return (
            versionToNumber(latestVersion) >
            versionToNumber(currentVersion)
        );

    }


    /* =================================================
       TAMPILKAN NOTIFIKASI UPDATE
    ================================================= */

    function showUpdateNotification(data) {

        const oldNotification =
            document.getElementById(
                "updateNotification"
            );

        if (oldNotification) {
            oldNotification.remove();
        }


        const apkVersion =
            cleanVersion(data.version);

        const apkUrl =
            getApkDownloadUrl(apkVersion);


        if (!apkUrl) {

            console.error(
                "URL APK tidak dapat dibuat."
            );

            return;

        }


        const notification =
            document.createElement("div");


        notification.id =
            "updateNotification";


        notification.innerHTML = `

            <div style="
                position:fixed;
                left:15px;
                right:15px;
                bottom:85px;
                z-index:99999;
                background:#ffffff;
                color:#212529;
                border-radius:18px;
                padding:18px;
                box-shadow:0 10px 35px rgba(0,0,0,.20);
                border:1px solid #e2e8e5;
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                    margin-bottom:10px;
                ">

                    <div style="
                        width:44px;
                        height:44px;
                        min-width:44px;
                        border-radius:14px;
                        background:#e8f5ee;
                        color:#198754;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:22px;
                    ">

                        <i class="bi bi-arrow-down-circle-fill"></i>

                    </div>


                    <div style="flex:1;">

                        <div style="
                            font-weight:800;
                            font-size:16px;
                        ">
                            Update Tersedia
                        </div>


                        <div style="
                            color:#6c757d;
                            font-size:13px;
                            margin-top:2px;
                        ">

                            Versi ${apkVersion} tersedia

                        </div>

                    </div>


                    <button
                        id="closeUpdateNotification"
                        type="button"
                        style="
                            border:0;
                            background:transparent;
                            font-size:22px;
                            color:#6c757d;
                        "
                    >
                        &times;
                    </button>

                </div>


                <div style="
                    font-size:14px;
                    line-height:1.5;
                    margin-bottom:14px;
                ">

                    ${
                        data.message ||
                        "Versi terbaru aplikasi tersedia."
                    }

                </div>


                <div style="
                    display:flex;
                    gap:10px;
                ">

                    <button
                        id="updateNowButton"
                        type="button"
                        style="
                            flex:1;
                            border:0;
                            background:#198754;
                            color:#ffffff;
                            border-radius:12px;
                            padding:10px;
                            font-weight:700;
                        "
                    >

                        <i class="bi bi-download"></i>

                        Perbarui Sekarang

                    </button>


                    <button
                        id="updateLaterButton"
                        type="button"
                        style="
                            flex:1;
                            border:1px solid #198754;
                            background:#ffffff;
                            color:#198754;
                            border-radius:12px;
                            padding:10px;
                            font-weight:700;
                        "
                    >

                        Nanti

                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            notification
        );


        const closeButton =
            document.getElementById(
                "closeUpdateNotification"
            );

        const laterButton =
            document.getElementById(
                "updateLaterButton"
            );

        const nowButton =
            document.getElementById(
                "updateNowButton"
            );


        /* =================================================
           FUNGSI TUTUP
        ================================================= */

        function closeNotification() {

            const element =
                document.getElementById(
                    "updateNotification"
                );

            if (element) {
                element.remove();
            }

        }


        /* =================================================
           TOMBOL CLOSE
        ================================================= */

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeNotification
            );

        }


        /* =================================================
           TOMBOL NANTI
        ================================================= */

        if (laterButton) {

            laterButton.addEventListener(
                "click",
                closeNotification
            );

        }


        /* =================================================
           TOMBOL PERBARUI SEKARANG
        ================================================= */

        if (nowButton) {

            nowButton.addEventListener(
                "click",
                function () {

                    console.log(
                        "================================"
                    );

                    console.log(
                        "UPDATE DIMULAI"
                    );

                    console.log(
                        "Versi sekarang:",
                        CURRENT_VERSION
                    );

                    console.log(
                        "Versi baru:",
                        apkVersion
                    );

                    console.log(
                        "APK:",
                        apkUrl
                    );

                    console.log(
                        "================================"
                    );


                    nowButton.disabled =
                        true;

                    nowButton.style.opacity =
                        "0.7";

                    nowButton.innerHTML = `
                        <i class="bi bi-hourglass-split"></i>
                        Mengunduh...
                    `;


                    /* =====================================
                       ANDROID NATIVE DOWNLOADER
                    ===================================== */

                    if (
                        window.AndroidDownload &&
                        typeof window.AndroidDownload.downloadApk ===
                            "function"
                    ) {

                        try {

                            window.AndroidDownload.downloadApk(
                                apkUrl,
                                apkVersion
                            );

                            return;

                        } catch (error) {

                            console.error(
                                "Native download gagal:",
                                error
                            );

                        }

                    }


                    /* =====================================
                       FALLBACK BROWSER / WEBVIEW
                    ===================================== */

                    setTimeout(
                        function () {

                            window.location.href =
                                apkUrl;

                        },
                        300
                    );

                }
            );

        }

    }


    /* =================================================
       PESAN SUDAH TERBARU
    ================================================= */

    function showLatestMessage() {

        alert(
            "Aplikasi sudah menggunakan " +
            "versi terbaru (" +
            CURRENT_VERSION +
            ")."
        );

    }


    /* =================================================
       CEK UPDATE
    ================================================= */

    async function checkForUpdate(
        showLatest = false
    ) {

        try {

            console.log(
                "Memeriksa update..."
            );

            console.log(
                "Versi aplikasi:",
                CURRENT_VERSION
            );


            const response =
                await fetch(
                    VERSION_URL +
                    "?t=" +
                    Date.now(),
                    {
                        cache: "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Gagal mengambil version.json. HTTP " +
                    response.status
                );

            }


            const data =
                await response.json();


            const latestVersion =
                cleanVersion(
                    data.version
                );


            if (!latestVersion) {

                throw new Error(
                    "Versi pada version.json tidak ditemukan."
                );

            }


            console.log(
                "Versi terbaru:",
                latestVersion
            );


            console.log(
                "APK terbaru:",
                getApkDownloadUrl(
                    latestVersion
                )
            );


            /* ==========================================
               VERSI BARU TERSEDIA
            ========================================== */

            if (
                isNewerVersion(
                    latestVersion,
                    CURRENT_VERSION
                )
            ) {

                console.log(
                    "UPDATE TERSEDIA!"
                );


                showUpdateNotification(
                    data
                );


                return {

                    updateAvailable:
                        true,

                    data:
                        data,

                    apkUrl:
                        getApkDownloadUrl(
                            latestVersion
                        )

                };

            }


            /* ==========================================
               SUDAH TERBARU
            ========================================== */

            console.log(
                "Aplikasi sudah terbaru."
            );


            if (showLatest) {

                showLatestMessage();

            }


            return {

                updateAvailable:
                    false,

                data:
                    data

            };


        } catch (error) {

            console.error(
                "UPDATE CHECK ERROR:",
                error
            );


            if (showLatest) {

                alert(
                    "Tidak dapat memeriksa update.\n\n" +
                    "Pastikan koneksi internet tersedia."
                );

            }


            return {

                updateAvailable:
                    false,

                error:
                    error

            };

        }

    }


    /* =================================================
       TOMBOL CEK UPDATE
    ================================================= */

    function setupUpdateButton() {

        const button =
            document.getElementById(
                "cekUpdateButton"
            );


        if (!button) {

            console.log(
                "Tombol cek update tidak ditemukan."
            );

            return;

        }


        button.addEventListener(
            "click",
            function () {

                button.disabled =
                    true;


                const text =
                    button.innerHTML;


                button.innerHTML = `
                    <i class="bi bi-arrow-repeat"></i>
                    Memeriksa...
                `;


                checkForUpdate(true)
                    .finally(
                        function () {

                            button.disabled =
                                false;

                            button.innerHTML =
                                text;

                        }
                    );

            }
        );

    }


    /* =================================================
       JALANKAN SAAT APLIKASI DIBUKA
    ================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            console.log(
                "UPDATE CHECK AKTIF"
            );

            console.log(
                "APP VERSION:",
                CURRENT_VERSION
            );

            console.log(
                "VERSION URL:",
                VERSION_URL
            );


            setupUpdateButton();


            /* ==========================================
               CEK OTOMATIS 2,5 DETIK
            ========================================== */

            setTimeout(
                function () {

                    checkForUpdate(
                        false
                    );

                },
                2500
            );

        }
    );


    /* =================================================
       PUBLIC API
    ================================================= */

    window.CatatanKasUpdate = {

        check:
            function () {

                return checkForUpdate(
                    true
                );

            },


        getApkUrl:
            function (version) {

                return getApkDownloadUrl(
                    version
                );

            }

    };


})();

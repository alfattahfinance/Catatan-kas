/* =====================================================
   CATATAN KAS
   UPDATE CHECK SYSTEM - TAHAP 2
===================================================== */

(function () {

    "use strict";


    /* =================================================
       KONFIGURASI
    ================================================= */

    const VERSION_URL =
        "https://raw.githubusercontent.com/alfattahfinance/Catatan-kas/main/version.json";


    /* =================================================
       VERSI APLIKASI SAAT INI
    ================================================= */

    const CURRENT_VERSION =
        window.APP_VERSION || "2.0";


    /* =================================================
       FUNGSI MEMBANDINGKAN VERSI
    ================================================= */

    function versionToNumber(version) {

        if (!version) {
            return 0;
        }

        return version
            .toString()
            .replace(/^v/i, "")
            .split(".")
            .map(function (number) {

                return parseInt(number, 10) || 0;

            })
            .reduce(function (total, number) {

                return total * 1000 + number;

            }, 0);
    }


    /* =================================================
       CEK APAKAH VERSI BARU
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
       NOTIFIKASI UPDATE
    ================================================= */

    function showUpdateNotification(data) {

        const oldNotification =
            document.getElementById(
                "updateNotification"
            );

        if (oldNotification) {
            oldNotification.remove();
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
                box-shadow:
                    0 10px 35px rgba(0,0,0,.20);
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

                            Versi ${data.version} tersedia

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

                    ${data.message || "Versi terbaru aplikasi tersedia."}

                </div>


                <button
                    id="updateLaterButton"
                    type="button"
                    style="
                        width:100%;
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


        function closeNotification() {

            const element =
                document.getElementById(
                    "updateNotification"
                );

            if (element) {
                element.remove();
            }

        }


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeNotification
            );

        }


        if (laterButton) {

            laterButton.addEventListener(
                "click",
                closeNotification
            );

        }

    }


    /* =================================================
       APLIKASI SUDAH TERBARU
    ================================================= */

    function showLatestMessage() {

        alert(
            "Aplikasi sudah menggunakan versi terbaru (" +
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
                    "Gagal mengambil version.json"
                );

            }


            const data =
                await response.json();


            const latestVersion =
                data.version;


            if (!latestVersion) {

                throw new Error(
                    "Versi pada version.json tidak ditemukan"
                );

            }


            console.log(
                "Versi aplikasi:",
                CURRENT_VERSION
            );


            console.log(
                "Versi terbaru:",
                latestVersion
            );


            /* =========================================
               ADA UPDATE
            ========================================= */

            if (
                isNewerVersion(
                    latestVersion,
                    CURRENT_VERSION
                )
            ) {

                showUpdateNotification(
                    data
                );


                return {
                    updateAvailable: true,
                    data: data
                };

            }


            /* =========================================
               SUDAH TERBARU
            ========================================= */

            if (showLatest) {

                showLatestMessage();

            }


            return {
                updateAvailable: false,
                data: data
            };


        } catch (error) {

            console.error(
                "Update check error:",
                error
            );


            if (showLatest) {

                alert(
                    "Tidak dapat memeriksa update.\n\n" +
                    "Pastikan koneksi internet tersedia."
                );

            }


            return {
                updateAvailable: false,
                error: error
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
                "Tombol cek update belum tersedia."
            );

            return;

        }


        button.addEventListener(
            "click",
            function () {

                button.disabled = true;


                const text =
                    button.innerHTML;


                button.innerHTML =
                    '<i class="bi bi-arrow-repeat"></i> Memeriksa...';


                checkForUpdate(true)
                    .finally(function () {

                        button.disabled = false;

                        button.innerHTML =
                            text;

                    });

            }
        );

    }


    /* =================================================
       JALANKAN SAAT APLIKASI DIBUKA
    ================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            setupUpdateButton();


            /*
             * Cek update otomatis.
             *
             * Tidak menampilkan alert jika
             * aplikasi sudah terbaru.
             */

            setTimeout(
                function () {

                    checkForUpdate(false);

                },
                2500
            );

        }
    );


    /* =================================================
       PUBLIC FUNCTION
    ================================================= */

    window.CatatanKasUpdate = {

        check: function () {

            return checkForUpdate(true);

        }

    };


})();

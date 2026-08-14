package com.catatankas.app;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import java.io.File;


/**
 * ============================================================
 * CATATAN KAS
 * MainActivity.java
 * ============================================================
 *
 * Fungsi:
 *
 * 1. Menjalankan aplikasi HTML melalui WebView
 * 2. Menyediakan AndroidDownload ke JavaScript
 * 3. Download APK update melalui DownloadManager
 * 4. Menunggu download selesai
 * 5. Membuka installer APK otomatis
 * 6. Mendukung Install Unknown Apps
 * 7. WebViewAssetLoader
 * 8. Tombol Back
 *
 * JavaScript:
 *
 * window.AndroidDownload.downloadApk(
 *      apkUrl,
 *      version
 * );
 *
 * ============================================================
 */
public class MainActivity extends AppCompatActivity {

    // ========================================================
    // WEBVIEW
    // ========================================================

    private WebView webView;


    // ========================================================
    // DOWNLOAD MANAGER
    // ========================================================

    private DownloadManager downloadManager;

    private long downloadId = -1;


    // ========================================================
    // FILE APK YANG AKAN DIINSTALL
    // ========================================================

    private File pendingApkFile;


    // ========================================================
    // STATUS INSTALLER
    // ========================================================

    private boolean waitingInstallPermission = false;


    // ========================================================
    // RECEIVER DOWNLOAD SELESAI
    // ========================================================

    private BroadcastReceiver downloadReceiver;


    // ========================================================
    // ON CREATE
    // ========================================================

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);


        // ====================================================
        // DOWNLOAD MANAGER
        // ====================================================

        downloadManager =
                (DownloadManager)
                        getSystemService(
                                Context.DOWNLOAD_SERVICE
                        );


        // ====================================================
        // WEBVIEW
        // ====================================================

        webView =
                new WebView(this);

        setContentView(webView);


        WebSettings settings =
                webView.getSettings();


        settings.setJavaScriptEnabled(true);

        settings.setDomStorageEnabled(true);

        settings.setDatabaseEnabled(true);

        settings.setAllowFileAccess(false);

        settings.setAllowContentAccess(true);

        settings.setBuiltInZoomControls(false);

        settings.setDisplayZoomControls(false);

        settings.setMediaPlaybackRequiresUserGesture(false);

        settings.setSupportZoom(false);

        settings.setJavaScriptCanOpenWindowsAutomatically(true);


        // ====================================================
        // ANDROID JAVASCRIPT INTERFACE
        // ====================================================

        webView.addJavascriptInterface(
                new AndroidDownload(),
                "AndroidDownload"
        );


        // ====================================================
        // ASSET LOADER
        // ====================================================

        final WebViewAssetLoader assetLoader =
                new WebViewAssetLoader.Builder()
                        .addPathHandler(
                                "/assets/",
                                new WebViewAssetLoader.AssetsPathHandler(
                                        this
                                )
                        )
                        .build();


        // ====================================================
        // WEBVIEW CLIENT
        // ====================================================

        webView.setWebViewClient(
                new WebViewClientCompat() {

                    @Override
                    public WebResourceResponse shouldInterceptRequest(
                            WebView view,
                            WebResourceRequest request
                    ) {

                        return assetLoader.shouldInterceptRequest(
                                request.getUrl()
                        );
                    }


                    @Override
                    public boolean shouldOverrideUrlLoading(
                            WebView view,
                            WebResourceRequest request
                    ) {

                        Uri uri =
                                request.getUrl();


                        if (uri == null) {
                            return false;
                        }


                        String url =
                                uri.toString();


                        String lowerUrl =
                                url.toLowerCase();


                        // ====================================
                        // GITHUB / APK
                        // ====================================

                        if (
                                lowerUrl.contains(
                                        "github.com"
                                )
                                ||
                                lowerUrl.contains(
                                        "githubusercontent.com"
                                )
                                ||
                                lowerUrl.endsWith(
                                        ".apk"
                                )
                        ) {

                            openExternalUrl(uri);

                            return true;
                        }


                        // ====================================
                        // EXTERNAL URL LAIN
                        // ====================================

                        if (
                                !lowerUrl.startsWith(
                                        "https://appassets.androidplatform.net/"
                                )
                                &&
                                !lowerUrl.startsWith(
                                        "http://appassets.androidplatform.net/"
                                )
                        ) {

                            openExternalUrl(uri);

                            return true;
                        }


                        return false;
                    }

                }
        );


        // ====================================================
        // REGISTER DOWNLOAD RECEIVER
        // ====================================================

        registerDownloadReceiver();


        // ====================================================
        // LOAD APLIKASI
        // ====================================================

        webView.loadUrl(
                "https://appassets.androidplatform.net/assets/index.html"
        );


        // ====================================================
        // TOMBOL BACK
        // ====================================================

        getOnBackPressedDispatcher().addCallback(
                this,
                new OnBackPressedCallback(true) {

                    @Override
                    public void handleOnBackPressed() {

                        if (
                                webView != null
                                &&
                                webView.canGoBack()
                        ) {

                            webView.goBack();

                        } else {

                            finish();

                        }

                    }

                }
        );

    }


    // ========================================================
    // JAVASCRIPT INTERFACE
    // ========================================================

    public class AndroidDownload {


        /**
         * Dipanggil dari JavaScript:
         *
         * window.AndroidDownload.downloadApk(
         *      apkUrl,
         *      version
         * );
         */
        @JavascriptInterface
        public void downloadApk(
                String apkUrl,
                String version
        ) {

            runOnUiThread(
                    () -> {

                        startApkDownload(
                                apkUrl,
                                version
                        );

                    }
            );

        }

    }


    // ========================================================
    // MULAI DOWNLOAD APK
    // ========================================================

    private void startApkDownload(
            String apkUrl,
            String version
    ) {

        try {

            if (
                    apkUrl == null
                    ||
                    apkUrl.trim().isEmpty()
            ) {

                showMessage(
                        "URL APK tidak valid."
                );

                return;
            }


            // =================================================
            // BERSIHKAN VERSI
            // =================================================

            String cleanVersion =
                    cleanVersion(version);


            if (
                    cleanVersion.isEmpty()
            ) {

                cleanVersion = "latest";

            }


            // =================================================
            // NAMA FILE
            // =================================================

            String fileName =
                    "Keuangan-v"
                            +
                            cleanVersion
                            +
                            ".apk";


            // =================================================
            // HAPUS DOWNLOAD LAMA DENGAN NAMA SAMA
            // =================================================

            deleteOldApk(
                    fileName
            );


            // =================================================
            // DOWNLOAD REQUEST
            // =================================================

            Uri downloadUri =
                    Uri.parse(
                            apkUrl
                    );


            DownloadManager.Request request =
                    new DownloadManager.Request(
                            downloadUri
                    );


            // =================================================
            // HEADER
            // =================================================

            request.addRequestHeader(
                    "User-Agent",
                    "Mozilla/5.0 " +
                    "(Android) CatatanKas"
            );


            // =================================================
            // JUDUL DOWNLOAD
            // =================================================

            request.setTitle(
                    "Update Catatan Kas " +
                    cleanVersion
            );


            request.setDescription(
                    "Mengunduh APK versi " +
                    cleanVersion
            );


            // =================================================
            // MIME TYPE APK
            // =================================================

            request.setMimeType(
                    "application/vnd.android.package-archive"
            );


            // =================================================
            // NOTIFIKASI DOWNLOAD
            // =================================================

            request.setNotificationVisibility(
                    DownloadManager.Request
                            .VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            );


            // =================================================
            // SIMPAN KE FOLDER DOWNLOAD APLIKASI
            // =================================================

            request.setDestinationInExternalFilesDir(
                    this,
                    Environment.DIRECTORY_DOWNLOADS,
                    fileName
            );


            // =================================================
            // MULAI DOWNLOAD
            // =================================================

            downloadId =
                    downloadManager.enqueue(
                            request
                    );


            // =================================================
            // SIMPAN FILE YANG DIHARAPKAN
            // =================================================

            pendingApkFile =
                    new File(
                            getExternalFilesDir(
                                    Environment.DIRECTORY_DOWNLOADS
                            ),
                            fileName
                    );


            // =================================================
            // UPDATE WEBVIEW
            // =================================================

            sendJavascript(
                    "window.dispatchEvent(" +
                    "new CustomEvent('apkDownloadStarted'," +
                    "{detail:{version:'" +
                    escapeJs(cleanVersion) +
                    "'}})" +
                    ")"
            );


            showMessage(
                    "Download update " +
                    cleanVersion +
                    " dimulai..."
            );


        } catch (Exception e) {

            e.printStackTrace();


            showMessage(
                    "Gagal memulai download APK."
            );

        }

    }


    // ========================================================
    // REGISTER DOWNLOAD RECEIVER
    // ========================================================

    private void registerDownloadReceiver() {

        downloadReceiver =
                new BroadcastReceiver() {

                    @Override
                    public void onReceive(
                            Context context,
                            Intent intent
                    ) {

                        if (
                                !DownloadManager
                                        .ACTION_DOWNLOAD_COMPLETE
                                        .equals(
                                                intent.getAction()
                                        )
                        ) {

                            return;
                        }


                        long completedId =
                                intent.getLongExtra(
                                        DownloadManager.EXTRA_DOWNLOAD_ID,
                                        -1
                                );


                        if (
                                completedId != downloadId
                        ) {

                            return;
                        }


                        checkDownloadResult(
                                completedId
                        );

                    }

                };


        IntentFilter filter =
                new IntentFilter(
                        DownloadManager
                                .ACTION_DOWNLOAD_COMPLETE
                );


        if (
                Build.VERSION.SDK_INT >=
                Build.VERSION_CODES.TIRAMISU
        ) {

            registerReceiver(
                    downloadReceiver,
                    filter,
                    Context.RECEIVER_EXPORTED
            );

        } else {

            registerReceiver(
                    downloadReceiver,
                    filter
            );

        }

    }


    // ========================================================
    // CEK HASIL DOWNLOAD
    // ========================================================

    private void checkDownloadResult(
            long completedId
    ) {

        try {

            DownloadManager.Query query =
                    new DownloadManager.Query();


            query.setFilterById(
                    completedId
            );


            android.database.Cursor cursor =
                    downloadManager.query(
                            query
                    );


            if (
                    cursor == null
                    ||
                    !cursor.moveToFirst()
            ) {

                showMessage(
                        "Status download tidak ditemukan."
                );

                return;
            }


            int statusIndex =
                    cursor.getColumnIndex(
                            DownloadManager
                                    .COLUMN_STATUS
                    );


            int reasonIndex =
                    cursor.getColumnIndex(
                            DownloadManager
                                    .COLUMN_REASON
                    );


            int localUriIndex =
                    cursor.getColumnIndex(
                            DownloadManager
                                    .COLUMN_LOCAL_URI
                    );


            int status =
                    cursor.getInt(
                            statusIndex
                    );


            String localUri =
                    localUriIndex >= 0
                            ?
                            cursor.getString(
                                    localUriIndex
                            )
                            :
                            null;


            int reason =
                    reasonIndex >= 0
                            ?
                            cursor.getInt(
                                    reasonIndex
                            )
                            :
                            0;


            cursor.close();


            // =================================================
            // DOWNLOAD BERHASIL
            // =================================================

            if (
                    status ==
                    DownloadManager.STATUS_SUCCESSFUL
            ) {

                if (
                        pendingApkFile == null
                        ||
                        !pendingApkFile.exists()
                ) {

                    pendingApkFile =
                            resolveDownloadedFile(
                                    localUri
                            );

                }


                if (
                        pendingApkFile != null
                        &&
                        pendingApkFile.exists()
                ) {

                    sendJavascript(
                            "window.dispatchEvent(" +
                            "new CustomEvent('apkDownloadComplete')" +
                            ")"
                    );


                    showMessage(
                            "Download selesai. " +
                            "Membuka installer..."
                    );


                    // =========================================
                    // BUKA INSTALLER
                    // =========================================

                    installApk(
                            pendingApkFile
                    );

                } else {

                    showMessage(
                            "APK selesai diunduh, " +
                            "tetapi file tidak ditemukan."
                    );

                }


                return;
            }


            // =================================================
            // DOWNLOAD GAGAL
            // =================================================

            if (
                    status ==
                    DownloadManager.STATUS_FAILED
            ) {

                sendJavascript(
                        "window.dispatchEvent(" +
                        "new CustomEvent('apkDownloadFailed')" +
                        ")"
                );


                showMessage(
                        "Download APK gagal. " +
                        "Kode: " +
                        reason
                );

            }

        } catch (Exception e) {

            e.printStackTrace();


            showMessage(
                    "Terjadi kesalahan saat memeriksa download."
            );

        }

    }


    // ========================================================
    // CARI FILE HASIL DOWNLOAD
    // ========================================================

    private File resolveDownloadedFile(
            String localUri
    ) {

        try {

            if (
                    localUri == null
                    ||
                    localUri.isEmpty()
            ) {

                return null;
            }


            if (
                    localUri.startsWith(
                            "file://"
                    )
            ) {

                Uri uri =
                        Uri.parse(
                                localUri
                        );


                return new File(
                        uri.getPath()
                );

            }


        } catch (Exception e) {

            e.printStackTrace();

        }


        return null;

    }


    // ========================================================
    // INSTALL APK
    // ========================================================

    private void installApk(
            File apkFile
    ) {

        if (
                apkFile == null
                ||
                !apkFile.exists()
        ) {

            showMessage(
                    "File APK tidak ditemukan."
            );

            return;
        }


        pendingApkFile =
                apkFile;


        // ====================================================
        // ANDROID 8+
        // CEK IZIN INSTALL UNKNOWN APPS
        // ====================================================

        if (
                Build.VERSION.SDK_INT >=
                Build.VERSION_CODES.O
        ) {

            boolean allowed =
                    getPackageManager()
                            .canRequestPackageInstalls();


            if (!allowed) {

                waitingInstallPermission =
                        true;


                try {

                    Intent intent =
                            new Intent(
                                    Settings
                                            .ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                    Uri.parse(
                                            "package:" +
                                            getPackageName()
                                    )
                            );


                    startActivity(
                            intent
                    );


                    showMessage(
                            "Izinkan pemasangan aplikasi " +
                            "dari sumber ini, lalu installer akan dibuka."
                    );


                } catch (Exception e) {

                    e.printStackTrace();


                    showMessage(
                            "Silakan aktifkan izin " +
                            "'Install aplikasi tidak dikenal'."
                    );

                }


                return;
            }

        }


        // ====================================================
        // BUKA INSTALLER
        // ====================================================

        openApkInstaller(
                apkFile
        );

    }


    // ========================================================
    // BUKA INSTALLER APK
    // ========================================================

    private void openApkInstaller(
            File apkFile
    ) {

        try {

            Uri apkUri;


            // =================================================
            // ANDROID NOUGAT+
            // =================================================

            if (
                    Build.VERSION.SDK_INT >=
                    Build.VERSION_CODES.N
            ) {

                apkUri =
                        FileProvider.getUriForFile(
                                this,
                                getPackageName() +
                                ".fileprovider",
                                apkFile
                        );

            } else {

                apkUri =
                        Uri.fromFile(
                                apkFile
                        );

            }


            Intent intent =
                    new Intent(
                            Intent.ACTION_VIEW
                    );


            intent.setDataAndType(
                    apkUri,
                    "application/vnd.android.package-archive"
            );


            intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
            );


            intent.addFlags(
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
            );


            intent.addFlags(
                    Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );


            startActivity(
                    intent
            );


        } catch (Exception e) {

            e.printStackTrace();


            showMessage(
                    "Installer APK tidak dapat dibuka."
            );

        }

    }


    // ========================================================
    // ON RESUME
    // ========================================================

    @Override
    protected void onResume() {

        super.onResume();


        // ====================================================
        // KALAU USER BARU SELESAI MEMBERI IZIN
        // ====================================================

        if (
                waitingInstallPermission
                &&
                pendingApkFile != null
        ) {

            if (
                    Build.VERSION.SDK_INT <
                    Build.VERSION_CODES.O
                    ||
                    getPackageManager()
                            .canRequestPackageInstalls()
            ) {

                waitingInstallPermission =
                        false;


                if (
                        pendingApkFile.exists()
                ) {

                    openApkInstaller(
                            pendingApkFile
                    );

                }

            }

        }

    }


    // ========================================================
    // HAPUS APK LAMA
    // ========================================================

    private void deleteOldApk(
            String fileName
    ) {

        try {

            File directory =
                    getExternalFilesDir(
                            Environment.DIRECTORY_DOWNLOADS
                    );


            if (directory == null) {
                return;
            }


            File oldFile =
                    new File(
                            directory,
                            fileName
                    );


            if (oldFile.exists()) {

                oldFile.delete();

            }

        } catch (Exception e) {

            e.printStackTrace();

        }

    }


    // ========================================================
    // BUKA LINK EXTERNAL
    // ========================================================

    private void openExternalUrl(
            Uri uri
    ) {

        try {

            Intent intent =
                    new Intent(
                            Intent.ACTION_VIEW,
                            uri
                    );


            intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
            );


            startActivity(
                    intent
            );

        } catch (Exception e) {

            e.printStackTrace();


            showMessage(
                    "Tidak ada aplikasi untuk membuka link."
            );

        }

    }


    // ========================================================
    // KIRIM JAVASCRIPT
    // ========================================================

    private void sendJavascript(
            String javascript
    ) {

        if (
                webView == null
        ) {

            return;
        }


        runOnUiThread(
                () -> {

                    webView.evaluateJavascript(
                            javascript,
                            null
                    );

                }
        );

    }


    // ========================================================
    // PESAN
    // ========================================================

    private void showMessage(
            String message
    ) {

        runOnUiThread(
                () -> {

                    android.widget.Toast.makeText(
                            MainActivity.this,
                            message,
                            android.widget.Toast.LENGTH_LONG
                    ).show();

                }
        );

    }


    // ========================================================
    // BERSIHKAN VERSI
    // ========================================================

    private String cleanVersion(
            String version
    ) {

        if (
                version == null
        ) {

            return "";

        }


        return version
                .trim()
                .replaceFirst(
                        "(?i)^v",
                        ""
                );

    }


    // ========================================================
    // ESCAPE JAVASCRIPT
    // ========================================================

    private String escapeJs(
            String value
    ) {

        if (
                value == null
        ) {

            return "";

        }


        return value
                .replace(
                        "\\",
                        "\\\\"
                )
                .replace(
                        "'",
                        "\\'"
                )
                .replace(
                        "\"",
                        "\\\""
                )
                .replace(
                        "\n",
                        "\\n"
                )
                .replace(
                        "\r",
                        "\\r"
                );

    }


    // ========================================================
    // ON DESTROY
    // ========================================================

    @Override
    protected void onDestroy() {

        // ====================================================
        // UNREGISTER RECEIVER
        // ====================================================

        if (
                downloadReceiver != null
        ) {

            try {

                unregisterReceiver(
                        downloadReceiver
                );

            } catch (Exception e) {

                e.printStackTrace();

            }

            downloadReceiver =
                    null;

        }


        // ====================================================
        // WEBVIEW
        // ====================================================

        if (
                webView != null
        ) {

            webView.stopLoading();

            webView.clearHistory();

            webView.clearCache(false);

            webView.removeJavascriptInterface(
                    "AndroidDownload"
            );

            webView.destroy();

            webView =
                    null;

        }


        super.onDestroy();

    }

}

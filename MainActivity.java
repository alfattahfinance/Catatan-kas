package com.catatankas.app;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
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

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    private DownloadManager downloadManager;

    private long downloadId = -1;

    private File pendingApkFile;

    private boolean waitingInstallPermission = false;

    private BroadcastReceiver downloadReceiver;


    // =========================================================
    // ON CREATE
    // =========================================================

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        // =====================================================
        // DOWNLOAD MANAGER
        // =====================================================

        downloadManager =
                (DownloadManager)
                        getSystemService(
                                Context.DOWNLOAD_SERVICE
                        );


        // =====================================================
        // WEBVIEW
        // =====================================================

        webView = new WebView(this);

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

        settings.setSupportZoom(false);

        settings.setMediaPlaybackRequiresUserGesture(false);

        settings.setJavaScriptCanOpenWindowsAutomatically(true);


        // =====================================================
        // PENTING UNTUK TAMPILAN WEBVIEW
        // =====================================================

        settings.setUseWideViewPort(false);

        settings.setLoadWithOverviewMode(false);


        // =====================================================
        // BACKGROUND WEBVIEW
        // =====================================================

        webView.setBackgroundColor(
                android.graphics.Color.TRANSPARENT
        );


        // =====================================================
        // JAVASCRIPT INTERFACE
        // =====================================================

        webView.addJavascriptInterface(
                new AndroidDownload(),
                "AndroidDownload"
        );


        // =====================================================
        // ASSET LOADER
        // =====================================================

        final WebViewAssetLoader assetLoader =
                new WebViewAssetLoader.Builder()
                        .addPathHandler(
                                "/assets/",
                                new WebViewAssetLoader
                                        .AssetsPathHandler(this)
                        )
                        .build();


        // =====================================================
        // WEBVIEW CLIENT
        // =====================================================

        webView.setWebViewClient(
                new WebViewClientCompat() {

                    @Override
                    public WebResourceResponse
                    shouldInterceptRequest(
                            WebView view,
                            WebResourceRequest request
                    ) {

                        return assetLoader
                                .shouldInterceptRequest(
                                        request.getUrl()
                                );
                    }


                    @Override
                    public boolean
                    shouldOverrideUrlLoading(
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


                        // =================================================
                        // LINK GITHUB / APK
                        // =================================================

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


                        // =================================================
                        // LINK EXTERNAL LAIN
                        // =================================================

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


        // =====================================================
        // RECEIVER DOWNLOAD
        // =====================================================

        registerDownloadReceiver();


        // =====================================================
        // LOAD HTML
        // =====================================================

        webView.loadUrl(
                "https://appassets.androidplatform.net/assets/index.html"
        );


        // =====================================================
        // BACK BUTTON
        // =====================================================

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


    // =========================================================
    // JAVASCRIPT INTERFACE
    // =========================================================

    public class AndroidDownload {

        @JavascriptInterface
        public void downloadApk(
                String apkUrl,
                String version
        ) {

            runOnUiThread(
                    () -> startApkDownload(
                            apkUrl,
                            version
                    )
            );
        }
    }


    // =========================================================
    // DOWNLOAD APK
    // =========================================================

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


            String cleanVersion =
                    cleanVersion(version);


            if (cleanVersion.isEmpty()) {
                cleanVersion = "latest";
            }


            String fileName =
                    "Keuangan-v"
                            + cleanVersion
                            + ".apk";


            // =================================================
            // HAPUS APK LAMA
            // =================================================

            deleteOldApk(fileName);


            Uri downloadUri =
                    Uri.parse(apkUrl);


            DownloadManager.Request request =
                    new DownloadManager.Request(
                            downloadUri
                    );


            request.addRequestHeader(
                    "User-Agent",
                    "Mozilla/5.0 Android CatatanKas"
            );


            request.setTitle(
                    "Update Catatan Kas v"
                            + cleanVersion
            );


            request.setDescription(
                    "Mengunduh Catatan Kas v"
                            + cleanVersion
            );


            request.setMimeType(
                    "application/vnd.android.package-archive"
            );


            request.setNotificationVisibility(
                    DownloadManager.Request
                            .VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            );


            // =================================================
            // SIMPAN KE FOLDER PRIVATE APLIKASI
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


            File directory =
                    getExternalFilesDir(
                            Environment.DIRECTORY_DOWNLOADS
                    );


            if (directory != null) {

                pendingApkFile =
                        new File(
                                directory,
                                fileName
                        );
            }


            // =================================================
            // BERITAHU JAVASCRIPT
            // =================================================

            sendJavascript(
                    "window.dispatchEvent("
                            +
                            "new CustomEvent("
                            +
                            "'apkDownloadStarted',"
                            +
                            "{detail:{version:'"
                            +
                            escapeJs(cleanVersion)
                            +
                            "'}}"
                            +
                            ")"
                            +
                            ")"
            );


            showMessage(
                    "Download update v"
                            + cleanVersion
                            + " dimulai..."
            );


        } catch (Exception e) {

            e.printStackTrace();

            showMessage(
                    "Gagal memulai download APK."
            );
        }
    }


    // =========================================================
    // RECEIVER DOWNLOAD
    // =========================================================

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
                                        DownloadManager
                                                .EXTRA_DOWNLOAD_ID,
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


    // =========================================================
    // CEK DOWNLOAD
    // =========================================================

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


            int reason =
                    reasonIndex >= 0
                            ?
                            cursor.getInt(
                                    reasonIndex
                            )
                            :
                            0;


            String localUri =
                    localUriIndex >= 0
                            ?
                            cursor.getString(
                                    localUriIndex
                            )
                            :
                            null;


            cursor.close();


            // =================================================
            // BERHASIL
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
                            "window.dispatchEvent("
                                    +
                                    "new CustomEvent("
                                    +
                                    "'apkDownloadComplete'"
                                    +
                                    ")"
                                    +
                                    ")"
                    );


                    showMessage(
                            "Download selesai. " +
                            "Membuka installer..."
                    );


                    installApk(
                            pendingApkFile
                    );

                } else {

                    showMessage(
                            "APK berhasil diunduh, " +
                            "tetapi file tidak ditemukan."
                    );
                }


                return;
            }


            // =================================================
            // GAGAL
            // =================================================

            if (
                    status ==
                    DownloadManager.STATUS_FAILED
            ) {

                sendJavascript(
                        "window.dispatchEvent("
                                +
                                "new CustomEvent("
                                +
                                "'apkDownloadFailed'"
                                +
                                ")"
                                +
                                ")"
                );


                showMessage(
                        "Download APK gagal. Kode: "
                                + reason
                );
            }


        } catch (Exception e) {

            e.printStackTrace();

            showMessage(
                    "Terjadi kesalahan saat memeriksa download."
            );
        }
    }


    // =========================================================
    // RESOLVE FILE
    // =========================================================

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
                    localUri.startsWith("file://")
            ) {

                Uri uri =
                        Uri.parse(localUri);


                String path =
                        uri.getPath();


                if (path != null) {

                    return new File(path);
                }
            }


        } catch (Exception e) {

            e.printStackTrace();
        }


        return null;
    }


    // =========================================================
    // INSTALL APK
    // =========================================================

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


        // =====================================================
        // ANDROID 8+
        // =====================================================

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
                                            "package:"
                                                    +
                                                    getPackageName()
                                    )
                            );


                    startActivity(intent);


                    showMessage(
                            "Aktifkan izin " +
                            "Install aplikasi tidak dikenal."
                    );


                } catch (Exception e) {

                    e.printStackTrace();


                    showMessage(
                            "Silakan aktifkan izin " +
                            "Install aplikasi tidak dikenal."
                    );
                }


                return;
            }
        }


        openApkInstaller(
                apkFile
        );
    }


    // =========================================================
    // OPEN INSTALLER
    // =========================================================

    private void openApkInstaller(
            File apkFile
    ) {

        try {

            Uri apkUri;


            if (
                    Build.VERSION.SDK_INT >=
                    Build.VERSION_CODES.N
            ) {

                apkUri =
                        FileProvider.getUriForFile(
                                this,
                                getPackageName()
                                        +
                                        ".fileprovider",
                                apkFile
                        );

            } else {

                apkUri =
                        Uri.fromFile(apkFile);
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


            startActivity(intent);


        } catch (Exception e) {

            e.printStackTrace();


            showMessage(
                    "Installer APK tidak dapat dibuka."
            );
        }
    }


    // =========================================================
    // RESUME
    // =========================================================

    @Override
    protected void onResume() {

        super.onResume();


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


    // =========================================================
    // HAPUS APK LAMA
    // =========================================================

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


    // =========================================================
    // EXTERNAL URL
    // =========================================================

    private void openExternalUrl(
            Uri uri
    ) {

        try {

            Intent intent =
                    new Intent(
                            Intent.ACTION_VIEW,
                            uri
                    );


            startActivity(intent);


        } catch (Exception e) {

            e.printStackTrace();


            showMessage(
                    "Tidak ada aplikasi untuk membuka link."
            );
        }
    }


    // =========================================================
    // JAVASCRIPT
    // =========================================================

    private void sendJavascript(
            String javascript
    ) {

        if (webView == null) {
            return;
        }


        runOnUiThread(
                () -> webView.evaluateJavascript(
                        javascript,
                        null
                )
        );
    }


    // =========================================================
    // TOAST
    // =========================================================

    private void showMessage(
            String message
    ) {

        runOnUiThread(
                () ->
                        android.widget.Toast
                                .makeText(
                                        MainActivity.this,
                                        message,
                                        android.widget.Toast.LENGTH_LONG
                                )
                                .show()
        );
    }


    // =========================================================
    // CLEAN VERSION
    // =========================================================

    private String cleanVersion(
            String version
    ) {

        if (version == null) {
            return "";
        }


        return version
                .trim()
                .replaceFirst(
                        "(?i)^v",
                        ""
                );
    }


    // =========================================================
    // ESCAPE JS
    // =========================================================

    private String escapeJs(
            String value
    ) {

        if (value == null) {
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


    // =========================================================
    // DESTROY
    // =========================================================

    @Override
    protected void onDestroy() {

        if (downloadReceiver != null) {

            try {

                unregisterReceiver(
                        downloadReceiver
                );

            } catch (Exception ignored) {
            }


            downloadReceiver =
                    null;
        }


        if (webView != null) {

            webView.stopLoading();

            webView.removeJavascriptInterface(
                    "AndroidDownload"
            );

            webView.destroy();

            webView = null;
        }


        super.onDestroy();
    }
}

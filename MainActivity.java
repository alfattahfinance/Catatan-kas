package com.catatankas.app;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
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


    // =====================================================
    // RECEIVER DOWNLOAD SELESAI
    // =====================================================

    private final BroadcastReceiver downloadReceiver =
            new BroadcastReceiver() {

                @Override
                public void onReceive(
                        Context context,
                        Intent intent
                ) {

                    long id =
                            intent.getLongExtra(
                                    DownloadManager.EXTRA_DOWNLOAD_ID,
                                    -1
                            );

                    if (id == downloadId) {

                        openDownloadedApk(id);
                    }
                }
            };


    // =====================================================
    // ON CREATE
    // =====================================================

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);


        // =================================================
        // WEBVIEW
        // =================================================

        webView = new WebView(this);

        setContentView(webView);


        android.webkit.WebSettings settings =
                webView.getSettings();

        settings.setJavaScriptEnabled(true);

        settings.setDomStorageEnabled(true);

        settings.setDatabaseEnabled(true);

        settings.setAllowFileAccess(false);

        settings.setAllowContentAccess(true);

        settings.setBuiltInZoomControls(false);

        settings.setDisplayZoomControls(false);

        settings.setMediaPlaybackRequiresUserGesture(false);


        // =================================================
        // JAVASCRIPT BRIDGE
        // =================================================

        webView.addJavascriptInterface(
                new AndroidDownload(this),
                "AndroidDownload"
        );


        // =================================================
        // DOWNLOAD MANAGER
        // =================================================

        downloadManager =
                (DownloadManager)
                        getSystemService(
                                DOWNLOAD_SERVICE
                        );


        // =================================================
        // DAFTARKAN RECEIVER
        // =================================================

        IntentFilter filter =
                new IntentFilter(
                        DownloadManager
                                .ACTION_DOWNLOAD_COMPLETE
                );


        registerReceiver(
                downloadReceiver,
                filter,
                Context.RECEIVER_NOT_EXPORTED
        );


        // =================================================
        // ASSET LOADER
        // =================================================

        final WebViewAssetLoader assetLoader =
                new WebViewAssetLoader.Builder()

                        .addPathHandler(
                                "/assets/",
                                new WebViewAssetLoader
                                        .AssetsPathHandler(
                                                this
                                        )
                        )

                        .build();


        // =================================================
        // WEBVIEW CLIENT
        // =================================================

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
                                uri.toString()
                                        .toLowerCase();


                        // =================================
                        // APK
                        // =================================

                        if (url.endsWith(".apk")) {

                            downloadApk(
                                    uri.toString(),
                                    "update.apk"
                            );

                            return true;
                        }


                        // =================================
                        // LINK EKSTERNAL
                        // =================================

                        if (
                                !url.startsWith(
                                        "https://appassets.androidplatform.net/"
                                )
                                &&
                                !url.startsWith(
                                        "http://appassets.androidplatform.net/"
                                )
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
                            }

                            return true;
                        }


                        return false;
                    }
                }
        );


        // =================================================
        // LOAD APLIKASI
        // =================================================

        webView.loadUrl(
                "https://appassets.androidplatform.net/assets/index.html"
        );


        // =================================================
        // TOMBOL BACK
        // =================================================

        getOnBackPressedDispatcher()
                .addCallback(
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


    // =====================================================
    // JAVASCRIPT BRIDGE
    // =====================================================

    public static class AndroidDownload {

        private final MainActivity activity;


        public AndroidDownload(
                MainActivity activity
        ) {

            this.activity = activity;
        }


        // =================================================
        // DIPANGGIL DARI update-check.js
        // =================================================

        @JavascriptInterface
        public void downloadApk(
                String url,
                String version
        ) {

            activity.runOnUiThread(
                    () -> {

                        String cleanVersion =
                                version
                                        .replace(
                                                "v",
                                                ""
                                        )
                                        .trim();


                        String fileName =
                                "Keuangan-v"
                                        + cleanVersion
                                        + ".apk";


                        activity.downloadApk(
                                url,
                                fileName
                        );
                    }
            );
        }
    }


    // =====================================================
    // DOWNLOAD APK
    // =====================================================

    private void downloadApk(
            String url,
            String fileName
    ) {

        try {

            if (downloadManager == null) {

                android.widget.Toast.makeText(
                        this,
                        "Download Manager tidak tersedia.",
                        android.widget.Toast.LENGTH_LONG
                ).show();

                return;
            }


            // =============================================
            // HAPUS DOWNLOAD LAMA DENGAN NAMA SAMA
            // =============================================

            File downloadFolder =
                    Environment
                            .getExternalStoragePublicDirectory(
                                    Environment
                                            .DIRECTORY_DOWNLOADS
                            );


            File oldFile =
                    new File(
                            downloadFolder,
                            fileName
                    );


            if (oldFile.exists()) {

                oldFile.delete();
            }


            // =============================================
            // REQUEST DOWNLOAD
            // =============================================

            DownloadManager.Request request =
                    new DownloadManager.Request(
                            Uri.parse(url)
                    );


            request.setTitle(
                    "Update Catatan Kas"
            );


            request.setDescription(
                    "Mengunduh versi terbaru..."
            );


            request.setMimeType(
                    "application/vnd.android.package-archive"
            );


            request.setNotificationVisibility(
                    DownloadManager
                            .Request
                            .VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            );


            request.setAllowedOverMetered(true);

            request.setAllowedOverRoaming(true);


            request.setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS,
                    fileName
            );


            // =============================================
            // MULAI DOWNLOAD
            // =============================================

            downloadId =
                    downloadManager.enqueue(
                            request
                    );


            android.widget.Toast.makeText(
                    this,
                    "Update sedang diunduh...",
                    android.widget.Toast.LENGTH_LONG
            ).show();


        } catch (Exception e) {

            e.printStackTrace();


            android.widget.Toast.makeText(
                    this,
                    "Gagal mengunduh update.",
                    android.widget.Toast.LENGTH_LONG
            ).show();
        }
    }


    // =====================================================
    // BUKA APK SETELAH DOWNLOAD SELESAI
    // =====================================================

    private void openDownloadedApk(
            long id
    ) {

        try {

            DownloadManager.Query query =
                    new DownloadManager.Query();


            query.setFilterById(id);


            Cursor cursor =
                    downloadManager.query(
                            query
                    );


            if (cursor == null) {

                return;
            }


            if (!cursor.moveToFirst()) {

                cursor.close();

                return;
            }


            int statusColumn =
                    cursor.getColumnIndex(
                            DownloadManager
                                    .COLUMN_STATUS
                    );


            int status =
                    cursor.getInt(
                            statusColumn
                    );


            if (
                    status !=
                    DownloadManager
                            .STATUS_SUCCESSFUL
            ) {

                cursor.close();


                android.widget.Toast.makeText(
                        this,
                        "Download update gagal.",
                        android.widget.Toast.LENGTH_LONG
                ).show();


                return;
            }


            // =============================================
            // AMBIL URI DOWNLOAD
            // =============================================

            String downloadedUri =
                    cursor.getString(
                            cursor.getColumnIndexOrThrow(
                                    DownloadManager
                                            .COLUMN_LOCAL_URI
                            )
                    );


            cursor.close();


            if (
                    downloadedUri == null
                    ||
                    downloadedUri.isEmpty()
            ) {

                return;
            }


            Uri uri =
                    Uri.parse(
                            downloadedUri
                    );


            // =============================================
            // FILE URI
            // =============================================

            String path =
                    uri.getPath();


            if (path == null) {

                return;
            }


            File apkFile =
                    new File(path);


            if (!apkFile.exists()) {

                android.widget.Toast.makeText(
                        this,
                        "File APK tidak ditemukan.",
                        android.widget.Toast.LENGTH_LONG
                ).show();


                return;
            }


            // =============================================
            // FILE PROVIDER URI
            // =============================================

            Uri apkUri =
                    FileProvider.getUriForFile(
                            this,
                            getPackageName()
                                    + ".fileprovider",
                            apkFile
                    );


            // =============================================
            // CEK IZIN INSTALL APK
            // =============================================

            if (
                    android.os.Build.VERSION.SDK_INT
                    >=
                    android.os.Build.VERSION_CODES.O
            ) {

                if (
                        !getPackageManager()
                                .canRequestPackageInstalls()
                ) {

                    android.widget.Toast.makeText(
                            this,
                            "Izinkan pemasangan aplikasi dari sumber ini.",
                            android.widget.Toast.LENGTH_LONG
                    ).show();


                    Intent settingsIntent =
                            new Intent(
                                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                    Uri.parse(
                                            "package:"
                                                    + getPackageName()
                                    )
                            );


                    startActivity(
                            settingsIntent
                    );


                    return;
                }
            }


            // =============================================
            // BUKA ANDROID INSTALLER
            // =============================================

            Intent installIntent =
                    new Intent(
                            Intent.ACTION_VIEW
                    );


            installIntent.setDataAndType(
                    apkUri,
                    "application/vnd.android.package-archive"
            );


            installIntent.addFlags(
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
            );


            installIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
            );


            startActivity(
                    installIntent
            );


        } catch (Exception e) {

            e.printStackTrace();


            android.widget.Toast.makeText(
                    this,
                    "Tidak dapat membuka installer APK.",
                    android.widget.Toast.LENGTH_LONG
            ).show();
        }
    }


    // =====================================================
    // DESTROY
    // =====================================================

    @Override
    protected void onDestroy() {

        try {

            unregisterReceiver(
                    downloadReceiver
            );

        } catch (Exception ignored) {
        }


        if (webView != null) {

            webView.stopLoading();

            webView.clearHistory();

            webView.clearCache(false);

            webView.destroy();

            webView = null;
        }


        super.onDestroy();
    }
}

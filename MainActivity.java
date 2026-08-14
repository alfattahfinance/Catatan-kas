package com.catatankas.app;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
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

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        // ==========================================
        // WEBVIEW
        // ==========================================

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


        // ==========================================
        // ANDROID JAVASCRIPT BRIDGE
        // ==========================================

        webView.addJavascriptInterface(
                new AndroidDownload(this),
                "AndroidDownload"
        );


        // ==========================================
        // ASSET LOADER
        // ==========================================

        final WebViewAssetLoader assetLoader =
                new WebViewAssetLoader.Builder()
                        .addPathHandler(
                                "/assets/",
                                new WebViewAssetLoader.AssetsPathHandler(this)
                        )
                        .build();


        // ==========================================
        // WEBVIEW CLIENT
        // ==========================================

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
                                uri.toString().toLowerCase();


                        // ==================================
                        // APK
                        // ==================================

                        if (url.endsWith(".apk")) {

                            downloadApk(
                                    uri.toString(),
                                    "update.apk"
                            );

                            return true;
                        }


                        // ==================================
                        // LINK EKSTERNAL
                        // ==================================

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


        // ==========================================
        // LOAD APLIKASI
        // ==========================================

        webView.loadUrl(
                "https://appassets.androidplatform.net/assets/index.html"
        );


        // ==========================================
        // TOMBOL BACK
        // ==========================================

        getOnBackPressedDispatcher().addCallback(
                this,
                new OnBackPressedCallback(true) {

                    @Override
                    public void handleOnBackPressed() {

                        if (webView != null
                                && webView.canGoBack()) {

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

            this.activity =
                    activity;
        }


        // =================================================
        // DIPANGGIL DARI update-check.js
        // =================================================

        @android.webkit.JavascriptInterface
        public void downloadApk(
                String url,
                String version
        ) {

            activity.runOnUiThread(
                    () -> {

                        String fileName =
                                "Keuangan-v"
                                        + version
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
                    DownloadManager.Request
                            .VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            );


            request.setAllowedOverMetered(true);

            request.setAllowedOverRoaming(true);


            request.setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS,
                    fileName
            );


            DownloadManager manager =
                    (DownloadManager)
                            getSystemService(
                                    Context.DOWNLOAD_SERVICE
                            );


            if (manager != null) {

                manager.enqueue(request);

                android.widget.Toast.makeText(
                        this,
                        "Update sedang diunduh...",
                        android.widget.Toast.LENGTH_LONG
                ).show();

            }

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
    // CLEANUP
    // =====================================================

    @Override
    protected void onDestroy() {

        if (webView != null) {

            webView.stopLoading();

            webView.clearHistory();

            webView.clearCache(false);

            webView.destroy();
        }

        super.onDestroy();
    }
}

package com.catatankas.app;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
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
                            WebResourceRequest request) {
                        return assetLoader.shouldInterceptRequest(
                                request.getUrl()
                        );
                    }
                    @Override
                    public boolean shouldOverrideUrlLoading(
                            WebView view,
                            WebResourceRequest request) {
                        Uri uri = request.getUrl();
                        if (uri == null) {
                            return false;
                        }
                        String url =
                                uri.toString().toLowerCase();
                        // ==================================
                        // LINK UPDATE / GITHUB / APK
                        // ==================================
                        if (
                                url.contains("github.com") ||
                                url.contains("githubusercontent.com") ||
                                url.endsWith(".apk")
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
                                startActivity(intent);
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                            return true;
                        }
                        // ==================================
                        // LINK EKSTERNAL LAINNYA
                        // ==================================
                        if (
                                !url.startsWith(
                                        "https://appassets.androidplatform.net/"
                                ) &&
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
        // LOAD APLIKASI UTAMA
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
                        if (webView.canGoBack()) {
                            webView.goBack();
                        } else {
                            finish();
                        }
                    }
                }
        );
    }
    // ==============================================
    // MEMBERSIHKAN WEBVIEW SAAT ACTIVITY DITUTUP
    // ==============================================
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

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
        final WebViewAssetLoader assetLoader =
                new WebViewAssetLoader.Builder()
                        .addPathHandler(
                                "/assets/",
                                new WebViewAssetLoader.AssetsPathHandler(this)
                        )
                        .build();
        webView.setWebViewClient(
                new WebViewClientCompat() {
                    @Override
                    public WebResourceResponse shouldInterceptRequest(
                            WebView view,
                            WebResourceRequest request) {
                        return assetLoader
                                .shouldInterceptRequest(
                                        request.getUrl()
                                );
                    }
                    @Override
                    public boolean shouldOverrideUrlLoading(
                            WebView view,
                            WebResourceRequest request) {
                        Uri uri = request.getUrl();
                        String url = uri.toString();
                        /*
                         * Link APK / GitHub / link eksternal
                         * dibuka menggunakan browser Android.
                         */
                        if (
                                url.startsWith("https://github.com/") ||
                                url.startsWith("http://github.com/") ||
                                url.startsWith("https://raw.githubusercontent.com/") ||
                                url.startsWith("http://raw.githubusercontent.com/")
                        ) {
                            Intent intent =
                                    new Intent(
                                            Intent.ACTION_VIEW,
                                            uri
                                    );
                            try {
                                startActivity(intent);
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                            return true;
                        }
                        /*
                         * Link eksternal lainnya juga dibuka
                         * melalui browser Android.
                         */
                        if (
                                url.startsWith("http://") ||
                                url.startsWith("https://")
                        ) {
                            Intent intent =
                                    new Intent(
                                            Intent.ACTION_VIEW,
                                            uri
                                    );
                            try {
                                startActivity(intent);
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                            return true;
                        }
                        /*
                         * Link internal aplikasi tetap
                         * dibuka di dalam WebView.
                         */
                        return false;
                    }
                }
        );
        /*
         * Memuat halaman utama aplikasi.
         */
        webView.loadUrl(
                "https://appassets.androidplatform.net/assets/index.html"
        );
        /*
         * Tombol Back Android.
         */
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
}

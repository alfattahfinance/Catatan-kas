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
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
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
    private static final int FILE_CHOOSER_REQUEST = 4101;
    protected WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private DownloadManager downloadManager;
    private long downloadId = -1;
    private File pendingApkFile;
    private boolean waitingInstallPermission = false;
    private BroadcastReceiver downloadReceiver;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        downloadManager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
        webView = new WebView(this);
        webView.setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        getWindow().setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
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
        settings.setUseWideViewPort(false);
        settings.setLoadWithOverviewMode(false);

        webView.setBackgroundColor(android.graphics.Color.TRANSPARENT);
        webView.addJavascriptInterface(new AndroidDownload(), "AndroidDownload");

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) { return assetLoader.shouldInterceptRequest(request.getUrl()); }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri == null) return false;
                String url = uri.toString().toLowerCase();
                if (url.contains("github.com") || url.contains("githubusercontent.com") || url.endsWith(".apk")) { openExternalUrl(uri); return true; }
                if (!url.startsWith("https://appassets.androidplatform.net/") && !url.startsWith("http://appassets.androidplatform.net/")) { openExternalUrl(uri); return true; }
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false);
                try { startActivityForResult(intent, FILE_CHOOSER_REQUEST); return true; }
                catch (Exception error) { filePathCallback = null; return false; }
            }
        });

        registerDownloadReceiver();
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() { if (webView != null && webView.canGoBack()) webView.goBack(); else finish(); }
        });
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || filePathCallback == null) return;
        Uri[] results = null;
        if (resultCode == RESULT_OK && data != null && data.getData() != null) results = new Uri[]{data.getData()};
        filePathCallback.onReceiveValue(results); filePathCallback = null;
    }

    @Override protected void onResume() {
        super.onResume();
        if (waitingInstallPermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && getPackageManager().canRequestPackageInstalls()) {
            waitingInstallPermission = false;
            if (pendingApkFile != null) installApk(pendingApkFile);
        }
    }

    public class AndroidDownload {
        @JavascriptInterface public void downloadApk(String apkUrl, String version) { runOnUiThread(() -> startApkDownload(apkUrl, version)); }
    }
    private void startApkDownload(String apkUrl, String version) {
        try {
            if (apkUrl == null || apkUrl.trim().isEmpty()) { showMessage("URL APK tidak valid."); return; }
            String cleanVersion = cleanVersion(version); if (cleanVersion.isEmpty()) cleanVersion = "latest";
            String fileName = "Keuangan-v" + cleanVersion + ".apk"; deleteOldApk(fileName);
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(apkUrl));
            request.addRequestHeader("User-Agent", "Mozilla/5.0 Android CatatanKas"); request.setTitle("Update Keuangan v" + cleanVersion);
            request.setDescription("Mengunduh aplikasi Keuangan v" + cleanVersion); request.setMimeType("application/vnd.android.package-archive");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, fileName);
            downloadId = downloadManager.enqueue(request);
            File directory = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS); if (directory != null) pendingApkFile = new File(directory, fileName);
        } catch (Exception error) { error.printStackTrace(); showMessage("Gagal memulai download APK."); }
    }
    private void registerDownloadReceiver() {
        downloadReceiver = new BroadcastReceiver() {
            @Override public void onReceive(Context context, Intent intent) {
                if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) return;
                long completedId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (completedId == downloadId) checkDownloadResult(completedId);
            }
        };
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) registerReceiver(downloadReceiver, filter, Context.RECEIVER_EXPORTED);
        else registerReceiver(downloadReceiver, filter);
    }
    private void checkDownloadResult(long completedId) {
        try {
            DownloadManager.Query query = new DownloadManager.Query().setFilterById(completedId);
            android.database.Cursor cursor = downloadManager.query(query);
            if (cursor == null || !cursor.moveToFirst()) { showMessage("Status download tidak ditemukan."); return; }
            int statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS), reasonIndex = cursor.getColumnIndex(DownloadManager.COLUMN_REASON), localUriIndex = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);
            int status = statusIndex >= 0 ? cursor.getInt(statusIndex) : -1; int reason = reasonIndex >= 0 ? cursor.getInt(reasonIndex) : 0; String localUri = localUriIndex >= 0 ? cursor.getString(localUriIndex) : null; cursor.close();
            if (status == DownloadManager.STATUS_SUCCESSFUL) { if (pendingApkFile == null || !pendingApkFile.exists()) pendingApkFile = resolveDownloadedFile(localUri); if (pendingApkFile != null && pendingApkFile.exists()) installApk(pendingApkFile); else showMessage("APK berhasil diunduh, tetapi file tidak ditemukan."); }
            else if (status == DownloadManager.STATUS_FAILED) showMessage("Download APK gagal. Kode: " + reason);
        } catch (Exception error) { error.printStackTrace(); showMessage("Terjadi kesalahan saat memeriksa download."); }
    }
    private File resolveDownloadedFile(String localUri) { try { if (localUri != null && localUri.startsWith("file://")) { String path = Uri.parse(localUri).getPath(); if (path != null) return new File(path); } } catch (Exception ignored) {} return null; }
    private void installApk(File apkFile) {
        if (apkFile == null || !apkFile.exists()) { showMessage("File APK tidak ditemukan."); return; }
        pendingApkFile = apkFile;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getPackageManager().canRequestPackageInstalls()) { waitingInstallPermission = true; try { startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()))); showMessage("Aktifkan izin Install aplikasi tidak dikenal."); } catch (Exception ignored) { showMessage("Silakan aktifkan izin Install aplikasi tidak dikenal."); } return; }
        try {
            Uri apkUri = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N ? FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", apkFile) : Uri.fromFile(apkFile);
            Intent intent = new Intent(Intent.ACTION_VIEW); intent.setDataAndType(apkUri, "application/vnd.android.package-archive"); intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(intent);
        } catch (Exception error) { error.printStackTrace(); showMessage("Tidak dapat membuka installer APK."); }
    }
    private void deleteOldApk(String fileName) { try { File directory = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS); if (directory != null) { File oldFile = new File(directory, fileName); if (oldFile.exists()) oldFile.delete(); } } catch (Exception ignored) {} }
    private void openExternalUrl(Uri uri) { try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) { showMessage("Tidak dapat membuka tautan."); } }
    private String cleanVersion(String version) { return version == null ? "" : version.replaceAll("[^0-9A-Za-z._-]", "").trim(); }
    private void showMessage(String message) { runOnUiThread(() -> android.widget.Toast.makeText(MainActivity.this, message, android.widget.Toast.LENGTH_LONG).show()); }
    @Override protected void onDestroy() { if (downloadReceiver != null) { try { unregisterReceiver(downloadReceiver); } catch (Exception ignored) {} } if (filePathCallback != null) { filePathCallback.onReceiveValue(null); filePathCallback = null; } if (webView != null) { webView.stopLoading(); webView.destroy(); } super.onDestroy(); }
}

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
    private static final int FILE_CHOOSER_REQUEST=4101; protected WebView webView; private ValueCallback<Uri[]> filePathCallback; private DownloadManager downloadManager; private long downloadId=-1; private File pendingApkFile; private boolean waitingInstallPermission=false; private BroadcastReceiver downloadReceiver;
    @SuppressLint("SetJavaScriptEnabled") @Override protected void onCreate(Bundle savedInstanceState){super.onCreate(savedInstanceState);getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.rgb(18,23,22)));downloadManager=(DownloadManager)getSystemService(Context.DOWNLOAD_SERVICE);webView=new WebView(this);webView.setLayoutParams(new ViewGroup.LayoutParams(-1,-1));getWindow().setLayout(WindowManager.LayoutParams.MATCH_PARENT,WindowManager.LayoutParams.MATCH_PARENT);setContentView(webView);
      WebSettings settings=webView.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setDatabaseEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(true);settings.setBuiltInZoomControls(false);settings.setDisplayZoomControls(false);settings.setSupportZoom(false);settings.setMediaPlaybackRequiresUserGesture(false);settings.setJavaScriptCanOpenWindowsAutomatically(true);settings.setUseWideViewPort(false);settings.setLoadWithOverviewMode(false);
      // Tetap gunakan latar native gelap saat dokumen baru dimuat agar tidak ada frame putih sebelum CSS tema aktif.
      webView.setBackgroundColor(android.graphics.Color.rgb(18,23,22));
      webView.addJavascriptInterface(new AndroidDownload(),"AndroidDownload");
      final WebViewAssetLoader assetLoader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();webView.setWebViewClient(new WebViewClientCompat(){@Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){return assetLoader.shouldInterceptRequest(r.getUrl());}@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri u=r.getUrl();if(u==null)return false;String url=u.toString().toLowerCase();if(url.contains("github.com")||url.contains("githubusercontent.com")||url.endsWith(".apk")){openExternalUrl(u);return true}if(!url.startsWith("https://appassets.androidplatform.net/")&&!url.startsWith("http://appassets.androidplatform.net/")){openExternalUrl(u);return true}return false;}});
      webView.setWebChromeClient(new WebChromeClient(){@Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){if(filePathCallback!=null)filePathCallback.onReceiveValue(null);filePathCallback=callback;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("image/*");i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,false);try{startActivityForResult(i,FILE_CHOOSER_REQUEST);return true}catch(Exception e){filePathCallback=null;return false}}});registerDownloadReceiver();webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");getOnBackPressedDispatcher().addCallback(this,new OnBackPressedCallback(true){@Override public void handleOnBackPressed(){if(webView!=null&&webView.canGoBack())webView.goBack();else finish();}});

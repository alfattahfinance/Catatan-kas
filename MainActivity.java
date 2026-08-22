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
      WebSettings settings=webView.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setDatabaseEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(true);settings.setBuiltInZoomControls(false);settings.setDisplayZoomControls(false);settings.setSupportZoom(false);settings.setMediaPlaybackRequiresUserGesture(false);settings.setJavaScriptCanOpenWindowsAutomatically(true);settings.setUseWideViewPort(false);settings.setLoadWithOverviewMode(false);webView.setBackgroundColor(android.graphics.Color.rgb(18,23,22));webView.addJavascriptInterface(new AndroidDownload(),"AndroidDownload");
      final WebViewAssetLoader assetLoader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();webView.setWebViewClient(new WebViewClientCompat(){@Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){return assetLoader.shouldInterceptRequest(r.getUrl());}@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri u=r.getUrl();if(u==null)return false;String url=u.toString().toLowerCase();if(url.contains("github.com")||url.contains("githubusercontent.com")||url.endsWith(".apk")){openExternalUrl(u);return true}if(!url.startsWith("https://appassets.androidplatform.net/")&&!url.startsWith("http://appassets.androidplatform.net/")){openExternalUrl(u);return true}return false;}});
      webView.setWebChromeClient(new WebChromeClient(){@Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){if(filePathCallback!=null)filePathCallback.onReceiveValue(null);filePathCallback=callback;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("image/*");i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,false);try{startActivityForResult(i,FILE_CHOOSER_REQUEST);return true}catch(Exception e){filePathCallback=null;return false}}});registerDownloadReceiver();webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");getOnBackPressedDispatcher().addCallback(this,new OnBackPressedCallback(true){@Override public void handleOnBackPressed(){if(webView!=null&&webView.canGoBack())webView.goBack();else finish();}});
    }
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){super.onActivityResult(requestCode,resultCode,data);if(requestCode!=FILE_CHOOSER_REQUEST||filePathCallback==null)return;Uri[] results=null;if(resultCode==RESULT_OK&&data!=null&&data.getData()!=null)results=new Uri[]{data.getData()};filePathCallback.onReceiveValue(results);filePathCallback=null;}
    @Override protected void onResume(){super.onResume();if(waitingInstallPermission&&Build.VERSION.SDK_INT>=Build.VERSION_CODES.O&&getPackageManager().canRequestPackageInstalls()){waitingInstallPermission=false;if(pendingApkFile!=null)installApk(pendingApkFile);}}
    public class AndroidDownload{@JavascriptInterface public void downloadApk(String apkUrl,String version){runOnUiThread(()->startApkDownload(apkUrl,version));}}
    private void startApkDownload(String apkUrl,String version){try{if(apkUrl==null||apkUrl.trim().isEmpty()){showMessage("URL APK tidak valid.");return}String v=cleanVersion(version);if(v.isEmpty())v="latest";String fileName="Keuangan-v"+v+".apk";deleteOldApk(fileName);DownloadManager.Request request=new DownloadManager.Request(Uri.parse(apkUrl));request.addRequestHeader("User-Agent","Mozilla/5.0 Android CatatanKas");request.setTitle("Update Keuangan v"+v);request.setDescription("Mengunduh aplikasi Keuangan v"+v);request.setMimeType("application/vnd.android.package-archive");request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);request.setDestinationInExternalFilesDir(this,Environment.DIRECTORY_DOWNLOADS,fileName);downloadId=downloadManager.enqueue(request);File dir=getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);if(dir!=null)pendingApkFile=new File(dir,fileName);}catch(Exception e){e.printStackTrace();showMessage("Gagal memulai download APK.");}}
    private void registerDownloadReceiver(){downloadReceiver=new BroadcastReceiver(){@Override public void onReceive(Context c,Intent i){if(!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(i.getAction()))return;long id=i.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID,-1);if(id==downloadId)checkDownloadResult(id);}};IntentFilter f=new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.TIRAMISU)registerReceiver(downloadReceiver,f,Context.RECEIVER_EXPORTED);else registerReceiver(downloadReceiver,f);}
    private void checkDownloadResult(long id){try{DownloadManager.Query q=new DownloadManager.Query().setFilterById(id);android.database.Cursor c=downloadManager.query(q);if(c==null||!c.moveToFirst()){showMessage("Status download tidak ditemukan.");return}int si=c.getColumnIndex(DownloadManager.COLUMN_STATUS),ri=c.getColumnIndex(DownloadManager.COLUMN_REASON),ui=c.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);int status=si>=0?c.getInt(si):-1,reason=ri>=0?c.getInt(ri):0;String uri=ui>=0?c.getString(ui):null;c.close();if(status==DownloadManager.STATUS_SUCCESSFUL){if(pendingApkFile==null||!pendingApkFile.exists())pendingApkFile=resolveDownloadedFile(uri);if(pendingApkFile!=null&&pendingApkFile.exists())installApk(pendingApkFile);else showMessage("APK berhasil diunduh, tetapi file tidak ditemukan.");}else if(status==DownloadManager.STATUS_FAILED)showMessage("Download APK gagal. Kode: "+reason);}catch(Exception e){e.printStackTrace();showMessage("Terjadi kesalahan saat memeriksa download.");}}
    private File resolveDownloadedFile(String uri){try{if(uri!=null&&uri.startsWith("file://")){String p=Uri.parse(uri).getPath();if(p!=null)return new File(p);}}catch(Exception ignored){}return null}
    private void installApk(File f){if(f==null||!f.exists()){showMessage("File APK tidak ditemukan.");return}pendingApkFile=f;if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.O&&!getPackageManager().canRequestPackageInstalls()){waitingInstallPermission=true;try{startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+getPackageName())));showMessage("Aktifkan izin Install aplikasi tidak dikenal.");}catch(Exception ignored){showMessage("Silakan aktifkan izin Install aplikasi tidak dikenal.");}return}try{Uri u=Build.VERSION.SDK_INT>=Build.VERSION_CODES.N?FileProvider.getUriForFile(this,getPackageName()+".fileprovider",f):Uri.fromFile(f);Intent i=new Intent(Intent.ACTION_VIEW);i.setDataAndType(u,"application/vnd.android.package-archive");i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_ACTIVITY_NEW_TASK);startActivity(i);}catch(Exception e){e.printStackTrace();showMessage("Tidak dapat membuka installer APK.");}}
    private void deleteOldApk(String n){try{File d=getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);if(d!=null){File f=new File(d,n);if(f.exists())f.delete();}}catch(Exception ignored){}}
    private void openExternalUrl(Uri u){try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){showMessage("Tidak dapat membuka tautan.");}}
    private String cleanVersion(String v){return v==null?"":v.replaceAll("[^0-9A-Za-z._-]","").trim();}private void showMessage(String m){runOnUiThread(()->android.widget.Toast.makeText(MainActivity.this,m,android.widget.Toast.LENGTH_LONG).show());}
    @Override protected void onDestroy(){if(downloadReceiver!=null){try{unregisterReceiver(downloadReceiver);}catch(Exception ignored){}}if(filePathCallback!=null){filePathCallback.onReceiveValue(null);filePathCallback=null;}if(webView!=null){webView.stopLoading();webView.destroy();}super.onDestroy();}
}

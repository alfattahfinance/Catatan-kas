package com.catatankas.app;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.File;

public class MainActivity extends AppCompatActivity {
    private static final int FILE_CHOOSER_REQUEST=4101;
    protected WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private DownloadManager downloadManager;
    private long downloadId=-1;
    private File pendingApkFile;
    private boolean waitingInstallPermission=false;
    private BroadcastReceiver downloadReceiver;
    private FrameLayout root;
    private View splashView;
    private ProgressBar splashProgress;
    private TextView splashStatus;
    private final Handler splashHandler=new Handler(Looper.getMainLooper());

    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.rgb(18,23,22)));
        getWindow().setLayout(WindowManager.LayoutParams.MATCH_PARENT,WindowManager.LayoutParams.MATCH_PARENT);
        downloadManager=(DownloadManager)getSystemService(Context.DOWNLOAD_SERVICE);

        root=new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(18,23,22));
        webView=new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(-1,-1));
        root.addView(webView);
        setContentView(root);
        webView.setVisibility(View.INVISIBLE);
        setupSplash();

        WebSettings settings=webView.getSettings();
        settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);settings.setAllowContentAccess(true);settings.setBuiltInZoomControls(false);settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);settings.setMediaPlaybackRequiresUserGesture(false);settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setUseWideViewPort(false);settings.setLoadWithOverviewMode(false);
        webView.setBackgroundColor(Color.rgb(18,23,22));
        webView.addJavascriptInterface(new AndroidDownload(),"AndroidDownload");
        final WebViewAssetLoader assetLoader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView.setWebViewClient(new WebViewClientCompat(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){return assetLoader.shouldInterceptRequest(r.getUrl());}
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri u=r.getUrl();if(u==null)return false;String url=u.toString().toLowerCase();if(url.contains("github.com")||url.contains("githubusercontent.com")||url.endsWith(".apk")){openExternalUrl(u);return true}if(!url.startsWith("https://appassets.androidplatform.net/")&&!url.startsWith("http://appassets.androidplatform.net/")){openExternalUrl(u);return true}return false;}
        });
        webView.setWebChromeClient(new WebChromeClient(){@Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){if(filePathCallback!=null)filePathCallback.onReceiveValue(null);filePathCallback=callback;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("image/*");i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,false);try{startActivityForResult(i,FILE_CHOOSER_REQUEST);return true}catch(Exception e){filePathCallback=null;return false}}});
        registerDownloadReceiver();
        getOnBackPressedDispatcher().addCallback(this,new OnBackPressedCallback(true){@Override public void handleOnBackPressed(){if(webView!=null&&webView.getVisibility()==View.VISIBLE&&webView.canGoBack())webView.goBack();else if(splashView!=null&&splashView.getVisibility()==View.VISIBLE){}else finish();}});

        splashHandler.postDelayed(()->{webView.setVisibility(View.VISIBLE);if(splashView!=null){root.removeView(splashView);splashView=null;}webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");},1450);
    }

    private void setupSplash(){
        splashView=new LinearLayout(this);
        LinearLayout box=(LinearLayout)splashView;
        box.setOrientation(LinearLayout.VERTICAL);box.setGravity(Gravity.CENTER_HORIZONTAL);box.setPadding(dp(34),dp(28),dp(34),dp(28));
        GradientDrawable bg=new GradientDrawable(GradientDrawable.Orientation.TL_BR,new int[]{Color.rgb(18,55,45),Color.rgb(27,39,35)});bg.setCornerRadius(dp(22));box.setBackground(bg);
        FrameLayout.LayoutParams lp=new FrameLayout.LayoutParams(-1,-2,Gravity.CENTER);lp.setMargins(dp(28),dp(28),dp(28),dp(28));root.addView(splashView,lp);

        TextView mark=new TextView(this);mark.setText("✓");mark.setGravity(Gravity.CENTER);mark.setTextColor(Color.WHITE);mark.setTextSize(28);mark.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        GradientDrawable markBg=new GradientDrawable();markBg.setShape(GradientDrawable.OVAL);markBg.setColor(Color.rgb(25,135,84));mark.setBackground(markBg);
        LinearLayout.LayoutParams mlp=new LinearLayout.LayoutParams(dp(62),dp(62));mlp.gravity=Gravity.CENTER_HORIZONTAL;box.addView(mark,mlp);

        TextView title=new TextView(this);title.setText("Keuangan");title.setTextColor(Color.WHITE);title.setTextSize(25);title.setTypeface(Typeface.DEFAULT,Typeface.BOLD);title.setGravity(Gravity.CENTER);title.setPadding(0,dp(14),0,0);box.addView(title,new LinearLayout.LayoutParams(-1,-2));
        TextView subtitle=new TextView(this);subtitle.setText("Kelola keuangan lebih mudah");subtitle.setTextColor(Color.rgb(195,215,205));subtitle.setTextSize(12);subtitle.setGravity(Gravity.CENTER);subtitle.setPadding(0,dp(3),0,dp(18));box.addView(subtitle,new LinearLayout.LayoutParams(-1,-2));
        splashStatus=new TextView(this);splashStatus.setText("Menyiapkan aplikasi...");splashStatus.setTextColor(Color.rgb(220,230,225));splashStatus.setTextSize(11);splashStatus.setGravity(Gravity.CENTER);box.addView(splashStatus,new LinearLayout.LayoutParams(-1,-2));
        splashProgress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);splashProgress.setMax(100);splashProgress.setProgress(0);splashProgress.setIndeterminate(false);splashProgress.setPadding(0,0,0,0);LinearLayout.LayoutParams plp=new LinearLayout.LayoutParams(-1,dp(7));plp.topMargin=dp(10);box.addView(splashProgress,plp);
        splashHandler.postDelayed(()->splashProgress.setProgress(30),220);splashHandler.postDelayed(()->{splashProgress.setProgress(60);splashStatus.setText("Memuat antarmuka...");},620);splashHandler.postDelayed(()->{splashProgress.setProgress(85);splashStatus.setText("Menyiapkan data...");},980);splashHandler.postDelayed(()->{splashProgress.setProgress(100);splashStatus.setText("Hampir siap...");},1250);
    }
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}

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
    private String cleanVersion(String v){return v==null?"":v.replaceAll("[^0-9A-Za-z._-]","").trim();}private void showMessage(String m){runOnUiThread(()->Toast.makeText(MainActivity.this,m,Toast.LENGTH_LONG).show());}
    @Override protected void onDestroy(){if(downloadReceiver!=null){try{unregisterReceiver(downloadReceiver);}catch(Exception ignored){}}splashHandler.removeCallbacksAndMessages(null);if(filePathCallback!=null){filePathCallback.onReceiveValue(null);filePathCallback=null;}if(webView!=null){webView.stopLoading();webView.destroy();}super.onDestroy();}
}

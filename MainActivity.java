package com.catatankas.app;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.File;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Locale;

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
    private final android.os.Handler splashHandler=new android.os.Handler(android.os.Looper.getMainLooper());

    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.rgb(18,23,22)));
        getWindow().setLayout(WindowManager.LayoutParams.MATCH_PARENT,WindowManager.LayoutParams.MATCH_PARENT);
        downloadManager=(DownloadManager)getSystemService(Context.DOWNLOAD_SERVICE);
        root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(18,23,22));
        webView=new WebView(this);webView.setLayoutParams(new FrameLayout.LayoutParams(-1,-1));root.addView(webView);setContentView(root);
        webView.setVisibility(View.INVISIBLE);setupSplash();
        WebSettings settings=webView.getSettings();
        settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);settings.setAllowContentAccess(true);settings.setBuiltInZoomControls(false);settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);settings.setMediaPlaybackRequiresUserGesture(false);settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setUseWideViewPort(false);settings.setLoadWithOverviewMode(false);
        webView.setBackgroundColor(Color.rgb(18,23,22));webView.setVerticalScrollBarEnabled(true);webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        webView.addJavascriptInterface(new AndroidDownload(),"AndroidDownload");
        final WebViewAssetLoader assetLoader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView.setWebViewClient(new WebViewClientCompat(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){return assetLoader.shouldInterceptRequest(r.getUrl());}
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri u=r.getUrl();if(u==null)return false;String url=u.toString().toLowerCase(Locale.ROOT);if(url.contains("github.com")||url.contains("githubusercontent.com")||url.endsWith(".apk")){openExternalUrl(u);return true}if(!url.startsWith("https://appassets.androidplatform.net/")&&!url.startsWith("http://appassets.androidplatform.net/")){openExternalUrl(u);return true}return false;}
            @Override public void onPageFinished(WebView v,String url){super.onPageFinished(v,url);v.evaluateJavascript("(function(){try{var s=document.getElementById('ckLandscapeScrollFix');if(!s){s=document.createElement('style');s.id='ckLandscapeScrollFix';s.textContent='html,body{overflow-y:auto!important;height:auto!important;min-height:100%!important;}body{overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;}';document.head.appendChild(s)}}catch(e){}})();}
        });
        webView.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){
                return openFileChooser(callback,params);
            }
            @SuppressWarnings("unused")
            public void openFileChooser(ValueCallback<Uri> callback,String acceptType,String capture){
                ValueCallback<Uri[]> modern=uris->{if(callback!=null)callback.onReceiveValue(uris!=null&&uris.length>0?uris[0]:null);};
                openFileChooser(modern,acceptType);
            }
            @SuppressWarnings("unused")
            public void openFileChooser(ValueCallback<Uri> callback,String acceptType){
                ValueCallback<Uri[]> modern=uris->{if(callback!=null)callback.onReceiveValue(uris!=null&&uris.length>0?uris[0]:null);};
                openFileChooser(modern,acceptType);
            }
            private boolean openFileChooser(ValueCallback<Uri[]> callback,FileChooserParams params){
                String[] accepts=params!=null?params.getAcceptTypes():null;
                return startNativeFilePicker(callback,flattenAcceptTypes(accepts));
            }
            private boolean openFileChooser(ValueCallback<Uri[]> callback,String acceptType){
                return startNativeFilePicker(callback,flattenAcceptTypes(new String[]{acceptType}));
            }
        });
        registerDownloadReceiver();
        getOnBackPressedDispatcher().addCallback(this,new OnBackPressedCallback(true){@Override public void handleOnBackPressed(){if(webView!=null&&webView.getVisibility()==View.VISIBLE&&webView.canGoBack())webView.goBack();else if(splashView!=null&&splashView.getVisibility()==View.VISIBLE){}else finish();}});
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
        splashHandler.postDelayed(()->{webView.setVisibility(View.VISIBLE);if(splashView!=null)splashView.animate().alpha(0f).setDuration(420).withEndAction(()->{if(splashView!=null){root.removeView(splashView);splashView=null;}}).start();},1450);
    }

    private String[] flattenAcceptTypes(String[] accepts){
        if(accepts==null||accepts.length==0)return new String[0];
        ArrayList<String> out=new ArrayList<>();
        for(String raw:accepts){
            if(raw==null)continue;
            for(String part:raw.split(",")){
                String x=part.trim().toLowerCase(Locale.ROOT);
                if(!x.isEmpty()&&!out.contains(x))out.add(x);
            }
        }
        return out.toArray(new String[0]);
    }

    private boolean startNativeFilePicker(ValueCallback<Uri[]> callback,String[] accepts){
        if(filePathCallback!=null)filePathCallback.onReceiveValue(null);
        filePathCallback=callback;
        boolean imageOnly=accepts.length>0;
        boolean hasUsableMime=false;
        ArrayList<String> mimeTypes=new ArrayList<>();
        for(String a:accepts){
            String x=a.toLowerCase(Locale.ROOT);
            if(x.startsWith("image/")){hasUsableMime=true;if(!mimeTypes.contains(x))mimeTypes.add(x);}
            else if(x.contains("/")){hasUsableMime=true;if(!mimeTypes.contains(x))mimeTypes.add(x);imageOnly=false;}
            else if(x.equals(".jpg")||x.equals(".jpeg")||x.equals(".png")||x.equals(".webp")||x.equals(".gif")||x.equals(".bmp")){hasUsableMime=true;}
            else if(x.equals(".xlsx")||x.equals(".xls")||x.equals(".csv")||x.equals(".txt")){imageOnly=false;}
            else imageOnly=false;
        }
        if(!hasUsableMime&&accepts.length>0)imageOnly=false;
        String mime=imageOnly?"image/*":"*/*";
        Intent intent=new Intent(Intent.ACTION_GET_CONTENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mime);
        if(!mimeTypes.isEmpty()&&!imageOnly)intent.putExtra(Intent.EXTRA_MIME_TYPES,mimeTypes.toArray(new String[0]));
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,false);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        try{startActivityForResult(Intent.createChooser(intent,"Pilih file"),FILE_CHOOSER_REQUEST);return true;}
        catch(Exception first){
            try{
                Intent fallback=new Intent(Intent.ACTION_OPEN_DOCUMENT);
                fallback.addCategory(Intent.CATEGORY_OPENABLE);fallback.setType(mime);
                if(!mimeTypes.isEmpty()&&!imageOnly)fallback.putExtra(Intent.EXTRA_MIME_TYPES,mimeTypes.toArray(new String[0]));
                fallback.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,false);fallback.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                startActivityForResult(Intent.createChooser(fallback,"Pilih file"),FILE_CHOOSER_REQUEST);return true;
            }catch(Exception second){filePathCallback=null;showMessage("Pemilih file tidak tersedia di perangkat ini.");return false;}
        }
    }

    private void setupSplash(){
        final int teal=Color.rgb(37,103,93);
        splashView=new FrameLayout(this);splashView.setBackgroundColor(teal);root.addView(splashView,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);content.setGravity(Gravity.CENTER_HORIZONTAL);content.setPadding(dp(28),dp(28),dp(28),dp(28));
        FrameLayout.LayoutParams clp=new FrameLayout.LayoutParams(-1,-2,Gravity.CENTER);splashView.addView(content,clp);
        ImageView logo=new ImageView(this);logo.setScaleType(ImageView.ScaleType.CENTER_CROP);logo.setBackgroundColor(Color.TRANSPARENT);try(InputStream in=getAssets().open("logo-catatan-kas.jpg")){Bitmap b=BitmapFactory.decodeStream(in);if(b!=null)logo.setImageBitmap(b);}catch(Exception ignored){}
        GradientDrawable logoFrame=new GradientDrawable();logoFrame.setColor(Color.TRANSPARENT);logoFrame.setCornerRadius(dp(34));logoFrame.setStroke(dp(1),Color.argb(45,255,255,255));logo.setBackground(logoFrame);logo.setClipToOutline(true);
        LinearLayout.LayoutParams ilp=new LinearLayout.LayoutParams(dp(190),dp(190));ilp.gravity=Gravity.CENTER_HORIZONTAL;content.addView(logo,ilp);
        TextView title=new TextView(this);title.setText("Keuangan");title.setTextColor(Color.WHITE);title.setTextSize(27);title.setTypeface(Typeface.DEFAULT,Typeface.BOLD);title.setGravity(Gravity.CENTER);title.setPadding(0,dp(22),0,0);content.addView(title,new LinearLayout.LayoutParams(-1,-2));
        TextView subtitle=new TextView(this);subtitle.setText("Catatan keuangan lebih mudah");subtitle.setTextColor(Color.rgb(224,246,240));subtitle.setTextSize(13);subtitle.setGravity(Gravity.CENTER);subtitle.setPadding(0,dp(6),0,0);content.addView(subtitle,new LinearLayout.LayoutParams(-1,-2));
        content.setAlpha(0f);logo.setAlpha(0f);logo.setScaleX(.78f);logo.setScaleY(.78f);title.setAlpha(0f);subtitle.setAlpha(0f);
        logo.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(650).setInterpolator(new android.view.animation.OvershootInterpolator(1.2f)).start();content.animate().alpha(1f).setStartDelay(120).setDuration(500).start();title.animate().alpha(1f).setStartDelay(360).setDuration(500).start();subtitle.animate().alpha(1f).setStartDelay(520).setDuration(500).start();
    }
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode!=FILE_CHOOSER_REQUEST||filePathCallback==null)return;
        Uri[] results=null;
        if(resultCode==RESULT_OK&&data!=null){
            if(data.getClipData()!=null&&data.getClipData().getItemCount()>0)results=new Uri[]{data.getClipData().getItemAt(0).getUri()};
            else if(data.getData()!=null)results=new Uri[]{data.getData()};
        }
        ValueCallback<Uri[]> cb=filePathCallback;filePathCallback=null;cb.onReceiveValue(results);
    }
    @Override protected void onResume(){super.onResume();if(waitingInstallPermission&&Build.VERSION.SDK_INT>=Build.VERSION_CODES.O&&getPackageManager().canRequestPackageInstalls()){waitingInstallPermission=false;if(pendingApkFile!=null)installApk(pendingApkFile);}}
    public class AndroidDownload{@JavascriptInterface public void downloadApk(String apkUrl,String version){runOnUiThread(()->startApkDownload(apkUrl,version));}}
    private void startApkDownload(String apkUrl,String version){try{if(apkUrl==null||apkUrl.trim().isEmpty()){showMessage("URL APK tidak valid.");return}String v=cleanVersion(version);if(v.isEmpty())v="latest";String fileName="Keuangan-v"+v+".apk";deleteOldApk(fileName);DownloadManager.Request request=new DownloadManager.Request(Uri.parse(apkUrl));request.addRequestHeader("User-Agent","Mozilla/5.0 Android CatatanKas");request.setTitle("Update Keuangan v"+v);request.setDescription("Mengunduh aplikasi Keuangan v"+v);request.setMimeType("application/vnd.android.package-archive");request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);request.setDestinationInExternalFilesDir(this,Environment.DIRECTORY_DOWNLOADS,fileName);downloadId=downloadManager.enqueue(request);File dir=getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);if(dir!=null)pendingApkFile=new File(dir,fileName);}catch(Exception e){e.printStackTrace();showMessage("Gagal memulai download APK.");}}
    private void registerDownloadReceiver(){downloadReceiver=new BroadcastReceiver(){@Override public void onReceive(Context c,Intent i){if(!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(i.getAction()))return;long id=i.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID,-1);if(id==downloadId)checkDownloadResult(id);}};IntentFilter f=new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.TIRAMISU)registerReceiver(downloadReceiver,f,Context.RECEIVER_EXPORTED);else registerReceiver(downloadReceiver,f);}
    private void checkDownloadResult(long id){try{DownloadManager.Query q=new DownloadManager.Query().setFilterById(id);android.database.Cursor c=downloadManager.query(q);if(c==null||!c.moveToFirst()){showMessage("Status download tidak ditemukan.");return}int si=c.getColumnIndex(DownloadManager.COLUMN_STATUS),ri=c.getColumnIndex(DownloadManager.COLUMN_REASON),ui=c.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);int status=si>=0?c.getInt(si):-1,reason=ri>=0?c.getInt(ri):0,uriIndex=ui>=0?ui:-1;String uri=uriIndex>=0?c.getString(uriIndex):null;c.close();if(status==DownloadManager.STATUS_SUCCESSFUL){if(pendingApkFile==null||!pendingApkFile.exists())pendingApkFile=resolveDownloadedFile(uri);if(pendingApkFile!=null&&pendingApkFile.exists())installApk(pendingApkFile);else showMessage("APK berhasil diunduh, tetapi file tidak ditemukan.");}else if(status==DownloadManager.STATUS_FAILED)showMessage("Download APK gagal. Kode: "+reason);}catch(Exception e){e.printStackTrace();showMessage("Terjadi kesalahan saat memeriksa download.");}}
    private File resolveDownloadedFile(String uri){try{if(uri!=null&&uri.startsWith("file://")){String p=Uri.parse(uri).getPath();if(p!=null)return new File(p);}}catch(Exception ignored){}return null}
    private void installApk(File f){if(f==null||!f.exists()){showMessage("File APK tidak ditemukan.");return}pendingApkFile=f;if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.O&&!getPackageManager().canRequestPackageInstalls()){waitingInstallPermission=true;try{startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+getPackageName())));showMessage("Aktifkan izin Install aplikasi tidak dikenal.");}catch(Exception ignored){showMessage("Silakan aktifkan izin Install aplikasi tidak dikenal.");}return}try{Uri u=Build.VERSION.SDK_INT>=Build.VERSION_CODES.N?FileProvider.getUriForFile(this,getPackageName()+".fileprovider",f):Uri.fromFile(f);Intent i=new Intent(Intent.ACTION_VIEW);i.setDataAndType(u,"application/vnd.android.package-archive");i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_ACTIVITY_NEW_TASK);startActivity(i);}catch(Exception e){e.printStackTrace();showMessage("Tidak dapat membuka installer APK.");}}
    private void deleteOldApk(String n){try{File d=getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);if(d!=null){File f=new File(d,n);if(f.exists())f.delete();}}catch(Exception ignored){}}
    private void openExternalUrl(Uri u){try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){showMessage("Tidak dapat membuka tautan.");}}
    private String cleanVersion(String v){return v==null?"":v.replaceAll("[^0-9A-Za-z._-]","").trim();}private void showMessage(String m){runOnUiThread(()->Toast.makeText(MainActivity.this,m,Toast.LENGTH_LONG).show());}
    @Override protected void onDestroy(){if(downloadReceiver!=null){try{unregisterReceiver(downloadReceiver);}catch(Exception ignored){}}splashHandler.removeCallbacksAndMessages(null);if(filePathCallback!=null){filePathCallback.onReceiveValue(null);filePathCallback=null;}if(webView!=null){webView.stopLoading();webView.destroy();}super.onDestroy();}
}

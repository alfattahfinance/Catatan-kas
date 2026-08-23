package com.catatankas.app;

import android.annotation.SuppressLint;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import androidx.webkit.WebViewAssetLoader;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class UpdatableMainActivity extends MainActivity {
    private static final String MANIFEST_URL = "https://raw.githubusercontent.com/alfattahfinance/Catatan-kas/main/web-update.json";
    private static final String EMBEDDED_WEB_VERSION = "1.0.21";
    private static final int APP_BG = Color.rgb(36,102,92);
    private static final String EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private File webUpdateDir;
    private Uri lastExcelUri;

    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(APP_BG));
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP){
            getWindow().setStatusBarColor(APP_BG);
            getWindow().setNavigationBarColor(APP_BG);
        }
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.M){
            getWindow().getDecorView().setSystemUiVisibility(0);
        }
        showModernSplash();
        if(webView!=null){webView.setBackgroundColor(APP_BG);webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);}
        webUpdateDir=new File(getFilesDir(),"web_update");if(!webUpdateDir.exists())webUpdateDir.mkdirs();
        if(webView!=null)webView.addJavascriptInterface(new AndroidWebUpdater(),"AndroidWebUpdater");
        final WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new UpdatableAssetsPathHandler(this,webUpdateDir)).build();
        webView.setWebViewClient(new androidx.webkit.WebViewClientCompat(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,android.webkit.WebResourceRequest request){return loader.shouldInterceptRequest(request.getUrl());}
            @Override public boolean shouldOverrideUrlLoading(WebView view,android.webkit.WebResourceRequest request){Uri u=request.getUrl();if(u==null)return false;String x=u.toString().toLowerCase();if(!x.startsWith("https://appassets.androidplatform.net/")&&!x.startsWith("http://appassets.androidplatform.net/")){try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}return true;}return false;}
        });
    }

    private void showModernSplash(){
        if(webView==null)return;
        ViewParentCleaner.hideSiblingsExceptWebView(webView);
        webView.setVisibility(View.INVISIBLE);
        final ViewGroup rootGroup=(ViewGroup)webView.getParent();
        if(rootGroup==null)return;
        final android.widget.FrameLayout overlay=new android.widget.FrameLayout(this);
        overlay.setBackgroundColor(APP_BG);
        overlay.setSystemUiVisibility(0);
        rootGroup.addView(overlay,new android.widget.FrameLayout.LayoutParams(-1,-1));
        android.widget.LinearLayout content=new android.widget.LinearLayout(this);
        content.setOrientation(android.widget.LinearLayout.VERTICAL);
        content.setGravity(Gravity.CENTER_HORIZONTAL);
        content.setPadding(dpSplash(28),dpSplash(28),dpSplash(28),dpSplash(28));
        overlay.addView(content,new android.widget.FrameLayout.LayoutParams(-1,-2,Gravity.CENTER));
        android.widget.ImageView logo=new android.widget.ImageView(this);
        logo.setScaleType(android.widget.ImageView.ScaleType.FIT_CENTER);
        try(InputStream in=getAssets().open("logo-catatan-kas.jpg")){Bitmap b=BitmapFactory.decodeStream(in);if(b!=null)logo.setImageBitmap(b);}catch(Exception ignored){}
        int logoSize=Math.min(dpSplash(185),Math.max(dpSplash(135),Math.round(Math.min(getResources().getDisplayMetrics().widthPixels,getResources().getDisplayMetrics().heightPixels)*0.34f)));
        content.addView(logo,new android.widget.LinearLayout.LayoutParams(logoSize,logoSize));
        android.widget.TextView title=new android.widget.TextView(this);
        title.setText("Catatan Kas");title.setTextColor(Color.WHITE);title.setTextSize(27);title.setTypeface(android.graphics.Typeface.DEFAULT,android.graphics.Typeface.BOLD);title.setGravity(Gravity.CENTER);title.setPadding(0,dpSplash(18),0,0);
        content.addView(title,new android.widget.LinearLayout.LayoutParams(-1,-2));
        android.widget.TextView subtitle=new android.widget.TextView(this);
        subtitle.setText("Catatan keuangan lebih mudah");subtitle.setTextColor(Color.rgb(224,246,240));subtitle.setTextSize(13);subtitle.setGravity(Gravity.CENTER);subtitle.setPadding(0,dpSplash(7),0,0);
        content.addView(subtitle,new android.widget.LinearLayout.LayoutParams(-1,-2));
        content.setAlpha(0f);logo.setAlpha(0f);logo.setScaleX(.82f);logo.setScaleY(.82f);title.setAlpha(0f);subtitle.setAlpha(0f);
        android.view.animation.Interpolator smooth=new android.view.animation.DecelerateInterpolator(1.4f);
        logo.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(750).setInterpolator(new android.view.animation.OvershootInterpolator(1.05f)).start();
        content.animate().alpha(1f).setStartDelay(100).setDuration(650).setInterpolator(smooth).start();
        title.animate().alpha(1f).setStartDelay(300).setDuration(600).setInterpolator(smooth).start();
        subtitle.animate().alpha(1f).setStartDelay(480).setDuration(600).setInterpolator(smooth).start();
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(()->{
            webView.setVisibility(View.VISIBLE);
            webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
            overlay.animate().alpha(0f).setDuration(550).setInterpolator(smooth).withEndAction(()->rootGroup.removeView(overlay)).start();
        },3100);
    }
    private int dpSplash(int n){return Math.round(n*getResources().getDisplayMetrics().density);}

    private static class ViewParentCleaner{
        static void hideSiblingsExceptWebView(WebView web){try{android.view.ViewParent p=web.getParent();if(p instanceof ViewGroup){ViewGroup g=(ViewGroup)p;for(int i=g.getChildCount()-1;i>=0;i--){View c=g.getChildAt(i);if(c!=web)c.setVisibility(View.GONE);}}}catch(Exception ignored){}}
    }

    public class AndroidWebUpdater {
        @JavascriptInterface public String saveExcelBase64(String base64,String filename){try{if(base64==null||base64.isEmpty())throw new Exception("Data Excel kosong.");String safe=filename==null||filename.trim().isEmpty()?"Rekap-Pembayaran.xlsx":filename.replaceAll("[^A-Za-z0-9._-]","_");if(!safe.toLowerCase().endsWith(".xlsx"))safe+=".xlsx";byte[] data=Base64.decode(base64,Base64.DEFAULT);if(data.length==0)throw new Exception("File Excel kosong.");if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.Q){ContentValues values=new ContentValues();values.put(MediaStore.Downloads.DISPLAY_NAME,safe);values.put(MediaStore.Downloads.MIME_TYPE,EXCEL_MIME);values.put(MediaStore.Downloads.RELATIVE_PATH,Environment.DIRECTORY_DOWNLOADS);values.put(MediaStore.Downloads.IS_PENDING,1);Uri uri=getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,values);if(uri==null)throw new Exception("Tidak dapat membuat file di Download.");try(OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null)throw new Exception("Tidak dapat membuka file Download.");out.write(data);out.flush();}ContentValues done=new ContentValues();done.put(MediaStore.Downloads.IS_PENDING,0);getContentResolver().update(uri,done,null,null);lastExcelUri=uri;return safe;}File dir=Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);if(dir==null)throw new Exception("Folder Download tidak tersedia.");if(!dir.exists()&&!dir.mkdirs())throw new Exception("Folder Download tidak dapat dibuat.");File f=new File(dir,safe);try(FileOutputStream out=new FileOutputStream(f)){out.write(data);out.flush();}lastExcelUri=Uri.fromFile(f);return safe;}catch(Exception e){e.printStackTrace();return "";}}
        @JavascriptInterface public boolean openLastExcel(){try{if(lastExcelUri==null)return false;Intent i=new Intent(Intent.ACTION_VIEW);i.setDataAndType(lastExcelUri,EXCEL_MIME);i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_ACTIVITY_NEW_TASK);i.setClipData(ClipData.newRawUri("Excel",lastExcelUri));try{startActivity(i);return true;}catch(Exception noDirectHandler){Intent chooser=Intent.createChooser(i,"Buka file Excel dengan");chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_ACTIVITY_NEW_TASK);startActivity(chooser);return true;}}catch(Exception e){return false;}}
        @JavascriptInterface public void checkForUpdate(){new Thread(()->{try{JSONObject m=fetchManifest();String latest=m.optString("version",EMBEDDED_WEB_VERSION);String current=getPreferences(MODE_PRIVATE).getString("web_version",EMBEDDED_WEB_VERSION);if(version(latest)>version(current))send("window.dispatchEvent(new CustomEvent('webUpdateAvailable',{detail:{version:'"+esc(latest)+"',message:'"+esc(m.optString("message","Pembaruan aplikasi tersedia."))+"'}}))");else send("window.dispatchEvent(new CustomEvent('webUpdateLatest',{detail:{version:'"+esc(current)+"'}}))");}catch(Exception e){send("window.dispatchEvent(new CustomEvent('webUpdateError',{detail:{message:'"+esc("Tidak dapat memeriksa pembaruan: "+e.getMessage())+"'}}))");}}).start();}
        @JavascriptInterface public void applyUpdate(){new Thread(()->{File tmp=null;try{JSONObject m=fetchManifest();String v=m.optString("version","");JSONArray files=m.optJSONArray("files");if(v.isEmpty()||files==null||files.length()==0)throw new Exception("Manifest pembaruan tidak lengkap.");tmp=new File(getFilesDir(),"web_update_tmp");delete(tmp);if(!tmp.mkdirs())throw new Exception("Folder update tidak dapat dibuat.");for(int i=0;i<files.length();i++){String p=files.getString(i);send("window.dispatchEvent(new CustomEvent('webUpdateProgress',{detail:{message:'Mengunduh "+esc(p)+" ("+(i+1)+"/"+files.length()+")...'}}))");download(p,v,tmp);}delete(webUpdateDir);if(!webUpdateDir.mkdirs())throw new Exception("Folder update tidak dapat dibuat.");copy(tmp,webUpdateDir);getPreferences(MODE_PRIVATE).edit().putString("web_version",v).apply();send("window.dispatchEvent(new CustomEvent('webUpdateComplete',{detail:{version:'"+esc(v)+"'}}))");}catch(Exception e){e.printStackTrace();send("window.dispatchEvent(new CustomEvent('webUpdateError',{detail:{message:'"+esc("Pembaruan gagal: "+e.getMessage())+"'}}))");}finally{if(tmp!=null)delete(tmp);}}).start();}
    }
    private JSONObject fetchManifest()throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(MANIFEST_URL+"?t="+System.currentTimeMillis()).openConnection();c.setConnectTimeout(15000);c.setReadTimeout(30000);c.setRequestProperty("User-Agent","Keuangan-App-Updater");try{int code=c.getResponseCode();if(code<200||code>=300)throw new Exception("HTTP "+code);return new JSONObject(read(c.getInputStream()));}finally{c.disconnect();}}
    private void download(String path,String v,File root)throws Exception{String p=path.replace("\\","/");if(p.startsWith("/")||p.contains("../")||p.contains("..\\"))throw new Exception("Path update tidak aman");File cr=root.getCanonicalFile(),f=new File(cr,p).getCanonicalFile();if(!f.getPath().startsWith(cr.getPath()+File.separator))throw new Exception("Path update tidak aman");if(f.getParentFile()!=null)f.getParentFile().mkdirs();URL u=new URL("https://raw.githubusercontent.com/alfattahfinance/Catatan-kas/main/"+Uri.encode(p,"/")+"?v="+Uri.encode(v));HttpURLConnection c=(HttpURLConnection)u.openConnection();c.setConnectTimeout(15000);c.setReadTimeout(60000);c.setRequestProperty("User-Agent","Keuangan-App-Updater");try{int code=c.getResponseCode();if(code<200||code>=300)throw new Exception("HTTP "+code+" untuk "+p);try(InputStream in=new BufferedInputStream(c.getInputStream());FileOutputStream out=new FileOutputStream(f)){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}}finally{c.disconnect();}}
    private String read(InputStream in)throws Exception{StringBuilder s=new StringBuilder();byte[] b=new byte[8192];int n;try(InputStream input=in){while((n=input.read(b))!=-1)s.append(new String(b,0,n,java.nio.charset.StandardCharsets.UTF_8));}return s.toString();}
    private void copy(File a,File b)throws Exception{if(!a.exists())return;if(!b.exists())b.mkdirs();File[] fs=a.listFiles();if(fs==null)return;for(File f:fs){File d=new File(b,f.getName());if(f.isDirectory())copy(f,d);else try(InputStream in=new BufferedInputStream(new FileInputStream(f));FileOutputStream out=new FileOutputStream(d)){byte[] x=new byte[8192];int n;while((n=in.read(x))!=-1)out.write(x,0,n);}}}
    private void delete(File f){if(f==null||!f.exists())return;File[] fs=f.listFiles();if(fs!=null)for(File x:fs)delete(x);f.delete();}
    private int version(String v){int r=0;for(String p:String.valueOf(v).replaceFirst("^[vV]","").split("\\.")){try{r=r*1000+Integer.parseInt(p.replaceAll("[^0-9]",""));}catch(Exception ignored){}}return r;}
    private String esc(String s){if(s==null)return"";return s.replace("\\","\\\\").replace("'","\\'").replace("\n"," ").replace("\r"," ");}
    private void send(String js){runOnUiThread(()->{if(webView!=null)webView.evaluateJavascript(js,null);});}
    private static class UpdatableAssetsPathHandler implements WebViewAssetLoader.PathHandler{private final File root;private final WebViewAssetLoader.AssetsPathHandler fallback;UpdatableAssetsPathHandler(Context c,File r){root=r;fallback=new WebViewAssetLoader.AssetsPathHandler(c);}@Override public WebResourceResponse handle(String path){try{String p=path==null?"":path.replace("\\","/");while(p.startsWith("/"))p=p.substring(1);if(!p.isEmpty()&&!p.contains("../")&&!p.contains("..\\")){File cr=root.getCanonicalFile(),f=new File(cr,p).getCanonicalFile();if(f.getPath().startsWith(cr.getPath()+File.separator)&&f.isFile()){String m=MimeTypeMap.getSingleton().getMimeTypeFromExtension(MimeTypeMap.getFileExtensionFromUrl(f.getName()));if(m==null)m="application/octet-stream";return new WebResourceResponse(m,m.startsWith("text/")||m.contains("javascript")||m.contains("json")?"UTF-8":null,new FileInputStream(f));}}return fallback.handle(path);}catch(Exception e){return fallback.handle(path);}}}
}
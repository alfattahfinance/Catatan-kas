package com.catatankas.app;

import android.annotation.SuppressLint;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
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

/** MainActivity + secure-ish in-app web updater. */
public class UpdatableMainActivity extends MainActivity {
    private static final String MANIFEST_URL = "https://raw.githubusercontent.com/alfattahfinance/Catatan-kas/main/web-update.json";
    private static final String EMBEDDED_WEB_VERSION = "1.0.20";
    private static final int APP_BG = Color.rgb(18, 23, 22);
    private File webUpdateDir;
    private Uri lastExcelUri;

    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep the native WebView surface dark while HTML/CSS/Firebase assets load.
        // This removes the bright white loading flash visible when opening the APK.
        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(APP_BG));
        if (webView != null) {
            webView.setBackgroundColor(APP_BG);
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        }

        webUpdateDir = new File(getFilesDir(), "web_update");
        if (!webUpdateDir.exists()) webUpdateDir.mkdirs();
        if (webView != null) webView.addJavascriptInterface(new AndroidWebUpdater(), "AndroidWebUpdater");
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder().addPathHandler("/assets/", new UpdatableAssetsPathHandler(this, webUpdateDir)).build();
        webView.setWebViewClient(new androidx.webkit.WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, android.webkit.WebResourceRequest request) { return loader.shouldInterceptRequest(request.getUrl()); }
            @Override public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                Uri u=request.getUrl(); if(u==null)return false; String x=u.toString().toLowerCase();
                if(!x.startsWith("https://appassets.androidplatform.net/")&&!x.startsWith("http://appassets.androidplatform.net/")){try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}return true;} return false;
            }
        });
        webView.reload();
    }

    public class AndroidWebUpdater {
        @JavascriptInterface public String saveExcelBase64(String base64, String filename){
            try{
                if(base64==null||base64.isEmpty())throw new Exception("Data Excel kosong.");
                String safe=filename==null||filename.trim().isEmpty()?"Rekap-Pembayaran.xlsx":filename.replaceAll("[^A-Za-z0-9._-]","_");
                if(!safe.toLowerCase().endsWith(".xlsx"))safe+=".xlsx";
                byte[] data=Base64.decode(base64,Base64.DEFAULT);
                if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.Q){
                    ContentValues values=new ContentValues();
                    values.put(MediaStore.Downloads.DISPLAY_NAME,safe);
                    values.put(MediaStore.Downloads.MIME_TYPE,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                    values.put(MediaStore.Downloads.RELATIVE_PATH,Environment.DIRECTORY_DOWNLOADS);
                    values.put(MediaStore.Downloads.IS_PENDING,1);
                    Uri uri=getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,values);
                    if(uri==null)throw new Exception("Tidak dapat membuat file di Download.");
                    try(OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null)throw new Exception("Tidak dapat membuka file Download.");out.write(data);out.flush();}
                    ContentValues done=new ContentValues();done.put(MediaStore.Downloads.IS_PENDING,0);getContentResolver().update(uri,done,null,null);
                    lastExcelUri=uri;
                    return safe;
                }
                File dir=getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);if(dir==null)throw new Exception("Folder Download tidak tersedia.");if(!dir.exists())dir.mkdirs();
                File f=new File(dir,safe);try(FileOutputStream out=new FileOutputStream(f)){out.write(data);out.flush();}lastExcelUri=Uri.fromFile(f);return safe;
            }catch(Exception e){e.printStackTrace();return "";}
        }
        @JavascriptInterface public boolean openLastExcel(){
            try{if(lastExcelUri==null)return false;Intent i=new Intent(Intent.ACTION_VIEW);i.setDataAndType(lastExcelUri,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_ACTIVITY_NEW_TASK);startActivity(i);return true;}catch(Exception e){return false;}
        }
        @JavascriptInterface public String getEmbeddedWebVersion(){return EMBEDDED_WEB_VERSION;}
        @JavascriptInterface public String getManifestUrl(){return MANIFEST_URL;}
        @JavascriptInterface public String getWebUpdateDir(){return webUpdateDir==null?"":webUpdateDir.getAbsolutePath();}
        @JavascriptInterface public boolean saveUpdatedFile(String relativePath,String base64){
            try{if(relativePath==null||relativePath.trim().isEmpty()||base64==null)return false;File f=safeFile(relativePath);if(f==null)return false;File p=f.getParentFile();if(p!=null&&!p.exists())p.mkdirs();try(FileOutputStream out=new FileOutputStream(f)){out.write(Base64.decode(base64,Base64.DEFAULT));out.flush();}return true;}catch(Exception e){return false;}
        }
        @JavascriptInterface public boolean deleteUpdatedFile(String relativePath){try{File f=safeFile(relativePath);return f!=null&&!f.equals(webUpdateDir)&&f.exists()&&f.delete();}catch(Exception e){return false;}}
        @JavascriptInterface public boolean clearWebUpdate(){try{deleteTree(webUpdateDir);return webUpdateDir.mkdirs();}catch(Exception e){return false;}}
        private File safeFile(String relativePath){try{if(relativePath==null)return null;String r=relativePath.replace('\\','/');while(r.startsWith("/"))r=r.substring(1);File root=webUpdateDir.getCanonicalFile();File f=new File(root,r).getCanonicalFile();String rp=root.getPath(),fp=f.getPath();if(!fp.equals(rp)&&!fp.startsWith(rp+File.separator))return null;return f;}catch(Exception e){return null;}}
        private void deleteTree(File f){if(f==null||!f.exists())return;if(f.isDirectory()){File[] cs=f.listFiles();if(cs!=null)for(File c:cs)deleteTree(c);}f.delete();}
    }

    static class UpdatableAssetsPathHandler extends WebViewAssetLoader.PathHandler {
        private final Context context; private final File updateDir;
        UpdatableAssetsPathHandler(Context c,File d){context=c;updateDir=d;}
        @Override public WebResourceResponse handle(String path){
            try{
                if(path==null)path="";while(path.startsWith("/"))path=path.substring(1);
                File base=updateDir.getCanonicalFile();File candidate=new File(base,path).getCanonicalFile();String bp=base.getPath(),cp=candidate.getPath();
                if(cp.equals(bp)||!cp.startsWith(bp+File.separator)||!candidate.isFile())return null;
                String mime=MimeTypeMap.getSingleton().getMimeTypeFromExtension(MimeTypeMap.getFileExtensionFromUrl(candidate.getName()));if(mime==null)mime="application/octet-stream";
                return new WebResourceResponse(mime,"UTF-8",new BufferedInputStream(new FileInputStream(candidate)));
            }catch(Exception e){return null;}
        }
    }
}
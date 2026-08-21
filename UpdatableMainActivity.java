package com.catatankas.app;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
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
import java.net.HttpURLConnection;
import java.net.URL;

/** MainActivity + secure-ish in-app web updater. */
public class UpdatableMainActivity extends MainActivity {
    private static final String MANIFEST_URL = "https://raw.githubusercontent.com/alfattahfinance/Catatan-kas/main/web-update.json";
    private static final String EMBEDDED_WEB_VERSION = "1.0.12";
    private File webUpdateDir;

    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
        @JavascriptInterface public void checkForUpdate(){new Thread(()->{try{JSONObject m=fetchManifest();String latest=m.optString("version",EMBEDDED_WEB_VERSION);String current=getPreferences(MODE_PRIVATE).getString("web_version",EMBEDDED_WEB_VERSION);if(version(latest)>version(current))send("window.dispatchEvent(new CustomEvent('webUpdateAvailable',{detail:{version:'"+esc(latest)+"',message:'"+esc(m.optString("message","Pembaruan aplikasi tersedia."))+"'}}))");else send("window.dispatchEvent(new CustomEvent('webUpdateLatest',{detail:{version:'"+esc(current)+"'}}))");}catch(Exception e){send("window.dispatchEvent(new CustomEvent('webUpdateError',{detail:{message:'"+esc("Tidak dapat memeriksa pembaruan: "+e.getMessage())+"'}}))");}}).start();}
        @JavascriptInterface public void applyUpdate(){new Thread(()->{File tmp=null;try{JSONObject m=fetchManifest();String v=m.optString("version","");JSONArray files=m.optJSONArray("files");if(v.isEmpty()||files==null||files.length()==0)throw new Exception("Manifest pembaruan tidak lengkap.");tmp=new File(getFilesDir(),"web_update_tmp");delete(tmp);if(!tmp.mkdirs())throw new Exception("Folder update tidak dapat dibuat.");for(int i=0;i<files.length();i++){String p=files.getString(i);send("window.dispatchEvent(new CustomEvent('webUpdateProgress',{detail:{message:'Mengunduh "+esc(p)+" ("+(i+1)+"/"+files.length()+")...'}}))");download(p,v,tmp);}delete(webUpdateDir);if(!webUpdateDir.mkdirs())throw new Exception("Folder update tidak dapat dibuat.");copy(tmp,webUpdateDir);getPreferences(MODE_PRIVATE).edit().putString("web_version",v).apply();send("window.dispatchEvent(new CustomEvent('webUpdateComplete',{detail:{version:'"+esc(v)+"'}}))");}catch(Exception e){e.printStackTrace();send("window.dispatchEvent(new CustomEvent('webUpdateError',{detail:{message:'"+esc("Pembaruan gagal: "+e.getMessage())+"'}}))");}finally{if(tmp!=null)delete(tmp);}}).start();}
    }

    private JSONObject fetchManifest() throws Exception {HttpURLConnection c=(HttpURLConnection)new URL(MANIFEST_URL+"?t="+System.currentTimeMillis()).openConnection();c.setConnectTimeout(15000);c.setReadTimeout(30000);c.setRequestProperty("User-Agent","Keuangan-App-Updater");try{int code=c.getResponseCode();if(code<200||code>=300)throw new Exception("HTTP "+code);return new JSONObject(read(c.getInputStream()));}finally{c.disconnect();}}
    private void download(String path,String v,File root)throws Exception{String p=path.replace("\\","/");if(p.startsWith("/")||p.contains("../")||p.contains("..\\"))throw new Exception("Path update tidak aman");File cr=root.getCanonicalFile(),f=new File(cr,p).getCanonicalFile();if(!f.getPath().startsWith(cr.getPath()+File.separator))throw new Exception("Path update tidak aman");if(f.getParentFile()!=null)f.getParentFile().mkdirs();URL u=new URL("https://raw.githubusercontent.com/alfattahfinance/Catatan-kas/main/"+Uri.encode(p,"/")+"?v="+Uri.encode(v));HttpURLConnection c=(HttpURLConnection)u.openConnection();c.setConnectTimeout(15000);c.setReadTimeout(60000);c.setRequestProperty("User-Agent","Keuangan-App-Updater");try{int code=c.getResponseCode();if(code<200||code>=300)throw new Exception("HTTP "+code+" untuk "+p);try(InputStream in=new BufferedInputStream(c.getInputStream());FileOutputStream out=new FileOutputStream(f)){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}}finally{c.disconnect();}}
    private String read(InputStream in)throws Exception{StringBuilder s=new StringBuilder();byte[] b=new byte[8192];int n;try(InputStream input=in){while((n=input.read(b))!=-1)s.append(new String(b,0,n,java.nio.charset.StandardCharsets.UTF_8));}return s.toString();}
    private void copy(File a,File b)throws Exception{if(!a.exists())return;if(!b.exists())b.mkdirs();File[] fs=a.listFiles();if(fs==null)return;for(File f:fs){File d=new File(b,f.getName());if(f.isDirectory())copy(f,d);else try(InputStream in=new BufferedInputStream(new FileInputStream(f));FileOutputStream out=new FileOutputStream(d)){byte[] x=new byte[8192];int n;while((n=in.read(x))!=-1)out.write(x,0,n);}}}
    private void delete(File f){if(f==null||!f.exists())return;File[] fs=f.listFiles();if(fs!=null)for(File x:fs)delete(x);f.delete();}
    private int version(String v){int r=0;for(String p:String.valueOf(v).replaceFirst("^[vV]","").split("\\.")){try{r=r*1000+Integer.parseInt(p.replaceAll("[^0-9]",""));}catch(Exception ignored){}}return r;}
    private String esc(String s){if(s==null)return"";return s.replace("\\","\\\\").replace("'","\\'").replace("\n"," ").replace("\r"," ");}
    private void send(String js){runOnUiThread(()->{if(webView!=null)webView.evaluateJavascript(js,null);});}

    private static class UpdatableAssetsPathHandler implements WebViewAssetLoader.PathHandler{
        private final File root;private final WebViewAssetLoader.AssetsPathHandler fallback;
        UpdatableAssetsPathHandler(Context c,File r){root=r;fallback=new WebViewAssetLoader.AssetsPathHandler(c);}
        @Override public WebResourceResponse handle(String path){try{String p=path==null?"":path.replace("\\","/");while(p.startsWith("/"))p=p.substring(1);if(!p.isEmpty()&&!p.contains("../")&&!p.contains("..\\")){File cr=root.getCanonicalFile(),f=new File(cr,p).getCanonicalFile();if(f.getPath().startsWith(cr.getPath()+File.separator)&&f.isFile()){String m=MimeTypeMap.getSingleton().getMimeTypeFromExtension(MimeTypeMap.getFileExtensionFromUrl(f.getName()));if(m==null)m="application/octet-stream";return new WebResourceResponse(m,m.startsWith("text/")||m.contains("javascript")||m.contains("json")?"UTF-8":null,new FileInputStream(f));}}return fallback.handle(path);}catch(Exception e){return fallback.handle(path);}}
    }
}

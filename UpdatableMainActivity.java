package com.catatankas.app;

import android.annotation.SuppressLint;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
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
    private static final int APP_BG = Color.rgb(0,112,102);
    private static final String EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private File webUpdateDir;
    private Uri lastExcelUri;

    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(APP_BG));
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP){getWindow().setStatusBarColor(APP_BG);getWindow().setNavigationBarColor(APP_BG);}
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.M){getWindow().getDecorView().setSystemUiVisibility(0);}
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
        ViewParentCleaner.hideSiblingsExceptWebView(webView);webView.setVisibility(View.INVISIBLE);
        final ViewGroup rootGroup=(ViewGroup)webView.getParent();if(rootGroup==null)return;
        
        final android.widget.FrameLayout overlay=new android.widget.FrameLayout(this);
        GradientDrawable splashBg=new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{Color.rgb(0,112,102), Color.rgb(0,112,102), Color.rgb(0,80,72)});
        overlay.setBackground(splashBg);
        overlay.setSystemUiVisibility(0);
        rootGroup.addView(overlay,new android.widget.FrameLayout.LayoutParams(-1,-1));
        
        android.widget.FrameLayout visual=new android.widget.FrameLayout(this);
        overlay.addView(visual,new android.widget.FrameLayout.LayoutParams(-1,-1));

        android.widget.FrameLayout center=new android.widget.FrameLayout(this);
        android.widget.FrameLayout.LayoutParams centerLp=new android.widget.FrameLayout.LayoutParams(-1,-2,Gravity.CENTER);
        visual.addView(center,centerLp);

        int logoSize = Math.min(dpSplash(190), Math.max(dpSplash(140), Math.round(getResources().getDisplayMetrics().widthPixels * 0.38f)));

        android.widget.FrameLayout iconContainer = new android.widget.FrameLayout(this);
        int containerSize = (int)(logoSize * 1.7f);
        android.widget.FrameLayout.LayoutParams iconContainerLp = new android.widget.FrameLayout.LayoutParams(containerSize, containerSize, Gravity.CENTER_HORIZONTAL);
        center.addView(iconContainer, iconContainerLp);

        final android.widget.ImageView halo=new android.widget.ImageView(this);
        GradientDrawable haloBg=new GradientDrawable();
        haloBg.setShape(GradientDrawable.OVAL);
        haloBg.setColor(Color.argb(40,100,255,230));
        halo.setBackground(haloBg);
        android.widget.FrameLayout.LayoutParams haloLp=new android.widget.FrameLayout.LayoutParams(containerSize, containerSize, Gravity.CENTER);
        iconContainer.addView(halo, haloLp);

        for(int i=0; i<3; i++){
            final View ring=new View(this);
            GradientDrawable rg=new GradientDrawable();
            rg.setShape(GradientDrawable.OVAL);
            rg.setColor(Color.TRANSPARENT);
            rg.setStroke(dpSplash(1), Color.argb(50 + i*15, 150, 255, 235));
            ring.setBackground(rg);
            int ringSize = logoSize + dpSplash(20 + i * 45);
            android.widget.FrameLayout.LayoutParams rp=new android.widget.FrameLayout.LayoutParams(ringSize, ringSize, Gravity.CENTER);
            iconContainer.addView(ring, rp);
            
            ring.setAlpha(0f);
            ring.setScaleX(.7f);
            ring.setScaleY(.7f);
            ring.animate().alpha(.8f).scaleX(1f).scaleY(1f).setStartDelay(i * 200).setDuration(900).setInterpolator(new android.view.animation.DecelerateInterpolator()).start();
        }

        android.widget.ImageView logo=new android.widget.ImageView(this);
        logo.setScaleType(android.widget.ImageView.ScaleType.FIT_CENTER);
        try(InputStream in=getAssets().open("icon-192.png")){
            Bitmap b=BitmapFactory.decodeStream(in);
            if(b!=null) logo.setImageBitmap(b);
        }catch(Exception ignored){}
        android.widget.FrameLayout.LayoutParams logoLp=new android.widget.FrameLayout.LayoutParams(logoSize, logoSize, Gravity.CENTER);
        iconContainer.addView(logo, logoLp);

        android.widget.LinearLayout texts=new android.widget.LinearLayout(this);
        texts.setOrientation(android.widget.LinearLayout.VERTICAL);
        texts.setGravity(Gravity.CENTER_HORIZONTAL);
        android.widget.FrameLayout.LayoutParams textLp=new android.widget.FrameLayout.LayoutParams(-1,-2,Gravity.CENTER_HORIZONTAL);
        textLp.topMargin = containerSize / 2 + logoSize / 2 - dpSplash(10);
        center.addView(texts,textLp);

        android.widget.TextView title=new android.widget.TextView(this);
        title.setText("Catatan Kas");
        title.setTextColor(Color.WHITE);
        title.setTextSize(27);
        title.setTypeface(android.graphics.Typeface.DEFAULT,android.graphics.Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        texts.addView(title,new android.widget.LinearLayout.LayoutParams(-1,-2));

        android.widget.TextView subtitle=new android.widget.TextView(this);
        subtitle.setText("Catatan keuangan lebih mudah");
        subtitle.setTextColor(Color.rgb(224,246,240));
        subtitle.setTextSize(13);
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0,dpSplash(6),0,0);
        texts.addView(subtitle,new android.widget.LinearLayout.LayoutParams(-1,-2));

        WaveView waveView = new WaveView(this);
        android.widget.FrameLayout.LayoutParams waveLp=new android.widget.FrameLayout.LayoutParams(-1, dpSplash(35), Gravity.BOTTOM);
        waveLp.bottomMargin=dpSplash(95);
        visual.addView(waveView, waveLp);

        android.widget.LinearLayout dots=new android.widget.LinearLayout(this);

        private void showModernSplash(){
        if(webView==null)return;
        ViewParentCleaner.hideSiblingsExceptWebView(webView);webView.setVisibility(View.INVISIBLE);
        final ViewGroup rootGroup=(ViewGroup)webView.getParent();if(rootGroup==null)return;
        
        final android.widget.FrameLayout overlay=new android.widget.FrameLayout(this);
        GradientDrawable splashBg=new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{Color.rgb(0,115,102), Color.rgb(0,95,85), Color.rgb(0,65,58)});
        overlay.setBackground(splashBg);
        overlay.setSystemUiVisibility(0);
        rootGroup.addView(overlay,new android.widget.FrameLayout.LayoutParams(-1,-1));
        
        android.widget.FrameLayout visual=new android.widget.FrameLayout(this);
        overlay.addView(visual,new android.widget.FrameLayout.LayoutParams(-1,-1));

        // Layout Konten Tengah (Bebas dari penumpukan lingkaran)
        android.widget.LinearLayout contentLayout = new android.widget.LinearLayout(this);
        contentLayout.setOrientation(android.widget.LinearLayout.VERTICAL);
        contentLayout.setGravity(Gravity.CENTER_HORIZONTAL);
        android.widget.FrameLayout.LayoutParams contentLp = new android.widget.FrameLayout.LayoutParams(-1, -2, Gravity.CENTER);
        visual.addView(contentLayout, contentLp);

        // Ukuran Logo Dibuat Lebih Besar Sesuai Referensi
        int logoSize = Math.min(dpSplash(240), Math.round(getResources().getDisplayMetrics().widthPixels * 0.52f));

        // Wadah Khusus Logo & Cincin Orbit Latar Belakang
        android.widget.FrameLayout logoFrame = new android.widget.FrameLayout(this);
        android.widget.LinearLayout.LayoutParams logoFrameLp = new android.widget.LinearLayout.LayoutParams(logoSize + dpSplash(120), logoSize + dpSplash(120));
        logoFrameLp.gravity = Gravity.CENTER_HORIZONTAL;
        contentLayout.addView(logoFrame, logoFrameLp);

        // Cincin Radar Tipis Tersebar Luas Di Belakang Logo
        for(int i=0; i<3; i++){
            View ring = new View(this);
            GradientDrawable rg = new GradientDrawable();
            rg.setShape(GradientDrawable.OVAL);
            rg.setColor(Color.TRANSPARENT);
            rg.setStroke(dpSplash(1), Color.argb(35 + i*10, 160, 255, 240));
            ring.setBackground(rg);
            int ringSize = logoSize + dpSplash(30 + i * 40);
            android.widget.FrameLayout.LayoutParams rp = new android.widget.FrameLayout.LayoutParams(ringSize, ringSize, Gravity.CENTER);
            logoFrame.addView(ring, rp);
        }

        // Gambar Logo Utama
        android.widget.ImageView logo = new android.widget.ImageView(this);
        logo.setScaleType(android.widget.ImageView.ScaleType.FIT_CENTER);
        try(InputStream in = getAssets().open("icon-192.png")){
            Bitmap b = BitmapFactory.decodeStream(in);
            if(b!=null) logo.setImageBitmap(b);
        }catch(Exception ignored){}
        android.widget.FrameLayout.LayoutParams logoLp = new android.widget.FrameLayout.LayoutParams(logoSize, logoSize, Gravity.CENTER);
        logoFrame.addView(logo, logoLp);

        // Judul Teks Di Bawah Logo
        android.widget.TextView title = new android.widget.TextView(this);
        title.setText("Catatan Kas");
        title.setTextColor(Color.WHITE);
        title.setTextSize(30);
        title.setTypeface(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        android.widget.LinearLayout.LayoutParams titleLp = new android.widget.LinearLayout.LayoutParams(-1, -2);
        titleLp.topMargin = dpSplash(10);
        contentLayout.addView(title, titleLp);

        // Garis Kilau Tipis Di Bawah Judul
        View titleShine = new View(this);
        GradientDrawable shineBg = new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT, new int[]{Color.TRANSPARENT, Color.argb(180, 200, 255, 245), Color.TRANSPARENT});
        titleShine.setBackground(shineBg);
        android.widget.LinearLayout.LayoutParams shineLp = new android.widget.LinearLayout.LayoutParams(dpSplash(140), dpSplash(1.5f));
        shineLp.gravity = Gravity.CENTER_HORIZONTAL;
        shineLp.setMargins(0, dpSplash(6), 0, dpSplash(10));
        contentLayout.addView(titleShine, shineLp);

        // Subtitle
        android.widget.TextView subtitle = new android.widget.TextView(this);
        subtitle.setText("Catatan keuangan lebih mudah");
        subtitle.setTextColor(Color.rgb(210, 245, 238));
        subtitle.setTextSize(13.5f);
        subtitle.setGravity(Gravity.CENTER);
        contentLayout.addView(subtitle, new android.widget.LinearLayout.LayoutParams(-1, -2));

        // Gelombang Bergaris Multi-layer (Abstract Wave Lines)
        MultiWaveView waveView = new MultiWaveView(this);
        android.widget.FrameLayout.LayoutParams waveLp = new android.widget.FrameLayout.LayoutParams(-1, dpSplash(140), Gravity.BOTTOM);
        waveLp.bottomMargin = dpSplash(70);
        visual.addView(waveView, waveLp);

        // Dots Indicator
        android.widget.LinearLayout dots = new android.widget.LinearLayout(this);
        dots.setGravity(Gravity.CENTER);
        dots.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        android.widget.FrameLayout.LayoutParams dotsLp = new android.widget.FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL);
        dotsLp.bottomMargin = dpSplash(40);
        visual.addView(dots, dotsLp);
        
        final View[] dotViews = new View[6];
        for(int i=0; i<6; i++){
            View d = new View(this);
            GradientDrawable dg = new GradientDrawable();
            dg.setShape(GradientDrawable.OVAL);
            dg.setColor(Color.argb(i==3?255:90, 220, 255, 245));
            d.setBackground(dg);
            d.setAlpha(i==3?1f:.6f);
            android.widget.LinearLayout.LayoutParams dl = new android.widget.LinearLayout.LayoutParams(dpSplash(7), dpSplash(7));
            dl.leftMargin = dpSplash(4);
            dl.rightMargin = dpSplash(4);
            dots.addView(d, dl);
            dotViews[i] = d;
        }

        final android.os.Handler dotHandler = new android.os.Handler(android.os.Looper.getMainLooper());
        final Runnable dotRun = new Runnable(){
            int active = 0;
            public void run(){
                for(int i=0; i<dotViews.length; i++){
                    dotViews[i].animate().alpha(i==active?1f:.5f).scaleX(i==active?1.3f:1f).scaleY(i==active?1.3f:1f).setDuration(200).start();
                }
                active = (active+1)%dotViews.length;
                dotHandler.postDelayed(this, 240);
            }
        };
        dotHandler.post(dotRun);

        // Animasi Masuk
        contentLayout.setAlpha(0f);
        contentLayout.setScaleX(.85f);
        contentLayout.setScaleY(.85f);
        
        android.view.animation.Interpolator smooth = new android.view.animation.DecelerateInterpolator(1.4f);
        contentLayout.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(800).setInterpolator(new android.view.animation.OvershootInterpolator(1.02f)).start();

        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(()->{
            dotHandler.removeCallbacks(dotRun);
            webView.setVisibility(View.VISIBLE);
            webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
            overlay.animate().alpha(0f).setDuration(550).setInterpolator(smooth).withEndAction(()->rootGroup.removeView(overlay)).start();
        }, 3100);
    }

    private class MultiWaveView extends View {
        private final android.graphics.Paint p = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        private final android.graphics.Path path = new android.graphics.Path();

        public MultiWaveView(Context context) {
            super(context);
        }

        @Override protected void onDraw(android.graphics.Canvas canvas) {
            super.onDraw(canvas);
            p.setStyle(android.graphics.Paint.Style.STROKE);
            int w = getWidth(), h = getHeight();

            for (int i = 0; i < 5; i++) {
                p.setStrokeWidth(dpSplash(1f + i * 0.2f));
                p.setColor(Color.argb(30 + i * 15, 150, 255, 235));
                path.reset();
                float offset = i * dpSplash(8);
                path.moveTo(0, h * 0.7f - offset);
                path.cubicTo(w * 0.3f, h * 0.1f - offset, w * 0.7f, h * 0.9f - offset, w, h * 0.3f - offset);
                canvas.drawPath(path, p);
            }
        }
    }

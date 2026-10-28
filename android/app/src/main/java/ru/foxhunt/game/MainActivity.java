package ru.foxhunt.game;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.KeyEvent;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

/**
 * Оболочка вокруг веб-версии: одна Activity, один WebView.
 *
 * Игра лежит внутри APK (assets/www), но отдаётся не по file://, а через
 * WebViewAssetLoader на https://appassets.androidplatform.net/assets/www/ —
 * так localStorage и Service Worker работают нормально, а наружу ничего не ходит.
 * Внешние ссылки (GitHub, донат) открываются в браузере, а не внутри оболочки.
 */
public class MainActivity extends Activity {

    private static final String START_URL =
            "https://appassets.androidplatform.net/assets/www/index.html";
    private static final String INNER_HOST = "appassets.androidplatform.net";

    private WebView web;
    private WebViewAssetLoader assetLoader;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);

        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        web.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (url.getHost() != null && url.getHost().equals(INNER_HOST)) {
                    return false;   // свои файлы грузим здесь же
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (Exception ignored) {
                    // нет браузера — остаёмся в игре, ничего не ломаем
                }
                return true;
            }
        });

        // Мост для того, что в браузере умеет само окно, а в WebView — только
        // средствами системы: печать через диалог Android и «поделиться».
        web.addJavascriptInterface(new Bridge(), "AndroidApp");

        setContentView(web);
        if (saved != null) {
            web.restoreState(saved);
        } else {
            web.loadUrl(START_URL);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public boolean onKeyDown(int code, KeyEvent event) {
        if (code == KeyEvent.KEYCODE_BACK && web != null && web.canGoBack()) {
            web.goBack();
            return true;
        }
        return super.onKeyDown(code, event);
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    /** Методы, вызываемые из игры: AndroidApp.printPage(...), AndroidApp.share(...). */
    private class Bridge {

        @JavascriptInterface
        public void printPage(final String title) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        String name = (title == null || title.isEmpty()) ? "Охота на лис" : title;
                        PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                        PrintDocumentAdapter adapter = web.createPrintDocumentAdapter(name);
                        pm.print(name, adapter, new PrintAttributes.Builder().build());
                    } catch (Exception ignored) {
                        // печать недоступна (нет службы печати) — игра продолжает работать
                    }
                }
            });
        }

        @JavascriptInterface
        public void share(final String text) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent send = new Intent(Intent.ACTION_SEND);
                        send.setType("text/plain");
                        send.putExtra(Intent.EXTRA_TEXT, text);
                        startActivity(Intent.createChooser(send, "Поделиться"));
                    } catch (Exception ignored) {
                        // нет чем делиться — молча остаёмся в игре
                    }
                }
            });
        }

        @JavascriptInterface
        public String platform() {
            return "android";
        }
    }
}

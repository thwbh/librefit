package io.tohowabohu.librefit

import android.os.Bundle
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature

class MainActivity : TauriActivity() {

  private val safeArea = SafeAreaProvider()

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webView.overScrollMode = View.OVER_SCROLL_NEVER

    // CSS env(safe-area-inset-*) is broken on WebView < 140 and unreliable for
    // navigation bars even on newer versions. Instead, expose insets via a
    // JavaScript interface and inject them as CSS custom properties.
    webView.addJavascriptInterface(safeArea, "__SAFE_AREA__")

    // Runs at document start on every page load — reads insets from the bridge
    // and sets CSS custom properties before the page renders.
    if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
      WebViewCompat.addDocumentStartJavaScript(webView, APPLY_INSETS_JS, setOf("*"))
    }

    // Update bridge values whenever system insets change (layout, keyboard, rotation).
    ViewCompat.setOnApplyWindowInsetsListener(webView) { _, windowInsets ->
      val systemBars = windowInsets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )
      val ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime())
      val keyboardVisible = windowInsets.isVisible(WindowInsetsCompat.Type.ime())
      val density = resources.displayMetrics.density

      safeArea.update(
        top = systemBars.top / density,
        bottom = (if (keyboardVisible) ime.bottom else systemBars.bottom) / density,
        left = systemBars.left / density,
        right = systemBars.right / density
      )

      // Re-inject for dynamic changes (keyboard, rotation) — the document start
      // script only runs on page load, not on inset changes.
      webView.evaluateJavascript(APPLY_INSETS_JS, null)
      windowInsets
    }
  }

  companion object {
    private const val APPLY_INSETS_JS =
      "(function(){try{var i=JSON.parse(__SAFE_AREA__.getInsets());" +
        "var s=document.documentElement.style;" +
        "s.setProperty('--safe-area-top',i.top+'px');" +
        "s.setProperty('--safe-area-bottom',i.bottom+'px');" +
        "s.setProperty('--safe-area-left',i.left+'px');" +
        "s.setProperty('--safe-area-right',i.right+'px');}catch(e){}})()"
  }
}

/** Thread-safe bridge providing system bar inset values to JavaScript. */
class SafeAreaProvider {
  @Volatile private var top: Float = 0f
  @Volatile private var bottom: Float = 0f
  @Volatile private var left: Float = 0f
  @Volatile private var right: Float = 0f

  fun update(top: Float, bottom: Float, left: Float, right: Float) {
    this.top = top
    this.bottom = bottom
    this.left = left
    this.right = right
  }

  @JavascriptInterface
  fun getInsets(): String =
    """{"top":$top,"bottom":$bottom,"left":$left,"right":$right}"""
}

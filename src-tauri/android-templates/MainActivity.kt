package io.tohowabohu.librefit

import android.os.Bundle
import android.view.View
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  override fun onResume() {
    super.onResume()
    // Disable WebView overscroll to prevent bouncing that reveals gaps behind system bars
    val webView = findWebView(window.decorView)
    webView?.overScrollMode = View.OVER_SCROLL_NEVER
  }

  private fun findWebView(view: View): View? {
    if (view is android.webkit.WebView) return view
    if (view is android.view.ViewGroup) {
      for (i in 0 until view.childCount) {
        val found = findWebView(view.getChildAt(i))
        if (found != null) return found
      }
    }
    return null
  }
}

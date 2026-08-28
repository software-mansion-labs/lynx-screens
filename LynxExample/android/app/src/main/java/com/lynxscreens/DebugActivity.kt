package com.lynxscreens

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.lynxscreens.providers.TemplateProvider
import com.lynx.tasm.LynxView
import com.lynx.tasm.LynxViewBuilder
import com.lynx.react.bridge.JavaOnlyArray
import com.lynx.react.bridge.JavaOnlyMap
import com.lynx.tasm.TemplateData

/**
 * adb shell am start -a android.intent.action.VIEW -d "lynxscreens:///depth/3"
 */
// AppCompatActivity: lynx-screens needs a FragmentManager, which a plain
// Activity cannot give it.
class DebugActivity : AppCompatActivity() {
    private var lynxView: LynxView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val view = buildLynxView()
        lynxView = view
        setContentView(view)
        val url = intent.getStringExtra("url") ?: defaultBundleUrl()

        view.renderTemplateUrl(url, navigationData(intent))
    }

    private fun defaultBundleUrl(): String =
        if (BuildConfig.DEBUG) {
            "http://10.0.2.2:3000/main.lynx.bundle?fullscreen=true"
        } else {
            "main.lynx.bundle"
        }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)

        val route = route(intent) ?: return

        // A nested plain Kotlin map arrives in JS as null; the bridge only
        // converts its own JavaOnly* types.
        val payload = JavaOnlyMap.from(mapOf<String, Any>("url" to route))

        lynxView?.sendGlobalEvent(URL_EVENT, JavaOnlyArray.of(payload))
    }

    private fun route(intent: Intent): String? {
        val uri = intent.data ?: return null

        // `lynxscreens://depth/3` parses `depth` as the authority, while
        // `lynxscreens:///depth/3` puts all of it in the path.
        val path = buildString {
            uri.host?.takeIf(String::isNotEmpty)?.let { append('/').append(it) }
            append(uri.path.orEmpty())
        }.ifEmpty { "/" }

        return uri.query?.takeIf(String::isNotEmpty)?.let { "$path?$it" } ?: path
    }

    private fun navigationData(intent: Intent): TemplateData {
        val route = route(intent) ?: return TemplateData.empty()

        return TemplateData.fromMap(
            mapOf(
                NAVIGATION_KEY to mapOf(
                    "route" to route,
                    // initData is state, not an event: the same route twice
                    // would leave it untouched and be dropped.
                    "nonce" to System.currentTimeMillis(),
                ),
            ),
        )
    }

    private fun buildLynxView(): LynxView {
        val viewBuilder = LynxViewBuilder()
        viewBuilder.setTemplateProvider(TemplateProvider(this))
        return viewBuilder.build(this)
    }

    private companion object {
        // Both match `@react-navigation/lynx`.
        const val NAVIGATION_KEY = "__navigation"
        const val URL_EVENT = "reactnavigation.url"
    }
}

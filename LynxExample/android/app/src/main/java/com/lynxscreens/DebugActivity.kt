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
 * Also the reference for how a host hands a route to a card.
 *
 * React Navigation asks the platform two things: which route the card was
 * opened with, and how later ones arrive. On Lynx the card is not the process
 * receiving the link - the host is - so the host has to pass it along:
 *
 *   adb shell am start -a android.intent.action.VIEW -d "lynxscreens:///depth/3"
 *
 * That is the real path: a VIEW intent, the same shape a host gets when
 * another app links into it. The `-e route` extra below does the same thing
 * without a link, for pointing the debug activity at an arbitrary bundle:
 *
 *   adb shell am start -n <pkg>/com.lynxscreens.DebugActivity \
 *     -e url <bundle url> -e route /depth/3
 *
 * Cold start rides in on `initData`, which the card can read before any
 * listener exists, so there is no race to lose the launch route to. Later
 * routes go out as a `reactnavigation.url` global event carrying `{ url }`.
 */
// AppCompatActivity, not Activity: lynx-screens puts each screen in a Fragment
// and asks the host for a FragmentManager, which a plain Activity cannot give
// it - the stack then fails on the first patch with "nullish FragmentManager".
class DebugActivity : AppCompatActivity() {
    private var lynxView: LynxView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val view = buildLynxView()
        lynxView = view
        setContentView(view)
        // A link carries a route, not a bundle, so fall back to the same one
        // MainActivity loads. `-e url` still wins, for pointing the debug
        // activity at an arbitrary bundle.
        val url = intent.getStringExtra("url") ?: defaultBundleUrl()

        view.renderTemplateUrl(url, navigationData(intent))
    }

    private fun defaultBundleUrl(): String =
        if (BuildConfig.DEBUG) {
            "http://10.0.2.2:3000/main.lynx.bundle?fullscreen=true"
        } else {
            "main.lynx.bundle"
        }

    /**
     * Reached when the host is asked to open a route while the card is already
     * up - `am start` on a running activity with `launchMode="singleTop"`, or
     * whatever the real host's equivalent is.
     */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)

        val route = route(intent) ?: return

        // The bridge only converts its own JavaOnly* types; a plain Kotlin map
        // nested inside the array arrives in JS as null.
        val payload = JavaOnlyMap.from(mapOf<String, Any>("url" to route))

        lynxView?.sendGlobalEvent(URL_EVENT, JavaOnlyArray.of(payload))
    }

    /**
     * The path the host was asked to open, e.g. `/depth/3`.
     *
     * A real host gets this as the data of a VIEW intent, which is what the
     * intent-filter above declares. The extra is only a convenience for driving
     * the example from a script, mirroring `-route` on iOS.
     */
    private fun route(intent: Intent): String? {
        val uri = intent.data ?: return intent.getStringExtra(ROUTE_EXTRA)

        // `lynxscreens://depth/3` parses `depth` as the authority and `/3` as
        // the path, while `lynxscreens:///depth/3` puts all of it in the path.
        // Both should mean the same route.
        val path = buildString {
            uri.host?.takeIf(String::isNotEmpty)?.let { append('/').append(it) }
            append(uri.path.orEmpty())
        }.ifEmpty { "/" }

        // Routes that start with `/` reach `getStateFromPath` without any
        // prefix stripping.
        return uri.query?.takeIf(String::isNotEmpty)?.let { "$path?$it" } ?: path
    }

    private fun navigationData(intent: Intent): TemplateData {
        val route = route(intent) ?: return TemplateData.empty()

        return TemplateData.fromMap(
            mapOf(
                NAVIGATION_KEY to mapOf(
                    "route" to route,
                    // `initData` is state, not an event: without something that
                    // changes per navigation, going to the same route twice
                    // would leave the value untouched and be dropped.
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
        const val ROUTE_EXTRA = "route"

        /** Matches `INIT_DATA_KEY` in `@react-navigation/lynx`. */
        const val NAVIGATION_KEY = "__navigation"

        /**
         * Matches `URL_EVENT` in `@react-navigation/lynx`. Namespaced because
         * GlobalEventEmitter is one namespace shared with the host.
         */
        const val URL_EVENT = "reactnavigation.url"
    }
}

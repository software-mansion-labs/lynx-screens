package com.lynxscreens

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.lynxscreens.providers.GenericResourceFetcher
import com.lynxscreens.providers.TemplateProvider
import com.lynx.tasm.LynxBooleanOption
import com.lynx.tasm.LynxView
import com.lynx.tasm.LynxViewBuilder
import com.lynx.tasm.behavior.Behavior
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.shadow.ShadowNode
import com.lynx.xelement.XElementBehaviors
import com.lynxscreens.elements.LynxColorBoxComponent
import com.lynxscreens.elements.LynxColorBoxShadowNode
import com.lynxscreens.screens.host.StackHostComponent
import com.lynxscreens.screens.screen.StackScreenComponent

class MainActivity : AppCompatActivity() {
    private lateinit var lynxView: LynxView
    private lateinit var templateUri: String
    private var lastSafeAreaJson: String? = null
    private var rendered = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        templateUri = if (BuildConfig.DEBUG == true) {
            "http://10.0.2.2:3000/main.lynx.bundle?fullscreen=true"
        } else {
            "main.lynx.bundle"
        }

        lynxView = buildLynxView()
        setContentView(lynxView)

        // Lynx has no safe-area API and targetSdk 35+ forces edge-to-edge, so the
        // window insets are the only thing that knows where the app may draw. The
        // gap between gesture nav (~24dp) and 3-button nav (~48dp) is too wide for
        // the app to guess, so hand the measured values to it as data.
        ViewCompat.setOnApplyWindowInsetsListener(lynxView) { _, windowInsets ->
            val bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            val density = resources.displayMetrics.density
            val json = """{"safeAreaInsets":{"top":${bars.top / density},""" +
                    """"bottom":${bars.bottom / density},""" +
                    """"left":${bars.left / density},""" +
                    """"right":${bars.right / density}}}"""

            if (json != lastSafeAreaJson) {
                lastSafeAreaJson = json
                // The first dispatch lands before the template has been fetched, so
                // it seeds the render rather than updating a page that isn't there
                // yet. Later ones (rotation, a nav mode change) are updates.
                if (rendered) lynxView.updateData(json) else render(json)
            }
            windowInsets
        }

        // Insets are dispatched during the first traversal, so this only fires on a
        // device that never dispatches any — better a fallback estimate than a
        // window that stays blank.
        lynxView.post { if (!rendered) render("") }
    }

    private fun render(initData: String) {
        rendered = true
        lynxView.renderTemplateUrl(templateUri, initData)
    }
    
    private fun buildLynxView(): LynxView {
        val viewBuilder = LynxViewBuilder()
        viewBuilder.setTemplateProvider(TemplateProvider(this))
        viewBuilder.isEnableGenericResourceFetcher = LynxBooleanOption.TRUE
        viewBuilder.setGenericResourceFetcher(GenericResourceFetcher())

        viewBuilder.addBehavior(object : Behavior("color-box-view") {
            override fun createUI(context: LynxContext): LynxColorBoxComponent {
                return LynxColorBoxComponent(context)
            }

            // Override this method to create an instance of Custom ShadowNode to put it in the
            // registry.
            override fun createShadowNode(): ShadowNode? {
                return LynxColorBoxShadowNode()
            }
        })

        viewBuilder.addBehavior(object : Behavior("stack-host-native") {
            override fun createUI(context: LynxContext): StackHostComponent {
                return StackHostComponent(context)
            }
        })

        viewBuilder.addBehavior(object : Behavior("stack-screen-native") {
            override fun createUI(context: LynxContext): StackScreenComponent {
                return StackScreenComponent(context)
            }
        })

        return viewBuilder.build(this)
    }
}
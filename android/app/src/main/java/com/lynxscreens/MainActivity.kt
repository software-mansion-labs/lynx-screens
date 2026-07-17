package com.lynxscreens

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
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
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        var uri = ""
        uri = if (BuildConfig.DEBUG == true) {
            "http://10.0.2.2:3000/main.lynx.bundle?fullscreen=true"
        } else {
            "main.lynx.bundle"
        }

        val lynxView = buildLynxView()
        setContentView(lynxView)

        lynxView.renderTemplateUrl(uri, "")
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
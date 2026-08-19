package com.lynxscreens.screens.header.subview

import android.content.Context
import android.view.View
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxElement
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynxscreens.screens.common.ShadowStateProxy
import java.lang.IllegalArgumentException
import java.lang.ref.WeakReference
import kotlin.properties.Delegates

@LynxElement(name = "ls-stack-header-subview")
internal class StackHeaderSubviewComponent(
    context: LynxContext,
) : UIGroup<StackHeaderSubviewView>(context),
    StackHeaderSubviewProviding {
    override var type: StackHeaderSubviewType = StackHeaderSubviewType.CENTER
        internal set

    override var collapseMode: StackHeaderSubviewCollapseMode by Delegates.observable(
        StackHeaderSubviewCollapseMode.OFF,
    ) { _, oldValue, newValue ->
        if (oldValue != newValue) {
            onStackHeaderSubviewChangeListener?.get()?.onStackHeaderSubviewChange()
        }
    }

    override val subviewView: View
        get() = view

    private val shadowStateProxy: ShadowStateProxy by lazy {
        ShadowStateProxy(lynxContext, sign, includesFrameSize = false)
    }

    // No shadow node is registered for the subview - the stored offset would only be
    // needed to correct Fabric-mounted frames on RN; on Lynx the Toolbar positions the
    // subview view natively. The proxy call is kept for parity with RNS.
    override fun updateContentOriginOffset(
        x: Int,
        y: Int,
    ) {
        shadowStateProxy.updateStateIfNeeded(contentOffsetX = x, contentOffsetY = y)
    }

    internal var onStackHeaderSubviewChangeListener: WeakReference<OnStackHeaderSubviewChangeListener>? = null

    override fun createView(context: Context?): StackHeaderSubviewView =
        StackHeaderSubviewView(context as LynxContext).also { subviewView ->
            subviewView.lynxSizeProvider = { Pair(width, height) }
        }

    // The Toolbar might have measured this view before the Lynx engine computed its layout -
    // ask it to re-measure once the size arrives (the view's requestLayout forwards to parent).
    override fun onLayoutUpdated() {
        super.onLayoutUpdated()
        view.requestLayout()
    }

    // Unlike Fabric, Lynx invokes prop setters also for absent/reset props, delivering null -
    // fall back to the default instead of throwing.
    @LynxProp(name = "type")
    fun setType(value: String?) {
        type =
            when (value) {
                "leading" -> StackHeaderSubviewType.LEADING
                "center", null -> StackHeaderSubviewType.CENTER
                "trailing" -> StackHeaderSubviewType.TRAILING
                "background" -> StackHeaderSubviewType.BACKGROUND
                else -> throw IllegalArgumentException("[RNScreens] Invalid StackHeaderSubview type: $value")
            }
    }

    @LynxProp(name = "collapseMode")
    fun setCollapseMode(value: String?) {
        collapseMode =
            when (value) {
                "off", null -> StackHeaderSubviewCollapseMode.OFF
                "parallax" -> StackHeaderSubviewCollapseMode.PARALLAX
                else -> throw IllegalArgumentException("[RNScreens] Invalid StackHeaderSubview collapseMode: $value")
            }
    }
}

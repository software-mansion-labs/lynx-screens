package com.lynxscreens.screens.header.subview

import android.annotation.SuppressLint
import android.view.View
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.view.AndroidView

@SuppressLint("ViewConstructor") // should never be restored
class StackHeaderSubviewView(
    lynxContext: LynxContext,
) : AndroidView(lynxContext) {
    /**
     * Provides the size computed by the Lynx layout engine for this subview.
     */
    internal var lynxSizeProvider: (() -> Pair<Int, Int>)? = null

    // Rely on Lynx layout instead of native Toolbar layout which stretches subview to match
    // parent. RNS caches the EXACTLY specs delivered by Fabric mounting; here the Lynx engine
    // already computed the subview size, so we report it when the Toolbar remeasures us.
    // No fallback to super.onMeasure - it would report the measure-spec size (up to the whole
    // toolbar); by using our logic, we enforce sizing from the Lynx engine, which is the
    // intended behavior.
    override fun onMeasure(
        widthMeasureSpec: Int,
        heightMeasureSpec: Int,
    ) {
        val (lynxWidth, lynxHeight) = lynxSizeProvider?.invoke() ?: Pair(0, 0)
        setMeasuredDimension(lynxWidth, lynxHeight)
    }

    override fun requestLayout() {
        super.requestLayout()

        // Invalidate layout flags.
        forceLayout()

        // Rely on parent to request the layout.
        (parent as? View)?.requestLayout()
    }
}

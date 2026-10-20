package com.lynxscreens.screens.host

import android.annotation.SuppressLint
import android.util.Log
import android.view.View
import android.view.ViewGroup
import com.lynx.tasm.behavior.LynxContext
import com.lynxscreens.screens.common.colorscheme.ColorScheme

@SuppressLint("ViewConstructor") // should never be restored
internal class StackHostView(
    private val lynxContext: LynxContext,
    private val container: StackContainer,
) : ViewGroup(lynxContext), StackContainerParent {
    private var isLayoutEnqueued = false

    internal var colorScheme: ColorScheme by container::colorScheme

    init {
        addView(container)
    }

    // The Lynx view pipeline does not propagate requestLayout up to the root view reliably,
    // so - like RNS does for ReactViewGroup's no-op requestLayout - we manually force a
    // measure and layout pass of the subtree.
    override fun requestLayout() {
        super.requestLayout()
        refreshLayout()
    }

    // On window configuration changes ViewRootImpl calls forceLayout() recursively on every view
    // in the hierarchy, bypassing requestLayout(). Lynx views never lay out their children during
    // framework traversals, so nothing would clear the force-layout flags in our subtree — and once
    // they are set, any subsequent requestLayout() from a descendant short-circuits before reaching
    // the override above, permanently disabling the manual pass. Schedule it from here as well.
    override fun forceLayout() {
        super.forceLayout()
        refreshLayout()
    }

    private fun refreshLayout() {
        if (!isLayoutEnqueued) {
            isLayoutEnqueued = true
            post {
                isLayoutEnqueued = false
                forceSubtreeMeasureAndLayoutPass()
            }
        }
    }

    private fun forceSubtreeMeasureAndLayoutPass() {
        measure(
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
        )

        layout(left, top, right, bottom)
    }

    override fun onAttachedToWindow() {
        Log.d(TAG, "StackHost [$id] attached to window")
        super.onAttachedToWindow()
    }

    override fun onMeasure(
        widthMeasureSpec: Int,
        heightMeasureSpec: Int,
    ) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        container.measure(widthMeasureSpec, heightMeasureSpec)
    }

    override fun onLayout(
        changed: Boolean,
        l: Int,
        t: Int,
        r: Int,
        b: Int,
    ) {
        container.layout(l, t, r, b)
    }

    override fun layoutContainerNow() {
        if (measuredWidth != container.measuredWidth || measuredHeight != container.measuredHeight) {
            container.measure(
                View.MeasureSpec.makeMeasureSpec(measuredWidth, MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(measuredHeight, MeasureSpec.EXACTLY),
            )
        }
        container.layout(left, top, right, bottom)
    }

    companion object {
        const val TAG = "StackHost"
    }
}

package com.lynxscreens.screens.host

import android.annotation.SuppressLint
import android.util.Log
import android.view.View
import android.view.ViewGroup
import com.lynx.tasm.behavior.LynxContext

@SuppressLint("ViewConstructor") // should never be restored
internal class StackHostView(
    private val lynxContext: LynxContext,
    private val container: StackContainer,
) : ViewGroup(lynxContext), StackContainerParent {
    private var isLayoutEnqueued = false

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

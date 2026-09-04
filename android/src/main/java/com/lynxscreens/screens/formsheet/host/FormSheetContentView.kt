package com.lynxscreens.screens.formsheet.host

import android.annotation.SuppressLint
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import com.lynx.tasm.behavior.LynxContext
import com.lynxscreens.screens.formsheet.interfaces.FormSheetContentSizeChangeDelegate
import com.lynxscreens.screens.formsheet.interfaces.FormSheetContentSizeChangeProvider

@SuppressLint("ViewConstructor")
internal class FormSheetContentView(
    context: LynxContext,
    private val onSizeChangedCallback: (width: Int, height: Int) -> Unit,
    private val dispatchLynxTouchEvent: (MotionEvent) -> Boolean,
) : ViewGroup(context) {
    internal var contentSizeChangeDelegate: FormSheetContentSizeChangeDelegate? = null

    override fun onViewAdded(child: View) {
        super.onViewAdded(child)
        (child as? FormSheetContentSizeChangeProvider)?.setContentSizeChangeDelegate(contentSizeChangeDelegate)
    }

    override fun onViewRemoved(child: View) {
        super.onViewRemoved(child)
        (child as? FormSheetContentSizeChangeProvider)?.setContentSizeChangeDelegate(null)
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        if (w != oldw || h != oldh) onSizeChangedCallback(w, h)
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val width = MeasureSpec.getSize(widthMeasureSpec)
        val height = MeasureSpec.getSize(heightMeasureSpec)
        for (index in 0 until childCount) {
            val child = getChildAt(index)
            val childHeightMode =
                if (child is FormSheetContentSizeChangeProvider) MeasureSpec.AT_MOST else MeasureSpec.EXACTLY
            child.measure(
                MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(height, childHeightMode),
            )
        }
        setMeasuredDimension(width, height)
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        for (index in 0 until childCount) {
            val child = getChildAt(index)
            child.layout(0, 0, child.measuredWidth, child.measuredHeight)
        }
    }

    override fun dispatchTouchEvent(event: MotionEvent): Boolean {
        // Adaptation: the dialog is a separate Android window, outside LynxView's normal dispatcher.
        val lynxConsumed = dispatchLynxTouchEvent(event)
        return super.dispatchTouchEvent(event) || lynxConsumed
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean = true
}

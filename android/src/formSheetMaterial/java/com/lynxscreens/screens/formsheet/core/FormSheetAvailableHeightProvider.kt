package com.lynxscreens.screens.formsheet.core

import android.content.Context
import android.view.View

/** Reports the height Material's sheet is about to be measured against. */
internal class FormSheetAvailableHeightProvider(context: Context) : View(context) {
    internal fun interface OnAvailableHeightMeasuredListener {
        fun onAvailableHeightMeasured(height: Int)
    }

    internal var availableHeightListener: OnAvailableHeightMeasuredListener? = null

    init {
        visibility = INVISIBLE
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val height = MeasureSpec.getSize(heightMeasureSpec)
        if (MeasureSpec.getMode(heightMeasureSpec) != MeasureSpec.UNSPECIFIED && height > 0) {
            availableHeightListener?.onAvailableHeightMeasured(height)
        }
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    }
}

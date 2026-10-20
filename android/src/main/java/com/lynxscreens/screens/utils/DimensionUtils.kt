package com.lynxscreens.screens.utils

import android.content.Context
import android.util.TypedValue
import android.view.View

internal fun View.dpToPx(dp: Float): Float =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, resources.displayMetrics)

/**
 * Converts an SP value to pixels using the density of the display this [View] is
 * attached to (including the current font scale). Uses the view's own resources
 * rather than a process-global density.
 */
internal fun View.spToPx(sp: Float): Float = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, sp, resources.displayMetrics)

internal fun resolveDimensionAttr(
    context: Context,
    attrId: Int,
): Int {
    val typedValue = TypedValue()
    require(context.theme.resolveAttribute(attrId, typedValue, true)) {
        "[RNScreens] Unable to resolve Material theme dimension."
    }
    return TypedValue.complexToDimensionPixelSize(
        typedValue.data,
        context.resources.displayMetrics,
    )
}

package com.lynxscreens.screens.utils

import android.content.Context
import android.util.TypedValue
import android.view.View

internal fun View.dpToPx(dp: Float): Float =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, resources.displayMetrics)

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

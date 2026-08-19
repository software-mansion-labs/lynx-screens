package com.lynxscreens.screens.formsheet

internal fun resolveFormSheetDimHeight(
    visibleSheetHeight: Int,
    detentHeights: List<Int>,
    presentationTargetDetentIndex: Int?,
): Int = detentHeights.getOrNull(presentationTargetDetentIndex ?: -1) ?: visibleSheetHeight

internal fun calculateFormSheetDimAmount(
    visibleSheetHeight: Int,
    detentHeights: List<Int>,
    largestUndimmedDetentIndex: Int,
    maximumDimAmount: Float,
): Float {
    val baseAmount =
        when {
            largestUndimmedDetentIndex == FORM_SHEET_NEVER_DIMMED -> 0f
            largestUndimmedDetentIndex == FORM_SHEET_ALWAYS_DIMMED -> maximumDimAmount
            detentHeights.isEmpty() -> 0f
            else -> {
                val index = largestUndimmedDetentIndex.coerceIn(0, detentHeights.lastIndex)
                val threshold = detentHeights[index]
                if (visibleSheetHeight <= threshold) {
                    0f
                } else {
                    val upper = detentHeights[(index + 1).coerceAtMost(detentHeights.lastIndex)]
                    if (upper <= threshold) {
                        maximumDimAmount
                    } else {
                        val progress =
                            ((visibleSheetHeight - threshold).toFloat() / (upper - threshold))
                                .coerceIn(0f, 1f)
                        maximumDimAmount * progress
                    }
                }
            }
        }

    if (detentHeights.isEmpty() || largestUndimmedDetentIndex != FORM_SHEET_ALWAYS_DIMMED) {
        return baseAmount
    }
    val fadeStartHeight = detentHeights.firstOrNull { it > 0 } ?: return 0f
    return baseAmount * (visibleSheetHeight.toFloat() / fadeStartHeight).coerceIn(0f, 1f)
}

private const val FORM_SHEET_ALWAYS_DIMMED = -1
private const val FORM_SHEET_NEVER_DIMMED = -2

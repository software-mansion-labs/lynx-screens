package com.lynxscreens.screens.formsheet

internal fun resolveFormSheetAnchorTops(
    parentHeight: Int,
    sheetHeight: Int,
    detentHeights: List<Int>,
    fitToContents: Boolean,
): List<Int> {
    val heights =
        if (fitToContents) {
            listOf(sheetHeight)
        } else {
            detentHeights
        }
    val rawTops =
        heights
        .map { height -> parentHeight - height.coerceIn(0, parentHeight) }
        .sorted()
    if (parentHeight < rawTops.lastIndex) {
        return rawTops
    }
    val resolvedTops = ArrayList<Int>(rawTops.size)
    rawTops.forEachIndexed { index, top ->
        val minimumTop = if (index == 0) 0 else resolvedTops.last() + 1
        val maximumTop = parentHeight - (rawTops.lastIndex - index)
        resolvedTops += top.coerceIn(minimumTop, maximumTop)
    }
    return resolvedTops
}

internal fun selectFormSheetAnchorTop(
    anchorTops: List<Int>,
    currentTop: Int,
    verticalVelocity: Float,
    minimumFlingVelocity: Float,
): Int {
    require(anchorTops.isNotEmpty())
    return when {
        verticalVelocity < 0f && -verticalVelocity >= minimumFlingVelocity ->
            anchorTops.lastOrNull { it < currentTop } ?: anchorTops.first()
        verticalVelocity > 0f && verticalVelocity >= minimumFlingVelocity ->
            anchorTops.firstOrNull { it > currentTop } ?: anchorTops.last()
        else -> anchorTops.minByOrNull { top -> kotlin.math.abs(top - currentTop) } ?: anchorTops.first()
    }
}

package com.lynxscreens.screens.formsheet.model

internal class FormSheetDetents(rawDetents: List<Double>) {
    private val detents = rawDetents.toList()

    init {
        require(detents.isNotEmpty()) { "[RNScreens] At least one detent must be provided." }
        require(detents.size <= MAX_DETENTS) {
            "[RNScreens] Maximum of $MAX_DETENTS detents supported, got ${detents.size}."
        }

        // A single -1 detent selects fitToContents; all other values are height fractions.
        if (!isFitToContents) {
            detents.forEach {
                require(it in 0.0..1.0) { "[RNScreens] Detent values must be within 0.0 and 1.0, got $it." }
            }
            require(detents == detents.distinct().sorted()) {
                "[RNScreens] Detents must be sorted in strictly ascending order."
            }
        }
    }

    internal val isFitToContents: Boolean
        get() = detents.size == 1 && detents[0] == FIT_TO_CONTENTS_DETENT_VALUE

    internal val count: Int
        get() = detents.size

    private fun heightAt(index: Int, containerHeight: Int): Int = (detents[index] * containerHeight).toInt()

    internal fun firstHeight(containerHeight: Int): Int = heightAt(0, containerHeight)

    internal fun maxAllowedHeight(containerHeight: Int): Int = heightAt(count - 1, containerHeight)

    internal fun maxAllowedHeightForFitToContents(
        containerHeight: Int,
        contentHeight: Int,
        bottomInset: Int,
    ): Int = if (contentHeight <= 0) containerHeight else (contentHeight + bottomInset).coerceAtMost(containerHeight)

    internal fun halfExpandedRatio(): Float {
        check(count == MAX_DETENTS) { "[RNScreens] Exactly $MAX_DETENTS detents are required for halfExpandedRatio." }
        return (detents[1] / detents[2]).toFloat()
    }

    internal fun expandedOffsetFromTop(containerHeight: Int, topInset: Int = 0): Int {
        check(count == MAX_DETENTS) {
            "[RNScreens] Exactly $MAX_DETENTS detents are required for expandedOffsetFromTop."
        }
        return ((1 - detents[2]) * containerHeight).toInt() + topInset
    }

    private fun largestDetentTopOffset(containerHeight: Int): Int = containerHeight - maxAllowedHeight(containerHeight)

    internal fun sheetContainerHeight(
        containerHeight: Int,
        topInset: Int,
        bottomInset: Int,
        contentHeight: Int = 0,
    ): Int {
        if (isFitToContents) {
            return if (contentHeight <= 0) {
                (containerHeight - topInset - bottomInset).coerceAtLeast(0)
            } else {
                contentHeight.coerceAtMost(containerHeight)
            }
        }
        val topOverlap = (topInset - largestDetentTopOffset(containerHeight)).coerceAtLeast(0)
        return (maxAllowedHeight(containerHeight) - topOverlap - bottomInset).coerceAtLeast(0)
    }

    companion object {
        const val MAX_DETENTS = 3
        const val FIT_TO_CONTENTS_DETENT_VALUE = -1.0
    }
}

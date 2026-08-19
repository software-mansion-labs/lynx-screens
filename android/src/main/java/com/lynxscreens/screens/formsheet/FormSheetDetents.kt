package com.lynxscreens.screens.formsheet

internal class FormSheetDetents private constructor(
    private val values: List<Double>,
) {
    val count: Int
        get() = values.size

    val isFitToContents: Boolean
        get() = values == listOf(FIT_TO_CONTENTS)

    fun heightAt(
        index: Int,
        availableHeight: Int,
    ): Int = (values[index] * availableHeight).toInt()

    fun largestHeight(availableHeight: Int): Int = heightAt(values.lastIndex, availableHeight)

    companion object {
        private const val FIT_TO_CONTENTS = -1.0
        private const val MAX_DETENTS = 3

        fun parse(rawValues: List<Double>): FormSheetDetents {
            val values = if (rawValues.isEmpty()) listOf(1.0) else rawValues
            return try {
                require(values.size <= MAX_DETENTS) {
                    "Maximum of $MAX_DETENTS detents supported, got ${values.size}."
                }
                val isFitToContents = values == listOf(FIT_TO_CONTENTS)
                if (!isFitToContents) {
                    require(values.all { it in 0.0..1.0 }) {
                        "Detent values must be within 0.0 and 1.0."
                    }
                    require(values == values.distinct().sorted()) {
                        "Detents must be sorted in strictly ascending order."
                    }
                }
                FormSheetDetents(values)
            } catch (error: IllegalArgumentException) {
                android.util.Log.e("RNScreens", "[RNScreens] Invalid FormSheet detents: ${error.message} Falling back to [1.0].")
                FormSheetDetents(listOf(1.0))
            }
        }
    }
}

internal data class FormSheetDetentGeometry(
    val availableHeight: Int,
    val sheetHeights: List<Int>,
)

internal fun FormSheetDetents.resolveGeometry(
    windowHeight: Int,
): FormSheetDetentGeometry {
    val availableHeight = windowHeight.coerceAtLeast(1)
    val sheetHeights =
        if (isFitToContents) {
            emptyList()
        } else {
            List(count) { index -> heightAt(index, availableHeight) }
        }
    return FormSheetDetentGeometry(availableHeight, sheetHeights)
}

internal fun visibleSheetSurfaceHeight(
    parentHeight: Int,
    sheetTop: Int,
    maximumHeight: Int,
): Int = (parentHeight - sheetTop).coerceIn(0, maximumHeight.coerceAtLeast(0))

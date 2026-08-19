package com.lynxscreens.screens.formsheet

import org.junit.Assert.assertEquals
import org.junit.Test

class FormSheetAnchorsTest {
    @Test
    fun `three detents resolve to their exact screen heights`() {
        assertEquals(
            listOf(0, 400, 700),
            resolveFormSheetAnchorTops(
                parentHeight = 1000,
                sheetHeight = 1000,
                detentHeights = listOf(300, 600, 1000),
                fitToContents = false,
            ),
        )
    }

    @Test
    fun `release direction selects the next detent`() {
        val anchors = listOf(0, 400, 700)

        assertEquals(
            400,
            selectFormSheetAnchorTop(anchors, currentTop = 200, verticalVelocity = 100f, minimumFlingVelocity = 50f),
        )
        assertEquals(
            400,
            selectFormSheetAnchorTop(anchors, currentTop = 600, verticalVelocity = -100f, minimumFlingVelocity = 50f),
        )
        assertEquals(
            700,
            selectFormSheetAnchorTop(anchors, currentTop = 620, verticalVelocity = 10f, minimumFlingVelocity = 50f),
        )
    }

    @Test
    fun `fit to contents uses the measured sheet height`() {
        assertEquals(
            listOf(650),
            resolveFormSheetAnchorTops(
                parentHeight = 1000,
                sheetHeight = 350,
                detentHeights = emptyList(),
                fitToContents = true,
            ),
        )
    }

    @Test
    fun `pixel rounding keeps each configured detent addressable`() {
        assertEquals(
            listOf(0, 1, 2),
            resolveFormSheetAnchorTops(
                parentHeight = 1000,
                sheetHeight = 1000,
                detentHeights = listOf(999, 1000, 1000),
                fitToContents = false,
            ),
        )
    }

    @Test
    fun `tiny parent does not fail while resolving anchors`() {
        assertEquals(
            listOf(0, 0, 1),
            resolveFormSheetAnchorTops(
                parentHeight = 1,
                sheetHeight = 1,
                detentHeights = listOf(0, 1, 1),
                fitToContents = false,
            ),
        )
    }
}

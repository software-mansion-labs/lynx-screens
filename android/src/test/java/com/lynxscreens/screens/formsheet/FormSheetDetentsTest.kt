package com.lynxscreens.screens.formsheet

import org.junit.Assert.assertEquals
import org.junit.Test

class FormSheetDetentsTest {
    @Test
    fun `sheet detents use the edge to edge window`() {
        val detents = FormSheetDetents.parse(listOf(0.2, 0.4, 0.8))
        val geometry = detents.resolveGeometry(windowHeight = 1200)

        assertEquals(1200, geometry.availableHeight)
        assertEquals(listOf(240, 480, 960), geometry.sheetHeights)
        assertEquals(480, visibleSheetSurfaceHeight(1200, 720, 960))
    }
}

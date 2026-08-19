package com.lynxscreens.screens.formsheet

import org.junit.Assert.assertEquals
import org.junit.Test

class FormSheetDimmingTest {
    @Test
    fun `pending presentation dims for the selected detent`() {
        assertEquals(
            600,
            resolveFormSheetDimHeight(
                visibleSheetHeight = 300,
                detentHeights = listOf(300, 600),
                presentationTargetDetentIndex = 1,
            ),
        )
    }

    @Test
    fun `dimming without a presentation target tracks the visible sheet height`() {
        assertEquals(
            450,
            resolveFormSheetDimHeight(
                visibleSheetHeight = 450,
                detentHeights = listOf(300, 600),
                presentationTargetDetentIndex = null,
            ),
        )
    }

    @Test
    fun `dim amount interpolates above the largest undimmed detent`() {
        val detents = listOf(300, 600, 900)

        assertDimAmount(0f, visibleHeight = 300, detents = detents, largestUndimmedIndex = 0)
        assertDimAmount(0.25f, visibleHeight = 450, detents = detents, largestUndimmedIndex = 0)
        assertDimAmount(0.5f, visibleHeight = 600, detents = detents, largestUndimmedIndex = 0)
        assertDimAmount(0.5f, visibleHeight = 900, detents = detents, largestUndimmedIndex = 0)
    }

    @Test
    fun `always dimmed backdrop fades across the full dismiss drag`() {
        val detents = listOf(300, 600)

        assertDimAmount(0.5f, visibleHeight = 300, detents = detents, largestUndimmedIndex = -1)
        assertDimAmount(0.375f, visibleHeight = 225, detents = detents, largestUndimmedIndex = -1)
        assertDimAmount(0.25f, visibleHeight = 150, detents = detents, largestUndimmedIndex = -1)
        assertDimAmount(0.125f, visibleHeight = 75, detents = detents, largestUndimmedIndex = -1)
        assertDimAmount(0f, visibleHeight = 0, detents = detents, largestUndimmedIndex = -1)
    }

    @Test
    fun `never dimmed backdrop remains clear`() {
        assertDimAmount(0f, visibleHeight = 600, detents = listOf(300, 600), largestUndimmedIndex = -2)
    }

    @Test
    fun `unresolved controlled dimming starts clear`() {
        assertDimAmount(0f, visibleHeight = 600, detents = emptyList(), largestUndimmedIndex = 0)
    }

    @Test
    fun `small detent fades completely before becoming hidden`() {
        assertDimAmount(0.25f, visibleHeight = 15, detents = listOf(30), largestUndimmedIndex = -1)
        assertDimAmount(0f, visibleHeight = 0, detents = listOf(30), largestUndimmedIndex = -1)
    }

    @Test
    fun `zero height detent fades as it approaches hidden`() {
        assertDimAmount(0.25f, visibleHeight = 150, detents = listOf(0, 300), largestUndimmedIndex = -1)
        assertDimAmount(0f, visibleHeight = 0, detents = listOf(0, 300), largestUndimmedIndex = -1)
    }

    private fun assertDimAmount(
        expected: Float,
        visibleHeight: Int,
        detents: List<Int>,
        largestUndimmedIndex: Int,
    ) {
        assertEquals(
            expected,
            calculateFormSheetDimAmount(
                visibleSheetHeight = visibleHeight,
                detentHeights = detents,
                largestUndimmedDetentIndex = largestUndimmedIndex,
                maximumDimAmount = 0.5f,
            ),
            0.0001f,
        )
    }
}

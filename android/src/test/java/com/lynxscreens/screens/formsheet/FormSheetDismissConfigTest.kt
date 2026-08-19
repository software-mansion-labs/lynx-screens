package com.lynxscreens.screens.formsheet

import com.lynx.react.bridge.Dynamic
import com.lynx.react.bridge.DynamicFromArray
import com.lynx.react.bridge.JavaOnlyArray
import org.junit.Assert.assertEquals
import org.junit.Test

class FormSheetDismissConfigTest {
    @Test
    fun `true prevents every native dismiss channel`() {
        assertEquals(
            FormSheetDismissChannel.values().toSet(),
            parsePreventNativeDismissChannels(dynamic(true)),
        )
    }

    @Test
    fun `false and null do not prevent native dismissal`() {
        assertEquals(emptySet<FormSheetDismissChannel>(), parsePreventNativeDismissChannels(dynamic(false)))
        assertEquals(emptySet<FormSheetDismissChannel>(), parsePreventNativeDismissChannels(null))
    }

    @Test
    fun `array prevents only recognized channels`() {
        assertEquals(
            setOf(FormSheetDismissChannel.BACK, FormSheetDismissChannel.DRAG),
            parsePreventNativeDismissChannels(
                dynamic(JavaOnlyArray.of("back", "drag", "unknown", 1)),
            ),
        )
    }

    private fun dynamic(value: Any): Dynamic =
        DynamicFromArray(JavaOnlyArray.of(value), 0)
}

package com.lynxscreens.screens.helpers

import androidx.annotation.UiThread
import java.util.concurrent.atomic.AtomicInteger

interface ViewIdProviding {
    fun generateViewId(): Int
}

@UiThread
private class ReverseIdGenerator : ViewIdProviding {
    private var currentId = Int.MAX_VALUE

    /**
     * In Lynx, view IDs can be assigned based on the 'sign' attribute.
     * The 'sign' value starts at 11 for the <page> component and increments
     * using consecutive numbers. To avoid potential ID collisions,
     * this generator assigns IDs from the opposite end of the range
     * (starting from Int.MAX_VALUE and counting downwards).
     *
     * Reference: https://github.com/lynx-family/lynx/blob/3.6.0/platform/android/lynx_android/src/main/java/com/lynx/tasm/behavior/ui/accessibility/LynxAccessibilityHelper.java#L171-L172
     */
    override fun generateViewId(): Int = currentId--
}

@UiThread
internal object ViewIdGenerator : ViewIdProviding {
    /**
     * Set this field to customize view ids utilized by the library.
     */
    var externalGenerator: ViewIdProviding? = null
    private val defaultGenerator: ViewIdProviding = ReverseIdGenerator()

    override fun generateViewId(): Int {
        externalGenerator?.let { return it.generateViewId() }
        return defaultGenerator.generateViewId()
    }
}

package com.lynxscreens.screens.common.trace

import com.lynxscreens.screens.formsheet.host.FormSheetHostView
import com.lynxscreens.screens.host.StackContainer
import org.junit.Assert.assertFalse
import org.junit.Test

class NavigationTraceStoreOwnershipTest {
    @Test
    fun nativeViewsDoNotReceiveTraceStoreThroughConstructor() {
        assertFalse(StackContainer::class.java.hasTraceStoreConstructorParameter())
        assertFalse(FormSheetHostView::class.java.hasTraceStoreConstructorParameter())
    }

    private fun Class<*>.hasTraceStoreConstructorParameter(): Boolean =
        declaredConstructors.any { constructor ->
            constructor.parameterTypes.contains(NavigationTraceContextStore::class.java)
        }
}

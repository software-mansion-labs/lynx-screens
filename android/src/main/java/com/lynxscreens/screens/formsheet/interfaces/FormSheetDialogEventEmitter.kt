package com.lynxscreens.screens.formsheet.interfaces

import com.lynxscreens.screens.common.event.ViewAppearanceEventEmitter

internal interface FormSheetDialogEventEmitter : ViewAppearanceEventEmitter {
    fun emitOnDismissEvent()

    fun emitOnNativeDismissEvent()

    fun emitOnNativeDismissPreventedEvent()

    fun emitOnDetentChanged(index: Int)
}

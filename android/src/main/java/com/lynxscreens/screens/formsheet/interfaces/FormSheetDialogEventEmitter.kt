package com.lynxscreens.screens.formsheet.interfaces

import com.lynxscreens.screens.common.event.ViewAppearanceEventEmitter

public interface FormSheetDialogEventEmitter : ViewAppearanceEventEmitter {
    fun emitOnDismissEvent()

    fun emitOnNativeDismissEvent()

    fun emitOnNativeDismissPreventedEvent()

    fun emitOnDetentChanged(index: Int)
}

package com.lynxscreens.screens.formsheet.interfaces

import com.lynxscreens.screens.common.event.ViewAppearanceEventEmitter

// Adaptation: external controller backends emit events through this public interface.
public interface FormSheetDialogEventEmitter : ViewAppearanceEventEmitter {
    fun emitOnDismissEvent()

    fun emitOnNativeDismissEvent()

    fun emitOnNativeDismissPreventedEvent()

    fun emitOnDetentChanged(index: Int)
}

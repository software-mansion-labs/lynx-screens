package com.lynxscreens.screens.common.event

public interface ViewAppearanceEventEmitter {
    fun emitOnWillAppear()

    fun emitOnDidAppear()

    fun emitOnWillDisappear()

    fun emitOnDidDisappear()
}

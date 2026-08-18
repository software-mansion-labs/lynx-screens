package com.lynxscreens.screens.header.config

import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.event.LynxCustomEvent

internal class StackHeaderConfigEventEmitter(
    private val lynxContext: LynxContext,
    private val sign: Int,
) {
    internal fun emitOnToolbarMenuItemClicked(id: String) {
        val event = LynxCustomEvent(sign, EVENT_ON_TOOLBAR_MENU_ITEM_CLICKED)
        event.addDetail("id", id)
        lynxContext.eventEmitter.sendCustomEvent(event)
    }

    companion object {
        private const val EVENT_ON_TOOLBAR_MENU_ITEM_CLICKED = "OnToolbarMenuItemClicked"
    }
}

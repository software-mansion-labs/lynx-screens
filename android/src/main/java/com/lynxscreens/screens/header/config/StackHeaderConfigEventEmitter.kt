package com.lynxscreens.screens.header.config

import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.event.LynxCustomEvent

internal class StackHeaderConfigEventEmitter(
    private val lynxContext: LynxContext,
    private val sign: Int,
) {
    internal fun emitOnToolbarMenuItemPress(id: String) {
        val event = LynxCustomEvent(sign, EVENT_ON_TOOLBAR_MENU_ITEM_PRESS)
        event.addDetail("id", id)
        lynxContext.eventEmitter.sendCustomEvent(event)
    }

    internal fun emitOnToolbarMenuGroupSelectionChange(
        groupId: String,
        selectedIds: List<String>,
    ) {
        val event = LynxCustomEvent(sign, EVENT_ON_TOOLBAR_MENU_GROUP_SELECTION_CHANGE)
        event.addDetail("groupId", groupId)
        event.addDetail("selectedIds", ArrayList(selectedIds))
        lynxContext.eventEmitter.sendCustomEvent(event)
    }

    companion object {
        private const val EVENT_ON_TOOLBAR_MENU_ITEM_PRESS = "OnToolbarMenuItemPress"
        private const val EVENT_ON_TOOLBAR_MENU_GROUP_SELECTION_CHANGE = "OnToolbarMenuGroupSelectionChange"
    }
}

package com.lynxscreens.screens.header.toolbar.update

import com.lynxscreens.screens.header.toolbar.model.StackHeaderToolbarMenuItemIconSource

/**
 * A single toolbar menu element update carried by an `updateToolbarMenuElements`
 * UI method call, before its icon (if any) has been resolved.
 */
internal data class StackHeaderToolbarMenuElementRawUpdate(
    val id: String,
    val options: StackHeaderToolbarMenuElementOptions,
    val iconSource: StackHeaderToolbarMenuItemIconSource?,
)

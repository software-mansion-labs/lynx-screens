package com.lynxscreens.screens.common

/**
 * Lynx counterpart of the Fabric StateWrapper channel: shadow nodes that accept
 * frame/offset updates pushed from the native side implement this interface, and
 * [ShadowStateProxy] delivers the updates to them.
 */
internal interface ShadowStateUpdating {
    fun updateState(
        contentOffsetX: Float,
        contentOffsetY: Float,
        frameWidth: Float,
        frameHeight: Float,
    )
}

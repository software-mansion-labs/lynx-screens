package com.lynxscreens.screens.header.config

import com.lynxscreens.screens.header.subview.StackHeaderSubviewType

interface StackHeaderDelegate {
    fun onHeaderFrameChanged(
        width: Int,
        height: Int,
        contentOffsetY: Int,
    )

    fun onMenuItemClicked(id: String)

    fun onSubviewOriginChanged(
        type: StackHeaderSubviewType,
        x: Int,
        y: Int,
    )
}

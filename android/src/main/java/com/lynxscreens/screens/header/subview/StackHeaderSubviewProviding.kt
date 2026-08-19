package com.lynxscreens.screens.header.subview

import android.view.View

interface StackHeaderSubviewProviding {
    val type: StackHeaderSubviewType
    val collapseMode: StackHeaderSubviewCollapseMode

    // Named `view` in RNS; renamed because LynxUI's final Java getView() clashes
    // with a Kotlin interface property of that name.
    val subviewView: View

    fun updateContentOriginOffset(
        x: Int,
        y: Int,
    )
}

package com.lynxscreens.screens.header.config

internal fun interface OnHeaderConfigurationAttachListener {
    fun onHeaderConfigAttached(
        provider: StackHeaderConfigurationProviding?,
        delegate: StackHeaderDelegate?,
    )
}

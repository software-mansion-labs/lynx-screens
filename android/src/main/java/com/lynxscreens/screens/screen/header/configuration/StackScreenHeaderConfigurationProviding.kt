package com.lynxscreens.screens.screen.header.configuration

internal interface StackScreenHeaderConfigurationProviding {
    val headerType: StackScreenHeaderType
    val title: String
    val isHidden: Boolean
    val isTransparent: Boolean
}

package com.lynxscreens.screens.host

import com.lynxscreens.screens.screen.StackScreenComponent

internal sealed class StackOperation

internal class PushOperation(
    val screen: StackScreenComponent,
) : StackOperation()

internal class PopOperation(
    val screen: StackScreenComponent,
) : StackOperation()

package com.lynxscreens.screens.screen

import android.annotation.SuppressLint
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.view.AndroidView

@SuppressLint("ViewConstructor") // should never be restored
class StackScreenView(
    private val lynxContext: LynxContext,
) : AndroidView(lynxContext) {}

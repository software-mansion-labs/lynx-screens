package com.lynxscreens.screens.formsheet.host

import android.annotation.SuppressLint
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.view.AndroidView

@SuppressLint("ViewConstructor")
internal class FormSheetHostView(context: LynxContext) : AndroidView(context) {
    // Adaptation: children are laid out by Lynx after being teleported to the dialog window.
    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) = Unit
}

package com.lynxscreens.screens.formsheet.contentwrapper

import android.content.Context
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxElement
import com.lynx.tasm.behavior.ui.UIGroup

@LynxElement(name = "ls-form-sheet-content-wrapper")
internal class FormSheetContentWrapperComponent(context: LynxContext) : UIGroup<FormSheetContentWrapperView>(context) {
    override fun createView(context: Context?): FormSheetContentWrapperView =
        FormSheetContentWrapperView(context as LynxContext)
}

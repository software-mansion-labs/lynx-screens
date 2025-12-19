package com.lynxscreens.elements

import android.content.Context
import android.graphics.Color
import android.view.View
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.ui.LynxUI

class LynxColorBoxViewManager(context: LynxContext) : LynxUI<View>(context) {
    override fun createView(context: Context): View {
        return View(context)
    }

    @LynxProp(name = "backgroundColorHex")
    fun setBackgroundColorHex(value: String) {
        try {
            val color = Color.parseColor(value)
            mView.setBackgroundColor(color)
        } catch (e: IllegalArgumentException) {
        }
    }
}

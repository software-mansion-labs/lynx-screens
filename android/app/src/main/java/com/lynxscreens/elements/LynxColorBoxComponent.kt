package com.lynxscreens.elements

import android.content.Context
import android.graphics.Color
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynx.tasm.behavior.ui.view.AndroidView

class LynxColorBoxComponent(context: LynxContext) : UIGroup<AndroidView>(context) {
    override fun createView(context: Context?): AndroidView = AndroidView(context)

    override fun onLayoutUpdated() {
        super.onLayoutUpdated()

        lynxContext.findShadowNodeBySign(sign)?.let {
            if (it is LynxColorBoxShadowNode) {
                val oldWidth = this.width
                val oldHeight = this.height

                val (newWidth, newHeight) = adjustViewSize()

                if (oldWidth != newWidth || oldHeight != newHeight) {
                    it.updateSize(newWidth, newHeight)
                }
            }
        }
    }

    private fun adjustViewSize(): Pair<Int, Int> {
        val sizeDp = 300

        val density = mContext.resources.displayMetrics.density

        val widthPx = (sizeDp * density).toInt()
        val heightPx = (sizeDp * density).toInt()

        return Pair(widthPx, heightPx)
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

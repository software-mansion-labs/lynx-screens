package com.lynxscreens.elements

import android.content.Context
import android.graphics.Color
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynx.tasm.behavior.ui.view.AndroidView

class LynxColorBoxComponent(context: LynxContext) : UIGroup<AndroidView>(context) {
    override fun createView(context: Context?): AndroidView = AndroidView(context)

    // Note: This doesn't seem to be good place to apply updates (considering Screens impl), but
    // it's sufficient for basic testing and demonstration purposes.
    override fun onLayoutUpdated() {
        super.onLayoutUpdated()

        // Retrieve the corresponding ShadowNode from the Lynx context by node sign (unique ID)
        lynxContext.findShadowNodeBySign(sign)?.let {
            // Ensure that the retrieved node is an instance of our custom ShadowNode class
            if (it is LynxColorBoxShadowNode) {
                // Store the previously set size
                val oldWidth = this.width
                val oldHeight = this.height

                // Perform some calculations for updating the size
                val (newWidth, newHeight) = adjustViewSize()

                // If the size has changed, update the ShadowNode
                if (oldWidth != newWidth || oldHeight != newHeight) {
                    it.updateSize(newWidth, newHeight)
                }
            }
        }
    }

    // Returns a hardcoded width and height for testing purposes
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

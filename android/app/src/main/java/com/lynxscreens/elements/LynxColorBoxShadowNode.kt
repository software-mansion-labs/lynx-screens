package com.lynxscreens.elements

import com.lynx.tasm.behavior.LynxShadowNode
import com.lynx.tasm.behavior.shadow.AlignContext
import com.lynx.tasm.behavior.shadow.AlignParam
import com.lynx.tasm.behavior.shadow.CustomMeasureFunc
import com.lynx.tasm.behavior.shadow.MeasureContext
import com.lynx.tasm.behavior.shadow.MeasureParam
import com.lynx.tasm.behavior.shadow.MeasureResult
import com.lynx.tasm.behavior.shadow.NativeLayoutNodeRef
import com.lynx.tasm.behavior.shadow.ShadowNode
import kotlin.math.ceil

// Registers this custom ShadowNode implementation for the "color-box-view" component
@LynxShadowNode(tagName = "color-box-view")
class LynxColorBoxShadowNode : ShadowNode(), CustomMeasureFunc {
    private var mUIHeight:Int = 0
    private var mUIWidth:Int = 0

    init {
        setCustomMeasureFunc(this)
    }

    internal fun updateSize(updatedWitdh: Int, updatedHeight: Int) {
        var dirty = false
        if (updatedHeight != mUIHeight) {
            mUIHeight = updatedHeight
            dirty = true
        }

        if (updatedWitdh != mUIWidth) {
            mUIWidth = updatedHeight
            dirty = true
        }

        if (dirty) {
            this.resetIsDirty()
            this.markDirty()
            this.setNeedsLayoutForce()
        }
    }

    // Called during the layout pass when `LayoutObject::ReLayoutWithConstraints` triggers `UpdateMeasure`.
    // Since we define a custom measurement method, we take full control over
    // sizing for the entire layout subtree. This method calculates and returns
    // the size of the native view and recursively measures child nodes.
    override fun measure(param: MeasureParam?, context: MeasureContext?): MeasureResult {
        val width = ceil(mUIWidth.toDouble()).toFloat()
        val height = ceil(mUIHeight.toDouble()).toFloat()

        if (childCount > 0) {
            val firstChild = getChildAt(0)
            if (firstChild is NativeLayoutNodeRef) {
                val childParam = param ?: MeasureParam()
                childParam.mHeight = height
                childParam.mWidth = width

                firstChild.measureNativeNode(context, childParam)
            }
        }

        return MeasureResult(width, height)
    }

    // Called during the layout pass when `LayoutObject::ReLayoutWithConstraints` triggers `UpdateAlignment`.
    // By defining a custom alignment method, we take control over positioning
    // for the current subtree. Here, we offset the content by a fixed amount.
    override fun align(param: AlignParam?, context: AlignContext?) {
        val density = mContext?.resources?.displayMetrics?.density
        val offset = (100 * (density ?: 0f))

        val alignParam = param ?: AlignParam()

        alignParam.leftOffset = offset
        alignParam.topOffset = offset

        if (childCount > 0) {
            val firstChild = getChildAt(0)
            if (firstChild is NativeLayoutNodeRef) {
                firstChild.alignNativeNode(context, alignParam)
            }
        }
    }
}

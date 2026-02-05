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
package com.lynxscreens.screens.screen

import com.lynx.tasm.behavior.LynxShadowNode
import com.lynx.tasm.behavior.shadow.AlignContext
import com.lynx.tasm.behavior.shadow.AlignParam
import com.lynx.tasm.behavior.shadow.CustomMeasureFunc
import com.lynx.tasm.behavior.shadow.MeasureContext
import com.lynx.tasm.behavior.shadow.MeasureMode
import com.lynx.tasm.behavior.shadow.MeasureParam
import com.lynx.tasm.behavior.shadow.MeasureResult
import com.lynx.tasm.behavior.shadow.NativeLayoutNodeRef
import com.lynx.tasm.behavior.shadow.ShadowNode

/**
 * Counterpart of RNS RNSStackScreenShadowNode (+ State & ComponentDescriptor). Instead of the
 * Fabric state round-trip (adopt/setSize + getContentOriginOffset), it takes over measurement
 * and alignment of the StackScreen subtree via Lynx's CustomMeasureFunc:
 * - measure: children are measured with the native-measured frame of the screen view (which is
 *   constrained by the header's ScrollingViewBehavior), falling back to engine constraints
 *   until the first native layout pass happens,
 * - align: children are offset by the stored content origin offset.
 */
@LynxShadowNode(tagName = "stack-screen-native")
internal class StackScreenShadowNode :
    ShadowNode(),
    CustomMeasureFunc {
    private var frameWidth: Float = 0f
    private var frameHeight: Float = 0f
    private var contentOffsetX: Float = 0f
    private var contentOffsetY: Float = 0f

    init {
        setCustomMeasureFunc(this)
    }

    internal fun updateState(
        x: Float,
        y: Float,
        width: Float,
        height: Float,
    ) {
        contentOffsetX = x
        contentOffsetY = y
        frameWidth = width
        frameHeight = height

        resetIsDirty()
        markDirty()
        setNeedsLayoutForce()
    }

    override fun measure(
        param: MeasureParam?,
        context: MeasureContext?,
    ): MeasureResult {
        val width = if (frameWidth > 0f) frameWidth else param?.mWidth ?: 0f
        val height = if (frameHeight > 0f) frameHeight else param?.mHeight ?: 0f

        val childParam =
            MeasureParam().apply {
                updateConstraints(width, MeasureMode.EXACTLY, height, MeasureMode.EXACTLY)
            }
        for (index in 0 until childCount) {
            (getChildAt(index) as? NativeLayoutNodeRef)?.measureNativeNode(context, childParam)
        }

        return MeasureResult(width, height)
    }

    override fun align(
        param: AlignParam?,
        context: AlignContext?,
    ) {
        for (index in 0 until childCount) {
            val child = getChildAt(index) as? NativeLayoutNodeRef ?: continue
            val alignParam =
                AlignParam().apply {
                    leftOffset = contentOffsetX
                    topOffset = contentOffsetY
                }
            child.alignNativeNode(context, alignParam)
        }
    }
}

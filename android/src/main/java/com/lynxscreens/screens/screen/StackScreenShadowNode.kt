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
import com.lynxscreens.screens.common.ShadowStateUpdating

/**
 * Counterpart of RNS RNSStackScreenShadowNode (+ State & ComponentDescriptor). Instead of the
 * Fabric state round-trip (adopt/setSize + getContentOriginOffset), it takes over measurement
 * and alignment of the StackScreen subtree via Lynx's CustomMeasureFunc:
 * - measure: children are measured with the native-measured frame of the screen view (which is
 *   constrained by the header's ScrollingViewBehavior), falling back to engine constraints
 *   until the first native layout pass happens,
 * - align: children are offset by the stored content origin offset.
 *
 * Children are measured/aligned through signature-based LayoutNodeManager calls: a child backed
 * by its own custom shadow node (e.g. StackHeaderConfigShadowNode) is NOT a NativeLayoutNodeRef,
 * but the engine routes the measurement to its custom measure func all the same.
 */
@LynxShadowNode(tagName = "ls-stack-screen")
internal class StackScreenShadowNode :
    ShadowNode(),
    CustomMeasureFunc,
    ShadowStateUpdating {
    private var frameWidth: Float = 0f
    private var frameHeight: Float = 0f
    private var contentOffsetX: Float = 0f
    private var contentOffsetY: Float = 0f

    init {
        setCustomMeasureFunc(this)
    }

    override fun updateState(
        contentOffsetX: Float,
        contentOffsetY: Float,
        frameWidth: Float,
        frameHeight: Float,
    ) {
        this.contentOffsetX = contentOffsetX
        this.contentOffsetY = contentOffsetY
        this.frameWidth = frameWidth
        this.frameHeight = frameHeight

        // The measurement constraints for the children depend on the screen frame, so their
        // cached measurements must be invalidated along with ours.
        for (index in 0 until childCount) {
            layoutNodeManager.markDirty(getChildAt(index).signature)
        }

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
            when (val child = getChildAt(index)) {
                is NativeLayoutNodeRef -> child.measureNativeNode(context, childParam)
                else ->
                    // finalMeasure is not readable from MeasureContext (package-private).
                    layoutNodeManager.measureNativeNode(
                        child.signature,
                        width,
                        MeasureMode.EXACTLY.intValue(),
                        height,
                        MeasureMode.EXACTLY.intValue(),
                        true,
                    )
            }
        }

        return MeasureResult(width, height)
    }

    override fun align(
        param: AlignParam?,
        context: AlignContext?,
    ) {
        for (index in 0 until childCount) {
            when (val child = getChildAt(index)) {
                is NativeLayoutNodeRef ->
                    child.alignNativeNode(
                        context,
                        AlignParam().apply {
                            leftOffset = contentOffsetX
                            topOffset = contentOffsetY
                        },
                    )
                else -> layoutNodeManager.alignNativeNode(child.signature, contentOffsetY, contentOffsetX)
            }
        }
    }
}

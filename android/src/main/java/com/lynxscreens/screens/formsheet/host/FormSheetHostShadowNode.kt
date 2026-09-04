package com.lynxscreens.screens.formsheet.host

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

@LynxShadowNode(tagName = "ls-form-sheet")
internal class FormSheetHostShadowNode : ShadowNode(), CustomMeasureFunc, ShadowStateUpdating {
    private var frameWidth = 0f
    private var frameHeight = 0f

    init {
        setCustomMeasureFunc(this)
    }

    // Adaptation: native dialog dimensions replace Fabric state and drive Lynx child layout.
    override fun updateState(contentOffsetX: Float, contentOffsetY: Float, frameWidth: Float, frameHeight: Float) {
        this.frameWidth = frameWidth
        this.frameHeight = frameHeight
        for (index in 0 until childCount) layoutNodeManager.markDirty(getChildAt(index).signature)
        resetIsDirty()
        markDirty()
        setNeedsLayoutForce()
    }

    override fun measure(param: MeasureParam?, context: MeasureContext?): MeasureResult {
        val width = if (frameWidth > 0f) frameWidth else param?.mWidth ?: 0f
        val height = if (frameHeight > 0f) frameHeight else param?.mHeight ?: 0f
        val childParam = MeasureParam().apply {
            updateConstraints(width, MeasureMode.EXACTLY, height, MeasureMode.AT_MOST)
        }
        for (index in 0 until childCount) {
            when (val child = getChildAt(index)) {
                is NativeLayoutNodeRef -> child.measureNativeNode(context, childParam)
                else ->
                    layoutNodeManager.measureNativeNode(
                        child.signature,
                        width,
                        MeasureMode.EXACTLY.intValue(),
                        height,
                        MeasureMode.AT_MOST.intValue(),
                        true,
                    )
            }
        }
        return MeasureResult(width, height)
    }

    override fun align(param: AlignParam?, context: AlignContext?) {
        for (index in 0 until childCount) {
            when (val child = getChildAt(index)) {
                is NativeLayoutNodeRef -> child.alignNativeNode(context, AlignParam())
                else -> layoutNodeManager.alignNativeNode(child.signature, 0f, 0f)
            }
        }
    }
}

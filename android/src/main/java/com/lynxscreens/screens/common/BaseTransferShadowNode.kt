package com.lynxscreens.screens.common

import com.lynx.tasm.behavior.shadow.AlignContext
import com.lynx.tasm.behavior.shadow.AlignParam
import com.lynx.tasm.behavior.shadow.CustomLayoutShadowNode
import com.lynx.tasm.behavior.shadow.CustomMeasureFunc
import com.lynx.tasm.behavior.shadow.MeasureContext
import com.lynx.tasm.behavior.shadow.MeasureMode
import com.lynx.tasm.behavior.shadow.MeasureParam
import com.lynx.tasm.behavior.shadow.MeasureResult
import com.lynx.tasm.behavior.shadow.NativeLayoutNodeRef

/**
 * Base ShadowNode that measures and aligns Lynx children with constraints from a native receiver.
 */
internal abstract class BaseTransferShadowNode : CustomLayoutShadowNode(), CustomMeasureFunc {
    private var hasHostConstraints = false
    private var hostWidth = 0f
    private var hostWidthMode = MeasureMode.UNDEFINED
    private var hostHeight = 0f
    private var hostHeightMode = MeasureMode.UNDEFINED

    override fun attachNativePtr(ptr: Long) {
        setCustomMeasureFunc(this)
        super.attachNativePtr(ptr)
    }

    /** Updates the native receiver constraints used for the next Lynx child layout pass. */
    internal fun updateHostConstraints(
        width: Float,
        widthMode: MeasureMode,
        height: Float,
        heightMode: MeasureMode,
    ) {
        if (hasHostConstraints &&
            hostWidth == width &&
            hostWidthMode == widthMode &&
            hostHeight == height &&
            hostHeightMode == heightMode
        ) {
            return
        }

        hasHostConstraints = true
        hostWidth = width
        hostWidthMode = widthMode
        hostHeight = height
        hostHeightMode = heightMode
        markDirty()
    }

    override fun measure(
        param: MeasureParam?,
        context: MeasureContext?,
    ): MeasureResult {
        if (!hasHostConstraints) {
            return MeasureResult(0f, 0f)
        }

        val sourceParam = param ?: MeasureParam()
        val childParam =
            MeasureParam().apply {
                mWidth = if (hostWidthMode == MeasureMode.UNDEFINED) sourceParam.mWidth else hostWidth
                mWidthMode =
                    if (hostWidthMode == MeasureMode.UNDEFINED) sourceParam.mWidthMode else hostWidthMode
                mHeight = if (hostHeightMode == MeasureMode.UNDEFINED) sourceParam.mHeight else hostHeight
                mHeightMode =
                    if (hostHeightMode == MeasureMode.UNDEFINED) sourceParam.mHeightMode else hostHeightMode
            }
        for (index in 0 until childCount) {
            (getChildAt(index) as? NativeLayoutNodeRef)?.measureNativeNode(context, childParam)
        }
        return MeasureResult(0f, 0f)
    }

    override fun align(
        param: AlignParam?,
        context: AlignContext?,
    ) {
        for (index in 0 until childCount) {
            (getChildAt(index) as? NativeLayoutNodeRef)?.alignNativeNode(context, AlignParam())
        }
    }
}

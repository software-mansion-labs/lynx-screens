package com.lynxscreens.screens.header.config

import com.lynx.tasm.behavior.LynxProp
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
 * Counterpart of RNS RNSStackHeaderConfigShadowNode (+ State & ComponentDescriptor). The native
 * side reports the AppBarLayout frame via [updateState]; the config subtree is then measured
 * with those dimensions so that subview content sizes to the real header, not to the
 * constraints coming from the parent StackScreen.
 *
 * Children (subviews) are measured AT_MOST through signature-based LayoutNodeManager calls so
 * they size themselves to their content.
 *
 * Divergence from RNS: the stored content offset is NOT applied to children in align() -
 * subview views are reparented into the native Toolbar which positions them itself, so
 * offsetting the Lynx layout would double-shift them. RNS needs the offset only to correct
 * Fabric-mounted frames.
 */
@LynxShadowNode(tagName = "stack-header-config-native")
internal class StackHeaderConfigShadowNode :
    ShadowNode(),
    CustomMeasureFunc,
    ShadowStateUpdating {
    private var frameWidth: Float = 0f
    private var frameHeight: Float = 0f
    private var contentOffsetX: Float = 0f
    private var contentOffsetY: Float = 0f

    /**
     * Set from JS alongside the children. When true, the first child is the background subview
     * (the subview order is a documented invariant shared with getConfigSubviewAt).
     */
    private var hasBackgroundSubview: Boolean = false

    init {
        setCustomMeasureFunc(this)
    }

    @LynxProp(name = "hasBackgroundSubview")
    fun setHasBackgroundSubview(value: Boolean?) {
        hasBackgroundSubview = value == true
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

        // The measurement constraints for the subviews depend on the header frame, so their
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

        // Toolbar subviews size themselves to their content (AT_MOST); the background subview
        // stretches to the header frame (EXACTLY), like RNS's absoluteFill background against
        // the config node sized to the AppBarLayout.
        for (index in 0 until childCount) {
            val mode = if (hasBackgroundSubview && index == 0) MeasureMode.EXACTLY else MeasureMode.AT_MOST
            when (val child = getChildAt(index)) {
                is NativeLayoutNodeRef ->
                    child.measureNativeNode(
                        context,
                        MeasureParam().apply { updateConstraints(width, mode, height, mode) },
                    )
                else ->
                    // finalMeasure is not readable from MeasureContext (package-private).
                    layoutNodeManager.measureNativeNode(
                        child.signature,
                        width,
                        mode.intValue(),
                        height,
                        mode.intValue(),
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
                is NativeLayoutNodeRef -> child.alignNativeNode(context, AlignParam())
                else -> layoutNodeManager.alignNativeNode(child.signature, 0f, 0f)
            }
        }
    }
}

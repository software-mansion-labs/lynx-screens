package com.lynxscreens.screens.common

import android.view.View
import com.lynx.tasm.behavior.LynxContext
import kotlin.math.abs

/**
 * Counterpart of RNS ShadowStateProxy. Instead of pushing state into Fabric's Shadow
 * Tree via a StateWrapper, it updates the target shadow node (any [ShadowStateUpdating]
 * implementation registered for the component's sign) directly and kicks the LynxView
 * layout pass manually - marking a shadow node dirty from outside the Lynx pipeline does
 * not schedule a layout pass on its own.
 *
 * Note: values are kept in physical pixels - Lynx layout operates on px, so unlike RNS
 * there is no px -> dp conversion here.
 */
internal class ShadowStateProxy(
    private val lynxContext: LynxContext,
    private val sign: Int,
    private val includesFrameSize: Boolean = true,
) {
    private var lastFrameWidth: Float = 0f
    private var lastFrameHeight: Float = 0f
    private var lastContentOffsetX: Float = 0f
    private var lastContentOffsetY: Float = 0f

    fun updateStateIfNeeded(
        frameWidth: Int? = null,
        frameHeight: Int? = null,
        contentOffsetX: Int? = null,
        contentOffsetY: Int? = null,
    ) {
        val width: Float = frameWidth?.toFloat() ?: lastFrameWidth
        val height: Float = frameHeight?.toFloat() ?: lastFrameHeight
        val offsetX: Float = contentOffsetX?.toFloat() ?: lastContentOffsetX
        val offsetY: Float = contentOffsetY?.toFloat() ?: lastContentOffsetY

        if (
            abs(lastFrameWidth - width) < DELTA &&
            abs(lastFrameHeight - height) < DELTA &&
            abs(lastContentOffsetX - offsetX) < DELTA &&
            abs(lastContentOffsetY - offsetY) < DELTA
        ) {
            return
        }

        lastFrameWidth = width
        lastFrameHeight = height
        lastContentOffsetX = offsetX
        lastContentOffsetY = offsetY

        val shadowNode = lynxContext.findShadowNodeBySign(sign) as? ShadowStateUpdating ?: return
        shadowNode.updateState(
            contentOffsetX = lastContentOffsetX,
            contentOffsetY = lastContentOffsetY,
            frameWidth = if (includesFrameSize) lastFrameWidth else 0f,
            frameHeight = if (includesFrameSize) lastFrameHeight else 0f,
        )
        kickLynxViewLayoutPass()
    }

    private fun kickLynxViewLayoutPass() {
        val lynxView = lynxContext.lynxView ?: return
        lynxView.post {
            // View.measure short-circuits (skips onMeasure) when the specs are unchanged
            // and no layout was requested - but it is exactly LynxView.onMeasure that
            // consumes the engine's pending layout tick (ViewLayoutTick.triggerLayout).
            // Force the flag so the pass actually runs.
            lynxView.forceLayout()
            lynxView.measure(
                View.MeasureSpec.makeMeasureSpec(lynxView.width, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(lynxView.height, View.MeasureSpec.EXACTLY),
            )
            lynxView.layout(lynxView.left, lynxView.top, lynxView.right, lynxView.bottom)
        }
    }

    companion object {
        private const val DELTA = 0.1f
    }
}

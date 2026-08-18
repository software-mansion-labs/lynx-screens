package com.lynxscreens.screens.screen

import android.view.View
import com.lynx.tasm.behavior.LynxContext
import kotlin.math.abs

/**
 * Counterpart of RNS StackScreenShadowStateProxy. Instead of pushing state into Fabric's Shadow
 * Tree via a StateWrapper, it updates StackScreenShadowNode directly and kicks the LynxView
 * layout pass manually - marking the shadow node dirty from outside the Lynx pipeline does not
 * schedule a layout pass on its own.
 *
 * Note: values are kept in physical pixels - Lynx layout operates on px, so unlike RNS there is
 * no px -> dp conversion here.
 */
internal class StackScreenShadowStateProxy(
    private val lynxContext: LynxContext,
    private val sign: Int,
) {
    private var lastX: Float = 0f
    private var lastY: Float = 0f
    private var lastWidth: Float = 0f
    private var lastHeight: Float = 0f

    fun updateStateIfNeeded(
        x: Int? = null,
        y: Int? = null,
        width: Int? = null,
        height: Int? = null,
    ) {
        val newX: Float = x?.toFloat() ?: lastX
        val newY: Float = y?.toFloat() ?: lastY
        val newWidth: Float = width?.toFloat() ?: lastWidth
        val newHeight: Float = height?.toFloat() ?: lastHeight

        // Check incoming state values. If they're already the correct value, return early to prevent
        // an infinite update loop.
        if (
            abs(lastX - newX) < DELTA &&
            abs(lastY - newY) < DELTA &&
            abs(lastWidth - newWidth) < DELTA &&
            abs(lastHeight - newHeight) < DELTA
        ) {
            return
        }

        lastX = newX
        lastY = newY
        lastWidth = newWidth
        lastHeight = newHeight

        val shadowNode = lynxContext.findShadowNodeBySign(sign) as? StackScreenShadowNode ?: return
        shadowNode.updateState(lastX, lastY, lastWidth, lastHeight)
        kickLynxViewLayoutPass()
    }

    private fun kickLynxViewLayoutPass() {
        val lynxView = lynxContext.lynxView ?: return
        lynxView.post {
            lynxView.measure(
                View.MeasureSpec.makeMeasureSpec(lynxView.width, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(lynxView.height, View.MeasureSpec.EXACTLY),
            )
            lynxView.layout(lynxView.left, lynxView.top, lynxView.right, lynxView.bottom)
        }
    }

    companion object {
        private const val DELTA = 0.9f
    }
}

package com.lynxscreens.screens.common

import android.content.Context
import android.view.View
import android.view.ViewGroup
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.shadow.MeasureMode
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynx.tasm.behavior.ui.view.AndroidView

/**
 * Base Lynx UI for native components that render their Lynx children in another native hierarchy.
 */
internal abstract class BaseUITransfer<T : BaseUITransfer.BaseTransferView>(
    context: LynxContext,
) : UIGroup<T>(context) {
    private var hostWidth = 0f
    private var hostWidthMode = MeasureMode.UNDEFINED
    private var hostHeight = 0f
    private var hostHeightMode = MeasureMode.UNDEFINED

    override fun canHaveFlattenChild(): Boolean = false

    private fun updateHostConstraints(
        widthMeasureSpec: Int,
        heightMeasureSpec: Int,
    ) {
        val widthMode = MeasureMode.fromInt(MeasureMode.fromMeasureSpec(widthMeasureSpec))
        val heightMode = MeasureMode.fromInt(MeasureMode.fromMeasureSpec(heightMeasureSpec))
        val width =
            if (widthMode == MeasureMode.UNDEFINED) 0f else View.MeasureSpec.getSize(widthMeasureSpec).toFloat()
        val height =
            if (heightMode == MeasureMode.UNDEFINED) 0f else View.MeasureSpec.getSize(heightMeasureSpec).toFloat()
        if (hostWidth == width &&
            hostWidthMode == widthMode &&
            hostHeight == height &&
            hostHeightMode == heightMode
        ) {
            return
        }

        hostWidth = width
        hostWidthMode = widthMode
        hostHeight = height
        hostHeightMode = heightMode
        lynxContext.findShadowNodeAndRunTask(sign) { shadowNode ->
            if (shadowNode is BaseTransferShadowNode) {
                shadowNode.updateHostConstraints(width, widthMode, height, heightMode)
            }
        }
    }

    /**
     * Host view that forwards Lynx child view operations to [transferReceiver].
     */
    internal abstract class BaseTransferView(
        context: Context,
    ) : AndroidView(context) {
        /** Native ViewGroup that receives the transferred Lynx child views. */
        protected abstract val transferReceiver: ViewGroup

        /** Returns the native receiver that can be mounted outside the Lynx view hierarchy. */
        internal val transferredView: ViewGroup
            get() = transferReceiver

        /** Returns the transferred child at [index], or null when the index is out of bounds. */
        internal fun getTransferredChildAt(index: Int): View? =
            if (index in 0 until transferReceiver.childCount) {
                transferReceiver.getChildAt(index)
            } else {
                null
            }

        override fun addView(
            child: View,
            index: Int,
            params: ViewGroup.LayoutParams,
        ) {
            transferReceiver.addView(child, index, params)
        }

        override fun removeView(view: View) {
            transferReceiver.removeView(view)
        }

        override fun removeViewAt(index: Int) {
            transferReceiver.removeViewAt(index)
        }

        override fun removeAllViews() {
            transferReceiver.removeAllViews()
        }
    }

    /**
     * Receiver view that feeds native measure constraints back to the transfer ShadowNode and Lynx
     * subtree.
     */
    internal open class BaseTransferContentView(
        context: Context,
        private val transfer: BaseUITransfer<*>,
    ) : AndroidView(context) {
        override fun onMeasure(
            widthMeasureSpec: Int,
            heightMeasureSpec: Int,
        ) {
            transfer.updateHostConstraints(widthMeasureSpec, heightMeasureSpec)
            transfer.measure()
            setMeasuredDimension(
                if (View.MeasureSpec.getMode(widthMeasureSpec) == View.MeasureSpec.UNSPECIFIED) {
                    transfer.width
                } else {
                    View.MeasureSpec.getSize(widthMeasureSpec)
                },
                if (View.MeasureSpec.getMode(heightMeasureSpec) == View.MeasureSpec.UNSPECIFIED) {
                    transfer.height
                } else {
                    View.MeasureSpec.getSize(heightMeasureSpec)
                },
            )
        }

        override fun onLayout(
            changed: Boolean,
            left: Int,
            top: Int,
            right: Int,
            bottom: Int,
        ) {
            super.onLayout(changed, left, top, right, bottom)
            transfer.layout()
        }
    }
}

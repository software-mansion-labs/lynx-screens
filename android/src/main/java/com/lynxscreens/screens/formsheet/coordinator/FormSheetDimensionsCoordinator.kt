package com.lynxscreens.screens.formsheet.coordinator

import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.doOnLayout
import com.lynxscreens.screens.formsheet.core.FormSheetAvailableHeightProvider
import com.lynxscreens.screens.formsheet.core.FormSheetContainer
import com.lynxscreens.screens.formsheet.core.FormSheetDialog
import com.lynxscreens.screens.formsheet.interfaces.FormSheetContentSizeChangeDelegate
import com.lynxscreens.screens.formsheet.model.FormSheetDetents

internal class FormSheetDimensionsCoordinator(
    private val dialog: FormSheetDialog,
    private val container: FormSheetContainer,
    private val bottomSheetView: FrameLayout?,
    private val behaviorController: FormSheetBehaviorController?,
) : FormSheetContentSizeChangeDelegate,
    FormSheetAvailableHeightProvider.OnAvailableHeightMeasuredListener {
    private var lastTopInset = 0
    private var lastBottomInset = 0
    private var currentDetents: FormSheetDetents? = null
    private var currentInitialDetentIndex = 0
    private var shouldApplyInitialDetent = false
    private var currentContentHeight = 0
    private var resolvedAvailableSpace = 0
    private var isGeometryDirty = false

    internal fun setup() {
        dialog.availableHeightProvider.availableHeightListener = this
        ViewCompat.setOnApplyWindowInsetsListener(container) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            if (bars.top != lastTopInset || bars.bottom != lastBottomInset) {
                lastTopInset = bars.top
                lastBottomInset = bars.bottom
                invalidateGeometry()
            }
            insets
        }
        bottomSheetView?.doOnLayout { ViewCompat.setWindowInsetsAnimationCallback(it, null) }
    }

    override fun onContentHeightChanged(newHeight: Int) {
        if (currentContentHeight != newHeight) {
            currentContentHeight = newHeight
            invalidateGeometry()
        }
    }

    internal fun updateFormSheetDimensions(
        detents: FormSheetDetents?,
        initialDetentIndex: Int = 0,
        applyInitialDetent: Boolean = false,
    ) {
        currentDetents = detents
        currentInitialDetentIndex = initialDetentIndex
        shouldApplyInitialDetent = applyInitialDetent
        invalidateGeometry()
    }

    private fun invalidateGeometry() {
        isGeometryDirty = true
        dialog.availableHeightProvider.requestLayout()
        container.requestLayout()
    }

    override fun onAvailableHeightMeasured(height: Int) {
        if (!isGeometryDirty && height == resolvedAvailableSpace) return
        isGeometryDirty = false
        resolvedAvailableSpace = height
        resolveGeometry(height)
    }

    private fun resolveGeometry(sheetAvailableSpace: Int) {
        currentDetents?.let {
            behaviorController?.updateSheetBehavior(
                detents = it,
                sheetAvailableSpace = sheetAvailableSpace,
                contentHeightForFitToContents = currentContentHeight,
                nativeContainerPaddingBottom = lastBottomInset,
                initialDetentIndex = currentInitialDetentIndex,
                applyInitialDetent = shouldApplyInitialDetent,
            )
            shouldApplyInitialDetent = false
        }

        val height =
            currentDetents?.sheetContainerHeight(
                sheetAvailableSpace,
                lastTopInset,
                lastBottomInset,
                currentContentHeight,
            )
                ?: (sheetAvailableSpace - lastTopInset - lastBottomInset).coerceAtLeast(0)
        val params = container.layoutParams ?: FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, height)
        if (params.width != ViewGroup.LayoutParams.MATCH_PARENT || params.height != height) {
            params.width = ViewGroup.LayoutParams.MATCH_PARENT
            params.height = height
            container.layoutParams = params
        }
    }

    internal fun destroy() {
        dialog.availableHeightProvider.availableHeightListener = null
        ViewCompat.setOnApplyWindowInsetsListener(container, null)
    }
}

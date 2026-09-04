package com.lynxscreens.screens.formsheet.presentation

import android.content.Context
import android.util.Log
import android.view.ViewGroup
import android.widget.FrameLayout
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.lynxscreens.screens.formsheet.coordinator.FormSheetAppearanceCoordinator
import com.lynxscreens.screens.formsheet.coordinator.FormSheetBehaviorController
import com.lynxscreens.screens.formsheet.coordinator.FormSheetDimensionsCoordinator
import com.lynxscreens.screens.formsheet.coordinator.FormSheetNativeDismissCoordinator
import com.lynxscreens.screens.formsheet.core.FormSheetContainer
import com.lynxscreens.screens.formsheet.core.FormSheetDialog
import com.lynxscreens.screens.formsheet.model.FormSheetConfig
import com.lynxscreens.screens.formsheet.model.FormSheetDetents

internal class FormSheetPresentation(
    themedContext: Context,
    private val container: FormSheetContainer,
    callbacks: Callbacks,
) {
    internal interface Callbacks {
        fun onDetentChanged(index: Int)

        fun onNativeDismissAllowed()

        fun onNativeDismissPrevented()
    }

    internal val dialog = FormSheetDialog(themedContext).apply {
        setContentView(container)
        setCanceledOnTouchOutside(true)
    }
    internal val bottomSheetView: FrameLayout? =
        dialog.findViewById(com.google.android.material.R.id.design_bottom_sheet)
    internal val sheetBehavior: BottomSheetBehavior<FrameLayout>?
        get() = bottomSheetView?.let { BottomSheetBehavior.from(it) }

    private val behaviorController = bottomSheetView?.let {
        FormSheetBehaviorController(it, callbacks::onDetentChanged)
    }
    private val appearanceCoordinator = FormSheetAppearanceCoordinator(bottomSheetView)
    private val dimensionsCoordinator =
        FormSheetDimensionsCoordinator(dialog, container, bottomSheetView, behaviorController)
    private val nativeDismissCoordinator =
        FormSheetNativeDismissCoordinator(
            dialog,
            behaviorController,
            callbacks::onNativeDismissAllowed,
            callbacks::onNativeDismissPrevented,
        )

    init {
        nativeDismissCoordinator.setup()
        appearanceCoordinator.setup()
        dimensionsCoordinator.setup()
        behaviorController?.setup()
    }

    internal fun onContentHeightChanged(height: Int) = dimensionsCoordinator.onContentHeightChanged(height)

    internal fun applyInitialConfig(config: FormSheetConfig, contentHeight: Int) {
        onContentHeightChanged(contentHeight)
        dimensionsCoordinator.updateFormSheetDimensions(
            resolveDetents(config.detents),
            config.initialDetentIndex,
            applyInitialDetent = true,
        )
        container.setGrabberVisible(config.prefersGrabberVisible)
        appearanceCoordinator.updateCornerRadius(config.preferredCornerRadius)
        appearanceCoordinator.updateBackgroundColor(config.nativeContainerBackgroundColor)
        nativeDismissCoordinator.shouldPreventDismiss = config.shouldPreventNativeDismiss
    }

    internal fun applyConfigUpdate(oldConfig: FormSheetConfig, newConfig: FormSheetConfig) {
        if (oldConfig.detents != newConfig.detents) {
            dimensionsCoordinator.updateFormSheetDimensions(
                resolveDetents(newConfig.detents),
                newConfig.initialDetentIndex,
            )
        }
        if (oldConfig.prefersGrabberVisible != newConfig.prefersGrabberVisible) {
            container.setGrabberVisible(newConfig.prefersGrabberVisible)
        }
        if (oldConfig.preferredCornerRadius != newConfig.preferredCornerRadius) {
            appearanceCoordinator.updateCornerRadius(newConfig.preferredCornerRadius)
        }
        if (oldConfig.nativeContainerBackgroundColor != newConfig.nativeContainerBackgroundColor) {
            appearanceCoordinator.updateBackgroundColor(newConfig.nativeContainerBackgroundColor)
        }
        if (oldConfig.shouldPreventNativeDismiss != newConfig.shouldPreventNativeDismiss) {
            nativeDismissCoordinator.shouldPreventDismiss = newConfig.shouldPreventNativeDismiss
        }
    }

    internal fun destroy() {
        behaviorController?.destroy()
        nativeDismissCoordinator.destroy()
        dimensionsCoordinator.destroy()
        dialog.setOnShowListener(null)
        dialog.dismiss()
        (container.parent as? ViewGroup)?.removeView(container)
    }

    private fun resolveDetents(rawDetents: List<Double>): FormSheetDetents {
        if (rawDetents.isEmpty()) return FormSheetDetents(listOf(LARGE_DETENT_FRACTION))
        return try {
            FormSheetDetents(rawDetents)
        } catch (error: IllegalArgumentException) {
            Log.e("[RNScreens]", "Invalid FormSheet detents: $rawDetents. Falling back to large detent.", error)
            FormSheetDetents(listOf(LARGE_DETENT_FRACTION))
        }
    }

    companion object {
        private const val LARGE_DETENT_FRACTION = 1.0
    }
}

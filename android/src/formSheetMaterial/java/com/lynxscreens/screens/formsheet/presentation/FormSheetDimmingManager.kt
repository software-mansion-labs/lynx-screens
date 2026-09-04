package com.lynxscreens.screens.formsheet.presentation

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.util.Log
import android.view.View
import com.google.android.material.bottomsheet.BottomSheetBehavior
import kotlin.math.roundToInt

internal class FormSheetDimmingManager(private val context: Context) {
    internal val maxAlpha = MAX_DIMMING_ALPHA_FRACTION
    internal var isTransitionAnimationRunning = false
    private var dimmingDrawable: ColorDrawable? = null
    private var dimmingHost: View? = null
    private val dimmingHostLayoutListener =
        View.OnLayoutChangeListener { view, _, _, _, _, _, _, _, _ ->
            dimmingDrawable?.setBounds(0, 0, view.width, view.height)
        }

    internal var dimmingAlpha = 0f
        set(value) {
            field = value
            dimmingDrawable?.alpha = (value * 255).roundToInt().coerceIn(0, 255)
        }

    internal fun attachDimming(belowSheetView: View?) {
        val host = belowSheetView ?: resolveActivityDecorView()
        if (host == null) {
            Log.e(
                TAG,
                "[RNScreens] Neither a sheet below nor an activity decor found; the sheet will present undimmed.",
            )
            return
        }
        dimmingHost = host
        dimmingDrawable = ColorDrawable(Color.BLACK).apply {
            alpha = 0
            setBounds(0, 0, host.width, host.height)
        }
        host.overlay.add(dimmingDrawable!!)
        host.addOnLayoutChangeListener(dimmingHostLayoutListener)
    }

    internal fun detachDimming() {
        dimmingHost?.removeOnLayoutChangeListener(dimmingHostLayoutListener)
        dimmingDrawable?.let { dimmingHost?.overlay?.remove(it) }
        dimmingHost = null
        dimmingDrawable = null
    }

    internal fun attachToBehavior(behavior: BottomSheetBehavior<*>) {
        behavior.addBottomSheetCallback(
            object : BottomSheetBehavior.BottomSheetCallback() {
                override fun onStateChanged(bottomSheet: View, newState: Int) = Unit

                override fun onSlide(bottomSheet: View, slideOffset: Float) {
                    if (!isTransitionAnimationRunning) {
                        dimmingAlpha = (if (slideOffset >= 0) 1f else 1f + slideOffset) * maxAlpha
                    }
                }
            },
        )
    }

    // Adaptation: LynxContext is a ContextWrapper, so regular unwrapping replaces ReactContext.currentActivity.
    private fun resolveActivityDecorView(): View? {
        var current: Context? = context
        while (current is ContextWrapper) {
            if (current is Activity) return current.window?.decorView
            current = current.baseContext
        }
        return (current as? Activity)?.window?.decorView
    }

    companion object {
        private const val TAG = "FormSheetDimmingManager"
        private const val MAX_DIMMING_ALPHA_FRACTION = 0.3f
    }
}

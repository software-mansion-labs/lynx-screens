package com.lynxscreens.screens.formsheet.core

import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.core.view.WindowCompat
import com.google.android.material.bottomsheet.BottomSheetDialog

/** BottomSheetDialog configured for FormSheet's edge-to-edge presentation. */
internal class FormSheetDialog(context: Context) : BottomSheetDialog(context) {
    internal fun interface CancelRequestInterceptor {
        fun handleCancelRequest()
    }

    internal var cancelRequestInterceptor: CancelRequestInterceptor? = null
    internal val availableHeightProvider = FormSheetAvailableHeightProvider(context)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window?.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
        window?.setWindowAnimations(0)
        findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)?.layoutParams?.height =
            ViewGroup.LayoutParams.MATCH_PARENT
        installAvailableHeightProvider()
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        val window = window ?: return
        WindowCompat.setDecorFitsSystemWindows(window, false)
        findViewById<View>(com.google.android.material.R.id.container)?.fitsSystemWindows = false
        findViewById<View>(com.google.android.material.R.id.coordinator)?.fitsSystemWindows = false
    }

    override fun cancel() {
        cancelRequestInterceptor?.handleCancelRequest() ?: super.cancel()
    }

    private fun installAvailableHeightProvider() {
        if (availableHeightProvider.parent != null) return
        val contentParent = findViewById<ViewGroup>(android.R.id.content)
        if (contentParent == null) {
            Log.e(TAG, "[RNScreens] Window content view not found; the sheet dimensions won't be resolved.")
            return
        }
        contentParent.addView(
            availableHeightProvider,
            0,
            FrameLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT),
        )
    }

    companion object {
        private const val TAG = "FormSheetDialog"
    }
}

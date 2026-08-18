package com.lynxscreens.screens.ext

import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.findFragment

internal fun View.findFragmentOrNull(): Fragment? =
    try {
        this.findFragment()
    } catch (_: IllegalStateException) {
        null
    }

/**
 * This will fail in case the view has been measured with (0, 0) dimensions and laid out
 * before being attached to window.
 */
internal fun View.isMeasured(): Boolean = this.measuredWidth != 0 || this.measuredHeight != 0 || this.isLaidOut

internal fun View.detachFromCurrentParent() {
    (parent as? ViewGroup)?.removeView(this)
}

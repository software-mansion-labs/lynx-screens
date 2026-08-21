package com.lynxscreens.screens.ext

import android.content.ContextWrapper
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.FragmentManager

/**
 * Fragment KTX 1.1.0 does not provide View.findFragment(). Resolve the closest owning Fragment by
 * walking the Fragment hierarchy and matching Fragment root views against the target view tree.
 */
internal fun View.findFragmentOrNull(): Fragment? {
    var currentContext = context
    while (currentContext !is FragmentActivity && currentContext is ContextWrapper) {
        currentContext = currentContext.baseContext
    }

    return (currentContext as? FragmentActivity)
        ?.supportFragmentManager
        ?.findClosestFragmentForView(this)
}

private fun FragmentManager.findClosestFragmentForView(target: View): Fragment? {
    fragments.asReversed().forEach { fragment ->
        val fragmentView = fragment.view ?: return@forEach
        if (!target.isSelfOrDescendantOf(fragmentView)) {
            return@forEach
        }

        val childFragment =
            fragment
                .takeIf { it.isAdded }
                ?.childFragmentManager
                ?.findClosestFragmentForView(target)
        return childFragment ?: fragment
    }
    return null
}

private fun View.isSelfOrDescendantOf(ancestor: View): Boolean {
    var current: View? = this
    while (current != null) {
        if (current === ancestor) {
            return true
        }
        current = current.parent as? View
    }
    return false
}

/**
 * This will fail in case the view has been measured with (0, 0) dimensions and laid out
 * before being attached to window.
 */
internal fun View.isMeasured(): Boolean = this.measuredWidth != 0 || this.measuredHeight != 0 || this.isLaidOut

internal fun View.detachFromCurrentParent() {
    (parent as? ViewGroup)?.removeView(this)
}

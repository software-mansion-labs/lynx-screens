package com.lynxscreens.screens.scrollviewmarker

import android.annotation.SuppressLint
import android.view.ViewGroup
import android.widget.ScrollView
import androidx.core.view.children
import androidx.core.widget.NestedScrollView
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.view.AndroidView

// Adaptation: RNS implements the marker directly on the (React) view class; on
// Lynx the component/view roles are split, so the attach-driven registration
// lives on the marker's Android view.
@SuppressLint("ViewConstructor") // Should never be inflated / restored
class ScrollViewMarkerView(
    lynxContext: LynxContext,
) : AndroidView(lynxContext) {
    // region Base override

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        maybeRegisterWithSeekingAncestor()
    }

    override fun onDetachedFromWindow() {
        hasAttemptedRegistration = false
        super.onDetachedFromWindow()
    }

    // endregion

    private var hasAttemptedRegistration: Boolean = false

    /**
     * Currently we discover only ScrollView or NestedScrollView.
     * It'll crash in case scroll view detection fails.
     *
     * Call it only after the children have been already attached and not yet detached.
     *
     * This method intentionally ignores horizontal scroll views - we don't have support for "edge effects"
     * on Android nor we have any other use for them.
     */
    private fun findScrollView(): ViewGroup {
        val childScrollView =
            checkNotNull(children.find { childView -> childView is ScrollView || childView is NestedScrollView }) {
                "[RNScreens] Failed to find supported type of ScrollView in children of ScrollViewMarker"
            }

        return childScrollView as ViewGroup
    }

    private fun findFirstSeekingAncestor(): ScrollViewSeeking? {
        var currentView = parent

        while (currentView != null) {
            if (currentView is ScrollViewSeeking) {
                return currentView
            }
            currentView = currentView.parent
        }

        return null
    }

    private fun registerWithSeekingAncestor() {
        val scrollView = findScrollView()
        findFirstSeekingAncestor()?.registerScrollView(this, scrollView)
    }

    private fun maybeRegisterWithSeekingAncestor() {
        if (hasAttemptedRegistration) {
            return
        }

        registerWithSeekingAncestor()
        hasAttemptedRegistration = true
    }
}

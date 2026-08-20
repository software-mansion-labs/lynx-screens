package com.lynxscreens.screens.helpers

import android.view.View
import android.view.ViewGroup
import android.widget.ScrollView
import androidx.core.view.isNotEmpty
import androidx.core.widget.NestedScrollView

// Adaptation: RNS's ViewFinder comes from the (unported) ScrollViewMarker
// epic and also carries a legacy-ScreenStack lookup; only the function the
// container protocol depends on is ported. Lynx's scroll element
// (AndroidScrollView) extends NestedScrollView, so the heuristic applies
// unchanged.
object ViewFinder {
    fun findScrollViewInFirstDescendantChain(view: View): ViewGroup? {
        var currentView: View? = view

        while (currentView != null) {
            if (currentView is ScrollView || currentView is NestedScrollView) {
                // The K1 compiler does not smart-cast through the disjunction.
                return currentView as ViewGroup
            } else if (currentView is ViewGroup && currentView.isNotEmpty()) {
                currentView = currentView.getChildAt(0)
            } else {
                break
            }
        }

        return null
    }
}

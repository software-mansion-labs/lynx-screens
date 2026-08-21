package com.lynxscreens.screens.scrollviewmarker

import android.content.Context
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxElement
import com.lynx.tasm.behavior.ui.UIGroup

// The Lynx counterpart of RNS's ScrollViewMarkerViewManager. Adaptation: the
// iOS-only scroll edge effect props are not exposed - the edge-effect part of
// the ScrollViewMarker epic is not ported (RNS Android ignores them too).
@LynxElement(name = "ls-scroll-view-marker")
internal class ScrollViewMarkerComponent(
    context: LynxContext,
) : UIGroup<ScrollViewMarkerView>(context) {
    override fun createView(context: Context?): ScrollViewMarkerView = ScrollViewMarkerView(context as LynxContext)
}

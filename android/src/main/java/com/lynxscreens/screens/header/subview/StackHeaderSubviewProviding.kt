package com.lynxscreens.screens.header.subview

import android.view.View

interface StackHeaderSubviewProviding {
    val type: StackHeaderSubviewType
    val collapseMode: StackHeaderSubviewCollapseMode

    // Divergence from RNS (where the subview component IS the Android view):
    // on Lynx the component and its painting view are separate objects, and
    // `view` clashes with LynxUI's final getView() - hence `subviewView`.
    val subviewView: View
}

package com.lynxscreens.screens.screen

import android.annotation.SuppressLint
import androidx.fragment.app.Fragment
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.view.AndroidView
import com.lynxscreens.screens.common.FragmentProviding
import com.lynxscreens.screens.ext.findFragmentOrNull

@SuppressLint("ViewConstructor") // should never be restored
class StackScreenView(
    private val lynxContext: LynxContext,
) : AndroidView(lynxContext), FragmentProviding {
    override fun getAssociatedFragment(): Fragment? = this.findFragmentOrNull()?.also {
        check(it is StackScreenFragment) { "[RNScreens] Unexpected fragment type: ${it.javaClass.simpleName}"}
    }
}

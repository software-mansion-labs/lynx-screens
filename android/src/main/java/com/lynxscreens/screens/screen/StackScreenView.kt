package com.lynxscreens.screens.screen

import android.annotation.SuppressLint
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.view.AndroidView
import com.lynxscreens.screens.common.FragmentProviding
import com.lynxscreens.screens.common.container.Container
import com.lynxscreens.screens.common.container.ContainerItem
import com.lynxscreens.screens.common.container.ContainerItemSupport
import com.lynxscreens.screens.ext.findFragmentOrNull
import com.lynxscreens.screens.scrollviewmarker.ScrollViewMarkerView
import com.lynxscreens.screens.scrollviewmarker.ScrollViewSeeking

// Adaptation: RNS implements ContainerItem and ScrollViewSeeking on
// StackScreen, which is both the prop holder and the Android view; on Lynx
// those roles are split and both protocols walk the native view hierarchy, so
// they live on the screen's view. The header-config notification is forwarded
// through a callback wired by the owning StackScreenComponent.
@SuppressLint("ViewConstructor") // should never be restored
class StackScreenView(
    private val lynxContext: LynxContext,
) : AndroidView(lynxContext), FragmentProviding, ContainerItem, ScrollViewSeeking {
    private val containerItemSupport = ContainerItemSupport()

    internal var onContentScrollViewChanged: (() -> Unit)? = null

    internal var onLaidOut: ((width: Int, height: Int) -> Unit)? = null

    override fun onLayout(
        changed: Boolean,
        l: Int,
        t: Int,
        r: Int,
        b: Int,
    ) {
        super.onLayout(changed, l, t, r, b)
        onLaidOut?.invoke(r - l, b - t)
    }

    override fun getAssociatedFragment(): Fragment? = this.findFragmentOrNull()?.also {
        check(it is StackScreenFragment) { "[RNScreens] Unexpected fragment type: ${it.javaClass.simpleName}"}
    }

    override fun registerNestedContainer(container: Container) = containerItemSupport.registerNestedContainer(container)

    override fun unregisterNestedContainer(container: Container) = containerItemSupport.unregisterNestedContainer(container)

    override fun resolveNestedContainer(): Container? = containerItemSupport.resolveNestedContainer()

    override fun findContentScrollView(): ViewGroup? = containerItemSupport.findContentScrollView(this)

    // region ScrollViewSeeking

    override fun registerScrollView(
        marker: ScrollViewMarkerView,
        scrollView: ViewGroup,
    ) {
        containerItemSupport.registerScrollView(scrollView)
        onContentScrollViewChanged?.invoke()
    }

    // endregion
}

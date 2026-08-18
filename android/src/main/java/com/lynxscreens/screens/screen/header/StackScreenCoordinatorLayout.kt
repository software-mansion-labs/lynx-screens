package com.lynxscreens.screens.screen.header

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.widget.FrameLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.lynxscreens.screens.host.StackContainer
import com.lynxscreens.screens.screen.StackScreenComponent
import com.lynxscreens.screens.screen.header.configuration.StackScreenHeaderConfigurationProviding
import com.lynxscreens.screens.screen.header.configuration.StackScreenHeaderType

@SuppressLint("ViewConstructor")
internal class StackScreenCoordinatorLayout(
    context: Context,
    internal val stackScreen: StackScreenComponent,
) : CoordinatorLayout(context) {
    // Divergence from RNS: on RN the current header height is pushed into the Shadow Tree here
    // (contentOriginOffset), because Fabric mounting overrides native view offsets. In Lynx the
    // AppBar behavior offsets stackScreenWrapper natively and the screen's Lynx children are laid
    // out relative to the (already offset) screen view, so forwarding the header height would
    // offset the content twice. Screen size changes reach the Shadow Tree via
    // StackScreenView.onLayout instead.
    private val headerCoordinator =
        StackScreenHeaderCoordinator(context) { _ -> }

    internal var stackScreenWrapper: FrameLayout

    init {
        // Needed when Transition API is in use to ensure that shadows do not disappear,
        // views do not jump around the screen and whole subtree is animated as a whole.
        isTransitionGroup = true

        // Due to how we're synchronizing native & Lynx layout (via content offset applied in
        // StackScreenShadowNode), we can't use the StackScreen view directly as a child of
        // CoordinatorLayout because Lynx UI owner would override Y offset (that depends on the
        // header height) with Y=0. If we wrap the StackScreen view in another view, as Y is
        // relative to parent view, value set by the layout engine will be correct.
        stackScreenWrapper = FrameLayout(context).apply { addView(stackScreen.view) }
        addView(
            stackScreenWrapper,
            LayoutParams(MATCH_PARENT, MATCH_PARENT),
        )

        // TODO: debug-only, this will be sent in reaction to information from "HeaderConfig" component.
        applyHeaderConfiguration(
            object : StackScreenHeaderConfigurationProviding {
                override val headerType = StackScreenHeaderType.LARGE
                override val title = "Hello, World!"
                override val isHidden = false
                override val isTransparent = false
            },
        )
    }

    /**
     * Will crash in case parent is not StackContainer.
     */
    private fun stackContainerOrNull(): StackContainer? = this.parent as StackContainer?

    internal fun maybeRequestLayoutContainer() {
        post {
            stackContainerOrNull()?.forceSubtreeMeasureAndLayoutPass()
        }
    }

    internal fun applyHeaderConfiguration(headerConfigurationProviding: StackScreenHeaderConfigurationProviding) =
        headerCoordinator.applyHeaderConfiguration(this, headerConfigurationProviding)
}

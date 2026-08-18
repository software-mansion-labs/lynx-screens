package com.lynxscreens.screens.header

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.widget.FrameLayout
import androidx.activity.OnBackPressedDispatcherOwner
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.lynxscreens.screens.header.config.OnHeaderConfigAttachListener
import com.lynxscreens.screens.header.config.OnHeaderConfigChangeListener
import com.lynxscreens.screens.header.config.StackHeaderConfigProviding
import com.lynxscreens.screens.screen.StackScreenComponent
import java.lang.ref.WeakReference

@SuppressLint("ViewConstructor")
internal class StackHeaderCoordinatorLayout(
    context: Context,
    internal val stackScreen: StackScreenComponent,
    canNavigateBack: Boolean,
) : CoordinatorLayout(context) {
    private val headerCoordinator =
        StackHeaderCoordinator(
            context = context,
            canNavigateBack = canNavigateBack,
            // Divergence from RNS: on RN the current header height is pushed into the Shadow Tree
            // here (contentOriginOffset), because Fabric mounting overrides native view offsets.
            // In Lynx the AppBar behavior offsets stackScreenWrapper natively and the screen's
            // Lynx children are laid out relative to the (already offset) screen view, so
            // forwarding the header height would offset the content twice. Screen size changes
            // reach the Shadow Tree via StackScreenView.onLayout instead.
            onHeaderHeightChanged = { _ -> },
            onNavigationIconClick = {
                // The fragment constructs this layout with its (activity) context.
                (getContext() as? OnBackPressedDispatcherOwner)
                    ?.onBackPressedDispatcher
                    ?.onBackPressed()
            },
        )

    /**
     * This callback is used to detect when header config is attached.
     * This allows us to configure listener for header config changes.
     */
    private val onHeaderConfigAttach =
        OnHeaderConfigAttachListener { config ->
            handleHeaderConfigAttach(config)
        }

    private var isHeaderUpdatePending = false

    /**
     * This callback is used to listen for header config changes.
     * We use [isHeaderUpdatePending] to batch changes and pass them to [headerCoordinator].
     */
    private val onHeaderConfigChange =
        OnHeaderConfigChangeListener {
            if (!isHeaderUpdatePending) {
                isHeaderUpdatePending = true
                // Read currentConfig when the runnable executes, not when it's posted,
                // to avoid applying a stale config that was swapped out in the meantime.
                post {
                    isHeaderUpdatePending = false
                    headerCoordinator.applyHeaderConfig(this, currentConfig)
                }
            }
        }

    private var currentConfig: StackHeaderConfigProviding? = null

    internal var stackScreenWrapper: FrameLayout

    init {
        // Needed when Transition API is in use to ensure that shadows do not disappear,
        // views do not jump around the screen and whole subtree is animated as a whole.
        isTransitionGroup = true

        // Due to how we're synchronizing native & Lynx layout, we can't use the StackScreen view
        // directly as a child of CoordinatorLayout - wrapping it keeps the behavior-driven Y
        // offset on a native-only view that the Lynx pipeline never repositions.
        stackScreenWrapper = FrameLayout(context).apply { addView(stackScreen.view) }
        addView(
            stackScreenWrapper,
            LayoutParams(MATCH_PARENT, MATCH_PARENT),
        )

        stackScreen.onHeaderConfigAttachListener = WeakReference(onHeaderConfigAttach)
        handleHeaderConfigAttach(stackScreen.headerConfig)
    }

    private fun handleHeaderConfigAttach(config: StackHeaderConfigProviding?) {
        // Disconnect old config to prevent spurious updates from a detached config
        currentConfig?.setOnConfigChangeListener(null)
        currentConfig = config

        config?.setOnConfigChangeListener(onHeaderConfigChange)

        // We run this even if config is null to properly remove the header if config
        // is removed in runtime.
        headerCoordinator.applyHeaderConfig(this, config)
    }
}

package com.lynxscreens.screens.header

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.widget.FrameLayout
import androidx.activity.OnBackPressedDispatcherOwner
import androidx.appcompat.view.ContextThemeWrapper
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.google.android.material.R
import com.google.android.material.appbar.AppBarLayout
import com.lynxscreens.screens.header.config.OnHeaderConfigurationAttachListener
import com.lynxscreens.screens.header.config.StackHeaderConfigurationObserver
import com.lynxscreens.screens.header.config.StackHeaderConfigurationProviding
import com.lynxscreens.screens.header.config.StackHeaderDelegate
import com.lynxscreens.screens.header.config.StackHeaderInvalidationFlags
import com.lynxscreens.screens.header.subview.StackHeaderSubviewProviding
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuItemOptions
import com.lynxscreens.screens.screen.StackScreenComponent

@SuppressLint("ViewConstructor")
internal class StackHeaderCoordinatorLayout(
    context: Context,
    internal val stackScreen: StackScreenComponent,
    private val canNavigateBack: Boolean,
) : CoordinatorLayout(context) {
    // region Config attach / detach

    private var currentProvider: StackHeaderConfigurationProviding? = null
    private var currentDelegate: StackHeaderDelegate? = null

    // This callback is used to detect when header config is attached.
    // This allows us to configure the delegate for header config interactions.
    private val onHeaderConfigAttached =
        OnHeaderConfigurationAttachListener { provider, delegate ->
            handleHeaderConfigAttach(provider, delegate)
        }

    private fun handleHeaderConfigAttach(
        provider: StackHeaderConfigurationProviding?,
        delegate: StackHeaderDelegate?,
    ) {
        // Disconnect old config to prevent spurious updates from a detached config.
        currentProvider?.setConfigurationObserver(null)

        currentProvider = provider
        currentDelegate = delegate

        if (provider != null) {
            provider.setConfigurationObserver(configObserver)
            processUpdate(provider)
        } else {
            removeHeader()
        }
    }

    // endregion

    // region Configuration observer

    private val configObserver =
        object : StackHeaderConfigurationObserver {
            override fun onConfigChanged(config: StackHeaderConfigurationProviding) = processUpdate(config)

            override fun onMenuItemUpdated(
                id: String,
                options: StackHeaderToolbarMenuItemOptions,
            ) {
                val toolbar = appBarLayout?.toolbar ?: return
                applicator.updateToolbarMenuItem(toolbar, toolbarMenuForwardIdMap, id, options)
            }
        }

    // endregion

    // region Layout callbacks

    private val appBarOffsetListener =
        AppBarLayout.OnOffsetChangedListener { _, _ ->
            onMaybeHeaderLayoutChanged()
        }

    private val appBarLayoutChangeListener =
        OnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
            onMaybeHeaderLayoutChanged()
        }

    private fun attachAppBarListeners(appBar: StackHeaderAppBarLayout) {
        appBar.addOnOffsetChangedListener(appBarOffsetListener)
        appBar.addOnLayoutChangeListener(appBarLayoutChangeListener)
    }

    private fun detachAppBarListeners(appBar: StackHeaderAppBarLayout) {
        appBar.removeOnOffsetChangedListener(appBarOffsetListener)
        appBar.removeOnLayoutChangeListener(appBarLayoutChangeListener)
    }

    private fun onMaybeHeaderLayoutChanged() {
        val delegate = currentDelegate ?: return
        val provider = currentProvider ?: return
        val appBar = appBarLayout ?: return

        // When config is transparent, the StackScreen is static so we need to offset the header
        // config by the offset of the AppBarLayout (which is 0 or is negative). When config is
        // opaque, the Screen always moves with the config, that's why we need to offset the
        // header config by the negative value of AppBarLayout's height.
        val configOffset = if (provider.transparent) appBar.top else appBar.top - appBar.bottom

        delegate.onHeaderFrameChanged(
            appBar.width,
            appBar.height,
            configOffset,
        )

        updateSubviewOffsets(appBar, provider)
    }

    private fun updateSubviewOffsets(
        appBar: StackHeaderAppBarLayout,
        config: StackHeaderConfigurationProviding,
    ) {
        config.leadingSubview?.let { updateSubviewOffset(it, appBar) }
        config.centerSubview?.let { updateSubviewOffset(it, appBar) }
        config.trailingSubview?.let { updateSubviewOffset(it, appBar) }
        config.backgroundSubview?.let { updateSubviewOffset(it, appBar) }
    }

    private fun updateSubviewOffset(
        subview: StackHeaderSubviewProviding,
        appBar: StackHeaderAppBarLayout,
    ) {
        val view = subview.subviewView
        if (view.width == 0 && view.height == 0) return

        val appBarPos = IntArray(2)
        val subviewPos = IntArray(2)
        appBar.getLocationInWindow(appBarPos)
        view.getLocationInWindow(subviewPos)

        currentDelegate?.onSubviewOriginChanged(
            subview.type,
            x = subviewPos[0] - appBarPos[0],
            y = subviewPos[1] - appBarPos[1],
        )
    }

    // endregion

    // region Header updates

    private val wrappedContext =
        ContextThemeWrapper(
            context,
            R.style.Theme_Material3_DayNight_NoActionBar,
        )

    private val applicator = StackHeaderApplicator(wrappedContext)

    private var appBarLayout: StackHeaderAppBarLayout? = null

    private var toolbarMenuForwardIdMap = emptyMap<String, Int>()

    private val onNavigationIconClick: () -> Unit = {
        // The fragment constructs this layout with its (activity) context.
        (getContext() as? OnBackPressedDispatcherOwner)
            ?.onBackPressedDispatcher
            ?.onBackPressed()
    }

    private fun processUpdate(provider: StackHeaderConfigurationProviding) {
        val needsRebuild = provider.invalidationFlags.needsRebuild
        if (needsRebuild) {
            resetHeader()
            if (provider.hidden) {
                removeContentBehavior()
                requestLayout()
                provider.clearInvalidationFlags(StackHeaderInvalidationFlags.ALL)
                return
            }

            val appBar = applicator.rebuild(this, provider)
            appBarLayout = appBar
            attachAppBarListeners(appBar)

            // If config needs to be rebuilt, all other flags must be invalidated as well.
            provider.clearInvalidationFlags(
                StackHeaderInvalidationFlags.STRUCTURE or StackHeaderInvalidationFlags.SUBVIEWS,
            )
        }

        val appBar = appBarLayout
        if (appBar != null) {
            if (needsRebuild || provider.invalidationFlags.containsAny(StackHeaderInvalidationFlags.TITLE)) {
                applicator.applyTitle(appBar, provider)
                provider.clearInvalidationFlags(StackHeaderInvalidationFlags.TITLE)
            }

            if (needsRebuild || provider.invalidationFlags.containsAny(StackHeaderInvalidationFlags.BACK_BUTTON)) {
                applicator.applyBackButton(appBar.toolbar, provider, canNavigateBack, onNavigationIconClick)
                provider.clearInvalidationFlags(StackHeaderInvalidationFlags.BACK_BUTTON)
            }

            if (needsRebuild || provider.invalidationFlags.containsAny(StackHeaderInvalidationFlags.SCROLL_FLAGS)) {
                applicator.applyScrollFlags(appBar, provider)
                provider.clearInvalidationFlags(StackHeaderInvalidationFlags.SCROLL_FLAGS)
            }

            if (provider.invalidationFlags.containsAny(StackHeaderInvalidationFlags.TOOLBAR_MENU)) {
                val (forwardIdMap, reverseIdMap) =
                    applicator.generateToolbarMenuItemMappings(
                        provider.toolbarMenu,
                    )

                applicator.rebuildToolbarMenu(
                    appBar.toolbar,
                    provider.toolbarMenu,
                    forwardIdMap,
                    reverseIdMap,
                ) { id -> currentDelegate?.onMenuItemClicked(id) }

                // We only need to keep forward map for view commands.
                toolbarMenuForwardIdMap = forwardIdMap

                provider.clearInvalidationFlags(StackHeaderInvalidationFlags.TOOLBAR_MENU)
            }
        }

        onMaybeHeaderLayoutChanged()
    }

    // endregion

    // region Header lifecycle

    private fun resetHeader() {
        appBarLayout?.let {
            detachAppBarListeners(it)
            removeView(it)
        }
        appBarLayout = null
        toolbarMenuForwardIdMap = emptyMap()
    }

    private fun removeHeader() {
        resetHeader()
        removeContentBehavior()
        requestLayout()
    }

    // endregion

    // region Content behavior

    internal fun setContentBehavior() {
        val params = stackScreenWrapper.layoutParams as LayoutParams
        if (params.behavior == null) {
            params.behavior =
                StackHeaderScrollingViewBehavior { _, _ ->
                    // Divergence from RNS: on RN the content top offset is forwarded to the
                    // StackScreen here (contentOriginOffset), because Fabric mounting overrides
                    // native view offsets. In Lynx the behavior offsets stackScreenWrapper
                    // natively and the screen's Lynx children are laid out relative to the
                    // (already offset) screen view, so forwarding the offset would shift the
                    // content twice. Screen size changes reach the Shadow Tree via
                    // StackScreenView.onLayout instead.
                }
            stackScreenWrapper.layoutParams = params
            stackScreenWrapper.requestLayout()
        }
    }

    internal fun removeContentBehavior() {
        val params = stackScreenWrapper.layoutParams as LayoutParams
        if (params.behavior != null) {
            params.behavior = null
            stackScreenWrapper.layoutParams = params
            stackScreenWrapper.requestLayout()
        }
    }

    // endregion

    // region Init

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

        stackScreen.registerHeaderConfigAttachListener(onHeaderConfigAttached)
    }

    // endregion

    // region Teardown

    internal fun tearDown() {
        removeHeader()

        stackScreenWrapper.removeView(stackScreen.view)

        currentProvider?.setConfigurationObserver(null)
        currentProvider = null
        currentDelegate = null

        stackScreen.clearHeaderConfigAttachListener()
    }

    // endregion
}

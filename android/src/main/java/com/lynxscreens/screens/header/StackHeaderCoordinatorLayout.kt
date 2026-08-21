package com.lynxscreens.screens.header

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.widget.FrameLayout
import androidx.activity.OnBackPressedDispatcherOwner
import androidx.appcompat.view.ContextThemeWrapper
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.google.android.material.R
import com.google.android.material.appbar.AppBarLayout
import com.google.android.material.appbar.MaterialToolbar
import com.lynxscreens.screens.header.appbar.StackHeaderAppBarLayout
import com.lynxscreens.screens.header.appbar.StackHeaderScrollingViewBehavior
import com.lynxscreens.screens.header.config.OnHeaderConfigurationAttachListener
import com.lynxscreens.screens.header.config.StackHeaderConfigurationObserver
import com.lynxscreens.screens.header.config.StackHeaderConfigurationProviding
import com.lynxscreens.screens.header.config.StackHeaderDelegate
import com.lynxscreens.screens.header.config.StackHeaderInvalidationFlags
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuApplicator
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuSelectionController
import com.lynxscreens.screens.header.toolbar.update.StackHeaderToolbarMenuElementUpdate
import com.lynxscreens.screens.screen.StackScreenComponent

/**
 * Root CoordinatorLayout for a screen's header: hosts the app bar and the
 * content wrapper, wires header-config attach/observe, routes config
 * invalidations to the applicators, and owns header lifecycle/teardown.
 */
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

            override fun onMenuElementsUpdated(updates: List<StackHeaderToolbarMenuElementUpdate>) {
                val toolbar = appBarLayout?.toolbar
                if (toolbar == null) {
                    Log.w(
                        TAG,
                        "[RNScreens] Dropping ${updates.size} resolved toolbar menu update(s): " +
                            "the header toolbar is not currently attached (header hidden or detached).",
                    )
                    return
                }
                // Apply every element first, collecting the groups whose selection changed,
                // then emit a single coalesced event per affected group.
                val affectedGroups = LinkedHashSet<String>()
                for (update in updates) {
                    StackHeaderToolbarMenuApplicator.updateToolbarMenuElement(
                        toolbar,
                        selectionController.forwardIdMap,
                        update.id,
                        update.options,
                    )
                    val checked = update.options.checked
                    if (checked != null) {
                        selectionController.applyGroupItemStateChange(toolbar, update.id, checked)?.let(affectedGroups::add)
                    }
                }
                affectedGroups.forEach { groupId -> emitGroupSelection(toolbar, groupId) }
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
        StackHeaderFrameSynchronizer.sync(appBar, provider, delegate)
    }

    // endregion

    // region Header updates

    private val wrappedContext =
        ContextThemeWrapper(
            context,
            R.style.Theme_Material3Expressive_DayNight_NoActionBar,
        )

    private val applicator = StackHeaderApplicator(wrappedContext)

    private val selectionController = StackHeaderToolbarMenuSelectionController()

    private var appBarLayout: StackHeaderAppBarLayout? = null

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

            if (needsRebuild || provider.invalidationFlags.containsAny(StackHeaderInvalidationFlags.LIFT_ON_SCROLL)) {
                // Lift-on-scroll is disabled in transparent mode: there is no content
                // scrolling behavior installed and the app bar overlays the content.
                applicator.applyLiftOnScroll(
                    appBar,
                    enabled = provider.liftOnScroll && !provider.transparent,
                    targetScrollView = stackScreen.view.findContentScrollView(),
                )
                provider.clearInvalidationFlags(StackHeaderInvalidationFlags.LIFT_ON_SCROLL)
            }

            if (provider.invalidationFlags.containsAny(StackHeaderInvalidationFlags.TOOLBAR_MENU)) {
                val (forwardIdMap, reverseIdMap) =
                    StackHeaderToolbarMenuApplicator.generateToolbarMenuItemMappings(
                        provider.toolbarMenu,
                    )
                val forwardGroupIdMap =
                    StackHeaderToolbarMenuApplicator.generateToolbarMenuGroupMappings(
                        provider.toolbarMenu,
                    )
                val groupMetadata =
                    StackHeaderToolbarMenuApplicator.computeGroupMetadata(
                        provider.toolbarMenu,
                    )

                StackHeaderToolbarMenuApplicator.validateRadioInitialSelection(provider.toolbarMenu)

                selectionController.setMenuMaps(forwardIdMap, groupMetadata)

                StackHeaderToolbarMenuApplicator.rebuildToolbarMenu(
                    appBar.toolbar,
                    provider.toolbarMenu,
                    forwardIdMap,
                    reverseIdMap,
                    forwardGroupIdMap,
                    groupDividerEnabled = provider.toolbarMenuGroupDividerEnabled,
                    onItemClicked = { id, menuItem ->
                        if (menuItem.isCheckable) {
                            selectionController.applyGroupItemStateChange(appBar.toolbar, id)?.let { groupId ->
                                emitGroupSelection(appBar.toolbar, groupId)
                            }
                        } else {
                            currentDelegate?.onMenuItemClicked(id)
                        }
                    },
                )

                provider.clearInvalidationFlags(StackHeaderInvalidationFlags.TOOLBAR_MENU)
            }
        }

        onMaybeHeaderLayoutChanged()
    }

    // endregion

    // region Group selection

    private fun emitGroupSelection(
        toolbar: MaterialToolbar,
        groupId: String,
    ) {
        currentDelegate?.onGroupSelectionChanged(groupId, selectionController.collectSelectedIds(toolbar, groupId))
    }

    // endregion

    // region Header lifecycle

    private fun resetHeader() {
        appBarLayout?.let {
            detachAppBarListeners(it)
            removeView(it)
        }
        appBarLayout = null
        selectionController.clear()
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

    companion object {
        private const val TAG = "StackHeaderCoordinatorLayout"
    }
}

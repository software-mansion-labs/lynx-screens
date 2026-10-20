package com.lynxscreens.screens.header.config

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.Drawable
import android.util.Log
import android.view.Gravity
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxElement
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.LynxUIMethod
import com.lynx.tasm.behavior.LynxUIMethodConstants
import com.lynx.tasm.behavior.StylesDiffMap
import com.lynx.tasm.behavior.ui.LynxBaseUI
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynxscreens.screens.common.ShadowStateProxy
import com.lynxscreens.screens.common.text.ReactTextAppearance
import com.lynxscreens.screens.header.subview.OnStackHeaderSubviewChangeListener
import com.lynxscreens.screens.header.subview.StackHeaderSubviewComponent
import com.lynxscreens.screens.header.subview.StackHeaderSubviewType
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuController
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuDelegate
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuMapper
import com.lynxscreens.screens.header.toolbar.model.StackHeaderToolbarMenuConfig
import com.lynxscreens.screens.header.toolbar.update.StackHeaderToolbarMenuElementRawUpdate
import com.lynxscreens.screens.header.toolbar.update.StackHeaderToolbarMenuIconResolver
import com.lynxscreens.screens.helpers.IconResolution
import com.lynxscreens.screens.helpers.PropIconResolver
import com.lynxscreens.screens.helpers.resolveImage
import java.lang.IllegalArgumentException
import java.lang.ref.WeakReference
import kotlin.properties.Delegates

@LynxElement(name = "ls-stack-header-config")
internal class StackHeaderConfigComponent(
    context: LynxContext,
) : UIGroup<StackHeaderConfigView>(context),
    StackHeaderConfigurationProviding,
    StackHeaderDelegate,
    StackHeaderToolbarMenuDelegate,
    OnStackHeaderSubviewChangeListener {
    // region Handling configuration changes

    private var configObserver: StackHeaderConfigurationObserver? = null

    override fun setConfigurationObserver(observer: StackHeaderConfigurationObserver?) {
        configObserver = observer
    }

    private fun invalidate(flags: StackHeaderInvalidationFlags) {
        when {
            // Adaptation: RNS reports every change right away and the host's mount transaction
            // (willMountItems/didMountItems) holds the consumer's flush. Lynx has no transaction
            // bracket, so the changes raised by this config's own props batch are coalesced here
            // and reported once from onPropsUpdated (see updatePropertiesInterval).
            isInsidePropsUpdate -> pendingNotificationFlags = pendingNotificationFlags or flags
            // Adaptation: on Lynx child mounting precedes layout application within a patch, so
            // out-of-band subview changes (child attach/detach, subview prop batches) are reported
            // one frame later - otherwise freshly attached subviews reach the Toolbar as 0x0 views.
            flags.containsAny(StackHeaderInvalidationFlags.SUBVIEWS) -> scheduleInvalidation(flags)
            else -> configObserver?.onInvalidated(flags)
        }
    }

    private var pendingNotificationFlags = StackHeaderInvalidationFlags.NONE

    private fun reportPendingInvalidations() {
        val flags = pendingNotificationFlags
        pendingNotificationFlags = StackHeaderInvalidationFlags.NONE
        if (!flags.isEmpty) {
            configObserver?.onInvalidated(flags)
        }
    }

    private var deferredNotificationFlags = StackHeaderInvalidationFlags.NONE
    private var isDeferredNotificationScheduled = false

    private fun scheduleInvalidation(flags: StackHeaderInvalidationFlags) {
        deferredNotificationFlags = deferredNotificationFlags or flags
        if (isDeferredNotificationScheduled) return
        isDeferredNotificationScheduled = true
        view.post {
            isDeferredNotificationScheduled = false
            val deferredFlags = deferredNotificationFlags
            deferredNotificationFlags = StackHeaderInvalidationFlags.NONE
            if (!deferredFlags.isEmpty) {
                configObserver?.onInvalidated(deferredFlags)
            }
        }
    }

    // endregion

    // region Properties

    override var type: StackHeaderType by invalidatingProperty(StackHeaderType.SMALL, StackHeaderInvalidationFlags.STRUCTURE)
        internal set

    override var title: String by invalidatingProperty("", StackHeaderInvalidationFlags.TITLE)
        internal set

    override var subtitle: String by invalidatingProperty("", StackHeaderInvalidationFlags.TITLE)
        internal set

    // Requires header rebuild due to bug in Material implementation
    override var maxLines: Int by invalidatingProperty(1, StackHeaderInvalidationFlags.STRUCTURE)
        internal set

    override var hidden: Boolean by invalidatingProperty(false, StackHeaderInvalidationFlags.STRUCTURE)
        internal set

    override var transparent: Boolean by invalidatingProperty(false, StackHeaderInvalidationFlags.STRUCTURE)
        internal set

    override var backButtonHidden: Boolean by invalidatingProperty(false, StackHeaderInvalidationFlags.BACK_BUTTON)
        internal set

    override var backButtonTintColorNormal: Int? by invalidatingProperty(null, StackHeaderInvalidationFlags.BACK_BUTTON)
        internal set

    override var backButtonTintColorPressed: Int? by invalidatingProperty(null, StackHeaderInvalidationFlags.BACK_BUTTON)
        internal set

    override var backButtonTintColorFocused: Int? by invalidatingProperty(null, StackHeaderInvalidationFlags.BACK_BUTTON)
        internal set

    override var backButtonIcon: Drawable? by invalidatingProperty(null, StackHeaderInvalidationFlags.BACK_BUTTON)
        internal set

    override var overflowIconTintColorNormal: Int? by invalidatingProperty(null, StackHeaderInvalidationFlags.OVERFLOW_ICON)
        internal set

    override var overflowIconTintColorPressed: Int? by invalidatingProperty(null, StackHeaderInvalidationFlags.OVERFLOW_ICON)
        internal set

    override var overflowIconTintColorFocused: Int? by invalidatingProperty(null, StackHeaderInvalidationFlags.OVERFLOW_ICON)
        internal set

    override var overflowIcon: Drawable? by invalidatingProperty(null, StackHeaderInvalidationFlags.OVERFLOW_ICON)
        internal set

    override var scrollFlagScroll: Boolean by invalidatingProperty(false, StackHeaderInvalidationFlags.SCROLL_FLAGS)
        internal set

    override var scrollFlagEnterAlways: Boolean by invalidatingProperty(false, StackHeaderInvalidationFlags.SCROLL_FLAGS)
        internal set

    override var scrollFlagEnterAlwaysCollapsed: Boolean by invalidatingProperty(false, StackHeaderInvalidationFlags.SCROLL_FLAGS)
        internal set

    override var scrollFlagExitUntilCollapsed: Boolean by invalidatingProperty(false, StackHeaderInvalidationFlags.SCROLL_FLAGS)
        internal set

    override var scrollFlagSnap: Boolean by invalidatingProperty(false, StackHeaderInvalidationFlags.SCROLL_FLAGS)
        internal set

    override var liftOnScroll: Boolean by invalidatingProperty(true, StackHeaderInvalidationFlags.LIFT_ON_SCROLL)
        internal set

    override var backgroundColor: Int? by invalidatingProperty(null, StackHeaderInvalidationFlags.BACKGROUND_COLORS)
        internal set

    override var scrolledBackgroundColor: Int? by invalidatingProperty(null, StackHeaderInvalidationFlags.BACKGROUND_COLORS)
        internal set

    override var statusBarScrimColor: Int? by invalidatingProperty(null, StackHeaderInvalidationFlags.BACKGROUND_COLORS)
        internal set

    override var titleCentered: Boolean by invalidatingProperty(false, StackHeaderInvalidationFlags.TITLE_POSITIONING)
        internal set

    override var subtitleCentered: Boolean by invalidatingProperty(false, StackHeaderInvalidationFlags.TITLE_POSITIONING)
        internal set

    override var expandedTitleHorizontalGravity: Int by invalidatingProperty(Gravity.START, StackHeaderInvalidationFlags.TITLE_POSITIONING)
        internal set

    override var expandedTitleVerticalGravity: Int by invalidatingProperty(Gravity.BOTTOM, StackHeaderInvalidationFlags.TITLE_POSITIONING)
        internal set

    override var collapsedTitleHorizontalGravity: Int by invalidatingProperty(Gravity.START, StackHeaderInvalidationFlags.TITLE_POSITIONING)
        internal set

    override var collapsedTitleVerticalGravity: Int by invalidatingProperty(
        Gravity.CENTER_VERTICAL,
        StackHeaderInvalidationFlags.TITLE_POSITIONING,
    )
        internal set

    override var collapsedTitleGravityMode: StackHeaderCollapsedTitleGravityMode
        by invalidatingProperty(StackHeaderCollapsedTitleGravityMode.AVAILABLE_SPACE, StackHeaderInvalidationFlags.STRUCTURE)
        internal set

    override var contentInsetStart: Float?
        by invalidatingProperty(null, StackHeaderInvalidationFlags.CONTENT_INSETS)
        internal set

    override var contentInsetEnd: Float?
        by invalidatingProperty(null, StackHeaderInvalidationFlags.CONTENT_INSETS)
        internal set

    override val titleAppearance = ReactTextAppearance(lynxContext, ::invalidateTextAppearance)
    override val subtitleAppearance = ReactTextAppearance(lynxContext, ::invalidateTextAppearance)
    override val expandedTitleAppearance = ReactTextAppearance(lynxContext, ::invalidateTextAppearance)
    override val collapsedTitleAppearance = ReactTextAppearance(lynxContext, ::invalidateTextAppearance)
    override val expandedSubtitleAppearance = ReactTextAppearance(lynxContext, ::invalidateTextAppearance)
    override val collapsedSubtitleAppearance = ReactTextAppearance(lynxContext, ::invalidateTextAppearance)

    private fun invalidateTextAppearance() = invalidate(StackHeaderInvalidationFlags.TITLE_APPEARANCE)

    // endregion

    // region Content scroll view

    /**
     * Called by the owning [com.lynxscreens.screens.screen.StackScreenComponent]
     * when its content scroll view changes (e.g. a `ScrollViewMarker` registered
     * one). Re-triggers lift-on-scroll so the coordinator can resolve and apply
     * the up-to-date `liftOnScrollTargetView`.
     */
    internal fun onContentScrollViewChanged() {
        invalidate(StackHeaderInvalidationFlags.LIFT_ON_SCROLL)
    }

    // endregion

    // region Back button icon resolution

    // Staging fields for back button icon resolution.
    // Both props may arrive in any order within a single update batch.
    // Resolution happens in resolveBackButtonIconIfNeeded(), called from onPropsUpdated.
    internal var backButtonDrawableIconResourceName: String? = null
    internal var backButtonImageIconUri: String? = null
    private val backButtonIconResolver = createPropIconResolver(lynxContext)

    internal fun resolveBackButtonIconIfNeeded() {
        backButtonIconResolver.resolve(
            backButtonDrawableIconResourceName,
            backButtonImageIconUri,
        ) { result ->
            when (result) {
                IconResolution.Unchanged -> Unit
                is IconResolution.Resolved -> backButtonIcon = result.drawable
            }
        }
    }

    // endregion

    // region Overflow menu icon resolution

    // Staging fields for overflow menu icon resolution — mirrors the back button icon.
    // Resolution happens in resolveOverflowIconIfNeeded(), called from onPropsUpdated.
    internal var overflowIconDrawableIconResourceName: String? = null
    internal var overflowIconImageIconUri: String? = null
    private val overflowIconResolver = createPropIconResolver(lynxContext)

    internal fun resolveOverflowIconIfNeeded() {
        overflowIconResolver.resolve(
            overflowIconDrawableIconResourceName,
            overflowIconImageIconUri,
        ) { result ->
            when (result) {
                IconResolution.Unchanged -> Unit
                is IconResolution.Resolved -> overflowIcon = result.drawable
            }
        }
    }

    // endregion

    // region Toolbar menu

    override val toolbarMenuController =
        StackHeaderToolbarMenuController(createMenuIconResolver(lynxContext))
            .also { it.delegate = WeakReference(this) }

    internal fun setToolbarMenuFromProps(menu: StackHeaderToolbarMenuConfig) {
        if (toolbarMenuController.setMenu(menu)) {
            invalidate(StackHeaderInvalidationFlags.TOOLBAR_MENU)
        }
    }

    internal fun setToolbarMenuGroupDividerEnabledFromProps(enabled: Boolean) {
        if (toolbarMenuController.setGroupDividerEnabled(enabled)) {
            invalidate(StackHeaderInvalidationFlags.TOOLBAR_MENU)
        }
    }

    internal fun dispatchMenuElementUpdates(updates: List<StackHeaderToolbarMenuElementRawUpdate>) {
        toolbarMenuController.enqueueElementUpdates(updates)
    }

    // StackHeaderToolbarMenuDelegate -> JS events

    override fun onMenuItemClicked(id: String) {
        eventEmitter.emitOnToolbarMenuItemPress(id)
    }

    override fun onGroupSelectionChanged(
        groupId: String,
        selectedIds: List<String>,
    ) {
        eventEmitter.emitOnToolbarMenuGroupSelectionChange(groupId, selectedIds)
    }

    // endregion

    // region Subviews

    override var backgroundSubview: StackHeaderSubviewComponent? by invalidatingProperty(null, StackHeaderInvalidationFlags.SUBVIEWS)
        private set

    override var leadingSubview: StackHeaderSubviewComponent? by invalidatingProperty(null, StackHeaderInvalidationFlags.SUBVIEWS)
        private set

    override var centerSubview: StackHeaderSubviewComponent? by invalidatingProperty(null, StackHeaderInvalidationFlags.SUBVIEWS)
        private set

    override var trailingSubview: StackHeaderSubviewComponent? by invalidatingProperty(null, StackHeaderInvalidationFlags.SUBVIEWS)
        private set

    override fun onStackHeaderSubviewChanged() {
        invalidate(StackHeaderInvalidationFlags.SUBVIEWS)
    }

    internal fun addConfigSubview(headerSubview: StackHeaderSubviewComponent) {
        when (headerSubview.type) {
            StackHeaderSubviewType.BACKGROUND -> backgroundSubview = headerSubview
            StackHeaderSubviewType.LEADING -> leadingSubview = headerSubview
            StackHeaderSubviewType.CENTER -> centerSubview = headerSubview
            StackHeaderSubviewType.TRAILING -> trailingSubview = headerSubview
        }
        headerSubview.onStackHeaderSubviewChangeListener = WeakReference(this)
    }

    internal fun removeConfigSubview(headerSubview: StackHeaderSubviewComponent) {
        headerSubview.onStackHeaderSubviewChangeListener = null
        when (headerSubview.type) {
            StackHeaderSubviewType.BACKGROUND -> backgroundSubview = null
            StackHeaderSubviewType.LEADING -> leadingSubview = null
            StackHeaderSubviewType.CENTER -> centerSubview = null
            StackHeaderSubviewType.TRAILING -> trailingSubview = null
        }
    }

    internal fun removeAllConfigSubviews() {
        backgroundSubview?.let { removeConfigSubview(it) }
        leadingSubview?.let { removeConfigSubview(it) }
        centerSubview?.let { removeConfigSubview(it) }
        trailingSubview?.let { removeConfigSubview(it) }
    }

    internal fun getConfigSubviewAt(index: Int): StackHeaderSubviewComponent? = getListOfSubviews().getOrNull(index)

    private fun getListOfSubviews() = listOfNotNull(backgroundSubview, leadingSubview, centerSubview, trailingSubview)

    // endregion

    // region StackHeaderDelegate & Shadow state synchronization

    private val shadowStateProxy: ShadowStateProxy by lazy {
        ShadowStateProxy(lynxContext, sign)
    }

    override fun onHeaderFrameChanged(
        width: Int,
        height: Int,
        contentOffsetY: Int,
    ) {
        shadowStateProxy.updateStateIfNeeded(
            frameWidth = width,
            frameHeight = height,
            contentOffsetY = contentOffsetY,
        )
    }

    override fun onSubviewOriginChanged(
        type: StackHeaderSubviewType,
        x: Int,
        y: Int,
    ) {
        val subview =
            when (type) {
                StackHeaderSubviewType.BACKGROUND -> backgroundSubview
                StackHeaderSubviewType.LEADING -> leadingSubview
                StackHeaderSubviewType.CENTER -> centerSubview
                StackHeaderSubviewType.TRAILING -> trailingSubview
            }
        subview?.updateContentOriginOffset(x, y)
    }

    // endregion

    // region Event emitter

    private val eventEmitter: StackHeaderConfigEventEmitter by lazy {
        StackHeaderConfigEventEmitter(lynxContext, sign)
    }

    // endregion

    // region Lynx component plumbing

    override fun createView(context: Context?): StackHeaderConfigView = StackHeaderConfigView(context as LynxContext)

    // Subviews need to be positioned by native layout from Toolbar and CollapsingToolbarLayout.
    override fun needCustomLayout(): Boolean = true

    override fun insertChild(
        child: LynxBaseUI,
        index: Int,
    ) {
        require(child is StackHeaderSubviewComponent) {
            "[RNScreens] StackHeaderConfig can only have children of type StackHeaderSubview. Received $child instead."
        }
        super.insertChild(child, index)
        addConfigSubview(child)
    }

    override fun removeChild(child: LynxBaseUI?) {
        require(child is StackHeaderSubviewComponent) {
            "[RNScreens] StackHeaderConfig can only have children of type StackHeaderSubview. Attempted to remove $child instead."
        }
        removeConfigSubview(child)
        super.removeChild(child)
    }

    override fun removeAll() {
        removeAllConfigSubviews()
        super.removeAll()
    }

    /**
     * Lynx analog of the RNS mount transaction (willMountItems/didMountItems) for
     * this config's own updates: prop setters run synchronously between
     * updatePropertiesInterval and onPropsUpdated, so the changes they raise are
     * coalesced "inside the transaction" and reported to the observer once. The
     * bracket also covers synchronously-resolving icon callbacks.
     */
    private var isInsidePropsUpdate = false

    override fun updatePropertiesInterval(props: StylesDiffMap?) {
        isInsidePropsUpdate = true
        super.updatePropertiesInterval(props)
    }

    override fun onPropsUpdated() {
        super.onPropsUpdated()
        isInsidePropsUpdate = true
        resolveBackButtonIconIfNeeded()
        resolveOverflowIconIfNeeded()
        isInsidePropsUpdate = false
        reportPendingInvalidations()
    }

    // Lynx analog of RNS's onDropViewInstance-driven teardown.
    override fun destroy() {
        tearDown()
        super.destroy()
    }

    internal fun tearDown() {
        toolbarMenuController.tearDown()
        configObserver = null
        pendingNotificationFlags = StackHeaderInvalidationFlags.NONE
        deferredNotificationFlags = StackHeaderInvalidationFlags.NONE
    }

    // endregion

    // region Props

    // Unlike Fabric, Lynx invokes prop setters also for absent/reset props, delivering null -
    // fall back to the default instead of throwing.
    @LynxProp(name = "type")
    fun setType(value: String?) {
        type =
            when (value) {
                "small", null -> StackHeaderType.SMALL
                "medium" -> StackHeaderType.MEDIUM
                "large" -> StackHeaderType.LARGE
                else -> throw IllegalArgumentException("[RNScreens] Invalid StackHeaderConfig type: $value.")
            }
    }

    @LynxProp(name = "title")
    fun setTitle(value: String?) {
        title = value ?: ""
    }

    @LynxProp(name = "subtitle")
    fun setSubtitle(value: String?) {
        subtitle = value ?: ""
    }

    @LynxProp(name = "maxLines", defaultInt = 1)
    fun setMaxLines(value: Int) {
        maxLines = value.coerceAtLeast(1)
    }

    @LynxProp(name = "titleCentered")
    fun setTitleCentered(value: Boolean?) {
        titleCentered = value == true
    }

    @LynxProp(name = "subtitleCentered")
    fun setSubtitleCentered(value: Boolean?) {
        subtitleCentered = value == true
    }

    // Unlike Fabric (codegen WithDefault), Lynx delivers null for an absent prop - the setters
    // fall back to the RNS defaults.
    @LynxProp(name = "expandedTitleHorizontalGravity")
    fun setExpandedTitleHorizontalGravity(value: String?) {
        expandedTitleHorizontalGravity = parseHorizontalGravity(value, Gravity.START)
    }

    @LynxProp(name = "expandedTitleVerticalGravity")
    fun setExpandedTitleVerticalGravity(value: String?) {
        expandedTitleVerticalGravity = parseVerticalGravity(value, Gravity.BOTTOM)
    }

    @LynxProp(name = "collapsedTitleHorizontalGravity")
    fun setCollapsedTitleHorizontalGravity(value: String?) {
        collapsedTitleHorizontalGravity = parseHorizontalGravity(value, Gravity.START)
    }

    @LynxProp(name = "collapsedTitleVerticalGravity")
    fun setCollapsedTitleVerticalGravity(value: String?) {
        collapsedTitleVerticalGravity = parseVerticalGravity(value, Gravity.CENTER_VERTICAL)
    }

    @LynxProp(name = "collapsedTitleGravityMode")
    fun setCollapsedTitleGravityMode(value: String?) {
        collapsedTitleGravityMode =
            when (value) {
                "entireSpace" -> StackHeaderCollapsedTitleGravityMode.ENTIRE_SPACE
                "availableSpace", null -> StackHeaderCollapsedTitleGravityMode.AVAILABLE_SPACE
                else -> throw IllegalArgumentException(
                    "[RNScreens] Invalid StackHeaderConfig collapsedTitleGravityMode: $value.",
                )
            }
    }

    // region Header spacing
    // Spacing arrives as a float defaulting to -1 (unset); 0 is a valid, applied value.

    @LynxProp(name = "contentInsetStart", defaultFloat = -1f)
    fun setContentInsetStart(value: Float) {
        contentInsetStart = value.takeIf { it >= 0f }
    }

    @LynxProp(name = "contentInsetEnd", defaultFloat = -1f)
    fun setContentInsetEnd(value: Float) {
        contentInsetEnd = value.takeIf { it >= 0f }
    }

    // endregion

    // region Text appearance
    // Font size arrives as a float defaulting to -1 (unset); non-positive means "use default".
    // Colors arrive as CSS color strings (RNS gets processed color Ints from Fabric).

    @LynxProp(name = "titleColor")
    fun setTitleColor(value: String?) {
        titleAppearance.color = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "titleFontFamily")
    fun setTitleFontFamily(value: String?) {
        titleAppearance.fontFamily = value
    }

    @LynxProp(name = "titleFontSize", defaultFloat = -1f)
    fun setTitleFontSize(value: Float) {
        titleAppearance.fontSize = value.takeIf { it > 0f }
    }

    @LynxProp(name = "titleFontWeight")
    fun setTitleFontWeight(value: String?) {
        titleAppearance.fontWeight = value
    }

    @LynxProp(name = "titleFontStyle")
    fun setTitleFontStyle(value: String?) {
        titleAppearance.fontStyle = value
    }

    @LynxProp(name = "subtitleColor")
    fun setSubtitleColor(value: String?) {
        subtitleAppearance.color = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "subtitleFontFamily")
    fun setSubtitleFontFamily(value: String?) {
        subtitleAppearance.fontFamily = value
    }

    @LynxProp(name = "subtitleFontSize", defaultFloat = -1f)
    fun setSubtitleFontSize(value: Float) {
        subtitleAppearance.fontSize = value.takeIf { it > 0f }
    }

    @LynxProp(name = "subtitleFontWeight")
    fun setSubtitleFontWeight(value: String?) {
        subtitleAppearance.fontWeight = value
    }

    @LynxProp(name = "subtitleFontStyle")
    fun setSubtitleFontStyle(value: String?) {
        subtitleAppearance.fontStyle = value
    }

    @LynxProp(name = "expandedTitleColor")
    fun setExpandedTitleColor(value: String?) {
        expandedTitleAppearance.color = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "expandedTitleFontFamily")
    fun setExpandedTitleFontFamily(value: String?) {
        expandedTitleAppearance.fontFamily = value
    }

    @LynxProp(name = "expandedTitleFontSize", defaultFloat = -1f)
    fun setExpandedTitleFontSize(value: Float) {
        expandedTitleAppearance.fontSize = value.takeIf { it > 0f }
    }

    @LynxProp(name = "expandedTitleFontWeight")
    fun setExpandedTitleFontWeight(value: String?) {
        expandedTitleAppearance.fontWeight = value
    }

    @LynxProp(name = "expandedTitleFontStyle")
    fun setExpandedTitleFontStyle(value: String?) {
        expandedTitleAppearance.fontStyle = value
    }

    @LynxProp(name = "collapsedTitleColor")
    fun setCollapsedTitleColor(value: String?) {
        collapsedTitleAppearance.color = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "collapsedTitleFontFamily")
    fun setCollapsedTitleFontFamily(value: String?) {
        collapsedTitleAppearance.fontFamily = value
    }

    @LynxProp(name = "collapsedTitleFontSize", defaultFloat = -1f)
    fun setCollapsedTitleFontSize(value: Float) {
        collapsedTitleAppearance.fontSize = value.takeIf { it > 0f }
    }

    @LynxProp(name = "collapsedTitleFontWeight")
    fun setCollapsedTitleFontWeight(value: String?) {
        collapsedTitleAppearance.fontWeight = value
    }

    @LynxProp(name = "collapsedTitleFontStyle")
    fun setCollapsedTitleFontStyle(value: String?) {
        collapsedTitleAppearance.fontStyle = value
    }

    @LynxProp(name = "expandedSubtitleColor")
    fun setExpandedSubtitleColor(value: String?) {
        expandedSubtitleAppearance.color = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "expandedSubtitleFontFamily")
    fun setExpandedSubtitleFontFamily(value: String?) {
        expandedSubtitleAppearance.fontFamily = value
    }

    @LynxProp(name = "expandedSubtitleFontSize", defaultFloat = -1f)
    fun setExpandedSubtitleFontSize(value: Float) {
        expandedSubtitleAppearance.fontSize = value.takeIf { it > 0f }
    }

    @LynxProp(name = "expandedSubtitleFontWeight")
    fun setExpandedSubtitleFontWeight(value: String?) {
        expandedSubtitleAppearance.fontWeight = value
    }

    @LynxProp(name = "expandedSubtitleFontStyle")
    fun setExpandedSubtitleFontStyle(value: String?) {
        expandedSubtitleAppearance.fontStyle = value
    }

    @LynxProp(name = "collapsedSubtitleColor")
    fun setCollapsedSubtitleColor(value: String?) {
        collapsedSubtitleAppearance.color = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "collapsedSubtitleFontFamily")
    fun setCollapsedSubtitleFontFamily(value: String?) {
        collapsedSubtitleAppearance.fontFamily = value
    }

    @LynxProp(name = "collapsedSubtitleFontSize", defaultFloat = -1f)
    fun setCollapsedSubtitleFontSize(value: Float) {
        collapsedSubtitleAppearance.fontSize = value.takeIf { it > 0f }
    }

    @LynxProp(name = "collapsedSubtitleFontWeight")
    fun setCollapsedSubtitleFontWeight(value: String?) {
        collapsedSubtitleAppearance.fontWeight = value
    }

    @LynxProp(name = "collapsedSubtitleFontStyle")
    fun setCollapsedSubtitleFontStyle(value: String?) {
        collapsedSubtitleAppearance.fontStyle = value
    }

    // endregion

    @LynxProp(name = "hidden")
    fun setHidden(value: Boolean?) {
        hidden = value == true
    }

    @LynxProp(name = "transparent")
    fun setTransparent(value: Boolean?) {
        transparent = value == true
    }

    @LynxProp(name = "backButtonHidden")
    fun setBackButtonHidden(value: Boolean?) {
        backButtonHidden = value == true
    }

    // RNS receives already-processed color Ints from Fabric; on Lynx the props
    // arrive as CSS color strings.
    @LynxProp(name = "backButtonTintColorNormal")
    fun setBackButtonTintColorNormal(value: String?) {
        backButtonTintColorNormal = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "backButtonTintColorPressed")
    fun setBackButtonTintColorPressed(value: String?) {
        backButtonTintColorPressed = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "backButtonTintColorFocused")
    fun setBackButtonTintColorFocused(value: String?) {
        backButtonTintColorFocused = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "backButtonDrawableIconResourceName")
    fun setBackButtonDrawableIconResourceName(value: String?) {
        backButtonDrawableIconResourceName = value
    }

    @LynxProp(name = "backButtonImageIconUri")
    fun setBackButtonImageIconUri(value: String?) {
        backButtonImageIconUri = value
    }

    @LynxProp(name = "overflowIconTintColorNormal")
    fun setOverflowIconTintColorNormal(value: String?) {
        overflowIconTintColorNormal = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "overflowIconTintColorPressed")
    fun setOverflowIconTintColorPressed(value: String?) {
        overflowIconTintColorPressed = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "overflowIconTintColorFocused")
    fun setOverflowIconTintColorFocused(value: String?) {
        overflowIconTintColorFocused = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "overflowIconDrawableIconResourceName")
    fun setOverflowIconDrawableIconResourceName(value: String?) {
        overflowIconDrawableIconResourceName = value
    }

    @LynxProp(name = "overflowIconImageIconUri")
    fun setOverflowIconImageIconUri(value: String?) {
        overflowIconImageIconUri = value
    }

    @LynxProp(name = "scrollFlagScroll")
    fun setScrollFlagScroll(value: Boolean?) {
        scrollFlagScroll = value == true
    }

    @LynxProp(name = "scrollFlagEnterAlways")
    fun setScrollFlagEnterAlways(value: Boolean?) {
        scrollFlagEnterAlways = value == true
    }

    @LynxProp(name = "scrollFlagEnterAlwaysCollapsed")
    fun setScrollFlagEnterAlwaysCollapsed(value: Boolean?) {
        scrollFlagEnterAlwaysCollapsed = value == true
    }

    @LynxProp(name = "scrollFlagExitUntilCollapsed")
    fun setScrollFlagExitUntilCollapsed(value: Boolean?) {
        scrollFlagExitUntilCollapsed = value == true
    }

    @LynxProp(name = "scrollFlagSnap")
    fun setScrollFlagSnap(value: Boolean?) {
        scrollFlagSnap = value == true
    }

    @LynxProp(name = "liftOnScroll")
    fun setLiftOnScroll(value: Boolean?) {
        // Unlike Fabric, Lynx delivers null for an absent prop - fall back to the default (true).
        liftOnScroll = value != false
    }

    // Colors arrive as CSS color strings (RNS gets processed color Ints from Fabric).
    @LynxProp(name = "backgroundColor")
    fun setBackgroundColor(value: String?) {
        backgroundColor = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "scrolledBackgroundColor")
    fun setScrolledBackgroundColor(value: String?) {
        scrolledBackgroundColor = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "statusBarScrimColor")
    fun setStatusBarScrimColor(value: String?) {
        statusBarScrimColor = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }

    @LynxProp(name = "toolbarMenuGroupDividerEnabled")
    fun setToolbarMenuGroupDividerEnabled(value: Boolean?) {
        setToolbarMenuGroupDividerEnabledFromProps(value == true)
    }

    @LynxProp(name = "toolbarMenu")
    fun setToolbarMenu(value: ReadableMap?) {
        setToolbarMenuFromProps(StackHeaderToolbarMenuMapper.parseMenu(value))
    }

    // The Lynx counterpart of RNS's updateToolbarMenuElements view command,
    // invoked via NodesRef.invoke from JS. Adaptation: NodesRef.invoke passes a
    // single params map, so the batch array arrives under the "updates" key
    // (RNS's codegen command takes the array directly).
    @LynxUIMethod
    fun updateToolbarMenuElements(
        params: ReadableMap,
        callback: Callback,
    ) {
        val updates = params.getArray("updates")
        if (updates == null) {
            callback.invoke(LynxUIMethodConstants.PARAM_INVALID)
            return
        }
        val parsed = ArrayList<StackHeaderToolbarMenuElementRawUpdate>(updates.size())
        for (i in 0 until updates.size()) {
            val map = updates.getMap(i)
            if (map == null) {
                Log.w(TAG, "[RNScreens] Skipping toolbar menu update at index $i: not an object.")
                continue
            }
            val id = map.getString("id")
            if (id == null) {
                Log.w(TAG, "[RNScreens] Skipping toolbar menu update at index $i: missing 'id'.")
                continue
            }
            parsed.add(StackHeaderToolbarMenuMapper.parseElementRawUpdate(id, map))
        }
        dispatchMenuElementUpdates(parsed)
        callback.invoke(LynxUIMethodConstants.SUCCESS)
    }

    private fun parseHorizontalGravity(
        value: String?,
        default: Int,
    ): Int =
        when (value) {
            null -> default
            "start" -> Gravity.START
            "center" -> Gravity.CENTER_HORIZONTAL
            "end" -> Gravity.END
            else -> throw IllegalArgumentException(
                "[RNScreens] Invalid StackHeaderConfig title horizontal gravity: $value.",
            )
        }

    private fun parseVerticalGravity(
        value: String?,
        default: Int,
    ): Int =
        when (value) {
            null -> default
            "top" -> Gravity.TOP
            "center" -> Gravity.CENTER_VERTICAL
            "bottom" -> Gravity.BOTTOM
            else -> throw IllegalArgumentException(
                "[RNScreens] Invalid StackHeaderConfig title vertical gravity: $value.",
            )
        }

    // endregion

    // region Helpers

    private fun <T> invalidatingProperty(
        initialValue: T,
        flag: StackHeaderInvalidationFlags,
    ) = Delegates.observable(initialValue) { _, old, new ->
        if (old != new) invalidate(flag)
    }

    // endregion

    // Built outside the instance scope on purpose: a lambda capturing this component
    // would be retained by every icon load still in flight.
    private companion object {
        private const val TAG = "StackHeaderConfigComponent"

        fun createPropIconResolver(context: LynxContext) =
            PropIconResolver { name, uri, onComplete ->
                resolveImage(context, name, uri, onComplete)
            }

        fun createMenuIconResolver(context: LynxContext) =
            StackHeaderToolbarMenuIconResolver { iconSource, onResolved ->
                resolveImage(
                    context,
                    iconSource.drawableIconResourceName,
                    iconSource.imageIconUri,
                    onResolved,
                )
            }
    }
}

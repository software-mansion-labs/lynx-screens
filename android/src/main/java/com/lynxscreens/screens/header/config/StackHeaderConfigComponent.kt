package com.lynxscreens.screens.header.config

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.Drawable
import android.util.LayoutDirection
import android.util.Log
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxElement
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.LynxUIMethod
import com.lynx.tasm.behavior.LynxUIMethodConstants
import com.lynx.tasm.behavior.ui.LynxBaseUI
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynxscreens.screens.common.ShadowStateProxy
import com.lynxscreens.screens.header.subview.OnStackHeaderSubviewChangeListener
import com.lynxscreens.screens.header.subview.StackHeaderSubviewComponent
import com.lynxscreens.screens.header.subview.StackHeaderSubviewType
import com.lynxscreens.screens.header.toolbar.model.StackHeaderToolbarMenuConfig
import com.lynxscreens.screens.header.toolbar.update.StackHeaderToolbarMenuElementRawUpdate
import com.lynxscreens.screens.header.toolbar.update.StackHeaderToolbarMenuIconResolver
import com.lynxscreens.screens.header.toolbar.model.StackHeaderToolbarMenuItemIconSource
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuMapper
import com.lynxscreens.screens.header.toolbar.update.StackHeaderToolbarMenuUpdateQueue
import com.lynxscreens.screens.header.toolbar.update.StackHeaderToolbarFieldUpdate
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
    OnStackHeaderSubviewChangeListener {
    // region Handling configuration changes

    private var configObserver: StackHeaderConfigurationObserver? = null

    override fun setConfigurationObserver(observer: StackHeaderConfigurationObserver?) {
        configObserver = observer
    }

    override var invalidationFlags = StackHeaderInvalidationFlags.ALL

    override fun clearInvalidationFlags(flags: StackHeaderInvalidationFlags) {
        invalidationFlags = invalidationFlags.clearing(flags)
    }

    private fun invalidate(flags: StackHeaderInvalidationFlags) {
        invalidationFlags = invalidationFlags or flags
    }

    private fun flushUpdates() {
        if (configObserver == null || invalidationFlags.isEmpty) {
            return
        }

        configObserver?.onConfigChanged(this)
    }

    /**
     * Lynx analog of flushing in RNS's didMountItems: Fabric applies layout
     * metrics before didMountItems fires, so RNS flushes with children already
     * sized. On Lynx child mounting precedes layout application within a batch,
     * so out-of-band invalidations (child attach/detach, subview prop changes)
     * defer the flush one frame - otherwise freshly attached subviews reach the
     * Toolbar with a 0x0 view.
     */
    private var isFlushScheduled = false

    private fun scheduleFlush() {
        if (isFlushScheduled) return
        isFlushScheduled = true
        view.post {
            isFlushScheduled = false
            flushUpdates()
        }
    }

    // endregion

    // region Properties

    override var type: StackHeaderType by Delegates.observable(StackHeaderType.SMALL) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.STRUCTURE)
    }
        internal set

    override var title: String by Delegates.observable("") { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.TITLE)
    }
        internal set

    override var hidden: Boolean by Delegates.observable(false) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.STRUCTURE)
    }
        internal set

    override var transparent: Boolean by Delegates.observable(false) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.STRUCTURE)
    }
        internal set

    override var backButtonHidden: Boolean by Delegates.observable(false) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.BACK_BUTTON)
    }
        internal set

    override var backButtonTintColorNormal: Int? by Delegates.observable(null) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.BACK_BUTTON)
    }
        internal set

    override var backButtonTintColorPressed: Int? by Delegates.observable(null) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.BACK_BUTTON)
    }
        internal set

    override var backButtonTintColorFocused: Int? by Delegates.observable(null) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.BACK_BUTTON)
    }
        internal set

    override var backButtonIcon: Drawable? by Delegates.observable(null) { _, old, new ->
        if (old !== new) invalidate(StackHeaderInvalidationFlags.BACK_BUTTON)
    }
        internal set

    override var scrollFlagScroll: Boolean by Delegates.observable(false) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.SCROLL_FLAGS)
    }
        internal set

    override var scrollFlagEnterAlways: Boolean by Delegates.observable(false) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.SCROLL_FLAGS)
    }
        internal set

    override var scrollFlagEnterAlwaysCollapsed: Boolean by Delegates.observable(false) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.SCROLL_FLAGS)
    }
        internal set

    override var scrollFlagExitUntilCollapsed: Boolean by Delegates.observable(false) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.SCROLL_FLAGS)
    }
        internal set

    override var scrollFlagSnap: Boolean by Delegates.observable(false) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.SCROLL_FLAGS)
    }
        internal set

    override var toolbarMenu: StackHeaderToolbarMenuConfig
        by Delegates.observable(StackHeaderToolbarMenuConfig(emptyList(), emptyList())) { _, old, new ->
            if (old != new) invalidate(StackHeaderInvalidationFlags.TOOLBAR_MENU)
        }
        internal set

    override var toolbarMenuGroupDividerEnabled: Boolean by Delegates.observable(false) { _, old, new ->
        if (old != new) invalidate(StackHeaderInvalidationFlags.TOOLBAR_MENU)
    }
        internal set

    override val isRTL: Boolean
        get() = view.layoutDirection == LayoutDirection.RTL

    // endregion

    // region Back button icon resolution

    // Staging fields for back button icon resolution.
    // Both props may arrive in any order within a single update batch.
    // Resolution happens in resolveBackButtonIconIfNeeded(), called from onPropsUpdated.
    internal var backButtonDrawableIconResourceName: String? = null
    internal var backButtonImageIconUri: String? = null
    private val backButtonIconResolver = PropIconResolver()

    internal fun resolveBackButtonIconIfNeeded() {
        backButtonIconResolver.resolve(
            lynxContext,
            backButtonDrawableIconResourceName,
            backButtonImageIconUri,
        ) { result ->
            when (result) {
                IconResolution.Unchanged -> Unit
                is IconResolution.Resolved -> {
                    backButtonIcon = result.drawable
                    if (!isInsidePropsUpdate) {
                        flushUpdates()
                    }
                }
            }
        }
    }

    // endregion

    // region Toolbar menu item icon resolution

    internal var toolbarMenuItemIconSourceMap = mapOf<String, StackHeaderToolbarMenuItemIconSource>()

    private var toolbarMenuItemIconResolvers = mapOf<String, PropIconResolver>()

    // Last resolved icon per menu item id, from the `toolbarMenu` prop path only
    // (resolveToolbarMenuItemIconsIfNeeded). Command (`updateToolbarMenuElements`) icons are applied
    // directly to the live toolbar and are intentionally NOT stored here.
    private var toolbarMenuItemIcons = mapOf<String, Drawable?>()

    internal fun resolveToolbarMenuItemIconsIfNeeded() {
        val nextResolvers = mutableMapOf<String, PropIconResolver>()

        toolbarMenuItemIconSourceMap.forEach { (id, source) ->
            val resolver = toolbarMenuItemIconResolvers[id] ?: PropIconResolver()
            nextResolvers[id] = resolver

            resolver.resolve(
                context = lynxContext,
                drawableIconResourceName = source.drawableIconResourceName,
                imageIconUri = source.imageIconUri,
            ) { result ->
                val icon =
                    when (result) {
                        IconResolution.Unchanged -> toolbarMenuItemIcons[id]
                        is IconResolution.Resolved -> {
                            toolbarMenuItemIcons = toolbarMenuItemIcons + (id to result.drawable)
                            result.drawable
                        }
                    }

                applyToolbarMenuItemIcon(id, icon)
            }
        }

        toolbarMenuItemIconResolvers = nextResolvers
        toolbarMenuItemIcons = toolbarMenuItemIcons.filterKeys { it in toolbarMenuItemIconSourceMap }
    }

    private fun applyToolbarMenuItemIcon(
        id: String,
        icon: Drawable?,
    ) {
        val currentMenu = toolbarMenu
        val updated = currentMenu.updateItemIcon(id, icon)
        if (updated !== currentMenu) {
            toolbarMenu = updated
            if (!isInsidePropsUpdate) {
                flushUpdates()
            }
        }
    }

    // endregion

    // region Subviews

    override var backgroundSubview: StackHeaderSubviewComponent? by Delegates.observable(null) { _, old, new ->
        if (old !== new) invalidate(StackHeaderInvalidationFlags.SUBVIEWS)
    }
        private set

    override var leadingSubview: StackHeaderSubviewComponent? by Delegates.observable(null) { _, old, new ->
        if (old !== new) invalidate(StackHeaderInvalidationFlags.SUBVIEWS)
    }
        private set

    override var centerSubview: StackHeaderSubviewComponent? by Delegates.observable(null) { _, old, new ->
        if (old !== new) invalidate(StackHeaderInvalidationFlags.SUBVIEWS)
    }
        private set

    override var trailingSubview: StackHeaderSubviewComponent? by Delegates.observable(null) { _, old, new ->
        if (old !== new) invalidate(StackHeaderInvalidationFlags.SUBVIEWS)
    }
        private set

    override fun onStackHeaderSubviewChanged() {
        invalidate(StackHeaderInvalidationFlags.SUBVIEWS)
        // Subview prop changes arrive through the subview's own props batch,
        // outside this config's onPropsUpdated.
        if (!isInsidePropsUpdate) {
            scheduleFlush()
        }
    }

    internal fun addConfigSubview(headerSubview: StackHeaderSubviewComponent) {
        when (headerSubview.type) {
            StackHeaderSubviewType.BACKGROUND -> backgroundSubview = headerSubview
            StackHeaderSubviewType.LEADING -> leadingSubview = headerSubview
            StackHeaderSubviewType.CENTER -> centerSubview = headerSubview
            StackHeaderSubviewType.TRAILING -> trailingSubview = headerSubview
        }
        headerSubview.onStackHeaderSubviewChangeListener = WeakReference(this)
        // Child mount/unmount happens outside this config's props batch.
        if (!isInsidePropsUpdate) {
            scheduleFlush()
        }
    }

    internal fun removeConfigSubview(headerSubview: StackHeaderSubviewComponent) {
        headerSubview.onStackHeaderSubviewChangeListener = null
        when (headerSubview.type) {
            StackHeaderSubviewType.BACKGROUND -> backgroundSubview = null
            StackHeaderSubviewType.LEADING -> leadingSubview = null
            StackHeaderSubviewType.CENTER -> centerSubview = null
            StackHeaderSubviewType.TRAILING -> trailingSubview = null
        }
        if (!isInsidePropsUpdate) {
            scheduleFlush()
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

    override fun onMenuItemClicked(id: String) {
        eventEmitter.emitOnToolbarMenuItemPress(id)
    }

    override fun onGroupSelectionChanged(
        groupId: String,
        selectedIds: List<String>,
    ) {
        eventEmitter.emitOnToolbarMenuGroupSelectionChange(groupId, selectedIds)
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

    // region Imperative menu item commands

    /**
     * Resolves a single command's icon. Unlike the `toolbarMenu` prop path,
     * this does NOT go through the stateful per-id [PropIconResolver] (whose
     * drop-stale async guard could leave the queue waiting forever - the queue
     * requires that [StackHeaderToolbarMenuIconResolver.resolve] always calls
     * [onResolved] even if the image loading results in failure; see
     * [StackHeaderToolbarMenuIconResolver] and
     * [StackHeaderToolbarMenuUpdateQueue] for more details) and does NOT touch
     * the prop icon cache: it resolves the source with an always-completing
     * [resolveImage] and forwards the result to the queue, which applies it to
     * the live toolbar. Ordering across commands is guaranteed by the queue, so
     * no drop-stale is needed here; a failed or empty source resolves to `null`
     * -> Reset (the icon is cleared) rather than stalling the queue.
     */
    private val commandIconResolver =
        StackHeaderToolbarMenuIconResolver { iconSource, onResolved ->
            resolveImage(
                lynxContext,
                iconSource.drawableIconResourceName,
                iconSource.imageIconUri,
            ) { drawable ->
                onResolved(StackHeaderToolbarFieldUpdate.from(drawable))
            }
        }

    // Serializes `updateToolbarMenuElements` batches and waits for every icon in a batch to
    // resolve before applying it, so each batch is applied atomically and in order.
    private val menuUpdateQueue =
        StackHeaderToolbarMenuUpdateQueue(
            iconResolver = commandIconResolver,
            delegate = { updates -> configObserver?.onMenuElementsUpdated(updates) },
        )

    /**
     * Enqueues a batch of toolbar menu element UI method calls. The batch is processed only
     * after any earlier batch has been fully applied, and is applied atomically once all of
     * its icons (if any) have resolved — see [StackHeaderToolbarMenuUpdateQueue].
     */
    internal fun dispatchMenuElementUpdates(updates: List<StackHeaderToolbarMenuElementRawUpdate>) {
        menuUpdateQueue.enqueue(updates)
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
     * Lynx analog of the RNS UIManagerListener transaction bracket
     * (willMountItems/didMountItems): prop setters run synchronously right before
     * onPropsUpdated, so the flag accumulation happens "inside the transaction"
     * and a single flush is issued here. The guard keeps synchronously-resolving
     * icon callbacks from flushing mid-batch.
     */
    private var isInsidePropsUpdate = false

    override fun onPropsUpdated() {
        super.onPropsUpdated()
        isInsidePropsUpdate = true
        resolveBackButtonIconIfNeeded()
        resolveToolbarMenuItemIconsIfNeeded()
        isInsidePropsUpdate = false
        flushUpdates()
    }

    // Lynx analog of RNS's onDropViewInstance-driven teardown.
    override fun destroy() {
        tearDown()
        super.destroy()
    }

    internal fun tearDown() {
        menuUpdateQueue.tearDown()
        invalidationFlags = StackHeaderInvalidationFlags.NONE
        configObserver = null
        isFlushScheduled = false
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

    @LynxProp(name = "toolbarMenuGroupDividerEnabled")
    fun setToolbarMenuGroupDividerEnabled(value: Boolean?) {
        toolbarMenuGroupDividerEnabled = value == true
    }

    @LynxProp(name = "toolbarMenu")
    fun setToolbarMenu(value: ReadableMap?) {
        val (menu, iconSources) = StackHeaderToolbarMenuMapper.parseMenu(value)
        toolbarMenu = menu
        toolbarMenuItemIconSourceMap = iconSources
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
            parsed.add(
                StackHeaderToolbarMenuElementRawUpdate(
                    id,
                    StackHeaderToolbarMenuMapper.parseMenuElementOptions(map),
                    StackHeaderToolbarMenuMapper.parseMenuElementIconSource(map),
                ),
            )
        }
        dispatchMenuElementUpdates(parsed)
        callback.invoke(LynxUIMethodConstants.SUCCESS)
    }

    // endregion

    companion object {
        private const val TAG = "StackHeaderConfigComponent"
    }
}

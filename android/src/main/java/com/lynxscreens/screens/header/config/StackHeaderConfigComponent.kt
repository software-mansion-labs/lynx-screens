package com.lynxscreens.screens.header.config

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.Drawable
import android.util.LayoutDirection
import android.util.Log
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableArray
import com.lynx.react.bridge.ReadableMap
import com.lynx.react.bridge.ReadableType
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
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuItemConfig
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuItemDefaults
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuItemIconSource
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuItemOptions
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuItemShowAsAction
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarUpdate
import com.lynxscreens.screens.helpers.IconResolution
import com.lynxscreens.screens.helpers.IconResolver
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

    override var toolbarMenuItems: List<StackHeaderToolbarMenuItemConfig>
        by Delegates.observable(emptyList()) { _, old, new ->
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
    private val backButtonIconResolver = IconResolver()

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

    private var toolbarMenuItemIconResolvers = mapOf<String, IconResolver>()

    // Last resolved icon per menu item id. Unlike every other field on this config — which
    // mirrors a single prop — this cache deliberately merges resolved icons from BOTH sources
    // that can set a menu item icon: the `toolbarMenuItems` prop array
    // (resolveToolbarMenuItemIconsIfNeeded) and the imperative `setToolbarMenuItemOptions`
    // UI method (dispatchMenuItemUpdate). It is necessary to ensure consistency.
    private var toolbarMenuItemIcons = mapOf<String, Drawable?>()

    internal fun resolveToolbarMenuItemIconsIfNeeded() {
        val nextResolvers = mutableMapOf<String, IconResolver>()

        toolbarMenuItemIconSourceMap.forEach { (id, source) ->
            val resolver = toolbarMenuItemIconResolvers[id] ?: IconResolver()
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
        val currentItems = toolbarMenuItems
        val itemIndex = currentItems.indexOfFirst { it.id == id }
        if (itemIndex == -1) return

        val item = currentItems[itemIndex]
        if (item.icon != icon) {
            val newItems = currentItems.toMutableList()
            newItems[itemIndex] = item.copy(icon = icon)
            toolbarMenuItems = newItems
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
        eventEmitter.emitOnToolbarMenuItemClicked(id)
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
     * Applies a toolbar menu item UI-method update. When the update does not touch the icon
     * ([iconSource] is `null`) the options are delivered immediately. Otherwise, the icon is
     * resolved first and all options — including the icon — are delivered together in a single
     * update, so the change is applied atomically once the (possibly async) image has loaded.
     */
    internal fun dispatchMenuItemUpdate(
        id: String,
        options: StackHeaderToolbarMenuItemOptions,
        iconSource: StackHeaderToolbarMenuItemIconSource?,
    ) {
        if (iconSource == null) {
            configObserver?.onMenuItemUpdated(id, options)
            return
        }

        val resolver = toolbarMenuItemIconResolvers[id]
        if (resolver == null) {
            Log.w(TAG, "[RNScreens] Unable to find icon resolver for menu item $id.")
            configObserver?.onMenuItemUpdated(id, options)
            return
        }

        resolver.resolve(lynxContext, iconSource.drawableIconResourceName, iconSource.imageIconUri) { result ->
            val icon =
                when (result) {
                    IconResolution.Unchanged -> null // keep the current icon
                    is IconResolution.Resolved -> {
                        // Keep the cache in sync with the prop-array path: both share this
                        // id's resolver.
                        toolbarMenuItemIcons = toolbarMenuItemIcons + (id to result.drawable)
                        StackHeaderToolbarUpdate.from(result.drawable)
                    }
                }
            configObserver?.onMenuItemUpdated(id, options.copy(icon = icon))
        }
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

    @LynxProp(name = "toolbarMenuItems")
    fun setToolbarMenuItems(value: ReadableArray?) {
        val sourceMap = mutableMapOf<String, StackHeaderToolbarMenuItemIconSource>()

        toolbarMenuItems =
            value?.let { array ->
                (0 until array.size()).map { i ->
                    val item = requireNotNull(array.getMap(i))
                    val id = item.requireNotNullString("id")

                    sourceMap[id] =
                        StackHeaderToolbarMenuItemIconSource(
                            item.getString("drawableIconResourceName")
                                ?: StackHeaderToolbarMenuItemDefaults.DRAWABLE_ICON_RESOURCE_NAME,
                            item.getString("imageIconUri") ?: StackHeaderToolbarMenuItemDefaults.IMAGE_ICON_URI,
                        )

                    StackHeaderToolbarMenuItemConfig(
                        id = id,
                        title = item.readString("title", StackHeaderToolbarMenuItemDefaults.TITLE),
                        hidden = item.readBoolean("hidden", StackHeaderToolbarMenuItemDefaults.HIDDEN),
                        showAsAction =
                            item.readShowAsActionEnum(
                                "showAsAction",
                                StackHeaderToolbarMenuItemDefaults.SHOW_AS_ACTION,
                            ),
                        icon = null,
                        iconTintColorNormal =
                            item.readColor(
                                "iconTintColorNormal",
                                StackHeaderToolbarMenuItemDefaults.ICON_TINT_COLOR_NORMAL,
                            ),
                        iconTintColorPressed =
                            item.readColor(
                                "iconTintColorPressed",
                                StackHeaderToolbarMenuItemDefaults.ICON_TINT_COLOR_PRESSED,
                            ),
                        iconTintColorFocused =
                            item.readColor(
                                "iconTintColorFocused",
                                StackHeaderToolbarMenuItemDefaults.ICON_TINT_COLOR_FOCUSED,
                            ),
                        iconTintColorDisabled =
                            item.readColor(
                                "iconTintColorDisabled",
                                StackHeaderToolbarMenuItemDefaults.ICON_TINT_COLOR_DISABLED,
                            ),
                    )
                }
            } ?: emptyList()
        toolbarMenuItemIconSourceMap = sourceMap
    }

    // The Lynx counterpart of RNS's setToolbarMenuItemOptions view command,
    // invoked via NodesRef.invoke from JS.
    @LynxUIMethod
    fun setToolbarMenuItemOptions(
        params: ReadableMap,
        callback: Callback,
    ) {
        val id = params.getString("id")
        if (id == null) {
            callback.invoke(LynxUIMethodConstants.PARAM_INVALID)
            return
        }
        val options = params.getMap("options")
        dispatchMenuItemUpdate(
            id,
            StackHeaderToolbarMenuItemOptions(
                title = options?.readNullableStringUpdate("title", StackHeaderToolbarMenuItemDefaults.TITLE),
                hidden = options?.readNullableBooleanUpdate("hidden", StackHeaderToolbarMenuItemDefaults.HIDDEN),
                showAsAction =
                    options?.readNullableShowAsActionEnumUpdate(
                        "showAsAction",
                        StackHeaderToolbarMenuItemDefaults.SHOW_AS_ACTION,
                    ),
                // The icon is resolved asynchronously and filled in by dispatchMenuItemUpdate.
                icon = null,
                iconTintColorNormal = options?.readNullableColorUpdate("iconTintColorNormal"),
                iconTintColorPressed = options?.readNullableColorUpdate("iconTintColorPressed"),
                iconTintColorFocused = options?.readNullableColorUpdate("iconTintColorFocused"),
                iconTintColorDisabled = options?.readNullableColorUpdate("iconTintColorDisabled"),
            ),
            options?.readIconSource(),
        )
        callback.invoke(LynxUIMethodConstants.SUCCESS)
    }

    // endregion

    companion object {
        private const val TAG = "StackHeaderConfigComponent"
    }
}

private fun ReadableMap.requireNotNullString(key: String): String =
    requireNotNull(this.getString(key)) {
        "[RNScreens] toolbarMenuItem $key property must not be null."
    }

// Helpers for regular props (null/not defined -> default)
private fun ReadableMap.readString(
    key: String,
    default: String,
): String = if (!this.hasKey(key) || this.isNull(key)) default else this.getString(key) ?: default

private fun ReadableMap.readBoolean(
    key: String,
    default: Boolean,
): Boolean = if (!this.hasKey(key) || this.isNull(key)) default else this.getBoolean(key)

private fun ReadableMap.readShowAsActionEnum(
    key: String,
    default: StackHeaderToolbarMenuItemShowAsAction,
): StackHeaderToolbarMenuItemShowAsAction {
    val stringValue = this.getString(key) ?: return default
    return toMenuItemShowAsActionEnum(stringValue)
}

private fun ReadableMap.readColor(
    key: String,
    default: Int?,
): Int? = if (!this.hasKey(key) || this.isNull(key)) default else parseColor(key)

// RNS receives already-processed color Ints from Fabric; on Lynx the props
// arrive as CSS color strings (a Number is accepted too for robustness).
private fun ReadableMap.parseColor(key: String): Int? =
    try {
        when (getType(key)) {
            ReadableType.Number -> getInt(key)
            ReadableType.String -> getString(key)?.let { Color.parseColor(it) }
            else -> null
        }
    } catch (e: Exception) {
        Log.w("StackHeaderConfigComponent", "[RNScreens] Could not parse color for key '$key': ${e.message}")
        null
    }

// Helpers for UI-method updates. Each key has three states:
// - not defined -> null         (no change)
// - null        -> default      (reset to default)
// - value       -> value
//
// A plain `T?` return can encode this only when the field's default is non-null,
// so `null` unambiguously means "no change". Fields whose default is null (the
// tint colors) must return `StackHeaderToolbarUpdate<T>?` instead, to tell "no
// change" (null) apart from "reset" (Reset).
private fun ReadableMap.readNullableStringUpdate(
    key: String,
    default: String,
): String? =
    when {
        !this.hasKey(key) -> null
        this.isNull(key) -> default
        else -> this.getString(key) ?: default
    }

private fun ReadableMap.readNullableBooleanUpdate(
    key: String,
    default: Boolean,
): Boolean? =
    when {
        !this.hasKey(key) -> null
        this.isNull(key) -> default
        else -> this.getBoolean(key)
    }

private fun ReadableMap.readNullableShowAsActionEnumUpdate(
    key: String,
    default: StackHeaderToolbarMenuItemShowAsAction,
): StackHeaderToolbarMenuItemShowAsAction? =
    when {
        !this.hasKey(key) -> null
        this.isNull(key) -> default
        else ->
            this.getString(key)?.let {
                toMenuItemShowAsActionEnum(it)
            } ?: default
    }

// Assumes null is the default color.
private fun ReadableMap.readNullableColorUpdate(key: String): StackHeaderToolbarUpdate<Int>? =
    when {
        !this.hasKey(key) -> null
        this.isNull(key) -> StackHeaderToolbarUpdate.Reset
        else -> StackHeaderToolbarUpdate.from(parseColor(key))
    }

// The icon is composed of two JS keys that together form one source. It is
// "mentioned" iff at least one key is present; mentioned but empty (both null)
// means "clear", which the resolver turns into a Reset.
private fun ReadableMap.readIconSource(): StackHeaderToolbarMenuItemIconSource? {
    if (!this.hasKey("drawableIconResourceName") && !this.hasKey("imageIconUri")) {
        return null
    }
    return StackHeaderToolbarMenuItemIconSource(
        drawableIconResourceName = this.getString("drawableIconResourceName"),
        imageIconUri = this.getString("imageIconUri"),
    )
}

private fun toMenuItemShowAsActionEnum(value: String): StackHeaderToolbarMenuItemShowAsAction =
    when (value) {
        "always" -> StackHeaderToolbarMenuItemShowAsAction.ALWAYS
        "alwaysWithText" -> StackHeaderToolbarMenuItemShowAsAction.ALWAYS_WITH_TEXT
        "ifRoom" -> StackHeaderToolbarMenuItemShowAsAction.IF_ROOM
        "ifRoomWithText" -> StackHeaderToolbarMenuItemShowAsAction.IF_ROOM_WITH_TEXT
        "never" -> StackHeaderToolbarMenuItemShowAsAction.NEVER
        else -> throw IllegalArgumentException("[RNScreens] Invalid value for StackHeaderToolbarMenuItemShowAsAction: $value.")
    }

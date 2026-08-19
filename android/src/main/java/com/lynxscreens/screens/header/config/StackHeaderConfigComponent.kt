package com.lynxscreens.screens.header.config

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.Drawable
import android.util.LayoutDirection
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableArray
import com.lynx.react.bridge.ReadableMap
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxElement
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.LynxUIMethod
import com.lynx.tasm.behavior.LynxUIMethodConstants
import com.lynx.tasm.behavior.ui.LynxBaseUI
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynxscreens.screens.common.ShadowStateProxy
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuItemConfig
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuItemDefaults
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuItemOptions
import com.lynxscreens.screens.header.toolbar.StackHeaderToolbarMenuItemShowAsAction
import com.lynxscreens.screens.helpers.getSystemDrawableResource
import com.lynxscreens.screens.helpers.loadImage
import com.lynxscreens.screens.header.subview.OnStackHeaderSubviewChangeListener
import com.lynxscreens.screens.header.subview.StackHeaderSubviewComponent
import com.lynxscreens.screens.header.subview.StackHeaderSubviewType
import java.lang.IllegalArgumentException
import java.lang.ref.WeakReference

@LynxElement(name = "stack-header-config-native")
internal class StackHeaderConfigComponent(
    context: LynxContext,
) : UIGroup<StackHeaderConfigView>(context),
    StackHeaderConfigProviding,
    OnStackHeaderSubviewChangeListener {
    override var type: StackHeaderType = StackHeaderType.SMALL
        internal set
    override var title: String = ""
        internal set
    override var hidden: Boolean = false
        internal set
    override var transparent: Boolean = false
        internal set
    override var backButtonHidden: Boolean = false
        internal set
    override var backButtonTintColor: Int? = null
        internal set
    override var backButtonIcon: Drawable? = null
        internal set

    override var scrollFlagScroll: Boolean = false
        internal set
    override var scrollFlagEnterAlways: Boolean = false
        internal set
    override var scrollFlagEnterAlwaysCollapsed: Boolean = false
        internal set
    override var scrollFlagExitUntilCollapsed: Boolean = false
        internal set
    override var scrollFlagSnap: Boolean = false
        internal set

    override var toolbarMenuItems: List<StackHeaderToolbarMenuItemConfig> = emptyList()
        internal set

    // Staging fields for back button icon resolution.
    // Both props may arrive in any order within a single update batch.
    // Resolution happens in resolveBackButtonIconIfNeeded(), called from onPropsUpdated.
    internal var backButtonDrawableIconResourceName: String? = null
    internal var backButtonImageIconUri: String? = null

    private var lastResolvedDrawableIconResourceName: String? = null
    private var lastResolvedImageIconUri: String? = null

    internal fun resolveBackButtonIconIfNeeded() {
        val name = backButtonDrawableIconResourceName
        val uri = backButtonImageIconUri

        if (name == lastResolvedDrawableIconResourceName && uri == lastResolvedImageIconUri) {
            return
        }

        lastResolvedDrawableIconResourceName = name
        lastResolvedImageIconUri = uri

        if (name != null) {
            backButtonIcon = getSystemDrawableResource(lynxContext, name)
        } else if (uri != null) {
            loadImage(lynxContext, uri) { drawable ->
                if (uri == lastResolvedImageIconUri) {
                    backButtonIcon = drawable
                    // We need to call notifyConfigChanged because icons are loaded asynchronously
                    // and regular update path might execute too early.
                    notifyConfigChanged()
                }
            }
        } else {
            backButtonIcon = null
        }
    }

    override var backgroundSubview: StackHeaderSubviewComponent? = null
        private set
    override var leadingSubview: StackHeaderSubviewComponent? = null
        private set
    override var centerSubview: StackHeaderSubviewComponent? = null
        private set
    override var trailingSubview: StackHeaderSubviewComponent? = null
        private set

    override val isRTL: Boolean
        get() = view.layoutDirection == LayoutDirection.RTL

    private val shadowStateProxy: ShadowStateProxy by lazy {
        ShadowStateProxy(lynxContext, sign)
    }

    override fun createView(context: Context?): StackHeaderConfigView = StackHeaderConfigView(context as LynxContext)

    override fun updateHeaderFrame(
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

    private val eventEmitter: StackHeaderConfigEventEmitter by lazy {
        StackHeaderConfigEventEmitter(lynxContext, sign)
    }

    private var delegate: WeakReference<StackHeaderConfigDelegate>? = null

    override fun onMenuItemClick(id: String) {
        eventEmitter.emitOnToolbarMenuItemClicked(id)
    }

    override fun setDelegate(delegate: StackHeaderConfigDelegate) {
        this.delegate = WeakReference(delegate)
    }

    override fun removeDelegate(delegate: StackHeaderConfigDelegate) {
        if (this.delegate?.get() === delegate) {
            this.delegate = null
        }
    }

    internal fun notifyConfigChanged() {
        delegate?.get()?.onConfigChange(this)
    }

    internal fun dispatchMenuItemUpdate(
        id: String,
        options: StackHeaderToolbarMenuItemOptions,
    ) {
        delegate?.get()?.onMenuItemUpdate(id, options)
    }

    override fun onStackHeaderSubviewChange() = notifyConfigChanged()

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

    override fun onPropsUpdated() {
        super.onPropsUpdated()
        resolveBackButtonIconIfNeeded()
        notifyConfigChanged()
    }

    private fun addConfigSubview(headerSubview: StackHeaderSubviewComponent) {
        when (headerSubview.type) {
            StackHeaderSubviewType.BACKGROUND -> backgroundSubview = headerSubview
            StackHeaderSubviewType.LEADING -> leadingSubview = headerSubview
            StackHeaderSubviewType.CENTER -> centerSubview = headerSubview
            StackHeaderSubviewType.TRAILING -> trailingSubview = headerSubview
        }
        headerSubview.onStackHeaderSubviewChangeListener = WeakReference(this)
        notifyConfigChanged()
    }

    private fun removeConfigSubview(headerSubview: StackHeaderSubviewComponent) {
        headerSubview.onStackHeaderSubviewChangeListener = null
        when (headerSubview.type) {
            StackHeaderSubviewType.BACKGROUND -> backgroundSubview = null
            StackHeaderSubviewType.LEADING -> leadingSubview = null
            StackHeaderSubviewType.CENTER -> centerSubview = null
            StackHeaderSubviewType.TRAILING -> trailingSubview = null
        }
        notifyConfigChanged()
    }

    private fun removeAllConfigSubviews() {
        backgroundSubview?.let { removeConfigSubview(it) }
        leadingSubview?.let { removeConfigSubview(it) }
        centerSubview?.let { removeConfigSubview(it) }
        trailingSubview?.let { removeConfigSubview(it) }
    }

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

    // RNS receives an already-processed color Int from Fabric; on Lynx the prop
    // arrives as a CSS color string.
    @LynxProp(name = "backButtonTintColor")
    fun setBackButtonTintColor(value: String?) {
        backButtonTintColor = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
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
        toolbarMenuItems =
            value?.let { array ->
                (0 until array.size()).map { i ->
                    val item = requireNotNull(array.getMap(i))
                    StackHeaderToolbarMenuItemConfig(
                        id = item.requireNotNullString("id"),
                        title = item.readString("title", StackHeaderToolbarMenuItemDefaults.TITLE),
                        hidden = item.readBoolean("hidden", StackHeaderToolbarMenuItemDefaults.HIDDEN),
                        showAsAction =
                            item.readShowAsActionEnum(
                                "showAsAction",
                                StackHeaderToolbarMenuItemDefaults.SHOW_AS_ACTION,
                            ),
                    )
                }
            } ?: emptyList()
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
            ),
        )
        callback.invoke(LynxUIMethodConstants.SUCCESS)
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

// Helpers for view commands:
// - not defined -> null (means "no update")
// - null -> default (means "reset to default value")
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

private fun toMenuItemShowAsActionEnum(value: String): StackHeaderToolbarMenuItemShowAsAction =
    when (value) {
        "always" -> StackHeaderToolbarMenuItemShowAsAction.ALWAYS
        "alwaysWithText" -> StackHeaderToolbarMenuItemShowAsAction.ALWAYS_WITH_TEXT
        "ifRoom" -> StackHeaderToolbarMenuItemShowAsAction.IF_ROOM
        "ifRoomWithText" -> StackHeaderToolbarMenuItemShowAsAction.IF_ROOM_WITH_TEXT
        "never" -> StackHeaderToolbarMenuItemShowAsAction.NEVER
        else -> throw IllegalArgumentException("[RNScreens] Invalid value for StackHeaderToolbarMenuItemShowAsAction: $value.")
    }

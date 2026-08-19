package com.lynxscreens.screens.header.toolbar

import com.lynx.react.bridge.ReadableMap
import com.lynxscreens.screens.helpers.parseColor
import com.lynxscreens.screens.helpers.readBoolean
import com.lynxscreens.screens.helpers.readColor
import com.lynxscreens.screens.helpers.readImageUri
import com.lynxscreens.screens.helpers.readOptionalString
import com.lynxscreens.screens.helpers.readString
import com.lynxscreens.screens.helpers.requireNotNullString

internal object StackHeaderToolbarMenuMapper {
    // region Menu prop parsing

    // Adaptation: RNS receives the menu as a codegen Dynamic (UnsafeMixed);
    // Lynx delivers object props directly as a nullable ReadableMap.
    fun parseMenu(value: ReadableMap?): Pair<StackHeaderToolbarMenuConfig, Map<String, StackHeaderToolbarMenuItemIconSource>> {
        if (value == null) return Pair(StackHeaderToolbarMenuConfig(emptyList(), emptyList()), emptyMap())
        val iconSources = mutableMapOf<String, StackHeaderToolbarMenuItemIconSource>()
        val config = StackHeaderToolbarMenuConfig(parseGroups(value), parseChildren(value, iconSources))
        return Pair(config, iconSources)
    }

    // endregion

    // region Menu item command parsing

    fun parseMenuItemOptions(map: ReadableMap): StackHeaderToolbarMenuItemOptions =
        StackHeaderToolbarMenuItemOptions(
            title = map.readNullableStringUpdate("title", StackHeaderToolbarMenuItemDefaults.TITLE),
            hidden = map.readNullableBooleanUpdate("hidden", StackHeaderToolbarMenuItemDefaults.HIDDEN),
            disabled = map.readNullableBooleanUpdate("disabled", StackHeaderToolbarMenuItemDefaults.DISABLED),
            showAsAction =
                map.readNullableShowAsActionEnumUpdate(
                    "showAsAction",
                    StackHeaderToolbarMenuItemDefaults.SHOW_AS_ACTION,
                ),
            icon = null,
            iconTintColorNormal = map.readNullableColorUpdate("iconTintColorNormal"),
            iconTintColorPressed = map.readNullableColorUpdate("iconTintColorPressed"),
            iconTintColorFocused = map.readNullableColorUpdate("iconTintColorFocused"),
            iconTintColorDisabled = map.readNullableColorUpdate("iconTintColorDisabled"),
            checked =
                map.readNullableBooleanUpdate(
                    "checked",
                    StackHeaderToolbarMenuItemDefaults.INITIAL_TOGGLE_STATE,
                ),
        )

    fun parseMenuItemIconSource(map: ReadableMap): StackHeaderToolbarMenuItemIconSource? {
        if (!map.hasKey("drawableIconResourceName") && !map.hasKey("imageIconUri")) {
            return null
        }
        return StackHeaderToolbarMenuItemIconSource(
            drawableIconResourceName = map.getString("drawableIconResourceName"),
            imageIconUri = map.readImageUri("imageIconUri", null),
        )
    }

    // endregion

    // region Menu tree parsing

    private fun parseGroups(map: ReadableMap): List<StackHeaderToolbarMenuGroupConfig> {
        val array = map.getArray("groups") ?: return emptyList()
        return (0 until array.size()).map { i ->
            val group =
                requireNotNull(array.getMap(i)) {
                    "[RNScreens] Menu groups array must contain valid group specification objects."
                }
            StackHeaderToolbarMenuGroupConfig(
                groupId = group.requireNotNullString("groupId"),
                singleSelection =
                    group.readBoolean(
                        "singleSelection",
                        StackHeaderToolbarMenuItemDefaults.SINGLE_SELECTION,
                    ),
            )
        }
    }

    private fun parseChildren(
        map: ReadableMap,
        iconSources: MutableMap<String, StackHeaderToolbarMenuItemIconSource>,
    ): List<StackHeaderToolbarMenuElementConfig> {
        val array = map.getArray("children") ?: return emptyList()
        return (0 until array.size()).map { i ->
            val child =
                requireNotNull(array.getMap(i)) {
                    "[RNScreens] Menu children array must contain valid menu element specification objects."
                }
            parseElement(child, iconSources)
        }
    }

    private fun parseElement(
        map: ReadableMap,
        iconSources: MutableMap<String, StackHeaderToolbarMenuItemIconSource>,
    ): StackHeaderToolbarMenuElementConfig {
        val item = parseItemConfig(map)
        iconSources[item.id] = parseItemIconSource(map)
        return when (val type = map.readOptionalString("type")) {
            "menuItem" -> StackHeaderToolbarMenuElementConfig.MenuItem(item = item)
            "menu" ->
                StackHeaderToolbarMenuElementConfig.Submenu(
                    item = item,
                    menu = StackHeaderToolbarMenuConfig(parseGroups(map), parseChildren(map, iconSources)),
                )

            else ->
                throw IllegalArgumentException(
                    "[RNScreens] Unknown toolbar menu element type: $type.",
                )
        }
    }

    private fun parseItemIconSource(map: ReadableMap): StackHeaderToolbarMenuItemIconSource =
        StackHeaderToolbarMenuItemIconSource(
            drawableIconResourceName =
                map.getString("drawableIconResourceName")
                    ?: StackHeaderToolbarMenuItemDefaults.DRAWABLE_ICON_RESOURCE_NAME,
            imageIconUri =
                map.readImageUri("imageIconUri", StackHeaderToolbarMenuItemDefaults.IMAGE_ICON_URI),
        )

    private fun parseItemConfig(map: ReadableMap): StackHeaderToolbarMenuItemConfig =
        StackHeaderToolbarMenuItemConfig(
            id = map.requireNotNullString("id"),
            title = map.readString("title", StackHeaderToolbarMenuItemDefaults.TITLE),
            hidden = map.readBoolean("hidden", StackHeaderToolbarMenuItemDefaults.HIDDEN),
            disabled = map.readBoolean("disabled", StackHeaderToolbarMenuItemDefaults.DISABLED),
            showAsAction = map.readShowAsActionEnum("showAsAction", StackHeaderToolbarMenuItemDefaults.SHOW_AS_ACTION),
            icon = null,
            iconTintColorNormal =
                map.readColor(
                    "iconTintColorNormal",
                    StackHeaderToolbarMenuItemDefaults.ICON_TINT_COLOR_NORMAL,
                ),
            iconTintColorPressed =
                map.readColor(
                    "iconTintColorPressed",
                    StackHeaderToolbarMenuItemDefaults.ICON_TINT_COLOR_PRESSED,
                ),
            iconTintColorFocused =
                map.readColor(
                    "iconTintColorFocused",
                    StackHeaderToolbarMenuItemDefaults.ICON_TINT_COLOR_FOCUSED,
                ),
            iconTintColorDisabled =
                map.readColor(
                    "iconTintColorDisabled",
                    StackHeaderToolbarMenuItemDefaults.ICON_TINT_COLOR_DISABLED,
                ),
            groupId = map.readOptionalString("groupId"),
            itemType = map.readItemTypeEnum("itemType", StackHeaderToolbarMenuItemDefaults.ITEM_TYPE),
            initialToggleState =
                map.readBoolean(
                    "initialToggleState",
                    StackHeaderToolbarMenuItemDefaults.INITIAL_TOGGLE_STATE,
                ),
        )

    // endregion

    // region Enum helpers

    private fun ReadableMap.readShowAsActionEnum(
        key: String,
        default: StackHeaderToolbarMenuItemShowAsAction,
    ): StackHeaderToolbarMenuItemShowAsAction {
        val stringValue = readOptionalString(key) ?: return default
        return toShowAsActionEnum(stringValue)
    }

    private fun toShowAsActionEnum(value: String): StackHeaderToolbarMenuItemShowAsAction =
        when (value) {
            "always" -> StackHeaderToolbarMenuItemShowAsAction.ALWAYS
            "alwaysWithText" -> StackHeaderToolbarMenuItemShowAsAction.ALWAYS_WITH_TEXT
            "ifRoom" -> StackHeaderToolbarMenuItemShowAsAction.IF_ROOM
            "ifRoomWithText" -> StackHeaderToolbarMenuItemShowAsAction.IF_ROOM_WITH_TEXT
            "never" -> StackHeaderToolbarMenuItemShowAsAction.NEVER
            else ->
                throw IllegalArgumentException(
                    "[RNScreens] Invalid value for StackHeaderToolbarMenuItemShowAsAction: $value.",
                )
        }

    private fun ReadableMap.readItemTypeEnum(
        key: String,
        default: StackHeaderToolbarMenuItemType,
    ): StackHeaderToolbarMenuItemType {
        val stringValue = readOptionalString(key) ?: return default
        return toItemTypeEnum(stringValue)
    }

    private fun toItemTypeEnum(value: String): StackHeaderToolbarMenuItemType =
        when (value) {
            "action" -> StackHeaderToolbarMenuItemType.ACTION
            "toggle" -> StackHeaderToolbarMenuItemType.TOGGLE
            "automatic" -> StackHeaderToolbarMenuItemType.AUTOMATIC
            else ->
                throw IllegalArgumentException(
                    "[RNScreens] Invalid value for StackHeaderToolbarMenuItemType: $value.",
                )
        }

    // endregion

    // region Update helpers (3-state semantics for UI-method commands)

    // Each key has three states:
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
                    toShowAsActionEnum(it)
                } ?: default
        }

    private fun ReadableMap.readNullableColorUpdate(key: String): StackHeaderToolbarUpdate<Int>? =
        when {
            !this.hasKey(key) -> null
            this.isNull(key) -> StackHeaderToolbarUpdate.Reset
            else -> StackHeaderToolbarUpdate.from(parseColor(key))
        }

    // endregion
}

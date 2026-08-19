package com.lynxscreens.screens.helpers

import android.graphics.Color
import android.util.Log
import com.lynx.react.bridge.ReadableMap
import com.lynx.react.bridge.ReadableType

private const val TAG = "ReadableMapExt"

// region Nullable variants

internal fun ReadableMap.readOptionalString(key: String): String? {
    if (!hasKey(key) || isNull(key)) return null
    return if (getType(key) == ReadableType.String) getString(key) else null
}

internal fun ReadableMap.readOptionalBoolean(key: String): Boolean? {
    if (!hasKey(key) || isNull(key)) return null
    return if (getType(key) == ReadableType.Boolean) getBoolean(key) else null
}

internal fun ReadableMap.readOptionalFloat(key: String): Float? {
    if (!hasKey(key) || isNull(key)) return null
    return if (getType(key) == ReadableType.Number) getDouble(key).toFloat() else null
}

internal fun ReadableMap.readOptionalColor(key: String): Int? {
    if (!hasKey(key) || isNull(key)) return null
    return parseColor(key)
}

// endregion

// region Default-value variants

internal fun ReadableMap.readString(
    key: String,
    default: String,
): String = readOptionalString(key) ?: default

internal fun ReadableMap.readBoolean(
    key: String,
    default: Boolean,
): Boolean = readOptionalBoolean(key) ?: default

internal fun ReadableMap.readColor(
    key: String,
    default: Int?,
): Int? = if (!hasKey(key) || isNull(key)) default else parseColor(key)

// Adaptation: RNS reads a resolved-asset map ({uri}) produced by
// Image.resolveAssetSource; on Lynx the JS side sends the uri as a plain
// string.
internal fun ReadableMap.readImageUri(
    key: String,
    default: String?,
): String? {
    if (!hasKey(key) || getType(key) != ReadableType.String) {
        return default
    }
    return getString(key) ?: default
}

// endregion

// region Validation

internal fun ReadableMap.requireNotNullString(key: String): String =
    requireNotNull(this.getString(key)) {
        "[RNScreens] $key property must not be null."
    }

// endregion

// region Building blocks

// Adaptation: RNS receives already-processed color Ints from Fabric; on Lynx
// the props arrive as CSS color strings (a Number is accepted too for
// robustness).
internal fun ReadableMap.parseColor(key: String): Int? =
    try {
        when (getType(key)) {
            ReadableType.Number -> getInt(key)
            ReadableType.String -> getString(key)?.let { Color.parseColor(it) }
            else -> null
        }
    } catch (e: Exception) {
        Log.w(TAG, "[RNScreens] Could not parse color for key '$key': ${e.message}")
        null
    }

// endregion

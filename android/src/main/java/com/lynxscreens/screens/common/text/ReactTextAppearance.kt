package com.lynxscreens.screens.common.text

import android.graphics.Typeface
import android.os.Build
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.shadow.text.TypefaceCache
import kotlin.properties.Delegates
import kotlin.properties.ReadWriteProperty

/**
 * [TextAppearance] driven by React props. Font family, weight and style are kept as the raw
 * React values and turned into a [Typeface]. [onChanged] is invoked whenever a property
 * actually changes value.
 *
 * Adaptation: RNS resolves the typeface through RN's ReactTypefaceUtils / ReactFontManager
 * (registered custom fonts, `fonts/` assets, system families). Lynx has no ReactFontManager, so
 * the RN weight/style parsing and the TypefaceStyle normalization are ported below and a font
 * family is looked up through Lynx's [TypefaceCache] - fonts pre-registered with the cache or
 * declared with `@font-face`, the same lookup `<text>` uses - with the system-family fallback
 * of ReactFontManager.createAssetTypeface. An `@font-face` font that is still loading resolves
 * to that fallback until the next header apply.
 */
internal class ReactTextAppearance(
    private val lynxContext: LynxContext,
    onChanged: () -> Unit,
) : TextAppearance {
    override var color: Int? by changeNotifying(onChanged)
    override var fontSize: Float? by changeNotifying(onChanged)
    internal var fontFamily: String? by changeNotifying(onChanged)
    internal var fontWeight: String? by changeNotifying(onChanged)
    internal var fontStyle: String? by changeNotifying(onChanged)

    override fun resolveTypeface(base: Typeface): Typeface {
        val weight = parseFontWeight(fontWeight)
        val style = parseFontStyle(fontStyle)

        if (fontFamily == null && weight == UNSET && style == UNSET) {
            return base
        }

        // ReactFontManager.TypefaceStyle turns an unset weight into 400 and an unset style into
        // "not italic" rather than deriving them from the base. This would drop default styling
        // from base typeface. Resolve both up front so it never receives UNSET style or weight.
        return applyStyles(
            base,
            if (style != UNSET) style else base.resolveStyle(),
            if (weight != UNSET) weight else base.resolveWeight(),
            fontFamily,
        )
    }

    // Counterpart of ReactTypefaceUtils.applyStyles: without a family the weight/italic pair is
    // applied to the base typeface (ReactFontManager.TypefaceStyle.apply); with a family the
    // nearest 4-way style is resolved for that family (ReactFontManager.getTypeface).
    private fun applyStyles(
        typeface: Typeface,
        style: Int,
        weight: Int,
        fontFamilyName: String?,
    ): Typeface {
        val italic = (style and Typeface.ITALIC) != 0
        val nearestStyle = nearestStyle(weight, italic)

        if (fontFamilyName == null) {
            return if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
                Typeface.create(typeface, nearestStyle)
            } else {
                Typeface.create(typeface, weight, italic)
            }
        }

        return TypefaceCache.getTypeface(lynxContext, fontFamilyName, nearestStyle)
            ?: Typeface.create(fontFamilyName, nearestStyle)
    }
}

private fun <T> changeNotifying(onChanged: () -> Unit): ReadWriteProperty<Any?, T?> =
    Delegates.observable(null) { _, old, new -> if (old != new) onChanged() }

// ReactConstants.UNSET / ReactFontManager.TypefaceStyle.{BOLD,NORMAL}
private const val UNSET = -1
private const val WEIGHT_BOLD = 700
private const val WEIGHT_NORMAL = 400

// ReactTypefaceUtils.parseFontWeight
private fun parseFontWeight(fontWeightString: String?): Int =
    when (fontWeightString) {
        "100" -> 100
        "200" -> 200
        "300" -> 300
        "normal", "400" -> 400
        "500" -> 500
        "600" -> 600
        "bold", "700" -> 700
        "800" -> 800
        "900" -> 900
        else -> UNSET
    }

// ReactTypefaceUtils.parseFontStyle
private fun parseFontStyle(fontStyleString: String?): Int =
    when (fontStyleString) {
        "italic" -> Typeface.ITALIC
        "normal" -> Typeface.NORMAL
        else -> UNSET
    }

// ReactFontManager.TypefaceStyle.nearestStyle
private fun nearestStyle(
    weight: Int,
    italic: Boolean,
): Int =
    if (weight < WEIGHT_BOLD) {
        if (italic) Typeface.ITALIC else Typeface.NORMAL
    } else {
        if (italic) Typeface.BOLD_ITALIC else Typeface.BOLD
    }

/**
 * Numeric weight of this typeface. [Typeface.getWeight] requires API 28; below it only bold
 * can be told apart from regular.
 */
private fun Typeface.resolveWeight(): Int =
    when {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.P -> weight
        isBold -> WEIGHT_BOLD
        else -> WEIGHT_NORMAL
    }

private fun Typeface.resolveStyle(): Int = if (isItalic) Typeface.ITALIC else Typeface.NORMAL

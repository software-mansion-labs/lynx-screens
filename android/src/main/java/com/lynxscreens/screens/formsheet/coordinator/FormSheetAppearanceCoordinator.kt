package com.lynxscreens.screens.formsheet.coordinator

import android.content.res.ColorStateList
import android.os.Build
import android.util.TypedValue
import android.widget.FrameLayout
import androidx.core.view.doOnNextLayout
import com.google.android.material.shape.CornerFamily
import com.google.android.material.shape.MaterialShapeDrawable
import com.google.android.material.shape.ShapeAppearanceModel
import com.lynxscreens.screens.formsheet.model.FormSheetConfig

internal class FormSheetAppearanceCoordinator(private val bottomSheetView: FrameLayout?) {
    private var currentCornerRadius = FormSheetConfig.SYSTEM_DEFAULT_CORNER_RADIUS
    private var currentBackgroundColor: Int? = null
    private var isCornerRadiusApplyPending = false
    private var isBackgroundColorApplyPending = false
    private var defaultShapeAppearanceModel: ShapeAppearanceModel? = null
    private var defaultBackgroundColor: ColorStateList? = null
    private val isCornerRadiusSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU

    internal fun setup() {
        if (isCornerRadiusSupported) bottomSheetView?.clipToOutline = true
    }

    internal fun updateCornerRadius(preferredCornerRadius: Float) {
        if (!isCornerRadiusSupported) return
        currentCornerRadius = preferredCornerRadius
        val view = bottomSheetView ?: return
        val background = view.background as? MaterialShapeDrawable
        if (background != null) {
            applyCornerRadius(background)
        } else if (!isCornerRadiusApplyPending) {
            isCornerRadiusApplyPending = true
            view.doOnNextLayout {
                isCornerRadiusApplyPending = false
                (it.background as? MaterialShapeDrawable)?.let(::applyCornerRadius)
            }
        }
    }

    private fun applyCornerRadius(background: MaterialShapeDrawable) {
        val view = bottomSheetView ?: return
        if (defaultShapeAppearanceModel == null) defaultShapeAppearanceModel = background.shapeAppearanceModel
        if (currentCornerRadius == FormSheetConfig.SYSTEM_DEFAULT_CORNER_RADIUS) {
            defaultShapeAppearanceModel?.let { background.shapeAppearanceModel = it }
            return
        }
        val radiusInPx =
            TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                currentCornerRadius,
                view.resources.displayMetrics,
            )
        background.shapeAppearanceModel =
            (defaultShapeAppearanceModel ?: background.shapeAppearanceModel)
                .toBuilder()
                .setTopLeftCorner(CornerFamily.ROUNDED, radiusInPx)
                .setTopRightCorner(CornerFamily.ROUNDED, radiusInPx)
                .build()
    }

    internal fun updateBackgroundColor(color: Int?) {
        currentBackgroundColor = color
        val view = bottomSheetView ?: return
        val background = view.background as? MaterialShapeDrawable
        if (background != null) {
            applyBackgroundColor(background)
        } else if (!isBackgroundColorApplyPending) {
            isBackgroundColorApplyPending = true
            view.doOnNextLayout {
                isBackgroundColorApplyPending = false
                (it.background as? MaterialShapeDrawable)?.let(::applyBackgroundColor)
            }
        }
    }

    private fun applyBackgroundColor(background: MaterialShapeDrawable) {
        if (defaultBackgroundColor == null) defaultBackgroundColor = background.fillColor
        background.fillColor = currentBackgroundColor?.let(ColorStateList::valueOf) ?: defaultBackgroundColor
    }
}

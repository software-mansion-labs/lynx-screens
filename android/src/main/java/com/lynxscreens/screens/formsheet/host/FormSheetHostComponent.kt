package com.lynxscreens.screens.formsheet.host

import android.content.Context
import android.graphics.Color
import android.view.MotionEvent
import android.view.ViewGroup
import com.lynx.react.bridge.ReadableArray
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxElement
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.ui.LynxBaseUI
import com.lynx.tasm.behavior.ui.LynxUI
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynxscreens.screens.common.ShadowStateProxy
import com.lynxscreens.screens.formsheet.core.FormSheetDialogManager
import com.lynxscreens.screens.formsheet.model.FormSheetConfig

@LynxElement(name = "ls-form-sheet")
internal class FormSheetHostComponent(context: LynxContext) : UIGroup<FormSheetHostView>(context) {
    private val eventEmitter by lazy { FormSheetHostEventEmitter(lynxContext, sign) }
    private val shadowStateProxy by lazy { ShadowStateProxy(lynxContext, sign) }
    private lateinit var sheetContentView: FormSheetContentView
    private lateinit var dialogManager: FormSheetDialogManager

    private var isOpen = false
    private var detents: List<Double> = emptyList()
    private var prefersGrabberVisible = false
    private var preferredCornerRadius = FormSheetConfig.SYSTEM_DEFAULT_CORNER_RADIUS
    private var initialDetentIndex = 0
    private var preventNativeDismiss = false
    private var nativeContainerBackgroundColor: Int? = null

    init {
        // The host is only a logical/layout root in the app window; touches must pass to content behind it.
        setUserInteractionEnabled(false)
    }

    override fun createView(context: Context?): FormSheetHostView {
        val lynxContext = context as LynxContext
        sheetContentView =
            FormSheetContentView(
                lynxContext,
                onSizeChangedCallback = { width, height ->
                    shadowStateProxy.updateStateIfNeeded(frameWidth = width, frameHeight = height)
                },
                dispatchLynxTouchEvent = ::dispatchDialogTouchEvent,
            )
        dialogManager = FormSheetDialogManager(lynxContext, sheetContentView)
        dialogManager.eventEmitter = eventEmitter
        sheetContentView.contentSizeChangeDelegate = dialogManager.contentSizeChangeDelegate
        return FormSheetHostView(lynxContext)
    }

    // Adaptation: retain Lynx's logical child tree while mounting native child views in the dialog.
    override fun insertView(child: LynxUI<*>?) {
        child ?: return
        (child.view.parent as? ViewGroup)?.removeView(child.view)
        sheetContentView.addView(child.view, getIndex(child).coerceAtLeast(0))
    }

    override fun removeView(child: LynxBaseUI?) {
        if (child is LynxUI<*>) sheetContentView.removeView(child.view)
    }

    override fun removeAll() {
        sheetContentView.removeAllViews()
        super.removeAll()
    }

    private fun dispatchDialogTouchEvent(event: MotionEvent): Boolean {
        // Main-window hit testing must ignore the host, but the dedicated dialog dispatcher uses it as root.
        setUserInteractionEnabled(true)
        return try {
            lynxContext.touchEventDispatcher.onTouchEvent(event, this)
        } finally {
            setUserInteractionEnabled(false)
        }
    }

    override fun onPropsUpdated() {
        super.onPropsUpdated()
        dialogManager.applyConfig(
            FormSheetConfig(
                isOpen = isOpen,
                detents = detents,
                prefersGrabberVisible = prefersGrabberVisible,
                initialDetentIndex = initialDetentIndex,
                preferredCornerRadius = preferredCornerRadius,
                preventNativeDismiss = preventNativeDismiss,
                nativeContainerBackgroundColor = nativeContainerBackgroundColor,
            ),
        )
    }

    override fun destroy() {
        if (::dialogManager.isInitialized) dialogManager.destroy()
        super.destroy()
    }

    @LynxProp(name = "isOpen")
    fun setIsOpen(value: Boolean?) {
        isOpen = value == true
    }

    @LynxProp(name = "detents")
    fun setDetents(value: ReadableArray?) {
        detents = value?.let { array -> List(array.size()) { array.getDouble(it) } } ?: emptyList()
    }

    @LynxProp(name = "prefersGrabberVisible")
    fun setPrefersGrabberVisible(value: Boolean?) {
        prefersGrabberVisible = value == true
    }

    @LynxProp(
        name = "preferredCornerRadius",
        defaultFloat = FormSheetConfig.SYSTEM_DEFAULT_CORNER_RADIUS,
    )
    fun setPreferredCornerRadius(value: Float) {
        preferredCornerRadius = value
    }

    @LynxProp(name = "initialDetentIndex", defaultInt = 0)
    fun setInitialDetentIndex(value: Int) {
        initialDetentIndex = value
    }

    @LynxProp(name = "preventNativeDismiss")
    fun setPreventNativeDismiss(value: Boolean?) {
        preventNativeDismiss = value == true
    }

    // Adaptation: Lynx color props arrive as CSS color strings.
    @LynxProp(name = "nativeContainerBackgroundColor")
    fun setNativeContainerBackgroundColor(value: String?) {
        nativeContainerBackgroundColor = value?.let { runCatching { Color.parseColor(it) }.getOrNull() }
    }
}

package com.lynxscreens.screens.formsheet

import android.content.Context
import android.graphics.Color
import com.lynx.react.bridge.Dynamic
import com.lynx.react.bridge.ReadableArray
import com.lynx.react.bridge.ReadableType
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxElement
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.PatchFinishListener
import com.lynxscreens.screens.common.BaseUITransfer

@LynxElement(name = "form-sheet-native")
internal class FormSheetComponent(
    context: LynxContext,
) : BaseUITransfer<FormSheetHostView>(context),
    PatchFinishListener {
    private var isOpen = false
    private var rawDetents: List<Double> = emptyList()
    private var prefersGrabberVisible = false
    private var preferredCornerRadius = -1f
    private var initialDetentIndex = 0
    private var selectedDetentIndex = -2
    private var nativeContainerBackgroundColor: Int? = null
    private var preventNativeDismissChannels = emptySet<FormSheetDismissChannel>()
    private var preventNativeDismissDragFeedback = false
    private var largestUndimmedDetentIndex = -1

    private val eventEmitter by lazy { FormSheetEventEmitter(lynxContext, sign) }

    override fun createView(context: Context?): FormSheetHostView =
        FormSheetHostView(context as LynxContext, this).also {
            it.setLynxRootUi(this)
        }

    @LynxProp(name = "isOpen")
    fun setIsOpen(value: Boolean?) {
        isOpen = value == true
    }

    @LynxProp(name = "detents")
    fun setDetents(value: ReadableArray?) {
        rawDetents =
            if (value == null) {
                emptyList()
            } else {
                List(value.size()) { index -> value.getDouble(index) }
            }
    }

    @LynxProp(name = "prefersGrabberVisible")
    fun setPrefersGrabberVisible(value: Boolean?) {
        prefersGrabberVisible = value == true
    }

    @LynxProp(name = "preferredCornerRadius", defaultDouble = -1.0)
    fun setPreferredCornerRadius(value: Double) {
        preferredCornerRadius = value.toFloat()
    }

    @LynxProp(name = "initialDetentIndex")
    fun setInitialDetentIndex(value: Int) {
        initialDetentIndex = value
    }

    @LynxProp(name = "selectedDetentIndex", defaultInt = -2)
    fun setSelectedDetentIndex(value: Int) {
        selectedDetentIndex = value
    }

    @LynxProp(name = "largestUndimmedDetentIndex", defaultInt = -1)
    fun setLargestUndimmedDetentIndex(value: Int) {
        largestUndimmedDetentIndex = value
    }

    @LynxProp(name = "prefersScrollingExpandsWhenScrolledToEdge")
    @Suppress("UNUSED_PARAMETER")
    fun setPrefersScrollingExpandsWhenScrolledToEdge(value: Boolean?) = Unit

    @LynxProp(name = "preventNativeDismiss")
    fun setPreventNativeDismiss(value: Dynamic?) {
        preventNativeDismissChannels = parsePreventNativeDismissChannels(value)
    }

    @LynxProp(name = "preventNativeDismissDragFeedback")
    fun setPreventNativeDismissDragFeedback(value: Boolean?) {
        preventNativeDismissDragFeedback = value == true
    }

    @LynxProp(name = "nativeContainerBackgroundColor")
    fun setNativeContainerBackgroundColor(value: String?) {
        nativeContainerBackgroundColor =
            value?.let {
                try {
                    Color.parseColor(it)
                } catch (_: IllegalArgumentException) {
                    null
                }
            }
    }

    override fun onPatchFinish() {
        view.setEventEmitter(eventEmitter)
        view.applyConfig(
            FormSheetConfig(
                isOpen = isOpen,
                detents = FormSheetDetents.parse(rawDetents),
                prefersGrabberVisible = prefersGrabberVisible,
                preferredCornerRadius = preferredCornerRadius,
                initialDetentIndex = initialDetentIndex,
                selectedDetentIndex = selectedDetentIndex,
                nativeContainerBackgroundColor = nativeContainerBackgroundColor,
                preventNativeDismissChannels = preventNativeDismissChannels,
                preventNativeDismissDragFeedback = preventNativeDismissDragFeedback,
                largestUndimmedDetentIndex = largestUndimmedDetentIndex,
            ),
        )
    }
}

internal fun parsePreventNativeDismissChannels(value: Dynamic?): Set<FormSheetDismissChannel> =
    when (value?.type) {
        ReadableType.Boolean -> {
            if (value.asBoolean()) {
                FormSheetDismissChannel.values().toSet()
            } else {
                emptySet()
            }
        }
        ReadableType.Array -> {
            val channels = value.asArray()
            buildSet {
                for (index in 0 until channels.size()) {
                    if (channels.getType(index) == ReadableType.String) {
                        FormSheetDismissChannel.fromValue(channels.getString(index))?.let(::add)
                    }
                }
            }
        }
        else -> emptySet()
    }

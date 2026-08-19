package com.lynxscreens.screens.formsheet

internal data class FormSheetConfig(
    val isOpen: Boolean,
    val detents: FormSheetDetents,
    val prefersGrabberVisible: Boolean,
    val preferredCornerRadius: Float,
    val initialDetentIndex: Int,
    val selectedDetentIndex: Int,
    val nativeContainerBackgroundColor: Int?,
    val preventNativeDismissChannels: Set<FormSheetDismissChannel>,
    val preventNativeDismissDragFeedback: Boolean,
    val largestUndimmedDetentIndex: Int,
) {
    fun preventsNativeDismiss(channel: FormSheetDismissChannel): Boolean =
        channel in preventNativeDismissChannels
}

internal enum class FormSheetDismissChannel(
    val eventValue: String,
) {
    BACK("back"),
    DRAG("drag"),
    BACKDROP("backdrop"),
    ;

    companion object {
        fun fromValue(value: String): FormSheetDismissChannel? =
            values().firstOrNull { it.eventValue == value }
    }
}

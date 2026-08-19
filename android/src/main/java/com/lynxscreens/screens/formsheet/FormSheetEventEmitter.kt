package com.lynxscreens.screens.formsheet

import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.event.LynxCustomEvent

internal class FormSheetEventEmitter(
    private val lynxContext: LynxContext,
    private val sign: Int,
) {
    internal fun emitOnWillAppear() = emit(EVENT_WILL_APPEAR)

    internal fun emitOnDidAppear() = emit(EVENT_DID_APPEAR)

    internal fun emitOnWillDisappear() = emit(EVENT_WILL_DISAPPEAR)

    internal fun emitOnDidDisappear() = emit(EVENT_DID_DISAPPEAR)

    internal fun emitOnDismiss() = emit(EVENT_DISMISS)

    internal fun emitOnNativeDismiss() = emit(EVENT_NATIVE_DISMISS)

    internal fun emitOnNativeDismissPrevented(channel: FormSheetDismissChannel) =
        emit(EVENT_NATIVE_DISMISS_PREVENTED, mapOf("channel" to channel.eventValue))

    internal fun emitOnDetentChanged(index: Int) = emit(EVENT_DETENT_CHANGED, mapOf("index" to index))

    private fun emit(
        name: String,
        detail: Map<String, Any>? = null,
    ) {
        val event = LynxCustomEvent(sign, name)
        detail?.forEach { (key, value) -> event.addDetail(key, value) }
        lynxContext.eventEmitter.sendCustomEvent(event)
    }

    private companion object {
        const val EVENT_WILL_APPEAR = "OnWillAppear"
        const val EVENT_DID_APPEAR = "OnDidAppear"
        const val EVENT_WILL_DISAPPEAR = "OnWillDisappear"
        const val EVENT_DID_DISAPPEAR = "OnDidDisappear"
        const val EVENT_DISMISS = "OnDismiss"
        const val EVENT_NATIVE_DISMISS = "OnNativeDismiss"
        const val EVENT_NATIVE_DISMISS_PREVENTED = "OnNativeDismissPrevented"
        const val EVENT_DETENT_CHANGED = "OnDetentChanged"
    }
}

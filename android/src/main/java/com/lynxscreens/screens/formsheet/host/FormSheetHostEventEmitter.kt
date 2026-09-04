package com.lynxscreens.screens.formsheet.host

import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.event.LynxCustomEvent
import com.lynxscreens.screens.formsheet.interfaces.FormSheetDialogEventEmitter

internal class FormSheetHostEventEmitter(
    private val lynxContext: LynxContext,
    private val sign: Int,
) : FormSheetDialogEventEmitter {
    override fun emitOnWillAppear() = emit(EVENT_WILL_APPEAR)

    override fun emitOnDidAppear() = emit(EVENT_DID_APPEAR)

    override fun emitOnWillDisappear() = emit(EVENT_WILL_DISAPPEAR)

    override fun emitOnDidDisappear() = emit(EVENT_DID_DISAPPEAR)

    override fun emitOnDismissEvent(isNativeDismiss: Boolean) =
        emit(EVENT_DISMISS, mapOf("isNativeDismiss" to isNativeDismiss))

    override fun emitOnNativeDismissPreventedEvent() = emit(EVENT_NATIVE_DISMISS_PREVENTED)

    override fun emitOnDetentChanged(index: Int) = emit(EVENT_DETENT_CHANGED, mapOf("index" to index))

    private fun emit(name: String, details: Map<String, Any>? = null) {
        val event = LynxCustomEvent(sign, name)
        details?.forEach { (key, value) -> event.addDetail(key, value) }
        lynxContext.eventEmitter.sendCustomEvent(event)
    }

    companion object {
        private const val EVENT_WILL_APPEAR = "OnWillAppear"
        private const val EVENT_DID_APPEAR = "OnDidAppear"
        private const val EVENT_WILL_DISAPPEAR = "OnWillDisappear"
        private const val EVENT_DID_DISAPPEAR = "OnDidDisappear"
        private const val EVENT_DISMISS = "OnDismiss"
        private const val EVENT_NATIVE_DISMISS_PREVENTED = "OnNativeDismissPrevented"
        private const val EVENT_DETENT_CHANGED = "OnDetentChanged"
    }
}

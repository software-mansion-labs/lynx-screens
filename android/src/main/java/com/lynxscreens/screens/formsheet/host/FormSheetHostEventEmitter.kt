package com.lynxscreens.screens.formsheet.host

import com.lynxscreens.screens.formsheet.FormSheetNavigationTrace
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.event.LynxCustomEvent
import com.lynxscreens.screens.formsheet.interfaces.FormSheetDialogEventEmitter

internal class FormSheetHostEventEmitter(
    private val lynxContext: LynxContext,
    private val sign: Int,
    internal val navigationTrace: FormSheetNavigationTrace,
) : FormSheetDialogEventEmitter {
    override fun emitOnWillAppear() = emit(EVENT_WILL_APPEAR)

    override fun emitOnDidAppear() = emit(EVENT_DID_APPEAR)

    override fun emitOnWillDisappear() = emit(EVENT_WILL_DISAPPEAR)

    override fun emitOnDidDisappear() = emit(EVENT_DID_DISAPPEAR)

    override fun emitOnDismissEvent() = emit(EVENT_DISMISS)

    override fun emitOnNativeDismissEvent() = emit(EVENT_NATIVE_DISMISS)

    override fun emitOnNativeDismissPreventedEvent() = emit(EVENT_NATIVE_DISMISS_PREVENTED)

    override fun emitOnDetentChanged(index: Int) = emit(EVENT_DETENT_CHANGED, mapOf("index" to index))

    private fun emit(name: String, details: Map<String, Any>? = null) {
        val event = LynxCustomEvent(sign, name)
        navigationTrace.eventTraceIdentity?.addTo(event)
        details?.forEach { (key, value) -> event.addDetail(key, value) }
        lynxContext.eventEmitter.sendCustomEvent(event)
        if (name != EVENT_DETENT_CHANGED) {
            navigationTrace.eventEmitted(
                name,
                name == EVENT_WILL_APPEAR || name == EVENT_DID_APPEAR ||
                    name == EVENT_WILL_DISAPPEAR || name == EVENT_DID_DISAPPEAR,
                details?.get("channel")?.toString(),
            )
        }
    }

    companion object {
        private const val EVENT_WILL_APPEAR = "OnWillAppear"
        private const val EVENT_DID_APPEAR = "OnDidAppear"
        private const val EVENT_WILL_DISAPPEAR = "OnWillDisappear"
        private const val EVENT_DID_DISAPPEAR = "OnDidDisappear"
        private const val EVENT_DISMISS = "OnDismiss"
        private const val EVENT_NATIVE_DISMISS = "OnNativeDismiss"
        private const val EVENT_NATIVE_DISMISS_PREVENTED = "OnNativeDismissPrevented"
        private const val EVENT_DETENT_CHANGED = "OnDetentChanged"
    }
}

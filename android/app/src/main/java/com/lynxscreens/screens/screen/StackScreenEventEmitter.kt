package com.lynxscreens.screens.screen

import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.event.LynxCustomEvent

internal class StackScreenEventEmitter(
    private val lynxContext: LynxContext,
    private val sign: Int
) {
    companion object {
        private const val EVENT_WILL_APPEAR = "OnWillAppear"
        private const val EVENT_DID_APPEAR = "OnDidAppear"
        private const val EVENT_WILL_DISAPPEAR = "OnWillDisappear"
        private const val EVENT_DID_DISAPPEAR = "OnDidDisappear"
        private const val EVENT_ON_DISMISS = "OnDismiss"
    }

    fun notifyOnWillAppear() = emit(EVENT_WILL_APPEAR)

    fun notifyOnDidAppear() = emit(EVENT_DID_APPEAR)

    fun notifyOnWillDisappear() = emit(EVENT_WILL_DISAPPEAR)

    fun notifyOnDidDisappear() = emit(EVENT_DID_DISAPPEAR)

    fun notifyOnDismiss(isNativeDismiss: Boolean) {
        emit(EVENT_ON_DISMISS, mapOf("isNativeDismiss" to isNativeDismiss))
    }

    private fun emit(name: String, params: Map<String, Any>? = null) {
        val event = LynxCustomEvent(sign, name)
        params?.forEach { (key, value) ->
            event.addDetail(key, value)
        }
        lynxContext.eventEmitter.sendCustomEvent(event)
    }
}

package com.lynxscreens.screens.screen

import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.event.LynxCustomEvent
import com.lynxscreens.screens.common.event.ViewAppearanceEventEmitter

internal class StackScreenEventEmitter(
    private val lynxContext: LynxContext,
    private val sign: Int
) : ViewAppearanceEventEmitter {
    companion object {
        private const val EVENT_WILL_APPEAR = "OnWillAppear"
        private const val EVENT_DID_APPEAR = "OnDidAppear"
        private const val EVENT_WILL_DISAPPEAR = "OnWillDisappear"
        private const val EVENT_DID_DISAPPEAR = "OnDidDisappear"
        private const val EVENT_ON_DISMISS = "OnDismiss"
        private const val EVENT_ON_NATIVE_DISMISS_PREVENTED = "OnNativeDismissPrevented"
    }

    override fun emitOnWillAppear() {
        emit(EVENT_WILL_APPEAR)
    }

    override fun emitOnDidAppear() {
        emit(EVENT_DID_APPEAR)
    }

    override fun emitOnWillDisappear() {
        emit(EVENT_WILL_DISAPPEAR)
    }

    override fun emitOnDidDisappear() {
        emit(EVENT_DID_DISAPPEAR)
    }

    internal fun emitOnDismiss(isNativeDismiss: Boolean) {
        emit(EVENT_ON_DISMISS, mapOf("isNativeDismiss" to isNativeDismiss))
    }

    internal fun emitOnNativeDismissPrevented() {
        emit(EVENT_ON_NATIVE_DISMISS_PREVENTED)
    }

    private fun emit(name: String, params: Map<String, Any>? = null) {
        val event = LynxCustomEvent(sign, name)
        params?.forEach { (key, value) ->
            event.addDetail(key, value)
        }
        lynxContext.eventEmitter.sendCustomEvent(event)
    }
}

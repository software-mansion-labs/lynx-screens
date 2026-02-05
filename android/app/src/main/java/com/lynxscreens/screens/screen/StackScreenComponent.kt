package com.lynxscreens.screens.screen

import android.content.Context
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynx.tasm.event.LynxCustomEvent
import com.lynxscreens.screens.host.StackHostComponent
import java.lang.IllegalArgumentException
import java.lang.ref.WeakReference
import kotlin.properties.Delegates

internal class StackScreenComponent(context: LynxContext) : UIGroup<StackScreenView>(context) {
    enum class ActivityMode {
        DETACHED,
        ATTACHED,
    }

    internal var isNativelyDismissed = false
        set(value) {
            require(value) {
                "[RNScreens] Natively dismissed StackScreen must remain dismissed."
            }
            field = true
        }

    internal var stackHost: WeakReference<StackHostComponent?> = WeakReference(null)

    internal var activityMode: ActivityMode by Delegates.observable(ActivityMode.DETACHED) { _, oldValue, newValue ->
        if (oldValue != newValue) {
            stackHost.get()?.stackScreenChangedActivityMode(this)
        }
    }

    internal var screenKey: String? = null

    override fun createView(context: Context?): StackScreenView = StackScreenView(context as LynxContext)

    @LynxProp(name = "activityMode")
    fun setActivityMode(
        value: String?,
    ) {
        when (value) {
            "attached" -> activityMode = ActivityMode.ATTACHED
            "detached" -> activityMode = ActivityMode.DETACHED
            else -> throw IllegalArgumentException("[RNScreens] Invalid activity mode: $value.")
        }
    }

    @LynxProp(name = "screenKey")
    fun setScreenKey(
        value: String?,
    ) {
        requireNotNull(value) {
            "[RNScreens] screenKey must not be null."
        }
        screenKey = value
    }

    internal fun notifyOnWillAppear() {
        emitEvent("OnWillAppear", null)
    }

    internal fun notifyOnDidAppear() {
        emitEvent("OnDidAppear", null)
    }

    internal fun notifyOnWillDisappear() {
        emitEvent("OnWillDisappear", null)
    }

    internal fun notifyOnDidDisappear() {
        emitEvent("OnDidDisappear", null)
    }

    internal fun notifyOnDismiss(isNativeDismiss: Boolean) {
        emitEvent("OnDismiss", mapOf(
            "isNativeDismiss" to isNativeDismiss
        ))
    }

    private fun emitEvent(name: String, value: Map<String, Any>?) {
        val detail = LynxCustomEvent(sign, name)
        value?.forEach { (key, v) ->
            detail.addDetail(key, v)
        }
        lynxContext.eventEmitter.sendCustomEvent(detail)
    }
}

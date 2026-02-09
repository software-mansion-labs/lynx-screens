package com.lynxscreens.screens.screen

import android.content.Context
import androidx.lifecycle.LifecycleOwner
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

    private val eventEmitter: StackScreenEventEmitter by lazy {
        StackScreenEventEmitter(lynxContext, sign)
    }

    internal fun createAppearanceEventsEmitter(viewLifecycleOwner: LifecycleOwner) =
        StackScreenAppearanceEventsEmitter(viewLifecycleOwner.lifecycle, eventEmitter)

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

    internal fun onDismiss() {
        if (activityMode == ActivityMode.ATTACHED) {
            isNativelyDismissed = true
        }
        eventEmitter.notifyOnDismiss(isNativelyDismissed)
    }
}

package com.lynxscreens.screens.screen

import android.content.Context
import androidx.lifecycle.LifecycleOwner
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxElement
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.ui.LynxBaseUI
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynx.tasm.event.LynxCustomEvent
import com.lynxscreens.screens.common.ShadowStateProxy
import com.lynxscreens.screens.header.config.OnHeaderConfigurationAttachListener
import com.lynxscreens.screens.header.config.StackHeaderConfigComponent
import com.lynxscreens.screens.host.StackHostComponent
import java.lang.IllegalArgumentException
import java.lang.ref.WeakReference
import kotlin.properties.Delegates

@LynxElement(name = "ls-stack-screen")
internal class StackScreenComponent(context: LynxContext) : UIGroup<StackScreenView>(context) {
    enum class ActivityMode {
        DETACHED,
        ATTACHED,
    }

    internal var isPreventNativeDismissEnabled: Boolean by Delegates.observable(false) { _, oldValue, newValue ->
        if (oldValue != newValue) {
            preventNativeDismissChangeObserver?.preventNativeDismissChanged(newValue)
        }
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

    private val shadowStateProxy: ShadowStateProxy by lazy {
        ShadowStateProxy(lynxContext, sign)
    }

    internal fun updateStateIfNeeded(
        x: Int? = null,
        y: Int? = null,
        width: Int? = null,
        height: Int? = null,
    ) = shadowStateProxy.updateStateIfNeeded(
        contentOffsetX = x,
        contentOffsetY = y,
        frameWidth = width,
        frameHeight = height,
    )

    internal var headerConfig: StackHeaderConfigComponent? = null
        private set

    private var onHeaderConfigurationAttachListener: WeakReference<OnHeaderConfigurationAttachListener>? = null

    internal fun registerHeaderConfigAttachListener(listener: OnHeaderConfigurationAttachListener) {
        check(onHeaderConfigurationAttachListener?.get() == null) {
            "[RNScreens] Attempted to register header config attach listener before previous listener was cleared."
        }
        onHeaderConfigurationAttachListener = WeakReference(listener)
        headerConfig?.let { listener.onHeaderConfigAttached(it, it) }
    }

    internal fun clearHeaderConfigAttachListener() {
        onHeaderConfigurationAttachListener = null
    }

    internal fun attachHeaderConfig(header: StackHeaderConfigComponent) {
        headerConfig = header
        onHeaderConfigurationAttachListener?.get()?.onHeaderConfigAttached(header, header)
    }

    internal fun detachHeaderConfig(header: StackHeaderConfigComponent) {
        if (headerConfig === header) {
            headerConfig = null
            onHeaderConfigurationAttachListener?.get()?.onHeaderConfigAttached(null, null)
        }
    }

    override fun insertChild(
        child: LynxBaseUI,
        index: Int,
    ) {
        // HeaderConfig is not added to native hierarchy & it must be the last child of StackScreen.
        if (child is StackHeaderConfigComponent) {
            require(index >= super.getChildCount()) {
                "[RNScreens] StackHeaderConfig must be the last child of StackScreen."
            }
            attachHeaderConfig(child)
        } else {
            require(index <= super.getChildCount()) {
                "[RNScreens] StackHeaderConfig must be the last child of StackScreen."
            }
            super.insertChild(child, index)
        }
    }

    override fun removeChild(child: LynxBaseUI?) {
        if (child is StackHeaderConfigComponent) {
            detachHeaderConfig(child)
        } else {
            super.removeChild(child)
        }
    }

    private val eventEmitter: StackScreenEventEmitter by lazy {
        StackScreenEventEmitter(lynxContext, sign)
    }

    /**
     * Use this to set/unset the observer.
     */
    internal var preventNativeDismissChangeObserver: PreventNativeDismissChangeObserver? = null

    internal fun createAppearanceEventsEmitter(viewLifecycleOwner: LifecycleOwner) =
        StackScreenAppearanceEventsEmitter(viewLifecycleOwner.lifecycle, eventEmitter)

    override fun createView(context: Context?): StackScreenView =
        StackScreenView(context as LynxContext).also { view ->
            view.onLaidOut = { width, height -> updateStateIfNeeded(width = width, height = height) }
        }

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

    @LynxProp(name = "preventNativeDismiss")
    fun setPreventNativeDismiss(
        value: Boolean?,
    ) {
        isPreventNativeDismissEnabled = value == true
    }

    internal fun onDismiss() {
        if (activityMode == ActivityMode.ATTACHED) {
            isNativelyDismissed = true
        }
        eventEmitter.emitOnDismiss(isNativelyDismissed)
    }

    internal fun onNativeDismissPrevented() {
        eventEmitter.emitOnNativeDismissPrevented()
    }
}

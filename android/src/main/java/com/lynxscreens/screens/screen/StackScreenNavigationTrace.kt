package com.lynxscreens.screens.screen

import androidx.transition.Transition
import com.lynxscreens.screens.common.trace.*
import java.lang.ref.WeakReference

internal enum class StackTransitionRole(val traceValue: String) {
    ENTER("enter"),
    EXIT("exit"),
    RETURN("return"),
    REENTER("reenter"),
}

internal class StackScreenNavigationTrace(private val fragment: StackScreenFragment) {
    private var delegateReference = WeakReference<StackScreenTraceDelegate>(null)
    var delegate: StackScreenTraceDelegate?
        get() = delegateReference.get()
        set(value) {
            delegateReference = WeakReference(value)
        }

    var operation: NativeTransitionContext? = null
    var containerId: String? = null
    val traceIdentityProvider: () -> NavigationTraceIdentity? = {
        operation?.identityFor(fragment.stackScreen.screenKey)
    }

    fun transitionListener(role: StackTransitionRole): Transition.TransitionListener {
        val context = operation
        val key = fragment.stackScreen.screenKey
        val owner = delegateReference
        return object : Transition.TransitionListener {
            override fun onTransitionStart(transition: Transition) {
                owner.get()?.onNativeTransition(context, key, role, "start")
            }

            override fun onTransitionEnd(transition: Transition) {
                owner.get()?.onNativeTransition(context, key, role, "end")
            }

            override fun onTransitionCancel(transition: Transition) {
                owner.get()?.onNativeTransition(context, key, role, "cancel")
            }

            override fun onTransitionPause(transition: Transition) = Unit

            override fun onTransitionResume(transition: Transition) = Unit
        }
    }

    fun onNativeBackPressed() {
        delegate?.onNativeBackPressed(fragment)
    }

    fun onNativeDismissPrevented() {
        delegate?.onNativeDismissPrevented(fragment)
    }

    fun dispose() {
        operation = null
        delegate = null
    }
}

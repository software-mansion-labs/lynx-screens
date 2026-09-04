package com.lynxscreens.screens.screen

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment

/**
 * A Fragment whose runtime state comes from the current Lynx component tree and cannot be restored
 * by Android's saved-state mechanism.
 *
 * Concrete Fragments still need to expose a public no-argument constructor. Instances created
 * through that constructor are restored placeholders: they never enter runtime-only lifecycle
 * callbacks and remove themselves as soon as they are attached to a FragmentManager.
 */
internal abstract class NonRestorableLynxFragment<State : Any> : Fragment() {
    private var runtimeStateOrNull: State? = null

    protected val runtimeState: State
        get() =
            checkNotNull(runtimeStateOrNull) {
                "[RNScreens] Restored Fragment has no Lynx runtime state"
            }

    internal val isRestoredPlaceholder: Boolean
        get() = runtimeStateOrNull == null

    protected fun initializeRuntimeState(state: State) {
        check(runtimeStateOrNull == null) {
            "[RNScreens] Lynx Fragment runtime state has already been initialized"
        }
        runtimeStateOrNull = state
    }

    final override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (isRestoredPlaceholder) {
            removeRestoredFragment()
            return
        }

        onRuntimeCreate(savedInstanceState)
    }

    final override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View? =
        if (isRestoredPlaceholder) {
            null
        } else {
            onCreateRuntimeView(inflater, container, savedInstanceState)
        }

    final override fun onViewCreated(
        view: View,
        savedInstanceState: Bundle?,
    ) {
        super.onViewCreated(view, savedInstanceState)
        if (!isRestoredPlaceholder) {
            onRuntimeViewCreated(view, savedInstanceState)
        }
    }

    final override fun onDestroyView() {
        if (!isRestoredPlaceholder) {
            onRuntimeDestroyView()
        }
        super.onDestroyView()
    }

    final override fun onDestroy() {
        super.onDestroy()
        if (!isRestoredPlaceholder) {
            onRuntimeDestroy()
        }
    }

    protected open fun onRuntimeCreate(savedInstanceState: Bundle?) = Unit

    protected abstract fun onCreateRuntimeView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View

    protected open fun onRuntimeViewCreated(
        view: View,
        savedInstanceState: Bundle?,
    ) = Unit

    protected open fun onRuntimeDestroyView() = Unit

    protected open fun onRuntimeDestroy() = Unit

    private fun removeRestoredFragment() {
        parentFragmentManager
            .beginTransaction()
            .remove(this)
            .commitAllowingStateLoss()
    }
}

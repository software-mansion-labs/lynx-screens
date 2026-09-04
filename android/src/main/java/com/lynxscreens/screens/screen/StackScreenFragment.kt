package com.lynxscreens.screens.screen

import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.annotation.Keep
import androidx.transition.Slide
import com.lynxscreens.screens.header.StackHeaderCoordinatorLayout

internal data class StackScreenRuntimeState(
    val stackScreen: StackScreenComponent,
    val canNavigateBack: Boolean,
)

internal class StackScreenFragment @Keep constructor() :
    NonRestorableLynxFragment<StackScreenRuntimeState>() {
    internal constructor(
        stackScreen: StackScreenComponent,
        canNavigateBack: Boolean,
    ) : this() {
        initializeRuntimeState(
            StackScreenRuntimeState(
                stackScreen = stackScreen,
                canNavigateBack = canNavigateBack,
            ),
        )
    }

    internal val stackScreen: StackScreenComponent
        get() = runtimeState.stackScreen

    private val canNavigateBack: Boolean
        get() = runtimeState.canNavigateBack

    private var screenLifecycleEventEmitter: StackScreenAppearanceEventsEmitter? = null

    /**
     * This holds the screen strongly for now. Beware of retain cycle.
     *
     * Since each StackScreenFragment owns a PreventNativeDismissCallback & adds it to the
     * OnBackPressedDispatcher the callback should be enabled only when the top fragment is this fragment.
     */
    private var preventNativeDismissBackPressedCallback: PreventNativeDismissCallback? = null
    private val requireNativeDismissBackPressedCallback
        get() = checkNotNull(preventNativeDismissBackPressedCallback) { "[RNScreens] Attempt to require nullish OnBackPressedCallback" }

    private var isTopFragment: Boolean = false

    override fun onRuntimeCreate(savedInstanceState: Bundle?) {
        setupPreventNativeDismissCallback()

        allowEnterTransitionOverlap = true
        allowReturnTransitionOverlap = true

        enterTransition = Slide(Gravity.RIGHT)
        exitTransition = Slide(Gravity.LEFT)
        returnTransition = Slide(Gravity.RIGHT)
        reenterTransition = Slide(Gravity.LEFT)
    }

    override fun onCreateRuntimeView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View = StackHeaderCoordinatorLayout(requireContext(), stackScreen, canNavigateBack)

    override fun onRuntimeViewCreated(
        view: View,
        savedInstanceState: Bundle?,
    ) {
        screenLifecycleEventEmitter = stackScreen.createAppearanceEventsEmitter(viewLifecycleOwner)
    }

    override fun onRuntimeDestroyView() {
        val coordinatorLayout = view
        check(coordinatorLayout is StackHeaderCoordinatorLayout) {
            "[RNScreens] Unexpected fragment view type: $view"
        }
        coordinatorLayout.tearDown()
        screenLifecycleEventEmitter = null
    }

    override fun onRuntimeDestroy() {
        stackScreen.onDismiss()
        teardownPreventNativeDismissCallback()
    }

    /**
     * Notifies this fragment that it has become "top fragment" in its fragment manager.
     * Call this only if the lifecycle of the fragment is at least at CREATED.
     *
     * This function should be idempotent.
     */
    internal fun onBecomeTopFragment() {
        if (isTopFragment) return

        isTopFragment = true
        requireNativeDismissBackPressedCallback.canBeEnabled = true
    }

    /**
     * Notifies this fragment that it is not longer the "top fragment" in its fragment manager.
     * Call this only if the lifecycle of the fragment is at least at CREATED.
     *
     * This function should be idempotent.
     */
    internal fun onResignTopFragment() {
        if (!isTopFragment) return

        isTopFragment = false
        requireNativeDismissBackPressedCallback.canBeEnabled = false
    }

    private fun setupPreventNativeDismissCallback() {
        preventNativeDismissBackPressedCallback =
            PreventNativeDismissCallback(this, stackScreen, canBeEnabled = false)
        requireActivity().onBackPressedDispatcher.addCallback(
            requireNativeDismissBackPressedCallback,
        )
    }

    private fun teardownPreventNativeDismissCallback() {
        requireNativeDismissBackPressedCallback.remove()
        preventNativeDismissBackPressedCallback = null
    }
}

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
    private val navigationTrace =
        StackScreenNavigationTrace(
            fragment = this,
        )

    internal var traceDelegate: StackScreenTraceDelegate?
        get() = navigationTrace.delegate
        set(value) {
            navigationTrace.delegate = value
        }

    internal val traceOperation get() = navigationTrace.operation
    internal fun bindTraceOperation(context: com.lynxscreens.screens.common.trace.NativeTransitionContext?, containerId: String) {
        navigationTrace.operation = context
        navigationTrace.containerId = containerId
        if (isAdded) configureTransitions()
    }
    private fun configureTransitions() {
        enterTransition = Slide(Gravity.RIGHT).also { it.addListener(navigationTrace.transitionListener(StackTransitionRole.ENTER)) }
        exitTransition = Slide(Gravity.LEFT).also { it.addListener(navigationTrace.transitionListener(StackTransitionRole.EXIT)) }
        returnTransition = Slide(Gravity.RIGHT).also { it.addListener(navigationTrace.transitionListener(StackTransitionRole.RETURN)) }
        reenterTransition = Slide(Gravity.LEFT).also { it.addListener(navigationTrace.transitionListener(StackTransitionRole.REENTER)) }
    }

    override fun onRuntimeCreate(savedInstanceState: Bundle?) {
        stackScreen.traceIdentityProvider = navigationTrace.traceIdentityProvider
        setupPreventNativeDismissCallback()

        allowEnterTransitionOverlap = true
        allowReturnTransitionOverlap = true

        configureTransitions()
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
        // Destroying an outer StackScreen also destroys all Fragments in its child manager. Those
        // nested screens were not independently popped and must not emit another native dismissal.
        if (generateSequence(parentFragment) { it.parentFragment }.none { it.isRemoving }) {
            stackScreen.onDismiss()
        }
        if (stackScreen.traceIdentityProvider === navigationTrace.traceIdentityProvider) {
            stackScreen.traceIdentityProvider = null
        }
        navigationTrace.dispose()
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
            PreventNativeDismissCallback(
                lifecycleOwner = this,
                screen = stackScreen,
                canNavigateBack = canNavigateBack,
                onNativeBackPressed = navigationTrace::onNativeBackPressed,
                onNativeDismissPrevented = navigationTrace::onNativeDismissPrevented,
                forwardBackPressed = { requireActivity().onBackPressedDispatcher.onBackPressed() },
                canBeEnabled = false,
            )
        requireActivity().onBackPressedDispatcher.addCallback(
            requireNativeDismissBackPressedCallback,
        )
    }

    private fun teardownPreventNativeDismissCallback() {
        requireNativeDismissBackPressedCallback.remove()
        preventNativeDismissBackPressedCallback = null
    }
}

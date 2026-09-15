package com.lynxscreens.screens.formsheet.presentation

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.util.Log
import android.view.View
import androidx.core.view.doOnPreDraw
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.lynxscreens.screens.common.event.ViewAppearanceEventEmitter

internal class FormSheetPresentationManager(
    private val navigationTrace: com.lynxscreens.screens.formsheet.FormSheetNavigationTrace?,
    private val presentationFactory: () -> FormSheetPresentation,
    private val dimmingManager: FormSheetDimmingManager,
    private val onNativeDismiss: () -> Unit,
    private val onDismiss: () -> Unit,
) {
    internal var appearanceEventEmitter: ViewAppearanceEventEmitter? = null
    internal var currentPresentation: FormSheetPresentation? = null
        private set

    private val bottomSheetView: View?
        get() = currentPresentation?.bottomSheetView

    private var state = FormSheetPresentationState.DISMISSED
    private var shouldBeOpen = false
    private var requestedTraceBatch: com.lynxscreens.screens.common.trace.TraceBatch? = null
    private var shouldSkipExitAnimation = false
    private var dismissalOrigin = FormSheetDismissalOrigin.UNSPECIFIED
    private val animatorFactory = FormSheetAnimatorFactory(dimmingManager)
    private var currentSheetAnimator: Animator? = null

    internal fun requestProgrammaticStateUpdate(shouldBeOpen: Boolean) {
        if (this.shouldBeOpen != shouldBeOpen) requestedTraceBatch = navigationTrace?.captureBatch()
        updatePresentationState(
            shouldBeOpen,
            if (shouldBeOpen) FormSheetDismissalOrigin.UNSPECIFIED else FormSheetDismissalOrigin.PROGRAMMATIC,
        )
    }

    internal fun handleNativeDismiss() {
        if (state != FormSheetPresentationState.DISMISSING && state != FormSheetPresentationState.DISMISSED) {
            updatePresentationState(false, FormSheetDismissalOrigin.USER)
        }
    }

    private fun updatePresentationState(shouldBeOpen: Boolean, origin: FormSheetDismissalOrigin) {
        val isRepeatCloseRequest = !shouldBeOpen && !this.shouldBeOpen
        if (state != FormSheetPresentationState.DISMISSING && !isRepeatCloseRequest) dismissalOrigin = origin
        this.shouldBeOpen = shouldBeOpen
        resolvePresentationState()
    }

    private fun resolvePresentationState() {
        if (shouldBeOpen) presentIfNeeded() else dismissIfNeeded()
    }

    private fun presentIfNeeded() {
        if (state != FormSheetPresentationState.DISMISSED) return
        navigationTrace?.beginPresent(requestedTraceBatch)
        requestedTraceBatch = null
        state = FormSheetPresentationState.PRESENTING
        val traceOperation = navigationTrace?.operation
        val presentation = presentationFactory().also { currentPresentation = it }
        presentation.sheetBehavior?.let(dimmingManager::attachToBehavior)
        FormSheetStackRegistry.register(this)
        appearanceEventEmitter?.emitOnWillAppear()
        presentation.bottomSheetView?.let(::keepOffscreenUntilEnterAnimation)
        presentation.dialog.setOnShowListener {
            presentation.dialog.setOnShowListener(null)
            dimmingManager.attachDimming(FormSheetStackRegistry.sheetBelow(this)?.bottomSheetView)
            startEnterAnimation(traceOperation)
        }
        presentation.dialog.show()
    }

    private fun dismissIfNeeded() {
        if (state != FormSheetPresentationState.PRESENTED) return
        if (dismissalOrigin == FormSheetDismissalOrigin.PROGRAMMATIC) navigationTrace?.beginProgrammaticDismiss(requestedTraceBatch)
        requestedTraceBatch = null
        state = FormSheetPresentationState.DISMISSING
        FormSheetStackRegistry.sheetsAbove(this).asReversed().forEach { it.handleDismissFromCascade() }
        FormSheetStackRegistry.unregister(this)
        appearanceEventEmitter?.emitOnWillDisappear()
        val isSheetHidden = bottomSheetView?.let {
            BottomSheetBehavior.from(it).state == BottomSheetBehavior.STATE_HIDDEN
        } ?: true
        when {
            isSheetHidden -> performDismiss()
            shouldSkipExitAnimation -> performInstantDismiss()
            else -> startExitAnimation()
        }
    }

    private fun handleDismissFromCascade() {
        if (state == FormSheetPresentationState.DISMISSING || state == FormSheetPresentationState.DISMISSED) return
        navigationTrace?.beginNativeDismiss(com.lynxscreens.screens.common.trace.NativeTransitionOrigin.CASCADE)
        shouldSkipExitAnimation = true
        updatePresentationState(false, FormSheetDismissalOrigin.USER)
    }

    private fun performInstantDismiss() {
        currentSheetAnimator?.removeAllListeners()
        currentSheetAnimator?.cancel()
        currentSheetAnimator = null
        performDismiss()
    }

    private fun keepOffscreenUntilEnterAnimation(view: View) {
        view.doOnPreDraw {
            if (currentSheetAnimator == null) view.translationY = view.height.toFloat()
        }
    }

    private fun startEnterAnimation(traceOperation: com.lynxscreens.screens.common.trace.NativeTransitionContext?) {
        val view = bottomSheetView
        if (view == null) {
            navigationTrace?.start(false, traceOperation)
            onPresentationComplete(traceOperation)
            return
        }
        navigationTrace?.start(true, traceOperation)
        val isInterrupting = currentSheetAnimator?.isRunning == true
        currentSheetAnimator?.removeAllListeners()
        currentSheetAnimator?.cancel()
        dimmingManager.isTransitionAnimationRunning = true
        currentSheetAnimator =
            animatorFactory.createEnterAnimator(view, isInterrupting).apply {
                addListener(
                    object : AnimatorListenerAdapter() {
                        override fun onAnimationEnd(animation: Animator) {
                            dimmingManager.isTransitionAnimationRunning = false
                            if (currentSheetAnimator === this@apply) currentSheetAnimator = null
                            onPresentationComplete(traceOperation)
                        }
                    },
                )
                start()
            }
    }

    private fun startExitAnimation() {
        val traceOperation = navigationTrace?.operation
        navigationTrace?.start(true, traceOperation)
        val view = bottomSheetView
        if (view == null) {
            performDismiss(traceOperation)
            return
        }
        val isInterrupting = currentSheetAnimator?.isRunning == true
        currentSheetAnimator?.removeAllListeners()
        currentSheetAnimator?.cancel()
        dimmingManager.isTransitionAnimationRunning = true
        currentSheetAnimator =
            animatorFactory.createExitAnimator(view, isInterrupting).apply {
                addListener(
                    object : AnimatorListenerAdapter() {
                        override fun onAnimationEnd(animation: Animator) {
                            dimmingManager.isTransitionAnimationRunning = false
                            if (currentSheetAnimator === this@apply) currentSheetAnimator = null
                            performDismiss(traceOperation)
                        }
                    },
                )
                start()
            }
    }

    private fun performDismiss(traceOperation: com.lynxscreens.screens.common.trace.NativeTransitionContext? = navigationTrace?.operation) {
        navigationTrace?.start(false, traceOperation)
        shouldSkipExitAnimation = false
        dimmingManager.detachDimming()
        currentPresentation?.destroy()
        navigationTrace?.dismissCommittedAndComplete(traceOperation)
        currentPresentation = null
        if (state == FormSheetPresentationState.DISMISSING) {
            state = FormSheetPresentationState.DISMISSED
            withTrace(traceOperation) { appearanceEventEmitter?.emitOnDidDisappear() }
            when (dismissalOrigin) {
                FormSheetDismissalOrigin.USER -> withTrace(traceOperation) { onNativeDismiss() }
                FormSheetDismissalOrigin.PROGRAMMATIC -> withTrace(traceOperation) { onDismiss() }
                FormSheetDismissalOrigin.UNSPECIFIED ->
                    Log.e(
                        "[RNScreens]",
                        "FormSheet dismissal completed without a recorded origin; no dismissal event emitted",
                    )
            }
            dismissalOrigin = FormSheetDismissalOrigin.UNSPECIFIED
            resolvePresentationState()
        }
    }

    private fun onPresentationComplete(traceOperation: com.lynxscreens.screens.common.trace.NativeTransitionContext?) {
        navigationTrace?.complete(traceOperation)
        if (state == FormSheetPresentationState.PRESENTING) {
            state = FormSheetPresentationState.PRESENTED
            withTrace(traceOperation) { appearanceEventEmitter?.emitOnDidAppear() }
            resolvePresentationState()
        }
    }

    private fun withTrace(context: com.lynxscreens.screens.common.trace.NativeTransitionContext?, block: () -> Unit) {
        val trace = navigationTrace
        if (trace != null) trace.withOperation(context, block) else block()
    }

    internal fun destroy() {
        navigationTrace?.dispose("container_destroyed")
        FormSheetStackRegistry.unregister(this)
        dimmingManager.detachDimming()
        currentSheetAnimator?.cancel()
        currentSheetAnimator = null
        currentPresentation?.destroy()
        currentPresentation = null
        state = FormSheetPresentationState.DISMISSED
    }
}

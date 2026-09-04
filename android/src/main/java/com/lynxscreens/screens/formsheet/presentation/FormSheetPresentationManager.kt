package com.lynxscreens.screens.formsheet.presentation

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.util.Log
import android.view.View
import androidx.core.view.doOnPreDraw
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.lynxscreens.screens.common.event.ViewAppearanceEventEmitter

internal class FormSheetPresentationManager(
    private val presentationFactory: () -> FormSheetPresentation,
    private val dimmingManager: FormSheetDimmingManager,
    private val onDismiss: (isNativeDismiss: Boolean) -> Unit,
) {
    internal var appearanceEventEmitter: ViewAppearanceEventEmitter? = null
    internal var currentPresentation: FormSheetPresentation? = null
        private set

    private val bottomSheetView: View?
        get() = currentPresentation?.bottomSheetView

    private var state = FormSheetPresentationState.DISMISSED
    private var shouldBeOpen = false
    private var shouldSkipExitAnimation = false
    private var dismissalOrigin = FormSheetDismissalOrigin.UNSPECIFIED
    private val animatorFactory = FormSheetAnimatorFactory(dimmingManager)
    private var currentSheetAnimator: Animator? = null

    internal fun requestProgrammaticStateUpdate(shouldBeOpen: Boolean) {
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
        state = FormSheetPresentationState.PRESENTING
        val presentation = presentationFactory().also { currentPresentation = it }
        presentation.sheetBehavior?.let(dimmingManager::attachToBehavior)
        FormSheetStackRegistry.register(this)
        appearanceEventEmitter?.emitOnWillAppear()
        presentation.bottomSheetView?.let(::keepOffscreenUntilEnterAnimation)
        presentation.dialog.setOnShowListener {
            presentation.dialog.setOnShowListener(null)
            dimmingManager.attachDimming(FormSheetStackRegistry.sheetBelow(this)?.bottomSheetView)
            startEnterAnimation()
        }
        presentation.dialog.show()
    }

    private fun dismissIfNeeded() {
        if (state != FormSheetPresentationState.PRESENTED) return
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

    private fun startEnterAnimation() {
        val view = bottomSheetView
        if (view == null) {
            onPresentationComplete()
            return
        }
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
                            onPresentationComplete()
                        }
                    },
                )
                start()
            }
    }

    private fun startExitAnimation() {
        val view = bottomSheetView
        if (view == null) {
            performDismiss()
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
                            performDismiss()
                        }
                    },
                )
                start()
            }
    }

    private fun performDismiss() {
        shouldSkipExitAnimation = false
        dimmingManager.detachDimming()
        currentPresentation?.destroy()
        currentPresentation = null
        if (state == FormSheetPresentationState.DISMISSING) {
            state = FormSheetPresentationState.DISMISSED
            appearanceEventEmitter?.emitOnDidDisappear()
            when (dismissalOrigin) {
                FormSheetDismissalOrigin.USER -> onDismiss(true)
                FormSheetDismissalOrigin.PROGRAMMATIC -> onDismiss(false)
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

    private fun onPresentationComplete() {
        if (state == FormSheetPresentationState.PRESENTING) {
            state = FormSheetPresentationState.PRESENTED
            appearanceEventEmitter?.emitOnDidAppear()
            resolvePresentationState()
        }
    }

    internal fun destroy() {
        FormSheetStackRegistry.unregister(this)
        dimmingManager.detachDimming()
        currentSheetAnimator?.cancel()
        currentSheetAnimator = null
        currentPresentation?.destroy()
        currentPresentation = null
        state = FormSheetPresentationState.DISMISSED
    }
}

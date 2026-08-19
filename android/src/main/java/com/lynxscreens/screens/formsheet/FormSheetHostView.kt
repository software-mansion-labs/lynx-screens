package com.lynxscreens.screens.formsheet

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.view.GestureDetector
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewConfiguration
import android.view.Window
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.FrameLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynxscreens.screens.common.BaseUITransfer
import kotlin.math.abs
import kotlin.math.roundToInt

@SuppressLint("ViewConstructor")
internal class FormSheetHostView(
    context: LynxContext,
    transfer: BaseUITransfer<*>,
) : BaseUITransfer.BaseTransferView(context) {
    private val sheetContent = SheetContentView(context, transfer)
    override val transferReceiver: ViewGroup
        get() = sheetContent

    private val sheetContainer =
        object : FrameLayout(context) {
            override fun dispatchTouchEvent(event: MotionEvent): Boolean {
                trackPotentialDismissDrag(event)
                val originX = event.x
                val originY = event.y
                context.EnsureEventDispatcher()
                val dispatcher = context.touchEventDispatcher
                val consumedByLynx = dispatcher?.onTouchEvent(event, lynxRootUi) == true
                event.setLocation(originX, originY)

                if (consumedByLynx && dispatcher?.blockNativeEvent(event) == true) {
                    parent?.requestDisallowInterceptTouchEvent(true)
                }
                if (consumedByLynx && dispatcher?.consumeSlideEvent(event) == true) {
                    return true
                }
                return super.dispatchTouchEvent(event) || consumedByLynx
            }
        }
    private val grabber = View(context)

    private lateinit var lynxRootUi: UIGroup<*>
    private var dialog: BottomSheetDialog? = null
    private var sheetBehavior: FormSheetBehavior<FrameLayout>? = null
    private var eventEmitter: FormSheetEventEmitter? = null
    private var latestConfig: FormSheetConfig? = null
    private var isPresented = false
    private var nativeDismissedForCurrentRequest = false
    private var previousRequestedOpen = false
    private var suppressDismissEvents = false
    private var lastEmittedDetentIndex = -1
    private var currentDetentsCount = 1
    private var hasEmittedWillDisappear = false
    private var defaultBottomSheetBackground: Drawable? = null
    private var stateBeforeDrag = -1
    private var maxOffsetDuringDrag = Float.MIN_VALUE
    private var pendingDismissPreventedEmission = false
    private var recoveringPreventedDragDismiss = false
    private var dismissDragStartRawY = Float.NaN
    private var maxDownwardDismissDragDistance = 0f
    private val dismissDragDistanceThreshold = ViewConfiguration.get(context).scaledTouchSlop.toFloat()
    private var currentDetentHeights: List<Int> = emptyList()
    private var presentationAnimationPending = false
    private var presentationAnimationRunning = false
    private var dismissAnimationRunning = false
    private var pendingBackdropAlpha = 0f
    private var presentationTargetDetentIndex: Int? = null
    private var hasEmittedDidAppear = false
    private var nativeDismissEventEmitted = false
    private var programmaticDismissPending = false
    private var dismissAnimator: ValueAnimator? = null
    private var presentationAnimationStartedAt = 0L

    private val bottomSheetCallback =
        object : FormSheetBehavior.Callback() {
            override fun onStateChanged(
                bottomSheet: View,
                newState: Int,
            ) {
                if (newState == FormSheetBehavior.STATE_HIDDEN) {
                    dialog?.cancel()
                    return
                }
                when (newState) {
                    FormSheetBehavior.STATE_DRAGGING -> {
                        stateBeforeDrag = lastEmittedDetentIndex
                        maxOffsetDuringDrag = Float.MIN_VALUE
                        pendingDismissPreventedEmission = false
                    }
                    FormSheetBehavior.STATE_SETTLING -> Unit
                    else -> {
                        val index = stateToDetentIndex(newState, currentDetentsCount)
                        if (index >= 0 && index != lastEmittedDetentIndex) {
                            lastEmittedDetentIndex = index
                            eventEmitter?.emitOnDetentChanged(index)
                        }
                        maybeMarkDismissAttempt(index)
                        if (index >= 0 && pendingDismissPreventedEmission) {
                            pendingDismissPreventedEmission = false
                            eventEmitter?.emitOnNativeDismissPrevented(FormSheetDismissChannel.DRAG)
                        }
                        if (index == 0) {
                            recoveringPreventedDragDismiss = false
                        }
                    }
                }
                updateSheetSurfaceLayout(bottomSheet)
                updateDimming(bottomSheet)
            }

            override fun onSlide(
                bottomSheet: View,
                slideOffset: Float,
            ) {
                val config = latestConfig
                if (config?.preventsNativeDismiss(FormSheetDismissChannel.DRAG) == true &&
                    config.preventNativeDismissDragFeedback
                ) {
                    maxOffsetDuringDrag = maxOf(maxOffsetDuringDrag, slideOffset)
                }
                updateSheetSurfaceLayout(bottomSheet)
                updateDimming(bottomSheet)
            }
        }

    init {
        sheetContainer.addView(
            sheetContent,
            FrameLayout.LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT,
            ),
        )

        val grabberHeight = dp(4)
        val grabberWidth = dp(32)
        grabber.background =
            GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = grabberHeight / 2f
                setColor(Color.argb(90, 80, 80, 80))
            }
        sheetContainer.addView(
            grabber,
            FrameLayout.LayoutParams(grabberWidth, grabberHeight, Gravity.TOP or Gravity.CENTER_HORIZONTAL).apply {
                topMargin = dp(8)
            },
        )

    }

    internal fun setEventEmitter(eventEmitter: FormSheetEventEmitter) {
        this.eventEmitter = eventEmitter
    }

    internal fun setLynxRootUi(rootUi: UIGroup<*>) {
        lynxRootUi = rootUi
    }

    internal fun applyConfig(config: FormSheetConfig) {
        latestConfig = config

        val requestedOpen = !previousRequestedOpen && config.isOpen
        previousRequestedOpen = config.isOpen
        if (requestedOpen || !config.isOpen) {
            nativeDismissedForCurrentRequest = false
        }

        when {
            dismissAnimationRunning -> {
                if (requestedOpen && isPresented) {
                    cancelDismissAndPresent(config)
                }
            }
            config.isOpen && !isPresented && !nativeDismissedForCurrentRequest && isAttachedToWindow -> present(config)
            !config.isOpen && isPresented -> dismissProgrammatically()
            config.isOpen && isPresented -> configurePresentedSheet(config, applyInitialDetent = false)
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        latestConfig?.let(::applyConfig)
    }

    override fun onDetachedFromWindow() {
        if (dismissAnimationRunning && nativeDismissEventEmitted) {
            super.onDetachedFromWindow()
            return
        }
        suppressDismissEvents = true
        dialog?.dismiss()
        dismissAnimator?.cancel()
        dismissAnimator = null
        dialog = null
        sheetBehavior = null
        presentationTargetDetentIndex = null
        isPresented = false
        suppressDismissEvents = false
        super.onDetachedFromWindow()
    }

    override fun onMeasure(
        widthMeasureSpec: Int,
        heightMeasureSpec: Int,
    ) {
        setMeasuredDimension(
            MeasureSpec.getSize(widthMeasureSpec),
            MeasureSpec.getSize(heightMeasureSpec),
        )
    }

    override fun onLayout(
        changed: Boolean,
        left: Int,
        top: Int,
        right: Int,
        bottom: Int,
    ) = Unit

    private fun present(config: FormSheetConfig) {
        val newDialog =
            object : BottomSheetDialog(context) {
                override fun cancel() {
                    val behavior = sheetBehavior
                    if (dialog === this &&
                        isPresented &&
                        behavior?.state == FormSheetBehavior.STATE_HIDDEN &&
                        latestConfig?.preventsNativeDismiss(FormSheetDismissChannel.DRAG) == true
                    ) {
                        recoverPreventedDragDismiss(behavior)
                        return
                    }
                    super.cancel()
                }
            }
        dialog = newDialog
        hasEmittedWillDisappear = false
        lastEmittedDetentIndex = -1
        defaultBottomSheetBackground = null
        recoveringPreventedDragDismiss = false
        presentationAnimationPending = true
        presentationAnimationRunning = false
        dismissAnimationRunning = false
        pendingBackdropAlpha = 0f
        presentationTargetDetentIndex = null
        hasEmittedDidAppear = false
        nativeDismissEventEmitted = false
        programmaticDismissPending = false
        dismissAnimator = null

        (sheetContainer.parent as? ViewGroup)?.removeView(sheetContainer)
        newDialog.setContentView(sheetContainer)
        val bottomSheet =
            newDialog.findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)
                ?: run {
                    dialog = null
                    return
                }
        val layoutParams = bottomSheet.layoutParams as CoordinatorLayout.LayoutParams
        sheetBehavior = FormSheetBehavior<FrameLayout>().also { layoutParams.behavior = it }
        bottomSheet.layoutParams = layoutParams
        // Material couples cancelable, outside taps, back and drag-to-hide. Keep
        // its user cancellation disabled and route each channel explicitly.
        newDialog.setCancelable(false)
        newDialog.setCanceledOnTouchOutside(false)
        newDialog.window?.let(::configureDialogWindow)
        installBackdrop(newDialog)
        bottomSheet.translationY = resources.displayMetrics.heightPixels.toFloat()
        newDialog.setOnCancelListener {
            nativeDismissedForCurrentRequest = true
            if (!suppressDismissEvents && !nativeDismissEventEmitted) {
                eventEmitter?.emitOnNativeDismiss()
            }
            emitOnWillDisappearIfNeeded()
        }
        newDialog.setOnDismissListener {
            if (dialog !== newDialog || !isPresented) {
                return@setOnDismissListener
            }
            emitOnWillDisappearIfNeeded()
            isPresented = false
            val emitProgrammaticDismiss = programmaticDismissPending
            programmaticDismissPending = false
            if (dialog === newDialog) {
                dialog = null
                sheetBehavior = null
                presentationAnimationPending = false
                presentationAnimationRunning = false
                presentationTargetDetentIndex = null
                dismissAnimationRunning = false
                dismissAnimator?.cancel()
                dismissAnimator = null
            }
            eventEmitter?.emitOnDidDisappear()
            if (emitProgrammaticDismiss && !suppressDismissEvents) {
                eventEmitter?.emitOnDismiss()
            }
        }
        newDialog.setOnKeyListener { _, keyCode, keyEvent ->
            if (keyCode != KeyEvent.KEYCODE_BACK || keyEvent.action != KeyEvent.ACTION_UP) {
                false
            } else {
                requestNativeDismiss(FormSheetDismissChannel.BACK, newDialog)
                true
            }
        }

        eventEmitter?.emitOnWillAppear()
        val currentConfig = latestConfig ?: config
        if (!currentConfig.isOpen) {
            dialog = null
            sheetBehavior = null
            return
        }
        configurePresentedSheet(currentConfig, applyInitialDetent = true)
        isPresented = true
        newDialog.show()
        newDialog.window?.let(::configureDialogWindow)
        installWindowInsetsListener(newDialog)
        newDialog.window?.decorView?.post {
            if (dialog === newDialog && isPresented) {
                if (latestConfig?.isOpen == true && !dismissAnimationRunning) {
                    startPresentationAnimation(newDialog)
                }
            }
        }
    }

    private fun dismissProgrammatically() {
        dialog?.let { dismissWithAnimation(it, isNativeDismiss = false) }
    }

    private fun configurePresentedSheet(
        config: FormSheetConfig,
        applyInitialDetent: Boolean,
    ) {
        val currentDialog = dialog ?: return
        val bottomSheet =
            currentDialog.findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)
                ?: return
        val windowHeight = currentDialog.window?.decorView?.height?.takeIf { it > 0 }
            ?: resources.displayMetrics.heightPixels
        val geometry =
            config.detents.resolveGeometry(
                windowHeight = windowHeight,
            )
        val sheetDetentHeights = geometry.sheetHeights
        currentDetentHeights = sheetDetentHeights

        grabber.visibility = if (config.prefersGrabberVisible) View.VISIBLE else View.GONE
        applyAppearance(bottomSheet, config)

        val behavior = sheetBehavior ?: return
        currentDialog.setCancelable(false)
        currentDialog.setCanceledOnTouchOutside(false)
        behavior.isHideable =
            !config.preventsNativeDismiss(FormSheetDismissChannel.DRAG) ||
            !config.preventNativeDismissDragFeedback
        behavior.setCallback(bottomSheetCallback)
        currentDetentsCount = config.detents.count

        if (config.detents.isFitToContents) {
            if (presentationAnimationPending || presentationAnimationRunning) {
                presentationTargetDetentIndex = 0
            }
            bottomSheet.layoutParams.height = LayoutParams.WRAP_CONTENT
            sheetContainer.layoutParams.height = LayoutParams.WRAP_CONTENT
            sheetContent.layoutParams.height = LayoutParams.WRAP_CONTENT
            behavior.setDetents(emptyList(), fitToContents = true)
            behavior.state = FormSheetBehavior.STATE_EXPANDED
            lastEmittedDetentIndex = 0
            updateDimming(bottomSheet)
            requestSheetLayoutUpdate(bottomSheet)
            return
        }

        val largestSheetHeight = sheetDetentHeights.last().coerceAtLeast(1)
        bottomSheet.layoutParams.height = largestSheetHeight
        sheetContainer.layoutParams.height = largestSheetHeight
        sheetContent.layoutParams.height = LayoutParams.MATCH_PARENT
        behavior.setDetents(sheetDetentHeights, fitToContents = false)
        val requestedIndex = requestedDetentIndex(config, applyInitialDetent)
        val targetIndex =
            requestedIndex?.let {
                (if (it == -1) config.detents.count - 1 else it).coerceIn(0, config.detents.count - 1)
            }
        if (presentationAnimationPending || presentationAnimationRunning) {
            presentationTargetDetentIndex = targetIndex
        }
        if (config.detents.count == 1) {
            if (presentationAnimationPending || presentationAnimationRunning) {
                presentationTargetDetentIndex = 0
            }
            behavior.state = FormSheetBehavior.STATE_EXPANDED
        } else {
            requestedIndex?.let {
                behavior.state = stateForIndex(it, config.detents.count)
            }
        }
        val appliedIndex = stateToDetentIndex(behavior.state, config.detents.count)
        if (appliedIndex >= 0) {
            lastEmittedDetentIndex = appliedIndex
        }
        updateDimming(bottomSheet)
        bottomSheet.requestLayout()
        requestSheetLayoutUpdate(bottomSheet)
    }

    private fun updateDimming(bottomSheet: View) {
        val currentDialog = dialog ?: return
        val backdrop =
            currentDialog.findViewById<View>(com.google.android.material.R.id.touch_outside)
                ?: return
        val window = currentDialog.window ?: return
        val visibleHeight =
            resolveFormSheetDimHeight(
                visibleSheetHeight = visibleSheetHeight(bottomSheet, window.decorView.height),
                detentHeights = currentDetentHeights,
                presentationTargetDetentIndex = presentationTargetDetentIndex,
            )
        val dimAmount =
            calculateFormSheetDimAmount(
                visibleSheetHeight = visibleHeight,
                detentHeights = currentDetentHeights,
                largestUndimmedDetentIndex = latestConfig?.largestUndimmedDetentIndex ?: -1,
                maximumDimAmount = DEFAULT_DIM_AMOUNT,
            )

        if (presentationAnimationPending || presentationAnimationRunning) {
            val targetChanged = abs(pendingBackdropAlpha - dimAmount) > DIM_AMOUNT_EPSILON
            pendingBackdropAlpha = dimAmount
            if (presentationAnimationRunning && targetChanged) {
                val elapsed = android.os.SystemClock.uptimeMillis() - presentationAnimationStartedAt
                val remaining = (SHEET_ANIMATION_DURATION_MS - elapsed).coerceAtLeast(0L)
                backdrop.animate()
                    .alpha(dimAmount)
                    .setDuration(remaining)
                    .setInterpolator(SHEET_ANIMATION_INTERPOLATOR)
                    .start()
            }
            return
        }
        if (dismissAnimationRunning) {
            return
        }
        if (abs(backdrop.alpha - dimAmount) > DIM_AMOUNT_EPSILON) {
            backdrop.alpha = dimAmount
        }
    }

    private fun applyAppearance(
        bottomSheet: FrameLayout,
        config: FormSheetConfig,
    ) {
        if (defaultBottomSheetBackground == null) {
            defaultBottomSheetBackground = bottomSheet.background
        }
        val backgroundColor = config.nativeContainerBackgroundColor ?: Color.TRANSPARENT
        sheetContainer.setBackgroundColor(Color.TRANSPARENT)
        sheetContent.setBackgroundColor(backgroundColor)
        bottomSheet.backgroundTintList = ColorStateList.valueOf(Color.TRANSPARENT)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && config.preferredCornerRadius >= 0) {
            val cornerRadius = config.preferredCornerRadius * resources.displayMetrics.density
            bottomSheet.background =
                GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    cornerRadii =
                        floatArrayOf(
                            cornerRadius,
                            cornerRadius,
                            cornerRadius,
                            cornerRadius,
                            0f,
                            0f,
                            0f,
                            0f,
                        )
                    setColor(Color.TRANSPARENT)
                }
            bottomSheet.clipToOutline = true
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            bottomSheet.background = defaultBottomSheetBackground
            bottomSheet.clipToOutline = false
        }
    }

    private fun stateForIndex(
        rawIndex: Int,
        count: Int,
    ): Int {
        val index = (if (rawIndex == -1) count - 1 else rawIndex).coerceIn(0, count - 1)
        return when (count) {
            2 -> if (index == 0) FormSheetBehavior.STATE_COLLAPSED else FormSheetBehavior.STATE_EXPANDED
            3 ->
                when (index) {
                    0 -> FormSheetBehavior.STATE_COLLAPSED
                    1 -> FormSheetBehavior.STATE_HALF_EXPANDED
                    else -> FormSheetBehavior.STATE_EXPANDED
                }
            else -> FormSheetBehavior.STATE_EXPANDED
        }
    }

    private fun requestedDetentIndex(
        config: FormSheetConfig,
        applyInitialDetent: Boolean,
    ): Int? =
        when {
            config.selectedDetentIndex >= -1 -> config.selectedDetentIndex
            applyInitialDetent -> config.initialDetentIndex
            else -> null
        }

    private fun stateToDetentIndex(
        state: Int,
        count: Int,
    ): Int =
        when (count) {
            1 ->
                if (state == FormSheetBehavior.STATE_EXPANDED || state == FormSheetBehavior.STATE_COLLAPSED) {
                    0
                } else {
                    -1
                }
            2 ->
                when (state) {
                    FormSheetBehavior.STATE_COLLAPSED -> 0
                    FormSheetBehavior.STATE_EXPANDED -> 1
                    else -> -1
                }
            3 ->
                when (state) {
                    FormSheetBehavior.STATE_COLLAPSED -> 0
                    FormSheetBehavior.STATE_HALF_EXPANDED -> 1
                    FormSheetBehavior.STATE_EXPANDED -> 2
                    else -> -1
                }
            else -> -1
        }

    private fun emitOnWillDisappearIfNeeded() {
        if (!hasEmittedWillDisappear) {
            hasEmittedWillDisappear = true
            eventEmitter?.emitOnWillDisappear()
        }
    }

    /**
     * A downward drag that starts at the lowest detent and settles back at the
     * lowest detent (without having been dragged upward first) is treated as a
     * native dismiss attempt. With `isHideable = false` the sheet cannot drop
     * below its lowest detent, so this is the only reliable signal.
     */
    private fun maybeMarkDismissAttempt(settledIndex: Int) {
        val config = latestConfig
        if (config?.preventsNativeDismiss(FormSheetDismissChannel.DRAG) != true ||
            !config.preventNativeDismissDragFeedback ||
            pendingDismissPreventedEmission
        ) {
            return
        }
        val lowestIndex = 0
        if (stateBeforeDrag != lowestIndex || settledIndex != lowestIndex) {
            return
        }
        if (maxDownwardDismissDragDistance <= dismissDragDistanceThreshold) {
            return
        }
        val lowestOffset = lowestDetentOffset()
        if (maxOffsetDuringDrag > lowestOffset + DISMISS_ATTEMPT_OFFSET_THRESHOLD) {
            return
        }
        pendingDismissPreventedEmission = true
    }

    private fun requestNativeDismiss(
        channel: FormSheetDismissChannel,
        sourceDialog: BottomSheetDialog,
    ) {
        if (dialog !== sourceDialog || !isPresented) {
            return
        }
        if (latestConfig?.preventsNativeDismiss(channel) == true) {
            eventEmitter?.emitOnNativeDismissPrevented(channel)
        } else {
            dismissWithAnimation(sourceDialog, isNativeDismiss = true)
        }
    }

    @Suppress("DEPRECATION")
    private fun configureDialogWindow(window: Window) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN)
        window.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }
        val attributes = window.attributes
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            attributes.setFitInsetsTypes(0)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            attributes.layoutInDisplayCutoutMode =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                } else {
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
                }
        }
        attributes.windowAnimations = 0
        window.attributes = attributes
    }

    private fun startPresentationAnimation(
        sourceDialog: BottomSheetDialog,
        startOffscreen: Boolean = true,
    ) {
        val bottomSheet =
            sourceDialog.findViewById<View>(com.google.android.material.R.id.design_bottom_sheet)
                ?: return finishPresentationWithoutAnimation(sourceDialog)
        val backdrop =
            sourceDialog.findViewById<View>(com.google.android.material.R.id.touch_outside)
                ?: return finishPresentationWithoutAnimation(sourceDialog)
        val parentHeight = (bottomSheet.parent as? View)?.height?.takeIf { it > 0 }
            ?: sourceDialog.window?.decorView?.height?.takeIf { it > 0 }
            ?: resources.displayMetrics.heightPixels

        bottomSheet.animate().cancel()
        backdrop.animate().cancel()
        if (startOffscreen) {
            bottomSheet.translationY = (parentHeight - bottomSheet.top).coerceAtLeast(0).toFloat()
            backdrop.alpha = 0f
        }
        presentationAnimationPending = false
        presentationAnimationRunning = true
        presentationAnimationStartedAt = android.os.SystemClock.uptimeMillis()

        backdrop.animate()
            .alpha(pendingBackdropAlpha)
            .setDuration(SHEET_ANIMATION_DURATION_MS)
            .setInterpolator(SHEET_ANIMATION_INTERPOLATOR)
            .start()
        bottomSheet.animate()
            .translationY(0f)
            .setDuration(SHEET_ANIMATION_DURATION_MS)
            .setInterpolator(SHEET_ANIMATION_INTERPOLATOR)
            .withEndAction {
                if (dialog === sourceDialog && isPresented && !dismissAnimationRunning) {
                    presentationAnimationRunning = false
                    presentationTargetDetentIndex = null
                    backdrop.animate().cancel()
                    backdrop.alpha = pendingBackdropAlpha
                    emitOnDidAppearIfNeeded()
                }
            }
            .start()
    }

    private fun finishPresentationWithoutAnimation(sourceDialog: BottomSheetDialog) {
        presentationAnimationPending = false
        presentationAnimationRunning = false
        presentationTargetDetentIndex = null
        if (dialog === sourceDialog && isPresented) {
            emitOnDidAppearIfNeeded()
        }
    }

    private fun emitOnDidAppearIfNeeded() {
        if (!hasEmittedDidAppear && latestConfig?.isOpen == true) {
            hasEmittedDidAppear = true
            eventEmitter?.emitOnDidAppear()
        }
    }

    private fun dismissWithAnimation(
        sourceDialog: BottomSheetDialog,
        isNativeDismiss: Boolean,
    ) {
        if (dialog !== sourceDialog || !isPresented || dismissAnimationRunning) {
            return
        }
        dismissAnimationRunning = true
        presentationAnimationPending = false
        presentationAnimationRunning = false
        presentationTargetDetentIndex = null
        if (isNativeDismiss) {
            nativeDismissedForCurrentRequest = true
        }
        programmaticDismissPending = !isNativeDismiss
        if (!dismissAnimationRunning || dialog !== sourceDialog || !isPresented) {
            return
        }
        emitOnWillDisappearIfNeeded()
        if (!dismissAnimationRunning || dialog !== sourceDialog || !isPresented) {
            return
        }

        val bottomSheet =
            sourceDialog.findViewById<View>(com.google.android.material.R.id.design_bottom_sheet)
        val backdrop = sourceDialog.findViewById<View>(com.google.android.material.R.id.touch_outside)
        if (bottomSheet == null || backdrop == null) {
            emitNativeDismissEventIfNeeded(isNativeDismiss)
            sourceDialog.dismiss()
            return
        }
        val parentHeight = (bottomSheet.parent as? View)?.height?.takeIf { it > 0 }
            ?: sourceDialog.window?.decorView?.height?.takeIf { it > 0 }
            ?: resources.displayMetrics.heightPixels

        bottomSheet.animate().cancel()
        backdrop.animate().cancel()
        val startVisualTop = bottomSheet.top + bottomSheet.translationY
        val startBackdropAlpha = backdrop.alpha
        dismissAnimator =
            ValueAnimator.ofFloat(0f, 1f).apply {
                duration = SHEET_ANIMATION_DURATION_MS
                interpolator = SHEET_ANIMATION_INTERPOLATOR
                addUpdateListener { animator ->
                    val progress = animator.animatedValue as Float
                    val visualTop = startVisualTop + (parentHeight - startVisualTop) * progress
                    bottomSheet.translationY = visualTop - bottomSheet.top
                    backdrop.alpha = startBackdropAlpha * (1f - progress)
                }
                addListener(
                    object : AnimatorListenerAdapter() {
                        private var wasCancelled = false

                        override fun onAnimationCancel(animation: Animator) {
                            wasCancelled = true
                        }

                        override fun onAnimationEnd(animation: Animator) {
                            if (!wasCancelled &&
                                dialog === sourceDialog &&
                                isPresented &&
                                dismissAnimationRunning
                            ) {
                                emitNativeDismissEventIfNeeded(isNativeDismiss)
                                sourceDialog.dismiss()
                            }
                        }
                    },
                )
                start()
            }
    }

    private fun emitNativeDismissEventIfNeeded(isNativeDismiss: Boolean) {
        if (isNativeDismiss && !nativeDismissEventEmitted) {
            nativeDismissEventEmitted = true
            if (!suppressDismissEvents) {
                eventEmitter?.emitOnNativeDismiss()
            }
        }
    }

    private fun cancelDismissAndPresent(config: FormSheetConfig) {
        val sourceDialog = dialog ?: return
        val bottomSheet =
            sourceDialog.findViewById<View>(com.google.android.material.R.id.design_bottom_sheet)
                ?: return
        val visualTop = bottomSheet.top + bottomSheet.translationY

        dismissAnimator?.cancel()
        dismissAnimator = null
        dismissAnimationRunning = false
        nativeDismissedForCurrentRequest = false
        nativeDismissEventEmitted = false
        programmaticDismissPending = false
        hasEmittedWillDisappear = false
        presentationAnimationPending = true
        configurePresentedSheet(config, applyInitialDetent = false)
        bottomSheet.translationY = visualTop - bottomSheet.top
        startPresentationAnimation(sourceDialog, startOffscreen = false)
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun installBackdrop(sourceDialog: BottomSheetDialog) {
        val touchOutside =
            sourceDialog.findViewById<View>(com.google.android.material.R.id.touch_outside)
                ?: return
        touchOutside.setBackgroundColor(Color.BLACK)
        touchOutside.alpha = 0f
        var startedOutsideSheet = false
        val detector =
            GestureDetector(
                context,
                object : GestureDetector.SimpleOnGestureListener() {
                    override fun onDown(event: MotionEvent): Boolean {
                        startedOutsideSheet = isOutsideSheet(sourceDialog, event)
                        return startedOutsideSheet
                    }

                    override fun onSingleTapUp(event: MotionEvent): Boolean {
                        if (!startedOutsideSheet || !isOutsideSheet(sourceDialog, event)) {
                            return false
                        }
                        requestNativeDismiss(FormSheetDismissChannel.BACKDROP, sourceDialog)
                        return true
                    }
                },
            )

        touchOutside.setOnClickListener(null)
        touchOutside.setOnTouchListener { _, event ->
            detector.onTouchEvent(event)
            true
        }
    }

    private fun isOutsideSheet(
        sourceDialog: BottomSheetDialog,
        event: MotionEvent,
    ): Boolean {
        val bottomSheet =
            sourceDialog.findViewById<View>(com.google.android.material.R.id.design_bottom_sheet)
                ?: return false
        val bounds = Rect()
        if (!bottomSheet.getGlobalVisibleRect(bounds)) {
            return false
        }
        return !bounds.contains(event.rawX.toInt(), event.rawY.toInt())
    }

    private fun recoverPreventedDragDismiss(behavior: FormSheetBehavior<*>) {
        if (recoveringPreventedDragDismiss) {
            return
        }
        recoveringPreventedDragDismiss = true
        eventEmitter?.emitOnNativeDismissPrevented(FormSheetDismissChannel.DRAG)
        behavior.state = stateForIndex(0, currentDetentsCount)
    }

    private fun requestSheetLayoutUpdate(bottomSheet: View) {
        dialog?.window?.decorView?.let(ViewCompat::requestApplyInsets)
        bottomSheet.post {
            if (bottomSheet === currentBottomSheet()) {
                updateSheetSurfaceLayout(bottomSheet)
                updateDimming(bottomSheet)
            }
        }
    }

    private fun currentBottomSheet(): FrameLayout? =
        dialog?.findViewById(com.google.android.material.R.id.design_bottom_sheet)

    private fun installWindowInsetsListener(sourceDialog: BottomSheetDialog) {
        val decorView = sourceDialog.window?.decorView ?: return
        val bottomSheet = sourceDialog.findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)
        val coordinator = bottomSheet?.parent as? View
        val container = coordinator?.parent as? View
        val clearMaterialSystemBarInsets = {
            container?.fitsSystemWindows = false
            coordinator?.fitsSystemWindows = false
            bottomSheet?.fitsSystemWindows = false
            container?.setPadding(0, 0, 0, 0)
            coordinator?.setPadding(0, 0, 0, 0)
            bottomSheet?.setPadding(0, 0, 0, 0)
            container?.requestLayout()
        }

        // BottomSheetDialog configures these ancestors before show(). Disable
        // fitsSystemWindows and remove the padding it already applied.
        clearMaterialSystemBarInsets()
        ViewCompat.setOnApplyWindowInsetsListener(decorView) { _, insets ->
            if (dialog === sourceDialog) {
                clearMaterialSystemBarInsets()
                updateSheetSurfaceLayout(bottomSheet)
                decorView.post {
                    if (dialog === sourceDialog) {
                        // Child listeners run after the decor listener and may
                        // reapply Material's inset padding during this dispatch.
                        clearMaterialSystemBarInsets()
                        updateSheetSurfaceLayout(bottomSheet)
                    }
                }
            }
            insets
        }
        ViewCompat.requestApplyInsets(decorView)
    }

    private fun trackPotentialDismissDrag(event: MotionEvent) {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                dismissDragStartRawY = event.rawY
                maxDownwardDismissDragDistance = 0f
            }
            MotionEvent.ACTION_MOVE,
            MotionEvent.ACTION_UP,
            MotionEvent.ACTION_CANCEL,
            -> {
                if (!dismissDragStartRawY.isNaN()) {
                    maxDownwardDismissDragDistance =
                        maxOf(maxDownwardDismissDragDistance, event.rawY - dismissDragStartRawY)
                }
            }
        }
    }

    private fun updateSheetSurfaceLayout(bottomSheet: View?) {
        if (latestConfig?.detents?.isFitToContents == true && bottomSheet != null && bottomSheet.height > 0) {
            currentDetentHeights = listOf(bottomSheet.height)
        }

        // Material can apply system-bar padding to the internal sheet through
        // theme flags. Insets belong exclusively to the content host here.
        if (bottomSheet != null &&
            (bottomSheet.paddingLeft != 0 ||
                bottomSheet.paddingTop != 0 ||
                bottomSheet.paddingRight != 0 ||
                bottomSheet.paddingBottom != 0)
        ) {
            bottomSheet.setPadding(0, 0, 0, 0)
        }

        val containerLayoutParams = sheetContainer.layoutParams as FrameLayout.LayoutParams
        val containerHeight =
            if (latestConfig?.detents?.isFitToContents == false && bottomSheet != null) {
                val parentHeight = (bottomSheet.parent as? View)?.height ?: 0
                visibleSheetSurfaceHeight(
                    parentHeight = parentHeight,
                    sheetTop = bottomSheet.top,
                    maximumHeight = bottomSheet.height,
                )
            } else {
                containerLayoutParams.height
            }
        if (containerLayoutParams.height != containerHeight ||
            containerLayoutParams.leftMargin != 0 ||
            containerLayoutParams.rightMargin != 0 ||
            containerLayoutParams.bottomMargin != 0
        ) {
            containerLayoutParams.height = containerHeight
            containerLayoutParams.leftMargin = 0
            containerLayoutParams.rightMargin = 0
            containerLayoutParams.bottomMargin = 0
            sheetContainer.layoutParams = containerLayoutParams
        }

        val grabberLayoutParams = grabber.layoutParams as FrameLayout.LayoutParams
        if (grabberLayoutParams.topMargin != dp(8)) {
            grabberLayoutParams.topMargin = dp(8)
            grabber.layoutParams = grabberLayoutParams
        }
    }

    private fun visibleSheetHeight(
        bottomSheet: View,
        fallbackParentHeight: Int,
    ): Int {
        val parentHeight = (bottomSheet.parent as? View)?.height?.takeIf { it > 0 }
            ?: fallbackParentHeight
        return (parentHeight - bottomSheet.top).coerceAtLeast(0)
    }

    private fun lowestDetentOffset(): Float =
        when (currentDetentsCount) {
            // With a single detent the sheet rests at the expanded (top) position.
            1 -> 1f
            else -> 0f
        }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).roundToInt()

    private companion object {
        val SHEET_ANIMATION_INTERPOLATOR = AccelerateDecelerateInterpolator()
        const val SHEET_ANIMATION_DURATION_MS = 300L
        const val DEFAULT_DIM_AMOUNT = 0.5f
        const val DIM_AMOUNT_EPSILON = 0.001f
        const val DISMISS_ATTEMPT_OFFSET_THRESHOLD = 0.1f
    }

    private class SheetContentView(
        context: LynxContext,
        transfer: BaseUITransfer<*>,
    ) : BaseUITransfer.BaseTransferContentView(context, transfer) {
        override fun onMeasure(
            widthMeasureSpec: Int,
            heightMeasureSpec: Int,
        ) {
            // Propagate the sheet constraints to the transfer ShadowNode and remeasure the Lynx subtree.
            super.onMeasure(widthMeasureSpec, heightMeasureSpec)
            val contentWidth = (0 until childCount).maxOfOrNull { getChildAt(it).right } ?: 0
            val contentHeight = (0 until childCount).maxOfOrNull { getChildAt(it).bottom } ?: 0
            setMeasuredDimension(
                resolveSize(contentWidth, widthMeasureSpec),
                resolveSize(contentHeight, heightMeasureSpec),
            )
        }

    }
}

package com.lynxscreens.screens.formsheet

import android.content.Context
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.view.ViewCompat
import androidx.customview.widget.ViewDragHelper
import java.lang.ref.WeakReference
import kotlin.math.abs

internal class FormSheetBehavior<V : View> : CoordinatorLayout.Behavior<V> {
    internal abstract class Callback {
        abstract fun onStateChanged(
            bottomSheet: View,
            newState: Int,
        )

        abstract fun onSlide(
            bottomSheet: View,
            slideOffset: Float,
        )
    }

    constructor() : super()

    constructor(
        context: Context,
        attrs: AttributeSet?,
    ) : super(context, attrs)

    private var viewRef: WeakReference<V>? = null
    private var nestedScrollingChildRef: WeakReference<View>? = null
    private var viewDragHelper: ViewDragHelper? = null
    private var callback: Callback? = null
    private var parentHeight = 0
    private var sheetHeight = 0
    private var detentHeights: List<Int> = emptyList()
    private var anchorTops: List<Int> = emptyList()
    private var fitToContents = false
    private var activePointerId = ViewDragHelper.INVALID_POINTER
    private var initialY = 0
    private var touchingScrollingChild = false
    private var ignoreEvents = false
    private var nestedScrolled = false
    private var nestedFlingHandled = false
    private var minimumVelocity = 0f
    private var maximumVelocity = 0f
    private var internalState = STATE_COLLAPSED
    private var settleGeneration = 0
    private var settlingTargetState: Int? = null

    var isHideable: Boolean = false
        set(value) {
            field = value
            if (!value && (settlingTargetState == STATE_HIDDEN || internalState == STATE_HIDDEN)) {
                viewRef?.get()?.let { settleToState(it, stateForTop(collapsedTop())) }
            }
        }

    var state: Int
        get() = internalState
        set(value) {
            require(value in STABLE_STATES) { "Invalid FormSheet state: $value" }
            val child = viewRef?.get()
            if (child == null || !child.isLaidOut) {
                internalState = value
                return
            }
            settleToState(child, normalizeState(value))
        }

    fun setCallback(callback: Callback) {
        this.callback = callback
    }

    fun setDetents(
        detentHeights: List<Int>,
        fitToContents: Boolean,
    ) {
        this.detentHeights = detentHeights
        this.fitToContents = fitToContents
        if (parentHeight > 0) {
            anchorTops =
                resolveFormSheetAnchorTops(
                    parentHeight = parentHeight,
                    sheetHeight = sheetHeight,
                    detentHeights = detentHeights,
                    fitToContents = fitToContents,
                )
        }
        viewRef?.get()?.requestLayout()
    }

    override fun onLayoutChild(
        parent: CoordinatorLayout,
        child: V,
        layoutDirection: Int,
    ): Boolean {
        val savedTop = child.top
        val previousAnchorTops = anchorTops
        parent.onLayoutChild(child, layoutDirection)
        parentHeight = parent.height
        sheetHeight = child.height
        anchorTops =
            resolveFormSheetAnchorTops(
                parentHeight = parentHeight,
                sheetHeight = sheetHeight,
                detentHeights = detentHeights,
                fitToContents = fitToContents,
            )
        if (anchorTops.isEmpty()) {
            anchorTops = listOf((parentHeight - sheetHeight).coerceAtLeast(0))
        }
        viewRef = WeakReference(child)
        nestedScrollingChildRef = WeakReference(findScrollingChild(child))
        if (viewDragHelper == null) {
            viewDragHelper = ViewDragHelper.create(parent, dragCallback)
            ViewConfiguration.get(parent.context).let { configuration ->
                minimumVelocity = configuration.scaledMinimumFlingVelocity.toFloat()
                maximumVelocity = configuration.scaledMaximumFlingVelocity.toFloat()
            }
        }

        val anchorsChanged = previousAnchorTops != anchorTops
        val normalizedState = normalizeState(internalState)
        var completedRelayoutState: Int? = null
        val targetTop =
            when (internalState) {
                STATE_DRAGGING,
                -> savedTop.coerceIn(expandedTop(), maximumDragTop())
                STATE_SETTLING -> {
                    val targetState = settlingTargetState?.let(::normalizeState)
                    if (anchorsChanged && targetState != null) {
                        settleGeneration++
                        viewDragHelper?.abort()
                        settlingTargetState = null
                        completedRelayoutState = targetState
                        topForState(targetState)
                    } else {
                        savedTop.coerceIn(expandedTop(), maximumDragTop())
                    }
                }
                STATE_HIDDEN -> parentHeight
                else -> {
                    if (normalizedState != internalState) {
                        setStateInternal(normalizedState)
                    }
                    topForState(normalizedState)
                }
            }
        ViewCompat.offsetTopAndBottom(child, targetTop - child.top)
        completedRelayoutState?.let { completedState ->
            dispatchOnSlide(child, targetTop)
            setStateInternal(completedState)
        }
        return true
    }

    override fun onInterceptTouchEvent(
        parent: CoordinatorLayout,
        child: V,
        event: MotionEvent,
    ): Boolean {
        if (!child.isShown) {
            ignoreEvents = true
            return false
        }
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                resetTouch()
                initialY = event.y.toInt()
                findScrollingChildUnder(child, event.rawX.toInt(), event.rawY.toInt())?.let {
                    nestedScrollingChildRef = WeakReference(it)
                }
                val touchedScrollingChild = nestedScrollingChildRef?.get()
                touchingScrollingChild =
                    touchedScrollingChild != null &&
                    isPointInside(touchedScrollingChild, event.rawX.toInt(), event.rawY.toInt())
                if (touchingScrollingChild) {
                    activePointerId = event.getPointerId(event.actionIndex)
                }
                ignoreEvents = !parent.isPointInChildBounds(child, event.x.toInt(), event.y.toInt())
            }
            MotionEvent.ACTION_UP,
            MotionEvent.ACTION_CANCEL,
            -> {
                touchingScrollingChild = false
                activePointerId = ViewDragHelper.INVALID_POINTER
                if (ignoreEvents) {
                    ignoreEvents = false
                    return false
                }
            }
        }
        if (!ignoreEvents && viewDragHelper?.shouldInterceptTouchEvent(event) == true) {
            return true
        }
        val scrollingChild = nestedScrollingChildRef?.get()
        return event.actionMasked == MotionEvent.ACTION_MOVE &&
            !ignoreEvents &&
            scrollingChild != null &&
            !parent.isPointInChildBounds(scrollingChild, event.x.toInt(), event.y.toInt()) &&
            abs(event.y - initialY) > (viewDragHelper?.touchSlop ?: 0)
    }

    override fun onTouchEvent(
        parent: CoordinatorLayout,
        child: V,
        event: MotionEvent,
    ): Boolean {
        if (!child.isShown || ignoreEvents) {
            return false
        }
        viewDragHelper?.processTouchEvent(event)
        return true
    }

    override fun onStartNestedScroll(
        coordinatorLayout: CoordinatorLayout,
        child: V,
        directTargetChild: View,
        target: View,
        axes: Int,
        type: Int,
    ): Boolean {
        nestedScrolled = false
        nestedFlingHandled = false
        nestedScrollingChildRef = WeakReference(target)
        return axes and ViewCompat.SCROLL_AXIS_VERTICAL != 0
    }

    override fun onNestedPreScroll(
        coordinatorLayout: CoordinatorLayout,
        child: V,
        target: View,
        dx: Int,
        dy: Int,
        consumed: IntArray,
        type: Int,
    ) {
        if (type == ViewCompat.TYPE_NON_TOUCH || target !== nestedScrollingChildRef?.get()) {
            return
        }
        val currentTop = child.top
        val nextTop = currentTop - dy
        when {
            dy > 0 && nextTop < expandedTop() -> {
                consumed[1] = currentTop - expandedTop()
                beginDragging()
                moveTo(child, expandedTop())
                setStateInternal(stateForTop(expandedTop()))
            }
            dy > 0 -> {
                consumed[1] = dy
                moveTo(child, nextTop)
                beginDragging()
            }
            dy < 0 && !target.canScrollVertically(-1) -> {
                val clampedTop = nextTop.coerceAtMost(maximumDragTop())
                consumed[1] = currentTop - clampedTop
                moveTo(child, clampedTop)
                beginDragging()
            }
            else -> return
        }
        nestedScrolled = true
    }

    override fun onStopNestedScroll(
        coordinatorLayout: CoordinatorLayout,
        child: V,
        target: View,
        type: Int,
    ) {
        if (nestedFlingHandled) {
            nestedFlingHandled = false
            nestedScrolled = false
            return
        }
        if (!nestedScrolled || target !== nestedScrollingChildRef?.get()) {
            return
        }
        settleAfterRelease(child, verticalVelocity = 0f)
        nestedScrolled = false
    }

    override fun onNestedPreFling(
        coordinatorLayout: CoordinatorLayout,
        child: V,
        target: View,
        velocityX: Float,
        velocityY: Float,
    ): Boolean {
        if (target !== nestedScrollingChildRef?.get() || internalState == stateForTop(expandedTop())) {
            return false
        }
        if (velocityY < 0f && target.canScrollVertically(-1)) {
            return false
        }
        nestedFlingHandled = true
        settleAfterRelease(child, verticalVelocity = -velocityY)
        return true
    }

    private val dragCallback =
        object : ViewDragHelper.Callback() {
            override fun tryCaptureView(
                child: View,
                pointerId: Int,
            ): Boolean {
                if (internalState == STATE_DRAGGING || touchingScrollingChild) {
                    return false
                }
                if (internalState == stateForTop(expandedTop()) && activePointerId == pointerId) {
                    val scrollingChild = nestedScrollingChildRef?.get()
                    if (scrollingChild?.canScrollVertically(-1) == true) {
                        return false
                    }
                }
                return viewRef?.get() === child
            }

            override fun onViewDragStateChanged(state: Int) {
                if (state == ViewDragHelper.STATE_DRAGGING) {
                    beginDragging()
                }
            }

            override fun onViewPositionChanged(
                changedView: View,
                left: Int,
                top: Int,
                dx: Int,
                dy: Int,
            ) {
                dispatchOnSlide(changedView, top)
            }

            override fun onViewReleased(
                releasedChild: View,
                xvel: Float,
                yvel: Float,
            ) {
                @Suppress("UNCHECKED_CAST")
                settleAfterRelease(releasedChild as V, yvel)
            }

            override fun clampViewPositionVertical(
                child: View,
                top: Int,
                dy: Int,
            ): Int = top.coerceIn(expandedTop(), maximumDragTop())

            override fun clampViewPositionHorizontal(
                child: View,
                left: Int,
                dx: Int,
            ): Int = child.left

            override fun getViewVerticalDragRange(child: View): Int = maximumDragTop() - expandedTop()
        }

    private fun settleAfterRelease(
        child: V,
        verticalVelocity: Float,
    ) {
        val shouldHide =
            isHideable &&
                verticalVelocity >= 0f &&
                child.top > collapsedTop() &&
                (child.top + verticalVelocity.coerceAtMost(maximumVelocity) * HIDE_FRICTION) >
                collapsedTop() + (parentHeight - collapsedTop()) * HIDE_THRESHOLD
        val targetState =
            if (shouldHide) {
                STATE_HIDDEN
            } else {
                stateForTop(
                    selectFormSheetAnchorTop(
                        anchorTops = anchorTops,
                        currentTop = child.top,
                        verticalVelocity = verticalVelocity,
                        minimumFlingVelocity = minimumVelocity,
                    ),
                )
            }
        settleToState(child, targetState)
    }

    private fun settleToState(
        child: V,
        targetState: Int,
    ) {
        val generation = ++settleGeneration
        settlingTargetState = targetState
        val targetTop = if (targetState == STATE_HIDDEN) parentHeight else topForState(targetState)
        if (viewDragHelper?.smoothSlideViewTo(child, child.left, targetTop) == true) {
            setStateInternal(STATE_SETTLING)
            child.postOnAnimation(SettleRunnable(child, targetState, generation))
        } else {
            moveTo(child, targetTop)
            settlingTargetState = null
            setStateInternal(targetState)
        }
    }

    private fun moveTo(
        child: V,
        top: Int,
    ) {
        ViewCompat.offsetTopAndBottom(child, top - child.top)
        dispatchOnSlide(child, top)
    }

    private fun setStateInternal(newState: Int) {
        if (internalState == newState) {
            return
        }
        internalState = newState
        viewRef?.get()?.let { callback?.onStateChanged(it, newState) }
    }

    private fun beginDragging() {
        if (internalState != STATE_DRAGGING) {
            settleGeneration++
            settlingTargetState = null
            setStateInternal(STATE_DRAGGING)
        }
    }

    private fun dispatchOnSlide(
        child: View,
        top: Int,
    ) {
        val collapsedTop = collapsedTop()
        val expandedTop = expandedTop()
        val slideOffset =
            when {
                collapsedTop == expandedTop -> 1f
                top <= collapsedTop -> (collapsedTop - top).toFloat() / (collapsedTop - expandedTop)
                parentHeight == collapsedTop -> 0f
                else -> (collapsedTop - top).toFloat() / (parentHeight - collapsedTop)
            }
        callback?.onSlide(child, slideOffset)
    }

    private fun normalizeState(state: Int): Int =
        if (state == STATE_HIDDEN) {
            STATE_HIDDEN
        } else {
            when (anchorTops.size) {
                1 -> STATE_EXPANDED
                2 -> if (state == STATE_COLLAPSED) STATE_COLLAPSED else STATE_EXPANDED
                else -> state
            }
        }

    private fun topForState(state: Int): Int =
        when (state) {
            STATE_COLLAPSED -> anchorTops.last()
            STATE_HALF_EXPANDED -> anchorTops.getOrElse(1) { anchorTops.first() }
            STATE_EXPANDED -> anchorTops.first()
            STATE_HIDDEN -> parentHeight
            else -> error("No stable top for state $state")
        }

    private fun stateForTop(top: Int): Int {
        val index = anchorTops.indexOf(top).coerceAtLeast(0)
        return when (anchorTops.size) {
            1 -> STATE_EXPANDED
            2 -> if (index == 0) STATE_EXPANDED else STATE_COLLAPSED
            else ->
                when (index) {
                    0 -> STATE_EXPANDED
                    1 -> STATE_HALF_EXPANDED
                    else -> STATE_COLLAPSED
                }
        }
    }

    private fun expandedTop(): Int = anchorTops.firstOrNull() ?: 0

    private fun collapsedTop(): Int = anchorTops.lastOrNull() ?: parentHeight

    private fun maximumDragTop(): Int = if (isHideable) parentHeight else collapsedTop()

    private fun resetTouch() {
        activePointerId = ViewDragHelper.INVALID_POINTER
        touchingScrollingChild = false
    }

    private fun findScrollingChild(view: View): View? {
        if (ViewCompat.isNestedScrollingEnabled(view)) {
            return view
        }
        if (view is ViewGroup) {
            for (index in 0 until view.childCount) {
                findScrollingChild(view.getChildAt(index))?.let { return it }
            }
        }
        return null
    }

    private fun findScrollingChildUnder(
        view: View,
        rawX: Int,
        rawY: Int,
    ): View? {
        if (!isPointInside(view, rawX, rawY)) {
            return null
        }
        if (view is ViewGroup) {
            for (index in view.childCount - 1 downTo 0) {
                findScrollingChildUnder(view.getChildAt(index), rawX, rawY)?.let { return it }
            }
        }
        return view.takeIf(ViewCompat::isNestedScrollingEnabled)
    }

    private fun isPointInside(
        view: View,
        rawX: Int,
        rawY: Int,
    ): Boolean {
        val location = IntArray(2)
        view.getLocationOnScreen(location)
        return rawX >= location[0] &&
            rawX < location[0] + view.width &&
            rawY >= location[1] &&
            rawY < location[1] + view.height
    }

    private inner class SettleRunnable(
        private val child: V,
        private val targetState: Int,
        private val generation: Int,
    ) : Runnable {
        override fun run() {
            if (generation != settleGeneration) {
                return
            }
            if (viewDragHelper?.continueSettling(true) == true) {
                child.postOnAnimation(this)
            } else {
                settlingTargetState = null
                setStateInternal(targetState)
            }
        }
    }

    companion object {
        const val STATE_DRAGGING = 1
        const val STATE_SETTLING = 2
        const val STATE_EXPANDED = 3
        const val STATE_COLLAPSED = 4
        const val STATE_HIDDEN = 5
        const val STATE_HALF_EXPANDED = 6
        private const val HIDE_THRESHOLD = 0.5f
        private const val HIDE_FRICTION = 0.1f
        private val STABLE_STATES = setOf(STATE_EXPANDED, STATE_COLLAPSED, STATE_HIDDEN, STATE_HALF_EXPANDED)
    }
}

package com.lynxscreens.screens.formsheet.coordinator

import android.view.View
import android.widget.FrameLayout
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.lynxscreens.screens.formsheet.model.FormSheetDetents

internal class FormSheetBehaviorController(
    sheetView: FrameLayout,
    private val onDetentChanged: ((index: Int) -> Unit)? = null,
) {
    private val behavior = BottomSheetBehavior.from(sheetView)
    private var currentDetentsCount = 1
    private var lastEmittedDetentIndex = UNKNOWN_DETENT_INDEX
    private var lastStableState = BottomSheetBehavior.STATE_COLLAPSED

    private val bottomSheetCallback =
        object : BottomSheetBehavior.BottomSheetCallback() {
            override fun onStateChanged(bottomSheet: View, newState: Int) {
                rememberStateIfStable(newState)
                val index = mapStateToDetentIndex(newState)
                if (index != UNKNOWN_DETENT_INDEX && index != lastEmittedDetentIndex) {
                    lastEmittedDetentIndex = index
                    onDetentChanged?.invoke(index)
                }
            }

            override fun onSlide(bottomSheet: View, slideOffset: Float) = Unit
        }

    init {
        behavior.isHideable = true
        rememberStateIfStable(behavior.state)
    }

    internal fun setup() = behavior.addBottomSheetCallback(bottomSheetCallback)

    internal fun destroy() = behavior.removeBottomSheetCallback(bottomSheetCallback)

    internal fun restoreLastStableState() {
        if (behavior.state == BottomSheetBehavior.STATE_HIDDEN) behavior.state = lastStableState
    }

    private fun rememberStateIfStable(state: Int) {
        if (
            state == BottomSheetBehavior.STATE_EXPANDED ||
            state == BottomSheetBehavior.STATE_COLLAPSED ||
            state == BottomSheetBehavior.STATE_HALF_EXPANDED
        ) {
            lastStableState = state
        }
    }

    internal fun updateSheetBehavior(
        detents: FormSheetDetents,
        sheetAvailableSpace: Int,
        contentHeightForFitToContents: Int = 0,
        nativeContainerPaddingBottom: Int = 0,
        initialDetentIndex: Int = 0,
        applyInitialDetent: Boolean = false,
    ) {
        currentDetentsCount = detents.count
        if (sheetAvailableSpace <= 0) return

        if (detents.isFitToContents) {
            behavior.apply {
                skipCollapsed = true
                isFitToContents = true
                maxHeight =
                    detents.maxAllowedHeightForFitToContents(
                        sheetAvailableSpace,
                        contentHeightForFitToContents,
                        nativeContainerPaddingBottom,
                    )
                state = BottomSheetBehavior.STATE_EXPANDED
            }
            return
        }

        when (detents.count) {
            1 ->
                behavior.apply {
                    skipCollapsed = true
                    isFitToContents = true
                    maxHeight = detents.maxAllowedHeight(sheetAvailableSpace)
                    state = BottomSheetBehavior.STATE_EXPANDED
                }
            2 ->
                behavior.apply {
                    skipCollapsed = false
                    isFitToContents = true
                    peekHeight = detents.firstHeight(sheetAvailableSpace)
                    maxHeight = detents.maxAllowedHeight(sheetAvailableSpace)
                    if (applyInitialDetent) state = resolveStateFromIndex(initialDetentIndex, detents.count)
                }
            3 ->
                behavior.apply {
                    skipCollapsed = false
                    isFitToContents = false
                    peekHeight = detents.firstHeight(sheetAvailableSpace)
                    halfExpandedRatio = detents.halfExpandedRatio()
                    expandedOffset = detents.expandedOffsetFromTop(sheetAvailableSpace)
                    maxHeight = detents.maxAllowedHeight(sheetAvailableSpace)
                    if (applyInitialDetent) state = resolveStateFromIndex(initialDetentIndex, detents.count)
                }
            else -> error("[RNScreens] Unsupported detent count ${detents.count}.")
        }
    }

    private fun resolveStateFromIndex(index: Int, count: Int): Int {
        val resolvedIndex = if (index == LAST_DETENT_INDEX) count - 1 else index
        return when (count) {
            1 -> BottomSheetBehavior.STATE_EXPANDED
            2 ->
                if (resolvedIndex.coerceIn(0, 1) == 0) {
                    BottomSheetBehavior.STATE_COLLAPSED
                } else {
                    BottomSheetBehavior.STATE_EXPANDED
                }
            3 ->
                when (resolvedIndex.coerceIn(0, 2)) {
                    0 -> BottomSheetBehavior.STATE_COLLAPSED
                    1 -> BottomSheetBehavior.STATE_HALF_EXPANDED
                    else -> BottomSheetBehavior.STATE_EXPANDED
                }
            else -> BottomSheetBehavior.STATE_COLLAPSED
        }
    }

    private fun mapStateToDetentIndex(state: Int): Int =
        when (currentDetentsCount) {
            1 -> if (state == BottomSheetBehavior.STATE_EXPANDED) 0 else UNKNOWN_DETENT_INDEX
            2 ->
                when (state) {
                    BottomSheetBehavior.STATE_COLLAPSED -> 0
                    BottomSheetBehavior.STATE_EXPANDED -> 1
                    else -> UNKNOWN_DETENT_INDEX
                }
            3 ->
                when (state) {
                    BottomSheetBehavior.STATE_COLLAPSED -> 0
                    BottomSheetBehavior.STATE_HALF_EXPANDED -> 1
                    BottomSheetBehavior.STATE_EXPANDED -> 2
                    else -> UNKNOWN_DETENT_INDEX
                }
            else -> UNKNOWN_DETENT_INDEX
        }

    companion object {
        private const val UNKNOWN_DETENT_INDEX = -1
        private const val LAST_DETENT_INDEX = -1
    }
}

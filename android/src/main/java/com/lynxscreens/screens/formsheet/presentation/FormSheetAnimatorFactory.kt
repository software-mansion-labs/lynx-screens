package com.lynxscreens.screens.formsheet.presentation

import android.animation.Animator
import android.animation.AnimatorSet
import android.animation.ValueAnimator
import android.view.View
import androidx.core.animation.doOnStart

internal class FormSheetAnimatorFactory(private val dimmingManager: FormSheetDimmingManager) {
    internal val animationDuration = 250L

    internal fun createEnterAnimator(view: View, isInterrupting: Boolean = false): Animator {
        val startY = if (isInterrupting) view.translationY else view.height.toFloat()
        val startAlpha = if (isInterrupting) dimmingManager.dimmingAlpha else 0f
        val slide = ValueAnimator.ofFloat(startY, 0f).apply {
            addUpdateListener { view.translationY = it.animatedValue as Float }
        }
        val dim = ValueAnimator.ofFloat(startAlpha, dimmingManager.maxAlpha).apply {
            addUpdateListener { dimmingManager.dimmingAlpha = it.animatedValue as Float }
        }
        return AnimatorSet().apply {
            playTogether(slide, dim)
            duration = animationDuration
            doOnStart { view.translationY = startY }
        }
    }

    internal fun createExitAnimator(view: View, isInterrupting: Boolean = false): Animator {
        val startY = if (isInterrupting) view.translationY else 0f
        val startAlpha = if (isInterrupting) dimmingManager.dimmingAlpha else dimmingManager.maxAlpha
        val slide = ValueAnimator.ofFloat(startY, view.height.toFloat()).apply {
            addUpdateListener { view.translationY = it.animatedValue as Float }
        }
        val dim = ValueAnimator.ofFloat(startAlpha, 0f).apply {
            addUpdateListener { dimmingManager.dimmingAlpha = it.animatedValue as Float }
        }
        return AnimatorSet().apply {
            playTogether(slide, dim)
            duration = animationDuration
        }
    }
}

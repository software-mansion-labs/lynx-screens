package com.lynxscreens.screens.ext

import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.findFragment

internal fun View.findFragmentOrNull(): Fragment? =
    try {
        this.findFragment()
    } catch (_: IllegalStateException) {
        null
    }

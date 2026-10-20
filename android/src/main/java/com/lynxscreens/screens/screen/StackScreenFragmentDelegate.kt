package com.lynxscreens.screens.screen

import android.content.res.Configuration

internal interface StackScreenFragmentDelegate {
    /**
     * Notifies the delegate that the fragment received a configuration update,
     * e.g. a theme change delivered to the activity. Fragments are the only
     * place where such updates are delivered reliably.
     */
    fun onFragmentConfigurationChanged(config: Configuration)
}

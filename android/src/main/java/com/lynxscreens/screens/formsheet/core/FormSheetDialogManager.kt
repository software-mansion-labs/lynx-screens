package com.lynxscreens.screens.formsheet.core

import android.content.Context
import android.view.ContextThemeWrapper
import android.view.View
import com.lynxscreens.screens.formsheet.interfaces.FormSheetContentSizeChangeDelegate
import com.lynxscreens.screens.formsheet.interfaces.FormSheetDialogEventEmitter
import com.lynxscreens.screens.formsheet.model.FormSheetConfig
import com.lynxscreens.screens.formsheet.presentation.FormSheetDimmingManager
import com.lynxscreens.screens.formsheet.presentation.FormSheetPresentation
import com.lynxscreens.screens.formsheet.presentation.FormSheetPresentationManager
import kotlin.properties.Delegates

internal class FormSheetDialogManager(
    context: Context,
    contentView: View,
) {
    private var formSheetConfig = FormSheetConfig()
    private val themedContext =
        ContextThemeWrapper(
            context,
            com.google.android.material.R.style.Theme_Material3_DayNight_NoActionBar,
        )
    private val container = FormSheetContainer(themedContext, contentView)
    private var lastContentHeight = 0
    private val dimmingManager = FormSheetDimmingManager(context)
    private val presentationManager =
        FormSheetPresentationManager(
            presentationFactory = ::createPresentation,
            dimmingManager = dimmingManager,
            onDismiss = { isNativeDismiss -> eventEmitter?.emitOnDismissEvent(isNativeDismiss) },
        )
    private val presentationCallbacks =
        object : FormSheetPresentation.Callbacks {
            override fun onDetentChanged(index: Int) = eventEmitter?.emitOnDetentChanged(index) ?: Unit

            override fun onNativeDismissAllowed() = presentationManager.handleNativeDismiss()

            override fun onNativeDismissPrevented() = eventEmitter?.emitOnNativeDismissPreventedEvent() ?: Unit
        }

    internal var eventEmitter: FormSheetDialogEventEmitter? by Delegates.observable(null) { _, _, value ->
        presentationManager.appearanceEventEmitter = value
    }

    internal val contentSizeChangeDelegate =
        FormSheetContentSizeChangeDelegate { height ->
            lastContentHeight = height
            presentationManager.currentPresentation?.onContentHeightChanged(height)
        }

    private fun createPresentation(): FormSheetPresentation =
        FormSheetPresentation(themedContext, container, presentationCallbacks).also {
            it.applyInitialConfig(formSheetConfig, lastContentHeight)
        }

    internal fun applyConfig(config: FormSheetConfig) {
        val oldConfig = formSheetConfig
        formSheetConfig = config
        presentationManager.currentPresentation?.applyConfigUpdate(oldConfig, config)
        if (oldConfig.isOpen != config.isOpen) presentationManager.requestProgrammaticStateUpdate(config.isOpen)
    }

    internal fun destroy() = presentationManager.destroy()
}

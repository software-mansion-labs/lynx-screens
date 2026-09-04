package com.lynxscreens.screens.formsheet.core

import android.content.Context
import android.view.ContextThemeWrapper
import android.view.View
import com.lynxscreens.screens.formsheet.interfaces.FormSheetController
import com.lynxscreens.screens.formsheet.interfaces.FormSheetDialogEventEmitter
import com.lynxscreens.screens.formsheet.model.FormSheetConfig
import com.lynxscreens.screens.formsheet.presentation.FormSheetDimmingManager
import com.lynxscreens.screens.formsheet.presentation.FormSheetPresentation
import com.lynxscreens.screens.formsheet.presentation.FormSheetPresentationManager

internal class FormSheetDialogManager(
    context: Context,
    contentView: View,
    private val eventEmitter: FormSheetDialogEventEmitter,
) : FormSheetController {
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
            onDismiss = eventEmitter::emitOnDismissEvent,
        )
    private val presentationCallbacks =
        object : FormSheetPresentation.Callbacks {
            override fun onDetentChanged(index: Int) = eventEmitter.emitOnDetentChanged(index)

            override fun onNativeDismissAllowed() = presentationManager.handleNativeDismiss()

            override fun onNativeDismissPrevented() = eventEmitter.emitOnNativeDismissPreventedEvent()
        }

    init {
        presentationManager.appearanceEventEmitter = eventEmitter
    }

    private fun createPresentation(): FormSheetPresentation =
        FormSheetPresentation(themedContext, container, presentationCallbacks).also {
            it.applyInitialConfig(formSheetConfig, lastContentHeight)
        }

    override fun apply(config: FormSheetConfig) {
        val oldConfig = formSheetConfig
        formSheetConfig = config
        presentationManager.currentPresentation?.applyConfigUpdate(oldConfig, config)
        if (oldConfig.isOpen != config.isOpen) presentationManager.requestProgrammaticStateUpdate(config.isOpen)
    }

    override fun onContentHeightChanged(height: Int) {
        lastContentHeight = height
        presentationManager.currentPresentation?.onContentHeightChanged(height)
    }

    override fun dispose() = presentationManager.destroy()
}

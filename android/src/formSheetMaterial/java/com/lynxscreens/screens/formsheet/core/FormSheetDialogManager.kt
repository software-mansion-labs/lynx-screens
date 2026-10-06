package com.lynxscreens.screens.formsheet.core

import android.content.Context
import android.view.ContextThemeWrapper
import android.view.View
import com.lynxscreens.screens.formsheet.interfaces.FormSheetContentSizeChangeDelegate
import com.lynxscreens.screens.formsheet.interfaces.FormSheetController
import com.lynxscreens.screens.formsheet.interfaces.FormSheetDialogEventEmitter
import com.lynxscreens.screens.formsheet.model.FormSheetConfig
import com.lynxscreens.screens.formsheet.presentation.FormSheetDimmingManager
import com.lynxscreens.screens.formsheet.presentation.FormSheetPresentation
import com.lynxscreens.screens.formsheet.presentation.FormSheetPresentationManager
import kotlin.properties.Delegates

// Adaptation: the Material backend implements the public pluggable-controller contract.
class FormSheetDialogManager(
    context: Context,
    private val contentView: View,
) : FormSheetController {
    // Adaptation: accept the emitter supplied by the pluggable controller factory.
    constructor(
        context: Context,
        contentView: View,
        eventEmitter: FormSheetDialogEventEmitter,
    ) : this(context, contentView) {
        this.eventEmitter = eventEmitter
    }

    private var formSheetConfig = FormSheetConfig()

    private val themedContext =
        ContextThemeWrapper(
            context,
            com.google.android.material.R.style.Theme_Material3_DayNight_NoActionBar,
        )

    // Eagerly create the container so it's always ready for the provided content view
    private val container = FormSheetContainer(themedContext, contentView)

    // The Lynx content only reports height changes, so a new presentation is seeded with the
    // last known value.
    private var lastContentHeight = 0

    private val presentationCallbacks =
        object : FormSheetPresentation.Callbacks {
            override fun onDetentChanged(index: Int) {
                eventEmitter?.emitOnDetentChanged(index)
            }

            override fun onNativeDismissAllowed() {
                presentationManager.handleNativeDismiss()
            }

            override fun onNativeDismissPrevented() {
                eventEmitter?.emitOnNativeDismissPreventedEvent()
            }
        }

    private val dimmingManager = FormSheetDimmingManager(context)

    private val presentationManager =
        FormSheetPresentationManager(
            presentationFactory = ::createPresentation,
            dimmingManager = dimmingManager,
            onNativeDismiss = { eventEmitter?.emitOnNativeDismissEvent() },
            onDismiss = { eventEmitter?.emitOnDismissEvent() },
        )

    internal var eventEmitter: FormSheetDialogEventEmitter? by Delegates.observable(null) { _, _, newValue ->
        presentationManager.appearanceEventEmitter = newValue
    }

    internal val contentSizeChangeDelegate: FormSheetContentSizeChangeDelegate =
        object : FormSheetContentSizeChangeDelegate {
            override fun onContentHeightChanged(newHeight: Int) {
                lastContentHeight = newHeight
                presentationManager.currentPresentation?.onContentHeightChanged(newHeight)
            }
        }

    private fun createPresentation(): FormSheetPresentation =
        FormSheetPresentation(themedContext, container, presentationCallbacks).also {
            it.applyInitialConfig(formSheetConfig, lastContentHeight)
        }

    override fun applyConfig(newConfig: FormSheetConfig) {
        val oldConfig = formSheetConfig
        formSheetConfig = newConfig

        presentationManager.currentPresentation?.applyConfigUpdate(oldConfig, newConfig)

        if (oldConfig.isOpen != newConfig.isOpen) {
            presentationManager.requestProgrammaticStateUpdate(newConfig.isOpen)
        }
    }

    override fun destroy() {
        presentationManager.destroy()
    }

    // Adaptation: forward controller content measurements to the RNS delegate.
    override fun onContentHeightChanged(height: Int) = contentSizeChangeDelegate.onContentHeightChanged(height)
}

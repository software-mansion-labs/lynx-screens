package com.lynxscreens.screens.formsheet.interfaces

import android.content.Context
import android.view.View
import com.lynxscreens.screens.formsheet.model.FormSheetConfig

/** Runtime-independent interface of the native FormSheet module. */
internal interface FormSheetController {
    fun apply(config: FormSheetConfig)

    fun onContentHeightChanged(height: Int)

    fun dispose()
}

internal fun interface FormSheetControllerFactory {
    fun create(
        context: Context,
        contentView: View,
        eventEmitter: FormSheetDialogEventEmitter,
    ): FormSheetController
}

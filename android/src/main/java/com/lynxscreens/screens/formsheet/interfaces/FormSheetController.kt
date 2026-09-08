package com.lynxscreens.screens.formsheet.interfaces

import android.content.Context
import android.view.View
import com.lynxscreens.screens.formsheet.model.FormSheetConfig

/**
 * Runtime-independent interface of the native FormSheet module.
 *
 * Divergence from RNS: this contract is public so host-provided backends can implement it outside
 * the library module.
 */
public interface FormSheetController {
    fun apply(config: FormSheetConfig)

    fun onContentHeightChanged(height: Int)

    fun dispose()
}

public fun interface FormSheetControllerFactory {
    fun create(
        context: Context,
        contentView: View,
        eventEmitter: FormSheetDialogEventEmitter,
    ): FormSheetController

    public companion object
}

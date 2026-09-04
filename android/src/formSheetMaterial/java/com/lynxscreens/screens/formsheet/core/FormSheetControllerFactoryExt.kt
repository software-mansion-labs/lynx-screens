package com.lynxscreens.screens.formsheet.interfaces

import com.lynxscreens.screens.formsheet.core.FormSheetDialogManager

internal fun FormSheetControllerFactory.Companion.default(): FormSheetControllerFactory =
    FormSheetControllerFactory(::FormSheetDialogManager)

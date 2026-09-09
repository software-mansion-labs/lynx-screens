package com.lynxscreens.screens.formsheet.interfaces

internal fun FormSheetControllerFactory.Companion.default(): FormSheetControllerFactory =
    error(
        "No FormSheet backend has been registered. " +
            "Call LynxScreens.setFormSheetControllerFactory() before creating a FormSheet.",
    )

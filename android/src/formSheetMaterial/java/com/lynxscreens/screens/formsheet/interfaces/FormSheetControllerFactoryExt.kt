package com.lynxscreens.screens.formsheet.interfaces

import com.lynxscreens.screens.formsheet.core.FormSheetDialogManager

// Adaptation: RNS's FormSheetHost passes `reactContext.currentActivity` as the activity provider
// because ReactContext wraps the application context. LynxContext wraps the context the LynxView
// was built with (the activity), so the default provider - the ContextWrapper walk - finds it.
internal fun FormSheetControllerFactory.Companion.default(): FormSheetControllerFactory =
    FormSheetControllerFactory(::FormSheetDialogManager)

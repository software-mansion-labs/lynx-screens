package com.lynxscreens.screens

import com.lynxscreens.screens.formsheet.interfaces.FormSheetControllerFactory
import com.lynxscreens.screens.formsheet.interfaces.default

public object LynxScreens {
    private val lock = Any()
    private var configuredFormSheetControllerFactory: FormSheetControllerFactory? = null
    private var isFormSheetBackendLocked = false

    @JvmStatic
    public fun setFormSheetControllerFactory(factory: FormSheetControllerFactory) {
        synchronized(lock) {
            check(!isFormSheetBackendLocked) {
                "The FormSheet backend has already been initialized"
            }
            configuredFormSheetControllerFactory = factory
        }
    }

    internal fun requireFormSheetControllerFactory(): FormSheetControllerFactory =
        synchronized(lock) {
            isFormSheetBackendLocked = true
            configuredFormSheetControllerFactory ?: FormSheetControllerFactory.default()
        }
}

package com.lynxscreens.screens.formsheet.host

import android.annotation.SuppressLint
import com.lynxscreens.screens.common.trace.LynxScreensTrace
import com.lynxscreens.screens.common.trace.NavigationTraceContextStore
import com.lynxscreens.screens.formsheet.FormSheetNavigationTrace
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.view.AndroidView

@SuppressLint("ViewConstructor")
internal class FormSheetHostView(
    context: LynxContext,
    @Suppress("UNUSED_PARAMETER") traceIdentity: String,
    screenKeyProvider: () -> String?,
) : AndroidView(context) {
    private val navigationTraceContextStore = NavigationTraceContextStore()
    private val traceContainerId by lazy { "sheet:${java.util.UUID.randomUUID()}" }
    internal var contentTraceIdentity: com.lynxscreens.screens.common.trace.ContentTraceIdentity? = null
    internal val navigationTrace = FormSheetNavigationTrace({ traceContainerId }, screenKeyProvider, navigationTraceContextStore,
        { com.lynxscreens.screens.common.trace.NavigatorTraceScopes.find(context, navigationTraceContextStore.session)?.captureBatch() },
        { contentTraceIdentity?.takeIf { it.session == navigationTraceContextStore.session } })
    internal fun setTraceSession(value: String?) { navigationTraceContextStore.setSession(value) }
    internal fun setContentTraceContext(value: String?) { contentTraceIdentity = com.lynxscreens.screens.common.trace.ContentTraceIdentity.parse(value) }


    internal fun setNavigationTraceContext(value: String?) {
        navigationTraceContextStore.update(value)
    }

    override fun onDetachedFromWindow() {
        navigationTrace.dispose("view_detached")
        super.onDetachedFromWindow()
    }

    // Adaptation: children are laid out by Lynx after being teleported to the dialog window.
    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) = Unit
}

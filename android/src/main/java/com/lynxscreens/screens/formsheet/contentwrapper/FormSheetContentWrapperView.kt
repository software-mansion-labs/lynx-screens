package com.lynxscreens.screens.formsheet.contentwrapper

import android.annotation.SuppressLint
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.view.AndroidView
import com.lynxscreens.screens.formsheet.interfaces.FormSheetContentSizeChangeDelegate
import com.lynxscreens.screens.formsheet.interfaces.FormSheetContentSizeChangeProvider

@SuppressLint("ViewConstructor")
internal class FormSheetContentWrapperView(
    context: LynxContext,
) : AndroidView(context),
    FormSheetContentSizeChangeProvider {
    private var delegate: FormSheetContentSizeChangeDelegate? = null
    private var lastReportedHeight = -1

    override fun setContentSizeChangeDelegate(delegate: FormSheetContentSizeChangeDelegate?) {
        this.delegate = delegate
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        val height = bottom - top
        if (height != lastReportedHeight) {
            lastReportedHeight = height
            delegate?.onContentHeightChanged(height)
        }
    }
}

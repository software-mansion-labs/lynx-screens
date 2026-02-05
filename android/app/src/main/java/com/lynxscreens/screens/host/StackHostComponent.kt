package com.lynxscreens.screens.host

import android.content.Context
import android.view.View
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.PatchFinishListener
import com.lynx.tasm.behavior.ui.LynxBaseUI
import com.lynx.tasm.behavior.ui.LynxUI
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynxscreens.screens.screen.StackScreenComponent
import java.lang.ref.WeakReference

internal class StackHostComponent(context: LynxContext) : UIGroup<StackHostView>(context), StackContainerDelegate, PatchFinishListener {
    internal val renderedScreens: ArrayList<StackScreenComponent> = arrayListOf()
    private lateinit var container: StackContainer

    override fun createView(context: Context?): StackHostView {
        val lynxContext = context as LynxContext
        container = StackContainer(lynxContext, WeakReference(this))

        return StackHostView(lynxContext, container)
    }

    override fun insertChild(child: LynxBaseUI?, index: Int) {
        require(child is StackScreenComponent) { "[RNScreens] Attempt to attach child that is not of type ${StackScreenComponent::javaClass.name}" }

        mountLynxSubviewAt(child, index)
        super.insertChild(child, index)
    }

    override fun insertView(child: LynxUI<*>) {
        super.insertView(child)

        // TODO: @t0maboro 
        // This is really bad workaround, Lynx takes the responsibility for both Lynx hierarchy (insertChild) and native hierarchy (insertView)
        // For the native hierarchy, we want to have an intermediate component - StackContainer which will perform operations on FragmentManager level.
        // FragmentManager should be responsible for attaching/detaching Screens, therefore, I'm forcefully detaching Screen from Host.
        // This may break some important logic for Lynx that atm. I'm not aware of, but it should be resolved ASAP.
        val childNativeView: View = child.view
        if (childNativeView.parent === view) {
            view.removeView(childNativeView)
        }
    }

    override fun removeChild(child: LynxBaseUI?) {
        require(child is StackScreenComponent) { "[RNScreens] Attempt to remove child that is not of type ${StackScreenComponent::javaClass.name}" }

        unmountLynxSubview(child)
        super.removeChild(child)
    }

    override fun removeAll() {
        unmountAllLynxSubviews()
        super.removeAll()
    }

    override fun getChildAt(index: Int): LynxBaseUI? {
        return renderedScreens.getOrNull(index)
    }

    override fun getChildCount(): Int {
        return renderedScreens.size
    }

    private fun mountLynxSubviewAt(
        stackScreen: StackScreenComponent,
        index: Int,
    ) {
        renderedScreens.add(index, stackScreen)
        stackScreen.stackHost = WeakReference(this)
        enqueueAddOperationToContainerIfNeeded(stackScreen)
    }

    private fun unmountLynxSubview(lynxSubview: StackScreenComponent) {
        renderedScreens.remove(lynxSubview)
        enqueuePopOperationToContainerIfNeeded(lynxSubview)
    }

    private fun unmountAllLynxSubviews() {
        renderedScreens.asReversed().forEach {
            enqueuePopOperationToContainerIfNeeded(it)
        }
        renderedScreens.clear()
    }

    private fun enqueueAddOperationToContainerIfNeeded(stackScreen: StackScreenComponent) {
        if (stackScreen.activityMode == StackScreenComponent.ActivityMode.ATTACHED) {
            container.enqueueAddOperation(stackScreen)
        }
    }

    private fun enqueuePopOperationToContainerIfNeeded(stackScreen: StackScreenComponent) {
        if (stackScreen.activityMode == StackScreenComponent.ActivityMode.ATTACHED && !stackScreen.isNativelyDismissed) {
            container.enqueuePopOperation(stackScreen)
        }
    }

    internal fun stackScreenChangedActivityMode(stackScreen: StackScreenComponent) {
        when (stackScreen.activityMode) {
            StackScreenComponent.ActivityMode.DETACHED -> container.enqueuePopOperation(stackScreen)
            StackScreenComponent.ActivityMode.ATTACHED -> container.enqueueAddOperation(stackScreen)
        }
    }

    override fun onDismiss(stackScreen: StackScreenComponent) {
        if (stackScreen.activityMode == StackScreenComponent.ActivityMode.ATTACHED) {
            stackScreen.isNativelyDismissed = true
        }
    }

    override fun onPatchFinish() {
        container.performContainerUpdateIfNeeded()
    }
}

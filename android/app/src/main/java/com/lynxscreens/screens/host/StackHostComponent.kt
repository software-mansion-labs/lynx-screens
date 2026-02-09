package com.lynxscreens.screens.host

import android.content.Context
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

    private val containerUpdateCoordinator = StackHostContainerUpdateCoordinator()

    override fun createView(context: Context?): StackHostView {
        val lynxContext = context as LynxContext
        container = StackContainer(lynxContext, WeakReference(this))

        return StackHostView(lynxContext, container)
    }

    override fun insertChild(child: LynxBaseUI, index: Int) {
        require(child is StackScreenComponent) { "[RNScreens] Attempt to attach child that is not of type ${StackScreenComponent::javaClass.name}" }

        mountLynxSubviewAt(child, index)
        super.insertChild(child, index)
    }

    override fun insertView(child: LynxUI<*>?) {
        // NO-OP
        // We intentionally ignore Lynx's default native view insertion here.
        // Responsibility for building and managing the native view hierarchy is
        // transferred to StackContainer, which utilizes FragmentManager to
        // handle view attachment within the Fragment lifecycle.
    }

    override fun removeChild(child: LynxBaseUI?) {
        require(child is StackScreenComponent) { "[RNScreens] Attempt to remove child that is not of type ${StackScreenComponent::javaClass.name}" }

        unmountLynxSubview(child)
        super.removeChild(child)
    }

    override fun removeView(child: LynxBaseUI?) {
        // NO-OP
        // We intentionally ignore Lynx's default native view removal here.
        // Responsibility for building and managing the native view hierarchy is
        // transferred to StackContainer, which utilizes FragmentManager to
        // handle view detachment within the Fragment lifecycle.
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
        addPushOperationIfNeeded(stackScreen)
    }

    private fun unmountLynxSubview(lynxSubview: StackScreenComponent) {
        renderedScreens.remove(lynxSubview)
        addPopOperationIfNeeded(lynxSubview)
    }

    private fun unmountAllLynxSubviews() {
        renderedScreens.asReversed().forEach {
            addPopOperationIfNeeded(it)
        }
        renderedScreens.clear()
    }

    private fun addPushOperationIfNeeded(stackScreen: StackScreenComponent) {
        if (stackScreen.activityMode == StackScreenComponent.ActivityMode.ATTACHED) {
            containerUpdateCoordinator.addPushOperation(stackScreen)
        }
    }

    private fun addPopOperationIfNeeded(stackScreen: StackScreenComponent) {
        if (stackScreen.activityMode == StackScreenComponent.ActivityMode.ATTACHED && !stackScreen.isNativelyDismissed) {
            // This shouldn't happen in typical scenarios but it can happen with fast-refresh.
            containerUpdateCoordinator.addPopOperation(stackScreen)
        }
    }

    internal fun stackScreenChangedActivityMode(stackScreen: StackScreenComponent) {
        when (stackScreen.activityMode) {
            StackScreenComponent.ActivityMode.DETACHED -> containerUpdateCoordinator.addPopOperation(stackScreen)
            StackScreenComponent.ActivityMode.ATTACHED -> containerUpdateCoordinator.addPushOperation(stackScreen)
        }
    }

    override fun onScreenDismiss(stackScreen: StackScreenComponent) = Unit

    override fun onPatchFinish() {
        containerUpdateCoordinator.executePendingOperationsIfNeeded(container, renderedScreens)
    }
}

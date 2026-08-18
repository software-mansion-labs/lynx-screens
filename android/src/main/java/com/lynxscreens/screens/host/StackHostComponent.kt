package com.lynxscreens.screens.host

import android.content.Context
import android.util.Log
import android.view.View
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxElement
import com.lynx.tasm.behavior.PatchFinishListener
import com.lynx.tasm.behavior.ui.LynxBaseUI
import com.lynx.tasm.behavior.ui.LynxUI
import com.lynx.tasm.behavior.ui.UIGroup
import com.lynxscreens.screens.screen.StackScreenComponent
import java.lang.ref.WeakReference

@LynxElement(name = "ls-stack-host")
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

        // Store the reference to StackHost, to notify it when the activity mode will change from DETACHED to ATTACHED
        child.stackHost = WeakReference(this)

        if (child.activityMode == StackScreenComponent.ActivityMode.ATTACHED) {
            // Insert always at the last index
            mountLynxSubviewAt(child)
            // Add the component to Lynx children, only when it's attached
            super.insertChild(child, super.getChildCount())
        }
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

    // Overriding needCustomLayout to return `true` allows this component to handle its own
    // child layout logic instead of relying on Lynx's default layout mechanism.
    // This is necessary because StackScreenComponent instances are managed manually and rendered
    // through StackContainer, which uses FragmentManager to attach/detach views as Android fragments.
    // Automatic Lynx layout would interfere with fragment lifecycle.
    // This is correlated with overridden `onLayout` method on StackHostView.
    override fun needCustomLayout(): Boolean = true

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
        stackScreen: StackScreenComponent
    ) {
        renderedScreens.add(stackScreen)
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
        } else {
            Log.d(TAG, "Ignoring pop operation of ${stackScreen.screenKey}, already not attached or natively dismissed")
        }
    }

    internal fun stackScreenChangedActivityMode(stackScreen: StackScreenComponent) {
        when (stackScreen.activityMode) {
            StackScreenComponent.ActivityMode.DETACHED -> {
                containerUpdateCoordinator.addPopOperation(stackScreen)
            }
            StackScreenComponent.ActivityMode.ATTACHED -> {
                // Lynx attaches children on insert by default. To support preloading,
                // we manually trigger the insert logic only when confirmed ATTACHED.
                insertChild(stackScreen, super.getChildCount())
            }
        }
    }

    override fun onScreenDismissCommitted(stackScreen: StackScreenComponent) {
        if (stackScreen.activityMode == StackScreenComponent.ActivityMode.ATTACHED) {
            stackScreen.isNativelyDismissed = true
        }
    }

    override fun onPatchFinish() {
        containerUpdateCoordinator.executePendingOperationsIfNeeded(container, renderedScreens)
    }

    companion object {
        const val TAG = "StackHostComponent"
    }
}

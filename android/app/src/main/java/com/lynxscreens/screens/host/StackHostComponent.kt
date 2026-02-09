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

        // Store the reference to StackHost, to notify it when the activity mode will change from DETACHED to ATTACHED
        child.stackHost = WeakReference(this)

        if (child.activityMode == StackScreenComponent.ActivityMode.ATTACHED) {
            // Insert always at the last index
            mountLynxSubviewAt(child)
            // We manually trigger a layout pass because we have disabled Lynx's default
            // native view management for StackHostComponent. Since the FragmentManager
            // now handles the insertion of views into this container, we must ensure
            // that the CoordinatorLayout (StackContainer) re-measures its children when relevant.
            requestLayout()
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
        }
    }

    internal fun stackScreenChangedActivityMode(stackScreen: StackScreenComponent) {
        when (stackScreen.activityMode) {
            StackScreenComponent.ActivityMode.DETACHED -> onStackScreenChangedActivityModeFromAttachedToDetached(stackScreen)
            StackScreenComponent.ActivityMode.ATTACHED -> onStackScreenChangedActivityModeFromDetachedToAttached(stackScreen)
        }
    }

    private fun onStackScreenChangedActivityModeFromAttachedToDetached(stackScreen: StackScreenComponent) {
        containerUpdateCoordinator.addPopOperation(stackScreen)
    }

    private fun onStackScreenChangedActivityModeFromDetachedToAttached(stackScreen: StackScreenComponent) {
        // By default, Lynx attempts to attach children as soon as an insert operation happens.
        // To handle preloading, we need manual control over child attachment.
        // Therefore, this adjustment is to call the whole insertChild logic which we skipped earlier.
        // It should be only executed when we have confirmed the state is **changed** to ATTACHED.
        insertChild(stackScreen, super.getChildCount())
    }

    override fun onScreenDismiss(stackScreen: StackScreenComponent) = Unit

    override fun onPatchFinish() {
        containerUpdateCoordinator.executePendingOperationsIfNeeded(container, renderedScreens)
    }
}

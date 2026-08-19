package com.lynxscreens.screens.host

import android.content.Context
import android.util.Log
import android.view.View
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxElement
import com.lynx.tasm.behavior.PatchFinishListener
import com.lynx.tasm.behavior.event.EventTarget
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

    /**
     * Header subview views are reparented into the native Toolbar, outside any Lynx-managed view
     * subtree, so the custom-layout view walk (which only knows the host's direct Lynx children -
     * the screens) cannot find them and taps on them resolve to the host itself. When that
     * happens, probe the reparented subviews of the rendered screens by their actual window
     * positions and continue the hit-test inside the matching subview.
     *
     * This is the Lynx counterpart of RNS's contentOriginOffset-based touch correction on Fabric.
     */
    override fun findUIWithCustomLayout(
        x: Float,
        y: Float,
        parent: UIGroup<*>?,
    ): EventTarget {
        val target = super.findUIWithCustomLayout(x, y, parent)
        if (target !== this) {
            return target
        }
        return findHeaderSubviewTarget(x, y) ?: target
    }

    private fun findHeaderSubviewTarget(
        x: Float,
        y: Float,
    ): EventTarget? {
        val hostView = view ?: return null
        val hostPosition = IntArray(2)
        hostView.getLocationInWindow(hostPosition)

        for (screen in renderedScreens.asReversed()) {
            val config = screen.headerConfig ?: continue
            // Background goes last - toolbar subviews render on top of it.
            val subviews =
                listOfNotNull(
                    config.leadingSubview,
                    config.centerSubview,
                    config.trailingSubview,
                    config.backgroundSubview,
                )
            for (subview in subviews) {
                val subviewView = subview.subviewView
                if (!subviewView.isShown) continue

                val subviewPosition = IntArray(2)
                subviewView.getLocationInWindow(subviewPosition)
                // Note: ignores scale/rotation transforms between the host and the subview.
                val childX = x - (subviewPosition[0] - hostPosition[0])
                val childY = y - (subviewPosition[1] - hostPosition[1])
                if (childX >= 0f && childY >= 0f && childX <= subviewView.width && childY <= subviewView.height) {
                    return subview.hitTest(childX, childY)
                }
            }
        }
        return null
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

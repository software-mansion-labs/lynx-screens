package com.lynxscreens.screens.host

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.fragment.app.FragmentManager
import com.lynxscreens.screens.common.container.Container
import com.lynxscreens.screens.common.container.ParentContainerItemRegistry
import com.lynxscreens.screens.ext.isMeasured
import com.lynxscreens.screens.helpers.FragmentManagerHelper
import com.lynxscreens.screens.helpers.ViewIdGenerator
import com.lynxscreens.screens.screen.StackScreenComponent
import com.lynxscreens.screens.screen.StackScreenFragment
import java.lang.ref.WeakReference

@SuppressLint("ViewConstructor") // Only we construct this view, it is never inflated.
internal class StackContainer(
    context: Context,
    private val delegate: WeakReference<StackContainerDelegate>,
) : FrameLayout(context),
    Container,
    FragmentManager.OnBackStackChangedListener {
    private var fragmentManager: FragmentManager? = null

    private fun requireFragmentManager(): FragmentManager =
        checkNotNull(fragmentManager) { "[RNScreens] Attempt to use nullish FragmentManager" }

    /**
     * Will crash in case parent does not implement StackContainerParent interface.
     */
    private fun containerParentOrNull(): StackContainerParent? = this.parent as StackContainerParent?

    private val parentContainerRegistry = ParentContainerItemRegistry()

    /**
     * Describes most up-to-date view of the stack. It might be different from
     * state kept by FragmentManager as this data structure is updated immediately,
     * while operations on fragment manager are scheduled.
     */
    private val stackModel: MutableList<StackScreenFragment> = arrayListOf()

    private val pendingPopOperations: MutableList<PopOperation> = arrayListOf()
    private val pendingPushOperations: MutableList<PushOperation> = arrayListOf()
    private val hasPendingOperations: Boolean
        get() = pendingPushOperations.isNotEmpty() || pendingPopOperations.isNotEmpty()

    private val fragmentOpExecutor: FragmentOperationExecutor = FragmentOperationExecutor()
    private val fragmentOps: MutableList<FragmentOperation> = arrayListOf()

    init {
        id = ViewIdGenerator.generateViewId()
    }

    override fun onAttachedToWindow() {
        Log.d(TAG, "StackContainer [$id] attached to window")
        super.onAttachedToWindow()

        parentContainerRegistry.attach(this)
        setupFragmentManger()

        // Following line works with a couple of assumptions.
        // First, that this view is laid out by our parent view, which is a component view.
        // Component views on new architecture receive their first layout after the view hierarchy is
        // assembled and attached to window. Note, that in case of screen views & their subtrees
        // (including nested containers) this does not hold. The container is updated later, therefore
        // the views are attached to window much later ==> their isLaidOut returns false, breaking
        // transitions & animations.
        updateLaidOutFlagIfNeededAndPossible()

        // We run container update to handle any pending updates requested before container was
        // attached to window.
        performContainerUpdateIfNeeded()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        requireFragmentManager().removeOnBackStackChangedListener(this)
        fragmentManager = null
        parentContainerRegistry.detach(this)
    }

    internal fun setupFragmentManger() {
        fragmentManager =
            checkNotNull(FragmentManagerHelper.findFragmentManagerForView(this)) {
                "[RNScreens] Nullish fragment manager - can't run container operations"
            }.also {
                it.addOnBackStackChangedListener(this)
            }
    }

    /**
     * Call this function to trigger container update
     */
    internal fun performContainerUpdateIfNeeded() {
        // If container update is requested before container is attached to window, we ignore
        // the call because we don't have valid fragmentManager yet.
        // Update will be eventually executed in onAttachedToWindow().
        if (hasPendingOperations && isAttachedToWindow) {
            performOperations(requireFragmentManager())
        }
    }

    internal fun enqueuePushOperation(stackScreen: StackScreenComponent) {
        pendingPushOperations.add(PushOperation(stackScreen))
    }

    internal fun enqueuePopOperation(stackScreen: StackScreenComponent) {
        pendingPopOperations.add(PopOperation(stackScreen))
    }

    private fun performOperations(fragmentManager: FragmentManager) {
        applyOperationsAndComputeFragmentManagerOperations()
        fragmentOpExecutor.executeOperations(fragmentManager, fragmentOps, flushSync = false)

        dumpStackModel()
    }

    private fun applyOperationsAndComputeFragmentManagerOperations() {
        fragmentOps.clear()

        // Handle pop operations first.
        // We don't care about pop/push duplicates, as long as we don't let the main loop progress
        // before we commit all the transactions, FragmentManager will handle that for us.

        if (hasPendingOperations) {
            // Top fragment is the primary navigation fragment. If we're going to change anything
            // in stack model, then we also should update top fragment.
            //
            // This is added before other operations, to make sure that they are correctly classified
            // as pop/non-pop by fragment manager.
            // This relies on Fragment Manager internal behavior obviously. It classifies
            // whole batch of transactions as "pop" (argument later passed to `onBackStackChange` commited)
            // when last operation of the batch is "pop". Empty commit with only onCommit callback
            // attached is not a "pop" commit, therefore JS-pop commits have not been properly
            // recognized.
            fragmentOps.add(
                OnCommitCallbackOp(
                    { updateTopFragment() },
                    allowStateLoss = true,
                    flushSync = false,
                ),
            )
        }

        pendingPopOperations.forEach { operation ->
            val fragment =
                checkNotNull(stackModel.find { it.stackScreen === operation.screen }) {
                    "[RNScreens] Unable to find a fragment to pop"
                }

            check(stackModel.size > 1) {
                "[RNScreens] Attempt to pop last screen from the stack"
            }

            fragmentOps.add(PopBackStackOp(fragment))

            check(stackModel.removeAt(stackModel.lastIndex) === fragment) {
                "[RNScreens] Attempt to pop non-top screen"
            }
        }

        pendingPushOperations.forEach { operation ->
            val newFragment = createFragmentForScreen(operation.screen, canNavigateBack = stackModel.isNotEmpty())
            fragmentOps.add(
                AddAndSetAsPrimaryOp(
                    newFragment,
                    containerViewId = this.id,
                    addToBackStack = stackModel.isNotEmpty(),
                ),
            )
            stackModel.add(newFragment)
        }

        check(stackModel.isNotEmpty()) { "[RNScreens] Stack should never be empty after updates" }

        pendingPopOperations.clear()
        pendingPushOperations.clear()
    }

    private fun onNativeFragmentPop(fragment: StackScreenFragment) {
        require(stackModel.remove(fragment)) { "[RNScreens] onNativeFragmentPop must be called with the fragment present in stack model" }
        check(stackModel.isNotEmpty()) { "[RNScreens] Stack model should not be empty after a native pop" }

        // The primary navigation fragment should be updated when popping backstack by FragmentManager
        // reversing the back stack record. At this point we need to just update the top fragment.
        check(requireFragmentManager().primaryNavigationFragment !== fragment) {
            "[RNScreens] Primary navigation fragment not updated by native pop"
        }
        updateTopFragment()
    }

    private fun dumpStackModel() {
        Log.d(TAG, "StackContainer [$id] MODEL BEGIN")
        stackModel.forEach {
            Log.d(TAG, "${it.stackScreen.screenKey}")
        }
    }

    private fun createFragmentForScreen(
        screen: StackScreenComponent,
        canNavigateBack: Boolean,
    ): StackScreenFragment =
        StackScreenFragment(screen, canNavigateBack).also {
            Log.d(TAG, "Created Fragment $it for screen ${screen.screenKey}")
        }

    private fun updateTopFragment() {
        // We try to handle situation where other fragments might be present.
        val fragmentManager = requireFragmentManager()
        val fragments = fragmentManager.fragments.filterIsInstance<StackScreenFragment>()
        check(fragments.isNotEmpty()) { "[RNScreens] Empty fragment manager while attempting to update top fragment" }
        fragments.forEach { it.onResignTopFragment() }
        fragments.last().onBecomeTopFragment()

        // This assumes that the updateTopFragment is called already after primary nav frag. is updated.
        // If this needs to be changed in the future, just remove this assertion.
        check(fragmentManager.primaryNavigationFragment === fragments.last()) {
            "[RNScreens] Top fragment different from primary navigation fragment"
        }
    }

    /**
     * Computes top fragment from FragmentManager's state.
     * This one does not query the `stackModel`!
     *
     * Might return `null` if the stack is empty.
     */
    private fun determineTopFragment(): StackScreenFragment? =
        requireFragmentManager()
            .fragments
            .filterIsInstance<StackScreenFragment>()
            .lastOrNull()

    /**
     * If this.isLaidOut == false, then SpecialEffectsController won't perform animations / transitions.
     * This function tries to ensure that the container is laid out if it already has layout information.
     */
    private fun updateLaidOutFlagIfNeededAndPossible() {
        if (isAttachedToWindow && isMeasured() && !isLaidOut && !isInLayout) {
            containerParentOrNull()?.layoutContainerNow()
        }
    }

    /**
     * Fragment 1.3 only exposes this coarse back-stack callback. JS-driven pops update stackModel
     * before the transaction, while a native pop leaves the removed top Fragment in stackModel.
     */
    override fun onBackStackChanged() {
        val currentFragmentManager = fragmentManager ?: return
        val addedFragments = currentFragmentManager.fragments

        while (stackModel.size > 1) {
            val topFragment = stackModel.last()
            if (addedFragments.contains(topFragment)) {
                return
            }

            delegate.get()?.onScreenDismissCommitted(topFragment.stackScreen)
            onNativeFragmentPop(topFragment)
        }
    }

    internal fun forceSubtreeMeasureAndLayoutPass() {
        measure(
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
        )

        layout(left, top, right, bottom)
    }

    // region Container

    override fun resolveCurrentContentScrollView(): ViewGroup? =
        determineTopFragment()
            ?.stackScreen
            ?.view
            ?.findContentScrollView()

    // endregion

    companion object {
        const val TAG = "StackContainer"
    }
}

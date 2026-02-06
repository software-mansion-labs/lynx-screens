package com.lynxscreens.screens.host

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.fragment.app.FragmentManager
import androidx.fragment.app.FragmentTransaction
import com.lynxscreens.screens.helpers.FragmentManagerHelper
import com.lynxscreens.screens.helpers.createTransactionWithReordering
import com.lynxscreens.screens.screen.StackScreenComponent
import com.lynxscreens.screens.screen.StackScreenFragment
import java.lang.ref.WeakReference

internal sealed class StackOperation

internal class AddOperation(
    val screen: StackScreenComponent,
) : StackOperation()

internal class PopOperation(
    val screen: StackScreenComponent,
) : StackOperation()

@SuppressLint("ViewConstructor") // Only we construct this view, it is never inflated.
internal class StackContainer(
    context: Context,
    private val delegate: WeakReference<StackContainerDelegate>,
) : CoordinatorLayout(context) {
    private var fragmentManager: FragmentManager? = null

    private val stackScreenFragments: MutableList<StackScreenFragment> = arrayListOf()
    private val pendingOperationQueue: MutableList<StackOperation> = arrayListOf()

    init {
        id = generateViewId()
    }

    override fun onAttachedToWindow() {
        Log.d(TAG, "StackContainer [$id] attached to window")
        super.onAttachedToWindow()

        fragmentManager =
            checkNotNull(FragmentManagerHelper.findFragmentManagerForView(this)) {
                "[RNScreens] Nullish fragment manager - can't run container operations"
            }

        // We run container update to handle any pending updates requested before container was
        // attached to window.
        performContainerUpdateIfNeeded()
    }

    /**
     * Call this function to trigger container update
     */
    internal fun performContainerUpdateIfNeeded() {
        // If container update is requested before container is attached to window, we ignore
        // the call because we don't have valid fragmentManager yet.
        // Update will be eventually executed in onAttachedToWindow().
        if (pendingOperationQueue.isNotEmpty() && isAttachedToWindow) {
            val fragmentManager =
                checkNotNull(fragmentManager) { "[RNScreens] Fragment manager was null during stack container update" }
            performOperations(fragmentManager, false)
        }
    }

    internal fun enqueueAddOperation(stackScreen: StackScreenComponent) {
        pendingOperationQueue.add(AddOperation(stackScreen))
    }

    internal fun enqueuePopOperation(stackScreen: StackScreenComponent) {
        pendingOperationQueue.add(PopOperation(stackScreen))
    }

    private fun performOperations(
        fragmentManager: FragmentManager,
        commitSync: Boolean = false,
    ) {
        val transaction = fragmentManager.createTransactionWithReordering()
        pendingOperationQueue.forEach { operation -> performOperation(fragmentManager, transaction, operation) }

        // TODO: refactor + should every push be added as separate back stack entry to maintain history?
        val lastPushScreenKey =
            pendingOperationQueue
                .asReversed()
                .filter { it is AddOperation }
                .map { operation -> (operation as AddOperation).screen.screenKey }
                .firstOrNull()

        pendingOperationQueue.clear()

        // Pop operation does not use transaction
        if (!transaction.isEmpty) {
            require(lastPushScreenKey != null) { "[RNScreens] Expected non-null screenKey for back stack entry." }

            // don't add root to back stack to handle exiting from app.
            if (fragmentManager.fragments.isNotEmpty()) {
                transaction.addToBackStack(lastPushScreenKey)
            }

            if (commitSync) {
                // TODO: will not work with back stack
                transaction.commitNowAllowingStateLoss()
            } else {
                transaction.commitAllowingStateLoss()
            }
        }
    }

    private fun performOperation(
        fragmentManager: FragmentManager,
        transaction: FragmentTransaction,
        operation: StackOperation,
    ) {
        when (operation) {
            is AddOperation -> performAddOperation(transaction, operation)
            is PopOperation -> performPopOperation(fragmentManager, operation)
        }
    }

    private fun performAddOperation(
        transaction: FragmentTransaction,
        operation: AddOperation,
    ) {
        val associatedFragment = StackScreenFragment(WeakReference(this), operation.screen)
        stackScreenFragments.add(associatedFragment)
        transaction.add(this.id, associatedFragment)
    }

    private fun performPopOperation(
        fragmentManager: FragmentManager,
        operation: PopOperation,
    ) {
        val backStackEntryCount = fragmentManager.backStackEntryCount
        require(backStackEntryCount > 0) { "[RNScreens] Back stack must not be empty." }

        val lastBackStackEntry = fragmentManager.getBackStackEntryAt(backStackEntryCount - 1)
        require(lastBackStackEntry.name == operation.screen.screenKey) { "[RNScreens] Popping is supported only for top screen." }

        fragmentManager.popBackStack(lastBackStackEntry.name, FragmentManager.POP_BACK_STACK_INCLUSIVE)
    }

    internal fun onFragmentDestroyView(fragment: StackScreenFragment) {
        delegate.get()?.onDismiss(fragment.stackScreen)
    }

    companion object {
        const val TAG = "StackContainer"
    }
}

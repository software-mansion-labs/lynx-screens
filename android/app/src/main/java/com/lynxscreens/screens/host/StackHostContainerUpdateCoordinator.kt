package com.lynxscreens.screens.host

import com.lynxscreens.screens.screen.StackScreenComponent

internal class StackHostContainerUpdateCoordinator {
    private val pendingPushOperations: MutableList<PushOperation> = arrayListOf()
    private val pendingPopOperations: MutableList<PopOperation> = arrayListOf()

    private val hasPendingOperations: Boolean
        get() = pendingPushOperations.isNotEmpty() || pendingPopOperations.isNotEmpty()

    internal fun addPushOperation(stackScreen: StackScreenComponent) {
        // If a Push operation is detected for a screen already scheduled for a Pop,
        // both operations are canceled.
        val index = pendingPopOperations.indexOfFirst { it.screen == stackScreen }
        val shouldCancelPopOperation = index != -1
        if (shouldCancelPopOperation) {
            pendingPopOperations.removeAt(index)
        } else {
            pendingPushOperations.add(PushOperation(stackScreen))
        }
    }

    internal fun addPopOperation(stackScreen: StackScreenComponent) {
        // If a Pop operation is detected for a screen already scheduled for a Push,
        // both operations are canceled.
        val index = pendingPushOperations.indexOfFirst { it.screen == stackScreen }
        val shouldCancelPushOperation = index != -1
        if (shouldCancelPushOperation) {
            pendingPushOperations.removeAt(index)
        } else {
            pendingPopOperations.add(PopOperation(stackScreen))
        }
    }

    internal fun executePendingOperationsIfNeeded(
        container: StackContainer,
        renderedScreens: List<StackScreenComponent>,
    ) {
        if (!hasPendingOperations) {
            return
        }

        pendingPopOperations
            .map { Pair(renderedScreens.indexOf(it.screen), it) }
            .sortedBy { it.first }
            .asReversed()
            .forEach { (_, operation) -> container.enqueuePopOperation(operation.screen) }

        pendingPushOperations
            .map { Pair(renderedScreens.indexOf(it.screen), it) }
            .sortedBy { it.first }
            .forEach { (_, operation) -> container.enqueuePushOperation(operation.screen) }

        container.performContainerUpdateIfNeeded()

        pendingPopOperations.clear()
        pendingPushOperations.clear()
    }
}

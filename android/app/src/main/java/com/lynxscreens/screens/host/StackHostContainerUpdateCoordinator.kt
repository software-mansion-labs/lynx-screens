package com.lynxscreens.screens.host

import com.lynxscreens.screens.screen.StackScreenComponent

internal class StackHostContainerUpdateCoordinator {
    private val pendingPushOperations: MutableList<PushOperation> = arrayListOf()
    private val pendingPopOperations: MutableList<PopOperation> = arrayListOf()

    private val hasPendingOperations: Boolean
        get() = pendingPushOperations.isNotEmpty() || pendingPopOperations.isNotEmpty()

    internal fun addPushOperation(stackScreen: StackScreenComponent) {
        pendingPushOperations.add(PushOperation(stackScreen))
    }

    internal fun addPopOperation(stackScreen: StackScreenComponent) {
        pendingPopOperations.add(PopOperation(stackScreen))
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

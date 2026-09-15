package com.lynxscreens.screens.common.trace

import org.junit.Assert.*
import org.junit.Test

class NavigationTraceContextStoreTest {
    private val session = TraceSession("runtime", "navigator")
    private val stack = ExpectedTraceChange.Stack(listOf("A", "B"), listOf("A", "C"))

    private fun binding(id: String, change: ExpectedTraceChange) =
        NavigationTraceContext(
            id,
            1,
            "REPLACE",
            "B",
            "C",
            session = session,
            expectedChange = change,
        )

    @Test
    fun matchesTheWholeStackRatherThanJustEndpoints() {
        val batch = TraceBatch(session, 1, listOf(binding("one", stack)))
        assertNull(
            batch.consume("stack:1", ExpectedTraceChange.Stack(listOf("X", "B"), listOf("X", "C")))
        )
    }

    @Test
    fun consumesExactlyOncePerContainer() {
        val batch = TraceBatch(session, 1, listOf(binding("one", stack)))
        assertEquals("one", batch.consume("stack:1", stack)?.navigationTraceId)
        assertNull(batch.consume("stack:1", stack))
        assertEquals("one", batch.consume("stack:2", stack)?.navigationTraceId)
    }

    @Test
    fun ambiguousBindingsStayUnlinked() {
        val batch = TraceBatch(session, 1, listOf(binding("one", stack), binding("two", stack)))
        assertNull(batch.consume("stack:1", stack))
    }

    @Test
    fun sheetAndStackConsumeIndependently() {
        val sheet = ExpectedTraceChange.Sheet("S", true, false)
        val batch = TraceBatch(session, 1, listOf(binding("one", stack), binding("one", sheet)))
        assertNotNull(batch.consume("stack:1", stack))
        assertNotNull(batch.consume("sheet:1", sheet))
    }

    @Test
    fun aDelayedOperationRetainsItsOriginalBatch() {
        val captured = TraceBatch(session, 1, listOf(binding("old", stack)))
        val newer = TraceBatch(session, 2, listOf(binding("new", stack)))
        assertEquals("old", captured.consume("stack:1", stack)?.navigationTraceId)
        assertEquals("new", newer.consume("stack:1", stack)?.navigationTraceId)
    }
}

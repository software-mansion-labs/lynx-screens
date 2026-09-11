package com.lynxscreens.screens.common.trace

import com.lynx.tasm.event.LynxCustomEvent
import java.util.UUID

internal data class NavigationTraceContext(
    val navigationTraceId: String,
    val sequence: Long,
    val action: String,
    val sourceScreenKey: String?,
    val targetScreenKey: String?,
    val preloadTraceId: String? = null,
    val session: TraceSession? = null,
    val expectedChange: ExpectedTraceChange? = null,
)

internal data class NavigationTraceIdentity(
    val navigationTraceId: String?,
    val nativeTransitionId: String?,
    val preloadTraceId: String? = null,
    val containerId: String = "",
    val runtimeId: String? = null,
    val navigatorKey: String? = null,
    val screenKey: String? = null,
    val contentScopeId: String? = null,
) {
    // A View lifecycle notification is not necessarily caused by navigation.
    fun withoutOperation() =
        copy(navigationTraceId = null, nativeTransitionId = null, preloadTraceId = null)

    fun addTo(event: LynxCustomEvent) {
        if (containerId.isEmpty()) return
        val values = linkedMapOf<String, Any>("version" to 1, "containerId" to containerId)
        listOf(
                "runtimeId" to runtimeId,
                "navigatorKey" to navigatorKey,
                "navigationTraceId" to navigationTraceId,
                "nativeTransitionId" to nativeTransitionId,
                "preloadTraceId" to preloadTraceId,
                "screenKey" to screenKey,
                "contentScopeId" to contentScopeId,
            )
            .forEach { (key, value) -> if (value != null) values[key] = value }
        try {
            event.addDetail("traceIdentity", values)
        } catch (_: Exception) {
            /* Observation only. */
        }
    }

    fun arguments(vararg fields: Pair<String, Any?>): Map<String, String> =
        LynxScreensTrace.argumentsOf(
            "runtime_id" to runtimeId,
            "navigator_key" to navigatorKey,
            "container_id" to containerId,
            "navigation_trace_id" to navigationTraceId,
            "native_transition_id" to nativeTransitionId,
            "preload_trace_id" to preloadTraceId,
            "screen_key" to screenKey,
            "content_scope_id" to contentScopeId,
            *fields,
        )
}

internal class NavigationTraceContextStore {
    var session: TraceSession? = null
        private set

    private var current: TraceBatch? = null
    private var lastSequence = -1L

    fun setSession(value: String?) {
        val next = TraceSession.parse(value)
        if (next != session) {
            current = null
            lastSequence = -1
            session = next
        }
    }

    fun update(serialized: String?) {
        current = null
        val json = traceObject(serialized) ?: return
        val active = session ?: return
        if (
            json.traceId("runtimeId") != active.runtimeId ||
                json.traceId("navigatorKey") != active.navigatorKey
        )
            return
        val number = json.opt("sequence") as? Number ?: return
        val sequence = number.toLong()
        if (
            sequence < 0 ||
                sequence > 9007199254740991L ||
                number.toDouble() != sequence.toDouble() ||
                sequence <= lastSequence
        )
            return
        val array = json.optJSONArray("bindings") ?: return
        if (array.length() > 256) return
        val bindings =
            (0 until array.length()).map { i ->
                val value = array.optJSONObject(i) ?: return
                NavigationTraceContext(
                    value.traceId("navigationTraceId") ?: return,
                    sequence,
                    value.traceId("actionType") ?: return,
                    value.traceId("sourceScreenKey"),
                    value.traceId("targetScreenKey"),
                    value.traceId("preloadTraceId"),
                    active,
                    ExpectedTraceChange.parse(value.optJSONObject("expectedChange") ?: return)
                        ?: return,
                )
            }
        lastSequence = sequence
        current = TraceBatch(active, sequence, bindings)
    }

    fun captureBatch(): TraceBatch? = current

    fun endBatch(batch: TraceBatch?) {
        if (current === batch) current = null
    }

    fun clear() {
        current = null
        session = null
        lastSequence = -1
    }
}

internal object NativeNavigationTraceIdGenerator {
    @Suppress("UNUSED_PARAMETER")
    fun create(containerId: String): String = "native:${UUID.randomUUID()}"
}

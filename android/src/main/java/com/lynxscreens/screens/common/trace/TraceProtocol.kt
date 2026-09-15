package com.lynxscreens.screens.common.trace

import android.content.Context
import java.lang.ref.WeakReference
import java.util.WeakHashMap
import org.json.JSONObject

internal fun JSONObject.traceId(key: String): String? =
    (opt(key) as? String)?.takeIf { it.isNotEmpty() && it.length <= 1024 }

internal fun traceObject(serialized: String?): JSONObject? =
    try {
        serialized
            ?.takeIf { it.length <= 65536 }
            ?.let(::JSONObject)
            ?.takeIf { it.opt("version") == 1 }
    } catch (_: Exception) {
        null
    }

internal data class TraceSession(val runtimeId: String, val navigatorKey: String) {
    companion object {
        fun parse(value: String?): TraceSession? {
            val json = traceObject(value) ?: return null
            if (json.opt("enabled") != true) return null
            return TraceSession(
                json.traceId("runtimeId") ?: return null,
                json.traceId("navigatorKey") ?: return null,
            )
        }
    }
}

internal data class ContentTraceIdentity(
    val session: TraceSession,
    val screenKey: String,
    val contentScopeId: String,
) {
    fun identity(containerId: String, transition: NavigationTraceIdentity? = null) =
        NavigationTraceIdentity(
            transition?.navigationTraceId,
            transition?.nativeTransitionId,
            transition?.preloadTraceId,
            containerId,
            session.runtimeId,
            session.navigatorKey,
            screenKey,
            contentScopeId,
        )

    companion object {
        fun parse(value: String?): ContentTraceIdentity? {
            val json = traceObject(value) ?: return null
            return ContentTraceIdentity(
                TraceSession(
                    json.traceId("runtimeId") ?: return null,
                    json.traceId("navigatorKey") ?: return null,
                ),
                json.traceId("screenKey") ?: return null,
                json.traceId("contentScopeId") ?: return null,
            )
        }
    }
}

internal sealed class ExpectedTraceChange {
    data class Stack(val before: List<String>, val after: List<String>) : ExpectedTraceChange()

    data class Sheet(val screenKey: String, val fromOpen: Boolean, val toOpen: Boolean) :
        ExpectedTraceChange()

    companion object {
        fun parse(json: JSONObject): ExpectedTraceChange? {
            fun keys(name: String): List<String>? {
                val array = json.optJSONArray(name) ?: return null
                if (array.length() > 256) return null
                return (0 until array.length()).map {
                    (array.opt(it) as? String)?.takeIf { key ->
                        key.isNotEmpty() && key.length <= 1024
                    } ?: return null
                }
            }
            return when (json.optString("kind")) {
                "stack" ->
                    Stack(
                        keys("beforeScreenKeys") ?: return null,
                        keys("afterScreenKeys") ?: return null,
                    )
                "sheet" ->
                    Sheet(
                        json.traceId("screenKey") ?: return null,
                        json.opt("fromOpen") as? Boolean ?: return null,
                        json.opt("toOpen") as? Boolean ?: return null,
                    )
                else -> null
            }
        }
    }
}

/** One immutable envelope from the current UI update; consumption is per receiving target. */
internal class TraceBatch(
    val session: TraceSession,
    val sequence: Long,
    val bindings: List<NavigationTraceContext>,
) {
    private val consumed = mutableSetOf<String>()

    fun consume(target: String, expected: ExpectedTraceChange): NavigationTraceContext? {
        if (target in consumed) return null
        consumed.add(target)
        return bindings.filter { it.expectedChange == expected }.singleOrNull()
    }
}

/** Weak context keys isolate Lynx instances. Only the live Host owns its scope strongly. */
internal object NavigatorTraceScopes {
    private val hosts =
        WeakHashMap<Context, MutableMap<TraceSession, WeakReference<NavigationTraceContextStore>>>()

    fun register(context: Context, session: TraceSession, store: NavigationTraceContextStore) {
        hosts.getOrPut(context) { mutableMapOf() }[session] = WeakReference(store)
    }

    fun find(context: Context, session: TraceSession?): NavigationTraceContextStore? =
        session?.let { hosts[context]?.get(it)?.get() }

    fun remove(context: Context, session: TraceSession?, store: NavigationTraceContextStore) {
        if (find(context, session) === store) hosts[context]?.remove(session)
    }
}

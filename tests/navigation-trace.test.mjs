import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeTrace, decodeNativeEvent } from '../src/internal/trace/codec.ts';

test('untraced native callbacks preserve existing fields without inventing identity', () => {
  const result = decodeNativeEvent(
    { detail: { isNativeDismiss: true, dismissCount: 2, channel: 'back' } },
    'OnDismiss',
  );
  assert.equal(result.traceIdentity, undefined);
  assert.equal(result.isNativeDismiss, true);
  assert.equal(result.dismissCount, 2);
  assert.equal(result.channel, 'back');
});
test('identity is copied, immutable, and excludes unknown fields', () => {
  const identity = {
    version: 1,
    containerId: 'stack:1',
    navigationTraceId: 'native:1',
    contentScopeId: 'content:1',
    secret: 'ignore',
  };
  const result = decodeNativeEvent(
    { detail: { traceIdentity: identity } },
    'OnDismiss',
  );
  identity.navigationTraceId = 'native:2';
  assert.equal(result.traceIdentity.navigationTraceId, 'native:1');
  assert.equal(result.traceIdentity.secret, undefined);
  assert.ok(Object.isFrozen(result.traceIdentity));
});
test('unsupported, malformed and oversized identity safely remain unlinked', () => {
  for (const identity of [
    { version: 2, containerId: 's' },
    { version: 1, containerId: '' },
    { version: 1, containerId: 's', runtimeId: 1 },
    { version: 1, containerId: 's', navigationTraceId: 'x'.repeat(1025) },
  ]) {
    assert.equal(
      decodeNativeEvent({ detail: { traceIdentity: identity } }, 'OnDismiss')
        .traceIdentity,
      undefined,
    );
  }
  assert.doesNotThrow(() =>
    decodeNativeEvent(
      {
        get detail() {
          throw Error('decoder');
        },
      },
      'OnDismiss',
    ),
  );
});
test('serialization failures and oversized contexts do not escape the bridge', () => {
  const cycle = {};
  cycle.self = cycle;
  assert.equal(encodeTrace(cycle), undefined);
  assert.equal(encodeTrace({ data: 'x'.repeat(65537) }), undefined);
  assert.equal(encodeTrace(undefined), undefined);
  assert.equal(encodeTrace({ version: 1 }), '{"version":1}');
});

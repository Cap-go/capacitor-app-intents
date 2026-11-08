import assert from 'node:assert/strict';
import test from 'node:test';

function isAwaitingResult(invocation) {
  if (invocation.awaitingResult === true) {
    return true;
  }
  return invocation.params['__capgoAwaitingResult'] === true;
}

test('isAwaitingResult reads awaitingResult and params flag', () => {
  assert.equal(
    isAwaitingResult({
      id: '1',
      name: 'test',
      params: {},
      source: 'app_intent',
      createdAt: 0,
      awaitingResult: true,
    }),
    true,
  );
  assert.equal(
    isAwaitingResult({
      id: '2',
      name: 'test',
      params: { __capgoAwaitingResult: true },
      source: 'app_intent',
      createdAt: 0,
    }),
    true,
  );
  assert.equal(
    isAwaitingResult({
      id: '3',
      name: 'test',
      params: {},
      source: 'app_intent',
      createdAt: 0,
    }),
    false,
  );
});

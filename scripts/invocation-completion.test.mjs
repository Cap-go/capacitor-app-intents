import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { isAwaitingResult } = require('../dist/plugin.cjs.js');

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

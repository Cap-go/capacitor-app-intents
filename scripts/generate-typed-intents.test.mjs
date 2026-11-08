import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..');
const script = path.join(repoRoot, 'scripts/generate-typed-intents.mjs');
const config = path.join(repoRoot, 'app-intents.codegen.example.json');

test('generate-typed-intents writes tool intent and shortcuts provider', () => {
  const outputDir = path.join(os.tmpdir(), `capgo-intents-${Date.now()}`);
  execFileSync(process.execPath, [script, '--config', config, '--output-dir', outputDir], {
    cwd: repoRoot,
  });
  const intentFile = path.join(outputDir, 'OrderDishToolIntent.swift');
  const shortcutsFile = path.join(outputDir, 'CapgoGeneratedAppShortcuts.swift');
  const intentSwift = fs.readFileSync(intentFile, 'utf8');
  const shortcutsSwift = fs.readFileSync(shortcutsFile, 'utf8');
  assert.match(intentSwift, /struct OrderDishToolIntent: AppIntent/);
  assert.match(intentSwift, /awaitsJavaScriptResult: true/);
  assert.match(shortcutsSwift, /intent: OrderDishToolIntent\(\)/);
  fs.rmSync(outputDir, { recursive: true, force: true });
});

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadCodegenConfig } from './capgo-intent-codegen-lib.mjs';
import {
  describeMixedShortcutOmissions,
  generateShortcutsProviderSwift,
} from './generate-typed-intents.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');
const script = path.join(repoRoot, 'scripts/generate-typed-intents.mjs');
const config = path.join(repoRoot, 'app-intents.codegen.example.json');

function runCodegen(configPath, outputDir) {
  const result = spawnSync(process.execPath, [script, '--config', configPath, '--output-dir', outputDir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function writeTempConfig(name, body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'capgo-intent-cfg-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, JSON.stringify(body, null, 2), 'utf8');
  return { dir, file };
}

test('generate-typed-intents writes tool intent and shortcuts provider (mixed config)', () => {
  const outputDir = path.join(os.tmpdir(), `capgo-intents-${Date.now()}`);
  try {
    const { stderr } = runCodegen(config, outputDir);
    assert.match(stderr, /warning: Capgo codegen: omitting App Shortcut Siri phrases for \[Order dish\]/);
    const intentFile = path.join(outputDir, 'OrderDishToolIntent.swift');
    const shortcutsFile = path.join(outputDir, 'CapgoGeneratedAppShortcuts.swift');
    const intentSwift = fs.readFileSync(intentFile, 'utf8');
    const shortcutsSwift = fs.readFileSync(shortcutsFile, 'utf8');
    assert.match(intentSwift, /struct OrderDishToolIntent: AppIntent/);
    assert.match(intentSwift, /@available\(iOS 17\.0, \*\)/);
    assert.match(intentSwift, /ReturnsValue<String>/);
    assert.match(intentSwift, /Summary \{\s*\\\.\$dish/s);
    assert.match(shortcutsSwift, /@available\(iOS 16\.0, \*\)/);
    assert.match(shortcutsSwift, /#warning\("Capgo codegen omitted App Shortcut Siri phrases for: Order dish/);
    assert.match(shortcutsSwift, /@AppShortcutsBuilder/);
    assert.match(shortcutsSwift, /intent: CapgoDispatchAppIntent/);
    assert.match(shortcutsSwift, /one AppShortcutsProvider per app/);
    assert.doesNotMatch(shortcutsSwift, /intent: OrderDishToolIntent\(\)/);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('mixed config describeMixedShortcutOmissions lists omitted tool shortcuts', () => {
  const cfg = loadCodegenConfig(config);
  const omission = describeMixedShortcutOmissions(cfg);
  assert.ok(omission);
  assert.deepEqual(omission.omittedShortTitles, ['Order dish']);
});

test('AppShortcutsProvider is iOS 17 when every shortcut needs iOS 17', () => {
  const { file, dir } = writeTempConfig('all-ios17.json', {
    providerName: 'TestShortcuts',
    shortcuts: [
      {
        actionName: 'orderDish',
        shortTitle: 'Order dish',
        phrases: ['Order in {{applicationName}}'],
        intent: 'OrderDishToolIntent',
      },
    ],
    intents: [
      {
        name: 'OrderDishToolIntent',
        actionName: 'orderDish',
        title: 'Order dish',
        awaitJavaScriptResult: true,
        parameters: [],
      },
    ],
  });
  try {
    const swift = generateShortcutsProviderSwift(loadCodegenConfig(file));
    assert.match(swift, /@available\(iOS 17\.0, \*\)/);
    assert.match(swift, /intent: OrderDishToolIntent\(\)/);
    assert.doesNotMatch(swift, /#warning/);
    assert.equal(describeMixedShortcutOmissions(loadCodegenConfig(file)), null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('AppShortcutsProvider is iOS 16 when every shortcut is dispatch', () => {
  const { file, dir } = writeTempConfig('all-ios16.json', {
    providerName: 'TestShortcuts',
    shortcuts: [
      {
        actionName: 'openMenu',
        shortTitle: 'Open menu',
        phrases: ['Open menu in {{applicationName}}'],
        intent: 'CapgoDispatchAppIntent',
      },
    ],
    intents: [],
  });
  try {
    const loaded = loadCodegenConfig(file);
    const swift = generateShortcutsProviderSwift(loaded);
    assert.match(swift, /@available\(iOS 16\.0, \*\)/);
    assert.match(swift, /intent: CapgoDispatchAppIntent/);
    assert.doesNotMatch(swift, /#warning/);
    assert.equal(describeMixedShortcutOmissions(loaded), null);
    const outputDir = path.join(dir, 'out');
    const { stderr } = runCodegen(file, outputDir);
    assert.doesNotMatch(stderr, /omitting App Shortcut Siri phrases/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('mixed config fails test if shortcuts drop without warning markers', () => {
  const loaded = loadCodegenConfig(config);
  const swift = generateShortcutsProviderSwift(loaded);
  const dropsToolShortcut = !/intent: OrderDishToolIntent\(\)/.test(swift);
  assert.ok(dropsToolShortcut);
  assert.match(swift, /#warning/);
  assert.match(swift, /omitted from this AppShortcutsProvider/);
});
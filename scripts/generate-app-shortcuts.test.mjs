import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..');
const script = path.join(repoRoot, 'scripts/generate-app-shortcuts.mjs');
const config = path.join(repoRoot, 'app-shortcuts.config.example.json');

test('generate-app-shortcuts writes AppShortcutsProvider with phrases and icons', () => {
  const output = path.join(os.tmpdir(), `CapgoGeneratedAppShortcuts-${Date.now()}.swift`);
  execFileSync(process.execPath, [script, '--config', config, '--output', output], {
    cwd: repoRoot,
  });
  const swift = fs.readFileSync(output, 'utf8');
  assert.match(swift, /struct CapgoGeneratedAppShortcuts: AppShortcutsProvider/);
  assert.match(swift, /systemImageName: "fork.knife"/);
  assert.ok(swift.includes('Order a dish in \\(.applicationName)'));
  fs.unlinkSync(output);
});

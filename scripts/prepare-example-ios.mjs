#!/usr/bin/env node
/**
 * Regenerate example App Intents artifacts into ios/App/App and patch Xcode project.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exampleRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(repoRoot, 'example-app');

function runNode(script, args) {
  const result = spawnSync(process.execPath, [path.join(repoRoot, 'scripts', script), ...args], {
    cwd: exampleRoot,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runNode('generate-typed-intents.mjs', [
  '--config',
  'app-intents.codegen.json',
  '--output-dir',
  'ios/App/App/GeneratedAppIntents',
]);

runNode('generate-skills-bundle.mjs', [
  '--config',
  'app-intents.codegen.json',
  '--output',
  'ios/App/App/Skills.skillsbundle',
]);

const patch = spawnSync(
  process.execPath,
  [path.join(repoRoot, 'scripts', 'patch-ios-example-app-intents.mjs'), exampleRoot],
  { stdio: 'inherit' },
);
if (patch.status !== 0) {
  process.exit(patch.status ?? 1);
}
#!/usr/bin/env node
/**
 * Build the parent plugin only when example-app depends on file:.. (local dev).
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const exampleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(exampleRoot, 'package.json'), 'utf8'));
const dep = pkg.dependencies?.['@capgo/capacitor-app-intents'];

if (typeof dep !== 'string' || !dep.startsWith('file:..')) {
  process.exit(0);
}

const parentRoot = path.join(exampleRoot, '..');
const parentPkg = path.join(parentRoot, 'package.json');
if (!existsSync(parentPkg)) {
  process.exit(0);
}

const result = spawnSync('bun', ['run', 'build'], { cwd: parentRoot, stdio: 'inherit' });
process.exit(result.status ?? 0);
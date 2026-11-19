import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..');
const script = path.join(repoRoot, 'scripts/generate-skills-bundle.mjs');
const config = path.join(repoRoot, 'app-intents.codegen.example.json');

test('generate-skills-bundle writes SKILL.md with frontmatter', () => {
  const output = path.join(os.tmpdir(), `Skills.skillsbundle-${Date.now()}`);
  try {
    execFileSync(process.execPath, [script, '--config', config, '--output', output], {
      cwd: repoRoot,
    });
    const skillFile = path.join(output, 'Skills', 'order-meal', 'SKILL.md');
    const markdown = fs.readFileSync(skillFile, 'utf8');
    assert.match(markdown, /^---\nname: order-meal\ndescription: /);
    assert.match(markdown, /order dish tool/);
    assert.ok(fs.existsSync(path.join(output, 'Skills', 'order-meal', '.capgo-generated')));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

#!/usr/bin/env node
/**
 * Generate and validate Skills.skillsbundle from codegen config or SKILL.md sources.
 *
 * Usage:
 *   node scripts/generate-skills-bundle.mjs --config app-intents.codegen.example.json --output Skills.skillsbundle
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  loadCodegenConfig,
  validateSkillBody,
  validateSkillDescription,
  validateSkillName,
} from './capgo-intent-codegen-lib.mjs';

function parseArgs(argv) {
  const args = { config: 'app-intents.codegen.example.json', output: 'Skills.skillsbundle' };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--config' && argv[i + 1]) {
      args.config = argv[++i];
    } else if (token === '--output' && argv[i + 1]) {
      args.output = argv[++i];
    } else if (token === '--help' || token === '-h') {
      args.help = true;
    }
  }
  return args;
}

function yamlQuotedString(value) {
  return JSON.stringify(value.trim());
}

function writeSkillMarkdown(skill, skillFilePath) {
  const body = skill.body ?? '';
  validateSkillName(skill.name);
  validateSkillDescription(skill.description);
  validateSkillBody(body);
  const content = `---\nname: ${skill.name}\ndescription: ${yamlQuotedString(skill.description)}\n---\n${body.trim() ? `${body.trim()}\n` : ''}`;
  fs.mkdirSync(path.dirname(skillFilePath), { recursive: true });
  fs.writeFileSync(skillFilePath, content, 'utf8');
}

const args = parseArgs(process.argv);
if (args.help) {
  console.log(
    'Usage: node scripts/generate-skills-bundle.mjs --config <file> --output <Skills.skillsbundle>',
  );
  process.exit(0);
}

const configPath = path.resolve(process.cwd(), args.config);
const outputRoot = path.resolve(process.cwd(), args.output);
const skillsRoot = path.join(outputRoot, 'Skills');

const config = loadCodegenConfig(configPath);
const skills = config.skills ?? [];

if (skills.length === 0) {
  throw new Error('config.skills must contain at least one skill entry');
}

fs.mkdirSync(skillsRoot, { recursive: true });

const used = new Set();
for (const skill of skills) {
  if (used.has(skill.name)) {
    throw new Error(`duplicate skill name ${skill.name}`);
  }
  used.add(skill.name);
  const skillDir = path.join(skillsRoot, skill.name);
  writeSkillMarkdown(skill, path.join(skillDir, 'SKILL.md'));
  console.log(`Wrote ${path.join(skillDir, 'SKILL.md')}`);
}

if (fs.existsSync(skillsRoot)) {
  for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && !used.has(entry.name)) {
      fs.rmSync(path.join(skillsRoot, entry.name), { recursive: true, force: true });
      console.log(`Removed obsolete skill ${entry.name}`);
    }
  }
}

console.log(`Validated ${skills.length} skill(s) under ${outputRoot}`);
console.log('Add Skills.skillsbundle to your iOS app target Copy Bundle Resources build phase.');

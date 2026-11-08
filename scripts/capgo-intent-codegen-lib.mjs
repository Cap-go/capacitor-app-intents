#!/usr/bin/env node
import fs from 'node:fs';

export function escapeSwiftString(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

export function phraseToSwiftLiteral(phrase) {
  const escaped = escapeSwiftString(phrase);
  const withAppName = escaped.replace(/\{\{applicationName\}\}/g, '\\(.applicationName)');
  return `"${withAppName}"`;
}

export function validateSkillName(name) {
  if (typeof name !== 'string' || name.length < 1 || name.length > 64) {
    throw new Error(`skill name must be 1-64 characters: ${name}`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`skill name must be lowercase kebab-case: ${name}`);
  }
}

export function validateSkillDescription(description) {
  if (typeof description !== 'string' || description.trim().length === 0) {
    throw new Error('skill description is required');
  }
  if (description.includes('\n')) {
    throw new Error('skill description must be a single line');
  }
  if (description.length > 1024) {
    throw new Error('skill description must be <= 1024 characters');
  }
}

export function validateSkillBody(body) {
  if (typeof body !== 'string') {
    throw new Error('skill body must be a string');
  }
  if (body.length > 10000) {
    throw new Error('skill body must be <= 10000 characters');
  }
}

export function validateParameters(parameters = []) {
  if (!Array.isArray(parameters)) {
    throw new Error('intent.parameters must be an array');
  }
  for (const parameter of parameters) {
    if (!parameter.name || !parameter.title || !parameter.type) {
      throw new Error('each intent parameter needs name, title, and type');
    }
    const allowed = new Set(['string', 'int', 'bool', 'entity']);
    if (!allowed.has(parameter.type)) {
      throw new Error(`unsupported parameter type ${parameter.type}`);
    }
    if (parameter.type === 'entity' && !parameter.entityType) {
      throw new Error(`entity parameter ${parameter.name} needs entityType`);
    }
  }
}

export function validateCodegenConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('config must be an object');
  }

  if (Array.isArray(config.intents)) {
    for (const intent of config.intents) {
      if (!intent.name || !intent.actionName || !intent.title) {
        throw new Error('each intent needs name, actionName, and title');
      }
      validateParameters(intent.parameters ?? []);
    }
  }

  if (Array.isArray(config.shortcuts)) {
    if (config.shortcuts.length === 0) {
      throw new Error('config.shortcuts must be a non-empty array when present');
    }
    for (const shortcut of config.shortcuts) {
      if (!shortcut.actionName || !shortcut.shortTitle) {
        throw new Error('Each shortcut needs actionName and shortTitle');
      }
      if (!Array.isArray(shortcut.phrases) || shortcut.phrases.length === 0) {
        throw new Error(`Shortcut ${shortcut.actionName} needs at least one phrase`);
      }
      for (const phrase of shortcut.phrases) {
        if (!phrase.includes('{{applicationName}}')) {
          throw new Error(
            `Shortcut ${shortcut.actionName} phrase must include {{applicationName}}: ${phrase}`,
          );
        }
      }
    }
  }

  if (Array.isArray(config.skills)) {
    for (const skill of config.skills) {
      validateSkillName(skill.name);
      validateSkillDescription(skill.description);
      validateSkillBody(skill.body ?? '');
    }
  }
}

export function swiftTypeForParameter(parameter) {
  switch (parameter.type) {
    case 'string':
      return 'String';
    case 'int':
      return 'Int';
    case 'bool':
      return 'Bool';
    case 'entity':
      return parameter.entityType;
    default:
      throw new Error(`unsupported parameter type ${parameter.type}`);
  }
}

export function parameterPropertyBlock(parameters) {
  return parameters
    .map((parameter) => {
      const swiftType = swiftTypeForParameter(parameter);
      const title = escapeSwiftString(parameter.title);
      const optional = parameter.optional ? '?' : '';
      const defaultClause =
        parameter.type === 'int' && parameter.default !== undefined
          ? `, default: ${parameter.default}`
          : parameter.type === 'bool' && parameter.default !== undefined
            ? `, default: ${parameter.default}`
            : parameter.type === 'string' && parameter.default !== undefined
              ? `, default: "${escapeSwiftString(String(parameter.default))}"`
              : '';
      return `    @Parameter(title: "${title}"${defaultClause})\n    public var ${parameter.name}: ${swiftType}${optional}`;
    })
    .join('\n\n');
}

export function parameterSummaryArgs(parameters) {
  if (!parameters.length) {
    return '';
  }
  return parameters.map((parameter) => `\\(.\\$${parameter.name})`).join(', ');
}

export function collectParamsFromParameters(parameters) {
  const lines = [];
  for (const parameter of parameters) {
    if (parameter.type === 'entity') {
      const prefix = parameter.optional
        ? `        if let ${parameter.name} {`
        : '';
      const suffix = parameter.optional ? '        }' : '';
      const inner = [
        `            params["${parameter.name}CatalogType"] = ${parameter.name}.catalogType`,
        `            params["${parameter.name}EntityId"] = ${parameter.name}.entityId`,
        `            params["${parameter.name}Title"] = ${parameter.name}.title`,
      ].join('\n');
      if (parameter.optional) {
        lines.push(prefix, inner, suffix);
      } else {
        lines.push(inner);
      }
      continue;
    }
    lines.push(`        params["${parameter.name}"] = ${parameter.name}`);
  }
  return lines.join('\n');
}

export function loadCodegenConfig(configPath) {
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(raw);
  validateCodegenConfig(config);
  return config;
}

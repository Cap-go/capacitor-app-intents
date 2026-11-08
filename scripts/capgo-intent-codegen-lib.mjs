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
    validateSwiftParameterName(parameter.name);
    if (parameter.entityType) {
      validateSwiftStructName(parameter.entityType, `parameter ${parameter.name} entityType`);
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

const SWIFT_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const SWIFT_STRUCT_NAME = /^[A-Z][A-Za-z0-9]*$/;

export function validateSwiftStructName(name, label) {
  if (typeof name !== 'string' || !SWIFT_STRUCT_NAME.test(name)) {
    throw new Error(`${label} must be a valid Swift type name: ${name}`);
  }
  if (name.includes('/') || name.includes('..')) {
    throw new Error(`${label} must not contain path separators: ${name}`);
  }
}

export function validateSwiftParameterName(name) {
  if (typeof name !== 'string' || !SWIFT_IDENTIFIER.test(name)) {
    throw new Error(`parameter name must be a valid Swift identifier: ${name}`);
  }
}

export function validateCodegenConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('config must be an object');
  }

  if (config.defaultInvocationTimeoutSeconds !== undefined) {
    const timeout = Number(config.defaultInvocationTimeoutSeconds);
    if (!Number.isFinite(timeout) || timeout < 1 || timeout > 600) {
      throw new Error('defaultInvocationTimeoutSeconds must be between 1 and 600');
    }
  }

  if (config.skills !== undefined && !Array.isArray(config.skills)) {
    throw new Error('config.skills must be an array when present');
  }

  if (Array.isArray(config.intents)) {
    for (const intent of config.intents) {
      if (!intent.name || !intent.actionName || !intent.title) {
        throw new Error('each intent needs name, actionName, and title');
      }
      validateSwiftStructName(intent.name, 'intent.name');
      validateSwiftParameterName(intent.actionName);
      if (intent.timeoutSeconds !== undefined) {
        const timeout = Number(intent.timeoutSeconds);
        if (!Number.isFinite(timeout) || timeout < 1 || timeout > 600) {
          throw new Error(`intent ${intent.name} timeoutSeconds must be between 1 and 600`);
        }
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

function catalogEntityParamLines(parameter) {
  const inner = [
    `            params["${parameter.name}CatalogType"] = ${parameter.name}.catalogType`,
    `            params["${parameter.name}EntityId"] = ${parameter.name}.entityId`,
    `            params["${parameter.name}Title"] = ${parameter.name}.title`,
  ].join('\n');
  if (parameter.optional) {
    return [
      `        if let ${parameter.name} {`,
      inner,
      '        }',
    ];
  }
  return [inner];
}

function genericEntityParamLines(parameter) {
  const inner = [`            params["${parameter.name}Id"] = ${parameter.name}.id`];
  if (parameter.optional) {
    return [
      `        if let ${parameter.name} {`,
      ...inner,
      '        }',
    ];
  }
  return inner;
}

export function collectParamsFromParameters(parameters) {
  const lines = [];
  for (const parameter of parameters) {
    if (parameter.type === 'entity') {
      const block =
        parameter.entityType === 'CapgoCatalogEntity'
          ? catalogEntityParamLines(parameter)
          : genericEntityParamLines(parameter);
      lines.push(...block);
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

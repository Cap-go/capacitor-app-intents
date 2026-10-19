#!/usr/bin/env node
/**
 * Add a Swift source file to the Capacitor iOS App target in project.pbxproj.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

function uuid() {
  return randomBytes(12).toString('hex').toUpperCase();
}

function patchPbxproj(pbxPath, fileName) {
  let pbx = fs.readFileSync(pbxPath, 'utf8');
  if (pbx.includes(fileName)) {
    return;
  }

  const fileRefId = uuid();
  const buildFileId = uuid();

  pbx = pbx.replace(
    '/* End PBXBuildFile section */',
    `\t\t${buildFileId} /* ${fileName} in Sources */ = {isa = PBXBuildFile; fileRef = ${fileRefId} /* ${fileName} */; };\n/* End PBXBuildFile section */`,
  );

  pbx = pbx.replace(
    '/* End PBXFileReference section */',
    `\t\t${fileRefId} /* ${fileName} */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ${fileName}; sourceTree = "<group>"; };\n/* End PBXFileReference section */`,
  );

  const appGroupMatch = pbx.match(
    /(\t\t[A-F0-9]+ \/\* App \*\/ = \{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = \(\n)([\s\S]*?)(\t\t\t\);)/,
  );
  if (!appGroupMatch) {
    throw new Error('Could not find App PBXGroup in project.pbxproj');
  }
  pbx = pbx.replace(
    appGroupMatch[0],
    `${appGroupMatch[1]}${appGroupMatch[2]}\t\t\t\t${fileRefId} /* ${fileName} */,\n${appGroupMatch[3]}`,
  );

  const sourcesMatch = pbx.match(
    /(\t\t[A-F0-9]+ \/\* Sources \*\/ = \{[\s\S]*?files = \(\n)([\s\S]*?)(\n\t\t\t\);\n\t\t\trunOnlyForDeploymentPostprocessing)/,
  );
  if (!sourcesMatch) {
    throw new Error('Could not find PBXSourcesBuildPhase in project.pbxproj');
  }
  pbx = pbx.replace(
    sourcesMatch[0],
    `${sourcesMatch[1]}${sourcesMatch[2].trimEnd()}\n\t\t\t\t${buildFileId} /* ${fileName} in Sources */,\n${sourcesMatch[3]}`,
  );

  fs.writeFileSync(pbxPath, pbx, 'utf8');
}

const pbxproj = process.argv[2];
const fileName = process.argv[3] ?? 'CapgoGeneratedAppShortcuts.swift';

if (!pbxproj) {
  console.error('Usage: node scripts/patch-ios-app-swift-source.mjs <path/to/project.pbxproj> [fileName]');
  process.exit(1);
}

patchPbxproj(path.resolve(pbxproj), fileName);
console.log(`Patched ${pbxproj} with ${fileName}`);

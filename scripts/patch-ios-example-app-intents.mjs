#!/usr/bin/env node
/**
 * Ensure the Capacitor example iOS app builds against iOS 16+ and compiles
 * generated App Intents artifacts (Swift sources + Skills.skillsbundle).
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

function uuid() {
  return randomBytes(12).toString('hex').toUpperCase();
}

function patchDeploymentTarget16(pbxPath, packageSwiftPath) {
  let pbx = fs.readFileSync(pbxPath, 'utf8');
  pbx = pbx.replaceAll('IPHONEOS_DEPLOYMENT_TARGET = 15.0;', 'IPHONEOS_DEPLOYMENT_TARGET = 16.0;');
  fs.writeFileSync(pbxPath, pbx, 'utf8');

  if (packageSwiftPath && fs.existsSync(packageSwiftPath)) {
    let pkg = fs.readFileSync(packageSwiftPath, 'utf8');
    pkg = pkg.replaceAll('.iOS(.v15)', '.iOS(.v16)');
    fs.writeFileSync(packageSwiftPath, pkg, 'utf8');
  }
}

function addSwiftSource(pbx, fileName, groupPath) {
  if (pbx.includes(`/* ${fileName} */`)) {
    return pbx;
  }
  const fileRefId = uuid();
  const buildFileId = uuid();
  const displayPath = groupPath ? `${groupPath}/${fileName}` : fileName;

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

  return pbx;
}

function findGeneratedAppIntentsGroupId(pbx) {
  const match = pbx.match(/\t\t([A-F0-9]+) \/\* GeneratedAppIntents \*\/ = \{/);
  return match ? match[1] : null;
}

function addGeneratedAppIntentsGroup(pbx) {
  const existing = findGeneratedAppIntentsGroupId(pbx);
  if (existing) {
    return { pbx, groupId: existing };
  }
  const groupId = uuid();
  pbx = pbx.replace(
    '/* End PBXGroup section */',
    `\t\t${groupId} /* GeneratedAppIntents */ = {\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t);\n\t\t\tpath = GeneratedAppIntents;\n\t\t\tsourceTree = "<group>";\n\t\t};\n/* End PBXGroup section */`,
  );

  const appGroupMatch = pbx.match(
    /(\t\t[A-F0-9]+ \/\* App \*\/ = \{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = \(\n)([\s\S]*?)(\t\t\t\);)/,
  );
  if (!appGroupMatch) {
    throw new Error('Could not find App PBXGroup in project.pbxproj');
  }
  pbx = pbx.replace(
    appGroupMatch[0],
    `${appGroupMatch[1]}${appGroupMatch[2]}\t\t\t\t${groupId} /* GeneratedAppIntents */,\n${appGroupMatch[3]}`,
  );
  return { pbx, groupId };
}

function addSwiftInGeneratedGroup(pbx, groupId, fileName) {
  if (pbx.includes(`/* ${fileName} in Sources */`)) {
    return pbx;
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

  const groupPattern = new RegExp(
    `(\\t\\t${groupId} \\/\\* GeneratedAppIntents \\*\\/ = \\{[\\s\\S]*?children = \\(\\n)([\\s\\S]*?)(\\t\\t\\t\\);)`,
  );
  const groupMatch = pbx.match(groupPattern);
  if (!groupMatch) {
    throw new Error('Could not find GeneratedAppIntents PBXGroup');
  }
  pbx = pbx.replace(
    groupMatch[0],
    `${groupMatch[1]}${groupMatch[2]}\t\t\t\t${fileRefId} /* ${fileName} */,\n${groupMatch[3]}`,
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
  return pbx;
}

function addSkillsBundleResource(pbx) {
  const bundleName = 'Skills.skillsbundle';
  if (pbx.includes(bundleName)) {
    return pbx;
  }
  const fileRefId = uuid();
  const buildFileId = uuid();

  pbx = pbx.replace(
    '/* End PBXBuildFile section */',
    `\t\t${buildFileId} /* ${bundleName} in Resources */ = {isa = PBXBuildFile; fileRef = ${fileRefId} /* ${bundleName} */; };\n/* End PBXBuildFile section */`,
  );

  pbx = pbx.replace(
    '/* End PBXFileReference section */',
    `\t\t${fileRefId} /* ${bundleName} */ = {isa = PBXFileReference; lastKnownFileType = folder; path = "${bundleName}"; sourceTree = "<group>"; };\n/* End PBXFileReference section */`,
  );

  const appGroupMatch = pbx.match(
    /(\t\t[A-F0-9]+ \/\* App \*\/ = \{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = \(\n)([\s\S]*?)(\t\t\t\);)/,
  );
  if (!appGroupMatch) {
    throw new Error('Could not find App PBXGroup in project.pbxproj');
  }
  pbx = pbx.replace(
    appGroupMatch[0],
    `${appGroupMatch[1]}${appGroupMatch[2]}\t\t\t\t${fileRefId} /* ${bundleName} */,\n${appGroupMatch[3]}`,
  );

  const resourcesMatch = pbx.match(
    /(\t\t[A-F0-9]+ \/\* Resources \*\/ = \{[\s\S]*?files = \(\n)([\s\S]*?)(\n\t\t\t\);\n\t\t\trunOnlyForDeploymentPostprocessing)/,
  );
  if (!resourcesMatch) {
    throw new Error('Could not find PBXResourcesBuildPhase in project.pbxproj');
  }
  pbx = pbx.replace(
    resourcesMatch[0],
    `${resourcesMatch[1]}${resourcesMatch[2].trimEnd()}\n\t\t\t\t${buildFileId} /* ${bundleName} in Resources */,\n${resourcesMatch[3]}`,
  );
  return pbx;
}

function patchExampleAppIntents(exampleAppRoot) {
  const pbxPath = path.join(exampleAppRoot, 'ios/App/App.xcodeproj/project.pbxproj');
  const packageSwiftPath = path.join(exampleAppRoot, 'ios/App/CapApp-SPM/Package.swift');
  const generatedDir = path.join(exampleAppRoot, 'ios/App/App/GeneratedAppIntents');

  if (!fs.existsSync(pbxPath)) {
    console.error(`Missing ${pbxPath}. Run "bunx cap add ios" in example-app first.`);
    process.exit(1);
  }

  let pbx = fs.readFileSync(pbxPath, 'utf8');
  patchDeploymentTarget16(pbxPath, packageSwiftPath);
  pbx = fs.readFileSync(pbxPath, 'utf8');

  const groupResult = addGeneratedAppIntentsGroup(pbx);
  pbx = groupResult.pbx;
  const groupId = groupResult.groupId;

  if (fs.existsSync(generatedDir)) {
    const swiftFiles = fs.readdirSync(generatedDir).filter((name) => name.endsWith('.swift'));
    for (const fileName of swiftFiles.sort()) {
      pbx = addSwiftInGeneratedGroup(pbx, groupId, fileName);
    }
  }

  pbx = addSkillsBundleResource(pbx);
  fs.writeFileSync(pbxPath, pbx, 'utf8');
  console.log(`Patched ${pbxPath} (iOS 16, App Intents sources, Skills.skillsbundle).`);
}

const exampleRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(path.dirname(import.meta.url), '../example-app');

patchExampleAppIntents(exampleRoot);
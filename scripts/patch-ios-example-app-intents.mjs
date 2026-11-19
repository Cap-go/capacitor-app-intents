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

function pluginPackageRelativePath(exampleAppRoot) {
  const packageSwiftPath = path.join(exampleAppRoot, 'ios/App/CapApp-SPM/Package.swift');
  if (!fs.existsSync(packageSwiftPath)) {
    return null;
  }
  const pkg = fs.readFileSync(packageSwiftPath, 'utf8');
  const match = pkg.match(/name:\s*"CapgoCapacitorAppIntents",\s*path:\s*"([^"]+)"/);
  if (!match) {
    return null;
  }
  const absolute = path.resolve(path.join(exampleAppRoot, 'ios/App/CapApp-SPM', match[1]));
  const appProjectDir = path.join(exampleAppRoot, 'ios/App');
  return path.relative(appProjectDir, absolute).split(path.sep).join('/');
}

function listBlockIncludesName(pbx, blockName, productName) {
  const match = pbx.match(new RegExp(`${blockName} = \\(([\\s\\S]*?)\\n\\t+\\);`));
  return Boolean(match && match[1].includes(productName));
}

function addCapgoPluginPackageToAppTarget(pbx, pluginRelativePath) {
  if (!pluginRelativePath) {
    return pbx;
  }

  const existingRefMatch = pbx.match(
    /\t\t([A-F0-9]+) \/\* XCLocalSwiftPackageReference "CapgoCapacitorAppIntents" \*\/ = \{\n\t\t\tisa = XCLocalSwiftPackageReference;\n\t\t\trelativePath = "[^"]*";\n\t\t\};/,
  );
  const packageRefId = existingRefMatch ? existingRefMatch[1] : uuid();

  if (!listBlockIncludesName(pbx, 'packageReferences', 'CapgoCapacitorAppIntents')) {
    pbx = pbx.replace(
      /(packageReferences = \(\n\t+)(D4C12C0A2AAA248700AAC8A2 \/\* XCLocalSwiftPackageReference "CapApp-SPM" \*\/,)/,
      `$1$2\n\t\t\t\t${packageRefId} /* XCLocalSwiftPackageReference "CapgoCapacitorAppIntents" */,`,
    );
  }

  const existingProductMatch = pbx.match(
    /\t\t([A-F0-9]+) \/\* CapgoCapacitorAppIntents \*\/ = \{\n\t\t\tisa = XCSwiftPackageProductDependency;\n\t\t\tpackage = [^;]+;\n\t\t\tproductName = CapgoCapacitorAppIntents;\n\t\t\};/,
  );
  const productDepId = existingProductMatch ? existingProductMatch[1] : uuid();

  if (!listBlockIncludesName(pbx, 'packageProductDependencies', 'CapgoCapacitorAppIntents')) {
    pbx = pbx.replace(
      /(packageProductDependencies = \(\n\t+)(4D22ABE82AF431CB00220026 \/\* CapApp-SPM \*\/,)/,
      `$1$2\n\t\t\t\t${productDepId} /* CapgoCapacitorAppIntents */,`,
    );
  }

  if (existingRefMatch) {
    pbx = pbx.replace(
      existingRefMatch[0],
      `\t\t${packageRefId} /* XCLocalSwiftPackageReference "CapgoCapacitorAppIntents" */ = {\n\t\t\tisa = XCLocalSwiftPackageReference;\n\t\t\trelativePath = ${JSON.stringify(pluginRelativePath)};\n\t\t};`,
    );
  } else {
    pbx = pbx.replace(
      '/* End XCLocalSwiftPackageReference section */',
      `\t\t${packageRefId} /* XCLocalSwiftPackageReference "CapgoCapacitorAppIntents" */ = {\n\t\t\tisa = XCLocalSwiftPackageReference;\n\t\t\trelativePath = ${JSON.stringify(pluginRelativePath)};\n\t\t};\n/* End XCLocalSwiftPackageReference section */`,
    );
  }

  if (!existingProductMatch) {
    pbx = pbx.replace(
      '/* End XCSwiftPackageProductDependency section */',
      `\t\t${productDepId} /* CapgoCapacitorAppIntents */ = {\n\t\t\tisa = XCSwiftPackageProductDependency;\n\t\t\tpackage = ${packageRefId} /* XCLocalSwiftPackageReference "CapgoCapacitorAppIntents" */;\n\t\t\tproductName = CapgoCapacitorAppIntents;\n\t\t};\n/* End XCSwiftPackageProductDependency section */`,
    );
  }

  if (!pbx.includes('CapgoCapacitorAppIntents in Frameworks')) {
    const frameworkBuildId = uuid();
    pbx = pbx.replace(
      '/* End PBXBuildFile section */',
      `\t\t${frameworkBuildId} /* CapgoCapacitorAppIntents in Frameworks */ = {isa = PBXBuildFile; productRef = ${productDepId} /* CapgoCapacitorAppIntents */; };\n/* End PBXBuildFile section */`,
    );

    const frameworksMatch = pbx.match(
      /(\t\t504EC3011FED79650016851F \/\* Frameworks \*\/ = \{[\s\S]*?files = \(\n)([\s\S]*?)(\n\t\t\t\);\n\t\t\trunOnlyForDeploymentPostprocessing)/,
    );
    if (!frameworksMatch) {
      throw new Error('Could not find Frameworks build phase');
    }
    pbx = pbx.replace(
      frameworksMatch[0],
      `${frameworksMatch[1]}${frameworksMatch[2].trimEnd()}\n\t\t\t\t${frameworkBuildId} /* CapgoCapacitorAppIntents in Frameworks */,\n${frameworksMatch[3]}`,
    );
  }

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

  const pluginRelativePath = pluginPackageRelativePath(exampleAppRoot);
  pbx = addCapgoPluginPackageToAppTarget(pbx, pluginRelativePath);

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
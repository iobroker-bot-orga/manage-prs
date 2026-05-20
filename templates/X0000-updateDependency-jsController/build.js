// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

const fs = require('node:fs');
const path = require('node:path');

const MINIMUM_REQUIRED_JS_CONTROLLER_VERSION = '6.0.11';
const DESIRED_JS_CONTROLLER_VERSION = '6.0.11';

// prepare standard parameters
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Missing required arguments');
  process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

function parseVersion(versionString) {
  return versionString.split('.').map(part => Number.parseInt(part, 10) || 0);
}

function compareVersions(versionA, versionB) {
  const partsA = parseVersion(versionA);
  const partsB = parseVersion(versionB);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const a = partsA[i] || 0;
    const b = partsB[i] || 0;
    if (a < b) return -1;
    if (a > b) return 1;
  }

  return 0;
}

function parseDependencyRequirement(requirement) {
  if (typeof requirement !== 'string') {
    return null;
  }

  const trimmedRequirement = requirement.trim();
  const match = trimmedRequirement.match(/^(>=|<=|>|<|=|\^|~)?\s*v?(\d+(?:\.\d+){0,2})/i);

  if (!match) {
    return null;
  }

  return {
    operator: match[1] || '=',
    version: match[2]
  };
}

function isRequirementAtLeastMinimum(requirement, minimumVersion) {
  const parsedRequirement = parseDependencyRequirement(requirement);

  if (!parsedRequirement) {
    return false;
  }

  const comparison = compareVersions(parsedRequirement.version, minimumVersion);

  switch (parsedRequirement.operator) {
    case '>=':
    case '>':
    case '=':
    case '^':
    case '~':
      return comparison >= 0;
    case '<=':
    case '<':
    default:
      return false;
  }
}

function createSearchableContent(content) {
  return content.replace(/<!--[\s\S]*?-->/g, match => ' '.repeat(match.length));
}

function updateReadmeChangelog(entry) {
  const readmePath = './README.md';
  const wipHeader = '### **WORK IN PROGRESS**';

  if (!fs.existsSync(readmePath)) {
    console.log(`ⓘ ${readmePath} does not exist, skipping changelog update.`);
    return false;
  }

  let readmeContent = fs.readFileSync(readmePath, 'utf8');

  if (readmeContent.toLowerCase().includes(entry.toLowerCase())) {
    console.log(`ⓘ Changelog entry already exists in ${readmePath}.`);
    return false;
  }

  const changelogHeaderRegex = /^##\s+Changelog\b/im;
  const changelogMatch = readmeContent.match(changelogHeaderRegex);

  if (!changelogMatch) {
    const section = `\n\n## Changelog\n\n${wipHeader}\n${entry}\n`;
    fs.writeFileSync(readmePath, `${readmeContent.trimEnd()}${section}\n`, 'utf8');
    console.log(`✔️ Added Changelog section with WORK IN PROGRESS entry to ${readmePath}.`);
    return true;
  }

  const changelogStart = changelogMatch.index + changelogMatch[0].length;
  const afterChangelog = readmeContent.slice(changelogStart);
  const searchableAfterChangelog = createSearchableContent(afterChangelog);
  const nextHeaderMatch = searchableAfterChangelog.match(/^###\s+(.+)$/im);

  let updatedContent;

  if (!nextHeaderMatch) {
    const newSection = `\n\n${wipHeader}\n${entry}\n`;
    updatedContent = readmeContent.slice(0, changelogStart) + newSection + afterChangelog;
    console.log(`✔️ Added WORK IN PROGRESS section with changelog entry to ${readmePath}.`);
  } else {
    const headerText = nextHeaderMatch[1].trim();
    const headerPosition = nextHeaderMatch.index;
    const fullHeader = nextHeaderMatch[0];

    if (/^\*\*WORK IN PROGRESS\*\*$/i.test(headerText)) {
      const insertPosition = changelogStart + headerPosition + fullHeader.length;
      updatedContent = `${readmeContent.slice(0, insertPosition)}\n${entry}${readmeContent.slice(insertPosition)}`;
      console.log(`✔️ Added changelog entry to existing WORK IN PROGRESS section in ${readmePath}.`);
    } else {
      const insertPosition = changelogStart + headerPosition;
      const newSection = `\n${wipHeader}\n${entry}\n\n`;
      updatedContent = `${readmeContent.slice(0, insertPosition)}${newSection}${readmeContent.slice(insertPosition)}`;
      console.log(`✔️ Added WORK IN PROGRESS section before '${headerText}' in ${readmePath}.`);
    }
  }

  fs.writeFileSync(readmePath, updatedContent, 'utf8');
  return true;
}

function updatePrBodyPlaceholders() {
  const prBodyPath = path.join(process.cwd(), '.iobroker-pr-body.tmp');

  if (!fs.existsSync(prBodyPath)) {
    return;
  }

  let prBody = fs.readFileSync(prBodyPath, 'utf8');
  prBody = prBody.replaceAll('__DESIRED_JS_CONTROLLER_VERSION__', DESIRED_JS_CONTROLLER_VERSION);
  fs.writeFileSync(prBodyPath, prBody, 'utf8');
  console.log(`✔️ Updated PR body with js-controller version ${DESIRED_JS_CONTROLLER_VERSION}.`);
}

const ioPackagePath = './io-package.json';

if (!fs.existsSync(ioPackagePath)) {
  console.log(`❌ ${ioPackagePath} does not exist, cannot create PR.`);
  process.exit(1);
}

console.log(`✔️ ${ioPackagePath} exists.`);

let ioPackage;
try {
  ioPackage = JSON.parse(fs.readFileSync(ioPackagePath, 'utf8'));
} catch (error) {
  console.error(`❌ Error parsing ${ioPackagePath}: ${error.message}`);
  process.exit(1);
}

if (!ioPackage.common || typeof ioPackage.common !== 'object') {
  ioPackage.common = {};
}

if (ioPackage.common.onlyWWW === true) {
  console.log('ⓘ common.onlyWWW is true, skipping processing without changes.');
  console.log('✔️ processing completed');
  process.exit(0);
}

if (!Array.isArray(ioPackage.common.dependencies)) {
  ioPackage.common.dependencies = [];
}

const desiredRequirement = `>=${DESIRED_JS_CONTROLLER_VERSION}`;
let dependenciesChanged = false;

const jsControllerDependency = ioPackage.common.dependencies.find(
  dependency => dependency && typeof dependency === 'object' && Object.prototype.hasOwnProperty.call(dependency, 'js-controller')
);

if (!jsControllerDependency) {
  ioPackage.common.dependencies.push({
    'js-controller': desiredRequirement
  });
  dependenciesChanged = true;
  console.log(`✔️ Added js-controller dependency (${desiredRequirement}).`);
} else {
  const currentRequirement = jsControllerDependency['js-controller'];

  if (!isRequirementAtLeastMinimum(currentRequirement, MINIMUM_REQUIRED_JS_CONTROLLER_VERSION)) {
    jsControllerDependency['js-controller'] = desiredRequirement;
    dependenciesChanged = true;
    console.log(`✔️ Updated js-controller dependency from '${currentRequirement}' to '${desiredRequirement}'.`);
  } else {
    console.log(`ⓘ Existing js-controller dependency '${currentRequirement}' already meets minimum requirements.`);
  }
}

if (dependenciesChanged) {
  fs.writeFileSync(ioPackagePath, `${JSON.stringify(ioPackage, null, 2)}\n`, 'utf8');
  console.log(`✔️ Updated ${ioPackagePath}.`);

  const changelogEntry = `- (copilot) Adapter requires js-controller >= ${DESIRED_JS_CONTROLLER_VERSION} now.`;
  updateReadmeChangelog(changelogEntry);
  updatePrBodyPlaceholders();
} else {
  console.log('ⓘ No dependency update required.');
}

console.log('✔️ processing completed');
process.exit(0);

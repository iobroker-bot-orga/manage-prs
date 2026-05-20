// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

const fs = require('node:fs');
const path = require('node:path');

const MINIMUM_REQUIRED_ADMIN_VERSION = '7.7.31';
const DESIRED_ADMIN_VERSION = '7.8.23';
const PR_BODY_VERSION_PLACEHOLDER = '__DESIRED_ADMIN_VERSION__';

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
  return versionString.split('.').map(part => parseInt(part, 10) || 0);
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

function incrementPatch(version) {
  const parts = parseVersion(version);
  while (parts.length < 3) {
    parts.push(0);
  }
  parts[2] += 1;
  return parts.slice(0, 3).join('.');
}

function parseDependencyRequirement(requirement) {
  if (typeof requirement !== 'string') {
    return [];
  }

  return requirement
    .split(/\s+/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const match = part.match(/^(>=|<=|>|<|=|\^|~)?\s*v?(\d+(?:\.\d+){0,2})$/i);
      if (!match) {
        return null;
      }

      return {
        operator: match[1] || '=',
        version: match[2]
      };
    })
    .filter(Boolean);
}

function getGuaranteedMinimumVersion(requirement) {
  const comparators = parseDependencyRequirement(requirement);

  if (comparators.length === 0) {
    return null;
  }

  let guaranteedMinimum = null;

  for (const comparator of comparators) {
    let candidate = null;

    switch (comparator.operator) {
      case '>=':
      case '=':
      case '^':
      case '~':
        candidate = comparator.version;
        break;
      case '>':
        candidate = incrementPatch(comparator.version);
        break;
      case '<':
      case '<=':
      default:
        break;
    }

    if (!candidate) {
      continue;
    }

    if (!guaranteedMinimum || compareVersions(candidate, guaranteedMinimum) > 0) {
      guaranteedMinimum = candidate;
    }
  }

  return guaranteedMinimum;
}

function isRequirementAtLeastMinimum(requirement, minimumVersion) {
  const guaranteedMinimum = getGuaranteedMinimumVersion(requirement);

  if (!guaranteedMinimum) {
    return false;
  }

  return compareVersions(guaranteedMinimum, minimumVersion) >= 0;
}

/**
 * Replace HTML comments with spaces so header matching keeps exact positions
 * while avoiding accidental matches inside comments.
 *
 * @param {string} content - README content
 * @returns {string} Content safe for header searches
 */
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
  prBody = prBody.replaceAll(PR_BODY_VERSION_PLACEHOLDER, DESIRED_ADMIN_VERSION);
  fs.writeFileSync(prBodyPath, prBody, 'utf8');
  console.log(`✔️ Updated PR body with admin version ${DESIRED_ADMIN_VERSION}.`);
}

function getGlobalDependencies(common) {
  if (Array.isArray(common.globalDependencies)) {
    return common.globalDependencies;
  }

  if (Array.isArray(common.globalDependency)) {
    return common.globalDependency;
  }

  return null;
}

function findAdminDependency(globalDependencies) {
  if (!Array.isArray(globalDependencies)) {
    return null;
  }

  return globalDependencies.find(
    dependency => dependency && typeof dependency === 'object' && 'admin' in dependency
  ) || null;
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

if (ioPackage.common.noConfig === true) {
  console.log('ⓘ common.noConfig is true, skipping processing without changes.');
  console.log('✔️ processing completed');
  process.exit(0);
}

const currentAdminDependency = findAdminDependency(getGlobalDependencies(ioPackage.common));
const adminUI = ioPackage.common.adminUI;
const hasAdminUINoneConfigWithoutCustomOrTab =
  adminUI &&
  typeof adminUI === 'object' &&
  adminUI.config === 'none' &&
  typeof adminUI.custom === 'undefined' &&
  typeof adminUI.tab === 'undefined';

if (hasAdminUINoneConfigWithoutCustomOrTab && !currentAdminDependency) {
  console.log('ⓘ Adapter does not use admin config UI and has no admin global dependency, skipping processing without changes.');
  console.log('✔️ processing completed');
  process.exit(0);
}

let globalDependencies = getGlobalDependencies(ioPackage.common);

if (!Array.isArray(globalDependencies)) {
  ioPackage.common.globalDependencies = [];
  globalDependencies = ioPackage.common.globalDependencies;
}

const desiredRequirement = `>=${DESIRED_ADMIN_VERSION}`;
let dependenciesChanged = false;

const adminDependency = findAdminDependency(globalDependencies);

if (!adminDependency) {
  globalDependencies.push({
    admin: desiredRequirement
  });
  dependenciesChanged = true;
  console.log(`✔️ Added admin global dependency (${desiredRequirement}).`);
} else {
  const currentRequirement = adminDependency.admin;

  if (!isRequirementAtLeastMinimum(currentRequirement, MINIMUM_REQUIRED_ADMIN_VERSION)) {
    adminDependency.admin = desiredRequirement;
    dependenciesChanged = true;
    console.log(`✔️ Updated admin global dependency from '${currentRequirement}' to '${desiredRequirement}'.`);
  } else {
    console.log(`ⓘ Existing admin global dependency '${currentRequirement}' already meets minimum requirements.`);
  }
}

if (dependenciesChanged) {
  fs.writeFileSync(ioPackagePath, `${JSON.stringify(ioPackage, null, 2)}\n`, 'utf8');
  console.log(`✔️ Updated ${ioPackagePath}.`);

  const changelogEntry = `- (ioBroker-Bot) Adapter requires admin >= ${DESIRED_ADMIN_VERSION} now.`;
  updateReadmeChangelog(changelogEntry);
  updatePrBodyPlaceholders();
} else {
  console.log('ⓘ No dependency update required.');
}

console.log('✔️ processing completed');
process.exit(0);

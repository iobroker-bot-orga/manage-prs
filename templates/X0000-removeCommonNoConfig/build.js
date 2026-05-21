// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

const fs = require('node:fs');
const path = require('node:path');

const MINIMUM_REQUIRED_JS_CONTROLLER_VERSION = '5.0.0';
const DESIRED_JS_CONTROLLER_VERSION = '6.0.11';
const ADMINUI_PLACEHOLDER_EN = '__ADMINUI_CONFIG_CHANGE_EN__';
const DEPENDENCY_PLACEHOLDER_EN = '__DEPENDENCY_CHANGE_EN__';
const ADMINUI_PLACEHOLDER_DE = '__ADMINUI_CONFIG_CHANGE_DE__';
const DEPENDENCY_PLACEHOLDER_DE = '__DEPENDENCY_CHANGE_DE__';

// prepare standard parameters
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Missing required arguments');
  process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

/**
 * Parse a version string into numeric parts.
 *
 * @param {string} versionString - Version string such as "6.0.11"
 * @returns {number[]} Parsed version parts
 */
function parseVersion(versionString) {
  return versionString.split('.').map(part => parseInt(part, 10) || 0);
}

/**
 * Compare two version strings.
 *
 * @param {string} versionA - First version to compare
 * @param {string} versionB - Second version to compare
 * @returns {number} -1 if A < B, 1 if A > B, otherwise 0
 */
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

/**
 * Parse a dependency requirement.
 *
 * @param {unknown} requirement - Requirement string like ">=5.0.0"
 * @returns {{operator: string, version: string} | null} Parsed requirement or null
 */
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

/**
 * Check whether a dependency requirement satisfies a minimum version.
 *
 * @param {unknown} requirement - Requirement string such as ">=5.0.0", "^6.1.0"
 * @param {string} minimumVersion - Minimum version to require
 * @returns {boolean} True if requirement already satisfies the minimum version
 */
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

/**
 * Add a changelog entry to README.md below the WORK IN PROGRESS section.
 *
 * @param {string} entry - Changelog line to insert
 * @returns {boolean} True if README.md was modified
 */
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

/**
 * Replace PR body placeholders with runtime messages.
 *
 * @param {{adminUiEn: string, dependencyEn: string, adminUiDe: string, dependencyDe: string}} messages - Replacement messages
 */
function updatePrBodyPlaceholders(messages) {
  const prBodyPath = path.join(process.cwd(), '.iobroker-pr-body.tmp');

  if (!fs.existsSync(prBodyPath)) {
    return;
  }

  let prBody = fs.readFileSync(prBodyPath, 'utf8');
  prBody = prBody.replaceAll(ADMINUI_PLACEHOLDER_EN, messages.adminUiEn);
  prBody = prBody.replaceAll(DEPENDENCY_PLACEHOLDER_EN, messages.dependencyEn);
  prBody = prBody.replaceAll(ADMINUI_PLACEHOLDER_DE, messages.adminUiDe);
  prBody = prBody.replaceAll(DEPENDENCY_PLACEHOLDER_DE, messages.dependencyDe);
  fs.writeFileSync(prBodyPath, prBody, 'utf8');
  console.log('✔️ Updated PR body placeholders.');
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
  console.log('ⓘ common does not exist, common.noConfig cannot exist. No PR required.');
  console.log('✔️ processing completed');
  process.exit(0);
}

if (!Object.prototype.hasOwnProperty.call(ioPackage.common, 'noConfig')) {
  console.log('ⓘ common.noConfig does not exist. No PR required.');
  console.log('✔️ processing completed');
  process.exit(0);
}

const noConfigValue = ioPackage.common.noConfig;
delete ioPackage.common.noConfig;
console.log('✔️ Removed common.noConfig from io-package.json.');

let adminUiEn;
let dependencyEn;
let adminUiDe;
let dependencyDe;
let dependencyChanged = false;

if (noConfigValue === false) {
  adminUiEn = 'The `common.adminUI.config` setting has not been changed because `common.noConfig` was set to `false`.';
  dependencyEn = 'The `js-controller` dependency has not been changed for this PR because `common.noConfig` was set to `false`.';
  adminUiDe = 'Die Einstellung `common.adminUI.config` wurde nicht geändert, weil `common.noConfig` auf `false` gesetzt war.';
  dependencyDe = 'Die `js-controller`-Abhängigkeit wurde in diesem PR nicht geändert, weil `common.noConfig` auf `false` gesetzt war.';
  console.log('ⓘ common.noConfig was false, skipping adminUI and dependency changes.');
} else {
  if (!ioPackage.common.adminUI || typeof ioPackage.common.adminUI !== 'object') {
    ioPackage.common.adminUI = {};
  }

  if (Object.prototype.hasOwnProperty.call(ioPackage.common.adminUI, 'config')) {
    adminUiEn = 'The `common.adminUI.config` setting already existed and has not been changed.';
    adminUiDe = 'Die Einstellung `common.adminUI.config` war bereits vorhanden und wurde nicht geändert.';
    console.log('ⓘ common.adminUI.config already exists, keeping current value.');
  } else {
    ioPackage.common.adminUI.config = 'none';
    adminUiEn = 'The `common.adminUI.config` setting did not exist and has been added with value `none`.';
    adminUiDe = 'Die Einstellung `common.adminUI.config` war nicht vorhanden und wurde mit dem Wert `none` ergänzt.';
    console.log('✔️ Added common.adminUI.config with value "none".');
  }

  if (ioPackage.common.onlyWWW === true) {
    dependencyEn = 'The `js-controller` dependency has not been changed because `common.onlyWWW` is set to `true`.';
    dependencyDe = 'Die `js-controller`-Abhängigkeit wurde nicht geändert, weil `common.onlyWWW` auf `true` gesetzt ist.';
    console.log('ⓘ common.onlyWWW is true, skipping js-controller dependency changes.');
  } else {
    if (!Array.isArray(ioPackage.common.dependencies)) {
      ioPackage.common.dependencies = [];
    }

    const desiredRequirement = `>=${DESIRED_JS_CONTROLLER_VERSION}`;
    const jsControllerDependency = ioPackage.common.dependencies.find(
      dependency => dependency && typeof dependency === 'object' && 'js-controller' in dependency
    );

    if (!jsControllerDependency) {
      ioPackage.common.dependencies.push({
        'js-controller': desiredRequirement
      });
      dependencyChanged = true;
      dependencyEn = `The \`js-controller\` dependency has been adapted. The adapter now requires \`js-controller >= ${DESIRED_JS_CONTROLLER_VERSION}\`.`;
      dependencyDe = `Die \`js-controller\`-Abhängigkeit wurde angepasst. Der Adapter benötigt jetzt \`js-controller >= ${DESIRED_JS_CONTROLLER_VERSION}\`.`;
      console.log(`✔️ Added js-controller dependency (${desiredRequirement}).`);
    } else {
      const currentRequirement = jsControllerDependency['js-controller'];

      if (!isRequirementAtLeastMinimum(currentRequirement, MINIMUM_REQUIRED_JS_CONTROLLER_VERSION)) {
        jsControllerDependency['js-controller'] = desiredRequirement;
        dependencyChanged = true;
        dependencyEn = `The \`js-controller\` dependency has been adapted. The adapter now requires \`js-controller >= ${DESIRED_JS_CONTROLLER_VERSION}\`.`;
        dependencyDe = `Die \`js-controller\`-Abhängigkeit wurde angepasst. Der Adapter benötigt jetzt \`js-controller >= ${DESIRED_JS_CONTROLLER_VERSION}\`.`;
        console.log(`✔️ Updated js-controller dependency from '${currentRequirement}' to '${desiredRequirement}'.`);
      } else {
        dependencyEn = `The existing \`js-controller\` dependency already requires at least \`${MINIMUM_REQUIRED_JS_CONTROLLER_VERSION}\`, so no dependency update was needed.`;
        dependencyDe = `Die vorhandene \`js-controller\`-Abhängigkeit verlangt bereits mindestens \`${MINIMUM_REQUIRED_JS_CONTROLLER_VERSION}\`, daher war keine Anpassung erforderlich.`;
        console.log(`ⓘ Existing js-controller dependency '${currentRequirement}' already meets minimum requirements.`);
      }
    }
  }
}

fs.writeFileSync(ioPackagePath, `${JSON.stringify(ioPackage, null, 2)}\n`, 'utf8');
console.log(`✔️ Updated ${ioPackagePath}.`);

if (dependencyChanged) {
  const changelogEntry = `- (ioBroker-Bot) Adapter requires js-controller >= ${DESIRED_JS_CONTROLLER_VERSION} now.`;
  updateReadmeChangelog(changelogEntry);
}

updatePrBodyPlaceholders({
  adminUiEn,
  dependencyEn,
  adminUiDe,
  dependencyDe
});

console.log('✔️ processing completed');
process.exit(0);

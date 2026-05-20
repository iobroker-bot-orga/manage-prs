// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies'];

// prepare standard parameters
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];

function extractMajorVersion(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const match = value.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

/**
 * Compare two semver-like versions (major.minor.patch).
 * @param {string} versionA
 * @param {string} versionB
 * @returns {number}
 */
function compareSemver(versionA, versionB) {
    if (typeof versionA !== 'string' || typeof versionB !== 'string') {
        return 0;
    }

    const partsA = versionA.split('.').map(part => parseInt(part, 10) || 0);
    const partsB = versionB.split('.').map(part => parseInt(part, 10) || 0);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const a = partsA[i] || 0;
        const b = partsB[i] || 0;
        if (a > b) {
            return 1;
        }
        if (a < b) {
            return -1;
        }
    }

    return 0;
}

function extractLatestVersion(value) {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return null;
        }
        const sortedValues = value.slice().sort((versionA, versionB) => compareSemver(versionA, versionB));
        return sortedValues[sortedValues.length - 1] || null;
    }

    if (typeof value === 'string' && value.trim()) {
        return value.trim();
    }

    return null;
}

function getLatestTypesNodeVersionForMajor(majorVersion) {
    if (!Number.isSafeInteger(majorVersion) || majorVersion <= 0) {
        return null;
    }

    try {
        const directResult = execSync(`npm view @types/node@${majorVersion} version --json`, {
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf8',
        }).trim();

        const parsedDirect = JSON.parse(directResult);
        const latestDirect = extractLatestVersion(parsedDirect);
        if (latestDirect) {
            return latestDirect;
        }
    } catch (error) {
        console.log(`ⓘ Direct npm query for @types/node@${majorVersion} did not return a usable version: ${error.message}`);
    }

    const allVersionsResult = execSync('npm view @types/node versions --json', {
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
    }).trim();

    const allVersions = JSON.parse(allVersionsResult);
    if (!Array.isArray(allVersions)) {
        return null;
    }

    const matchingVersions = allVersions.filter(version => extractMajorVersion(version) === majorVersion);

    if (matchingVersions.length === 0) {
        return null;
    }

    const sortedMatches = matchingVersions.slice().sort((versionA, versionB) => compareSemver(versionA, versionB));
    return sortedMatches[sortedMatches.length - 1] || null;
}

function updatePrBody(changesSummary, minNodeMajor, targetVersion) {
    const prBodyFile = path.join(process.cwd(), '.iobroker-pr-body.tmp');

    if (!fs.existsSync(prBodyFile)) {
        return;
    }

    let prBody = fs.readFileSync(prBodyFile, 'utf8');
    prBody = prBody.replaceAll('__MIN_SUPPORTED_NODE_MAJOR__', String(minNodeMajor));
    prBody = prBody.replaceAll('__TARGET_TYPES_NODE_VERSION__', targetVersion);
    prBody = prBody.replaceAll('__CHANGES_SUMMARY__', changesSummary);
    fs.writeFileSync(prBodyFile, prBody, 'utf8');

    console.log('✔️ Updated PR body placeholders.');
}

const packageJsonPath = './package.json';
if (!fs.existsSync(packageJsonPath)) {
    console.log(`ⓘ ${packageJsonPath} does not exist - skipping repository.`);
    process.exit(0);
}

console.log(`✔️ ${packageJsonPath} exists.`);

let packageJson;
try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
    console.error(`❌ Error parsing ${packageJsonPath}: ${error.message}`);
    process.exit(1);
}

const enginesNode = packageJson.engines?.node;
const minSupportedNodeMajor = extractMajorVersion(enginesNode);

if (minSupportedNodeMajor === null) {
    console.log('ⓘ Could not determine minimum supported Node.js major version from package.json engines.node - skipping repository.');
    process.exit(0);
}

console.log(`✔️ Minimum supported Node.js major version detected: ${minSupportedNodeMajor}`);

const dependencyOccurrences = [];
for (const dependencyField of DEPENDENCY_FIELDS) {
    const block = packageJson[dependencyField];
    if (block && typeof block === 'object' && Object.prototype.hasOwnProperty.call(block, '@types/node')) {
        dependencyOccurrences.push({
            field: dependencyField,
            currentValue: block['@types/node'],
        });
    }
}

if (dependencyOccurrences.length === 0) {
    console.log('ⓘ No @types/node dependency found in dependencies/devDependencies/peerDependencies - nothing to do.');
    process.exit(0);
}

let majorMismatchFound = false;
for (const occurrence of dependencyOccurrences) {
    const currentMajor = extractMajorVersion(occurrence.currentValue);
    occurrence.currentMajor = currentMajor;

    if (currentMajor !== minSupportedNodeMajor) {
        majorMismatchFound = true;
    }
}

if (!majorMismatchFound) {
    console.log('ⓘ @types/node already matches the minimum supported Node.js major version - nothing to do.');
    process.exit(0);
}

const targetTypesNodeVersion = getLatestTypesNodeVersionForMajor(minSupportedNodeMajor);
if (!targetTypesNodeVersion) {
    console.error(`❌ Could not determine latest @types/node version for major ${minSupportedNodeMajor}.`);
    process.exit(1);
}

console.log(`✔️ Latest @types/node version for major ${minSupportedNodeMajor}: ${targetTypesNodeVersion}`);

const changesSummaryLines = [];
for (const occurrence of dependencyOccurrences) {
    const newValue = `^${targetTypesNodeVersion}`;

    if (occurrence.currentValue !== newValue) {
        packageJson[occurrence.field]['@types/node'] = newValue;
        changesSummaryLines.push(`- @types/node in ${occurrence.field} will be updated from \`${occurrence.currentValue}\` to \`${newValue}\``);
    } else {
        changesSummaryLines.push(`- @types/node in ${occurrence.field} will not be changed (already \`${newValue}\`)`);
    }
}

if (changesSummaryLines.length === 0) {
    console.log('ⓘ No effective package.json changes required after evaluation.');
    process.exit(0);
}

fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
console.log(`✔️ Updated ${packageJsonPath}.`);

try {
    console.log('ⓘ Running npm install to update package-lock.json.');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✔️ package-lock.json updated via npm install.');
} catch (error) {
    console.error(`❌ npm install failed: ${error.message}`);
    process.exit(1);
}

updatePrBody(changesSummaryLines.join('\n'), minSupportedNodeMajor, targetTypesNodeVersion);

console.log(`✔️ processing completed (template: ${templateName}, repository: ${repositoryName})`);
process.exit(0);

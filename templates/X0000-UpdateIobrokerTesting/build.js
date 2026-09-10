// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Desired version of @iobroker/testing that this template ensures.
const DESIRED_TESTING_VERSION = '6.1.2';

const PR_BODY_VERSION_PLACEHOLDER = '__DESIRED_TESTING_VERSION__';

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
 * Compare two semver-like versions (major.minor.patch).
 * @param {string} versionA
 * @param {string} versionB
 * @returns {number} -1 if versionA < versionB, 1 if versionA > versionB, 0 if equal
 */
function compareVersions(versionA, versionB) {
    const partsA = String(versionA).split('.').map(part => parseInt(part, 10) || 0);
    const partsB = String(versionB).split('.').map(part => parseInt(part, 10) || 0);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const a = partsA[i] || 0;
        const b = partsB[i] || 0;
        if (a < b) return -1;
        if (a > b) return 1;
    }

    return 0;
}

/**
 * Extract the plain version number from a dependency requirement string.
 * @param {string} requirement - for example '^6.0.0' or '~6.1.0'
 * @returns {string|null} the extracted version or null if none could be found
 */
function extractVersion(requirement) {
    if (typeof requirement !== 'string') {
        return null;
    }

    const match = requirement.trim().match(/(\d+(?:\.\d+){0,2})/);
    return match ? match[1] : null;
}

/**
 * Replace the version placeholder in the prepared PR body with the desired version.
 */
function updatePrBodyPlaceholders() {
    const prBodyPath = path.join(process.cwd(), '.iobroker-pr-body.tmp');

    if (!fs.existsSync(prBodyPath)) {
        return;
    }

    let prBody = fs.readFileSync(prBodyPath, 'utf8');
    prBody = prBody.replaceAll(PR_BODY_VERSION_PLACEHOLDER, DESIRED_TESTING_VERSION);
    fs.writeFileSync(prBodyPath, prBody, 'utf8');
    console.log(`✔️ Updated PR body with @iobroker/testing version ${DESIRED_TESTING_VERSION}.`);
}

const packageJsonPath = './package.json';

if (!fs.existsSync(packageJsonPath)) {
    console.log(`ⓘ ${packageJsonPath} does not exist - skipping repository without changes.`);
    console.log('✔️ processing completed');
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

const devDependencies = packageJson.devDependencies;

// Only act if @iobroker/testing is already present as a devDependency.
// A missing dependency must NOT be added - terminate with success and create no PR.
if (!devDependencies || typeof devDependencies !== 'object' || !Object.prototype.hasOwnProperty.call(devDependencies, '@iobroker/testing')) {
    console.log('ⓘ No @iobroker/testing devDependency found - nothing to do, no PR will be created.');
    console.log('✔️ processing completed');
    process.exit(0);
}

const currentRequirement = devDependencies['@iobroker/testing'];
const currentVersion = extractVersion(currentRequirement);

if (!currentVersion) {
    console.log(`ⓘ Could not parse current @iobroker/testing requirement '${currentRequirement}' - skipping without changes.`);
    console.log('✔️ processing completed');
    process.exit(0);
}

if (compareVersions(currentVersion, DESIRED_TESTING_VERSION) >= 0) {
    console.log(`ⓘ Existing @iobroker/testing devDependency '${currentRequirement}' already meets the desired version ${DESIRED_TESTING_VERSION} - nothing to do.`);
    console.log('✔️ processing completed');
    process.exit(0);
}

// Update the requirement, keeping the '^' construct.
const newRequirement = `^${DESIRED_TESTING_VERSION}`;
devDependencies['@iobroker/testing'] = newRequirement;

fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
console.log(`✔️ Updated @iobroker/testing devDependency from '${currentRequirement}' to '${newRequirement}' in ${packageJsonPath}.`);

try {
    console.log('ⓘ Running npm install to update package-lock.json.');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✔️ package-lock.json updated via npm install.');
} catch (error) {
    console.error(`❌ npm install failed: ${error.message}`);
    process.exit(1);
}

updatePrBodyPlaceholders();

console.log(`✔️ processing completed (template: ${templateName}, repository: ${repositoryName})`);
process.exit(0);

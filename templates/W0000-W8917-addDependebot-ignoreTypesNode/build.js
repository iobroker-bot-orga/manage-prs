// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

'use strict';

const fs = require('node:fs');
const yaml = require('js-yaml');

// prepare standard parameters
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

// Check if dependabot.yml exists
const dependabotPath = '.github/dependabot.yml';
if (!fs.existsSync(dependabotPath)) {
    console.log('ⓘ No dependabot.yml found - skipping this repository');
    process.exit(0);
}

console.log(`✔️ ${dependabotPath} exists.`);

// Read and parse dependabot.yml
const dependabotContent = fs.readFileSync(dependabotPath, 'utf8');
let dependabotConfig;

try {
    dependabotConfig = yaml.load(dependabotContent);
} catch (e) {
    console.error(`❌ Error parsing ${dependabotPath}: ${e.message}`);
    process.exit(1);
}

if (!dependabotConfig || !dependabotConfig.updates || !Array.isArray(dependabotConfig.updates)) {
    console.log('ⓘ No updates section found in dependabot.yml - skipping');
    process.exit(0);
}

let changesMade = false;

// Process each update block
dependabotConfig.updates.forEach((update, index) => {
    // Only process npm sections
    if (update['package-ecosystem'] !== 'npm') {
        return;
    }

    // Only process sections with directory: '/' or directories containing '**/*'
    const hasRootDirectory = update.directory === '/';
    const hasWildcardDirectories =
        Array.isArray(update.directories) && update.directories.includes('**/*');

    if (!hasRootDirectory && !hasWildcardDirectories) {
        console.log(`ⓘ npm block ${index + 1}: directory configuration does not match '/' or '**/*' - skipping`);
        return;
    }

    console.log(`\nⓘ Processing npm block ${index + 1} (directory: ${update.directory || JSON.stringify(update.directories)})`);

    // Check if block already has an @types/node ignore clause with semver-major or semver-minor
    const ignoreList = update.ignore || [];
    const typesNodeIgnore = ignoreList.find(item => item['dependency-name'] === '@types/node');

    if (typesNodeIgnore) {
        const updateTypes = typesNodeIgnore['update-types'] || [];
        const hasMajor = updateTypes.includes('version-update:semver-major');
        const hasMinor = updateTypes.includes('version-update:semver-minor');

        if (hasMajor || hasMinor) {
            console.log(
                `ⓘ npm block ${index + 1} already has an @types/node ignore clause with ` +
                `${[hasMajor ? 'version-update:semver-major' : null, hasMinor ? 'version-update:semver-minor' : null].filter(Boolean).join(' and ')} - no changes needed`,
            );
            return;
        }

        // Entry exists but lacks the required update-types — extend it
        console.log(`✔️ Extending existing @types/node ignore entry in npm block ${index + 1} with 'version-update:semver-major'`);
        if (!typesNodeIgnore['update-types']) {
            typesNodeIgnore['update-types'] = [];
        }
        typesNodeIgnore['update-types'].push('version-update:semver-major');
        changesMade = true;
    } else {
        // No @types/node entry at all — add a new one
        if (!update.ignore) {
            update.ignore = [];
        }
        update.ignore.push({
            'dependency-name': '@types/node',
            'update-types': ['version-update:semver-major'],
        });
        console.log(`✔️ Added @types/node ignore clause to npm block ${index + 1}: update-types: ['version-update:semver-major']`);
        changesMade = true;
    }
});

if (!changesMade) {
    console.log('\nⓘ No changes required - all relevant npm blocks already have the correct @types/node ignore configuration.');
    process.exit(0);
}

// Write updated dependabot.yml
const updatedYaml = yaml.dump(dependabotConfig, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '\'',
    forceQuotes: true,
});

// Add empty line before each '- package-ecosystem:' for better readability
const formattedYaml = updatedYaml.replace(/(\n)(  - package-ecosystem:)/g, '\n\n$2');

fs.writeFileSync(dependabotPath, formattedYaml, 'utf8');
console.log(`\n✔️ ${dependabotPath} updated successfully.`);
console.log(`\n✔️ processing completed (template: ${templateName}, repository: ${repositoryName})`);

process.exit(0);

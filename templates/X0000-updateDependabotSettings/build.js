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
    console.log(`\nⓘ Processing update block ${index + 1}: ${update['package-ecosystem']}`);

    // Remove 'day:' from monthly schedules (not supported for interval: monthly)
    if (update.schedule && update.schedule.interval === 'monthly' && update.schedule.day !== undefined) {
        console.log(`✔️ Removing unsupported 'day' attribute from monthly schedule in block ${index + 1}`);
        delete update.schedule.day;
        changesMade = true;
    }

    // Add cooldown configuration to npm blocks
    if (update['package-ecosystem'] === 'npm') {
        const existingCooldown = update.cooldown;
        const hasCorrectCooldown =
            existingCooldown &&
            typeof existingCooldown === 'object' &&
            existingCooldown['default-days'] === 7;

        if (!hasCorrectCooldown) {
            update.cooldown = { 'default-days': 7 };
            console.log(`✔️ Added cooldown configuration (default-days: 7) to npm block ${index + 1}`);
            changesMade = true;
        } else {
            console.log(`ⓘ npm block ${index + 1} already has correct cooldown configuration`);
        }
    }
});

// Write updated dependabot.yml if changes were made
if (changesMade) {
    const updatedYaml = yaml.dump(dependabotConfig, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        quotingType: "'",
        forceQuotes: true,
    });

    // Add empty line before each '- package-ecosystem:' for better readability
    const formattedYaml = updatedYaml.replace(/(\n)(  - package-ecosystem:)/g, '\n\n$2');

    const header =
        '# Dependabot configuration\n' +
        '# Cooldown delays updating normal npm dependencies by 7 days but allows security updates to be processed immediately.\n' +
        '# Note: Cooldown is not supported for the github-actions ecosystem.\n' +
        '# Reference: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference\n';

    const finalYaml = header + formattedYaml;

    fs.writeFileSync(dependabotPath, finalYaml, 'utf8');
    console.log(`\n✔️ ${dependabotPath} updated successfully.`);
} else {
    console.log(`\nⓘ No changes were made to ${dependabotPath}.`);
}

console.log(`\n✔️ processing completed (template: ${templateName}, repository: ${repositoryName})`);

process.exit(0);

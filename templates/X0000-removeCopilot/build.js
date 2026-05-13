// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// If no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

'use strict';

const fs = require('node:fs');

// Standard parameter handling
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

// Files to remove
const filesToRemove = [
    '.github/copilot-instructions.md',
    '.github/workflows/check-copilot-template.yml',
    '.github/workflows/initial-copilot-setup.yml',
];

let anyRemoved = false;

for (const filePath of filesToRemove) {
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`✔️ Removed ${filePath}`);
            anyRemoved = true;
        } catch (error) {
            console.error(`❌ Failed to remove ${filePath}: ${error.message}`);
            process.exit(1);
        }
    } else {
        console.log(`ⓘ ${filePath} does not exist, skipping.`);
    }
}

if (!anyRemoved) {
    console.log(`ⓘ No Copilot files found. No changes applied.`);
    process.exit(0);
}

console.log(`✔️ processing completed`);

process.exit(0);

// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// If no changes are needed (e.g., common.noConfig is absent), the script exits without modifying files, preventing PR creation.

const fs = require('node:fs');

// prepare standard parameters
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

const ioPackagePath = './io-package.json';

// Check if io-package.json exists
if (!fs.existsSync(ioPackagePath)) {
    console.log(`❌ ${ioPackagePath} does not exist, cannot create PR.`);
    process.exit(1);
}

console.log(`✔️ ${ioPackagePath} exists.`);

// Read and parse io-package.json
let ioPackage;
let originalContent;
try {
    originalContent = fs.readFileSync(ioPackagePath, 'utf8');
    ioPackage = JSON.parse(originalContent);
} catch (error) {
    console.error(`❌ Error reading or parsing ${ioPackagePath}: ${error.message}`);
    process.exit(1);
}

// Check if common.noConfig exists
if (ioPackage.common === undefined || ioPackage.common.noConfig === undefined) {
    console.log(`✔️ common.noConfig does not exist, no need for a PR.`);
    process.exit(0);
}

const noConfigValue = ioPackage.common.noConfig;
console.log(`ⓘ common.noConfig exists with value: ${noConfigValue}, proceeding.`);

// Detect indentation style from the original file
const indentMatch = originalContent.match(/^(\s+)"[^"]+"\s*:/m);
const indent = indentMatch ? indentMatch[1] : '    ';

// Detect whether the file ends with a newline
const hasTrailingNewline = originalContent.endsWith('\n');

// Remove common.noConfig
delete ioPackage.common.noConfig;
console.log(`✔️ common.noConfig has been removed.`);

if (noConfigValue === true) {
    // Add common.adminUI.config = "none", creating common.adminUI if it does not yet exist
    if (!ioPackage.common.adminUI) {
        ioPackage.common.adminUI = {};
    }
    ioPackage.common.adminUI.config = 'none';
    console.log(`✔️ common.adminUI.config has been set to "none".`);
}

// Rebuild the file content preserving indentation and trailing newline
const newContent = JSON.stringify(ioPackage, null, indent) + (hasTrailingNewline ? '\n' : '');

// Validate that the new content is still valid JSON
try {
    JSON.parse(newContent);
} catch (error) {
    console.error(`❌ Generated invalid JSON: ${error.message}`);
    process.exit(1);
}

console.log(`✔️ Validated that resulting JSON is valid.`);

// Write the updated content
fs.writeFileSync(ioPackagePath, newContent, 'utf8');

console.log(`✔️ processing completed`);

process.exit(0);

// This script implements the required changes for a PR 
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR. 

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

// Check if common.title exists
if (ioPackage.common?.title === undefined) {
    console.log(`✔️ common.title does not exist, no need for a PR.`);
    process.exit(0);
}

console.log(`ⓘ Found common.title attribute`);

// Check if common.titleLang exists
if (ioPackage.common?.titleLang === undefined) {
    console.log(`❌ common.titleLang does not exist, cannot remove common.title. Both attributes are required for this fix.`);
    process.exit(1);
}

console.log(`✔️ Found common.titleLang attribute`);

// Both attributes exist, proceed with removal of common.title
console.log(`ⓘ Removing common.title attribute`);

// Use the simple approach: remove the attribute from the parsed object and regenerate
// This ensures valid JSON and proper formatting
delete ioPackage.common.title;

// Regenerate the JSON content with proper formatting
const newContent = JSON.stringify(ioPackage, null, 4) + '\n';

// Validate that the new content is valid JSON
try {
    JSON.parse(newContent);
} catch (error) {
    console.error(`❌ Generated invalid JSON: ${error.message}`);
    process.exit(1);
}

// Write the updated content
fs.writeFileSync(ioPackagePath, newContent, 'utf8');
console.log(`✔️ Removed common.title from ${ioPackagePath}`);

console.log(`✔️ processing completed`);

process.exit(0);


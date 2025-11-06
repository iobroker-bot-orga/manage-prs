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
const packageJsonPath = './package.json';

// Check if io-package.json exists
if (!fs.existsSync(ioPackagePath)) {
    console.log(`❌ ${ioPackagePath} does not exist, cannot create PR.`);
    process.exit(0);
}

console.log(`✔️ ${ioPackagePath} exists.`);

// Read and parse io-package.json
let ioPackage;
try {
    const ioPackageContent = fs.readFileSync(ioPackagePath, 'utf8');
    ioPackage = JSON.parse(ioPackageContent);
} catch (error) {
    console.error(`❌ Error reading or parsing ${ioPackagePath}: ${error.message}`);
    process.exit(1);
}

// Check if common.licenseInformation already exists
if (ioPackage.common?.licenseInformation !== undefined) {
    console.log(`✔️ common.licenseInformation already exists, no need for a PR.`);
    process.exit(0);
}

console.log(`ⓘ common.licenseInformation does not exist, proceeding with migration.`);

// Try to find license value from common.license first
let licenseValue = null;

if (ioPackage.common?.license) {
    licenseValue = ioPackage.common.license;
    console.log(`✔️ Found common.license with value: ${licenseValue}`);
} else {
    console.log(`ⓘ common.license does not exist in ${ioPackagePath}`);
    
    // Try to find license in package.json
    if (fs.existsSync(packageJsonPath)) {
        console.log(`✔️ ${packageJsonPath} exists.`);
        
        try {
            const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(packageJsonContent);
            
            if (packageJson.license) {
                licenseValue = packageJson.license;
                console.log(`✔️ Found license in ${packageJsonPath} with value: ${licenseValue}`);
            } else {
                console.log(`ⓘ license attribute does not exist in ${packageJsonPath}`);
            }
        } catch (error) {
            console.error(`❌ Error reading or parsing ${packageJsonPath}: ${error.message}`);
            process.exit(1);
        }
    } else {
        console.log(`ⓘ ${packageJsonPath} does not exist`);
    }
}

// If we still don't have a license value, we cannot proceed
if (!licenseValue) {
    console.log(`❌ No license information found in either ${ioPackagePath} or ${packageJsonPath}, cannot create PR.`);
    process.exit(0);
}

// Read the original file to preserve formatting
const originalContent = fs.readFileSync(ioPackagePath, 'utf8');

// Find the position of common.license to replace it
const licenseRegex = /"license"\s*:\s*"[^"]*"/;
const licenseMatch = originalContent.match(licenseRegex);

if (!licenseMatch) {
    console.log(`❌ Could not find common.license attribute in ${ioPackagePath}, cannot create PR.`);
    process.exit(0);
}

console.log(`✔️ Found common.license attribute at position ${licenseMatch.index}`);

// Find the beginning of the line (including indentation)
let lineStart = licenseMatch.index;
while (lineStart > 0 && originalContent[lineStart - 1] !== '\n') {
    lineStart--;
}

// Extract indentation from the license line
const linePrefix = originalContent.substring(lineStart, licenseMatch.index);
const indentation = linePrefix.match(/^\s*/)[0];

console.log(`ⓘ Using indentation: ${indentation.length} spaces`);

// Build the licenseInformation object
const licenseInformation = {
    type: 'free',
    license: licenseValue
};

// Build the replacement string with proper indentation
// Note: We need to add extra indentation for nested properties (4 spaces more)
const licenseInfoLines = [
    `"licenseInformation": {`,
    `${indentation}    "type": "free",`,
    `${indentation}    "license": "${licenseValue}"`,
    `${indentation}}`
];

const replacement = licenseInfoLines.join('\n');

// Replace the old license attribute with the new licenseInformation object
const newContent = originalContent.replace(licenseRegex, replacement);

// Validate that the new content is valid JSON
try {
    JSON.parse(newContent);
} catch (error) {
    console.error(`❌ Generated invalid JSON: ${error.message}`);
    process.exit(1);
}

// Write the updated content
fs.writeFileSync(ioPackagePath, newContent, 'utf8');
console.log(`✔️ Replaced common.license with common.licenseInformation in ${ioPackagePath}`);

console.log(`✔️ processing completed`);

process.exit(0);

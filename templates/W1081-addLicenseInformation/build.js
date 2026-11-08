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

// Check if common.licenseInformation already exists
if (ioPackage.common?.licenseInformation !== undefined) {
    console.log(`✔️ common.licenseInformation already exists, no need for a PR.`);
    process.exit(0);
}

console.log(`ⓘ common.licenseInformation does not exist, proceeding with migration.`);

// Try to find license value from common.license first
let licenseValue = null;
const hasCommonLicense = !!ioPackage.common?.license;

if (hasCommonLicense) {
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
    process.exit(1);
}

// Find the common section
const commonMatch = originalContent.match(/"common"\s*:\s*\{/);
if (!commonMatch) {
    console.log(`❌ Could not find 'common' section in ${ioPackagePath}, cannot create PR.`);
    process.exit(1);
}

const commonSectionStart = commonMatch.index + commonMatch[0].length;

// Detect indentation used in the file by looking at the first property inside common
const afterCommonOpen = originalContent.substring(commonSectionStart);
const firstPropMatch = afterCommonOpen.match(/\r?\n(\s+)"/);
const indentation = firstPropMatch ? firstPropMatch[1] : '    ';

// Detect the indentation of the common object itself to compute the increment
const commonLineStart = originalContent.lastIndexOf('\n', commonMatch.index) + 1;
const commonIndent = originalContent.substring(commonLineStart, commonMatch.index).match(/^\s*/)[0];
const indentIncrement = indentation.length > commonIndent.length
    ? indentation.substring(commonIndent.length)
    : '    ';

console.log(`ⓘ Using indentation: ${indentation.length} spaces, increment: ${indentIncrement.length} spaces`);

// Build the licenseInformation block string
const licenseInfoLines = [
    `"licenseInformation": {`,
    `${indentation}${indentIncrement}"type": "free",`,
    `${indentation}${indentIncrement}"license": ${JSON.stringify(licenseValue)}`,
    `${indentation}}`
];
const licenseInfoBlock = licenseInfoLines.join('\n');

let newContent;

if (hasCommonLicense) {
    // Replace common.license with licenseInformation (adds licenseInformation and removes common.license in one step)
    const commonSectionStr = originalContent.substring(commonSectionStart);
    const licenseRegex = /"license"\s*:\s*"(?:[^"\\]|\\.)*"/;
    const licenseMatch = commonSectionStr.match(licenseRegex);

    if (!licenseMatch) {
        console.log(`❌ Could not find common.license attribute in ${ioPackagePath}, cannot create PR.`);
        process.exit(1);
    }

    const licenseAbsIndex = commonSectionStart + licenseMatch.index;
    console.log(`✔️ Found common.license attribute at position ${licenseAbsIndex}`);

    const oldLicenseString = originalContent.substring(licenseAbsIndex, licenseAbsIndex + licenseMatch[0].length);
    newContent = originalContent.slice(0, licenseAbsIndex) + licenseInfoBlock + originalContent.slice(licenseAbsIndex + oldLicenseString.length);

    console.log(`✔️ Replaced common.license with common.licenseInformation`);
} else {
    // Insert licenseInformation at the beginning of the common section (after the opening '{' + newline)
    // Find the newline right after the opening '{'
    let insertPos = commonSectionStart;
    const eol = originalContent.indexOf('\r\n', insertPos) === insertPos ? '\r\n' : '\n';

    newContent =
        originalContent.slice(0, insertPos) +
        eol + indentation + licenseInfoBlock + ',' +
        originalContent.slice(insertPos);

    console.log(`✔️ Inserted common.licenseInformation at beginning of common section`);
}

// Validate that the new content is valid JSON
try {
    JSON.parse(newContent);
} catch (error) {
    console.error(`❌ Generated invalid JSON: ${error.message}`);
    process.exit(1);
}

console.log(`✔️ Validated that resulting JSON is valid.`);

// Write the updated content
fs.writeFileSync(ioPackagePath, newContent, 'utf8');
console.log(`✔️ Added common.licenseInformation to ${ioPackagePath}`);

console.log(`✔️ processing completed`);

process.exit(0);

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

const hasLicenseInformation = ioPackage.common?.licenseInformation !== undefined;
const hasCommonLicense = !!ioPackage.common?.license;

// Determine what needs to be done
if (hasLicenseInformation && !hasCommonLicense) {
    console.log(`✔️ common.licenseInformation already exists and common.license is absent, no need for a PR.`);
    process.exit(0);
}

if (hasLicenseInformation) {
    console.log(`ⓘ common.licenseInformation already exists but common.license is also present — will remove common.license.`);
} else {
    console.log(`ⓘ common.licenseInformation does not exist, proceeding with migration.`);
}

// Find the common section (needed for both add and remove operations)
const commonMatch = originalContent.match(/"common"\s*:\s*\{/);
if (!commonMatch) {
    console.log(`❌ Could not find 'common' section in ${ioPackagePath}, cannot create PR.`);
    process.exit(1);
}

const commonSectionStart = commonMatch.index + commonMatch[0].length;

let newContent = originalContent;

// --- Step 1: Add licenseInformation (skip if it already exists) ---
if (!hasLicenseInformation) {
    // Find license value
    let licenseValue = null;

    if (hasCommonLicense) {
        licenseValue = ioPackage.common.license;
        console.log(`✔️ Found common.license with value: ${licenseValue}`);
    } else {
        console.log(`ⓘ common.license does not exist in ${ioPackagePath}`);

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

    if (!licenseValue) {
        console.log(`❌ No license information found in either ${ioPackagePath} or ${packageJsonPath}, cannot create PR.`);
        process.exit(1);
    }

    // Detect indentation used in the file by looking at the first property inside common
    const afterCommonOpen = newContent.substring(commonSectionStart);
    const firstPropMatch = afterCommonOpen.match(/\r?\n(\s+)"/);
    const indentation = firstPropMatch ? firstPropMatch[1] : '    ';

    // Detect the indentation of the common object itself to compute the increment
    const commonLineStart = newContent.lastIndexOf('\n', commonMatch.index) + 1;
    const commonIndent = newContent.substring(commonLineStart, commonMatch.index).match(/^\s*/)[0];
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

    if (hasCommonLicense) {
        // Replace common.license with licenseInformation (adds licenseInformation and removes common.license in one step)
        const commonSectionStr = newContent.substring(commonSectionStart);
        const licenseRegex = /"license"\s*:\s*"(?:[^"\\]|\\.)*"/;
        const licenseMatch = commonSectionStr.match(licenseRegex);

        if (!licenseMatch) {
            console.log(`❌ Could not find common.license attribute in ${ioPackagePath}, cannot create PR.`);
            process.exit(1);
        }

        const licenseAbsIndex = commonSectionStart + licenseMatch.index;
        console.log(`✔️ Found common.license attribute at position ${licenseAbsIndex}`);

        newContent = newContent.slice(0, licenseAbsIndex) + licenseInfoBlock + newContent.slice(licenseAbsIndex + licenseMatch[0].length);

        console.log(`✔️ Replaced common.license with common.licenseInformation`);
    } else {
        // Insert licenseInformation at the beginning of the common section (after the opening '{')
        const insertPos = commonSectionStart;
        const eol = newContent.indexOf('\r\n', insertPos) === insertPos ? '\r\n' : '\n';

        newContent =
            newContent.slice(0, insertPos) +
            eol + indentation + licenseInfoBlock + ',' +
            newContent.slice(insertPos);

        console.log(`✔️ Inserted common.licenseInformation at beginning of common section`);
    }
}

// --- Step 2: Remove common.license if it still exists ---
// (When hasCommonLicense was true and !hasLicenseInformation, the replace above already removed it.
//  This step handles the case where licenseInformation existed but license was also present.)
if (hasLicenseInformation && hasCommonLicense) {
    // Find the updated common section boundaries
    const updatedCommonMatch = newContent.match(/"common"\s*:\s*\{/);
    if (!updatedCommonMatch) {
        console.error(`❌ Could not find 'common' section in ${ioPackagePath}`);
        process.exit(1);
    }

    const updatedCommonStart = updatedCommonMatch.index + updatedCommonMatch[0].length;

    // Find the end of the common section (matching closing brace)
    let braceCount = 1;
    let commonEnd = updatedCommonStart;
    let inString = false;
    let escapeNext = false;

    for (let i = updatedCommonStart; i < newContent.length && braceCount > 0; i++) {
        const char = newContent[i];

        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\' && inString) { escapeNext = true; continue; }
        if (char === '"') { inString = !inString; continue; }

        if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            if (braceCount === 0) { commonEnd = i; break; }
        }
    }

    const beforeCommon = newContent.slice(0, updatedCommonStart);
    const commonContent = newContent.slice(updatedCommonStart, commonEnd);
    const afterCommon = newContent.slice(commonEnd);

    // Match only a top-level "license" line (direct property of common, not nested inside licenseInformation)
    // We find the common section's direct children by tracking brace depth within commonContent
    let targetLineStart = -1;
    let targetLineEnd = -1;
    let depth = 0;
    let inStr = false;
    let esc = false;
    let lineStart = 0;

    for (let i = 0; i <= commonContent.length; i++) {
        const char = commonContent[i];

        if (char === '\n' || i === commonContent.length) {
            const line = commonContent.slice(lineStart, i + 1);
            // Only consider top-level properties (depth === 0, not inside any nested object)
            if (depth === 0) {
                const propMatch = line.match(/^\s*"license"\s*:\s*"(?:[^"\\]|\\.)*"\s*,?\s*\r?\n?$/);
                if (propMatch) {
                    targetLineStart = lineStart;
                    targetLineEnd = i + 1;
                    break;
                }
            }
            lineStart = i + 1;
        }

        if (esc) { esc = false; continue; }
        if (char === '\\' && inStr) { esc = true; continue; }
        if (char === '"') { inStr = !inStr; continue; }
        if (!inStr) {
            if (char === '{' || char === '[') depth++;
            if (char === '}' || char === ']') depth--;
        }
    }

    if (targetLineStart === -1) {
        console.error(`❌ Could not find top-level "license" line in common section`);
        process.exit(1);
    }

    const fullLine = commonContent.slice(targetLineStart, targetLineEnd);
    const hasTrailingComma = fullLine.trimEnd().endsWith(',');

    let newCommonContent;
    if (hasTrailingComma) {
        newCommonContent = commonContent.slice(0, targetLineStart) + commonContent.slice(targetLineEnd);
    } else {
        // Last property — remove trailing comma from the previous non-whitespace character
        let searchPos = targetLineStart - 1;
        while (searchPos >= 0 && /\s/.test(commonContent[searchPos])) {
            searchPos--;
        }

        if (searchPos >= 0 && commonContent[searchPos] === ',') {
            newCommonContent = commonContent.slice(0, searchPos) + commonContent.slice(searchPos + 1, targetLineStart) + commonContent.slice(targetLineEnd);
        } else {
            newCommonContent = commonContent.slice(0, targetLineStart) + commonContent.slice(targetLineEnd);
        }
    }

    newContent = beforeCommon + newCommonContent + afterCommon;
    console.log(`✔️ Removed common.license from ${ioPackagePath}`);
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

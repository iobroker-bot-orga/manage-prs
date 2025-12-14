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
    console.log(`⚠️ common.titleLang does not exist, cannot remove common.title. Both attributes are required for this fix.`);
    process.exit(0);
}

console.log(`✔️ Found common.titleLang attribute`);

// Both attributes exist, proceed with removal of common.title
console.log(`ⓘ Removing common.title attribute`);

// Use string-based removal to preserve original formatting
// This approach ensures we only remove the "title" line without changing indentation or property order

// First, we need to find the "common" section in the file
const commonSectionPattern = /"common"\s*:\s*\{/;
const commonMatch = originalContent.match(commonSectionPattern);

if (!commonMatch) {
    console.error(`❌ Could not find "common" section in ${ioPackagePath}`);
    process.exit(1);
}

const commonStart = commonMatch.index + commonMatch[0].length;

// Find the end of the common section (matching closing brace)
// We need to account for braces inside string literals
let braceCount = 1;
let commonEnd = commonStart;
let inString = false;
let escapeNext = false;

for (let i = commonStart; i < originalContent.length && braceCount > 0; i++) {
    const char = originalContent[i];
    
    if (escapeNext) {
        escapeNext = false;
        continue;
    }
    
    if (char === '\\' && inString) {
        escapeNext = true;
        continue;
    }
    
    if (char === '"') {
        inString = !inString;
        continue;
    }
    
    if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (braceCount === 0) {
            commonEnd = i;
            break;
        }
    }
}

// Extract the common section content
const beforeCommon = originalContent.slice(0, commonStart);
const commonContent = originalContent.slice(commonStart, commonEnd);
const afterCommon = originalContent.slice(commonEnd);

// Find the line with "title" in the common section only
// Pattern: newline or start, optional whitespace, "title", optional whitespace, colon, value, optional comma, newline
// The value pattern handles escaped quotes: (?:[^"\\]|\\.)*
// We need to be careful with the newline matching - the line starts AFTER a newline (or at the beginning)
// and ends WITH a newline that should be removed
const titleLinePattern = /(\r?\n)?(\s*)"title"\s*:\s*"(?:[^"\\]|\\.)*"\s*,?\s*(\r?\n)/;

const match = commonContent.match(titleLinePattern);

if (!match) {
    console.error(`❌ Could not find "title" line in common section of ${ioPackagePath}`);
    process.exit(1);
}

/**
 * Removes a property line from a JSON section, handling comma placement correctly
 * @param {string} content - The content to remove the line from
 * @param {number} lineStart - Start index of the line to remove
 * @param {number} lineEnd - End index of the line to remove
 * @param {boolean} hasTrailingComma - Whether the line has a trailing comma
 * @returns {string} - The content with the line removed
 */
function removePropertyLine(content, lineStart, lineEnd, hasTrailingComma) {
    if (hasTrailingComma) {
        // Line has a trailing comma, just remove the entire line
        return content.slice(0, lineStart) + content.slice(lineEnd);
    }
    
    // This line doesn't have a trailing comma, so it must be the last property
    // We need to remove the comma from the previous line
    let searchPos = lineStart - 1;
    
    // Skip backwards over whitespace to find the comma
    while (searchPos >= 0 && /\s/.test(content[searchPos])) {
        searchPos--;
    }
    
    if (searchPos >= 0 && content[searchPos] === ',') {
        // Remove the comma from the previous line and the entire title line
        return content.slice(0, searchPos) + content.slice(searchPos + 1, lineStart) + content.slice(lineEnd);
    }
    
    // No comma found (shouldn't happen in valid JSON), just remove the line
    return content.slice(0, lineStart) + content.slice(lineEnd);
}

const fullMatch = match[0];
const precedingNewline = match[1] || ''; // Group 1: optional preceding newline
const indentation = match[2];             // Group 2: indentation spaces/tabs
const trailingNewline = match[3];         // Group 3: trailing newline

// Calculate the actual line start and end
// If there's a preceding newline, we want to keep it, so start after it
const lineStart = match.index + precedingNewline.length;
const lineEnd = lineStart + fullMatch.length - precedingNewline.length;

// Check if this line has a trailing comma (before the newline)
const hasTrailingComma = fullMatch.trimEnd().endsWith(',');

// Remove the property line with proper comma handling
const newCommonContent = removePropertyLine(commonContent, lineStart, lineEnd, hasTrailingComma);

// Reconstruct the full content
const newContent = beforeCommon + newCommonContent + afterCommon;

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
console.log(`✔️ Removed common.title from ${ioPackagePath}`);

console.log(`✔️ processing completed`);

process.exit(0);

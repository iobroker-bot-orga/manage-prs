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

// Check if adminTab.fa-icon exists
if (!ioPackage.common?.adminTab || ioPackage.common.adminTab['fa-icon'] === undefined) {
    console.log(`✔️ adminTab.fa-icon does not exist, no need for a PR.`);
    process.exit(0);
}

console.log(`ⓘ adminTab.fa-icon exists, proceeding with removal.`);

// Use string-based removal to preserve original formatting
// This approach ensures we only remove the "fa-icon" line without changing indentation or property order

// First, we need to find the "adminTab" section in the file
const adminTabSectionPattern = /"adminTab"\s*:\s*\{/;
const adminTabMatch = originalContent.match(adminTabSectionPattern);

if (!adminTabMatch) {
    console.error(`❌ Could not find "adminTab" section in ${ioPackagePath}`);
    process.exit(1);
}

const adminTabStart = adminTabMatch.index + adminTabMatch[0].length;

// Find the end of the adminTab section (matching closing brace)
// We need to account for braces inside string literals
let braceCount = 1;
let adminTabEnd = adminTabStart;
let inString = false;
let escapeNext = false;

for (let i = adminTabStart; i < originalContent.length && braceCount > 0; i++) {
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
            adminTabEnd = i;
            break;
        }
    }
}

// Extract the adminTab section content
const beforeAdminTab = originalContent.slice(0, adminTabStart);
const adminTabContent = originalContent.slice(adminTabStart, adminTabEnd);
const afterAdminTab = originalContent.slice(adminTabEnd);

// Find the line with "fa-icon" in the adminTab section only
// Pattern explanation:
// - (\r?\n)? : Group 1 - Optional preceding newline (this belongs to previous line, we preserve it)
// - (?:\s*) : Non-capturing - Indentation whitespace at start of fa-icon line
// - "fa-icon"\s*:\s*"(?:[^"\\]|\\.)*" : The property key-value
//   * (?:[^"\\]|\\.)* handles string values with escaped quotes: matches either non-quote/non-backslash OR backslash+any-char
//   * This allows values like "fas fa-test" or values with escaped quotes like "test\"value"
// - (?:[ \t]*) : Non-capturing - Optional spaces/tabs before comma
//   * Uses [ \t] (space and tab only) not \s to avoid matching newlines
// - (,?) : Group 2 - Optional comma (checked to determine removal strategy)
// - (?:[ \t]*) : Non-capturing - Optional spaces/tabs after comma
// - (?:\r?\n)? : Non-capturing - Optional trailing newline (removed with the line)
const faIconLinePattern = /(\r?\n)?(?:\s*)"fa-icon"\s*:\s*"(?:[^"\\]|\\.)*"(?:[ \t]*)(,?)(?:[ \t]*)(?:\r?\n)?/;

const match = adminTabContent.match(faIconLinePattern);

if (!match) {
    console.error(`❌ Could not find "fa-icon" line in adminTab section of ${ioPackagePath}`);
    process.exit(1);
}

/**
 * Removes a property line from a JSON section, handling comma placement correctly
 * @param {string} content - The content to remove the line from (relative to adminTabContent)
 * @param {number} lineStart - Start index of the line to remove (relative to adminTabContent)
 * @param {number} lineEnd - End index of the line to remove (relative to adminTabContent)
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
        // Remove the comma from the previous line and the entire fa-icon line
        return content.slice(0, searchPos) + content.slice(searchPos + 1, lineStart) + content.slice(lineEnd);
    }
    
    // No comma found (shouldn't happen in valid JSON)
    // This may indicate malformed JSON or unexpected structure in the adminTab section
    console.warn('⚠️ Warning: Could not find comma on previous line when removing last property. This may indicate malformed JSON or unexpected structure in the adminTab section. Removing line without comma adjustment.');
    return content.slice(0, lineStart) + content.slice(lineEnd);
}

const fullMatch = match[0];
const precedingNewline = match[1] || '';  // Group 1: optional preceding newline
const comma = match[2];                    // Group 2: comma (if present)

// Calculate positions for removal
// match.index points to start of fullMatch (including any preceding newline)
// We want to preserve the preceding newline (it ends the previous line), so:
// - lineStart = position AFTER the preceding newline (start of content to remove)
// - lineEnd = position at end of fullMatch (end of content to remove)
const lineStart = match.index + precedingNewline.length;
const lineEnd = match.index + fullMatch.length;

// Check if this line has a trailing comma
const hasTrailingComma = comma === ',';

// Remove the property line with proper comma handling
const newAdminTabContent = removePropertyLine(adminTabContent, lineStart, lineEnd, hasTrailingComma);

// Reconstruct the full content
const newContent = beforeAdminTab + newAdminTabContent + afterAdminTab;

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
console.log(`✔️ Removed adminTab.fa-icon from ${ioPackagePath}`);

console.log(`✔️ processing completed`);

process.exit(0);

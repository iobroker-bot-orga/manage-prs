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

// Check if common.installedFrom or installedFrom exists
const hasCommonInstalledFrom = ioPackage.common?.installedFrom !== undefined;
const hasInstalledFrom = ioPackage.installedFrom !== undefined;

if (!hasCommonInstalledFrom && !hasInstalledFrom) {
    console.log(`✔️ Neither common.installedFrom nor installedFrom exists, no need for a PR.`);
    process.exit(0);
}

if (hasCommonInstalledFrom) {
    console.log(`ⓘ common.installedFrom exists with value: ${ioPackage.common.installedFrom}, proceeding with removal.`);
}

if (hasInstalledFrom) {
    console.log(`ⓘ installedFrom exists with value: ${ioPackage.installedFrom}, proceeding with removal.`);
}

// Use string-based removal to preserve original formatting
// This approach ensures we only remove the property lines without changing indentation or property order

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
        // Remove the comma from the previous line and the entire property line
        return content.slice(0, searchPos) + content.slice(searchPos + 1, lineStart) + content.slice(lineEnd);
    }
    
    // No comma found (shouldn't happen in valid JSON), just remove the line
    return content.slice(0, lineStart) + content.slice(lineEnd);
}

/**
 * Find and remove a property from a JSON section
 * @param {string} content - The full JSON content
 * @param {string} sectionName - The section name (e.g., "common" or null for root)
 * @param {string} propertyName - The property name to remove
 * @returns {string} - The content with the property removed, or original content if not found
 */
function removeProperty(content, sectionName, propertyName) {
    let sectionStart, sectionEnd, sectionContent;
    
    if (sectionName) {
        // Find the section in the file
        const sectionPattern = new RegExp(`"${sectionName}"\\s*:\\s*\\{`);
        const sectionMatch = content.match(sectionPattern);
        
        if (!sectionMatch) {
            console.log(`ⓘ Could not find "${sectionName}" section, skipping ${propertyName} removal.`);
            return content;
        }
        
        sectionStart = sectionMatch.index + sectionMatch[0].length;
        
        // Find the end of the section (matching closing brace)
        let braceCount = 1;
        sectionEnd = sectionStart;
        let inString = false;
        let escapeNext = false;
        
        for (let i = sectionStart; i < content.length && braceCount > 0; i++) {
            const char = content[i];
            
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
                    sectionEnd = i;
                    break;
                }
            }
        }
        
        sectionContent = content.slice(sectionStart, sectionEnd);
    } else {
        // Work with root level - find content between the outermost braces
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
            console.log(`⚠️ Could not find root level braces, skipping ${propertyName} removal.`);
            return content;
        }
        
        sectionStart = firstBrace + 1;
        sectionEnd = lastBrace;
        sectionContent = content.slice(sectionStart, sectionEnd);
    }
    
    // Find the property line in the section
    // We need to find the property and its value, which could be:
    // - A string: "value"
    // - A number: 123
    // - A boolean: true/false
    // - An object: { ... }
    // - An array: [ ... ]
    // - null
    // For simplicity and safety, we'll match string values (which is what installedFrom always is)
    // Pattern: optional whitespace, property name, optional whitespace, colon, string value, optional comma, newline
    const propertyPattern = new RegExp(`^(\\s*)"${propertyName}"\\s*:\\s*"(?:[^"\\\\]|\\\\.)*"\\s*,?\\s*\\r?\\n`, 'm');
    
    const match = sectionContent.match(propertyPattern);
    
    if (!match) {
        console.log(`ⓘ Could not find "${propertyName}" in ${sectionName || 'root'} section, skipping.`);
        return content;
    }
    
    const fullMatch = match[0];
    const lineStart = match.index;
    const lineEnd = lineStart + fullMatch.length;
    
    // Check if this line has a trailing comma (before the newline)
    const hasTrailingComma = fullMatch.trimEnd().endsWith(',');
    
    // Remove the property line with proper comma handling
    const newSectionContent = removePropertyLine(sectionContent, lineStart, lineEnd, hasTrailingComma);
    
    // Reconstruct the full content
    const beforeSection = content.slice(0, sectionStart);
    const afterSection = content.slice(sectionEnd);
    
    return beforeSection + newSectionContent + afterSection;
}

let newContent = originalContent;

// Remove common.installedFrom if it exists
if (hasCommonInstalledFrom) {
    newContent = removeProperty(newContent, 'common', 'installedFrom');
    
    // Validate that the new content is valid JSON
    try {
        JSON.parse(newContent);
        console.log(`✔️ Successfully removed common.installedFrom and validated JSON.`);
    } catch (error) {
        console.error(`❌ Generated invalid JSON after removing common.installedFrom: ${error.message}`);
        process.exit(1);
    }
}

// Remove installedFrom if it exists
if (hasInstalledFrom) {
    newContent = removeProperty(newContent, null, 'installedFrom');
    
    // Validate that the new content is valid JSON
    try {
        JSON.parse(newContent);
        console.log(`✔️ Successfully removed installedFrom and validated JSON.`);
    } catch (error) {
        console.error(`❌ Generated invalid JSON after removing installedFrom: ${error.message}`);
        process.exit(1);
    }
}

// Write the updated content
fs.writeFileSync(ioPackagePath, newContent, 'utf8');
console.log(`✔️ Updated ${ioPackagePath}`);

console.log(`✔️ processing completed`);

process.exit(0);

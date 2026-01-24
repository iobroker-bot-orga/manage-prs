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

const packageJsonPath = './package.json';
const ioPackageJsonPath = './io-package.json';

let changesMade = false;

// Constants for regex patterns
const TRAILING_BRACKET_PATTERN = /^(\]\s*,?\s*\n)/;

/**
 * Escape special regex characters in a string
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find the keywords array in JSON content and return its start and end positions
 * @param {string} content - The JSON file content
 * @param {string} keyPath - The path to the keywords array (e.g., 'keywords' or 'common.keywords')
 * @returns {object|null} - Object with start, end, arrayStart, arrayEnd positions and indentation, or null if not found
 */
function findKeywordsArray(content, keyPath) {
    const keys = keyPath.split('.');
    let searchContent = content;
    let baseOffset = 0;
    
    // Navigate through nested objects if needed
    for (let i = 0; i < keys.length - 1; i++) {
        const escapedKey = escapeRegex(keys[i]);
        const keyPattern = new RegExp(`"${escapedKey}"\\s*:\\s*\\{`);
        const match = searchContent.match(keyPattern);
        if (!match) return null;
        
        const sectionStart = match.index + match[0].length;
        baseOffset += sectionStart;
        searchContent = searchContent.slice(sectionStart);
    }
    
    // Find the keywords array
    const lastKey = keys[keys.length - 1];
    const escapedLastKey = escapeRegex(lastKey);
    const keywordsPattern = new RegExp(`(\\s*)"${escapedLastKey}"\\s*:\\s*\\[`);
    const match = searchContent.match(keywordsPattern);
    
    if (!match) return null;
    
    const indentation = match[1];
    const start = baseOffset + match.index;
    const arrayStart = baseOffset + match.index + match[0].length;
    
    // Find the end of the array
    let braceCount = 1;
    let i = arrayStart - baseOffset;
    let inString = false;
    let escapeNext = false;
    
    while (i < searchContent.length && braceCount > 0) {
        const char = searchContent[i];
        
        if (escapeNext) {
            escapeNext = false;
            i++;
            continue;
        }
        
        if (char === '\\' && inString) {
            escapeNext = true;
            i++;
            continue;
        }
        
        if (char === '"') {
            inString = !inString;
        } else if (!inString) {
            if (char === '[') braceCount++;
            if (char === ']') {
                braceCount--;
                if (braceCount === 0) {
                    const arrayEnd = baseOffset + i;
                    // Find the end of the line (including trailing comma if present)
                    let lineEnd = arrayEnd + 1;
                    while (lineEnd < content.length && content[lineEnd] !== '\n') {
                        lineEnd++;
                    }
                    if (lineEnd < content.length && content[lineEnd] === '\n') {
                        lineEnd++;
                    }
                    
                    return {
                        start,
                        end: lineEnd,
                        arrayStart,
                        arrayEnd,
                        indentation
                    };
                }
            }
        }
        i++;
    }
    
    return null;
}

/**
 * Parse keywords array from JSON content string
 * @param {string} content - The content between array brackets
 * @returns {Array} - Array of keyword strings
 */
function parseKeywordsArray(content) {
    const keywords = [];
    let currentKeyword = '';
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        
        if (escapeNext) {
            currentKeyword += char;
            escapeNext = false;
            continue;
        }
        
        if (char === '\\' && inString) {
            escapeNext = true;
            currentKeyword += char;
            continue;
        }
        
        if (char === '"') {
            if (inString) {
                keywords.push(currentKeyword);
                currentKeyword = '';
                inString = false;
            } else {
                inString = true;
            }
        } else if (inString) {
            currentKeyword += char;
        }
    }
    
    return keywords;
}

/**
 * Format keywords array preserving original indentation style
 * @param {Array} keywords - Array of keyword strings
 * @param {string} baseIndent - The base indentation for the keywords property (includes leading newline)
 * @param {string} sampleContent - Sample content from original file to detect indentation
 * @returns {string} - Formatted keywords array content (without opening bracket)
 */
function formatKeywordsArray(keywords, baseIndent, sampleContent) {
    if (keywords.length === 0) {
        return '';
    }
    
    // baseIndent includes the newline, so extract just the spaces
    const baseSpaces = baseIndent.replace(/^\n/, '');
    
    // Detect indentation style from sample content
    // Look for indentation of array items in the sample
    let itemIndent = '    '; // default to 4 spaces
    
    const indentMatch = sampleContent.match(/\n(\s+)"/);
    if (indentMatch) {
        itemIndent = indentMatch[1];
    } else {
        // Fallback: detect indentation from the base indentation
        // Assume array items are indented one level deeper than the property
        // Detect if using tabs or spaces
        if (baseSpaces.includes('\t')) {
            itemIndent = baseSpaces + '\t';
        } else {
            // Count spaces and add same amount
            const spaceCount = baseSpaces.length;
            itemIndent = baseSpaces + ' '.repeat(spaceCount || 2);
        }
    }
    
    const lines = keywords.map((kw, idx) => {
        const comma = idx < keywords.length - 1 ? ',' : '';
        return `\n${itemIndent}"${kw}"${comma}`;
    });
    
    return lines.join('') + `\n${baseSpaces}`;
}

/**
 * Replace keywords array in JSON content while preserving formatting
 * @param {string} content - Original JSON content
 * @param {object} arrayInfo - Information about the array location
 * @param {string} arrayContent - Original array content for indentation detection
 * @param {Array} newKeywords - New keywords to write
 * @returns {string} - Updated JSON content
 */
function replaceKeywordsArray(content, arrayInfo, arrayContent, newKeywords) {
    const formattedArrayContent = formatKeywordsArray(newKeywords, arrayInfo.indentation, arrayContent);
    
    // Get what comes after the closing bracket (], comma, whitespace, newline)
    const afterBracket = content.slice(arrayInfo.arrayEnd);
    const trailingMatch = afterBracket.match(TRAILING_BRACKET_PATTERN);
    const trailing = trailingMatch ? trailingMatch[1] : ']';
    
    // Replace from start of property definition to end of array content
    const beforeProperty = content.slice(0, arrayInfo.start);
    const afterProperty = content.slice(arrayInfo.end);
    
    // Get the property name and opening bracket (e.g., '\n  "keywords": [')
    const propertyPrefix = content.slice(arrayInfo.start, arrayInfo.arrayStart);
    
    // Reconstruct: before + "keywords": [ + array content + ] + after
    return beforeProperty + propertyPrefix + formattedArrayContent + trailing + afterProperty;
}

// Verify that package.json exists and is valid JSON
if (!fs.existsSync(packageJsonPath)) {
    console.log(`❌ ${packageJsonPath} does not exist.`);
    process.exit(1);
}
console.log(`✔️ ${packageJsonPath} exists.`);

let packageJson;
let packageJsonContent;
try {
    packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    packageJson = JSON.parse(packageJsonContent);
} catch (error) {
    console.error(`❌ ${packageJsonPath} is not valid JSON: ${error.message}`);
    process.exit(1);
}
console.log(`✔️ ${packageJsonPath} is valid JSON.`);

// Verify that io-package.json exists and is valid JSON
if (!fs.existsSync(ioPackageJsonPath)) {
    console.log(`❌ ${ioPackageJsonPath} does not exist.`);
    process.exit(1);
}
console.log(`✔️ ${ioPackageJsonPath} exists.`);

let ioPackageJson;
let ioPackageJsonContent;
try {
    ioPackageJsonContent = fs.readFileSync(ioPackageJsonPath, 'utf8');
    ioPackageJson = JSON.parse(ioPackageJsonContent);
} catch (error) {
    console.error(`❌ ${ioPackageJsonPath} is not valid JSON: ${error.message}`);
    process.exit(1);
}
console.log(`✔️ ${ioPackageJsonPath} is valid JSON.`);

// Process package.json
let packageJsonModified = false;

// Check if keywords exists
if (!packageJson.keywords) {
    // Keywords don't exist, need to add them
    // For this case, we'll use JSON.stringify as we're adding a new property
    packageJson.keywords = ['ioBroker'];
    packageJsonModified = true;
    console.log(`ⓘ Added keywords array with "ioBroker" to ${packageJsonPath}.`);
    
    // Write using string manipulation to add the property at the end
    const trimmedContent = packageJsonContent.trimEnd();
    const lastBraceIndex = trimmedContent.lastIndexOf('}');
    
    if (lastBraceIndex === -1) {
        console.error(`❌ Could not find closing brace in ${packageJsonPath}`);
        process.exit(1);
    }
    
    // Detect indentation from existing content
    const indentMatch = packageJsonContent.match(/\n(\s+)"/);
    const indent = indentMatch ? indentMatch[1] : '  ';
    
    // Check if there's content before the closing brace
    const beforeBrace = trimmedContent.slice(0, lastBraceIndex).trimEnd();
    
    // Check if the last property already has a trailing comma
    const hasTrailingComma = beforeBrace.endsWith(',');
    
    // Build the keywords property
    const keywordsProperty = `${indent}"keywords": [\n${indent}${indent}"ioBroker"\n${indent}]`;
    
    if (hasTrailingComma) {
        // Already has comma, just add the new property
        packageJsonContent = trimmedContent.slice(0, lastBraceIndex) + '\n' + keywordsProperty + '\n' + trimmedContent.slice(lastBraceIndex);
    } else {
        // Need to add comma after the last property
        // The beforeBrace ends with the last property value (e.g., '"Test Author"')
        // We need to add a comma after it
        packageJsonContent = beforeBrace + ',\n' + keywordsProperty + '\n' + trimmedContent.slice(lastBraceIndex);
    }
    
    // Validate the new content
    try {
        JSON.parse(packageJsonContent);
        fs.writeFileSync(packageJsonPath, packageJsonContent, 'utf8');
        console.log(`✔️ ${packageJsonPath} updated successfully.`);
        changesMade = true;
    } catch (error) {
        console.error(`❌ Generated invalid JSON: ${error.message}`);
        process.exit(1);
    }
} else {
    // Check if keywords is an array
    if (!Array.isArray(packageJson.keywords)) {
        console.log(`❌ keywords in ${packageJsonPath} is not an array.`);
        process.exit(1);
    }
    
    // Find the keywords array in the original content
    const arrayInfo = findKeywordsArray(packageJsonContent, 'keywords');
    if (!arrayInfo) {
        console.error(`❌ Could not locate keywords array in ${packageJsonPath}`);
        process.exit(1);
    }
    
    // Parse current keywords from the original content
    const arrayContent = packageJsonContent.slice(arrayInfo.arrayStart, arrayInfo.arrayEnd);
    const currentKeywords = parseKeywordsArray(arrayContent);
    
    // Process keywords
    let newKeywords = [...currentKeywords];
    
    // Remove case-insensitive matches of "iobroker" that are not exactly "ioBroker"
    newKeywords = newKeywords.filter(keyword => {
        if (typeof keyword !== 'string') return true;
        const lowerKeyword = keyword.toLowerCase();
        if (lowerKeyword === 'iobroker' && keyword !== 'ioBroker') {
            console.log(`ⓘ Removing incorrect keyword "${keyword}" from ${packageJsonPath}.`);
            packageJsonModified = true;
            return false;
        }
        return true;
    });
    
    // Check if "ioBroker" exists as a keyword
    const hasIoBroker = newKeywords.includes('ioBroker');
    if (!hasIoBroker) {
        newKeywords.unshift('ioBroker');
        packageJsonModified = true;
        console.log(`ⓘ Added "ioBroker" as first keyword in ${packageJsonPath}.`);
    }
    
    // Write package.json if modified
    if (packageJsonModified) {
        try {
            const newContent = replaceKeywordsArray(packageJsonContent, arrayInfo, arrayContent, newKeywords);
            
            // Validate the new content is valid JSON
            JSON.parse(newContent);
            
            fs.writeFileSync(packageJsonPath, newContent, 'utf8');
            console.log(`✔️ ${packageJsonPath} updated successfully.`);
            changesMade = true;
        } catch (error) {
            console.error(`❌ Error writing ${packageJsonPath}: ${error.message}`);
            process.exit(1);
        }
    } else {
        console.log(`ⓘ No changes needed in ${packageJsonPath}.`);
    }
}

// Process io-package.json
let ioPackageJsonModified = false;

// Check if common exists
if (!ioPackageJson.common) {
    console.log(`❌ common section does not exist in ${ioPackageJsonPath}.`);
    process.exit(1);
}

// Check if common.keywords exists
if (!ioPackageJson.common.keywords) {
    // Keywords don't exist in common, but we only remove forbidden keywords, so nothing to do
    console.log(`ⓘ common.keywords does not exist in ${ioPackageJsonPath}, nothing to remove.`);
} else {
    // Check if keywords is an array
    if (!Array.isArray(ioPackageJson.common.keywords)) {
        console.log(`❌ common.keywords in ${ioPackageJsonPath} is not an array.`);
        process.exit(1);
    }
    
    // Find the keywords array in the original content
    const arrayInfo = findKeywordsArray(ioPackageJsonContent, 'common.keywords');
    if (!arrayInfo) {
        console.error(`❌ Could not locate common.keywords array in ${ioPackageJsonPath}`);
        process.exit(1);
    }
    
    // Parse current keywords from the original content
    const arrayContent = ioPackageJsonContent.slice(arrayInfo.arrayStart, arrayInfo.arrayEnd);
    const currentKeywords = parseKeywordsArray(arrayContent);
    
    // Remove case-insensitive matches of "iobroker", "adapter", or "smart home"
    const forbiddenKeywords = ['iobroker', 'adapter', 'smart home'];
    const newKeywords = currentKeywords.filter(keyword => {
        if (typeof keyword !== 'string') return true;
        const lowerKeyword = keyword.toLowerCase();
        if (forbiddenKeywords.includes(lowerKeyword)) {
            console.log(`ⓘ Removing forbidden keyword "${keyword}" from ${ioPackageJsonPath}.`);
            ioPackageJsonModified = true;
            return false;
        }
        return true;
    });
    
    // Write io-package.json if modified
    if (ioPackageJsonModified) {
        try {
            const newContent = replaceKeywordsArray(ioPackageJsonContent, arrayInfo, arrayContent, newKeywords);
            
            // Validate the new content is valid JSON
            JSON.parse(newContent);
            
            fs.writeFileSync(ioPackageJsonPath, newContent, 'utf8');
            console.log(`✔️ ${ioPackageJsonPath} updated successfully.`);
            changesMade = true;
        } catch (error) {
            console.error(`❌ Error writing ${ioPackageJsonPath}: ${error.message}`);
            process.exit(1);
        }
    } else {
        console.log(`ⓘ No changes needed in ${ioPackageJsonPath}.`);
    }
}

if (!changesMade) {
    console.log(`ⓘ No changes were made. Keywords are already correct.`);
}

console.log(`✔️ processing completed`);

process.exit(0);


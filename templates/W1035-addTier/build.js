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

// Calculate default tier value based on adapter type
const adapterType = ioPackage.common?.type;
let defaultTier;

if (['visualization', 'visualization-icons', 'visualization-widgets'].includes(adapterType)) {
    defaultTier = 3;
    console.log(`ⓘ Adapter type is '${adapterType}', default tier is 3`);
} else {
    defaultTier = 2;
    console.log(`ⓘ Adapter type is '${adapterType}', default tier is 2`);
}

// Check if tier already exists
const currentTier = ioPackage.common?.tier;

if (currentTier !== undefined) {
    // Tier exists, check if it's valid (1, 2, or 3)
    if (currentTier === 1 || currentTier === 2 || currentTier === 3) {
        console.log(`✔️ common.tier already exists with valid value '${currentTier}', no need for a PR.`);
        process.exit(0);
    } else {
        console.log(`ⓘ common.tier exists with invalid value '${currentTier}', will update to '${defaultTier}'`);
        ioPackage.common.tier = defaultTier;
    }
} else {
    console.log(`ⓘ common.tier does not exist, will add with value '${defaultTier}'`);
    
    // Need to add tier in the correct location
    // Read the original file to preserve formatting
    const originalContent = fs.readFileSync(ioPackagePath, 'utf8');
    
    // Find the position to insert tier (after loglevel or before license/licenseInformation)
    const commonMatch = originalContent.match(/"common"\s*:\s*\{/);
    if (!commonMatch) {
        console.error(`❌ Could not find 'common' section in ${ioPackagePath}`);
        process.exit(1);
    }
    
    // Try to find loglevel
    const loglevelRegex = /"loglevel"\s*:\s*"[^"]*"/;
    const loglevelMatch = originalContent.match(loglevelRegex);
    let insertPosition;
    let insertMode = 'after'; // 'after' or 'before'
    
    if (loglevelMatch) {
        // Insert after loglevel
        console.log(`ⓘ Found 'loglevel', will insert tier after it`);
        insertPosition = loglevelMatch.index + loglevelMatch[0].length;
        insertMode = 'after';
    } else {
        // Try to find license or licenseInformation
        const licenseMatch = originalContent.match(/"licenseInformation"\s*:\s*("[^"]*"|\{)/) || 
                            originalContent.match(/"license"\s*:\s*"[^"]*"/);
        
        if (licenseMatch) {
            console.log(`ⓘ Found license field, will insert tier before it`);
            // Find the beginning of the line (including indentation)
            let lineStart = licenseMatch.index;
            while (lineStart > 0 && originalContent[lineStart - 1] !== '\n') {
                lineStart--;
            }
            insertPosition = lineStart;
            insertMode = 'before';
        } else {
            console.error(`❌ Could not find suitable position to insert tier`);
            process.exit(1);
        }
    }
    
    // Build the tier line with proper indentation
    // Detect indentation from existing lines
    const lines = originalContent.split('\n');
    let indentation = '        '; // default 8 spaces
    
    // Try to find indentation from common fields
    for (const line of lines) {
        if (line.includes('"loglevel"') || line.includes('"type"') || 
            line.includes('"license"') || line.includes('"name"') || 
            line.includes('"version"')) {
            const match = line.match(/^(\s*)"/);
            if (match) {
                indentation = match[1];
                break;
            }
        }
    }
    
    let tierLine;
    if (insertMode === 'after') {
        // After loglevel, need comma and newline
        tierLine = `,\n${indentation}"tier": ${defaultTier}`;
    } else {
        // Before license, need the tier line with comma
        tierLine = `${indentation}"tier": ${defaultTier},\n`;
    }
    
    // Insert the tier line
    const newContent = originalContent.slice(0, insertPosition) + 
                       tierLine + 
                       originalContent.slice(insertPosition);
    
    // Validate JSON
    try {
        JSON.parse(newContent);
    } catch (error) {
        console.error(`❌ Generated invalid JSON: ${error.message}`);
        process.exit(1);
    }
    
    // Write the updated content
    fs.writeFileSync(ioPackagePath, newContent, 'utf8');
    console.log(`✔️ Added tier attribute to ${ioPackagePath}`);
    console.log(`✔️ processing completed`);
    process.exit(0);
}

// If we're here, we updated an existing invalid tier value using the parsed JSON object
// Write the updated JSON back to file
try {
    const updatedContent = JSON.stringify(ioPackage, null, 4) + '\n';
    fs.writeFileSync(ioPackagePath, updatedContent, 'utf8');
    console.log(`✔️ Updated tier attribute in ${ioPackagePath}`);
} catch (error) {
    console.error(`❌ Error writing ${ioPackagePath}: ${error.message}`);
    process.exit(1);
}

console.log(`✔️ processing completed`);
process.exit(0);


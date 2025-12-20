// This script implements the required changes for a PR 
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of an PR. 

const fs = require('node:fs');
const path = require('node:path');

// Schema URLs
const SCHEMA_IOPACKAGE = 'https://raw.githubusercontent.com/ioBroker/ioBroker.js-controller/master/schemas/io-package.json';
const SCHEMA_JSONCONFIG = 'https://raw.githubusercontent.com/ioBroker/ioBroker.admin/master/packages/jsonConfig/schemas/jsonConfig.json';

// All jsonConfig file patterns
const JSONCONFIG_FILES = [
    'admin/jsonConfig.json',
    'admin/jsonCustom.json',
    'admin/jsonTab.json',
    'admin/jsonConfig.json5',
    'admin/jsonCustom.json5',
    'admin/jsonTab.json5'
];

let changesMade = false;

/**
 * Check if .vscode/settings.json exists
 */
const vsCodeSettingsPath = '.vscode/settings.json';
if (!fs.existsSync(vsCodeSettingsPath)) {
    console.log('ⓘ .vscode/settings.json does not exist. No PR is needed.');
    process.exit(0);
}
console.log(`✔️ ${vsCodeSettingsPath} exists.`);

/**
 * Validate io-package.json using JSON5 parser
 */
const ioPackagePath = 'io-package.json';
if (!fs.existsSync(ioPackagePath)) {
    console.log(`❌ io-package.json does not exist.`);
    process.exit(1);
}

let ioPackageContent;
let JSON5;
try {
    JSON5 = require('json5');
} catch (error) {
    console.log(`❌ json5 package is not available. Please install it: ${error.message}`);
    process.exit(1);
}

try {
    ioPackageContent = fs.readFileSync(ioPackagePath, 'utf8');
    // Try to parse with JSON5 to support comments
    JSON5.parse(ioPackageContent);
    console.log(`✔️ io-package.json is valid JSON.`);
} catch (error) {
    console.log(`❌ io-package.json is not valid JSON: ${error.message}`);
    process.exit(1);
}

/**
 * Read and parse .vscode/settings.json
 */
let settingsContent;
let settings;
try {
    settingsContent = fs.readFileSync(vsCodeSettingsPath, 'utf8');
    settings = JSON.parse(settingsContent);
    console.log(`✔️ .vscode/settings.json parsed successfully.`);
} catch (error) {
    console.log(`❌ Failed to parse .vscode/settings.json: ${error.message}`);
    process.exit(1);
}

/**
 * Ensure json.schemas section exists
 */
if (!settings['json.schemas']) {
    settings['json.schemas'] = [];
    console.log(`✔️ Created empty json.schemas section.`);
    changesMade = true;
}

/**
 * Validate json.schemas is an array
 */
if (!Array.isArray(settings['json.schemas'])) {
    console.log(`❌ json.schemas is not an array.`);
    process.exit(1);
}
console.log(`✔️ json.schemas is an array with ${settings['json.schemas'].length} elements.`);

/**
 * Track which schemas we've found
 */
let ioPackageFound = false;
let jsonConfigFound = false;

/**
 * Process existing schema entries
 */
for (let i = 0; i < settings['json.schemas'].length; i++) {
    const schema = settings['json.schemas'][i];
    
    // Validate schema structure
    if (!schema.fileMatch || !Array.isArray(schema.fileMatch)) {
        console.log(`❌ Schema entry ${i} is missing 'fileMatch' attribute or it is not an array.`);
        process.exit(1);
    }
    
    if (!schema.url || typeof schema.url !== 'string') {
        console.log(`❌ Schema entry ${i} is missing 'url' attribute or it is not a string.`);
        process.exit(1);
    }
    
    // Check for io-package.json
    if (schema.fileMatch.includes('io-package.json')) {
        ioPackageFound = true;
        console.log(`✔️ Found io-package.json schema entry at index ${i}.`);
        
        // Ensure correct URL
        if (schema.url !== SCHEMA_IOPACKAGE) {
            console.log(`ⓘ Updating io-package.json schema URL from ${schema.url} to ${SCHEMA_IOPACKAGE}`);
            schema.url = SCHEMA_IOPACKAGE;
            changesMade = true;
        }
    }
    
    // Check for jsonConfig files
    const hasJsonConfigFile = JSONCONFIG_FILES.some(file => schema.fileMatch.includes(file));
    if (hasJsonConfigFile) {
        jsonConfigFound = true;
        console.log(`✔️ Found jsonConfig schema entry at index ${i}.`);
        
        // Ensure correct URL
        if (schema.url !== SCHEMA_JSONCONFIG) {
            console.log(`ⓘ Updating jsonConfig schema URL from ${schema.url} to ${SCHEMA_JSONCONFIG}`);
            schema.url = SCHEMA_JSONCONFIG;
            changesMade = true;
        }
        
        // Ensure all jsonConfig files are in fileMatch
        let missingFiles = [];
        for (const file of JSONCONFIG_FILES) {
            if (!schema.fileMatch.includes(file)) {
                missingFiles.push(file);
            }
        }
        
        if (missingFiles.length > 0) {
            console.log(`ⓘ Adding missing jsonConfig files to fileMatch: ${missingFiles.join(', ')}`);
            schema.fileMatch.push(...missingFiles);
            changesMade = true;
        }
    }
}

/**
 * Add missing schema entries
 */
if (!ioPackageFound) {
    console.log(`ⓘ Adding io-package.json schema entry.`);
    settings['json.schemas'].push({
        fileMatch: ['io-package.json'],
        url: SCHEMA_IOPACKAGE
    });
    changesMade = true;
}

if (!jsonConfigFound) {
    console.log(`ⓘ Adding jsonConfig schema entry.`);
    settings['json.schemas'].push({
        fileMatch: JSONCONFIG_FILES,
        url: SCHEMA_JSONCONFIG
    });
    changesMade = true;
}

/**
 * Write changes if any were made
 */
if (changesMade) {
    try {
        const newContent = JSON.stringify(settings, null, 4) + '\n';
        fs.writeFileSync(vsCodeSettingsPath, newContent, 'utf8');
        console.log(`✔️ ${vsCodeSettingsPath} updated successfully.`);
    } catch (error) {
        console.log(`❌ Failed to write ${vsCodeSettingsPath}: ${error.message}`);
        process.exit(1);
    }
} else {
    console.log(`ⓘ No changes needed to ${vsCodeSettingsPath}.`);
}

console.log(`✔️ processing completed`);

process.exit(0);

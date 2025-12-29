// This script implements the required changes for a PR 
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of an PR. 

const fs = require('node:fs');

// Constants
const COPYRIGHT_YEAR = '2025';
// Note: These constants are defined as per template requirements
// and may be used in future enhancements
const JS_CONTROLLER_VERSION = '6.0.11';
const ADMIN_VERSION = '7.6.17';

const COMMUNITY_ADAPTERS_NAME = 'iobroker-community-adapters';
const COMMUNITY_ADAPTERS_EMAIL = 'iobroker-community-adapters@gmx.de';
const COPYRIGHT_LINE = `Copyright (c) ${COPYRIGHT_YEAR} ${COMMUNITY_ADAPTERS_NAME} <${COMMUNITY_ADAPTERS_EMAIL}>  `;

// Regex patterns for consistent matching
const COPYRIGHT_REGEX = /^\s*Copyright\s+\(c\)/mi;
const WIP_REGEX = /^\s*###\s+\*\*WORK IN PROGRESS\*\*/i;
// Maximum distance (in characters) from Changelog header to consider a WIP section as "at the start"
const WIP_PROXIMITY_THRESHOLD = 50;

// prepare standard parameters 
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Missing required arguments');
  process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

let changesMade = false;

/**
 * Add copyright line to README.md if not present
 */
function updateReadme() {
    const readmePath = './README.md';
    
    if (!fs.existsSync(readmePath)) {
        console.log(`ⓘ ${readmePath} does not exist, skipping.`);
        return;
    }
    
    console.log(`✔️ ${readmePath} exists.`);
    
    let content = fs.readFileSync(readmePath, 'utf8');
    
    // Check if copyright line with iobroker-community-adapters already exists
    if (content.includes(COMMUNITY_ADAPTERS_NAME)) {
        console.log(`ⓘ Copyright line with ${COMMUNITY_ADAPTERS_NAME} already exists in ${readmePath}.`);
        return;
    }
    
    // Find the License section
    const licenseSectionRegex = /^##?\s+License\s*(<.*>)?\s*$/mi;
    const sectionMatch = content.match(licenseSectionRegex);
    
    if (!sectionMatch) {
        console.log(`ⓘ License section not found in ${readmePath}, skipping copyright addition.`);
        return;
    }
    
    // Find the position after the License header
    const sectionStart = sectionMatch.index + sectionMatch[0].length;
    
    // Look for existing copyright line after the License header
    const afterSection = content.substring(sectionStart);
    const copyrightMatch = afterSection.match(COPYRIGHT_REGEX);
    
    let insertPosition;
    if (copyrightMatch) {
        // Insert immediately before the existing copyright line
        insertPosition = sectionStart + copyrightMatch.index;
        console.log(`ⓘ Found existing copyright line, inserting before it.`);
    } else {
        // No existing copyright, insert after the License header
        insertPosition = sectionStart;
        console.log(`ⓘ No existing copyright line found, inserting after License header.`);
    }
    
    // Insert copyright line at the determined position
    const beforeInsert = content.substring(0, insertPosition);
    const afterInsert = content.substring(insertPosition);
    
    // Add copyright with appropriate newlines
    const updatedContent = beforeInsert + '\n' + COPYRIGHT_LINE + '\n' + afterInsert;
    
    fs.writeFileSync(readmePath, updatedContent, 'utf8');
    console.log(`✔️ Added copyright line to ${readmePath}.`);
    changesMade = true;
}

/**
 * Add copyright line to LICENSE if not present
 */
function updateLicense() {
    const licensePath = './LICENSE';
    
    if (!fs.existsSync(licensePath)) {
        console.log(`ⓘ ${licensePath} does not exist, skipping.`);
        return;
    }
    
    console.log(`✔️ ${licensePath} exists.`);
    
    let content = fs.readFileSync(licensePath, 'utf8');
    
    // Check if copyright line with iobroker-community-adapters already exists
    if (content.includes(COMMUNITY_ADAPTERS_NAME)) {
        console.log(`ⓘ Copyright line with ${COMMUNITY_ADAPTERS_NAME} already exists in ${licensePath}.`);
        return;
    }
    
    // Look for existing copyright line
    const copyrightMatch = content.match(COPYRIGHT_REGEX);
    
    let updatedContent;
    if (copyrightMatch) {
        // Insert immediately before the existing copyright line
        const insertPosition = copyrightMatch.index;
        const beforeInsert = content.substring(0, insertPosition);
        const afterInsert = content.substring(insertPosition);
        updatedContent = beforeInsert + COPYRIGHT_LINE + '\n' + afterInsert;
        console.log(`ⓘ Found existing copyright line, inserting before it.`);
    } else {
        // No existing copyright, add as first line
        updatedContent = COPYRIGHT_LINE + '\n' + content;
        console.log(`ⓘ No existing copyright line found, adding as first line.`);
    }
    
    fs.writeFileSync(licensePath, updatedContent, 'utf8');
    console.log(`✔️ Added copyright line to ${licensePath}.`);
    changesMade = true;
}

/**
 * Update package.json contributors
 */
function updatePackageJson() {
    const packageJsonPath = './package.json';
    
    if (!fs.existsSync(packageJsonPath)) {
        console.log(`ⓘ ${packageJsonPath} does not exist, skipping.`);
        return;
    }
    
    console.log(`✔️ ${packageJsonPath} exists.`);
    
    let content = fs.readFileSync(packageJsonPath, 'utf8');
    let packageJson;
    
    try {
        packageJson = JSON.parse(content);
    } catch (error) {
        console.error(`❌ Error parsing ${packageJsonPath}: ${error.message}`);
        process.exit(1);
    }
    
    // Ensure contributors array exists
    if (!packageJson.contributors) {
        packageJson.contributors = [];
        console.log(`ⓘ Created contributors array in ${packageJsonPath}.`);
    }
    
    // Check if iobroker-community-adapters is already in contributors
    const hasContributor = packageJson.contributors.some(
        contributor => {
            if (typeof contributor === 'string') {
                return contributor.includes(COMMUNITY_ADAPTERS_NAME);
            }
            return contributor.name === COMMUNITY_ADAPTERS_NAME;
        }
    );
    
    if (hasContributor) {
        console.log(`ⓘ ${COMMUNITY_ADAPTERS_NAME} already exists in contributors.`);
        return;
    }
    
    // Add contributor
    packageJson.contributors.push({
        name: COMMUNITY_ADAPTERS_NAME,
        email: COMMUNITY_ADAPTERS_EMAIL
    });
    
    // Write back with proper formatting (2 spaces indentation)
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    console.log(`✔️ Added ${COMMUNITY_ADAPTERS_NAME} to contributors in ${packageJsonPath}.`);
    changesMade = true;
}

/**
 * Compare two semantic version strings
 * Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
    // Extract only valid version numbers (e.g., "1.2.3")
    const cleanV1 = v1.match(/\d+(?:\.\d+)*/)?.[0] || '0';
    const cleanV2 = v2.match(/\d+(?:\.\d+)*/)?.[0] || '0';
    
    const parts1 = cleanV1.split('.').map(Number);
    const parts2 = cleanV2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
    }
    return 0;
}

/**
 * Extract version from dependency string (e.g., ">=5.0.0" -> "5.0.0")
 */
function extractVersion(depString) {
    const match = depString.match(/\d+(?:\.\d+)*/);
    return match ? match[0] : null;
}

/**
 * Update io-package.json authors and dependencies
 */
function updateIoPackageJson() {
    const ioPackagePath = './io-package.json';
    
    if (!fs.existsSync(ioPackagePath)) {
        console.log(`ⓘ ${ioPackagePath} does not exist, skipping.`);
        return;
    }
    
    console.log(`✔️ ${ioPackagePath} exists.`);
    
    let content = fs.readFileSync(ioPackagePath, 'utf8');
    let ioPackage;
    
    try {
        ioPackage = JSON.parse(content);
    } catch (error) {
        console.error(`❌ Error parsing ${ioPackagePath}: ${error.message}`);
        process.exit(1);
    }
    
    // Track if any changes were made to io-package.json
    let ioPackageChanged = false;
    
    // Check if common.authors exists
    if (!ioPackage.common) {
        ioPackage.common = {};
    }
    
    if (!Array.isArray(ioPackage.common.authors)) {
        ioPackage.common.authors = [];
        console.log(`ⓘ Created authors array in ${ioPackagePath}.`);
    }
    
    // Convert author objects to single-line string format
    for (let i = 0; i < ioPackage.common.authors.length; i++) {
        const author = ioPackage.common.authors[i];
        if (typeof author === 'object' && author !== null && author.name) {
            // Convert object to string format
            const authorString = author.email 
                ? `${author.name} <${author.email}>`
                : author.name;
            ioPackage.common.authors[i] = authorString;
            console.log(`✔️ Converted author object to string: ${authorString}`);
            ioPackageChanged = true;
            changesMade = true;
        }
    }
    
    // Check if iobroker-community-adapters is already in authors
    const hasAuthor = ioPackage.common.authors.some(
        author => typeof author === 'string' && author.includes(COMMUNITY_ADAPTERS_NAME)
    );
    
    if (!hasAuthor) {
        // Add author
        ioPackage.common.authors.push(`${COMMUNITY_ADAPTERS_NAME} <${COMMUNITY_ADAPTERS_EMAIL}>`);
        console.log(`✔️ Added ${COMMUNITY_ADAPTERS_NAME} to authors in ${ioPackagePath}.`);
        ioPackageChanged = true;
        changesMade = true;
    } else {
        console.log(`ⓘ ${COMMUNITY_ADAPTERS_NAME} already exists in authors.`);
    }
    
    // Handle js-controller dependency
    let jsControllerUpdated = false;
    
    if (!ioPackage.common.dependencies) {
        ioPackage.common.dependencies = [];
        console.log(`ⓘ Created dependencies array in ${ioPackagePath}.`);
    }
    
    // Find existing js-controller dependency
    let jsControllerDep = ioPackage.common.dependencies.find(
        dep => dep && typeof dep === 'object' && 'js-controller' in dep
    );
    
    if (!jsControllerDep) {
        // Add new js-controller dependency
        ioPackage.common.dependencies.push({
            'js-controller': `>=${JS_CONTROLLER_VERSION}`
        });
        console.log(`✔️ Added js-controller dependency with version ${JS_CONTROLLER_VERSION}.`);
        jsControllerUpdated = true;
        ioPackageChanged = true;
        changesMade = true;
    } else {
        // Check if version needs updating
        const currentVersion = extractVersion(jsControllerDep['js-controller']);
        if (currentVersion && compareVersions(currentVersion, JS_CONTROLLER_VERSION) < 0) {
            jsControllerDep['js-controller'] = `>=${JS_CONTROLLER_VERSION}`;
            console.log(`✔️ Updated js-controller dependency from ${currentVersion} to ${JS_CONTROLLER_VERSION}.`);
            jsControllerUpdated = true;
            ioPackageChanged = true;
            changesMade = true;
        } else {
            console.log(`ⓘ js-controller dependency is already at version ${currentVersion || 'unknown'}, no update needed.`);
        }
    }
    
    // Handle admin dependency
    let adminUpdated = false;
    
    if (!ioPackage.common.globalDependencies) {
        ioPackage.common.globalDependencies = [];
        console.log(`ⓘ Created globalDependencies array in ${ioPackagePath}.`);
    }
    
    // Find existing admin dependency
    let adminDep = ioPackage.common.globalDependencies.find(
        dep => dep && typeof dep === 'object' && 'admin' in dep
    );
    
    if (!adminDep) {
        // Add new admin dependency
        ioPackage.common.globalDependencies.push({
            'admin': `>=${ADMIN_VERSION}`
        });
        console.log(`✔️ Added admin dependency with version ${ADMIN_VERSION}.`);
        adminUpdated = true;
        ioPackageChanged = true;
        changesMade = true;
    } else {
        // Check if version needs updating
        const currentVersion = extractVersion(adminDep['admin']);
        if (currentVersion && compareVersions(currentVersion, ADMIN_VERSION) < 0) {
            adminDep['admin'] = `>=${ADMIN_VERSION}`;
            console.log(`✔️ Updated admin dependency from ${currentVersion} to ${ADMIN_VERSION}.`);
            adminUpdated = true;
            ioPackageChanged = true;
            changesMade = true;
        } else {
            console.log(`ⓘ admin dependency is already at version ${currentVersion || 'unknown'}, no update needed.`);
        }
    }
    
    // Write back with proper formatting (2 spaces indentation)
    if (ioPackageChanged) {
        fs.writeFileSync(ioPackagePath, JSON.stringify(ioPackage, null, 2) + '\n', 'utf8');
        
        // Update README changelog if dependencies were updated
        if (jsControllerUpdated || adminUpdated) {
            updateReadmeChangelog(jsControllerUpdated, adminUpdated);
        }
    }
}

/**
 * Update README.md changelog with dependency changes
 */
function updateReadmeChangelog(jsControllerUpdated, adminUpdated) {
    const readmePath = './README.md';
    
    if (!fs.existsSync(readmePath)) {
        console.log(`ⓘ ${readmePath} does not exist, skipping changelog update.`);
        return;
    }
    
    let content = fs.readFileSync(readmePath, 'utf8');
    
    let changelogEntries = [];
    if (jsControllerUpdated) {
        changelogEntries.push(`- (@copilot) Adapter requires js-controller ${JS_CONTROLLER_VERSION} now`);
    }
    if (adminUpdated) {
        changelogEntries.push(`- (@copilot) Adapter requires admin ${ADMIN_VERSION} now`);
    }
    
    if (changelogEntries.length === 0) {
        return;
    }
    
    const changelogText = changelogEntries.join('\n');
    
    // Check if changelog entries already exist anywhere in the document
    const alreadyHasEntries = changelogEntries.every(entry => {
        // Remove leading "- " and any extra whitespace for comparison
        const entryText = entry.replace(/^-\s*/, '').trim();
        // Check if the exact text exists in the content (case-insensitive to be safe)
        return content.toLowerCase().includes(entryText.toLowerCase());
    });
    
    if (alreadyHasEntries) {
        console.log(`ⓘ Changelog entries already exist in ${readmePath}.`);
        return;
    }
    
    // Look for Changelog section
    const changelogRegex = /##\s+Changelog/i;
    const changelogMatch = content.match(changelogRegex);
    
    if (!changelogMatch) {
        console.log(`ⓘ Changelog section not found in ${readmePath}, skipping changelog update.`);
        return;
    }
    
    // Find the position after the Changelog header
    let insertPosition = changelogMatch.index + changelogMatch[0].length;
    
    // Skip to next line
    const nextNewline = content.indexOf('\n', insertPosition);
    if (nextNewline !== -1) {
        insertPosition = nextNewline + 1;
    }
    
    // Check if there's already a WIP section immediately after the Changelog header
    const afterChangelogHeader = content.substring(insertPosition);
    const wipMatch = afterChangelogHeader.match(WIP_REGEX);
    
    let updatedContent;
    if (wipMatch && wipMatch.index < WIP_PROXIMITY_THRESHOLD) {
        // WIP section exists right after Changelog header
        // Add entries after the WIP header
        const wipHeaderEnd = insertPosition + wipMatch.index + wipMatch[0].length;
        updatedContent = content.substring(0, wipHeaderEnd) + 
                        '\n' + changelogText + '\n' +
                        content.substring(wipHeaderEnd);
        console.log(`✔️ Added changelog entries to existing WORK IN PROGRESS section in ${readmePath}.`);
    } else {
        // Create new WIP section at the start of Changelog
        const wipSection = `\n### **WORK IN PROGRESS**\n${changelogText}\n`;
        updatedContent = content.substring(0, insertPosition) + 
                        wipSection +
                        content.substring(insertPosition);
        console.log(`✔️ Added new WORK IN PROGRESS section with changelog entries to ${readmePath}.`);
    }
    
    fs.writeFileSync(readmePath, updatedContent, 'utf8');
}

// Execute all updates
updateReadme();
updateLicense();
updatePackageJson();
updateIoPackageJson();

if (!changesMade) {
    console.log(`ⓘ No changes were made. All entries already exist.`);
}

console.log(`✔️ processing completed`);

process.exit(0);


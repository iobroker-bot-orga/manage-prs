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
    const match = content.match(licenseSectionRegex);
    
    if (!match) {
        console.log(`ⓘ License section not found in ${readmePath}, skipping copyright addition.`);
        return;
    }
    
    // Find the position after the License header
    const insertPosition = match.index + match[0].length;
    
    // Insert copyright line after the License header
    const beforeCopyright = content.substring(0, insertPosition);
    const afterLicenseHeader = content.substring(insertPosition);
    
    // Add copyright at the beginning of the License section content
    const updatedContent = beforeCopyright + '\n' + COPYRIGHT_LINE + '\n' + afterLicenseHeader;
    
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
    
    // Add copyright as first line
    const updatedContent = COPYRIGHT_LINE + '\n' + content;
    
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
 * Update io-package.json authors
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
    
    // Check if common.authors exists
    if (!ioPackage.common) {
        ioPackage.common = {};
    }
    
    if (!Array.isArray(ioPackage.common.authors)) {
        ioPackage.common.authors = [];
        console.log(`ⓘ Created authors array in ${ioPackagePath}.`);
    }
    
    // Check if iobroker-community-adapters is already in authors
    const hasAuthor = ioPackage.common.authors.some(
        author => typeof author === 'string' && author.includes(COMMUNITY_ADAPTERS_NAME)
    );
    
    if (hasAuthor) {
        console.log(`ⓘ ${COMMUNITY_ADAPTERS_NAME} already exists in authors.`);
        return;
    }
    
    // Add author
    ioPackage.common.authors.push(`${COMMUNITY_ADAPTERS_NAME} <${COMMUNITY_ADAPTERS_EMAIL}>`);
    
    // Write back with proper formatting (2 spaces indentation)
    fs.writeFileSync(ioPackagePath, JSON.stringify(ioPackage, null, 2) + '\n', 'utf8');
    console.log(`✔️ Added ${COMMUNITY_ADAPTERS_NAME} to authors in ${ioPackagePath}.`);
    changesMade = true;
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


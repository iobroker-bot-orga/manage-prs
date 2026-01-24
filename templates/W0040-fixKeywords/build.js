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

// Check if keywords exists, if not add it as empty array
if (!packageJson.keywords) {
    packageJson.keywords = [];
    packageJsonModified = true;
    console.log(`ⓘ Added empty keywords array to ${packageJsonPath}.`);
}

// Check if keywords is an array
if (!Array.isArray(packageJson.keywords)) {
    console.log(`❌ keywords in ${packageJsonPath} is not an array.`);
    process.exit(1);
}

// Check for case-insensitive matches of "iobroker" that are not exactly "ioBroker"
const originalKeywordsCount = packageJson.keywords.length;
packageJson.keywords = packageJson.keywords.filter(keyword => {
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
const hasIoBroker = packageJson.keywords.includes('ioBroker');
if (!hasIoBroker) {
    packageJson.keywords.unshift('ioBroker');
    packageJsonModified = true;
    console.log(`ⓘ Added "ioBroker" as first keyword in ${packageJsonPath}.`);
}

// Write package.json if modified
if (packageJsonModified) {
    try {
        const updatedContent = JSON.stringify(packageJson, null, 4) + '\n';
        fs.writeFileSync(packageJsonPath, updatedContent, 'utf8');
        console.log(`✔️ ${packageJsonPath} updated successfully.`);
        changesMade = true;
    } catch (error) {
        console.error(`❌ Error writing ${packageJsonPath}: ${error.message}`);
        process.exit(1);
    }
} else {
    console.log(`ⓘ No changes needed in ${packageJsonPath}.`);
}

// Process io-package.json
let ioPackageJsonModified = false;

// Check if common.keywords exists, if not add it as empty array
if (!ioPackageJson.common) {
    ioPackageJson.common = {};
    ioPackageJsonModified = true;
}

if (!ioPackageJson.common.keywords) {
    ioPackageJson.common.keywords = [];
    ioPackageJsonModified = true;
    console.log(`ⓘ Added empty keywords array to common in ${ioPackageJsonPath}.`);
}

// Check if keywords is an array
if (!Array.isArray(ioPackageJson.common.keywords)) {
    console.log(`❌ common.keywords in ${ioPackageJsonPath} is not an array.`);
    process.exit(1);
}

// Remove case-insensitive matches of "iobroker", "adapter", or "smart home"
const forbiddenKeywords = ['iobroker', 'adapter', 'smart home'];
const originalIoKeywordsCount = ioPackageJson.common.keywords.length;
ioPackageJson.common.keywords = ioPackageJson.common.keywords.filter(keyword => {
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
        const updatedContent = JSON.stringify(ioPackageJson, null, 4) + '\n';
        fs.writeFileSync(ioPackageJsonPath, updatedContent, 'utf8');
        console.log(`✔️ ${ioPackageJsonPath} updated successfully.`);
        changesMade = true;
    } catch (error) {
        console.error(`❌ Error writing ${ioPackageJsonPath}: ${error.message}`);
        process.exit(1);
    }
} else {
    console.log(`ⓘ No changes needed in ${ioPackageJsonPath}.`);
}

if (!changesMade) {
    console.log(`ⓘ No changes were made. Keywords are already correct.`);
}

console.log(`✔️ processing completed`);

process.exit(0);


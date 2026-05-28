// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];

const packageJsonPath = './package.json';
const tsconfigPath = './tsconfig.json';
const tsconfigNodePackagePattern = /^@tsconfig\/node(\d{2})$/;

/**
 * Escape a string for regular expression usage.
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract minimum Node.js major from a range expression.
 * @param {string} nodeRange
 * @returns {number|null}
 */
function extractMinimumNodeMajor(nodeRange) {
    if (typeof nodeRange !== 'string') {
        return null;
    }

    const matches = [...nodeRange.matchAll(/(\d+)/g)].map(match => parseInt(match[1], 10)).filter(Number.isFinite);
    if (matches.length === 0) {
        return null;
    }

    return Math.min(...matches);
}

/**
 * Update placeholders in generated PR body.
 * @param {Object<string, string>} replacements
 */
function updatePrBody(replacements) {
    const prBodyFile = path.join(process.cwd(), '.iobroker-pr-body.tmp');

    if (!fs.existsSync(prBodyFile)) {
        return;
    }

    let prBody = fs.readFileSync(prBodyFile, 'utf8');
    for (const [placeholder, value] of Object.entries(replacements)) {
        prBody = prBody.replaceAll(placeholder, value);
    }

    fs.writeFileSync(prBodyFile, prBody, 'utf8');
    console.log('✔️ Updated PR body placeholders.');
}

if (!fs.existsSync(packageJsonPath)) {
    console.log(`ⓘ ${packageJsonPath} does not exist - skipping repository.`);
    process.exit(0);
}

let packageJson;
try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
    console.log(`ⓘ ${packageJsonPath} cannot be read as valid JSON - skipping repository.`);
    process.exit(0);
}

if (!packageJson.engines || typeof packageJson.engines !== 'object' || !packageJson.engines.node) {
    console.log('ⓘ No engines.node clause found in package.json - skipping repository.');
    process.exit(0);
}

const enginesNodeRange = String(packageJson.engines.node);
const minSupportedNodeMajor = extractMinimumNodeMajor(enginesNodeRange);

if (!Number.isInteger(minSupportedNodeMajor)) {
    console.log(`ⓘ Could not extract minimum supported Node.js release from engines.node ('${enginesNodeRange}') - skipping repository.`);
    process.exit(0);
}

console.log(`✔️ engines.node is '${enginesNodeRange}'.`);
console.log(`✔️ Minimum supported Node.js major version detected: ${minSupportedNodeMajor}`);

const targetTsconfigNodePackage = `@tsconfig/node${minSupportedNodeMajor}`;

const devDependencies = (packageJson.devDependencies && typeof packageJson.devDependencies === 'object')
    ? packageJson.devDependencies
    : {};

const existingTsconfigNodePackages = Object.keys(devDependencies).filter(dependency => tsconfigNodePackagePattern.test(dependency));
const existingPrimaryPackage = existingTsconfigNodePackages[0] || null;

let dependencyUpdated = false;
let dependencyChangeEn = '';
let dependencyChangeDe = '';

const dependencyNeedsUpdate =
    existingTsconfigNodePackages.length === 0 ||
    existingTsconfigNodePackages.length > 1 ||
    existingTsconfigNodePackages[0] !== targetTsconfigNodePackage;

if (dependencyNeedsUpdate) {
    if (!packageJson.devDependencies || typeof packageJson.devDependencies !== 'object') {
        packageJson.devDependencies = {};
    }

    for (const dependency of Object.keys(packageJson.devDependencies)) {
        if (tsconfigNodePackagePattern.test(dependency)) {
            delete packageJson.devDependencies[dependency];
        }
    }

    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
    console.log(`✔️ Updated ${packageJsonPath} before installing ${targetTsconfigNodePackage}.`);

    try {
        execSync(`npm install --save-dev ${targetTsconfigNodePackage}@latest`, { stdio: 'inherit' });
    } catch (error) {
        console.error(`❌ Failed to install ${targetTsconfigNodePackage}@latest: ${error.message}`);
        process.exit(1);
    }

    dependencyUpdated = true;

    if (existingPrimaryPackage) {
        dependencyChangeEn = `- The PR replaces devDependency \`${existingPrimaryPackage}\` with \`${targetTsconfigNodePackage}\` in \`package.json\` and updates \`package-lock.json\`.`;
        dependencyChangeDe = `- Der PR ersetzt die devDependency \`${existingPrimaryPackage}\` durch \`${targetTsconfigNodePackage}\` in \`package.json\` und aktualisiert \`package-lock.json\`.`;
    } else {
        dependencyChangeEn = `- The PR adds devDependency \`${targetTsconfigNodePackage}\` to \`package.json\` and updates \`package-lock.json\`.`;
        dependencyChangeDe = `- Der PR ergänzt die devDependency \`${targetTsconfigNodePackage}\` in \`package.json\` und aktualisiert \`package-lock.json\`.`;
    }

    console.log(`✔️ devDependency aligned to ${targetTsconfigNodePackage}.`);
} else {
    dependencyChangeEn = `- The PR leaves the devDependency unchanged: \`${targetTsconfigNodePackage}\` is already present in \`package.json\`.`;
    dependencyChangeDe = `- Der PR lässt die devDependency unverändert: \`${targetTsconfigNodePackage}\` ist bereits in \`package.json\` vorhanden.`;
    console.log(`ⓘ devDependency ${targetTsconfigNodePackage} already matches engines.node.`);
}

let tsconfigChanged = false;
let tsconfigChangeEn = '- No changes were applied to `tsconfig.json` because the file does not exist.';
let tsconfigChangeDe = '- Es wurden keine Änderungen an `tsconfig.json` vorgenommen, da die Datei nicht existiert.';

if (fs.existsSync(tsconfigPath)) {
    const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
    const extendsMatch = tsconfigContent.match(/"extends"\s*:\s*"([^"]+)"/);

    if (extendsMatch) {
        const extendsValue = extendsMatch[1];
        if (/^@tsconfig\/node\d{2}\//.test(extendsValue)) {
            const desiredExtendsValue = extendsValue.replace(/^@tsconfig\/node\d{2}/, targetTsconfigNodePackage);

            if (desiredExtendsValue !== extendsValue) {
                const escapedOld = escapeRegExp(`"extends": "${extendsValue}"`);
                const updatedContent = tsconfigContent.replace(new RegExp(escapedOld), `"extends": "${desiredExtendsValue}"`);
                fs.writeFileSync(tsconfigPath, updatedContent, 'utf8');
                tsconfigChanged = true;
                tsconfigChangeEn = `- The PR updates \`tsconfig.json\` extends from \`${extendsValue}\` to \`${desiredExtendsValue}\`.`;
                tsconfigChangeDe = `- Der PR aktualisiert den extends-Eintrag in \`tsconfig.json\` von \`${extendsValue}\` auf \`${desiredExtendsValue}\`.`;
                console.log(`✔️ Updated tsconfig extends from '${extendsValue}' to '${desiredExtendsValue}'.`);
            } else {
                tsconfigChangeEn = `- The PR leaves \`tsconfig.json\` unchanged because extends already matches \`${extendsValue}\`.`;
                tsconfigChangeDe = `- Der PR lässt \`tsconfig.json\` unverändert, da der extends-Eintrag bereits \`${extendsValue}\` entspricht.`;
                console.log('ⓘ tsconfig extends already aligned to target package.');
            }
        } else {
            tsconfigChangeEn = `- The PR leaves \`tsconfig.json\` unchanged because extends is \`${extendsValue}\` and does not start with \`@tsconfig/nodeXX/\`.`;
            tsconfigChangeDe = `- Der PR lässt \`tsconfig.json\` unverändert, da der extends-Eintrag \`${extendsValue}\` ist und nicht mit \`@tsconfig/nodeXX/\` beginnt.`;
            console.log('ⓘ tsconfig extends exists but does not reference @tsconfig/nodeXX/.');
        }
    } else {
        const eol = tsconfigContent.includes('\r\n') ? '\r\n' : '\n';
        const indentMatch = tsconfigContent.match(new RegExp(`${escapeRegExp(eol)}([ \t]+)"`));
        const indent = indentMatch ? indentMatch[1] : '  ';
        const braceIndex = tsconfigContent.indexOf('{');

        if (braceIndex >= 0) {
            const insertion = `${eol}${indent}"extends": "${targetTsconfigNodePackage}/tsconfig.json",`;
            const updatedContent = `${tsconfigContent.slice(0, braceIndex + 1)}${insertion}${tsconfigContent.slice(braceIndex + 1)}`;
            fs.writeFileSync(tsconfigPath, updatedContent, 'utf8');
            tsconfigChanged = true;
            tsconfigChangeEn = `- The PR adds \`"extends": "${targetTsconfigNodePackage}/tsconfig.json"\` as the first key in \`tsconfig.json\`.`;
            tsconfigChangeDe = `- Der PR ergänzt \`"extends": "${targetTsconfigNodePackage}/tsconfig.json"\` als ersten Schlüssel in \`tsconfig.json\`.`;
            console.log(`✔️ Added extends entry to ${tsconfigPath}.`);
        } else {
            tsconfigChangeEn = '- The PR could not update `tsconfig.json` because no JSON object start was found.';
            tsconfigChangeDe = '- Der PR konnte `tsconfig.json` nicht aktualisieren, da kein JSON-Objektanfang gefunden wurde.';
            console.log('ⓘ Could not insert extends key into tsconfig.json.');
        }
    }
}

const warningTextEn = `[W0086] "${existingPrimaryPackage || targetTsconfigNodePackage}" should match the major node.js version from package.json engines.node (${enginesNodeRange}). Please update to ${targetTsconfigNodePackage} at package.json.`;
const warningTextDe = `[W0086] "${existingPrimaryPackage || targetTsconfigNodePackage}" sollte zur Major-Node.js-Version aus package.json engines.node (${enginesNodeRange}) passen. Bitte auf ${targetTsconfigNodePackage} in package.json aktualisieren.`;

updatePrBody({
    '__ENGINES_NODE_RANGE__': enginesNodeRange,
    '__ENGINES_NODE_MAJOR__': String(minSupportedNodeMajor),
    '__TARGET_TSCONFIG_NODE_PACKAGE__': targetTsconfigNodePackage,
    '__WARNING_TEXT_EN__': warningTextEn,
    '__WARNING_TEXT_DE__': warningTextDe,
    '__DEPENDENCY_CHANGE_EN__': dependencyChangeEn,
    '__DEPENDENCY_CHANGE_DE__': dependencyChangeDe,
    '__TSCONFIG_CHANGE_EN__': tsconfigChangeEn,
    '__TSCONFIG_CHANGE_DE__': tsconfigChangeDe,
});

if (!dependencyUpdated && !tsconfigChanged) {
    console.log('ⓘ No file changes were required for this repository.');
}

console.log(`✔️ processing completed (template: ${templateName}, repository: ${repositoryName})`);
process.exit(0);

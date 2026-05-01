// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

'use strict';

const fs = require('node:fs');
const YAML = require('yaml');

// prepare standard parameters
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

// Check if dependabot.yml exists
const dependabotPath = '.github/dependabot.yml';
if (!fs.existsSync(dependabotPath)) {
    console.log('ⓘ No dependabot.yml found - skipping this repository');
    process.exit(0);
}

console.log(`✔️ ${dependabotPath} exists.`);

// Read and parse dependabot.yml using parseDocument to preserve comments
const dependabotContent = fs.readFileSync(dependabotPath, 'utf8');
let doc;

try {
    doc = YAML.parseDocument(dependabotContent);
} catch (e) {
    console.error(`❌ Error parsing ${dependabotPath}: ${e.message}`);
    process.exit(1);
}

if (doc.errors && doc.errors.length > 0) {
    console.error(`❌ Error parsing ${dependabotPath}: ${doc.errors[0].message}`);
    process.exit(1);
}

const updatesNode = doc.get('updates', /* keepNode */ true);

if (!updatesNode || !updatesNode.items) {
    console.log('ⓘ No updates section found in dependabot.yml - skipping');
    process.exit(0);
}

let changesMade = false;

/**
 * Converts a yaml node (e.g. YAMLSeq) or a plain JS value to a plain JS value.
 * @param {*} node - The node or value to convert
 * @param {*} defaultValue - Value to return when node is null/undefined
 * @returns {*} Plain JS value
 */
function toPlainValue(node, defaultValue) {
    if (node === null || node === undefined) {
        return defaultValue;
    }
    return typeof node.toJSON === 'function' ? node.toJSON() : node;
}

// Process each update block
for (let index = 0; index < updatesNode.items.length; index++) {
    const update = updatesNode.items[index];

    // Only process npm sections
    const ecosystem = update.get('package-ecosystem');
    if (ecosystem !== 'npm') {
        continue;
    }

    // Only process sections with directory: '/' or directories containing '**/*'
    const directory = update.get('directory');
    const directoriesVal = update.get('directories');
    const hasRootDirectory = directory === '/';
    const hasWildcardDirectories = Array.isArray(directoriesVal) && directoriesVal.includes('**/*');

    if (!hasRootDirectory && !hasWildcardDirectories) {
        console.log(`ⓘ npm block ${index + 1}: directory configuration does not match '/' or '**/*' - skipping`);
        continue;
    }

    console.log(`\nⓘ Processing npm block ${index + 1} (directory: ${directory || JSON.stringify(directoriesVal)})`);

    // Check if block already has an @types/node ignore clause with semver-major or semver-minor
    const ignoreNode = update.get('ignore', /* keepNode */ true);
    let typesNodeEntry = null;

    if (ignoreNode && ignoreNode.items) {
        for (const item of ignoreNode.items) {
            if (item.get('dependency-name') === '@types/node') {
                typesNodeEntry = item;
                break;
            }
        }
    }

    if (typesNodeEntry) {
        const updateTypes = toPlainValue(typesNodeEntry.get('update-types'), []);
        const hasMajor = Array.isArray(updateTypes) && updateTypes.includes('version-update:semver-major');
        const hasMinor = Array.isArray(updateTypes) && updateTypes.includes('version-update:semver-minor');

        if (hasMajor || hasMinor) {
            console.log(
                `ⓘ npm block ${index + 1} already has an @types/node ignore clause with ` +
                `${[hasMajor ? 'version-update:semver-major' : null, hasMinor ? 'version-update:semver-minor' : null].filter(Boolean).join(' and ')} - no changes needed`,
            );
            continue;
        }

        // Entry exists but lacks the required update-types — extend it
        console.log(`✔️ Extending existing @types/node ignore entry in npm block ${index + 1} with 'version-update:semver-major'`);
        const updateTypesNode = typesNodeEntry.get('update-types', /* keepNode */ true);
        if (!updateTypesNode) {
            typesNodeEntry.set('update-types', doc.createNode(['version-update:semver-major']));
        } else {
            updateTypesNode.add(doc.createNode('version-update:semver-major'));
        }
        changesMade = true;
    } else {
        // No @types/node entry at all — add a new one
        const newEntry = doc.createNode({
            'dependency-name': '@types/node',
            'update-types': ['version-update:semver-major'],
        });
        if (ignoreNode && ignoreNode.items) {
            ignoreNode.add(newEntry);
        } else {
            update.set('ignore', doc.createNode([{
                'dependency-name': '@types/node',
                'update-types': ['version-update:semver-major'],
            }]));
        }
        console.log(`✔️ Added @types/node ignore clause to npm block ${index + 1}: update-types: ['version-update:semver-major']`);
        changesMade = true;
    }
}

if (!changesMade) {
    console.log('\nⓘ No changes required - all relevant npm blocks already have the correct @types/node ignore configuration.');
    process.exit(0);
}

// Convert double-quoted strings to single-quoted, and ensure new value scalars also use single quotes
YAML.visit(doc, {
    Scalar(key, node) {
        if (node.type === 'QUOTE_DOUBLE') {
            node.type = 'QUOTE_SINGLE';
        } else if ((node.type === undefined || node.type === null) && key !== 'key') {
            node.type = 'QUOTE_SINGLE';
        }
    },
});

// Write updated dependabot.yml — doc.toString() preserves all existing comments
fs.writeFileSync(dependabotPath, doc.toString(), 'utf8');
console.log(`\n✔️ ${dependabotPath} updated successfully.`);
console.log(`\n✔️ processing completed (template: ${templateName}, repository: ${repositoryName})`);

process.exit(0);

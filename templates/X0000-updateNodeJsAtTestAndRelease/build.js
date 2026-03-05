// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// If no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

// Constants for Node.js versions
const DEFAULT_NODEJS = 22;
const MATRIX_NODEJS = ['20.x', '22.x', '24.x'];
const MIN_NODEJS = 20;

// Standard parameter handling
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

const workflowPath = '.github/workflows/test-and-release.yml';

// Step 1: Check if test-and-release.yml exists
if (!fs.existsSync(workflowPath)) {
    console.log(`ⓘ ${workflowPath} does not exist, skipping PR creation.`);
    process.exit(0);
}

console.log(`✔️ ${workflowPath} exists.`);

// Step 2: Read and validate YAML
let workflowContent = fs.readFileSync(workflowPath, 'utf8');
try {
    yaml.load(workflowContent);
    console.log(`✔️ ${workflowPath} is valid YAML.`);
} catch (error) {
    console.error(`❌ ${workflowPath} is not valid YAML: ${error.message}`);
    process.exit(1);
}

let lines = workflowContent.split('\n');
let modified = false;

/**
 * Get the number of leading spaces (indentation) of a line.
 * @param {string} line
 * @returns {number}
 */
function getIndent(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
}

/**
 * Check if a line is fully commented out.
 * @param {string} line
 * @returns {boolean}
 */
function isCommented(line) {
    return line.trim().startsWith('#');
}

/**
 * Find the first line index that contains searchStr (skipping commented lines).
 * @param {string[]} lines
 * @param {string} searchStr
 * @param {number} startIndex
 * @param {number} endIndex
 * @returns {number} Line index or -1 if not found.
 */
function findLine(lines, searchStr, startIndex = 0, endIndex = lines.length) {
    for (let i = startIndex; i < Math.min(endIndex, lines.length); i++) {
        if (!isCommented(lines[i]) && lines[i].includes(searchStr)) {
            return i;
        }
    }
    return -1;
}

/**
 * Find a YAML key within a range of lines (skipping commented lines).
 * Optionally restrict to a specific indentation level.
 * @param {string[]} lines
 * @param {string} key
 * @param {number} startIndex
 * @param {number} endIndex
 * @param {number} indent  -1 means any indentation
 * @returns {number} Line index or -1 if not found.
 */
function findKey(lines, key, startIndex, endIndex, indent = -1) {
    for (let i = startIndex; i < Math.min(endIndex, lines.length); i++) {
        const line = lines[i];
        if (isCommented(line)) continue;
        const trimmed = line.trim();
        if (trimmed === `${key}:` || trimmed.startsWith(`${key}: `) || trimmed.startsWith(`${key}:`)) {
            if (indent === -1 || getIndent(line) === indent) {
                return i;
            }
        }
    }
    return -1;
}

/**
 * Find the end of a job block (the line index of the next job at the same indent level).
 * @param {string[]} lines
 * @param {number} jobStart
 * @returns {number}
 */
function findJobEnd(lines, jobStart) {
    const jobIndent = getIndent(lines[jobStart]);
    for (let i = jobStart + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() && !isCommented(line) && getIndent(line) <= jobIndent) {
            return i;
        }
    }
    return lines.length;
}

/**
 * Create a version of content with HTML comments replaced by spaces for searching.
 * This is used ONLY for finding headers – the original content with comments is preserved.
 * Replacing by spaces maintains character positions so indices can be used on the original.
 * @param {string} content - The content to process
 * @returns {string} - Content with comments replaced by spaces (maintaining character positions)
 */
function createSearchableContent(content) {
    return content.replace(/<!--[\s\S]*?-->/g, (match) => ' '.repeat(match.length));
}

/**
 * Find the line index of a top-level job definition (e.g. "  deploy:").
 * @param {string[]} lines
 * @param {string} jobName
 * @returns {number}
 */
function findJob(lines, jobName) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isCommented(line)) continue;
        const trimmed = line.trim();
        // Job keys appear at indent > 0, directly under "jobs:"
        if (trimmed === `${jobName}:` && getIndent(line) > 0) {
            return i;
        }
    }
    return -1;
}

// ── Step 3: Update node-version in ioBroker/testing-action-check@v1 ──────────

const checkActionLine = findLine(lines, 'ioBroker/testing-action-check@v1');
if (checkActionLine === -1) {
    console.log(`ⓘ Could not find 'ioBroker/testing-action-check@v1', skipping check-and-lint update.`);
} else {
    console.log(`✔️ Found 'ioBroker/testing-action-check@v1' at line ${checkActionLine + 1}.`);

    const withLine = findKey(lines, 'with', checkActionLine + 1, checkActionLine + 20);
    if (withLine === -1) {
        console.log(`ⓘ Could not find 'with:' for 'ioBroker/testing-action-check@v1', skipping.`);
    } else {
        const withIndent = getIndent(lines[withLine]);
        let foundNodeVersion = false;
        for (let i = withLine + 1; i < lines.length; i++) {
            const line = lines[i];
            if (isCommented(line)) continue;
            const lineIndent = getIndent(line);
            if (line.trim() && lineIndent <= withIndent) break; // left the with block
            if (line.trim().startsWith('node-version:')) {
                const indentStr = ' '.repeat(lineIndent);
                lines[i] = `${indentStr}node-version: '${DEFAULT_NODEJS}.x'`;
                console.log(`✔️ Updated node-version in 'ioBroker/testing-action-check@v1' to '${DEFAULT_NODEJS}.x'.`);
                modified = true;
                foundNodeVersion = true;
                break;
            }
        }
        if (!foundNodeVersion) {
            console.log(`ⓘ Could not find 'node-version:' in 'with:' block of 'ioBroker/testing-action-check@v1', skipping.`);
        }
    }
}

// ── Step 4: Update node-version matrix in adapter-tests ──────────────────────

const adapterTestsJobLine = findJob(lines, 'adapter-tests');
if (adapterTestsJobLine === -1) {
    console.log(`ⓘ Could not find 'adapter-tests' job, skipping matrix update.`);
} else {
    console.log(`✔️ Found 'adapter-tests' job at line ${adapterTestsJobLine + 1}.`);
    const adapterTestsEnd = findJobEnd(lines, adapterTestsJobLine);

    const strategyLine = findKey(lines, 'strategy', adapterTestsJobLine + 1, adapterTestsEnd);
    if (strategyLine === -1) {
        console.log(`ⓘ Could not find 'strategy' in 'adapter-tests', skipping matrix update.`);
    } else {
        const matrixLine = findKey(lines, 'matrix', strategyLine + 1, adapterTestsEnd);
        if (matrixLine === -1) {
            console.log(`ⓘ Could not find 'matrix' in 'adapter-tests' strategy, skipping.`);
        } else {
            const matrixIndent = getIndent(lines[matrixLine]);
            let foundMatrix = false;
            for (let i = matrixLine + 1; i < adapterTestsEnd; i++) {
                const line = lines[i];
                if (isCommented(line)) continue;
                const lineIndent = getIndent(line);
                if (line.trim() && lineIndent <= matrixIndent) break; // left the matrix block
                if (line.trim().startsWith('node-version:')) {
                    const indentStr = ' '.repeat(lineIndent);
                    lines[i] = `${indentStr}node-version: [${MATRIX_NODEJS.join(', ')}]`;
                    console.log(`✔️ Updated node-version matrix in 'adapter-tests' to [${MATRIX_NODEJS.join(', ')}].`);
                    modified = true;
                    foundMatrix = true;
                    break;
                }
            }
            if (!foundMatrix) {
                console.log(`ⓘ Could not find 'node-version:' in matrix of 'adapter-tests', skipping.`);
            }
        }
    }

    // Add 'needs: [check-and-lint]' to adapter-tests if missing
    // Recalculate end in case lines were modified above
    const adapterTestsEndAfterMatrix = findJobEnd(lines, adapterTestsJobLine);
    const adapterTestsNeedsLine = findKey(lines, 'needs', adapterTestsJobLine + 1, adapterTestsEndAfterMatrix);
    if (adapterTestsNeedsLine === -1) {
        // Detect property indentation inside the adapter-tests job
        const jobIndent = getIndent(lines[adapterTestsJobLine]);
        let propIndentSize = jobIndent + 4;
        for (let i = adapterTestsJobLine + 1; i < adapterTestsEndAfterMatrix; i++) {
            const line = lines[i];
            if (isCommented(line)) continue;
            if (line.trim() && getIndent(line) > jobIndent) {
                propIndentSize = getIndent(line);
                break;
            }
        }
        const propIndent = ' '.repeat(propIndentSize);
        const needsEntry = `${propIndent}needs: [check-and-lint]`;

        let insertAt = adapterTestsJobLine + 1;
        while (insertAt < adapterTestsEndAfterMatrix && lines[insertAt].trim() === '') {
            insertAt++;
        }
        lines.splice(insertAt, 0, needsEntry);
        console.log(`✔️ Added 'needs: [check-and-lint]' to 'adapter-tests' job.`);
        modified = true;
    } else {
        console.log(`ⓘ 'adapter-tests' job already has a 'needs' element, skipping.`);
    }
}

// ── Step 5: Add needs + update node-version in deploy job ────────────────────

const deployJobLine = findJob(lines, 'deploy');
if (deployJobLine === -1) {
    console.log(`ⓘ Could not find 'deploy' job, skipping.`);
} else {
    console.log(`✔️ Found 'deploy' job at line ${deployJobLine + 1}.`);
    const deployEnd = findJobEnd(lines, deployJobLine);
    const jobIndent = getIndent(lines[deployJobLine]);

    // Detect property indentation inside the deploy job
    let jobPropertyIndent = -1;
    for (let i = deployJobLine + 1; i < deployEnd; i++) {
        const line = lines[i];
        if (isCommented(line)) continue;
        if (line.trim() && getIndent(line) > jobIndent) {
            jobPropertyIndent = getIndent(line);
            break;
        }
    }
    if (jobPropertyIndent === -1) {
        jobPropertyIndent = jobIndent + 4;
    }

    // Add 'needs' if missing
    const deployNeedsLine = findKey(lines, 'needs', deployJobLine + 1, deployEnd);
    if (deployNeedsLine === -1) {
        const propIndent = ' '.repeat(jobPropertyIndent);
        const needsEntry = `${propIndent}needs: [check-and-lint, adapter-tests]`;

        // Insert before the first non-blank property line after the job definition
        let insertAt = deployJobLine + 1;
        while (insertAt < deployEnd && lines[insertAt].trim() === '') {
            insertAt++;
        }
        lines.splice(insertAt, 0, needsEntry);
        console.log(`✔️ Added 'needs: [check-and-lint, adapter-tests]' to 'deploy' job.`);
        modified = true;
    } else {
        console.log(`ⓘ 'deploy' job already has a 'needs' element, skipping.`);
    }

    // Recalculate deployEnd after potential splice
    const deployEndUpdated = findJobEnd(lines, deployJobLine);

    // Update node-version in ioBroker/testing-action-deploy@v1 (skip if commented)
    const deployActionLine = findLine(lines, 'ioBroker/testing-action-deploy@v1', deployJobLine, deployEndUpdated);
    if (deployActionLine === -1) {
        console.log(`ⓘ 'ioBroker/testing-action-deploy@v1' not found or commented out in 'deploy' job, skipping node-version update.`);
    } else {
        console.log(`✔️ Found 'ioBroker/testing-action-deploy@v1' at line ${deployActionLine + 1}.`);

        const withLine = findKey(lines, 'with', deployActionLine + 1, deployActionLine + 20);
        if (withLine === -1) {
            console.log(`ⓘ Could not find 'with:' for 'ioBroker/testing-action-deploy@v1', skipping.`);
        } else {
            const withIndent = getIndent(lines[withLine]);
            let foundNodeVersion = false;
            for (let i = withLine + 1; i < lines.length; i++) {
                const line = lines[i];
                if (isCommented(line)) continue;
                const lineIndent = getIndent(line);
                if (line.trim() && lineIndent <= withIndent) break; // left the with block
                if (line.trim().startsWith('node-version:')) {
                    const indentStr = ' '.repeat(lineIndent);
                    lines[i] = `${indentStr}node-version: '${DEFAULT_NODEJS}.x'`;
                    console.log(`✔️ Updated node-version in 'ioBroker/testing-action-deploy@v1' to '${DEFAULT_NODEJS}.x'.`);
                    modified = true;
                    foundNodeVersion = true;
                    break;
                }
            }
            if (!foundNodeVersion) {
                console.log(`ⓘ Could not find 'node-version:' in 'with:' of 'ioBroker/testing-action-deploy@v1', skipping.`);
            }
        }
    }
}

// Write updated workflow if any changes were made
if (modified) {
    fs.writeFileSync(workflowPath, lines.join('\n'), 'utf8');
    console.log(`✔️ ${workflowPath} updated successfully.`);
} else {
    console.log(`ⓘ No changes required in ${workflowPath}.`);
}

// ── Step 6: Check package.json engines ───────────────────────────────────────

let packageJsonModified = false;
const packageJsonPath = './package.json';

if (!fs.existsSync(packageJsonPath)) {
    console.log(`ⓘ ${packageJsonPath} does not exist, skipping engines check.`);
} else {
    let packageJson;
    let packageJsonContent;
    try {
        packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        packageJson = JSON.parse(packageJsonContent);
    } catch (error) {
        console.error(`❌ Error reading ${packageJsonPath}: ${error.message}`);
        process.exit(1);
    }

    const enginesNode = packageJson.engines?.node;
    if (!enginesNode) {
        console.log(`ⓘ No 'engines.node' found in ${packageJsonPath}, skipping engines update.`);
    } else {
        // Extract the first number (major version) from the engines range string
        const versionMatch = enginesNode.match(/(\d+)/);
        if (versionMatch) {
            const currentMinVersion = parseInt(versionMatch[1], 10);
            if (currentMinVersion < MIN_NODEJS) {
                console.log(`ⓘ engines.node '${enginesNode}' requires minimum Node.js ${currentMinVersion}, which is below MIN_NODEJS (${MIN_NODEJS}). Updating...`);

                // Replace the first occurrence of the major version number
                const newEnginesNode = enginesNode.replace(/(\d+)/, MIN_NODEJS.toString());

                // Use string-level replacement to preserve original file formatting
                const escapedOld = enginesNode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const updatedContent = packageJsonContent.replace(
                    new RegExp(`("node"\\s*:\\s*")${escapedOld}(")`),
                    `$1${newEnginesNode}$2`,
                );

                fs.writeFileSync(packageJsonPath, updatedContent, 'utf8');
                console.log(`✔️ Updated engines.node from '${enginesNode}' to '${newEnginesNode}' in ${packageJsonPath}.`);
                packageJsonModified = true;
            } else {
                console.log(`✔️ engines.node '${enginesNode}' already meets minimum Node.js ${MIN_NODEJS}, no update needed.`);
            }
        } else {
            console.log(`ⓘ Could not parse version from engines.node '${enginesNode}', skipping.`);
        }
    }
}

// ── Step 7: Add README.md changelog entry if package.json engines were updated ─

if (packageJsonModified) {
    const readmePath = './README.md';
    if (!fs.existsSync(readmePath)) {
        console.log(`ⓘ ${readmePath} does not exist, skipping changelog update.`);
    } else {
        let readmeContent = fs.readFileSync(readmePath, 'utf8');
        const changelogEntry = `- (iobroker-bot) Adapter requires node.js >= ${MIN_NODEJS} now.`;
        const workInProgressHeader = '### **WORK IN PROGRESS**';

        // Use searchable content (HTML comments masked) to avoid inserting into the template section
        const searchableReadme = createSearchableContent(readmeContent);

        // Find ## Changelog section outside of HTML comments
        const changelogRegex = /^## Changelog/m;
        const changelogMatch = searchableReadme.match(changelogRegex);
        if (!changelogMatch) {
            console.log(`ⓘ Could not find '## Changelog' section in ${readmePath}, skipping changelog update.`);
        } else {
            const changelogStart = changelogMatch.index + changelogMatch[0].length;
            const afterChangelogSearchable = searchableReadme.substring(changelogStart);

            // Find WIP header after Changelog section (outside HTML comments)
            const wipHeaderRegex = /^### \*\*WORK IN PROGRESS\*\*/m;
            const wipMatch = afterChangelogSearchable.match(wipHeaderRegex);

            if (wipMatch) {
                // WIP header exists outside comments — insert entry immediately after it
                const insertPos = changelogStart + wipMatch.index + wipMatch[0].length;
                readmeContent = readmeContent.slice(0, insertPos) + `\n${changelogEntry}` + readmeContent.slice(insertPos);
                console.log(`✔️ Added changelog entry below existing '${workInProgressHeader}' header in ${readmePath}.`);
            } else {
                // No WIP header outside comments — add it right after the ## Changelog header
                const insertPos = changelogMatch.index + changelogMatch[0].length;
                const newEntry = `\n\n${workInProgressHeader}\n${changelogEntry}`;
                readmeContent = readmeContent.slice(0, insertPos) + newEntry + readmeContent.slice(insertPos);
                console.log(`✔️ Added '${workInProgressHeader}' header and changelog entry to ${readmePath}.`);
            }

            fs.writeFileSync(readmePath, readmeContent, 'utf8');
        }
    }
}

// ── Step 8: Replace placeholders in PR body file ─────────────────────────────

const prBodyFile = path.join(process.cwd(), '.iobroker-pr-body.tmp');
if (fs.existsSync(prBodyFile)) {
    let prBody = fs.readFileSync(prBodyFile, 'utf8');
    prBody = prBody.replaceAll('__MIN_NODEJS__', MIN_NODEJS.toString());
    prBody = prBody.replaceAll('__MATRIX_NODEJS__', MATRIX_NODEJS.join(', '));
    fs.writeFileSync(prBodyFile, prBody);
    console.log(`✔️ Updated PR body file with Node.js version information.`);
}

console.log(`✔️ processing completed`);
process.exit(0);

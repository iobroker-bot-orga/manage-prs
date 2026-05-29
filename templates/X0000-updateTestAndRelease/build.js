// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
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

const workflowPath = '.github/workflows/test-and-release.yml';
const prBodyPath = path.join(process.cwd(), '.iobroker-pr-body.tmp');

/**
 * Get the indentation level of a line.
 *
 * @param {string} line line to inspect
 * @returns {number} indentation size
 */
function getIndent(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
}

/**
 * Check whether a line is blank.
 *
 * @param {string} line line to inspect
 * @returns {boolean} true if blank
 */
function isBlank(line) {
    return line.trim() === '';
}

/**
 * Check whether a line is fully commented out.
 *
 * @param {string} line line to inspect
 * @returns {boolean} true if commented
 */
function isCommented(line) {
    return line.trim().startsWith('#');
}

/**
 * Remove a surrounding pair of single or double quotes.
 *
 * @param {string} value raw value
 * @returns {string} normalized value
 */
function stripQuotes(value) {
    return String(value).trim().replace(/^['"]|['"]$/g, '');
}

/**
 * Find the end of a block by indentation.
 *
 * @param {string[]} lines all lines
 * @param {number} startIndex first line of the block
 * @returns {number} end index (exclusive)
 */
function findBlockEnd(lines, startIndex) {
    const blockIndent = getIndent(lines[startIndex]);

    for (let index = startIndex + 1; index < lines.length; index++) {
        const line = lines[index];
        if (isBlank(line) || isCommented(line)) {
            continue;
        }

        if (getIndent(line) <= blockIndent) {
            return index;
        }
    }

    return lines.length;
}

/**
 * Find the first child indentation inside a block.
 *
 * @param {string[]} lines all lines
 * @param {number} parentStart first line of the parent block
 * @param {number} parentEnd end of the parent block
 * @returns {number} child indentation
 */
function getChildIndent(lines, parentStart, parentEnd) {
    const parentIndent = getIndent(lines[parentStart]);

    for (let index = parentStart + 1; index < parentEnd; index++) {
        const line = lines[index];
        if (isBlank(line) || isCommented(line)) {
            continue;
        }

        const indent = getIndent(line);
        if (indent > parentIndent) {
            return indent;
        }
    }

    return parentIndent + 2;
}

/**
 * Find a mapping key within the direct children of a block.
 *
 * @param {string[]} lines all lines
 * @param {number} parentStart first line of the parent block
 * @param {number} parentEnd end of the parent block
 * @param {string} key key to find
 * @returns {number} line index or -1
 */
function findDirectChildKey(lines, parentStart, parentEnd, key) {
    const childIndent = getChildIndent(lines, parentStart, parentEnd);

    for (let index = parentStart + 1; index < parentEnd; index++) {
        const line = lines[index];
        if (isBlank(line) || isCommented(line)) {
            continue;
        }

        if (getIndent(line) === childIndent && line.trim().startsWith(`${key}:`)) {
            return index;
        }
    }

    return -1;
}

/**
 * Find a direct child property line such as "needs:".
 *
 * @param {string[]} lines all lines
 * @param {number} parentStart first line of the parent block
 * @param {number} parentEnd end of the parent block
 * @param {string} key key to find
 * @returns {number} line index or -1
 */
function findDirectChildProperty(lines, parentStart, parentEnd, key) {
    const childIndent = getChildIndent(lines, parentStart, parentEnd);

    for (let index = parentStart + 1; index < parentEnd; index++) {
        const line = lines[index];
        if (isBlank(line) || isCommented(line)) {
            continue;
        }

        if (getIndent(line) === childIndent && line.trim().startsWith(`${key}:`)) {
            return index;
        }
    }

    return -1;
}

/**
 * Find the insertion point after leading comments and blank lines in a block.
 *
 * @param {string[]} lines all lines
 * @param {number} parentStart first line of the parent block
 * @param {number} parentEnd end of the parent block
 * @returns {number} insertion index
 */
function findLeadingSectionEnd(lines, parentStart, parentEnd) {
    let index = parentStart + 1;

    while (index < parentEnd) {
        const line = lines[index];
        if (!isBlank(line) && !isCommented(line)) {
            break;
        }
        index++;
    }

    return index;
}

/**
 * Find the jobs section in the workflow.
 *
 * @param {string[]} lines all lines
 * @returns {{ start: number, end: number } | null} jobs block information
 */
function findJobsBlock(lines) {
    const jobsIndex = lines.findIndex(line => !isCommented(line) && line.trim().startsWith('jobs:'));
    if (jobsIndex === -1) {
        return null;
    }

    return {
        start: jobsIndex,
        end: findBlockEnd(lines, jobsIndex),
    };
}

/**
 * Find a job definition under jobs.
 *
 * @param {string[]} lines all lines
 * @param {{ start: number, end: number }} jobsBlock jobs block information
 * @param {string} jobName job name
 * @returns {{ start: number, end: number } | null} job block information
 */
function findJobBlock(lines, jobsBlock, jobName) {
    const jobIndex = findDirectChildKey(lines, jobsBlock.start, jobsBlock.end, jobName);
    if (jobIndex === -1) {
        return null;
    }

    return {
        start: jobIndex,
        end: findBlockEnd(lines, jobIndex),
    };
}

/**
 * Update the generated PR body placeholders.
 *
 * @param {string[]} englishChanges applied English bullet points
 * @param {string[]} germanChanges applied German bullet points
 */
function updatePrBody(englishChanges, germanChanges) {
    if (!fs.existsSync(prBodyPath)) {
        return;
    }

    const englishText = englishChanges.length > 0
        ? englishChanges.map(change => `- ${change}`).join('\n')
        : '- No workflow changes were required.';
    const germanText = germanChanges.length > 0
        ? germanChanges.map(change => `- ${change}`).join('\n')
        : '- Keine Workflow-Änderungen waren erforderlich.';

    let prBody = fs.readFileSync(prBodyPath, 'utf8');
    prBody = prBody.replaceAll('__APPLIED_CHANGES_EN__', englishText);
    prBody = prBody.replaceAll('__APPLIED_CHANGES_DE__', germanText);
    fs.writeFileSync(prBodyPath, prBody, 'utf8');
    console.log('✔️ Updated PR body placeholders.');
}

/**
 * Ensure that a job needs the specified dependencies.
 *
 * @param {string[]} lines workflow file lines
 * @param {{ start: number, end: number }} jobBlock job block information
 * @param {string[]} requiredDependencies dependencies that must be present
 * @returns {string[]} dependencies that were added
 */
function ensureNeeds(lines, jobBlock, requiredDependencies) {
    if (requiredDependencies.length === 0) {
        return [];
    }

    const needsIndex = findDirectChildProperty(lines, jobBlock.start, jobBlock.end, 'needs');
    const addedDependencies = [];

    if (needsIndex === -1) {
        const jobChildIndent = getChildIndent(lines, jobBlock.start, jobBlock.end);
        const needsIndent = ' '.repeat(jobChildIndent);
        const itemIndent = ' '.repeat(jobChildIndent + 2);
        const insertIndex = findLeadingSectionEnd(lines, jobBlock.start, jobBlock.end);
        const newLines = requiredDependencies.length === 1
            ? [`${needsIndent}needs: ${requiredDependencies[0]}`]
            : [
                `${needsIndent}needs:`,
                ...requiredDependencies.map(dependency => `${itemIndent}- ${dependency}`),
            ];

        lines.splice(insertIndex, 0, ...newLines);
        return [...requiredDependencies];
    }

    const needsLine = lines[needsIndex];
    const needsIndent = getIndent(needsLine);
    const afterColon = needsLine.slice(needsLine.indexOf(':') + 1);
    const trimmedAfterColon = afterColon.trim();

    if (trimmedAfterColon.startsWith('[')) {
        const sequenceStart = needsLine.indexOf('[');
        const sequenceEnd = needsLine.lastIndexOf(']');

        if (sequenceEnd === -1) {
            console.error(`❌ Inline needs sequence is missing a closing bracket in line: ${needsLine.trim()}`);
            process.exit(1);
        }

        const sequenceContent = needsLine.slice(sequenceStart + 1, sequenceEnd).trim();
        const existingDependencies = sequenceContent === ''
            ? []
            : sequenceContent.split(',').map(item => stripQuotes(item));

        for (const dependency of requiredDependencies) {
            if (!existingDependencies.includes(dependency)) {
                existingDependencies.push(dependency);
                addedDependencies.push(dependency);
            }
        }

        if (addedDependencies.length > 0) {
            const newSequence = existingDependencies.join(', ');
            lines[needsIndex] = `${needsLine.slice(0, sequenceStart + 1)}${newSequence}${needsLine.slice(sequenceEnd)}`;
        }

        return addedDependencies;
    }

    if (trimmedAfterColon !== '' && !trimmedAfterColon.startsWith('#')) {
        const commentMatch = afterColon.match(/\s+#.*$/);
        const rawValue = (commentMatch ? afterColon.slice(0, commentMatch.index) : afterColon).trim();
        const commentSuffix = commentMatch ? commentMatch[0] : '';
        const existingDependencies = rawValue === '' ? [] : [stripQuotes(rawValue)];

        for (const dependency of requiredDependencies) {
            if (!existingDependencies.includes(dependency)) {
                existingDependencies.push(dependency);
                addedDependencies.push(dependency);
            }
        }

        if (addedDependencies.length > 0) {
            const itemIndent = ' '.repeat(needsIndent + 2);
            const newLines = [
                `${' '.repeat(needsIndent)}needs:${commentSuffix}`,
                ...existingDependencies.map(dependency => `${itemIndent}- ${dependency}`),
            ];
            lines.splice(needsIndex, 1, ...newLines);
        }

        return addedDependencies;
    }

    const blockEnd = findBlockEnd(lines, needsIndex);
    const existingDependencies = [];
    let itemIndentSize = needsIndent + 2;

    for (let index = needsIndex + 1; index < blockEnd; index++) {
        const line = lines[index];
        if (isBlank(line) || isCommented(line)) {
            continue;
        }

        const trimmed = line.trim();
        if (!trimmed.startsWith('- ')) {
            continue;
        }

        itemIndentSize = getIndent(line);
        const commentIndex = trimmed.indexOf('#');
        const itemValue = commentIndex === -1 ? trimmed.slice(2) : trimmed.slice(2, commentIndex);
        existingDependencies.push(stripQuotes(itemValue.trim()));
    }

    const missingDependencies = requiredDependencies.filter(dependency => !existingDependencies.includes(dependency));
    if (missingDependencies.length > 0) {
        const itemIndent = ' '.repeat(itemIndentSize);
        const newLines = missingDependencies.map(dependency => `${itemIndent}- ${dependency}`);
        lines.splice(blockEnd, 0, ...newLines);
        addedDependencies.push(...missingDependencies);
    }

    return addedDependencies;
}

console.log(`ⓘ Template ${templateName} started for ${repositoryName} with parameters '${parameterData}'.`);

if (!fs.existsSync(workflowPath)) {
    console.log(`ⓘ ${workflowPath} does not exist, skipping PR creation.`);
    process.exit(0);
}

console.log(`✔️ ${workflowPath} exists.`);

const workflowContent = fs.readFileSync(workflowPath, 'utf8');
const endOfLine = workflowContent.includes('\r\n') ? '\r\n' : '\n';
const hasTrailingNewline = workflowContent.endsWith('\n');
const document = YAML.parseDocument(workflowContent);

if (document.errors.length > 0) {
    console.error(`❌ ${workflowPath} is not valid YAML (first error): ${document.errors[0].message}`);
    process.exit(1);
}

console.log(`✔️ ${workflowPath} is valid YAML.`);

const lines = workflowContent.split(/\r?\n/);
if (lines[lines.length - 1] === '') {
    lines.pop();
}
const jobsBlock = findJobsBlock(lines);

if (!jobsBlock) {
    console.log(`ⓘ ${workflowPath} does not contain a jobs section, skipping PR creation.`);
    process.exit(0);
}

/**
 * Find a job block in the current workflow content.
 * Re-scanning is required because line insertions can shift job positions between updates.
 *
 * @param {string} jobName job to find
 * @returns {{ start: number, end: number } | null} job block information
 */
function getCurrentJobBlock(jobName) {
    const currentJobsBlock = findJobsBlock(lines);
    if (!currentJobsBlock) {
        return null;
    }

    return findJobBlock(lines, currentJobsBlock, jobName);
}

const hasCheckAndLintJob = Boolean(getCurrentJobBlock('check-and-lint'));
const hasAdapterTestsJob = Boolean(getCurrentJobBlock('adapter-tests'));

const englishChanges = [];
const germanChanges = [];

if (hasAdapterTestsJob && hasCheckAndLintJob) {
    const addedDependencies = ensureNeeds(lines, getCurrentJobBlock('adapter-tests'), ['check-and-lint']);
    if (addedDependencies.includes('check-and-lint')) {
        englishChanges.push('Added `check-and-lint` to `adapter-tests.needs`.');
        germanChanges.push('`check-and-lint` zu `adapter-tests.needs` hinzugefügt.');
    }
}

if (getCurrentJobBlock('deploy')) {
    const requiredDependencies = [];

    if (hasCheckAndLintJob) {
        requiredDependencies.push('check-and-lint');
    }

    if (hasAdapterTestsJob) {
        requiredDependencies.push('adapter-tests');
    }

    const addedDependencies = ensureNeeds(lines, getCurrentJobBlock('deploy'), requiredDependencies);

    if (addedDependencies.includes('check-and-lint')) {
        englishChanges.push('Added `check-and-lint` to `deploy.needs`.');
        germanChanges.push('`check-and-lint` zu `deploy.needs` hinzugefügt.');
    }

    if (addedDependencies.includes('adapter-tests')) {
        englishChanges.push('Added `adapter-tests` to `deploy.needs`.');
        germanChanges.push('`adapter-tests` zu `deploy.needs` hinzugefügt.');
    }
}

updatePrBody(englishChanges, germanChanges);

if (englishChanges.length === 0) {
    console.log('ⓘ No changes were made.');
    console.log('✔️ processing completed');
    process.exit(0);
}

const updatedContent = lines.join(endOfLine);
fs.writeFileSync(workflowPath, hasTrailingNewline ? `${updatedContent}${endOfLine}` : updatedContent, 'utf8');

console.log(`✔️ Updated ${workflowPath}.`);
console.log('✔️ processing completed');
process.exit(0);

'use strict';

const REQUIRED_NODE_VERSION = '22.19.0';

const fs = require('node:fs');
const path = require('node:path');
const semver = require('semver');
const yaml = require('js-yaml');

const REQUIRED_NODE_MAJOR = semver.major(REQUIRED_NODE_VERSION);
const args = process.argv.slice(2);

function findStringEnd(content, start) {
    for (let i = start + 1; i < content.length; i++) {
        if (content[i] === '\\') {
            i++;
        } else if (content[i] === '"') {
            return i + 1;
        }
    }
    return content.length;
}

function skipWhitespace(content, index) {
    while (/\s/.test(content[index] || '')) index++;
    return index;
}

function skipJsonValue(content, start) {
    if (content[start] === '"') return findStringEnd(content, start);
    if (content[start] !== '{' && content[start] !== '[') {
        let end = start;
        while (end < content.length && !',}]'.includes(content[end])) end++;
        return end;
    }

    const closings = [content[start] === '{' ? '}' : ']'];
    for (let i = start + 1; i < content.length; i++) {
        if (content[i] === '"') {
            i = findStringEnd(content, i) - 1;
        } else if (content[i] === '{') {
            closings.push('}');
        } else if (content[i] === '[') {
            closings.push(']');
        } else if (content[i] === closings[closings.length - 1]) {
            closings.pop();
            if (closings.length === 0) return i + 1;
        }
    }
    return content.length;
}

function findObjectProperty(content, objectStart, propertyName) {
    let cursor = objectStart + 1;
    while (cursor < content.length) {
        cursor = skipWhitespace(content, cursor);
        if (content[cursor] === ',') {
            cursor++;
            continue;
        }
        if (content[cursor] === '}') return null;

        const keyEnd = findStringEnd(content, cursor);
        const key = JSON.parse(content.slice(cursor, keyEnd));
        const colon = skipWhitespace(content, keyEnd);
        if (content[colon] !== ':') return null;
        const start = skipWhitespace(content, colon + 1);
        const end = skipJsonValue(content, start);
        if (key === propertyName) return { start, end };
        cursor = end;
    }
    return null;
}

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const packageJsonPath = './package.json';
if (!fs.existsSync(packageJsonPath)) {
    console.log(`ⓘ ${packageJsonPath} does not exist, skipping PR creation.`);
    process.exit(0);
}

let packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
let packageJson;
try {
    packageJson = JSON.parse(packageJsonContent);
} catch (error) {
    console.error(`❌ ${packageJsonPath} is not valid JSON: ${error.message}`);
    process.exit(1);
}

const existingEnginesNode = packageJson.engines?.node;
if (typeof existingEnginesNode !== 'string') {
    console.log(`ⓘ No string 'engines.node' found in ${packageJsonPath}, skipping PR creation.`);
    process.exit(0);
}

const currentMinimum = semver.minVersion(existingEnginesNode);
if (!currentMinimum) {
    console.log(`ⓘ Could not parse engines.node '${existingEnginesNode}', skipping PR creation.`);
    process.exit(0);
}

if (semver.gt(currentMinimum, REQUIRED_NODE_VERSION)) {
    console.log(`ⓘ engines.node '${existingEnginesNode}' already requires a version higher than ${REQUIRED_NODE_VERSION}; no PR will be created.`);
    process.exit(0);
}

if (semver.gte(currentMinimum, REQUIRED_NODE_VERSION)) {
    console.log(`ⓘ engines.node '${existingEnginesNode}' already meets the required version ${REQUIRED_NODE_VERSION}; no PR will be created.`);
    process.exit(0);
}

const updatedEnginesNode = `>=${REQUIRED_NODE_VERSION}`;
const rootObjectStart = packageJsonContent.indexOf('{');
const enginesProperty = findObjectProperty(packageJsonContent, rootObjectStart, 'engines');
if (!enginesProperty || packageJsonContent[enginesProperty.start] !== '{') {
    console.error(`❌ Could not locate the engines object in ${packageJsonPath}.`);
    process.exit(1);
}

const nodeProperty = findObjectProperty(packageJsonContent, enginesProperty.start, 'node');
if (!nodeProperty) {
    console.error(`❌ Could not locate engines.node in ${packageJsonPath}.`);
    process.exit(1);
}

packageJsonContent =
    packageJsonContent.slice(0, nodeProperty.start) +
    JSON.stringify(updatedEnginesNode) +
    packageJsonContent.slice(nodeProperty.end);

const changeLog = {
    enginesNode: { from: existingEnginesNode, to: updatedEnginesNode },
    jobs: [],
    matrices: [],
    workflow: null,
};

const workflowPath = '.github/workflows/test-and-release.yml';
let workflowContent;
if (fs.existsSync(workflowPath)) {
    workflowContent = fs.readFileSync(workflowPath, 'utf8');
    try {
        yaml.load(workflowContent);
    } catch (error) {
        console.error(`❌ ${workflowPath} is not valid YAML: ${error.message}`);
        process.exit(1);
    }

    const lines = workflowContent.split('\n');
    const matrixNodeLines = new Set();
    const matrixSections = [];

    function isCommented(line) {
        return line.trimStart().startsWith('#');
    }

    function getIndent(line) {
        return line.match(/^\s*/)[0].length;
    }

    function getMajor(version) {
        const match = version.trim().replace(/^['"]|['"]$/g, '').match(/^v?(\d+)(?:\.|$)/);
        return match ? Number(match[1]) : null;
    }

    function findSectionEnd(start, indent) {
        for (let i = start + 1; i < lines.length; i++) {
            if (lines[i].trim() && !isCommented(lines[i]) && getIndent(lines[i]) <= indent) {
                return i;
            }
        }
        return lines.length;
    }

    for (let i = 0; i < lines.length; i++) {
        if (isCommented(lines[i]) || !/^\s*matrix\s*:\s*(?:#.*)?$/.test(lines[i])) continue;
        const matrixIndent = getIndent(lines[i]);
        const end = findSectionEnd(i, matrixIndent);
        for (let j = i + 1; j < end; j++) {
            if (!isCommented(lines[j]) && getIndent(lines[j]) > matrixIndent && /^\s*node-version\s*:/.test(lines[j])) {
                matrixNodeLines.add(j);
                matrixSections.push(j);
            }
        }
    }

    for (const index of [...matrixSections].sort((a, b) => b - a)) {
        const line = lines[index];
        const inlineMatch = line.match(/^(\s*node-version:\s*)\[([^\]]*)\](\s*(?:#.*)?)$/);
        if (inlineMatch) {
            const from = inlineMatch[2].split(',').map(value => value.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
            const to = from.filter(value => {
                const major = getMajor(value);
                return major === null || major >= REQUIRED_NODE_MAJOR;
            });
            if (!to.some(value => getMajor(value) === REQUIRED_NODE_MAJOR)) {
                to.push(`${REQUIRED_NODE_MAJOR}.x`);
            }
            if (from.join(',') !== to.join(',')) {
                lines[index] = `${inlineMatch[1]}[${to.join(', ')}]${inlineMatch[3]}`;
                changeLog.matrices.push({ from, to });
            }
            continue;
        }

        const keyMatch = line.match(/^(\s*node-version\s*:\s*)(.*)$/);
        if (!keyMatch) continue;

        const inlineValue = keyMatch[2].replace(/#.*$/, '').trim();
        if (inlineValue) {
            const value = inlineValue.replace(/^['"]|['"]$/g, '');
            const major = getMajor(value);
            if (major === null) continue;
            const from = [value];
            const to = from.filter(version => getMajor(version) >= REQUIRED_NODE_MAJOR);
            if (!to.some(version => getMajor(version) === REQUIRED_NODE_MAJOR)) {
                to.push(`${REQUIRED_NODE_MAJOR}.x`);
            }
            lines[index] = `${keyMatch[1]}[${to.join(', ')}]`;
            changeLog.matrices.push({ from, to });
            continue;
        }

        const listItems = [];
        let listIndent = null;
        let end = index + 1;
        for (; end < lines.length; end++) {
            const itemMatch = lines[end].match(/^(\s*)-\s*(['"]?)([^'"#,\s]+)(['"]?)\s*(?:#.*)?$/);
            if (itemMatch && getIndent(lines[end]) > getIndent(line)) {
                listIndent ??= itemMatch[1].length;
                listItems.push({ index: end, value: itemMatch[3] });
                continue;
            }
            if (lines[end].trim() && !isCommented(lines[end]) && getIndent(lines[end]) <= getIndent(line)) break;
            if (listItems.length && lines[end].trim() && !isCommented(lines[end])) break;
        }

        const from = listItems.map(item => item.value);
        const to = from.filter(value => {
            const major = getMajor(value);
            return major === null || major >= REQUIRED_NODE_MAJOR;
        });
        if (!to.some(value => getMajor(value) === REQUIRED_NODE_MAJOR)) {
            to.push(`${REQUIRED_NODE_MAJOR}.x`);
        }
        if (from.join(',') !== to.join(',')) {
            for (const item of listItems.filter(item => {
                const major = getMajor(item.value);
                return major !== null && major < REQUIRED_NODE_MAJOR;
            }).reverse()) {
                lines.splice(item.index, 1);
            }
            if (!from.some(value => getMajor(value) === REQUIRED_NODE_MAJOR)) {
                const indent = listIndent ?? getIndent(line) + 2;
                lines.splice(index + 1 + listItems.filter(item => getMajor(item.value) >= REQUIRED_NODE_MAJOR || getMajor(item.value) === null).length, 0,
                    `${' '.repeat(indent)}- ${REQUIRED_NODE_MAJOR}.x`);
            }
            changeLog.matrices.push({ from, to });
        }
    }

    matrixNodeLines.clear();
    for (let i = 0; i < lines.length; i++) {
        if (isCommented(lines[i]) || !/^\s*matrix\s*:\s*(?:#.*)?$/.test(lines[i])) continue;
        const matrixIndent = getIndent(lines[i]);
        const end = findSectionEnd(i, matrixIndent);
        for (let j = i + 1; j < end; j++) {
            if (!isCommented(lines[j]) && getIndent(lines[j]) > matrixIndent && /^\s*node-version\s*:/.test(lines[j])) {
                matrixNodeLines.add(j);
            }
        }
    }

    for (let i = 0; i < lines.length; i++) {
        if (matrixNodeLines.has(i) || isCommented(lines[i])) continue;
        const match = lines[i].match(/^(\s*node-version:\s*)(['"]?)(v?\d+(?:\.\d+(?:\.\d+)?)?(?:\.x)?)(['"]?)(\s*(?:#.*)?)$/);
        if (!match) continue;
        const currentMajor = getMajor(match[3]);
        if (currentMajor !== null && currentMajor < REQUIRED_NODE_MAJOR) {
            lines[i] = `${match[1]}'${REQUIRED_NODE_MAJOR}.x'${match[5]}`;
            changeLog.jobs.push({ from: match[3], to: `${REQUIRED_NODE_MAJOR}.x` });
        }
    }

    const updatedWorkflowContent = lines.join('\n');
    try {
        yaml.load(updatedWorkflowContent);
    } catch (error) {
        console.error(`❌ Modified ${workflowPath} is not valid YAML: ${error.message}`);
        process.exit(1);
    }
    if (updatedWorkflowContent !== workflowContent) {
        workflowContent = updatedWorkflowContent;
        changeLog.workflow = 'updated';
    } else {
        changeLog.workflow = 'already compliant';
    }
} else {
    changeLog.workflow = 'not found';
}

const titlePath = path.join(process.cwd(), '.iobroker-pr-title.tmp');
if (fs.existsSync(titlePath)) {
    fs.writeFileSync(titlePath, `Require at least node.js ${REQUIRED_NODE_VERSION}`);
}

fs.writeFileSync(packageJsonPath, packageJsonContent, 'utf8');
if (changeLog.workflow === 'updated') {
    fs.writeFileSync(workflowPath, workflowContent, 'utf8');
}

const englishLines = [
    `- Updated the \`engines.node\` requirement in \`package.json\` from \`${changeLog.enginesNode.from}\` to \`${changeLog.enginesNode.to}\`.`,
];
const germanLines = [
    `- Die \`engines.node\`-Anforderung in \`package.json\` wurde von \`${changeLog.enginesNode.from}\` auf \`${changeLog.enginesNode.to}\` aktualisiert.`,
];

if (changeLog.workflow === 'not found') {
    englishLines.push(`- \`${workflowPath}\` was not found; no workflow changes were made.`);
    germanLines.push(`- \`${workflowPath}\` wurde nicht gefunden; es wurden keine Workflow-Änderungen vorgenommen.`);
} else if (changeLog.workflow === 'already compliant') {
    englishLines.push(`- No Node.js version values below ${REQUIRED_NODE_MAJOR}.x were found in \`${workflowPath}\`; no workflow changes were made.`);
    germanLines.push(`- In \`${workflowPath}\` wurden keine Node.js-Versionsangaben unter ${REQUIRED_NODE_MAJOR}.x gefunden; es wurden keine Workflow-Änderungen vorgenommen.`);
} else {
    for (const job of changeLog.jobs) {
        englishLines.push(`- Updated a job-level \`node-version\` in \`${workflowPath}\` from \`${job.from}\` to \`${job.to}\`.`);
        germanLines.push(`- Eine jobspezifische \`node-version\`-Angabe in \`${workflowPath}\` wurde von \`${job.from}\` auf \`${job.to}\` aktualisiert.`);
    }
    for (const matrix of changeLog.matrices) {
        englishLines.push(`- Updated a Node.js matrix in \`${workflowPath}\` from \`[${matrix.from.join(', ')}]\` to \`[${matrix.to.join(', ')}]\`.`);
        germanLines.push(`- Eine Node.js-Matrix in \`${workflowPath}\` wurde von \`[${matrix.from.join(', ')}]\` auf \`[${matrix.to.join(', ')}]\` aktualisiert.`);
    }
}

const bodyPath = path.join(process.cwd(), '.iobroker-pr-body.tmp');
if (fs.existsSync(bodyPath)) {
    let body = fs.readFileSync(bodyPath, 'utf8');
    body = body.replaceAll('__REQUIRED_NODE_VERSION__', REQUIRED_NODE_VERSION);
    body = body.replace('__CHANGES_SUMMARY_EN__', englishLines.join('\n'));
    body = body.replace('__CHANGES_SUMMARY_DE__', germanLines.join('\n'));
    fs.writeFileSync(bodyPath, body);
}

console.log(`✔️ Updated engines.node to ${updatedEnginesNode}.`);
if (changeLog.workflow === 'updated') {
    console.log(`✔️ Updated ${workflowPath}: ${changeLog.jobs.length} job(s), ${changeLog.matrices.length} matrix/matrices.`);
}

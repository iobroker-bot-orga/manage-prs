// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// If no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

// Node.js version constants for this template
const DROP_NODE_VERSION = 20;   // Version being dropped
const MIN_NODE_VERSION = 22;    // Minimum version required after update

// Standard parameter handling
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

// Track changes made during processing
const changeLog = {
    enginesNode: null,  // null = not applicable; { changed, from, to } or { changed: false, current }
    enginesNpm: null,   // null = not present; { removed: true, was } or { removed: false }
    jobNodeVersion: null, // null = not found; { changed: true, jobs } or { changed: false }
    matrixNode: null,   // null = not found; { changed: true, from, to } or { changed: false, current }
    readmeNode: null,   // null = not processed; { changed: true, addedWip } or { changed: false } or { skipped: true, reason }
};

// ── Step 1: Verify package.json ───────────────────────────────────────────────

const packageJsonPath = './package.json';

if (!fs.existsSync(packageJsonPath)) {
    console.error(`❌ ${packageJsonPath} does not exist, aborting.`);
    process.exit(1);
}

console.log(`✔️ ${packageJsonPath} exists.`);

let packageJson;
let packageJsonContent;
try {
    packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    packageJson = JSON.parse(packageJsonContent);
    console.log(`✔️ ${packageJsonPath} is valid JSON.`);
} catch (error) {
    console.error(`❌ ${packageJsonPath} is not valid JSON: ${error.message}`);
    process.exit(1);
}

let packageJsonModified = false;

/**
 * Escape a string for use in a RegExp constructor.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Step 2: Check/update engines.node ────────────────────────────────────────

const enginesNode = packageJson.engines?.node;
if (!enginesNode) {
    console.log(`ⓘ No 'engines.node' found in ${packageJsonPath}, skipping engines.node update.`);
} else {
    const versionMatch = enginesNode.match(/(\d+)/);
    if (versionMatch) {
        const currentMinVersion = parseInt(versionMatch[1], 10);
        if (currentMinVersion < MIN_NODE_VERSION) {
            // Replace the first major version number in the expression
            const newEnginesNode = enginesNode.replace(/(\d+)/, MIN_NODE_VERSION.toString());
            const escapedOld = escapeRegex(enginesNode);
            packageJsonContent = packageJsonContent.replace(
                new RegExp(`("node"\\s*:\\s*")${escapedOld}(")`),
                `$1${newEnginesNode}$2`,
            );
            // Re-parse to keep packageJson in sync
            packageJson = JSON.parse(packageJsonContent);
            console.log(`✔️ Updated engines.node from '${enginesNode}' to '${newEnginesNode}' in ${packageJsonPath}.`);
            changeLog.enginesNode = { changed: true, from: enginesNode, to: newEnginesNode };
            packageJsonModified = true;
        } else {
            console.log(`ⓘ engines.node '${enginesNode}' already requires Node.js >= ${currentMinVersion} (no change needed).`);
            changeLog.enginesNode = { changed: false, current: enginesNode };
        }
    } else {
        console.log(`ⓘ Could not parse version from engines.node '${enginesNode}', skipping.`);
    }
}

// ── Step 3: Remove engines.npm if present ────────────────────────────────────

const enginesNpm = packageJson.engines?.npm;
if (enginesNpm !== undefined) {
    // Remove the "npm": "..." entry from the JSON string while preserving formatting.
    // Handle three cases: value preceded by comma, value followed by comma, or standalone value.

    const escapedNpm = escapeRegex(enginesNpm);

    // Case 1: comma before "npm" key (possibly across lines)
    const precedingCommaRegex = new RegExp(`,\\s*\\n?\\s*"npm"\\s*:\\s*"${escapedNpm}"`);
    // Case 2: comma after value (possibly across lines)
    const trailingCommaRegex = new RegExp(`"npm"\\s*:\\s*"${escapedNpm}"\\s*,\\s*\\n?\\s*`);
    // Case 3: standalone (no comma)
    const standaloneRegex = new RegExp(`"npm"\\s*:\\s*"${escapedNpm}"`);

    if (precedingCommaRegex.test(packageJsonContent)) {
        packageJsonContent = packageJsonContent.replace(precedingCommaRegex, '');
    } else if (trailingCommaRegex.test(packageJsonContent)) {
        packageJsonContent = packageJsonContent.replace(trailingCommaRegex, '');
    } else {
        packageJsonContent = packageJsonContent.replace(standaloneRegex, '');
    }

    // Validate the result is still valid JSON
    try {
        JSON.parse(packageJsonContent);
    } catch (error) {
        console.error(`❌ Removing engines.npm produced invalid JSON: ${error.message}`);
        process.exit(1);
    }

    console.log(`✔️ Removed 'engines.npm' (was '${enginesNpm}') from ${packageJsonPath}.`);
    changeLog.enginesNpm = { removed: true, was: enginesNpm };
    packageJsonModified = true;
} else {
    console.log(`ⓘ No 'engines.npm' found in ${packageJsonPath}, nothing to remove.`);
    changeLog.enginesNpm = { removed: false };
}

// Write package.json if changed
if (packageJsonModified) {
    fs.writeFileSync(packageJsonPath, packageJsonContent, 'utf8');
    console.log(`✔️ ${packageJsonPath} updated successfully.`);
}

// ── Step 4: Check test-and-release.yml ───────────────────────────────────────

const workflowPath = '.github/workflows/test-and-release.yml';

if (!fs.existsSync(workflowPath)) {
    console.log(`ⓘ ${workflowPath} does not exist, skipping workflow updates.`);
} else {
    let workflowContent = fs.readFileSync(workflowPath, 'utf8');

    // Validate YAML
    let workflowValid = true;
    try {
        yaml.load(workflowContent);
        console.log(`✔️ ${workflowPath} is valid YAML.`);
    } catch (error) {
        console.log(`ⓘ ${workflowPath} is not valid YAML: ${error.message}. Attempting workflow updates anyway.`);
        workflowValid = false;
    }

    let workflowModified = false;
    const lines = workflowContent.split('\n');

    /**
     * Check if a line is a comment line.
     * @param {string} line
     * @returns {boolean}
     */
    function isCommented(line) {
        return line.trim().startsWith('#');
    }

    /**
     * Get the number of leading spaces (indentation) of a line.
     * @param {string} line
     * @returns {number}
     */
    function getIndent(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    // ── Step 4a: Update standalone node-version entries (not in a matrix) ────
    // Match: node-version: 20 / node-version: '20' / node-version: '20.x' / node-version: "20.x"
    // Change to: node-version: '22.x'
    const jobNodeChanges = [];
    const standaloneNodeVersionRegex = /^(\s*node-version:\s*)['"]?20(?:\.x)?['"]?\s*$/;

    for (let i = 0; i < lines.length; i++) {
        if (isCommented(lines[i])) continue;
        if (standaloneNodeVersionRegex.test(lines[i])) {
            // Make sure this is NOT part of a matrix (matrix lines contain '[')
            const isMatrix = lines[i].includes('[');
            if (!isMatrix) {
                const oldLine = lines[i];
                const indentStr = ' '.repeat(getIndent(lines[i]));
                lines[i] = `${indentStr}node-version: '22.x'`;
                console.log(`✔️ Updated job node-version from '${oldLine.trim()}' to 'node-version: '22.x'' at line ${i + 1}.`);
                jobNodeChanges.push({ line: i + 1, from: oldLine.trim(), to: lines[i].trim() });
                workflowModified = true;
            }
        }
    }

    if (jobNodeChanges.length > 0) {
        changeLog.jobNodeVersion = { changed: true, jobs: jobNodeChanges };
    } else {
        // Check if there were any node-version entries at all
        const hasAnyJobNodeVersion = lines.some(
            (line, idx) => !isCommented(line) && standaloneNodeVersionRegex.test(line),
        );
        changeLog.jobNodeVersion = { changed: false, hadEntries: hasAnyJobNodeVersion };
        if (!hasAnyJobNodeVersion) {
            console.log(`ⓘ No standalone job node-version entries found in ${workflowPath}.`);
        } else {
            console.log(`ⓘ No node-version entries required updating in ${workflowPath}.`);
        }
    }

    // ── Step 4b: Update node-version matrix entries ────────────────────────────
    // Match lines like: node-version: [18.x, 20.x, 22.x]
    // Remove 20 (or 20.x), ensure 22 (or 22.x) is present.
    const matrixNodeVersionRegex = /^(\s*node-version:\s*\[)([^\]]+)(\]\s*)$/;

    /**
     * Parse the major Node.js version number from strings like '20.x', '22', etc.
     * @param {string} versionStr
     * @returns {number|null}
     */
    function parseNodeMajorVersion(versionStr) {
        const str = versionStr.replace(/^['"]|['"]$/g, '').trim();
        const match = str.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }

    let matrixChanged = false;
    let matrixFrom = null;
    let matrixTo = null;

    for (let i = 0; i < lines.length; i++) {
        if (isCommented(lines[i])) continue;
        const matrixMatch = lines[i].match(matrixNodeVersionRegex);
        if (!matrixMatch) continue;

        const indentStr = matrixMatch[1];
        const versionsStr = matrixMatch[2];
        const suffix = matrixMatch[3];

        // Parse existing versions
        const existingVersions = versionsStr
            .split(',')
            .map(v => v.trim().replace(/^['"]|['"]$/g, ''))
            .filter(v => v.length > 0);

        // Remove node 20 (any variant: "20", "20.x", '20', '20.x')
        const filteredVersions = existingVersions.filter(v => {
            const major = parseNodeMajorVersion(v);
            return major !== DROP_NODE_VERSION;
        });

        // Ensure node 22 is present
        const has22 = filteredVersions.some(v => parseNodeMajorVersion(v) === MIN_NODE_VERSION);
        if (!has22) {
            filteredVersions.push(`${MIN_NODE_VERSION}.x`);
            // Sort numerically
            filteredVersions.sort((a, b) => (parseNodeMajorVersion(a) || 0) - (parseNodeMajorVersion(b) || 0));
        }

        // Check if a change is needed
        const removedNode20 = existingVersions.some(v => parseNodeMajorVersion(v) === DROP_NODE_VERSION);
        const needsUpdate =
            removedNode20 ||
            existingVersions.length !== filteredVersions.length ||
            !filteredVersions.every(v => existingVersions.includes(v));

        if (needsUpdate) {
            const newVersionsStr = filteredVersions.join(', ');
            lines[i] = `${indentStr}${newVersionsStr}${suffix}`;
            console.log(`✔️ Updated node-version matrix at line ${i + 1} from [${existingVersions.join(', ')}] to [${filteredVersions.join(', ')}].`);
            matrixChanged = true;
            matrixFrom = existingVersions;
            matrixTo = filteredVersions;
            workflowModified = true;
        } else {
            console.log(`ⓘ node-version matrix at line ${i + 1} already does not include Node.js ${DROP_NODE_VERSION} and includes Node.js ${MIN_NODE_VERSION}: [${existingVersions.join(', ')}].`);
            if (!matrixChanged) {
                changeLog.matrixNode = { changed: false, current: existingVersions };
            }
        }
    }

    if (matrixChanged) {
        changeLog.matrixNode = { changed: true, from: matrixFrom, to: matrixTo };
    } else if (changeLog.matrixNode === null) {
        console.log(`ⓘ No node-version matrix entries found in ${workflowPath}.`);
    }

    // Write workflow if changed
    if (workflowModified) {
        // Validate the modified YAML if original was valid
        if (workflowValid) {
            try {
                yaml.load(lines.join('\n'));
            } catch (error) {
                console.error(`❌ Modified ${workflowPath} is not valid YAML: ${error.message}`);
                process.exit(1);
            }
        }
        fs.writeFileSync(workflowPath, lines.join('\n'), 'utf8');
        console.log(`✔️ ${workflowPath} updated successfully.`);
    } else {
        console.log(`ⓘ No changes required in ${workflowPath}.`);
    }
}

// ── Step 5: Update README.md changelog if engines.node was changed ────────────

const readmePath = './README.md';

if (changeLog.enginesNode?.changed === true) {
    if (!fs.existsSync(readmePath)) {
        console.log(`ⓘ ${readmePath} does not exist, skipping README update.`);
        changeLog.readmeNode = { skipped: true, reason: 'file not found' };
    } else {
        const readmeContent = fs.readFileSync(readmePath, 'utf8');
        const readmeLines = readmeContent.split('\n');

        // Find the ## Changelog section header
        let changelogLineIdx = -1;
        for (let i = 0; i < readmeLines.length; i++) {
            if (/^##\s+Changelog/.test(readmeLines[i])) {
                changelogLineIdx = i;
                break;
            }
        }

        if (changelogLineIdx === -1) {
            console.log(`ⓘ No '## Changelog' section found in ${readmePath}, skipping README update.`);
            changeLog.readmeNode = { skipped: true, reason: 'no Changelog section' };
        } else {
            // Determine insertion point: after ## Changelog header, past any HTML comment block
            let insertIdx = changelogLineIdx + 1;

            // Skip blank lines immediately after ## Changelog
            while (insertIdx < readmeLines.length && readmeLines[insertIdx].trim() === '') {
                insertIdx++;
            }

            // Skip an HTML comment block if present (<!-- ... -->)
            if (insertIdx < readmeLines.length && readmeLines[insertIdx].trim().startsWith('<!--')) {
                if (readmeLines[insertIdx].includes('-->')) {
                    // Single-line comment
                    insertIdx++;
                } else {
                    // Multi-line comment — advance until we find the closing -->
                    while (insertIdx < readmeLines.length && !readmeLines[insertIdx].includes('-->')) {
                        insertIdx++;
                    }
                    insertIdx++; // move past the line containing '-->'
                }
                // Skip blank lines after the comment block
                while (insertIdx < readmeLines.length && readmeLines[insertIdx].trim() === '') {
                    insertIdx++;
                }
            }

            const wipHeader = '### **WORK IN PROGRESS**';
            const newEntry = `- (copilot) Adapter requires node.js >= ${MIN_NODE_VERSION} now`;

            // Search for an existing ### **WORK IN PROGRESS** header inside the Changelog section
            // Skip content inside HTML comment blocks during the search
            let wipLineIdx = -1;
            let inHtmlComment = false;
            for (let i = changelogLineIdx + 1; i < readmeLines.length; i++) {
                // Stop at the next ## heading (new top-level section)
                if (i > changelogLineIdx && /^##\s/.test(readmeLines[i])) {
                    break;
                }
                // Track HTML comment blocks so we don't match a WIP header inside a comment
                if (!inHtmlComment && readmeLines[i].trim().startsWith('<!--')) {
                    if (!readmeLines[i].includes('-->')) {
                        inHtmlComment = true;
                    }
                    continue;
                }
                if (inHtmlComment) {
                    if (readmeLines[i].includes('-->')) {
                        inHtmlComment = false;
                    }
                    continue;
                }
                // Use exact match (no leading whitespace) to avoid accidentally matching a WIP
                // header inside an HTML comment block (those are typically indented with spaces)
                if (readmeLines[i] === wipHeader) {
                    wipLineIdx = i;
                    break;
                }
            }

            if (wipLineIdx === -1) {
                // No WORK IN PROGRESS section — insert header + entry at insertIdx
                readmeLines.splice(insertIdx, 0, wipHeader, newEntry, '');
                console.log(`✔️ Added '${wipHeader}' section with entry to ${readmePath}.`);
                fs.writeFileSync(readmePath, readmeLines.join('\n'), 'utf8');
                changeLog.readmeNode = { changed: true, addedWip: true };
            } else {
                // WORK IN PROGRESS section exists — check if entry is already present
                let alreadyHasEntry = false;
                for (let i = wipLineIdx + 1; i < readmeLines.length; i++) {
                    if (/^###\s/.test(readmeLines[i]) || /^##\s/.test(readmeLines[i])) {
                        break;
                    }
                    if (readmeLines[i].trim() === newEntry) {
                        alreadyHasEntry = true;
                        break;
                    }
                }

                if (alreadyHasEntry) {
                    console.log(`ⓘ Entry '${newEntry}' already exists in '${wipHeader}' section of ${readmePath}.`);
                    changeLog.readmeNode = { changed: false };
                } else {
                    // Insert entry right after the WIP header line
                    readmeLines.splice(wipLineIdx + 1, 0, newEntry);
                    console.log(`✔️ Added entry '${newEntry}' to existing '${wipHeader}' section in ${readmePath}.`);
                    fs.writeFileSync(readmePath, readmeLines.join('\n'), 'utf8');
                    changeLog.readmeNode = { changed: true, addedWip: false };
                }
            }
        }
    }
} else {
    console.log(`ⓘ engines.node was not changed — skipping README.md changelog update.`);
}

// ── Step 6: Replace placeholders in PR body file ──────────────────────────────

const prBodyFile = path.join(process.cwd(), '.iobroker-pr-body.tmp');
if (fs.existsSync(prBodyFile)) {
    let prBody = fs.readFileSync(prBodyFile, 'utf8');

    // Build dynamic changes summary (English + German)
    const englishLines = [];
    const germanLines = [];

    // engines.node change
    if (changeLog.enginesNode !== null) {
        if (changeLog.enginesNode.changed) {
            englishLines.push(`- The \`engines.node\` requirement in \`package.json\` was updated from \`${changeLog.enginesNode.from}\` to \`${changeLog.enginesNode.to}\`.`);
            germanLines.push(`- Die \`engines.node\`-Anforderung in \`package.json\` wurde von \`${changeLog.enginesNode.from}\` auf \`${changeLog.enginesNode.to}\` aktualisiert.`);
        } else {
            englishLines.push(`- The \`engines.node\` requirement in \`package.json\` was already \`${changeLog.enginesNode.current}\` — no change needed.`);
            germanLines.push(`- Die \`engines.node\`-Anforderung in \`package.json\` war bereits \`${changeLog.enginesNode.current}\` — keine Änderung erforderlich.`);
        }
    } else {
        englishLines.push(`- No \`engines.node\` entry found in \`package.json\` — no change applied.`);
        germanLines.push(`- Kein \`engines.node\`-Eintrag in \`package.json\` gefunden — keine Änderung vorgenommen.`);
    }

    // engines.npm removal
    if (changeLog.enginesNpm !== null) {
        if (changeLog.enginesNpm.removed) {
            englishLines.push(`- The \`engines.npm\` requirement (\`${changeLog.enginesNpm.was}\`) was removed from \`package.json\`.`);
            germanLines.push(`- Die \`engines.npm\`-Anforderung (\`${changeLog.enginesNpm.was}\`) wurde aus \`package.json\` entfernt.`);
        }
    }

    // Job node-version changes
    if (changeLog.jobNodeVersion !== null) {
        if (changeLog.jobNodeVersion.changed) {
            englishLines.push(`- Node.js version was updated from ${DROP_NODE_VERSION}.x to ${MIN_NODE_VERSION}.x for ${changeLog.jobNodeVersion.jobs.length} job(s) in \`test-and-release.yml\`.`);
            germanLines.push(`- Die Node.js-Version wurde für ${changeLog.jobNodeVersion.jobs.length} Job(s) in \`test-and-release.yml\` von ${DROP_NODE_VERSION}.x auf ${MIN_NODE_VERSION}.x aktualisiert.`);
        } else {
            englishLines.push(`- No job-level Node.js ${DROP_NODE_VERSION} version entries found in \`test-and-release.yml\` — no change needed.`);
            germanLines.push(`- Keine jobspezifischen Node.js-${DROP_NODE_VERSION}-Versionseinträge in \`test-and-release.yml\` gefunden — keine Änderung erforderlich.`);
        }
    } else {
        englishLines.push(`- \`test-and-release.yml\` was not found or not processed — job node-version check skipped.`);
        germanLines.push(`- \`test-and-release.yml\` wurde nicht gefunden oder nicht verarbeitet — Prüfung der jobspezifischen Node.js-Version übersprungen.`);
    }

    // Matrix node-version changes
    if (changeLog.matrixNode !== null) {
        if (changeLog.matrixNode.changed) {
            englishLines.push(`- Node.js ${DROP_NODE_VERSION} was removed from the test matrix in \`test-and-release.yml\`. Matrix updated from \`[${changeLog.matrixNode.from.join(', ')}]\` to \`[${changeLog.matrixNode.to.join(', ')}]\`.`);
            germanLines.push(`- Node.js ${DROP_NODE_VERSION} wurde aus der Testmatrix in \`test-and-release.yml\` entfernt. Matrix von \`[${changeLog.matrixNode.from.join(', ')}]\` auf \`[${changeLog.matrixNode.to.join(', ')}]\` aktualisiert.`);
        } else {
            englishLines.push(`- The test matrix in \`test-and-release.yml\` already does not include Node.js ${DROP_NODE_VERSION} — no change needed.`);
            germanLines.push(`- Die Testmatrix in \`test-and-release.yml\` enthält Node.js ${DROP_NODE_VERSION} bereits nicht — keine Änderung erforderlich.`);
        }
    } else {
        englishLines.push(`- No node-version matrix found in \`test-and-release.yml\` — matrix check skipped.`);
        germanLines.push(`- Keine Node.js-Versionsmatrix in \`test-and-release.yml\` gefunden — Matrixprüfung übersprungen.`);
    }

    // README.md changelog update
    if (changeLog.readmeNode !== null) {
        if (changeLog.readmeNode.skipped) {
            englishLines.push(`- \`README.md\` changelog update skipped (${changeLog.readmeNode.reason}).`);
            germanLines.push(`- Aktualisierung des \`README.md\`-Changelogs übersprungen (${changeLog.readmeNode.reason}).`);
        } else if (changeLog.readmeNode.changed) {
            if (changeLog.readmeNode.addedWip) {
                englishLines.push(`- Added \`### **WORK IN PROGRESS**\` section with node.js >= ${MIN_NODE_VERSION} requirement notice to \`README.md\` changelog.`);
                germanLines.push(`- Abschnitt \`### **WORK IN PROGRESS**\` mit Hinweis auf node.js >= ${MIN_NODE_VERSION}-Anforderung in \`README.md\`-Changelog hinzugefügt.`);
            } else {
                englishLines.push(`- Added node.js >= ${MIN_NODE_VERSION} requirement notice to existing \`### **WORK IN PROGRESS**\` section in \`README.md\` changelog.`);
                germanLines.push(`- Hinweis auf node.js >= ${MIN_NODE_VERSION}-Anforderung in vorhandenem \`### **WORK IN PROGRESS**\`-Abschnitt in \`README.md\`-Changelog hinzugefügt.`);
            }
        } else {
            englishLines.push(`- \`README.md\` changelog already contains the node.js >= ${MIN_NODE_VERSION} requirement notice — no change needed.`);
            germanLines.push(`- \`README.md\`-Changelog enthält den Hinweis auf node.js >= ${MIN_NODE_VERSION}-Anforderung bereits — keine Änderung erforderlich.`);
        }
    }

    const englishSummary = englishLines.join('\n');
    const germanSummary = germanLines.join('\n');

    prBody = prBody.replace('__CHANGES_SUMMARY_EN__', englishSummary);
    prBody = prBody.replace('__CHANGES_SUMMARY_DE__', germanSummary);

    fs.writeFileSync(prBodyFile, prBody);
    console.log(`✔️ Updated PR body file with change information.`);
}

// Determine if any changes were actually made
const anyChange =
    (changeLog.enginesNode && changeLog.enginesNode.changed) ||
    (changeLog.enginesNpm && changeLog.enginesNpm.removed) ||
    (changeLog.jobNodeVersion && changeLog.jobNodeVersion.changed) ||
    (changeLog.matrixNode && changeLog.matrixNode.changed) ||
    (changeLog.readmeNode && changeLog.readmeNode.changed);

if (!anyChange) {
    console.log(`ⓘ No changes were required for this repository — no PR will be created.`);
} else {
    console.log(`✔️ All required changes have been applied.`);
}

console.log(`✔️ Processing completed.`);
process.exit(0);

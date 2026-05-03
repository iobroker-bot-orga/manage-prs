// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// If no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

'use strict';

const fs = require('node:fs');
const path = require('node:path');

// prepare standard parameters
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

const changelogOldPath = path.join('.', 'CHANGELOG_OLD.md');
const readmePath = path.join('.', 'README.md');

// --- Step 1: Create CHANGELOG_OLD.md if it does not exist ---

let changelogOldCreated = false;

if (!fs.existsSync(changelogOldPath)) {
    const initialContent = '# Older changes\n';
    try {
        fs.writeFileSync(changelogOldPath, initialContent, 'utf8');
        console.log('✔️ CHANGELOG_OLD.md has been created.');
        changelogOldCreated = true;
    } catch (error) {
        console.error(`❌ Error creating CHANGELOG_OLD.md: ${error.message}`);
        process.exit(1);
    }
} else {
    console.log('ⓘ CHANGELOG_OLD.md already exists, skipping creation.');
}

// --- Step 2: Add link to CHANGELOG_OLD.md in README.md ---

if (!fs.existsSync(readmePath)) {
    console.error('❌ README.md does not exist, cannot add link.');
    process.exit(1);
}

let readmeContent;
try {
    readmeContent = fs.readFileSync(readmePath, 'utf8');
} catch (error) {
    console.error(`❌ Error reading README.md: ${error.message}`);
    process.exit(1);
}

const changelogLink = '[Older changelogs can be found there](CHANGELOG_OLD.md)';

// Check if the link already exists
if (readmeContent.includes(changelogLink) || readmeContent.includes('CHANGELOG_OLD.md')) {
    console.log('ⓘ Link to CHANGELOG_OLD.md already exists in README.md, skipping.');

    if (!changelogOldCreated) {
        // Nothing to do at all
        console.log('ⓘ No changes required.');
        process.exit(0);
    }
} else {
    // Find the end of the changelog section and append the link there.
    // The changelog section typically starts with a heading like "## Changelog".
    // We insert the link just before the next top-level section heading (## ...)
    // or at the end of the file if no such section follows.

    const changelogHeadingRegex = /^##\s+Changelog\b/im;
    const match = changelogHeadingRegex.exec(readmeContent);

    if (!match) {
        console.log('ⓘ No ## Changelog section found in README.md, appending link at end of file.');
        readmeContent = readmeContent.trimEnd() + '\n\n' + changelogLink + '\n';
    } else {
        // Find the next top-level heading (## ...) after the changelog heading
        const afterChangelog = readmeContent.slice(match.index + match[0].length);
        const nextSectionRegex = /^##\s+/m;
        const nextMatch = nextSectionRegex.exec(afterChangelog);

        let insertIndex;
        if (nextMatch) {
            // Insert just before the next ## section
            insertIndex = match.index + match[0].length + nextMatch.index;
        } else {
            // No next section — append at end of file
            insertIndex = readmeContent.length;
        }

        // Trim trailing whitespace/newlines from the content before the insert point,
        // then add a blank line, the link, and a newline.
        const before = readmeContent.slice(0, insertIndex).trimEnd();
        const after = readmeContent.slice(insertIndex).trimStart();

        if (after.length > 0) {
            readmeContent = before + '\n\n' + changelogLink + '\n\n' + after;
        } else {
            readmeContent = before + '\n\n' + changelogLink + '\n';
        }
    }

    try {
        fs.writeFileSync(readmePath, readmeContent, 'utf8');
        console.log('✔️ Link to CHANGELOG_OLD.md has been added to README.md.');
    } catch (error) {
        console.error(`❌ Error writing README.md: ${error.message}`);
        process.exit(1);
    }
}

console.log('✔️ processing completed');
process.exit(0);

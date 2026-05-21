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

const readmePath = path.join('.', 'README.md');
const changelogOldPath = path.join('.', 'CHANGELOG_OLD.md');
const changelogOldLinkReference = '(CHANGELOG_OLD.md)';
const changelogOldLink = '[Older changelogs can be found there](CHANGELOG_OLD.md)';

function addLinkToChangelogSection(readmeContent) {
  const changelogHeaderRegex = /^##\s+Changelog\b/im;
  const changelogHeaderMatch = readmeContent.match(changelogHeaderRegex);

  if (!changelogHeaderMatch) {
    return null;
  }

  const changelogStart = changelogHeaderMatch.index + changelogHeaderMatch[0].length;
  const afterChangelog = readmeContent.slice(changelogStart);
  const nextSectionMatch = afterChangelog.match(/^##\s+/m);
  const changelogEnd = nextSectionMatch ? changelogStart + nextSectionMatch.index : readmeContent.length;

  const changelogSection = readmeContent.slice(changelogStart, changelogEnd).trimEnd();
  const updatedChangelogSection = `${changelogSection}\n\n${changelogOldLink}`;
  const trailingContent = readmeContent.slice(changelogEnd);
  const normalizedTrailingContent = trailingContent
    ? `\n\n${trailingContent.replace(/^\n+/, '')}`
    : '';

  return `${readmeContent.slice(0, changelogStart)}${updatedChangelogSection}${normalizedTrailingContent}`;
}

if (!fs.existsSync(changelogOldPath)) {
  console.log(`ⓘ ${changelogOldPath} does not exist, skipping processing without changes.`);
  console.log('✔️ processing completed');
  process.exit(0);
}

if (!fs.existsSync(readmePath)) {
  console.log(`ⓘ ${readmePath} does not exist, skipping processing without changes.`);
  console.log('✔️ processing completed');
  process.exit(0);
}

let readmeContent;
try {
  readmeContent = fs.readFileSync(readmePath, 'utf8');
} catch (error) {
  console.error(`❌ Error reading ${readmePath}: ${error.message}`);
  process.exit(1);
}

if (readmeContent.includes(changelogOldLinkReference)) {
  console.log(`ⓘ ${readmePath} already contains a link to ${changelogOldPath}, skipping processing without changes.`);
  console.log('✔️ processing completed');
  process.exit(0);
}

const updatedReadmeContent = addLinkToChangelogSection(readmeContent);

if (updatedReadmeContent === null) {
  console.log(`ⓘ No Changelog section found in ${readmePath}, skipping processing without changes.`);
  console.log('✔️ processing completed');
  process.exit(0);
}

try {
  fs.writeFileSync(readmePath, updatedReadmeContent, 'utf8');
  console.log(`✔️ Added link to ${changelogOldPath} at the end of the Changelog section in ${readmePath}.`);
} catch (error) {
  console.error(`❌ Error writing ${readmePath}: ${error.message}`);
  process.exit(1);
}

try {
  const changelogOldContent = fs.readFileSync(changelogOldPath, 'utf8');
  const cleanedChangelogOldContent = changelogOldContent.replace(
    /^.*Older changelogs can be found there.*(?:\r?\n)?/gmi,
    '',
  );

  if (cleanedChangelogOldContent !== changelogOldContent) {
    fs.writeFileSync(changelogOldPath, cleanedChangelogOldContent, 'utf8');
    console.log(`✔️ Removed outdated link line from ${changelogOldPath}.`);
  } else {
    console.log(`ⓘ No outdated link line found in ${changelogOldPath}.`);
  }
} catch (error) {
  console.error(`❌ Error updating ${changelogOldPath}: ${error.message}`);
  process.exit(1);
}

console.log('✔️ processing completed');
process.exit(0);

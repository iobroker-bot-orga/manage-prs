// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of an PR.

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

// Constants
const COPYRIGHT_YEAR = '2026';
const JS_CONTROLLER_VERSION = '6.0.11';
const ADMIN_VERSION = '7.7.22';

const COMMUNITY_ADAPTERS_NAME = 'iobroker-community-adapters';
const COMMUNITY_ADAPTERS_EMAIL = 'iobroker-community-adapters@gmx.de';
const COPYRIGHT_LINE = `Copyright (c) ${COPYRIGHT_YEAR} ${COMMUNITY_ADAPTERS_NAME} <${COMMUNITY_ADAPTERS_EMAIL}>  `;

const COPYRIGHT_REGEX = /^Copyright\s+\(c\)/mi;
const WIP_HEADER_REGEX = /^\*\*WORK IN PROGRESS\*\*$/i;
const COMMUNITY_COPYRIGHT_REGEX = /Copyright\s+\(c\)\s+\d{4}(?:-\d{4})?\s+iobroker-community-adapters/i;

// GitHub raw URLs for referenced files
const AUTO_MERGE_CONFIG_URL = 'https://raw.githubusercontent.com/iobroker-bot-orga/action-automerge-dependabot/main/.github/auto-merge.example.yml';
const AUTOMERGE_DEPENDABOT_WORKFLOW_URL = 'https://raw.githubusercontent.com/iobroker-bot-orga/action-automerge-dependabot/main/.github/workflows/automerge-dependabot.example.yml';
const AUTOMERGE_IOBROKER_BOT_WORKFLOW_URL = 'https://raw.githubusercontent.com/iobroker-bot-orga/action-automerge-iobroker-bot/main/.github/workflows/automerge-iobroker-bot.example.yml';

// prepare standard parameters
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Missing required arguments');
  process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

// Change tracking for dynamic PR description
const appliedChanges = {
    en: [],
    de: []
};

// Explanation tracking - only add explanations for changes that were applied
const appliedExplanations = {
    en: [],
    de: []
};

function trackChange(en, de) {
    appliedChanges.en.push(en);
    appliedChanges.de.push(de);
}

function trackExplanation(en, de) {
    appliedExplanations.en.push(en);
    appliedExplanations.de.push(de);
}

/**
 * Fetch content from a URL using https
 */
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                fetchUrl(res.headers.location).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                return;
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

/**
 * Correct the GitHub owner part of a URL to iobroker-community-adapters.
 * Handles both HTTPS (https://github.com/owner/repo) and
 * SSH (git@github.com:owner/repo.git) formats.
 * Returns { url, changed, oldOwner }.
 */
function correctGitHubOwnerInUrl(url) {
    if (!url || typeof url !== 'string') return { url, changed: false };

    // SSH format: git@github.com:owner/repo.git
    const sshMatch = url.match(/^(git@github\.com:)([^\/\s]+)(\/[^\s]*)(.*)$/);
    if (sshMatch) {
        const owner = sshMatch[2];
        if (owner === COMMUNITY_ADAPTERS_NAME) return { url, changed: false };
        return {
            url: sshMatch[1] + COMMUNITY_ADAPTERS_NAME + sshMatch[3] + sshMatch[4],
            changed: true,
            oldOwner: owner
        };
    }

    // HTTPS format: https://github.com/owner/repo or git+https://github.com/owner/repo.git
    const httpsMatch = url.match(/^(.*github\.com\/)([^\/\s]+)(\/[^\s]*)(.*)$/);
    if (httpsMatch) {
        const owner = httpsMatch[2];
        if (owner === COMMUNITY_ADAPTERS_NAME) return { url, changed: false };
        return {
            url: httpsMatch[1] + COMMUNITY_ADAPTERS_NAME + httpsMatch[3] + httpsMatch[4],
            changed: true,
            oldOwner: owner
        };
    }

    return { url, changed: false };
}

/**
 * Ensure all copyright lines in a block (except the last) end with two spaces.
 * Returns modified content and whether any changes were made.
 */
function fixCopyrightTrailingSpaces(content) {
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
        if (/^Copyright\s+\(c\)/i.test(lines[i])) {
            // Check if next line is also a copyright line
            if (i + 1 < lines.length && /^Copyright\s+\(c\)/i.test(lines[i + 1])) {
                // This is not the last copyright line in the block
                const trimmed = lines[i].replace(/\s+$/, '');
                if (!lines[i].endsWith('  ')) {
                    lines[i] = trimmed + '  ';
                    modified = true;
                }
            }
        }
    }

    return { content: lines.join('\n'), modified };
}

/**
 * Add copyright line to README.md if not present, and fix trailing spaces
 */
function updateReadme() {
    const readmePath = './README.md';

    if (!fs.existsSync(readmePath)) {
        console.log(`ⓘ ${readmePath} does not exist, skipping.`);
        return;
    }

    console.log(`✔️ ${readmePath} exists.`);

    let content = fs.readFileSync(readmePath, 'utf8');
    let changed = false;

    if (!COMMUNITY_COPYRIGHT_REGEX.test(content)) {
        const licenseSectionRegex = /^##?\s+License\s*(<.*>)?\s*$/mi;
        const sectionMatch = content.match(licenseSectionRegex);

        if (!sectionMatch) {
            console.log(`ⓘ License section not found in ${readmePath}, skipping copyright addition.`);
        } else {
            const sectionStart = sectionMatch.index + sectionMatch[0].length;
            const afterSection = content.substring(sectionStart);
            const copyrightMatch = afterSection.match(COPYRIGHT_REGEX);

            let insertPosition;
            if (copyrightMatch) {
                insertPosition = sectionStart + copyrightMatch.index;
                console.log(`ⓘ Found existing copyright line, inserting before it.`);
            } else {
                insertPosition = sectionStart;
                console.log(`ⓘ No existing copyright line found, inserting after License header.`);
            }

            const beforeInsert = content.substring(0, insertPosition);
            const afterInsert = content.substring(insertPosition);
            content = beforeInsert + '\n' + COPYRIGHT_LINE + '\n' + afterInsert;
            changed = true;
            console.log(`✔️ Added copyright line to ${readmePath}.`);
            trackChange(
                `**README.md**: Added copyright line for ${COMMUNITY_ADAPTERS_NAME} in the License section`,
                `**README.md**: Copyright-Zeile für ${COMMUNITY_ADAPTERS_NAME} im Lizenz-Abschnitt hinzugefügt`
            );
        }
    } else {
        console.log(`ⓘ Copyright line with ${COMMUNITY_ADAPTERS_NAME} already exists in ${readmePath}.`);
    }

    // Fix trailing spaces on all copyright lines except the last in each block
    const { content: fixedContent, modified: spacesFixed } = fixCopyrightTrailingSpaces(content);
    if (spacesFixed) {
        content = fixedContent;
        changed = true;
        console.log(`✔️ Fixed trailing spaces on copyright lines in ${readmePath}.`);
    }

    if (changed) {
        fs.writeFileSync(readmePath, content, 'utf8');
    }
}

/**
 * Add copyright line to LICENSE if not present, and fix trailing spaces
 */
function updateLicense() {
    const licensePath = './LICENSE';

    if (!fs.existsSync(licensePath)) {
        console.log(`ⓘ ${licensePath} does not exist, skipping.`);
        return;
    }

    console.log(`✔️ ${licensePath} exists.`);

    let content = fs.readFileSync(licensePath, 'utf8');
    let changed = false;

    if (!COMMUNITY_COPYRIGHT_REGEX.test(content)) {
        const copyrightMatch = content.match(COPYRIGHT_REGEX);

        let updatedContent;
        if (copyrightMatch) {
            const insertPosition = copyrightMatch.index;
            updatedContent = content.substring(0, insertPosition) + COPYRIGHT_LINE + '\n' + content.substring(insertPosition);
            console.log(`ⓘ Found existing copyright line, inserting before it.`);
        } else {
            updatedContent = COPYRIGHT_LINE + '\n' + content;
            console.log(`ⓘ No existing copyright line found, adding as first line.`);
        }

        content = updatedContent;
        changed = true;
        console.log(`✔️ Added copyright line to ${licensePath}.`);
        trackChange(
            `**LICENSE**: Added copyright line for ${COMMUNITY_ADAPTERS_NAME}`,
            `**LICENSE**: Copyright-Zeile für ${COMMUNITY_ADAPTERS_NAME} hinzugefügt`
        );
    } else {
        console.log(`ⓘ Copyright line with ${COMMUNITY_ADAPTERS_NAME} already exists in ${licensePath}.`);
    }

    const { content: fixedContent, modified: spacesFixed } = fixCopyrightTrailingSpaces(content);
    if (spacesFixed) {
        content = fixedContent;
        changed = true;
        console.log(`✔️ Fixed trailing spaces on copyright lines in ${licensePath}.`);
    }

    if (changed) {
        fs.writeFileSync(licensePath, content, 'utf8');
    }
}

/**
 * Convert person object to string format
 */
function personToString(person) {
    if (typeof person === 'string') {
        return person;
    }
    if (typeof person === 'object' && person !== null && person.name) {
        return person.email
            ? `${person.name} <${person.email}>`
            : person.name;
    }
    return String(person);
}

/**
 * Update package.json contributors and fix 'release' script
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

    let packageJsonChanged = false;

    // Convert 'author' to string format if it's an object
    if (packageJson.author && typeof packageJson.author === 'object') {
        const authorString = personToString(packageJson.author);
        packageJson.author = authorString;
        console.log(`✔️ Converted author object to string: ${authorString}`);
        packageJsonChanged = true;
    }

    // Ensure contributors array exists
    if (!packageJson.contributors) {
        packageJson.contributors = [];
    }

    // Convert contributor objects to string format
    for (let i = 0; i < packageJson.contributors.length; i++) {
        const contributor = packageJson.contributors[i];
        if (typeof contributor === 'object' && contributor !== null && contributor.name) {
            const contributorString = personToString(contributor);
            packageJson.contributors[i] = contributorString;
            console.log(`✔️ Converted contributor object to string: ${contributorString}`);
            packageJsonChanged = true;
        }
    }

    // Check if iobroker-community-adapters is already in contributors
    const hasContributor = packageJson.contributors.some(contributor => {
        if (typeof contributor === 'string') {
            return contributor.includes(COMMUNITY_ADAPTERS_NAME);
        }
        return contributor.name === COMMUNITY_ADAPTERS_NAME;
    });

    if (!hasContributor) {
        packageJson.contributors.push(`${COMMUNITY_ADAPTERS_NAME} <${COMMUNITY_ADAPTERS_EMAIL}>`);
        console.log(`✔️ Added ${COMMUNITY_ADAPTERS_NAME} to contributors in ${packageJsonPath}.`);
        packageJsonChanged = true;
        trackChange(
            `**package.json**: Added ${COMMUNITY_ADAPTERS_NAME} to the contributors array`,
            `**package.json**: ${COMMUNITY_ADAPTERS_NAME} zum contributors-Array hinzugefügt`
        );
    } else {
        console.log(`ⓘ ${COMMUNITY_ADAPTERS_NAME} already exists in contributors.`);
    }

    // Fix npm 'release' script: must be 'release-script' or 'release-script -y'
    if (packageJson.scripts && packageJson.scripts.release) {
        const currentRelease = packageJson.scripts.release;
        if (currentRelease.startsWith('release-script')) {
            const hasY = /(?:^|\s)-y(?:\s|$)/.test(currentRelease);
            const expected = hasY ? 'release-script -y' : 'release-script';
            if (currentRelease !== expected) {
                packageJson.scripts.release = expected;
                console.log(`✔️ Fixed npm 'release' script from "${currentRelease}" to "${expected}".`);
                packageJsonChanged = true;
                trackChange(
                    `**package.json**: Fixed npm \`release\` script to \`${expected}\` (removed unsupported options)`,
                    `**package.json**: npm-Skript \`release\` auf \`${expected}\` korrigiert (nicht unterstützte Optionen entfernt)`
                );
            } else {
                console.log(`ⓘ npm 'release' script is already correct: "${currentRelease}".`);
            }
        } else {
            console.log(`ⓘ npm 'release' script is not based on release-script, skipping fix.`);
        }
    }

    // Correct GitHub URLs to use iobroker-community-adapters as owner
    for (const field of ['homepage']) {
        if (packageJson[field]) {
            const result = correctGitHubOwnerInUrl(packageJson[field]);
            if (result.changed) {
                console.log(`✔️ Corrected ${field} owner from "${result.oldOwner}" to "${COMMUNITY_ADAPTERS_NAME}".`);
                packageJson[field] = result.url;
                packageJsonChanged = true;
                trackChange(
                    `**package.json**: Corrected \`${field}\` URL owner to \`${COMMUNITY_ADAPTERS_NAME}\``,
                    `**package.json**: URL-Owner in \`${field}\` auf \`${COMMUNITY_ADAPTERS_NAME}\` korrigiert`
                );
            }
        }
    }

    if (packageJson.repository) {
        if (typeof packageJson.repository === 'string') {
            const result = correctGitHubOwnerInUrl(packageJson.repository);
            if (result.changed) {
                console.log(`✔️ Corrected repository owner from "${result.oldOwner}" to "${COMMUNITY_ADAPTERS_NAME}".`);
                packageJson.repository = result.url;
                packageJsonChanged = true;
                trackChange(
                    `**package.json**: Corrected \`repository\` URL owner to \`${COMMUNITY_ADAPTERS_NAME}\``,
                    `**package.json**: URL-Owner in \`repository\` auf \`${COMMUNITY_ADAPTERS_NAME}\` korrigiert`
                );
            }
        } else if (typeof packageJson.repository === 'object' && packageJson.repository.url) {
            const result = correctGitHubOwnerInUrl(packageJson.repository.url);
            if (result.changed) {
                console.log(`✔️ Corrected repository.url owner from "${result.oldOwner}" to "${COMMUNITY_ADAPTERS_NAME}".`);
                packageJson.repository.url = result.url;
                packageJsonChanged = true;
                trackChange(
                    `**package.json**: Corrected \`repository.url\` owner to \`${COMMUNITY_ADAPTERS_NAME}\``,
                    `**package.json**: URL-Owner in \`repository.url\` auf \`${COMMUNITY_ADAPTERS_NAME}\` korrigiert`
                );
            }
        }
    }

    if (packageJson.bugs) {
        if (typeof packageJson.bugs === 'string') {
            const result = correctGitHubOwnerInUrl(packageJson.bugs);
            if (result.changed) {
                console.log(`✔️ Corrected bugs owner from "${result.oldOwner}" to "${COMMUNITY_ADAPTERS_NAME}".`);
                packageJson.bugs = result.url;
                packageJsonChanged = true;
                trackChange(
                    `**package.json**: Corrected \`bugs\` URL owner to \`${COMMUNITY_ADAPTERS_NAME}\``,
                    `**package.json**: URL-Owner in \`bugs\` auf \`${COMMUNITY_ADAPTERS_NAME}\` korrigiert`
                );
            }
        } else if (typeof packageJson.bugs === 'object' && packageJson.bugs.url) {
            const result = correctGitHubOwnerInUrl(packageJson.bugs.url);
            if (result.changed) {
                console.log(`✔️ Corrected bugs.url owner from "${result.oldOwner}" to "${COMMUNITY_ADAPTERS_NAME}".`);
                packageJson.bugs.url = result.url;
                packageJsonChanged = true;
                trackChange(
                    `**package.json**: Corrected \`bugs.url\` owner to \`${COMMUNITY_ADAPTERS_NAME}\``,
                    `**package.json**: URL-Owner in \`bugs.url\` auf \`${COMMUNITY_ADAPTERS_NAME}\` korrigiert`
                );
            }
        }
    }

    // Reorder keys to place 'contributors' right after 'author'
    if (packageJsonChanged && packageJson.author) {
        const reordered = {};
        for (const key in packageJson) {
            if (key === 'contributors') continue;
            reordered[key] = packageJson[key];
            if (key === 'author' && packageJson.contributors) {
                reordered.contributors = packageJson.contributors;
            }
        }
        packageJson = reordered;
    }

    if (packageJsonChanged) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    }
}

/**
 * Compare two semantic version strings
 */
function compareVersions(v1, v2) {
    const cleanV1 = v1.match(/\d+(?:\.\d+)*/)?.[0] || '0';
    const cleanV2 = v2.match(/\d+(?:\.\d+)*/)?.[0] || '0';

    const parts1 = cleanV1.split('.').map(Number);
    const parts2 = cleanV2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
    }
    return 0;
}

function extractVersion(depString) {
    const match = depString.match(/\d+(?:\.\d+)*/);
    return match ? match[0] : null;
}

/**
 * Update io-package.json authors and dependencies
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

    let ioPackageChanged = false;

    if (!ioPackage.common) {
        ioPackage.common = {};
    }

    if (!Array.isArray(ioPackage.common.authors)) {
        ioPackage.common.authors = [];
    }

    // Convert author objects to string format
    for (let i = 0; i < ioPackage.common.authors.length; i++) {
        const author = ioPackage.common.authors[i];
        if (typeof author === 'object' && author !== null && author.name) {
            const authorString = personToString(author);
            ioPackage.common.authors[i] = authorString;
            console.log(`✔️ Converted author object to string: ${authorString}`);
            ioPackageChanged = true;
        }
    }

    const hasAuthor = ioPackage.common.authors.some(
        author => typeof author === 'string' && author.includes(COMMUNITY_ADAPTERS_NAME)
    );

    if (!hasAuthor) {
        ioPackage.common.authors.push(`${COMMUNITY_ADAPTERS_NAME} <${COMMUNITY_ADAPTERS_EMAIL}>`);
        console.log(`✔️ Added ${COMMUNITY_ADAPTERS_NAME} to authors in ${ioPackagePath}.`);
        ioPackageChanged = true;
        trackChange(
            `**io-package.json**: Added ${COMMUNITY_ADAPTERS_NAME} to the common.authors array`,
            `**io-package.json**: ${COMMUNITY_ADAPTERS_NAME} zum common.authors-Array hinzugefügt`
        );
    } else {
        console.log(`ⓘ ${COMMUNITY_ADAPTERS_NAME} already exists in authors.`);
    }

    const isOnlyWWW = ioPackage.common.onlyWWW === true;

    let jsControllerUpdated = false;
    let adminUpdated = false;

    if (!isOnlyWWW) {
        if (!ioPackage.common.dependencies) {
            ioPackage.common.dependencies = [];
        }

        let jsControllerDep = ioPackage.common.dependencies.find(
            dep => dep && typeof dep === 'object' && 'js-controller' in dep
        );

        if (!jsControllerDep) {
            ioPackage.common.dependencies.push({ 'js-controller': `>=${JS_CONTROLLER_VERSION}` });
            console.log(`✔️ Added js-controller dependency with version ${JS_CONTROLLER_VERSION}.`);
            jsControllerUpdated = true;
            ioPackageChanged = true;
        } else {
            const currentVersion = extractVersion(jsControllerDep['js-controller']);
            if (currentVersion && compareVersions(currentVersion, JS_CONTROLLER_VERSION) < 0) {
                jsControllerDep['js-controller'] = `>=${JS_CONTROLLER_VERSION}`;
                console.log(`✔️ Updated js-controller dependency from ${currentVersion} to ${JS_CONTROLLER_VERSION}.`);
                jsControllerUpdated = true;
                ioPackageChanged = true;
            } else {
                console.log(`ⓘ js-controller dependency is already at version ${currentVersion || 'unknown'}, no update needed.`);
            }
        }

        if (!ioPackage.common.globalDependencies) {
            ioPackage.common.globalDependencies = [];
        }

        let adminDep = ioPackage.common.globalDependencies.find(
            dep => dep && typeof dep === 'object' && 'admin' in dep
        );

        if (!adminDep) {
            ioPackage.common.globalDependencies.push({ 'admin': `>=${ADMIN_VERSION}` });
            console.log(`✔️ Added admin dependency with version ${ADMIN_VERSION}.`);
            adminUpdated = true;
            ioPackageChanged = true;
        } else {
            const currentVersion = extractVersion(adminDep['admin']);
            if (currentVersion && compareVersions(currentVersion, ADMIN_VERSION) < 0) {
                adminDep['admin'] = `>=${ADMIN_VERSION}`;
                console.log(`✔️ Updated admin dependency from ${currentVersion} to ${ADMIN_VERSION}.`);
                adminUpdated = true;
                ioPackageChanged = true;
            } else {
                console.log(`ⓘ admin dependency is already at version ${currentVersion || 'unknown'}, no update needed.`);
            }
        }
    }

    // Correct GitHub URLs to use iobroker-community-adapters as owner
    if (ioPackage.common.readme) {
        const result = correctGitHubOwnerInUrl(ioPackage.common.readme);
        if (result.changed) {
            console.log(`✔️ Corrected common.readme owner from "${result.oldOwner}" to "${COMMUNITY_ADAPTERS_NAME}".`);
            ioPackage.common.readme = result.url;
            ioPackageChanged = true;
            trackChange(
                `**io-package.json**: Corrected \`common.readme\` URL owner to \`${COMMUNITY_ADAPTERS_NAME}\``,
                `**io-package.json**: URL-Owner in \`common.readme\` auf \`${COMMUNITY_ADAPTERS_NAME}\` korrigiert`
            );
        }
    }

    if (jsControllerUpdated) {
        trackChange(
            `**io-package.json**: Updated js-controller minimum required version to >= ${JS_CONTROLLER_VERSION}`,
            `**io-package.json**: Mindestanforderung für js-controller auf >= ${JS_CONTROLLER_VERSION} aktualisiert`
        );
    }
    if (adminUpdated) {
        trackChange(
            `**io-package.json**: Updated admin minimum required version to >= ${ADMIN_VERSION}`,
            `**io-package.json**: Mindestanforderung für admin auf >= ${ADMIN_VERSION} aktualisiert`
        );
    }

    if (ioPackageChanged) {
        fs.writeFileSync(ioPackagePath, JSON.stringify(ioPackage, null, 2) + '\n', 'utf8');
        if (jsControllerUpdated || adminUpdated) {
            updateReadmeChangelog(jsControllerUpdated, adminUpdated);
        }
    }
}

/**
 * Create a version of content with HTML comments replaced by spaces for searching.
 */
function createSearchableContent(content) {
    return content.replace(/<!--[\s\S]*?-->/g, (match) => ' '.repeat(match.length));
}

/**
 * Update README.md changelog with dependency changes
 */
function updateReadmeChangelog(jsControllerUpdated, adminUpdated) {
    const readmePath = './README.md';

    if (!fs.existsSync(readmePath)) {
        console.log(`ⓘ ${readmePath} does not exist, skipping changelog update.`);
        return;
    }

    let content = fs.readFileSync(readmePath, 'utf8');

    let changelogEntries = [];
    if (jsControllerUpdated) {
        changelogEntries.push(`- (copilot) Adapter requires js-controller >= ${JS_CONTROLLER_VERSION} now`);
    }
    if (adminUpdated) {
        changelogEntries.push(`- (copilot) Adapter requires admin >= ${ADMIN_VERSION} now`);
    }

    if (changelogEntries.length === 0) return;

    const changelogText = changelogEntries.join('\n');

    const alreadyHasEntries = changelogEntries.every(entry => {
        const entryText = entry.replace(/^-\s*/, '').trim();
        return content.toLowerCase().includes(entryText.toLowerCase());
    });

    if (alreadyHasEntries) {
        console.log(`ⓘ Changelog entries already exist in ${readmePath}.`);
        return;
    }

    const changelogRegex = /^##\s+Changelog/im;
    const changelogMatch = content.match(changelogRegex);

    if (!changelogMatch) {
        console.log(`ⓘ Changelog section not found in ${readmePath}, skipping changelog update.`);
        return;
    }

    const changelogStart = changelogMatch.index + changelogMatch[0].length;
    const afterChangelog = content.substring(changelogStart);
    const afterChangelogSearchable = createSearchableContent(afterChangelog);

    const nextHeaderRegex = /^###\s+(.+)$/im;
    const nextHeaderMatch = afterChangelogSearchable.match(nextHeaderRegex);

    let updatedContent;

    if (!nextHeaderMatch) {
        const wipSection = `\n\n### **WORK IN PROGRESS**\n${changelogText}\n`;
        updatedContent = content.substring(0, changelogStart) + wipSection + afterChangelog;
        console.log(`✔️ Added new WORK IN PROGRESS section with changelog entries to ${readmePath}.`);
    } else {
        const headerText = nextHeaderMatch[1].trim();
        const isWipHeader = WIP_HEADER_REGEX.test(headerText);
        const headerPosition = nextHeaderMatch.index;
        const headerFullMatch = nextHeaderMatch[0];

        if (isWipHeader) {
            const insertPosition = changelogStart + headerPosition + headerFullMatch.length;
            updatedContent = content.substring(0, insertPosition) +
                '\n' + changelogText +
                content.substring(insertPosition);
            console.log(`✔️ Added changelog entries to existing WORK IN PROGRESS section in ${readmePath}.`);
        } else {
            const insertPosition = changelogStart + headerPosition;
            const wipSection = `\n### **WORK IN PROGRESS**\n${changelogText}\n\n`;
            updatedContent = content.substring(0, insertPosition) + wipSection + content.substring(insertPosition);
            console.log(`✔️ Added new WORK IN PROGRESS section before existing header "${headerText}" in ${readmePath}.`);
        }
    }

    fs.writeFileSync(readmePath, updatedContent, 'utf8');
}

/**
 * Create CHANGELOG_OLD.md if it doesn't exist
 */
function createChangelogOld() {
    const changelogOldPath = './CHANGELOG_OLD.md';

    if (fs.existsSync(changelogOldPath)) {
        console.log(`ⓘ ${changelogOldPath} already exists, skipping creation.`);
        return;
    }

    const content = '# Older changes\n';
    fs.writeFileSync(changelogOldPath, content, 'utf8');
    console.log(`✔️ Created ${changelogOldPath}.`);
    trackChange(
        `**CHANGELOG_OLD.md**: Created file for storing older changelog entries`,
        `**CHANGELOG_OLD.md**: Datei für ältere Changelog-Einträge erstellt`
    );
}

/**
 * Remove /.github/workflows/dependabot-auto-merge.yml.OLD if present
 */
function removeOldWorkflowFile() {
    const oldFilePath = '.github/workflows/dependabot-auto-merge.yml.OLD';

    if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log(`✔️ Removed ${oldFilePath}.`);
        trackChange(
            `**${oldFilePath}**: Removed obsolete .OLD workflow file`,
            `**${oldFilePath}**: Veraltete .OLD-Workflow-Datei entfernt`
        );
    } else {
        console.log(`ⓘ ${oldFilePath} does not exist, skipping removal.`);
    }
}

/**
 * Create .github/automerge-dependabot from example file if not present
 */
function setupAutoMergeConfig(exampleContent) {
    const configPath = '.github/automerge-dependabot';
    const githubDir = '.github';

    if (fs.existsSync(configPath)) {
        console.log(`ⓘ ${configPath} already exists, skipping creation.`);
        return;
    }

    if (!fs.existsSync(githubDir)) {
        fs.mkdirSync(githubDir, { recursive: true });
        console.log(`✔️ Created directory: ${githubDir}`);
    }

    fs.writeFileSync(configPath, exampleContent, 'utf8');
    console.log(`✔️ Created ${configPath}.`);
    trackChange(
        `**${configPath}**: Created auto-merge configuration file for Dependabot`,
        `**${configPath}**: Auto-Merge-Konfigurationsdatei für Dependabot erstellt`
    );
}

/**
 * Ensure a workflow file is identical to the given content (create or update)
 */
function ensureWorkflow(workflowPath, expectedContent) {
    const workflowsDir = path.dirname(workflowPath);

    if (!fs.existsSync(workflowsDir)) {
        fs.mkdirSync(workflowsDir, { recursive: true });
        console.log(`✔️ Created directory: ${workflowsDir}`);
    }

    if (fs.existsSync(workflowPath)) {
        const existing = fs.readFileSync(workflowPath, 'utf8');
        if (existing === expectedContent) {
            console.log(`ⓘ ${workflowPath} already matches expected content.`);
            return;
        }
        fs.writeFileSync(workflowPath, expectedContent, 'utf8');
        console.log(`✔️ Updated ${workflowPath}.`);
        trackChange(
            `**${workflowPath}**: Updated workflow to match the latest reference version`,
            `**${workflowPath}**: Workflow auf die neueste Referenzversion aktualisiert`
        );
    } else {
        fs.writeFileSync(workflowPath, expectedContent, 'utf8');
        console.log(`✔️ Created ${workflowPath}.`);
        trackChange(
            `**${workflowPath}**: Created workflow file`,
            `**${workflowPath}**: Workflow-Datei erstellt`
        );
    }
}

/**
 * Update PR body with dynamic content
 */
function updatePrBody() {
    const bodyFile = '.iobroker-pr-body.tmp';
    if (!fs.existsSync(bodyFile)) {
        console.log(`ⓘ ${bodyFile} not found - skipping PR body customization`);
        return;
    }

    let body = fs.readFileSync(bodyFile, 'utf8');

    const changesEN = appliedChanges.en.length > 0
        ? appliedChanges.en.map(c => `- ${c}`).join('\n')
        : '- No changes were applied.';

    const changesDE = appliedChanges.de.length > 0
        ? appliedChanges.de.map(c => `- ${c}`).join('\n')
        : '- Es wurden keine Änderungen vorgenommen.';

    // Build explanation sections based on what was actually changed
    const explanationParts = buildExplanations();

    body = body.replace('{{CHANGES_EN}}', changesEN);
    body = body.replace('{{CHANGES_DE}}', changesDE);
    body = body.replace('{{EXPLANATIONS_EN}}', explanationParts.en);
    body = body.replace('{{EXPLANATIONS_DE}}', explanationParts.de);

    fs.writeFileSync(bodyFile, body, 'utf8');
    console.log(`✔️ Updated PR body with dynamic content.`);
}

/**
 * Build explanation sections based on applied changes
 */
function buildExplanations() {
    const en = [];
    const de = [];

    const hasContributorChange = appliedChanges.en.some(c => c.includes('contributors') || c.includes('authors') || c.includes('LICENSE') || c.includes('README.md'));
    if (hasContributorChange) {
        en.push(`### Copyright and Attribution\n\nThese changes ensure proper attribution for the iobroker-community-adapters organization that maintains this adapter. The copyright lines added to README.md and LICENSE are required by the organization's governance policy.`);
        de.push(`### Copyright und Zuordnung\n\nDiese Änderungen stellen die korrekte Zuordnung für die iobroker-community-adapters Organisation sicher, die diesen Adapter pflegt. Die zu README.md und LICENSE hinzugefügten Copyright-Zeilen werden durch die Governance-Richtlinien der Organisation vorgeschrieben.`);
    }

    const hasDependencyChange = appliedChanges.en.some(c => c.includes('js-controller') || c.includes('admin'));
    if (hasDependencyChange) {
        en.push(`### Dependency Requirements\n\nMinimum version requirements for js-controller (>= ${JS_CONTROLLER_VERSION}) and/or admin (>= ${ADMIN_VERSION}) have been updated or added in io-package.json. These versions are required for compatibility with current ioBroker installations.`);
        de.push(`### Abhängigkeitsanforderungen\n\nMindestversionsanforderungen für js-controller (>= ${JS_CONTROLLER_VERSION}) und/oder admin (>= ${ADMIN_VERSION}) wurden in der io-package.json aktualisiert oder hinzugefügt. Diese Versionen sind für die Kompatibilität mit aktuellen ioBroker-Installationen erforderlich.`);
    }

    const hasReleaseScriptChange = appliedChanges.en.some(c => c.includes('release') && c.includes('script'));
    if (hasReleaseScriptChange) {
        en.push(`### npm Release Script\n\nThe \`release\` script in package.json has been normalized to use only \`release-script\` or \`release-script -y\`. Unsupported options have been removed to ensure compatibility with the standard release tooling.`);
        de.push(`### npm Release-Skript\n\nDas \`release\`-Skript in package.json wurde normalisiert, um nur \`release-script\` oder \`release-script -y\` zu verwenden. Nicht unterstützte Optionen wurden entfernt, um die Kompatibilität mit dem Standard-Release-Tooling sicherzustellen.`);
    }

    const hasAutomergeChange = appliedChanges.en.some(c => c.includes('automerge') || c.includes('auto-merge') || c.includes('automerge-dependabot') || c.includes('automerge-iobroker-bot'));
    if (hasAutomergeChange) {
        en.push(`### Auto-Merge Setup\n\nAuto-merge workflows and/or configuration have been created or updated. These ensure that Dependabot PRs and ioBroker-Bot PRs can be automatically merged once all required checks pass. The workflow files are kept in sync with the reference implementations maintained by iobroker-bot-orga.`);
        de.push(`### Auto-Merge-Setup\n\nAuto-Merge-Workflows und/oder -Konfigurationen wurden erstellt oder aktualisiert. Diese stellen sicher, dass Dependabot-PRs und ioBroker-Bot-PRs automatisch gemergt werden können, sobald alle erforderlichen Prüfungen bestanden sind. Die Workflow-Dateien werden mit den von iobroker-bot-orga gepflegten Referenzimplementierungen synchron gehalten.`);
    }

    const hasOldFileRemoval = appliedChanges.en.some(c => c.includes('.OLD'));
    if (hasOldFileRemoval) {
        en.push(`### Obsolete File Removal\n\nOld workflow files with \`.OLD\` extension have been removed. These files were previously renamed to prevent execution and are no longer needed.`);
        de.push(`### Entfernung veralteter Dateien\n\nAlte Workflow-Dateien mit \`.OLD\`-Erweiterung wurden entfernt. Diese Dateien wurden zuvor umbenannt, um ihre Ausführung zu verhindern, und werden nicht mehr benötigt.`);
    }

    const hasChangelogOld = appliedChanges.en.some(c => c.includes('CHANGELOG_OLD'));
    if (hasChangelogOld) {
        en.push(`### Changelog Management\n\nCHANGELOG_OLD.md has been created to store older changelog entries, keeping the main README.md changelog clean and focused on recent changes.`);
        de.push(`### Changelog-Verwaltung\n\nCHANGELOG_OLD.md wurde erstellt, um ältere Changelog-Einträge zu speichern und das Haupt-Changelog in README.md übersichtlich zu halten.`);
    }

    const hasUrlCorrection = appliedChanges.en.some(c => c.includes('URL owner') || c.includes('url owner'));
    if (hasUrlCorrection) {
        en.push(`### URL Owner Correction\n\nGitHub URLs in package.json and/or io-package.json have been updated to reference the \`iobroker-community-adapters\` organization. This ensures that links to the repository, homepage, bug tracker, and readme point to the correct location after the repository was transferred to iobroker-community-adapters.`);
        de.push(`### URL-Owner-Korrektur\n\nGitHub-URLs in package.json und/oder io-package.json wurden aktualisiert, um auf die Organisation \`iobroker-community-adapters\` zu verweisen. Dies stellt sicher, dass Links zum Repository, zur Homepage, zum Bug-Tracker und zur Readme-Datei nach der Übertragung des Repositories zu iobroker-community-adapters auf den korrekten Ort zeigen.`);
    }

    return {
        en: en.length > 0 ? en.join('\n\n') : 'No additional explanations.',
        de: de.length > 0 ? de.join('\n\n') : 'Keine weiteren Erläuterungen.'
    };
}

/**
 * Main async entry point
 */
async function main() {
    // Fetch example files from GitHub at runtime
    console.log('ⓘ Fetching reference files from GitHub...');

    let autoMergeConfigContent;
    let automergeDependabotWorkflowContent;
    let automergeIobrokerBotWorkflowContent;

    try {
        autoMergeConfigContent = await fetchUrl(AUTO_MERGE_CONFIG_URL);
        console.log(`✔️ Fetched auto-merge config example.`);
    } catch (err) {
        console.error(`❌ Failed to fetch ${AUTO_MERGE_CONFIG_URL}: ${err.message}`);
        process.exit(1);
    }

    try {
        automergeDependabotWorkflowContent = await fetchUrl(AUTOMERGE_DEPENDABOT_WORKFLOW_URL);
        console.log(`✔️ Fetched automerge-dependabot workflow example.`);
    } catch (err) {
        console.error(`❌ Failed to fetch ${AUTOMERGE_DEPENDABOT_WORKFLOW_URL}: ${err.message}`);
        process.exit(1);
    }

    try {
        automergeIobrokerBotWorkflowContent = await fetchUrl(AUTOMERGE_IOBROKER_BOT_WORKFLOW_URL);
        console.log(`✔️ Fetched automerge-iobroker-bot workflow example.`);
    } catch (err) {
        console.error(`❌ Failed to fetch ${AUTOMERGE_IOBROKER_BOT_WORKFLOW_URL}: ${err.message}`);
        process.exit(1);
    }

    // Execute all updates
    updateReadme();
    updateLicense();
    updatePackageJson();
    updateIoPackageJson();
    createChangelogOld();
    removeOldWorkflowFile();
    setupAutoMergeConfig(autoMergeConfigContent);
    ensureWorkflow('.github/workflows/automerge-dependabot.yml', automergeDependabotWorkflowContent);
    ensureWorkflow('.github/workflows/automerge-iobroker-bot.yml', automergeIobrokerBotWorkflowContent);

    if (appliedChanges.en.length === 0) {
        console.log(`ⓘ No changes were made. All entries already exist.`);
    }

    updatePrBody();

    console.log(`✔️ processing completed`);
    process.exit(0);
}

main().catch(err => {
    console.error(`❌ Fatal error: ${err.message}`);
    process.exit(1);
});

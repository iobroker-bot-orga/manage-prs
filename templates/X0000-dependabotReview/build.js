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

// Check if dependabot.yml exists
const dependabotPath = '.github/dependabot.yml';
if (!fs.existsSync(dependabotPath)) {
    console.log('ⓘ No dependabot.yml found - skipping this repository');
    process.exit(0);
}

console.log(`✔️ ${dependabotPath} exists.`);

// Read and parse dependabot.yml using parseDocument to preserve comments.
// Existing comments must never be added, changed or removed by this template.
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

// ---------------------------------------------------------------------------
// Change tracking - each flag is only set when a real modification is applied.
// The PR body (description.md) lists exactly the corrections really performed.
// ---------------------------------------------------------------------------
const applied = {
    schedule: false,  // (1) randomized/unified cron schedule
    limit: false,     // (2) open-pull-requests-limit raised to >= 15
    timezone: false,  // (3) timezone set to Europe/Berlin
    multiDir: false,  // (4) directory '/' -> directories array
    syntax: false,    // (5) invalid directories string -> array
    quotes: false,    // string values normalized to single quotes
};

/**
 * Create a single-quoted scalar node for a string value.
 * @param {string} value - String value to wrap
 * @returns {*} Scalar node serialized with single quotes
 */
function singleQuotedScalar(value) {
    const node = doc.createNode(value);
    node.type = 'QUOTE_SINGLE';
    return node;
}

// ---------------------------------------------------------------------------
// Determine a single common cron value to be shared by all cron schedules.
// If exactly one cron value is already in use it is reused (avoids churn);
// otherwise a randomized value is generated once and applied everywhere.
// ---------------------------------------------------------------------------
const existingCronValues = new Set();
for (const update of updatesNode.items) {
    const sched = update.get('schedule', /* keepNode */ true);
    if (sched && sched.get && sched.get('interval') === 'cron') {
        const cronjob = sched.get('cronjob');
        if (cronjob) {
            existingCronValues.add(cronjob);
        }
    }
}

let targetCron;
if (existingCronValues.size === 1) {
    targetCron = [...existingCronValues][0];
    console.log(`ⓘ Reusing existing cron value for all schedules: ${targetCron}`);
} else {
    // Random day-of-month (2-28) and random time (1:00-3:59)
    const randomDay = Math.floor(Math.random() * 27) + 2; // 2 to 28
    const randomHour = Math.floor(Math.random() * 3) + 1; // 1 to 3
    const randomMinute = Math.floor(Math.random() * 60); // 0 to 59
    targetCron = `${randomMinute} ${randomHour} ${randomDay} * *`;
    console.log(`ⓘ Generated common cron value for all schedules: ${targetCron}`);
}

// ---------------------------------------------------------------------------
// Detect multiple package.json files (for multi-directory handling)
// ---------------------------------------------------------------------------
const hasMultiplePackageJson = findPackageJsonFiles('.').length > 1;
if (hasMultiplePackageJson) {
    console.log('✔️ Multiple package.json files detected in repository');
}
const npmBlocks = updatesNode.items.filter(u => u.get('package-ecosystem') === 'npm');
const shouldUpdateNpmDirectories = hasMultiplePackageJson && npmBlocks.length === 1;

// ---------------------------------------------------------------------------
// Process each update block
// ---------------------------------------------------------------------------
for (let index = 0; index < updatesNode.items.length; index++) {
    const update = updatesNode.items[index];
    const ecosystem = update.get('package-ecosystem');
    console.log(`\nⓘ Processing update block ${index + 1}: ${ecosystem}`);

    const sched = update.get('schedule', /* keepNode */ true);
    if (sched && sched.get) {
        const interval = sched.get('interval');

        // (1) Convert monthly schedules to a randomized cron schedule
        if (interval === 'monthly') {
            console.log('✔️ Converting monthly schedule to cron');
            sched.set('interval', singleQuotedScalar('cron'));
            sched.set('cronjob', singleQuotedScalar(targetCron));
            if (sched.has('day')) {
                sched.delete('day');
            }
            if (sched.has('time')) {
                sched.delete('time');
            }
            applied.schedule = true;
        } else if (interval === 'cron') {
            // (1) Unify all cron schedules to the same value
            if (sched.get('cronjob') !== targetCron) {
                console.log(`✔️ Unifying cron value to ${targetCron}`);
                sched.set('cronjob', singleQuotedScalar(targetCron));
                applied.schedule = true;
            }
            if (sched.has('day')) {
                sched.delete('day');
                applied.schedule = true;
            }
            if (sched.has('time')) {
                sched.delete('time');
                applied.schedule = true;
            }
        }

        // (3) Ensure timezone is set to Europe/Berlin for every schedule
        if (sched.get('timezone') !== 'Europe/Berlin') {
            console.log('✔️ Setting timezone to Europe/Berlin');
            sched.set('timezone', singleQuotedScalar('Europe/Berlin'));
            applied.timezone = true;
        }
    }

    // (2) Ensure open-pull-requests-limit is at least 15
    const currentLimit = update.get('open-pull-requests-limit');
    if (currentLimit === undefined || currentLimit === null || currentLimit < 15) {
        const oldLimit = (currentLimit === undefined || currentLimit === null) ? 'default (5)' : currentLimit;
        update.set('open-pull-requests-limit', 15);
        console.log(`✔️ Updated open-pull-requests-limit from ${oldLimit} to 15`);
        applied.limit = true;
    } else {
        console.log(`ⓘ open-pull-requests-limit is ${currentLimit}, no change needed`);
    }

    // (4) Multi-directory support: directory '/' -> directories array
    if (shouldUpdateNpmDirectories && ecosystem === 'npm' && update.get('directory') === '/') {
        console.log('✔️ Replacing directory: \'/\' with directories array');
        update.delete('directory');
        const dirs = doc.createNode([]);
        dirs.add(singleQuotedScalar('**/*'));
        update.set('directories', dirs);
        applied.multiDir = true;
    }

    // (5) Fix invalid directories string syntax -> array
    const directoriesVal = update.get('directories');
    if (typeof directoriesVal === 'string') {
        console.log('✔️ Converting directories from string to array format');
        const dirs = doc.createNode([]);
        dirs.add(singleQuotedScalar(directoriesVal));
        update.set('directories', dirs);
        applied.syntax = true;
    }
}

// ---------------------------------------------------------------------------
// Detect pre-existing double quoted strings (created nodes are QUOTE_SINGLE).
// ---------------------------------------------------------------------------
let hadDoubleQuotes = false;
YAML.visit(doc, {
    Scalar(key, node) {
        if (node.type === 'QUOTE_DOUBLE') {
            hadDoubleQuotes = true;
        }
    },
});
applied.quotes = hadDoubleQuotes;

const anyChange = applied.schedule || applied.limit || applied.timezone || applied.multiDir || applied.syntax || applied.quotes;

if (!anyChange) {
    console.log('\nⓘ No changes required - dependabot.yml already matches the desired setup.');
    console.log('ⓘ No PR will be created (comment-only or whitespace-only differences are ignored).');
    process.exit(0);
}

// Normalize all double quoted strings to single quotes.
YAML.visit(doc, {
    Scalar(key, node) {
        if (node.type === 'QUOTE_DOUBLE') {
            node.type = 'QUOTE_SINGLE';
        }
    },
});

// Write updated dependabot.yml - doc.toString() preserves all existing comments.
fs.writeFileSync(dependabotPath, doc.toString(), 'utf8');
console.log(`\n✔️ ${dependabotPath} updated successfully.`);

// ---------------------------------------------------------------------------
// Update the PR body so it only lists the corrections really performed.
// ---------------------------------------------------------------------------
updatePrBody(applied);

console.log(`\n✔️ processing completed (template: ${templateName}, repository: ${repositoryName})`);

process.exit(0);

/**
 * Recursively find all package.json files in a directory.
 * @param {string} dir - Directory to search
 * @returns {string[]} - Array of package.json file paths
 */
function findPackageJsonFiles(dir) {
    const results = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
                results.push(...findPackageJsonFiles(fullPath));
            } else if (entry.isFile() && entry.name === 'package.json') {
                results.push(fullPath);
            }
        }
    } catch (e) {
        // Ignore errors from directories we can't read
    }
    return results;
}

/**
 * Replace the {{CHANGES_EN}} / {{CHANGES_DE}} placeholders in the generated
 * PR body file with the list of corrections that were really applied.
 * @param {Object} appliedChanges - Flags describing the applied corrections
 */
function updatePrBody(appliedChanges) {
    const bodyFile = '.iobroker-pr-body.tmp';
    if (!fs.existsSync(bodyFile)) {
        console.log(`ⓘ ${bodyFile} not found - skipping PR body customization`);
        return;
    }

    const items = [
        {
            flag: 'schedule',
            en: '**Randomized Monthly Schedule**: Converts monthly schedules from `interval: monthly` to `interval: cron` with a randomized execution time. The job will now run once a month on a random day (between the 2nd and 28th) at a random time (between 1:00 and 4:00), spreading the load across GitHub systems. All cron schedules use the same execution time.',
            de: '**Randomisierter monatlicher Zeitplan**: Die monatlichen Zeitpläne werden von `interval: monthly` auf `interval: cron` mit einer zufälligen Ausführungszeit umgestellt. Der Job wird nun einmal im Monat an einem zufälligen Tag (zwischen dem 2. und 28.) zu einer zufälligen Uhrzeit (zwischen 1:00 und 4:00 Uhr) ausgeführt, wodurch die Last auf die GitHub-Systeme verteilt wird. Alle Cron-Zeitpläne verwenden denselben Ausführungszeitpunkt.',
        },
        {
            flag: 'limit',
            en: '**Increased Pull Request Limit**: Sets the `open-pull-requests-limit` to a minimum of 15 (up from the default of 5). This ensures that more dependency updates can be processed simultaneously without blocking critical updates.',
            de: '**Erhöhtes Pull-Request-Limit**: Das `open-pull-requests-limit` wird auf mindestens 15 gesetzt (statt dem Standard von 5). Dies stellt sicher, dass mehr Abhängigkeits-Updates gleichzeitig verarbeitet werden können, ohne kritische Updates zu blockieren.',
        },
        {
            flag: 'timezone',
            en: '**Timezone Configuration**: Ensures all schedules use `timezone: Europe/Berlin` for consistent timing.',
            de: '**Zeitzonenkonfiguration**: Alle Zeitpläne verwenden `timezone: Europe/Berlin` für eine konsistente Zeitplanung.',
        },
        {
            flag: 'multiDir',
            en: '**Multi-directory Support**: Multiple `package.json` files were detected in the repository, so the configuration for npm packages was updated to use correct YAML array syntax for the `directories` field instead of `directory: "/"` to properly scan all subdirectories. The correct format is:\n   ```yaml\n   directories:\n     - \'**/*\'\n   ```',
            de: '**Unterstützung mehrerer Verzeichnisse**: Es wurden mehrere `package.json`-Dateien im Repository erkannt, daher wurde die Konfiguration für npm-Pakete aktualisiert, um die korrekte YAML-Array-Syntax für das `directories`-Feld anstelle von `directory: "/"` zu verwenden, damit alle Unterverzeichnisse ordnungsgemäß gescannt werden. Das korrekte Format ist:\n   ```yaml\n   directories:\n     - \'**/*\'\n   ```',
        },
        {
            flag: 'syntax',
            en: '**Syntax Correction**: Corrects existing invalid `directories: "**/*"` string syntax to the proper YAML array format. The incorrect string syntax is not supported by GitHub Dependabot and must be an array.',
            de: '**Syntaxkorrektur**: Vorhandene ungültige `directories: "**/*"` String-Syntax wurde in das richtige YAML-Array-Format korrigiert. Die falsche String-Syntax wird von GitHub Dependabot nicht unterstützt und muss ein Array sein.',
        },
        {
            flag: 'quotes',
            en: '**Single Quote Normalization**: Normalizes all quoted string values in the configuration to use single quotes instead of double quotes. Double quotes are known to make Dependabot fail in some situations (for example when a value contains characters that YAML interprets inside double-quoted strings), so single quotes are used to keep the configuration robust.',
            de: '**Normalisierung einfacher Anführungszeichen**: Alle in Anführungszeichen gesetzten Zeichenketten in der Konfiguration werden auf einfache statt doppelte Anführungszeichen umgestellt. Doppelte Anführungszeichen führen in einigen Situationen bekanntermaßen dazu, dass Dependabot fehlschlägt (zum Beispiel wenn ein Wert Zeichen enthält, die YAML innerhalb doppelt gequoteter Zeichenketten interpretiert), daher werden einfache Anführungszeichen verwendet, um die Konfiguration robust zu halten.',
        },
    ];

    const enList = [];
    const deList = [];
    for (const item of items) {
        if (appliedChanges[item.flag]) {
            enList.push(item.en);
            deList.push(item.de);
        }
    }

    const numbered = list => list.map((text, i) => `${i + 1}. ${text}`).join('\n\n');

    let body = fs.readFileSync(bodyFile, 'utf8');
    body = body.replace('{{CHANGES_EN}}', numbered(enList));
    body = body.replace('{{CHANGES_DE}}', numbered(deList));
    fs.writeFileSync(bodyFile, body, 'utf8');
    console.log(`✔️ PR body updated with ${enList.length} applied correction(s)`);
}

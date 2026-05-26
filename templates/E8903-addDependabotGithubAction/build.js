'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

const DEFAULT_CRONJOB = '44 2 9 * *';
const PR_BODY_FILE = '.iobroker-pr-body.tmp';
const DEPENDABOT_PATH = '.github/dependabot.yml';
const ENGLISH_PLACEHOLDER = '__ENGLISH_CHANGE_DETAILS__';
const GERMAN_PLACEHOLDER = '__GERMAN_CHANGE_DETAILS__';

const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

function createCronjobWithRandomDay(baseCronjob = DEFAULT_CRONJOB) {
    const cronParts = baseCronjob.trim().split(/\s+/);

    if (cronParts.length !== 5) {
        return baseCronjob;
    }

    const randomDay = String(Math.floor(Math.random() * 27) + 2);
    cronParts[2] = randomDay;

    return cronParts.join(' ');
}

function applySingleQuotes(node) {
    YAML.visit(node, {
        Scalar(key, item) {
            if (key !== 'key' && typeof item.value === 'string') {
                item.type = 'QUOTE_SINGLE';
            }
        },
    });
}

function buildGithubActionsUpdateNode(doc, cronjob) {
    const node = doc.createNode({
        'package-ecosystem': 'github-actions',
        directory: '/',
        schedule: {
            interval: 'cron',
            timezone: 'Europe/Berlin',
            cronjob,
        },
        'open-pull-requests-limit': 15,
    });

    applySingleQuotes(node);
    return node;
}

function updatePrBody(englishText, germanText) {
    const prBodyPath = path.join(process.cwd(), PR_BODY_FILE);

    if (!fs.existsSync(prBodyPath)) {
        return;
    }

    let prBody = fs.readFileSync(prBodyPath, 'utf8');
    prBody = prBody.replace(ENGLISH_PLACEHOLDER, englishText);
    prBody = prBody.replace(GERMAN_PLACEHOLDER, germanText);
    fs.writeFileSync(prBodyPath, prBody, 'utf8');
    console.log(`✔️ Updated PR body file: ${prBodyPath}`);
}

function getCreateFileDescriptions() {
    return {
        english: [
            'This PR creates a new Dependabot configuration file at `.github/dependabot.yml`.',
            'Dependabot checks the configured GitHub Actions workflows and npm dependencies on the defined schedule and opens pull requests when updates are available.',
            'The new file uses one shared cron schedule for all update blocks, limits the number of open Dependabot PRs, and includes the npm settings already required for ioBroker repositories.',
        ].join(' '),
        german: [
            'Dieser PR erstellt die neue Dependabot-Konfigurationsdatei `.github/dependabot.yml`.',
            'Dependabot prüft die konfigurierten GitHub-Actions-Workflows und npm-Abhängigkeiten nach dem festgelegten Zeitplan und erstellt bei verfügbaren Aktualisierungen Pull Requests.',
            'Die neue Datei verwendet für alle Update-Blöcke denselben Cron-Zeitplan, begrenzt die Anzahl offener Dependabot-PRs und enthält die für ioBroker-Repositories bereits benötigten npm-Einstellungen.',
        ].join(' '),
    };
}

function getAddBlockDescriptions() {
    const issueText = '[E8903] Dependabot configuration "/.github/dependabot.yml" has no entry with "package-ecosystem: github-actions". Please add one.';

    return {
        english: [
            'This PR adds a missing `github-actions` block to `.github/dependabot.yml`.',
            `It fixes issue '${issueText}' raised by repository checker.`,
            'The new block reuses the existing Dependabot cron schedule from the file when available.',
        ].join(' '),
        german: [
            'Dieser PR ergänzt einen fehlenden `github-actions`-Block in `.github/dependabot.yml`.',
            `Damit wird das vom Repository Checker gemeldete Issue '${issueText}' behoben.`,
            'Der neue Block verwendet, falls vorhanden, den bereits in der Datei verwendeten Dependabot-Cron-Zeitplan weiter.',
        ].join(' '),
    };
}

function createDependabotFile(filePath, cronjob) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    const content = [
        '# Dependabot configuration',
        '',
        'version: 2',
        'updates:',
        '',
        "  - package-ecosystem: 'github-actions'",
        "    directory: '/'",
        '    schedule:',
        "      interval: 'cron'",
        "      timezone: 'Europe/Berlin'",
        `      cronjob: '${cronjob}'`,
        '    open-pull-requests-limit: 15',
        '',
        "  - package-ecosystem: 'npm'",
        '    directories:',
        "      - '**/*'",
        '    schedule:',
        "      interval: 'cron'",
        "      timezone: 'Europe/Berlin'",
        `      cronjob: '${cronjob}'`,
        '    open-pull-requests-limit: 20',
        "    versioning-strategy: 'increase'",
        '    cooldown:',
        '      default-days: 7',
        '    ignore:',
        "      - dependency-name: '@types/node'",
        '        update-types:',
        "          - 'version-update:semver-major'",
        '',
    ].join('\n');

    fs.writeFileSync(filePath, content, 'utf8');
}

if (!fs.existsSync(DEPENDABOT_PATH)) {
    const cronjob = createCronjobWithRandomDay();
    createDependabotFile(DEPENDABOT_PATH, cronjob);
    console.log(`✔️ ${DEPENDABOT_PATH} created successfully with cronjob '${cronjob}'.`);

    const descriptions = getCreateFileDescriptions();
    updatePrBody(descriptions.english, descriptions.german);

    console.log(`✔️ processing completed (template: ${templateName}, repository: ${repositoryName}, parameters: ${parameterData})`);
    process.exit(0);
}

console.log(`✔️ ${DEPENDABOT_PATH} exists.`);

const dependabotContent = fs.readFileSync(DEPENDABOT_PATH, 'utf8');
let doc;

try {
    doc = YAML.parseDocument(dependabotContent);
} catch (error) {
    console.error(`❌ Error parsing ${DEPENDABOT_PATH}: ${error.message}`);
    process.exit(1);
}

if (doc.errors && doc.errors.length > 0) {
    console.error(`❌ Error parsing ${DEPENDABOT_PATH}: ${doc.errors[0].message}`);
    process.exit(1);
}

if (!doc.contents) {
    doc.contents = doc.createNode({});
}

if (!YAML.isMap(doc.contents)) {
    console.error(`❌ ${DEPENDABOT_PATH} must contain a YAML mapping at the root.`);
    process.exit(1);
}

const rootNode = doc.contents;
let updatesNode = rootNode.get('updates', true);

if (!updatesNode) {
    rootNode.set('updates', doc.createNode([]));
    updatesNode = rootNode.get('updates', true);
    console.log('✔️ Added missing updates section.');
}

if (!YAML.isSeq(updatesNode)) {
    console.error(`❌ The 'updates' section in ${DEPENDABOT_PATH} must be a YAML sequence.`);
    process.exit(1);
}

const hasGithubActionsBlock = updatesNode.items.some((updateNode) => updateNode.get('package-ecosystem') === 'github-actions');

if (hasGithubActionsBlock) {
    console.log(`ⓘ ${DEPENDABOT_PATH} already contains a github-actions block - nothing to do.`);
    console.log(`✔️ processing completed (template: ${templateName}, repository: ${repositoryName}, parameters: ${parameterData})`);
    process.exit(0);
}

const existingCronjob = updatesNode.items
    .map((updateNode) => updateNode.get('schedule', true))
    .filter(Boolean)
    .map((scheduleNode) => scheduleNode.get('cronjob'))
    .find((value) => typeof value === 'string' && value.trim() !== '');

const cronjob = existingCronjob || createCronjobWithRandomDay();

if (!rootNode.has('version')) {
    rootNode.set('version', 2);
    console.log('✔️ Added missing version: 2.');
}

updatesNode.add(buildGithubActionsUpdateNode(doc, cronjob));
fs.writeFileSync(DEPENDABOT_PATH, doc.toString(), 'utf8');
console.log(`✔️ Added github-actions block to ${DEPENDABOT_PATH} with cronjob '${cronjob}'.`);

const descriptions = getAddBlockDescriptions();
updatePrBody(descriptions.english, descriptions.german);

console.log(`✔️ processing completed (template: ${templateName}, repository: ${repositoryName}, parameters: ${parameterData})`);
process.exit(0);

'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const buildScript = path.join(__dirname, '../templates/X0000-sanitizeCommunityAdapters/build.js');

function runTemplate({ packageJson, ioPackage, readme, license, changelogOld, oldWorkflow }) {
    const repository = fs.mkdtempSync(path.join(os.tmpdir(), 'sanitize-community-'));
    fs.writeFileSync(path.join(repository, 'package.json'), JSON.stringify(packageJson, null, 2));
    fs.writeFileSync(path.join(repository, 'io-package.json'), JSON.stringify(ioPackage, null, 2));
    fs.writeFileSync(path.join(repository, 'README.md'), readme);
    fs.writeFileSync(path.join(repository, 'LICENSE'), license);
    fs.writeFileSync(path.join(repository, '.iobroker-pr-body.tmp'), [
        '__CHANGES_SUMMARY_EN__',
        '__CHANGES_EXPLANATION_EN__',
        '__CHANGES_SUMMARY_DE__',
        '__CHANGES_EXPLANATION_DE__',
    ].join('\n'));

    if (changelogOld) fs.writeFileSync(path.join(repository, 'CHANGELOG_OLD.md'), changelogOld);
    if (oldWorkflow) {
        const workflowPath = path.join(repository, '.github/workflows/dependabot-auto-merge.yml.OLD');
        fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
        fs.writeFileSync(workflowPath, 'obsolete');
    }

    const result = spawnSync(process.execPath, [buildScript, 'X0000-sanitizeCommunityAdapters', 'owner/repo'], {
        cwd: repository,
        encoding: 'utf8',
    });

    return {
        repository,
        result,
        read(relativePath) {
            return fs.readFileSync(path.join(repository, relativePath), 'utf8');
        },
        has(relativePath) {
            return fs.existsSync(path.join(repository, relativePath));
        },
    };
}

function baseOptions(release, { changelogOld, oldWorkflow } = {}) {
    return {
        packageJson: { scripts: { release } },
        ioPackage: { common: { authors: [], dependencies: [], globalDependencies: [] } },
        readme: '# Adapter\n\n## License\n\nCopyright (c) Existing\n',
        license: 'Copyright (c) Existing\nLicense text\n',
        changelogOld,
        oldWorkflow,
    };
}

test('normalizes the release command, removes the obsolete workflow, and preserves copyright hard breaks', () => {
    const run = runTemplate({
        ...baseOptions('release-script --foo -y --bar', { oldWorkflow: true }),
    });

    assert.equal(run.result.status, 0, run.result.stderr);
    assert.equal(JSON.parse(run.read('package.json')).scripts.release, 'release-script -y');
    assert.equal(run.has('.github/workflows/dependabot-auto-merge.yml.OLD'), false);
    assert.match(run.read('README.md'), /Copyright \(c\) 2026 iobroker-community-adapters <iobroker-community-adapters@gmx\.de>  \n/);
    assert.match(run.read('LICENSE'), /^Copyright \(c\) 2026 iobroker-community-adapters <iobroker-community-adapters@gmx\.de>  \n/);
});

test('adds the release command when package.json does not define one', () => {
    const run = runTemplate(baseOptions(undefined));

    assert.equal(run.result.status, 0, run.result.stderr);
    assert.equal(JSON.parse(run.read('package.json')).scripts.release, 'release-script');
});

test('description lists only applied changes and updates both languages', () => {
    const run = runTemplate(baseOptions('release-script --foo'));

    assert.equal(run.result.status, 0, run.result.stderr);
    const body = run.read('.iobroker-pr-body.tmp');
    assert.match(body, /release-script`/);
    assert.match(body, /admin minimum version `>=8\.3\.5`/);
    assert.match(body, /js-controller minimum version `>=7\.2\.5`/);
    assert.match(body, /Created CHANGELOG_OLD\.md/);
    assert.match(body, /Der npm-Befehl/);
    assert.match(body, /Mindestversion von admin `>=8\.3\.5`/);
    assert.doesNotMatch(body, /__CHANGES_/);
});

test('does not claim unchanged release scripts or an existing CHANGELOG_OLD.md', () => {
    const run = runTemplate(baseOptions('release-script', { changelogOld: '# Older changes\n' }));

    assert.equal(run.result.status, 0, run.result.stderr);
    const body = run.read('.iobroker-pr-body.tmp');
    assert.doesNotMatch(body, /release command/);
    assert.doesNotMatch(body, /Der npm-Befehl/);
    assert.doesNotMatch(body, /CHANGELOG_OLD\.md/);
    assert.doesNotMatch(body, /dependabot-auto-merge\.yml\.OLD/);
});

test('describes dependency increases with the required versions in both languages', () => {
    const options = baseOptions('release-script', { changelogOld: '# Older changes\n' });
    options.packageJson.contributors = ['iobroker-community-adapters'];
    options.ioPackage.common = {
        authors: ['iobroker-community-adapters'],
        dependencies: [{ 'js-controller': '>=6.0.0' }],
        globalDependencies: [{ admin: '>=7.0.0' }],
    };
    options.readme += 'Copyright (c) 2026 iobroker-community-adapters\n';
    options.license += 'Copyright (c) 2026 iobroker-community-adapters\n';
    const run = runTemplate(options);

    assert.equal(run.result.status, 0, run.result.stderr);
    const body = run.read('.iobroker-pr-body.tmp');
    assert.match(body, /js-controller minimum version from `6\.0\.0` to `>=7\.2\.5`/);
    assert.match(body, /admin minimum version from `7\.0\.0` to `>=8\.3\.5`/);
    assert.match(body, /js-controller-Mindestversion wurde von `6\.0\.0` auf `>=7\.2\.5` angehoben/);
    assert.match(body, /admin-Mindestversion wurde von `7\.0\.0` auf `>=8\.3\.5` angehoben/);
    assert.doesNotMatch(body, /Copyright-Zeile|Contributor-Angaben|CHANGELOG_OLD\.md/);
});

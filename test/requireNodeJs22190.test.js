'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const buildScript = path.join(__dirname, '../templates/X0000-requireNodeJs_22_19_0/build.js');
const descriptionPath = path.join(__dirname, '../templates/X0000-requireNodeJs_22_19_0/description.md');

test('includes the standard bilingual general information in the PR description', () => {
    const description = fs.readFileSync(descriptionPath, 'utf8');

    assert.match(description, /## General information/);
    assert.match(description, /And \*\*THANKS A LOT\*\* for maintaining this adapter/);
    assert.match(description, /## Deutsche Beschreibung\n\n### Allgemeine Informationen/);
    assert.match(description, /Und \*\*VIELEN DANK\*\* für die Wartung dieses Adapters/);
});

function runTemplate(enginesNode, workflow, packageJson = { engines: { node: enginesNode } }, readme) {
    const repository = fs.mkdtempSync(path.join(os.tmpdir(), 'require-node-'));
    fs.writeFileSync(path.join(repository, 'package.json'), JSON.stringify(packageJson, null, 2));
    fs.writeFileSync(path.join(repository, '.iobroker-pr-title.tmp'), 'placeholder title');
    fs.writeFileSync(path.join(repository, '.iobroker-pr-body.tmp'), [
        '__CHANGES_SUMMARY_EN__',
        '__CHANGES_SUMMARY_DE__',
        '__REQUIRED_NODE_VERSION__',
    ].join('\n'));

    if (workflow !== null) {
        const workflowPath = path.join(repository, '.github/workflows/test-and-release.yml');
        fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
        fs.writeFileSync(workflowPath, workflow);
    }
    if (readme !== undefined) {
        fs.writeFileSync(path.join(repository, 'README.md'), readme);
    }

    const result = spawnSync(process.execPath, [buildScript, 'template', 'owner/repo'], {
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

test('updates engines, job versions, matrices, title, and bilingual summaries', () => {
    const workflow = [
        'name: test',
        'jobs:',
        '  check:',
        '    steps:',
        '      - uses: actions/setup-node@v4',
        '        with:',
        '          node-version: 20.10.0',
        '  inline:',
        '    strategy:',
        '      matrix:',
        '        node-version: [18.x, 20.x, 24.x]',
        '  multiline:',
        '    strategy:',
        '      matrix:',
        '        node-version:',
        '          - 20.x',
        '          - 24.x',
        '',
    ].join('\n');
    const run = runTemplate('>=20.0.0', workflow);

    assert.equal(run.result.status, 0, run.result.stderr);
    assert.match(run.read('package.json'), /"node": ">=22\.19\.0"/);
    assert.match(run.read('.github/workflows/test-and-release.yml'), /node-version: '22\.x'/);
    assert.match(run.read('.github/workflows/test-and-release.yml'), /node-version: \[24\.x, 22\.x\]/);
    assert.match(run.read('.github/workflows/test-and-release.yml'), /- 24\.x\n          - 22\.x/);
    assert.equal(run.read('.iobroker-pr-title.tmp'), 'Require at least node.js 22.19.0');
    const body = run.read('.iobroker-pr-body.tmp');
    assert.match(body, /Updated the `engines\.node` requirement/);
    assert.match(body, /Die `engines\.node`-Anforderung/);
    assert.match(body, /from `20\.10\.0` to `22\.x`/);
    assert.match(body, /von `20\.10\.0` auf `22\.x`/);
    assert.match(body, /Updated a Node\.js matrix/);
    assert.match(body, /Eine Node\.js-Matrix/);
    assert.match(body, /22\.19\.0/);
});

test('adds the Node.js requirement to the existing README work-in-progress changelog', () => {
    const readme = '# Adapter\n\n## Changelog\n\n### **WORK IN PROGRESS**\n- Existing entry\n';
    const run = runTemplate('>=20.0.0', null, undefined, readme);

    assert.equal(run.result.status, 0, run.result.stderr);
    assert.match(
        run.read('README.md'),
        /### \*\*WORK IN PROGRESS\*\*\n- \(copilot\) Adapter requires node\.js >= 22\.19\.0 now\n- Existing entry/,
    );
});

test('adds a line break before the entry when the README ends at the work-in-progress header', () => {
    const readme = '# Adapter\n\n## Changelog\n\n### **WORK IN PROGRESS**';
    const run = runTemplate('>=20.0.0', null, undefined, readme);

    assert.equal(run.result.status, 0, run.result.stderr);
    assert.match(
        run.read('README.md'),
        /### \*\*WORK IN PROGRESS\*\*\n- \(copilot\) Adapter requires node\.js >= 22\.19\.0 now/,
    );
});

test('creates the work-in-progress header in an existing Changelog section', () => {
    const readme = '# Adapter\n\n## Changelog\n\n### 1.0.0\n- Released\n';
    const run = runTemplate('>=20.0.0', null, undefined, readme);

    assert.equal(run.result.status, 0, run.result.stderr);
    assert.match(
        run.read('README.md'),
        /## Changelog\n\n### \*\*WORK IN PROGRESS\*\*\n- \(copilot\) Adapter requires node\.js >= 22\.19\.0 now\n\n### 1\.0\.0/,
    );
});

test('creates a Changelog section and work-in-progress header when absent', () => {
    const run = runTemplate('>=20.0.0', null, undefined, '# Adapter\n');

    assert.equal(run.result.status, 0, run.result.stderr);
    assert.match(
        run.read('README.md'),
        /## Changelog\n\n### \*\*WORK IN PROGRESS\*\*\n- \(copilot\) Adapter requires node\.js >= 22\.19\.0 now/,
    );
});

test('does not place the changelog entry inside an HTML comment', () => {
    const readme = [
        '# Adapter',
        '',
        '<!--',
        '## Changelog',
        '### **WORK IN PROGRESS**',
        '- hidden comment content',
        '-->',
        '',
        '## Changelog',
        '',
        '<!-- Existing comment -->',
        '### **WORK IN PROGRESS**',
        '',
    ].join('\n');
    const run = runTemplate('>=20.0.0', null, undefined, readme);
    const updatedReadme = run.read('README.md');

    assert.equal(run.result.status, 0, run.result.stderr);
    assert.ok(updatedReadme.indexOf('- (copilot)') > updatedReadme.lastIndexOf('-->'));
    assert.match(updatedReadme, /## Changelog\n\n<!-- Existing comment -->\n### \*\*WORK IN PROGRESS\*\*\n- \(copilot\)/);
});

test('does not create a PR or alter files when engines already requires a higher version', () => {
    const workflow = 'jobs:\n  test:\n    steps:\n      - run: echo ok\n';
    const readme = '# Adapter\n\n## Changelog\n';
    const run = runTemplate('>=23.0.0', workflow, undefined, readme);

    assert.equal(run.result.status, 0, run.result.stderr);
    assert.match(run.read('package.json'), /"node": ">=23\.0\.0"/);
    assert.equal(run.read('.github/workflows/test-and-release.yml'), workflow);
    assert.equal(run.read('.iobroker-pr-title.tmp'), 'placeholder title');
    assert.equal(run.read('README.md'), readme);
    assert.match(run.read('.iobroker-pr-body.tmp'), /__CHANGES_SUMMARY_EN__/);
    assert.match(run.result.stdout, /no PR will be created/);
});

test('does not create a PR when engines already meets the required minimum', () => {
    const run = runTemplate('^22.19.0', null);

    assert.equal(run.result.status, 0, run.result.stderr);
    assert.match(run.read('package.json'), /"node": "\^22\.19\.0"/);
    assert.equal(run.read('.iobroker-pr-title.tmp'), 'placeholder title');
    assert.match(run.result.stdout, /no PR will be created/);
});

test('reports a missing workflow without claiming workflow changes', () => {
    const run = runTemplate('>=20.0.0', null);

    assert.equal(run.result.status, 0, run.result.stderr);
    const body = run.read('.iobroker-pr-body.tmp');
    assert.match(body, /was not found; no workflow changes were made/);
    assert.match(body, /wurde nicht gefunden; es wurden keine Workflow-Änderungen vorgenommen/);
    assert.equal(run.has('.github/workflows/test-and-release.yml'), false);
});

test('updates the top-level engines object rather than a nested dependency field', () => {
    const packageJson = {
        dependencies: { engines: { node: '>=1.0.0' } },
        engines: { node: '>=20.0.0' },
    };
    const run = runTemplate('>=20.0.0', null, packageJson);
    const updated = JSON.parse(run.read('package.json'));

    assert.equal(run.result.status, 0, run.result.stderr);
    assert.equal(updated.dependencies.engines.node, '>=1.0.0');
    assert.equal(updated.engines.node, '>=22.19.0');
});

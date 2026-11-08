'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { files, install } = require('../templates/X0000-sanitizeIobrokerCommunityAdapters/build');

function createRoot() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'sanitize-iobroker-community-'));
}

test('downloads upstream examples and synchronizes the workflows', async () => {
    const rootDir = createRoot();
    const fetched = [];
    const logs = [];
    const fetchImpl = async url => {
        fetched.push(url);
        return { ok: true, text: async () => `upstream: ${url}\n` };
    };

    await install({ rootDir, fetchImpl, log: message => logs.push(message) });

    assert.deepEqual(fetched.sort(), files.map(file => file.source).sort());
    assert.equal(files[0].destination, '.github/auto-merge.yml');
    for (const file of files) {
        assert.ok(logs.includes(`ⓘ Checking ${file.destination} against upstream.`));
        assert.ok(logs.includes(`ⓘ ${path.join(rootDir, file.destination)} differs from upstream; applying change.`));
        assert.ok(logs.includes(`✔️ Updated ${path.join(rootDir, file.destination)}`));
    }
    for (const file of files) {
        assert.equal(
            fs.readFileSync(path.join(rootDir, file.destination), 'utf8'),
            `upstream: ${file.source}\n`,
        );
    }
});

test('preserves an existing config while updating the workflows', async () => {
    const rootDir = createRoot();
    const configPath = path.join(rootDir, '.github/auto-merge.yml');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, 'custom configuration\n');
    const fetched = [];
    const logs = [];

    await install({
        rootDir,
        log: message => logs.push(message),
        fetchImpl: async url => {
            fetched.push(url);
            return { ok: true, text: async () => `upstream: ${url}\n` };
        },
    });

    assert.equal(fs.readFileSync(configPath, 'utf8'), 'custom configuration\n');
    assert.equal(fetched.includes(files[0].source), false);
    assert.match(logs.join('\n'), /\.github\/auto-merge\.yml already exists; no change will be applied/);
    for (const file of files.slice(1)) {
        assert.equal(
            fs.readFileSync(path.join(rootDir, file.destination), 'utf8'),
            `upstream: ${file.source}\n`,
        );
    }
});

test('does not write any files when an upstream fetch fails', async () => {
    const rootDir = createRoot();
    const logs = [];

    await assert.rejects(
        install({
            rootDir,
            log: message => logs.push(message),
            fetchImpl: async url => ({
                ok: false,
                status: 503,
                text: async () => url,
            }),
        }),
        /HTTP 503/,
    );

    assert.equal(logs.length, files.length);
    assert.deepEqual(fs.readdirSync(rootDir), []);
});

test('reports when upstream files already match', async () => {
    const rootDir = createRoot();
    const logs = [];
    for (const file of files) {
        const destination = path.join(rootDir, file.destination);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, `upstream: ${file.source}\n`);
    }

    await install({
        rootDir,
        log: message => logs.push(message),
        fetchImpl: async url => ({ ok: true, text: async () => `upstream: ${url}\n` }),
    });

    assert.match(logs.join('\n'), /\.github\/auto-merge\.yml already exists; no change will be applied/);
    assert.match(logs.join('\n'), /\.github\/workflows\/automerge-dependabot\.yml already matches upstream; no change will be applied/);
    assert.match(logs.join('\n'), /\.github\/workflows\/automerge-iobroker-bot\.yml already matches upstream; no change will be applied/);
});

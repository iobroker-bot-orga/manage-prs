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
    const fetchImpl = async url => {
        fetched.push(url);
        return { ok: true, text: async () => `upstream: ${url}\n` };
    };

    await install({ rootDir, fetchImpl });

    assert.deepEqual(fetched.sort(), files.map(file => file.source).sort());
    for (const file of files) {
        assert.equal(
            fs.readFileSync(path.join(rootDir, file.destination), 'utf8'),
            `upstream: ${file.source}\n`,
        );
    }
});

test('preserves an existing config while updating the workflows', async () => {
    const rootDir = createRoot();
    const configPath = path.join(rootDir, '.github/automerge-dependabot');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, 'custom configuration\n');
    const fetched = [];

    await install({
        rootDir,
        fetchImpl: async url => {
            fetched.push(url);
            return { ok: true, text: async () => `upstream: ${url}\n` };
        },
    });

    assert.equal(fs.readFileSync(configPath, 'utf8'), 'custom configuration\n');
    assert.equal(fetched.includes(files[0].source), false);
    for (const file of files.slice(1)) {
        assert.equal(
            fs.readFileSync(path.join(rootDir, file.destination), 'utf8'),
            `upstream: ${file.source}\n`,
        );
    }
});

test('does not write any files when an upstream fetch fails', async () => {
    const rootDir = createRoot();

    await assert.rejects(
        install({
            rootDir,
            fetchImpl: async url => ({
                ok: false,
                status: 503,
                text: async () => url,
            }),
        }),
        /HTTP 503/,
    );

    assert.deepEqual(fs.readdirSync(rootDir), []);
});

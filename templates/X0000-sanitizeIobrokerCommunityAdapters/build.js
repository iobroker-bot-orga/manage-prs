'use strict';

const fs = require('node:fs');
const path = require('node:path');

const files = [
    {
        source: 'https://raw.githubusercontent.com/iobroker-bot-orga/action-automerge-dependabot/main/.github/auto-merge.example.yml',
        destination: '.github/auto-merge.yml',
        createOnly: true,
    },
    {
        source: 'https://raw.githubusercontent.com/iobroker-bot-orga/action-automerge-dependabot/main/.github/workflows/automerge-dependabot.example.yml',
        destination: '.github/workflows/automerge-dependabot.yml',
    },
    {
        source: 'https://raw.githubusercontent.com/iobroker-bot-orga/action-automerge-iobroker-bot/main/.github/workflows/automerge-iobroker-bot.example.yml',
        destination: '.github/workflows/automerge-iobroker-bot.yml',
    },
];

async function install({ rootDir = process.cwd(), fetchImpl = fetch, log = console.log } = {}) {
    const updates = await Promise.all(files.map(async file => {
        const destination = path.join(rootDir, file.destination);
        log(`ⓘ Checking ${file.destination} against upstream.`);
        if (file.createOnly && fs.existsSync(destination)) {
            log(`ⓘ ${file.destination} already exists; no change will be applied.`);
            return null;
        }

        const response = await fetchImpl(file.source);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${file.source}: HTTP ${response.status}`);
        }
        return { ...file, destination, content: await response.text() };
    }));

    for (const update of updates) {
        if (!update) continue;

        if (fs.existsSync(update.destination) &&
            fs.readFileSync(update.destination, 'utf8') === update.content) {
            log(`ⓘ ${update.destination} already matches upstream; no change will be applied.`);
            continue;
        }

        log(`ⓘ ${update.destination} differs from upstream; applying change.`);
        fs.mkdirSync(path.dirname(update.destination), { recursive: true });
        fs.writeFileSync(update.destination, update.content, 'utf8');
        log(`✔️ Updated ${update.destination}`);
    }
}

if (require.main === module) {
    install().catch(error => {
        console.error(`❌ Failed to apply automerge configuration: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { files, install };

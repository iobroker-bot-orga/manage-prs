'use strict';

const fs = require('node:fs');
const path = require('node:path');

const files = [
    {
        source: 'https://raw.githubusercontent.com/iobroker-bot-orga/action-automerge-dependabot/main/.github/auto-merge.example.yml',
        destination: '.github/automerge-dependabot',
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

async function install({ rootDir = process.cwd(), fetchImpl = fetch } = {}) {
    const updates = await Promise.all(files.map(async file => {
        const destination = path.join(rootDir, file.destination);
        if (file.createOnly && fs.existsSync(destination)) {
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
            continue;
        }

        fs.mkdirSync(path.dirname(update.destination), { recursive: true });
        fs.writeFileSync(update.destination, update.content, 'utf8');
        console.log(`✔️ Updated ${update.destination}`);
    }
}

if (require.main === module) {
    install().catch(error => {
        console.error(`❌ Failed to apply automerge configuration: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { files, install };

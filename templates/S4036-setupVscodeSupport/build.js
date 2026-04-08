// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// If no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

const fs = require('node:fs');
const path = require('node:path');

// Prepare standard parameters
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];

// Paths
const vsCodeDir = '.vscode';
const vsCodeSettingsPath = path.join(vsCodeDir, 'settings.json');

/**
 * Check if .vscode/settings.json already exists - if so, no PR is needed
 */
if (fs.existsSync(vsCodeSettingsPath)) {
    console.log(`ⓘ ${vsCodeSettingsPath} already exists. No PR is needed.`);
    process.exit(0);
}

/**
 * Detect whether the adapter uses TypeScript or JavaScript.
 * A TypeScript adapter is identified by the presence of tsconfig.json.
 */
const isTypeScript = fs.existsSync('tsconfig.json');
if (isTypeScript) {
    console.log('ⓘ TypeScript adapter detected (tsconfig.json found).');
} else {
    console.log('ⓘ JavaScript adapter detected (no tsconfig.json found).');
}

/**
 * Content for settings.json based on adapter type.
 * Source:
 *   JS:  https://github.com/ioBroker/ioBroker.example/tree/master/JavaScript/.vscode
 *   TS:  https://github.com/ioBroker/ioBroker.example/tree/master/TypeScript/.vscode
 */
const jsSettingsContent = `{
    "eslint.enable": true,
    "json.schemas": [
        {
            "fileMatch": [
                "io-package.json"
            ],
            "url": "https://raw.githubusercontent.com/ioBroker/ioBroker.js-controller/master/schemas/io-package.json"
        },
        {
            "fileMatch": [
                "admin/jsonConfig.json",
                "admin/jsonConfig.json5",
                "admin/jsonCustom.json",
                "admin/jsonCustom.json5",
                "admin/jsonTab.json",
                "admin/jsonTab.json5"
            ],
            "url": "https://raw.githubusercontent.com/ioBroker/ioBroker.admin/master/packages/jsonConfig/schemas/jsonConfig.json"
        }
    ]
}
`;

const tsSettingsContent = `{
    "typescript.tsdk": "node_modules/typescript/lib",
    "eslint.enable": true,
    "json.schemas": [
        {
            "fileMatch": [
                "io-package.json"
            ],
            "url": "https://raw.githubusercontent.com/ioBroker/ioBroker.js-controller/master/schemas/io-package.json"
        },
        {
            "fileMatch": [
                "admin/jsonConfig.json",
                "admin/jsonConfig.json5",
                "admin/jsonCustom.json",
                "admin/jsonCustom.json5",
                "admin/jsonTab.json",
                "admin/jsonTab.json5"
            ],
            "url": "https://raw.githubusercontent.com/ioBroker/ioBroker.admin/master/packages/jsonConfig/schemas/jsonConfig.json"
        }
    ]
}
`;

const settingsContent = isTypeScript ? tsSettingsContent : jsSettingsContent;

/**
 * Create .vscode directory if it does not exist
 */
if (!fs.existsSync(vsCodeDir)) {
    try {
        fs.mkdirSync(vsCodeDir, { recursive: true });
        console.log(`✔️ Created directory: ${vsCodeDir}`);
    } catch (error) {
        console.log(`❌ Failed to create directory ${vsCodeDir}: ${error.message}`);
        process.exit(1);
    }
} else {
    console.log(`✔️ Directory ${vsCodeDir} already exists.`);
}

/**
 * Write settings.json
 */
try {
    fs.writeFileSync(vsCodeSettingsPath, settingsContent, 'utf8');
    console.log(`✔️ Created ${vsCodeSettingsPath} successfully.`);
} catch (error) {
    console.log(`❌ Failed to write ${vsCodeSettingsPath}: ${error.message}`);
    process.exit(1);
}

console.log('✔️ processing completed');

process.exit(0);

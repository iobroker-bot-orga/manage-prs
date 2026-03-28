// This script implements the required changes for a PR
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// If no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR.

'use strict';

const fs = require('node:fs');
const path = require('node:path');

// prepare standard parameters
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

// File extensions to scan
const ALLOWED_EXTENSIONS = ['.js', '.mjs', '.cjs', '.ts'];

// Directories to exclude
const EXCLUDED_DIRS = new Set([
    'admin',
    'build',
    'doc',
    'src-admin',
    'src-widgets',
    'admin-src',
    'test',
    'node_modules',
    '.git',
    '.vscode',
    '.dev-server',
]);

// Files to exclude
const EXCLUDED_FILES = new Set([
    'tasks.js',
    'Gruntfile.js',
    'gulpfile.js',
]);

// Known node internal packages
const NODE_INTERNAL_PACKAGES = new Set([
    'assert',
    'async_hooks',
    'buffer',
    'child_process',
    'cluster',
    'console',
    'constants',
    'crypto',
    'dgram',
    'diagnostics_channel',
    'dns',
    'domain',
    'events',
    'fs',
    'http',
    'http2',
    'https',
    'inspector',
    'module',
    'net',
    'os',
    'path',
    'perf_hooks',
    'process',
    'punycode',
    'querystring',
    'readline',
    'repl',
    'stream',
    'string_decoder',
    'sys',
    'timers',
    'tls',
    'trace_events',
    'tty',
    'url',
    'util',
    'v8',
    'vm',
    'wasi',
    'worker_threads',
    'zlib',
]);

/**
 * Recursively collect files matching allowed extensions while excluding specified directories and files.
 * @param {string} dir - Directory to scan
 * @param {string[]} results - Accumulator for file paths
 * @returns {string[]} - List of matching file paths
 */
function collectFiles(dir, results = []) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
        console.log(`⚠️ Could not read directory ${dir}: ${error.message}`);
        return results;
    }

    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!EXCLUDED_DIRS.has(entry.name)) {
                collectFiles(entryPath, results);
            }
        } else if (entry.isFile()) {
            if (!EXCLUDED_FILES.has(entry.name)) {
                const ext = path.extname(entry.name);
                if (ALLOWED_EXTENSIONS.includes(ext)) {
                    results.push(entryPath);
                }
            }
        }
    }

    return results;
}

/**
 * Add node: prefix to a bare node internal module name if applicable.
 * @param {string} moduleName - The module name to check
 * @returns {string|null} - The prefixed module name, or null if not applicable
 */
function getPrefixedName(moduleName) {
    if (NODE_INTERNAL_PACKAGES.has(moduleName)) {
        return `node:${moduleName}`;
    }
    return null;
}

// Collect all relevant files
const files = collectFiles('.');
console.log(`ⓘ Found ${files.length} file(s) to scan.`);

let totalChanges = 0;

for (const filePath of files) {
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.log(`❌ Could not read file ${filePath}: ${error.message}`);
        continue;
    }

    let newContent = content;
    let fileChanges = 0;

    // Replace require('module') and require("module") for known node internals
    // Handles optional whitespace around the module name and between require and (
    // Does NOT match already-prefixed node: requires
    newContent = newContent.replace(
        /\brequire\s*\(\s*(['"])((?!node:)[a-zA-Z][a-zA-Z0-9_]*)\1\s*\)/g,
        (match, quote, moduleName) => {
            const prefixed = getPrefixedName(moduleName);
            if (prefixed) {
                fileChanges++;
                return `require(${quote}${prefixed}${quote})`;
            }
            return match;
        }
    );

    // Replace import ... from 'module' for known node internals (ESM / TypeScript)
    // Does NOT match already-prefixed node: imports
    newContent = newContent.replace(
        /\bfrom\s+(['"])((?!node:)[a-zA-Z][a-zA-Z0-9_]*)\1/g,
        (match, quote, moduleName) => {
            const prefixed = getPrefixedName(moduleName);
            if (prefixed) {
                fileChanges++;
                return `from ${quote}${prefixed}${quote}`;
            }
            return match;
        }
    );

    // Replace dynamic import('module') for known node internals
    // Does NOT match already-prefixed node: imports
    newContent = newContent.replace(
        /\bimport\s*\(\s*(['"])((?!node:)[a-zA-Z][a-zA-Z0-9_]*)\1\s*\)/g,
        (match, quote, moduleName) => {
            const prefixed = getPrefixedName(moduleName);
            if (prefixed) {
                fileChanges++;
                return `import(${quote}${prefixed}${quote})`;
            }
            return match;
        }
    );

    if (fileChanges > 0) {
        try {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✔️ Updated ${filePath} (${fileChanges} change(s))`);
            totalChanges += fileChanges;
        } catch (error) {
            console.log(`❌ Could not write file ${filePath}: ${error.message}`);
        }
    }
}

if (totalChanges === 0) {
    console.log(`✔️ No changes required, all node: prefixes are already in place.`);
} else {
    console.log(`✔️ Applied ${totalChanges} change(s) across all scanned files.`);
}

console.log(`✔️ processing completed`);
process.exit(0);

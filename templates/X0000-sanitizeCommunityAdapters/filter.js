'use strict';

/**
 * Filter script for template processing
 *
 * This script is used by processLatestRepositories.js to check whether
 * a repository should be processed with this template.
 *
 * The script should export:
 * - init(context): Optional initialization function called once at startup
 * - test(context): Function to test if repository should be processed (returns boolean)
 * - finalize(context): Optional cleanup function called after all repositories are processed
 *
 * Context object contains:
 * - template: Template name
 * - owner: Repository owner
 * - adapter: Adapter name
 */

async function init(context) {
    console.log(`ⓘ Filter script initialized for template: ${context.template}`);
}

async function test(context) {
    // Only process repositories owned by iobroker-community-adapters
    return context.owner === 'iobroker-community-adapters';
}

async function finalize(context) {
    console.log(`ⓘ Filter script finalized for template: ${context.template}`);
}

module.exports = {
    init,
    test,
    finalize
};

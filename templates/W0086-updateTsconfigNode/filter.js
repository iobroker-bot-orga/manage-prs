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

/**
 * Initialize the filter (called once at startup)
 * @param {Object} context - Context with template information
 */
async function init(context) {
    console.log(`ⓘ Filter script initialized for template: ${context.template}`);
    // Perform any initialization here
}

/**
 * Test if a repository should be processed
 * @param {Object} context - Context with owner and adapter information
 * @returns {Promise<boolean>} - True if repository should be processed
 */
async function test(context) {
    // Example: Only process repositories from specific owner
    // Customize this logic for your specific template needs
    
    // Default: process all repositories
    return true;
    
    // Example filters:
    // return context.owner === 'ioBroker'; // Only ioBroker owned repos
    // return !context.adapter.startsWith('test-'); // Skip test adapters
}

/**
 * Finalize the filter (called after all repositories are processed)
 * @param {Object} context - Context information
 */
async function finalize(context) {
    console.log(`ⓘ Filter script finalized for template: ${context.template}`);
    // Perform any cleanup here
}

module.exports = {
    init,
    test,
    finalize
};

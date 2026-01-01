#!/usr/bin/env node
'use strict';

const {parseArgs} = require('node:util');
const { execSync } = require('child_process');
const { getLatestRepo } = require('@iobroker-bot-orga/iobroker-lib');

// Default configuration
const DEFAULT_DELAY_SECONDS = 120;

const opts = {
    dry: false,
    debug: false,
    from: '',
    template: '',
    parameter_data: '',
    pr_mode: 'recreate',
    filter: '',
    delay: DEFAULT_DELAY_SECONDS,
}

let checkScript;
const context = {};
let filterRegexes = null; // Pre-compiled regex patterns for filter

function debug (text){
    if (opts.debug) {
        console.log(`🐛 ${text}`);
    }
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

/**
 * Validate filter pattern format
 * @param {string} pattern - Filter pattern to validate
 * @returns {boolean} True if the pattern is valid or empty
 */
function validateFilterPattern(pattern) {
    if (!pattern) {
        return true; // Empty pattern is valid (no filtering)
    }

    const parts = pattern.split('/');
    if (parts.length !== 2) {
        return false;
    }

    return true;
}

/**
 * Compile filter pattern into regex objects for efficient matching
 * @param {string} pattern - Filter pattern with wildcards
 * @returns {Object|null} Object with ownerRegex and repoRegex, or null if no filter
 */
function compileFilterPattern(pattern) {
    if (!pattern) {
        return null; // No filter
    }

    // Normalize to lowercase for case-insensitive matching
    const lowerPattern = pattern.toLowerCase();
    
    // Split pattern into owner and repo parts
    const [ownerPattern, repoPattern] = lowerPattern.split('/');

    // Escape special regex characters and convert wildcard pattern to regex
    const escapeRegex = (str) => str.replace(/[.+?^${}()|[\]\\-]/g, '\\$&');
    const toRegexPattern = (pattern) => escapeRegex(pattern).replace(/\*/g, '.*');
    
    return {
        ownerRegex: new RegExp('^' + toRegexPattern(ownerPattern) + '$'),
        repoRegex: new RegExp('^' + toRegexPattern(repoPattern) + '$')
    };
}

/**
 * Check if a repository matches the pre-compiled filter pattern
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {boolean} True if the repository matches the pattern
 */
function matchesFilter(owner, repo) {
    if (!filterRegexes) {
        return true; // No filter means match all
    }

    // Normalize to lowercase for case-insensitive matching
    const lowerOwner = owner.toLowerCase();
    const lowerRepo = repo.toLowerCase();

    return filterRegexes.ownerRegex.test(lowerOwner) && filterRegexes.repoRegex.test(lowerRepo);
}

/**
 * Execute gh command and return output
 * @param {string} command - Command to execute
 * @returns {string} Command output
 */
function executeGhCommand(command) {
    debug(`(GH-CMD) ${command}`);
    try {
        const res = execSync(command, { encoding: 'utf-8' });
        debug(`(GH-RES) ${res}`);
        return res;
    } catch (error) {
        console.error(`❌ Error executing command: ${command}`);
        console.error(error.message);
        if (error.stderr) {
            console.error(error.stderr.toString());
        }
        throw error;
    }
}

async function initCheck(context){
    debug(`initCheck('${context.template}')`);

    const filename = `${__dirname}/templates/${context.template}/filter.js`;
    console.log(`ⓘ initializing checking script ${filename}`);

    try {
        checkScript = require(filename); 
    } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            console.log(`ⓘ no checking script found`);
        } else {
            throw(e);
        }
    }

    if (checkScript && checkScript.init) {
        await checkScript.init(context);
    }
}

async function checkProcessing(context){
    debug(`checkProcessing('${context.template}')`);

    if (checkScript && checkScript.test) {
        return await checkScript.test(context);
    } else {
        return true;
    }
}

/**
 * Trigger processRepository workflow for a specific repository
 * @param {string} owner - Repository owner
 * @param {string} adapter - Adapter name
 */
function triggerRepoProcessing(owner, adapter) {
    const repoUrl = `https://github.com/${owner}/ioBroker.${adapter}`;

    debug(`trigger repository processing for ${repoUrl}`);

    console.log(`    ⏳ Triggering workflow for ${repoUrl}`);
    
    try {
        // Build the gh workflow run command
        const cmd = `gh workflow run processRepository.yml --repo iobroker-bot-orga/manage-prs --field repository_url="${repoUrl}" --field template="${opts.template}" --field parameter_data="${opts.parameter_data}" --field pr_mode="${opts.pr_mode}"`;
        debug(cmd);

        executeGhCommand(cmd);
        console.log(`    ✔️ Workflow triggered successfully`);
    } catch (e) {
        console.error(`    ❌ Failed to trigger workflow: ${e.message}`);
    }
}

/**
 * Trigger workflow restart to continue processing
 * @param {string} adapter - Adapter name to resume from
 */
function triggerRestart(adapter) {
    debug(`trigger latest restart from ${adapter}`);

    console.log(`ⓘ Triggering workflow restart from adapter: ${adapter}`);
    
    try {
        // Build the gh api command for repository dispatch
        let flags='';
        if (opts.debug){
            flags = `${flags} --debug`;
        }
        if (opts.dry){
            flags = `${flags} --dry`;
        };
        if (flags !== '') {
            flags = `--field client_payload[flags]='${flags}'`;
        };

        const cmd = `gh api repos/iobroker-bot-orga/manage-prs/dispatches --method POST --field event_type='process-latest-restart' --field client_payload[template]='${opts.template}' --field client_payload[parameter_data]='${opts.parameter_data}' --field client_payload[pr_mode]='${opts.pr_mode}' --field client_payload[from]='${adapter}' --field client_payload[filter]='${opts.filter}' --field client_payload[delay]='${opts.delay}' ${flags}`;
        
        executeGhCommand(cmd);
        console.log(`ⓘ ✔️ Restart triggered successfully`);
    } catch (e) {
        console.error(`❌ Failed to trigger restart: ${e.message}`);
    }
}

async function main() {
    const options = {
        'dry': {
            type: 'boolean',
        },
        'debug': {
            type: 'boolean',
            short: 'd',
        },
        'from': {
            type: 'string',
        },
        'template': {
            type: 'string',
        },
        'parameter_data': {
            type: 'string',
        },
        'pr_mode': {
            type: 'string',
        },
        'filter': {
            type: 'string',
        },
        'delay': {
            type: 'string', // String type for consistency with other numeric inputs from CLI/workflow
        },
    };

    const {
        values,
        positionals,
    } = parseArgs({ options, strict:true, allowPositionals:true,  });

    opts.dry = values['dry'] || false;
    opts.debug = values['debug'] || false;
    opts.from = values['from'] || '';
    opts.template = values['template'] || '';
    opts.parameter_data = values['parameter_data'] || '';
    opts.pr_mode = values['pr_mode'] || 'recreate';
    opts.filter = values['filter'] || '';
    opts.delay = parseInt(values['delay'] || String(DEFAULT_DELAY_SECONDS), 10);

    if (!opts.template) {
        console.error('❌ Template is required. Use --template=<template-name>');
        process.exit(1);
    }

    if (isNaN(opts.delay) || opts.delay <= 0) {
        console.error(`❌ Invalid delay value: ${values['delay'] || '(not provided)'}`);
        console.error('   Delay must be a positive number (in seconds)');
        process.exit(1);
    }

    // Ensure minimum delay of 60 seconds
    if (opts.delay < 60) {
        console.log(`⚠️ Delay of ${opts.delay}s is too short, setting to minimum of 60s`);
        opts.delay = 60;
    }

    if (!validateFilterPattern(opts.filter)) {
        console.error(`❌ Invalid filter pattern: ${opts.filter}`);
        console.error('   Expected format: owner/repo');
        console.error('   Examples: iobroker-community-adapters/*, */*watch*, iobroker*/*');
        process.exit(1);
    }

    // Compile filter pattern once for efficient matching
    filterRegexes = compileFilterPattern(opts.filter);

    console.log('ⓘ ===================================================================');
    console.log('ⓘ processLatestRepositories - Starting');
    console.log('ⓘ ===================================================================');
    console.log(`ⓘ Template: ${opts.template}`);
    console.log(`ⓘ Parameter Data: ${opts.parameter_data || '(none)'}`);
    console.log(`ⓘ PR Mode: ${opts.pr_mode}`);
    console.log(`ⓘ From: ${opts.from || '(start from beginning)'}`);
    console.log(`ⓘ Filter: ${opts.filter || '(none - process all repositories)'}`);
    console.log(`ⓘ Delay: ${opts.delay} seconds`);
    console.log(`ⓘ Dry Run: ${opts.dry}`);
    console.log('ⓘ ===================================================================');

    const latestRepo = await getLatestRepo();
    const total = Object.keys(latestRepo).filter(k => !k.startsWith('_')).length;
    
    // Configuration constants
    const RESTART_AFTER_HOURS = 3; // Restart after 3 hours to avoid workflow timeout
    const MAX_REPOS_BEFORE_RESTART = Math.ceil(RESTART_AFTER_HOURS * 60 * (60 / opts.delay)); // Calculate max repos based on 3 hours with configured delay between repos, rounded up to ensure at least 1

    console.log(`ⓘ Found ${total} repositories to process`);
    console.log(`ⓘ Delay between processing: ${opts.delay} seconds`);
    console.log(`ⓘ Will restart after ${RESTART_AFTER_HOURS}h (${MAX_REPOS_BEFORE_RESTART} repositories)`);

    context.template = opts.template;
    await initCheck(context);

    let curr = 0;
    let counter = MAX_REPOS_BEFORE_RESTART;
    let skip = opts.from && (opts.from !== '');
    if (skip) console.log (`ⓘ --from set to "${opts.from}" - searching for first adapter to process ...`);
    
    for (const adapter in latestRepo) {
        if (counter <= 0) {
            console.log(`ⓘ Restart limit reached, will restart from adapter: ${adapter}`);
            triggerRestart(adapter);
            break;
        };

        curr = curr + 1;
        
        // Skip internal entries
        if (adapter.startsWith('_')) {
            debug(`Skipping internal entry: ${adapter}`);
            continue;
        }
        
        // Skip until we reach the 'from' adapter
        if (adapter === opts.from) {
            skip = false;
            console.log(`ⓘ Found resume point: ${adapter}`);
        }
        if (skip) {
            debug(`Skipping ${adapter} (before resume point)`);
            continue;
        }
        
        debug (`Processing ${latestRepo[adapter].meta}`);

        const parts = latestRepo[adapter].meta.split('/');
        const owner = parts[3];
        const repoName = `ioBroker.${adapter}`;
        
        // Check if repository matches the filter
        if (!matchesFilter(owner, repoName)) {
            console.log(`⏭️ Skipping ${owner}/${repoName} (does not match filter)`);
            continue; // Skip without delay
        }
        
        console.log(`\nⓘ Processing ${owner}/${repoName} (${curr}/${total})`);

        context.owner = owner;
        context.adapter = adapter;        
        
        if ( ! await checkProcessing(context)) {
            console.log(`ⓘ SKIPPING ${owner}/${repoName} (check failed)`);
        } else {
            if (! opts.dry) {
                triggerRepoProcessing(owner, adapter);
            } else {
                console.log (`🧪 Would trigger processing for ${owner}/${repoName}`)
            }
        }

        counter = counter - 1;
        if (counter) {
            console.log(`ⓘ Will restart after ${counter} more repositories, sleeping (${opts.delay}s) ...`);
        } else {
            console.log(`ⓘ Will restart after delay, sleeping (${opts.delay}s) ...`);            
        }
        await sleep(opts.dry?1000:opts.delay * 1000);
    }

    if (checkScript && checkScript.finalize) {
        await checkScript.finalize(context);
    }

    console.log('ⓘ ===================================================================');
    console.log('ⓘ Task completed successfully');
    console.log('ⓘ ===================================================================');
}

main();

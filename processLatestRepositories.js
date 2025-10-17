#!/usr/bin/env node
'use strict';

const {parseArgs} = require('node:util');
const { execSync } = require('child_process');
const https = require('node:https');

const opts = {
    dry: false,
    debug: false,
    from: '',
    template: '',
    parameter_data: '',
    pr_mode: 'recreate',
}

let checkScript;
const context = {};

function debug (text){
    if (opts.debug) {
        console.log(`[DEBUG] ${text}`);
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

/**
 * Get latest repository data from ioBroker repo
 * @returns {Promise<Object>} Repository data
 */
async function getLatestRepoLive() {
    return new Promise((resolve, reject) => {
        const url = 'http://repo.iobroker.live/sources-dist-latest.json';
        console.log(`[INFO] Retrieving "${url}"`);
        
        const req = https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`[INFO] Retrieved ${Object.keys(parsed).length} repositories`);
                    resolve(parsed);
                } catch (e) {
                    reject(new Error(`Failed to parse JSON: ${e.message}`));
                }
            });
        });
        
        req.on('error', (e) => {
            reject(new Error(`Failed to fetch repository data: ${e.message}`));
        });
        
        req.end();
    });
}

async function initCheck(context){
    debug(`initCheck('${context.template}')`);

    const filename = `${__dirname}/templates/${context.template}.js`;
    console.log(`[INFO] initializing checking script ${filename}`);

    try {
        checkScript = require(filename); 
    } catch (e) {
        if ( e.code === 'MODULE_NOT_FOUND') {
            console.log(`[INFO] no checking script found`);
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

    console.log(`    Triggering workflow for ${repoUrl}`);
    
    try {
        // Build the gh workflow run command
        const cmd = `gh workflow run processRepository.yml --repo iobroker-bot-orga/manage-prs --field repository_url="${repoUrl}" --field template="${opts.template}" --field parameter_data="${opts.parameter_data}" --field pr_mode="${opts.pr_mode}"`;
        
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

    console.log(`[INFO] Triggering workflow restart from adapter: ${adapter}`);
    
    try {
        // Build the gh api command for repository dispatch
        const payload = {
            event_type: 'process-latest-restart',
            client_payload: {
                template: opts.template,
                parameter_data: opts.parameter_data,
                pr_mode: opts.pr_mode,
                from: adapter
            }
        };
        
        const cmd = `gh api repos/iobroker-bot-orga/manage-prs/dispatches --method POST --field event_type='process-latest-restart' --field client_payload[template]='${opts.template}' --field client_payload[parameter_data]='${opts.parameter_data}' --field client_payload[pr_mode]='${opts.pr_mode}' --field client_payload[from]='${adapter}'`;
        
        executeGhCommand(cmd);
        console.log(`[INFO] ✔️ Restart triggered successfully`);
    } catch (e) {
        console.error(`[ERROR] Failed to trigger restart: ${e.message}`);
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

    if (!opts.template) {
        console.error('[ERROR] Template is required. Use --template=<template-name>');
        process.exit(1);
    }

    console.log('[INFO] ===================================================================');
    console.log('[INFO] processLatestRepositories - Starting');
    console.log('[INFO] ===================================================================');
    console.log(`[INFO] Template: ${opts.template}`);
    console.log(`[INFO] Parameter Data: ${opts.parameter_data || '(none)'}`);
    console.log(`[INFO] PR Mode: ${opts.pr_mode}`);
    console.log(`[INFO] From: ${opts.from || '(start from beginning)'}`);
    console.log(`[INFO] Dry Run: ${opts.dry}`);
    console.log('[INFO] ===================================================================');

    const latestRepo = await getLatestRepoLive();
    const total = Object.keys(latestRepo).filter(k => !k.startsWith('_')).length;
    const delay = 120; // seconds (2 minutes)
    let counter = 3 * 60 * (60 / delay); /* restart after 3h (90 repositories at 2min each) */

    console.log(`[INFO] Found ${total} repositories to process`);
    console.log(`[INFO] Delay between processing: ${delay} seconds`);
    console.log(`[INFO] Will restart after 3h (${counter} repositories)`);

    context.template = opts.template;
    await initCheck(context);

    let curr = 0;
    let skip = opts.from && (opts.from !== '');
    if (skip) console.log (`[INFO] --from set to "${opts.from}" - searching for first adapter to process ...`);
    
    for (const adapter in latestRepo) {
        if (!counter) {
            console.log(`[INFO] Restart limit reached, will restart from adapter: ${adapter}`);
            if (!opts.dry) {
                triggerRestart(adapter);
            } else {
                console.log(`[DRY] Would trigger restart from ${adapter}`);
            }
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
            console.log(`[INFO] Found resume point: ${adapter}`);
        }
        if (skip) {
            debug(`Skipping ${adapter} (before resume point)`);
            continue;
        }
        
        debug (`Processing ${latestRepo[adapter].meta}`);

        const parts = latestRepo[adapter].meta.split('/');
        const owner = parts[3];
        console.log(`\n[INFO] Processing ${owner}/ioBroker.${adapter} (${curr}/${total})`);

        context.owner = owner;
        context.adapter = adapter;        
        
        if ( ! await checkProcessing(context)) {
            console.log(`[INFO] SKIPPING ${owner}/ioBroker.${adapter} (check failed)`);
        } else {
            if (! opts.dry) {
                triggerRepoProcessing(owner, adapter);
            } else {
                console.log (`[DRY] Would trigger processing for ${owner}/ioBroker.${adapter}`)
            }
        }

        counter = counter - 1;
        if (counter) {
            console.log(`[INFO] Will restart after ${counter} more repositories, sleeping (${delay}s) ...`);
        } else {
            console.log(`[INFO] Will restart after delay, sleeping (${delay}s) ...`);            
        }
        await sleep(delay * 1000);
    }

    if (checkScript && checkScript.finalize) {
        await checkScript.finalize(context);
    }

    console.log('[INFO] ===================================================================');
    console.log('[INFO] Task completed successfully');
    console.log('[INFO] ===================================================================');
}

main();

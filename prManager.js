#!/usr/bin/env node

/**
 * prManager.js - Script to manage PR creation based on mode
 *
 * Usage: node prManager.js <mode> <repository-name> <base-branch> <head-branch>
 *
 * This script reads PR title and body from temporary work files:
 * - .iobroker-pr-title.tmp: Contains the PR title
 * - .iobroker-pr-body.tmp: Contains the PR body
 *
 * These work files follow the iobroker naming convention (.iobroker-* prefix, .tmp suffix).
 *
 * This script handles different PR creation modes:
 * - force creation: Close existing open PRs and create new one
 * - recreate: Close existing open PRs, skip if closed by others, create new one
 * - skip if existing: Skip if open PR exists
 * - skip if closed: Skip if closed PR exists
 * - skip if merged: Skip if merged PR exists
 * - REVOKE: Close all existing open PRs with revocation comment, skip PR creation
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 4) {
  console.error('❌ Error: Missing required arguments');
  console.error(
    'Usage: node prManager.js <mode> <repository-name> <base-branch> <head-branch>',
  );
  process.exit(1);
}

const mode = args[0];
const repositoryName = args[1];
const baseBranch = args[2];
const headBranch = args[3];

// Verify PR metadata files exist
let prTitle;
try {
  if (!fs.existsSync('.iobroker-pr-title.tmp')) {
    console.error('❌ Error: .iobroker-pr-title.tmp file not found');
    process.exit(1);
  }
  
  if (!fs.existsSync('.iobroker-pr-body.tmp')) {
    console.error('❌ Error: .iobroker-pr-body.tmp file not found');
    process.exit(1);
  }
  
  // Read PR title for display and matching
  prTitle = fs.readFileSync('.iobroker-pr-title.tmp', 'utf-8').trim();
} catch (error) {
  console.error('❌ Error reading PR metadata files:', error.message);
  process.exit(1);
}

const validModes = ['force creation', 'recreate', 'skip if existing', 'skip if closed', 'skip if merged', 'REVOKE'];

if (!validModes.includes(mode)) {
  console.error(`❌ Error: Invalid mode "${mode}"`);
  console.error(`Valid modes: ${validModes.join(', ')}`);
  process.exit(1);
}

console.log(`ⓘ PR Manager Mode: ${mode}`);
console.log(`ⓘ Repository: ${repositoryName}`);
console.log(`ⓘ PR Title: ${prTitle}`);
console.log(`ⓘ Base Branch: ${baseBranch}`);
console.log(`ⓘ Head Branch: ${headBranch}`);

/**
 * Execute gh command and return output
 * @param {string} command - Command to execute
 * @returns {string} Command output
 */
function executeGhCommand(command) {
  //console.log(`DEBUG: (GH-CMD) ${command}`);
  try {
    const res = execSync(command, { encoding: 'utf-8' });
    //console.log(`DEBUG: (GH-RES) ${res}`);
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
 * Get current authenticated user
 * @returns {string} Username
 */
function getCurrentUser() {
  const output = executeGhCommand('gh api user -q .login');
  return output.trim();
}

/**
 * Find PRs by title created by iobroker-bot
 * @param {string} title - PR title to search for
 * @returns {Array} Array of PR objects with number, state, merged status, and closed_by
 */
function findPRsByTitle(title) {
  // Escape the title for use within double quotes in the search query
  // Escape backslashes first, then double quotes, then dollar signs and backticks
  const escapedTitle = title
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
  
  // Search for PRs with exact title match created by current user (iobroker-bot)
  // Use query string format with all qualifiers in the search query
  // The search query is wrapped in single quotes, and the title is in double quotes within it
  const searchQuery = `"${escapedTitle}" in:title`;
  
  // Replace single quotes in searchQuery with '\'' for safe bash execution
  const safeSearchQuery = searchQuery.replace(/'/g, "'\\''");
  
  const output = executeGhCommand(
    `gh search prs --json number,title --limit 100 --repo ${repositoryName} --author @me '${safeSearchQuery}'`,
  );

  const prs = JSON.parse(output);
  
  // Filter for exact title match and get additional details
  const matchingPRs = prs
    .filter((pr) => pr.title === title)
    .map((pr) => {
      // Get detailed PR info including merge status and who closed it
      const detailsOutput = executeGhCommand(
        `gh pr view ${pr.number} --repo ${repositoryName} --json number,state`,
      );
      const details = JSON.parse(detailsOutput);
      const state = details.state.toUpperCase();
      let closedBy = null;
      if (state === 'CLOSED') {
        closedBy = executeGhCommand(
          `gh api repos/${repositoryName}/issues/${pr.number}/events --jq "map(select(.event==\\"closed\\")) | last | .actor.login"`
        )
        closedBy = closedBy.replace('\n','').replace('\r','').trim();
      }
      return {
        number: details.number,
        state: state,
        open: state === 'OPEN',
        merged: state === 'MERGED',
        closed: state === 'CLOSED',
        closedBy: closedBy,
      };
    });
  return matchingPRs;
}

/**
 * Close PR with comment
 * @param {number} prNumber - PR number to close
 * @param {string} comment - Comment to add
 */
function closePRWithComment(prNumber, comment) {
  try {
    // Write comment to temporary file to avoid shell escaping issues
    const tmpCommentFile = `.iobroker-pr-comment-${prNumber}.tmp`;
    fs.writeFileSync(tmpCommentFile, comment, 'utf-8');
    
    // Add comment using --body-file
    executeGhCommand(
      `gh pr comment ${prNumber} --repo ${repositoryName} --body-file "${tmpCommentFile}"`,
    );
    
    // Clean up temporary file
    fs.unlinkSync(tmpCommentFile);
    
    // Close PR
    executeGhCommand(`gh pr close ${prNumber} --repo ${repositoryName}`);
    
    console.log(`    ✔️ PR #${prNumber} closed with comment`);
  } catch (error) {
    console.error(`    ⚠️  Warning: Could not close PR #${prNumber}:`, error.message);
  }
}

/**
 * Create new PR
 * @returns {boolean} True if PR created successfully
 */
function createPR() {
  console.log('    Creating new PR...');
  
  try {
    // Escape title for use in shell command
    const escapedTitle = prTitle
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');
    
    // Escape head branch for use in shell command
    const escapedHead = headBranch
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');
    
    // Use .iobroker-pr-body.tmp file directly with --body-file
    executeGhCommand(
      `gh pr create --repo ${repositoryName} --title "${escapedTitle}" --body-file ".iobroker-pr-body.tmp" --base ${baseBranch} --head "${escapedHead}"`,
    );
    
    console.log('    ✔️ Pull request created successfully');
    return true;
  } catch (error) {
    console.error('    ❌ Failed to create pull request');
    return false;
  }
}

// Main logic
async function main() {
  try {
    const currentUser = getCurrentUser();
    console.log(`ⓘ Current user: ${currentUser}`);
    
    // Find existing PRs with same title created by iobroker-bot
    console.log('🔍 Searching for existing PRs...');
    const existingPRs = findPRsByTitle(prTitle);
    
    let lastPr = {number: 0};
    if (existingPRs.length > 0) {
      console.log(`ⓘ Found ${existingPRs.length} existing PR(s) with same title:`);
      for (const pr of existingPRs) {
        if (pr.number > lastPr.number) {
          lastPr = pr;
        }
      }
      existingPRs.forEach((pr) => {
        console.log(`    - PR #${pr.number}: ${pr.state}${pr.merged ? ' (merged)' : ''}${pr.closedBy ? ` (closed by ${pr.closedBy})` : ''} ${pr.number === lastPr.number?' ***':''}`);
      });
    } else {
      console.log('ⓘ No existing PRs found with same title');
    }
    
    // Filter PRs by state
    const openPRs = existingPRs.filter((pr) => pr.open);
    const mergedPRs = existingPRs.filter((pr) => pr.merged);
    const closedByOthersPRs = existingPRs.filter(
      (pr) => pr.closed && !pr.merged && pr.closedBy && pr.closedBy !== currentUser,
    );
    
    // Handle different modes
    switch (mode) {
      case 'force creation':
        console.log('📋 Mode: Force Creation');
        // Close all open PRs and create new one
        if (openPRs.length > 0) {
          console.log(`⚠️  Closing ${openPRs.length} existing open PR(s)...`);
          for (const pr of openPRs) {
            closePRWithComment(
              pr.number,
              'This PR is being closed because a new PR will be created with updated changes.',
            );
          }
        }
        if (!createPR()) {
          process.exit(1);
        }
        break;
        
      case 'recreate':
        console.log('📋 Mode: Recreate');
        // Close existing open PRs
        if (openPRs.length > 0) {
          console.log(`⚠️  Closing ${openPRs.length} existing open PR(s)...`);
          for (const pr of openPRs) {
            closePRWithComment(
              pr.number,
              'This PR is being closed because a new PR will be created with updated changes.',
            );
          }
        } else {
          // if no open PR exists check if newest PR has been closed by others without merging
          if (closedByOthersPRs.length > 0) {
            console.log('⚠️  PR was previously closed by someone other than iobroker-bot without merging');
            console.log('ℹ️  Skipping PR creation (existing closed PR will not be reopened)');
            console.log('✔️ Workflow completed successfully (no PR created)');
            process.exit(0);
          }
        }
        if (!createPR()) {
          process.exit(1);
        }
        break;
        
      case 'skip if existing':
        console.log('📋 Mode: Skip if Existing');
        if (openPRs.length > 0) {
          console.log('⚠️  Open PR(s) already exist with same title');
          console.log('ℹ️  Skipping PR creation');
          console.log('✔️ Workflow completed successfully (no PR created)');
          process.exit(0);
        }
        if (!createPR()) {
          process.exit(1);
        }
        break;
        
      case 'skip if closed':
        // check if newest PR has been closed by others without merging
        console.log('📋 Mode: Skip if Closed');
        if (closedByOthersPRs.length > 0) {
          console.log('⚠️  PR was previously closed by someone other than iobroker-bot without merging');
          console.log('ℹ️  Skipping PR creation');
          console.log('✔️ Workflow completed successfully (no PR created)');
          process.exit(0);
        }
        if (!createPR()) {
          process.exit(1);
        }
        break;
        
      case 'skip if merged':
        console.log('📋 Mode: Skip if Merged');
        if (mergedPRs.length > 0) {
          console.log('⚠️  PR with same title was already merged');
          console.log('ℹ️  Skipping PR creation');
          console.log('✔️ Workflow completed successfully (no PR created)');
          process.exit(0);
        }
        if (!createPR()) {
          process.exit(1);
        }
        break;
        
      case 'REVOKE':
        console.log('📋 Mode: REVOKE');
        console.log('ⓘ This mode will close all existing open PRs with matching title and skip PR creation');
        
        if (openPRs.length > 0) {
          console.log(`⚠️  Closing ${openPRs.length} existing open PR(s)...`);
          for (const pr of openPRs) {
            closePRWithComment(
              pr.number,
              '🚫 This PR has been **REVOKED** and is being closed.\n\nThe changes proposed in this PR are no longer applicable or have been superseded.',
            );
          }
          console.log('✔️ All open PRs have been revoked and closed');
        } else {
          console.log('ⓘ No open PRs found to revoke');
        }
        
        console.log('ℹ️  Skipping PR creation (REVOKE mode)');
        console.log('✔️ Workflow completed successfully (PRs revoked, no new PR created)');
        process.exit(0);
        break;
        
      default:
        console.error(`❌ Error: Unhandled mode "${mode}"`);
        process.exit(1);
    }
    
    console.log('✔️ Workflow completed successfully');
    
  } catch (error) {
    console.error('❌ Error in PR manager:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();

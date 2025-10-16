#!/usr/bin/env node

/**
 * prManager.js - Script to manage PR creation based on mode
 *
 * Usage: node prManager.js <mode> <repository-name> <base-branch> <head-branch>
 *
 * This script reads PR title and body from .pr-title and .pr-body files.
 *
 * This script handles different PR creation modes:
 * - force creation: Close existing open PRs and create new one
 * - recreate: Close existing open PRs, skip if closed by others, create new one
 * - skip if existing: Skip if open PR exists
 * - skip if closed: Skip if closed PR exists
 * - skip if merged: Skip if merged PR exists
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
  if (!fs.existsSync('.pr-title')) {
    console.error('❌ Error: .pr-title file not found');
    process.exit(1);
  }
  
  if (!fs.existsSync('.pr-body')) {
    console.error('❌ Error: .pr-body file not found');
    process.exit(1);
  }
  
  // Read PR title for display and matching
  prTitle = fs.readFileSync('.pr-title', 'utf-8').trim();
} catch (error) {
  console.error('❌ Error reading PR metadata files:', error.message);
  process.exit(1);
}

const validModes = ['force creation', 'recreate', 'skip if existing', 'skip if closed', 'skip if merged'];

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
  try {
    return execSync(command, { encoding: 'utf-8' });
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
  // Escape title for JSON query
  const escapedTitle = title.replace(/"/g, '\\"');
  
  // Search for PRs with exact title match created by current user (iobroker-bot)
  const searchQuery = `is:pr repo:${repositoryName} author:@me in:title "${escapedTitle}"`;
  const output = executeGhCommand(
    `gh search prs --json number,title,state,closedAt --repo ${repositoryName} --limit 100 -- "${searchQuery}"`,
  );
  
  const prs = JSON.parse(output);
  
  // Filter for exact title match and get additional details
  const matchingPRs = prs
    .filter((pr) => pr.title === title)
    .map((pr) => {
      // Get detailed PR info including merge status and who closed it
      const detailsOutput = executeGhCommand(
        `gh pr view ${pr.number} --repo ${repositoryName} --json number,state,merged,closedBy`,
      );
      const details = JSON.parse(detailsOutput);
      return {
        number: details.number,
        state: details.state.toUpperCase(),
        merged: details.merged || false,
        closedBy: details.closedBy ? details.closedBy.login : null,
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
  console.log(`    Closing PR #${prNumber}...`);
  
  try {
    // Write comment to temporary file to avoid shell escaping issues
    const tmpCommentFile = `.pr-comment-${prNumber}`;
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
    // Use .pr-body file directly with --body-file
    executeGhCommand(
      `gh pr create --repo ${repositoryName} --title "${prTitle}" --body-file ".pr-body" --base ${baseBranch} --head "${headBranch}"`,
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
    
    if (existingPRs.length > 0) {
      console.log(`ⓘ Found ${existingPRs.length} existing PR(s) with same title:`);
      existingPRs.forEach((pr) => {
        console.log(`    - PR #${pr.number}: ${pr.state}${pr.merged ? ' (merged)' : ''}${pr.closedBy ? ` (closed by ${pr.closedBy})` : ''}`);
      });
    } else {
      console.log('ⓘ No existing PRs found with same title');
    }
    
    // Filter PRs by state
    const openPRs = existingPRs.filter((pr) => pr.state === 'OPEN');
    const mergedPRs = existingPRs.filter((pr) => pr.merged);
    const closedByOthersPRs = existingPRs.filter(
      (pr) => pr.state === 'CLOSED' && !pr.merged && pr.closedBy && pr.closedBy !== currentUser,
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
        // Check if closed by others without merging
        if (closedByOthersPRs.length > 0) {
          console.log('⚠️  PR was previously closed by someone other than iobroker-bot without merging');
          console.log('ℹ️  Skipping PR creation (existing closed PR will not be reopened)');
          console.log('✔️ Workflow completed successfully (no PR created)');
          process.exit(0);
        }
        // Close existing open PRs
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

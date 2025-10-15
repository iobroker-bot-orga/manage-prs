#!/usr/bin/env node

/**
 * createPR.js - Script to apply template changes to a repository
 *
 * Usage: node createPR.js <repository-name> <template-name> [parameter-data]
 *
 * This script is called by the GitHub Actions workflow to apply
 * template changes to a target repository.
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const { execSync } = require('child_process');
const { exec } = require('node:child_process');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Missing required arguments');
  console.error(
    'Usage: node createPR.js <repository-name> <template-name> [parameter-data]',
  );
  process.exit(1);
}

const repositoryName = args[0];
const templateName = args[1];
const parameterData = args[2] || '';

console.log(`ⓘ Processing repository: ${repositoryName}`);
console.log(`ⓘ Using template: ${templateName}`);
if (parameterData) {
  console.log(`Parameter data: ${parameterData}`);
}

/**
 * Make an authenticated GitHub API request
 *
 * @param {string} path - API path
 * @param {string} method - HTTP method
 * @param {object} data - Request body data (optional)
 * @returns {Promise<object>} - Response data
 */
function makeGitHubApiRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'manage-prs-script',
      'Accept': 'application/vnd.github.v3+json',
    };

    // Use GITHUB_TOKEN if available for authentication
    if (process.env.GH_TOKEN) {
      const token = process.env.GH_TOKEN;
      headers['Authorization'] = `token ${token}`;
    }

    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: headers,
    };

    if (data) {
      const body = JSON.stringify(data);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            resolve(parsed);
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`❌ GitHub API returned status code: ${res.statusCode}, body: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Check for existing PRs with the same title created by iobroker-bot
 *
 * @param {string} repoName - Repository name in format 'owner/repo'
 * @param {string} prTitle - PR title to search for
 * @returns {Promise<object>} - Object with openPRs and closedPRs arrays
 */
async function checkExistingPRs(repoName, prTitle) {
  try {
    console.log('⏳ Checking for existing PRs...');
    
    // Get all PRs (open and closed) created by iobroker-bot or github-actions bot
    const allPRs = await makeGitHubApiRequest(
      `/repos/${repoName}/pulls?state=all&per_page=100`,
      'GET'
    );

    // Filter PRs by title and creator
    const matchingPRs = allPRs.filter(pr => 
      pr.title === prTitle && 
      (pr.user.login === 'iobroker-bot' || 
       pr.user.login === 'github-actions[bot]' ||
       pr.user.login.includes('iobroker'))
    );

    const openPRs = matchingPRs.filter(pr => pr.state === 'open');
    const closedPRs = matchingPRs.filter(pr => pr.state === 'closed' && !pr.merged_at);

    console.log(`✔️ Found ${openPRs.length} open PR(s) and ${closedPRs.length} closed (non-merged) PR(s) with matching title`);

    return { openPRs, closedPRs };
  } catch (e) {
    console.warn(`⚠️ Warning: Could not check existing PRs: ${e.message}`);
    return { openPRs: [], closedPRs: [] };
  }
}

/**
 * Close existing open PRs and add a comment
 *
 * @param {string} repoName - Repository name in format 'owner/repo'
 * @param {Array} prs - Array of PR objects to close
 * @returns {Promise<void>}
 */
async function closeExistingPRs(repoName, prs) {
  for (const pr of prs) {
    try {
      console.log(`⏳ Closing PR #${pr.number}: ${pr.title}`);
      
      // Add comment
      await makeGitHubApiRequest(
        `/repos/${repoName}/issues/${pr.number}/comments`,
        'POST',
        { body: 'This PR is being closed because a new PR with updated changes will be created.' }
      );
      
      // Close the PR
      await makeGitHubApiRequest(
        `/repos/${repoName}/pulls/${pr.number}`,
        'PATCH',
        { state: 'closed' }
      );
      
      console.log(`✔️ Closed PR #${pr.number}`);
    } catch (e) {
      console.error(`❌ Error closing PR #${pr.number}: ${e.message}`);
    }
  }
}

/**
 * Check if a GitHub repository exists
 *
 * @param {string} repoName - Repository name in format 'owner/repo'
 * @returns {Promise<boolean>} - True if repository exists, false otherwise
 */
function checkRepositoryExists(repoName) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'manage-prs-script',
      Accept: 'application/vnd.github.v3+json',
    };

    // Use GITHUB_TOKEN if available for authentication
    if (process.env.GH_TOKEN) {
      const token = process.env.GH_TOKEN;
      headers['Authorization'] = `token ${token}`;
    }

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repoName}`,
      method: 'GET',
      headers: headers,
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else if (res.statusCode === 404) {
        resolve(false);
      } else {
        reject(new Error(`❌ GitHub API returned status code: ${res.statusCode}`));
      }
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Check if template files exists
 *
 * @param {string} templateName - Name of the template
 * @returns {boolean} - True if template files exist
 */
function checkTemplateExists(templateName) {
  const scriptDir = path.dirname(__filename);
  const templatePath = path.join(scriptDir, 'templates', templateName);

  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Error: Template ${templateName} does not exist.`);
    return false;
  }

  // Check if it's a directory
  if (!fs.statSync(templatePath).isDirectory) {
    console.error(`❌ Error: Template directory ${templatePath} is no directory`);
    return false;
  }

  // Check if requires files exist
  for (let file of ['description.md', 'build.js']) {
    const fileName = `${templatePath}/${file}`;
    if (!fs.existsSync(fileName)) {
      console.error(`❌ Error: ${fileName} does not exist`);
      return false;
    }
  }

  return true;
}

/**
 * Read and parse template markdown file
 *
 * @param {string} templateName - Name of the template
 * @returns {object} - Object with title and body properties
 */
function parseTemplateMarkdown(templateName) {
  const scriptDir = path.dirname(__filename);
  const templatePath = path.join(scriptDir, 'templates', templateName, 'description.md');

  const content = fs.readFileSync(templatePath, 'utf-8');
  const lines = content.split('\n');

  // First line is the title
  const title = lines[0].trim();

  // Remaining lines are the body
  const body = lines.slice(1).join('\n').trim();

  return { title, body };
}

/**
 * Execute template script
 *
 * @param {string} templateName - Name of the template
 * @returns {none}
 */
function execTemplateScript(templateName) {
  const scriptDir = path.dirname(__filename);
  const templateScript = path.join(scriptDir, 'templates', templateName, 'build.js');

  const cmd = `node ${templateScript}`;
  console.log(`⏳ starting ${cmd}`);
  execSync(cmd, {stdio: 'inherit'});
  console.log(`✔️ finished `);
  return;
}

// Main function
async function main() {
  try {
    // Validate template exists first (doesn't require API call)
    const templateExists = checkTemplateExists(templateName);
    if (!templateExists) {
      process.exit(1);
    }
    console.log(`✔️ Template files for template ${templateName} exist`);

    // Validate repository exists
    try {
      const repoExists = await checkRepositoryExists(repositoryName);
      if (!repoExists) {
        console.error(
          `❌ Error: Repository '${repositoryName}' does not exist or is not accessible`,
        );
        process.exit(1);
      }
      console.log(`✔️ Repository ${repositoryName} exists`);
    } catch (e) {
      // If repository check fails due to API issues, log warning but continue
      if (e.message.includes('403')) {
        console.warn(
          `Warning: Could not verify repository existence (API rate limit). Continuing anyway...`,
        );
      } else {
        throw e;
      }
    }


    // Execute template script
    console.log('⚙️ Processing ...');
    execTemplateScript(templateName);
    console.log('✔️ All changes applied');

    // Parse template markdown file for PR title and body
    console.log('Reading template markdown file...');
    const templateData = parseTemplateMarkdown(templateName);
    console.log(`✔️ Template markdown exists, title: ${templateData.title}`);

    // Prepend '[iobroker-bot] ' to the title
    const prTitle = `[iobroker-bot] ${templateData.title}`;

    // Check for existing PRs with the same title
    const { openPRs, closedPRs } = await checkExistingPRs(repositoryName, prTitle);

    // If there are open PRs, close them
    if (openPRs.length > 0) {
      console.log(`⚠️ Found ${openPRs.length} open PR(s) with the same title. Closing them...`);
      await closeExistingPRs(repositoryName, openPRs);
    }

    // Check if there are closed PRs that were closed by someone other than iobroker-bot
    const closedByOthers = [];
    for (const pr of closedPRs) {
      try {
        // Get PR events to find who closed it
        const events = await makeGitHubApiRequest(
          `/repos/${repositoryName}/issues/${pr.number}/events`,
          'GET'
        );
        
        const closeEvent = events.find(event => event.event === 'closed');
        if (closeEvent && 
            closeEvent.actor && 
            closeEvent.actor.login !== 'iobroker-bot' && 
            closeEvent.actor.login !== 'github-actions[bot]' &&
            !closeEvent.actor.login.includes('iobroker')) {
          closedByOthers.push({ pr, closedBy: closeEvent.actor.login });
        }
      } catch (e) {
        console.warn(`⚠️ Warning: Could not check who closed PR #${pr.number}: ${e.message}`);
      }
    }

    // If there are PRs closed by others, don't create a new PR
    if (closedByOthers.length > 0) {
      console.error('❌ Cannot create PR: Found PR(s) with the same title that were closed by someone other than iobroker-bot:');
      for (const { pr, closedBy } of closedByOthers) {
        console.error(`   - PR #${pr.number} was closed by ${closedBy}: ${pr.html_url}`);
      }
      console.error('This indicates that the changes may not be wanted. Please review manually.');
      process.exit(1);
    }

    // Build PR body with template body, template name, and parameter data
    let prBody = templateData.body;
    prBody += '\n\n---\n\n';
    prBody += `**Template**: ${templateName}\n`;
    if (parameterData) {
      prBody += `**Parameters**: ${parameterData}\n`;
    }

    // Write PR metadata to files for the workflow to use
    const prTitleFile = path.join(process.cwd(), '.pr-title');
    const prBodyFile = path.join(process.cwd(), '.pr-body');

    fs.writeFileSync(prTitleFile, prTitle);
    console.log(`✔️ Created PR title file: ${prTitleFile}`);

    fs.writeFileSync(prBodyFile, prBody);
    console.log(`✔️ Created PR body file: ${prBodyFile}`);

  } catch (e) {
    console.error('❌ Error applying template:', e.message);
    process.exit(1);
  }
}

// Run the main function
main();

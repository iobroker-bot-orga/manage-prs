#!/usr/bin/env node

/**
 * createPR.js - Script to apply template changes to a repository
 * 
 * Usage: node createPR.js <repository-name> <template-name>
 * 
 * This script is called by the GitHub Actions workflow to apply
 * template changes to a target repository.
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
//const { execSync } = require('child_process');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Error: Missing required arguments');
  console.error('Usage: node createPR.js <repository-name> <template-name>');
  process.exit(1);
}

const repositoryName = args[0];
const templateName = args[1];

console.log(`Processing repository: ${repositoryName}`);
console.log(`Using template: ${templateName}`);

/**
 * Check if a GitHub repository exists
 * @param {string} repoName - Repository name in format "owner/repo"
 * @returns {Promise<boolean>} - True if repository exists, false otherwise
 */
function checkRepositoryExists(repoName) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'manage-prs-script',
      'Accept': 'application/vnd.github.v3+json'
    };
    
    // Use GITHUB_TOKEN if available for authentication
    if (process.env.GITHUB_TOKEN || process.env.GH_TOKEN) {
      const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
      headers['Authorization'] = `token ${token}`;
    }
    
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repoName}`,
      method: 'GET',
      headers: headers
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else if (res.statusCode === 404) {
        resolve(false);
      } else {
        reject(new Error(`GitHub API returned status code: ${res.statusCode}`));
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
 * @param {string} templateName - Name of the template
 * @returns {boolean} - True if template files exist
 */
function checkTemplateExists(templateName) {
  const scriptDir = path.dirname(__filename);
  const templatePath = path.join(scriptDir, 'templates');
  
  if (!fs.existsSync(templatePath)) {
    console.error(`Error: Template directory ${templatePath} missing`);
    return false;
  }
  
  // Check if it's a directory
  if (!fs.statSync(templatePath).isDirectory) {
    console.error(`Error: Template directory ${templatePath} is no directory`);
    return false;
  }

  // Check if requires files exist
  for (let fileExtension of ['md', 'js']){
    const fileName = `${templatePath}/${templateName}.${fileExtension}`;
    if (!fs.existsSync(fileName)) {
      console.error(`Error: ${fileName} does not exist`);
      return false;
    }
  }

  return true;
}

// Main function
async function main() {
  try {
    // Validate template exists first (doesn't require API call)
    console.log(`Validating template: ${templateName}...`);
    const templateExists = checkTemplateExists(templateName);
    if (!templateExists) {
      process.exit(1);
    }
    console.log(`✓ Template files exist`);
    
    // Validate repository exists
    console.log(`Validating repository: ${repositoryName}...`);
    try {
      repoExists = await checkRepositoryExists(repositoryName);     
      if (!repoExists) {
        console.error(`Error: Repository "${repositoryName}" does not exist or is not accessible`);
        process.exit(1);
      }
      console.log(`✓ Repository ${repositoryName} exists`);
    } catch (e) {
      // If repository check fails due to API issues, log warning but continue
      if (e.message.includes('403')) {
        console.warn(`Error: Could not verify repository existence (API rate limit). Proceeding anyway...`);
        process.exit(1);
      } else {
        throw error;
      }
    }
        
    console.log('Processing ...');
    
    // Example: Create a marker file to show the script ran
    const markerFile = path.join(process.cwd(), '.template-applied');
    const content = `Template: ${templateName}\nRepository: ${repositoryName}\nApplied: ${new Date().toISOString()}\n`;
    
    fs.writeFileSync(markerFile, content);
    console.log(`Created marker file: ${markerFile}`);
    
    console.log('Template application completed successfully');
  } catch (e) {
    console.error('Error applying template:', e.message);
    process.exit(1);
  }
}

// Run the main function
main();

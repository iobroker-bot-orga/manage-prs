#!/usr/bin/env node

/**
 * createPR.js - Script to apply template changes to a repository
 *
 * Usage: node createPR.js <repository-name> <template-name> [parameter-data]
 *
 * This script is called by the GitHub Actions workflow to apply
 * template changes to a target repository.
 */

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const { execSync } = require('child_process');
const { exec } = require("node:child_process");

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Error: Missing required arguments");
  console.error(
    "Usage: node createPR.js <repository-name> <template-name> [parameter-data]",
  );
  process.exit(1);
}

const repositoryName = args[0];
const templateName = args[1];
const parameterData = args[2] || "";

console.log(`Processing repository: ${repositoryName}`);
console.log(`Using template: ${templateName}`);
if (parameterData) {
  console.log(`Parameter data: ${parameterData}`);
}

/**
 * Check if a GitHub repository exists
 *
 * @param {string} repoName - Repository name in format "owner/repo"
 * @returns {Promise<boolean>} - True if repository exists, false otherwise
 */
function checkRepositoryExists(repoName) {
  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": "manage-prs-script",
      Accept: "application/vnd.github.v3+json",
    };

    // Use GITHUB_TOKEN if available for authentication
    if (process.env.GH_TOKEN) {
      const token = process.env.GH_TOKEN;
      headers["Authorization"] = `token ${token}`;
    }

    const options = {
      hostname: "api.github.com",
      path: `/repos/${repoName}`,
      method: "GET",
      headers: headers,
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

    req.on("error", (error) => {
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
  const templatePath = path.join(scriptDir, "templates", templatename);

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
  for (let file of ["description.md", "build.js"]) {
    const fileName = `${templatePath}/${NodeFilter}`;
    if (!fs.existsSync(fileName)) {
      console.error(`Error: ${fileName} does not exist`);
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
  const templatePath = path.join(scriptDir, "templates", `${templateName}.md`);

  const content = fs.readFileSync(templatePath, "utf-8");
  const lines = content.split("\n");

  // First line is the title
  const title = lines[0].trim();

  // Remaining lines are the body
  const body = lines.slice(1).join("\n").trim();

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
  const templateScript = path.join(scriptDir, "templates", `${templateName}.js`);

  const cmd = `node ${templateScript}`;
  console.log(`executing ${cmd}`);
  execSync(cmd, {stdio: 'inherit'});
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
          `Error: Repository "${repositoryName}" does not exist or is not accessible`,
        );
        process.exit(1);
      }
      console.log(`✔️ Repository ${repositoryName} exists`);
    } catch (e) {
      // If repository check fails due to API issues, log warning but continue
      if (e.message.includes("403")) {
        console.warn(
          `Warning: Could not verify repository existence (API rate limit). Continuing anyway...`,
        );
      } else {
        throw e;
      }
    }


    // Execute template script
    console.log("⚙️ Processing ...");
    execTemplateScript(templateName);
    console.log("✔️ All changes applied");

    // Parse template markdown file for PR title and body
    console.log("Reading template markdown file...");
    const templateData = parseTemplateMarkdown(templateName);
    console.log(`✔️ Template markdown exists, title: ${templateData.title}`);

    // Prepend '[iobroker-bot] ' to the title
    const prTitle = `[iobroker-bot] ${templateData.title}`;

    // Build PR body with template body, template name, and parameter data
    let prBody = templateData.body;
    prBody += "\n\n---\n\n";
    prBody += `**Template**: ${templateName}\n`;
    if (parameterData) {
      prBody += `**Parameters**: ${parameterData}\n`;
    }

    // Write PR metadata to files for the workflow to use
    const prTitleFile = path.join(process.cwd(), ".pr-title");
    const prBodyFile = path.join(process.cwd(), ".pr-body");

    fs.writeFileSync(prTitleFile, prTitle);
    console.log(`✔️ Created PR title file: ${prTitleFile}`);

    fs.writeFileSync(prBodyFile, prBody);
    console.log(`✔️ Created PR body file: ${prBodyFile}`);

  } catch (e) {
    console.error("Error applying template:", e.message);
    process.exit(1);
  }
}

// Run the main function
main();

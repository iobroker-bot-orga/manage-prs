// This script implements the required changes for a PR 
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR. 

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

// Define paths
const workflowsDir = '.github/workflows';
const newWorkflowPath = path.join(workflowsDir, 'automerge-iobroker-bot.yml');

let changesMade = false;

// Ensure .github/workflows directory exists
if (!fs.existsSync(workflowsDir)) {
  fs.mkdirSync(workflowsDir, { recursive: true });
  console.log(`✔️ Created directory: ${workflowsDir}`);
}

// Create or update automerge-iobroker-bot.yml workflow
const workflowContent = `# Workflow for auto-merging ioBroker-Bot PRs
# This workflow uses the action-automerge-iobroker-bot action to automatically merge
# PRs created by ioBroker-Bot if all required checks pass successfully.

name: Auto-Merge ioBroker-Bot PRs

on:
  pull_request_target:
    types: [opened, synchronize, reopened, edited]

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'ioBroker-Bot'

    permissions:
      contents: write
      pull-requests: write

    steps:
      - name: Auto-merge ioBroker-Bot PRs
        uses: iobroker-bot-orga/action-automerge-iobroker-bot@v1
        with:
          github-token: \${{ secrets.AUTO_MERGE_TOKEN_IOBROKER_BOT }}
          pull-request-ref: \${{ github.event.pull_request.number }}
`;

// Check if workflow already exists and compare content
if (fs.existsSync(newWorkflowPath)) {
  const existingContent = fs.readFileSync(newWorkflowPath, 'utf8');
  if (existingContent !== workflowContent) {
    fs.writeFileSync(newWorkflowPath, workflowContent, 'utf8');
    console.log(`✔️ Updated workflow: ${newWorkflowPath}`);
    changesMade = true;
  } else {
    console.log(`ⓘ ${newWorkflowPath} already exists and is up to date.`);
  }
} else {
  fs.writeFileSync(newWorkflowPath, workflowContent, 'utf8');
  console.log(`✔️ Created workflow: ${newWorkflowPath}`);
  changesMade = true;
}

if (!changesMade) {
  console.log('ⓘ No changes were made.');
  process.exit(0);
}

console.log(`✔️ processing completed`);

process.exit(0);

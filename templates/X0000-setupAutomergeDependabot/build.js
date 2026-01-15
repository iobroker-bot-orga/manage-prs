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
const oldWorkflowPaths = [
  path.join(workflowsDir, 'dependabot-automerge.yml'),
  path.join(workflowsDir, 'dependabot-auto-merge.yml')
];
const newWorkflowPath = path.join(workflowsDir, 'automerge-dependabot.yml');
const autoMergeConfigPath = '.github/auto-merge.yml';

let changesMade = false;

// Ensure .github/workflows directory exists
if (!fs.existsSync(workflowsDir)) {
  fs.mkdirSync(workflowsDir, { recursive: true });
  console.log(`✔️ Created directory: ${workflowsDir}`);
}

// Rename existing old automerge workflows
for (const oldPath of oldWorkflowPaths) {
  if (fs.existsSync(oldPath)) {
    const newOldPath = oldPath + '.OLD';
    fs.renameSync(oldPath, newOldPath);
    console.log(`✔️ Renamed ${oldPath} to ${newOldPath}`);
    changesMade = true;
  }
}

// Create new automerge-dependabot.yml workflow
const workflowContent = `# Workflow for auto-merging Dependabot PRs
# This workflow uses the action-automerge-dependabot action to automatically merge
# Dependabot PRs based on the rules defined in .github/auto-merge.yml

name: Auto-Merge Dependabot PRs

on:
  # Trigger when a PR is opened or updated
  # WARNING: This needs to be run in the PR base, DO NOT build untrusted code in this action
  pull_request_target:
    types: [opened, synchronize, reopened]

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    # Only run if actor is dependabot
    if: github.actor == 'dependabot[bot]'
    
    permissions:
      contents: write
      pull-requests: write
      
    steps:
      - name: Auto-merge Dependabot PRs
        uses: iobroker-bot-orga/action-automerge-dependabot@v1
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
          # Optional: Path to your auto-merge configuration file
          # config-file-path: '.github/auto-merge.yml'
          # Optional: Merge method (merge, squash, or rebase)
          # merge-method: 'squash'
          # Optional: Wait for other checks to complete
          # wait-for-checks: 'true'
          # Optional: Maximum time to wait for checks in seconds (default: 3600)
          # max-wait-time: '3600'
`;

fs.writeFileSync(newWorkflowPath, workflowContent, 'utf8');
console.log(`✔️ Created workflow: ${newWorkflowPath}`);
changesMade = true;

// Create auto-merge.yml configuration if it doesn't exist
if (!fs.existsSync(autoMergeConfigPath)) {
  const autoMergeConfig = `# Auto-merge configuration for Dependabot PRs
# This file configures which dependency updates should be merged automatically.

# Configure here which dependency updates should be merged automatically.
# The recommended configuration is the following:
- match:
    # Merge patch updates for production dependencies
    dependency_type: production
    update_type: 'semver:patch'
- match:
    # Merge patch and minor updates for development dependencies
    dependency_type: development
    update_type: 'semver:minor'

# The syntax is based on the legacy dependabot v1 automerged_updates syntax, see:
# https://dependabot.com/docs/config-file/#automerged_updates

# IMPORTANT: Hierarchical matching applies:
# - semver:patch → only patch updates (e.g., 1.0.0 → 1.0.1)
# - semver:minor → patch AND minor updates (e.g., 1.0.0 → 1.0.1 or 1.0.0 → 1.1.0)
# - semver:major → patch, minor, AND major updates (all version changes)

# Additional examples:

# Allow all patch updates only (both production and development):
# - match:
#     update_type: 'semver:patch'

# Allow patch and minor updates for development dependencies:
# - match:
#     dependency_type: development
#     update_type: 'semver:minor'

# Allow all updates (patch, minor, and major) for development dependencies:
# - match:
#     dependency_type: development
#     update_type: 'semver:major'
`;

  fs.writeFileSync(autoMergeConfigPath, autoMergeConfig, 'utf8');
  console.log(`✔️ Created auto-merge configuration: ${autoMergeConfigPath}`);
  changesMade = true;
} else {
  console.log(`ⓘ ${autoMergeConfigPath} already exists, skipping creation.`);
}

if (!changesMade) {
  console.log('ⓘ No changes were made.');
  process.exit(0);
}

console.log(`✔️ processing completed`);

process.exit(0);

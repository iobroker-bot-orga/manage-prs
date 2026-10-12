// This script implements the required changes for a PR 
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of a PR. 

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

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

// Detect whether the workflow managed by this template already exists and uses action-automerge-dependabot
const existingAutomergeWorkflow = (() => {
  if (!fs.existsSync(newWorkflowPath)) return null;
  const content = fs.readFileSync(newWorkflowPath, 'utf8');
  return content.includes('iobroker-bot-orga/action-automerge-dependabot')
    ? path.basename(newWorkflowPath)
    : null;
})();

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

// Create or update automerge-dependabot.yml workflow
const workflowContent = `# Workflow for auto-merging Dependabot PRs
# This workflow uses the action-automerge-dependabot action to automatically merge
# Dependabot PRs based on the rules defined in .github/auto-merge.yml

name: Auto-Merge Dependabot PRs

on:
  # Trigger when a PR is opened or updated
  # Normally pull_request gets a GITHUB_TOKEN with read access only.
  # But workflows run for PRs created by dependabot get write access anyway,
  # so the less secure 'pull_request_target' trigger is not required.
  pull_request:
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

// Validate workflow content is valid YAML before writing
try {
  yaml.load(workflowContent);
} catch (e) {
  console.error(`❌ Generated workflow content is not valid YAML: ${e.message}`);
  process.exit(1);
}

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

updatePrBody(existingAutomergeWorkflow);

console.log(`✔️ processing completed`);

process.exit(0);

/**
 * Replace placeholders in .iobroker-pr-body.tmp with dynamic content
 * depending on whether an existing workflow using action-automerge-dependabot
 * was detected in the target repository.
 *
 * @param {string|null} existingWorkflow - filename of the detected workflow, or null
 */
function updatePrBody(existingWorkflow) {
  const bodyFile = '.iobroker-pr-body.tmp';
  if (!fs.existsSync(bodyFile)) {
    console.log(`ⓘ ${bodyFile} not found - skipping PR body customization`);
    return;
  }

  const isUpdate = existingWorkflow !== null;

  const introEn = isUpdate
    ? `This PR adapts the existing automatic merging setup for Dependabot pull requests. ` +
      `An existing workflow using \`iobroker-bot-orga/action-automerge-dependabot\` was detected ` +
      `(\`${existingWorkflow}\`) and will be updated.`
    : `This PR sets up automatic merging for Dependabot pull requests using a new GitHub Actions workflow.`;

  const introDE = isUpdate
    ? `Diese PR passt die vorhandene Einrichtung zum automatischen Mergen von Dependabot-Pull-Requests an. ` +
      `Ein bestehender Workflow, der \`iobroker-bot-orga/action-automerge-dependabot\` verwendet, ` +
      `wurde gefunden (\`${existingWorkflow}\`) und wird aktualisiert.`
    : `Diese PR richtet das automatische Mergen von Dependabot-Pull-Requests mithilfe eines neuen GitHub Actions Workflows ein.`;

  const backgroundExtraEN =
    `Additionally, GitHub will **block the \`pull_request_target\` trigger by default starting November 2, 2026** ` +
    `for workflows triggered by Dependabot. Existing workflows using \`pull_request_target\` need to be migrated ` +
    `to \`pull_request\` before that date. This PR uses the \`pull_request\` trigger, which is sufficient for ` +
    `Dependabot PRs because GitHub grants write-access tokens to workflows triggered by Dependabot even with the ` +
    `standard \`pull_request\` event.`;

  const backgroundExtraDE =
    `Darüber hinaus wird GitHub den \`pull_request_target\`-Trigger **ab dem 2. November 2026 standardmäßig blockieren**, ` +
    `wenn er durch Dependabot ausgelöst wird. Bestehende Workflows, die \`pull_request_target\` verwenden, müssen vor ` +
    `diesem Datum auf \`pull_request\` migriert werden. Diese PR verwendet den \`pull_request\`-Trigger, der für ` +
    `Dependabot-PRs ausreicht, da GitHub Workflows, die durch Dependabot ausgelöst werden, auch beim Standard-` +
    `\`pull_request\`-Event Write-Access-Tokens gewährt.`;

  const workflowPointEN = isUpdate
    ? `**Updates existing workflow**: The existing workflow file \`.github/workflows/${existingWorkflow}\` ` +
      `is updated to use the \`pull_request\` trigger instead of \`pull_request_target\`. ` +
      `This is required because GitHub will block \`pull_request_target\` for Dependabot by default starting November 2, 2026.`
    : `**Creates a new workflow**: A new workflow file \`.github/workflows/automerge-dependabot.yml\` is created. ` +
      `This workflow automatically triggers when Dependabot opens or updates pull requests.`;

  const workflowPointDE = isUpdate
    ? `**Aktualisiert vorhandenen Workflow**: Die vorhandene Workflow-Datei \`.github/workflows/${existingWorkflow}\` ` +
      `wird aktualisiert, um den \`pull_request\`-Trigger anstelle von \`pull_request_target\` zu verwenden. ` +
      `Dies ist erforderlich, da GitHub \`pull_request_target\` für Dependabot ab dem 2. November 2026 standardmäßig blockieren wird.`
    : `**Erstellt einen neuen Workflow**: Eine neue Workflow-Datei \`.github/workflows/automerge-dependabot.yml\` wird erstellt. ` +
      `Dieser Workflow wird automatisch ausgelöst, wenn Dependabot Pull Requests öffnet oder aktualisiert.`;

  let body = fs.readFileSync(bodyFile, 'utf8');
  body = body.replace('{{INTRO_EN}}', introEn);
  body = body.replace('{{INTRO_DE}}', introDE);
  body = body.replace('{{BACKGROUND_EXTRA_EN}}', backgroundExtraEN);
  body = body.replace('{{BACKGROUND_EXTRA_DE}}', backgroundExtraDE);
  body = body.replace('{{WORKFLOW_POINT_EN}}', workflowPointEN);
  body = body.replace('{{WORKFLOW_POINT_DE}}', workflowPointDE);

  fs.writeFileSync(bodyFile, body, 'utf8');
  console.log(`✔️ Updated PR body with dynamic content (${isUpdate ? 'update' : 'new setup'} mode)`);
}

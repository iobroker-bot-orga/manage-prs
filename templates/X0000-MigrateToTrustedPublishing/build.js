// This script implements the required changes for a PR 
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of an PR. 

const fs = require('node:fs');
const path = require('node:path');

const workflowPath = '.github/workflows/test-and-release.yml';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Missing required arguments');
  process.exit(1);
}

const templateName = args[0];
const repositoryName = args[1];
const parameterData = args[2] || '';

// Check if test-and-release.yml exists
if (!fs.existsSync(workflowPath)) {
    console.log(`ⓘ ${workflowPath} does not exist, no changes needed.`);
    process.exit(0);
}

console.log(`✔️ ${workflowPath} exists.`);

// Read the workflow file
let workflowContent = fs.readFileSync(workflowPath, 'utf8');

// Check if the workflow uses ioBroker/testing-action-deploy@v1
if (!workflowContent.includes('ioBroker/testing-action-deploy@v1')) {
    console.log(`ⓘ Workflow does not use action 'ioBroker/testing-action-deploy@v1', no changes needed.`);
    process.exit(0);
}

console.log(`✔️ Workflow uses action 'ioBroker/testing-action-deploy@v1'.`);

// Check if npm-token is used anywhere in the workflow after the deploy action
// Look for npm-token in the context of the deploy action
if (!workflowContent.includes('npm-token:')) {
    console.log(`ⓘ Action 'ioBroker/testing-action-deploy@v1' does not use parameter 'npm-token', no changes needed.`);
    process.exit(0);
}

// Check if npm-token is already commented out
// If it's already commented, we consider it as 'not present' and exit
const npmTokenLines = workflowContent.split('\n').filter(line => line.includes('npm-token:'));
const allCommented = npmTokenLines.every(line => line.trim().startsWith('#'));
if (allCommented && npmTokenLines.length > 0) {
    console.log(`ⓘ Parameter 'npm-token' is already commented out, no changes needed.`);
    process.exit(0);
}

// Verify npm-token is actually in the deploy action context
// Find the line with the deploy action
let lines = workflowContent.split('\n');
let deployActionLineIndex = -1;
let foundNpmToken = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ioBroker/testing-action-deploy@v1')) {
        deployActionLineIndex = i;
        // Check following lines for npm-token within the same step
        // We need to look for the 'with:' block and its children
        let inWithBlock = false;
        
        for (let j = i + 1; j < lines.length; j++) {
            const line = lines[j];
            const trimmed = line.trim();
            
            // Skip empty lines
            if (!trimmed) continue;
            
            // If we find 'with:', we're in the with block
            if (trimmed === 'with:') {
                inWithBlock = true;
                continue;
            }
            
            // If we're in the with block and find npm-token (not commented out), we're done
            if (inWithBlock && line.includes('npm-token:')) {
                // Check if the line is commented out
                if (!trimmed.startsWith('#')) {
                    foundNpmToken = true;
                    break;
                }
            }
            
            // If we hit a new step (line starting with '-' at similar indent) or a key at lower indent, stop
            const currentLineIndent = line.match(/^(\s*)/)[1].length;
            const usesLineIndent = lines[i].match(/^(\s*)/)[1].length;
            
            if (line.match(/^\s*-\s+/) && currentLineIndent <= usesLineIndent) {
                // New step
                break;
            }
            
            if (inWithBlock && line.match(/^\s+\w+:/) && currentLineIndent <= usesLineIndent) {
                // New key at step level, we're out of the with block
                break;
            }
        }
        
        if (foundNpmToken) {
            break;
        }
    }
}

if (!foundNpmToken) {
    console.log(`ⓘ Action 'ioBroker/testing-action-deploy@v1' does not use parameter 'npm-token', no changes needed.`);
    process.exit(0);
}

console.log(`✔️ Found 'npm-token' parameter in action 'ioBroker/testing-action-deploy@v1'.`);

/**
 * Detect the base indentation unit used in the file by analyzing the difference between nested levels
 *
 * @param {Array<string>} lines - The lines of the file
 * @param {number} startIndex - Where to start looking
 * @param {number} endIndex - Where to stop looking
 * @returns {number} The detected base indent (e.g., 2 or 4)
 */
function detectBaseIndent(lines, startIndex, endIndex) {
    const indents = [];
    for (let i = startIndex; i < Math.min(endIndex, lines.length); i++) {
        const line = lines[i];
        if (line.trim().length === 0) {
            continue;
        }
        const match = line.match(/^(\s+)/);
        if (match) {
            indents.push(match[1].length);
        }
    }

    // Find the smallest non-zero difference between indentation levels
    indents.sort((a, b) => a - b);
    let minDiff = Infinity;
    for (let i = 1; i < indents.length; i++) {
        const diff = indents[i] - indents[i - 1];
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
        }
    }

    // Default to 4 if we can't detect or if the difference is unusually large
    // (8 is chosen as threshold because typical indents are 2, 4, or sometimes 8 spaces)
    const MAX_REASONABLE_INDENT = 8;
    return minDiff === Infinity || minDiff > MAX_REASONABLE_INDENT ? 4 : minDiff;
}

/**
 * Detect the indentation for permission values (nested under permissions:)
 *
 * @param {Array<string>} lines - The lines of the file
 * @param {number} jobLineIndex - Index of the job definition line
 * @param {number} deployActionLineIndex - Index of the deploy action line
 * @param {number} jobPropertyIndent - Indentation for job properties
 * @param {number} permissionsLineIndex - Index of existing permissions line (-1 if none)
 * @returns {number} The indentation level for permission values
 */
function detectPermissionValueIndent(lines, jobLineIndex, deployActionLineIndex, jobPropertyIndent, permissionsLineIndex) {
    let permissionValueIndent = -1;

    if (permissionsLineIndex >= 0) {
        // Look at existing permissions values
        for (let i = permissionsLineIndex + 1; i < deployActionLineIndex; i++) {
            const line = lines[i];
            const valueMatch = line.match(/^(\s+)(contents|id-token|issues|pull-requests|packages|deployments|actions|checks|statuses|discussions):/);
            if (valueMatch) {
                permissionValueIndent = valueMatch[1].length;
                break;
            }
            // Stop if we hit another key at the same level as permissions
            const indentMatch = line.match(/^(\s+)\w+:/);
            if (indentMatch && indentMatch[1] && indentMatch[1].length === jobPropertyIndent) {
                break;
            }
        }
    } else {
        // Look for existing nested values (like in strategy.matrix, etc.)
        for (let i = jobLineIndex + 1; i < deployActionLineIndex; i++) {
            const line = lines[i];
            // Check for nested values under job properties
            const nestedMatch = line.match(/^(\s+)\S/);
            if (nestedMatch && nestedMatch[1].length > jobPropertyIndent) {
                permissionValueIndent = nestedMatch[1].length;
                break;
            }
        }
    }

    // If we couldn't detect, calculate based on base indentation
    if (permissionValueIndent === -1) {
        const baseIndent = detectBaseIndent(lines, 0, deployActionLineIndex);
        permissionValueIndent = jobPropertyIndent + baseIndent;
    }

    return permissionValueIndent;
}

// Now we need to:
// 1. Comment out the npm-token parameter
// 2. Add/update permissions for the deploy step/job

let modified = false;

// Comment out npm-token parameter
// Find and comment out the npm-token line
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('npm-token:') && i > deployActionLineIndex) {
        const trimmed = lines[i].trim();
        // Skip if already commented out (safety check)
        if (trimmed.startsWith('#')) {
            continue;
        }
        const indent = lines[i].match(/^(\s*)/)[1];
        const restOfLine = trimmed;
        lines[i] = `${indent}# ${restOfLine}  # Commented out for migration to Trusted Publishing`;
        console.log(`✔️ Commenting out npm-token parameter at line ${i + 1}.`);
        modified = true;
        break;
    }
}

if (!modified) {
    console.log(`⚠️ Could not comment out npm-token parameter.`);
}

// Now handle permissions
// Find the parent step or job containing the deploy action
if (deployActionLineIndex === -1) {
    console.log(`❌ Could not find deploy action in workflow.`);
    process.exit(1);
}

// Get the indent of the 'uses:' line
const usesLineMatch = lines[deployActionLineIndex].match(/^(\s*)-?\s*uses:/);
let deployStepIndent = 0;
if (usesLineMatch) {
    deployStepIndent = usesLineMatch[1].length;
}

// Walk backwards to find the step/job definition
let stepStartIndex = -1;
let stepIndent = -1;

// First, look for 'steps:' keyword or a step with a name
for (let i = deployActionLineIndex; i >= 0; i--) {
    const line = lines[i];
    
    // Check for 'steps:' keyword
    if (line.match(/^\s+steps:\s*$/)) {
        stepStartIndex = i;
        stepIndent = line.match(/^(\s+)/)[1].length;
        break;
    }
    
    // Check for a step with a name
    const stepMatch = line.match(/^(\s*)-\s+name:/);
    if (stepMatch) {
        const currentIndent = stepMatch[1].length;
        if (currentIndent <= deployStepIndent) {
            stepStartIndex = i;
            stepIndent = currentIndent;
            break;
        }
    }
}

// If no step found, look for job definition
if (stepStartIndex === -1) {
    for (let i = deployActionLineIndex; i >= 0; i--) {
        const line = lines[i];
        const jobMatch = line.match(/^(\s+)[\w-]+:\s*$/);
        if (jobMatch && !line.includes('jobs:')) {
            stepStartIndex = i;
            stepIndent = jobMatch[1].length;
            break;
        }
    }
}

if (stepStartIndex === -1) {
    console.log(`⚠️ Could not determine step/job boundary for permissions.`);
} else {
    console.log(`✔️ Found step/job at line ${stepStartIndex + 1}.`);
    
    // Determine if we found a step or a job
    // If the line has '- name:', it's a step. If it's just a key, it's likely part of a job
    const isStep = lines[stepStartIndex].includes('- name:');
    const isJobSteps = lines[stepStartIndex].trim() === 'steps:';
    
    // If we found 'steps:', we need to go back to the job level
    let jobLineIndex = stepStartIndex;
    let jobIndent = stepIndent;
    
    if (isJobSteps || isStep) {
        // Find the job definition by going back further
        for (let i = stepStartIndex - 1; i >= 0; i--) {
            const line = lines[i];
            const jobMatch = line.match(/^(\s+)([\w-]+):\s*$/);
            // Exclude 'jobs:', 'steps:', 'with:', 'env:', etc.
            const isJobKey = jobMatch && 
                            !line.includes('jobs:') && 
                            !line.trim().match(/^(steps|with|env|outputs|strategy|matrix|runs-on|name|needs|if|uses|run|shell|continue-on-error|timeout-minutes|environment|permissions|secrets|container|services|defaults):\s*$/);
            if (isJobKey) {
                jobLineIndex = i;
                jobIndent = jobMatch[1].length;
                console.log(`✔️ Found job definition at line ${jobLineIndex + 1}.`);
                break;
            }
        }
    }
    
    // Detect the indentation used for job-level properties
    // by looking at existing properties like 'needs:', 'runs-on:', etc.
    let jobPropertyIndent = -1;
    for (let i = jobLineIndex + 1; i < deployActionLineIndex; i++) {
        const line = lines[i];
        const match = line.match(/^(\s+)(needs|runs-on|if|steps|strategy|environment|timeout-minutes|continue-on-error|container|services):/);
        if (match) {
            jobPropertyIndent = match[1].length;
            console.log(`✔️ Detected job property indentation: ${jobPropertyIndent} spaces.`);
            break;
        }
    }
    
    // If we couldn't detect from existing properties, calculate based on the base indent
    if (jobPropertyIndent === -1) {
        const baseIndent = detectBaseIndent(lines, 0, deployActionLineIndex);
        jobPropertyIndent = jobIndent + baseIndent;
        console.log(`⚠️ Could not detect indentation from existing properties, using calculated: ${jobPropertyIndent} spaces (base indent: ${baseIndent}).`);
    }
    
    // Look for existing permissions block within this job
    let permissionsLineIndex = -1;
    let hasPermissions = false;
    
    // Search from job start to deploy action line for permissions
    for (let i = jobLineIndex + 1; i < deployActionLineIndex; i++) {
        const line = lines[i];
        const permMatch = line.match(/^(\s+)permissions:/);
        if (permMatch && permMatch[1].length === jobPropertyIndent) {
            permissionsLineIndex = i;
            hasPermissions = true;
            break;
        }
    }
    
    if (hasPermissions) {
        console.log(`✔️ Found existing permissions block at line ${permissionsLineIndex + 1}.`);
        
        // Check if id-token and contents are already set
        let hasIdToken = false;
        let hasContentsWrite = false;
        let contentsLineIndex = -1;
        
        // Detect indentation for permission values
        const permissionValueIndent = detectPermissionValueIndent(lines, jobLineIndex, deployActionLineIndex, jobPropertyIndent, permissionsLineIndex);
        
        // Look at lines after permissions: to find existing settings
        for (let i = permissionsLineIndex + 1; i < deployActionLineIndex; i++) {
            const line = lines[i];
            // Stop if we hit another key at the same level
            const indentMatch = line.match(/^(\s+)\w+:/);
            if (indentMatch && indentMatch[1] && indentMatch[1].length === jobPropertyIndent) {
                break;
            }
            
            if (line.includes('id-token:')) {
                hasIdToken = true;
            }
            if (line.includes('contents:')) {
                contentsLineIndex = i;
                if (line.includes('write')) {
                    hasContentsWrite = true;
                }
            }
        }
        
        // Add missing permissions or update existing ones
        const permIndent = ' '.repeat(permissionValueIndent);
        let insertIndex = permissionsLineIndex + 1;
        
        // Find where to insert (after last permission or right after permissions:)
        for (let i = permissionsLineIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            const indentMatch = line.match(/^(\s+)\w+:/);
            if (indentMatch && indentMatch[1] && indentMatch[1].length === jobPropertyIndent) {
                break;
            }
            if (line.trim().length > 0 && line.match(/^\s+\w+:/)) {
                insertIndex = i + 1;
            }
        }
        
        // Update contents: read to contents: write if needed
        if (contentsLineIndex > -1 && !hasContentsWrite) {
            lines[contentsLineIndex] = `${permIndent}contents: write`;
            console.log(`✔️ Updated 'contents' permission to 'write'.`);
            modified = true;
            hasContentsWrite = true;
        }
        
        const newPermissions = [];
        if (!hasIdToken) {
            newPermissions.push(`${permIndent}id-token: write`);
            console.log(`✔️ Adding 'id-token: write' permission.`);
        } else {
            console.log(`ⓘ 'id-token' permission already exists.`);
        }
        
        if (!hasContentsWrite) {
            newPermissions.push(`${permIndent}contents: write`);
            console.log(`✔️ Adding 'contents: write' permission.`);
        } else {
            console.log(`ⓘ 'contents: write' permission already exists.`);
        }
        
        if (newPermissions.length > 0) {
            lines.splice(insertIndex, 0, ...newPermissions);
            modified = true;
        }
    } else {
        console.log(`✔️ No existing permissions block, adding new one at job level.`);
        
        // Detect indentation for permission values
        const permissionValueIndent = detectPermissionValueIndent(lines, jobLineIndex, deployActionLineIndex, jobPropertyIndent, -1);
        
        // Add permissions block at job level
        const permIndent = ' '.repeat(jobPropertyIndent);
        const valueIndent = ' '.repeat(permissionValueIndent);
        
        // Find where to insert - after the job definition line but before steps
        let insertIndex = jobLineIndex + 1;
        
        // Skip any blank lines after the job definition
        while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
            insertIndex++;
        }
        
        const newPermissions = [
            `${permIndent}permissions:`,
            `${valueIndent}contents: write`,
            `${valueIndent}id-token: write`
        ];
        
        lines.splice(insertIndex, 0, ...newPermissions);
        console.log(`✔️ Added permissions block with 'contents: write' and 'id-token: write' at job level.`);
        modified = true;
    }
}

// Write the updated workflow file if changes were made
if (modified) {
    workflowContent = lines.join('\n');
    fs.writeFileSync(workflowPath, workflowContent, 'utf8');
    console.log(`✔️ ${workflowPath} updated successfully.`);
} else {
    console.log(`ⓘ No changes were made to ${workflowPath}.`);
}

// update documentation
const [owner, repoName] =  repositoryName.split('/');
const prBodyFile = path.join(process.cwd(), '.pr-body');
let prBody = fs.readFileSync(prBodyFile, 'utf-8');
prBody = prBody.replaceAll('%OWNER%', owner).replaceAll('%REPONAME%', repoName);
fs.writeFileSync(prBodyFile, prBody);
console.log(`✔️ Updated PR body file: ${prBodyFile}`);

console.log(`✔️ processing completed`);

process.exit(0);


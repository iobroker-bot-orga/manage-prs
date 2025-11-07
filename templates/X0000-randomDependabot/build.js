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

// Check if dependabot.yml exists
const dependabotPath = '.github/dependabot.yml';
if (!fs.existsSync(dependabotPath)) {
  console.log('ⓘ No dependabot.yml found - skipping this repository');
  process.exit(0);
}

console.log(`✔️ ${dependabotPath} exists.`);

// Calculate deterministic random day-of-month (2-28) and random time (1:00-4:00) based on repository name
// This ensures the same repository always gets the same schedule
const hash = simpleHash(repositoryName);
const randomDay = (hash % 27) + 2; // 2 to 28
const randomHour = ((hash >> 8) % 3) + 1; // 1 to 3
const randomMinute = (hash >> 16) % 60; // 0 to 59
const cronExpression = `${randomMinute} ${randomHour} ${randomDay} * *`;

console.log(`ⓘ Generated random schedule: Day ${randomDay}, Time ${randomHour}:${randomMinute.toString().padStart(2, '0')}`);
console.log(`ⓘ Cron expression: ${cronExpression}`);

// Read and parse dependabot.yml
let dependabotContent = fs.readFileSync(dependabotPath, 'utf8');
let dependabotConfig;

try {
  dependabotConfig = yaml.load(dependabotContent);
} catch (e) {
  console.error(`❌ Error parsing ${dependabotPath}: ${e.message}`);
  process.exit(1);
}

if (!dependabotConfig || !dependabotConfig.updates || !Array.isArray(dependabotConfig.updates)) {
  console.log('ⓘ No updates section found in dependabot.yml');
  process.exit(0);
}

// Check if there are multiple package.json files
const hasMultiplePackageJson = findPackageJsonFiles('.').length > 1;
if (hasMultiplePackageJson) {
  console.log('✔️ Multiple package.json files detected in repository');
}

let changesMade = false;

// Check if there's exactly one npm block for multi-directory handling
const npmBlocks = dependabotConfig.updates.filter(u => u['package-ecosystem'] === 'npm');
const shouldUpdateNpmDirectories = hasMultiplePackageJson && npmBlocks.length === 1;

// Process each update block
dependabotConfig.updates.forEach((update, index) => {
  console.log(`\nⓘ Processing update block ${index + 1}: ${update['package-ecosystem']}`);
  
  // Check and update schedule
  if (update.schedule) {
    // Ensure timezone is set to Europe/Berlin
    if (update.schedule.timezone !== 'Europe/Berlin') {
      console.log(`✔️ Setting timezone to Europe/Berlin`);
      update.schedule.timezone = 'Europe/Berlin';
      changesMade = true;
    }
    
    // Convert monthly interval to cron
    if (update.schedule.interval === 'monthly') {
      console.log(`✔️ Converting monthly schedule to cron`);
      update.schedule.interval = 'cron';
      
      // Remove time parameter if it exists
      if (update.schedule.time) {
        console.log(`✔️ Removing time parameter`);
        delete update.schedule.time;
      }
      
      // Add cron expression
      update.schedule.cron = cronExpression;
      console.log(`✔️ Added cron expression: ${cronExpression}`);
      changesMade = true;
    }
  }
  
  // Check and update open-pull-requests-limit
  const currentLimit = update['open-pull-requests-limit'];
  if (currentLimit === undefined || currentLimit < 15) {
    const oldLimit = currentLimit || 'default (5)';
    update['open-pull-requests-limit'] = 15;
    console.log(`✔️ Updated open-pull-requests-limit from ${oldLimit} to 15`);
    changesMade = true;
  } else {
    console.log(`ⓘ open-pull-requests-limit is ${currentLimit}, no change needed`);
  }
  
  // Handle npm package ecosystem with multiple package.json files
  if (shouldUpdateNpmDirectories && update['package-ecosystem'] === 'npm' && update.directory === '/') {
    console.log(`✔️ Replacing directory: "/" with directories: "**/*"`);
    delete update.directory;
    update.directories = '**/*';
    changesMade = true;
  }
});

// Write updated dependabot.yml if changes were made
if (changesMade) {
  const updatedYaml = yaml.dump(dependabotConfig, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"'
  });
  
  fs.writeFileSync(dependabotPath, updatedYaml, 'utf8');
  console.log(`\n✔️ ${dependabotPath} updated successfully.`);
} else {
  console.log(`\nⓘ No changes were made to ${dependabotPath}.`);
}

console.log(`\n✔️ processing completed`);

process.exit(0);

/**
 * Simple hash function for strings
 * @param {string} str - String to hash
 * @returns {number} - Hash value
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Recursively find all package.json files in a directory
 * @param {string} dir - Directory to search
 * @returns {string[]} - Array of package.json file paths
 */
function findPackageJsonFiles(dir) {
  const results = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules and .git directories
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        results.push(...findPackageJsonFiles(fullPath));
      } else if (entry.isFile() && entry.name === 'package.json') {
        results.push(fullPath);
      }
    }
  } catch (e) {
    // Ignore errors from directories we can't read
  }
  
  return results;
}


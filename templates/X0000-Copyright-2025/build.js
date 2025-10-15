// This script implements the required changes for a PR 
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of an PR. 

const fs = require('node:fs');

// Target year for copyright updates
const TARGET_YEAR = 2025;

let changesMade = false;

/**
 * Update copyright year in content
 * @param {string} content - File content
 * @param {string} section - Section name to search (null for entire file)
 * @returns {object} - { content: updatedContent, changed: boolean }
 */
function updateCopyrightYear(content, section = null) {
    let workingContent = content;
    let sectionStart = 0;
    let sectionEnd = content.length;
    
    // If section is specified, find the section boundaries
    if (section) {
        const sectionRegex = new RegExp(`^##?\\s+${section}\\s*$`, 'mi');
        const sectionMatch = content.match(sectionRegex);
        
        if (!sectionMatch) {
            console.log(`ⓘ Section '${section}' not found`);
            return { content, changed: false };
        }
        
        sectionStart = sectionMatch.index;
        
        // Find next section or end of file
        const nextSectionRegex = /^##?\s+/gm;
        nextSectionRegex.lastIndex = sectionStart + sectionMatch[0].length;
        const nextSectionMatch = nextSectionRegex.exec(content);
        sectionEnd = nextSectionMatch ? nextSectionMatch.index : content.length;
    }
    
    const sectionContent = content.substring(sectionStart, sectionEnd);
    const beforeSection = content.substring(0, sectionStart);
    const afterSection = content.substring(sectionEnd);
    
    // Match copyright lines with year patterns
    // Pattern 1: Copyright (c) YYYY Name
    // Pattern 2: Copyright (c) YYYY - YYYY Name
    const copyrightRegex = /Copyright\s+\(c\)\s+(\d{4})(?:\s*-\s*(\d{4}))?\s+/gi;
    
    let modified = false;
    const updatedSection = sectionContent.replace(copyrightRegex, (match, startYear, endYear) => {
        const start = parseInt(startYear, 10);
        const end = endYear ? parseInt(endYear, 10) : null;
        const newestYear = end || start;
        
        if (newestYear >= TARGET_YEAR) {
            console.log(`ⓘ Copyright year ${newestYear} is already ${TARGET_YEAR} or later`);
            return match;
        }
        
        modified = true;
        
        if (end) {
            // Already has a range, update end year
            console.log(`✔️ Updating copyright year range from ${start} - ${end} to ${start} - ${TARGET_YEAR}`);
            return `Copyright (c) ${start} - ${TARGET_YEAR} `;
        } else {
            // Single year, create range
            console.log(`✔️ Updating copyright year from ${start} to ${start} - ${TARGET_YEAR}`);
            return `Copyright (c) ${start} - ${TARGET_YEAR} `;
        }
    });
    
    if (modified) {
        return { content: beforeSection + updatedSection + afterSection, changed: true };
    }
    
    return { content, changed: false };
}

// Process README.md
const readmePath = './README.md';
if (fs.existsSync(readmePath)) {
    console.log(`✔️ ${readmePath} exists.`);
    
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    const result = updateCopyrightYear(readmeContent, 'License');
    
    if (result.changed) {
        fs.writeFileSync(readmePath, result.content, 'utf8');
        console.log(`✔️ ${readmePath} updated successfully.`);
        changesMade = true;
    } else {
        console.log(`ⓘ No copyright updates needed in ${readmePath}.`);
    }
} else {
    console.log(`ⓘ ${readmePath} does not exist, skipping.`);
}

// Process LICENSE file
const licensePath = './LICENSE';
if (fs.existsSync(licensePath)) {
    console.log(`✔️ ${licensePath} exists.`);
    
    const licenseContent = fs.readFileSync(licensePath, 'utf8');
    const result = updateCopyrightYear(licenseContent, null);
    
    if (result.changed) {
        fs.writeFileSync(licensePath, result.content, 'utf8');
        console.log(`✔️ ${licensePath} updated successfully.`);
        changesMade = true;
    } else {
        console.log(`ⓘ No copyright updates needed in ${licensePath}.`);
    }
} else {
    console.log(`ⓘ ${licensePath} does not exist, skipping.`);
}

if (!changesMade) {
    console.log(`ⓘ No changes were made. Copyright years are already up to date.`);
}

console.log(`✔️ processing completed`);

process.exit(0);


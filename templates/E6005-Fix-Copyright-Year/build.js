// This script implements the required changes for a PR 
// The working directory is set to the root of the repository.
// The script must exit with status 0 if everything is ok.
// if no change is to be applied for any reason the script must not change any files. This will prohibit creation of an PR. 

const fs = require('node:fs');

// Target year for copyright updates
const TARGET_YEAR = 2025;
// Maximum allowed year - years beyond this will be corrected to TARGET_YEAR
const MAX_YEAR = 2026;

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
    // Using word boundaries to ensure years are matched correctly
    const copyrightRegex = /Copyright\s+\(c\)\s+(\d{4})\b(?:\s*-\s*(\d{4})\b)?[^\n]*/gi;
    
    // Find all copyright lines
    const matches = [];
    let match;
    while ((match = copyrightRegex.exec(sectionContent)) !== null) {
        const startYear = parseInt(match[1], 10);
        const endYear = match[2] ? parseInt(match[2], 10) : null;
        const newestYear = endYear || startYear;
        
        matches.push({
            fullMatch: match[0],
            startYear: startYear,
            endYear: endYear,
            newestYear: newestYear,
            index: match.index,
            line: match[0]
        });
    }
    
    if (matches.length === 0) {
        console.log('ⓘ No copyright lines found');
        return { content, changed: false };
    }
    
    // Log all detected copyright lines
    console.log(`ⓘ Found ${matches.length} copyright line(s):`);
    matches.forEach((m, idx) => {
        console.log(`  ${idx + 1}. "${m.line}" (newest year: ${m.newestYear})`);
    });
    
    // Find the line with the newest year
    let lineWithNewestYear = matches[0];
    for (let i = 1; i < matches.length; i++) {
        if (matches[i].newestYear > lineWithNewestYear.newestYear) {
            lineWithNewestYear = matches[i];
        }
    }
    
    console.log(`ⓘ Line with newest year selected: "${lineWithNewestYear.line}" (year: ${lineWithNewestYear.newestYear})`);
    
    // Check if we need to update this line
    let modified = false;
    let updatedLine = lineWithNewestYear.line;
    
    // Check if newestYear is greater than MAX_YEAR and correct it
    if (lineWithNewestYear.newestYear > MAX_YEAR) {
        console.log(`ⓘ Copyright year ${lineWithNewestYear.newestYear} exceeds MAX_YEAR (${MAX_YEAR}), correcting to ${TARGET_YEAR}`);
        modified = true;
        
        if (lineWithNewestYear.endYear) {
            // Update end year to TARGET_YEAR
            console.log(`✔️ Correcting copyright year range from ${lineWithNewestYear.startYear} - ${lineWithNewestYear.endYear} to ${lineWithNewestYear.startYear} - ${TARGET_YEAR}`);
            updatedLine = lineWithNewestYear.line.replace(
                new RegExp(`(Copyright\\s+\\(c\\)\\s+${lineWithNewestYear.startYear})\\s*-\\s*${lineWithNewestYear.endYear}\\b`),
                `$1 - ${TARGET_YEAR}`
            );
        } else {
            // Single year exceeds MAX_YEAR
            // Check if startYear also exceeds MAX_YEAR - if so, just replace with TARGET_YEAR
            // Otherwise, create range from startYear to TARGET_YEAR
            if (lineWithNewestYear.startYear > MAX_YEAR) {
                console.log(`✔️ Correcting copyright year from ${lineWithNewestYear.startYear} to ${TARGET_YEAR}`);
                updatedLine = lineWithNewestYear.line.replace(
                    new RegExp(`(Copyright\\s+\\(c\\)\\s+)${lineWithNewestYear.startYear}\\b`),
                    `$1${TARGET_YEAR}`
                );
            } else {
                console.log(`✔️ Correcting copyright year from ${lineWithNewestYear.startYear} to ${lineWithNewestYear.startYear} - ${TARGET_YEAR}`);
                updatedLine = lineWithNewestYear.line.replace(
                    new RegExp(`(Copyright\\s+\\(c\\)\\s+)${lineWithNewestYear.startYear}\\b`),
                    `$1${lineWithNewestYear.startYear} - ${TARGET_YEAR}`
                );
            }
        }
    } else if (lineWithNewestYear.newestYear >= TARGET_YEAR) {
        console.log(`ⓘ Copyright year ${lineWithNewestYear.newestYear} is already ${TARGET_YEAR} or later, no update needed`);
        return { content, changed: false };
    } else {
        // Year is lower than TARGET_YEAR, update it
        modified = true;
        
        if (lineWithNewestYear.endYear) {
            // Already has a range, update end year
            console.log(`✔️ Updating copyright year range from ${lineWithNewestYear.startYear} - ${lineWithNewestYear.endYear} to ${lineWithNewestYear.startYear} - ${TARGET_YEAR}`);
            updatedLine = lineWithNewestYear.line.replace(
                new RegExp(`(Copyright\\s+\\(c\\)\\s+${lineWithNewestYear.startYear})\\s*-\\s*${lineWithNewestYear.endYear}\\b`),
                `$1 - ${TARGET_YEAR}`
            );
        } else {
            // Single year, create range
            console.log(`✔️ Updating copyright year from ${lineWithNewestYear.startYear} to ${lineWithNewestYear.startYear} - ${TARGET_YEAR}`);
            updatedLine = lineWithNewestYear.line.replace(
                new RegExp(`(Copyright\\s+\\(c\\)\\s+)${lineWithNewestYear.startYear}\\b`),
                `$1${lineWithNewestYear.startYear} - ${TARGET_YEAR}`
            );
        }
    }
    
    if (modified) {
        // Replace only the selected line in the section
        const updatedSection = sectionContent.substring(0, lineWithNewestYear.index) +
                               updatedLine +
                               sectionContent.substring(lineWithNewestYear.index + lineWithNewestYear.line.length);
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


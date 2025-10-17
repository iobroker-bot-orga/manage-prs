# Templates

This directory contains templates that can be applied to target repositories using the `prGenerator.js` script.

## Structure

Each template requires two files:

```
templates/
├── example.md        # PR title and body description
├── example.js        # Template processing logic
└── README.md         # This file
```

### Template Files

#### Markdown File (`<template-name>.md`)
The markdown file defines the pull request content:
- **First line**: Used as the PR title (will be prefixed with `[iobroker-bot] `)
- **Remaining content**: Used as the PR body description

Example:
```markdown
Update dependencies and configuration

This PR updates the project dependencies and configuration files according to the latest best practices.

## Changes
- Updated npm dependencies to latest versions
- Updated configuration files
```

The script automatically appends template metadata to the PR body:
```markdown
---

**Template**: example
**Parameters**: <parameter-data>
```

#### JavaScript File (`<template-name>.js`)
The JavaScript file contains template-specific processing logic:
```javascript
module.exports = function(repoPath, params) {
  // Template-specific processing logic
  console.log('Processing template...');
  console.log('Repository path:', repoPath);
  console.log('Parameters:', params);
};
```

## Usage

When running the `prGenerator.js` script, specify the template name as the second argument:

```bash
node prGenerator.js <repository-name> <template-name> [parameter-data]
```

For example:
```bash
# Without parameters
node prGenerator.js owner/repo example

# With parameters
node prGenerator.js owner/repo example "version=1.2.3,author=bot"
```

## Validation

The script will validate that:
1. Both template files (`<template-name>.md` and `<template-name>.js`) exist in `./templates/`
2. The target repository exists and is accessible (via GitHub API)

If either validation fails, the script will exit with an error.

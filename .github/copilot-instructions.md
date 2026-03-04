# GitHub Actions Workflow Management with GitHub Copilot

**Version:** 0.5.7
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on this GitHub Actions workflow management repository.

---

## 📑 Table of Contents

1. [Project Context](#project-context)
2. [Key Components](#key-components)
3. [Development Guidelines](#development-guidelines)
4. [Code Quality & Standards](#code-quality--standards)
5. [Testing and Validation](#testing-and-validation)
6. [Code Style](#code-style)
7. [Repository-Specific Patterns](#repository-specific-patterns)
8. [Extending Functionality](#extending-functionality)
9. [Common Tasks](#common-tasks)
10. [CI/CD & GitHub Actions](#cicd--github-actions)
11. [Security Considerations](#security-considerations)
12. [Related Resources](#related-resources)

---

## Project Context

This repository (`manage-prs`) is a GitHub Actions workflow automation tool designed to create and manage pull requests across multiple ioBroker adapter repositories. It provides centralized workflow templates and scripts that can be applied to target repositories.

### Repository Purpose
- Automate PR creation for template updates across ioBroker adapter repositories
- Provide reusable GitHub Actions workflows for repository management
- Maintain centralized scripts for applying template changes
- Support workflow dispatch triggers with configurable inputs

## Key Components

### prGenerator.js
Node.js script that applies template changes to target repositories. This script:
- Accepts repository name and template name as command-line arguments
- Creates marker files to indicate template application
- Can be extended for specific template application logic

### GitHub Actions Workflows
Located in `.github/workflows/`:
- `processRepository.yml`: Main workflow for creating PRs in target repositories
  - Triggers via workflow_dispatch with manual inputs
  - Clones target repository
  - Executes prGenerator.js script
  - Commits changes and creates pull request
- `processLatestRepositories.yml`: Workflow for processing multiple repositories
  - Retrieves list of repositories from ioBroker latest repository
  - Triggers processRepository workflow for each repository with 2-minute delays
  - Automatically restarts after ~3 hours to continue processing

## Development Guidelines

### Workflow Best Practices
- Use `workflow_dispatch` for manual triggers with clear input descriptions
- Implement proper error handling in workflow steps
- Use GitHub Actions bot credentials for commits and PRs
- Parse repository URLs to extract owner and repo information
- Check for existing forks before attempting to create new ones

### Script Development
- Always validate required command-line arguments
- Use clear console logging for debugging
- Implement try-catch blocks for error handling
- Exit with non-zero codes on errors for CI/CD integration
- Write placeholder comments for extensible logic

### GitHub Actions Standards
```yaml
# Use latest action versions
- uses: actions/checkout@v4
- uses: actions/setup-node@v4

# Configure Node.js with caching
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

# Use github-actions bot for commits
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
```

### Error Handling Patterns
```javascript
// CLI argument validation
if (args.length < 2) {
  console.error('Error: Missing required arguments');
  console.error('Usage: node prGenerator.js <repository-name> <template-name>');
  process.exit(1);
}

// Safe file operations
try {
  fs.writeFileSync(markerFile, content);
  console.log(`Created marker file: ${markerFile}`);
} catch (error) {
  console.error('Error applying template:', error.message);
  process.exit(1);
}
```

## Code Quality & Standards

### ESLint Configuration

**CRITICAL:** ESLint validation must run FIRST in your CI/CD pipeline, before any other tests. This "lint-first" approach catches code quality issues early.

#### Setup
```bash
npm install --save-dev eslint
```

#### Package.json Scripts
```json
{
  "scripts": {
    "lint": "eslint --max-warnings 0 .",
    "lint:fix": "eslint . --fix"
  }
}
```

#### Best Practices
1. ✅ Run ESLint before committing — fix ALL warnings, not just errors
2. ✅ Use `lint:fix` for auto-fixable issues
3. ✅ Don't disable rules without documentation
4. ✅ Lint all relevant files (main code, scripts, build files)
5. ✅ **ESLint warnings are treated as errors in CI** (`--max-warnings 0`)

#### Common Issues
- **Unused variables**: Remove or prefix with underscore (`_variable`)
- **Missing semicolons**: Run `npm run lint:fix`
- **Indentation**: Use consistent spacing (2 spaces for YAML, 4 spaces for JS)
- **console.log**: Acceptable in scripts, but prefer descriptive log messages

### Dependency Management

- Always use `npm` for dependency management
- Use `npm ci` for installing existing dependencies (respects package-lock.json)
- Use `npm install` only when adding or updating dependencies
- Keep dependencies minimal and focused
- Only update dependencies in separate Pull Requests

**When modifying package.json:**
1. Run `npm install` to sync package-lock.json
2. Commit both package.json and package-lock.json together

**Best Practices:**
- Prefer built-in Node.js modules when possible
- Avoid deprecated packages
- Document specific version requirements

### HTTP Client Libraries

- **Preferred:** Use native `fetch` API (Node.js 20+ required)
- **Avoid:** `axios` unless specific features are required

**Example with fetch:**
```javascript
try {
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
} catch (error) {
  console.error(`API request failed: ${error.message}`);
  process.exit(1);
}
```

---

## Testing and Validation

### Manual Testing
- Test workflows using workflow_dispatch with various repository inputs
- Verify PR creation in target repositories
- Check for proper error messages on invalid inputs
- Validate that changes are committed with appropriate messages

### CI/CD Considerations
- This repository primarily provides workflows and scripts for OTHER repositories
- Testing focuses on workflow syntax validation and script execution
- No unit tests required for simple automation scripts
- Integration testing occurs when workflows are triggered

## Code Style

### JavaScript
- Use strict mode
- Implement clear variable naming
- Add comments for complex logic sections
- Use template literals for string formatting
- Prefer `const` over `let` where applicable
- **Use single quotes (`'`) for strings wherever possible**, except when using template literals or when the string contains single quotes

### YAML Workflows
- Use consistent indentation (2 spaces)
- Add descriptive names for all steps
- Include conditional execution with `if` statements
- Use environment variables for reusable values
- Add comments for complex workflow logic

### Documentation
- Keep README.md up to date with workflow usage
- Document required secrets and permissions
- Provide clear examples for workflow inputs
- Explain the purpose of each script

## Repository-Specific Patterns

### Workflow Dispatch Inputs
```yaml
on:
  workflow_dispatch:
    inputs:
      repository_url:
        description: 'URL of the GitHub repository'
        required: true
        type: string
      template:
        description: 'Name of the template'
        required: true
        type: string
```

### Repository URL Parsing
```bash
# Extract owner/repo from URL
if [[ $REPO_URL =~ github.com[:/]([^/]+)/([^/]+)$ ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
fi
```

### Conditional Commits
```bash
# Only commit if there are changes
if git diff --staged --quiet; then
  echo "No changes to commit"
else
  git commit -m "Update from template: ${{ inputs.template }}"
fi
```

## Extending Functionality

### Adding New Templates
1. Define template application logic in prGenerator.js
2. Add validation for template name
3. Create appropriate file operations for template
4. Update workflow documentation

### New Workflow Features
1. Add new inputs to workflow_dispatch if needed
2. Implement new steps with clear names
3. Add error handling for new operations
4. Test with various repository configurations

## Common Tasks

### Creating a New Workflow
1. Create YAML file in `.github/workflows/`
2. Define trigger (workflow_dispatch, schedule, etc.)
3. Add required steps with clear names
4. Configure permissions and secrets
5. Test the workflow manually

### Updating Existing Scripts
1. Review current script behavior
2. Add new functionality with error handling
3. Update console logging for debugging
4. Test with sample repository data
5. Update documentation if needed

## CI/CD & GitHub Actions

### Workflow Configuration

#### GitHub Actions Best Practices

- Use latest action versions (`actions/checkout@v4`, `actions/setup-node@v4`)
- Test on Node.js 20.x, 22.x where applicable
- Use `ubuntu-22.04` as the runner platform
- Configure Node.js with npm caching for faster runs

#### Critical: Lint-First Validation Workflow

**ALWAYS run ESLint checks BEFORE other tests.** Benefits:
- Catches code quality issues immediately
- Prevents wasting CI resources on tests that would fail due to linting errors
- Provides faster feedback to developers
- Enforces consistent code quality

**Workflow Dependency Configuration:**
```yaml
jobs:
  check-and-lint:
    # Runs ESLint and script validation first

  adapter-tests:
    needs: [check-and-lint]  # Wait for linting to pass

  integration-tests:
    needs: [check-and-lint, adapter-tests]  # Wait for both
```

**Key Points:**
- The `check-and-lint` job has NO dependencies — runs first
- ALL other test jobs MUST list `check-and-lint` in their `needs` array
- If linting fails, no other tests run, saving time
- Fix all ESLint errors before proceeding

### Documentation Standards

#### Required Sections for Scripts and Workflows
1. **Purpose** — Clear description of what the workflow/script does
2. **Inputs** — All required and optional inputs documented
3. **Usage** — Practical examples
4. **Error Handling** — Known failure modes and how they're handled

#### Mandatory README Updates for PRs

For **every PR or new feature**, add a user-friendly entry to README.md:

- Add entries under `## **WORK IN PROGRESS**` section
- Use format: `* (author) **TYPE**: Description of user-visible change`
- Types: **NEW** (features), **FIXED** (bugs), **ENHANCED** (improvements), **CI/CD** (automation)

**Example:**
```markdown
## **WORK IN PROGRESS**

* (author) **FIXED**: Workflow now correctly handles repositories with special characters in names
* (author) **NEW**: Added support for processing repositories in batches
```

---

## Security Considerations

- Use `GITHUB_TOKEN` secret for API operations
- Never hardcode credentials in workflows
- Validate all user inputs in scripts
- Use `github-actions[bot]` for automated commits
- Review permissions granted to workflows

## Related Resources

- GitHub Actions Documentation: https://docs.github.com/actions
- GitHub REST API: https://docs.github.com/rest
- ioBroker Organization: https://github.com/ioBroker

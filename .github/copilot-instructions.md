# GitHub Actions Workflow Management with GitHub Copilot

**Version:** 0.4.2
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on this GitHub Actions workflow management repository.

## Project Context

This repository (`manage-prs`) is a GitHub Actions workflow automation tool designed to create and manage pull requests across multiple ioBroker adapter repositories. It provides centralized workflow templates and scripts that can be applied to target repositories.

### Repository Purpose
- Automate PR creation for template updates across ioBroker adapter repositories
- Provide reusable GitHub Actions workflows for repository management
- Maintain centralized scripts for applying template changes
- Support workflow dispatch triggers with configurable inputs

## Key Components

### createPR.js
Node.js script that applies template changes to target repositories. This script:
- Accepts repository name and template name as command-line arguments
- Creates marker files to indicate template application
- Can be extended for specific template application logic

### GitHub Actions Workflows
Located in `.github/workflows/`:
- `create-pr.yml`: Main workflow for creating PRs in target repositories
  - Triggers via workflow_dispatch with manual inputs
  - Clones target repository
  - Executes createPR.js script
  - Commits changes and creates pull request

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
  console.error('Usage: node createPR.js <repository-name> <template-name>');
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
1. Define template application logic in createPR.js
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

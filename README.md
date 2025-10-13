# manage-prs
Workflows and scripts to create PRs

## Overview

This repository provides GitHub Actions workflows and Node.js scripts to automate pull request creation across multiple ioBroker adapter repositories. It's designed to help maintain consistency by applying template changes to target repositories.

## Features

- **Automated PR Creation**: Create pull requests in target repositories with template updates
- **Workflow Dispatch**: Manually trigger workflows with configurable inputs
- **Template Application**: Apply centralized template changes to any repository
- **GitHub Copilot Integration**: Enhanced with AI-powered code assistance through GitHub Copilot instructions

## Usage

### Creating a PR from a Template

Use the `create-pr` workflow to apply template changes to a target repository:

1. Go to **Actions** → **createPR** workflow
2. Click **Run workflow**
3. Enter the target repository URL (e.g., `https://github.com/owner/repo`)
4. Enter the template name
5. (Optional) Enter parameter data to pass to the template
6. Click **Run workflow**

The workflow will:
- Clone the target repository
- Apply the template using `createPR.js`
- Read PR title and body from the template markdown file (`templates/<template-name>.md`)
- Create PR with title prefixed with `[iobroker-bot] ` from the first line of the template
- Use remaining content as PR body description
- Append template name and parameter data to PR body
- Commit changes
- Create a pull request

## GitHub Copilot Instructions

This repository includes GitHub Copilot instructions optimized for working with GitHub Actions workflows and automation scripts.

### Features
- Context-aware suggestions for GitHub Actions YAML
- Best practices for workflow development
- Error handling patterns for automation scripts
- Repository-specific development guidelines

### Automated Updates
A weekly GitHub Action (`check-copilot-template.yml`) automatically:
- Checks for updates to the Copilot instructions template
- Creates issues when updates are available
- Ensures the repository stays current with best practices

**Template Version**: 0.4.2  
**Template Source**: [DrozmotiX/ioBroker-Copilot-Instructions](https://github.com/DrozmotiX/ioBroker-Copilot-Instructions)

## Development

### Scripts

- **createPR.js**: Node.js script that applies template changes to repositories
  - Usage: `node createPR.js <repository-name> <template-name> [parameter-data]`
  - Reads template markdown file (`templates/<template-name>.md`) to generate PR title and body
  - First line of markdown file becomes PR title (with `[iobroker-bot] ` prefix)
  - Remaining content becomes PR body description
  - Appends template name and optional parameter data to PR body
  - Creates `.pr-title` and `.pr-body` files for the workflow to use
  - Extensible for custom template logic

### Workflows

- **create-pr.yml**: Main workflow for creating PRs
  - Triggered manually via workflow_dispatch
  - Handles repository forking, cloning, and PR creation
  
- **check-copilot-template.yml**: Automated template version checking
  - Runs weekly on Sundays at 3:23 AM UTC
  - Creates issues when Copilot template updates are available

## License

MIT License - see [LICENSE](LICENSE) file for details

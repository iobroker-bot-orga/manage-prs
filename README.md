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

Use the `processRepository` workflow to apply template changes to a target repository:

1. Go to **Actions** → **processRepository** workflow
2. Click **Run workflow**
3. Enter the target repository in one of the following formats:
   - Full URL: `https://github.com/owner/repo`
   - Owner/Repo: `owner/repo`
4. Enter the template name
5. (Optional) Enter parameter data to pass to the template
6. Select the **PR mode** (default: `recreate`):
   - **force creation**: Always create a new PR. Close any existing open PRs first.
   - **recreate**: Close existing open PRs and create a new one, unless a PR was previously closed by someone other than iobroker-bot (in which case, skip creation).
   - **skip if existing**: Skip PR creation if an open PR with the same title already exists.
   - **skip if closed**: Skip PR creation if a PR with the same title was previously closed by someone other than iobroker-bot without merging.
   - **skip if merged**: Skip PR creation if a PR with the same title was already merged.
   - **REVOKE**: Close all existing open PRs with matching title (add revocation comment) and skip PR creation. This mode executes the template script to calculate the PR title but does not create a new PR.
7. Click **Run workflow**

The workflow will:
- Clone the target repository
- Apply the template using `prGenerator.js`
- Read PR title and body from the template markdown file (`templates/<template-name>/description.md`)
- Execute the template's build script (`templates/<template-name>/build.js`)
- Create PR with title prefixed with `[iobroker-bot] ` from the first line of the template
- Use remaining content as PR body description
- Append template name and parameter data to PR body
- Commit changes
- Use `prManager.js` to create a pull request based on the selected mode

**Work Files**: The workflow creates temporary work files with the `.iobroker-` prefix and `.tmp` suffix:
- `.iobroker-pr-title.tmp`: Contains the PR title
- `.iobroker-pr-body.tmp`: Contains the PR body
- `.iobroker-pr-comment-*.tmp`: Temporary files for PR comments (automatically cleaned up)

### Processing Multiple Repositories

Use the `processLatestRepositories` workflow to apply template changes to multiple ioBroker adapter repositories from the latest repository:

1. Go to **Actions** → **processLatestRepositories** workflow
2. Click **Run workflow**
3. Enter the template name (required)
4. (Optional) Enter parameter data to pass to the template
5. Select the **PR mode** (default: `recreate`)
6. (Optional) Enter an adapter name in the **from** field to resume processing from that adapter
7. Click **Run workflow**

The workflow will:
- Retrieve the list of all adapters from the ioBroker latest repository
- Process each adapter by triggering the `processRepository` workflow
- Wait 2 minutes between processing each repository
- Automatically restart itself after processing repositories for ~3 hours (to avoid workflow timeout)
- Resume from a specific adapter if the **from** parameter is provided

**Features:**
- **Automatic restart**: The workflow automatically restarts itself after 3 hours to continue processing remaining repositories
- **Resume capability**: Use the `from` parameter to skip already processed adapters
- **Configurable delay**: 2-minute delay between repository processing to avoid rate limits
- **Template checking**: Optional template-specific check scripts can be added to `templates/<template-name>.js` to filter which repositories should be processed

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

- **prGenerator.js**: Node.js script that applies template changes to repositories
  - Usage: `node prGenerator.js <repository-name> <template-name> [parameter-data]`
  - Validates that template directory exists with required files: `description.md` and `build.js`
  - Reads template markdown file (`templates/<template-name>/description.md`) to generate PR title and body
  - First line of markdown file becomes PR title (with `[iobroker-bot] ` prefix)
  - Remaining content becomes PR body description
  - Executes the template's build script (`templates/<template-name>/build.js`) to apply changes
  - Appends template name and optional parameter data to PR body
  - Creates `.iobroker-pr-title.tmp` and `.iobroker-pr-body.tmp` files for the workflow to use
  - Extensible for custom template logic

- **prManager.js**: Node.js script that manages PR creation based on different modes
  - Usage: `node prManager.js <mode> <repository-name> <base-branch> <head-branch>`
  - Reads `.iobroker-pr-title.tmp` and `.iobroker-pr-body.tmp` files created by `prGenerator.js`
  - Handles different PR creation modes:
    - `force creation`: Always create a new PR, closing existing open PRs first
    - `recreate`: Close open PRs and create new one, skip if previously closed by others
    - `skip if existing`: Skip if an open PR already exists
    - `skip if closed`: Skip if previously closed by someone other than iobroker-bot
    - `skip if merged`: Skip if a PR with the same title was already merged
    - `REVOKE`: Close all existing open PRs with revocation comment, skip PR creation

- **processLatestRepositories.js**: Node.js script that processes multiple repositories from the ioBroker latest repository
  - Usage: `node processLatestRepositories.js --template=<template-name> [--parameter_data=<data>] [--pr_mode=<mode>] [--from=<adapter-name>] [--dry] [--debug]`
  - Retrieves the list of adapters from http://repo.iobroker.live/sources-dist-latest.json
  - Triggers the `processRepository` workflow for each adapter
  - Implements 2-minute delay between processing repositories
  - Automatically restarts after ~3 hours (90 repositories at 2min each) to avoid workflow timeout
  - Supports resuming from a specific adapter using `--from` parameter
  - Optional template-specific checking via `templates/<template-name>.js` module
  - Uses `gh` CLI for triggering workflows instead of REST API calls

### Workflows

- **processRepository.yml**: Main workflow for creating PRs in a single repository
  - Triggered manually via workflow_dispatch
  - Handles repository forking, cloning, and PR creation
  
- **processLatestRepositories.yml**: Workflow for processing multiple repositories
  - Triggered manually via workflow_dispatch or via repository_dispatch for automatic restarts
  - Retrieves list of repositories from ioBroker latest repository
  - Triggers `processRepository` workflow for each repository with 2-minute delays
  - Automatically restarts after ~3 hours to continue processing
  
- **check-copilot-template.yml**: Automated template version checking
  - Runs weekly on Sundays at 3:23 AM UTC
  - Creates issues when Copilot template updates are available

## License

MIT License - see [LICENSE](LICENSE) file for details

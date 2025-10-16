Migrate to NPM Trusted Publishing

## General information 

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or feel that a PR is faulty. Please open a issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR migrates the adapter to use NPM's Trusted Publishing feature, which provides a more secure way to publish packages without using long-lived NPM tokens.

### Changes made:

1. **Commented out `npm-token` parameter**: The `npm-token` parameter in the `ioBroker/testing-action-deploy@v1` action has been commented out, as it's no longer needed with Trusted Publishing.

2. **Added required permissions**: The workflow has been updated to include the necessary permissions for Trusted Publishing:
   - `id-token: write` - Required for OIDC token generation
   - `contents: write` - Required for the deployment action

### Benefits:

- **Enhanced Security**: No need to store long-lived NPM tokens as secrets
- **Reduced Maintenance**: No need to rotate tokens periodically
- **Better Audit Trail**: NPM can verify that packages were published from the correct GitHub repository and workflow

## Important information

### Setting up Trusted Publishing at npmjs.com

To complete the migration to Trusted Publishing, you need to configure it in your NPM account. Follow these steps:

1. **Log in to npmjs.com** with an account that has publish rights for your package

2. **Navigate to your package page**:
   - Go to https://www.npmjs.com/package/YOUR-PACKAGE-NAME
   - Click on the "Settings" tab

3. **Configure Trusted Publishing**:
   - Scroll down to the "Publishing access" section
   - Click on "Automate publishing with GitHub Actions" or "Add trusted publisher"
   - Fill in the required information:
     - **Repository owner**: Your GitHub username or organization (e.g., `ioBroker`)
     - **Repository name**: Your adapter repository name (e.g., `ioBroker.your-adapter`)
     - **Workflow name**: `test-and-release.yml` (or the name of your release workflow)
     - **Environment**: Leave blank unless you use GitHub Environments in your workflow

     **IMPORTANT: all input is casesensitive!**
     
4. **Save the configuration**

5. **Merge this PR** and test the release process

6. **Remove the NPM_TOKEN secret** from your GitHub repository settings (optional, after confirming everything works)

For more information, see:
- [NPM Trusted Publishing documentation](https://docs.npmjs.com/trusted-publishers)
- [GitHub Actions OIDC documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

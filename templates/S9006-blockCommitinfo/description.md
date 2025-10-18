Block .commitinfo by adding to .gitignore

## General information 

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or feel that a PR is faulty. Please open a issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR fixes the suggestion **[S9006] .commitinfo file should be excluded by .gitignore, please add a line with text ".commitinfo" to .gitignore** logged by the ioBroker repository checker.

### Background

The file `.commitinfo` is created by `@alcalzone/releasescript` and is normally deleted automatically during processing. However, it can be left over in case of errors or abnormal termination of the release script. Since the `.commitinfo` file should never be committed to GitHub, adding it to `.gitignore` is recommended to prevent accidental commits.

**Note:** Adding `.commitinfo` to `.gitignore` will not influence development tasks and will have no effect on user installations.

### Changes

This PR adds the file `.commitinfo` to `.gitignore` to prevent it from being committed to the repository.

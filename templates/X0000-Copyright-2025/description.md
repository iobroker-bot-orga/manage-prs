Update Copyright Year

## General information 

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or feel that a PR is faulty. Please open a issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR updates the copyright year in the following files:

- **README.md**: Updates copyright year in the License section
- **LICENSE**: Updates copyright year throughout the file

The script automatically:
- Detects existing copyright statements with format `Copyright (c) YYYY` or `Copyright (c) YYYY - YYYY`
- Updates single years to year ranges (e.g., `2024` becomes `2024 - 2025`)
- Updates existing year ranges to end at 2025 (e.g., `2020 - 2024` becomes `2020 - 2025`)
- Only makes changes if the current year is less than 2025
- Ensures year boundaries are properly matched using word boundaries

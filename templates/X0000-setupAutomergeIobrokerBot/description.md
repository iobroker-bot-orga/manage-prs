Setup Auto-Merge for ioBroker-Bot PRs
[German description can be found below](#deutsche-beschreibung)
[Deutsche Beschreibung weiter unten](#deutsche-beschreibung)

## General information 

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or feel that a PR is faulty. Please open an issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR adds auto-merge support for pull requests created by ioBroker-Bot.

### What this PR does

This PR creates a new GitHub Actions workflow file `.github/workflows/automerge-iobroker-bot.yml`. This workflow automatically merges pull requests created by ioBroker-Bot once all required GitHub checks have been executed successfully.

### Important notes

**This PR is optional.** Each developer must decide individually whether to merge pull requests created by ioBroker-Bot automatically or manually. Merging this PR enables automatic merging; not merging it means all ioBroker-Bot PRs will continue to require manual review and merging.

Please note that automatic merging only occurs if **all required GitHub checks pass successfully**. If any check fails, the pull request will not be merged automatically.

### References

- [action-automerge-iobroker-bot repository](https://github.com/iobroker-bot-orga/action-automerge-iobroker-bot)

---

## Deutsche Beschreibung

Diese PR fügt Auto-Merge-Unterstützung für Pull Requests hinzu, die von ioBroker-Bot erstellt wurden.

### Was diese PR macht

Diese PR erstellt eine neue GitHub Actions Workflow-Datei `.github/workflows/automerge-iobroker-bot.yml`. Dieser Workflow merged Pull Requests, die von ioBroker-Bot erstellt wurden, automatisch, sobald alle erforderlichen GitHub-Prüfungen erfolgreich abgeschlossen wurden.

### Wichtige Hinweise

**Diese PR ist optional.** Jeder Entwickler muss individuell entscheiden, ob von ioBroker-Bot erstellte Pull Requests automatisch oder manuell gemergt werden sollen. Das Mergen dieser PR aktiviert das automatische Mergen; wird diese PR nicht gemergt, müssen alle ioBroker-Bot-PRs weiterhin manuell überprüft und gemergt werden.

Bitte beachten: Das automatische Mergen erfolgt nur, wenn **alle erforderlichen GitHub-Prüfungen erfolgreich bestanden** wurden. Schlägt eine Prüfung fehl, wird der Pull Request nicht automatisch gemergt.

### Referenzen

- [action-automerge-iobroker-bot Repository](https://github.com/iobroker-bot-orga/action-automerge-iobroker-bot)

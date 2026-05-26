Add missing GitHub Actions Dependabot configuration
[German description can be found below](#deutsche-beschreibung)
[Deutsche Beschreibung weiter unten](#deutsche-beschreibung)

## General information

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if review is ok.

Feel free to contact me (@ioBroker-Bot) if there are any questions or if a PR seems faulty. Please open an issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

__ENGLISH_CHANGE_DETAILS__

### Technical details

- If `.github/dependabot.yml` does not exist, this template creates a new configuration file with update entries for `github-actions` and `npm`.
- If `.github/dependabot.yml` already exists, this template only adds the missing `github-actions` block and keeps existing comments unchanged.
- If the file already contains a `github-actions` block, no changes are applied and no PR is created.
- When a new block is added to an existing file, the cronjob already used in the file is reused when available.
- When a new file is created, one shared cronjob with a randomized day between 2 and 28 is used for all update blocks.

### References

- [ioBroker Repository Checker](https://github.com/ioBroker/ioBroker.repochecker)
- [Dependabot options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference)

---

## Deutsche Beschreibung

__GERMAN_CHANGE_DETAILS__

### Technische Details

- Falls `.github/dependabot.yml` nicht existiert, erstellt diese Vorlage eine neue Konfigurationsdatei mit Update-Einträgen für `github-actions` und `npm`.
- Falls `.github/dependabot.yml` bereits existiert, ergänzt diese Vorlage nur den fehlenden `github-actions`-Block und lässt bestehende Kommentare unverändert.
- Falls die Datei bereits einen `github-actions`-Block enthält, werden keine Änderungen angewendet und es wird kein PR erstellt.
- Wenn ein neuer Block zu einer bestehenden Datei hinzugefügt wird, wird der bereits in der Datei verwendete Cronjob weiterverwendet, falls vorhanden.
- Wenn eine neue Datei erstellt wird, wird für alle Update-Blöcke derselbe Cronjob mit einem randomisierten Tag zwischen 2 und 28 verwendet.

### Referenzen

- [ioBroker Repository Checker](https://github.com/ioBroker/ioBroker.repochecker)
- [Dependabot-Optionen](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference)

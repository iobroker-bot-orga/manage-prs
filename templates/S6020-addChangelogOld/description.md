Add CHANGELOG_OLD.md to store older changelog entries

[German description can be found below](#deutsche-beschreibung)  
[Deutsche Beschreibung weiter unten](#deutsche-beschreibung)

## General information

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if the review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or feel that a PR is faulty. Please open an issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR addresses the warning **[W6019] README.md contains ${versionEntryCount} changelog entries. Consider adding CHANGELOG_OLD.md file supported by @alcalzone/releasescript** and the suggestion **[S6020] Consider adding a CHANGELOG_OLD.md file to store older changelog entries** reported by the ioBroker repository checker.

### Background

Keeping all changelog entries inside `README.md` causes the file to grow continuously over time, which makes it harder to read and maintain. Moving older entries to a separate `CHANGELOG_OLD.md` file keeps `README.md` concise while still preserving the full history.

This functionality is supported out of the box by [@alcalzone/release-script](https://github.com/AlCalzone/release-script#separate-changelog-for-old-entries). During a release, the script automatically moves older changelog entries from `README.md` into `CHANGELOG_OLD.md`, so no manual maintenance is required after the initial setup.

### Changes

- A new file `CHANGELOG_OLD.md` has been created at the root of the repository (if it did not already exist), initialized with the heading `# Older changes`.
- A link to `CHANGELOG_OLD.md` has been added at the end of the changelog section in `README.md` (if it was not already present), stating "Older changelogs can be found there".

---

# Deutsche Beschreibung

## Allgemeine Informationen

Dieser PR wurde von iobroker-bot erstellt. Bitte die Änderungen sorgfältig prüfen und den PR bei erfolgreicher Prüfung mergen.

Bei Fragen oder falls ein PR fehlerhaft erscheint, bitte mich (@ioBroker-Bot) kontaktieren. Bitte ein Issue im Repository https://github.com/ioBroker/ioBroker.repochecker öffnen, um einen fehlerhaften PR zu melden.

Und **VIELEN DANK** für die Pflege dieses Adapters von mir und allen Nutzern.
*Gemeinsam für die beste Benutzererfahrung arbeiten.*

*Euer*
*ioBroker Check and Service Bot*

@mcm1957 zur Kenntnisnahme

## Durch diesen PR bereitgestellte Änderungen

Dieser PR behebt die Warnung **[W6019] README.md enthält ${versionEntryCount} Changelog-Einträge. Bitte die von @alcalzone/releasescript unterstützte CHANGELOG_OLD.md-Datei in Betracht ziehen** sowie den Hinweis **[S6020] Bitte eine CHANGELOG_OLD.md-Datei zum Speichern älterer Changelog-Einträge in Betracht ziehen**, die vom ioBroker Repository Checker gemeldet werden.

### Hintergrund

Das Hinzufügen aller Changelog-Einträge zur `README.md` führt dazu, dass die Datei mit der Zeit immer größer wird, was die Lesbarkeit und Wartbarkeit erschwert. Das Auslagern älterer Einträge in eine separate `CHANGELOG_OLD.md` hält die `README.md` übersichtlich und bewahrt gleichzeitig die vollständige Historie.

Diese Funktionalität wird standardmäßig von [@alcalzone/release-script](https://github.com/AlCalzone/release-script#separate-changelog-for-old-entries) unterstützt. Beim Release verschiebt das Skript ältere Changelog-Einträge automatisch aus der `README.md` in die `CHANGELOG_OLD.md`, sodass nach der initialen Einrichtung keine manuelle Pflege erforderlich ist.

### Änderungen

- Eine neue Datei `CHANGELOG_OLD.md` wurde im Stammverzeichnis des Repositories angelegt (sofern sie noch nicht vorhanden war) und mit der Überschrift `# Older changes` initialisiert.
- Am Ende des Changelog-Abschnitts in der `README.md` wurde ein Link zur `CHANGELOG_OLD.md` hinzugefügt (sofern noch nicht vorhanden), mit dem Hinweis "Older changelogs can be found there".

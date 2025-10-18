[German description can be found below](#deutsche-beschreibung)  
[Deutsche Beschreibung weiter unten](#deutsche-beschreibung)

# Block .commitinfo by adding to .gitignore

## General information

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if the review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or feel that a PR is faulty. Please open an issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR fixes the suggestion **[S9006] .commitinfo file should be excluded by .gitignore, please add a line with text ".commitinfo" to .gitignore** logged by the ioBroker repository checker.

### Background

The file `.commitinfo` is created by `@alcalzone/releasescript` and is normally deleted automatically during processing. However, it may be left over in case of errors or abnormal termination of the release script. Since the `.commitinfo` file should never be committed to GitHub, adding it to `.gitignore` is recommended to prevent accidental commits.

**Note:** Adding `.commitinfo` to `.gitignore` will not influence development tasks and will have no effect on user installations.

### Changes

This PR adds the file `.commitinfo` to `.gitignore` to prevent it from being committed to the repository.

---

# Deutsche Beschreibung

# .commitinfo durch Hinzufügen zu .gitignore blockieren

## Allgemeine Informationen

Dieser PR wurde von iobroker-bot erstellt. Bitte die Änderungen sorgfältig prüfen und den PR bei erfolgreicher Prüfung mergen.

Bei Fragen oder falls ein PR fehlerhaft erscheint, bitte mich (@ioBroker-Bot) kontaktieren. Bitte ein Issue im Repository https://github.com/ioBroker/ioBroker.repochecker öffnen, um einen fehlerhaften PR zu melden.

Und **VIELEN DANK** für die Pflege dieses Adapters von mir und allen Nutzern.
*Gemeinsam für die beste Benutzererfahrung arbeiten.*

*Euer*
*ioBroker Check and Service Bot*

@mcm1957 zur Kenntnisnahme

## Durch diesen PR bereitgestellte Änderungen

Dieser PR behebt den Hinweis **[S9006] .commitinfo-Datei sollte durch .gitignore ausgeschlossen werden, bitte eine Zeile mit dem Text ".commitinfo" zu .gitignore hinzufügen**, der vom ioBroker Repository Checker protokolliert wurde.

### Hintergrund

Die Datei `.commitinfo` wird von `@alcalzone/releasescript` erstellt und normalerweise während der Verarbeitung automatisch gelöscht. Bei Fehlern oder abnormaler Beendigung des Release-Skripts kann sie jedoch zurückbleiben. Da die `.commitinfo`-Datei niemals zu GitHub committed werden sollte, wird das Hinzufügen zu `.gitignore` empfohlen, um versehentliche Commits zu verhindern.

**Hinweis:** Das Hinzufügen von `.commitinfo` zu `.gitignore` hat keinen Einfluss auf Entwicklungsaufgaben und keine Auswirkungen auf Benutzerinstallationen.

### Änderungen

Dieser PR fügt die Datei `.commitinfo` zu `.gitignore` hinzu, um zu verhindern, dass sie zum Repository committed wird.

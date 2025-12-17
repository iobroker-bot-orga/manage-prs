Remove installedFrom attributes from io-package.json

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

This PR fixes the error **[E1084] "installedFrom" is invalid at io-package.json. Please remove.** reported by the ioBroker repository checker.

### Background

The `installedFrom` and `common.installedFrom` properties in `io-package.json` are added during the installation of an adapter and must not be present within the installation package itself. These properties indicate from where an adapter was installed (e.g., from npm, GitHub, or a local file) and are only meaningful in the context of an already installed adapter.

When these properties are present in the repository's `io-package.json` file, it indicates that the file was accidentally committed after an installation or development process. This can cause confusion and should be corrected.

More information about io-package.json attributes can be found in the [ioBroker documentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Changes

This PR removes the following properties from `io-package.json` if they exist:
- `common.installedFrom` - The installedFrom property within the common section
- `installedFrom` - The installedFrom property at the root level

These properties are added automatically during adapter installation and should not be part of the repository's source code. After removal, the adapter will continue to function normally, and the properties will be added again automatically when users install the adapter.

The change ensures:
- The repository checker error E1084 is resolved
- The repository follows ioBroker packaging standards
- No functional changes to the adapter

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

Dieser PR behebt den Fehler **[E1084] "installedFrom" is invalid at io-package.json. Please remove.**, der vom ioBroker Repository Checker gemeldet wurde.

### Hintergrund

Die Eigenschaften `installedFrom` und `common.installedFrom` in der `io-package.json` werden während der Installation eines Adapters hinzugefügt und dürfen nicht im Installationspaket selbst vorhanden sein. Diese Eigenschaften geben an, von wo ein Adapter installiert wurde (z.B. von npm, GitHub oder einer lokalen Datei) und sind nur im Kontext eines bereits installierten Adapters sinnvoll.

Wenn diese Eigenschaften in der Repository-Datei `io-package.json` vorhanden sind, deutet dies darauf hin, dass die Datei versehentlich nach einer Installation oder einem Entwicklungsprozess committet wurde. Dies kann zu Verwirrung führen und sollte korrigiert werden.

Weitere Informationen zu io-package.json-Attributen finden sich in der [ioBroker-Dokumentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Änderungen

Dieser PR entfernt folgende Eigenschaften aus der `io-package.json`, falls vorhanden:
- `common.installedFrom` - Die installedFrom-Eigenschaft innerhalb des common-Abschnitts
- `installedFrom` - Die installedFrom-Eigenschaft auf Root-Ebene

Diese Eigenschaften werden automatisch während der Adapter-Installation hinzugefügt und sollten nicht Teil des Repository-Quellcodes sein. Nach der Entfernung funktioniert der Adapter weiterhin normal, und die Eigenschaften werden automatisch wieder hinzugefügt, wenn Benutzer den Adapter installieren.

Die Änderung stellt sicher:
- Der Repository-Checker-Fehler E1084 ist behoben
- Das Repository folgt den ioBroker-Paketierungsstandards
- Keine funktionalen Änderungen am Adapter

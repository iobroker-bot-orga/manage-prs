Remove deprecated common.title from io-package.json

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

This PR fixes the warning **[W1084] "common.title" is deprecated and replaced by "common.titleLang". Please remove from io-package.json.** reported by the ioBroker repository checker.

### Background

The `common.title` attribute in `io-package.json` has been deprecated in favor of `common.titleLang`. The `common.titleLang` attribute provides a more structured approach for multi-language titles by using an object with language codes as keys.

The deprecated `common.title` attribute should be removed when `common.titleLang` is present, as it is no longer needed and can cause confusion. The repository checker reports this as warning W1084 when both attributes are detected in the configuration.

More information about io-package.json attributes can be found in the [ioBroker documentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Changes

This PR removes the deprecated `common.title` attribute from `io-package.json`. The `common.titleLang` attribute remains unchanged and continues to provide the adapter title in multiple languages.

The change ensures:
- The repository checker warning W1084 is resolved
- The configuration follows current ioBroker standards
- No functional changes to the adapter (titleLang is already being used)

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

Dieser PR behebt die Warnung **[W1084] "common.title" is deprecated and replaced by "common.titleLang". Please remove from io-package.json.**, die vom ioBroker Repository Checker gemeldet wurde.

### Hintergrund

Das Attribut `common.title` in der `io-package.json` wurde zugunsten von `common.titleLang` als veraltet markiert. Das Attribut `common.titleLang` bietet einen strukturierteren Ansatz für mehrsprachige Titel durch Verwendung eines Objekts mit Sprachcodes als Schlüssel.

Das veraltete Attribut `common.title` sollte entfernt werden, wenn `common.titleLang` vorhanden ist, da es nicht mehr benötigt wird und zu Verwirrung führen kann. Der Repository Checker meldet dies als Warnung W1084, wenn beide Attribute in der Konfiguration erkannt werden.

Weitere Informationen zu io-package.json-Attributen finden sich in der [ioBroker-Dokumentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Änderungen

Dieser PR entfernt das veraltete Attribut `common.title` aus der `io-package.json`. Das Attribut `common.titleLang` bleibt unverändert und stellt weiterhin den Adapter-Titel in mehreren Sprachen bereit.

Die Änderung stellt sicher:
- Die Repository Checker Warnung W1084 wird behoben
- Die Konfiguration folgt den aktuellen ioBroker-Standards
- Keine funktionalen Änderungen am Adapter (titleLang wird bereits verwendet)

Remove deprecated common.main attribute from io-package.json

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

This PR fixes the warning **[W1084] "common.main" is deprecated and ignored. Please remove from io-package.json. Executable is defined by entry "main" at package.json.** reported by the ioBroker repository checker.

### Background

The `common.main` attribute in `io-package.json` was historically used to specify the main executable file of an adapter. However, this attribute is now deprecated and ignored by the ioBroker system.

The correct location for defining the main executable is the `main` attribute in `package.json`, which is the standard location for all Node.js packages. Having the redundant `common.main` attribute in `io-package.json` can cause confusion and should be removed.

More information about io-package.json attributes can be found in the [ioBroker documentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Changes

This PR removes the deprecated `common.main` attribute from `io-package.json`. The main executable continues to be properly defined in the `main` attribute of `package.json`.

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

Dieser PR behebt die Warnung **[W1084] "common.main" is deprecated and ignored. Please remove from io-package.json. Executable is defined by entry "main" at package.json.**, die vom ioBroker Repository Checker gemeldet wurde.

### Hintergrund

Das Attribut `common.main` in der `io-package.json` wurde historisch verwendet, um die ausführbare Hauptdatei eines Adapters zu spezifizieren. Dieses Attribut ist jedoch mittlerweile veraltet und wird vom ioBroker-System ignoriert.

Der korrekte Ort zur Definition der ausführbaren Hauptdatei ist das Attribut `main` in der `package.json`, welches der Standardort für alle Node.js-Pakete ist. Das redundante Attribut `common.main` in der `io-package.json` kann zu Verwirrung führen und sollte entfernt werden.

Weitere Informationen zu io-package.json-Attributen finden sich in der [ioBroker-Dokumentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Änderungen

Dieser PR entfernt das veraltete Attribut `common.main` aus der `io-package.json`. Die ausführbare Hauptdatei bleibt weiterhin korrekt im Attribut `main` der `package.json` definiert.

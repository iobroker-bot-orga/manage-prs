Add license information to io-package.json

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

This PR fixes the warning **[W1081] Attribute common.licenseInformation is missing in io-package.json** reported by the ioBroker repository checker.

### Background

The `common.licenseInformation` attribute in `io-package.json` provides structured information about the adapter's license. This replaces the older `common.license` attribute with a more detailed object structure.

The new format allows for better license management and includes:
- **type**: The type of license (e.g., 'free', 'commercial', 'paid')
- **license**: The license identifier (e.g., 'MIT', 'Apache-2.0', 'GPL-3.0')

Setting this attribute ensures that license information is properly structured and easily accessible for users and the ioBroker system.

More information about io-package.json attributes can be found in the [ioBroker documentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Changes

This PR replaces the `common.license` attribute in `io-package.json` with the new `common.licenseInformation` object structure:

```json
"licenseInformation": {
    "type": "free",
    "license": "<license-value>"
}
```

The license value is taken from:
1. The existing `common.license` attribute in `io-package.json`, or
2. The `license` attribute in `package.json` if `common.license` doesn't exist

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

Dieser PR behebt die Warnung **[W1081] Attribute common.licenseInformation is missing in io-package.json**, die vom ioBroker Repository Checker gemeldet wurde.

### Hintergrund

Das Attribut `common.licenseInformation` in der `io-package.json` stellt strukturierte Informationen über die Lizenz des Adapters bereit. Dies ersetzt das ältere Attribut `common.license` durch eine detailliertere Objektstruktur.

Das neue Format ermöglicht eine bessere Lizenzverwaltung und umfasst:
- **type**: Der Lizenztyp (z.B. 'free', 'commercial', 'paid')
- **license**: Die Lizenzkennung (z.B. 'MIT', 'Apache-2.0', 'GPL-3.0')

Das Setzen dieses Attributs stellt sicher, dass Lizenzinformationen ordnungsgemäß strukturiert und für Benutzer und das ioBroker-System leicht zugänglich sind.

Weitere Informationen zu io-package.json-Attributen finden sich in der [ioBroker-Dokumentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Änderungen

Dieser PR ersetzt das Attribut `common.license` in der `io-package.json` durch die neue Objektstruktur `common.licenseInformation`:

```json
"licenseInformation": {
    "type": "free",
    "license": "<Lizenzwert>"
}
```

Der Lizenzwert wird entnommen aus:
1. Dem vorhandenen Attribut `common.license` in der `io-package.json`, oder
2. Dem Attribut `license` in der `package.json`, falls `common.license` nicht existiert

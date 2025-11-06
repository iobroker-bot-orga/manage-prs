Add tier information to io-package.json

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

This PR fixes the warning **[W1035] Attribute common.tier is missing in io-package.json** reported by the ioBroker repository checker.

### Background

The `common.tier` attribute in `io-package.json` defines the start order of adapter instances. Allowed values are 1, 2, or 3:

- **Tier 1**: Start first - for critical adapters like database servers that must be started before all other adapters
- **Tier 2**: Start second - for most adapters (default)
- **Tier 3**: Start last - for visualization adapters that should be started after all other adapters

Setting this attribute ensures that adapter instances are started in the correct order during system initialization, which is important for adapters that depend on other adapters being available.

More information about io-package.json attributes can be found in the [ioBroker documentation](https://github.com/iobroker-community-adapters/ioBroker.harmony/issues).

### Changes

This PR adds the `common.tier` attribute to `io-package.json` with the appropriate default value based on the adapter type:
- Visualization adapters (`visualization`, `visualization-icons`, `visualization-widgets`) receive tier 3
- All other adapters receive tier 2

The attribute is placed after `loglevel` if it exists, or before `license`/`licenseInformation` otherwise, following the standard io-package.json structure.

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

Dieser PR behebt die Warnung **[W1035] Attribute common.tier is missing in io-package.json**, die vom ioBroker Repository Checker gemeldet wurde.

### Hintergrund

Das Attribut `common.tier` in der `io-package.json` definiert die Startreihenfolge von Adapter-Instanzen. Zulässige Werte sind 1, 2 oder 3:

- **Tier 1**: Zuerst starten - für kritische Adapter wie Datenbankserver, die vor allen anderen Adaptern gestartet werden müssen
- **Tier 2**: Als zweites starten - für die meisten Adapter (Standard)
- **Tier 3**: Zuletzt starten - für Visualisierungs-Adapter, die nach allen anderen Adaptern gestartet werden sollen

Das Setzen dieses Attributs stellt sicher, dass Adapter-Instanzen während der Systeminitialisierung in der richtigen Reihenfolge gestartet werden, was wichtig für Adapter ist, die von der Verfügbarkeit anderer Adapter abhängen.

Weitere Informationen zu io-package.json-Attributen finden sich in der [ioBroker-Dokumentation](https://github.com/iobroker-community-adapters/ioBroker.harmony/issues).

### Änderungen

Dieser PR fügt das Attribut `common.tier` zur `io-package.json` mit dem passenden Standardwert basierend auf dem Adapter-Typ hinzu:
- Visualisierungs-Adapter (`visualization`, `visualization-icons`, `visualization-widgets`) erhalten Tier 3
- Alle anderen Adapter erhalten Tier 2

Das Attribut wird nach `loglevel` platziert, falls vorhanden, oder vor `license`/`licenseInformation`, entsprechend der Standard-io-package.json-Struktur.

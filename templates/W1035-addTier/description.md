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

The `common.tier` attribute in `io-package.json` is used to categorize adapters into different quality tiers within the ioBroker ecosystem. This helps users understand the maturity and support level of an adapter:

- **Tier 1**: Official ioBroker adapters with highest priority support
- **Tier 2**: Community-maintained adapters (default for most adapters)
- **Tier 3**: Visualization adapters and other specialized adapters

Having this attribute set allows the ioBroker system to properly categorize and display the adapter in the admin interface and repository listings.

**Note:** Adding the `tier` attribute will not affect the functionality of the adapter but helps with proper categorization in the ioBroker ecosystem.

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

Das Attribut `common.tier` in der `io-package.json` wird verwendet, um Adapter in verschiedene Qualitätsstufen innerhalb des ioBroker-Ökosystems zu kategorisieren. Dies hilft Benutzern, die Reife und den Supportlevel eines Adapters zu verstehen:

- **Tier 1**: Offizielle ioBroker-Adapter mit höchster Support-Priorität
- **Tier 2**: Community-gepflegte Adapter (Standard für die meisten Adapter)
- **Tier 3**: Visualisierungs-Adapter und andere spezialisierte Adapter

Das Setzen dieses Attributs ermöglicht es dem ioBroker-System, den Adapter in der Admin-Oberfläche und in Repository-Auflistungen korrekt zu kategorisieren und anzuzeigen.

**Hinweis:** Das Hinzufügen des `tier`-Attributs beeinflusst nicht die Funktionalität des Adapters, hilft aber bei der korrekten Kategorisierung im ioBroker-Ökosystem.

### Änderungen

Dieser PR fügt das Attribut `common.tier` zur `io-package.json` mit dem passenden Standardwert basierend auf dem Adapter-Typ hinzu:
- Visualisierungs-Adapter (`visualization`, `visualization-icons`, `visualization-widgets`) erhalten Tier 3
- Alle anderen Adapter erhalten Tier 2

Das Attribut wird nach `loglevel` platziert, falls vorhanden, oder vor `license`/`licenseInformation`, entsprechend der Standard-io-package.json-Struktur.

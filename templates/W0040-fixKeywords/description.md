Fix keywords in package.json and io-package.json

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

This PR fixes the following warnings created by the repository checker:
- **[W0040]** "keywords" within package.json should contain "ioBroker"
- **[W1068]** "common.keywords" should not contain "iobroker", "adapter" or "smart home" in io-package.json

### Background

Keywords are important for users to find adapters in the ioBroker repository. The repository checker enforces certain rules for keywords to ensure consistency and discoverability:

- **package.json**: Must contain "ioBroker" (with correct capitalization) as a keyword
- **io-package.json**: Should not contain generic keywords like "iobroker", "adapter" or "smart home" as they are redundant and do not provide meaningful search value

### Changes

This PR performs the following modifications:

**In package.json:**
- Ensures the "keywords" array exists
- Removes any case-insensitive variations of "iobroker" that do not match the exact string "ioBroker" (e.g., "iobroker", "IoBroker", "IOBROKER")
- Adds "ioBroker" as the first keyword if it is not already present

**In io-package.json:**
- Ensures the "common.keywords" array exists
- Removes generic keywords that match "iobroker", "adapter" or "smart home" (case-insensitive)

The script minimizes changes by only modifying files when necessary and preserving the existing JSON formatting when no changes are needed.

---

# Deutsche Beschreibung

## Allgemeine Informationen

Dieser PR wurde von iobroker-bot erstellt. Bitte die Änderungen sorgfältig prüfen und den PR bei erfolgreicher Prüfung mergen.

Bei Fragen oder falls ein PR fehlerhaft erscheint, bitte mich (@ioBroker-Bot) kontaktieren. Zum Melden eines fehlerhaften PR bitte ein Issue im Repository https://github.com/ioBroker/ioBroker.repochecker öffnen.

**VIELEN DANK** für die Wartung dieses Adapters von mir und allen Nutzern.
*Gemeinsam für die beste Benutzererfahrung arbeiten.*

*Euer*
*ioBroker Check and Service Bot*

@mcm1957 zur Kenntnisnahme

## Durch diesen PR bereitgestellte Änderungen

Dieser PR behebt die folgenden Warnungen des Repository Checkers:
- **[W0040]** "keywords" innerhalb von package.json sollte "ioBroker" enthalten
- **[W1068]** "common.keywords" sollte nicht "iobroker", "adapter" oder "smart home" in io-package.json enthalten

### Hintergrund

Keywords sind wichtig, damit Nutzer Adapter im ioBroker Repository finden können. Der Repository Checker erzwingt bestimmte Regeln für Keywords, um Konsistenz und Auffindbarkeit sicherzustellen:

- **package.json**: Muss "ioBroker" (mit korrekter Großschreibung) als Keyword enthalten
- **io-package.json**: Sollte keine generischen Keywords wie "iobroker", "adapter" oder "smart home" enthalten, da diese redundant sind und keinen sinnvollen Suchwert bieten

### Änderungen

Dieser PR führt folgende Änderungen durch:

**In package.json:**
- Stellt sicher, dass das "keywords"-Array existiert
- Entfernt alle groß-/kleinschreibungsunabhängigen Variationen von "iobroker", die nicht exakt dem String "ioBroker" entsprechen (z.B. "iobroker", "IoBroker", "IOBROKER")
- Fügt "ioBroker" als erstes Keyword hinzu, falls noch nicht vorhanden

**In io-package.json:**
- Stellt sicher, dass das "common.keywords"-Array existiert
- Entfernt generische Keywords, die "iobroker", "adapter" oder "smart home" entsprechen (groß-/kleinschreibungsunabhängig)

Das Skript minimiert Änderungen, indem Dateien nur bei Bedarf geändert werden und die vorhandene JSON-Formatierung beibehalten wird, wenn keine Änderungen erforderlich sind.

Fix Schema Links for VSCode

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

This PR fixes several errors and warnings related to schema checking of io-package.json and jsonConfig files reported by the repository checker.

The PR updates the `.vscode/settings.json` file to ensure proper JSON schema validation in Visual Studio Code for ioBroker-specific files.

The PR automatically:
- Adds or updates the `json.schemas` section with proper schema URLs
- Configures schema validation for `io-package.json` using the official ioBroker.js-controller schema
- Configures schema validation for jsonConfig files (`admin/jsonConfig.json`, `admin/jsonCustom.json`, `admin/jsonTab.json` and their `.json5` variants) using the official ioBroker.admin schema
- Ensures all jsonConfig file variants are included in the file matching patterns
- Validates the structure of existing `json.schemas` entries before making changes

Benefits:
- Enables real-time validation and IntelliSense for io-package.json in VSCode
- Provides auto-completion and validation for jsonConfig files
- Helps prevent configuration errors during development
- Improves developer experience with immediate feedback on schema violations

---

## Deutsche Beschreibung

## Allgemeine Informationen

Dieses PR wurde von iobroker-bot erstellt. Bitte die Änderungen sorgfältig prüfen und das PR bei erfolgreicher Prüfung zusammenführen.

Bei Fragen oder falls ein PR fehlerhaft erscheint, bitte mich (@ioBroker-Bot) kontaktieren. Zum Melden eines fehlerhaften PR bitte ein Issue im Repository https://github.com/ioBroker/ioBroker.repochecker öffnen.

**VIELEN DANK** für die Wartung dieses Adapters von mir und allen Benutzern.
*Gemeinsam für die beste Benutzererfahrung arbeiten.*

*euer*
*ioBroker Check and Service Bot*

@mcm1957 zur Kenntnisnahme

## Durch dieses PR bereitgestellte Änderungen

Dieser PR behebt mehrere Fehler und Warnungen bezüglich der Schema-Überprüfung von io-package.json und jsonConfig-Dateien, die vom Repository-Checker gemeldet wurden.

Der PR aktualisiert die Datei `.vscode/settings.json`, um eine korrekte JSON-Schema-Validierung in Visual Studio Code für ioBroker-spezifische Dateien sicherzustellen.

Der PR führt automatisch folgende Aktionen aus:
- Fügt den Abschnitt `json.schemas` hinzu oder aktualisiert ihn mit den korrekten Schema-URLs
- Konfiguriert die Schema-Validierung für `io-package.json` unter Verwendung des offiziellen ioBroker.js-controller-Schemas
- Konfiguriert die Schema-Validierung für jsonConfig-Dateien (`admin/jsonConfig.json`, `admin/jsonCustom.json`, `admin/jsonTab.json` und deren `.json5`-Varianten) unter Verwendung des offiziellen ioBroker.admin-Schemas
- Stellt sicher, dass alle jsonConfig-Dateivarianten in den Datei-Matching-Mustern enthalten sind
- Validiert die Struktur vorhandener `json.schemas`-Einträge vor dem Vornehmen von Änderungen

Vorteile:
- Ermöglicht Echtzeit-Validierung und IntelliSense für io-package.json in VSCode
- Bietet Auto-Vervollständigung und Validierung für jsonConfig-Dateien
- Hilft, Konfigurationsfehler während der Entwicklung zu vermeiden
- Verbessert die Entwicklererfahrung durch sofortiges Feedback bei Schema-Verstößen

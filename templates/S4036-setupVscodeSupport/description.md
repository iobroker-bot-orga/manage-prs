Add .vscode/settings.json with JSON Schema Definitions

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

This PR fixes suggestion "[S4036] Consider adding .vscode/settings.json file with JSON schema definitions for better development experience with Visual Studio Code." created by the repository checker.

The PR adds a `.vscode/settings.json` file to the repository, providing JSON schema definitions for ioBroker-specific files. This improves the development experience in Visual Studio Code by enabling real-time validation, IntelliSense, and auto-completion for the following files:

- `io-package.json` — validated against the official ioBroker.js-controller schema
- `admin/jsonConfig.json`, `admin/jsonCustom.json`, `admin/jsonTab.json` (and their `.json5` variants) — validated against the official ioBroker.admin schema

For TypeScript-based adapters, the `typescript.tsdk` setting is also included to point Visual Studio Code to the locally installed TypeScript version.

The settings are based on the official ioBroker adapter examples:
- JavaScript adapters: https://github.com/ioBroker/ioBroker.example/tree/master/JavaScript/.vscode
- TypeScript adapters: https://github.com/ioBroker/ioBroker.example/tree/master/TypeScript/.vscode

Benefits:
- Enables real-time JSON schema validation in Visual Studio Code
- Provides auto-completion and IntelliSense for ioBroker configuration files
- Helps prevent configuration errors during development
- Improves the overall developer experience

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

Dieser PR behebt den Hinweis „[S4036] Consider adding .vscode/settings.json file with JSON schema definitions for better development experience with Visual Studio Code.", der vom Repository-Checker gemeldet wurde.

Der PR fügt dem Repository eine `.vscode/settings.json`-Datei hinzu, die JSON-Schema-Definitionen für ioBroker-spezifische Dateien bereitstellt. Dies verbessert die Entwicklungserfahrung in Visual Studio Code durch Echtzeit-Validierung, IntelliSense und Auto-Vervollständigung für folgende Dateien:

- `io-package.json` — validiert anhand des offiziellen ioBroker.js-controller-Schemas
- `admin/jsonConfig.json`, `admin/jsonCustom.json`, `admin/jsonTab.json` (und deren `.json5`-Varianten) — validiert anhand des offiziellen ioBroker.admin-Schemas

Für TypeScript-basierte Adapter wird außerdem die Einstellung `typescript.tsdk` hinzugefügt, die Visual Studio Code auf die lokal installierte TypeScript-Version verweist.

Die Einstellungen basieren auf den offiziellen ioBroker-Adapter-Beispielen:
- JavaScript-Adapter: https://github.com/ioBroker/ioBroker.example/tree/master/JavaScript/.vscode
- TypeScript-Adapter: https://github.com/ioBroker/ioBroker.example/tree/master/TypeScript/.vscode

Vorteile:
- Ermöglicht Echtzeit-JSON-Schema-Validierung in Visual Studio Code
- Bietet Auto-Vervollständigung und IntelliSense für ioBroker-Konfigurationsdateien
- Hilft, Konfigurationsfehler während der Entwicklung zu vermeiden
- Verbessert die allgemeine Entwicklungserfahrung

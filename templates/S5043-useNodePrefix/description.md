Add node: prefix to Node.js built-in module requires and imports

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

This PR fixes the suggestion **[S5043] Node.js built-in modules should be required/imported using the node: prefix** reported by the ioBroker repository checker.

### Background

Starting with Node.js 14.18.0 / 16.0.0, built-in modules can be imported using the `node:` URL scheme (e.g., `require('node:fs')` instead of `require('fs')`). This is now the recommended way to reference built-in modules because:

- It makes it immediately clear that the import is a Node.js built-in module and not a third-party package
- It avoids potential naming conflicts with npm packages that have the same name as built-ins
- It improves code readability and maintainability
- It is the modern Node.js best practice recommended by the Node.js project

### Changes

This PR updates all `require()` calls, `import ... from` statements, and dynamic `import()` calls in the adapter source files to use the `node:` prefix for Node.js built-in modules.

For example:
- `require('fs')` → `require('node:fs')`
- `require('path')` → `require('node:path')`
- `import fs from 'fs'` → `import fs from 'node:fs'`
- `import { readFile } from 'fs'` → `import { readFile } from 'node:fs'`

The following directories and files are excluded from the scan:
- Directories: `admin`, `build`, `doc`, `src-admin`, `src-widgets`, `admin-src`, `test`, `node_modules`, `.git`, `.vscode`, `.dev-server`
- Files: `tasks.js`, `Gruntfile.js`, `gulpfile.js`

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

Dieser PR behebt die Anregung **[S5043] Node.js-interne Module sollten mit dem node: Präfix eingebunden werden**, die vom ioBroker Repository Checker gemeldet wurde.

### Hintergrund

Seit Node.js 14.18.0 / 16.0.0 können integrierte Module mit dem `node:` URL-Schema importiert werden (z.B. `require('node:fs')` statt `require('fs')`). Dies ist nun die empfohlene Methode zur Referenzierung eingebauter Module, weil:

- Es sofort klar macht, dass der Import ein Node.js-internes Modul und kein Drittanbieterpaket ist
- Es potenzielle Namenskonflikte mit npm-Paketen vermeidet, die denselben Namen wie Built-ins haben
- Es die Code-Lesbarkeit und Wartbarkeit verbessert
- Es die moderne Node.js Best Practice ist, die vom Node.js-Projekt empfohlen wird

### Änderungen

Dieser PR aktualisiert alle `require()`-Aufrufe, `import ... from`-Anweisungen und dynamische `import()`-Aufrufe in den Adapter-Quelldateien, um das `node:`-Präfix für Node.js-interne Module zu verwenden.

Zum Beispiel:
- `require('fs')` → `require('node:fs')`
- `require('path')` → `require('node:path')`
- `import fs from 'fs'` → `import fs from 'node:fs'`
- `import { readFile } from 'fs'` → `import { readFile } from 'node:fs'`

Folgende Verzeichnisse und Dateien sind vom Scan ausgeschlossen:
- Verzeichnisse: `admin`, `build`, `doc`, `src-admin`, `src-widgets`, `admin-src`, `test`, `node_modules`, `.git`, `.vscode`, `.dev-server`
- Dateien: `tasks.js`, `Gruntfile.js`, `gulpfile.js`

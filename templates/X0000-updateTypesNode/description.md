Update @types/node to match minimum supported Node.js version
[German description can be found below](#deutsche-beschreibung)
[Deutsche Beschreibung befindet sich weiter unten](#deutsche-beschreibung)

## General information

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if the review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or if this PR appears to be faulty. Please open an issue in the repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR checks the minimum supported Node.js version from `engines.node` in `package.json` and aligns `@types/node` to this major version.

If `@types/node` exists in `dependencies`, `devDependencies`, or `peerDependencies` and its major version does not match the minimum supported Node.js major version, this PR updates `@types/node` to `^__TARGET_TYPES_NODE_VERSION__`.

To keep `package-lock.json` in sync with the dependency update, this PR also runs `npm install` and commits the resulting lockfile changes.

### Why this change is recommended

`@types/node` should always match the minimum supported Node.js version. Otherwise, TypeScript may allow APIs that are not available at runtime for the minimum supported Node.js version, which can lead to runtime errors.

Keeping `@types/node` aligned with the minimum supported Node.js version helps avoid this type mismatch and is therefore recommended.

### Summary of changes

__CHANGES_SUMMARY__

### Note about lockfile merge conflicts

Because this PR also updates `package-lock.json`, merge conflicts may occur. If conflicts happen, please add a comment with `@iobroker-bot recreate` so the PR can be recreated with an updated `package-lock.json`.

---

## Deutsche Beschreibung

## Allgemeine Informationen

Dieser PR wurde durch iobroker-bot erstellt. Bitte die Änderungen sorgfältig prüfen und den PR bei erfolgreicher Prüfung zusammenführen.

Bei Fragen oder wenn der PR fehlerhaft erscheint, gerne Kontakt mit mir (@ioBroker-Bot) aufnehmen. Bitte ein Issue im Repository https://github.com/ioBroker/ioBroker.repochecker öffnen, um einen fehlerhaften PR zu melden.

Und **VIELEN DANK** für die Wartung dieses Adapters von mir und allen Nutzenden.
*Gemeinsam für das beste Nutzererlebnis arbeiten.*

*Euer*
*ioBroker Check and Service Bot*

@mcm1957 zum Nachweis

## Durch diesen PR bereitgestellte Änderungen

Dieser PR prüft die minimal unterstützte Node.js-Version aus `engines.node` in `package.json` und richtet `@types/node` auf diese Major-Version aus.

Falls `@types/node` in `dependencies`, `devDependencies` oder `peerDependencies` vorhanden ist und dessen Major-Version nicht zur minimal unterstützten Node.js-Major-Version passt, aktualisiert dieser PR `@types/node` auf `^__TARGET_TYPES_NODE_VERSION__`.

Damit `package-lock.json` mit der Abhängigkeitsänderung konsistent bleibt, führt dieser PR zusätzlich `npm install` aus und übernimmt die resultierenden Lockfile-Änderungen.

### Warum diese Änderung empfohlen ist

`@types/node` sollte immer zur minimal unterstützten Node.js-Version passen. Andernfalls kann TypeScript APIs erlauben, die zur Laufzeit in der minimal unterstützten Node.js-Version nicht verfügbar sind, was zu Laufzeitfehlern führen kann.

Die Ausrichtung von `@types/node` auf die minimal unterstützte Node.js-Version hilft, diesen Typ-Mismatch zu vermeiden, und wird daher empfohlen.

### Zusammenfassung der Änderungen

__CHANGES_SUMMARY__

### Hinweis zu Lockfile-Merge-Konflikten

Da dieser PR auch `package-lock.json` aktualisiert, können Merge-Konflikte auftreten. Bei Konflikten bitte einen Kommentar mit `@iobroker-bot recreate` hinzufügen, damit der PR mit einer aktualisierten `package-lock.json` neu erstellt werden kann.

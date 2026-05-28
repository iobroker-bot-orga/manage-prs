Align @tsconfig/nodeXX with engines.node in package.json
[German description can be found below](#deutsche-beschreibung)
[Deutsche Beschreibung befindet sich weiter unten](#deutsche-beschreibung)

## General information

⚠️ **Attention:** Please review this PR very carefully. Responsibility for validating these changes in the specific adapter environment remains with the developer. Merge this PR only if the standard tests are successful.

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if the review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or if this PR appears to be faulty. Please open an issue in the repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR fixes warning:
- `__WARNING_TEXT_EN__`

`@tsconfig/nodeXX` should always match the lowest Node.js version that an adapter is allowed to use, as defined by `engines.node` in `package.json`.

### Detected Node.js requirement

- Current value from `package.json` `engines.node`: `__ENGINES_NODE_RANGE__`
- Extracted minimum supported Node.js major version: `__ENGINES_NODE_MAJOR__`

### Applied changes

__DEPENDENCY_CHANGE_EN__
__TSCONFIG_CHANGE_EN__

---

## Deutsche Beschreibung

## Allgemeine Informationen

⚠️ **Achtung:** Bitte diesen PR besonders sorgfältig prüfen. Die Verantwortung für die Validierung dieser Änderungen in der konkreten Adapter-Umgebung liegt bei den Entwickelnden. Dieser PR soll nur zusammengeführt werden, wenn die Standardtests erfolgreich sind.

Dieser PR wurde durch iobroker-bot erstellt. Bitte die Änderungen sorgfältig prüfen und den PR bei erfolgreicher Prüfung zusammenführen.

Bei Fragen oder wenn der PR fehlerhaft erscheint, gerne Kontakt mit mir (@ioBroker-Bot) aufnehmen. Bitte ein Issue im Repository https://github.com/ioBroker/ioBroker.repochecker öffnen, um einen fehlerhaften PR zu melden.

Und **VIELEN DANK** für die Wartung dieses Adapters von mir und allen Nutzenden.
*Gemeinsam für das beste Nutzererlebnis arbeiten.*

*Euer*
*ioBroker Check and Service Bot*

@mcm1957 zum Nachweis

## Durch diesen PR bereitgestellte Änderungen

Dieser PR behebt die Warnung:
- `__WARNING_TEXT_DE__`

`@tsconfig/nodeXX` soll immer zur niedrigsten Node.js-Version passen, die für einen Adapter gemäß `engines.node` in `package.json` erlaubt ist.

### Erkannte Node.js-Anforderung

- Aktueller Wert aus `package.json` `engines.node`: `__ENGINES_NODE_RANGE__`
- Ermittelte minimal unterstützte Node.js-Major-Version: `__ENGINES_NODE_MAJOR__`

### Durchgeführte Änderungen

__DEPENDENCY_CHANGE_DE__
__TSCONFIG_CHANGE_DE__

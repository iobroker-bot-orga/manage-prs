Update Node.js versions in test-and-release workflow

[German description can be found below](#deutsche-beschreibung)  
[Deutsche Beschreibung befindet sich weiter unten](#deutsche-beschreibung)

## General information

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or feel that a PR is faulty. Please open a issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR updates the Node.js versions used in the `.github/workflows/test-and-release.yml` workflow to align with the currently maintained Node.js releases.

### ⚠️ Important: Compatibility check required

**Please verify that your adapter is compatible with the Node.js versions introduced by this PR before merging.**

### Changes made

1. **Test matrix updated**: The Node.js versions used for testing in the `adapter-tests` job have been updated to `__MATRIX_NODEJS__`.

2. **Check-and-lint Node.js version updated**: The Node.js version used in the `check-and-lint` job has been set to `__DEFAULT_NODEJS__`.

3. **Deploy Node.js version updated** (if applicable): The Node.js version used in the `deploy` job has been set to `__DEFAULT_NODEJS__`. This change is only applied if the deploy step is present and not commented out.

4. **Minimum Node.js requirement updated** (if required): The `engines.node` field in `package.json` has been updated to require at least Node.js `__MIN_NODEJS__`. This change is only applied if the currently specified minimum version is lower than `__MIN_NODEJS__`.

### Summary of Node.js versions after applying this PR

- **Testing matrix**: `__MATRIX_NODEJS__`
- **Minimum required Node.js version** (in `package.json`): `>= __MIN_NODEJS__`

---

## Deutsche Beschreibung

## Aktualisierung der Node.js-Versionen im test-and-release-Workflow

## Allgemeine Informationen

Dieser PR wurde durch iobroker-bot erstellt. Bitte die Änderungen sorgfältig überprüfen und den PR nach erfolgreicher Prüfung zusammenführen.

Bei Fragen oder wenn ein PR fehlerhaft erscheint, kann gerne Kontakt mit mir (@ioBroker-Bot) aufgenommen werden. Bitte ein Issue im Repository https://github.com/ioBroker/ioBroker.repochecker öffnen, um einen fehlerhaften PR zu melden.

Und **VIELEN DANK** für die Wartung dieses Adapters von mir und allen Nutzern.
*Gemeinsam für das beste Nutzererlebnis arbeiten.*

*Euer*
*ioBroker Check and Service Bot*

@mcm1957 zum Nachweis

## Durch diesen PR bereitgestellte Änderungen

Dieser PR aktualisiert die Node.js-Versionen im `.github/workflows/test-and-release.yml`-Workflow, um die aktuell gewarteten Node.js-Versionen zu verwenden.

### ⚠️ Wichtig: Kompatibilitätsprüfung erforderlich

**Bitte sicherstellen, dass der Adapter mit den durch diesen PR eingeführten Node.js-Versionen kompatibel ist, bevor der PR zusammengeführt wird.**

### Durchgeführte Änderungen

1. **Test-Matrix aktualisiert**: Die für Tests verwendeten Node.js-Versionen im `adapter-tests`-Job wurden auf `__MATRIX_NODEJS__` aktualisiert.

2. **Node.js-Version für Check-and-Lint aktualisiert**: Die im `check-and-lint`-Job verwendete Node.js-Version wurde auf `__MIN_NODEJS__.x` gesetzt.

3. **Node.js-Version für Deployment aktualisiert** (falls zutreffend): Die im `deploy`-Job verwendete Node.js-Version wurde auf `__MIN_NODEJS__.x` gesetzt. Diese Änderung wird nur angewendet, wenn der Deploy-Schritt vorhanden und nicht auskommentiert ist.

4. **Mindest-Node.js-Anforderung aktualisiert** (falls erforderlich): Das Feld `engines.node` in der `package.json` wurde aktualisiert, um mindestens Node.js `__MIN_NODEJS__` zu erfordern. Diese Änderung wird nur angewendet, wenn die aktuell angegebene Mindestversion unter `__MIN_NODEJS__` liegt.

### Zusammenfassung der Node.js-Versionen nach Anwendung dieses PR

- **Test-Matrix**: `__MATRIX_NODEJS__`
- **Mindest-Node.js-Version** (in `package.json`): `>= __MIN_NODEJS__`

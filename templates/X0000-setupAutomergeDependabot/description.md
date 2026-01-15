# Setup Auto-Merge for Dependabot PRs
[German description can be found below](#deutsche-beschreibung) | [Deutsche Beschreibung weiter unten](#deutsche-beschreibung)

## General information 

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or feel that a PR is faulty. Please open an issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR sets up automatic merging for Dependabot pull requests using a new GitHub Actions workflow.

### Background

GitHub has announced that they will discontinue processing Dependabot merge commands on **January 20, 2026**. The old approach of using comment commands like `@dependabot merge` will no longer work after this date.

### What this PR does

This PR replaces the current setup for auto-merging Dependabot PRs with a new workflow that uses the `iobroker-bot-orga/action-automerge-dependabot` action. Specifically:

1. **Creates a new workflow**: A new workflow file `.github/workflows/automerge-dependabot.yml` is created. This workflow automatically triggers when Dependabot opens or updates pull requests.

2. **Creates auto-merge configuration**: If not already present, a configuration file `.github/auto-merge.yml` is created. This file defines which types of dependency updates should be automatically merged:
   - **Production dependencies**: Only patch updates (e.g., 1.0.0 → 1.0.1) are automatically merged
   - **Development dependencies**: Both patch and minor updates (e.g., 1.0.0 → 1.1.0) are automatically merged

3. **Disables old workflows**: If existing automerge workflow files are found (such as `dependabot-automerge.yml` or `dependabot-auto-merge.yml`), they will be renamed to `.OLD` files. This preserves them for reference but prevents them from running.

### Important notes

**This PR is not mandatory.** It is up to the developer to review and decide whether to merge this PR. The existing approach will continue to work until January 20, 2026. However, it is recommended to migrate to the new approach before this deadline.

The new workflow will:
- Only run for Dependabot PRs
- Wait for all required checks to pass before merging
- Respect the merge rules defined in `.github/auto-merge.yml`
- Not merge updates that don't match the configured rules

### Configuration

The default configuration in `.github/auto-merge.yml` can be customized to match your needs. For example, you can:
- Allow all patch updates for all dependencies
- Allow major updates for development dependencies
- Add custom matching rules

Please refer to the comments in the `.github/auto-merge.yml` file for more configuration options and examples.

### References

- [GitHub Announcement about Dependabot command deprecation](https://github.blog/changelog/2024-09-11-dependabot-merge-comment-command-deprecation/)
- [action-automerge-dependabot repository](https://github.com/iobroker-bot-orga/action-automerge-dependabot)

---

## Deutsche Beschreibung

Diese PR richtet das automatische Mergen von Dependabot-Pull-Requests mithilfe eines neuen GitHub Actions Workflows ein.

### Hintergrund

GitHub hat angekündigt, dass die Verarbeitung von Dependabot-Merge-Befehlen am **20. Januar 2026** eingestellt wird. Der alte Ansatz mit Kommentar-Befehlen wie `@dependabot merge` wird nach diesem Datum nicht mehr funktionieren.

### Was diese PR macht

Diese PR ersetzt die aktuelle Einrichtung zum automatischen Mergen von Dependabot-PRs durch einen neuen Workflow, der die Aktion `iobroker-bot-orga/action-automerge-dependabot` verwendet. Konkret:

1. **Erstellt einen neuen Workflow**: Eine neue Workflow-Datei `.github/workflows/automerge-dependabot.yml` wird erstellt. Dieser Workflow wird automatisch ausgelöst, wenn Dependabot Pull Requests öffnet oder aktualisiert.

2. **Erstellt Auto-Merge-Konfiguration**: Falls noch nicht vorhanden, wird eine Konfigurationsdatei `.github/auto-merge.yml` erstellt. Diese Datei definiert, welche Arten von Abhängigkeits-Updates automatisch gemergt werden sollen:
   - **Produktions-Abhängigkeiten**: Nur Patch-Updates (z.B. 1.0.0 → 1.0.1) werden automatisch gemergt
   - **Entwicklungs-Abhängigkeiten**: Sowohl Patch- als auch Minor-Updates (z.B. 1.0.0 → 1.1.0) werden automatisch gemergt

3. **Deaktiviert alte Workflows**: Falls vorhandene Automerge-Workflow-Dateien gefunden werden (wie `dependabot-automerge.yml` oder `dependabot-auto-merge.yml`), werden diese in `.OLD`-Dateien umbenannt. Dies bewahrt sie als Referenz, verhindert aber deren Ausführung.

### Wichtige Hinweise

**Diese PR ist nicht verpflichtend.** Es liegt am Entwickler, diese PR zu prüfen und zu entscheiden, ob sie gemergt werden soll. Der bestehende Ansatz wird weiterhin bis zum 20. Januar 2026 funktionieren. Es wird jedoch empfohlen, vor diesem Termin auf den neuen Ansatz zu migrieren.

Der neue Workflow wird:
- Nur für Dependabot-PRs ausgeführt
- Warten, bis alle erforderlichen Prüfungen bestanden sind, bevor gemergt wird
- Die in `.github/auto-merge.yml` definierten Merge-Regeln beachten
- Updates nicht mergen, die nicht den konfigurierten Regeln entsprechen

### Konfiguration

Die Standardkonfiguration in `.github/auto-merge.yml` kann an die eigenen Bedürfnisse angepasst werden. Beispielsweise kann man:
- Alle Patch-Updates für alle Abhängigkeiten erlauben
- Major-Updates für Entwicklungs-Abhängigkeiten erlauben
- Benutzerdefinierte Matching-Regeln hinzufügen

Bitte die Kommentare in der `.github/auto-merge.yml`-Datei für weitere Konfigurationsoptionen und Beispiele beachten.

### Referenzen

- [GitHub-Ankündigung zur Dependabot-Befehlsabschaffung](https://github.blog/changelog/2024-09-11-dependabot-merge-comment-command-deprecation/)
- [action-automerge-dependabot Repository](https://github.com/iobroker-bot-orga/action-automerge-dependabot)

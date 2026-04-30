Add Dependabot Ignore Rule for @types/node Major Version Updates
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

This PR resolves warning **W8917** logged by the ioBroker repository checker.

### What this PR does

This PR adds an ignore rule to the Dependabot configuration in `.github/dependabot.yml` to prevent Dependabot from automatically proposing major version bumps for the `@types/node` package.

The following change is applied to every `updates:` block that specifies `package-ecosystem: npm` and `directory: /` or `directories: ['**/*']`:

```yaml
ignore:
  - dependency-name: "@types/node"
    update-types:
      - "version-update:semver-major"
```

### Why this change is needed

The `@types/node` package provides TypeScript type definitions for the Node.js runtime API. The major version of `@types/node` that an adapter should use is determined by the **lowest** major Node.js version the adapter supports. The lowest supported Node.js version is specified in the `engines.node` field of `package.json`.

Allowing Dependabot to automatically bump `@types/node` to a newer major version would introduce type definitions for Node.js APIs that are not available in the minimum supported Node.js version. This can lead to incorrect type checking and potential runtime errors on older Node.js installations. Therefore, major version updates of `@types/node` must always be reviewed manually and aligned with any intentional change to the minimum supported Node.js version.

### Reference

- [ioBroker Repository Checker – Warning W8917](https://github.com/ioBroker/ioBroker.repochecker)
- [Dependabot ignore configuration](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference#ignore)

---

## Deutsche Beschreibung

Dieser PR behebt die Warnung **W8917**, die vom ioBroker-Repository-Checker gemeldet wird.

### Was dieser PR macht

Dieser PR fügt der Dependabot-Konfiguration in `.github/dependabot.yml` eine Ignore-Regel hinzu, die verhindert, dass Dependabot automatisch Major-Version-Bumps für das Paket `@types/node` vorschlägt.

Die folgende Änderung wird auf jeden `updates:`-Block angewendet, der `package-ecosystem: npm` und `directory: /` oder `directories: ['**/*']` enthält:

```yaml
ignore:
  - dependency-name: "@types/node"
    update-types:
      - "version-update:semver-major"
```

### Warum diese Änderung notwendig ist

Das Paket `@types/node` stellt TypeScript-Typdefinitionen für die Node.js-Laufzeit-API bereit. Die Major-Version von `@types/node`, die ein Adapter verwenden sollte, wird durch die **niedrigste** unterstützte Node.js-Hauptversion des Adapters bestimmt. Die niedrigste unterstützte Node.js-Version wird im Feld `engines.node` in `package.json` angegeben.

Würde Dependabot `@types/node` automatisch auf eine neuere Major-Version aktualisieren, würden Typdefinitionen für Node.js-APIs eingeführt, die in der minimal unterstützten Node.js-Version nicht verfügbar sind. Dies kann zu fehlerhafter Typprüfung und potenziellen Laufzeitfehlern auf älteren Node.js-Installationen führen. Daher müssen Major-Version-Updates von `@types/node` immer manuell geprüft und mit einer bewussten Änderung der minimal unterstützten Node.js-Version abgestimmt werden.

### Referenzen

- [ioBroker Repository Checker – Warnung W8917](https://github.com/ioBroker/ioBroker.repochecker)
- [Dependabot Ignore-Konfiguration](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference#ignore)

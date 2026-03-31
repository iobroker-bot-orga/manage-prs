Update Dependabot Configuration – Add npm Cooldown
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

This PR updates the Dependabot configuration in `.github/dependabot.yml` to improve security by adding a cooldown period for npm dependency updates.

### Why merging this PR is highly recommended

Merging this PR is **highly recommended**. Adding a cooldown phase of seven days to the Dependabot configuration significantly reduces the chance that zero-day vulnerabilities and compromised npm packages will be automatically provided and eventually merged by Dependabot. A brief delay gives the security community time to detect and report malicious or vulnerable packages before they reach your project.

That said, it is entirely up to the developer to review the changes and decide whether to merge this PR.

### What this PR does

1. **Adds a cooldown configuration** to every `updates:` block for `package-ecosystem: npm`. The `cooldown` option delays normal dependency updates by 7 days while still allowing security updates to be processed immediately:

   ```yaml
   cooldown:
     default-days: 7
   ```

   > **Note:** Cooldown is not supported for the `github-actions` ecosystem and is therefore only applied to `npm` blocks.

2. **Removes unsupported `day:` clause** from any `schedule:` block that uses `interval: monthly`. The `day:` option is not supported for the `monthly` interval and would cause Dependabot to ignore the configuration.

3. **Adds a descriptive header comment** to `dependabot.yml` explaining the purpose of the cooldown setting and linking to the official documentation.

### References

- [Dependabot Options Reference – cooldown](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#cooldown)
- [Dependabot Options Reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)

---

## Deutsche Beschreibung

Diese PR aktualisiert die Dependabot-Konfiguration in `.github/dependabot.yml`, um die Sicherheit durch eine Cooldown-Phase für npm-Abhängigkeits-Updates zu verbessern.

### Warum das Mergen dieser PR sehr empfohlen wird

Das Mergen dieser PR ist **sehr empfohlen**. Das Hinzufügen einer Cooldown-Phase von sieben Tagen zur Dependabot-Konfiguration verringert deutlich die Chance, dass Zero-Day-Schwachstellen und kompromittierte npm-Pakete automatisch von Dependabot bereitgestellt und letztendlich gemergt werden. Eine kurze Verzögerung gibt der Sicherheits-Community Zeit, bösartige oder anfällige Pakete zu erkennen und zu melden, bevor sie das Projekt erreichen.

Es liegt jedoch letztendlich beim Entwickler, die Änderungen zu prüfen und zu entscheiden, ob diese PR gemergt werden soll.

### Was diese PR macht

1. **Cooldown-Konfiguration hinzufügen** zu jedem `updates:`-Block für `package-ecosystem: npm`. Die `cooldown`-Option verzögert normale Abhängigkeits-Updates um 7 Tage und ermöglicht gleichzeitig, dass Sicherheits-Updates sofort verarbeitet werden:

   ```yaml
   cooldown:
     default-days: 7
   ```

   > **Hinweis:** Cooldown wird für das `github-actions`-Ecosystem nicht unterstützt und wird daher nur auf `npm`-Blöcke angewendet.

2. **Nicht unterstützte `day:`-Klausel entfernen** aus jedem `schedule:`-Block, der `interval: monthly` verwendet. Die `day:`-Option wird für das `monthly`-Intervall nicht unterstützt und würde dazu führen, dass Dependabot die Konfiguration ignoriert.

3. **Beschreibenden Header-Kommentar hinzufügen** zu `dependabot.yml`, der den Zweck der Cooldown-Einstellung erläutert und auf die offizielle Dokumentation verweist.

### Referenzen

- [Dependabot Options Reference – cooldown](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#cooldown)
- [Dependabot Options Reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)

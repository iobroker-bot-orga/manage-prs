Updates for dependabot setup
[German description can be found below](#deutsche-beschreibung) | [Deutsche Beschreibung weiter unten](#deutsche-beschreibung)

## General information 

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or feel that a PR is faulty. Please open a issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR reviews and optimizes the Dependabot configuration in `.github/dependabot.yml` to improve scheduling and increase the number of allowed concurrent pull requests.

### Problem

Running Dependabot using the monthly schedule results in running the job on the first day of every month. This generates a high load on GitHub systems and causes noticeable delays in running workflows. Additionally, the default limit of 5 open pull requests is often too small, resulting in failing updates due to delayed required updates for some packages.

### Solution

This PR applied the following corrections to `.github/dependabot.yml`:

{{CHANGES_EN}}

### Benefits

- Reduced load on GitHub infrastructure by distributing Dependabot runs across the month
- Faster workflow execution due to reduced system congestion
- More dependency updates can be processed in parallel
- Better handling of repositories with multiple package locations

### Reference

For more information about Dependabot configuration options, see the [GitHub Dependabot Options Reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference).

---

## Deutsche Beschreibung

Diese PR überprüft und optimiert die Dependabot-Konfiguration in `.github/dependabot.yml`, um die Zeitplanung zu verbessern und die Anzahl der gleichzeitig erlaubten Pull Requests zu erhöhen.

### Problem

Die Ausführung von Dependabot mit monatlichem Zeitplan führt dazu, dass der Job am ersten Tag jedes Monats ausgeführt wird. Dies erzeugt eine hohe Last auf den GitHub-Systemen und verursacht spürbare Verzögerungen bei der Ausführung von Workflows. Zusätzlich ist das Standardlimit von 5 offenen Pull Requests oft zu klein, was zu fehlgeschlagenen Updates führt, da erforderliche Aktualisierungen für einige Pakete verzögert werden.

### Lösung

Diese PR hat die folgenden Korrekturen an `.github/dependabot.yml` durchgeführt:

{{CHANGES_DE}}

### Vorteile

- Reduzierte Last auf die GitHub-Infrastruktur durch Verteilung der Dependabot-Läufe über den Monat
- Schnellere Workflow-Ausführung aufgrund reduzierter Systemauslastung
- Mehr Abhängigkeits-Updates können parallel verarbeitet werden
- Bessere Handhabung von Repositories mit mehreren Paket-Standorten

### Referenz

Weitere Informationen zu den Dependabot-Konfigurationsoptionen finden sich in der [GitHub Dependabot Options Reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference).

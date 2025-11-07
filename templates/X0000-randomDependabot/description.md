[German description can be found below](#deutsche-beschreibung) | [Deutsche Beschreibung weiter unten](#deutsche-beschreibung)

# Optimize Dependabot Schedule Configuration

## General information 

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or feel that a PR is faulty. Please open a issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR optimizes the Dependabot configuration in `.github/dependabot.yml` to improve scheduling and increase the number of allowed concurrent pull requests.

### Problem

Running Dependabot using the monthly schedule results in running the job on the first day of every month. This generates a high load on GitHub systems and causes noticeable delays in running workflows. Additionally, the default limit of 5 open pull requests is often too small, resulting in failing updates due to delayed required updates for some packages.

### Solution

This PR makes the following changes to address these issues:

1. **Randomized Monthly Schedule**: Converts monthly schedules from `interval: monthly` to `interval: cron` with a randomized execution time. The job will now run once a month on a random day (between the 2nd and 28th) at a random time (between 1:00 and 4:00), spreading the load across GitHub systems.

2. **Increased Pull Request Limit**: Sets the `open-pull-requests-limit` to a minimum of 15 (up from the default of 5). This ensures that more dependency updates can be processed simultaneously without blocking critical updates.

3. **Timezone Configuration**: Ensures all schedules use `timezone: Europe/Berlin` for consistent timing.

4. **Multi-directory Support**: If multiple `package.json` files are detected in the repository, the configuration for npm packages is updated to use `directories: "**/*"` instead of `directory: "/"` to properly scan all subdirectories.

### Benefits

- Reduced load on GitHub infrastructure by distributing Dependabot runs across the month
- Faster workflow execution due to reduced system congestion
- More dependency updates can be processed in parallel
- Better handling of repositories with multiple package locations

### Reference

For more information about Dependabot configuration options, see the [GitHub Dependabot Options Reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference).

---

## Deutsche Beschreibung

Diese PR optimiert die Dependabot-Konfiguration in `.github/dependabot.yml`, um die Zeitplanung zu verbessern und die Anzahl der gleichzeitig erlaubten Pull Requests zu erhöhen.

### Problem

Die Ausführung von Dependabot mit monatlichem Zeitplan führt dazu, dass der Job am ersten Tag jedes Monats ausgeführt wird. Dies erzeugt eine hohe Last auf den GitHub-Systemen und verursacht spürbare Verzögerungen bei der Ausführung von Workflows. Zusätzlich ist das Standardlimit von 5 offenen Pull Requests oft zu klein, was zu fehlgeschlagenen Updates führt, da erforderliche Aktualisierungen für einige Pakete verzögert werden.

### Lösung

Diese PR führt die folgenden Änderungen durch, um diese Probleme zu beheben:

1. **Randomisierter monatlicher Zeitplan**: Die monatlichen Zeitpläne werden von `interval: monthly` auf `interval: cron` mit einer zufälligen Ausführungszeit umgestellt. Der Job wird nun einmal im Monat an einem zufälligen Tag (zwischen dem 2. und 28.) zu einer zufälligen Uhrzeit (zwischen 1:00 und 4:00 Uhr) ausgeführt, wodurch die Last auf die GitHub-Systeme verteilt wird.

2. **Erhöhtes Pull-Request-Limit**: Das `open-pull-requests-limit` wird auf mindestens 15 gesetzt (statt dem Standard von 5). Dies stellt sicher, dass mehr Abhängigkeits-Updates gleichzeitig verarbeitet werden können, ohne kritische Updates zu blockieren.

3. **Zeitzonenkonfiguration**: Alle Zeitpläne verwenden `timezone: Europe/Berlin` für eine konsistente Zeitplanung.

4. **Unterstützung mehrerer Verzeichnisse**: Wenn mehrere `package.json`-Dateien im Repository erkannt werden, wird die Konfiguration für npm-Pakete aktualisiert, um `directories: "**/*"` anstelle von `directory: "/"` zu verwenden, damit alle Unterverzeichnisse ordnungsgemäß gescannt werden.

### Vorteile

- Reduzierte Last auf die GitHub-Infrastruktur durch Verteilung der Dependabot-Läufe über den Monat
- Schnellere Workflow-Ausführung aufgrund reduzierter Systemauslastung
- Mehr Abhängigkeits-Updates können parallel verarbeitet werden
- Bessere Handhabung von Repositories mit mehreren Paket-Standorten

### Referenz

Weitere Informationen zu den Dependabot-Konfigurationsoptionen finden sich in der [GitHub Dependabot Options Reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference).

General update for iobroker-community-adapters repository

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

## Purpose

**This PR is only intended to be applied to repositories in iobroker-community-adapters.**

This PR prepares the repository for maintenance by the iobroker-community-adapters organization. It ensures proper attribution, updates copyright information, and establishes minimum dependency requirements for js-controller and admin.

## Changes provided by this PR

This PR makes the following changes to prepare the repository for iobroker-community-adapters:

### Copyright and Attribution

- **README.md**: Added copyright line for iobroker-community-adapters in the License section
- **LICENSE**: Added copyright line for iobroker-community-adapters as the first line
- **package.json**: Added iobroker-community-adapters to the contributors array
- **io-package.json**: Added iobroker-community-adapters to the common.authors array

### Dependency Requirements

The PR ensures that the adapter specifies minimum version requirements for js-controller and admin:

- **js-controller dependency**: Sets or updates the minimum required js-controller version in `io-package.json` under `common.dependencies`
- **admin dependency**: Sets or updates the minimum required admin version in `io-package.json` under `common.globalDependencies`

If any dependency requirements are added or updated, corresponding entries are added to the changelog in README.md under a "WORK IN PROGRESS" section, informing users about the new minimum requirements.

### Why These Changes

These changes ensure:
- Proper attribution for the iobroker-community-adapters organization that maintains this adapter
- Clear minimum version requirements for core dependencies
- Better compatibility and stability by requiring tested versions of js-controller and admin

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

## Zweck

**Dieser PR ist nur für Repositories in iobroker-community-adapters vorgesehen.**

Dieser PR bereitet das Repository für die Pflege durch die iobroker-community-adapters Organisation vor. Er stellt die korrekte Zuordnung sicher, aktualisiert Copyright-Informationen und legt Mindestanforderungen für js-controller und admin fest.

## Durch diesen PR bereitgestellte Änderungen

Dieser PR nimmt folgende Änderungen vor, um das Repository für iobroker-community-adapters vorzubereiten:

### Copyright und Zuordnung

- **README.md**: Copyright-Zeile für iobroker-community-adapters im Lizenz-Abschnitt hinzugefügt
- **LICENSE**: Copyright-Zeile für iobroker-community-adapters als erste Zeile hinzugefügt
- **package.json**: iobroker-community-adapters zum contributors-Array hinzugefügt
- **io-package.json**: iobroker-community-adapters zum common.authors-Array hinzugefügt

### Abhängigkeitsanforderungen

Der PR stellt sicher, dass der Adapter Mindestversionsanforderungen für js-controller und admin spezifiziert:

- **js-controller Abhängigkeit**: Setzt oder aktualisiert die erforderliche Mindestversion von js-controller in der `io-package.json` unter `common.dependencies`
- **admin Abhängigkeit**: Setzt oder aktualisiert die erforderliche Mindestversion von admin in der `io-package.json` unter `common.globalDependencies`

Falls Abhängigkeitsanforderungen hinzugefügt oder aktualisiert werden, werden entsprechende Einträge zum Changelog in der README.md unter einem "WORK IN PROGRESS" Abschnitt hinzugefügt, um Benutzer über die neuen Mindestanforderungen zu informieren.

### Warum diese Änderungen

Diese Änderungen stellen sicher:
- Korrekte Zuordnung für die iobroker-community-adapters Organisation, die diesen Adapter pflegt
- Klare Mindestversionsanforderungen für Kern-Abhängigkeiten
- Bessere Kompatibilität und Stabilität durch Anforderung getesteter Versionen von js-controller und admin

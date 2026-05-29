Add missing workflow dependencies to test-and-release

[German description can be found below](#deutsche-beschreibung)  
[Deutsche Beschreibung befindet sich weiter unten](#deutsche-beschreibung)

## General information

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if the review is successful.

Feel free to contact me (@ioBroker-Bot) if there are any questions or if the PR appears to be faulty. Please open an issue in the repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter for all users.
*Let's work together for the best user experience.*

*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR adds missing `needs` clauses to `.github/workflows/test-and-release.yml` to avoid running tests that would fail anyway because required prerequisite jobs have not completed yet.

The following list is generated when the PR is created and only contains workflow changes that were actually applied:

__APPLIED_CHANGES_EN__

---

## Deutsche Beschreibung

## Fehlende Workflow-Abhängigkeiten zu test-and-release ergänzen

## Allgemeine Informationen

Dieser PR wurde durch iobroker-bot erstellt. Bitte die Änderungen sorgfältig prüfen und den PR nach erfolgreicher Prüfung zusammenführen.

Bei Fragen oder wenn der PR fehlerhaft erscheint, kann gerne Kontakt mit mir (@ioBroker-Bot) aufgenommen werden. Bitte ein Issue im Repository https://github.com/ioBroker/ioBroker.repochecker öffnen, um einen fehlerhaften PR zu melden.

Und **VIELEN DANK** für die Wartung dieses Adapters für alle Nutzenden.
*Gemeinsam für das beste Nutzererlebnis arbeiten.*

*ioBroker Check and Service Bot*

@mcm1957 zum Nachweis

## Durch diesen PR bereitgestellte Änderungen

Dieser PR ergänzt fehlende `needs`-Angaben in `.github/workflows/test-and-release.yml`, damit keine Tests gestartet werden, die ohne abgeschlossene Vorbedingungen ohnehin fehlschlagen würden.

Die folgende Liste wird bei der Erstellung des PR generiert und enthält nur Workflow-Änderungen, die tatsächlich angewendet wurden:

__APPLIED_CHANGES_DE__

Fix Copyright Year

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

## Changes provided by this PR

**This PR fixes repository checker errors E6005 and E7001.**

This PR updates the copyright year in the following files:

- **README.md**: Updates copyright year in the License section
- **LICENSE**: Updates copyright year throughout the file

The script automatically:
- Detects existing copyright statements with format `Copyright (c) YYYY` or `Copyright (c) YYYY - YYYY`
- Updates single years to year ranges (e.g., `2024` becomes `2024 - 2025`)
- Updates existing year ranges to end at 2025 (e.g., `2020 - 2024` becomes `2020 - 2025`)
- Normalizes copyright year format to use spaces around hyphens (e.g., `2024-2025` becomes `2024 - 2025`)
- Corrects future copyright years (years beyond 2026) back to 2025 to maintain accuracy
- Makes changes when the year needs updating or when the format needs normalization
- Ensures year boundaries are properly matched using word boundaries

---

## Deutsche Beschreibung

## Allgemeine Informationen

Dieses PR wurde von iobroker-bot erstellt. Bitte die Änderungen sorgfältig prüfen und das PR bei erfolgreicher Prüfung zusammenführen.

Bei Fragen oder falls ein PR fehlerhaft erscheint, bitte mich (@ioBroker-Bot) kontaktieren. Zum Melden eines fehlerhaften PR bitte ein Issue im Repository https://github.com/ioBroker/ioBroker.repochecker öffnen.

**VIELEN DANK** für die Wartung dieses Adapters von mir und allen Benutzern.
*Gemeinsam für die beste Benutzererfahrung arbeiten.*

*euer*
*ioBroker Check and Service Bot*

@mcm1957 zur Kenntnisnahme

## Durch dieses PR bereitgestellte Änderungen

**Dieses PR behebt die Repository-Checker-Fehler E6005 und E7001.**

Dieses PR aktualisiert das Copyright-Jahr in den folgenden Dateien:

- **README.md**: Aktualisiert das Copyright-Jahr im License-Abschnitt
- **LICENSE**: Aktualisiert das Copyright-Jahr in der gesamten Datei

Das Skript führt automatisch folgende Aktionen aus:
- Erkennt vorhandene Copyright-Angaben mit dem Format `Copyright (c) JJJJ` oder `Copyright (c) JJJJ - JJJJ`
- Aktualisiert einzelne Jahre zu Jahresbereichen (z.B. wird `2024` zu `2024 - 2025`)
- Aktualisiert vorhandene Jahresbereiche, sodass sie mit 2025 enden (z.B. wird `2020 - 2024` zu `2020 - 2025`)
- Normalisiert das Copyright-Jahr-Format mit Leerzeichen um Bindestriche (z.B. wird `2024-2025` zu `2024 - 2025`)
- Korrigiert zukünftige Copyright-Jahre (Jahre nach 2026) zurück auf 2025, um Genauigkeit zu gewährleisten
- Führt Änderungen aus, wenn das Jahr aktualisiert werden muss oder wenn eine Formatnormalisierung erforderlich ist
- Stellt durch Verwendung von Wortgrenzen sicher, dass Jahresgrenzen korrekt erkannt werden

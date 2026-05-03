Remove common.allowInit from io-package.json

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

This PR fixes the warning **[W1104] allowInit is only used with scheduled adapters and should be removed** reported by the ioBroker repository checker.

### Background

The `common.allowInit` attribute in `io-package.json` is only relevant for scheduled adapters (where `common.mode` is set to `schedule`). When set to `true`, it allows an adapter to be initialized before the scheduled time is triggered. For adapters that are not of type `schedule`, this attribute is ignored by the ioBroker system.

Since this adapter is not a scheduled adapter, the `common.allowInit` attribute serves no purpose and should be removed to keep the configuration clean.

More information about io-package.json attributes can be found in the [ioBroker documentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Changes

This PR removes the `common.allowInit` attribute from `io-package.json`.

The `common.allowInit` attribute has been removed because:
- This adapter is not of type `schedule`
- The `allowInit` attribute is ignored for non-scheduled adapters anyway

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

## Durch diesen PR bereitgestellte Änderungen

Dieser PR behebt die Warnung **[W1104] allowInit is only used with scheduled adapters and should be removed**, die vom ioBroker Repository Checker gemeldet wurde.

### Hintergrund

Das Attribut `common.allowInit` in der `io-package.json` ist nur für geplante Adapter (Scheduled-Adapter) relevant, bei denen `common.mode` auf `schedule` gesetzt ist. Wenn dieses Attribut auf `true` gesetzt ist, ermöglicht es die Initialisierung eines Adapters, bevor der geplante Zeitplan ausgelöst wird. Für Adapter, die nicht vom Typ `schedule` sind, wird dieses Attribut vom ioBroker-System ignoriert.

Da dieser Adapter kein geplanter Adapter ist, hat das Attribut `common.allowInit` keine Wirkung und sollte entfernt werden, um die Konfiguration übersichtlich zu halten.

Weitere Informationen zu io-package.json-Attributen finden sich in der [ioBroker-Dokumentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Änderungen

Dieser PR entfernt das Attribut `common.allowInit` aus der `io-package.json`.

Das Attribut `common.allowInit` wurde entfernt, weil:
- Dieser Adapter nicht vom Typ `schedule` ist
- Das Attribut `allowInit` für nicht geplante Adapter ignoriert wird

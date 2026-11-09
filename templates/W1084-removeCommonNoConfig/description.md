Remove deprecated common.noConfig attribute from io-package.json

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

This PR fixes the warning **[W1084] "common.noConfig" is deprecated in io-package.json. For admin version >= 5 please use common.adminUI.config** reported by the ioBroker repository checker.

### Background

The `common.noConfig` attribute in `io-package.json` was used to indicate that an adapter does not provide a configuration UI. However, this attribute is deprecated since admin version 5 and should be replaced by the `common.adminUI.config` attribute.

More information about io-package.json attributes can be found in the [ioBroker documentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Changes

Depending on the value of `common.noConfig` in `io-package.json`, this PR performs one of the following changes:

- **common.noConfig was set to `false`**: The deprecated `common.noConfig` attribute has been removed. No further changes are required because `false` means a configuration UI is provided, which is already the default behaviour.

- **common.noConfig was set to `true`**: The deprecated `common.noConfig` attribute has been removed and `common.adminUI.config` has been set to `"none"` to maintain the original behaviour of providing no configuration UI.

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

Dieser PR behebt die Warnung **[W1084] "common.noConfig" is deprecated in io-package.json. For admin version >= 5 please use common.adminUI.config**, die vom ioBroker Repository Checker gemeldet wurde.

### Hintergrund

Das Attribut `common.noConfig` in der `io-package.json` wurde verwendet, um anzuzeigen, dass ein Adapter keine Konfigurations-Oberfläche bereitstellt. Dieses Attribut ist jedoch seit Admin-Version 5 veraltet und sollte durch das Attribut `common.adminUI.config` ersetzt werden.

Weitere Informationen zu io-package.json-Attributen finden sich in der [ioBroker-Dokumentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Änderungen

Je nach Wert von `common.noConfig` in der `io-package.json` führt dieser PR eine der folgenden Änderungen durch:

- **common.noConfig war auf `false` gesetzt**: Das veraltete Attribut `common.noConfig` wurde entfernt. Weitere Änderungen sind nicht erforderlich, da `false` bedeutet, dass eine Konfigurations-Oberfläche bereitgestellt wird, was dem Standardverhalten entspricht.

- **common.noConfig war auf `true` gesetzt**: Das veraltete Attribut `common.noConfig` wurde entfernt und `common.adminUI.config` wurde auf `"none"` gesetzt, um das ursprüngliche Verhalten – keine Konfigurations-Oberfläche – beizubehalten.

Remove deprecated common.materialize from io-package.json

[German description can be found below](#deutsche-beschreibung)
[Deutsche Beschreibung befindet sich weiter unten](#deutsche-beschreibung)

## General information

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if the review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or feel that a PR is faulty. Please open an issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR fixes the issue **[W1078] "common.materialize" is deprecated for admin >= 5 in io-package.json. Please use property "common.adminUI.config"** reported by the repository checker.

The `common.materialize` attribute in `io-package.json` has been deprecated since `js-controller` 5 and has been replaced by the `common.adminUI` configuration.

The `common.materialize` attribute has been removed.

__ADMINUI_CONFIG_CHANGE_EN__

__DEPENDENCY_CHANGE_EN__

Please plan the next release as at least a minor version update if the dependency requirement has been changed.

## Deutsche Beschreibung

### Allgemeine Informationen

Dieser PR wurde von iobroker-bot erstellt. Bitte die Änderungen sorgfältig prüfen und den PR bei erfolgreicher Prüfung mergen.

Bei Fragen oder falls ein PR fehlerhaft erscheint, gerne Kontakt mit mir (@ioBroker-Bot) aufnehmen. Bitte ein Issue im Repository https://github.com/ioBroker/ioBroker.repochecker öffnen, um einen fehlerhaften PR zu melden.

Und **VIELEN DANK** für die Wartung dieses Adapters von mir und allen Nutzenden.
*Gemeinsam für das beste Nutzererlebnis arbeiten.*

*Euer*
*ioBroker Check and Service Bot*

@mcm1957 zum Nachweis

### Durch diesen PR bereitgestellte Änderungen

Dieser PR behebt das vom Repository Checker gemeldete Problem **[W1078] "common.materialize" is deprecated for admin >= 5 in io-package.json. Please use property "common.adminUI.config"**.

Das Attribut `common.materialize` in der `io-package.json` ist seit `js-controller` 5 veraltet und wurde durch die Konfiguration `common.adminUI` ersetzt.

Das Attribut `common.materialize` wurde entfernt.

__ADMINUI_CONFIG_CHANGE_DE__

__DEPENDENCY_CHANGE_DE__

Bitte den nächsten Release mindestens als Minor-Update planen, falls sich die Abhängigkeitsanforderung geändert hat.

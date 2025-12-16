Remove deprecated fa-icon from adminTab in io-package.json

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

This PR fixes the warning **[W1084] "fa-icon" in adminTab is deprecated for Admin 5. Please remove from io-package.json.** reported by the ioBroker repository checker.

### Background

The `fa-icon` attribute in the `adminTab` section of `io-package.json` was used to specify Font Awesome icons for the admin interface. However, with the introduction of Admin 5, this attribute is deprecated and no longer supported.

Admin 5 uses a different icon system and the `fa-icon` property is ignored. Keeping this deprecated attribute in the configuration can cause confusion and generates warnings from the repository checker.

For more detailed information about this change, please see:
https://github.com/ioBroker/create-adapter/blob/v3.1.1/docs/updates/20250102_remove_admin_tab_fa_icon.md#remove-fa-icon-from-admin-tabs-for-admin-5-compatibility

More information about io-package.json attributes can be found in the [ioBroker documentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Changes

This PR removes the deprecated `fa-icon` attribute from the `adminTab` section in `io-package.json`. This change ensures:
- The repository checker warning W1084 is resolved
- The configuration follows current ioBroker standards for Admin 5
- No functional changes to the adapter (the icon system in Admin 5 works differently)

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

Dieser PR behebt die Warnung **[W1084] "fa-icon" in adminTab is deprecated for Admin 5. Please remove from io-package.json.**, die vom ioBroker Repository Checker gemeldet wurde.

### Hintergrund

Das Attribut `fa-icon` im Abschnitt `adminTab` der `io-package.json` wurde verwendet, um Font Awesome-Icons für die Admin-Oberfläche anzugeben. Mit der Einführung von Admin 5 ist dieses Attribut jedoch veraltet und wird nicht mehr unterstützt.

Admin 5 verwendet ein anderes Icon-System und die Eigenschaft `fa-icon` wird ignoriert. Das Beibehalten dieses veralteten Attributs in der Konfiguration kann zu Verwirrung führen und erzeugt Warnungen vom Repository Checker.

Weitere detaillierte Informationen zu dieser Änderung finden Sie unter:
https://github.com/ioBroker/create-adapter/blob/v3.1.1/docs/updates/20250102_remove_admin_tab_fa_icon.md#remove-fa-icon-from-admin-tabs-for-admin-5-compatibility

Weitere Informationen zu io-package.json-Attributen finden sich in der [ioBroker-Dokumentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md).

### Änderungen

Dieser PR entfernt das veraltete Attribut `fa-icon` aus dem Abschnitt `adminTab` in der `io-package.json`. Diese Änderung stellt sicher:
- Die Repository Checker Warnung W1084 wird behoben
- Die Konfiguration folgt den aktuellen ioBroker-Standards für Admin 5
- Keine funktionalen Änderungen am Adapter (das Icon-System in Admin 5 funktioniert anders)

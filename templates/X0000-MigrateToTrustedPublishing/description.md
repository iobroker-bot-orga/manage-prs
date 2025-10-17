# Migrate to NPM Trusted Publishing

[German description can be found below](#deutsche-beschreibung)  
[Deutsche Beschreibung befindet sich weiter unten](#deutsche-beschreibung)

## General information 

This PR has been created by iobroker-bot. Please review the changes carefully and merge the PR if review is ok.

Feel free to contact me (@ioBroker-Bot) if you have any questions or feel that a PR is faulty. Please open a issue at repository https://github.com/ioBroker/ioBroker.repochecker to report a faulty PR.

And **THANKS A LOT** for maintaining this adapter from me and all users.
*Let's work together for the best user experience.*

*your*
*ioBroker Check and Service Bot*

@mcm1957 for evidence

## Changes provided by this PR

This PR migrates the adapter to use NPM's Trusted Publishing feature, which provides a more secure way to publish packages without using long-lived NPM tokens.

### Changes made:

1. **Commented out `npm-token` parameter**: The `npm-token` parameter in the `ioBroker/testing-action-deploy@v1` action has been commented out, as it's no longer needed with Trusted Publishing.

2. **Added required permissions**: The workflow has been updated to include the necessary permissions for Trusted Publishing:
   - `id-token: write` - Required for OIDC token generation
   - `contents: write` - Required for the deployment action

### Benefits:

- **Enhanced Security**: No need to store long-lived NPM tokens as secrets
- **Reduced Maintenance**: No need to rotate tokens periodically
- **Better Audit Trail**: NPM can verify that packages were published from the correct GitHub repository and workflow

## Important information

### Setting up Trusted Publishing at npmjs.com

To complete the migration to Trusted Publishing, you need to configure it in your NPM account. Follow these steps:

1. **Log in to npmjs.com** with an account that has publish rights for your package

2. **Navigate to your package page**:
   - Go to https://www.npmjs.com/package/YOUR-PACKAGE-NAME
   - Click on the "Settings" tab

3. **Configure Trusted Publishing**:
   - Scroll down to the "Publishing access" section
   - Click on "Automate publishing with GitHub Actions" or "Add trusted publisher"
   - Fill in the required information:
     - **Repository owner**: Your GitHub username or organization (**`%OWNER%`**)
     - **Repository name**: Your adapter repository name (**`%REPONAME%`**)
     - **Workflow name**: `test-and-release.yml` (or the name of your release workflow)
     - **Environment**: Leave blank unless you use GitHub Environments in your workflow

     **IMPORTANT INFORMATION**
     - **all input is case-sensitive, take care of correct case**
     - **when using copy and paste double check that no spaces or non printable characters are inserted**
     
4. **Save the configuration**

5. **Merge this PR** and test the release process

6. **Remove the NPM_TOKEN secret** from your GitHub repository settings (optional, after confirming everything works)

For more information, see:
- [NPM Trusted Publishing documentation](https://docs.npmjs.com/trusted-publishers)
- [GitHub Actions OIDC documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

---

## Deutsche Beschreibung

## Migration zu NPM Trusted Publishing

## Allgemeine Informationen

Dieser PR wurde durch iobroker-bot erstellt. Bitte die Änderungen sorgfältig überprüfen und den PR nach erfolgreicher Prüfung zusammenführen.

Bei Fragen oder wenn ein PR fehlerhaft erscheint, kann gerne Kontakt mit mir (@ioBroker-Bot) aufgenommen werden. Bitte ein Issue im Repository https://github.com/ioBroker/ioBroker.repochecker öffnen, um einen fehlerhaften PR zu melden.

Und **VIELEN DANK** für die Wartung dieses Adapters von mir und allen Nutzern.
*Gemeinsam für das beste Nutzererlebnis arbeiten.*

*Euer*
*ioBroker Check and Service Bot*

@mcm1957 zum Nachweis

## Durch diesen PR bereitgestellte Änderungen

Dieser PR migriert den Adapter zur Nutzung der NPM Trusted Publishing Funktion, die eine sicherere Methode zur Veröffentlichung von Paketen ohne langlebige NPM-Token bietet.

### Durchgeführte Änderungen:

1. **Parameter `npm-token` auskommentiert**: Der `npm-token` Parameter in der `ioBroker/testing-action-deploy@v1` Action wurde auskommentiert, da er mit Trusted Publishing nicht mehr benötigt wird.

2. **Erforderliche Berechtigungen hinzugefügt**: Der Workflow wurde mit den notwendigen Berechtigungen für Trusted Publishing aktualisiert:
   - `id-token: write` - Erforderlich für die OIDC-Token-Generierung
   - `contents: write` - Erforderlich für die Deployment-Action

### Vorteile:

- **Erhöhte Sicherheit**: Keine Notwendigkeit, langlebige NPM-Token als Secrets zu speichern
- **Reduzierter Wartungsaufwand**: Keine periodische Token-Rotation erforderlich
- **Bessere Nachvollziehbarkeit**: NPM kann verifizieren, dass Pakete aus dem korrekten GitHub-Repository und Workflow veröffentlicht wurden

## Wichtige Informationen

### Einrichtung von Trusted Publishing bei npmjs.com

Um die Migration zu Trusted Publishing abzuschließen, muss die Funktion im NPM-Konto konfiguriert werden. Folgende Schritte durchführen:

1. **Bei npmjs.com anmelden** mit einem Konto, das Veröffentlichungsrechte für das Paket hat

2. **Zur Paketseite navigieren**:
   - Zu https://www.npmjs.com/package/IHR-PAKET-NAME gehen
   - Auf den "Settings"-Tab klicken

3. **Trusted Publishing konfigurieren**:
   - Zum Abschnitt "Publishing access" scrollen
   - Auf "Automate publishing with GitHub Actions" oder "Add trusted publisher" klicken
   - Die erforderlichen Informationen ausfüllen:
     - **Repository owner**: GitHub-Benutzername oder Organisation (**`%OWNER%`**)
     - **Repository name**: Name des Adapter-Repositories (**`%REPONAME%`**)
     - **Workflow name**: `test-and-release.yml` (oder der Name des Release-Workflows)
     - **Environment**: Leer lassen, außer GitHub Environments werden im Workflow verwendet

     **WICHTIGE INFORMATION**
     - **Alle Eingaben sind case-sensitive, auf korrekte Groß-/Kleinschreibung achten**
     - **Beim Kopieren und Einfügen überprüfen, dass keine Leerzeichen oder nicht druckbaren Zeichen eingefügt werden**
     
4. **Die Konfiguration speichern**

5. **Diesen PR zusammenführen** und den Release-Prozess testen

6. **Das NPM_TOKEN Secret entfernen** aus den GitHub-Repository-Einstellungen (optional, nach Bestätigung der Funktionsfähigkeit)

Für weitere Informationen siehe:
- [NPM Trusted Publishing Dokumentation](https://docs.npmjs.com/trusted-publishers)
- [GitHub Actions OIDC Dokumentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

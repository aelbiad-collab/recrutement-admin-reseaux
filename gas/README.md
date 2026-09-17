# Backend Google Apps Script — Recrutement Administrateur Système

Ce dossier contient le code du backend qui reçoit les candidatures envoyées
par `index.html`, enregistre le CV dans Google Drive, ajoute une ligne dans
Google Sheets, et vous envoie un email de notification.

Il est volontairement **séparé** de l'ancien script "CVThèque" (destiné à
l'intake de profils freelance) pour ne rien casser de ce qui existait déjà.
Il réutilise le même dossier Drive `CVTheque`, dans un sous-dossier `CV_AdminSys`,
et une nouvelle feuille `CVTheque_AdminSys`.

Le glossaire technique (`glossaire.html`) a son propre backend, séparé,
dans le dossier `gas-glossaire/` (projet Apps Script "Glossary-MBA").

## Déploiement (à faire une seule fois)

1. Aller sur https://script.google.com → **Nouveau projet**.
2. Renommer le projet, par exemple `Recrutement_AdminSys`.
3. Remplacer le contenu de `Code.gs` par celui du fichier `Code.gs` de ce dossier.
4. Dans les paramètres du projet (icône ⚙️ à gauche), ouvrir `appsscript.json`
   (activer "Afficher le fichier manifeste appsscript.json" dans les
   paramètres du projet si besoin) et remplacer son contenu par celui du
   fichier `appsscript.json` de ce dossier.
5. Cliquer sur **Déployer → Nouveau déploiement**.
   - Type : **Application Web**.
   - Exécuter en tant que : **Moi (aelbiad@gmail.com)**.
   - Qui a accès : **Tout le monde**.
6. Cliquer sur **Déployer**, autoriser les permissions demandées (Drive,
   Sheets, Gmail) — c'est votre propre script, sous votre propre compte.
7. Copier l'URL `.../exec` fournie.
8. Dans `index.html`, remplacer la constante `WEBAPP_URL` par cette URL.

## Test rapide

Dans l'éditeur Apps Script, sélectionner la fonction `testerScript` dans le
menu déroulant en haut, puis cliquer sur **Exécuter**. Cela simule une
candidature de test : vous devez recevoir un email et voir une ligne
apparaître dans `CVTheque_AdminSys` (dossier Drive `CVTheque`).

## Mise à jour ultérieure

Si vous modifiez `Code.gs`, il faut recoller le contenu dans l'éditeur
Apps Script puis faire **Déployer → Gérer les déploiements → ✏️ (modifier) →
Nouvelle version → Déployer**. L'URL `.../exec` reste la même.

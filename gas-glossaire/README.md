# Backend Google Apps Script — Glossaire technique (projet "Glossary-MBA")

Ce dossier contient le code du backend dédié au glossaire technique
(`glossaire.html`), volontairement **séparé** du script de recrutement
(`gas/`, projet `Recrutement_AdminSys`) pour ne rien casser de ce qui
existait déjà. Il reçoit les demandes d'ajout de terme, interroge l'API
Anthropic (Claude) pour générer la définition (famille, explication,
exemple concret, schéma), et la stocke dans une feuille Google Sheets.

## Déploiement (à faire une seule fois)

1. Ouvrir le projet Apps Script **Glossary-MBA** (déjà créé sur
   https://script.google.com).
2. Remplacer le contenu de `Code.gs` par celui du fichier `Code.gs` de ce
   dossier.
3. Dans les paramètres du projet (icône ⚙️ à gauche), ouvrir `appsscript.json`
   (activer "Afficher le fichier manifeste appsscript.json" dans les
   paramètres du projet si besoin) et remplacer son contenu par celui du
   fichier `appsscript.json` de ce dossier.
4. Cliquer sur **Déployer → Nouveau déploiement**.
   - Type : **Application Web**.
   - Exécuter en tant que : **Moi (aelbiad@gmail.com)**.
   - Qui a accès : **Tout le monde**.
5. Cliquer sur **Déployer**, autoriser les permissions demandées (Drive,
   Sheets, connexion à un service externe) — c'est votre propre script.
6. Copier l'URL `.../exec` fournie.
7. Dans `glossaire.html`, remplacer la constante `WEBAPP_URL` par cette URL.

## Configurer la clé API Anthropic (obligatoire)

Le bouton "Ajouter au glossaire" appelle l'API Anthropic (Claude) pour
générer automatiquement la définition d'un terme absent. Il faut donc :

1. Récupérer une clé API sur https://console.anthropic.com (section API Keys).
2. Dans l'éditeur Apps Script, ouvrir **Paramètres du projet** (icône ⚙️ à
   gauche) → section **Propriétés du script** → **Ajouter une propriété du
   script**.
3. Nom de la propriété : `ANTHROPIC_API_KEY` — Valeur : votre clé API.
4. Enregistrer. La clé n'est jamais exposée côté client : elle reste sur le
   serveur Apps Script.

Sans cette propriété, la recherche automatique échoue avec un message
d'erreur explicite côté application (le reste du glossaire reste utilisable
en mode local/hors-ligne).

## Test rapide

Dans l'éditeur Apps Script, sélectionner la fonction `testerGlossaire` dans
le menu déroulant en haut, puis cliquer sur **Exécuter**. Cela ajoute le
terme "DHCP" et affiche le résultat dans les logs (**Affichage → Journaux
d'exécution**). Un dossier Drive `Glossary-MBA` contenant une feuille
`Glossaire_AdminSys` doit apparaître.

## Mise à jour ultérieure

Si vous modifiez `Code.gs`, il faut recoller le contenu dans l'éditeur
Apps Script puis faire **Déployer → Gérer les déploiements → ✏️ (modifier) →
Nouvelle version → Déployer**. L'URL `.../exec` reste la même.

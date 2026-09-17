# Backend Google Apps Script — Recrutement Administrateur Système

Ce dossier contient le code du backend qui reçoit les candidatures envoyées
par `index.html`, enregistre le CV dans Google Drive, ajoute une ligne dans
Google Sheets, et vous envoie un email de notification.

Il est volontairement **séparé** de l'ancien script "CVThèque" (destiné à
l'intake de profils freelance) pour ne rien casser de ce qui existait déjà.
Il réutilise le même dossier Drive `CVTheque`, dans un sous-dossier `CV_AdminSys`,
et une nouvelle feuille `CVTheque_AdminSys`.

Il sert aussi de backend au **glossaire technique** (`glossaire.html`) : quand
un terme n'existe pas encore, l'application appelle ce script qui interroge
l'API Anthropic (Claude) pour générer la définition, puis l'enregistre dans
une feuille `Glossaire_AdminSys`, dans son propre dossier Drive dédié
`Glossaire MDB` (distinct de `CVTheque`).

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
8. Dans `index.html` **et** `glossaire.html`, remplacer la constante
   `WEBAPP_URL` par cette URL (elle est déjà pré-remplie si vous réutilisez
   un déploiement existant).

## Configurer la clé API Anthropic (nécessaire pour le glossaire)

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
d'erreur explicite côté application (le reste du glossaire reste utilisable).

## Test rapide

Dans l'éditeur Apps Script, sélectionner la fonction `testerScript` dans le
menu déroulant en haut, puis cliquer sur **Exécuter**. Cela simule une
candidature de test : vous devez recevoir un email et voir une ligne
apparaître dans `CVTheque_AdminSys` (dossier Drive `CVTheque`).

Pour tester le glossaire, sélectionner `testerGlossaire` puis **Exécuter** :
cela ajoute le terme "DHCP" et affiche le résultat dans les logs
(**Affichage → Journaux d'exécution**). Un dossier Drive `Glossaire MDB`
contenant une feuille `Glossaire_AdminSys` doit apparaître.

## Mise à jour ultérieure

Si vous modifiez `Code.gs`, il faut recoller le contenu dans l'éditeur
Apps Script puis faire **Déployer → Gérer les déploiements → ✏️ (modifier) →
Nouvelle version → Déployer**. L'URL `.../exec` reste la même.

Comme le script appelle désormais un service externe (API Anthropic) via
`UrlFetchApp`, la prochaine autorisation vous demandera une permission
supplémentaire ("se connecter à un service externe") — c'est normal, il
s'agit toujours de votre propre script.

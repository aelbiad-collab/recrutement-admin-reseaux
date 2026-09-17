// ════════════════════════════════════════════════════════════
//  Glossaire technique — Réseaux, Systèmes & Cybersécurité
//  Backend Google Apps Script du projet "Glossary-MBA"
//  Reçoit les demandes d'ajout de terme, interroge l'API
//  Anthropic (Claude) pour générer la définition, et la
//  persiste dans Google Sheets.
// ════════════════════════════════════════════════════════════

const CONFIG = {
  NOM_DOSSIER_DRIVE:   'Glossary-MBA',
  NOM_SHEET_GLOSSAIRE: 'Glossaire_AdminSys',
  MODELE_IA:           'claude-haiku-4-5-20251001',
};

const HEADERS_GLOSSAIRE = [
  'Date', 'Terme', 'Famille', 'Explication', 'Exemple concret', 'Schéma (étapes)'
];

const FAMILLES_GLOSSAIRE = [
  'Réseau', 'Sécurité', 'Virtualisation', 'Cloud',
  'Systèmes / OS', 'Sauvegarde & Supervision', 'Téléphonie / Collaboration', 'Autre'
];

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    if (params.action !== 'ajouterTerme') {
      throw new Error('Action non supportée.');
    }
    return ajouterTermeGlossaire(params);
  } catch (err) {
    console.error('Erreur:', err);
    return sortieJson({ status: 'error', message: err.message });
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'glossaire') {
    try {
      return sortieJson({ status: 'ok', termes: listerTermesGlossaire() });
    } catch (err) {
      console.error('Erreur glossaire:', err);
      return sortieJson({ status: 'error', message: err.message });
    }
  }
  return ContentService
    .createTextOutput('API Glossaire technique — GET ?action=glossaire ou POST {action:"ajouterTerme"}')
    .setMimeType(ContentService.MimeType.TEXT);
}

function sortieJson(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ajouterTermeGlossaire(params) {
  try {
    const terme = (params.terme || '').trim();
    if (!terme) throw new Error('Terme manquant.');

    const sheet = obtenirOuCreerSheetGlossaire();
    const existant = trouverTermeDansSheet(sheet, terme);
    if (existant) {
      return sortieJson({ status: 'ok', terme: existant });
    }

    const definition = chercherDefinitionIA(terme);
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
    sheet.appendRow([
      now,
      terme,
      definition.famille,
      definition.explication,
      definition.exempleConcret,
      JSON.stringify(definition.schemaEtapes)
    ]);

    return sortieJson({
      status: 'ok',
      terme: {
        terme: terme,
        famille: definition.famille,
        explication: definition.explication,
        exempleConcret: definition.exempleConcret,
        schemaEtapes: definition.schemaEtapes
      }
    });
  } catch (err) {
    console.error('Erreur ajout glossaire:', err);
    return sortieJson({ status: 'error', message: err.message });
  }
}

function chercherDefinitionIA(terme) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error("Clé API Anthropic non configurée côté serveur (Script Properties : ANTHROPIC_API_KEY).");
  }

  const payload = {
    model: CONFIG.MODELE_IA,
    max_tokens: 1024,
    tools: [{
      name: 'definir_terme',
      description: "Retourne la définition structurée d'un terme technique du domaine administration réseaux/systèmes/cybersécurité.",
      input_schema: {
        type: 'object',
        properties: {
          famille: { type: 'string', enum: FAMILLES_GLOSSAIRE },
          explication: {
            type: 'string',
            description: 'Explication claire en français, 2 à 4 phrases, niveau administrateur réseaux et systèmes.'
          },
          exempleConcret: {
            type: 'string',
            description: "Exemple concret d'utilisation en entreprise, 1 à 3 phrases."
          },
          schemaEtapes: {
            type: 'array',
            items: { type: 'string' },
            minItems: 3,
            maxItems: 6,
            description: "3 à 6 étapes ou éléments courts (2 à 4 mots chacun) représentant un schéma de fonctionnement séquentiel du concept."
          }
        },
        required: ['famille', 'explication', 'exempleConcret', 'schemaEtapes']
      }
    }],
    tool_choice: { type: 'tool', name: 'definir_terme' },
    messages: [{
      role: 'user',
      content: `Terme technique du domaine de l'administration réseaux et systèmes : "${terme}". Donne sa définition structurée pour un glossaire à destination d'administrateurs systèmes/réseaux.`
    }]
  };

  const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const bodyText = response.getContentText();
  const body = JSON.parse(bodyText);

  if (code !== 200) {
    const msg = body && body.error && body.error.message ? body.error.message : bodyText;
    throw new Error('Erreur API Anthropic (' + code + ') : ' + msg);
  }

  const toolUse = (body.content || []).find(function (bloc) { return bloc.type === 'tool_use'; });
  if (!toolUse) throw new Error("Réponse IA invalide : bloc tool_use manquant.");

  const data = toolUse.input;
  if (FAMILLES_GLOSSAIRE.indexOf(data.famille) === -1) data.famille = 'Autre';
  return data;
}

function obtenirOuCreerSheetGlossaire() {
  const dossier = obtenirOuCreerDossier(CONFIG.NOM_DOSSIER_DRIVE);
  const fichiers = dossier.getFilesByName(CONFIG.NOM_SHEET_GLOSSAIRE);
  let spreadsheet;
  if (fichiers.hasNext()) {
    spreadsheet = SpreadsheetApp.openById(fichiers.next().getId());
  } else {
    spreadsheet = SpreadsheetApp.create(CONFIG.NOM_SHEET_GLOSSAIRE);
    const fichier = DriveApp.getFileById(spreadsheet.getId());
    dossier.addFile(fichier);
    DriveApp.getRootFolder().removeFile(fichier);
  }
  const sheet = spreadsheet.getActiveSheet();
  assurerEnTeteGlossaireAJour(sheet);
  return sheet;
}

function obtenirOuCreerDossier(nom) {
  const r = DriveApp.getFoldersByName(nom);
  return r.hasNext() ? r.next() : DriveApp.createFolder(nom);
}

function assurerEnTeteGlossaireAJour(sheet) {
  const largeur = Math.max(sheet.getLastColumn(), HEADERS_GLOSSAIRE.length);
  const premiereLigne = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, largeur).getValues()[0]
    : [];
  const estAJour = HEADERS_GLOSSAIRE.every((h, i) => premiereLigne[i] === h);
  if (!estAJour) {
    sheet.clear();
    sheet.appendRow(HEADERS_GLOSSAIRE);
    sheet.getRange(1, 1, 1, HEADERS_GLOSSAIRE.length)
      .setBackground('#f97316')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function trouverTermeDansSheet(sheet, terme) {
  const derniereLigne = sheet.getLastRow();
  if (derniereLigne < 2) return null;
  const valeurs = sheet.getRange(2, 1, derniereLigne - 1, HEADERS_GLOSSAIRE.length).getValues();
  const cible = normaliser(terme);
  for (let i = 0; i < valeurs.length; i++) {
    if (normaliser(valeurs[i][1]) === cible) {
      return ligneVersTerme(valeurs[i]);
    }
  }
  return null;
}

function listerTermesGlossaire() {
  const sheet = obtenirOuCreerSheetGlossaire();
  const derniereLigne = sheet.getLastRow();
  if (derniereLigne < 2) return [];
  const valeurs = sheet.getRange(2, 1, derniereLigne - 1, HEADERS_GLOSSAIRE.length).getValues();
  return valeurs.map(ligneVersTerme);
}

function ligneVersTerme(ligne) {
  let schemaEtapes = [];
  try { schemaEtapes = JSON.parse(ligne[5]); } catch (e) { schemaEtapes = []; }
  return {
    terme: ligne[1],
    famille: ligne[2],
    explication: ligne[3],
    exempleConcret: ligne[4],
    schemaEtapes: schemaEtapes
  };
}

function normaliser(texte) {
  return String(texte || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim();
}

function testerGlossaire() {
  const resultat = ajouterTermeGlossaire({ terme: 'DHCP' });
  Logger.log(resultat.getContent());
}

# Instructions conseillees pour le Projet Codex

Utiliser ces instructions comme contexte permanent du Projet `Diablo IV Build Optimizer`.

## Langue et style

- Repondre en francais.
- Garder un ton clair, direct et collaboratif.
- Expliquer les decisions produit importantes sans noyer dans le detail technique.
- Quand une etape est terminee, mettre a jour le rapport projet.

## Regles techniques

- Dans ce Projet, considerer `C:\Users\FlowUP\OneDrive\Documents\Diablo 4` comme workspace courant et ne plus dependre de l'ancien workspace sauf besoin explicite de comparaison.
- Ne pas perdre la separation entre DPS strict et hypotheses what-if.
- Ne jamais promouvoir une valeur candidate dans le DPS fiable sans preuve.
- Toute donnee importante doit avoir un bloc `evidence`.
- Preferer le dataset cible normalise au dataset prototype quand les deux existent.
- Garder les candidats bloques visibles dans l'interface et dans les exports.
- Documenter les limites du modele de calcul quand elles existent.
- Ne jamais copier une fixture ou une session synthetique dans `inputs/current-runtime-cadence-observations.json`.
- Pour toute observation runtime reelle, utiliser l'apercu de l'atelier avant l'enregistrement et conserver un `sourceFile` verifiable.
- Tester les ecritures runtime uniquement sur des copies temporaires; ne pas remplir l'entree reelle pendant les tests automatises ou navigateur.

## Fichiers principaux

- Exporteur : `work/diablo4-data-exporter/d4export.js`
- Modele DPS : `work/diablo4-data-exporter/src/dps-model.js`
- Schema cible : `work/diablo4-data-exporter/schema/target-dataset.schema.json`
- Convertisseur cible : `work/diablo4-data-exporter/src/target-dataset-exporter.js`
- Site : `site/index.html`, `site/app.js`, `site/styles.css`, `site/server.js`
- Observations runtime : `inputs/current-runtime-cadence-observations.json`
- Analyse runtime : `work/diablo4-data-exporter/src/runtime-cadence-analyzer.js`
- Admission runtime : `work/diablo4-data-exporter/src/runtime-cadence-intake.js`
- Atelier runtime : `site/runtime-capture.js`, `site/runtime-cadence-api.js`
- Rapport : `outputs/rapport-outil-exportateur-diablo4.md`
- Statut court : `PROJECT_STATUS.md`

## Commandes utiles

Les exemples ci-dessous utilisent `node`. Si `node` n'est pas disponible dans le terminal, utiliser le Node embarque Codex verifie pendant la migration.

Lancer le site :

```powershell
.\run-site.ps1
```

Le site est expose par defaut sur `http://127.0.0.1:4173/site/`. Definir `PORT` pour changer le port si necessaire.

Valider le JavaScript :

```powershell
node -c site/app.js
node -c site/server.js
```

Regenerer le dataset cible :

```powershell
node work/diablo4-data-exporter/d4export.js export-target-dataset --file outputs/diablo4-optimizer-dataset/optimizer-dataset.json --out outputs/diablo4-target-dataset
```

Regenerer et verifier le plan optimiseur cible :

```powershell
.\run-target-optimizer-suite.ps1
```

Cette suite regenere les artefacts cible dans le bon ordre, verifie les invariants critiques et bloque toute promotion accidentelle du delta `1663210` dans le DPS fiable.

Ajouter une preuve externe candidate :

```powershell
notepad inputs/external-evidence-candidates.json
.\run-target-optimizer-suite.ps1
```

Une preuve externe doit rester dans l'intake tant qu'elle n'est pas reliee explicitement a un parseur cible. Ne jamais modifier `reliableDps` depuis l'intake seul.

## Priorite actuelle

Collecter les observations runtime reelles de `assetId 1663210` pour prouver l'ordre, les repetitions et la mise a l'echelle de vitesse, puis relier cette cadence au moteur de calcul par buckets sans promouvoir de DPS non prouve.

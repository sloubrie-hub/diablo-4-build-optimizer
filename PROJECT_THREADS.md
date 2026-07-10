# Decoupage conseille des fils de Projet

Projet migre le 2026-06-30 dans `C:\Users\FlowUP\OneDrive\Documents\Diablo 4`.

Point de reprise recommande : poursuivre le moteur DPS par buckets Diablo IV et la resolution des blocages de `assetId 1663210`.

## 1. Roadmap et cahier des charges

But :

- maintenir la vision produit
- suivre les jalons
- garder les decisions importantes

Fichiers utiles :

- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

## 2. Exporteur fichiers Diablo IV

But :

- ameliorer l'extraction depuis les fichiers du jeu
- decoder les payloads utiles
- retrouver les donnees gameplay

Fichiers utiles :

- `work/diablo4-data-exporter/d4export.js`
- `work/diablo4-data-exporter/src`
- `outputs/diablo4-*`

## 3. Dataset cible et schema

But :

- stabiliser le contrat de donnees
- ajouter les champs necessaires aux objets, skills, paragons, glyphes, runes et conditions
- garantir que les preuves sont presentes

Fichiers utiles :

- `work/diablo4-data-exporter/schema/target-dataset.schema.json`
- `work/diablo4-data-exporter/schema/target-dataset.md`
- `work/diablo4-data-exporter/src/target-dataset-exporter.js`

## 4. Moteur DPS et optimisation

But :

- passer de la somme prototype a un calcul par buckets
- gerer additif, multiplicatif, uptime, caps et conditions
- produire un score fiable et un score what-if separe

Fichiers utiles :

- `work/diablo4-data-exporter/src/dps-model.js`
- `site/app.js`

## 5. Interface site

But :

- rendre l'outil utilisable par un joueur
- afficher les preuves, warnings, builds et blocages
- ajouter les controles de build, filtres et exports

Fichiers utiles :

- `site/index.html`
- `site/app.js`
- `site/styles.css`
- `site/server.js`

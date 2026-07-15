# Rapport - Outil maison d'export Diablo IV

## Etat actuel

Un premier outil maison a ete developpe pour analyser une installation locale Diablo IV en lecture seule.

Il sait actuellement :

- detecter le build actif depuis `.build.info`
- lire les fichiers de configuration Battle.net/CASC
- inventorier les fichiers locaux
- lister les archives CDN et patch archives
- analyser des echantillons de fichiers `.idx` et `.index`
- trouver des signatures `BLTE` dans les blocs `data.xxx`
- decoder des chunks BLTE non chiffres en modes `N` et `Z`
- produire des rapports JSON exploitables

Build detecte sur cette machine :

- Version : `3.0.4.72271`
- Build : `72271_Win64Client_3_0_4`
- Produit interne : `Fenris`

## Sorties generees

Les derniers exports sont dans :

- `outputs/diablo4-local-export-v2/manifest.json`
- `outputs/diablo4-local-export-v2/archives.json`
- `outputs/diablo4-local-export-v2/config-files.json`
- `outputs/diablo4-local-export-v2/file-inventory.json`
- `outputs/diablo4-local-export-v2/index-analysis.json`

Une analyse detaillee d'un index local est aussi disponible dans :

- `outputs/diablo4-index-analysis-v2/0000000209.idx.analysis.json`

Les premiers tests BLTE sont disponibles dans :

- `outputs/diablo4-blte/data.000.BLTE.scan.json`
- `outputs/diablo4-blte/data.000.510.blte.json`
- `outputs/diablo4-blte/data.000.510.decoded.bin`
- `outputs/diablo4-blte-samples/`

Le catalogue large des payloads BLTE est disponible dans :

- `outputs/diablo4-blte-catalogs-v2/data.000.blte-catalog.json`
- `outputs/diablo4-blte-wide-catalog/blte-directory-catalog.json`

## Commandes

Scanner l'installation :

```powershell
node work/diablo4-data-exporter/d4export.js scan `
  --game-path "C:\Program Files (x86)\Diablo IV" `
  --out outputs/diablo4-local-export-v2
```

Analyser un fichier d'index :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-index `
  --file "C:\Program Files (x86)\Diablo IV\Data\data\0000000209.idx" `
  --out outputs/diablo4-index-analysis-v2 `
  --max-records 100
```

Scanner les signatures BLTE dans un bloc de donnees :

```powershell
node work/diablo4-data-exporter/d4export.js scan-magic `
  --file "C:\Program Files (x86)\Diablo IV\Data\data\data.000" `
  --magic BLTE `
  --out outputs/diablo4-blte
```

Decoder un payload BLTE :

```powershell
node work/diablo4-data-exporter/d4export.js decode-blte `
  --file "C:\Program Files (x86)\Diablo IV\Data\data\data.000" `
  --offset 510 `
  --out outputs/diablo4-blte
```

Cataloguer les BLTE d'un fichier :

```powershell
node work/diablo4-data-exporter/d4export.js catalog-blte `
  --file "C:\Program Files (x86)\Diablo IV\Data\data\data.000" `
  --out outputs/diablo4-blte-catalogs-v2 `
  --max-hits 80
```

Cataloguer plusieurs fichiers `data.xxx` :

```powershell
node work/diablo4-data-exporter/d4export.js catalog-blte-dir `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --out outputs/diablo4-blte-wide-catalog `
  --file-limit 20 `
  --max-hits 30 `
  --max-decode-mb 32
```

## Decouverte importante

Chaque payload `BLTE` est precede par un header local de 30 octets.

Structure observee :

- octets 0-15 : cle/identifiant binaire de 16 octets
- octets 16-19 : taille little-endian du bloc local complet
- octets 20-21 : champ inconnu
- octets 22-29 : champ binaire de 8 octets

Validation :

- `spanBytesLE = 30 + taille BLTE compressee`
- 513 headers testes
- 513 correspondances exactes
- 0 mismatch

Cela confirme que l'outil sait maintenant parcourir proprement les conteneurs locaux, et pas seulement chercher `BLTE` au hasard.

## Limite actuelle

L'outil ne sait pas encore extraire les fichiers gameplay comme les competences, objets, affixes ou plateaux parangon.

La raison : les donnees sont stockees dans des blocs CASC/VFS et non dans des fichiers JSON/CSV directement visibles. On sait maintenant trouver et decoder certains conteneurs BLTE, mais leur contenu est souvent un format binaire Diablo/Blizzard supplementaire.

Le catalogue large a trouve :

- 20 fichiers `data.xxx` parcourus
- 513 payloads BLTE catalogues
- 513 headers locaux valides
- 108 payloads `deadbeef-binary`
- 402 payloads binaires inconnus
- plusieurs familles probables : textures, sons, videos Bink, structures binaires internes

## Recherche gameplay

Une recherche ciblee dans les payloads `deadbeef-binary` a ete ajoutee.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js search-deadbeef-strings `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --out outputs/diablo4-gameplay-string-search `
  --file-limit 64 `
  --max-hits 250 `
  --max-decode-mb 8 `
  --terms "Table(,PowerTag,Damage,Skill,Affix,Paragon,Legendary,Unique,Barbarian,Sorcerer,Rogue,Druid,Necromancer,Paladin,Spirit,Rune,Glyph,Attacks_Per_Second"
```

Resultat :

- 64 fichiers `data.xxx` parcourus
- 3322 payloads `deadbeef-binary` decodes
- 40 payloads contenant des chaines gameplay
- termes trouves : `Table(`, `PowerTag`, `Affix`, `Legendary`, `Paragon`, `Necromancer`, `Spirit`, `Paladin`, etc.

Fichier :

- `outputs/diablo4-gameplay-string-search/deadbeef-string-search.json`

Premiers candidats importants :

- `data.004` offset `20028655`, assetId `2302974`
  - `Attacks_Per_Second_Total`
  - `4.5 * Table(34,sLevel)`
  - `PowerTag.Paladin_Trinity_Cast_3."Script Formula 9"`
  - `Chance_For_Double_Damage_Per_Power#Paladin_Trinity`

- `data.007` offset `8265002`, assetId `1663210`
  - `Attacks_Per_Second_Total`
  - `45 * (Table(35,sLevel))`
  - `PowerTag.Spiritborn_Talent_Ultimate_2."Script Formula 1"`
  - `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`

- `data.045` offset `43688625`, assetId `1461593`
  - `Attacks_Per_Second_Total`
  - `PowerTag.Necromancer_Talent_Caster_T3_N1."Script Formula 0"`
  - `0.1 * Table(34, sLevel)`
  - `Affix_Flat_Value_1#Helm_Unique_Necro_100`
  - `Affix.legendary_necro_012."Static Value 0"`

- `data.050` offset `31781724`, assetId `1882772`
  - `Affix.S05_BSK_Generic_001."Static Value 0"`
  - `Affix_Value_1#S05_BSK_Generic_001 / 100`

- `data.059` offset `13184789`, assetId `493422`
  - `Power_Duration_Bonus_Pct#Necromancer_BloodMist`
  - `0.005 * Table(34,sLevel)`

Cette etape confirme que les formules de gameplay sont bien presentes localement dans les fichiers du jeu et qu'on peut commencer a les extraire.

## Export propre des formules

Un export dedie aux formules a ete ajoute.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js export-formulas `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --out outputs/diablo4-formulas-export-clean `
  --file-limit 64 `
  --max-hits 250 `
  --max-decode-mb 8
```

Resultat propre :

- 64 fichiers `data.xxx` parcourus
- 3322 payloads `deadbeef-binary` decodes
- 19 blocs contenant des formules ou references utiles
- 247 chaines retenues
- 55 formules directes
- 192 references de calcul

Fichier :

- `outputs/diablo4-formulas-export-clean/formulas.json`

Exemples de formules maintenant extraites :

- `4.5 * Table(34,sLevel)`
- `1.5 * Table(34,sLevel)`
- `SF_1 * 2`
- `SF_1 * 2 * 0.75`
- `Mod.UpgradeC ? 0 : (Mod.UpgradeB ? SF_19 : SF_11)`
- `45 * (Table(35,sLevel))`
- `SF_6/SF_7`
- `Affix_Value_1#S05_BSK_Generic_001 / 100`

Les faux positifs de localisation ont ete retires de cet export. Les textes et noms localises devront etre extraits dans un export separe pour ne pas polluer le futur moteur de calcul DPS.

## Graphe de dependances des formules

Un second export transforme `formulas.json` en graphe de dependances.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js export-formula-graphs `
  --file outputs/diablo4-formulas-export-clean/formulas.json `
  --out outputs/diablo4-formula-graphs
```

Resultat :

- 19 assets avec formules/references
- 55 noeuds de formules
- 38 references `SF_`
- 3 appels de tables detectes : `Table(34,sLevel)`, `Table(34,3)`, `Table(35,sLevel)`
- 7 references `PowerTag`
- 3 proprietes `Affix`
- 9 references de type `cle#cible`

Fichier :

- `outputs/diablo4-formula-graphs/formula-graphs.json`

Ce fichier est la premiere brique directement utile au moteur de calcul : il permet de savoir, pour chaque asset, quelles formules existent et de quelles valeurs externes elles dependent.

## Recherche des tables numeriques

Une commande de recherche des tables candidates a ete ajoutee.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js search-table-candidates `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --out outputs/diablo4-table-candidates-strict `
  --file-limit 64 `
  --max-hits 250 `
  --max-decode-mb 8 `
  --table-ids 34,35
```

Resultat :

- 64 fichiers `data.xxx` parcourus
- 3322 payloads `deadbeef-binary` decodes
- 355 candidats apres filtrage strict
- 65 candidats forts dans le resume reduit
- 4 candidats avec marqueurs textuels directs `Table(...)` ou `sLevel`
- 44 candidats forts avec suites numeriques propres

Fichiers :

- `outputs/diablo4-table-candidates-strict/table-candidates.json`
- `outputs/diablo4-table-candidates-strict/table-candidates-strong.json`

Conclusion provisoire :

- Les payloads qui contiennent `Table(34,sLevel)` et `Table(35,sLevel)` stockent bien les constantes de reference `34` et `35`.
- Les tables completes ne semblent pas etre directement embarquees dans ces memes payloads.
- Il faut donc chercher les courbes de scaling dans des assets separes.
- Le meilleur suspect numerique hors payload de formule detecte pour l'instant est `assetId 1961745` dans `data.035`, offset `8287488`, avec de nombreuses references entieres `34/35` et des suites de floats non nulles.
- Un autre suspect interessant est `assetId 79921` dans `data.010`, offset `37608271`, avec des valeurs en progression reguliere et des occurrences float de `34` et `35`.

Important : ces suspects ne sont pas encore valides comme tables de scaling gameplay. Ils sont des candidats a inspecter, pas une source de calcul final.

## Inspection des candidats de tables

Une commande d'inspection detaillee des candidats numeriques a ete ajoutee.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-table-candidates `
  --file outputs/diablo4-table-candidates-strict/table-candidates-strong.json `
  --asset-ids 1961745,79921 `
  --out outputs/diablo4-table-inspection
```

Fichier :

- `outputs/diablo4-table-inspection/table-inspection.json`

Resultat :

- `assetId 79921`
  - meilleur run : 326 floats
  - structure dominante : triplets reguliers, regroupables en lignes de 12 valeurs
  - exemple : `[28.5, 16.25, 0.25]`, `[28.5, 16.25, 0.5]`, `[28.5, 16.25, 0.75]`
  - conclusion : ressemble fortement a des coordonnees/points de spline, pas a une table de scaling gameplay

- `assetId 1961745`
  - meilleur run : 176 floats
  - nombreuses occurrences entieres `34/35`
  - les zones autour de `u32 34/35` contiennent des structures repetees avec offsets, compteurs, petites listes d'entiers et floats de type 0-1
  - les grands blocs de floats montent dans des plages 15-127 et se regroupent en paquets
  - conclusion : candidat plus interessant que `79921`, mais pas valide comme table `Table(34,sLevel)` pour l'instant ; il ressemble plutot a une structure numerique complexe, potentiellement geometrie, donnees de points, ou autre asset non-gameplay

Decision :

- ne pas utiliser `79921` ni `1961745` comme source de tables de scaling dans le moteur DPS
- garder `table-inspection.json` comme preuve de rejet provisoire
- continuer la recherche des tables par une autre approche : partir des assets de formules et reconstruire les definitions `SF_` et les references externes, puis seulement revenir aux tables

## Inspection bytecode des references SF

Une commande d'inspection des references `SF_` compilees a ete ajoutee.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-sf `
  --file outputs/diablo4-formula-graphs/formula-graphs.json `
  --out outputs/diablo4-sf-inspection
```

Fichiers :

- `outputs/diablo4-sf-inspection/sf-inspection.json`
- `outputs/diablo4-sf-inspection/sf-inspection-summary.json`

Resultat :

- 11 graphes inspectes
- 55 formules inspectees
- 55 formules avec bytecode detecte
- 83 references `SF_` inferees dans le bytecode
- 120 constantes numeriques detectees dans le bytecode
- 52 formules sur 55 ont les memes references `SF_` dans la chaine texte et dans le bytecode

Decouverte importante :

- les constantes numeriques semblent encodees par `opcode 6 + float32`
- les references `SF_N` semblent encodees par `opcode 5 + (N + 6)`
- les operateurs principaux identifies :
  - `11` : addition
  - `12` : soustraction
  - `13` : multiplication
  - `14` : division
  - `9` : test d'egalite probable

Exemples :

- `SF_1 * 2` devient `SF_1 2 multiply`
- `SF_11 * SF_9 * 0.5` devient `SF_11 SF_9 multiply 0.5 multiply`
- `SF_33 == 0 ? ...` contient bien `SF_33`, `0`, puis un test d'egalite probable

Les trois ecarts restants concernent des cas plus complexes :

- `Mod.UpgradeC ? 0 : (Mod.UpgradeB ? SF_19 : SF_11)`
- `min(SF_34, ... variables externes ... SF_31)`
- `Affix.S05_BSK_Generic_001."Static Value 0" / 100`

Conclusion :

Cette etape valide que les formules texte extraites ne sont pas seulement des chaines decoratives : elles correspondent bien a un bytecode de calcul compile dans le payload. Cela rend le futur moteur DPS beaucoup plus credible, car on peut comparer texte et bytecode pour detecter les erreurs de parsing.

## Candidats de definitions SF

Une commande d'export des symboles et candidats locaux `SF_` a ete ajoutee.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js export-sf-candidates `
  --file outputs/diablo4-formula-graphs/formula-graphs.json `
  --out outputs/diablo4-sf-candidates
```

Fichiers :

- `outputs/diablo4-sf-candidates/sf-candidates.json`
- `outputs/diablo4-sf-candidates/sf-candidates-summary.json`

Resultat :

- 11 payloads/graphes inspectes
- 2585 chaines utiles retenues
- 2369 constantes numeriques
- 142 symboles `SF_`
- 54 formules candidates propres
- 20 references externes

Decouverte importante :

- Chaque symbole local `SF_N` est suivi par un encodage bytecode `opcode 5 + (N + 6)`.
- Validation : 142 symboles `SF_N` testes, 142 correspondances exactes, 0 mismatch.
- Une carte `sfSymbolMap` est maintenant produite par asset pour regrouper les occurrences d'un meme `SF_N`.
- 49 symboles ont une fenetre de constantes immediatement exploitable autour de leur definition locale.
- 93 symboles n'ont pas encore de fenetre de constantes claire ; ils semblent plutot pointer vers metadata, references externes, ou sections binaires non decodees.

Exemples :

- `SF_0` => raw `6`
- `SF_1` => raw `7`
- `SF_14` => raw `20`
- `SF_25` => raw `31`
- `SF_36` => raw `42`

Conclusion :

On sait maintenant lire la table locale des symboles `SF_` dans les payloads de formules. Ce n'est pas encore la valeur finale de chaque `SF_N`, mais c'est le chaînon qui manquait entre les chaines texte et le bytecode. La prochaine etape consiste a classer les fenetres de constantes et metadata autour de ces symboles pour savoir si `SF_N` represente une constante, une formule locale, une stat, une affixe, ou une reference externe.

Exemples de fenetres de constantes observees :

- plusieurs symboles ont une sequence du type `0, 1, 0, 0, 100, 0, 0, 1...`
- certains symboles ont uniquement `0, 1`
- certains symboles ont une zone vide ou non interpretee

Hypothese de travail :

- ces constantes pourraient representer des bornes, valeurs par defaut, min/max, flags d'affichage, ou parametres internes de formule
- il ne faut pas encore les utiliser comme valeurs DPS finales avant d'avoir identifie le role de chaque position

## Classification des fenetres SF

L'export `sf-candidates` classe maintenant automatiquement les fenetres de constantes autour des symboles `SF_N`.

Profils actuels :

- `no-constant-window` : aucun bloc numerique immediatement exploitable
- `range-like-window` : motif avec `0/1/100`, probablement bornes, default, range ou metadata UI/calcul
- `scale-100-window` : contient `100`, possiblement pourcentage, max ou facteur d'echelle
- `short-flag-window` : petite fenetre `0/1`, probablement flag/default compact
- `flag-window` : fenetre composee uniquement de `0/1`
- `zero-window` : uniquement des zeros
- `repeated-small-window` : peu de valeurs repetees
- `mixed-constant-window` : constantes mixtes non classees

Resultat sur les 142 symboles `SF_N` :

- 93 `no-constant-window`
- 24 `range-like-window`
- 6 `scale-100-window`
- 6 `short-flag-window`
- 5 `zero-window`
- 4 `repeated-small-window`
- 2 `flag-window`
- 2 `mixed-constant-window`

Exemples :

- `SF_0` dans certains assets : `0, 0, 1, 0, 0, 100, 0, 0, 1...`
- `SF_1` dans certains assets : `0, 1`
- `SF_5` dans un asset : `0, 0, 0, 0, 0, 0, 100, 10, 0`

Conclusion :

Cette classification ne donne pas encore la valeur finale d'un `SF_N`, mais elle permet de separer les slots en familles. C'est une etape necessaire avant de brancher ces donnees dans le calcul DPS : on doit savoir si une fenetre est une borne, un flag, une valeur par defaut, une echelle de pourcentage, ou une metadata sans impact direct.

## Analyse d'usage des SF dans les formules

Une commande d'analyse croisee a ete ajoutee pour relier les symboles `SF_N` aux formules qui les utilisent.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js analyze-sf-usage `
  --file outputs/diablo4-formula-graphs/formula-graphs.json `
  --sf-candidates outputs/diablo4-sf-candidates/sf-candidates.json `
  --out outputs/diablo4-sf-usage
```

Fichiers :

- `outputs/diablo4-sf-usage/sf-usage-analysis.json`
- `outputs/diablo4-sf-usage/sf-usage-summary.json`

Resultat :

- 19 graphes analyses
- 55 formules analysees
- 61 usages `SF_` classes
- 42 symboles locaux uniques utilises dans leur asset
- 55 symboles locaux presents mais non utilises par les formules extraites
- 39 references `SF_` utilisees dans une formule sans symbole local retrouve dans l'export actuel

Roles detectes :

- `multiplier` : 26
- `numerator` : 12
- `divisor` : 9
- `conditional-branch` : 8
- `table-scaling` : 7
- `subtractive` : 4
- `additive` : 3
- `condition` : 3
- `external-combo` : 2
- `plain-reference` : 2
- `minmax-bound` : 1

Priorisation DPS :

- 8 usages sont classes `high`
- 41 usages sont classes `medium`
- 12 usages sont classes `low`

Exemples prioritaires :

- `SF_4 * Table(34, 3) * 100`
- `(SF_33 == 0)? (0.35 * Table(34, sLevel)) : (0.35 * Table(34, sLevel)*(1+( SF_32)))`
- `2 / SF_3`
- `4.2*SF_5/SF_0`
- `SF_3 * (SF_0 / SF_5)`
- `(1-POW(1-SF_29/100,1/(SF_9*2)))*100`

Conclusion :

Cette etape donne une premiere liste de slots `SF_` a traiter en priorite pour le moteur DPS. Les multiplicateurs, divisions, ratios et formules combinees avec `Table(...)` sont plus importants que les flags ou references simples. Le point faible restant est clair : de nombreuses references utilisees dans les formules n'ont pas encore de definition locale resolue, donc il faut maintenant retrouver les tables de symboles ou references externes qui completent ces `SF_N`.

## Resolution des SF manquants

Une commande a ete ajoutee pour analyser les `SF_N` utilises dans les formules mais absents des definitions locales de leur asset.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js resolve-missing-sf `
  --file outputs/diablo4-sf-usage/sf-usage-analysis.json `
  --sf-candidates outputs/diablo4-sf-candidates/sf-candidates.json `
  --out outputs/diablo4-missing-sf-resolution
```

Fichiers :

- `outputs/diablo4-missing-sf-resolution/missing-sf-resolution.json`
- `outputs/diablo4-missing-sf-resolution/missing-sf-resolution-summary.json`

Resultat :

- 39 references `SF_` manquantes dans leur asset local
- 29 paires uniques `assetId + SF_N`
- 34 references ont le meme index `SF_N` defini dans au moins un autre asset
- 5 references manquantes sont haute priorite DPS
- 26 references manquantes sont priorite moyenne

Classification :

- `same-index-defined-in-related-assets` : 25
- `table-linked-missing-slot` : 7
- `definition-outside-current-window` : 6
- `external-dependency` : 1

Cas prioritaires :

- `assetId 1461593`, `SF_4` : `SF_4 * Table(34, 3) * 100`
- `assetId 493422`, `SF_5` : `4.2*SF_5/SF_0`
- `assetId 1663210`, `SF_33` : condition qui module `Table(34,sLevel)`
- `assetId 1663210`, `SF_32` : bonus applique dans la branche avec `Table(34,sLevel)`
- `assetId 1663210`, `SF_29` : formule de type probabilite/uptime avec `POW(...)`

Conclusion :

Les `SF_N` ne doivent pas etre consideres comme des identifiants globaux fiables : le meme index peut exister dans plusieurs assets avec des sens differents. En revanche, les correspondances par tags et roles donnent des pistes utiles pour retrouver la structure source. La prochaine etape doit donc etre plus locale : elargir l'extraction autour des assets prioritaires, surtout `1461593`, `1663210`, `493422` et `1953817`, afin de retrouver les blocs de metadata qui definissent ces slots manquants.

## Inspection profonde des assets prioritaires

Une commande d'inspection ciblee a ete ajoutee pour relire les payloads des assets prioritaires et analyser les offsets des formules, les occurrences ASCII de `SF_N`, les occurrences bytecode `opcode 5 + (N+6)`, et les fenetres binaires autour des zones suspectes.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-priority-assets `
  --file outputs/diablo4-formula-graphs/formula-graphs.json `
  --sf-candidates outputs/diablo4-sf-candidates/sf-candidates.json `
  --missing-sf outputs/diablo4-missing-sf-resolution/missing-sf-resolution.json `
  --asset-ids 1461593,1663210,493422,1953817 `
  --out outputs/diablo4-priority-asset-inspection
```

Fichiers :

- `outputs/diablo4-priority-asset-inspection/priority-asset-inspection.json`
- `outputs/diablo4-priority-asset-inspection/priority-asset-inspection-summary.json`

Resultat :

- 4 assets inspectes
- 28 references `SF_` manquantes dans ces assets
- 20 formules concernees
- 37 occurrences ASCII de ces `SF_`
- 30 occurrences bytecode de ces `SF_`
- 0 occurrence ASCII standalone

Detail par asset :

- `assetId 1663210` : 12 references manquantes, 8 formules, 14 occurrences ASCII, 14 occurrences bytecode
- `assetId 1953817` : 7 references manquantes, 5 formules, 11 occurrences ASCII, 7 occurrences bytecode
- `assetId 1461593` : 6 references manquantes, 4 formules, 9 occurrences ASCII, 6 occurrences bytecode
- `assetId 493422` : 3 references manquantes, 3 formules, 3 occurrences ASCII, 3 occurrences bytecode

Decouverte importante :

Les `SF_N` manquants prioritaires ne sont pas absents des formules : ils sont bien presents dans le texte et dans le bytecode compile. En revanche, ils n'apparaissent jamais comme symbole isole `SF_N` dans le payload. Cela indique qu'ils ne sont probablement pas definis localement dans la table de symboles visible du meme asset. Ils ressemblent plutot a des parametres fournis par une autre structure : metadata d'asset, PowerTag, affixe, table de valeurs, ou liaison externe.

Conclusion :

La recherche ne doit plus essayer de forcer une definition locale pour ces slots. Il faut maintenant remonter la structure qui injecte les parametres dans chaque formule. Les priorites deviennent :

- identifier les references externes proches des formules dans les assets `1663210`, `1461593`, `493422`, `1953817`
- relier ces references a des noms de pouvoirs, aspects, uniques ou affixes
- trouver ou sont stockees les valeurs qui alimentent ces slots `SF_N`
- conserver les `SF_N` comme variables d'entree tant que leur source exacte n'est pas resolue

## Export des references externes

Une commande a ete ajoutee pour regrouper les references externes par asset et par cible : `PowerTag`, `Affix`, references `cle#cible`, `Table(...)`, et liens proches des formules prioritaires.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js export-external-refs `
  --file outputs/diablo4-formula-graphs/formula-graphs.json `
  --priority-inspection outputs/diablo4-priority-asset-inspection/priority-asset-inspection.json `
  --out outputs/diablo4-external-references
```

Fichiers :

- `outputs/diablo4-external-references/external-references.json`
- `outputs/diablo4-external-references/external-references-summary.json`

Resultat :

- 19 assets analyses
- 7 assets avec references externes
- 7 groupes `PowerTag`
- 3 groupes `Affix`
- 9 groupes `cle#cible`
- 3 groupes `Table(...)`
- 4 groupes `Script Formula`
- 20 liens prioritaires entre formules avec `SF_N` manquants et references voisines

Groupes `PowerTag` detectes :

- `SystemsTuningGlobals.Script Formula 0`
- `Necromancer_Talent_Caster_T3_N1.Script Formula 0`
- `NPC_Mercenary_BerserkerCrone_passiveA6.Script Formula 2`
- `Paladin_Oath_Zealot.Script Formula 2`
- `Paladin_Trinity_Cast_3.Script Formula 9`
- `Spiritborn_Talent_Ultimate_2.Script Formula 0`
- `Spiritborn_Talent_Ultimate_2.Script Formula 1`

Groupes `cle#cible` detectes :

- `Affix_Flat_Value_1#Helm_Unique_Necro_100`
- `Affix_Value_1#legendary_necro_012`
- `Affix_Value_1#S05_BSK_Generic_001`
- `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
- `Bonus_Percent_Per_Power#Spiritborn_Feather_Spawn`
- `CC_Duration_Bonus_Percent_Per_Power#Paladin_Trinity_Cast_3`
- `Chance_For_Double_Damage_Per_Power#Paladin_Trinity`
- `Power_Duration_Bonus_Pct#Necromancer_BloodMist`
- `Spiritborn_Spirit_Bonus#spiritborn_eagle_sun_passive_alternate`

Rattachements prioritaires :

- `assetId 1663210`
  - classe probable : Spiritborn
  - references : `Spiritborn_Talent_Ultimate_2`, `SystemsTuningGlobals`, `Spiritborn_Centipede_Ultimate`
  - contient des formules de scaling avec `Table(34,sLevel)` et des slots `SF_32/SF_33`

- `assetId 1461593`
  - classe probable : Necromancer
  - references : `Helm_Unique_Necro_100`, `legendary_necro_012`, `Necromancer_Talent_Caster_T3_N1`
  - combine affixe, unique/legendary, PowerTag et table

- `assetId 493422`
  - classe probable : Necromancer
  - reference : `Power_Duration_Bonus_Pct#Necromancer_BloodMist`
  - les formules autour de `SF_5` sont proches de cette reference, ce qui en fait une bonne piste pour resoudre l'uptime ou la duree de `BloodMist`

- `assetId 1953817`
  - classe probable : Spiritborn
  - references : `SystemsTuningGlobals`, `Spiritborn_Feather_Spawn`, `spiritborn_eagle_sun_passive_alternate`
  - plusieurs formules avec `SF_0/SF_1/SF_10/SF_12` sont tres proches de `SystemsTuningGlobals."Script Formula 0"`

Conclusion :

On a maintenant une couche de liaison entre les formules et les entites gameplay probables. La prochaine etape doit chercher les assets qui definissent ces cibles externes elles-memes, notamment `Necromancer_BloodMist`, `Helm_Unique_Necro_100`, `Spiritborn_Talent_Ultimate_2`, `Spiritborn_Centipede_Ultimate`, `SystemsTuningGlobals` et `legendary_necro_012`.

## Recherche inverse des cibles externes

Une commande a ete ajoutee pour scanner les payloads du jeu a partir des cibles externes identifiees. Elle cherche les references completes, les noms de cibles, les noms de pouvoirs, les affixes et les cles `cle#cible`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js search-external-targets `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --external-refs outputs/diablo4-external-references/external-references.json `
  --out outputs/diablo4-external-target-search `
  --file-limit 64 `
  --max-hits 250 `
  --max-decode-mb 8
```

Fichiers :

- `outputs/diablo4-external-target-search/external-target-search.json`
- `outputs/diablo4-external-target-search/external-target-search-summary.json`

Resultat :

- 64 fichiers `data.xxx` parcourus
- 3322 payloads `deadbeef-binary` decodes
- 49 termes de recherche generes depuis les references externes
- 8 payloads correspondants
- 19 groupes de cibles retrouves

Correspondances haute confiance :

- `Affix_Value_1#legendary_necro_012`
  - asset `1461593`, `data.045`, offset `43688625`

- `Affix_Flat_Value_1#Helm_Unique_Necro_100`
  - asset `1461593`, `data.045`, offset `43688625`

- `Power_Duration_Bonus_Pct#Necromancer_BloodMist`
  - asset `493422`, `data.059`, offset `13184789`

- `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
  - asset `1663210`, `data.007`, offset `8265002`

- `Spiritborn_Spirit_Bonus#spiritborn_eagle_sun_passive_alternate`
  - asset `1953817`, `data.007`, offset `8270942`

- `Bonus_Percent_Per_Power#Spiritborn_Feather_Spawn`
  - asset `1953817`, `data.007`, offset `8270942`

- `Affix_Value_1#S05_BSK_Generic_001`
  - asset `1882772`, `data.050`, offset `31781724`

- `Chance_For_Double_Damage_Per_Power#Paladin_Trinity`
  - asset `2302974`, `data.004`, offset `20028655`

- `CC_Duration_Bonus_Percent_Per_Power#Paladin_Trinity_Cast_3`
  - asset `2302974`, `data.004`, offset `20028655`

Nouveaux assets utiles :

- `assetId 1882772`
  - affixe generique `S05_BSK_Generic_001`
  - contient `Affix.S05_BSK_Generic_001."Static Value 0" / 100`
  - utile comme modele pour comprendre la resolution des valeurs d'affixes

- `assetId 2474146`
  - faible confiance pour `Affix_Value_1#legendary_necro_012`, car le match est surtout sur la cle generique `Affix_Value_1`
  - a garder comme piste secondaire, pas comme rattachement final

Conclusion :

Les cibles externes les plus importantes ne pointent pas vers des centaines d'assets disperses : elles se regroupent dans quelques payloads deja identifies. Cela confirme que l'approche par graphe est meilleure que la recherche brute. La prochaine etape doit extraire un modele de resolution des valeurs externes a partir d'un cas simple, probablement `assetId 1882772` avec `S05_BSK_Generic_001`, puis appliquer ce modele aux affixes et pouvoirs plus complexes.

## Inspection des valeurs externes d'affixes

Une commande a ete ajoutee pour inspecter les formules contenant des references externes d'affixe et tenter d'inferer des equivalences entre les deux syntaxes observees :

- `Affix.<nom>."Static Value N"`
- `Affix_Value_X#<nom>`

Commande ciblee :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-external-values `
  --file outputs/diablo4-formula-graphs/formula-graphs.json `
  --asset-ids 1882772 `
  --out outputs/diablo4-external-value-inspection
```

Commande globale sur les assets avec references externes :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-external-values `
  --file outputs/diablo4-formula-graphs/formula-graphs.json `
  --out outputs/diablo4-external-value-inspection-all
```

Fichiers :

- `outputs/diablo4-external-value-inspection/external-value-inspection.json`
- `outputs/diablo4-external-value-inspection/external-value-inspection-summary.json`
- `outputs/diablo4-external-value-inspection-all/external-value-inspection.json`
- `outputs/diablo4-external-value-inspection-all/external-value-inspection-summary.json`

Resultat sur le cas simple `assetId 1882772` :

- 1 asset inspecte
- 2 formules externes
- 3 chaines pertinentes
- 2 equivalences candidates
- 1 equivalence haute confiance

Regle observee :

- `Affix.<target>."Static Value 0"` correspond a `Affix_Value_1#<target>`
- plus generalement, hypothese : `Static Value N` correspond a `Affix_Value_(N+1)#<target>`

Preuves actuelles haute confiance :

- `assetId 1882772`
  - `Affix.S05_BSK_Generic_001."Static Value 0" / 100`
  - `Affix_Value_1#S05_BSK_Generic_001 / 100`
  - conclusion : `Static Value 0` = `Affix_Value_1` pour `S05_BSK_Generic_001`

- `assetId 1461593`
  - `Affix.legendary_necro_012."Static Value 0"`
  - `Affix_Value_1#legendary_necro_012`
  - conclusion : `Static Value 0` = `Affix_Value_1` pour `legendary_necro_012`

Cas ambigu :

- `Affix.S05_BSK_Generic_001."Static Value 1"` apparait dans le meme asset que `Affix_Value_1#S05_BSK_Generic_001`, mais l'index ne correspond pas a la regle `N+1`.
- Il faut donc attendre de trouver un `Affix_Value_2#S05_BSK_Generic_001` ou un autre asset equivalent avant de valider `Static Value 1`.

Conclusion :

On a maintenant la premiere regle de resolution de valeur externe exploitable par le futur moteur DPS. Une formule qui depend de `Affix_Value_1#legendary_necro_012` ou de `Affix.<nom>."Static Value 0"` peut etre representee par la meme variable canonique :

- `affix:<nom>:value[0]`

Cette regle ne donne pas encore la valeur numerique roll/min/max de l'affixe, mais elle unifie deux syntaxes internes du jeu. C'est une etape importante avant de relier ces variables aux objets, aspects et plages d'affixes.

## Export des variables externes canoniques

Une commande a ete ajoutee pour transformer les references externes en variables canoniques directement exploitables par le futur moteur DPS.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js export-canonical-vars `
  --file outputs/diablo4-formula-graphs/formula-graphs.json `
  --external-values outputs/diablo4-external-value-inspection-all/external-value-inspection.json `
  --out outputs/diablo4-canonical-external-variables
```

Fichiers :

- `outputs/diablo4-canonical-external-variables/canonical-external-variables.json`
- `outputs/diablo4-canonical-external-variables/canonical-external-variables-summary.json`

Resultat :

- 19 assets traites
- 20 variables canoniques exportees
- 4 variables d'affixe
- 7 variables `PowerTag`
- 6 variables `cle#cible`
- 3 variables de table
- 2 variables prouvees par equivalence
- 20 formules avec references canoniques

Variables d'affixe :

- `affix:S05_BSK_Generic_001:value[0]`
  - statut : prouve
  - sources :
    - `Affix.S05_BSK_Generic_001."Static Value 0"`
    - `Affix_Value_1#S05_BSK_Generic_001`

- `affix:legendary_necro_012:value[0]`
  - statut : prouve
  - sources :
    - `Affix.legendary_necro_012."Static Value 0"`
    - `Affix_Value_1#legendary_necro_012`

- `affix:Helm_Unique_Necro_100:value[0]`
  - statut : infere depuis `Affix_Flat_Value_1#Helm_Unique_Necro_100`

- `affix:S05_BSK_Generic_001:value[1]`
  - statut : infere depuis `Static Value 1`
  - a confirmer avec une reference explicite de type `Affix_Value_2#S05_BSK_Generic_001`

Exemples de formules canonisees :

- `Affix.S05_BSK_Generic_001."Static Value 0" / 100`
  - devient `affix:S05_BSK_Generic_001:value[0] / 100`

- `Affix_Value_1#S05_BSK_Generic_001 / 100`
  - devient `affix:S05_BSK_Generic_001:value[0] / 100`

- `(((Affix_Value_1#legendary_necro_012 - 1.5) * Affix.legendary_necro_012."Static Value 0") +50) / 100`
  - devient `(((affix:legendary_necro_012:value[0] - 1.5) * affix:legendary_necro_012:value[0]) +50) / 100`

Variables `PowerTag` :

- `power:SystemsTuningGlobals:scriptFormula[0]`
- `power:Necromancer_Talent_Caster_T3_N1:scriptFormula[0]`
- `power:NPC_Mercenary_BerserkerCrone_passiveA6:scriptFormula[2]`
- `power:Paladin_Oath_Zealot:scriptFormula[2]`
- `power:Paladin_Trinity_Cast_3:scriptFormula[9]`
- `power:Spiritborn_Talent_Ultimate_2:scriptFormula[0]`
- `power:Spiritborn_Talent_Ultimate_2:scriptFormula[1]`

Conclusion :

Le projet dispose maintenant d'un format intermediaire propre entre les donnees extraites et le moteur de calcul. Les formules peuvent etre reecrites vers des variables stables, meme quand le jeu utilise plusieurs syntaxes internes pour le meme concept. La prochaine etape doit utiliser ce format pour brancher l'evaluateur de formules sur des variables canoniques, avec des valeurs placeholder controlees, puis remplacer progressivement ces placeholders par les valeurs reelles extraites.

## Evaluation des formules canonisees

Une commande a ete ajoutee pour evaluer les formules reecrites avec variables canoniques. Les variables canoniques sont converties en identifiants internes temporaires, puis alimentees par des valeurs placeholder controlees.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js evaluate-canonical-vars `
  --file outputs/diablo4-canonical-external-variables/canonical-external-variables.json `
  --out outputs/diablo4-canonical-formula-evaluation
```

Fichier :

- `outputs/diablo4-canonical-formula-evaluation/canonical-formula-evaluation.json`

Resultat :

- 6 assets evalues
- 20 formules canonisees
- 20 succes
- 0 erreur
- 20 variables canoniques disponibles dans le contexte

Validation importante :

Les deux syntaxes suivantes :

- `Affix.S05_BSK_Generic_001."Static Value 0" / 100`
- `Affix_Value_1#S05_BSK_Generic_001 / 100`

sont toutes les deux reecrites en :

- `affix:S05_BSK_Generic_001:value[0] / 100`

Avec le meme placeholder, elles donnent donc la meme valeur evaluee : `0.11`.

Autres exemples evalues :

- `(((affix:legendary_necro_012:value[0] - 1.5) * affix:legendary_necro_012:value[0]) +50) / 100`
- `1 + power:Necromancer_Talent_Caster_T3_N1:scriptFormula[0]`
- `1 + external:Spiritborn_Feather_Spawn:Bonus_Percent_Per_Power`
- `1 + external:Paladin_Trinity_Cast_3:CC_Duration_Bonus_Percent_Per_Power`
- `SF_4 * Table(34, 3) * 100`

Important :

Les valeurs numeriques restent des placeholders. Elles ne doivent pas etre interpretees comme des valeurs reelles de Diablo IV. Cette etape valide le pipeline technique :

1. extraction de formules
2. detection des references externes
3. canonisation des variables
4. injection dans un contexte d'evaluation
5. evaluation sans erreur

Conclusion :

Le moteur d'expression peut maintenant travailler avec un format proche de celui qu'utilisera le futur optimiseur DPS. La prochaine etape consiste a remplacer les placeholders les plus simples par des valeurs extraites ou configurees : d'abord les affixes canoniques prouves, puis les `PowerTag`, puis les tables `Table(34/35, ...)`.

## Contexte configurable pour evaluation canonique

Une commande a ete ajoutee pour generer un fichier de contexte editable. Ce contexte permet de donner des valeurs aux variables canoniques sans modifier le code.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js export-canonical-context `
  --file outputs/diablo4-canonical-external-variables/canonical-external-variables.json `
  --out outputs/diablo4-canonical-context
```

Fichier :

- `outputs/diablo4-canonical-context/canonical-context.json`

Le fichier contient :

- `canonicalValues` : valeurs des variables `affix:*`, `power:*`, `external:*`, `table:*`
- `context.variables` : variables globales comme `sLevel`
- `context.sf` : valeurs placeholder des `SF_N`
- `context.mods` : flags de variantes/upgrades
- `context.tables` : tables placeholder `Table(34,...)` et `Table(35,...)`

L'evaluation canonique accepte maintenant ce contexte :

```powershell
node work/diablo4-data-exporter/d4export.js evaluate-canonical-vars `
  --file outputs/diablo4-canonical-external-variables/canonical-external-variables.json `
  --context-file outputs/diablo4-canonical-context/canonical-context.json `
  --out outputs/diablo4-canonical-formula-evaluation-configured
```

Resultat :

- 20 formules evaluees
- 20 succes
- 0 erreur

Scenario de test :

Un scenario de test a ete genere dans :

- `outputs/diablo4-canonical-context-scenarios/scenario-affix-s05-value25.json`

Ce scenario force :

- `affix:S05_BSK_Generic_001:value[0] = 25`

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js evaluate-canonical-vars `
  --file outputs/diablo4-canonical-external-variables/canonical-external-variables.json `
  --context-file outputs/diablo4-canonical-context-scenarios/scenario-affix-s05-value25.json `
  --out outputs/diablo4-canonical-formula-evaluation-scenario-s05-value25
```

Validation :

- contexte par defaut : `affix:S05_BSK_Generic_001:value[0] / 100` donne `0.11`
- scenario valeur 25 : `affix:S05_BSK_Generic_001:value[0] / 100` donne `0.25`
- les deux syntaxes equivalentes changent ensemble, car elles pointent vers la meme variable canonique

Conclusion :

On peut maintenant simuler des rolls, des valeurs de pouvoirs, des tables et des flags de build via un simple fichier JSON. C'est une brique essentielle pour l'optimiseur : le futur site pourra generer ce contexte depuis les choix du joueur, puis appeler le moteur d'evaluation pour comparer les DPS.

## Premier modele DPS minimal

Une commande a ete ajoutee pour construire un modele DPS minimal a partir des formules canonisees evaluees.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js build-dps-model `
  --file outputs/diablo4-canonical-formula-evaluation-configured/canonical-formula-evaluation.json `
  --out outputs/diablo4-minimal-dps-model
```

Fichier :

- `outputs/diablo4-minimal-dps-model/minimal-dps-model.json`

Resultat :

- 6 assets analyses
- 4 assets avec au moins un terme de degats
- 11 formules classees `damage-coefficient`
- 5 formules classees `multiplier`
- 2 formules classees `uptime-or-chance`
- 2 formules classees `utility-or-scaling`

Principe du modele :

- `estimatedDps = weaponDamage * attackSpeed * primaryDamageCoefficient * multiplierProduct * uptimeProduct`
- `weaponDamage` placeholder : `100`
- `attackSpeed` placeholder : `1.2`
- les formules equivalentes canonisees sont dedupliquees pour eviter de compter deux fois le meme effet

Exemple de validation du dedoublonnage :

- asset `1882772`
- deux formules differentes pointent vers `affix:S05_BSK_Generic_001:value[0] / 100`
- elles restent visibles dans la trace
- mais elles ne sont comptees qu'une seule fois dans `multiplierProduct`

Comparaison du scenario `S05=25` :

- contexte par defaut : `affix:S05_BSK_Generic_001:value[0] = 11`
  - multiplicateur calcule : `1.11`
- scenario test : `affix:S05_BSK_Generic_001:value[0] = 25`
  - multiplicateur calcule : `1.25`

Fichier scenario :

- `outputs/diablo4-minimal-dps-model-scenario-s05-value25/minimal-dps-model.json`

Important :

Ce modele n'est pas encore un vrai calcul DPS Diablo IV. Il sert a valider l'architecture :

1. les formules sont extraites
2. les references externes sont canonisees
3. un contexte de build/roll injecte des valeurs
4. les formules sont evaluees
5. les resultats sont classes en composants DPS
6. les effets equivalents ne sont pas double-comptes

Limites actuelles :

- `Table(34/35, ...)` utilise encore des placeholders
- `SF_N` utilise encore des placeholders
- les roles DPS sont heuristiques
- les multiplicateurs/cas d'uptime ne sont pas encore lies a des regles exactes de Diablo IV
- les valeurs affichees ne doivent pas etre interpretees comme des valeurs reelles du jeu

Conclusion :

Le squelette du moteur DPS existe maintenant. La prochaine etape doit remplacer progressivement les placeholders les plus critiques : d'abord les tables `Table(34/35, ...)`, puis les `SF_N` prioritaires, puis les valeurs de `PowerTag` et les affixes.

## Evaluateur de formules

Un premier evaluateur d'expressions a ete ajoute.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js evaluate-formula-graphs `
  --file outputs/diablo4-formula-graphs/formula-graphs.json `
  --out outputs/diablo4-formula-evaluation
```

Capacites actuelles :

- operations arithmetiques : `+`, `-`, `*`, `/`
- parentheses
- comparaisons : `==`, `!=`, `>`, `<`, `>=`, `<=`
- ternaire : `condition ? a : b`
- fonctions : `Table`, `min`, `max`, `floor`, `ceil`, `pow`, `abs`
- variables : `sLevel`, statistiques nommees, references `SF_`
- flags de mods : `Mod.UpgradeA`, `Mod.UpgradeB`, `Mod.UpgradeC`
- references externes : `PowerTag...`, `Affix...`, `cle#cible`

Resultat avec contexte placeholder :

- 55 formules evaluees
- 55 succes
- 0 erreur de parsing/evaluation

Fichier :

- `outputs/diablo4-formula-evaluation/formula-evaluation.json`

Exemples avec tables placeholder :

- `4.5 * Table(34,sLevel)` => `450`
- `1.5 * Table(34,sLevel)` => `150`
- `SF_1 * 2` => `4`
- `Mod.UpgradeC ? 0 : (Mod.UpgradeB ? SF_19 : SF_11)` => `12`

Important : ces valeurs ne sont pas encore les valeurs reelles du jeu. Les tables `Table(34,...)` et `Table(35,...)` sont volontairement remplacees par des placeholders pour valider le moteur d'expression.

## Prochaine etape

Transformer `formulas.json` en donnees calculables :

1. Remplacer les tables placeholders par des tables extraites ou validees.
2. Creer un premier modele DPS minimal base sur le contexte canonique : coefficient de skill, table de niveau, affixes, multiplicateurs.
3. Appliquer ce modele aux affixes et references `cle#cible` plus complexes : `legendary_necro_012`, `Helm_Unique_Necro_100`, `Necromancer_BloodMist`.
4. Relier `PowerTag`, `Affix` et references `cle#cible` aux objets/competences/aspects.
5. Relier `assetId` aux noms d'objets/competences via tables de noms ou metadata VFS.
6. Reprendre la recherche des tables avec les nouveaux liens metadata, plutot qu'avec une recherche numerique brute.
7. Remplacer les tables placeholders `Table(34/35, ...)` par des tables extraites ou validees.

Ensuite seulement, on pourra commencer les parseurs gameplay :

- skills
- paragon boards
- paragon glyphs
- affixes
- uniques
- aspects
- runes
- textes localises

## Analyse de sensibilite DPS

Une analyse de sensibilite a ete ajoutee au prototype DPS.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js analyze-dps-sensitivity `
  --file outputs/diablo4-canonical-external-variables/canonical-external-variables.json `
  --context-file outputs/diablo4-canonical-context/canonical-context.json `
  --out outputs/diablo4-dps-sensitivity
```

Fichier produit :

- `outputs/diablo4-dps-sensitivity/dps-sensitivity.json`

Principe :

- chaque variable canonique numerique est augmentee de 10 %
- les formules sont reevaluees avec ce nouveau contexte
- le modele DPS minimal est reconstruit
- la difference de DPS est mesuree par variable et par asset

Resultat actuel apres liaison des variables `table:*` au resolver `Table(...)` :

- 134 variables testees
- 6 variables avec impact DPS
- 10 assets compares dans le modele DPS minimal
- DPS total baseline placeholder : `1336410.0000000002`

Variables les plus sensibles :

1. `affix:legendary_necro_012:value[0]`
   - valeur : `13` -> `14.3`
   - delta DPS total : `187153.19999999972`
   - delta total : `14.004175365344446 %`
   - assets touches : `1`
2. `table:34:3`
   - valeur : `3` -> `3.3000000000000003`
   - delta DPS total : `111321`
   - delta total : `8.329853862212943 %`
   - assets touches : `1`
3. `sf:1461593:4`
   - valeur : `5` -> `5.5`
   - delta DPS total : `111321`
   - delta total : `8.329853862212943 %`
   - assets touches : `1`
4. `power:Necromancer_Talent_Caster_T3_N1:scriptFormula[0]`
   - valeur : `2.1` -> `2.3100000000000005`
   - delta DPS total : `75411`
   - delta total : `5.642804229241025 %`
   - assets touches : `1`
5. `table:34:sLevel`
   - valeur : `100` -> `110.00000000000001`
   - delta DPS total : `22320`
   - delta total : `1.6701461377870561 %`
   - assets touches : `3`
6. `sf:1663210:32`
   - valeur : `33` -> `36.300000000000004`
   - delta DPS total : `15840.00000000003`
   - delta total : `1.1852650010101689 %`
   - assets touches : `1`

Observation importante :

Les variables `table:*` sont maintenant reliees au resolver `Table(...)`. Le template de contexte materialise les valeurs de table depuis `context.tables` :

- `table:34:3 = 3`
- `table:34:sLevel = 100`
- `table:35:sLevel = 10`

`table:35:sLevel` reste a zero impact dans le modele DPS minimal actuel, probablement parce que les formules qui l'utilisent sont classees hors dommage direct ou n'affectent pas les composants retenus par l'heuristique DPS.

## Variables SF locales

Les references `SF_N` sont maintenant exportees comme variables canoniques locales par asset :

- format : `sf:<assetId>:<sfIndex>`
- exemple : `SF_4` dans l'asset `1461593` devient `sf:1461593:4`
- les valeurs placeholder suivent l'ancien comportement du contexte : `SF_N = N + 1`

Impact de cette etape :

- variables canoniques : `20` -> `134`
- variables `script-formula-local` : `114`
- formules canoniques evaluables : `20` -> `54`
- erreurs d'evaluation : `0`
- assets dans le modele DPS minimal : `6` -> `10`

Cette liaison est importante parce que les `SF_N` portent souvent des coefficients, seuils, multiplicateurs ou flags propres a une competence/un objet. Les rendre pilotables permet a l'optimiseur de tester leur impact marginal sans confondre deux assets qui utilisent le meme numero `SF`.

Conclusion :

On a maintenant un premier classement automatique des variables qui font varier le DPS, incluant les tables de scaling et les `SF_N` locaux. Il est encore base sur des placeholders, mais il valide une brique essentielle de l'optimiseur : mesurer l'impact marginal d'un affixe, d'un PowerTag, d'une table, d'un `SF_N` ou d'une valeur externe sur un build calcule.

## Audit des roles DPS

Un audit a ete ajoute pour les formules calculees mais exclues du DPS sous le role `utility-or-scaling`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js audit-dps-roles `
  --file outputs/diablo4-minimal-dps-model/minimal-dps-model.json `
  --out outputs/diablo4-dps-role-audit
```

Fichier produit :

- `outputs/diablo4-dps-role-audit/dps-role-audit.json`

Resultat actuel :

- formules `utility-or-scaling` auditees : `36`
- assets touches : `9`
- suggestions priorite haute : `13`
- suggestions priorite moyenne : `18`

Repartition des suggestions :

- `flat-or-secondary-scaling-candidate` : `14`
- `local-sf-multiplier-candidate` : `12`
- `manual-review` : `5`
- `percent-or-chance-candidate` : `4`
- `small-table-coefficient-candidate` : `1`

Exemples prioritaires :

- `sf:493422:28 * (sf:493422:0 / sf:493422:5)` -> candidat multiplicateur local SF
- `sf:2302974:1 * 2` -> candidat multiplicateur local SF
- `sf:1663210:6/sf:1663210:7` -> candidat multiplicateur local SF
- `0.005 * Table(34,sLevel)` -> petit coefficient de table candidat

Decision :

Ces formules ne sont pas encore integrees automatiquement au DPS. L'audit sert de file de priorisation pour eviter de compter des durees, chances, seuils ou valeurs d'affichage comme des multiplicateurs de degats.

## Mode DPS experimental

Un mode experimental separe a ete ajoute pour mesurer l'impact des candidates de l'audit sans modifier le DPS strict.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js build-experimental-dps-model `
  --file outputs/diablo4-minimal-dps-model/minimal-dps-model.json `
  --audit-file outputs/diablo4-dps-role-audit/dps-role-audit.json `
  --include-priority high `
  --out outputs/diablo4-experimental-dps-model
```

Fichier produit :

- `outputs/diablo4-experimental-dps-model/experimental-dps-model.json`

Principe :

- le modele strict reste inchange
- seules les suggestions d'audit de priorite choisie sont promues
- par defaut, seules les suggestions `high` sont incluses
- chaque formule promue garde une trace `experimental: true`

Resultat avec `--include-priority high` :

- formules promues : `13`
- DPS total strict placeholder : `1336410.0000000002`
- DPS total experimental placeholder : `4412005.833333333`
- delta : `3075595.833333333`
- delta relatif : `230.1386425822414 %`

Assets les plus impactes :

- asset `1461593` : `1113210.0000000002` -> `2504722.5000000005`
- asset `2302974` : `54000` -> `1101600`
- asset `1663210` : `163200` -> `757350`
- asset `493422` : `6000` -> `48333.33333333332`

Important :

Ce mode est volontairement optimiste. Il sert a detecter quelles hypotheses changent fortement le DPS, pas a produire une valeur finale fiable. Certaines valeurs comme `0.5` peuvent etre normalisees en multiplicateur `1.5` par le prototype, ce qui peut surestimer certains effets si la formule represente autre chose qu'un multiplicateur de degats.

## Comparaison strict vs experimental

Un rapport de comparaison a ete ajoute pour expliquer l'ecart entre le modele strict et le modele experimental.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js compare-dps-models `
  --file outputs/diablo4-minimal-dps-model/minimal-dps-model.json `
  --experimental-file outputs/diablo4-experimental-dps-model/experimental-dps-model.json `
  --out outputs/diablo4-dps-model-comparison
```

Fichier produit :

- `outputs/diablo4-dps-model-comparison/dps-model-comparison.json`

Resultat :

- assets compares : `10`
- assets avec promotions : `5`
- assets avec delta DPS : `4`
- formules promues : `13`
- promotions sans impact DPS : `1`
- asset ayant besoin d'un coefficient de degats : `1953817`

Top delta par asset :

- `1461593` : `+1391512.5000000002` DPS placeholder
- `2302974` : `+1047600` DPS placeholder
- `1663210` : `+594150` DPS placeholder
- `493422` : `+42333.33333333332` DPS placeholder
- `1953817` : `0` DPS, car aucun coefficient de degats n'est encore identifie

Utilite :

Ce rapport transforme l'ecart experimental en liste d'actions. Les assets avec delta fort indiquent les hypotheses de multiplicateurs a verifier en priorite. Les assets avec promotions mais sans delta indiquent qu'il manque d'abord une formule de degats primaire.

## Inspection des gaps DPS

Un inspecteur de gaps DPS a ete ajoute pour les assets qui ont des multiplicateurs candidats mais aucun coefficient de degats primaire.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-dps-gaps `
  --file outputs/diablo4-minimal-dps-model/minimal-dps-model.json `
  --comparison-file outputs/diablo4-dps-model-comparison/dps-model-comparison.json `
  --audit-file outputs/diablo4-dps-role-audit/dps-role-audit.json `
  --out outputs/diablo4-dps-gap-inspection
```

Fichier produit :

- `outputs/diablo4-dps-gap-inspection/dps-gap-inspection.json`

Resultat :

- assets en gap : `1`
- asset concerne : `1953817`
- candidates de coefficient primaire : `5`

Candidates principales pour `1953817` :

1. `SF_10 * SF_12`
   - canonique : `sf:1953817:10 * sf:1953817:12`
   - valeur : `143`
   - priorite : `high`
2. `5 * SF_10`
   - canonique : `5 * sf:1953817:10`
   - valeur : `55`
   - priorite : `high`
3. `4 * SF_10`
   - canonique : `4 * sf:1953817:10`
   - valeur : `44`
   - priorite : `high`
4. `SF_4 * SF_3`
   - canonique : `sf:1953817:4 * sf:1953817:3`
   - valeur : `20`
   - priorite : `high`

Decision :

Ces candidates ne sont pas encore integrees au DPS strict. Elles indiquent ou chercher la formule de degats primaire reelle pour `1953817`. La prochaine validation doit identifier si l'une de ces formules est un coefficient de degats, une duree, un nombre de projectiles, un compteur ou une valeur d'affichage.

## Contexte des candidates de gap

Un inspecteur de contexte a ete ajoute pour resumer les chaines voisines, references externes et bytecode autour des candidates de gap.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-gap-context `
  --gap-file outputs/diablo4-dps-gap-inspection/dps-gap-inspection.json `
  --priority-inspection outputs/diablo4-priority-asset-inspection/priority-asset-inspection.json `
  --out outputs/diablo4-dps-gap-context
```

Fichier produit :

- `outputs/diablo4-dps-gap-context/dps-gap-context.json`

Resultat pour `1953817` :

- candidates analysees : `5`
- candidates probablement degats primaires : `0`
- candidates probablement scaling secondaire / affichage : `4`
- candidates non resolues : `1`

Lecture actuelle :

- `sf:1953817:10 * sf:1953817:12` (`143`) est classe `secondary-scaling-or-display`
- `5 * sf:1953817:10` (`55`) est classe `secondary-scaling-or-display`
- `4 * sf:1953817:10` (`44`) est classe `secondary-scaling-or-display`
- `sf:1953817:4 * sf:1953817:3` (`20`) est classe `secondary-scaling-or-display`
- `0.25 + (sf:1953817:1/sf:1953817:0)` (`2.25`) reste `unresolved`

Raisons :

- ces formules n'utilisent pas `Table(...)`
- elles sont groupees autour de references externes de type bonus/multiplicateur :
  - `PowerTag.SystemsTuningGlobals."Script Formula 0"`
  - `Spiritborn_Spirit_Bonus#spiritborn_eagle_sun_passive_alternate`
  - `Bonus_Percent_Per_Power#Spiritborn_Feather_Spawn`
- le contexte local ressemble davantage a des scalars/bonus/valeurs d'affichage qu'a un coefficient de hit primaire

Decision :

Ne pas promouvoir ces candidates comme degats primaires dans le DPS strict. Pour `1953817`, il faut chercher ailleurs le coefficient de degats primaire ou conclure que cet asset represente un effet de support/spawn/bonus sans hit direct dans ce bloc.

## Inspection des risques de promotion

Un inspecteur de risques a ete ajoute pour les promotions du modele experimental. Il sert a eviter qu'une formule candidate soit comptee dans le DPS strict alors qu'elle ressemble a un doublon, une variante d'upgrade, une valeur d'affichage ou un ratio SF sans metadata.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-promotion-risks `
  --comparison-file outputs/diablo4-dps-model-comparison/dps-model-comparison.json `
  --graphs-file outputs/diablo4-formula-graphs/formula-graphs.json `
  --priority-inspection outputs/diablo4-priority-asset-inspection/priority-asset-inspection.json `
  --out outputs/diablo4-promotion-risk-inspection
```

Fichier produit :

- `outputs/diablo4-promotion-risk-inspection/promotion-risk-inspection.json`

Resultat :

- promotions inspectees : `13`
- risque `high` : `6`
- risque `medium` : `2`
- risque `low` : `5`
- candidates raisonnables pour revue stricte : `1`
- promotions a ne pas integrer pour l'instant : `12`

Candidate raisonnable pour revue stricte :

- asset `493422`
- formule : `0.005 * Table(34,sLevel)`
- valeur : `0.5`
- role experimental : `damage-coefficient`
- raison : utilise `Table(...)`, signal le plus fort actuellement pour un coefficient de degats

Promotions a risque eleve :

- `1461593` : `sf:1461593:0 / sf:1461593:1` et `sf:1461593:0/sf:1461593:1`
  - risque : doublon/equivalence + ratio SF fractionnaire + asset ayant deja plusieurs formules `Table(...)`
- `2302974` : `sf:2302974:1 / 5 * 1.75`
  - risque : valeur fractionnaire normalisee en `1 + value`, probablement overcount
- `1663210` : `2 / sf:1663210:3`, `sf:1663210:6/sf:1663210:7`
  - risque : ratios SF fractionnaires dans un asset ayant deja plusieurs formules `Table(...)`
- `493422` : `sf:493422:3 * (sf:493422:0 / sf:493422:5)`
  - risque : ratio SF pur et valeur fractionnaire

Decision :

Ne pas integrer les 12 promotions a risque dans le DPS strict. La seule candidate a verifier en priorite est `0.005 * Table(34,sLevel)` pour l'asset `493422`, car elle ressemble a un petit coefficient de degats plutot qu'a un multiplicateur ou une valeur d'affichage.

## Mode strict + revue

Un modele `strict-reviewed` a ete ajoute. Il part du DPS strict et n'integre que les promotions marquees `candidate-for-strict-review` par l'inspection des risques.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js build-reviewed-dps-model `
  --file outputs/diablo4-minimal-dps-model/minimal-dps-model.json `
  --promotion-risk-file outputs/diablo4-promotion-risk-inspection/promotion-risk-inspection.json `
  --out outputs/diablo4-reviewed-dps-model
```

Fichier produit :

- `outputs/diablo4-reviewed-dps-model/reviewed-dps-model.json`

Resultat :

- promotions integrees : `1`
- DPS total strict placeholder : `1336410.0000000002`
- DPS total strict-reviewed placeholder : `1336410.0000000002`
- delta : `0`

Explication :

La promotion integree est :

- asset `493422`
- formule : `0.005 * Table(34,sLevel)`
- valeur : `0.5`
- role : `damage-coefficient`

Elle ne change pas le DPS total car l'asset `493422` possede deja un coefficient de degats plus eleve :

- `.5 * Table(34,sLevel)` = `50`

Le modele DPS actuel utilise le plus grand coefficient de degats primaire par asset. Ajouter le coefficient `0.5` ne modifie donc pas `primaryDamageCoefficient`, qui reste `50`.

Decision :

Le mode `strict-reviewed` valide que la seule promotion faible risque n'introduit pas de hausse artificielle. Les gros gains du mode experimental restent donc exclus du DPS strict.

## Audit des composants de degats

Un audit a ete ajoute pour verifier la strategie actuelle du modele DPS : choisir le plus grand coefficient de degats par asset avec `max(...)`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js audit-damage-components `
  --file outputs/diablo4-reviewed-dps-model/reviewed-dps-model.json `
  --out outputs/diablo4-damage-component-audit
```

Fichier produit :

- `outputs/diablo4-damage-component-audit/damage-component-audit.json`

Resultat :

- assets avec termes de degats : `4`
- assets avec plusieurs termes de degats : `4`
- termes de degats masques par `max(...)` : `8`
- assets ou `sum` differerait de `max` : `4`

Recommandations :

- `max-likely-safe` : `2`
- `dedupe-or-branch` : `1`
- `multi-hit-review` : `1`

Details par asset :

- `2302974`
  - coefficients : `450`, `400`, `150`
  - `max` actuel : `450`
  - `sum` theorique : `1000`
  - recommandation : `multi-hit-review`
  - interpretation : peut representer des hits distincts, rangs, upgrades ou branches
- `1663210`
  - coefficients : `1360`, `1190`, `1190`, `450`, `30`
  - `max` actuel : `1360`
  - `sum` theorique : `4220`
  - recommandation : `dedupe-or-branch`
  - interpretation : contient au moins deux formules equivalentes `1190`, donc ne pas sommer sans comprendre les branches
- `1461593`
  - coefficients : `1500`, `10`
  - recommandation : `max-likely-safe`
  - interpretation : le petit coefficient cache semble secondaire ou affichage
- `493422`
  - coefficients : `50`, `0.5`
  - recommandation : `max-likely-safe`
  - interpretation : la promotion revue `0.5` est trop petite pour changer le coefficient primaire

Decision :

Conserver `max(...)` comme comportement strict par defaut. La prochaine amelioration du modele DPS doit porter sur `2302974`, car c'est le meilleur candidat pour decider si plusieurs coefficients doivent etre sommes, branches ou traites comme hits separes.

## Contexte des composants de degats

Un inspecteur de contexte a ete ajoute pour les coefficients de degats. Il lit le payload source BLTE et resume les chaines voisines autour des formules `Table(...)`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-damage-context `
  --file outputs/diablo4-damage-component-audit/damage-component-audit.json `
  --graphs-file outputs/diablo4-formula-graphs/formula-graphs.json `
  --asset-ids 2302974 `
  --out outputs/diablo4-damage-context-inspection
```

Fichier produit :

- `outputs/diablo4-damage-context-inspection/damage-context-inspection.json`

Resultat pour `2302974` :

- termes de degats : `3`
- coefficients : `450`, `400`, `150`
- formules :
  - `4.5 * Table(34,sLevel)`
  - `4 * Table(34,sLevel)`
  - `1.5 * Table(34,sLevel)`
- classification contexte : `branch-or-rank-candidate`
- confiance : `medium`

Raisons :

- les trois formules utilisent la meme table `Table(34,sLevel)`
- les trois formules sont stockees proches les unes des autres
- elles sont voisines de formules `SF_1 * 2`, `SF_1 * 2 * 0.75`, et `Mod.UpgradeC ? 0 : (...)`
- cela ressemble plus a des rangs, branches ou variantes qu'a trois hits toujours actifs

Decision :

Ne pas passer `2302974` en somme automatique `450 + 400 + 150`. Garder `max = 450` dans le DPS strict jusqu'a identification des flags/metadata qui disent quelle branche est active.

## Controle des branches de degats

Un inspecteur de controles de branche a ete ajoute. Il ne relit pas les fichiers du jeu : il croise le rapport de contexte des degats avec le graphe de formules deja extrait, puis cherche les formules proches qui ressemblent a des controles d'upgrade, d'etat, de scaling ou de dependance externe.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-branch-controls `
  --damage-context outputs/diablo4-damage-context-inspection/damage-context-inspection.json `
  --graphs-file outputs/diablo4-formula-graphs/formula-graphs.json `
  --asset-ids 2302974 `
  --out outputs/diablo4-branch-control-inspection
```

Fichier produit :

- `outputs/diablo4-branch-control-inspection/branch-control-inspection.json`

Resultat pour `2302974` :

- cluster de degats : offsets `13448` a `13744`, span `296`
- termes de degats : `3`
- controles proches detectes : `7`
- asset avec controle d'upgrade explicite : `1`
- recommandation : `keep-max-until-branch-state-modeled`

Controles principaux :

- `formula:3` : `SF_1 * 2`, controle de scaling local
- `formula:4` : `SF_1 * 2 * 0.75`, variante de scaling local
- `formula:5` : `Mod.UpgradeC ? 0 : (Mod.UpgradeB ? SF_19 : SF_11)`, controle de branche explicite avec flags `UpgradeB` et `UpgradeC`
- `formula:6` : `(SF_1 + SF_12) * PowerTag.Paladin_Oath_Zealot."Script Formula 2"`, scaling externe lie a un autre PowerTag
- `formula:7` : `1+CC_Duration_Bonus_Percent_Per_Power#Paladin_Trinity_Cast_3`, scaling externe par hash/ref

Conclusion :

Pour `2302974`, l'hypothese "trois coefficients a sommer" devient moins probable. La presence de `Mod.UpgradeB` et `Mod.UpgradeC` pres des coefficients indique qu'il faut modeliser l'etat du build avant de choisir la formule active. Le moteur DPS doit donc evoluer vers un modele de branches explicites :

- entree utilisateur ou profil de build : upgrades actifs, rang de competence, aspects/uniques, tags actifs
- evaluation conditionnelle : choisir la branche correspondant aux flags actifs
- fallback strict : garder `max(...)` quand la branche n'est pas encore resolue

## Gabarit d'etat de build

Un exporteur de gabarit d'etat de build a ete ajoute. Son role est de transformer les controles detectes en entrees editables par le futur site : flags d'upgrade, valeurs `SF`, refs externes, scenarios par defaut.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js export-build-state-template `
  --branch-controls outputs/diablo4-branch-control-inspection/branch-control-inspection.json `
  --asset-ids 2302974 `
  --out outputs/diablo4-build-state-template
```

Fichier produit :

- `outputs/diablo4-build-state-template/build-state-template.json`

Resultat :

- assets : `1`
- flags de build : `2`
- valeurs locales `SF` : `6`
- valeurs externes : `2`
- assets prets pour mapping de branche : `1`

Flags detectes :

- `Mod.UpgradeB`
- `Mod.UpgradeC`

Scenarios crees automatiquement :

- `baseline-no-upgrades` : `UpgradeB = false`, `UpgradeC = false`
- `mod-upgradeb-enabled` : `UpgradeB = true`, `UpgradeC = false`
- `mod-upgradec-enabled` : `UpgradeB = false`, `UpgradeC = true`

Valeurs externes a resoudre ensuite :

- `PowerTag.Paladin_Oath_Zealot.Script Formula 2`
- `CC_Duration_Bonus_Percent_Per_Power#Paladin_Trinity_Cast_3`

Decision :

Le futur site devra stocker un profil de build explicite. Pour chaque competence ou pouvoir, le moteur pourra lire ces flags et valeurs, puis evaluer les formules conditionnelles avec le bon contexte. Tant que le mapping exact entre chaque branche et chaque coefficient de degats n'est pas connu, le moteur conserve le fallback strict `max-damage-coefficient`.

## Evaluation des scenarios de build

Un evaluateur de scenarios a ete ajoute. Il lit le gabarit d'etat de build, applique chaque scenario de flags, puis resout les conditions simples de type `Mod.X ? A : B`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js evaluate-build-state-scenarios `
  --build-state outputs/diablo4-build-state-template/build-state-template.json `
  --out outputs/diablo4-build-state-scenarios
```

Fichier produit :

- `outputs/diablo4-build-state-scenarios/build-state-scenarios.json`

Resultat :

- scenarios evalues : `3`
- controles evalues : `21`
- controles resolus completement : `1`
- controles partiellement resolus : `20`
- assets avec selecteur de branche resolu mais branche de degats non mappee : `3`

Resolution du controle principal :

- scenario `baseline-no-upgrades`
  - `UpgradeB = false`, `UpgradeC = false`
  - formule : `Mod.UpgradeC ? 0 : (Mod.UpgradeB ? SF_19 : SF_11)`
  - branche selectionnee : `SF_11`
  - statut : partiellement resolu, car `SF_11` doit encore etre mappe
- scenario `mod-upgradeb-enabled`
  - `UpgradeB = true`, `UpgradeC = false`
  - branche selectionnee : `SF_19`
  - statut : partiellement resolu, car `SF_19` doit encore etre mappe
- scenario `mod-upgradec-enabled`
  - `UpgradeB = false`, `UpgradeC = true`
  - branche selectionnee : `0`
  - statut : resolu

Decision :

Le moteur commence a savoir repondre a la question "quelle branche logique est active pour ce build ?". La prochaine etape technique est de relier les sorties `SF_11` et `SF_19` aux coefficients de degats concrets ou aux definitions SF locales. Quand ce mapping sera disponible, le DPS pourra remplacer le fallback `max` par une selection conditionnelle explicite.

## Mapping des SF selectionnes par scenario

Un inspecteur de mapping `SF` a ete ajoute. Il croise l'evaluation des scenarios avec les candidats `SF` locaux deja extraits.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-scenario-sf-mappings `
  --scenarios-file outputs/diablo4-build-state-scenarios/build-state-scenarios.json `
  --sf-candidates outputs/diablo4-sf-candidates/sf-candidates.json `
  --asset-ids 2302974 `
  --out outputs/diablo4-scenario-sf-mappings
```

Fichier produit :

- `outputs/diablo4-scenario-sf-mappings/scenario-sf-mappings.json`

Resultat :

- refs `SF` selectionnees par les scenarios : `2`
- refs selectionnees avec symbole local trouve : `1`
- refs selectionnees sans symbole local : `1`
- refs `SF` requises au total par les controles proches : `6`
- refs requises avec symbole local trouve : `2`
- refs requises sans symbole local : `4`

Details :

- scenario `baseline-no-upgrades`
  - branche selectionnee : `SF_11`
  - statut : symbole local manquant
  - conclusion : il faut resoudre `SF_11` via bytecode ou contexte payload plus large
- scenario `mod-upgradeb-enabled`
  - branche selectionnee : `SF_19`
  - statut : symbole local trouve
  - offset local : `11608`
  - distance au coefficient de degats le plus proche : `1840` octets
  - confiance : basse, car le symbole est loin du cluster de degats
- scenario `mod-upgradec-enabled`
  - branche selectionnee : `0`
  - aucun mapping `SF` necessaire

Decision :

La priorite suivante n'est pas encore de brancher le DPS final. Il faut d'abord resoudre le `SF_11` manquant, car c'est la branche du scenario de base. Ensuite, inspecter la fenetre structurelle autour de `SF_19` pour savoir s'il pointe vers une variante de degats, un upgrade, ou un parametre secondaire.

## Inspection bytecode des SF selectionnes

Un inspecteur bytecode cible a ete ajoute pour les `SF` selectionnes par scenario. Il decode le payload de l'asset, cherche les occurrences ASCII et les occurrences bytecode probables selon l'encodage `opcode 5 + raw`, avec `raw = sfIndex + 6`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-scenario-sf-bytecode `
  --file outputs/diablo4-scenario-sf-mappings/scenario-sf-mappings.json `
  --out outputs/diablo4-scenario-sf-bytecode
```

Fichier produit :

- `outputs/diablo4-scenario-sf-bytecode/scenario-sf-bytecode.json`

Resultat :

- refs `SF` selectionnees : `2`
- refs avec occurrence ASCII : `2`
- refs avec occurrence bytecode : `2`
- refs sans symbole standalone mais avec bytecode : `1`

Details :

- `SF_11`
  - scenario : `baseline-no-upgrades`
  - symbole local standalone : manquant
  - occurrence ASCII : offset `14119`, dans le texte de la formule
  - occurrence bytecode : offset `14196`
  - branche de degats la plus proche du bytecode : `formula:2`, coefficient `400`, distance `452` octets
  - interpretation : `inline-bytecode-ref-without-standalone-symbol`
- `SF_19`
  - scenario : `mod-upgradeb-enabled`
  - symbole local standalone : trouve a l'offset `11608`
  - occurrence bytecode standalone : offset `11616`
  - occurrence bytecode dans le selecteur : offset `14176`
  - branche de degats la plus proche du bytecode du selecteur : `formula:2`, coefficient `400`, distance `432` octets
  - interpretation : `symbol-and-selector-bytecode-ref`

Decision :

`SF_11` n'est plus un vrai "manquant" au sens du moteur : il est bien present dans le bytecode de la formule de selection. Il faut maintenant distinguer deux notions :

- symbole standalone local : definition ou metadata exploitable directement
- reference inline de selecteur : sortie logique utilisee par une formule conditionnelle

La prochaine etape est de mapper les sorties du selecteur (`SF_11`, `SF_19`, `0`) vers les coefficients de degats proches (`450`, `400`, `150`) en analysant l'ordre structurel du bloc, sans supposer automatiquement que la branche la plus proche est la bonne.

## Inference selecteur vers branches de degats

Un rapport d'inference a ete ajoute pour tester si les sorties du selecteur peuvent etre reliees aux coefficients de degats. Le rapport applique volontairement des garde-fous : une hypothese bloquee ne doit pas modifier le DPS.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js infer-scenario-damage-branches `
  --file outputs/diablo4-scenario-sf-bytecode/scenario-sf-bytecode.json `
  --scenarios-file outputs/diablo4-build-state-scenarios/build-state-scenarios.json `
  --out outputs/diablo4-scenario-damage-branches
```

Fichier produit :

- `outputs/diablo4-scenario-damage-branches/scenario-damage-branches.json`

Resultat :

- mappings de scenarios : `3`
- mappings haute confiance : `1`
- mappings basse confiance : `2`
- mappings bloques : `2`
- recommandation asset : `keep-strict-max-fallback`

Details :

- scenario `baseline-no-upgrades`
  - sortie selecteur : `SF_11`
  - candidat par proximite : `formula:2`, coefficient `400`
  - statut : bloque
  - raison : plusieurs sorties du selecteur pointent vers la meme branche la plus proche
- scenario `mod-upgradeb-enabled`
  - sortie selecteur : `SF_19`
  - candidat par proximite : `formula:2`, coefficient `400`
  - statut : bloque
  - raison : collision avec `SF_11`
- scenario `mod-upgradec-enabled`
  - sortie selecteur : `0`
  - candidat : sortie zero
  - statut : candidat haute confiance, mais seulement pour dire que le selecteur renvoie zero

Alternatives de distance :

- pour `SF_11` :
  - `400` a distance `452`
  - `150` a distance `576`
  - `450` a distance `748`
- pour `SF_19` :
  - `400` a distance `432`
  - `150` a distance `556`
  - `450` a distance `728`

Decision :

Ne pas activer le DPS conditionnel pour `2302974` a ce stade. La proximite seule donnerait le meme coefficient `400` pour `SF_11` et `SF_19`, ce qui indique que l'on observe probablement la position du selecteur dans le bloc plutot que la vraie propriete semantique de chaque branche. Le fallback strict `max-damage-coefficient = 450` reste le comportement correct.

## Modele DPS avec garde-fous de branches

Un modele DPS enrichi par les branches a ete ajoute. Il lit le modele DPS revu et les hypotheses de branches, mais n'applique que les scenarios juges suffisamment surs. Le total global reste strict.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js build-branch-aware-dps-model `
  --file outputs/diablo4-reviewed-dps-model/reviewed-dps-model.json `
  --scenario-damage-branches outputs/diablo4-scenario-damage-branches/scenario-damage-branches.json `
  --out outputs/diablo4-branch-aware-dps-model
```

Fichier produit :

- `outputs/diablo4-branch-aware-dps-model/branch-aware-dps-model.json`

Resultat global :

- DPS strict de base : `1336410.0000000002`
- DPS branch-aware global : `1336410.0000000002`
- delta global : `0`
- assets avec branches : `1`
- estimations de scenarios : `3`
- estimations appliquees en scenario : `1`
- estimations en fallback strict : `2`

Resultat pour `2302974` :

- statut : `strict-fallback-required`
- coefficient strict : `450`
- DPS strict : `54000`
- collision detectee : `SF_11` et `SF_19` pointent tous deux vers `formula:2` si on se base uniquement sur la proximite

Scenarios :

- `baseline-no-upgrades`
  - sortie : `SF_11`
  - decision : `strict-fallback`
  - coefficient conserve : `450`
  - DPS conserve : `54000`
- `mod-upgradeb-enabled`
  - sortie : `SF_19`
  - decision : `strict-fallback`
  - coefficient conserve : `450`
  - DPS conserve : `54000`
- `mod-upgradec-enabled`
  - sortie : `0`
  - decision : `apply-scenario-candidate`
  - coefficient scenario : `0`
  - DPS scenario : `0`
  - delta scenario : `-54000`

Decision :

Le moteur peut maintenant transporter des estimations par scenario sans contaminer le DPS strict. C'est une brique importante pour le futur site : l'interface pourra afficher les hypotheses, les branches bloquees et les scenarios resolus, tout en gardant un DPS global conservateur.

## Audit global des signaux de branches

Un audit global des signaux de branches a ete ajoute. Il parcourt tous les graphes de formules extraits et les croise avec le modele DPS revu pour prioriser les assets a inspecter.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js audit-global-branch-signals `
  --graphs-file outputs/diablo4-formula-graphs/formula-graphs.json `
  --file outputs/diablo4-reviewed-dps-model/reviewed-dps-model.json `
  --out outputs/diablo4-global-branch-audit
```

Fichier produit :

- `outputs/diablo4-global-branch-audit/global-branch-audit.json`

Resultat :

- assets analyses : `19`
- assets avec signaux de branches : `10`
- assets avec degats + signaux de branches : `4`
- assets avec flags `Mod.*` explicites : `1`
- assets avec ternaires : `2`
- assets avec references externes : `4`

Priorites :

- `high` : `1`
- `medium` : `3`
- `low` : `6`
- `none` : `9`

Top priorite :

- `2302974`
  - score : `22`, priorite `high`
  - raisons : degats, coefficients multiples, flags `UpgradeB/UpgradeC`, ternaire, dependances `SF`, references externes, impact DPS
  - recommandation : `run-branch-pipeline`
  - statut : pipeline deja execute, mais mapping de degats bloque par collision
- `1663210`
  - score : `11`, priorite `medium`
  - raisons : degats, formules conditionnelles, dependances `SF`, impact DPS
  - DPS prototype : `163200`
  - recommandation : `inspect-conditional-damage`
  - prochaine cible technique logique
- `1461593`
  - score : `10`, priorite `medium`
  - DPS prototype : `1113210.0000000002`
  - signaux : `SF` + references externes
  - recommandation : cataloguer les dependances d'etat de build
- `493422`
  - score : `8`, priorite `medium`
  - DPS prototype : `6000`
  - signaux : dependances `SF`
  - recommandation : cataloguer les dependances d'etat de build

Decision :

La prochaine inspection approfondie doit cibler `1663210`. Contrairement a `2302974`, il n'a pas de flags `Mod.*` explicites, mais il combine degats, ternaires et nombreuses dependances `SF`. C'est le meilleur prochain cas pour generaliser le pipeline au-dela des upgrades simples.

## Inspection des degats conditionnels de `1663210`

Un inspecteur dedie aux degats conditionnels a ete ajoute. Il cible les formules ternaires de type `SF == 0 ? base : base * (1 + SF)` et les relie au modele DPS et au contexte prioritaire deja extrait.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-conditional-damage `
  --graphs-file outputs/diablo4-formula-graphs/formula-graphs.json `
  --file outputs/diablo4-reviewed-dps-model/reviewed-dps-model.json `
  --priority-inspection outputs/diablo4-priority-asset-inspection/priority-asset-inspection.json `
  --asset-ids 1663210 `
  --out outputs/diablo4-conditional-damage-inspection
```

Fichier produit :

- `outputs/diablo4-conditional-damage-inspection/conditional-damage-inspection.json`

Resultat :

- assets inspectes : `1`
- formules de degats conditionnels : `3`
- expressions conditionnelles dupliquees : `2`
- priorite : `high`
- recommandation : `dedupe-conditional-damage-before-branching`

Formules conditionnelles detectees :

- `formula:6`
  - condition : `SF_33 == 0`
  - base : `0.35 * Table(34, sLevel)`
  - branche boostee : `0.35 * Table(34, sLevel) * (1 + SF_32)`
  - valeur modele : `1190`
  - duplicat : oui, groupe de taille `2`
- `formula:7`
  - meme expression que `formula:6`
  - valeur modele : `1190`
  - duplicat : oui, groupe de taille `2`
- `formula:8`
  - condition : `SF_33 == 0`
  - base : `0.4 * Table(34, sLevel)`
  - branche boostee : `0.4 * Table(34, sLevel) * (1 + SF_32)`
  - valeur modele : `1360`
  - duplicat : non

Contexte DPS :

- DPS actuel de `1663210` : `163200`
- coefficient primaire strict : `1360`
- termes de degats dedupes : `4`
- references manquantes dans l'inspection prioritaire : `12`
- fenetres structurelles deja disponibles : `44`

Formules utilitaires liees :

- `SF_6/SF_7` : ratio
- `SF_11 * SF_9 * 0.5` : multiplicateur SF
- `SF_21/SF_19` : ratio
- `(1-POW(1-SF_29/100,1/(SF_9*2)))*100` : probabilite ou uptime
- `min(SF_34, ... * SF_31)` : cap ou borne
- `SF_13 * 4` : multiplicateur SF

Decision :

Pour `1663210`, la prochaine action n'est pas encore de creer un DPS conditionnel. Il faut d'abord dedupliquer ou expliquer les deux formules identiques `0.35 * Table(...)`, puis seulement construire des scenarios autour de `SF_33` et `SF_32`. Le moteur strict reste donc correct : il conserve le coefficient maximum `1360`.

## Deduplication des degats conditionnels de `1663210`

Deux nouvelles etapes ont ete ajoutees pour transformer l'observation precedente en garde-fou exploitable par les audits.

Commande de detection des duplicats :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-conditional-damage-dedupe `
  --file outputs/diablo4-conditional-damage-inspection/conditional-damage-inspection.json `
  --out outputs/diablo4-conditional-damage-dedupe
```

Fichier produit :

- `outputs/diablo4-conditional-damage-dedupe/conditional-damage-dedupe.json`

Resultat :

- groupes dupliques : `1`
- formules dupliquees : `2`
- groupes dedupliquables sans changer le DPS strict : `1`
- groupes demandant une revue d'ownership/rang/variante : `0`
- groupes qui changeraient le DPS strict : `0`
- recommandation : `dedupe-for-overcount-prevention`

Groupe detecte :

- expression normalisee : `(sf_33==0)?(0.35*table(34,slevel)):(0.35*table(34,slevel)*(1+(sf_32)))`
- formules : `formula:6` et `formula:7`
- valeur modele : `1190`
- coefficient : `0.35`
- offsets string : `17732`, `18004`
- offsets bytecode : `17816`, `18088`
- impact strict : aucun, car le coefficient primaire strict de l'asset reste `1360`

Commande d'audit de composition apres deduplication :

```powershell
node work/diablo4-data-exporter/d4export.js audit-deduped-damage-composition `
  --file outputs/diablo4-reviewed-dps-model/reviewed-dps-model.json `
  --conditional-dedupe outputs/diablo4-conditional-damage-dedupe/conditional-damage-dedupe.json `
  --out outputs/diablo4-deduped-damage-composition-audit
```

Fichier produit :

- `outputs/diablo4-deduped-damage-composition-audit/deduped-damage-composition-audit.json`

Resultat global :

- assets audites : `4`
- assets avec duplicats retires : `1`
- termes dupliques retires : `1`
- coefficient somme brut : `6780.5`
- coefficient somme deduplique : `5590.5`
- coefficient retire : `1190`
- assets ou le DPS strict changerait : `0`

Impact sur `1663210` :

- somme brute des coefficients : `4220`
- somme dedupliquee : `3030`
- coefficient retire : `1190`
- terme retire : `formula:7`
- termes conserves : `formula:8`, `formula:6`, `formula:3`, `formula:10`
- coefficient primaire strict : `1360`
- DPS somme brut theorique : `506400`
- DPS somme deduplique theorique : `363600`
- recommandation : `dedupe-sum-audit-only`

Decision :

La deduplication est maintenant utilisable pour les audits de type somme, afin d'eviter un double comptage evident. Elle ne doit pas encore modifier le DPS strict global, car le modele strict selectionne deja le maximum `1360` et non la somme brute. La prochaine etape logique est de construire des scenarios locaux pour `SF_33` et `SF_32` sur `1663210`, en s'appuyant sur cette composition dedupliquee.

## Scenarios conditionnels `SF_33/SF_32` pour `1663210`

Un generateur de scenarios locaux a ete ajoute pour evaluer la branche conditionnelle detectee dans les formules de degats de `1663210`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js build-conditional-sf-scenarios `
  --file outputs/diablo4-conditional-damage-inspection/conditional-damage-inspection.json `
  --deduped-composition outputs/diablo4-deduped-damage-composition-audit/deduped-damage-composition-audit.json `
  --asset-ids 1663210 `
  --out outputs/diablo4-conditional-sf-scenarios
```

Fichier produit :

- `outputs/diablo4-conditional-sf-scenarios/conditional-sf-scenarios.json`

Hypotheses :

- `SF_33 = 0` selectionne la branche de base
- `SF_33 != 0` selectionne la branche boostee
- `SF_32` est applique comme multiplicateur additionnel : `coefficient * Table(...) * (1 + SF_32)`
- la valeur de `Table(34,sLevel)` est inferee depuis les valeurs deja evaluees : `3400`
- `formula:7` reste retiree des sommes, car elle est le duplicat de `formula:6`

Resultat :

- assets : `1`
- scenarios : `5`
- scenarios au-dessus du strict : `3`
- scenarios sous le strict : `0`
- DPS scenario maximum : `244800`

Scenarios :

| Scenario | SF_33 | SF_32 | Coefficient primaire | Somme dedupliquee | DPS estime | Delta DPS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Base | `0` | `0` | `1360` | `3030` | `163200` | `0` |
| Actif sans scaling | `1` | `0` | `1360` | `3030` | `163200` | `0` |
| Actif +10% | `1` | `0.1` | `1496` | `3285` | `179520` | `+16320` |
| Actif +30% | `1` | `0.3` | `1768` | `3795` | `212160` | `+48960` |
| Actif +50% | `1` | `0.5` | `2040` | `4305` | `244800` | `+81600` |

Decision :

Ces scenarios montrent que `SF_32` peut augmenter le DPS strict de facon lineaire si la branche `SF_33 != 0` est active. En revanche, ce n'est pas encore une preuve de DPS reel : il faut identifier la source exacte de `SF_32`, le declencheur de `SF_33`, et leur uptime. Le prochain verrou technique est donc de retrouver, dans les donnees extraites, les formules ou metadata qui alimentent `sf:1663210:32` et `sf:1663210:33`.

## Inspection des sources `SF_32/SF_33` de `1663210`

Un inspecteur dedie aux sources des slots conditionnels a ete ajoute. Il croise :

- l'inspection des degats conditionnels
- l'inspection profonde de l'asset prioritaire
- l'analyse d'usage des `SF`
- les candidats de symboles `SF`

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-conditional-sf-sources `
  --file outputs/diablo4-conditional-damage-inspection/conditional-damage-inspection.json `
  --priority-inspection outputs/diablo4-priority-asset-inspection/priority-asset-inspection.json `
  --sf-usage outputs/diablo4-sf-usage/sf-usage-analysis.json `
  --sf-candidates outputs/diablo4-sf-candidates/sf-candidates.json `
  --asset-ids 1663210 `
  --out outputs/diablo4-conditional-sf-source-inspection
```

Fichier produit :

- `outputs/diablo4-conditional-sf-source-inspection/conditional-sf-source-inspection.json`

Resultat :

- assets : `1`
- slots inspectes : `2`
- slots sans symbole local : `2`
- slots visibles uniquement via formules/bytecode : `2`
- recommandations :
  - `search-trigger-metadata` : `1`
  - `search-scaling-value-source` : `1`

Details :

- `sf:1663210:33`
  - role : condition de branche
  - score prioritaire : `12`
  - statut symbole local : absent
  - occurrences ASCII : `3`, toutes dans les formules conditionnelles
  - occurrences bytecode : `3`
  - bytecode : raw `39`, interprete comme `SF_33`
  - recommandation : chercher la metadata ou formule qui active le trigger

- `sf:1663210:32`
  - role : scaling de branche boostee
  - score prioritaire : `9`
  - statut symbole local : absent
  - occurrences ASCII : `3`, toutes dans les formules conditionnelles
  - occurrences bytecode : `3`
  - bytecode : raw `38`, interprete comme `SF_32`
  - recommandation : chercher la source de valeur et l'uptime du scaling

Decision :

Les slots `SF_32` et `SF_33` sont confirmes comme valides dans les formules et dans le bytecode compile, mais aucune definition locale autonome n'est visible dans l'extraction actuelle. On ne doit donc pas promouvoir les scenarios boostes en DPS reel. La prochaine etape doit chercher les metadata externes proches de `Spiritborn_Talent_Ultimate_2`, `SystemsTuningGlobals`, `Spiritborn_Centipede_Ultimate` et `Mod.SoilRuler_B`, car ce sont les references proches de la zone ou ces formules apparaissent.

## Metadata externes candidates pour `SF_32/SF_33`

Un inspecteur de metadata externes candidates a ete ajoute. Il part de l'inspection des sources `SF_32/SF_33` et du rapport de recherche des cibles externes, puis classe les chaines proches des formules conditionnelles.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-conditional-external-metadata `
  --file outputs/diablo4-conditional-sf-source-inspection/conditional-sf-source-inspection.json `
  --external-targets outputs/diablo4-external-target-search/external-target-search.json `
  --external-refs outputs/diablo4-external-references/external-references.json `
  --asset-ids 1663210 `
  --out outputs/diablo4-conditional-external-metadata-inspection
```

Fichier produit :

- `outputs/diablo4-conditional-external-metadata-inspection/conditional-external-metadata-inspection.json`

Resultat :

- assets : `1`
- candidats uniques : `8`
- candidats trigger : `1`
- candidats scaling : `1`
- candidats haute confiance : `1`
- recommandation asset : `inspect-trigger-and-scaling-candidates`

Candidats principaux :

| Candidat | Offset | Distance formule | Role probable | Confiance |
| --- | ---: | ---: | --- | --- |
| `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` | `18948` | `624` | source de scaling `SF_32` | haute |
| `Mod.SoilRuler_B` | `17444` | `288` | trigger possible `SF_33` | moyenne |
| `PowerTag.SystemsTuningGlobals."Script Formula 0"` | `17484` | `248` | contexte tuning global | moyenne |
| `PowerTag.Spiritborn_Talent_Ultimate_2."Script Formula 1"` | `18704` | `380` | lien formule de competence | moyenne |
| `PowerTag.Spiritborn_Talent_Ultimate_2."Script Formula 0"` | `18788` | `464` | lien formule de competence | moyenne |

Decision :

On a maintenant une hypothese exploitable :

- `SF_33` est probablement controle par un etat/modificateur proche de `Mod.SoilRuler_B`
- `SF_32` est probablement lie au bonus `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
- `Spiritborn_Talent_Ultimate_2` semble etre le proprietaire gameplay des formules proches

La prochaine etape ne doit pas encore appliquer ces valeurs au DPS reel. Elle doit chercher la valeur effective du bonus `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` et relier `Mod.SoilRuler_B` a un etat de build ou une upgrade. C'est ce lien qui permettra de transformer les scenarios `SF_32/SF_33` en conditions de build exploitables par l'optimiseur.

## Inspection des valeurs autour des metadata candidates

Un inspecteur de valeurs voisines a ete ajoute. Il ne cherche pas a deviner une valeur par proximite brute : il classe les voisins en litteraux numeriques, formules de table, formules d'uptime/probabilite, refs `PowerTag`, refs hash et contexte.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-conditional-metadata-values `
  --file outputs/diablo4-conditional-external-metadata-inspection/conditional-external-metadata-inspection.json `
  --external-targets outputs/diablo4-external-target-search/external-target-search.json `
  --asset-ids 1663210 `
  --out outputs/diablo4-conditional-metadata-value-inspection
```

Fichier produit :

- `outputs/diablo4-conditional-metadata-value-inspection/conditional-metadata-value-inspection.json`

Resultat :

- assets : `1`
- candidats inspectes : `4`
- candidats avec voisin numerique direct : `1`
- candidats avec voisins de type formule : `3`
- recommandations :
  - `decode-sf32-external-target` : `1`
  - `map-sf33-trigger-to-build-state` : `1`
  - `review-skill-script-neighborhood` : `2`

Constats :

- `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
  - role : source probable de scaling `SF_32`
  - voisins proches :
    - `0.3 * Table(34, sLevel)` a `-76`
    - `(1-POW(1-SF_28/100,1/2))*100` a `+96`
    - `(1-POW(1-SF_29/100,1/(SF_9*2)))*100` a `+228`
    - `SF_21/SF_19` a `-352`
    - `min(SF_34, ... * SF_31)` a `+404`
  - decision : aucune valeur directe suffisamment prouvee ; il faut decoder la cible externe du bonus

- `Mod.SoilRuler_B`
  - role : trigger probable de `SF_33`
  - voisin numerique `0.15` a `-112`
  - voisin `PowerTag.SystemsTuningGlobals."Script Formula 0"` a `+40`
  - decision : `0.15` est seulement un voisin faible, pas une preuve de valeur ; il faut mapper le mod a un etat de build

- `PowerTag.Spiritborn_Talent_Ultimate_2."Script Formula 1"` et `Script Formula 0`
  - role : contexte de propriete des formules
  - voisins : `SF_21/SF_19`, `0.3 * Table(34,sLevel)`, formules `POW(...)`
  - decision : utile pour rattacher les formules a la competence, pas encore suffisant pour calculer l'uptime

Decision :

Le verrou est maintenant bien isole :

- pour `SF_32`, la bonne cible est probablement `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`, mais la valeur effective n'est pas dans le voisinage direct ; il faut decoder ou retrouver l'asset qui definit ce hash
- pour `SF_33`, `Mod.SoilRuler_B` est le meilleur candidat de trigger, mais il faut encore savoir quelle option de build/upgrade l'active

La prochaine etape doit donc etre une recherche dirigee des definitions de `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` et `Mod.SoilRuler_B`, pas une promotion DPS. Tant que ces deux liens ne sont pas resolus, les scenarios boostes restent des sensibilites locales.

## Recherche des definitions conditionnelles

Un inspecteur de definitions conditionnelles a ete ajoute. Il part des metadata candidates et cherche si les cibles exactes existent ailleurs dans les donnees extraites, afin de distinguer :

- une occurrence source dans l'asset de degats
- une vraie definition externe reutilisable
- une analogie de meme cle, mais sur une autre competence ou un autre pouvoir

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-conditional-definition-search `
  --file outputs/diablo4-conditional-metadata-value-inspection/conditional-metadata-value-inspection.json `
  --external-targets outputs/diablo4-external-target-search/external-target-search.json `
  --asset-ids 1663210 `
  --out outputs/diablo4-conditional-definition-search
```

Fichier produit :

- `outputs/diablo4-conditional-definition-search/conditional-definition-search.json`

Resultat :

- assets : `1`
- cibles inspectees : `2`
- definitions exactes trouvees hors asset source : `0`
- cibles exactes non resolues : `2`
- recommandations :
  - `expand-search-for-sf32-definition` : `1`
  - `map-mod-trigger-from-build-state` : `1`

Cibles :

| Cible | Role | Evaluation | Recommandation |
| --- | --- | --- | --- |
| `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` | source probable de `SF_32` | cible exacte visible seulement dans `assetId 1663210` | elargir la recherche de definition du bonus |
| `Mod.SoilRuler_B` | trigger probable de `SF_33` | cible exacte visible seulement dans `assetId 1663210` | mapper le mod a un etat de build ou une upgrade |

Decision :

Cette etape ferme une fausse piste importante : les sorties actuelles ne contiennent pas encore l'asset de definition autonome pour `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`, ni le mapping complet de `Mod.SoilRuler_B`. Les scenarios boostes `SF_32/SF_33` restent donc des sensibilites locales.

La suite technique doit elargir l'index externe, ou ajouter un mode de recherche plus brut sur les payloads extraits, pour retrouver la definition reelle du bonus `Spiritborn_Centipede_Ultimate`. En parallele, `Mod.SoilRuler_B` doit etre traite comme un flag de build : l'optimiseur devra savoir quelle competence, rune, upgrade, aspect ou passif l'active avant de l'utiliser dans un calcul DPS reel.

## Audit local des artefacts pour les cibles conditionnelles

Une commande d'audit local a ete ajoutee pour verifier rapidement si une nouvelle extraction contient les chaines critiques dans des artefacts source ou seulement dans des rapports derives.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js audit-local-artifact-terms `
  --data-dir outputs `
  --terms "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate,Mod.SoilRuler_B" `
  --max-hits 500 `
  --max-file-mb 50 `
  --out outputs/diablo4-local-artifact-term-audit
```

Fichier produit :

- `outputs/diablo4-local-artifact-term-audit/local-artifact-term-audit.json`

Resultat :

- fichiers scannes : `119`
- fichiers ignores : `0`
- fichiers avec occurrences : `23`
- occurrences totales : `142`
- `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` : `107`
- `Mod.SoilRuler_B` : `35`
- recommandation : `derived-artifacts-only`

Repartition par type :

| Type d'artefact | Occurrences |
| --- | ---: |
| rapports canoniques derives | `5` |
| rapports conditionnels derives | `34` |
| JSON derives generiques | `56` |
| recherche de cibles externes derivee | `26` |
| rapport humain | `21` |

Decision :

Les deux chaines critiques apparaissent dans nos JSON et rapports deja produits, mais pas dans un artefact source de type binaire decode. Cela confirme que la prochaine vraie avance ne consiste pas a relire les memes sorties : il faut soit elargir la recherche `search-external-targets` sur davantage de fichiers `data.xxx`, soit obtenir une extraction locale plus large des payloads BLTE/DEADBEEF. Une fois cette extraction disponible, la commande `audit-local-artifact-terms` servira de controle rapide pour savoir si les definitions exactes ont enfin ete capturees.

## Scan externe par tranches de fichiers `data.xxx`

La commande `search-external-targets` a ete etendue pour permettre un scan progressif des fichiers source :

- `--file-offset <n>` : commence a partir du fichier `data.xxx` numero `n` dans la liste triee
- `--file-limit <n>` : limite la taille de la tranche
- `--file-names data.064,data.065` : force des fichiers precis, sans passer par une tranche

Exemple de scan cible sur les deux cibles bloquees :

```powershell
node work/diablo4-data-exporter/d4export.js search-external-targets `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --external-refs outputs/diablo4-external-references/external-references.json `
  --terms "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate,Mod.SoilRuler_B" `
  --file-offset 64 `
  --file-limit 64 `
  --out outputs/diablo4-external-target-search-offset-064
```

Plan de couverture recommande pour l'installation detectee :

| Tranche | Offset | Limite | Sortie conseillee |
| --- | ---: | ---: | --- |
| deja couverte historiquement | `0` | `64` | `outputs/diablo4-external-target-search` |
| tranche 2 | `64` | `64` | `outputs/diablo4-external-target-search-offset-064` |
| tranche 3 | `128` | `64` | `outputs/diablo4-external-target-search-offset-128` |
| tranche 4 | `192` | `64` | `outputs/diablo4-external-target-search-offset-192` |

Test technique effectue dans le workspace :

```powershell
node work/diablo4-data-exporter/d4export.js search-external-targets `
  --data-dir outputs `
  --external-refs outputs/diablo4-external-references/external-references.json `
  --terms "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate,Mod.SoilRuler_B" `
  --file-offset 64 `
  --file-limit 64 `
  --out outputs/diablo4-external-target-search-empty-offset-test
```

Resultat du test :

- fichiers `data.xxx` selectionnes : `0`, car `outputs` n'est pas le dossier source du jeu
- cibles : `2`
- erreur : aucune
- le JSON produit garde maintenant `fileOffset`, `fileNames` et `selectedFiles`

Decision :

L'outil est pret pour un scan complet par tranches. Le prochain gain de donnees viendra de l'execution de ces tranches sur le vrai dossier `Data\data` de Diablo IV, ou sur une copie locale autorisee de ces fichiers dans le workspace.

## Fusion des scans externes par tranches

Une commande de fusion a ete ajoutee pour reconstruire un index unique a partir de plusieurs sorties `search-external-targets`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js merge-external-target-searches `
  --merge-files outputs/diablo4-external-target-search/external-target-search.json,outputs/diablo4-external-target-search-offset-064/external-target-search.json,outputs/diablo4-external-target-search-offset-128/external-target-search.json,outputs/diablo4-external-target-search-offset-192/external-target-search.json `
  --out outputs/diablo4-external-target-search-merged
```

Fichier produit :

- `outputs/diablo4-external-target-search-merged/external-target-search-merged.json`

Test technique effectue dans le workspace :

```powershell
node work/diablo4-data-exporter/d4export.js merge-external-target-searches `
  --merge-files outputs/diablo4-external-target-search/external-target-search.json,outputs/diablo4-external-target-search-empty-offset-test/external-target-search.json `
  --out outputs/diablo4-external-target-search-merged-test
```

Resultat du test :

- rapports sources : `2`
- fichiers source representes : `64`
- entrees DEADBEEF decodees : `3322`
- entrees avec match : `8`
- groupes de cibles : `19`

La sortie fusionnee a ensuite ete acceptee par l'inspection des definitions conditionnelles :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-conditional-definition-search `
  --file outputs/diablo4-conditional-metadata-value-inspection/conditional-metadata-value-inspection.json `
  --external-targets outputs/diablo4-external-target-search-merged-test/external-target-search-merged.json `
  --asset-ids 1663210 `
  --out outputs/diablo4-conditional-definition-search-merged-test
```

Resultat :

- assets : `1`
- cibles inspectees : `2`
- definitions exactes trouvees hors asset source : `0`
- cibles exactes non resolues : `2`

Decision :

Le pipeline est maintenant pret pour fonctionner en trois temps :

1. scanner les fichiers `data.xxx` par tranches
2. fusionner les sorties de tranches
3. relancer `inspect-conditional-definition-search` sur l'index fusionne

Cette structure evitera de perdre les resultats partiels si une tranche est longue ou si un fichier source pose probleme.

## Execution du scan cible complet sur les fichiers `data.xxx`

Un generateur de plan de scan a ete ajoute pour preparer automatiquement les tranches, la fusion, et un script PowerShell reutilisable.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js plan-external-target-scan `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --external-refs outputs/diablo4-external-references/external-references.json `
  --terms "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate,Mod.SoilRuler_B" `
  --chunk-size 64 `
  --total-files 222 `
  --max-hits 200 `
  --max-decode-mb 128 `
  --out outputs/diablo4-external-target-scan-plan
```

Fichiers produits :

- `outputs/diablo4-external-target-scan-plan/external-target-scan-plan.json`
- `outputs/diablo4-external-target-scan-plan/run-external-target-scan.ps1`

Constat :

- le dossier source etait lisible pendant l'execution
- fichiers `data.xxx` detectes : `205`
- tranches generees : `4`
  - `data.000` a `data.063`
  - `data.064` a `data.127`
  - `data.128` a `data.191`
  - `data.192` a `data.204`

Le script PowerShell n'a pas ete lance directement, car la politique d'execution Windows bloque les fichiers `.ps1`. Les quatre commandes ont donc ete executees directement.

Resultat des tranches :

| Tranche | Fichiers | Entrees decodees | Matches | Groupes |
| --- | ---: | ---: | ---: | ---: |
| offset `0` | `64` | `2664` | `1` | `2` |
| offset `64` | `64` | `263` | `0` | `0` |
| offset `128` | `64` | `2272` | `0` | `0` |
| offset `192` | `13` | `0` | `0` | `0` |

Fusion reelle :

- fichier : `outputs/diablo4-external-target-scan-plan/external-target-search-merged/external-target-search-merged.json`
- rapports sources : `4`
- fichiers source representes : `205`
- entrees DEADBEEF decodees : `5199`
- entrees avec match : `1`
- groupes de cibles : `2`

Resultat des deux cibles :

| Cible | Asset trouve | Fichier | Offset BLTE | Conclusion |
| --- | ---: | --- | ---: | --- |
| `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` | `1663210` | `data.007` | `8265002` | seulement dans l'asset source |
| `Mod.SoilRuler_B` | `1663210` | `data.007` | `8265002` | seulement dans l'asset source |

Inspection conditionnelle relancee sur l'index fusionne :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-conditional-definition-search `
  --file outputs/diablo4-conditional-metadata-value-inspection/conditional-metadata-value-inspection.json `
  --external-targets outputs/diablo4-external-target-scan-plan/external-target-search-merged/external-target-search-merged.json `
  --asset-ids 1663210 `
  --out outputs/diablo4-conditional-definition-search-full-target-scan
```

Resultat :

- assets : `1`
- cibles inspectees : `2`
- definitions exactes trouvees hors asset source : `0`
- cibles exactes non resolues : `2`
- `SF_32` : il faut encore elargir ou changer la strategie de recherche de definition
- `SF_33` : il faut mapper `Mod.SoilRuler_B` a un etat de build, pas chercher une simple valeur numerique

Decision :

Le scan complet cible ferme l'hypothese selon laquelle la definition exacte serait simplement dans une autre tranche `data.xxx` sous forme de chaine ASCII. Pour progresser, il faut maintenant changer d'angle :

- soit analyser plus profondement le payload `assetId 1663210` lui-meme pour comprendre comment `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` est resolu
- soit construire une table de mapping des flags/mods de build, en partant de `Mod.SoilRuler_B`, des upgrades, passifs, aspects et tags proches
- soit rechercher les memes liens par references structurelles/IDs binaires plutot que par chaines ASCII exactes

## Extraction focalisee du payload source `1663210`

Le payload source exact a ete decode pour passer d'une recherche de chaine globale a une analyse locale de structure.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js decode-blte `
  --file "C:\Program Files (x86)\Diablo IV\Data\data\data.007" `
  --offset 8265002 `
  --out outputs/diablo4-source-asset-1663210-payload
```

Fichiers produits :

- `outputs/diablo4-source-asset-1663210-payload/data.007.8265002.blte.json`
- `outputs/diablo4-source-asset-1663210-payload/data.007.8265002.decoded.bin`
- `outputs/diablo4-source-asset-1663210-string-map/source-asset-1663210-string-map.json`

Resultat :

- asset : `1663210`
- fichier source : `data.007`
- offset BLTE : `8265002`
- taille decodee : `23808` octets
- chaines ASCII detectees : `61`

Voisinage important :

| Offset | Chaine | Role probable |
| ---: | --- | --- |
| `17444` | `Mod.SoilRuler_B` | trigger probable de `SF_33` |
| `17484` | `PowerTag.SystemsTuningGlobals."Script Formula 0"` | contexte tuning global |
| `17732` | `(SF_33 == 0)? (0.35 * Table(34, sLevel)) : ... SF_32 ...` | branche conditionnelle dupliquee |
| `18004` | `(SF_33 == 0)? (0.35 * Table(34, sLevel)) : ... SF_32 ...` | branche conditionnelle dupliquee |
| `18324` | `(SF_33 == 0)? (0.4 * Table(34, sLevel)) : ... SF_32 ...` | branche conditionnelle principale |
| `18704` | `PowerTag.Spiritborn_Talent_Ultimate_2."Script Formula 1"` | proprietaire gameplay probable |
| `18788` | `PowerTag.Spiritborn_Talent_Ultimate_2."Script Formula 0"` | proprietaire gameplay probable |
| `18872` | `0.3 * Table(34, sLevel)` | candidat fort de scaling local |
| `18948` | `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` | source probable de `SF_32` |
| `19044` | `(1-POW(1-SF_28/100,1/2))*100` | formule d'uptime/probabilite |
| `19176` | `(1-POW(1-SF_29/100,1/(SF_9*2)))*100` | formule d'uptime/probabilite |

Decision :

Le scan global a prouve que la definition exacte n'est pas ailleurs sous forme ASCII. L'analyse locale du payload montre maintenant un motif beaucoup plus exploitable : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` est place juste apres `0.3 * Table(34, sLevel)` et les refs `PowerTag.Spiritborn_Talent_Ultimate_2`. Cela fait de `0.3 * Table(34,sLevel)` le meilleur candidat actuel pour la valeur de scaling liee a `SF_32`, mais ce n'est pas encore une preuve suffisante pour modifier le DPS reel.

La prochaine etape technique doit mapper les chaines voisines en relation structurelle : quel champ pointe vers quel hash, et quel `Script Formula` alimente exactement `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`.

## Inspection structurelle des chaines du payload `1663210`

Un inspecteur generique de chaines decodees a ete ajoute au CLI pour lire, autour de chaque chaine ASCII :

- les mots binaires precedents et suivants
- leur interpretation `uint32`, `int32`, `float32`, hex et ASCII
- les references directes vers les offsets de chaines

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-decoded-strings `
  --file outputs/diablo4-source-asset-1663210-payload/data.007.8265002.decoded.bin `
  --terms "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate,Mod.SoilRuler_B,0.3 * Table(34, sLevel),PowerTag.Spiritborn_Talent_Ultimate_2,PowerTag.SystemsTuningGlobals,SF_33,SF_32" `
  --out outputs/diablo4-source-asset-1663210-string-structure
```

Fichiers produits :

- `outputs/diablo4-source-asset-1663210-string-structure/decoded-string-structure.json`
- `outputs/diablo4-source-asset-1663210-structural-relations/structural-relations.json`

Resultat :

- chaines ASCII totales : `61`
- chaines inspectees : `11`
- cibles avec reference directe d'offset : `1`

Preuves locales importantes :

| Element | Offset | Preuve |
| --- | ---: | --- |
| `Mod.SoilRuler_B` | `17444` | reference directe depuis l'offset `16296` |
| `PowerTag.Spiritborn_Talent_Ultimate_2."Script Formula 1"` | `18704` | suffixe avec `uint32 1648387` |
| `PowerTag.Spiritborn_Talent_Ultimate_2."Script Formula 0"` | `18788` | suffixe avec `uint32 1648387` |
| `0.3 * Table(34, sLevel)` | `18872` | suffixe avec `float32 0.3` et `float32 34` |
| `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` | `18948` | prefixe contenant `float32 0.3` puis `float32 34` |
| `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` | `18948` | suffixe contenant `uint32 1663210`, l'asset courant |

Occurrences d'IDs utiles :

- `1648387` : offsets `18772` et `18856`, juste apres les deux refs `Script Formula` de `Spiritborn_Talent_Ultimate_2`
- `1663210` : offsets `16` et `19016`, donc header/payload courant et zone du hash bonus
- `17444` : offset `16296`, pointeur direct vers `Mod.SoilRuler_B`

Decision :

Le lien `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` -> `0.3 * Table(34,sLevel)` passe maintenant en candidat de confiance `medium-high`. La preuve principale est que le record du hash bonus semble contenir juste avant lui les valeurs typées `float32 0.3` et `float32 34`, qui correspondent exactement a la formule locale `0.3 * Table(34,sLevel)`.

Il manque encore un parseur de champs pour dire avec certitude : "ce champ du hash bonus pointe vers cette formule". Tant que ce parseur n'existe pas, le DPS reel ne doit pas etre modifie automatiquement. En revanche, le moteur peut commencer a stocker cette relation comme `candidateSf32Value`, avec preuve et niveau de confiance.

## Contexte candidat exploitable par le moteur

Une commande a ete ajoutee pour transformer les preuves structurelles en contexte candidat non promu. Cette sortie est faite pour le futur moteur/site : elle peut afficher une hypothese et son impact, mais elle interdit explicitement la promotion en DPS reel.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js build-conditional-candidate-context `
  --structural-relations outputs/diablo4-source-asset-1663210-structural-relations/structural-relations.json `
  --scenarios-file outputs/diablo4-conditional-sf-scenarios/conditional-sf-scenarios.json `
  --out outputs/diablo4-conditional-candidate-context
```

Fichier produit :

- `outputs/diablo4-conditional-candidate-context/conditional-candidate-context.json`

Resultat :

- candidats : `1`
- candidats avec impact scenario : `1`
- promotions DPS reelles : `0`
- recommandation : `store-candidate-do-not-promote`

Candidat produit :

| Champ | Valeur |
| --- | --- |
| `canonicalId` | `candidate:sf:1663210:32` |
| slot | `sf:1663210:32` |
| role | `conditional-boost-scaling-candidate` |
| cible | `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` |
| formule candidate | `0.3 * Table(34, sLevel)` |
| valeur scenario | `0.3` |
| confiance | `medium-high` |
| trigger candidat | `Mod.SoilRuler_B` / `sf:1663210:33` |
| proprietaire candidat | `PowerTag.Spiritborn_Talent_Ultimate_2.Script Formula 0/1` |

Impact du scenario correspondant :

| Scenario | SF_33 | SF_32 | Coefficient primaire | DPS estime | Delta DPS | Delta |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `sf33-active-sf32-30pct` | `1` | `0.3` | `1768` | `212160` | `48960` | `30%` |

Statut de promotion :

- `blocked-for-real-dps`
- raisons :
  - `field-level-parser-required`
  - `sf33-trigger-build-state-unmapped`
  - `uptime-not-proven`

Decision :

Le moteur dispose maintenant d'un objet intermediaire propre : il peut relier `SF_32` a une formule candidate, montrer l'effet theorique du scenario, et conserver le DPS strict comme autorite. C'est exactement la forme qu'il faudra generaliser pour toutes les competences : chaque bonus conditionnel devra avoir une preuve, une confiance, un impact scenario, et un statut de promotion.

## Export de dataset pour le futur optimiseur

Une commande d'export oriente site a ete ajoutee. Elle regroupe le modele DPS strict/revu et les candidats conditionnels bloques dans un format directement consommable par une interface.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js export-optimizer-dataset `
  --file outputs/diablo4-reviewed-dps-model/reviewed-dps-model.json `
  --candidate-context outputs/diablo4-conditional-candidate-context/conditional-candidate-context.json `
  --out outputs/diablo4-optimizer-dataset
```

Fichiers produits :

- `outputs/diablo4-optimizer-dataset/optimizer-dataset.json`
- `outputs/diablo4-optimizer-dataset/optimizer-dataset-summary.json`

Resultat :

- assets : `10`
- assets avec DPS strict : `4`
- candidats conditionnels : `1`
- candidats bloques : `1`
- promotions DPS reelles : `0`

Pour `assetId 1663210`, le dataset contient maintenant deux rails separes :

Rail strict :

- label : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
- DPS strict : `163200`
- coefficient primaire : `1360`
- methode : `strict-reviewed-dps`
- autorite : `authoritative-for-current-optimizer`

Rail candidat :

- `canonicalId` : `candidate:sf:1663210:32`
- formule candidate : `0.3 * Table(34, sLevel)`
- scenario : `sf33-active-sf32-30pct`
- DPS theorique : `212160`
- delta : `+48960`, soit `+30%`
- statut : `blocked-for-real-dps`
- raisons :
  - `field-level-parser-required`
  - `sf33-trigger-build-state-unmapped`
  - `uptime-not-proven`

Decision :

Le futur site peut maintenant charger un fichier unique et afficher :

- la valeur DPS stricte fiable
- les hypotheses candidates
- leur impact theorique
- les preuves associees
- les raisons pour lesquelles elles ne sont pas encore activees dans l'optimiseur

C'est le premier contrat de donnees utilisable pour l'interface : il separe clairement ce qui est calcule, ce qui est suspecte, et ce qui est bloque.

## Premier prototype d'interface locale

Un premier site statique a ete ajoute dans `site/`. Il consomme `outputs/diablo4-optimizer-dataset/optimizer-dataset.json` et affiche :

- la synthese du dataset
- la liste des assets
- le DPS strict autoritaire
- les candidats conditionnels bloques
- l'impact theorique des candidats
- les preuves et raisons de blocage

Fichiers ajoutes :

- `site/index.html`
- `site/styles.css`
- `site/app.js`
- `site/server.js`

Commande de lancement :

```powershell
node site/server.js
```

URL locale :

- `http://127.0.0.1:4173/site/`

Verification technique :

- page : `200`
- JavaScript : `200`
- dataset : `200`
- assets charges : `10`
- candidats charges : `1`

Decision :

Le projet dispose maintenant d'un premier ecran lisible par un humain. Ce n'est pas encore l'optimiseur de builds, mais c'est le bon socle produit : le site affiche deja la separation fondamentale entre DPS strict et hypotheses bloquees.

## Mode `What-if` du prototype

Le prototype d'interface a ete enrichi avec un mode `What-if`.

Ajouts :

- interrupteur `What-if` dans l'en-tete
- comparaison DPS strict / DPS hypothese sur l'asset selectionne
- badge d'impact candidat dans la liste des assets
- rappel visible du statut `blocked-for-real-dps`
- conservation du DPS strict comme mode par defaut

Pour `assetId 1663210`, l'interface affiche maintenant :

| Rail | DPS | Delta | Statut |
| --- | ---: | ---: | --- |
| strict | `163200` | `0` | autoritaire |
| what-if | `212160` | `+48960` / `+30%` | `blocked-for-real-dps` |

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- dataset : `200`
- interrupteur `What-if` detecte
- section de comparaison detectee

Decision :

Le site commence a jouer son role d'outil d'analyse : il ne se contente plus de lister les donnees, il compare deja le resultat fiable et l'hypothese candidate sans melanger les deux.

## Affichage des preuves du candidat

Le prototype affiche maintenant un bloc dedie aux preuves du meilleur candidat conditionnel.

Pour `assetId 1663210`, l'interface separe les preuves en trois groupes :

- valeur candidate
- proprietaire probable de la formule
- trigger probable

Objectif :

- montrer pourquoi le candidat existe
- montrer pourquoi il reste bloque
- preparer le futur flux de validation avant promotion vers le vrai calcul DPS

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- dataset : `200`
- rendu des preuves detecte
- styles des preuves detectes
- assets charges : `10`
- candidats charges : `1`
- candidats bloques : `1`

Decision :

L'interface commence a documenter la preuve, pas seulement le resultat. C'est indispensable pour un optimiseur fiable : chaque bonus candidat doit pouvoir etre relu, conteste, puis promu seulement quand son declenchement et son uptime sont prouves.

## Premier classement optimiseur

Le prototype contient maintenant un panneau `Classement optimiseur`.

Modes de classement disponibles :

- `DPS actif` : respecte le mode courant de l'interface, strict par defaut ou what-if si l'interrupteur est active
- `DPS strict` : classe uniquement les valeurs autoritaires
- `Gain candidat` : classe les hypotheses par delta potentiel

Le classement affiche :

- le meilleur choix courant
- le top 5 des assets
- le score utilise pour le tri
- un acces direct au detail de l'asset selectionne

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- dataset : `200`
- panneau optimiseur detecte
- rendu du classement detecte
- styles du classement detectes
- meilleur DPS strict : `assetId 1461593`, `1113210`
- meilleur gain candidat : `assetId 1663210`, `+48960`

Decision :

Le site n'est plus seulement un viewer : il effectue un premier choix automatique. Cette couche reste volontairement simple, mais elle pose le futur comportement de l'optimiseur : comparer, classer, puis expliquer pourquoi une option gagne.

## Filtre de contexte pour le classement

Le panneau `Classement optimiseur` dispose maintenant d'un filtre par tag.

Tags detectes dans le dataset courant :

- `Affix`
- `Damage`
- `Legendary`
- `Necromancer`
- `Paladin`
- `PowerTag`
- `Spiritborn`
- `Table`
- `Unique`

Comportement ajoute :

- generation automatique de la liste des tags depuis le dataset
- classement limite au tag choisi
- conservation du mode de tri courant : DPS actif, DPS strict ou gain candidat
- etat vide si aucun asset ne correspond
- selection directe d'un asset depuis le classement filtre

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- dataset : `200`
- selecteur de tag detecte
- rendu automatique des tags detecte
- filtre de classement detecte
- styles des controles detectes
- tags charges : `9`
- assets `Spiritborn` : `2`
- assets `Necromancer` : `2`

Decision :

Le classement commence a raisonner dans un contexte de build. C'est encore un filtre simple, mais il evite deja de comparer une option Spiritborn a une option Necromancer ou Paladin lorsque l'utilisateur veut optimiser une classe precise.

## Recherche dans le classement optimiseur

Le panneau `Classement optimiseur` dispose maintenant d'une recherche texte.

Champs recherches :

- libelle de l'asset
- identifiant d'asset
- tags
- cible candidate
- formule candidate
- identifiant canonique du candidat
- statut de promotion

La recherche se combine avec :

- le filtre par tag
- le mode de classement
- le mode strict / what-if

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- dataset : `200`
- champ de recherche detecte
- etat de recherche detecte
- fonction de recherche detectee
- styles de recherche detectes
- recherche `centipede` : `1` resultat
- recherche `spiritborn` : `2` resultats
- recherche `1663210` : `1` resultat
- recherche `centipede` avec tag `Spiritborn` : `1` resultat

Decision :

Le classement devient navigable. C'est important pour la suite, car le volume reel de donnees Diablo IV sera beaucoup plus grand que ce dataset de travail : il faut pouvoir filtrer par classe, puis chercher une competence, un affixe ou un identifiant precis sans perdre le contexte d'optimisation.

## Premiere selection de build

Le prototype contient maintenant un panneau `Build courant`.

Comportement ajoute :

- ajout de l'asset selectionne au build depuis le detail
- retrait depuis le detail ou depuis la liste du build
- remise a zero du build
- total DPS strict
- total DPS actif, avec le mode what-if si active
- comptage des hypotheses bloquees embarquees dans le build

Important :

Le total actuel est une somme de travail pour tester l'ergonomie et le flux produit. Il ne remplace pas encore un vrai modele de cumul Diablo IV, qui devra gerer les familles additives, multiplicatives, les caps, l'uptime et les conflits d'equipement.

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- dataset : `200`
- panneau build detecte
- etat de selection detecte
- rendu du build detecte
- action ajout/retrait detectee
- styles du build detectes
- simulation build : `assetId 1461593` + `assetId 1663210`
- total strict simule : `1276410`
- total what-if simule : `1325370`
- hypotheses bloquees simulees : `1`

Decision :

Le site passe d'un classement d'options a une premiere composition de build. C'est une transition importante : l'optimisation future devra raisonner sur un ensemble de choix, pas seulement sur le meilleur asset isole.

## Sauvegarde locale du build

Le prototype sauvegarde maintenant l'etat de travail dans le navigateur.

Donnees conservees :

- asset selectionne
- filtre de la liste d'assets
- mode strict / what-if
- mode de classement optimiseur
- tag du classement
- recherche du classement
- assets retenus dans le build courant

Robustesse ajoutee :

- les assets absents du dataset courant sont retires du build restaure
- un tag inconnu retombe sur `Tous les tags`
- un mode de classement inconnu retombe sur `DPS actif`
- un filtre inconnu retombe sur `Tous`
- la sauvegarde est ignoree proprement si le navigateur bloque le stockage local

Verification technique :

- page : `200`
- JavaScript : `200`
- dataset : `200`
- cle de stockage detectee
- restauration detectee
- sauvegarde detectee
- synchronisation des controles detectee
- normalisation de l'etat detectee
- simulation restauree : `assetId 1461593` + `assetId 1663210`
- asset invalide retire : `999999999`
- total strict restaure : `1276410`
- total what-if restaure : `1325370`

Decision :

Le prototype devient plus confortable a utiliser : l'utilisateur peut composer un build, recharger la page, puis reprendre son analyse sans reconstruire sa selection.

## Export JSON du build courant

Le panneau `Build courant` dispose maintenant d'un bouton `Exporter JSON`.

Format exporte :

- `schemaVersion`
- date d'export
- mode courant : `strict` ou `what-if`
- totaux du build
- liste des asset ids
- detail minimal de chaque asset
- detail du meilleur candidat lorsqu'il existe
- statut de promotion et blockers du candidat

Comportement :

- l'export est copie dans le presse-papiers quand le navigateur l'autorise
- si le presse-papiers est indisponible, le JSON est affiche directement dans le panneau
- le format garde la separation entre DPS strict, DPS actif et candidat bloque

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- dataset : `200`
- bouton export detecte
- fonction export detectee
- generation du payload detectee
- fallback presse-papiers detecte
- styles du retour export detectes
- payload simule : `schemaVersion 1`
- mode simule : `what-if`
- assets exportes : `1461593`, `1663210`
- total strict exporte : `1276410`
- total actif exporte : `1325370`
- hypotheses bloquees exportees : `1`
- statut candidat exporte : `blocked-for-real-dps`

Decision :

Le build courant a maintenant un contrat de sortie. C'est une base utile pour l'import futur, les tests reproductibles, et le passage progressif vers un vrai moteur d'optimisation.

## Import JSON du build courant

Le panneau `Build courant` dispose maintenant d'une zone d'import JSON.

Formats acceptes :

- format exporte avec `assetIds`
- format derive avec une liste `assets[].assetId`

Comportement :

- lecture du JSON colle dans la zone d'import
- restauration des assets valides dans le build courant
- suppression automatique des ids inconnus du dataset courant
- suppression automatique des doublons
- restauration du mode `what-if` ou `strict` lorsque le champ `mode` est present
- message d'erreur lisible si le JSON est invalide ou si aucun asset valide n'est trouve

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- dataset : `200`
- zone d'import detectee
- bouton import detecte
- fonction import detectee
- extraction des ids detectee
- normalisation des ids detectee
- styles d'import detectes
- payload simule : `1461593`, `1663210`, `999999999`, doublon `1663210`
- ids importes apres normalisation : `1461593`, `1663210`
- id invalide retire : oui
- doublon retire : oui
- format alternatif `assets[].assetId` valide avec `493422`

Decision :

Le build courant peut maintenant sortir et revenir dans l'interface. Cela ferme la boucle minimale export/import, indispensable pour reproduire des tests, partager un cas d'analyse, et preparer plus tard des builds sauvegardes cote serveur.

## Schema cible du dataset optimiseur

Un premier contrat de donnees cible a ete ajoute pour guider les prochaines extractions.

Fichiers ajoutes :

- `work/diablo4-data-exporter/schema/target-dataset.schema.json`
- `work/diablo4-data-exporter/schema/target-dataset.md`
- `work/diablo4-data-exporter/schema/target-dataset.example.json`
- `work/diablo4-data-exporter/src/schema-validator.js`

Commande CLI ajoutee :

```powershell
node work/diablo4-data-exporter/d4export.js validate-target-dataset --file work/diablo4-data-exporter/schema/target-dataset.example.json --out outputs/diablo4-target-schema-validation
```

Le schema cible couvre :

- competences
- objets
- affixes
- aspects
- nodes parangon
- glyphes
- runes
- formules
- conditions
- relations entre entites
- preuves obligatoires via `evidence`

Regle structurante :

Aucune valeur importante ne doit entrer dans le moteur sans preuve. Les candidats peuvent etre affiches, exportes et expliques, mais ils doivent rester separes du DPS fiable tant que leur champ exact, leur trigger et leur uptime ne sont pas prouves.

Verification technique :

- syntaxe `d4export.js` : OK
- syntaxe `schema-validator.js` : OK
- JSON schema : OK
- JSON exemple : OK
- commande `validate-target-dataset` detectee dans l'aide
- validation exemple : OK
- issues : `0`
- warnings : `0`
- ids valides : `3`
- collections validees : `skills`, `items`, `affixes`, `aspects`, `paragonNodes`, `glyphs`, `runes`, `formulas`, `conditions`
- relations validees : `1`

Decision :

Le projet dispose maintenant d'une cible propre pour les futures extractions. La prochaine phase peut convertir progressivement les assets et formules existants vers ce format, au lieu d'ajouter des donnees ad hoc difficilement optimisables.

## Conversion du dataset actuel vers le schema cible

Un convertisseur partiel a ete ajoute pour transformer `optimizer-dataset-v0` vers le nouveau schema cible.

Fichier ajoute :

- `work/diablo4-data-exporter/src/target-dataset-exporter.js`

Commande CLI ajoutee :

```powershell
node work/diablo4-data-exporter/d4export.js export-target-dataset --file outputs/diablo4-optimizer-dataset/optimizer-dataset.json --out outputs/diablo4-target-dataset
```

Sortie generee :

- `outputs/diablo4-target-dataset/target-dataset.json`
- `outputs/diablo4-target-dataset-validation/target-dataset-validation.json`

Conversion actuelle :

- skills techniques : `8`
- affixes : `1`
- aspects : `1`
- formules : `64`
- conditions : `1`
- relations : `65`

Validation :

- schema valide : oui
- issues : `0`
- warnings : `1`

Warning attendu :

- `entities.skills[3].modifiers[1].operation: unknown operation must be resolved before DPS promotion`

Ce warning correspond au candidat bloque de `assetId 1663210`. Il est volontairement conserve en `operation: unknown`, avec les blockers :

- `field-level-parser-required`
- `sf33-trigger-build-state-unmapped`
- `uptime-not-proven`

Decision :

Le pont entre le dataset prototype et le futur schema optimiseur existe maintenant. Les donnees actuelles peuvent deja etre consommees sous une forme plus saine, sans perdre la distinction entre valeurs strictes et hypotheses candidates.

## Affichage du dataset cible dans le site

Le site charge maintenant aussi le dataset cible normalise et son rapport de validation.

Fichiers utilises par l'interface :

- `outputs/diablo4-target-dataset/target-dataset.json`
- `outputs/diablo4-target-dataset-validation/target-dataset-validation.json`

Comportement ajoute :

- chargement optionnel du dataset cible
- panneau `Dataset cible`
- statut de chargement du schema cible
- compteurs de couverture : skills, affixes, aspects, formules, conditions, relations
- affichage du nombre d'issues et de warnings
- affichage du premier warning de validation

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- optimizer dataset : `200`
- target dataset : `200`
- validation target dataset : `200`
- panneau cible detecte
- loader cible detecte
- renderer cible detecte
- fetch optionnel detecte
- styles cible detectes
- skills : `8`
- affixes : `1`
- aspects : `1`
- formules : `64`
- conditions : `1`
- relations : `65`
- validation OK : oui
- issues : `0`
- warnings : `1`

Warning affiche :

- `entities.skills[3].modifiers[1].operation: unknown operation must be resolved before DPS promotion`

Decision :

L'interface commence a voir la couche de donnees propre, pas seulement le dataset prototype. C'est une etape de transition importante vers un moteur d'optimisation base sur entites, relations et preuves.

## Navigation dans les entites du dataset cible

Le panneau `Dataset cible` affiche maintenant une liste compacte des premieres entites normalisees.

Entites affichees :

- skills
- aspects
- affixes

Comportement ajoute :

- affichage du type d'entite
- affichage de la classe normalisee
- affichage de l'asset id
- affichage du nombre de modifiers
- clic sur une entite avec `assetId` pour ouvrir l'asset correspondant dans le detail

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- target dataset : `200`
- validation target dataset : `200`
- renderer d'entites detecte
- delegation de clic detectee
- attribut `data-target-asset-id` detecte
- styles d'entites detectes
- entites affichees en preview : `10`
- entite Spiritborn detectee : `skill:1663210`
- modifiers sur `skill:1663210` : `2`
- warnings validation : `1`

Decision :

Le site commence a relier les donnees normalisees au viewer d'assets. C'est le debut du passage d'un outil de debug vers une interface construite autour des entites reelles du futur optimiseur.

## Filtres des entites du dataset cible

Le panneau `Dataset cible` dispose maintenant de filtres pour naviguer dans les entites normalisees.

Filtres ajoutes :

- type d'entite : `skill`, `aspect`, `affix`
- classe normalisee : `generic`, `necromancer`, `spiritborn`, `unknown`

Comportement ajoute :

- generation automatique des options depuis `target-dataset.json`
- filtrage combine type + classe
- compteur `affichees / filtrees`
- conservation locale des filtres
- clic sur une entite filtree pour ouvrir son asset

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- target dataset : `200`
- filtre de type detecte
- filtre de classe detecte
- generation des options detectee
- compteur filtre detecte
- styles du compteur detectes
- total entites : `10`
- skills : `8`
- aspects : `1`
- affixes : `1`
- entites `spiritborn` : `2`
- skills `spiritborn` : `2`
- skills `necromancer` : `1`

Decision :

L'interface peut maintenant explorer le dataset cible par type et classe. Cette navigation deviendra centrale quand les vraies competences, aspects, glyphes et nodes parangon seront extraits en volume.

## Recherche dans les entites du dataset cible

Le panneau `Dataset cible` dispose maintenant d'une recherche texte dediee aux entites normalisees.

Champs recherches :

- id d'entite
- nom technique
- asset id
- type d'entite
- classe normalisee
- tags
- ids de modifiers
- stat de modifier
- operation de modifier
- bucket de modifier
- confiance de preuve

La recherche se combine avec :

- filtre de type
- filtre de classe
- compteur `affichees / filtrees`
- navigation vers l'asset correspondant

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- target dataset : `200`
- champ de recherche detecte
- etat de recherche detecte
- fonction de recherche detectee
- filtre combine detecte
- styles de recherche detectes
- recherche `centipede` : `1` resultat
- recherche `1663210` : `1` resultat
- recherche `blocked` : `1` resultat
- recherche `estimatedDps` : `10` resultats
- recherche `centipede` avec `skill` + `spiritborn` : `1` resultat

Decision :

La navigation du dataset cible devient utilisable meme quand le volume augmentera. C'est une brique importante pour inspecter rapidement une competence, un aspect, une classe ou un modifier extrait.

## Detail des entites du dataset cible

Le panneau `Dataset cible` affiche maintenant le detail de l'entite normalisee selectionnee.

Comportement ajoute :

- conservation locale de l'entite cible selectionnee
- ligne active dans la liste des entites
- bloc detail avec identifiant, type, classe et asset associe
- liste des modifiers normalises de l'entite
- affichage des preuves de l'entite
- mise en evidence des modifiers bloques ou encore en `operation: unknown`

Cas important :

- `skill:1663210` expose `2` modifiers
- le modifier strict est present en `operation: add`
- le candidat conditionnel reste visible en `operation: unknown` et `bucket: blocked-candidate`
- le candidat n'est donc pas promu dans le vrai DPS

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- target dataset : `200`
- renderer du detail d'entite detecte
- renderer des modifiers detecte
- renderer des preuves detecte
- etat `selectedTargetEntityId` detecte
- styles du detail detectes
- entite testee : `skill:1663210`
- modifiers : `2`
- modifier strict detecte : oui
- modifier bloque detecte : oui

Decision :

Le site permet maintenant d'inspecter les donnees normalisees avant de les brancher dans l'optimiseur. C'est volontairement une etape de controle : on peut voir ce qui est fiable, ce qui est calcule, et ce qui doit rester bloque tant que le parser champ par champ, le trigger et l'uptime ne sont pas prouves.

## Premier score issu du dataset cible

Le site commence maintenant a utiliser les entites normalisees pour calculer les scores affiches.

Comportement ajoute :

- fonction de score qui cherche d'abord l'entite cible associee a l'asset
- lecture des modifiers `estimatedDps` normalises
- utilisation des modifiers `operation: add` et `bucket: strict-reviewed-dps` pour le DPS strict
- conservation des modifiers `operation: unknown` ou `bucket: blocked-candidate` comme hypotheses what-if bloquees
- retour automatique vers l'ancien dataset prototype si le dataset cible est absent
- utilisation de ce score dans le classement, les totaux du build et l'export JSON
- bloc `Score cible` dans le detail d'asset avec source, entite cible, DPS strict, candidats bloques et parite avec le prototype

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- optimizer dataset : `200`
- target dataset : `200`
- fonction `dpsScore` detectee
- bloc `Score cible` detecte
- styles du score detectes
- asset teste : `1663210`
- DPS strict prototype : `163200`
- DPS strict cible : `163200`
- DPS candidat cible : `212160`
- parite strict : oui
- delta candidat : `48960`

Decision :

L'interface ne depend plus uniquement du dataset prototype pour ses scores principaux. Elle commence a lire le contrat cible, tout en gardant une securite de repli. C'est une transition importante vers le futur moteur d'optimisation : les scores affiches peuvent maintenant provenir des entites, modifiers et preuves qui serviront ensuite aux calculs de build.

## Premiere composition de build structuree

Le panneau `Build courant` utilise maintenant un objet de composition explicite au lieu d'un simple total brut.

Comportement ajoute :

- composition `target-modifier-sum-v1`
- lignes de build avec DPS strict, DPS candidat, delta, source de score et entite cible
- totaux separes : strict, what-if, actif, delta candidat, hypotheses bloquees
- couverture du build par le dataset cible
- warnings de composition visibles dans l'interface
- export JSON enrichi avec l'objet `composition`
- rappel explicite que le cumul reste un prototype et ne modelise pas encore les buckets Diablo IV, caps, conflits d'equipement, uptime ou slots

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- optimizer dataset : `200`
- target dataset : `200`
- fonction `buildComposition` detectee
- warnings de composition detectes
- composition exportee detectee
- styles de composition detectes
- build simule : `1461593` + `1663210`
- total strict : `1276410`
- total what-if : `1325370`
- delta candidat : `48960`
- hypotheses bloquees : `1`
- couverture cible : `2 / 2`

Decision :

Le build courant devient un objet calculable et exportable. Cette etape ne pretend pas encore reproduire le vrai moteur Diablo IV, mais elle separe clairement le calcul fiable, les hypotheses bloquees et les limites du modele. La prochaine etape logique est de remplacer progressivement la somme simple par des familles de cumul : base damage, additif, multiplicatif, uptime, conditions et exclusions.

## Preparation des familles de calcul

La composition de build expose maintenant un premier decoupage par familles de calcul.

Familles ajoutees :

- `strictBase` : DPS strict issu des modifiers `bucket: strict-reviewed-dps`
- `additive` : reserve pour les futurs modifiers `operation: add`
- `multiplicative` : reserve pour les futurs modifiers `operation: multiply`
- `uptime` : reserve pour les modifiers conditionnels avec uptime ou proc
- `caps` : reserve pour les futurs plafonds
- `blockedCandidate` : hypotheses candidates non promues
- `unknown` : modifiers non classes

Comportement ajoute :

- classification locale des modifiers cible
- agregation des buckets dans la composition du build
- affichage de la famille dans le detail d'un modifier
- affichage du resume de buckets dans la note de composition du build
- export JSON enrichi avec `composition.buckets`

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- target dataset : `200`
- classification des buckets detectee
- merge des buckets detecte
- resume de buckets detecte
- build simule : `1461593` + `1663210`
- total strict : `1276410`
- total what-if : `1325370`
- delta candidat : `48960`
- hypotheses bloquees : `1`
- `strictBase` : `1276410`
- `additive` : `0`
- `multiplicative` : `1`
- `uptime` : `1`
- `blockedCandidate` : `212160`
- `unknown` : `0`

Decision :

Le moteur de composition a maintenant des emplacements clairs pour les vraies familles Diablo IV. Les donnees actuelles ne permettent pas encore un calcul additif/multiplicatif complet, mais l'interface et l'export savent deja separer base stricte, multiplicateurs futurs, uptime futur et hypotheses bloquees.

## Diagnostic de qualite du modele

Le build courant expose maintenant un diagnostic de qualite du calcul.

Etats possibles :

- `fiable` : bonne couverture cible, aucun candidat bloque, pas de score de repli
- `partiel` : exploitable pour comparer, mais avec limites visibles
- `bloque` : trop d'inconnues pour etre considere comme un score robuste
- `vide` : aucun asset dans le build

Critere actuel :

- couverture par le dataset cible
- presence de scores de repli hors dataset cible
- hypotheses conditionnelles bloquees
- modifiers non classes
- absence de vraies familles additif/multiplicatif/uptime
- rappel que le cumul reste un prototype

Comportement ajoute :

- champ `composition.quality`
- score de qualite sur `100`
- raisons du diagnostic
- prochaines actions proposees dans l'export JSON
- affichage `Qualite modele` dans le panneau build
- coloration des etats `fiable`, `partiel`, `bloque`, `vide`

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- target dataset : `200`
- fonction `buildCompositionQuality` detectee
- metrique `Qualite modele` detectee
- export de la qualite detecte
- styles de qualite detectes
- build simule : `1461593` + `1663210`
- total strict : `1276410`
- total what-if : `1325370`
- delta candidat : `48960`
- hypotheses bloquees : `1`
- diagnostic attendu : `partiel`
- score attendu : `60 / 100`
- raisons attendues : candidat bloque, familles additif/multiplicatif/uptime non alimentees

Decision :

Le site commence a dire non seulement combien un build vaut, mais aussi a quel point ce chiffre est credible. C'est essentiel pour eviter de presenter une hypothese comme une verite et pour prioriser les prochaines extractions.

## Actions de deblocage du modele

Le diagnostic de qualite du build est maintenant actionnable dans l'interface.

Comportement ajoute :

- phrase de risque dans `composition.quality.risk`
- affichage du risque dans la note de composition du build
- liste des prochaines actions prioritaires
- limitation de l'affichage aux trois premieres actions pour garder le panneau lisible
- styles dedies pour le risque et les actions
- export JSON qui contient les memes raisons et actions que l'interface

Exemple pour le build `1461593` + `1663210` :

- qualite : `partiel`
- score : `60 / 100`
- risque : score utile pour comparer, mais pas encore assez prouve pour optimiser automatiquement
- actions prioritaires :
  - prouver le champ exact, le trigger et l'uptime des candidats
  - extraire des modifiers plus fins que `estimatedDps`
  - remplacer la somme simple par le calcul par buckets Diablo IV

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- champ `risk` detecte
- affichage `build-risk` detecte
- affichage `build-next-actions` detecte
- texte de risque partiel detecte
- actions de qualite detectees
- styles du risque detectes
- styles des actions detectes

Decision :

Le panneau build devient un guide de travail. Il montre maintenant ce qui empeche le calcul d'etre fiable et transforme les limites du modele en prochaines taches d'extraction.

## File de blocages par asset

La composition du build relie maintenant les limites du modele aux assets concernes.

Comportement ajoute :

- collecte des blocages par asset dans `rows[].blockers`
- agregation dans `composition.blockers`
- priorisation simple des blocages
- libelles lisibles pour les blockers techniques
- action recommandee par blocker
- affichage d'une file de blocages dans le panneau build
- clic sur un blocage pour ouvrir le detail de l'asset concerne
- export JSON enrichi avec les blocages par ligne et au niveau composition

Cas important :

- `assetId 1663210` expose `3` blocages :
  - `field-level-parser-required`
  - `sf33-trigger-build-state-unmapped`
  - `uptime-not-proven`

Verification technique :

- page : `200`
- JavaScript : `200`
- CSS : `200`
- optimizer dataset : `200`
- collecte des blockers detectee
- aggregation des blockers detectee
- libelles de blockers detectes
- rendu de la file de blocages detecte
- clic vers le detail detecte
- styles de blocages detectes
- asset teste : `1663210`
- blockers detectes : `3`

Decision :

Le build ne montre plus seulement une qualite partielle ; il indique maintenant quels assets et quels verrous techniques empechent la promotion vers un calcul fiable. C'est le debut d'un flux de validation oriente extraction.

## Migration vers le Projet `Diablo 4`

Migration effectuee le 2026-06-30 depuis l'ancien workspace :

- `C:\Users\FlowUP\Documents\Codex\2026-06-29\j-ai-un-projet-de-cr`

Elements repris dans le nouveau Projet :

- fichiers de pilotage : `PROJECT_STATUS.md`, `PROJECT_INSTRUCTIONS.md`, `PROJECT_THREADS.md`
- site : `site/index.html`, `site/app.js`, `site/styles.css`, `site/server.js`
- exporteur : `work/diablo4-data-exporter`
- datasets et rapports : `outputs`

Verification technique apres migration :

- source precedente accessible : oui
- copie vers `C:\Users\FlowUP\OneDrive\Documents\Diablo 4` : OK
- syntaxe `site/app.js` : OK avec le Node embarque Codex
- syntaxe `site/server.js` : OK avec le Node embarque Codex
- serveur lance sur `http://127.0.0.1:4173/site/`
- page : `200`
- JavaScript : `200`
- CSS : `200`
- dataset prototype : `200`
- dataset cible : `200`

Decision :

Le Projet `Diablo 4` devient le workspace de reference. L'ancien workspace ne doit plus etre utilise que comme archive ou source de comparaison explicite. La prochaine etape reste la meme : transformer la composition prototype en moteur de calcul par buckets Diablo IV, puis lever les blocages du candidat `assetId 1663210` sans promouvoir ses valeurs conditionnelles tant que le champ exact, le trigger et l'uptime ne sont pas prouves.

## Premiere composition cible par CLI

Une commande CLI a ete ajoutee pour calculer une composition de build directement depuis le dataset cible, hors interface.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js compose-target-build `
  --file outputs/diablo4-target-dataset/target-dataset.json `
  --asset-ids 1461593,1663210 `
  --mode strict `
  --out outputs/diablo4-target-build-composition
```

Fichier genere :

- `outputs/diablo4-target-build-composition/target-build-composition.json`

Comportement ajoute :

- lecture des entites du dataset cible
- composition des assets demandes
- separation des totaux strict, what-if, effectif et delta candidat
- agregation des familles : `strictBase`, `additive`, `multiplicative`, `uptime`, `caps`, `blockedCandidate`, `unknown`
- extraction des blocages depuis les notes `evidence`
- diagnostic de qualite du modele

Verification sur le build de reference :

- assets : `1461593`, `1663210`
- total strict : `1276410`
- total what-if : `1325370`
- delta candidat : `48960`
- qualite : `partiel`
- score qualite : `60 / 100`
- blocages : `3`
  - `field-level-parser-required`
  - `sf33-trigger-build-state-unmapped`
  - `uptime-not-proven`

Decision :

La logique de composition par familles sort maintenant de l'interface et devient un rapport reproductible cote exporteur. Elle reste volontairement conservative : le candidat de `assetId 1663210` est conserve en what-if bloque et n'est pas promu dans le DPS strict.

## Diagnostic de resolution des blocages cible

Une commande CLI a ete ajoutee pour regrouper les preuves de blocage d'un build compose depuis le dataset cible.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js audit-target-blockers `
  --file outputs/diablo4-target-build-composition/target-build-composition.json `
  --candidate-context outputs/diablo4-conditional-candidate-context/conditional-candidate-context.json `
  --sf-sources outputs/diablo4-conditional-sf-source-inspection/conditional-sf-source-inspection.json `
  --definition-search outputs/diablo4-conditional-definition-search-merged-test/conditional-definition-search.json `
  --out outputs/diablo4-target-blocker-resolution
```

Fichier genere :

- `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json`

Resultat pour `assetId 1663210` :

- blocages audites : `3`
- blocages resolus : `0`
- blocages actifs : `3`
- promotion DPS fiable : non
- candidat what-if : `212160`
- delta candidat : `48960`

Synthese des blocages :

- `field-level-parser-required` : la formule candidate `0.3 * Table(34, sLevel)` est tracee avec confiance `medium-high`, mais l'ownership champ par champ de `SF_32` n'est pas encore prouve.
- `sf33-trigger-build-state-unmapped` : le trigger candidat `Mod.SoilRuler_B` est identifie, mais il n'est pas encore relie a un toggle ou a une source de build-state.
- `uptime-not-proven` : le scenario what-if `sf33-active-sf32-30pct` explique le DPS `212160`, mais l'uptime reste non isolee.

Comportement interface ajoute :

- chargement optionnel de `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json`
- panneau `Diagnostic blocages`
- affichage des blocages actifs, prochaines actions, preuves SF et decision de promotion

Verification technique :

- syntaxe `site/app.js` : OK
- syntaxe `site/server.js` : OK
- syntaxe `work/diablo4-data-exporter/src/dps-model.js` : OK
- syntaxe `work/diablo4-data-exporter/d4export.js` : OK
- page : `200`
- JavaScript : `200`
- CSS : `200`
- diagnostic JSON : `200`
- panneau `Diagnostic blocages` detecte dans la page servie
- renderer du diagnostic detecte dans JavaScript
- styles du diagnostic detectes dans CSS

Decision :

Le projet dispose maintenant d'une file de blocages actionnable et reproductible pour `1663210`. La prochaine etape technique est de commencer par le premier verrou : parser le record cible autour de `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` et de la formule `0.3 * Table(34, sLevel)` afin de prouver ou rejeter l'ownership de `SF_32`.

## Recherche externe ciblee pour l'activation `SF_33`

Une recherche dediee a ete ajoutee pour verifier si le trigger `Mod.SoilRuler_B` existe dans une source externe au payload `1663210`.

Fichiers ajoutes :

- `work/diablo4-data-exporter/scripts/plan-sf33-activation-source-search.js`
- `work/diablo4-data-exporter/scripts/audit-sf33-activation-source-search-results.js`
- `outputs/diablo4-sf33-activation-source-search-plan/sf33-activation-source-search-plan.json`
- `outputs/diablo4-sf33-activation-source-search-plan/sf33-activation-source-merged/external-target-search-merged.json`
- `outputs/diablo4-sf33-activation-source-search-audit/sf33-activation-source-search-audit.json`

Resultat :

- fichiers jeu scannes : `205`
- payloads `deadbeef` decodes : `20414`
- entrees trouvees : `9`
- groupes trouves : `12`
- hits `Mod.SoilRuler_B` : `1`
- hits externes `Mod.SoilRuler_B` : `0`
- hits owner `Spiritborn` externes : `0`
- assets analogues `UpgradeB/C` : `8`

Verdict :

- `sf33-trigger-not-found-upgrade-analogies-only`
- `Mod.SoilRuler_B` et les proprietaires `Spiritborn_Talent_Ultimate_2` / `Spiritborn_Centipede_Ultimate` restent limites a `assetId 1663210`.
- Les assets `UpgradeB/C` ne prouvent pas l'activation de `SF_33`, mais donnent des patrons de structure build-state a comparer en binaire.
- Aucune promotion DPS : `promotionReady: false`, `buildStateReady: false`.

Integration :

- `audit-target-blockers` accepte maintenant `--sf33-activation-source-search-audit`.
- `target-blocker-resolution.json` expose `evidenceSummary.sf33ActivationSourceSearchAssessment`.
- Le blocage `sf33-trigger-build-state-unmapped` remonte maintenant : `trigger externe 0`, `owner externe 0`, `analogies upgrade 8`.
- Prochaine action : utiliser les assets `UpgradeB/C` comme patrons de structure build-state, puis chercher un champ equivalent a `SoilRuler_B` par voisinage binaire plutot que par texte exact.

## Audit de voisinage binaire des patrons `UpgradeB/C`

Les `8` assets analogues `UpgradeB/C` ont ete decodes et inspectes comme patrons de structure build-state.

Fichiers ajoutes :

- `work/diablo4-data-exporter/scripts/audit-sf33-upgrade-analogy-patterns.js`
- `work/diablo4-data-exporter/scripts/audit-sf33-build-state-neighborhood.js`
- `outputs/diablo4-sf33-upgrade-analogy-patterns/sf33-upgrade-analogy-patterns.json`
- `outputs/diablo4-sf33-build-state-neighborhood/sf33-build-state-neighborhood.json`

Resultat :

- assets `UpgradeB/C` inspectes : `8`
- assets avec flags `Mod.Upgrade*` autonomes : `2`
- references directes autonomes `Mod.Upgrade*` : `3`
- reference directe `Mod.SoilRuler_B` : `1`
- signature `Mod.SoilRuler_B` : `-16:16:24:24`
- signatures exactes identiques : `0`
- correspondances sur type/taille cible : `3`

Verdict :

- `build-state-flag-offset-triplet-pattern-found`
- `Mod.SoilRuler_B` partage un motif de table d'offsets avec des flags `Mod.Upgrade*` autonomes : offset precedent, offset du flag, offset suivant, avec type/taille cible `24`.
- Ce motif renforce l'hypothese que `Mod.SoilRuler_B` est manipule comme un flag build-state, mais il ne prouve pas encore la source gameplay ni l'uptime.
- Aucune promotion DPS : `promotionReady: false`, `buildStateReady: false`.

Integration :

- `audit-target-blockers` accepte maintenant `--sf33-build-state-neighborhood-audit`.
- `target-blocker-resolution.json` expose `evidenceSummary.sf33BuildStateNeighborhoodAssessment`.
- Le blocage `sf33-trigger-build-state-unmapped` remonte maintenant : `refs trigger 1`, `refs upgrade autonomes 3`, `type partage 3`.
- Prochaine action : parser les entrees de table d'offsets autour des refs directes pour nommer le champ build-state et verifier si `SoilRuler_B` est un flag declaratif ou seulement une reference locale.

## Parsing des entrees de table d'offsets `SF_33`

Un parseur dedie lit maintenant les entrees de table de `16` octets autour des references directes :

- `stringOffset`
- `typeOrSize`
- `zeroA`
- `zeroB`

Fichiers ajoutes :

- `work/diablo4-data-exporter/scripts/audit-sf33-offset-table-entries.js`
- `outputs/diablo4-sf33-offset-table-entries/sf33-offset-table-entries.json`

Resultat :

- fenetres parsees : `4`
- ancres propres : `4`
- `Mod.SoilRuler_B` est une entree `Mod.*` propre : oui
- les ancres `Mod.Upgrade*` autonomes sont des entrees `Mod.*` propres : oui
- type/taille de `Mod.SoilRuler_B` : `24`
- type/taille des ancres `Mod.Upgrade*` : `24`

Verdict :

- `offset-table-confirms-mod-flag-entry-shape`
- La table d'offsets confirme que `Mod.SoilRuler_B` occupe une entree `Mod.*` propre, de meme forme que les flags `Mod.Upgrade*` autonomes.
- Cela prouve une forme structurelle de flag, mais ne prouve pas encore la source gameplay qui active ce flag ni son uptime.
- Aucune promotion DPS : `promotionReady: false`, `buildStateReady: false`.

Integration :

- `audit-target-blockers` accepte maintenant `--sf33-offset-table-entries-audit`.
- `target-blocker-resolution.json` expose `evidenceSummary.sf33OffsetTableEntriesAssessment`.
- Le blocage `sf33-trigger-build-state-unmapped` remonte maintenant : `ancres propres 4`, `SoilRuler Mod oui`, `upgrades Mod oui`, `type 24`.
- Prochaine action : chercher la table ou le record parent qui consomme cette entree `Mod.SoilRuler_B` pour relier le flag a une option de build-state.

## Run parent local autour de `Mod.SoilRuler_B`

Un audit supplementaire parse le run contigu autour de l'entree `Mod.SoilRuler_B`, en utilisant la longueur alignee des blocs de la table d'offsets.

Fichiers ajoutes :

- `work/diablo4-data-exporter/scripts/audit-sf33-offset-table-parent-run.js`
- `outputs/diablo4-sf33-offset-table-parent-run/sf33-offset-table-parent-run.json`

Resultat :

- fenetres analysees : `4`
- run local `Mod.SoilRuler_B` contigu : oui
- runs locaux `Mod.Upgrade*` contigus : `3`
- bloc precedent cible : `binary-block`
- bloc ancre cible : `mod-flag-block`
- bloc suivant cible : `power-tag-block`
- bloc suivant cible : `PowerTag.SystemsTuningGlobals`

Verdict :

- `offset-table-parent-run-confirms-local-mod-flag-record`
- La table d'offsets de `Mod.SoilRuler_B` pointe vers un run local contigu : bloc precedent, bloc `Mod.SoilRuler_B`, puis bloc `PowerTag.SystemsTuningGlobals`.
- Cette preuve confirme le record local autour du flag, mais ne prouve pas encore si le run declare, lit ou active le flag.
- Aucune promotion DPS : `promotionReady: false`, `buildStateReady: false`.

Integration :

- `audit-target-blockers` accepte maintenant `--sf33-offset-table-parent-run-audit`.
- `target-blocker-resolution.json` expose `evidenceSummary.sf33OffsetTableParentRunAssessment`.
- Le blocage `sf33-trigger-build-state-unmapped` remonte maintenant : `run local oui`, `precedent binary-block`, `ancre mod-flag-block`, `suivant power-tag-block`.
- Prochaine action : identifier le sens du bloc precedent et du `PowerTag.SystemsTuningGlobals` voisin pour savoir si ce run declare, lit ou active le flag `SoilRuler_B`.

## Semantique du run parent `SF_33`

Un audit compare le trailer binaire du bloc `Mod.SoilRuler_B` avec les trailers des blocs `Mod.Upgrade*` autonomes.

Fichiers ajoutes :

- `work/diablo4-data-exporter/scripts/audit-sf33-parent-run-semantics.js`
- `outputs/diablo4-sf33-parent-run-semantics/sf33-parent-run-semantics.json`

Resultat :

- runs `Upgrade*` compares : `3`
- trailer `Mod.SoilRuler_B` : `5:90`
- trailers `Mod.Upgrade*` identiques : `3`
- voisins `PowerTag` : `2`
- voisins `SystemsTuningGlobals` : `2`
- correspondances exactes du prefixe `PowerTag` : `0`
- correspondances du bloc precedent : `0`

Verdict :

- `parent-run-semantics-confirm-mod-flag-read-context`
- Le run confirme une forme commune de lecture/contexte de flag `Mod.*`.
- Le trailer du bloc `Mod.SoilRuler_B` correspond aux trailers `Mod.Upgrade*`.
- Le voisin `SystemsTuningGlobals` doit rester un contexte global, pas une preuve d'activation gameplay.
- Aucune promotion DPS : `promotionReady: false`, `buildStateReady: false`.

Integration :

- `audit-target-blockers` accepte maintenant `--sf33-parent-run-semantics-audit`.
- `target-blocker-resolution.json` expose `evidenceSummary.sf33ParentRunSemanticsAssessment`.
- Le blocage `sf33-trigger-build-state-unmapped` remonte maintenant : `trailer 5:90`, `matches upgrade 3`, `voisins PowerTag 2`, `activation non prouvee`.
- Prochaine action : chercher une occurrence ou un record parent qui relie `Mod.SoilRuler_B` a une option de build-state nommee.

## Recherche de source nommee pour `Soil/Ruler`

Un scan large a ete lance sur les termes `Soil`, `Ruler`, `SoilRuler`, `Soil_Ruler`, `Soil Ruler` afin de verifier si une option de build-state nommee existe hors du record local.

Fichiers ajoutes :

- `outputs/diablo4-sf33-soil-ruler-name-search/external-target-search.json`
- `outputs/diablo4-sf33-soil-ruler-name-search/external-target-search-summary.json`
- `work/diablo4-data-exporter/scripts/audit-sf33-named-build-state-source.js`
- `outputs/diablo4-sf33-named-build-state-source/sf33-named-build-state-source.json`

Resultat :

- fichiers jeu scannes : `205`
- payloads `deadbeef` decodes : `13867`
- entrees trouvees : `1`
- groupes trouves : `3`
- asset courant nomme : `1663210`
- sources nommees externes : `0`
- dataset cible avec source nommee : non
- dataset prototype avec nom genere : oui
- schema exemple avec nom genere : oui

Verdict :

- `sf33-named-build-state-source-not-found`
- Aucune source nommee externe `Soil/Ruler` n'a ete trouvee.
- Les seules mentions exploitables restent le record local `1663210` et des artefacts generes par notre prototype/schema.
- Aucune promotion DPS : `promotionReady: false`, `buildStateReady: false`.

Integration :

- `audit-target-blockers` accepte maintenant `--sf33-named-build-state-source-audit`.
- `target-blocker-resolution.json` expose `evidenceSummary.sf33NamedBuildStateSourceAssessment`.
- Le blocage `sf33-trigger-build-state-unmapped` remonte maintenant : `hits nommes externes 0`, `asset courant 1`, `generated oui`.
- Prochaine action : clore la piste nommee locale et passer soit a une recherche binaire de record parent hors texte, soit au blocage uptime, sans activer `SF_33`.

## Inspection field-record du cluster `1663210`

Une commande CLI a ete ajoutee pour inspecter les records situes entre les chaines ASCII du payload decode, au lieu de regarder uniquement des fenetres de mots autour des chaines.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-field-records `
  --file outputs/diablo4-source-asset-1663210-payload/data.007.8265002.decoded.bin `
  --terms "0.3 * Table(34,Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate,PowerTag.Spiritborn_Talent_Ultimate_2,Mod.SoilRuler_B" `
  --out outputs/diablo4-source-asset-1663210-field-records
```

Fichier genere :

- `outputs/diablo4-source-asset-1663210-field-records/field-record-inspection.json`

Resultat :

- records selectionnes : `5`
- formule cible : offset `18872`
- hash bonus : offset `18948`
- ownership champ : `adjacent-record-cluster-not-field-owned`
- confiance : `high`
- blocage maintenu : `field-level-parser-required`

Preuves observees :

- la formule `0.3 * Table(34, sLevel)` est suivie de tokens typés :
  - opcode `6`, float `0.3` a l'offset `18900`
  - opcode `6`, float `34` a l'offset `18908`
  - opcode `5`, reference/field `1`
  - operateurs probables `add` puis `multiply`
- le hash `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` est adjacent a cette formule
- le suffixe du hash contient l'asset id courant `1663210`
- `Mod.SoilRuler_B` a toujours une reference directe a l'offset `16296`

Conclusion :

Les constantes `0.3` et `34` ne doivent plus etre interpretees comme une preuve directe que le hash bonus possede le champ `SF_32`. Elles se decodent plus proprement comme le bytecode suffixe de la formule `0.3 * Table(34, sLevel)`, situee juste avant le hash bonus. Le cluster reste tres pertinent, mais il faut maintenant parser les headers binaires autour des offsets `18844-19020` pour mapper explicitement : formule, bytecode, hash bonus et asset id.

Impact sur le diagnostic :

- le rapport `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json` integre cette preuve field-record
- le blocage `field-level-parser-required` reste actif
- la promotion DPS fiable reste impossible

Decision :

Cette inspection reduit l'ambiguite sans promouvoir le candidat. Le prochain travail doit etre un parser de headers/segments pour ce cluster, puis une comparaison avec d'autres records formule/hash similaires afin de comprendre la structure exacte.

## Inspection record-segments du cluster `1663210`

Une commande CLI a ete ajoutee pour comparer les segments binaires situes entre les chaines ASCII decodees du payload.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-record-segments `
  --file outputs/diablo4-source-asset-1663210-payload/data.007.8265002.decoded.bin `
  --out outputs/diablo4-source-asset-1663210-record-segments
```

Fichier genere :

- `outputs/diablo4-source-asset-1663210-record-segments/record-segment-inspection.json`

Resultat :

- segments inspectes : `60`
- cluster cible : `PowerTag -> formule bytecode -> hash bonus -> asset id`
- type de cluster : `formula-bytecode-plus-adjacent-hash-asset-cluster`
- confiance : `high`
- lien PowerTag detecte dans le payload : `2`
- promotion DPS fiable : toujours impossible

Segments importants :

- segment `49` : `PowerTag.Spiritborn_Talent_Ultimate_2."Script Formula 0"` vers `0.3 * Table(34, sLevel)`
- segment `50` : formule vers `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`, avec signature `f:0.3|f:34|ref:1|raw:1|op:add|op:multiply`
- segment `51` : hash bonus vers le voisin suivant, avec signature contenant `raw:1663210`

Conclusion :

Le cluster soutient fortement une relation structurelle entre le tag de pouvoir, la formule, le hash bonus et l'asset courant. En revanche, il ne prouve toujours pas que le hash bonus possede directement le champ `SF_32`. Le blocage `field-level-parser-required` reste donc actif.

Impact sur le diagnostic :

- `audit-target-blockers` accepte maintenant `--field-records` et `--record-segments`
- `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json` integre les deux familles de preuves
- le site affiche un resume `Record champ` et `Segments` dans le panneau `Diagnostic blocages`
- prochaine action : parser les headers binaires autour des offsets `18844-19020` pour mapper formule, bytecode, hash bonus et asset id comme champs explicites

Decision :

La resolution du blocage avance, mais reste volontairement conservative. Le candidat `1663210` reste en what-if bloque tant que les headers binaires ne prouvent pas le champ exact, le trigger et l'uptime.

## Inspection record-headers du cluster `1663210`

Une commande CLI a ete ajoutee pour inspecter explicitement les headers candidats autour du cluster deja repere.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-record-headers `
  --file outputs/diablo4-source-asset-1663210-payload/data.007.8265002.decoded.bin `
  --cluster-start 18844 `
  --cluster-end 19040 `
  --out outputs/diablo4-source-asset-1663210-record-headers
```

Fichier genere :

- `outputs/diablo4-source-asset-1663210-record-headers/record-header-inspection.json`

Resultat :

- headers candidats : `3`
- type de cluster : `power-tag-formula-bytecode-bonus-asset-headers`
- confiance : `high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Headers candidats :

- `PowerTag.Spiritborn_Talent_Ultimate_2."Script Formula 0"` vers `0.3 * Table(34, sLevel)` : lien PowerTag vers formule
- `0.3 * Table(34, sLevel)` vers `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` : bytecode compile de formule
- `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` vers le voisin suivant : suffixe contenant l'asset id `1663210`

Impact sur le diagnostic :

- `audit-target-blockers` accepte maintenant `--record-headers`
- le `proofState` du blocage `field-level-parser-required` contient maintenant :
  `adjacent-record-cluster-not-field-owned: high; formula-bytecode-plus-adjacent-hash-asset-cluster: high; power-tag-formula-bytecode-bonus-asset-headers: high, ownership not-proven`
- la prochaine action devient : comparer ces headers avec d'autres clusters formule/hash pour identifier le layout exact du champ bonus et isoler `SF_32`
- le site affiche maintenant une ligne `Headers` dans le panneau `Diagnostic blocages`

Decision :

La chaine structurelle est maintenant mieux prouvee, mais elle ne suffit toujours pas a promouvoir le candidat. Le DPS strict reste `163200`, le what-if bloque reste `212160`, et le delta candidat reste `48960`.

## Comparaison locale des header-patterns `1663210`

Une commande CLI a ete ajoutee pour comparer automatiquement les transitions de headers dans le payload decode.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js compare-record-header-patterns `
  --file outputs/diablo4-source-asset-1663210-payload/data.007.8265002.decoded.bin `
  --out outputs/diablo4-source-asset-1663210-header-patterns
```

Fichier genere :

- `outputs/diablo4-source-asset-1663210-header-patterns/record-header-pattern-comparison.json`

Resultat :

- chaines ASCII : `61`
- transitions inspectees : `60`
- transitions pertinentes : `21`
- groupes de signatures : `21`
- assessment : `candidate-cluster-matches-local-header-patterns`
- confiance : `medium-high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Preuves :

- le cluster candidat correspond aux familles locales `PowerTag -> formule`, `formule -> hash bytecode` et `hash -> asset`
- signature formule/hash cible : `f:0.3|f:34|ref:1|raw:1|op:add|op:multiply`
- couples formule/hash detectes dans ce payload : `1`
- couples hash/asset courant detectes dans ce payload : `1`
- transitions du cluster candidat : `3`

Impact sur le diagnostic :

- `audit-target-blockers` accepte maintenant `--record-header-patterns`
- le `proofState` du blocage `field-level-parser-required` inclut maintenant :
  `candidate-cluster-matches-local-header-patterns: medium-high, ownership not-proven`
- la prochaine action principale devient : etendre la comparaison a d'autres payloads contenant des couples formule/hash afin de trouver un motif repete de champ bonus
- le site affiche maintenant une ligne `Patterns` dans le panneau `Diagnostic blocages`

Decision :

La comparaison locale renforce la relation structurelle, mais ne suffit pas a isoler `SF_32`. Le payload `1663210` contient trop peu d'exemples comparables ; la prochaine etape doit chercher d'autres payloads avec couples formule/hash similaires avant toute promotion du candidat.

## Comparaison croisee des header-patterns `1663210` et `2302974`

Le comparateur de header-patterns a ete rendu reutilisable avec `--asset-ids`, puis applique au payload local de `assetId 2302974`, deja present dans les artefacts generes.

Commandes :

```powershell
node work/diablo4-data-exporter/d4export.js compare-record-header-patterns `
  --file outputs/diablo4-gameplay-candidates/data.004.20028655.decoded.bin `
  --asset-ids 2302974 `
  --out outputs/diablo4-source-asset-2302974-header-patterns

node work/diablo4-data-exporter/d4export.js compare-record-header-pattern-reports `
  --merge-files outputs/diablo4-source-asset-1663210-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-2302974-header-patterns/record-header-pattern-comparison.json `
  --out outputs/diablo4-cross-asset-header-patterns
```

Fichiers generes :

- `outputs/diablo4-source-asset-2302974-header-patterns/record-header-pattern-comparison.json`
- `outputs/diablo4-cross-asset-header-patterns/record-header-pattern-report-comparison.json`

Resultat `2302974` :

- chaines ASCII : `53`
- transitions inspectees : `52`
- transitions pertinentes : `12`
- groupes de signatures : `12`
- motif `hash -> asset courant` : present
- motif `formule -> hash bytecode` : non detecte
- promotion DPS fiable : `false`

Resultat croise :

- rapports compares : `2`
- assets : `1663210`, `2302974`
- signatures : `33`
- signatures exactes repetees : `0`
- assessment : `cross-payload-no-repeated-header-signature-yet`
- ownership champ : `not-proven`

Impact sur le diagnostic :

- `audit-target-blockers` accepte maintenant `--record-header-pattern-report`
- le site affiche maintenant une ligne `Cross` dans le panneau `Diagnostic blocages`
- la prochaine action du blocage `field-level-parser-required` devient : ajouter d'autres payloads decodes contenant des couples formule/hash pour obtenir au moins un motif repete comparable au cluster `1663210`

Decision :

Le croisement confirme que le suffixe `hash -> asset courant` n'est pas unique a `1663210`, mais il ne prouve toujours pas le layout exact de `SF_32`. Le candidat reste bloque : `3` blocages actifs, `0` resolu, promotion DPS fiable `false`.

## Plan de prochains payloads header-patterns

Une commande CLI a ete ajoutee pour transformer les rapports de recherche de cibles externes en file de payloads a decoder pour la comparaison cross-header.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js plan-record-header-payloads `
  --file outputs/diablo4-external-target-search/external-target-search.json `
  --out outputs/diablo4-record-header-payload-plan
```

Fichier genere :

- `outputs/diablo4-record-header-payload-plan/record-header-payload-plan.json`

Resultat :

- candidats : `8`
- deja decodes : `2`
- a decoder : `6`
- prochain asset recommande : `1953817`
- fichier source : `data.007`
- offset BLTE : `8270942`

Classement utile :

- `1663210` : reference deja couverte, `Spiritborn`, bonus cible present
- `2302974` : deja decode, motif `hash -> asset courant` present
- `1953817` : prochain a decoder ; contient `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` et `Bonus_Percent_Per_Power#Spiritborn_Feather_Spawn`
- `1461593` : bon candidat affixe/formule, mais moins cible pour le verrou Spiritborn

Decision :

La prochaine extraction ne doit pas partir sur un scan large. Le meilleur prochain payload est `assetId 1953817`, car il est proche de `1663210` dans `data.007`, touche le meme bonus Spiritborn cible, et peut fournir le motif repete qui manque pour avancer sur l'ownership de `SF_32`.

## Extension de la matrice cross-header a 6 rapports

Plusieurs payloads prioritaires ont ete decodes et compares au format header-patterns.

Payloads ajoutes :

- `1953817` : `data.007`, offset `8270942`, decode `8316` octets, `8` transitions pertinentes
- `1461593` : `data.045`, offset reporte `43688625`, offset BLTE corrige `43689641`, decode `3628` octets, `0` transition pertinente
- `493422` : `data.059`, offset `13184789`, decode `23368` octets, `9` transitions pertinentes
- `1882772` : `data.050`, offset `31781724`, decode `9912` octets, `1` transition pertinente

Resultat croise :

- rapports compares : `6`
- assets : `1663210`, `2302974`, `1953817`, `1461593`, `493422`, `1882772`
- signatures : `51`
- signatures exactes repetees : `0`
- assessment : `cross-payload-layout-families-repeat-without-exact-signature`
- confiance : `medium-low`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Familles repetees :

- `formula-bytecode-tail` : `4` rapports (`1663210`, `2302974`, `1953817`, `493422`)
- `hash-to-current-asset` : `4` rapports (`1663210`, `2302974`, `1953817`, `493422`)
- `to-hash-target` : `4` rapports (`2302974`, `1953817`, `493422`, `1882772`)
- `power-tag-to-formula` : `2` rapports (`1663210`, `1953817`)

Impact sur le diagnostic :

- le blocage `field-level-parser-required` reste actif
- la prochaine action principale devient : comparer les layouts normalises par famille, pas seulement les signatures exactes, pour isoler les champs stables du suffixe hash
- le DPS strict reste `163200`
- le what-if bloque reste `212160`
- la promotion DPS fiable reste `false`

Decision :

Le probleme n'est plus simplement le manque de payloads. Les familles structurelles se repetent bien, surtout `hash-to-current-asset`, mais les signatures exactes divergent a cause des constantes, refs et bytecodes propres a chaque asset. La prochaine etape doit donc normaliser les layouts de headers par roles et positions, puis comparer les champs stables du suffixe hash.

## Comparaison des layouts normalises de headers

Une commande CLI a ete ajoutee pour comparer les layouts par roles de tokens, au lieu de comparer les signatures exactes.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js compare-normalized-header-layouts `
  --merge-files outputs/diablo4-source-asset-1663210-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-2302974-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1953817-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1461593-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-493422-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1882772-header-patterns/record-header-pattern-comparison.json `
  --out outputs/diablo4-normalized-header-layouts
```

Fichier genere :

- `outputs/diablo4-normalized-header-layouts/normalized-header-layout-comparison.json`

Resultat :

- rapports : `6`
- transitions : `51`
- familles : `5`
- assessment : `normalized-hash-asset-layout-repeats`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Famille `hash-to-current-asset` :

- rapports : `4`
- assets : `1663210`, `2302974`, `1953817`, `493422`
- position stable detectee :
  - index `0` : `ref:0`, couverture `3/4`
  - index `1` : `raw`, couverture `3/4`
  - index `2` : `asset-id-raw`, couverture `3/4`

Exemples de layouts :

- `1663210` : `ref:0|raw|asset-id-raw|small-table-or-string-id|float`
- `2302974` : `ref:0|raw|asset-id-raw`
- `1953817` : `float|ref:0|raw|asset-id-raw|op:add|raw|float`
- `493422` : `ref:0|raw|asset-id-raw|asset-like-id|float|asset-like-id|float|raw|float|raw|float|small-table-or-string-id|float`

Impact sur le diagnostic :

- `audit-target-blockers` accepte maintenant `--normalized-header-layouts`
- le site affiche maintenant une ligne `Layout`
- le blocage `field-level-parser-required` indique maintenant `normalized-hash-asset-layout-repeats: medium, ownership not-proven`
- la prochaine action devient : trouver ou decoder d'autres transitions `formule -> hash`, car ce motif reste insuffisamment represente

Decision :

Le suffixe hash semble bien contenir un lien structurel stable vers l'asset courant. En revanche, cette preuve ne dit pas encore que le hash bonus possede `SF_32`, ni que le champ exact est isole. Le candidat `1663210` reste donc en what-if bloque.

## Fermeture de la premiere file de payloads header-patterns

La file issue de `outputs/diablo4-external-target-search/external-target-search.json` a ete entierement traitee.

Fichiers mis a jour :

- `outputs/diablo4-record-header-payload-plan/record-header-payload-plan.json`
- `outputs/diablo4-cross-asset-header-patterns/record-header-pattern-report-comparison.json`
- `outputs/diablo4-normalized-header-layouts/normalized-header-layout-comparison.json`
- `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json`

Resultat du plan :

- candidats : `8`
- deja decodes : `8`
- restant a decoder : `0`
- assets traites : `1663210`, `2302974`, `1953817`, `1461593`, `493422`, `1882772`, `2474146`, `1408295`

Corrections d'offsets pendant le decodage :

- `2474146` : offset source rapporte `10279789`, BLTE reel utilise `10278255`
- `1408295` : offset source rapporte `19293246`, BLTE reel utilise `19293952`

Comparaison croisee finale :

- rapports : `8`
- signatures : `51`
- signatures exactes repetees : `0`
- assessment : `cross-payload-layout-families-repeat-without-exact-signature`
- ownership champ : `not-proven`

Comparaison finale des layouts normalises :

- rapports : `8`
- transitions : `51`
- familles : `5`
- assessment : `normalized-hash-asset-layout-repeats`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Conclusion :

Les deux nouveaux payloads (`2474146`, `1408295`) n'ajoutent pas de transition pertinente. Le motif `hash-to-current-asset` reste utile et repete dans `4` rapports, avec une position `asset-id-raw` recurrente. En revanche, le motif critique `formula-to-hash-bytecode` reste represente seulement par `1663210`.

Decision :

Le blocage `field-level-parser-required` reste actif. Le DPS strict de `1663210` reste `163200`, le what-if bloque reste `212160`, et la promotion en DPS fiable reste interdite tant que le champ exact `SF_32`, le trigger `SF_33` et l'uptime ne sont pas prouves.

## Minage local des couples formule/hash candidats

Une commande CLI a ete ajoutee pour exploiter les exports de chaines deja disponibles et reperer les couples adjacents `formule -> hash`, sans relancer de scan sur les fichiers du jeu.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js mine-formula-hash-candidates `
  --file outputs/diablo4-gameplay-string-search/deadbeef-string-search.json `
  --out outputs/diablo4-formula-hash-candidates
```

Fichiers generes :

- `outputs/diablo4-formula-hash-candidates/formula-hash-candidates.json`
- `outputs/diablo4-formula-hash-candidates/formula-hash-candidates-summary.json`

Resultat :

- candidats visibles : `5`
- payloads deja decodes : `5`
- a decoder : `0`
- couples formule/hash forts : `3`
- couples valides par headers : `1`
- assessment : `string-visible-formula-hash-candidates-need-header-validation`
- confiance : `low`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Candidats :

- `1663210` : `0.3 * Table(34, sLevel)` -> `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
  - validation headers : `validated-formula-to-hash-bytecode`
- `1461593` : `SF_4 * Table(34, 3) * 100` -> `Affix_Flat_Value_1#Helm_Unique_Necro_100`
  - validation headers : `not-seen-in-header-report`
- `493422` : `0.005 * Table(34,sLevel)` -> `Power_Duration_Bonus_Pct#Necromancer_BloodMist`
  - validation headers : `not-seen-in-header-report`
- `1953817` : `PowerTag.SystemsTuningGlobals."Script Formula 0"` -> `1 + Spiritborn_Spirit_Bonus#spiritborn_eagle_sun_passive_alternate`
  - validation headers : `not-seen-in-header-report`
- `2302974` : `PowerTag.Paladin_Trinity_Cast_3."Script Formula 9"` -> `Chance_For_Double_Damage_Per_Power#Paladin_Trinity`
  - validation headers : `seen-but-not-formula-to-hash-bytecode`

Conclusion :

Le minage confirme qu'il existe d'autres couples visibles dans les chaines, mais ils ne produisent pas encore de transitions `formula-to-hash-bytecode` dans les rapports de headers existants. La seule transition valide reste celle de `1663210`.

Decision :

Ne pas changer le diagnostic de promotion. Le prochain travail doit inspecter pourquoi les couples visibles `1461593`, `493422`, `1953817` et `2302974` ne sont pas valides par headers : offset corrige, segment trop large, PowerTag intermediaire, ou classification de token insuffisante.

## Correction du statut decode des payloads candidats

Le plan de payloads a ete durci : un fichier decode trouve par asset/fichier ne suffit plus. Il doit aussi contenir au moins une chaine attendue du rapport source, sinon il est marque comme mismatch.

Fichiers mis a jour :

- `work/diablo4-data-exporter/d4export.js`
- `outputs/diablo4-record-header-payload-plan/record-header-payload-plan.json`
- `outputs/diablo4-formula-hash-candidates/formula-hash-candidates.json`

Resultat corrige du plan header-patterns :

- candidats : `8`
- decodes utilisables : `5`
- a redecode/valider : `3`
- prochain asset : `1461593`

Payloads marques mismatch :

- `1461593` : offset source `43688625`, payload voisin compare `43689641`
- `2474146` : offset source `10279789`, payload voisin compare `10278255`
- `1408295` : offset source `19293246`, payload voisin compare `19293952`

Cas `1461593` :

- les chaines du rapport source indiquent :
  - `SF_4 * Table(34, 3) * 100`
  - `Affix_Flat_Value_1#Helm_Unique_Necro_100`
- le payload decode disponible `data.045.43689641.decoded.bin` ne contient aucune de ces deux chaines
- le rapport header-patterns de `1461593` a donc compare un payload qui n'est pas le bon support des chaines gameplay

Impact sur le minage formule/hash :

- candidats visibles : `5`
- couples formule/hash forts : `3`
- decodes utilisables : `4`
- a decoder : `1` (`1461593`)
- couples valides par headers : `1` (`1663210`)

Matrices regenerees avec les seuls rapports utilisables :

- rapports header-patterns utilises : `5`
- assets utilises : `1663210`, `2302974`, `1953817`, `493422`, `1882772`
- signatures : `51`
- signatures exactes repetees : `0`
- layouts normalises : `5` familles, `51` transitions
- audit blocages : `3` blocages actifs, `0` resolu, promotion DPS fiable `false`

Decision :

La matrice cross-header ne doit plus utiliser `1461593`, `2474146` et `1408295` comme preuves decodees tant que les payloads exacts ne sont pas redecodees ou qu'un mapping offset-source -> BLTE exact n'est pas prouve. Le blocage `field-level-parser-required` reste actif.

## Verification source locale de `1461593` et ajout du candidat courant `309070`

Le fichier local actuel `C:\Program Files (x86)\Diablo IV\Data\data\data.045` est lisible, mais ne correspond plus a la preuve historique `1461593`.

Verifications effectuees :

- tentative de decodage direct a `data.045` offset `43688625` : echec, ce n'est pas un payload `BLTE`
- recherche des `BLTE` voisins autour de `43688625` : plusieurs voisins trouves, dont `43689641`, mais aucun ne contient les chaines cible
- recherche de la cle locale historique `00000000000000383a5271965f09cbee` dans `data.045` actuel : absente
- scan complet de `data.045` actuel : aucun payload ne contient `SF_4 * Table(34, 3) * 100`, `Affix_Flat_Value_1#Helm_Unique_Necro_100`, ni `Necromancer_Talent_Caster_T3_N1`

Conclusion `1461593` :

La preuve issue de `data.045` offset `43688625` est stale pour l'installation courante. Elle reste utile comme trace historique du dataset, mais elle ne doit pas etre utilisee dans la matrice cross-header actuelle tant que le nouveau mapping exact n'est pas retrouve.

Scan global actuel :

Un scan cible sur tous les `data.xxx` actuels avec les termes proches de `1461593` n'a pas retrouve `1461593`, mais a trouve un payload courant exploitable :

- `assetId 309070`
- fichier : `data.006`
- offset : `194851`
- decoded bytes : `9560`
- formule/hash visible :
  - `SF_8 * Table(34,3) * 100`
  - `Min(1.5, 1 + (AoE_Size_Bonus_Per_Power#Druid_Maul / 2))`

Header-patterns `309070` :

- transitions pertinentes : `10`
- groupes de signatures : `10`
- assessment : `local-formula-hash-asset-patterns-found`
- confiance : `medium`
- `formula-to-hash-bytecode` : present
- `hash-to-current-asset` : present
- promotion DPS fiable : `false`

Transition valide ajoutee :

- `SF_8 * Table(34,3) * 100` -> `Min(1.5, 1 + (AoE_Size_Bonus_Per_Power#Druid_Maul / 2))`
- signature : `ref:14|f:34|f:3|raw:1|op:add|op:multiply|f:100|op:multiply|raw:12339|f:30`

Matrices regenerees :

- rapports utilisables : `6`
- assets : `1663210`, `2302974`, `1953817`, `493422`, `1882772`, `309070`
- signatures : `61`
- signatures exactes repetees : `0`
- familles : `5`
- transitions normalisees : `61`
- `formula-to-hash-bytecode` est maintenant represente par `1663210` et `309070`
- `hash-to-current-asset` est represente par `5` assets

Impact diagnostic :

- le blocage `field-level-parser-required` reste actif
- `promotionReady` reste `false`
- la prochaine action devient plus precise : comparer le layout normalise des deux transitions `formula-to-hash-bytecode` validees avec les suffixes `hash-to-current-asset`

Decision :

On ne promeut rien. `309070` sert de deuxieme preuve structurelle pour etudier le layout, tandis que `1461593` est retire des preuves courantes jusqu'a ce que son mapping exact soit retrouve.

## Focus layout `formula-to-hash` et `hash-to-asset`

Une commande CLI dediee a ete ajoutee pour comparer uniquement les transitions utiles au blocage `field-level-parser-required`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js compare-formula-hash-layouts `
  --merge-files outputs/diablo4-source-asset-1663210-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-2302974-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1953817-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-493422-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1882772-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-309070-header-patterns/record-header-pattern-comparison.json `
  --out outputs/diablo4-formula-hash-layout-focus
```

Fichiers generes :

- `outputs/diablo4-formula-hash-layout-focus/formula-hash-layout-focus.json`
- `outputs/diablo4-formula-hash-layout-focus/formula-hash-layout-focus-summary.json`

Resultat :

- rapports : `6`
- transitions focus : `8`
- rapports `formula-to-hash` : `2`
- rapports `hash-to-asset` : `5`
- assessment : `formula-hash-and-hash-asset-anchors-found`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Ancres communes :

- `formula-to-hash` : `float`, `float`, `one`, `op:add`, `op:multiply`
- `hash-to-current-asset` : `ref:0`, `raw`, `asset-id-raw`

Positions stables `formula-to-hash` :

- index `1` : `float`, couverture `2/2`
- index `3` : `one`, couverture `2/2`
- index `4` : `op:add`, couverture `2/2`
- index `5` : `op:multiply`, couverture `2/2`

Interpretation :

Le noyau opcode commun renforce l'idee que les constantes `0.3` et `34` de `1663210` appartiennent au bytecode de la formule qui precede le hash. Le suffixe hash possede bien un ancrage ordonne vers l'asset courant (`ref:0`, `raw`, `asset-id-raw`), mais cela ne prouve toujours pas que le hash possede directement `SF_32`.

Impact diagnostic :

- `audit-target-blockers` accepte maintenant `--formula-hash-layout-focus`
- le blocage `field-level-parser-required` inclut `formula-hash-and-hash-asset-anchors-found: medium, ownership not-proven`
- la prochaine action devient : parser les champs autour du noyau `one/add/multiply` et comparer le suffixe hash adjacent pour distinguer bytecode de formule et metadata du hash
- le site affiche maintenant une ligne `Focus`

Decision :

Le candidat `1663210` reste en what-if bloque. Cette etape donne un meilleur point d'attaque pour le parser champ par champ, mais ne suffit pas a promouvoir le DPS fiable.

## Inspection des frontieres formule/hash/asset

Une commande CLI dediee a ete ajoutee pour transformer le focus layout en diagnostic de frontieres.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-formula-hash-field-boundaries `
  --merge-files outputs/diablo4-source-asset-1663210-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-2302974-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1953817-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-493422-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1882772-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-309070-header-patterns/record-header-pattern-comparison.json `
  --out outputs/diablo4-formula-hash-field-boundaries
```

Fichiers generes :

- `outputs/diablo4-formula-hash-field-boundaries/formula-hash-field-boundaries.json`
- `outputs/diablo4-formula-hash-field-boundaries/formula-hash-field-boundaries-summary.json`

Resultat :

- transitions focus : `8`
- noyaux opcode formule : `2/2`
- ancres hash/asset : `6/6`
- assessment : `formula-bytecode-and-hash-suffix-separated`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Impact diagnostic :

- `audit-target-blockers` accepte maintenant `--formula-hash-field-boundaries`
- le blocage `field-level-parser-required` inclut `formula-bytecode-and-hash-suffix-separated: medium, ownership not-proven`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- le site affiche maintenant une ligne `Frontiere`

Decision :

Le bytecode de formule et le suffixe hash/asset sont mieux separes, mais aucun champ `SF_32` n'est encore attribue comme proprietaire. La prochaine etape est de lire les octets de header immediatement avant chaque transition pour identifier les compteurs ou tailles de champs, toujours sans promotion DPS fiable.

## Inspection des preludes de header

Une commande CLI dediee a ete ajoutee pour lire les octets immediatement avant chaque transition `formula-to-hash-bytecode` et `hash-to-current-asset`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-formula-hash-header-preludes `
  --merge-files outputs/diablo4-source-asset-1663210-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-2302974-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1953817-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-493422-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1882772-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-309070-header-patterns/record-header-pattern-comparison.json `
  --read-bytes 128 `
  --out outputs/diablo4-formula-hash-header-preludes
```

Fichiers generes :

- `outputs/diablo4-formula-hash-header-preludes/formula-hash-header-preludes.json`
- `outputs/diablo4-formula-hash-header-preludes/formula-hash-header-preludes-summary.json`

Resultat :

- transitions inspectees : `8`
- transitions lisibles : `8/8`
- fenetre lue : `128` octets avant transition
- assessment : `header-prelude-prologue-before-string-classified`
- confiance : `medium-low`
- marqueurs stables par offset : `0`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Motifs de sequences detectes :

- `formula-to-hash-bytecode` : `small-counter-or-length, small-counter-or-length, asset-like-id`, repete dans `1663210` et `309070`
- `hash-to-current-asset` : plusieurs motifs courts autour de `small-table-or-string-id` et `small-counter-or-length`, repetes sur plusieurs assets

Classement des fenetres :

- le motif `formula-to-hash-bytecode` repete est classe `before-from-string` dans `1663210` et `309070`
- pour `1663210`, la fenetre du motif est `18848-18860`, soit `24` octets avant la formule source `0.3 * Table(34, sLevel)`
- pour `309070`, la fenetre du motif est `7264-7292`, soit `76` octets avant la formule source `SF_8 * Table(34,3) * 100`
- interpretation : ce motif ressemble plus a un prologue de record qu'au bytecode situe entre la formule et le hash

Comparaison prologue/string :

- `1663210` : la zone `18872 -> 18895` est `0.3 * Table(34, sLevel)`, `printableRatio 1`, et la zone apres string avant transition vaut `0` octet
- `309070` : la zone `7340 -> 7364` est `SF_8 * Table(34,3) * 100`, `printableRatio 1`, et la zone apres string avant transition vaut `0` octet
- interpretation : entre la string source et la transition il n'y a pas de zone binaire autonome ; le motif repete est donc bien avant la string source

Impact diagnostic :

- `audit-target-blockers` accepte maintenant `--formula-hash-header-preludes`
- le blocage `field-level-parser-required` inclut `header-prelude-prologue-before-string-classified: medium-low, ownership not-proven`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- le site affiche maintenant une ligne `Prelude`

Decision :

La fenetre elargie a `128` octets avant transition montre des petits marqueurs locaux. Ils ne sont pas alignes de facon stable par offset, mais des motifs ordonnes se repetent et peuvent maintenant etre classes par rapport aux bornes de strings. La comparaison montre que le motif `formula-to-hash` repete appartient au prologue avant la string source ; la zone jusqu'a la transition est simplement le texte ASCII de la formule. La suite est donc d'inspecter les octets apres la transition pour relier explicitement bytecode de formule, hash cible et suffixe asset, sans promouvoir le DPS fiable.

## Cartographie post-transition formule/hash/asset

Le rapport `formula-hash-field-boundaries` a ete enrichi avec une carte de zones :

- string source
- zone post-transition tokenisee
- string cible

Resultat :

- assessment : `formula-bytecode-and-hash-asset-zones-linked`
- confiance : `medium-high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`
- `formulaZonesLinked` : `true`
- `hashZonesLinked` : `true`

Exemple `1663210` :

- string source : `0.3 * Table(34, sLevel)` aux offsets `18872-18895`
- zone post-transition : `18895-18948`
- roles tokenises : `float, float, ref:1, one, op:add, op:multiply`
- interpretation : `formula-bytecode-before-target-hash`
- string cible : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` aux offsets `18948-19001`

Suffixe hash `1663210` :

- string source : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` aux offsets `18948-19001`
- zone post-transition : `19001-19044`
- roles tokenises : `ref:0, raw, asset-id-raw, small-table-or-string-id, float`
- interpretation : `hash-metadata-suffix-before-next-string`
- string cible : `(1-POW(1-SF_28/100,1/2))*100` a partir de `19044`

Impact diagnostic :

- le blocage `field-level-parser-required` inclut maintenant `formula-bytecode-and-hash-asset-zones-linked: medium-high, ownership not-proven`
- les blocages restent `3/3` actifs, avec `promotionReady: false`

Decision :

La structure locale est maintenant mieux mappee : prologue avant string, string source, bytecode ou suffixe post-transition, puis string cible. Cela ne prouve toujours pas que `SF_32` est le champ proprietaire. La suite est de comparer les valeurs du suffixe hash avec les definitions externes candidates pour identifier le champ exact de bonus, sans promotion DPS.

## Comparaison suffixe hash / definitions

Une commande CLI dediee a ete ajoutee pour comparer les valeurs du suffixe `hash-to-current-asset` avec les cibles de definition conditionnelles.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js compare-hash-suffix-definitions `
  --formula-hash-field-boundaries outputs/diablo4-formula-hash-field-boundaries/formula-hash-field-boundaries.json `
  --definition-search outputs/diablo4-conditional-definition-search/conditional-definition-search.json `
  --out outputs/diablo4-hash-suffix-definition-links
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-definition-links/hash-suffix-definition-links.json`
- `outputs/diablo4-hash-suffix-definition-links/hash-suffix-definition-links-summary.json`

Resultat :

- suffixes hash compares : `6`
- cibles de definition reliees : `1`
- definitions externes exactes : `0`
- liens limites a l'asset courant : `1`
- assessment : `hash-suffix-current-asset-context-only`
- confiance : `medium-low`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Detail `1663210` :

- hash cible : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
- definition actuelle : `exact-target-only-current-asset`
- suffixe : `ref:0, raw, asset-id-raw, small-table-or-string-id, float`
- valeur confirmee : `asset-id-raw = 1663210`
- valeurs candidates non resolues : `raw 949`, `small-table-or-string-id 12337`, `float 10`

Impact diagnostic :

- le blocage `field-level-parser-required` inclut maintenant `hash-suffix-current-asset-context-only: medium-low, ownership not-proven`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- le site affiche maintenant une ligne `Suffixe`

Decision :

Le suffixe hash confirme le contexte d'asset courant, mais il ne fournit pas encore la definition externe exacte du bonus. Les valeurs candidates du suffixe doivent etre decodees ou reliees a une definition externe avant toute promotion DPS.

## Analyse des motifs de valeurs du suffixe hash

Une commande CLI dediee a ete ajoutee pour separer les valeurs de suffixe utiles des fragments generiques de formule.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js analyze-hash-suffix-value-patterns `
  --formula-hash-field-boundaries outputs/diablo4-formula-hash-field-boundaries/formula-hash-field-boundaries.json `
  --out outputs/diablo4-hash-suffix-value-patterns
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-value-patterns/hash-suffix-value-patterns.json`
- `outputs/diablo4-hash-suffix-value-patterns/hash-suffix-value-patterns-summary.json`

Resultat :

- suffixes analyses : `6`
- ancrages asset courant : `5`
- constantes candidates repetees localement : `6`
- constantes candidates repetees entre assets : `0`
- assessment : `hash-suffix-patterns-asset-context-with-local-candidates`
- confiance : `low`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Detail `1663210` :

- hash cible : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
- suffixe : `ref:0, raw, asset-id-raw, small-table-or-string-id, float`
- valeurs : `0`, `949`, `1663210`, `12337`, `10`
- valeur confirmee : `asset-id-raw = 1663210`
- valeurs candidates encore locales : `949`, `12337`, `10`

Impact diagnostic :

- le blocage `field-level-parser-required` inclut maintenant `hash-suffix-patterns-asset-context-with-local-candidates: low, ownership not-proven`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- le site affiche maintenant une ligne `Motifs suffixe`

Decision :

Les valeurs `949`, `12337` et `10` ne peuvent pas encore etre nommees comme champ de bonus. La suite est de les relier a des tables, ids de strings ou champs de records, ou d'elargir l'echantillon de transitions hash comparables. Aucun DPS what-if n'est promu.

## Analyse semantique candidate du suffixe hash

Une commande CLI dediee a ete ajoutee pour decrire les suffixes `hash-to-current-asset` sous forme de positions candidates : selecteur, asset courant, metadata id et metadata float.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js analyze-hash-suffix-candidate-semantics `
  --formula-hash-field-boundaries outputs/diablo4-formula-hash-field-boundaries/formula-hash-field-boundaries.json `
  --out outputs/diablo4-hash-suffix-candidate-semantics
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-candidate-semantics/hash-suffix-candidate-semantics.json`
- `outputs/diablo4-hash-suffix-candidate-semantics/hash-suffix-candidate-semantics-summary.json`

Resultat :

- suffixes analyses : `6`
- ancres asset courant : `6`
- triplets selecteur/asset/metadata : `2`
- selecteurs repetes : `0`
- metadata ids repetes : `0`
- metadata floats repetes : `0`
- assessment : `hash-suffix-semantic-triplets-local-only`
- confiance : `low`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Detail `1663210` :

- hash cible : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
- famille : `bonus-percent-per-power`
- selecteur candidat : `949`
- ancre asset : `1663210`
- metadata id candidat : `12337`
- metadata float candidat : `10`
- hypothese : `selector-asset-metadata-triplet`

Comparables utiles :

- `493422` : selecteur `991`, asset `493422`, metadata `12343 / 70`
- `309070` : selecteur `992`, asset `309070`, metadata float `2`
- `2302974` : selecteur encode high-bit `2147483816`, normalise `168`
- `1953817` : selecteur encode high-bit `2147483794`, normalise `146`
- `309070` : selecteur encode high-bit `2147483801`, normalise `153`

Impact diagnostic :

- le blocage `field-level-parser-required` inclut maintenant `hash-suffix-semantic-triplets-local-only: low, ownership not-proven`
- la prochaine action prioritaire devient : construire ou retrouver le dictionnaire des selecteurs de suffixe et des metadata ids
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- le site affiche maintenant une ligne `Semantique suffixe`

Decision :

`949` est maintenant traite comme selecteur de suffixe candidat, et `12337 / 10` comme paire metadata candidate. Cela clarifie la structure mais ne prouve toujours pas la semantique gameplay ni le champ exact du bonus. Aucun DPS what-if n'est promu.

## Minage local du dictionnaire de suffixe hash

Une commande CLI dediee a ete ajoutee pour relire les payloads `.decoded.bin` deja connus et chercher toutes les ancres locales `selecteur -> asset courant -> metadata`. Elle sait maintenant aussi scanner largement les `.decoded.bin` disponibles dans `outputs`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js mine-hash-suffix-dictionary `
  --formula-hash-field-boundaries outputs/diablo4-formula-hash-field-boundaries/formula-hash-field-boundaries.json `
  --data-dir outputs `
  --out outputs/diablo4-hash-suffix-dictionary-mining
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-dictionary-mining/hash-suffix-dictionary-mining.json`
- `outputs/diablo4-hash-suffix-dictionary-mining/hash-suffix-dictionary-mining-summary.json`

Resultat :

- rapports sources relus : `6`
- scans larges avec ancres : `6`
- ancres dedupliquees : `19`
- ancres suffixe probables : `9`
- selecteurs distincts : `8`
- metadata ids distincts : `2`
- selecteurs repetes : `1` (`selector 949`)
- metadata ids repetes : `1` (`12337`)
- assessment : `hash-suffix-dictionary-repeated-candidates-found`
- confiance : `low`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Ancres probables :

- `1663210` : `selector 949`, metadata `12337 / 10`, encodage `id + opcode 6 + float`
- `1953817` : `selector 949`, cible `1 + Bonus_Percent_Per_Power#Spiritborn_Feather_Spawn`
- `1882772` : `selector 1126`, asset-like `1882770`, metadata `12337 / 10`, cible `Affix_Value_1#S05_BSK_Generic_001 / 100`
- `493422` : `selector 991`, metadata `12343 / 70`, encodage `id + opcode 6 + float`
- `309070` : `selector 992`, sans metadata id retenu
- `309070` : `selector 153`, sans metadata id retenu
- `2302974` : `selector 168`, sans metadata id retenu
- `1953817` : `selector 146`, sans metadata id retenu

Impact diagnostic :

- le blocage `field-level-parser-required` inclut maintenant `hash-suffix-dictionary-repeated-candidates-found: low, ownership not-proven`
- la prochaine action prioritaire devient : scanner davantage de payloads ou relier les selecteurs/mined metadata a des strings nommees
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- le site affiche maintenant une ligne `Dico suffixe`

Decision :

Le minage confirme maintenant une repetition utile : `selector 949` est associe a deux cibles `Bonus_Percent_Per_Power`, et `metadata 12337 / 10` apparait dans deux assets. Cela renforce la piste dictionnaire, mais aucun libelle externe ne nomme encore `949` ou `12337`. Aucune promotion DPS n'est autorisee.

## Synthese famille du suffixe hash

Une commande CLI dediee a ete ajoutee pour transformer le gros rapport de minage en preuve lisible par famille de hash.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js summarize-hash-suffix-family-evidence `
  --hash-suffix-dictionary-mining outputs/diablo4-hash-suffix-dictionary-mining/hash-suffix-dictionary-mining.json `
  --out outputs/diablo4-hash-suffix-family-evidence
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-family-evidence/hash-suffix-family-evidence.json`
- `outputs/diablo4-hash-suffix-family-evidence/hash-suffix-family-evidence-summary.json`

Resultat :

- selecteurs synthetises : `8`
- metadata ids synthetises : `2`
- assessment : `selector-family-and-metadata-repeat-found`
- confiance : `medium-low`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Preuve cible :

- `selector 949`
  - occurrences : `2`
  - assets : `2`
  - famille dominante : `bonus-percent-per-power`
  - exemples : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`, `Bonus_Percent_Per_Power#Spiritborn_Feather_Spawn`
  - hypothese : `selector 949` candidat pour la famille `Bonus_Percent_Per_Power`

- `metadata 12337`
  - occurrences : `2`
  - assets : `2`
  - float associe : `10`
  - exemples : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`, `Affix_Value_1#S05_BSK_Generic_001 / 100`
  - hypothese : metadata repetee avec float `10`

Impact diagnostic :

- le blocage `field-level-parser-required` inclut maintenant `selector-family-and-metadata-repeat-found: medium-low, ownership not-proven`
- la prochaine action prioritaire devient : trouver une source nommee pour `selector 949` ou verifier davantage de `Bonus_Percent_Per_Power`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- le site affiche maintenant une ligne `Famille suffixe`

Decision :

`selector 949` est maintenant un candidat fort pour la famille `Bonus_Percent_Per_Power`, mais le dictionnaire n'est pas encore nomme par une source externe. Ce niveau de preuve aide le parser, mais ne suffit pas a promouvoir le DPS fiable.

## Audit des sources nommees du suffixe hash

Une commande CLI dediee a ete ajoutee pour verifier si les artefacts JSON actuels contiennent une source nommee independante pour `selector 949` ou `metadata 12337`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js audit-hash-suffix-source-names `
  --hash-suffix-family-evidence outputs/diablo4-hash-suffix-family-evidence/hash-suffix-family-evidence.json `
  --data-dir outputs `
  --out outputs/diablo4-hash-suffix-source-name-audit
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-source-name-audit/hash-suffix-source-name-audit.json`
- `outputs/diablo4-hash-suffix-source-name-audit/hash-suffix-source-name-audit-summary.json`

Resultat :

- fichiers JSON scannes : `178`
- fichiers avec hits : `115`
- fichiers avec numerique + famille : `33`
- contextes nommes candidats : `1`
- assessment : `generated-source-name-like-contexts-only`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Interpretation :

Le seul contexte nomme candidat est dans `outputs/diablo4-source-asset-1663210-header-patterns/record-header-pattern-comparison.json`, donc dans un artefact genere. Il confirme le voisinage `ref:0|raw:949|raw:1663210|raw:12337|f:10` avec `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`, mais il ne fournit pas un dictionnaire source independant.

Impact diagnostic :

- le blocage `field-level-parser-required` inclut maintenant `generated-source-name-like-contexts-only: medium, ownership not-proven`
- la prochaine action prioritaire devient : chercher ou decoder une table/dictionnaire source des selecteurs de suffixe
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- le site affiche maintenant une ligne `Source suffixe`

Decision :

`949/12337` restent des preuves locales utiles pour guider le parser, mais non promotables. Aucune valeur what-if n'est integree au DPS fiable tant qu'une source nommee ou un parser champ par champ ne prouve pas l'ownership exact.

## Audit binaire des sources du suffixe hash

Une commande CLI dediee a ete ajoutee pour chercher `selector 949` et `metadata 12337` directement dans les fichiers `.decoded.bin`, puis classifier les chaines ASCII voisines.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js audit-hash-suffix-binary-sources `
  --hash-suffix-family-evidence outputs/diablo4-hash-suffix-family-evidence/hash-suffix-family-evidence.json `
  --data-dir outputs `
  --out outputs/diablo4-hash-suffix-binary-source-audit
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-binary-source-audit/hash-suffix-binary-source-audit.json`
- `outputs/diablo4-hash-suffix-binary-source-audit/hash-suffix-binary-source-audit-summary.json`

Resultat :

- fichiers `.decoded.bin` scannes : `22`
- fichiers avec hits : `6`
- hits numeriques : `14`
- hits proches de la famille `Bonus_Percent_Per_Power` : `5`
- hits dictionnaire nomme : `0`
- assessment : `binary-family-contexts-without-dictionary-name`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Observations utiles :

- `1663210` contient `949` et `12337` pres de `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
- `1953817` contient `949` pres de `1 + Bonus_Percent_Per_Power#Spiritborn_Feather_Spawn`
- les autres occurrences de `12337` montrent des motifs numeriques `id + opcode 6 + float`, mais pas de libelle de dictionnaire source

Impact diagnostic :

- le blocage `field-level-parser-required` inclut maintenant `binary-family-contexts-without-dictionary-name: medium, ownership not-proven`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- le site affiche maintenant une ligne `Binaire suffixe`

Decision :

Le scan binaire renforce la piste famille pour `949/12337`, mais il ne trouve pas de dictionnaire nomme. La prochaine etape est de comparer davantage de cibles `Bonus_Percent_Per_Power` et de parser les structures binaires autour des hits avant toute promotion DPS.

## Comparaison binaire des contextes suffixe

Une commande CLI dediee a ete ajoutee pour aligner les hits binaires autour de `selector 949` et `metadata 12337` sur les assets de famille `Bonus_Percent_Per_Power`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js compare-hash-suffix-binary-contexts `
  --hash-suffix-binary-source-audit outputs/diablo4-hash-suffix-binary-source-audit/hash-suffix-binary-source-audit.json `
  --out outputs/diablo4-hash-suffix-binary-context-comparison
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-binary-context-comparison/hash-suffix-binary-context-comparison.json`
- `outputs/diablo4-hash-suffix-binary-context-comparison/hash-suffix-binary-context-comparison-summary.json`

Resultat :

- assets compares : `2`
- signatures selecteur : `2`
- signatures metadata : `3`
- triplets compacts : `1`
- assessment : `binary-context-selector-repeats-but-layout-diverges`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Comparaison utile :

- `1663210` / `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
  - `949 -> 1663210 -> 0 -> 0 -> 12337 -> opcode 6 -> float 10`
  - metadata `12337` a `+16` octets du selecteur
  - relation : `selector et metadata sont dans le meme suffixe compact`

- `1953817` / `1 + Bonus_Percent_Per_Power#Spiritborn_Feather_Spawn`
  - `949 -> asset-like 1975049 -> 0 -> 11 -> 0 -> 0 -> -1`
  - metadata `12337 / 10` a `-240` octets du selecteur
  - relation : `selector et metadata existent dans le meme asset mais pas dans le meme suffixe compact`

Impact diagnostic :

- le blocage `field-level-parser-required` inclut maintenant `binary-context-selector-repeats-but-layout-diverges: medium, ownership not-proven`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- le site affiche maintenant une ligne `Comparaison suffixe`

Decision :

Le selecteur `949` est bien repete sur la famille `Bonus_Percent_Per_Power`, mais le layout n'est pas stable entre les deux assets compares. Cela interdit d'attribuer automatiquement `12337 / 10` au suffixe `949` pour le DPS fiable. Il faut decoder ou identifier d'autres cibles `Bonus_Percent_Per_Power`, puis parser le champ exact.

## Couverture de l'echantillon Bonus_Percent_Per_Power

Une commande CLI dediee a ete ajoutee pour verifier si l'echantillon local contient encore des cibles `Bonus_Percent_Per_Power` non comparees.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js summarize-bonus-percent-sample-coverage `
  --graphs-file outputs/diablo4-formula-graphs/formula-graphs.json `
  --record-header-payload-plan outputs/diablo4-record-header-payload-plan/record-header-payload-plan.json `
  --hash-suffix-binary-context-comparison outputs/diablo4-hash-suffix-binary-context-comparison/hash-suffix-binary-context-comparison.json `
  --out outputs/diablo4-bonus-percent-sample-coverage
```

Fichiers generes :

- `outputs/diablo4-bonus-percent-sample-coverage/bonus-percent-sample-coverage.json`
- `outputs/diablo4-bonus-percent-sample-coverage/bonus-percent-sample-coverage-summary.json`

Resultat :

- refs `Percent_Per_Power` ou assimilees : `4`
- refs exactes `Bonus_Percent_Per_Power` : `2`
- assets percent decodes : `4`
- assets percent restant a decoder : `0`
- cibles exactes `Bonus_Percent_Per_Power` comparees : `2`
- assessment : `local-bonus-percent-sample-covered-but-layout-diverges`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Refs exactes couvertes :

- `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` via `1663210`
- `Bonus_Percent_Per_Power#Spiritborn_Feather_Spawn` via `1953817`

Decision :

L'echantillon local exact `Bonus_Percent_Per_Power` est epuise et diverge. Pour stabiliser le suffixe `949`, il faut elargir le scan externe dans les fichiers du jeu afin de trouver d'autres cibles `Bonus_Percent_Per_Power`, puis relancer l'audit binaire et la comparaison suffixe. Aucune promotion DPS n'est autorisee.

## Scan externe elargi Bonus_Percent_Per_Power

Le scan externe a ete elargi sur les fichiers data du jeu avec le terme generique `Bonus_Percent_Per_Power`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js search-external-targets `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --external-refs outputs/diablo4-external-references/external-references.json `
  --terms Bonus_Percent_Per_Power `
  --file-offset 0 `
  --file-limit 205 `
  --max-hits 500 `
  --max-decode-mb 128 `
  --out outputs/diablo4-bonus-percent-external-scan-all
```

Fichiers generes :

- `outputs/diablo4-bonus-percent-external-scan-all/external-target-search.json`
- `outputs/diablo4-bonus-percent-external-scan-all/external-target-search-summary.json`

Resultat :

- fichiers data scannes : `205`
- entrees EF BE AD DE decodees : `13867`
- entrees trouvees : `6`
- assets trouves : `2302974`, `1663210`, `1953817`, `2058843`, `1489641`, `202484`
- nouveaux assets decodes : `2058843`, `1489641`, `202484`

Nouveaux contextes utiles :

- `2058843` : `Bonus_Percent_Per_Power#Paragon_Spiritborn_Legendary_007`
- `1489641` : `Bonus_Percent_Per_Power#Spiritborn_Eagle_Focus`
- `202484` : `Bonus_Percent_Per_Power#Barbarian_Upheaval`

Apres relance du minage suffixe :

- ancres dedupliquees : `26`
- ancres probables : `16`
- selecteurs distincts : `12`
- metadata ids distincts : `2`
- repeated selectors :
  - `selector 949` : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`, `1 + Bonus_Percent_Per_Power#Spiritborn_Feather_Spawn`
  - `selector 994` : `Bonus_Percent_Per_Power#Spiritborn_Eagle_Focus`, `Bonus_Percent_Per_Power#Barbarian_Upheaval`
  - `selector 1037` : expressions `AoE_Size_Bonus_Per_Power`
  - `selector 168` : `Chance_For_Double_Damage_Per_Power`
- `selector 997` : observe sur `Bonus_Percent_Per_Power#Paragon_Spiritborn_Legendary_007` avec `metadata 12337 / 10`
- `metadata 12337 / 10` : observee sur `1663210`, `1882772`, `2058843`

Impact diagnostic :

- la comparaison binaire passe a `5` assets, `4` signatures selecteur et `3` signatures metadata
- le verdict reste `binary-context-selector-repeats-but-layout-diverges`
- les blocages restent `3/3` actifs, avec `promotionReady: false`

Decision :

Le scan externe montre que `949` n'est pas le selecteur universel de `Bonus_Percent_Per_Power`. Plusieurs sous-layouts existent (`949`, `994`, `997`, `1037`, `168`). Il faut maintenant classifier ces sous-layouts et prouver le champ exact avant toute integration dans le DPS strict.

## Classification des sous-layouts de suffixe hash

Une commande CLI dediee a ete ajoutee pour classer les selecteurs et metadata ids observes dans le suffixe hash.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js classify-hash-suffix-sublayouts `
  --hash-suffix-family-evidence outputs/diablo4-hash-suffix-family-evidence/hash-suffix-family-evidence.json `
  --hash-suffix-binary-context-comparison outputs/diablo4-hash-suffix-binary-context-comparison/hash-suffix-binary-context-comparison.json `
  --out outputs/diablo4-hash-suffix-sublayout-classification
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-sublayout-classification/hash-suffix-sublayout-classification.json`
- `outputs/diablo4-hash-suffix-sublayout-classification/hash-suffix-sublayout-classification-summary.json`

Resultats :

- selecteurs classes : `12`
- metadata ids : `2`
- groupes : `6`
- assessment : `hash-suffix-sublayouts-classified-divergent`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Groupes utiles :

- `mixed-compact-metadata-and-noncompact-selector` : `selector 949`
  - `1663210` porte un layout compact `949 -> 1663210 -> 12337 / opcode 6 / float 10`
  - `1953817` porte aussi `949`, mais la metadata `12337 / 10` est hors suffixe compact
- `bonus-percent-selector-no-metadata-scale` : `selector 994`
  - observe sur `Bonus_Percent_Per_Power#Spiritborn_Eagle_Focus`
  - observe sur `Bonus_Percent_Per_Power#Barbarian_Upheaval`
  - aucune metadata `12337 / 10` proche
- `mined-metadata-scale-without-binary-selector-hit` : `selector 997`
  - observe sur `Bonus_Percent_Per_Power#Paragon_Spiritborn_Legendary_007`
  - lie a `metadata 12337 / 10` dans le minage, mais sans hit selecteur binaire stable
- `formula-wrapper-or-hash-reference-selector` : `selector 1037`
  - semble representer une expression wrapper ou reference hash, pas un bonus direct prouve
- `chance-per-power-selector` : `selector 168`
  - famille `Chance_For_Double_Damage_Per_Power`, utile comme contre-exemple de famille

Decision :

La divergence est maintenant explicite : le suffixe hash n'a pas un layout unique. Le cas `1663210` reste le meilleur candidat pour comprendre le triplet `949 / 12337 / 10`, mais ce triplet ne peut pas etre applique automatiquement aux autres cibles `Bonus_Percent_Per_Power`. La prochaine etape est de construire un parser de sous-layouts selector/asset/metadata et de valider chaque classe separement avant toute promotion dans le DPS strict.

## Champs candidats de sous-layout suffixe

Une commande CLI supplementaire transforme la classification en champs candidats exploitables par le futur parser. Cette sortie ne promeut aucune valeur : elle se contente de nommer les shapes et de garder chaque champ bloque.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js parse-hash-suffix-sublayout-fields `
  --hash-suffix-sublayout-classification outputs/diablo4-hash-suffix-sublayout-classification/hash-suffix-sublayout-classification.json `
  --out outputs/diablo4-hash-suffix-sublayout-fields
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-sublayout-fields/hash-suffix-sublayout-fields.json`
- `outputs/diablo4-hash-suffix-sublayout-fields/hash-suffix-sublayout-fields-summary.json`

Resultats :

- champs selecteurs : `12`
- champs metadata : `2`
- champs bloques : `14`
- champs promouvables : `0`
- assessment : `hash-suffix-sublayout-fields-built-blocked`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Extraits utiles :

- `selector:949`
  - classe : `mixed-compact-metadata-and-noncompact-selector`
  - role candidat : `bonus-percent-selector-mixed`
  - shape : `selector -> asset-like -> padding/opcode -> metadata-id -> opcode-6 -> float-scale`
  - assets : `1663210`, `1953817`
  - valeur candidate bloquee : `1663210 -> 12337 -> opcode 6 -> float 10`
- `selector:994`
  - classe : `bonus-percent-selector-no-metadata-scale`
  - role candidat : `bonus-percent-selector-without-local-scale`
  - assets : `202484`, `1489641`
  - aucune scale locale proche
- `selector:997`
  - classe : `mined-metadata-scale-without-binary-selector-hit`
  - lie a `metadata 12337 / 10` dans le minage, mais sans hit binaire stable
- `selector:1037`
  - classe : `formula-wrapper-or-hash-reference-selector`
  - traite comme wrapper/reference, pas comme bonus direct
- `selector:168`
  - classe : `chance-per-power-selector`
  - utile pour separer la famille chance de la famille bonus percent

Impact diagnostic :

- l'audit `target-blocker-resolution` inclut maintenant `hash-suffix-sublayout-fields-built-blocked`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- la prochaine action du blocage champ devient : coder les decodeurs binaires par `fieldShape`, puis tester chaque classe contre ses assets avant promotion
- le site affiche maintenant une ligne `Champs suffixe`

Decision :

Le projet dispose maintenant d'une couche intermediaire propre entre les observations binaires et le futur parser. Le candidat `12337 / 10` de `1663210` est conserve, mais explicitement bloque et localise au shape compact de `selector:949`. La suite doit coder les decodeurs par `fieldShape` au lieu de chercher un selecteur universel.

## Decodeurs de shapes suffixe

Une commande CLI dediee applique maintenant un decodeur candidat a chaque `fieldShape`. Elle ne change toujours pas le DPS strict : chaque sortie reste bloquee tant que le champ record exact et l'ownership ne sont pas prouves.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js decode-hash-suffix-field-shapes `
  --hash-suffix-sublayout-fields outputs/diablo4-hash-suffix-sublayout-fields/hash-suffix-sublayout-fields.json `
  --out outputs/diablo4-hash-suffix-field-shape-decoders
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-field-shape-decoders/hash-suffix-field-shape-decoders.json`
- `outputs/diablo4-hash-suffix-field-shape-decoders/hash-suffix-field-shape-decoders-summary.json`

Resultats :

- champs decodes : `12`
- metadata decodees : `2`
- decodeurs de shape : `5`
- sorties bloquees : `14`
- sorties promouvables : `0`
- assessment : `hash-suffix-field-shape-decoders-built-blocked`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Decodeurs crees :

- `compact-selector-asset-metadata-scale-decoder`
  - champ : `selector:949`
  - sortie candidate : `asset 1663210`, `metadata 12337`, `opcode 6`, `scale 10`
  - interpretation : `blocked-compact-scale-10-candidate`
  - blocages : `field-level-parser-required`, `layout-variant-split-required`, `uptime-not-proven`, `noncompact-context-present`
- `bonus-selector-without-local-scale-decoder`
  - champ : `selector:994`
  - assets : `202484`, `1489641`
  - interpretation : bonus repetable, mais scale locale absente
- `mined-metadata-linked-selector-decoder`
  - champs : `selector:997`, `selector:1126`
  - interpretation : lien metadata mine, sans shape binaire stable
- `formula-wrapper-reference-decoder`
  - champs : `selector:1037`, `selector:1170`, `selector:146`, `selector:992`
  - interpretation : wrapper/reference de formule, pas bonus DPS direct
- `unknown-suffix-shape-decoder`
  - champs : `selector:153`, `selector:168`, `selector:363`, `selector:991`
  - interpretation : shape encore trop divergent ou insuffisamment observe

Impact diagnostic :

- l'audit `target-blocker-resolution` inclut maintenant `hash-suffix-field-shape-decoders-built-blocked`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- la prochaine action du blocage champ devient : comparer les sorties decodees aux offsets binaires originaux et rattacher chaque decoder a un champ record prouve
- le site affiche maintenant une ligne `Decodeurs suffixe`

Decision :

Le parser candidat sait maintenant produire une valeur lisible pour le cas compact `selector:949` de `1663210`, mais il detecte aussi pourquoi cette valeur ne peut pas etre promue : le meme selecteur existe dans un contexte non compact, et la scale n'est pas prouvee comme champ record stable. La suite doit rattacher chaque sortie decodee a ses offsets binaires originaux, puis prouver le champ record avant toute utilisation DPS.

## Liaison des sorties decodees aux offsets binaires

Une commande CLI relie maintenant les sorties des decodeurs de shape aux offsets binaires issus de la comparaison de contextes.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js link-hash-suffix-decoded-offsets `
  --hash-suffix-field-shape-decoders outputs/diablo4-hash-suffix-field-shape-decoders/hash-suffix-field-shape-decoders.json `
  --hash-suffix-binary-context-comparison outputs/diablo4-hash-suffix-binary-context-comparison/hash-suffix-binary-context-comparison.json `
  --out outputs/diablo4-hash-suffix-decoded-offset-links
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-decoded-offset-links/hash-suffix-decoded-offset-links.json`
- `outputs/diablo4-hash-suffix-decoded-offset-links/hash-suffix-decoded-offset-links-summary.json`

Resultats :

- champs lies : `12`
- metadata liees : `2`
- liens offsets : `11`
- liens compacts : `1`
- liens promouvables : `0`
- assessment : `hash-suffix-decoded-offsets-linked-blocked`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Liens importants :

- `selector:949` / `1663210`
  - cible : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
  - `selectorOffset` : `19012`
  - `metadataOffset` : `19028`
  - distance : `16`
  - valeur decodee : `targetAssetId 1663210`, `metadataId 12337`, `opcode 6`, `scale 10`
  - classe : `compact-selector-metadata-offset-link`
  - statut : bloque
- `selector:994`
  - `202484` offset `10948`
  - `1489641` offset `11576`
  - classe : `selector-offset-without-local-scale`
  - statut : bloque, car aucune scale locale
- `metadata:12337`
  - offsets observes : `1663210:18688`, `1663210:19028`, `1953817:6520`, `2058843:6800`
  - statut : bloque, car metadata partagee par plusieurs selecteurs

Impact diagnostic :

- l'audit `target-blocker-resolution` inclut maintenant `hash-suffix-decoded-offsets-linked-blocked`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- la prochaine action du blocage champ devient : construire une inspection de record autour des offsets rattaches pour prouver les bornes et l'ownership du champ
- le site affiche maintenant une ligne `Offsets suffixe`

Decision :

La valeur candidate `scale 10` est maintenant rattachee a des offsets precis (`19012 -> 19028`) dans le payload `1663210`. Cela renforce la piste, mais ne suffit toujours pas : il faut prouver que cette zone est un champ record possede par le bon objet et pas seulement un suffixe adjacent. La prochaine etape doit inspecter les bornes de record autour de ces offsets.

## Inspection record autour des offsets suffixe

Une commande CLI inspecte maintenant les offsets rattaches contre les records texte deja extraits. Elle permet de savoir si les offsets sont dans un prefixe, dans le corps du texte, dans un suffixe, ou hors des records selectionnes.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-hash-suffix-offset-records `
  --hash-suffix-decoded-offset-links outputs/diablo4-hash-suffix-decoded-offset-links/hash-suffix-decoded-offset-links.json `
  --field-records outputs/diablo4-source-asset-1663210-field-records/field-record-inspection.json `
  --out outputs/diablo4-hash-suffix-offset-record-inspection
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-offset-record-inspection/hash-suffix-offset-record-inspection.json`
- `outputs/diablo4-hash-suffix-offset-record-inspection/hash-suffix-offset-record-inspection-summary.json`

Resultats :

- champs inspectes : `12`
- metadata inspectees : `2`
- liens record : `11`
- liens dans un suffixe record : `1`
- liens avec ownership prouve : `0`
- assessment : `hash-suffix-offset-records-inspected-blocked`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Detail `selector:949` :

- asset : `1663210`
- record courant : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
- record offset : `18948`
- record end offset : `19000`
- string precedente : `0.3 * Table(34, sLevel)`
- string suivante : `(1-POW(1-SF_28/100,1/2))*100`
- selector : offset `19012`, valeur `949`
- metadata : offset `19028`, valeur `12337`
- distance : `16`
- placement : `suffix-of-current-record`
- ownership : `suffix-local-not-owner-proven`
- promotion : `false`

Interpretation :

On sait maintenant que `949 -> 1663210 -> 12337 -> opcode 6 -> 10` est bien dans le suffixe local du record `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`. Cette preuve est meilleure qu'une simple adjacency brute, mais elle ne suffit toujours pas pour dire que ce suffixe est le champ DPS possede par `SF_32` ou par le bonus. Il manque les bornes stables du champ et le header/length qui permettent de separer la zone de son record voisin.

Impact diagnostic :

- l'audit `target-blocker-resolution` inclut maintenant `hash-suffix-offset-records-inspected-blocked`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- la prochaine action du blocage champ devient : comparer les bornes du suffixe record avec d'autres assets et identifier un header/longueur de champ stable avant promotion
- le site affiche maintenant une ligne `Records suffixe`

Decision :

Le placement local du suffixe compact est prouve pour `1663210`, mais l'ownership champ reste bloque. La prochaine etape doit comparer les bornes du suffixe record avec d'autres assets (`1953817`, `202484`, `1489641`, `2058843`) afin de trouver un header ou une longueur de champ stable.

## Comparaison multi-assets des bornes suffixe

Des inspections `field-records` ciblees ont ete generees pour les assets supplementaires :

- `1953817` : `Bonus_Percent_Per_Power#Spiritborn_Feather_Spawn`
- `202484` : `Bonus_Percent_Per_Power#Barbarian_Upheaval`
- `1489641` : `Bonus_Percent_Per_Power#Spiritborn_Eagle_Focus`
- `2058843` : `Bonus_Percent_Per_Power#Paragon_Spiritborn_Legendary_007`

Une commande CLI compare ensuite les liens d'offsets avec ces records.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js compare-hash-suffix-record-boundaries `
  --hash-suffix-decoded-offset-links outputs/diablo4-hash-suffix-decoded-offset-links/hash-suffix-decoded-offset-links.json `
  --merge-files outputs/diablo4-source-asset-1663210-field-records/field-record-inspection.json,outputs/diablo4-source-asset-1953817-field-records/field-record-inspection.json,outputs/diablo4-source-asset-202484-field-records/field-record-inspection.json,outputs/diablo4-source-asset-1489641-field-records/field-record-inspection.json,outputs/diablo4-source-asset-2058843-field-records/field-record-inspection.json `
  --out outputs/diablo4-hash-suffix-record-boundary-comparison
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-record-boundary-comparison/hash-suffix-record-boundary-comparison.json`
- `outputs/diablo4-hash-suffix-record-boundary-comparison/hash-suffix-record-boundary-comparison-summary.json`

Resultats :

- lignes selecteur : `7`
- lignes metadata : `4`
- assets avec records : `5`
- groupes de bornes : `9`
- lignes suffixe : `5`
- ownership prouve : `0`
- assessment : `hash-suffix-record-boundaries-repeat-but-not-owned`
- confiance : `medium`
- promotion DPS fiable : `false`

Motifs utiles :

- `selector:994`
  - assets : `202484`, `1489641`
  - placement : `suffix-of-current-record`
  - delta selecteur depuis fin de record : `+11`
  - signature suffixe : `ref:0|raw:small|raw:asset-like`
  - interpretation : motif repete, mais scale locale absente
- `selector:949`
  - asset : `1663210`
  - placement : `suffix-of-current-record`
  - delta selecteur : `+12`
  - delta metadata : `+28`
  - distance selector -> metadata : `16`
  - signature suffixe : `ref:0|raw:small|raw:asset-like|raw:metadata-like|f:10`
  - interpretation : motif compact local, pas encore repete
- `metadata:12337`
  - observee comme suffixe sur `1663210` et `2058843`
  - signatures differentes, metadata partagee

Impact diagnostic :

- l'audit `target-blocker-resolution` inclut maintenant `hash-suffix-record-boundaries-repeat-but-not-owned`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- la prochaine action du blocage champ devient : inspecter les octets precedant les suffixes localises pour chercher un header/length stable de champ
- le site affiche maintenant une ligne `Bornes suffixe`

Decision :

La comparaison apporte un vrai signal : les bornes de suffixe se repetent pour `selector:994`, mais ce shape n'a pas de scale locale. Le shape compact `949 / 12337 / 10`, celui qui explique le cas `1663210`, reste local et non repete. La prochaine etape doit regarder les octets precedant les suffixes localises afin de trouver un header ou une longueur de champ qui separerait proprement le suffixe du reste du record.

## Inspection des preludes de bornes suffixe

Une commande CLI lit maintenant les octets autour de la fin du record et du debut du suffixe localise.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js inspect-hash-suffix-boundary-preludes `
  --hash-suffix-record-boundary-comparison outputs/diablo4-hash-suffix-record-boundary-comparison/hash-suffix-record-boundary-comparison.json `
  --data-dir outputs `
  --read-bytes 32 `
  --out outputs/diablo4-hash-suffix-boundary-preludes
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-boundary-preludes/hash-suffix-boundary-preludes.json`
- `outputs/diablo4-hash-suffix-boundary-preludes/hash-suffix-boundary-preludes-summary.json`

Resultats :

- fenetres : `3`
- fenetres lisibles : `3`
- groupes : `2`
- groupes repetes : `1`
- assessment : `hash-suffix-boundary-preludes-repeat-without-ownership`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Motif repete :

- concerne `selector:994`
- assets : `202484`, `1489641`
- delta depuis fin de record : `+11`
- mots entre fin du record et selecteur : `small:5|zero`
- signature pre-selector : `pre-selector:asset-like|record-end-overlap:metadata-like|between-record-and-selector:small:5|between-record-and-selector:zero`
- interpretation : motif de suffixe stable, mais sans scale locale

Motif compact local :

- concerne `selector:949`
- asset : `1663210`
- delta depuis fin de record : `+12`
- mots entre fin du record et selecteur : `small:5|zero`
- suffixe : `selector 949`, `asset 1663210`, `0`, `0`, `metadata 12337`, `opcode 6`, `scale 10`
- interpretation : meme prelude court que `994`, mais shape compact plus long et non repete

Impact diagnostic :

- l'audit `target-blocker-resolution` inclut maintenant `hash-suffix-boundary-preludes-repeat-without-ownership`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- la prochaine action du blocage champ devient : comparer les mots de prelude avec les transitions header-patterns pour nommer le champ ou elargir l'echantillon
- le site affiche maintenant une ligne `Preludes suffixe`

Decision :

Le couple `5,0` avant le selecteur ressemble a un prelude de suffixe stable, observe sur `949` et `994`. En revanche, il ne nomme pas encore le champ et ne prouve pas la longueur exacte du suffixe compact. La suite doit comparer ces mots de prelude avec les transitions `record-header-patterns` pour voir s'ils correspondent a un header connu, ou elargir l'echantillon.

## Comparaison prelude suffixe / headers

Une commande CLI relie maintenant les preludes de suffixe localises aux transitions `record-header-patterns`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js compare-hash-suffix-preludes-with-header-patterns `
  --hash-suffix-boundary-preludes outputs/diablo4-hash-suffix-boundary-preludes/hash-suffix-boundary-preludes.json `
  --merge-files outputs/diablo4-source-asset-1663210-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-202484-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1489641-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1953817-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-2058843-header-patterns/record-header-pattern-comparison.json `
  --out outputs/diablo4-hash-suffix-prelude-header-comparison
```

Fichier genere :

- `outputs/diablo4-hash-suffix-prelude-header-comparison/hash-suffix-prelude-header-comparison.json`

Resultats :

- fenetres inspectees : `3`
- fenetres matchees : `3`
- matchs exacts au selecteur : `3`
- assessment : `hash-suffix-preludes-match-header-transitions-without-field-name`
- confiance : `medium-high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Impact diagnostic :

- l'audit `target-blocker-resolution` inclut maintenant `hash-suffix-preludes-match-header-transitions-without-field-name`
- les blocages restent `3/3` actifs, avec `promotionReady: false`
- prochaine action : ajouter des payloads comparables contenant `Bonus_Percent_Per_Power` puis relancer la comparaison prelude/header
- le site affiche maintenant une ligne `Prelude/header suffixe`

Decision :

La comparaison confirme que les preludes de suffixe retombent bien sur les transitions header `hash-to-current-asset`. C'est une preuve de contexte forte, mais pas une preuve de champ : aucun nom de champ, trigger ou uptime n'est encore prouve. Le candidat `1663210` reste donc strictement bloque en DPS fiable et seulement exploitable en what-if.

## Extension high-bit des selecteurs suffixe

L'audit binaire suffixe surveille maintenant aussi les formes high-bit des selecteurs connus.

Changement :

- `selector 168` est cherche sous sa forme normale `168`
- `selector 168` est aussi cherche sous sa forme encodee `2147483816` (`0x800000A8`)
- les rapports conservent `encodedValue` et `encoding`, mais comparent les layouts sur la valeur normalisee `168`

Resultats apres regeneration :

- audit binaire : `27` hits au lieu de `25`
- comparaison binaire : `6` assets au lieu de `5`
- assessment : `binary-context-selector-repeats-but-layout-diverges`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Nouveau contexte integre :

- asset : `2302974`
- fichier : `outputs/diablo4-gameplay-candidates/data.004.20028655.decoded.bin`
- selecteur normalise : `168`
- valeur encodee : `2147483816`
- encoding : `high-bit-encoded`
- cible proche : `1+CC_Duration_Bonus_Percent_Per_Power#Paladin_Trinity_Cast_3`
- shape : divergent/unknown, sans metadata `12337` proche

Impact diagnostic :

- `2302974` enrichit la couverture de la famille suffixe, mais ne produit pas de lien d'offset exploitable pour le shape compact `949 / 12337 / 10`
- les fenetres prelude/header restent `3/3` match exact, sans nom de champ
- l'audit `target-blocker-resolution` reste `3` blocages actifs, `0` resolu, `promotionReady: false`

Decision :

La forme high-bit est maintenant traitee correctement et ne sera plus confondue avec une absence de hit. En revanche, ce contexte appartient au selecteur `168` et reste divergent par rapport au candidat compact `1663210`. Il sert donc a renforcer la couverture negative, pas a promouvoir le DPS.

## Comparaison directe des shapes header suffixe

Une nouvelle commande compare les shapes visibles directement dans les transitions header `hash-to-current-asset`, sans exiger qu'elles aient deja un lien d'offset record promouvable.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js compare-hash-suffix-header-shapes `
  --merge-files outputs/diablo4-source-asset-1663210-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-202484-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1489641-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-1953817-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-2058843-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-2302974-header-patterns/record-header-pattern-comparison.json,outputs/diablo4-source-asset-309070-header-patterns/record-header-pattern-comparison.json `
  --out outputs/diablo4-hash-suffix-header-shape-comparison
```

Fichier genere :

- `outputs/diablo4-hash-suffix-header-shape-comparison/hash-suffix-header-shape-comparison.json`

Resultats :

- rapports header compares : `7`
- transitions `hash-to-current-asset` : `10`
- groupes de shapes : `7`
- selecteurs distincts : `7`
- compact `949/12337/10` : `1`
- selecteurs high-bit : `4`
- groupes divergents : `6`
- assessment : `hash-suffix-header-shapes-compact-local-and-divergent`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Groupes utiles :

- `selector:949` : `compact-selector-949-metadata-12337-scale-10`, asset `1663210`, `1` occurrence
- `selector:994` : `selector-994-no-local-scale`, assets `202484`, `1489641`, `2` occurrences
- `selector:168` : `high-bit-selector-168-divergent`, assets `202484`, `2302974`, `2` occurrences
- `selector:1037` : `formula-wrapper-or-expression-suffix`, assets `202484`, `1489641`, `2` occurrences

Impact diagnostic :

- l'audit `target-blocker-resolution` inclut maintenant `hash-suffix-header-shapes-compact-local-and-divergent`
- les blocages restent `3/3` actifs, `0` resolu, `promotionReady: false`
- la prochaine action du blocage champ devient : trouver un second header compact `949/12337/10` ou une table nommee avant toute promotion DPS
- le site affiche maintenant une ligne `Shapes header suffixe`

Decision :

Cette comparaison confirme que le shape compact qui explique le delta de `1663210` n'est observe qu'une fois dans les headers actuels. Les autres transitions visibles sont coherentes mais divergentes. Le prochain vrai deblocage doit venir soit d'un deuxieme compact `949/12337/10`, soit d'une table/dictionnaire qui nomme `selector 949` ou `metadata 12337`.

## Recherche binaire brute du compact 949/12337/10

Une commande CLI cherche maintenant le motif compact exact dans tous les binaires decodes disponibles sous `outputs`.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js search-hash-suffix-compact-pattern `
  --data-dir outputs `
  --out outputs/diablo4-hash-suffix-compact-pattern-search
```

Fichier genere :

- `outputs/diablo4-hash-suffix-compact-pattern-search/hash-suffix-compact-pattern-search.json`

Resultats :

- binaires decodes scannes : `25`
- hits exacts compact `949/asset/0/0/12337/6/10` : `1`
- hits partiels `949` ou `12337` : `19`
- fichiers avec valeurs surveillees : `9`
- assessment : `hash-suffix-compact-pattern-local-only`
- confiance : `medium-high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Hit exact :

- asset : `1663210`
- fichier : `outputs/diablo4-source-asset-1663210-payload/data.007.8265002.decoded.bin`
- offset : `19012`
- sequence : `949`, `1663210`, `0`, `0`, `12337`, `6`, `10`

Observation importante :

- `1953817` contient `949` et `12337`, mais pas dans le shape compact exact
- plusieurs payloads contiennent `12337` seul ou dans des contextes divergents
- le compact `949/12337/10` reste donc local a `1663210` dans les extractions actuelles

Impact diagnostic :

- l'audit `target-blocker-resolution` inclut maintenant `hash-suffix-compact-pattern-local-only`
- les blocages restent `3/3` actifs, `0` resolu, `promotionReady: false`
- la prochaine action du blocage champ devient : chercher une table nommee pour `949/12337` ou decoder davantage de payloads `Bonus_Percent_Per_Power` avant toute promotion DPS
- le site affiche maintenant une ligne `Compact suffixe`

Decision :

Cette recherche ferme la piste du second compact dans les binaires deja decodes : il n'existe pas encore. La presence partielle de `949` et `12337`, notamment dans `1953817`, ne suffit pas a attribuer `12337/10` au champ de `1663210`. Le prochain deblocage doit venir d'une table/dictionnaire nomme ou de nouveaux payloads contenant un autre compact exact.

## Audit table nommee 949/12337

Une commande CLI audite maintenant les contextes numeriques exacts `949` et `12337` dans les artefacts JSON locaux, en separant les rapports generes par l'outil, les candidats de table/source independante et le bruit numerique.

Commande :

```powershell
node work/diablo4-data-exporter/d4export.js audit-hash-suffix-named-tables `
  --data-dir outputs `
  --out outputs/diablo4-hash-suffix-named-table-audit
```

Fichiers generes :

- `outputs/diablo4-hash-suffix-named-table-audit/hash-suffix-named-table-audit.json`
- `outputs/diablo4-hash-suffix-named-table-audit/hash-suffix-named-table-audit-summary.json`

Resultats :

- contextes exacts `949/12337` : `1247`
- candidats independants : `0`
- contextes generes par nos rapports : `914`
- bruit numerique : `253`
- assessment : `hash-suffix-named-table-not-found-generated-only`
- confiance : `medium-high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Impact diagnostic :

- l'audit `target-blocker-resolution` inclut maintenant `hashSuffixNamedTableAssessment`
- les blocages restent `3/3` actifs, `0` resolu, `promotionReady: false`
- la prochaine action du blocage champ devient : decoder davantage de payloads `Bonus_Percent_Per_Power` ou chercher une table source externe aux rapports generes
- le site affiche maintenant une ligne `Table suffixe`

Decision :

Cette piste ne donne pas encore de preuve nommee exploitable : les traces `949/12337` visibles viennent de nos propres rapports ou de bruit numerique, pas d'une table source independante. On garde donc le delta de `1663210` en candidat bloque. Le prochain deblocage doit venir d'un echantillon binaire plus large ou d'une source de dictionnaire externe aux rapports generes.

## Redecodage des payloads mismatches header-patterns

Les trois entrees encore marquees comme mismatches dans le plan header-patterns ont ete retestees avec leurs offsets recommandes.

Tentatives :

- `1461593` : `data.045`, offset `43688625`
- `2474146` : `data.043`, offset `10279789`
- `1408295` : `data.042`, offset `19293246`

Fichier genere :

- `outputs/diablo4-record-header-redecode-attempts/record-header-redecode-attempts.json`

Resultats :

- tentatives : `3`
- payloads decodes : `0`
- erreurs `Not a BLTE payload` : `3`
- assessment : `record-header-redecode-offsets-not-blte`

Impact diagnostic :

- ces offsets ne doivent plus etre traites comme des candidats directement decodables
- le blocage champ reste actif, car aucun nouvel echantillon comparable n'a ete ajoute
- l'audit `target-blocker-resolution` reste a `3` blocages actifs, `0` resolu, `promotionReady: false`

Decision :

La file de redecodage par offsets directs est fermee pour `1461593`, `2474146` et `1408295`. La suite doit passer par une recherche de BLTE voisins via catalogue/index, ou par de nouveaux assets `Bonus_Percent_Per_Power` trouves dans le scan externe, plutot que par ces offsets de rapport.

## Scan des voisins BLTE des mismatches header-patterns

Apres l'echec des offsets directs, les fichiers `data.042`, `data.043` et `data.045` ont ete catalogues pour retrouver les vrais offsets BLTE proches des trois mismatches.

Fichiers generes :

- `outputs/diablo4-blte-catalog-target-files/data.042.blte-catalog.json`
- `outputs/diablo4-blte-catalog-target-files/data.043.blte-catalog.json`
- `outputs/diablo4-blte-catalog-target-files/data.045.blte-catalog.json`
- `outputs/diablo4-record-header-neighbor-scan/record-header-neighbor-scan.json`

Resultats catalogues :

- `data.042` : `462` entrees BLTE
- `data.043` : `500` entrees BLTE
- `data.045` : `500` entrees BLTE

Scan voisin :

- assets testes : `1461593`, `2474146`, `1408295`
- voisins BLTE testes par asset : `20`
- payloads voisins decodes : `60`
- hits de chaines attendues : `0`

Impact diagnostic :

- `1461593` : aucun voisin proche ne contient `Necromancer_Talent_Caster_T3_N1`, `Helm_Unique_Necro_100` ou `legendary_necro_012`
- `2474146` : aucun voisin proche ne contient `legendary_necro_012` ou `1HShield_Unique_Paladin_005`
- `1408295` : aucun voisin proche ne contient `NPC_Mercenary_BerserkerCrone_passiveA6` ou `Script Formula 2`
- aucun nouvel echantillon comparable n'est ajoute au moteur de preuves

Decision :

La piste des BLTE voisins immediats est fermee pour ces trois mismatches. La suite doit reparer la liaison index/source qui a produit ces offsets, ou continuer avec de nouvelles cibles `Bonus_Percent_Per_Power` deja retrouvees par scan externe. Ces resultats ne changent pas le statut de `1663210` : candidat bloque, non promouvable.

## Audit de fraicheur des sources header-patterns

Un scan frais a ete relance sur les fichiers concernes par les mismatches (`data.042`, `data.043`, `data.045`) avec les termes attendus de `1461593`, `2474146` et `1408295`.

Commande source :

```powershell
node work/diablo4-data-exporter/d4export.js search-external-targets `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --external-refs outputs/diablo4-external-references/external-references.json `
  --terms Necromancer_Talent_Caster_T3_N1,Helm_Unique_Necro_100,legendary_necro_012,1HShield_Unique_Paladin_005,NPC_Mercenary_BerserkerCrone_passiveA6 `
  --file-names data.042,data.043,data.045 `
  --max-hits 800 `
  --max-decode-mb 64 `
  --out outputs/diablo4-record-header-source-freshness-scan
```

Fichiers generes :

- `outputs/diablo4-record-header-source-freshness-scan/external-target-search.json`
- `outputs/diablo4-record-header-source-freshness-plan/record-header-payload-plan.json`
- `outputs/diablo4-record-header-source-freshness-audit/record-header-source-freshness-audit.json`

Resultats :

- matching entries du scan frais : `0`
- target groups matched : `0`
- candidats du plan reconstruit : `0`
- anciens offsets non reconfirmes : `3`
- hits voisins BLTE : `0`
- assessment : `record-header-source-links-stale`
- promotion DPS fiable : `false`

Impact diagnostic :

- les offsets de `1461593`, `2474146` et `1408295` ne doivent plus etre utilises comme sources actives
- les rapports qui les contiennent sont maintenant traites comme preuves stale
- le blocage champ de `1663210` reste actif : aucun nouvel echantillon comparable n'a ete ajoute

Decision :

La prochaine etape n'est plus de decoder autour de ces offsets, mais de reconstruire `external-target-search` avec les conventions BLTE/catalogue actuelles ou de repartir des cibles `Bonus_Percent_Per_Power` deja confirmees. Les mismatches sont conserves comme historique, pas comme sources de preuve.

## Integration de la fraicheur source dans les blocages

L'audit de blocages accepte maintenant la preuve `record-header-source-freshness-audit`.

Ajouts :

- argument CLI : `--record-header-source-freshness-audit`
- champ moteur : `evidenceSummary.recordHeaderSourceFreshnessAssessment`
- ligne site : `Source header`

Resultat apres regeneration :

- blocages : `3`
- resolus : `0`
- promotion ready : `false`
- source stale : `3`
- fresh matches : `0`
- fresh candidates : `0`
- neighbor hits : `0`

Impact :

La prochaine action du blocage `field-level-parser-required` devient explicitement la reconstruction de `external-target-search` avec les conventions BLTE/catalogue actuelles. Les anciennes sources restent visibles, mais elles ne peuvent plus etre traitees comme preuves actives.

## Scan elargi Bonus_Percent_Per_Power

La commande `search-external-targets` accepte maintenant l'option `--decoded-types`, afin de scanner plusieurs familles de payloads decodes. Le comportement par defaut reste limite a `deadbeef-binary`; le scan elargi ajoute `unknown-binary`.

Commande type :

```powershell
node work/diablo4-data-exporter/d4export.js search-external-targets `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --external-refs outputs/diablo4-external-references/external-references.json `
  --terms Bonus_Percent_Per_Power `
  --decoded-types deadbeef-binary,unknown-binary `
  --file-offset <offset> `
  --file-limit <limit> `
  --max-hits 800 `
  --max-decode-mb 128
```

Fichiers generes :

- `outputs/diablo4-bonus-percent-external-scan-expanded/external-target-search-merged/external-target-search-merged.json`
- `outputs/diablo4-bonus-percent-expanded-payload-plan/record-header-payload-plan.json`
- `outputs/diablo4-source-asset-199516-payload/data.168.16167790.decoded.bin`
- `outputs/diablo4-source-asset-199516-header-patterns/record-header-pattern-comparison.json`
- `outputs/diablo4-source-asset-199516-field-records/field-record-inspection.json`

Resultats :

- fichiers scannes : `205`
- matches `Bonus_Percent_Per_Power` : `7`
- nouvel asset : `199516`
- cible : `Bonus_Percent_Per_Power#Barbarian_Kick`
- plan elargi : `7` candidats, `7` deja decodes, `0` a decoder

Impact sur les shapes suffixe :

- rapports compares : `7`
- transitions : `10`
- groupes : `5`
- compact `949/12337/10` : `1`, toujours local a `1663210`
- groupes divergents : `4`
- `199516` renforce les groupes divergents `selector:168` et `selector:994`
- promotion DPS fiable : `false`

Audits rafraichis :

- recherche compact : `86` binaires scannes, `1` hit exact compact, `25` hits partiels
- audit table nommee : `1521` contextes `949/12337`, `0` candidat independant
- audit blocages : `3` actifs, `0` resolu, `promotionReady: false`

Decision :

Le scan elargi ameliore la couverture et ajoute un bon echantillon `Bonus_Percent_Per_Power`, mais il confirme surtout la divergence des layouts. Le compact qui explique `1663210` reste unique. La preuve stale des anciens offsets reste visible, mais la prochaine action utile redevient : decoder davantage de cibles comparables ou trouver une table source independante pour `949/12337`.

## Regeneration de la chaine suffixe avec 199516

Apres l'ajout de `assetId 199516`, toute la chaine de preuves suffixe a ete regeneree : dictionnaire, evidence famille, audit binaire, comparaison de contextes, sublayouts, champs, decodeurs, liens offsets, bornes, preludes et audit de blocages.

Commandes principales :

```powershell
node work/diablo4-data-exporter/d4export.js mine-hash-suffix-dictionary `
  --formula-hash-field-boundaries outputs/diablo4-formula-hash-field-boundaries/formula-hash-field-boundaries.json `
  --data-dir outputs `
  --out outputs/diablo4-hash-suffix-dictionary-mining

node work/diablo4-data-exporter/d4export.js summarize-hash-suffix-family-evidence `
  --hash-suffix-dictionary-mining outputs/diablo4-hash-suffix-dictionary-mining/hash-suffix-dictionary-mining.json `
  --out outputs/diablo4-hash-suffix-family-evidence

node work/diablo4-data-exporter/d4export.js audit-hash-suffix-binary-sources `
  --hash-suffix-family-evidence outputs/diablo4-hash-suffix-family-evidence/hash-suffix-family-evidence.json `
  --data-dir outputs `
  --out outputs/diablo4-hash-suffix-binary-source-audit
```

Resultats clefs :

- minage dictionnaire : `30` ancres, `13` selecteurs, `2` metadata ids
- `selector:994` : `3` occurrences sur `Bonus_Percent_Per_Power`, dont `199516`
- `selector:168` : `4` occurrences sur `Chance_For_Double_Damage_Per_Power`, dont `199516`
- `selector:949` : toujours `2` occurrences, dont `1663210` et `1953817`
- `metadata 12337` : toujours `3` occurrences
- comparaison binaire : `7` assets, `7` groupes selecteur, `3` groupes metadata, `1` compact triplet
- sublayouts : `13` selecteurs, `6` groupes
- champs/decodeurs : `13` champs, `15` sorties bloquees, `0` promouvable
- liens offsets : `12` liens, `1` lien compact, `0` promouvable
- bornes : `6` suffix rows, `0` ownership prouve
- prelude/header : `4` windows, `4` matches, `4` exact selector matches

Impact diagnostic :

- `199516` confirme un nouveau cas `Bonus_Percent_Per_Power`, mais sous `selector:994`, pas sous `selector:949`
- il renforce aussi `selector:168` via `Chance_For_Double_Damage_Per_Power#Barbarian_Kick`
- aucun element ne replique le compact `949/12337/10`
- les decodeurs restent tous bloques et aucune valeur ne passe dans le DPS fiable

Decision :

La nouvelle couverture rend la divergence plus solide. `selector:994` devient le pattern repete principal pour plusieurs `Bonus_Percent_Per_Power`, tandis que le compact `selector:949 + metadata 12337 + scale 10` reste local a `1663210`. La prochaine piste doit donc etre une table/source nommee ou un autre asset qui reproduit exactement le compact, pas une promotion par analogie.

## Matrice des selecteurs Bonus_Percent_Per_Power

Une matrice dediee resume maintenant les cibles `Bonus_Percent_Per_Power`, leurs selecteurs, metadata, familles et groupes header.

Fichier genere :

- `outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json`

Resultats :

- assets couverts : `7`
- assets avec ancres suffixe : `5`
- groupes de selecteurs : `2`
- cibles directes : `4`
- cibles enveloppees : `1`
- `selector:949` : assets `1663210`, `1953817`
- `selector:994` : assets `199516`, `202484`, `1489641`
- assessment : `bonus-percent-selector-matrix-divergent`
- confiance : `medium`
- promotion DPS fiable : `false`

Integration :

- argument audit : `--bonus-percent-selector-matrix`
- champ preuve : `evidenceSummary.bonusPercentSelectorMatrixAssessment`
- ligne site : `Matrice bonus`

Impact diagnostic :

La matrice rend la divergence plus lisible : `selector:994` est le selecteur repete des cas directs `Bonus_Percent_Per_Power` les plus nombreux, tandis que `selector:949` reste limite a `1663210` et `1953817`. Comme seul `1663210` porte le compact `949/12337/10`, il n'y a toujours pas assez de preuve pour promouvoir le delta dans le DPS fiable.

Decision :

La prochaine action du blocage champ est maintenant plus precise : chercher une table source nommant les selecteurs, ou trouver un second asset direct `Bonus_Percent_Per_Power` avec `selector:949` et `metadata 12337/10`.

## Audit pair-a-pair selector 949

Un audit dedie compare maintenant les deux assets connus qui portent `selector:949`.

Fichier genere :

- `outputs/diablo4-selector-949-peer-audit/selector-949-peer-audit.json`

Resultats :

- peers compares : `2`
- assets `selector:949` : `1663210`, `1953817`
- compact candidat : `1`
- compact candidat : `1663210`
- assessment : `selector-949-peer-compact-not-repeated`
- confiance : `high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Lecture binaire :

- `1663210` : offset selector `19012`, puis `949 / 1663210 / 0 / 0 / 12337 / 6 / float 10`
- `1953817` : offset selector `6760`, puis `949 / 1975049 / 0 / 11 / 0 / 0 / -1`
- sur `1953817`, les plus proches correspondances sont loin du compact local : `12337` a `-240`, `float 10` a `-232`, asset id `1953817` a `-104`

Integration :

- script : `work/diablo4-data-exporter/scripts/audit-selector-949-peers.js`
- argument audit : `--selector-949-peer-audit`
- champ preuve : `evidenceSummary.selector949PeerAssessment`
- ligne site : `Peers 949`
- le `proofState` du blocage `field-level-parser-required` inclut maintenant `selector-949-peer-compact-not-repeated`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- la prochaine action champ devient : trouver un second asset `selector:949` avec `metadata 12337/10` dans la meme fenetre locale, ou une table source qui explique la divergence
- l'audit renforce le refus de promotion : `1953817` partage le selecteur `949`, mais ne partage pas le compact local `949/asset/0/0/12337/6/10`

Decision :

Le compact de `1663210` est maintenant mieux cerne mais reste local, donc insuffisant pour le DPS fiable. La suite doit chercher une table/dictionnaire source pour `949`, `12337` et `10`, ou un autre asset qui repete exactement ce compact.

## Scan corpus compact selector 949

Un scan de corpus cherche maintenant le motif exact `949 / asset / 0 / 0 / 12337 / 6 / float 10` dans tous les payloads deja decodes sous `outputs`.

Fichier genere :

- `outputs/diablo4-selector-949-compact-corpus/selector-949-compact-corpus-scan.json`

Resultats :

- payloads decodes scannes : `86`
- fichiers avec `selector:949` : `2`
- occurrences `selector:949` : `2`
- occurrences compact exact : `1`
- asset candidat du compact exact : `1663210`
- assessment : `selector-949-compact-local-only-in-decoded-corpus`
- confiance : `medium-high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Integration :

- script : `work/diablo4-data-exporter/scripts/scan-selector-949-compact-corpus.js`
- argument audit : `--selector-949-compact-corpus`
- champ preuve : `evidenceSummary.selector949CompactCorpusAssessment`
- ligne site : `Corpus 949`
- le `proofState` du blocage `field-level-parser-required` inclut maintenant `selector-949-compact-local-only-in-decoded-corpus`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- la prochaine action champ devient : chercher une table source nommee pour `selector 949` / `metadata 12337` / `scale 10`, ou decoder davantage de payloads candidats
- le corpus local ne fournit pas de second compact exact, donc il ne faut pas promouvoir le delta `48960` en DPS fiable

Decision :

La piste "trouver un second compact deja decode" est epuisee dans le corpus actuel. La prochaine etape doit viser une table/dictionnaire source nommee, ou augmenter le corpus par de nouveaux payloads candidats avant de reparler promotion.

## Scan des chaines dictionnaire/table dans les payloads decodes

Un scan binaire dedie cherche maintenant les chaines de type `selector`, `metadata`, `dictionary`, `lookup`, `enum`, `field`, `schema`, `table`, ainsi que les familles `Bonus_Percent_Per_Power` et `Affix_Value_1`. Il verifie aussi si ces chaines sont proches des valeurs surveillees `949`, `12337` ou du float `10`.

Fichier genere :

- `outputs/diablo4-decoded-dictionary-string-scan/decoded-dictionary-string-scan.json`

Resultats :

- payloads decodes scannes : `86`
- fichiers avec hits : `12`
- hits totaux : `34`
- chaines dictionnaire/table : `24`
- chaines dictionnaire/table proches des valeurs surveillees : `0`
- hits `Bonus_Percent_Per_Power` : `7`
- assessment : `decoded-dictionary-strings-not-near-watched-values`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Integration :

- script : `work/diablo4-data-exporter/scripts/scan-decoded-dictionary-strings.js`
- argument audit : `--decoded-dictionary-string-scan`
- champ preuve : `evidenceSummary.decodedDictionaryStringAssessment`
- ligne site : `Strings dict`
- le `proofState` du blocage `field-level-parser-required` inclut maintenant `decoded-dictionary-strings-not-near-watched-values`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- la prochaine action champ devient : decoder davantage de payloads candidats ou chercher une source de table hors du corpus decode actuel
- cette preuve ferme l'hypothese d'une chaine dictionnaire/table exploitable deja presente pres de `949/12337/10`

Decision :

Le corpus decode actuel contient des chaines dictionnaire/table, mais aucune ne nomme ou ne borne les valeurs surveillees. Il faut donc augmenter le corpus decode ou identifier une source de table externe au corpus actuel avant toute promotion DPS.

## Audit des cibles Bonus_Percent_Per_Power sans ancre

Un audit dedie inspecte les lignes de la matrice `Bonus_Percent_Per_Power` qui n'avaient pas encore d'ancre de suffixe utile.

Fichier genere :

- `outputs/diablo4-unanchored-bonus-percent-audit/unanchored-bonus-percent-audit.json`

Resultats :

- lignes inspectees : `2`
- payloads lisibles : `2`
- chaines cibles retrouvees : `2`
- candidats d'ancre utiles : `0`
- assessment : `unanchored-bonus-percent-no-extra-anchor-candidates`
- confiance : `medium`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Details :

- `2058843` / `Bonus_Percent_Per_Power#Paragon_Spiritborn_Legendary_007`
  - chaine cible a l'offset `6716`
  - `12337` a `+84`
  - `float 10` a `+92`
  - aucun selecteur `949` ou `994` proche
- `2302974` / `1+CC_Duration_Bonus_Percent_Per_Power#Paladin_Trinity_Cast_3`
  - chaine cible a l'offset `14552`
  - `highbit-168` a `-16`
  - pas de `949` ni `994` proche
  - contexte divergent, utile pour couverture, pas pour promotion DPS

Integration :

- script : `work/diablo4-data-exporter/scripts/audit-unanchored-bonus-percent-assets.js`
- argument audit : `--unanchored-bonus-percent-audit`
- champ preuve : `evidenceSummary.unanchoredBonusPercentAssessment`
- ligne site : `Sans ancre`
- le `proofState` du blocage `field-level-parser-required` inclut maintenant `unanchored-bonus-percent-no-extra-anchor-candidates`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- `2058843` et `2302974` n'ajoutent pas de nouveau compact ni de selecteur utile
- la prochaine action reste : decoder davantage de payloads candidats ou chercher une table source hors du corpus decode actuel

Decision :

Les deux lignes sans ancre de la matrice actuelle sont fermees comme preuves de promotion. Elles restent utiles comme couverture negative, mais ne permettent pas d'attribuer `949/12337/10` au champ exact de `1663210`.

## Audit des contextes metadata 12337 / scale 10

Un audit dedie separe maintenant l'interpretation de `metadata 12337 / scale 10` de celle du `selector 949`.

Fichier genere :

- `outputs/diablo4-metadata-12337-context-audit/metadata-12337-context-audit.json`

Resultats :

- lignes inspectees : `3`
- lignes verifiees dans les payloads decodes : `3`
- selecteurs observes : `949`, `997`, `1126`
- familles observees : `direct-bonus-percent`, `affix-value-normalized`
- occurrences avec selecteur different de `949` : `2`
- assessment : `metadata-12337-scale-10-cross-selector`
- confiance : `medium-high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Contextes verifies :

- `1663210`
  - selecteur : `949`
  - cible : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
  - metadata : `12337`
  - scale : `10`
- `2058843`
  - selecteur : `997`
  - cible : `Bonus_Percent_Per_Power#Paragon_Spiritborn_Legendary_007`
  - metadata : `12337`
  - scale : `10`
- `1882772`
  - selecteur : `1126`
  - cible : `Affix_Value_1#S05_BSK_Generic_001 / 100`
  - metadata : `12337`
  - scale : `10`

Integration :

- script : `work/diablo4-data-exporter/scripts/audit-metadata-12337-contexts.js`
- argument audit : `--metadata-12337-context-audit`
- champ preuve : `evidenceSummary.metadata12337ContextAssessment`
- ligne site : `Metadata 12337`
- le `proofState` du blocage `field-level-parser-required` inclut maintenant `metadata-12337-scale-10-cross-selector`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- la prochaine action champ devient : identifier la signification de `metadata 12337 / scale 10` separement du selecteur, puis chercher le champ proprietaire du `selector 949`
- cette preuve empeche d'utiliser `12337/10` comme preuve directe que `selector 949` porte le bonus fiable

Decision :

`12337/10` est une preuve transversale de metadata/scale, pas une preuve suffisante du role de `selector 949`. Le delta `48960` reste donc bloque en what-if, et la suite doit isoler la signification de cette metadata avant toute promotion DPS.

## Scan corpus metadata 12337 / opcode 6 / float 10

Le scan precedent partait des exemples deja connus. Un scan corpus verifie maintenant directement le motif brut `12337 / opcode 6 / float 10` dans tous les payloads decodes.

Fichier genere :

- `outputs/diablo4-metadata-12337-scale-corpus/metadata-12337-scale-corpus-scan.json`

Resultats :

- payloads decodes scannes : `86`
- fichiers avec hits : `14`
- hits `12337/6/10` : `23`
- formes :
  - `metadata-scale-without-near-selector` : `20`
  - `compact-selector-949-current-asset-scale` : `1`
  - `compact-selector-997-current-asset-scale` : `1`
  - `extended-selector-1126-affix-normalization-scale` : `1`
- selecteurs proches :
  - `949` : `1`
  - `997` : `1`
  - `1126` : `1`
  - aucun selecteur proche : `20`
- assessment : `metadata-12337-scale-cross-selector-corpus-confirmed`
- confiance : `medium-high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Integration :

- script : `work/diablo4-data-exporter/scripts/scan-metadata-12337-scale-corpus.js`
- argument audit : `--metadata-12337-scale-corpus`
- champ preuve : `evidenceSummary.metadata12337ScaleCorpusAssessment`
- ligne site : `Corpus 12337`
- le `proofState` du blocage `field-level-parser-required` inclut maintenant `metadata-12337-scale-cross-selector-corpus-confirmed`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- la prochaine action champ devient : interpreter `metadata 12337 / scale 10` comme une metadata transversale, puis isoler le champ proprietaire du `selector 949`
- les `20` hits sans selecteur proche rendent impossible une promotion par simple presence de `12337/10`

Decision :

`12337/6/10` est maintenant classe comme metadata/scale transversale dans le corpus decode. Le travail restant sur `1663210` doit donc cibler le layout et l'ownership du `selector 949`, pas la promotion du delta via `12337/10`.

## Scan corpus des couples selector -> asset-like

Un scan corpus cible maintenant le vrai candidat d'ownership : le couple `selector -> asset-like` adjacent, separe de la metadata transversale `12337/10`.

Fichier genere :

- `outputs/diablo4-selector-asset-pair-corpus/selector-asset-pair-corpus-scan.json`

Resultats :

- payloads decodes scannes : `86`
- couples trouves : `7`
- groupes : `5`
- groupes `selector 949` : `2`
- groupes compacts `selector 949` : `1`
- groupes non compacts `selector 949` : `1`
- groupes `selector 994` : `1`
- assessment : `selector-949-owner-pair-mixed-layout`
- confiance : `medium-high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Groupes principaux :

- `selector 994`
  - shape : `selector-asset-no-local-metadata`
  - famille : `bonus-percent-per-power`
  - assets : `1489641`, `199516`, `202484`
  - interpretation : selecteur bonus repete sans metadata locale
- `selector 949`
  - shape compact : `selector-asset-compact-metadata-scale`
  - asset : `1663210`
  - interpretation : cas compact local avec metadata transversale
- `selector 949`
  - shape non compact : `selector-asset-wrapper-or-variant`
  - asset-like : `1975049`
  - source : `1953817`
  - interpretation : wrapper/variant, pas equivalent au compact de `1663210`
- `selector 997`
  - shape : `selector-asset-compact-metadata-scale`
  - asset : `2058843`
  - interpretation : autre compact bonus, avec metadata transversale
- `selector 1126`
  - shape : `selector-asset-divergent-tail`
  - asset-like : `1882770`
  - famille : `affix-value`

Integration :

- script : `work/diablo4-data-exporter/scripts/scan-selector-asset-pair-corpus.js`
- argument audit : `--selector-asset-pair-corpus`
- champ preuve : `evidenceSummary.selectorAssetPairAssessment`
- ligne site : `Pairs selector`
- le `proofState` du blocage `field-level-parser-required` inclut maintenant `selector-949-owner-pair-mixed-layout`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- la prochaine action champ devient : separer les layouts `selector->asset` compact et non compact, puis parser le champ proprietaire avant toute promotion DPS
- le corpus prouve que `selector 949` n'a pas encore un layout unique et stable

Decision :

Le champ proprietaire de `selector 949` reste bloque car il existe au moins deux layouts : compact sur `1663210`, wrapper/variant sur `1953817`. Le prochain travail doit construire un parser qui separe ces layouts avant de calculer quoi que ce soit en DPS fiable.

## Parser des layouts selector -> asset-like

Le scan des couples `selector -> asset-like` est maintenant transforme en layouts exploitables, sans promotion DPS.

Fichier genere :

- `outputs/diablo4-selector-asset-layout-parser/selector-asset-layout-parser.json`

Resultats :

- layouts : `4`
- groupes source : `5`
- hits source : `7`
- layouts `selector 949` : `2`
- layouts compacts `selector 949` : `1`
- layouts non compacts `selector 949` : `1`
- assessment : `selector-949-layout-parser-blocked-mixed-layout`
- confiance : `high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Layouts `selector 949` :

- `compact-metadata-scale-layout`
  - asset compact : `1663210`
  - champs candidats : `selector`, `assetRef`, `postAssetA`, `postAssetB`, `metadataId 12337`, `opcode 6`, `scale 10`
- `wrapper-or-variant-layout`
  - asset-like non compact : `1975049`
  - source : `1953817`
  - champs candidats : `selector`, `assetRef`, `variantOrWrapperId`

Integration :

- script : `work/diablo4-data-exporter/scripts/parse-selector-asset-layouts.js`
- argument audit : `--selector-asset-layout-parser`
- champ preuve : `evidenceSummary.selectorAssetLayoutAssessment`
- ligne site : `Layouts selector`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- la prochaine action champ devient : parser les champs proprietaires par layout, puis trouver une seconde preuve compacte ou une table source avant toute promotion DPS
- le site affiche maintenant `Layouts selector : selector-949-layout-parser-blocked-mixed-layout (1/1 pour 949)`

Decision :

Le layout compact de `1663210` n'est toujours pas promouvable : `selector 949` traverse au moins deux layouts, et la metadata `12337/10` est deja prouvee transversale. La suite doit isoler le champ proprietaire par layout ou trouver une table source nommee.

## Audit des champs proprietaires par layout selector

Les layouts `selector -> asset-like` sont maintenant convertis en champs candidats, toujours sans promotion DPS.

Fichier genere :

- `outputs/diablo4-selector-asset-owner-fields/selector-asset-owner-fields.json`

Resultats :

- layouts audites : `4`
- layouts `selector 949` : `2`
- layouts `selector 949` encore bloques : `2`
- champs candidats : `4`
- layouts compacts `949` : `1`
- layouts variants `949` : `1`
- assessment : `selector-949-owner-fields-blocked-by-mixed-layout`
- confiance : `high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Champs candidats :

- `compact-metadata-scale-layout:metadataId`
- `compact-metadata-scale-layout:opcode`
- `compact-metadata-scale-layout:scale`
- `wrapper-or-variant-layout:variantOrWrapperId`

Interpretation :

- le layout compact porte bien `metadataId 12337`, `opcode 6`, `scale 10`
- ce layout compact est partage par `selector 949` et `selector 997`
- `selector 949` possede aussi un layout `wrapper-or-variant`, via l'asset-like `1975049`
- aucun champ n'est donc promouvable comme champ proprietaire DPS de `1663210`

Integration :

- script : `work/diablo4-data-exporter/scripts/audit-selector-asset-owner-fields.js`
- argument audit : `--selector-asset-owner-fields`
- champ preuve : `evidenceSummary.selectorAssetOwnerFieldAssessment`
- ligne site : `Champs selector`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- la prochaine action champ devient : chercher une table source nommee ou une seconde preuve compacte `selector 949` avant d'attribuer `metadata 12337 / scale 10` au bonus

Decision :

Le champ exact du bonus reste bloque au niveau ownership. Le compact `949 / asset / 0 / 0 / 12337 / 6 / 10` est un candidat utile, mais il n'est pas encore une preuve de DPS fiable parce que le compact est transversal et `selector 949` a aussi un layout variant.

Verification table/source :

- l'ancien audit `hash-suffix-named-table-audit` reste negatif : `1521` contextes `949/12337`, `0` candidat independant
- les rapports `table-candidates` contiennent des occurrences numeriques de `949`, mais sous forme de bruit decimal, d'ids sans libelle ou de headers non relies au suffixe
- aucune table source nommee exploitable n'est donc disponible dans les artefacts locaux actuels

## Audit de couverture Bonus_Percent_Per_Power

La couverture large des assets explicites `Bonus_Percent_Per_Power` est maintenant auditee contre les payloads deja decodes et les layouts selector.

Fichier genere :

- `outputs/diablo4-bonus-percent-coverage-audit/bonus-percent-coverage-audit.json`

Resultats :

- assets explicites externes : `6`
- assets decodes : `6`
- assets manquants : `0`
- assets avec `selector 949` : `2`
- second compact `selector 949` : `0`
- assessment : `bonus-percent-coverage-exhausted-no-second-compact-949`
- confiance : `high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Assets couverts :

- `202484` : selector `994`, no-local-metadata
- `1489641` : selector `994`, no-local-metadata
- `1663210` : selector `949`, compact metadata/scale, asset de reference seulement
- `1953817` : selector `949`, non compact
- `2058843` : compact metadata/scale, mais selector different de `949`
- `2302974` : payload decode via `outputs/diablo4-gameplay-candidates/data.004.20028655.decoded.bin`, sans selector `949`

Integration :

- script : `work/diablo4-data-exporter/scripts/audit-bonus-percent-coverage.js`
- argument audit : `--bonus-percent-coverage-audit`
- champ preuve : `evidenceSummary.bonusPercentCoverageAssessment`
- ligne site : `Couverture bonus`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- la prochaine action du blocage champ devient : elargir la recherche au-dela des hits explicites `Bonus_Percent_Per_Power` ou trouver une source table hors des artefacts actuels

Decision :

La piste "decoder un asset explicite Bonus_Percent_Per_Power manquant" est fermee. Tous les hits explicites connus sont couverts, et aucun ne fournit un second compact `selector 949 / metadata 12337 / scale 10`. La suite doit chercher hors de cette couverture : tables sources, dictionnaires, ou motifs non explicites.

## Audit des alternatives locales de table/source

Les preuves locales de table ou dictionnaire sont maintenant consolidees en un audit de decision.

Fichier genere :

- `outputs/diablo4-local-table-source-alternatives/local-table-source-alternatives.json`

Resultats :

- tables independantes candidates : `0`
- dictionnaires proches de `949/12337/10` : `0`
- assets explicites manquants : `0`
- second compact `949` : `0`
- contextes table utiles dans `table-candidates` : `0`
- contextes numeriques bruts : `4`
- assessment : `local-table-source-alternatives-exhausted`
- confiance : `high`
- ownership champ : `not-proven`
- promotion DPS fiable : `false`

Integration :

- script : `work/diablo4-data-exporter/scripts/audit-local-table-source-alternatives.js`
- argument audit : `--local-table-source-alternatives`
- champ preuve : `evidenceSummary.localTableSourceAssessment`
- ligne site : `Source locale`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- la prochaine action du blocage champ devient : basculer vers une recherche hors artefacts locaux ou traiter les autres blocages `SF_33` / uptime sans promouvoir le delta DPS

Decision :

La branche locale `949/12337/10` est fermee pour le moment. Elle garde une valeur de preuve structurelle, mais ne peut pas resoudre seule le DPS fiable. Le travail doit maintenant soit aller chercher une source externe aux artefacts locaux, soit avancer sur les deux autres verrous : condition `SF_33` et uptime.

## Audit du trigger SF_33 / build-state

Le verrou `SF_33` est maintenant audite separement de la piste `949/12337/10`.

Fichier genere :

- `outputs/diablo4-sf33-build-state-trigger-audit/sf33-build-state-trigger-audit.json`
- `outputs/diablo4-sf33-build-state-trigger-audit/blocked-build-state-template.json`

Resultats :

- trigger : `Mod.SoilRuler_B`
- slot controle : `sf:1663210:33`
- role du slot : `branch-condition`
- relation structurelle : presente (`Mod.SoilRuler_B` -> branche conditionnelle `SF_33`)
- entree build-state existante : absente
- definition exacte hors asset courant : absente
- assessment : `sf33-trigger-candidate-flag-unmapped`
- confiance : `medium-high`
- promotion DPS fiable : `false`
- template bloque : `Mod.SoilRuler_B` ajoute comme flag build-state avec `defaultValue: null`, `status: blocked-unmapped`, `promotionReady: false`

Integration :

- script : `work/diablo4-data-exporter/scripts/audit-sf33-build-state-trigger.js`
- argument audit : `--sf33-build-state-trigger-audit`
- champ preuve : `evidenceSummary.sf33BuildStateTriggerAssessment`
- ligne site : `Trigger SF33`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- le blocage `sf33-trigger-build-state-unmapped` affiche maintenant : `sf33-trigger-candidate-flag-unmapped: structural oui, build-state non`
- prochaine action : ajouter `Mod.SoilRuler_B` comme flag build-state bloque, puis isoler l'upgrade/toggle/aspect qui l'active avant toute promotion DPS

Decision :

`Mod.SoilRuler_B` est un bon candidat de flag de build, mais pas encore une condition exploitable. On ne force donc pas `SF_33 != 0` dans le DPS fiable ; le what-if reste bloque jusqu'a preuve de source d'activation et d'uptime.

Le template bloque permet maintenant au moteur de porter ce flag dans le graphe build-state sans inventer sa valeur. Il prepare la suite, mais ne change aucun calcul fiable.

## Audit de source d'activation SF_33

La recherche locale de source d'activation pour `Mod.SoilRuler_B` est maintenant consolidee dans un audit de corpus.

Fichier genere :

- `outputs/diablo4-sf33-activation-source-corpus/sf33-activation-source-corpus.json`

Resultats :

- fichiers scannes : `327`
- fichiers avec occurrence : `39`
- occurrences totales : `274`
- assets exacts : `1663210`
- assets exacts externes : `0`
- assessment : `sf33-activation-source-not-found-local-corpus`
- confiance : `high`
- promotion DPS fiable : `false`

Integration :

- script : `work/diablo4-data-exporter/scripts/audit-sf33-activation-source-corpus.js`
- argument audit : `--sf33-activation-source-corpus`
- champ preuve : `evidenceSummary.sf33ActivationSourceAssessment`
- ligne site : `Activation SF33`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- le blocage `sf33-trigger-build-state-unmapped` affiche maintenant : `sf33-activation-source-not-found-local-corpus: exact externe 0, fichiers 39`
- prochaine action : elargir la recherche hors artefacts locaux ou explorer les donnees d'upgrade/aspect/passif liees a `Spiritborn_Talent_Ultimate_2`

Decision :

Le corpus local ne suffit pas a mapper `Mod.SoilRuler_B` a une option de build. Le flag reste donc porte par le build-state comme valeur inconnue bloquee, sans activation automatique de `SF_33`.

## Audit uptime du scenario SF_32/SF_33

Le verrou `uptime-not-proven` est maintenant audite separement, afin de distinguer les formules de probabilite voisines d'une vraie preuve d'uptime.

Fichier genere :

- `outputs/diablo4-uptime-proof-audit/uptime-proof-audit.json`

Resultats :

- asset : `1663210`
- scenario audite : `sf33-active-sf32-30pct`
- DPS what-if : `212160`
- delta what-if : `48960`
- formules voisines de probabilite : `2`
- formules voisines liees a `SF_32/SF_33` : `0`
- uptime explicite : `false`
- uptime numerique : `false`
- assessment : `uptime-neighbor-formulas-unlinked`
- confiance : `medium-high`
- promotion DPS fiable : `false`

Formules voisines :

- `(1-POW(1-SF_28/100,1/2))*100`
- `(1-POW(1-SF_29/100,1/(SF_9*2)))*100`

Integration :

- script : `work/diablo4-data-exporter/scripts/audit-uptime-proof.js`
- argument audit : `--uptime-proof-audit`
- champ preuve : `evidenceSummary.uptimeProofAssessment`
- ligne site : `Uptime`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- le blocage `uptime-not-proven` affiche maintenant : `uptime-neighbor-formulas-unlinked: voisins 2, lies 0`
- prochaine action : mapper `SF_28/SF_29` et leur role gameplay avant de les utiliser comme uptime, sinon garder le scenario en what-if bloque

Decision :

Les formules `SF_28/SF_29` sont utiles comme pistes de probabilite, mais elles ne prouvent pas l'uptime du boost `SF_32/SF_33`. Aucune valeur d'uptime ne doit entrer dans le DPS fiable pour le moment.

## Audit du role SF_28 / SF_29

Les slots `SF_28` et `SF_29` sont maintenant audites comme sources possibles d'uptime, en croisant variables canoniques, roles DPS et inspection bytecode.

Fichier genere :

- `outputs/diablo4-sf28-sf29-role-audit/sf28-sf29-role-audit.json`

Resultats :

- slots : `sf:1663210:28`, `sf:1663210:29`
- kind canonique : `script-formula-local`
- formules de probabilite compilees : `2`
- voisins de probabilite : `2`
- voisins lies a `SF_32/SF_33` : `0`
- role uptime detecte : `false`
- role actuel : `utility-or-scaling`
- assessment : `sf28-sf29-probability-local-not-uptime-proof`
- confiance : `medium-high`
- promotion DPS fiable : `false`

Integration :

- script : `work/diablo4-data-exporter/scripts/audit-sf28-sf29-roles.js`
- argument audit : `--sf28-sf29-role-audit`
- champ preuve : `evidenceSummary.sf28Sf29RoleAssessment`
- ligne site : `SF28/SF29`

Impact diagnostic :

- le rapport de blocage reste a `3` blocages actifs, `0` resolu, `promotionReady: false`
- le blocage `uptime-not-proven` affiche maintenant : `sf28-sf29-probability-local-not-uptime-proof: proba compilee 2, role uptime non`
- prochaine action : chercher la source gameplay de `SF_28/SF_29` ou une condition utilisateur explicite avant toute utilisation comme uptime fiable

Decision :

`SF_28/SF_29` prouvent que des calculs de probabilite existent dans l'asset, pas que le boost `SF_32/SF_33` possede une uptime fiable. Ils restent des pistes, pas des entrees de DPS reel.

## Socle moteur buckets strict-only

La composition cible expose maintenant un bloc `bucketEngine` separe des totaux historiques. Ce bloc pose le socle du futur moteur Diablo IV par buckets sans promouvoir les candidats conditionnels.

Fichier regenere :

- `outputs/diablo4-target-build-composition/target-build-composition.json`

Code modifie :

- `work/diablo4-data-exporter/src/dps-model.js`
- `site/app.js`

Resultats de reference :

- build : `1461593 + 1663210`
- version moteur : `diablo4-bucket-engine-preview-v1`
- statut moteur : `strict-only-blocked-candidates`
- DPS strict : `1276410`
- DPS calcule par formule buckets : `1276410`
- parite buckets : `0`
- DPS what-if : `1325370`
- delta candidat bloque : `48960`
- delta candidat fiable : `0`
- promotion buckets : `false`

Garde-fous ajoutes :

- le DPS strict reste la seule valeur fiable exploitable par l'optimiseur
- les candidats conditionnels ne changent pas `reliableCandidateDelta` tant que champ, trigger et uptime ne sont pas prouves
- les caps et conflits restent descriptifs tant que leur semantique Diablo IV n'est pas mappee
- l'interface produit et affiche aussi ce statut moteur buckets pour la composition courante du navigateur

Audit de blocages regenere :

- `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json`
- blocages : `3`
- resolus : `0`
- actifs : `3`
- promotion ready : `false`

Limite d'execution :

L'audit complet avec tous les anciens chemins de preuves a echoue car `outputs/diablo4-field-record-inspection/field-record-inspection.json` n'existe pas dans ce workspace. L'audit final a donc ete relance avec les preuves presentes et pertinentes : contexte candidat, sources SF, recherche definition, trigger `SF_33`, corpus activation `SF_33`, audit uptime et role `SF_28/SF_29`.

Verification :

- syntaxe `work/diablo4-data-exporter/src/dps-model.js` : OK
- syntaxe `site/app.js` : OK
- fichiers site et composition presents
- le serveur local `http://127.0.0.1:4173/site/` n'etait pas joignable pendant cette passe ; le redemarrage en arriere-plan a ete refuse par les permissions de session

Decision :

Le moteur buckets peut maintenant servir de base stricte pour la suite, mais le candidat `1663210` reste bloque pour le DPS reel. La prochaine etape utile est d'alimenter ce moteur avec des modifiers plus fins que `estimatedDps`, puis d'ajouter les contraintes de slots/conflits avant l'optimiseur automatique.

## Socle contraintes de build

La composition cible expose maintenant un bloc `constraints` separe du score DPS. Ce bloc prepare l'optimiseur automatique : il peut refuser un build invalide sans modifier les totaux stricts ou what-if.

Fichier regenere :

- `outputs/diablo4-target-build-composition/target-build-composition.json`

Code modifie :

- `work/diablo4-data-exporter/src/dps-model.js`
- `site/app.js`

Resultats sur le build de reference :

- build : `1461593 + 1663210`
- version contraintes : `target-build-constraints-v1`
- validite contraintes : `false`
- optimizer ready : `false`
- classes detectees : `necromancer`, `spiritborn`
- issues : `2`
- issue haute priorite : `mixed-hero-classes`
- issue moyenne priorite : `slot-data-not-normalized`
- asset slot a normaliser : `1461593`

Impact DPS :

- DPS strict conserve : `1276410`
- DPS what-if conserve : `1325370`
- delta candidat conserve : `48960`
- qualite modele conservee : `partiel`, `60 / 100`
- promotion DPS fiable : `false`

Integration interface :

- l'interface affiche maintenant le statut contraintes dans la composition courante
- un build multi-classes est marque comme bloque pour l'optimiseur automatique
- les slots d'aspects non normalises sont visibles comme prochaine etape avant les conflits d'equipement

Decision :

Les contraintes de build ne remplacent pas le modele DPS. Elles forment une barriere supplementaire pour l'optimiseur : meme avec un DPS strict calculable, un build multi-classes ou sans slots normalises ne doit pas etre propose comme build jouable.

## Audit readiness des slots d'aspects

Un audit dedie aux slots d'aspects a ete ajoute pour eviter de remplir `allowedSlots` avec des valeurs devinees. L'objectif est de separer les slots prouves, les tokens suspects a confirmer, et les aspects sans preuve de slot.

Fichier genere :

- `outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json`

Script ajoute :

- `work/diablo4-data-exporter/scripts/audit-aspect-slot-readiness.js`

Integration :

- `compose-target-build` accepte maintenant `--aspect-slot-readiness`
- `constraints.source` indique le rapport utilise
- l'issue `slot-data-not-normalized` porte une preuve par asset

Resultats :

- aspects audites : `1`
- slots normalises : `0`
- aspects bloques : `1`
- candidats par token texte : `0`
- promotion slots : `false`
- asset bloque : `1461593`
- assessment `1461593` : `aspect-slots-not-found`
- tokens slots detectes : `0`

Impact composition :

- `constraints.source.aspectSlotReadinessMode` : `aspect-slot-readiness-v1`
- `slot-data-not-normalized.evidence[1461593].readiness` : `aspect-slots-not-found`
- DPS strict conserve : `1276410`
- DPS what-if conserve : `1325370`
- blocages DPS `1663210` inchanges : `3`

Decision :

Il n'y a pas encore de preuve de slot pour `1461593` dans les tags, labels ou formules normalises. Les slots d'aspects doivent donc etre extraits depuis les records source ou une table d'aspects avant de construire les conflits d'equipement. Aucun slot ne doit etre devine pour l'optimiseur fiable.

## Audit source locale des slots d'aspects

Un audit source a ete ajoute pour scanner directement les payloads decodes de `1461593` et ses voisins locaux a la recherche de tokens de slots d'equipement. Cette etape verifie que l'absence de slots ne vient pas seulement du dataset normalise.

Fichier genere :

- `outputs/diablo4-aspect-slot-source-evidence/aspect-slot-source-evidence.json`

Script ajoute :

- `work/diablo4-data-exporter/scripts/audit-aspect-slot-source-evidence.js`

Perimetre :

- asset : `1461593`
- dossiers scannes :
  - `outputs/diablo4-source-asset-1461593-payload`
  - `outputs/diablo4-source-asset-1461593-payload-neighbor-scan`
- fichiers scannes : `42`

Resultats :

- fichiers avec tokens de slot : `0`
- hits de tokens de slot : `0`
- hits directs dans le payload asset : `0`
- assessment : `slot-token-not-found-in-decoded-source`
- confiance : `medium-high`
- contrainte slot ready : `false`
- promotion slots : `false`

Integration readiness :

- `outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json` reference maintenant `aspect-slot-source-evidence-v1`
- `1461593.evidence.sourceEvidenceAssessment` : `slot-token-not-found-in-decoded-source`
- `1461593.evidence.sourceEvidenceSlotTokenHits` : `0`
- finding mis a jour : aucun slot explicite dans les donnees normalisees ni dans les payloads source locaux scannes

Impact composition :

- DPS strict conserve : `1276410`
- DPS what-if conserve : `1325370`
- contraintes restent invalides : `mixed-hero-classes` + `slot-data-not-normalized`
- blocages DPS `1663210` inchanges : `3`, promotion `false`

Decision :

La piste locale "token de slot dans le payload ou voisinage decode" est fermee pour `1461593`. La suite doit chercher une table/champ source des slots d'aspects, ou elargir le decode vers des assets explicitement nommes par slot, avant de remplir `allowedSlots`.

## Audit du pont externe vers les slots d'aspects

Un audit du pont externe a ete ajoute pour traiter le cas `Helm_Unique_Necro_100`. Le but est de distinguer un nom qui contient un slot d'une preuve exploitable pour `allowedSlots`.

Fichier genere :

- `outputs/diablo4-aspect-slot-external-bridge/aspect-slot-external-bridge.json`

Script ajoute :

- `work/diablo4-data-exporter/scripts/audit-aspect-slot-external-bridge.js`

Sources :

- `outputs/diablo4-external-references/external-references.json`
- `outputs/diablo4-external-target-search/external-target-search.json`

Resultats :

- candidats externes audites : `15`
- candidats dont le nom contient un slot : `5`
- slots inferes par nom : `helm`
- preuves utilisables pour `allowedSlots` : `0`
- assessment : `external-slot-name-only-not-proof`
- confiance : `medium-high`
- promotion slots : `false`

Interpretation :

- `Helm_Unique_Necro_100` est bien detecte comme indice de slot `helm`
- mais il apparait via des references de valeur d'affixe/hash, notamment `Affix_Flat_Value_1#Helm_Unique_Necro_100`
- ce n'est pas un champ source `allowedSlots`
- aucune contrainte d'equipement fiable ne doit etre construite a partir de ce nom seul

Integration readiness :

- `1461593.evidence.externalBridgeMode` : `aspect-slot-external-bridge-v1`
- `1461593.evidence.externalBridgeAssessment` : `external-slot-name-only-not-proof`
- `1461593.evidence.externalInferredSlots` : `helm`
- `1461593.evidence.externalUsableAllowedSlotProofs` : `0`
- finding mis a jour : un nom externe suggere un slot, mais aucune preuve `allowedSlots` n'est disponible

Impact composition :

- DPS strict conserve : `1276410`
- DPS what-if conserve : `1325370`
- contraintes restent invalides : `mixed-hero-classes` + `slot-data-not-normalized`
- blocages DPS `1663210` inchanges : `3`, promotion `false`

Decision :

`helm` reste une piste d'investigation, pas une valeur de slot. La prochaine etape doit chercher un champ ou une table `allowedSlots` / `aspect-equipment`, pas promouvoir les noms de cibles de valeur d'affixe.

## Audit table/source des slots d'aspects

Un audit table/source a ete ajoute pour chercher dans les sorties JSON existantes des champs ou tables qui pourraient porter les slots d'aspects : `allowedSlots`, `equipmentSlot`, `ItemType`, `aspectEquipment`, `slotMask`, etc.

Fichier genere :

- `outputs/diablo4-aspect-slot-table-source/aspect-slot-table-source.json`

Script ajoute :

- `work/diablo4-data-exporter/scripts/audit-aspect-slot-table-source.js`

Perimetre :

- racine scannee : `outputs`
- fichiers JSON audites : `327`
- dossiers d'audit slot deja generes exclus pour eviter l'auto-preuve

Resultats :

- contextes termes surveilles : `3`
- contextes champ slot direct : `3`
- contextes nom de slot utiles : `0`
- preuves directes table/source : `0`
- assessment : `aspect-slot-table-source-not-found`
- confiance : `medium-high`
- promotion slots : `false`

Integration readiness :

- `1461593.evidence.tableSourceMode` : `aspect-slot-table-source-audit-v1`
- `1461593.evidence.tableSourceAssessment` : `aspect-slot-table-source-not-found`
- `1461593.evidence.tableSourceDirectProofs` : `0`

Impact composition :

- DPS strict conserve : `1276410`
- DPS what-if conserve : `1325370`
- contraintes restent invalides : `mixed-hero-classes` + `slot-data-not-normalized`
- blocages DPS `1663210` inchanges : `3`, promotion `false`

Decision :

Aucune sortie JSON actuelle ne contient une table ou un champ source exploitable pour `allowedSlots`. La prochaine etape doit elargir le decode vers des assets/tables d'equipement, ou ajouter un parseur de records source capable de nommer les champs de slot.

## Plan de recherche source des slots d'aspects

Un plan de recherche a ete genere pour elargir proprement la recherche vers les fichiers du jeu, sans remplir `allowedSlots` ni promouvoir l'indice `helm`.

Fichiers generes :

- `outputs/diablo4-aspect-slot-source-search-plan/aspect-slot-source-search-plan.json`
- `outputs/diablo4-aspect-slot-source-search-plan/run-aspect-slot-source-search.ps1`

Script ajoute :

- `work/diablo4-data-exporter/scripts/plan-aspect-slot-source-search.js`

Plan :

- fichiers jeu planifies : `205`
- shards : `7`
- taille shard : `32` fichiers, dernier shard `13`
- groupes de termes : `4`
- termes au total : `45`
- promotion slots : `false`

Groupes de termes :

- `slot-field-names` : `allowedSlots`, `equipmentSlot`, `EquipSlot`, `slotMask`, `ItemType`, `ItemEquipLocation`, etc.
- `aspect-equipment-table-names` : `AspectEquipment`, `LegendaryPower`, `UniquePower`, `CodexPower`, `PowerAspect`, etc.
- `slot-token-prefixes` : `Helm_`, `Chest_`, `Gloves_`, `Pants_`, `Boots_`, `Amulet_`, `Ring_`, `Weapon_`, `Offhand_`, `1HShield_`
- `known-necro-slot-leads` : `Helm_Unique_Necro_100`, `Affix_Flat_Value_1#Helm_Unique_Necro_100`, `legendary_necro_012`, `Necromancer_Talent_Caster_T3_N1`

Decision :

Ce plan est une preparation de scan, pas une preuve. Il doit etre execute puis audite avant toute modification de `allowedSlots`. Le statut `slot-data-not-normalized` reste actif pour `1461593`.

## Execution et audit de la recherche source des slots

Le plan de recherche source des slots a ete execute sur les `205` fichiers jeu planifies, puis fusionne et audite.

Fichiers generes :

- `outputs/diablo4-aspect-slot-source-search-plan/slot-source-search-merged/external-target-search-merged.json`
- `outputs/diablo4-aspect-slot-source-search-plan/slot-source-search-merged/external-target-search-merged-summary.json`
- `outputs/diablo4-aspect-slot-source-search-audit/aspect-slot-source-search-audit.json`

Script ajoute :

- `work/diablo4-data-exporter/scripts/audit-aspect-slot-source-search-results.js`

Resultats fusionnes :

- fichiers jeu scannes : `205`
- entrees decodees : `13867`
- entrees correspondantes : `110`
- groupes de termes matched : `14`

Audit des resultats :

- candidats actionnables : `35`
- candidats champ direct : `2`
- candidats table aspect/equipement : `0`
- candidats prefixe slot : `32`
- candidats piste connue : `1`
- preuve directe `allowedSlots/equipmentSlot` : `false`
- assessment : `itemtype-candidates-need-payload-inspection`
- promotion slots : `false`

Meilleur candidat direct :

- asset : `1092943`
- fichier : `data.176`
- offset : `6064916`
- groupe : `ItemType` / `itemType`
- chaines :
  - `GetItemTypeCountForPower(SNO.ItemType.Mace)`
  - `TechniqueSlotIsItemType(SNO.ItemType.Mace)`

## Audit du candidat ItemType

Le payload `1092943` a ete decode puis inspecte pour verifier si `ItemType` pouvait etre une source de slot d'aspect.

Fichiers generes :

- `outputs/diablo4-source-asset-1092943-payload/data.176.6064916.decoded.bin`
- `outputs/diablo4-source-asset-1092943-strings/decoded-string-structure.json`
- `outputs/diablo4-aspect-slot-itemtype-candidate/aspect-slot-itemtype-candidate.json`

Script ajoute :

- `work/diablo4-data-exporter/scripts/audit-aspect-slot-itemtype-candidate.js`

Resultats :

- chaines inspectees : `7`
- chaines `ItemType` : `2`
- chaines proches `allowedSlots/equipmentSlot` : `0`
- chaines technique/item type : `2`
- assessment : `itemtype-technique-condition-not-aspect-slot-source`
- confiance : `high`
- promotion slots : `false`

Decision :

Le meilleur candidat `ItemType` correspond a des conditions de technique/arme (`Mace`), pas a une table `allowedSlots` d'aspect. Il ne doit pas etre utilise pour remplir les slots de `1461593`. Le blocage `slot-data-not-normalized` reste actif.

## Reconciliation prioritaire des preuves champ SF_32

L'audit principal des blocages cible a ete regenere avec les chemins corrects des preuves locales de `1663210`. Cette passe remet dans `target-blocker-resolution.json` les rapports field-records, record-segments, record-headers, formula/hash, selector/layout, couverture `Bonus_Percent_Per_Power` et alternatives de table locale.

Fichier regenere :

- `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json`

Preuves reintegrees :

- `outputs/diablo4-source-asset-1663210-field-records/field-record-inspection.json`
- `outputs/diablo4-source-asset-1663210-record-segments/record-segment-inspection.json`
- `outputs/diablo4-source-asset-1663210-record-headers/record-header-inspection.json`
- `outputs/diablo4-formula-hash-field-boundaries/formula-hash-field-boundaries.json`
- `outputs/diablo4-selector-asset-owner-fields/selector-asset-owner-fields.json`
- `outputs/diablo4-bonus-percent-coverage-audit/bonus-percent-coverage-audit.json`
- `outputs/diablo4-local-table-source-alternatives/local-table-source-alternatives.json`

Verdict champ :

- blocage : `field-level-parser-required`
- statut : `blocked`
- resolved : `0`
- promotion ready : `false`
- field-record : `adjacent-record-cluster-not-field-owned`, confiance `high`
- record-segments : `formula-bytecode-plus-adjacent-hash-asset-cluster`, confiance `high`
- record-headers : `power-tag-formula-bytecode-bonus-asset-headers`, ownership `not-proven`
- formula/hash boundaries : zones formule/hash liees, ownership `not-proven`
- selector owner : `selector-949-owner-fields-blocked-by-mixed-layout`, confiance `high`
- table locale : `local-table-source-alternatives-exhausted`, confiance `high`
- couverture Bonus_Percent_Per_Power : `6/6` assets explicites decodes, `0` second compact `selector 949`

Interpretation :

Les preuves structurelles sont fortes : le cluster `PowerTag -> formule -> bytecode -> hash bonus -> asset id` est reel, et le compact local `selector 949 / asset 1663210 / metadata 12337 / scale 10` est trace. Mais l'ownership du champ `SF_32` n'est toujours pas prouve : `selector 949` existe en layouts mixtes, `metadata 12337 / 10` est transversale, et aucune table source nommee ne confirme que ce suffixe porte le bonus DPS.

Decision prioritaire :

Le parser local autour de `1663210` ne suffit plus a lui seul. La prochaine action utile est de chercher une source hors artefacts locaux ou une table nommee pour `selector 949 / metadata 12337 / scale 10`, ou bien d'avancer les blocages `SF_33` et uptime en gardant le delta `48960` strictement hors DPS fiable.

## Decision consolidee champ SF_32

Un audit de decision a ete ajoute pour transformer les nombreuses preuves du champ candidat `SF_32` en verdict lisible.

Fichiers generes :

- `work/diablo4-data-exporter/scripts/audit-sf32-field-promotion-decision.js`
- `outputs/diablo4-sf32-field-promotion-decision/sf32-field-promotion-decision.json`
- `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json`

Resultats :

- target asset : `1663210`
- champ cible : `SF_32`
- selector cible : `949`
- metadata : `12337`
- scale : `10`
- layouts `selector 949` : `2`
- second compact `selector 949` : `0`
- table locale independante : `0`
- hits metadata `12337` : `23`
- offsets source perimes : `3`
- matches frais : `0`
- assessment : `sf32-field-promotion-blocked-by-selector-949-evidence`
- confiance : `high`
- promotion DPS : `false`

Bloqueurs consolides :

- `selector-949-mixed-layout`
- `second-compact-selector-949-missing`
- `metadata-12337-scale-10-cross-selector`
- `local-table-source-missing`
- `record-header-source-links-stale`

Decision :

Le champ candidat `SF_32` reste non promouvable. Le compact local `selector 949 / asset 1663210 / metadata 12337 / scale 10` est une bonne piste structurelle, mais il n'est pas une preuve d'ownership : `selector 949` existe en layouts mixtes, `metadata 12337 / scale 10` est transverse, aucune table source locale n'est trouvee, et les anciens offsets ne sont pas reconfirmes.

## Audit dependance uptime SF_28/SF_29

Un audit dedie a ete ajoute pour verifier si les formules de probabilite voisines pouvaient expliquer l'uptime du scenario booste `SF_33/SF_32`.

Fichiers generes :

- `work/diablo4-data-exporter/scripts/audit-uptime-neighbor-dependency.js`
- `outputs/diablo4-uptime-neighbor-dependency/uptime-neighbor-dependency.json`
- `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json`

Resultats :

- formules locales de probabilite retenues : `2`
- formules liees a la branche `SF_32/SF_33` : `0`
- uptime explicite : `false`
- uptime numerique : `false`
- assessment : `uptime-probability-neighbors-not-linked-to-boost-branch`
- confiance : `high`
- promotion DPS : `false`

Preuve :

- le hash cible `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` est a l'offset `18948`
- `SF_28` suit a `+96` octets avec `(1-POW(1-SF_28/100,1/2))*100`
- `SF_29` suit a `+228` octets avec `(1-POW(1-SF_29/100,1/(SF_9*2)))*100`
- la derniere formule de branche boostee precedente est a l'offset `18324`
- les deux formules de probabilite ne referencent ni `SF_32` ni `SF_33`

Decision :

`SF_28/SF_29` ne doivent pas etre utilises comme uptime fiable pour le delta `48960`. Le blocage `uptime-not-proven` reste actif avec le proof state `proba locales 2, liees branche 0`. Une uptime ne peut etre ajoutee qu'avec une source gameplay externe ou une hypothese utilisateur separee du DPS strict.

## Audit parent binaire SF_33

Un audit de consolidation a ete ajoute pour determiner si le run binaire local autour de `Mod.SoilRuler_B` prouve une activation de build-state ou seulement un contexte local de flag.

Fichiers generes :

- `work/diablo4-data-exporter/scripts/audit-sf33-binary-parent-source.js`
- `outputs/diablo4-sf33-binary-parent-source/sf33-binary-parent-source.json`
- `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json`

Resultats :

- runs `Mod.Upgrade*` compares : `3`
- trailer du bloc `Mod.SoilRuler_B` : `5:90`
- trailers `Mod.Upgrade*` identiques : `3/3`
- consommateur voisin exact : `false`
- matches prefixe suivant exact : `0`
- matches bloc precedent exact : `0`
- sources nommees externes : `0`
- triggers externes : `0`
- assessment : `sf33-binary-parent-source-not-proven-local-context-only`
- confiance : `high`
- promotion `SF_33` : `false`

Interpretation :

La preuve binaire confirme que `Mod.SoilRuler_B` a une forme commune de flag `Mod.*`, comparable aux flags `Mod.Upgrade*`. En revanche, aucun record parent, consommateur voisin exact, source nommee externe ou trigger externe ne prouve que ce flag active la branche `SF_33` en gameplay.

Decision :

`SF_33` reste bloque. Le diagnostic cible indique maintenant : `trailer match oui, consommateur exact non, source externe 0`. La branche boostee ne doit pas etre activee en DPS fiable ; elle reste seulement disponible comme scenario what-if bloque.

## Readiness moteur buckets

La composition cible a ete enrichie avec une couche `bucketEngine.readiness` pour preparer l'optimiseur automatique sans promouvoir les candidats bloques.

Fichiers modifies :

- `work/diablo4-data-exporter/src/dps-model.js`
- `site/app.js`
- `site/styles.css`
- `outputs/diablo4-target-build-composition/target-build-composition.json`

Resultats de reference :

- strict total : `1276410`
- what-if total : `1325370`
- delta candidat : `48960`
- qualite : `partiel 60/100`
- promotion fiable : `false`

Readiness :

- version : `target-bucket-readiness-v1`
- `strictOnlyReady` : `true`
- `fineBucketsReady` : `false`
- `reliableOptimizerReady` : `false`
- `blockedCandidateCount` : `1`
- familles : `strict-base ready`, `additive empty`, `multiplicative empty`, `uptime blocked`, `caps empty`, `blocked-candidates blocked`

Decision :

Le moteur peut utiliser le DPS strict comme base controlee, mais il n'est pas encore pret pour une optimisation fiable par buckets Diablo IV. Les prochains jalons sont l'extraction de modifiers fins, la correction des contraintes de build (`mixed-hero-classes`, `slot-data-not-normalized`) et le maintien des candidats conditionnels hors DPS fiable.

Verification :

La composition a ete regeneree et les fichiers JSON/JS ont ete valides. Le serveur local n'a pas pu etre relance dans cette session a cause des permissions d'execution, mais le site a ete mis a jour pour afficher la readiness buckets.

## Plan optimiseur cible strict

Un premier plan d'optimisation automatique prudent a ete ajoute. Il ne cherche pas encore a produire un vrai meilleur build Diablo IV complet : il classe les entites cible par classe avec le DPS strict uniquement, puis garde les deltas conditionnels en information bloquee.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/index.html`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Resultats :

- mode : `target-optimizer-plan-v1`
- entites scorees : `4`
- classes : `3`
- `strictOnlyReady` : `true`
- `fineBucketsReady` : `false`
- `reliableOptimizerReady` : `false`
- `currentBuildValid` : `false`
- promotion fiable : `false`

Recommandations strictes actuelles :

- `necromancer` : assets `1461593,493422`, strict `1119210`, delta bloque `0`
- `spiritborn` : asset `1663210`, strict `163200`, delta bloque `48960`

Decision :

Le plan confirme que l'optimiseur peut proposer des bases strictes par classe, mais ne doit pas encore choisir un build final fiable. Le build de reference reste invalide pour optimisation automatique car il melange `necromancer` et `spiritborn`; les slots/conflits ne sont pas assez normalises; le delta `48960` de `1663210` reste un what-if bloque.

Interface :

Le site charge maintenant `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` et affiche un panneau `Plan optimiseur cible`. Les cartes par classe montrent le strict, le delta bloque et permettent de charger les assets recommandes dans le build courant.

Verification :

Les controles `node --check` passent pour `site/app.js` et `build-target-optimizer-plan.js`. Les JSON principaux sont lisibles. Le serveur local repond en HTTP sur `http://127.0.0.1:4173/site/` et sert aussi le nouveau rapport JSON. La verification via navigateur integre est restee non concluante dans cette session avec un refus de connexion cote onglet, malgre le serveur joignable depuis le workspace.

## Contraintes minimales du plan optimiseur

Le plan optimiseur cible a ete enrichi avec une evaluation minimale des contraintes avant de proposer une base de build.

Contraintes ajoutees :

- classe de heros connue
- classe unique dans la recommandation
- slots d'aspect prouves avant validation des conflits d'equipement

Resultats apres regeneration :

- plans contraints : `2`
- plans stricts valides : `1`
- plans stricts fiables : `0`
- meilleur plan strict valide : `spiritborn`
- asset retenu : `1663210`
- DPS strict : `163200`
- what-if separe : `212160`
- delta bloque : `48960`

Interpretation :

Le plan `spiritborn` est la meilleure base stricte valide parce qu'il ne melange pas de classe et ne depend pas de slot d'aspect non prouve. Il n'est pas un plan fiable complet, car son delta conditionnel reste bloque par `field-level-parser-required`, `sf33-trigger-build-state-unmapped` et `uptime-not-proven`.

Le plan `necromancer` garde le meilleur strict brut (`1119210`) mais il est bloque par `slot-data-not-normalized` sur `1461593`. L'indice externe `helm` reste seulement un indice de nom, pas une preuve `allowedSlots`.

Interface :

Le panneau `Plan optimiseur cible` affiche maintenant les compteurs `Plans valides` et `Fiables`, le meilleur plan strict valide, le statut de chaque carte, et les blocages de contraintes.

Verification :

`build-target-optimizer-plan.js` et `site/app.js` passent `node --check`. Le JSON `target-optimizer-plan.json` confirme `bestValidStrictBuild.class = spiritborn`, `validStrictBuilds = 1`, `reliableStrictBuilds = 0`, et `necromancer.status = blocked-by-constraints`.

## Audit des prefixes de slots

La piste restante dans le scan source des slots etait la famille des prefixes de noms : `Helm_`, `Boots_`, `Ring_`, `Amulet_`, `2H`, etc. Un audit dedie a ete ajoute pour verifier si ces hits sont de vrais champs de slot ou seulement des noms d'affixes/uniques.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/audit-aspect-slot-prefix-candidates.js`
- `outputs/diablo4-aspect-slot-prefix-candidates/aspect-slot-prefix-candidates.json`
- `work/diablo4-data-exporter/scripts/audit-aspect-slot-readiness.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json`
- `outputs/diablo4-target-build-composition/target-build-composition.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`

Resultats :

- candidats de prefixe : `32`
- familles de slots mentionnees : `7`
- candidats `helm` : `2`
- preuves utilisables `allowedSlots` : `0`
- candidats nominatifs seulement : `32`
- assessment : `slot-prefix-candidates-name-only`
- confiance : `high`
- promotion : `false`

Interpretation :

Les prefixes de slot trouves dans le scan sont des noms d'affixes/uniques ou d'etat d'arme, pas des champs source `allowedSlots`. Ils confirment que `helm` est une piste nominale plausible pour `1461593`, mais ne prouvent pas les slots autorises de l'aspect.

Impact :

La readiness de `1461593` porte maintenant la preuve consolidee :

- `externalInferredSlots` : `helm`
- `prefixCandidatesAssessment` : `slot-prefix-candidates-name-only`
- `prefixCandidatesUsableProofs` : `0`
- `prefixCandidatesHelmCandidates` : `2`

Decision :

Ne pas promouvoir `helm` en `allowedSlots`. Le plan `necromancer` reste bloque par `slot-data-not-normalized`, et le meilleur plan strict valide reste `spiritborn` (`1663210`, strict `163200`, delta bloque `48960`).

Verification :

Les scripts `audit-aspect-slot-prefix-candidates.js`, `audit-aspect-slot-readiness.js`, `build-target-optimizer-plan.js` et `site/app.js` passent `node --check`. La composition cible reste stable : strict `1276410`, what-if `1325370`, delta `48960`, qualite `partiel 60/100`.

## Conclusion du blocage slots 1461593

Un audit de conclusion a ete ajoute pour consolider toutes les preuves disponibles autour du blocage `slot-data-not-normalized` de `1461593`.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/audit-aspect-slot-blocker-conclusion.js`
- `outputs/diablo4-aspect-slot-blocker-conclusion/aspect-slot-blocker-conclusion.json`
- `work/diablo4-data-exporter/scripts/audit-aspect-slot-readiness.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json`
- `outputs/diablo4-target-build-composition/target-build-composition.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`

Sondes consolidees :

- source locale decodee : `42` fichiers, `0` token de slot
- pont externe : `5` noms avec slot, `0` preuve `allowedSlots`, slot infere `helm`
- recherche table JSON : `327` fichiers, `0` preuve source directe
- recherche source complete : `205` fichiers, `110` hits, `0` preuve directe `allowedSlots/equipmentSlot`
- candidat `ItemType` : `2` chaines, mais `2` conditions arme/technique, `0` slot aspect
- prefixes de slots : `32` candidats, `2` `helm`, `0` preuve utilisable

Verdict :

- sondes : `6`
- sondes pretes : `0`
- signaux de preuve utilisables : `0`
- `existingEvidenceExhausted` : `true`
- assessment : `aspect-slot-existing-evidence-exhausted`
- confiance : `high`
- promotion : `false`

Decision :

Les artefacts existants ne peuvent pas prouver `allowedSlots` pour `1461593`. Le plan `necromancer` reste bloque par `slot-data-not-normalized`; le meilleur plan strict valide reste `spiritborn`. La prochaine etape sur ce blocage doit etre un parseur binaire/champ source aspect-equipement, ou une source externe fiable de slots. Aucun nom `Helm_Unique_Necro_100`, prefixe `Helm_`, ni candidat `ItemType` ne doit etre promu.

Verification :

Les scripts `audit-aspect-slot-blocker-conclusion.js`, `audit-aspect-slot-readiness.js`, `build-target-optimizer-plan.js` et `site/app.js` passent `node --check`. Les sorties regenerees restent stables : strict `1276410`, what-if `1325370`, delta `48960`, `validStrictBuilds 1`, `reliableStrictBuilds 0`.

## Graine parseur binaire slots 1461593

Une premiere graine de parseur binaire a ete ajoutee pour verifier si les candidats trouves par le scan source portent un vrai champ de slot d'aspect ou seulement des references de valeurs d'affixes.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/seed-aspect-slot-binary-parser.js`
- `work/diablo4-data-exporter/scripts/audit-aspect-slot-binary-layout.js`
- `work/diablo4-data-exporter/scripts/audit-aspect-slot-blocker-conclusion.js`
- `outputs/diablo4-aspect-slot-binary-parser-seed/aspect-slot-binary-parser-seed.json`
- `outputs/diablo4-aspect-slot-binary-layout/aspect-slot-binary-layout.json`
- `outputs/diablo4-aspect-slot-blocker-conclusion/aspect-slot-blocker-conclusion.json`
- `outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json`
- `outputs/diablo4-target-build-composition/target-build-composition.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`

Resultats :

- candidats source : `33`
- candidats deja decodes et inspectes : `11`
- decodes manquants : `22`
- chaines binaires matchees : `32`
- references `Affix_Value` : `29`
- references nominales de slot : `1`
- champs directs de slot : `0`
- groupes de prelude : `27`
- assessment layout : `binary-layout-affix-value-records-only`
- confiance : `medium-high`
- promotion : `false`

Interpretation :

Les payloads inspectes montrent surtout des records de valeurs d'affixes autour de noms comme `Ring_`, `Boots_` ou `2H`. Ils ne montrent pas de champ direct `allowedSlots`, `equipmentSlot` ou aspect-equipement. Ces noms restent donc des indices de libelle, pas des contraintes d'equipement fiables.

Impact :

La conclusion consolidee du blocage `slot-data-not-normalized` passe a `7` sondes :

- source locale decodee
- pont externe par noms
- recherche table JSON
- recherche source complete
- candidat `ItemType`
- prefixes de slots
- layout binaire seed

Le bilan reste ferme : `0` sonde prete, `0` signal de preuve utilisable, `existingEvidenceExhausted true`, `slotConstraintReady false`, `promotionReady false`.

Decision :

Ne pas promouvoir `Helm_Unique_Necro_100`, `Helm_`, `Boots_`, `Ring_`, `Affix_Value` ou les preludes binaires de valeurs d'affixes en `allowedSlots`. Pour debloquer `1461593`, il faut maintenant trouver un vrai parseur champ source aspect-equipement ou une source externe fiable de slots.

## Grille de promotion SF_32

La decision `SF_32` de `1663210` a ete enrichie avec des portes de promotion explicites. L'objectif est de rendre la politique de l'optimiseur non ambigue : le delta `48960` reste visible comme scenario bloque, mais ne peut pas entrer dans le classement fiable.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/audit-sf32-field-promotion-decision.js`
- `work/diablo4-data-exporter/src/dps-model.js`
- `site/app.js`
- `site/styles.css`
- `outputs/diablo4-sf32-field-promotion-decision/sf32-field-promotion-decision.json`
- `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Portes de promotion :

- layout unique pour `selector 949` : `failed`
- second compact `selector 949` hors asset cible : `failed`
- specificite de `metadata 12337 / scale 10` a `selector 949` : `failed`
- table source nommee ou dictionnaire : `failed`
- liens record/header frais pour l'installation courante : `failed`

Resultats :

- portes passees : `0/5`
- portes echouees : `5/5`
- blocages : `selector-949-mixed-layout`, `second-compact-selector-949-missing`, `metadata-12337-scale-10-cross-selector`, `local-table-source-missing`, `record-header-source-links-stale`
- politique optimiseur : `reliableDps = strict-only`
- delta candidat : `blocked-what-if`
- utilisable pour ranking fiable : `false`
- exposable comme scenario : `true`
- promotion : `false`

Impact :

Le diagnostic cible reste a `3` blocages actifs, `0` resolu, `promotionReady false`. Le plan optimiseur reste en mode `strict-only-class-constrained-plan` avec `validStrictBuilds 1` et `reliableStrictBuilds 0`.

Interface :

Le panneau `Diagnostic blocages` affiche maintenant une carte `Decision SF_32` avec :

- ownership du champ : `not-proven`
- statut promotion : `bloquee`
- ranking : `strict-only`
- scenario : `visible`
- portes de promotion : `5`, toutes `failed`

Decision :

Continuer le moteur buckets et les contraintes strictes sans attendre la promotion `SF_32`. La promotion du delta `48960` exige au minimum une preuve qui ferme ces cinq portes; tant que ce n'est pas le cas, le score fiable de `1663210` reste `163200` et le what-if reste separe.

## Portes de fiabilite du plan optimiseur

Le plan optimiseur cible a ete enrichi avec des portes de fiabilite par recommandation de classe. Le but est de distinguer un plan strict chargeable d'un plan fiable utilisable pour ranking automatique.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Portes ajoutees :

- classe de heros connue
- classe de heros unique
- contraintes de slots prouvees
- delta conditionnel bloque resolu
- buckets fins prets
- blocages globaux resolus

Resultats actuels :

- echecs globaux : `blocked-delta-cleared`, `fine-buckets-ready`, `global-blockers-cleared`, `slot-constraints-proven`
- plan `necromancer` : `3/6` portes passees, `3/6` echouees, prochaine porte `slot-constraints-proven`, statut `blocked-by-constraints`
- plan `spiritborn` : `3/6` portes passees, `3/6` echouees, prochaine porte `blocked-delta-cleared`, statut `strict-valid-with-blocked-delta`
- plans stricts valides : `1`
- plans fiables : `0`

Interface :

Le panneau `Plan optimiseur cible` affiche maintenant les echecs globaux de fiabilite et, dans chaque carte de classe, une grille de portes `passed/failed` avec la prochaine porte a resoudre.

Decision :

Le plan `spiritborn` reste la meilleure base stricte valide, mais il n'est pas fiable pour ranking final tant que le delta bloque, les buckets fins et les blocages globaux ne sont pas resolus. Le plan `necromancer` reste prioritairement bloque par les slots de `1461593`.

## File d'actions optimiseur

Le plan optimiseur cible produit maintenant une file d'actions priorisee a partir des portes de fiabilite echouees.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Resultats :

- actions : `4`
- top action : `Debloquer le delta conditionnel spiritborn`
- action `#1` : `high`, focus `asset:1663210`, gate `blocked-delta-cleared`
- action `#2` : `high`, focus `asset:1461593`, gate `slot-constraints-proven`
- action `#3` : `medium`, focus `bucket-engine`, gate `fine-buckets-ready`
- action `#4` : `medium`, focus `target-blocker-resolution`, gate `global-blockers-cleared`

Interpretation :

La prochaine action la plus rentable reste `1663210`, car c'est le seul delta DPS concret (`48960`) deja mesure mais bloque par preuves. La seconde action reste `1461593`, car elle bloque le plan `necromancer` et les conflits d'equipement. Les buckets fins viennent ensuite pour preparer le vrai moteur Diablo IV sans promouvoir de valeurs non prouvees.

Interface :

Le panneau `Plan optimiseur cible` affiche maintenant la file d'actions avec rang, priorite, focus, classes concernees et action attendue.

Decision :

Poursuivre en priorite sur `asset:1663210` si l'objectif est de debloquer du DPS concret; poursuivre sur `asset:1461593` si l'objectif est de rendre les contraintes d'equipement plus completes. Dans les deux cas, garder le ranking fiable en `strict-only`.

## Plan de deblocage du delta 1663210

L'action prioritaire `Debloquer le delta conditionnel spiritborn` a ete detaillee en sous-plan de preuves. Ce plan ne change pas le DPS fiable; il decrit les conditions minimales avant promotion.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-delta-unblock-plan.js`
- `outputs/diablo4-delta-unblock-plan/delta-unblock-plan.json`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Resultats :

- asset : `1663210`
- classe : `spiritborn`
- DPS strict : `163200`
- DPS candidat : `212160`
- delta candidat : `48960`
- scenario : `sf33-active-sf32-30pct`
- sous-preuves : `3`
- sous-preuves pretes : `0`
- sous-preuves bloquees : `3`
- promotion : `false`
- prochaine sous-action : `Prouver le champ SF_32`

Sous-preuves :

- `SF_32` : bloque par `sf32-field-promotion-blocked-by-selector-949-evidence`
- `SF_33` : bloque par `sf33-binary-parent-source-not-proven-local-context-only`
- uptime : bloque par `uptime-probability-neighbors-not-linked-to-boost-branch`

Interface :

La carte action `#1` du panneau `Plan optimiseur cible` affiche maintenant le sous-plan : `3` bloquees, `0` pretes, prochaine sous-action `Prouver le champ SF_32`.

Decision :

Le prochain travail concret sur `1663210` doit viser la preuve `SF_32` : trouver une preuve compacte externe de `selector 949` ou une table source nommee. Sans cette preuve, le delta `48960` reste un what-if bloque.

## Analogie compact selector SF_32

La piste la plus logique apres le plan de deblocage etait de comparer le compact `selector 949` de `1663210` avec les autres compacts du corpus, notamment `selector 997`.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/audit-sf32-compact-selector-analogy.js`
- `outputs/diablo4-sf32-compact-selector-analogy/sf32-compact-selector-analogy.json`
- `work/diablo4-data-exporter/scripts/audit-sf32-field-promotion-decision.js`
- `outputs/diablo4-sf32-field-promotion-decision/sf32-field-promotion-decision.json`
- `work/diablo4-data-exporter/scripts/build-delta-unblock-plan.js`
- `outputs/diablo4-delta-unblock-plan/delta-unblock-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Resultats :

- layout compact compare : `compact-metadata-scale-layout`
- selecteurs compacts : `949`, `997`
- assets compacts : `1663210`, `2058843`
- compact `selector 949` : `1`
- second compact `selector 949` : `0`
- metadata `12337 / scale 10` observee sur plusieurs selecteurs : oui
- assessment : `compact-layout-analogy-cross-selector-not-owner-proof`
- confiance : `high`
- promotion : `false`

Interpretation :

Le compact `997` confirme que le motif `selector -> asset -> metadata 12337 -> opcode -> scale 10` est une vraie forme de record. Mais comme cette forme existe sur plusieurs selecteurs, elle ne prouve pas que `selector 949` possede le champ `SF_32` de `1663210`.

Impact :

La decision `SF_32` porte maintenant `6` bloqueurs, avec le nouveau bloqueur `compact-layout-cross-selector-not-owner-proof`. Les `5` portes de promotion restent toutes echouees. Le sous-plan delta garde `Prouver le champ SF_32` comme prochaine sous-action.

Decision :

Ne pas promouvoir par analogie avec `selector 997`. La prochaine preuve utile doit etre soit une seconde occurrence compacte de `selector 949`, soit une table source nommee qui explique les selecteurs et le champ proprietaire.

## Audit des contextes numeriques table SF_32

Apres l'analogie compacte, il restait une ambiguite dans les rapports locaux : `local-table-source-alternatives` signalait `4` contextes numeriques exacts. Un audit dedie a ete ajoute pour verifier si ces occurrences pouvaient correspondre a une table source ou a un selecteur exploitable.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/audit-sf32-table-numeric-contexts.js`
- `outputs/diablo4-sf32-table-numeric-contexts/sf32-table-numeric-contexts.json`
- `work/diablo4-data-exporter/scripts/audit-sf32-field-promotion-decision.js`
- `outputs/diablo4-sf32-field-promotion-decision/sf32-field-promotion-decision.json`
- `work/diablo4-data-exporter/scripts/build-delta-unblock-plan.js`
- `outputs/diablo4-delta-unblock-plan/delta-unblock-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Resultats :

- rapports scannes : `3`
- hits entiers exacts : `4`
- hits exacts `949` : `4`
- hits exacts `12337` : `0`
- contextes utiles : `0`
- contextes source potentiels : `0`
- hits decimaux contenant `949` : `1021`
- chaines contenant `949` : `499`
- assessment : `sf32-table-numeric-contexts-no-source-proof`
- confiance : `high`
- promotion : `false`

Interpretation :

Les `4` hits exacts `949` ne sont pas des preuves de selecteur : ils correspondent a des metriques de rapport (`score`) ou a une taille compressee (`compressedBytes`). Aucun contexte ne porte une cle de type table source, champ, metadata ou dictionnaire.

Impact :

La decision `SF_32` porte maintenant `7` bloqueurs, avec `table-numeric-contexts-not-source-proof`. Les `5` portes de promotion restent toutes echouees. Le delta `48960` reste un what-if bloque, et le plan optimiseur conserve `strict-only-class-constrained-plan` avec `1` build strict valide et `0` build strict fiable.

Decision :

Considerer les candidats table locaux comme epuises pour la preuve `SF_32`. La prochaine piste utile doit passer par une source externe fiable, une seconde occurrence compacte de `selector 949`, ou un decodeur plus bas niveau capable d'identifier une table de champs nommee.

## Audit hash PowerTag SF_33

La piste suivante sur `SF_33` etait le voisin `PowerTag.SystemsTuningGlobals` du flag `Mod.SoilRuler_B`. L'objectif etait de verifier si le hash voisin `2084621218` etait retrouve ailleurs dans les payloads decodes, ce qui aurait pu indiquer un consommateur ou une famille de tuning externe.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/audit-sf33-power-tag-hash-corpus.js`
- `outputs/diablo4-sf33-power-tag-hash-corpus/sf33-power-tag-hash-corpus.json`
- `work/diablo4-data-exporter/scripts/audit-sf33-binary-parent-source.js`
- `outputs/diablo4-sf33-binary-parent-source/sf33-binary-parent-source.json`
- `work/diablo4-data-exporter/scripts/build-delta-unblock-plan.js`
- `outputs/diablo4-delta-unblock-plan/delta-unblock-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Resultats :

- payloads decodes scannes : `100`
- contextes `SystemsTuningGlobals` : `7`
- prefixes PowerTag valides : `2`
- hash cible : `2084621218`
- contextes PowerTag du hash cible : `1`
- contextes PowerTag externes du hash cible : `0`
- hits bruts du hash cible : `2`
- hits bruts externes du hash cible : `0`
- assessment : `sf33-power-tag-hash-local-only`
- confiance : `high`
- promotion : `false`

Interpretation :

Le hash PowerTag voisin de `Mod.SoilRuler_B` reste local aux payloads connus de `1663210`. Le voisin `SystemsTuningGlobals` confirme une structure de run autour du flag, mais ne prouve pas une activation gameplay ni un consommateur externe.

Impact :

La decision `SF_33` reste `sf33-binary-parent-source-not-proven-local-context-only`. Le trailer `5:90` continue de prouver une forme commune de flag `Mod.*`, mais `SF_33` ne peut pas etre active dans le DPS fiable.

Decision :

Ne pas assimiler `SystemsTuningGlobals` a une activation. La prochaine piste `SF_33`, si on y revient, doit passer par une recherche binaire plus large dans les fichiers du jeu ou par un decodeur capable de nommer le record parent/consommateur.

## Audit chaine probabilite uptime

Apres `SF_32` et `SF_33`, le dernier verrou du delta `1663210` etait l'uptime. Les formules voisines `SF_28/SF_29` ressemblent a des probabilites cumulees; l'audit ajoute verifie si elles peuvent etre rattachees a la branche boostee `SF_32/SF_33`.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/audit-uptime-probability-chain.js`
- `outputs/diablo4-uptime-probability-chain/uptime-probability-chain.json`
- `work/diablo4-data-exporter/scripts/audit-uptime-neighbor-dependency.js`
- `outputs/diablo4-uptime-neighbor-dependency/uptime-neighbor-dependency.json`
- `work/diablo4-data-exporter/scripts/build-delta-unblock-plan.js`
- `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json`
- `outputs/diablo4-delta-unblock-plan/delta-unblock-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Resultats :

- chaines de probabilite : `2`
- chaines liees a la branche boostee : `0`
- chaines avec indice duree/uptime : `0`
- chaines avec source cadence locale : `1`
- source cadence locale : `Attacks_Per_Second_Total -> SF_28`
- assessment : `uptime-probability-chain-proc-local-not-boost-uptime`
- confiance : `high`
- promotion : `false`

Interpretation :

Les formules `(1-POW(1-SF_28/100,1/2))*100` et `(1-POW(1-SF_29/100,1/(SF_9*2)))*100` sont bien des probabilites locales ou des calculs de proc. Elles ne referencent ni `SF_32` ni `SF_33`, et ne portent aucune valeur de duree ou uptime explicite.

Impact :

Le diagnostic cible integre maintenant cette preuve dans `uptimeNeighborDependencyAssessment`. Les blocages restent `3/3`, avec `0` resolu et `promotionReady false`. Le delta `48960` reste un what-if bloque.

Decision :

Ne pas utiliser `SF_28/SF_29` comme uptime fiable du boost. Si un scenario de proc est expose plus tard, il devra rester une hypothese utilisateur separee du DPS strict.

## Moteur buckets cible v1

Une fois les trois sous-preuves du delta `1663210` confirmees bloquees, la suite logique etait de solidifier le moteur de calcul strict. Un artefact dedie `target-bucket-engine` a ete ajoute pour separer le calcul fiable, les buckets fins manquants, les contraintes et le what-if bloque.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-target-bucket-engine.js`
- `outputs/diablo4-target-bucket-engine/target-bucket-engine.json`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Resultats :

- statut : `strict-engine-ready-fine-buckets-blocked`
- strict base : `1276410`
- strict calcule : `1276410`
- parite : `0`
- reliable DPS : `1276410`
- what-if DPS : `1325370`
- delta bloque : `48960`
- lignes : `2`
- assessment : `bucket-engine-strict-only-ready-fine-buckets-blocked`
- confiance : `high`
- promotion : `false`

Portes moteur :

- `strict-base-ready` : passee
- `fine-buckets-mapped` : echouee
- `blocked-candidates-cleared` : echouee
- `build-constraints-valid` : echouee
- `global-blockers-cleared` : echouee

Interpretation :

Le moteur de buckets sait maintenant reproduire exactement le DPS strict agrege du build de reference, sans utiliser le delta conditionnel. Les familles additif, multiplicatif, uptime et caps restent structurees mais non alimentees par des modifiers fins prouves.

Interface :

Le panneau `Plan optimiseur cible` affiche une carte `Moteur buckets` avec strict calcule, parite, delta bloque, what-if, decomposition des buckets et portes de promotion.

Verification :

Le serveur local a ete relance et verifie :

- `http://127.0.0.1:4173/site/` : `200`
- `http://127.0.0.1:4173/outputs/diablo4-target-bucket-engine/target-bucket-engine.json` : `200`
- `http://127.0.0.1:4173/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` : `200`

Decision :

Utiliser ce moteur comme socle strict du futur optimiseur. La prochaine progression doit alimenter des modifiers fins additifs/multiplicatifs/uptime/caps ou lever les contraintes de build; le delta `48960` reste hors `reliableDps`.

## Plan extraction buckets fins

Le moteur buckets strict est maintenant stable, mais la porte `fine-buckets-mapped` reste fermee. Un plan dedie a ete ajoute pour transformer cette porte en actions de parsing par famille.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-fine-bucket-extraction-plan.js`
- `outputs/diablo4-fine-bucket-extraction-plan/fine-bucket-extraction-plan.json`
- `work/diablo4-data-exporter/scripts/build-target-bucket-engine.js`
- `outputs/diablo4-target-bucket-engine/target-bucket-engine.json`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Resultats :

- etapes : `6`
- etapes pretes : `0`
- etapes bloquees : `6`
- familles : `additive`, `multiplicative`, `uptime`, `caps`, `constraints`, `blocked-candidates`
- prochaine etape : `Extraire les bonus additifs fins`
- assessment : `fine-bucket-extraction-blocked-by-source-proofs`
- confiance : `high`
- promotion : `false`

Correction associee :

Les `classPlans` du moteur buckets utilisent maintenant les bons champs :

- `necromancer` : strict `1113210`, delta bloque `0`
- `spiritborn` : strict `163200`, delta bloque `48960`

Impact optimiseur :

L'action `#3` du plan optimiseur, `Alimenter les buckets fins`, pointe maintenant vers ce sous-plan : `6` etapes bloquees, `0` prete, prochaine action `Extraire les bonus additifs fins`.

Verification :

Le serveur local a ete relance et verifie :

- `http://127.0.0.1:4173/site/` : `200`
- `http://127.0.0.1:4173/outputs/diablo4-fine-bucket-extraction-plan/fine-bucket-extraction-plan.json` : `200`
- `http://127.0.0.1:4173/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` : `200`

Decision :

La prochaine extraction utile doit viser une source de bonus additif prouvee. Tant que la table ou le champ source n'est pas nomme, aucun pourcentage ne doit alimenter `reliableDps`.

## Audit source additive

L'etape suivante du plan buckets fins etait `Extraire les bonus additifs fins`. Un audit dedie a ete ajoute pour determiner si les hits `Bonus_Percent_Per_Power` existants peuvent alimenter le bucket additif.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/audit-additive-bucket-source.js`
- `outputs/diablo4-additive-bucket-source-audit/additive-bucket-source-audit.json`
- `work/diablo4-data-exporter/scripts/build-fine-bucket-extraction-plan.js`
- `outputs/diablo4-fine-bucket-extraction-plan/fine-bucket-extraction-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Sources agregees :

- matrice `Bonus_Percent_Per_Power`
- couverture decodee `Bonus_Percent_Per_Power`
- scan externe large
- audit non ancre
- decision `SF_32`

Resultats :

- assets explicites : `6`
- assets en matrice : `7`
- assets decodes : `6`
- candidats additifs : `7`
- candidats bloques : `7`
- lignes pretes : `0`
- groupes de selecteurs : `2`
- `selector 949` : `1663210`, `1953817`
- `selector 994` : `199516`, `202484`, `1489641`
- assessment : `additive-bucket-source-candidates-blocked-by-proof`
- confiance : `high`
- promotion : `false`

Interpretation :

Les hits `Bonus_Percent_Per_Power` donnent des candidats additifs plausibles, mais ils ne prouvent pas encore un bucket additif fiable. Les familles de selecteurs divergent et aucun candidat ne dispose d'une table/champ source nomme avec ownership prouve.

Impact :

Le plan d'extraction buckets fins expose maintenant pour l'etape additive : `additiveCandidates 7`, `blockedAdditiveCandidates 7`, `readyAdditiveRows 0`, `selectorGroups 2`. L'action optimiseur `Alimenter les buckets fins` reste bloquee.

Verification :

Le serveur local a ete relance et verifie :

- `http://127.0.0.1:4173/site/` : `200`
- `http://127.0.0.1:4173/outputs/diablo4-additive-bucket-source-audit/additive-bucket-source-audit.json` : `200`
- `http://127.0.0.1:4173/outputs/diablo4-fine-bucket-extraction-plan/fine-bucket-extraction-plan.json` : `200`

Decision :

Ne pas injecter `Bonus_Percent_Per_Power` dans le bucket additif fiable. La prochaine preuve utile doit etre une table source nommee pour les selecteurs ou un decodeur qui distingue explicitement additif et multiplicatif.

## Preuve source des selecteurs Bonus_Percent_Per_Power

Un audit dedie a ete ajoute pour determiner si les selecteurs observes autour des cibles `Bonus_Percent_Per_Power` peuvent etre classes en familles de buckets.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/audit-bonus-selector-source-proof.js`
- `outputs/diablo4-bonus-selector-source-proof/bonus-selector-source-proof.json`
- `work/diablo4-data-exporter/scripts/audit-additive-bucket-source.js`
- `outputs/diablo4-additive-bucket-source-audit/additive-bucket-source-audit.json`
- `work/diablo4-data-exporter/scripts/build-fine-bucket-extraction-plan.js`
- `outputs/diablo4-fine-bucket-extraction-plan/fine-bucket-extraction-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Resultats :

- selecteurs observes : `2`
- `selector 994` : assets `199516`, `202484`, `1489641`
- `selector 949` : assets `1663210`, `1953817`
- source nommee : `false`
- familles classifiees : `0`
- familles bloquees : `2`
- assessment : `bonus-selector-source-proof-not-found`
- confiance : `high`
- promotion : `false`

Signaux consolides :

- table nommee independante : `0`
- candidats table locaux utiles : `0`
- dictionnaires proches des valeurs surveillees : `0`
- contextes source potentiels : `0`
- contextes exacts `949` dans les tables : `4`, tous classes comme bruit de score ou taille compressee

Impact :

L'audit additif expose maintenant `selectorSourceNamed false`, `selectorFamiliesClassified 0` et `sourceProofReady false`. Le plan buckets fins reporte `selectorSourceProofAssessment bonus-selector-source-proof-not-found` sur l'etape additive.

Decision :

Les selecteurs `949/994` restent des candidats non classifies. Le `selector 994` est repete mais non nomme ; le `selector 949` reste compact/local ou divergent. Aucun des deux ne peut alimenter un bucket additif fiable ni `reliableDps` sans table source nommee ou decodeur de champ proprietaire.

## Affichage UI de la preuve selecteurs

Le site local affiche maintenant la preuve `Bonus_Percent_Per_Power` directement dans le panneau `Plan optimiseur cible`.

Fichiers modifies :

- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Ajouts interface :

- chargement de `outputs/diablo4-bonus-selector-source-proof/bonus-selector-source-proof.json`
- carte `Preuve selecteurs Bonus %`
- metriques : selecteurs observes, source nommee, familles classees, familles bloquees
- details par famille : `selector 994` et `selector 949`
- signaux source : tables nommees, contextes generes, dictionnaires proches, contextes table utiles, source potentielle

Verification :

- `site/app.js` passe la verification syntaxique
- JSON source OK
- serveur local relance
- `http://127.0.0.1:4173/site/` : `200`
- `http://127.0.0.1:4173/site/app.js` : `200`
- `http://127.0.0.1:4173/site/styles.css` : `200`
- `http://127.0.0.1:4173/outputs/diablo4-bonus-selector-source-proof/bonus-selector-source-proof.json` : `200`

## Expansion binaire slots aspect 1461593

L'action #2 du plan optimiseur (`Prouver les slots d'aspect necromancer`) a ete reprise en priorite. L'objectif etait de decoder davantage de candidats de layout pour verifier si une famille de payloads expose un champ direct de slot d'aspect.

Payloads decodes :

- `1906285` (`Ring_`)
- `2118484` (`2H`)
- `1973189` (`2H`)
- `208263` (`Boots_`)
- `1973192` (`2H`)
- `2416487` (`2H`)
- `2553189` (`Gloves_`)
- `2587268` (`Gloves_`)
- `2587930` (`Gloves_`)
- `421661` (`2H`)
- `1822368` (`Weapon_`)
- `2506746` (`Amulet_`)

Rapports regeneres :

- `outputs/diablo4-aspect-slot-binary-parser-seed/aspect-slot-binary-parser-seed.json`
- `outputs/diablo4-aspect-slot-binary-layout/aspect-slot-binary-layout.json`
- `outputs/diablo4-aspect-slot-blocker-conclusion/aspect-slot-blocker-conclusion.json`
- `outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Resultats :

- candidats slots : `33`
- candidats decodes : `23`
- candidats encore manquants : `10`
- chaines pertinentes inspectees : `51`
- references `Affix_Value` : `40`
- references de noms de slots : `9`
- champs directs `allowedSlots/equipmentSlot` : `0`
- probes pretes : `0`
- signaux utilisables : `0`
- assessment layout : `binary-layout-affix-value-records-only`
- readiness `1461593` : `slot-data-not-normalized`
- promotion : `false`

Impact optimiseur :

Le plan `necromancer` reste bloque sur `slot-constraints-proven`. L'action #2 reste necessaire, mais les candidats locaux actuellement decodes ne suffisent pas : ils exposent des valeurs d'affixes et des noms, pas une table ou un champ source de slots autorises.

Decision :

Ne pas promouvoir `Helm_`, `Ring_`, `Boots_`, `Gloves_`, `Weapon_`, `Amulet_` ni les records `Affix_Value` en `allowedSlots`. La prochaine piste doit viser une table aspect-equipement distincte ou un parseur de champ source plus bas niveau.

## Recherche champ aspect-equipement bas niveau

Une recherche ciblee a ete lancee sur des noms de champs plus proches d'une source systeme de slots/aspects, au lieu des prefixes de noms d'objets.

Termes cherches :

- `AllowedItemType`, `AllowedItemTypes`
- `ItemSlot`, `ItemSlotType`
- `ItemEquipLocation`, `EquipLocation`
- `InventorySlot`
- `AspectSlot`, `PowerSlot`
- `PowerType`
- `CodexOfPower`
- `ExtractedPower`
- `LegendaryPower`
- `AspectCategory`

Resultats recherche :

- fichiers scannes : `205`
- entrees decodees : `24304`
- termes : `27`
- entrees trouvees : `1`
- seul groupe : `CodexOfPower`
- asset : `1197664`
- source : `data.070@3591523`

Le payload `1197664` a ete decode et inspecte.

Rapports generes ou modifies :

- `outputs/diablo4-aspect-equipment-field-search/external-target-search.json`
- `outputs/diablo4-aspect-equipment-field-search/external-target-search-summary.json`
- `outputs/diablo4-source-asset-1197664-payload/`
- `outputs/diablo4-source-asset-1197664-strings/decoded-string-structure.json`
- `work/diablo4-data-exporter/scripts/audit-aspect-equipment-field-search.js`
- `outputs/diablo4-aspect-equipment-field-search-audit/aspect-equipment-field-search-audit.json`
- `work/diablo4-data-exporter/scripts/audit-aspect-slot-blocker-conclusion.js`
- `outputs/diablo4-aspect-slot-blocker-conclusion/aspect-slot-blocker-conclusion.json`
- `outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Audit `CodexOfPower` :

- chaines inspectees dans le payload : `161`
- chaines codex pertinentes : `6`
- score UI/localisation : `126`
- champs directs slot : `0`
- assessment : `aspect-equipment-field-search-codex-ui-only`
- confiance : `high`
- source proof ready : `false`
- promotion : `false`

Interpretation :

Le hit `CodexOfPower` correspond a une surface UI/localisation : onglets du Codex (`Tab_Defensive`, `Tab_Offensive`, `Tab_Weapon`), libelles localises allemands (`Gegenstandstypen`, `Aspekt`, `Waffe`), filtres de classes et textes de progression. Il ne prouve pas une table source `allowedSlots`.

Impact :

La conclusion de blocage slots contient maintenant `8` probes. Toutes restent bloquees : `0` probe prete, `0` signal utilisable, `promotionReady false`. Le plan optimiseur reste bloque sur `slot-constraints-proven` pour `necromancer`.

Decision :

Ne pas utiliser `CodexOfPower`, `CanBeImbued`, les onglets Codex ou les categories UI comme source `allowedSlots`. La suite doit chercher une table non-localisation ou un champ binaire aspect/equipement distinct.

## Couverture complete des candidats locaux de slots

Les `10` derniers candidats du plan binaire slots ont ete decodes afin de fermer la piste locale basee sur les noms de slots/affixes.

Payloads ajoutes :

- `1004852`
- `1182549`
- `1316177`
- `1459593`
- `1825639`
- `2272475`
- `2501717`
- `2565857`
- `554174`
- `86386`

Rapports regeneres :

- `outputs/diablo4-aspect-slot-binary-parser-seed/aspect-slot-binary-parser-seed.json`
- `outputs/diablo4-aspect-slot-binary-layout/aspect-slot-binary-layout.json`
- `outputs/diablo4-aspect-slot-blocker-conclusion/aspect-slot-blocker-conclusion.json`
- `outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`

Resultats finaux de cette piste :

- candidats locaux : `33`
- candidats decodes : `33`
- candidats manquants : `0`
- champs directs slot : `0`
- chaines pertinentes : `86`
- references `Affix_Value` : `65`
- references de noms de slots : `19`
- groupes de preludes : `44`
- verdict seed : `binary-parser-seed-local-candidates-exhausted-no-direct-slot`
- verdict layout : `binary-layout-affix-value-records-only`
- promotion : `false`

Impact :

La piste locale des candidats `Helm_`, `Ring_`, `Boots_`, `Gloves_`, `Weapon_`, `Amulet_`, `2H` et records `Affix_Value` est maintenant epuisee pour `allowedSlots`. Le plan `necromancer` reste bloque sur `slot-constraints-proven`.

Decision :

Arreter la piste locale basee sur les noms de slots/affixes. La prochaine preuve devra venir d'une table aspect-equipement distincte, d'un champ binaire non encore identifie, ou d'une source externe fiable.

## Sous-plan source slots aspect

Un sous-plan dedie a l'action #2 du plan optimiseur a ete ajoute pour transformer le blocage `slot-constraints-proven` en prochaines pistes explicites.

Fichiers ajoutes/regeneres :

- `work/diablo4-data-exporter/scripts/build-aspect-slot-next-source-plan.js`
- `outputs/diablo4-aspect-slot-next-source-plan/aspect-slot-next-source-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Resume du sous-plan :

- asset cible : `1461593`
- entite : `aspect:1461593`
- etapes : `4`
- etapes bloquees : `4`
- etapes pretes : `0`
- prochaine etape : `slot-next-step-01-source-table`
- titre : `Chercher une table aspect-equipement non localisation`
- candidats locaux decodes : `33`
- candidats locaux manquants : `0`
- champs directs slot : `0`
- signaux utilisables : `0`
- preuves existantes epuisees : `true`
- promotion : `false`

Les quatre pistes sont maintenant separees :

- table source aspect-equipement non localisation
- champ binaire direct de slot
- reference externe fiable
- normalisation finale de `allowedSlots` dans le dataset cible

Impact :

L'action #2 `Prouver les slots d'aspect necromancer` du plan optimiseur contient maintenant un `subPlan` avec `blockedSteps 4`, `readySteps 0` et l'assessment `aspect-slot-next-source-plan-blocked-local-exhausted`. Le site peut donc afficher une prochaine action lisible au lieu d'un blocage generique.

Decision :

Ne pas remplir `allowedSlots` pour `1461593` tant qu'aucun champ direct, table source non UI, ou source externe fiable ne prouve les slots autorises. Les prefixes, `Affix_Value`, `ItemType`, `CodexOfPower`, `CanBeImbued` et les libelles UI restent non promouvables.

## Scan source aspect-equipement explicite

La piste suivante du sous-plan slots etait de chercher une table ou un champ source non-localisation. Un scan cible a ete lance avec des noms explicites autour des slots, masques, imprint/extract et records de powers.

Fichiers generes ou modifies :

- `outputs/diablo4-aspect-equipment-source-candidate-search/external-target-search.json`
- `outputs/diablo4-aspect-equipment-source-candidate-search/external-target-search-summary.json`
- `work/diablo4-data-exporter/scripts/audit-aspect-equipment-source-candidates.js`
- `outputs/diablo4-aspect-equipment-source-candidate-audit/aspect-equipment-source-candidate-audit.json`
- `work/diablo4-data-exporter/scripts/audit-aspect-slot-blocker-conclusion.js`
- `outputs/diablo4-aspect-slot-blocker-conclusion/aspect-slot-blocker-conclusion.json`
- `work/diablo4-data-exporter/scripts/audit-aspect-slot-readiness.js`
- `outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json`
- `work/diablo4-data-exporter/scripts/build-aspect-slot-next-source-plan.js`
- `outputs/diablo4-aspect-slot-next-source-plan/aspect-slot-next-source-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Termes cherches :

- `AllowedItemType`, `AllowedItemTypes`, `AllowedEquipmentSlot`, `AllowedEquipmentSlots`
- `SlotMask`, `EquipmentSlotMask`, `ItemTypeMask`, `PowerTypeMask`
- `AspectPowerData`, `AspectPowerRecord`, `LegendaryPowerData`, `LegendaryPowerRecord`
- `CodexPowerData`, `CodexPowerRecord`, `PowerDefinition`, `PowerRecord`
- `CanImprint`, `CanBeImprinted`, `CanExtract`, `CanBeExtracted`
- `ImprintPower`, `ExtractPower`, `ImprintedPower`, `ExtractedPower`
- `PowerItemType`, `PowerItemTypes`, `AspectItemType`, `AspectItemTypes`

Resultats :

- fichiers scannes : `205`
- entrees `deadbeef` decodees : `20419`
- termes cibles : `34`
- entrees trouvees : `0`
- groupes trouves : `0`
- candidats source : `0`
- candidats slot direct : `0`
- assessment : `aspect-equipment-source-candidates-not-found`
- confiance : `high`
- promotion : `false`

Impact :

La conclusion de blocage slots contient maintenant `9` probes. Toutes restent bloquees : `0` probe prete, `0` signal utilisable. Le sous-plan slots expose `sourceCandidateMatches 0` et change la prochaine strategie vers une famille binaire par structure ou une source externe fiable.

Decision :

Ne pas inventer de champ `Allowed/Imprint/Extract` pour `1461593`. Les noms de champs source explicites sont absents du corpus local scanne; `allowedSlots` reste vide et non promouvable.

## Audit structurel des familles de slots

Apres l'echec des recherches par noms de champs, la piste suivante etait de verifier si les payloads deja decodes contiennent un discriminateur binaire stable par famille de slot (`2H`, `Boots_`, `Ring_`, `Gloves_`, etc.). Un audit structurel a ete ajoute pour comparer les offsets fixes et les fenetres binaires autour des chaines.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/audit-aspect-slot-structural-family.js`
- `outputs/diablo4-aspect-slot-structural-family/aspect-slot-structural-family.json`
- `work/diablo4-data-exporter/scripts/audit-aspect-slot-blocker-conclusion.js`
- `outputs/diablo4-aspect-slot-blocker-conclusion/aspect-slot-blocker-conclusion.json`
- `work/diablo4-data-exporter/scripts/build-aspect-slot-next-source-plan.js`
- `outputs/diablo4-aspect-slot-next-source-plan/aspect-slot-next-source-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Methode :

- lire les `33` payloads deja decodes du seed slots
- grouper par `groupKey` (`2H`, `Boots_`, `Ring_`, etc.)
- scanner les offsets fixes `0..512`
- detecter les valeurs `u32` stables dans les groupes multi-samples
- comparer les signatures de fenetres autour des chaines d'affixes/slots
- refuser toute promotion sans semantique explicite de slot/equipement

Resultats :

- samples : `33`
- groupes : `9`
- groupes multi-samples : `7`
- offsets fixes testes : `129`
- signatures de fenetres de chaines : `67`
- candidats structurels : `0`
- candidats structurels forts : `0`
- assessment : `slot-structural-family-no-stable-discriminator`
- confiance : `high`
- promotion : `false`

Impact :

La conclusion de blocage slots contient maintenant `10` probes. Toutes restent bloquees : `0` probe prete, `0` signal utilisable. Le sous-plan slots expose `strongStructuralCandidates 0` sur l'etape binaire.

Decision :

Ne pas convertir un offset numerique ou une signature de layout en `allowedSlots`. Sur le corpus actuel, aucun discriminateur binaire stable ne relie les payloads aux slots autorises. La suite doit chercher une autre famille de records binaires ou une source externe fiable.

## Audit structurel des selecteurs Bonus_Percent_Per_Power

Apres l'epuisement de la piste locale des slots, la voie la plus prometteuse etait le verrou des buckets fins/additifs. Un audit structurel dedie aux selecteurs `Bonus_Percent_Per_Power` a ete ajoute pour verifier si les payloads deja decodes distinguent les familles `949` et `994`.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/audit-bonus-selector-structural-family.js`
- `outputs/diablo4-bonus-selector-structural-family/bonus-selector-structural-family.json`
- `work/diablo4-data-exporter/scripts/audit-bonus-selector-source-proof.js`
- `outputs/diablo4-bonus-selector-source-proof/bonus-selector-source-proof.json`
- `work/diablo4-data-exporter/scripts/audit-additive-bucket-source.js`
- `outputs/diablo4-additive-bucket-source-audit/additive-bucket-source-audit.json`
- `work/diablo4-data-exporter/scripts/build-fine-bucket-extraction-plan.js`
- `outputs/diablo4-fine-bucket-extraction-plan/fine-bucket-extraction-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Methode :

- lire la matrice `Bonus_Percent_Per_Power`
- charger les payloads decodes des assets `199516`, `202484`, `1489641`, `1663210` et `1953817`
- grouper les anchors par selecteur `949` et `994`
- scanner les offsets fixes `0..512`
- comparer les signatures binaires autour des chaines cibles
- refuser toute promotion sans table/champ source nomme et sans semantique additive/multiplicative prouvee

Resultats :

- samples : `5`
- selecteurs : `2`
- familles decodees : `2`
- assets decodes manquants : `0`
- offsets fixes testes : `129`
- candidats structurels : `18`
- candidats structurels forts : `18`
- signatures de fenetres autour des anchors : `5`
- signatures reutilisables par selecteur : `0`
- assessment : `bonus-selector-structural-family-candidates-need-source-proof`
- confiance : `medium`
- promotion : `false`

Lecture :

Les offsets fixes distinguent bien `949` et `994` dans le petit corpus. Exemple : `offset 120` vaut `3176` pour `949` et `3256` pour `994`; plusieurs offsets binaires suivent le meme motif. En revanche, ces offsets prouvent seulement une difference de layout ou de structure. Ils ne nomment pas une famille de bucket et ne prouvent pas si le bonus doit etre additif ou multiplicatif.

Impact :

La preuve source des selecteurs expose maintenant :

- `structuralFamilyAssessment bonus-selector-structural-family-candidates-need-source-proof`
- `strongStructuralCandidates 18`
- `selectorSpecificWindowSignatures 0`
- `sourceNamed false`
- `selectorFamiliesClassified 0`
- `promotionReady false`

L'audit source additive reste bloque :

- `7` candidats
- `7` candidats bloques
- `0` ligne prete
- `selectorStructuralAssessment bonus-selector-structural-family-candidates-need-source-proof`
- `sourceProofReady false`
- `fieldOwnershipProven false`

Decision :

Utiliser les offsets `949/994` comme indices pour chercher une table ou un champ source nomme. Ne pas classer `949` ou `994` en additif/multiplicatif, ne pas alimenter `reliableDps`, et garder le delta `48960` de `1663210` en candidat bloque tant que la source, le trigger et l'uptime ne sont pas prouves.

## Scan corpus des empreintes structurelles de selecteurs

Les offsets structurels `949/994` ont ensuite ete utilises comme empreintes de corpus pour verifier s'ils reapparaissent dans d'autres payloads decodes. Le but etait de distinguer deux cas : un simple layout commun, ou un vrai peer ancre par selecteur et potentiellement utile pour prouver une famille de bucket.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/scan-bonus-selector-structural-corpus.js`
- `outputs/diablo4-bonus-selector-structural-corpus/bonus-selector-structural-corpus.json`
- `work/diablo4-data-exporter/scripts/audit-bonus-selector-source-proof.js`
- `outputs/diablo4-bonus-selector-source-proof/bonus-selector-source-proof.json`
- `work/diablo4-data-exporter/scripts/audit-additive-bucket-source.js`
- `outputs/diablo4-additive-bucket-source-audit/additive-bucket-source-audit.json`
- `work/diablo4-data-exporter/scripts/build-fine-bucket-extraction-plan.js`
- `outputs/diablo4-fine-bucket-extraction-plan/fine-bucket-extraction-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Methode :

- prendre les `18` offsets forts du rapport structurel
- construire deux signatures fixes : `949` et `994`
- scanner tous les fichiers `*.decoded.bin` sous `outputs`
- mesurer les matches partiels et exacts
- separer les peers exacts connus des peers exacts nouveaux
- verifier si les nouveaux peers ont une ancre selecteur `949/994`
- chercher des chaines nommant explicitement une famille source/bucket

Resultats :

- payloads scannes : `123`
- signatures : `2`
- mots par signature : `18`
- matches : `38`
- matches exacts : `10`
- matches exacts connus : `5`
- nouveaux assets de layout exact : `216638`, `421661`, `493422`, `1092943`, `2123320`
- matches exacts avec ancres selecteur : `5`
- nouveaux assets exacts avec ancres selecteur : `0`
- matches avec source nommee : `0`
- assessment : `bonus-selector-structural-corpus-has-layout-only-peers`
- promotion : `false`

Lecture :

Le scan a bien retrouve des peers de layout, ce qui confirme que les offsets fixes capturent une structure binaire reelle. Mais les `5` nouveaux assets exacts ne portent pas d'ancre `949/994`. Ils contiennent surtout des chaines de formules, `SF_*`, `Affix_Value_*` ou des references item/power, sans champ nommant `additive`, `multiplicative` ou une famille de bucket.

Impact :

La preuve source des selecteurs expose maintenant :

- `structuralCorpusAssessment bonus-selector-structural-corpus-has-layout-only-peers`
- `structuralCorpusMatches 38`
- `structuralCorpusExactMatches 10`
- `structuralCorpusNewExactAssets [216638,421661,493422,1092943,2123320]`
- `structuralCorpusExactMatchesWithSelectorAnchors 5`
- `structuralCorpusNewExactAssetsWithSelectorAnchors []`
- `structuralCorpusSourceNamedMatches 0`
- `promotionReady false`

Decision :

Ne pas utiliser les nouveaux peers comme preuve `949/994`. Ils valident un layout commun, pas une semantique de bucket. La prochaine piste doit chercher une table source hors empreinte fixe ou decoder un champ proprietaire qui relie explicitement le selecteur a une famille additive/multiplicative.

## Scan des termes source de buckets

Apres le scan structurel, une recherche texte ciblee a ete ajoutee pour verifier si le corpus decode contient des termes explicites comme `additive`, `multiplicative`, `bucket`, `damage bucket`, ou des termes source proches des selecteurs `949/994`, de `12337`, de `10.0`, ou des chaines `Bonus_Percent_Per_Power`.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/scan-bucket-source-term-corpus.js`
- `outputs/diablo4-bucket-source-term-corpus/bucket-source-term-corpus.json`
- `work/diablo4-data-exporter/scripts/audit-bonus-selector-source-proof.js`
- `outputs/diablo4-bonus-selector-source-proof/bonus-selector-source-proof.json`
- `work/diablo4-data-exporter/scripts/audit-additive-bucket-source.js`
- `outputs/diablo4-additive-bucket-source-audit/additive-bucket-source-audit.json`
- `work/diablo4-data-exporter/scripts/build-fine-bucket-extraction-plan.js`
- `outputs/diablo4-fine-bucket-extraction-plan/fine-bucket-extraction-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Methode :

- scanner les `123` payloads decodes
- extraire les chaines ASCII
- chercher les groupes de termes `bucket-family`, `damage-modifier-source` et `formula-source`
- calculer les distances avec les valeurs surveillees `949`, `994`, `12337`, `10.0`
- detecter les chaines proches de `Bonus_Percent_Per_Power`
- ne considerer comme candidat source que les termes `additive/multiplicative/bucket` relies a une valeur surveillee ou a une chaine cible

Resultats :

- fichiers scannes : `123`
- hits source/formule : `70`
- hits bucket/additif/multiplicatif : `0`
- hits proches de valeurs surveillees : `46`
- hits lies a `Bonus_Percent_Per_Power` : `14`
- candidats source : `0`
- assessment : `bucket-source-terms-not-found`
- `sourceProofReady false`
- promotion : `false`

Lecture :

Le corpus contient des chaines de type formule (`SF_*`, `Script Formula`, `Static Value`, `Affix_Value`, `Bonus_Percent_Per_Power`) et quelques termes de modifier/source. Mais aucun terme ne nomme une famille `additive`, `multiplicative` ou `bucket`, et aucun hit texte ne suffit a classer les selecteurs.

Impact :

La preuve source des selecteurs expose maintenant :

- `bucketSourceTermsAssessment bucket-source-terms-not-found`
- `bucketSourceTermHits 70`
- `bucketSourceCandidateHits 0`
- `bucketSourceNearWatchedHits 46`
- `bucketSourceBonusPercentHits 14`
- `promotionReady false`

Decision :

La piste texte locale est bloquee. Les selecteurs `949/994` restent non classes, et les candidats `Bonus_Percent_Per_Power` ne doivent pas alimenter le bucket additif ni `reliableDps`. La suite doit viser une table binaire non textuelle ou une source externe fiable.

## Audit des tables binaires candidates

La piste suivante etait d'inspecter les artefacts de tables binaires deja extraits, non plus par chaines texte mais par valeurs surveillees. L'audit cherche si les candidats de tables contiennent `949`, `994`, `12337`, `10.0`, ou les assets `Bonus_Percent_Per_Power` dans un contexte exploitable.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/audit-bucket-binary-table-source.js`
- `outputs/diablo4-bucket-binary-table-source/bucket-binary-table-source.json`
- `work/diablo4-data-exporter/scripts/audit-bonus-selector-source-proof.js`
- `outputs/diablo4-bonus-selector-source-proof/bonus-selector-source-proof.json`
- `work/diablo4-data-exporter/scripts/audit-additive-bucket-source.js`
- `outputs/diablo4-additive-bucket-source-audit/additive-bucket-source-audit.json`
- `work/diablo4-data-exporter/scripts/build-fine-bucket-extraction-plan.js`
- `outputs/diablo4-fine-bucket-extraction-plan/fine-bucket-extraction-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Methode :

- lire `outputs/diablo4-table-candidates/table-candidates.json`
- lire `outputs/diablo4-table-candidates-strict/table-candidates.json`
- lire `outputs/diablo4-table-candidates-strict/table-candidates-strong.json`
- chercher les valeurs exactes `949`, `994`, `12337`, `1092616192` et les assets de la matrice `Bonus_Percent_Per_Power`
- classer chaque hit comme reference asset, bruit metrique/offset, table-id, contexte selecteur/metadata, ou candidat source potentiel
- refuser toute promotion si le contexte ne nomme pas une famille additive/multiplicative

Resultats :

- fichiers scannes : `3`
- hits exacts : `17`
- hits utiles : `0`
- candidats source : `0`
- valeurs trouvees : `949:4`, `994:4`, `1663210:4`, `1953817:1`, `2302974:3`, `1092616192:1`
- classifications : `8` references asset, `8` bruits metrique/offset, `1` nombre non qualifie
- assessment : `bucket-binary-table-source-not-found`
- `sourceProofReady false`
- promotion : `false`

Lecture :

Les tables candidates locales contiennent bien quelques valeurs surveillees, mais elles apparaissent comme references d'asset, scores, offsets, samples ou nombres non qualifies. Aucun contexte ne relie `949/994` a une famille de bucket, et aucun champ ne nomme `additive` ou `multiplicative`.

Impact :

La preuve source des selecteurs expose maintenant :

- `binaryTableSourceAssessment bucket-binary-table-source-not-found`
- `binaryTableSourceFilesScanned 3`
- `binaryTableExactHits 17`
- `binaryTableUsefulHits 0`
- `binaryTableSourceCandidates 0`
- `promotionReady false`

Decision :

Les tables candidates locales ne sont pas promouvables pour les buckets fins. Les selecteurs `949/994` restent non classes, et `Bonus_Percent_Per_Power` reste hors `reliableDps` tant qu'une autre famille de records ou une source externe fiable ne prouve pas la semantique additive/multiplicative.

## Conclusion des preuves locales pour le bucket additif

Une conclusion consolidee a ete ajoutee pour eviter de continuer a relancer les memes pistes locales autour de `949/994`. Elle agrege les preuves selecteurs, structure, corpus, termes texte, tables binaires et lignes candidates additives.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-additive-bucket-source-conclusion.js`
- `outputs/diablo4-additive-bucket-source-conclusion/additive-bucket-source-conclusion.json`
- `work/diablo4-data-exporter/scripts/audit-additive-bucket-source.js`
- `outputs/diablo4-additive-bucket-source-audit/additive-bucket-source-audit.json`
- `work/diablo4-data-exporter/scripts/build-fine-bucket-extraction-plan.js`
- `outputs/diablo4-fine-bucket-extraction-plan/fine-bucket-extraction-plan.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`

Probes consolidees :

- `selector-source-proof`
- `structural-family`
- `structural-corpus`
- `bucket-source-terms`
- `binary-table-source`
- `additive-candidate-rows`

Resultats :

- probes : `6`
- probes pretes : `0`
- probes bloquees : `6`
- `localEvidenceExhausted true`
- `sourceNamed false`
- `additiveBucketReady false`
- assessment : `additive-bucket-local-source-evidence-exhausted`
- confiance : `high`
- promotion : `false`

Impact :

L'audit source additive expose maintenant :

- `sourceConclusionAssessment additive-bucket-local-source-evidence-exhausted`
- `localSourceEvidenceExhausted true`
- `sourceConclusionBlockedProbes 6`
- `nextStep Basculer vers une source externe fiable ou une nouvelle famille de records binaires avant toute promotion.`

Le plan buckets fins expose maintenant comme prochaine action :

`Basculer vers une source externe fiable ou une nouvelle famille de records binaires; garder les candidats hors reliableDps.`

Decision :

Les variantes locales autour de `949/994`, des chaines `Bonus_Percent_Per_Power`, des empreintes structurelles et des tables candidates sont fermees pour la promotion. La prochaine preuve doit venir d'une source externe fiable ou d'une nouvelle famille de records binaires qui classe explicitement les modifiers en additif/multiplicatif. Aucun changement de `reliableDps`.

## Exposition de la conclusion additive dans le plan et le site

La conclusion `additive-bucket-local-source-evidence-exhausted` est maintenant rattachee directement au plan optimiseur cible et visible dans l'interface locale.

Fichiers modifies :

- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Resultats :

- le plan optimiseur lit `outputs/diablo4-additive-bucket-source-conclusion/additive-bucket-source-conclusion.json`
- le rapport expose `additiveBucketSourceConclusion.summary`
- l'action `fine-buckets-ready` porte maintenant un `sourceConclusion` avec :
  - assessment `additive-bucket-local-source-evidence-exhausted`
  - confiance `high`
  - `localEvidenceExhausted true`
  - prochaine action : `Basculer vers une source externe fiable ou une nouvelle famille de records binaires; garder les candidats hors reliableDps.`
- le site affiche un panneau `Conclusion source additive` avec `6` pistes, `0` prete, `6` bloquees, source nommee absente et bucket additif toujours bloque

Decision :

Cette etape ne debloque pas le calcul fiable. Elle rend visible, dans le plan de travail principal, que la piste locale additive est terminee et que la prochaine avancee utile doit venir d'une source externe fiable ou d'une nouvelle famille de records binaires.

## Conclusion consolidee de promotion du delta 1663210

Une conclusion dediee au delta `48960` a ete ajoutee. Elle consolide les trois preuves obligatoires du scenario `sf33-active-sf32-30pct` : champ `SF_32`, trigger `SF_33`, et uptime.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-delta-promotion-conclusion.js`
- `outputs/diablo4-delta-promotion-conclusion/delta-promotion-conclusion.json`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Resultats :

- asset : `1663210`
- strict : `163200`
- candidat : `212160`
- delta : `48960`
- preuves : `3`
- preuves pretes : `0`
- preuves bloquees : `3`
- preuves bloquees : `sf32-field`, `sf33-trigger`, `uptime`
- assessment : `delta-promotion-local-evidence-exhausted`
- confiance : `high`
- `localEvidenceExhausted true`
- `canUseForReliableDps false`
- `canExposeAsWhatIf true`

Impact :

Le plan optimiseur cible expose maintenant `deltaPromotionConclusion.summary`, et l'action #1 `Debloquer le delta conditionnel spiritborn` porte un `promotionConclusion` avec :

- assessment `delta-promotion-local-evidence-exhausted`
- confiance `high`
- `localEvidenceExhausted true`
- `canUseForReliableDps false`
- `canExposeAsWhatIf true`
- prochaine action : chercher une source externe fiable, un nouveau record parent binaire, ou exposer une hypothese utilisateur separee

Le site affiche maintenant un panneau `Conclusion delta 48960` avec les trois preuves bloquees.

Decision :

Le delta `48960` reste un scenario what-if bloque. Il n'est pas ajoute a `reliableDps`, car `SF_32`, `SF_33` et l'uptime sont tous encore non promouvables.

## Exposition de la conclusion slots 1461593

La conclusion du sous-plan slots pour l'aspect `1461593` est maintenant visible dans le plan optimiseur cible et dans l'interface locale.

Fichiers modifies :

- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Resultats :

- source : `outputs/diablo4-aspect-slot-next-source-plan/aspect-slot-next-source-plan.json`
- target : `aspect:1461593`
- classe : `necromancer`
- etapes : `4`
- etapes pretes : `0`
- etapes bloquees : `4`
- `existingEvidenceExhausted true`
- `slotConstraintReady false`
- `usableProofSignals 0`
- `directSlotFieldStrings 0`
- `sourceCandidateMatches 0`
- `strongStructuralCandidates 0`
- assessment : `aspect-slot-next-source-plan-blocked-local-exhausted`
- confiance : `high`

Impact :

L'action #2 `Prouver les slots d'aspect necromancer` porte maintenant un `slotConclusion` avec :

- `localEvidenceExhausted true`
- `slotConstraintReady false`
- `usableProofSignals 0`
- `sourceCandidateMatches 0`
- `strongStructuralCandidates 0`
- prochaine action : chercher une famille binaire par structure ou obtenir une source externe fiable avant de remplir `allowedSlots`

Le site affiche maintenant un panneau `Conclusion slots 1461593` avec les quatre etapes bloquees.

Decision :

`allowedSlots` reste vide pour `1461593`. Les signaux `helm`, prefixes, Codex UI, ItemType et Affix_Value restent non promouvables.

## Raccord de l'action globale des blocages

L'action #4 `Fermer les blocages globaux` du plan optimiseur cible est maintenant reliee au diagnostic `target-blocker-resolution`.

Fichiers modifies :

- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `PROJECT_STATUS.md`

Resultats :

- source : `outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json`
- action : `global-blockers-cleared`
- asset concerne : `1663210`
- blocages globaux : `3`
- resolus : `0`
- assessment : `target-blockers-active`
- blockers :
  - `field-level-parser-required`
  - `sf33-trigger-build-state-unmapped`
  - `uptime-not-proven`

Impact :

La file d'actions affiche maintenant un sous-plan pour l'action globale, et le rendu de sous-plan peut afficher les kinds de blocages. La prochaine action globale prefere la conclusion recente `delta-promotion-local-evidence-exhausted` plutot que l'ancien libelle local `parser champ par champ`.

Decision :

L'action globale reste bloquee, mais elle pointe maintenant vers la bonne strategie : chercher une source externe fiable, un nouveau record parent binaire, ou exposer une hypothese utilisateur separee sans modifier `reliableDps`.

## Roadmap des prochaines preuves

Une roadmap transversale a ete ajoutee pour consolider les prochaines preuves acceptables apres epuisement des pistes locales principales.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-next-evidence-roadmap.js`
- `outputs/diablo4-next-evidence-roadmap/next-evidence-roadmap.json`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Resultats :

- domaines : `3`
- domaines bloques : `3`
- domaines localement epuises : `3`
- domaines consolides :
  - `delta-1663210`
  - `slots-1461593`
  - `additive-buckets`
- actions : `3`
- actions priorite haute : `2`
- assessment : `next-evidence-roadmap-required`
- confiance : `high`
- promotion : `false`

Actions :

- obtenir une source externe fiable
- chercher une nouvelle famille de records binaires
- ajouter une hypothese utilisateur separee pour le scenario what-if

Preuves acceptees :

- source qui nomme explicitement les slots autorises d'un aspect
- source qui classe `Bonus_Percent_Per_Power` en bucket additif/multiplicatif
- source qui relie `Mod.SoilRuler_B` a une condition de build ou gameplay
- record parent/consommateur exact ou decodeur reliant selecteur, champ, metadata et famille de calcul

Preuves refusees :

- noms d'affixes contenant `Helm`, `Ring` ou `2H` sans champ `allowedSlots`
- Codex/UI/localisation
- pairs de layout sans semantique source
- valeurs `949/994/12337/10` sans table ou dictionnaire nomme

Decision :

La prochaine phase doit viser une preuve externe fiable, une nouvelle famille binaire, ou une hypothese utilisateur explicitement separee. `reliableDps` reste strict.

## Scenario utilisateur what-if pour 1663210

L'option la plus prometteuse a court terme a ete implementee : exposer le delta `48960` comme une hypothese utilisateur configurable, sans le promouvoir en DPS fiable.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-user-whatif-scenarios.js`
- `outputs/diablo4-user-whatif-scenarios/user-whatif-scenarios.json`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/index.html`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Scenario :

- id : `user-scenario-1663210-sf33-uptime`
- asset : `1663210`
- strict : `163200`
- delta brut : `48960`
- DPS max configure : `212160`
- controles : `SF_33 utilisateur`, `uptime utilisateur`
- formule : `configuredWhatIfDps = strictDps + (blockedDeltaDps * uptime)` quand `SF_33 utilisateur` est actif

Impact site :

- nouveau controle dans `Build courant`
- le toggle `SF_33 utilisateur` active le mode what-if
- le slider `Uptime` module le delta configure
- le statut affiche le delta what-if utilisateur applique
- l'export/import JSON transporte `userScenario`

Garde-fous :

- `canUseForReliableDps false`
- `canUseForRanking false` pour le ranking fiable
- `reliableDps` reste strict-only
- l'hypothese ne ferme pas les preuves `SF_32`, `SF_33` ou uptime

Decision :

Le site peut maintenant simuler un scenario utilisateur propre, mais ce scenario reste separe du DPS fiable et des preuves jeu.

## Portes DPS fiable pour 1663210

Apres l'ajout du scenario utilisateur, l'etape suivante a ete de rendre la decision exploitable par l'optimiseur : chaque preuve obligatoire du delta `48960` est maintenant convertie en porte de fiabilite.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-reliable-dps-gates.js`
- `outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Resultat :

- asset : `1663210`
- strict fiable : `163200`
- delta bloque : `48960`
- DPS what-if max : `212160`
- portes : `4`
- portes passees : `1`
- portes bloquees : `3`
- portes bloquees : `sf32-field`, `sf33-trigger`, `uptime`
- porte passee : `user-what-if-separated`
- assessment : `reliable-dps-gates-blocked`
- `canUseForReliableDps false`
- `canUseForRanking false`
- `canUseForUserWhatIf true`

Impact site :

- nouveau panneau `Portes DPS fiable 1663210`
- affichage du strict, du delta bloque, des portes passees/bloquees
- rappel que le ranking fiable reste strict-only
- rappel que le what-if utilisateur reste autorise mais separe

Decision :

Le delta `48960` de `1663210` reste exclu du DPS fiable. Le site peut le simuler comme hypothese utilisateur, mais le moteur fiable doit continuer a utiliser `strictDps = 163200` tant que `SF_32`, `SF_33` et l'uptime ne sont pas prouves.

## Plans buckets par classe

Le moteur buckets a ete enrichi pour eviter de traiter le build de reference mixte `1461593 + 1663210` comme une base optimisable. Le total global reste utile comme regression, mais l'optimiseur doit raisonner par classe.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-target-bucket-engine.js`
- `outputs/diablo4-target-bucket-engine/target-bucket-engine.json`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Resultat :

- plans de classe : `2`
- plans chargeables : `1`
- plans fiables : `0`
- meilleur plan strict chargeable : `spiritborn`
- asset du plan chargeable : `1663210`
- DPS strict chargeable : `163200`
- delta bloque : `48960`
- meilleur plan fiable : aucun
- plan `necromancer` : bloque par `slot-constraints-proven` sur `1461593`
- parite globale du build de reference : `0`

Impact moteur :

- chaque plan de classe porte ses propres gates
- le gate `mixed-hero-classes` est neutralise par la separation en plans mono-classe
- les contraintes de slot restent bloquees par classe
- les deltas conditionnels restent exclus du DPS fiable
- le plan optimiseur expose `classPlans`, `bestStrictClassPlan` et `bestReliableClassPlan`

Impact site :

- le panneau `Moteur buckets` affiche les plans de classe
- le site montre combien de plans sont chargeables ou fiables
- les gates par classe indiquent pourquoi un plan peut etre charge comme base de travail sans etre fiable

Decision :

Le moteur peut proposer une base de travail stricte mono-classe (`spiritborn`, `1663210`) mais aucun build fiable complet. Le total mixte `1276410` reste une regression technique, pas une recommandation optimisable.

## Chargement UI des bases buckets par classe

Une fois les plans buckets par classe disponibles, le site a ete ajuste pour permettre de charger directement une base mono-classe chargeable.

Fichiers modifies :

- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Impact site :

- bouton `Charger base` sur les plans buckets par classe chargeables
- bouton desactive pour les plans bloques
- message de statut plus explicite : classe chargee et statut `base stricte`, `fiable` ou `bloque`
- les boutons existants du plan optimiseur utilisent le meme libelle de statut

Decision :

Le site peut maintenant charger la base stricte `spiritborn` issue du moteur buckets sans encourager le build mixte de reference. Les plans bloques restent consultables pour diagnostic, mais ne sont pas actionnables depuis ce panneau.

## Contrat de base de travail

Le plan strict chargeable est maintenant formalise dans un contrat machine. L'objectif est de rendre explicite ce que l'optimiseur peut faire avec la base `spiritborn` et ce qui reste interdit tant que les preuves ne sont pas fermees.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-working-base-contract.js`
- `outputs/diablo4-working-base-contract/working-base-contract.json`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Resultat :

- base : `spiritborn`
- asset : `1663210`
- strict : `163200`
- delta bloque : `48960`
- what-if : `212160`
- statut : `strict-loadable-with-blocked-what-if`
- chargeable : `true`
- fiable : `false`
- prochaine porte : `blocked-delta-cleared`

Actions autorisees :

- charger cette base stricte mono-classe
- activer un scenario utilisateur what-if separe
- inspecter les preuves et blocages sans modifier `reliableDps`
- ajouter des assets de meme classe seulement apres validation des contraintes

Actions interdites :

- utiliser le build mixte de reference comme recommandation optimisable
- ajouter le delta bloque au ranking fiable
- promouvoir `SF_32`, `SF_33` ou uptime sans preuve source
- valider un plan `necromancer` tant que les slots de `1461593` restent bloques

Impact site :

- nouveau panneau `Base de travail`
- affichage des actions autorisees/interdites
- affichage des gates de la base chargeable
- rappel que le ranking fiable utilise `strictDps`

Decision :

La base `spiritborn / 1663210` est le support de travail courant. Elle peut etre chargee et simulee, mais le moteur fiable doit continuer a refuser le delta bloque et les recommandations finales.

## Suite de generation optimiseur cible

Le dernier ajout a rendu l'ordre de generation important : le contrat de base doit etre produit avant le plan optimiseur cible. Une suite sequentielle a donc ete ajoutee pour regenerer les artefacts dans le bon ordre et verifier les invariants critiques.

Fichier ajoute :

- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`

Commande :

```powershell
& 'C:\Users\FlowUP\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' work\diablo4-data-exporter\scripts\build-target-optimizer-suite.js
```

Ordre execute :

- `build-target-bucket-engine.js`
- `build-fine-bucket-extraction-plan.js`
- `build-delta-promotion-conclusion.js`
- `build-user-whatif-scenarios.js`
- `build-reliable-dps-gates.js`
- `build-next-evidence-roadmap.js`
- `build-working-base-contract.js`
- `build-target-optimizer-plan.js`

Invariants verifies :

- parite stricte buckets : `0`
- meilleure classe stricte : `spiritborn`
- plans fiables : `0`
- base de travail : `spiritborn`
- strict base : `163200`
- delta bloque : `48960`
- `canUseForReliableDps false`
- contrat de base embarque dans le plan optimiseur

Resultat du test :

- statut : `target-optimizer-suite-ok`
- etapes : `8`
- prochaine porte : `blocked-delta-cleared`

Decision :

Utiliser cette suite comme commande de regeneration normale pour les artefacts cible. Elle evite les plans partiellement obsoletes et bloque immediatement toute promotion accidentelle du delta dans le DPS fiable.

## Rapport persistant de suite

La suite de generation ecrit maintenant son propre rapport afin que l'etat de regeneration soit visible dans le plan optimiseur et dans le site.

Fichiers generes ou modifies :

- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `site/styles.css`
- `PROJECT_STATUS.md`

Resultat :

- rapport : `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- statut : `target-optimizer-suite-ok`
- etapes : `8`
- parite stricte : `0`
- base : `spiritborn`
- strict : `163200`
- delta bloque : `48960`
- builds fiables : `0`
- prochaine porte : `blocked-delta-cleared`

Impact plan/site :

- `build-target-optimizer-plan.js` lit le rapport de suite
- le plan cible expose `targetOptimizerSuite`
- le site affiche un panneau `Suite generation`
- les invariants sont visibles et colores passe/echec

Decision :

Le site expose maintenant non seulement le resultat de l'optimiseur, mais aussi la sante de la regeneration. Cela rend les erreurs d'ordre ou les promotions accidentelles plus visibles.

## Lanceur racine de suite optimiseur

Un lanceur PowerShell a ete ajoute a la racine du projet pour eviter de retenir le chemin long du script Node.

Fichiers modifies ou ajoutes :

- `run-target-optimizer-suite.ps1`
- `PROJECT_INSTRUCTIONS.md`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Commande standard :

```powershell
.\run-target-optimizer-suite.ps1
```

Resolution de Node :

- variable `D4_OPTIMIZER_NODE` si definie
- `node` disponible dans le PATH
- Node embarque Codex : `.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`

Decision :

Utiliser ce lanceur pour regenerer le plan cible et ses garde-fous sans dependre d'une commande longue ou d'un ordre manuel de scripts.

## Lanceur racine du site

Un lanceur PowerShell a ete ajoute a la racine du projet pour ouvrir le site sans memoriser la commande Node longue.

Fichiers modifies ou ajoutes :

- `run-site.ps1`
- `PROJECT_INSTRUCTIONS.md`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Commande standard :

```powershell
.\run-site.ps1
```

URL :

- `http://127.0.0.1:4173/site/`

Resolution de Node :

- variable `D4_OPTIMIZER_NODE` si definie
- `node` disponible dans le PATH
- Node embarque Codex : `.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`

Decision :

Utiliser ce lanceur comme commande standard pour consulter le site local du projet.

## Contrat moteur buckets

Un contrat verifiable du moteur buckets a ete ajoute pour controler automatiquement la formule stricte et la separation entre DPS fiable, what-if et delta bloque.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-bucket-engine-contract.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-bucket-engine-contract/bucket-engine-contract.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- statut contrat : `bucket-engine-contract-ok`
- invariants : `8`
- passes : `8`
- echecs : `0`
- formule stricte : `strictBaseDps * (1 + additivePct / 100) * multiplicativeProduct * uptimeProduct`
- strict recalcule : `1276410`
- parite stricte : `0`
- delta bloque : `48960`
- what-if : `1325370`
- meilleure classe stricte : `spiritborn`

Invariants controles :

- la formule buckets reproduit le strict calcule
- la parite stricte reste a `0`
- `reliableDps` reste strict-only
- `whatIfDps` reste `reliableDps + blockedCandidateDelta`
- les lignes avec delta bloque ne deviennent pas fiables
- la base de travail suit le meilleur plan strict valide
- aucun plan classe fiable n'est promu avant ouverture des portes
- le delta `1663210` reste interdit dans `reliableDps`

Validation :

- suite optimiseur : `target-optimizer-suite-ok`, `9` etapes
- site : `http://127.0.0.1:4173/site/` repond `200`
- artefact contrat : `/outputs/diablo4-bucket-engine-contract/bucket-engine-contract.json` repond `200`
- plan optimiseur : `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` repond `200`

Decision :

Le moteur buckets est maintenant protege par un contrat strict-only avant l'ajout des buckets fins reels. Toute promotion accidentelle du delta bloque ou derive du what-if doit casser la suite.

## Intake de preuves externes

Un sas d'entree versionne a ete ajoute pour recevoir des preuves externes sans modifier automatiquement le DPS fiable.

Fichiers modifies ou ajoutes :

- `inputs/external-evidence-candidates.json`
- `work/diablo4-data-exporter/scripts/audit-external-evidence-intake.js`
- `work/diablo4-data-exporter/scripts/build-next-evidence-roadmap.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `outputs/diablo4-external-evidence-intake/external-evidence-intake.json`
- `outputs/diablo4-next-evidence-roadmap/next-evidence-roadmap.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `site/app.js`
- `PROJECT_INSTRUCTIONS.md`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Fichier d'entree :

```text
inputs/external-evidence-candidates.json
```

Champs requis pour une preuve promouvable par l'intake :

- `domain`
- `assetId`
- `source.kind`
- `source.title`
- `source.url` ou `source.version`
- `claim.type`
- `claim.field`
- `claim.value`
- `claim.excerpt` ou `claim.mapping`
- `reviewer.status = approved`

Domaines acceptes :

- `delta-1663210`
- `slots-1461593`
- `additive-buckets`

Sources acceptees par defaut :

- `official`
- `extracted-game-data`
- `tool-output`
- `documented-dataset`

Sources rejetees :

- `ui-label`
- `codex-ui`
- `localization`
- `inference-only`
- `layout-analogy`

Resultat actuel :

- statut : `external-evidence-required`
- candidats : `0`
- acceptes : `0`
- en attente : `0`
- rejetes : `0`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `10` etapes

Validation :

- site : `http://127.0.0.1:4173/site/` repond `200`
- artefact intake : `/outputs/diablo4-external-evidence-intake/external-evidence-intake.json` repond `200`
- plan optimiseur : `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` repond `200`

Decision :

La piste la plus prometteuse est maintenant preparee : ajouter une preuve externe ou documentee dans l'intake, la faire auditer, puis seulement ensuite construire un pont parseur explicite vers le domaine concerne. L'intake ne peut jamais modifier `reliableDps` seul.

## Durcissement de l'intake de preuves externes

L'intake de preuves externes valide maintenant les preuves candidates avec des regles specifiques par domaine afin d'eviter qu'une preuve trop vague ou associee au mauvais asset passe le sas.

Fichiers modifies ou ajoutes :

- `inputs/external-evidence-candidates.example.json`
- `work/diablo4-data-exporter/scripts/audit-external-evidence-intake.js`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Regles par domaine :

- `delta-1663210`
  - asset requis : `1663210`
  - claims acceptes : `sf32-field-ownership`, `sf33-trigger`, `uptime`, `source-mapping`
  - champs acceptes : `SF_32`, `SF_33`, `uptime`, `Mod.SoilRuler_B`, `selector:949`, `Bonus_Percent_Per_Power`
  - ancrage requis : `1663210`
- `slots-1461593`
  - asset requis : `1461593`
  - claims acceptes : `allowed-slots`, `equipment-slot-field`, `source-mapping`
  - champs acceptes : `allowedSlots`, `equipmentSlots`, `itemTypes`, `aspectSlots`
  - ancrage requis : `1461593`
- `additive-buckets`
  - asset libre
  - claims acceptes : `bucket-family`, `modifier-classification`, `source-mapping`
  - champs acceptes : `Bonus_Percent_Per_Power`, `additive`, `multiplicative`, `bucket`, `modifierFamily`
  - ancrage requis : `Bonus_Percent_Per_Power`

Test synthetique :

- entree conforme `delta-1663210` : acceptee pour revue
- entree UI avec mauvais asset : rejetee
- `canModifyReliableDps false`

Validation :

- suite optimiseur : `target-optimizer-suite-ok`, `10` etapes
- parite stricte : `0`
- base de travail : `spiritborn`
- strict base : `163200`
- delta bloque : `48960`

Decision :

Une preuve externe acceptee n'est toujours pas une promotion. Elle devient seulement une preuve revue, prete a etre reliee explicitement a un parseur cible.

## Plan de pont des preuves externes

Un plan de pont a ete ajoute entre l'intake des preuves externes et les parseurs cible. Il decrit quoi faire avec une preuve acceptee sans permettre a cette preuve de modifier directement `reliableDps`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-external-evidence-bridge-plan.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `outputs/diablo4-external-evidence-bridge-plan/external-evidence-bridge-plan.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `site/app.js`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Domaines de bridge :

- `bridge-delta-1663210`
  - relier une preuve acceptee a `SF_32`, `SF_33` ou `uptime`
  - ne fermer `blocked-delta-cleared` que si les trois preuves sont pretes
- `bridge-slots-1461593`
  - relier une preuve acceptee a `allowedSlots`
  - recalculer les contraintes de build sans utiliser de libelle UI seul
- `bridge-additive-buckets`
  - relier une preuve acceptee a `additive`, `multiplicative`, `uptime` ou `cap`
  - alimenter le moteur buckets fins sans inclure les candidats bloques

Resultat actuel :

- statut : `external-evidence-bridge-blocked`
- etapes : `3`
- pretes : `0`
- bloquees : `3`
- preuves acceptees : `0`
- `canModifyReliableDps false`
- `reliableDpsStillBlocked true`
- `bucketContractSafe true`
- suite optimiseur : `target-optimizer-suite-ok`, `11` etapes

Validation :

- site : `http://127.0.0.1:4173/site/` repond `200`
- artefact bridge : `/outputs/diablo4-external-evidence-bridge-plan/external-evidence-bridge-plan.json` repond `200`
- plan optimiseur : `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` repond `200`

Decision :

Le chemin de promotion est maintenant explicite : intake -> preuve acceptee -> bridge parseur -> invariant de suite -> seulement ensuite modification potentielle du modele. Tant qu'une de ces etapes manque, `reliableDps` reste strict.

## Test du bridge de preuves externes

Un test autonome a ete ajoute pour verifier le comportement du bridge quand une preuve externe acceptee existe, sans modifier l'intake reel du projet.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/test-external-evidence-bridge.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Scenario teste :

- creation temporaire d'une preuve `delta-1663210`
- domaine : `delta-1663210`
- asset : `1663210`
- claim : `sf33-trigger`
- champ : `SF_33`
- source : `extracted-game-data`
- revue : `approved`

Resultat attendu :

- intake temporaire : `1` preuve acceptee
- bridge : `1` etape prete
- bridge delta : `ready-for-parser-bridge`
- bridge slots : `blocked-waiting-for-accepted-evidence`
- bridge buckets : `blocked-waiting-for-accepted-evidence`
- `canModifyReliableDps false`

Validation :

- suite optimiseur : `target-optimizer-suite-ok`, `12` etapes
- script inclus : `test-external-evidence-bridge.js`
- site : `http://127.0.0.1:4173/site/` repond `200`
- suite JSON : `/outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` repond `200`
- plan optimiseur : `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` repond `200`

Decision :

Le bridge sait maintenant detecter une preuve acceptee et preparer le parser cible, tout en prouvant que le DPS fiable reste inchange tant qu'aucun parser et invariant de promotion ne sont ajoutes.

## Test des refus de preuves externes

Un test autonome a ete ajoute pour verifier que l'intake refuse ou bloque les preuves invalides avant toute tentative de bridge.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/test-external-evidence-intake-rejections.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Fixtures negatives :

- `reject-ui-source`
  - source `ui-label`
  - resultat : `rejected`
  - blocker attendu : `source-kind-rejected`
- `pending-wrong-asset`
  - domaine `delta-1663210`, asset `1461593`
  - blocker attendu : `domain-asset-mismatch`
- `pending-wrong-claim`
  - domaine `slots-1461593`, claim `sf33-trigger`, champ `SF_33`
  - blockers attendus : `claim-type-not-valid-for-domain`, `claim-field-not-valid-for-domain`
- `pending-missing-anchor`
  - domaine `additive-buckets`, mapping sans `Bonus_Percent_Per_Power`
  - blocker attendu : `claim-mapping-missing-domain-anchor`
- `pending-manual-review`
  - preuve syntaxiquement correcte mais `reviewer.status = pending`
  - blocker attendu : `manual-review-required`

Resultat :

- acceptees : `0`
- en attente : `4`
- rejetees : `1`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `13` etapes

Validation :

- site : `http://127.0.0.1:4173/site/` repond `200`
- suite JSON : `/outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` repond `200`
- plan optimiseur : `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` repond `200`

Decision :

Les preuves externes invalides sont maintenant couvertes par regression automatique. Cela protege le chemin de promotion avant meme le bridge parseur.

## Plan nouvelle famille binaire

Un plan de recherche source-backed a ete ajoute pour cadrer la prochaine piste locale prometteuse : trouver une nouvelle famille de records binaires au lieu de promouvoir par analogie.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-new-binary-family-plan.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-new-binary-family-plan/new-binary-family-plan.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Sondes definies :

- `binary-family-delta-parent-1663210`
  - domaine : `delta-1663210`
  - objectif : record parent ou consommateur exact autour de `Mod.SoilRuler_B`
  - portes : `sf32-field-ownership`, `sf33-trigger`, `uptime-proven-or-separated`
- `binary-family-slots-1461593`
  - domaine : `slots-1461593`
  - objectif : famille aspect-equipement non localisation avec champ slot direct
  - portes : `slot-field-direct`, `asset-mapping-1461593`
- `binary-family-bucket-source`
  - domaine : `additive-buckets`
  - objectif : famille qui classe `Bonus_Percent_Per_Power` en bucket additif/multiplicatif
  - portes : `bucket-family-named`, `bonus-percent-anchor`

Resultat :

- sondes : `3`
- pretes : `0`
- bloquees : `3`
- preuves locales epuisees : `true`
- prochaine sonde : `binary-family-delta-parent-1663210`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `14` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- site : `http://127.0.0.1:4173/site/` repond `200`
- nouveau plan : `/outputs/diablo4-new-binary-family-plan/new-binary-family-plan.json` repond `200`
- plan optimiseur : `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` repond `200`
- suite JSON : `/outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` repond `200`

Decision :

La suite sait maintenant quoi chercher dans les donnees binaires avant de coder un parseur. Le delta `48960`, les slots de `1461593` et les buckets fins restent bloques tant qu'une preuve source explicite n'a pas ete trouvee puis reliee a un parseur avec invariant.

## Audit delta parent de la famille binaire

Un audit cible a ete ajoute pour la sonde prioritaire `binary-family-delta-parent-1663210`. Il consolide les artefacts locaux existants au lieu de relancer un scan lourd, puis classe les preuves par gate promouvable.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/audit-new-binary-family-delta-parent.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-new-binary-family-delta-parent-audit/delta-parent-audit.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Sources consolidees :

- `outputs/diablo4-new-binary-family-plan/new-binary-family-plan.json`
- `outputs/diablo4-source-asset-1663210-record-headers/record-header-inspection.json`
- `outputs/diablo4-source-asset-1663210-field-records/field-record-inspection.json`
- `outputs/diablo4-source-asset-1663210-structural-relations/structural-relations.json`
- `outputs/diablo4-sf33-binary-parent-source/sf33-binary-parent-source.json`
- `outputs/diablo4-delta-promotion-conclusion/delta-promotion-conclusion.json`

Resultat :

- probe : `binary-family-delta-parent-1663210`
- asset : `1663210`
- gates : `3`
- gates passees : `0`
- gates bloquees : `sf32-field-ownership`, `sf33-trigger`, `uptime-proven-or-separated`
- contexte local : present
- parent/consommateur exact : absent
- `canModifyReliableDps false`
- prochaine recherche : `corpus-binary-parent-consumer-scan`
- suite optimiseur : `target-optimizer-suite-ok`, `15` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- site : `http://127.0.0.1:4173/site/` repond `200`
- audit delta parent : `/outputs/diablo4-new-binary-family-delta-parent-audit/delta-parent-audit.json` repond `200`
- plan optimiseur : `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` repond `200`
- suite JSON : `/outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` repond `200`

Decision :

Le contexte local autour de `Mod.SoilRuler_B` et du hash `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate` est utile mais non promouvable. La prochaine avance doit etre un scan corpus-wide des parents/consommateurs binaires; aucun parseur de promotion ni changement de `reliableDps` ne doit etre ajoute avant cette preuve.

## Scan corpus parent/consommateur delta

Un scan corpus-wide a ete ajoute sur les payloads deja decodes dans `outputs`. Il cherche les occurrences de `Mod.SoilRuler_B`, du hash bonus cible, du hash PowerTag `2084621218`, des references d'offset directes, et des layouts selector/asset proches.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/scan-delta-parent-consumer-corpus.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-parent-consumer-corpus-scan/delta-parent-consumer-corpus-scan.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Cibles surveillees :

- asset : `1663210`
- trigger : `Mod.SoilRuler_B`
- hash bonus : `Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate`
- hash PowerTag : `2084621218`
- selector : `949`
- metadata : `12337`

Resultat :

- fichiers decodes scannes : `123`
- hits : `1`
- hit local cible : `1`
- candidat externe explicite : `0`
- candidat hash-reference : `0`
- candidat hash-only : `0`
- parent/consommateur candidat : `0`
- parent/consommateur exact prouve : `false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `16` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- site : `http://127.0.0.1:4173/site/` repond `200`
- scan corpus delta : `/outputs/diablo4-delta-parent-consumer-corpus-scan/delta-parent-consumer-corpus-scan.json` repond `200`
- plan optimiseur : `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` repond `200`
- suite JSON : `/outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` repond `200`

Decision :

Le corpus decode actuel ne contient pas de parent/consommateur externe pour `Mod.SoilRuler_B`. La prochaine piste utile n'est plus de reparser le local 1663210, mais d'elargir aux payloads non encore decodes ou aux tables binaires hors chaines.

## Plan d'extension decode delta

Un plan d'elargissement a ete ajoute pour transformer le resultat `local-only` du scan corpus en file d'inspection concrete. Il s'appuie sur les analogies `Mod.UpgradeB` / `Mod.UpgradeC` trouvees par le scan SF33 complet.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-parent-expanded-decode-plan.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-parent-expanded-decode-plan/delta-parent-expanded-decode-plan.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- analogies UpgradeB/C : `8`
- candidats deja decodes : `8`
- payloads manquants : `0`
- haute confiance decodee : `2`
- file d'inspection : `1489641`, `2245719`, `199516`, `1690398`, `2302974`, `1631672`, `266570`, `202484`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `17` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- site : `http://127.0.0.1:4173/site/` repond `200`
- plan extension decode : `/outputs/diablo4-delta-parent-expanded-decode-plan/delta-parent-expanded-decode-plan.json` repond `200`
- plan optimiseur : `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` repond `200`
- suite JSON : `/outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` repond `200`

Decision :

Il n'est pas necessaire de decoder plus pour exploiter les analogies UpgradeB/C prioritaires : elles sont deja disponibles. La prochaine etape doit comparer leurs structures parent/consommateur a `Mod.SoilRuler_B`, sans promouvoir SF33 ni modifier `reliableDps`.

## Audit structurel UpgradeB/C vs SoilRuler

Un audit structurel a ete ajoute pour comparer les analogies `Mod.UpgradeB` / `Mod.UpgradeC` deja decodees avec le cas cible `Mod.SoilRuler_B`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/audit-delta-parent-upgrade-structure.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-parent-upgrade-structure-audit/delta-parent-upgrade-structure-audit.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- analogies inspectees : `8`
- hits UpgradeB/C : `13`
- flags autonomes : `3`
- formules conditionnelles : `10`
- hits avec references d'offset directes : `3`
- signatures trailer compatibles avec SoilRuler `5:90` : `13`
- assets compatibles : `199516`, `1489641`, `1690398`, `2302974`, `2245719`, `1631672`, `266570`, `202484`
- candidat motif reutilisable : `true`
- parent/consommateur exact prouve : `false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `18` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport audit structurel : genere dans `outputs/diablo4-delta-parent-upgrade-structure-audit/delta-parent-upgrade-structure-audit.json`
- plan optimiseur : `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` regenere
- suite JSON : `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` regeneree

Decision :

Le motif structurel `Mod.*` autour du trailer `5:90` est confirme sur les analogies UpgradeB/C, mais ce n'est pas une preuve de trigger ni d'uptime. `Mod.SoilRuler_B` reste bloque pour le DPS fiable; la prochaine etape utile est d'identifier la table ou le record parent qui reference ces flags.

## Graphe de references offsets Mod.*

Un audit de graphe de references a ete ajoute pour verifier si les entrees de table pointees par `Mod.SoilRuler_B` et les flags `Mod.UpgradeB/C` sont elles-memes referencees par un parent local.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/audit-delta-parent-offset-reference-graph.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-parent-offset-reference-graph/delta-parent-offset-reference-graph.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- ancres inspectees : `4`
- ancre cible SoilRuler : `1`
- ancres UpgradeB/C : `3`
- references parentes vers les entrees de table : `0`
- references parentes cible : `0`
- references parentes Upgrade : `0`
- parent/consommateur exact prouve : `false`
- `promotionReady false`
- `canModifyReliableDps false`
- statut : `delta-parent-offset-reference-terminal-table-only`
- suite optimiseur : `target-optimizer-suite-ok`, `19` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport graphe offsets : genere dans `outputs/diablo4-delta-parent-offset-reference-graph/delta-parent-offset-reference-graph.json`
- plan optimiseur : `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` regenere
- suite JSON : `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` regeneree

Decision :

Les offsets directs prouvent la relation `chaine Mod.* -> entree de table`, mais ces entrees ne sont pas referencees a leur tour dans les payloads inspectes. La piste locale est donc terminale pour cette couche; la suite doit chercher le consommateur dans une table superieure hors payload local ou dans des records binaires non textuels.

## Scan SystemsTuningGlobals cible

Un scan cible a ete ajoute pour comparer le hash `SystemsTuningGlobals` voisin de `Mod.SoilRuler_B` avec les hashes voisins des analogies `Mod.UpgradeB/C`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/scan-delta-parent-systems-tuning-contexts.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-parent-systems-tuning-contexts/delta-parent-systems-tuning-contexts.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- fichiers decodes scannes : `123`
- hashes cibles compares : `4`
- contextes hash trouves : `80`
- contextes `SystemsTuningGlobals` : `2`
- hash cible SoilRuler : `2084621218`
- contextes hash cible : `2`
- contextes hash cible externes : `0`
- contextes `SystemsTuningGlobals` cible externes : `0`
- contextes Upgrade : `78`
- contextes Upgrade externes : `48`
- parent/consommateur exact prouve : `false`
- `promotionReady false`
- `canModifyReliableDps false`
- statut : `delta-parent-systems-tuning-target-local-only`
- suite optimiseur : `target-optimizer-suite-ok`, `20` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport SystemsTuning : genere dans `outputs/diablo4-delta-parent-systems-tuning-contexts/delta-parent-systems-tuning-contexts.json`
- plan optimiseur : `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` regenere
- suite JSON : `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` regeneree

Decision :

Le hash `SystemsTuningGlobals` cible `2084621218` reste local a l'asset SoilRuler dans le corpus decode, alors que les hashes Upgrade ont des contextes externes. Cette difference renforce le blocage SF_33 : aucune activation externe de `Mod.SoilRuler_B` n'est prouvee. La suite utile est de scanner les payloads non decodes ou des tables superieures non textuelles.

## Plan sources non decodees delta

Un plan de decodage cible a ete ajoute pour verifier si le graphe de references externes contient encore des sources SoilRuler/SF33 prioritaires non decodees.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-parent-undecoded-source-plan.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-parent-undecoded-source-plan/delta-parent-undecoded-source-plan.json`
- `outputs/diablo4-delta-parent-undecoded-source-plan/run-targeted-delta-parent-decodes.ps1`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- assets de references externes : `19`
- assets scores : `19`
- assets haute priorite SoilRuler/SF33 : `2`
- assets haute priorite deja decodes : `2`
- assets haute priorite a decoder : `0`
- prochaine file de decode : vide
- parent/consommateur exact prouve : `false`
- `promotionReady false`
- `canModifyReliableDps false`
- statut : `delta-parent-undecoded-source-plan-no-missing-targeted-decodes`
- suite optimiseur : `target-optimizer-suite-ok`, `21` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport sources non decodees : genere dans `outputs/diablo4-delta-parent-undecoded-source-plan/delta-parent-undecoded-source-plan.json`
- plan optimiseur : `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` regenere
- suite JSON : `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` regeneree

Decision :

Il ne manque pas de decode cible dans les sources externes prioritaires pour SoilRuler/SF33 : les deux assets pertinents sont deja disponibles. La prochaine etape doit donc inspecter des tables superieures non textuelles dans les payloads deja decodes, pas decoder plus largement.

## Audit tables superieures non textuelles delta

Un audit a ete ajoute pour inspecter les signaux numeriques non textuels dans les payloads prioritaires deja decodes, notamment l'occurrence hash-only du hash `SystemsTuningGlobals` cible.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/audit-delta-parent-nontext-table-signals.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-parent-nontext-table-signals/delta-parent-nontext-table-signals.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- assets inspectes : `2`
- payloads inspectes : `2`
- occurrences numeriques : `12`
- signaux hash cible non textuels : `1`
- signaux hash cible lies localement : `0`
- signaux selector/asset layout : `2`
- parent/consommateur exact prouve : `false`
- `promotionReady false`
- `canModifyReliableDps false`
- statut : `delta-parent-nontext-target-hash-unlinked`
- suite optimiseur : `target-optimizer-suite-ok`, `22` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport tables non texte : genere dans `outputs/diablo4-delta-parent-nontext-table-signals/delta-parent-nontext-table-signals.json`
- plan optimiseur : `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` regenere
- suite JSON : `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` regeneree

Decision :

Une occurrence non textuelle du hash cible existe, mais elle n'est pas reliee localement au trigger `Mod.SoilRuler_B`, au selector `949`, ni a l'asset `1663210`. Cette couche locale ne prouve donc pas SF_33. Le delta reste hors `reliableDps`.

## Conclusion locale delta

Une conclusion de cloture locale a ete ajoutee pour agreger les pistes SF_33 deja inspectees et eviter de continuer a tourner sur la meme hypothese locale sans nouveau type de preuve.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-local-exhaustion-conclusion.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-local-exhaustion-conclusion/delta-local-exhaustion-conclusion.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- checks locaux SF33 : `5`
- signaux SF33 prets : `0`
- SF33 local epuise : `true`
- parent/consommateur exact prouve : `false`
- `promotionReady false`
- `canModifyReliableDps false`
- prochaine priorite : `sf32-field-ownership`
- statut : `delta-local-sf33-evidence-exhausted`
- suite optimiseur : `target-optimizer-suite-ok`, `23` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport conclusion delta : genere dans `outputs/diablo4-delta-local-exhaustion-conclusion/delta-local-exhaustion-conclusion.json`
- plan optimiseur : `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` regenere avec la conclusion
- suite JSON : `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` regeneree

Decision :

Les pistes locales SF_33 inspectees ne prouvent ni parent/consommateur, ni contexte externe, ni decode cible manquant. SF_33 est donc clos localement pour l'instant. La suite prioritaire devient `sf32-field-ownership`; l'uptime reste une hypothese utilisateur ou une preuve externe separee. Le delta reste hors `reliableDps`.

## Conclusion locale SF32

Une conclusion de cloture locale a ete ajoutee pour le verrou `SF_32`. Elle consolide les audits deja existants autour de `selector 949`, `metadata 12337 / scale 10`, tables locales, analogies compactes et liens record/header.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-sf32-local-exhaustion-conclusion.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-sf32-local-exhaustion-conclusion/sf32-local-exhaustion-conclusion.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- portes promotion SF32 echouees : `5 / 5`
- bloqueurs SF32 : `7`
- checks locaux SF32 : `7`
- signaux SF32 prets : `0`
- preuves externes acceptees : `0`
- bridge externe pret : `0`
- SF32 local epuise : `true`
- ownership champ prouve : `false`
- `promotionReady false`
- `canModifyReliableDps false`
- prochaine priorite : `external-source-mapping-selector-949`
- statut : `sf32-local-evidence-exhausted`
- suite optimiseur : `target-optimizer-suite-ok`, `24` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport conclusion SF32 : genere dans `outputs/diablo4-sf32-local-exhaustion-conclusion/sf32-local-exhaustion-conclusion.json`
- plan optimiseur : `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` regenere avec la conclusion SF32
- suite JSON : `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` regeneree avec `24` etapes

Decision :

Les preuves locales `SF_32` ne ferment aucune porte de promotion : `selector 949` reste mixte, aucun second compact `949` n'existe, `metadata 12337 / scale 10` est transverse, et aucune table source nommee n'est disponible. Il ne faut plus relancer d'audit local SF32 sans nouvelle source. La prochaine preuve utile doit etre une source externe acceptee ou un parseur binaire de champ. Le delta reste hors `reliableDps`.

## Conclusion locale uptime

Une conclusion de cloture locale a ete ajoutee pour le verrou uptime. Elle consolide les audits `SF_28/SF_29`, chaines de probabilite, dependance locale au hash bonus, scenario utilisateur et garde-fous `reliableDps`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-uptime-local-exhaustion-conclusion.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-uptime-local-exhaustion-conclusion/uptime-local-exhaustion-conclusion.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- checks locaux uptime : `5`
- signaux uptime fiables : `0`
- chaines de probabilite : `2`
- lignes de probabilite liees a SF32/SF33 : `0`
- chaines liees a SF32/SF33 : `0`
- hints duree/uptime : `0`
- uptime explicite : `false`
- uptime numerique : `false`
- uptime fiable prouvee : `false`
- scenario utilisateur separe : `true`
- preuves externes acceptees : `0`
- `promotionReady false`
- `canModifyReliableDps false`
- prochaine priorite : `user-uptime-scenario-contract`
- statut : `uptime-local-reliable-evidence-exhausted`
- suite optimiseur : `target-optimizer-suite-ok`, `25` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport conclusion uptime : genere dans `outputs/diablo4-uptime-local-exhaustion-conclusion/uptime-local-exhaustion-conclusion.json`
- plan optimiseur : `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` regenere avec la conclusion uptime
- suite JSON : `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` regeneree avec `25` etapes

Decision :

Les preuves locales d'uptime ne prouvent pas le DPS fiable : `SF_28/SF_29` sont des probabilites/procs locaux non relies a `SF_32/SF_33` et sans valeur d'uptime explicite. Le site peut conserver l'uptime comme hypothese utilisateur separee, mais aucune valeur d'uptime ne doit entrer dans `reliableDps` sans preuve externe numerique ou mapping source-backed.

## Conclusion delta globale enrichie

La conclusion delta locale a ete enrichie pour consommer les conclusions `SF_32` et uptime. Elle ne se limite plus a la piste `SF_33`; elle consolide maintenant les trois verrous obligatoires du delta `48960`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-local-exhaustion-conclusion.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-local-exhaustion-conclusion/delta-local-exhaustion-conclusion.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- SF32 local epuise : `true`
- SF33 local epuise : `true`
- uptime fiable locale epuisee : `true`
- scenario utilisateur separe : `true`
- preuves locales delta toutes epuisees : `true`
- parent/consommateur exact prouve : `false`
- `promotionReady false`
- `canModifyReliableDps false`
- prochaine priorite : `external-delta-evidence`
- statut : `delta-local-all-evidence-exhausted`
- suite optimiseur : `target-optimizer-suite-ok`, `25` etapes

Validation :

- controles syntaxe Node : OK pour le script delta, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport conclusion delta : regenere avec `allLocalEvidenceExhausted true`
- plan optimiseur : `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` regenere avec `localConclusions`
- suite JSON : `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` regeneree avec les invariants delta globaux

Decision :

Le delta `48960` de `1663210` reste un what-if bloque. Les trois preuves locales obligatoires sont epuisees pour le DPS fiable. La suite utile n'est plus un audit local redondant : il faut soit une preuve externe acceptee, soit une nouvelle famille binaire source-backed, soit maintenir le contrat what-if utilisateur separe sans jamais toucher `reliableDps`.

## Plan preuves externes delta

Un plan cible a ete ajoute pour transformer le focus `external-delta-evidence` en checklist exploitable. Il definit les trois preuves minimales a fournir pour le delta `1663210`, avec les claims, champs, sources acceptees, rejets et parser bridges attendus.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-external-delta-evidence-plan.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `inputs/external-evidence-candidates.example.json`
- `outputs/diablo4-external-delta-evidence-plan/external-delta-evidence-plan.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- preuves externes delta requises : `3`
- preuves pretes : `0`
- preuves manquantes : `3`
- preuves externes acceptees : `0`
- bridge delta : `blocked-waiting-for-accepted-evidence`
- local epuise : `true`
- `promotionReady false`
- `canModifyReliableDps false`
- prochaine priorite : `delta-proof-sf32-owner`
- statut : `external-delta-evidence-missing-required-proofs`
- suite optimiseur : `target-optimizer-suite-ok`, `26` etapes

Preuves requises :

- `delta-proof-sf32-owner` : `sf32-field-ownership` / `selector:949`
- `delta-proof-sf33-trigger` : `sf33-trigger` / `Mod.SoilRuler_B`
- `delta-proof-uptime` : `uptime` / `uptime`

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- JSON d'entree : `inputs/external-evidence-candidates.json` et exemple OK
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport plan preuves externes delta : genere dans `outputs/diablo4-external-delta-evidence-plan/external-delta-evidence-plan.json`
- plan optimiseur : `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json` regenere avec `externalDeltaEvidencePlan`
- suite JSON : `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` regeneree avec `26` etapes

Decision :

La suite pratique du delta n'est plus un audit local, mais une collecte de preuves source-backed. Une preuve acceptee dans l'intake ne modifie toujours pas `reliableDps`; elle ne rend possible qu'un futur parser bridge cible avec invariants de promotion separes.

## Test plan preuves externes delta

Un test dedie a ete ajoute pour verifier le contrat du plan de preuves externes delta. Il simule trois preuves acceptees pour `1663210` (`SF_32`, `SF_33`, uptime), puis confirme que le systeme rend seulement le bridge parseur pret sans promouvoir le DPS fiable.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/test-external-delta-evidence-plan.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat du test complet :

- preuves externes acceptees : `3`
- preuves delta pretes : `3 / 3`
- bridge delta : `ready-for-parser-bridge`
- `promotionReady false`
- `canModifyReliableDps false`

Resultat du test partiel :

- preuves delta pretes : `1 / 3`
- preuves manquantes : `2`
- prochaine priorite : `delta-proof-sf33-trigger`
- `canModifyReliableDps false`

Validation :

- controles syntaxe Node : OK pour le nouveau test et la suite
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- suite JSON : `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json` regeneree avec `27` etapes
- plan reel actuel : `3` preuves requises, `0` pretes, `3` manquantes

Decision :

Meme si les trois preuves delta sont acceptees dans un intake de test, elles ne modifient pas `reliableDps` et ne marquent pas la promotion comme prete. Elles ne permettent que l'etape suivante : construire un parser bridge cible, avec des invariants de promotion separes.

## Workorder preuves externes delta

Un workorder de collecte a ete ajoute pour transformer le plan de preuves externes delta en file exploitable. Il produit les trois taches de revue attendues, les checklists de validation, les rejets explicites et les templates JSON a renseigner dans `inputs/external-evidence-candidates.json`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-external-delta-evidence-workorder.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- taches de collecte : `3`
- taches pretes : `0`
- taches ouvertes : `3`
- prochaine tache : `delta-proof-sf32-owner`
- preuves externes acceptees : `0`
- templates intake generes : `3`
- `promotionReady false`
- `canModifyReliableDps false`
- statut : `external-delta-evidence-workorder-open`
- suite optimiseur : `target-optimizer-suite-ok`, `28` etapes

Taches generees :

- `delta-proof-sf32-owner` : prouver `sf32-field-ownership` / `selector:949`
- `delta-proof-sf33-trigger` : prouver `sf33-trigger` / `Mod.SoilRuler_B`
- `delta-proof-uptime` : prouver `uptime` / `uptime`

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport workorder : genere dans `outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json`
- plan optimiseur : regenere avec `externalDeltaEvidenceWorkorder`
- site : nouveau panneau `Collecte delta`

Decision :

La suite est maintenant operationnelle pour l'entree de preuves externes : le projet sait exactement quelles preuves collecter et quel JSON renseigner. Le workorder ne fabrique pas de preuve, ne valide pas les templates et ne modifie pas `reliableDps`; il organise seulement la collecte et la revue.

## Contrat what-if utilisateur

Un contrat what-if utilisateur a ete ajoute pour formaliser le scenario `SF_33 actif avec uptime utilisateur`. Il fixe les bornes, la formule, les exemples de calcul et la politique d'export/import sans transformer cette hypothese en preuve fiable.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-user-whatif-contract.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-user-whatif-contract/user-whatif-contract.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- scenario : `user-scenario-1663210-sf33-uptime`
- strict DPS : `163200`
- delta bloque : `48960`
- samples : `6`
- checks contrat : `5`
- checks echoues : `0`
- uptime `0%` avec SF33 actif : `163200`
- uptime `50%` avec SF33 actif : `187680`
- uptime `100%` avec SF33 actif : `212160`
- `promotionReady false`
- `canModifyReliableDps false`
- statut : `user-whatif-contract-safe`
- suite optimiseur : `target-optimizer-suite-ok`, `29` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport contrat : genere dans `outputs/diablo4-user-whatif-contract/user-whatif-contract.json`
- plan optimiseur : regenere avec `userWhatIfContract`
- site : nouveau panneau `Contrat what-if`

Decision :

L'uptime utilisateur devient un contrat de simulation stable pour l'interface et l'export de build. Ce contrat n'est pas une preuve source-backed : `configuredWhatIfDps` ne remplace jamais `reliableDps`, le ranking fiable reste strict-only et les portes `SF_32`, `SF_33`, `uptime` restent bloquees.

## Garde-fou import/export what-if

L'export de build embarque maintenant la politique du contrat what-if utilisateur, et l'import sanitise explicitement les champs interdits. Un test dedie simule un payload hostile contenant une tentative de promotion fiable.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/test-user-whatif-import-contract.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `site/app.js`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- export enrichi : `userScenarioContract`
- import sanitise : `sanitizeImportedUserScenario`
- champs interdits ignores : `reliableDpsOverride`, `promotionReady`, `canUseForReliableDps`
- uptime hostile `1.75` bornee a `1`
- scenario importe conserve : `sf33Active true`, `uptime 1`
- reliableDps override : absent du scenario sanitise
- test : `user-whatif-import-contract-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `30` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau test, la suite et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- test import hostile : OK

Decision :

Les imports de build peuvent restaurer l'hypothese utilisateur `SF_33 + uptime`, mais ils ne peuvent pas injecter de score fiable, de promotion ou d'autorisation de ranking. Le DPS fiable reste derive du moteur strict et des gates, jamais du JSON importe.

## Packet source SF32 owner

Un packet source dedie a `delta-proof-sf32-owner` a ete ajoute. Il consolide la cible exacte, les signaux locaux rejetes, le claim attendu et le contrat du futur parser bridge.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-sf32-owner-source-packet.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-sf32-owner-source-packet/sf32-owner-source-packet.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`, `selector:949`, `SF_32`
- preuves acceptees : `0`
- signaux locaux rejetes : `7`
- local epuise : `true`
- bridge parser requis : `true`
- claim attendu : `sf32-field-ownership` / `selector:949`
- statut bridge : `blocked-waiting-for-source`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `31` etapes

Signaux locaux rejetes conserves :

- `selector-owner-fields`
- `second-compact-selector-949`
- `metadata-12337-scale-10`
- `named-local-source-table`
- `fresh-record-source-links`
- `compact-cross-selector-analogy`
- `numeric-table-contexts`

Validation :

- controles syntaxe Node : OK pour le nouveau script, la suite, le plan optimiseur et le site
- suite optimiseur : `.\run-target-optimizer-suite.ps1` OK
- rapport packet : genere dans `outputs/diablo4-sf32-owner-source-packet/sf32-owner-source-packet.json`
- plan optimiseur : regenere avec `sf32OwnerSourcePacket`
- site : nouveau panneau `Packet SF_32`

Decision :

La prochaine avance SF32 doit venir d'une preuve source-backed ou d'un parser bridge capable de nommer le champ proprietaire. Le packet ne fabrique aucune preuve et garde tous les signaux locaux rejetes hors promotion; `reliableDps` reste strict-only.

## Bridge parser SF32 owner

Un bridge parser dedie a `delta-proof-sf32-owner` a ete ajoute. Il transforme uniquement des preuves acceptees en mapping normalise `selector:949 -> SF_32`, et conserve explicitement la promotion DPS hors de portee.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-sf32-owner-parser-bridge.js`
- `work/diablo4-data-exporter/scripts/test-sf32-owner-parser-bridge.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-sf32-owner-parser-bridge/sf32-owner-parser-bridge.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`, `selector:949`, `SF_32`
- bridge reel : bloque
- preuves acceptees reelles : `0`
- mappings reels : `0`
- test synthetique : `selector:949 -> SF_32` OK avec `1` preuve acceptee
- `bridgeReady false` sur les donnees reelles
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `33` etapes

Validation :

- controles syntaxe Node : OK pour le nouveau bridge, le test, la suite, le plan optimiseur et le site
- test bridge synthetique : `sf32-owner-parser-bridge-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `33` etapes
- endpoints site verifies :
  - `/site/`
  - `/outputs/diablo4-sf32-owner-parser-bridge/sf32-owner-parser-bridge.json`
  - `/outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
  - `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- site : nouveau panneau `Bridge SF_32`

Decision :

Le bridge est pret cote mecanique mais bloque sur les donnees reelles faute de preuve acceptee. Une preuve externe acceptee peut produire le mapping `SF_32`, mais elle ne peut pas promouvoir `reliableDps`; les verrous `SF_33` et `uptime` restent necessaires avant toute sortie fiable.

## Packet et bridge parser SF33 trigger

Un packet source et un bridge parser dedies a `delta-proof-sf33-trigger` ont ete ajoutes. Ils cadrent le mapping attendu `Mod.SoilRuler_B -> SF_33` sans assimiler les signaux locaux a une activation gameplay fiable.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-sf33-trigger-source-packet.js`
- `work/diablo4-data-exporter/scripts/build-sf33-trigger-parser-bridge.js`
- `work/diablo4-data-exporter/scripts/test-sf33-trigger-parser-bridge.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-sf33-trigger-source-packet/sf33-trigger-source-packet.json`
- `outputs/diablo4-sf33-trigger-parser-bridge/sf33-trigger-parser-bridge.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`, `Mod.SoilRuler_B`, `SF_33`
- packet reel : bloque
- preuves acceptees reelles : `0`
- signaux locaux rejetes : `5`
- bridge reel : bloque
- mappings reels : `0`
- test synthetique : `Mod.SoilRuler_B -> SF_33` OK avec `1` preuve acceptee
- `bridgeReady false` sur les donnees reelles
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `36` etapes

Validation :

- controles syntaxe Node : OK pour le packet, le bridge, le test, la suite, le plan optimiseur et le site
- test bridge synthetique : `sf33-trigger-parser-bridge-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `36` etapes
- endpoints site verifies :
  - `/site/`
  - `/outputs/diablo4-sf33-trigger-source-packet/sf33-trigger-source-packet.json`
  - `/outputs/diablo4-sf33-trigger-parser-bridge/sf33-trigger-parser-bridge.json`
  - `/outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
  - `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- site : nouveaux panneaux `Packet SF_33` et `Bridge SF_33`

Decision :

Le bridge `SF_33` est pret cote mecanique mais bloque sur les donnees reelles faute de preuve acceptee. Les preuves locales gardent seulement une valeur de contexte/rejet; elles ne prouvent pas l'activation de `Mod.SoilRuler_B`. Le DPS fiable reste strict-only tant que `SF_32`, `SF_33` et l'uptime ne sont pas tous prouves.

## Packet et bridge parser uptime

Un packet source et un bridge parser dedies a `delta-proof-uptime` ont ete ajoutes. Ils cadrent l'uptime comme valeur numerique source-backed, bornee entre `0` et `1`, et separee du DPS fiable.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-uptime-source-packet.js`
- `work/diablo4-data-exporter/scripts/build-uptime-parser-bridge.js`
- `work/diablo4-data-exporter/scripts/test-uptime-parser-bridge.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-uptime-source-packet/uptime-source-packet.json`
- `outputs/diablo4-uptime-parser-bridge/uptime-parser-bridge.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`, `uptime`
- packet reel : bloque
- preuves acceptees reelles : `0`
- signaux locaux rejetes : `5`
- bridge reel : bloque
- mappings reels : `0`
- test synthetique : uptime `0.5` OK avec `1` preuve acceptee
- test de rejet : uptime `1.75` refusee, `0` mapping
- `bridgeReady false` sur les donnees reelles
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `39` etapes

Validation :

- controles syntaxe Node : OK pour le packet, le bridge, le test, la suite, le plan optimiseur et le site
- test bridge synthetique : `uptime-parser-bridge-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `39` etapes
- endpoints site verifies :
  - `/site/`
  - `/outputs/diablo4-uptime-source-packet/uptime-source-packet.json`
  - `/outputs/diablo4-uptime-parser-bridge/uptime-parser-bridge.json`
  - `/outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
  - `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- site : nouveaux panneaux `Packet uptime` et `Bridge uptime`

Decision :

Une uptime source-backed doit etre numerique, bornee et revue avant mapping. Meme validee, elle reste insuffisante pour promouvoir le delta `48960` tant que `SF_32` et `SF_33` ne sont pas aussi prouves. Elle peut seulement alimenter un what-if controle; `reliableDps` reste strict-only.

## Readiness bridge delta

Un rapport de consolidation des trois bridges delta a ete ajoute. Il agrège `SF_32`, `SF_33` et `uptime` pour savoir si le delta `48960` est pret pour une revue de promotion separee.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-bridge-readiness.js`
- `work/diablo4-data-exporter/scripts/test-delta-bridge-readiness.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-bridge-readiness/delta-bridge-readiness.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- delta bloque : `48960`
- bridges reels prets : `0 / 3`
- gates bloquees : `sf32-owner`, `sf33-trigger`, `uptime`
- `allBridgeReady false`
- `canUseForUserWhatIf false`
- `promotionReady false`
- `canModifyReliableDps false`
- test synthetique : `3 / 3` bridges prets, `canUseForUserWhatIf true`, `promotionReady false`
- suite optimiseur : `target-optimizer-suite-ok`, `41` etapes

Validation :

- controles syntaxe Node : OK pour le rapport, le test, la suite, le plan optimiseur et le site
- test bridge synthetique : `delta-bridge-readiness-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `41` etapes
- endpoints site verifies :
  - `/site/`
  - `/outputs/diablo4-delta-bridge-readiness/delta-bridge-readiness.json`
  - `/outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
  - `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- site : nouveau panneau `Readiness delta`

Decision :

La readiness combinee rend le statut du delta lisible en un seul endroit. Elle ne remplace pas les gates fiables : meme si les trois bridges deviennent prets, la promotion du DPS fiable devra passer par une etape de revue/recalcul separee. Sur les donnees reelles actuelles, le delta reste bloque.

## Revue promotion delta

Une revue de promotion explicite a ete ajoutee apres la readiness combinee. Elle formalise la derniere barriere avant toute modification future de `reliableDps`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-promotion-review.js`
- `work/diablo4-data-exporter/scripts/test-delta-promotion-review.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-promotion-review/delta-promotion-review.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- delta bloque : `48960`
- revue reelle : bloquee
- checks : `4`
- checks echoues : `1` (`all-bridges-ready`)
- `readyForManualReview false`
- `canUseForUserWhatIf false`
- `canUseForReliableDps false`
- `canUseForRanking false`
- `promotionReady false`
- `canModifyReliableDps false`
- test synthetique : `readyForManualReview true`, `canUseForUserWhatIf true`, mais `canUseForReliableDps false`, `canUseForRanking false`, `promotionReady false`
- suite optimiseur : `target-optimizer-suite-ok`, `43` etapes

Validation :

- controles syntaxe Node : OK pour le rapport, le test, la suite, le plan optimiseur et le site
- test revue synthetique : `delta-promotion-review-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `43` etapes
- endpoints site verifies :
  - `/site/`
  - `/outputs/diablo4-delta-promotion-review/delta-promotion-review.json`
  - `/outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
  - `/outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- site : nouveau panneau `Revue promotion`

Decision :

La revue de promotion verrouille la frontiere entre readiness et promotion. Meme avec trois bridges synthetiques prets, la sortie reste `promotionReady false` et `reliableDps` ne peut pas etre modifie. Une future promotion devra etre une etape separee, source-backed, avec recalcul explicite des gates.

## Package intake preuves delta

Un package de collecte/revue a ete ajoute pour transformer les trois taches delta ouvertes en templates utilisables dans `inputs/external-evidence-candidates.json`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-evidence-intake-package.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-intake-package.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-intake-package/delta-evidence-intake-package.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- delta bloque : `48960`
- templates : `3`
- taches ouvertes : `3`
- preuves acceptees : `0`
- bridges reels prets : `0 / 3`
- gates bloquees : `sf32-owner`, `sf33-trigger`, `uptime`
- target intake : `inputs/external-evidence-candidates.json`
- `packageReady true`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `45` etapes

Validation :

- controles syntaxe Node : OK pour le package, le test, la suite, le plan optimiseur et le site
- test package : `delta-evidence-intake-package-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `45` etapes
- plan optimiseur : section `deltaEvidenceIntakePackage` presente
- site : nouveau panneau `Package intake`

Decision :

Le package centralise la collecte des preuves SF32, SF33 et uptime. Les templates sont volontairement en statut `pending` et ne sont pas des preuves. Une entree ne pourra aider un bridge qu'apres source exacte, revue explicite et acceptation; elle ne peut pas modifier `reliableDps` directement.

## Brouillon preuve delta

Un generateur de brouillon a ete ajoute pour sortir le prochain candidat de preuve a remplir depuis le package intake, sans modifier `inputs/external-evidence-candidates.json`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-evidence-draft.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-draft.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-draft/delta-evidence-draft.json`
- `outputs/diablo4-delta-evidence-draft/external-evidence-candidates.draft.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- template par defaut : `template-delta-proof-sf32-owner`
- candidat brouillon : `draft-delta-proof-sf32-owner`
- claim : `sf32-field-ownership` / `selector:949`
- placeholders restants : `7`
- target intake : `inputs/external-evidence-candidates.json`
- intake reel : `0` candidat
- `draftReadyForCopy false`
- `reviewerStatus pending`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `47` etapes

Validation :

- controles syntaxe Node : OK pour le brouillon, le test, la suite, le plan optimiseur et le site
- test brouillon : `delta-evidence-draft-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `47` etapes
- plan optimiseur : section `deltaEvidenceDraft` presente
- site : nouveau panneau `Brouillon preuve`
- controle important : le generateur n'ecrit pas dans `inputs/external-evidence-candidates.json`

Decision :

Le brouillon rend la prochaine action explicite sans affaiblir les gates. Il produit un candidat copiable et un fichier dry-run, mais tant que les placeholders ne sont pas remplaces par une source exacte et que la revue reste `pending`, aucune preuve n'est acceptee et `reliableDps` reste intouchable.

## Audit brouillon preuve delta

Un audit dry-run du brouillon a ete ajoute pour verifier une preuve candidate avant toute copie dans `inputs/external-evidence-candidates.json`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/audit-delta-evidence-draft.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-draft-audit.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-draft-audit/delta-evidence-draft-audit.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- brouillon reel : `1` candidat, `0` accepte, `1` pending
- placeholders reel : `7`
- bloqueurs structurels reel : `0`
- bloqueurs revue reel : `1`
- `readyForIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- test brouillon rempli : `readyForIntake true`, `acceptedForBridge false`
- suite optimiseur : `target-optimizer-suite-ok`, `49` etapes

Validation :

- controles syntaxe Node : OK pour l'audit, le test, la suite, le plan optimiseur et le site
- test audit : `delta-evidence-draft-audit-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `49` etapes
- plan optimiseur : section `deltaEvidenceDraftAudit` presente
- site : nouveau panneau `Audit brouillon`
- controle important : l'audit ne modifie pas `inputs/external-evidence-candidates.json`

Decision :

L'audit separe clairement `copiable en pending` de `approved`. Un brouillon rempli sans placeholders ni bloqueurs structurels peut etre copie dans l'intake reel, mais il reste non accepte tant que la revue manuelle n'est pas faite. Meme une preuve acceptee reste intake-only et ne peut pas modifier `reliableDps` sans bridge et gates dedies.

## Preview update intake delta

Un previsualiseur de mise a jour d'intake a ete ajoute pour produire un fichier merge separe, sans ecrire dans `inputs/external-evidence-candidates.json`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/preview-delta-evidence-intake-update.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-intake-update-preview.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-intake-update-preview/delta-evidence-intake-update-preview.json`
- `outputs/diablo4-delta-evidence-intake-update-preview/external-evidence-candidates.preview.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- intake reel : `0` candidat
- brouillon reel : `1` candidat
- preview reelle : `0` candidat
- merge reel : refuse
- doublons : `0`
- `readyForIntake false`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- test brouillon rempli : `previewMergeReady true`, `previewCandidates 1`, intake reel inchange
- suite optimiseur : `target-optimizer-suite-ok`, `51` etapes

Validation :

- controles syntaxe Node : OK pour la preview, le test, la suite, le plan optimiseur et le site
- test preview : `delta-evidence-intake-update-preview-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `51` etapes
- plan optimiseur : section `deltaEvidenceIntakeUpdatePreview` presente
- site : nouveau panneau `Preview intake`
- controle important : la preview n'ecrit jamais dans `inputs/external-evidence-candidates.json`

Decision :

La copie vers l'intake reel reste manuelle et visible. Le script refuse le brouillon actuel car il n'est pas pret, detecte les doublons, retire les marqueurs de brouillon dans la preview, et conserve `reviewer.status=pending`. Une preview prete ne vaut ni approbation, ni bridge, ni promotion fiable.

## Porte promotion manuelle delta

Une porte de promotion manuelle a ete ajoutee pour reunir l'etat preview, audit de brouillon et revue de promotion dans un seul rapport.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-manual-promotion-gate.js`
- `work/diablo4-data-exporter/scripts/test-delta-manual-promotion-gate.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-manual-promotion-gate/delta-manual-promotion-gate.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- checks : `5`
- checks echoues reel : `3`
- checks echoues : `preview-merge-ready`, `draft-ready-for-intake`, `promotion-review-manual-ready`
- `readyForHumanAction false`
- `previewMergeReady false`
- `draftReadyForIntake false`
- `promotionReviewReady false`
- `writesRealIntake false`
- `acceptedForBridge false`
- `canUseForReliableDps false`
- `canUseForRanking false`
- `promotionReady false`
- `canModifyReliableDps false`
- test synthetique : `readyForHumanAction true`, mais DPS fiable/ranking/promotion toujours `false`
- suite optimiseur : `target-optimizer-suite-ok`, `53` etapes

Validation :

- controles syntaxe Node : OK pour la porte, le test, la suite, le plan optimiseur et le site
- test porte : `delta-manual-promotion-gate-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `53` etapes
- plan optimiseur : section `deltaManualPromotionGate` presente
- site : nouveau panneau `Porte manuelle`

Decision :

La porte manuelle evite de confondre action humaine et promotion fiable. Meme quand toutes les preconditions synthetiques sont reunies, la sortie conserve `promotionReady false`, `canUseForReliableDps false`, `canUseForRanking false` et `canModifyReliableDps false`. Une future promotion devra passer par une etape dediee de recalcul source-backed des gates.

## Plan actions humaines delta

Un plan d'actions humaines a ete ajoute pour rendre la prochaine action concrete : remplir le brouillon SF_32 avant toute copie ou revue.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-human-action-plan.js`
- `work/diablo4-data-exporter/scripts/test-delta-human-action-plan.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-human-action-plan/delta-human-action-plan.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- claim : `sf32-field-ownership` / `selector:949`
- placeholders : `7`
- premiere action : remplir `source.title`
- gates bloquees : `preview-merge-ready`, `draft-ready-for-intake`, `promotion-review-manual-ready`
- actions : `5`
- actions pretes : `0`
- `previewMergeReady false`
- `readyForHumanAction false`
- `writesRealIntake false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `55` etapes

Validation :

- controles syntaxe Node : OK pour le plan, le test, la suite, le plan optimiseur et le site
- test plan : `delta-human-action-plan-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `55` etapes
- plan optimiseur : section `deltaHumanActionPlan` presente
- site : nouveau panneau `Actions manuelles`

Decision :

Le plan d'actions rend le blocage operationnel : la suite ne cherche plus une promotion, elle indique exactement quel champ remplir en premier. Le rapport reste non destructif, ne modifie pas l'intake reel, et garde `reliableDps`, le ranking et `promotionReady` bloques.

## Formulaire remplissage preuve delta

Un formulaire de remplissage a ete ajoute pour transformer le plan d'actions humaines en champs concrets a renseigner pour le brouillon SF_32.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-evidence-fill-form.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-fill-form.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-fill-form/delta-evidence-fill-form.json`
- `outputs/diablo4-delta-evidence-fill-form/delta-evidence-fill-form.md`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- claim : `sf32-field-ownership` / `selector:949`
- champs : `7`
- champs remplis : `0`
- premier champ : `source.title`
- `readyForDraftPatch false`
- `writesRealIntake false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `57` etapes

Validation :

- controles syntaxe Node : OK pour le formulaire, le test, la suite, le plan optimiseur et le site
- test formulaire : `delta-evidence-fill-form-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `57` etapes
- plan optimiseur : section `deltaEvidenceFillForm` presente
- site : nouveau panneau `Formulaire preuve`

Decision :

Le formulaire reste separe de l'intake reel. Il sert a renseigner les valeurs manquantes du brouillon, sans ecriture automatique, sans approbation implicite, sans modification de `reliableDps`, et sans promotion vers le ranking.

## Patch dry-run brouillon preuve delta

Un patcher de brouillon a ete ajoute pour appliquer un formulaire rempli sur le brouillon SF_32 sans ecrire dans l'intake reel.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/apply-delta-evidence-fill-form.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-filled-draft.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-filled-draft/delta-evidence-filled-draft.json`
- `outputs/diablo4-delta-evidence-filled-draft/external-evidence-candidates.filled-draft.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- claim : `sf32-field-ownership` / `selector:949`
- champs appliques reel : `0 / 7`
- champs manquants reel : `7`
- placeholders restants reel : `7`
- `readyForDraftAudit false`
- `writesRealIntake false`
- `promotionReady false`
- `canModifyReliableDps false`
- test synthetique : `7 / 7` champs appliques, `readyForDraftAudit true`, mais DPS fiable/ranking/promotion toujours `false`
- suite optimiseur : `target-optimizer-suite-ok`, `59` etapes

Validation :

- controles syntaxe Node : OK pour le patcher, le test, la suite, le plan optimiseur et le site
- test patcher : `delta-evidence-filled-draft-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `59` etapes
- plan optimiseur : section `deltaEvidenceFilledDraft` presente
- site : nouveau panneau `Patch brouillon`

Decision :

Le patcher ferme la boucle formulaire -> brouillon auditable, mais uniquement en dry-run. Le cas reel reste bloque tant que le formulaire ne contient aucune source. Un brouillon complet pourra etre audite puis passe en preview, mais ne deviendra pas automatiquement une preuve approuvee ni une promotion de `reliableDps`.

## Audit patch brouillon preuve delta

Un audit dedie du brouillon patch a ete ajoute pour verifier la transition vers une preview intake sans copier dans l'intake reel.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/audit-delta-evidence-filled-draft.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-filled-draft-audit.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-filled-draft-audit/delta-evidence-filled-draft-audit.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- claim : `sf32-field-ownership` / `selector:949`
- audit reel : `readyForPreview false`
- audit intake reel : `auditReadyForIntake false`
- champs manquants reel : `7`
- placeholders restants reel : `7`
- bloqueurs structurels reel : `0`
- bloqueurs revue reel : `1`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- test synthetique : `readyForPreview true`, `reviewBlockers 1`, mais bridge/DPS fiable/ranking/promotion restent `false`
- suite optimiseur : `target-optimizer-suite-ok`, `61` etapes

Validation :

- controles syntaxe Node : OK pour l'audit, le test, la suite, le plan optimiseur et le site
- test audit : `delta-evidence-filled-draft-audit-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `61` etapes
- plan optimiseur : section `deltaEvidenceFilledDraftAudit` presente
- site : nouveau panneau `Audit patch`

Decision :

L'audit patch separe clairement trois etats : incomplet, pret pour preview pending, et approuve. Le cas reel reste incomplet. Meme dans le cas synthetique complet, la sortie n'accepte pas de bridge, ne modifie pas `reliableDps`, et ne declenche aucune promotion.

## Preview intake brouillon patch delta

Une preview intake dediee au brouillon patch a ete ajoutee pour produire un fichier de merge separe quand le patch et son audit sont complets.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/preview-delta-evidence-filled-draft-intake.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-filled-draft-intake-preview.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-filled-draft-intake-preview/delta-evidence-filled-draft-intake-preview.json`
- `outputs/diablo4-delta-evidence-filled-draft-intake-preview/external-evidence-candidates.filled-draft.preview.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- preview reelle : `previewMergeReady false`
- candidats preview reels : `0`
- doublons reels : `0`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- test synthetique : `previewMergeReady true`, `previewCandidates 1`, `reviewer.status pending`, sans champ `draft` ni `templateId`
- suite optimiseur : `target-optimizer-suite-ok`, `63` etapes

Validation :

- controles syntaxe Node : OK pour la preview, le test, la suite, le plan optimiseur et le site
- test preview : `delta-evidence-filled-draft-intake-preview-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `63` etapes
- plan optimiseur : section `deltaEvidenceFilledDraftIntakePreview` presente
- site : nouveau panneau `Preview patch`

Decision :

La preview du brouillon patch est une sortie non destructive. Elle force le candidat ajoute en `pending`, retire les marqueurs de brouillon, et ne modifie jamais l'intake reel. Elle ne vaut pas approbation, n'accepte aucun bridge et ne change pas `reliableDps`.

## Porte copie intake preuve delta

Une porte de copie manuelle a ete ajoutee pour expliciter quand une preview patch peut etre copiee dans l'intake reel.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-evidence-intake-copy-gate.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-intake-copy-gate.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-intake-copy-gate/delta-evidence-intake-copy-gate.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- porte reelle : `readyForManualCopy false`
- checks : `6`
- checks echoues reel : `3`
- checks echoues : `preview-merge-ready`, `candidate-present`, `candidate-pending`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- test synthetique : `readyForManualCopy true`, `reviewer.status pending`, mais bridge/DPS fiable/ranking/promotion restent `false`
- suite optimiseur : `target-optimizer-suite-ok`, `65` etapes

Validation :

- controles syntaxe Node : OK pour la porte, le test, la suite, le plan optimiseur et le site
- test porte : `delta-evidence-intake-copy-gate-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `65` etapes
- plan optimiseur : section `deltaEvidenceIntakeCopyGate` presente
- site : nouveau panneau `Copie intake`

Decision :

La porte de copie rend l'action humaine explicite sans l'executer. Meme quand la preview synthetique est copiable, la sortie reste `pending`, n'ecrit pas dans l'intake reel, n'accepte aucun bridge et ne change pas `reliableDps`.

## Audit post-copie intake preuve delta

Un audit post-copie en dry-run a ete ajoute pour verifier l'etat attendu apres copie manuelle d'un candidat pending dans l'intake.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/audit-delta-evidence-post-copy-intake.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-post-copy-intake.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-post-copy-intake/delta-evidence-post-copy-intake.json`
- `outputs/diablo4-delta-evidence-post-copy-intake/external-evidence-candidates.post-copy-simulated.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- simulation reelle : `copyGateReady false`
- candidats ajoutes reel : `0`
- `readyForManualReview false`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- test synthetique : `copyGateReady true`, `addedCandidates 1`, `targetCandidateStatus pending`, `readyForManualReview true`
- audit synthetique : `accepted 0`, `pending 1`, bloqueur `manual-review-required`
- suite optimiseur : `target-optimizer-suite-ok`, `67` etapes

Validation :

- controles syntaxe Node : OK pour l'audit post-copie, le test, la suite, le plan optimiseur et le site
- test audit post-copie : `delta-evidence-post-copy-intake-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `67` etapes
- plan optimiseur : section `deltaEvidencePostCopyIntake` presente
- site : nouveau panneau `Post-copie`

Decision :

L'audit post-copie prouve que la copie manuelle attendue ne doit produire qu'un candidat `pending`. Le passage a `approved`, l'acceptation bridge et toute modification de `reliableDps` restent separes et bloques.

## Porte revue humaine preuve delta

Une porte de revue humaine a ete ajoutee apres l'audit post-copie pour transformer un candidat `pending` en decision relisible, sans approbation automatique.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-evidence-manual-review-gate.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-manual-review-gate.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-manual-review-gate/delta-evidence-manual-review-gate.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- porte reelle : `readyForReviewerDecision false`
- checks : `6`
- checks echoues reel : `3`
- checks echoues : `post-copy-ready-for-review`, `candidate-pending`, `manual-review-required`
- test synthetique : `readyForReviewerDecision true`, `targetCandidateStatus pending`, bloqueur `manual-review-required`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `69` etapes

Validation :

- controles syntaxe Node : OK pour la porte, le test, la suite, le plan optimiseur et le site
- test porte revue : `delta-evidence-manual-review-gate-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `69` etapes
- plan optimiseur : section `deltaEvidenceManualReviewGate` presente
- site : nouveau panneau `Revue preuve`

Decision :

La porte de revue humaine ouvre uniquement une decision humaine separee quand le candidat est `pending`. Elle n'ecrit pas dans l'intake reel, n'accepte aucun bridge, ne promeut aucun delta et ne modifie jamais `reliableDps`.

## Paquet decision reviewer preuve delta

Un paquet de decision reviewer a ete ajoute apres la porte de revue humaine. Il prepare les champs attendus pour une decision `approved` ou `rejected`, sans appliquer cette decision.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-evidence-review-decision-package.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-review-decision-package.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-review-decision-package/delta-evidence-review-decision-package.json`
- `outputs/diablo4-delta-evidence-review-decision-package/delta-evidence-review-decision-package.md`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- paquet reel : `readyForDecisionInput false`
- checks : `4`
- checks echoues reel : `3`
- checks echoues : `review-gate-ready`, `candidate-still-pending`, `manual-review-blocker-present`
- test synthetique : `readyForDecisionInput true`, `targetCandidateStatus pending`, decisions `approved / rejected`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `71` etapes

Validation :

- controles syntaxe Node : OK pour le paquet, le test, la suite, le plan optimiseur et le site
- test paquet decision : `delta-evidence-review-decision-package-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `71` etapes
- plan optimiseur : section `deltaEvidenceReviewDecisionPackage` presente
- site : nouveau panneau `Decision reviewer`

Decision :

Le paquet prepare une saisie humaine explicite mais ne l'applique jamais. Meme si le cas synthetique est pret pour saisie, la decision reste separee de l'intake reel, du bridge, du ranking et de `reliableDps`.

## Audit decision reviewer preuve delta

Un audit de decision reviewer a ete ajoute apres le paquet de decision. Il verifie un fichier de decision humaine s'il existe et genere un template quand il manque.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/audit-delta-evidence-review-decision.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-review-decision-audit.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-review-decision-audit/delta-evidence-review-decision-audit.json`
- `outputs/diablo4-delta-evidence-review-decision-audit/delta-evidence-review-decision.template.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- audit reel : `readyForPromotionAudit false`
- checks : `5`
- checks echoues reel : `5`
- checks echoues : `decision-package-ready`, `decision-input-present`, `required-fields-complete`, `status-allowed`, `source-rechecked`
- test synthetique approved : `readyForPromotionAudit true`, sans bridge, ranking, `reliableDps` ni promotion
- test synthetique rejected : `decisionRejected true`, `readyForPromotionAudit false`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `73` etapes

Validation :

- controles syntaxe Node : OK pour l'audit, le test, la suite, le plan optimiseur et le site
- test audit decision : `delta-evidence-review-decision-audit-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `73` etapes
- plan optimiseur : section `deltaEvidenceReviewDecisionAudit` presente
- site : nouveau panneau `Audit decision`

Decision :

Une decision `approved` ne modifie rien directement; elle ouvre seulement un audit de promotion separe. Une decision `rejected` documente le refus et garde le delta hors `reliableDps`.

## Audit promotion preuve delta

Un audit de promotion a ete ajoute apres l'audit de decision reviewer. Il exige une decision `approved`, une revue de promotion prete et des gates fiables recalculees avant toute future implementation.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-evidence-promotion-audit.js`
- `work/diablo4-data-exporter/scripts/test-delta-evidence-promotion-audit.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-evidence-promotion-audit/delta-evidence-promotion-audit.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- strict : `163200`
- delta bloque : `48960`
- reliable propose synthetique : `212160`
- audit reel : `readyForPromotionImplementation false`
- checks : `4`
- checks echoues reel : `3`
- checks echoues : `review-decision-approved`, `promotion-review-ready`, `reliable-gates-recomputed-passed`
- gates fiables encore bloquees : `sf32-field`, `sf33-trigger`, `uptime`
- test synthetique : `readyForPromotionImplementation true`, `proposedReliableDps 212160`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `75` etapes

Validation :

- controles syntaxe Node : OK pour l'audit, le test, la suite, le plan optimiseur et le site
- test audit promotion : `delta-evidence-promotion-audit-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `75` etapes
- plan optimiseur : section `deltaEvidencePromotionAudit` presente
- site : nouveau panneau `Audit promotion`

Decision :

L'audit de promotion ne modifie aucun score. Meme lorsqu'un cas synthetique est pret, il ouvre seulement une future implementation separee avec recalcul et tests de regression.

## Dry-run implementation promotion delta

Un dry-run d'implementation a ete ajoute apres l'audit de promotion. Il prepare une preview de patch sur le DPS fiable cible, sans modifier le target dataset.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-promotion-implementation-dry-run.js`
- `work/diablo4-data-exporter/scripts/test-delta-promotion-implementation-dry-run.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-promotion-implementation-dry-run/delta-promotion-implementation-dry-run.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- strict : `163200`
- delta bloque : `48960`
- reliable propose : `212160`
- dry-run reel : `patchPreviewReady false`
- check echoue reel : `promotion-audit-ready`
- patch preview : `entities.*[].dps.reliable 163200 -> 212160`
- test synthetique : `patchPreviewReady true`, `patchBefore 163200`, `patchAfter 212160`
- `writesTargetDataset false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `77` etapes

Validation :

- controles syntaxe Node : OK pour le dry-run, le test, la suite, le plan optimiseur et le site
- test dry-run : `delta-promotion-implementation-dry-run-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `77` etapes
- plan optimiseur : section `deltaPromotionImplementationDryRun` presente
- site : nouveau panneau `Dry-run promotion`

Decision :

Le dry-run produit seulement une preview de patch. Il ne modifie pas `target-dataset.json`, n'active pas le ranking fiable et ne promeut pas le delta.

## Porte application promotion delta

Une porte d'application a ete ajoutee apres le dry-run. Elle verifie si une application manuelle separee peut etre preparee, sans appliquer le patch.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-promotion-application-gate.js`
- `work/diablo4-data-exporter/scripts/test-delta-promotion-application-gate.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-promotion-application-gate/delta-promotion-application-gate.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- reliable propose : `212160`
- porte reelle : `manualApplyAllowed false`
- check echoue reel : `dry-run-ready`
- patch conserve : `163200 -> 212160`
- test synthetique : `manualApplyAllowed true`, `patchBefore 163200`, `patchAfter 212160`
- `writesTargetDataset false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `79` etapes

Validation :

- controles syntaxe Node : OK pour la porte, le test, la suite, le plan optimiseur et le site
- test porte application : `delta-promotion-application-gate-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `79` etapes
- plan optimiseur : section `deltaPromotionApplicationGate` presente
- site : nouveau panneau `Porte application`

Decision :

La porte d'application ne modifie aucun fichier. Meme quand le cas synthetique autorise une application manuelle, l'application doit rester une etape explicite avec sauvegarde, diff et regressions.

## Plan application promotion delta

Un plan d'application explicite a ete ajoute apres la porte. Il decrit les etapes a executer si une application humaine est autorisee, mais ne modifie aucun fichier.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-delta-promotion-apply-plan.js`
- `work/diablo4-data-exporter/scripts/test-delta-promotion-apply-plan.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-delta-promotion-apply-plan/delta-promotion-apply-plan.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- reliable propose : `212160`
- plan reel : `applyPlanReady false`
- check echoue reel : `manual-apply-allowed`
- patch conserve : `163200 -> 212160`
- test synthetique : `applyPlanReady true`, `patchBefore 163200`, `patchAfter 212160`
- etapes documentees : sauvegarde dataset, patch cible, suite de regression, revue de diff
- `writesTargetDataset false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `81` etapes

Validation :

- controles syntaxe Node : OK pour le plan, le test, la suite, le plan optimiseur et le site
- test plan application : `delta-promotion-apply-plan-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `81` etapes
- plan optimiseur : section `deltaPromotionApplyPlan` presente
- site : nouveau panneau `Plan application`

Decision :

Le plan d'application documente la procedure future, mais ne l'execute pas. Aucune mutation de `target-dataset.json`, aucun bridge et aucune promotion reliableDps ne sont autorises sans confirmation humaine finale et regression complete.

## Paquet soumission preuve externe

Un paquet de soumission a ete ajoute pour isoler le prochain geste utile : remplir une preuve externe source-backed pour `delta-proof-sf32-owner`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-external-evidence-submission-pack.js`
- `work/diablo4-data-exporter/scripts/test-external-evidence-submission-pack.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-external-evidence-submission-pack/external-evidence-submission-pack.json`
- `outputs/diablo4-external-evidence-submission-pack/external-evidence-submission-pack.md`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- prochaine tache : `delta-proof-sf32-owner`
- claim : `sf32-field-ownership`
- champ : `selector:949`
- brouillon candidat : `draft-delta-proof-sf32-owner`
- reviewer : `pending`
- must contain : `1663210`, `selector:949`, `SF_32`
- `writesIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `83` etapes

Validation :

- controles syntaxe Node : OK pour le paquet, le test, la suite, le plan optimiseur et le site
- test paquet soumission : `external-evidence-submission-pack-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `83` etapes
- plan optimiseur : section `externalEvidenceSubmissionPack` presente
- site : nouveau panneau `Soumission preuve`

Decision :

Le paquet produit un brouillon a remplir, pas une preuve acceptee. Il ne modifie pas `inputs/external-evidence-candidates.json`, n'ouvre aucun bridge et ne change aucun score fiable.

## Gate soumission preuve externe

Un gate de soumission a ete ajoute apres le paquet de preuve. Il valide si le brouillon est assez complet pour etre copie manuellement en `pending` dans l'intake, sans effectuer cette copie.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-external-evidence-submission-gate.js`
- `work/diablo4-data-exporter/scripts/test-external-evidence-submission-gate.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-external-evidence-submission-gate/external-evidence-submission-gate.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- gate reel : `readyForIntakeCopy false`
- check echoue reel : `no-placeholders`
- test synthetique : `readyForIntakeCopy true`, reviewer `pending`
- `writesIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `85` etapes

Validation :

- controles syntaxe Node : OK pour le gate, le test, la suite, le plan optimiseur et le site
- test gate soumission : `external-evidence-submission-gate-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `85` etapes
- plan optimiseur : section `externalEvidenceSubmissionGate` presente
- site : nouveau panneau `Gate soumission`

Decision :

Le gate bloque le brouillon reel tant que les placeholders restent presents. Meme pret, il autorise seulement une copie manuelle en `pending`; il ne modifie pas l'intake, n'ouvre aucun bridge et ne change aucun score fiable.

## Preview intake soumission preuve externe

Une preview d'intake a ete ajoutee apres le gate de soumission. Elle montre le fichier intake qui resulterait d'une copie manuelle, sans modifier `inputs/external-evidence-candidates.json`.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/preview-external-evidence-submission-intake.js`
- `work/diablo4-data-exporter/scripts/test-external-evidence-submission-intake-preview.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-external-evidence-submission-intake-preview/external-evidence-submission-intake-preview.json`
- `outputs/diablo4-external-evidence-submission-intake-preview/external-evidence-candidates.submission-preview.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- preview reelle : `previewMergeReady false`
- candidats ajoutes reel : `0`
- test synthetique : `previewMergeReady true`, `addedCandidates 1`, reviewer `pending`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `87` etapes

Validation :

- controles syntaxe Node : OK pour la preview, le test, la suite, le plan optimiseur et le site
- test preview intake : `external-evidence-submission-intake-preview-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `87` etapes
- plan optimiseur : section `externalEvidenceSubmissionIntakePreview` presente
- site : nouveau panneau `Preview intake`

Decision :

La preview reste bloquee tant que le gate de soumission ne passe pas. Meme quand le cas synthetique ajoute un candidat, il reste `pending`, sans bridge, sans promotion et sans ecriture dans l'intake reel.

## Audit post-copy intake soumission preuve externe

Un audit post-copie a ete ajoute pour le flux de soumission externe. Il simule l'etat de l'intake apres copie manuelle, puis relance l'audit intake sur le fichier simule, sans modifier l'intake reel.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/audit-external-evidence-submission-post-copy-intake.js`
- `work/diablo4-data-exporter/scripts/test-external-evidence-submission-post-copy-intake.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-external-evidence-submission-post-copy-intake/external-evidence-submission-post-copy-intake.json`
- `outputs/diablo4-external-evidence-submission-post-copy-intake/external-evidence-candidates.submission-post-copy-simulated.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- audit reel : `readyForManualReview false`
- candidats ajoutes reel : `0`
- test synthetique : `readyForManualReview true`, `targetCandidateStatus pending`
- blocker attendu : `manual-review-required`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `89` etapes

Validation :

- controles syntaxe Node : OK pour l'audit, le test, la suite, le plan optimiseur et le site
- test post-copy intake : `external-evidence-submission-post-copy-intake-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `89` etapes
- plan optimiseur : section `externalEvidenceSubmissionPostCopyIntake` presente
- site : nouveau panneau `Post-copy intake`

Decision :

La simulation post-copie garde le candidat en `pending` et exige `manual-review-required`. Elle ne modifie pas l'intake reel, n'ouvre aucun bridge et ne change aucun score fiable.

## Gate revue soumission preuve externe

Une porte de revue manuelle a ete ajoutee apres l'audit post-copie. Elle indique si le candidat de preuve externe peut etre presente a une decision humaine, sans accepter, copier, bridger ni promouvoir automatiquement.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-external-evidence-submission-manual-review-gate.js`
- `work/diablo4-data-exporter/scripts/test-external-evidence-submission-manual-review-gate.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-external-evidence-submission-manual-review-gate/external-evidence-submission-manual-review-gate.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- gate reel : `readyForReviewerDecision false`
- checks echoues : `post-copy-ready-for-review`, `candidate-pending`, `manual-review-required`
- test synthetique : `readyForReviewerDecision true`, candidat `pending`, decisions `approved / rejected`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `91` etapes

Validation :

- controles syntaxe Node : OK pour la porte de revue, le test, la suite, le plan optimiseur et le site
- test revue soumission : `external-evidence-submission-manual-review-gate-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `91` etapes
- plan optimiseur : section `externalEvidenceSubmissionManualReviewGate` presente
- site : nouveau panneau `Revue soumission`

Decision :

La decision humaine est separee de la preparation technique. Le cas reel reste bloque, le candidat ne devient pas `approved` automatiquement, et aucune valeur conditionnelle ne peut entrer dans `reliableDps`.

## Decision humaine soumission preuve externe

Le flux de soumission externe dispose maintenant d'un paquet de decision et d'un audit de decision. Le paquet prepare les champs humains requis; l'audit lit un fichier de decision optionnel et distingue `approved` de `rejected`, sans ecriture automatique ni promotion.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-external-evidence-submission-review-decision-package.js`
- `work/diablo4-data-exporter/scripts/test-external-evidence-submission-review-decision-package.js`
- `work/diablo4-data-exporter/scripts/audit-external-evidence-submission-review-decision.js`
- `work/diablo4-data-exporter/scripts/test-external-evidence-submission-review-decision-audit.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-external-evidence-submission-review-decision-package/external-evidence-submission-review-decision-package.json`
- `outputs/diablo4-external-evidence-submission-review-decision-package/external-evidence-submission-review-decision-package.md`
- `outputs/diablo4-external-evidence-submission-review-decision-audit/external-evidence-submission-review-decision-audit.json`
- `outputs/diablo4-external-evidence-submission-review-decision-audit/external-evidence-submission-review-decision.template.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- paquet reel : `readyForDecisionInput false`
- checks paquet echoues : `review-gate-ready`, `candidate-still-pending`, `manual-review-blocker-present`
- audit reel : `readyForPromotionAudit false`, decision absente
- checks audit echoues : `decision-package-ready`, `decision-input-present`, `required-fields-complete`, `status-allowed`, `source-rechecked`
- test synthetique `approved` : ouvre seulement `readyForPromotionAudit true`
- test synthetique `rejected` : `decisionRejected true`, aucune suite promotion
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `95` etapes

Validation :

- controles syntaxe Node : OK pour les quatre nouveaux scripts, la suite, le plan optimiseur et le site
- test paquet decision : `external-evidence-submission-review-decision-package-test-ok`
- test audit decision : `external-evidence-submission-review-decision-audit-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `95` etapes
- plan optimiseur : sections `externalEvidenceSubmissionReviewDecisionPackage` et `externalEvidenceSubmissionReviewDecisionAudit` presentes
- site : nouveaux panneaux `Decision soumission` et `Audit decision soumission`

Decision :

Une decision `approved` ne modifie pas `reliableDps`. Elle ouvre seulement un audit de promotion separe. Une decision `rejected` documente le rejet et maintient le delta en what-if bloque.

## Audit promotion soumission preuve externe

Un audit de promotion dedie au flux de soumission externe a ete ajoute. Il consomme l'audit de decision externe, les gates reliable DPS et la revue de promotion, puis decide seulement si une implementation separee peut etre preparee.

Fichiers modifies ou ajoutes :

- `work/diablo4-data-exporter/scripts/build-external-evidence-submission-promotion-audit.js`
- `work/diablo4-data-exporter/scripts/test-external-evidence-submission-promotion-audit.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-suite.js`
- `work/diablo4-data-exporter/scripts/build-target-optimizer-plan.js`
- `site/app.js`
- `outputs/diablo4-external-evidence-submission-promotion-audit/external-evidence-submission-promotion-audit.json`
- `outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json`
- `outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json`
- `PROJECT_STATUS.md`
- `outputs/rapport-outil-exportateur-diablo4.md`

Resultat :

- cible : `asset 1663210`, `skill:1663210`
- candidat : `draft-delta-proof-sf32-owner`
- strict DPS : `163200`
- delta bloque : `48960`
- proposed reliable DPS synthetique : `212160`
- audit reel : `readyForPromotionImplementation false`
- checks echoues : `external-review-decision-approved`, `promotion-review-ready`, `reliable-gates-recomputed-passed`
- gates fiables encore bloquees : `sf32-field`, `sf33-trigger`, `uptime`
- test synthetique : `readyForPromotionImplementation true`
- `writesRealIntake false`
- `acceptedForBridge false`
- `promotionReady false`
- `canModifyReliableDps false`
- suite optimiseur : `target-optimizer-suite-ok`, `97` etapes

Validation :

- controles syntaxe Node : OK pour le nouvel audit, le test, la suite, le plan optimiseur et le site
- test audit promotion externe : `external-evidence-submission-promotion-audit-test-ok`
- suite optimiseur : `target-optimizer-suite-ok`, `97` etapes
- plan optimiseur : section `externalEvidenceSubmissionPromotionAudit` presente
- site : nouveau panneau `Audit promotion externe`

Decision :

L'audit de promotion externe ne modifie aucun score. Meme dans le cas synthetique pret, il ouvre seulement une future implementation explicite avec recalcul et tests de regression.

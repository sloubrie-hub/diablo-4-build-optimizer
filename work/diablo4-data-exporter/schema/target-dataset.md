# Diablo IV Optimizer Target Dataset

Ce document decrit le dataset cible que l'exporteur devra produire avant que le site puisse devenir un vrai optimiseur.

Le principe central est simple : aucune valeur ne doit entrer dans le moteur sans preuve. Chaque entite et chaque modificateur important doit donc porter un bloc `evidence`.

## Racine

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-06-30T00:00:00.000Z",
  "source": {},
  "entities": {},
  "relations": []
}
```

`source` identifie le jeu, le build client, la saison si connue, et la version de l'exporteur.

`entities` contient les donnees exploitables par l'optimiseur.

`relations` relie les entites entre elles : un aspect modifie une competence, un objet porte un affixe, un glyphe scale un node, etc.

## Entites obligatoires

Le dataset cible contient toujours ces collections, meme vides :

- `skills`
- `items`
- `affixes`
- `aspects`
- `paragonNodes`
- `glyphs`
- `runes`
- `formulas`
- `conditions`

## Evidence

Chaque evidence doit au minimum indiquer :

- `source` : origine logique de la preuve
- `confidence` : `low`, `medium`, `medium-high`, `high`, ou `confirmed`

Champs utiles :

- `assetId`
- `file`
- `offset`
- `field`
- `notes`

Un candidat comme `assetId 1663210` doit rester en `medium-high` ou `high` tant que le champ exact, le trigger et l'uptime ne sont pas prouves.

## Modifiers

Les effets numeriques sont normalises en `modifiers`.

Champs importants :

- `stat` : statistique affectee, par exemple `damage`, `attackSpeed`, `critChance`
- `operation` : `add`, `multiply`, `override`, `cap`, `proc`, `resource`, ou `unknown`
- `value` : nombre, expression ou `null`
- `formulaId` : lien vers une formule si la valeur est calculee
- `conditionIds` : conditions requises
- `uptime` : entre `0` et `1` si connu
- `bucket` : famille additive/multiplicative future

## Conditions

Les conditions representent les etats qui rendent un bonus actif :

- toggle utilisateur
- uptime estime
- seuil
- etat ennemi
- etat joueur
- etat de competence
- proc

Le moteur DPS ne doit appliquer automatiquement une condition que si son etat est prouve ou choisi par l'utilisateur.

## Relations

Les relations permettent de construire le build sans deviner :

- `grants`
- `modifies`
- `requires`
- `scales`
- `triggers`
- `belongsTo`
- `conflictsWith`

Exemples :

- un objet `grants` un aspect
- un aspect `modifies` une competence
- une formule `requires` une condition
- un glyphe `scales` des nodes parangon

## Regle produit

Le site peut afficher des donnees candidates, mais le moteur DPS fiable doit distinguer :

- valeur confirmee
- valeur candidate
- valeur bloquee
- valeur manquante

Cette separation doit rester visible dans le JSON, le moteur et l'interface.

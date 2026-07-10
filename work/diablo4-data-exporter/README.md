# Diablo IV Local Install Exporter

This is the first, safe extraction layer for the Diablo IV build optimizer project.

It reads local Battle.net/CASC metadata from an installed Diablo IV folder and exports:

- detected game version and build metadata
- local file inventory
- extension counts and total sizes
- CDN/build configuration files
- archive and patch archive identifiers

It does not decrypt, bypass protections, unpack protected game archives, or parse gameplay tables yet.

## Commands

```powershell
node work/diablo4-data-exporter/d4export.js scan `
  --game-path "C:\Program Files (x86)\Diablo IV" `
  --out outputs/diablo4-local-export
```

```powershell
node work/diablo4-data-exporter/d4export.js inspect-index `
  --file "C:\Program Files (x86)\Diablo IV\Data\data\0000000209.idx" `
  --out outputs/diablo4-index-analysis
```

```powershell
node work/diablo4-data-exporter/d4export.js probe-payloads `
  --file "C:\Program Files (x86)\Diablo IV\Data\data\0000000209.idx" `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --out outputs/diablo4-payload-probes
```

```powershell
node work/diablo4-data-exporter/d4export.js scan-magic `
  --file "C:\Program Files (x86)\Diablo IV\Data\data\data.000" `
  --magic BLTE `
  --out outputs/diablo4-blte
```

```powershell
node work/diablo4-data-exporter/d4export.js decode-blte `
  --file "C:\Program Files (x86)\Diablo IV\Data\data\data.000" `
  --offset 510 `
  --out outputs/diablo4-blte
```

```powershell
node work/diablo4-data-exporter/d4export.js catalog-blte `
  --file "C:\Program Files (x86)\Diablo IV\Data\data\data.000" `
  --out outputs/diablo4-blte-catalogs `
  --max-hits 80
```

```powershell
node work/diablo4-data-exporter/d4export.js catalog-blte-dir `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --out outputs/diablo4-blte-wide-catalog `
  --file-limit 20 `
  --max-hits 30 `
  --max-decode-mb 32
```

```powershell
node work/diablo4-data-exporter/d4export.js analyze-deadbeef-dir `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --out outputs/diablo4-deadbeef-analysis-v2 `
  --file-limit 20 `
  --max-hits 100 `
  --max-decode-mb 8
```

```powershell
node work/diablo4-data-exporter/d4export.js search-deadbeef-strings `
  --data-dir "C:\Program Files (x86)\Diablo IV\Data\data" `
  --out outputs/diablo4-gameplay-string-search `
  --file-limit 64 `
  --max-hits 250 `
  --max-decode-mb 8 `
  --terms "Table(,PowerTag,Damage,Skill,Affix,Paragon,Legendary,Unique,Barbarian,Sorcerer,Rogue,Druid,Necromancer,Paladin,Spirit,Rune,Glyph,Attacks_Per_Second"
```

The old entrypoint still works:

```powershell
node work/diablo4-data-exporter/export-local-install.js `
  --game-path "C:\Program Files (x86)\Diablo IV" `
  --out outputs/diablo4-local-export
```

## Current Output

- `manifest.json`: high-level summary
- `config-files.json`: parsed Battle.net configuration files
- `archives.json`: CDN archive keys and index sizes
- `file-inventory.json`: local file inventory
- `index-analysis.json`: conservative analysis of local `.idx` and CDN `.index` samples

## Current Capabilities

- Detects the active Diablo IV build using `.build.info`.
- Reads local build/CDN config files.
- Lists local data files, CDN indices and archive metadata.
- Analyzes `.idx` files with multiple candidate offsets.
- Analyzes `.index` files with multiple candidate record sizes.
- Finds `BLTE` payloads inside local `data.xxx` blocks.
- Decodes unencrypted BLTE chunks using modes `N` and `Z`.
- Parses the 30-byte local header that precedes each BLTE payload.
- Validates that `spanBytesLE = 30 + compressed BLTE size`.
- Catalogs BLTE payloads across several `data.xxx` files with decoded type summaries.
- Analyzes `EF BE AD DE` binary payload layout signatures.
- Searches decoded `EF BE AD DE` strings for gameplay terms and formulas.

The index analyzer intentionally reports hypotheses rather than extracting files blindly. The next milestone is validating which candidate layout maps correctly to the local `data.xxx` blocks.

BLTE decoding is now validated on `data.000` at offset `510`. The decoded payload is a binary Diablo/Blizzard structure, not a direct JSON/text gameplay table.

The local 30-byte pre-header is now validated on 513 cataloged BLTE payloads with zero span mismatches.

Gameplay string search has found formula-bearing payloads with strings such as `Attacks_Per_Second_Total`, `Table(34,sLevel)`, `PowerTag...`, `Affix_Value_...`, and class tags including `Necromancer`, `Spiritborn`, and `Paladin`.

## Next Technical Step

To extract skills, items, paragon, affixes and formulas from the live client, the next layer must parse Blizzard CASC/VFS data and then decode Diablo IV-specific data formats.

Recommended order:

1. Read CASC build/config metadata.
2. Parse formula-bearing `deadbeef-binary` payloads into structured records.
3. Map `assetId` values to names/classes/skills through nearby string tables or VFS metadata.
4. Improve decoded payload classification: texture, audio, video, VFS, SNO, localization, table.
5. Resolve encoding keys to archive offsets.
6. Extract only non-protected, readable payloads.
7. Identify file names/types from VFS manifests where available.
8. Build parsers for Diablo IV binary gameplay tables.
9. Normalize extracted entities into the optimizer schema.

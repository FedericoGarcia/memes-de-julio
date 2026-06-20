---
description: Scan and triage meme images before adding them to the site. Analyzes images, detects duplicates against existing catalogs, renames with descriptive filenames, and outputs a summary with suggested catalog and date range. Does not modify JSON catalogs — use /add-meme to load triaged images.
argument-hint: "[path-to-images]"
user-invocable: true
---

# Scan Memes

Analyze and triage meme images so you can prioritize which ones to add to the site.

## Usage

```
/scan-memes [path]
```

- Without arguments: scans `src/images/inbox/`
- With a path: scans that file or directory

## Process

### Step 1 — Discover images

List all image files in the target path (jpg, jpeg, png, webp, gif). Skip non-image files silently.

If the directory is empty or has no images, tell the user and stop.

### Step 2 — Analyze each image

Read each image file. For each one, identify:
- The text overlay (exact wording)
- The visual content (what's Julio doing, what's the scene)
- Whether it references a specific day of July
- Whether it's a countdown/anticipation meme
- Whether it's a generic Julio Iglesias meme with no date dependency
- Whether it's a special date meme (Christmas, New Year, etc.)

### Step 3 — Detect duplicates

For each scanned image, check if a visually similar meme already exists in the site. Compare against all images referenced in the four JSON catalogs (`src/catalogs/memes.json`, `src/catalogs/countdown.json`, `src/catalogs/generic.json`, `src/catalogs/specials.json`).

To compare, read both the inbox image and the candidate existing image, then judge visual similarity (same base photo, same text overlay, same joke — even if cropped, resized, or re-encoded differently).

For each duplicate found:
1. Compare image dimensions and file size to determine which has better quality.
2. If one is clearly better (higher resolution, less compression artifacts), recommend keeping that one.
3. If quality is similar or ambiguous, ask the user which to keep before proceeding.

Mark duplicates in the summary table (Step 6) with a `DUPLICATE` flag and the existing file it matches. If the inbox version is better quality, note `UPGRADE` instead — the user can then use `/add-meme` to replace the existing image.

Also check for duplicates **within the inbox itself** — if two inbox images are the same meme, flag both and recommend keeping only the better quality one.

### Step 4 — Note observations

For each image, assess how well it fits the current catalog schemas. Flag anything that doesn't map cleanly:

- **Ambiguous catalog**: could belong to more than one catalog (e.g., a July-specific meme that also works year-round as a generic joke)
- **Schema gap**: the meme needs fields that don't exist in the target catalog (e.g., a meme.json entry that would benefit from a `caption` field, or a countdown that depends on a specific event date rather than days-until-July)
- **Partial fit**: the date range is approximate or the meme works for a period the schema can't express well (e.g., "last weekend of July" — depends on the year)
- **Multi-catalog**: the meme genuinely belongs in two catalogs (e.g., a Christmas + July crossover that fits both specials and memes)
- **No fit**: the meme doesn't fit any catalog cleanly

Record the observation for the summary table. If no issues, leave blank.

### Step 5 — Generate descriptive filename

For each non-duplicate image, generate a kebab-case filename (3-5 words) based on the meme's content or text overlay. Examples:
- An image with "1 de Julio" text → `primero-de-julio.webp`
- An image with Julio as a chef → `julio-cocinero.webp`
- An image about waiting for July → `falta-poco-julio.webp`

### Step 6 — Rename files

Rename each non-duplicate image in place to its new descriptive filename. Keep the original extension (don't convert to WebP yet — that's `/add-meme`'s job).

If a filename collision would occur, append a number suffix (`-2`, `-3`).

Don't rename images flagged as duplicates — leave them with their original names so the user can review and delete them.

### Step 7 — Output summary

Present a table with all scanned images:

```
| # | File | Status | Catalog | Date range | Observations |
|---|------|--------|---------|------------|--------------|
| 1 | primero-de-julio.png | NEW | memes | from: 1, to: 1 | — |
| 2 | falta-poco-julio.jpg | NEW | countdown | minDays: 1, maxDays: 30 | — |
| 3 | julio-navidad.png | NEW | specials + memes | month: 12, from: 25 | Multi-catalog: Christmas crossover, also works as July 25 meme |
| 4 | ultimo-finde-julio.jpg | NEW | memes | from: 25, to: 31 | Partial fit: "last weekend" depends on the year, using approximate range |
| 5 | IMG_2847.jpg | DUPLICATE of julio-cocinero.webp | — | — | — |
| 6 | IMG_3011.png | UPGRADE over julio-viejo.webp | generic | — | — |
```

Status values:
- **NEW**: no duplicate found, ready to `/add-meme`
- **DUPLICATE of `<existing-file>`**: same meme exists in the site, inbox version is same or worse quality — suggest deleting
- **UPGRADE over `<existing-file>`**: same meme exists but inbox version is better quality — suggest replacing via `/add-meme`
- **DUPLICATE (inbox)**: another image in the same inbox batch is the same meme — keep the better one

### Step 8 — Schema suggestions

After the summary table, if any observations point to recurring schema limitations, propose concrete changes to the catalog JSON schemas. Examples:

- "5 memes would benefit from a `caption` field in memes.json (like specials.json already has)"
- "3 memes reference weekday-dependent dates — consider extending the `weekday` field to support arrays for multiple valid weekdays"
- "2 memes work in both specials and memes catalogs — consider a `crossRef` field to link entries across catalogs"

Present each suggestion with: the problem, which memes triggered it, and the proposed schema change. Don't apply changes — let the user decide.

### Step 9 — Next steps

Tell the user:
- For **NEW** images: run `/add-meme <path>` to load them into the site
- For **UPGRADE** images: run `/add-meme <path>` to replace the existing lower-quality version
- For **DUPLICATE** images: delete them, or ask if unsure
- For images with **observations**: review the notes and decide how to handle edge cases before loading

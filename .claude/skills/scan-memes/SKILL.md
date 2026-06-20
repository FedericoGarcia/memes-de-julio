---
description: Scan and triage meme images before adding them to the site. Analyzes images from the inbox (or a given path), renames them with descriptive filenames, and outputs a summary with suggested catalog and date range for each. Does not modify JSON catalogs — use /add-meme to load triaged images.
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

### Step 3 — Generate descriptive filename

For each image, generate a kebab-case filename (3-5 words) based on the meme's content or text overlay. Examples:
- An image with "1 de Julio" text → `primero-de-julio.webp`
- An image with Julio as a chef → `julio-cocinero.webp`
- An image about waiting for July → `falta-poco-julio.webp`

### Step 4 — Rename files

Rename each image in place to its new descriptive filename. Keep the original extension (don't convert to WebP yet — that's `/add-meme`'s job).

If a filename collision would occur, append a number suffix (`-2`, `-3`).

### Step 5 — Output summary

Present a table with all scanned images:

```
| # | File | Catalog | Date range | Description |
|---|------|---------|------------|-------------|
| 1 | primero-de-julio.png | memes | from: 1, to: 1 | Julio Iglesias celebrating the first day of July |
| 2 | falta-poco-julio.jpg | countdown | minDays: 1, maxDays: 30 | Julio anxiously waiting for July to arrive |
| 3 | julio-cocinero.webp | generic | — | Julio as a chef, pun on "julio" |
```

For each entry include:
- **File**: the new filename after renaming
- **Catalog**: suggested catalog (`memes`, `countdown`, `generic`, `specials`)
- **Date range**: suggested date fields for that catalog, or `—` for generic
- **Description**: one-line description of the meme content

### Step 6 — Next steps

Tell the user they can now run `/add-meme <path>` on any image they want to load into the site.

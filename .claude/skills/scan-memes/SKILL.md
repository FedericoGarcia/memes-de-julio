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

For each scanned image, check if a visually similar meme already exists in the site. Compare against all images referenced in the four JSON catalogs (`src/memes.json`, `src/countdown.json`, `src/generic.json`, `src/specials.json`).

To compare, read both the inbox image and the candidate existing image, then judge visual similarity (same base photo, same text overlay, same joke — even if cropped, resized, or re-encoded differently).

For each duplicate found:
1. Compare image dimensions and file size to determine which has better quality.
2. If one is clearly better (higher resolution, less compression artifacts), recommend keeping that one.
3. If quality is similar or ambiguous, ask the user which to keep before proceeding.

Mark duplicates in the summary table (Step 6) with a `DUPLICATE` flag and the existing file it matches. If the inbox version is better quality, note `UPGRADE` instead — the user can then use `/add-meme` to replace the existing image.

Also check for duplicates **within the inbox itself** — if two inbox images are the same meme, flag both and recommend keeping only the better quality one.

### Step 4 — Generate descriptive filename

For each non-duplicate image, generate a kebab-case filename (3-5 words) based on the meme's content or text overlay. Examples:
- An image with "1 de Julio" text → `primero-de-julio.webp`
- An image with Julio as a chef → `julio-cocinero.webp`
- An image about waiting for July → `falta-poco-julio.webp`

### Step 5 — Rename files

Rename each non-duplicate image in place to its new descriptive filename. Keep the original extension (don't convert to WebP yet — that's `/add-meme`'s job).

If a filename collision would occur, append a number suffix (`-2`, `-3`).

Don't rename images flagged as duplicates — leave them with their original names so the user can review and delete them.

### Step 6 — Output summary

Present a table with all scanned images:

```
| # | File | Status | Catalog | Date range | Description |
|---|------|--------|---------|------------|-------------|
| 1 | primero-de-julio.png | NEW | memes | from: 1, to: 1 | Julio celebrating the first day |
| 2 | falta-poco-julio.jpg | NEW | countdown | minDays: 1, maxDays: 30 | Julio anxiously waiting |
| 3 | IMG_2847.jpg | DUPLICATE of julio-cocinero.webp | — | — | Same meme, lower quality |
| 4 | IMG_3011.png | UPGRADE over julio-viejo.webp | generic | — | Same meme, higher resolution |
```

Status values:
- **NEW**: no duplicate found, ready to `/add-meme`
- **DUPLICATE of `<existing-file>`**: same meme exists in the site, inbox version is same or worse quality — suggest deleting
- **UPGRADE over `<existing-file>`**: same meme exists but inbox version is better quality — suggest replacing via `/add-meme`
- **DUPLICATE (inbox)**: another image in the same inbox batch is the same meme — keep the better one

### Step 7 — Next steps

Tell the user:
- For **NEW** images: run `/add-meme <path>` to load them into the site
- For **UPGRADE** images: run `/add-meme <path>` to replace the existing lower-quality version
- For **DUPLICATE** images: delete them, or ask if unsure

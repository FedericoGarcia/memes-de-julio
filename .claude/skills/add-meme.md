# Add Meme

Categorize and add a new meme image to the site.

## Usage

```
/add-meme <image-path>
```

The image can be a file path or a pasted image. The skill will:
1. View the image to understand its content
2. Determine the correct catalog and date range
3. Convert to WebP if needed
4. Move to the correct directory with a descriptive filename
5. Add the entry to the appropriate JSON catalog

## Process

### Step 1 — View and analyze

Read the image file. Identify:
- The text overlay (exact wording)
- Whether it references a specific day of July (e.g., "El 7 de Julio", "15 de Julio")
- Whether it's a countdown/anticipation meme (e.g., "Ya casi llega Julio", "Falta poco")
- Whether it's a generic Julio Iglesias meme with no date dependency
- Whether it's a special date meme (Christmas, New Year, etc.)

### Step 2 — Determine catalog

| Catalog | File | Criteria |
|---------|------|----------|
| **memes** | `src/memes.json` | References a specific day or range within July. Has `from`/`to` fields (1-31). Optional `weekday` field. |
| **countdown** | `src/countdown.json` | Pre-July anticipation. Has `minDays`/`maxDays` fields. |
| **generic** | `src/generic.json` | No date dependency. Works any time of year. No date fields. |
| **specials** | `src/specials.json` | Tied to a non-July date (Christmas, birthdays). Has `month`/`from`/`to` fields. |

Decision rules:
- Text says "X de Julio" where X is a number → **memes**, `from: X, to: X`
- Text references a day range ("recta final", "mitad de julio") → **memes** with appropriate `from`/`to`
- Text about waiting for July, julio approaching → **countdown** with `minDays`/`maxDays`
- Text is a pun, generic joke, or works year-round → **generic**
- Text references a non-July holiday → **specials**
- When ambiguous, prefer **generic** over **memes** with `from: 1, to: 31`

### Step 3 — Generate metadata

- **id**: kebab-case, descriptive, 3-5 words. Based on the meme text or visual joke. Must be unique across all catalogs.
- **file**: for memes/generic use `<id>.webp`, for countdown use `countdown/<id>.webp`, for specials use `specials/<id>.webp`.
- **alt**: Describe the image for accessibility and SEO. Format: "Julio Iglesias [visual description]. Texto: [exact text overlay]"

### Step 4 — Convert and move

```bash
# Convert if not already WebP
cwebp -q 80 "<source>" -o "src/images/<target>.webp" -quiet

# Or if already WebP, just copy
cp "<source>" "src/images/<target>.webp"
```

### Step 5 — Update JSON

Add the entry to the appropriate JSON file. Validate with:

```bash
python3 -c "
import json
ids = []
for f in ['src/memes.json','src/countdown.json','src/specials.json','src/generic.json']:
    data = json.load(open(f))
    for item in data:
        ids.append((item['id'], f))
seen = {}
for id, f in ids:
    if id in seen:
        print(f'DUPLICATE: {id} in {seen[id]} AND {f}')
    seen[id] = f
print(f'Total: {len(ids)} entries, no duplicates' if len(ids) == len(seen) else '')
"
```

### Step 6 — Confirm

Show the user:
- The image (read it back)
- The catalog chosen and why
- The full JSON entry that was added
- The file path where the image was saved

## Schema reference

### memes.json
```json
{ "id": "slug", "file": "image.webp", "alt": "...", "from": 1, "to": 31 }
{ "id": "slug", "file": "image.webp", "alt": "...", "from": 1, "to": 1, "weekday": 2 }
```

### countdown.json
```json
{ "id": "slug", "file": "countdown/image.webp", "alt": "...", "minDays": 1, "maxDays": 90 }
```

### generic.json
```json
{ "id": "slug", "file": "image.webp", "alt": "..." }
```

### specials.json
```json
{ "id": "slug", "file": "specials/image.webp", "alt": "...", "caption": "...", "month": 12, "from": 24, "to": 25 }
```

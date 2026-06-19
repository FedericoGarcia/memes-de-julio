# Memes de Julio

Los mejores memes de Julio Iglesias, uno nuevo cada día de julio. [memesdejulio.com.ar](https://memesdejulio.com.ar)

## Adding memes

1. Add the image to `images/` (prefer WebP or PNG)
2. Add an entry to `memes.json`:
   ```json
   {
     "id": "descriptive-slug",
     "file": "descriptive-slug.webp",
     "alt": "Descriptive alt text for SEO and accessibility",
     "from": 1,
     "to": 31
   }
   ```
   - `from`/`to`: inclusive day range (1-31) when the meme can appear
   - A meme for a single day: `"from": 5, "to": 5`
   - A meme for all of July: `"from": 1, "to": 31`
3. Push to `main` — GitHub Pages deploys automatically

## Query parameters

| Param | Example | Description |
|-------|---------|-------------|
| `date` | `?date=2026-07-15` | Simulate a specific date |
| `id` | `?id=julio-entero` | Show a specific meme by ID |

## States

- **January 1 – June 30**: countdown to July
- **July 1 – 31**: random meme from those available for the current day
- **August 1 – December 31**: "see you next year"

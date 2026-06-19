# Memes de Julio

Un meme nuevo cada día de julio. [memesdejulio.com.ar](https://memesdejulio.com.ar)

## Adding memes

1. Add the image to `images/day-DD/` (use WebP for best performance)
2. Add an entry to `memes.json` under the corresponding day
3. Push to `main` — GitHub Pages deploys automatically

Each day can have multiple memes. One is picked at random on each page load.

## Query parameters

| Param | Example | Description |
|-------|---------|-------------|
| `date` | `?date=2026-07-15` | Simulate a specific date |
| `id` | `?id=15-01` | Show a specific meme by ID |

## States

- **January 1 – June 30**: countdown to July
- **July 1 – 31**: daily meme
- **August 1 – December 31**: "see you next year"

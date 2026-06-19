# Memes de Julio

Los mejores memes de Julio Iglesias, uno nuevo cada día de julio. [memesdejulio.com.ar](https://memesdejulio.com.ar)

## Project structure

```
src/
├── index.html              # Main page
├── 404.html                # Custom 404 page
├── script.js               # All client-side logic
├── style.css               # Styles (dark theme, responsive)
├── memes.json              # July memes catalog
├── countdown.json          # Countdown images catalog
├── specials.json           # Special date images (easter eggs)
├── robots.txt              # SEO + AI crawler directives
├── sitemap.xml             # Sitemap for search engines
├── llms.txt                # LLM discoverability file
├── favicon.svg             # Favicon
├── og-image.png            # Open Graph image for social sharing
├── site.webmanifest        # PWA manifest
├── images/                 # July memes
│   ├── inbox/              # (gitignored) staging area for new memes
│   └── countdown/          # Countdown images
│       └── ...
└── ...
CNAME                       # Custom domain for GitHub Pages
.github/workflows/deploy.yml # CI: minify JS/CSS/JSON and deploy
```

## Catalogs

### memes.json — July memes

```json
{
  "id": "descriptive-slug",
  "file": "image.jpg",
  "alt": "Descriptive alt text for SEO and accessibility",
  "from": 1,
  "to": 31,
  "weekday": 2
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Unique slug, used in `?id=` links |
| `file` | yes | Image path relative to `src/images/` |
| `alt` | yes | Alt text describing the meme content |
| `from` | yes | First day of July this meme can appear (1-31) |
| `to` | yes | Last day of July this meme can appear (1-31) |
| `weekday` | no | Only show when day `from` falls on this weekday (0=Sun, 6=Sat). Easter egg for year-dependent memes |

### countdown.json — Countdown images

```json
{
  "id": "descriptive-slug",
  "file": "countdown/image.jpg",
  "alt": "Descriptive alt text",
  "minDays": 1,
  "maxDays": 90
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Unique slug |
| `file` | yes | Image path relative to `src/images/` |
| `alt` | yes | Alt text |
| `minDays` | yes | Show when at least this many days remain until July |
| `maxDays` | yes | Show when at most this many days remain until July |

### specials.json — Special date images

```json
{
  "id": "descriptive-slug",
  "file": "specials/image.jpg",
  "alt": "Descriptive alt text",
  "caption": "Optional caption text",
  "month": 12,
  "from": 24,
  "to": 25
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Unique slug |
| `file` | yes | Image path relative to `src/images/` |
| `alt` | yes | Alt text |
| `caption` | no | Text shown below the image |
| `month` | yes | Month number (1-12) |
| `from` | yes | First day of the month |
| `to` | yes | Last day of the month |

## Adding content

### Memes (July)

1. Add the image to `src/images/`
2. Add an entry to `src/memes.json`
3. Push to `main` — the deploy action minifies and publishes

### Countdown images (outside July)

1. Add the image to `src/images/countdown/`
2. Add an entry to `src/countdown.json`

### Special dates (easter eggs)

1. Add the image to `src/images/specials/`
2. Add an entry to `src/specials.json`

## Query parameters

| Param | Example | Description |
|-------|---------|-------------|
| `date` | `?date=2026-07-15` | Simulate a specific date |
| `id` | `?id=julio-entero` | Show a specific meme by ID (searches all catalogs) |

## States

| Period | What shows | Priority |
|--------|-----------|----------|
| Special date match | Special image | Highest (overrides all) |
| July 1–31 | Random meme for the current day | — |
| August 1 – December 31 | "Nos vemos el año que viene" + explore link | — |
| January 1 – June 30 | Countdown with random image | — |

## Build

On push to `main`, a GitHub Action minifies JS (terser), CSS (csso), and JSON, then deploys to GitHub Pages. Source stays readable in `src/`.

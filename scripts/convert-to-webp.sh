#!/bin/bash
set -euo pipefail

SRC_DIR="${1:-src/images}"
QUALITY="${2:-80}"

converted=0
skipped=0

find "$SRC_DIR" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) | while read -r file; do
  webp="${file%.*}.webp"

  if [ -f "$webp" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  cwebp -q "$QUALITY" "$file" -o "$webp" -quiet
  echo "converted: $file → $webp"
  converted=$((converted + 1))
done

echo ""
echo "Done. Run the following to update references and clean originals:"
echo "  1. Update file extensions in src/memes.json, src/countdown.json, src/specials.json"
echo "  2. Remove originals: find $SRC_DIR -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) ! -name 'og-image.png' -delete"

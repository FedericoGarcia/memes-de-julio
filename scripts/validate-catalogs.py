#!/usr/bin/env python3
"""Validate JSON catalogs: check for duplicate IDs and missing image files."""

import json
import os
import sys
from glob import glob

CATALOGS_DIR = "src/catalogs"
IMAGES_DIR = "src/images"

ids = []
missing_images = []

for path in sorted(glob(f"{CATALOGS_DIR}/*.json")):
    name = os.path.basename(path)
    data = json.load(open(path))
    for item in data:
        ids.append((item["id"], name))
        img_path = f"{IMAGES_DIR}/{item['file']}"
        if not os.path.exists(img_path):
            missing_images.append((item["id"], item["file"], name))

seen = {}
duplicates = []
for entry_id, catalog in ids:
    if entry_id in seen:
        duplicates.append((entry_id, seen[entry_id], catalog))
    seen[entry_id] = catalog

errors = False

if duplicates:
    errors = True
    for entry_id, first, second in duplicates:
        print(f"DUPLICATE: {entry_id} in {first} AND {second}")

if missing_images:
    errors = True
    for entry_id, file, catalog in missing_images:
        print(f"MISSING IMAGE: {file} (id: {entry_id}) in {catalog}")

if errors:
    sys.exit(1)

print(f"OK: {len(ids)} entries across {len(glob(f'{CATALOGS_DIR}/*.json'))} catalogs, no issues")

#!/bin/bash
# ════════════════════════════════════════════════════════════════
# fetch_v3_images.sh — Self-host the Umlilo Web v3 photography
# Run ON the Afrihost server (cPanel Terminal) or any machine with
# open internet + repo access:   bash scripts/fetch_v3_images.sh
#
# Downloads the 12 Unsplash-licensed photos (free commercial use)
# as WEBP at production resolution into:
#   BlackFire/BlackFire Portal/images/v3/
# then commits + pushes to ndlunkulu. After this runs once, the
# site never depends on a third-party CDN, and Claude can embed
# the files directly so the in-app preview renders photography.
# ════════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
DIR="BlackFire/BlackFire Portal/images/v3"
mkdir -p "$DIR"
BASE="https://images.unsplash.com/photo-"
P="auto=format&fit=crop&fm=webp&q=82"

declare -A IMG=(
  [hero-plant-night]="1670689334799-cdc6777db8cc&w=1400&h=1750"
  [about-officer-patrol]="1772743227731-e16af7c8d85a&w=1400&h=1050"
  [faq-camera-wall]="1557597774-9d273605dfa9&w=1050&h=1400"
  [cta-plant-wide]="1642285709726-f9eb035b034b&w=2400&h=915"
  [svc-armed-response]="1485230405346-71acb9518d9c&w=1200&h=750"
  [svc-drone]="1569228593208-6314ad85a2ba&w=1200&h=750"
  [svc-cctv]="1496368077930-c1e31b4e5b44&w=1200&h=750"
  [svc-access-control]="1618482914248-29272d021005&w=1200&h=750"
  [svc-guard-deployment]="1581568736305-49a04e012c13&w=1200&h=750"
  [svc-electronic]="1670689334024-ad61dd564fe2&w=1200&h=750"
  [svc-perimeter]="1687274427456-ccf06e264df2&w=1200&h=750"
  [svc-compliance]="1484480974693-6ca0a78fb36b&w=1200&h=750"
)

for name in "${!IMG[@]}"; do
  id_params="${IMG[$name]}"
  id="${id_params%%&*}"; params="${id_params#*&}"
  out="$DIR/${name}.webp"
  echo "→ ${name}.webp"
  curl -fsSL "${BASE}${id}?${params}&${P}" -o "$out"
  [ -s "$out" ] || { echo "EMPTY: $name" >&2; exit 1; }
done

echo "── manifest ──"; ls -la "$DIR"
git add "$DIR"
git commit -m "assets(v3): self-host Unsplash-licensed photography manifest (12 webp) — no CDN hotlinking"
git push origin ndlunkulu
echo "✔ Done. Tell Claude the images are in the repo — the preview build follows."

#!/usr/bin/env bash
set -euo pipefail
release=$(pwd -P)
revision=${1:?Pass the source commit revision}
[[ "$revision" =~ ^[a-f0-9]{7,40}$ ]] || { echo 'Invalid revision'; exit 1; }
[[ "$release" == /opt/apps/blueclue/releases/* ]] || { echo 'Run inside a BlueClue release directory'; exit 1; }
[[ ! -e .local && ! -e public/tracks/local-pilot ]] || { echo 'Private audio is forbidden in this public build'; exit 1; }
image="blueclue:$revision"
docker run --rm --name blueclue-build --cpus=0.60 --memory=1400m --memory-swap=1800m --pids-limit=256 \
  -e NEXT_TELEMETRY_DISABLED=1 -e BLUECLUE_STANDALONE=1 -e NODE_OPTIONS=--max-old-space-size=768 \
  -v "$release:/app" -w /app node:22-bookworm-slim \
  sh -c 'npm ci --no-audit --no-fund && npm test && npm run build'
image_context=$(mktemp -d "$release/.image-XXXXXX")
trap '[[ "$image_context" == "$release"/.image-* ]] && rm -rf -- "$image_context"' EXIT
mkdir -p "$image_context/app/.next"
cp -a .next/standalone/. "$image_context/app/"
cp -a .next/static "$image_context/app/.next/static"
cp -a public "$image_context/app/public"
docker build --network=none --file "$release/ops/Dockerfile.runtime" --build-arg "APP_REVISION=$revision" --tag "$image" "$image_context"
printf '\nBuilt %s. No service has been restarted.\n' "$image"

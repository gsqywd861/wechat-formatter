#!/bin/bash
# Cloudflare Pages build script
# Prevents infinite recursion when opennextjs-cloudflare build calls npm run build internally

if [ -z "$OPENNEXT_BUILDING" ]; then
  # First invocation: run full build
  export OPENNEXT_BUILDING=1
  echo "→ Running full build: next build + opennextjs-cloudflare build"
  npx next build && npx opennextjs-cloudflare build
else
  # Recursive call from opennextjs-cloudflare: run only next build
  echo "→ Recursive build detected, running only: next build"
  npx next build
fi
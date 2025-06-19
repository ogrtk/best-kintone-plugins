#!/bin/bash

echo "🔍 Validating release config for packages..."

STATUS=0

for dir in packages/*; do
  [ -d "$dir" ] || continue

  pkg=$(basename "$dir")
  echo "📦 Checking package: $pkg"

  config="$dir/.releaseconfig.json"

  if [ ! -f "$config" ]; then
    echo "❌ Error: Missing .releaseconfig.json in $pkg"
    STATUS=1
    continue
  fi

  # Check that required keys exist (regardless of true/false value)
  if ! jq -e 'has("artifact") and has("publish")' "$config" >/dev/null; then
    echo "❌ Error: .releaseconfig.json in $pkg is missing required keys 'artifact' and/or 'publish'"
    STATUS=1
    continue
  fi

  # Optional: warn if dist/ directory is missing
  dist="$dir/dist"
  if [ ! -d "$dist" ]; then
    echo "⚠️ Warning: dist/ directory is missing in $pkg (artifact creation may fail if required)"
  else
    echo "✅ dist/ directory exists for $pkg"
  fi
done

if [ "$STATUS" -ne 0 ]; then
  echo "❌ Validation failed for one or more packages."
  exit 1
fi

echo "✅ All packages passed validation."

#!/bin/bash
# Builds dist/TextPaster.alfredworkflow, the double-click installable bundle.
#
# Alfred expects info.plist at the archive root, so the contents of workflow/
# are zipped rather than the folder itself.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION="$(/usr/libexec/PlistBuddy -c 'Print :version' "$REPO_DIR/workflow/info.plist")"
OUT="$REPO_DIR/dist/TextPaster.alfredworkflow"

mkdir -p "$REPO_DIR/dist"
rm -f "$OUT"
(cd "$REPO_DIR/workflow" && zip -qr -X "$OUT" . -x '.DS_Store' '__MACOSX/*')

echo "Built $OUT (version $VERSION)"
unzip -Z1 "$OUT" | sort | sed 's/^/  /'

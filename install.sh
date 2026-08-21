#!/bin/bash
# Installs TextPaster into Alfred's (Dropbox-synced) workflows directory and
# removes the old "Preset Paster" workflow it replaces. Idempotent.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKFLOWS_DIR="${WORKFLOWS_DIR:-$HOME/Library/CloudStorage/Dropbox/Alfred/Alfred.alfredpreferences/workflows}"
NEW_BUNDLE_ID="net.nightblade.textpaster"
OLD_BUNDLE_ID="com.peterkrenn.presetpaster"

[ -d "$WORKFLOWS_DIR" ] || { echo "Workflows dir not found: $WORKFLOWS_DIR" >&2; exit 1; }

target=""
for plist in "$WORKFLOWS_DIR"/user.workflow.*/info.plist; do
  [ -f "$plist" ] || continue
  folder="$(dirname "$plist")"
  bundle_id="$(/usr/libexec/PlistBuddy -c 'Print :bundleid' "$plist" 2>/dev/null || true)"
  case "$bundle_id" in
    "$OLD_BUNDLE_ID")
      trashed="$HOME/.Trash/$(basename "$folder").presetpaster"
      mv "$folder" "$trashed"
      echo "Removed old Preset Paster -> $trashed"
      ;;
    "$NEW_BUNDLE_ID")
      target="$folder"
      ;;
  esac
done

saved_vars=""
if [ -z "$target" ]; then
  target="$WORKFLOWS_DIR/user.workflow.$(uuidgen)"
  echo "Creating new workflow folder: $(basename "$target")"
else
  echo "Updating existing workflow folder: $(basename "$target")"
  # Alfred stores workflow-variable edits in the installed info.plist;
  # carry them over so a reinstall doesn't reset them to defaults.
  saved_vars="$(plutil -extract variables json -o - "$target/info.plist" 2>/dev/null || true)"
fi

rsync -a --delete "$REPO_DIR/workflow/" "$target/"

if [ -n "$saved_vars" ] && [ "$saved_vars" != "{}" ]; then
  /usr/bin/python3 -c '
import json, plistlib, sys
path, saved = sys.argv[1], json.loads(sys.argv[2])
with open(path, "rb") as f:
    pl = plistlib.load(f)
pl.setdefault("variables", {}).update(saved)
with open(path, "wb") as f:
    plistlib.dump(pl, f)
' "$target/info.plist" "$saved_vars"
  echo "Preserved existing workflow variables: $saved_vars"
fi
echo "Installed TextPaster ($NEW_BUNDLE_ID). Alfred picks up changes automatically;"
echo "if it looks stale, open Alfred Preferences -> Workflows to force a rescan."

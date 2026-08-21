#!/bin/bash
# Installs Preset Paster into Alfred's workflows directory. Idempotent.
#
# Alfred keeps its preferences bundle in a sync folder when one is configured
# (Dropbox, iCloud Drive, ...) and in Application Support otherwise. This
# script follows that setting. Override it with WORKFLOWS_DIR=...
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BUNDLE_ID="net.nightblade.presetpaster"
DEFAULT_DIR="$HOME/Library/Application Support/Alfred/Alfred.alfredpreferences/workflows"

if [ -z "${WORKFLOWS_DIR:-}" ]; then
  syncfolder="$(defaults read com.runningwithcrayons.Alfred-Preferences syncfolder 2>/dev/null || true)"
  if [ -n "$syncfolder" ]; then
    synced="${syncfolder/#\~/$HOME}/Alfred.alfredpreferences/workflows"
    [ -d "$synced" ] && WORKFLOWS_DIR="$synced"
  fi
  WORKFLOWS_DIR="${WORKFLOWS_DIR:-$DEFAULT_DIR}"
fi

[ -d "$WORKFLOWS_DIR" ] || { echo "Workflows dir not found: $WORKFLOWS_DIR" >&2; exit 1; }

target=""
for plist in "$WORKFLOWS_DIR"/user.workflow.*/info.plist; do
  [ -f "$plist" ] || continue
  if [ "$(/usr/libexec/PlistBuddy -c 'Print :bundleid' "$plist" 2>/dev/null || true)" = "$BUNDLE_ID" ]; then
    target="$(dirname "$plist")"
  fi
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
echo "Installed Preset Paster ($BUNDLE_ID) into $WORKFLOWS_DIR"
echo "Alfred picks up changes automatically; if it looks stale, open"
echo "Alfred Preferences -> Workflows to force a rescan."

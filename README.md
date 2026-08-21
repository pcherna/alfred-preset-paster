# TextPaster

Alfred 5 workflow: press **⌃⇧V** to get a filterable list of text presets for the frontmost app, with global presets appended. Selecting one pastes it into the app and then restores your previous clipboard (full fidelity — rich text, images, etc.).

## Usage

- **⌃⇧V** (or keyword **`tp`**) — list presets for the frontmost app (app-specific first, then global). Type to filter, ↵ to paste.
- **`tpadd`** — with the target app frontmost, scaffolds a config block with its bundle ID and name, then opens the config.
- **`tpconfig`** — opens the config file.

## Config

`~/Library/Application Support/Alfred/Workflow Data/net.nightblade.textpaster/config.yaml`, created on first use. Top-level keys are app bundle IDs, plus the special `global` list:

```yaml
com.apple.Safari:
  name: Safari
  # method: keystrokes   # optional; type instead of paste (default: paste)
  presets:
    - title: Greeting     # title optional; defaults to first line of text
      text: |
        Hi there,
        Thanks for reaching out.

global:                   # offered in every app, after app-specific items
  - text: peter@nightblade.net
```

`method: keystrokes` types the text via simulated key presses instead of pasting (clipboard untouched) — for apps that block or mangle ⌘V. It applies to global presets too while that app is frontmost. Caveats: each newline is sent as a real Return keypress (chat apps may submit per line), and characters not reachable on your keyboard layout may not type correctly.

Workflow variables (Alfred Preferences → the workflow's `[x]` panel; `install.sh` preserves your values across reinstalls):

- `textpaster_paste_delay` (default `0.3` seconds) — how long the preset stays on the clipboard before the original clipboard is restored; raise it if a slow (e.g. Electron) app pastes stale content.
- `textpaster_editor` — app name that `tpconfig`/`tpadd` open the config with, e.g. `Visual Studio Code`. Empty uses the system-wide default handler for `.yaml` files (change that via Finder → Get Info on a `.yaml` file → Open With → Change All).

## Install

```sh
bash install.sh
```

Copies `workflow/` into Alfred's workflows directory (Dropbox-synced; override with `WORKFLOWS_DIR=...`) and moves the old "Preset Paster" workflow it replaces to the Trash. Direct folder install preserves the ⌃⇧V hotkey binding (Alfred only strips hotkeys when importing `.alfredworkflow` bundles).

## Development

`workflow/` mirrors the installed folder 1:1 — no build step. All scripts are JXA (`osascript -l JavaScript`); the entry scripts run with `cwd` set to the workflow directory and load `textpaster_common.js` (and the vendored [js-yaml 4.1.0](https://github.com/nodeca/js-yaml), MIT) via `eval`. To test standalone:

```sh
cd workflow
alfred_workflow_data=/tmp/tpdata osascript -l JavaScript textpaster_filter.js
```

## Notes

- Alfred needs Accessibility (it normally already has it); a one-time "Alfred wants to control System Events" prompt may appear on first paste.

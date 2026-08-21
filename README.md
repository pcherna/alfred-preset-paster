# Alfred TextPaster

**TextPaster** is an Alfred 5 workflow that lets you set up global or per-app text strings that you can easily select then paste into the frontmost app.

To use, press **⌃⇧V** to see the list, then select one to paste it into the app. (Your previous clipboard content will be restored afterwards.)

## Use of AI Coding Tools

This project was built using Claude Code and the Claude Opus 5 model. I'm a real human, and I wrote most of this readme, but I needed this functionality and I suck at Alfred workflows.

## Usage

- **⌃⇧V** (or Alfred keyword **`tp`**) — list the presets for the frontmost app (app-specific first, then global). Type to filter, ↵ to paste.
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
  - title: Global example
    text: This is available in every app
```

`method: keystrokes` types the text via simulated key presses instead of pasting (clipboard untouched) — for apps that block or mangle ⌘V. It applies to global presets too while that app is frontmost. Caveats: each newline is sent as a real Return keypress (chat apps may submit per line), and characters not reachable on your keyboard layout may not type correctly.

Workflow variables (Alfred Preferences → the workflow's `[x]` panel; `install.sh` preserves your values across reinstalls):

- `textpaster_paste_delay` (default `0.3` seconds) — how long the preset stays on the clipboard before the original clipboard is restored; raise it if a slow (e.g. Electron) app pastes stale content.
- `textpaster_editor` — app name that `tpconfig`/`tpadd` open the config with, e.g. `Visual Studio Code`. Empty uses the system-wide default handler for `.yaml` files (change that via Finder → Get Info on a `.yaml` file → Open With → Change All).

## Install

Download `TextPaster.alfredworkflow` from the [latest release](https://github.com/pcherna/AlfredTextPaster/releases) and double-click it.

Alfred clears hotkeys when it imports a workflow, so open the workflow and set your own. ⌃⇧V is the suggested default. Avoid anything containing ⌘ if you use a remote-desktop client — Command reaches the remote machine as the Windows key and opens the Start menu.

To install from a clone instead, which preserves the hotkey stored in `workflow/info.plist`:

```sh
bash install.sh
```

That copies `workflow/` into Alfred's workflows directory, following Alfred's own sync-folder setting (Dropbox, iCloud Drive, ...) and falling back to `~/Library/Application Support/Alfred/`. Override with `WORKFLOWS_DIR=...`. Reinstalling preserves your workflow variables.

To build the distributable bundle:

```sh
bash build.sh          # writes dist/TextPaster.alfredworkflow
```

## Development

`workflow/` mirrors the installed folder 1:1 — no build step. All scripts are JXA (`osascript -l JavaScript`); the entry scripts run with `cwd` set to the workflow directory and load `textpaster_common.js` (and the vendored [js-yaml 4.1.0](https://github.com/nodeca/js-yaml), MIT) via `eval`. To test standalone:

```sh
cd workflow
alfred_workflow_data=/tmp/tpdata osascript -l JavaScript textpaster_filter.js
```

## Notes

- Alfred needs Accessibility (it normally already has it); a one-time "Alfred wants to control System Events" prompt may appear on first paste.

## License

MIT — see [LICENSE](LICENSE).

Bundles [js-yaml 4.1.0](https://github.com/nodeca/js-yaml) (MIT, Copyright (C) 2011-2015 by Vitaly Puzrin); its license is at [workflow/js-yaml.LICENSE](workflow/js-yaml.LICENSE).

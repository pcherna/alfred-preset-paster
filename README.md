# Alfred Preset Paster

**Preset Paster** is an Alfred 5 workflow that lets you set up per-app and global text strings that you can easily select then paste into the frontmost app.

To use **Preset Paster**, press the hotkey you've assigned to see the list, then select the desired entry to paste it into the app. (Your previous clipboard content will be restored afterwards.)

## Use of AI Coding Tools

This project was built using Claude Code and the Claude Opus 5 model. I'm a real human, and I wrote most of this readme, but I needed this functionality and I suck at Alfred workflows.

## Usage

- Alfred keyword **`pp`**, or your assigned shortcut (suggested: **⌃⇧V**)— list the presets for the frontmost app (app-specific first, then global). Type to filter, ↵ to paste.
- **`ppadd`** — Add a preset to your config, for the current frontmost app. Scaffolds a config block with its bundle ID and name, then opens the config.
- **`ppconfig`** — Opens the config file.

## Config File Location and Format

The config for **Preset Paster** is stored at `~/Library/Application Support/Alfred/Workflow Data/net.nightblade.presetpaster/config.yaml`, created on first use. Top-level keys are app bundle IDs, plus the special `global` list:

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

Normally, the preset is pasted into the frontmost app. When necessary, you can specify `method: keystrokes` that tells **Preset Paster** to type the text via simulated key presses instead — this is useful for apps that block or mangle ⌘V, such as some remote access applications. The method is based on which app is frontmost, even for global presets. Note that each newline is sent as a real Return keypress (chat apps may submit per line), and characters not reachable on your keyboard layout may not type correctly.

Workflow variables (Alfred Preferences → the workflow's `[x]` panel; `install.sh` preserves your values across reinstalls):

- `presetpaster_paste_delay` (default `0.3` seconds) — how long the preset stays on the clipboard before the original clipboard is restored; raise it if a slow (e.g. Electron) app pastes stale content.
- `presetpaster_editor` — app name that `ppconfig`/`ppadd` open the config with, e.g. `Visual Studio Code`. Empty uses the system-wide default handler for `.yaml` files (change that via Finder → Get Info on a `.yaml` file → Open With → Change All).

## Install

Download `PresetPaster.alfredworkflow` from the [latest release](https://github.com/pcherna/alfred-preset-paster/releases) and double-click it.

Alfred clears hotkeys when it imports a workflow, so open the workflow and set your own. ⌃⇧V is the suggested default. If you use any sort of remote-desktop tool to access Windows systems, you may wish to avoid any shortcut containing ⌘ because the Command key can reach the remote machine, and open its Start menu.

To install from a source instead, which preserves the hotkey stored in `workflow/info.plist`:

```sh
bash install.sh
```

That copies `workflow/` into Alfred's workflows directory, following Alfred's own sync-folder setting (Dropbox, iCloud Drive, ...) and falling back to `~/Library/Application Support/Alfred/`. Override with `WORKFLOWS_DIR=...`. Reinstalling preserves your workflow variables.

To build the distributable bundle:

```sh
bash build.sh          # writes dist/PresetPaster.alfredworkflow
```

## Development

`workflow/` mirrors the installed folder 1:1 — no build step. All scripts are JXA (`osascript -l JavaScript`); the entry scripts run with `cwd` set to the workflow directory and load `presetpaster_common.js` (and the vendored [js-yaml 4.1.0](https://github.com/nodeca/js-yaml), MIT) via `eval`. To test standalone:

```sh
cd workflow
alfred_workflow_data=/tmp/tpdata osascript -l JavaScript presetpaster_filter.js
```

`icon.svg` is the source for `workflow/icon.png`. Regenerate it with:

```sh
rsvg-convert -w 512 -h 512 icon.svg -o workflow/icon.png
```

## Notes

- Alfred needs Accessibility (it normally already has it); a one-time "Alfred wants to control System Events" prompt may appear on first paste.

## License

MIT — see [LICENSE](LICENSE).

Bundles [js-yaml 4.1.0](https://github.com/nodeca/js-yaml) (MIT, Copyright (C) 2011-2015 by Vitaly Puzrin); its license is at [workflow/js-yaml.LICENSE](workflow/js-yaml.LICENSE).

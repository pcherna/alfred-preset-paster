// Keyword helpers.
//   open — ensure the config exists and open it in the default editor.
//   add  — scaffold the frontmost app as a new top-level block in the
//          config (skipped if already present), then open the file.
//
// The scaffold is a pure text-append at end-of-file; bundle IDs are
// top-level YAML keys, so appending never disturbs the user's comments
// or formatting elsewhere in the file.

ObjC.import("Foundation");

eval(
  $.NSString.stringWithContentsOfFileEncodingError(
    "presetpaster_common.js", $.NSUTF8StringEncoding, null
  ).js
);

function openConfig(configPath) {
  const app = Application.currentApplication();
  app.includeStandardAdditions = true;
  // presetpaster_editor (workflow variable): app name to open the config
  // with; empty means the system default handler for .yaml files.
  const editor = tpEnv("presetpaster_editor");
  const cmd = editor
    ? "open -a " + quotedForm(editor) + " " + quotedForm(configPath)
    : "open " + quotedForm(configPath);
  app.doShellScript(cmd);
}

function quotedForm(s) {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

function scaffoldBlock(name, bundleId) {
  return (
    "\n" +
    bundleId + ":\n" +
    '  name: "' + name.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"\n' +
    "  presets:\n" +
    '    - title: "Example preset"\n' +
    "      text: |\n" +
    "        Replace me\n"
  );
}

function addFrontmostApp(configPath) {
  const app = tpFrontmostApp();
  if (!app.bundleId) return; // detection failed; just open the file

  const content = tpReadFile(configPath) || "";
  const escaped = app.bundleId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp("^" + escaped + ":", "m").test(content)) return; // already there

  let updated = content;
  if (updated.length > 0 && !updated.endsWith("\n")) updated += "\n";
  updated += scaffoldBlock(app.name || app.bundleId, app.bundleId);

  $(updated).writeToFileAtomicallyEncodingError(
    configPath, true, $.NSUTF8StringEncoding, $()
  );
}

function run(argv) {
  const configPath = tpEnsureConfig();
  if (argv[0] === "add") addFrontmostApp(configPath);
  openConfig(configPath);
}

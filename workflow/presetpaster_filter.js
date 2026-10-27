// Script filter: emits the Alfred item list for the frontmost app's
// presets followed by the global presets. Runs once per invocation;
// Alfred does the fuzzy filtering (alfredfiltersresults = true).

ObjC.import("Foundation");
ObjC.import("AppKit");

eval(
  $.NSString.stringWithContentsOfFileEncodingError(
    "js-yaml.min.js", $.NSUTF8StringEncoding, null
  ).js
);
eval(
  $.NSString.stringWithContentsOfFileEncodingError(
    "presetpaster_common.js", $.NSUTF8StringEncoding, null
  ).js
);

function itemTitle(entry) {
  if (typeof entry.title === "string" && entry.title.length > 0) {
    return entry.title;
  }
  const first = entry.text.split("\n")[0].trim();
  return first.length > 60 ? first.slice(0, 57) + "…" : first;
}

function presetItems(list, subtitle) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(
      (e) => e !== null && typeof e === "object" && typeof e.text === "string"
    )
    .map((e) => ({
      title: itemTitle(e),
      subtitle: subtitle,
      arg: e.text,
      text: { copy: e.text, largetype: e.text },
    }));
}

// Offered first for keystroke apps: types whatever text is on the
// clipboard, for apps where Cmd-V doesn't work. Password managers mark
// secrets with org.nspasteboard.ConcealedType (nspasteboard.org); those
// are never previewed in the subtitle.
function clipboardItem() {
  const pb = $.NSPasteboard.generalPasteboard;
  const s = pb.stringForType($.NSPasteboardTypeString);
  const text = typeof s.js === "string" ? s.js : "";
  if (text.length === 0) {
    return {
      title: "Paste using keystrokes",
      subtitle: "Clipboard has no text",
      valid: false,
    };
  }
  const concealed = pb.types.containsObject("org.nspasteboard.ConcealedType");
  const first = text.split(/\r?\n/)[0].trim();
  return {
    title: "Paste using keystrokes",
    subtitle: concealed
      ? "Clipboard: (concealed)"
      : "Clipboard: " + (first.length > 60 ? first.slice(0, 57) + "…" : first),
    arg: "",
    variables: { method: "keystrokes", source: "clipboard" },
  };
}

function errorOutput(title, subtitle) {
  return JSON.stringify({
    items: [{ title: title, subtitle: subtitle, valid: false }],
  });
}

function run() {
  const configPath = tpEnsureConfig();

  let config;
  try {
    config = jsyaml.load(tpReadFile(configPath) || "");
  } catch (e) {
    return errorOutput(
      "Preset Paster: config error",
      String(e.message || e).split("\n")[0]
    );
  }
  if (config === null || config === undefined) config = {};
  if (typeof config !== "object" || Array.isArray(config)) {
    return errorOutput(
      "Preset Paster: config error",
      "Top level must be a mapping of bundle IDs (plus optional `global`)"
    );
  }

  const app = tpFrontmostApp();
  const appCfg =
    app.bundleId &&
    config[app.bundleId] !== null &&
    typeof config[app.bundleId] === "object"
      ? config[app.bundleId]
      : null;
  const appName = (appCfg && appCfg.name) || app.name || "this app";

  const method = appCfg && appCfg.method === "keystrokes" ? "keystrokes" : "paste";
  const items = (method === "keystrokes" ? [clipboardItem()] : []).concat(
    presetItems(appCfg && appCfg.presets, appName),
    presetItems(config.global, "Global")
  );

  if (items.length === 0) {
    return errorOutput(
      "No presets for " + appName,
      "Use pspadd to scaffold it, or pspconfig to edit the config"
    );
  }

  return JSON.stringify({ variables: { method: method }, items: items });
}

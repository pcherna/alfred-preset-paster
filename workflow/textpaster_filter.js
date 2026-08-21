// Script filter: emits the Alfred item list for the frontmost app's
// presets followed by the global presets. Runs once per invocation;
// Alfred does the fuzzy filtering (alfredfiltersresults = true).

ObjC.import("Foundation");

eval(
  $.NSString.stringWithContentsOfFileEncodingError(
    "js-yaml.min.js", $.NSUTF8StringEncoding, null
  ).js
);
eval(
  $.NSString.stringWithContentsOfFileEncodingError(
    "textpaster_common.js", $.NSUTF8StringEncoding, null
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
      "TextPaster: config error",
      String(e.message || e).split("\n")[0]
    );
  }
  if (config === null || config === undefined) config = {};
  if (typeof config !== "object" || Array.isArray(config)) {
    return errorOutput(
      "TextPaster: config error",
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

  const items = presetItems(appCfg && appCfg.presets, appName).concat(
    presetItems(config.global, "Global")
  );

  if (items.length === 0) {
    return errorOutput(
      "No presets for " + appName,
      "Use tpadd to scaffold it, or tpconfig to edit the config"
    );
  }

  const method = appCfg && appCfg.method === "keystrokes" ? "keystrokes" : "paste";
  return JSON.stringify({ variables: { method: method }, items: items });
}

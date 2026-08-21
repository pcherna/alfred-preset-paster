// Shared helpers for Preset Paster. Loaded via top-level eval from the entry
// scripts, which run with cwd = the workflow directory (see info.plist).

ObjC.import("Foundation");

const BUNDLE_ID = "net.nightblade.presetpaster";

function tpEnv(name) {
  const v = $.NSProcessInfo.processInfo.environment.objectForKey(name);
  return typeof v.js === "string" ? v.js : null;
}

function tpDataDir() {
  return (
    tpEnv("alfred_workflow_data") ||
    $.NSHomeDirectory().js +
      "/Library/Application Support/Alfred/Workflow Data/" +
      BUNDLE_ID
  );
}

function tpConfigPath() {
  return tpDataDir() + "/config.yaml";
}

// Creates the data dir and seeds config.yaml from starter_config.yaml
// on first use, so the very first invocation already works.
function tpEnsureConfig() {
  const fm = $.NSFileManager.defaultManager;
  const dir = tpDataDir();
  if (!fm.fileExistsAtPath(dir)) {
    fm.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(
      dir, true, $(), $()
    );
  }
  const cfg = tpConfigPath();
  if (!fm.fileExistsAtPath(cfg)) {
    fm.copyItemAtPathToPathError("starter_config.yaml", cfg, $());
  }
  return cfg;
}

function tpReadFile(path) {
  const s = $.NSString.stringWithContentsOfFileEncodingError(
    path, $.NSUTF8StringEncoding, null
  );
  return typeof s.js === "string" ? s.js : null;
}

// Frontmost app as {name, bundleId}, or nulls if detection fails or
// Alfred itself is somehow frontmost (it's a non-activating panel, so
// normally the target app stays frontmost while Alfred is showing).
function tpFrontmostApp() {
  try {
    const procs = Application("System Events")
      .applicationProcesses.whose({ frontmost: true });
    const p = procs[0];
    const name = p.name();
    const bundleId = p.bundleIdentifier();
    if (bundleId && bundleId.toLowerCase().includes("alfred")) {
      return { name: null, bundleId: null };
    }
    return { name: name, bundleId: bundleId };
  } catch (e) {
    return { name: null, bundleId: null };
  }
}

// Delivers the chosen preset text to the frontmost app.
//
// method=paste (default): saves the full clipboard (all pasteboard types,
// held in memory), puts the text on the clipboard, sends Cmd-V, then
// restores the original clipboard.
//
// method=keystrokes: types the text via System Events key presses;
// clipboard is untouched. Newlines are sent as real Return keypresses.

ObjC.import("Foundation");
ObjC.import("AppKit");

function env(name) {
  const v = $.NSProcessInfo.processInfo.environment.objectForKey(name);
  return typeof v.js === "string" ? v.js : null;
}

function saveClipboard(pb) {
  const saved = [];
  const items = pb.pasteboardItems;
  const count = items.count;
  for (let i = 0; i < count; i++) {
    const item = items.objectAtIndex(i);
    const types = item.types;
    const entry = [];
    const typeCount = types.count;
    for (let j = 0; j < typeCount; j++) {
      const type = types.objectAtIndex(j);
      const data = item.dataForType(type);
      if (!data.isNil()) entry.push([type, data]);
    }
    if (entry.length > 0) saved.push(entry);
  }
  return saved;
}

function restoreClipboard(pb, saved) {
  pb.clearContents;
  if (saved.length === 0) return;
  const items = $.NSMutableArray.alloc.init;
  saved.forEach((entry) => {
    const item = $.NSPasteboardItem.alloc.init;
    entry.forEach(([type, data]) => item.setDataForType(data, type));
    items.addObject(item);
  });
  pb.writeObjects(items);
}

function typeText(se, text) {
  const CHUNK = 50;
  text.split("\n").forEach((line, i) => {
    if (i > 0) {
      se.keyCode(36);
      delay(0.02);
    }
    for (let pos = 0; pos < line.length; pos += CHUNK) {
      se.keystroke(line.slice(pos, pos + CHUNK));
      delay(0.02);
    }
  });
}

function run(argv) {
  const text = argv[0];
  if (typeof text !== "string" || text.length === 0) return;

  const se = Application("System Events");

  if (env("method") === "keystrokes") {
    delay(0.15); // let Alfred's window finish closing
    typeText(se, text);
    return;
  }

  const restoreDelay = parseFloat(env("presetpaster_paste_delay")) || 0.3;
  const pb = $.NSPasteboard.generalPasteboard;
  const saved = saveClipboard(pb);

  pb.clearContents;
  pb.setStringForType(text, $.NSPasteboardTypeString);

  delay(0.1); // let Alfred's window finish closing; target app keeps focus
  try {
    se.keystroke("v", { using: "command down" });
  } catch (e) {
    // Fail soft: leave the preset on the clipboard so a manual Cmd-V
    // still works. Restoring here would destroy the only copy.
    return;
  }
  delay(restoreDelay); // give the app time to read the clipboard

  restoreClipboard(pb, saved);
}

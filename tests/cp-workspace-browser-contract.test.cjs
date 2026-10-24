"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const core = require("../cp-workspace-core.js");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "cp-workspace.html"), "utf8");
const app = fs.readFileSync(path.join(root, "cp-workspace.js"), "utf8");

test("page contains every static DOM id used by the browser app", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const idSet = new Set(ids);
  const references = [...app.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]);
  const missing = [...new Set(references)].filter((id) => !idSet.has(id));

  assert.deepEqual(missing, []);
  assert.equal(ids.length, idSet.size, "HTML IDs must be unique");
});

test("page fields match the workspace schema and both scripts are loaded", () => {
  const fields = [...html.matchAll(/\bdata-field="([^"]+)"/g)].map((match) => match[1]);
  const allowed = new Set(Object.keys(core.emptyFields()));
  const unknown = [...new Set(fields)].filter((field) => !allowed.has(field));

  assert.deepEqual(unknown, []);
  assert.match(html, /<script src="\.\/cp-workspace-core\.js" defer><\/script>/);
  assert.match(html, /<script src="\.\/cp-workspace\.js" defer><\/script>/);
});

test("learner view gates coach analysis and exposes progressive retrieval controls", () => {
  assert.match(html, /id="learnerPanel"/);
  assert.match(html, /id="coachPanel" hidden/);
  assert.match(html, /id="coachGateStatus"/);
  assert.match(app, /Record a concrete first attempt/);
  assert.match(app, /Record next move &amp; show one cue|Record next move & show one cue/);
  assert.match(html, /id="requestHintButton"/);
  assert.match(html, /id="reviewButton"/);
});

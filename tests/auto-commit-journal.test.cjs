"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { createCommitter } = require("../.opencode/lib/auto-commit-journal.cjs");

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

test("OpenCode file commits stage only the reported path and message checkpoints stay empty", (t) => {
  const tempRoot = path.resolve(os.tmpdir());
  const root = fs.mkdtempSync(path.join(tempRoot, "auto-commit-journal-"));
  t.after(() => {
    const absoluteRoot = path.resolve(root);
    const allowedPrefix = `${tempRoot}${path.sep}`;
    const safe = process.platform === "win32"
      ? absoluteRoot.toLowerCase().startsWith(allowedPrefix.toLowerCase())
      : absoluteRoot.startsWith(allowedPrefix);
    assert.equal(safe, true, "temporary Git repository must stay inside the OS temp directory");
    fs.rmSync(absoluteRoot, { recursive: true, force: true });
  });

  git(root, ["init", "-q"]);
  git(root, ["config", "user.name", "Journal test"]);
  git(root, ["config", "user.email", "journal-test@example.invalid"]);
  fs.writeFileSync(path.join(root, ".gitignore"), ".opencode/commit-journal.local.md\n");
  git(root, ["add", ".gitignore"]);
  git(root, ["commit", "-qm", "test setup"]);

  const committer = createCommitter(root);
  fs.writeFileSync(path.join(root, "selected.txt"), "selected edit\n");
  fs.writeFileSync(path.join(root, "unrelated.txt"), "unrelated edit\n");
  const selected = committer.commit(["selected.txt"], { trigger: "file.edited", why: "Test exact path staging." });

  assert.equal(selected.committed, true);
  assert.deepEqual(selected.files, ["selected.txt"]);
  assert.deepEqual(git(root, ["show", "--format=", "--name-only", "HEAD"]).split(/\r?\n/).filter(Boolean), ["selected.txt"]);
  assert.equal(git(root, ["status", "--porcelain"]).includes("unrelated.txt"), true);
  assert.equal(committer.commitCurrent, undefined, "broad current-tree commits are not available to the plugin");

  const previousHash = committer.currentHash();
  const checkpoint = committer.checkpoint({ trigger: "completed assistant message", why: "Message checkpoint." });
  assert.equal(checkpoint.committed, true);
  assert.notEqual(checkpoint.hash, previousHash);
  assert.deepEqual(git(root, ["show", "--format=", "--name-only", "HEAD"]).split(/\r?\n/).filter(Boolean), []);
  assert.equal(git(root, ["status", "--porcelain"]).includes("unrelated.txt"), true);
  assert.match(fs.readFileSync(committer.journalPath, "utf8"), new RegExp(checkpoint.hash));
});

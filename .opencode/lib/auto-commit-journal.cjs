"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const JOURNAL_RELATIVE = path.join(".opencode", "commit-journal.local.md");

function runGit(root, args, options = {}) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  }).trimEnd();
}

function findRepositoryRoot(directory) {
  try {
    return runGit(directory, ["rev-parse", "--show-toplevel"]);
  } catch {
    return null;
  }
}

function normalizeFilePath(root, file) {
  if (typeof file !== "string" || !file.trim()) return null;
  const absolute = path.resolve(root, file);
  const relative = path.relative(path.resolve(root), absolute);
  if (!relative || path.isAbsolute(relative) || relative === ".." || relative.startsWith(`..${path.sep}`)) return null;
  const normalized = relative.split(path.sep).join("/");
  if (normalized.split("/").includes(".git")) return null;
  if (normalized === JOURNAL_RELATIVE.split(path.sep).join("/")) return null;
  return normalized;
}

function parsePorcelainStatus(output) {
  const paths = new Set();
  const staged = new Set();
  const records = String(output || "").split("\0");
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (record.length < 4) continue;
    const code = record.slice(0, 2);
    const file = record.slice(3).replace(/\\/g, "/");
    paths.add(file);
    if (code[0] !== " " && code[0] !== "?") staged.add(file);
    if (code.includes("R") || code.includes("C")) {
      const originalPath = records[index + 1];
      if (originalPath) paths.add(originalPath.replace(/\\/g, "/"));
      index += 1;
    }
  }
  return { paths, staged };
}

function readStatus(root) {
  return parsePorcelainStatus(runGit(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]));
}

function shortText(value, limit = 1800) {
  return String(value || "").replace(/\r/g, "").trim().slice(0, limit);
}

function markdownText(value) {
  return String(value || "").replace(/\r/g, "").replace(/\n/g, "\n> ").trim();
}

function createCommitter(root, options = {}) {
  const absoluteRoot = path.resolve(root);
  const journalPath = path.join(absoluteRoot, JOURNAL_RELATIVE);
  const baseline = readStatus(absoluteRoot);
  const baselineDirty = baseline.paths;
  const baselineStaged = baseline.staged;
  const now = options.now || (() => new Date());

  function currentHash() {
    try { return runGit(absoluteRoot, ["rev-parse", "HEAD"]); }
    catch { return "unavailable"; }
  }

  function appendJournal({ hash, trigger, sessionId, messageId, files = [], change = "", why = "", note = "" }) {
    fs.mkdirSync(path.dirname(journalPath), { recursive: true });
    if (!fs.existsSync(journalPath)) {
      fs.writeFileSync(journalPath, "# OpenCode local change journal\n\nThis file is local and ignored by Git. Each entry records a commit hash, changed files, and the reason supplied or inferred for the change.\n", "utf8");
    }
    const entry = [
      `## ${hash}`,
      `- Time: ${now().toISOString()}`,
      `- Event: ${trigger || "OpenCode checkpoint"}`,
      sessionId ? `- Session: ${sessionId}` : "",
      messageId ? `- Message: ${messageId}` : "",
      files.length ? `- Files: ${files.map((file) => `\`${file}\``).join(", ")}` : "- Files: none (message checkpoint)",
      change ? `- Change: ${change}` : "",
      why ? `- Why:\n> ${markdownText(why)}` : "- Why: No user rationale was available; review the change summary and surrounding session.",
      note ? `- Note: ${note}` : ""
    ].filter(Boolean).join("\n");
    fs.appendFileSync(journalPath, `\n${entry}\n`, "utf8");
  }

  function recordSkipped(context, files, reason) {
    appendJournal({
      hash: currentHash(),
      trigger: context.trigger,
      sessionId: context.sessionId,
      messageId: context.messageId,
      files,
      why: context.why,
      note: `No new commit was created: ${reason}`
    });
    return { committed: false, hash: currentHash(), files, reason };
  }

  function commit(paths = [], context = {}) {
    const normalized = [...new Set(paths.map((file) => normalizeFilePath(absoluteRoot, file)).filter(Boolean))];
    const alreadyDirty = normalized.filter((file) => baselineDirty.has(file));
    const candidates = normalized.filter((file) => !baselineDirty.has(file));
    if (alreadyDirty.length) {
      const result = recordSkipped(context, alreadyDirty, "the path was already dirty when OpenCode started");
      if (!candidates.length && !context.allowEmpty) return result;
    }

    const nowStatus = readStatus(absoluteRoot);
    const indexChanges = [...nowStatus.staged];
    if (baselineStaged.size || indexChanges.length) {
      return recordSkipped(context, candidates, "the Git index already contains staged work; commit it first so this hook does not mix changes");
    }

    const changed = candidates.filter((file) => nowStatus.paths.has(file));
    if (changed.length) runGit(absoluteRoot, ["add", "-A", "--", ...changed]);

    const staged = readStatus(absoluteRoot).staged;
    const unexpected = [...staged].filter((file) => !changed.includes(file));
    if (unexpected.length) {
      return recordSkipped(context, changed, `unexpected staged paths were found: ${unexpected.join(", ")}`);
    }
    if (!changed.length && !context.allowEmpty) return { committed: false, hash: currentHash(), files: [], reason: "no file changes" };

    const stat = changed.length
      ? runGit(absoluteRoot, ["diff", "--cached", "--stat", "--", ...changed])
      : `No file changes; ${context.trigger || "message"} checkpoint.`;
    const label = changed.length === 1 ? path.basename(changed[0]) : `${changed.length} files`;
    const fallbackSubject = changed.length ? `opencode: update ${label}` : `opencode: ${context.trigger || "message checkpoint"}`;
    const subject = shortText(context.subject || fallbackSubject, 120);
    const body = [
      "Automated OpenCode checkpoint.",
      `Trigger: ${context.trigger || "completed assistant message"}`,
      changed.length ? `Files: ${changed.join(", ")}` : "Files: none",
      changed.length ? `Diff summary: ${stat.replace(/\r?\n/g, " | ")}` : "",
      "Details are recorded in the local .opencode/commit-journal.local.md file."
    ].filter(Boolean).join("\n\n");

    const name = tryGitConfig(absoluteRoot, "user.name");
    const email = tryGitConfig(absoluteRoot, "user.email");
    const commitFlags = context.allowEmpty ? ["--allow-empty"] : [];
    const args = name && email
      ? ["commit", ...commitFlags, "-m", subject, "-m", body]
      : ["-c", "user.name=OpenCode Auto Commit", "-c", "user.email=opencode-auto-commit@localhost", "commit", ...commitFlags, "-m", subject, "-m", body];

    try {
      runGit(absoluteRoot, args);
    } catch (error) {
      return recordSkipped(context, changed, `git commit failed: ${error.stderr?.toString().trim() || error.message}`);
    }

    const hash = currentHash();
    appendJournal({ hash, trigger: context.trigger, sessionId: context.sessionId, messageId: context.messageId, files: changed, change: stat, why: context.why });
    return { committed: true, hash, files: changed, change: stat };
  }

  function checkpoint(context = {}) {
    return commit([], { ...context, allowEmpty: true });
  }

  return { root: absoluteRoot, journalPath, baselineDirty, commit, checkpoint, appendJournal, currentHash };
}

function tryGitConfig(root, key) {
  try { return runGit(root, ["config", "--get", key]); }
  catch { return ""; }
}

module.exports = {
  JOURNAL_RELATIVE,
  findRepositoryRoot,
  normalizeFilePath,
  parsePorcelainStatus,
  createCommitter,
  shortText
};

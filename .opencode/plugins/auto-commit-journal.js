import journal from "../lib/auto-commit-journal.cjs";

const SERVICE = "auto-commit-journal";

function eventData(event) {
  return event?.properties || {};
}

function getMessageText(info) {
  if (typeof info?.text === "string") return info.text.trim();
  if (!Array.isArray(info?.parts)) return "";
  return info.parts
    .filter((part) => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function eventLogger(client, level, message, extra = {}) {
  try {
    const pending = client.app.log({
      body: { service: SERVICE, level, message, extra }
    });
    pending?.catch?.(() => {});
  } catch {
    // Logging must not interfere with editing or committing.
  }
}

export const AutoCommitJournal = async ({ directory, worktree, client }) => {
  const root = journal.findRepositoryRoot(worktree || directory);
  if (!root) {
    eventLogger(client, "warn", "No Git repository found; automatic commits are disabled.");
    return {};
  }

  let committer;
  try {
    committer = journal.createCommitter(root);
  } catch (error) {
    eventLogger(client, "error", "Could not initialize the commit journal.", { error: error.message });
    return {};
  }

  const latestPromptBySession = new Map();
  const textByMessage = new Map();
  const userMessageInfo = new Map();
  const partsSeen = new Set();
  const completedMessages = new Set();
  const checkpointedUserMessages = new Set();
  let latestUserPrompt = "";

  function messageKey(sessionID, messageID) {
    return `${sessionID || "unknown"}:${messageID || "unknown"}`;
  }

  function checkpointUserMessage(info, entry, key) {
    if (checkpointedUserMessages.has(key)) return;
    checkpointedUserMessages.add(key);
    userMessageInfo.delete(key);
    textByMessage.delete(key);
    partsSeen.delete(key);
    try {
      const result = committer.checkpoint({
        trigger: "user message received",
        sessionId: info.sessionID,
        messageId: info.id,
        subject: "opencode: user message checkpoint",
        why: entry.text
          ? `User message: ${entry.text.slice(0, 1200)}`
          : "User message contained no text part; OpenCode still recorded a message checkpoint."
      });
      if (result.committed) {
        eventLogger(client, "info", "Created a user-message checkpoint.", { hash: result.hash, messageId: info.id });
      } else if (result.reason) {
        eventLogger(client, "warn", "Skipped a user-message checkpoint.", { reason: result.reason, messageId: info.id });
      }
    } catch (error) {
      eventLogger(client, "error", "Could not create a user-message checkpoint.", { error: error.message, messageId: info.id });
    }
  }

  function updateText(part) {
    if (!part?.messageID) return;
    const key = messageKey(part.sessionID, part.messageID);
    if (checkpointedUserMessages.has(key) || completedMessages.has(key)) return;
    const entry = textByMessage.get(key) || { role: "", text: "" };
    if (typeof part.text === "string") entry.text = part.text.trim().slice(0, 1200);
    textByMessage.set(key, entry);
    partsSeen.add(key);
    if (entry.role === "user" && entry.text) {
      latestPromptBySession.set(part.sessionID, entry.text);
      latestUserPrompt = entry.text;
    }
    const info = userMessageInfo.get(key);
    if (info && entry.role === "user") checkpointUserMessage(info, entry, key);
  }

  async function commitFile(file, trigger, sessionID) {
    const normalized = journal.normalizeFilePath(root, file);
    if (!normalized) return;
    try {
      const result = committer.commit([normalized], {
        trigger,
        sessionId: sessionID,
        subject: `opencode: update ${normalized}`,
        why: latestPromptBySession.get(sessionID) || latestUserPrompt || "The user requested this file change; no prompt text was available in the OpenCode event."
      });
      if (result.committed) {
        eventLogger(client, "info", "Committed an OpenCode file edit.", {
          hash: result.hash,
          files: result.files,
          trigger
        });
      } else if (result.reason && result.reason !== "no file changes") {
        eventLogger(client, "warn", "Skipped an OpenCode file edit commit.", {
          reason: result.reason,
          files: result.files
        });
      }
    } catch (error) {
      eventLogger(client, "error", "Could not commit an OpenCode file edit.", { file: normalized, error: error.message });
    }
  }

  return {
    event: async ({ event }) => {
      const props = eventData(event);

      if (event.type === "message.part.updated") {
        updateText(props.part);
        return;
      }

      if (event.type === "message.updated") {
        const info = props.info;
        if (!info?.id || !info?.sessionID) return;
        const key = messageKey(info.sessionID, info.id);
        if (checkpointedUserMessages.has(key) || completedMessages.has(key)) return;
        const entry = textByMessage.get(key) || { role: "", text: "" };
        entry.role = info.role || entry.role;
        const text = getMessageText(info);
        if (text) entry.text = text.slice(0, 1200);
        textByMessage.set(key, entry);
        if (entry.role === "user" && entry.text) {
          latestPromptBySession.set(info.sessionID, entry.text);
          latestUserPrompt = entry.text;
        }

        if (entry.role === "user" && !checkpointedUserMessages.has(key)) {
          if (entry.text || partsSeen.has(key)) checkpointUserMessage(info, entry, key);
          else userMessageInfo.set(key, info);
          return;
        }

        if (entry.role !== "assistant" || !info.time?.completed) return;
        if (completedMessages.has(key)) return;
        completedMessages.add(key);

        const assistantSummary = entry.text ? `Assistant response: ${entry.text.slice(0, 700)}` : "Assistant response completed.";
        const userPrompt = latestPromptBySession.get(info.sessionID);
        const why = [userPrompt ? `User request: ${userPrompt}` : "User request text was unavailable.", assistantSummary].join("\n\n");
        try {
          const result = committer.checkpoint({
            trigger: "completed assistant message",
            sessionId: info.sessionID,
            messageId: info.id,
            subject: "opencode: completed assistant message",
            why
          });
          if (result.committed) {
            eventLogger(client, "info", "Created an assistant-message checkpoint.", { hash: result.hash, files: result.files });
          } else if (result.reason && result.reason !== "no file changes") {
            eventLogger(client, "warn", "Skipped an assistant-message checkpoint.", { reason: result.reason });
          }
          textByMessage.delete(key);
        } catch (error) {
          eventLogger(client, "error", "Could not create an assistant-message checkpoint.", { error: error.message });
        }
        return;
      }

      if (event.type === "file.edited") {
        await commitFile(props.file, "file.edited", props.sessionID);
        return;
      }

      if (event.type === "file.watcher.updated" && ["change", "rename"].includes(props.event)) {
        await commitFile(props.file, "file.watcher.updated", props.sessionID);
      }
    }
  };
};

export default AutoCommitJournal;

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { spawn } = require("node:child_process");

const candidates = [
  process.env.CHROME_PATH,
  process.env.CHROME_BIN,
  "C:\\Users\\kaush\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1200\\chrome-headless-shell-win64\\chrome-headless-shell.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].filter(Boolean);
const chromePath = candidates.find((candidate) => fs.existsSync(candidate));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("browser flow gates coach analysis, records problems, and completes a spaced review", {
  skip: !chromePath && !process.env.CI ? "Set CHROME_PATH to run the headless browser workflow test" : false
}, async (t) => {
  if (!chromePath) throw new Error("Chromium is required in CI; set CHROME_PATH to its executable.");
  assert.equal(typeof WebSocket, "function", "Node must provide WebSocket for Chrome DevTools Protocol");
  const root = path.resolve(__dirname, "..");
  const tempRoot = path.resolve(os.tmpdir());
  const profilePath = fs.mkdtempSync(path.join(tempRoot, "cp-workspace-browser-"));
  const child = spawn(chromePath, [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-allow-origins=*",
    "--remote-debugging-port=0",
    `--user-data-dir=${profilePath}`,
    "about:blank"
  ], { stdio: ["ignore", "ignore", "pipe"] });

  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  let socket;
  t.after(async () => {
    socket?.close();
    if (child.exitCode === null) child.kill();
    await Promise.race([new Promise((resolve) => child.once("exit", resolve)), wait(1500)]);
    const absoluteProfile = path.resolve(profilePath);
    const allowedPrefix = `${tempRoot}${path.sep}`;
    const safe = process.platform === "win32"
      ? absoluteProfile.toLowerCase().startsWith(allowedPrefix.toLowerCase())
      : absoluteProfile.startsWith(allowedPrefix);
    assert.equal(safe, true, "temporary browser profile must stay inside the OS temp directory");
    fs.rmSync(absoluteProfile, { recursive: true, force: true });
  });

  const browserUrl = await new Promise((resolve, reject) => {
    const deadline = Date.now() + 12000;
    const poll = () => {
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) return resolve(match[1]);
      if (child.exitCode !== null) return reject(new Error(`Chromium exited early: ${stderr}`));
      if (Date.now() >= deadline) return reject(new Error(`Chromium did not expose DevTools: ${stderr}`));
      setTimeout(poll, 50);
    };
    poll();
  });

  socket = new WebSocket(browserUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const exceptions = [];
  socket.addEventListener("message", (message) => {
    const data = JSON.parse(message.data);
    if (data.method === "Runtime.exceptionThrown") exceptions.push(data.params.exceptionDetails.text);
    if (!data.id) return;
    const operation = pending.get(data.id);
    if (!operation) return;
    pending.delete(data.id);
    clearTimeout(operation.timeout);
    if (data.error) operation.reject(new Error(data.error.message));
    else operation.resolve(data.result || {});
  });

  function send(method, params = {}, sessionId) {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`DevTools command timed out: ${method}`));
      }, 10000);
      pending.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Runtime.enable", {}, sessionId);
  await send("Page.enable", {}, sessionId);

  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    }, sessionId);
    if (response.result?.subtype === "error") throw new Error(response.result.description);
    return response.result?.value;
  }

  async function until(expression, description) {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (await evaluate(expression)) return;
      await wait(50);
    }
    throw new Error(`Timed out waiting for ${description}`);
  }

  const pageUrl = pathToFileURL(path.join(root, "cp-workspace.html")).href;
  await send("Page.navigate", { url: pageUrl }, sessionId);
  await until("document.readyState === 'complete' && !!window.CPWorkspaceCore && !!document.getElementById('modeToggle')", "workspace initialization");
  await until("document.getElementById('saveStatus').textContent.startsWith('Ready') || document.getElementById('saveStatus').textContent.startsWith('Saved on this device')", "local library load");

  assert.equal(await evaluate("document.body.dataset.view"), "learner");
  assert.equal(await evaluate("document.getElementById('sectionNav').hidden"), true);
  await evaluate("document.getElementById('modeToggle').click()");
  assert.equal(await evaluate("document.body.dataset.view"), "learner", "coach analysis stays gated until an attempt is saved");

  const firstNotes = "I tried sorting and checking adjacent pairs, then tested a duplicate case.";
  await evaluate(`(() => { const input = document.getElementById('attemptNotes'); input.value = ${JSON.stringify(firstNotes)}; input.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('recordAttemptButton').click(); })()`);
  await until("document.getElementById('attemptHistory').textContent.includes('Unsolved')", "first attempt record");
  await evaluate("document.getElementById('modeToggle').click()");
  assert.equal(await evaluate("document.body.dataset.view"), "coach");
  assert.equal(await evaluate("document.getElementById('coachPanel').hidden"), false);

  await evaluate("document.getElementById('newProblemButton').click()");
  await until("document.getElementById('libraryCount').textContent === '2'", "second problem creation");
  assert.equal(await evaluate("document.body.dataset.view"), "learner", "a new problem returns to the cold-attempt view");

  const secondNotes = "I estimated the direct simulation cost and wrote down the invariant to test.";
  await evaluate(`(() => { const input = document.getElementById('attemptNotes'); input.value = ${JSON.stringify(secondNotes)}; input.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('recordAttemptButton').click(); })()`);
  await until("document.getElementById('attemptHistory').textContent.includes('Unsolved')", "second attempt record");
  await evaluate("document.getElementById('modeToggle').click()");
  await evaluate(`(() => {
    const values = { nearMissProblem: 'A predicate is true in the middle and false at both ends.', nearMissQuestionCoach: 'Why is binary search on this predicate unsafe?', nearMissReason: 'Feasibility is not monotone, so binary search can discard the only valid region.' };
    for (const [id, value] of Object.entries(values)) {
      const input = document.getElementById(id);
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await wait(400);
  await evaluate("document.getElementById('modeToggle').click()");
  assert.equal(await evaluate("document.getElementById('nearMissPractice').hidden"), false);
  await evaluate(`(() => {
    document.getElementById('nearMissResponse').value = 'The true values are not a prefix or suffix, so monotonicity fails.';
    document.getElementById('distinguishedNearMiss').checked = true;
    document.getElementById('recordAttemptButton').click();
  })()`);
  await until("!document.getElementById('nearMissFeedback').hidden", "contrastive response feedback");
  assert.match(await evaluate("document.getElementById('nearMissFeedback').textContent"), /Feasibility is not monotone/);
  await evaluate("document.getElementById('modeToggle').click()");
  await evaluate("document.getElementById('addPatternButton').click()");
  await until("!!document.querySelector('[data-pattern-entry] input[data-card-field=\\\"name\\\"]')", "pattern card editor");
  await evaluate(`(() => {
    const values = { name: 'Check the invariant', trigger: 'The greedy choice looks locally optimal.', recovery: 'State and prove the invariant before coding.' };
    for (const [key, value] of Object.entries(values)) {
      const input = document.querySelector('[data-pattern-entry] [data-card-field="' + key + '"]');
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    document.querySelector('[data-queue-card]').click();
  })()`);
  await until("document.getElementById('dueCount').textContent === '1'", "card added to today’s review queue");
  assert.match(await evaluate("document.getElementById('graphNodeList').textContent"), /Check the invariant/);
  await evaluate("document.getElementById('reviewButton').click()");
  assert.equal(await evaluate("document.getElementById('reviewDialog').open"), true);
  await evaluate(`(() => { document.getElementById('reviewRecall').value = 'I would prove the invariant before trusting the greedy step.'; document.getElementById('revealRecoveryButton').click(); document.getElementById('reviewQuality').value = '4'; document.getElementById('saveReviewButton').click(); })()`);
  await until("document.getElementById('reviewProgress').textContent.includes('Completed 1 due review')", "review event and next interval");
  assert.equal(await evaluate("document.getElementById('dueCount').textContent"), "0");
  assert.deepEqual(exceptions, [], "page interactions should not throw runtime exceptions");
});

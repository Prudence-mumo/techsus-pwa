// Checks the "Ready for Review" items CI can verify, ticks/unticks them in the
// PR description, and fails if the PR is ready for review with anything unticked.

const SELF_CHECK_NAME = "Ready for Review checklist";
const CI_WAIT_MS = 10 * 60 * 1000;
const CI_POLL_MS = 20 * 1000;
const CI_START_DELAY_MS = 30 * 1000;

const ITEMS = {
  ci: "All CI checks pass",
  media: "Recording and screenshots",
  figma: "Figma design screenshots and link",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function stripComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, "");
}

// Returns the text under a heading, up to the next heading.
function section(body, name) {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) =>
    new RegExp(`^#{1,6}\\s+${escapeRegExp(name)}`, "i").test(line),
  );
  if (start === -1) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^#{1,6}\s/.test(line));
  return stripComments((end === -1 ? rest : rest.slice(0, end)).join("\n"));
}

function countImages(text) {
  const markdown = text.match(/!\[[^\]]*\]\([^)]+\)/g) || [];
  const html = text.match(/<img\s[^>]*src=/gi) || [];
  return markdown.length + html.length;
}

function hasVideo(text) {
  // GitHub turns uploaded videos into a bare user-attachments URL on its own line.
  const bareAttachment =
    /^\s*https:\/\/github\.com\/user-attachments\/assets\/[\w-]+\s*$/m;
  const videoFile = /https?:\/\/\S+\.(mp4|mov|webm)\b/i;
  const videoHosts =
    /https?:\/\/(www\.)?(loom\.com|youtu\.be|youtube\.com|drive\.google\.com)\//i;
  return (
    bareAttachment.test(text) ||
    videoFile.test(text) ||
    videoHosts.test(text) ||
    /<video\s/i.test(text)
  );
}

function checkMedia(body) {
  const text = section(body, "Screenshots & Recordings");
  const images = countImages(text);
  const problems = [];
  if (!hasVideo(text)) problems.push("no recording found");
  if (images < 2)
    problems.push(`${images} screenshot(s) found, need at least 2`);
  return {
    ok: problems.length === 0,
    detail: problems.join("; ") || `recording + ${images} screenshots`,
  };
}

function checkFigma(body) {
  const text = section(body, "Figma Designs");
  const hasLink = /https:\/\/(www\.)?figma\.com\/\S+/i.test(text);
  const images = countImages(text);
  const problems = [];
  if (!hasLink) problems.push("no figma.com link found");
  if (images < 1) problems.push("no Figma screenshot found");
  return {
    ok: problems.length === 0,
    detail: problems.join("; ") || `link + ${images} screenshot(s)`,
  };
}

async function getCiState({ github, owner, repo, sha }) {
  const runs = await github.paginate(github.rest.checks.listForRef, {
    owner,
    repo,
    ref: sha,
    per_page: 100,
  });

  // Keep only the latest run of each check, and ignore this check itself.
  const latest = new Map();
  for (const run of runs) {
    if (run.name === SELF_CHECK_NAME) continue;
    const previous = latest.get(run.name);
    if (!previous || run.id > previous.id) latest.set(run.name, run);
  }

  const pending = [];
  const failed = [];
  for (const run of latest.values()) {
    if (run.status !== "completed") pending.push(run.name);
    else if (!["success", "skipped", "neutral"].includes(run.conclusion))
      failed.push(run.name);
  }

  const { data: combined } = await github.rest.repos.getCombinedStatusForRef({
    owner,
    repo,
    ref: sha,
  });
  for (const status of combined.statuses) {
    if (status.state === "pending") pending.push(status.context);
    else if (status.state !== "success") failed.push(status.context);
  }

  return { total: latest.size + combined.statuses.length, pending, failed };
}

async function checkCi({ github, core, owner, repo, sha, wait }) {
  if (wait) await sleep(CI_START_DELAY_MS);

  const deadline = Date.now() + CI_WAIT_MS;
  let state = await getCiState({ github, owner, repo, sha });
  while (wait && state.pending.length > 0 && Date.now() < deadline) {
    core.info(`Waiting for CI checks: ${state.pending.join(", ")}`);
    await sleep(CI_POLL_MS);
    state = await getCiState({ github, owner, repo, sha });
  }

  if (state.failed.length > 0)
    return { ok: false, detail: `failed: ${state.failed.join(", ")}` };
  if (state.pending.length > 0)
    return { ok: false, detail: `still running: ${state.pending.join(", ")}` };
  if (state.total === 0)
    return { ok: true, detail: "no other CI checks configured yet" };
  return { ok: true, detail: `${state.total} check(s) passed` };
}

function setBox(body, label, checked) {
  const pattern = new RegExp(
    `^(\\s*[-*] \\[)[ xX](\\]\\s*(?:🤖\\s*)?${escapeRegExp(label)})`,
    "m",
  );
  return body.replace(pattern, `$1${checked ? "x" : " "}$2`);
}

function uncheckedReadyItems(body) {
  return section(body, "Ready for Review")
    .split("\n")
    .filter((line) => /^\s*[-*] \[ \]/.test(line))
    .map((line) => line.replace(/^\s*[-*] \[ \]\s*/, ""));
}

module.exports = async ({ github, context, core }) => {
  const { owner, repo } = context.repo;
  const number = context.payload.pull_request.number;
  const { data: startPr } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: number,
  });

  const ci = await checkCi({
    github,
    core,
    owner,
    repo,
    sha: startPr.head.sha,
    wait: !startPr.draft,
  });

  // Re-read the PR in case the description changed while waiting for CI.
  const { data: pr } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: number,
  });
  const original = pr.body || "";

  if (!/^#{1,6}\s+Ready for Review/im.test(original)) {
    core.setFailed(
      'The "Ready for Review" section is missing from the PR description. Please use the PR template.',
    );
    return;
  }

  const results = {
    ci,
    media: checkMedia(original),
    figma: checkFigma(original),
  };

  let body = original;
  for (const [key, label] of Object.entries(ITEMS)) {
    body = setBox(body, label, results[key].ok);
  }
  if (body !== original) {
    await github.rest.pulls.update({ owner, repo, pull_number: number, body });
    core.info("Updated the Ready for Review checklist in the PR description.");
  }

  await core.summary
    .addHeading("Ready for Review checklist")
    .addTable([
      [
        { data: "Item", header: true },
        { data: "Result", header: true },
        { data: "Details", header: true },
      ],
      ...Object.entries(ITEMS).map(([key, label]) => [
        label,
        results[key].ok ? "✅" : "❌",
        results[key].detail,
      ]),
    ])
    .write();

  if (pr.draft) {
    core.info("PR is still a draft, so unticked items do not fail the check.");
    return;
  }

  const unchecked = uncheckedReadyItems(body);
  if (unchecked.length > 0) {
    const reasons = Object.entries(ITEMS)
      .filter(([key]) => !results[key].ok)
      .map(([key, label]) => `  - ${label}: ${results[key].detail}`);
    core.setFailed(
      "This PR was marked as ready for review, but these items are not done yet:\n" +
        unchecked.map((item) => `  - ${item}`).join("\n") +
        (reasons.length ? `\n\nWhat CI found:\n${reasons.join("\n")}` : "") +
        "\n\nComplete them (or convert the PR back to draft) before requesting review.",
    );
    return;
  }

  core.info("All Ready for Review items are checked.");
};

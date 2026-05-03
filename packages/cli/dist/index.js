#!/usr/bin/env node

// src/index.ts
import { readFileSync } from "fs";
import { mkdir as mkdir2, readFile as readFile2, writeFile as writeFile2 } from "fs/promises";
import path2 from "path";
import process2 from "process";
import { createInterface } from "readline/promises";
import {
  acceptApproval,
  addInput,
  addManagedSource,
  addWatchedRoot,
  archiveCandidate,
  autoCommitWikiChanges,
  benchmarkVault,
  blastRadiusVault,
  buildContextPack,
  buildGraphShareArtifact,
  compileVault,
  consolidateVault,
  createSupersessionEdge,
  deleteContextPack,
  deleteManagedSource,
  doctorRetrieval,
  doctorVault,
  downloadWhisperModel,
  explainGraphVault,
  exploreVault,
  exportGraphFormat,
  exportGraphHtml,
  exportGraphReportHtml,
  exportObsidianCanvas,
  exportObsidianVault,
  finishMemoryTask,
  getGitHookStatus,
  getRetrievalStatus,
  getWatchStatus,
  graphDiff,
  guideManagedSource,
  guideSourceScope,
  importInbox,
  ingestDirectory,
  ingestInputDetailed,
  initVault,
  installAgent,
  installGitHooks,
  lintVault,
  listApprovals,
  listCandidates,
  listContextPacks,
  listGodNodes,
  listManagedSourceRecords,
  listManifests,
  listMemoryTasks,
  listSchedules,
  listWatchedRoots,
  loadVaultConfig,
  pathGraphVault,
  previewCandidatePromotions,
  promoteCandidate,
  pushGraphNeo4j,
  queryGraphVault,
  queryVault,
  readApproval,
  readContextPack,
  readGraphReport,
  readMemoryTask,
  rebuildRetrievalIndex,
  refreshGraphClusters,
  registerLocalWhisperProvider,
  rejectApproval,
  reloadManagedSources,
  removeWatchedRoot,
  renderContextPackLlms,
  renderContextPackMarkdown,
  renderGraphShareBundleFiles,
  renderGraphShareMarkdown,
  renderGraphShareSvg,
  resumeMemoryTask,
  resumeSourceSession,
  reviewManagedSource,
  reviewSourceScope,
  runAutoPromotion,
  runMigration,
  runSchedule,
  runWatchCycle,
  serveSchedules,
  startGraphServer,
  startMcpServer,
  startMemoryTask,
  summarizeLocalWhisperSetup,
  uninstallGitHooks,
  updateMemoryTask,
  watchVault
} from "@swarmvaultai/engine";
import { Command, Option } from "commander";

// src/notices.ts
import { spawn } from "child_process";
import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
var NOTICE_CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
var HEURISTIC_NOTICE_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
var NOTICE_TIMEOUT_MS = 2e3;
var STAR_URL = "https://github.com/swarmclawai/swarmvault";
var NPM_PACKAGE = "@swarmvaultai/cli";
var SUPPRESSED_COMMANDS = /* @__PURE__ */ new Set(["graph serve", "mcp", "schedule serve", "watch"]);
var HEURISTIC_NOTICE_MESSAGE = [
  "SwarmVault is using the heuristic analyzer for compile/query.",
  "For much sharper concepts, entities, and summaries, configure an LLM provider.",
  "Recommended local setup:",
  "  ollama pull gemma4",
  "then add to swarmvault.config.json:",
  '  "providers": { "llm": { "type": "ollama", "model": "gemma4" } },',
  '  "tasks": { "compileProvider": "llm", "queryProvider": "llm" }',
  "You can also configure openai, anthropic, gemini, openrouter, groq, together, xai,",
  "cerebras, or any openai-compatible endpoint as a provider.",
  "Set SWARMVAULT_NO_NOTICES=1 to hide this notice."
].join("\n");
function resolveCliStatePath(env = process.env) {
  const override = env.SWARMVAULT_CLI_STATE_PATH?.trim();
  if (override) {
    return path.resolve(override);
  }
  const homeDir = os.homedir();
  if (!homeDir) {
    return null;
  }
  return path.join(homeDir, ".swarmvault", "cli-state.json");
}
function shouldEmitCliNotices(options) {
  const env = options.env ?? process.env;
  if (options.json) {
    return false;
  }
  if (env.SWARMVAULT_NO_NOTICES === "1") {
    return false;
  }
  if (Boolean(env.CI) && env.CI !== "0") {
    return false;
  }
  if (!(options.stdoutIsTTY ?? process.stdout.isTTY) || !(options.stderrIsTTY ?? process.stderr.isTTY)) {
    return false;
  }
  const commandKey = options.commandPath.join(" ").trim();
  return !SUPPRESSED_COMMANDS.has(commandKey);
}
async function collectHeuristicProviderNotice(options) {
  if (!shouldEmitCliNotices({
    commandPath: options.commandPath ?? ["compile"],
    currentVersion: "",
    json: options.json,
    env: options.env,
    stderrIsTTY: options.stderrIsTTY,
    stdoutIsTTY: options.stdoutIsTTY
  })) {
    return null;
  }
  const env = options.env ?? process.env;
  const statePath = options.statePath ?? resolveCliStatePath(env);
  if (!statePath) {
    return null;
  }
  const state = await readNoticeState(statePath);
  const now = options.now ?? /* @__PURE__ */ new Date();
  const lastMs = state.lastHeuristicNoticeAt ? Date.parse(state.lastHeuristicNoticeAt) : Number.NaN;
  const dueForReminder = !Number.isFinite(lastMs) || now.getTime() - lastMs >= HEURISTIC_NOTICE_TTL_MS;
  if (!dueForReminder) {
    return null;
  }
  const nextState = { ...state, lastHeuristicNoticeAt: now.toISOString() };
  await writeNoticeState(statePath, nextState);
  return HEURISTIC_NOTICE_MESSAGE;
}
async function collectCliNotices(options) {
  if (!shouldEmitCliNotices(options)) {
    return [];
  }
  const env = options.env ?? process.env;
  const statePath = options.statePath ?? resolveCliStatePath(env);
  if (!statePath) {
    return [];
  }
  const state = await readNoticeState(statePath);
  const nextState = { ...state };
  const notices = [];
  const now = options.now ?? /* @__PURE__ */ new Date();
  const nowMs = now.getTime();
  if (!state.starPromptShown) {
    notices.push(`If SwarmVault is useful, star the repo: ${STAR_URL}`);
    nextState.starPromptShown = true;
  }
  const lastCheckMs = state.lastUpdateCheckAt ? Date.parse(state.lastUpdateCheckAt) : Number.NaN;
  const shouldCheckUpdates = !Number.isFinite(lastCheckMs) || nowMs - lastCheckMs >= NOTICE_CACHE_TTL_MS;
  if (shouldCheckUpdates) {
    const fetchLatestVersion = options.fetchLatestVersion ?? (() => fetchLatestCliVersion(env));
    const latestVersion = await fetchLatestVersion().catch(() => null);
    nextState.lastUpdateCheckAt = now.toISOString();
    if (latestVersion) {
      nextState.lastSeenLatestVersion = latestVersion;
      if (isVersionNewer(latestVersion, options.currentVersion)) {
        notices.unshift(
          `Update available: ${latestVersion} (current ${options.currentVersion}). Upgrade with: npm install -g ${NPM_PACKAGE}@latest`
        );
      }
    }
  }
  await writeNoticeState(statePath, nextState);
  return notices;
}
async function readNoticeState(statePath) {
  try {
    const raw = await readFile(statePath, "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}
async function writeNoticeState(statePath, state) {
  try {
    await mkdir(path.dirname(statePath), { recursive: true });
    await writeFile(statePath, `${JSON.stringify(state, null, 2)}
`, "utf8");
  } catch {
  }
}
async function fetchLatestCliVersion(env) {
  return await new Promise((resolve) => {
    const child = spawn("npm", ["view", NPM_PACKAGE, "version", "--json"], {
      env: {
        ...process.env,
        ...env,
        npm_config_audit: "false",
        npm_config_fund: "false",
        npm_config_update_notifier: "false"
      },
      stdio: ["ignore", "pipe", "ignore"]
    });
    const chunks = [];
    let settled = false;
    const finish = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      resolve(value);
    };
    child.stdout.on("data", (chunk) => {
      chunks.push(chunk);
    });
    child.on("error", () => {
      finish(null);
    });
    child.on("exit", (code) => {
      if (code !== 0) {
        finish(null);
        return;
      }
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        finish(null);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        finish(typeof parsed === "string" && parsed.trim() ? parsed.trim() : null);
      } catch {
        finish(raw.replace(/^"+|"+$/g, "").trim() || null);
      }
    });
    const timeoutId = setTimeout(() => {
      child.kill("SIGKILL");
      finish(null);
    }, NOTICE_TIMEOUT_MS);
  });
}
function isVersionNewer(candidate2, current) {
  return compareVersions(candidate2, current) > 0;
}
function compareVersions(left, right) {
  const leftParts = normalizeVersion(left);
  const rightParts = normalizeVersion(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  }
  return 0;
}
function normalizeVersion(version) {
  const match = version.trim().match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) {
    return [0];
  }
  return match.slice(1).map((segment) => Number.parseInt(segment ?? "0", 10) || 0);
}

// src/index.ts
var program = new Command();
var CLI_VERSION = readCliVersion();
var activeCommand = null;
program.name("swarmvault").description("SwarmVault is a local-first knowledge compiler with graph outputs and optional provider-backed workflows.").version(CLI_VERSION).enablePositionalOptions().option("--json", "Emit structured JSON output", false);
function readCliVersion() {
  try {
    const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    return typeof packageJson.version === "string" && packageJson.version.trim() ? packageJson.version : "3.5.0";
  } catch {
    return "3.5.0";
  }
}
function parsePositiveInt(value, fallback) {
  if (value === void 0) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function parsePositiveNumber(value) {
  if (value === void 0) return void 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : void 0;
}
function collectRepeated(value, previous) {
  return [...previous, value];
}
function sourceScopeFromManifests(input, manifests) {
  if (!manifests.length) {
    return null;
  }
  const primary = manifests[0];
  return {
    id: primary?.sourceGroupId ?? primary?.sourceId ?? slugForCli(input),
    title: primary?.sourceGroupTitle ?? primary?.title ?? input,
    sourceIds: manifests.map((manifest) => manifest.sourceId),
    kind: primary?.sourceKind
  };
}
function slugForCli(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "source";
}
function isJson() {
  return activeCommand?.opts().json === true || program.opts().json === true;
}
function summarizeRedactions(redactions) {
  if (!redactions || redactions.length === 0) {
    return void 0;
  }
  const totalMatches = redactions.reduce((total, entry) => total + entry.matches.reduce((sum, match) => sum + match.count, 0), 0);
  if (totalMatches === 0) {
    return void 0;
  }
  const secretsLabel = totalMatches === 1 ? "secret" : "secrets";
  const sourceLabel = redactions.length === 1 ? "source" : "sources";
  return `Redacted ${totalMatches} ${secretsLabel} across ${redactions.length} ${sourceLabel} (run --no-redact to disable).`;
}
function emitJson(data) {
  process2.stdout.write(`${JSON.stringify(data)}
`);
}
function log(message) {
  if (isJson()) {
    process2.stderr.write(`${message}
`);
  } else {
    process2.stdout.write(`${message}
`);
  }
}
async function writeShareBundle(bundlePath, files) {
  await mkdir2(bundlePath, { recursive: true });
  const bundleFiles = {
    markdownPath: path2.join(bundlePath, "share-card.md"),
    postPath: path2.join(bundlePath, "share-post.txt"),
    svgPath: path2.join(bundlePath, "share-card.svg"),
    previewHtmlPath: path2.join(bundlePath, "share-preview.html"),
    artifactJsonPath: path2.join(bundlePath, "share-artifact.json")
  };
  for (const file of files) {
    await writeFile2(path2.join(bundlePath, file.relativePath), file.content, "utf8");
  }
  return bundleFiles;
}
function emitNotice(message) {
  process2.stderr.write(`[swarmvault] ${message}
`);
}
async function maybeEmitHeuristicNotice(commandPath) {
  if (isJson()) {
    return;
  }
  try {
    const { config } = await loadVaultConfig(process2.cwd());
    const analysisTaskKeys = ["compileProvider", "queryProvider", "lintProvider"];
    const usingHeuristic = analysisTaskKeys.every((task2) => {
      const providerId = config.tasks[task2];
      const providerConfig = config.providers[providerId];
      return !providerConfig || providerConfig.type === "heuristic";
    });
    if (!usingHeuristic) {
      return;
    }
    const notice = await collectHeuristicProviderNotice({
      commandPath,
      json: isJson()
    });
    if (notice) {
      emitNotice(notice);
    }
  } catch {
  }
}
function canPromptGuide() {
  return Boolean(process2.stdin.isTTY && process2.stdout.isTTY && !isJson());
}
function readGuideAnswersFile(filePath) {
  if (!filePath) {
    return void 0;
  }
  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  if (Array.isArray(raw)) {
    return raw.filter((value) => typeof value === "string");
  }
  if (raw && typeof raw === "object") {
    return Object.fromEntries(
      Object.entries(raw).filter((entry) => typeof entry[0] === "string" && typeof entry[1] === "string")
    );
  }
  throw new Error("Guide answers files must contain either a JSON object keyed by question id or a JSON array of answers.");
}
async function promptGuideAnswers(questions) {
  const rl = createInterface({
    input: process2.stdin,
    output: process2.stdout
  });
  try {
    const answers = {};
    for (const question of questions) {
      const promptLines = [question.prompt];
      if (question.answer) {
        promptLines.push(`Current: ${question.answer}`);
        promptLines.push("Press Enter to keep the current answer.");
      }
      const answer = (await rl.question(`${promptLines.join("\n")}
> `)).trim();
      if (answer) {
        answers[question.id] = answer;
      } else if (question.answer) {
        answers[question.id] = question.answer;
      }
    }
    return answers;
  } finally {
    rl.close();
  }
}
async function completeGuideInteractively(guide, fallbackTarget) {
  if (!guide.awaitingInput || !canPromptGuide()) {
    return guide;
  }
  const answers = await promptGuideAnswers(guide.questions);
  return await resumeSourceSession(process2.cwd(), guide.sessionId || fallbackTarget, { answers });
}
function getCommandPath(command) {
  const names = [];
  let current = command;
  while (current) {
    const name = current.name();
    if (name && name !== "swarmvault") {
      names.unshift(name);
    }
    current = current.parent ?? null;
  }
  return names;
}
program.hook("postAction", async (_thisCommand, actionCommand) => {
  const notices = await collectCliNotices({
    commandPath: getCommandPath(actionCommand),
    currentVersion: CLI_VERSION,
    json: isJson()
  });
  for (const notice of notices) {
    emitNotice(notice);
  }
});
program.command("init").description("Initialize a SwarmVault workspace in the current directory.").option("--obsidian", "Generate a minimal .obsidian workspace alongside the vault", false).option(
  "--profile <profile>",
  "Starter workspace profile or comma-separated preset list (for example: personal-research or reader,timeline)"
).option(
  "--lite",
  "Minimal LLM-Wiki starter (raw/, wiki/, wiki/index.md, wiki/log.md, swarmvault.schema.md) without config, state, or agent installs",
  false
).action(async (options) => {
  await initVault(process2.cwd(), {
    obsidian: options.obsidian ?? false,
    profile: options.profile,
    lite: options.lite ?? false
  });
  if (isJson()) {
    emitJson({
      status: "initialized",
      rootDir: process2.cwd(),
      obsidian: options.obsidian ?? false,
      profile: options.profile ?? "default",
      lite: options.lite ?? false
    });
  } else {
    log(options.lite ? "Initialized SwarmVault lite workspace." : "Initialized SwarmVault workspace.");
  }
});
program.command("ingest").description("Ingest a local file path, directory path, or URL into the raw SwarmVault workspace.").argument("<input>", "Local file path, directory path, or URL").option("--review", "Stage a source review artifact after ingest and compile", false).option("--guide", "Stage a guided source integration bundle after ingest and compile (default: from config)").option("--no-guide", "Skip guided mode even if enabled in config").option("--answers-file <path>", "JSON file with guided-session answers keyed by question id or listed in prompt order").option("--include-assets", "Download remote image assets when ingesting URLs", true).option("--no-include-assets", "Skip downloading remote image assets when ingesting URLs").option("--max-asset-size <bytes>", "Maximum number of bytes to fetch for a single remote image asset").option("--repo-root <path>", "Override the detected repo root when ingesting a directory").option("--include <glob...>", "Only ingest files matching one or more glob patterns").option("--exclude <glob...>", "Skip files matching one or more glob patterns").option("--max-files <n>", "Maximum number of files to ingest from a directory").option("--include-third-party", "Also ingest repo files classified as third-party", false).option("--include-resources", "Also ingest repo files classified as resources", false).option("--include-generated", "Also ingest repo files classified as generated output", false).option("--no-gitignore", "Ignore .gitignore rules when ingesting a directory").option("--no-swarmvaultignore", "Ignore .swarmvaultignore rules when ingesting a directory").option("--video", "Treat a URL input as a public video and transcribe extracted audio", false).option("--resume <run-id>", "Re-run only the failed files from a prior ingest run id").option("--commit", "Auto-commit wiki and state changes after ingest").option("--no-redact", "Skip PII/secret redaction for this run (overrides config)").action(
  async (input, options) => {
    const guideAnswers = readGuideAnswersFile(options.answersFile);
    const vaultConfig = await loadVaultConfig(process2.cwd()).catch(() => null);
    const guideEnabled = options.guide ?? vaultConfig?.config.profile.guidedIngestDefault ?? false;
    const maxAssetSize = typeof options.maxAssetSize === "string" && options.maxAssetSize.trim() ? parsePositiveInt(options.maxAssetSize, 0) || void 0 : void 0;
    const maxFiles = typeof options.maxFiles === "string" && options.maxFiles.trim() ? parsePositiveInt(options.maxFiles, 0) || void 0 : void 0;
    const extractClasses = [
      "first_party",
      ...options.includeThirdParty ? ["third_party"] : [],
      ...options.includeResources ? ["resource"] : [],
      ...options.includeGenerated ? ["generated"] : []
    ];
    const commonOptions = {
      includeAssets: options.includeAssets,
      maxAssetSize,
      repoRoot: options.repoRoot,
      include: options.include,
      exclude: options.exclude,
      maxFiles,
      gitignore: options.gitignore,
      swarmvaultignore: options.swarmvaultignore,
      video: options.video,
      extractClasses,
      resume: options.resume,
      redact: options.redact
    };
    const directoryResult = !/^https?:\/\//i.test(input) ? await import("fs/promises").then(
      (fs) => fs.stat(input).then((stat) => stat.isDirectory() ? ingestDirectory(process2.cwd(), input, commonOptions) : null).catch(() => null)
    ) : null;
    if (directoryResult) {
      const scope2 = options.review || guideEnabled ? await (async () => {
        const pathModule = await import("path");
        const absoluteInput = pathModule.resolve(process2.cwd(), input);
        const sourceIds = (await listManifests(process2.cwd())).filter((manifest) => {
          if (!manifest.originalPath) {
            return false;
          }
          const relative = pathModule.relative(absoluteInput, pathModule.resolve(manifest.originalPath));
          return relative === "" || !relative.startsWith("..") && !pathModule.isAbsolute(relative);
        }).map((manifest) => manifest.sourceId);
        return sourceIds.length ? {
          id: `directory-${absoluteInput.split(pathModule.sep).pop() ?? "source"}`,
          title: absoluteInput.split(pathModule.sep).pop() ?? absoluteInput,
          sourceIds,
          kind: "directory"
        } : void 0;
      })() : void 0;
      const shouldStage = Boolean(scope2 && (directoryResult.imported.length || directoryResult.updated.length));
      const review3 = shouldStage && options.review && !guideEnabled ? await (async () => {
        await compileVault(process2.cwd(), {});
        return await reviewSourceScope(process2.cwd(), scope2);
      })() : void 0;
      const guide2 = shouldStage && guideEnabled ? await (async () => {
        await compileVault(process2.cwd(), {});
        return await guideSourceScope(process2.cwd(), scope2, { answers: guideAnswers });
      })() : void 0;
      const completedGuide2 = guide2 && !options.answersFile ? await completeGuideInteractively(guide2, scope2?.id ?? input) : guide2;
      if (isJson()) {
        emitJson(
          completedGuide2 ? { ingest: directoryResult, guide: completedGuide2 } : review3 ? { ingest: directoryResult, review: review3 } : directoryResult
        );
      } else {
        const failedCount = directoryResult.failed?.length ?? 0;
        log(
          `Imported ${directoryResult.imported.length} file(s), updated ${directoryResult.updated.length}, skipped ${directoryResult.skipped.length}, failed ${failedCount}.`
        );
        if (failedCount && directoryResult.runId) {
          log(`Run id: ${directoryResult.runId}`);
          log(`Retry with: swarmvault ingest ${input} --resume ${directoryResult.runId}`);
          for (const failure of (directoryResult.failed ?? []).slice(0, 5)) {
            log(`  failed ${failure.stage}: ${failure.path}: ${failure.error}`);
          }
          if (failedCount > 5) log(`  ... ${failedCount - 5} more`);
        }
        if (review3) {
          log(`Staged source review at ${review3.reviewPath}.`);
        }
        if (completedGuide2?.awaitingInput) {
          log(
            `Created guided session at ${completedGuide2.sessionPath}. Resume with \`swarmvault source session ${completedGuide2.sessionId}\`.`
          );
        } else if (completedGuide2?.guidePath) {
          log(`Staged guided session at ${completedGuide2.guidePath}.`);
        }
        const redactionLine = summarizeRedactions(directoryResult.redactions);
        if (redactionLine) {
          log(redactionLine);
        }
      }
      if (options.commit) {
        const msg = await autoCommitWikiChanges(process2.cwd(), "ingest", input, { force: true });
        if (msg && !isJson()) log(`Committed: ${msg}`);
      }
      return;
    }
    const ingest = await ingestInputDetailed(process2.cwd(), input, commonOptions);
    const scope = sourceScopeFromManifests(input, [...ingest.created, ...ingest.updated, ...ingest.unchanged]);
    const review2 = options.review && !guideEnabled && scope && (ingest.created.length || ingest.updated.length || ingest.unchanged.length) ? await (async () => {
      await compileVault(process2.cwd(), {});
      return await reviewSourceScope(process2.cwd(), scope);
    })() : void 0;
    const guide = guideEnabled && scope && (ingest.created.length || ingest.updated.length || ingest.unchanged.length) ? await (async () => {
      await compileVault(process2.cwd(), {});
      return await guideSourceScope(process2.cwd(), scope, { answers: guideAnswers });
    })() : void 0;
    const completedGuide = guide && !options.answersFile ? await completeGuideInteractively(guide, scope?.id ?? input) : guide;
    if (isJson()) {
      emitJson(completedGuide ? { ingest, guide: completedGuide } : review2 ? { ingest, review: review2 } : ingest);
    } else {
      const primary = [...ingest.created, ...ingest.updated, ...ingest.unchanged][0];
      if (ingest.created.length + ingest.updated.length + ingest.removed.length <= 1 && primary) {
        log(primary.sourceId);
      } else {
        log(
          `Created ${ingest.created.length}, updated ${ingest.updated.length}, unchanged ${ingest.unchanged.length}, removed ${ingest.removed.length}.`
        );
      }
      if (review2) {
        log(`Staged source review at ${review2.reviewPath}.`);
      }
      if (completedGuide?.awaitingInput) {
        log(
          `Created guided session at ${completedGuide.sessionPath}. Resume with \`swarmvault source session ${completedGuide.sessionId}\`.`
        );
      } else if (completedGuide?.guidePath) {
        log(`Staged guided session at ${completedGuide.guidePath}.`);
      }
      const redactionLine = summarizeRedactions(ingest.redactions);
      if (redactionLine) {
        log(redactionLine);
      }
    }
    if (options.commit) {
      const msg = await autoCommitWikiChanges(process2.cwd(), "ingest", input, { force: true });
      if (msg && !isJson()) log(`Committed: ${msg}`);
    }
  }
);
program.command("add").description("Capture supported URLs into normalized markdown before ingesting them.").argument("<input>", "Supported URL or bare arXiv id").option("--author <name>", "Human author or curator for this capture").option("--contributor <name>", "Additional contributor metadata for this capture").option("--video", "Treat the URL as a public video and transcribe extracted audio", false).option("--no-redact", "Skip PII/secret redaction for this capture (overrides config)").action(async (input, options) => {
  const result = await addInput(process2.cwd(), input, {
    author: options.author,
    contributor: options.contributor,
    video: options.video,
    redact: options.redact
  });
  if (isJson()) {
    emitJson(result);
  } else {
    log(`${result.captureType}${result.fallback ? " (fallback)" : ""}: ${result.manifest.sourceId}`);
  }
});
var source = program.command("source").description("Manage recurring local files, directories, public repos, and docs sources.");
source.command("add").description("Register and sync a managed source from a local file, directory, public GitHub repo root URL, or docs hub URL.").argument("<input>", "Local file path, directory path, public GitHub repo root URL, or docs hub URL").option("--no-compile", "Register and sync without compiling the vault").option("--no-brief", "Skip source brief generation after sync").option("--review", "Stage a source review artifact after sync and compile", false).option("--guide", "Stage a guided source integration bundle after sync and compile (default: from config)").option("--no-guide", "Skip guided mode even if enabled in config").option("--answers-file <path>", "JSON file with guided-session answers keyed by question id or listed in prompt order").option("--max-pages <n>", "Maximum number of pages to crawl for docs sources").option("--max-depth <n>", "Maximum crawl depth for docs sources").action(
  async (input, options) => {
    const guideAnswers = readGuideAnswersFile(options.answersFile);
    const addConfig = await loadVaultConfig(process2.cwd()).catch(() => null);
    const guideEnabled = options.guide ?? addConfig?.config.profile.guidedIngestDefault ?? false;
    const result = await addManagedSource(process2.cwd(), input, {
      compile: options.compile,
      brief: options.brief,
      review: options.review,
      guide: guideEnabled,
      guideAnswers,
      maxPages: options.maxPages ? parsePositiveInt(options.maxPages, 0) || void 0 : void 0,
      maxDepth: options.maxDepth ? parsePositiveInt(options.maxDepth, 0) || void 0 : void 0
    });
    if (result.guide && !options.answersFile) {
      result.guide = await completeGuideInteractively(result.guide, result.source.id);
    }
    if (isJson()) {
      emitJson(result);
    } else {
      log(
        `Registered ${result.source.kind} source ${result.source.id}. Status: ${result.source.status}.${result.compile ? ` Compiled ${result.compile.sourceCount} source(s).` : ""}${result.briefGenerated ? ` Brief: ${result.source.briefPath}` : ""}${result.review ? ` Review: ${result.review.reviewPath}` : ""}${result.guide?.awaitingInput ? ` Session: ${result.guide.sessionPath}. Resume with \`swarmvault source session ${result.guide.sessionId}\`.` : result.guide?.guidePath ? ` Guide: ${result.guide.guidePath}` : ""}`
      );
    }
  }
);
source.command("list").description("List managed sources registered in this vault.").action(async () => {
  const sources = await listManagedSourceRecords(process2.cwd());
  if (isJson()) {
    emitJson(sources);
  } else if (sources.length === 0) {
    log("No managed sources registered.");
  } else {
    for (const entry of sources) {
      log(`${entry.id}  ${entry.kind}  ${entry.status}  ${entry.title}`);
    }
  }
});
source.command("reload").description("Re-sync one managed source or all managed sources, then optionally compile and refresh briefs.").argument("[id]", "Managed source id").option("--all", "Reload all managed sources", false).option("--no-compile", "Re-sync without compiling the vault").option("--no-brief", "Skip source brief generation after sync").option("--review", "Stage a source review artifact after sync and compile", false).option("--guide", "Stage a guided source integration bundle after sync and compile (default: from config)").option("--no-guide", "Skip guided mode even if enabled in config").option("--answers-file <path>", "JSON file with guided-session answers keyed by question id or listed in prompt order").option("--max-pages <n>", "Maximum number of pages to crawl for docs sources").option("--max-depth <n>", "Maximum crawl depth for docs sources").action(
  async (id, options) => {
    const guideAnswers = readGuideAnswersFile(options.answersFile);
    const reloadConfig = await loadVaultConfig(process2.cwd()).catch(() => null);
    const guideEnabled = options.guide ?? reloadConfig?.config.profile.guidedIngestDefault ?? false;
    const result = await reloadManagedSources(process2.cwd(), {
      id,
      all: options.all ?? false,
      compile: options.compile,
      brief: options.brief,
      review: options.review,
      guide: guideEnabled,
      guideAnswers,
      maxPages: options.maxPages ? parsePositiveInt(options.maxPages, 0) || void 0 : void 0,
      maxDepth: options.maxDepth ? parsePositiveInt(options.maxDepth, 0) || void 0 : void 0
    });
    if (!options.answersFile && result.guides.length === 1) {
      result.guides = [await completeGuideInteractively(result.guides[0], result.sources[0]?.id ?? id ?? "source")];
    }
    if (isJson()) {
      emitJson(result);
    } else {
      log(
        `Reloaded ${result.sources.length} source(s).${result.compile ? ` Compiled ${result.compile.sourceCount} source(s).` : ""}${result.briefPaths.length ? ` Briefs: ${result.briefPaths.length}.` : ""}${result.reviews.length ? ` Reviews: ${result.reviews.length}.` : ""}${result.guides.length ? ` Guides/Sessions: ${result.guides.length}.` : ""}`
      );
    }
  }
);
source.command("delete").description("Unregister a managed source and remove its transient sync state without deleting canonical vault content.").argument("<id>", "Managed source id").action(async (id) => {
  const result = await deleteManagedSource(process2.cwd(), id);
  if (isJson()) {
    emitJson(result);
  } else {
    log(`Deleted managed source ${result.removed.id}. Canonical vault content was left in place.`);
  }
});
source.command("review").description("Stage a source review artifact for a managed source id or raw source id.").argument("<id>", "Managed source id or raw source id").action(async (id) => {
  const result = await reviewManagedSource(process2.cwd(), id);
  if (isJson()) {
    emitJson(result);
  } else {
    log(`Staged source review at ${result.reviewPath}.`);
  }
});
source.command("guide").description("Create or resume a guided source session for a managed source id or raw source id.").argument("<id>", "Managed source id or raw source id").option("--answers-file <path>", "JSON file with guided-session answers keyed by question id or listed in prompt order").action(async (id, options) => {
  const guideAnswers = readGuideAnswersFile(options.answersFile);
  let result = await guideManagedSource(process2.cwd(), id, { answers: guideAnswers });
  if (!options.answersFile) {
    result = await completeGuideInteractively(result, id);
  }
  if (isJson()) {
    emitJson(result);
  } else {
    if (result.awaitingInput) {
      log(`Created guided session at ${result.sessionPath}. Resume with \`swarmvault source session ${result.sessionId}\`.`);
    } else {
      log(`Staged guided session at ${result.guidePath}.`);
    }
  }
});
source.command("session").description("Resume the latest guided source session for a managed source id, raw source id, source scope id, or session id.").argument("<id>", "Managed source id, raw source id, source scope id, or guided session id").option("--answers-file <path>", "JSON file with guided-session answers keyed by question id or listed in prompt order").action(async (id, options) => {
  const guideAnswers = readGuideAnswersFile(options.answersFile);
  let result = await resumeSourceSession(process2.cwd(), id, { answers: guideAnswers });
  if (!options.answersFile) {
    result = await completeGuideInteractively(result, id);
  }
  if (isJson()) {
    emitJson(result);
  } else if (result.awaitingInput) {
    log(`Updated guided session at ${result.sessionPath}. Resume with \`swarmvault source session ${result.sessionId}\` when ready.`);
  } else {
    log(`Staged guided session at ${result.guidePath}.`);
  }
});
var inbox = program.command("inbox").description("Inbox and capture workflows.");
inbox.command("import").description("Import supported files from the configured inbox directory.").argument("[dir]", "Optional inbox directory override").action(async (dir) => {
  const result = await importInbox(process2.cwd(), dir);
  if (isJson()) {
    emitJson(result);
  } else {
    log(
      `Imported ${result.imported.length} source(s) from ${result.inputDir}. Scanned: ${result.scannedCount}. Attachments: ${result.attachmentCount}. Skipped: ${result.skipped.length}.`
    );
  }
});
program.command("compile").description("Compile manifests into wiki pages, graph JSON, and search index.").option("--approve", "Stage a review bundle without applying active page changes", false).option("--commit", "Auto-commit wiki and state changes after compile").option("--max-tokens <n>", "Cap wiki output by trimming lower-priority pages").action(async (options) => {
  const maxTokens = options.maxTokens ? parsePositiveInt(options.maxTokens, 0) || void 0 : void 0;
  const result = await compileVault(process2.cwd(), { approve: options.approve ?? false, maxTokens });
  if (isJson()) {
    emitJson(result);
  } else {
    if (result.staged) {
      log(`Staged ${result.changedPages.length} change(s) for review at ${result.approvalDir}.`);
    } else {
      log(`Compiled ${result.sourceCount} source(s), ${result.pageCount} page(s). Changed: ${result.changedPages.length}.`);
    }
    if (result.tokenStats) {
      log(
        `Token budget: ~${result.tokenStats.estimatedTokens} tokens, kept ${result.tokenStats.pagesKept} pages, dropped ${result.tokenStats.pagesDropped}.`
      );
    }
  }
  if (options.commit) {
    const msg = await autoCommitWikiChanges(process2.cwd(), "compile", `${result.sourceCount} sources, ${result.pageCount} pages`, {
      force: true
    });
    if (msg && !isJson()) log(`Committed: ${msg}`);
  }
  await maybeEmitHeuristicNotice(["compile"]);
});
program.command("consolidate").description("Roll working-tier insights up into episodic, semantic, and procedural tiers.").option("--dry-run", "Return decisions without writing any files", false).action(async (options) => {
  const result = await consolidateVault(process2.cwd(), { dryRun: options.dryRun ?? false });
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(
    `${options.dryRun ? "Would consolidate" : "Consolidated"} ${result.newPages.length} new tier page(s); ${result.promoted.length} promotion(s).`
  );
  for (const decision of result.decisions) {
    log(decision);
  }
});
program.command("query").description("Query the compiled SwarmVault wiki.").argument("<question>", "Question to ask SwarmVault").option("--no-save", "Do not persist the answer to wiki/outputs").option("--commit", "Auto-commit wiki changes after query").option("--gap-fill", "Pull external web-search evidence when the local wiki has gaps (requires webSearch.tasks.queryProvider).").option("--task <id>", "Attach this query output to an agent task").option("--memory <id>", "Compatibility alias for --task").addOption(
  new Option("--format <format>", "Output format").choices(["markdown", "report", "slides", "chart", "image"]).default("markdown")
).action(
  async (question, options) => {
    const result = await queryVault(process2.cwd(), {
      question,
      save: options.save ?? true,
      format: options.format,
      gapFill: options.gapFill ?? false,
      memoryTaskId: options.task ?? options.memory
    });
    if (isJson()) {
      emitJson(result);
    } else {
      log(result.answer);
      if (result.savedPath) {
        log(`Saved to ${result.savedPath}`);
      }
    }
    if (options.commit) {
      const msg = await autoCommitWikiChanges(process2.cwd(), "query", question.slice(0, 72), { force: true });
      if (msg && !isJson()) log(`Committed: ${msg}`);
    }
    await maybeEmitHeuristicNotice(["query"]);
  }
);
var context = program.command("context").description("Build and manage token-bounded agent context packs.");
context.command("build").description("Build a cited, token-bounded context pack for an agent task.").argument("<goal>", "Task, question, or goal the agent needs context for").option("--target <target>", "Optional page, node, path, project, or label to anchor the pack").option("--budget <tokens>", "Approximate token budget for included context", String(8e3)).option("--task <id>", "Attach the context pack to an agent task").option("--memory <id>", "Compatibility alias for --task").addOption(new Option("--format <format>", "Output format").choices(["markdown", "json", "llms"]).default("markdown")).action(
  async (goal, options) => {
    const budgetTokens = parsePositiveInt(options.budget, 8e3);
    const result = await buildContextPack(process2.cwd(), {
      goal,
      target: options.target,
      budgetTokens,
      format: options.format,
      memoryTaskId: options.task ?? options.memory
    });
    if (isJson()) {
      emitJson(result);
      return;
    }
    log(result.rendered);
    log(`Saved context pack to ${result.markdownPath}`);
    log(`Saved context artifact to ${result.artifactPath}`);
  }
);
context.command("list").description("List saved context packs.").action(async () => {
  const packs = await listContextPacks(process2.cwd());
  if (isJson()) {
    emitJson(packs);
    return;
  }
  if (!packs.length) {
    log("No context packs.");
    return;
  }
  for (const pack of packs) {
    log(`${pack.id} \u2014 ${pack.goal} (${pack.itemCount} item(s), ${pack.omittedCount} omitted)`);
  }
});
context.command("show").description("Print a saved context pack.").argument("<id>", "Context pack id").addOption(new Option("--format <format>", "Output format").choices(["markdown", "json", "llms"]).default("markdown")).action(async (id, options) => {
  const pack = await readContextPack(process2.cwd(), id);
  if (!pack) {
    throw new Error(`Context pack not found: ${id}`);
  }
  if (isJson() || options.format === "json") {
    emitJson(pack);
    return;
  }
  log(options.format === "llms" ? renderContextPackLlms(pack) : renderContextPackMarkdown(pack));
});
context.command("delete").description("Delete a saved context pack artifact and markdown page.").argument("<id>", "Context pack id").action(async (id) => {
  const deleted = await deleteContextPack(process2.cwd(), id);
  if (!deleted) {
    throw new Error(`Context pack not found: ${id}`);
  }
  if (isJson()) {
    emitJson(deleted);
    return;
  }
  log(`Deleted context pack ${deleted.id}.`);
});
var memory = program.command("memory").description("Manage git-backed agent memory task ledger entries.");
memory.command("start").description("Start a durable agent memory task and build its initial context pack.").argument("<goal>", "Task goal to preserve in agent memory").option("--target <target>", "Optional page, node, path, project, or label to anchor the initial context pack").option("--budget <tokens>", "Approximate token budget for the initial context pack", String(8e3)).option("--agent <name>", "Agent name to record on the task").option("--context-pack <id>", "Attach an existing context pack instead of building a new one").action(async (goal, options) => {
  const result = await startMemoryTask(process2.cwd(), {
    goal,
    target: options.target,
    budgetTokens: parsePositiveInt(options.budget, 8e3),
    agent: options.agent,
    contextPackId: options.contextPack
  });
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(result.task.id);
  log(`Saved memory task to ${result.markdownPath}`);
});
memory.command("update").description("Append a note, decision, path, context pack, or status change to a memory task.").argument("<id>", "Memory task id").option("--note <text>", "Append a task note").option("--decision <text>", "Append a decision").option("--changed-path <path>", "Record a changed file or wiki path").option("--context-pack <id>", "Attach a context pack").option("--session <id>", "Attach a session id").option("--source <id>", "Attach a source id").option("--page <id>", "Attach a page id").option("--node <id>", "Attach a graph node id").option("--git-ref <ref>", "Attach a git ref").addOption(new Option("--status <status>", "Task status").choices(["active", "blocked", "completed", "archived"])).action(
  async (id, options) => {
    const result = await updateMemoryTask(process2.cwd(), id, {
      note: options.note,
      decision: options.decision,
      changedPath: options.changedPath,
      contextPackId: options.contextPack,
      sessionId: options.session,
      sourceId: options.source,
      pageId: options.page,
      nodeId: options.node,
      gitRef: options.gitRef,
      status: options.status
    });
    if (isJson()) {
      emitJson(result);
      return;
    }
    log(`Updated memory task ${result.task.id}.`);
  }
);
memory.command("finish").description("Finish a memory task with an outcome and optional follow-up.").argument("<id>", "Memory task id").requiredOption("--outcome <text>", "Outcome to record").option("--follow-up <text>", "Follow-up to preserve for the next agent").action(async (id, options) => {
  const result = await finishMemoryTask(process2.cwd(), id, {
    outcome: options.outcome,
    followUp: options.followUp
  });
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(`Finished memory task ${result.task.id}.`);
});
memory.command("list").description("List saved agent memory tasks.").action(async () => {
  const tasks = await listMemoryTasks(process2.cwd());
  if (isJson()) {
    emitJson(tasks);
    return;
  }
  if (!tasks.length) {
    log("No memory tasks.");
    return;
  }
  for (const task2 of tasks) {
    log(`${task2.id} \u2014 ${task2.status} \u2014 ${task2.goal}`);
  }
});
memory.command("show").description("Print a saved agent memory task.").argument("<id>", "Memory task id").action(async (id) => {
  const task2 = await readMemoryTask(process2.cwd(), id);
  if (!task2) {
    throw new Error(`Memory task not found: ${id}`);
  }
  if (isJson()) {
    emitJson(task2);
    return;
  }
  log(`Task: ${task2.title}`);
  log(`Status: ${task2.status}`);
  log(`Goal: ${task2.goal}`);
  if (task2.outcome) log(`Outcome: ${task2.outcome}`);
  if (task2.followUps.length) log(`Follow-ups: ${task2.followUps.join("; ")}`);
  log(`Markdown: ${task2.markdownPath}`);
});
memory.command("resume").description("Render a memory task handoff for the next agent.").argument("<id>", "Memory task id").addOption(new Option("--format <format>", "Output format").choices(["markdown", "json", "llms"]).default("markdown")).action(async (id, options) => {
  const result = await resumeMemoryTask(process2.cwd(), id, { format: options.format });
  if (isJson() || options.format === "json") {
    emitJson(result);
    return;
  }
  log(result.rendered);
});
var task = program.command("task").description("Manage git-backed agent task ledger entries.");
task.command("start").description("Start a durable agent task and build its initial context pack.").argument("<goal>", "Task goal to preserve").option("--target <target>", "Optional page, node, path, project, or label to anchor the initial context pack").option("--budget <tokens>", "Approximate token budget for the initial context pack", String(8e3)).option("--agent <name>", "Agent name to record on the task").option("--context-pack <id>", "Attach an existing context pack instead of building a new one").action(async (goal, options) => {
  const result = await startMemoryTask(process2.cwd(), {
    goal,
    target: options.target,
    budgetTokens: parsePositiveInt(options.budget, 8e3),
    agent: options.agent,
    contextPackId: options.contextPack
  });
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(result.task.id);
  log(`Saved task to ${result.markdownPath}`);
});
task.command("update").description("Append a note, decision, path, context pack, or status change to a task.").argument("<id>", "Task id").option("--note <text>", "Append a task note").option("--decision <text>", "Append a decision").option("--changed-path <path>", "Record a changed file or wiki path").option("--context-pack <id>", "Attach a context pack").option("--session <id>", "Attach a session id").option("--source <id>", "Attach a source id").option("--page <id>", "Attach a page id").option("--node <id>", "Attach a graph node id").option("--git-ref <ref>", "Attach a git ref").addOption(new Option("--status <status>", "Task status").choices(["active", "blocked", "completed", "archived"])).action(
  async (id, options) => {
    const result = await updateMemoryTask(process2.cwd(), id, {
      note: options.note,
      decision: options.decision,
      changedPath: options.changedPath,
      contextPackId: options.contextPack,
      sessionId: options.session,
      sourceId: options.source,
      pageId: options.page,
      nodeId: options.node,
      gitRef: options.gitRef,
      status: options.status
    });
    if (isJson()) {
      emitJson(result);
      return;
    }
    log(`Updated task ${result.task.id}.`);
  }
);
task.command("finish").description("Finish a task with an outcome and optional follow-up.").argument("<id>", "Task id").requiredOption("--outcome <text>", "Outcome to record").option("--follow-up <text>", "Follow-up to preserve for the next agent").action(async (id, options) => {
  const result = await finishMemoryTask(process2.cwd(), id, {
    outcome: options.outcome,
    followUp: options.followUp
  });
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(`Finished task ${result.task.id}.`);
});
task.command("list").description("List saved agent tasks.").action(async () => {
  const tasks = await listMemoryTasks(process2.cwd());
  if (isJson()) {
    emitJson(tasks);
    return;
  }
  if (!tasks.length) {
    log("No tasks.");
    return;
  }
  for (const entry of tasks) {
    log(`${entry.id} \u2014 ${entry.status} \u2014 ${entry.goal}`);
  }
});
task.command("show").description("Print a saved agent task.").argument("<id>", "Task id").action(async (id) => {
  const entry = await readMemoryTask(process2.cwd(), id);
  if (!entry) {
    throw new Error(`Task not found: ${id}`);
  }
  if (isJson()) {
    emitJson(entry);
    return;
  }
  log(`Task: ${entry.title}`);
  log(`Status: ${entry.status}`);
  log(`Goal: ${entry.goal}`);
  if (entry.outcome) log(`Outcome: ${entry.outcome}`);
  if (entry.followUps.length) log(`Follow-ups: ${entry.followUps.join("; ")}`);
  log(`Markdown: ${entry.markdownPath}`);
});
task.command("resume").description("Render a task handoff for the next agent.").argument("<id>", "Task id").addOption(new Option("--format <format>", "Output format").choices(["markdown", "json", "llms"]).default("markdown")).action(async (id, options) => {
  const result = await resumeMemoryTask(process2.cwd(), id, { format: options.format });
  if (isJson() || options.format === "json") {
    emitJson(result);
    return;
  }
  log(result.rendered);
});
program.command("explore").description("Run a save-first multi-step exploration loop against the vault.").argument("<question>", "Root question to explore").option("--steps <n>", "Maximum number of exploration steps", "3").option("--gap-fill", "Pull external web-search evidence when the local wiki has gaps (requires webSearch.tasks.exploreProvider).").option("--task <id>", "Attach this exploration to an agent task").option("--memory <id>", "Compatibility alias for --task").addOption(
  new Option("--format <format>", "Output format for step pages").choices(["markdown", "report", "slides", "chart", "image"]).default("markdown")
).action(
  async (question, options) => {
    const stepCount = parsePositiveInt(options.steps, 3);
    const result = await exploreVault(process2.cwd(), {
      question,
      steps: stepCount,
      format: options.format,
      gapFill: options.gapFill ?? false,
      memoryTaskId: options.task ?? options.memory
    });
    if (isJson()) {
      emitJson(result);
    } else {
      log(`Exploration hub saved to ${result.hubPath}`);
      log(`Completed ${result.stepCount} step(s).`);
    }
    await maybeEmitHeuristicNotice(["explore"]);
  }
);
program.command("benchmark").description("Measure graph-guided context reduction against a naive full-corpus read.").option("--question <text...>", "Optional custom benchmark question(s)").action(async (options) => {
  const result = await benchmarkVault(process2.cwd(), {
    questions: options.question
  });
  if (isJson()) {
    emitJson(result);
  } else {
    log(`Corpus tokens: ${result.corpusTokens}`);
    log(`Average query tokens: ${result.avgQueryTokens}`);
    const ratioPercent = (result.reductionRatio * 100).toFixed(1);
    log(`Reduction ratio: ${ratioPercent}%`);
    if (result.reductionRatio < 0) {
      log(
        "Note: graph-guided context is larger than the full corpus on this vault. The benchmark is only meaningful once the corpus exceeds the graph traversal budget."
      );
    }
  }
});
program.command("lint").description("Run anti-drift and wiki-health checks.").option("--deep", "Run LLM-powered advisory lint (default: from config)").option("--no-deep", "Skip deep lint even if enabled in config").option("--web", "Augment deep lint with configured web search", false).option("--conflicts", "Filter to contradiction findings only", false).option("--decay", "Filter to decay-related findings only", false).option("--tiers", "Filter to consolidation-tier findings only", false).action(async (options) => {
  const lintConfig = await loadVaultConfig(process2.cwd()).catch(() => null);
  const deepEnabled = options.decay || options.tiers ? false : options.deep ?? lintConfig?.config.profile.deepLintDefault ?? false;
  const findings = await lintVault(process2.cwd(), {
    deep: deepEnabled,
    web: options.web ?? false,
    conflicts: options.conflicts ?? false,
    decay: options.decay ?? false,
    tiers: options.tiers ?? false
  });
  if (isJson()) {
    emitJson(findings);
    return;
  }
  if (!findings.length) {
    log("No findings.");
    return;
  }
  for (const finding of findings) {
    log(`[${finding.severity}] ${finding.code}: ${finding.message}${finding.pagePath ? ` (${finding.pagePath})` : ""}`);
  }
});
var graph = program.command("graph").description("Graph-related commands.").enablePositionalOptions();
var graphPush = graph.command("push").description("Push the compiled graph into external sinks.");
graph.command("update").alias("refresh").description("Refresh code-derived graph artifacts from tracked repo roots or one explicit repo path.").argument("[path]", "Optional repo root to refresh instead of configured/tracked roots").option("--lint", "Run lint after the refresh cycle", false).action(async (targetPath, options) => {
  const overrideRoots = targetPath ? [path2.resolve(process2.cwd(), targetPath)] : void 0;
  const result = await runWatchCycle(process2.cwd(), {
    repo: true,
    codeOnly: true,
    lint: options.lint ?? false,
    overrideRoots
  });
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(
    `Updated graph from ${result.watchedRepoRoots.length} repo root${result.watchedRepoRoots.length === 1 ? "" : "s"}. Imported ${result.repoImportedCount}, updated ${result.repoUpdatedCount}, removed ${result.repoRemovedCount}, pending semantic refresh ${result.pendingSemanticRefreshCount}.`
  );
});
graph.command("cluster").alias("clusters").description("Recompute graph communities, degrees, god-node flags, and graph report artifacts without re-ingesting sources.").option("--resolution <number>", "Override the Louvain community resolution for this run").action(async (options) => {
  const resolution = parsePositiveNumber(options.resolution);
  if (options.resolution && resolution === void 0) {
    throw new Error("--resolution must be a positive number.");
  }
  const result = await refreshGraphClusters(process2.cwd(), { resolution });
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(
    `Refreshed ${result.communityCount} communities across ${result.nodeCount} nodes and ${result.edgeCount} edges. Report: ${result.reportPath}`
  );
});
graphPush.command("neo4j").description("Push the compiled graph directly into Neo4j over Bolt/Aura.").option("--uri <bolt-uri>", "Neo4j Bolt or Aura URI").option("--username <user>", "Neo4j username").option("--password-env <env-var>", "Environment variable containing the Neo4j password").option("--database <name>", "Neo4j database name").option("--vault-id <id>", "Stable vault identifier used for shared-database namespacing").option("--batch-size <n>", "Maximum rows to write per Neo4j transaction batch").option("--include-third-party", "Also push third-party repo material", false).option("--include-resources", "Also push resource-like content", false).option("--include-generated", "Also push generated output", false).option("--dry-run", "Show what would be pushed without writing to Neo4j", false).action(
  async (options) => {
    const batchSize = typeof options.batchSize === "string" && options.batchSize.trim() ? parsePositiveInt(options.batchSize, 0) || void 0 : void 0;
    const includeClasses = [
      "first_party",
      ...options.includeThirdParty ? ["third_party"] : [],
      ...options.includeResources ? ["resource"] : [],
      ...options.includeGenerated ? ["generated"] : []
    ];
    const result = await pushGraphNeo4j(process2.cwd(), {
      uri: options.uri,
      username: options.username,
      passwordEnv: options.passwordEnv,
      database: options.database,
      vaultId: options.vaultId,
      batchSize,
      includeClasses,
      dryRun: options.dryRun ?? false
    });
    if (isJson()) {
      emitJson(result);
    } else {
      log(
        `${result.dryRun ? "Planned" : "Pushed"} ${result.counts.nodes} nodes, ${result.counts.relationships} relationships, ${result.counts.hyperedges} hyperedges, and ${result.counts.groupMembers} group-member links to ${result.uri}/${result.database} as ${result.vaultId}.`
      );
      if (result.skipped.nodes || result.skipped.relationships || result.skipped.hyperedges) {
        log(
          `Skipped ${result.skipped.nodes} node(s), ${result.skipped.relationships} relationship(s), and ${result.skipped.hyperedges} hyperedge(s) outside the selected source classes.`
        );
      }
      for (const warning of result.warnings) {
        log(`Warning: ${warning}`);
      }
    }
  }
);
graph.command("serve").description("Serve the local graph viewer.").option("--port <port>", "Port override").option("--full", "Disable overview sampling and render the full graph", false).action(async (options) => {
  const port = options.port ? parsePositiveInt(options.port, 0) || void 0 : void 0;
  const server = await startGraphServer(process2.cwd(), port, { full: options.full ?? false });
  if (isJson()) {
    emitJson({ port: server.port, url: `http://localhost:${server.port}` });
  } else {
    log(`Graph viewer running at http://localhost:${server.port}`);
    log(`Browser clipper: http://localhost:${server.port}/api/bookmarklet`);
  }
  process2.on("SIGINT", async () => {
    try {
      await server.close();
    } catch {
    }
    process2.exit(0);
  });
});
graph.command("export").description(
  "Export the graph as HTML, report, SVG, GraphML, Cypher, JSON, Obsidian vault, or Obsidian canvas. Combine flags to write multiple formats in one run."
).option("--html <output>", "Output HTML file path").option("--html-standalone <output>", "Output lightweight standalone HTML file path (vis.js, no build tooling)").option("--report <output>", "Output self-contained HTML report (graph stats, key nodes, communities)").option("--svg <output>", "Output SVG file path").option("--graphml <output>", "Output GraphML file path").option("--cypher <output>", "Output Cypher file path").option("--json <output>", "Output JSON file path").option("--obsidian <output>", "Output Obsidian vault directory path").option("--canvas <output>", "Output Obsidian canvas file path").option("--full", "Include the full graph in HTML export (default; queries traverse complete graph)", true).option("--overview", "Use overview sampling for HTML export (smaller file, queries limited to sampled nodes)", false).action(
  async (options) => {
    const useFullGraph = options.overview ? false : options.full ?? true;
    const targets = [
      options.html ? { format: "html", outputPath: options.html } : null,
      options.htmlStandalone ? { format: "html-standalone", outputPath: options.htmlStandalone } : null,
      options.report ? { format: "report", outputPath: options.report } : null,
      options.svg ? { format: "svg", outputPath: options.svg } : null,
      options.graphml ? { format: "graphml", outputPath: options.graphml } : null,
      options.cypher ? { format: "cypher", outputPath: options.cypher } : null,
      options.json ? { format: "json", outputPath: options.json } : null,
      options.obsidian ? { format: "obsidian", outputPath: options.obsidian } : null,
      options.canvas ? { format: "canvas", outputPath: options.canvas } : null
    ].filter((target) => Boolean(target));
    if (targets.length === 0) {
      throw new Error(
        "Pass at least one of --html, --html-standalone, --report, --svg, --graphml, --cypher, --json, --obsidian, or --canvas."
      );
    }
    const results = [];
    for (const target of targets) {
      if (target.format === "html") {
        const outputPath = await exportGraphHtml(process2.cwd(), target.outputPath, { full: useFullGraph });
        results.push({ format: target.format, outputPath });
      } else if (target.format === "report") {
        const result = await exportGraphReportHtml(process2.cwd(), target.outputPath);
        results.push({ format: result.format, outputPath: result.outputPath });
      } else if (target.format === "obsidian") {
        const result = await exportObsidianVault(process2.cwd(), target.outputPath);
        results.push({ format: result.format, outputPath: result.outputPath, fileCount: result.fileCount });
      } else if (target.format === "canvas") {
        const result = await exportObsidianCanvas(process2.cwd(), target.outputPath);
        results.push({ format: result.format, outputPath: result.outputPath });
      } else {
        const result = await exportGraphFormat(process2.cwd(), target.format, target.outputPath);
        results.push({ format: result.format, outputPath: result.outputPath });
      }
    }
    if (isJson()) {
      emitJson(results.length === 1 ? results[0] : { exports: results });
    } else {
      for (const result of results) {
        const suffix = result.fileCount ? ` (${result.fileCount} files)` : "";
        log(`Exported graph ${result.format} to ${result.outputPath}${suffix}`);
      }
    }
  }
);
graph.command("share").description("Print a shareable summary of the compiled graph.").option("--post", "Print only the short social post text", false).option("--svg [path]", "Write the visual SVG share card, defaulting to wiki/graph/share-card.svg").option("--bundle [dir]", "Write the portable share kit bundle, defaulting to wiki/graph/share-kit").action(async (options) => {
  const outputModeCount = [options.post, options.svg, options.bundle].filter(Boolean).length;
  if (outputModeCount > 1) {
    throw new Error("Choose one graph share output mode: --post, --svg, or --bundle.");
  }
  const { paths } = await loadVaultConfig(process2.cwd());
  const raw = await readFile2(paths.graphPath, "utf-8");
  const graph2 = JSON.parse(raw);
  const report = await readGraphReport(process2.cwd());
  const artifact = buildGraphShareArtifact({
    graph: graph2,
    report,
    vaultName: path2.basename(paths.rootDir)
  });
  if (options.svg) {
    const svgPath = typeof options.svg === "string" ? path2.resolve(process2.cwd(), options.svg) : path2.join(paths.wikiDir, "graph", "share-card.svg");
    await mkdir2(path2.dirname(svgPath), { recursive: true });
    await writeFile2(svgPath, renderGraphShareSvg(artifact), "utf8");
    if (isJson()) {
      emitJson({ ...artifact, svgPath });
      return;
    }
    log(`Wrote SVG share card to ${svgPath}`);
    return;
  }
  if (options.bundle) {
    const bundlePath = typeof options.bundle === "string" ? path2.resolve(process2.cwd(), options.bundle) : path2.join(paths.wikiDir, "graph", "share-kit");
    const bundleFiles = await writeShareBundle(bundlePath, renderGraphShareBundleFiles(artifact));
    if (isJson()) {
      emitJson({ ...artifact, bundlePath, bundleFiles });
      return;
    }
    log(`Wrote share kit to ${bundlePath}`);
    return;
  }
  if (isJson()) {
    emitJson(artifact);
    return;
  }
  log(options.post ? artifact.shortPost : renderGraphShareMarkdown(artifact));
});
graph.command("query").description("Traverse the compiled graph deterministically from local search seeds.").argument("<question>", "Question or graph search seed").option("--dfs", "Prefer a depth-first traversal instead of breadth-first", false).option("--budget <n>", "Maximum number of graph nodes to summarize").action(async (question, options) => {
  const budget = options.budget ? parsePositiveInt(options.budget, 0) || void 0 : void 0;
  const result = await queryGraphVault(process2.cwd(), question, {
    traversal: options.dfs ? "dfs" : "bfs",
    budget
  });
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(result.summary);
});
graph.command("path").description("Find the shortest graph path between two nodes or pages.").argument("<from>", "Source node/page label or id").argument("<to>", "Target node/page label or id").action(async (from, to) => {
  const result = await pathGraphVault(process2.cwd(), from, to);
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(result.summary);
});
graph.command("explain").description("Explain a graph node, its page, community, and neighbors.").argument("<target>", "Node/page label or id").action(async (target) => {
  const result = await explainGraphVault(process2.cwd(), target);
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(result.summary);
});
graph.command("god-nodes").description("List the highest-connectivity non-source graph nodes.").option("--limit <n>", "Maximum number of nodes to return", "10").action(async (options) => {
  const limit = parsePositiveInt(options.limit, 10);
  const result = await listGodNodes(process2.cwd(), limit);
  if (isJson()) {
    emitJson(result);
    return;
  }
  for (const node of result) {
    log(`${node.label} degree=${node.degree ?? 0} bridge=${node.bridgeScore ?? 0}`);
  }
});
graph.command("blast").description("Show the blast radius of changing a file or module.").argument("<target>", "File path, module label, or module id").option("--depth <n>", "Maximum traversal depth", "3").action(async (target, options) => {
  const depth = parsePositiveInt(options.depth, 3);
  const result = await blastRadiusVault(process2.cwd(), target, { maxDepth: depth });
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(result.summary);
  for (const mod of result.affectedModules) {
    log(`  ${"  ".repeat(mod.depth - 1)}${mod.label} (depth ${mod.depth})`);
  }
});
graph.command("supersession").description("Record that one page has been replaced by another (writes a superseded_by edge).").argument("<pageId>", "Page id or path of the older page").argument("<replacedById>", "Page id or path of the replacement page").action(async (pageId, replacedById) => {
  const result = await createSupersessionEdge(process2.cwd(), pageId, replacedById);
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(`Superseded ${result.oldPageId} by ${result.newPageId} (edge ${result.edgeId}).`);
});
var review = program.command("review").description("Review staged compile approval bundles.");
review.command("list").description("List staged approval bundles and their resolution status.").action(async () => {
  const approvals = await listApprovals(process2.cwd());
  if (isJson()) {
    emitJson(approvals);
    return;
  }
  if (!approvals.length) {
    log("No approval bundles.");
    return;
  }
  for (const approval of approvals) {
    log(
      `${approval.approvalId}${approval.bundleType ? ` [${approval.bundleType}]` : ""}${approval.title ? ` ${approval.title}` : ""} pending=${approval.pendingCount} accepted=${approval.acceptedCount} rejected=${approval.rejectedCount} created=${approval.createdAt}`
    );
  }
});
review.command("show").description("Show the entries inside a staged approval bundle.").argument("<approvalId>", "Approval bundle identifier").option("--diff", "Show unified diff for each entry", false).action(async (approvalId, options) => {
  const approval = await readApproval(process2.cwd(), approvalId, { diff: options.diff });
  if (isJson()) {
    emitJson(approval);
    return;
  }
  log(
    `${approval.approvalId}${approval.bundleType ? ` [${approval.bundleType}]` : ""}${approval.title ? ` ${approval.title}` : ""} pending=${approval.pendingCount} accepted=${approval.acceptedCount} rejected=${approval.rejectedCount}`
  );
  for (const entry of approval.entries) {
    log(
      `- ${entry.status} ${entry.changeType}${entry.label ? ` [${entry.label}]` : ""} ${entry.pageId} ${entry.nextPath ?? entry.previousPath ?? ""}`.trim()
    );
    if (entry.changeSummary) log(`  Summary: ${entry.changeSummary}`);
    if (entry.diff) {
      log("");
      log(entry.diff);
      log("");
    }
  }
});
review.command("accept").description("Accept all pending entries, or selected entries, from a staged approval bundle.").argument("<approvalId>", "Approval bundle identifier").argument("[targets...]", "Optional page ids or paths to accept").action(async (approvalId, targets) => {
  const result = await acceptApproval(process2.cwd(), approvalId, targets);
  if (isJson()) {
    emitJson(result);
  } else {
    log(`Accepted ${result.updatedEntries.length} entr${result.updatedEntries.length === 1 ? "y" : "ies"} from ${approvalId}.`);
  }
});
review.command("reject").description("Reject all pending entries, or selected entries, from a staged approval bundle.").argument("<approvalId>", "Approval bundle identifier").argument("[targets...]", "Optional page ids or paths to reject").action(async (approvalId, targets) => {
  const result = await rejectApproval(process2.cwd(), approvalId, targets);
  if (isJson()) {
    emitJson(result);
  } else {
    log(`Rejected ${result.updatedEntries.length} entr${result.updatedEntries.length === 1 ? "y" : "ies"} from ${approvalId}.`);
  }
});
var candidate = program.command("candidate").description("Candidate page workflows.");
candidate.command("list").description("List staged concept and entity candidates.").action(async () => {
  const candidates = await listCandidates(process2.cwd());
  if (isJson()) {
    emitJson(candidates);
    return;
  }
  if (!candidates.length) {
    log("No candidates.");
    return;
  }
  for (const entry of candidates) {
    log(`${entry.pageId} ${entry.path} -> ${entry.activePath}`);
  }
});
candidate.command("promote").description("Promote a candidate into its active concept or entity path.").argument("<target>", "Candidate page id or path").action(async (target) => {
  const result = await promoteCandidate(process2.cwd(), target);
  if (isJson()) {
    emitJson(result);
  } else {
    log(`Promoted ${result.pageId} to ${result.path}`);
  }
});
candidate.command("archive").description("Archive a candidate by removing it from the active candidate set.").argument("<target>", "Candidate page id or path").action(async (target) => {
  const result = await archiveCandidate(process2.cwd(), target);
  if (isJson()) {
    emitJson(result);
  } else {
    log(`Archived ${result.pageId}`);
  }
});
candidate.command("auto-promote").description("Apply configured auto-promotion rules to staged candidates. Requires candidate.autoPromote.enabled in config.").option("--dry-run", "Score candidates without moving files", false).action(async (options) => {
  const result = await runAutoPromotion(process2.cwd(), { dryRun: options.dryRun ?? false });
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(
    `${result.dryRun ? "Dry-run" : "Promoted"} ${result.promotedPageIds.length} of ${result.decisions.length} candidates. Session: ${result.sessionPath ?? "none"}`
  );
  for (const decision of result.decisions) {
    const mark = decision.promote ? result.promotedPageIds.includes(decision.pageId) ? "+" : "~" : "-";
    log(`  ${mark} ${decision.pageId} score=${decision.score.toFixed(2)} ${decision.reasons.join("; ")}`);
  }
});
candidate.command("preview-scores").description("Show promotion scores for staged candidates without promoting.").action(async () => {
  const decisions = await previewCandidatePromotions(process2.cwd());
  if (isJson()) {
    emitJson(decisions);
    return;
  }
  if (!decisions.length) {
    log("No candidates to score.");
    return;
  }
  for (const decision of decisions) {
    const verdict = decision.promote ? "promote" : "skip";
    log(`${verdict} ${decision.pageId} score=${decision.score.toFixed(2)} ${decision.reasons.join("; ")}`);
  }
});
var provider = program.command("provider").description("Configure provider adapters.");
provider.command("setup").description("Interactive setup for a provider (currently: local-whisper). Checks for required binaries and downloads models.").option("--local-whisper", "Set up the local Whisper (whisper.cpp) provider", false).option("--model <model>", "Whisper model to install (e.g. tiny.en, base.en, small.en)", "base.en").option("--apply", "Skip confirmation prompts and download/install automatically", false).option("--set-audio-provider", "Force tasks.audioProvider to local-whisper even if another provider is already configured", false).action(async (options) => {
  if (!options.localWhisper) {
    throw new Error("Specify a provider to set up (currently: --local-whisper).");
  }
  const modelName = (options.model ?? "base.en").trim();
  if (!modelName) {
    throw new Error("Model name cannot be empty.");
  }
  const status = await summarizeLocalWhisperSetup({ modelName });
  if (isJson()) {
    emitJson({ ...status, apply: Boolean(options.apply), configWrite: null });
    return;
  }
  log(`whisper.cpp binary: ${status.binary.found ? status.binary.path : "NOT FOUND"}`);
  if (!status.binary.found) {
    log(status.binary.installHint);
    log("Re-run once whisper.cpp is on $PATH.");
    process2.exitCode = 1;
    return;
  }
  log(`Model "${modelName}": ${status.model.exists ? status.model.expectedPath : "missing"}`);
  if (!status.model.exists) {
    const sizeHint = status.model.approximateSize ? ` (~${status.model.approximateSize})` : "";
    log(`Download plan: ${status.model.downloadUrl}${sizeHint} -> ${status.model.expectedPath}`);
    const proceed = options.apply === true || await confirmInteractive(`Download ggml-${modelName}.bin now?`);
    if (!proceed) {
      log("Skipped download. Run with --apply (or confirm y) to download.");
      process2.exitCode = 1;
      return;
    }
    const downloaded = await downloadWhisperModel({
      modelName,
      onProgress: (progress) => {
        if (progress.totalBytes) {
          const percent = Math.floor(progress.downloadedBytes / progress.totalBytes * 100);
          process2.stderr.write(`\r[swarmvault] downloading ggml-${modelName}.bin: ${percent}%`);
        }
      }
    });
    process2.stderr.write("\n");
    log(`Downloaded ${downloaded.bytes} bytes to ${downloaded.path}.`);
  }
  const registration = await registerLocalWhisperProvider({
    rootDir: process2.cwd(),
    model: modelName,
    setAsAudioProvider: options.setAudioProvider ? true : void 0
  });
  if (registration.providerWasAdded) {
    log(`Registered provider "local-whisper" in ${registration.configPath}.`);
  } else if (registration.providerWasUpdated) {
    log(`Updated existing "local-whisper" provider entry in ${registration.configPath}.`);
  } else {
    log(`Provider "local-whisper" already configured in ${registration.configPath}.`);
  }
  if (registration.audioProviderSet) {
    log(`Set tasks.audioProvider = "local-whisper".`);
  } else if (registration.previousAudioProvider && registration.previousAudioProvider !== "local-whisper") {
    log(`Left tasks.audioProvider = "${registration.previousAudioProvider}" untouched (use --set-audio-provider to override).`);
  }
});
async function confirmInteractive(message) {
  if (!process2.stdin.isTTY) return false;
  const rl = createInterface({ input: process2.stdin, output: process2.stderr });
  try {
    const answer = (await rl.question(`${message} [y/N] `)).trim().toLowerCase();
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}
var watch = program.command("watch").description("Watch the inbox directory and optionally tracked repos, or run one refresh cycle immediately.").option("--lint", "Run lint after each compile cycle", false).option("--repo", "Also refresh tracked repo sources and watch their repo roots", false).option("--once", "Run one import/refresh cycle immediately instead of starting a watcher", false).option("--code-only", "Only re-extract code sources (AST-only, no LLM re-analysis)", false).option("--debounce <ms>", "Debounce window in milliseconds", "900").option("--root <path>", "Watch this repo root instead of config/auto-discovery (repeat for multiple)", collectRepeated, []).action(async (options) => {
  const debounceMs = parsePositiveInt(options.debounce, 900);
  const overrideRoots = options.root && options.root.length > 0 ? options.root : void 0;
  if (options.once) {
    const result = await runWatchCycle(process2.cwd(), {
      lint: options.lint ?? false,
      repo: options.repo ?? false,
      codeOnly: options.codeOnly ?? false,
      debounceMs,
      overrideRoots
    });
    if (isJson()) {
      emitJson(result);
    } else {
      log(
        `Refreshed inbox${options.repo ? " and tracked repos" : ""}. Imported ${result.importedCount}, repo imported ${result.repoImportedCount}, repo updated ${result.repoUpdatedCount}, repo removed ${result.repoRemovedCount}.`
      );
    }
    return;
  }
  const { paths } = await loadVaultConfig(process2.cwd());
  const controller = await watchVault(process2.cwd(), {
    lint: options.lint ?? false,
    repo: options.repo ?? false,
    codeOnly: options.codeOnly ?? false,
    debounceMs,
    overrideRoots
  });
  if (isJson()) {
    emitJson({ status: "watching", inboxDir: paths.inboxDir, repo: options.repo ?? false });
  } else {
    log(`Watching inbox${options.repo ? " and tracked repos" : ""} for changes. Press Ctrl+C to stop.`);
  }
  process2.on("SIGINT", async () => {
    try {
      await controller.close();
    } catch {
    }
    process2.exit(0);
  });
});
watch.command("list-roots").description("Print the effective watched repo roots resolved from config and auto-discovery.").action(async () => {
  const roots = await listWatchedRoots(process2.cwd());
  if (isJson()) {
    emitJson({ roots });
    return;
  }
  if (roots.length === 0) {
    log("No watched repo roots.");
    return;
  }
  for (const entry of roots) {
    log(entry);
  }
});
watch.command("add-root <path>").description("Persist a repo root into swarmvault.config.json watch.repoRoots.").action(async (pathValue) => {
  const resolved = await addWatchedRoot(process2.cwd(), pathValue);
  if (isJson()) {
    emitJson({ added: resolved });
    return;
  }
  log(`Watching ${resolved}`);
});
watch.command("remove-root <path>").description("Remove a repo root from swarmvault.config.json watch.repoRoots.").action(async (pathValue) => {
  const removed = await removeWatchedRoot(process2.cwd(), pathValue);
  if (isJson()) {
    emitJson({ removed });
    return;
  }
  log(removed ? `Removed ${pathValue}` : `${pathValue} was not in watch.repoRoots.`);
});
async function showWatchStatus() {
  const result = await getWatchStatus(process2.cwd());
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(`Watched repo roots: ${result.watchedRepoRoots.length}`);
  log(`Pending semantic refresh: ${result.pendingSemanticRefresh.length}`);
  for (const entry of result.pendingSemanticRefresh.slice(0, 8)) {
    log(`- ${entry.changeType} ${entry.path}`);
  }
}
watch.command("status").description("Show the latest watch run plus pending semantic refresh entries.").action(showWatchStatus);
program.command("watch-status").description("Show the latest watch run plus pending semantic refresh entries.").action(showWatchStatus);
var hook = program.command("hook").description("Install local git hooks that keep tracked repos and the vault in sync.");
hook.command("install").description("Install post-commit and post-checkout hooks for the nearest git repository.").action(async () => {
  const status = await installGitHooks(process2.cwd());
  if (isJson()) {
    emitJson(status);
    return;
  }
  log(`Installed hooks in ${status.repoRoot}`);
});
hook.command("uninstall").description("Remove the SwarmVault-managed git hook blocks from the nearest git repository.").action(async () => {
  const status = await uninstallGitHooks(process2.cwd());
  if (isJson()) {
    emitJson(status);
    return;
  }
  log(`Removed SwarmVault hook blocks from ${status.repoRoot ?? "the current workspace"}`);
});
hook.command("status").description("Show whether SwarmVault-managed git hooks are installed.").action(async () => {
  const status = await getGitHookStatus(process2.cwd());
  if (isJson()) {
    emitJson(status);
    return;
  }
  if (!status.repoRoot) {
    log("No git repository found.");
    return;
  }
  log(`repo=${status.repoRoot}`);
  log(`post-commit=${status.postCommit}`);
  log(`post-checkout=${status.postCheckout}`);
});
var schedule = program.command("schedule").description("Run scheduled vault maintenance jobs.");
schedule.command("list").description("List configured schedule jobs and their next run state.").action(async () => {
  const schedules = await listSchedules(process2.cwd());
  if (isJson()) {
    emitJson(schedules);
    return;
  }
  if (!schedules.length) {
    log("No schedules configured.");
    return;
  }
  for (const entry of schedules) {
    log(
      `${entry.jobId} enabled=${entry.enabled} task=${entry.taskType} next=${entry.nextRunAt ?? "n/a"} last=${entry.lastRunAt ?? "never"} status=${entry.lastStatus ?? "n/a"} approval=${entry.lastApprovalId ?? "none"}`
    );
  }
});
schedule.command("run").description("Run one configured schedule job immediately.").argument("<jobId>", "Schedule identifier").action(async (jobId) => {
  const result = await runSchedule(process2.cwd(), jobId);
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(
    `${jobId} ${result.success ? "completed" : "failed"} (${result.taskType})${result.approvalId ? ` approval=${result.approvalId}` : ""}${result.error ? ` error=${result.error}` : ""}`
  );
});
schedule.command("serve").description("Run the local schedule loop.").option("--poll <ms>", "Polling interval in milliseconds", "30000").action(async (options) => {
  const pollMs = parsePositiveInt(options.poll, 3e4);
  const controller = await serveSchedules(process2.cwd(), pollMs);
  if (isJson()) {
    emitJson({ status: "serving", pollMs });
  } else {
    log("Serving schedules. Press Ctrl+C to stop.");
  }
  process2.on("SIGINT", async () => {
    try {
      await controller.close();
    } catch {
    }
    process2.exit(0);
  });
});
program.command("migrate").description("Detect vault version and plan or apply schema/config/graph migrations.").option("--target <version>", "Limit migrations to those at or below this target version").option("--apply", "Write migration changes to disk (default is dry-run)", false).option("--dry-run", "Report planned changes without writing (overrides --apply)", false).action(async (options) => {
  const dryRun = options.dryRun === true ? true : options.apply !== true;
  const result = await runMigration(process2.cwd(), { targetVersion: options.target, dryRun });
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(
    `Vault version: ${result.fromVersion ?? "unknown"} \u2192 ${result.toVersion} (${result.planned} step${result.planned === 1 ? "" : "s"} planned, ${result.applied.length} applied, ${result.skipped.length} skipped${dryRun ? "; dry-run" : ""})`
  );
  for (const entry of result.applied) {
    log(`applied ${entry.id}: ${entry.changed.length} change${entry.changed.length === 1 ? "" : "s"}`);
  }
  for (const entry of result.skipped) {
    log(`skip    ${entry.id}: ${entry.reason}`);
  }
});
program.command("mcp").description("Run SwarmVault as a local MCP server over stdio.").action(async () => {
  if (isJson()) {
    process2.stderr.write(`${JSON.stringify({ status: "running", transport: "stdio" })}
`);
  }
  const controller = await startMcpServer(process2.cwd());
  process2.on("SIGINT", async () => {
    try {
      await controller.close();
    } catch {
    }
    process2.exit(0);
  });
});
program.command("install").description("Install SwarmVault instructions for an agent in the current project.").requiredOption(
  "--agent <agent>",
  "claude, codex, cursor, gemini, goose, opencode, copilot, aider, droid, pi, trae, claw, kiro, hermes, antigravity, vscode, amp, augment, adal, bob, cline, codebuddy, command-code, continue, cortex, crush, deepagents, firebender, iflow, junie, kilo-code, kimi, kode, mcpjam, mistral-vibe, mux, neovate, openclaw, openhands, pochi, qoder, qwen-code, replit, roo-code, trae-cn, warp, windsurf, or zencoder"
).option("--hook", "Also install hook/plugin guidance when the target agent supports it", false).action(
  async (options) => {
    const hookCapableAgents = /* @__PURE__ */ new Set(["codex", "claude", "opencode", "gemini", "copilot"]);
    if (options.hook && !hookCapableAgents.has(options.agent)) {
      throw new Error("--hook is only supported for --agent codex, claude, opencode, gemini, or copilot");
    }
    const result = await installAgent(process2.cwd(), options.agent, { hook: options.hook ?? false });
    if (isJson()) {
      emitJson({ ...result, hook: options.hook ?? false });
    } else {
      log(`Installed rules into ${result.target}`);
      if (result.targets.length > 1) {
        log(`Also wrote: ${result.targets.filter((entry) => entry !== result.target).join(", ")}`);
      }
      for (const warning of result.warnings ?? []) {
        emitNotice(warning);
      }
    }
  }
);
program.command("demo").description("Try SwarmVault with a bundled sample vault \u2014 zero config, zero API keys.").option("--port <port>", "Port for the graph viewer").option("--no-serve", "Skip launching the graph viewer after compile").action(async (options) => {
  const { mkdtemp, writeFile: writeFile3, mkdir: mkdir3 } = await import("fs/promises");
  const { tmpdir } = await import("os");
  const path3 = await import("path");
  const demoDir = await mkdtemp(path3.join(tmpdir(), "swarmvault-demo-"));
  if (!isJson()) {
    log(`Creating demo vault in ${demoDir}`);
  }
  const rawDir = path3.join(demoDir, "raw", "sources");
  await mkdir3(rawDir, { recursive: true });
  await writeFile3(
    path3.join(rawDir, "llm-wiki-pattern.md"),
    [
      "# The LLM Wiki Pattern",
      "",
      "Most AI tools answer a question then throw away the work. The LLM Wiki pattern",
      "keeps a durable wiki between you and raw sources. The LLM does the bookkeeping \u2014",
      "updating cross-references, noting contradictions, maintaining consistency \u2014 while",
      "you do the thinking.",
      "",
      "## Three Layers",
      "",
      "1. **Raw sources** \u2014 immutable documents: books, articles, papers, transcripts, code.",
      "2. **The wiki** \u2014 LLM-generated markdown: summaries, entity pages, concept pages, cross-references.",
      "3. **The schema** \u2014 rules for how the wiki is organized and what matters in your domain.",
      "",
      "## Why This Beats RAG",
      "",
      "RAG re-derives knowledge on every query. The wiki compiles knowledge once and compounds",
      "it over time. Good answers get filed back as new pages, so exploration builds on itself.",
      "",
      "## Key Operations",
      "",
      "- **Ingest** \u2014 read a source, write summaries, update cross-references",
      "- **Query** \u2014 search the wiki, synthesize answers, file results back",
      "- **Lint** \u2014 health-check for contradictions, orphans, stale claims",
      ""
    ].join("\n")
  );
  await writeFile3(
    path3.join(rawDir, "knowledge-graphs.md"),
    [
      "# Knowledge Graphs for AI",
      "",
      "A knowledge graph represents information as typed nodes and edges with provenance.",
      "Unlike flat document stores, graphs let you traverse relationships, detect communities,",
      "and find surprising connections between concepts.",
      "",
      "## Node Types",
      "",
      "- **Sources** \u2014 the raw documents that feed the graph",
      "- **Concepts** \u2014 abstract ideas extracted from sources",
      "- **Entities** \u2014 named things: people, tools, organizations",
      "- **Modules** \u2014 code units with import/export relationships",
      "",
      "## Edge Semantics",
      "",
      "Every edge carries an evidence class: `extracted` (directly found), `inferred`",
      "(derived by reasoning), or `conflicted` (contradictory evidence). This provenance",
      "tracking prevents hallucination from compounding silently.",
      "",
      "## Contradiction Detection",
      "",
      "When two sources make conflicting claims, the graph flags the contradiction rather",
      "than silently picking one. This is critical for research wikis where outdated claims",
      "from older papers may conflict with newer findings.",
      "",
      "RAG systems do not track contradictions because they re-derive everything per query.",
      "A compiled wiki with a graph layer can detect and surface them automatically.",
      ""
    ].join("\n")
  );
  await writeFile3(
    path3.join(rawDir, "local-first-tools.md"),
    [
      "# Local-First AI Tools",
      "",
      "Local-first means your data stays on your machine by default. No cloud dependency,",
      "no API keys required for basic operation. Privacy is the default, not an option.",
      "",
      "## Advantages",
      "",
      "- **Privacy** \u2014 sensitive documents never leave your machine",
      "- **Speed** \u2014 no network latency for search and graph operations",
      "- **Reliability** \u2014 works offline, no service outages",
      "- **Cost** \u2014 no per-query API charges for basic workflows",
      "",
      "## The Heuristic Provider",
      "",
      "A heuristic provider uses deterministic text analysis \u2014 keyword extraction, TF-IDF,",
      "structural parsing \u2014 instead of LLM inference. It produces lower-quality summaries",
      "but runs instantly with zero setup. This makes it ideal for first-run experiences",
      "and air-gapped environments.",
      "",
      "For sharper concept extraction, pair with a local LLM via Ollama. This keeps",
      "everything on-device while getting model-backed analysis.",
      ""
    ].join("\n")
  );
  await initVault(demoDir, {});
  await ingestDirectory(demoDir, rawDir, {});
  await compileVault(demoDir, {});
  const { paths } = await loadVaultConfig(demoDir);
  const shareCardPath = path3.join(demoDir, "wiki", "graph", "share-card.md");
  const shareCardSvgPath = path3.join(demoDir, "wiki", "graph", "share-card.svg");
  const shareKitPath = path3.join(demoDir, "wiki", "graph", "share-kit");
  let graphStats = "";
  try {
    const raw = await readFile2(paths.graphPath, "utf-8");
    const graph2 = JSON.parse(raw);
    graphStats = ` (${graph2.nodes.length} nodes, ${graph2.edges.length} edges)`;
  } catch {
  }
  if (!isJson()) {
    log("");
    log(`Demo vault created${graphStats}.`);
    log("");
    log("What just happened:");
    log("  1. Created 3 sample sources about LLM wikis, knowledge graphs, and local-first tools");
    log("  2. Ingested and compiled them into a knowledge graph");
    log("  3. Generated wiki pages with cross-references and a graph report");
    log("");
    log(`Vault location: ${demoDir}`);
    log(`Share card: ${shareCardPath}`);
    log(`Visual card: ${shareCardSvgPath}`);
    log(`Share kit: ${shareKitPath}`);
  }
  if (options.serve !== false) {
    const port = options.port ? parsePositiveInt(options.port, 0) || void 0 : void 0;
    const server = await startGraphServer(demoDir, port, { full: false });
    if (isJson()) {
      emitJson({
        demoDir,
        graphStats: graphStats.trim(),
        shareCardPath,
        shareCardSvgPath,
        shareKitPath,
        port: server.port,
        url: `http://localhost:${server.port}`
      });
    } else {
      log(`Graph viewer running at http://localhost:${server.port}`);
      log("");
      log("Try next:");
      log(`  cd ${demoDir}`);
      log("  swarmvault graph share --post");
      log('  swarmvault query "How does contradiction detection work?"');
      log("  swarmvault lint");
    }
    process2.on("SIGINT", async () => {
      try {
        await server.close();
      } catch {
      }
      process2.exit(0);
    });
  } else if (isJson()) {
    emitJson({ demoDir, graphStats: graphStats.trim(), shareCardPath, shareCardSvgPath, shareKitPath });
  } else {
    log("");
    log("Try next:");
    log(`  cd ${demoDir}`);
    log("  swarmvault graph share --post");
    log("  swarmvault graph serve");
    log('  swarmvault query "How does contradiction detection work?"');
  }
});
program.command("diff").description("Show what changed in the knowledge graph since the last compile.").action(async () => {
  const rootDir = process2.cwd();
  const { paths } = await loadVaultConfig(rootDir);
  let currentGraph;
  try {
    const raw = await readFile2(paths.graphPath, "utf-8");
    currentGraph = JSON.parse(raw);
  } catch {
    if (isJson()) {
      emitJson({ error: "No compiled graph found. Run swarmvault compile first." });
    } else {
      log("No compiled graph found. Run swarmvault compile first.");
    }
    return;
  }
  let previousGraph;
  const { execFileSync } = await import("child_process");
  try {
    const relPath = paths.graphPath.replace(`${rootDir}/`, "");
    const previousRaw = execFileSync("git", ["show", `HEAD:${relPath}`], {
      cwd: rootDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    });
    previousGraph = JSON.parse(previousRaw);
  } catch {
  }
  if (!previousGraph) {
    if (isJson()) {
      emitJson({
        status: "no-baseline",
        current: {
          nodes: currentGraph.nodes.length,
          edges: currentGraph.edges.length,
          pages: currentGraph.pages.length,
          communities: currentGraph.communities?.length ?? 0
        }
      });
    } else {
      log("No previous graph found (not in a git repo or no prior commit).");
      log("");
      log("Current graph:");
      log(`  ${currentGraph.nodes.length} nodes, ${currentGraph.edges.length} edges, ${currentGraph.pages.length} pages`);
      if (currentGraph.communities?.length) {
        log(`  ${currentGraph.communities.length} communities`);
      }
      const conflicted = currentGraph.edges.filter((e) => e.status === "conflicted");
      if (conflicted.length) {
        log(`  ${conflicted.length} conflicted edges`);
      }
    }
    return;
  }
  const diff = graphDiff(previousGraph, currentGraph);
  if (isJson()) {
    emitJson(diff);
    return;
  }
  if (diff.summary === "No changes") {
    log("No changes since last commit.");
    return;
  }
  log(diff.summary);
  log("");
  if (diff.addedNodes.length) {
    log("Added nodes:");
    for (const node of diff.addedNodes) {
      log(`  + [${node.type}] ${node.label}`);
    }
    log("");
  }
  if (diff.removedNodes.length) {
    log("Removed nodes:");
    for (const node of diff.removedNodes) {
      log(`  - [${node.type}] ${node.label}`);
    }
    log("");
  }
  if (diff.addedPages.length) {
    log("Added pages:");
    for (const page of diff.addedPages) {
      log(`  + [${page.kind}] ${page.title} (${page.path})`);
    }
    log("");
  }
  if (diff.removedPages.length) {
    log("Removed pages:");
    for (const page of diff.removedPages) {
      log(`  - [${page.kind}] ${page.title} (${page.path})`);
    }
    log("");
  }
  if (diff.addedEdges.length) {
    log(`Added edges: ${diff.addedEdges.length}`);
    for (const edge of diff.addedEdges.slice(0, 20)) {
      log(`  + ${edge.source} -[${edge.relation}]-> ${edge.target} (${edge.evidenceClass})`);
    }
    if (diff.addedEdges.length > 20) {
      log(`  ... and ${diff.addedEdges.length - 20} more`);
    }
    log("");
  }
  if (diff.removedEdges.length) {
    log(`Removed edges: ${diff.removedEdges.length}`);
    for (const edge of diff.removedEdges.slice(0, 20)) {
      log(`  - ${edge.source} -[${edge.relation}]-> ${edge.target}`);
    }
    if (diff.removedEdges.length > 20) {
      log(`  ... and ${diff.removedEdges.length - 20} more`);
    }
  }
});
program.command("doctor").description("Diagnose vault health across graph, retrieval, review queues, watch state, and migrations.").option("--repair", "Run safe repairs such as rebuilding stale retrieval artifacts", false).action(async (options) => {
  const report = await doctorVault(process2.cwd(), { repair: options.repair });
  if (isJson()) {
    emitJson(report);
    return;
  }
  log(`Vault health: ${report.status}${report.repaired.length ? ` (repaired: ${report.repaired.join(", ")})` : ""}`);
  log(
    `Sources ${report.counts.sources} | Managed ${report.counts.managedSources} | Pages ${report.counts.pages} | Nodes ${report.counts.nodes} | Edges ${report.counts.edges}`
  );
  if (report.recommendations.length) {
    log("Recommended next actions:");
    for (const recommendation of report.recommendations) {
      const action = recommendation.command ? ` ${recommendation.command}` : "";
      log(`  [${recommendation.priority}] ${recommendation.label}:${action}`);
      if (recommendation.description) {
        log(`    ${recommendation.description}`);
      }
    }
  }
  for (const check of report.checks) {
    log(`[${check.status}] ${check.label}: ${check.summary}`);
    if (check.detail) {
      log(`  ${check.detail}`);
    }
    for (const action of check.actions ?? []) {
      log(`  Try: ${action.command} - ${action.description}`);
    }
  }
});
var retrieval = program.command("retrieval").description("Inspect and repair the local retrieval index.");
retrieval.command("status").description("Show retrieval index health and configuration.").action(async () => {
  const status = await getRetrievalStatus(process2.cwd());
  if (isJson()) {
    emitJson(status);
    return;
  }
  log(`Retrieval backend: ${status.configured.backend}`);
  log(`Index: ${status.indexExists ? "present" : "missing"} (${status.indexPath})`);
  log(`Manifest: ${status.manifestExists ? "present" : "missing"} (${status.manifestPath})`);
  log(`Graph: ${status.graphExists ? "present" : "missing"}`);
  log(`Pages indexed: ${status.pageCount}`);
  log(`State: ${status.stale ? "stale" : "fresh"}`);
  for (const warning of status.warnings) {
    log(`Warning: ${warning}`);
  }
});
retrieval.command("rebuild").description("Rebuild the local retrieval index from the current graph.").action(async () => {
  const status = await rebuildRetrievalIndex(process2.cwd());
  if (isJson()) {
    emitJson(status);
    return;
  }
  log(`Rebuilt retrieval index at ${status.indexPath}`);
  log(`Pages indexed: ${status.pageCount}`);
});
retrieval.command("doctor").description("Diagnose retrieval index problems and optionally repair them.").option("--repair", "Rebuild stale or missing retrieval artifacts", false).action(async (options) => {
  const result = await doctorRetrieval(process2.cwd(), { repair: options.repair });
  if (isJson()) {
    emitJson(result);
    return;
  }
  log(`Retrieval health: ${result.ok ? "ok" : "needs attention"}`);
  if (result.repaired) {
    log("Repaired retrieval index.");
  }
  if (result.actions.length) {
    log(`Suggested action(s): ${result.actions.join(", ")}`);
  }
  for (const warning of result.status.warnings) {
    log(`Warning: ${warning}`);
  }
});
program.command("scan").description("Quick-start: initialize, ingest, compile, and serve a graph viewer in one command.").argument("<directory>", "Directory to scan").option("--port <port>", "Port for the graph viewer").option("--no-serve", "Skip launching the graph viewer after compile").action(async (directory, options) => {
  const rootDir = process2.cwd();
  await initVault(rootDir, {});
  if (!isJson()) {
    log("Initialized workspace.");
  }
  const result = await ingestDirectory(rootDir, directory, {});
  if (!isJson()) {
    log(`Ingested ${result.imported.length} file(s).`);
  }
  const compiled = await compileVault(rootDir, {});
  const shareCardPath = path2.join(rootDir, "wiki", "graph", "share-card.md");
  const shareCardSvgPath = path2.join(rootDir, "wiki", "graph", "share-card.svg");
  const shareKitPath = path2.join(rootDir, "wiki", "graph", "share-kit");
  if (!isJson()) {
    log(`Compiled ${compiled.sourceCount} source(s), ${compiled.pageCount} page(s).`);
    log(`Share card: ${shareCardPath}`);
    log(`Visual card: ${shareCardSvgPath}`);
    log(`Share kit: ${shareKitPath}`);
    log("Post text: swarmvault graph share --post");
  }
  if (options.serve !== false) {
    const port = options.port ? parsePositiveInt(options.port, 0) || void 0 : void 0;
    const server = await startGraphServer(rootDir, port, { full: false });
    if (isJson()) {
      emitJson({
        ...result,
        compiled,
        shareCardPath,
        shareCardSvgPath,
        shareKitPath,
        port: server.port,
        url: `http://localhost:${server.port}`
      });
    } else {
      log(`Graph viewer running at http://localhost:${server.port}`);
    }
    process2.on("SIGINT", async () => {
      try {
        await server.close();
      } catch {
      }
      process2.exit(0);
    });
  } else if (isJson()) {
    emitJson({ ...result, compiled, shareCardPath, shareCardSvgPath, shareKitPath });
  }
});
function enableStructuredJsonOnSubcommands(command) {
  for (const subcommand of command.commands) {
    const hasJsonOption = subcommand.options.some((option) => option.attributeName() === "json");
    if (!hasJsonOption) {
      subcommand.option("--json", "Emit structured JSON output", false);
    }
    enableStructuredJsonOnSubcommands(subcommand);
  }
}
enableStructuredJsonOnSubcommands(program);
program.hook("preAction", (_command, actionCommand) => {
  activeCommand = actionCommand;
});
program.parseAsync(process2.argv).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (isJson()) {
    emitJson({ error: message });
  } else {
    process2.stderr.write(`${message}
`);
  }
  process2.exit(1);
});

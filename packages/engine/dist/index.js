import {
  ALL_SOURCE_CLASSES,
  DEFAULT_CONSOLIDATION_CONFIG,
  DEFAULT_HALF_LIFE_DAYS,
  DEFAULT_HALF_LIFE_DAYS_BY_SOURCE_CLASS,
  DEFAULT_PROMOTION_CONFIG,
  DEFAULT_REDACTION_PATTERNS,
  DEFAULT_STALE_THRESHOLD,
  LARGE_REPO_NODE_THRESHOLD,
  acceptApproval,
  addInput,
  appendWatchRun,
  applyDecayToPages,
  archiveCandidate,
  benchmarkVault,
  blastRadius,
  blastRadiusVault,
  bootstrapDemo,
  buildConfiguredRedactor,
  buildContextPack,
  buildGraphShareArtifact,
  buildMemoryGraphElements,
  buildOutputPage,
  buildRedactor,
  buildSchemaPrompt,
  compileVault,
  composeVaultSchema,
  computeDecayScore,
  consolidateVault,
  createSupersessionEdge,
  createWebSearchAdapter,
  deleteContextPack,
  doctorRetrieval,
  ensureManagedSourcesArtifact,
  ensureMemoryLedger,
  evaluateCandidateForPromotion,
  explainGraphVault,
  exploreVault,
  findLatestGuidedSourceSessionByScope,
  finishMemoryTask,
  getGraphCommunityVault,
  getRetrievalStatus,
  getWebSearchAdapterForTask,
  getWorkspaceInfo,
  graphDiff,
  graphHash,
  graphStatsVault,
  guidedSourceSessionStatePath,
  importInbox,
  ingestDirectory,
  ingestInput,
  ingestInputDetailed,
  initVault,
  installAgent,
  installConfiguredAgents,
  lintVault,
  listApprovals,
  listCandidates,
  listContextPacks,
  listGodNodes,
  listGraphHyperedges,
  listManifests,
  listMemoryTasks,
  listPages,
  listTrackedRepoRoots,
  loadManagedSources,
  loadMemoryTaskPages,
  loadVaultSchema,
  loadVaultSchemas,
  managedSourceWorkingDir,
  markPagesStaleForSources,
  markSuperseded,
  memoryTaskHashes,
  mergePendingSemanticRefresh,
  normalizeOutputAssets,
  parseStoredPage,
  pathGraphVault,
  persistDecayFrontmatter,
  previewCandidatePromotions,
  promoteCandidate,
  queryGraphVault,
  queryVault,
  readApproval,
  readContextPack,
  readExtractedText,
  readGraphReport,
  readGuidedSourceSession,
  readMemoryTask,
  readPage,
  readPendingSemanticRefresh,
  readWatchStatusArtifact,
  rebuildRetrievalIndex,
  recordSession,
  refreshGraphClusters,
  refreshVaultAfterOutputSave,
  rejectApproval,
  removeManifestBySourceId,
  renderContextPackLlms,
  renderContextPackMarkdown,
  renderGraphShareBundleFiles,
  renderGraphShareMarkdown,
  renderGraphSharePreviewHtml,
  renderGraphShareSvg,
  renderMemoryTaskMarkdown,
  resetDecay,
  resolveConsolidationConfig,
  resolveDecayConfig,
  resolveLargeRepoDefaults,
  resolveRedactionPatterns,
  resolveRetrievalConfig,
  resumeMemoryTask,
  runAutoPromotion,
  runConsolidation,
  runDecayPass,
  saveManagedSources,
  searchPages,
  searchVault,
  stageGeneratedOutputPages,
  startMemoryTask,
  syncTrackedRepos,
  syncTrackedReposForWatch,
  updateMemoryTask,
  validateUrlSafety,
  writeGuidedSourceSession,
  writeRetrievalManifest,
  writeWatchStatusArtifact
} from "./chunk-UYJY4ICT.js";
import {
  LocalWhisperProviderAdapter,
  appendJsonLine,
  assertProviderCapability,
  createProvider,
  defaultVaultConfig,
  defaultVaultSchema,
  ensureDir,
  fileExists,
  getProviderForTask,
  initWorkspace,
  isPathWithin,
  listFilesRecursive,
  loadVaultConfig,
  normalizeWhitespace,
  readJsonFile,
  resolvePaths,
  sha256,
  slugify,
  toPosix,
  truncate,
  uniqueBy,
  writeJsonFile
} from "./chunk-R5T7AGVB.js";
import {
  estimatePageTokens,
  estimateTokens,
  trimToTokenBudget
} from "./chunk-NAIERP4C.js";

// src/auto-commit.ts
import { execFile } from "child_process";
import { promisify } from "util";
var execFileAsync = promisify(execFile);
async function git(rootDir, ...args) {
  const { stdout } = await execFileAsync("git", args, { cwd: rootDir });
  return stdout.trim();
}
async function isGitRepo(rootDir) {
  try {
    await git(rootDir, "rev-parse", "--is-inside-work-tree");
    return true;
  } catch {
    return false;
  }
}
async function autoCommitWikiChanges(rootDir, operation, detail, options) {
  const { config, paths } = await loadVaultConfig(rootDir);
  if (!options?.force && !config.autoCommit) {
    return null;
  }
  if (!await isGitRepo(rootDir)) {
    return null;
  }
  const wikiRelative = paths.wikiDir.replace(`${rootDir}/`, "");
  const stateRelative = paths.stateDir.replace(`${rootDir}/`, "");
  await git(rootDir, "add", wikiRelative, stateRelative).catch(() => {
  });
  const status = await git(rootDir, "diff", "--cached", "--stat");
  if (!status) {
    return null;
  }
  const message = detail ? `vault ${operation}: ${detail}` : `vault ${operation}`;
  await git(rootDir, "commit", "-m", message);
  return message;
}

// src/doctor.ts
import fs3 from "fs/promises";
import path3 from "path";

// src/migrate.ts
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
var VAULT_VERSION_FILENAME = "vault-version.json";
async function walkMarkdownFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await walkMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}
async function readFrontmatterFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);
    const data = parsed.data ?? {};
    return { data, content: parsed.content };
  } catch {
    return null;
  }
}
async function writeFrontmatterFile(filePath, data, content) {
  await fs.writeFile(filePath, matter.stringify(content, data), "utf8");
}
function relFromRoot(rootDir, filePath) {
  return path.relative(rootDir, filePath) || filePath;
}
var MIGRATION_ADD_DECAY_FIELDS = {
  id: "0.9-to-0.10-add-decay-fields",
  fromVersion: "0.9.0",
  toVersion: "0.10.0",
  description: "Add decay_score and last_confirmed_at frontmatter to pages missing them.",
  async apply(ctx, options) {
    const changed = [];
    const files = await walkMarkdownFiles(ctx.paths.wikiDir);
    for (const filePath of files) {
      const parsed = await readFrontmatterFile(filePath);
      if (!parsed) continue;
      const { data, content } = parsed;
      if (!data.page_id) continue;
      let mutated = false;
      if (data.decay_score === void 0) {
        data.decay_score = 1;
        mutated = true;
      }
      if (data.last_confirmed_at === void 0) {
        data.last_confirmed_at = data.updated_at ?? (/* @__PURE__ */ new Date()).toISOString();
        mutated = true;
      }
      if (mutated) {
        if (!options.dryRun) {
          await writeFrontmatterFile(filePath, data, content);
        }
        changed.push(relFromRoot(ctx.rootDir, filePath));
      }
    }
    return { changed };
  }
};
var MIGRATION_ADD_TIER_DEFAULT = {
  id: "0.9-to-0.10-add-tier-default",
  fromVersion: "0.9.0",
  toVersion: "0.10.0",
  description: 'Tag insight pages with tier: "working" when the field is absent.',
  async apply(ctx, options) {
    const changed = [];
    const insightsDir = path.join(ctx.paths.wikiDir, "insights");
    const files = await walkMarkdownFiles(insightsDir);
    for (const filePath of files) {
      const parsed = await readFrontmatterFile(filePath);
      if (!parsed) continue;
      const { data, content } = parsed;
      if (data.kind !== "insight") continue;
      if (data.tier !== void 0) continue;
      data.tier = "working";
      if (!options.dryRun) {
        await writeFrontmatterFile(filePath, data, content);
      }
      changed.push(relFromRoot(ctx.rootDir, filePath));
    }
    return { changed };
  }
};
var MIGRATION_ADD_TAGS_FIELD = {
  id: "0.10-to-0.11-add-tags-field",
  fromVersion: "0.10.0",
  toVersion: "0.11.0",
  description: 'Add default tags: ["<kind>"] to derived concept and entity pages missing a tags array.',
  async apply(ctx, options) {
    const changed = [];
    const files = await walkMarkdownFiles(ctx.paths.wikiDir);
    for (const filePath of files) {
      const parsed = await readFrontmatterFile(filePath);
      if (!parsed) continue;
      const { data, content } = parsed;
      const kind = data.kind;
      if (kind !== "concept" && kind !== "entity") continue;
      if (Array.isArray(data.tags) && data.tags.length > 0) continue;
      data.tags = [kind];
      if (!options.dryRun) {
        await writeFrontmatterFile(filePath, data, content);
      }
      changed.push(relFromRoot(ctx.rootDir, filePath));
    }
    return { changed };
  }
};
var MIGRATION_NOTE_WATCH_BLOCK = {
  id: "0.10-to-0.11-normalize-config-watch-absence",
  fromVersion: "0.10.0",
  toVersion: "0.11.0",
  description: "Record that swarmvault.config.json watch block is optional in 0.11 (no file changes).",
  async apply() {
    return { changed: [] };
  }
};
var MIGRATION_REBUILD_SEARCH_INDEX = {
  id: "any-to-any-rebuild-search-index",
  fromVersion: "0.9.0",
  toVersion: "0.11.0",
  description: "Mark state/search.sqlite as stale so the next compile regenerates it.",
  async apply(ctx, options) {
    const changed = [];
    const searchPath = path.join(ctx.paths.stateDir, "search.sqlite");
    try {
      await fs.access(searchPath);
      if (!options.dryRun) {
        await fs.rm(searchPath, { force: true });
      }
      changed.push(relFromRoot(ctx.rootDir, searchPath));
    } catch {
    }
    return { changed };
  }
};
var MIGRATION_ADD_MEMORY_LEDGER = {
  id: "1.5-to-2.0-add-memory-ledger",
  fromVersion: "1.5.0",
  toVersion: "2.0.0",
  description: "Create the Agent Memory ledger directories and wiki index without modifying existing context packs.",
  async apply(ctx, options) {
    if (options.dryRun) {
      return {
        changed: [
          relFromRoot(ctx.rootDir, path.join(ctx.paths.stateDir, "memory", "tasks")),
          relFromRoot(ctx.rootDir, path.join(ctx.paths.wikiDir, "memory", "index.md"))
        ]
      };
    }
    return await ensureMemoryLedger(ctx.rootDir);
  }
};
var MIGRATION_3_0_RETRIEVAL_AND_TASKS = {
  id: "2.0-to-3.0-retrieval-and-task-surface",
  fromVersion: "2.0.0",
  toVersion: "3.0.0",
  description: "Move search config into retrieval, create state/retrieval, remove the legacy search index, and add task aliases to memory frontmatter.",
  async apply(ctx, options) {
    const changed = [];
    const configPath = path.join(ctx.rootDir, "swarmvault.config.json");
    try {
      const raw = await fs.readFile(configPath, "utf8");
      const config = JSON.parse(raw);
      let mutated = false;
      if (config.search) {
        config.retrieval = {
          backend: "sqlite",
          shardSize: 25e3,
          hybrid: config.search.hybrid ?? true,
          rerank: config.search.rerank ?? false,
          ...config.tasks?.embeddingProvider && !config.retrieval?.embeddingProvider ? { embeddingProvider: config.tasks.embeddingProvider } : {},
          ...config.retrieval ?? {}
        };
        delete config.search;
        mutated = true;
      } else if (!config.retrieval) {
        config.retrieval = {
          backend: "sqlite",
          shardSize: 25e3,
          hybrid: true,
          rerank: false,
          ...config.tasks?.embeddingProvider ? { embeddingProvider: config.tasks.embeddingProvider } : {}
        };
        mutated = true;
      }
      if (mutated) {
        if (!options.dryRun) {
          await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}
`, "utf8");
        }
        changed.push(relFromRoot(ctx.rootDir, configPath));
      }
    } catch {
    }
    const retrievalDir = path.join(ctx.paths.stateDir, "retrieval");
    if (!options.dryRun) {
      await ensureDir(retrievalDir);
    }
    changed.push(relFromRoot(ctx.rootDir, retrievalDir));
    const legacySearchPath = path.join(ctx.paths.stateDir, "search.sqlite");
    try {
      await fs.access(legacySearchPath);
      if (!options.dryRun) {
        await fs.rm(legacySearchPath, { force: true });
      }
      changed.push(relFromRoot(ctx.rootDir, legacySearchPath));
    } catch {
    }
    const memoryTaskDir = path.join(ctx.paths.wikiDir, "memory", "tasks");
    const files = await walkMarkdownFiles(memoryTaskDir);
    for (const filePath of files) {
      const parsed = await readFrontmatterFile(filePath);
      if (!parsed) continue;
      const { data, content } = parsed;
      if (data.kind !== "memory_task") continue;
      let mutated = false;
      if (data.task_id === void 0 && typeof data.memory_task_id === "string") {
        data.task_id = data.memory_task_id;
        mutated = true;
      }
      if (data.task_status === void 0 && typeof data.memory_status === "string") {
        data.task_status = data.memory_status;
        mutated = true;
      }
      if (Array.isArray(data.tags) && !data.tags.includes("agent-task")) {
        data.tags = [...data.tags, "agent-task"];
        mutated = true;
      }
      if (mutated) {
        if (!options.dryRun) {
          await writeFrontmatterFile(filePath, data, content);
        }
        changed.push(relFromRoot(ctx.rootDir, filePath));
      }
    }
    return { changed: [...new Set(changed)] };
  }
};
var ALL_MIGRATIONS = [
  MIGRATION_ADD_DECAY_FIELDS,
  MIGRATION_ADD_TIER_DEFAULT,
  MIGRATION_ADD_TAGS_FIELD,
  MIGRATION_NOTE_WATCH_BLOCK,
  MIGRATION_REBUILD_SEARCH_INDEX,
  MIGRATION_ADD_MEMORY_LEDGER,
  MIGRATION_3_0_RETRIEVAL_AND_TASKS
];
function compareSemver(a, b) {
  const pa = a.split(".").map((part) => Number.parseInt(part, 10));
  const pb = b.split(".").map((part) => Number.parseInt(part, 10));
  for (let i = 0; i < 3; i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}
async function readVaultVersionRecord(stateDir) {
  const filePath = path.join(stateDir, VAULT_VERSION_FILENAME);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (typeof parsed.version === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}
async function readGraphVersion(stateDir) {
  const filePath = path.join(stateDir, "graph.json");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const version = parsed?.generatedBy?.version;
    return typeof version === "string" ? version : null;
  } catch {
    return null;
  }
}
async function detectVaultVersion(rootDir) {
  const { paths } = await initWorkspace(rootDir);
  const record = await readVaultVersionRecord(paths.stateDir);
  if (record) return record.version;
  const graphVersion = await readGraphVersion(paths.stateDir);
  if (graphVersion) return graphVersion;
  return null;
}
async function currentPackageVersion() {
  try {
    const raw = await fs.readFile(new URL("../package.json", import.meta.url), "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed.version === "string" && parsed.version.trim() ? parsed.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}
async function planMigration(rootDir, targetVersion) {
  const fromVersion = await detectVaultVersion(rootDir);
  const toVersion = targetVersion ?? await currentPackageVersion();
  const steps = ALL_MIGRATIONS.filter((step) => compareSemver(step.toVersion, toVersion) <= 0).filter((step) => {
    if (!fromVersion) return true;
    return compareSemver(step.toVersion, fromVersion) > 0;
  });
  return { fromVersion, toVersion, steps };
}
async function writeVaultVersionRecord(stateDir, record) {
  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(path.join(stateDir, VAULT_VERSION_FILENAME), `${JSON.stringify(record, null, 2)}
`, "utf8");
}
async function runMigration(rootDir, options = {}) {
  const dryRun = options.dryRun ?? true;
  const { paths } = await initWorkspace(rootDir);
  const plan = await planMigration(rootDir, options.targetVersion);
  const applied = [];
  const skipped = [];
  const ctx = {
    rootDir,
    paths: { wikiDir: paths.wikiDir, stateDir: paths.stateDir, rootDir }
  };
  for (const step of plan.steps) {
    const { changed } = await step.apply(ctx, { dryRun });
    if (changed.length === 0) {
      skipped.push({ id: step.id, reason: "No changes required." });
    } else {
      applied.push({ id: step.id, changed });
    }
  }
  if (!dryRun && applied.length > 0) {
    await writeVaultVersionRecord(paths.stateDir, {
      version: plan.toVersion,
      migratedAt: (/* @__PURE__ */ new Date()).toISOString(),
      appliedSteps: applied.map((entry) => entry.id)
    });
  }
  return {
    planned: plan.steps.length,
    applied,
    skipped,
    dryRun,
    fromVersion: plan.fromVersion,
    toVersion: plan.toVersion
  };
}

// src/watch.ts
import fs2 from "fs/promises";
import path2 from "path";
import process2 from "process";
import chokidar from "chokidar";
var MAX_BACKOFF_MS = 3e4;
var BACKOFF_THRESHOLD = 3;
var CRITICAL_THRESHOLD = 10;
var REPO_WATCH_IGNORES = /* @__PURE__ */ new Set([".git", ".venv"]);
var CODE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".kts",
  ".scala",
  ".sc",
  ".dart",
  ".lua",
  ".zig",
  ".cs",
  ".php",
  ".rb",
  ".swift",
  ".c",
  ".h",
  ".cpp",
  ".cc",
  ".cxx",
  ".hpp",
  ".hxx",
  ".sh",
  ".bash",
  ".zsh",
  ".ps1",
  ".psm1",
  ".ex",
  ".exs",
  ".jl",
  ".r",
  ".R"
]);
var FILE_CHANGE_RE = /^(?:add|change|unlink):(.+)$/;
function isCodeOnlyChange(reasons) {
  for (const reason of reasons) {
    const match = reason.match(FILE_CHANGE_RE);
    if (!match) return false;
    const ext = path2.extname(match[1]).toLowerCase();
    if (!ext || !CODE_EXTENSIONS.has(ext)) return false;
  }
  return reasons.size > 0;
}
function hasNonCodeChanges(reasons) {
  for (const reason of reasons) {
    const match = reason.match(FILE_CHANGE_RE);
    if (!match) return true;
    const ext = path2.extname(match[1]).toLowerCase();
    if (!ext || !CODE_EXTENSIONS.has(ext)) return true;
  }
  return false;
}
function collectNonCodePaths(reasons) {
  const result = [];
  for (const reason of reasons) {
    const match = reason.match(FILE_CHANGE_RE);
    if (!match) {
      result.push(reason);
      continue;
    }
    const ext = path2.extname(match[1]).toLowerCase();
    if (!ext || !CODE_EXTENSIONS.has(ext)) result.push(match[1]);
  }
  return result;
}
function hasIgnoredRepoSegment(baseDir, targetPath) {
  const relativePath = path2.relative(baseDir, targetPath);
  if (!relativePath || relativePath.startsWith("..")) {
    return false;
  }
  return relativePath.split(path2.sep).some((segment) => REPO_WATCH_IGNORES.has(segment));
}
function workspaceIgnoreRoots(rootDir, paths) {
  return [
    paths.rawDir,
    paths.wikiDir,
    paths.stateDir,
    paths.agentDir,
    paths.inboxDir,
    path2.join(rootDir, ".claude"),
    path2.join(rootDir, ".cursor"),
    path2.join(rootDir, ".obsidian")
  ].map((candidate) => path2.resolve(candidate));
}
async function resolveWatchTargets(rootDir, paths, options) {
  const targets = /* @__PURE__ */ new Set([path2.resolve(paths.inboxDir)]);
  if (options.repo) {
    for (const repoRoot of await resolveWatchedRepoRoots(rootDir, { overrideRoots: options.overrideRoots })) {
      targets.add(path2.resolve(repoRoot));
    }
  }
  return [...targets].sort((left, right) => left.localeCompare(right));
}
function resolveRootRelative(rootDir, candidate) {
  return path2.isAbsolute(candidate) ? path2.resolve(candidate) : path2.resolve(rootDir, candidate);
}
async function resolveWatchedRepoRoots(rootDir, options = {}) {
  const override = options.overrideRoots?.filter(Boolean) ?? [];
  if (override.length > 0) {
    return dedupeSorted(override.map((candidate) => resolveRootRelative(rootDir, candidate)));
  }
  const config = options.config ?? (await loadVaultConfig(rootDir).catch(() => null))?.config;
  const watchConfig = config?.watch ?? {};
  const explicit = watchConfig.repoRoots?.filter(Boolean) ?? [];
  const baseRoots = explicit.length > 0 ? explicit.map((candidate) => resolveRootRelative(rootDir, candidate)) : await listTrackedRepoRoots(rootDir);
  const excluded = new Set(
    (watchConfig.excludeRepoRoots ?? []).filter(Boolean).map((candidate) => resolveRootRelative(rootDir, candidate))
  );
  return dedupeSorted(baseRoots.filter((candidate) => !excluded.has(path2.resolve(candidate))));
}
async function listWatchedRoots(rootDir, options = {}) {
  return resolveWatchedRepoRoots(rootDir, options);
}
function dedupeSorted(values) {
  return [...new Set(values.map((value) => path2.resolve(value)))].sort((left, right) => left.localeCompare(right));
}
async function readConfigJson(rootDir) {
  const configPath = path2.join(rootDir, "swarmvault.config.json");
  const raw = await fs2.readFile(configPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("swarmvault.config.json must contain a JSON object.");
  }
  return { path: configPath, content: parsed };
}
async function writeConfigJson(configPath, content) {
  await fs2.writeFile(configPath, `${JSON.stringify(content, null, 2)}
`, "utf8");
}
function getWatchBlock(config) {
  const block = config.watch;
  if (block && typeof block === "object" && !Array.isArray(block)) {
    return block;
  }
  return {};
}
async function addWatchedRoot(rootDir, candidate) {
  const resolved = resolveRootRelative(rootDir, candidate);
  const { path: configPath, content } = await readConfigJson(rootDir);
  const watchBlock = getWatchBlock(content);
  const current = Array.isArray(watchBlock.repoRoots) ? watchBlock.repoRoots.filter((value) => typeof value === "string") : [];
  const resolvedSet = new Set(current.map((value) => resolveRootRelative(rootDir, value)));
  if (!resolvedSet.has(resolved)) {
    current.push(resolved);
  }
  watchBlock.repoRoots = [...new Set(current.map((value) => resolveRootRelative(rootDir, value)))].sort(
    (left, right) => left.localeCompare(right)
  );
  content.watch = watchBlock;
  await writeConfigJson(configPath, content);
  return resolved;
}
async function removeWatchedRoot(rootDir, candidate) {
  const resolved = resolveRootRelative(rootDir, candidate);
  const { path: configPath, content } = await readConfigJson(rootDir);
  const watchBlock = getWatchBlock(content);
  const current = Array.isArray(watchBlock.repoRoots) ? watchBlock.repoRoots.filter((value) => typeof value === "string") : [];
  const filtered = current.filter((value) => resolveRootRelative(rootDir, value) !== resolved);
  const removed = filtered.length !== current.length;
  if (filtered.length > 0) {
    watchBlock.repoRoots = filtered;
    content.watch = watchBlock;
  } else if ("repoRoots" in watchBlock) {
    delete watchBlock.repoRoots;
    if (Object.keys(watchBlock).length === 0) {
      delete content.watch;
    } else {
      content.watch = watchBlock;
    }
  }
  await writeConfigJson(configPath, content);
  return removed;
}
async function performWatchCycle(rootDir, paths, options, codeOnly = false) {
  const imported = await importInbox(rootDir, paths.inboxDir);
  const repoRoots = options.repo ? await resolveWatchedRepoRoots(rootDir, { overrideRoots: options.overrideRoots }) : void 0;
  const repoSync = options.repo ? await syncTrackedReposForWatch(rootDir, void 0, repoRoots) : null;
  const compile = await compileVault(rootDir, { codeOnly });
  const pendingSemanticRefresh = repoSync ? await mergePendingSemanticRefresh(rootDir, repoSync.pendingSemanticRefresh) : await readPendingSemanticRefresh(rootDir);
  const stalePagePaths = await markPagesStaleForSources(
    rootDir,
    pendingSemanticRefresh.map((entry) => entry.sourceId).filter((sourceId) => Boolean(sourceId))
  );
  const lintFindingCount = options.lint ? (await lintVault(rootDir)).length : void 0;
  return {
    watchedRepoRoots: repoSync?.repoRoots ?? [],
    importedCount: imported.imported.length,
    scannedCount: imported.scannedCount,
    attachmentCount: imported.attachmentCount,
    repoImportedCount: repoSync?.imported.length ?? 0,
    repoUpdatedCount: repoSync?.updated.length ?? 0,
    repoRemovedCount: repoSync?.removed.length ?? 0,
    repoScannedCount: repoSync?.scannedCount ?? 0,
    pendingSemanticRefreshCount: pendingSemanticRefresh.length,
    pendingSemanticRefreshPaths: pendingSemanticRefresh.map((entry) => entry.path),
    changedPages: [.../* @__PURE__ */ new Set([...compile.changedPages, ...stalePagePaths])],
    lintFindingCount
  };
}
async function runWatchCycle(rootDir, options = {}) {
  const { paths } = await initWorkspace(rootDir);
  const startedAt = /* @__PURE__ */ new Date();
  let success = true;
  let error;
  let result = {
    watchedRepoRoots: [],
    importedCount: 0,
    scannedCount: 0,
    attachmentCount: 0,
    repoImportedCount: 0,
    repoUpdatedCount: 0,
    repoRemovedCount: 0,
    repoScannedCount: 0,
    pendingSemanticRefreshCount: 0,
    pendingSemanticRefreshPaths: [],
    changedPages: []
  };
  try {
    result = await performWatchCycle(rootDir, paths, options, options.codeOnly ?? false);
    return result;
  } catch (caught) {
    success = false;
    error = caught instanceof Error ? caught.message : String(caught);
    throw caught;
  } finally {
    const finishedAt = /* @__PURE__ */ new Date();
    await recordSession(rootDir, {
      operation: "watch",
      title: `Watch cycle for ${paths.inboxDir}${options.repo ? " and tracked repos" : ""}`,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      success,
      error,
      changedPages: result.changedPages,
      lintFindingCount: result.lintFindingCount,
      lines: [
        "reasons=once",
        `imported=${result.importedCount}`,
        `scanned=${result.scannedCount}`,
        `attachments=${result.attachmentCount}`,
        `repo_scanned=${result.repoScannedCount}`,
        `repo_imported=${result.repoImportedCount}`,
        `repo_updated=${result.repoUpdatedCount}`,
        `repo_removed=${result.repoRemovedCount}`,
        `pending_semantic_refresh=${result.pendingSemanticRefreshCount}`,
        `lint=${result.lintFindingCount ?? 0}`
      ]
    });
    await appendWatchRun(rootDir, {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      inputDir: paths.inboxDir,
      reasons: ["once"],
      importedCount: result.importedCount + result.repoImportedCount + result.repoUpdatedCount,
      scannedCount: result.scannedCount + result.repoScannedCount,
      attachmentCount: result.attachmentCount,
      changedPages: result.changedPages,
      repoImportedCount: result.repoImportedCount,
      repoUpdatedCount: result.repoUpdatedCount,
      repoRemovedCount: result.repoRemovedCount,
      repoScannedCount: result.repoScannedCount,
      pendingSemanticRefreshCount: result.pendingSemanticRefreshCount,
      pendingSemanticRefreshPaths: result.pendingSemanticRefreshPaths,
      lintFindingCount: result.lintFindingCount,
      success,
      error
    });
    await writeWatchStatusArtifact(rootDir, {
      generatedAt: finishedAt.toISOString(),
      watchedRepoRoots: result.watchedRepoRoots,
      lastRun: {
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        inputDir: paths.inboxDir,
        reasons: ["once"],
        importedCount: result.importedCount + result.repoImportedCount + result.repoUpdatedCount,
        scannedCount: result.scannedCount + result.repoScannedCount,
        attachmentCount: result.attachmentCount,
        changedPages: result.changedPages,
        repoImportedCount: result.repoImportedCount,
        repoUpdatedCount: result.repoUpdatedCount,
        repoRemovedCount: result.repoRemovedCount,
        repoScannedCount: result.repoScannedCount,
        pendingSemanticRefreshCount: result.pendingSemanticRefreshCount,
        pendingSemanticRefreshPaths: result.pendingSemanticRefreshPaths,
        lintFindingCount: result.lintFindingCount,
        success,
        error
      },
      pendingSemanticRefresh: await readPendingSemanticRefresh(rootDir)
    });
  }
}
async function watchVault(rootDir, options = {}) {
  const { paths } = await initWorkspace(rootDir);
  const baseDebounceMs = options.debounceMs ?? 900;
  const ignoredRoots = workspaceIgnoreRoots(rootDir, paths);
  const inboxWatchRoot = path2.resolve(paths.inboxDir);
  let watchTargets = await resolveWatchTargets(rootDir, paths, options);
  let timer;
  let running = false;
  let pending = false;
  let closed = false;
  let consecutiveFailures = 0;
  let currentDebounceMs = baseDebounceMs;
  const reasons = /* @__PURE__ */ new Set();
  let activeCycle = null;
  const watcher = chokidar.watch(watchTargets, {
    ignoreInitial: true,
    usePolling: true,
    interval: 100,
    ignored: (targetPath) => {
      const absolutePath = path2.resolve(targetPath);
      const primaryTarget = watchTargets.filter((watchTarget) => isPathWithin(watchTarget, absolutePath)).sort((left, right) => right.length - left.length)[0] ?? null;
      if (!primaryTarget) {
        return false;
      }
      if (primaryTarget !== inboxWatchRoot && ignoredRoots.some((ignoreRoot) => isPathWithin(ignoreRoot, absolutePath))) {
        return true;
      }
      return hasIgnoredRepoSegment(primaryTarget, absolutePath);
    },
    awaitWriteFinish: {
      stabilityThreshold: Math.max(250, Math.floor(baseDebounceMs / 2)),
      pollInterval: 100
    }
  });
  const syncWatchTargets = async () => {
    const nextTargets = await resolveWatchTargets(rootDir, paths, options);
    const nextSet = new Set(nextTargets);
    const currentSet = new Set(watchTargets);
    const toRemove = watchTargets.filter((target) => !nextSet.has(target));
    const toAdd = nextTargets.filter((target) => !currentSet.has(target));
    if (toRemove.length > 0) {
      await watcher.unwatch(toRemove);
    }
    if (toAdd.length > 0) {
      await watcher.add(toAdd);
    }
    watchTargets = nextTargets;
  };
  const schedule = (reason) => {
    if (closed) {
      return;
    }
    reasons.add(reason);
    pending = true;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      const cycle = runCycle();
      activeCycle = cycle.finally(() => {
        if (activeCycle === cycle) {
          activeCycle = null;
        }
      });
    }, currentDebounceMs);
  };
  const runCycle = async () => {
    if (running || closed || !pending) {
      return;
    }
    pending = false;
    running = true;
    const startedAt = /* @__PURE__ */ new Date();
    const detectedCodeOnly = isCodeOnlyChange(reasons);
    const hasDeferredNonCode = !detectedCodeOnly && hasNonCodeChanges(reasons);
    const codeOnlyChange = options.codeOnly || detectedCodeOnly || hasDeferredNonCode;
    const runReasons = [...reasons];
    reasons.clear();
    if (hasDeferredNonCode) {
      const nonCodePaths = collectNonCodePaths(new Set(runReasons));
      process2.stderr.write(
        `[swarmvault watch] Non-code changes detected (${nonCodePaths.length} file(s)) \u2014 run \`swarmvault compile\` to include LLM re-analysis.
`
      );
    } else if (codeOnlyChange) {
      process2.stderr.write("[swarmvault watch] Code-only changes detected \u2014 skipping LLM re-analysis.\n");
    }
    let importedCount = 0;
    let scannedCount = 0;
    let attachmentCount = 0;
    let repoImportedCount = 0;
    let repoUpdatedCount = 0;
    let repoRemovedCount = 0;
    let repoScannedCount = 0;
    let watchedRepoRoots = [];
    let pendingSemanticRefreshCount = 0;
    let pendingSemanticRefreshPaths = [];
    let changedPages = [];
    let lintFindingCount;
    let success = true;
    let error;
    try {
      const result = await performWatchCycle(rootDir, paths, options, codeOnlyChange);
      importedCount = result.importedCount;
      scannedCount = result.scannedCount;
      attachmentCount = result.attachmentCount;
      repoImportedCount = result.repoImportedCount;
      repoUpdatedCount = result.repoUpdatedCount;
      repoRemovedCount = result.repoRemovedCount;
      repoScannedCount = result.repoScannedCount;
      watchedRepoRoots = result.watchedRepoRoots;
      pendingSemanticRefreshCount = result.pendingSemanticRefreshCount;
      pendingSemanticRefreshPaths = result.pendingSemanticRefreshPaths;
      changedPages = result.changedPages;
      lintFindingCount = result.lintFindingCount;
      consecutiveFailures = 0;
      currentDebounceMs = baseDebounceMs;
      await syncWatchTargets();
    } catch (caught) {
      success = false;
      error = caught instanceof Error ? caught.message : String(caught);
      consecutiveFailures++;
      pending = true;
      if (consecutiveFailures >= CRITICAL_THRESHOLD) {
        process2.stderr.write(
          `[swarmvault watch] ${consecutiveFailures} consecutive failures. Check vault state. Continuing at max backoff.
`
        );
      }
      if (consecutiveFailures >= BACKOFF_THRESHOLD) {
        const multiplier = 2 ** (consecutiveFailures - BACKOFF_THRESHOLD);
        currentDebounceMs = Math.min(baseDebounceMs * multiplier, MAX_BACKOFF_MS);
      }
    } finally {
      const finishedAt = /* @__PURE__ */ new Date();
      try {
        await recordSession(rootDir, {
          operation: "watch",
          title: `Watch cycle for ${paths.inboxDir}${options.repo ? " and tracked repos" : ""}`,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          success,
          error,
          changedPages,
          lintFindingCount,
          lines: [
            `reasons=${runReasons.join(",") || "none"}`,
            `code_only=${codeOnlyChange}`,
            `imported=${importedCount}`,
            `scanned=${scannedCount}`,
            `attachments=${attachmentCount}`,
            `repo_scanned=${repoScannedCount}`,
            `repo_imported=${repoImportedCount}`,
            `repo_updated=${repoUpdatedCount}`,
            `repo_removed=${repoRemovedCount}`,
            `lint=${lintFindingCount ?? 0}`
          ]
        });
      } catch {
        process2.stderr.write("[swarmvault watch] Failed to record session log.\n");
      }
      try {
        await appendWatchRun(rootDir, {
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          inputDir: paths.inboxDir,
          reasons: runReasons,
          importedCount: importedCount + repoImportedCount + repoUpdatedCount,
          scannedCount: scannedCount + repoScannedCount,
          attachmentCount,
          changedPages,
          repoImportedCount,
          repoUpdatedCount,
          repoRemovedCount,
          repoScannedCount,
          pendingSemanticRefreshCount,
          pendingSemanticRefreshPaths,
          lintFindingCount,
          success,
          error
        });
      } catch {
        process2.stderr.write("[swarmvault watch] Failed to append watch run.\n");
      }
      try {
        await writeWatchStatusArtifact(rootDir, {
          generatedAt: finishedAt.toISOString(),
          watchedRepoRoots,
          lastRun: {
            startedAt: startedAt.toISOString(),
            finishedAt: finishedAt.toISOString(),
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            inputDir: paths.inboxDir,
            reasons: runReasons,
            importedCount: importedCount + repoImportedCount + repoUpdatedCount,
            scannedCount: scannedCount + repoScannedCount,
            attachmentCount,
            changedPages,
            repoImportedCount,
            repoUpdatedCount,
            repoRemovedCount,
            repoScannedCount,
            pendingSemanticRefreshCount,
            pendingSemanticRefreshPaths,
            lintFindingCount,
            success,
            error
          },
          pendingSemanticRefresh: await readPendingSemanticRefresh(rootDir)
        });
      } catch {
        process2.stderr.write("[swarmvault watch] Failed to write watch status artifact.\n");
      }
      running = false;
      if (pending && !closed) {
        schedule("queued");
      }
    }
  };
  const reasonForPath = (targetPath) => {
    const baseDir = watchTargets.filter((watchTarget) => isPathWithin(watchTarget, path2.resolve(targetPath))).sort((left, right) => right.length - left.length)[0] ?? paths.inboxDir;
    return path2.relative(baseDir, targetPath) || ".";
  };
  watcher.on("add", (filePath) => schedule(`add:${reasonForPath(filePath)}`)).on("change", (filePath) => schedule(`change:${reasonForPath(filePath)}`)).on("unlink", (filePath) => schedule(`unlink:${reasonForPath(filePath)}`)).on("addDir", (dirPath) => schedule(`addDir:${reasonForPath(dirPath)}`)).on("unlinkDir", (dirPath) => schedule(`unlinkDir:${reasonForPath(dirPath)}`)).on("error", (caught) => schedule(`error:${caught instanceof Error ? caught.message : String(caught)}`));
  await new Promise((resolve, reject) => {
    const handleReady = () => {
      watcher.off("error", handleError);
      resolve();
    };
    const handleError = (caught) => {
      watcher.off("ready", handleReady);
      reject(caught);
    };
    watcher.once("ready", handleReady);
    watcher.once("error", handleError);
  });
  return {
    close: async () => {
      closed = true;
      if (timer) {
        clearTimeout(timer);
      }
      await watcher.close();
      await activeCycle;
    }
  };
}
async function getWatchStatus(rootDir) {
  const persisted = await readWatchStatusArtifact(rootDir);
  const watchedRepoRoots = await resolveWatchedRepoRoots(rootDir);
  const pendingSemanticRefresh = await readPendingSemanticRefresh(rootDir);
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    watchedRepoRoots,
    lastRun: persisted?.lastRun,
    pendingSemanticRefresh
  };
}

// src/doctor.ts
function worstStatus(checks) {
  if (checks.some((check) => check.status === "error")) return "error";
  if (checks.some((check) => check.status === "warning")) return "warning";
  return "ok";
}
function recommendationPriority(status) {
  if (status === "error") return "high";
  if (status === "warning") return "medium";
  return "low";
}
function safeActionFor(checkId, command) {
  if (checkId === "retrieval" && command === "swarmvault retrieval doctor --repair") {
    return "doctor:repair";
  }
  return void 0;
}
function buildRecommendations(checks) {
  const rank = { high: 0, medium: 1, low: 2 };
  return checks.filter((check) => check.status !== "ok").flatMap(
    (check) => (check.actions ?? []).map((action) => ({
      id: `${check.id}:${action.command}`,
      label: `Fix ${check.label}`,
      summary: check.summary,
      priority: recommendationPriority(check.status),
      status: check.status,
      sourceCheckId: check.id,
      command: action.command,
      description: action.description,
      safeAction: safeActionFor(check.id, action.command)
    }))
  ).sort((left, right) => rank[left.priority] - rank[right.priority] || left.label.localeCompare(right.label));
}
async function currentPackageVersion2() {
  try {
    const raw = await fs3.readFile(new URL("../package.json", import.meta.url), "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed.version === "string" && parsed.version.trim() ? parsed.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}
async function doctorVault(rootDir, options = {}) {
  const generatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const { paths } = await loadVaultConfig(rootDir);
  const version = await currentPackageVersion2();
  const repaired = [];
  const checks = [];
  const [
    configExists,
    schemaExists,
    graph,
    manifests,
    managedSourcesArtifact,
    approvals,
    candidates,
    tasks,
    watchStatus,
    migrationPlan,
    retrievalDoctor
  ] = await Promise.all([
    fileExists(paths.configPath),
    fileExists(paths.schemaPath),
    readJsonFile(paths.graphPath).catch(() => null),
    listManifests(rootDir).catch(() => []),
    readJsonFile(paths.managedSourcesPath).catch(() => null),
    listApprovals(rootDir).catch(() => []),
    listCandidates(rootDir).catch(() => []),
    listMemoryTasks(rootDir).catch(() => []),
    getWatchStatus(rootDir).catch(() => ({ generatedAt: "", watchedRepoRoots: [], pendingSemanticRefresh: [] })),
    planMigration(rootDir).catch(() => ({ fromVersion: null, toVersion: version, steps: [] })),
    doctorRetrieval(rootDir, { repair: options.repair }).catch((error) => ({
      ok: false,
      repaired: false,
      actions: ["rebuild"],
      status: {
        configured: { backend: "sqlite", shardSize: 25e3, hybrid: true, rerank: false },
        manifestPath: paths.retrievalManifestPath,
        indexPath: paths.searchDbPath,
        manifestExists: false,
        indexExists: false,
        graphExists: false,
        stale: true,
        pageCount: 0,
        shardCount: 0,
        warnings: [error instanceof Error ? error.message : String(error)]
      }
    }))
  ]);
  if (retrievalDoctor.repaired) {
    repaired.push("retrieval");
  }
  checks.push({
    id: "workspace",
    label: "Workspace",
    status: configExists && schemaExists ? "ok" : "error",
    summary: configExists && schemaExists ? "Workspace config and schema are present." : "Workspace config or schema is missing.",
    detail: [configExists ? null : "Missing swarmvault.config.json.", schemaExists ? null : "Missing swarmvault.schema.md."].filter((value) => Boolean(value)).join(" "),
    actions: configExists && schemaExists ? [] : [
      {
        command: "swarmvault init",
        description: "Initialize the missing workspace files."
      }
    ]
  });
  checks.push({
    id: "graph",
    label: "Graph",
    status: graph ? "ok" : "error",
    summary: graph ? `Graph is present with ${graph.nodes.length} nodes, ${graph.edges.length} edges, and ${graph.pages.length} pages.` : "Graph artifact is missing.",
    actions: graph ? [] : [
      {
        command: "swarmvault compile",
        description: "Compile sources into graph and wiki artifacts."
      }
    ]
  });
  checks.push({
    id: "retrieval",
    label: "Retrieval",
    status: retrievalDoctor.ok ? "ok" : "warning",
    summary: retrievalDoctor.ok ? `Retrieval index is fresh with ${retrievalDoctor.status.pageCount} indexed pages.` : "Retrieval index needs attention.",
    detail: retrievalDoctor.status.warnings.join(" "),
    actions: retrievalDoctor.ok ? [] : [
      {
        command: "swarmvault retrieval doctor --repair",
        description: "Rebuild stale or missing retrieval artifacts."
      }
    ]
  });
  const pendingApprovals = approvals.reduce((total, approval) => total + approval.pendingCount, 0);
  const managedSources = managedSourcesArtifact?.sources ?? [];
  const managedSourcesNeedingAttention = managedSources.filter((source) => source.status !== "ready" || source.lastSyncStatus === "error");
  checks.push({
    id: "managed_sources",
    label: "Managed Sources",
    status: managedSourcesNeedingAttention.length ? "warning" : "ok",
    summary: managedSources.length ? `${managedSources.length} managed source${managedSources.length === 1 ? "" : "s"} registered.` : "No managed sources registered.",
    detail: managedSourcesNeedingAttention.map((source) => `${source.id}: ${source.lastError ?? source.status}`).join(" "),
    actions: managedSourcesNeedingAttention.length ? [
      {
        command: "swarmvault source list",
        description: "Inspect managed source status."
      },
      {
        command: "swarmvault source reload --all",
        description: "Refresh registered managed sources."
      }
    ] : []
  });
  checks.push({
    id: "review",
    label: "Review Queues",
    status: pendingApprovals || candidates.length ? "warning" : "ok",
    summary: pendingApprovals || candidates.length ? `${pendingApprovals} pending approval entr${pendingApprovals === 1 ? "y" : "ies"} and ${candidates.length} candidate page${candidates.length === 1 ? "" : "s"} need review.` : "No pending approval entries or candidate pages.",
    actions: pendingApprovals || candidates.length ? [
      {
        command: "swarmvault review list",
        description: "Inspect staged approval bundles."
      },
      {
        command: "swarmvault candidate list",
        description: "Inspect candidate concept and entity pages."
      }
    ] : []
  });
  checks.push({
    id: "watch",
    label: "Watch",
    status: watchStatus.pendingSemanticRefresh.length ? "warning" : "ok",
    summary: watchStatus.pendingSemanticRefresh.length ? `${watchStatus.pendingSemanticRefresh.length} repo change${watchStatus.pendingSemanticRefresh.length === 1 ? "" : "s"} await semantic refresh.` : "No pending semantic refresh entries.",
    actions: watchStatus.pendingSemanticRefresh.length ? [
      {
        command: "swarmvault watch --repo --once",
        description: "Refresh pending repo changes."
      }
    ] : []
  });
  const migrationNeedsAttention = Boolean(migrationPlan.fromVersion && migrationPlan.steps.length);
  checks.push({
    id: "migration",
    label: "Migration",
    status: migrationNeedsAttention ? "warning" : "ok",
    summary: migrationNeedsAttention ? `${migrationPlan.steps.length} migration step${migrationPlan.steps.length === 1 ? "" : "s"} would run before ${migrationPlan.toVersion}.` : migrationPlan.fromVersion ? `Vault is current for ${migrationPlan.toVersion}.` : "No vault version record was found; current generated artifacts do not require an automatic migration warning.",
    actions: migrationNeedsAttention ? [
      {
        command: "swarmvault migrate --dry-run",
        description: "Preview migration changes before applying."
      }
    ] : []
  });
  const status = worstStatus(checks);
  const recommendations = buildRecommendations(checks);
  return {
    ok: status === "ok",
    status,
    generatedAt,
    rootDir: path3.resolve(rootDir),
    version,
    counts: {
      sources: manifests.length,
      managedSources: managedSources.length,
      pages: graph?.pages.length ?? 0,
      nodes: graph?.nodes.length ?? 0,
      edges: graph?.edges.length ?? 0,
      approvalsPending: pendingApprovals,
      candidates: candidates.length,
      tasks: tasks.length,
      pendingSemanticRefresh: watchStatus.pendingSemanticRefresh.length
    },
    checks,
    recommendations,
    repaired
  };
}

// src/graph-export.ts
import { readFileSync } from "fs";
import fs4 from "fs/promises";
import { createRequire } from "module";
import path4 from "path";
import matter2 from "gray-matter";

// src/graph-interchange.ts
function exportHyperedgeNodeId(hyperedge) {
  return `hyperedge:${hyperedge.id}`;
}
function relationType(relation) {
  const normalized = relation.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return normalized || "RELATED_TO";
}
function cypherStringLiteral(value) {
  let escaped = "";
  for (const char of value) {
    switch (char) {
      case "\\":
        escaped += "\\\\";
        break;
      case "'":
        escaped += "\\'";
        break;
      case "\n":
        escaped += "\\n";
        break;
      case "\r":
        escaped += "\\r";
        break;
      case "	":
        escaped += "\\t";
        break;
      case "\b":
        escaped += "\\b";
        break;
      case "\f":
        escaped += "\\f";
        break;
      default: {
        const code = char.codePointAt(0) ?? 0;
        escaped += code < 32 || code === 8232 || code === 8233 ? `\\u${code.toString(16).padStart(4, "0")}` : char;
      }
    }
  }
  return `'${escaped}'`;
}
function graphPageById(graph) {
  return new Map(graph.pages.map((page) => [page.id, page]));
}
function graphNodeById(graph) {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}
function normalizeSwarmNodeProps(node, page) {
  return {
    id: node.id,
    label: node.label,
    type: node.type,
    sourceIds: JSON.stringify(node.sourceIds),
    projectIds: JSON.stringify(node.projectIds),
    ...node.pageId ? { pageId: node.pageId } : {},
    ...page?.path ? { pagePath: page.path } : {},
    ...node.sourceClass ? { sourceClass: node.sourceClass } : {},
    ...node.language ? { language: node.language } : {},
    ...node.moduleId ? { moduleId: node.moduleId } : {},
    ...node.symbolKind ? { symbolKind: node.symbolKind } : {},
    ...node.communityId ? { communityId: node.communityId } : {},
    ...node.freshness ? { freshness: node.freshness } : {},
    ...node.confidence !== void 0 ? { confidence: node.confidence } : {},
    ...node.degree !== void 0 ? { degree: node.degree } : {},
    ...node.bridgeScore !== void 0 ? { bridgeScore: node.bridgeScore } : {},
    ...node.isGodNode !== void 0 ? { isGodNode: node.isGodNode } : {},
    ...node.surpriseReason ? { surpriseReason: node.surpriseReason } : {}
  };
}
function normalizeHyperedgeNodeProps(hyperedge) {
  return {
    id: exportHyperedgeNodeId(hyperedge),
    label: hyperedge.label,
    type: "hyperedge",
    relation: hyperedge.relation,
    evidenceClass: hyperedge.evidenceClass,
    confidence: hyperedge.confidence,
    sourcePageIds: JSON.stringify(hyperedge.sourcePageIds),
    why: hyperedge.why
  };
}
function normalizeEdgeProps(edge) {
  return {
    id: edge.id,
    relation: edge.relation,
    status: edge.status,
    evidenceClass: edge.evidenceClass,
    confidence: edge.confidence,
    provenance: JSON.stringify(edge.provenance),
    ...edge.similarityReasons?.length ? { similarityReasons: JSON.stringify(edge.similarityReasons) } : {},
    ...edge.similarityBasis ? { similarityBasis: edge.similarityBasis } : {}
  };
}
function normalizeGroupMemberProps(hyperedge, nodeId) {
  return {
    id: `member:${hyperedge.id}:${nodeId}`,
    relation: "group_member",
    status: "inferred",
    evidenceClass: hyperedge.evidenceClass,
    confidence: hyperedge.confidence,
    provenance: JSON.stringify(hyperedge.sourcePageIds)
  };
}
function filterGraphBySourceClasses(graph, includeClasses) {
  const allowed = new Set(includeClasses);
  const nodeIds = new Set(graph.nodes.filter((node) => node.sourceClass && allowed.has(node.sourceClass)).map((node) => node.id));
  const pageIds = new Set(graph.pages.filter((page) => page.sourceClass && allowed.has(page.sourceClass)).map((page) => page.id));
  return {
    ...graph,
    nodes: graph.nodes.filter((node) => nodeIds.has(node.id)),
    edges: graph.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)),
    hyperedges: graph.hyperedges.map((hyperedge) => ({
      ...hyperedge,
      nodeIds: hyperedge.nodeIds.filter((nodeId) => nodeIds.has(nodeId))
    })).filter((hyperedge) => hyperedge.nodeIds.length >= 2),
    communities: (graph.communities ?? []).map((community) => ({
      ...community,
      nodeIds: community.nodeIds.filter((nodeId) => nodeIds.has(nodeId))
    })).filter((community) => community.nodeIds.length > 0),
    sources: graph.sources.filter((source) => source.sourceClass && allowed.has(source.sourceClass)),
    pages: graph.pages.filter((page) => pageIds.has(page.id))
  };
}
function graphCounts(graph) {
  return {
    sources: graph.sources.length,
    pages: graph.pages.length,
    nodes: graph.nodes.length,
    relationships: graph.edges.length,
    hyperedges: graph.hyperedges.length,
    groupMembers: graph.hyperedges.reduce((total, hyperedge) => total + hyperedge.nodeIds.length, 0)
  };
}

// src/graph-report-html.ts
function htmlEscape(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
var SOURCE_CLASS_LABELS = {
  first_party: "First-party",
  third_party: "Third-party",
  resource: "Resource",
  generated: "Generated"
};
function renderBenchmarkByClassSection(report) {
  const byClass = report?.benchmark?.byClass;
  if (!byClass) {
    return "";
  }
  const rows = ALL_SOURCE_CLASSES.map((sourceClass) => {
    const entry = byClass[sourceClass];
    const reductionPct = (entry.reductionRatio * 100).toFixed(1);
    return `<tr><td>${htmlEscape(SOURCE_CLASS_LABELS[sourceClass])}</td><td>${entry.sourceCount}</td><td>${entry.pageCount}</td><td>${entry.nodeCount}</td><td>${entry.godNodeCount}</td><td>${entry.naiveCorpusTokens}</td><td>${entry.finalContextTokens}</td><td>${reductionPct}%</td></tr>`;
  }).join("\n");
  return `<h2>Benchmark By Source Class</h2>
<table>
<thead><tr><th>Class</th><th>Sources</th><th>Pages</th><th>Nodes</th><th>God Nodes</th><th>Naive Tokens</th><th>Guided Tokens</th><th>Reduction</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>`;
}
function nodeTypeColor(type) {
  const colors = {
    source: "#f59e0b",
    module: "#fb7185",
    symbol: "#8b5cf6",
    rationale: "#14b8a6",
    concept: "#0ea5e9",
    entity: "#22c55e"
  };
  return colors[type] ?? "#94a3b8";
}
function renderGraphReportHtml(graph, report) {
  const nodesByType = /* @__PURE__ */ new Map();
  for (const node of graph.nodes) {
    nodesByType.set(node.type, (nodesByType.get(node.type) ?? 0) + 1);
  }
  const edgesByRelation = /* @__PURE__ */ new Map();
  for (const edge of graph.edges) {
    edgesByRelation.set(edge.relation, (edgesByRelation.get(edge.relation) ?? 0) + 1);
  }
  const pagesByKind = /* @__PURE__ */ new Map();
  for (const page of graph.pages) {
    const list = pagesByKind.get(page.kind) ?? [];
    list.push(page);
    pagesByKind.set(page.kind, list);
  }
  const godNodes = (report?.godNodes ?? []).slice(0, 15);
  const bridgeNodes = (report?.bridgeNodes ?? []).slice(0, 10);
  const communities = graph.communities ?? [];
  const warnings = report?.warnings ?? [];
  const overview = report?.overview ?? {
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    pages: graph.pages.length,
    communities: communities.length
  };
  const sortedEdgeRelations = [...edgesByRelation.entries()].sort((a, b) => b[1] - a[1]);
  const sortedNodeTypes = [...nodesByType.entries()].sort((a, b) => b[1] - a[1]);
  const sortedCommunities2 = [...communities].sort((a, b) => b.nodeIds.length - a.nodeIds.length).slice(0, 20);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SwarmVault Graph Report</title>
<style>
:root {
  --bg: #0f172a;
  --surface: #1e293b;
  --surface2: #334155;
  --text: #e2e8f0;
  --muted: #94a3b8;
  --accent: #0ea5e9;
  --accent2: #8b5cf6;
  --border: #475569;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
h1 {
  font-size: 1.75rem;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.25rem;
}
.subtitle { color: var(--muted); font-size: 0.85rem; margin-bottom: 2rem; }
h2 {
  font-size: 1.15rem;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
  margin: 2rem 0 1rem;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}
.stat-card .value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--accent);
}
.stat-card .label {
  font-size: 0.8rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}
th, td {
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
}
th {
  color: var(--muted);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
tr:hover { background: var(--surface); }
.bar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.bar {
  height: 8px;
  border-radius: 4px;
  background: var(--accent);
  min-width: 2px;
}
.warning-list {
  list-style: none;
  padding: 0;
}
.warning-list li {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  background: var(--surface);
  border-left: 3px solid var(--warning);
  border-radius: 0 4px 4px 0;
  font-size: 0.85rem;
}
.page-group { margin-bottom: 1.5rem; }
.page-group-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent);
  text-transform: capitalize;
  margin-bottom: 0.5rem;
}
.page-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.5rem;
}
.page-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.page-item .path { color: var(--muted); font-size: 0.7rem; }
.empty { color: var(--muted); font-style: italic; font-size: 0.85rem; }
input[type="text"] {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 0.85rem;
  margin-bottom: 1rem;
  outline: none;
}
input[type="text"]:focus { border-color: var(--accent); }
.section { margin-bottom: 1rem; }
footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.75rem; text-align: center; }
</style>
</head>
<body>
<h1>SwarmVault Graph Report</h1>
<p class="subtitle">Generated ${htmlEscape(report?.generatedAt ?? graph.generatedAt ?? (/* @__PURE__ */ new Date()).toISOString())}</p>

<div class="stats-grid">
  <div class="stat-card"><div class="value">${overview.nodes}</div><div class="label">Nodes</div></div>
  <div class="stat-card"><div class="value">${overview.edges}</div><div class="label">Edges</div></div>
  <div class="stat-card"><div class="value">${overview.pages}</div><div class="label">Pages</div></div>
  <div class="stat-card"><div class="value">${overview.communities}</div><div class="label">Communities</div></div>
  <div class="stat-card"><div class="value">${graph.sources.length}</div><div class="label">Sources</div></div>
  <div class="stat-card"><div class="value">${(graph.hyperedges ?? []).length}</div><div class="label">Hyperedges</div></div>
</div>

<h2>Node Types</h2>
<table>
<thead><tr><th>Type</th><th>Count</th><th></th></tr></thead>
<tbody>
${sortedNodeTypes.map(([type, count]) => {
    const maxCount = sortedNodeTypes[0]?.[1] ?? 1;
    const pct = Math.round(count / maxCount * 100);
    return `<tr><td><span class="badge" style="background:${nodeTypeColor(type)}">${htmlEscape(type)}</span></td><td>${count}</td><td><div class="bar-container"><div class="bar" style="width:${pct}%;background:${nodeTypeColor(type)}"></div></div></td></tr>`;
  }).join("\n")}
</tbody>
</table>

<h2>Edge Relations</h2>
<table>
<thead><tr><th>Relation</th><th>Count</th><th></th></tr></thead>
<tbody>
${sortedEdgeRelations.map(([relation, count]) => {
    const maxCount = sortedEdgeRelations[0]?.[1] ?? 1;
    const pct = Math.round(count / maxCount * 100);
    return `<tr><td>${htmlEscape(relation)}</td><td>${count}</td><td><div class="bar-container"><div class="bar" style="width:${pct}%"></div></div></td></tr>`;
  }).join("\n")}
</tbody>
</table>

${godNodes.length ? `<h2>God Nodes (Highest Connectivity)</h2>
<table>
<thead><tr><th>Label</th><th>Degree</th><th>Bridge Score</th><th></th></tr></thead>
<tbody>
${godNodes.map((node) => {
    const maxDegree = godNodes[0]?.degree ?? 1;
    const pct = Math.round((node.degree ?? 0) / maxDegree * 100);
    return `<tr><td>${htmlEscape(node.label)}</td><td>${node.degree ?? 0}</td><td>${(node.bridgeScore ?? 0).toFixed(2)}</td><td><div class="bar-container"><div class="bar" style="width:${pct}%;background:var(--accent2)"></div></div></td></tr>`;
  }).join("\n")}
</tbody>
</table>` : ""}

${bridgeNodes.length ? `<h2>Bridge Nodes</h2>
<table>
<thead><tr><th>Label</th><th>Degree</th><th>Bridge Score</th></tr></thead>
<tbody>
${bridgeNodes.map((node) => `<tr><td>${htmlEscape(node.label)}</td><td>${node.degree ?? 0}</td><td>${(node.bridgeScore ?? 0).toFixed(2)}</td></tr>`).join("\n")}
</tbody>
</table>` : ""}

${sortedCommunities2.length ? `<h2>Communities</h2>
<table>
<thead><tr><th>Label</th><th>Nodes</th><th></th></tr></thead>
<tbody>
${sortedCommunities2.map((c) => {
    const maxSize = sortedCommunities2[0]?.nodeIds.length ?? 1;
    const pct = Math.round(c.nodeIds.length / maxSize * 100);
    return `<tr><td>${htmlEscape(c.label)}</td><td>${c.nodeIds.length}</td><td><div class="bar-container"><div class="bar" style="width:${pct}%;background:var(--success)"></div></div></td></tr>`;
  }).join("\n")}
</tbody>
</table>` : ""}

${warnings.length ? `<h2>Warnings</h2>
<ul class="warning-list">
${warnings.map((w) => `<li>${htmlEscape(w)}</li>`).join("\n")}
</ul>` : ""}

${renderBenchmarkByClassSection(report)}

<h2>Pages</h2>
<input type="text" id="page-filter" placeholder="Filter pages..." />
<div id="pages-container">
${[...pagesByKind.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(
    ([kind, pages]) => `<div class="page-group" data-kind="${htmlEscape(kind)}">
  <div class="page-group-title">${htmlEscape(kind)} (${pages.length})</div>
  <div class="page-list">
    ${pages.sort((a, b) => a.title.localeCompare(b.title)).map(
      (p) => `<div class="page-item" data-title="${htmlEscape(p.title.toLowerCase())}"><strong>${htmlEscape(p.title)}</strong><div class="path">${htmlEscape(p.path)}</div></div>`
    ).join("\n    ")}
  </div>
</div>`
  ).join("\n")}
</div>

<footer>Generated by SwarmVault &middot; ${graph.nodes.length} nodes &middot; ${graph.edges.length} edges &middot; ${graph.pages.length} pages</footer>

<script>
document.getElementById("page-filter").addEventListener("input", function(e) {
  var query = e.target.value.toLowerCase();
  document.querySelectorAll(".page-item").forEach(function(el) {
    el.style.display = el.getAttribute("data-title").includes(query) ? "" : "none";
  });
  document.querySelectorAll(".page-group").forEach(function(group) {
    var visible = group.querySelectorAll('.page-item[style=""], .page-item:not([style])').length;
    group.style.display = visible > 0 || !query ? "" : "none";
  });
});
</script>
</body>
</html>`;
}

// src/graph-export.ts
var _visNetworkJs;
function loadVisNetworkJs() {
  if (!_visNetworkJs) {
    const require2 = createRequire(import.meta.url);
    const pkgDir = path4.dirname(require2.resolve("vis-network/package.json"));
    _visNetworkJs = readFileSync(path4.join(pkgDir, "standalone/umd/vis-network.min.js"), "utf8");
  }
  return _visNetworkJs;
}
function synthesizeHyperedgeHubs(hyperedges, nodes) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const hubNodes = [];
  const hubEdges = [];
  for (const hyperedge of hyperedges) {
    const participantIds = hyperedge.nodeIds.filter((nodeId) => nodeIds.has(nodeId));
    if (participantIds.length < 2) continue;
    const hubId = `hyper:${hyperedge.id}`;
    hubNodes.push({
      id: hubId,
      hyperedgeId: hyperedge.id,
      label: hyperedge.relation,
      relation: hyperedge.relation,
      participantIds,
      confidence: hyperedge.confidence ?? 0,
      evidenceClass: hyperedge.evidenceClass ?? "inferred",
      why: hyperedge.why ?? ""
    });
    for (const participantId of participantIds) {
      hubEdges.push({
        id: `hyper-edge:${hyperedge.id}:${participantId}`,
        hyperedgeId: hyperedge.id,
        source: hubId,
        target: participantId,
        relation: hyperedge.relation,
        confidence: hyperedge.confidence ?? 0,
        evidenceClass: hyperedge.evidenceClass ?? "inferred"
      });
    }
  }
  return { hubNodes, hubEdges };
}
function hexToObsidianColor(hex) {
  return { a: 1, rgb: Number.parseInt(hex.replace("#", ""), 16) };
}
var OBSIDIAN_PROPERTY_TYPES = {
  page_id: "text",
  kind: "text",
  title: "text",
  tags: "tags",
  aliases: "aliases",
  source_ids: "multitext",
  project_ids: "multitext",
  node_ids: "multitext",
  freshness: "text",
  status: "text",
  confidence: "number",
  created_at: "datetime",
  updated_at: "datetime",
  compiled_from: "multitext",
  managed_by: "text",
  backlinks: "multitext",
  schema_hash: "text",
  source_class: "text",
  source_type: "text",
  language: "text",
  graph_community: "text",
  degree: "number",
  bridge_score: "number",
  is_god_node: "checkbox",
  community: "text",
  cssclasses: "multitext"
};
var NODE_COLORS = {
  source: "#f59e0b",
  module: "#fb7185",
  symbol: "#8b5cf6",
  rationale: "#14b8a6",
  concept: "#0ea5e9",
  entity: "#22c55e"
};
function xmlEscape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function sortedCommunities(graph) {
  const known = (graph.communities ?? []).map((community) => ({
    ...community,
    nodeIds: [...community.nodeIds].sort((left, right) => left.localeCompare(right))
  }));
  const knownIds = new Set(known.flatMap((community) => community.nodeIds));
  const unassigned = graph.nodes.filter((node) => !knownIds.has(node.id)).sort((left, right) => left.label.localeCompare(right.label) || left.id.localeCompare(right.id)).map((node) => node.id);
  if (unassigned.length) {
    known.push({
      id: "community:unassigned",
      label: "Unassigned",
      nodeIds: unassigned
    });
  }
  return known.sort((left, right) => left.label.localeCompare(right.label) || left.id.localeCompare(right.id));
}
function layoutGraph(graph) {
  const communities = sortedCommunities(graph);
  const width = 1600;
  const height = Math.max(900, 420 * Math.max(1, Math.ceil(communities.length / 3)));
  const columns = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, communities.length))));
  const nodesById = graphNodeById(graph);
  const positioned = [];
  communities.forEach((community, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const centerX = 240 + col * 460;
    const centerY = 220 + row * 360;
    const members = community.nodeIds.map((nodeId) => nodesById.get(nodeId)).filter((node) => Boolean(node)).sort((left, right) => left.label.localeCompare(right.label) || left.id.localeCompare(right.id));
    const radius = Math.max(40, 36 * Math.sqrt(members.length));
    members.forEach((node, memberIndex) => {
      const angle = Math.PI * 2 * memberIndex / Math.max(1, members.length);
      positioned.push({
        node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    });
  });
  return { width, height, nodes: positioned };
}
function nodeShape(positioned) {
  const { node, x, y } = positioned;
  const fill = NODE_COLORS[node.type] ?? "#94a3b8";
  if (node.type === "module") {
    return `<rect x="${(x - 32).toFixed(1)}" y="${(y - 18).toFixed(1)}" width="64" height="36" rx="10" fill="${fill}" stroke="#0f172a" stroke-width="2" />`;
  }
  if (node.type === "symbol") {
    const points = [
      `${x.toFixed(1)},${(y - 18).toFixed(1)}`,
      `${(x + 18).toFixed(1)},${y.toFixed(1)}`,
      `${x.toFixed(1)},${(y + 18).toFixed(1)}`,
      `${(x - 18).toFixed(1)},${y.toFixed(1)}`
    ].join(" ");
    return `<polygon points="${points}" fill="${fill}" stroke="#0f172a" stroke-width="2" />`;
  }
  if (node.type === "rationale") {
    const points = [
      `${(x - 18).toFixed(1)},${(y - 10).toFixed(1)}`,
      `${x.toFixed(1)},${(y - 20).toFixed(1)}`,
      `${(x + 18).toFixed(1)},${(y - 10).toFixed(1)}`,
      `${(x + 18).toFixed(1)},${(y + 10).toFixed(1)}`,
      `${x.toFixed(1)},${(y + 20).toFixed(1)}`,
      `${(x - 18).toFixed(1)},${(y + 10).toFixed(1)}`
    ].join(" ");
    return `<polygon points="${points}" fill="${fill}" stroke="#0f172a" stroke-width="2" />`;
  }
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${node.isGodNode ? 24 : 18}" fill="${fill}" stroke="#0f172a" stroke-width="${node.isGodNode ? 3 : 2}" />`;
}
function nodeTitle(node, page) {
  return [
    node.label,
    `id=${node.id}`,
    `type=${node.type}`,
    node.communityId ? `community=${node.communityId}` : "",
    page ? `page=${page.path}` : "",
    node.degree !== void 0 ? `degree=${node.degree}` : "",
    node.bridgeScore !== void 0 ? `bridge=${node.bridgeScore}` : ""
  ].filter(Boolean).join("\n");
}
function renderSvg(graph) {
  const layout = layoutGraph(graph);
  const pageById = graphPageById(graph);
  const positionedById = new Map(layout.nodes.map((item) => [item.node.id, item]));
  const communityLabels = sortedCommunities(graph).map((community, index) => {
    const col = index % Math.max(1, Math.ceil(Math.sqrt(Math.max(1, sortedCommunities(graph).length))));
    const row = Math.floor(index / Math.max(1, Math.ceil(Math.sqrt(Math.max(1, sortedCommunities(graph).length)))));
    return {
      label: community.label,
      x: 240 + col * 460,
      y: 90 + row * 360
    };
  });
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-labelledby="title desc">`,
    '  <title id="title">SwarmVault Graph Export</title>',
    `  <desc id="desc">Nodes=${graph.nodes.length}, edges=${graph.edges.length}, communities=${graph.communities?.length ?? 0}</desc>`,
    "  <defs>",
    '    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">',
    '      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />',
    "    </marker>",
    "  </defs>",
    '  <rect width="100%" height="100%" fill="#020617" />'
  ];
  for (const community of communityLabels) {
    lines.push(
      `  <text x="${community.x.toFixed(1)}" y="${community.y.toFixed(1)}" fill="#cbd5e1" font-family="Avenir Next, Segoe UI, sans-serif" font-size="16" text-anchor="middle">${xmlEscape(community.label)}</text>`
    );
  }
  for (const edge of [...graph.edges].sort((left, right) => left.id.localeCompare(right.id))) {
    const source = positionedById.get(edge.source);
    const target = positionedById.get(edge.target);
    if (!source || !target) {
      continue;
    }
    lines.push(
      `  <g data-edge-id="${xmlEscape(edge.id)}" data-relation="${xmlEscape(edge.relation)}" data-evidence-class="${xmlEscape(edge.evidenceClass)}">`,
      `    <title>${xmlEscape(
        `${source.node.label} --${edge.relation}/${edge.evidenceClass}/${edge.confidence.toFixed(2)}--> ${target.node.label}`
      )}</title>`,
      `    <line x1="${source.x.toFixed(1)}" y1="${source.y.toFixed(1)}" x2="${target.x.toFixed(1)}" y2="${target.y.toFixed(1)}" stroke="#64748b" stroke-opacity="0.55" stroke-width="${Math.max(
        1.5,
        Math.min(4, edge.confidence * 3)
      ).toFixed(1)}" marker-end="url(#arrow)" />`,
      "  </g>"
    );
  }
  for (const positioned of layout.nodes) {
    const page = positioned.node.pageId ? pageById.get(positioned.node.pageId) : void 0;
    lines.push(
      `  <g data-node-id="${xmlEscape(positioned.node.id)}" data-node-type="${xmlEscape(positioned.node.type)}" data-community-id="${xmlEscape(positioned.node.communityId ?? "")}">`,
      `    <title>${xmlEscape(nodeTitle(positioned.node, page))}</title>`,
      `    ${nodeShape(positioned)}`,
      `    <text x="${positioned.x.toFixed(1)}" y="${(positioned.y + 34).toFixed(1)}" fill="#e2e8f0" font-family="Avenir Next, Segoe UI, sans-serif" font-size="11" text-anchor="middle">${xmlEscape(positioned.node.label)}</text>`,
      "  </g>"
    );
  }
  lines.push("</svg>", "");
  return lines.join("\n");
}
function graphMlData(value) {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (value === void 0 || value === null) {
    return "";
  }
  return String(value);
}
function renderGraphMl(graph) {
  const pageById = graphPageById(graph);
  const keys = [
    { id: "n_label", for: "node", name: "label", type: "string" },
    { id: "n_type", for: "node", name: "type", type: "string" },
    { id: "n_page", for: "node", name: "pageId", type: "string" },
    { id: "n_page_path", for: "node", name: "pagePath", type: "string" },
    { id: "n_language", for: "node", name: "language", type: "string" },
    { id: "n_symbol_kind", for: "node", name: "symbolKind", type: "string" },
    { id: "n_project_ids", for: "node", name: "projectIds", type: "string" },
    { id: "n_source_ids", for: "node", name: "sourceIds", type: "string" },
    { id: "n_community", for: "node", name: "communityId", type: "string" },
    { id: "n_degree", for: "node", name: "degree", type: "double" },
    { id: "n_bridge", for: "node", name: "bridgeScore", type: "double" },
    { id: "n_relation", for: "node", name: "relation", type: "string" },
    { id: "n_evidence", for: "node", name: "evidenceClass", type: "string" },
    { id: "n_confidence", for: "node", name: "confidence", type: "double" },
    { id: "n_source_pages", for: "node", name: "sourcePageIds", type: "string" },
    { id: "n_why", for: "node", name: "why", type: "string" },
    { id: "e_relation", for: "edge", name: "relation", type: "string" },
    { id: "e_status", for: "edge", name: "status", type: "string" },
    { id: "e_evidence", for: "edge", name: "evidenceClass", type: "string" },
    { id: "e_confidence", for: "edge", name: "confidence", type: "double" },
    { id: "e_provenance", for: "edge", name: "provenance", type: "string" }
  ];
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<graphml xmlns="http://graphml.graphdrawing.org/xmlns" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">'
  ];
  for (const key of keys) {
    lines.push(`  <key id="${key.id}" for="${key.for}" attr.name="${key.name}" attr.type="${key.type}" />`);
  }
  lines.push('  <graph id="swarmvault" edgedefault="directed">');
  for (const node of [...graph.nodes].sort((left, right) => left.id.localeCompare(right.id))) {
    const page = node.pageId ? pageById.get(node.pageId) : void 0;
    lines.push(`    <node id="${xmlEscape(node.id)}">`);
    const dataEntries = [
      ["n_label", node.label],
      ["n_type", node.type],
      ["n_page", node.pageId],
      ["n_page_path", page?.path],
      ["n_language", node.language],
      ["n_symbol_kind", node.symbolKind],
      ["n_project_ids", node.projectIds],
      ["n_source_ids", node.sourceIds],
      ["n_community", node.communityId],
      ["n_degree", node.degree],
      ["n_bridge", node.bridgeScore]
    ];
    for (const [key, value] of dataEntries) {
      if (value === void 0) {
        continue;
      }
      lines.push(`      <data key="${key}">${xmlEscape(graphMlData(value))}</data>`);
    }
    lines.push("    </node>");
  }
  for (const hyperedge of [...graph.hyperedges ?? []].sort((left, right) => left.id.localeCompare(right.id))) {
    lines.push(`    <node id="${xmlEscape(exportHyperedgeNodeId(hyperedge))}">`);
    for (const [key, value] of [
      ["n_label", hyperedge.label],
      ["n_type", "hyperedge"],
      ["n_relation", hyperedge.relation],
      ["n_evidence", hyperedge.evidenceClass],
      ["n_confidence", hyperedge.confidence],
      ["n_source_pages", hyperedge.sourcePageIds],
      ["n_why", hyperedge.why]
    ]) {
      lines.push(`      <data key="${key}">${xmlEscape(graphMlData(value))}</data>`);
    }
    lines.push("    </node>");
  }
  for (const edge of [...graph.edges].sort((left, right) => left.id.localeCompare(right.id))) {
    lines.push(`    <edge id="${xmlEscape(edge.id)}" source="${xmlEscape(edge.source)}" target="${xmlEscape(edge.target)}">`);
    for (const [key, value] of [
      ["e_relation", edge.relation],
      ["e_status", edge.status],
      ["e_evidence", edge.evidenceClass],
      ["e_confidence", edge.confidence],
      ["e_provenance", edge.provenance]
    ]) {
      lines.push(`      <data key="${key}">${xmlEscape(graphMlData(value))}</data>`);
    }
    lines.push("    </edge>");
  }
  for (const hyperedge of [...graph.hyperedges ?? []].sort((left, right) => left.id.localeCompare(right.id))) {
    for (const nodeId of hyperedge.nodeIds) {
      lines.push(
        `    <edge id="${xmlEscape(`member:${hyperedge.id}:${nodeId}`)}" source="${xmlEscape(exportHyperedgeNodeId(hyperedge))}" target="${xmlEscape(nodeId)}">`
      );
      for (const [key, value] of [
        ["e_relation", "group_member"],
        ["e_status", "inferred"],
        ["e_evidence", hyperedge.evidenceClass],
        ["e_confidence", hyperedge.confidence],
        ["e_provenance", hyperedge.sourcePageIds]
      ]) {
        lines.push(`      <data key="${key}">${xmlEscape(graphMlData(value))}</data>`);
      }
      lines.push("    </edge>");
    }
  }
  lines.push("  </graph>", "</graphml>", "");
  return lines.join("\n");
}
function renderCypher(graph) {
  const pageById = graphPageById(graph);
  const lines = ["// Neo4j Cypher import generated by SwarmVault", ""];
  for (const node of [...graph.nodes].sort((left, right) => left.id.localeCompare(right.id))) {
    const page = node.pageId ? pageById.get(node.pageId) : void 0;
    const props = Object.entries(normalizeSwarmNodeProps(node, page)).map(([key, value]) => `${key}: ${typeof value === "string" ? cypherStringLiteral(value) : value}`).filter(Boolean).join(", ");
    lines.push(`MERGE (n:SwarmNode {id: ${cypherStringLiteral(node.id)}}) SET n += { ${props} };`);
  }
  lines.push("");
  for (const hyperedge of [...graph.hyperedges ?? []].sort((left, right) => left.id.localeCompare(right.id))) {
    const hyperedgeNodeId = exportHyperedgeNodeId(hyperedge);
    const props = Object.entries(normalizeHyperedgeNodeProps(hyperedge)).map(([key, value]) => `${key}: ${typeof value === "string" ? cypherStringLiteral(value) : value}`).join(", ");
    lines.push(`MERGE (h:SwarmNode {id: ${cypherStringLiteral(hyperedgeNodeId)}}) SET h += { ${props} };`);
  }
  if ((graph.hyperedges ?? []).length) {
    lines.push("");
  }
  for (const hyperedge of [...graph.hyperedges ?? []].sort((left, right) => left.id.localeCompare(right.id))) {
    const hyperedgeNodeId = exportHyperedgeNodeId(hyperedge);
    for (const nodeId of hyperedge.nodeIds) {
      const props = Object.entries(normalizeGroupMemberProps(hyperedge, nodeId)).map(([key, value]) => `${key}: ${typeof value === "string" ? cypherStringLiteral(value) : value}`).join(", ");
      lines.push(
        `MATCH (h:SwarmNode {id: ${cypherStringLiteral(hyperedgeNodeId)}}), (n:SwarmNode {id: ${cypherStringLiteral(nodeId)}})`,
        `MERGE (h)-[r:GROUP_MEMBER {id: ${cypherStringLiteral(`member:${hyperedge.id}:${nodeId}`)}}]->(n)`,
        `SET r += { ${props} };`
      );
    }
  }
  lines.push("");
  for (const edge of [...graph.edges].sort((left, right) => left.id.localeCompare(right.id))) {
    const props = Object.entries(normalizeEdgeProps(edge)).map(([key, value]) => `${key}: ${typeof value === "string" ? cypherStringLiteral(value) : value}`).join(", ");
    lines.push(
      `MATCH (a:SwarmNode {id: ${cypherStringLiteral(edge.source)}}), (b:SwarmNode {id: ${cypherStringLiteral(edge.target)}})`,
      `MERGE (a)-[r:${relationType(edge.relation)} {id: ${cypherStringLiteral(edge.id)}}]->(b)`,
      `SET r += { ${props} };`
    );
  }
  lines.push("");
  return lines.join("\n");
}
function renderJson(graph) {
  const communities = sortedCommunities(graph);
  const payload = {
    nodes: [...graph.nodes].sort((left, right) => left.id.localeCompare(right.id)).map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      communityId: node.communityId ?? null,
      degree: node.degree ?? null,
      bridgeScore: node.bridgeScore ?? null,
      confidence: node.confidence ?? null,
      sourceClass: node.sourceClass ?? null,
      tags: node.tags ?? []
    })),
    edges: [...graph.edges].sort((left, right) => left.id.localeCompare(right.id)).map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relation: edge.relation,
      evidenceClass: edge.evidenceClass,
      confidence: edge.confidence,
      similarityReasons: edge.similarityReasons ?? []
    })),
    communities: communities.map((community) => ({
      id: community.id,
      label: community.label,
      nodeIds: community.nodeIds
    })),
    hyperedges: graph.hyperedges ?? [],
    metadata: {
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      communityCount: (graph.communities ?? []).length
    }
  };
  return JSON.stringify(payload, null, 2);
}
function renderHtmlStandalone(graph) {
  const communities = sortedCommunities(graph);
  const cappedNodes = [...graph.nodes].sort((a, b) => (b.degree ?? 0) - (a.degree ?? 0)).slice(0, 5e3);
  const cappedNodeIds = new Set(cappedNodes.map((n) => n.id));
  const cappedEdges = graph.edges.filter((e) => cappedNodeIds.has(e.source) && cappedNodeIds.has(e.target));
  const communityColors = [
    "#f59e0b",
    "#fb7185",
    "#8b5cf6",
    "#14b8a6",
    "#0ea5e9",
    "#22c55e",
    "#f97316",
    "#a78bfa",
    "#2dd4bf",
    "#38bdf8",
    "#facc15",
    "#e879f9",
    "#34d399",
    "#60a5fa",
    "#fb923c"
  ];
  const nodesData = cappedNodes.map((node) => ({
    id: node.id,
    label: node.label,
    type: node.type,
    communityId: node.communityId ?? null,
    degree: node.degree ?? 0,
    bridgeScore: node.bridgeScore ?? null,
    confidence: node.confidence ?? null,
    sourceClass: node.sourceClass ?? null,
    tags: node.tags ?? [],
    pageId: node.pageId ?? null
  }));
  const edgesData = cappedEdges.map((edge) => ({
    id: edge.id,
    from: edge.source,
    to: edge.target,
    relation: edge.relation,
    evidenceClass: edge.evidenceClass,
    confidence: edge.confidence
  }));
  const communitiesData = communities.map((c) => ({
    id: c.id,
    label: c.label,
    nodeIds: c.nodeIds
  }));
  const corePagesData = graph.pages.filter((page) => page.nodeIds.some((nodeId) => cappedNodeIds.has(nodeId))).map((page) => ({ id: page.id, path: page.path, title: page.title }));
  const coreHyperedgesData = (graph.hyperedges ?? []).filter((hyperedge) => hyperedge.nodeIds.some((nodeId) => cappedNodeIds.has(nodeId))).map((hyperedge) => ({
    id: hyperedge.id,
    label: hyperedge.label,
    relation: hyperedge.relation,
    nodeIds: hyperedge.nodeIds,
    confidence: hyperedge.confidence,
    evidenceClass: hyperedge.evidenceClass,
    why: hyperedge.why
  }));
  const coreNodesData = cappedNodes.map((node) => ({
    id: node.id,
    label: node.label,
    type: node.type,
    pageId: node.pageId ?? null,
    communityId: node.communityId ?? null,
    degree: node.degree ?? 0,
    confidence: node.confidence ?? null
  }));
  const coreEdgesData = cappedEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    relation: edge.relation,
    evidenceClass: edge.evidenceClass,
    confidence: edge.confidence
  }));
  const { hubNodes, hubEdges } = synthesizeHyperedgeHubs(graph.hyperedges ?? [], cappedNodes);
  const hubNodesData = hubNodes.map((hub) => ({
    id: hub.id,
    label: hub.label,
    type: "hyperedge",
    isHub: true,
    hyperedgeId: hub.hyperedgeId,
    relation: hub.relation,
    confidence: hub.confidence,
    evidenceClass: hub.evidenceClass
  }));
  const hubEdgesData = hubEdges.map((edge) => ({
    id: edge.id,
    from: edge.source,
    to: edge.target,
    relation: edge.relation,
    evidenceClass: edge.evidenceClass,
    confidence: edge.confidence,
    isHubEdge: true,
    hyperedgeId: edge.hyperedgeId
  }));
  const graphJson = JSON.stringify({
    nodes: [...nodesData, ...hubNodesData],
    edges: [...edgesData, ...hubEdgesData],
    communities: communitiesData,
    // Core payload for the inline query/path/explain runtime. Kept separate
    // from the vis.js payload so hub scaffolding never leaks into traversal.
    core: {
      nodes: coreNodesData,
      edges: coreEdgesData,
      pages: corePagesData,
      hyperedges: coreHyperedgesData,
      communities: communitiesData
    }
  });
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>SwarmVault Graph</title>
  <script>${loadVisNetworkJs()}</script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; display: flex; height: 100vh; background: #0f172a; color: #e2e8f0; }
    #graph { flex: 1; }
    #sidebar { width: 320px; background: #1e293b; padding: 16px; overflow-y: auto; border-left: 1px solid #334155; display: none; }
    #sidebar.open { display: block; }
    #sidebar h2 { font-size: 16px; margin-bottom: 8px; color: #f8fafc; }
    #sidebar .field { margin-bottom: 6px; font-size: 13px; }
    #sidebar .label { color: #94a3b8; }
    #sidebar .value { color: #e2e8f0; }
    #sidebar .neighbors { margin-top: 12px; }
    #sidebar .neighbor { cursor: pointer; color: #38bdf8; text-decoration: underline; margin: 2px 0; font-size: 13px; }
    #search { position: absolute; top: 12px; left: 12px; z-index: 10; }
    #search input { padding: 8px 12px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; width: 240px; font-size: 14px; }
    #legend { position: absolute; bottom: 12px; left: 12px; z-index: 10; background: #1e293b; padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; }
    #legend .item { display: flex; align-items: center; gap: 6px; font-size: 12px; margin: 3px 0; }
    #legend .dot { width: 10px; height: 10px; border-radius: 50%; }
    #stats { position: absolute; top: 12px; right: 340px; z-index: 10; background: #1e293b; padding: 8px 12px; border-radius: 6px; font-size: 12px; color: #94a3b8; border: 1px solid #334155; }
    #tools { position: absolute; top: 52px; left: 12px; z-index: 10; width: 300px; background: #1e293b; padding: 12px; border-radius: 8px; border: 1px solid #334155; max-height: calc(100vh - 80px); overflow-y: auto; }
    #tools h3 { font-size: 13px; color: #f8fafc; margin-bottom: 6px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
    #tools .panel { border-top: 1px solid #334155; padding-top: 10px; margin-top: 10px; }
    #tools .panel:first-of-type { border-top: none; margin-top: 0; padding-top: 0; }
    #tools .row { display: flex; gap: 6px; margin-bottom: 6px; }
    #tools .row.radio { gap: 12px; font-size: 12px; color: #cbd5e1; }
    #tools input[type=text] { flex: 1; padding: 6px 8px; border-radius: 4px; border: 1px solid #475569; background: #0f172a; color: #e2e8f0; font-size: 12px; }
    #tools button { padding: 6px 10px; border-radius: 4px; border: 1px solid #475569; background: #334155; color: #e2e8f0; font-size: 12px; cursor: pointer; }
    #tools button:hover { background: #475569; }
    #tools .result { font-size: 12px; color: #cbd5e1; margin-top: 6px; line-height: 1.4; white-space: pre-wrap; }
    #tools .result .hdr { color: #f8fafc; font-weight: 600; margin-top: 6px; }
    #tools .result ol, #tools .result ul { padding-left: 18px; margin: 4px 0; }
    #tools .result .item { color: #38bdf8; cursor: pointer; text-decoration: underline; }
    #tools .result .relation { color: #94a3b8; font-size: 11px; }
    #tools .result .error { color: #f87171; }
  </style>
</head>
<body>
  <div id="search"><input type="text" placeholder="Search nodes..." id="searchInput"></div>
  <div id="stats"></div>
  <div id="graph"></div>
  <div id="sidebar">
    <h2 id="sidebarTitle"></h2>
    <div id="sidebarFields"></div>
    <div class="neighbors" id="sidebarNeighbors"></div>
  </div>
  <div id="tools" data-testid="graph-tools">
    <section class="panel" data-testid="graph-query-panel">
      <h3>Query</h3>
      <div class="row">
        <input type="text" id="queryInput" data-testid="graph-query-input" placeholder="Ask a question about the graph..." />
        <button type="button" id="queryRun" data-testid="graph-query-run">Run</button>
      </div>
      <div class="row radio">
        <label><input type="radio" name="queryTraversal" value="bfs" checked /> BFS</label>
        <label><input type="radio" name="queryTraversal" value="dfs" /> DFS</label>
      </div>
      <div class="result" id="queryResult" data-testid="graph-query-result"></div>
    </section>
    <section class="panel" data-testid="graph-path-panel">
      <h3>Path</h3>
      <div class="row">
        <input type="text" id="pathFrom" data-testid="graph-path-from" placeholder="From node id or label..." />
      </div>
      <div class="row">
        <input type="text" id="pathTo" data-testid="graph-path-to" placeholder="To node id or label..." />
      </div>
      <div class="row">
        <button type="button" id="pathFind" data-testid="graph-path-find">Find</button>
      </div>
      <div class="result" id="pathResult" data-testid="graph-path-result"></div>
    </section>
    <section class="panel" data-testid="graph-explain-panel">
      <h3>Explain</h3>
      <div class="row">
        <input type="text" id="explainInput" data-testid="graph-explain-input" placeholder="Node id or label..." />
        <button type="button" id="explainRun" data-testid="graph-explain-run">Explain</button>
      </div>
      <div class="result" id="explainResult" data-testid="graph-explain-result"></div>
    </section>
  </div>
  <div id="legend"></div>
  <script>
    var GRAPH_DATA = ${graphJson};

    var TYPE_COLORS = {
      source: "#f59e0b",
      module: "#fb7185",
      symbol: "#8b5cf6",
      rationale: "#14b8a6",
      concept: "#0ea5e9",
      entity: "#22c55e"
    };

    var COMMUNITY_COLORS = {};
    var palette = ${JSON.stringify(communityColors)};
    GRAPH_DATA.communities.forEach(function(c, i) {
      COMMUNITY_COLORS[c.id] = palette[i % palette.length];
    });

    var adjacency = {};
    GRAPH_DATA.nodes.forEach(function(n) { adjacency[n.id] = []; });
    GRAPH_DATA.edges.forEach(function(e) {
      if (adjacency[e.from]) adjacency[e.from].push({ id: e.to, relation: e.relation });
      if (adjacency[e.to]) adjacency[e.to].push({ id: e.from, relation: e.relation });
    });

    var nodeMap = {};
    GRAPH_DATA.nodes.forEach(function(n) { nodeMap[n.id] = n; });

    var visNodes = new vis.DataSet(GRAPH_DATA.nodes.map(function(n) {
      if (n.isHub) {
        // Hub nodes are viewer-only scaffolding \u2014 keep them small, dashed,
        // and painted with a secondary accent so they read as grouping
        // glue rather than first-class entities.
        return {
          id: n.id,
          label: n.label,
          shape: "dot",
          color: { background: "#0f172a", border: "#a78bfa" },
          size: 10,
          font: { color: "#c4b5fd", size: 10 },
          borderWidth: 2,
          borderWidthSelected: 3,
          shapeProperties: { borderDashes: [4, 3] }
        };
      }
      var size = 8 + Math.min(32, n.degree * 2);
      return {
        id: n.id,
        label: n.label,
        color: { background: TYPE_COLORS[n.type] || "#94a3b8", border: "#0f172a" },
        size: size,
        font: { color: "#e2e8f0", size: 11 },
        borderWidth: 2
      };
    }));

    var visEdges = new vis.DataSet(GRAPH_DATA.edges.map(function(e) {
      if (e.isHubEdge) {
        return {
          id: e.id,
          from: e.from,
          to: e.to,
          color: { color: "#a78bfa", opacity: 0.5 },
          width: 1,
          dashes: [4, 3],
          arrows: { to: { enabled: false } }
        };
      }
      var dashed = (e.evidenceClass === "inferred" || e.evidenceClass === "ambiguous");
      return {
        id: e.id,
        from: e.from,
        to: e.to,
        color: { color: "#64748b", opacity: 0.55 },
        width: Math.max(1.5, Math.min(4, e.confidence * 3)),
        dashes: dashed,
        arrows: { to: { enabled: true, scaleFactor: 0.5 } }
      };
    }));

    var container = document.getElementById("graph");
    var network = new vis.Network(container, { nodes: visNodes, edges: visEdges }, {
      physics: {
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -30,
          centralGravity: 0.005,
          springLength: 100,
          springConstant: 0.04
        },
        stabilization: { iterations: 150 }
      },
      interaction: { hover: true, tooltipDelay: 200 },
      nodes: { shape: "dot" },
      edges: { smooth: { type: "continuous" } }
    });

    document.getElementById("stats").textContent =
      "Nodes: " + GRAPH_DATA.nodes.length +
      " | Edges: " + GRAPH_DATA.edges.length +
      " | Communities: " + GRAPH_DATA.communities.length;

    (function buildLegend() {
      var el = document.getElementById("legend");
      GRAPH_DATA.communities.forEach(function(c) {
        var color = COMMUNITY_COLORS[c.id] || "#94a3b8";
        var item = document.createElement("div");
        item.className = "item";
        var dot = document.createElement("span");
        dot.className = "dot";
        dot.style.background = color;
        item.appendChild(dot);
        item.appendChild(document.createTextNode(c.label + " (" + c.nodeIds.length + ")"));
        el.appendChild(item);
      });
    })();

    var sidebar = document.getElementById("sidebar");
    var sidebarTitle = document.getElementById("sidebarTitle");
    var sidebarFields = document.getElementById("sidebarFields");
    var sidebarNeighbors = document.getElementById("sidebarNeighbors");

    function renderField(parent, label, value) {
      var wrap = document.createElement("div");
      wrap.className = "field";
      var lbl = document.createElement("span");
      lbl.className = "label";
      lbl.textContent = label + ":";
      var val = document.createElement("span");
      val.className = "value";
      val.textContent = " " + value;
      wrap.appendChild(lbl);
      wrap.appendChild(val);
      parent.appendChild(wrap);
    }

    network.on("click", function(params) {
      if (params.nodes.length === 0) {
        sidebar.classList.remove("open");
        return;
      }
      var nodeId = params.nodes[0];
      var node = nodeMap[nodeId];
      if (!node) return;

      sidebarTitle.textContent = node.label;
      sidebarFields.textContent = "";
      renderField(sidebarFields, "Type", node.type);
      renderField(sidebarFields, "Community", node.communityId || "none");
      renderField(sidebarFields, "Confidence", node.confidence != null ? node.confidence.toFixed(2) : "n/a");
      renderField(sidebarFields, "Degree", String(node.degree));
      renderField(sidebarFields, "Bridge Score", node.bridgeScore != null ? node.bridgeScore.toFixed(3) : "n/a");
      renderField(sidebarFields, "Tags", (node.tags && node.tags.length) ? node.tags.join(", ") : "none");

      sidebarNeighbors.textContent = "";
      var neighbors = adjacency[nodeId] || [];
      if (neighbors.length > 0) {
        renderField(sidebarNeighbors, "Neighbors", String(neighbors.length));
        neighbors.forEach(function(nb) {
          var nbNode = nodeMap[nb.id];
          var nbLabel = nbNode ? nbNode.label : nb.id;
          var link = document.createElement("div");
          link.className = "neighbor";
          link.dataset.nodeId = nb.id;
          link.textContent = nbLabel + " (" + nb.relation + ")";
          sidebarNeighbors.appendChild(link);
        });
      } else {
        renderField(sidebarNeighbors, "Neighbors", "none");
      }

      sidebar.classList.add("open");
    });

    sidebarNeighbors.addEventListener("click", function(e) {
      var target = e.target;
      while (target && target !== sidebarNeighbors) {
        if (target.dataset && target.dataset.nodeId) {
          var nid = target.dataset.nodeId;
          network.selectNodes([nid]);
          network.focus(nid, { scale: 1.2, animation: { duration: 400 } });
          network.body.emitter.emit("click", { nodes: [nid] });
          return;
        }
        target = target.parentElement;
      }
    });

    document.getElementById("searchInput").addEventListener("input", function() {
      var query = this.value.toLowerCase().trim();
      if (!query) {
        visNodes.forEach(function(n) {
          visNodes.update({ id: n.id, opacity: 1.0, font: { color: "#e2e8f0", size: 11 } });
        });
        return;
      }
      visNodes.forEach(function(n) {
        var match = n.label.toLowerCase().indexOf(query) !== -1;
        visNodes.update({
          id: n.id,
          opacity: match ? 1.0 : 0.15,
          font: { color: match ? "#f8fafc" : "#475569", size: match ? 13 : 9 }
        });
      });
    });

    // ---------------------------------------------------------------------
    // Embedded graph query/path/explain runtime.
    //
    // Dependency-free port of the graph-query-core helpers that the live
    // graph serve / MCP surface uses. Operates only on the GRAPH_DATA.core
    // payload (real nodes/edges/pages/hyperedges/communities) so viewer-only
    // hub scaffolding never leaks into traversal. No network calls; no
    // provider-backed features.
    // ---------------------------------------------------------------------
    var CORE = GRAPH_DATA.core;
    var CORE_NODE_TYPE_PRIORITY = { concept: 6, entity: 5, source: 4, module: 3, symbol: 2, rationale: 1 };

    function coreNormalize(value) {
      if (value == null) return "";
      return String(value).replace(/\\s+/g, " ").trim().normalize("NFKD").replace(/[\\u0300-\\u036f]+/g, "").toLowerCase();
    }

    function coreScore(query, candidate) {
      var q = coreNormalize(query);
      var c = coreNormalize(candidate);
      if (!q || !c) return 0;
      if (c === q) return 100;
      if (c.indexOf(q) === 0) return 80;
      if (c.indexOf(q) !== -1) return 60;
      var qTokens = q.split(/\\s+/).filter(Boolean);
      var cTokens = {};
      c.split(/\\s+/).filter(Boolean).forEach(function(tok) { cTokens[tok] = true; });
      var overlap = 0;
      qTokens.forEach(function(tok) { if (cTokens[tok]) overlap++; });
      return overlap ? overlap * 10 : 0;
    }

    function coreUnique(values) {
      var seen = {};
      var out = [];
      for (var i = 0; i < values.length; i++) {
        var v = values[i];
        if (!v) continue;
        if (seen[v]) continue;
        seen[v] = true;
        out.push(v);
      }
      return out;
    }

    function coreBuildAdjacency() {
      var adj = {};
      function push(id, item) {
        if (!adj[id]) adj[id] = [];
        adj[id].push(item);
      }
      for (var i = 0; i < CORE.edges.length; i++) {
        var edge = CORE.edges[i];
        push(edge.source, { edge: edge, nodeId: edge.target, direction: "outgoing" });
        push(edge.target, { edge: edge, nodeId: edge.source, direction: "incoming" });
      }
      Object.keys(adj).forEach(function(nid) {
        adj[nid].sort(function(a, b) {
          return (b.edge.confidence - a.edge.confidence) || a.edge.relation.localeCompare(b.edge.relation);
        });
      });
      return adj;
    }

    var CORE_ADJ = coreBuildAdjacency();
    var CORE_NODE_BY_ID = {};
    CORE.nodes.forEach(function(n) { CORE_NODE_BY_ID[n.id] = n; });
    var CORE_PAGE_BY_ID = {};
    (CORE.pages || []).forEach(function(p) { CORE_PAGE_BY_ID[p.id] = p; });
    var CORE_COMM_BY_ID = {};
    (CORE.communities || []).forEach(function(c) { CORE_COMM_BY_ID[c.id] = c; });

    function coreCompareLabel(a, b) {
      var pa = CORE_NODE_TYPE_PRIORITY[a.type] || 0;
      var pb = CORE_NODE_TYPE_PRIORITY[b.type] || 0;
      if (pb !== pa) return pb - pa;
      var da = a.degree || 0;
      var db = b.degree || 0;
      if (db !== da) return db - da;
      return a.id.localeCompare(b.id);
    }

    function coreResolveNode(target) {
      if (CORE_NODE_BY_ID[target]) return CORE_NODE_BY_ID[target];
      var normalized = coreNormalize(target);
      var labelMatches = CORE.nodes.filter(function(n) {
        return coreNormalize(n.label) === normalized || coreNormalize(n.id) === normalized;
      });
      if (labelMatches.length) {
        return labelMatches.slice().sort(coreCompareLabel)[0];
      }
      var pageHit = (CORE.pages || [])
        .map(function(p) {
          return { page: p, score: Math.max(coreScore(target, p.title), coreScore(target, p.path)) };
        })
        .filter(function(item) { return item.score > 0; })
        .sort(function(left, right) {
          return (right.score - left.score) || left.page.title.localeCompare(right.page.title);
        })[0];
      if (pageHit) {
        var primary = CORE.nodes.filter(function(n) { return n.pageId === pageHit.page.id; })[0];
        if (primary) return primary;
      }
      var fuzzy = CORE.nodes
        .map(function(n) { return { node: n, score: Math.max(coreScore(target, n.label), coreScore(target, n.id)) }; })
        .filter(function(item) { return item.score > 0; })
        .sort(function(left, right) {
          return (right.score - left.score) || coreCompareLabel(left.node, right.node);
        })[0];
      return fuzzy ? fuzzy.node : undefined;
    }

    function coreUniqueMatches(matches) {
      var seen = {};
      var out = [];
      for (var i = 0; i < matches.length; i++) {
        var m = matches[i];
        var key = m.type + ":" + m.id;
        if (seen[key]) continue;
        seen[key] = true;
        out.push(m);
      }
      return out;
    }

    function runGraphQuery(question, traversalOpt, budgetOpt) {
      var traversal = traversalOpt === "dfs" ? "dfs" : "bfs";
      var budget = Math.max(3, Math.min((budgetOpt != null ? budgetOpt : 12), 50));
      var pageMatches = (CORE.pages || [])
        .map(function(p) { return { type: "page", id: p.id, label: p.title, score: Math.max(coreScore(question, p.title), coreScore(question, p.path)) }; })
        .filter(function(m) { return m.score > 0; });
      var nodeMatches = CORE.nodes
        .map(function(n) { return { type: "node", id: n.id, label: n.label, score: Math.max(coreScore(question, n.label), coreScore(question, n.id)) }; })
        .filter(function(m) { return m.score > 0; });
      var hyperMatches = (CORE.hyperedges || [])
        .map(function(h) { return { type: "hyperedge", id: h.id, label: h.label, score: Math.max(coreScore(question, h.label), coreScore(question, h.why || ""), coreScore(question, h.relation)) }; })
        .filter(function(m) { return m.score > 0; });
      var matches = coreUniqueMatches(pageMatches.concat(nodeMatches).concat(hyperMatches))
        .sort(function(a, b) { return (b.score - a.score) || a.label.localeCompare(b.label); })
        .slice(0, 12);

      var nodesByPageId = {};
      CORE.nodes.forEach(function(n) {
        if (!n.pageId) return;
        if (!nodesByPageId[n.pageId]) nodesByPageId[n.pageId] = [];
        nodesByPageId[n.pageId].push(n.id);
      });

      var seedList = [];
      matches.forEach(function(m) {
        if (m.type === "page") {
          (nodesByPageId[m.id] || []).forEach(function(id) { seedList.push(id); });
        } else if (m.type === "node") {
          seedList.push(m.id);
        } else if (m.type === "hyperedge") {
          var hy = (CORE.hyperedges || []).filter(function(h) { return h.id === m.id; })[0];
          if (hy) hy.nodeIds.forEach(function(id) { seedList.push(id); });
        }
      });
      var seeds = coreUnique(seedList);

      var visitedNodeIds = [];
      var visitedEdgeIds = {};
      var seen = {};
      var frontier = seeds.slice();
      while (frontier.length && visitedNodeIds.length < budget) {
        var current = traversal === "dfs" ? frontier.pop() : frontier.shift();
        if (!current || seen[current]) continue;
        seen[current] = true;
        visitedNodeIds.push(current);
        var adj = CORE_ADJ[current] || [];
        for (var i = 0; i < adj.length; i++) {
          var nb = adj[i];
          visitedEdgeIds[nb.edge.id] = true;
          if (!seen[nb.nodeId]) frontier.push(nb.nodeId);
          if (visitedNodeIds.length + frontier.length >= budget * 2) break;
        }
      }

      var pageIdsList = [];
      matches.forEach(function(m) { if (m.type === "page") pageIdsList.push(m.id); });
      visitedNodeIds.forEach(function(nid) {
        var n = CORE_NODE_BY_ID[nid];
        if (n && n.pageId) pageIdsList.push(n.pageId);
      });
      var pageIds = coreUnique(pageIdsList);
      var communities = coreUnique(
        visitedNodeIds.map(function(nid) { return CORE_NODE_BY_ID[nid] && CORE_NODE_BY_ID[nid].communityId; }).filter(Boolean)
      );
      var hyperedgeIds = coreUnique(
        (CORE.hyperedges || [])
          .filter(function(h) { return h.nodeIds.some(function(nid) { return visitedNodeIds.indexOf(nid) !== -1; }); })
          .map(function(h) { return h.id; })
      );
      var seedPageIds = coreUnique(matches.filter(function(m) { return m.type === "page"; }).map(function(m) { return m.id; }));
      var visitedEdgeIdList = Object.keys(visitedEdgeIds);

      var summary = [
        "Seeds: " + (seeds.join(", ") || "none"),
        "Visited nodes: " + visitedNodeIds.length,
        "Visited edges: " + visitedEdgeIdList.length,
        "Touched group patterns: " + hyperedgeIds.length,
        "Communities: " + (communities.join(", ") || "none"),
        "Pages: " + (pageIds.join(", ") || "none")
      ].join("\\n");

      return {
        question: question,
        traversal: traversal,
        seedNodeIds: seeds,
        seedPageIds: seedPageIds,
        visitedNodeIds: visitedNodeIds,
        visitedEdgeIds: visitedEdgeIdList,
        hyperedgeIds: hyperedgeIds,
        pageIds: pageIds,
        communities: communities,
        matches: matches,
        summary: summary
      };
    }

    function runGraphPath(from, to) {
      var start = coreResolveNode(from);
      var end = coreResolveNode(to);
      if (!start || !end) {
        return {
          from: from,
          to: to,
          resolvedFromNodeId: start ? start.id : undefined,
          resolvedToNodeId: end ? end.id : undefined,
          found: false,
          nodeIds: [],
          edgeIds: [],
          pageIds: [],
          summary: "Could not resolve one or both graph targets."
        };
      }
      var queue = [start.id];
      var visited = {}; visited[start.id] = true;
      var previous = {};
      while (queue.length) {
        var current = queue.shift();
        if (current === end.id) break;
        var adj = CORE_ADJ[current] || [];
        for (var i = 0; i < adj.length; i++) {
          var nb = adj[i];
          if (visited[nb.nodeId]) continue;
          visited[nb.nodeId] = true;
          previous[nb.nodeId] = { nodeId: current, edgeId: nb.edge.id };
          queue.push(nb.nodeId);
        }
      }
      if (!visited[end.id]) {
        return {
          from: from,
          to: to,
          resolvedFromNodeId: start.id,
          resolvedToNodeId: end.id,
          found: false,
          nodeIds: [],
          edgeIds: [],
          pageIds: [],
          summary: "No path found between " + start.label + " and " + end.label + "."
        };
      }
      var nodeIds = [];
      var edgeIds = [];
      var cursor = end.id;
      while (cursor !== start.id) {
        nodeIds.push(cursor);
        var prev = previous[cursor];
        if (!prev) break;
        edgeIds.push(prev.edgeId);
        cursor = prev.nodeId;
      }
      nodeIds.push(start.id);
      nodeIds.reverse();
      edgeIds.reverse();
      var pageIds = coreUnique(nodeIds.map(function(nid) { return CORE_NODE_BY_ID[nid] && CORE_NODE_BY_ID[nid].pageId; }).filter(Boolean));
      var summary = nodeIds.map(function(nid) { return (CORE_NODE_BY_ID[nid] && CORE_NODE_BY_ID[nid].label) || nid; }).join(" -> ");
      return {
        from: from,
        to: to,
        resolvedFromNodeId: start.id,
        resolvedToNodeId: end.id,
        found: true,
        nodeIds: nodeIds,
        edgeIds: edgeIds,
        pageIds: pageIds,
        summary: summary
      };
    }

    function runGraphExplain(target) {
      var node = coreResolveNode(target);
      if (!node) return undefined;
      var neighbors = [];
      var adj = CORE_ADJ[node.id] || [];
      for (var i = 0; i < adj.length; i++) {
        var nb = adj[i];
        var t = CORE_NODE_BY_ID[nb.nodeId];
        if (!t) continue;
        neighbors.push({
          nodeId: t.id,
          label: t.label,
          type: t.type,
          pageId: t.pageId || undefined,
          relation: nb.edge.relation,
          direction: nb.direction,
          confidence: nb.edge.confidence,
          evidenceClass: nb.edge.evidenceClass
        });
      }
      neighbors.sort(function(a, b) { return (b.confidence - a.confidence) || a.label.localeCompare(b.label); });
      var page = node.pageId ? CORE_PAGE_BY_ID[node.pageId] : undefined;
      var community = node.communityId ? CORE_COMM_BY_ID[node.communityId] : undefined;
      var hyperedges = (CORE.hyperedges || [])
        .filter(function(h) { return h.nodeIds.indexOf(node.id) !== -1; })
        .slice()
        .sort(function(a, b) { return (b.confidence - a.confidence) || a.label.localeCompare(b.label); });
      var summary = [
        "Node: " + node.label,
        "Type: " + node.type,
        "Community: " + (node.communityId || "none"),
        "Neighbors: " + neighbors.length,
        "Group patterns: " + hyperedges.length,
        "Page: " + (page ? page.path : "none")
      ].join("\\n");
      return {
        target: target,
        node: node,
        page: page,
        community: community ? { id: community.id, label: community.label } : undefined,
        neighbors: neighbors,
        hyperedges: hyperedges,
        summary: summary
      };
    }

    // Expose helpers for test harnesses and browser console introspection.
    window.runGraphQuery = runGraphQuery;
    window.runGraphPath = runGraphPath;
    window.runGraphExplain = runGraphExplain;

    function focusNode(nodeId) {
      try {
        network.selectNodes([nodeId]);
        network.focus(nodeId, { scale: 1.2, animation: { duration: 300 } });
        network.body.emitter.emit("click", { nodes: [nodeId] });
      } catch (err) {
        // ignore \u2014 focus is best effort in static exports
      }
    }

    function renderList(parent, items, onClick) {
      items.forEach(function(entry) {
        var line = document.createElement("div");
        line.className = "item";
        line.textContent = entry.text;
        line.addEventListener("click", function() { if (onClick) onClick(entry.id); });
        parent.appendChild(line);
      });
    }

    function renderQueryPanel(result) {
      var host = document.getElementById("queryResult");
      host.textContent = "";
      if (!result) return;
      var summaryEl = document.createElement("div");
      summaryEl.textContent = result.summary;
      host.appendChild(summaryEl);
      if (result.visitedNodeIds.length) {
        var hdr = document.createElement("div");
        hdr.className = "hdr";
        hdr.textContent = "Visited (" + result.traversal.toUpperCase() + ")";
        host.appendChild(hdr);
        renderList(host, result.visitedNodeIds.map(function(nid, idx) {
          var n = CORE_NODE_BY_ID[nid];
          return { id: nid, text: (idx + 1) + ". " + ((n && n.label) || nid) };
        }), focusNode);
      }
    }

    function renderPathPanel(result) {
      var host = document.getElementById("pathResult");
      host.textContent = "";
      if (!result) return;
      var summaryEl = document.createElement("div");
      summaryEl.textContent = result.summary;
      host.appendChild(summaryEl);
      if (result.found && result.nodeIds.length) {
        var edgeById = {};
        CORE.edges.forEach(function(e) { edgeById[e.id] = e; });
        var ol = document.createElement("ol");
        for (var i = 0; i < result.nodeIds.length; i++) {
          var nid = result.nodeIds[i];
          var n = CORE_NODE_BY_ID[nid];
          var li = document.createElement("li");
          var btn = document.createElement("span");
          btn.className = "item";
          btn.textContent = (n && n.label) || nid;
          (function(targetId) { btn.addEventListener("click", function() { focusNode(targetId); }); })(nid);
          li.appendChild(btn);
          if (i < result.edgeIds.length) {
            var edge = edgeById[result.edgeIds[i]];
            if (edge) {
              var rel = document.createElement("span");
              rel.className = "relation";
              rel.textContent = "  -[" + edge.relation + "]-> ";
              li.appendChild(rel);
            }
          }
          ol.appendChild(li);
        }
        host.appendChild(ol);
      }
    }

    function renderExplainPanel(result, target) {
      var host = document.getElementById("explainResult");
      host.textContent = "";
      if (!result) {
        var err = document.createElement("div");
        err.className = "error";
        err.textContent = "Could not resolve graph target: " + target;
        host.appendChild(err);
        return;
      }
      var summaryEl = document.createElement("div");
      summaryEl.textContent = result.summary;
      host.appendChild(summaryEl);
      if (result.neighbors.length) {
        var byRel = {};
        result.neighbors.forEach(function(nb) {
          if (!byRel[nb.relation]) byRel[nb.relation] = [];
          byRel[nb.relation].push(nb);
        });
        Object.keys(byRel).sort().forEach(function(rel) {
          var hdr = document.createElement("div");
          hdr.className = "hdr";
          hdr.textContent = rel + " (" + byRel[rel].length + ")";
          host.appendChild(hdr);
          renderList(host, byRel[rel].map(function(nb) {
            var arrow = nb.direction === "incoming" ? "<- " : "-> ";
            return { id: nb.nodeId, text: arrow + nb.label + "  [" + nb.evidenceClass + ", " + nb.confidence.toFixed(2) + "]" };
          }), focusNode);
        });
      }
      if (result.community) {
        var ch = document.createElement("div");
        ch.className = "hdr";
        ch.textContent = "Community";
        host.appendChild(ch);
        var cb = document.createElement("div");
        cb.textContent = result.community.label;
        host.appendChild(cb);
      }
      if (result.hyperedges && result.hyperedges.length) {
        var hh = document.createElement("div");
        hh.className = "hdr";
        hh.textContent = "Group Patterns (" + result.hyperedges.length + ")";
        host.appendChild(hh);
        result.hyperedges.forEach(function(h) {
          var line = document.createElement("div");
          line.textContent = h.label + " [" + h.relation + ", " + h.confidence.toFixed(2) + "]";
          host.appendChild(line);
        });
      }
    }

    function runPanelQuery() {
      var question = document.getElementById("queryInput").value.trim();
      if (!question) {
        renderQueryPanel(null);
        return;
      }
      var radios = document.getElementsByName("queryTraversal");
      var traversal = "bfs";
      for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) { traversal = radios[i].value; break; }
      }
      renderQueryPanel(runGraphQuery(question, traversal));
    }

    function runPanelPath() {
      var from = document.getElementById("pathFrom").value.trim();
      var to = document.getElementById("pathTo").value.trim();
      if (!from || !to) {
        renderPathPanel(null);
        return;
      }
      renderPathPanel(runGraphPath(from, to));
    }

    function runPanelExplain() {
      var target = document.getElementById("explainInput").value.trim();
      if (!target) {
        renderExplainPanel(null, "");
        return;
      }
      renderExplainPanel(runGraphExplain(target), target);
    }

    document.getElementById("queryRun").addEventListener("click", runPanelQuery);
    document.getElementById("queryInput").addEventListener("keydown", function(e) { if (e.key === "Enter") runPanelQuery(); });
    document.getElementById("pathFind").addEventListener("click", runPanelPath);
    document.getElementById("pathFrom").addEventListener("keydown", function(e) { if (e.key === "Enter") runPanelPath(); });
    document.getElementById("pathTo").addEventListener("keydown", function(e) { if (e.key === "Enter") runPanelPath(); });
    document.getElementById("explainRun").addEventListener("click", runPanelExplain);
    document.getElementById("explainInput").addEventListener("keydown", function(e) { if (e.key === "Enter") runPanelExplain(); });
  </script>
</body>
</html>`;
}
async function loadGraph(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  const graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    throw new Error("Graph artifact not found. Run `swarmvault compile` first.");
  }
  return graph;
}
async function writeGraphExport(outputPath, content) {
  await ensureDir(path4.dirname(outputPath));
  await fs4.writeFile(outputPath, content, "utf8");
  return path4.resolve(outputPath);
}
async function exportGraphFormat(rootDir, format, outputPath) {
  const graph = await loadGraph(rootDir);
  const rendered = format === "html-standalone" ? renderHtmlStandalone(graph) : format === "json" ? renderJson(graph) : format === "svg" ? renderSvg(graph) : format === "graphml" ? renderGraphMl(graph) : renderCypher(graph);
  const resolvedPath = await writeGraphExport(outputPath, rendered);
  return { format, outputPath: resolvedPath };
}
async function exportGraphReportHtml(rootDir, outputPath) {
  const { paths } = await loadVaultConfig(rootDir);
  const graph = await loadGraph(rootDir);
  const report = await readJsonFile(path4.join(paths.wikiDir, "graph", "report.json"));
  const html = renderGraphReportHtml(graph, report);
  const resolvedPath = await writeGraphExport(outputPath, html);
  return { format: "report", outputPath: resolvedPath };
}
function safeFileName(label) {
  return label.replace(/[\\/*?:"<>|#^[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 200) || "unnamed";
}
function deduplicateFileName(baseName, used) {
  let name = baseName;
  let counter = 2;
  while (used.has(name)) {
    name = `${baseName}_${counter}`;
    counter++;
  }
  used.add(name);
  return name;
}
function typePluralDir(nodeType) {
  const map = {
    source: "sources",
    module: "modules",
    symbol: "symbols",
    concept: "concepts",
    entity: "entities",
    rationale: "rationales"
  };
  return map[nodeType] ?? "other";
}
function obsidianNodeSlug(node, pageById) {
  if (node.pageId) {
    const page = pageById.get(node.pageId);
    if (page) return path4.basename(page.path, ".md");
  }
  return slugify(node.label);
}
function buildAdjacency(edges) {
  const adjacency = /* @__PURE__ */ new Map();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.source).push({
      neighborId: edge.target,
      relation: edge.relation,
      evidenceClass: edge.evidenceClass,
      confidence: edge.confidence,
      direction: "out"
    });
    adjacency.get(edge.target).push({
      neighborId: edge.source,
      relation: edge.relation,
      evidenceClass: edge.evidenceClass,
      confidence: edge.confidence,
      direction: "in"
    });
  }
  return adjacency;
}
async function listFilesRecursive2(dir, base = "") {
  const results = [];
  let entries;
  try {
    entries = await fs4.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...await listFilesRecursive2(path4.join(dir, entry.name), rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}
function connectionsSection(nodeIds, adjacency, nodesById, wikilinkTarget) {
  const seen = /* @__PURE__ */ new Set();
  const lines = [];
  for (const nodeId of nodeIds) {
    for (const entry of adjacency.get(nodeId) ?? []) {
      const key = `${entry.neighborId}:${entry.relation}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const neighbor = nodesById.get(entry.neighborId);
      if (!neighbor) continue;
      const target = wikilinkTarget.get(entry.neighborId);
      if (!target) continue;
      lines.push(`- [[${target}|${neighbor.label}]] \u2014 ${entry.relation} (${entry.evidenceClass}, ${entry.confidence.toFixed(2)})`);
    }
  }
  return lines;
}
function typedLinkFrontmatter(nodeIds, adjacency, nodesById, wikilinkTarget) {
  const byRelation = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Set();
  for (const nodeId of nodeIds) {
    for (const entry of adjacency.get(nodeId) ?? []) {
      const key = `${entry.neighborId}:${entry.relation}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const neighbor = nodesById.get(entry.neighborId);
      if (!neighbor) continue;
      const target = wikilinkTarget.get(entry.neighborId);
      if (!target) continue;
      const bucket = byRelation.get(entry.relation) ?? [];
      bucket.push(`[[${target}|${neighbor.label}]]`);
      byRelation.set(entry.relation, bucket);
    }
  }
  return Object.fromEntries(byRelation);
}
async function exportObsidianVault(rootDir, outputDir) {
  const graph = await loadGraph(rootDir);
  const { paths } = await loadVaultConfig(rootDir);
  const resolvedOutputDir = path4.resolve(outputDir);
  await ensureDir(resolvedOutputDir);
  const nodesById = graphNodeById(graph);
  const pageById = graphPageById(graph);
  const communities = sortedCommunities(graph);
  const adjacency = buildAdjacency(graph.edges);
  const nodesByPageId = /* @__PURE__ */ new Map();
  for (const node of graph.nodes) {
    if (node.pageId && pageById.has(node.pageId)) {
      const list = nodesByPageId.get(node.pageId) ?? [];
      list.push(node);
      nodesByPageId.set(node.pageId, list);
    }
  }
  const orphanNodes = graph.nodes.filter((node) => !node.pageId || !pageById.has(node.pageId));
  const usedOrphanSlugs = /* @__PURE__ */ new Set();
  const orphanFilePath = /* @__PURE__ */ new Map();
  for (const node of [...orphanNodes].sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id))) {
    const slug = deduplicateFileName(obsidianNodeSlug(node, pageById), usedOrphanSlugs);
    orphanFilePath.set(node.id, `graph/nodes/${typePluralDir(node.type)}/${slug}.md`);
  }
  const wikilinkTarget = /* @__PURE__ */ new Map();
  for (const node of graph.nodes) {
    if (node.pageId) {
      const page = pageById.get(node.pageId);
      if (page) {
        wikilinkTarget.set(node.id, page.path.replace(/\.md$/, ""));
        continue;
      }
    }
    const orphanPath = orphanFilePath.get(node.id);
    if (orphanPath) {
      wikilinkTarget.set(node.id, orphanPath.replace(/\.md$/, ""));
    }
  }
  let fileCount = 0;
  const wikiFiles = await listFilesRecursive2(paths.wikiDir);
  const pageByPath = new Map(graph.pages.map((p) => [p.path, p]));
  for (const relPath of wikiFiles) {
    if (!relPath.endsWith(".md")) continue;
    const srcFile = path4.join(paths.wikiDir, relPath);
    const destFile = path4.join(resolvedOutputDir, relPath);
    await ensureDir(path4.dirname(destFile));
    let rawContent;
    try {
      rawContent = await fs4.readFile(srcFile, "utf8");
    } catch {
      continue;
    }
    const matchingPage = pageByPath.get(relPath);
    const pageNodes = matchingPage ? nodesByPageId.get(matchingPage.id) ?? [] : [];
    const parsed = matter2(rawContent);
    const data = parsed.data;
    if (pageNodes.length > 0) {
      const primaryNode = pageNodes[0];
      if (primaryNode.communityId) {
        data.graph_community = primaryNode.communityId;
      }
      data.degree = primaryNode.degree ?? 0;
      data.bridge_score = primaryNode.bridgeScore ?? 0;
      data.is_god_node = primaryNode.isGodNode ?? false;
      const title = data.title ?? "";
      const nodeAliases = pageNodes.map((n) => n.label).filter((label) => label.toLowerCase() !== title.toLowerCase());
      const existingAliases = Array.isArray(data.aliases) ? data.aliases : [];
      const mergedAliases = [.../* @__PURE__ */ new Set([...existingAliases, ...nodeAliases])];
      if (mergedAliases.length > 0) {
        data.aliases = mergedAliases;
      }
      const typedLinks = typedLinkFrontmatter(
        pageNodes.map((n) => n.id),
        adjacency,
        nodesById,
        wikilinkTarget
      );
      for (const [relation, links] of Object.entries(typedLinks)) {
        data[relation] = links;
      }
    }
    let outputContent = matter2.stringify(parsed.content, data);
    if (pageNodes.length > 0) {
      const connLines = connectionsSection(
        pageNodes.map((n) => n.id),
        adjacency,
        nodesById,
        wikilinkTarget
      );
      if (connLines.length > 0) {
        outputContent = `${outputContent.trimEnd()}

## Graph Connections

${connLines.join("\n")}
`;
      }
    }
    await fs4.writeFile(destFile, outputContent, "utf8");
    fileCount++;
  }
  for (const node of orphanNodes) {
    const relPath = orphanFilePath.get(node.id);
    const destFile = path4.join(resolvedOutputDir, relPath);
    await ensureDir(path4.dirname(destFile));
    const slug = path4.basename(relPath, ".md");
    const aliases = node.label !== slug ? [node.label] : [];
    const frontmatter = {
      id: node.id,
      type: node.type,
      community: node.communityId ?? null,
      confidence: node.confidence ?? null,
      source_class: node.sourceClass ?? null,
      degree: node.degree ?? 0,
      bridge_score: node.bridgeScore ?? 0,
      is_god_node: node.isGodNode ?? false,
      tags: node.tags ?? [],
      cssclasses: ["swarmvault", `sv-${node.type}`]
    };
    if (aliases.length > 0) {
      frontmatter.aliases = aliases;
    }
    const orphanTypedLinks = typedLinkFrontmatter([node.id], adjacency, nodesById, wikilinkTarget);
    for (const [relation, links] of Object.entries(orphanTypedLinks)) {
      frontmatter[relation] = links;
    }
    const lines = [`# ${node.label}`, ""];
    const connLines = connectionsSection([node.id], adjacency, nodesById, wikilinkTarget);
    if (connLines.length > 0) {
      lines.push("## Connections", "", ...connLines, "");
    }
    const content = matter2.stringify(lines.join("\n"), frontmatter);
    await fs4.writeFile(destFile, content, "utf8");
    fileCount++;
  }
  const usedCommunityFileNames = /* @__PURE__ */ new Set();
  for (const community of communities) {
    const wikiCommunityPage = graph.pages.find(
      (p) => p.kind === "community_summary" && p.nodeIds.some((nid) => community.nodeIds.includes(nid))
    );
    if (wikiCommunityPage) continue;
    const memberNodes = community.nodeIds.map((id) => nodesById.get(id)).filter((n2) => Boolean(n2));
    const memberIdSet = new Set(community.nodeIds);
    let internalEdges = 0;
    for (const edge of graph.edges) {
      if (memberIdSet.has(edge.source) && memberIdSet.has(edge.target)) {
        internalEdges++;
      }
    }
    const n = memberNodes.length;
    const maxPossible = n * (n - 1);
    const cohesion = maxPossible > 0 ? internalEdges / maxPossible : 0;
    const bridgeNodes = memberNodes.filter((node) => {
      const neighbors = adjacency.get(node.id) ?? [];
      return neighbors.some((nb) => {
        const nbNode = nodesById.get(nb.neighborId);
        return nbNode && nbNode.communityId !== community.id;
      });
    });
    const communitySlug = deduplicateFileName(safeFileName(community.label), usedCommunityFileNames);
    const destFile = path4.join(resolvedOutputDir, "graph", "communities", `${communitySlug}.md`);
    await ensureDir(path4.dirname(destFile));
    const lines = [`# ${community.label}`, "", "## Members", ""];
    for (const member of memberNodes) {
      const target = wikilinkTarget.get(member.id);
      if (target) {
        lines.push(`- [[${target}|${member.label}]]`);
      } else {
        lines.push(`- ${member.label}`);
      }
    }
    lines.push("");
    if (bridgeNodes.length > 0) {
      lines.push("## Bridge Nodes", "");
      for (const bridge of bridgeNodes) {
        const target = wikilinkTarget.get(bridge.id);
        if (target) {
          lines.push(`- [[${target}|${bridge.label}]]`);
        } else {
          lines.push(`- ${bridge.label}`);
        }
      }
      lines.push("");
    }
    const frontmatter = {
      id: community.id,
      node_count: memberNodes.length,
      cohesion: Number(cohesion.toFixed(4))
    };
    const content = matter2.stringify(lines.join("\n"), frontmatter);
    await fs4.writeFile(destFile, content, "utf8");
    fileCount++;
  }
  const outputsAssetsDir = path4.join(paths.wikiDir, "outputs", "assets");
  try {
    const assetFiles = await listFilesRecursive2(outputsAssetsDir);
    for (const relAsset of assetFiles) {
      const src = path4.join(outputsAssetsDir, relAsset);
      const dest = path4.join(resolvedOutputDir, "outputs", "assets", relAsset);
      await ensureDir(path4.dirname(dest));
      await fs4.copyFile(src, dest);
      fileCount++;
    }
  } catch {
  }
  try {
    const rawAssetFiles = await listFilesRecursive2(paths.rawAssetsDir);
    for (const relAsset of rawAssetFiles) {
      const src = path4.join(paths.rawAssetsDir, relAsset);
      const dest = path4.join(resolvedOutputDir, "raw", "assets", relAsset);
      await ensureDir(path4.dirname(dest));
      await fs4.copyFile(src, dest);
      fileCount++;
    }
  } catch {
  }
  const obsidianDir = path4.join(resolvedOutputDir, ".obsidian");
  await ensureDir(obsidianDir);
  const projectIds = Object.keys(
    graph.pages.reduce(
      (acc, page) => {
        for (const pid of page.projectIds) acc[pid] = true;
        return acc;
      },
      {}
    )
  );
  const nodeTypeGroups = [
    { query: "tag:#source", color: hexToObsidianColor("#f59e0b") },
    { query: "tag:#module", color: hexToObsidianColor("#fb7185") },
    { query: "tag:#concept", color: hexToObsidianColor("#0ea5e9") },
    { query: "tag:#entity", color: hexToObsidianColor("#22c55e") },
    { query: "tag:#rationale", color: hexToObsidianColor("#14b8a6") },
    { query: "tag:#symbol", color: hexToObsidianColor("#8b5cf6") }
  ];
  const projectColorGroups = projectIds.map((pid, index) => ({
    query: `tag:#project/${pid}`,
    color: hexToObsidianColor(["#0ea5e9", "#22c55e", "#f59e0b", "#8b5cf6", "#fb7185", "#14b8a6"][index % 6])
  }));
  const colorGroups = [...nodeTypeGroups, ...projectColorGroups];
  await fs4.writeFile(
    path4.join(obsidianDir, "app.json"),
    JSON.stringify(
      { newFileLocation: "folder", newFileFolderPath: "outputs", attachmentFolderPath: "raw/assets", useMarkdownLinks: false },
      null,
      2
    ),
    "utf8"
  );
  await fs4.writeFile(
    path4.join(obsidianDir, "core-plugins.json"),
    JSON.stringify(["file-explorer", "global-search", "graph", "backlink", "tag-pane", "page-preview", "outline"], null, 2),
    "utf8"
  );
  await fs4.writeFile(
    path4.join(obsidianDir, "graph.json"),
    JSON.stringify(
      { colorGroups, "collapse-filter": false, search: "", showTags: true, showAttachments: false, showOrphans: true },
      null,
      2
    ),
    "utf8"
  );
  await fs4.writeFile(path4.join(obsidianDir, "types.json"), JSON.stringify({ types: OBSIDIAN_PROPERTY_TYPES }, null, 2), "utf8");
  fileCount += 4;
  const dashboardDir = path4.join(resolvedOutputDir, "graph", "dashboards");
  await ensureDir(dashboardDir);
  const dvPages = [
    {
      name: "sources-by-confidence",
      title: "Sources by Confidence",
      query: "TABLE confidence, source_class, updated_at FROM #source SORT confidence DESC"
    },
    {
      name: "concepts-index",
      title: "Concepts Index",
      query: "TABLE degree, graph_community FROM #concept SORT degree DESC"
    },
    {
      name: "stale-pages",
      title: "Stale Pages",
      query: 'TABLE freshness, updated_at FROM "" WHERE freshness = "stale"'
    },
    {
      name: "god-nodes",
      title: "God Nodes",
      query: 'TABLE degree, bridge_score FROM "" WHERE is_god_node = true SORT degree DESC'
    }
  ];
  for (const dv of dvPages) {
    const dvFrontmatter = {
      title: dv.title,
      kind: "dashboard",
      tags: ["dashboard", "dataview"],
      cssclasses: ["swarmvault", "sv-dashboard"]
    };
    const dvBody = `# ${dv.title}

\`\`\`dataview
${dv.query}
\`\`\`
`;
    await fs4.writeFile(path4.join(dashboardDir, `${dv.name}.md`), matter2.stringify(dvBody, dvFrontmatter), "utf8");
    fileCount++;
  }
  return { format: "obsidian", outputPath: resolvedOutputDir, fileCount };
}
async function exportObsidianCanvas(rootDir, outputPath) {
  const graph = await loadGraph(rootDir);
  const communities = sortedCommunities(graph);
  const nodesById = graphNodeById(graph);
  const COLORS = ["1", "2", "3", "4", "5", "6"];
  const NODE_WIDTH = 250;
  const NODE_HEIGHT = 60;
  const NODE_PAD_X = 30;
  const NODE_PAD_Y = 20;
  const GROUP_PAD = 50;
  const GRID_COLS = 3;
  const GROUP_GAP = 100;
  const pageById = graphPageById(graph);
  const canvasNodes = [];
  const canvasEdges = [];
  const nodeCanvasId = /* @__PURE__ */ new Map();
  const communitySizes = communities.map((community) => {
    const memberCount = community.nodeIds.filter((id) => nodesById.has(id)).length;
    const innerCols = Math.max(1, Math.ceil(Math.sqrt(memberCount)));
    const innerRows = Math.max(1, Math.ceil(memberCount / innerCols));
    const width = innerCols * (NODE_WIDTH + NODE_PAD_X) - NODE_PAD_X + GROUP_PAD * 2;
    const height = innerRows * (NODE_HEIGHT + NODE_PAD_Y) - NODE_PAD_Y + GROUP_PAD * 2 + 30;
    return { width, height, innerCols };
  });
  const totalRows = Math.ceil(communities.length / GRID_COLS);
  const colWidths = new Array(GRID_COLS).fill(0);
  const rowHeights = new Array(totalRows).fill(0);
  communitySizes.forEach((size, index) => {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    colWidths[col] = Math.max(colWidths[col], size.width);
    rowHeights[row] = Math.max(rowHeights[row], size.height);
  });
  const colOffsets = [0];
  for (let c = 1; c < GRID_COLS; c++) {
    colOffsets.push(colOffsets[c - 1] + colWidths[c - 1] + GROUP_GAP);
  }
  const rowOffsets = [0];
  for (let r = 1; r < totalRows; r++) {
    rowOffsets.push(rowOffsets[r - 1] + rowHeights[r - 1] + GROUP_GAP);
  }
  communities.forEach((community, communityIndex) => {
    const members = community.nodeIds.map((id) => nodesById.get(id)).filter((n) => Boolean(n)).sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
    const col = communityIndex % GRID_COLS;
    const row = Math.floor(communityIndex / GRID_COLS);
    const { width: groupWidth, height: groupHeight, innerCols } = communitySizes[communityIndex];
    const groupX = colOffsets[col];
    const groupY = rowOffsets[row];
    canvasNodes.push({
      id: `group-${community.id}`,
      type: "group",
      label: community.label,
      x: groupX,
      y: groupY,
      width: groupWidth,
      height: groupHeight
    });
    members.forEach((node, memberIndex) => {
      const innerCol = memberIndex % innerCols;
      const innerRow = Math.floor(memberIndex / innerCols);
      const nodeX = groupX + GROUP_PAD + innerCol * (NODE_WIDTH + NODE_PAD_X);
      const nodeY = groupY + GROUP_PAD + 30 + innerRow * (NODE_HEIGHT + NODE_PAD_Y);
      const canvasId = `node-${node.id}`;
      nodeCanvasId.set(node.id, canvasId);
      const page = node.pageId ? pageById.get(node.pageId) : void 0;
      if (page) {
        canvasNodes.push({
          id: canvasId,
          type: "file",
          file: page.path,
          x: nodeX,
          y: nodeY,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          color: COLORS[communityIndex % COLORS.length]
        });
      } else {
        const communityLabel = community.id === "community:unassigned" ? "Unassigned" : community.label;
        canvasNodes.push({
          id: canvasId,
          type: "text",
          text: `**${node.label}**
Type: ${node.type}
Community: ${communityLabel}`,
          x: nodeX,
          y: nodeY,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          color: COLORS[communityIndex % COLORS.length]
        });
      }
    });
  });
  for (const edge of graph.edges) {
    const fromId = nodeCanvasId.get(edge.source);
    const toId = nodeCanvasId.get(edge.target);
    if (!fromId || !toId) continue;
    canvasEdges.push({
      id: `edge-${edge.id}`,
      fromNode: fromId,
      toNode: toId,
      fromSide: "right",
      toSide: "left",
      fromEnd: "none",
      toEnd: "arrow",
      label: edge.relation
    });
  }
  const canvas = {
    nodes: canvasNodes,
    edges: canvasEdges
  };
  const resolvedPath = await writeGraphExport(outputPath, JSON.stringify(canvas, null, 2));
  return { format: "canvas", outputPath: resolvedPath };
}

// src/graph-push.ts
import fs5 from "fs/promises";
import path5 from "path";
import neo4j from "neo4j-driver";
var DEFAULT_NEO4J_BATCH_SIZE = 500;
var DEFAULT_NEO4J_DATABASE = "neo4j";
function requireConfigValue(value, name) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  throw new Error(`Neo4j push requires ${name}. Configure \`graphSinks.neo4j.${name}\` or pass the matching CLI flag.`);
}
async function deriveVaultId(rootDir) {
  const realRoot = await fs5.realpath(rootDir).catch(() => path5.resolve(rootDir));
  const label = slugify(path5.basename(realRoot));
  return `${label}-${sha256(realRoot).slice(0, 12)}`;
}
async function resolveNeo4jPushConfig(rootDir, options) {
  const { config } = await loadVaultConfig(rootDir);
  const sink = config.graphSinks?.neo4j;
  const includeClasses = normalizeIncludedClasses(options.includeClasses ?? sink?.includeClasses ?? ["first_party"]);
  return {
    uri: requireConfigValue(options.uri ?? sink?.uri, "uri"),
    username: requireConfigValue(options.username ?? sink?.username, "username"),
    passwordEnv: requireConfigValue(options.passwordEnv ?? sink?.passwordEnv, "passwordEnv"),
    database: options.database?.trim() || sink?.database?.trim() || DEFAULT_NEO4J_DATABASE,
    vaultId: options.vaultId?.trim() || sink?.vaultId?.trim() || await deriveVaultId(rootDir),
    includeClasses,
    batchSize: normalizeBatchSize(options.batchSize ?? sink?.batchSize)
  };
}
function normalizeIncludedClasses(values) {
  const allowed = ["first_party", "third_party", "resource", "generated"];
  const unique = [...new Set(values)].filter((value) => allowed.includes(value));
  return unique.length ? unique : ["first_party"];
}
function normalizeBatchSize(value) {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return DEFAULT_NEO4J_BATCH_SIZE;
  }
  return Math.max(1, Math.floor(value));
}
async function loadGraph2(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  const raw = JSON.parse(await fs5.readFile(paths.graphPath, "utf8"));
  return raw;
}
function buildResult(input) {
  const counts = graphCounts(input.filteredGraph);
  const fullCounts = graphCounts(input.fullGraph);
  return {
    sink: "neo4j",
    uri: input.resolved.uri,
    database: input.resolved.database,
    vaultId: input.resolved.vaultId,
    dryRun: input.dryRun,
    graphHash: graphHash(input.fullGraph),
    includedSourceClasses: input.resolved.includeClasses,
    counts,
    skipped: {
      sources: Math.max(0, fullCounts.sources - counts.sources),
      pages: Math.max(0, fullCounts.pages - counts.pages),
      nodes: Math.max(0, fullCounts.nodes - counts.nodes),
      relationships: Math.max(0, fullCounts.relationships - counts.relationships),
      hyperedges: Math.max(0, fullCounts.hyperedges - counts.hyperedges),
      groupMembers: Math.max(0, fullCounts.groupMembers - counts.groupMembers)
    },
    warnings: input.warnings ?? []
  };
}
function createDriver(uri, username, password) {
  return neo4j.driver(uri, neo4j.auth.basic(username, password));
}
async function ensureNeo4jConstraints(session) {
  await session.run("CREATE CONSTRAINT swarmvault_node_identity IF NOT EXISTS FOR (n:SwarmNode) REQUIRE (n.vaultId, n.id) IS UNIQUE");
  await session.run("CREATE CONSTRAINT swarmvault_sync_identity IF NOT EXISTS FOR (s:SwarmVaultSync) REQUIRE s.vaultId IS UNIQUE");
}
function chunkRows(rows, batchSize) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += batchSize) {
    chunks.push(rows.slice(index, index + batchSize));
  }
  return chunks;
}
async function writeNodeRows(session, vaultId, rows, batchSize) {
  for (const chunk of chunkRows(rows, batchSize)) {
    await session.executeWrite(
      (tx) => tx.run(["UNWIND $rows AS row", "MERGE (n:SwarmNode { vaultId: $vaultId, id: row.id })", "SET n += row.props"].join("\n"), {
        vaultId,
        rows: chunk
      })
    );
  }
}
async function writeEdgeRows(session, vaultId, rows, batchSize, relation) {
  const neoRelation = relationType(relation);
  const query = [
    "UNWIND $rows AS row",
    "MATCH (a:SwarmNode { vaultId: $vaultId, id: row.source })",
    "MATCH (b:SwarmNode { vaultId: $vaultId, id: row.target })",
    `MERGE (a)-[r:${neoRelation} { vaultId: $vaultId, id: row.id }]->(b)`,
    "SET r += row.props"
  ].join("\n");
  for (const chunk of chunkRows(rows, batchSize)) {
    await session.executeWrite((tx) => tx.run(query, { vaultId, rows: chunk }));
  }
}
async function writeSyncNode(session, input) {
  await session.executeWrite(
    (tx) => tx.run(
      [
        "MERGE (s:SwarmVaultSync { vaultId: $vaultId })",
        "SET s += {",
        "  vaultId: $vaultId,",
        "  rootDir: $rootDir,",
        "  graphGeneratedAt: $graphGeneratedAt,",
        "  graphHash: $graphHash,",
        "  pushedAt: $pushedAt,",
        "  includedSourceClasses: $includedSourceClasses,",
        "  sources: $sources,",
        "  pages: $pages,",
        "  nodes: $nodes,",
        "  relationships: $relationships,",
        "  hyperedges: $hyperedges,",
        "  groupMembers: $groupMembers",
        "}"
      ].join("\n"),
      {
        vaultId: input.vaultId,
        rootDir: path5.resolve(input.rootDir),
        graphGeneratedAt: input.graph.generatedAt,
        graphHash: graphHash(input.graph),
        pushedAt: input.pushedAt,
        includedSourceClasses: input.includedSourceClasses,
        ...input.counts
      }
    )
  );
}
async function pushGraphNeo4j(rootDir, options = {}) {
  const graph = await loadGraph2(rootDir);
  const resolved = await resolveNeo4jPushConfig(rootDir, options);
  const filteredGraph = filterGraphBySourceClasses(graph, resolved.includeClasses);
  const warnings = filteredGraph.nodes.length || filteredGraph.hyperedges.length || filteredGraph.edges.length ? [] : [`No graph records matched the included source classes: ${resolved.includeClasses.join(", ")}`];
  const result = buildResult({
    resolved,
    filteredGraph,
    fullGraph: graph,
    dryRun: options.dryRun ?? false,
    warnings
  });
  if (options.dryRun) {
    return result;
  }
  const password = process.env[resolved.passwordEnv];
  if (!password) {
    throw new Error(`Environment variable ${resolved.passwordEnv} is required for Neo4j push.`);
  }
  const driver = (options.driverFactory ?? createDriver)(resolved.uri, resolved.username, password);
  const session = driver.session({ database: resolved.database });
  try {
    await ensureNeo4jConstraints(session);
    const pageById = graphPageById(filteredGraph);
    const nodeRows = [
      ...filteredGraph.nodes.sort((left, right) => left.id.localeCompare(right.id)).map((node) => ({
        id: node.id,
        props: normalizeSwarmNodeProps(node, node.pageId ? pageById.get(node.pageId) : void 0)
      })),
      ...filteredGraph.hyperedges.sort((left, right) => left.id.localeCompare(right.id)).map((hyperedge) => ({
        id: normalizeHyperedgeNodeProps(hyperedge).id,
        props: normalizeHyperedgeNodeProps(hyperedge)
      }))
    ];
    await writeNodeRows(session, resolved.vaultId, nodeRows, resolved.batchSize);
    const edgeGroups = /* @__PURE__ */ new Map();
    for (const edge of [...filteredGraph.edges].sort((left, right) => left.id.localeCompare(right.id))) {
      const rows = edgeGroups.get(edge.relation) ?? [];
      rows.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        props: normalizeEdgeProps(edge)
      });
      edgeGroups.set(edge.relation, rows);
    }
    for (const [relation, rows] of [...edgeGroups.entries()].sort((left, right) => left[0].localeCompare(right[0]))) {
      await writeEdgeRows(session, resolved.vaultId, rows, resolved.batchSize, relation);
    }
    const memberRows = filteredGraph.hyperedges.flatMap(
      (hyperedge) => hyperedge.nodeIds.map((nodeId) => ({
        id: `member:${hyperedge.id}:${nodeId}`,
        source: normalizeHyperedgeNodeProps(hyperedge).id,
        target: nodeId,
        props: normalizeGroupMemberProps(hyperedge, nodeId)
      }))
    );
    if (memberRows.length) {
      await writeEdgeRows(session, resolved.vaultId, memberRows, resolved.batchSize, "group_member");
    }
    await writeSyncNode(session, {
      vaultId: resolved.vaultId,
      rootDir,
      graph,
      pushedAt: (/* @__PURE__ */ new Date()).toISOString(),
      includedSourceClasses: resolved.includeClasses,
      counts: result.counts
    });
    return result;
  } finally {
    await session.close();
    await driver.close();
  }
}

// src/hooks.ts
import fs6 from "fs/promises";
import path6 from "path";
import process3 from "process";
var hookStart = "# >>> swarmvault hook >>>";
var hookEnd = "# <<< swarmvault hook <<<";
async function findNearestGitRoot(startPath) {
  let current = path6.resolve(startPath);
  try {
    const stat = await fs6.stat(current);
    if (!stat.isDirectory()) {
      current = path6.dirname(current);
    }
  } catch {
    current = path6.dirname(current);
  }
  while (true) {
    if (await fileExists(path6.join(current, ".git"))) {
      return current;
    }
    const parent = path6.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}
function shellQuote(value) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}
function resolveSwarmvaultExecutableCandidate() {
  const argvPath = process3.argv[1];
  if (typeof argvPath === "string" && argvPath.trim() && (argvPath.includes(`${path6.sep}@swarmvaultai${path6.sep}cli${path6.sep}`) || argvPath.includes(`${path6.sep}packages${path6.sep}cli${path6.sep}`))) {
    return path6.resolve(argvPath);
  }
  return "swarmvault";
}
function managedHookBlock(vaultRoot) {
  const resolvedExecutable = resolveSwarmvaultExecutableCandidate();
  return [
    hookStart,
    `cd ${shellQuote(vaultRoot)} || exit 0`,
    `swarmvault_bin=${shellQuote(resolvedExecutable)}`,
    '[ ! -x "$swarmvault_bin" ] && swarmvault_bin=$(command -v swarmvault 2>/dev/null || true)',
    'if [ -n "$swarmvault_bin" ] && [ -x "$swarmvault_bin" ]; then',
    `  "$swarmvault_bin" watch --repo --once --code-only >/dev/null 2>&1 || printf '[swarmvault hook] refresh failed\\n' >&2`,
    "fi",
    hookEnd,
    ""
  ].join("\n");
}
function hookPath(repoRoot, hookName) {
  return path6.join(repoRoot, ".git", "hooks", hookName);
}
async function readHookStatus(filePath) {
  if (!await fileExists(filePath)) {
    return "not_installed";
  }
  const content = await fs6.readFile(filePath, "utf8");
  return content.includes(hookStart) && content.includes(hookEnd) ? "installed" : "other_content";
}
async function upsertHookFile(filePath, block) {
  const existing = await fileExists(filePath) ? await fs6.readFile(filePath, "utf8") : "";
  let next;
  const startIndex = existing.indexOf(hookStart);
  const endIndex = existing.indexOf(hookEnd);
  if (startIndex !== -1 && endIndex !== -1) {
    next = `${existing.slice(0, startIndex)}${block}${existing.slice(endIndex + hookEnd.length)}`.trimEnd();
  } else if (existing.trim().length > 0) {
    next = `${existing.trimEnd()}

${block}`.trimEnd();
  } else {
    next = `#!/bin/sh
${block}`.trimEnd();
  }
  await ensureDir(path6.dirname(filePath));
  await fs6.writeFile(filePath, `${next}
`, { mode: 493, encoding: "utf8" });
  await fs6.chmod(filePath, 493);
}
async function removeHookBlock(filePath) {
  if (!await fileExists(filePath)) {
    return;
  }
  const existing = await fs6.readFile(filePath, "utf8");
  const startIndex = existing.indexOf(hookStart);
  const endIndex = existing.indexOf(hookEnd);
  if (startIndex === -1 || endIndex === -1) {
    return;
  }
  const next = `${existing.slice(0, startIndex)}${existing.slice(endIndex + hookEnd.length)}`.trim();
  if (!next || next === "#!/bin/sh") {
    await fs6.rm(filePath, { force: true });
    return;
  }
  await fs6.writeFile(filePath, `${next}
`, "utf8");
}
async function getGitHookStatus(rootDir) {
  const repoRoot = await findNearestGitRoot(rootDir);
  if (!repoRoot) {
    return {
      repoRoot: null,
      postCommit: "not_installed",
      postCheckout: "not_installed"
    };
  }
  return {
    repoRoot,
    postCommit: await readHookStatus(hookPath(repoRoot, "post-commit")),
    postCheckout: await readHookStatus(hookPath(repoRoot, "post-checkout"))
  };
}
async function installGitHooks(rootDir) {
  const repoRoot = await findNearestGitRoot(rootDir);
  if (!repoRoot) {
    throw new Error("No git repository found above the current vault.");
  }
  const block = managedHookBlock(path6.resolve(rootDir));
  await upsertHookFile(hookPath(repoRoot, "post-commit"), block);
  await upsertHookFile(hookPath(repoRoot, "post-checkout"), block);
  return getGitHookStatus(rootDir);
}
async function uninstallGitHooks(rootDir) {
  const repoRoot = await findNearestGitRoot(rootDir);
  if (!repoRoot) {
    return {
      repoRoot: null,
      postCommit: "not_installed",
      postCheckout: "not_installed"
    };
  }
  await removeHookBlock(hookPath(repoRoot, "post-commit"));
  await removeHookBlock(hookPath(repoRoot, "post-checkout"));
  return getGitHookStatus(rootDir);
}

// src/mcp.ts
import fs7 from "fs/promises";
import path7 from "path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
var SERVER_VERSION = "3.5.0";
async function createMcpServer(rootDir) {
  const server = new McpServer({
    name: "swarmvault",
    version: SERVER_VERSION,
    websiteUrl: "https://www.swarmvault.ai"
  });
  server.registerTool(
    "workspace_info",
    {
      description: "Return the current SwarmVault workspace paths and high-level counts."
    },
    safeHandler(async () => {
      const info = await getWorkspaceInfo(rootDir);
      return asToolText(info);
    })
  );
  server.registerTool(
    "search_pages",
    {
      description: "Search compiled wiki pages using the local full-text index.",
      inputSchema: {
        query: z.string().min(1).describe("Search query"),
        limit: z.number().int().min(1).max(25).optional().describe("Maximum number of results")
      }
    },
    safeHandler(async ({ query, limit }) => {
      const results = await searchVault(rootDir, query, limit ?? 5);
      return asToolText(results);
    })
  );
  server.registerTool(
    "retrieval_status",
    {
      description: "Read SwarmVault retrieval index health and configuration."
    },
    safeHandler(async () => {
      return asToolText(await getRetrievalStatus(rootDir));
    })
  );
  server.registerTool(
    "rebuild_retrieval",
    {
      description: "Rebuild the local retrieval index from the current graph."
    },
    safeHandler(async () => {
      return asToolText(await rebuildRetrievalIndex(rootDir));
    })
  );
  server.registerTool(
    "doctor_retrieval",
    {
      description: "Diagnose retrieval index problems and optionally repair them.",
      inputSchema: {
        repair: z.boolean().optional().describe("Rebuild stale or missing retrieval artifacts")
      }
    },
    safeHandler(async ({ repair }) => {
      return asToolText(await doctorRetrieval(rootDir, { repair }));
    })
  );
  server.registerTool(
    "doctor_vault",
    {
      description: "Diagnose vault health across graph, retrieval, review queues, watch state, and migrations.",
      inputSchema: {
        repair: z.boolean().optional().describe("Run safe repairs such as rebuilding stale retrieval artifacts")
      }
    },
    safeHandler(async ({ repair }) => {
      return asToolText(await doctorVault(rootDir, { repair }));
    })
  );
  server.registerTool(
    "read_page",
    {
      description: "Read a generated wiki page by its path relative to wiki/.",
      inputSchema: {
        path: z.string().min(1).describe("Path relative to wiki/, for example sources/example.md")
      }
    },
    safeHandler(async ({ path: relativePath }) => {
      const page = await readPage(rootDir, relativePath);
      if (!page) {
        return asToolError(`Page not found: ${relativePath}`);
      }
      return asToolText(page);
    })
  );
  server.registerTool(
    "list_sources",
    {
      description: "List source manifests in the current workspace.",
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().describe("Maximum number of manifests to return")
      }
    },
    safeHandler(async ({ limit }) => {
      const manifests = await listManifests(rootDir);
      return asToolText(limit ? manifests.slice(0, limit) : manifests);
    })
  );
  server.registerTool(
    "query_graph",
    {
      description: "Traverse the local graph from search seeds without calling a model provider.",
      inputSchema: {
        question: z.string().min(1).describe("Question or graph search seed"),
        traversal: z.enum(["bfs", "dfs"]).optional().describe("Traversal strategy"),
        budget: z.number().int().min(3).max(50).optional().describe("Maximum nodes to summarize")
      }
    },
    safeHandler(async ({ question, traversal, budget }) => {
      const result = await queryGraphVault(rootDir, question, {
        traversal,
        budget
      });
      return asToolText(result);
    })
  );
  server.registerTool(
    "graph_report",
    {
      description: "Return the machine-readable graph report and trust artifact."
    },
    safeHandler(async () => {
      return asToolText(await readGraphReport(rootDir) ?? { error: "Graph report not found. Run `swarmvault compile` first." });
    })
  );
  server.registerTool(
    "graph_stats",
    {
      description: "Return lightweight counts for graph nodes, evidence classes, source classes, communities, pages, and edges."
    },
    safeHandler(async () => {
      return asToolText(await graphStatsVault(rootDir));
    })
  );
  server.registerTool(
    "cluster_graph",
    {
      description: "Recompute graph communities, node degrees, god-node flags, and graph report artifacts from the existing compiled graph.",
      inputSchema: {
        resolution: z.number().positive().optional().describe("Optional Louvain community resolution override")
      }
    },
    safeHandler(async ({ resolution }) => {
      return asToolText(await refreshGraphClusters(rootDir, { resolution }));
    })
  );
  server.registerTool(
    "get_node",
    {
      description: "Explain a graph node, its page, community, neighbors, and group patterns.",
      inputSchema: {
        target: z.string().min(1).describe("Node or page label/id")
      }
    },
    safeHandler(async ({ target }) => {
      return asToolText(await explainGraphVault(rootDir, target));
    })
  );
  server.registerTool(
    "get_community",
    {
      description: "Return members, pages, and top evidence edges for a graph community by id or label.",
      inputSchema: {
        target: z.string().min(1).describe("Community id or label"),
        limit: z.number().int().min(1).max(100).optional().describe("Maximum evidence edges to return")
      }
    },
    safeHandler(async ({ target, limit }) => {
      return asToolText(await getGraphCommunityVault(rootDir, target, limit ?? 25));
    })
  );
  server.registerTool(
    "get_hyperedges",
    {
      description: "List graph hyperedges, optionally filtered to a node or page target.",
      inputSchema: {
        target: z.string().optional().describe("Optional node/page label or id to filter by"),
        limit: z.number().int().min(1).max(50).optional().describe("Maximum hyperedges to return")
      }
    },
    safeHandler(async ({ target, limit }) => {
      return asToolText(await listGraphHyperedges(rootDir, target, limit ?? 25));
    })
  );
  server.registerTool(
    "get_neighbors",
    {
      description: "Return the neighbors of a graph node or page target.",
      inputSchema: {
        target: z.string().min(1).describe("Node or page label/id")
      }
    },
    safeHandler(async ({ target }) => {
      const explanation = await explainGraphVault(rootDir, target);
      return asToolText(explanation.neighbors);
    })
  );
  server.registerTool(
    "shortest_path",
    {
      description: "Find the shortest graph path between two targets.",
      inputSchema: {
        from: z.string().min(1).describe("Start node/page label or id"),
        to: z.string().min(1).describe("End node/page label or id")
      }
    },
    safeHandler(async ({ from, to }) => {
      return asToolText(await pathGraphVault(rootDir, from, to));
    })
  );
  server.registerTool(
    "god_nodes",
    {
      description: "List the highest-connectivity graph nodes.",
      inputSchema: {
        limit: z.number().int().min(1).max(25).optional().describe("Maximum nodes to return")
      }
    },
    safeHandler(async ({ limit }) => {
      return asToolText(await listGodNodes(rootDir, limit ?? 10));
    })
  );
  server.registerTool(
    "blast_radius",
    {
      description: "Analyze the impact of changing a file or module by tracing reverse import edges.",
      inputSchema: {
        target: z.string().min(1).describe("File path, module label, or module id"),
        maxDepth: z.number().int().min(1).max(10).optional().describe("Maximum traversal depth (default 3)")
      }
    },
    safeHandler(async ({ target, maxDepth }) => {
      return asToolText(await blastRadiusVault(rootDir, target, { maxDepth: maxDepth ?? 3 }));
    })
  );
  server.registerTool(
    "query_vault",
    {
      description: "Ask a question against the compiled vault and optionally save the answer.",
      inputSchema: {
        question: z.string().min(1).describe("Question to ask the vault"),
        save: z.boolean().optional().describe("Persist the answer to wiki/outputs"),
        format: z.enum(["markdown", "report", "slides", "chart", "image"]).optional().describe("Output format")
      }
    },
    safeHandler(async ({ question, save, format }) => {
      const result = await queryVault(rootDir, {
        question,
        save: save ?? true,
        format
      });
      return asToolText(result);
    })
  );
  server.registerTool(
    "build_context_pack",
    {
      description: "Build a cited, token-bounded context pack for an agent task.",
      inputSchema: {
        goal: z.string().min(1).describe("Task, question, or goal the agent needs context for"),
        target: z.string().optional().describe("Optional page, node, path, project, or label to anchor the pack"),
        budgetTokens: z.number().int().min(200).optional().describe("Approximate token budget for included context"),
        format: z.enum(["markdown", "json", "llms"]).optional().describe("Preferred rendered output format")
      }
    },
    safeHandler(async ({ goal, target, budgetTokens, format }) => {
      const result = await buildContextPack(rootDir, { goal, target, budgetTokens, format });
      return asToolText(result);
    })
  );
  server.registerTool(
    "list_context_packs",
    {
      description: "List saved SwarmVault context packs."
    },
    safeHandler(async () => {
      return asToolText(await listContextPacks(rootDir));
    })
  );
  server.registerTool(
    "read_context_pack",
    {
      description: "Read a saved SwarmVault context pack by id.",
      inputSchema: {
        id: z.string().min(1).describe("Context pack id")
      }
    },
    safeHandler(async ({ id }) => {
      const pack = await readContextPack(rootDir, id);
      if (!pack) {
        return asToolError(`Context pack not found: ${id}`);
      }
      return asToolText(pack);
    })
  );
  server.registerTool(
    "start_memory_task",
    {
      description: "Start a durable SwarmVault agent memory task and build its initial context pack.",
      inputSchema: {
        goal: z.string().min(1).describe("Task goal to preserve in agent memory"),
        target: z.string().optional().describe("Optional page, node, path, project, or label to anchor the initial context pack"),
        budgetTokens: z.number().int().min(200).optional().describe("Approximate token budget for the initial context pack"),
        agent: z.string().optional().describe("Agent name to record on the task"),
        contextPackId: z.string().optional().describe("Existing context pack id to attach instead of building a new one")
      }
    },
    safeHandler(async ({ goal, target, budgetTokens, agent, contextPackId }) => {
      return asToolText(await startMemoryTask(rootDir, { goal, target, budgetTokens, agent, contextPackId }));
    })
  );
  server.registerTool(
    "update_memory_task",
    {
      description: "Append a note, decision, path, context pack, or status change to a SwarmVault memory task.",
      inputSchema: {
        id: z.string().min(1).describe("Memory task id"),
        note: z.string().optional().describe("Task note to append"),
        decision: z.string().optional().describe("Decision to append"),
        changedPath: z.string().optional().describe("Changed file or wiki path to attach"),
        contextPackId: z.string().optional().describe("Context pack id to attach"),
        sessionId: z.string().optional().describe("Session id to attach"),
        sourceId: z.string().optional().describe("Source id to attach"),
        pageId: z.string().optional().describe("Page id to attach"),
        nodeId: z.string().optional().describe("Graph node id to attach"),
        gitRef: z.string().optional().describe("Git ref to attach"),
        status: z.enum(["active", "blocked", "completed", "archived"]).optional().describe("Task status")
      }
    },
    safeHandler(async ({ id, ...options }) => {
      return asToolText(await updateMemoryTask(rootDir, id, options));
    })
  );
  server.registerTool(
    "finish_memory_task",
    {
      description: "Finish a SwarmVault memory task with an outcome and optional follow-up.",
      inputSchema: {
        id: z.string().min(1).describe("Memory task id"),
        outcome: z.string().min(1).describe("Outcome to record"),
        followUp: z.string().optional().describe("Follow-up to preserve for the next agent")
      }
    },
    safeHandler(async ({ id, outcome, followUp }) => {
      return asToolText(await finishMemoryTask(rootDir, id, { outcome, followUp }));
    })
  );
  server.registerTool(
    "list_memory_tasks",
    {
      description: "List saved SwarmVault agent memory tasks."
    },
    safeHandler(async () => {
      return asToolText(await listMemoryTasks(rootDir));
    })
  );
  server.registerTool(
    "read_memory_task",
    {
      description: "Read a saved SwarmVault agent memory task by id.",
      inputSchema: {
        id: z.string().min(1).describe("Memory task id")
      }
    },
    safeHandler(async ({ id }) => {
      const task = await readMemoryTask(rootDir, id);
      if (!task) {
        return asToolError(`Memory task not found: ${id}`);
      }
      return asToolText(task);
    })
  );
  server.registerTool(
    "resume_memory_task",
    {
      description: "Render a saved SwarmVault memory task as a next-agent handoff.",
      inputSchema: {
        id: z.string().min(1).describe("Memory task id"),
        format: z.enum(["markdown", "json", "llms"]).optional().describe("Rendered output format")
      }
    },
    safeHandler(async ({ id, format }) => {
      return asToolText(await resumeMemoryTask(rootDir, id, { format }));
    })
  );
  server.registerTool(
    "start_task",
    {
      description: "Start a durable SwarmVault agent task and build its initial context pack.",
      inputSchema: {
        goal: z.string().min(1).describe("Task goal to preserve"),
        target: z.string().optional().describe("Optional page, node, path, project, or label to anchor the initial context pack"),
        budgetTokens: z.number().int().min(200).optional().describe("Approximate token budget for the initial context pack"),
        agent: z.string().optional().describe("Agent name to record on the task"),
        contextPackId: z.string().optional().describe("Existing context pack id to attach instead of building a new one")
      }
    },
    safeHandler(async ({ goal, target, budgetTokens, agent, contextPackId }) => {
      return asToolText(await startMemoryTask(rootDir, { goal, target, budgetTokens, agent, contextPackId }));
    })
  );
  server.registerTool(
    "update_task",
    {
      description: "Append a note, decision, path, context pack, or status change to a SwarmVault task.",
      inputSchema: {
        id: z.string().min(1).describe("Task id"),
        note: z.string().optional().describe("Task note to append"),
        decision: z.string().optional().describe("Decision to append"),
        changedPath: z.string().optional().describe("Changed file or wiki path to attach"),
        contextPackId: z.string().optional().describe("Context pack id to attach"),
        sessionId: z.string().optional().describe("Session id to attach"),
        sourceId: z.string().optional().describe("Source id to attach"),
        pageId: z.string().optional().describe("Page id to attach"),
        nodeId: z.string().optional().describe("Graph node id to attach"),
        gitRef: z.string().optional().describe("Git ref to attach"),
        status: z.enum(["active", "blocked", "completed", "archived"]).optional().describe("Task status")
      }
    },
    safeHandler(async ({ id, ...options }) => {
      return asToolText(await updateMemoryTask(rootDir, id, options));
    })
  );
  server.registerTool(
    "finish_task",
    {
      description: "Finish a SwarmVault task with an outcome and optional follow-up.",
      inputSchema: {
        id: z.string().min(1).describe("Task id"),
        outcome: z.string().min(1).describe("Outcome to record"),
        followUp: z.string().optional().describe("Follow-up to preserve for the next agent")
      }
    },
    safeHandler(async ({ id, outcome, followUp }) => {
      return asToolText(await finishMemoryTask(rootDir, id, { outcome, followUp }));
    })
  );
  server.registerTool(
    "list_tasks",
    {
      description: "List saved SwarmVault agent tasks."
    },
    safeHandler(async () => {
      return asToolText(await listMemoryTasks(rootDir));
    })
  );
  server.registerTool(
    "read_task",
    {
      description: "Read a saved SwarmVault agent task by id.",
      inputSchema: {
        id: z.string().min(1).describe("Task id")
      }
    },
    safeHandler(async ({ id }) => {
      const task = await readMemoryTask(rootDir, id);
      if (!task) {
        return asToolError(`Task not found: ${id}`);
      }
      return asToolText(task);
    })
  );
  server.registerTool(
    "resume_task",
    {
      description: "Render a saved SwarmVault task as a next-agent handoff.",
      inputSchema: {
        id: z.string().min(1).describe("Task id"),
        format: z.enum(["markdown", "json", "llms"]).optional().describe("Rendered output format")
      }
    },
    safeHandler(async ({ id, format }) => {
      return asToolText(await resumeMemoryTask(rootDir, id, { format }));
    })
  );
  server.registerTool(
    "ingest_input",
    {
      description: "Ingest a local file path or URL into the SwarmVault workspace.",
      inputSchema: {
        input: z.string().min(1).describe("Local path or URL to ingest")
      }
    },
    safeHandler(async ({ input }) => {
      const result = await ingestInputDetailed(rootDir, input);
      return asToolText(result);
    })
  );
  server.registerTool(
    "compile_vault",
    {
      description: "Compile source manifests into wiki pages, graph data, and search index.",
      inputSchema: {
        approve: z.boolean().optional().describe("Stage a review bundle without applying active page changes"),
        maxTokens: z.number().int().min(1e3).optional().describe("Maximum token budget for wiki output")
      }
    },
    safeHandler(async ({ approve, maxTokens }) => {
      const result = await compileVault(rootDir, { approve: approve ?? false, maxTokens });
      return asToolText(result);
    })
  );
  server.registerTool(
    "lint_vault",
    {
      description: "Run anti-drift and vault health checks."
    },
    safeHandler(async () => {
      const findings = await lintVault(rootDir);
      return asToolText(findings);
    })
  );
  server.registerTool(
    "list_approvals",
    {
      description: "List staged approval bundles awaiting review."
    },
    safeHandler(async () => {
      const approvals = await listApprovals(rootDir);
      return asToolText(approvals);
    })
  );
  server.registerTool(
    "read_approval",
    {
      description: "Read the details and structured diffs for an approval bundle.",
      inputSchema: {
        approvalId: z.string().min(1).describe("Approval bundle id"),
        diff: z.boolean().optional().describe("Include the textual unified diff alongside the structured diff")
      }
    },
    safeHandler(async ({ approvalId, diff }) => {
      const result = await readApproval(rootDir, approvalId, { diff: diff ?? true });
      return asToolText(result);
    })
  );
  server.registerTool(
    "promote_candidate",
    {
      description: "Promote a staged candidate into its active concept or entity page.",
      inputSchema: {
        target: z.string().min(1).describe("Candidate page id or wiki/candidates path")
      }
    },
    safeHandler(async ({ target }) => {
      const result = await promoteCandidate(rootDir, target);
      return asToolText(result);
    })
  );
  server.registerTool(
    "archive_candidate",
    {
      description: "Archive a staged candidate without promoting it.",
      inputSchema: {
        target: z.string().min(1).describe("Candidate page id or wiki/candidates path")
      }
    },
    safeHandler(async ({ target }) => {
      const result = await archiveCandidate(rootDir, target);
      return asToolText(result);
    })
  );
  server.registerTool(
    "preview_candidate_scores",
    {
      description: "Score staged candidates against the configured auto-promotion rules without promoting."
    },
    safeHandler(async () => {
      const decisions = await previewCandidatePromotions(rootDir);
      return asToolText(decisions);
    })
  );
  server.registerTool(
    "auto_promote_candidates",
    {
      description: "Apply configured auto-promotion rules to staged candidates. Requires candidate.autoPromote.enabled in config.",
      inputSchema: {
        dryRun: z.boolean().optional().describe("Score candidates without moving files")
      }
    },
    safeHandler(async ({ dryRun }) => {
      const result = await runAutoPromotion(rootDir, { dryRun: dryRun ?? false });
      return asToolText(result);
    })
  );
  server.registerTool(
    "review_decision",
    {
      description: "Accept or reject approval bundle entries from a staged compile.",
      inputSchema: {
        approvalId: z.string().min(1).describe("Approval bundle id as reported by list_approvals or read_approval"),
        decision: z.enum(["accept", "reject"]).describe("Action to apply to the selected entries"),
        targets: z.array(z.string()).optional().describe("Specific entry page ids to act on (defaults to all pending)"),
        notes: z.string().optional().describe("Free-form reviewer notes, surfaced in the session log")
      }
    },
    safeHandler(async ({ approvalId, decision, targets, notes }) => {
      const apply = decision === "accept" ? acceptApproval : rejectApproval;
      const result = await apply(rootDir, approvalId, targets ?? []);
      return asToolText({ ...result, notes });
    })
  );
  server.registerTool(
    "watch_status",
    {
      description: "Return the current watch-mode status: watched repos, last run summary, and pending semantic refreshes."
    },
    safeHandler(async () => {
      const status = await getWatchStatus(rootDir);
      return asToolText(status);
    })
  );
  server.registerTool(
    "consolidate",
    {
      description: "Run the LLM Wiki v2 consolidation pass, rolling working-tier insight pages into episodic, semantic, and procedural tiers.",
      inputSchema: {
        dryRun: z.boolean().optional().describe("Return decisions without writing any files")
      }
    },
    safeHandler(async ({ dryRun }) => {
      const result = await consolidateVault(rootDir, { dryRun: dryRun ?? false });
      return asToolText(result);
    })
  );
  server.registerTool(
    "migrate",
    {
      description: "Detect the vault's version and preview the migration plan to the current SwarmVault version.",
      inputSchema: {
        target: z.string().optional().describe("Optional target version cap (migrations with toVersion above this are skipped)")
      }
    },
    safeHandler(async ({ target }) => {
      const plan = await runMigration(rootDir, { targetVersion: target, dryRun: true });
      return asToolText(plan);
    })
  );
  server.registerResource(
    "swarmvault-config",
    "swarmvault://config",
    {
      title: "SwarmVault Config",
      description: "The resolved SwarmVault config file.",
      mimeType: "application/json"
    },
    async () => {
      const { config } = await loadVaultConfig(rootDir);
      return asTextResource("swarmvault://config", JSON.stringify(config, null, 2));
    }
  );
  server.registerResource(
    "swarmvault-graph",
    "swarmvault://graph",
    {
      title: "SwarmVault Graph",
      description: "The compiled graph artifact for the current workspace.",
      mimeType: "application/json"
    },
    async () => {
      const { paths } = await loadVaultConfig(rootDir);
      const graph = await readJsonFile(paths.graphPath);
      return asTextResource(
        "swarmvault://graph",
        JSON.stringify(graph ?? { error: "Graph artifact not found. Run `swarmvault compile` first." }, null, 2)
      );
    }
  );
  server.registerResource(
    "swarmvault-manifests",
    "swarmvault://manifests",
    {
      title: "SwarmVault Manifests",
      description: "All source manifests in the workspace.",
      mimeType: "application/json"
    },
    async () => {
      const manifests = await listManifests(rootDir);
      return asTextResource("swarmvault://manifests", JSON.stringify(manifests, null, 2));
    }
  );
  server.registerResource(
    "swarmvault-schema",
    "swarmvault://schema",
    {
      title: "SwarmVault Schema",
      description: "The vault schema file that guides compile and query behavior.",
      mimeType: "text/markdown"
    },
    async () => {
      const schema = await loadVaultSchema(rootDir);
      return asTextResource("swarmvault://schema", schema.content);
    }
  );
  server.registerResource(
    "swarmvault-sessions",
    "swarmvault://sessions",
    {
      title: "SwarmVault Sessions",
      description: "Canonical session artifacts for compile, query, explore, lint, and watch runs.",
      mimeType: "application/json"
    },
    async () => {
      const { paths } = await loadVaultConfig(rootDir);
      const files = (await listFilesRecursive(paths.sessionsDir)).filter((filePath) => filePath.endsWith(".md")).map((filePath) => toPosix(path7.relative(paths.sessionsDir, filePath))).sort();
      return asTextResource("swarmvault://sessions", JSON.stringify(files, null, 2));
    }
  );
  server.registerResource(
    "swarmvault-context-packs",
    "swarmvault://context-packs",
    {
      title: "SwarmVault Context Packs",
      description: "Saved token-bounded context packs for agent tasks.",
      mimeType: "application/json"
    },
    async () => {
      return asTextResource("swarmvault://context-packs", JSON.stringify(await listContextPacks(rootDir), null, 2));
    }
  );
  server.registerResource(
    "swarmvault-memory-tasks",
    "swarmvault://memory-tasks",
    {
      title: "SwarmVault Agent Memory Tasks",
      description: "Saved git-backed agent memory task ledger entries.",
      mimeType: "application/json"
    },
    async () => {
      return asTextResource("swarmvault://memory-tasks", JSON.stringify(await listMemoryTasks(rootDir), null, 2));
    }
  );
  server.registerResource(
    "swarmvault-tasks",
    "swarmvault://tasks",
    {
      title: "SwarmVault Agent Tasks",
      description: "Saved git-backed agent task ledger entries.",
      mimeType: "application/json"
    },
    async () => {
      return asTextResource("swarmvault://tasks", JSON.stringify(await listMemoryTasks(rootDir), null, 2));
    }
  );
  server.registerResource(
    "swarmvault-pages",
    new ResourceTemplate("swarmvault://pages/{path}", {
      list: async () => {
        const pages = await listPages(rootDir);
        return {
          resources: pages.map((page) => ({
            uri: `swarmvault://pages/${encodeURIComponent(page.path)}`,
            name: page.title,
            title: page.title,
            description: `SwarmVault ${page.kind} page`,
            mimeType: "text/markdown"
          }))
        };
      }
    }),
    {
      title: "SwarmVault Pages",
      description: "Generated wiki pages exposed as MCP resources.",
      mimeType: "text/markdown"
    },
    async (_uri, variables) => {
      const encodedPath = typeof variables.path === "string" ? variables.path : "";
      const relativePath = decodeURIComponent(encodedPath);
      const page = await readPage(rootDir, relativePath);
      if (!page) {
        return asTextResource(`swarmvault://pages/${encodedPath}`, `Page not found: ${relativePath}`);
      }
      const { paths } = await loadVaultConfig(rootDir);
      const absolutePath = path7.resolve(paths.wikiDir, relativePath);
      return asTextResource(`swarmvault://pages/${encodedPath}`, await fs7.readFile(absolutePath, "utf8"));
    }
  );
  server.registerResource(
    "swarmvault-session-files",
    new ResourceTemplate("swarmvault://sessions/{path}", {
      list: async () => {
        const { paths } = await loadVaultConfig(rootDir);
        const files = (await listFilesRecursive(paths.sessionsDir)).filter((filePath) => filePath.endsWith(".md")).map((filePath) => toPosix(path7.relative(paths.sessionsDir, filePath))).sort();
        return {
          resources: files.map((relativePath) => ({
            uri: `swarmvault://sessions/${encodeURIComponent(relativePath)}`,
            name: path7.basename(relativePath, ".md"),
            title: relativePath,
            description: "SwarmVault session artifact",
            mimeType: "text/markdown"
          }))
        };
      }
    }),
    {
      title: "SwarmVault Session Files",
      description: "Session artifacts exposed as MCP resources.",
      mimeType: "text/markdown"
    },
    async (_uri, variables) => {
      const { paths } = await loadVaultConfig(rootDir);
      const encodedPath = typeof variables.path === "string" ? variables.path : "";
      const relativePath = decodeURIComponent(encodedPath);
      const absolutePath = path7.resolve(paths.sessionsDir, relativePath);
      if (!isPathWithin(paths.sessionsDir, absolutePath) || !await fileExists(absolutePath)) {
        return asTextResource(`swarmvault://sessions/${encodedPath}`, `Session not found: ${relativePath}`);
      }
      return asTextResource(`swarmvault://sessions/${encodedPath}`, await fs7.readFile(absolutePath, "utf8"));
    }
  );
  return server;
}
async function startMcpServer(rootDir, stdin, stdout) {
  const server = await createMcpServer(rootDir);
  const transport = new StdioServerTransport(stdin, stdout);
  await server.connect(transport);
  return {
    close: async () => {
      await server.close();
    }
  };
}
function asToolText(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}
function asToolError(message) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: message
      }
    ]
  };
}
function safeHandler(handler) {
  return async (args) => {
    try {
      return await handler(args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[swarmvault-mcp] tool handler failed: ${message}`);
      return asToolError(message);
    }
  };
}
function asTextResource(uri, text) {
  return {
    contents: [
      {
        uri,
        text
      }
    ]
  };
}

// src/providers/local-whisper-setup.ts
import { createWriteStream, constants as fsConstants } from "fs";
import fs8 from "fs/promises";
import os from "os";
import path8 from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
var BINARY_CANDIDATES = ["whisper-cli", "whisper-cpp", "whisper"];
var HUGGINGFACE_BASE = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main";
var LOCAL_WHISPER_MODEL_SIZES = Object.freeze({
  "tiny.en": "78 MB",
  tiny: "78 MB",
  "base.en": "147 MB",
  base: "147 MB",
  "small.en": "488 MB",
  small: "488 MB",
  "medium.en": "1.5 GB",
  medium: "1.5 GB",
  "large-v3": "3.1 GB",
  "large-v3-turbo": "1.6 GB"
});
async function discoverLocalWhisperBinary(options = {}) {
  const env = options.env ?? process.env;
  if (env.SWARMVAULT_WHISPER_BINARY) {
    return {
      binaryPath: env.SWARMVAULT_WHISPER_BINARY,
      candidates: [env.SWARMVAULT_WHISPER_BINARY],
      source: "env"
    };
  }
  const pathValue = env.PATH ?? "";
  const candidates = [];
  for (const dir of pathValue.split(path8.delimiter)) {
    if (!dir) continue;
    for (const name of BINARY_CANDIDATES) {
      const full = path8.join(dir, name);
      candidates.push(full);
      if (await isExecutable(full)) {
        return { binaryPath: full, candidates, source: "path" };
      }
    }
  }
  return { binaryPath: null, candidates, source: "not-found" };
}
function expectedModelPath(modelName, homeDir) {
  const home = homeDir ?? os.homedir();
  return path8.join(home, ".swarmvault", "models", `ggml-${modelName}.bin`);
}
function modelDownloadUrl(modelName) {
  return `${HUGGINGFACE_BASE}/ggml-${modelName}.bin`;
}
async function downloadWhisperModel(options) {
  const destPath = expectedModelPath(options.modelName, options.homeDir);
  await ensureDir(path8.dirname(destPath));
  const doFetch = options.fetchImpl ?? fetch;
  const url = modelDownloadUrl(options.modelName);
  const response = await doFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error(`Response body missing for ${url}`);
  }
  const totalHeader = response.headers.get("content-length");
  const totalBytes = totalHeader ? Number.parseInt(totalHeader, 10) : void 0;
  let downloadedBytes = 0;
  const webStream = response.body;
  const source = Readable.fromWeb(webStream);
  source.on("data", (chunk) => {
    downloadedBytes += chunk.length;
    options.onProgress?.({ downloadedBytes, totalBytes });
  });
  const tmpPath = `${destPath}.part`;
  await pipeline(source, createWriteStream(tmpPath));
  await fs8.rename(tmpPath, destPath);
  const stat = await fs8.stat(destPath);
  return { path: destPath, bytes: stat.size };
}
async function registerLocalWhisperProvider(options) {
  const { config, paths } = await loadVaultConfig(options.rootDir);
  const providerId = options.providerId ?? "local-whisper";
  const desired = buildProviderEntry(options);
  const existing = config.providers[providerId];
  const providerWasAdded = !existing;
  const providerWasUpdated = !providerWasAdded && !providerEntryMatches(existing, desired);
  const previousAudioProvider = config.tasks.audioProvider;
  const shouldSetAudio = options.setAsAudioProvider !== false && (options.setAsAudioProvider === true || !previousAudioProvider);
  const next = {
    ...config,
    providers: {
      ...config.providers,
      [providerId]: desired
    },
    tasks: {
      ...config.tasks,
      audioProvider: shouldSetAudio ? providerId : previousAudioProvider
    }
  };
  await writeJsonFile(paths.configPath, next);
  return {
    providerId,
    configPath: paths.configPath,
    providerWasAdded,
    providerWasUpdated,
    audioProviderSet: shouldSetAudio && previousAudioProvider !== providerId,
    previousAudioProvider
  };
}
function buildProviderEntry(options) {
  const entry = {
    type: "local-whisper",
    model: options.model
  };
  if (options.binaryPath) entry.binaryPath = options.binaryPath;
  if (options.modelPath) entry.modelPath = options.modelPath;
  if (options.threads !== void 0) entry.threads = options.threads;
  return entry;
}
function providerEntryMatches(existing, desired) {
  return existing.type === desired.type && existing.model === desired.model && existing.binaryPath === desired.binaryPath && existing.modelPath === desired.modelPath && existing.threads === desired.threads;
}
async function summarizeLocalWhisperSetup(options) {
  const discovery = await discoverLocalWhisperBinary({ env: options.env });
  const modelPath = expectedModelPath(options.modelName, options.homeDir);
  return {
    binary: {
      found: discovery.binaryPath !== null,
      path: discovery.binaryPath,
      source: discovery.source,
      installHint: 'Install whisper.cpp \u2014 macOS: "brew install whisper-cpp"; Debian/Ubuntu: "sudo apt install whisper.cpp" (or build from https://github.com/ggerganov/whisper.cpp).'
    },
    model: {
      name: options.modelName,
      expectedPath: modelPath,
      exists: await fileExists(modelPath),
      downloadUrl: modelDownloadUrl(options.modelName),
      approximateSize: LOCAL_WHISPER_MODEL_SIZES[options.modelName]
    }
  };
}
async function isExecutable(p) {
  try {
    await fs8.access(p, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

// src/providers/openai-compatible-capabilities.ts
var OPENAI_COMPATIBLE_CAPABILITY_MATRIX = Object.freeze({
  openai: {
    presetId: "openai",
    apiStyle: "responses",
    capabilities: ["responses", "chat", "structured", "tools", "vision", "embeddings", "streaming", "image_generation", "audio"],
    notes: "Reference implementation. Supports responses API, strict structured output, tool calling, vision, image generation, and Whisper transcription."
  },
  "openai-compatible": {
    presetId: "openai-compatible",
    apiStyle: "responses",
    capabilities: ["chat", "structured", "embeddings", "audio"],
    notes: "Generic fallback for self-hosted backends. Structured output adherence varies; verify capability flags per deployment."
  },
  openrouter: {
    presetId: "openrouter",
    apiStyle: "chat",
    capabilities: ["chat", "structured", "embeddings"],
    notes: "Router of upstream models. No responses API, no vision at the gateway level, structured output requires model-specific care."
  },
  groq: {
    presetId: "groq",
    apiStyle: "chat",
    capabilities: ["chat", "structured", "embeddings", "audio"],
    notes: "Fast chat completions, Whisper-compatible audio endpoint, no vision, no responses API."
  },
  together: {
    presetId: "together",
    apiStyle: "chat",
    capabilities: ["chat", "structured", "embeddings"],
    notes: "Chat completions with mixed structured-output reliability across hosted models. No vision or audio."
  },
  xai: {
    presetId: "xai",
    apiStyle: "chat",
    capabilities: ["chat", "structured", "embeddings"],
    notes: "Grok API. Chat and structured output; no vision or audio in the open surface."
  },
  cerebras: {
    presetId: "cerebras",
    apiStyle: "chat",
    capabilities: ["chat", "structured", "embeddings"],
    notes: "High-throughput inference. No vision, no audio, no image generation."
  },
  ollama: {
    presetId: "ollama",
    apiStyle: "chat",
    capabilities: ["chat", "structured", "tools", "vision", "embeddings", "streaming", "local", "audio"],
    notes: "Local-first. Capabilities depend on which models are installed; structured output is best-effort."
  }
});
function lookupPresetCapabilities(presetId) {
  return OPENAI_COMPATIBLE_CAPABILITY_MATRIX[presetId] ?? null;
}
async function withCapabilityFallback(provider, capability, run, fallback) {
  if (provider.capabilities.has(capability)) {
    return { supported: true, reason: null, value: await run() };
  }
  const fallbackValue = await fallback();
  return { supported: false, reason: "unsupported", value: fallbackValue };
}

// src/schedule.ts
import fs9 from "fs/promises";
import path9 from "path";
function scheduleStatePath(schedulesDir, jobId) {
  return path9.join(schedulesDir, `${encodeURIComponent(jobId)}.json`);
}
function scheduleLockPath(schedulesDir, jobId) {
  return path9.join(schedulesDir, `${encodeURIComponent(jobId)}.lock`);
}
function parseEveryDuration(value) {
  const match = value.trim().match(/^(\d+)(m|h|d)$/i);
  if (!match) {
    throw new Error(`Invalid schedule interval: ${value}`);
  }
  const amount = Number.parseInt(match[1] ?? "0", 10);
  const unit = (match[2] ?? "m").toLowerCase();
  if (unit === "m") {
    return amount * 6e4;
  }
  if (unit === "h") {
    return amount * 60 * 6e4;
  }
  return amount * 24 * 60 * 6e4;
}
function parseCronField(field, min, max) {
  if (field === "*") {
    return null;
  }
  const values = /* @__PURE__ */ new Set();
  for (const part of field.split(",")) {
    if (part.includes("/")) {
      const [base, stepRaw] = part.split("/");
      const step = Number.parseInt(stepRaw ?? "0", 10);
      if (!step || step < 1) {
        throw new Error(`Invalid cron step: ${field}`);
      }
      const [rangeStart, rangeEnd] = base === "*" || !base ? [min, max] : base.includes("-") ? base.split("-").map((item) => Number.parseInt(item, 10)) : [Number.parseInt(base, 10), max];
      for (let value2 = rangeStart ?? min; value2 <= (rangeEnd ?? max); value2 += step) {
        if (value2 >= min && value2 <= max) {
          values.add(value2);
        }
      }
      continue;
    }
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((item) => Number.parseInt(item, 10));
      for (let value2 = start ?? min; value2 <= (end ?? max); value2 += 1) {
        if (value2 >= min && value2 <= max) {
          values.add(value2);
        }
      }
      continue;
    }
    const value = Number.parseInt(part, 10);
    if (Number.isFinite(value) && value >= min && value <= max) {
      values.add(value);
    }
  }
  return values.size ? [...values].sort((left, right) => left - right) : [];
}
function matchesCron(value, cron) {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`Invalid cron expression: ${cron}`);
  }
  const [minute, hour, day, month, weekday] = fields;
  const constraints = [
    [parseCronField(minute ?? "*", 0, 59), value.getUTCMinutes()],
    [parseCronField(hour ?? "*", 0, 23), value.getUTCHours()],
    [parseCronField(day ?? "*", 1, 31), value.getUTCDate()],
    [parseCronField(month ?? "*", 1, 12), value.getUTCMonth() + 1],
    [parseCronField(weekday ?? "*", 0, 6), value.getUTCDay()]
  ];
  return constraints.every(([allowed, current]) => allowed === null || allowed.includes(current));
}
function nextCronRun(cron, from) {
  const cursor = new Date(from.getTime());
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  for (let index = 0; index < 60 * 24 * 366; index += 1) {
    if (matchesCron(cursor, cron)) {
      return cursor;
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }
  throw new Error(`Could not resolve next cron run for ${cron}`);
}
function nextRunAt(trigger, from, lastRunAt) {
  if (trigger.every) {
    const interval = parseEveryDuration(trigger.every);
    const base = lastRunAt ? new Date(lastRunAt) : from;
    return new Date(base.getTime() + interval).toISOString();
  }
  if (trigger.cron) {
    return nextCronRun(trigger.cron, from).toISOString();
  }
  return from.toISOString();
}
async function readScheduleState(rootDir, jobId) {
  const { paths } = await loadVaultConfig(rootDir);
  return readJsonFile(scheduleStatePath(paths.schedulesDir, jobId));
}
async function writeScheduleState(rootDir, state) {
  const { paths } = await loadVaultConfig(rootDir);
  await writeJsonFile(scheduleStatePath(paths.schedulesDir, state.jobId), state);
}
async function acquireJobLease(rootDir, jobId) {
  const { paths } = await loadVaultConfig(rootDir);
  const leasePath = scheduleLockPath(paths.schedulesDir, jobId);
  await ensureDir(paths.schedulesDir);
  const handle = await fs9.open(leasePath, "wx");
  await handle.writeFile(`${process.pid}
${(/* @__PURE__ */ new Date()).toISOString()}
`);
  await handle.close();
  return async () => {
    await fs9.rm(leasePath, { force: true });
  };
}
async function listSchedules(rootDir) {
  const { config } = await loadVaultConfig(rootDir);
  const now = /* @__PURE__ */ new Date();
  const jobs = Object.entries(config.schedules ?? {}).sort((left, right) => left[0].localeCompare(right[0]));
  const states = await Promise.all(
    jobs.map(async ([jobId, job]) => {
      const existing = await readScheduleState(rootDir, jobId);
      return {
        jobId,
        enabled: job.enabled !== false,
        taskType: job.task.type,
        nextRunAt: job.enabled === false ? void 0 : existing?.nextRunAt ?? nextRunAt(job.when, now, existing?.lastRunAt),
        lastRunAt: existing?.lastRunAt,
        lastStatus: existing?.lastStatus,
        lastSessionId: existing?.lastSessionId,
        lastApprovalId: existing?.lastApprovalId,
        error: existing?.error
      };
    })
  );
  return states;
}
async function runSchedule(rootDir, jobId) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const { config, paths } = await loadVaultConfig(rootDir);
  const job = config.schedules?.[jobId];
  if (!job) {
    throw new Error(`Schedule not found: ${jobId}`);
  }
  if (job.enabled === false) {
    throw new Error(`Schedule is disabled: ${jobId}`);
  }
  const releaseLease = await acquireJobLease(rootDir, jobId);
  let success = true;
  let error;
  let approvalId;
  try {
    if (job.task.type === "compile") {
      const result = await compileVault(rootDir, { approve: job.task.approve ?? true });
      approvalId = result.approvalId;
    } else if (job.task.type === "lint") {
      await lintVault(rootDir, { deep: job.task.deep ?? false, web: job.task.web ?? false });
    } else if (job.task.type === "query") {
      const result = await queryVault(rootDir, {
        question: job.task.question,
        save: job.task.save ?? true,
        format: job.task.format,
        review: (job.task.save ?? true) === true
      });
      approvalId = result.approvalId;
    } else if (job.task.type === "explore") {
      const result = await exploreVault(rootDir, {
        question: job.task.question,
        steps: job.task.steps,
        format: job.task.format,
        review: true
      });
      approvalId = result.approvalId;
    } else if (job.task.type === "consolidate") {
      await runConsolidation(rootDir, config.consolidation ?? {}, void 0, { dryRun: job.task.dryRun ?? false });
    }
  } catch (caught) {
    success = false;
    error = caught instanceof Error ? caught.message : String(caught);
  } finally {
    await releaseLease();
  }
  const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  const session = await recordSession(rootDir, {
    operation: "schedule",
    title: `Schedule ${jobId}`,
    startedAt,
    finishedAt,
    success,
    error,
    lines: [`job=${jobId}`, `task=${job.task.type}`, `approval=${approvalId ?? "none"}`]
  });
  const state = {
    jobId,
    enabled: true,
    taskType: job.task.type,
    nextRunAt: nextRunAt(job.when, new Date(finishedAt), finishedAt),
    lastRunAt: finishedAt,
    lastStatus: success ? "success" : "failed",
    lastSessionId: session.sessionId,
    lastApprovalId: approvalId,
    error
  };
  await writeScheduleState(rootDir, state);
  await appendJsonLine(paths.jobsLogPath, {
    kind: "schedule",
    jobId,
    taskType: job.task.type,
    startedAt,
    finishedAt,
    success,
    approvalId,
    error
  });
  return {
    jobId,
    taskType: job.task.type,
    startedAt,
    finishedAt,
    success,
    approvalId,
    error
  };
}
async function serveSchedules(rootDir, pollMs = 3e4) {
  let closed = false;
  let timer;
  let running = false;
  const tick = async () => {
    if (closed || running) {
      return;
    }
    running = true;
    try {
      let schedules = [];
      try {
        schedules = await listSchedules(rootDir);
      } catch (error) {
        console.error(`[swarmvault-schedule] failed to list schedules: ${error instanceof Error ? error.message : String(error)}`);
      }
      const due = schedules.filter((item) => item.enabled).filter((item) => !item.nextRunAt || Date.parse(item.nextRunAt) <= Date.now()).sort((left, right) => (left.nextRunAt ?? "").localeCompare(right.nextRunAt ?? ""));
      for (const schedule of due) {
        if (closed) {
          break;
        }
        try {
          await runSchedule(rootDir, schedule.jobId);
        } catch (error) {
          console.error(`[swarmvault-schedule] job ${schedule.jobId} crashed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } finally {
      running = false;
      if (!closed) {
        timer = setTimeout(() => void tick(), pollMs);
      }
    }
  };
  timer = setTimeout(() => void tick(), 10);
  return {
    close: async () => {
      closed = true;
      if (timer) {
        clearTimeout(timer);
      }
    }
  };
}

// src/sources.ts
import { spawn } from "child_process";
import fs10 from "fs/promises";
import path10 from "path";
import matter3 from "gray-matter";
import { JSDOM } from "jsdom";
var DEFAULT_CRAWL_MAX_PAGES = 12;
var DEFAULT_CRAWL_MAX_DEPTH = 2;
var DOCS_HINT_SEGMENTS = /* @__PURE__ */ new Set([
  "docs",
  "documentation",
  "wiki",
  "help",
  "reference",
  "references",
  "guide",
  "guides",
  "tutorial",
  "tutorials",
  "manual",
  "api",
  "apis",
  "getting-started"
]);
function uniqueStrings(values) {
  return uniqueBy(values.filter(Boolean), (value) => value);
}
function sourceOutputSchemaHash(schemas, projectIds) {
  if (!projectIds.length) {
    return schemas.effective.global.hash;
  }
  return composeVaultSchema(
    schemas.root,
    uniqueStrings([...projectIds].sort((left, right) => left.localeCompare(right))).map((projectId) => schemas.projects[projectId]).filter((schema) => Boolean(schema?.hash))
  ).hash;
}
function normalizeManagedStatus(value) {
  return value === "missing" || value === "error" ? value : "ready";
}
function emptyManagedSourceSyncCounts() {
  return {
    scannedCount: 0,
    importedCount: 0,
    updatedCount: 0,
    removedCount: 0,
    skippedCount: 0
  };
}
function withinRoot(rootPath, targetPath) {
  const relative = path10.relative(rootPath, targetPath);
  return relative === "" || !relative.startsWith("..") && !path10.isAbsolute(relative);
}
async function findNearestGitRoot2(startPath) {
  let current = path10.resolve(startPath);
  try {
    const stat = await fs10.stat(current);
    if (!stat.isDirectory()) {
      current = path10.dirname(current);
    }
  } catch {
    current = path10.dirname(current);
  }
  while (true) {
    if (await fileExists(path10.join(current, ".git"))) {
      return current;
    }
    const parent = path10.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}
function normalizeUrlWithoutHash(input) {
  const url = new URL(input);
  url.hash = "";
  if (url.protocol === "http:" && url.port === "80" || url.protocol === "https:" && url.port === "443") {
    url.port = "";
  }
  return url.toString();
}
function normalizeGitHubRepoRootUrl(input) {
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    return null;
  }
  const segments = parsed.pathname.split("/").map((segment) => segment.trim()).filter(Boolean);
  if (segments.length !== 2) {
    return null;
  }
  const [owner, repoSegment] = segments;
  const repo = repoSegment.replace(/\.git$/i, "");
  if (!owner || !repo) {
    return null;
  }
  const url = `https://github.com/${owner}/${repo}`;
  return {
    url,
    cloneUrl: `${url}.git`,
    title: `${owner}/${repo}`
  };
}
function looksLikeDocsPathname(pathname) {
  const segments = pathname.split("/").map((segment) => segment.trim().toLowerCase()).filter(Boolean);
  return segments.some((segment) => DOCS_HINT_SEGMENTS.has(segment));
}
function isLikelyDocsStartUrl(url) {
  return looksLikeDocsPathname(url.pathname) || url.hostname.toLowerCase().startsWith("docs.");
}
function normalizeCrawlCandidate(href, baseUrl) {
  try {
    const url = new URL(href, baseUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    if (url.hash) {
      url.hash = "";
    }
    return url.toString();
  } catch {
    return null;
  }
}
function pathPrefix(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "/";
  }
  return `/${segments[0]}`;
}
function isAllowedDocsCandidate(candidate, startUrl) {
  if (candidate.origin !== startUrl.origin) {
    return false;
  }
  const extension = path10.extname(candidate.pathname).toLowerCase();
  if (extension && extension !== ".html" && extension !== ".htm" && extension !== ".md") {
    return false;
  }
  if (looksLikeDocsPathname(candidate.pathname)) {
    return true;
  }
  const startPrefix = pathPrefix(startUrl.pathname);
  const candidatePrefix = pathPrefix(candidate.pathname);
  return startPrefix !== "/" && candidatePrefix === startPrefix;
}
async function fetchHtml(url) {
  await validateUrlSafety(url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "text/html";
  if (!contentType.includes("html")) {
    throw new Error(`Unsupported docs crawl content type at ${url}: ${contentType}`);
  }
  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;
  const title = document.title.trim() || url;
  const links = [...document.querySelectorAll("a[href]")].map((anchor) => normalizeCrawlCandidate(anchor.getAttribute("href") ?? "", url)).filter((value) => Boolean(value));
  return { title, links };
}
async function crawlDocsSource(url, maxPages, maxDepth) {
  const startUrl = new URL(normalizeUrlWithoutHash(url));
  const initial = await fetchHtml(startUrl.toString());
  const sameDomainDocsLinks = uniqueStrings(
    initial.links.filter((candidate) => {
      const parsed = new URL(candidate);
      return isAllowedDocsCandidate(parsed, startUrl);
    })
  );
  if (!isLikelyDocsStartUrl(startUrl) && sameDomainDocsLinks.length < 3) {
    throw new Error(
      "This URL does not look like a docs hub. Use `swarmvault add` for single articles or `swarmvault ingest` for direct files."
    );
  }
  const visited = /* @__PURE__ */ new Set();
  const queued = /* @__PURE__ */ new Set();
  const pages = [];
  const queue = [{ url: startUrl.toString(), depth: 0 }];
  queued.add(startUrl.toString());
  while (queue.length > 0 && pages.length < maxPages) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    if (visited.has(current.url)) {
      continue;
    }
    visited.add(current.url);
    pages.push(current.url);
    if (current.depth >= maxDepth) {
      continue;
    }
    const { links } = await fetchHtml(current.url);
    for (const candidate of links) {
      if (pages.length + queue.length >= maxPages) {
        break;
      }
      if (queued.has(candidate) || visited.has(candidate)) {
        continue;
      }
      const parsed = new URL(candidate);
      if (!isAllowedDocsCandidate(parsed, startUrl)) {
        continue;
      }
      queued.add(candidate);
      queue.push({ url: candidate, depth: current.depth + 1 });
    }
  }
  return {
    title: initial.title,
    pages
  };
}
function stableManagedSourceId(kind, raw, fallbackTitle) {
  return `${kind}-${slugify(fallbackTitle)}-${sha256(raw).slice(0, 8)}`;
}
function matchesManagedSourceSpec(existing, input) {
  if (existing.kind !== input.kind) {
    return false;
  }
  if (input.kind === "directory" || input.kind === "file") {
    return path10.resolve(existing.path ?? "") === path10.resolve(input.path);
  }
  return (existing.url ?? "") === input.url;
}
async function resolveManagedSourceInput(rootDir, input) {
  const absoluteInput = path10.resolve(rootDir, input);
  if (!(input.startsWith("http://") || input.startsWith("https://"))) {
    const stat = await fs10.stat(absoluteInput).catch(() => null);
    if (!stat) {
      throw new Error(`Source not found: ${input}`);
    }
    if (stat.isFile()) {
      return {
        kind: "file",
        path: absoluteInput,
        title: path10.basename(absoluteInput, path10.extname(absoluteInput)) || absoluteInput
      };
    }
    if (!stat.isDirectory()) {
      throw new Error("`swarmvault source add` supports local files, directories, public GitHub repo root URLs, and docs hubs.");
    }
    const detectedRepoRoot = await findNearestGitRoot2(absoluteInput);
    const repoRoot = detectedRepoRoot && !(withinRoot(rootDir, absoluteInput) && !withinRoot(rootDir, detectedRepoRoot)) ? detectedRepoRoot : absoluteInput;
    return {
      kind: "directory",
      path: absoluteInput,
      repoRoot,
      title: path10.basename(absoluteInput) || absoluteInput
    };
  }
  const github = normalizeGitHubRepoRootUrl(input);
  if (github) {
    return {
      kind: "github_repo",
      ...github
    };
  }
  const parsed = new URL(input);
  if (parsed.hostname.toLowerCase().includes("github.com")) {
    throw new Error(
      "`swarmvault source add` only supports public GitHub repo root URLs. Use a repo root like https://github.com/owner/repo."
    );
  }
  return {
    kind: "crawl_url",
    url: normalizeUrlWithoutHash(input),
    title: parsed.hostname
  };
}
function directorySourceIdsFor(manifests, inputPath) {
  return manifests.filter((manifest) => manifest.originalPath && withinRoot(path10.resolve(inputPath), path10.resolve(manifest.originalPath))).map((manifest) => manifest.sourceId).sort((left, right) => left.localeCompare(right));
}
function fileSourceIdsFor(manifests, inputPath) {
  const absoluteInput = path10.resolve(inputPath);
  return manifests.filter((manifest) => manifest.originalPath && path10.resolve(manifest.originalPath) === absoluteInput).map((manifest) => manifest.sourceId).sort((left, right) => left.localeCompare(right));
}
async function syncDirectorySource(rootDir, inputPath, repoRoot) {
  const manifestsBefore = await listManifests(rootDir);
  const previousInScope = manifestsBefore.filter(
    (manifest) => manifest.originalPath && withinRoot(path10.resolve(inputPath), path10.resolve(manifest.originalPath))
  );
  const result = await ingestDirectory(rootDir, inputPath, { repoRoot });
  const removed = [];
  for (const manifest of previousInScope) {
    if (!manifest.originalPath) {
      continue;
    }
    if (await fileExists(path10.resolve(manifest.originalPath))) {
      continue;
    }
    const removedManifest = await removeManifestBySourceId(rootDir, manifest.sourceId);
    if (removedManifest) {
      removed.push(removedManifest.sourceId);
    }
  }
  const manifestsAfter = await listManifests(rootDir);
  return {
    title: path10.basename(inputPath) || inputPath,
    sourceIds: directorySourceIdsFor(manifestsAfter, inputPath),
    counts: {
      scannedCount: result.scannedCount,
      importedCount: result.imported.length,
      updatedCount: result.updated.length,
      removedCount: removed.length,
      skippedCount: result.skipped.length
    },
    changed: result.imported.length + result.updated.length + removed.length > 0
  };
}
async function syncFileSource(rootDir, inputPath) {
  const result = await ingestInputDetailed(rootDir, inputPath);
  const manifestsAfter = await listManifests(rootDir);
  return {
    title: path10.basename(inputPath, path10.extname(inputPath)) || inputPath,
    sourceIds: fileSourceIdsFor(manifestsAfter, inputPath),
    counts: {
      scannedCount: result.scannedCount,
      importedCount: result.created.length,
      updatedCount: result.updated.length,
      removedCount: result.removed.length,
      skippedCount: result.skipped.length
    },
    changed: result.created.length + result.updated.length + result.removed.length > 0
  };
}
async function runGitCommand(cwd, args) {
  await new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `git ${args.join(" ")} failed with exit code ${code ?? 1}`));
    });
  });
}
async function syncGitHubRepoSource(rootDir, entry) {
  const workingDir = await managedSourceWorkingDir(rootDir, entry.id);
  const checkoutDir = path10.join(workingDir, "checkout");
  await fs10.rm(checkoutDir, { recursive: true, force: true });
  await ensureDir(workingDir);
  if (!entry.url) {
    throw new Error(`Managed source ${entry.id} is missing its repository URL.`);
  }
  const github = normalizeGitHubRepoRootUrl(entry.url);
  if (!github) {
    throw new Error(`Managed source ${entry.id} has an invalid GitHub repo URL.`);
  }
  await runGitCommand(workingDir, ["clone", "--depth", "1", github.cloneUrl, "checkout"]);
  return await syncDirectorySource(rootDir, checkoutDir, checkoutDir);
}
async function syncCrawlSource(rootDir, entry, options) {
  if (!entry.url) {
    throw new Error(`Managed source ${entry.id} is missing its URL.`);
  }
  const crawl = await crawlDocsSource(entry.url, options.maxPages ?? DEFAULT_CRAWL_MAX_PAGES, options.maxDepth ?? DEFAULT_CRAWL_MAX_DEPTH);
  const previousSourceIds = [...entry.sourceIds];
  const currentSourceIds = [];
  let importedCount = 0;
  let updatedCount = 0;
  for (const pageUrl of crawl.pages) {
    const persisted = await ingestInputDetailed(rootDir, pageUrl);
    currentSourceIds.push(...persisted.created.map((manifest) => manifest.sourceId));
    currentSourceIds.push(...persisted.updated.map((manifest) => manifest.sourceId));
    currentSourceIds.push(...persisted.unchanged.map((manifest) => manifest.sourceId));
    importedCount += persisted.created.length;
    updatedCount += persisted.updated.length;
  }
  let removedCount = 0;
  for (const sourceId of previousSourceIds) {
    if (currentSourceIds.includes(sourceId)) {
      continue;
    }
    if (await removeManifestBySourceId(rootDir, sourceId)) {
      removedCount += 1;
    }
  }
  return {
    title: crawl.title,
    sourceIds: uniqueStrings(currentSourceIds).sort((left, right) => left.localeCompare(right)),
    counts: {
      scannedCount: crawl.pages.length,
      importedCount,
      updatedCount,
      removedCount,
      skippedCount: 0
    },
    changed: importedCount + updatedCount + removedCount > 0
  };
}
async function syncManagedSource(rootDir, entry, options) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  try {
    let sync;
    if (entry.kind === "directory") {
      if (!entry.path || !entry.repoRoot) {
        throw new Error(`Managed source ${entry.id} is missing its directory path.`);
      }
      if (!await fileExists(entry.path)) {
        return {
          ...entry,
          status: "missing",
          updatedAt: now,
          lastSyncAt: now,
          lastSyncStatus: "error",
          lastSyncCounts: emptyManagedSourceSyncCounts(),
          lastError: `Directory not found: ${entry.path}`,
          changed: false
        };
      }
      sync = await syncDirectorySource(rootDir, entry.path, entry.repoRoot);
    } else if (entry.kind === "file") {
      if (!entry.path) {
        throw new Error(`Managed source ${entry.id} is missing its file path.`);
      }
      if (!await fileExists(entry.path)) {
        return {
          ...entry,
          status: "missing",
          updatedAt: now,
          lastSyncAt: now,
          lastSyncStatus: "error",
          lastSyncCounts: emptyManagedSourceSyncCounts(),
          lastError: `File not found: ${entry.path}`,
          changed: false
        };
      }
      sync = await syncFileSource(rootDir, entry.path);
    } else if (entry.kind === "github_repo") {
      sync = await syncGitHubRepoSource(rootDir, entry);
    } else {
      sync = await syncCrawlSource(rootDir, entry, options);
    }
    return {
      ...entry,
      title: sync.title || entry.title,
      sourceIds: sync.sourceIds,
      status: "ready",
      updatedAt: now,
      lastSyncAt: now,
      lastSyncStatus: "success",
      lastSyncCounts: sync.counts,
      lastError: void 0,
      changed: sync.changed
    };
  } catch (error) {
    return {
      ...entry,
      status: normalizeManagedStatus(entry.status),
      updatedAt: now,
      lastSyncAt: now,
      lastSyncStatus: "error",
      lastSyncCounts: emptyManagedSourceSyncCounts(),
      lastError: error instanceof Error ? error.message : String(error),
      changed: false
    };
  }
}
function scopedSourcePages(graph, sourceIds) {
  const scopedSet = new Set(sourceIds);
  return graph.pages.filter((page) => page.sourceIds.some((sourceId) => scopedSet.has(sourceId)));
}
function scopedNodeIds(graph, sourceIds) {
  const scopedSet = new Set(sourceIds);
  return graph.nodes.filter((node) => node.sourceIds.some((sourceId) => scopedSet.has(sourceId))).map((node) => node.id);
}
async function loadSourceAnalyses(rootDir, sourceIds) {
  const { paths } = await loadVaultConfig(rootDir);
  const analyses = await Promise.all(
    sourceIds.map(async (sourceId) => await readJsonFile(path10.join(paths.analysesDir, `${sourceId}.json`)))
  );
  return analyses.filter((analysis) => Boolean(analysis?.sourceId));
}
function renderDeterministicSourceBrief(input) {
  const modulePages = input.sourcePages.filter((page) => page.kind === "module").slice(0, 6);
  const sourcePages = input.sourcePages.filter((page) => page.kind === "source").slice(0, 6);
  const conceptPages = input.sourcePages.filter((page) => page.kind === "concept").slice(0, 6);
  const entityPages = input.sourcePages.filter((page) => page.kind === "entity").slice(0, 6);
  const questions = uniqueStrings(input.analyses.flatMap((analysis) => analysis.questions)).slice(0, 5);
  const summary = truncate(
    normalizeWhitespace(
      uniqueStrings(input.analyses.map((analysis) => analysis.summary).filter(Boolean)).join(" ") || `${input.source.title} has been compiled into a local source graph.`
    ),
    320
  );
  const scopedNodeIdSet = new Set(scopedNodeIds(input.graph, input.source.sourceIds));
  const surprises = input.report?.surprisingConnections.filter((connection) => scopedNodeIdSet.has(connection.sourceNodeId) || scopedNodeIdSet.has(connection.targetNodeId)).slice(0, 4) ?? [];
  const contradictions = input.report?.contradictions.filter(
    (contradiction) => input.source.sourceIds.includes(contradiction.sourceIdA) || input.source.sourceIds.includes(contradiction.sourceIdB)
  ) ?? [];
  return [
    `# Source Brief: ${input.source.title}`,
    "",
    "## What This Source Is",
    "",
    summary,
    "",
    "## Read First",
    "",
    ...sourcePages.length ? sourcePages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No source page links are available yet."],
    "",
    "## Core Pages",
    "",
    ...modulePages.length ? modulePages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No module pages are available yet."],
    ...conceptPages.length ? ["", "Concept pages:", ...conceptPages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`)] : [],
    ...entityPages.length ? ["", "Entity pages:", ...entityPages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`)] : [],
    "",
    "## How The Important Parts Fit Together",
    "",
    `- Compiled source pages: ${sourcePages.length}`,
    `- Module pages: ${modulePages.length}`,
    `- Graph nodes touching this source: ${scopedNodeIdSet.size}`,
    `- Current tracked source ids: ${input.source.sourceIds.length}`,
    "",
    "## Surprises",
    "",
    ...surprises.length ? surprises.map((surprise) => `- ${surprise.explanation}`) : ["- No surprising cross-source connections were highlighted for this source yet."],
    "",
    "## Contradictions",
    "",
    ...contradictions.length ? contradictions.map(
      (contradiction) => `- ${contradiction.claimA} / ${contradiction.claimB} (sources: ${contradiction.sourceIdA}, ${contradiction.sourceIdB})`
    ) : ["- No contradictions were detected for this source."],
    "",
    "## Open Questions",
    "",
    ...questions.length ? questions.map((question) => `- ${question}`) : ["- No extracted open questions yet."],
    "",
    "## Suggested Next Questions",
    "",
    ...(input.report?.suggestedQuestions ?? []).slice(0, 5).map((question) => `- ${question}`) || [
      "- Ask `swarmvault query` about the main modules or sections in this source."
    ],
    ""
  ].join("\n");
}
async function generateSourceBriefMarkdownForScope(rootDir, source) {
  const { paths } = await loadVaultConfig(rootDir);
  const graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    return null;
  }
  const sourcePages = scopedSourcePages(graph, source.sourceIds);
  const analyses = await loadSourceAnalyses(rootDir, source.sourceIds);
  const report = await readGraphReport(rootDir);
  const fallback = renderDeterministicSourceBrief({
    source,
    sourcePages,
    graph,
    analyses,
    report
  });
  const provider = await getProviderForTask(rootDir, "queryProvider");
  if (provider.type === "heuristic") {
    return fallback;
  }
  try {
    const schemas = await loadVaultSchemas(rootDir);
    const pageContext = sourcePages.slice(0, 10).map((page) => `- ${page.title} (${page.kind}) -> ${page.path}`).join("\n");
    const analysisContext = analyses.slice(0, 6).map(
      (analysis) => `# ${analysis.title}
Summary: ${analysis.summary}
Questions: ${analysis.questions.join(" | ") || "none"}
Concepts: ${analysis.concepts.map((concept) => concept.name).join(", ") || "none"}
Entities: ${analysis.entities.map((entity) => entity.name).join(", ") || "none"}`
    ).join("\n\n---\n\n");
    const response = await provider.generateText({
      system: buildSchemaPrompt(
        schemas.effective.global,
        "Write a concise markdown source brief with sections: What This Source Is, Read First, Core Pages, How The Important Parts Fit Together, Surprises, Contradictions, Open Questions, Suggested Next Questions. Ground every claim in the provided context."
      ),
      prompt: [
        `Source title: ${source.title}`,
        `Source kind: ${source.kind ?? "source"}`,
        `Tracked source ids: ${source.sourceIds.join(", ") || "none"}`,
        "",
        "Pages:",
        pageContext || "- none",
        "",
        "Analyses:",
        analysisContext || "No analysis context available.",
        "",
        "Deterministic fallback draft:",
        fallback
      ].join("\n")
    });
    return response.text?.trim() ? response.text.trim() : fallback;
  } catch {
    return fallback;
  }
}
async function writeSourceBriefForScope(rootDir, source) {
  if (!source.sourceIds.length) {
    return null;
  }
  const { paths } = await loadVaultConfig(rootDir);
  const markdown = await generateSourceBriefMarkdownForScope(rootDir, source);
  if (!markdown) {
    return null;
  }
  const graph = await readJsonFile(paths.graphPath);
  const schemas = await loadVaultSchemas(rootDir);
  const relatedPages = graph ? scopedSourcePages(graph, source.sourceIds) : [];
  const relatedPageIds = relatedPages.slice(0, 12).map((page) => page.id);
  const relatedNodeIds = graph ? scopedNodeIds(graph, source.sourceIds).slice(0, 20) : [];
  const projectIds = uniqueStrings(relatedPages.flatMap((page) => page.projectIds));
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const output = buildOutputPage({
    title: `Source Brief: ${source.title}`,
    question: `Brief ${source.title}`,
    answer: markdown,
    citations: source.sourceIds,
    schemaHash: sourceOutputSchemaHash(schemas, projectIds),
    outputFormat: "report",
    relatedPageIds,
    relatedNodeIds,
    relatedSourceIds: source.sourceIds,
    projectIds,
    extraTags: ["source-brief"],
    origin: "source_brief",
    slug: `source-briefs/${source.id}`,
    metadata: {
      status: "active",
      createdAt: now,
      updatedAt: now,
      compiledFrom: source.sourceIds,
      managedBy: "system",
      confidence: 0.82
    }
  });
  const absolutePath = path10.join(paths.wikiDir, output.page.path);
  await ensureDir(path10.dirname(absolutePath));
  await fs10.writeFile(absolutePath, output.content, "utf8");
  return absolutePath;
}
async function writeSourceBrief(rootDir, source) {
  return await writeSourceBriefForScope(rootDir, scopeFromManagedSource(source));
}
async function generateBriefsForSources(rootDir, sources) {
  const briefPaths = /* @__PURE__ */ new Map();
  for (const source of sources) {
    const briefPath = await writeSourceBrief(rootDir, source);
    if (briefPath) {
      briefPaths.set(source.id, briefPath);
    }
  }
  if (briefPaths.size > 0) {
    await refreshVaultAfterOutputSave(rootDir);
  }
  return briefPaths;
}
var GUIDED_SESSION_QUESTIONS = [
  {
    id: "importance",
    prompt: "What matters most from this source for your wiki right now?"
  },
  {
    id: "exclude",
    prompt: "What should stay provisional, be ignored, or be kept out for now?"
  },
  {
    id: "targets",
    prompt: "Which canonical pages or topics should this source update?"
  },
  {
    id: "conflicts",
    prompt: "What feels new, reinforcing, or conflicting compared with what you already believe?"
  },
  {
    id: "followups",
    prompt: "What follow-up questions or next sources should stay open?"
  }
];
function defaultGuidedSessionQuestions() {
  return GUIDED_SESSION_QUESTIONS.map((question) => ({ ...question }));
}
function splitDelimitedDetail(value) {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}
function normalizeGuidedAnswerValue(value) {
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function normalizeGuidedAnswers(input) {
  if (!input) {
    return {};
  }
  if (Array.isArray(input)) {
    return Object.fromEntries(
      GUIDED_SESSION_QUESTIONS.map((question, index) => [question.id, normalizeGuidedAnswerValue(input[index])]).filter(
        (entry) => Boolean(entry[1])
      )
    );
  }
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, normalizeGuidedAnswerValue(value)]).filter((entry) => Boolean(entry[1]))
  );
}
function mergeGuidedSessionQuestions(questions, answers) {
  const normalizedAnswers = normalizeGuidedAnswers(answers);
  return questions.map((question) => ({
    ...question,
    answer: normalizedAnswers[question.id] ?? question.answer
  }));
}
function answeredGuidedSessionQuestions(questions) {
  return questions.filter((question) => typeof question.answer === "string" && question.answer.trim().length > 0);
}
function questionStateForSession(session) {
  return answeredGuidedSessionQuestions(session.questions).length === session.questions.length ? "answered" : "awaiting_input";
}
function manifestsForScope(graph, scope) {
  if (!graph) {
    return [];
  }
  const scopeSet = new Set(scope.sourceIds);
  return graph.sources.filter((manifest) => scopeSet.has(manifest.sourceId));
}
function scopeSourceType(scope, manifests) {
  return scope.kind ?? manifests[0]?.sourceKind ?? manifests[0]?.sourceType;
}
function scopeOccurredAt(manifests) {
  return manifests.map((manifest) => manifest.details?.occurred_at).filter((value) => typeof value === "string" && value.trim().length > 0).sort((left, right) => right.localeCompare(left))[0];
}
function scopeParticipants(manifests) {
  return uniqueStrings(manifests.flatMap((manifest) => splitDelimitedDetail(manifest.details?.participants)));
}
function scopeContainerTitle(manifests) {
  return manifests.find((manifest) => manifest.details?.container_title)?.details?.container_title ?? manifests[0]?.sourceGroupTitle;
}
function scopeConversationId(manifests) {
  return manifests.find((manifest) => manifest.details?.conversation_id)?.details?.conversation_id;
}
function classifyGuidedEvidenceState(scope, targetPage, contradictions) {
  if (contradictions.length) {
    return "conflicting";
  }
  if (!targetPage) {
    return "needs_judgment";
  }
  return targetPage.sourceIds.some((sourceId) => !scope.sourceIds.includes(sourceId)) ? "reinforcing" : "new";
}
function renderDeterministicSourceReview(input) {
  const canonicalPages = input.sourcePages.filter((page) => page.kind === "source" || page.kind === "concept" || page.kind === "entity").slice(0, 10);
  const modulePages = input.sourcePages.filter((page) => page.kind === "module").slice(0, 8);
  const questions = uniqueStrings(input.analyses.flatMap((analysis) => analysis.questions)).slice(0, 8);
  const concepts = uniqueStrings(input.analyses.flatMap((analysis) => analysis.concepts.map((concept) => concept.name))).slice(0, 8);
  const entities = uniqueStrings(input.analyses.flatMap((analysis) => analysis.entities.map((entity) => entity.name))).slice(0, 8);
  const contradictions = input.report?.contradictions.filter(
    (contradiction) => input.scope.sourceIds.includes(contradiction.sourceIdA) || input.scope.sourceIds.includes(contradiction.sourceIdB)
  ) ?? [];
  return [
    `# Source Review: ${input.scope.title}`,
    "",
    "## What This Source Contains",
    "",
    ...input.analyses.length ? input.analyses.map((analysis) => `- ${analysis.title}: ${analysis.summary}`) : ["- This source has not been analyzed yet. Compile the vault before trusting downstream pages."],
    "",
    "## Likely Canonical Pages To Update",
    "",
    ...canonicalPages.length ? canonicalPages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No canonical source, concept, or entity pages are linked to this source yet."],
    "",
    "## Important Topics And Entities",
    "",
    ...concepts.length ? [`Concepts: ${concepts.join(", ")}`] : ["Concepts: none detected."],
    ...entities.length ? [`Entities: ${entities.join(", ")}`] : ["Entities: none detected."],
    ...modulePages.length ? ["", ...modulePages.map((page) => `- Module: [[${page.path.replace(/\.md$/, "")}|${page.title}]]`)] : [],
    "",
    "## Contradictions To Inspect",
    "",
    ...contradictions.length ? contradictions.map((contradiction) => `- ${contradiction.claimA} / ${contradiction.claimB}`) : ["- No contradictions are currently flagged for this source scope."],
    "",
    "## Open Questions",
    "",
    ...questions.length ? questions.map((question) => `- ${question}`) : ["- No extracted open questions yet."],
    "",
    "## Suggested Next Steps",
    "",
    ...canonicalPages.length ? canonicalPages.slice(0, 5).map((page) => `- Review [[${page.path.replace(/\.md$/, "")}|${page.title}]] for canonical updates.`) : ["- Review the source page and decide which canonical pages should exist."],
    ""
  ].join("\n");
}
async function generateSourceReviewMarkdown(rootDir, scope) {
  const { paths } = await loadVaultConfig(rootDir);
  let graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    await compileVault(rootDir, {});
    graph = await readJsonFile(paths.graphPath);
  }
  if (!graph) {
    return null;
  }
  const sourcePages = scopedSourcePages(graph, scope.sourceIds);
  const analyses = await loadSourceAnalyses(rootDir, scope.sourceIds);
  const report = await readGraphReport(rootDir);
  const fallback = renderDeterministicSourceReview({
    scope,
    sourcePages,
    graph,
    analyses,
    report
  });
  const provider = await getProviderForTask(rootDir, "queryProvider");
  if (provider.type === "heuristic") {
    return fallback;
  }
  try {
    const schemas = await loadVaultSchemas(rootDir);
    const pageContext = sourcePages.slice(0, 12).map((page) => `- ${page.title} (${page.kind}) -> ${page.path}`).join("\n");
    const analysisContext = analyses.slice(0, 8).map(
      (analysis) => `# ${analysis.title}
Summary: ${analysis.summary}
Questions: ${analysis.questions.join(" | ") || "none"}
Concepts: ${analysis.concepts.map((concept) => concept.name).join(", ") || "none"}
Entities: ${analysis.entities.map((entity) => entity.name).join(", ") || "none"}`
    ).join("\n\n---\n\n");
    const response = await provider.generateText({
      system: buildSchemaPrompt(
        schemas.effective.global,
        "Write a concise markdown source review with sections: What This Source Contains, Likely Canonical Pages To Update, Important Topics And Entities, Contradictions To Inspect, Open Questions, Suggested Next Steps. Focus on helping a human decide what to keep, update, or question in the wiki."
      ),
      prompt: [
        `Source scope: ${scope.title}`,
        `Scope id: ${scope.id}`,
        `Tracked source ids: ${scope.sourceIds.join(", ") || "none"}`,
        "",
        "Pages:",
        pageContext || "- none",
        "",
        "Analyses:",
        analysisContext || "No analysis context available.",
        "",
        "Deterministic fallback draft:",
        fallback
      ].join("\n")
    });
    return response.text?.trim() ? response.text.trim() : fallback;
  } catch {
    return fallback;
  }
}
async function buildSourceReviewStagedPage(rootDir, scope) {
  const { config, paths } = await loadVaultConfig(rootDir);
  const markdown = await generateSourceReviewMarkdown(rootDir, scope);
  if (!markdown) {
    throw new Error(`Could not generate a source review for ${scope.id}.`);
  }
  const graph = await readJsonFile(paths.graphPath);
  const schemas = await loadVaultSchemas(rootDir);
  const scopeManifests = manifestsForScope(graph, scope);
  const relatedPages = graph ? scopedSourcePages(graph, scope.sourceIds) : [];
  const relatedPageIds = relatedPages.slice(0, 16).map((page) => page.id);
  const relatedNodeIds = graph ? scopedNodeIds(graph, scope.sourceIds).slice(0, 24) : [];
  const projectIds = uniqueStrings(relatedPages.flatMap((page) => page.projectIds));
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const output = buildOutputPage({
    title: `Source Review: ${scope.title}`,
    question: `Review ${scope.title}`,
    answer: markdown,
    citations: scope.sourceIds,
    schemaHash: sourceOutputSchemaHash(schemas, projectIds),
    outputFormat: "report",
    relatedPageIds,
    relatedNodeIds,
    relatedSourceIds: scope.sourceIds,
    projectIds,
    extraTags: ["source-review"],
    origin: "source_review",
    slug: `source-reviews/${scope.id}`,
    metadata: {
      status: "draft",
      createdAt: now,
      updatedAt: now,
      compiledFrom: scope.sourceIds,
      managedBy: "system",
      confidence: 0.79
    },
    frontmatter: {
      profile_presets: config.profile.presets,
      source_type: scopeSourceType(scope, scopeManifests),
      occurred_at: scopeOccurredAt(scopeManifests),
      participants: scopeParticipants(scopeManifests),
      container_title: scopeContainerTitle(scopeManifests),
      conversation_id: scopeConversationId(scopeManifests),
      question_state: "answered",
      canonical_targets: relatedPages.filter((page) => page.kind === "source" || page.kind === "concept" || page.kind === "entity").slice(0, 8).map((page) => page.path),
      evidence_state: findContradictionsForScope(scope, await readGraphReport(rootDir)).length ? "conflicting" : "needs_judgment"
    }
  });
  return { page: output.page, content: output.content };
}
function classifySourceGuidePageBuckets(sourcePages, scopeSourceIds) {
  const scopeSet = new Set(scopeSourceIds);
  const canonicalPages = sourcePages.filter(
    (page) => (page.kind === "source" || page.kind === "concept" || page.kind === "entity") && (page.kind === "source" || page.status !== "candidate")
  ).slice(0, 12);
  const newPages = canonicalPages.filter((page) => page.sourceIds.every((sourceId) => scopeSet.has(sourceId))).slice(0, 6);
  const reinforcingPages = canonicalPages.filter((page) => page.sourceIds.some((sourceId) => !scopeSet.has(sourceId))).slice(0, 6);
  return { canonicalPages, newPages, reinforcingPages };
}
function findContradictionsForScope(scope, report) {
  return report?.contradictions.filter(
    (contradiction) => scope.sourceIds.includes(contradiction.sourceIdA) || scope.sourceIds.includes(contradiction.sourceIdB)
  ) ?? [];
}
function selectGuidedTargetPages(scope, sourcePages, questions) {
  const { canonicalPages } = classifySourceGuidePageBuckets(sourcePages, scope.sourceIds);
  if (!canonicalPages.length) {
    return [];
  }
  const desiredTargets = normalizeWhitespace(
    questions.find((question) => question.id === "targets")?.answer ?? questions.find((question) => question.id === "importance")?.answer ?? ""
  ).toLowerCase();
  const matchedTargets = desiredTargets ? canonicalPages.filter((page) => {
    const title = page.title.toLowerCase();
    const relative = page.path.replace(/\.md$/, "").toLowerCase();
    return desiredTargets.includes(title) || desiredTargets.includes(relative) || title.includes(desiredTargets);
  }) : [];
  return (matchedTargets.length ? matchedTargets : canonicalPages).slice(0, 6);
}
function insightRelativePathForTarget(page, scope) {
  const basename = path10.basename(page.path);
  if (page.kind === "concept") {
    return `insights/concepts/${basename}`;
  }
  if (page.kind === "entity") {
    return `insights/entities/${basename}`;
  }
  if (page.kind === "source") {
    return `insights/sources/${slugify(page.title || scope.title)}.md`;
  }
  return `insights/topics/${slugify(page.title || scope.title)}.md`;
}
function insightTitleForTarget(page, scope) {
  if (page.kind === "concept" || page.kind === "entity") {
    return page.title;
  }
  if (page.kind === "source") {
    return `Source Notes: ${page.title}`;
  }
  return `${scope.title} Notes`;
}
function insightTagsForTarget(page) {
  return uniqueStrings(["insight", "guided-session", `guided/${page?.kind ?? "topic"}`]);
}
function guidedUpdateMarker(scopeId) {
  return {
    start: `<!-- swarmvault-guided-source:${scopeId}:start -->`,
    end: `<!-- swarmvault-guided-source:${scopeId}:end -->`
  };
}
function replaceMarkedSection(content, scopeId, replacement) {
  const marker = guidedUpdateMarker(scopeId);
  const block = `${marker.start}
${replacement.trim()}
${marker.end}`;
  const startIndex = content.indexOf(marker.start);
  const endIndex = content.indexOf(marker.end);
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return `${content.slice(0, startIndex).trimEnd()}

${block}
`;
  }
  return `${content.trimEnd()}

${block}
`;
}
function renderDeterministicSourceGuide(input) {
  const { canonicalPages, newPages, reinforcingPages } = classifySourceGuidePageBuckets(input.sourcePages, input.scope.sourceIds);
  const modulePages = input.sourcePages.filter((page) => page.kind === "module").slice(0, 6);
  const takeaways = uniqueStrings(
    input.analyses.flatMap((analysis) => [
      analysis.summary,
      ...analysis.concepts.map((concept) => concept.description),
      ...analysis.entities.map((entity) => entity.description)
    ]).filter(Boolean).map((value) => normalizeWhitespace(value))
  ).slice(0, 7).map((value) => truncate(value, 180));
  const questions = uniqueStrings(input.analyses.flatMap((analysis) => analysis.questions)).slice(0, 6);
  const contradictions = input.report?.contradictions.filter(
    (contradiction) => input.scope.sourceIds.includes(contradiction.sourceIdA) || input.scope.sourceIds.includes(contradiction.sourceIdB)
  ) ?? [];
  return [
    `# Source Guide: ${input.scope.title}`,
    "",
    "## What This Source Is",
    "",
    takeaways.length ? takeaways[0] : `${input.scope.title} has been compiled into the vault and is ready for guided review.`,
    "",
    "## Key Takeaways",
    "",
    ...takeaways.length ? takeaways.map((takeaway) => `- ${takeaway}`) : ["- No takeaways are available until the source is compiled."],
    "",
    "## Proposed Canonical Pages To Update",
    "",
    ...canonicalPages.length ? canonicalPages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No likely canonical pages were identified yet."],
    "",
    "## New, Reinforcing, And Conflicting Claims",
    "",
    ...newPages.length ? ["New or source-local pages:", ...newPages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`), ""] : [],
    ...reinforcingPages.length ? ["Reinforcing existing pages:", ...reinforcingPages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`), ""] : [],
    ...contradictions.length ? ["Conflicts to judge:", ...contradictions.map((contradiction) => `- ${contradiction.claimA} / ${contradiction.claimB}`), ""] : ["Conflicts to judge:", "- No contradictions are currently flagged for this source scope.", ""],
    "## What Should Probably Stay Out For Now",
    "",
    ...modulePages.length ? ["- Avoid promoting narrow implementation details unless they matter to your thesis or recurring questions."] : ["- Avoid promoting incidental details that are not yet supported by multiple sources or clear research goals."],
    ...contradictions.length ? ["- Keep contested claims provisional until you review the conflicting evidence side by side."] : [],
    "",
    "## Needs Human Judgment",
    "",
    ...questions.length ? questions.map((question) => `- ${question}`) : ["- Decide which proposed canonical pages deserve durable summary updates."],
    "",
    "## Suggested Follow-up Questions",
    "",
    ...questions.length ? questions.map((question) => `- ${question}`) : ["- What changed in your understanding after reading this source?"],
    ""
  ].join("\n");
}
async function generateSourceGuideMarkdown(rootDir, scope) {
  const { paths } = await loadVaultConfig(rootDir);
  let graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    await compileVault(rootDir, {});
    graph = await readJsonFile(paths.graphPath);
  }
  if (!graph) {
    return null;
  }
  const sourcePages = scopedSourcePages(graph, scope.sourceIds);
  const analyses = await loadSourceAnalyses(rootDir, scope.sourceIds);
  const report = await readGraphReport(rootDir);
  const fallback = renderDeterministicSourceGuide({
    scope,
    sourcePages,
    analyses,
    report
  });
  const provider = await getProviderForTask(rootDir, "queryProvider");
  if (provider.type === "heuristic") {
    return fallback;
  }
  try {
    const schemas = await loadVaultSchemas(rootDir);
    const { canonicalPages, newPages, reinforcingPages } = classifySourceGuidePageBuckets(sourcePages, scope.sourceIds);
    const pageContext = sourcePages.slice(0, 12).map((page) => `- ${page.title} (${page.kind}) -> ${page.path}`).join("\n");
    const analysisContext = analyses.slice(0, 8).map(
      (analysis) => `# ${analysis.title}
Summary: ${analysis.summary}
Questions: ${analysis.questions.join(" | ") || "none"}
Concepts: ${analysis.concepts.map((concept) => concept.name).join(", ") || "none"}
Entities: ${analysis.entities.map((entity) => entity.name).join(", ") || "none"}`
    ).join("\n\n---\n\n");
    const response = await provider.generateText({
      system: buildSchemaPrompt(
        schemas.effective.global,
        "Write a concise markdown source guide with sections: What This Source Is, Key Takeaways, Proposed Canonical Pages To Update, New Reinforcing And Conflicting Claims, What Should Probably Stay Out For Now, Needs Human Judgment, Suggested Follow-up Questions. Focus on helping a human integrate one source into an evolving research wiki."
      ),
      prompt: [
        `Source scope: ${scope.title}`,
        `Scope id: ${scope.id}`,
        `Tracked source ids: ${scope.sourceIds.join(", ") || "none"}`,
        `Current brief path: ${scope.briefPath ?? "none"}`,
        "",
        "Likely canonical pages:",
        canonicalPages.length ? canonicalPages.map((page) => `- ${page.title} -> ${page.path}`).join("\n") : "- none",
        "",
        "Likely source-local pages:",
        newPages.length ? newPages.map((page) => `- ${page.title} -> ${page.path}`).join("\n") : "- none",
        "",
        "Likely reinforcing pages:",
        reinforcingPages.length ? reinforcingPages.map((page) => `- ${page.title} -> ${page.path}`).join("\n") : "- none",
        "",
        "Pages:",
        pageContext || "- none",
        "",
        "Analyses:",
        analysisContext || "No analysis context available.",
        "",
        "Deterministic fallback draft:",
        fallback
      ].join("\n")
    });
    return response.text?.trim() ? response.text.trim() : fallback;
  } catch {
    return fallback;
  }
}
async function buildSourceGuideStagedPage(rootDir, scope) {
  const { config, paths } = await loadVaultConfig(rootDir);
  const markdown = await generateSourceGuideMarkdown(rootDir, scope);
  if (!markdown) {
    throw new Error(`Could not generate a source guide for ${scope.id}.`);
  }
  const graph = await readJsonFile(paths.graphPath);
  const schemas = await loadVaultSchemas(rootDir);
  const scopeManifests = manifestsForScope(graph, scope);
  const relatedPages = graph ? scopedSourcePages(graph, scope.sourceIds) : [];
  const contradictions = findContradictionsForScope(scope, await readGraphReport(rootDir));
  const selectedTargets = selectGuidedTargetPages(scope, relatedPages, defaultGuidedSessionQuestions());
  const relatedPageIds = relatedPages.slice(0, 18).map((page) => page.id);
  const relatedNodeIds = graph ? scopedNodeIds(graph, scope.sourceIds).slice(0, 28) : [];
  const projectIds = uniqueStrings(relatedPages.flatMap((page) => page.projectIds));
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const output = buildOutputPage({
    title: `Source Guide: ${scope.title}`,
    question: `Guide ${scope.title}`,
    answer: markdown,
    citations: scope.sourceIds,
    schemaHash: sourceOutputSchemaHash(schemas, projectIds),
    outputFormat: "report",
    relatedPageIds,
    relatedNodeIds,
    relatedSourceIds: scope.sourceIds,
    projectIds,
    extraTags: ["source-guide", "guided-ingest"],
    origin: "source_guide",
    slug: `source-guides/${scope.id}`,
    metadata: {
      status: "draft",
      createdAt: now,
      updatedAt: now,
      compiledFrom: scope.sourceIds,
      managedBy: "system",
      confidence: 0.8
    },
    frontmatter: {
      profile_presets: config.profile.presets,
      source_type: scopeSourceType(scope, scopeManifests),
      occurred_at: scopeOccurredAt(scopeManifests),
      participants: scopeParticipants(scopeManifests),
      container_title: scopeContainerTitle(scopeManifests),
      conversation_id: scopeConversationId(scopeManifests),
      question_state: "answered",
      canonical_targets: selectedTargets.map((page) => page.path),
      evidence_state: contradictions.length ? "conflicting" : selectedTargets.some((page) => page.sourceIds.some((sourceId) => !scope.sourceIds.includes(sourceId))) ? "reinforcing" : selectedTargets.length ? "new" : "needs_judgment"
    }
  });
  return { page: output.page, content: output.content };
}
async function stageSourceReviewForScope(rootDir, scope) {
  const output = await buildSourceReviewStagedPage(rootDir, scope);
  const approval = await stageGeneratedOutputPages(rootDir, [{ page: output.page, content: output.content, label: "source-review" }], {
    bundleType: "source-review",
    title: `Source Review: ${scope.title}`
  });
  return {
    sourceId: scope.id,
    pageId: output.page.id,
    reviewPath: path10.join(approval.approvalDir, "wiki", output.page.path),
    staged: true,
    approvalId: approval.approvalId,
    approvalDir: approval.approvalDir
  };
}
function nextGuidedSourceSessionId(scope) {
  return `source-session-${slugify(scope.id)}-${sha256(`${scope.id}:${(/* @__PURE__ */ new Date()).toISOString()}`).slice(0, 8)}`;
}
function shouldReuseGuidedSourceSession(session) {
  return Boolean(session && session.status === "awaiting_input");
}
function questionAnswer(questions, id, fallback) {
  return normalizeGuidedAnswerValue(questions.find((question) => question.id === id)?.answer) ?? fallback;
}
async function prepareGuidedSourceSession(rootDir, scope, answers) {
  const existing = await findLatestGuidedSourceSessionByScope(rootDir, scope.id);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const session = shouldReuseGuidedSourceSession(existing) ? {
    ...existing,
    scopeTitle: scope.title,
    sourceIds: scope.sourceIds,
    kind: scope.kind,
    questions: mergeGuidedSessionQuestions(existing.questions, answers),
    updatedAt: now
  } : {
    sessionId: nextGuidedSourceSessionId(scope),
    scopeId: scope.id,
    scopeTitle: scope.title,
    sourceIds: scope.sourceIds,
    kind: scope.kind,
    status: "awaiting_input",
    createdAt: now,
    updatedAt: now,
    questions: mergeGuidedSessionQuestions(defaultGuidedSessionQuestions(), answers),
    briefPath: scope.briefPath,
    targetedPagePaths: [],
    stagedUpdatePaths: []
  };
  const statePath = await guidedSourceSessionStatePath(rootDir, session.sessionId);
  return { session, statePath };
}
async function buildSourceSessionSavedPage(rootDir, scope, session) {
  const { config, paths } = await loadVaultConfig(rootDir);
  let graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    await compileVault(rootDir, {});
    graph = await readJsonFile(paths.graphPath);
  }
  const schemas = await loadVaultSchemas(rootDir);
  const scopeManifests = manifestsForScope(graph, scope);
  const sourcePages = graph ? scopedSourcePages(graph, scope.sourceIds) : [];
  const analyses = await loadSourceAnalyses(rootDir, scope.sourceIds);
  const report = await readGraphReport(rootDir);
  const contradictions = findContradictionsForScope(scope, report);
  const relatedPageIds = uniqueStrings([
    ...sourcePages.slice(0, 18).map((page) => page.id),
    ...session.targetedPagePaths.map((relativePath) => {
      const page = graph?.pages.find((candidate) => candidate.path === relativePath);
      return page?.id ?? "";
    })
  ]);
  const relatedNodeIds = graph ? scopedNodeIds(graph, scope.sourceIds).slice(0, 28) : [];
  const projectIds = uniqueStrings(sourcePages.flatMap((page) => page.projectIds));
  const evidenceState = contradictions.length > 0 ? "conflicting" : session.targetedPagePaths.some(
    (targetPath) => sourcePages.some((page) => page.path === targetPath && page.sourceIds.some((sourceId) => !scope.sourceIds.includes(sourceId)))
  ) ? "reinforcing" : session.targetedPagePaths.length ? "new" : "needs_judgment";
  const relativeBriefPath = session.briefPath && path10.isAbsolute(session.briefPath) ? path10.relative(paths.wikiDir, session.briefPath) : session.briefPath;
  const sessionMarkdown = [
    `# Guided Session: ${scope.title}`,
    "",
    `Status: \`${session.status}\``,
    `Session ID: \`${session.sessionId}\``,
    ...session.approvalId ? [`Approval Bundle: \`${session.approvalId}\``] : [],
    ...relativeBriefPath ? [`Brief: \`${relativeBriefPath}\``] : [],
    "",
    "## What This Source Is",
    "",
    ...analyses.length ? analyses.slice(0, 6).map((analysis) => `- ${analysis.title}: ${analysis.summary}`) : ["- Awaiting compile context."],
    "",
    "## Guided Questions",
    "",
    ...session.questions.flatMap((question) => [`### ${question.prompt}`, "", question.answer ?? "_Awaiting input._", ""]),
    "## Proposed Wiki Targets",
    "",
    ...session.targetedPagePaths.length ? session.targetedPagePaths.map((targetPath) => `- [[${targetPath.replace(/\.md$/, "")}]]`) : ["- No canonical update targets selected yet."],
    "",
    "## Conflicts And Judgment Calls",
    "",
    ...contradictions.length ? contradictions.map((contradiction) => `- ${contradiction.claimA} / ${contradiction.claimB}`) : ["- No contradictions are currently flagged for this source scope."],
    "",
    "## Follow-up Questions",
    "",
    ...(() => {
      const followups = questionAnswer(session.questions, "followups", "");
      if (followups) {
        return followups.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => `- ${line.replace(/^-+\s*/, "")}`);
      }
      const analysisQuestions = uniqueStrings(analyses.flatMap((analysis) => analysis.questions)).slice(0, 6);
      return analysisQuestions.length ? analysisQuestions.map((question) => `- ${question}`) : ["- No follow-up questions recorded yet."];
    })(),
    "",
    "## Related Artifacts",
    "",
    `- [[outputs/source-briefs/${scope.id}|Source Brief]]`,
    `- [[outputs/source-reviews/${scope.id}|Source Review]]`,
    `- [[outputs/source-guides/${scope.id}|Source Guide]]`,
    ""
  ].join("\n");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const output = buildOutputPage({
    title: `Guided Session: ${scope.title}`,
    question: `Guided Session ${scope.title}`,
    answer: sessionMarkdown,
    citations: scope.sourceIds,
    schemaHash: sourceOutputSchemaHash(schemas, projectIds),
    outputFormat: "report",
    relatedPageIds,
    relatedNodeIds,
    relatedSourceIds: scope.sourceIds,
    projectIds,
    extraTags: ["source-session", "guided-session"],
    origin: "source_session",
    slug: `source-sessions/${scope.id}`,
    metadata: {
      status: "active",
      createdAt: now,
      updatedAt: now,
      compiledFrom: scope.sourceIds,
      managedBy: "system",
      confidence: 0.81
    },
    frontmatter: {
      profile_presets: config.profile.presets,
      source_type: scopeSourceType(scope, scopeManifests),
      occurred_at: scopeOccurredAt(scopeManifests),
      participants: scopeParticipants(scopeManifests),
      container_title: scopeContainerTitle(scopeManifests),
      conversation_id: scopeConversationId(scopeManifests),
      session_status: session.status,
      question_state: questionStateForSession(session),
      canonical_targets: session.targetedPagePaths,
      evidence_state: evidenceState
    }
  });
  return { page: output.page, content: output.content };
}
async function persistSourceSessionPage(rootDir, scope, session) {
  const { paths } = await loadVaultConfig(rootDir);
  const output = await buildSourceSessionSavedPage(rootDir, scope, session);
  const absolutePath = path10.join(paths.wikiDir, output.page.path);
  await ensureDir(path10.dirname(absolutePath));
  await fs10.writeFile(absolutePath, output.content, "utf8");
  return { pageId: output.page.id, sessionPath: absolutePath };
}
async function buildGuidedUpdatePages(rootDir, scope, session) {
  const { config, paths } = await loadVaultConfig(rootDir);
  let graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    await compileVault(rootDir, {});
    graph = await readJsonFile(paths.graphPath);
  }
  if (!graph) {
    return [];
  }
  const sourcePages = scopedSourcePages(graph, scope.sourceIds);
  const scopeManifests = manifestsForScope(graph, scope);
  const analyses = await loadSourceAnalyses(rootDir, scope.sourceIds);
  const report = await readGraphReport(rootDir);
  const contradictions = findContradictionsForScope(scope, report);
  const selectedTargets = selectGuidedTargetPages(scope, sourcePages, session.questions);
  const useCanonicalTargets = config.profile.guidedSessionMode === "canonical_review" && selectedTargets.length > 0;
  const targetPages = useCanonicalTargets ? selectedTargets : [selectedTargets[0] ?? null];
  session.targetedPagePaths = uniqueStrings(
    useCanonicalTargets ? selectedTargets.map((page) => page.path) : selectedTargets.length ? selectedTargets.map((page) => page.path) : session.targetedPagePaths
  );
  return await Promise.all(
    targetPages.map(async (targetPage) => {
      const evidenceState = classifyGuidedEvidenceState(scope, targetPage, contradictions);
      const relativePath = useCanonicalTargets && targetPage ? targetPage.path : targetPage ? insightRelativePathForTarget(targetPage, scope) : `insights/topics/${slugify(scope.title)}.md`;
      const absolutePath = path10.join(paths.wikiDir, relativePath);
      const existingContent = await fileExists(absolutePath) ? await fs10.readFile(absolutePath, "utf8") : "";
      const parsed = existingContent ? matter3(existingContent) : { data: {}, content: "" };
      const existingData = parsed.data;
      const existingSourceIds = Array.isArray(existingData.source_ids) ? existingData.source_ids.filter((value) => typeof value === "string") : [];
      const existingProjectIds = Array.isArray(existingData.project_ids) ? existingData.project_ids.filter((value) => typeof value === "string") : [];
      const existingNodeIds = Array.isArray(existingData.node_ids) ? existingData.node_ids.filter((value) => typeof value === "string") : [];
      const existingBacklinks = Array.isArray(existingData.backlinks) ? existingData.backlinks.filter((value) => typeof value === "string") : [];
      const createdAt = typeof existingData.created_at === "string" && existingData.created_at.trim() ? existingData.created_at : (/* @__PURE__ */ new Date()).toISOString();
      const title = typeof existingData.title === "string" && existingData.title.trim() || (useCanonicalTargets && targetPage ? targetPage.title : targetPage ? insightTitleForTarget(targetPage, scope) : `${scope.title} Notes`);
      const baseBody = parsed.content.trim() ? parsed.content.trim() : [
        `# ${title}`,
        "",
        useCanonicalTargets ? "Canonical page maintained by SwarmVault. Guided sessions stage replaceable update blocks here for approval." : "Human-curated insight page. Guided sessions stage replaceable update blocks here.",
        ""
      ].join("\n");
      const importance = questionAnswer(
        session.questions,
        "importance",
        "Capture the most important new ideas from this source before treating them as canonical."
      );
      const exclude = questionAnswer(
        session.questions,
        "exclude",
        "Keep uncertain or incidental details provisional until they matter to the research thread."
      );
      const conflictNotes = questionAnswer(
        session.questions,
        "conflicts",
        contradictions.length ? "Review the conflicting evidence before accepting any canonical summary changes." : "No explicit conflicts were called out."
      );
      const followups = questionAnswer(session.questions, "followups", "Track follow-up questions on the source session page.");
      const updateBlock = [
        `## Guided Session Update: ${scope.title}`,
        "",
        `Evidence State: \`${evidenceState}\``,
        `Session: [[outputs/source-sessions/${scope.id}|Guided Session]]`,
        `Source Guide: [[outputs/source-guides/${scope.id}|Source Guide]]`,
        "",
        "### What Matters Now",
        "",
        importance,
        "",
        "### Proposed Integration",
        "",
        targetPage ? `- Fold the strongest source-backed takeaways into [[${targetPage.path.replace(/\.md$/, "")}|${targetPage.title}]].` : `- Start a durable topic note for ${scope.title}.`,
        ...analyses.slice(0, 5).map((analysis) => `- ${truncate(normalizeWhitespace(analysis.summary), 180)}`),
        "",
        "### Keep Provisional Or Out",
        "",
        exclude,
        "",
        "### Reinforcing Or Conflicting Notes",
        "",
        conflictNotes,
        ...contradictions.length ? ["", ...contradictions.slice(0, 4).map((contradiction) => `- ${contradiction.claimA} / ${contradiction.claimB}`)] : [],
        "",
        "### Follow-up Questions",
        "",
        followups,
        ""
      ].join("\n");
      const nextBody = replaceMarkedSection(baseBody, scope.id, updateBlock);
      const content = matter3.stringify(
        `${nextBody.trimEnd()}
`,
        JSON.parse(
          JSON.stringify({
            ...existingData,
            page_id: typeof existingData.page_id === "string" && existingData.page_id.trim() || (useCanonicalTargets && targetPage ? targetPage.id : `insight:${slugify(relativePath.replace(/\.md$/, ""))}`),
            kind: useCanonicalTargets && targetPage ? targetPage.kind : "insight",
            title,
            tags: uniqueStrings([
              ...Array.isArray(existingData.tags) ? existingData.tags.filter((value) => typeof value === "string") : [],
              ...useCanonicalTargets ? ["guided-session", `guided/${targetPage?.kind ?? "page"}`] : insightTagsForTarget(targetPage)
            ]),
            source_ids: uniqueStrings([...existingSourceIds, ...scope.sourceIds]),
            project_ids: uniqueStrings([...existingProjectIds, ...targetPage?.projectIds ?? []]),
            node_ids: uniqueStrings([...existingNodeIds, ...targetPage?.nodeIds ?? []]),
            freshness: "fresh",
            status: existingData.status === "archived" ? "archived" : "active",
            confidence: 0.83,
            created_at: createdAt,
            updated_at: (/* @__PURE__ */ new Date()).toISOString(),
            compiled_from: uniqueStrings([
              ...Array.isArray(existingData.compiled_from) ? existingData.compiled_from.filter((value) => typeof value === "string") : [],
              ...scope.sourceIds
            ]),
            managed_by: typeof existingData.managed_by === "string" && (existingData.managed_by === "human" || existingData.managed_by === "system") ? existingData.managed_by : useCanonicalTargets ? "system" : "human",
            backlinks: uniqueStrings([
              ...existingBacklinks,
              ...targetPage ? [targetPage.id] : [],
              `output:source-sessions/${scope.id}`,
              `output:source-guides/${scope.id}`
            ]),
            schema_hash: typeof existingData.schema_hash === "string" ? existingData.schema_hash : "",
            source_hashes: existingData.source_hashes && typeof existingData.source_hashes === "object" ? existingData.source_hashes : {},
            source_semantic_hashes: existingData.source_semantic_hashes && typeof existingData.source_semantic_hashes === "object" ? existingData.source_semantic_hashes : {},
            profile_presets: config.profile.presets,
            source_type: scopeSourceType(scope, scopeManifests),
            occurred_at: scopeOccurredAt(scopeManifests),
            participants: scopeParticipants(scopeManifests),
            container_title: scopeContainerTitle(scopeManifests),
            conversation_id: scopeConversationId(scopeManifests),
            session_status: session.status,
            question_state: questionStateForSession(session),
            canonical_targets: useCanonicalTargets ? selectedTargets.map((page2) => page2.path) : [],
            evidence_state: evidenceState
          })
        )
      );
      const page = parseStoredPage(relativePath, content, {
        createdAt,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (!useCanonicalTargets && !selectedTargets.length) {
        session.targetedPagePaths = uniqueStrings([...session.targetedPagePaths, relativePath]);
      }
      return { page, content, label: "guided-update" };
    })
  );
}
async function stageSourceGuideForScope(rootDir, scope, options = {}) {
  const { session, statePath } = await prepareGuidedSourceSession(rootDir, scope, options.answers);
  const briefPath = scope.briefPath ?? session.briefPath ?? await writeSourceBriefForScope(rootDir, scope) ?? void 0;
  session.briefPath = briefPath;
  if (briefPath) {
    await refreshVaultAfterOutputSave(rootDir);
  }
  if (answeredGuidedSessionQuestions(session.questions).length === 0) {
    session.status = "awaiting_input";
    const persisted2 = await persistSourceSessionPage(rootDir, scope, session);
    session.sessionPath = persisted2.sessionPath;
    await writeGuidedSourceSession(rootDir, session);
    await refreshVaultAfterOutputSave(rootDir);
    return {
      sourceId: scope.id,
      sessionId: session.sessionId,
      sessionPath: persisted2.sessionPath,
      sessionStatePath: statePath,
      status: session.status,
      questions: session.questions,
      awaitingInput: true,
      targetedPagePaths: session.targetedPagePaths,
      stagedUpdatePaths: session.stagedUpdatePaths,
      briefPath,
      staged: false
    };
  }
  session.status = "ready_to_stage";
  await writeGuidedSourceSession(rootDir, session);
  const reviewOutput = await buildSourceReviewStagedPage(rootDir, scope);
  const guideOutput = await buildSourceGuideStagedPage(rootDir, {
    ...scope,
    briefPath
  });
  const guidedUpdates = await buildGuidedUpdatePages(rootDir, scope, session);
  session.stagedUpdatePaths = guidedUpdates.map((item) => item.page.path);
  const approval = await stageGeneratedOutputPages(
    rootDir,
    [
      { page: reviewOutput.page, content: reviewOutput.content, label: "source-review" },
      { page: guideOutput.page, content: guideOutput.content, label: "source-guide" },
      ...guidedUpdates
    ],
    {
      bundleType: "guided-session",
      title: `Guided Session: ${scope.title}`,
      sourceSessionId: session.sessionId
    }
  );
  session.status = "staged";
  session.reviewPath = path10.join(approval.approvalDir, "wiki", reviewOutput.page.path);
  session.guidePath = path10.join(approval.approvalDir, "wiki", guideOutput.page.path);
  session.approvalId = approval.approvalId;
  session.approvalDir = approval.approvalDir;
  const persisted = await persistSourceSessionPage(rootDir, scope, session);
  session.sessionPath = persisted.sessionPath;
  await writeGuidedSourceSession(rootDir, session);
  await refreshVaultAfterOutputSave(rootDir);
  return {
    sourceId: scope.id,
    pageId: guideOutput.page.id,
    guidePath: session.guidePath,
    reviewPageId: reviewOutput.page.id,
    reviewPath: session.reviewPath,
    sessionId: session.sessionId,
    sessionPath: persisted.sessionPath,
    sessionStatePath: statePath,
    status: session.status,
    questions: session.questions,
    targetedPagePaths: session.targetedPagePaths,
    stagedUpdatePaths: session.stagedUpdatePaths,
    briefPath,
    staged: true,
    approvalId: approval.approvalId,
    approvalDir: approval.approvalDir
  };
}
function scopeFromManagedSource(source) {
  return {
    id: source.id,
    title: source.title,
    sourceIds: source.sourceIds,
    kind: source.kind,
    briefPath: source.briefPath
  };
}
function scopeFromManifest(manifest, manifests) {
  const groupId = manifest.sourceGroupId ?? manifest.sourceId;
  return {
    id: groupId,
    title: manifest.sourceGroupTitle ?? manifest.title,
    sourceIds: manifest.sourceGroupId ? manifests.filter((candidate) => candidate.sourceGroupId === manifest.sourceGroupId).map((candidate) => candidate.sourceId) : [manifest.sourceId],
    kind: manifest.sourceKind
  };
}
async function resolveSourceScope(rootDir, id) {
  const managedSources = await loadManagedSources(rootDir);
  const managedSource = managedSources.find((source) => source.id === id);
  if (managedSource) {
    return scopeFromManagedSource(managedSource);
  }
  const latestSession = await findLatestGuidedSourceSessionByScope(rootDir, id);
  if (latestSession) {
    return {
      id: latestSession.scopeId,
      title: latestSession.scopeTitle,
      sourceIds: latestSession.sourceIds
    };
  }
  const manifests = await listManifests(rootDir);
  const manifest = manifests.find((candidate) => candidate.sourceId === id) ?? manifests.find((candidate) => candidate.sourceGroupId === id);
  if (!manifest) {
    return null;
  }
  return scopeFromManifest(manifest, manifests);
}
async function reviewSourceScope(rootDir, scope) {
  return await stageSourceReviewForScope(rootDir, scope);
}
async function guideSourceScope(rootDir, scope, options = {}) {
  return await stageSourceGuideForScope(rootDir, scope, options);
}
async function reviewManagedSource(rootDir, id) {
  const scope = await resolveSourceScope(rootDir, id);
  if (!scope) {
    throw new Error(`Managed source or source id not found: ${id}`);
  }
  if (!await loadVaultConfig(rootDir).then(({ paths }) => fileExists(paths.graphPath))) {
    await compileVault(rootDir, {});
  }
  return await stageSourceReviewForScope(rootDir, scope);
}
async function guideManagedSource(rootDir, id, options = {}) {
  const scope = await resolveSourceScope(rootDir, id);
  if (!scope) {
    throw new Error(`Managed source or source id not found: ${id}`);
  }
  if (!await loadVaultConfig(rootDir).then(({ paths }) => fileExists(paths.graphPath))) {
    await compileVault(rootDir, {});
  }
  return await stageSourceGuideForScope(rootDir, scope, options);
}
async function resumeSourceSession(rootDir, id, options = {}) {
  const existingSession = await readGuidedSourceSession(rootDir, id);
  if (existingSession) {
    return await stageSourceGuideForScope(
      rootDir,
      {
        id: existingSession.scopeId,
        title: existingSession.scopeTitle,
        sourceIds: existingSession.sourceIds,
        kind: existingSession.kind,
        briefPath: existingSession.briefPath
      },
      options
    );
  }
  const scope = await resolveSourceScope(rootDir, id);
  if (!scope) {
    throw new Error(`Managed source, source scope, or guided session not found: ${id}`);
  }
  return await stageSourceGuideForScope(rootDir, scope, options);
}
function shouldCompile(changedSources, graphExists, compileRequested) {
  return compileRequested && (!graphExists || changedSources.length > 0);
}
async function shouldRefreshBriefForManagedSource(source, options) {
  if (options.compilePerformed || options.changed) {
    return true;
  }
  if (!source.briefPath) {
    return true;
  }
  return !await fileExists(source.briefPath);
}
async function listManagedSourceRecords(rootDir) {
  await ensureManagedSourcesArtifact(rootDir);
  return await loadManagedSources(rootDir);
}
async function addManagedSource(rootDir, input, options = {}) {
  const compileRequested = options.compile ?? true;
  const guideRequested = options.guide ?? false;
  const briefRequested = guideRequested ? true : options.brief ?? true;
  const reviewRequested = guideRequested ? false : options.review ?? false;
  const sources = await loadManagedSources(rootDir);
  const resolved = await resolveManagedSourceInput(rootDir, input);
  const existing = sources.find((candidate) => matchesManagedSourceSpec(candidate, resolved));
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const source = existing ?? {
    id: resolved.kind === "directory" || resolved.kind === "file" ? stableManagedSourceId(resolved.kind, path10.resolve(resolved.path), resolved.title) : stableManagedSourceId(resolved.kind, resolved.url, resolved.title),
    kind: resolved.kind,
    title: resolved.title,
    path: resolved.kind === "directory" || resolved.kind === "file" ? resolved.path : void 0,
    repoRoot: resolved.kind === "directory" ? resolved.repoRoot : void 0,
    url: resolved.kind === "directory" || resolved.kind === "file" ? void 0 : resolved.url,
    createdAt: now,
    updatedAt: now,
    status: "ready",
    sourceIds: []
  };
  const synced = await syncManagedSource(rootDir, source, options);
  if (synced.lastSyncStatus === "error") {
    throw new Error(synced.lastError ?? `Failed to add managed source ${synced.id}.`);
  }
  const graphExists = await loadVaultConfig(rootDir).then(({ paths }) => fileExists(paths.graphPath));
  let compile;
  if (shouldCompile(synced.changed ? [synced] : [], graphExists, compileRequested)) {
    compile = await compileVault(rootDir, {});
  }
  let briefGenerated = false;
  let briefPath;
  if (compileRequested && briefRequested && synced.status === "ready" && await shouldRefreshBriefForManagedSource(synced, {
    compilePerformed: Boolean(compile),
    changed: synced.changed
  })) {
    const briefs = await generateBriefsForSources(rootDir, [synced]);
    briefPath = briefs.get(synced.id);
    briefGenerated = Boolean(briefPath);
  }
  const nextSource = {
    ...synced,
    briefPath: briefPath ?? synced.briefPath,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const nextSources = existing ? sources.map((candidate) => candidate.id === nextSource.id ? nextSource : candidate) : [...sources, nextSource];
  await saveManagedSources(rootDir, nextSources);
  const review = reviewRequested && nextSource.status === "ready" ? await stageSourceReviewForScope(rootDir, scopeFromManagedSource(nextSource)) : void 0;
  const guide = guideRequested && nextSource.status === "ready" ? await stageSourceGuideForScope(
    rootDir,
    {
      ...scopeFromManagedSource(nextSource),
      briefPath: nextSource.briefPath
    },
    { answers: options.guideAnswers }
  ) : void 0;
  return {
    source: nextSource,
    compile,
    briefGenerated,
    review,
    guide
  };
}
async function reloadManagedSources(rootDir, options = {}) {
  const compileRequested = options.compile ?? true;
  const guideRequested = options.guide ?? false;
  const briefRequested = guideRequested ? true : options.brief ?? true;
  const reviewRequested = guideRequested ? false : options.review ?? false;
  const sources = await loadManagedSources(rootDir);
  const selected = options.all || !options.id ? sources : sources.filter((source) => source.id === options.id);
  if (!selected.length) {
    throw new Error(options.id ? `Managed source not found: ${options.id}` : "No managed sources registered.");
  }
  const syncedSources = [];
  const changedSources = [];
  for (const source of selected) {
    const synced = await syncManagedSource(rootDir, source, options);
    syncedSources.push(synced);
    if (synced.changed) {
      changedSources.push(synced);
    }
  }
  const graphExists = await loadVaultConfig(rootDir).then(({ paths }) => fileExists(paths.graphPath));
  let compile;
  if (shouldCompile(changedSources, graphExists, compileRequested)) {
    compile = await compileVault(rootDir, {});
  }
  const briefPaths = compileRequested && briefRequested ? await generateBriefsForSources(
    rootDir,
    syncedSources.filter((source) => source.status === "ready")
  ) : /* @__PURE__ */ new Map();
  const nextSources = sources.map((source) => {
    const synced = syncedSources.find((candidate) => candidate.id === source.id);
    if (!synced) {
      return source;
    }
    return {
      ...synced,
      briefPath: briefPaths.get(synced.id) ?? synced.briefPath,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  });
  await saveManagedSources(rootDir, nextSources);
  const reviews = reviewRequested ? await Promise.all(
    nextSources.filter((source) => selected.some((candidate) => candidate.id === source.id)).filter((source) => source.status === "ready").map(async (source) => await stageSourceReviewForScope(rootDir, scopeFromManagedSource(source)))
  ) : [];
  const guides = guideRequested ? await Promise.all(
    nextSources.filter((source) => selected.some((candidate) => candidate.id === source.id)).filter((source) => source.status === "ready").map(
      async (source) => await stageSourceGuideForScope(
        rootDir,
        {
          ...scopeFromManagedSource(source),
          briefPath: source.briefPath
        },
        { answers: options.guideAnswers }
      )
    )
  ) : [];
  return {
    sources: nextSources.filter((source) => selected.some((candidate) => candidate.id === source.id)),
    compile,
    briefPaths: [...briefPaths.values()],
    reviews,
    guides
  };
}
async function deleteManagedSource(rootDir, id) {
  const sources = await loadManagedSources(rootDir);
  const target = sources.find((source) => source.id === id);
  if (!target) {
    throw new Error(`Managed source not found: ${id}`);
  }
  await saveManagedSources(
    rootDir,
    sources.filter((source) => source.id !== id)
  );
  const workingDir = await managedSourceWorkingDir(rootDir, id);
  await fs10.rm(workingDir, { recursive: true, force: true });
  return { removed: target };
}

// src/viewer.ts
import { execFile as execFile2 } from "child_process";
import { randomUUID } from "crypto";
import { EventEmitter } from "events";
import fs11 from "fs/promises";
import http from "http";
import path11 from "path";
import { promisify as promisify2 } from "util";
import matter4 from "gray-matter";
import mime from "mime-types";

// src/graph-presentation.ts
var OVERVIEW_THRESHOLD = 5e3;
var OVERVIEW_NODE_BUDGET = 1500;
function nodePriority(node, pinnedNodeIds) {
  return [pinnedNodeIds.has(node.id) ? 0 : 1, -(node.degree ?? 0), -(node.bridgeScore ?? 0), node.label, node.id];
}
function compareTuples(left, right) {
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];
    if (leftValue === rightValue) {
      continue;
    }
    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue - rightValue;
    }
    return String(leftValue ?? "").localeCompare(String(rightValue ?? ""));
  }
  return 0;
}
function survivingHyperedges(hyperedges, sampledNodeIds) {
  return hyperedges.filter((hyperedge) => hyperedge.nodeIds.filter((nodeId) => sampledNodeIds.has(nodeId)).length >= 2);
}
function pinnedNodeIdsForReport(report) {
  if (!report) {
    return /* @__PURE__ */ new Set();
  }
  return /* @__PURE__ */ new Set([
    ...report.godNodes.map((node) => node.nodeId),
    ...report.bridgeNodes.map((node) => node.nodeId),
    ...report.surprisingConnections.flatMap((connection) => [connection.sourceNodeId, connection.targetNodeId])
  ]);
}
function sampleGraphNodes(graph, report, nodeBudget = OVERVIEW_NODE_BUDGET) {
  const pinned = pinnedNodeIdsForReport(report);
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const selected = new Set([...pinned].filter((nodeId) => nodeById.has(nodeId)));
  const sortedCommunities2 = [...graph.communities ?? []].sort((left, right) => {
    const leftNodes = left.nodeIds.map((nodeId) => nodeById.get(nodeId)).filter((node) => Boolean(node));
    const rightNodes = right.nodeIds.map((nodeId) => nodeById.get(nodeId)).filter((node) => Boolean(node));
    const leftFirstParty = leftNodes.filter((node) => node.sourceClass === "first_party").length;
    const rightFirstParty = rightNodes.filter((node) => node.sourceClass === "first_party").length;
    return compareTuples(
      [-leftFirstParty, -leftNodes.length, left.label, left.id],
      [-rightFirstParty, -rightNodes.length, right.label, right.id]
    );
  });
  for (const community of sortedCommunities2) {
    const communityNodes = community.nodeIds.map((nodeId) => nodeById.get(nodeId)).filter((node) => Boolean(node)).sort((left, right) => compareTuples(nodePriority(left, pinned), nodePriority(right, pinned)));
    for (const node of communityNodes) {
      if (selected.size >= nodeBudget && !pinned.has(node.id)) {
        break;
      }
      selected.add(node.id);
    }
    if (selected.size >= nodeBudget) {
      break;
    }
  }
  if (selected.size < nodeBudget) {
    for (const node of [...graph.nodes].sort((left, right) => compareTuples(nodePriority(left, pinned), nodePriority(right, pinned)))) {
      if (selected.size >= nodeBudget && !pinned.has(node.id)) {
        break;
      }
      selected.add(node.id);
    }
  }
  return selected;
}
function buildViewerGraphArtifact(graph, options = {}) {
  const threshold = options.threshold ?? OVERVIEW_THRESHOLD;
  const nodeBudget = options.nodeBudget ?? OVERVIEW_NODE_BUDGET;
  const totalCommunities = graph.communities?.length ?? 0;
  if (options.full || graph.nodes.length <= threshold) {
    return {
      ...graph,
      presentation: {
        mode: "full",
        threshold,
        nodeBudget,
        totalNodes: graph.nodes.length,
        displayedNodes: graph.nodes.length,
        totalEdges: graph.edges.length,
        displayedEdges: graph.edges.length,
        totalCommunities,
        displayedCommunities: totalCommunities
      }
    };
  }
  const sampledNodeIds = sampleGraphNodes(graph, options.report, nodeBudget);
  const nodes = graph.nodes.filter((node) => sampledNodeIds.has(node.id));
  const edges = graph.edges.filter((edge) => sampledNodeIds.has(edge.source) && sampledNodeIds.has(edge.target));
  const hyperedges = survivingHyperedges(graph.hyperedges ?? [], sampledNodeIds);
  const communities = (graph.communities ?? []).map((community) => ({
    ...community,
    nodeIds: community.nodeIds.filter((nodeId) => sampledNodeIds.has(nodeId))
  })).filter((community) => community.nodeIds.length > 0);
  return {
    ...graph,
    nodes,
    edges,
    hyperedges,
    communities,
    presentation: {
      mode: "overview",
      threshold,
      nodeBudget,
      totalNodes: graph.nodes.length,
      displayedNodes: nodes.length,
      totalEdges: graph.edges.length,
      displayedEdges: edges.length,
      totalCommunities,
      displayedCommunities: communities.length
    }
  };
}

// src/viewer.ts
var ViewerEventBus = class extends EventEmitter {
  publish(event) {
    const enriched = {
      id: event.id ?? randomUUID(),
      timestamp: event.timestamp ?? (/* @__PURE__ */ new Date()).toISOString(),
      type: event.type,
      level: event.level,
      message: event.message,
      meta: event.meta
    };
    this.emit("event", enriched);
    return enriched;
  }
};
var viewerEventBus = new ViewerEventBus();
viewerEventBus.setMaxListeners(64);
function toViewerLintFindings(findings) {
  const detectedAt = (/* @__PURE__ */ new Date()).toISOString();
  return findings.map((finding, index) => ({
    id: `${finding.code}:${index}`,
    severity: finding.severity,
    category: finding.code,
    message: finding.message,
    pagePath: finding.pagePath,
    detectedAt
  }));
}
var execFileAsync2 = promisify2(execFile2);
async function isReadableFile(absolutePath) {
  try {
    const stats = await fs11.stat(absolutePath);
    return stats.isFile();
  } catch {
    return false;
  }
}
async function readViewerPage(rootDir, relativePath) {
  if (!relativePath) {
    return null;
  }
  const { paths } = await loadVaultConfig(rootDir);
  const absolutePath = path11.resolve(paths.wikiDir, relativePath);
  if (!isPathWithin(paths.wikiDir, absolutePath) || !await isReadableFile(absolutePath)) {
    return null;
  }
  const raw = await fs11.readFile(absolutePath, "utf8");
  const parsed = matter4(raw);
  return {
    path: relativePath,
    title: typeof parsed.data.title === "string" ? parsed.data.title : path11.basename(relativePath, path11.extname(relativePath)),
    frontmatter: parsed.data,
    content: parsed.content,
    assets: normalizeOutputAssets(parsed.data.output_assets)
  };
}
async function readViewerAsset(rootDir, relativePath) {
  if (!relativePath) {
    return null;
  }
  const { paths } = await loadVaultConfig(rootDir);
  const absolutePath = path11.resolve(paths.wikiDir, relativePath);
  if (!isPathWithin(paths.wikiDir, absolutePath) || !await isReadableFile(absolutePath)) {
    return null;
  }
  return {
    buffer: await fs11.readFile(absolutePath),
    mimeType: mime.lookup(absolutePath) || "application/octet-stream"
  };
}
async function assetDataUrl(rootDir, relativePath) {
  const asset = await readViewerAsset(rootDir, relativePath);
  if (!asset) {
    return void 0;
  }
  return `data:${asset.mimeType};base64,${asset.buffer.toString("base64")}`;
}
async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
}
function slugForClip(value) {
  const normalized = value.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 80);
  return normalized || "clip";
}
async function writeInboxClip(rootDir, body) {
  const { paths } = await loadVaultConfig(rootDir);
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : typeof body.url === "string" && body.url.trim() ? body.url.trim() : "Browser Clip";
  const clipUrl = typeof body.url === "string" ? body.url.trim() : "";
  const markdown = typeof body.markdown === "string" ? body.markdown.trim() : "";
  const selectionText = typeof body.selectionText === "string" ? body.selectionText.trim() : "";
  const selectionHtml = typeof body.selectionHtml === "string" ? body.selectionHtml.trim() : "";
  const tags = Array.isArray(body.tags) ? body.tags.filter((tag) => typeof tag === "string" && tag.trim().length > 0) : [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const fileName = `${now.replace(/[:.]/g, "-")}-${slugForClip(title)}.md`;
  const inboxPath = path11.join(paths.inboxDir, fileName);
  await fs11.mkdir(paths.inboxDir, { recursive: true });
  const lines = [
    "---",
    `title: ${JSON.stringify(title)}`,
    clipUrl ? `clip_url: ${JSON.stringify(clipUrl)}` : void 0,
    `captured_at: ${JSON.stringify(now)}`,
    tags.length ? `tags: ${JSON.stringify(tags)}` : void 0,
    "---",
    "",
    `# ${title}`,
    "",
    clipUrl ? `Source: ${clipUrl}` : void 0,
    "",
    markdown || selectionText || selectionHtml || clipUrl,
    selectionHtml && !markdown ? ["", "## Original HTML", "", "```html", selectionHtml, "```"].join("\n") : void 0,
    ""
  ].filter((line) => line !== void 0);
  await fs11.writeFile(inboxPath, lines.join("\n"), "utf8");
  const result = await importInbox(rootDir, paths.inboxDir);
  return { mode: "inbox", inboxPath, result };
}
async function ensureViewerDist(viewerDistDir) {
  const indexPath = path11.join(viewerDistDir, "index.html");
  if (await fileExists(indexPath)) {
    return;
  }
  const viewerProjectDir = path11.dirname(viewerDistDir);
  if (await fileExists(path11.join(viewerProjectDir, "package.json"))) {
    await execFileAsync2("pnpm", ["build"], { cwd: viewerProjectDir });
  }
}
async function startGraphServer(rootDir, port, options = {}) {
  const { config, paths } = await loadVaultConfig(rootDir);
  const effectivePort = port ?? config.viewer.port;
  await ensureViewerDist(paths.viewerDistDir);
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `localhost:${effectivePort}`}`);
    try {
      if (url.pathname === "/api/graph") {
        if (!await fileExists(paths.graphPath)) {
          response.writeHead(404, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: "Graph artifact not found. Run `swarmvault compile` first." }));
          return;
        }
        const graph = await readJsonFile(paths.graphPath);
        if (!graph) {
          response.writeHead(404, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: "Graph artifact not found. Run `swarmvault compile` first." }));
          return;
        }
        const reportPath = path11.join(paths.wikiDir, "graph", "report.json");
        const report = await readJsonFile(reportPath) ?? null;
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(buildViewerGraphArtifact(graph, { report, full: options.full ?? false })));
        return;
      }
      if (url.pathname === "/api/graph/query") {
        const question = url.searchParams.get("q") ?? "";
        const traversal = url.searchParams.get("traversal");
        const budget = Number.parseInt(url.searchParams.get("budget") ?? "12", 10);
        const result = await queryGraphVault(rootDir, question, {
          traversal: traversal === "dfs" ? "dfs" : "bfs",
          budget: Number.isFinite(budget) ? budget : 12
        });
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(result));
        return;
      }
      if (url.pathname === "/api/graph/path") {
        const from = url.searchParams.get("from") ?? "";
        const to = url.searchParams.get("to") ?? "";
        const result = await pathGraphVault(rootDir, from, to);
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(result));
        return;
      }
      if (url.pathname === "/api/graph/explain") {
        const target2 = url.searchParams.get("target") ?? "";
        if (!target2) {
          response.writeHead(400, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: "Missing explain target." }));
          return;
        }
        const result = await explainGraphVault(rootDir, target2);
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(result));
        return;
      }
      if (url.pathname === "/api/search") {
        if (!await fileExists(paths.searchDbPath)) {
          response.writeHead(404, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: "Search index not found. Run `swarmvault compile` first." }));
          return;
        }
        const query = url.searchParams.get("q") ?? "";
        const limit = Number.parseInt(url.searchParams.get("limit") ?? "10", 10);
        const kind = url.searchParams.get("kind") ?? "all";
        const status = url.searchParams.get("status") ?? "all";
        const project = url.searchParams.get("project") ?? "all";
        const sourceType = url.searchParams.get("sourceType") ?? "all";
        const sourceClass = url.searchParams.get("sourceClass") ?? "all";
        const results = searchPages(paths.searchDbPath, query, {
          limit: Number.isFinite(limit) ? limit : 10,
          kind,
          status,
          project,
          sourceType,
          sourceClass
        });
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(results));
        return;
      }
      if (url.pathname === "/api/graph-report") {
        const reportPath = path11.join(paths.wikiDir, "graph", "report.json");
        if (!await fileExists(reportPath)) {
          response.writeHead(404, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: "Graph report artifact not found. Run `swarmvault compile` first." }));
          return;
        }
        const body = await fs11.readFile(reportPath, "utf8");
        response.writeHead(200, { "content-type": "application/json" });
        response.end(body);
        return;
      }
      if (url.pathname === "/api/watch-status") {
        const watchStatus = await getWatchStatus(rootDir);
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(watchStatus));
        return;
      }
      if (url.pathname === "/api/doctor" && request.method === "GET") {
        const report = await doctorVault(rootDir);
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(report));
        return;
      }
      if (url.pathname === "/api/doctor" && request.method === "POST") {
        const body = await readJsonBody(request);
        const report = await doctorVault(rootDir, { repair: body.repair === true });
        if (report.repaired.length) {
          viewerEventBus.publish({
            type: "doctor",
            level: "success",
            message: `Doctor repaired ${report.repaired.join(", ")}.`
          });
        }
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(report));
        return;
      }
      if (url.pathname === "/api/retrieval/repair" && request.method === "POST") {
        const result = await doctorRetrieval(rootDir, { repair: true });
        viewerEventBus.publish({
          type: "retrieval",
          level: result.ok ? "success" : "warning",
          message: result.repaired ? "Retrieval index rebuilt." : "Retrieval repair completed with remaining warnings."
        });
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(result));
        return;
      }
      if (url.pathname === "/api/context-pack" && request.method === "POST") {
        const body = await readJsonBody(request);
        const goal = typeof body.goal === "string" ? body.goal.trim() : "";
        if (!goal) {
          response.writeHead(400, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: "Missing context-pack goal." }));
          return;
        }
        const result = await buildContextPack(rootDir, {
          goal,
          target: typeof body.target === "string" ? body.target.trim() : void 0,
          budgetTokens: typeof body.budgetTokens === "number" ? body.budgetTokens : void 0,
          format: body.format === "llms" || body.format === "json" || body.format === "markdown" ? body.format : void 0
        });
        viewerEventBus.publish({
          type: "memory",
          level: "success",
          message: `Built context pack ${result.pack.id}.`
        });
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(result));
        return;
      }
      if (url.pathname === "/api/task" && request.method === "POST") {
        const body = await readJsonBody(request);
        const action = url.searchParams.get("action") ?? "start";
        let result;
        if (action === "start") {
          const goal = typeof body.goal === "string" ? body.goal.trim() : "";
          if (!goal) {
            response.writeHead(400, { "content-type": "application/json" });
            response.end(JSON.stringify({ error: "Missing task goal." }));
            return;
          }
          result = await startMemoryTask(rootDir, {
            goal,
            target: typeof body.target === "string" ? body.target.trim() : void 0,
            budgetTokens: typeof body.budgetTokens === "number" ? body.budgetTokens : void 0,
            agent: typeof body.agent === "string" ? body.agent.trim() : void 0,
            contextPackId: typeof body.contextPackId === "string" ? body.contextPackId.trim() : void 0
          });
        } else if (action === "update") {
          const id = typeof body.id === "string" ? body.id.trim() : "";
          if (!id) {
            response.writeHead(400, { "content-type": "application/json" });
            response.end(JSON.stringify({ error: "Missing task id." }));
            return;
          }
          result = await updateMemoryTask(rootDir, id, {
            note: typeof body.note === "string" ? body.note : void 0,
            decision: typeof body.decision === "string" ? body.decision : void 0,
            changedPath: typeof body.changedPath === "string" ? body.changedPath : void 0,
            contextPackId: typeof body.contextPackId === "string" ? body.contextPackId : void 0,
            status: body.status === "active" || body.status === "blocked" || body.status === "completed" || body.status === "archived" ? body.status : void 0
          });
        } else if (action === "finish") {
          const id = typeof body.id === "string" ? body.id.trim() : "";
          const outcome = typeof body.outcome === "string" ? body.outcome.trim() : "";
          if (!id || !outcome) {
            response.writeHead(400, { "content-type": "application/json" });
            response.end(JSON.stringify({ error: "Missing task id or outcome." }));
            return;
          }
          result = await finishMemoryTask(rootDir, id, {
            outcome,
            followUp: typeof body.followUp === "string" ? body.followUp : void 0
          });
        } else {
          response.writeHead(400, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: "Invalid task action." }));
          return;
        }
        viewerEventBus.publish({
          type: "memory",
          level: "success",
          message: `Task ${action} completed.`
        });
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(result));
        return;
      }
      if (url.pathname === "/api/source/reload" && request.method === "POST") {
        const body = await readJsonBody(request);
        const result = await reloadManagedSources(rootDir, {
          id: typeof body.id === "string" ? body.id.trim() : void 0,
          all: body.all === true,
          compile: body.compile !== false,
          brief: body.brief !== false,
          guide: body.guide === true,
          review: body.review === true
        });
        viewerEventBus.publish({
          type: "ingest",
          level: "success",
          message: `Reloaded ${result.sources.length} managed source${result.sources.length === 1 ? "" : "s"}.`
        });
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(result));
        return;
      }
      if (url.pathname === "/api/page") {
        const relativePath2 = url.searchParams.get("path") ?? "";
        const page = await readViewerPage(rootDir, relativePath2);
        if (!page) {
          response.writeHead(404, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: `Page not found: ${relativePath2}` }));
          return;
        }
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(page));
        return;
      }
      if (url.pathname === "/api/asset") {
        const relativePath2 = url.searchParams.get("path") ?? "";
        const asset = await readViewerAsset(rootDir, relativePath2);
        if (!asset) {
          response.writeHead(404, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: `Asset not found: ${relativePath2}` }));
          return;
        }
        response.writeHead(200, { "content-type": asset.mimeType });
        response.end(asset.buffer);
        return;
      }
      if (url.pathname === "/api/reviews" && request.method === "GET") {
        const approvals = await listApprovals(rootDir);
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(approvals));
        return;
      }
      if (url.pathname === "/api/review" && request.method === "GET") {
        const approvalId = url.searchParams.get("id") ?? "";
        if (!approvalId) {
          response.writeHead(400, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: "Missing approval id." }));
          return;
        }
        const approval = await readApproval(rootDir, approvalId, { diff: true });
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(approval));
        return;
      }
      if (url.pathname === "/api/review" && request.method === "POST") {
        const body = await readJsonBody(request);
        const approvalId = typeof body.approvalId === "string" ? body.approvalId : "";
        const targets = Array.isArray(body.targets) ? body.targets.filter((item) => typeof item === "string") : [];
        const action = url.searchParams.get("action") ?? "";
        if (!approvalId || action !== "accept" && action !== "reject") {
          response.writeHead(400, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: "Missing approval id or invalid review action." }));
          return;
        }
        const result = action === "accept" ? await acceptApproval(rootDir, approvalId, targets) : await rejectApproval(rootDir, approvalId, targets);
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(result));
        return;
      }
      if (url.pathname === "/api/candidates" && request.method === "GET") {
        const candidates = await listCandidates(rootDir);
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(candidates));
        return;
      }
      if (url.pathname === "/api/memory-tasks" && request.method === "GET") {
        const tasks = await listMemoryTasks(rootDir);
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(tasks));
        return;
      }
      if (url.pathname === "/api/candidate" && request.method === "POST") {
        const body = await readJsonBody(request);
        const target2 = typeof body.target === "string" ? body.target : "";
        const action = url.searchParams.get("action") ?? "";
        if (!target2 || action !== "promote" && action !== "archive") {
          response.writeHead(400, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: "Missing candidate target or invalid candidate action." }));
          return;
        }
        const result = action === "promote" ? await promoteCandidate(rootDir, target2) : await archiveCandidate(rootDir, target2);
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(result));
        return;
      }
      if (url.pathname === "/api/lint") {
        try {
          const findings = await lintVault(rootDir);
          response.writeHead(200, { "content-type": "application/json" });
          response.end(JSON.stringify(toViewerLintFindings(findings)));
        } catch (error) {
          response.writeHead(200, { "content-type": "application/json" });
          response.end(JSON.stringify([]));
          console.warn(`[viewer] /api/lint failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        return;
      }
      if (url.pathname === "/api/workspace") {
        const reportPath = path11.join(paths.wikiDir, "graph", "report.json");
        const [graphRaw, reportRaw, approvalsRaw, candidatesRaw, memoryTasksRaw, watchStatusRaw, lintRaw, doctorRaw] = await Promise.all([
          readJsonFile(paths.graphPath).catch(() => null),
          readJsonFile(reportPath).catch(() => null),
          listApprovals(rootDir).catch(() => []),
          listCandidates(rootDir).catch(() => []),
          listMemoryTasks(rootDir).catch(() => []),
          getWatchStatus(rootDir).catch(() => ({ generatedAt: "", watchedRepoRoots: [], pendingSemanticRefresh: [] })),
          lintVault(rootDir).catch(() => []),
          doctorVault(rootDir).catch(() => null)
        ]);
        const viewerGraph = graphRaw ? buildViewerGraphArtifact(graphRaw, { report: reportRaw, full: options.full ?? false }) : null;
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            graph: viewerGraph,
            graphReport: reportRaw ?? null,
            approvals: approvalsRaw,
            candidates: candidatesRaw,
            memoryTasks: memoryTasksRaw,
            watchStatus: watchStatusRaw,
            doctor: doctorRaw,
            lintFindings: toViewerLintFindings(lintRaw)
          })
        );
        return;
      }
      if (url.pathname === "/api/events") {
        response.writeHead(200, {
          "content-type": "text/event-stream",
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive",
          "x-accel-buffering": "no"
        });
        const send = (event) => {
          response.write(`id: ${event.id}
`);
          response.write(`data: ${JSON.stringify(event)}

`);
        };
        send({
          id: randomUUID(),
          type: "connected",
          level: "info",
          message: "Activity stream connected.",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        const listener = (event) => send(event);
        viewerEventBus.on("event", listener);
        const heartbeat = setInterval(() => {
          response.write(`: keepalive ${(/* @__PURE__ */ new Date()).toISOString()}

`);
        }, 25e3);
        request.on("close", () => {
          clearInterval(heartbeat);
          viewerEventBus.off("event", listener);
        });
        return;
      }
      if (url.pathname === "/api/clip" && request.method === "POST") {
        const body = await readJsonBody(request);
        const clipUrl = typeof body.url === "string" ? body.url.trim() : "";
        const hasInlineClip = typeof body.markdown === "string" && body.markdown.trim().length > 0 || typeof body.selectionText === "string" && body.selectionText.trim().length > 0 || typeof body.selectionHtml === "string" && body.selectionHtml.trim().length > 0;
        if (!clipUrl && !hasInlineClip) {
          response.writeHead(400, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: "Missing url or clip content." }));
          return;
        }
        if (hasInlineClip || body.sourceMode === "inbox") {
          const clip = await writeInboxClip(rootDir, body);
          const imported = clip.result.imported[0];
          response.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
          response.end(
            JSON.stringify({
              ok: true,
              mode: clip.mode,
              inboxPath: clip.inboxPath,
              sourceId: imported?.sourceId,
              title: imported?.title ?? (typeof body.title === "string" ? body.title : "Browser Clip"),
              importedCount: clip.result.imported.length,
              skippedCount: clip.result.skipped.length
            })
          );
          return;
        }
        const captured = body.sourceMode === "add" ? (await addInput(rootDir, clipUrl)).manifest : await ingestInput(rootDir, clipUrl);
        response.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
        response.end(
          JSON.stringify({
            ok: true,
            mode: body.sourceMode === "add" ? "add" : "ingest",
            sourceId: captured.sourceId,
            title: captured.title
          })
        );
        return;
      }
      if (url.pathname === "/api/clip" && request.method === "OPTIONS") {
        response.writeHead(204, {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type"
        });
        response.end();
        return;
      }
      if (url.pathname === "/api/bookmarklet") {
        const script = `javascript:void((async()=>{const selection=String(getSelection()||'').trim();const payload={url:location.href,title:document.title,sourceMode:selection?'inbox':'add'};if(selection)payload.selectionText=selection;const response=await fetch('http://localhost:${effectivePort}/api/clip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok)throw new Error(data.error||response.statusText);alert('Clipped: '+(data.title||data.sourceId));})().catch(e=>alert('Clip failed: '+e.message)))`;
        response.writeHead(200, { "content-type": "text/html" });
        response.end(
          [
            "<!doctype html><html><head><title>SwarmVault Clipper</title></head><body>",
            "<h1>SwarmVault Clipper</h1>",
            `<p>Drag this link to your bookmarks bar:</p>`,
            `<p style="font-size:1.5em"><a href="${script.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">Clip to SwarmVault</a></p>`,
            `<p>When clicked on any page, it sends the URL to your running SwarmVault instance for ingestion.</p>`,
            `<p>Server: <code>http://localhost:${effectivePort}</code></p>`,
            "</body></html>"
          ].join("\n")
        );
        return;
      }
      const relativePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const target = path11.join(paths.viewerDistDir, relativePath);
      const fallback = path11.join(paths.viewerDistDir, "index.html");
      const filePath = await fileExists(target) ? target : fallback;
      if (!await fileExists(filePath)) {
        response.writeHead(503, { "content-type": "text/plain" });
        response.end("Viewer build not found. Run `pnpm build` first.");
        return;
      }
      const staticBody = await fs11.readFile(filePath);
      response.writeHead(200, { "content-type": mime.lookup(filePath) || "text/plain" });
      response.end(staticBody);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[viewer] ${request.method ?? "GET"} ${url.pathname} failed: ${message}`);
      if (!response.headersSent) {
        const status = /not found|could not resolve|cannot resolve/i.test(message) ? 404 : 500;
        response.writeHead(status, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: message }));
      } else {
        response.end();
      }
    }
  });
  await new Promise((resolve) => {
    server.listen(effectivePort, resolve);
  });
  return {
    port: effectivePort,
    close: async () => {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  };
}
async function exportGraphHtml(rootDir, outputPath, options = {}) {
  const { paths } = await loadVaultConfig(rootDir);
  const graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    throw new Error("Graph artifact not found. Run `swarmvault compile` first.");
  }
  await ensureViewerDist(paths.viewerDistDir);
  const indexPath = path11.join(paths.viewerDistDir, "index.html");
  if (!await fileExists(indexPath)) {
    throw new Error("Viewer build not found. Run `pnpm build` first.");
  }
  const pages = await Promise.all(
    graph.pages.map(async (page) => {
      const loaded = await readViewerPage(rootDir, page.path);
      return loaded ? {
        pageId: page.id,
        path: loaded.path,
        title: loaded.title,
        kind: page.kind,
        status: page.status,
        sourceType: page.sourceType,
        sourceClass: page.sourceClass,
        projectIds: page.projectIds,
        content: loaded.content,
        assets: await Promise.all(
          loaded.assets.map(async (asset) => ({
            ...asset,
            dataUrl: await assetDataUrl(rootDir, asset.path)
          }))
        )
      } : null;
    })
  );
  const rawHtml = await fs11.readFile(indexPath, "utf8");
  const scriptMatch = rawHtml.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
  const styleMatch = rawHtml.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
  const scriptPath = scriptMatch?.[1] ? path11.join(paths.viewerDistDir, scriptMatch[1].replace(/^\//, "")) : null;
  const stylePath = styleMatch?.[1] ? path11.join(paths.viewerDistDir, styleMatch[1].replace(/^\//, "")) : null;
  if (!scriptPath || !await fileExists(scriptPath)) {
    throw new Error("Viewer script bundle not found. Run `pnpm build` first.");
  }
  const script = await fs11.readFile(scriptPath, "utf8");
  const style = stylePath && await fileExists(stylePath) ? await fs11.readFile(stylePath, "utf8") : "";
  const report = await readJsonFile(path11.join(paths.wikiDir, "graph", "report.json"));
  const embeddedData = JSON.stringify(
    { graph: buildViewerGraphArtifact(graph, { report, full: options.full ?? false }), pages: pages.filter(Boolean), report },
    null,
    2
  ).replace(/</g, "\\u003c");
  const html = [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    "    <title>SwarmVault Graph Export</title>",
    style ? `    <style>${style}</style>` : "",
    "  </head>",
    "  <body>",
    '    <div id="root"></div>',
    `    <script>window.__SWARMVAULT_EMBEDDED_DATA__ = ${embeddedData};</script>`,
    `    <script type="module">${script}</script>`,
    "  </body>",
    "</html>",
    ""
  ].filter(Boolean).join("\n");
  await fs11.mkdir(path11.dirname(outputPath), { recursive: true });
  await fs11.writeFile(outputPath, html, "utf8");
  return path11.resolve(outputPath);
}
export {
  ALL_MIGRATIONS,
  DEFAULT_CONSOLIDATION_CONFIG,
  DEFAULT_HALF_LIFE_DAYS,
  DEFAULT_HALF_LIFE_DAYS_BY_SOURCE_CLASS,
  DEFAULT_PROMOTION_CONFIG,
  DEFAULT_REDACTION_PATTERNS,
  DEFAULT_STALE_THRESHOLD,
  LARGE_REPO_NODE_THRESHOLD,
  LOCAL_WHISPER_MODEL_SIZES,
  LocalWhisperProviderAdapter,
  OPENAI_COMPATIBLE_CAPABILITY_MATRIX,
  acceptApproval,
  addInput,
  addManagedSource,
  addWatchedRoot,
  applyDecayToPages,
  archiveCandidate,
  assertProviderCapability,
  autoCommitWikiChanges,
  benchmarkVault,
  blastRadius,
  blastRadiusVault,
  bootstrapDemo,
  buildConfiguredRedactor,
  buildContextPack,
  buildGraphShareArtifact,
  buildMemoryGraphElements,
  buildRedactor,
  compileVault,
  computeDecayScore,
  consolidateVault,
  createMcpServer,
  createProvider,
  createSupersessionEdge,
  createWebSearchAdapter,
  defaultVaultConfig,
  defaultVaultSchema,
  deleteContextPack,
  deleteManagedSource,
  detectVaultVersion,
  discoverLocalWhisperBinary,
  doctorRetrieval,
  doctorVault,
  downloadWhisperModel,
  ensureMemoryLedger,
  estimatePageTokens,
  estimateTokens,
  evaluateCandidateForPromotion,
  expectedModelPath,
  explainGraphVault,
  exploreVault,
  exportGraphFormat,
  exportGraphHtml,
  exportGraphReportHtml,
  exportObsidianCanvas,
  exportObsidianVault,
  finishMemoryTask,
  getGitHookStatus,
  getGraphCommunityVault,
  getProviderForTask,
  getRetrievalStatus,
  getWatchStatus,
  getWebSearchAdapterForTask,
  getWorkspaceInfo,
  graphDiff,
  graphStatsVault,
  guideManagedSource,
  guideSourceScope,
  importInbox,
  ingestDirectory,
  ingestInput,
  ingestInputDetailed,
  initVault,
  initWorkspace,
  installAgent,
  installConfiguredAgents,
  installGitHooks,
  lintVault,
  listApprovals,
  listCandidates,
  listContextPacks,
  listGodNodes,
  listGraphHyperedges,
  listManagedSourceRecords,
  listManifests,
  listMemoryTasks,
  listPages,
  listSchedules,
  listTrackedRepoRoots,
  listWatchedRoots,
  loadMemoryTaskPages,
  loadVaultConfig,
  loadVaultSchema,
  loadVaultSchemas,
  lookupPresetCapabilities,
  markSuperseded,
  memoryTaskHashes,
  modelDownloadUrl,
  pathGraphVault,
  persistDecayFrontmatter,
  planMigration,
  previewCandidatePromotions,
  promoteCandidate,
  pushGraphNeo4j,
  queryGraphVault,
  queryVault,
  readApproval,
  readContextPack,
  readExtractedText,
  readGraphReport,
  readMemoryTask,
  readPage,
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
  renderGraphSharePreviewHtml,
  renderGraphShareSvg,
  renderMemoryTaskMarkdown,
  resetDecay,
  resolveConsolidationConfig,
  resolveDecayConfig,
  resolveLargeRepoDefaults,
  resolvePaths,
  resolveRedactionPatterns,
  resolveRetrievalConfig,
  resolveWatchedRepoRoots,
  resumeMemoryTask,
  resumeSourceSession,
  reviewManagedSource,
  reviewSourceScope,
  runAutoPromotion,
  runConsolidation,
  runDecayPass,
  runMigration,
  runSchedule,
  runWatchCycle,
  searchVault,
  serveSchedules,
  stageGeneratedOutputPages,
  startGraphServer,
  startMcpServer,
  startMemoryTask,
  summarizeLocalWhisperSetup,
  syncTrackedRepos,
  syncTrackedReposForWatch,
  synthesizeHyperedgeHubs,
  trimToTokenBudget,
  uninstallGitHooks,
  updateMemoryTask,
  watchVault,
  withCapabilityFallback,
  writeRetrievalManifest
};

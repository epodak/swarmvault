import {
  PRIMARY_SCHEMA_FILENAME,
  appendJsonLine,
  createProvider,
  defaultVaultSchema,
  ensureDir,
  fileExists,
  firstSentences,
  getProviderForTask,
  initWorkspace,
  isPathWithin,
  listFilesRecursive,
  loadVaultConfig,
  normalizeWhitespace,
  readJsonFile,
  sha256,
  slugify,
  toPosix,
  truncate,
  uniqueBy,
  writeFileIfChanged,
  writeJsonFile
} from "./chunk-R5T7AGVB.js";
import {
  estimateTokens
} from "./chunk-NAIERP4C.js";

// src/memory.ts
import fs20 from "fs/promises";
import path25 from "path";
import matter13 from "gray-matter";
import { z as z8 } from "zod";

// src/context-packs.ts
import fs19 from "fs/promises";
import path24 from "path";
import matter12 from "gray-matter";

// src/logs.ts
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
async function resolveUniqueSessionPath(rootDir, operation, title, startedAt) {
  const { paths } = await initWorkspace(rootDir);
  await ensureDir(paths.sessionsDir);
  const timestamp = startedAt.replace(/[:.]/g, "-");
  const baseName = `${timestamp}-${operation}-${slugify(title)}`;
  let candidate = path.join(paths.sessionsDir, `${baseName}.md`);
  let counter = 2;
  while (await fileExists(candidate)) {
    candidate = path.join(paths.sessionsDir, `${baseName}-${counter}.md`);
    counter++;
  }
  return candidate;
}
async function appendLogEntry(rootDir, action, title, lines = []) {
  const { paths } = await initWorkspace(rootDir);
  await ensureDir(paths.wikiDir);
  const logPath = path.join(paths.wikiDir, "log.md");
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ");
  const entry = [`## [${timestamp}] ${action} | ${title}`, ...lines.map((line) => `- ${line}`), ""].join("\n");
  const existing = await fileExists(logPath) ? await fs.readFile(logPath, "utf8") : "# Log\n\n";
  await fs.writeFile(logPath, `${existing}${entry}
`, "utf8");
}
async function recordSession(rootDir, input) {
  const { paths } = await initWorkspace(rootDir);
  await ensureDir(paths.wikiDir);
  const startedAtIso = new Date(input.startedAt).toISOString();
  const finishedAtIso = new Date(input.finishedAt ?? input.startedAt).toISOString();
  const durationMs = Math.max(0, new Date(finishedAtIso).getTime() - new Date(startedAtIso).getTime());
  const sessionPath = await resolveUniqueSessionPath(rootDir, input.operation, input.title, startedAtIso);
  const sessionId = path.basename(sessionPath, ".md");
  const relativeSessionPath = path.relative(rootDir, sessionPath).split(path.sep).join(path.posix.sep);
  const frontmatter = Object.fromEntries(
    Object.entries({
      session_id: sessionId,
      operation: input.operation,
      title: input.title,
      started_at: startedAtIso,
      finished_at: finishedAtIso,
      duration_ms: durationMs,
      provider: input.providerId,
      success: input.success ?? true,
      error: input.error,
      related_source_ids: input.relatedSourceIds ?? [],
      related_page_ids: input.relatedPageIds ?? [],
      related_node_ids: input.relatedNodeIds ?? [],
      changed_pages: input.changedPages ?? [],
      citations: input.citations ?? [],
      lint_finding_count: input.lintFindingCount,
      token_usage: input.tokenUsage
    }).filter(([, value]) => value !== void 0)
  );
  const content = matter.stringify(
    [
      `# ${input.operation[0]?.toUpperCase() ?? ""}${input.operation.slice(1)} Session`,
      "",
      `Title: ${input.title}`,
      "",
      "## Summary",
      "",
      ...input.lines?.length ? input.lines.map((line) => `- ${line}`) : ["- No additional notes recorded."],
      "",
      "## Related",
      "",
      `- Sources: ${(input.relatedSourceIds ?? []).join(", ") || "none"}`,
      `- Pages: ${(input.relatedPageIds ?? []).join(", ") || "none"}`,
      `- Nodes: ${(input.relatedNodeIds ?? []).join(", ") || "none"}`,
      `- Changed pages: ${(input.changedPages ?? []).join(", ") || "none"}`,
      `- Citations: ${(input.citations ?? []).join(", ") || "none"}`,
      input.lintFindingCount === void 0 ? void 0 : `- Lint findings: ${input.lintFindingCount}`,
      input.providerId ? `- Provider: ${input.providerId}` : void 0,
      input.success === void 0 ? void 0 : `- Success: ${input.success}`,
      input.error ? `- Error: ${input.error}` : void 0,
      input.tokenUsage?.inputTokens !== void 0 || input.tokenUsage?.outputTokens !== void 0 ? `- Tokens: in=${input.tokenUsage?.inputTokens ?? "n/a"}, out=${input.tokenUsage?.outputTokens ?? "n/a"}` : void 0,
      ""
    ].filter((line) => Boolean(line)).join("\n"),
    frontmatter
  );
  await writeFileIfChanged(sessionPath, content);
  const logPath = path.join(paths.wikiDir, "log.md");
  const timestamp = startedAtIso.slice(0, 19).replace("T", " ");
  const entry = [
    `## [${timestamp}] ${input.operation} | ${input.title}`,
    `- session: \`${relativeSessionPath}\``,
    ...(input.lines ?? []).map((line) => `- ${line}`),
    ""
  ].join("\n");
  const existing = await fileExists(logPath) ? await fs.readFile(logPath, "utf8") : "# Log\n\n";
  await fs.writeFile(logPath, `${existing}${entry}
`, "utf8");
  return { sessionPath, sessionId };
}
async function appendWatchRun(rootDir, run) {
  const { paths } = await initWorkspace(rootDir);
  await appendJsonLine(paths.jobsLogPath, run);
}

// src/vault.ts
import fs18 from "fs/promises";
import path23 from "path";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import matter11 from "gray-matter";
import { z as z7 } from "zod";

// src/agents.ts
import crypto from "crypto";
import fs2 from "fs/promises";
import os from "os";
import path2 from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";
function resolveHooksDir() {
  const moduleUrl = import.meta.url;
  const modulePath = fileURLToPath(moduleUrl);
  const moduleDir = path2.dirname(modulePath);
  if (moduleDir.endsWith(`${path2.sep}dist`)) {
    return path2.join(moduleDir, "hooks");
  }
  if (moduleDir.endsWith(`${path2.sep}src`)) {
    return path2.resolve(moduleDir, "..", "dist", "hooks");
  }
  return path2.resolve(moduleDir, "hooks");
}
var BUILT_HOOKS_DIR = resolveHooksDir();
var hookContentCache = /* @__PURE__ */ new Map();
async function readBuiltHook(hookFile) {
  const cached = hookContentCache.get(hookFile);
  if (cached !== void 0) {
    return cached;
  }
  const hookPath = path2.join(BUILT_HOOKS_DIR, hookFile);
  try {
    const content = await fs2.readFile(hookPath, "utf8");
    hookContentCache.set(hookFile, content);
    return content;
  } catch (error) {
    throw new Error(
      `SwarmVault hook bundle not found at ${hookPath}. Run 'pnpm --filter @swarmvaultai/engine build' so the hook scripts are emitted to dist/hooks/. Underlying error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
var managedStart = "<!-- swarmvault:managed:start -->";
var managedEnd = "<!-- swarmvault:managed:end -->";
var legacyManagedStart = "<!-- vault:managed:start -->";
var legacyManagedEnd = "<!-- vault:managed:end -->";
var claudeSearchMatcher = "Glob|Grep";
var claudeSessionMatchers = ["startup", "resume", "clear", "compact"];
var geminiSessionMatcher = "startup";
var geminiSearchMatcher = "glob|grep|search|find";
var copilotHookVersion = 1;
var codexSearchMatcher = "Bash";
var agentFileKinds = {
  agents: "AGENTS.md",
  claude: "CLAUDE.md",
  gemini: "GEMINI.md",
  cursor: ".cursor/rules/swarmvault.mdc",
  aider: "CONVENTIONS.md",
  copilot: ".github/copilot-instructions.md",
  trae: ".trae/rules/swarmvault.md",
  claw: ".claw/skills/swarmvault/SKILL.md",
  droid: ".factory/rules/swarmvault.md",
  kiro: ".kiro/skills/swarmvault/SKILL.md",
  kiroSteering: ".kiro/steering/swarmvault.md",
  antigravityRules: ".agent/rules/swarmvault.md",
  antigravityWorkflow: ".agent/workflows/swarmvault.md",
  vscode: ".github/chatmodes/swarmvault.chatmode.md"
};
var SKILL_BUNDLE_AGENTS = {
  amp: ".config/agents/skills",
  augment: ".augment/skills",
  adal: ".adal/skills",
  bob: ".bob/skills",
  cline: ".agents/skills",
  codebuddy: ".codebuddy/skills",
  "command-code": ".commandcode/skills",
  continue: ".continue/skills",
  cortex: ".snowflake/cortex/skills",
  crush: ".config/crush/skills",
  deepagents: ".deepagents/agent/skills",
  firebender: ".firebender/skills",
  iflow: ".iflow/skills",
  junie: ".junie/skills",
  "kilo-code": ".kilocode/skills",
  kimi: ".config/agents/skills",
  kode: ".kode/skills",
  mcpjam: ".mcpjam/skills",
  "mistral-vibe": ".vibe/skills",
  mux: ".mux/skills",
  neovate: ".neovate/skills",
  openclaw: ".openclaw/skills",
  openhands: ".openhands/skills",
  pochi: ".pochi/skills",
  qoder: ".qoder/skills",
  "qwen-code": ".qwen/skills",
  replit: ".config/agents/skills",
  "roo-code": ".roo/skills",
  "trae-cn": ".trae-cn/skills",
  warp: ".agents/skills",
  windsurf: ".codeium/windsurf/skills",
  zencoder: ".zencoder/skills"
};
function skillBundleTarget(rootDir, agent) {
  const relativeSkillsDir = SKILL_BUNDLE_AGENTS[agent];
  if (!relativeSkillsDir) return null;
  return path2.join(rootDir, relativeSkillsDir, "swarmvault", "SKILL.md");
}
var hermesUserSkillRelative = path2.join(".hermes", "skills", "swarmvault", "SKILL.md");
function hermesUserSkillPath() {
  return path2.join(os.homedir(), hermesUserSkillRelative);
}
var SWARMVAULT_RULE_BULLETS = [
  "- Read `swarmvault.schema.md` before compile or query style work. It is the canonical schema path.",
  "- Treat `raw/` as immutable source input.",
  "- Treat `wiki/` as generated markdown owned by the agent and compiler workflow.",
  "- Read `wiki/graph/report.md` before broad file searching when it exists; otherwise start with `wiki/index.md`.",
  "- For graph questions, prefer `swarmvault graph query`, `swarmvault graph path`, and `swarmvault graph explain` before broad grep/glob searching.",
  "- Preserve frontmatter fields including `page_id`, `source_ids`, `node_ids`, `freshness`, and `source_hashes`.",
  "- Save high-value answers back into `wiki/outputs/` instead of leaving them only in chat.",
  "- Prefer `swarmvault ingest`, `swarmvault compile`, `swarmvault query`, and `swarmvault lint` for SwarmVault maintenance tasks."
];
function buildManagedBlock(target) {
  const heading = target === "aider" ? "# SwarmVault Conventions" : target === "copilot" ? "# SwarmVault Repository Instructions" : "# SwarmVault Rules";
  return [managedStart, heading, "", ...SWARMVAULT_RULE_BULLETS, managedEnd, ""].join("\n");
}
function buildSkillFrontmatter() {
  const frontmatter = YAML.stringify({
    name: "swarmvault",
    description: "SwarmVault graph-first workflow. Use to read the compiled wiki and query the knowledge graph before broad file search."
  }).trimEnd();
  return ["---", frontmatter, "---"].join("\n");
}
function buildSkillBody() {
  return [
    "# SwarmVault",
    "",
    "SwarmVault compiles curated sources in `raw/` into a queryable wiki in `wiki/` and a knowledge graph in `state/graph.json`.",
    "",
    "## Rules",
    "",
    ...SWARMVAULT_RULE_BULLETS,
    "",
    "## Entry points",
    "",
    "- `swarmvault ingest <path>` \u2014 register a new source",
    "- `swarmvault compile` \u2014 refresh wiki pages and graph",
    '- `swarmvault query "<question>"` \u2014 save-first multi-step query',
    "- `swarmvault graph query|path|explain` \u2014 deterministic graph traversal",
    "- `swarmvault lint` \u2014 wiki health and contradiction checks",
    ""
  ].join("\n");
}
function buildStandaloneSkillFile() {
  return `${buildSkillFrontmatter()}

${buildSkillBody()}`;
}
function buildKiroSteeringFile() {
  const frontmatter = YAML.stringify({
    inclusion: "always",
    description: "Always-on SwarmVault rules."
  }).trimEnd();
  return ["---", frontmatter, "---", "", "# SwarmVault Rules", "", ...SWARMVAULT_RULE_BULLETS, ""].join("\n");
}
function buildAntigravityRulesFile() {
  const frontmatter = YAML.stringify({
    alwaysApply: true,
    description: "SwarmVault graph-first repository rules."
  }).trimEnd();
  return [
    "---",
    frontmatter,
    "---",
    "",
    "# SwarmVault Rules",
    "",
    ...SWARMVAULT_RULE_BULLETS,
    "",
    "> MCP navigation hint: SwarmVault exposes a local MCP server via `swarmvault mcp`. Wire it into your Antigravity MCP config to query the graph without shelling out."
  ].join("\n");
}
function buildAntigravityWorkflowFile() {
  const frontmatter = YAML.stringify({
    command: "swarmvault",
    description: "Compile, query, and lint the SwarmVault vault."
  }).trimEnd();
  return [
    "---",
    frontmatter,
    "---",
    "",
    "# /swarmvault",
    "",
    "Run SwarmVault against the current directory.",
    "",
    "## Steps",
    "",
    "1. If no vault exists, run `swarmvault init`.",
    "2. For new sources, run `swarmvault ingest <path>`.",
    "3. Run `swarmvault compile` to refresh the wiki and graph.",
    "4. For follow-up questions, prefer `swarmvault query`, `swarmvault graph query`, `swarmvault graph path`, `swarmvault graph explain`.",
    "5. Save high-value answers to `wiki/outputs/`.",
    ""
  ].join("\n");
}
function buildVscodeChatmodeFile() {
  const frontmatter = YAML.stringify({
    description: "SwarmVault graph-first workflow for VS Code Copilot Chat.",
    tools: ["codebase", "terminal"]
  }).trimEnd();
  return [
    "---",
    frontmatter,
    "---",
    "",
    "# SwarmVault mode",
    "",
    "You are working inside a SwarmVault vault. Follow these rules before other actions:",
    "",
    ...SWARMVAULT_RULE_BULLETS,
    "",
    "Use the terminal tool to run `swarmvault` commands. Prefer graph queries over broad grep/glob.",
    ""
  ].join("\n");
}
function buildCursorRule() {
  const frontmatter = YAML.stringify({
    description: "SwarmVault graph-first repository instructions.",
    alwaysApply: true
  }).trimEnd();
  return ["---", frontmatter, "---", "", buildManagedBlock("cursor").trimEnd(), ""].join("\n");
}
function supportsAgentHook(agent) {
  return agent === "codex" || agent === "claude" || agent === "opencode" || agent === "gemini" || agent === "copilot";
}
function primaryTargetPathForAgent(rootDir, agent) {
  switch (agent) {
    case "codex":
    case "goose":
    case "pi":
    case "opencode":
      return path2.join(rootDir, agentFileKinds.agents);
    case "claude":
      return path2.join(rootDir, agentFileKinds.claude);
    case "gemini":
      return path2.join(rootDir, agentFileKinds.gemini);
    case "cursor":
      return path2.join(rootDir, agentFileKinds.cursor);
    case "aider":
      return path2.join(rootDir, agentFileKinds.aider);
    case "copilot":
      return path2.join(rootDir, agentFileKinds.copilot);
    case "trae":
      return path2.join(rootDir, agentFileKinds.trae);
    case "claw":
      return path2.join(rootDir, agentFileKinds.claw);
    case "droid":
      return path2.join(rootDir, agentFileKinds.droid);
    case "kiro":
      return path2.join(rootDir, agentFileKinds.kiro);
    case "hermes":
      return hermesUserSkillPath();
    case "antigravity":
      return path2.join(rootDir, agentFileKinds.antigravityRules);
    case "vscode":
      return path2.join(rootDir, agentFileKinds.vscode);
    default: {
      const bundleTarget = skillBundleTarget(rootDir, agent);
      if (bundleTarget) return bundleTarget;
      throw new Error(`Unsupported agent ${String(agent)}`);
    }
  }
}
function hookScriptPathForAgent(rootDir, agent) {
  switch (agent) {
    case "codex":
      return path2.join(rootDir, ".codex", "hooks", "swarmvault-graph-first.js");
    case "claude":
      return path2.join(rootDir, ".claude", "hooks", "swarmvault-graph-first.js");
    case "opencode":
      return path2.join(rootDir, ".opencode", "plugins", "swarmvault-graph-first.js");
    case "gemini":
      return path2.join(rootDir, ".gemini", "hooks", "swarmvault-graph-first.js");
    case "copilot":
      return path2.join(rootDir, ".github", "hooks", "swarmvault-graph-first.js");
    default:
      return null;
  }
}
function hookConfigPathForAgent(rootDir, agent) {
  switch (agent) {
    case "codex":
      return path2.join(rootDir, ".codex", "hooks.json");
    case "claude":
      return path2.join(rootDir, ".claude", "settings.json");
    case "gemini":
      return path2.join(rootDir, ".gemini", "settings.json");
    case "copilot":
      return path2.join(rootDir, ".github", "hooks", "swarmvault-graph-first.json");
    default:
      return null;
  }
}
function targetsForAgent(rootDir, agent, options = {}) {
  const targets = [primaryTargetPathForAgent(rootDir, agent)];
  if (agent === "copilot") {
    targets.push(path2.join(rootDir, agentFileKinds.agents));
  }
  if (agent === "vscode") {
    targets.push(path2.join(rootDir, agentFileKinds.copilot));
  }
  if (agent === "aider") {
    targets.push(path2.join(rootDir, ".aider.conf.yml"));
  }
  if (agent === "kiro") {
    targets.push(path2.join(rootDir, agentFileKinds.kiroSteering));
  }
  if (agent === "hermes") {
    targets.push(path2.join(rootDir, agentFileKinds.agents));
  }
  if (agent === "antigravity") {
    targets.push(path2.join(rootDir, agentFileKinds.antigravityWorkflow));
  }
  if (options.hook && supportsAgentHook(agent)) {
    const configPath = hookConfigPathForAgent(rootDir, agent);
    const scriptPath = hookScriptPathForAgent(rootDir, agent);
    if (configPath) {
      targets.push(configPath);
    }
    if (scriptPath) {
      targets.push(scriptPath);
    }
  }
  return [...new Set(targets)];
}
async function upsertManagedBlock(filePath, block) {
  const existing = await fileExists(filePath) ? await fs2.readFile(filePath, "utf8") : "";
  if (!existing) {
    await ensureDir(path2.dirname(filePath));
    await fs2.writeFile(filePath, `${block}
`, "utf8");
    return;
  }
  const startIndex = existing.includes(managedStart) ? existing.indexOf(managedStart) : existing.indexOf(legacyManagedStart);
  const endIndex = existing.includes(managedEnd) ? existing.indexOf(managedEnd) : existing.indexOf(legacyManagedEnd);
  if (startIndex !== -1 && endIndex !== -1) {
    const next = `${existing.slice(0, startIndex)}${block}${existing.slice(endIndex + managedEnd.length)}`;
    await fs2.writeFile(filePath, next, "utf8");
    return;
  }
  await fs2.writeFile(filePath, `${existing.trimEnd()}

${block}
`, "utf8");
}
async function writeOwnedFile(filePath, content, executable = false) {
  await ensureDir(path2.dirname(filePath));
  await fs2.writeFile(filePath, content, {
    encoding: "utf8",
    mode: executable ? 493 : 420
  });
  if (executable) {
    await fs2.chmod(filePath, 493);
  }
}
async function readJsonWithWarnings(filePath, fallback, label) {
  if (!await fileExists(filePath)) {
    return { data: fallback, warnings: [] };
  }
  try {
    const parsed = JSON.parse(await fs2.readFile(filePath, "utf8"));
    return { data: parsed, warnings: [] };
  } catch {
    return {
      data: fallback,
      warnings: [`Could not parse ${label}. Left the existing file unchanged.`]
    };
  }
}
async function installClaudeHook(rootDir) {
  const settingsPath = path2.join(rootDir, ".claude", "settings.json");
  const scriptPath = path2.join(rootDir, ".claude", "hooks", "swarmvault-graph-first.js");
  await writeOwnedFile(scriptPath, await readBuiltHook("claude.js"), true);
  await ensureDir(path2.dirname(settingsPath));
  const { data: settings, warnings } = await readJsonWithWarnings(settingsPath, {}, ".claude/settings.json");
  if (warnings.length > 0 && await fileExists(settingsPath)) {
    return { path: settingsPath, warnings };
  }
  const hooks = settings.hooks ?? {};
  const sessionStart = hooks.SessionStart ?? [];
  const preToolUse = hooks.PreToolUse ?? [];
  const sessionCommand = 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/swarmvault-graph-first.js" session-start';
  const preToolUseCommand = 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/swarmvault-graph-first.js" pre-tool-use';
  for (const matcher of claudeSessionMatchers) {
    if (!sessionStart.some((entry) => entry.matcher === matcher && JSON.stringify(entry).includes("swarmvault-graph-first.js"))) {
      sessionStart.push({
        matcher,
        hooks: [{ type: "command", command: sessionCommand }]
      });
    }
  }
  if (!preToolUse.some((entry) => entry.matcher === claudeSearchMatcher && JSON.stringify(entry).includes("swarmvault-graph-first.js"))) {
    preToolUse.push({
      matcher: claudeSearchMatcher,
      hooks: [{ type: "command", command: preToolUseCommand }]
    });
  }
  settings.hooks = { ...hooks, SessionStart: sessionStart, PreToolUse: preToolUse };
  await fs2.writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}
`, "utf8");
  return { path: settingsPath, warnings: [] };
}
async function installGeminiHook(rootDir) {
  const settingsPath = path2.join(rootDir, ".gemini", "settings.json");
  const scriptPath = path2.join(rootDir, ".gemini", "hooks", "swarmvault-graph-first.js");
  await writeOwnedFile(scriptPath, await readBuiltHook("gemini.js"), true);
  const { data: settings, warnings } = await readJsonWithWarnings(settingsPath, {}, ".gemini/settings.json");
  if (warnings.length > 0 && await fileExists(settingsPath)) {
    return { paths: [settingsPath, scriptPath], warnings };
  }
  const hooks = settings.hooks ?? {};
  const sessionStart = hooks.SessionStart ?? [];
  const beforeTool = hooks.BeforeTool ?? [];
  const sessionCommand = "node .gemini/hooks/swarmvault-graph-first.js session-start";
  const beforeToolCommand = "node .gemini/hooks/swarmvault-graph-first.js before-tool";
  if (!sessionStart.some((entry) => entry.matcher === geminiSessionMatcher && JSON.stringify(entry).includes("swarmvault-graph-first.js"))) {
    sessionStart.push({
      matcher: geminiSessionMatcher,
      hooks: [{ name: "swarmvault-graph-first", type: "command", command: sessionCommand }]
    });
  }
  if (!beforeTool.some((entry) => entry.matcher === geminiSearchMatcher && JSON.stringify(entry).includes("swarmvault-graph-first.js"))) {
    beforeTool.push({
      matcher: geminiSearchMatcher,
      hooks: [{ name: "swarmvault-graph-first", type: "command", command: beforeToolCommand }]
    });
  }
  settings.hooks = {
    ...hooks,
    SessionStart: sessionStart,
    BeforeTool: beforeTool
  };
  await writeOwnedFile(settingsPath, `${JSON.stringify(settings, null, 2)}
`);
  return { paths: [settingsPath, scriptPath], warnings: [] };
}
async function installCodexHook(rootDir) {
  const settingsPath = path2.join(rootDir, ".codex", "hooks.json");
  const scriptPath = path2.join(rootDir, ".codex", "hooks", "swarmvault-graph-first.js");
  await writeOwnedFile(scriptPath, await readBuiltHook("codex.js"), true);
  const { data: settings, warnings } = await readJsonWithWarnings(settingsPath, {}, ".codex/hooks.json");
  if (warnings.length > 0 && await fileExists(settingsPath)) {
    return { paths: [settingsPath, scriptPath], warnings };
  }
  const hooks = settings.hooks ?? {};
  const sessionStart = hooks.SessionStart ?? [];
  const preToolUse = hooks.PreToolUse ?? [];
  const sessionCommand = "node .codex/hooks/swarmvault-graph-first.js session-start";
  const preToolUseCommand = "node .codex/hooks/swarmvault-graph-first.js pre-tool-use";
  if (!sessionStart.some((entry) => JSON.stringify(entry).includes("swarmvault-graph-first.js"))) {
    sessionStart.push({
      hooks: [{ type: "command", command: sessionCommand }]
    });
  }
  if (!preToolUse.some((entry) => entry.matcher === codexSearchMatcher && JSON.stringify(entry).includes("swarmvault-graph-first.js"))) {
    preToolUse.push({
      matcher: codexSearchMatcher,
      hooks: [{ type: "command", command: preToolUseCommand }]
    });
  }
  settings.hooks = {
    ...hooks,
    SessionStart: sessionStart,
    PreToolUse: preToolUse
  };
  await writeOwnedFile(settingsPath, `${JSON.stringify(settings, null, 2)}
`);
  return { paths: [settingsPath, scriptPath], warnings: [] };
}
async function mergeAiderConfig(rootDir) {
  const configPath = path2.join(rootDir, ".aider.conf.yml");
  const readTarget = "CONVENTIONS.md";
  if (!await fileExists(configPath)) {
    const document = new YAML.Document();
    document.set("read", [readTarget]);
    await writeOwnedFile(configPath, `${document.toString()}`);
    return { path: configPath, warnings: [] };
  }
  try {
    const source = await fs2.readFile(configPath, "utf8");
    const document = YAML.parseDocument(source);
    if (document.errors.length > 0) {
      return {
        path: configPath,
        warnings: ["Could not parse .aider.conf.yml. Left the existing file unchanged; add `read: CONVENTIONS.md` manually."]
      };
    }
    const currentRead = document.get("read", true);
    const values = typeof currentRead === "string" ? [currentRead] : Array.isArray(currentRead) ? currentRead.filter((item) => typeof item === "string") : [];
    if (!values.includes(readTarget)) {
      document.set("read", [...values, readTarget]);
      await writeOwnedFile(configPath, `${document.toString()}`);
    }
    return { path: configPath, warnings: [] };
  } catch {
    return {
      path: configPath,
      warnings: ["Could not parse .aider.conf.yml. Left the existing file unchanged; add `read: CONVENTIONS.md` manually."]
    };
  }
}
async function installCopilotHook(rootDir) {
  const hooksDir = path2.join(rootDir, ".github", "hooks");
  const scriptPath = path2.join(hooksDir, "swarmvault-graph-first.js");
  const configPath = path2.join(hooksDir, "swarmvault-graph-first.json");
  await writeOwnedFile(scriptPath, await readBuiltHook("copilot.js"), true);
  const config = {
    version: copilotHookVersion,
    hooks: {
      sessionStart: [
        {
          type: "command",
          bash: "node .github/hooks/swarmvault-graph-first.js session-start",
          powershell: "node .github/hooks/swarmvault-graph-first.js session-start",
          cwd: ".",
          timeoutSec: 10
        }
      ],
      preToolUse: [
        {
          matcher: "glob|grep",
          type: "command",
          bash: "node .github/hooks/swarmvault-graph-first.js pre-tool-use",
          powershell: "node .github/hooks/swarmvault-graph-first.js pre-tool-use",
          cwd: ".",
          timeoutSec: 10
        }
      ]
    }
  };
  await writeOwnedFile(configPath, `${JSON.stringify(config, null, 2)}
`);
  return { paths: [configPath, scriptPath], warnings: [] };
}
async function installOpenCodeHook(rootDir) {
  const pluginPath = path2.join(rootDir, ".opencode", "plugins", "swarmvault-graph-first.js");
  await writeOwnedFile(pluginPath, await readBuiltHook("opencode.js"));
  return { paths: [pluginPath], warnings: [] };
}
function stableKeyForAgent(rootDir, agent) {
  if (agent === "codex" || agent === "goose" || agent === "pi") {
    return `shared:${path2.join(rootDir, agentFileKinds.agents)}`;
  }
  return `${agent}:${crypto.createHash("sha1").update(targetsForAgent(rootDir, agent, { hook: supportsAgentHook(agent) }).join("\n")).digest("hex")}`;
}
async function installAgent(rootDir, agent, options = {}) {
  await initWorkspace(rootDir);
  const target = primaryTargetPathForAgent(rootDir, agent);
  const warnings = [];
  switch (agent) {
    case "codex":
    case "goose":
    case "pi":
    case "opencode":
      await upsertManagedBlock(path2.join(rootDir, agentFileKinds.agents), buildManagedBlock("agents"));
      break;
    case "claude":
      await upsertManagedBlock(target, buildManagedBlock("claude"));
      break;
    case "gemini":
      await upsertManagedBlock(target, buildManagedBlock("gemini"));
      break;
    case "cursor":
      await writeOwnedFile(target, buildCursorRule());
      break;
    case "aider":
      await upsertManagedBlock(target, buildManagedBlock("aider"));
      break;
    case "copilot":
      await upsertManagedBlock(path2.join(rootDir, agentFileKinds.agents), buildManagedBlock("agents"));
      await upsertManagedBlock(target, buildManagedBlock("copilot"));
      break;
    case "trae":
      await writeOwnedFile(target, buildManagedBlock("trae"));
      break;
    case "claw":
      await writeOwnedFile(target, buildManagedBlock("claw"));
      break;
    case "droid":
      await writeOwnedFile(target, buildManagedBlock("droid"));
      break;
    case "kiro":
      await writeOwnedFile(target, buildStandaloneSkillFile());
      await writeOwnedFile(path2.join(rootDir, agentFileKinds.kiroSteering), buildKiroSteeringFile());
      break;
    case "hermes":
      await upsertManagedBlock(path2.join(rootDir, agentFileKinds.agents), buildManagedBlock("agents"));
      await writeOwnedFile(hermesUserSkillPath(), buildStandaloneSkillFile());
      break;
    case "antigravity":
      await writeOwnedFile(target, buildAntigravityRulesFile());
      await writeOwnedFile(path2.join(rootDir, agentFileKinds.antigravityWorkflow), buildAntigravityWorkflowFile());
      break;
    case "vscode":
      await writeOwnedFile(target, buildVscodeChatmodeFile());
      await upsertManagedBlock(path2.join(rootDir, agentFileKinds.copilot), buildManagedBlock("copilot"));
      break;
    default: {
      if (SKILL_BUNDLE_AGENTS[agent]) {
        await writeOwnedFile(target, buildStandaloneSkillFile());
        break;
      }
      throw new Error(`Unsupported agent ${String(agent)}`);
    }
  }
  if (agent === "aider") {
    const aiderResult = await mergeAiderConfig(rootDir);
    warnings.push(...aiderResult.warnings);
  }
  if (options.hook && supportsAgentHook(agent)) {
    if (agent === "codex") {
      const result = await installCodexHook(rootDir);
      warnings.push(...result.warnings);
    }
    if (agent === "claude") {
      const result = await installClaudeHook(rootDir);
      warnings.push(...result.warnings);
    }
    if (agent === "opencode") {
      const result = await installOpenCodeHook(rootDir);
      warnings.push(...result.warnings);
    }
    if (agent === "gemini") {
      const result = await installGeminiHook(rootDir);
      warnings.push(...result.warnings);
    }
    if (agent === "copilot") {
      const result = await installCopilotHook(rootDir);
      warnings.push(...result.warnings);
    }
  }
  const targets = targetsForAgent(rootDir, agent, options);
  return warnings.length > 0 ? { agent, target, targets, warnings } : { agent, target, targets };
}
async function installConfiguredAgents(rootDir) {
  const { config } = await initWorkspace(rootDir);
  const dedupedAgents = /* @__PURE__ */ new Map();
  for (const agent of config.agents) {
    const key = stableKeyForAgent(rootDir, agent);
    if (!dedupedAgents.has(key)) {
      dedupedAgents.set(key, agent);
    }
  }
  return Promise.all(
    [...dedupedAgents.values()].map(
      (agent) => installAgent(rootDir, agent, {
        hook: supportsAgentHook(agent)
      })
    )
  );
}

// src/analysis.ts
import path10 from "path";
import nlp2 from "compromise";
import { z as z2 } from "zod";

// src/code-analysis.ts
import fs4 from "fs/promises";
import { createRequire as createRequire2 } from "module";
import path4 from "path";
import ts from "typescript";
import YAML2 from "yaml";

// src/code-tree-sitter.ts
import fs3 from "fs/promises";
import { createRequire } from "module";
import path3 from "path";
var require2 = createRequire(import.meta.url);
var TREE_SITTER_RUNTIME_PACKAGE = "@vscode/tree-sitter-wasm";
var TREE_SITTER_EXTRA_GRAMMARS_PACKAGE = "tree-sitter-wasms";
var SWIFT_TREE_SITTER_OPT_IN_ENV = "SWARMVAULT_ENABLE_SWIFT_TREE_SITTER";
var packageRootCache = /* @__PURE__ */ new Map();
var RATIONALE_MARKERS = ["NOTE:", "IMPORTANT:", "HACK:", "WHY:", "RATIONALE:"];
function stripKnownCommentPrefix(line) {
  let next = line.trim();
  for (const prefix of ["/**", "/*", "*/", "//", "#", "--", "*"]) {
    if (next.startsWith(prefix)) {
      next = next.slice(prefix.length).trimStart();
    }
  }
  return next;
}
var treeSitterModulePromise;
var treeSitterInitPromise;
var languageCache = /* @__PURE__ */ new Map();
var grammarAssetByLanguage = {
  bash: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-bash.wasm" },
  python: { packageName: TREE_SITTER_RUNTIME_PACKAGE, relativePath: "wasm/tree-sitter-python.wasm" },
  go: { packageName: TREE_SITTER_RUNTIME_PACKAGE, relativePath: "wasm/tree-sitter-go.wasm" },
  rust: { packageName: TREE_SITTER_RUNTIME_PACKAGE, relativePath: "wasm/tree-sitter-rust.wasm" },
  java: { packageName: TREE_SITTER_RUNTIME_PACKAGE, relativePath: "wasm/tree-sitter-java.wasm" },
  kotlin: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-kotlin.wasm" },
  scala: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-scala.wasm" },
  dart: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-dart.wasm" },
  lua: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-lua.wasm" },
  zig: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-zig.wasm" },
  csharp: { packageName: TREE_SITTER_RUNTIME_PACKAGE, relativePath: "wasm/tree-sitter-c-sharp.wasm" },
  c: { packageName: TREE_SITTER_RUNTIME_PACKAGE, relativePath: "wasm/tree-sitter-cpp.wasm" },
  cpp: { packageName: TREE_SITTER_RUNTIME_PACKAGE, relativePath: "wasm/tree-sitter-cpp.wasm" },
  php: { packageName: TREE_SITTER_RUNTIME_PACKAGE, relativePath: "wasm/tree-sitter-php.wasm" },
  ruby: { packageName: TREE_SITTER_RUNTIME_PACKAGE, relativePath: "wasm/tree-sitter-ruby.wasm" },
  powershell: { packageName: TREE_SITTER_RUNTIME_PACKAGE, relativePath: "wasm/tree-sitter-powershell.wasm" },
  swift: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-swift.wasm" },
  elixir: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-elixir.wasm" },
  ocaml: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-ocaml.wasm" },
  objc: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-objc.wasm" },
  rescript: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-rescript.wasm" },
  solidity: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-solidity.wasm" },
  html: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-html.wasm" },
  css: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-css.wasm" },
  vue: { packageName: TREE_SITTER_EXTRA_GRAMMARS_PACKAGE, relativePath: "out/tree-sitter-vue.wasm" }
};
function resolvePackageRoot(packageName) {
  const cached = packageRootCache.get(packageName);
  if (cached) {
    return cached;
  }
  let resolved;
  try {
    resolved = path3.dirname(require2.resolve(`${packageName}/package.json`));
  } catch {
    resolved = path3.dirname(path3.dirname(require2.resolve(packageName)));
  }
  packageRootCache.set(packageName, resolved);
  return resolved;
}
function grammarAssetPath(language) {
  const asset = grammarAssetByLanguage[language];
  return path3.join(resolvePackageRoot(asset.packageName), asset.relativePath);
}
async function getTreeSitterModule() {
  if (!treeSitterModulePromise) {
    treeSitterModulePromise = import(require2.resolve(TREE_SITTER_RUNTIME_PACKAGE)).then(
      (module) => module.default ?? module
    );
  }
  return treeSitterModulePromise;
}
async function ensureTreeSitterInit(module) {
  if (!treeSitterInitPromise) {
    const runtimeRoot = resolvePackageRoot(TREE_SITTER_RUNTIME_PACKAGE);
    treeSitterInitPromise = module.Parser.init({
      locateFile: () => path3.join(runtimeRoot, "wasm", "tree-sitter.wasm")
    });
  }
  return treeSitterInitPromise;
}
async function loadLanguage(language) {
  const cached = languageCache.get(language);
  if (cached) {
    return cached;
  }
  const loader = (async () => {
    const module = await getTreeSitterModule();
    await ensureTreeSitterInit(module);
    const bytes = await fs3.readFile(grammarAssetPath(language));
    return module.Language.load(bytes);
  })();
  languageCache.set(language, loader);
  return loader;
}
function normalizeSymbolReference(value) {
  const withoutGenerics = value.replace(/<[^>]*>/g, "");
  const withoutDecorators = withoutGenerics.replace(/['"&*()[\]{}]/g, " ");
  const trimmed = withoutDecorators.trim();
  const lastSegment = trimmed.split(/::|\\|\.|->/).filter(Boolean).at(-1) ?? trimmed;
  return lastSegment.replace(/[,:;]+$/g, "").trim();
}
function stripCodeExtension(filePath) {
  return filePath.replace(
    /\.(?:[cm]?jsx?|tsx?|mts|cts|sh|bash|zsh|py|go|rs|java|kt|kts|scala|sc|dart|lua|zig|cs|php|c|cc|cpp|cxx|h|hh|hpp|hxx|swift|exs?|mli?|mm|resi?|sol|html?|css|vue)$/i,
    ""
  );
}
function manifestModuleName(manifest, language) {
  const repoPath = manifest.repoRelativePath ?? path3.basename(manifest.originalPath ?? manifest.storedPath);
  const normalized = toPosix(stripCodeExtension(repoPath)).replace(/^\.\/+/, "");
  if (!normalized) {
    return void 0;
  }
  if (language === "python") {
    const dotted = normalized.replace(/\/__init__$/i, "").replace(/\//g, ".").replace(/^src\./, "");
    return dotted || path3.posix.basename(normalized);
  }
  return normalized.endsWith("/index") ? normalized.slice(0, -"/index".length) || path3.posix.basename(normalized) : normalized;
}
function singleLineSignature(value) {
  return truncate(
    normalizeWhitespace(
      value.replace(/\{\s*$/, "").replace(/:\s*$/, ":").trim()
    ),
    180
  );
}
function makeSymbolId(sourceId, name, kind, seen) {
  const base = `${slugify(name)}.${kind}`;
  const count = (seen.get(base) ?? 0) + 1;
  seen.set(base, count);
  return `symbol:${sourceId}:${count === 1 ? base : `${base}-${count}`}`;
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function collectCallNamesFromText(text, availableNames, selfName) {
  if (!text) {
    return [];
  }
  const names = [];
  for (const name of availableNames) {
    if (name === selfName) {
      continue;
    }
    const pattern = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, "g");
    if (pattern.test(text)) {
      names.push(name);
    }
  }
  return uniqueBy(names, (name) => name);
}
function goReceiverBinding(node) {
  if (!node) {
    return {};
  }
  const names = uniqueBy(
    node.descendantsOfType(["identifier", "type_identifier"]).filter((item) => item !== null).map((item) => normalizeSymbolReference(item.text)).filter(Boolean),
    (item) => item
  );
  if (names.length === 0) {
    return {};
  }
  if (names.length === 1) {
    return { typeName: names[0] };
  }
  return {
    variableName: names[0],
    typeName: names.at(-1)
  };
}
function goCalledSymbolName(node, receiver) {
  if (!node) {
    return void 0;
  }
  if (node.type === "selector_expression") {
    const targetName = normalizeSymbolReference(
      extractIdentifier(node.childForFieldName("operand") ?? node.childForFieldName("object") ?? node.namedChildren.at(0) ?? null) ?? ""
    );
    const fieldName = normalizeSymbolReference(
      extractIdentifier(node.childForFieldName("field") ?? findNamedChild(node, "field_identifier") ?? node.namedChildren.at(-1) ?? null) ?? ""
    );
    if (!fieldName) {
      return void 0;
    }
    if (receiver.variableName && receiver.typeName && targetName === receiver.variableName) {
      return `${receiver.typeName}.${fieldName}`;
    }
    return fieldName;
  }
  return normalizeSymbolReference(extractIdentifier(node) ?? "");
}
function goCallNamesFromBody(bodyNode, receiver) {
  if (!bodyNode) {
    return [];
  }
  return uniqueBy(
    bodyNode.descendantsOfType("call_expression").filter((item) => item !== null).map((callNode) => goCalledSymbolName(callNode.childForFieldName("function") ?? callNode.namedChildren.at(0) ?? null, receiver)).filter((name) => Boolean(name)),
    (name) => name
  );
}
function finalizeCodeAnalysis(manifest, language, imports, draftSymbols, exportLabels, diagnostics, metadata) {
  const topLevelNames = new Set(draftSymbols.map((symbol) => symbol.name));
  for (const symbol of draftSymbols) {
    if (symbol.callNames.length === 0 && symbol.bodyText) {
      symbol.callNames = collectCallNamesFromText(symbol.bodyText, topLevelNames, symbol.name);
    }
  }
  const seenSymbolIds = /* @__PURE__ */ new Map();
  const symbols = draftSymbols.map((symbol) => ({
    id: makeSymbolId(manifest.sourceId, symbol.name, symbol.kind, seenSymbolIds),
    name: symbol.name,
    kind: symbol.kind,
    signature: symbol.signature,
    exported: symbol.exported,
    calls: uniqueBy(symbol.callNames, (name) => name),
    extends: uniqueBy(symbol.extendsNames.map((name) => normalizeSymbolReference(name)).filter(Boolean), (name) => name),
    implements: uniqueBy(symbol.implementsNames.map((name) => normalizeSymbolReference(name)).filter(Boolean), (name) => name)
  }));
  return {
    moduleId: `module:${manifest.sourceId}`,
    language,
    moduleName: metadata?.moduleName ?? manifestModuleName(manifest, language),
    namespace: metadata?.namespace,
    imports,
    dependencies: uniqueBy(
      imports.filter((item) => item.isExternal).map((item) => item.specifier),
      (specifier) => specifier
    ),
    symbols,
    exports: uniqueBy([...symbols.filter((symbol) => symbol.exported).map((symbol) => symbol.name), ...exportLabels], (label) => label),
    diagnostics
  };
}
function cleanCommentText(value) {
  return normalizeWhitespace(
    value.split(/\r?\n/).map((line) => stripKnownCommentPrefix(line)).join("\n").trim()
  );
}
function normalizeRationaleText(value) {
  let next = normalizeWhitespace(value.trim());
  const upper = next.toUpperCase();
  for (const marker of RATIONALE_MARKERS) {
    if (upper.startsWith(marker)) {
      next = next.slice(marker.length).trimStart();
      break;
    }
  }
  return next;
}
function rationaleKindFromText(text) {
  const upper = text.toUpperCase();
  return RATIONALE_MARKERS.some((marker) => upper.startsWith(marker)) ? "marker" : "comment";
}
function isLikelyRationaleText(value) {
  if (value.length < 20) {
    return false;
  }
  const upper = value.toUpperCase();
  if (RATIONALE_MARKERS.some((marker) => upper.startsWith(marker))) {
    return true;
  }
  const lower = value.toLowerCase();
  return ["why", "because", "tradeoff", "important", "avoid", "workaround", "reason", "so that", "in order to"].some(
    (needle) => lower.includes(needle)
  );
}
function makeRationale(manifest, index, text, kind, symbolName) {
  const normalized = normalizeRationaleText(cleanCommentText(text));
  if (!isLikelyRationaleText(normalized)) {
    return null;
  }
  return {
    id: `rationale:${manifest.sourceId}:${index}`,
    text: truncate(normalized, 280),
    citation: manifest.sourceId,
    kind,
    symbolName
  };
}
function nodeText(node) {
  return node?.text ?? "";
}
function moduleDocstringNode(rootNode) {
  const first = rootNode.namedChildren[0];
  if (!first || first.type !== "expression_statement") {
    return null;
  }
  return first.namedChildren.find((child) => child?.type === "string" || child?.type === "concatenated_string") ?? null;
}
function bodyDocstringNode(node) {
  const body = node?.childForFieldName("body");
  if (!body) {
    return null;
  }
  const first = body.namedChildren[0];
  if (!first || first.type !== "expression_statement") {
    return null;
  }
  return first.namedChildren.find((child) => child?.type === "string" || child?.type === "concatenated_string") ?? null;
}
function unquoteDocstringText(value) {
  return value.trim().replace(/^("""|'''|"|')/, "").replace(/("""|'''|"|')$/, "");
}
function commentNodes(rootNode) {
  return rootNode.descendantsOfType("comment").filter((node) => node !== null);
}
function extractTreeSitterRationales(manifest, language, rootNode) {
  const results = [];
  let index = 0;
  const push = (text, kind, symbolName) => {
    const rationale = makeRationale(manifest, index + 1, text, kind, symbolName);
    if (rationale) {
      results.push(rationale);
      index += 1;
    }
  };
  if (language === "python") {
    const moduleDocstring = moduleDocstringNode(rootNode);
    if (moduleDocstring) {
      push(unquoteDocstringText(moduleDocstring.text), "docstring");
    }
    for (const node of rootNode.descendantsOfType(["class_definition", "function_definition"]).filter((item) => item !== null)) {
      const name = extractIdentifier(node.childForFieldName("name"));
      const docstring = bodyDocstringNode(node);
      if (docstring) {
        push(unquoteDocstringText(docstring.text), "docstring", name);
      }
    }
  }
  for (const commentNode of commentNodes(rootNode)) {
    push(commentNode.text, rationaleKindFromText(commentNode.text));
  }
  return uniqueBy(results, (item) => `${item.symbolName ?? ""}:${item.text.toLowerCase()}`);
}
function findNamedChild(node, type) {
  return node?.namedChildren.find((child) => child?.type === type) ?? null;
}
function extractIdentifier(node) {
  if (!node) {
    return void 0;
  }
  if ([
    "identifier",
    "simple_identifier",
    "field_identifier",
    "type_identifier",
    "name",
    "package_identifier",
    "constant",
    "simple_name",
    "function_name"
  ].includes(node.type)) {
    return node.text.trim();
  }
  const preferred = node.childForFieldName("name") ?? node.namedChildren.find(
    (child) => child && [
      "identifier",
      "simple_identifier",
      "field_identifier",
      "type_identifier",
      "name",
      "package_identifier",
      "constant",
      "simple_name",
      "function_name"
    ].includes(child.type)
  ) ?? node.namedChildren.at(-1) ?? null;
  return preferred ? extractIdentifier(preferred) : void 0;
}
function exportedByCapitalization(name) {
  return /^[A-Z]/.test(name);
}
function parseCommaSeparatedReferences(value) {
  return uniqueBy(
    value.split(",").map((item) => item.replace(/\b(public|private|protected|internal|virtual|sealed|static|readonly|new|abstract|final)\b/g, "").trim()).map((item) => normalizeSymbolReference(item)).filter(Boolean),
    (item) => item
  );
}
function descendantTypeNames(node) {
  if (!node) {
    return [];
  }
  return uniqueBy(
    node.descendantsOfType(["type_identifier", "identifier", "name"]).filter((item) => item !== null).map((item) => normalizeSymbolReference(item.text)).filter(Boolean),
    (item) => item
  );
}
function quotedPath(value) {
  return value.replace(/^['"<]+|['">]+$/g, "").trim();
}
function neutralizePreprocessorDirectives(content) {
  const lines = content.split("\n");
  const active = [];
  const isActive = () => active.every(Boolean);
  const directiveHead = (line) => {
    const trimmed = line.trimStart();
    if (trimmed[0] !== "#") {
      return void 0;
    }
    const rest = trimmed.slice(1).trimStart();
    const match = rest.match(/^([A-Za-z]+)/);
    return match?.[1]?.toLowerCase();
  };
  const out = [];
  for (const line of lines) {
    const head = directiveHead(line);
    if (head === "if" || head === "ifdef" || head === "ifndef") {
      active.push(isActive());
      out.push("");
      continue;
    }
    if (head === "elif") {
      if (active.length > 0) {
        active[active.length - 1] = false;
      }
      out.push("");
      continue;
    }
    if (head === "else") {
      if (active.length > 0) {
        active[active.length - 1] = false;
      }
      out.push("");
      continue;
    }
    if (head === "endif") {
      if (active.length > 0) {
        active.pop();
      }
      out.push("");
      continue;
    }
    if (!isActive()) {
      out.push("");
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}
function detectShellDialect(content) {
  const prefix = content.slice(0, 4096);
  if (/^#!\s*(?:\/usr\/bin\/env\s+)?zsh\b/m.test(prefix)) {
    return "zsh";
  }
  if (/^\s*#compdef\b/m.test(prefix)) {
    return "zsh";
  }
  if (/\$\{\([fFsq@%]/.test(prefix)) {
    return "zsh";
  }
  if (/\b(?:setopt|unsetopt|zmodload|compinit|autoload\s+-Uz)\b/.test(prefix)) {
    return "zsh";
  }
  return "bash";
}
function diagnosticsFromTree(rootNode) {
  if (!rootNode.hasError) {
    return [];
  }
  const diagnostics = [];
  const seen = /* @__PURE__ */ new Set();
  const visit = (node) => {
    if (!node) {
      return;
    }
    if (node.isError || node.isMissing) {
      const key = `${node.startPosition.row}:${node.startPosition.column}:${node.type}:${node.text}`;
      if (!seen.has(key)) {
        seen.add(key);
        diagnostics.push({
          code: node.isMissing ? 9002 : 9001,
          category: "error",
          message: node.isMissing ? `Missing ${node.type} near \`${truncate(normalizeWhitespace(node.text), 80)}\`.` : `Syntax error near \`${truncate(normalizeWhitespace(node.text), 80)}\`.`,
          line: node.startPosition.row + 1,
          column: node.startPosition.column + 1
        });
      }
    }
    for (const child of node.children) {
      visit(child);
    }
  };
  visit(rootNode);
  return diagnostics.slice(0, 20);
}
function treeSitterCompatibilityMessage(language, error) {
  const message = error instanceof Error ? error.message : String(error);
  if (typeof error === "object" && error && "code" in error && error.code === "MODULE_NOT_FOUND") {
    return `Tree-sitter runtime support for ${language} is unavailable. Reinstall @swarmvaultai/engine so the packaged parser runtime is present.`;
  }
  if (typeof error === "object" && error && "code" in error && error.code === "ENOENT") {
    return `Missing tree-sitter grammar asset for ${language}. Reinstall @swarmvaultai/engine so the packaged grammar files are present.`;
  }
  return `Tree-sitter support for ${language} could not load: ${truncate(normalizeWhitespace(message), 220)}.`;
}
function treeSitterCompatibilityDiagnostic(language, error) {
  return {
    code: 9010,
    category: "error",
    message: treeSitterCompatibilityMessage(language, error),
    line: 1,
    column: 1
  };
}
function swiftTreeSitterEnabled() {
  return process.env[SWIFT_TREE_SITTER_OPT_IN_ENV] === "1";
}
function swiftTreeSitterDisabledDiagnostic() {
  return {
    code: 9012,
    category: "warning",
    message: `Swift parser-backed analysis is disabled by default because the packaged tree-sitter grammar can trigger Node/V8 out-of-memory crashes during WASM compilation. Set ${SWIFT_TREE_SITTER_OPT_IN_ENV}=1 to opt in anyway.`,
    line: 1,
    column: 1
  };
}
function flattenPythonDottedName(node) {
  if (!node) {
    return "";
  }
  return node.namedChildren.filter((child) => child?.type === "identifier").map((child) => child.text.trim()).filter(Boolean).join(".");
}
function flattenPythonRelativeImport(node) {
  if (!node) {
    return "";
  }
  const prefixNode = node.namedChildren.find((child) => child?.type === "import_prefix") ?? null;
  const prefix = prefixNode ? prefixNode.text.trim() : "";
  const moduleNode = node.namedChildren.find((child) => child?.type === "dotted_name") ?? null;
  const module = flattenPythonDottedName(moduleNode);
  return prefix + module;
}
function parsePythonImportStatement(node) {
  const imports = [];
  for (const child of node.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "dotted_name") {
      const specifier = flattenPythonDottedName(child);
      if (!specifier) {
        continue;
      }
      imports.push({
        specifier,
        importedSymbols: [],
        isExternal: !specifier.startsWith("."),
        reExport: false
      });
    } else if (child.type === "aliased_import") {
      const moduleNode = child.namedChildren.find((inner) => inner?.type === "dotted_name") ?? null;
      const aliasNode = child.namedChildren.find((inner) => inner?.type === "identifier") ?? null;
      const specifier = flattenPythonDottedName(moduleNode);
      if (!specifier) {
        continue;
      }
      imports.push({
        specifier,
        importedSymbols: [],
        namespaceImport: aliasNode?.text.trim(),
        isExternal: !specifier.startsWith("."),
        reExport: false
      });
    }
  }
  return imports;
}
function parsePythonFromImportStatement(node) {
  const children = node.namedChildren.filter((child) => child !== null);
  if (children.length === 0) {
    return [];
  }
  const [moduleNode, ...rest] = children;
  if (!moduleNode) {
    return [];
  }
  let specifier;
  if (moduleNode.type === "relative_import") {
    specifier = flattenPythonRelativeImport(moduleNode);
  } else if (moduleNode.type === "dotted_name") {
    specifier = flattenPythonDottedName(moduleNode);
  } else {
    return [];
  }
  if (!specifier) {
    return [];
  }
  const symbols = [];
  let hasWildcard = false;
  for (const entry of rest) {
    if (entry.type === "wildcard_import") {
      hasWildcard = true;
      continue;
    }
    if (entry.type === "dotted_name") {
      const name = flattenPythonDottedName(entry);
      if (name) {
        symbols.push(name);
      }
      continue;
    }
    if (entry.type === "aliased_import") {
      const moduleChild = entry.namedChildren.find((inner) => inner?.type === "dotted_name") ?? null;
      const aliasChild = entry.namedChildren.find((inner) => inner?.type === "identifier") ?? null;
      const baseName = flattenPythonDottedName(moduleChild);
      const aliasName = aliasChild?.text.trim();
      if (baseName) {
        symbols.push(aliasName ? `${baseName} as ${aliasName}` : baseName);
      }
    }
  }
  if (hasWildcard) {
    symbols.push("*");
  }
  return [
    {
      specifier,
      importedSymbols: symbols,
      isExternal: !specifier.startsWith("."),
      reExport: false
    }
  ];
}
function parseGoImport(spec) {
  let alias;
  let dotImport = false;
  let blankImport = false;
  let specifier;
  for (const child of spec.namedChildren) {
    if (!child) {
      continue;
    }
    switch (child.type) {
      case "package_identifier":
        alias = child.text.trim();
        break;
      case "dot":
        dotImport = true;
        break;
      case "blank_identifier":
        blankImport = true;
        break;
      case "interpreted_string_literal":
      case "raw_string_literal": {
        const content = child.namedChildren.find(
          (inner) => inner?.type === "interpreted_string_literal_content" || inner?.type === "raw_string_literal_content"
        ) ?? null;
        specifier = content ? content.text : child.text.replace(/^[`"]|[`"]$/g, "");
        break;
      }
      default:
        break;
    }
  }
  if (!specifier) {
    return void 0;
  }
  return {
    specifier,
    importedSymbols: [],
    namespaceImport: !dotImport && !blankImport ? alias : void 0,
    isExternal: !specifier.startsWith("."),
    reExport: false
  };
}
function flattenRustPath(node) {
  if (!node) {
    return [];
  }
  if (node.type === "crate" || node.type === "self" || node.type === "super") {
    return [node.type];
  }
  if (node.type === "identifier") {
    return [node.text.trim()].filter(Boolean);
  }
  if (node.type === "scoped_identifier") {
    const segments = [];
    for (const child of node.namedChildren) {
      if (!child) {
        continue;
      }
      segments.push(...flattenRustPath(child));
    }
    return segments;
  }
  return node.namedChildren.filter((child) => child !== null).flatMap((child) => flattenRustPath(child));
}
function collectRustUseLeaves(node, prefix, leaves) {
  if (!node) {
    return;
  }
  switch (node.type) {
    case "scoped_identifier": {
      const segments = flattenRustPath(node);
      if (segments.length === 0) {
        return;
      }
      leaves.push({
        segments: [...prefix, ...segments],
        symbol: segments[segments.length - 1] ?? null,
        wildcard: false
      });
      return;
    }
    case "identifier":
    case "crate":
    case "self":
    case "super": {
      const combined = [...prefix];
      if (node.type === "self" && prefix.length > 0) {
        leaves.push({ segments: combined, symbol: null, wildcard: false });
        return;
      }
      combined.push(node.type === "identifier" ? node.text.trim() : node.type);
      leaves.push({
        segments: combined,
        symbol: combined[combined.length - 1] ?? null,
        wildcard: false
      });
      return;
    }
    case "scoped_use_list": {
      const pathNode = node.namedChildren[0] ?? null;
      const listNode = node.namedChildren[1] ?? null;
      const nextPrefix = [...prefix, ...flattenRustPath(pathNode)];
      collectRustUseLeaves(listNode, nextPrefix, leaves);
      return;
    }
    case "use_list": {
      for (const child of node.namedChildren) {
        collectRustUseLeaves(child, prefix, leaves);
      }
      return;
    }
    case "use_wildcard": {
      const pathNode = node.namedChildren[0] ?? null;
      const pathSegments = pathNode ? flattenRustPath(pathNode) : [];
      leaves.push({
        segments: [...prefix, ...pathSegments],
        symbol: null,
        wildcard: true
      });
      return;
    }
    case "use_as_clause": {
      const pathNode = node.childForFieldName("path") ?? node.namedChildren[0] ?? null;
      const aliasNode = node.childForFieldName("alias") ?? node.namedChildren[1] ?? null;
      const before = leaves.length;
      collectRustUseLeaves(pathNode, prefix, leaves);
      const alias = aliasNode?.text.trim();
      if (alias) {
        for (let index = before; index < leaves.length; index += 1) {
          const leaf = leaves[index];
          if (leaf) {
            leaf.alias = alias;
          }
        }
      }
      return;
    }
    default: {
      for (const child of node.namedChildren) {
        collectRustUseLeaves(child, prefix, leaves);
      }
    }
  }
}
function isRustPubUse(useNode) {
  for (const child of useNode.children) {
    if (!child) {
      continue;
    }
    if (child.type === "visibility_modifier") {
      return true;
    }
    if (child.type === "use") {
      return false;
    }
  }
  return false;
}
function parseRustUseDeclaration(useNode) {
  const inner = useNode.namedChildren.find((child) => child !== null) ?? null;
  if (!inner) {
    return [];
  }
  const leaves = [];
  collectRustUseLeaves(inner, [], leaves);
  if (leaves.length === 0) {
    return [];
  }
  const reExport = isRustPubUse(useNode);
  return leaves.map((leaf) => {
    const specifier = leaf.segments.join("::");
    const importedSymbols = leaf.wildcard ? ["*"] : leaf.alias && leaf.symbol ? [`${leaf.symbol} as ${leaf.alias}`] : leaf.symbol ? [leaf.symbol] : [];
    return {
      specifier,
      importedSymbols,
      isExternal: !/^(?:crate|self|super)(?:$|::)/.test(specifier),
      reExport
    };
  });
}
function flattenJavaScopedIdentifier(node) {
  if (!node) {
    return "";
  }
  if (node.type === "identifier") {
    return node.text.trim();
  }
  if (node.type === "scoped_identifier") {
    const head = node.namedChildren[0] ?? null;
    const tail = node.namedChildren[node.namedChildren.length - 1] ?? null;
    const headText = flattenJavaScopedIdentifier(head);
    const tailText = tail && tail !== head && tail.type === "identifier" ? tail.text.trim() : "";
    return headText && tailText ? `${headText}.${tailText}` : headText || tailText;
  }
  return node.text.trim();
}
function parseJavaImport(node) {
  const pathNode = node.namedChildren.find((child) => child?.type === "scoped_identifier") ?? null;
  const hasAsterisk = node.namedChildren.some((child) => child?.type === "asterisk");
  const pathText = flattenJavaScopedIdentifier(pathNode);
  const specifier = hasAsterisk ? `${pathText}.*` : pathText;
  const symbolName = hasAsterisk ? "" : (pathText.split(".").pop() ?? "").trim();
  return {
    specifier,
    importedSymbols: symbolName ? [symbolName] : [],
    isExternal: true,
    reExport: false
  };
}
function flattenKotlinIdentifier(node) {
  if (!node) {
    return "";
  }
  if (node.type === "simple_identifier") {
    return node.text.trim();
  }
  return node.namedChildren.filter((child) => child?.type === "simple_identifier").map((child) => child.text.trim()).filter(Boolean).join(".");
}
function parseKotlinImport(header) {
  const identifierNode = header.namedChildren.find((child) => child?.type === "identifier") ?? null;
  const specifier = flattenKotlinIdentifier(identifierNode);
  if (!specifier) {
    return void 0;
  }
  const hasWildcard = header.descendantsOfType("wildcard_import").some((child) => child !== null);
  const aliasNode = header.namedChildren.find((child) => child?.type === "import_alias") ?? null;
  const aliasName = aliasNode ? flattenKotlinIdentifier(aliasNode.namedChildren.find((child) => child?.type === "type_identifier") ?? null) || aliasNode.text.replace(/^as\s+/, "").trim() : void 0;
  return {
    specifier: hasWildcard ? `${specifier}.*` : specifier,
    importedSymbols: hasWildcard ? ["*"] : [],
    namespaceImport: aliasName || void 0,
    isExternal: true,
    reExport: false
  };
}
function flattenScalaStableIdentifier(node) {
  if (!node) {
    return "";
  }
  if (node.type === "identifier") {
    return node.text.trim();
  }
  if (node.type === "stable_identifier") {
    return node.namedChildren.filter((child) => child !== null).map((child) => flattenScalaStableIdentifier(child)).filter(Boolean).join(".");
  }
  return node.text.trim();
}
function parseScalaImport(node) {
  const pathNode = node.namedChildren.find((child) => child?.type === "stable_identifier") ?? node.namedChildren.find((child) => child?.type === "identifier") ?? null;
  const basePath = flattenScalaStableIdentifier(pathNode);
  if (!basePath) {
    return [];
  }
  const selectorsNode = node.namedChildren.find((child) => child?.type === "import_selectors") ?? null;
  const wildcardNode = node.namedChildren.find((child) => child?.type === "wildcard") ?? null;
  if (selectorsNode) {
    const results = [];
    for (const selector of selectorsNode.namedChildren) {
      if (!selector) {
        continue;
      }
      if (selector.type === "identifier") {
        const symbol2 = selector.text.trim();
        if (symbol2) {
          results.push({
            specifier: basePath,
            importedSymbols: [symbol2],
            isExternal: !basePath.startsWith("."),
            reExport: false
          });
        }
        continue;
      }
      if (selector.type === "renamed_identifier") {
        const idChildren = selector.namedChildren.filter((child) => child?.type === "identifier");
        const [original, alias] = [idChildren[0]?.text.trim(), idChildren[1]?.text.trim()];
        if (original) {
          results.push({
            specifier: basePath,
            importedSymbols: [alias ? `${original} as ${alias}` : original],
            isExternal: !basePath.startsWith("."),
            reExport: false
          });
        }
        continue;
      }
      if (selector.type === "wildcard") {
        results.push({
          specifier: basePath,
          importedSymbols: ["*"],
          isExternal: !basePath.startsWith("."),
          reExport: false
        });
      }
    }
    return results;
  }
  if (wildcardNode) {
    return [
      {
        specifier: basePath,
        importedSymbols: ["*"],
        isExternal: !basePath.startsWith("."),
        reExport: false
      }
    ];
  }
  const segments = basePath.split(".");
  const symbol = segments.pop() ?? basePath;
  const parent = segments.join(".");
  return [
    {
      specifier: parent || basePath,
      importedSymbols: [symbol],
      isExternal: !basePath.startsWith("."),
      reExport: false
    }
  ];
}
function bashCommandName(commandNode) {
  if (!commandNode) {
    return void 0;
  }
  const nameNode = commandNode.childForFieldName("name") ?? findNamedChild(commandNode, "command_name") ?? commandNode.namedChildren.at(0) ?? null;
  if (!nameNode) {
    return void 0;
  }
  return nodeText(findNamedChild(nameNode, "word") ?? nameNode.namedChildren.at(0) ?? nameNode).trim() || void 0;
}
function bashSpecifierLooksLocal(specifier) {
  return specifier.startsWith(".") || specifier.startsWith("/") || specifier.includes("/") || /\.(?:sh|bash|zsh)$/i.test(specifier);
}
function parseBashImport(commandNode) {
  const commandName = bashCommandName(commandNode);
  if (commandName !== "source" && commandName !== ".") {
    return void 0;
  }
  const argumentNode = commandNode.childForFieldName("argument") ?? commandNode.namedChildren.find((child) => child && child !== (commandNode.childForFieldName("name") ?? null)) ?? null;
  const specifier = quotedPath(nodeText(argumentNode));
  if (!specifier) {
    return void 0;
  }
  return {
    specifier,
    importedSymbols: [],
    isExternal: !bashSpecifierLooksLocal(specifier),
    reExport: false
  };
}
function parseDartUri(node) {
  const stringNode = node?.descendantsOfType("string_literal").find((item) => item !== null) ?? null;
  return stringNode ? quotedPath(stringNode.text) : void 0;
}
function dartSpecifierLooksLocal(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/") || !specifier.startsWith("package:") && !specifier.includes(":") && specifier.endsWith(".dart");
}
function parseDartDirective(node) {
  if (node.type === "import_or_export") {
    const importNode = findNamedChild(node, "library_import");
    if (importNode) {
      const specifier2 = parseDartUri(
        findNamedChild(importNode, "configurable_uri") ?? findNamedChild(findNamedChild(importNode, "import_specification"), "configurable_uri") ?? importNode
      );
      if (!specifier2) {
        return void 0;
      }
      return {
        specifier: specifier2,
        importedSymbols: [],
        isExternal: !dartSpecifierLooksLocal(specifier2) && !specifier2.startsWith("package:"),
        reExport: false
      };
    }
    const exportNode = findNamedChild(node, "library_export");
    if (exportNode) {
      const specifier2 = parseDartUri(findNamedChild(exportNode, "configurable_uri") ?? exportNode);
      if (!specifier2) {
        return void 0;
      }
      return {
        specifier: specifier2,
        importedSymbols: [],
        isExternal: !dartSpecifierLooksLocal(specifier2) && !specifier2.startsWith("package:"),
        reExport: true
      };
    }
    return void 0;
  }
  if (node.type !== "part_directive") {
    return void 0;
  }
  const specifier = parseDartUri(findNamedChild(node, "uri") ?? node);
  if (!specifier) {
    return void 0;
  }
  return {
    specifier,
    importedSymbols: [],
    isExternal: false,
    reExport: false
  };
}
function parseLuaRequire(node) {
  const stringNode = node.descendantsOfType("string").find((item) => item !== null);
  const identifiers = node.descendantsOfType("identifier").filter((item) => item !== null).map((item) => item.text.trim());
  if (!stringNode || !identifiers.includes("require")) {
    return void 0;
  }
  const specifier = quotedPath(stringNode.text);
  if (!specifier) {
    return void 0;
  }
  return {
    specifier,
    importedSymbols: [],
    isExternal: !/^[A-Za-z_][A-Za-z0-9_]*(?:[./][A-Za-z_][A-Za-z0-9_]*)*$/.test(specifier),
    reExport: false
  };
}
function parseZigImport(node) {
  if (node.type !== "variable_declaration") {
    return void 0;
  }
  const importCall = findNamedChild(node, "builtin_function");
  if (!importCall || nodeText(findNamedChild(importCall, "builtin_identifier") ?? importCall.namedChildren.at(0) ?? null) !== "@import") {
    return void 0;
  }
  const stringNode = importCall.descendantsOfType("string_content").find((item) => item !== null);
  const specifier = stringNode?.text.trim();
  if (!specifier) {
    return void 0;
  }
  return {
    specifier,
    importedSymbols: [],
    isExternal: !specifier.endsWith(".zig") && !specifier.includes("/") && !specifier.startsWith("."),
    reExport: false
  };
}
function flattenCSharpQualifiedName(node) {
  if (!node) {
    return "";
  }
  if (node.type === "identifier") {
    return node.text.trim();
  }
  if (node.type === "qualified_name") {
    const [head, tail] = [node.namedChildren[0] ?? null, node.namedChildren[1] ?? null];
    const headText = flattenCSharpQualifiedName(head);
    const tailText = tail?.type === "identifier" ? tail.text.trim() : flattenCSharpQualifiedName(tail);
    return headText && tailText ? `${headText}.${tailText}` : headText || tailText;
  }
  return node.text.trim();
}
function parseCSharpUsing(node) {
  const namedChildren = node.namedChildren.filter((child) => child !== null);
  if (namedChildren.length === 0) {
    return void 0;
  }
  let aliasName;
  let pathNode = null;
  if (namedChildren.length >= 2 && namedChildren[0]?.type === "identifier" && namedChildren[1]) {
    aliasName = namedChildren[0].text.trim();
    pathNode = namedChildren[1];
  } else {
    pathNode = namedChildren[0] ?? null;
  }
  const specifier = flattenCSharpQualifiedName(pathNode);
  if (!specifier) {
    return void 0;
  }
  return {
    specifier,
    importedSymbols: [],
    namespaceImport: aliasName,
    isExternal: !specifier.startsWith("."),
    reExport: false
  };
}
function flattenPhpQualifiedName(node) {
  if (!node) {
    return "";
  }
  if (node.type === "name") {
    return node.text.trim();
  }
  if (node.type === "namespace_name") {
    return node.namedChildren.filter((child) => child?.type === "name").map((child) => child.text.trim()).filter(Boolean).join("\\");
  }
  if (node.type === "qualified_name") {
    const parts = [];
    for (const child of node.namedChildren) {
      if (!child) {
        continue;
      }
      if (child.type === "namespace_name") {
        parts.push(flattenPhpQualifiedName(child));
      } else if (child.type === "name") {
        parts.push(child.text.trim());
      }
    }
    return parts.filter(Boolean).join("\\");
  }
  return node.text.trim();
}
function parsePhpUseClause(clause, prefix) {
  const names = clause.namedChildren.filter((child) => child?.type === "name");
  const qualified = clause.namedChildren.find((child) => child?.type === "qualified_name") ?? null;
  let specifier;
  let aliasName;
  if (qualified) {
    specifier = flattenPhpQualifiedName(qualified);
    if (names.length >= 1 && names[0]) {
      aliasName = names[0].text.trim();
    }
  } else if (names.length >= 1 && names[0]) {
    specifier = names[0].text.trim();
    if (names.length >= 2 && names[1]) {
      aliasName = names[1].text.trim();
    }
  } else {
    return void 0;
  }
  if (prefix && specifier) {
    specifier = `${prefix}\\${specifier}`;
  }
  if (!specifier) {
    return void 0;
  }
  return {
    specifier,
    importedSymbols: [],
    namespaceImport: aliasName,
    isExternal: true,
    reExport: false
  };
}
function parsePhpUse(node) {
  const results = [];
  const groupNode = node.namedChildren.find((child) => child?.type === "namespace_use_group") ?? null;
  if (groupNode) {
    const prefixNode = node.namedChildren.find((child) => child?.type === "namespace_name") ?? null;
    const prefix = flattenPhpQualifiedName(prefixNode);
    for (const clause of groupNode.namedChildren) {
      if (!clause || clause.type !== "namespace_use_clause") {
        continue;
      }
      const parsed = parsePhpUseClause(clause, prefix);
      if (parsed) {
        results.push(parsed);
      }
    }
    return results;
  }
  for (const child of node.namedChildren) {
    if (!child || child.type !== "namespace_use_clause") {
      continue;
    }
    const parsed = parsePhpUseClause(child, "");
    if (parsed) {
      results.push(parsed);
    }
  }
  return results;
}
function parseCppInclude(node) {
  for (const child of node.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "system_lib_string") {
      const specifier = child.text.replace(/^</, "").replace(/>$/, "").trim();
      if (!specifier) {
        return void 0;
      }
      return {
        specifier,
        importedSymbols: [],
        isExternal: true,
        reExport: false
      };
    }
    if (child.type === "string_literal") {
      const contentNode = child.namedChildren.find((inner) => inner?.type === "string_content") ?? null;
      const specifier = (contentNode?.text ?? child.text.replace(/^"|"$/g, "")).trim();
      if (!specifier) {
        return void 0;
      }
      return {
        specifier,
        importedSymbols: [],
        isExternal: false,
        reExport: false
      };
    }
  }
  return void 0;
}
function rubyStringContent(node) {
  if (!node) {
    return void 0;
  }
  const contentNode = node.descendantsOfType(["string_content", "simple_symbol", "bare_string"]).find((item) => item !== null) ?? null;
  return contentNode?.text.trim() || void 0;
}
function normalizePowerShellDotSourceSpecifier(raw) {
  const unquoted = raw.replace(/^['"]+|['"]+$/g, "").trim();
  const withoutScriptRoot = unquoted.replace(/^\$PSScriptRoot(?:[\\/]+|$)/i, "./");
  return withoutScriptRoot.replace(/\\/g, "/");
}
function parsePowerShellImport(commandNode) {
  const commandName = commandNode.descendantsOfType(["command_name", "command_name_expr"]).find((item) => item !== null)?.text.trim();
  const genericTokens = commandNode.descendantsOfType("generic_token").filter((item) => item !== null).map((item) => item.text.trim());
  if (commandNode.namedChildren.some((child) => child?.type === "command_invokation_operator")) {
    const raw = commandName?.trim();
    if (raw) {
      return {
        specifier: normalizePowerShellDotSourceSpecifier(raw),
        importedSymbols: [],
        isExternal: false,
        reExport: false
      };
    }
  }
  if (!commandName) {
    return void 0;
  }
  const lowerName = commandName.toLowerCase();
  if (lowerName === "using" && genericTokens.length >= 2 && genericTokens[0]?.toLowerCase() === "module") {
    return {
      specifier: genericTokens[1],
      importedSymbols: [],
      isExternal: !genericTokens[1]?.startsWith("."),
      reExport: false
    };
  }
  if (lowerName === "import-module" && genericTokens[0]) {
    return {
      specifier: genericTokens[0],
      importedSymbols: [],
      isExternal: !genericTokens[0].startsWith("."),
      reExport: false
    };
  }
  return void 0;
}
function keywordVisible(text, hiddenKeywords) {
  return !hiddenKeywords.some((keyword) => new RegExp(`\\b${keyword}\\b`).test(text));
}
function declarationVisible(node, hiddenKeywords) {
  const modifierText = nodeText(findNamedChild(node, "modifiers") ?? node.childForFieldName("modifiers"));
  return modifierText ? keywordVisible(modifierText, hiddenKeywords) : true;
}
function kotlinClassKind(text) {
  const trimmed = text.trimStart();
  if (trimmed.startsWith("interface ")) {
    return "interface";
  }
  if (trimmed.startsWith("enum class ")) {
    return "enum";
  }
  return "class";
}
function scalaDefinitionKind(node) {
  if (node.type === "trait_definition") {
    return "trait";
  }
  if (node.type === "class_definition") {
    return /\bcase\s+class\b/.test(node.text) ? "class" : "class";
  }
  if (node.type === "object_definition") {
    return "class";
  }
  if (node.type === "function_definition") {
    return "function";
  }
  return void 0;
}
function bashCallNamesFromBody(bodyNode, selfName) {
  if (!bodyNode) {
    return [];
  }
  return uniqueBy(
    bodyNode.descendantsOfType("command").filter((item) => item !== null).map((item) => bashCommandName(item)).filter((name) => Boolean(name)).filter((name) => name !== "source" && name !== "." && name !== selfName),
    (name) => name
  );
}
function dartCallableName(node) {
  if (!node) {
    return void 0;
  }
  if (node.type === "function_signature") {
    return extractIdentifier(node.childForFieldName("name") ?? findNamedChild(node, "identifier"));
  }
  if (node.type === "constructor_signature") {
    return extractIdentifier(node.childForFieldName("name") ?? findNamedChild(node, "identifier"));
  }
  return extractIdentifier(
    node.childForFieldName("name") ?? findNamedChild(node, "function_signature") ?? findNamedChild(node, "identifier")
  );
}
function luaFunctionName(node) {
  if (!node) {
    return void 0;
  }
  if (node.type === "identifier") {
    return node.text.trim();
  }
  if (node.type === "variable") {
    const identifiers = node.descendantsOfType("identifier").filter((item) => item !== null).map((item) => item.text.trim()).filter(Boolean);
    return identifiers.length > 0 ? identifiers.join(".") : void 0;
  }
  return extractIdentifier(node);
}
function zigDeclarationKind(node) {
  if (findNamedChild(node, "struct_declaration")) {
    return "struct";
  }
  if (findNamedChild(node, "enum_declaration")) {
    return "enum";
  }
  return void 0;
}
function bashCodeAnalysis(manifest, rootNode, diagnostics, rawContent) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const commandNodes = rootNode.descendantsOfType("command").filter((node) => node !== null);
  for (const command of commandNodes) {
    const parsed = parseBashImport(command);
    if (parsed) {
      imports.push(parsed);
    }
  }
  const functionNodes = rootNode.descendantsOfType("function_definition").filter((node) => node !== null);
  const functionByName = /* @__PURE__ */ new Map();
  for (const child of functionNodes) {
    const name = nodeText(child.childForFieldName("name") ?? child.namedChildren.at(0) ?? null).trim();
    if (!name) {
      continue;
    }
    draftSymbols.push({
      name,
      kind: "function",
      signature: singleLineSignature(child.text),
      exported: true,
      callNames: [],
      extendsNames: [],
      implementsNames: [],
      bodyText: nodeText(child.childForFieldName("body") ?? findNamedChild(child, "compound_statement"))
    });
    exportLabels.push(name);
    if (!functionByName.has(name)) {
      functionByName.set(name, child);
    }
  }
  for (let index = 0; index < draftSymbols.length; index += 1) {
    const symbol = draftSymbols[index];
    const functionNode = functionByName.get(symbol.name);
    symbol.callNames = bashCallNamesFromBody(
      functionNode?.childForFieldName("body") ?? findNamedChild(functionNode, "compound_statement"),
      symbol.name
    );
  }
  if (draftSymbols.length === 0 && rawContent) {
    const seen = /* @__PURE__ */ new Set();
    for (const line of rawContent.split("\n")) {
      const trimmed = line.trimStart();
      let match = trimmed.match(/^function\s+([A-Za-z_][\w-]*)\s*(?:\(\))?/);
      if (!match) {
        match = trimmed.match(/^([A-Za-z_][\w-]*)\s*\(\)/);
      }
      const name = match?.[1];
      if (!name || seen.has(name)) {
        continue;
      }
      seen.add(name);
      draftSymbols.push({
        name,
        kind: "function",
        signature: singleLineSignature(trimmed),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: ""
      });
      exportLabels.push(name);
    }
  }
  return finalizeCodeAnalysis(manifest, "bash", imports, draftSymbols, exportLabels, diagnostics);
}
function dartCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  let libraryName;
  const pushScopedFunctions = (bodyNode, scopeName) => {
    if (!bodyNode) {
      return;
    }
    const children = bodyNode.namedChildren.filter((item) => item !== null);
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];
      if (!child) {
        continue;
      }
      if (child.type === "method_signature") {
        const signatureNode = findNamedChild(child, "function_signature") ?? child;
        const methodName = dartCallableName(signatureNode);
        if (!methodName) {
          continue;
        }
        const bodyNode2 = children[index + 1]?.type === "function_body" ? children[index + 1] : null;
        const symbolName2 = `${scopeName}.${methodName}`;
        const exported2 = !scopeName.startsWith("_") && !methodName.startsWith("_");
        draftSymbols.push({
          name: symbolName2,
          kind: "function",
          signature: singleLineSignature(`${child.text} ${nodeText(bodyNode2)}`),
          exported: exported2,
          callNames: [],
          extendsNames: [],
          implementsNames: [],
          bodyText: nodeText(bodyNode2)
        });
        if (exported2) {
          exportLabels.push(symbolName2);
        }
        continue;
      }
      if (child.type !== "declaration") {
        continue;
      }
      const constructorNode = findNamedChild(child, "constructor_signature");
      const constructorName = dartCallableName(constructorNode);
      if (!constructorName) {
        continue;
      }
      const symbolName = `${scopeName}.${constructorName}`;
      const exported = !scopeName.startsWith("_") && !constructorName.startsWith("_");
      draftSymbols.push({
        name: symbolName,
        kind: "function",
        signature: singleLineSignature(child.text),
        exported,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: child.text
      });
      if (exported) {
        exportLabels.push(symbolName);
      }
    }
  };
  const topLevelChildren = rootNode.namedChildren.filter((item) => item !== null);
  for (let index = 0; index < topLevelChildren.length; index += 1) {
    const child = topLevelChildren[index];
    if (!child) {
      continue;
    }
    if (child.type === "library_name") {
      libraryName = nodeText(findNamedChild(child, "dotted_identifier_list") ?? child.namedChildren.at(-1) ?? null) || libraryName;
      continue;
    }
    if (child.type === "import_or_export" || child.type === "part_directive") {
      const parsed = parseDartDirective(child);
      if (parsed) {
        imports.push(parsed);
      }
      continue;
    }
    if (child.type === "function_signature") {
      const functionName = dartCallableName(child);
      if (!functionName) {
        continue;
      }
      const bodyNode2 = topLevelChildren[index + 1]?.type === "function_body" ? topLevelChildren[index + 1] : null;
      const exported2 = !functionName.startsWith("_");
      draftSymbols.push({
        name: functionName,
        kind: "function",
        signature: singleLineSignature(`${child.text} ${nodeText(bodyNode2)}`),
        exported: exported2,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(bodyNode2)
      });
      if (exported2) {
        exportLabels.push(functionName);
      }
      continue;
    }
    if (child.type === "mixin_declaration") {
      const mixinName = extractIdentifier(child.childForFieldName("name") ?? findNamedChild(child, "identifier"));
      if (!mixinName) {
        continue;
      }
      const bodyNode2 = child.childForFieldName("body") ?? findNamedChild(child, "class_body");
      const exported2 = !mixinName.startsWith("_");
      draftSymbols.push({
        name: mixinName,
        kind: "trait",
        signature: singleLineSignature(child.text),
        exported: exported2,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(bodyNode2) || child.text
      });
      if (exported2) {
        exportLabels.push(mixinName);
      }
      pushScopedFunctions(bodyNode2, mixinName);
      continue;
    }
    if (child.type === "enum_declaration") {
      const enumName = extractIdentifier(child.childForFieldName("name") ?? findNamedChild(child, "identifier"));
      if (!enumName) {
        continue;
      }
      const exported2 = !enumName.startsWith("_");
      draftSymbols.push({
        name: enumName,
        kind: "enum",
        signature: singleLineSignature(child.text),
        exported: exported2,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(child.childForFieldName("body") ?? findNamedChild(child, "enum_body")) || child.text
      });
      if (exported2) {
        exportLabels.push(enumName);
      }
      continue;
    }
    if (child.type === "extension_declaration") {
      const extensionName = extractIdentifier(child.childForFieldName("name") ?? findNamedChild(child, "identifier"));
      const targetType = extractIdentifier(child.childForFieldName("type") ?? findNamedChild(child, "type_identifier")) ?? extensionName;
      const bodyNode2 = child.childForFieldName("body") ?? findNamedChild(child, "extension_body");
      if (targetType) {
        pushScopedFunctions(bodyNode2, targetType);
      }
      continue;
    }
    if (child.type !== "class_definition") {
      continue;
    }
    const className = extractIdentifier(child.childForFieldName("name") ?? findNamedChild(child, "identifier"));
    if (!className) {
      continue;
    }
    const superTypes = descendantTypeNames(child.childForFieldName("superclass"));
    const interfaceTypes = descendantTypeNames(child.childForFieldName("interfaces"));
    const bodyNode = child.childForFieldName("body") ?? findNamedChild(child, "class_body");
    const exported = !className.startsWith("_");
    draftSymbols.push({
      name: className,
      kind: "class",
      signature: singleLineSignature(child.text),
      exported,
      callNames: [],
      extendsNames: superTypes.slice(0, 1),
      implementsNames: [...superTypes.slice(1), ...interfaceTypes],
      bodyText: nodeText(bodyNode) || child.text
    });
    if (exported) {
      exportLabels.push(className);
    }
    pushScopedFunctions(bodyNode, className);
  }
  return finalizeCodeAnalysis(manifest, "dart", imports, draftSymbols, exportLabels, diagnostics, {
    namespace: libraryName
  });
}
function pythonCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "import_statement") {
      imports.push(...parsePythonImportStatement(child));
      continue;
    }
    if (child.type === "import_from_statement") {
      imports.push(...parsePythonFromImportStatement(child));
      continue;
    }
    if (child.type === "class_definition") {
      const name = extractIdentifier(child.childForFieldName("name"));
      if (!name) {
        continue;
      }
      const superclasses = parseCommaSeparatedReferences(nodeText(child.childForFieldName("superclasses")).replace(/^\(|\)$/g, ""));
      draftSymbols.push({
        name,
        kind: "class",
        signature: singleLineSignature(child.text),
        exported: !name.startsWith("_"),
        callNames: [],
        extendsNames: superclasses,
        implementsNames: [],
        bodyText: nodeText(child.childForFieldName("body"))
      });
      continue;
    }
    if (child.type === "function_definition") {
      const name = extractIdentifier(child.childForFieldName("name"));
      if (!name) {
        continue;
      }
      draftSymbols.push({
        name,
        kind: "function",
        signature: singleLineSignature(child.text),
        exported: !name.startsWith("_"),
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(child.childForFieldName("body"))
      });
    }
  }
  return finalizeCodeAnalysis(manifest, "python", imports, draftSymbols, [], diagnostics);
}
function goCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  let packageName;
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "package_clause") {
      packageName = extractIdentifier(child.namedChildren.at(0) ?? null);
      continue;
    }
    if (child.type === "import_declaration") {
      for (const spec of child.descendantsOfType("import_spec")) {
        const parsed = spec ? parseGoImport(spec) : void 0;
        if (parsed) {
          imports.push(parsed);
        }
      }
      continue;
    }
    if (child.type === "type_declaration") {
      for (const spec of child.descendantsOfType("type_spec")) {
        if (!spec) {
          continue;
        }
        const name = extractIdentifier(spec.childForFieldName("name"));
        const typeNode = spec.childForFieldName("type");
        if (!name || !typeNode) {
          continue;
        }
        const kind = typeNode.type === "struct_type" ? "struct" : typeNode.type === "interface_type" ? "interface" : "type_alias";
        const exported = exportedByCapitalization(name);
        draftSymbols.push({
          name,
          kind,
          signature: singleLineSignature(spec.text),
          exported,
          callNames: [],
          extendsNames: [],
          implementsNames: [],
          bodyText: typeNode.text
        });
        if (exported) {
          exportLabels.push(name);
        }
      }
      continue;
    }
    if (child.type === "function_declaration" || child.type === "method_declaration") {
      const name = extractIdentifier(child.childForFieldName("name"));
      if (!name) {
        continue;
      }
      const receiver = child.type === "method_declaration" ? goReceiverBinding(child.childForFieldName("receiver")) : {};
      const receiverType = receiver.typeName ?? "";
      const bodyNode = child.childForFieldName("body");
      const symbolName = receiverType ? `${receiverType}.${name}` : name;
      const exported = exportedByCapitalization(name);
      draftSymbols.push({
        name: symbolName,
        kind: "function",
        signature: singleLineSignature(child.text),
        exported,
        callNames: goCallNamesFromBody(bodyNode, receiver),
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(bodyNode)
      });
      if (exported) {
        exportLabels.push(symbolName);
      }
    }
  }
  return finalizeCodeAnalysis(manifest, "go", imports, draftSymbols, exportLabels, diagnostics, {
    namespace: packageName
  });
}
function rustCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const symbolsByName = /* @__PURE__ */ new Map();
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "use_declaration") {
      imports.push(...parseRustUseDeclaration(child));
      continue;
    }
    if (child.type === "mod_item") {
      const hasInlineBody = child.namedChildren.some((item) => item?.type === "declaration_list");
      if (!hasInlineBody) {
        const modName = extractIdentifier(child.childForFieldName("name") ?? findNamedChild(child, "identifier"));
        if (modName) {
          imports.push({
            specifier: `self::${modName}`,
            importedSymbols: [],
            isExternal: false,
            reExport: false
          });
        }
      }
      continue;
    }
    const name = child.type === "function_item" ? extractIdentifier(child.childForFieldName("name")) : extractIdentifier(child.childForFieldName("name"));
    if (child.type === "impl_item") {
      const traitName = normalizeSymbolReference(nodeText(child.childForFieldName("trait")));
      const typeName = normalizeSymbolReference(nodeText(child.childForFieldName("type")));
      const target = symbolsByName.get(typeName);
      if (target && traitName) {
        target.implementsNames.push(traitName);
      }
      continue;
    }
    if (!name) {
      continue;
    }
    let kind;
    let extendsNames = [];
    if (child.type === "struct_item") {
      kind = "struct";
    } else if (child.type === "trait_item") {
      kind = "trait";
      extendsNames = parseCommaSeparatedReferences(nodeText(child.childForFieldName("bounds")).replace(/\+/g, ","));
    } else if (child.type === "enum_item") {
      kind = "enum";
    } else if (child.type === "function_item") {
      kind = "function";
    } else if (child.type === "type_item") {
      kind = "type_alias";
    } else if (child.type === "const_item" || child.type === "static_item") {
      kind = "variable";
    }
    if (!kind) {
      continue;
    }
    const exported = child.namedChildren.some((item) => item?.type === "visibility_modifier");
    const symbol = {
      name,
      kind,
      signature: singleLineSignature(child.text),
      exported,
      callNames: [],
      extendsNames,
      implementsNames: [],
      bodyText: nodeText(child.childForFieldName("body")) || child.text
    };
    draftSymbols.push(symbol);
    symbolsByName.set(name, symbol);
    if (exported) {
      exportLabels.push(name);
    }
  }
  return finalizeCodeAnalysis(manifest, "rust", imports, draftSymbols, exportLabels, diagnostics);
}
function javaCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  let packageName;
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "package_declaration") {
      const pathNode = child.namedChildren.find((inner) => inner?.type === "scoped_identifier" || inner?.type === "identifier") ?? null;
      const flattened = flattenJavaScopedIdentifier(pathNode);
      if (flattened) {
        packageName = flattened;
      }
      continue;
    }
    if (child.type === "import_declaration") {
      imports.push(parseJavaImport(child));
      continue;
    }
    const name = extractIdentifier(child.childForFieldName("name"));
    if (!name) {
      continue;
    }
    let kind;
    let extendsNames = [];
    let implementsNames = [];
    if (child.type === "class_declaration") {
      kind = "class";
      extendsNames = descendantTypeNames(child.childForFieldName("superclass"));
      implementsNames = descendantTypeNames(child.childForFieldName("interfaces"));
    } else if (child.type === "interface_declaration") {
      kind = "interface";
      extendsNames = descendantTypeNames(
        child.descendantsOfType("extends_interfaces").find((item) => item !== null) ?? null
      );
    } else if (child.type === "enum_declaration") {
      kind = "enum";
    }
    if (!kind) {
      continue;
    }
    const exported = /\bpublic\b/.test(child.text);
    draftSymbols.push({
      name,
      kind,
      signature: singleLineSignature(child.text),
      exported,
      callNames: [],
      extendsNames,
      implementsNames,
      bodyText: nodeText(child.childForFieldName("body")) || child.text
    });
    if (exported) {
      exportLabels.push(name);
    }
  }
  return finalizeCodeAnalysis(manifest, "java", imports, draftSymbols, exportLabels, diagnostics, {
    namespace: packageName
  });
}
function kotlinCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  let packageName;
  const pushBodyFunctions = (bodyNode, scopeName) => {
    if (!bodyNode) {
      return;
    }
    for (const child of bodyNode.namedChildren) {
      if (!child || child.type !== "function_declaration") {
        continue;
      }
      const functionName = extractIdentifier(child.childForFieldName("name") ?? findNamedChild(child, "simple_identifier"));
      if (!functionName) {
        continue;
      }
      const exported = declarationVisible(child, ["private", "internal", "protected"]);
      const symbolName = scopeName ? `${scopeName}.${functionName}` : functionName;
      draftSymbols.push({
        name: symbolName,
        kind: "function",
        signature: singleLineSignature(child.text),
        exported,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(child.childForFieldName("body") ?? findNamedChild(child, "function_body"))
      });
      if (exported) {
        exportLabels.push(symbolName);
      }
    }
  };
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "package_header") {
      packageName = nodeText(findNamedChild(child, "identifier") ?? child.namedChildren.at(0) ?? null) || packageName;
      continue;
    }
    if (child.type === "import_list") {
      for (const importNode of child.descendantsOfType("import_header").filter((item) => item !== null)) {
        const parsed = parseKotlinImport(importNode);
        if (parsed) {
          imports.push(parsed);
        }
      }
      continue;
    }
    if (child.type === "function_declaration") {
      pushBodyFunctions({
        ...child,
        namedChildren: [child]
      });
      continue;
    }
    if (child.type !== "class_declaration" && child.type !== "object_declaration") {
      continue;
    }
    const name = extractIdentifier(child.childForFieldName("name") ?? findNamedChild(child, "type_identifier"));
    if (!name) {
      continue;
    }
    const kind = child.type === "object_declaration" ? "class" : kotlinClassKind(child.text);
    const delegationNames = uniqueBy(
      child.namedChildren.filter((item) => item !== null && item.type === "delegation_specifier").flatMap((item) => descendantTypeNames(item)),
      (item) => item
    );
    const exported = declarationVisible(child, ["private", "internal"]);
    const bodyNode = findNamedChild(child, "class_body") ?? child.childForFieldName("body");
    draftSymbols.push({
      name,
      kind,
      signature: singleLineSignature(child.text),
      exported,
      callNames: [],
      extendsNames: kind === "interface" ? delegationNames : delegationNames.slice(0, 1),
      implementsNames: kind === "class" ? delegationNames.slice(1) : [],
      bodyText: nodeText(bodyNode) || child.text
    });
    if (exported) {
      exportLabels.push(name);
    }
    pushBodyFunctions(bodyNode, name);
  }
  return finalizeCodeAnalysis(manifest, "kotlin", imports, draftSymbols, exportLabels, diagnostics, {
    namespace: packageName
  });
}
function scalaCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  let packageName;
  const pushTemplateFunctions = (bodyNode, scopeName) => {
    if (!bodyNode) {
      return;
    }
    for (const child of bodyNode.namedChildren) {
      if (!child || child.type !== "function_definition") {
        continue;
      }
      const functionName = extractIdentifier(child.childForFieldName("name") ?? findNamedChild(child, "identifier"));
      if (!functionName) {
        continue;
      }
      const exported = declarationVisible(child, ["private", "protected"]);
      const symbolName = scopeName ? `${scopeName}.${functionName}` : functionName;
      draftSymbols.push({
        name: symbolName,
        kind: "function",
        signature: singleLineSignature(child.text),
        exported,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: child.text
      });
      if (exported) {
        exportLabels.push(symbolName);
      }
    }
  };
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "package_clause") {
      packageName = nodeText(findNamedChild(child, "package_identifier") ?? child.namedChildren.at(0) ?? null) || packageName;
      continue;
    }
    if (child.type === "import_declaration") {
      imports.push(...parseScalaImport(child));
      continue;
    }
    if (child.type === "function_definition") {
      pushTemplateFunctions({
        ...child,
        namedChildren: [child]
      });
      continue;
    }
    if (!["trait_definition", "class_definition", "object_definition"].includes(child.type)) {
      continue;
    }
    const name = extractIdentifier(child.childForFieldName("name") ?? findNamedChild(child, "identifier"));
    const kind = scalaDefinitionKind(child);
    if (!name || !kind) {
      continue;
    }
    const extendsClause = findNamedChild(child, "extends_clause") ?? child.childForFieldName("extends");
    const inheritance = uniqueBy(descendantTypeNames(extendsClause), (item) => item);
    const bodyNode = findNamedChild(child, "template_body") ?? child.childForFieldName("body");
    const exported = declarationVisible(child, ["private", "protected"]);
    draftSymbols.push({
      name,
      kind,
      signature: singleLineSignature(child.text),
      exported,
      callNames: [],
      extendsNames: kind === "trait" ? inheritance : inheritance.slice(0, 1),
      implementsNames: kind === "class" ? inheritance.slice(1) : [],
      bodyText: nodeText(bodyNode) || child.text
    });
    if (exported) {
      exportLabels.push(name);
    }
    pushTemplateFunctions(bodyNode, name);
  }
  return finalizeCodeAnalysis(manifest, "scala", imports, draftSymbols, exportLabels, diagnostics, {
    namespace: packageName
  });
}
function luaCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "local_variable_declaration" || child.type === "assignment_statement") {
      const parsed = parseLuaRequire(child);
      if (parsed) {
        imports.push(parsed);
      }
      continue;
    }
    if (!["function_definition_statement", "local_function_definition_statement"].includes(child.type)) {
      continue;
    }
    const name = luaFunctionName(child.childForFieldName("name") ?? child.namedChildren.at(0) ?? null);
    if (!name) {
      continue;
    }
    draftSymbols.push({
      name,
      kind: "function",
      signature: singleLineSignature(child.text),
      exported: child.type !== "local_function_definition_statement",
      callNames: [],
      extendsNames: [],
      implementsNames: [],
      bodyText: nodeText(findNamedChild(child, "block") ?? child.childForFieldName("body")) || child.text
    });
    if (child.type !== "local_function_definition_statement") {
      exportLabels.push(name);
    }
  }
  return finalizeCodeAnalysis(manifest, "lua", imports, draftSymbols, exportLabels, diagnostics);
}
function zigCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const pushStructMembers = (structNode, scopeName) => {
    if (!structNode) {
      return;
    }
    for (const child of structNode.namedChildren) {
      if (!child || child.type !== "function_declaration") {
        continue;
      }
      const functionName = extractIdentifier(child.childForFieldName("name") ?? findNamedChild(child, "identifier"));
      if (!functionName) {
        continue;
      }
      const exported = /\bpub\b/.test(child.text);
      const symbolName = `${scopeName}.${functionName}`;
      draftSymbols.push({
        name: symbolName,
        kind: "function",
        signature: singleLineSignature(child.text),
        exported,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(findNamedChild(child, "block") ?? child.childForFieldName("body")) || child.text
      });
      if (exported) {
        exportLabels.push(symbolName);
      }
    }
  };
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "variable_declaration") {
      const parsedImport = parseZigImport(child);
      if (parsedImport) {
        imports.push(parsedImport);
        continue;
      }
      const name = extractIdentifier(child.childForFieldName("name") ?? findNamedChild(child, "identifier"));
      const kind = zigDeclarationKind(child);
      if (!name || !kind) {
        continue;
      }
      const declarationNode = findNamedChild(child, "struct_declaration") ?? findNamedChild(child, "enum_declaration");
      const exported2 = /\bpub\b/.test(child.text);
      draftSymbols.push({
        name,
        kind,
        signature: singleLineSignature(child.text),
        exported: exported2,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(declarationNode) || child.text
      });
      if (exported2) {
        exportLabels.push(name);
      }
      if (kind === "struct") {
        pushStructMembers(declarationNode, name);
      }
      continue;
    }
    if (child.type !== "function_declaration") {
      continue;
    }
    const functionName = extractIdentifier(child.childForFieldName("name") ?? findNamedChild(child, "identifier"));
    if (!functionName) {
      continue;
    }
    const exported = /\bpub\b/.test(child.text);
    draftSymbols.push({
      name: functionName,
      kind: "function",
      signature: singleLineSignature(child.text),
      exported,
      callNames: [],
      extendsNames: [],
      implementsNames: [],
      bodyText: nodeText(findNamedChild(child, "block") ?? child.childForFieldName("body")) || child.text
    });
    if (exported) {
      exportLabels.push(functionName);
    }
  }
  return finalizeCodeAnalysis(manifest, "zig", imports, draftSymbols, exportLabels, diagnostics);
}
function csharpCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  let namespaceName;
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "using_directive") {
      const parsed = parseCSharpUsing(child);
      if (parsed) {
        imports.push(parsed);
      }
      continue;
    }
    if (child.type === "file_scoped_namespace_declaration" || child.type === "namespace_declaration") {
      namespaceName = nodeText(child.childForFieldName("name")) || namespaceName;
      if (child.type === "namespace_declaration") {
        const nameNode = child.childForFieldName("name");
        const namespaceMembers = [];
        for (const directChild of child.namedChildren) {
          if (!directChild || directChild === nameNode) {
            continue;
          }
          if (directChild.type === "declaration_list") {
            for (const inner of directChild.namedChildren) {
              if (inner) {
                namespaceMembers.push(inner);
              }
            }
            continue;
          }
          namespaceMembers.push(directChild);
        }
        for (const nested of namespaceMembers) {
          if (nested && nested !== child.childForFieldName("name")) {
            if (["class_declaration", "interface_declaration", "enum_declaration", "struct_declaration", "record_declaration"].includes(
              nested.type
            )) {
              const nestedName = extractIdentifier(nested.childForFieldName("name"));
              if (!nestedName) {
                continue;
              }
              const effectiveBaseList = parseCommaSeparatedReferences(
                nodeText(findNamedChild(nested, "base_list") ?? nested.childForFieldName("base_list")).replace(/^:/, "")
              );
              const kind2 = nested.type === "interface_declaration" ? "interface" : nested.type === "enum_declaration" ? "enum" : nested.type === "struct_declaration" ? "struct" : "class";
              const exported2 = /\b(public|internal|protected)\b/.test(nested.text);
              const extendsNames2 = kind2 === "class" || kind2 === "struct" ? effectiveBaseList.slice(0, 1) : [];
              const implementsNames2 = kind2 === "interface" ? [] : kind2 === "enum" ? [] : effectiveBaseList.slice(kind2 === "class" || kind2 === "struct" ? 1 : 0);
              draftSymbols.push({
                name: nestedName,
                kind: kind2,
                signature: singleLineSignature(nested.text),
                exported: exported2,
                callNames: [],
                extendsNames: extendsNames2,
                implementsNames: implementsNames2,
                bodyText: nodeText(nested.childForFieldName("body")) || nested.text
              });
              if (exported2) {
                exportLabels.push(nestedName);
              }
            }
          }
        }
      }
      if (child.type === "namespace_declaration") {
        continue;
      }
    }
    if (!["class_declaration", "interface_declaration", "enum_declaration", "struct_declaration", "record_declaration"].includes(child.type)) {
      continue;
    }
    const name = extractIdentifier(child.childForFieldName("name"));
    if (!name) {
      continue;
    }
    const baseList = parseCommaSeparatedReferences(
      nodeText(findNamedChild(child, "base_list") ?? child.childForFieldName("base_list")).replace(/^:/, "")
    );
    const kind = child.type === "interface_declaration" ? "interface" : child.type === "enum_declaration" ? "enum" : child.type === "struct_declaration" ? "struct" : "class";
    const exported = /\b(public|internal|protected)\b/.test(child.text);
    const extendsNames = kind === "class" || kind === "struct" ? baseList.slice(0, 1) : [];
    const implementsNames = kind === "interface" ? [] : kind === "enum" ? [] : baseList.slice(kind === "class" || kind === "struct" ? 1 : 0);
    draftSymbols.push({
      name,
      kind,
      signature: singleLineSignature(child.text),
      exported,
      callNames: [],
      extendsNames,
      implementsNames,
      bodyText: nodeText(child.childForFieldName("body")) || child.text
    });
    if (exported) {
      exportLabels.push(name);
    }
  }
  return finalizeCodeAnalysis(manifest, "csharp", imports, draftSymbols, exportLabels, diagnostics, {
    namespace: namespaceName
  });
}
function phpCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  let namespaceName;
  for (const child of rootNode.namedChildren) {
    if (!child || child.type === "php_tag") {
      continue;
    }
    if (child.type === "namespace_definition") {
      namespaceName = nodeText(child.childForFieldName("name")) || namespaceName;
      continue;
    }
    if (child.type === "namespace_use_declaration") {
      imports.push(...parsePhpUse(child));
      continue;
    }
    const name = extractIdentifier(child.childForFieldName("name"));
    if (!name) {
      continue;
    }
    let kind;
    let extendsNames = [];
    let implementsNames = [];
    if (child.type === "class_declaration") {
      kind = "class";
      extendsNames = parseCommaSeparatedReferences(
        nodeText(findNamedChild(child, "base_clause") ?? child.childForFieldName("base_clause"))
      );
      implementsNames = parseCommaSeparatedReferences(
        nodeText(findNamedChild(child, "class_interface_clause") ?? child.childForFieldName("class_interface_clause"))
      );
    } else if (child.type === "interface_declaration") {
      kind = "interface";
      extendsNames = parseCommaSeparatedReferences(
        nodeText(findNamedChild(child, "base_clause") ?? child.childForFieldName("base_clause"))
      );
    } else if (child.type === "trait_declaration") {
      kind = "trait";
    } else if (child.type === "enum_declaration") {
      kind = "enum";
    } else if (child.type === "function_definition") {
      kind = "function";
    }
    if (!kind) {
      continue;
    }
    draftSymbols.push({
      name,
      kind,
      signature: singleLineSignature(child.text),
      exported: true,
      callNames: [],
      extendsNames,
      implementsNames,
      bodyText: nodeText(child.childForFieldName("body")) || child.text
    });
    exportLabels.push(name);
  }
  return finalizeCodeAnalysis(manifest, "php", imports, draftSymbols, exportLabels, diagnostics, {
    namespace: namespaceName
  });
}
function rubyCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  let namespaceName;
  const visitStatements = (node, scopeName, namespaceParts = []) => {
    if (!node) {
      return;
    }
    for (const child of node.namedChildren) {
      if (!child) {
        continue;
      }
      if (child.type === "call") {
        const callee = extractIdentifier(child.namedChildren.at(0) ?? null);
        if (callee === "require" || callee === "require_relative") {
          const specifier = rubyStringContent(child.childForFieldName("arguments") ?? child.namedChildren.at(1) ?? null);
          if (specifier) {
            const normalizedSpecifier = callee === "require_relative" && !specifier.startsWith(".") && !specifier.startsWith("/") ? `./${specifier}` : specifier;
            imports.push({
              specifier: normalizedSpecifier,
              importedSymbols: [],
              isExternal: callee === "require" && !specifier.startsWith("."),
              reExport: false
            });
          }
        }
        continue;
      }
      if (child.type === "module") {
        const moduleName = extractIdentifier(child.childForFieldName("name") ?? child.namedChildren.at(0) ?? null);
        if (!moduleName) {
          continue;
        }
        const nextNamespace = [...namespaceParts, moduleName];
        namespaceName ??= nextNamespace.join("::");
        visitStatements(findNamedChild(child, "body_statement"), void 0, nextNamespace);
        continue;
      }
      if (child.type === "class") {
        const className = extractIdentifier(child.childForFieldName("name") ?? child.namedChildren.at(0) ?? null);
        if (!className) {
          continue;
        }
        const body = findNamedChild(child, "body_statement");
        const mixins = body ? body.namedChildren.filter((item) => item !== null && item.type === "call").filter((item) => extractIdentifier(item.namedChildren.at(0) ?? null) === "include").flatMap(
          (item) => item.descendantsOfType(["constant", "identifier"]).filter((descendant) => descendant !== null).slice(1).map((descendant) => normalizeSymbolReference(descendant.text)).filter(Boolean)
        ) : [];
        draftSymbols.push({
          name: scopeName ? `${scopeName}::${className}` : className,
          kind: "class",
          signature: singleLineSignature(child.text),
          exported: true,
          callNames: [],
          extendsNames: descendantTypeNames(child.childForFieldName("superclass")),
          implementsNames: uniqueBy(mixins, (item) => item),
          bodyText: body?.text
        });
        exportLabels.push(scopeName ? `${scopeName}::${className}` : className);
        visitStatements(body, scopeName ? `${scopeName}::${className}` : className, namespaceParts);
        continue;
      }
      if (child.type === "method") {
        const methodName = extractIdentifier(child.childForFieldName("name") ?? child.namedChildren.at(0) ?? null);
        if (!methodName) {
          continue;
        }
        const symbolName = scopeName ? `${scopeName}#${methodName}` : methodName;
        draftSymbols.push({
          name: symbolName,
          kind: "function",
          signature: singleLineSignature(child.text),
          exported: true,
          callNames: [],
          extendsNames: [],
          implementsNames: [],
          bodyText: nodeText(findNamedChild(child, "body_statement") ?? child.childForFieldName("body"))
        });
        exportLabels.push(symbolName);
      }
    }
  };
  visitStatements(rootNode, void 0, []);
  return finalizeCodeAnalysis(manifest, "ruby", imports, draftSymbols, exportLabels, diagnostics, {
    namespace: namespaceName
  });
}
function powershellCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  for (const child of rootNode.descendantsOfType(["command", "class_statement", "function_statement"]).filter((item) => item !== null)) {
    if (child.type === "command") {
      const parsed = parsePowerShellImport(child);
      if (parsed) {
        imports.push(parsed);
      }
      continue;
    }
    if (child.type === "class_statement") {
      const names = child.namedChildren.filter((item) => item !== null && item.type === "simple_name").map((item) => item.text.trim());
      const className = names[0];
      if (!className) {
        continue;
      }
      draftSymbols.push({
        name: className,
        kind: "class",
        signature: singleLineSignature(child.text),
        exported: true,
        callNames: [],
        extendsNames: names.slice(1, 2),
        implementsNames: [],
        bodyText: nodeText(child.childForFieldName("body")) || child.text
      });
      exportLabels.push(className);
      for (const methodNode of child.descendantsOfType("class_method_definition").filter((item) => item !== null)) {
        const methodName = methodNode.descendantsOfType("simple_name").filter((item) => item !== null).map((item) => item.text.trim())[0];
        if (!methodName) {
          continue;
        }
        const symbolName = `${className}.${methodName}`;
        draftSymbols.push({
          name: symbolName,
          kind: "function",
          signature: singleLineSignature(methodNode.text),
          exported: true,
          callNames: [],
          extendsNames: [],
          implementsNames: [],
          bodyText: nodeText(findNamedChild(methodNode, "script_block") ?? methodNode.childForFieldName("body")) || methodNode.text
        });
        exportLabels.push(symbolName);
      }
      continue;
    }
    if (child.type === "function_statement") {
      const functionName = extractIdentifier(findNamedChild(child, "function_name") ?? child.childForFieldName("name"));
      if (!functionName) {
        continue;
      }
      draftSymbols.push({
        name: functionName,
        kind: "function",
        signature: singleLineSignature(child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(findNamedChild(child, "script_block") ?? child.childForFieldName("body")) || child.text
      });
      exportLabels.push(functionName);
    }
  }
  return finalizeCodeAnalysis(manifest, "powershell", imports, draftSymbols, exportLabels, diagnostics);
}
function parseSwiftImport(node) {
  const identifierNode = findNamedChild(node, "identifier");
  if (!identifierNode) {
    return void 0;
  }
  const specifier = identifierNode.text.trim();
  if (!specifier) {
    return void 0;
  }
  return {
    specifier,
    importedSymbols: [],
    // Swift does not have file-local relative imports; every `import` references
    // an external module (Foundation, UIKit, a SwiftPM package product, or the
    // current target's own module). Mark them all as external so the dependency
    // aggregator groups them with other package-level graph edges.
    isExternal: true,
    reExport: false
  };
}
function swiftDeclarationKindFromKeyword(node) {
  for (const child of node.children) {
    if (!child) {
      continue;
    }
    if (child.type === "struct") {
      return "struct";
    }
    if (child.type === "enum") {
      return "enum";
    }
    if (child.type === "class") {
      return "class";
    }
  }
  return "class";
}
function swiftVisibilityKeyword(node) {
  const modifiers = findNamedChild(node, "modifiers");
  if (!modifiers) {
    return void 0;
  }
  const visibility = findNamedChild(modifiers, "visibility_modifier");
  if (!visibility) {
    return void 0;
  }
  for (const kw of visibility.children) {
    if (!kw) {
      continue;
    }
    if (kw.type === "public" || kw.type === "private" || kw.type === "fileprivate" || kw.type === "internal" || kw.type === "open") {
      return kw.type;
    }
  }
  return void 0;
}
function swiftExported(node) {
  const visibility = swiftVisibilityKeyword(node);
  return visibility !== "private" && visibility !== "fileprivate";
}
function swiftCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const recordParentTypes = (declaration) => {
    const specifiers = declaration.namedChildren.filter((item) => item?.type === "inheritance_specifier");
    if (specifiers.length === 0) {
      return [];
    }
    const ordered = [];
    for (const specifier of specifiers) {
      const primary = findNamedChild(specifier, "user_type") ?? findNamedChild(specifier, "type_identifier") ?? specifier.namedChildren.find((item) => item !== null) ?? null;
      if (!primary) {
        continue;
      }
      const name = normalizeSymbolReference(primary.text);
      if (name) {
        ordered.push(name);
      }
    }
    return uniqueBy(ordered, (item) => item);
  };
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "import_declaration") {
      const parsed = parseSwiftImport(child);
      if (parsed) {
        imports.push(parsed);
      }
      continue;
    }
    if (child.type === "protocol_declaration") {
      const name = extractIdentifier(findNamedChild(child, "type_identifier"));
      if (!name) {
        continue;
      }
      const parents = recordParentTypes(child);
      const exported = swiftExported(child);
      draftSymbols.push({
        name,
        kind: "interface",
        signature: singleLineSignature(child.text),
        exported,
        callNames: [],
        extendsNames: parents,
        implementsNames: [],
        bodyText: nodeText(findNamedChild(child, "protocol_body")) || child.text
      });
      if (exported) {
        exportLabels.push(name);
      }
      continue;
    }
    if (child.type === "class_declaration") {
      const name = extractIdentifier(findNamedChild(child, "type_identifier"));
      if (!name) {
        continue;
      }
      const kind = swiftDeclarationKindFromKeyword(child);
      const parentTypes = recordParentTypes(child);
      const extendsNames = kind === "class" && parentTypes.length > 0 ? [parentTypes[0]] : [];
      const implementsNames = kind === "class" ? parentTypes.slice(1) : parentTypes;
      const exported = swiftExported(child);
      const body = findNamedChild(child, "class_body") ?? findNamedChild(child, "enum_class_body");
      draftSymbols.push({
        name,
        kind,
        signature: singleLineSignature(child.text),
        exported,
        callNames: [],
        extendsNames,
        implementsNames,
        bodyText: nodeText(body) || child.text
      });
      if (exported) {
        exportLabels.push(name);
      }
      continue;
    }
    if (child.type === "typealias_declaration") {
      const name = extractIdentifier(findNamedChild(child, "type_identifier"));
      if (!name) {
        continue;
      }
      const exported = swiftExported(child);
      draftSymbols.push({
        name,
        kind: "type_alias",
        signature: singleLineSignature(child.text),
        exported,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: child.text
      });
      if (exported) {
        exportLabels.push(name);
      }
      continue;
    }
    if (child.type === "function_declaration") {
      const name = extractIdentifier(findNamedChild(child, "simple_identifier") ?? findNamedChild(child, "identifier"));
      if (!name) {
        continue;
      }
      const exported = swiftExported(child);
      draftSymbols.push({
        name,
        kind: "function",
        signature: singleLineSignature(child.text),
        exported,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(findNamedChild(child, "function_body")) || child.text
      });
      if (exported) {
        exportLabels.push(name);
      }
      continue;
    }
    if (child.type === "property_declaration") {
      const exported = swiftExported(child);
      const patterns = child.namedChildren.filter((item) => item?.type === "pattern");
      for (const pattern of patterns) {
        const name = extractIdentifier(findNamedChild(pattern, "simple_identifier") ?? pattern.namedChildren[0] ?? null);
        if (!name) {
          continue;
        }
        draftSymbols.push({
          name,
          kind: "variable",
          signature: singleLineSignature(child.text),
          exported,
          callNames: [],
          extendsNames: [],
          implementsNames: [],
          bodyText: child.text
        });
        if (exported) {
          exportLabels.push(name);
        }
      }
    }
  }
  return finalizeCodeAnalysis(manifest, "swift", imports, draftSymbols, exportLabels, diagnostics);
}
function elixirCallIdentifier(callNode) {
  return findNamedChild(callNode, "identifier")?.text.trim() || void 0;
}
function elixirFirstModulePath(argumentsNode) {
  if (!argumentsNode) {
    return void 0;
  }
  for (const child of argumentsNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "alias" || child.type === "identifier") {
      const text = child.text.trim();
      if (text) {
        return text;
      }
    }
  }
  return void 0;
}
function elixirFunctionNameFromArguments(argumentsNode) {
  if (!argumentsNode) {
    return void 0;
  }
  const first = argumentsNode.namedChildren.find((item) => item !== null);
  if (!first) {
    return void 0;
  }
  if (first.type === "call") {
    const inner = findNamedChild(first, "identifier");
    return inner?.text.trim() || void 0;
  }
  if (first.type === "identifier") {
    return first.text.trim() || void 0;
  }
  return void 0;
}
var ELIXIR_IMPORT_MACROS = /* @__PURE__ */ new Set(["alias", "import", "require", "use"]);
var ELIXIR_PUBLIC_DEF_MACROS = /* @__PURE__ */ new Set(["def", "defmacro"]);
var ELIXIR_PRIVATE_DEF_MACROS = /* @__PURE__ */ new Set(["defp", "defmacrop"]);
function elixirCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  let primaryModuleName;
  for (const topCall of rootNode.namedChildren) {
    if (!topCall || topCall.type !== "call") {
      continue;
    }
    const macroName = elixirCallIdentifier(topCall);
    if (macroName !== "defmodule" && macroName !== "defprotocol") {
      continue;
    }
    const moduleArgs = findNamedChild(topCall, "arguments");
    const moduleName = elixirFirstModulePath(moduleArgs);
    if (!moduleName) {
      continue;
    }
    const moduleKind = macroName === "defprotocol" ? "interface" : "class";
    const moduleHeaderLine = topCall.text.split("\n")[0] ?? topCall.text;
    if (primaryModuleName === void 0) {
      primaryModuleName = moduleName;
    }
    draftSymbols.push({
      name: moduleName,
      kind: moduleKind,
      signature: singleLineSignature(moduleHeaderLine),
      // Modules and protocols are always module-level public in Elixir.
      exported: true,
      callNames: [],
      extendsNames: [],
      implementsNames: [],
      bodyText: topCall.text
    });
    exportLabels.push(moduleName);
    const doBlock = findNamedChild(topCall, "do_block");
    if (!doBlock) {
      continue;
    }
    for (const innerNode of doBlock.namedChildren) {
      if (!innerNode || innerNode.type !== "call") {
        continue;
      }
      const innerMacro = elixirCallIdentifier(innerNode);
      if (!innerMacro) {
        continue;
      }
      if (ELIXIR_IMPORT_MACROS.has(innerMacro)) {
        const importArgs = findNamedChild(innerNode, "arguments");
        const modulePath = elixirFirstModulePath(importArgs);
        if (!modulePath) {
          continue;
        }
        imports.push({
          specifier: modulePath,
          importedSymbols: [],
          // Elixir imports always target a compiled BEAM module; there is no
          // notion of "file-local" relative imports the way Python or JS use them.
          // Treat every entry as external.
          isExternal: true,
          reExport: false
        });
        continue;
      }
      if (ELIXIR_PUBLIC_DEF_MACROS.has(innerMacro) || ELIXIR_PRIVATE_DEF_MACROS.has(innerMacro)) {
        const innerArgs = findNamedChild(innerNode, "arguments");
        const fnName = elixirFunctionNameFromArguments(innerArgs);
        if (!fnName) {
          continue;
        }
        const qualifiedName = `${moduleName}.${fnName}`;
        const exported = ELIXIR_PUBLIC_DEF_MACROS.has(innerMacro);
        const headerLine = innerNode.text.split("\n")[0] ?? innerNode.text;
        draftSymbols.push({
          name: qualifiedName,
          kind: "function",
          signature: singleLineSignature(headerLine),
          exported,
          callNames: [],
          extendsNames: [],
          implementsNames: [],
          bodyText: nodeText(findNamedChild(innerNode, "do_block")) || innerNode.text
        });
        if (exported) {
          exportLabels.push(qualifiedName);
        }
      }
    }
  }
  return finalizeCodeAnalysis(manifest, "elixir", imports, draftSymbols, exportLabels, diagnostics, {
    moduleName: primaryModuleName
  });
}
function parseOCamlOpen(node) {
  const modulePath = findNamedChild(node, "module_path");
  if (!modulePath) {
    return void 0;
  }
  const specifier = modulePath.text.trim();
  if (!specifier) {
    return void 0;
  }
  return {
    specifier,
    importedSymbols: [],
    // Every OCaml `open` references a compiled module; there is no file-local
    // "./sibling" form. Classify as external and let resolveCodeImport's single-
    // candidate short-circuit promote it to local when an alias matches.
    isExternal: true,
    reExport: false
  };
}
function ocamlValueBindingKind(letBinding) {
  if (!letBinding) {
    return void 0;
  }
  const hasParameter = letBinding.namedChildren.some((child) => child?.type === "parameter");
  return hasParameter ? "function" : "variable";
}
function ocamlTypeKind(typeBinding) {
  if (!typeBinding) {
    return "type_alias";
  }
  for (const child of typeBinding.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "record_declaration") {
      return "struct";
    }
    if (child.type === "variant_declaration") {
      return "enum";
    }
  }
  return "type_alias";
}
function ocamlCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "open_module") {
      const parsed = parseOCamlOpen(child);
      if (parsed) {
        imports.push(parsed);
      }
      continue;
    }
    if (child.type === "module_definition") {
      const binding = findNamedChild(child, "module_binding");
      const moduleNameNode = binding ? findNamedChild(binding, "module_name") : null;
      const name = moduleNameNode?.text.trim();
      if (!name) {
        continue;
      }
      draftSymbols.push({
        name,
        kind: "class",
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        // OCaml's `let`/`module` bindings are exported from the containing
        // compilation unit unless an explicit `.mli` interface hides them.
        // Treat everything defined in a `.ml` file as exported; consumers who
        // want hiding should rely on the downstream interface-file merge.
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(findNamedChild(binding, "structure")) || child.text
      });
      exportLabels.push(name);
      continue;
    }
    if (child.type === "module_type_definition") {
      const nameNode = findNamedChild(child, "module_type_name");
      const name = nameNode?.text.trim();
      if (!name) {
        continue;
      }
      draftSymbols.push({
        name,
        kind: "interface",
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(findNamedChild(child, "signature")) || child.text
      });
      exportLabels.push(name);
      continue;
    }
    if (child.type === "type_definition") {
      const binding = findNamedChild(child, "type_binding");
      const typeConstructorNode = binding ? findNamedChild(binding, "type_constructor") : null;
      const name = typeConstructorNode?.text.trim();
      if (!name) {
        continue;
      }
      const kind = ocamlTypeKind(binding);
      draftSymbols.push({
        name,
        kind,
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: child.text
      });
      exportLabels.push(name);
      continue;
    }
    if (child.type === "value_definition") {
      const binding = findNamedChild(child, "let_binding");
      if (!binding) {
        continue;
      }
      const valueNameNode = findNamedChild(binding, "value_name");
      const name = valueNameNode?.text.trim();
      if (!name) {
        continue;
      }
      const kind = ocamlValueBindingKind(binding) ?? "function";
      draftSymbols.push({
        name,
        kind,
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: child.text
      });
      exportLabels.push(name);
    }
  }
  return finalizeCodeAnalysis(manifest, "ocaml", imports, draftSymbols, exportLabels, diagnostics);
}
function objcCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const declaredClassNames = /* @__PURE__ */ new Set();
  const functionNameFromDeclarator = (node) => {
    if (!node) {
      return void 0;
    }
    const declarator = node.childForFieldName("declarator");
    if (declarator) {
      return functionNameFromDeclarator(declarator);
    }
    return extractIdentifier(node);
  };
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "preproc_include") {
      const parsed = parseCppInclude(child);
      if (parsed) {
        imports.push(parsed);
      }
      continue;
    }
    if (child.type === "protocol_declaration") {
      const nameNode = findNamedChild(child, "identifier");
      const name = nameNode?.text.trim();
      if (!name) {
        continue;
      }
      const refList = findNamedChild(child, "protocol_reference_list");
      const parents = refList ? uniqueBy(
        refList.namedChildren.filter((item) => item?.type === "identifier").map((item) => item.text.trim()).filter(Boolean),
        (item) => item
      ) : [];
      draftSymbols.push({
        name,
        kind: "interface",
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: parents,
        implementsNames: [],
        bodyText: child.text
      });
      exportLabels.push(name);
      continue;
    }
    if (child.type === "class_interface") {
      const identifierChildren = child.namedChildren.filter((item) => item?.type === "identifier");
      const name = identifierChildren[0]?.text.trim();
      if (!name) {
        continue;
      }
      const superclass = identifierChildren[1]?.text.trim();
      const parameterized = findNamedChild(child, "parameterized_arguments");
      const protocols = parameterized ? uniqueBy(
        parameterized.namedChildren.filter((item) => item?.type === "type_name" || item?.type === "identifier").map((item) => item.text.trim()).filter(Boolean),
        (item) => item
      ) : [];
      declaredClassNames.add(name);
      draftSymbols.push({
        name,
        kind: "class",
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: superclass ? [superclass] : [],
        implementsNames: protocols,
        bodyText: child.text
      });
      exportLabels.push(name);
      continue;
    }
    if (child.type === "class_implementation") {
      const nameNode = findNamedChild(child, "identifier");
      const name = nameNode?.text.trim();
      if (!name) {
        continue;
      }
      if (declaredClassNames.has(name)) {
        continue;
      }
      declaredClassNames.add(name);
      draftSymbols.push({
        name,
        kind: "class",
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: child.text
      });
      exportLabels.push(name);
      continue;
    }
    if (child.type === "function_definition") {
      const name = functionNameFromDeclarator(child.childForFieldName("declarator"));
      if (!name) {
        continue;
      }
      draftSymbols.push({
        name,
        kind: "function",
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(child.childForFieldName("body")) || child.text
      });
      exportLabels.push(name);
    }
  }
  return finalizeCodeAnalysis(manifest, "objc", imports, draftSymbols, exportLabels, diagnostics);
}
function rescriptCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const rescriptTypeKind = (typeBinding) => {
    if (!typeBinding) {
      return "type_alias";
    }
    for (const child of typeBinding.namedChildren) {
      if (!child) {
        continue;
      }
      if (child.type === "variant_type") {
        return "enum";
      }
      if (child.type === "record_type") {
        return "struct";
      }
    }
    return "type_alias";
  };
  const rescriptLetBindingKind = (letBinding) => {
    if (!letBinding) {
      return "variable";
    }
    for (const child of letBinding.namedChildren) {
      if (child?.type === "function") {
        return "function";
      }
    }
    return "variable";
  };
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "open_statement") {
      const identNode = findNamedChild(child, "module_identifier");
      const specifier = identNode?.text.trim();
      if (!specifier) {
        continue;
      }
      imports.push({
        specifier,
        importedSymbols: [],
        // ReScript modules resolve through the build system's own module graph;
        // they are never file-local in the Python "./relative" sense.
        isExternal: true,
        reExport: false
      });
      continue;
    }
    if (child.type === "module_declaration") {
      const binding = findNamedChild(child, "module_binding");
      const nameNode = binding ? findNamedChild(binding, "module_identifier") : null;
      const name = nameNode?.text.trim();
      if (!name) {
        continue;
      }
      draftSymbols.push({
        name,
        kind: "class",
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(findNamedChild(binding, "block")) || child.text
      });
      exportLabels.push(name);
      continue;
    }
    if (child.type === "type_declaration") {
      const binding = findNamedChild(child, "type_binding");
      const nameNode = binding ? findNamedChild(binding, "type_identifier") : null;
      const name = nameNode?.text.trim();
      if (!name) {
        continue;
      }
      const kind = rescriptTypeKind(binding);
      draftSymbols.push({
        name,
        kind,
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: child.text
      });
      exportLabels.push(name);
      continue;
    }
    if (child.type === "let_declaration") {
      const binding = findNamedChild(child, "let_binding");
      const nameNode = binding ? findNamedChild(binding, "value_identifier") : null;
      const name = nameNode?.text.trim();
      if (!name) {
        continue;
      }
      const kind = rescriptLetBindingKind(binding);
      draftSymbols.push({
        name,
        kind,
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: child.text
      });
      exportLabels.push(name);
    }
  }
  return finalizeCodeAnalysis(manifest, "rescript", imports, draftSymbols, exportLabels, diagnostics);
}
function parseSolidityImport(node) {
  const stringNode = node.namedChildren.find((item) => item?.type === "string");
  if (!stringNode) {
    return [];
  }
  const specifier = quotedPath(stringNode.text);
  if (!specifier) {
    return [];
  }
  const importedSymbols = uniqueBy(
    node.namedChildren.filter((item) => item?.type === "identifier").map((item) => item.text.trim()).filter(Boolean),
    (item) => item
  );
  const isLocal = specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/");
  return [
    {
      specifier,
      importedSymbols,
      isExternal: !isLocal,
      reExport: false
    }
  ];
}
function solidityCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const collectParents = (declaration) => {
    const specifiers = declaration.namedChildren.filter((item) => item?.type === "inheritance_specifier");
    const names = [];
    for (const specifier of specifiers) {
      for (const node of specifier.namedChildren) {
        if (node && (node.type === "user_defined_type" || node.type === "identifier")) {
          const text = normalizeSymbolReference(node.text);
          if (text) {
            names.push(text);
          }
        }
      }
    }
    return uniqueBy(names, (item) => item);
  };
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "import_directive") {
      for (const parsed of parseSolidityImport(child)) {
        imports.push(parsed);
      }
      continue;
    }
    if (child.type === "interface_declaration") {
      const nameNode = findNamedChild(child, "identifier");
      const name = nameNode?.text.trim();
      if (!name) {
        continue;
      }
      const parents = collectParents(child);
      draftSymbols.push({
        name,
        kind: "interface",
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: parents,
        implementsNames: [],
        bodyText: nodeText(findNamedChild(child, "contract_body")) || child.text
      });
      exportLabels.push(name);
      continue;
    }
    if (child.type === "library_declaration" || child.type === "contract_declaration") {
      const nameNode = findNamedChild(child, "identifier");
      const name = nameNode?.text.trim();
      if (!name) {
        continue;
      }
      const parents = child.type === "contract_declaration" ? collectParents(child) : [];
      draftSymbols.push({
        name,
        kind: "class",
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        // Solidity supports multiple inheritance; list every parent contract
        // as a `implements` edge rather than arbitrarily promoting one to
        // `extends`.
        implementsNames: parents,
        bodyText: nodeText(findNamedChild(child, "contract_body")) || child.text
      });
      exportLabels.push(name);
      continue;
    }
    if (child.type === "struct_declaration") {
      const nameNode = findNamedChild(child, "identifier");
      const name = nameNode?.text.trim();
      if (!name) {
        continue;
      }
      draftSymbols.push({
        name,
        kind: "struct",
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: child.text
      });
      exportLabels.push(name);
      continue;
    }
    if (child.type === "enum_declaration") {
      const nameNode = findNamedChild(child, "identifier");
      const name = nameNode?.text.trim();
      if (!name) {
        continue;
      }
      draftSymbols.push({
        name,
        kind: "enum",
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: child.text
      });
      exportLabels.push(name);
      continue;
    }
    if (child.type === "function_definition") {
      const nameNode = findNamedChild(child, "identifier");
      const name = nameNode?.text.trim();
      if (!name) {
        continue;
      }
      draftSymbols.push({
        name,
        kind: "function",
        signature: singleLineSignature(child.text.split("\n")[0] ?? child.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(findNamedChild(child, "function_body")) || child.text
      });
      exportLabels.push(name);
    }
  }
  return finalizeCodeAnalysis(manifest, "solidity", imports, draftSymbols, exportLabels, diagnostics);
}
function htmlAttributeValue(attribute) {
  const quoted = attribute.namedChildren.find((c) => c?.type === "quoted_attribute_value");
  if (quoted) {
    const inner = quoted.namedChildren.find((c) => c?.type === "attribute_value");
    if (inner) {
      return inner.text.trim();
    }
    const raw = quoted.text;
    if (raw.length >= 2 && (raw[0] === '"' || raw[0] === "'")) {
      return raw.slice(1, -1).trim();
    }
    return raw.trim();
  }
  const bare = attribute.namedChildren.find((c) => c?.type === "attribute_value");
  return bare?.text.trim();
}
function htmlAttributesOf(element) {
  const out = /* @__PURE__ */ new Map();
  const startTag = findNamedChild(element, "start_tag") ?? findNamedChild(element, "self_closing_tag");
  if (!startTag) {
    return out;
  }
  for (const child of startTag.namedChildren) {
    if (!child || child.type !== "attribute") {
      continue;
    }
    const nameNode = findNamedChild(child, "attribute_name");
    const name = nameNode?.text.trim().toLowerCase();
    if (!name) {
      continue;
    }
    const value = htmlAttributeValue(child);
    if (value !== void 0) {
      out.set(name, value);
    }
  }
  return out;
}
function htmlTagName(element) {
  const startTag = findNamedChild(element, "start_tag") ?? findNamedChild(element, "self_closing_tag") ?? null;
  if (!startTag) {
    return void 0;
  }
  return findNamedChild(startTag, "tag_name")?.text.trim().toLowerCase();
}
function htmlCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const seenSymbolNames = /* @__PURE__ */ new Set();
  const isLocalAssetSpecifier = (specifier) => {
    if (!specifier) {
      return false;
    }
    if (specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/")) {
      return true;
    }
    if (specifier.startsWith("http://") || specifier.startsWith("https://") || specifier.startsWith("//")) {
      return false;
    }
    return !specifier.includes(":");
  };
  const elements = rootNode.descendantsOfType(["element", "script_element", "style_element"]).filter((item) => item !== null);
  for (const element of elements) {
    const attrs = htmlAttributesOf(element);
    const tagName = htmlTagName(element);
    if (tagName === "link") {
      const rel = attrs.get("rel");
      const href = attrs.get("href");
      if (rel === "stylesheet" && href) {
        imports.push({
          specifier: href,
          importedSymbols: [],
          isExternal: !isLocalAssetSpecifier(href),
          reExport: false
        });
      }
      continue;
    }
    if (element.type === "script_element") {
      const src = attrs.get("src");
      if (src) {
        imports.push({
          specifier: src,
          importedSymbols: [],
          isExternal: !isLocalAssetSpecifier(src),
          reExport: false
        });
      }
      continue;
    }
    if (tagName?.includes("-")) {
      if (!seenSymbolNames.has(tagName)) {
        seenSymbolNames.add(tagName);
        draftSymbols.push({
          name: tagName,
          kind: "class",
          signature: singleLineSignature(element.text.split("\n")[0] ?? element.text),
          exported: true,
          callNames: [],
          extendsNames: [],
          implementsNames: [],
          bodyText: element.text
        });
        exportLabels.push(tagName);
      }
    }
    const id = attrs.get("id");
    if (id && !seenSymbolNames.has(id)) {
      seenSymbolNames.add(id);
      draftSymbols.push({
        name: id,
        kind: "variable",
        signature: singleLineSignature(element.text.split("\n")[0] ?? element.text),
        exported: true,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: element.text
      });
      exportLabels.push(id);
    }
  }
  return finalizeCodeAnalysis(manifest, "html", imports, draftSymbols, exportLabels, diagnostics);
}
function parseCssImport(node) {
  const directString = node.namedChildren.find((c) => c?.type === "string_value");
  if (directString) {
    const specifier = quotedPath(directString.text);
    if (!specifier) {
      return void 0;
    }
    return {
      specifier,
      importedSymbols: [],
      isExternal: !(specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/")),
      reExport: false
    };
  }
  const call = node.namedChildren.find((c) => c?.type === "call_expression");
  if (call) {
    const args = findNamedChild(call, "arguments");
    const stringNode = args?.namedChildren.find((c) => c?.type === "string_value");
    if (stringNode) {
      const specifier = quotedPath(stringNode.text);
      if (!specifier) {
        return void 0;
      }
      return {
        specifier,
        importedSymbols: [],
        isExternal: !(specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/")),
        reExport: false
      };
    }
  }
  return void 0;
}
function cssCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const seenSymbols = /* @__PURE__ */ new Set();
  const addSelectorSymbol = (name, ruleText) => {
    const trimmed = name.trim();
    if (!trimmed || seenSymbols.has(trimmed)) {
      return;
    }
    seenSymbols.add(trimmed);
    draftSymbols.push({
      name: trimmed,
      kind: "class",
      signature: singleLineSignature(ruleText.split("\n")[0] ?? ruleText),
      exported: true,
      callNames: [],
      extendsNames: [],
      implementsNames: [],
      bodyText: ruleText
    });
    exportLabels.push(trimmed);
  };
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "import_statement") {
      const parsed = parseCssImport(child);
      if (parsed) {
        imports.push(parsed);
      }
      continue;
    }
    if (child.type === "rule_set") {
      const selectors = findNamedChild(child, "selectors");
      if (!selectors) {
        continue;
      }
      const selectorText = normalizeWhitespace(selectors.text);
      addSelectorSymbol(selectorText, child.text);
      continue;
    }
    if (child.type === "keyframes_statement") {
      const nameNode = child.namedChildren.find((c) => c?.type === "keyframes_name" || c?.type === "plain_value");
      const name = nameNode?.text.trim();
      if (name) {
        addSelectorSymbol(`@keyframes ${name}`, child.text);
      }
    }
  }
  return finalizeCodeAnalysis(manifest, "css", imports, draftSymbols, exportLabels, diagnostics);
}
function vueCodeAnalysis(manifest, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const seenSymbols = /* @__PURE__ */ new Set();
  const repoPath = manifest.repoRelativePath ?? path3.basename(manifest.originalPath ?? manifest.storedPath);
  const basename = path3.posix.basename(stripCodeExtension(toPosix(repoPath)));
  if (basename) {
    seenSymbols.add(basename);
    draftSymbols.push({
      name: basename,
      kind: "class",
      signature: `vue component ${basename}`,
      exported: true,
      callNames: [],
      extendsNames: [],
      implementsNames: [],
      bodyText: rootNode.text
    });
    exportLabels.push(basename);
  }
  const templateElement = rootNode.namedChildren.find((c) => c?.type === "template_element");
  if (templateElement) {
    const elements = templateElement.descendantsOfType(["element"]).filter((item) => item !== null);
    for (const element of elements) {
      const tagName = htmlTagName(element);
      const attrs = htmlAttributesOf(element);
      const startTag = findNamedChild(element, "start_tag") ?? findNamedChild(element, "self_closing_tag") ?? null;
      const rawTagName = startTag ? findNamedChild(startTag, "tag_name")?.text.trim() : void 0;
      if (rawTagName && /^[A-Z]/.test(rawTagName) && !seenSymbols.has(rawTagName)) {
        seenSymbols.add(rawTagName);
        draftSymbols.push({
          name: rawTagName,
          kind: "class",
          signature: singleLineSignature(element.text.split("\n")[0] ?? element.text),
          exported: true,
          callNames: [],
          extendsNames: [],
          implementsNames: [],
          bodyText: element.text
        });
        exportLabels.push(rawTagName);
      }
      if (tagName && !tagName.includes("-") && !(rawTagName && /^[A-Z]/.test(rawTagName))) {
        const id = attrs.get("id");
        if (id && !seenSymbols.has(id)) {
          seenSymbols.add(id);
          draftSymbols.push({
            name: id,
            kind: "variable",
            signature: singleLineSignature(element.text.split("\n")[0] ?? element.text),
            exported: true,
            callNames: [],
            extendsNames: [],
            implementsNames: [],
            bodyText: element.text
          });
          exportLabels.push(id);
        }
      }
    }
  }
  return finalizeCodeAnalysis(manifest, "vue", imports, draftSymbols, exportLabels, diagnostics);
}
function cFamilyCodeAnalysis(manifest, language, rootNode, diagnostics) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const functionNameFromDeclarator = (node) => {
    if (!node) {
      return void 0;
    }
    const declarator = node.childForFieldName("declarator");
    if (declarator) {
      return functionNameFromDeclarator(declarator);
    }
    return extractIdentifier(node);
  };
  for (const child of rootNode.namedChildren) {
    if (!child) {
      continue;
    }
    if (child.type === "preproc_include") {
      const parsed = parseCppInclude(child);
      if (parsed) {
        imports.push(parsed);
      }
      continue;
    }
    if (["class_specifier", "struct_specifier", "enum_specifier"].includes(child.type)) {
      const name = extractIdentifier(child.childForFieldName("name"));
      if (!name) {
        continue;
      }
      const kind = child.type === "enum_specifier" ? "enum" : child.type === "struct_specifier" ? "struct" : "class";
      const baseClassClause = findNamedChild(child, "base_class_clause") ?? child.childForFieldName("base_class_clause");
      const bases = baseClassClause ? uniqueBy(
        baseClassClause.namedChildren.filter((item) => item !== null && item.type !== "access_specifier").map((item) => normalizeSymbolReference(item.text.replace(/\b(public|private|protected|virtual)\b/g, "").trim())).filter(Boolean),
        (item) => item
      ) : [];
      const exported = !/\bstatic\b/.test(child.text);
      draftSymbols.push({
        name,
        kind,
        signature: singleLineSignature(child.text),
        exported,
        callNames: [],
        extendsNames: bases,
        implementsNames: [],
        bodyText: nodeText(child.childForFieldName("body")) || child.text
      });
      if (exported) {
        exportLabels.push(name);
      }
      continue;
    }
    if (child.type === "function_definition") {
      const name = functionNameFromDeclarator(child.childForFieldName("declarator"));
      if (!name) {
        continue;
      }
      const exported = !/\bstatic\b/.test(child.text);
      draftSymbols.push({
        name,
        kind: "function",
        signature: singleLineSignature(child.text),
        exported,
        callNames: [],
        extendsNames: [],
        implementsNames: [],
        bodyText: nodeText(child.childForFieldName("body")) || child.text
      });
      if (exported) {
        exportLabels.push(name);
      }
    }
  }
  return finalizeCodeAnalysis(manifest, language, imports, draftSymbols, exportLabels, diagnostics);
}
async function analyzeTreeSitterCode(manifest, content, language) {
  if (language === "swift" && !swiftTreeSitterEnabled()) {
    return {
      code: finalizeCodeAnalysis(manifest, language, [], [], [], [swiftTreeSitterDisabledDiagnostic()]),
      rationales: []
    };
  }
  const parseInput = language === "c" || language === "cpp" || language === "csharp" ? neutralizePreprocessorDirectives(content) : content;
  let tree = null;
  try {
    const module = await getTreeSitterModule();
    await ensureTreeSitterInit(module);
    const parser = new module.Parser();
    parser.setLanguage(await loadLanguage(language));
    tree = parser.parse(parseInput);
  } catch (error) {
    const diagnostic = treeSitterCompatibilityDiagnostic(language, error);
    if (language === "bash" && typeof diagnostic.message === "string" && diagnostic.message.includes("resolved is not a function")) {
      diagnostic.category = "warning";
    }
    return {
      code: finalizeCodeAnalysis(manifest, language, [], [], [], [diagnostic]),
      rationales: []
    };
  }
  if (!tree) {
    return {
      code: finalizeCodeAnalysis(
        manifest,
        language,
        [],
        [],
        [],
        [
          {
            code: 9e3,
            category: "error",
            message: `Failed to parse ${language} source.`,
            line: 1,
            column: 1
          }
        ]
      ),
      rationales: []
    };
  }
  try {
    const suppressDiagnostics = language === "lua" || language === "bash" && detectShellDialect(content) === "zsh";
    const rawDiagnostics = suppressDiagnostics ? [] : diagnosticsFromTree(tree.rootNode);
    const grammarGappedLanguages = /* @__PURE__ */ new Set(["c", "cpp", "csharp", "bash"]);
    const diagnostics = grammarGappedLanguages.has(language) ? rawDiagnostics.map((d) => d.category === "error" ? { ...d, category: "warning" } : d) : rawDiagnostics;
    const rationales = extractTreeSitterRationales(manifest, language, tree.rootNode);
    switch (language) {
      case "bash":
        return { code: bashCodeAnalysis(manifest, tree.rootNode, diagnostics, content), rationales };
      case "python":
        return { code: pythonCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "go":
        return { code: goCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "rust":
        return { code: rustCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "java":
        return { code: javaCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "kotlin":
        return { code: kotlinCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "scala":
        return { code: scalaCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "dart":
        return { code: dartCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "lua":
        return { code: luaCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "zig":
        return { code: zigCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "csharp":
        return { code: csharpCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "php":
        return { code: phpCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "ruby":
        return { code: rubyCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "powershell":
        return { code: powershellCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "swift":
        return { code: swiftCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "elixir":
        return { code: elixirCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "ocaml":
        return { code: ocamlCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "objc":
        return { code: objcCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "rescript":
        return { code: rescriptCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "solidity":
        return { code: solidityCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "html":
        return { code: htmlCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "css":
        return { code: cssCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "vue":
        return { code: vueCodeAnalysis(manifest, tree.rootNode, diagnostics), rationales };
      case "c":
      case "cpp":
        return { code: cFamilyCodeAnalysis(manifest, language, tree.rootNode, diagnostics), rationales };
      default:
        return {
          code: finalizeCodeAnalysis(
            manifest,
            language,
            [],
            [],
            [],
            [
              {
                code: 9011,
                category: "error",
                message: `No parser-backed analyzer is registered for ${language}.`,
                line: 1,
                column: 1
              }
            ]
          ),
          rationales
        };
    }
  } finally {
    tree.delete();
  }
}

// src/code-analysis.ts
var require3 = createRequire2(import.meta.url);
var { Parser: SqlParser } = require3("node-sql-parser");
function scriptKindFor(language) {
  switch (language) {
    case "typescript":
      return ts.ScriptKind.TS;
    case "tsx":
      return ts.ScriptKind.TSX;
    case "jsx":
      return ts.ScriptKind.JSX;
    default:
      return ts.ScriptKind.JS;
  }
}
function isRelativeSpecifier(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith(".");
}
function isLocalIncludeSpecifier(specifier) {
  return specifier.startsWith(".") || specifier.startsWith("/") || specifier.includes("/");
}
function bashSpecifierLooksLocal2(specifier) {
  return isLocalIncludeSpecifier(specifier) || /\.(?:sh|bash|zsh)$/i.test(specifier);
}
function dartSpecifierLooksLocal2(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/") || !specifier.startsWith("package:") && !specifier.includes(":") && specifier.endsWith(".dart");
}
function interpreterFromShebang(content) {
  if (!content?.startsWith("#!")) {
    return void 0;
  }
  const firstLine = content.split(/\r?\n/, 1)[0]?.slice(2).trim() ?? "";
  if (!firstLine) {
    return void 0;
  }
  const parts = firstLine.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return void 0;
  }
  const basename = (value) => path4.posix.basename(value.trim());
  if (basename(parts[0] ?? "") === "env") {
    const interpreter = parts.slice(1).find((part) => !part.startsWith("-"));
    return interpreter ? basename(interpreter) : void 0;
  }
  return basename(parts[0] ?? "");
}
function languageFromInterpreter(interpreter) {
  switch (interpreter) {
    case "sh":
    case "bash":
    case "zsh":
    case "dash":
    case "ksh":
    case "ash":
      return "bash";
    case "node":
    case "nodejs":
      return "javascript";
    case "python":
    case "python2":
    case "python3":
      return "python";
    case "ruby":
      return "ruby";
    case "php":
      return "php";
    case "lua":
      return "lua";
    default:
      return void 0;
  }
}
function formatDiagnosticCategory(category) {
  switch (category) {
    case ts.DiagnosticCategory.Error:
      return "error";
    case ts.DiagnosticCategory.Warning:
      return "warning";
    case ts.DiagnosticCategory.Suggestion:
      return "suggestion";
    default:
      return "message";
  }
}
function declarationSignature(node, sourceFile) {
  const sourceText = sourceFile.getFullText();
  if (ts.isFunctionDeclaration(node) && node.body) {
    return truncate(normalizeWhitespace(sourceText.slice(node.getStart(sourceFile), node.body.getStart(sourceFile)).trim()), 180);
  }
  if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node)) {
    const membersPos = node.members.pos;
    return truncate(
      normalizeWhitespace(
        sourceText.slice(node.getStart(sourceFile), membersPos).replace(/\{\s*$/, "").trim()
      ),
      180
    );
  }
  return truncate(normalizeWhitespace(node.getText(sourceFile)), 180);
}
function importSpecifierText(specifier) {
  return specifier.propertyName ? `${specifier.propertyName.text} as ${specifier.name.text}` : specifier.name.text;
}
function exportSpecifierText(specifier) {
  return specifier.propertyName ? `${specifier.propertyName.text} as ${specifier.name.text}` : specifier.name.text;
}
function collectCallNames(root, availableNames, selfName) {
  if (!root) {
    return [];
  }
  const names = [];
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && availableNames.has(node.expression.text)) {
      if (node.expression.text !== selfName) {
        names.push(node.expression.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return uniqueBy(names, (name) => name);
}
function collectCallNamesFromText2(text, availableNames, selfName) {
  if (!text) {
    return [];
  }
  const names = [];
  for (const name of availableNames) {
    if (name === selfName) {
      continue;
    }
    const pattern = new RegExp(`\\b${escapeRegExp2(name)}\\s*\\(`, "g");
    if (pattern.test(text)) {
      names.push(name);
    }
  }
  return uniqueBy(names, (name) => name);
}
function heritageNames(clauses, token) {
  return uniqueBy(
    (clauses ?? []).filter((clause) => clause.token === token).flatMap(
      (clause) => clause.types.map((typeNode) => {
        if (ts.isIdentifier(typeNode.expression)) {
          return typeNode.expression.text;
        }
        if (ts.isPropertyAccessExpression(typeNode.expression)) {
          return typeNode.expression.getText();
        }
        return typeNode.getText();
      })
    ),
    (name) => name
  );
}
function isNodeExported(node) {
  return Boolean(
    ts.canHaveModifiers(node) && ts.getModifiers(node)?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword || modifier.kind === ts.SyntaxKind.DefaultKeyword
    )
  );
}
function makeSymbolId2(scope, name, kind, seen) {
  const base = `${slugify(name)}.${kind}`;
  const count = (seen.get(base) ?? 0) + 1;
  seen.set(base, count);
  return `symbol:${scope}:${count === 1 ? base : `${base}-${count}`}`;
}
function summarizeModule(manifest, code) {
  const localImports = code.imports.filter((item) => !item.isExternal && !item.reExport).length;
  const externalImports = code.imports.filter((item) => item.isExternal).length;
  const exportedCount = code.symbols.filter((symbol) => symbol.exported).length;
  const parts = [`${code.language} module`, `defining ${code.symbols.length} top-level symbol(s)`, `exporting ${exportedCount} symbol(s)`];
  if (localImports > 0) {
    parts.push(`importing ${localImports} local module(s)`);
  }
  if (externalImports > 0) {
    parts.push(`depending on ${externalImports} external package import(s)`);
  }
  if (code.diagnostics.length > 0) {
    parts.push(`with ${code.diagnostics.length} parser diagnostic(s)`);
  }
  return `${manifest.title} is a ${parts.join(", ")}.`;
}
function codeClaims(manifest, code) {
  const claims = [];
  if (code.exports.length > 0) {
    claims.push({
      text: `${manifest.title} exports ${code.exports.slice(0, 4).join(", ")}${code.exports.length > 4 ? ", and more" : ""}.`,
      confidence: 1,
      status: "extracted",
      polarity: "neutral",
      citation: manifest.sourceId
    });
  }
  if (code.symbols.length > 0) {
    claims.push({
      text: `${manifest.title} defines ${code.symbols.slice(0, 5).map((symbol) => symbol.name).join(", ")}${code.symbols.length > 5 ? ", and more" : ""}.`,
      confidence: 1,
      status: "extracted",
      polarity: "neutral",
      citation: manifest.sourceId
    });
  }
  if (code.imports.length > 0) {
    claims.push({
      text: `${manifest.title} imports ${code.imports.slice(0, 4).map((item) => item.specifier).join(", ")}${code.imports.length > 4 ? ", and more" : ""}.`,
      confidence: 1,
      status: "extracted",
      polarity: "neutral",
      citation: manifest.sourceId
    });
  }
  if (code.diagnostics.length > 0) {
    claims.push({
      text: `${manifest.title} has ${code.diagnostics.length} parser diagnostic(s) that should be reviewed before trusting the module summary.`,
      confidence: 1,
      status: "extracted",
      polarity: "negative",
      citation: manifest.sourceId
    });
  }
  return claims.slice(0, 4).map((claim, index) => ({
    id: `claim:${manifest.sourceId}:${index + 1}`,
    ...claim
  }));
}
function codeQuestions(manifest, code) {
  const questions = [
    code.exports.length > 0 ? `Which downstream pages should explain how ${manifest.title} exports are consumed?` : "",
    code.imports.some((item) => !item.isExternal) ? `How does ${manifest.title} coordinate with its imported local modules?` : "",
    code.dependencies[0] ? `Why does ${manifest.title} depend on ${code.dependencies[0]}?` : "",
    `What broader responsibility does ${manifest.title} serve in the codebase?`
  ].filter(Boolean);
  return uniqueBy(questions, (question) => question).slice(0, 4);
}
function resolveVariableKind(statement) {
  return statement.declarationList.flags & ts.NodeFlags.Const ? "variable" : "variable";
}
function normalizeSymbolReference2(value) {
  const withoutGenerics = value.replace(/<[^>]*>/g, "");
  const withoutDecorators = withoutGenerics.replace(/['"&*()[\]{}]/g, " ");
  const trimmed = withoutDecorators.trim();
  const lastSegment = trimmed.split(/::|\./).filter(Boolean).at(-1) ?? trimmed;
  return lastSegment.replace(/[,:;]+$/g, "").trim();
}
function buildDiagnostic(code, message, line, column = 1, category = "warning") {
  return { code, category, message, line, column };
}
var RATIONALE_MARKERS2 = ["NOTE:", "IMPORTANT:", "HACK:", "WHY:", "RATIONALE:"];
function stripKnownCommentPrefix2(line) {
  let next = line.trim();
  for (const prefix of ["/**", "/*", "*/", "//", "#", "*"]) {
    if (next.startsWith(prefix)) {
      next = next.slice(prefix.length).trimStart();
    }
  }
  return next;
}
function cleanCommentText2(value) {
  return normalizeWhitespace(
    value.split(/\r?\n/).map((line) => stripKnownCommentPrefix2(line)).join("\n").trim()
  );
}
function rationaleKindFromText2(text) {
  const upper = text.toUpperCase();
  return RATIONALE_MARKERS2.some((marker) => upper.startsWith(marker)) ? "marker" : "comment";
}
function normalizeRationaleText2(value) {
  let next = normalizeWhitespace(value.trim());
  const upper = next.toUpperCase();
  for (const marker of RATIONALE_MARKERS2) {
    if (upper.startsWith(marker)) {
      next = next.slice(marker.length).trimStart();
      break;
    }
  }
  return next;
}
function isLikelyRationaleText2(value) {
  if (value.length < 20) {
    return false;
  }
  const upper = value.toUpperCase();
  if (RATIONALE_MARKERS2.some((marker) => upper.startsWith(marker))) {
    return true;
  }
  const lower = value.toLowerCase();
  return ["why", "because", "tradeoff", "important", "avoid", "workaround", "reason", "so that", "in order to"].some(
    (needle) => lower.includes(needle)
  );
}
function makeRationale2(manifest, index, text, kind, symbolName) {
  const normalized = normalizeRationaleText2(cleanCommentText2(text));
  if (!isLikelyRationaleText2(normalized)) {
    return null;
  }
  return {
    id: `rationale:${manifest.sourceId}:${index}`,
    text: truncate(normalized, 280),
    citation: manifest.sourceId,
    kind,
    symbolName
  };
}
function stripCodeExtension2(filePath) {
  return filePath.replace(
    /\.(?:[cm]?jsx?|tsx?|mts|cts|sh|bash|zsh|py|go|rs|java|kt|kts|scala|sc|dart|lua|zig|cs|php|c|cc|cpp|cxx|h|hh|hpp|hxx|sql)$/i,
    ""
  );
}
function manifestModuleName2(manifest, language) {
  const repoPath = manifest.repoRelativePath ?? path4.basename(manifest.originalPath ?? manifest.storedPath);
  const normalized = toPosix(stripCodeExtension2(repoPath)).replace(/^\.\/+/, "");
  if (!normalized) {
    return void 0;
  }
  if (language === "python") {
    const dotted = normalized.replace(/\/__init__$/i, "").replace(/\//g, ".").replace(/^src\./, "");
    return dotted || path4.posix.basename(normalized);
  }
  return normalized.endsWith("/index") ? normalized.slice(0, -"/index".length) || path4.posix.basename(normalized) : normalized;
}
function finalizeCodeAnalysis2(manifest, language, imports, draftSymbols, exportLabels, diagnostics, metadata) {
  const topLevelNames = new Set(draftSymbols.map((symbol) => symbol.name));
  for (const symbol of draftSymbols) {
    if (symbol.callNames.length === 0 && symbol.bodyText) {
      symbol.callNames = collectCallNamesFromText2(symbol.bodyText, topLevelNames, symbol.name);
    }
  }
  const seenSymbolIds = /* @__PURE__ */ new Map();
  const symbolScope = metadata?.namespace ? `ns:${slugify(metadata.namespace)}` : manifest.sourceId;
  const symbols = draftSymbols.map((symbol) => ({
    id: makeSymbolId2(symbolScope, symbol.name, symbol.kind, seenSymbolIds),
    name: symbol.name,
    kind: symbol.kind,
    signature: symbol.signature,
    exported: symbol.exported,
    calls: uniqueBy(symbol.callNames, (name) => name),
    extends: uniqueBy(symbol.extendsNames.map((name) => normalizeSymbolReference2(name)).filter(Boolean), (name) => name),
    implements: uniqueBy(symbol.implementsNames.map((name) => normalizeSymbolReference2(name)).filter(Boolean), (name) => name)
  }));
  return {
    moduleId: `module:${manifest.sourceId}`,
    language,
    moduleName: metadata?.moduleName ?? manifestModuleName2(manifest, language),
    namespace: metadata?.namespace,
    imports,
    dependencies: uniqueBy(
      imports.filter((item) => item.isExternal).map((item) => item.specifier),
      (specifier) => specifier
    ),
    symbols,
    exports: uniqueBy([...symbols.filter((symbol) => symbol.exported).map((symbol) => symbol.name), ...exportLabels], (label) => label),
    diagnostics
  };
}
function statementRationaleSymbolName(statement) {
  if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement) || ts.isEnumDeclaration(statement)) && statement.name) {
    return statement.name.text;
  }
  if (ts.isTypeAliasDeclaration(statement)) {
    return statement.name.text;
  }
  if (ts.isVariableStatement(statement)) {
    const first = statement.declarationList.declarations[0];
    return first && ts.isIdentifier(first.name) ? first.name.text : void 0;
  }
  return void 0;
}
function extractTypeScriptRationales(manifest, content, sourceFile) {
  const rationales = [];
  let index = 0;
  const pushRationale = (rawText, symbolName, kind) => {
    const rationale = makeRationale2(manifest, index + 1, rawText, kind ?? rationaleKindFromText2(rawText), symbolName);
    if (rationale) {
      rationales.push(rationale);
      index += 1;
    }
  };
  const firstStatement = sourceFile.statements[0];
  if (firstStatement) {
    for (const range of ts.getLeadingCommentRanges(content, firstStatement.getFullStart()) ?? []) {
      pushRationale(content.slice(range.pos, range.end));
    }
  }
  for (const statement of sourceFile.statements) {
    const symbolName = statementRationaleSymbolName(statement);
    for (const jsDoc of statement.jsDoc ?? []) {
      pushRationale(jsDoc.getText(sourceFile), symbolName, "docstring");
    }
    for (const range of ts.getLeadingCommentRanges(content, statement.getFullStart()) ?? []) {
      pushRationale(content.slice(range.pos, range.end), symbolName);
    }
  }
  return uniqueBy(rationales, (item) => `${item.symbolName ?? ""}:${item.text.toLowerCase()}`);
}
function analyzeTypeScriptLikeCode(manifest, content) {
  const language = manifest.language ?? inferCodeLanguage(manifest.originalPath ?? manifest.storedPath, manifest.mimeType) ?? "typescript";
  const sourceFile = ts.createSourceFile(
    manifest.originalPath ?? manifest.storedPath,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(language)
  );
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const localExportNames = /* @__PURE__ */ new Set();
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const specifier = ts.isStringLiteralLike(statement.moduleSpecifier) ? statement.moduleSpecifier.text : "";
      if (specifier) {
        let defaultImport;
        let namespaceImport;
        let importedSymbols = [];
        if (statement.importClause?.name) {
          defaultImport = statement.importClause.name.text;
        }
        const namedBindings = statement.importClause?.namedBindings;
        if (namedBindings && ts.isNamespaceImport(namedBindings)) {
          namespaceImport = namedBindings.name.text;
        } else if (namedBindings && ts.isNamedImports(namedBindings)) {
          importedSymbols = namedBindings.elements.map(importSpecifierText);
        }
        imports.push({
          specifier,
          importedSymbols,
          defaultImport,
          namespaceImport,
          isTypeOnly: statement.importClause?.isTypeOnly ?? false,
          isExternal: !isRelativeSpecifier(specifier),
          reExport: false
        });
      }
      continue;
    }
    if (ts.isExportDeclaration(statement)) {
      const specifier = statement.moduleSpecifier && ts.isStringLiteralLike(statement.moduleSpecifier) ? statement.moduleSpecifier.text : void 0;
      const exportedSymbols = statement.exportClause && ts.isNamedExports(statement.exportClause) ? statement.exportClause.elements.map(exportSpecifierText) : statement.exportClause ? [statement.exportClause.getText(sourceFile)] : ["*"];
      if (specifier) {
        imports.push({
          specifier,
          importedSymbols: exportedSymbols,
          isTypeOnly: statement.isTypeOnly,
          isExternal: !isRelativeSpecifier(specifier),
          reExport: true
        });
      } else if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          localExportNames.add(element.propertyName?.text ?? element.name.text);
          exportLabels.push(exportSpecifierText(element));
        }
      }
      exportLabels.push(...exportedSymbols);
      continue;
    }
    if (ts.isExportAssignment(statement)) {
      if (ts.isIdentifier(statement.expression)) {
        localExportNames.add(statement.expression.text);
        exportLabels.push(`default (${statement.expression.text})`);
      } else {
        exportLabels.push("default");
      }
      continue;
    }
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      draftSymbols.push({
        name: statement.name.text,
        kind: "function",
        signature: declarationSignature(statement, sourceFile),
        exported: isNodeExported(statement),
        callNames: [],
        extendsNames: [],
        implementsNames: []
      });
      if (isNodeExported(statement)) {
        localExportNames.add(statement.name.text);
        exportLabels.push(statement.name.text);
      }
      continue;
    }
    if (ts.isClassDeclaration(statement) && statement.name) {
      draftSymbols.push({
        name: statement.name.text,
        kind: "class",
        signature: declarationSignature(statement, sourceFile),
        exported: isNodeExported(statement),
        callNames: [],
        extendsNames: heritageNames(statement.heritageClauses, ts.SyntaxKind.ExtendsKeyword),
        implementsNames: heritageNames(statement.heritageClauses, ts.SyntaxKind.ImplementsKeyword)
      });
      if (isNodeExported(statement)) {
        localExportNames.add(statement.name.text);
        exportLabels.push(statement.name.text);
      }
      continue;
    }
    if (ts.isInterfaceDeclaration(statement)) {
      draftSymbols.push({
        name: statement.name.text,
        kind: "interface",
        signature: declarationSignature(statement, sourceFile),
        exported: isNodeExported(statement),
        callNames: [],
        extendsNames: heritageNames(statement.heritageClauses, ts.SyntaxKind.ExtendsKeyword),
        implementsNames: []
      });
      if (isNodeExported(statement)) {
        localExportNames.add(statement.name.text);
        exportLabels.push(statement.name.text);
      }
      continue;
    }
    if (ts.isTypeAliasDeclaration(statement)) {
      draftSymbols.push({
        name: statement.name.text,
        kind: "type_alias",
        signature: declarationSignature(statement, sourceFile),
        exported: isNodeExported(statement),
        callNames: [],
        extendsNames: [],
        implementsNames: []
      });
      if (isNodeExported(statement)) {
        localExportNames.add(statement.name.text);
        exportLabels.push(statement.name.text);
      }
      continue;
    }
    if (ts.isEnumDeclaration(statement)) {
      draftSymbols.push({
        name: statement.name.text,
        kind: "enum",
        signature: declarationSignature(statement, sourceFile),
        exported: isNodeExported(statement),
        callNames: [],
        extendsNames: [],
        implementsNames: []
      });
      if (isNodeExported(statement)) {
        localExportNames.add(statement.name.text);
        exportLabels.push(statement.name.text);
      }
      continue;
    }
    if (ts.isVariableStatement(statement)) {
      const exported = isNodeExported(statement);
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }
        draftSymbols.push({
          name: declaration.name.text,
          kind: resolveVariableKind(statement),
          signature: declarationSignature(statement, sourceFile),
          exported,
          callNames: [],
          extendsNames: [],
          implementsNames: []
        });
        if (exported) {
          localExportNames.add(declaration.name.text);
          exportLabels.push(declaration.name.text);
        }
      }
    }
  }
  const topLevelNames = new Set(draftSymbols.map((symbol) => symbol.name));
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      const symbol = draftSymbols.find((item) => item.name === statement.name?.text && item.kind === "function");
      if (symbol) {
        symbol.callNames = collectCallNames(statement.body, topLevelNames, symbol.name);
      }
      continue;
    }
    if (ts.isClassDeclaration(statement) && statement.name) {
      const symbol = draftSymbols.find((item) => item.name === statement.name?.text && item.kind === "class");
      if (symbol) {
        symbol.callNames = collectCallNames(statement, topLevelNames, symbol.name);
      }
      continue;
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }
        const declarationName = declaration.name.text;
        const symbol = draftSymbols.find((item) => item.name === declarationName && item.kind === "variable");
        if (symbol) {
          symbol.callNames = collectCallNames(declaration.initializer, topLevelNames, symbol.name);
        }
      }
    }
  }
  const parseDiagnostics = sourceFile.parseDiagnostics ?? [];
  const diagnostics = parseDiagnostics.map((diagnostic) => {
    const position = diagnostic.start !== void 0 ? sourceFile.getLineAndCharacterOfPosition(diagnostic.start) : void 0;
    return {
      code: diagnostic.code,
      category: formatDiagnosticCategory(diagnostic.category),
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      line: (position?.line ?? 0) + 1,
      column: (position?.character ?? 0) + 1
    };
  });
  return {
    code: finalizeCodeAnalysis2(manifest, language, imports, draftSymbols, exportLabels, diagnostics),
    rationales: extractTypeScriptRationales(manifest, content, sourceFile)
  };
}
function asSqlRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function sqlString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function normalizeSqlIdentifier(value) {
  const raw = sqlString(value);
  if (!raw) {
    return void 0;
  }
  const parts = raw.split(".").filter(Boolean);
  const last = parts.at(-1) ?? raw;
  const pairedQuotes = [
    ['"', '"'],
    ["`", "`"],
    ["[", "]"]
  ];
  for (const [start, end] of pairedQuotes) {
    if (last.startsWith(start) && last.endsWith(end) && last.length >= 2) {
      return last.slice(1, -1).trim() || void 0;
    }
  }
  return last;
}
function sqlTableNamesFromField(value) {
  if (Array.isArray(value)) {
    return uniqueBy(
      value.flatMap((item) => sqlTableNamesFromField(item)),
      (name2) => name2
    );
  }
  const direct = normalizeSqlIdentifier(value);
  if (direct) {
    return [direct];
  }
  const record = asSqlRecord(value);
  if (!record) {
    return [];
  }
  const tableName = normalizeSqlIdentifier(record.table);
  if (tableName) {
    return [tableName];
  }
  const viewName = normalizeSqlIdentifier(record.view);
  if (viewName) {
    return [viewName];
  }
  const name = normalizeSqlIdentifier(record.name);
  return name ? [name] : [];
}
function sqlStatements(ast) {
  return Array.isArray(ast) ? ast : [ast];
}
function sqlStatementType(statement) {
  return sqlString(statement.type)?.toLowerCase() ?? "";
}
function sqlCreateKeyword(statement) {
  return sqlString(statement.keyword)?.toLowerCase() ?? "";
}
function sqlTableListEntry(entry) {
  const [action, , rawName] = entry.split("::");
  const tableName = normalizeSqlIdentifier(rawName);
  return action && tableName ? { action: action.toLowerCase(), tableName } : null;
}
function visitSqlAst(value, visitor, seen = /* @__PURE__ */ new WeakSet()) {
  if (Array.isArray(value)) {
    for (const item of value) {
      visitSqlAst(item, visitor, seen);
    }
    return;
  }
  const record = asSqlRecord(value);
  if (!record || seen.has(record)) {
    return;
  }
  seen.add(record);
  visitor(record);
  for (const child of Object.values(record)) {
    visitSqlAst(child, visitor, seen);
  }
}
function sqlErrorLocation(error) {
  const record = asSqlRecord(error);
  const location = asSqlRecord(record?.location);
  const start = asSqlRecord(location?.start);
  const line = typeof start?.line === "number" ? start.line : 1;
  const column = typeof start?.column === "number" ? start.column : 1;
  return { line, column };
}
function parseSqlContent(content) {
  const parser = new SqlParser();
  const parseOptions = { parseOptions: { includeLocations: true } };
  for (const options of [{ ...parseOptions, database: "postgresql" }, parseOptions]) {
    try {
      return { parsed: parser.parse(content, options), diagnostics: [] };
    } catch (error) {
      if (options === parseOptions) {
        const location = sqlErrorLocation(error);
        return {
          diagnostics: [
            buildDiagnostic(3001, error instanceof Error ? error.message : String(error), location.line, location.column, "error")
          ]
        };
      }
    }
  }
  return { diagnostics: [buildDiagnostic(3001, "Unable to parse SQL source.", 1, 1, "error")] };
}
function analyzeSqlCode(manifest, content) {
  const imports = [];
  const draftSymbols = [];
  const exportLabels = [];
  const relations = [];
  const symbolKeys = /* @__PURE__ */ new Set();
  const relationKeys = /* @__PURE__ */ new Set();
  const parsed = parseSqlContent(content);
  const addSymbol = (name, kind, exported) => {
    const key = `${kind}:${name.toLowerCase()}`;
    const existing = draftSymbols.find((symbol) => `${symbol.kind}:${symbol.name.toLowerCase()}` === key);
    if (existing) {
      existing.exported = existing.exported || exported;
      return;
    }
    if (symbolKeys.has(key)) {
      return;
    }
    symbolKeys.add(key);
    draftSymbols.push({
      name,
      kind,
      signature: `${kind === "view" ? "CREATE VIEW" : "CREATE TABLE"} ${name}`,
      exported,
      callNames: [],
      extendsNames: [],
      implementsNames: []
    });
    if (exported) {
      exportLabels.push(name);
    }
  };
  const addRelation = (sourceName, targetName, relation, confidence = 0.95) => {
    const key = `${sourceName ?? "module"}:${relation}:${targetName}`;
    if (relationKeys.has(key)) {
      return;
    }
    relationKeys.add(key);
    relations.push({ sourceName, targetName, relation, confidence });
  };
  if (!parsed.parsed) {
    const code2 = finalizeCodeAnalysis2(manifest, "sql", imports, draftSymbols, exportLabels, parsed.diagnostics);
    return { code: { ...code2, relations }, rationales: [] };
  }
  const parsedStatements = sqlStatements(parsed.parsed.ast);
  for (const entry of parsed.parsed.tableList ?? []) {
    const parsedEntry = sqlTableListEntry(entry);
    if (!parsedEntry) {
      continue;
    }
    addSymbol(parsedEntry.tableName, "table", parsedEntry.action === "create");
    if (parsedEntry.action === "select") {
      addRelation(void 0, parsedEntry.tableName, "reads");
    } else if (["create", "insert", "update", "delete", "replace"].includes(parsedEntry.action)) {
      addRelation(void 0, parsedEntry.tableName, "writes");
    }
  }
  const processSelect = (statement, sourceName) => {
    const tableNames = uniqueBy(sqlTableNamesFromField(statement.from), (name) => name);
    for (const tableName of tableNames) {
      addSymbol(tableName, "table", false);
      addRelation(sourceName, tableName, "reads");
    }
    if (tableNames.length > 1) {
      const joinSource = sourceName ?? tableNames[0];
      for (const tableName of tableNames.slice(1)) {
        addRelation(joinSource, tableName, "joins", 0.9);
      }
    }
  };
  for (const statementValue of parsedStatements) {
    const statement = asSqlRecord(statementValue);
    if (!statement) {
      continue;
    }
    const statementType = sqlStatementType(statement);
    if (statementType === "create") {
      const keyword = sqlCreateKeyword(statement);
      if (keyword === "view") {
        const viewName = sqlTableNamesFromField(statement.view)[0];
        if (viewName) {
          addSymbol(viewName, "view", true);
          addRelation(void 0, viewName, "writes");
        }
        const selectStatement = asSqlRecord(statement.select);
        if (selectStatement) {
          processSelect(selectStatement, viewName);
        }
      } else {
        for (const tableName of sqlTableNamesFromField(statement.table)) {
          addSymbol(tableName, "table", true);
          addRelation(void 0, tableName, "writes");
          visitSqlAst(statement.create_definitions, (record) => {
            const references = asSqlRecord(record.reference_definition);
            if (!references) {
              return;
            }
            for (const referencedTable of sqlTableNamesFromField(references.table)) {
              addSymbol(referencedTable, "table", false);
              addRelation(tableName, referencedTable, "references");
            }
          });
        }
      }
      continue;
    }
    if (statementType === "select") {
      processSelect(statement, void 0);
      continue;
    }
    if (["insert", "update", "delete", "replace"].includes(statementType)) {
      for (const tableName of sqlTableNamesFromField(statement.table)) {
        addSymbol(tableName, "table", false);
        addRelation(void 0, tableName, "writes");
      }
    }
  }
  const code = finalizeCodeAnalysis2(manifest, "sql", imports, draftSymbols, exportLabels, parsed.diagnostics);
  return { code: { ...code, relations }, rationales: [] };
}
function inferCodeLanguage(filePath, mimeType = "", options = {}) {
  const extension = path4.extname(filePath).toLowerCase();
  if (extension === ".ts" || extension === ".mts" || extension === ".cts") {
    return "typescript";
  }
  if (extension === ".tsx") {
    return "tsx";
  }
  if (extension === ".jsx") {
    return "jsx";
  }
  if (extension === ".js" || extension === ".mjs" || extension === ".cjs" || mimeType.includes("javascript")) {
    return "javascript";
  }
  if (extension === ".sh" || extension === ".bash" || extension === ".zsh" || mimeType === "application/x-sh") {
    return "bash";
  }
  if (extension === ".py") {
    return "python";
  }
  if (extension === ".sql") {
    return "sql";
  }
  if (extension === ".go") {
    return "go";
  }
  if (extension === ".rs") {
    return "rust";
  }
  if (extension === ".java") {
    return "java";
  }
  if (extension === ".kt" || extension === ".kts") {
    return "kotlin";
  }
  if (extension === ".scala" || extension === ".sc") {
    return "scala";
  }
  if (extension === ".dart") {
    return "dart";
  }
  if (extension === ".lua") {
    return "lua";
  }
  if (extension === ".zig") {
    return "zig";
  }
  if (extension === ".cs") {
    return "csharp";
  }
  if (extension === ".php") {
    return "php";
  }
  if (extension === ".rb") {
    return "ruby";
  }
  if (extension === ".ps1" || extension === ".psm1" || extension === ".psd1") {
    return "powershell";
  }
  if (extension === ".swift") {
    return "swift";
  }
  if (extension === ".ex" || extension === ".exs") {
    return "elixir";
  }
  if (extension === ".ml" || extension === ".mli") {
    return "ocaml";
  }
  if (extension === ".m" || extension === ".mm") {
    return "objc";
  }
  if (extension === ".res" || extension === ".resi") {
    return "rescript";
  }
  if (extension === ".sol") {
    return "solidity";
  }
  if (extension === ".html" || extension === ".htm") {
    return "html";
  }
  if (extension === ".css") {
    return "css";
  }
  if (extension === ".vue") {
    return "vue";
  }
  if (extension === ".c") {
    return "c";
  }
  if ([".cc", ".cpp", ".cxx", ".h", ".hh", ".hpp", ".hxx"].includes(extension)) {
    return "cpp";
  }
  if (!extension && options.executable) {
    const fromShebang = languageFromInterpreter(interpreterFromShebang(options.content));
    if (fromShebang) {
      return fromShebang;
    }
  }
  return void 0;
}
function modulePageTitle(manifest) {
  return `${manifest.title} module`;
}
function importResolutionCandidates(basePath, specifier, extensions) {
  const resolved = path4.posix.normalize(path4.posix.join(path4.posix.dirname(basePath), specifier));
  const resolvedExt = path4.posix.extname(resolved);
  if (resolvedExt) {
    if (extensions.includes(resolvedExt)) {
      const resolvedBase = resolved.slice(0, -resolvedExt.length);
      const candidates = [resolved, ...extensions.map((extension) => `${resolvedBase}${extension}`)];
      return uniqueBy(candidates, (candidate) => candidate);
    }
    return [resolved];
  }
  const direct = extensions.map((extension) => path4.posix.normalize(`${resolved}${extension}`));
  const indexFiles = extensions.map((extension) => path4.posix.normalize(path4.posix.join(resolved, `index${extension}`)));
  return uniqueBy([resolved, ...direct, ...indexFiles], (candidate) => candidate);
}
function normalizeAlias(value) {
  return value.replace(/\\/g, "/").replace(/\/+/g, "/").trim();
}
function recordAlias(target, value) {
  const normalized = normalizeAlias(value ?? "");
  if (!normalized) {
    return;
  }
  target.add(normalized);
  const lowered = normalized.toLowerCase();
  if (lowered !== normalized) {
    target.add(lowered);
  }
}
function manifestBasenameWithoutExtension(manifest) {
  const target = manifest.repoRelativePath ?? manifest.originalPath ?? manifest.storedPath;
  return path4.posix.basename(stripCodeExtension2(normalizeAlias(target)));
}
async function readNearestTsconfigPaths(startPath, cache) {
  let current = path4.resolve(startPath);
  try {
    const stat = await fs4.stat(current);
    if (!stat.isDirectory()) {
      current = path4.dirname(current);
    }
  } catch {
    current = path4.dirname(current);
  }
  while (true) {
    if (cache.has(current)) {
      const cached = cache.get(current);
      return cached === null ? void 0 : cached;
    }
    const tsconfigPath = path4.join(current, "tsconfig.json");
    const exists = await fs4.access(tsconfigPath).then(() => true).catch(() => false);
    if (exists) {
      const configFile = ts.readConfigFile(tsconfigPath, (p) => ts.sys.readFile(p));
      if (!configFile.error && configFile.config) {
        const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, current);
        const rawPaths = parsed.options.paths;
        if (rawPaths && Object.keys(rawPaths).length > 0) {
          const baseUrl = parsed.options.baseUrl ? toPosix(path4.relative(current, parsed.options.baseUrl)) : ".";
          const config = { baseUrl, paths: rawPaths };
          cache.set(current, config);
          return config;
        }
      }
      cache.set(current, null);
      return void 0;
    }
    const parent = path4.dirname(current);
    if (parent === current) {
      cache.set(current, null);
      return void 0;
    }
    current = parent;
  }
}
function tsconfigPathAliasesForFile(repoRelativePath, config) {
  const aliases = [];
  const stripped = stripCodeExtension2(normalizeAlias(repoRelativePath));
  const indexStripped = stripped.endsWith("/index") ? stripped.slice(0, -"/index".length) : void 0;
  for (const [pattern, targets] of Object.entries(config.paths)) {
    for (const target of targets) {
      if (pattern.includes("*") && target.includes("*")) {
        const targetPrefix = normalizeAlias(
          config.baseUrl === "." ? target.replace("*", "") : path4.posix.join(config.baseUrl, target.replace("*", ""))
        );
        const patternBase = pattern.replace("*", "");
        for (const candidate of [stripped, indexStripped]) {
          if (candidate?.startsWith(targetPrefix)) {
            aliases.push(patternBase + candidate.slice(targetPrefix.length));
          }
        }
      } else if (!pattern.includes("*") && !target.includes("*")) {
        const targetNorm = normalizeAlias(config.baseUrl === "." ? target : path4.posix.join(config.baseUrl, target));
        if (stripped === stripCodeExtension2(targetNorm) || indexStripped === stripCodeExtension2(targetNorm)) {
          aliases.push(pattern);
        }
      }
    }
  }
  if (config.baseUrl !== ".") {
    const basePrefix = `${normalizeAlias(config.baseUrl)}/`;
    if (stripped.startsWith(basePrefix)) {
      aliases.push(stripped.slice(basePrefix.length));
    }
    if (indexStripped?.startsWith(basePrefix)) {
      aliases.push(indexStripped.slice(basePrefix.length));
    }
  }
  return aliases;
}
async function readNearestDartPackageInfo(startPath, cache) {
  let current = path4.resolve(startPath);
  try {
    const stat = await fs4.stat(current);
    if (!stat.isDirectory()) {
      current = path4.dirname(current);
    }
  } catch {
    current = path4.dirname(current);
  }
  while (true) {
    if (cache.has(current)) {
      const cached = cache.get(current);
      return cached === null ? void 0 : cached;
    }
    const pubspecPath = path4.join(current, "pubspec.yaml");
    if (await fs4.access(pubspecPath).then(() => true).catch(() => false)) {
      try {
        const content = await fs4.readFile(pubspecPath, "utf8");
        const parsed = YAML2.parse(content);
        const packageName = typeof parsed?.name === "string" ? parsed.name.trim() : "";
        const info = packageName ? { rootDir: current, name: packageName } : null;
        cache.set(current, info);
        return info ?? void 0;
      } catch {
        cache.set(current, null);
        return void 0;
      }
    }
    const parent = path4.dirname(current);
    if (parent === current) {
      cache.set(current, null);
      return void 0;
    }
    current = parent;
  }
}
async function readNearestGoModulePath(startPath, cache) {
  let current = path4.resolve(startPath);
  try {
    const stat = await fs4.stat(current);
    if (!stat.isDirectory()) {
      current = path4.dirname(current);
    }
  } catch {
    current = path4.dirname(current);
  }
  while (true) {
    if (cache.has(current)) {
      const cached = cache.get(current);
      return cached === null ? void 0 : cached;
    }
    const goModPath = path4.join(current, "go.mod");
    if (await fs4.access(goModPath).then(() => true).catch(() => false)) {
      const content = await fs4.readFile(goModPath, "utf8");
      const match = content.match(/^\s*module\s+(\S+)/m);
      const modulePath = match?.[1]?.trim() ?? null;
      cache.set(current, modulePath);
      return modulePath ?? void 0;
    }
    const parent = path4.dirname(current);
    if (parent === current) {
      cache.set(current, null);
      return void 0;
    }
    current = parent;
  }
}
function rustModuleAliases(repoRelativePath) {
  const withoutExt = stripCodeExtension2(normalizeAlias(repoRelativePath)).replace(/\/mod$/i, "");
  if (!withoutExt) {
    return [];
  }
  const result = [];
  const push = (moduleTail) => {
    const trimmed = moduleTail.replace(/^\/+|\/+$/g, "");
    if (!trimmed || trimmed === "lib" || trimmed === "main") {
      result.push("crate");
      return;
    }
    const rootStripped = trimmed.replace(/\/(?:lib|main)$/i, "");
    if (rootStripped !== trimmed && rootStripped) {
      result.push(`crate::${rootStripped.replace(/\//g, "::")}`);
    }
    result.push(`crate::${trimmed.replace(/\//g, "::")}`);
  };
  const srcIdx = withoutExt.lastIndexOf("/src/");
  if (srcIdx >= 0) {
    push(withoutExt.slice(srcIdx + "/src/".length));
  }
  if (withoutExt.startsWith("src/")) {
    push(withoutExt.slice("src/".length));
  }
  const segments = withoutExt.split("/").filter(Boolean);
  for (let start = 0; start < segments.length; start += 1) {
    push(segments.slice(start).join("/"));
  }
  return uniqueBy(result.filter(Boolean), (item) => item);
}
function candidateExtensionsFor(language) {
  switch (language) {
    case "javascript":
    case "jsx":
    case "typescript":
    case "tsx":
      return [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs", ".vue"];
    case "vue":
      return [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs", ".vue"];
    case "bash":
      return [".sh", ".bash", ".zsh"];
    case "python":
      return [".py"];
    case "sql":
      return [".sql"];
    case "go":
      return [".go"];
    case "rust":
      return [".rs"];
    case "java":
      return [".java"];
    case "kotlin":
      return [".kt", ".kts"];
    case "scala":
      return [".scala", ".sc"];
    case "dart":
      return [".dart"];
    case "lua":
      return [".lua"];
    case "zig":
      return [".zig"];
    case "csharp":
      return [".cs"];
    case "php":
      return [".php"];
    case "ruby":
      return [".rb"];
    case "powershell":
      return [".ps1", ".psm1", ".psd1"];
    case "c":
      return [".c", ".h"];
    case "cpp":
      return [".cc", ".cpp", ".cxx", ".h", ".hh", ".hpp", ".hxx"];
    case "swift":
      return [".swift"];
    case "elixir":
      return [".ex", ".exs"];
    case "ocaml":
      return [".ml", ".mli"];
    case "objc":
      return [".m", ".mm", ".h"];
    case "rescript":
      return [".res", ".resi"];
    case "solidity":
      return [".sol"];
    case "html":
      return [".css", ".js", ".mjs", ".cjs", ".html", ".htm"];
    case "css":
      return [".css"];
    default:
      return [];
  }
}
async function buildCodeIndex(rootDir, manifests, analyses) {
  const analysesBySourceId = new Map(analyses.map((analysis) => [analysis.sourceId, analysis]));
  const goModuleCache = /* @__PURE__ */ new Map();
  const dartPackageCache = /* @__PURE__ */ new Map();
  const tsconfigCache = /* @__PURE__ */ new Map();
  const entries = [];
  for (const manifest of manifests) {
    const analysis = analysesBySourceId.get(manifest.sourceId);
    if (!analysis?.code) {
      continue;
    }
    const aliases = /* @__PURE__ */ new Set();
    const repoRelativePath = manifest.repoRelativePath ? normalizeAlias(manifest.repoRelativePath) : void 0;
    const normalizedModuleName = analysis.code.moduleName ? normalizeAlias(analysis.code.moduleName) : void 0;
    const normalizedNamespace = analysis.code.namespace ? normalizeAlias(analysis.code.namespace) : void 0;
    const basename = manifestBasenameWithoutExtension(manifest);
    if (repoRelativePath) {
      recordAlias(aliases, repoRelativePath);
      recordAlias(aliases, stripCodeExtension2(repoRelativePath));
      if (stripCodeExtension2(repoRelativePath).endsWith("/index")) {
        recordAlias(aliases, stripCodeExtension2(repoRelativePath).slice(0, -"/index".length));
      }
    }
    recordAlias(aliases, normalizedModuleName);
    recordAlias(aliases, normalizedNamespace);
    switch (analysis.code.language) {
      case "javascript":
      case "jsx":
      case "typescript":
      case "tsx": {
        if (repoRelativePath && manifest.originalPath) {
          const tsconfigPaths = await readNearestTsconfigPaths(manifest.originalPath, tsconfigCache);
          if (tsconfigPaths) {
            for (const alias of tsconfigPathAliasesForFile(repoRelativePath, tsconfigPaths)) {
              recordAlias(aliases, alias);
            }
          }
        }
        break;
      }
      case "python":
        recordAlias(aliases, normalizedModuleName?.replace(/\//g, "."));
        break;
      case "bash":
        recordAlias(aliases, basename);
        break;
      case "rust":
        if (repoRelativePath) {
          for (const alias of rustModuleAliases(repoRelativePath)) {
            recordAlias(aliases, alias);
          }
        }
        break;
      case "go": {
        if (normalizedNamespace) {
          recordAlias(aliases, normalizedNamespace);
        }
        const originalPath = manifest.originalPath ? path4.resolve(manifest.originalPath) : path4.resolve(rootDir, manifest.storedPath);
        const goModulePath = await readNearestGoModulePath(originalPath, goModuleCache);
        if (goModulePath && repoRelativePath) {
          const dir = path4.posix.dirname(repoRelativePath);
          const packageAlias = dir === "." ? goModulePath : `${goModulePath}/${dir}`;
          recordAlias(aliases, packageAlias);
        }
        break;
      }
      case "java":
      case "kotlin":
      case "scala":
      case "dart":
      case "csharp":
        if (normalizedNamespace) {
          recordAlias(aliases, `${normalizedNamespace}.${basename}`);
        }
        if (normalizedNamespace) {
          for (const symbol of analysis.code.symbols) {
            recordAlias(aliases, `${normalizedNamespace}.${symbol.name}`);
          }
        }
        if (analysis.code.language === "dart" && repoRelativePath) {
          recordAlias(aliases, basename);
          const originalPath = manifest.originalPath ? path4.resolve(manifest.originalPath) : path4.resolve(rootDir, manifest.storedPath);
          const packageInfo = await readNearestDartPackageInfo(originalPath, dartPackageCache);
          if (packageInfo) {
            const packageRelativePath = toPosix(path4.relative(packageInfo.rootDir, originalPath));
            if (packageRelativePath.startsWith("lib/")) {
              const packagePath = packageRelativePath.slice("lib/".length);
              recordAlias(aliases, `package:${packageInfo.name}/${packagePath}`);
              recordAlias(aliases, `package:${packageInfo.name}/${stripCodeExtension2(packagePath)}`);
            }
          }
        }
        break;
      case "lua":
        recordAlias(aliases, basename);
        if (repoRelativePath) {
          const repoWithoutExt = stripCodeExtension2(repoRelativePath);
          recordAlias(aliases, repoWithoutExt.replace(/\//g, "."));
          if (repoWithoutExt.endsWith("/init")) {
            recordAlias(aliases, repoWithoutExt.slice(0, -"/init".length));
            recordAlias(aliases, repoWithoutExt.slice(0, -"/init".length).replace(/\//g, "."));
          }
        }
        break;
      case "zig":
        recordAlias(aliases, basename);
        break;
      case "php":
        if (normalizedNamespace) {
          recordAlias(aliases, `${normalizedNamespace}\\${basename}`);
        }
        break;
      case "ruby":
      case "powershell":
        recordAlias(aliases, basename);
        break;
      case "elixir":
        for (const symbol of analysis.code.symbols) {
          if (symbol.kind === "class" || symbol.kind === "interface") {
            recordAlias(aliases, symbol.name);
          }
        }
        break;
      case "ocaml": {
        if (basename) {
          const capitalized = basename.charAt(0).toUpperCase() + basename.slice(1);
          recordAlias(aliases, capitalized);
          recordAlias(aliases, basename);
        }
        for (const symbol of analysis.code.symbols) {
          if (symbol.kind === "class" || symbol.kind === "interface") {
            recordAlias(aliases, symbol.name);
          }
        }
        break;
      }
      case "rescript": {
        if (basename) {
          const capitalized = basename.charAt(0).toUpperCase() + basename.slice(1);
          recordAlias(aliases, capitalized);
          recordAlias(aliases, basename);
        }
        for (const symbol of analysis.code.symbols) {
          if (symbol.kind === "class") {
            recordAlias(aliases, symbol.name);
          }
        }
        break;
      }
      default:
        break;
    }
    entries.push({
      sourceId: manifest.sourceId,
      moduleId: analysis.code.moduleId,
      language: analysis.code.language,
      repoRelativePath,
      originalPath: manifest.originalPath,
      moduleName: analysis.code.moduleName,
      namespace: analysis.code.namespace,
      aliases: [...aliases].sort((left, right) => left.localeCompare(right))
    });
  }
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    entries
  };
}
function createCodeIndexLookup(artifact) {
  const bySourceId = /* @__PURE__ */ new Map();
  const byRepoPath = /* @__PURE__ */ new Map();
  const byAlias = /* @__PURE__ */ new Map();
  for (const entry of artifact.entries) {
    bySourceId.set(entry.sourceId, entry);
    if (entry.repoRelativePath) {
      byRepoPath.set(normalizeAlias(entry.repoRelativePath), entry);
    }
    for (const alias of entry.aliases) {
      const key = normalizeAlias(alias);
      const bucket = byAlias.get(key) ?? [];
      bucket.push(entry);
      byAlias.set(key, bucket);
    }
  }
  return { artifact, bySourceId, byRepoPath, byAlias };
}
function aliasMatches(lookup, ...aliases) {
  return uniqueBy(
    aliases.flatMap(
      (alias) => alias ? lookup.byAlias.get(normalizeAlias(alias)) ?? lookup.byAlias.get(normalizeAlias(alias).toLowerCase()) ?? [] : []
    ),
    (entry) => entry.sourceId
  );
}
function aliasMatchesExact(lookup, alias) {
  return lookup.byAlias.get(normalizeAlias(alias)) ?? [];
}
function repoPathMatches(lookup, ...repoPaths) {
  return uniqueBy(
    repoPaths.map((repoPath) => lookup.byRepoPath.get(normalizeAlias(repoPath))).filter((entry) => Boolean(entry)),
    (entry) => entry.sourceId
  );
}
function resolvePythonRelativeAliases(repoRelativePath, specifier) {
  const dotMatch = specifier.match(/^\.+/);
  const depth = dotMatch ? dotMatch[0].length : 0;
  const relativeModule = specifier.slice(depth).replace(/\./g, "/");
  const baseDir = path4.posix.dirname(repoRelativePath);
  const parentDir = path4.posix.normalize(path4.posix.join(baseDir, ...Array(Math.max(depth - 1, 0)).fill("..")));
  const moduleBase = relativeModule ? path4.posix.join(parentDir, relativeModule) : parentDir;
  return uniqueBy([`${moduleBase}.py`, path4.posix.join(moduleBase, "__init__.py")], (item) => item);
}
function resolveRustAliases(manifest, specifier) {
  const repoRelativePath = manifest.repoRelativePath ? normalizeAlias(manifest.repoRelativePath) : "";
  if (!specifier.startsWith("self::") && !specifier.startsWith("super::") && specifier !== "self" && specifier !== "super") {
    return [specifier];
  }
  const candidateAliases = repoRelativePath ? rustModuleAliases(repoRelativePath) : [];
  if (candidateAliases.length === 0) {
    return [];
  }
  const tailAfter = specifier.startsWith("self::") ? specifier.slice("self::".length) : specifier.startsWith("super::") ? specifier.slice("super::".length) : "";
  const superRelative = specifier.startsWith("super");
  const expansions = [];
  for (const currentAlias of candidateAliases) {
    const currentParts = currentAlias.replace(/^crate(?:::)?/, "").split("::").filter(Boolean);
    if (superRelative) {
      if (currentParts.length > 0) {
        const parentParts = currentParts.slice(0, -1);
        const expanded2 = `crate${parentParts.length ? `::${parentParts.join("::")}` : ""}${tailAfter ? `::${tailAfter}` : ""}`.replace(/::+/g, "::").replace(/::$/, "");
        expansions.push(expanded2);
      }
      continue;
    }
    const expanded = `crate${currentParts.length ? `::${currentParts.join("::")}` : ""}${tailAfter ? `::${tailAfter}` : ""}`.replace(/::+/g, "::").replace(/::$/, "");
    expansions.push(expanded);
  }
  return uniqueBy(expansions, (item) => item);
}
function rustCrateRootPrefix(repoRelativePath) {
  if (!repoRelativePath) {
    return void 0;
  }
  const normalized = normalizeAlias(repoRelativePath);
  const idx = normalized.lastIndexOf("/src/");
  if (idx >= 0) {
    return normalized.slice(0, idx + "/src/".length);
  }
  if (normalized.startsWith("src/")) {
    return "src/";
  }
  return void 0;
}
function filterRustCandidatesToSameCrate(candidates, consumerPath) {
  const normalizedConsumer = consumerPath ? normalizeAlias(consumerPath) : "";
  const withoutSelf = normalizedConsumer ? candidates.filter((entry) => normalizeAlias(entry.repoRelativePath ?? "") !== normalizedConsumer) : candidates;
  if (withoutSelf.length <= 1) {
    return withoutSelf;
  }
  const cratePrefix = rustCrateRootPrefix(consumerPath);
  if (cratePrefix) {
    const sameCrate = withoutSelf.filter((entry) => normalizeAlias(entry.repoRelativePath ?? "").startsWith(cratePrefix));
    if (sameCrate.length > 0) {
      return sameCrate;
    }
  }
  if (normalizedConsumer) {
    let dir = path4.posix.dirname(normalizedConsumer);
    while (dir && dir !== "." && dir !== "/") {
      const prefix = `${dir}/`;
      const sameTree = withoutSelf.filter((entry) => normalizeAlias(entry.repoRelativePath ?? "").startsWith(prefix));
      if (sameTree.length > 0) {
        return sameTree;
      }
      const parent = path4.posix.dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
  }
  return withoutSelf;
}
function resolveRustAliasWithStripping(alias, lookup, consumerPath) {
  const segments = alias.split("::");
  while (segments.length > 0) {
    const candidate = segments.join("::");
    const matches = aliasMatchesExact(lookup, candidate);
    const filtered = matches.length > 0 ? filterRustCandidatesToSameCrate(matches, consumerPath) : [];
    if (filtered.length > 0) {
      return filtered;
    }
    if (candidate === "crate" || candidate === "self" || candidate === "super") {
      break;
    }
    segments.pop();
  }
  return [];
}
function luaSpecifierLooksLocal(specifier) {
  return /^[A-Za-z_][A-Za-z0-9_]*(?:[./][A-Za-z_][A-Za-z0-9_]*)*$/.test(specifier);
}
function resolveLuaModuleCandidates(specifier, repoRelativePath) {
  const normalized = normalizeAlias(specifier.replace(/\./g, "/"));
  if (!normalized) {
    return [];
  }
  const bases = /* @__PURE__ */ new Set([normalized]);
  bases.add(`src/${normalized}`);
  bases.add(`lua/${normalized}`);
  if (repoRelativePath) {
    let dir = path4.posix.dirname(repoRelativePath);
    while (dir && dir !== "." && dir !== "/") {
      bases.add(`${dir}/${normalized}`);
      const parent = path4.posix.dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
  }
  const candidates = [];
  for (const base of bases) {
    candidates.push(`${base}.lua`);
    candidates.push(path4.posix.join(base, "init.lua"));
  }
  return uniqueBy(candidates, (item) => item);
}
function findImportCandidates(manifest, codeImport, lookup) {
  const language = manifest.language ?? inferCodeLanguage(manifest.originalPath ?? manifest.storedPath, manifest.mimeType);
  const repoRelativePath = manifest.repoRelativePath ? normalizeAlias(manifest.repoRelativePath) : void 0;
  if (!language) {
    return [];
  }
  switch (language) {
    case "javascript":
    case "jsx":
    case "typescript":
    case "tsx":
    case "vue":
      return repoRelativePath && isRelativeSpecifier(codeImport.specifier) ? repoPathMatches(lookup, ...importResolutionCandidates(repoRelativePath, codeImport.specifier, candidateExtensionsFor(language))) : aliasMatches(lookup, codeImport.specifier);
    case "python":
      if (repoRelativePath && codeImport.specifier.startsWith(".")) {
        return repoPathMatches(lookup, ...resolvePythonRelativeAliases(repoRelativePath, codeImport.specifier));
      }
      return aliasMatches(lookup, codeImport.specifier);
    case "go":
    case "java":
    case "kotlin":
    case "scala":
    case "csharp":
    case "elixir":
    case "ocaml":
    case "rescript":
      return aliasMatches(lookup, codeImport.specifier);
    case "dart":
      return repoRelativePath && dartSpecifierLooksLocal2(codeImport.specifier) ? repoPathMatches(lookup, ...importResolutionCandidates(repoRelativePath, codeImport.specifier, candidateExtensionsFor(language))) : aliasMatches(lookup, codeImport.specifier);
    case "lua":
      return luaSpecifierLooksLocal(codeImport.specifier) ? repoPathMatches(lookup, ...resolveLuaModuleCandidates(codeImport.specifier, repoRelativePath)) : aliasMatches(lookup, codeImport.specifier, codeImport.specifier.replace(/\./g, "/"));
    case "zig":
      return repoRelativePath && (!codeImport.isExternal || codeImport.specifier.endsWith(".zig")) ? repoPathMatches(lookup, ...importResolutionCandidates(repoRelativePath, codeImport.specifier, candidateExtensionsFor(language))) : aliasMatches(lookup, codeImport.specifier);
    case "php":
    case "ruby":
    case "bash":
    case "powershell":
      if (repoRelativePath && (language === "bash" ? bashSpecifierLooksLocal2(codeImport.specifier) : isLocalIncludeSpecifier(codeImport.specifier))) {
        return repoPathMatches(
          lookup,
          ...importResolutionCandidates(repoRelativePath, codeImport.specifier, candidateExtensionsFor(language))
        );
      }
      return aliasMatches(
        lookup,
        codeImport.specifier,
        codeImport.specifier.replace(/\\/g, "/"),
        stripCodeExtension2(codeImport.specifier.replace(/\\/g, "/"))
      );
    case "rust": {
      for (const alias of [codeImport.specifier, ...resolveRustAliases(manifest, codeImport.specifier)]) {
        const matches = resolveRustAliasWithStripping(alias, lookup, repoRelativePath);
        if (matches.length > 0) {
          return matches;
        }
      }
      return [];
    }
    case "c":
    case "cpp":
    case "objc":
    case "solidity":
    case "html":
    case "css":
      return repoRelativePath && !codeImport.isExternal ? repoPathMatches(lookup, ...importResolutionCandidates(repoRelativePath, codeImport.specifier, candidateExtensionsFor(language))) : aliasMatches(lookup, codeImport.specifier);
    default:
      return [];
  }
}
function importLooksLocal(manifest, codeImport, candidates) {
  if (candidates.length === 1) {
    return true;
  }
  const language = manifest.language ?? inferCodeLanguage(manifest.originalPath ?? manifest.storedPath, manifest.mimeType);
  switch (language) {
    case "javascript":
    case "jsx":
    case "typescript":
    case "tsx":
    case "vue":
      return isRelativeSpecifier(codeImport.specifier);
    case "python":
      return codeImport.specifier.startsWith(".");
    case "rust":
      return /^(crate|self|super)::/.test(codeImport.specifier);
    case "php":
    case "ruby":
    case "powershell":
    case "c":
    case "cpp":
    case "objc":
    case "kotlin":
    case "scala":
    case "solidity":
      return !codeImport.isExternal;
    case "bash":
      return bashSpecifierLooksLocal2(codeImport.specifier);
    case "dart":
      return dartSpecifierLooksLocal2(codeImport.specifier);
    case "lua":
      return luaSpecifierLooksLocal(codeImport.specifier);
    case "zig":
      return !codeImport.isExternal || codeImport.specifier.endsWith(".zig");
    default:
      return false;
  }
}
function resolveCodeImport(manifest, codeImport, lookup) {
  const candidates = findImportCandidates(manifest, codeImport, lookup);
  const resolved = candidates.length === 1 ? candidates[0] : void 0;
  return {
    ...codeImport,
    isExternal: importLooksLocal(manifest, codeImport, candidates) ? false : codeImport.isExternal,
    resolvedSourceId: resolved?.sourceId,
    resolvedRepoPath: resolved?.repoRelativePath
  };
}
function enrichResolvedCodeImports(manifest, analysis, artifact) {
  if (!analysis.code) {
    return analysis;
  }
  const lookup = createCodeIndexLookup(artifact);
  const imports = analysis.code.imports.map((codeImport) => resolveCodeImport(manifest, codeImport, lookup));
  return {
    ...analysis,
    code: {
      ...analysis.code,
      imports,
      dependencies: uniqueBy(
        imports.filter((item) => item.isExternal).map((item) => item.specifier),
        (specifier) => specifier
      )
    }
  };
}
function escapeRegExp2(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var VUE_SCRIPT_BLOCK_REGEX = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
function vueScriptLanguageFromAttributes(attributes) {
  const langMatch = attributes.match(/\blang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const lang = (langMatch?.[1] ?? langMatch?.[2] ?? langMatch?.[3] ?? "").trim().toLowerCase();
  const hasJsx = /\bjsx\b/.test(attributes) || lang === "tsx" || lang === "jsx";
  if (lang === "ts" || lang === "typescript" || lang === "tsx") {
    return hasJsx ? "tsx" : "typescript";
  }
  if (lang === "js" || lang === "javascript" || lang === "jsx") {
    return hasJsx ? "jsx" : "javascript";
  }
  return "typescript";
}
function extractVueScriptBlocks(source) {
  const blocks = [];
  VUE_SCRIPT_BLOCK_REGEX.lastIndex = 0;
  let match = VUE_SCRIPT_BLOCK_REGEX.exec(source);
  while (match !== null) {
    const attributes = match[1] ?? "";
    const content = match[2] ?? "";
    const openTagEnd = match.index + match[0].indexOf(">") + 1;
    const lineOffset = source.slice(0, openTagEnd).split("\n").length - 1;
    const setup = /\bsetup\b/.test(attributes);
    blocks.push({
      content,
      lineOffset,
      language: vueScriptLanguageFromAttributes(attributes),
      setup
    });
    match = VUE_SCRIPT_BLOCK_REGEX.exec(source);
  }
  return blocks;
}
function mergeVueScriptAnalyses(outer, inners) {
  if (inners.length === 0) {
    return outer;
  }
  const mergedImports = [...outer.code.imports];
  const seenImportKeys = new Set(
    mergedImports.map((imp) => `${imp.specifier}\0${imp.reExport ? "re" : "im"}\0${imp.isTypeOnly ? "t" : "v"}`)
  );
  const mergedSymbols = [...outer.code.symbols];
  const seenSymbolKeys = new Set(mergedSymbols.map((symbol) => `${symbol.name}\0${symbol.kind}`));
  const mergedExports = [...outer.code.exports];
  const seenExports = new Set(mergedExports);
  const mergedDiagnostics = [...outer.code.diagnostics];
  const mergedDependencies = new Set(outer.code.dependencies);
  const mergedRationales = [...outer.rationales];
  const seenRationaleKeys = new Set(mergedRationales.map((r) => `${r.symbolName ?? ""}:${r.text.toLowerCase()}`));
  for (const inner of inners) {
    for (const imp of inner.code.imports) {
      const key = `${imp.specifier}\0${imp.reExport ? "re" : "im"}\0${imp.isTypeOnly ? "t" : "v"}`;
      if (!seenImportKeys.has(key)) {
        mergedImports.push(imp);
        seenImportKeys.add(key);
      }
    }
    for (const symbol of inner.code.symbols) {
      const key = `${symbol.name}\0${symbol.kind}`;
      if (!seenSymbolKeys.has(key)) {
        mergedSymbols.push(symbol);
        seenSymbolKeys.add(key);
      }
    }
    for (const label of inner.code.exports) {
      if (!seenExports.has(label)) {
        mergedExports.push(label);
        seenExports.add(label);
      }
    }
    for (const diag of inner.code.diagnostics) {
      mergedDiagnostics.push({
        ...diag,
        line: diag.line + inner.lineOffset
      });
    }
    for (const dep of inner.code.dependencies) {
      mergedDependencies.add(dep);
    }
    for (const rationale of inner.rationales) {
      const key = `${rationale.symbolName ?? ""}:${rationale.text.toLowerCase()}`;
      if (!seenRationaleKeys.has(key)) {
        mergedRationales.push(rationale);
        seenRationaleKeys.add(key);
      }
    }
  }
  return {
    code: {
      ...outer.code,
      imports: mergedImports,
      dependencies: Array.from(mergedDependencies),
      symbols: mergedSymbols,
      exports: mergedExports,
      diagnostics: mergedDiagnostics
    },
    rationales: mergedRationales
  };
}
async function analyzeVueSource(manifest, extractedText) {
  const outer = await analyzeTreeSitterCode(manifest, extractedText, "vue");
  const scriptBlocks = extractVueScriptBlocks(extractedText);
  if (scriptBlocks.length === 0) {
    return outer;
  }
  const innerResults = [];
  for (const block of scriptBlocks) {
    if (!block.content.trim()) {
      continue;
    }
    const innerManifest = {
      ...manifest,
      language: block.language
    };
    const analyzed = analyzeTypeScriptLikeCode(innerManifest, block.content);
    innerResults.push({ code: analyzed.code, rationales: analyzed.rationales, lineOffset: block.lineOffset });
  }
  return mergeVueScriptAnalyses(outer, innerResults);
}
async function analyzeCodeSource(manifest, extractedText, schemaHash) {
  const language = manifest.language ?? inferCodeLanguage(manifest.originalPath ?? manifest.storedPath, manifest.mimeType) ?? "typescript";
  const { code, rationales } = language === "javascript" || language === "jsx" || language === "typescript" || language === "tsx" ? analyzeTypeScriptLikeCode(manifest, extractedText) : language === "sql" ? analyzeSqlCode(manifest, extractedText) : language === "vue" ? await analyzeVueSource(manifest, extractedText) : await analyzeTreeSitterCode(manifest, extractedText, language);
  return {
    analysisVersion: 8,
    sourceId: manifest.sourceId,
    sourceHash: manifest.contentHash,
    semanticHash: manifest.semanticHash,
    extractionHash: manifest.extractionHash,
    schemaHash,
    title: manifest.title,
    summary: summarizeModule(manifest, code),
    concepts: [],
    entities: [],
    claims: codeClaims(manifest, code),
    questions: codeQuestions(manifest, code),
    tags: [],
    rationales,
    code,
    producedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/ingest.ts
import fs8 from "fs/promises";
import path9 from "path";
import { pathToFileURL } from "url";
import { Readability } from "@mozilla/readability";
import matter3 from "gray-matter";
import ignore from "ignore";
import { isText } from "istextorbinary";
import { JSDOM as JSDOM2 } from "jsdom";
import mime from "mime-types";
import TurndownService2 from "turndown";

// src/extraction.ts
import { spawn } from "child_process";
import fs5 from "fs/promises";
import os2 from "os";
import path5 from "path";
import { Readable } from "stream";
import { parse as parseCsvSync } from "csv-parse/sync";
import { strFromU8, unzipSync } from "fflate";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { fetchTranscript } from "youtube-transcript-plus";
import { z } from "zod";

// src/markdown-ast.ts
import { fromMarkdown } from "mdast-util-from-markdown";
function parseMarkdownNodes(text) {
  try {
    const root = fromMarkdown(text);
    return Array.isArray(root.children) ? root.children : [];
  } catch {
    return [];
  }
}
function markdownNodeText(node) {
  if (node.type === "text" || node.type === "inlineCode" || node.type === "code") {
    return normalizeWhitespace(node.value ?? "");
  }
  if (node.type === "image") {
    return normalizeWhitespace(node.alt ?? "");
  }
  if (node.type === "break" || node.type === "thematicBreak") {
    return " ";
  }
  return normalizeWhitespace((node.children ?? []).map((child) => markdownNodeText(child)).join(" "));
}
function firstMarkdownHeading(text) {
  const nodes = parseMarkdownNodes(text);
  for (const node of nodes) {
    if (node.type === "heading") {
      const title = markdownNodeText(node).trim();
      if (title) {
        return title;
      }
    }
  }
  return void 0;
}
var NON_CODE_RATIONALE_MARKERS = ["NOTE", "WHY", "HACK", "IMPORTANT", "RATIONALE", "TODO", "FIXME", "WARNING", "WARN"];
var NON_CODE_RATIONALE_MARKER_SET = new Set(NON_CODE_RATIONALE_MARKERS);
function matchFixedPrefix(text) {
  const stripped = text.replace(/^[\s>*_\-\u2022\u25CB\u25CF]+/, "").trimStart();
  if (!stripped) {
    return null;
  }
  const match = /^([A-Za-z]+)[:\-\u2013\u2014]\s+(.+)$/s.exec(stripped);
  if (!match) {
    return null;
  }
  const upper = match[1].toUpperCase();
  if (!NON_CODE_RATIONALE_MARKER_SET.has(upper)) {
    return null;
  }
  const remainder = normalizeWhitespace(match[2]).trim();
  if (!remainder) {
    return null;
  }
  return { marker: upper, remainder };
}
function extractRationaleFromMarkdown(content, sourceId) {
  const nodes = parseMarkdownNodes(content);
  if (!nodes.length) {
    return [];
  }
  const rationales = [];
  let currentHeading;
  const recordMatch = (text) => {
    const match = matchFixedPrefix(text);
    if (!match) {
      return;
    }
    rationales.push({
      id: `rationale:${sourceId}:${rationales.length}`,
      text: truncate(match.remainder, 280),
      citation: sourceId,
      kind: match.marker.toLowerCase(),
      symbolName: currentHeading
    });
  };
  const visitBlock = (node) => {
    if (node.type === "heading") {
      const headingText = markdownNodeText(node).trim();
      if (headingText) {
        currentHeading = headingText;
      }
      return;
    }
    if (node.type === "blockquote") {
      for (const child of node.children ?? []) {
        if (child.type === "paragraph") {
          recordMatch(markdownNodeText(child));
        } else {
          visitBlock(child);
        }
      }
      return;
    }
    if (node.type === "list") {
      for (const item of node.children ?? []) {
        if (item.type !== "listItem") {
          continue;
        }
        const itemParagraphs = [];
        const nestedLists = [];
        for (const child of item.children ?? []) {
          if (child.type === "paragraph") {
            itemParagraphs.push(markdownNodeText(child));
          } else if (child.type === "list") {
            nestedLists.push(child);
          }
        }
        const combined = itemParagraphs.join(" ").trim();
        if (combined) {
          recordMatch(combined);
        }
        for (const nested of nestedLists) {
          visitBlock(nested);
        }
      }
    }
  };
  for (const node of nodes) {
    visitBlock(node);
  }
  return rationales;
}
function extractRationaleFromPlainText(content, sourceId, fallbackSymbolName) {
  if (!content.trim()) {
    return [];
  }
  const paragraphs = content.split(/\r?\n\s*\r?\n+/);
  const rationales = [];
  for (const paragraph of paragraphs) {
    const normalized = normalizeWhitespace(paragraph);
    if (!normalized) {
      continue;
    }
    const match = matchFixedPrefix(normalized);
    if (!match) {
      continue;
    }
    rationales.push({
      id: `rationale:${sourceId}:${rationales.length}`,
      text: truncate(match.remainder, 280),
      citation: sourceId,
      kind: match.marker.toLowerCase(),
      symbolName: fallbackSymbolName
    });
  }
  return rationales;
}

// src/extraction.ts
var imageVisionExtractionSchema = z.object({
  title: z.string().min(1).nullable().optional(),
  summary: z.string().min(1),
  text: z.string().default(""),
  concepts: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().default("")
    })
  ).max(12).default([]),
  entities: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().default("")
    })
  ).max(12).default([]),
  claims: z.array(
    z.object({
      text: z.string().min(1),
      confidence: z.number().min(0).max(1).default(0.65),
      polarity: z.enum(["positive", "negative", "neutral"]).default("neutral")
    })
  ).max(8).default([]),
  questions: z.array(z.string().min(1)).max(6).default([])
});
function extractionMetadata(sourceKind, mimeType, extractor) {
  return {
    extractor,
    sourceKind,
    mimeType,
    producedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function buildExtractionHash(extractedText, artifact) {
  if (!extractedText && !artifact) {
    return void 0;
  }
  const normalizedArtifact = artifact ? {
    ...artifact,
    producedAt: void 0
  } : null;
  return sha256(
    JSON.stringify({
      extractedText: extractedText ?? null,
      artifact: normalizedArtifact
    })
  );
}
function createPlainTextExtractionArtifact(sourceKind, mimeType) {
  return extractionMetadata(sourceKind, mimeType, "plain_text");
}
function createHtmlReadabilityExtractionArtifact(sourceKind, mimeType) {
  return extractionMetadata(sourceKind, mimeType, "html_readability");
}
function normalizeVisionMarkdown(payload) {
  const sections = [];
  if (payload.summary.trim()) {
    sections.push(payload.summary.trim());
  }
  if (payload.text.trim()) {
    sections.push(payload.text.trim());
  }
  if (payload.claims.length) {
    sections.push(payload.claims.map((claim) => `- ${claim.text}`).join("\n"));
  }
  return sections.join("\n\n").trim();
}
async function materializeAttachmentPath(input) {
  if (input.filePath) {
    return {
      filePath: input.filePath,
      cleanup: async () => {
      }
    };
  }
  if (!input.bytes) {
    throw new Error("Image extraction requires a file path or bytes.");
  }
  const tempDir = await fs5.mkdtemp(path5.join(os2.tmpdir(), "swarmvault-image-extract-"));
  const extension = input.mimeType.split("/")[1]?.split("+")[0] ?? "bin";
  const tempPath = path5.join(tempDir, `source.${extension}`);
  await fs5.writeFile(tempPath, input.bytes);
  return {
    filePath: tempPath,
    cleanup: async () => {
      await fs5.rm(tempDir, { recursive: true, force: true });
    }
  };
}
async function extractImageWithVision(rootDir, input) {
  let provider;
  try {
    provider = await getProviderForTask(rootDir, "visionProvider");
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("image", input.mimeType, "image_vision"),
        warnings: [`Vision extraction unavailable: ${error instanceof Error ? error.message : "provider not configured"}`]
      }
    };
  }
  if (provider.type === "heuristic" || !provider.capabilities.has("vision") || !provider.capabilities.has("structured")) {
    return {
      artifact: {
        ...extractionMetadata("image", input.mimeType, "image_vision"),
        warnings: [`Vision extraction unavailable for provider ${provider.id}. Configure a structured multimodal provider.`]
      }
    };
  }
  const attachment = await materializeAttachmentPath(input);
  try {
    const parsed = await provider.generateStructured(
      {
        system: [
          "You extract grounded notes from a single image for a local-first knowledge vault.",
          "Only describe content that is actually visible.",
          "If the image contains text, transcribe it accurately.",
          "If the image is a diagram or screenshot, summarize the key visible relationships and labels without speculation."
        ].join("\n"),
        prompt: [
          `Source title: ${input.title}`,
          "Return structured extraction for this image.",
          "Include a concise summary, OCR-style text, grounded concepts/entities, visible claims, and follow-up questions."
        ].join("\n"),
        attachments: [{ mimeType: input.mimeType, filePath: attachment.filePath }]
      },
      imageVisionExtractionSchema
    );
    const artifact = {
      ...extractionMetadata("image", input.mimeType, "image_vision"),
      providerId: provider.id,
      providerModel: provider.model,
      vision: {
        title: parsed.title ?? void 0,
        summary: parsed.summary,
        text: parsed.text,
        concepts: parsed.concepts,
        entities: parsed.entities,
        claims: parsed.claims,
        questions: parsed.questions
      }
    };
    return {
      title: parsed.title ?? void 0,
      extractedText: normalizeVisionMarkdown(parsed),
      artifact
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("image", input.mimeType, "image_vision"),
        providerId: provider.id,
        providerModel: provider.model,
        warnings: [`Vision extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  } finally {
    await attachment.cleanup();
  }
}
async function buildCorpusHint(rootDir, maxTerms = 6) {
  let graphPath;
  try {
    const { paths } = await loadVaultConfig(rootDir);
    graphPath = paths.graphPath;
  } catch {
    return void 0;
  }
  if (!await fileExists(graphPath)) {
    return void 0;
  }
  const graph = await readJsonFile(graphPath);
  if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    return void 0;
  }
  const top = graph.nodes.filter((node) => node.type !== "source" && Boolean(node.label)).sort((left, right) => (right.degree ?? 0) - (left.degree ?? 0)).slice(0, maxTerms).map((node) => node.label.trim()).filter((label) => label.length > 0);
  if (top.length === 0) {
    return void 0;
  }
  return `This audio is likely about ${top.join(", ")}.`;
}
async function extractAudioTranscription(rootDir, input) {
  let provider;
  try {
    provider = await getProviderForTask(rootDir, "audioProvider");
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("audio", input.mimeType, "audio_transcription"),
        warnings: [`Audio transcription unavailable: ${error instanceof Error ? error.message : "provider not configured"}`]
      }
    };
  }
  if (!provider.capabilities.has("audio") || !provider.transcribeAudio) {
    return {
      artifact: {
        ...extractionMetadata("audio", input.mimeType, "audio_transcription"),
        warnings: [`Audio transcription unavailable for provider ${provider.id}. Configure a provider with audio capability.`]
      }
    };
  }
  const corpusHint = input.corpusHint ?? await buildCorpusHint(rootDir);
  try {
    const result = await provider.transcribeAudio({
      mimeType: input.mimeType,
      bytes: input.bytes,
      fileName: input.fileName,
      corpusHint
    });
    const metadata = {};
    if (result.duration !== void 0) {
      metadata.duration = String(result.duration);
    }
    if (result.language) {
      metadata.language = result.language;
    }
    if (corpusHint) {
      metadata.corpus_hint = corpusHint;
    }
    return {
      extractedText: result.text || void 0,
      artifact: {
        ...extractionMetadata("audio", input.mimeType, "audio_transcription"),
        providerId: provider.id,
        providerModel: provider.model,
        metadata: Object.keys(metadata).length ? metadata : void 0
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("audio", input.mimeType, "audio_transcription"),
        providerId: provider.id,
        providerModel: provider.model,
        warnings: [`Audio transcription failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
function videoBinary(envName, fallback) {
  const configured = process.env[envName]?.trim();
  return configured || fallback;
}
function runTool(binary, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      cwd: options?.cwd,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}
function toolFailure(binary, result) {
  const tail = (result.stderr || result.stdout).split(/\r?\n/).filter(Boolean).slice(-5).join("\n");
  return new Error(`${binary} exited with code ${result.code}${tail ? `: ${tail}` : ""}`);
}
async function extractAudioFromVideoBytes(input) {
  const tmpDir = await fs5.mkdtemp(path5.join(os2.tmpdir(), "swarmvault-video-"));
  const inputExtension = path5.extname(input.fileName ?? "") || ".video";
  const inputPath = path5.join(tmpDir, `input${inputExtension}`);
  const outputPath = path5.join(tmpDir, "audio.wav");
  const ffmpeg = videoBinary("SWARMVAULT_FFMPEG_BINARY", "ffmpeg");
  try {
    await fs5.writeFile(inputPath, input.bytes);
    const result = await runTool(ffmpeg, ["-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "16000", outputPath]);
    if (result.code !== 0) {
      throw toolFailure(ffmpeg, result);
    }
    return {
      bytes: await fs5.readFile(outputPath),
      fileName: `${path5.basename(input.fileName ?? "video", path5.extname(input.fileName ?? "")) || "video"}.wav`,
      metadata: {
        video_file: input.fileName ? path5.basename(input.fileName) : "video",
        ffmpeg: ffmpeg === "ffmpeg" ? "path" : ffmpeg
      }
    };
  } finally {
    await fs5.rm(tmpDir, { recursive: true, force: true });
  }
}
async function downloadPublicVideoAudio(input) {
  const tmpDir = await fs5.mkdtemp(path5.join(os2.tmpdir(), "swarmvault-video-url-"));
  const outputTemplate = path5.join(tmpDir, "download.%(ext)s");
  const ytdlp = videoBinary("SWARMVAULT_YTDLP_BINARY", "yt-dlp");
  try {
    const result = await runTool(ytdlp, ["-x", "--audio-format", "wav", "--no-playlist", "-o", outputTemplate, input.url], {
      cwd: tmpDir
    });
    if (result.code !== 0) {
      throw toolFailure(ytdlp, result);
    }
    const entries = await fs5.readdir(tmpDir);
    const audioFile = entries.find((entry) => /^download\.(wav|mp3|m4a|webm|ogg|flac|aac)$/i.test(entry));
    if (!audioFile) {
      throw new Error(`${ytdlp} completed but did not produce an audio file.`);
    }
    return {
      bytes: await fs5.readFile(path5.join(tmpDir, audioFile)),
      fileName: audioFile,
      metadata: {
        url: input.url,
        "yt-dlp": ytdlp === "yt-dlp" ? "path" : ytdlp
      }
    };
  } finally {
    await fs5.rm(tmpDir, { recursive: true, force: true });
  }
}
function audioMimeForFile(fileName) {
  const extension = path5.extname(fileName).toLowerCase();
  switch (extension) {
    case ".mp3":
      return "audio/mpeg";
    case ".m4a":
      return "audio/mp4";
    case ".webm":
      return "audio/webm";
    case ".ogg":
      return "audio/ogg";
    case ".flac":
      return "audio/flac";
    case ".aac":
      return "audio/aac";
    default:
      return "audio/wav";
  }
}
function videoArtifactFromAudio(mimeType, audioArtifact, metadata) {
  return {
    ...audioArtifact,
    ...extractionMetadata("video", mimeType, "video_transcription"),
    providerId: audioArtifact.providerId,
    providerModel: audioArtifact.providerModel,
    warnings: audioArtifact.warnings,
    metadata: {
      ...audioArtifact.metadata ?? {},
      ...metadata
    }
  };
}
async function extractVideoTranscription(rootDir, input) {
  try {
    const extractedAudio = await extractAudioFromVideoBytes(input);
    const audio = await extractAudioTranscription(rootDir, {
      mimeType: "audio/wav",
      bytes: extractedAudio.bytes,
      fileName: extractedAudio.fileName
    });
    return {
      title: input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0,
      extractedText: audio.extractedText,
      artifact: videoArtifactFromAudio(input.mimeType, audio.artifact, extractedAudio.metadata)
    };
  } catch (error) {
    return {
      title: input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0,
      artifact: {
        ...extractionMetadata("video", input.mimeType, "video_transcription"),
        warnings: [`Video transcription unavailable: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
async function extractPublicVideoTranscription(rootDir, input) {
  try {
    const extractedAudio = await downloadPublicVideoAudio(input);
    const audio = await extractAudioTranscription(rootDir, {
      mimeType: audioMimeForFile(extractedAudio.fileName),
      bytes: extractedAudio.bytes,
      fileName: extractedAudio.fileName
    });
    return {
      extractedText: audio.extractedText,
      artifact: videoArtifactFromAudio("video/url", audio.artifact, extractedAudio.metadata)
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("video", "video/url", "video_transcription"),
        metadata: { url: input.url },
        warnings: [`Public video transcription unavailable: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
async function extractYoutubeTranscript(input) {
  try {
    const result = await fetchTranscript(input.videoId, { videoDetails: true });
    const details = result.videoDetails;
    const title = details?.title ?? `YouTube ${input.videoId}`;
    const transcriptText = result.segments?.map((part) => part.text).join(" ") ?? "";
    const sections = [`# ${title}`];
    const metaLines = [];
    if (details?.author) metaLines.push(`**Author:** ${details.author}`);
    if (details?.lengthSeconds) {
      const seconds = details.lengthSeconds;
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      metaLines.push(`**Duration:** ${minutes}:${String(secs).padStart(2, "0")}`);
    }
    if (details?.viewCount) metaLines.push(`**Views:** ${Number(details.viewCount).toLocaleString()}`);
    metaLines.push(`**URL:** ${input.url}`);
    if (metaLines.length) {
      sections.push(metaLines.join("\n"));
    }
    if (transcriptText.trim()) {
      sections.push(`## Transcript

${transcriptText.trim()}`);
    }
    const extractedText = sections.join("\n\n");
    const metadata = {};
    if (details?.title) metadata.title = details.title;
    if (details?.author) metadata.author = details.author;
    if (details?.lengthSeconds) metadata.duration = String(details.lengthSeconds);
    if (details?.viewCount) metadata.viewCount = String(details.viewCount);
    return {
      title,
      extractedText: extractedText || void 0,
      artifact: {
        ...extractionMetadata("youtube", "text/html", "youtube_transcript"),
        metadata: Object.keys(metadata).length ? metadata : void 0
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("youtube", "text/html", "youtube_transcript"),
        warnings: [`YouTube transcript extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
function normalizePdfMetadata(raw) {
  if (!raw || typeof raw !== "object") {
    return void 0;
  }
  const metadata = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      const cleaned = normalizeWhitespace(value);
      if (cleaned) {
        metadata[key] = cleaned;
      }
    }
  }
  return Object.keys(metadata).length ? metadata : void 0;
}
function normalizeDocumentText(raw) {
  return raw.replace(/\r\n/g, "\n").split(/\n{2,}/).map((section) => normalizeWhitespace(section)).filter(Boolean).join("\n\n").trim();
}
function parseOfficeCoreMetadata(bytes) {
  try {
    const archive = unzipSync(new Uint8Array(bytes));
    const coreXml = archive["docProps/core.xml"];
    if (!coreXml) {
      return void 0;
    }
    const dom = new JSDOM(strFromU8(coreXml), { contentType: "text/xml" });
    const document = dom.window.document;
    const valuesByLocalName = /* @__PURE__ */ new Map();
    for (const node of Array.from(document.getElementsByTagName("*"))) {
      const localName = node.localName?.trim().toLowerCase();
      const text = normalizeWhitespace(node.textContent ?? "");
      if (!localName || !text || valuesByLocalName.has(localName)) {
        continue;
      }
      valuesByLocalName.set(localName, text);
    }
    const metadata = {};
    const mappings = [
      ["title", "title"],
      ["author", "creator"],
      ["subject", "subject"],
      ["description", "description"],
      ["keywords", "keywords"],
      ["last_modified_by", "lastmodifiedby"],
      ["created", "created"],
      ["modified", "modified"]
    ];
    for (const [targetKey, sourceKey] of mappings) {
      const value = valuesByLocalName.get(sourceKey);
      if (value) {
        metadata[targetKey] = value;
      }
    }
    return Object.keys(metadata).length ? metadata : void 0;
  } catch {
    return void 0;
  }
}
function decodeTextBytes(bytes) {
  const text = bytes.toString("utf8");
  return text.charCodeAt(0) === 65279 ? text.slice(1) : text;
}
function normalizeTableCell(value) {
  return normalizeWhitespace(String(value ?? ""));
}
function isNumericCell(value) {
  return value.length > 0 && Number.isFinite(Number(value));
}
function detectHeaderRow(rows) {
  if (!rows.length) {
    return { headers: [], bodyRows: [] };
  }
  const firstRow = rows[0] ?? [];
  const nonEmpty = firstRow.filter(Boolean);
  const unique = new Set(nonEmpty);
  const nonNumeric = nonEmpty.filter((value) => !isNumericCell(value));
  const looksLikeHeader = nonEmpty.length > 0 && unique.size === nonEmpty.length && nonNumeric.length >= Math.ceil(nonEmpty.length / 2) && rows.length > 1;
  if (looksLikeHeader) {
    return {
      headers: firstRow.map((value, index) => value || `column_${index + 1}`),
      bodyRows: rows.slice(1)
    };
  }
  const columnCount = Math.max(...rows.map((row) => row.length), 0);
  return {
    headers: Array.from({ length: columnCount }, (_, index) => `column_${index + 1}`),
    bodyRows: rows
  };
}
function columnHints(headers, rows) {
  return headers.map((header, index) => {
    const values = rows.map((row) => row[index] ?? "").map(normalizeTableCell).filter(Boolean);
    if (!values.length) {
      return null;
    }
    const uniqueValues = [...new Set(values)];
    if (values.every(isNumericCell)) {
      return `- ${header}: numeric`;
    }
    if (uniqueValues.length <= 6 && values.length >= uniqueValues.length) {
      return `- ${header}: low-cardinality (${uniqueValues.slice(0, 6).join(", ")})`;
    }
    return null;
  }).filter((item) => Boolean(item));
}
function markdownTable(headers, rows, rowLimit = 20) {
  if (!headers.length) {
    return ["No tabular preview available."];
  }
  const width = headers.length;
  const lines = [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`];
  for (const row of rows.slice(0, rowLimit)) {
    const normalized = Array.from({ length: width }, (_, index) => normalizeTableCell(row[index] ?? ""));
    lines.push(`| ${normalized.join(" | ")} |`);
  }
  return lines;
}
function zipEntryText(archive, entryPath) {
  const entry = archive[entryPath];
  return entry ? strFromU8(entry) : void 0;
}
function parseXmlDocument(xml) {
  return new JSDOM(xml, { contentType: "text/xml" }).window.document;
}
function zipDirname(value) {
  const index = value.lastIndexOf("/");
  return index === -1 ? "" : value.slice(0, index);
}
function resolveZipTarget(basePath, target) {
  return path5.posix.normalize(path5.posix.join(zipDirname(basePath), target));
}
function relationshipTargets(xml, basePath) {
  const document = parseXmlDocument(xml);
  const map = /* @__PURE__ */ new Map();
  for (const node of Array.from(document.getElementsByTagName("*"))) {
    if (node.localName !== "Relationship") {
      continue;
    }
    const id = node.getAttribute("Id")?.trim();
    const target = node.getAttribute("Target")?.trim();
    const type = node.getAttribute("Type")?.trim() ?? "";
    if (!id || !target) {
      continue;
    }
    map.set(id, { target: resolveZipTarget(basePath, target), type });
  }
  return map;
}
function xmlTextNodes(xml, localName) {
  const document = parseXmlDocument(xml);
  const values = [];
  for (const node of Array.from(document.getElementsByTagName("*"))) {
    if (node.localName !== localName) {
      continue;
    }
    const text = normalizeWhitespace(node.textContent ?? "");
    if (text) {
      values.push(text);
    }
  }
  return values;
}
function firstHtmlHeading(html) {
  const dom = new JSDOM(html);
  const heading = dom.window.document.querySelector("h1, h2, h3");
  const title = normalizeWhitespace(heading?.textContent ?? "");
  return title || void 0;
}
function htmlToMarkdown(html) {
  const dom = new JSDOM(html);
  const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
  const body = dom.window.document.body?.innerHTML ?? html;
  return turndown.turndown(body).trim();
}
async function extractPdfText(input) {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = pdfjs.getDocument({
      data: new Uint8Array(input.bytes),
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
      verbosity: 0
    });
    const document = await task.promise;
    const pageTexts = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = normalizeWhitespace(
        textContent.items.map((item) => typeof item === "object" && item && "str" in item && typeof item.str === "string" ? item.str : "").join(" ")
      );
      if (pageText) {
        pageTexts.push(pageText);
      }
      page.cleanup();
    }
    const metadataResult = await document.getMetadata().catch(() => null);
    await task.destroy();
    const extractedText = pageTexts.join("\n\n").trim();
    const artifact = {
      ...extractionMetadata("pdf", input.mimeType, "pdf_text"),
      pageCount: document.numPages,
      metadata: normalizePdfMetadata(metadataResult?.info)
    };
    if (!extractedText) {
      artifact.warnings = ["PDF text extraction completed but produced no extractable text."];
    }
    return {
      extractedText: extractedText || void 0,
      artifact
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("pdf", input.mimeType, "pdf_text"),
        warnings: [`PDF text extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
async function extractDocxText(input) {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({
      buffer: input.bytes
    });
    const extractedText = normalizeDocumentText(result.value);
    const warnings = result.messages.map((message) => normalizeWhitespace(message.message)).filter(Boolean).map((message) => truncate(message, 240));
    const artifact = {
      ...extractionMetadata("docx", input.mimeType, "docx_text"),
      metadata: parseOfficeCoreMetadata(input.bytes),
      warnings: warnings.length ? warnings : void 0
    };
    if (!extractedText) {
      artifact.warnings = [...artifact.warnings ?? [], "DOCX text extraction completed but produced no extractable text."];
    }
    return {
      extractedText: extractedText || void 0,
      artifact
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("docx", input.mimeType, "docx_text"),
        warnings: [`DOCX text extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
function jupyterCellSource(cell) {
  const source = cell.source;
  if (Array.isArray(source)) {
    return source.join("");
  }
  if (typeof source === "string") {
    return source;
  }
  return "";
}
function jupyterOutputSummary(outputs) {
  if (!Array.isArray(outputs) || outputs.length === 0) {
    return null;
  }
  const parts = [];
  for (const output of outputs) {
    const data = output.data;
    if (data && typeof data === "object") {
      const text = data["text/plain"] ?? data["text/markdown"];
      if (typeof text === "string") {
        parts.push(text.trim());
        continue;
      }
      if (Array.isArray(text)) {
        parts.push(text.join("").trim());
        continue;
      }
    }
    const textField = output.text;
    if (typeof textField === "string") {
      parts.push(textField.trim());
      continue;
    }
    if (Array.isArray(textField)) {
      parts.push(textField.join("").trim());
    }
  }
  const joined = parts.filter(Boolean).join("\n").trim();
  if (!joined) {
    return `[${outputs.length} non-text output${outputs.length === 1 ? "" : "s"}]`;
  }
  return joined.length > 1200 ? `${joined.slice(0, 1200)}
[output truncated]` : joined;
}
async function extractJupyterNotebook(input) {
  try {
    const text = decodeTextBytes(input.bytes);
    const notebook = JSON.parse(text);
    const cells = Array.isArray(notebook.cells) ? notebook.cells : [];
    const kernelLanguage = notebook.metadata?.language_info?.name?.trim() || notebook.metadata?.kernelspec?.language?.trim() || "";
    const kernelDisplay = notebook.metadata?.kernelspec?.display_name?.trim() || "";
    let notebookTitle = typeof notebook.metadata?.title === "string" ? notebook.metadata.title.trim() : "";
    if (!notebookTitle) {
      for (const cell of cells) {
        if (cell.cell_type === "markdown") {
          const heading2 = firstMarkdownHeading(jupyterCellSource(cell));
          if (heading2) {
            notebookTitle = heading2;
            break;
          }
        }
      }
    }
    if (!notebookTitle && input.fileName) {
      notebookTitle = path5.basename(input.fileName, path5.extname(input.fileName));
    }
    const sections = [];
    let markdownCellCount = 0;
    let codeCellCount = 0;
    let outputCount = 0;
    for (const cell of cells) {
      const source = jupyterCellSource(cell).trim();
      if (!source) {
        continue;
      }
      if (cell.cell_type === "markdown") {
        markdownCellCount += 1;
        sections.push(source);
        sections.push("");
        continue;
      }
      if (cell.cell_type === "code") {
        codeCellCount += 1;
        const fence = kernelLanguage || "";
        sections.push(`\`\`\`${fence}`);
        sections.push(source);
        sections.push("```");
        const outputSummary = jupyterOutputSummary(cell.outputs);
        if (outputSummary) {
          outputCount += Array.isArray(cell.outputs) ? cell.outputs.length : 0;
          sections.push("");
          sections.push("_Output:_");
          sections.push("");
          sections.push(outputSummary);
        }
        sections.push("");
        continue;
      }
      sections.push(source);
      sections.push("");
    }
    const heading = notebookTitle ? [`# ${notebookTitle}`, ""] : [];
    const extractedText = [
      ...heading,
      `Jupyter Notebook (${cells.length} cell${cells.length === 1 ? "" : "s"}, kernel: ${kernelDisplay || kernelLanguage || "unknown"})`,
      "",
      ...sections
    ].join("\n").trim();
    const metadata = {
      cell_count: String(cells.length),
      markdown_cells: String(markdownCellCount),
      code_cells: String(codeCellCount),
      output_count: String(outputCount)
    };
    if (kernelLanguage) {
      metadata.kernel_language = kernelLanguage;
    }
    if (kernelDisplay) {
      metadata.kernel_display_name = kernelDisplay;
    }
    if (notebook.nbformat !== void 0) {
      metadata.nbformat = `${notebook.nbformat}${notebook.nbformat_minor !== void 0 ? `.${notebook.nbformat_minor}` : ""}`;
    }
    return {
      title: notebookTitle || void 0,
      extractedText: extractedText || void 0,
      artifact: {
        ...extractionMetadata("jupyter", input.mimeType, "jupyter_text"),
        metadata
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("jupyter", input.mimeType, "jupyter_text"),
        warnings: [`Jupyter notebook extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
async function extractCsvText(input) {
  try {
    const rawText = decodeTextBytes(input.bytes);
    const delimiter = input.fileName?.toLowerCase().endsWith(".tsv") || input.mimeType.includes("tab-separated") ? "	" : ",";
    const parsed = parseCsvSync(rawText, {
      delimiter,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true
    });
    const rows = parsed.map((row) => row.map((value) => normalizeTableCell(value)));
    const { headers, bodyRows } = detectHeaderRow(rows);
    const hintLines = columnHints(headers, bodyRows);
    const title = input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0;
    const extractedText = [
      title ? `# ${title}` : null,
      `Format: ${delimiter === "	" ? "TSV" : "CSV"}`,
      `Rows: ${bodyRows.length}`,
      `Columns: ${headers.length}`,
      headers.length ? `Headers: ${headers.join(", ")}` : null,
      "",
      hintLines.length ? "## Column Hints" : null,
      hintLines.length ? hintLines.join("\n") : null,
      hintLines.length ? "" : null,
      "## Preview",
      ...markdownTable(headers, bodyRows)
    ].filter((item) => Boolean(item)).join("\n").trim();
    const artifact = {
      ...extractionMetadata("csv", input.mimeType, "csv_text"),
      metadata: {
        format: delimiter === "	" ? "tsv" : "csv",
        row_count: String(bodyRows.length),
        column_count: String(headers.length),
        headers: headers.join(", ")
      }
    };
    return {
      title,
      extractedText,
      artifact
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("csv", input.mimeType, "csv_text"),
        warnings: [`CSV extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
async function extractSpreadsheetWorkbook(input, sourceKind, extractor) {
  try {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(input.bytes, { type: "buffer", cellFormula: false, cellHTML: false, cellStyles: false });
    const allSheetNames = workbook.SheetNames;
    const sheetNames = allSheetNames.slice(0, 10);
    const sheetSections = [];
    const metadata = {
      sheet_count: String(allSheetNames.length),
      sheet_names: allSheetNames.join(", ")
    };
    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        continue;
      }
      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        defval: ""
      }).map((row) => row.map((value) => normalizeTableCell(value)));
      const { headers, bodyRows } = detectHeaderRow(rows);
      sheetSections.push(`## Sheet: ${sheetName}`);
      sheetSections.push(`Rows: ${bodyRows.length}`);
      sheetSections.push(`Columns: ${headers.length}`);
      sheetSections.push(...markdownTable(headers, bodyRows));
      sheetSections.push("");
    }
    const title = normalizeWhitespace(String(workbook.Props?.Title ?? "")) || (input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0);
    const extractedText = [
      title ? `# ${title}` : null,
      `Sheets: ${allSheetNames.length}`,
      allSheetNames.length ? `Sheet Names: ${allSheetNames.join(", ")}` : null,
      "",
      ...sheetSections
    ].filter((item) => Boolean(item)).join("\n").trim();
    const warnings = allSheetNames.length > sheetNames.length ? ["Workbook preview truncated to the first 10 sheets."] : void 0;
    return {
      title,
      extractedText,
      artifact: {
        ...extractionMetadata(sourceKind, input.mimeType, extractor),
        metadata,
        warnings
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata(sourceKind, input.mimeType, extractor),
        warnings: [
          `${sourceKind.toUpperCase()} extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`
        ]
      }
    };
  }
}
async function extractXlsxText(input) {
  return extractSpreadsheetWorkbook(input, "xlsx", "xlsx_text");
}
async function extractOdsText(input) {
  return extractSpreadsheetWorkbook(input, "ods", "ods_text");
}
async function extractPptxText(input) {
  try {
    const archive = unzipSync(new Uint8Array(input.bytes));
    const presentationXml = zipEntryText(archive, "ppt/presentation.xml");
    if (!presentationXml) {
      throw new Error("Missing ppt/presentation.xml");
    }
    const relsXml = zipEntryText(archive, "ppt/_rels/presentation.xml.rels");
    if (!relsXml) {
      throw new Error("Missing ppt/_rels/presentation.xml.rels");
    }
    const rels = relationshipTargets(relsXml, "ppt/presentation.xml");
    const document = parseXmlDocument(presentationXml);
    const slideTargets = Array.from(document.getElementsByTagName("*")).filter((node) => node.localName === "sldId").map((node) => node.getAttribute("r:id")?.trim()).filter((value) => Boolean(value)).map((relationshipId) => rels.get(relationshipId)?.target).filter((value) => Boolean(value)).slice(0, 60);
    const slideSections = [];
    for (let index = 0; index < slideTargets.length; index += 1) {
      const slidePath = slideTargets[index];
      const slideXml = zipEntryText(archive, slidePath);
      if (!slideXml) {
        continue;
      }
      const slideTexts = xmlTextNodes(slideXml, "t");
      const slideTitle = slideTexts[0] ?? `Slide ${index + 1}`;
      slideSections.push(`## Slide ${index + 1}: ${slideTitle}`);
      if (slideTexts.length) {
        slideSections.push(slideTexts.join("\n"));
      }
      const slideRelsPath = `${zipDirname(slidePath)}/_rels/${path5.posix.basename(slidePath)}.rels`;
      const slideRelsXml = zipEntryText(archive, slideRelsPath);
      if (slideRelsXml) {
        const slideRels = relationshipTargets(slideRelsXml, slidePath);
        const notesTarget = [...slideRels.values()].find((entry) => entry.type.endsWith("/notesSlide"))?.target;
        if (notesTarget) {
          const notesXml = zipEntryText(archive, notesTarget);
          const noteTexts = notesXml ? xmlTextNodes(notesXml, "t") : [];
          if (noteTexts.length) {
            slideSections.push("Notes:");
            slideSections.push(noteTexts.join("\n"));
          }
        }
      }
      slideSections.push("");
    }
    const metadata = parseOfficeCoreMetadata(input.bytes);
    const title = metadata?.title || (input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0);
    const extractedText = [title ? `# ${title}` : null, `Slides: ${slideTargets.length}`, "", ...slideSections].filter((item) => Boolean(item)).join("\n").trim();
    return {
      title,
      extractedText,
      artifact: {
        ...extractionMetadata("pptx", input.mimeType, "pptx_text"),
        metadata: {
          ...metadata ?? {},
          slide_count: String(slideTargets.length)
        },
        warnings: Array.from(document.getElementsByTagName("*")).filter((node) => node.localName === "sldId").length > slideTargets.length ? ["Slide extraction truncated to the first 60 slides."] : void 0
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("pptx", input.mimeType, "pptx_text"),
        warnings: [`PPTX extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
async function extractEpubChapters(input) {
  try {
    const archive = unzipSync(new Uint8Array(input.bytes));
    const containerXml = zipEntryText(archive, "META-INF/container.xml");
    if (!containerXml) {
      throw new Error("Missing META-INF/container.xml");
    }
    const container = parseXmlDocument(containerXml);
    const rootfile = Array.from(container.getElementsByTagName("*")).find((node) => node.localName === "rootfile");
    const packagePath = rootfile?.getAttribute("full-path")?.trim();
    if (!packagePath) {
      throw new Error("EPUB container did not declare a package document.");
    }
    const packageXml = zipEntryText(archive, packagePath);
    if (!packageXml) {
      throw new Error(`Missing EPUB package document: ${packagePath}`);
    }
    const packageDocument = parseXmlDocument(packageXml);
    const manifestEntries = new Map(
      Array.from(packageDocument.getElementsByTagName("*")).filter((node) => node.localName === "item").map(
        (node) => [
          node.getAttribute("id")?.trim() ?? "",
          {
            href: node.getAttribute("href")?.trim() ?? "",
            mediaType: node.getAttribute("media-type")?.trim() ?? "",
            properties: node.getAttribute("properties")?.trim() ?? ""
          }
        ]
      ).filter(([id, item]) => Boolean(id && item.href))
    );
    const spineIds = Array.from(packageDocument.getElementsByTagName("*")).filter((node) => node.localName === "itemref").map((node) => node.getAttribute("idref")?.trim()).filter((value) => Boolean(value));
    const bookTitle = xmlTextNodes(packageXml, "title")[0] || (input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0);
    const author = xmlTextNodes(packageXml, "creator")[0];
    const chapters = [];
    for (const spineId of spineIds) {
      const item = manifestEntries.get(spineId);
      if (!item || !item.mediaType.includes("html") && !item.mediaType.includes("xhtml")) {
        continue;
      }
      if (item.properties.split(/\s+/).includes("nav")) {
        continue;
      }
      const entryPath = resolveZipTarget(packagePath, item.href);
      const html = zipEntryText(archive, entryPath);
      if (!html) {
        continue;
      }
      const markdown = htmlToMarkdown(html);
      if (!markdown) {
        continue;
      }
      const chapterTitle = firstHtmlHeading(html) || item.href;
      const normalizedTitle = normalizeWhitespace(chapterTitle);
      if (!normalizedTitle || /^table of contents$/i.test(normalizedTitle)) {
        continue;
      }
      chapters.push({
        partKey: item.href,
        title: normalizedTitle,
        markdown,
        metadata: {
          book_title: bookTitle ?? "",
          chapter_title: normalizedTitle,
          author: author ?? ""
        }
      });
    }
    return {
      title: bookTitle,
      author,
      chapters,
      warnings: chapters.length ? void 0 : ["EPUB extraction completed but found no chapter-like spine entries."]
    };
  } catch (error) {
    return {
      chapters: [],
      warnings: [`EPUB extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
    };
  }
}
function timestampFromMs(value) {
  const totalMs = Math.max(0, Math.floor(value));
  const totalSeconds = Math.floor(totalMs / 1e3);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = totalMs % 1e3;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(
    milliseconds
  ).padStart(3, "0")}`;
}
function normalizeDelimitedList(values) {
  const unique = [...new Set(values.map((value) => normalizeWhitespace(value)).filter(Boolean))];
  return unique.length ? unique.join(", ") : void 0;
}
function normalizeIsoDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (Number.isFinite(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return void 0;
}
function addressNames(value) {
  if (!value || typeof value !== "object" || !("value" in value) || !Array.isArray(value.value)) {
    return [];
  }
  return value.value.map((entry) => normalizeWhitespace(entry.name ?? entry.address ?? "")).filter(Boolean);
}
function addressList(value) {
  return normalizeDelimitedList(addressNames(value));
}
function emailConversationId(parsed) {
  const asArray = (value) => Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  return normalizeWhitespace(parsed.messageId ?? "") || normalizeWhitespace(asArray(parsed.inReplyTo)[0] ?? "") || normalizeWhitespace(asArray(parsed.references)[0] ?? "") || void 0;
}
function emailBodyMarkdown(parsed) {
  const text = normalizeDocumentText(parsed.text ?? "");
  if (text) {
    return text;
  }
  if (typeof parsed.html === "string" && parsed.html.trim()) {
    return normalizeDocumentText(htmlToMarkdown(parsed.html));
  }
  return "";
}
function normalizeParsedEmail(parsed, fallbackTitle) {
  const title = normalizeWhitespace(parsed.subject ?? "") || fallbackTitle;
  const sender = addressList(parsed.from);
  const recipients = addressList(parsed.to);
  const cc = addressList(parsed.cc);
  const occurredAt = normalizeIsoDate(parsed.date);
  const participants = normalizeDelimitedList([...addressNames(parsed.from), ...addressNames(parsed.to), ...addressNames(parsed.cc)]);
  const conversationId = emailConversationId(parsed);
  const body = emailBodyMarkdown(parsed);
  const attachmentCount = Array.isArray(parsed.attachments) ? parsed.attachments.length : 0;
  return {
    title,
    conversationId,
    metadata: {
      ...occurredAt ? { occurred_at: occurredAt } : {},
      ...sender ? { sender } : {},
      ...recipients ? { recipients } : {},
      ...cc ? { cc } : {},
      ...participants ? { participants } : {},
      ...conversationId ? { conversation_id: conversationId } : {},
      ...normalizeWhitespace(parsed.messageId ?? "") ? { message_id: normalizeWhitespace(parsed.messageId ?? "") } : {},
      ...attachmentCount ? { attachment_count: String(attachmentCount) } : {}
    },
    markdown: [
      `# ${title}`,
      "",
      ...occurredAt ? [`Date: ${occurredAt}`] : [],
      ...sender ? [`From: ${sender}`] : [],
      ...recipients ? [`To: ${recipients}`] : [],
      ...cc ? [`CC: ${cc}`] : [],
      ...conversationId ? [`Conversation ID: ${conversationId}`] : [],
      ...attachmentCount ? [`Attachments: ${attachmentCount}`] : [],
      "",
      "## Message",
      "",
      body || "No readable body content was extracted from this email.",
      ""
    ].join("\n")
  };
}
function calendarAttendees(value) {
  if (!value) {
    return [];
  }
  const attendees = Array.isArray(value) ? value : [value];
  return attendees.map((entry) => {
    if (!entry || typeof entry !== "object") {
      return "";
    }
    const item = entry;
    const name = normalizeWhitespace(String(item.params?.CN ?? ""));
    const address = normalizeWhitespace(String(item.val ?? item.value ?? ""));
    return name || address;
  }).filter(Boolean);
}
function slackFormatSpeakerId(input, usersById) {
  return usersById.get(input) ?? input;
}
function slackNormalizeText(text, usersById) {
  return normalizeWhitespace(
    text.replace(/<@([A-Z0-9]+)>/g, (_, userId) => `@${slackFormatSpeakerId(userId, usersById)}`).replace(/<#[A-Z0-9]+\|([^>]+)>/g, "#$1").replace(/<(https?:\/\/[^>|]+)\|([^>]+)>/g, "$2 ($1)").replace(/<(https?:\/\/[^>]+)>/g, "$1")
  );
}
function slackMessageTimestamp(ts2, fallbackDate) {
  const numeric = Number(ts2);
  if (Number.isFinite(numeric) && numeric > 0) {
    return new Date(numeric * 1e3).toISOString();
  }
  return (/* @__PURE__ */ new Date(`${fallbackDate}T00:00:00.000Z`)).toISOString();
}
async function loadZipMessageBuffers(bytes) {
  const { MboxStream } = await import("node-mbox");
  const stream = MboxStream(Readable.from([bytes]));
  return await new Promise((resolve, reject) => {
    const messages = [];
    stream.on("data", (message) => {
      messages.push(Buffer.isBuffer(message) ? message : Buffer.from(message));
    });
    stream.on("error", reject);
    stream.on("finish", () => resolve(messages));
    stream.on("end", () => resolve(messages));
  });
}
function archiveEntriesAsText(archive) {
  return new Map(
    Object.entries(archive).filter(([, value]) => value).map(([entryPath, value]) => [entryPath, strFromU8(value)])
  );
}
function looksLikeSlackEntries(entries) {
  const all = [...entries];
  const hasChannelsIndex = all.some(
    (entry) => entry === "channels.json" || entry === "groups.json" || entry === "dms.json" || entry === "mpims.json"
  );
  const hasChannelDayFiles = all.some((entry) => /^[^/]+\/\d{4}-\d{2}-\d{2}\.json$/i.test(entry));
  return hasChannelsIndex && hasChannelDayFiles;
}
function slackEntriesFromChannelIndex(raw, usersById) {
  const entries = /* @__PURE__ */ new Map();
  if (!Array.isArray(raw)) {
    return entries;
  }
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const value = item;
    const id = normalizeWhitespace(value.id ?? "");
    const title = normalizeWhitespace(value.name ?? "");
    if (!title) {
      continue;
    }
    const members = (Array.isArray(value.members) ? value.members : value.user ? [value.user] : []).map((member) => slackFormatSpeakerId(member, usersById)).filter(Boolean);
    entries.set(title, { id, title, members });
  }
  return entries;
}
function parseOdfMetadata(bytes) {
  try {
    const archive = unzipSync(new Uint8Array(bytes));
    const metaXml = zipEntryText(archive, "meta.xml");
    if (!metaXml) {
      return void 0;
    }
    const document = parseXmlDocument(metaXml);
    const valuesByLocalName = /* @__PURE__ */ new Map();
    for (const node of Array.from(document.getElementsByTagName("*"))) {
      const localName = node.localName?.trim().toLowerCase();
      const text = normalizeWhitespace(node.textContent ?? "");
      if (!localName || !text || valuesByLocalName.has(localName)) {
        continue;
      }
      valuesByLocalName.set(localName, text);
    }
    const metadata = {};
    const mappings = [
      ["title", "title"],
      ["author", "creator"],
      ["subject", "subject"],
      ["description", "description"],
      ["keywords", "keyword"],
      ["initial_creator", "initial-creator"],
      ["created", "creation-date"],
      ["modified", "date"]
    ];
    for (const [targetKey, sourceKey] of mappings) {
      const value = valuesByLocalName.get(sourceKey);
      if (value) {
        metadata[targetKey] = value;
      }
    }
    return Object.keys(metadata).length ? metadata : void 0;
  } catch {
    return void 0;
  }
}
function collectOdfTextNodes(contentXml) {
  const document = parseXmlDocument(contentXml);
  const nodes = [];
  for (const node of Array.from(document.getElementsByTagName("*"))) {
    const localName = node.localName ?? "";
    if (localName === "h") {
      const level = Number.parseInt(node.getAttribute("text:outline-level") ?? "1", 10);
      const text = normalizeWhitespace(node.textContent ?? "");
      if (text) {
        nodes.push({ heading: Number.isFinite(level) && level > 0 ? level : 1, text });
      }
      continue;
    }
    if (localName === "p" || localName === "list-item") {
      if (node.closest?.("h")) {
        continue;
      }
      const text = normalizeWhitespace(node.textContent ?? "");
      if (text) {
        nodes.push({ text });
      }
    }
  }
  return nodes;
}
function renderOdfTextNodes(nodes) {
  const lines = [];
  for (const node of nodes) {
    if (node.heading) {
      lines.push("");
      lines.push(`${"#".repeat(Math.min(node.heading, 6))} ${node.text}`);
      lines.push("");
      continue;
    }
    lines.push(node.text);
    lines.push("");
  }
  return lines.join("\n").trim();
}
async function extractOdtText(input) {
  try {
    const archive = unzipSync(new Uint8Array(input.bytes));
    const contentXml = zipEntryText(archive, "content.xml");
    if (!contentXml) {
      throw new Error("Missing content.xml");
    }
    const metadata = parseOdfMetadata(input.bytes);
    const textNodes = collectOdfTextNodes(contentXml);
    const headingCount = textNodes.filter((node) => node.heading).length;
    const paragraphCount = textNodes.filter((node) => !node.heading).length;
    const title = metadata?.title || textNodes.find((node) => node.heading === 1)?.text || (input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0);
    const body = renderOdfTextNodes(textNodes);
    const extractedText = [title ? `# ${title}` : null, "", body].filter((item) => item !== null).join("\n").trim();
    return {
      title,
      extractedText: extractedText || void 0,
      artifact: {
        ...extractionMetadata("odt", input.mimeType, "odt_text"),
        metadata: {
          ...metadata ?? {},
          heading_count: String(headingCount),
          paragraph_count: String(paragraphCount)
        }
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("odt", input.mimeType, "odt_text"),
        warnings: [`ODT extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
async function extractOdpText(input) {
  try {
    const archive = unzipSync(new Uint8Array(input.bytes));
    const contentXml = zipEntryText(archive, "content.xml");
    if (!contentXml) {
      throw new Error("Missing content.xml");
    }
    const metadata = parseOdfMetadata(input.bytes);
    const document = parseXmlDocument(contentXml);
    const pages = Array.from(document.getElementsByTagName("*")).filter((node) => node.localName === "page");
    const slideSections = [];
    pages.slice(0, 60).forEach((page, index) => {
      const slideName = page.getAttribute("draw:name") ?? `Slide ${index + 1}`;
      const text = normalizeWhitespace(page.textContent ?? "");
      slideSections.push(`## Slide ${index + 1}: ${slideName}`);
      if (text) {
        slideSections.push(text);
      }
      slideSections.push("");
    });
    const title = metadata?.title || (input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0);
    const extractedText = [title ? `# ${title}` : null, `Slides: ${pages.length}`, "", ...slideSections].filter((item) => Boolean(item)).join("\n").trim();
    const warnings = pages.length > 60 ? ["ODP extraction truncated to the first 60 slides."] : void 0;
    return {
      title,
      extractedText: extractedText || void 0,
      artifact: {
        ...extractionMetadata("odp", input.mimeType, "odp_text"),
        metadata: {
          ...metadata ?? {},
          slide_count: String(pages.length)
        },
        warnings
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("odp", input.mimeType, "odp_text"),
        warnings: [`ODP extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
function inferStructuredFormat(mimeType, fileName) {
  const lower = (fileName ?? "").toLowerCase();
  if (lower.endsWith(".jsonc") || lower.endsWith(".json") || lower.endsWith(".json5") || mimeType === "application/json" || mimeType === "application/json5") {
    return "json";
  }
  if (lower.endsWith(".yaml") || lower.endsWith(".yml") || mimeType === "application/yaml" || mimeType === "application/x-yaml") {
    return "yaml";
  }
  if (lower.endsWith(".toml") || mimeType === "application/toml") {
    return "toml";
  }
  if (lower.endsWith(".xml") || mimeType === "application/xml" || mimeType === "text/xml") {
    return "xml";
  }
  if (lower.endsWith(".ini") || lower.endsWith(".conf") || lower.endsWith(".cfg")) {
    return "ini";
  }
  if (lower.endsWith(".env")) {
    return "env";
  }
  if (lower.endsWith(".properties")) {
    return "properties";
  }
  return null;
}
function parseEnvFile(text) {
  const result = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) {
      continue;
    }
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}
function parsePropertiesFile(text) {
  const result = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("!")) {
      continue;
    }
    let sep = line.indexOf("=");
    if (sep < 0) {
      sep = line.indexOf(":");
    }
    if (sep <= 0) {
      continue;
    }
    const key = line.slice(0, sep).trim();
    const value = line.slice(sep + 1).trim();
    result[key] = value;
  }
  return result;
}
function parseXmlToSchema(text) {
  const document = parseXmlDocument(text);
  const root = document.documentElement;
  if (!root) {
    return {};
  }
  const childCounts = /* @__PURE__ */ new Map();
  for (const child of Array.from(root.children)) {
    const name = child.tagName || child.localName || "";
    if (!name) {
      continue;
    }
    childCounts.set(name, (childCounts.get(name) ?? 0) + 1);
  }
  const result = {};
  for (const [name, count] of childCounts.entries()) {
    result[name] = { count };
  }
  return { [root.tagName || "root"]: result };
}
function describeJsonShape(value) {
  if (value === null) {
    return { type: "null", size: 0, depth: 0 };
  }
  if (Array.isArray(value)) {
    const depths = value.map((entry) => describeJsonShape(entry).depth);
    return { type: "array", size: value.length, depth: 1 + (depths.length ? Math.max(...depths) : 0) };
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    const depths = entries.map(([, v]) => describeJsonShape(v).depth);
    return { type: "object", size: entries.length, depth: 1 + (depths.length ? Math.max(...depths) : 0) };
  }
  return { type: typeof value, size: 0, depth: 0 };
}
function describeTopLevelSchema(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    const shape = describeJsonShape(value);
    return [`(root) ${shape.type}${shape.size ? ` (${shape.size})` : ""}`];
  }
  const entries = Object.entries(value);
  return entries.slice(0, 20).map(([key, child]) => {
    const shape = describeJsonShape(child);
    const sizeHint = shape.type === "array" ? ` (${shape.size} items)` : shape.type === "object" ? ` (${shape.size} keys)` : "";
    return `${key}: ${shape.type}${sizeHint}`;
  });
}
async function parseStructuredPayload(bytes, format) {
  const text = decodeTextBytes(bytes);
  if (format === "json") {
    const cleaned = text.replace(/^\uFEFF/, "");
    return { format, value: JSON.parse(cleaned) };
  }
  if (format === "yaml") {
    const yamlModule = await import("yaml");
    return { format, value: yamlModule.parse(text) };
  }
  if (format === "toml") {
    const tomlModule = await import("smol-toml");
    return { format, value: tomlModule.parse(text) };
  }
  if (format === "xml") {
    return { format, value: parseXmlToSchema(text) };
  }
  if (format === "ini") {
    try {
      const tomlModule = await import("smol-toml");
      return { format, value: tomlModule.parse(text) };
    } catch {
      return { format, value: parsePropertiesFile(text) };
    }
  }
  if (format === "env") {
    return { format, value: parseEnvFile(text) };
  }
  return { format, value: parsePropertiesFile(text) };
}
async function extractStructuredData(input) {
  const format = inferStructuredFormat(input.mimeType, input.fileName);
  if (!format) {
    return {
      artifact: {
        ...extractionMetadata("data", input.mimeType, "structured_data"),
        warnings: ["Structured data extraction skipped: format not recognized."]
      }
    };
  }
  try {
    const { value } = await parseStructuredPayload(input.bytes, format);
    const shape = describeJsonShape(value);
    const schemaLines = describeTopLevelSchema(value);
    const previewText = decodeTextBytes(input.bytes);
    const previewLines = previewText.split(/\r?\n/).slice(0, 40);
    const truncated = previewText.split(/\r?\n/).length > previewLines.length;
    const title = input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0;
    const extractedText = [
      title ? `# ${title}` : null,
      `Format: ${format.toUpperCase()}`,
      `Top-level: ${shape.type}`,
      shape.type === "object" || shape.type === "array" ? `Size: ${shape.size}` : null,
      `Nested depth: ${shape.depth}`,
      "",
      "## Schema",
      "",
      ...schemaLines.map((entry) => `- ${entry}`),
      "",
      "## Preview",
      "",
      `\`\`\`${format}`,
      ...previewLines,
      truncated ? "\u2026" : null,
      "```"
    ].filter((item) => item !== null).join("\n").trim();
    return {
      title,
      extractedText,
      artifact: {
        ...extractionMetadata("data", input.mimeType, "structured_data"),
        metadata: {
          format,
          top_level_type: shape.type,
          top_level_size: String(shape.size),
          nested_depth: String(shape.depth)
        }
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("data", input.mimeType, "structured_data"),
        warnings: [`Structured data extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
function formatBibCreator(creator) {
  if (creator.name) {
    return creator.name;
  }
  const parts = [creator.prefix, creator.firstName, creator.lastName, creator.suffix].filter(Boolean);
  return parts.join(" ");
}
function bibFieldString(value) {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => bibFieldString(item)).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    return bibFieldString(value.name ?? "");
  }
  return String(value);
}
async function extractBibTeXText(input) {
  try {
    const bibtex = await import("@retorquere/bibtex-parser");
    const text = decodeTextBytes(input.bytes);
    const library = bibtex.parse(text);
    const entries = Array.isArray(library.entries) ? library.entries : [];
    const citationTypes = /* @__PURE__ */ new Map();
    for (const entry of entries) {
      const type = (entry.type ?? "misc").toLowerCase();
      citationTypes.set(type, (citationTypes.get(type) ?? 0) + 1);
    }
    const entrySections = [];
    for (const entry of entries.slice(0, 200)) {
      const fields = entry.fields ?? {};
      const title2 = bibFieldString(fields.title);
      const authorList = Array.isArray(fields.author) ? fields.author.map((creator) => formatBibCreator(creator)).filter(Boolean) : bibFieldString(fields.author).split(/\s+and\s+/i).filter(Boolean);
      const editorList = Array.isArray(fields.editor) ? fields.editor.map((creator) => formatBibCreator(creator)).filter(Boolean) : [];
      const year = bibFieldString(fields.year ?? fields.date ?? "");
      const journal = bibFieldString(fields.journal ?? fields.booktitle ?? fields.publisher ?? "");
      const doi = bibFieldString(fields.doi);
      const url = bibFieldString(fields.url);
      const credit = authorList.length ? authorList.join(", ") : editorList.length ? `${editorList.join(", ")} (eds.)` : "Unknown";
      const descriptorParts = [credit];
      if (year) {
        descriptorParts.push(year);
      }
      const descriptor = descriptorParts.join(", ");
      const trailing = [];
      if (journal) {
        trailing.push(journal);
      }
      if (doi) {
        trailing.push(`doi:${doi}`);
      }
      if (url) {
        trailing.push(url);
      }
      const trailingText = trailing.length ? ` \u2014 ${trailing.join(", ")}` : "";
      entrySections.push(`- [${entry.key}] ${title2 || "(untitled)"} (${descriptor})${trailingText}`);
    }
    const totalEntries = entries.length;
    const truncated = entries.length > 200;
    const typeSummary = [...citationTypes.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).map(([type, count]) => `${type} (${count})`).join(", ");
    const title = input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : "BibTeX library";
    const extractedText = [
      `# ${title}`,
      "",
      `BibTeX library with ${totalEntries} entr${totalEntries === 1 ? "y" : "ies"}.`,
      typeSummary ? `Citation types: ${typeSummary}.` : null,
      "",
      "## Entries",
      "",
      ...entrySections,
      truncated ? `
_Preview truncated to the first 200 entries._` : null
    ].filter((item) => item !== null).join("\n").trim();
    const warnings = library.errors?.length ? [`BibTeX parser reported ${library.errors.length} parse error(s).`] : void 0;
    return {
      title,
      extractedText,
      artifact: {
        ...extractionMetadata("bibtex", input.mimeType, "bibtex_text"),
        metadata: {
          entry_count: String(totalEntries),
          citation_types: [...citationTypes.keys()].sort().join(",")
        },
        warnings
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("bibtex", input.mimeType, "bibtex_text"),
        warnings: [`BibTeX extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
async function extractRtfText(input) {
  try {
    const rtfParser = await import("rtf-parser");
    const parseString = rtfParser.string ?? rtfParser.default?.string;
    if (typeof parseString !== "function") {
      throw new Error("rtf-parser did not expose a string parser.");
    }
    const rtfText = decodeTextBytes(input.bytes);
    const document = await new Promise((resolve, reject) => {
      parseString(rtfText, (err, doc) => {
        if (err || !doc) {
          reject(err ?? new Error("RTF parse returned no document"));
          return;
        }
        resolve(doc);
      });
    });
    const paragraphs = [];
    for (const paragraph of document.content ?? []) {
      const spans = paragraph.content ?? [];
      const text = normalizeWhitespace(spans.map((span) => span.value ?? "").join(""));
      if (text) {
        paragraphs.push(text);
      }
    }
    const title = input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0;
    const extractedText = [title ? `# ${title}` : null, "", ...paragraphs].filter((item) => item !== null).join("\n\n").trim();
    return {
      title,
      extractedText: extractedText || void 0,
      artifact: {
        ...extractionMetadata("rtf", input.mimeType, "rtf_text"),
        metadata: {
          paragraph_count: String(paragraphs.length)
        }
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("rtf", input.mimeType, "rtf_text"),
        warnings: [`RTF extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
function collectOrgNodeText(node) {
  if (typeof node.value === "string") {
    return node.value;
  }
  if (!Array.isArray(node.children)) {
    return "";
  }
  return node.children.map((child) => collectOrgNodeText(child)).join("");
}
function renderOrgNode(node, lines) {
  if (node.type === "headline") {
    const depth = Math.min(Math.max(node.level ?? 1, 1), 6);
    const keyword = node.keyword ? `${node.keyword} ` : "";
    const tags = node.tags?.length ? `  \`${node.tags.join(":")}\`` : "";
    const text = normalizeWhitespace(collectOrgNodeText(node));
    lines.push("");
    lines.push(`${"#".repeat(depth)} ${keyword}${text}${tags}`.trim());
    lines.push("");
    return;
  }
  if (node.type === "paragraph") {
    const text = normalizeWhitespace(collectOrgNodeText(node));
    if (text) {
      lines.push(text);
      lines.push("");
    }
    return;
  }
  if (node.type === "list") {
    for (const child of node.children ?? []) {
      if (child.type === "list.item") {
        const text = normalizeWhitespace(collectOrgNodeText(child));
        if (text) {
          lines.push(`- ${text}`);
        }
      }
    }
    lines.push("");
    return;
  }
  if (node.type === "block") {
    const name = node.name ?? "";
    const body = typeof node.value === "string" ? node.value.trimEnd() : "";
    if (body) {
      lines.push(`\`\`\`${name === "src" ? "" : name.toLowerCase()}`);
      lines.push(body);
      lines.push("```");
      lines.push("");
    }
    return;
  }
  for (const child of node.children ?? []) {
    renderOrgNode(child, lines);
  }
}
async function extractOrgText(input) {
  try {
    const orga = await import("orga");
    const text = decodeTextBytes(input.bytes);
    const document = orga.parse(text);
    const properties = document.properties ?? {};
    const documentTitle = Array.isArray(properties.title) ? properties.title.join(" ") : typeof properties.title === "string" ? properties.title : "";
    let headlineCount = 0;
    let todoCount = 0;
    const walk = (node) => {
      if (node.type === "headline") {
        headlineCount += 1;
        if (node.keyword) {
          todoCount += 1;
        }
      }
      for (const child of node.children ?? []) {
        walk(child);
      }
    };
    walk(document);
    const bodyLines = [];
    for (const child of document.children ?? []) {
      renderOrgNode(child, bodyLines);
    }
    const title = documentTitle.trim() || (input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0);
    const extractedText = [title ? `# ${title}` : null, "", ...bodyLines].filter((item) => item !== null).join("\n").trim();
    return {
      title,
      extractedText: extractedText || void 0,
      artifact: {
        ...extractionMetadata("org", input.mimeType, "org_text"),
        metadata: {
          headline_count: String(headlineCount),
          todo_count: String(todoCount)
        }
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("org", input.mimeType, "org_text"),
        warnings: [`Org extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
async function extractAsciiDocText(input) {
  try {
    const asciidoctorModule = await import("@asciidoctor/core");
    const factory = asciidoctorModule.default ?? asciidoctorModule;
    const processor = factory();
    const source = decodeTextBytes(input.bytes);
    const loaded = processor.load(source, { safe: "safe" });
    const html = processor.convert(source, { safe: "safe", standalone: false });
    const markdown = htmlToMarkdown(html);
    const docTitle = (typeof loaded.getTitle === "function" ? loaded.getTitle() : void 0) ?? void 0;
    const fileTitle = input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0;
    const title = docTitle?.trim() || fileTitle;
    const extractedText = [title ? `# ${title}` : null, "", markdown].filter((item) => item !== null).join("\n").trim();
    return {
      title,
      extractedText: extractedText || void 0,
      artifact: {
        ...extractionMetadata("asciidoc", input.mimeType, "asciidoc_text"),
        metadata: {
          html_size: String(html.length),
          markdown_size: String(markdown.length)
        }
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("asciidoc", input.mimeType, "asciidoc_text"),
        warnings: [`AsciiDoc extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
async function extractTranscriptText(input) {
  try {
    const { parseSync } = await import("subtitle");
    const rawText = decodeTextBytes(input.bytes);
    const cues = parseSync(rawText).filter((node) => node.type === "cue" && node.data).map((node) => ({
      start: Math.max(0, node.data?.start ?? 0),
      end: Math.max(0, node.data?.end ?? 0),
      text: normalizeWhitespace((node.data?.text ?? "").replace(/\s*\n+\s*/g, " "))
    })).filter((cue) => cue.text);
    const title = input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : void 0;
    const extractedText = [
      title ? `# ${title}` : null,
      `Format: ${input.fileName?.toLowerCase().endsWith(".vtt") ? "WebVTT" : "SRT"}`,
      `Segments: ${cues.length}`,
      ...cues.length ? [`Start: ${timestampFromMs(cues[0].start)}`, `End: ${timestampFromMs(cues[cues.length - 1].end)}`] : [],
      "",
      "## Transcript",
      "",
      ...cues.length ? cues.map((cue) => `- [${timestampFromMs(cue.start)} - ${timestampFromMs(cue.end)}] ${cue.text}`) : ["- No transcript segments were extracted."],
      ""
    ].filter((item) => Boolean(item)).join("\n");
    return {
      title,
      extractedText,
      artifact: {
        ...extractionMetadata("transcript", input.mimeType, "transcript_text"),
        metadata: {
          format: input.fileName?.toLowerCase().endsWith(".vtt") ? "vtt" : "srt",
          segment_count: String(cues.length),
          ...cues.length ? { started_at: timestampFromMs(cues[0].start), ended_at: timestampFromMs(cues[cues.length - 1].end) } : {}
        }
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("transcript", input.mimeType, "transcript_text"),
        warnings: [`Transcript extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
async function extractEmailText(input) {
  try {
    const { simpleParser } = await import("mailparser");
    const fallbackTitle = input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : "Email";
    const parsed = await simpleParser(input.bytes);
    const normalized = normalizeParsedEmail(parsed, fallbackTitle);
    return {
      title: normalized.title,
      extractedText: normalized.markdown,
      artifact: {
        ...extractionMetadata("email", input.mimeType, "email_text"),
        metadata: normalized.metadata
      }
    };
  } catch (error) {
    return {
      artifact: {
        ...extractionMetadata("email", input.mimeType, "email_text"),
        warnings: [`Email extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
      }
    };
  }
}
async function extractMboxMessages(input) {
  try {
    const title = input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : "Mailbox";
    const { simpleParser } = await import("mailparser");
    const messages = await loadZipMessageBuffers(input.bytes);
    const extracted = [];
    for (let index = 0; index < messages.length; index += 1) {
      const parsed = await simpleParser(messages[index]);
      const normalized = normalizeParsedEmail(parsed, `Message ${index + 1}`);
      const conversationId = normalized.conversationId || `${index + 1}`;
      extracted.push({
        partKey: `${conversationId}-${index + 1}`,
        title: normalized.title,
        markdown: normalized.markdown,
        metadata: {
          ...normalized.metadata,
          container_title: title,
          mailbox_title: title,
          part_index: String(index + 1),
          part_count: String(messages.length)
        }
      });
    }
    return {
      title,
      messages: extracted,
      warnings: extracted.length ? void 0 : ["Mailbox extraction completed but found no readable messages."]
    };
  } catch (error) {
    return {
      messages: [],
      warnings: [`Mailbox extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
    };
  }
}
async function extractCalendarEvents(input) {
  try {
    const ical = await import("node-ical");
    const calendarTitle = input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : "Calendar";
    const parsed = ical.default.sync.parseICS(decodeTextBytes(input.bytes));
    const events = [];
    for (const item of Object.values(parsed)) {
      if (!item || typeof item !== "object" || item.type !== "VEVENT") {
        continue;
      }
      const event = item;
      const title = normalizeWhitespace(event.summary ?? "") || "Calendar Event";
      const occurredAt = normalizeIsoDate(event.start);
      const endsAt = normalizeIsoDate(event.end);
      const organizer = event.organizer ? normalizeWhitespace(String(event.organizer.params?.CN ?? event.organizer.val ?? "")) : void 0;
      const attendees = calendarAttendees(event.attendees);
      const participants = normalizeDelimitedList([organizer ?? "", ...attendees]);
      const location = normalizeWhitespace(event.location ?? "") || void 0;
      const description = normalizeDocumentText(event.description ?? "");
      const conversationId = normalizeWhitespace(event.uid ?? "") || `${title}-${occurredAt ?? events.length + 1}`;
      events.push({
        partKey: conversationId,
        title,
        metadata: {
          container_title: calendarTitle,
          ...occurredAt ? { occurred_at: occurredAt } : {},
          ...endsAt ? { ends_at: endsAt } : {},
          ...organizer ? { organizer } : {},
          ...location ? { location } : {},
          ...participants ? { participants } : {},
          conversation_id: conversationId
        },
        markdown: [
          `# ${title}`,
          "",
          ...occurredAt ? [`Start: ${occurredAt}`] : [],
          ...endsAt ? [`End: ${endsAt}`] : [],
          ...organizer ? [`Organizer: ${organizer}`] : [],
          ...attendees.length ? [`Attendees: ${attendees.join(", ")}`] : [],
          ...location ? [`Location: ${location}`] : [],
          ...conversationId ? [`Event ID: ${conversationId}`] : [],
          "",
          "## Description",
          "",
          description || "No event description was provided.",
          ""
        ].join("\n")
      });
    }
    return {
      title: calendarTitle,
      events,
      warnings: events.length ? void 0 : ["Calendar extraction completed but found no VEVENT entries."]
    };
  } catch (error) {
    return {
      events: [],
      warnings: [`Calendar extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
    };
  }
}
function parseSlackExportEntries(entries, exportTitle) {
  const usersById = /* @__PURE__ */ new Map();
  const rawUsers = entries.get("users.json");
  if (rawUsers) {
    const parsed = JSON.parse(rawUsers);
    for (const user of parsed) {
      const id = normalizeWhitespace(user.id ?? "");
      const name = normalizeWhitespace(user.profile?.display_name ?? user.real_name ?? user.profile?.real_name ?? user.name ?? "");
      if (id && name) {
        usersById.set(id, name);
      }
    }
  }
  const channelIndex = /* @__PURE__ */ new Map();
  for (const indexPath of ["channels.json", "groups.json", "dms.json", "mpims.json"]) {
    const rawIndex = entries.get(indexPath);
    if (!rawIndex) {
      continue;
    }
    const parsed = JSON.parse(rawIndex);
    for (const [key, value] of slackEntriesFromChannelIndex(parsed, usersById)) {
      channelIndex.set(key, value);
    }
  }
  const conversationPaths = [...entries.keys()].filter((entryPath) => /^[^/]+\/\d{4}-\d{2}-\d{2}\.json$/i.test(entryPath)).sort((left, right) => left.localeCompare(right));
  const conversations = [];
  for (const entryPath of conversationPaths) {
    const raw = entries.get(entryPath);
    if (!raw) {
      continue;
    }
    const messages = JSON.parse(raw);
    if (!Array.isArray(messages)) {
      continue;
    }
    const [channelName, dateFile] = entryPath.split("/");
    const date = dateFile?.replace(/\.json$/i, "") ?? "";
    const channel = channelIndex.get(channelName ?? "") ?? {
      id: channelName ?? "",
      title: channelName ?? "channel",
      members: []
    };
    const participants = new Set(channel.members);
    const lines = [];
    const threadIds = /* @__PURE__ */ new Set();
    const sortedMessages = [...messages].sort((left, right) => Number(left.ts ?? 0) - Number(right.ts ?? 0));
    let occurredAt;
    for (const message of sortedMessages) {
      const speaker = normalizeWhitespace(
        message.username ?? message.bot_profile?.name ?? (message.user ? slackFormatSpeakerId(message.user, usersById) : "")
      ) || "unknown";
      participants.add(speaker);
      const messageTime = slackMessageTimestamp(message.ts, date);
      occurredAt ??= messageTime;
      const normalizedText = slackNormalizeText(
        [
          message.text ?? "",
          ...Array.isArray(message.files) ? message.files.map((file) => normalizeWhitespace(file.title ?? file.name ?? "")).filter(Boolean).map((label) => `Attachment: ${label}`) : []
        ].join("\n"),
        usersById
      );
      if (message.thread_ts && message.thread_ts !== message.ts) {
        threadIds.add(message.thread_ts);
      }
      lines.push(
        `- [${messageTime}] ${speaker}${message.thread_ts ? ` {thread:${message.thread_ts}}` : ""}${message.ts ? ` {id:${message.ts}}` : ""}: ${normalizedText || normalizeWhitespace(message.subtype ?? "") || "[no text]"}`
      );
    }
    const participantsList = normalizeDelimitedList([...participants]);
    const conversationId = `${channel.id || channel.title}:${date}`;
    conversations.push({
      partKey: `${channel.title}-${date}`,
      title: `#${channel.title} - ${date}`,
      metadata: {
        workspace_title: exportTitle,
        channel: channel.title,
        ...channel.id ? { channel_id: channel.id } : {},
        ...occurredAt ? { occurred_at: occurredAt } : {},
        ...participantsList ? { participants: participantsList } : {},
        container_title: `${exportTitle} / #${channel.title}`,
        conversation_id: conversationId,
        date,
        message_count: String(sortedMessages.length),
        thread_count: String(threadIds.size)
      },
      markdown: [
        `# #${channel.title} - ${date}`,
        "",
        `Workspace: ${exportTitle}`,
        `Messages: ${sortedMessages.length}`,
        `Threads: ${threadIds.size}`,
        ...participantsList ? [`Participants: ${participantsList}`] : [],
        "",
        "## Messages",
        "",
        ...lines.length ? lines : ["- No messages were extracted."],
        ""
      ].join("\n")
    });
  }
  return {
    title: exportTitle,
    conversations,
    warnings: conversations.length ? void 0 : ["Slack export parsing completed but found no channel day files."]
  };
}
function isSlackExportArchive(bytes) {
  try {
    const archive = unzipSync(new Uint8Array(bytes));
    return looksLikeSlackEntries(Object.keys(archive));
  } catch {
    return false;
  }
}
async function isSlackExportDirectory(directoryPath) {
  const entries = await fs5.readdir(directoryPath).catch(() => []);
  if (!entries.length) {
    return false;
  }
  const fileSet = new Set(entries);
  const hasIndex = ["channels.json", "groups.json", "dms.json", "mpims.json"].some((name) => fileSet.has(name));
  if (!hasIndex) {
    return false;
  }
  for (const entry of entries) {
    const channelDir = path5.join(directoryPath, entry);
    const stat = await fs5.stat(channelDir).catch(() => null);
    if (!stat?.isDirectory()) {
      continue;
    }
    const channelEntries = await fs5.readdir(channelDir).catch(() => []);
    if (channelEntries.some((name) => /^\d{4}-\d{2}-\d{2}\.json$/i.test(name))) {
      return true;
    }
  }
  return false;
}
async function extractSlackExportArchive(input) {
  try {
    const archive = unzipSync(new Uint8Array(input.bytes));
    const title = input.fileName ? path5.basename(input.fileName, path5.extname(input.fileName)) : "Slack Export";
    return parseSlackExportEntries(archiveEntriesAsText(archive), title);
  } catch (error) {
    return {
      conversations: [],
      warnings: [`Slack export extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
    };
  }
}
async function extractSlackExportDirectory(directoryPath) {
  const title = path5.basename(directoryPath) || "Slack Export";
  try {
    const entries = /* @__PURE__ */ new Map();
    const queue = [directoryPath];
    while (queue.length > 0) {
      const current = queue.shift();
      const children = await fs5.readdir(current, { withFileTypes: true });
      for (const child of children) {
        const absoluteChild = path5.join(current, child.name);
        if (child.isDirectory()) {
          queue.push(absoluteChild);
          continue;
        }
        const relativeChild = path5.posix.relative(directoryPath, absoluteChild.split(path5.sep).join(path5.posix.sep));
        entries.set(relativeChild, await fs5.readFile(absoluteChild, "utf8"));
      }
    }
    return parseSlackExportEntries(entries, title);
  } catch (error) {
    return {
      conversations: [],
      warnings: [`Slack export extraction failed: ${error instanceof Error ? truncate(error.message, 240) : "unknown error"}`]
    };
  }
}

// src/redaction.ts
var DEFAULT_PLACEHOLDER = "[REDACTED]";
var DEFAULT_REDACTION_PATTERNS = [
  {
    id: "aws_access_key_id",
    pattern: /AKIA[0-9A-Z]{16}/g,
    description: "AWS Access Key ID"
  },
  {
    id: "aws_secret_access_key",
    // The secret itself (40 base64-ish characters) following the canonical
    // "aws_secret_access_key" label used in shared credentials files and env
    // declarations. We keep the label visible and only scrub the value.
    pattern: /(aws_secret_access_key["'\s:=]+)[A-Za-z0-9/+=]{40}/gi,
    description: "AWS Secret Access Key"
  },
  {
    id: "stripe_live_key",
    pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
    description: "Stripe live secret key"
  },
  {
    id: "github_personal_access_token",
    pattern: /ghp_[A-Za-z0-9]{36}/g,
    description: "GitHub personal access token (classic)"
  },
  {
    id: "github_fine_grained_token",
    pattern: /github_pat_[A-Za-z0-9_]{82}/g,
    description: "GitHub fine-grained personal access token"
  },
  {
    id: "jwt",
    pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    description: "JSON Web Token"
  },
  {
    id: "authorization_bearer",
    // `Authorization: Bearer <token>` headers are a high-recall sink for
    // arbitrary credentials that don't match a specific format.
    pattern: /(Authorization:\s*Bearer\s+)[A-Za-z0-9._~+/=-]+/gi,
    description: "Authorization Bearer header token"
  },
  {
    id: "openai_api_key",
    pattern: /sk-[A-Za-z0-9]{32,}/g,
    description: "OpenAI-style API key"
  },
  {
    id: "private_key_block",
    // Catch the PEM headers for RSA, EC, OpenSSH, DSA, and generic private
    // keys. The body is usually very large; we redact the whole block from
    // the BEGIN header through the matching END marker.
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/g,
    description: "PEM private key block"
  }
];
function ensureGlobalRegExp(pattern) {
  if (pattern.flags.includes("g")) {
    return pattern;
  }
  return new RegExp(pattern.source, `${pattern.flags}g`);
}
function buildRedactor(patterns, defaultPlaceholder = DEFAULT_PLACEHOLDER) {
  const compiled = patterns.map((entry) => {
    const regex = entry.pattern instanceof RegExp ? ensureGlobalRegExp(entry.pattern) : null;
    return {
      id: entry.id,
      regex,
      raw: entry.pattern,
      placeholder: entry.placeholder ?? defaultPlaceholder
    };
  });
  return {
    redact(text) {
      if (!text || !compiled.length) {
        return { text, matches: [] };
      }
      let current = text;
      const matches = [];
      for (const entry of compiled) {
        const regex = entry.regex;
        if (!regex) {
          continue;
        }
        let count = 0;
        current = current.replace(regex, (...args) => {
          count += 1;
          const prefix = typeof args[1] === "string" ? args[1] : void 0;
          if (prefix) {
            return `${prefix}${entry.placeholder}`;
          }
          return entry.placeholder;
        });
        if (count > 0) {
          matches.push({ patternId: entry.id, count });
        }
      }
      return { text: current, matches };
    }
  };
}
function resolveRedactionPatterns(config) {
  const enabled = config?.enabled ?? true;
  const placeholder = config?.placeholder ?? DEFAULT_PLACEHOLDER;
  const useDefaults = config?.useDefaults ?? true;
  if (!enabled) {
    return { enabled: false, placeholder, patterns: [] };
  }
  const patterns = [];
  if (useDefaults) {
    patterns.push(...DEFAULT_REDACTION_PATTERNS);
  }
  for (const entry of config?.patterns ?? []) {
    const flags = entry.flags ?? "g";
    let regex;
    try {
      regex = new RegExp(entry.pattern, flags);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid redaction pattern \`${entry.id}\`: ${reason}`);
    }
    patterns.push({
      id: entry.id,
      pattern: regex,
      placeholder: entry.placeholder,
      description: entry.description
    });
  }
  return { enabled, placeholder, patterns };
}
function buildConfiguredRedactor(config) {
  const resolved = resolveRedactionPatterns(config);
  if (!resolved.enabled || !resolved.patterns.length) {
    return null;
  }
  return buildRedactor(resolved.patterns, resolved.placeholder);
}

// src/source-classification.ts
import path6 from "path";
var ALL_SOURCE_CLASSES = ["first_party", "third_party", "resource", "generated"];
var THIRD_PARTY_SEGMENTS = /* @__PURE__ */ new Set(["node_modules", "vendor", "Pods"]);
var GENERATED_SEGMENTS = /* @__PURE__ */ new Set(["dist", "build", ".next", "coverage", "DerivedData", "target"]);
function matchesAnyGlob(relativePath, patterns) {
  return patterns.some(
    (pattern) => path6.matchesGlob(relativePath, pattern) || path6.matchesGlob(path6.posix.basename(relativePath), pattern)
  );
}
function classifyRepoPath(relativePath, repoAnalysis) {
  const normalized = relativePath.replace(/\\/g, "/");
  const custom = repoAnalysis?.classifyGlobs;
  if (custom?.first_party?.length && matchesAnyGlob(normalized, custom.first_party)) {
    return "first_party";
  }
  for (const sourceClass of ["third_party", "resource", "generated"]) {
    const patterns = custom?.[sourceClass];
    if (patterns?.length && matchesAnyGlob(normalized, patterns)) {
      return sourceClass;
    }
  }
  const segments = normalized.split("/").filter(Boolean);
  if (segments.some((segment) => THIRD_PARTY_SEGMENTS.has(segment))) {
    return "third_party";
  }
  if (segments.some((segment) => GENERATED_SEGMENTS.has(segment))) {
    return "generated";
  }
  if (segments.some((segment) => segment.endsWith(".xcassets") || segment.endsWith(".imageset"))) {
    return "resource";
  }
  return "first_party";
}
function normalizeExtractClasses(repoAnalysis, extra = []) {
  const configured = repoAnalysis?.extractClasses?.length ? repoAnalysis.extractClasses : ["first_party"];
  return ALL_SOURCE_CLASSES.filter((sourceClass) => (/* @__PURE__ */ new Set([...configured, ...extra])).has(sourceClass));
}
function aggregateSourceClass(values) {
  const available = ALL_SOURCE_CLASSES.filter((sourceClass) => values.includes(sourceClass));
  if (!available.length) {
    return void 0;
  }
  if (available.includes("first_party")) {
    return "first_party";
  }
  if (available.includes("resource")) {
    return "resource";
  }
  if (available.includes("third_party")) {
    return "third_party";
  }
  return "generated";
}
function aggregateManifestSourceClass(manifests, sourceIds) {
  const byId = new Map(manifests.map((manifest) => [manifest.sourceId, manifest.sourceClass]));
  return aggregateSourceClass(sourceIds.map((sourceId) => byId.get(sourceId)));
}

// src/source-registry.ts
import fs6 from "fs/promises";
import path7 from "path";
var MANAGED_SOURCES_VERSION = 1;
function repoRootFromManifest(manifest) {
  if (manifest.originType !== "file" || !manifest.originalPath || !manifest.repoRelativePath) {
    return null;
  }
  const repoDir = path7.posix.dirname(manifest.repoRelativePath);
  const fileDir = path7.dirname(path7.resolve(manifest.originalPath));
  if (repoDir === "." || !repoDir) {
    return fileDir;
  }
  const segments = repoDir.split("/").filter(Boolean);
  return path7.resolve(fileDir, ...segments.map(() => ".."));
}
async function loadManifestArtifacts(paths) {
  const entries = await fs6.readdir(paths.manifestsDir, { withFileTypes: true }).catch(() => []);
  const manifests = await Promise.all(
    entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map(async (entry) => await readJsonFile(path7.join(paths.manifestsDir, entry.name)))
  );
  return manifests.filter((manifest) => Boolean(manifest?.sourceId));
}
function buildLegacyDirectoryEntry(repoRoot, manifests) {
  const repoTitle = path7.basename(repoRoot) || repoRoot;
  const sourceIds = manifests.map((manifest) => manifest.sourceId).sort((left, right) => left.localeCompare(right));
  const createdAt = manifests.map((manifest) => manifest.createdAt).sort((left, right) => left.localeCompare(right))[0] ?? (/* @__PURE__ */ new Date()).toISOString();
  const updatedAt = manifests.map((manifest) => manifest.updatedAt).sort((left, right) => right.localeCompare(left))[0] ?? createdAt;
  return {
    id: `directory-${slugify(repoTitle)}-${sha256(repoRoot).slice(0, 8)}`,
    kind: "directory",
    title: repoTitle,
    path: repoRoot,
    repoRoot,
    createdAt,
    updatedAt,
    status: "ready",
    sourceIds,
    lastSyncAt: updatedAt,
    lastSyncStatus: "success",
    lastSyncCounts: {
      scannedCount: manifests.length,
      importedCount: manifests.length,
      updatedCount: 0,
      removedCount: 0,
      skippedCount: 0
    }
  };
}
async function buildLegacyArtifact(paths) {
  const manifests = await loadManifestArtifacts(paths);
  const manifestsByRepoRoot = /* @__PURE__ */ new Map();
  for (const manifest of manifests) {
    const repoRoot = repoRootFromManifest(manifest);
    if (!repoRoot) {
      continue;
    }
    const key = path7.resolve(repoRoot);
    const bucket = manifestsByRepoRoot.get(key) ?? [];
    bucket.push(manifest);
    manifestsByRepoRoot.set(key, bucket);
  }
  const repoRoots = [...manifestsByRepoRoot.entries()].filter(([, repoManifests]) => {
    return repoManifests.length > 1 || repoManifests.some((manifest) => manifest.sourceKind === "code");
  });
  return {
    version: MANAGED_SOURCES_VERSION,
    sources: repoRoots.sort((left, right) => left[0].localeCompare(right[0])).map(([repoRoot, repoManifests]) => buildLegacyDirectoryEntry(repoRoot, repoManifests))
  };
}
async function ensureManagedSourcesArtifact(rootDir) {
  const { paths } = await initWorkspace(rootDir);
  if (await fileExists(paths.managedSourcesPath)) {
    const existing = await readJsonFile(paths.managedSourcesPath);
    if (existing?.version === MANAGED_SOURCES_VERSION && Array.isArray(existing.sources)) {
      return {
        version: MANAGED_SOURCES_VERSION,
        sources: [...existing.sources].sort(
          (left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)
        )
      };
    }
  }
  const artifact = await buildLegacyArtifact(paths);
  await writeJsonFile(paths.managedSourcesPath, artifact);
  return artifact;
}
async function loadManagedSources(rootDir) {
  const artifact = await ensureManagedSourcesArtifact(rootDir);
  return artifact.sources;
}
async function readManagedSourcesIfPresent(rootDir) {
  const { paths } = await initWorkspace(rootDir);
  if (!await fileExists(paths.managedSourcesPath)) {
    return null;
  }
  const existing = await readJsonFile(paths.managedSourcesPath);
  if (!existing?.version || !Array.isArray(existing.sources)) {
    return null;
  }
  return existing.sources;
}
async function saveManagedSources(rootDir, sources) {
  const { paths } = await initWorkspace(rootDir);
  await writeJsonFile(paths.managedSourcesPath, {
    version: MANAGED_SOURCES_VERSION,
    sources: [...sources].sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
  });
}
async function managedSourceWorkingDir(rootDir, sourceId) {
  const { paths } = await initWorkspace(rootDir);
  return path7.join(paths.managedSourcesDir, sourceId);
}

// src/watch-state.ts
import fs7 from "fs/promises";
import path8 from "path";
import matter2 from "gray-matter";
function pendingEntryKey(entry) {
  return entry.path;
}
function sortPending(entries) {
  return [...entries].sort(
    (left, right) => left.path.localeCompare(right.path) || left.detectedAt.localeCompare(right.detectedAt) || left.id.localeCompare(right.id)
  );
}
function normalizeRelativePath(rootDir, filePath) {
  if (!filePath) {
    return void 0;
  }
  return toPosix(path8.relative(rootDir, path8.resolve(filePath)));
}
async function readPendingSemanticRefresh(rootDir) {
  const { paths } = await initWorkspace(rootDir);
  const entries = await readJsonFile(paths.pendingSemanticRefreshPath);
  return Array.isArray(entries) ? sortPending(entries) : [];
}
async function writePendingSemanticRefresh(rootDir, entries) {
  const { paths } = await initWorkspace(rootDir);
  await ensureDir(paths.watchDir);
  const normalized = sortPending(entries);
  await writeJsonFile(paths.pendingSemanticRefreshPath, normalized);
  return normalized;
}
async function mergePendingSemanticRefresh(rootDir, entries) {
  const existing = await readPendingSemanticRefresh(rootDir);
  const merged = new Map(existing.map((entry) => [pendingEntryKey(entry), entry]));
  for (const entry of entries) {
    merged.set(pendingEntryKey(entry), entry);
  }
  return writePendingSemanticRefresh(rootDir, [...merged.values()]);
}
async function clearPendingSemanticRefreshEntries(rootDir, targets) {
  const existing = await readPendingSemanticRefresh(rootDir);
  const relativePath = targets.relativePath ?? normalizeRelativePath(rootDir, targets.originalPath);
  return writePendingSemanticRefresh(
    rootDir,
    existing.filter((entry) => {
      if (targets.sourceId && entry.sourceId === targets.sourceId) {
        return false;
      }
      if (relativePath && entry.path === relativePath) {
        return false;
      }
      return true;
    })
  );
}
async function readWatchStatusArtifact(rootDir) {
  const { paths } = await initWorkspace(rootDir);
  return readJsonFile(paths.watchStatusPath);
}
async function writeWatchStatusArtifact(rootDir, status) {
  const { paths } = await initWorkspace(rootDir);
  await ensureDir(paths.watchDir);
  await writeJsonFile(paths.watchStatusPath, status);
}
async function markPagesStaleForSources(rootDir, sourceIds) {
  const uniqueSourceIds = [...new Set(sourceIds.filter(Boolean))];
  if (!uniqueSourceIds.length) {
    return [];
  }
  const { paths } = await initWorkspace(rootDir);
  const graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    return [];
  }
  const affectedSourceIds = new Set(uniqueSourceIds);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let graphChanged = false;
  const affectedPagePaths = [];
  const nextPages = graph.pages.map((page) => {
    if (page.freshness === "stale" || !page.sourceIds.some((sourceId) => affectedSourceIds.has(sourceId))) {
      return page;
    }
    graphChanged = true;
    affectedPagePaths.push(page.path);
    return {
      ...page,
      freshness: "stale",
      updatedAt: now
    };
  });
  const nextNodes = graph.nodes.map((node) => {
    if (node.freshness === "stale" || !node.sourceIds.some((sourceId) => affectedSourceIds.has(sourceId))) {
      return node;
    }
    graphChanged = true;
    return {
      ...node,
      freshness: "stale"
    };
  });
  if (graphChanged) {
    await writeJsonFile(paths.graphPath, {
      ...graph,
      nodes: nextNodes,
      pages: nextPages
    });
  }
  for (const page of nextPages) {
    if (page.freshness !== "stale" || !page.sourceIds.some((sourceId) => affectedSourceIds.has(sourceId))) {
      continue;
    }
    const absolutePath = path8.join(paths.wikiDir, page.path);
    if (!await fileExists(absolutePath)) {
      continue;
    }
    const raw = await fs7.readFile(absolutePath, "utf8");
    const parsed = matter2(raw);
    if (parsed.data.freshness === "stale") {
      continue;
    }
    parsed.data.freshness = "stale";
    parsed.data.updated_at = now;
    await writeFileIfChanged(absolutePath, matter2.stringify(parsed.content, parsed.data));
  }
  return affectedPagePaths;
}

// src/ingest.ts
var DEFAULT_MAX_ASSET_SIZE = 10 * 1024 * 1024;
var DEFAULT_MAX_DIRECTORY_FILES = 5e3;
var HARD_REPO_IGNORES = /* @__PURE__ */ new Set([".git", ".venv"]);
var SWARMVAULT_IGNORE_FILENAME = ".swarmvaultignore";
var VCS_BOUNDARY_DIRS = /* @__PURE__ */ new Set([".git", ".hg", ".svn"]);
var PROGRESS_FILE_THRESHOLD = 150;
var PROGRESS_UPDATE_INTERVAL = 100;
var RST_HEADING_MARKERS = /* @__PURE__ */ new Set(["=", "-", "~", "^", '"', "#", "*", "+"]);
var MARKDOWN_SEMANTIC_FRONTMATTER_KEYS = [
  "title",
  "summary",
  "description",
  "aliases",
  "tags",
  "authors",
  "published_at",
  "canonical_url",
  "source_type"
];
function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}
function ingestRunStatePath(stateDir, runId) {
  return path9.join(stateDir, "ingest-runs", `${runId}.json`);
}
function buildIngestRunId() {
  return `ingest-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
}
async function loadIngestRunState(stateDir, runId) {
  if (!runId) return null;
  const absolute = ingestRunStatePath(stateDir, runId);
  if (!await fileExists(absolute)) {
    throw new Error(`Ingest run state not found: ${runId}`);
  }
  const loaded = await readJsonFile(absolute);
  if (!loaded) {
    throw new Error(`Ingest run state is empty or unreadable: ${runId}`);
  }
  return loaded;
}
async function saveIngestRunState(stateDir, state) {
  const absolute = ingestRunStatePath(stateDir, state.runId);
  await ensureDir(path9.dirname(absolute));
  await writeJsonFile(absolute, state);
  return absolute;
}
async function clearIngestRunState(stateDir, runId) {
  const absolute = ingestRunStatePath(stateDir, runId);
  try {
    await fs8.rm(absolute, { force: true });
  } catch {
  }
}
function isTextualSourceKindForPayload(sourceKind) {
  return sourceKind === "markdown" || sourceKind === "text" || sourceKind === "code" || sourceKind === "html";
}
function shouldRedactPayload(prepared) {
  return prepared.payloadIsText === true || isTextualSourceKindForPayload(prepared.sourceKind);
}
function inferKind(mimeType, filePath, detectionOptions = {}) {
  if (inferCodeLanguage(filePath, mimeType, detectionOptions)) {
    return "code";
  }
  if (isRstFilePath(filePath)) {
    return "text";
  }
  if (isTranscriptFilePath(filePath) || mimeType === "application/x-subrip" || mimeType === "text/vtt") {
    return "transcript";
  }
  if (mimeType.includes("markdown") || filePath.toLowerCase().endsWith(".mdx")) {
    return "markdown";
  }
  if (mimeType.includes("html")) {
    return "html";
  }
  if (mimeType === "application/pdf" || filePath.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mimeType === "application/vnd.ms-word.document.macroenabled.12" || mimeType === "application/vnd.ms-word.template.macroenabled.12" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.template" || filePath.toLowerCase().endsWith(".docx") || filePath.toLowerCase().endsWith(".docm") || filePath.toLowerCase().endsWith(".dotx") || filePath.toLowerCase().endsWith(".dotm")) {
    return "docx";
  }
  if (isEmailFilePath(filePath) || mimeType === "message/rfc822" || mimeType === "application/mbox") {
    return "email";
  }
  if (isCalendarFilePath(filePath) || mimeType === "text/calendar") {
    return "calendar";
  }
  if (mimeType === "application/epub+zip" || filePath.toLowerCase().endsWith(".epub")) {
    return "epub";
  }
  if (mimeType === "text/csv" || mimeType === "text/tab-separated-values" || filePath.toLowerCase().endsWith(".csv") || filePath.toLowerCase().endsWith(".tsv")) {
    return "csv";
  }
  if (mimeType === "application/x-ipynb+json" || filePath.toLowerCase().endsWith(".ipynb")) {
    return "jupyter";
  }
  if (mimeType === "application/vnd.oasis.opendocument.text" || filePath.toLowerCase().endsWith(".odt")) {
    return "odt";
  }
  if (mimeType === "application/vnd.oasis.opendocument.presentation" || filePath.toLowerCase().endsWith(".odp")) {
    return "odp";
  }
  if (mimeType === "application/vnd.oasis.opendocument.spreadsheet" || filePath.toLowerCase().endsWith(".ods")) {
    return "ods";
  }
  if (filePath.toLowerCase().endsWith(".bib") || mimeType === "application/x-bibtex") {
    return "bibtex";
  }
  if (mimeType === "application/rtf" || mimeType === "text/rtf" || filePath.toLowerCase().endsWith(".rtf")) {
    return "rtf";
  }
  if (filePath.toLowerCase().endsWith(".org") || mimeType === "text/x-org") {
    return "org";
  }
  if (filePath.toLowerCase().endsWith(".adoc") || filePath.toLowerCase().endsWith(".asciidoc") || mimeType === "text/x-asciidoc") {
    return "asciidoc";
  }
  if (isStructuredDataPath(filePath, mimeType)) {
    return "data";
  }
  if (mimeType.startsWith("text/") || isStructuredTextMime(mimeType)) {
    return "text";
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || mimeType === "application/vnd.ms-excel" || mimeType === "application/vnd.ms-excel.sheet.macroenabled.12" || mimeType === "application/vnd.ms-excel.template.macroenabled.12" || mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.template" || filePath.toLowerCase().endsWith(".xlsx") || filePath.toLowerCase().endsWith(".xlsm") || filePath.toLowerCase().endsWith(".xltx") || filePath.toLowerCase().endsWith(".xltm") || filePath.toLowerCase().endsWith(".xls")) {
    return "xlsx";
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || mimeType === "application/vnd.ms-powerpoint.presentation.macroenabled.12" || mimeType === "application/vnd.ms-powerpoint.template.macroenabled.12" || mimeType === "application/vnd.openxmlformats-officedocument.presentationml.template" || filePath.toLowerCase().endsWith(".pptx") || filePath.toLowerCase().endsWith(".pptm") || filePath.toLowerCase().endsWith(".potx") || filePath.toLowerCase().endsWith(".potm")) {
    return "pptx";
  }
  if (mimeType.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|flac|webm|aac|wma)$/i.test(filePath)) {
    return "audio";
  }
  if (mimeType.startsWith("video/") || /\.(mp4|mov|m4v|mkv|avi)$/i.test(filePath)) {
    return "video";
  }
  if (mimeType.startsWith("image/") || isImagePath(filePath)) {
    return "image";
  }
  return "binary";
}
var IMAGE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp",
  ".ico",
  ".tiff",
  ".tif",
  ".heic",
  ".heif",
  ".avif",
  ".jxl",
  ".svg"
]);
function isImagePath(filePath) {
  return IMAGE_EXTENSIONS.has(path9.extname(filePath).toLowerCase());
}
var YOUTUBE_URL_PATTERN = /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/i;
function parseYoutubeVideoId(url) {
  return url.match(YOUTUBE_URL_PATTERN)?.[1];
}
function isStructuredTextMime(mimeType) {
  switch (mimeType) {
    case "application/json":
    case "application/json5":
    case "application/ld+json":
    case "application/manifest+json":
    case "application/xml":
    case "application/toml":
    case "application/yaml":
    case "application/x-yaml":
    case "application/javascript":
    case "application/ecmascript":
    case "application/typescript":
    case "application/x-sh":
    case "application/x-shellscript":
      return true;
    default:
      return false;
  }
}
function isStructuredDataPath(filePath, mimeType) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".yaml") || lower.endsWith(".yml") || lower.endsWith(".toml") || mimeType === "application/toml" || mimeType === "application/yaml" || mimeType === "application/x-yaml") {
    return true;
  }
  if (lower.endsWith(".xml") || lower.endsWith(".ini") || lower.endsWith(".env") || lower.endsWith(".properties") || lower.endsWith(".conf") || lower.endsWith(".cfg") || mimeType === "application/xml" || mimeType === "text/xml") {
    return true;
  }
  if (lower.endsWith(".json") || lower.endsWith(".jsonc") || lower.endsWith(".json5") || mimeType === "application/json" || mimeType === "application/json5") {
    const base = path9.basename(lower);
    if (base === "package.json" || base === "package-lock.json" || base === "tsconfig.json" || base === "pnpm-lock.yaml") {
      return false;
    }
    return true;
  }
  return false;
}
async function localCodeDetectionOptions(absolutePath, payloadBytes) {
  if (path9.extname(absolutePath)) {
    return {};
  }
  try {
    const stat = await fs8.stat(absolutePath);
    const executable = Boolean(stat.mode & 73);
    if (!executable) {
      return { executable: false };
    }
    const bytes = payloadBytes ?? await fs8.readFile(absolutePath);
    return {
      executable,
      content: bytes.subarray(0, 256).toString("utf8")
    };
  } catch {
    return {};
  }
}
function isRstFilePath(filePath) {
  const extension = path9.extname(filePath).toLowerCase();
  return extension === ".rst" || extension === ".rest";
}
function isTranscriptFilePath(filePath) {
  const extension = path9.extname(filePath).toLowerCase();
  return extension === ".srt" || extension === ".vtt";
}
function isEmailFilePath(filePath) {
  const extension = path9.extname(filePath).toLowerCase();
  return extension === ".eml" || extension === ".mbox";
}
function isCalendarFilePath(filePath) {
  return path9.extname(filePath).toLowerCase() === ".ics";
}
function titleFromText(fallback, content, filePath) {
  if (filePath && isRstFilePath(filePath)) {
    const rstTitle = titleFromRst(fallback, content);
    if (rstTitle) {
      return rstTitle;
    }
  }
  return firstMarkdownHeading(content) ?? fallback;
}
function guessMimeType(target) {
  if (isRstFilePath(target)) {
    return "text/x-rst";
  }
  const extension = path9.extname(target).toLowerCase();
  if (extension === ".ts" || extension === ".tsx" || extension === ".mts" || extension === ".cts") {
    return "text/typescript";
  }
  return mime.lookup(target) || "application/octet-stream";
}
function refineBinaryKindWithBytes(absolutePath, currentKind, bytes) {
  if (currentKind !== "binary") {
    return currentKind;
  }
  const sniffSlice = bytes.length > 4096 ? bytes.subarray(0, 4096) : bytes;
  return isText(absolutePath, sniffSlice) ? "text" : currentKind;
}
async function refineBinaryKindWithContentSniff(absolutePath, currentKind) {
  if (currentKind !== "binary") {
    return currentKind;
  }
  let handle;
  try {
    handle = await fs8.open(absolutePath, "r");
    const chunk = Buffer.alloc(4096);
    const { bytesRead } = await handle.read(chunk, 0, chunk.length, 0);
    return refineBinaryKindWithBytes(absolutePath, currentKind, chunk.subarray(0, bytesRead));
  } catch {
    return currentKind;
  } finally {
    await handle?.close().catch(() => void 0);
  }
}
function sourceGroupIdFor(prepared) {
  const originKey = prepared.originType === "url" ? prepared.url ?? prepared.title : prepared.originalPath ?? prepared.title;
  return `${slugify(prepared.title)}-${sha256(originKey).slice(0, 8)}`;
}
function groupedPreparedInputsFor(input) {
  const groupId = sourceGroupIdFor({
    title: input.title,
    originType: input.originType,
    originalPath: input.originalPath,
    url: input.url
  });
  return input.parts.map(
    (part, index) => finalizePreparedInput({
      title: `${input.title} - ${part.title}`,
      originType: input.originType,
      sourceKind: input.sourceKind,
      sourceClass: input.sourceClass,
      originalPath: input.originalPath,
      repoRelativePath: input.repoRelativePath,
      url: input.url,
      mimeType: "text/markdown",
      storedExtension: input.storedExtension,
      payloadBytes: Buffer.from(part.markdown, "utf8"),
      extractedText: part.markdown,
      extractionArtifact: {
        extractor: `${input.sourceKind}_text`,
        sourceKind: input.sourceKind,
        mimeType: input.mimeType,
        producedAt: (/* @__PURE__ */ new Date()).toISOString(),
        metadata: {
          ...part.metadata,
          part_index: String(index + 1),
          part_count: String(input.parts.length)
        },
        warnings: input.warnings
      },
      sourceGroupId: groupId,
      sourceGroupTitle: input.title,
      sourcePartKey: part.partKey,
      partIndex: index + 1,
      partCount: input.parts.length,
      partTitle: part.title,
      details: {
        ...part.metadata,
        part_index: String(index + 1),
        part_count: String(input.parts.length)
      },
      logDetails: input.logDetails
    })
  );
}
function rstAdornmentLine(line) {
  const trimmed = line.trim();
  if (trimmed.length < 3) {
    return void 0;
  }
  const marker = trimmed[0] ?? "";
  if (!RST_HEADING_MARKERS.has(marker) || ![...trimmed].every((char) => char === marker)) {
    return void 0;
  }
  return marker;
}
function rstHeadingLevel(marker) {
  switch (marker) {
    case "=":
      return "#";
    case "-":
      return "##";
    case "~":
      return "###";
    case "^":
      return "####";
    default:
      return "##";
  }
}
function normalizeRstDirective(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith(".. ")) {
    return void 0;
  }
  const directiveMatch = trimmed.match(/^\.\.\s+([A-Za-z][\w-]*)::\s*(.*)$/);
  if (!directiveMatch) {
    return "";
  }
  const label = directiveMatch[1].replace(/-/g, " ").split(/\s+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  const detail = directiveMatch[2]?.trim();
  return detail ? `${label}: ${detail}` : `${label}:`;
}
function normalizeRstExtractedText(content) {
  const lines = content.split(/\r?\n/);
  const normalized = [];
  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index] ?? "";
    const next = lines[index + 1] ?? "";
    const afterNext = lines[index + 2] ?? "";
    const trimmed = current.trim();
    if (!trimmed) {
      normalized.push("");
      continue;
    }
    const currentAdornment = rstAdornmentLine(current);
    const nextAdornment = rstAdornmentLine(next);
    const afterNextAdornment = rstAdornmentLine(afterNext);
    if (currentAdornment && next.trim() && afterNextAdornment && currentAdornment === afterNextAdornment) {
      normalized.push(`${rstHeadingLevel(currentAdornment)} ${next.trim()}`);
      normalized.push("");
      index += 2;
      continue;
    }
    if (nextAdornment && trimmed.length > 0) {
      normalized.push(`${rstHeadingLevel(nextAdornment)} ${trimmed}`);
      normalized.push("");
      index += 1;
      continue;
    }
    const directive = normalizeRstDirective(current);
    if (directive !== void 0) {
      if (directive) {
        normalized.push(directive);
      }
      continue;
    }
    normalized.push(current);
  }
  return normalized.join("\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function titleFromRst(fallback, content) {
  const normalized = normalizeRstExtractedText(content);
  return firstMarkdownHeading(normalized) ?? fallback;
}
function extractedTextForPlainSource(filePath, sourceKind, content) {
  if (sourceKind === "text" && isRstFilePath(filePath)) {
    return normalizeRstExtractedText(content);
  }
  return content;
}
function normalizeSemanticMarkdownScalar(value) {
  if (typeof value !== "string") {
    return void 0;
  }
  const normalized = normalizeWhitespace(value.trim());
  return normalized || void 0;
}
function normalizeSemanticMarkdownList(value) {
  if (!Array.isArray(value)) {
    return void 0;
  }
  const items = uniqueStrings(
    value.flatMap((item) => typeof item === "string" ? [normalizeWhitespace(item.trim())] : []).filter(Boolean)
  );
  return items.length ? items : void 0;
}
function semanticMarkdownTitle(fallback, content, filePath) {
  const parsed = matter3(content);
  const frontmatterTitle = normalizeSemanticMarkdownScalar(parsed.data.title);
  if (frontmatterTitle) {
    return frontmatterTitle;
  }
  return titleFromText(fallback, parsed.content, filePath);
}
function semanticMarkdownContent(content) {
  const parsed = matter3(content);
  const body = parsed.content.replace(/\r\n?/g, "\n").trim();
  const semanticFrontmatter = Object.fromEntries(
    MARKDOWN_SEMANTIC_FRONTMATTER_KEYS.flatMap((key) => {
      const value = key === "aliases" || key === "tags" || key === "authors" ? normalizeSemanticMarkdownList(parsed.data[key]) : normalizeSemanticMarkdownScalar(parsed.data[key]);
      return value === void 0 ? [] : [[key, value]];
    })
  );
  const semanticLines = Object.entries(semanticFrontmatter).map(
    ([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
  );
  const extractedText = [...semanticLines, ...semanticLines.length && body ? [""] : [], body].filter(Boolean).join("\n").trim();
  return {
    extractedText,
    semanticHash: sha256(
      JSON.stringify({
        body,
        frontmatter: semanticFrontmatter
      })
    )
  };
}
function finalizePreparedInput(prepared) {
  if (prepared.sourceKind !== "markdown") {
    return prepared;
  }
  const semantic = semanticMarkdownContent(prepared.payloadBytes.toString("utf8"));
  return {
    ...prepared,
    extractedText: semantic.extractedText,
    extractionHash: buildExtractionHash(semantic.extractedText, prepared.extractionArtifact),
    semanticHash: semantic.semanticHash
  };
}
function shouldEmitProgress(totalItems) {
  return totalItems >= PROGRESS_FILE_THRESHOLD && Boolean(process.stderr?.isTTY);
}
function createProgressReporter(prefix, totalItems) {
  if (!shouldEmitProgress(totalItems)) {
    return {
      tick: () => {
      },
      finish: () => {
      }
    };
  }
  let completed = 0;
  let nextUpdate = Math.min(PROGRESS_UPDATE_INTERVAL, totalItems);
  process.stderr.write(`[swarmvault ${prefix}] starting ${totalItems} file(s)
`);
  return {
    tick: () => {
      completed += 1;
      if (completed >= nextUpdate || completed === totalItems) {
        process.stderr.write(`[swarmvault ${prefix}] ${completed}/${totalItems}
`);
        while (completed >= nextUpdate) {
          nextUpdate += PROGRESS_UPDATE_INTERVAL;
        }
      }
    },
    finish: (summary) => {
      process.stderr.write(`[swarmvault ${prefix}] finished ${totalItems} file(s)${summary ? ` (${summary})` : ""}
`);
    }
  };
}
function normalizeIngestOptions(options) {
  return {
    includeAssets: options?.includeAssets ?? true,
    maxAssetSize: Math.max(0, Math.floor(options?.maxAssetSize ?? DEFAULT_MAX_ASSET_SIZE)),
    repoRoot: options?.repoRoot ? path9.resolve(options.repoRoot) : void 0,
    include: (options?.include ?? []).map((pattern) => pattern.trim()).filter(Boolean),
    exclude: (options?.exclude ?? []).map((pattern) => pattern.trim()).filter(Boolean),
    maxFiles: Math.max(1, Math.floor(options?.maxFiles ?? DEFAULT_MAX_DIRECTORY_FILES)),
    gitignore: options?.gitignore ?? true,
    swarmvaultignore: options?.swarmvaultignore ?? true,
    video: options?.video ?? false,
    extractClasses: options?.extractClasses ?? ["first_party"],
    resume: options?.resume,
    redact: options?.redact
  };
}
function resolveIngestRedactor(config, options) {
  if (options?.redact === false) {
    return null;
  }
  return buildConfiguredRedactor(config.redaction);
}
async function attachIngestRedactor(rootDir, normalized) {
  if (normalized.redactor !== void 0) {
    return normalized;
  }
  const { config } = await loadVaultConfig(rootDir);
  return { ...normalized, redactor: resolveIngestRedactor(config, normalized) };
}
async function resolveRepoIngestOptions(rootDir, options) {
  const normalized = normalizeIngestOptions(options);
  const { config } = await loadVaultConfig(rootDir);
  const repoAnalysis = config.repoAnalysis;
  return {
    ...normalized,
    extractClasses: normalizeExtractClasses(repoAnalysis, normalized.extractClasses),
    repoAnalysis,
    redactor: resolveIngestRedactor(config, normalized)
  };
}
function matchesAnyGlob2(relativePath, patterns) {
  return patterns.some(
    (pattern) => path9.matchesGlob(relativePath, pattern) || path9.matchesGlob(path9.posix.basename(relativePath), pattern)
  );
}
function supportedDirectoryKind(sourceKind) {
  return sourceKind !== "binary";
}
async function findNearestGitRoot(startPath) {
  let current = path9.resolve(startPath);
  try {
    const stat = await fs8.stat(current);
    if (!stat.isDirectory()) {
      current = path9.dirname(current);
    }
  } catch {
    current = path9.dirname(current);
  }
  while (true) {
    if (await fileExists(path9.join(current, ".git"))) {
      return current;
    }
    const parent = path9.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}
async function detectScopedRepoRoot(rootDir, inputPath, fallbackRoot) {
  const detectedRepoRoot = await findNearestGitRoot(inputPath);
  if (!detectedRepoRoot) {
    return fallbackRoot;
  }
  return withinRoot(rootDir, inputPath) && !withinRoot(rootDir, detectedRepoRoot) ? fallbackRoot : detectedRepoRoot;
}
function withinRoot(rootPath, targetPath) {
  const relative = path9.relative(rootPath, targetPath);
  return relative === "" || !relative.startsWith("..") && !path9.isAbsolute(relative);
}
function repoRootFromManifest2(manifest) {
  if (manifest.originType !== "file" || !manifest.originalPath || !manifest.repoRelativePath) {
    return null;
  }
  const repoDir = path9.posix.dirname(manifest.repoRelativePath);
  const fileDir = path9.dirname(path9.resolve(manifest.originalPath));
  if (repoDir === "." || !repoDir) {
    return fileDir;
  }
  const segments = repoDir.split("/").filter(Boolean);
  return path9.resolve(fileDir, ...segments.map(() => ".."));
}
function repoRelativePathFor(absolutePath, repoRoot) {
  if (!repoRoot || !withinRoot(repoRoot, absolutePath)) {
    return void 0;
  }
  const relative = toPosix(path9.relative(repoRoot, absolutePath));
  return relative && !relative.startsWith("..") ? relative : void 0;
}
function normalizeOriginUrl(input) {
  try {
    return new URL(input).toString();
  } catch {
    return input;
  }
}
function isHttpUrl(input) {
  return /^https?:\/\//i.test(input);
}
function stripLeadingLabel(value, label) {
  return value.startsWith(label) ? value.slice(label.length).trim() : value.trim();
}
function arxivIdFromInput(input) {
  const trimmed = input.trim();
  if (/^\d{4}\.\d{4,5}(v\d+)?$/i.test(trimmed)) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/(\d{4}\.\d{4,5}(?:v\d+)?)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
function doiFromInput(input) {
  const trimmed = input.trim();
  if (/^10\.\S+\/\S+$/i.test(trimmed)) {
    return trimmed.replace(/\s+/g, "");
  }
  try {
    const url = new URL(trimmed);
    if (url.hostname === "doi.org" || url.hostname === "dx.doi.org") {
      const doi = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
      return /^10\.\S+\/\S+$/i.test(doi) ? doi : null;
    }
  } catch {
    return null;
  }
  return null;
}
function isTweetUrl(input) {
  try {
    const url = new URL(input);
    return url.hostname.includes("x.com") || url.hostname.includes("twitter.com");
  } catch {
    return false;
  }
}
function markdownFrontmatter(value) {
  const normalized = Object.fromEntries(
    Object.entries(value).filter(
      ([, rawValue]) => Array.isArray(rawValue) ? rawValue.length > 0 : Boolean(typeof rawValue === "string" ? rawValue.trim() : rawValue)
    )
  );
  return matter3.stringify("", normalized).trimEnd().split("\n").concat([""]);
}
function prepareCapturedMarkdownInput(input) {
  return finalizePreparedInput({
    title: input.title,
    originType: "url",
    sourceKind: "markdown",
    sourceType: input.sourceType,
    url: normalizeOriginUrl(input.url),
    mimeType: "text/markdown",
    storedExtension: ".md",
    payloadBytes: Buffer.from(input.markdown, "utf8"),
    extractedText: input.markdown,
    attachments: input.attachments,
    logDetails: input.logDetails
  });
}
function isPrivateIp(ip) {
  if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd")) return true;
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  return parts[0] === 0 || parts[0] === 127 || parts[0] === 10 || parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31 || parts[0] === 192 && parts[1] === 168 || parts[0] === 169 && parts[1] === 254;
}
function allowPrivateUrlsForProcess() {
  return process.env.SWARMVAULT_ALLOW_PRIVATE_URLS === "1";
}
function isReservedTestHostname(hostname) {
  const lower = hostname.toLowerCase();
  return lower.endsWith(".test") || lower.endsWith(".example") || lower.endsWith(".invalid");
}
async function validateUrlSafety(url) {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`Blocked protocol: ${parsed.protocol}`);
  }
  if (allowPrivateUrlsForProcess() || isReservedTestHostname(parsed.hostname)) {
    return;
  }
  let address;
  try {
    const { lookup } = await import("dns/promises");
    const result = await lookup(parsed.hostname);
    address = result.address;
  } catch {
    return;
  }
  if (isPrivateIp(address)) {
    throw new Error(`Blocked private/reserved IP ${address} (resolved from ${parsed.hostname})`);
  }
}
async function fetchText(url) {
  await validateUrlSafety(url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}
async function fetchResolvedText(url) {
  await validateUrlSafety(url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return {
    text: await response.text(),
    finalUrl: normalizeOriginUrl(response.url || url),
    contentType: response.headers.get("content-type")?.split(";")[0]?.trim() || "text/html"
  };
}
function domTextFromHtml(html, baseUrl) {
  const dom = new JSDOM2(`<body>${html}</body>`, { url: baseUrl });
  return normalizeWhitespace(dom.window.document.body.textContent ?? "");
}
async function captureArxivMarkdown(input, options) {
  const arxivId = arxivIdFromInput(input);
  if (!arxivId) {
    throw new Error(`Could not determine an arXiv id from ${input}`);
  }
  const normalizedUrl = `https://arxiv.org/abs/${arxivId}`;
  const html = await fetchText(normalizedUrl);
  const dom = new JSDOM2(html, { url: normalizedUrl });
  const document = dom.window.document;
  const metaTitle = document.querySelector('meta[name="citation_title"]')?.getAttribute("content")?.trim();
  const headingTitle = document.querySelector("h1.title")?.textContent?.trim();
  const title = stripLeadingLabel(metaTitle ?? headingTitle ?? arxivId, "Title:");
  const authors = [...document.querySelectorAll('meta[name="citation_author"]')].map((node) => node.getAttribute("content")?.trim()).filter((value) => Boolean(value));
  const authorsText = authors.join(", ") || stripLeadingLabel(document.querySelector(".authors")?.textContent?.trim() ?? "", "Authors:");
  const abstract = stripLeadingLabel(document.querySelector("blockquote.abstract")?.textContent?.trim() ?? "", "Abstract:");
  const categories = [...document.querySelectorAll(".subheader .primary-subject, .metatable .tablecell.subjects")].flatMap((node) => (node.textContent ?? "").split(/;/g)).map((value) => value.trim()).filter(Boolean);
  const capturedAt = (/* @__PURE__ */ new Date()).toISOString();
  const markdown = [
    ...markdownFrontmatter({
      source_type: "arxiv",
      source_url: normalizedUrl,
      canonical_url: normalizedUrl,
      title,
      authors,
      tags: uniqueStrings(categories),
      arxiv_id: arxivId,
      author: options.author,
      contributor: options.contributor,
      captured_at: capturedAt
    }),
    `# ${title}`,
    "",
    `- arXiv: ${arxivId}`,
    ...authorsText ? [`- Authors: ${authorsText}`] : [],
    ...options.author ? [`- Added By: ${options.author}`] : [],
    ...options.contributor ? [`- Contributor: ${options.contributor}`] : [],
    "",
    "## Abstract",
    "",
    abstract || "Abstract not available from the fetched arXiv page.",
    "",
    "## Source",
    "",
    `- URL: ${normalizedUrl}`,
    ""
  ].join("\n");
  return { title, normalizedUrl, markdown };
}
async function captureTweetMarkdown(input, options) {
  const normalizedUrl = normalizeOriginUrl(input);
  const canonicalUrl = normalizedUrl.replace("x.com", "twitter.com");
  const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(canonicalUrl)}&omit_script=true`;
  const response = await fetch(oembedUrl);
  let postText = "";
  let postAuthor = "";
  if (response.ok) {
    const payload = await response.json();
    postText = payload.html ? domTextFromHtml(payload.html, canonicalUrl) : "";
    postAuthor = payload.author_name?.trim() ?? "";
  }
  const title = postAuthor ? `X Post by ${postAuthor}` : "X Post";
  const capturedAt = (/* @__PURE__ */ new Date()).toISOString();
  const markdown = [
    ...markdownFrontmatter({
      source_type: "tweet",
      source_url: normalizedUrl,
      canonical_url: canonicalUrl,
      title,
      authors: postAuthor ? [postAuthor] : void 0,
      author: options.author,
      contributor: options.contributor,
      captured_at: capturedAt
    }),
    `# ${title}`,
    "",
    ...postAuthor ? [`- Post Author: ${postAuthor}`] : [],
    ...options.author ? [`- Added By: ${options.author}`] : [],
    ...options.contributor ? [`- Contributor: ${options.contributor}`] : [],
    "",
    "## Content",
    "",
    postText || `Captured the post link at ${normalizedUrl}. Rich text was unavailable from the public oEmbed response.`,
    "",
    "## Source",
    "",
    `- URL: ${normalizedUrl}`,
    ""
  ].join("\n");
  return { title, normalizedUrl, markdown };
}
function firstMetaContent(document, selectors) {
  for (const selector of selectors) {
    const value = document.querySelector(selector)?.getAttribute("content")?.trim();
    if (value) {
      return value;
    }
  }
  return void 0;
}
function metaContents(document, selectors) {
  return uniqueStrings(
    selectors.flatMap(
      (selector) => [...document.querySelectorAll(selector)].map((node) => node.getAttribute("content")?.trim() ?? "").filter(Boolean)
    )
  );
}
function splitKeywords(value) {
  return uniqueStrings(
    (value ?? "").split(/[;,]/g).map((item) => item.trim()).filter(Boolean)
  );
}
async function captureArticleMarkdown(rootDir, input, options, extra = { sourceType: "article" }) {
  const resolved = await fetchResolvedText(input);
  if (!resolved.contentType.includes("html")) {
    throw new Error(`Unsupported article content type: ${resolved.contentType}`);
  }
  const dom = new JSDOM2(resolved.text, { url: resolved.finalUrl });
  const document = dom.window.document;
  const canonicalHref = document.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim();
  const canonicalUrl = canonicalHref ? normalizeOriginUrl(new URL(canonicalHref, resolved.finalUrl).toString()) : resolved.finalUrl;
  const title = firstMetaContent(document, ['meta[name="citation_title"]', 'meta[property="og:title"]', 'meta[name="twitter:title"]']) ?? (document.title.trim() || canonicalUrl);
  const authors = uniqueStrings([
    ...metaContents(document, ['meta[name="citation_author"]']),
    ...metaContents(document, ['meta[name="author"]', 'meta[property="article:author"]'])
  ]);
  const publishedAt = firstMetaContent(document, [
    'meta[name="citation_publication_date"]',
    'meta[name="citation_online_date"]',
    'meta[property="article:published_time"]',
    'meta[name="pubdate"]'
  ]);
  const updatedAt = firstMetaContent(document, ['meta[property="article:modified_time"]', 'meta[name="lastmod"]']);
  const tags = uniqueStrings([
    ...metaContents(document, ['meta[property="article:tag"]']),
    ...splitKeywords(firstMetaContent(document, ['meta[name="keywords"]']))
  ]);
  const inferredDoi = extra.doi ?? firstMetaContent(document, ['meta[name="citation_doi"]', 'meta[name="dc.identifier"]'])?.replace(/^doi:\s*/i, "") ?? void 0;
  const normalizedOptions = normalizeIngestOptions(options);
  const prepared = await prepareUrlInput(rootDir, canonicalUrl, normalizedOptions);
  if (prepared.sourceKind !== "markdown" && prepared.sourceKind !== "text") {
    throw new Error(`Unsupported prepared article kind: ${prepared.sourceKind}`);
  }
  const body = prepared.extractedText ?? prepared.payloadBytes.toString("utf8");
  const capturedAt = (/* @__PURE__ */ new Date()).toISOString();
  const markdown = [
    ...markdownFrontmatter({
      source_type: extra.sourceType,
      source_url: extra.sourceUrl ?? input,
      canonical_url: canonicalUrl,
      title,
      authors,
      published_at: publishedAt,
      updated_at: updatedAt,
      doi: inferredDoi,
      tags,
      author: options.author,
      contributor: options.contributor,
      captured_at: capturedAt
    }),
    body.trim(),
    "",
    "## Source",
    "",
    `- URL: ${canonicalUrl}`,
    ...extra.sourceType === "doi" && inferredDoi ? [`- DOI: ${inferredDoi}`] : [],
    ""
  ].join("\n");
  return {
    title,
    normalizedUrl: canonicalUrl,
    markdown,
    attachments: prepared.attachments
  };
}
async function captureDoiMarkdown(rootDir, input, options) {
  const doi = doiFromInput(input);
  if (!doi) {
    throw new Error(`Could not determine a DOI from ${input}`);
  }
  return captureArticleMarkdown(rootDir, `https://doi.org/${encodeURIComponent(doi)}`, options, {
    sourceType: "doi",
    sourceUrl: input,
    doi
  });
}
function manifestMatchesOrigin(manifest, prepared) {
  if (prepared.originType === "url") {
    return Boolean(prepared.url && manifest.url && normalizeOriginUrl(manifest.url) === normalizeOriginUrl(prepared.url));
  }
  return Boolean(prepared.originalPath && manifest.originalPath && toPosix(manifest.originalPath) === toPosix(prepared.originalPath));
}
function manifestMatchesOriginPart(manifest, prepared) {
  return manifestMatchesOrigin(manifest, prepared) && (manifest.sourcePartKey ?? "") === (prepared.sourcePartKey ?? "");
}
function buildCompositeHash(payloadBytes, attachments = []) {
  if (!attachments.length) {
    return sha256(payloadBytes);
  }
  const attachmentSignature = attachments.map((attachment) => `${attachment.relativePath}:${sha256(attachment.bytes)}`).sort().join("|");
  return sha256(`${sha256(payloadBytes)}|${attachmentSignature}`);
}
function sanitizeAssetRelativePath(value) {
  const normalized = path9.posix.normalize(value.replace(/\\/g, "/"));
  const segments = normalized.split("/").filter(Boolean).map((segment) => {
    if (segment === ".") {
      return "";
    }
    if (segment === "..") {
      return "_up";
    }
    return segment;
  }).filter(Boolean);
  return segments.join("/") || "asset";
}
function normalizeLocalReference(value) {
  const trimmed = value.trim().replace(/^<|>$/g, "");
  const [withoutTitle] = trimmed.split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/, 1);
  const candidate = withoutTitle.split("#")[0]?.split("?")[0]?.trim();
  if (!candidate) {
    return null;
  }
  const lowered = candidate.toLowerCase();
  if (lowered.startsWith("http://") || lowered.startsWith("https://") || lowered.startsWith("data:") || lowered.startsWith("mailto:") || lowered.startsWith("#") || path9.isAbsolute(candidate)) {
    return null;
  }
  return candidate.replace(/\\/g, "/");
}
function extractMarkdownReferences(content) {
  const references = [];
  const linkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;
  for (const match of content.matchAll(linkPattern)) {
    const normalized = normalizeLocalReference(match[1] ?? "");
    if (normalized) {
      references.push(normalized);
    }
  }
  return references;
}
function extractHtmlLocalReferences(html, baseUrl) {
  const dom = new JSDOM2(html, { url: baseUrl });
  const document = dom.window.document;
  const references = [];
  for (const image of [...document.querySelectorAll("img[src]")]) {
    const src = image.getAttribute("src");
    if (!src) {
      continue;
    }
    const normalized = normalizeLocalReference(src);
    if (normalized) {
      references.push(normalized);
    }
  }
  return references;
}
function normalizeRemoteReference(value, baseUrl) {
  const trimmed = value.trim().replace(/^<|>$/g, "");
  const [withoutTitle] = trimmed.split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/, 1);
  const candidate = withoutTitle.split("#")[0]?.trim();
  if (!candidate) {
    return null;
  }
  const lowered = candidate.toLowerCase();
  if (lowered.startsWith("data:") || lowered.startsWith("mailto:") || lowered.startsWith("#")) {
    return null;
  }
  let resolved;
  try {
    resolved = new URL(candidate, baseUrl);
  } catch {
    return null;
  }
  if (!/^https?:$/i.test(resolved.protocol)) {
    return null;
  }
  resolved.hash = "";
  return resolved.toString();
}
function extractMarkdownImageReferences(content, baseUrl) {
  const references = [];
  const imagePattern = /!\[[^\]]*]\(([^)]+)\)/g;
  for (const match of content.matchAll(imagePattern)) {
    const normalized = normalizeRemoteReference(match[1] ?? "", baseUrl);
    if (normalized) {
      references.push(normalized);
    }
  }
  return references;
}
async function convertHtmlToMarkdown(html, url) {
  const dom = new JSDOM2(html, { url });
  const article = new Readability(dom.window.document).parse();
  const turndown = new TurndownService2({ headingStyle: "atx", codeBlockStyle: "fenced" });
  const body = article?.content ?? dom.window.document.body.innerHTML;
  const markdown = turndown.turndown(body);
  return {
    markdown,
    title: article?.title?.trim() || new URL(url).hostname
  };
}
async function readManifestByHash(manifestsDir, contentHash) {
  const entries = await fs8.readdir(manifestsDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const manifest = await readJsonFile(path9.join(manifestsDir, entry.name));
    if (manifest?.contentHash === contentHash) {
      return {
        ...manifest,
        semanticHash: manifest.semanticHash ?? manifest.contentHash
      };
    }
  }
  return null;
}
async function readManifestsByOrigin(manifestsDir, prepared) {
  const entries = await fs8.readdir(manifestsDir, { withFileTypes: true }).catch(() => []);
  const manifests = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const manifest = await readJsonFile(path9.join(manifestsDir, entry.name));
    if (manifest && manifestMatchesOrigin(manifest, prepared)) {
      manifests.push({
        ...manifest,
        semanticHash: manifest.semanticHash ?? manifest.contentHash
      });
    }
  }
  return manifests;
}
async function readManifestByOrigin(manifestsDir, prepared) {
  const manifests = await readManifestsByOrigin(manifestsDir, prepared);
  return manifests.find((manifest) => manifestMatchesOriginPart(manifest, prepared)) ?? null;
}
async function loadGitignoreMatcher(repoRoot, enabled) {
  if (!enabled) {
    return null;
  }
  const gitignorePath = path9.join(repoRoot, ".gitignore");
  if (!await fileExists(gitignorePath)) {
    return null;
  }
  const matcher = ignore();
  matcher.add(await fs8.readFile(gitignorePath, "utf8"));
  return matcher;
}
async function hasVcsBoundary(dir) {
  for (const name of VCS_BOUNDARY_DIRS) {
    if (await fileExists(path9.join(dir, name))) {
      return true;
    }
  }
  return false;
}
async function loadSwarmvaultIgnoreMatchers(inputDir, repoRoot, enabled) {
  if (!enabled) {
    return [];
  }
  const start = path9.resolve(inputDir);
  const boundary = path9.resolve(repoRoot);
  const dirs = [];
  let current = start;
  while (true) {
    dirs.push(current);
    if (current === boundary || current !== start && await hasVcsBoundary(current)) {
      break;
    }
    const parent = path9.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  const matchers = [];
  for (const dir of dirs.reverse()) {
    const ignorePath = path9.join(dir, SWARMVAULT_IGNORE_FILENAME);
    if (!await fileExists(ignorePath)) {
      continue;
    }
    const matcher = ignore();
    matcher.add(await fs8.readFile(ignorePath, "utf8"));
    matchers.push({ anchorDir: dir, matchInputRelative: dir !== start, matcher });
  }
  return matchers;
}
function swarmvaultIgnoreMatches(absolutePath, inputDir, matchers) {
  return matchers.some(({ anchorDir, matchInputRelative, matcher }) => {
    const relativeToAnchor = toPosix(path9.relative(anchorDir, absolutePath));
    if (withinRoot(anchorDir, absolutePath) && relativeToAnchor && matcher.ignores(relativeToAnchor)) {
      return true;
    }
    if (!matchInputRelative || !withinRoot(inputDir, absolutePath)) {
      return false;
    }
    const relativeToInput = toPosix(path9.relative(inputDir, absolutePath));
    return Boolean(relativeToInput && matcher.ignores(relativeToInput));
  });
}
function builtInIgnoreReason(relativePath) {
  for (const segment of relativePath.split("/")) {
    if (HARD_REPO_IGNORES.has(segment)) {
      return `built_in_ignore:${segment}`;
    }
  }
  return null;
}
function sourceClassForRelativePath(relativePath, options) {
  return classifyRepoPath(relativePath, options.repoAnalysis);
}
async function collectDirectoryFiles(rootDir, inputDir, repoRoot, options) {
  const matcher = await loadGitignoreMatcher(repoRoot, options.gitignore);
  const swarmvaultIgnoreMatchers = await loadSwarmvaultIgnoreMatchers(inputDir, repoRoot, options.swarmvaultignore);
  const skipped = [];
  const files = [];
  const stack = [{ dir: inputDir, matchers: swarmvaultIgnoreMatchers }];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    const currentDir = current.dir;
    let currentSwarmvaultIgnoreMatchers = current.matchers;
    const localSwarmvaultIgnorePath = path9.join(currentDir, SWARMVAULT_IGNORE_FILENAME);
    if (options.swarmvaultignore && !currentSwarmvaultIgnoreMatchers.some((entry) => entry.anchorDir === currentDir) && await fileExists(localSwarmvaultIgnorePath)) {
      const localMatcher = ignore();
      localMatcher.add(await fs8.readFile(localSwarmvaultIgnorePath, "utf8"));
      currentSwarmvaultIgnoreMatchers = [
        ...currentSwarmvaultIgnoreMatchers,
        { anchorDir: currentDir, matchInputRelative: false, matcher: localMatcher }
      ];
    }
    const entries = await fs8.readdir(currentDir, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolutePath = path9.join(currentDir, entry.name);
      if (entry.name === SWARMVAULT_IGNORE_FILENAME) {
        skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: "swarmvaultignore" });
        continue;
      }
      const relativeToRepo = repoRelativePathFor(absolutePath, repoRoot) ?? toPosix(path9.relative(inputDir, absolutePath));
      const relativePath = relativeToRepo || entry.name;
      const builtInReason = builtInIgnoreReason(relativePath);
      if (builtInReason) {
        skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: builtInReason });
        continue;
      }
      if (matcher?.ignores(relativePath)) {
        skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: "gitignore" });
        continue;
      }
      if (swarmvaultIgnoreMatches(absolutePath, inputDir, currentSwarmvaultIgnoreMatchers)) {
        skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: "swarmvaultignore" });
        continue;
      }
      if (matchesAnyGlob2(relativePath, options.exclude)) {
        skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: "exclude_glob" });
        continue;
      }
      if (entry.isDirectory()) {
        stack.push({ dir: absolutePath, matchers: currentSwarmvaultIgnoreMatchers });
        continue;
      }
      if (!entry.isFile()) {
        skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: "unsupported_entry" });
        continue;
      }
      if (options.include.length > 0 && !matchesAnyGlob2(relativePath, options.include)) {
        skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: "include_glob" });
        continue;
      }
      const mimeType = guessMimeType(absolutePath);
      const detectionOptions = await localCodeDetectionOptions(absolutePath);
      let sourceKind = inferKind(mimeType, absolutePath, detectionOptions);
      if (sourceKind === "binary" && path9.extname(absolutePath).toLowerCase() === ".zip") {
        const bytes = await fs8.readFile(absolutePath);
        if (isSlackExportArchive(bytes)) {
          sourceKind = "chat_export";
        }
      }
      sourceKind = await refineBinaryKindWithContentSniff(absolutePath, sourceKind);
      const sourceClass = sourceClassForRelativePath(relativePath, options);
      if (!supportedDirectoryKind(sourceKind)) {
        skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: `unsupported_kind:${sourceKind}` });
        continue;
      }
      if (!options.extractClasses.includes(sourceClass)) {
        skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: `source_class:${sourceClass}` });
        continue;
      }
      if (files.length >= options.maxFiles) {
        skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: "max_files" });
        continue;
      }
      files.push(absolutePath);
    }
  }
  return { files: files.sort((left, right) => left.localeCompare(right)), skipped };
}
function resolveUrlMimeType(input, response) {
  const headerMimeType = response.headers.get("content-type")?.split(";")[0]?.trim();
  const guessedMimeType = guessMimeType(new URL(input).pathname);
  if (!headerMimeType) {
    return guessedMimeType;
  }
  if ((headerMimeType === "text/plain" || headerMimeType === "application/octet-stream") && guessedMimeType !== "application/octet-stream") {
    return guessedMimeType;
  }
  return headerMimeType;
}
function buildRemoteAssetRelativePath(assetUrl, mimeType) {
  const url = new URL(assetUrl);
  const normalized = sanitizeAssetRelativePath(`${url.hostname}${url.pathname || "/asset"}`);
  const extension = path9.posix.extname(normalized);
  const directory = path9.posix.dirname(normalized);
  const basename = extension ? path9.posix.basename(normalized, extension) : path9.posix.basename(normalized);
  const resolvedExtension = extension || `.${mime.extension(mimeType) || "bin"}`;
  const hashedName = `${basename || "asset"}-${sha256(assetUrl).slice(0, 8)}${resolvedExtension}`;
  return directory === "." ? hashedName : path9.posix.join(directory, hashedName);
}
async function readResponseBytesWithinLimit(response, maxBytes) {
  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error(`asset exceeds max size (${contentLength} > ${maxBytes})`);
  }
  if (!response.body) {
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maxBytes) {
      throw new Error(`asset exceeds max size (${bytes.length} > ${maxBytes})`);
    }
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel("asset exceeds configured size limit");
      throw new Error(`asset exceeds max size (${total} > ${maxBytes})`);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}
async function fetchRemoteImageAttachment(assetUrl, maxAssetSize) {
  await validateUrlSafety(assetUrl);
  const response = await fetch(assetUrl);
  if (!response.ok) {
    throw new Error(`failed with ${response.status} ${response.statusText}`);
  }
  const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim() || guessMimeType(new URL(assetUrl).pathname);
  if (!mimeType.startsWith("image/")) {
    throw new Error(`unsupported mime type ${mimeType}`);
  }
  const bytes = await readResponseBytesWithinLimit(response, maxAssetSize);
  return {
    relativePath: buildRemoteAssetRelativePath(assetUrl, mimeType),
    mimeType,
    originalPath: assetUrl,
    bytes
  };
}
async function collectRemoteImageAttachments(assetUrls, options) {
  if (!options.includeAssets || options.maxAssetSize === 0 || !assetUrls.length) {
    return { attachments: [], skippedCount: 0 };
  }
  const attachments = [];
  let skippedCount = 0;
  for (const assetUrl of [...new Set(assetUrls)]) {
    try {
      attachments.push(await fetchRemoteImageAttachment(assetUrl, options.maxAssetSize));
    } catch {
      skippedCount += 1;
    }
  }
  return { attachments, skippedCount };
}
function extractHtmlImageReferences(html, baseUrl) {
  const dom = new JSDOM2(html, { url: baseUrl });
  const document = dom.window.document;
  const references = [];
  for (const image of [...document.querySelectorAll("img[src]")]) {
    const src = image.getAttribute("src");
    if (!src) {
      continue;
    }
    const normalized = normalizeRemoteReference(src, baseUrl);
    if (normalized) {
      references.push(normalized);
    }
  }
  return references;
}
function rewriteHtmlImageReferences(html, baseUrl, replacements) {
  const dom = new JSDOM2(html, { url: baseUrl });
  const document = dom.window.document;
  for (const image of [...document.querySelectorAll("img[src]")]) {
    const src = image.getAttribute("src");
    if (!src) {
      continue;
    }
    const normalized = normalizeRemoteReference(src, baseUrl);
    const replacement = normalized ? replacements.get(normalized) : void 0;
    if (replacement) {
      image.setAttribute("src", replacement);
    }
  }
  return dom.serialize();
}
function rewriteHtmlLocalReferences(html, baseUrl, replacements) {
  const dom = new JSDOM2(html, { url: baseUrl });
  const document = dom.window.document;
  for (const image of [...document.querySelectorAll("img[src]")]) {
    const src = image.getAttribute("src");
    if (!src) {
      continue;
    }
    const normalized = normalizeLocalReference(src);
    const replacement = normalized ? replacements.get(normalized) : void 0;
    if (replacement) {
      image.setAttribute("src", replacement);
    }
  }
  return dom.serialize();
}
function rewriteMarkdownImageReferences(content, baseUrl, replacements) {
  return content.replace(/(!\[[^\]]*]\()([^)]+)(\))/g, (fullMatch, prefix, target, suffix) => {
    const normalized = normalizeRemoteReference(target, baseUrl);
    const replacement = normalized ? replacements.get(normalized) : void 0;
    if (!replacement) {
      return fullMatch;
    }
    return `${prefix}${replacement}${suffix}`;
  });
}
function rewriteMarkdownImageTargets(content, replacements) {
  return content.replace(/(!\[[^\]]*]\()([^)]+)(\))/g, (fullMatch, prefix, target, suffix) => {
    const trimmed = target.trim().replace(/^<|>$/g, "");
    const [withoutTitle] = trimmed.split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/, 1);
    const candidate = withoutTitle.trim();
    const replacement = replacements.get(candidate);
    if (!replacement) {
      return fullMatch;
    }
    return `${prefix}${replacement}${suffix}`;
  });
}
async function persistPreparedInput(rootDir, prepared, paths, redactor) {
  await ensureDir(paths.rawSourcesDir);
  await ensureDir(paths.rawAssetsDir);
  await ensureDir(paths.manifestsDir);
  await ensureDir(paths.extractsDir);
  let redactionSummary;
  if (redactor) {
    const counts = /* @__PURE__ */ new Map();
    let redactedPayload;
    if (shouldRedactPayload(prepared)) {
      const payloadText = prepared.payloadBytes.toString("utf8");
      const payloadResult = redactor.redact(payloadText);
      for (const match of payloadResult.matches) {
        counts.set(match.patternId, (counts.get(match.patternId) ?? 0) + match.count);
      }
      if (payloadResult.matches.length) {
        redactedPayload = Buffer.from(payloadResult.text, "utf8");
      }
    }
    let redactedExtractedText = prepared.extractedText;
    if (prepared.extractedText) {
      const extractedResult = redactor.redact(prepared.extractedText);
      for (const match of extractedResult.matches) {
        counts.set(match.patternId, (counts.get(match.patternId) ?? 0) + match.count);
      }
      if (extractedResult.matches.length) {
        redactedExtractedText = extractedResult.text;
      }
    }
    if (counts.size > 0) {
      prepared = {
        ...prepared,
        payloadBytes: redactedPayload ?? prepared.payloadBytes,
        extractedText: redactedExtractedText,
        contentHash: void 0,
        semanticHash: void 0,
        extractionHash: void 0
      };
      redactionSummary = {
        sourceId: "",
        title: prepared.title,
        matches: [...counts.entries()].map(([patternId, count]) => ({ patternId, count }))
      };
    }
  }
  const attachments = prepared.attachments ?? [];
  const contentHash = prepared.contentHash ?? buildCompositeHash(prepared.payloadBytes, attachments);
  const semanticHash = prepared.semanticHash ?? contentHash;
  const extractionHash = prepared.extractionHash ?? buildExtractionHash(prepared.extractedText, prepared.extractionArtifact);
  const existingByOrigin = await readManifestByOrigin(paths.manifestsDir, prepared);
  const existingByHash = existingByOrigin || prepared.sourcePartKey ? null : await readManifestByHash(paths.manifestsDir, contentHash);
  if (existingByOrigin && existingByOrigin.contentHash === contentHash && existingByOrigin.semanticHash === semanticHash && existingByOrigin.extractionHash === extractionHash && existingByOrigin.title === prepared.title && existingByOrigin.sourceKind === prepared.sourceKind && existingByOrigin.sourceType === prepared.sourceType && existingByOrigin.sourceClass === prepared.sourceClass && existingByOrigin.language === prepared.language && existingByOrigin.mimeType === prepared.mimeType && existingByOrigin.repoRelativePath === prepared.repoRelativePath && existingByOrigin.sourceGroupId === prepared.sourceGroupId && existingByOrigin.sourceGroupTitle === prepared.sourceGroupTitle && existingByOrigin.sourcePartKey === prepared.sourcePartKey && existingByOrigin.partIndex === prepared.partIndex && existingByOrigin.partCount === prepared.partCount && existingByOrigin.partTitle === prepared.partTitle && JSON.stringify(existingByOrigin.details ?? {}) === JSON.stringify(prepared.details ?? {})) {
    return { manifest: existingByOrigin, isNew: false, wasUpdated: false };
  }
  if (existingByHash) {
    return { manifest: existingByHash, isNew: false, wasUpdated: false };
  }
  const previous = existingByOrigin ?? void 0;
  const sourceId = previous?.sourceId ?? `${slugify(prepared.title)}-${contentHash.slice(0, 8)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const storedPath = path9.join(paths.rawSourcesDir, `${sourceId}${prepared.storedExtension}`);
  const extractedTextPath = prepared.extractedText ? path9.join(paths.extractsDir, `${sourceId}.md`) : void 0;
  const extractedMetadataPath = prepared.extractionArtifact ? path9.join(paths.extractsDir, `${sourceId}.json`) : void 0;
  const attachmentsDir = path9.join(paths.rawAssetsDir, sourceId);
  if (previous?.storedPath) {
    await fs8.rm(path9.resolve(rootDir, previous.storedPath), { force: true });
  }
  if (previous?.extractedTextPath) {
    await fs8.rm(path9.resolve(rootDir, previous.extractedTextPath), { force: true });
  }
  if (previous?.extractedMetadataPath) {
    await fs8.rm(path9.resolve(rootDir, previous.extractedMetadataPath), { force: true });
  }
  await fs8.rm(attachmentsDir, { recursive: true, force: true });
  await fs8.writeFile(storedPath, prepared.payloadBytes);
  if (prepared.extractedText && extractedTextPath) {
    await fs8.writeFile(extractedTextPath, prepared.extractedText, "utf8");
  }
  if (prepared.extractionArtifact && extractedMetadataPath) {
    await writeJsonFile(extractedMetadataPath, prepared.extractionArtifact);
  }
  const manifestAttachments = [];
  for (const attachment of attachments) {
    const absoluteAttachmentPath = path9.join(attachmentsDir, attachment.relativePath);
    await ensureDir(path9.dirname(absoluteAttachmentPath));
    await fs8.writeFile(absoluteAttachmentPath, attachment.bytes);
    manifestAttachments.push({
      path: toPosix(path9.relative(rootDir, absoluteAttachmentPath)),
      mimeType: attachment.mimeType,
      originalPath: attachment.originalPath
    });
  }
  const manifest = {
    sourceId,
    title: prepared.title,
    originType: prepared.originType,
    sourceKind: prepared.sourceKind,
    sourceType: prepared.sourceType,
    sourceClass: prepared.sourceClass,
    language: prepared.language,
    originalPath: prepared.originalPath,
    repoRelativePath: prepared.repoRelativePath,
    url: prepared.url,
    storedPath: toPosix(path9.relative(rootDir, storedPath)),
    extractedTextPath: extractedTextPath ? toPosix(path9.relative(rootDir, extractedTextPath)) : void 0,
    extractedMetadataPath: extractedMetadataPath ? toPosix(path9.relative(rootDir, extractedMetadataPath)) : void 0,
    extractionHash,
    mimeType: prepared.mimeType,
    contentHash,
    semanticHash,
    sourceGroupId: prepared.sourceGroupId,
    sourceGroupTitle: prepared.sourceGroupTitle,
    sourcePartKey: prepared.sourcePartKey,
    partIndex: prepared.partIndex,
    partCount: prepared.partCount,
    partTitle: prepared.partTitle,
    details: prepared.details,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    attachments: manifestAttachments.length ? manifestAttachments : void 0
  };
  await writeJsonFile(path9.join(paths.manifestsDir, `${sourceId}.json`), manifest);
  await appendLogEntry(rootDir, "ingest", prepared.title, [
    `source_id=${sourceId}`,
    `kind=${prepared.sourceKind}`,
    `attachments=${manifestAttachments.length}`,
    `updated=${previous ? "true" : "false"}`,
    ...prepared.logDetails ?? []
  ]);
  if (redactionSummary) {
    redactionSummary.sourceId = sourceId;
    await appendLogEntry(rootDir, "redact", prepared.title, [
      `source_id=${sourceId}`,
      ...redactionSummary.matches.map((entry) => `${entry.patternId}=${entry.count}`)
    ]);
  }
  if (manifest.originalPath || manifest.repoRelativePath || manifest.sourceId) {
    await clearPendingSemanticRefreshEntries(rootDir, {
      sourceId: manifest.sourceId,
      originalPath: manifest.originalPath,
      relativePath: manifest.repoRelativePath
    });
  }
  return { manifest, isNew: !previous, wasUpdated: Boolean(previous), redactions: redactionSummary };
}
async function persistPreparedInputs(rootDir, input, preparedInputs, paths, redactor) {
  const template = preparedInputs[0];
  const existingByOrigin = template ? await readManifestsByOrigin(paths.manifestsDir, template) : [];
  const created = [];
  const updated = [];
  const unchanged = [];
  const removed = [];
  const redactions = [];
  const seenSourceIds = /* @__PURE__ */ new Set();
  for (const prepared of preparedInputs) {
    const result = await persistPreparedInput(rootDir, prepared, paths, redactor);
    if (result.isNew) {
      created.push(result.manifest);
    } else if (result.wasUpdated) {
      updated.push(result.manifest);
    } else {
      unchanged.push(result.manifest);
    }
    if (result.redactions) {
      redactions.push(result.redactions);
    }
    seenSourceIds.add(result.manifest.sourceId);
  }
  for (const manifest of existingByOrigin) {
    if (seenSourceIds.has(manifest.sourceId)) {
      continue;
    }
    await removeManifestArtifacts(rootDir, manifest, paths);
    removed.push(manifest);
  }
  return {
    input,
    scannedCount: preparedInputs.length,
    created,
    updated,
    unchanged,
    removed,
    skipped: [],
    redactions: redactions.length ? redactions : void 0
  };
}
async function removeManifestArtifacts(rootDir, manifest, paths) {
  await fs8.rm(path9.join(paths.manifestsDir, `${manifest.sourceId}.json`), { force: true });
  await fs8.rm(path9.resolve(rootDir, manifest.storedPath), { force: true });
  if (manifest.extractedTextPath) {
    await fs8.rm(path9.resolve(rootDir, manifest.extractedTextPath), { force: true });
  }
  if (manifest.extractedMetadataPath) {
    await fs8.rm(path9.resolve(rootDir, manifest.extractedMetadataPath), { force: true });
  }
  await fs8.rm(path9.join(paths.rawAssetsDir, manifest.sourceId), { recursive: true, force: true });
  await fs8.rm(path9.join(paths.analysesDir, `${manifest.sourceId}.json`), { force: true });
}
function repoSyncWorkspaceIgnorePaths(rootDir, paths, repoRoot) {
  const candidates = [
    paths.rawDir,
    paths.wikiDir,
    paths.stateDir,
    paths.agentDir,
    paths.inboxDir,
    path9.join(rootDir, ".claude"),
    path9.join(rootDir, ".cursor"),
    path9.join(rootDir, ".obsidian")
  ];
  return candidates.map((candidate) => path9.resolve(candidate)).filter((candidate, index, items) => items.indexOf(candidate) === index).filter((candidate) => withinRoot(repoRoot, candidate));
}
function preparedMatchesManifest(manifest, prepared, contentHash) {
  return manifest.contentHash === contentHash && manifest.extractionHash === (prepared.extractionHash ?? buildExtractionHash(prepared.extractedText, prepared.extractionArtifact)) && manifest.semanticHash === (prepared.semanticHash ?? contentHash) && manifest.title === prepared.title && manifest.sourceKind === prepared.sourceKind && manifest.sourceType === prepared.sourceType && manifest.sourceClass === prepared.sourceClass && manifest.language === prepared.language && manifest.mimeType === prepared.mimeType && manifest.repoRelativePath === prepared.repoRelativePath && manifest.sourceGroupId === prepared.sourceGroupId && manifest.sourceGroupTitle === prepared.sourceGroupTitle && manifest.sourcePartKey === prepared.sourcePartKey && manifest.partIndex === prepared.partIndex && manifest.partCount === prepared.partCount && manifest.partTitle === prepared.partTitle && JSON.stringify(manifest.details ?? {}) === JSON.stringify(prepared.details ?? {});
}
function shouldDeferWatchSemanticRefresh(sourceKind) {
  return sourceKind === "markdown" || sourceKind === "text" || sourceKind === "html" || sourceKind === "pdf" || sourceKind === "docx" || sourceKind === "epub" || sourceKind === "csv" || sourceKind === "xlsx" || sourceKind === "pptx" || sourceKind === "transcript" || sourceKind === "chat_export" || sourceKind === "email" || sourceKind === "calendar" || sourceKind === "image" || sourceKind === "audio";
}
function pendingSemanticRefreshId(changeType, repoRoot, relativePath) {
  return `pending:${changeType}:${sha256(`${toPosix(repoRoot)}:${relativePath}`).slice(0, 12)}`;
}
async function listTrackedRepoRoots(rootDir) {
  const managedSources = await readManagedSourcesIfPresent(rootDir).catch(() => null);
  if (managedSources && managedSources.length > 0) {
    const directoryRoots = managedSources.filter((source) => source.kind === "directory" && source.path).map((source) => path9.resolve(source.path));
    if (directoryRoots.length > 0) {
      return [...new Set(directoryRoots)].sort((left, right) => left.localeCompare(right));
    }
  }
  const manifests = await listManifests(rootDir);
  return [...new Set(manifests.map((manifest) => repoRootFromManifest2(manifest)).filter((item) => Boolean(item)))].sort(
    (left, right) => left.localeCompare(right)
  );
}
async function syncTrackedRepos(rootDir, options, repoRoots) {
  const { paths } = await initWorkspace(rootDir);
  const normalizedOptions = await resolveRepoIngestOptions(rootDir, options);
  const manifests = await listManifests(rootDir);
  const trackedRoots = (repoRoots && repoRoots.length > 0 ? repoRoots : await listTrackedRepoRoots(rootDir)).map(
    (item) => path9.resolve(item)
  );
  const uniqueRoots = [...new Set(trackedRoots)].sort((left, right) => left.localeCompare(right));
  const manifestsByRepoRoot = /* @__PURE__ */ new Map();
  for (const manifest of manifests) {
    const repoRoot = repoRootFromManifest2(manifest);
    if (!repoRoot || !uniqueRoots.includes(path9.resolve(repoRoot))) {
      continue;
    }
    const key = path9.resolve(repoRoot);
    const bucket = manifestsByRepoRoot.get(key) ?? [];
    bucket.push(manifest);
    manifestsByRepoRoot.set(key, bucket);
  }
  const imported = [];
  const updated = [];
  const removed = [];
  const skipped = [];
  let scannedCount = 0;
  for (const repoRoot of uniqueRoots) {
    const repoManifests = manifestsByRepoRoot.get(repoRoot) ?? [];
    if (!await fileExists(repoRoot)) {
      for (const manifest of repoManifests) {
        await removeManifestArtifacts(rootDir, manifest, paths);
        removed.push(manifest);
      }
      continue;
    }
    const ignoreRoots = repoSyncWorkspaceIgnorePaths(rootDir, paths, repoRoot);
    const collected = await collectDirectoryFiles(rootDir, repoRoot, repoRoot, normalizedOptions);
    const files = collected.files.filter((absolutePath) => !ignoreRoots.some((ignoreRoot) => withinRoot(ignoreRoot, absolutePath)));
    skipped.push(
      ...collected.skipped,
      ...collected.files.filter((absolutePath) => ignoreRoots.some((ignoreRoot) => withinRoot(ignoreRoot, absolutePath))).map((absolutePath) => ({
        path: toPosix(path9.relative(rootDir, absolutePath)),
        reason: "workspace_generated"
      }))
    );
    scannedCount += files.length;
    const progress = createProgressReporter("sync", files.length);
    const currentPaths = new Set(files.map((absolutePath) => path9.resolve(absolutePath)));
    for (const absolutePath of files) {
      const relativePath = repoRelativePathFor(absolutePath, repoRoot) ?? toPosix(path9.relative(repoRoot, absolutePath));
      const preparedInputs = await prepareFileInputs(
        rootDir,
        absolutePath,
        repoRoot,
        sourceClassForRelativePath(relativePath, normalizedOptions)
      );
      const result = await persistPreparedInputs(rootDir, absolutePath, preparedInputs, paths, normalizedOptions.redactor);
      imported.push(...result.created);
      updated.push(...result.updated);
      removed.push(...result.removed);
      progress.tick();
    }
    progress.finish(`repo=${toPosix(path9.relative(rootDir, repoRoot)) || "."}`);
    for (const manifest of repoManifests) {
      const originalPath = manifest.originalPath ? path9.resolve(manifest.originalPath) : null;
      if (originalPath && !currentPaths.has(originalPath)) {
        await removeManifestArtifacts(rootDir, manifest, paths);
        removed.push(manifest);
      }
    }
  }
  if (uniqueRoots.length > 0) {
    await appendLogEntry(rootDir, "sync_repo", uniqueRoots.map((repoRoot) => toPosix(path9.relative(rootDir, repoRoot)) || ".").join(","), [
      `repo_roots=${uniqueRoots.length}`,
      `scanned=${scannedCount}`,
      `imported=${imported.length}`,
      `updated=${updated.length}`,
      `removed=${removed.length}`,
      `skipped=${skipped.length}`
    ]);
  }
  return {
    repoRoots: uniqueRoots,
    scannedCount,
    imported,
    updated,
    removed,
    skipped
  };
}
async function syncTrackedReposForWatch(rootDir, options, repoRoots) {
  const { paths } = await initWorkspace(rootDir);
  const normalizedOptions = await resolveRepoIngestOptions(rootDir, options);
  const manifests = await listManifests(rootDir);
  const trackedRoots = (repoRoots && repoRoots.length > 0 ? repoRoots : await listTrackedRepoRoots(rootDir)).map(
    (item) => path9.resolve(item)
  );
  const uniqueRoots = [...new Set(trackedRoots)].sort((left, right) => left.localeCompare(right));
  const manifestsByRepoRoot = /* @__PURE__ */ new Map();
  for (const manifest of manifests) {
    const repoRoot = repoRootFromManifest2(manifest);
    if (!repoRoot || !uniqueRoots.includes(path9.resolve(repoRoot))) {
      continue;
    }
    const key = path9.resolve(repoRoot);
    const bucket = manifestsByRepoRoot.get(key) ?? [];
    bucket.push(manifest);
    manifestsByRepoRoot.set(key, bucket);
  }
  const imported = [];
  const updated = [];
  const removed = [];
  const skipped = [];
  const pendingSemanticRefresh = [];
  const staleSourceIds = /* @__PURE__ */ new Set();
  let scannedCount = 0;
  for (const repoRoot of uniqueRoots) {
    const repoManifests = manifestsByRepoRoot.get(repoRoot) ?? [];
    if (!await fileExists(repoRoot)) {
      for (const manifest of repoManifests) {
        if (shouldDeferWatchSemanticRefresh(manifest.sourceKind)) {
          pendingSemanticRefresh.push({
            id: pendingSemanticRefreshId("removed", repoRoot, manifest.repoRelativePath ?? manifest.storedPath),
            repoRoot,
            path: toPosix(path9.relative(rootDir, manifest.originalPath ?? manifest.storedPath)),
            changeType: "removed",
            detectedAt: (/* @__PURE__ */ new Date()).toISOString(),
            sourceId: manifest.sourceId,
            sourceKind: manifest.sourceKind
          });
          staleSourceIds.add(manifest.sourceId);
        } else {
          await removeManifestArtifacts(rootDir, manifest, paths);
          removed.push(manifest);
        }
      }
      continue;
    }
    const ignoreRoots = repoSyncWorkspaceIgnorePaths(rootDir, paths, repoRoot);
    const collected = await collectDirectoryFiles(rootDir, repoRoot, repoRoot, normalizedOptions);
    const files = collected.files.filter((absolutePath) => !ignoreRoots.some((ignoreRoot) => withinRoot(ignoreRoot, absolutePath)));
    skipped.push(
      ...collected.skipped,
      ...collected.files.filter((absolutePath) => ignoreRoots.some((ignoreRoot) => withinRoot(ignoreRoot, absolutePath))).map((absolutePath) => ({
        path: toPosix(path9.relative(rootDir, absolutePath)),
        reason: "workspace_generated"
      }))
    );
    scannedCount += files.length;
    const progress = createProgressReporter("sync-watch", files.length);
    const currentPaths = new Set(files.map((absolutePath) => path9.resolve(absolutePath)));
    for (const absolutePath of files) {
      const relativePath = repoRelativePathFor(absolutePath, repoRoot) ?? toPosix(path9.relative(repoRoot, absolutePath));
      const preparedInputs = await prepareFileInputs(
        rootDir,
        absolutePath,
        repoRoot,
        sourceClassForRelativePath(relativePath, normalizedOptions)
      );
      const firstPrepared = preparedInputs[0];
      if (firstPrepared && shouldDeferWatchSemanticRefresh(firstPrepared.sourceKind)) {
        const existing = repoManifests.filter(
          (manifest) => manifest.originalPath && path9.resolve(manifest.originalPath) === path9.resolve(absolutePath)
        );
        const existingByPartKey = new Map(existing.map((manifest) => [manifest.sourcePartKey ?? "__single__", manifest]));
        const changed = existing.length !== preparedInputs.length || preparedInputs.some((prepared) => {
          const match = existingByPartKey.get(prepared.sourcePartKey ?? "__single__");
          const contentHash = buildCompositeHash(prepared.payloadBytes, prepared.attachments);
          return !match || !preparedMatchesManifest(match, prepared, contentHash);
        }) || existing.some(
          (manifest) => !preparedInputs.some((prepared) => (prepared.sourcePartKey ?? "") === (manifest.sourcePartKey ?? ""))
        );
        if (changed) {
          pendingSemanticRefresh.push({
            id: pendingSemanticRefreshId(
              existing.length ? "modified" : "added",
              repoRoot,
              firstPrepared.repoRelativePath ?? toPosix(path9.relative(repoRoot, absolutePath))
            ),
            repoRoot,
            path: toPosix(path9.relative(rootDir, absolutePath)),
            changeType: existing.length ? "modified" : "added",
            detectedAt: (/* @__PURE__ */ new Date()).toISOString(),
            sourceId: existing[0]?.sourceId,
            sourceKind: firstPrepared.sourceKind
          });
          for (const manifest of existing) {
            staleSourceIds.add(manifest.sourceId);
          }
        }
        progress.tick();
        continue;
      }
      const result = await persistPreparedInputs(rootDir, absolutePath, preparedInputs, paths, normalizedOptions.redactor);
      imported.push(...result.created);
      updated.push(...result.updated);
      removed.push(...result.removed);
      progress.tick();
    }
    progress.finish(`repo=${toPosix(path9.relative(rootDir, repoRoot)) || "."}`);
    for (const manifest of repoManifests) {
      const originalPath = manifest.originalPath ? path9.resolve(manifest.originalPath) : null;
      if (originalPath && !currentPaths.has(originalPath)) {
        if (shouldDeferWatchSemanticRefresh(manifest.sourceKind)) {
          pendingSemanticRefresh.push({
            id: pendingSemanticRefreshId("removed", repoRoot, manifest.repoRelativePath ?? toPosix(path9.relative(repoRoot, originalPath))),
            repoRoot,
            path: toPosix(path9.relative(rootDir, originalPath)),
            changeType: "removed",
            detectedAt: (/* @__PURE__ */ new Date()).toISOString(),
            sourceId: manifest.sourceId,
            sourceKind: manifest.sourceKind
          });
          staleSourceIds.add(manifest.sourceId);
        } else {
          await removeManifestArtifacts(rootDir, manifest, paths);
          removed.push(manifest);
        }
      }
    }
  }
  if (uniqueRoots.length > 0) {
    await appendLogEntry(
      rootDir,
      "sync_repo_watch",
      uniqueRoots.map((repoRoot) => toPosix(path9.relative(rootDir, repoRoot)) || ".").join(","),
      [
        `repo_roots=${uniqueRoots.length}`,
        `scanned=${scannedCount}`,
        `imported=${imported.length}`,
        `updated=${updated.length}`,
        `removed=${removed.length}`,
        `pending_semantic_refresh=${pendingSemanticRefresh.length}`,
        `skipped=${skipped.length}`
      ]
    );
  }
  return {
    repoRoots: uniqueRoots,
    scannedCount,
    imported,
    updated,
    removed,
    skipped,
    pendingSemanticRefresh: pendingSemanticRefresh.filter(
      (entry, index, items) => index === items.findIndex((candidate) => candidate.id === entry.id)
    ),
    staleSourceIds: [...staleSourceIds]
  };
}
async function prepareFileInputs(rootDir, absoluteInput, repoRoot, sourceClass) {
  const payloadBytes = await fs8.readFile(absoluteInput);
  if (path9.extname(absoluteInput).toLowerCase() === ".zip" && isSlackExportArchive(payloadBytes)) {
    const slackExport = await extractSlackExportArchive({ mimeType: "application/zip", bytes: payloadBytes, fileName: absoluteInput });
    if (slackExport.conversations.length) {
      return groupedPreparedInputsFor({
        title: slackExport.title?.trim() || path9.basename(absoluteInput, path9.extname(absoluteInput)),
        originType: "file",
        sourceKind: "chat_export",
        sourceClass,
        originalPath: toPosix(absoluteInput),
        repoRelativePath: repoRelativePathFor(absoluteInput, repoRoot),
        mimeType: "application/zip",
        storedExtension: ".md",
        warnings: slackExport.warnings,
        parts: slackExport.conversations
      });
    }
  }
  const mimeType = guessMimeType(absoluteInput);
  const detectionOptions = await localCodeDetectionOptions(absoluteInput, payloadBytes);
  const sourceKind = refineBinaryKindWithBytes(absoluteInput, inferKind(mimeType, absoluteInput, detectionOptions), payloadBytes);
  const language = inferCodeLanguage(absoluteInput, mimeType, detectionOptions);
  const storedExtension = path9.extname(absoluteInput) || `.${mime.extension(mimeType) || "bin"}`;
  let title;
  let extractedText;
  let extractionArtifact;
  if (sourceKind === "markdown" || sourceKind === "text" || sourceKind === "code") {
    const rawText = payloadBytes.toString("utf8");
    extractedText = sourceKind === "markdown" ? semanticMarkdownContent(rawText).extractedText : extractedTextForPlainSource(absoluteInput, sourceKind, rawText);
    title = sourceKind === "markdown" ? semanticMarkdownTitle(path9.basename(absoluteInput, path9.extname(absoluteInput)), rawText, absoluteInput) : titleFromText(path9.basename(absoluteInput, path9.extname(absoluteInput)), extractedText, absoluteInput);
    extractionArtifact = createPlainTextExtractionArtifact(sourceKind, mimeType);
  } else if (sourceKind === "html") {
    const html = payloadBytes.toString("utf8");
    const converted = await convertHtmlToMarkdown(html, pathToFileURL(absoluteInput).toString());
    title = converted.title;
    extractedText = semanticMarkdownContent(converted.markdown).extractedText;
    extractionArtifact = createHtmlReadabilityExtractionArtifact(sourceKind, mimeType);
  } else if (sourceKind === "pdf") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractPdfText({ mimeType, bytes: payloadBytes });
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "docx") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractDocxText({ mimeType, bytes: payloadBytes });
    title = extracted.artifact.metadata?.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "transcript") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractTranscriptText({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "email" && path9.extname(absoluteInput).toLowerCase() === ".eml") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractEmailText({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "email" && path9.extname(absoluteInput).toLowerCase() === ".mbox") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractMboxMessages({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    if (extracted.messages.length) {
      return groupedPreparedInputsFor({
        title,
        originType: "file",
        sourceKind: "email",
        sourceClass,
        originalPath: toPosix(absoluteInput),
        repoRelativePath: repoRelativePathFor(absoluteInput, repoRoot),
        mimeType,
        storedExtension: ".md",
        warnings: extracted.warnings,
        parts: extracted.messages
      });
    }
    extractionArtifact = {
      extractor: "email_text",
      sourceKind: "email",
      mimeType,
      producedAt: (/* @__PURE__ */ new Date()).toISOString(),
      warnings: extracted.warnings ?? ["Mailbox extraction completed but produced no readable messages."]
    };
  } else if (sourceKind === "calendar") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractCalendarEvents({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    if (extracted.events.length) {
      return groupedPreparedInputsFor({
        title,
        originType: "file",
        sourceKind: "calendar",
        sourceClass,
        originalPath: toPosix(absoluteInput),
        repoRelativePath: repoRelativePathFor(absoluteInput, repoRoot),
        mimeType,
        storedExtension: ".md",
        warnings: extracted.warnings,
        parts: extracted.events
      });
    }
    extractionArtifact = {
      extractor: "calendar_text",
      sourceKind: "calendar",
      mimeType,
      producedAt: (/* @__PURE__ */ new Date()).toISOString(),
      warnings: extracted.warnings ?? ["Calendar extraction completed but found no events."]
    };
  } else if (sourceKind === "csv") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractCsvText({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "xlsx") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractXlsxText({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "pptx") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractPptxText({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "jupyter") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractJupyterNotebook({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "odt") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractOdtText({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "odp") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractOdpText({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "ods") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractOdsText({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "data") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractStructuredData({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "bibtex") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractBibTeXText({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "rtf") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractRtfText({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "org") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractOrgText({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "asciidoc") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractAsciiDocText({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "epub") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractEpubChapters({ mimeType, bytes: payloadBytes, fileName: absoluteInput });
    title = extracted.title?.trim() || title;
    if (extracted.chapters.length) {
      return groupedPreparedInputsFor({
        title,
        originType: "file",
        sourceKind: "epub",
        sourceClass,
        originalPath: toPosix(absoluteInput),
        repoRelativePath: repoRelativePathFor(absoluteInput, repoRoot),
        mimeType,
        storedExtension: ".md",
        warnings: extracted.warnings,
        parts: extracted.chapters.map((chapter) => ({
          ...chapter,
          metadata: {
            ...chapter.metadata,
            ...extracted.author ? { author: extracted.author } : {}
          }
        }))
      });
    }
    extractedText = void 0;
    extractionArtifact = {
      extractor: "epub_text",
      sourceKind: "epub",
      mimeType,
      producedAt: (/* @__PURE__ */ new Date()).toISOString(),
      warnings: extracted.warnings ?? ["EPUB extraction completed but produced no chapter content."]
    };
  } else if (sourceKind === "image") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractImageWithVision(rootDir, {
      title,
      mimeType,
      filePath: absoluteInput
    });
    title = extracted.title?.trim() || title;
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "audio") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractAudioTranscription(rootDir, {
      mimeType,
      bytes: payloadBytes,
      fileName: absoluteInput
    });
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else if (sourceKind === "video") {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
    const extracted = await extractVideoTranscription(rootDir, {
      mimeType,
      bytes: payloadBytes,
      fileName: absoluteInput
    });
    extractedText = extracted.extractedText;
    extractionArtifact = extracted.artifact;
  } else {
    title = path9.basename(absoluteInput, path9.extname(absoluteInput));
  }
  return [
    finalizePreparedInput({
      title,
      originType: "file",
      sourceKind,
      sourceClass,
      language,
      originalPath: toPosix(absoluteInput),
      repoRelativePath: repoRelativePathFor(absoluteInput, repoRoot),
      mimeType,
      storedExtension,
      payloadBytes,
      extractedText,
      extractionArtifact,
      extractionHash: buildExtractionHash(extractedText, extractionArtifact),
      details: extractionArtifact?.metadata
    })
  ];
}
async function prepareFileInput(rootDir, absoluteInput, repoRoot, sourceClass) {
  const prepared = await prepareFileInputs(rootDir, absoluteInput, repoRoot, sourceClass);
  if (!prepared.length) {
    throw new Error(`No ingestable sources were extracted from ${absoluteInput}.`);
  }
  return prepared[0];
}
async function prepareUrlInputs(rootDir, input, options) {
  await validateUrlSafety(input);
  if (options.video) {
    const extracted = await extractPublicVideoTranscription(rootDir, { url: input });
    const finalUrl2 = normalizeOriginUrl(input);
    const inputUrl2 = new URL(finalUrl2);
    const title2 = extracted.title?.trim() || inputUrl2.hostname + inputUrl2.pathname;
    const extractedText2 = extracted.extractedText;
    const payloadBytes2 = Buffer.from(extractedText2 ?? "", "utf8");
    return [
      finalizePreparedInput({
        title: title2,
        originType: "url",
        sourceKind: "video",
        url: finalUrl2,
        mimeType: "video/url",
        storedExtension: ".md",
        payloadBytes: payloadBytes2,
        payloadIsText: true,
        extractedText: extractedText2,
        extractionArtifact: extracted.artifact,
        extractionHash: buildExtractionHash(extractedText2, extracted.artifact),
        details: extracted.artifact.metadata
      })
    ];
  }
  const youtubeVideoId = parseYoutubeVideoId(input);
  if (youtubeVideoId) {
    const extracted = await extractYoutubeTranscript({ videoId: youtubeVideoId, url: input });
    const title2 = extracted.title ?? `YouTube ${youtubeVideoId}`;
    const extractedText2 = extracted.extractedText;
    const payloadBytes2 = Buffer.from(extractedText2 ?? "", "utf8");
    return [
      finalizePreparedInput({
        title: title2,
        originType: "url",
        sourceKind: "youtube",
        url: normalizeOriginUrl(input),
        mimeType: "text/html",
        storedExtension: ".md",
        payloadBytes: payloadBytes2,
        payloadIsText: true,
        extractedText: extractedText2,
        extractionArtifact: extracted.artifact,
        extractionHash: buildExtractionHash(extractedText2, extracted.artifact),
        details: extracted.artifact.metadata
      })
    ];
  }
  const response = await fetch(input);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${input}: ${response.status} ${response.statusText}`);
  }
  const finalUrl = normalizeOriginUrl(response.url || input);
  const inputUrl = new URL(finalUrl);
  const originalPayloadBytes = Buffer.from(await response.arrayBuffer());
  if (path9.extname(inputUrl.pathname).toLowerCase() === ".zip" && isSlackExportArchive(originalPayloadBytes)) {
    const slackExport = await extractSlackExportArchive({
      mimeType: "application/zip",
      bytes: originalPayloadBytes,
      fileName: inputUrl.pathname
    });
    if (slackExport.conversations.length) {
      return groupedPreparedInputsFor({
        title: slackExport.title?.trim() || inputUrl.hostname,
        originType: "url",
        sourceKind: "chat_export",
        url: finalUrl,
        mimeType: "application/zip",
        storedExtension: ".md",
        warnings: slackExport.warnings,
        parts: slackExport.conversations
      });
    }
  }
  let payloadBytes = originalPayloadBytes;
  let mimeType = resolveUrlMimeType(input, response);
  let sourceKind = inferKind(mimeType, inputUrl.pathname);
  const language = inferCodeLanguage(inputUrl.pathname, mimeType);
  let storedExtension = ".bin";
  let title = inputUrl.hostname + inputUrl.pathname;
  let extractedText;
  let extractionArtifact;
  let attachments;
  let contentHash;
  const logDetails = [];
  if (sourceKind === "html" || mimeType.startsWith("text/html")) {
    const html = originalPayloadBytes.toString("utf8");
    const initialConversion = await convertHtmlToMarkdown(html, finalUrl);
    title = initialConversion.title;
    let localizedHtml = html;
    let localAssetReplacements;
    if (options.includeAssets) {
      const { attachments: remoteAttachments, skippedCount } = await collectRemoteImageAttachments(
        extractHtmlImageReferences(html, finalUrl),
        options
      );
      if (remoteAttachments.length) {
        attachments = remoteAttachments;
        contentHash = buildCompositeHash(originalPayloadBytes, remoteAttachments);
        const sourceId = `${slugify(title)}-${contentHash.slice(0, 8)}`;
        localAssetReplacements = new Map(
          remoteAttachments.map((attachment) => [attachment.originalPath ?? "", `../assets/${sourceId}/${attachment.relativePath}`])
        );
        localizedHtml = rewriteHtmlImageReferences(html, finalUrl, localAssetReplacements);
        logDetails.push(`remote_assets=${remoteAttachments.length}`);
      }
      if (skippedCount) {
        logDetails.push(`remote_asset_skips=${skippedCount}`);
      }
    }
    const converted = localizedHtml === html && !attachments?.length ? initialConversion : await convertHtmlToMarkdown(localizedHtml, finalUrl);
    extractedText = converted.markdown;
    extractionArtifact = createHtmlReadabilityExtractionArtifact("markdown", "text/markdown");
    if (localAssetReplacements?.size) {
      const absoluteLocalAssetReplacements = new Map(
        [...localAssetReplacements.values()].map((replacement) => [new URL(replacement, finalUrl).toString(), replacement])
      );
      extractedText = rewriteMarkdownImageTargets(extractedText, absoluteLocalAssetReplacements);
    }
    payloadBytes = Buffer.from(extractedText, "utf8");
    mimeType = "text/markdown";
    sourceKind = "markdown";
    storedExtension = ".md";
  } else {
    const extension = path9.extname(inputUrl.pathname);
    storedExtension = extension || `.${mime.extension(mimeType) || "bin"}`;
    if (sourceKind === "markdown" || sourceKind === "text" || sourceKind === "code") {
      const rawText = payloadBytes.toString("utf8");
      extractedText = sourceKind === "markdown" ? semanticMarkdownContent(rawText).extractedText : extractedTextForPlainSource(inputUrl.pathname, sourceKind, rawText);
      title = sourceKind === "markdown" ? semanticMarkdownTitle(title || inputUrl.hostname, rawText, inputUrl.pathname) : titleFromText(title || inputUrl.hostname, extractedText, inputUrl.pathname);
      extractionArtifact = createPlainTextExtractionArtifact(sourceKind, mimeType);
      if (sourceKind === "markdown" && options.includeAssets) {
        const { attachments: remoteAttachments, skippedCount } = await collectRemoteImageAttachments(
          extractMarkdownImageReferences(extractedText, finalUrl),
          options
        );
        if (remoteAttachments.length) {
          attachments = remoteAttachments;
          contentHash = buildCompositeHash(originalPayloadBytes, remoteAttachments);
          const sourceId = `${slugify(title)}-${contentHash.slice(0, 8)}`;
          const replacements = new Map(
            remoteAttachments.map((attachment) => [attachment.originalPath ?? "", `../assets/${sourceId}/${attachment.relativePath}`])
          );
          extractedText = rewriteMarkdownImageReferences(extractedText, finalUrl, replacements);
          payloadBytes = Buffer.from(extractedText, "utf8");
          logDetails.push(`remote_assets=${remoteAttachments.length}`);
        }
        if (skippedCount) {
          logDetails.push(`remote_asset_skips=${skippedCount}`);
        }
      }
    } else if (sourceKind === "pdf") {
      const extracted = await extractPdfText({ mimeType, bytes: payloadBytes });
      extractedText = extracted.extractedText;
      extractionArtifact = extracted.artifact;
    } else if (sourceKind === "docx") {
      const extracted = await extractDocxText({ mimeType, bytes: payloadBytes });
      title = extracted.artifact.metadata?.title?.trim() || title;
      extractedText = extracted.extractedText;
      extractionArtifact = extracted.artifact;
    } else if (sourceKind === "transcript") {
      const extracted = await extractTranscriptText({ mimeType, bytes: payloadBytes, fileName: inputUrl.pathname });
      title = extracted.title?.trim() || title;
      extractedText = extracted.extractedText;
      extractionArtifact = extracted.artifact;
    } else if (sourceKind === "email" && path9.extname(inputUrl.pathname).toLowerCase() === ".eml") {
      const extracted = await extractEmailText({ mimeType, bytes: payloadBytes, fileName: inputUrl.pathname });
      title = extracted.title?.trim() || title;
      extractedText = extracted.extractedText;
      extractionArtifact = extracted.artifact;
    } else if (sourceKind === "email" && path9.extname(inputUrl.pathname).toLowerCase() === ".mbox") {
      const extracted = await extractMboxMessages({ mimeType, bytes: payloadBytes, fileName: inputUrl.pathname });
      title = extracted.title?.trim() || title;
      if (extracted.messages.length) {
        return groupedPreparedInputsFor({
          title,
          originType: "url",
          sourceKind: "email",
          url: finalUrl,
          mimeType,
          storedExtension: ".md",
          warnings: extracted.warnings,
          parts: extracted.messages
        });
      }
      extractionArtifact = {
        extractor: "email_text",
        sourceKind: "email",
        mimeType,
        producedAt: (/* @__PURE__ */ new Date()).toISOString(),
        warnings: extracted.warnings ?? ["Mailbox extraction completed but produced no readable messages."]
      };
    } else if (sourceKind === "calendar") {
      const extracted = await extractCalendarEvents({ mimeType, bytes: payloadBytes, fileName: inputUrl.pathname });
      title = extracted.title?.trim() || title;
      if (extracted.events.length) {
        return groupedPreparedInputsFor({
          title,
          originType: "url",
          sourceKind: "calendar",
          url: finalUrl,
          mimeType,
          storedExtension: ".md",
          warnings: extracted.warnings,
          parts: extracted.events
        });
      }
      extractionArtifact = {
        extractor: "calendar_text",
        sourceKind: "calendar",
        mimeType,
        producedAt: (/* @__PURE__ */ new Date()).toISOString(),
        warnings: extracted.warnings ?? ["Calendar extraction completed but found no events."]
      };
    } else if (sourceKind === "csv") {
      const extracted = await extractCsvText({ mimeType, bytes: payloadBytes, fileName: inputUrl.pathname });
      title = extracted.title?.trim() || title;
      extractedText = extracted.extractedText;
      extractionArtifact = extracted.artifact;
    } else if (sourceKind === "xlsx") {
      const extracted = await extractXlsxText({ mimeType, bytes: payloadBytes, fileName: inputUrl.pathname });
      title = extracted.title?.trim() || title;
      extractedText = extracted.extractedText;
      extractionArtifact = extracted.artifact;
    } else if (sourceKind === "pptx") {
      const extracted = await extractPptxText({ mimeType, bytes: payloadBytes, fileName: inputUrl.pathname });
      title = extracted.title?.trim() || title;
      extractedText = extracted.extractedText;
      extractionArtifact = extracted.artifact;
    } else if (sourceKind === "epub") {
      const extracted = await extractEpubChapters({ mimeType, bytes: payloadBytes, fileName: inputUrl.pathname });
      title = extracted.title?.trim() || title;
      if (extracted.chapters.length) {
        return groupedPreparedInputsFor({
          title,
          originType: "url",
          sourceKind: "epub",
          url: finalUrl,
          mimeType,
          storedExtension: ".md",
          warnings: extracted.warnings,
          parts: extracted.chapters.map((chapter) => ({
            ...chapter,
            metadata: {
              ...chapter.metadata,
              ...extracted.author ? { author: extracted.author } : {}
            }
          })),
          logDetails
        });
      }
      extractionArtifact = {
        extractor: "epub_text",
        sourceKind: "epub",
        mimeType,
        producedAt: (/* @__PURE__ */ new Date()).toISOString(),
        warnings: extracted.warnings ?? ["EPUB extraction completed but produced no chapter content."]
      };
    } else if (sourceKind === "image") {
      const extracted = await extractImageWithVision(rootDir, {
        title,
        mimeType,
        bytes: payloadBytes
      });
      title = extracted.title?.trim() || title;
      extractedText = extracted.extractedText;
      extractionArtifact = extracted.artifact;
    } else if (sourceKind === "audio") {
      const extracted = await extractAudioTranscription(rootDir, {
        mimeType,
        bytes: payloadBytes,
        fileName: inputUrl.pathname
      });
      extractedText = extracted.extractedText;
      extractionArtifact = extracted.artifact;
    }
  }
  return [
    finalizePreparedInput({
      title,
      originType: "url",
      sourceKind,
      language,
      url: finalUrl,
      mimeType,
      storedExtension,
      payloadBytes,
      extractedText,
      extractionArtifact,
      extractionHash: buildExtractionHash(extractedText, extractionArtifact),
      attachments,
      contentHash,
      details: extractionArtifact?.metadata,
      logDetails
    })
  ];
}
async function prepareUrlInput(rootDir, input, options) {
  const prepared = await prepareUrlInputs(rootDir, input, options);
  if (!prepared.length) {
    throw new Error(`No ingestable sources were extracted from ${input}.`);
  }
  return prepared[0];
}
async function collectInboxAttachmentRefs(inputDir, files) {
  const refsBySource = /* @__PURE__ */ new Map();
  for (const absolutePath of files) {
    const mimeType = guessMimeType(absolutePath);
    const detectionOptions = await localCodeDetectionOptions(absolutePath);
    let sourceKind = inferKind(mimeType, absolutePath, detectionOptions);
    const lowerExt = path9.extname(absolutePath).toLowerCase();
    if ((lowerExt === ".html" || lowerExt === ".htm") && sourceKind === "code") {
      sourceKind = "html";
    }
    if (sourceKind !== "markdown" && sourceKind !== "html") {
      continue;
    }
    const content = await fs8.readFile(absolutePath, "utf8");
    const refs = sourceKind === "html" ? extractHtmlLocalReferences(content, pathToFileURL(absolutePath).toString()) : extractMarkdownReferences(content);
    if (!refs.length) {
      continue;
    }
    const sourceRefs = [];
    for (const ref of refs) {
      const resolved = path9.resolve(path9.dirname(absolutePath), ref);
      if (!isPathWithin(inputDir, resolved) || !await fileExists(resolved)) {
        continue;
      }
      sourceRefs.push({
        absolutePath: resolved,
        relativeRef: ref
      });
    }
    if (sourceRefs.length) {
      refsBySource.set(
        absolutePath,
        sourceRefs.filter(
          (ref, index, items) => index === items.findIndex((candidate) => candidate.absolutePath === ref.absolutePath && candidate.relativeRef === ref.relativeRef)
        )
      );
    }
  }
  return refsBySource;
}
function rewriteMarkdownReferences(content, replacements) {
  return content.replace(/(!?\[[^\]]*]\()([^)]+)(\))/g, (fullMatch, prefix, target, suffix) => {
    const normalized = normalizeLocalReference(target);
    if (!normalized) {
      return fullMatch;
    }
    const replacement = replacements.get(normalized);
    if (!replacement) {
      return fullMatch;
    }
    return `${prefix}${replacement}${suffix}`;
  });
}
async function prepareInboxMarkdownInput(absolutePath, attachmentRefs) {
  const originalBytes = await fs8.readFile(absolutePath);
  const originalText = originalBytes.toString("utf8");
  const title = titleFromText(path9.basename(absolutePath, path9.extname(absolutePath)), originalText);
  const attachments = [];
  for (const attachmentRef of attachmentRefs) {
    const bytes = await fs8.readFile(attachmentRef.absolutePath);
    attachments.push({
      relativePath: sanitizeAssetRelativePath(attachmentRef.relativeRef),
      mimeType: guessMimeType(attachmentRef.absolutePath),
      originalPath: toPosix(attachmentRef.absolutePath),
      bytes
    });
  }
  const contentHash = buildCompositeHash(originalBytes, attachments);
  const sourceId = `${slugify(title)}-${contentHash.slice(0, 8)}`;
  const replacements = new Map(
    attachmentRefs.map((attachmentRef) => [
      attachmentRef.relativeRef.replace(/\\/g, "/"),
      `../assets/${sourceId}/${sanitizeAssetRelativePath(attachmentRef.relativeRef)}`
    ])
  );
  const rewrittenText = rewriteMarkdownReferences(originalText, replacements);
  const extractionArtifact = createPlainTextExtractionArtifact("markdown", "text/markdown");
  return finalizePreparedInput({
    title,
    originType: "file",
    sourceKind: "markdown",
    originalPath: toPosix(absolutePath),
    mimeType: "text/markdown",
    storedExtension: path9.extname(absolutePath) || ".md",
    payloadBytes: Buffer.from(rewrittenText, "utf8"),
    extractedText: rewrittenText,
    extractionArtifact,
    extractionHash: buildExtractionHash(rewrittenText, extractionArtifact),
    attachments,
    contentHash
  });
}
async function prepareInboxHtmlInput(absolutePath, attachmentRefs) {
  const originalBytes = await fs8.readFile(absolutePath);
  const originalHtml = originalBytes.toString("utf8");
  const initialConversion = await convertHtmlToMarkdown(originalHtml, pathToFileURL(absolutePath).toString());
  const attachments = [];
  for (const attachmentRef of attachmentRefs) {
    const bytes = await fs8.readFile(attachmentRef.absolutePath);
    attachments.push({
      relativePath: sanitizeAssetRelativePath(attachmentRef.relativeRef),
      mimeType: guessMimeType(attachmentRef.absolutePath),
      originalPath: toPosix(attachmentRef.absolutePath),
      bytes
    });
  }
  const contentHash = buildCompositeHash(originalBytes, attachments);
  const fallbackTitle = path9.basename(absolutePath, path9.extname(absolutePath));
  const title = initialConversion.title || fallbackTitle;
  const sourceId = `${slugify(title)}-${contentHash.slice(0, 8)}`;
  const replacements = new Map(
    attachmentRefs.map((attachmentRef) => [
      attachmentRef.relativeRef.replace(/\\/g, "/"),
      `../assets/${sourceId}/${sanitizeAssetRelativePath(attachmentRef.relativeRef)}`
    ])
  );
  const rewrittenHtml = rewriteHtmlLocalReferences(originalHtml, pathToFileURL(absolutePath).toString(), replacements);
  const converted = rewrittenHtml === originalHtml ? initialConversion : await convertHtmlToMarkdown(rewrittenHtml, pathToFileURL(absolutePath).toString());
  const extractionArtifact = createHtmlReadabilityExtractionArtifact("html", "text/html");
  return {
    title: converted.title || title,
    originType: "file",
    sourceKind: "html",
    originalPath: toPosix(absolutePath),
    mimeType: "text/html",
    storedExtension: path9.extname(absolutePath) || ".html",
    payloadBytes: Buffer.from(rewrittenHtml, "utf8"),
    extractedText: converted.markdown,
    extractionArtifact,
    extractionHash: buildExtractionHash(converted.markdown, extractionArtifact),
    attachments,
    contentHash
  };
}
function isSupportedInboxKind(sourceKind) {
  return [
    "markdown",
    "text",
    "html",
    "pdf",
    "docx",
    "epub",
    "csv",
    "xlsx",
    "pptx",
    "transcript",
    "chat_export",
    "email",
    "calendar",
    "image",
    "audio",
    "video"
  ].includes(sourceKind);
}
async function ingestInputDetailed(rootDir, input, options) {
  const { paths } = await initWorkspace(rootDir);
  const normalizedOptions = await attachIngestRedactor(rootDir, normalizeIngestOptions(options));
  const absoluteInput = path9.resolve(rootDir, input);
  const repoRoot = isHttpUrl(input) || normalizedOptions.repoRoot ? normalizedOptions.repoRoot : await detectScopedRepoRoot(rootDir, absoluteInput, path9.dirname(absoluteInput));
  const prepared = isHttpUrl(input) ? await prepareUrlInputs(rootDir, input, normalizedOptions) : await prepareFileInputs(rootDir, absoluteInput, repoRoot);
  return await persistPreparedInputs(rootDir, input, prepared, paths, normalizedOptions.redactor);
}
async function ingestInput(rootDir, input, options) {
  const result = await ingestInputDetailed(rootDir, input, options);
  const manifest = [...result.created, ...result.updated, ...result.unchanged][0];
  if (!manifest) {
    throw new Error(`No source manifests were created or updated for ${input}.`);
  }
  return manifest;
}
async function addInput(rootDir, input, options = {}) {
  const { paths, config } = await initWorkspace(rootDir);
  const redactor = resolveIngestRedactor(config, options);
  if (!isHttpUrl(input) && !arxivIdFromInput(input) && !doiFromInput(input)) {
    throw new Error("`swarmvault add` only supports URLs, bare arXiv ids, and bare DOI strings in the current release.");
  }
  if (options.video && isHttpUrl(input)) {
    const manifest = await ingestInput(rootDir, input, options);
    return {
      captureType: "url",
      manifest,
      normalizedUrl: normalizeOriginUrl(input),
      title: manifest.title,
      fallback: false
    };
  }
  let prepared = null;
  let captureType = "url";
  let normalizedUrl = input;
  let fallback = false;
  try {
    if (arxivIdFromInput(input)) {
      const captured = await captureArxivMarkdown(input, options);
      prepared = prepareCapturedMarkdownInput({
        title: captured.title,
        url: captured.normalizedUrl,
        markdown: captured.markdown,
        sourceType: "arxiv",
        logDetails: ["capture_type=arxiv"]
      });
      captureType = "arxiv";
      normalizedUrl = captured.normalizedUrl;
    } else if (doiFromInput(input)) {
      const captured = await captureDoiMarkdown(rootDir, input, options);
      prepared = prepareCapturedMarkdownInput({
        title: captured.title,
        url: captured.normalizedUrl,
        markdown: captured.markdown,
        sourceType: "doi",
        attachments: captured.attachments,
        logDetails: ["capture_type=doi"]
      });
      captureType = "doi";
      normalizedUrl = captured.normalizedUrl;
    } else if (isTweetUrl(input)) {
      const captured = await captureTweetMarkdown(input, options);
      prepared = prepareCapturedMarkdownInput({
        title: captured.title,
        url: captured.normalizedUrl,
        markdown: captured.markdown,
        sourceType: "tweet",
        logDetails: ["capture_type=tweet"]
      });
      captureType = "tweet";
      normalizedUrl = captured.normalizedUrl;
    } else if (isHttpUrl(input)) {
      const captured = await captureArticleMarkdown(rootDir, input, options, {
        sourceType: "article",
        sourceUrl: input
      });
      prepared = prepareCapturedMarkdownInput({
        title: captured.title,
        url: captured.normalizedUrl,
        markdown: captured.markdown,
        sourceType: "article",
        attachments: captured.attachments,
        logDetails: ["capture_type=article"]
      });
      captureType = "article";
      normalizedUrl = captured.normalizedUrl;
    }
  } catch {
    fallback = true;
  }
  if (!prepared) {
    normalizedUrl = arxivIdFromInput(input) ? `https://arxiv.org/abs/${arxivIdFromInput(input)}` : doiFromInput(input) ? `https://doi.org/${encodeURIComponent(doiFromInput(input) ?? "")}` : normalizeOriginUrl(input);
    return {
      captureType: "url",
      manifest: await ingestInput(rootDir, normalizedUrl, options),
      normalizedUrl,
      title: normalizedUrl,
      fallback: true
    };
  }
  const result = await persistPreparedInput(rootDir, prepared, paths, redactor);
  return {
    captureType,
    manifest: result.manifest,
    normalizedUrl,
    title: prepared.title,
    fallback
  };
}
async function ingestDirectory(rootDir, inputDir, options) {
  const { paths } = await initWorkspace(rootDir);
  const normalizedOptions = await resolveRepoIngestOptions(rootDir, options);
  const absoluteInputDir = path9.resolve(rootDir, inputDir);
  const repoRoot = normalizedOptions.repoRoot ?? await detectScopedRepoRoot(rootDir, absoluteInputDir, absoluteInputDir);
  if (!await fileExists(absoluteInputDir)) {
    throw new Error(`Directory not found: ${absoluteInputDir}`);
  }
  if (await isSlackExportDirectory(absoluteInputDir)) {
    const extracted = await extractSlackExportDirectory(absoluteInputDir);
    const preparedInputs = groupedPreparedInputsFor({
      title: extracted.title?.trim() || path9.basename(absoluteInputDir),
      originType: "file",
      sourceKind: "chat_export",
      originalPath: toPosix(absoluteInputDir),
      mimeType: "application/json",
      storedExtension: ".md",
      warnings: extracted.warnings,
      parts: extracted.conversations
    });
    const result = await persistPreparedInputs(rootDir, absoluteInputDir, preparedInputs, paths, normalizedOptions.redactor);
    await appendLogEntry(rootDir, "ingest_directory", toPosix(path9.relative(rootDir, absoluteInputDir)) || ".", [
      `repo_root=${toPosix(path9.relative(rootDir, repoRoot)) || "."}`,
      `scanned=${preparedInputs.length}`,
      `imported=${result.created.length}`,
      `updated=${result.updated.length}`,
      `skipped=${result.skipped.length}`
    ]);
    return {
      inputDir: absoluteInputDir,
      repoRoot,
      scannedCount: preparedInputs.length,
      imported: result.created,
      updated: result.updated,
      skipped: result.skipped,
      redactions: result.redactions
    };
  }
  const collected = await collectDirectoryFiles(rootDir, absoluteInputDir, repoRoot, normalizedOptions);
  const skipped = collected.skipped;
  let files = collected.files;
  const resumeState = await loadIngestRunState(paths.stateDir, normalizedOptions.resume);
  if (resumeState) {
    const failedSet = new Set(resumeState.failed.map((entry) => entry.absolutePath));
    files = files.filter((absolutePath) => failedSet.has(absolutePath));
  }
  const runId = resumeState?.runId ?? buildIngestRunId();
  const imported = [];
  const updated = [];
  const failed = [];
  const failedRecords = [];
  const redactions = [];
  const progress = createProgressReporter("ingest", files.length);
  for (const absolutePath of files) {
    const relativeForLog = toPosix(path9.relative(rootDir, absolutePath));
    const relativePath = repoRelativePathFor(absolutePath, repoRoot) ?? toPosix(path9.relative(repoRoot, absolutePath));
    let preparedInputs;
    try {
      preparedInputs = await prepareFileInputs(
        rootDir,
        absolutePath,
        repoRoot,
        sourceClassForRelativePath(relativePath, normalizedOptions)
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push({ path: relativeForLog, error: message, stage: "prepare" });
      failedRecords.push({ absolutePath, path: relativeForLog, error: message, stage: "prepare" });
      progress.tick();
      continue;
    }
    try {
      const result = await persistPreparedInputs(rootDir, absolutePath, preparedInputs, paths, normalizedOptions.redactor);
      if (result.created.length) imported.push(...result.created);
      if (result.updated.length) updated.push(...result.updated);
      if (result.redactions?.length) redactions.push(...result.redactions);
      if (!result.created.length && !result.updated.length && !result.removed.length) {
        skipped.push({ path: relativeForLog, reason: "duplicate_content" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push({ path: relativeForLog, error: message, stage: "persist" });
      failedRecords.push({ absolutePath, path: relativeForLog, error: message, stage: "persist" });
    }
    progress.tick();
  }
  progress.finish(`imported=${imported.length}, updated=${updated.length}, skipped=${skipped.length}, failed=${failed.length}`);
  let statePath;
  if (failed.length) {
    statePath = await saveIngestRunState(paths.stateDir, {
      runId,
      inputDir: absoluteInputDir,
      repoRoot,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      failed: failedRecords
    });
  } else if (resumeState) {
    await clearIngestRunState(paths.stateDir, resumeState.runId);
  }
  await appendLogEntry(rootDir, "ingest_directory", toPosix(path9.relative(rootDir, absoluteInputDir)) || ".", [
    `repo_root=${toPosix(path9.relative(rootDir, repoRoot)) || "."}`,
    `run_id=${runId}`,
    `scanned=${files.length}`,
    `imported=${imported.length}`,
    `updated=${updated.length}`,
    `skipped=${skipped.length}`,
    `failed=${failed.length}`
  ]);
  return {
    inputDir: absoluteInputDir,
    repoRoot,
    scannedCount: files.length,
    imported,
    updated,
    skipped,
    failed,
    runId,
    statePath,
    redactions: redactions.length ? redactions : void 0
  };
}
async function importInbox(rootDir, inputDir) {
  const { paths, config } = await initWorkspace(rootDir);
  const redactor = resolveIngestRedactor(config, void 0);
  const effectiveInputDir = path9.resolve(rootDir, inputDir ?? paths.inboxDir);
  if (!await fileExists(effectiveInputDir)) {
    throw new Error(`Inbox directory not found: ${effectiveInputDir}`);
  }
  const files = (await listFilesRecursive(effectiveInputDir)).sort();
  const refsBySource = await collectInboxAttachmentRefs(effectiveInputDir, files);
  const claimedAttachments = new Set([...refsBySource.values()].flatMap((refs) => refs.map((ref) => ref.absolutePath)));
  const imported = [];
  const skipped = [];
  let attachmentCount = 0;
  for (const absolutePath of files) {
    const basename = path9.basename(absolutePath);
    if (basename.startsWith(".")) {
      skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: "hidden_file" });
      continue;
    }
    if (claimedAttachments.has(absolutePath)) {
      skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: "referenced_attachment" });
      continue;
    }
    const mimeType = guessMimeType(absolutePath);
    const detectionOptions = await localCodeDetectionOptions(absolutePath);
    let sourceKind = inferKind(mimeType, absolutePath, detectionOptions);
    const lowerExt = path9.extname(absolutePath).toLowerCase();
    if ((lowerExt === ".html" || lowerExt === ".htm") && sourceKind === "code") {
      sourceKind = "html";
    }
    if (sourceKind === "binary" && lowerExt === ".zip") {
      const bytes = await fs8.readFile(absolutePath);
      if (isSlackExportArchive(bytes)) {
        sourceKind = "chat_export";
      }
    }
    sourceKind = await refineBinaryKindWithContentSniff(absolutePath, sourceKind);
    if (!isSupportedInboxKind(sourceKind)) {
      skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: `unsupported_kind:${sourceKind}` });
      continue;
    }
    const prepared = sourceKind === "markdown" && refsBySource.has(absolutePath) ? await prepareInboxMarkdownInput(absolutePath, refsBySource.get(absolutePath) ?? []) : sourceKind === "html" && refsBySource.has(absolutePath) ? await prepareInboxHtmlInput(absolutePath, refsBySource.get(absolutePath) ?? []) : await prepareFileInput(rootDir, absolutePath);
    const result = await persistPreparedInputs(rootDir, absolutePath, [prepared], paths, redactor);
    if (!result.created.length) {
      skipped.push({ path: toPosix(path9.relative(rootDir, absolutePath)), reason: "duplicate_content" });
      continue;
    }
    attachmentCount += result.created.reduce((total, manifest) => total + (manifest.attachments?.length ?? 0), 0);
    imported.push(...result.created);
  }
  await appendLogEntry(rootDir, "inbox_import", toPosix(path9.relative(rootDir, effectiveInputDir)) || ".", [
    `scanned=${files.length}`,
    `imported=${imported.length}`,
    `attachments=${attachmentCount}`,
    `skipped=${skipped.length}`
  ]);
  return {
    inputDir: effectiveInputDir,
    scannedCount: files.length,
    attachmentCount,
    imported,
    skipped
  };
}
async function listManifests(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  if (!await fileExists(paths.manifestsDir)) {
    return [];
  }
  const entries = await fs8.readdir(paths.manifestsDir);
  const manifests = await Promise.all(
    entries.filter((entry) => entry.endsWith(".json")).map((entry) => readJsonFile(path9.join(paths.manifestsDir, entry)))
  );
  return manifests.filter((manifest) => Boolean(manifest)).map((manifest) => ({
    ...manifest,
    semanticHash: manifest.semanticHash ?? manifest.contentHash
  }));
}
async function removeManifestBySourceId(rootDir, sourceId) {
  const { paths } = await initWorkspace(rootDir);
  const manifest = await readJsonFile(path9.join(paths.manifestsDir, `${sourceId}.json`));
  if (!manifest) {
    return null;
  }
  const normalizedManifest = {
    ...manifest,
    semanticHash: manifest.semanticHash ?? manifest.contentHash
  };
  await removeManifestArtifacts(rootDir, normalizedManifest, paths);
  return normalizedManifest;
}
async function readExtractedText(rootDir, manifest) {
  if (!manifest.extractedTextPath) {
    return void 0;
  }
  const absolutePath = path9.resolve(rootDir, manifest.extractedTextPath);
  if (!await fileExists(absolutePath)) {
    return void 0;
  }
  return fs8.readFile(absolutePath, "utf8");
}
async function readExtractionArtifact(rootDir, manifest) {
  if (!manifest.extractedMetadataPath) {
    return void 0;
  }
  const absolutePath = path9.resolve(rootDir, manifest.extractedMetadataPath);
  if (!await fileExists(absolutePath)) {
    return void 0;
  }
  return await readJsonFile(absolutePath) ?? void 0;
}

// src/tokenize.ts
import nlp from "compromise";
var CLOSED_CLASS_POS_SELECTOR = "#Determiner, #Preposition, #Conjunction, #Pronoun, #Auxiliary, #Copula";
function splitTermToTokens(term, tokens) {
  for (const piece of term.split(/[^a-z0-9-]+/)) {
    const trimmed = piece.replace(/^-+|-+$/g, "");
    if (trimmed.length >= 2) {
      tokens.push(trimmed);
    }
  }
}
function tokenize(text) {
  const lower = text.toLowerCase();
  try {
    const terms = nlp(lower).terms().out("array");
    const tokens = [];
    for (const term of terms) {
      splitTermToTokens(term, tokens);
    }
    if (tokens.length > 0) {
      return tokens;
    }
  } catch {
  }
  return lower.match(/[a-z0-9][a-z0-9-]{1,}/g) ?? [];
}
function contentTokens(text, minLength = 4) {
  const lower = text.toLowerCase();
  const tokens = [];
  try {
    const contentDoc = nlp(lower).not(CLOSED_CLASS_POS_SELECTOR);
    const terms = contentDoc.terms().out("array");
    for (const term of terms) {
      splitTermToTokens(term, tokens);
    }
  } catch {
  }
  if (tokens.length === 0) {
    for (const piece of lower.match(/[a-z0-9][a-z0-9-]{1,}/g) ?? []) {
      tokens.push(piece);
    }
  }
  return tokens.filter((token) => token.length >= minLength);
}

// src/analysis.ts
var ANALYSIS_FORMAT_VERSION = 8;
var sourceAnalysisSchema = z2.object({
  title: z2.string().min(1),
  summary: z2.string().min(1),
  concepts: z2.array(z2.object({ name: z2.string().min(2).max(60), description: z2.string().min(10).max(500) })).max(12).default([]),
  entities: z2.array(z2.object({ name: z2.string().min(2).max(80), description: z2.string().min(10).max(500) })).max(12).default([]),
  claims: z2.array(
    z2.object({
      text: z2.string().min(10).max(200),
      confidence: z2.number().min(0).max(1).default(0.6),
      status: z2.enum(["extracted", "inferred", "conflicted", "stale"]).default("extracted"),
      polarity: z2.enum(["positive", "negative", "neutral"]).default("neutral"),
      citation: z2.string().min(1)
    })
  ).max(8).default([]),
  questions: z2.array(z2.string()).max(6).default([]),
  tags: z2.array(z2.string()).max(5).default([])
});
var HEURISTIC_SECTION_SOURCE_KINDS = /* @__PURE__ */ new Map([
  ["transcript", "Transcript"],
  ["chat_export", "Messages"],
  ["email", "Message"],
  ["calendar", "Description"]
]);
var MARKDOWN_RATIONALE_KINDS = /* @__PURE__ */ new Set([
  "markdown",
  "html",
  "pdf",
  "docx",
  "epub",
  "odt",
  "rtf",
  "org",
  "asciidoc",
  "jupyter"
]);
var PLAIN_TEXT_RATIONALE_KINDS = /* @__PURE__ */ new Set(["text", "transcript", "chat_export", "email", "calendar"]);
function filenameStemForSource(manifest) {
  const candidate = manifest.repoRelativePath ?? manifest.originalPath ?? manifest.storedPath;
  const base = path10.basename(candidate);
  const stem = base.replace(/\.[^.]+$/, "");
  return stem || manifest.title;
}
function extractNonCodeRationales(manifest, rawText) {
  if (!rawText.trim()) {
    return [];
  }
  if (MARKDOWN_RATIONALE_KINDS.has(manifest.sourceKind)) {
    const fallback = filenameStemForSource(manifest);
    const rationales = extractRationaleFromMarkdown(rawText, manifest.sourceId);
    return rationales.map((entry) => ({
      ...entry,
      symbolName: entry.symbolName ?? fallback
    }));
  }
  if (PLAIN_TEXT_RATIONALE_KINDS.has(manifest.sourceKind)) {
    return extractRationaleFromPlainText(rawText, manifest.sourceId, filenameStemForSource(manifest));
  }
  return [];
}
function extractTopTerms(text, count) {
  const frequency = /* @__PURE__ */ new Map();
  for (const token of contentTokens(text)) {
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  }
  return [...frequency.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, count).map(([token]) => token);
}
function extractEntities(text, count) {
  const candidates = [];
  try {
    const doc = nlp2(text);
    const segments = [
      doc.match("#ProperNoun+").out("array"),
      doc.people().out("array"),
      doc.places().out("array"),
      doc.organizations().out("array"),
      doc.topics().out("array")
    ];
    for (const segment of segments) {
      for (const term of segment) {
        const normalized = normalizeWhitespace(term);
        if (normalized) {
          candidates.push(normalized);
        }
      }
    }
  } catch {
  }
  return uniqueBy(candidates, (value) => value.toLowerCase()).slice(0, count);
}
function detectPolarity(text) {
  if (/\b(no|not|never|cannot|can't|won't|without)\b/i.test(text)) {
    return "negative";
  }
  if (/\b(is|are|will|does|supports|enables|improves|includes)\b/i.test(text)) {
    return "positive";
  }
  return "neutral";
}
function markdownNodesText(nodes) {
  return normalizeWhitespace(nodes.map((node) => markdownNodeText(node)).join("\n"));
}
function stripLeadingTitleNodes(nodes, title) {
  const normalizedTitle = normalizeWhitespace(title);
  if (!normalizedTitle || !nodes.length) {
    return nodes;
  }
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!node) {
      continue;
    }
    const nodeText2 = markdownNodeText(node);
    if (node.type === "heading" && node.depth === 1 && nodeText2 === normalizedTitle) {
      return nodes.slice(index + 1);
    }
    if (node.type === "paragraph" && nodeText2 === normalizedTitle) {
      return nodes.slice(index + 1);
    }
    return nodes;
  }
  return nodes;
}
function markdownSectionNodes(nodes, heading) {
  const normalizedHeading = normalizeWhitespace(heading);
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node?.type !== "heading" || node.depth !== 2) {
      continue;
    }
    if (markdownNodeText(node) !== normalizedHeading) {
      continue;
    }
    const sectionNodes = [];
    for (let cursor = index + 1; cursor < nodes.length; cursor += 1) {
      const candidate = nodes[cursor];
      if (candidate?.type === "heading" && typeof candidate.depth === "number" && candidate.depth <= 2) {
        break;
      }
      if (candidate) {
        sectionNodes.push(candidate);
      }
    }
    return sectionNodes;
  }
  return [];
}
function textForHeuristicAnalysis(manifest, text) {
  const nodes = parseMarkdownNodes(text);
  if (!nodes.length) {
    return normalizeWhitespace(text);
  }
  const sectionHeading = HEURISTIC_SECTION_SOURCE_KINDS.get(manifest.sourceKind);
  const scopedNodes = sectionHeading ? markdownSectionNodes(nodes, sectionHeading) : nodes;
  const relevantNodes = scopedNodes.length ? scopedNodes : nodes;
  const contentNodes = stripLeadingTitleNodes(relevantNodes, manifest.title);
  const normalized = markdownNodesText(contentNodes.length ? contentNodes : relevantNodes);
  return normalized || normalizeWhitespace(text);
}
function normalizeAnalysisTitle(manifest, candidate) {
  if (manifest.sourceKind !== "code") {
    return manifest.title;
  }
  const normalized = normalizeWhitespace(candidate.replace(/^#+\s+/, ""));
  if (!normalized) {
    return manifest.title;
  }
  if (normalized.length > 140 || normalized.includes(" ## ")) {
    return manifest.title;
  }
  return normalized;
}
function normalizeSourceAnalysis(manifest, analysis) {
  const title = normalizeAnalysisTitle(manifest, analysis.title);
  return title === analysis.title ? analysis : { ...analysis, title };
}
function heuristicAnalysis(manifest, text, schemaHash) {
  const analysisText = textForHeuristicAnalysis(manifest, text);
  const normalized = normalizeWhitespace(analysisText);
  const concepts = extractTopTerms(normalized, 6).map((term) => ({
    id: `concept:${slugify(term)}`,
    name: term,
    description: `Frequently referenced concept in ${manifest.title}.`
  }));
  const entities = extractEntities(analysisText, 6).map((term) => ({
    id: `entity:${slugify(term)}`,
    name: term,
    description: `Named entity mentioned in ${manifest.title}.`
  }));
  const claimSentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 4);
  return {
    analysisVersion: ANALYSIS_FORMAT_VERSION,
    sourceId: manifest.sourceId,
    sourceHash: manifest.contentHash,
    semanticHash: manifest.semanticHash,
    extractionHash: manifest.extractionHash,
    schemaHash,
    title: manifest.title,
    summary: firstSentences(normalized, 3) || truncate(normalized, 280) || `Imported ${manifest.sourceKind} source.`,
    concepts,
    entities,
    claims: claimSentences.map((sentence, index) => ({
      id: `claim:${manifest.sourceId}:${index + 1}`,
      text: sentence,
      confidence: 0.55,
      status: "extracted",
      polarity: detectPolarity(sentence),
      citation: manifest.sourceId
    })),
    questions: concepts.slice(0, 3).map((term) => `How does ${term.name} relate to ${manifest.title}?`),
    tags: [],
    rationales: [],
    producedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function providerAnalysis(manifest, text, provider, schema, promptConfig) {
  const conceptRuleLines = (promptConfig?.conceptRules ?? []).map((r) => `CONCEPT RULE: ${r}`);
  const entityRuleLines = (promptConfig?.entityRules ?? []).map((r) => `ENTITY RULE: ${r}`);
  const claimRuleLines = (promptConfig?.claimRules ?? []).map((r) => `CLAIM RULE: ${r}`);
  const systemExtraLines = promptConfig?.systemExtra ?? [];
  const parsed = await provider.generateStructured(
    {
      system: [
        "You are compiling a durable markdown wiki and graph. Prefer grounded synthesis over creativity.",
        "",
        "Follow the vault schema when choosing titles, categories, relationships, and summaries.",
        "",
        "Return up to 5 broad domain tags that categorize this source. Tags should be lowercase kebab-case (e.g., cryptography, distributed-systems, machine-learning). These are broader categories, not specific concepts or entity names.",
        "",
        ...conceptRuleLines,
        ...entityRuleLines,
        ...claimRuleLines,
        ...conceptRuleLines.length || entityRuleLines.length || claimRuleLines.length ? [""] : [],
        `Vault schema path: ${schema.path}`,
        "",
        "Vault schema instructions:",
        truncate(schema.content, 6e3),
        "",
        ...systemExtraLines
      ].join("\n"),
      prompt: `Analyze the following source and return structured JSON.

Source title: ${manifest.title}
Source kind: ${manifest.sourceKind}
Source id: ${manifest.sourceId}

Text:
${truncate(text, 18e3)}`
    },
    sourceAnalysisSchema
  );
  return {
    analysisVersion: ANALYSIS_FORMAT_VERSION,
    sourceId: manifest.sourceId,
    sourceHash: manifest.contentHash,
    semanticHash: manifest.semanticHash,
    extractionHash: manifest.extractionHash,
    schemaHash: schema.hash,
    title: parsed.title,
    summary: parsed.summary,
    concepts: parsed.concepts.map((term) => ({
      id: `concept:${slugify(term.name)}`,
      name: term.name,
      description: term.description
    })),
    entities: parsed.entities.map((term) => ({
      id: `entity:${slugify(term.name)}`,
      name: term.name,
      description: term.description
    })),
    claims: parsed.claims.map((claim, index) => ({
      id: `claim:${manifest.sourceId}:${index + 1}`,
      text: claim.text,
      confidence: claim.confidence,
      status: claim.status,
      polarity: claim.polarity,
      citation: claim.citation
    })),
    questions: parsed.questions,
    tags: parsed.tags,
    rationales: [],
    producedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function analysisFromVisionExtraction(manifest, extraction, schemaHash) {
  if (!extraction.vision) {
    return null;
  }
  return {
    analysisVersion: ANALYSIS_FORMAT_VERSION,
    sourceId: manifest.sourceId,
    sourceHash: manifest.contentHash,
    semanticHash: manifest.semanticHash,
    extractionHash: manifest.extractionHash,
    schemaHash,
    title: extraction.vision.title?.trim() || manifest.title,
    summary: extraction.vision.summary,
    concepts: extraction.vision.concepts.map((term) => ({
      id: `concept:${slugify(term.name)}`,
      name: term.name,
      description: term.description
    })),
    entities: extraction.vision.entities.map((term) => ({
      id: `entity:${slugify(term.name)}`,
      name: term.name,
      description: term.description
    })),
    claims: extraction.vision.claims.map((claim, index) => ({
      id: `claim:${manifest.sourceId}:${index + 1}`,
      text: claim.text,
      confidence: claim.confidence,
      status: "extracted",
      polarity: claim.polarity,
      citation: manifest.sourceId
    })),
    questions: extraction.vision.questions,
    tags: [],
    rationales: [],
    producedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function extractionWarningSummary(manifest, extraction) {
  const warning = extraction?.warnings?.find(Boolean);
  if (warning) {
    return `Imported ${manifest.sourceKind} source. ${warning}`;
  }
  return `Imported ${manifest.sourceKind} source. Text extraction is not yet available for this source.`;
}
async function analyzeSource(manifest, extractedText, provider, paths, schema, promptConfig) {
  const cachePath = path10.join(paths.analysesDir, `${manifest.sourceId}.json`);
  const cached = await readJsonFile(cachePath);
  if (cached && cached.analysisVersion === ANALYSIS_FORMAT_VERSION && (cached.semanticHash ?? cached.sourceHash) === manifest.semanticHash && cached.extractionHash === manifest.extractionHash && cached.schemaHash === schema.hash) {
    const normalizedCached = normalizeSourceAnalysis(manifest, cached);
    if (normalizedCached !== cached) {
      await writeJsonFile(cachePath, normalizedCached);
    }
    return normalizedCached;
  }
  const extraction = await readExtractionArtifact(paths.rootDir, manifest);
  const content = normalizeWhitespace(extractedText ?? "");
  let analysis;
  if (manifest.sourceKind === "code" && content) {
    analysis = await analyzeCodeSource(manifest, extractedText ?? "", schema.hash);
  } else if (manifest.sourceKind === "image") {
    const visionAnalysis = extraction ? analysisFromVisionExtraction(manifest, extraction, schema.hash) : null;
    if (visionAnalysis) {
      analysis = visionAnalysis;
    } else if (!content) {
      analysis = {
        analysisVersion: ANALYSIS_FORMAT_VERSION,
        sourceId: manifest.sourceId,
        sourceHash: manifest.contentHash,
        semanticHash: manifest.semanticHash,
        extractionHash: manifest.extractionHash,
        schemaHash: schema.hash,
        title: manifest.title,
        summary: extractionWarningSummary(manifest, extraction),
        concepts: [],
        entities: [],
        claims: [],
        questions: [],
        tags: [],
        rationales: [],
        producedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } else if (provider.type === "heuristic") {
      analysis = heuristicAnalysis(manifest, content, schema.hash);
    } else {
      try {
        analysis = await providerAnalysis(manifest, content, provider, schema, promptConfig);
      } catch {
        analysis = heuristicAnalysis(manifest, content, schema.hash);
      }
    }
  } else if (!content) {
    analysis = {
      analysisVersion: ANALYSIS_FORMAT_VERSION,
      sourceId: manifest.sourceId,
      sourceHash: manifest.contentHash,
      semanticHash: manifest.semanticHash,
      extractionHash: manifest.extractionHash,
      schemaHash: schema.hash,
      title: manifest.title,
      summary: extractionWarningSummary(manifest, extraction),
      concepts: [],
      entities: [],
      claims: [],
      questions: [],
      tags: [],
      rationales: [],
      producedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  } else if (provider.type === "heuristic") {
    analysis = heuristicAnalysis(manifest, content, schema.hash);
  } else {
    try {
      analysis = await providerAnalysis(manifest, content, provider, schema, promptConfig);
    } catch {
      analysis = heuristicAnalysis(manifest, content, schema.hash);
    }
  }
  if (manifest.sourceKind !== "code" && !analysis.rationales.length) {
    const extra = extractNonCodeRationales(manifest, extractedText ?? "");
    if (extra.length) {
      analysis = { ...analysis, rationales: extra };
    }
  }
  const normalized = normalizeSourceAnalysis(manifest, analysis);
  await writeJsonFile(cachePath, normalized);
  return normalized;
}
function analysisSignature(analysis) {
  return sha256(JSON.stringify(analysis));
}

// src/benchmark.ts
var CHARS_PER_TOKEN = 4;
var DEFAULT_BENCHMARK_QUESTIONS = [
  "How does this vault connect the main concepts?",
  "Which pages bridge the biggest communities?",
  "What are the core abstractions in this vault?",
  "Where are the biggest knowledge gaps?",
  "What evidence should I read first?"
];
var RESEARCH_BENCHMARK_QUESTION = "Which research sources should I read first, and why?";
function nodeMap(graph) {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}
function pageMap(graph) {
  return new Map(graph.pages.map((page) => [page.id, page]));
}
function estimateTokens2(text) {
  return Math.max(1, Math.ceil(text.length / CHARS_PER_TOKEN));
}
function estimateCorpusWords(texts) {
  return texts.reduce((total, text) => total + normalizeWhitespace(text).split(/\s+/).filter(Boolean).length, 0);
}
function benchmarkQueryTokens(graph, queryResult, pageContentsById) {
  const nodesById = nodeMap(graph);
  const pagesById = pageMap(graph);
  const edgeIds = new Set(queryResult.visitedEdgeIds);
  const lines = [];
  for (const pageId of queryResult.pageIds) {
    const page = pagesById.get(pageId);
    if (!page) {
      continue;
    }
    const content = normalizeWhitespace(pageContentsById.get(pageId) ?? "").slice(0, 280);
    lines.push(`PAGE ${page.title} path=${page.path} kind=${page.kind}`);
    if (content) {
      lines.push(`PAGE_BODY ${content}`);
    }
  }
  for (const nodeId of queryResult.visitedNodeIds) {
    const node = nodesById.get(nodeId);
    if (!node) {
      continue;
    }
    lines.push(`NODE ${node.label} type=${node.type} community=${node.communityId ?? "unassigned"} page=${node.pageId ?? "none"}`);
  }
  for (const edge of graph.edges) {
    if (!edgeIds.has(edge.id)) {
      continue;
    }
    const source = nodesById.get(edge.source)?.label ?? edge.source;
    const target = nodesById.get(edge.target)?.label ?? edge.target;
    lines.push(`EDGE ${source} --${edge.relation}/${edge.evidenceClass}/${edge.confidence.toFixed(2)}--> ${target}`);
  }
  const queryTokens = estimateTokens2(lines.join("\n"));
  return {
    question: queryResult.question,
    queryTokens,
    reduction: 0,
    visitedNodeIds: queryResult.visitedNodeIds,
    visitedEdgeIds: queryResult.visitedEdgeIds,
    pageIds: queryResult.pageIds
  };
}
function graphHash(graph) {
  const hashedPages = graph.pages.filter((page) => page.kind !== "graph_report" && page.kind !== "community_summary");
  const normalized = JSON.stringify(
    {
      nodes: [...graph.nodes].map((node) => ({
        id: node.id,
        type: node.type,
        label: node.label,
        pageId: node.pageId ?? null,
        sourceClass: node.sourceClass ?? null,
        communityId: node.communityId ?? null,
        degree: node.degree ?? null,
        bridgeScore: node.bridgeScore ?? null,
        isGodNode: node.isGodNode ?? false,
        sourceIds: [...node.sourceIds].sort(),
        projectIds: [...node.projectIds].sort()
      })).sort((left, right) => left.id.localeCompare(right.id)),
      edges: [...graph.edges].map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        relation: edge.relation,
        status: edge.status,
        evidenceClass: edge.evidenceClass,
        similarityBasis: edge.similarityBasis ?? null,
        confidence: edge.confidence,
        provenance: [...edge.provenance].sort()
      })).sort((left, right) => left.id.localeCompare(right.id)),
      pages: [...hashedPages].map((page) => ({
        id: page.id,
        path: page.path,
        kind: page.kind,
        status: page.status,
        sourceType: page.sourceType ?? null,
        sourceClass: page.sourceClass ?? null,
        sourceIds: [...page.sourceIds].sort(),
        projectIds: [...page.projectIds].sort(),
        nodeIds: [...page.nodeIds].sort()
      })).sort((left, right) => left.id.localeCompare(right.id)),
      communities: [...graph.communities ?? []].map((community) => ({
        id: community.id,
        label: community.label,
        nodeIds: [...community.nodeIds].sort()
      })).sort((left, right) => left.id.localeCompare(right.id))
    },
    null,
    0
  );
  return sha256(normalized);
}
function hasResearchSources(pages) {
  return pages.some((page) => page.kind === "source" && Boolean(page.sourceType) && page.sourceType !== "url");
}
function defaultBenchmarkQuestionsForGraph(graph, maxQuestions = 3) {
  const normalizedLimit = Math.max(1, Math.min(maxQuestions, DEFAULT_BENCHMARK_QUESTIONS.length));
  const questions = [...DEFAULT_BENCHMARK_QUESTIONS];
  if (hasResearchSources(graph.pages)) {
    questions.unshift(RESEARCH_BENCHMARK_QUESTION);
  }
  return uniqueBy(questions, (item) => item).slice(0, normalizedLimit);
}
function buildBenchmarkByClass(input) {
  const entries = {};
  for (const sourceClass of ALL_SOURCE_CLASSES) {
    const corpusWords = Math.max(0, Math.round(input.perClassCorpusWords[sourceClass] ?? 0));
    const corpusTokens = corpusWords > 0 ? Math.max(1, Math.round(corpusWords * (100 / 75))) : 0;
    const sourceCount = input.graph.sources.filter((source) => source.sourceClass === sourceClass).length;
    const pageCount = input.graph.pages.filter((page) => page.sourceClass === sourceClass).length;
    const nodeCount = input.graph.nodes.filter((node) => node.sourceClass === sourceClass).length;
    const godNodeCount = input.graph.nodes.filter((node) => node.sourceClass === sourceClass && Boolean(node.isGodNode)).length;
    const perQuestionRaw = input.perClassPerQuestion[sourceClass] ?? [];
    const perQuestion = perQuestionRaw.filter((entry) => entry.queryTokens > 0).map((entry) => ({
      ...entry,
      reduction: corpusTokens > 0 ? Number((1 - entry.queryTokens / Math.max(1, corpusTokens)).toFixed(3)) : 0
    }));
    const finalContextTokens = perQuestion.length ? Math.max(1, Math.round(perQuestion.reduce((total, entry) => total + entry.queryTokens, 0) / perQuestion.length)) : 0;
    const reductionRatio = finalContextTokens && corpusTokens > 0 ? Number((1 - finalContextTokens / Math.max(1, corpusTokens)).toFixed(3)) : 0;
    entries[sourceClass] = {
      sourceClass,
      sourceCount,
      pageCount,
      nodeCount,
      godNodeCount,
      corpusWords,
      corpusTokens,
      finalContextTokens,
      reductionRatio,
      perQuestion
    };
  }
  return entries;
}
function buildBenchmarkArtifact(input) {
  const corpusTokens = Math.max(1, Math.round(input.corpusWords * (100 / 75)));
  const perQuestion = input.perQuestion.filter((entry) => entry.queryTokens > 0).map((entry) => ({
    ...entry,
    // Honest reduction: negative values mean graph context is larger than the
    // full corpus, which is the truth on very small vaults. Clamping to zero
    // hid that signal.
    reduction: Number((1 - entry.queryTokens / Math.max(1, corpusTokens)).toFixed(3))
  }));
  const avgQueryTokens = perQuestion.length ? Math.max(1, Math.round(perQuestion.reduce((total, entry) => total + entry.queryTokens, 0) / perQuestion.length)) : 0;
  const reductionRatio = avgQueryTokens ? Number((1 - avgQueryTokens / Math.max(1, corpusTokens)).toFixed(3)) : 0;
  const uniqueVisitedNodes = new Set(perQuestion.flatMap((entry) => entry.visitedNodeIds)).size;
  const summary = {
    questionCount: input.questions.length,
    uniqueVisitedNodes,
    finalContextTokens: avgQueryTokens,
    naiveCorpusTokens: corpusTokens,
    avgReduction: reductionRatio,
    reductionRatio
  };
  const emptyPerClassWords = {
    first_party: 0,
    third_party: 0,
    resource: 0,
    generated: 0
  };
  const emptyPerClassQuestions = {
    first_party: [],
    third_party: [],
    resource: [],
    generated: []
  };
  const byClass = input.byClass ?? buildBenchmarkByClass({
    graph: input.graph,
    perClassCorpusWords: emptyPerClassWords,
    perClassPerQuestion: emptyPerClassQuestions
  });
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    graphHash: graphHash(input.graph),
    corpusWords: input.corpusWords,
    corpusTokens,
    nodes: input.graph.nodes.length,
    edges: input.graph.edges.length,
    avgQueryTokens,
    reductionRatio,
    sampleQuestions: input.questions,
    perQuestion,
    summary,
    byClass
  };
}

// src/candidate-promotion.ts
var DEFAULT_PROMOTION_CONFIG = {
  enabled: false,
  minSources: 3,
  minConfidence: 0.8,
  minAgreement: 0.7,
  minDegree: 2,
  minAgeHours: 24,
  maxPerRun: 25,
  dryRun: false
};
function jaccard(left, right) {
  if (left.length === 0 && right.length === 0) return 1;
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = /* @__PURE__ */ new Set([...leftSet, ...rightSet]);
  if (union.size === 0) return 1;
  let intersection = 0;
  for (const item of leftSet) {
    if (rightSet.has(item)) intersection++;
  }
  return intersection / union.size;
}
function hoursSince(iso, now) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 0;
  return Math.max(0, (now - then) / (1e3 * 60 * 60));
}
function maxDegreeFor(graph, nodeIds) {
  let best = 0;
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const nodeId of nodeIds) {
    const node = byId.get(nodeId);
    if (node && (node.degree ?? 0) > best) best = node.degree ?? 0;
  }
  return best;
}
function describeGate(result) {
  const verb = result.passed ? ">=" : "<";
  return `${result.gate} ${result.value.toFixed(2)} ${verb} ${result.threshold.toFixed(2)}`;
}
function evaluateCandidateForPromotion(page, graph, history, config, now = Date.now()) {
  const historical = history?.[page.id];
  const historicalSources = historical?.sourceIds ?? [];
  const agreement = historicalSources.length ? jaccard(historicalSources, page.sourceIds) : 0;
  const degree = maxDegreeFor(graph, page.nodeIds);
  const ageHours = hoursSince(page.createdAt, now);
  const gates = [
    { gate: "sources", value: page.sourceIds.length, threshold: config.minSources, passed: page.sourceIds.length >= config.minSources },
    { gate: "confidence", value: page.confidence, threshold: config.minConfidence, passed: page.confidence >= config.minConfidence },
    { gate: "agreement", value: agreement, threshold: config.minAgreement, passed: agreement >= config.minAgreement },
    { gate: "degree", value: degree, threshold: config.minDegree, passed: degree >= config.minDegree },
    { gate: "age", value: ageHours, threshold: config.minAgeHours, passed: ageHours >= config.minAgeHours }
  ];
  const passedCount = gates.filter((gate) => gate.passed).length;
  const promote = gates.every((gate) => gate.passed);
  const score = passedCount / gates.length;
  return {
    pageId: page.id,
    title: page.title,
    kind: page.kind,
    promote,
    score,
    gates,
    reasons: gates.map(describeGate)
  };
}
function sortDecisionsForPromotion(decisions) {
  return [...decisions].sort((left, right) => {
    if (left.promote !== right.promote) return left.promote ? -1 : 1;
    if (right.score !== left.score) return right.score - left.score;
    return left.pageId.localeCompare(right.pageId);
  });
}
function renderPromotionSessionMarkdown(decisions, promotedPageIds, options) {
  const lines = [];
  lines.push(`# Auto-Promotion Run`);
  lines.push("");
  lines.push(`- started: ${options.startedAt}`);
  lines.push(`- finished: ${options.finishedAt}`);
  lines.push(`- mode: ${options.dryRun ? "dry-run" : "applied"}`);
  lines.push(`- promoted: ${promotedPageIds.length}`);
  lines.push(`- evaluated: ${decisions.length}`);
  lines.push("");
  lines.push(`| page | decision | score | reasons |`);
  lines.push(`| --- | --- | --- | --- |`);
  for (const decision of sortDecisionsForPromotion(decisions)) {
    const decided = decision.promote ? promotedPageIds.includes(decision.pageId) ? "promoted" : "promote (dry-run)" : "skipped";
    lines.push(`| ${decision.pageId} | ${decided} | ${decision.score.toFixed(2)} | ${decision.reasons.join("; ")} |`);
  }
  lines.push("");
  return lines.join("\n");
}

// src/confidence.ts
function nodeConfidence(sourceCount) {
  return Math.min(0.5 + sourceCount * 0.15, 0.95);
}
function edgeConfidence(claims, conceptName) {
  const lower = conceptName.toLowerCase();
  const relevant = claims.filter((c) => c.text.toLowerCase().includes(lower));
  if (!relevant.length) {
    return 0.5;
  }
  return relevant.reduce((sum, c) => sum + c.confidence, 0) / relevant.length;
}
function conflictConfidence(claimA, claimB) {
  return Math.min(claimA.confidence, claimB.confidence);
}

// src/consolidate.ts
import fs11 from "fs/promises";
import path13 from "path";
import matter6 from "gray-matter";

// src/markdown.ts
import matter4 from "gray-matter";

// src/embeddings.ts
import fs9 from "fs/promises";
import path11 from "path";
var MAX_EMBEDDING_BATCH = 32;
var MAX_SIMILARITY_NODES = 240;
function cosineSimilarity(left, right) {
  if (!left.length || left.length !== right.length) {
    return 0;
  }
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }
  if (leftNorm <= 0 || rightNorm <= 0) {
    return 0;
  }
  return dot / Math.sqrt(leftNorm * rightNorm);
}
function appendIfMissing(parts, value) {
  const normalized = value?.trim();
  if (!normalized) {
    return;
  }
  if (!parts.includes(normalized)) {
    parts.push(normalized);
  }
}
async function loadPageContents(rootDir, graph) {
  const { paths } = await loadVaultConfig(rootDir);
  const contents = /* @__PURE__ */ new Map();
  await Promise.all(
    graph.pages.map(async (page) => {
      const absolutePath = path11.join(paths.wikiDir, page.path);
      const content = await fs9.readFile(absolutePath, "utf8").catch(() => {
        process.stderr.write(`[swarmvault] Warning: could not read page ${page.path} for embedding
`);
        return "";
      });
      if (content) {
        contents.set(page.id, content);
      }
    })
  );
  return contents;
}
function itemTextForNode(node, graph, pageContents) {
  const page = graph.pages.find((candidate) => candidate.id === node.pageId);
  const parts = [`node ${node.type}`, node.label];
  appendIfMissing(parts, node.sourceClass);
  appendIfMissing(parts, node.language);
  appendIfMissing(parts, page?.title);
  appendIfMissing(parts, page?.sourceType);
  appendIfMissing(parts, page?.sourceClass);
  if (page) {
    appendIfMissing(parts, pageContents.get(page.id)?.slice(0, 800));
  }
  return parts.join("\n");
}
function itemTextForPage(page, pageContents) {
  const parts = [`page ${page.kind}`, page.title, page.path];
  appendIfMissing(parts, page.sourceType);
  appendIfMissing(parts, page.sourceClass);
  appendIfMissing(parts, pageContents.get(page.id)?.slice(0, 1200));
  return parts.join("\n");
}
function itemTextForHyperedge(graph, hyperedgeId) {
  const hyperedge = graph.hyperedges.find((candidate) => candidate.id === hyperedgeId);
  if (!hyperedge) {
    return "";
  }
  const nodeLabels = hyperedge.nodeIds.map((nodeId) => graph.nodes.find((node) => node.id === nodeId)?.label).filter((value) => Boolean(value));
  return [hyperedge.label, hyperedge.relation, hyperedge.why, ...nodeLabels].join("\n");
}
async function buildEmbeddableItems(rootDir, graph) {
  const pageContents = await loadPageContents(rootDir, graph);
  return uniqueBy(
    [
      ...graph.nodes.map(
        (node) => ({
          id: node.id,
          kind: "node",
          label: node.label,
          text: itemTextForNode(node, graph, pageContents),
          match: {
            type: "node",
            id: node.id,
            label: node.label,
            score: 0
          }
        })
      ),
      ...graph.pages.map(
        (page) => ({
          id: page.id,
          kind: "page",
          label: page.title,
          text: itemTextForPage(page, pageContents),
          match: {
            type: "page",
            id: page.id,
            label: page.title,
            score: 0
          }
        })
      ),
      ...(graph.hyperedges ?? []).map(
        (hyperedge) => ({
          id: hyperedge.id,
          kind: "hyperedge",
          label: hyperedge.label,
          text: itemTextForHyperedge(graph, hyperedge.id),
          match: {
            type: "hyperedge",
            id: hyperedge.id,
            label: hyperedge.label,
            score: 0
          }
        })
      )
    ],
    (item) => `${item.kind}:${item.id}`
  ).filter((item) => item.text.trim().length > 0);
}
async function resolveEmbeddingProvider(rootDir) {
  const { config } = await loadVaultConfig(rootDir);
  const explicitProviderId = config.tasks.embeddingProvider;
  if (explicitProviderId) {
    const providerConfig = config.providers[explicitProviderId];
    if (!providerConfig) {
      throw new Error(`No provider configured with id "${explicitProviderId}" for task "embeddingProvider".`);
    }
    const provider2 = await createProvider(explicitProviderId, providerConfig, rootDir);
    if (!provider2.capabilities.has("embeddings") || typeof provider2.embedTexts !== "function") {
      throw new Error(
        `Provider ${provider2.id} does not support required capability "embeddings". Configure tasks.embeddingProvider to use an embedding-capable backend such as ollama or another openai-compatible embedding service.`
      );
    }
    return provider2;
  }
  const queryProviderId = config.tasks.queryProvider;
  const queryProviderConfig = config.providers[queryProviderId];
  if (!queryProviderConfig) {
    return null;
  }
  const provider = await createProvider(queryProviderId, queryProviderConfig, rootDir);
  return provider.capabilities.has("embeddings") && typeof provider.embedTexts === "function" ? provider : null;
}
async function readEmbeddingCache(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  const provider = await resolveEmbeddingProvider(rootDir);
  if (!provider) {
    return { artifact: null, provider: null };
  }
  const cache = await readJsonFile(paths.embeddingsPath);
  if (!cache || cache.providerId !== provider.id || cache.providerModel !== provider.model) {
    return { artifact: null, provider };
  }
  return { artifact: cache, provider };
}
async function writeEmbeddingCache(rootDir, provider, graphHash3, entries) {
  const { paths } = await loadVaultConfig(rootDir);
  await writeJsonFile(paths.embeddingsPath, {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    providerId: provider.id,
    providerModel: provider.model,
    graphHash: graphHash3,
    entries: entries.sort((left, right) => `${left.kind}:${left.itemId}`.localeCompare(`${right.kind}:${right.itemId}`))
  });
}
async function embedTexts(provider, texts) {
  const vectors = [];
  for (let index = 0; index < texts.length; index += MAX_EMBEDDING_BATCH) {
    const batch = texts.slice(index, index + MAX_EMBEDDING_BATCH);
    const nextVectors = await provider.embedTexts(batch);
    vectors.push(...nextVectors);
  }
  return vectors;
}
async function resolveVectorsForItems(rootDir, graphHash3, items) {
  const { artifact, provider } = await readEmbeddingCache(rootDir);
  if (!provider) {
    return { provider: null, vectors: /* @__PURE__ */ new Map() };
  }
  const cachedByKey = new Map(
    (artifact?.entries ?? []).map((entry) => [`${entry.kind}:${entry.itemId}:${entry.contentHash}`, entry.values])
  );
  const vectors = /* @__PURE__ */ new Map();
  const missing = [];
  for (const item of items) {
    const contentHash = sha256(item.text);
    const cached = cachedByKey.get(`${item.kind}:${item.id}:${contentHash}`);
    if (cached?.length) {
      vectors.set(`${item.kind}:${item.id}`, cached);
    } else {
      missing.push(item);
    }
  }
  if (missing.length) {
    const nextVectors = await embedTexts(
      provider,
      missing.map((item) => item.text)
    );
    for (let index = 0; index < missing.length; index += 1) {
      vectors.set(`${missing[index].kind}:${missing[index].id}`, nextVectors[index] ?? []);
    }
  }
  await writeEmbeddingCache(
    rootDir,
    provider,
    graphHash3,
    items.map((item) => ({
      itemId: item.id,
      kind: item.kind,
      label: item.label,
      contentHash: sha256(item.text),
      values: vectors.get(`${item.kind}:${item.id}`) ?? []
    }))
  );
  return { provider, vectors };
}
async function semanticGraphMatches(rootDir, graph, question, limit = 12) {
  const items = await buildEmbeddableItems(rootDir, graph);
  const { provider, vectors } = await resolveVectorsForItems(rootDir, graph.generatedAt, items);
  if (!provider) {
    return [];
  }
  const [queryVector] = await provider.embedTexts([question]);
  if (!Array.isArray(queryVector) || queryVector.length === 0) {
    return [];
  }
  return items.map((item) => ({
    ...item.match,
    score: Math.max(0, Number((cosineSimilarity(queryVector, vectors.get(`${item.kind}:${item.id}`) ?? []) * 100).toFixed(2)))
  })).filter((match) => match.score >= 18).sort((left, right) => right.score - left.score || left.label.localeCompare(right.label)).slice(0, limit);
}
async function semanticPageSearch(rootDir, graph, query, limit = 10) {
  const items = await buildEmbeddableItems(rootDir, graph);
  const pageItems = items.filter((item) => item.kind === "page");
  if (!pageItems.length) {
    return [];
  }
  const { provider, vectors } = await resolveVectorsForItems(rootDir, graph.generatedAt, items);
  if (!provider) {
    return [];
  }
  const [queryVector] = await provider.embedTexts([query]);
  if (!Array.isArray(queryVector) || queryVector.length === 0) {
    return [];
  }
  const pageMap2 = new Map(graph.pages.map((page) => [page.id, page]));
  return pageItems.map((item) => {
    const page = pageMap2.get(item.id);
    return {
      pageId: item.id,
      path: page?.path ?? "",
      title: item.label,
      kind: page?.kind ?? "",
      status: page?.status ?? "",
      score: cosineSimilarity(queryVector, vectors.get(`page:${item.id}`) ?? [])
    };
  }).filter((result) => result.score >= 0.25 && result.path).sort((left, right) => right.score - left.score).slice(0, limit);
}
function distinctScope(left, right) {
  const leftSources = new Set(left.sourceIds);
  const rightSources = new Set(right.sourceIds);
  return [...leftSources].some((sourceId) => !rightSources.has(sourceId)) || [...rightSources].some((sourceId) => !leftSources.has(sourceId));
}
function nodePairKey(left, right) {
  return [left, right].sort((a, b) => a.localeCompare(b)).join("|");
}
function similarityReasonsForNodes(left, right) {
  const reasons = /* @__PURE__ */ new Set();
  if (left.sourceClass && right.sourceClass && left.sourceClass === right.sourceClass) {
    reasons.add("shared_tag");
  }
  if (left.language && right.language && left.language === right.language) {
    reasons.add("shared_symbol");
  }
  return [...reasons].sort((a, b) => a.localeCompare(b));
}
async function embeddingSimilarityEdges(rootDir, graph) {
  const candidateNodes = graph.nodes.filter(
    (node) => (node.type === "source" || node.type === "module" || node.type === "rationale") && node.sourceClass !== "generated"
  );
  if (candidateNodes.length < 2 || candidateNodes.length > MAX_SIMILARITY_NODES) {
    return [];
  }
  const items = candidateNodes.map(
    (node) => ({
      id: node.id,
      kind: "node",
      label: node.label,
      text: [
        node.label,
        node.type,
        node.sourceClass ?? "",
        node.language ?? "",
        graph.pages.find((page) => page.id === node.pageId)?.title ?? ""
      ].filter(Boolean).join("\n"),
      match: { type: "node", id: node.id, label: node.label, score: 0 }
    })
  );
  const { provider, vectors } = await resolveVectorsForItems(rootDir, graph.generatedAt, items);
  if (!provider) {
    return [];
  }
  const directPairs = new Set(graph.edges.map((edge) => nodePairKey(edge.source, edge.target)));
  const edges = [];
  for (let leftIndex = 0; leftIndex < candidateNodes.length; leftIndex += 1) {
    const left = candidateNodes[leftIndex];
    const leftVector = vectors.get(`node:${left.id}`) ?? [];
    const candidates = candidateNodes.slice(leftIndex + 1).filter((right) => distinctScope(left, right) && !directPairs.has(nodePairKey(left.id, right.id))).map((right) => ({
      right,
      score: cosineSimilarity(leftVector, vectors.get(`node:${right.id}`) ?? [])
    })).filter((candidate) => candidate.score >= 0.82).sort((a, b) => b.score - a.score).slice(0, 3);
    for (const candidate of candidates) {
      const right = candidate.right;
      const reasons = similarityReasonsForNodes(left, right) ?? [];
      edges.push({
        id: `similar-embed:${sha256(`${left.id}|${right.id}|${provider.id}`).slice(0, 16)}`,
        source: left.id,
        target: right.id,
        relation: "semantically_similar_to",
        status: "inferred",
        evidenceClass: "inferred",
        confidence: Number(candidate.score.toFixed(3)),
        provenance: uniqueBy(
          [...left.sourceIds, ...right.sourceIds].sort((a, b) => a.localeCompare(b)),
          (value) => value
        ),
        similarityReasons: reasons.length ? reasons : ["shared_tag"],
        similarityBasis: "embeddings"
      });
    }
  }
  return uniqueBy(edges, (edge) => edge.id).sort((left, right) => right.confidence - left.confidence || left.id.localeCompare(right.id));
}
function sourceClassBreakdown(graph) {
  return {
    first_party: {
      sources: graph.sources.filter((source) => source.sourceClass === "first_party").length,
      pages: graph.pages.filter((page) => page.sourceClass === "first_party").length,
      nodes: graph.nodes.filter((node) => node.sourceClass === "first_party").length
    },
    third_party: {
      sources: graph.sources.filter((source) => source.sourceClass === "third_party").length,
      pages: graph.pages.filter((page) => page.sourceClass === "third_party").length,
      nodes: graph.nodes.filter((node) => node.sourceClass === "third_party").length
    },
    resource: {
      sources: graph.sources.filter((source) => source.sourceClass === "resource").length,
      pages: graph.pages.filter((page) => page.sourceClass === "resource").length,
      nodes: graph.nodes.filter((node) => node.sourceClass === "resource").length
    },
    generated: {
      sources: graph.sources.filter((source) => source.sourceClass === "generated").length,
      pages: graph.pages.filter((page) => page.sourceClass === "generated").length,
      nodes: graph.nodes.filter((node) => node.sourceClass === "generated").length
    }
  };
}
function filterGraphBySourceClass(graph, sourceClass) {
  const nodeIds = new Set(graph.nodes.filter((node) => node.sourceClass === sourceClass).map((node) => node.id));
  const pageIds = new Set(graph.pages.filter((page) => page.sourceClass === sourceClass).map((page) => page.id));
  return {
    ...graph,
    nodes: graph.nodes.filter((node) => nodeIds.has(node.id)),
    edges: graph.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)),
    hyperedges: graph.hyperedges.filter((hyperedge) => hyperedge.nodeIds.every((nodeId) => nodeIds.has(nodeId))),
    communities: (graph.communities ?? []).map((community) => ({
      ...community,
      nodeIds: community.nodeIds.filter((nodeId) => nodeIds.has(nodeId))
    })).filter((community) => community.nodeIds.length > 0),
    sources: graph.sources.filter((source) => source.sourceClass === sourceClass),
    pages: graph.pages.filter((page) => pageIds.has(page.id))
  };
}

// src/graph-enrichment.ts
var DEFAULT_SIMILARITY_IDF_FLOOR = 0.5;
var STOPWORDS = /* @__PURE__ */ new Set([
  "about",
  "after",
  "also",
  "among",
  "and",
  "around",
  "because",
  "been",
  "being",
  "between",
  "both",
  "does",
  "from",
  "into",
  "just",
  "like",
  "many",
  "more",
  "most",
  "much",
  "note",
  "only",
  "other",
  "over",
  "same",
  "such",
  "than",
  "that",
  "their",
  "them",
  "there",
  "these",
  "this",
  "through",
  "under",
  "very",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "would",
  "your"
]);
function normalizeValue(value) {
  return normalizeWhitespace(value).toLowerCase();
}
function addFeature(bucket, reason, value) {
  if (!value) {
    return;
  }
  const normalized = normalizeValue(value);
  if (!normalized) {
    return;
  }
  if (!bucket.has(reason)) {
    bucket.set(reason, /* @__PURE__ */ new Set());
  }
  bucket.get(reason)?.add(normalized);
}
function themeTokens(value) {
  return uniqueBy(
    normalizeValue(value).split(/[^a-z0-9]+/i).filter((token) => token.length >= 4 && !STOPWORDS.has(token)),
    (token) => token
  ).slice(0, 6);
}
function pairKey(left, right) {
  return [left, right].sort((a, b) => a.localeCompare(b)).join("|");
}
function hasDistinctScope(left, right) {
  if (left.pageId && right.pageId && left.pageId !== right.pageId) {
    return true;
  }
  const leftSources = new Set(left.sourceIds);
  const rightSources = new Set(right.sourceIds);
  const leftOnly = [...leftSources].some((sourceId) => !rightSources.has(sourceId));
  const rightOnly = [...rightSources].some((sourceId) => !leftSources.has(sourceId));
  return leftOnly || rightOnly;
}
var CATEGORY_BASE_WEIGHT = {
  shared_concept: 0.46,
  shared_entity: 0.34,
  shared_symbol: 0.24,
  shared_rationale_theme: 0.18,
  shared_source_type: 0.1,
  shared_tag: 0.12
};
function buildIdfTable(featureDocFrequency, documentCount) {
  const idf = /* @__PURE__ */ new Map();
  const safeDocCount = Math.max(1, documentCount);
  for (const [reason, values] of featureDocFrequency.entries()) {
    const inner = /* @__PURE__ */ new Map();
    for (const [value, df] of values.entries()) {
      inner.set(value, Math.log((safeDocCount + 1) / (df + 1)) + 1);
    }
    idf.set(reason, inner);
  }
  return idf;
}
function similarityScore(reasons, idfTable, floor) {
  let weighted = 0;
  let activeCategories = 0;
  for (const [reason, values] of reasons.entries()) {
    const idfByValue = idfTable.get(reason);
    let categoryContribution = 0;
    let hitCount = 0;
    for (const value of values) {
      const idfValue = idfByValue?.get(value) ?? 0;
      if (idfValue < floor) {
        continue;
      }
      hitCount++;
      const base = CATEGORY_BASE_WEIGHT[reason] ?? 0.1;
      if (hitCount === 1) {
        categoryContribution += Math.min(base * 2, base * idfValue);
      } else {
        categoryContribution += Math.min(0.12, 0.04 * idfValue);
      }
    }
    if (categoryContribution > 0) {
      weighted += categoryContribution;
      activeCategories++;
    }
  }
  const categoryBonus = activeCategories >= 3 ? 0.08 : activeCategories === 2 ? 0.04 : 0;
  return Math.min(0.96, weighted + categoryBonus);
}
function pruneReasonsByIdf(reasons, idfTable, floor) {
  const pruned = /* @__PURE__ */ new Map();
  for (const [reason, values] of reasons.entries()) {
    const idfByValue = idfTable.get(reason);
    const keep = /* @__PURE__ */ new Set();
    for (const value of values) {
      if ((idfByValue?.get(value) ?? 0) >= floor) {
        keep.add(value);
      }
    }
    if (keep.size > 0) {
      pruned.set(reason, keep);
    }
  }
  return pruned;
}
function describeSimilarityReasons(reasons) {
  if (!reasons?.length) {
    return "This link is inferred from multiple shared graph features.";
  }
  const labels = reasons.map(
    (reason) => reason === "shared_concept" ? "shared concepts" : reason === "shared_entity" ? "shared entities" : reason === "shared_symbol" ? "shared symbols" : reason === "shared_rationale_theme" ? "shared rationale themes" : reason === "shared_source_type" ? "shared source type" : "shared tags"
  );
  return `This link is inferred from ${labels.join(", ")}.`;
}
function nodeContexts(nodes, manifests, analyses) {
  const manifestsBySourceId = new Map(manifests.map((manifest) => [manifest.sourceId, manifest]));
  const analysesBySourceId = new Map(analyses.map((analysis) => [analysis.sourceId, analysis]));
  return nodes.filter((node) => node.type !== "symbol" && node.type !== "concept" && node.type !== "entity").map((node) => {
    const features = /* @__PURE__ */ new Map();
    if (node.type === "source" || node.type === "module") {
      for (const sourceId of node.sourceIds) {
        const analysis = analysesBySourceId.get(sourceId);
        const manifest = manifestsBySourceId.get(sourceId);
        if (!analysis) {
          continue;
        }
        for (const concept of analysis.concepts) {
          addFeature(features, "shared_concept", concept.name);
        }
        for (const entity of analysis.entities) {
          addFeature(features, "shared_entity", entity.name);
        }
        if (manifest?.sourceType) {
          addFeature(features, "shared_source_type", manifest.sourceType);
        }
        if (analysis.code) {
          const exportedSymbols = analysis.code.symbols.filter((symbol) => symbol.exported);
          for (const symbol of (exportedSymbols.length ? exportedSymbols : analysis.code.symbols).slice(0, 12)) {
            addFeature(features, "shared_symbol", symbol.name);
          }
        }
        for (const rationale of analysis.rationales) {
          for (const token of themeTokens(rationale.text)) {
            addFeature(features, "shared_rationale_theme", token);
          }
        }
      }
    } else if (node.type === "rationale") {
      for (const sourceId of node.sourceIds) {
        const analysis = analysesBySourceId.get(sourceId);
        const manifest = manifestsBySourceId.get(sourceId);
        if (manifest?.sourceType) {
          addFeature(features, "shared_source_type", manifest.sourceType);
        }
        const rationale = analysis?.rationales.find((item) => item.id === node.id);
        for (const token of themeTokens(rationale?.text ?? node.label)) {
          addFeature(features, "shared_rationale_theme", token);
        }
      }
    }
    return { node, featureValues: features };
  }).filter((context) => context.featureValues.size > 0);
}
function buildSemanticSimilarityEdges(nodes, edges, manifests, analyses, options) {
  const idfFloor = options?.similarityIdfFloor ?? DEFAULT_SIMILARITY_IDF_FLOOR;
  const similarityEdgeCap = Math.max(0, options?.similarityEdgeCap ?? Number.POSITIVE_INFINITY);
  const contexts = nodeContexts(nodes, manifests, analyses);
  const contextsById = new Map(contexts.map((context) => [context.node.id, context]));
  const directPairs = new Set(edges.map((edge) => pairKey(edge.source, edge.target)));
  const pairReasons = /* @__PURE__ */ new Map();
  const featureDocFrequency = /* @__PURE__ */ new Map();
  for (const context of contexts) {
    for (const [reason, values] of context.featureValues.entries()) {
      let inner = featureDocFrequency.get(reason);
      if (!inner) {
        inner = /* @__PURE__ */ new Map();
        featureDocFrequency.set(reason, inner);
      }
      for (const value of values) {
        inner.set(value, (inner.get(value) ?? 0) + 1);
      }
    }
  }
  const idfTable = buildIdfTable(featureDocFrequency, contexts.length);
  for (const reason of ["shared_concept", "shared_entity", "shared_symbol", "shared_rationale_theme", "shared_source_type"]) {
    const buckets = /* @__PURE__ */ new Map();
    for (const context of contexts) {
      for (const value of context.featureValues.get(reason) ?? []) {
        const bucketId = `${context.node.type}:${reason}:${value}`;
        if (!buckets.has(bucketId)) {
          buckets.set(bucketId, []);
        }
        buckets.get(bucketId)?.push(context.node.id);
      }
    }
    for (const [bucketId, nodeIds] of buckets.entries()) {
      if (nodeIds.length < 2) {
        continue;
      }
      const value = bucketId.slice(bucketId.indexOf(`${reason}:`) + `${reason}:`.length);
      const uniqueNodeIds = uniqueBy(nodeIds, (nodeId) => nodeId).sort((left, right) => left.localeCompare(right));
      for (let index = 0; index < uniqueNodeIds.length; index++) {
        const left = contextsById.get(uniqueNodeIds[index]);
        if (!left) {
          continue;
        }
        for (let cursor = index + 1; cursor < uniqueNodeIds.length; cursor++) {
          const right = contextsById.get(uniqueNodeIds[cursor]);
          if (!right || !hasDistinctScope(left.node, right.node)) {
            continue;
          }
          const key = pairKey(left.node.id, right.node.id);
          if (directPairs.has(key)) {
            continue;
          }
          if (!pairReasons.has(key)) {
            pairReasons.set(key, /* @__PURE__ */ new Map());
          }
          if (!pairReasons.get(key)?.has(reason)) {
            pairReasons.get(key)?.set(reason, /* @__PURE__ */ new Set());
          }
          pairReasons.get(key)?.get(reason)?.add(value);
        }
      }
    }
  }
  const candidates = [...pairReasons.entries()].flatMap(([key, reasons]) => {
    const [leftId, rightId] = key.split("|");
    const left = contextsById.get(leftId)?.node;
    const right = contextsById.get(rightId)?.node;
    if (!left || !right) {
      return [];
    }
    const prunedReasons = pruneReasonsByIdf(reasons, idfTable, idfFloor);
    if (prunedReasons.size === 0) {
      return [];
    }
    const confidence = similarityScore(prunedReasons, idfTable, idfFloor);
    if (confidence < 0.5) {
      return [];
    }
    return [
      {
        id: `similar:${sha256(`${left.id}|${right.id}|${[...prunedReasons.keys()].sort().join(",")}`).slice(0, 16)}`,
        source: left.id,
        target: right.id,
        relation: "semantically_similar_to",
        status: "inferred",
        evidenceClass: "inferred",
        confidence,
        provenance: uniqueBy(
          [...left.sourceIds, ...right.sourceIds].sort((a, b) => a.localeCompare(b)),
          (value) => value
        ),
        similarityReasons: [...prunedReasons.keys()].sort((a, b) => a.localeCompare(b)),
        similarityBasis: "feature_overlap"
      }
    ];
  }).sort((left, right) => right.confidence - left.confidence || left.id.localeCompare(right.id));
  if (candidates.length > similarityEdgeCap) {
    return candidates.slice(0, similarityEdgeCap);
  }
  return candidates;
}
function buildTopicHyperedges(graph) {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const connectedSources = /* @__PURE__ */ new Map();
  for (const edge of graph.edges) {
    if (edge.relation !== "mentions" || edge.evidenceClass !== "extracted") {
      continue;
    }
    const sourceNode = nodesById.get(edge.source);
    const targetNode = nodesById.get(edge.target);
    if (sourceNode?.type !== "source" || !(targetNode?.type === "concept" || targetNode?.type === "entity")) {
      continue;
    }
    if (!connectedSources.has(targetNode.id)) {
      connectedSources.set(targetNode.id, []);
    }
    connectedSources.get(targetNode.id)?.push(sourceNode.id);
  }
  return [...connectedSources.entries()].flatMap(([anchorId, members]) => {
    const anchor = nodesById.get(anchorId);
    const uniqueMembers = uniqueBy(members, (member) => member).sort((left, right) => left.localeCompare(right));
    if (!anchor || uniqueMembers.length < 3) {
      return [];
    }
    const nodeIds = [anchor.id, ...uniqueMembers];
    const sourcePageIds = uniqueBy(nodeIds.map((nodeId) => nodesById.get(nodeId)?.pageId ?? "").filter(Boolean), (value) => value);
    return [
      {
        id: `hyper:${sha256(`participate_in|${anchor.id}|${uniqueMembers.join("|")}`).slice(0, 16)}`,
        label: anchor.label,
        relation: "participate_in",
        nodeIds,
        evidenceClass: "extracted",
        confidence: Math.min(0.96, 0.72 + uniqueMembers.length * 0.06),
        sourcePageIds,
        why: `${uniqueMembers.length} source nodes converge on ${anchor.label} through extracted mention edges.`
      }
    ];
  });
}
function buildModuleFormHyperedges(graph) {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const definedSymbols = /* @__PURE__ */ new Map();
  for (const edge of graph.edges) {
    if (edge.relation !== "defines" || edge.evidenceClass !== "extracted") {
      continue;
    }
    const moduleNode = nodesById.get(edge.source);
    const symbolNode = nodesById.get(edge.target);
    if (moduleNode?.type !== "module" || symbolNode?.type !== "symbol") {
      continue;
    }
    if (!definedSymbols.has(moduleNode.id)) {
      definedSymbols.set(moduleNode.id, []);
    }
    definedSymbols.get(moduleNode.id)?.push(symbolNode.id);
  }
  return [...definedSymbols.entries()].flatMap(([moduleId, members]) => {
    const moduleNode = nodesById.get(moduleId);
    const uniqueMembers = uniqueBy(members, (member) => member).sort((left, right) => left.localeCompare(right));
    if (!moduleNode || uniqueMembers.length < 3) {
      return [];
    }
    const nodeIds = [moduleNode.id, ...uniqueMembers];
    const sourcePageIds = uniqueBy(nodeIds.map((nodeId) => nodesById.get(nodeId)?.pageId ?? "").filter(Boolean), (value) => value);
    return [
      {
        id: `hyper:${sha256(`form|${moduleNode.id}|${uniqueMembers.join("|")}`).slice(0, 16)}`,
        label: `${moduleNode.label} API`,
        relation: "form",
        nodeIds,
        evidenceClass: "extracted",
        confidence: Math.min(0.98, 0.78 + uniqueMembers.length * 0.04),
        sourcePageIds,
        why: `${moduleNode.label} and ${uniqueMembers.length} defined symbols form one local module surface.`
      }
    ];
  });
}
function enrichGraph(graph, manifests, analyses, extraSimilarityEdges = [], options) {
  const similarityEdges = buildSemanticSimilarityEdges(graph.nodes, graph.edges, manifests, analyses, options);
  const enrichedEdges = uniqueBy([...graph.edges, ...similarityEdges, ...extraSimilarityEdges], (edge) => edge.id).sort(
    (left, right) => left.id.localeCompare(right.id)
  );
  const hyperedges = uniqueBy(
    [
      ...buildTopicHyperedges({ ...graph, edges: enrichedEdges, hyperedges: [] }),
      ...buildModuleFormHyperedges({ ...graph, edges: enrichedEdges, hyperedges: [] })
    ].sort((left, right) => right.confidence - left.confidence || left.label.localeCompare(right.label)),
    (hyperedge) => hyperedge.id
  );
  return {
    edges: enrichedEdges,
    hyperedges
  };
}

// src/graph-share.ts
function displayVaultName(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "this vault";
}
function sortedFallbackHubs(graph) {
  return graph.nodes.filter((node) => node.type !== "source").sort(
    (left, right) => (right.degree ?? 0) - (left.degree ?? 0) || (right.bridgeScore ?? 0) - (left.bridgeScore ?? 0) || left.label.localeCompare(right.label)
  ).slice(0, 5);
}
function graphNodeMap(graph) {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}
function compactJoin(values, fallback) {
  const filtered = values.filter(Boolean);
  if (!filtered.length) {
    return fallback;
  }
  if (filtered.length === 1) {
    return filtered[0] ?? fallback;
  }
  if (filtered.length === 2) {
    return `${filtered[0]} and ${filtered[1]}`;
  }
  return `${filtered.slice(0, -1).join(", ")}, and ${filtered[filtered.length - 1]}`;
}
function buildShortPost(input) {
  const topHubLine = input.topHubs.length ? `Top hubs: ${compactJoin(
    input.topHubs.slice(0, 3).map((node) => node.label),
    "still emerging"
  )}.` : "Top hubs are still emerging.";
  const surprise = input.surprisingConnections[0];
  const surpriseLine = surprise ? `Most surprising link: ${surprise.sourceLabel} ${surprise.relation} ${surprise.targetLabel}.` : "The graph is ready for its first surprising connection.";
  return [
    `I scanned ${input.vaultName} with SwarmVault: ${input.overview.sources} sources -> ${input.overview.pages} wiki pages, ${input.overview.nodes} graph nodes, ${input.overview.edges} edges.`,
    topHubLine,
    surpriseLine,
    "Everything stays local. Try: npm install -g @swarmvaultai/cli && swarmvault scan ./your-repo"
  ].join("\n");
}
function escapeXml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
function clipText(value, maxLength) {
  const normalized = value.replaceAll("\n", " ").replaceAll("\r", " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
function svgText(input) {
  const attrs = [
    `x="${input.x}"`,
    `y="${input.y}"`,
    `font-size="${input.size}"`,
    `fill="${input.fill ?? "#f8fafc"}"`,
    `font-weight="${input.weight ?? 500}"`,
    `text-anchor="${input.anchor ?? "start"}"`,
    input.opacity === void 0 ? "" : `opacity="${input.opacity}"`
  ].filter(Boolean);
  return `  <text ${attrs.join(" ")}>${escapeXml(input.text)}</text>`;
}
function svgStatCard(input) {
  return [
    `  <rect x="${input.x}" y="${input.y}" width="168" height="92" rx="14" fill="#111827" stroke="#334155" />`,
    svgText({ x: input.x + 20, y: input.y + 36, text: String(input.value), size: 30, fill: "#ecfeff", weight: 800 }),
    svgText({ x: input.x + 20, y: input.y + 66, text: input.label, size: 16, fill: "#94a3b8", weight: 600 })
  ];
}
function svgListLines(input) {
  const items = input.items.length ? input.items.slice(0, input.maxItems) : [input.empty];
  const lines = [svgText({ x: input.x, y: input.y, text: input.title, size: 19, fill: "#a7f3d0", weight: 800 })];
  for (const [index, item] of items.entries()) {
    lines.push(
      svgText({ x: input.x, y: input.y + 38 + index * 30, text: `- ${clipText(item, 58)}`, size: 19, fill: "#e2e8f0", weight: 600 })
    );
  }
  return lines;
}
function buildGraphShareArtifact(input) {
  const { graph, report } = input;
  const vaultName = displayVaultName(input.vaultName);
  const nodesById = graphNodeMap(graph);
  const fallbackHubs = sortedFallbackHubs(graph);
  const reportHubs = report?.godNodes.map((node) => {
    const graphNode = nodesById.get(node.nodeId);
    return {
      nodeId: node.nodeId,
      label: node.label ?? graphNode?.label ?? node.nodeId,
      degree: node.degree ?? graphNode?.degree
    };
  }) ?? [];
  const fallbackHubHighlights = fallbackHubs.map((node) => ({
    nodeId: node.id,
    label: node.label,
    degree: node.degree
  }));
  const topHubs = (reportHubs.length ? reportHubs : fallbackHubHighlights).slice(0, 5);
  const reportBridgeNodes = report?.bridgeNodes.map((node) => {
    const graphNode = nodesById.get(node.nodeId);
    return {
      nodeId: node.nodeId,
      label: node.label ?? graphNode?.label ?? node.nodeId,
      bridgeScore: node.bridgeScore ?? graphNode?.bridgeScore
    };
  }) ?? [];
  const fallbackBridgeNodes = fallbackHubs.map((node) => ({
    nodeId: node.id,
    label: node.label,
    bridgeScore: node.bridgeScore
  }));
  const bridgeNodes = (reportBridgeNodes.length ? reportBridgeNodes : fallbackBridgeNodes).slice(0, 3).filter((node) => node.label);
  const surprisingConnections = (report?.surprisingConnections ?? []).slice(0, 3).map((connection) => {
    const source = nodesById.get(connection.sourceNodeId);
    const target = nodesById.get(connection.targetNodeId);
    return {
      sourceLabel: source?.label ?? connection.sourceNodeId,
      targetLabel: target?.label ?? connection.targetNodeId,
      relation: connection.relation,
      why: truncate(connection.why || connection.explanation || "Cross-community connection", 180)
    };
  });
  const overview = {
    sources: graph.sources.length,
    nodes: report?.overview.nodes ?? graph.nodes.length,
    edges: report?.overview.edges ?? graph.edges.length,
    pages: report?.overview.pages ?? graph.pages.length,
    communities: report?.overview.communities ?? graph.communities?.length ?? 0
  };
  const firstPartyOverview = report?.firstPartyOverview ?? {
    nodes: graph.nodes.filter((node) => node.sourceClass === "first_party").length,
    edges: graph.edges.length,
    pages: graph.pages.filter((page) => page.sourceClass === "first_party").length,
    communities: graph.communities?.length ?? 0
  };
  const relatedNodeIds = uniqueBy([...topHubs.map((node) => node.nodeId), ...bridgeNodes.map((node) => node.nodeId)], (value) => value);
  const relatedPageIds = uniqueBy(
    relatedNodeIds.map((nodeId) => nodesById.get(nodeId)?.pageId).filter((pageId) => Boolean(pageId)),
    (value) => value
  );
  const relatedSourceIds = uniqueBy(
    [...graph.sources.map((source) => source.sourceId), ...relatedNodeIds.flatMap((nodeId) => nodesById.get(nodeId)?.sourceIds ?? [])],
    (value) => value
  );
  const knowledgeGaps = report?.knowledgeGaps?.warnings?.length ? report.knowledgeGaps.warnings.slice(0, 3) : report?.warnings?.length ? report.warnings.slice(0, 3) : [];
  const tagline = `A local-first map of ${vaultName}: ${overview.sources} sources compiled into ${overview.nodes} graph nodes and ${overview.pages} wiki pages.`;
  const artifact = {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    vaultName,
    tagline,
    overview,
    firstPartyOverview,
    highlights: {
      topHubs,
      bridgeNodes,
      surprisingConnections,
      suggestedQuestions: (report?.suggestedQuestions ?? []).slice(0, 5)
    },
    knowledgeGaps,
    shortPost: "",
    relatedNodeIds,
    relatedPageIds,
    relatedSourceIds
  };
  return {
    ...artifact,
    shortPost: buildShortPost({
      vaultName,
      overview,
      topHubs,
      surprisingConnections
    })
  };
}
function renderGraphShareMarkdown(artifact) {
  const lines = [
    "# SwarmVault Share Card",
    "",
    `> ${artifact.tagline}`,
    "",
    "## Snapshot",
    "",
    `- Sources: ${artifact.overview.sources}`,
    `- Wiki pages: ${artifact.overview.pages}`,
    `- Graph nodes: ${artifact.overview.nodes}`,
    `- Graph edges: ${artifact.overview.edges}`,
    `- Communities: ${artifact.overview.communities}`,
    `- First-party focus: ${artifact.firstPartyOverview.nodes} nodes, ${artifact.firstPartyOverview.edges} edges, ${artifact.firstPartyOverview.pages} pages`,
    "",
    "## Highlights",
    "",
    artifact.highlights.topHubs.length ? `- Top hubs: ${compactJoin(
      artifact.highlights.topHubs.slice(0, 5).map((node) => node.degree ? `${node.label} (${node.degree})` : node.label),
      "none yet"
    )}` : "- Top hubs: none yet",
    artifact.highlights.bridgeNodes.length ? `- Bridge nodes: ${compactJoin(
      artifact.highlights.bridgeNodes.slice(0, 3).map((node) => node.label),
      "none yet"
    )}` : "- Bridge nodes: none yet",
    ...artifact.highlights.surprisingConnections.length ? artifact.highlights.surprisingConnections.map(
      (connection) => `- Surprising link: ${connection.sourceLabel} ${connection.relation} ${connection.targetLabel}. ${connection.why}`
    ) : ["- Surprising link: not enough cross-community evidence yet"],
    "",
    "## Ask Next",
    "",
    ...artifact.highlights.suggestedQuestions.length ? artifact.highlights.suggestedQuestions.map((question) => `- ${question}`) : ["- Add more sources, run `swarmvault compile`, then ask the graph what changed."],
    "",
    "## Share Post",
    "",
    "```text",
    artifact.shortPost,
    "```",
    "",
    "## Reproduce",
    "",
    "```bash",
    "npm install -g @swarmvaultai/cli",
    "swarmvault scan ./your-repo",
    "swarmvault graph share --post",
    "```",
    ""
  ];
  if (artifact.knowledgeGaps.length) {
    lines.splice(
      lines.indexOf("## Ask Next"),
      0,
      "## Gaps To Strengthen",
      "",
      ...artifact.knowledgeGaps.map((warning) => `- ${warning}`),
      ""
    );
  }
  return `${lines.join("\n")}`;
}
function renderGraphShareSvg(artifact) {
  const topHubs = artifact.highlights.topHubs.map((node) => node.degree ? `${node.label} (${node.degree})` : node.label);
  const bridges = artifact.highlights.bridgeNodes.map((node) => node.label);
  const surprise = artifact.highlights.surprisingConnections[0];
  const surpriseLine = surprise ? `${surprise.sourceLabel} ${surprise.relation} ${surprise.targetLabel}` : "Add more sources to reveal the first surprising link";
  const generated = new Date(artifact.generatedAt);
  const generatedLabel = Number.isNaN(generated.getTime()) ? artifact.generatedAt : generated.toISOString().slice(0, 10);
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">`,
    `  <title>SwarmVault share card for ${escapeXml(artifact.vaultName)}</title>`,
    `  <desc>${escapeXml(artifact.tagline)}</desc>`,
    "  <defs>",
    '    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">',
    '      <stop offset="0%" stop-color="#020617" />',
    '      <stop offset="58%" stop-color="#0f172a" />',
    '      <stop offset="100%" stop-color="#063f37" />',
    "    </linearGradient>",
    '    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">',
    '      <stop offset="0%" stop-color="#22c55e" />',
    '      <stop offset="100%" stop-color="#06b6d4" />',
    "    </linearGradient>",
    "  </defs>",
    '  <rect width="1200" height="630" fill="url(#background)" />',
    '  <rect x="34" y="34" width="1132" height="562" rx="28" fill="#020617" opacity="0.72" stroke="#1f2937" />',
    '  <path d="M92 512 C214 386 314 456 438 326 C540 218 648 284 746 194 C860 88 1004 152 1110 84" fill="none" stroke="#22c55e" stroke-width="4" opacity="0.35" />',
    '  <circle cx="92" cy="512" r="9" fill="#22c55e" />',
    '  <circle cx="438" cy="326" r="10" fill="#06b6d4" />',
    '  <circle cx="746" cy="194" r="10" fill="#a7f3d0" />',
    '  <circle cx="1110" cy="84" r="9" fill="#22c55e" />',
    svgText({ x: 78, y: 96, text: "SwarmVault", size: 28, fill: "#86efac", weight: 900 }),
    svgText({ x: 78, y: 152, text: clipText(artifact.vaultName, 42), size: 54, fill: "#f8fafc", weight: 900 }),
    svgText({ x: 78, y: 196, text: clipText(artifact.tagline, 86), size: 22, fill: "#cbd5e1", weight: 600 }),
    ...svgStatCard({ x: 78, y: 242, label: "Sources", value: artifact.overview.sources }),
    ...svgStatCard({ x: 270, y: 242, label: "Wiki pages", value: artifact.overview.pages }),
    ...svgStatCard({ x: 462, y: 242, label: "Graph nodes", value: artifact.overview.nodes }),
    ...svgStatCard({ x: 654, y: 242, label: "Edges", value: artifact.overview.edges }),
    `  <rect x="870" y="240" width="246" height="94" rx="18" fill="url(#accent)" opacity="0.95" />`,
    svgText({ x: 993, y: 278, text: "Local-first", size: 22, fill: "#052e16", weight: 900, anchor: "middle" }),
    svgText({ x: 993, y: 307, text: "no API keys required", size: 18, fill: "#064e3b", weight: 800, anchor: "middle" }),
    ...svgListLines({
      x: 82,
      y: 398,
      title: "Top hubs",
      items: topHubs,
      empty: "Still emerging",
      maxItems: 3
    }),
    ...svgListLines({
      x: 470,
      y: 398,
      title: "Bridge nodes",
      items: bridges,
      empty: "Still emerging",
      maxItems: 3
    }),
    svgText({ x: 820, y: 398, text: "Surprising link", size: 19, fill: "#a7f3d0", weight: 800 }),
    svgText({ x: 820, y: 436, text: clipText(surpriseLine, 40), size: 21, fill: "#e2e8f0", weight: 800 }),
    svgText({
      x: 820,
      y: 470,
      text: clipText(surprise?.why ?? "Run compile again after adding more sources.", 44),
      size: 17,
      fill: "#94a3b8",
      weight: 600
    }),
    `  <rect x="78" y="536" width="744" height="42" rx="12" fill="#0f172a" stroke="#1e293b" />`,
    svgText({
      x: 100,
      y: 564,
      text: "npm install -g @swarmvaultai/cli && swarmvault scan ./your-repo",
      size: 18,
      fill: "#d1fae5",
      weight: 800
    }),
    svgText({ x: 1116, y: 564, text: `Generated ${generatedLabel}`, size: 16, fill: "#94a3b8", weight: 600, anchor: "end" }),
    "</svg>",
    ""
  ];
  return lines.join("\n");
}
function renderGraphSharePreviewHtml(artifact) {
  const rawSvg = renderGraphShareSvg(artifact);
  const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>\n';
  const svg = rawSvg.startsWith(xmlDeclaration) ? rawSvg.slice(xmlDeclaration.length) : rawSvg;
  const topHubs = artifact.highlights.topHubs.slice(0, 5).map((node) => `<li>${escapeXml(node.degree ? `${node.label} (${node.degree})` : node.label)}</li>`).join("\n");
  const questions = artifact.highlights.suggestedQuestions.slice(0, 3).map((question) => `<li>${escapeXml(question)}</li>`).join("\n");
  const title = `SwarmVault Share Kit - ${artifact.vaultName}`;
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${escapeXml(title)}</title>`,
    `  <meta name="description" content="${escapeXml(artifact.tagline)}">`,
    "  <style>",
    "    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #020617; color: #e2e8f0; }",
    "    body { margin: 0; min-height: 100vh; background: #020617; }",
    "    main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 48px; }",
    "    header { margin-bottom: 24px; }",
    "    h1 { margin: 0 0 8px; font-size: 34px; line-height: 1.15; letter-spacing: 0; color: #f8fafc; }",
    "    p { margin: 0; color: #94a3b8; line-height: 1.6; }",
    "    .preview { display: block; width: 100%; max-width: 960px; margin: 0 auto 28px; border: 1px solid #1e293b; background: #020617; }",
    "    .preview svg { display: block; width: 100%; height: auto; }",
    "    .grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr); gap: 18px; }",
    "    section { border: 1px solid #1e293b; background: #0f172a; padding: 18px; }",
    "    h2 { margin: 0 0 12px; font-size: 16px; color: #86efac; letter-spacing: 0; }",
    "    pre { white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; color: #d1fae5; font-size: 14px; line-height: 1.55; }",
    "    ul { margin: 0; padding-left: 20px; color: #cbd5e1; line-height: 1.6; }",
    "    code { color: #d1fae5; }",
    "    .cta { margin-top: 14px; padding: 12px 14px; background: #020617; border: 1px solid #334155; color: #d1fae5; font-weight: 700; overflow-wrap: anywhere; }",
    "    @media (max-width: 760px) { main { width: min(100% - 24px, 1120px); padding-top: 20px; } .grid { grid-template-columns: 1fr; } h1 { font-size: 26px; } section { padding: 14px; } }",
    "  </style>",
    "</head>",
    "<body>",
    '  <main aria-labelledby="share-title">',
    "    <header>",
    `      <h1 id="share-title">${escapeXml(artifact.vaultName)}</h1>`,
    `      <p>${escapeXml(artifact.tagline)}</p>`,
    "    </header>",
    '    <section class="preview" aria-label="Visual share card">',
    svg.split("\n").map((line) => `      ${line}`).join("\n"),
    "    </section>",
    '    <div class="grid">',
    '      <section aria-labelledby="share-post-title">',
    '        <h2 id="share-post-title">Share Post</h2>',
    `        <pre>${escapeXml(artifact.shortPost)}</pre>`,
    "      </section>",
    '      <section aria-labelledby="share-details-title">',
    '        <h2 id="share-details-title">Highlights</h2>',
    `        <ul>${topHubs || "<li>Top hubs are still emerging.</li>"}</ul>`,
    '        <h2 style="margin-top:18px">Ask Next</h2>',
    `        <ul>${questions || "<li>Add more sources, run compile, then ask what changed.</li>"}</ul>`,
    '        <div class="cta">npm install -g @swarmvaultai/cli && swarmvault scan ./your-repo</div>',
    "      </section>",
    "    </div>",
    "  </main>",
    "</body>",
    "</html>",
    ""
  ].join("\n");
}
function renderGraphShareBundleFiles(artifact) {
  return [
    {
      relativePath: "share-card.md",
      content: renderGraphShareMarkdown(artifact)
    },
    {
      relativePath: "share-post.txt",
      content: `${artifact.shortPost}
`
    },
    {
      relativePath: "share-card.svg",
      content: renderGraphShareSvg(artifact)
    },
    {
      relativePath: "share-preview.html",
      content: renderGraphSharePreviewHtml(artifact)
    },
    {
      relativePath: "share-artifact.json",
      content: `${JSON.stringify(artifact, null, 2)}
`
    }
  ];
}

// src/graph-query-core.ts
var NODE_TYPE_PRIORITY = {
  concept: 6,
  entity: 5,
  source: 4,
  module: 3,
  symbol: 2,
  rationale: 1
};
function normalizeTarget(value) {
  return value.replace(/\s+/g, " ").trim().normalize("NFKD").replace(/\p{Mn}+/gu, "").toLowerCase();
}
function uniqueStrings2(values) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}
function scoreMatch(query, candidate) {
  const q = normalizeTarget(query);
  const c = normalizeTarget(candidate);
  if (!q || !c) return 0;
  if (c === q) return 100;
  if (c.startsWith(q)) return 80;
  if (c.includes(q)) return 60;
  const qTokens = q.split(/\s+/).filter(Boolean);
  const cTokens = new Set(c.split(/\s+/).filter(Boolean));
  const overlap = qTokens.filter((token) => cTokens.has(token)).length;
  return overlap ? overlap * 10 : 0;
}
function buildAdjacency(graph) {
  const adjacency = /* @__PURE__ */ new Map();
  const push = (nodeId, item) => {
    const list = adjacency.get(nodeId);
    if (list) {
      list.push(item);
    } else {
      adjacency.set(nodeId, [item]);
    }
  };
  for (const edge of graph.edges) {
    push(edge.source, { edge, nodeId: edge.target, direction: "outgoing" });
    push(edge.target, { edge, nodeId: edge.source, direction: "incoming" });
  }
  for (const [nodeId, items] of adjacency.entries()) {
    items.sort((left, right) => right.edge.confidence - left.edge.confidence || left.edge.relation.localeCompare(right.edge.relation));
    adjacency.set(nodeId, items);
  }
  return adjacency;
}
function compareLabelCandidates(left, right) {
  const priorityDelta = (NODE_TYPE_PRIORITY[right.type] ?? 0) - (NODE_TYPE_PRIORITY[left.type] ?? 0);
  if (priorityDelta !== 0) return priorityDelta;
  const degreeDelta = (right.degree ?? 0) - (left.degree ?? 0);
  if (degreeDelta !== 0) return degreeDelta;
  return left.id.localeCompare(right.id);
}
function resolveCoreNode(graph, target) {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  if (byId.has(target)) return byId.get(target);
  const normalized = normalizeTarget(target);
  const labelMatches = graph.nodes.filter((node) => normalizeTarget(node.label) === normalized || normalizeTarget(node.id) === normalized);
  if (labelMatches.length) {
    return labelMatches.slice().sort(compareLabelCandidates)[0];
  }
  const pages = graph.pages ?? [];
  const pageHit = pages.map((page) => ({
    page,
    score: Math.max(scoreMatch(target, page.title), scoreMatch(target, page.path))
  })).filter((item) => item.score > 0).sort((left, right) => right.score - left.score || left.page.title.localeCompare(right.page.title))[0];
  if (pageHit) {
    const primary = graph.nodes.find((node) => node.pageId === pageHit.page.id);
    if (primary) return primary;
  }
  const fuzzy = graph.nodes.map((node) => ({ node, score: Math.max(scoreMatch(target, node.label), scoreMatch(target, node.id)) })).filter((item) => item.score > 0).sort((left, right) => right.score - left.score || compareLabelCandidates(left.node, right.node))[0];
  return fuzzy?.node;
}
function runCoreGraphPath(graph, from, to) {
  const start = resolveCoreNode(graph, from);
  const end = resolveCoreNode(graph, to);
  if (!start || !end) {
    return {
      from,
      to,
      resolvedFromNodeId: start?.id,
      resolvedToNodeId: end?.id,
      found: false,
      nodeIds: [],
      edgeIds: [],
      pageIds: [],
      summary: "Could not resolve one or both graph targets."
    };
  }
  const adjacency = buildAdjacency(graph);
  const queue = [start.id];
  const visited = /* @__PURE__ */ new Set([start.id]);
  const previous = /* @__PURE__ */ new Map();
  while (queue.length) {
    const current2 = queue.shift();
    if (current2 === end.id) break;
    for (const neighbor of adjacency.get(current2) ?? []) {
      if (visited.has(neighbor.nodeId)) continue;
      visited.add(neighbor.nodeId);
      previous.set(neighbor.nodeId, { nodeId: current2, edgeId: neighbor.edge.id });
      queue.push(neighbor.nodeId);
    }
  }
  if (!visited.has(end.id)) {
    return {
      from,
      to,
      resolvedFromNodeId: start.id,
      resolvedToNodeId: end.id,
      found: false,
      nodeIds: [],
      edgeIds: [],
      pageIds: [],
      summary: `No path found between ${start.label} and ${end.label}.`
    };
  }
  const nodeIds = [];
  const edgeIds = [];
  let current = end.id;
  while (current !== start.id) {
    nodeIds.push(current);
    const prev = previous.get(current);
    if (!prev) break;
    edgeIds.push(prev.edgeId);
    current = prev.nodeId;
  }
  nodeIds.push(start.id);
  nodeIds.reverse();
  edgeIds.reverse();
  const nodeById2 = new Map(graph.nodes.map((node) => [node.id, node]));
  const pageIds = uniqueStrings2(
    nodeIds.flatMap((nodeId) => {
      const node = nodeById2.get(nodeId);
      return node?.pageId ? [node.pageId] : [];
    })
  );
  return {
    from,
    to,
    resolvedFromNodeId: start.id,
    resolvedToNodeId: end.id,
    found: true,
    nodeIds,
    edgeIds,
    pageIds,
    summary: nodeIds.map((nodeId) => nodeById2.get(nodeId)?.label ?? nodeId).join(" -> ")
  };
}
function runCoreGraphExplain(graph, target) {
  const node = resolveCoreNode(graph, target);
  if (!node) return void 0;
  const adjacency = buildAdjacency(graph);
  const nodeById2 = new Map(graph.nodes.map((candidate) => [candidate.id, candidate]));
  const neighbors = [];
  for (const neighbor of adjacency.get(node.id) ?? []) {
    const targetNode = nodeById2.get(neighbor.nodeId);
    if (!targetNode) continue;
    neighbors.push({
      nodeId: targetNode.id,
      label: targetNode.label,
      type: targetNode.type,
      pageId: targetNode.pageId,
      relation: neighbor.edge.relation,
      direction: neighbor.direction,
      confidence: neighbor.edge.confidence,
      evidenceClass: neighbor.edge.evidenceClass
    });
  }
  neighbors.sort((left, right) => right.confidence - left.confidence || left.label.localeCompare(right.label));
  const pagesById = new Map((graph.pages ?? []).map((page2) => [page2.id, page2]));
  const page = node.pageId ? pagesById.get(node.pageId) : void 0;
  const community = node.communityId ? graph.communities?.find((candidate) => candidate.id === node.communityId) : void 0;
  const hyperedges = (graph.hyperedges ?? []).filter((hyperedge) => hyperedge.nodeIds.includes(node.id)).slice().sort((left, right) => right.confidence - left.confidence || left.label.localeCompare(right.label));
  const summary = [
    `Node: ${node.label}`,
    `Type: ${node.type}`,
    `Community: ${node.communityId ?? "none"}`,
    `Neighbors: ${neighbors.length}`,
    `Group patterns: ${hyperedges.length}`,
    `Page: ${page?.path ?? "none"}`
  ].join("\n");
  return {
    target,
    node,
    page,
    community: community ? { id: community.id, label: community.label } : void 0,
    neighbors,
    hyperedges,
    summary
  };
}

// src/graph-tools.ts
function normalizeTarget2(value) {
  return normalizeWhitespace(value).normalize("NFKD").replace(/\p{Mn}+/gu, "").toLowerCase();
}
function computeNormLabel(label) {
  return normalizeTarget2(label);
}
function nodeById(graph) {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}
function pageById(graph) {
  return new Map(graph.pages.map((page) => [page.id, page]));
}
function hyperedgesForNode(graph, nodeId) {
  return (graph.hyperedges ?? []).filter((hyperedge) => hyperedge.nodeIds.includes(nodeId)).sort((left, right) => right.confidence - left.confidence || left.label.localeCompare(right.label));
}
function scoreMatch2(query, candidate) {
  const normalizedQuery = normalizeTarget2(query);
  const normalizedCandidate = normalizeTarget2(candidate);
  if (!normalizedQuery || !normalizedCandidate) {
    return 0;
  }
  if (normalizedCandidate === normalizedQuery) {
    return 100;
  }
  if (normalizedCandidate.startsWith(normalizedQuery)) {
    return 80;
  }
  if (normalizedCandidate.includes(normalizedQuery)) {
    return 60;
  }
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const candidateTokens = new Set(normalizedCandidate.split(/\s+/).filter(Boolean));
  const overlap = queryTokens.filter((token) => candidateTokens.has(token)).length;
  return overlap ? overlap * 10 : 0;
}
function primaryNodeForPage(graph, page) {
  const byId = nodeById(graph);
  return page.nodeIds.map((nodeId) => byId.get(nodeId)).find((node) => Boolean(node));
}
function pageSearchMatches(graph, question, searchResults) {
  const pages = pageById(graph);
  return searchResults.map((result) => {
    const page = pages.get(result.pageId);
    const score = Math.max(scoreMatch2(question, result.title), scoreMatch2(question, result.path));
    if (!page || score <= 0) {
      return null;
    }
    return {
      type: "page",
      id: page.id,
      label: page.title,
      score
    };
  }).filter((match) => Boolean(match));
}
function nodeMatches(graph, query) {
  return graph.nodes.map((node) => ({
    type: "node",
    id: node.id,
    label: node.label,
    score: Math.max(scoreMatch2(query, node.label), scoreMatch2(query, node.id))
  })).filter((match) => match.score > 0).sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
}
function hyperedgeMatches(graph, query) {
  return (graph.hyperedges ?? []).map((hyperedge) => ({
    type: "hyperedge",
    id: hyperedge.id,
    label: hyperedge.label,
    score: Math.max(scoreMatch2(query, hyperedge.label), scoreMatch2(query, hyperedge.why), scoreMatch2(query, hyperedge.relation))
  })).filter((match) => match.score > 0).sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
}
function graphAdjacency(graph) {
  const adjacency = /* @__PURE__ */ new Map();
  const push = (nodeId, item) => {
    if (!adjacency.has(nodeId)) {
      adjacency.set(nodeId, []);
    }
    adjacency.get(nodeId)?.push(item);
  };
  for (const edge of graph.edges) {
    push(edge.source, { edge, nodeId: edge.target, direction: "outgoing" });
    push(edge.target, { edge, nodeId: edge.source, direction: "incoming" });
  }
  for (const [nodeId, items] of adjacency.entries()) {
    items.sort((left, right) => right.edge.confidence - left.edge.confidence || left.edge.relation.localeCompare(right.edge.relation));
    adjacency.set(nodeId, items);
  }
  return adjacency;
}
var NODE_TYPE_PRIORITY2 = {
  concept: 6,
  entity: 5,
  source: 4,
  module: 3,
  symbol: 2,
  rationale: 1
};
function nodeTypePriority(type) {
  return NODE_TYPE_PRIORITY2[type] ?? 0;
}
function compareLabelCandidates2(left, right) {
  const priorityDelta = nodeTypePriority(right.type) - nodeTypePriority(left.type);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }
  const degreeDelta = (right.degree ?? 0) - (left.degree ?? 0);
  if (degreeDelta !== 0) {
    return degreeDelta;
  }
  return left.id.localeCompare(right.id);
}
function resolveNode(graph, target) {
  const normalized = normalizeTarget2(target);
  const byId = nodeById(graph);
  if (byId.has(target)) {
    return byId.get(target);
  }
  const labelMatches = graph.nodes.filter((node) => normalizeTarget2(node.label) === normalized || normalizeTarget2(node.id) === normalized);
  if (labelMatches.length) {
    return labelMatches.sort(compareLabelCandidates2)[0];
  }
  const pages = graph.pages.map((page) => ({
    page,
    score: Math.max(scoreMatch2(target, page.title), scoreMatch2(target, page.path))
  })).filter((item) => item.score > 0).sort((left, right) => right.score - left.score || left.page.title.localeCompare(right.page.title));
  if (pages[0]) {
    return primaryNodeForPage(graph, pages[0].page);
  }
  return graph.nodes.map((node) => ({ node, score: Math.max(scoreMatch2(target, node.label), scoreMatch2(target, node.id)) })).filter((item) => item.score > 0).sort((left, right) => right.score - left.score || compareLabelCandidates2(left.node, right.node))[0]?.node;
}
function queryGraph(graph, question, searchResults, options) {
  const traversal = options?.traversal ?? "bfs";
  const budget = Math.max(3, Math.min(options?.budget ?? 12, 50));
  const matches = uniqueBy(
    [
      ...options?.semanticMatches ?? [],
      ...pageSearchMatches(graph, question, searchResults),
      ...nodeMatches(graph, question),
      ...hyperedgeMatches(graph, question)
    ],
    (match) => `${match.type}:${match.id}`
  ).sort((left, right) => right.score - left.score || left.label.localeCompare(right.label)).slice(0, 12);
  const pages = pageById(graph);
  const seeds = uniqueBy(
    [
      ...searchResults.flatMap((result) => pages.get(result.pageId)?.nodeIds ?? []),
      ...matches.filter((match) => match.type === "page").flatMap((match) => pages.get(match.id)?.nodeIds ?? []),
      ...matches.filter((match) => match.type === "node").map((match) => match.id),
      ...matches.filter((match) => match.type === "hyperedge").flatMap((match) => graph.hyperedges.find((hyperedge) => hyperedge.id === match.id)?.nodeIds ?? [])
    ],
    (item) => item
  ).filter(Boolean);
  const adjacency = graphAdjacency(graph);
  const visitedNodeIds = [];
  const visitedEdgeIds = /* @__PURE__ */ new Set();
  const seen = /* @__PURE__ */ new Set();
  const frontier = [...seeds];
  while (frontier.length && visitedNodeIds.length < budget) {
    const current = traversal === "dfs" ? frontier.pop() : frontier.shift();
    if (!current || seen.has(current)) {
      continue;
    }
    seen.add(current);
    visitedNodeIds.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      visitedEdgeIds.add(neighbor.edge.id);
      if (!seen.has(neighbor.nodeId)) {
        frontier.push(neighbor.nodeId);
      }
      if (visitedNodeIds.length + frontier.length >= budget * 2) {
        break;
      }
    }
  }
  const nodes = nodeById(graph);
  const pageIds = uniqueBy(
    [
      ...searchResults.map((result) => result.pageId),
      ...matches.filter((match) => match.type === "page").map((match) => match.id),
      ...visitedNodeIds.flatMap((nodeId) => {
        const node = nodes.get(nodeId);
        return node?.pageId ? [node.pageId] : [];
      })
    ],
    (item) => item
  );
  const communities = uniqueBy(
    visitedNodeIds.map((nodeId) => nodes.get(nodeId)?.communityId).filter((communityId) => Boolean(communityId)),
    (item) => item
  );
  const hyperedgeIds = uniqueBy(
    (graph.hyperedges ?? []).filter((hyperedge) => hyperedge.nodeIds.some((nodeId) => visitedNodeIds.includes(nodeId))).map((hyperedge) => hyperedge.id),
    (item) => item
  );
  return {
    question,
    traversal,
    seedNodeIds: seeds,
    seedPageIds: uniqueBy(
      [...searchResults.map((result) => result.pageId), ...matches.filter((match) => match.type === "page").map((match) => match.id)],
      (item) => item
    ),
    visitedNodeIds,
    visitedEdgeIds: [...visitedEdgeIds],
    hyperedgeIds,
    pageIds,
    communities,
    matches,
    summary: [
      `Seeds: ${seeds.join(", ") || "none"}`,
      `Visited nodes: ${visitedNodeIds.length}`,
      `Visited edges: ${visitedEdgeIds.size}`,
      `Touched group patterns: ${hyperedgeIds.length}`,
      `Communities: ${communities.join(", ") || "none"}`,
      `Pages: ${pageIds.join(", ") || "none"}`
    ].join("\n")
  };
}
function shortestGraphPath(graph, from, to) {
  return runCoreGraphPath(graph, from, to);
}
function explainGraphTarget(graph, target) {
  const result = runCoreGraphExplain(graph, target);
  if (!result) {
    throw new Error(`Could not resolve graph target: ${target}`);
  }
  const nodes = nodeById(graph);
  const node = nodes.get(result.node.id) ?? result.node;
  const page = node.pageId ? pageById(graph).get(node.pageId) : void 0;
  const neighbors = result.neighbors.map((neighbor) => ({
    ...neighbor,
    type: nodes.get(neighbor.nodeId)?.type ?? neighbor.type,
    evidenceClass: neighbor.evidenceClass
  }));
  return {
    target,
    node,
    page,
    community: result.community,
    neighbors,
    hyperedges: hyperedgesForNode(graph, node.id),
    summary: result.summary
  };
}
function topGodNodes(graph, limit = 10) {
  return graph.nodes.filter((node) => node.isGodNode).sort((left, right) => (right.degree ?? 0) - (left.degree ?? 0)).slice(0, limit);
}
function listHyperedges(graph, target, limit = 25) {
  if (!target) {
    return [...graph.hyperedges ?? []].sort((left, right) => right.confidence - left.confidence || left.label.localeCompare(right.label)).slice(0, limit);
  }
  const node = resolveNode(graph, target);
  if (node) {
    return hyperedgesForNode(graph, node.id).slice(0, limit);
  }
  const page = graph.pages.find((candidate) => normalizeTarget2(candidate.path) === normalizeTarget2(target) || candidate.id === target);
  if (!page) {
    return [];
  }
  return (graph.hyperedges ?? []).filter((hyperedge) => hyperedge.sourcePageIds.includes(page.id) || page.nodeIds.some((nodeId) => hyperedge.nodeIds.includes(nodeId))).sort((left, right) => right.confidence - left.confidence || left.label.localeCompare(right.label)).slice(0, limit);
}
function graphDiff(oldGraph, newGraph) {
  const oldNodeIds = new Set(oldGraph.nodes.map((node) => node.id));
  const newNodeIds = new Set(newGraph.nodes.map((node) => node.id));
  const addedNodes = newGraph.nodes.filter((node) => !oldNodeIds.has(node.id)).map((node) => ({ id: node.id, label: node.label, type: node.type }));
  const removedNodes = oldGraph.nodes.filter((node) => !newNodeIds.has(node.id)).map((node) => ({ id: node.id, label: node.label, type: node.type }));
  const oldEdgeIds = new Set(oldGraph.edges.map((edge) => edge.id));
  const newEdgeIds = new Set(newGraph.edges.map((edge) => edge.id));
  const addedEdges = newGraph.edges.filter((edge) => !oldEdgeIds.has(edge.id)).map((edge) => ({ id: edge.id, source: edge.source, target: edge.target, relation: edge.relation, evidenceClass: edge.evidenceClass }));
  const removedEdges = oldGraph.edges.filter((edge) => !newEdgeIds.has(edge.id)).map((edge) => ({ id: edge.id, source: edge.source, target: edge.target, relation: edge.relation, evidenceClass: edge.evidenceClass }));
  const oldPageIds = new Set(oldGraph.pages.map((page) => page.id));
  const newPageIds = new Set(newGraph.pages.map((page) => page.id));
  const addedPages = newGraph.pages.filter((page) => !oldPageIds.has(page.id)).map((page) => ({ id: page.id, path: page.path, title: page.title, kind: page.kind }));
  const removedPages = oldGraph.pages.filter((page) => !newPageIds.has(page.id)).map((page) => ({ id: page.id, path: page.path, title: page.title, kind: page.kind }));
  const parts = [];
  if (addedNodes.length || removedNodes.length) {
    const segments = [];
    if (addedNodes.length) segments.push(`${addedNodes.length} added`);
    if (removedNodes.length) segments.push(`${removedNodes.length} removed`);
    parts.push(`${segments.join(", ")} nodes`);
  }
  if (addedEdges.length || removedEdges.length) {
    const segments = [];
    if (addedEdges.length) segments.push(`${addedEdges.length} added`);
    if (removedEdges.length) segments.push(`${removedEdges.length} removed`);
    parts.push(`${segments.join(", ")} edges`);
  }
  if (addedPages.length || removedPages.length) {
    const segments = [];
    if (addedPages.length) segments.push(`${addedPages.length} added`);
    if (removedPages.length) segments.push(`${removedPages.length} removed`);
    parts.push(`${segments.join(", ")} pages`);
  }
  const summary = parts.length ? parts.join("; ") : "No changes";
  return { addedNodes, removedNodes, addedEdges, removedEdges, addedPages, removedPages, summary };
}
function blastRadius(graph, target, options) {
  const maxDepth = Math.max(1, Math.min(options?.maxDepth ?? 3, 10));
  const resolved = resolveNode(graph, target);
  const moduleNode = resolved?.type === "module" ? resolved : resolved?.moduleId ? graph.nodes.find((n) => n.id === resolved.moduleId) : void 0;
  if (!moduleNode) {
    const normalizedTarget = normalizeTarget2(target);
    const candidate = graph.nodes.filter((n) => n.type === "module").find((n) => normalizeTarget2(n.label).includes(normalizedTarget) || normalizeTarget2(n.id).includes(normalizedTarget));
    if (!candidate) {
      return {
        target,
        totalAffected: 0,
        maxDepth,
        affectedModules: [],
        summary: `No module found matching "${target}".`
      };
    }
    return blastRadius(graph, candidate.id, options);
  }
  const reverseImports = /* @__PURE__ */ new Map();
  for (const edge of graph.edges) {
    if (edge.relation === "imports") {
      const dependents = reverseImports.get(edge.target) ?? [];
      dependents.push(edge.source);
      reverseImports.set(edge.target, dependents);
    }
  }
  const affected = [];
  const seen = /* @__PURE__ */ new Set([moduleNode.id]);
  const frontier = [{ id: moduleNode.id, depth: 0 }];
  const nodes = nodeById(graph);
  while (frontier.length > 0) {
    const current = frontier.shift();
    if (current.depth >= maxDepth) {
      continue;
    }
    for (const dependentId of reverseImports.get(current.id) ?? []) {
      if (seen.has(dependentId)) {
        continue;
      }
      seen.add(dependentId);
      const dependentNode = nodes.get(dependentId);
      const nextDepth = current.depth + 1;
      affected.push({
        moduleId: dependentId,
        label: dependentNode?.label ?? dependentId,
        depth: nextDepth
      });
      frontier.push({ id: dependentId, depth: nextDepth });
    }
  }
  affected.sort((a, b) => a.depth - b.depth || a.label.localeCompare(b.label));
  const summary = affected.length ? `Changing "${moduleNode.label}" affects ${affected.length} module${affected.length === 1 ? "" : "s"} (max depth ${maxDepth}).` : `No modules depend on "${moduleNode.label}".`;
  return {
    target,
    resolvedModuleId: moduleNode.id,
    affectedModules: affected,
    totalAffected: affected.length,
    maxDepth,
    summary
  };
}

// src/large-repo-defaults.ts
var LARGE_REPO_NODE_THRESHOLD = 1e3;
var DEFAULT_SMALL_GOD_NODE_LIMIT = 20;
var DEFAULT_LARGE_GOD_NODE_LIMIT = 10;
var DEFAULT_SIMILARITY_IDF_FLOOR2 = 0.5;
var SIMILARITY_EDGE_CAP_MAX = 2e4;
var SIMILARITY_EDGE_CAP_PER_NODE = 5;
var MIN_FOLD_BELOW = 3;
function clampPositiveInteger(value, fallback) {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.max(1, Math.floor(value));
}
function clampNonNegativeNumber(value, fallback) {
  if (!Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return value;
}
function resolveLargeRepoDefaults(input) {
  const nodeCount = Math.max(0, Math.floor(input.nodeCount));
  const totalCommunities = Math.max(0, Math.floor(input.totalCommunities ?? 0));
  const graphConfig = input.config?.graph;
  const isLargeRepo = nodeCount > LARGE_REPO_NODE_THRESHOLD;
  const defaultGodNodeLimit = isLargeRepo ? DEFAULT_LARGE_GOD_NODE_LIMIT : DEFAULT_SMALL_GOD_NODE_LIMIT;
  const godNodeLimit = graphConfig?.godNodeLimit !== void 0 ? clampPositiveInteger(graphConfig.godNodeLimit, defaultGodNodeLimit) : defaultGodNodeLimit;
  const defaultSimilarityEdgeCap = Math.min(SIMILARITY_EDGE_CAP_MAX, Math.max(0, SIMILARITY_EDGE_CAP_PER_NODE * nodeCount));
  const similarityEdgeCap = graphConfig?.similarityEdgeCap !== void 0 ? clampPositiveInteger(graphConfig.similarityEdgeCap, defaultSimilarityEdgeCap) : defaultSimilarityEdgeCap;
  const similarityIdfFloor = graphConfig?.similarityIdfFloor !== void 0 ? clampNonNegativeNumber(graphConfig.similarityIdfFloor, DEFAULT_SIMILARITY_IDF_FLOOR2) : DEFAULT_SIMILARITY_IDF_FLOOR2;
  const defaultFoldBelow = Math.max(MIN_FOLD_BELOW, Math.ceil(totalCommunities / 50));
  const foldCommunitiesBelow = graphConfig?.foldCommunitiesBelow !== void 0 ? clampPositiveInteger(graphConfig.foldCommunitiesBelow, defaultFoldBelow) : defaultFoldBelow;
  return {
    godNodeLimit,
    foldCommunitiesBelow,
    similarityEdgeCap,
    similarityIdfFloor
  };
}

// src/markdown.ts
function tierFrontmatterFragment(tier) {
  if (!tier) {
    return {};
  }
  const fragment = {};
  if (tier.tier === "working" || tier.tier === "episodic" || tier.tier === "semantic" || tier.tier === "procedural") {
    fragment.tier = tier.tier;
  }
  if (Array.isArray(tier.consolidatedFromPageIds) && tier.consolidatedFromPageIds.length > 0) {
    fragment.consolidated_from_page_ids = [...tier.consolidatedFromPageIds];
  }
  if (typeof tier.consolidationConfidence === "number" && Number.isFinite(tier.consolidationConfidence)) {
    fragment.consolidation_confidence = Math.max(0, Math.min(1, tier.consolidationConfidence));
  }
  return fragment;
}
function uniqueStrings3(values) {
  return uniqueBy(values.filter(Boolean), (value) => value);
}
var GUIDED_SOURCE_MARKER_PREFIX = "<!-- swarmvault-guided-source:";
var GUIDED_SOURCE_START_SUFFIX = ":start -->";
var GUIDED_SOURCE_END_SUFFIX = ":end -->";
function extractGuidedSourceBlocks(content) {
  if (!content) {
    return [];
  }
  const blocks = [];
  let cursor = 0;
  while (cursor < content.length) {
    const startIndex = content.indexOf(GUIDED_SOURCE_MARKER_PREFIX, cursor);
    if (startIndex === -1) {
      break;
    }
    const scopeEndIndex = content.indexOf(GUIDED_SOURCE_START_SUFFIX, startIndex);
    if (scopeEndIndex === -1) {
      break;
    }
    const scopeId = content.slice(startIndex + GUIDED_SOURCE_MARKER_PREFIX.length, scopeEndIndex);
    const endMarker = `${GUIDED_SOURCE_MARKER_PREFIX}${scopeId}${GUIDED_SOURCE_END_SUFFIX}`;
    const endIndex = content.indexOf(endMarker, scopeEndIndex);
    if (endIndex === -1) {
      break;
    }
    const blockEnd = endIndex + endMarker.length;
    blocks.push(content.slice(startIndex, blockEnd).trim());
    cursor = blockEnd;
  }
  return uniqueStrings3(blocks);
}
function appendGuidedSourceBlocks(body, existingContent) {
  const blocks = extractGuidedSourceBlocks(existingContent);
  if (!blocks.length) {
    return body;
  }
  return [body.trimEnd(), "", "## Guided Session Notes", "", ...blocks, ""].join("\n");
}
function safeFrontmatter(value) {
  return JSON.parse(JSON.stringify(value));
}
function sourceHashesForManifest(manifest) {
  return {
    sourceHashes: { [manifest.sourceId]: manifest.contentHash },
    sourceSemanticHashes: { [manifest.sourceId]: manifest.semanticHash }
  };
}
function sourceHashFrontmatter(sourceHashes, sourceSemanticHashes) {
  return {
    source_hashes: sourceHashes,
    source_semantic_hashes: sourceSemanticHashes
  };
}
function cssclassesFor(kind) {
  return ["swarmvault", `sv-${kind.replace(/_/g, "-")}`];
}
function decoratedTags(baseTags, decorations) {
  return uniqueStrings3([
    ...baseTags,
    ...(decorations?.projectIds ?? []).map((projectId) => `project/${projectId}`),
    ...decorations?.extraTags ?? []
  ]);
}
function sortDerivedTags(tags, leaders) {
  const deduped = uniqueStrings3(tags);
  const pinned = [];
  const rest = [];
  for (const tag of deduped) {
    if (leaders.includes(tag)) continue;
    rest.push(tag);
  }
  for (const leader of leaders) {
    if (deduped.includes(leader)) pinned.push(leader);
  }
  rest.sort((left, right) => left.localeCompare(right));
  return [...pinned, ...rest];
}
function inheritedSourceTags(sourceAnalyses) {
  return uniqueStrings3(sourceAnalyses.flatMap((analysis) => analysis.tags ?? []));
}
function pagePathFor(kind, slug) {
  switch (kind) {
    case "source":
      return `sources/${slug}.md`;
    case "module":
      return `code/${slug}.md`;
    case "concept":
      return `concepts/${slug}.md`;
    case "entity":
      return `entities/${slug}.md`;
    case "output":
      return `outputs/${slug}.md`;
    case "graph_report":
      return "graph/report.md";
    case "community_summary":
      return `graph/communities/${slug}.md`;
    default:
      return `${slug}.md`;
  }
}
function candidatePagePathFor(kind, slug) {
  return kind === "entity" ? `candidates/entities/${slug}.md` : `candidates/concepts/${slug}.md`;
}
function pageLink(page) {
  return `[[${page.path.replace(/\.md$/, "")}|${page.title}]]`;
}
function graphNodeLink(node, pagesById) {
  const page = node.pageId ? pagesById.get(node.pageId) : void 0;
  return page ? pageLink(page) : `\`${node.label}\``;
}
function assetMarkdownPath(assetPath) {
  return `./${assetPath.replace(/^outputs\//, "")}`;
}
function primaryOutputAsset(assets) {
  return assets.find((asset) => asset.role === "poster") ?? assets.find((asset) => asset.role === "primary");
}
function outputAssetSection(assets) {
  if (!assets.length) {
    return [];
  }
  return [
    "## Assets",
    "",
    ...assets.map((asset) => `- \`${asset.role}\` - [${asset.path}](${assetMarkdownPath(asset.path)}) (${asset.mimeType})`),
    ""
  ];
}
function relatedOutputsSection(relatedOutputs) {
  if (!relatedOutputs.length) {
    return [];
  }
  return ["## Related Outputs", "", ...relatedOutputs.map((page) => `- ${pageLink(page)}`), ""];
}
function detailValue(manifest, key) {
  const value = manifest.details?.[key];
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || void 0;
}
function detailList(manifest, key) {
  const value = detailValue(manifest, key);
  if (!value) {
    return void 0;
  }
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  return items.length ? items : void 0;
}
function buildSourcePage(manifest, analysis, schemaHash, metadata, relatedOutputs = [], modulePage, decorations, existingContent) {
  const relativePath = pagePathFor("source", manifest.sourceId);
  const pageId = `source:${manifest.sourceId}`;
  const { sourceHashes, sourceSemanticHashes } = sourceHashesForManifest(manifest);
  const moduleNodeIds = analysis.code ? [analysis.code.moduleId, ...analysis.code.symbols.map((symbol) => symbol.id)] : [];
  const nodeIds = [
    `source:${manifest.sourceId}`,
    ...analysis.concepts.map((item) => item.id),
    ...analysis.entities.map((item) => item.id),
    ...moduleNodeIds
  ];
  const backlinks = [
    ...analysis.concepts.map((item) => `concept:${slugify(item.name)}`),
    ...analysis.entities.map((item) => `entity:${slugify(item.name)}`),
    ...modulePage ? [modulePage.id] : [],
    ...relatedOutputs.map((page) => page.id)
  ];
  const frontmatter = {
    page_id: pageId,
    kind: "source",
    cssclasses: cssclassesFor("source"),
    title: analysis.title,
    ...manifest.sourceType ? { source_type: manifest.sourceType } : {},
    ...manifest.sourceClass ? { source_class: manifest.sourceClass } : {},
    ...detailValue(manifest, "occurred_at") ? { occurred_at: detailValue(manifest, "occurred_at") } : {},
    ...detailList(manifest, "participants") ? { participants: detailList(manifest, "participants") } : {},
    ...detailValue(manifest, "container_title") ? { container_title: detailValue(manifest, "container_title") } : {},
    ...detailValue(manifest, "conversation_id") ? { conversation_id: detailValue(manifest, "conversation_id") } : {},
    tags: decoratedTags(analysis.code ? ["source", "code"] : ["source"], decorations),
    source_ids: [manifest.sourceId],
    project_ids: decorations?.projectIds ?? [],
    node_ids: nodeIds,
    freshness: "fresh",
    status: metadata.status,
    confidence: metadata.confidence,
    created_at: metadata.createdAt,
    updated_at: metadata.updatedAt,
    compiled_from: metadata.compiledFrom,
    managed_by: metadata.managedBy,
    backlinks,
    schema_hash: schemaHash,
    ...sourceHashFrontmatter(sourceHashes, sourceSemanticHashes)
  };
  const body = appendGuidedSourceBlocks(
    [
      `# ${analysis.title}`,
      "",
      `Source ID: \`${manifest.sourceId}\``,
      `Source Kind: \`${manifest.sourceKind}\``,
      manifest.url ? `Source URL: ${manifest.url}` : `Source Path: \`${manifest.originalPath ?? manifest.storedPath}\``,
      ...manifest.sourceType ? [`Source Type: \`${manifest.sourceType}\``, ""] : [""],
      ...manifest.sourceClass ? [`Source Class: \`${manifest.sourceClass}\``, ""] : [],
      ...manifest.sourceGroupTitle ? [`Source Group: ${manifest.sourceGroupTitle}`] : [],
      ...manifest.partTitle ? [`Part: ${manifest.partIndex ?? "?"}/${manifest.partCount ?? "?"} - ${manifest.partTitle}`] : [],
      ...manifest.details && Object.keys(manifest.details).length ? [
        "",
        "## Source Details",
        "",
        ...Object.entries(manifest.details).map(([key, value]) => `- ${key.replace(/_/g, " ")}: ${value}`),
        ""
      ] : [],
      "",
      "## Summary",
      "",
      analysis.summary,
      "",
      ...analysis.code ? [
        "## Code Module",
        "",
        `- Language: \`${analysis.code.language}\``,
        modulePage ? `- Module Page: [[${modulePage.path.replace(/\.md$/, "")}|${modulePage.title}]]` : "- Module Page: Not generated.",
        `- Exports: ${analysis.code.exports.length ? analysis.code.exports.join(", ") : "None detected."}`,
        `- Symbols: ${analysis.code.symbols.length ? analysis.code.symbols.map((symbol) => symbol.name).join(", ") : "None detected."}`,
        analysis.code.diagnostics.length ? `- Diagnostics: ${analysis.code.diagnostics.length}` : "- Diagnostics: None.",
        ""
      ] : [],
      "## Concepts",
      "",
      ...analysis.concepts.length ? analysis.concepts.map(
        (item) => `- [[${pagePathFor("concept", slugify(item.name)).replace(/\.md$/, "")}|${item.name}]]: ${item.description}`
      ) : ["- None detected."],
      "",
      "## Entities",
      "",
      ...analysis.entities.length ? analysis.entities.map(
        (item) => `- [[${pagePathFor("entity", slugify(item.name)).replace(/\.md$/, "")}|${item.name}]]: ${item.description}`
      ) : ["- None detected."],
      "",
      "## Claims",
      "",
      ...analysis.claims.length ? analysis.claims.map((claim) => `- ${claim.text} [source:${claim.citation}]`) : ["- No claims extracted."],
      "",
      "## Questions",
      "",
      ...analysis.questions.length ? analysis.questions.map((question) => `- ${question}`) : ["- No follow-up questions yet."],
      "",
      ...relatedOutputsSection(relatedOutputs),
      ""
    ].join("\n"),
    existingContent
  );
  return {
    page: {
      id: pageId,
      path: relativePath,
      title: analysis.title,
      kind: "source",
      sourceType: manifest.sourceType,
      sourceClass: manifest.sourceClass,
      sourceIds: [manifest.sourceId],
      projectIds: decorations?.projectIds ?? [],
      nodeIds,
      freshness: "fresh",
      status: metadata.status,
      confidence: metadata.confidence,
      backlinks,
      schemaHash,
      sourceHashes,
      sourceSemanticHashes,
      relatedPageIds: [...modulePage ? [modulePage.id] : [], ...relatedOutputs.map((page) => page.id)],
      relatedNodeIds: moduleNodeIds,
      relatedSourceIds: [],
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      compiledFrom: metadata.compiledFrom,
      managedBy: metadata.managedBy
    },
    content: matter4.stringify(body, safeFrontmatter(frontmatter))
  };
}
function buildModulePage(input) {
  const code = input.analysis.code;
  if (!code) {
    throw new Error(`Cannot build a module page without code analysis for ${input.manifest.sourceId}.`);
  }
  const { manifest, analysis, schemaHash, metadata, sourcePage } = input;
  const relativePath = pagePathFor("module", manifest.sourceId);
  const pageId = code.moduleId;
  const title = modulePageTitle(manifest);
  const nodeIds = [code.moduleId, ...code.symbols.map((symbol) => symbol.id)];
  const localModuleBacklinks = input.localModules.map((moduleRef) => moduleRef.page.id);
  const relatedOutputs = input.relatedOutputs ?? [];
  const backlinks = uniqueStrings3([sourcePage.id, ...localModuleBacklinks, ...relatedOutputs.map((page) => page.id)]);
  const { sourceHashes, sourceSemanticHashes } = sourceHashesForManifest(manifest);
  const importsSection = code.imports.length ? code.imports.map((item) => {
    const localModule = item.resolvedSourceId ? input.localModules.find((moduleRef) => moduleRef.sourceId === item.resolvedSourceId && moduleRef.reExport === item.reExport) : void 0;
    const importedBits = [
      item.defaultImport ? `default \`${item.defaultImport}\`` : "",
      item.namespaceImport ? `namespace \`${item.namespaceImport}\`` : "",
      item.importedSymbols.length ? `named ${item.importedSymbols.map((symbol) => `\`${symbol}\``).join(", ")}` : ""
    ].filter(Boolean);
    const importTarget = localModule ? `[[${localModule.page.path.replace(/\.md$/, "")}|${localModule.page.title}]]` : `\`${item.specifier}\``;
    const mode = item.reExport ? "re-exports from" : "imports";
    const suffix = importedBits.length ? ` (${importedBits.join("; ")})` : "";
    return `- ${mode} ${importTarget}${suffix}`;
  }) : ["- No imports detected."];
  const unresolvedLocalImports = code.imports.filter((item) => !item.isExternal && !item.resolvedSourceId).map((item) => `- \`${item.specifier}\`${item.resolvedRepoPath ? ` (expected near \`${item.resolvedRepoPath}\`)` : ""}`);
  const exportsSection = code.exports.length ? code.exports.map((item) => `- \`${item}\``) : ["- No exports detected."];
  const symbolsSection = code.symbols.length ? code.symbols.map(
    (symbol) => `- \`${symbol.name}\` (${symbol.kind}${symbol.exported ? ", exported" : ""}): ${symbol.signature || "No signature recorded."}`
  ) : ["- No top-level symbols detected."];
  const inheritanceSection = code.symbols.flatMap((symbol) => [
    ...symbol.extends.map((item) => `- \`${symbol.name}\` extends \`${item}\``),
    ...symbol.implements.map((item) => `- \`${symbol.name}\` implements \`${item}\``)
  ]);
  const callsSection = code.symbols.flatMap((symbol) => symbol.calls.map((target) => `- \`${symbol.name}\` calls \`${target}\``));
  const diagnosticsSection = code.diagnostics.length ? code.diagnostics.map(
    (diagnostic) => `- ${diagnostic.category} diagnostic ${diagnostic.code} at ${diagnostic.line}:${diagnostic.column}: ${diagnostic.message}`
  ) : ["- No parser diagnostics."];
  const frontmatter = {
    page_id: pageId,
    kind: "module",
    cssclasses: cssclassesFor("module"),
    title,
    ...manifest.sourceClass ? { source_class: manifest.sourceClass } : {},
    tags: decoratedTags(["module", "code", code.language], { projectIds: input.projectIds, extraTags: input.extraTags }),
    source_ids: [manifest.sourceId],
    project_ids: input.projectIds ?? [],
    node_ids: nodeIds,
    freshness: "fresh",
    status: metadata.status,
    confidence: metadata.confidence,
    created_at: metadata.createdAt,
    updated_at: metadata.updatedAt,
    compiled_from: metadata.compiledFrom,
    managed_by: metadata.managedBy,
    backlinks,
    schema_hash: schemaHash,
    ...sourceHashFrontmatter(sourceHashes, sourceSemanticHashes),
    related_page_ids: uniqueStrings3([sourcePage.id, ...localModuleBacklinks, ...relatedOutputs.map((page) => page.id)]),
    related_node_ids: [],
    related_source_ids: uniqueStrings3([
      manifest.sourceId,
      ...input.localModules.map((moduleRef) => moduleRef.sourceId),
      ...relatedOutputs.flatMap((page) => page.sourceIds)
    ]),
    language: code.language
  };
  const body = [
    `# ${title}`,
    "",
    `Source ID: \`${manifest.sourceId}\``,
    `Source Path: \`${manifest.originalPath ?? manifest.storedPath}\``,
    ...manifest.repoRelativePath ? [`Repo Path: \`${manifest.repoRelativePath}\``] : [],
    ...manifest.sourceClass ? [`Source Class: \`${manifest.sourceClass}\``] : [],
    `Language: \`${code.language}\``,
    ...code.moduleName ? [`Module Name: \`${code.moduleName}\``] : [],
    ...code.namespace ? [`Namespace/Package: \`${code.namespace}\``] : [],
    `Source Page: [[${sourcePage.path.replace(/\.md$/, "")}|${sourcePage.title}]]`,
    "",
    "## Summary",
    "",
    analysis.summary,
    "",
    "## Imports",
    "",
    ...importsSection,
    "",
    "## Exports",
    "",
    ...exportsSection,
    "",
    "## Symbols",
    "",
    ...symbolsSection,
    "",
    "## External Dependencies",
    "",
    ...code.dependencies.length ? code.dependencies.map((dependency) => `- \`${dependency}\``) : ["- No external dependencies detected."],
    "",
    "## Unresolved Local References",
    "",
    ...unresolvedLocalImports.length ? unresolvedLocalImports : ["- No unresolved local references detected."],
    "",
    "## Inheritance",
    "",
    ...inheritanceSection.length ? inheritanceSection : ["- No inheritance relationships detected."],
    "",
    "## Calls",
    "",
    ...callsSection.length ? callsSection : ["- No direct same-module call edges detected."],
    "",
    "## Diagnostics",
    "",
    ...diagnosticsSection,
    "",
    ...relatedOutputsSection(relatedOutputs),
    ""
  ].join("\n");
  return {
    page: {
      id: pageId,
      path: relativePath,
      title,
      kind: "module",
      sourceClass: manifest.sourceClass,
      sourceIds: [manifest.sourceId],
      projectIds: input.projectIds ?? [],
      nodeIds,
      freshness: "fresh",
      status: metadata.status,
      confidence: metadata.confidence,
      backlinks,
      schemaHash,
      sourceHashes,
      sourceSemanticHashes,
      relatedPageIds: uniqueStrings3([sourcePage.id, ...localModuleBacklinks, ...relatedOutputs.map((page) => page.id)]),
      relatedNodeIds: [],
      relatedSourceIds: uniqueStrings3([
        manifest.sourceId,
        ...input.localModules.map((moduleRef) => moduleRef.sourceId),
        ...relatedOutputs.flatMap((page) => page.sourceIds)
      ]),
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      compiledFrom: metadata.compiledFrom,
      managedBy: metadata.managedBy
    },
    content: matter4.stringify(body, frontmatter)
  };
}
function buildAggregatePage(kind, name, descriptions, sourceAnalyses, sourceHashes, sourceSemanticHashes, schemaHash, metadata, relativePath, relatedOutputs = [], decorations, existingContent) {
  const slug = slugify(name);
  const pageId = `${kind}:${slug}`;
  const sourceIds = sourceAnalyses.map((item) => item.sourceId);
  const otherPages = [...sourceAnalyses.map((item) => `source:${item.sourceId}`), ...relatedOutputs.map((page) => page.id)];
  const summary = descriptions.find(Boolean) ?? `${kind} aggregated from ${sourceIds.length} source(s).`;
  const leaderTags = metadata.status === "candidate" ? [kind, "candidate"] : [kind];
  const inheritedTags = inheritedSourceTags(sourceAnalyses);
  const derivedTags = sortDerivedTags([...decoratedTags(leaderTags, decorations), ...inheritedTags], leaderTags);
  const frontmatter = {
    page_id: pageId,
    kind,
    cssclasses: cssclassesFor(kind),
    title: name,
    ...decorations?.sourceClass ? { source_class: decorations.sourceClass } : {},
    tags: derivedTags,
    source_ids: sourceIds,
    project_ids: decorations?.projectIds ?? [],
    node_ids: [pageId],
    freshness: "fresh",
    status: metadata.status,
    confidence: metadata.confidence,
    created_at: metadata.createdAt,
    updated_at: metadata.updatedAt,
    compiled_from: metadata.compiledFrom,
    managed_by: metadata.managedBy,
    backlinks: otherPages,
    schema_hash: schemaHash,
    ...sourceHashFrontmatter(sourceHashes, sourceSemanticHashes)
  };
  const body = appendGuidedSourceBlocks(
    [
      `# ${name}`,
      "",
      "## Summary",
      "",
      summary,
      "",
      "## Seen In",
      "",
      ...sourceAnalyses.map((item) => `- [[${pagePathFor("source", item.sourceId).replace(/\.md$/, "")}|${item.title}]]`),
      "",
      "## Source Claims",
      "",
      ...sourceAnalyses.flatMap(
        (item) => item.claims.filter((claim) => claim.text.toLowerCase().includes(name.toLowerCase()) && name.length >= 3).slice(0, 5).map((claim) => `- ${claim.text.length > 150 ? `${claim.text.slice(0, 147)}...` : claim.text} [source:${claim.citation}]`)
      ),
      "",
      ...relatedOutputsSection(relatedOutputs),
      ""
    ].join("\n"),
    existingContent
  );
  return {
    page: {
      id: pageId,
      path: relativePath,
      title: name,
      kind,
      sourceClass: decorations?.sourceClass,
      sourceIds,
      projectIds: decorations?.projectIds ?? [],
      nodeIds: [pageId],
      freshness: "fresh",
      status: metadata.status,
      confidence: metadata.confidence,
      backlinks: otherPages,
      schemaHash,
      sourceHashes,
      sourceSemanticHashes,
      relatedPageIds: relatedOutputs.map((page) => page.id),
      relatedNodeIds: [],
      relatedSourceIds: [],
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      compiledFrom: metadata.compiledFrom,
      managedBy: metadata.managedBy
    },
    content: matter4.stringify(body, frontmatter)
  };
}
function buildIndexPage(pages, schemaHash, metadata, projectPages = []) {
  const sources = pages.filter((page) => page.kind === "source");
  const modules = pages.filter((page) => page.kind === "module");
  const concepts = pages.filter((page) => page.kind === "concept" && page.status !== "candidate");
  const entities = pages.filter((page) => page.kind === "entity" && page.status !== "candidate");
  const candidates = pages.filter((page) => page.status === "candidate");
  const outputs = pages.filter((page) => page.kind === "output");
  const insights = pages.filter((page) => page.kind === "insight");
  const graphPages = pages.filter((page) => page.kind === "graph_report" || page.kind === "community_summary");
  const dashboards = pages.filter(
    (page) => page.kind === "index" && page.path.startsWith("dashboards/") && page.path !== "dashboards/index.md"
  );
  return [
    "---",
    "page_id: index",
    "kind: index",
    "title: SwarmVault Index",
    "tags:",
    "  - index",
    "source_ids: []",
    "project_ids: []",
    "node_ids: []",
    "freshness: fresh",
    `status: ${metadata.status}`,
    "confidence: 1",
    `created_at: ${metadata.createdAt}`,
    `updated_at: ${metadata.updatedAt}`,
    `compiled_from: [${metadata.compiledFrom.join(", ")}]`,
    `managed_by: ${metadata.managedBy}`,
    "backlinks: []",
    `schema_hash: ${schemaHash}`,
    "source_hashes: {}",
    "source_semantic_hashes: {}",
    "---",
    "",
    "# SwarmVault Index",
    "",
    "## Sources",
    "",
    ...sources.length ? sources.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No sources yet."],
    "",
    "## Concepts",
    "",
    ...concepts.length ? concepts.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No concepts yet."],
    "",
    "## Code Modules",
    "",
    ...modules.length ? modules.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No code modules yet."],
    "",
    "## Entities",
    "",
    ...entities.length ? entities.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No entities yet."],
    "",
    "## Outputs",
    "",
    ...outputs.length ? outputs.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No saved outputs yet."],
    "",
    "## Dashboards",
    "",
    ...dashboards.length ? dashboards.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No dashboards yet."],
    "",
    "## Graph",
    "",
    ...graphPages.length ? graphPages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No graph reports yet."],
    "",
    "## Projects",
    "",
    ...projectPages.length ? projectPages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No projects configured."],
    "",
    "## Candidates",
    "",
    ...candidates.length ? candidates.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No candidates staged."],
    "",
    "## Insights",
    "",
    ...insights.length ? insights.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No insights yet."],
    ""
  ].join("\n");
}
function buildSectionIndex(kind, pages, schemaHash, metadata, projectIds = []) {
  const title = kind.charAt(0).toUpperCase() + kind.slice(1);
  return matter4.stringify(
    [`# ${title}`, "", ...pages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`), ""].join("\n"),
    {
      page_id: `${kind}:index`,
      kind: "index",
      cssclasses: cssclassesFor("index"),
      title,
      tags: decoratedTags(["index", kind], { projectIds }),
      source_ids: [],
      project_ids: projectIds,
      node_ids: [],
      freshness: "fresh",
      status: metadata.status,
      confidence: 1,
      created_at: metadata.createdAt,
      updated_at: metadata.updatedAt,
      compiled_from: metadata.compiledFrom,
      managed_by: metadata.managedBy,
      backlinks: [],
      schema_hash: schemaHash,
      source_hashes: {},
      source_semantic_hashes: {}
    }
  );
}
function communityPagePath(communityId) {
  return pagePathFor("community_summary", communityId.replace(/^community:/, ""));
}
function nodeSummary(node) {
  const degree = typeof node.degree === "number" ? `degree=${node.degree}` : "";
  const bridge = typeof node.bridgeScore === "number" ? `bridge=${node.bridgeScore}` : "";
  return [node.type, degree, bridge].filter(Boolean).join(", ");
}
function sourceTypeForNode(node, pagesById) {
  if (!node?.pageId) {
    return void 0;
  }
  return pagesById.get(node.pageId)?.sourceType;
}
function supportingPathDetails(graph, edge) {
  const path26 = shortestGraphPath(graph, edge.source, edge.target);
  const edgesById = new Map(graph.edges.map((item) => [item.id, item]));
  const pathEdges = path26.edgeIds.map((edgeId) => edgesById.get(edgeId)).filter((item) => Boolean(item));
  return {
    pathNodeIds: path26.nodeIds,
    pathEdgeIds: path26.edgeIds,
    pathRelations: pathEdges.map((item) => item.relation),
    pathEvidenceClasses: pathEdges.map((item) => item.evidenceClass),
    pathSummary: path26.summary
  };
}
function surpriseScore(edge, graph, pagesById, hyperedgesByNodeId) {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const source = nodesById.get(edge.source);
  const target = nodesById.get(edge.target);
  const reasons = [];
  let score = edge.confidence * 0.45;
  if (source?.communityId && target?.communityId && source.communityId !== target.communityId) {
    score += 0.18;
    reasons.push(`it crosses communities ${source.communityId} and ${target.communityId}`);
  }
  if (source?.pageId && target?.pageId && source.pageId !== target.pageId) {
    score += 0.12;
    reasons.push("it spans different canonical pages");
  }
  if (source?.type && target?.type && source.type !== target.type) {
    score += 0.08;
    reasons.push(`it bridges ${source.type} and ${target.type} nodes`);
  }
  const sourceType = sourceTypeForNode(source, pagesById);
  const targetType = sourceTypeForNode(target, pagesById);
  if (sourceType && targetType && sourceType !== targetType) {
    score += 0.07;
    reasons.push(`it crosses source types (${sourceType} and ${targetType})`);
  }
  if ((source?.bridgeScore ?? 0) > 0 || (target?.bridgeScore ?? 0) > 0) {
    score += 0.08;
    reasons.push("a bridge node is involved");
  }
  if (edge.relation === "semantically_similar_to") {
    score += 0.12;
    reasons.push(describeSimilarityReasons(edge.similarityReasons));
  }
  if (edge.evidenceClass === "ambiguous") {
    score += 0.08;
    reasons.push("the supporting evidence is ambiguous");
  }
  const overlappingHyperedges = (hyperedgesByNodeId.get(edge.source) ?? []).filter((hyperedge) => hyperedge.nodeIds.includes(edge.target));
  if (overlappingHyperedges.length) {
    score += 0.06;
    reasons.push(`it also appears in ${overlappingHyperedges.length} group pattern${overlappingHyperedges.length === 1 ? "" : "s"}`);
  }
  const why = normalizeWhitespace(reasons.join("; ")) || "it links graph regions that are otherwise weakly connected";
  const explanation = normalizeWhitespace(`${source?.label ?? edge.source} connects to ${target?.label ?? edge.target} because ${why}.`);
  return { score: Math.min(0.99, score), why, explanation };
}
function topSurprisingConnections(graph, pagesById) {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const hyperedgesByNodeId = /* @__PURE__ */ new Map();
  for (const hyperedge of graph.hyperedges ?? []) {
    for (const nodeId of hyperedge.nodeIds) {
      if (!hyperedgesByNodeId.has(nodeId)) {
        hyperedgesByNodeId.set(nodeId, []);
      }
      hyperedgesByNodeId.get(nodeId)?.push(hyperedge);
    }
  }
  return uniqueBy(
    graph.edges.filter((edge) => {
      const source = nodesById.get(edge.source);
      const target = nodesById.get(edge.target);
      return Boolean(
        source?.communityId && target?.communityId && source.communityId !== target.communityId || edge.relation === "semantically_similar_to" || edge.evidenceClass === "ambiguous" || source?.type && target?.type && source.type !== target.type
      );
    }).map((edge) => {
      const source = nodesById.get(edge.source);
      const target = nodesById.get(edge.target);
      const path26 = supportingPathDetails(graph, edge);
      const scored = surpriseScore(edge, graph, pagesById, hyperedgesByNodeId);
      return {
        id: edge.id,
        sourceNodeId: edge.source,
        sourceLabel: source?.label ?? edge.source,
        targetNodeId: edge.target,
        targetLabel: target?.label ?? edge.target,
        relation: edge.relation,
        evidenceClass: edge.evidenceClass,
        confidence: edge.confidence,
        pathNodeIds: path26.pathNodeIds,
        pathEdgeIds: path26.pathEdgeIds,
        pathRelations: path26.pathRelations,
        pathEvidenceClasses: path26.pathEvidenceClasses,
        pathSummary: path26.pathSummary,
        why: scored.why,
        explanation: scored.explanation,
        surpriseScore: scored.score
      };
    }).sort(
      (left, right) => right.surpriseScore - left.surpriseScore || right.confidence - left.confidence || left.id.localeCompare(right.id)
    ).slice(0, 8),
    (connection) => connection.id
  ).map(({ surpriseScore: _surpriseScore, ...connection }) => connection);
}
function topGroupPatterns(graph) {
  return [...graph.hyperedges ?? []].sort(
    (left, right) => right.confidence - left.confidence || right.nodeIds.length - left.nodeIds.length || left.label.localeCompare(right.label)
  ).slice(0, 8);
}
function fragmentedCommunityPresentation(graph, communityPages, foldBelow = 3) {
  const thinCommunities = (graph.communities ?? []).filter((community) => community.nodeIds.length < foldBelow).sort((left, right) => right.nodeIds.length - left.nodeIds.length || left.label.localeCompare(right.label));
  const visibleCommunities = thinCommunities.slice(0, 6).map((community) => {
    const page = communityPages.find((candidate) => candidate.id === `graph:${community.id}`);
    return {
      id: community.id,
      label: community.label,
      nodeCount: community.nodeIds.length,
      pageId: page?.id,
      path: page?.path,
      title: page?.title
    };
  });
  const rolledUp = thinCommunities.slice(visibleCommunities.length);
  if (!rolledUp.length) {
    return {
      thinCommunities: visibleCommunities
    };
  }
  return {
    thinCommunities: visibleCommunities,
    fragmentedCommunityRollup: {
      totalCommunities: graph.communities?.length ?? 0,
      rolledUpCount: rolledUp.length,
      rolledUpNodes: rolledUp.reduce((sum, community) => sum + community.nodeIds.length, 0),
      exampleLabels: rolledUp.slice(0, 4).map((community) => community.label)
    }
  };
}
function suggestedGraphQuestions(graph) {
  const thinCommunities = (graph.communities ?? []).filter((community) => community.nodeIds.length <= 2);
  const bridgeNodes = graph.nodes.filter((node) => (node.bridgeScore ?? 0) > 0).sort((left, right) => (right.bridgeScore ?? 0) - (left.bridgeScore ?? 0)).slice(0, 3);
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const ambiguousEdgeQuestions = graph.edges.filter((edge) => edge.evidenceClass === "ambiguous").slice(0, 3).map((edge) => {
    const sourceNode = nodesById.get(edge.source);
    const targetNode = nodesById.get(edge.target);
    if (!sourceNode || !targetNode) return "";
    return `What is the exact relationship between ${sourceNode.label} and ${targetNode.label}?`;
  }).filter(Boolean);
  const godNodeInferredQuestions = [];
  const godNodes = graph.nodes.filter((node) => node.isGodNode);
  for (const god of godNodes) {
    const inferredCount = graph.edges.filter(
      (edge) => (edge.source === god.id || edge.target === god.id) && edge.evidenceClass === "inferred"
    ).length;
    if (inferredCount >= 2) {
      godNodeInferredQuestions.push(`Are the inferred relationships involving ${god.label} correct?`);
    }
  }
  const isolatedNodeQuestions = graph.nodes.filter((node) => (node.degree ?? 0) <= 1 && node.type !== "source").slice(0, 3).map((node) => `What connects ${node.label} to the rest of the vault?`);
  return uniqueStrings3([
    ...thinCommunities.map((community) => `What sources would strengthen community ${community.label}?`),
    ...bridgeNodes.map((node) => `Why does ${node.label} connect multiple communities in the vault?`),
    ...ambiguousEdgeQuestions,
    ...godNodeInferredQuestions,
    ...isolatedNodeQuestions
  ]).slice(0, 8);
}
function communityCohesionScores(graph) {
  const result = /* @__PURE__ */ new Map();
  for (const community of graph.communities ?? []) {
    const memberSet = new Set(community.nodeIds);
    const n = memberSet.size;
    if (n < 2) {
      result.set(community.id, n === 1 ? 1 : 0);
      continue;
    }
    const maxEdges = n * (n - 1) / 2;
    let internalEdges = 0;
    for (const edge of graph.edges) {
      if (memberSet.has(edge.source) && memberSet.has(edge.target)) {
        internalEdges++;
      }
    }
    result.set(community.id, internalEdges / maxEdges);
  }
  return result;
}
function buildKnowledgeGaps(graph) {
  const isolatedNodes = graph.nodes.filter((node) => (node.degree ?? 0) <= 1 && node.type !== "source").slice(0, 10).map((node) => ({ nodeId: node.id, label: node.label, type: node.type }));
  const communities = graph.communities ?? [];
  const thinCommunityCount = communities.filter((c) => c.nodeIds.length <= 2).length;
  const totalEdges = graph.edges.length;
  const ambiguousEdges = graph.edges.filter((e) => e.evidenceClass === "ambiguous").length;
  const ambiguousEdgeRatio = totalEdges > 0 ? ambiguousEdges / totalEdges : 0;
  const warnings = [];
  if (ambiguousEdgeRatio > 0.2) {
    warnings.push(`${(ambiguousEdgeRatio * 100).toFixed(1)}% of edges are ambiguous \u2014 consider adding sources to clarify relationships.`);
  }
  const totalIsolated = graph.nodes.filter((node) => (node.degree ?? 0) <= 1 && node.type !== "source").length;
  if (totalIsolated > 5) {
    warnings.push(`${totalIsolated} nodes are isolated or weakly connected \u2014 they may need additional source material.`);
  }
  if (communities.length > 0 && thinCommunityCount > communities.length / 3) {
    warnings.push(`${thinCommunityCount} of ${communities.length} communities have 2 or fewer nodes \u2014 the graph may be fragmented.`);
  }
  return { isolatedNodes, thinCommunityCount, ambiguousEdgeRatio, warnings };
}
var SOURCE_CLASS_LABELS = {
  first_party: "First-party",
  third_party: "Third-party",
  resource: "Resource",
  generated: "Generated"
};
function benchmarkByClassTableLines(byClass) {
  if (!byClass) {
    return [];
  }
  const lines = [
    "### Benchmark By Source Class",
    "",
    "| Class | Sources | Pages | Nodes | God Nodes | Naive Tokens | Guided Tokens | Reduction |",
    "| ----- | ------- | ----- | ----- | --------- | ------------ | ------------- | --------- |"
  ];
  for (const sourceClass of ALL_SOURCE_CLASSES) {
    const entry = byClass[sourceClass];
    const reductionPct = (entry.reductionRatio * 100).toFixed(1);
    lines.push(
      `| ${SOURCE_CLASS_LABELS[sourceClass]} | ${entry.sourceCount} | ${entry.pageCount} | ${entry.nodeCount} | ${entry.godNodeCount} | ${entry.naiveCorpusTokens} | ${entry.finalContextTokens} | ${reductionPct}% |`
    );
  }
  lines.push("");
  return lines;
}
function buildGraphReportArtifact(input) {
  const firstPartyGraph = filterGraphBySourceClass(input.graph, "first_party");
  const reportGraph = firstPartyGraph.nodes.length ? firstPartyGraph : input.graph;
  const pagesById = new Map(reportGraph.pages.map((page) => [page.id, page]));
  const repoDefaults = resolveLargeRepoDefaults({
    nodeCount: input.graph.nodes.length,
    totalCommunities: input.graph.communities?.length ?? 0,
    config: input.config
  });
  const godNodes = reportGraph.nodes.filter((node) => node.isGodNode).sort((left, right) => (right.degree ?? 0) - (left.degree ?? 0)).slice(0, repoDefaults.godNodeLimit);
  const bridgeNodes = reportGraph.nodes.filter((node) => (node.bridgeScore ?? 0) > 0).sort((left, right) => (right.bridgeScore ?? 0) - (left.bridgeScore ?? 0)).slice(0, 8);
  const communityPresentation = fragmentedCommunityPresentation(reportGraph, input.communityPages, repoDefaults.foldCommunitiesBelow);
  const surprisingConnections = topSurprisingConnections(reportGraph, pagesById);
  const groupPatterns = topGroupPatterns(reportGraph);
  const breakdown = sourceClassBreakdown(input.graph);
  const warnings = [];
  const nonFirstPartyNodes = input.graph.nodes.length - breakdown.first_party.nodes;
  if (input.graph.nodes.length >= 1200) {
    warnings.push(`Large graph detected (${input.graph.nodes.length} nodes). First-party defaults are applied to report highlights.`);
  }
  if (nonFirstPartyNodes > 0 && nonFirstPartyNodes / Math.max(1, input.graph.nodes.length) >= 0.25) {
    warnings.push(
      `Non-first-party material accounts for ${(nonFirstPartyNodes / Math.max(1, input.graph.nodes.length) * 100).toFixed(1)}% of graph nodes.`
    );
  }
  if (communityPresentation.fragmentedCommunityRollup) {
    warnings.push(
      `First-party report view is fragmented: ${communityPresentation.fragmentedCommunityRollup.rolledUpCount} tiny communities were rolled up for readability.`
    );
  }
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    graphHash: input.graphHash,
    overview: {
      nodes: input.graph.nodes.length,
      edges: input.graph.edges.length,
      pages: input.graph.pages.length,
      communities: input.graph.communities?.length ?? 0
    },
    firstPartyOverview: {
      nodes: reportGraph.nodes.length,
      edges: reportGraph.edges.length,
      pages: reportGraph.pages.length,
      communities: reportGraph.communities?.length ?? 0
    },
    sourceClassBreakdown: breakdown,
    warnings,
    benchmark: input.benchmark ? {
      generatedAt: input.benchmark.generatedAt,
      stale: input.benchmarkStale ?? false,
      summary: input.benchmark.summary,
      questionCount: input.benchmark.sampleQuestions.length,
      byClass: input.benchmark.byClass ? Object.fromEntries(
        ALL_SOURCE_CLASSES.map((sourceClass) => {
          const entry = input.benchmark?.byClass?.[sourceClass];
          return [
            sourceClass,
            {
              sourceCount: entry?.sourceCount ?? 0,
              pageCount: entry?.pageCount ?? 0,
              nodeCount: entry?.nodeCount ?? 0,
              godNodeCount: entry?.godNodeCount ?? 0,
              finalContextTokens: entry?.finalContextTokens ?? 0,
              naiveCorpusTokens: entry?.corpusTokens ?? 0,
              reductionRatio: entry?.reductionRatio ?? 0
            }
          ];
        })
      ) : void 0
    } : void 0,
    godNodes: godNodes.map((node) => ({
      nodeId: node.id,
      label: node.label,
      pageId: node.pageId,
      degree: node.degree,
      bridgeScore: node.bridgeScore,
      ...node.surpriseReason ? { surpriseReason: node.surpriseReason } : {}
    })),
    bridgeNodes: bridgeNodes.map((node) => ({
      nodeId: node.id,
      label: node.label,
      pageId: node.pageId,
      degree: node.degree,
      bridgeScore: node.bridgeScore
    })),
    thinCommunities: communityPresentation.thinCommunities,
    fragmentedCommunityRollup: communityPresentation.fragmentedCommunityRollup,
    surprisingConnections,
    groupPatterns,
    suggestedQuestions: suggestedGraphQuestions(reportGraph),
    communityPages: input.communityPages.map((page) => ({
      id: page.id,
      path: page.path,
      title: page.title
    })),
    recentResearchSources: (input.recentResearchSources ?? []).map((page) => ({
      pageId: page.id,
      path: page.path,
      title: page.title,
      sourceType: page.sourceType,
      updatedAt: page.updatedAt
    })),
    contradictions: (input.contradictions ?? []).map((c) => ({
      sourceIdA: c.sourceIdA,
      sourceIdB: c.sourceIdB,
      claimA: c.claimA.text,
      claimB: c.claimB.text,
      confidenceDelta: Math.abs(c.claimA.confidence - c.claimB.confidence)
    })),
    communityCohesion: (() => {
      const cohesionMap = communityCohesionScores(reportGraph);
      return (reportGraph.communities ?? []).filter((c) => c.nodeIds.length >= 3).map((c) => ({
        id: c.id,
        label: c.label,
        nodeCount: c.nodeIds.length,
        cohesion: cohesionMap.get(c.id) ?? 0
      }));
    })(),
    knowledgeGaps: buildKnowledgeGaps(reportGraph)
  };
}
function buildGraphReportPage(input) {
  const pageId = "graph:report";
  const pathValue = pagePathFor("graph_report", "report");
  const pagesById = new Map(input.graph.pages.map((page) => [page.id, page]));
  const nodesById = new Map(input.graph.nodes.map((node) => [node.id, node]));
  const relatedNodeIds = uniqueStrings3([
    ...input.report.godNodes.map((node) => node.nodeId),
    ...input.report.bridgeNodes.map((node) => node.nodeId),
    ...input.report.surprisingConnections.flatMap((connection) => [
      connection.sourceNodeId,
      connection.targetNodeId,
      ...connection.pathNodeIds
    ]),
    ...input.report.groupPatterns.flatMap((hyperedge) => hyperedge.nodeIds)
  ]);
  const relatedPageIds = uniqueStrings3([
    ...input.report.godNodes.map((node) => node.pageId ?? ""),
    ...input.report.bridgeNodes.map((node) => node.pageId ?? ""),
    ...input.report.communityPages.map((page) => page.id),
    ...input.report.recentResearchSources.map((page) => page.pageId),
    ...input.report.groupPatterns.flatMap((hyperedge) => hyperedge.sourcePageIds)
  ]);
  const relatedSourceIds = uniqueStrings3([
    ...relatedNodeIds.flatMap((nodeId) => nodesById.get(nodeId)?.sourceIds ?? []),
    ...input.report.recentResearchSources.flatMap((page) => pagesById.get(page.pageId)?.sourceIds ?? [])
  ]);
  const frontmatter = {
    page_id: pageId,
    kind: "graph_report",
    cssclasses: cssclassesFor("graph_report"),
    title: "Graph Report",
    tags: ["graph", "report"],
    source_ids: relatedSourceIds,
    project_ids: [],
    node_ids: relatedNodeIds,
    freshness: "fresh",
    status: input.metadata.status,
    confidence: input.metadata.confidence,
    created_at: input.metadata.createdAt,
    updated_at: input.metadata.updatedAt,
    compiled_from: input.metadata.compiledFrom,
    managed_by: input.metadata.managedBy,
    backlinks: [],
    schema_hash: input.schemaHash,
    source_hashes: {},
    source_semantic_hashes: {},
    related_page_ids: relatedPageIds,
    related_node_ids: relatedNodeIds,
    related_source_ids: relatedSourceIds
  };
  const body = [
    "# Graph Report",
    "",
    "## Overview",
    "",
    `- Nodes: ${input.report.overview.nodes}`,
    `- Edges: ${input.report.overview.edges}`,
    `- Pages: ${input.report.overview.pages}`,
    `- Communities: ${input.report.overview.communities}`,
    `- Default Focus: First-party nodes/pages (${input.report.firstPartyOverview.nodes} nodes, ${input.report.firstPartyOverview.edges} edges, ${input.report.firstPartyOverview.pages} pages).`,
    "",
    "## Repo Quality Warnings",
    "",
    ...input.report.warnings.length ? input.report.warnings.map((warning) => `- ${warning}`) : ["- No large-repo warnings."],
    "",
    "## Source Class Breakdown",
    "",
    `- First-party: ${input.report.sourceClassBreakdown.first_party.sources} sources, ${input.report.sourceClassBreakdown.first_party.pages} pages, ${input.report.sourceClassBreakdown.first_party.nodes} nodes`,
    `- Third-party: ${input.report.sourceClassBreakdown.third_party.sources} sources, ${input.report.sourceClassBreakdown.third_party.pages} pages, ${input.report.sourceClassBreakdown.third_party.nodes} nodes`,
    `- Resources: ${input.report.sourceClassBreakdown.resource.sources} sources, ${input.report.sourceClassBreakdown.resource.pages} pages, ${input.report.sourceClassBreakdown.resource.nodes} nodes`,
    `- Generated: ${input.report.sourceClassBreakdown.generated.sources} sources, ${input.report.sourceClassBreakdown.generated.pages} pages, ${input.report.sourceClassBreakdown.generated.nodes} nodes`,
    "",
    "## Benchmark Summary",
    "",
    ...input.report.benchmark ? [
      `- Generated At: ${input.report.benchmark.generatedAt}`,
      `- Status: ${input.report.benchmark.stale ? "Stale (graph changed since benchmark ran)" : "Fresh"}`,
      `- Naive Corpus Tokens: ${input.report.benchmark.summary.naiveCorpusTokens}`,
      `- Final Context Tokens: ${input.report.benchmark.summary.finalContextTokens}`,
      `- Unique Nodes Considered: ${input.report.benchmark.summary.uniqueVisitedNodes}`,
      `- Reduction Ratio: ${(input.report.benchmark.summary.reductionRatio * 100).toFixed(1)}%`,
      `- Questions: ${input.report.benchmark.questionCount}`,
      "",
      ...benchmarkByClassTableLines(input.report.benchmark.byClass)
    ] : ["- No benchmark results yet.", ""],
    "## Top God Nodes",
    "",
    ...input.report.godNodes.length ? input.report.godNodes.map((node) => {
      const graphNode = nodesById.get(node.nodeId);
      return graphNode ? `- ${graphNodeLink(graphNode, pagesById)} (${nodeSummary(graphNode)})` : `- \`${node.nodeId}\``;
    }) : ["- No high-connectivity nodes detected."],
    "",
    "## Top Bridge Nodes",
    "",
    ...input.report.bridgeNodes.length ? input.report.bridgeNodes.map((node) => {
      const graphNode = nodesById.get(node.nodeId);
      return graphNode ? `- ${graphNodeLink(graphNode, pagesById)} (${nodeSummary(graphNode)})` : `- \`${node.nodeId}\``;
    }) : ["- No cross-community bridge nodes detected."],
    "",
    "## Communities",
    "",
    ...input.report.communityPages.length ? input.report.communityPages.map((page) => `- ${pageLink(page)}`) : ["- No community summaries generated yet."],
    "",
    "## Thin Or Underlinked Areas",
    "",
    ...input.report.thinCommunities.length ? input.report.thinCommunities.map(
      (community) => community.path ? `- [[${community.path.replace(/\.md$/, "")}|${community.title ?? community.label}]] (${community.nodeCount} node(s))` : `- ${community.label} (${community.nodeCount} node(s))`
    ) : ["- No thin communities detected."],
    ...input.report.fragmentedCommunityRollup ? [
      `- Rolled up ${input.report.fragmentedCommunityRollup.rolledUpCount} additional tiny communities covering ${input.report.fragmentedCommunityRollup.rolledUpNodes} node(s).`,
      `- Example rolled-up labels: ${input.report.fragmentedCommunityRollup.exampleLabels.join(", ")}`
    ] : [],
    "",
    "## Surprising Connections",
    "",
    ...input.report.surprisingConnections.length ? input.report.surprisingConnections.map((connection) => {
      const source = nodesById.get(connection.sourceNodeId);
      const target = nodesById.get(connection.targetNodeId);
      const sourceLabel = source ? graphNodeLink(source, pagesById) : `\`${connection.sourceNodeId}\``;
      const targetLabel = target ? graphNodeLink(target, pagesById) : `\`${connection.targetNodeId}\``;
      return `- ${sourceLabel} ${connection.relation} ${targetLabel} (${connection.evidenceClass}, ${connection.confidence.toFixed(2)}). Why: ${connection.why}. ${connection.explanation} Path: ${connection.pathSummary}.`;
    }) : ["- No cross-community links detected."],
    "",
    "## Contradictions",
    "",
    ...input.report.contradictions.length ? input.report.contradictions.map(
      (c) => `- **${c.claimA}** vs **${c.claimB}** (sources: \`${c.sourceIdA}\`, \`${c.sourceIdB}\`, confidence delta: ${c.confidenceDelta.toFixed(2)})`
    ) : ["- No contradictions detected."],
    "",
    "## Group Patterns",
    "",
    ...input.report.groupPatterns.length ? input.report.groupPatterns.map((hyperedge) => {
      const linkedNodes = hyperedge.nodeIds.map((nodeId) => nodesById.get(nodeId)).filter((node) => Boolean(node)).map((node) => graphNodeLink(node, pagesById)).join(", ");
      return `- ${hyperedge.label} (${hyperedge.relation}, ${hyperedge.evidenceClass}, ${hyperedge.confidence.toFixed(2)}). ${hyperedge.why} Members: ${linkedNodes}.`;
    }) : ["- No multi-node group patterns detected."],
    "",
    "## New Research Sources",
    "",
    ...input.report.recentResearchSources.length ? input.report.recentResearchSources.map(
      (page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]] (\`${page.sourceType}\`, updated ${page.updatedAt})`
    ) : ["- No newly captured research sources since the previous compile."],
    "",
    "## Suggested Questions",
    "",
    ...input.report.suggestedQuestions.map((question) => `- ${question}`),
    ""
  ].join("\n");
  return {
    page: {
      id: pageId,
      path: pathValue,
      title: "Graph Report",
      kind: "graph_report",
      sourceIds: relatedSourceIds,
      projectIds: [],
      nodeIds: relatedNodeIds,
      freshness: "fresh",
      status: input.metadata.status,
      confidence: input.metadata.confidence,
      backlinks: [],
      schemaHash: input.schemaHash,
      sourceHashes: {},
      sourceSemanticHashes: {},
      relatedPageIds,
      relatedNodeIds,
      relatedSourceIds,
      createdAt: input.metadata.createdAt,
      updatedAt: input.metadata.updatedAt,
      compiledFrom: input.metadata.compiledFrom,
      managedBy: input.metadata.managedBy
    },
    content: matter4.stringify(body, frontmatter)
  };
}
function buildGraphSharePage(input) {
  const pageId = "graph:share-card";
  const pathValue = "graph/share-card.md";
  const artifact = input.artifact ?? buildGraphShareArtifact({
    graph: input.graph,
    report: input.report,
    vaultName: input.vaultName
  });
  const frontmatter = {
    page_id: pageId,
    kind: "graph_report",
    cssclasses: cssclassesFor("graph_report"),
    title: "Share Card",
    tags: ["graph", "share"],
    source_ids: artifact.relatedSourceIds,
    project_ids: [],
    node_ids: artifact.relatedNodeIds,
    freshness: "fresh",
    status: input.metadata.status,
    confidence: input.metadata.confidence,
    created_at: input.metadata.createdAt,
    updated_at: input.metadata.updatedAt,
    compiled_from: input.metadata.compiledFrom,
    managed_by: input.metadata.managedBy,
    backlinks: [],
    schema_hash: input.schemaHash,
    source_hashes: {},
    source_semantic_hashes: {},
    related_page_ids: artifact.relatedPageIds,
    related_node_ids: artifact.relatedNodeIds,
    related_source_ids: artifact.relatedSourceIds
  };
  return {
    page: {
      id: pageId,
      path: pathValue,
      title: "Share Card",
      kind: "graph_report",
      sourceIds: artifact.relatedSourceIds,
      projectIds: [],
      nodeIds: artifact.relatedNodeIds,
      freshness: "fresh",
      status: input.metadata.status,
      confidence: input.metadata.confidence,
      backlinks: [],
      schemaHash: input.schemaHash,
      sourceHashes: {},
      sourceSemanticHashes: {},
      relatedPageIds: artifact.relatedPageIds,
      relatedNodeIds: artifact.relatedNodeIds,
      relatedSourceIds: artifact.relatedSourceIds,
      createdAt: input.metadata.createdAt,
      updatedAt: input.metadata.updatedAt,
      compiledFrom: input.metadata.compiledFrom,
      managedBy: input.metadata.managedBy
    },
    content: matter4.stringify(renderGraphShareMarkdown(artifact), frontmatter)
  };
}
function buildCommunitySummaryPage(input) {
  const pageId = `graph:${input.community.id}`;
  const pathValue = communityPagePath(input.community.id);
  const nodesById = new Map(input.graph.nodes.map((node) => [node.id, node]));
  const pagesById = new Map(input.graph.pages.map((page) => [page.id, page]));
  const communityNodes = input.community.nodeIds.map((nodeId) => nodesById.get(nodeId)).filter((node) => Boolean(node));
  const communityPageIds = uniqueStrings3(communityNodes.map((node) => node.pageId ?? ""));
  const communityPages = communityPageIds.map((id) => pagesById.get(id)).filter((page) => Boolean(page));
  const externalEdges = input.graph.edges.filter((edge) => {
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    return source?.communityId === input.community.id && target?.communityId && target.communityId !== input.community.id;
  }).slice(0, 8);
  const relatedSourceIds = uniqueStrings3(communityNodes.flatMap((node) => node.sourceIds));
  const frontmatter = {
    page_id: pageId,
    kind: "community_summary",
    cssclasses: cssclassesFor("community"),
    title: `Community: ${input.community.label}`,
    tags: ["graph", "community"],
    source_ids: relatedSourceIds,
    project_ids: [],
    node_ids: input.community.nodeIds,
    freshness: "fresh",
    status: input.metadata.status,
    confidence: input.metadata.confidence,
    created_at: input.metadata.createdAt,
    updated_at: input.metadata.updatedAt,
    compiled_from: input.metadata.compiledFrom,
    managed_by: input.metadata.managedBy,
    backlinks: ["graph:report"],
    schema_hash: input.schemaHash,
    source_hashes: {},
    source_semantic_hashes: {},
    related_page_ids: uniqueStrings3(["graph:report", ...communityPageIds]),
    related_node_ids: input.community.nodeIds,
    related_source_ids: relatedSourceIds
  };
  const body = [
    `# Community: ${input.community.label}`,
    "",
    "## Nodes",
    "",
    ...communityNodes.map((node) => `- ${graphNodeLink(node, pagesById)} (${nodeSummary(node)})`),
    "",
    "## Pages",
    "",
    ...communityPages.length ? communityPages.map((page) => `- ${pageLink(page)}`) : ["- No canonical pages linked."],
    "",
    "## External Links",
    "",
    ...externalEdges.length ? externalEdges.map((edge) => {
      const source = nodesById.get(edge.source);
      const target = nodesById.get(edge.target);
      return `- ${source ? graphNodeLink(source, pagesById) : `\`${edge.source}\``} ${edge.relation} ${target ? graphNodeLink(target, pagesById) : `\`${edge.target}\``} (${edge.evidenceClass})`;
    }) : ["- No external links detected."],
    ""
  ].join("\n");
  return {
    page: {
      id: pageId,
      path: pathValue,
      title: `Community: ${input.community.label}`,
      kind: "community_summary",
      sourceIds: relatedSourceIds,
      projectIds: [],
      nodeIds: input.community.nodeIds,
      freshness: "fresh",
      status: input.metadata.status,
      confidence: input.metadata.confidence,
      backlinks: ["graph:report"],
      schemaHash: input.schemaHash,
      sourceHashes: {},
      sourceSemanticHashes: {},
      relatedPageIds: uniqueStrings3(["graph:report", ...communityPageIds]),
      relatedNodeIds: input.community.nodeIds,
      relatedSourceIds,
      createdAt: input.metadata.createdAt,
      updatedAt: input.metadata.updatedAt,
      compiledFrom: input.metadata.compiledFrom,
      managedBy: input.metadata.managedBy
    },
    content: matter4.stringify(body, frontmatter)
  };
}
function buildProjectsIndex(projectPages, schemaHash, metadata) {
  return matter4.stringify(
    [
      "# Projects",
      "",
      ...projectPages.length ? projectPages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No projects configured."],
      ""
    ].join("\n"),
    {
      page_id: "projects:index",
      kind: "index",
      cssclasses: cssclassesFor("index"),
      title: "Projects",
      tags: ["index", "projects"],
      source_ids: [],
      project_ids: [],
      node_ids: [],
      freshness: "fresh",
      status: metadata.status,
      confidence: 1,
      created_at: metadata.createdAt,
      updated_at: metadata.updatedAt,
      compiled_from: metadata.compiledFrom,
      managed_by: metadata.managedBy,
      backlinks: [],
      schema_hash: schemaHash,
      source_hashes: {},
      source_semantic_hashes: {}
    }
  );
}
function buildProjectIndex(input) {
  const title = `Project: ${input.projectId}`;
  return matter4.stringify(
    [
      `# ${title}`,
      "",
      "## Sources",
      "",
      ...input.sections.sources.length ? input.sections.sources.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No sources yet."],
      "",
      "## Code",
      "",
      ...input.sections.code.length ? input.sections.code.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No code pages yet."],
      "",
      "## Concepts",
      "",
      ...input.sections.concepts.length ? input.sections.concepts.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No concept pages yet."],
      "",
      "## Entities",
      "",
      ...input.sections.entities.length ? input.sections.entities.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No entity pages yet."],
      "",
      "## Outputs",
      "",
      ...input.sections.outputs.length ? input.sections.outputs.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No output pages yet."],
      "",
      "## Candidates",
      "",
      ...input.sections.candidates.length ? input.sections.candidates.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No candidate pages yet."],
      ""
    ].join("\n"),
    {
      page_id: `project:${input.projectId}:index`,
      kind: "index",
      cssclasses: cssclassesFor("index"),
      title,
      tags: decoratedTags(["index", "projects"], { projectIds: [input.projectId] }),
      source_ids: [],
      project_ids: [input.projectId],
      node_ids: [],
      freshness: "fresh",
      status: input.metadata.status,
      confidence: 1,
      created_at: input.metadata.createdAt,
      updated_at: input.metadata.updatedAt,
      compiled_from: input.metadata.compiledFrom,
      managed_by: input.metadata.managedBy,
      backlinks: [],
      schema_hash: input.schemaHash,
      source_hashes: {},
      source_semantic_hashes: {}
    }
  );
}
function buildOutputPage(input) {
  const slug = input.slug ?? slugify(input.question);
  const pageId = `output:${slug}`;
  const pathValue = pagePathFor("output", slug);
  const relatedPageIds = input.relatedPageIds ?? [];
  const relatedNodeIds = input.relatedNodeIds ?? [];
  const relatedSourceIds = input.relatedSourceIds ?? input.citations;
  const outputAssets = input.outputAssets ?? [];
  const backlinks = [.../* @__PURE__ */ new Set([...relatedPageIds, ...relatedSourceIds.map((sourceId) => `source:${sourceId}`)])];
  const frontmatter = {
    page_id: pageId,
    kind: "output",
    cssclasses: cssclassesFor("output"),
    title: input.title ?? input.question,
    tags: decoratedTags(["output"], { projectIds: input.projectIds, extraTags: input.extraTags }),
    source_ids: input.citations,
    project_ids: input.projectIds ?? [],
    node_ids: relatedNodeIds,
    freshness: "fresh",
    status: input.metadata.status,
    confidence: input.metadata.confidence,
    created_at: input.metadata.createdAt,
    updated_at: input.metadata.updatedAt,
    compiled_from: input.metadata.compiledFrom,
    managed_by: input.metadata.managedBy,
    backlinks,
    schema_hash: input.schemaHash,
    source_hashes: {},
    source_semantic_hashes: {},
    related_page_ids: relatedPageIds,
    related_node_ids: relatedNodeIds,
    related_source_ids: relatedSourceIds,
    origin: input.origin,
    question: input.question,
    output_format: input.outputFormat,
    output_assets: outputAssets,
    ...input.outputFormat === "slides" ? { marp: true } : {},
    ...input.frontmatter ?? {}
  };
  return {
    page: {
      id: pageId,
      path: pathValue,
      title: input.title ?? input.question,
      kind: "output",
      sourceIds: input.citations,
      projectIds: input.projectIds ?? [],
      nodeIds: relatedNodeIds,
      freshness: "fresh",
      status: input.metadata.status,
      confidence: input.metadata.confidence,
      backlinks,
      schemaHash: input.schemaHash,
      sourceHashes: {},
      sourceSemanticHashes: {},
      relatedPageIds,
      relatedNodeIds,
      relatedSourceIds,
      createdAt: input.metadata.createdAt,
      updatedAt: input.metadata.updatedAt,
      compiledFrom: input.metadata.compiledFrom,
      managedBy: input.metadata.managedBy,
      origin: input.origin,
      question: input.question,
      outputFormat: input.outputFormat,
      outputAssets
    },
    content: matter4.stringify(
      (input.outputFormat === "slides" ? [
        input.answer,
        "",
        "---",
        "",
        "# Related Pages",
        "",
        ...relatedPageIds.length ? relatedPageIds.map((pageId2) => `- \`${pageId2}\``) : ["- None recorded."],
        "",
        "---",
        "",
        "# Citations",
        "",
        ...input.citations.map((citation) => `- [source:${citation}]`),
        ""
      ] : input.outputFormat === "chart" || input.outputFormat === "image" ? [
        `# ${input.title ?? input.question}`,
        "",
        ...primaryOutputAsset(outputAssets) ? [`![${input.title ?? input.question}](${assetMarkdownPath(primaryOutputAsset(outputAssets)?.path ?? "")})`, ""] : [],
        input.answer,
        "",
        ...outputAssetSection(outputAssets),
        "## Related Pages",
        "",
        ...relatedPageIds.length ? relatedPageIds.map((pageId2) => `- \`${pageId2}\``) : ["- None recorded."],
        "",
        "## Citations",
        "",
        ...input.citations.map((citation) => `- [source:${citation}]`),
        ""
      ] : input.outputFormat === "report" ? [
        input.answer,
        "",
        ...outputAssetSection(outputAssets),
        "## Related Pages",
        "",
        ...relatedPageIds.length ? relatedPageIds.map((pageId2) => `- \`${pageId2}\``) : ["- None recorded."],
        "",
        "## Citations",
        "",
        ...input.citations.map((citation) => `- [source:${citation}]`),
        ""
      ] : [
        `# ${input.title ?? input.question}`,
        "",
        input.answer,
        "",
        ...outputAssetSection(outputAssets),
        "## Related Pages",
        "",
        ...relatedPageIds.length ? relatedPageIds.map((pageId2) => `- \`${pageId2}\``) : ["- None recorded."],
        "",
        "## Citations",
        "",
        ...input.citations.map((citation) => `- [source:${citation}]`),
        ""
      ]).join("\n"),
      safeFrontmatter(frontmatter)
    )
  };
}
function buildExploreHubPage(input) {
  const slug = input.slug ?? `explore-${slugify(input.question)}`;
  const pageId = `output:${slug}`;
  const pathValue = pagePathFor("output", slug);
  const relatedPageIds = input.stepPages.map((page) => page.id);
  const relatedSourceIds = [...new Set(input.citations)];
  const relatedNodeIds = [...new Set(input.stepPages.flatMap((page) => page.nodeIds))];
  const outputAssets = input.outputAssets ?? [];
  const backlinks = [.../* @__PURE__ */ new Set([...relatedPageIds, ...relatedSourceIds.map((sourceId) => `source:${sourceId}`)])];
  const title = `Explore: ${input.question}`;
  const frontmatter = {
    page_id: pageId,
    kind: "output",
    cssclasses: cssclassesFor("output"),
    title,
    tags: decoratedTags(["output", "explore"], { projectIds: input.projectIds, extraTags: input.extraTags }),
    source_ids: relatedSourceIds,
    project_ids: input.projectIds ?? [],
    node_ids: relatedNodeIds,
    freshness: "fresh",
    status: input.metadata.status,
    confidence: input.metadata.confidence,
    created_at: input.metadata.createdAt,
    updated_at: input.metadata.updatedAt,
    compiled_from: input.metadata.compiledFrom,
    managed_by: input.metadata.managedBy,
    backlinks,
    schema_hash: input.schemaHash,
    source_hashes: {},
    source_semantic_hashes: {},
    related_page_ids: relatedPageIds,
    related_node_ids: relatedNodeIds,
    related_source_ids: relatedSourceIds,
    origin: "explore",
    question: input.question,
    output_format: input.outputFormat,
    output_assets: outputAssets,
    ...input.outputFormat === "slides" ? { marp: true } : {}
  };
  return {
    page: {
      id: pageId,
      path: pathValue,
      title,
      kind: "output",
      sourceIds: relatedSourceIds,
      projectIds: input.projectIds ?? [],
      nodeIds: relatedNodeIds,
      freshness: "fresh",
      status: input.metadata.status,
      confidence: input.metadata.confidence,
      backlinks,
      schemaHash: input.schemaHash,
      sourceHashes: {},
      sourceSemanticHashes: {},
      relatedPageIds,
      relatedNodeIds,
      relatedSourceIds,
      createdAt: input.metadata.createdAt,
      updatedAt: input.metadata.updatedAt,
      compiledFrom: input.metadata.compiledFrom,
      managedBy: input.metadata.managedBy,
      origin: "explore",
      question: input.question,
      outputFormat: input.outputFormat,
      outputAssets
    },
    content: matter4.stringify(
      (input.outputFormat === "slides" ? [
        `# ${title}`,
        "",
        `- Root question: ${input.question}`,
        `- Steps: ${input.stepPages.length}`,
        "---",
        "",
        "# Step Pages",
        "",
        ...input.stepPages.length ? input.stepPages.map((page) => `- ${pageLink(page)}`) : ["- No steps recorded."],
        "---",
        "",
        "# Follow-Up Questions",
        "",
        ...input.followUpQuestions.length ? input.followUpQuestions.map((question) => `- ${question}`) : ["- No follow-up questions generated."],
        "---",
        "",
        "# Citations",
        "",
        ...relatedSourceIds.map((citation) => `- [source:${citation}]`),
        ""
      ] : input.outputFormat === "chart" || input.outputFormat === "image" ? [
        `# ${title}`,
        "",
        ...primaryOutputAsset(outputAssets) ? [`![${title}](${assetMarkdownPath(primaryOutputAsset(outputAssets)?.path ?? "")})`, ""] : [],
        "## Root Question",
        "",
        input.question,
        "",
        ...outputAssetSection(outputAssets),
        "## Steps",
        "",
        ...input.stepPages.length ? input.stepPages.map((page) => `- ${pageLink(page)}`) : ["- No steps recorded."],
        "",
        "## Follow-Up Questions",
        "",
        ...input.followUpQuestions.length ? input.followUpQuestions.map((question) => `- ${question}`) : ["- No follow-up questions generated."],
        "",
        "## Citations",
        "",
        ...relatedSourceIds.map((citation) => `- [source:${citation}]`),
        ""
      ] : [
        `# ${title}`,
        "",
        "## Root Question",
        "",
        input.question,
        "",
        ...outputAssetSection(outputAssets),
        "## Steps",
        "",
        ...input.stepPages.length ? input.stepPages.map((page) => `- ${pageLink(page)}`) : ["- No steps recorded."],
        "",
        "## Follow-Up Questions",
        "",
        ...input.followUpQuestions.length ? input.followUpQuestions.map((question) => `- ${question}`) : ["- No follow-up questions generated."],
        "",
        "## Citations",
        "",
        ...relatedSourceIds.map((citation) => `- [source:${citation}]`),
        ""
      ]).join("\n"),
      frontmatter
    )
  };
}

// src/pages.ts
import fs10 from "fs/promises";
import path12 from "path";
import matter5 from "gray-matter";
function normalizeStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}
function normalizeProjectIds(value) {
  return normalizeStringArray(value);
}
function normalizeSourceHashes(value) {
  if (!value || typeof value !== "object") {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry) => typeof entry[0] === "string" && typeof entry[1] === "string")
  );
}
function normalizeSourceSemanticHashes(value) {
  return normalizeSourceHashes(value);
}
function normalizePageStatus(value, fallback = "active") {
  return value === "draft" || value === "candidate" || value === "active" || value === "blocked" || value === "completed" || value === "archived" ? value : fallback;
}
function normalizePageManager(value, fallback = "system") {
  return value === "human" || value === "system" ? value : fallback;
}
function normalizeSourceType(value) {
  return value === "arxiv" || value === "doi" || value === "tweet" || value === "article" || value === "url" ? value : void 0;
}
function normalizeSourceClass(value) {
  return value === "first_party" || value === "third_party" || value === "resource" || value === "generated" ? value : void 0;
}
function normalizeOutputFormat(value, fallback = "markdown") {
  return value === "report" || value === "slides" || value === "chart" || value === "image" ? value : fallback;
}
function normalizeOutputAssets(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.reduce((assets, item) => {
    if (!item || typeof item !== "object") {
      return assets;
    }
    const candidate = item;
    const id = typeof candidate.id === "string" ? candidate.id : "";
    const role = candidate.role;
    const assetPath = typeof candidate.path === "string" ? candidate.path : "";
    const mimeType = typeof candidate.mimeType === "string" ? candidate.mimeType : "";
    if (!id || !assetPath || !mimeType || role !== "primary" && role !== "preview" && role !== "manifest" && role !== "poster") {
      return assets;
    }
    assets.push({
      id,
      role,
      path: assetPath,
      mimeType,
      width: typeof candidate.width === "number" ? candidate.width : void 0,
      height: typeof candidate.height === "number" ? candidate.height : void 0,
      dataPath: typeof candidate.dataPath === "string" ? candidate.dataPath : void 0
    });
    return assets;
  }, []);
}
function normalizeTimestamp(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
}
async function loadExistingManagedPageState(absolutePath, defaults = {}) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const createdFallback = defaults.createdAt ?? now;
  const updatedFallback = defaults.updatedAt ?? createdFallback;
  if (!await fileExists(absolutePath)) {
    return {
      status: defaults.status ?? "active",
      managedBy: defaults.managedBy ?? "system",
      createdAt: createdFallback,
      updatedAt: updatedFallback
    };
  }
  const content = await fs10.readFile(absolutePath, "utf8");
  const parsed = matter5(content);
  return {
    status: normalizePageStatus(parsed.data.status, defaults.status ?? "active"),
    managedBy: normalizePageManager(parsed.data.managed_by, defaults.managedBy ?? "system"),
    createdAt: normalizeTimestamp(parsed.data.created_at, createdFallback),
    updatedAt: normalizeTimestamp(parsed.data.updated_at, updatedFallback)
  };
}
function inferPageKind(relativePath, explicitKind = void 0) {
  if (explicitKind === "source" || explicitKind === "module" || explicitKind === "concept" || explicitKind === "entity" || explicitKind === "output" || explicitKind === "insight" || explicitKind === "memory_task") {
    return explicitKind;
  }
  const normalized = relativePath.replace(/\\/g, "/");
  if (normalized.startsWith("sources/")) {
    return "source";
  }
  if (normalized.startsWith("code/")) {
    return "module";
  }
  if (normalized.startsWith("concepts/") || normalized.startsWith("candidates/concepts/")) {
    return "concept";
  }
  if (normalized.startsWith("entities/") || normalized.startsWith("candidates/entities/")) {
    return "entity";
  }
  if (normalized.startsWith("outputs/")) {
    return "output";
  }
  if (normalized.startsWith("insights/")) {
    return "insight";
  }
  if (normalized.startsWith("memory/tasks/")) {
    return "memory_task";
  }
  return "index";
}
function normalizeDecayScore(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return void 0;
  }
  return Math.max(0, Math.min(1, value));
}
function normalizeLastConfirmedAt(value) {
  if (typeof value !== "string") {
    return void 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? void 0 : new Date(parsed).toISOString();
}
function normalizeSupersededBy(value) {
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function normalizeMemoryTier(value) {
  return value === "working" || value === "episodic" || value === "semantic" || value === "procedural" ? value : void 0;
}
function normalizeConsolidationConfidence(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return void 0;
  }
  return Math.max(0, Math.min(1, value));
}
function parseStoredPage(relativePath, content, defaults = {}) {
  const parsed = matter5(content);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const fallbackCreatedAt = defaults.createdAt ?? now;
  const fallbackUpdatedAt = defaults.updatedAt ?? fallbackCreatedAt;
  const title = typeof parsed.data.title === "string" ? parsed.data.title : path12.basename(relativePath, ".md");
  const kind = inferPageKind(relativePath, parsed.data.kind);
  const sourceIds = normalizeStringArray(parsed.data.source_ids);
  const projectIds = normalizeProjectIds(parsed.data.project_ids);
  const nodeIds = normalizeStringArray(parsed.data.node_ids);
  const relatedPageIds = normalizeStringArray(parsed.data.related_page_ids);
  const relatedNodeIds = normalizeStringArray(parsed.data.related_node_ids);
  const relatedSourceIds = normalizeStringArray(parsed.data.related_source_ids);
  const backlinks = normalizeStringArray(parsed.data.backlinks);
  const compiledFrom = normalizeStringArray(parsed.data.compiled_from);
  const outputAssets = normalizeOutputAssets(parsed.data.output_assets);
  return {
    id: typeof parsed.data.page_id === "string" ? parsed.data.page_id : `${kind}:${slugify(relativePath.replace(/\.md$/, ""))}`,
    path: relativePath,
    title,
    kind,
    sourceType: normalizeSourceType(parsed.data.source_type),
    sourceClass: normalizeSourceClass(parsed.data.source_class),
    sourceIds,
    projectIds,
    nodeIds,
    freshness: parsed.data.freshness === "stale" ? "stale" : "fresh",
    decayScore: normalizeDecayScore(parsed.data.decay_score),
    lastConfirmedAt: normalizeLastConfirmedAt(parsed.data.last_confirmed_at),
    supersededBy: normalizeSupersededBy(parsed.data.superseded_by),
    status: normalizePageStatus(parsed.data.status, kind === "insight" ? "active" : "active"),
    confidence: typeof parsed.data.confidence === "number" ? parsed.data.confidence : kind === "output" ? 0.74 : 1,
    backlinks,
    schemaHash: typeof parsed.data.schema_hash === "string" ? parsed.data.schema_hash : "",
    sourceHashes: normalizeSourceHashes(parsed.data.source_hashes),
    sourceSemanticHashes: normalizeSourceSemanticHashes(parsed.data.source_semantic_hashes),
    relatedPageIds,
    relatedNodeIds,
    relatedSourceIds,
    createdAt: normalizeTimestamp(parsed.data.created_at, fallbackCreatedAt),
    updatedAt: normalizeTimestamp(parsed.data.updated_at, fallbackUpdatedAt),
    compiledFrom: compiledFrom.length ? compiledFrom : sourceIds,
    managedBy: normalizePageManager(parsed.data.managed_by, kind === "insight" ? "human" : "system"),
    origin: typeof parsed.data.origin === "string" ? parsed.data.origin : void 0,
    question: typeof parsed.data.question === "string" ? parsed.data.question : void 0,
    outputFormat: kind === "output" ? normalizeOutputFormat(parsed.data.output_format) : void 0,
    outputAssets: kind === "output" ? outputAssets : [],
    tier: kind === "insight" ? normalizeMemoryTier(parsed.data.tier) ?? "working" : void 0,
    consolidatedFromPageIds: kind === "insight" ? normalizeStringArray(parsed.data.consolidated_from_page_ids) : void 0,
    consolidationConfidence: kind === "insight" ? normalizeConsolidationConfidence(parsed.data.consolidation_confidence) : void 0
  };
}
async function loadInsightPages(wikiDir) {
  const insightsDir = path12.join(wikiDir, "insights");
  if (!await fileExists(insightsDir)) {
    return [];
  }
  const files = (await listFilesRecursive(insightsDir)).filter((filePath) => filePath.endsWith(".md")).filter((filePath) => path12.basename(filePath) !== "index.md").sort((left, right) => left.localeCompare(right));
  const insights = [];
  for (const absolutePath of files) {
    const relativePath = toPosix(path12.relative(wikiDir, absolutePath));
    const content = await fs10.readFile(absolutePath, "utf8");
    const parsed = matter5(content);
    const stats = await fs10.stat(absolutePath);
    const title = typeof parsed.data.title === "string" ? parsed.data.title : path12.basename(absolutePath, ".md");
    const sourceIds = normalizeStringArray(parsed.data.source_ids);
    const projectIds = normalizeProjectIds(parsed.data.project_ids);
    const nodeIds = normalizeStringArray(parsed.data.node_ids);
    const relatedPageIds = normalizeStringArray(parsed.data.related_page_ids);
    const relatedNodeIds = normalizeStringArray(parsed.data.related_node_ids);
    const relatedSourceIds = normalizeStringArray(parsed.data.related_source_ids);
    const backlinks = normalizeStringArray(parsed.data.backlinks);
    const compiledFrom = normalizeStringArray(parsed.data.compiled_from);
    const fallbackCreatedAt = stats.birthtimeMs > 0 ? stats.birthtime.toISOString() : stats.mtime.toISOString();
    const fallbackUpdatedAt = stats.mtime.toISOString();
    const slugSource = relativePath.replace(/^insights\//, "").replace(/\.md$/, "");
    insights.push({
      page: {
        id: typeof parsed.data.page_id === "string" ? parsed.data.page_id : `insight:${slugify(slugSource)}`,
        path: relativePath,
        title,
        kind: "insight",
        sourceClass: normalizeSourceClass(parsed.data.source_class),
        sourceIds,
        projectIds,
        nodeIds,
        freshness: parsed.data.freshness === "stale" ? "stale" : "fresh",
        decayScore: normalizeDecayScore(parsed.data.decay_score),
        lastConfirmedAt: normalizeLastConfirmedAt(parsed.data.last_confirmed_at),
        supersededBy: normalizeSupersededBy(parsed.data.superseded_by),
        status: normalizePageStatus(parsed.data.status, "active"),
        confidence: typeof parsed.data.confidence === "number" ? parsed.data.confidence : 1,
        backlinks,
        schemaHash: typeof parsed.data.schema_hash === "string" ? parsed.data.schema_hash : "",
        sourceHashes: normalizeSourceHashes(parsed.data.source_hashes),
        sourceSemanticHashes: normalizeSourceSemanticHashes(parsed.data.source_semantic_hashes),
        relatedPageIds,
        relatedNodeIds,
        relatedSourceIds,
        createdAt: normalizeTimestamp(parsed.data.created_at, fallbackCreatedAt),
        updatedAt: normalizeTimestamp(parsed.data.updated_at, fallbackUpdatedAt),
        compiledFrom: compiledFrom.length ? compiledFrom : sourceIds,
        managedBy: normalizePageManager(parsed.data.managed_by, "human"),
        origin: typeof parsed.data.origin === "string" ? parsed.data.origin : void 0,
        question: typeof parsed.data.question === "string" ? parsed.data.question : void 0,
        outputAssets: normalizeOutputAssets(parsed.data.output_assets),
        tier: normalizeMemoryTier(parsed.data.tier) ?? "working",
        consolidatedFromPageIds: normalizeStringArray(parsed.data.consolidated_from_page_ids),
        consolidationConfidence: normalizeConsolidationConfidence(parsed.data.consolidation_confidence)
      },
      content,
      contentHash: sha256(content)
    });
  }
  return insights.sort((left, right) => left.page.title.localeCompare(right.page.title));
}

// src/consolidate.ts
var DEFAULT_CONSOLIDATION_CONFIG = {
  enabled: true,
  workingToEpisodic: {
    minPages: 3,
    sessionWindowHours: 24,
    minSharedNodeRatio: 0.3
  },
  episodicToSemantic: {
    minOccurrences: 3
  },
  semanticToProcedural: {
    minWorkflowSteps: 3
  }
};
var SEMANTIC_LOOKBACK_DAYS = 90;
var WORKFLOW_TAG_PREFIX = "kind/workflow";
function resolveConsolidationConfig(config) {
  return {
    enabled: config?.enabled ?? DEFAULT_CONSOLIDATION_CONFIG.enabled,
    workingToEpisodic: {
      minPages: config?.workingToEpisodic?.minPages ?? DEFAULT_CONSOLIDATION_CONFIG.workingToEpisodic.minPages,
      sessionWindowHours: config?.workingToEpisodic?.sessionWindowHours ?? DEFAULT_CONSOLIDATION_CONFIG.workingToEpisodic.sessionWindowHours,
      minSharedNodeRatio: config?.workingToEpisodic?.minSharedNodeRatio ?? DEFAULT_CONSOLIDATION_CONFIG.workingToEpisodic.minSharedNodeRatio
    },
    episodicToSemantic: {
      minOccurrences: config?.episodicToSemantic?.minOccurrences ?? DEFAULT_CONSOLIDATION_CONFIG.episodicToSemantic.minOccurrences
    },
    semanticToProcedural: {
      minWorkflowSteps: config?.semanticToProcedural?.minWorkflowSteps ?? DEFAULT_CONSOLIDATION_CONFIG.semanticToProcedural.minWorkflowSteps
    }
  };
}
function jaccardRatio(a, b) {
  if (a.size === 0 && b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
function pageFingerprint(page) {
  return /* @__PURE__ */ new Set([
    ...page.nodeIds.map((id) => `node:${id}`),
    ...page.sourceIds.map((id) => `src:${id}`),
    ...page.relatedNodeIds.map((id) => `rel:${id}`)
  ]);
}
function groupWorkingPages(pages, sessionWindowHours, minSharedNodeRatio) {
  const sessionWindowMs = sessionWindowHours * 60 * 60 * 1e3;
  const groups = [];
  const sorted = [...pages].sort((left, right) => left.page.updatedAt.localeCompare(right.page.updatedAt));
  for (const stored of sorted) {
    const fingerprint = pageFingerprint(stored.page);
    const updatedMs = Date.parse(stored.page.updatedAt);
    if (Number.isNaN(updatedMs)) {
      continue;
    }
    let placed = false;
    for (const group of groups) {
      if (updatedMs - group.latestMs > sessionWindowMs) {
        continue;
      }
      if (jaccardRatio(fingerprint, group.fingerprint) >= minSharedNodeRatio) {
        group.pages.push(stored);
        for (const value of fingerprint) {
          group.fingerprint.add(value);
        }
        group.latestMs = Math.max(group.latestMs, updatedMs);
        placed = true;
        break;
      }
    }
    if (!placed) {
      groups.push({
        pages: [stored],
        fingerprint,
        latestMs: updatedMs
      });
    }
  }
  return groups.map(({ pages: groupPages, fingerprint }) => ({ pages: groupPages, fingerprint }));
}
function unionStringArrays(values) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const group of values) {
    for (const value of group) {
      if (!seen.has(value)) {
        seen.add(value);
        result.push(value);
      }
    }
  }
  return result;
}
function isWorkflowTitle(title) {
  const match = title.toLowerCase().match(/\b(set\s?up|configure|install|deploy|run|build|test|debug|migrate|publish|release|onboard|refactor|benchmark)\b/);
  return match?.[1]?.replace(/\s+/g, "");
}
async function heuristicEpisodicTitle(groupPages, now, provider) {
  const dateStamp = now.toISOString().slice(0, 10);
  const titles = groupPages.map((page) => page.title);
  const heuristicTitle = `Episodic: ${dateStamp} [${groupPages.length} sources]`;
  const heuristicSummary = [
    `Rolled up ${groupPages.length} working-tier pages captured on or before ${dateStamp}.`,
    `Source pages: ${titles.slice(0, 5).join("; ")}${titles.length > 5 ? "\u2026" : ""}.`
  ].join(" ");
  if (!provider) {
    return { title: heuristicTitle, summary: heuristicSummary };
  }
  try {
    const response = await provider.generateText({
      system: "Summarize the following group of working-tier research notes into a concise one-paragraph episodic digest. Return a short title on the first line and the paragraph on the second line.",
      prompt: titles.map((title2) => `- ${title2}`).join("\n")
    });
    const lines = response.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const title = lines[0] ? lines[0].replace(/^#+\s*/, "").slice(0, 120) : heuristicTitle;
    const summary = lines.slice(1).join(" ").slice(0, 600) || heuristicSummary;
    return { title, summary };
  } catch {
    return { title: heuristicTitle, summary: heuristicSummary };
  }
}
async function heuristicSemanticTitle(nodeId, occurrences, provider) {
  const heuristicTitle = `Semantic: ${nodeId} [${occurrences} episodes]`;
  const heuristicSummary = `Node ${nodeId} recurred across ${occurrences} episodic digests within the last ${SEMANTIC_LOOKBACK_DAYS} days.`;
  if (!provider) {
    return { title: heuristicTitle, summary: heuristicSummary };
  }
  try {
    const response = await provider.generateText({
      system: "Summarize the following recurring knowledge node as a one-paragraph durable semantic fact. Return a short title on the first line and the paragraph on the second line.",
      prompt: `Node: ${nodeId}
Episodic occurrences: ${occurrences}`
    });
    const lines = response.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const title = lines[0] ? lines[0].replace(/^#+\s*/, "").slice(0, 120) : heuristicTitle;
    const summary = lines.slice(1).join(" ").slice(0, 600) || heuristicSummary;
    return { title, summary };
  } catch {
    return { title: heuristicTitle, summary: heuristicSummary };
  }
}
async function heuristicProceduralTitle(workflow, stepTitles, provider) {
  const heuristicTitle = `Procedural: ${workflow} [${stepTitles.length} steps]`;
  const heuristicSummary = [
    `Observed workflow pattern "${workflow}" across ${stepTitles.length} semantic steps.`,
    `Steps: ${stepTitles.join(" -> ")}.`
  ].join(" ");
  if (!provider) {
    return { title: heuristicTitle, summary: heuristicSummary };
  }
  try {
    const response = await provider.generateText({
      system: "Summarize the following ordered steps as a concise procedural how-to knowledge page. Return a short title on the first line and the paragraph on the second line.",
      prompt: stepTitles.map((title2, index) => `${index + 1}. ${title2}`).join("\n")
    });
    const lines = response.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const title = lines[0] ? lines[0].replace(/^#+\s*/, "").slice(0, 120) : heuristicTitle;
    const summary = lines.slice(1).join(" ").slice(0, 600) || heuristicSummary;
    return { title, summary };
  } catch {
    return { title: heuristicTitle, summary: heuristicSummary };
  }
}
function insightPagePath(tier, slugSource) {
  return `insights/${tier}/${slugify(slugSource)}.md`;
}
function extractStoredPageTags(stored) {
  try {
    const parsed = matter6(stored.content);
    const raw = parsed.data?.tags;
    if (!Array.isArray(raw)) return [];
    return raw.filter((value) => typeof value === "string" && value.length > 0);
  } catch {
    return [];
  }
}
function sortDerivedTagsForInsight(tags, leaders) {
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const tag of tags) {
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    deduped.push(tag);
  }
  const pinned = [];
  const rest = [];
  for (const tag of deduped) {
    if (leaders.includes(tag)) continue;
    rest.push(tag);
  }
  for (const leader of leaders) {
    if (seen.has(leader)) pinned.push(leader);
  }
  rest.sort((left, right) => left.localeCompare(right));
  return [...pinned, ...rest];
}
function buildConsolidatedPage(input) {
  const { tier, title, summary, relativePath, sourcePages, confidence, now } = input;
  const pageId = `insight:${slugify(`${tier}-${relativePath.replace(/^insights\//, "").replace(/\.md$/, "")}`)}`;
  const sourceIds = unionStringArrays(sourcePages.map((page2) => page2.sourceIds));
  const nodeIds = unionStringArrays(sourcePages.map((page2) => page2.nodeIds));
  const projectIds = unionStringArrays(sourcePages.map((page2) => page2.projectIds));
  const relatedPageIds = sourcePages.map((page2) => page2.id);
  const consolidatedFromPageIds = sourcePages.map((page2) => page2.id);
  const createdAt = now.toISOString();
  const leaderTags = ["insight", tier];
  const projectTags = projectIds.map((projectId) => `project/${projectId}`);
  const inheritedTags = (input.inheritedTags ?? []).filter((tag) => typeof tag === "string" && tag.length > 0);
  const tags = sortDerivedTagsForInsight([...leaderTags, ...projectTags, ...inheritedTags], leaderTags);
  const frontmatter = {
    page_id: pageId,
    title,
    kind: "insight",
    tier,
    tags,
    consolidated_from_page_ids: consolidatedFromPageIds,
    consolidation_confidence: Math.max(0, Math.min(1, confidence)),
    source_ids: sourceIds,
    node_ids: nodeIds,
    project_ids: projectIds,
    related_page_ids: relatedPageIds,
    related_node_ids: nodeIds,
    related_source_ids: sourceIds,
    source_hashes: {},
    source_semantic_hashes: {},
    schema_hash: "",
    confidence: Math.max(0, Math.min(1, confidence)),
    status: "active",
    managed_by: "system",
    freshness: "fresh",
    created_at: createdAt,
    updated_at: createdAt,
    backlinks: [],
    compiled_from: sourceIds
  };
  const body = [
    `# ${title}`,
    "",
    summary,
    "",
    "## Rolled up from",
    "",
    ...sourcePages.map((page2) => `- [[${page2.path.replace(/\.md$/, "")}|${page2.title}]]`),
    ""
  ].join("\n");
  const content = matter6.stringify(body, frontmatter);
  const page = {
    id: pageId,
    path: relativePath,
    title,
    kind: "insight",
    sourceIds,
    projectIds,
    nodeIds,
    freshness: "fresh",
    status: "active",
    confidence: Math.max(0, Math.min(1, confidence)),
    backlinks: [],
    schemaHash: "",
    sourceHashes: {},
    sourceSemanticHashes: {},
    relatedPageIds,
    relatedNodeIds: nodeIds,
    relatedSourceIds: sourceIds,
    createdAt,
    updatedAt: createdAt,
    compiledFrom: sourceIds,
    managedBy: "system",
    tier,
    consolidatedFromPageIds,
    consolidationConfidence: Math.max(0, Math.min(1, confidence))
  };
  return { page, content };
}
async function markSourcePagesSuperseded(wikiDir, sourcePages, newPageId) {
  const updatedPaths = [];
  for (const stored of sourcePages) {
    const absolutePath = path13.join(wikiDir, stored.page.path);
    if (!await fileExists(absolutePath)) {
      continue;
    }
    const current = await fs11.readFile(absolutePath, "utf8");
    const parsed = matter6(current);
    const nextData = { ...parsed.data, superseded_by: newPageId };
    const nextContent = matter6.stringify(parsed.content, nextData);
    const changed = await writeFileIfChanged(absolutePath, nextContent);
    if (changed) {
      updatedPaths.push(stored.page.path);
    }
  }
  return updatedPaths;
}
async function writeConsolidatedPage(wikiDir, relativePath, content) {
  const absolutePath = path13.join(wikiDir, relativePath);
  await ensureDir(path13.dirname(absolutePath));
  return writeFileIfChanged(absolutePath, content);
}
async function runConsolidation(rootDir, config = {}, provider, options = {}) {
  const resolved = resolveConsolidationConfig(config);
  const decisions = [];
  const promoted = [];
  const newPages = [];
  if (!resolved.enabled) {
    decisions.push("consolidation disabled; no-op");
    return { promoted, newPages, decisions };
  }
  const { paths } = await loadVaultConfig(rootDir);
  const wikiDir = paths.wikiDir;
  const now = options.now ?? /* @__PURE__ */ new Date();
  const dryRun = Boolean(options.dryRun);
  const insights = await loadInsightPages(wikiDir);
  if (!insights.length) {
    decisions.push("no insight pages found; no-op");
    return { promoted, newPages, decisions };
  }
  const tieredPages = insights.map((stored) => {
    const tier = stored.page.tier ?? "working";
    return {
      ...stored,
      page: {
        ...stored.page,
        tier
      }
    };
  });
  const working = tieredPages.filter((stored) => stored.page.tier === "working" && !stored.page.supersededBy);
  const episodic = tieredPages.filter((stored) => stored.page.tier === "episodic" && !stored.page.supersededBy);
  const semantic = tieredPages.filter((stored) => stored.page.tier === "semantic" && !stored.page.supersededBy);
  const groups = groupWorkingPages(working, resolved.workingToEpisodic.sessionWindowHours, resolved.workingToEpisodic.minSharedNodeRatio);
  decisions.push(`working-to-episodic: ${working.length} candidate pages, ${groups.length} group(s)`);
  for (const group of groups) {
    if (group.pages.length < resolved.workingToEpisodic.minPages) {
      decisions.push(`  skip: group of ${group.pages.length} below minPages=${resolved.workingToEpisodic.minPages}`);
      continue;
    }
    const groupPages = group.pages.map((stored) => stored.page);
    const titleSummary = await heuristicEpisodicTitle(groupPages, now, provider);
    const slugSource = `${now.toISOString().slice(0, 10)}-${groupPages.length}`;
    const relativePath = insightPagePath("episodic", slugSource);
    const confidence = Math.min(1, 0.4 + 0.1 * groupPages.length);
    const built = buildConsolidatedPage({
      tier: "episodic",
      title: titleSummary.title,
      summary: titleSummary.summary,
      relativePath,
      sourcePages: groupPages,
      inheritedTags: group.pages.flatMap((stored) => extractStoredPageTags(stored)),
      confidence,
      now
    });
    newPages.push(built.page);
    for (const stored of group.pages) {
      promoted.push({ pageId: stored.page.id, fromTier: "working", toTier: "episodic" });
    }
    decisions.push(`  promote: ${group.pages.length} working pages -> ${built.page.id}`);
    if (!dryRun) {
      await writeConsolidatedPage(wikiDir, relativePath, built.content);
      await markSourcePagesSuperseded(wikiDir, group.pages, built.page.id);
    }
  }
  const episodicForSemantic = dryRun ? episodic : (await loadInsightPages(wikiDir)).filter((stored) => (stored.page.tier ?? "working") === "episodic" && !stored.page.supersededBy);
  const windowStart = new Date(now.getTime() - SEMANTIC_LOOKBACK_DAYS * 24 * 60 * 60 * 1e3).toISOString();
  const recentEpisodic = episodicForSemantic.filter((stored) => stored.page.updatedAt >= windowStart);
  const nodeOccurrences = /* @__PURE__ */ new Map();
  for (const stored of recentEpisodic) {
    const uniqueNodes = new Set(stored.page.nodeIds);
    for (const nodeId of uniqueNodes) {
      const bucket = nodeOccurrences.get(nodeId) ?? [];
      bucket.push(stored);
      nodeOccurrences.set(nodeId, bucket);
    }
  }
  const recurring = [...nodeOccurrences.entries()].filter(([, pages]) => pages.length >= resolved.episodicToSemantic.minOccurrences).sort((left, right) => right[1].length - left[1].length);
  decisions.push(`episodic-to-semantic: ${recentEpisodic.length} recent episodic pages, ${recurring.length} recurring node(s)`);
  for (const [nodeId, pages] of recurring) {
    const occurrences = pages.length;
    const titleSummary = await heuristicSemanticTitle(nodeId, occurrences, provider);
    const relativePath = insightPagePath("semantic", nodeId);
    const confidence = Math.min(1, 0.5 + 0.1 * occurrences);
    const built = buildConsolidatedPage({
      tier: "semantic",
      title: titleSummary.title,
      summary: titleSummary.summary,
      relativePath,
      sourcePages: pages.map((stored) => stored.page),
      inheritedTags: pages.flatMap((stored) => extractStoredPageTags(stored)),
      confidence,
      now
    });
    const existingPath = path13.join(wikiDir, relativePath);
    if (await fileExists(existingPath)) {
      decisions.push(`  skip: semantic page already exists for node ${nodeId}`);
      continue;
    }
    newPages.push(built.page);
    for (const stored of pages) {
      promoted.push({ pageId: stored.page.id, fromTier: "episodic", toTier: "semantic" });
    }
    decisions.push(`  promote: node ${nodeId} across ${occurrences} episodes -> ${built.page.id}`);
    if (!dryRun) {
      await writeConsolidatedPage(wikiDir, relativePath, built.content);
    }
  }
  const semanticForProcedural = dryRun ? semantic : (await loadInsightPages(wikiDir)).filter((stored) => (stored.page.tier ?? "working") === "semantic" && !stored.page.supersededBy);
  const workflowBuckets = /* @__PURE__ */ new Map();
  for (const stored of semanticForProcedural) {
    const tags = stored.page.projectIds ?? [];
    if (tags.some((tag) => tag.startsWith(WORKFLOW_TAG_PREFIX))) {
      const key = "kind/workflow";
      const bucket = workflowBuckets.get(key) ?? [];
      bucket.push(stored);
      workflowBuckets.set(key, bucket);
      continue;
    }
    const verb = isWorkflowTitle(stored.page.title);
    if (verb) {
      const bucket = workflowBuckets.get(verb) ?? [];
      bucket.push(stored);
      workflowBuckets.set(verb, bucket);
    }
  }
  decisions.push(`semantic-to-procedural: ${semanticForProcedural.length} semantic pages, ${workflowBuckets.size} workflow bucket(s)`);
  for (const [workflow, bucket] of workflowBuckets) {
    if (bucket.length < resolved.semanticToProcedural.minWorkflowSteps) {
      decisions.push(`  skip: workflow "${workflow}" with ${bucket.length} steps below minWorkflowSteps`);
      continue;
    }
    const ordered = [...bucket].sort((left, right) => left.page.updatedAt.localeCompare(right.page.updatedAt));
    const stepTitles = ordered.map((stored) => stored.page.title);
    const titleSummary = await heuristicProceduralTitle(workflow, stepTitles, provider);
    const relativePath = insightPagePath("procedural", workflow);
    const confidence = Math.min(1, 0.6 + 0.1 * ordered.length);
    const built = buildConsolidatedPage({
      tier: "procedural",
      title: titleSummary.title,
      summary: titleSummary.summary,
      relativePath,
      sourcePages: ordered.map((stored) => stored.page),
      inheritedTags: ordered.flatMap((stored) => extractStoredPageTags(stored)),
      confidence,
      now
    });
    const existingPath = path13.join(wikiDir, relativePath);
    if (await fileExists(existingPath)) {
      decisions.push(`  skip: procedural page already exists for workflow ${workflow}`);
      continue;
    }
    newPages.push(built.page);
    for (const stored of ordered) {
      promoted.push({ pageId: stored.page.id, fromTier: "semantic", toTier: "procedural" });
    }
    decisions.push(`  promote: workflow "${workflow}" across ${ordered.length} steps -> ${built.page.id}`);
    if (!dryRun) {
      await writeConsolidatedPage(wikiDir, relativePath, built.content);
    }
  }
  if (!dryRun && (promoted.length > 0 || decisions.length > 0)) {
    try {
      await appendLogEntry(rootDir, "consolidate", `Consolidated ${newPages.length} tier page(s)`, decisions.slice(0, 50));
      await recordSession(rootDir, {
        operation: "consolidate",
        title: `Consolidated ${newPages.length} tier page(s)`,
        startedAt: now.toISOString(),
        finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
        success: true,
        relatedPageIds: [...promoted.map((entry) => entry.pageId), ...newPages.map((page) => page.id)],
        changedPages: newPages.map((page) => page.path),
        lines: decisions.slice(0, 50)
      });
    } catch {
    }
  }
  void tierFrontmatterFragment;
  void toPosix;
  return { promoted, newPages, decisions };
}

// src/deep-lint.ts
import fs13 from "fs/promises";
import path17 from "path";
import matter7 from "gray-matter";
import { z as z5 } from "zod";

// src/findings.ts
function normalizeFindingSeverity(value) {
  if (typeof value !== "string") {
    return "info";
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "error" || normalized === "critical" || normalized === "fatal" || normalized === "high" || normalized === "severe") {
    return "error";
  }
  if (normalized === "warning" || normalized === "warn" || normalized === "medium" || normalized === "moderate" || normalized === "caution") {
    return "warning";
  }
  return "info";
}

// src/orchestration.ts
import { spawn as spawn2 } from "child_process";
import path14 from "path";
import { z as z3 } from "zod";
var orchestrationRoleResultSchema = z3.object({
  summary: z3.string().optional(),
  findings: z3.array(
    z3.object({
      severity: z3.string().optional().default("info"),
      message: z3.string().min(1),
      relatedPageIds: z3.array(z3.string()).optional(),
      relatedSourceIds: z3.array(z3.string()).optional(),
      suggestedQuery: z3.string().optional()
    })
  ).default([]),
  questions: z3.array(z3.string().min(1)).default([]),
  proposals: z3.array(
    z3.object({
      path: z3.string().min(1),
      content: z3.string().min(1),
      reason: z3.string().min(1)
    })
  ).default([])
});
function emptyResult(role) {
  return { role, findings: [], questions: [], proposals: [] };
}
function heuristicRoleResult(role, prompt) {
  const base = emptyResult(role);
  switch (role) {
    case "research":
      return {
        ...base,
        questions: [`What evidence best strengthens this topic?`, `What contradicts the current vault position?`]
      };
    case "safety":
      return {
        ...base,
        findings: [
          {
            role,
            severity: "info",
            message: "Heuristic safety review completed without structured contradictions.",
            suggestedQuery: "What claims in this result need stronger source support?"
          }
        ]
      };
    case "audit":
      return {
        ...base,
        findings: [
          {
            role,
            severity: "info",
            message: "Heuristic audit review suggests validating citations against raw sources.",
            suggestedQuery: "Which raw sources most directly support this result?"
          }
        ]
      };
    case "context":
      return {
        ...base,
        summary: prompt.slice(0, 160)
      };
    default:
      return base;
  }
}
async function runProviderRole(rootDir, role, roleConfig, input) {
  const { config } = await loadVaultConfig(rootDir);
  const providerConfig = config.providers[roleConfig.executor.provider];
  if (!providerConfig) {
    throw new Error(`Orchestration provider not found: ${roleConfig.executor.provider}`);
  }
  const provider = await createProvider(roleConfig.executor.provider, providerConfig, rootDir);
  if (provider.type === "heuristic") {
    return heuristicRoleResult(role, input.prompt);
  }
  const result = await provider.generateStructured(
    {
      system: input.system,
      prompt: input.prompt
    },
    orchestrationRoleResultSchema
  );
  return {
    role,
    summary: result.summary,
    findings: result.findings.map((finding) => ({ role, ...finding, severity: normalizeFindingSeverity(finding.severity) })),
    questions: result.questions,
    proposals: result.proposals
  };
}
async function runCommandRole(rootDir, role, executor, input) {
  const [command, ...args] = executor.command;
  const cwd = executor.cwd ? path14.resolve(rootDir, executor.cwd) : rootDir;
  const child = spawn2(command, args, {
    cwd,
    env: {
      ...process.env,
      ...executor.env ?? {}
    },
    stdio: ["pipe", "pipe", "pipe"]
  });
  const stdoutChunks = [];
  const stderrChunks = [];
  const timeout = setTimeout(() => {
    child.kill("SIGTERM");
  }, executor.timeoutMs ?? 6e4);
  child.stdout.on("data", (chunk) => {
    stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  child.stderr.on("data", (chunk) => {
    stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  child.stdin.write(
    JSON.stringify(
      {
        role,
        system: input.system,
        prompt: input.prompt
      },
      null,
      2
    )
  );
  child.stdin.end();
  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  }).finally(() => {
    clearTimeout(timeout);
  });
  if (exitCode !== 0) {
    throw new Error(stderrChunks.length ? Buffer.concat(stderrChunks).toString("utf8") : `Role command failed with exit code ${exitCode}`);
  }
  const parsed = orchestrationRoleResultSchema.parse(JSON.parse(Buffer.concat(stdoutChunks).toString("utf8") || "{}"));
  return {
    role,
    summary: parsed.summary,
    findings: parsed.findings.map((finding) => ({ role, ...finding, severity: normalizeFindingSeverity(finding.severity) })),
    questions: parsed.questions,
    proposals: parsed.proposals
  };
}
async function runRole(rootDir, role, roleConfig, input) {
  if (roleConfig.executor.type === "provider") {
    return runProviderRole(rootDir, role, roleConfig, input);
  }
  return runCommandRole(rootDir, role, roleConfig.executor, input);
}
async function runWithConcurrency(tasks, maxParallel) {
  const limit = Math.max(1, maxParallel);
  const results = new Array(tasks.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, async () => {
      while (cursor < tasks.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await tasks[index]();
      }
    })
  );
  return results;
}
async function runConfiguredRoles(rootDir, roles, input) {
  const { config } = await loadVaultConfig(rootDir);
  const roleConfigs = config.orchestration?.roles ?? {};
  const maxParallel = config.orchestration?.maxParallelRoles ?? 2;
  const selected = roles.map((role) => ({ role, config: roleConfigs[role] })).filter((entry) => Boolean(entry.config));
  if (!selected.length) {
    return [];
  }
  return runWithConcurrency(
    selected.map(
      (entry) => () => runRole(rootDir, entry.role, entry.config, {
        system: `You are the ${entry.role} role in SwarmVault orchestration. Return JSON only.`,
        prompt: [`Title: ${input.title}`, "", input.instructions, "", input.context].join("\n")
      })
    ),
    maxParallel
  );
}
function summarizeRoleQuestions(results) {
  return [...new Set(results.flatMap((result) => result.questions).filter(Boolean))];
}

// src/schema.ts
import fs12 from "fs/promises";
import path15 from "path";
function normalizeSchemaContent(content) {
  return content.trim() ? content.trim() : defaultVaultSchema().trim();
}
async function readSchemaFile(schemaPath, fallback = defaultVaultSchema()) {
  const content = await fileExists(schemaPath) ? await fs12.readFile(schemaPath, "utf8") : fallback;
  const normalized = normalizeSchemaContent(content);
  return {
    path: schemaPath,
    content: normalized,
    hash: sha256(normalized)
  };
}
function resolveProjectSchemaPath(rootDir, schemaPath) {
  return path15.resolve(rootDir, schemaPath);
}
function composeVaultSchema(root, projectSchemas = []) {
  if (!projectSchemas.length) {
    return {
      path: root.path,
      content: root.content,
      hash: root.hash
    };
  }
  const content = [
    root.content,
    ...projectSchemas.map(
      (schema) => [
        `## Project Schema`,
        "",
        `Path: ${toPosix(path15.relative(path15.dirname(root.path), schema.path) || schema.path)}`,
        "",
        schema.content
      ].join("\n")
    )
  ].join("\n\n");
  return {
    path: [root.path, ...projectSchemas.map((schema) => schema.path)].join(" + "),
    content,
    hash: sha256(content)
  };
}
function getEffectiveSchema(schemas, projectId) {
  if (!projectId) {
    return schemas.effective.global;
  }
  return schemas.effective.projects[projectId] ?? schemas.effective.global;
}
async function loadVaultSchemas(rootDir) {
  const { config, paths } = await loadVaultConfig(rootDir);
  const root = await readSchemaFile(paths.schemaPath);
  const projects = Object.fromEntries(
    await Promise.all(
      Object.entries(config.projects ?? {}).sort(([left], [right]) => left.localeCompare(right)).map(async ([projectId, project]) => {
        if (!project.schemaPath) {
          return [
            projectId,
            {
              path: "",
              content: "",
              hash: ""
            }
          ];
        }
        return [projectId, await readSchemaFile(resolveProjectSchemaPath(rootDir, project.schemaPath), "")];
      })
    )
  );
  const effectiveProjects = Object.fromEntries(
    Object.entries(projects).map(([projectId, schema]) => [
      projectId,
      schema.hash ? composeVaultSchema(root, [schema]) : composeVaultSchema(root)
    ])
  );
  return {
    root,
    projects,
    effective: {
      global: composeVaultSchema(root),
      projects: effectiveProjects
    }
  };
}
async function loadVaultSchema(rootDir) {
  return (await loadVaultSchemas(rootDir)).root;
}
function schemaCategoryLabels(schema) {
  const lines = schema.content.split("\n");
  const start = lines.findIndex((line) => line.trim() === "## Categories");
  if (start < 0) {
    return [];
  }
  const sectionLines = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) {
      break;
    }
    sectionLines.push(line);
  }
  return sectionLines.map((line) => line.trim()).filter((line) => line.startsWith("- ")).map((line) => line.slice(2).trim()).filter(Boolean);
}
function buildSchemaPrompt(schema, instruction) {
  return [instruction, "", `Vault schema path: ${schema.path}`, "", "Vault schema instructions:", schema.content].join("\n");
}

// src/web-search/registry.ts
import path16 from "path";
import { pathToFileURL as pathToFileURL2 } from "url";
import { z as z4 } from "zod";

// src/web-search/http-json.ts
function deepGet(value, pathValue) {
  if (!pathValue) {
    return value;
  }
  return pathValue.split(".").filter(Boolean).reduce((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return current[segment];
    }
    return void 0;
  }, value);
}
function envOrUndefined(name) {
  return name ? process.env[name] : void 0;
}
var HttpJsonWebSearchAdapter = class {
  constructor(id, config) {
    this.id = id;
    this.config = config;
  }
  id;
  config;
  type = "http-json";
  async search(query, limit = 5) {
    if (!this.config.endpoint) {
      throw new Error(`Web search provider ${this.id} is missing an endpoint.`);
    }
    const method = this.config.method ?? "GET";
    const queryParam = this.config.queryParam ?? "q";
    const limitParam = this.config.limitParam ?? "limit";
    const headers = {
      accept: "application/json",
      ...this.config.headers
    };
    const apiKey = envOrUndefined(this.config.apiKeyEnv);
    if (apiKey) {
      headers[this.config.apiKeyHeader ?? "Authorization"] = `${this.config.apiKeyPrefix ?? "Bearer "}${apiKey}`;
    }
    const endpoint = new URL(this.config.endpoint);
    let body;
    if (method === "GET") {
      endpoint.searchParams.set(queryParam, query);
      endpoint.searchParams.set(limitParam, String(limit));
    } else {
      headers["content-type"] = "application/json";
      body = JSON.stringify({
        [queryParam]: query,
        [limitParam]: limit
      });
    }
    const response = await fetch(endpoint, {
      method,
      headers,
      body
    });
    if (!response.ok) {
      throw new Error(`Web search provider ${this.id} failed: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    const rawResults = deepGet(payload, this.config.resultsPath ?? "results");
    if (!Array.isArray(rawResults)) {
      return [];
    }
    return rawResults.map((item) => {
      const title = deepGet(item, this.config.titleField ?? "title");
      const url = deepGet(item, this.config.urlField ?? "url");
      const snippet = deepGet(item, this.config.snippetField ?? "snippet");
      if (typeof title !== "string" || typeof url !== "string") {
        return null;
      }
      return {
        title,
        url,
        snippet: typeof snippet === "string" ? snippet : ""
      };
    }).filter((item) => item !== null);
  }
};

// src/web-search/registry.ts
var customWebSearchModuleSchema = z4.object({
  createAdapter: z4.function({
    input: [z4.string(), z4.custom(), z4.string()],
    output: z4.promise(z4.custom())
  })
});
async function createWebSearchAdapter(id, config, rootDir) {
  switch (config.type) {
    case "http-json":
      return new HttpJsonWebSearchAdapter(id, config);
    case "custom": {
      if (!config.module) {
        throw new Error(`Web search provider ${id} is type "custom" but no module path was configured.`);
      }
      const resolvedModule = path16.isAbsolute(config.module) ? config.module : path16.resolve(rootDir, config.module);
      const loaded = await import(pathToFileURL2(resolvedModule).href);
      const parsed = customWebSearchModuleSchema.parse(loaded);
      return parsed.createAdapter(id, config, rootDir);
    }
    default:
      throw new Error(`Unsupported web search provider type ${String(config.type)}`);
  }
}
async function getWebSearchAdapterForTask(rootDir, task) {
  const { config } = await loadVaultConfig(rootDir);
  const webSearchConfig = config.webSearch;
  if (!webSearchConfig) {
    throw new Error("No web search providers are configured. Add a webSearch block to swarmvault.config.json.");
  }
  const providerId = webSearchConfig.tasks[task];
  if (!providerId) {
    throw new Error(`No web search provider is configured for task "${task}". Add webSearch.tasks.${task} to swarmvault.config.json.`);
  }
  const providerConfig = webSearchConfig.providers[providerId];
  if (!providerConfig) {
    throw new Error(`No web search provider configured with id "${providerId}" for task "${task}".`);
  }
  return createWebSearchAdapter(providerId, providerConfig, rootDir);
}

// src/deep-lint.ts
var deepLintResponseSchema = z5.object({
  findings: z5.array(
    z5.object({
      severity: z5.string().optional().default("info"),
      code: z5.enum([
        "coverage_gap",
        "contradiction_candidate",
        "contradiction",
        "missing_citation",
        "candidate_page",
        "follow_up_question"
      ]),
      message: z5.string().min(1),
      relatedSourceIds: z5.array(z5.string()).default([]),
      relatedPageIds: z5.array(z5.string()).default([]),
      suggestedQuery: z5.string().optional()
    })
  ).max(20)
});
function graphContextSummary(graph) {
  const communities = (graph.communities ?? []).map((community) => ({
    ...community,
    size: community.nodeIds.length
  }));
  const godNodes = graph.nodes.filter((node) => node.isGodNode).sort((left, right) => (right.degree ?? 0) - (left.degree ?? 0)).slice(0, 5).map((node) => ({
    id: node.id,
    label: node.label,
    degree: node.degree ?? 0,
    bridgeScore: node.bridgeScore ?? 0,
    communityId: node.communityId
  }));
  return {
    communities,
    godNodes
  };
}
async function loadContextPages(rootDir, graph) {
  const { paths } = await loadVaultConfig(rootDir);
  const contextPages = graph.pages.filter(
    (page) => page.kind === "source" || page.kind === "module" || page.kind === "concept" || page.kind === "entity"
  );
  return Promise.all(
    contextPages.slice(0, 18).map(async (page) => {
      const absolutePath = path17.join(paths.wikiDir, page.path);
      const raw = await fs13.readFile(absolutePath, "utf8").catch(() => "");
      const parsed = matter7(raw);
      return {
        id: page.id,
        title: page.title,
        path: page.path,
        kind: page.kind,
        sourceIds: page.sourceIds,
        excerpt: truncate(normalizeWhitespace(parsed.content), 1400)
      };
    })
  );
}
function heuristicDeepFindings(contextPages, structuralFindings, graph) {
  const findings = [];
  const graphSummary = graphContextSummary(graph);
  for (const page of contextPages) {
    if (page.excerpt.includes("No claims extracted.")) {
      findings.push({
        severity: "warning",
        code: "coverage_gap",
        message: `Page ${page.title} has no extracted claims yet.`,
        pagePath: page.path,
        relatedSourceIds: page.sourceIds,
        relatedPageIds: [page.id],
        suggestedQuery: `What evidence or claims should ${page.title} contain?`
      });
    }
  }
  for (const page of contextPages.filter((item) => item.kind === "module").slice(0, 4)) {
    if (page.excerpt.includes("No top-level symbols detected.") || page.excerpt.includes("No imports detected.")) {
      findings.push({
        severity: "info",
        code: "coverage_gap",
        message: `Module page ${page.title} looks structurally thin and may need broader code ingestion coverage.`,
        pagePath: page.path,
        relatedSourceIds: page.sourceIds,
        relatedPageIds: [page.id],
        suggestedQuery: `What code context is missing around ${page.title}?`
      });
    }
  }
  for (const finding of structuralFindings.filter((item) => item.code === "uncited_claims").slice(0, 5)) {
    findings.push({
      severity: "warning",
      code: "missing_citation",
      message: finding.message,
      pagePath: finding.pagePath,
      suggestedQuery: finding.pagePath ? `Which sources support the claims in ${path17.basename(finding.pagePath, ".md")}?` : void 0
    });
  }
  for (const page of contextPages.filter((item) => item.kind === "source").slice(0, 3)) {
    findings.push({
      severity: "info",
      code: "follow_up_question",
      message: `Investigate what broader implications ${page.title} has for the rest of the vault.`,
      pagePath: page.path,
      relatedSourceIds: page.sourceIds,
      relatedPageIds: [page.id],
      suggestedQuery: `What broader implications does ${page.title} have?`
    });
  }
  for (const community of graphSummary.communities.filter((item) => item.size <= 2).slice(0, 3)) {
    findings.push({
      severity: "info",
      code: "coverage_gap",
      message: `Community ${community.label} is weakly covered with only ${community.size} node(s).`,
      suggestedQuery: `What sources would strengthen coverage for ${community.label}?`
    });
  }
  for (const node of graphSummary.godNodes.filter((item) => item.bridgeScore > 1).slice(0, 3)) {
    findings.push({
      severity: "info",
      code: "follow_up_question",
      message: `${node.label} connects multiple parts of the vault and deserves a closer audit.`,
      suggestedQuery: `Why does ${node.label} connect multiple topics in this vault?`
    });
  }
  return uniqueBy(findings, (item) => `${item.code}:${item.message}`);
}
async function runDeepLint(rootDir, structuralFindings, options = {}) {
  const { paths } = await loadVaultConfig(rootDir);
  const graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    return [];
  }
  const schema = await loadVaultSchema(rootDir);
  const provider = await getProviderForTask(rootDir, "lintProvider");
  const manifests = await listManifests(rootDir);
  const contextPages = await loadContextPages(rootDir, graph);
  let findings;
  if (provider.type === "heuristic") {
    findings = heuristicDeepFindings(contextPages, structuralFindings, graph);
  } else {
    const graphSummary = graphContextSummary(graph);
    const response = await provider.generateStructured(
      {
        system: "You are an auditor for a local-first LLM knowledge vault. Return advisory findings only. Do not propose direct file edits.",
        prompt: [
          "Review this SwarmVault state and return high-signal advisory findings.",
          "Look for claims that contradict each other across different sources. When you find a genuine contradiction, use code 'contradiction' and include both source IDs in relatedSourceIds.",
          "",
          "Schema:",
          schema.content,
          "",
          "Vault summary:",
          `- sources: ${manifests.length}`,
          `- pages: ${graph.pages.length}`,
          `- structural_findings: ${structuralFindings.length}`,
          `- communities: ${graphSummary.communities.length}`,
          `- god_nodes: ${graphSummary.godNodes.length}`,
          "",
          "Structural findings:",
          structuralFindings.map((item) => `- [${item.severity}] ${item.code}: ${item.message}`).join("\n") || "- none",
          "",
          "Graph metrics:",
          graphSummary.communities.length ? graphSummary.communities.map((community) => `- ${community.label}: ${community.size} node(s)`).join("\n") : "- no derived communities",
          graphSummary.godNodes.length ? [
            "",
            "God nodes:",
            ...graphSummary.godNodes.map((node) => `- ${node.label} (degree=${node.degree}, bridge=${node.bridgeScore})`)
          ].join("\n") : "",
          "",
          "Page context:",
          contextPages.map(
            (page) => [
              `## ${page.title}`,
              `page_id: ${page.id}`,
              `path: ${page.path}`,
              `kind: ${page.kind}`,
              `source_ids: ${page.sourceIds.join(",") || "none"}`,
              page.excerpt
            ].join("\n")
          ).join("\n\n---\n\n")
        ].join("\n")
      },
      deepLintResponseSchema
    );
    findings = response.findings.map((item) => ({
      severity: normalizeFindingSeverity(item.severity),
      code: item.code,
      message: item.message,
      relatedSourceIds: item.relatedSourceIds,
      relatedPageIds: item.relatedPageIds,
      suggestedQuery: item.suggestedQuery
    }));
  }
  if (!options.web) {
    const roleResults2 = await runConfiguredRoles(rootDir, ["audit", "safety"], {
      title: "Deep lint review",
      instructions: "Review the vault state and return advisory audit or safety findings only.",
      context: [
        `Structural findings: ${structuralFindings.length}`,
        `Context pages: ${contextPages.length}`,
        "",
        contextPages.map((page) => [`# ${page.title}`, `kind=${page.kind}`, `path=${page.path}`, page.excerpt].join("\n")).join("\n\n---\n\n")
      ].join("\n")
    });
    const roleQuestions2 = summarizeRoleQuestions(roleResults2);
    return uniqueBy(
      [
        ...findings,
        ...roleResults2.flatMap(
          (result) => result.findings.map((finding) => ({
            severity: finding.severity,
            code: `${result.role}_review`,
            message: finding.message,
            relatedSourceIds: finding.relatedSourceIds,
            relatedPageIds: finding.relatedPageIds,
            suggestedQuery: finding.suggestedQuery
          }))
        ),
        ...roleQuestions2.map((question) => ({
          severity: "info",
          code: "follow_up_question",
          message: `Orchestration suggested a follow-up question: ${question}`,
          suggestedQuery: question
        }))
      ],
      (item) => `${item.code}:${item.message}`
    );
  }
  const webSearch = await getWebSearchAdapterForTask(rootDir, "deepLintProvider");
  const queryCache = /* @__PURE__ */ new Map();
  for (const finding of findings) {
    const query = finding.suggestedQuery ?? finding.message;
    if (!queryCache.has(query)) {
      queryCache.set(query, await webSearch.search(query, 3));
    }
    finding.evidence = queryCache.get(query);
  }
  const roleResults = await runConfiguredRoles(rootDir, ["audit", "safety", "research"], {
    title: "Deep lint review with web search",
    instructions: "Review the vault state and return advisory findings, follow-up questions, and safer search angles.",
    context: [
      `Structural findings: ${structuralFindings.length}`,
      `Context pages: ${contextPages.length}`,
      "",
      contextPages.map((page) => [`# ${page.title}`, `kind=${page.kind}`, `path=${page.path}`, page.excerpt].join("\n")).join("\n\n---\n\n")
    ].join("\n")
  });
  const roleQuestions = summarizeRoleQuestions(roleResults);
  return uniqueBy(
    [
      ...findings,
      ...roleResults.flatMap(
        (result) => result.findings.map((finding) => ({
          severity: finding.severity,
          code: `${result.role}_review`,
          message: finding.message,
          relatedSourceIds: finding.relatedSourceIds,
          relatedPageIds: finding.relatedPageIds,
          suggestedQuery: finding.suggestedQuery
        }))
      ),
      ...roleQuestions.map((question) => ({
        severity: "info",
        code: "follow_up_question",
        message: `Orchestration suggested a follow-up question: ${question}`,
        suggestedQuery: question
      }))
    ],
    (item) => `${item.code}:${item.message}`
  );
}

// src/freshness.ts
import fs14 from "fs/promises";
import path18 from "path";
import matter8 from "gray-matter";
var DEFAULT_HALF_LIFE_DAYS = 365;
var DEFAULT_STALE_THRESHOLD = 0.3;
var DEFAULT_HALF_LIFE_DAYS_BY_SOURCE_CLASS = {
  first_party: 365,
  third_party: 90,
  resource: 730,
  generated: 30
};
function resolveDefaultHalfLife(config) {
  const candidate = config.defaultHalfLifeDays;
  return typeof candidate === "number" && candidate > 0 ? candidate : DEFAULT_HALF_LIFE_DAYS;
}
function resolveStaleThreshold(config) {
  const candidate = config.staleThreshold;
  if (typeof candidate !== "number" || Number.isNaN(candidate)) {
    return DEFAULT_STALE_THRESHOLD;
  }
  return Math.max(0, Math.min(1, candidate));
}
function resolveHalfLifeForSourceClass(sourceClass, config) {
  const defaultHalfLife = resolveDefaultHalfLife(config);
  if (!sourceClass) {
    return defaultHalfLife;
  }
  const override = config.halfLifeDaysBySourceClass?.[sourceClass];
  if (typeof override === "number" && override > 0) {
    return override;
  }
  const baseline = DEFAULT_HALF_LIFE_DAYS_BY_SOURCE_CLASS[sourceClass];
  return typeof baseline === "number" && baseline > 0 ? baseline : defaultHalfLife;
}
function clampScore(value) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(0, Math.min(1, value));
}
function computeDecayScore(lastConfirmedAt, sourceClass, config, now = /* @__PURE__ */ new Date()) {
  if (!lastConfirmedAt) {
    return 1;
  }
  const parsed = Date.parse(lastConfirmedAt);
  if (Number.isNaN(parsed)) {
    return 1;
  }
  const ageMs = now.getTime() - parsed;
  if (ageMs <= 0) {
    return 1;
  }
  const ageDays = ageMs / (1e3 * 60 * 60 * 24);
  const halfLifeDays = resolveHalfLifeForSourceClass(sourceClass, config);
  if (halfLifeDays <= 0) {
    return 1;
  }
  const score = 0.5 ** (ageDays / halfLifeDays);
  return clampScore(score);
}
function applyDecayToPages(pages, config, now = /* @__PURE__ */ new Date()) {
  const staleThreshold = resolveStaleThreshold(config);
  const markedStale = [];
  const updated = pages.map((page) => {
    const decayScore = computeDecayScore(page.lastConfirmedAt, page.sourceClass, config, now);
    const previousFreshness = page.freshness;
    let nextFreshness = previousFreshness;
    if (page.supersededBy) {
      nextFreshness = "stale";
    } else if (decayScore < staleThreshold) {
      nextFreshness = "stale";
    } else {
      nextFreshness = "fresh";
    }
    if (nextFreshness === "stale" && previousFreshness !== "stale") {
      markedStale.push(page.id);
    }
    return {
      ...page,
      decayScore,
      freshness: nextFreshness
    };
  });
  return { updated, markedStale };
}
function resetDecay(page, now = /* @__PURE__ */ new Date()) {
  return {
    ...page,
    decayScore: 1,
    lastConfirmedAt: now.toISOString(),
    freshness: page.supersededBy ? "stale" : "fresh"
  };
}
function markSuperseded(oldPage, newPageId, now = /* @__PURE__ */ new Date()) {
  return {
    ...oldPage,
    supersededBy: newPageId,
    freshness: "stale",
    decayScore: 0,
    updatedAt: now.toISOString()
  };
}
function resolveDecayConfig(config) {
  return {
    defaultHalfLifeDays: config?.defaultHalfLifeDays ?? DEFAULT_HALF_LIFE_DAYS,
    staleThreshold: config?.staleThreshold ?? DEFAULT_STALE_THRESHOLD,
    halfLifeDaysBySourceClass: {
      ...DEFAULT_HALF_LIFE_DAYS_BY_SOURCE_CLASS,
      ...config?.halfLifeDaysBySourceClass ?? {}
    }
  };
}
var DECAY_RELEVANT_KINDS = /* @__PURE__ */ new Set(["source", "module", "concept", "entity", "output", "insight"]);
function mergeDecayFrontmatter(data, page) {
  const next = { ...data };
  if (typeof page.decayScore === "number" && Number.isFinite(page.decayScore)) {
    next.decay_score = Math.max(0, Math.min(1, page.decayScore));
  } else {
    delete next.decay_score;
  }
  if (typeof page.lastConfirmedAt === "string" && page.lastConfirmedAt) {
    next.last_confirmed_at = page.lastConfirmedAt;
  } else {
    delete next.last_confirmed_at;
  }
  if (typeof page.supersededBy === "string" && page.supersededBy) {
    next.superseded_by = page.supersededBy;
  } else {
    delete next.superseded_by;
  }
  next.freshness = page.freshness;
  return next;
}
async function persistDecayFrontmatter(wikiDir, pages) {
  const changed = [];
  for (const page of pages) {
    if (!DECAY_RELEVANT_KINDS.has(page.kind)) {
      continue;
    }
    if (page.managedBy === "human") {
      continue;
    }
    const absolutePath = path18.join(wikiDir, page.path);
    if (!await fileExists(absolutePath)) {
      continue;
    }
    const current = await fs14.readFile(absolutePath, "utf8");
    const parsed = matter8(current);
    const nextData = mergeDecayFrontmatter(parsed.data, page);
    const nextContent = matter8.stringify(parsed.content, nextData);
    const didChange = await writeFileIfChanged(absolutePath, nextContent);
    if (didChange) {
      changed.push(page.path);
    }
  }
  return changed;
}
async function runDecayPass(input) {
  const now = input.now ?? /* @__PURE__ */ new Date();
  const decayConfig = resolveDecayConfig(input.config);
  const confirmed = new Set(input.confirmedPageIds);
  const prepared = input.pages.map((page) => {
    if (!DECAY_RELEVANT_KINDS.has(page.kind)) {
      return page;
    }
    if (confirmed.has(page.id)) {
      return resetDecay(page, now);
    }
    return {
      ...page,
      lastConfirmedAt: page.lastConfirmedAt
    };
  });
  const { updated, markedStale } = applyDecayToPages(prepared, decayConfig, now);
  const updatedPaths = await persistDecayFrontmatter(input.wikiDir, updated);
  const graph = await readJsonFile(input.graphPath);
  if (graph) {
    const byId = new Map(updated.map((page) => [page.id, page]));
    const nextGraphPages = graph.pages.map((page) => byId.get(page.id) ?? page);
    await writeJsonFile(input.graphPath, { ...graph, pages: nextGraphPages });
  }
  return { pages: updated, updatedPaths, markedStale };
}

// src/output-artifacts.ts
import { z as z6 } from "zod";
function escapeXml2(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
var chartSpecSchema = z6.object({
  kind: z6.enum(["bar", "line"]).default("bar"),
  title: z6.string().min(1),
  subtitle: z6.string().optional(),
  xLabel: z6.string().optional(),
  yLabel: z6.string().optional(),
  seriesLabel: z6.string().optional(),
  data: z6.array(
    z6.object({
      label: z6.string().min(1),
      value: z6.number().finite()
    })
  ).min(2).max(12),
  notes: z6.array(z6.string().min(1)).max(5).optional()
});
var sceneSpecSchema = z6.object({
  title: z6.string().min(1),
  alt: z6.string().min(1),
  background: z6.string().optional(),
  width: z6.number().int().positive().max(2400).optional(),
  height: z6.number().int().positive().max(2400).optional(),
  elements: z6.array(
    z6.object({
      kind: z6.enum(["shape", "label"]),
      shape: z6.enum(["rect", "circle", "line"]).optional(),
      x: z6.number().finite(),
      y: z6.number().finite(),
      width: z6.number().finite().optional(),
      height: z6.number().finite().optional(),
      radius: z6.number().finite().optional(),
      text: z6.string().optional(),
      fontSize: z6.number().finite().optional(),
      fill: z6.string().optional(),
      stroke: z6.string().optional(),
      strokeWidth: z6.number().finite().optional(),
      opacity: z6.number().finite().optional()
    })
  ).min(1).max(32)
});
function renderChartSvg(spec) {
  const width = 1200;
  const height = 720;
  const margin = { top: 110, right: 80, bottom: 110, left: 110 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const values = spec.data.map((item) => item.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const domainMin = Math.min(0, minValue);
  const domainMax = maxValue <= domainMin ? domainMin + 1 : maxValue;
  const ticks = 5;
  const tickValues = Array.from({ length: ticks + 1 }, (_, index) => domainMin + (domainMax - domainMin) * index / ticks);
  const projectY = (value) => margin.top + chartHeight - (value - domainMin) / (domainMax - domainMin || 1) * chartHeight;
  const zeroY = projectY(0);
  const step = chartWidth / Math.max(1, spec.data.length);
  const barWidth = Math.min(84, step * 0.6);
  const points = spec.data.map((item, index) => {
    const centerX = margin.left + step * index + step / 2;
    const y = projectY(item.value);
    return { ...item, centerX, y };
  });
  const gridLines = tickValues.map((value) => {
    const y = projectY(value);
    return [
      `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#dbe4ec" stroke-width="1" />`,
      `<text x="${margin.left - 16}" y="${y + 4}" text-anchor="end" font-size="14" fill="#475569">${escapeXml2(value.toFixed(0))}</text>`
    ].join("");
  }).join("");
  const bars = spec.kind === "bar" ? points.map((point) => {
    const top = Math.min(point.y, zeroY);
    const barHeight = Math.max(8, Math.abs(zeroY - point.y));
    return [
      `<rect x="${point.centerX - barWidth / 2}" y="${top}" width="${barWidth}" height="${barHeight}" rx="12" fill="#0ea5e9" opacity="0.92" />`,
      `<text x="${point.centerX}" y="${top - 10}" text-anchor="middle" font-size="13" fill="#0f172a">${escapeXml2(
        point.value.toFixed(0)
      )}</text>`
    ].join("");
  }).join("") : "";
  const linePath = spec.kind === "line" ? points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.centerX} ${point.y}`).join(" ") : "";
  const lineMarks = spec.kind === "line" ? [
    `<path d="${linePath}" fill="none" stroke="#0ea5e9" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />`,
    ...points.map(
      (point) => `<circle cx="${point.centerX}" cy="${point.y}" r="8" fill="#f8fafc" stroke="#0ea5e9" stroke-width="4" />
               <text x="${point.centerX}" y="${point.y - 18}" text-anchor="middle" font-size="13" fill="#0f172a">${escapeXml2(
        point.value.toFixed(0)
      )}</text>`
    )
  ].join("") : "";
  const labels = points.map(
    (point) => `<text x="${point.centerX}" y="${height - margin.bottom + 28}" text-anchor="middle" font-size="14" fill="#334155">${escapeXml2(
      point.label
    )}</text>`
  ).join("");
  const notes = (spec.notes ?? []).map(
    (note, index) => `<text x="${margin.left}" y="${height - 26 - index * 18}" font-size="13" fill="#475569">${escapeXml2(note)}</text>`
  ).join("");
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml2(spec.title)}">`,
    '<rect width="100%" height="100%" fill="#f8fafc" />',
    `<text x="${margin.left}" y="56" font-size="34" font-weight="700" fill="#0f172a">${escapeXml2(spec.title)}</text>`,
    spec.subtitle ? `<text x="${margin.left}" y="86" font-size="18" fill="#475569">${escapeXml2(spec.subtitle)}</text>` : "",
    gridLines,
    `<line x1="${margin.left}" y1="${zeroY}" x2="${width - margin.right}" y2="${zeroY}" stroke="#0f172a" stroke-width="2" />`,
    `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#0f172a" stroke-width="2" />`,
    bars,
    lineMarks,
    labels,
    spec.xLabel ? `<text x="${margin.left + chartWidth / 2}" y="${height - 46}" text-anchor="middle" font-size="15" fill="#475569">${escapeXml2(spec.xLabel)}</text>` : "",
    spec.yLabel ? `<text x="34" y="${margin.top + chartHeight / 2}" text-anchor="middle" font-size="15" fill="#475569" transform="rotate(-90 34 ${margin.top + chartHeight / 2})">${escapeXml2(spec.yLabel)}</text>` : "",
    spec.seriesLabel ? `<text x="${width - margin.right}" y="56" text-anchor="end" font-size="15" fill="#475569">${escapeXml2(spec.seriesLabel)}</text>` : "",
    notes,
    "</svg>"
  ].filter(Boolean).join("");
  return { svg, width, height };
}
function renderSceneSvg(spec) {
  const width = clampNumber(spec.width ?? 1200, 480, 1600);
  const height = clampNumber(spec.height ?? 720, 320, 1200);
  const elements = spec.elements.map((element) => {
    const opacity = element.opacity === void 0 ? 1 : clampNumber(element.opacity, 0, 1);
    if (element.kind === "label") {
      return `<text x="${element.x}" y="${element.y}" font-size="${clampNumber(element.fontSize ?? 28, 10, 72)}" fill="${escapeXml2(
        element.fill ?? "#0f172a"
      )}" opacity="${opacity}" font-family="'Avenir Next', 'Segoe UI', sans-serif">${escapeXml2(element.text ?? "")}</text>`;
    }
    switch (element.shape) {
      case "circle":
        return `<circle cx="${element.x}" cy="${element.y}" r="${Math.max(6, element.radius ?? 40)}" fill="${escapeXml2(
          element.fill ?? "#dbeafe"
        )}" stroke="${escapeXml2(element.stroke ?? "#0ea5e9")}" stroke-width="${Math.max(1, element.strokeWidth ?? 2)}" opacity="${opacity}" />`;
      case "line":
        return `<line x1="${element.x}" y1="${element.y}" x2="${element.x + (element.width ?? 120)}" y2="${element.y + (element.height ?? 0)}" stroke="${escapeXml2(element.stroke ?? "#475569")}" stroke-width="${Math.max(1, element.strokeWidth ?? 3)}" opacity="${opacity}" />`;
      default:
        return `<rect x="${element.x}" y="${element.y}" width="${Math.max(8, element.width ?? 160)}" height="${Math.max(
          8,
          element.height ?? 120
        )}" rx="22" fill="${escapeXml2(element.fill ?? "#e2e8f0")}" stroke="${escapeXml2(element.stroke ?? "#94a3b8")}" stroke-width="${Math.max(
          1,
          element.strokeWidth ?? 2
        )}" opacity="${opacity}" />`;
    }
  }).join("");
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml2(
      spec.alt
    )}">`,
    `<rect width="100%" height="100%" fill="${escapeXml2(spec.background ?? "#f8fafc")}" />`,
    `<text x="48" y="64" font-size="34" font-weight="700" fill="#0f172a">${escapeXml2(spec.title)}</text>`,
    elements,
    `</svg>`
  ].join("");
  return { svg, width, height };
}
function renderRasterPosterSvg(input) {
  const width = clampNumber(input.width ?? 1200, 480, 1600);
  const height = clampNumber(input.height ?? 720, 320, 1200);
  const inset = 42;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml2(
      input.alt
    )}">`,
    '<rect width="100%" height="100%" fill="#f8fafc" />',
    `<text x="${inset}" y="56" font-size="34" font-weight="700" fill="#0f172a">${escapeXml2(input.title)}</text>`,
    `<image href="${escapeXml2(input.rasterFileName)}" x="${inset}" y="92" width="${width - inset * 2}" height="${height - 148}" preserveAspectRatio="xMidYMid meet" />`,
    `</svg>`
  ].join("");
  return { svg, width, height };
}
function buildOutputAssetManifest(input) {
  return `${JSON.stringify(
    {
      slug: input.slug,
      format: input.format,
      question: input.question,
      title: input.title,
      answer: input.answer,
      citations: input.citations,
      assets: input.assets,
      spec: input.spec
    },
    null,
    2
  )}
`;
}

// src/outputs.ts
import fs15 from "fs/promises";
import path19 from "path";
import matter9 from "gray-matter";
function relationRank(outputPage, targetPage) {
  if (outputPage.relatedPageIds.includes(targetPage.id)) {
    return 3;
  }
  if (outputPage.relatedNodeIds.some((nodeId) => targetPage.nodeIds.includes(nodeId))) {
    return 2;
  }
  if (outputPage.relatedSourceIds.some((sourceId) => targetPage.sourceIds.includes(sourceId))) {
    return 1;
  }
  return 0;
}
function relatedOutputsForPage(targetPage, outputPages) {
  return outputPages.map((page) => ({ page, rank: relationRank(page, targetPage) })).filter((item) => item.rank > 0).sort((left, right) => right.rank - left.rank || left.page.title.localeCompare(right.page.title)).map((item) => item.page);
}
async function resolveUniqueOutputSlug(wikiDir, baseSlug) {
  const outputsDir = path19.join(wikiDir, "outputs");
  const root = baseSlug || "output";
  let candidate = root;
  let counter = 2;
  while (await fileExists(path19.join(outputsDir, `${candidate}.md`))) {
    candidate = `${root}-${counter}`;
    counter++;
  }
  return candidate;
}
async function loadSavedOutputPages(wikiDir) {
  const outputsDir = path19.join(wikiDir, "outputs");
  const entries = await fs15.readdir(outputsDir, { withFileTypes: true }).catch(() => []);
  const outputs = [];
  const queue = [{ absoluteDir: outputsDir, relativeDir: "outputs" }];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const currentEntries = current.absoluteDir === outputsDir ? entries : await fs15.readdir(current.absoluteDir, { withFileTypes: true }).catch(() => []);
    for (const entry of currentEntries) {
      if (entry.isDirectory()) {
        queue.push({
          absoluteDir: path19.join(current.absoluteDir, entry.name),
          relativeDir: path19.posix.join(current.relativeDir, entry.name)
        });
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "index.md") {
        continue;
      }
      const relativePath = path19.posix.join(current.relativeDir, entry.name);
      const absolutePath = path19.join(current.absoluteDir, entry.name);
      const content = await fs15.readFile(absolutePath, "utf8");
      const parsed = matter9(content);
      const slug = relativePath.replace(/^outputs\//, "").replace(/\.md$/, "");
      const title = typeof parsed.data.title === "string" ? parsed.data.title : path19.basename(slug);
      const pageId = typeof parsed.data.page_id === "string" ? parsed.data.page_id : `output:${slug}`;
      const sourceIds = normalizeStringArray(parsed.data.source_ids);
      const projectIds = normalizeProjectIds(parsed.data.project_ids);
      const nodeIds = normalizeStringArray(parsed.data.node_ids);
      const relatedPageIds = normalizeStringArray(parsed.data.related_page_ids);
      const relatedNodeIds = normalizeStringArray(parsed.data.related_node_ids);
      const relatedSourceIds = normalizeStringArray(parsed.data.related_source_ids);
      const backlinks = normalizeStringArray(parsed.data.backlinks);
      const compiledFrom = normalizeStringArray(parsed.data.compiled_from);
      const stats = await fs15.stat(absolutePath);
      const createdAt = typeof parsed.data.created_at === "string" ? parsed.data.created_at : stats.birthtimeMs > 0 ? stats.birthtime.toISOString() : stats.mtime.toISOString();
      const updatedAt = typeof parsed.data.updated_at === "string" ? parsed.data.updated_at : stats.mtime.toISOString();
      outputs.push({
        page: {
          id: pageId,
          path: relativePath,
          title,
          kind: "output",
          sourceIds,
          projectIds,
          nodeIds,
          freshness: parsed.data.freshness === "stale" ? "stale" : "fresh",
          status: normalizePageStatus(parsed.data.status, "active"),
          confidence: typeof parsed.data.confidence === "number" ? parsed.data.confidence : 0.74,
          backlinks,
          schemaHash: typeof parsed.data.schema_hash === "string" ? parsed.data.schema_hash : "",
          sourceHashes: normalizeSourceHashes(parsed.data.source_hashes),
          sourceSemanticHashes: normalizeSourceSemanticHashes(parsed.data.source_semantic_hashes),
          relatedPageIds,
          relatedNodeIds,
          relatedSourceIds,
          createdAt,
          updatedAt,
          compiledFrom: compiledFrom.length ? compiledFrom : relatedSourceIds,
          managedBy: normalizePageManager(parsed.data.managed_by, "system"),
          origin: typeof parsed.data.origin === "string" ? parsed.data.origin : void 0,
          question: typeof parsed.data.question === "string" ? parsed.data.question : void 0,
          outputFormat: parsed.data.output_format === "report" || parsed.data.output_format === "slides" || parsed.data.output_format === "chart" || parsed.data.output_format === "image" ? parsed.data.output_format : "markdown",
          outputAssets: normalizeOutputAssets(parsed.data.output_assets)
        },
        content,
        contentHash: sha256(content)
      });
    }
  }
  return outputs.sort((left, right) => left.page.title.localeCompare(right.page.title));
}

// src/retrieval.ts
import path21 from "path";

// src/search.ts
import fs16 from "fs/promises";
import path20 from "path";
import matter10 from "gray-matter";
function warningMessage(warning) {
  return warning instanceof Error ? warning.message : String(warning);
}
function warningType(warning, type) {
  if (warning instanceof Error) {
    return warning.name;
  }
  return typeof type === "string" ? type : void 0;
}
function isSqliteExperimentalWarning(warning, type) {
  return warningType(warning, type) === "ExperimentalWarning" && warningMessage(warning).includes("SQLite is an experimental feature");
}
function withSuppressedSqliteExperimentalWarning(run) {
  const originalEmitWarning = process.emitWarning.bind(process);
  process.emitWarning = ((warning, options, ...args) => {
    const type = typeof options === "string" ? options : typeof options?.type === "string" ? options.type ?? void 0 : void 0;
    if (isSqliteExperimentalWarning(warning, type)) {
      return;
    }
    return originalEmitWarning(warning, options, ...args);
  });
  try {
    return run();
  } finally {
    process.emitWarning = originalEmitWarning;
  }
}
function getDatabaseSync() {
  const builtin = withSuppressedSqliteExperimentalWarning(
    () => process.getBuiltinModule?.("node:sqlite")
  );
  if (!builtin?.DatabaseSync) {
    throw new Error("node:sqlite is unavailable in this Node runtime.");
  }
  return builtin.DatabaseSync;
}
function toFtsQuery(query) {
  return tokenize(query).join(" OR ");
}
function normalizeKind(value) {
  return value === "index" || value === "source" || value === "module" || value === "concept" || value === "entity" || value === "output" || value === "insight" || value === "memory_task" || value === "graph_report" || value === "community_summary" ? value : void 0;
}
function normalizeStatus(value) {
  return value === "draft" || value === "candidate" || value === "active" || value === "blocked" || value === "completed" || value === "archived" ? value : void 0;
}
function normalizeSourceType2(value) {
  return value === "arxiv" || value === "doi" || value === "tweet" || value === "article" || value === "url" ? value : void 0;
}
function normalizeSourceClass2(value) {
  return value === "first_party" || value === "third_party" || value === "resource" || value === "generated" ? value : void 0;
}
async function rebuildSearchIndex(dbPath, pages, wikiDir) {
  await ensureDir(path20.dirname(dbPath));
  const DatabaseSync = getDatabaseSync();
  const db = withSuppressedSqliteExperimentalWarning(() => new DatabaseSync(dbPath));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    DROP TABLE IF EXISTS page_search;
    DROP TABLE IF EXISTS pages;
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_class TEXT NOT NULL,
      project_ids TEXT NOT NULL,
      project_key TEXT NOT NULL
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS page_search USING fts5(
      title,
      body,
      content='pages',
      content_rowid='rowid'
    );
    DELETE FROM page_search;
    DELETE FROM pages;
  `);
  const insertPage = db.prepare(
    "INSERT INTO pages (id, path, title, body, kind, status, source_type, source_class, project_ids, project_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const rootDir = path20.dirname(wikiDir);
  for (const page of pages) {
    const absolutePath = path20.join(wikiDir, page.path);
    const content = await fs16.readFile(absolutePath, "utf8");
    const parsed = matter10(content);
    let body = parsed.content;
    const primarySourceId = Array.isArray(parsed.data.source_ids) && typeof parsed.data.source_ids[0] === "string" ? parsed.data.source_ids[0] : page.sourceIds[0];
    if ((page.kind === "source" || page.kind === "module") && primarySourceId) {
      try {
        const manifest = JSON.parse(
          await fs16.readFile(path20.join(rootDir, "state", "manifests", `${primarySourceId}.json`), "utf8")
        );
        const excerptPath = manifest.extractedTextPath ?? manifest.storedPath;
        if (excerptPath) {
          const excerpt = await fs16.readFile(path20.join(rootDir, excerptPath), "utf8");
          if (excerpt.trim()) {
            body = `${body}

## Source Excerpt

${excerpt.trim()}`.trim();
          }
        }
      } catch {
      }
    }
    insertPage.run(
      page.id,
      page.path,
      page.title,
      body,
      page.kind,
      page.status,
      typeof parsed.data.source_type === "string" ? parsed.data.source_type : "",
      typeof parsed.data.source_class === "string" ? parsed.data.source_class : "",
      JSON.stringify(page.projectIds),
      page.projectIds.map((projectId) => `|${projectId}|`).join("")
    );
  }
  db.exec("INSERT INTO page_search (rowid, title, body) SELECT rowid, title, body FROM pages;");
  db.close();
}
function mergeSearchResults(ftsResults, semanticHits, limit) {
  const k = 60;
  const scores = /* @__PURE__ */ new Map();
  const resultMap = /* @__PURE__ */ new Map();
  for (let i = 0; i < ftsResults.length; i++) {
    const r = ftsResults[i];
    scores.set(r.pageId, (scores.get(r.pageId) ?? 0) + 1 / (k + i + 1));
    resultMap.set(r.pageId, r);
  }
  for (let i = 0; i < semanticHits.length; i++) {
    const hit = semanticHits[i];
    scores.set(hit.pageId, (scores.get(hit.pageId) ?? 0) + 1 / (k + i + 1));
    if (!resultMap.has(hit.pageId)) {
      resultMap.set(hit.pageId, {
        pageId: hit.pageId,
        path: hit.path,
        title: hit.title,
        snippet: "",
        rank: -hit.score,
        kind: hit.kind,
        status: hit.status,
        projectIds: [],
        sourceType: void 0,
        sourceClass: void 0
      });
    }
  }
  return [...scores.entries()].sort(([, a], [, b]) => b - a).slice(0, limit).map(([pageId, rrfScore]) => {
    const result = resultMap.get(pageId);
    return { ...result, rank: -rrfScore };
  });
}
function searchPages(dbPath, query, limitOrOptions = 5) {
  const options = typeof limitOrOptions === "number" ? { limit: limitOrOptions } : limitOrOptions;
  const ftsQuery = toFtsQuery(query);
  if (!ftsQuery) {
    return [];
  }
  const DatabaseSync = getDatabaseSync();
  const db = withSuppressedSqliteExperimentalWarning(() => new DatabaseSync(dbPath, { readOnly: true }));
  const clauses = ["page_search MATCH ?"];
  const params = [ftsQuery];
  if (options.kind && options.kind !== "all") {
    clauses.push("pages.kind = ?");
    params.push(options.kind);
  }
  if (options.status && options.status !== "all") {
    clauses.push("pages.status = ?");
    params.push(options.status);
  }
  if (options.project && options.project !== "all") {
    if (options.project === "unassigned") {
      clauses.push("pages.project_key = ''");
    } else {
      clauses.push("pages.project_key LIKE ?");
      params.push(`%|${options.project}|%`);
    }
  }
  if (options.sourceType && options.sourceType !== "all") {
    clauses.push("pages.source_type = ?");
    params.push(options.sourceType);
  }
  if (options.sourceClass && options.sourceClass !== "all") {
    clauses.push("pages.source_class = ?");
    params.push(options.sourceClass);
  }
  const statement = db.prepare(`
    SELECT
      pages.id AS pageId,
      pages.path AS path,
      pages.title AS title,
      pages.kind AS kind,
      pages.status AS status,
      pages.source_type AS sourceType,
      pages.source_class AS sourceClass,
      pages.project_ids AS projectIds,
      snippet(page_search, 1, '[', ']', '...', 16) AS snippet,
      bm25(page_search) AS rank
    FROM page_search
    JOIN pages ON pages.rowid = page_search.rowid
    WHERE ${clauses.join(" AND ")}
    ORDER BY
      CASE pages.status
        WHEN 'active' THEN 0
        WHEN 'draft' THEN 1
        WHEN 'candidate' THEN 2
        ELSE 3
      END,
      CASE pages.kind
        WHEN 'source' THEN 0
        WHEN 'module' THEN 1
        WHEN 'output' THEN 2
        WHEN 'insight' THEN 3
        WHEN 'graph_report' THEN 4
        WHEN 'community_summary' THEN 5
        WHEN 'concept' THEN 6
        WHEN 'entity' THEN 7
        ELSE 8
      END,
      rank
    LIMIT ?
  `);
  params.push(options.limit ?? 5);
  const rows = statement.all(...params);
  db.close();
  return rows.map((row) => ({
    projectIds: (() => {
      const raw = String(row.projectIds ?? "[]");
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
      } catch {
        return [];
      }
    })(),
    pageId: String(row.pageId ?? ""),
    path: String(row.path ?? ""),
    title: String(row.title ?? ""),
    kind: normalizeKind(row.kind),
    status: normalizeStatus(row.status),
    sourceType: normalizeSourceType2(row.sourceType),
    sourceClass: normalizeSourceClass2(row.sourceClass),
    snippet: String(row.snippet ?? ""),
    rank: Number(row.rank ?? 0)
  }));
}

// src/retrieval.ts
var DEFAULT_RETRIEVAL_SHARD_SIZE = 25e3;
function resolveRetrievalConfig(config) {
  return {
    backend: "sqlite",
    shardSize: config.retrieval?.shardSize ?? DEFAULT_RETRIEVAL_SHARD_SIZE,
    hybrid: config.retrieval?.hybrid ?? config.search?.hybrid ?? true,
    rerank: config.retrieval?.rerank ?? config.search?.rerank ?? false,
    embeddingProvider: config.retrieval?.embeddingProvider ?? config.tasks.embeddingProvider,
    maxIndexedRows: config.retrieval?.maxIndexedRows
  };
}
function graphHash2(graph) {
  return sha256(
    JSON.stringify({
      generatedAt: graph.generatedAt,
      pages: graph.pages.map((page) => [page.id, page.path, page.kind, page.status, page.updatedAt, page.sourceIds, page.sourceHashes]).sort((left, right) => {
        return String(left[0]).localeCompare(String(right[0]));
      })
    })
  );
}
async function writeRetrievalManifest(rootDir, graph) {
  const { paths } = await loadVaultConfig(rootDir);
  const manifest = {
    version: 1,
    backend: "sqlite",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    graphGeneratedAt: graph.generatedAt,
    graphHash: graphHash2(graph),
    shardCount: 1,
    shards: [
      {
        id: "fts-000",
        path: toPosix(path21.relative(paths.stateDir, paths.searchDbPath)),
        pageCount: graph.pages.length
      }
    ]
  };
  await writeJsonFile(paths.retrievalManifestPath, manifest);
  return manifest;
}
async function rebuildRetrievalIndex(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  const graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    throw new Error("Graph artifact not found. Run `swarmvault compile` before rebuilding retrieval.");
  }
  await rebuildSearchIndex(paths.searchDbPath, graph.pages, paths.wikiDir);
  await writeRetrievalManifest(rootDir, graph);
  return getRetrievalStatus(rootDir);
}
async function getRetrievalStatus(rootDir) {
  const { config, paths } = await loadVaultConfig(rootDir);
  const configured = resolveRetrievalConfig(config);
  const [manifest, graph, manifestExists, indexExists, graphExists] = await Promise.all([
    readJsonFile(paths.retrievalManifestPath).catch(() => null),
    readJsonFile(paths.graphPath).catch(() => null),
    fileExists(paths.retrievalManifestPath),
    fileExists(paths.searchDbPath),
    fileExists(paths.graphPath)
  ]);
  const warnings = [];
  if (!graphExists) {
    warnings.push("Graph artifact is missing. Run `swarmvault compile`.");
  }
  if (!indexExists) {
    warnings.push("Retrieval index is missing. Run `swarmvault retrieval rebuild`.");
  }
  if (!manifestExists) {
    warnings.push("Retrieval manifest is missing. Run `swarmvault retrieval rebuild`.");
  }
  if (manifest && graph && manifest.graphHash !== graphHash2(graph)) {
    warnings.push("Retrieval index is stale relative to the current graph.");
  }
  return {
    configured,
    manifestPath: paths.retrievalManifestPath,
    indexPath: paths.searchDbPath,
    manifestExists,
    indexExists,
    graphExists,
    stale: Boolean(manifest && graph && manifest.graphHash !== graphHash2(graph)) || !manifestExists || !indexExists,
    pageCount: manifest?.shards.reduce((total, shard) => total + shard.pageCount, 0) ?? graph?.pages.length ?? 0,
    shardCount: manifest?.shardCount ?? 0,
    warnings
  };
}
async function doctorRetrieval(rootDir, options = {}) {
  let status = await getRetrievalStatus(rootDir);
  const actions = [];
  let repaired = false;
  if (status.stale) {
    actions.push("rebuild");
    if (options.repair) {
      status = await rebuildRetrievalIndex(rootDir);
      repaired = true;
    }
  }
  return {
    status,
    ok: !status.stale && status.warnings.length === 0,
    repaired,
    actions
  };
}

// src/source-sessions.ts
import fs17 from "fs/promises";
import path22 from "path";
function sessionStatePathFor(paths, sessionId) {
  return path22.join(paths.sourceSessionsDir, `${sessionId}.json`);
}
async function listGuidedSourceSessions(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  const entries = await fs17.readdir(paths.sourceSessionsDir, { withFileTypes: true }).catch(() => []);
  const sessions = await Promise.all(
    entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map(async (entry) => await readJsonFile(path22.join(paths.sourceSessionsDir, entry.name)))
  );
  return sessions.filter((session) => Boolean(session)).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
async function readGuidedSourceSession(rootDir, sessionId) {
  const { paths } = await loadVaultConfig(rootDir);
  return await readJsonFile(sessionStatePathFor(paths, sessionId));
}
async function findLatestGuidedSourceSessionByScope(rootDir, scopeId) {
  const sessions = await listGuidedSourceSessions(rootDir);
  return sessions.find((session) => session.scopeId === scopeId) ?? null;
}
async function writeGuidedSourceSession(rootDir, session) {
  const { paths } = await loadVaultConfig(rootDir);
  await ensureDir(paths.sourceSessionsDir);
  const next = {
    ...session,
    updatedAt: session.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
  };
  const filePath = sessionStatePathFor(paths, session.sessionId);
  await fs17.writeFile(filePath, `${JSON.stringify(next, null, 2)}
`, "utf8");
  return filePath;
}
async function updateGuidedSourceSessionStatus(rootDir, sessionId, status) {
  const existing = await readGuidedSourceSession(rootDir, sessionId);
  if (!existing) {
    return null;
  }
  const next = {
    ...existing,
    status,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await writeGuidedSourceSession(rootDir, next);
  return next;
}
async function guidedSourceSessionStatePath(rootDir, sessionId) {
  const { paths } = await loadVaultConfig(rootDir);
  return sessionStatePathFor(paths, sessionId);
}

// src/vault.ts
var COMPILE_PROGRESS_THRESHOLD = 120;
var COMPILE_PROGRESS_UPDATE_INTERVAL = 50;
function uniqueStrings4(values) {
  return uniqueBy(values.filter(Boolean), (value) => value);
}
function createCompileProgressReporter(phase, totalItems) {
  if (totalItems < COMPILE_PROGRESS_THRESHOLD || !process.stderr?.isTTY) {
    return {
      tick: () => {
      },
      finish: () => {
      }
    };
  }
  let completed = 0;
  let nextUpdate = Math.min(COMPILE_PROGRESS_UPDATE_INTERVAL, totalItems);
  process.stderr.write(`[swarmvault compile] ${phase}: 0/${totalItems}
`);
  return {
    tick: (label) => {
      completed += 1;
      if (completed >= nextUpdate || completed === totalItems) {
        process.stderr.write(`[swarmvault compile] ${phase}: ${completed}/${totalItems}${label ? ` (${label})` : ""}
`);
        while (completed >= nextUpdate) {
          nextUpdate += COMPILE_PROGRESS_UPDATE_INTERVAL;
        }
      }
    },
    finish: (summary) => {
      process.stderr.write(`[swarmvault compile] ${phase}: ${totalItems}/${totalItems}${summary ? ` (${summary})` : ""}
`);
    }
  };
}
function normalizeOutputFormat2(format) {
  return format === "report" || format === "slides" || format === "chart" || format === "image" ? format : "markdown";
}
function outputFormatInstruction(format) {
  switch (format) {
    case "report":
      return "Return a concise markdown report with a title, a brief summary, key findings, and cited evidence.";
    case "slides":
      return "Return Marp-compatible markdown slide content with short slide titles, `---` separators, and cited evidence. Do not include YAML frontmatter.";
    case "chart":
      return "Return concise markdown that explains the key visual takeaway for a chart and cites the supporting source IDs.";
    case "image":
      return "Return concise markdown that explains the key visual takeaway for an illustrative image and cites the supporting source IDs.";
    default:
      return "Return concise markdown grounded in the provided context with cited evidence.";
  }
}
function outputAssetPath(slug, fileName) {
  return toPosix(path23.join("outputs", "assets", slug, fileName));
}
function outputAssetId(slug, role) {
  return `output:${slug}:asset:${role}`;
}
function extensionForMimeType(mimeType) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    case "application/json":
      return "json";
    default:
      return "bin";
  }
}
function defaultChartSpec(question, answer, citations, relatedPageCount, relatedNodeCount) {
  return {
    kind: "bar",
    title: question,
    subtitle: truncate(normalizeWhitespace(answer), 120),
    xLabel: "Metric",
    yLabel: "Count",
    seriesLabel: "Vault context",
    data: [
      { label: "Citations", value: citations.length },
      { label: "Pages", value: relatedPageCount },
      { label: "Nodes", value: relatedNodeCount }
    ],
    notes: citations.length ? [`Sources: ${citations.join(", ")}`] : ["No citations recorded."]
  };
}
function defaultSceneSpec(question, answer, citations) {
  const summary = truncate(normalizeWhitespace(answer), 140);
  const citationLine = citations.length ? `Sources: ${citations.join(", ")}` : "No citations recorded.";
  return {
    title: question,
    alt: `${question}. ${summary}`,
    background: "#f8fafc",
    width: 1200,
    height: 720,
    elements: [
      {
        kind: "shape",
        shape: "rect",
        x: 48,
        y: 112,
        width: 1104,
        height: 220,
        fill: "#dbeafe",
        stroke: "#0ea5e9",
        strokeWidth: 3
      },
      {
        kind: "label",
        x: 78,
        y: 170,
        text: "Vault Summary",
        fontSize: 30,
        fill: "#0f172a"
      },
      {
        kind: "label",
        x: 78,
        y: 218,
        text: summary,
        fontSize: 22,
        fill: "#1e293b"
      },
      {
        kind: "shape",
        shape: "rect",
        x: 48,
        y: 372,
        width: 520,
        height: 210,
        fill: "#ecfccb",
        stroke: "#65a30d",
        strokeWidth: 3
      },
      {
        kind: "label",
        x: 78,
        y: 430,
        text: `Citations: ${citations.length}`,
        fontSize: 28,
        fill: "#14532d"
      },
      {
        kind: "label",
        x: 78,
        y: 476,
        text: citationLine,
        fontSize: 20,
        fill: "#166534"
      },
      {
        kind: "shape",
        shape: "circle",
        x: 864,
        y: 478,
        radius: 116,
        fill: "#fee2e2",
        stroke: "#ef4444",
        strokeWidth: 4
      },
      {
        kind: "label",
        x: 792,
        y: 470,
        text: "Image",
        fontSize: 34,
        fill: "#7f1d1d"
      },
      {
        kind: "label",
        x: 754,
        y: 512,
        text: "Fallback",
        fontSize: 26,
        fill: "#991b1b"
      }
    ]
  };
}
async function resolveImageGenerationProvider(rootDir) {
  const { config } = await loadVaultConfig(rootDir);
  const preferredProviderId = config.tasks.imageProvider;
  if (!preferredProviderId) {
    return getProviderForTask(rootDir, "queryProvider");
  }
  const providerConfig = config.providers[preferredProviderId];
  if (!providerConfig) {
    throw new Error(`No provider configured with id "${preferredProviderId}" for task "imageProvider".`);
  }
  const { createProvider: createProvider2 } = await import("./registry-7SS7TJ5J.js");
  return createProvider2(preferredProviderId, providerConfig, rootDir);
}
async function generateOutputArtifacts(rootDir, input) {
  if (input.format !== "chart" && input.format !== "image") {
    return {
      answer: input.answer,
      outputAssets: [],
      assetFiles: []
    };
  }
  const schemas = await loadVaultSchemas(rootDir);
  const schema = getEffectiveSchema(schemas, input.projectId ?? null);
  if (input.format === "chart") {
    const provider = await getProviderForTask(rootDir, "queryProvider");
    const chartSpec = provider.type === "heuristic" ? defaultChartSpec(input.question, input.answer, input.citations, input.relatedPageCount, input.relatedNodeCount) : await provider.generateStructured(
      {
        system: buildSchemaPrompt(
          schema,
          "Create a grounded chart spec. Use only the supplied answer and citations. Prefer simple bar or line charts with 2-12 points."
        ),
        prompt: [
          `Question: ${input.question}`,
          "",
          "Answer:",
          input.answer,
          "",
          `Citations: ${input.citations.join(", ") || "none"}`,
          `Related pages: ${input.relatedPageCount}`,
          `Related nodes: ${input.relatedNodeCount}`
        ].join("\n")
      },
      chartSpecSchema
    );
    const rendered = renderChartSvg(chartSpec);
    const primaryAsset2 = {
      id: outputAssetId(input.slug, "primary"),
      role: "primary",
      path: outputAssetPath(input.slug, "primary.svg"),
      mimeType: "image/svg+xml",
      width: rendered.width,
      height: rendered.height
    };
    const manifestAsset2 = {
      id: outputAssetId(input.slug, "manifest"),
      role: "manifest",
      path: outputAssetPath(input.slug, "manifest.json"),
      mimeType: "application/json"
    };
    const outputAssets2 = [primaryAsset2, manifestAsset2];
    return {
      answer: input.answer,
      outputAssets: outputAssets2,
      assetFiles: [
        { relativePath: primaryAsset2.path, content: rendered.svg, encoding: "utf8" },
        {
          relativePath: manifestAsset2.path,
          content: buildOutputAssetManifest({
            slug: input.slug,
            format: input.format,
            question: input.question,
            title: input.title,
            citations: input.citations,
            answer: input.answer,
            assets: outputAssets2,
            spec: chartSpec
          }),
          encoding: "utf8"
        }
      ]
    };
  }
  const imageProvider = await resolveImageGenerationProvider(rootDir);
  const nativePrompt = [
    `Create a single grounded illustration for: ${input.question}`,
    "",
    "Use only the supplied vault context.",
    input.answer,
    "",
    `Citations: ${input.citations.join(", ") || "none"}`
  ].join("\n");
  if (imageProvider.capabilities.has("image_generation") && typeof imageProvider.generateImage === "function") {
    try {
      const image = await imageProvider.generateImage({
        prompt: nativePrompt,
        system: buildSchemaPrompt(schema, "Create one grounded image prompt. Avoid text-heavy diagrams."),
        width: 1200,
        height: 720
      });
      const extension = extensionForMimeType(image.mimeType);
      const primaryAsset2 = {
        id: outputAssetId(input.slug, "primary"),
        role: "primary",
        path: outputAssetPath(input.slug, `primary.${extension}`),
        mimeType: image.mimeType,
        width: image.width,
        height: image.height
      };
      const poster = renderRasterPosterSvg({
        title: input.title,
        alt: image.revisedPrompt ?? input.answer,
        rasterFileName: `primary.${extension}`,
        width: image.width,
        height: image.height
      });
      const posterAsset = {
        id: outputAssetId(input.slug, "poster"),
        role: "poster",
        path: outputAssetPath(input.slug, "poster.svg"),
        mimeType: "image/svg+xml",
        width: poster.width,
        height: poster.height
      };
      const manifestAsset2 = {
        id: outputAssetId(input.slug, "manifest"),
        role: "manifest",
        path: outputAssetPath(input.slug, "manifest.json"),
        mimeType: "application/json"
      };
      const outputAssets2 = [primaryAsset2, posterAsset, manifestAsset2];
      return {
        answer: input.answer,
        outputAssets: outputAssets2,
        assetFiles: [
          { relativePath: primaryAsset2.path, content: image.bytes },
          { relativePath: posterAsset.path, content: poster.svg, encoding: "utf8" },
          {
            relativePath: manifestAsset2.path,
            content: buildOutputAssetManifest({
              slug: input.slug,
              format: input.format,
              question: input.question,
              title: input.title,
              citations: input.citations,
              answer: input.answer,
              assets: outputAssets2,
              spec: {
                mode: "native",
                prompt: nativePrompt,
                revisedPrompt: image.revisedPrompt
              }
            }),
            encoding: "utf8"
          }
        ]
      };
    } catch {
    }
  }
  const sceneSpec = imageProvider.type === "heuristic" ? defaultSceneSpec(input.question, input.answer, input.citations) : await imageProvider.generateStructured(
    {
      system: buildSchemaPrompt(
        schema,
        "Create a grounded SVG scene spec with shapes and short labels only. Avoid inventing unsupported details."
      ),
      prompt: nativePrompt
    },
    sceneSpecSchema
  );
  const renderedScene = renderSceneSvg(sceneSpec);
  const primaryAsset = {
    id: outputAssetId(input.slug, "primary"),
    role: "primary",
    path: outputAssetPath(input.slug, "primary.svg"),
    mimeType: "image/svg+xml",
    width: renderedScene.width,
    height: renderedScene.height
  };
  const manifestAsset = {
    id: outputAssetId(input.slug, "manifest"),
    role: "manifest",
    path: outputAssetPath(input.slug, "manifest.json"),
    mimeType: "application/json"
  };
  const outputAssets = [primaryAsset, manifestAsset];
  return {
    answer: input.answer,
    outputAssets,
    assetFiles: [
      { relativePath: primaryAsset.path, content: renderedScene.svg, encoding: "utf8" },
      {
        relativePath: manifestAsset.path,
        content: buildOutputAssetManifest({
          slug: input.slug,
          format: input.format,
          question: input.question,
          title: input.title,
          citations: input.citations,
          answer: input.answer,
          assets: outputAssets,
          spec: sceneSpec
        }),
        encoding: "utf8"
      }
    ]
  };
}
function normalizeProjectRoot(root) {
  const normalized = toPosix(path23.posix.normalize(root.replace(/\\/g, "/"))).replace(/^\.\/+/, "").replace(/\/+$/, "");
  return normalized;
}
function projectEntries(config) {
  return Object.entries(config.projects ?? {}).map(([id, project]) => ({
    id,
    roots: uniqueStrings4(project.roots.map(normalizeProjectRoot)).filter(Boolean),
    schemaPath: project.schemaPath
  })).sort((left, right) => left.id.localeCompare(right.id));
}
function projectConfigHash(config) {
  return sha256(
    JSON.stringify(
      projectEntries(config).map((project) => ({
        id: project.id,
        roots: project.roots,
        schemaPath: project.schemaPath ?? null
      }))
    )
  );
}
function manifestPathForProject(rootDir, manifest) {
  const rawPath = manifest.originalPath ?? manifest.storedPath;
  if (!rawPath) {
    return toPosix(manifest.storedPath);
  }
  if (!path23.isAbsolute(rawPath)) {
    return normalizeProjectRoot(rawPath);
  }
  const relative = toPosix(path23.relative(rootDir, rawPath));
  return relative.startsWith("..") ? toPosix(rawPath) : normalizeProjectRoot(relative);
}
function prefixMatches(value, prefix) {
  return value === prefix || value.startsWith(`${prefix}/`);
}
function resolveSourceProjectId(rootDir, manifest, config) {
  const comparablePath = manifestPathForProject(rootDir, manifest);
  let best = null;
  for (const project of projectEntries(config)) {
    for (const root of project.roots) {
      if (!root || !prefixMatches(comparablePath, root)) {
        continue;
      }
      if (!best || root.length > best.length || root.length === best.length && project.id.localeCompare(best.id) < 0) {
        best = { id: project.id, length: root.length };
      }
    }
  }
  return best?.id ?? null;
}
function resolveSourceProjects(rootDir, manifests, config) {
  return Object.fromEntries(manifests.map((manifest) => [manifest.sourceId, resolveSourceProjectId(rootDir, manifest, config)]));
}
function scopedProjectIdsFromSources(sourceIds, sourceProjects) {
  const projectIds = uniqueStrings4(sourceIds.map((sourceId) => sourceProjects[sourceId] ?? "").filter(Boolean));
  return projectIds.length === 1 ? projectIds : [];
}
function schemaProjectIdsFromPages(pageIds, pageMap2) {
  return uniqueStrings4(
    pageIds.flatMap((pageId) => pageMap2.get(pageId)?.projectIds ?? []).filter(Boolean).sort((left, right) => left.localeCompare(right))
  );
}
function categoryTagsForSchema(schema, texts) {
  const haystack = normalizeWhitespace(texts.filter(Boolean).join(" ")).toLowerCase();
  if (!haystack) {
    return [];
  }
  return uniqueStrings4(
    schemaCategoryLabels({ path: "", hash: "", content: schema.content }).filter((label) => haystack.includes(label.toLowerCase())).map((label) => `category/${slugify(label)}`)
  ).slice(0, 3);
}
function effectiveHashForProject(schemas, projectId) {
  return getEffectiveSchema(schemas, projectId).hash;
}
function previousGlobalSchemaHash(previousState) {
  return previousState?.effectiveSchemaHashes?.global ?? previousState?.schemaHash ?? previousState?.rootSchemaHash ?? "";
}
function previousProjectSchemaHash(previousState, projectId) {
  if (!projectId) {
    return previousGlobalSchemaHash(previousState);
  }
  return previousState?.effectiveSchemaHashes?.projects?.[projectId] ?? previousState?.projectSchemaHashes?.[projectId] ?? previousGlobalSchemaHash(previousState);
}
function expectedSchemaHashForPage(page, schemas, pageMap2, sourceProjects) {
  if (page.kind === "source" || page.kind === "module" || page.kind === "concept" || page.kind === "entity") {
    return effectiveHashForProject(schemas, scopedProjectIdsFromSources(page.sourceIds, sourceProjects)[0] ?? null);
  }
  if (page.kind === "output") {
    const projectIds = schemaProjectIdsFromPages(page.relatedPageIds, pageMap2);
    if (projectIds.length) {
      return composeVaultSchema(
        schemas.root,
        projectIds.map((projectId) => schemas.projects[projectId]).filter((schema) => Boolean(schema?.hash))
      ).hash;
    }
    return effectiveHashForProject(
      schemas,
      scopedProjectIdsFromSources(page.relatedSourceIds.length ? page.relatedSourceIds : page.sourceIds, sourceProjects)[0] ?? null
    );
  }
  if (page.path === "projects/index.md" || page.kind === "insight") {
    return schemas.effective.global.hash;
  }
  if (page.path.startsWith("projects/") && page.path.endsWith("/index.md")) {
    const projectId = page.projectIds[0] ?? page.path.split("/")[1] ?? null;
    return effectiveHashForProject(schemas, projectId);
  }
  return schemas.effective.global.hash;
}
function formatHeuristicAnswer(question, excerpts, rawExcerpts, searchResults, format) {
  switch (format) {
    case "report":
      return [
        `# Report: ${question}`,
        "",
        "## Summary",
        "",
        searchResults.length ? `The vault surfaces ${searchResults.length} relevant page(s) for this question.` : "No relevant pages found yet.",
        "",
        "## Relevant Pages",
        "",
        ...searchResults.length ? searchResults.map((result) => `- ${result.title} (${result.path})`) : ["- None found."],
        "",
        "## Evidence",
        "",
        ...excerpts.length ? excerpts : ["No wiki evidence available yet."],
        ...rawExcerpts.length ? ["", "## Raw Sources", "", ...rawExcerpts] : [],
        ""
      ].join("\n");
    case "slides":
      return [
        `# ${question}`,
        "",
        searchResults.length ? `- ${searchResults.length} relevant page(s) found` : "- No relevant pages found yet",
        "---",
        "",
        "# Key Pages",
        "",
        ...searchResults.length ? searchResults.map((result) => `- ${result.title}`) : ["- None found."],
        ...rawExcerpts.length ? [
          "---",
          "",
          "# Raw Sources",
          "",
          ...rawExcerpts.map((excerpt) => `- ${truncate(normalizeWhitespace(excerpt.replace(/^#.*\n/, "")), 140)}`)
        ] : [],
        ""
      ].join("\n");
    default:
      return [
        `Question: ${question}`,
        "",
        "Relevant pages:",
        ...searchResults.map((result) => `- ${result.title} (${result.path})`),
        "",
        excerpts.length ? excerpts.join("\n\n") : "No relevant pages found yet.",
        ...rawExcerpts.length ? ["", "Raw source material:", "", ...rawExcerpts] : []
      ].join("\n");
  }
}
function jaccardSimilarity(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = /* @__PURE__ */ new Set([...leftSet, ...rightSet]);
  if (union.size === 0) {
    return 1;
  }
  const intersection = [...leftSet].filter((item) => rightSet.has(item));
  return intersection.length / union.size;
}
function shouldPromoteCandidate(previous, sourceIds) {
  return Boolean(previous && previous.status === "candidate" && jaccardSimilarity(previous.sourceIds, sourceIds) >= 0.5);
}
function activeAggregatePath(kind, slug) {
  return kind === "entity" ? `entities/${slug}.md` : `concepts/${slug}.md`;
}
function approvalSummary(manifest) {
  return {
    approvalId: manifest.approvalId,
    createdAt: manifest.createdAt,
    bundleType: manifest.bundleType,
    title: manifest.title,
    sourceSessionId: manifest.sourceSessionId,
    entryCount: manifest.entries.length,
    pendingCount: manifest.entries.filter((entry) => entry.status === "pending").length,
    acceptedCount: manifest.entries.filter((entry) => entry.status === "accepted").length,
    rejectedCount: manifest.entries.filter((entry) => entry.status === "rejected").length
  };
}
function pageSlug(page) {
  return page.id.includes(":") ? page.id.slice(page.id.indexOf(":") + 1) : slugify(page.id);
}
function candidateActivePath(page) {
  if (page.kind !== "concept" && page.kind !== "entity") {
    throw new Error(`Only concept and entity candidates can be promoted: ${page.id}`);
  }
  return activeAggregatePath(page.kind, pageSlug(page));
}
function buildCommunityId(seed, index) {
  const slug = slugify(seed) || "cluster";
  return `community:${slug}-${index + 1}`;
}
function pageHashes(pages) {
  return Object.fromEntries(pages.map((page) => [page.page.id, page.contentHash]));
}
async function buildManagedGraphPage(absolutePath, defaults, build) {
  const existingContent = await fileExists(absolutePath) ? await fs18.readFile(absolutePath, "utf8") : null;
  let carriedContent = existingContent;
  let existing = await loadExistingManagedPageState(absolutePath, {
    status: defaults.status ?? "active",
    managedBy: defaults.managedBy
  });
  let usedFallbackState = false;
  if (!existingContent && defaults.statePathCandidates?.length) {
    for (const candidatePath of defaults.statePathCandidates) {
      if (candidatePath === absolutePath || !await fileExists(candidatePath)) {
        continue;
      }
      existing = await loadExistingManagedPageState(candidatePath, {
        status: defaults.status ?? "active",
        managedBy: defaults.managedBy
      });
      carriedContent = await fs18.readFile(candidatePath, "utf8");
      usedFallbackState = true;
      break;
    }
  }
  let metadata = {
    status: usedFallbackState && defaults.status ? defaults.status : existing.status,
    createdAt: existing.createdAt,
    updatedAt: existing.updatedAt,
    compiledFrom: defaults.compiledFrom,
    managedBy: defaults.managedBy,
    confidence: defaults.confidence
  };
  let built = build(metadata, carriedContent);
  if (carriedContent && carriedContent !== built.content) {
    metadata = {
      ...metadata,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    built = build(metadata, carriedContent);
  }
  return built;
}
async function buildManagedContent(absolutePath, defaults, build) {
  const existingContent = await fileExists(absolutePath) ? await fs18.readFile(absolutePath, "utf8") : null;
  let existing = await loadExistingManagedPageState(absolutePath, {
    status: defaults.status ?? "active",
    managedBy: defaults.managedBy
  });
  let usedFallbackState = false;
  if (!existingContent && defaults.statePathCandidates?.length) {
    for (const candidatePath of defaults.statePathCandidates) {
      if (candidatePath === absolutePath || !await fileExists(candidatePath)) {
        continue;
      }
      existing = await loadExistingManagedPageState(candidatePath, {
        status: defaults.status ?? "active",
        managedBy: defaults.managedBy
      });
      usedFallbackState = true;
      break;
    }
  }
  let metadata = {
    status: usedFallbackState && defaults.status ? defaults.status : existing.status,
    createdAt: existing.createdAt,
    updatedAt: existing.updatedAt,
    compiledFrom: defaults.compiledFrom,
    managedBy: defaults.managedBy
  };
  let content = build(metadata);
  if (existingContent && existingContent !== content) {
    metadata = {
      ...metadata,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    content = build(metadata);
  }
  return content;
}
function manifestDetailValue(manifest, key) {
  const value = manifest.details?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
async function loadAnalysesBySourceIds(paths, sourceIds) {
  const analyses = await Promise.all(
    sourceIds.map(async (sourceId) => await readJsonFile(path23.join(paths.analysesDir, `${sourceId}.json`)))
  );
  return analyses.filter((analysis) => Boolean(analysis?.sourceId));
}
async function buildDashboardRecords(config, paths, graph, schemaHash, report) {
  const dataviewEnabled = config.profile.dataviewBlocks;
  const profilePresets = config.profile.presets;
  const dashboardPack = config.profile.dashboardPack;
  const sourcePages = graph.pages.filter((page) => page.kind === "source");
  const reviewPages = graph.pages.filter((page) => page.kind === "output" && page.path.startsWith("outputs/source-reviews/"));
  const briefPages = graph.pages.filter((page) => page.kind === "output" && page.path.startsWith("outputs/source-briefs/"));
  const guidePages = graph.pages.filter((page) => page.kind === "output" && page.path.startsWith("outputs/source-guides/"));
  const sessionPages = graph.pages.filter((page) => page.kind === "output" && page.path.startsWith("outputs/source-sessions/"));
  const conceptPages = graph.pages.filter((page) => page.kind === "concept" && page.status !== "candidate").slice(0, 16);
  const entityPages = graph.pages.filter((page) => page.kind === "entity" && page.status !== "candidate").slice(0, 16);
  const manifests = graph.sources;
  const manifestBySourceId = new Map(manifests.map((manifest) => [manifest.sourceId, manifest]));
  const timelineManifests = manifests.filter((manifest) => manifestDetailValue(manifest, "occurred_at")).sort((left, right) => (manifestDetailValue(right, "occurred_at") ?? "").localeCompare(manifestDetailValue(left, "occurred_at") ?? "")).slice(0, 25);
  const recentSourcePages = [...sourcePages].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 20);
  const analyses = await loadAnalysesBySourceIds(paths, uniqueStrings4(sourcePages.flatMap((page) => page.sourceIds)));
  const openQuestions = uniqueStrings4(
    analyses.flatMap((analysis) => analysis.questions.map((question) => `${analysis.title}: ${question}`))
  ).slice(0, 20);
  const sourceSessions = await listGuidedSourceSessions(paths.rootDir);
  const stagedGuideBundles = (await Promise.all(
    (await fs18.readdir(paths.approvalsDir, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isDirectory()).map(async (entry) => await readApprovalManifest(paths, entry.name).catch(() => null))
  )).filter((manifest) => Boolean(manifest)).filter((manifest) => manifest.bundleType === "guided-source" || manifest.bundleType === "guided-session").sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 12);
  const readerFocusPages = uniqueBy([...guidePages, ...briefPages, ...conceptPages, ...entityPages], (page) => page.id).slice(0, 8);
  const diligenceSessions = sourceSessions.filter((session) => session.status === "staged" || session.status === "awaiting_input").slice(0, 8);
  const dashboards = [
    {
      relativePath: "dashboards/index.md",
      title: "Dashboards",
      content: (metadata) => matter11.stringify(
        [
          "# Dashboards",
          "",
          "- [[dashboards/recent-sources|Recent Sources]]",
          "- [[dashboards/reading-log|Reading Log]]",
          "- [[dashboards/timeline|Timeline]]",
          "- [[dashboards/source-sessions|Source Sessions]]",
          "- [[dashboards/source-guides|Source Guides]]",
          "- [[dashboards/research-map|Research Map]]",
          "- [[dashboards/contradictions|Contradictions]]",
          "- [[dashboards/open-questions|Open Questions]]",
          "",
          `Profile Presets: ${profilePresets.length ? profilePresets.map((preset) => `\`${preset}\``).join(", ") : "_default_"}`,
          `Dashboard Pack: \`${dashboardPack}\``,
          ...dataviewEnabled ? [
            "",
            "```dataview",
            "TABLE file.mtime AS updated",
            'FROM "dashboards"',
            'WHERE file.name != "index"',
            "SORT file.mtime desc",
            "```"
          ] : [],
          ""
        ].join("\n"),
        {
          page_id: "dashboards:index",
          kind: "index",
          title: "Dashboards",
          tags: ["index", "dashboards"],
          source_ids: [],
          project_ids: [],
          node_ids: [],
          freshness: "fresh",
          status: metadata.status,
          confidence: 1,
          created_at: metadata.createdAt,
          updated_at: metadata.updatedAt,
          compiled_from: metadata.compiledFrom,
          managed_by: metadata.managedBy,
          backlinks: [],
          schema_hash: schemaHash,
          source_hashes: {},
          source_semantic_hashes: {},
          profile_presets: profilePresets
        }
      )
    },
    {
      relativePath: "dashboards/recent-sources.md",
      title: "Recent Sources",
      content: (metadata) => matter11.stringify(
        [
          "# Recent Sources",
          "",
          ...recentSourcePages.length ? recentSourcePages.map((page) => `- ${page.updatedAt}: [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No source pages yet."],
          ...dashboardPack === "reader" && readerFocusPages.length ? ["", "## Reader Focus", "", ...readerFocusPages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`)] : [],
          ...dataviewEnabled ? [
            "",
            "```dataview",
            "TABLE source_type, occurred_at, participants",
            'FROM "sources"',
            "SORT updated_at desc",
            "LIMIT 25",
            "```"
          ] : [],
          ""
        ].join("\n"),
        {
          page_id: "dashboards:recent-sources",
          kind: "index",
          title: "Recent Sources",
          tags: ["index", "dashboard", "recent-sources"],
          source_ids: recentSourcePages.flatMap((page) => page.sourceIds),
          project_ids: [],
          node_ids: [],
          freshness: "fresh",
          status: metadata.status,
          confidence: 1,
          created_at: metadata.createdAt,
          updated_at: metadata.updatedAt,
          compiled_from: recentSourcePages.flatMap((page) => page.sourceIds),
          managed_by: metadata.managedBy,
          backlinks: [],
          schema_hash: schemaHash,
          source_hashes: {},
          source_semantic_hashes: {},
          profile_presets: profilePresets
        }
      )
    },
    {
      relativePath: "dashboards/reading-log.md",
      title: "Reading Log",
      content: (metadata) => matter11.stringify(
        [
          "# Reading Log",
          "",
          ...timelineManifests.length ? timelineManifests.map((manifest) => {
            const occurredAt = manifestDetailValue(manifest, "occurred_at") ?? manifest.updatedAt;
            const participants = manifestDetailValue(manifest, "participants");
            return `- ${occurredAt}: ${manifest.title}${participants ? ` (${participants})` : ""}`;
          }) : recentSourcePages.map((page) => `- ${page.updatedAt}: [[${page.path.replace(/\.md$/, "")}|${page.title}]]`),
          ...sourceSessions.length ? [
            "",
            "## Active Guided Sessions",
            "",
            ...sourceSessions.slice(0, 8).map(
              (session) => `- ${session.updatedAt}: \`${session.status}\` [[outputs/source-sessions/${session.scopeId}|${session.scopeTitle}]]`
            )
          ] : [],
          ...dashboardPack === "reader" && conceptPages.length ? [
            "",
            "## Thesis And Hub Pages",
            "",
            ...conceptPages.slice(0, 6).map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`)
          ] : [],
          ...dataviewEnabled ? [
            "",
            "```dataview",
            "TABLE occurred_at, source_type, participants, container_title",
            'FROM "sources"',
            "SORT occurred_at desc",
            "LIMIT 25",
            "```"
          ] : [],
          ""
        ].join("\n"),
        {
          page_id: "dashboards:reading-log",
          kind: "index",
          title: "Reading Log",
          tags: ["index", "dashboard", "reading-log"],
          source_ids: timelineManifests.map((manifest) => manifest.sourceId),
          project_ids: [],
          node_ids: [],
          freshness: "fresh",
          status: metadata.status,
          confidence: 1,
          created_at: metadata.createdAt,
          updated_at: metadata.updatedAt,
          compiled_from: timelineManifests.map((manifest) => manifest.sourceId),
          managed_by: metadata.managedBy,
          backlinks: [],
          schema_hash: schemaHash,
          source_hashes: {},
          source_semantic_hashes: {},
          profile_presets: profilePresets
        }
      )
    },
    {
      relativePath: "dashboards/timeline.md",
      title: "Timeline",
      content: (metadata) => matter11.stringify(
        [
          "# Timeline",
          "",
          ...timelineManifests.length ? timelineManifests.map((manifest) => {
            const occurredAt = manifestDetailValue(manifest, "occurred_at") ?? manifest.updatedAt;
            const sourcePage = sourcePages.find((page) => page.sourceIds.includes(manifest.sourceId));
            return `- ${occurredAt}: ${sourcePage ? `[[${sourcePage.path.replace(/\.md$/, "")}|${sourcePage.title}]]` : manifest.title}`;
          }) : ["- No timeline-aware sources yet."],
          ...dataviewEnabled ? [
            "",
            "```dataview",
            "TABLE occurred_at, participants, container_title",
            'FROM "sources"',
            "WHERE occurred_at",
            "SORT occurred_at desc",
            "```"
          ] : [],
          ""
        ].join("\n"),
        {
          page_id: "dashboards:timeline",
          kind: "index",
          title: "Timeline",
          tags: ["index", "dashboard", "timeline"],
          source_ids: timelineManifests.map((manifest) => manifest.sourceId),
          project_ids: [],
          node_ids: [],
          freshness: "fresh",
          status: metadata.status,
          confidence: 1,
          created_at: metadata.createdAt,
          updated_at: metadata.updatedAt,
          compiled_from: timelineManifests.map((manifest) => manifest.sourceId),
          managed_by: metadata.managedBy,
          backlinks: [],
          schema_hash: schemaHash,
          source_hashes: {},
          source_semantic_hashes: {},
          profile_presets: profilePresets
        }
      )
    },
    {
      relativePath: "dashboards/source-sessions.md",
      title: "Source Sessions",
      content: (metadata) => matter11.stringify(
        [
          "# Source Sessions",
          "",
          "## Active Sessions",
          "",
          ...sourceSessions.length ? sourceSessions.slice(0, 16).map(
            (session) => `- ${session.updatedAt}: \`${session.status}\` \`${session.sessionId}\` [[outputs/source-sessions/${session.scopeId}|${session.scopeTitle}]]`
          ) : ["- No guided source sessions yet."],
          "",
          "## Pending Guided Bundles",
          "",
          ...stagedGuideBundles.length ? stagedGuideBundles.map(
            (bundle) => `- ${bundle.createdAt}: \`${bundle.approvalId}\`${bundle.title ? ` ${bundle.title}` : ""} (${bundle.entries.length} staged entr${bundle.entries.length === 1 ? "y" : "ies"})`
          ) : ["- No staged guided bundles right now."],
          ...dataviewEnabled ? [
            "",
            "```dataview",
            "TABLE session_status, evidence_state, canonical_targets",
            'FROM "outputs/source-sessions"',
            "SORT file.mtime desc",
            "```"
          ] : [],
          ""
        ].join("\n"),
        {
          page_id: "dashboards:source-sessions",
          kind: "index",
          title: "Source Sessions",
          tags: ["index", "dashboard", "source-sessions"],
          source_ids: uniqueStrings4([
            ...sessionPages.flatMap((page) => page.sourceIds),
            ...sourceSessions.flatMap((session) => session.sourceIds)
          ]),
          project_ids: [],
          node_ids: [],
          freshness: "fresh",
          status: metadata.status,
          confidence: 1,
          created_at: metadata.createdAt,
          updated_at: metadata.updatedAt,
          compiled_from: uniqueStrings4([
            ...sessionPages.flatMap((page) => page.sourceIds),
            ...sourceSessions.flatMap((session) => session.sourceIds)
          ]),
          managed_by: metadata.managedBy,
          backlinks: [],
          schema_hash: schemaHash,
          source_hashes: {},
          source_semantic_hashes: {},
          profile_presets: profilePresets
        }
      )
    },
    {
      relativePath: "dashboards/source-guides.md",
      title: "Source Guides",
      content: (metadata) => matter11.stringify(
        [
          "# Source Guides",
          "",
          ...guidePages.length ? guidePages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No accepted source guides yet."],
          "",
          "## Pending Guided Bundles",
          "",
          ...stagedGuideBundles.length ? stagedGuideBundles.map(
            (bundle) => `- ${bundle.createdAt}: \`${bundle.approvalId}\`${bundle.title ? ` ${bundle.title}` : ""} (${bundle.entries.length} staged entr${bundle.entries.length === 1 ? "y" : "ies"})`
          ) : ["- No staged guided bundles right now."],
          ...dataviewEnabled ? [
            "",
            "```dataview",
            "TABLE evidence_state, canonical_targets, file.mtime AS updated",
            'FROM "outputs/source-guides"',
            "SORT file.mtime desc",
            "```"
          ] : [],
          ""
        ].join("\n"),
        {
          page_id: "dashboards:source-guides",
          kind: "index",
          title: "Source Guides",
          tags: ["index", "dashboard", "source-guides"],
          source_ids: uniqueStrings4([
            ...guidePages.flatMap((page) => page.sourceIds),
            ...stagedGuideBundles.flatMap((bundle) => bundle.entries.flatMap((entry) => entry.sourceIds))
          ]),
          project_ids: [],
          node_ids: [],
          freshness: "fresh",
          status: metadata.status,
          confidence: 1,
          created_at: metadata.createdAt,
          updated_at: metadata.updatedAt,
          compiled_from: uniqueStrings4([
            ...guidePages.flatMap((page) => page.sourceIds),
            ...stagedGuideBundles.flatMap((bundle) => bundle.entries.flatMap((entry) => entry.sourceIds))
          ]),
          managed_by: metadata.managedBy,
          backlinks: [],
          schema_hash: schemaHash,
          source_hashes: {},
          source_semantic_hashes: {},
          profile_presets: profilePresets
        }
      )
    },
    {
      relativePath: "dashboards/research-map.md",
      title: "Research Map",
      content: (metadata) => matter11.stringify(
        [
          "# Research Map",
          "",
          "## Canonical Concept Pages",
          "",
          ...conceptPages.length ? conceptPages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No concept pages yet."],
          "",
          "## Canonical Entity Pages",
          "",
          ...entityPages.length ? entityPages.map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No entity pages yet."],
          "",
          "## Recently Guided Sources",
          "",
          ...guidePages.length ? guidePages.slice(0, 8).map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`) : ["- No accepted source guides yet."],
          "",
          "## Active Source Sessions",
          "",
          ...sourceSessions.length ? sourceSessions.slice(0, 8).map((session) => `- \`${session.status}\` [[outputs/source-sessions/${session.scopeId}|${session.scopeTitle}]]`) : ["- No active source sessions yet."],
          ...report?.suggestedQuestions?.length ? ["", "## Suggested Questions", "", ...report.suggestedQuestions.slice(0, 8).map((question) => `- ${question}`)] : [],
          ...dataviewEnabled ? [
            "",
            "```dataview",
            'TABLE file.folder, file.mtime FROM "concepts" OR "entities"',
            "SORT file.mtime desc",
            "LIMIT 30",
            "```"
          ] : [],
          ""
        ].join("\n"),
        {
          page_id: "dashboards:research-map",
          kind: "index",
          title: "Research Map",
          tags: ["index", "dashboard", "research-map"],
          source_ids: uniqueStrings4([
            ...conceptPages.flatMap((page) => page.sourceIds),
            ...entityPages.flatMap((page) => page.sourceIds),
            ...guidePages.flatMap((page) => page.sourceIds)
          ]),
          project_ids: [],
          node_ids: [],
          freshness: "fresh",
          status: metadata.status,
          confidence: 1,
          created_at: metadata.createdAt,
          updated_at: metadata.updatedAt,
          compiled_from: uniqueStrings4([
            ...conceptPages.flatMap((page) => page.sourceIds),
            ...entityPages.flatMap((page) => page.sourceIds),
            ...guidePages.flatMap((page) => page.sourceIds)
          ]),
          managed_by: metadata.managedBy,
          backlinks: [],
          schema_hash: schemaHash,
          source_hashes: {},
          source_semantic_hashes: {},
          profile_presets: profilePresets
        }
      )
    },
    {
      relativePath: "dashboards/contradictions.md",
      title: "Contradictions",
      content: (metadata) => matter11.stringify(
        [
          "# Contradictions",
          "",
          ...report?.contradictions.length ? report.contradictions.map((contradiction) => {
            const left = manifestBySourceId.get(contradiction.sourceIdA)?.title ?? contradiction.sourceIdA;
            const right = manifestBySourceId.get(contradiction.sourceIdB)?.title ?? contradiction.sourceIdB;
            return `- ${left} / ${right}: ${contradiction.claimA} <> ${contradiction.claimB}`;
          }) : ["- No contradictions are currently flagged."],
          "",
          ...reviewPages.length || briefPages.length || guidePages.length ? [
            "## Related Reviews",
            "",
            ...[...guidePages, ...reviewPages, ...briefPages].slice(0, 12).map((page) => `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`),
            ""
          ] : [],
          ...dashboardPack === "diligence" && diligenceSessions.length ? [
            "## Active Evidence Review Sessions",
            "",
            ...diligenceSessions.map(
              (session) => `- \`${session.status}\` [[outputs/source-sessions/${session.scopeId}|${session.scopeTitle}]]`
            ),
            ""
          ] : [],
          ...dataviewEnabled ? [
            "```dataview",
            'TABLE evidence_state, session_status, canonical_targets FROM "outputs/source-reviews" OR "outputs/source-guides" OR "outputs/source-sessions"',
            'WHERE evidence_state = "conflicting"',
            "SORT file.mtime desc",
            "```"
          ] : [],
          ""
        ].join("\n"),
        {
          page_id: "dashboards:contradictions",
          kind: "index",
          title: "Contradictions",
          tags: ["index", "dashboard", "contradictions"],
          source_ids: report?.contradictions.flatMap((item) => [item.sourceIdA, item.sourceIdB]) ?? [],
          project_ids: [],
          node_ids: [],
          freshness: "fresh",
          status: metadata.status,
          confidence: 1,
          created_at: metadata.createdAt,
          updated_at: metadata.updatedAt,
          compiled_from: report?.contradictions.flatMap((item) => [item.sourceIdA, item.sourceIdB]) ?? [],
          managed_by: metadata.managedBy,
          backlinks: [],
          schema_hash: schemaHash,
          source_hashes: {},
          source_semantic_hashes: {},
          profile_presets: profilePresets
        }
      )
    },
    {
      relativePath: "dashboards/open-questions.md",
      title: "Open Questions",
      content: (metadata) => matter11.stringify(
        [
          "# Open Questions",
          "",
          ...openQuestions.length ? openQuestions.map((question) => `- ${question}`) : ["- No open questions are currently extracted."],
          ...sourceSessions.length ? [
            "",
            "## Active Guided Sessions",
            "",
            ...sourceSessions.filter((session) => session.status === "awaiting_input" || session.status === "staged").slice(0, 8).map((session) => `- \`${session.status}\` [[outputs/source-sessions/${session.scopeId}|${session.scopeTitle}]]`)
          ] : [],
          ...dataviewEnabled ? [
            "",
            "```dataview",
            'TABLE question_state, session_status, evidence_state FROM "outputs/source-briefs" OR "outputs/source-reviews" OR "outputs/source-guides" OR "outputs/source-sessions"',
            "SORT file.mtime desc",
            "```"
          ] : [],
          ""
        ].join("\n"),
        {
          page_id: "dashboards:open-questions",
          kind: "index",
          title: "Open Questions",
          tags: ["index", "dashboard", "open-questions"],
          source_ids: analyses.map((analysis) => analysis.sourceId),
          project_ids: [],
          node_ids: [],
          freshness: "fresh",
          status: metadata.status,
          confidence: 1,
          created_at: metadata.createdAt,
          updated_at: metadata.updatedAt,
          compiled_from: analyses.map((analysis) => analysis.sourceId),
          managed_by: metadata.managedBy,
          backlinks: [],
          schema_hash: schemaHash,
          source_hashes: {},
          source_semantic_hashes: {},
          profile_presets: profilePresets
        }
      )
    }
  ];
  const records = [];
  for (const dashboard of dashboards) {
    const absolutePath = path23.join(paths.wikiDir, dashboard.relativePath);
    const compiledFrom = dashboard.relativePath === "dashboards/recent-sources.md" ? recentSourcePages.flatMap((page) => page.sourceIds) : [];
    const content = await buildManagedContent(
      absolutePath,
      {
        managedBy: "system",
        compiledFrom
      },
      dashboard.content
    );
    records.push({
      page: emptyGraphPage({
        id: `dashboard:${dashboard.relativePath.replace(/\.md$/, "")}`,
        path: dashboard.relativePath,
        title: dashboard.title,
        kind: "index",
        sourceIds: compiledFrom,
        nodeIds: [],
        schemaHash,
        sourceHashes: {},
        confidence: 1
      }),
      content
    });
  }
  return records;
}
function indexCompiledFrom(pages) {
  return uniqueStrings4(pages.flatMap((page) => page.sourceIds));
}
function autoResolution(nodeCount, edgeCount) {
  if (nodeCount <= 20) return 0.5;
  if (edgeCount / Math.max(1, nodeCount) < 2) return 0.8;
  return 1;
}
function pruneDanglingEdges(nodes, edges) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  return edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
}
function applyNormLabel(nodes) {
  return nodes.map((node) => node.normLabel ? node : { ...node, normLabel: computeNormLabel(node.label) });
}
function describeGodNodeReason(degree, communityCount, degreeMean, degreeStd) {
  const parts = [`degree ${degree}`];
  if (communityCount >= 3) {
    parts.push(`across ${communityCount} communities`);
  } else if (communityCount === 2) {
    parts.push("bridges 2 communities");
  }
  if (degreeStd > 0) {
    const sigma = (degree - degreeMean) / degreeStd;
    if (sigma >= 1.5) {
      parts.push(`${sigma.toFixed(1)}\u03C3 above mean`);
    }
  }
  return parts.join(", ");
}
function deriveGraphMetrics(nodes, edges, options) {
  const adjacency = /* @__PURE__ */ new Map();
  const connect = (left, right) => {
    if (!adjacency.has(left)) {
      adjacency.set(left, /* @__PURE__ */ new Set());
    }
    adjacency.get(left)?.add(right);
  };
  for (const edge of edges) {
    connect(edge.source, edge.target);
    connect(edge.target, edge.source);
  }
  const nonSourceNodes = nodes.filter((node) => node.type !== "source");
  for (let index = 0; index < nonSourceNodes.length; index++) {
    const left = nonSourceNodes[index];
    for (let cursor = index + 1; cursor < nonSourceNodes.length; cursor++) {
      const right = nonSourceNodes[cursor];
      if (left.sourceIds.some((sourceId) => right.sourceIds.includes(sourceId))) {
        connect(left.id, right.id);
        connect(right.id, left.id);
      }
    }
  }
  const communityMap = /* @__PURE__ */ new Map();
  const communities = [];
  const nonSourceIdSet = new Set(nonSourceNodes.map((node) => node.id));
  const louvainGraph = new Graph({ type: "undirected" });
  for (const node of nonSourceNodes) {
    louvainGraph.addNode(node.id);
  }
  for (const node of nonSourceNodes) {
    for (const neighbor of adjacency.get(node.id) ?? []) {
      if (nonSourceIdSet.has(neighbor) && !louvainGraph.hasEdge(node.id, neighbor)) {
        louvainGraph.addEdge(node.id, neighbor);
      }
    }
  }
  const effectiveResolution = options?.resolution ?? autoResolution(louvainGraph.order, louvainGraph.size);
  const louvainMapping = louvainGraph.size > 0 ? louvain(louvainGraph, { resolution: effectiveResolution }) : {};
  const groupByCommunity = /* @__PURE__ */ new Map();
  let nextIsolated = -1;
  for (const node of nonSourceNodes) {
    const communityNumber = louvainMapping[node.id] ?? nextIsolated--;
    if (!groupByCommunity.has(communityNumber)) {
      groupByCommunity.set(communityNumber, []);
    }
    groupByCommunity.get(communityNumber).push(node.id);
  }
  let communityIndex = 0;
  for (const memberIds of groupByCommunity.values()) {
    const labelSeed = nodes.find((candidate) => candidate.id === memberIds[0])?.label ?? `cluster-${communityIndex + 1}`;
    const communityId = buildCommunityId(labelSeed, communityIndex);
    communities.push({
      id: communityId,
      label: labelSeed,
      nodeIds: memberIds.sort((left, right) => left.localeCompare(right))
    });
    for (const memberId of memberIds) {
      communityMap.set(memberId, communityId);
    }
    communityIndex++;
  }
  const degreeMap = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    degreeMap.set(node.id, adjacency.get(node.id)?.size ?? 0);
  }
  const degreeValues = nodes.filter((node) => node.type !== "source").map((node) => degreeMap.get(node.id) ?? 0).sort((left, right) => right - left);
  const godNodeThreshold = degreeValues[Math.max(0, Math.floor(degreeValues.length * 0.1) - 1)] ?? 0;
  const degreeMean = degreeValues.length > 0 ? degreeValues.reduce((sum, value) => sum + value, 0) / degreeValues.length : 0;
  const degreeVariance = degreeValues.length > 0 ? degreeValues.reduce((sum, value) => sum + (value - degreeMean) ** 2, 0) / degreeValues.length : 0;
  const degreeStd = Math.sqrt(degreeVariance);
  const nextNodes = nodes.map((node) => {
    const neighborCommunities = new Set(
      [...adjacency.get(node.id) ?? []].map((neighborId) => communityMap.get(neighborId) ?? communityMap.get(node.id)).filter((communityId) => Boolean(communityId))
    );
    const degree = degreeMap.get(node.id) ?? 0;
    const bridgeScore = node.type === "source" ? neighborCommunities.size : Math.max(0, neighborCommunities.size - 1);
    const inferredCommunityId = communityMap.get(node.id) ?? [...adjacency.get(node.id) ?? []].map((neighborId) => communityMap.get(neighborId)).find((communityId) => Boolean(communityId));
    const isGodNode = node.type !== "source" && degree >= godNodeThreshold && degree > 0;
    return {
      ...node,
      communityId: inferredCommunityId,
      degree,
      bridgeScore,
      isGodNode,
      surpriseReason: isGodNode ? describeGodNodeReason(degree, neighborCommunities.size, degreeMean, degreeStd) : void 0
    };
  });
  return {
    nodes: nextNodes,
    communities
  };
}
function resetGraphNodeMetrics(nodes) {
  return nodes.map(
    ({
      communityId: _communityId,
      degree: _degree,
      bridgeScore: _bridgeScore,
      isGodNode: _isGodNode,
      surpriseReason: _surpriseReason,
      ...node
    }) => node
  );
}
function manifestRepoPath(manifest) {
  return toPosix(manifest.repoRelativePath ?? path23.basename(manifest.originalPath ?? manifest.storedPath));
}
function goPackageScopeKey(manifest, analysis) {
  if (analysis.code?.language !== "go") {
    return null;
  }
  const packageName = analysis.code.namespace?.trim();
  if (!packageName) {
    return null;
  }
  return `${packageName}:${path23.posix.dirname(manifestRepoPath(manifest))}`;
}
function buildGoPackageSymbolLookups(analyses, manifestsById) {
  const lookups = /* @__PURE__ */ new Map();
  for (const analysis of analyses) {
    if (analysis.code?.language !== "go") {
      continue;
    }
    const manifest = manifestsById.get(analysis.sourceId);
    if (!manifest) {
      continue;
    }
    const scopeKey = goPackageScopeKey(manifest, analysis);
    if (!scopeKey) {
      continue;
    }
    const current = lookups.get(scopeKey) ?? {
      byName: /* @__PURE__ */ new Map(),
      methodIdsByShortName: /* @__PURE__ */ new Map()
    };
    for (const symbol of analysis.code.symbols) {
      current.byName.set(symbol.name, symbol.id);
      const separator = symbol.name.lastIndexOf(".");
      if (separator > 0) {
        const shortName = symbol.name.slice(separator + 1);
        const matches = current.methodIdsByShortName.get(shortName) ?? /* @__PURE__ */ new Set();
        matches.add(symbol.id);
        current.methodIdsByShortName.set(shortName, matches);
      }
    }
    lookups.set(scopeKey, current);
  }
  return new Map(
    [...lookups.entries()].map(([scopeKey, value]) => [
      scopeKey,
      {
        byName: value.byName,
        uniqueMethodIdsByShortName: new Map(
          [...value.methodIdsByShortName.entries()].filter(([, ids]) => ids.size === 1).map(([shortName, ids]) => [shortName, [...ids][0]])
        )
      }
    ])
  );
}
function claimTokens(text) {
  return new Set(
    text.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g)?.filter((t) => !(/* @__PURE__ */ new Set(["the", "and", "for", "that", "this", "with", "are", "was", "from", "has", "not", "all", "but"])).has(t)) ?? []
  );
}
function claimJaccardSimilarity(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}
function detectContradictions(analyses) {
  const contradictions = [];
  const claimsWithTokens = analyses.flatMap(
    (analysis) => analysis.claims.filter((c) => c.polarity === "positive" || c.polarity === "negative").map((c) => ({ sourceId: analysis.sourceId, claim: c, tokens: claimTokens(c.text) }))
  );
  for (let i = 0; i < claimsWithTokens.length; i++) {
    for (let j = i + 1; j < claimsWithTokens.length; j++) {
      const a = claimsWithTokens[i];
      const b = claimsWithTokens[j];
      if (a.sourceId === b.sourceId) continue;
      if (a.claim.polarity === b.claim.polarity) continue;
      const similarity = claimJaccardSimilarity(a.tokens, b.tokens);
      if (similarity >= 0.3) {
        contradictions.push({
          sourceIdA: a.sourceId,
          sourceIdB: b.sourceId,
          claimA: { text: a.claim.text, confidence: a.claim.confidence },
          claimB: { text: b.claim.text, confidence: b.claim.confidence },
          similarity
        });
      }
    }
  }
  return contradictions;
}
function buildGraph(manifests, analyses, pages, sourceProjects, _codeIndex, memoryTasks = [], options) {
  const manifestsById = new Map(manifests.map((manifest) => [manifest.sourceId, manifest]));
  const goPackageSymbolLookups = buildGoPackageSymbolLookups(analyses, manifestsById);
  const analysesBySourceId = new Map(analyses.map((analysis) => [analysis.sourceId, analysis]));
  const sourceNodes = manifests.map((manifest) => {
    const analysis = analysesBySourceId.get(manifest.sourceId);
    return {
      id: `source:${manifest.sourceId}`,
      type: "source",
      label: manifest.title,
      pageId: `source:${manifest.sourceId}`,
      freshness: "fresh",
      confidence: 1,
      sourceIds: [manifest.sourceId],
      projectIds: scopedProjectIdsFromSources([manifest.sourceId], sourceProjects),
      sourceClass: manifest.sourceClass,
      language: manifest.language,
      tags: analysis?.tags ?? []
    };
  });
  const conceptMap = /* @__PURE__ */ new Map();
  const entityMap = /* @__PURE__ */ new Map();
  const moduleMap = /* @__PURE__ */ new Map();
  const symbolMap = /* @__PURE__ */ new Map();
  const rationaleMap = /* @__PURE__ */ new Map();
  const edges = [];
  const edgesById = /* @__PURE__ */ new Set();
  const pushEdge = (edge) => {
    if (edgesById.has(edge.id)) {
      return;
    }
    edgesById.add(edge.id);
    edges.push(edge);
  };
  for (const analysis of analyses) {
    for (const concept of analysis.concepts) {
      const existing = conceptMap.get(concept.id);
      const sourceIds = [.../* @__PURE__ */ new Set([...existing?.sourceIds ?? [], analysis.sourceId])];
      conceptMap.set(concept.id, {
        id: concept.id,
        type: "concept",
        label: concept.name,
        pageId: `concept:${slugify(concept.name)}`,
        freshness: "fresh",
        confidence: nodeConfidence(sourceIds.length),
        sourceIds,
        projectIds: scopedProjectIdsFromSources(sourceIds, sourceProjects),
        sourceClass: aggregateManifestSourceClass(manifests, sourceIds)
      });
      pushEdge({
        id: `${analysis.sourceId}->${concept.id}`,
        source: `source:${analysis.sourceId}`,
        target: concept.id,
        relation: "mentions",
        status: "extracted",
        evidenceClass: "extracted",
        confidence: edgeConfidence(analysis.claims, concept.name),
        provenance: [analysis.sourceId]
      });
    }
    for (const entity of analysis.entities) {
      const existing = entityMap.get(entity.id);
      const sourceIds = [.../* @__PURE__ */ new Set([...existing?.sourceIds ?? [], analysis.sourceId])];
      entityMap.set(entity.id, {
        id: entity.id,
        type: "entity",
        label: entity.name,
        pageId: `entity:${slugify(entity.name)}`,
        freshness: "fresh",
        confidence: nodeConfidence(sourceIds.length),
        sourceIds,
        projectIds: scopedProjectIdsFromSources(sourceIds, sourceProjects),
        sourceClass: aggregateManifestSourceClass(manifests, sourceIds)
      });
      pushEdge({
        id: `${analysis.sourceId}->${entity.id}`,
        source: `source:${analysis.sourceId}`,
        target: entity.id,
        relation: "mentions",
        status: "extracted",
        evidenceClass: "extracted",
        confidence: edgeConfidence(analysis.claims, entity.name),
        provenance: [analysis.sourceId]
      });
    }
    if (analysis.code) {
      const manifest = manifestsById.get(analysis.sourceId);
      if (!manifest) {
        continue;
      }
      const moduleId = analysis.code.moduleId;
      moduleMap.set(moduleId, {
        id: moduleId,
        type: "module",
        label: modulePageTitle(manifest),
        pageId: moduleId,
        freshness: "fresh",
        confidence: 1,
        sourceIds: [analysis.sourceId],
        projectIds: scopedProjectIdsFromSources([analysis.sourceId], sourceProjects),
        sourceClass: manifest.sourceClass,
        language: analysis.code.language,
        moduleId
      });
      pushEdge({
        id: `source:${analysis.sourceId}->${moduleId}:contains_code`,
        source: `source:${analysis.sourceId}`,
        target: moduleId,
        relation: "contains_code",
        status: "extracted",
        evidenceClass: "extracted",
        confidence: 1,
        provenance: [analysis.sourceId]
      });
      for (const symbol of analysis.code.symbols) {
        symbolMap.set(symbol.id, {
          id: symbol.id,
          type: "symbol",
          label: symbol.name,
          pageId: moduleId,
          freshness: "fresh",
          confidence: symbol.exported ? 0.88 : 0.74,
          sourceIds: [analysis.sourceId],
          projectIds: scopedProjectIdsFromSources([analysis.sourceId], sourceProjects),
          sourceClass: manifest.sourceClass,
          language: analysis.code.language,
          moduleId,
          symbolKind: symbol.kind
        });
        pushEdge({
          id: `${moduleId}->${symbol.id}:defines`,
          source: moduleId,
          target: symbol.id,
          relation: "defines",
          status: "extracted",
          evidenceClass: "extracted",
          confidence: 1,
          provenance: [analysis.sourceId]
        });
        if (symbol.exported) {
          pushEdge({
            id: `${moduleId}->${symbol.id}:exports`,
            source: moduleId,
            target: symbol.id,
            relation: "exports",
            status: "extracted",
            evidenceClass: "extracted",
            confidence: 1,
            provenance: [analysis.sourceId]
          });
        }
      }
      const symbolIdsByName = new Map(analysis.code.symbols.map((symbol) => [symbol.name, symbol.id]));
      const goPackageLookup = analysis.code.language === "go" ? goPackageSymbolLookups.get(goPackageScopeKey(manifest, analysis) ?? "") : void 0;
      const localSymbolIdsByName = goPackageLookup?.byName ?? symbolIdsByName;
      const localGoMethodIdsByShortName = goPackageLookup?.uniqueMethodIdsByShortName ?? /* @__PURE__ */ new Map();
      const resolveLocalSymbolId = (targetName) => localSymbolIdsByName.get(targetName) ?? (analysis.code?.language === "go" ? localGoMethodIdsByShortName.get(targetName) : void 0);
      for (const relation of analysis.code.relations ?? []) {
        const targetId = resolveLocalSymbolId(relation.targetName);
        if (!targetId) {
          continue;
        }
        const sourceId = relation.sourceName ? resolveLocalSymbolId(relation.sourceName) ?? moduleId : moduleId;
        if (sourceId === targetId) {
          continue;
        }
        pushEdge({
          id: `${sourceId}->${targetId}:${relation.relation}:${slugify(relation.targetName)}`,
          source: sourceId,
          target: targetId,
          relation: relation.relation,
          status: "extracted",
          evidenceClass: "extracted",
          confidence: relation.confidence ?? 1,
          provenance: [analysis.sourceId]
        });
      }
      for (const rationale of analysis.rationales) {
        const targetSymbolId = rationale.symbolName ? symbolIdsByName.get(rationale.symbolName) : void 0;
        const targetId = targetSymbolId ?? moduleId;
        rationaleMap.set(rationale.id, {
          id: rationale.id,
          type: "rationale",
          label: truncate(rationale.text, 80),
          pageId: moduleId,
          freshness: "fresh",
          confidence: 1,
          sourceIds: [analysis.sourceId],
          projectIds: scopedProjectIdsFromSources([analysis.sourceId], sourceProjects),
          sourceClass: manifest.sourceClass,
          language: analysis.code.language,
          moduleId
        });
        pushEdge({
          id: `${rationale.id}->${targetId}:rationale_for`,
          source: rationale.id,
          target: targetId,
          relation: "rationale_for",
          status: "extracted",
          evidenceClass: "extracted",
          confidence: 1,
          provenance: [analysis.sourceId]
        });
      }
      const importedSymbolIdsByName = /* @__PURE__ */ new Map();
      for (const codeImport of analysis.code.imports.filter((item) => !item.isExternal)) {
        const targetSourceId = codeImport.resolvedSourceId;
        const targetAnalysis = targetSourceId ? analysesBySourceId.get(targetSourceId) : void 0;
        if (!targetSourceId || !targetAnalysis?.code) {
          continue;
        }
        if (codeImport.importedSymbols.length === 0) {
          for (const targetSymbol of targetAnalysis.code.symbols.filter((symbol) => symbol.exported)) {
            importedSymbolIdsByName.set(targetSymbol.name, targetSymbol.id);
          }
        }
        for (const importedSymbol of codeImport.importedSymbols) {
          const [rawExportedName, rawLocalName] = importedSymbol.split(/\s+as\s+/i);
          const exportedName = (rawExportedName ?? "").trim();
          const localName = (rawLocalName ?? rawExportedName ?? "").trim();
          if (!exportedName || !localName) {
            continue;
          }
          const targetSymbol = targetAnalysis.code.symbols.find((symbol) => symbol.name === exportedName && symbol.exported);
          if (targetSymbol) {
            importedSymbolIdsByName.set(localName, targetSymbol.id);
          }
        }
      }
      if (analysis.code.language === "go") {
        for (const symbol of analysis.code.symbols) {
          const separator = symbol.name.lastIndexOf(".");
          if (separator <= 0) {
            continue;
          }
          const receiverTypeId = localSymbolIdsByName.get(symbol.name.slice(0, separator));
          if (!receiverTypeId || receiverTypeId === symbol.id) {
            continue;
          }
          pushEdge({
            id: `${receiverTypeId}->${symbol.id}:defines:receiver`,
            source: receiverTypeId,
            target: symbol.id,
            relation: "defines",
            status: "extracted",
            evidenceClass: "extracted",
            confidence: 1,
            provenance: [analysis.sourceId]
          });
        }
      }
      for (const symbol of analysis.code.symbols) {
        for (const targetName of symbol.calls) {
          const localTargetId = resolveLocalSymbolId(targetName);
          if (localTargetId && localTargetId !== symbol.id) {
            pushEdge({
              id: `${symbol.id}->${localTargetId}:calls`,
              source: symbol.id,
              target: localTargetId,
              relation: "calls",
              status: "extracted",
              evidenceClass: "extracted",
              confidence: 1,
              provenance: [analysis.sourceId]
            });
            continue;
          }
          const crossFileTargetId = importedSymbolIdsByName.get(targetName);
          if (crossFileTargetId && crossFileTargetId !== symbol.id) {
            pushEdge({
              id: `${symbol.id}->${crossFileTargetId}:calls`,
              source: symbol.id,
              target: crossFileTargetId,
              relation: "calls",
              status: "inferred",
              evidenceClass: "inferred",
              confidence: 0.8,
              provenance: [analysis.sourceId]
            });
          }
        }
        for (const targetName of symbol.extends) {
          const targetId = resolveLocalSymbolId(targetName) ?? importedSymbolIdsByName.get(targetName);
          if (!targetId) {
            continue;
          }
          pushEdge({
            id: `${symbol.id}->${targetId}:extends`,
            source: symbol.id,
            target: targetId,
            relation: "extends",
            status: "extracted",
            evidenceClass: "extracted",
            confidence: 1,
            provenance: [analysis.sourceId]
          });
        }
        for (const targetName of symbol.implements) {
          const targetId = resolveLocalSymbolId(targetName) ?? importedSymbolIdsByName.get(targetName);
          if (!targetId) {
            continue;
          }
          pushEdge({
            id: `${symbol.id}->${targetId}:implements`,
            source: symbol.id,
            target: targetId,
            relation: "implements",
            status: "extracted",
            evidenceClass: "extracted",
            confidence: 1,
            provenance: [analysis.sourceId]
          });
        }
      }
      for (const codeImport of analysis.code.imports) {
        const targetSourceId = codeImport.resolvedSourceId;
        if (!targetSourceId) {
          continue;
        }
        const targetModuleId = `module:${targetSourceId}`;
        pushEdge({
          id: `${moduleId}->${targetModuleId}:${codeImport.reExport ? "exports" : "imports"}:${codeImport.specifier}`,
          source: moduleId,
          target: targetModuleId,
          relation: codeImport.reExport ? "exports" : "imports",
          status: "extracted",
          evidenceClass: "extracted",
          confidence: 1,
          provenance: [analysis.sourceId, targetSourceId]
        });
      }
    } else if (analysis.rationales.length) {
      const manifest = manifestsById.get(analysis.sourceId);
      if (manifest) {
        const sourceNodeId = `source:${analysis.sourceId}`;
        for (const rationale of analysis.rationales) {
          rationaleMap.set(rationale.id, {
            id: rationale.id,
            type: "rationale",
            label: truncate(rationale.text, 80),
            pageId: sourceNodeId,
            freshness: "fresh",
            confidence: 1,
            sourceIds: [analysis.sourceId],
            projectIds: scopedProjectIdsFromSources([analysis.sourceId], sourceProjects),
            sourceClass: manifest.sourceClass
          });
          pushEdge({
            id: `${rationale.id}->${sourceNodeId}:rationale_for`,
            source: rationale.id,
            target: sourceNodeId,
            relation: "rationale_for",
            status: "extracted",
            evidenceClass: "extracted",
            confidence: 1,
            provenance: [analysis.sourceId]
          });
        }
      }
    }
  }
  const conceptClaims = /* @__PURE__ */ new Map();
  for (const analysis of analyses) {
    for (const claim of analysis.claims) {
      for (const concept of analysis.concepts) {
        if (claim.text.toLowerCase().includes(concept.name.toLowerCase())) {
          const key = concept.id;
          const list = conceptClaims.get(key) ?? [];
          list.push({ claim, sourceId: analysis.sourceId });
          conceptClaims.set(key, list);
        }
      }
    }
  }
  const conflictEdgeKeys = /* @__PURE__ */ new Set();
  for (const [, claimsForConcept] of conceptClaims) {
    const positive = claimsForConcept.filter((item) => item.claim.polarity === "positive");
    const negative = claimsForConcept.filter((item) => item.claim.polarity === "negative");
    for (const positiveClaim of positive) {
      for (const negativeClaim of negative) {
        if (positiveClaim.sourceId === negativeClaim.sourceId) {
          continue;
        }
        const edgeKey = [positiveClaim.sourceId, negativeClaim.sourceId].sort().join("|");
        if (conflictEdgeKeys.has(edgeKey)) {
          continue;
        }
        conflictEdgeKeys.add(edgeKey);
        pushEdge({
          id: `conflict:${positiveClaim.claim.id}->${negativeClaim.claim.id}`,
          source: `source:${positiveClaim.sourceId}`,
          target: `source:${negativeClaim.sourceId}`,
          relation: "conflicted_with",
          status: "conflicted",
          evidenceClass: "ambiguous",
          confidence: conflictConfidence(positiveClaim.claim, negativeClaim.claim),
          provenance: [positiveClaim.sourceId, negativeClaim.sourceId]
        });
      }
    }
  }
  const memoryElements = buildMemoryGraphElements(memoryTasks, pages);
  const graphNodes = [
    ...sourceNodes,
    ...moduleMap.values(),
    ...symbolMap.values(),
    ...rationaleMap.values(),
    ...conceptMap.values(),
    ...entityMap.values(),
    ...memoryElements.nodes
  ];
  const repoDefaults = resolveLargeRepoDefaults({
    nodeCount: graphNodes.length,
    config: options?.config
  });
  const enriched = enrichGraph(
    {
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      nodes: graphNodes,
      edges: [...edges, ...memoryElements.edges],
      communities: [],
      sources: manifests,
      pages
    },
    manifests,
    analyses,
    [],
    {
      similarityIdfFloor: repoDefaults.similarityIdfFloor,
      similarityEdgeCap: repoDefaults.similarityEdgeCap
    }
  );
  const metrics = deriveGraphMetrics(graphNodes, enriched.edges, { resolution: options?.communityResolution });
  const finalNodes = applyNormLabel(metrics.nodes);
  const finalEdges = pruneDanglingEdges(finalNodes, enriched.edges);
  const finalHyperedges = (enriched.hyperedges ?? []).filter((hyperedge) => {
    const nodeIdSet = new Set(finalNodes.map((node) => node.id));
    return hyperedge.nodeIds.every((id) => nodeIdSet.has(id));
  });
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    nodes: finalNodes,
    edges: finalEdges,
    hyperedges: finalHyperedges,
    communities: metrics.communities,
    sources: manifests,
    pages
  };
}
function recentResearchSourcePages(graph, previousCompiledAt) {
  const previousTimestamp = previousCompiledAt ? Date.parse(previousCompiledAt) : Number.NaN;
  return graph.pages.filter(
    (page) => page.kind === "source" && Boolean(page.sourceType) && page.sourceType !== "url"
  ).filter((page) => Number.isNaN(previousTimestamp) || Date.parse(page.updatedAt) > previousTimestamp).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.title.localeCompare(right.title)).slice(0, 8).map((page) => ({
    id: page.id,
    path: page.path,
    title: page.title,
    updatedAt: page.updatedAt,
    sourceType: page.sourceType
  }));
}
async function buildGraphOrientationPages(graph, paths, schemaHash, previousCompiledAt, contradictions = [], config) {
  const benchmark = await readJsonFile(paths.benchmarkPath);
  const communityRecords = [];
  for (const community of graph.communities ?? []) {
    const absolutePath = path23.join(paths.wikiDir, "graph", "communities", `${community.id.replace(/^community:/, "")}.md`);
    communityRecords.push(
      await buildManagedGraphPage(
        absolutePath,
        {
          managedBy: "system",
          compiledFrom: uniqueStrings4(
            community.nodeIds.flatMap((nodeId) => graph.nodes.find((node) => node.id === nodeId)?.sourceIds ?? [])
          ),
          confidence: 1
        },
        (metadata) => buildCommunitySummaryPage({
          graph,
          community,
          schemaHash,
          metadata
        })
      )
    );
  }
  const report = buildGraphReportArtifact({
    graph,
    communityPages: communityRecords.map((record) => record.page),
    benchmark,
    benchmarkStale: benchmark ? benchmark.graphHash !== graphHash(graph) : false,
    recentResearchSources: recentResearchSourcePages(graph, previousCompiledAt),
    graphHash: graphHash(graph),
    contradictions,
    config
  });
  const reportAbsolutePath = path23.join(paths.wikiDir, "graph", "report.md");
  const reportRecord = await buildManagedGraphPage(
    reportAbsolutePath,
    {
      managedBy: "system",
      compiledFrom: uniqueStrings4(graph.pages.flatMap((page) => page.sourceIds)),
      confidence: 1
    },
    (metadata) => buildGraphReportPage({
      graph,
      schemaHash,
      metadata,
      report
    })
  );
  const shareArtifact = buildGraphShareArtifact({
    graph,
    report,
    vaultName: path23.basename(paths.rootDir)
  });
  const shareRecord = await buildManagedGraphPage(
    path23.join(paths.wikiDir, "graph", "share-card.md"),
    {
      managedBy: "system",
      compiledFrom: uniqueStrings4(graph.pages.flatMap((page) => page.sourceIds)),
      confidence: 1
    },
    (metadata) => buildGraphSharePage({
      graph,
      schemaHash,
      metadata,
      artifact: shareArtifact,
      report,
      vaultName: path23.basename(paths.rootDir)
    })
  );
  return {
    records: [reportRecord, shareRecord, ...communityRecords],
    report,
    shareSvg: renderGraphShareSvg(shareArtifact),
    shareBundleFiles: renderGraphShareBundleFiles(shareArtifact)
  };
}
async function writePage(wikiDir, relativePath, content, changedPages) {
  const absolutePath = path23.resolve(wikiDir, relativePath);
  const changed = await writeFileIfChanged(absolutePath, content);
  if (changed) {
    changedPages.push(relativePath);
  }
}
async function writeGraphShareBundle(wikiDir, files) {
  for (const file of files) {
    await writeFileIfChanged(path23.join(wikiDir, "graph", "share-kit", file.relativePath), file.content);
  }
}
function aggregateItems(analyses, kind) {
  const grouped = /* @__PURE__ */ new Map();
  for (const analysis of analyses) {
    for (const item of analysis[kind]) {
      const key = slugify(item.name);
      const existing = grouped.get(key) ?? {
        name: item.name,
        descriptions: [],
        sourceAnalyses: [],
        sourceHashes: {},
        sourceSemanticHashes: {}
      };
      existing.descriptions.push(item.description);
      existing.sourceAnalyses.push(analysis);
      existing.sourceHashes[analysis.sourceId] = analysis.sourceHash;
      existing.sourceSemanticHashes[analysis.sourceId] = analysis.semanticHash;
      grouped.set(key, existing);
    }
  }
  return [...grouped.values()];
}
function emptyGraphPage(input) {
  return {
    id: input.id,
    path: input.path,
    title: input.title,
    kind: input.kind,
    sourceClass: input.sourceClass,
    sourceIds: input.sourceIds,
    projectIds: input.projectIds ?? [],
    nodeIds: input.nodeIds,
    freshness: "fresh",
    status: input.status ?? "active",
    confidence: input.confidence,
    backlinks: [],
    schemaHash: input.schemaHash,
    sourceHashes: input.sourceHashes,
    sourceSemanticHashes: input.sourceSemanticHashes ?? {},
    relatedPageIds: [],
    relatedNodeIds: [],
    relatedSourceIds: [],
    createdAt: input.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: input.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    compiledFrom: input.compiledFrom ?? input.sourceIds,
    managedBy: input.managedBy ?? "system"
  };
}
function recordsEqual(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  return leftKeys.every((key) => left[key] === right[key]);
}
async function requiredCompileArtifactsExist(paths) {
  const requiredPaths = [
    paths.graphPath,
    paths.codeIndexPath,
    paths.searchDbPath,
    path23.join(paths.wikiDir, "index.md"),
    path23.join(paths.wikiDir, "sources", "index.md"),
    path23.join(paths.wikiDir, "code", "index.md"),
    path23.join(paths.wikiDir, "concepts", "index.md"),
    path23.join(paths.wikiDir, "entities", "index.md"),
    path23.join(paths.wikiDir, "outputs", "index.md"),
    path23.join(paths.wikiDir, "projects", "index.md"),
    path23.join(paths.wikiDir, "candidates", "index.md")
  ];
  const checks = await Promise.all(requiredPaths.map((filePath) => fileExists(filePath)));
  return checks.every(Boolean);
}
async function loadAvailableCachedAnalyses(paths, manifests) {
  const analyses = await Promise.all(
    manifests.map(async (manifest) => readJsonFile(path23.join(paths.analysesDir, `${manifest.sourceId}.json`)))
  );
  return analyses.filter((analysis) => Boolean(analysis));
}
function approvalManifestPath(paths, approvalId) {
  return path23.join(paths.approvalsDir, approvalId, "manifest.json");
}
function approvalGraphPath(paths, approvalId) {
  return path23.join(paths.approvalsDir, approvalId, "state", "graph.json");
}
function normalizeApprovalBundleType(raw) {
  if (!raw) return void 0;
  const legacy = {
    generated_output: "generated-output",
    source_review: "source-review",
    guided_source: "guided-source",
    guided_session: "guided-session"
  };
  return legacy[raw] ?? raw;
}
async function readApprovalManifest(paths, approvalId) {
  const manifest = await readJsonFile(approvalManifestPath(paths, approvalId));
  if (!manifest) {
    throw new Error(`Approval bundle not found: ${approvalId}`);
  }
  manifest.bundleType = normalizeApprovalBundleType(manifest.bundleType);
  return manifest;
}
async function writeApprovalManifest(paths, manifest) {
  await fs18.writeFile(approvalManifestPath(paths, manifest.approvalId), `${JSON.stringify(manifest, null, 2)}
`, "utf8");
}
async function buildApprovalEntries(paths, changedFiles, deletedPaths, previousGraph, graph, labelsByPath = /* @__PURE__ */ new Map()) {
  const previousPagesById = new Map((previousGraph?.pages ?? []).map((page) => [page.id, page]));
  const previousPagesByPath = new Map((previousGraph?.pages ?? []).map((page) => [page.path, page]));
  const nextPagesByPath = new Map(graph.pages.map((page) => [page.path, page]));
  const handledDeletedPaths = /* @__PURE__ */ new Set();
  const entries = [];
  for (const file of changedFiles.sort((left, right) => left.relativePath.localeCompare(right.relativePath))) {
    const nextPage = nextPagesByPath.get(file.relativePath);
    if (!nextPage) {
      continue;
    }
    const previousPage = previousPagesById.get(nextPage.id);
    const currentExists = await fileExists(path23.join(paths.wikiDir, file.relativePath));
    if (previousPage && previousPage.path !== nextPage.path) {
      entries.push({
        pageId: nextPage.id,
        title: nextPage.title,
        kind: nextPage.kind,
        changeType: "promote",
        status: "pending",
        sourceIds: nextPage.sourceIds,
        nextPath: nextPage.path,
        previousPath: previousPage.path,
        label: labelsByPath.get(nextPage.path) ?? labelsByPath.get(previousPage.path)
      });
      handledDeletedPaths.add(previousPage.path);
      continue;
    }
    entries.push({
      pageId: nextPage.id,
      title: nextPage.title,
      kind: nextPage.kind,
      changeType: previousPage || currentExists ? "update" : "create",
      status: "pending",
      sourceIds: nextPage.sourceIds,
      nextPath: nextPage.path,
      previousPath: previousPage?.path,
      label: labelsByPath.get(nextPage.path) ?? (previousPage?.path ? labelsByPath.get(previousPage.path) : void 0)
    });
  }
  for (const deletedPath of deletedPaths.sort((left, right) => left.localeCompare(right))) {
    if (handledDeletedPaths.has(deletedPath)) {
      continue;
    }
    const previousPage = previousPagesByPath.get(deletedPath);
    entries.push({
      pageId: previousPage?.id ?? `page:${slugify(deletedPath)}`,
      title: previousPage?.title ?? path23.basename(deletedPath, ".md"),
      kind: previousPage?.kind ?? "index",
      changeType: "delete",
      status: "pending",
      sourceIds: previousPage?.sourceIds ?? [],
      previousPath: deletedPath,
      label: labelsByPath.get(deletedPath)
    });
  }
  return uniqueBy(entries, (entry) => `${entry.pageId}:${entry.changeType}:${entry.nextPath ?? ""}:${entry.previousPath ?? ""}`);
}
async function stageApprovalBundle(paths, changedFiles, deletedPaths, previousGraph, graph) {
  const approvalId = `compile-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`;
  const approvalDir = path23.join(paths.approvalsDir, approvalId);
  await ensureDir(approvalDir);
  await ensureDir(path23.join(approvalDir, "wiki"));
  await ensureDir(path23.join(approvalDir, "state"));
  for (const file of changedFiles) {
    const targetPath = path23.join(approvalDir, "wiki", file.relativePath);
    await ensureDir(path23.dirname(targetPath));
    await fs18.writeFile(targetPath, file.content, "utf8");
  }
  await fs18.writeFile(path23.join(approvalDir, "state", "graph.json"), JSON.stringify(graph, null, 2), "utf8");
  await writeApprovalManifest(paths, {
    approvalId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    bundleType: "compile",
    title: "Compile Approval",
    entries: await buildApprovalEntries(paths, changedFiles, deletedPaths, previousGraph, graph)
  });
  return { approvalId, approvalDir };
}
async function syncVaultArtifacts(rootDir, input) {
  const { config, paths } = await loadVaultConfig(rootDir);
  const previousGraph = await readJsonFile(paths.graphPath);
  const globalSchemaHash = input.schemas.effective.global.hash;
  const changedPages = [];
  const promotedPageIds = [];
  const candidateHistory = {};
  const records = [];
  const promoteCandidates = input.promoteCandidates ?? true;
  for (const manifest of input.manifests) {
    const analysis = input.analyses.find((item) => item.sourceId === manifest.sourceId);
    if (!analysis) {
      continue;
    }
    const sourceProjectIds = scopedProjectIdsFromSources([manifest.sourceId], input.sourceProjects);
    const sourceSchemaHash = effectiveHashForProject(input.schemas, sourceProjectIds[0] ?? null);
    const sourceCategoryTags = categoryTagsForSchema(getEffectiveSchema(input.schemas, sourceProjectIds[0] ?? null), [
      analysis.title,
      analysis.summary,
      ...analysis.concepts.map((item) => item.description),
      ...analysis.entities.map((item) => item.description)
    ]);
    const modulePreview = analysis.code ? emptyGraphPage({
      id: analysis.code.moduleId,
      path: `code/${manifest.sourceId}.md`,
      title: modulePageTitle(manifest),
      kind: "module",
      sourceIds: [manifest.sourceId],
      sourceClass: manifest.sourceClass,
      projectIds: sourceProjectIds,
      nodeIds: [analysis.code.moduleId, ...analysis.code.symbols.map((symbol) => symbol.id)],
      schemaHash: sourceSchemaHash,
      sourceHashes: { [manifest.sourceId]: manifest.contentHash },
      sourceSemanticHashes: { [manifest.sourceId]: manifest.semanticHash },
      confidence: 1
    }) : null;
    const preview = emptyGraphPage({
      id: `source:${manifest.sourceId}`,
      path: `sources/${manifest.sourceId}.md`,
      title: analysis.title,
      kind: "source",
      sourceIds: [manifest.sourceId],
      sourceClass: manifest.sourceClass,
      projectIds: sourceProjectIds,
      nodeIds: [
        `source:${manifest.sourceId}`,
        ...analysis.concepts.map((item) => item.id),
        ...analysis.entities.map((item) => item.id),
        ...analysis.code ? [analysis.code.moduleId, ...analysis.code.symbols.map((symbol) => symbol.id)] : []
      ],
      schemaHash: sourceSchemaHash,
      sourceHashes: { [manifest.sourceId]: manifest.contentHash },
      sourceSemanticHashes: { [manifest.sourceId]: manifest.semanticHash },
      confidence: 1
    });
    const sourceRecord = await buildManagedGraphPage(
      path23.join(paths.wikiDir, preview.path),
      {
        managedBy: "system",
        confidence: 1,
        compiledFrom: [manifest.sourceId]
      },
      (metadata, existingContent) => buildSourcePage(
        manifest,
        analysis,
        sourceSchemaHash,
        metadata,
        relatedOutputsForPage(preview, input.outputPages),
        modulePreview ?? void 0,
        {
          projectIds: sourceProjectIds,
          extraTags: [...sourceCategoryTags, ...analysis.tags ?? []],
          sourceClass: manifest.sourceClass
        },
        existingContent
      )
    );
    records.push(sourceRecord);
    if (modulePreview && analysis.code) {
      const localModules = analysis.code.imports.map((codeImport) => {
        const resolvedSourceId = codeImport.resolvedSourceId;
        if (!resolvedSourceId) {
          return null;
        }
        const targetManifest = input.manifests.find((item) => item.sourceId === resolvedSourceId);
        if (!targetManifest) {
          return null;
        }
        return {
          specifier: codeImport.specifier,
          sourceId: resolvedSourceId,
          reExport: codeImport.reExport,
          page: {
            id: `module:${resolvedSourceId}`,
            path: `code/${resolvedSourceId}.md`,
            title: modulePageTitle(targetManifest)
          }
        };
      }).filter(
        (item) => Boolean(item)
      );
      records.push(
        await buildManagedGraphPage(
          path23.join(paths.wikiDir, modulePreview.path),
          {
            managedBy: "system",
            confidence: 1,
            compiledFrom: [manifest.sourceId]
          },
          (metadata) => buildModulePage({
            manifest,
            analysis,
            schemaHash: sourceSchemaHash,
            metadata,
            sourcePage: sourceRecord.page,
            localModules,
            relatedOutputs: relatedOutputsForPage(modulePreview, input.outputPages),
            projectIds: sourceProjectIds,
            extraTags: [...sourceCategoryTags, ...analysis.tags ?? []]
          })
        )
      );
    }
  }
  for (const kind of ["concepts", "entities"]) {
    for (const aggregate of aggregateItems(input.analyses, kind)) {
      const itemKind = kind === "concepts" ? "concept" : "entity";
      const slug = slugify(aggregate.name);
      const pageId = `${itemKind}:${slug}`;
      const sourceIds = uniqueStrings4(aggregate.sourceAnalyses.map((item) => item.sourceId));
      const projectIds = scopedProjectIdsFromSources(sourceIds, input.sourceProjects);
      const schemaHash = effectiveHashForProject(input.schemas, projectIds[0] ?? null);
      const previousEntry = input.previousState?.candidateHistory?.[pageId];
      const promoted = previousEntry?.status === "active" || promoteCandidates && shouldPromoteCandidate(previousEntry, sourceIds);
      const relativePath = promoted ? activeAggregatePath(itemKind, slug) : candidatePagePathFor(itemKind, slug);
      const aggregateSourceClass2 = aggregateManifestSourceClass(input.manifests, sourceIds);
      const fallbackPaths = [
        path23.join(paths.wikiDir, activeAggregatePath(itemKind, slug)),
        path23.join(paths.wikiDir, candidatePagePathFor(itemKind, slug))
      ];
      const confidence = nodeConfidence(aggregate.sourceAnalyses.length);
      const preview = emptyGraphPage({
        id: pageId,
        path: relativePath,
        title: aggregate.name,
        kind: itemKind,
        sourceIds,
        sourceClass: aggregateSourceClass2,
        projectIds,
        nodeIds: [pageId],
        schemaHash,
        sourceHashes: aggregate.sourceHashes,
        confidence,
        status: promoted ? "active" : "candidate"
      });
      const pageRecord = await buildManagedGraphPage(
        path23.join(paths.wikiDir, relativePath),
        {
          status: promoted ? "active" : "candidate",
          managedBy: "system",
          confidence,
          compiledFrom: sourceIds,
          statePathCandidates: fallbackPaths
        },
        (metadata, existingContent) => buildAggregatePage(
          itemKind,
          aggregate.name,
          aggregate.descriptions,
          aggregate.sourceAnalyses,
          aggregate.sourceHashes,
          aggregate.sourceSemanticHashes,
          schemaHash,
          metadata,
          relativePath,
          relatedOutputsForPage(preview, input.outputPages),
          {
            projectIds,
            extraTags: categoryTagsForSchema(getEffectiveSchema(input.schemas, projectIds[0] ?? null), [
              aggregate.name,
              ...aggregate.descriptions,
              ...aggregate.sourceAnalyses.map((item) => item.summary)
            ]),
            sourceClass: aggregateSourceClass2
          },
          existingContent
        )
      );
      if (promoted && previousEntry?.status === "candidate") {
        promotedPageIds.push(pageId);
      }
      candidateHistory[pageId] = {
        sourceIds,
        status: promoted ? "active" : "candidate"
      };
      records.push(pageRecord);
    }
  }
  const compiledPages = records.map((record) => record.page);
  const basePages = [...compiledPages, ...input.outputPages, ...input.insightPages, ...input.memoryRecords.map((record) => record.page)];
  records.push(...input.memoryRecords);
  const structuralGraph = buildGraph(input.manifests, input.analyses, basePages, input.sourceProjects, input.codeIndex, input.memoryTasks, {
    communityResolution: config.graph?.communityResolution,
    config
  });
  const contradictions = detectContradictions(input.analyses);
  for (const contradiction of contradictions) {
    const edgeId = `contradiction:${contradiction.sourceIdA}->${contradiction.sourceIdB}`;
    if (!structuralGraph.edges.some((e) => e.id === edgeId)) {
      structuralGraph.edges.push({
        id: edgeId,
        source: `source:${contradiction.sourceIdA}`,
        target: `source:${contradiction.sourceIdB}`,
        relation: "contradicts",
        status: "conflicted",
        evidenceClass: "ambiguous",
        confidence: Math.abs(contradiction.claimA.confidence - contradiction.claimB.confidence),
        provenance: [contradiction.sourceIdA, contradiction.sourceIdB]
      });
    }
  }
  const embeddingEdges = await embeddingSimilarityEdges(rootDir, structuralGraph).catch(() => []);
  const baseGraph = embeddingEdges.length > 0 ? (() => {
    const edges = uniqueBy([...structuralGraph.edges, ...embeddingEdges], (edge) => edge.id).sort(
      (left, right) => left.id.localeCompare(right.id)
    );
    const metrics = deriveGraphMetrics(resetGraphNodeMetrics(structuralGraph.nodes), edges, {
      resolution: config.graph?.communityResolution
    });
    return {
      ...structuralGraph,
      nodes: metrics.nodes,
      edges,
      communities: metrics.communities
    };
  })() : structuralGraph;
  const graphOrientation = await buildGraphOrientationPages(
    baseGraph,
    paths,
    globalSchemaHash,
    input.previousState?.generatedAt,
    contradictions,
    config
  );
  const preliminaryPages = [...basePages, ...graphOrientation.records.map((record) => record.page)];
  const dashboardRecords = await buildDashboardRecords(
    config,
    paths,
    {
      ...baseGraph,
      sources: input.manifests,
      pages: preliminaryPages
    },
    globalSchemaHash,
    graphOrientation.report
  );
  records.push(...graphOrientation.records, ...dashboardRecords);
  const allPages = uniqueBy([...preliminaryPages, ...dashboardRecords.map((record) => record.page)], (page) => page.id);
  const graph = {
    ...baseGraph,
    pages: allPages
  };
  const activeConceptPages = allPages.filter((page) => page.kind === "concept" && page.status !== "candidate");
  const activeEntityPages = allPages.filter((page) => page.kind === "entity" && page.status !== "candidate");
  const modulePages = allPages.filter((page) => page.kind === "module");
  const candidatePages = allPages.filter((page) => page.status === "candidate");
  const configuredProjects = projectEntries(config);
  const projectIndexRefs = configuredProjects.map(
    (project) => emptyGraphPage({
      id: `project:${project.id}:index`,
      path: `projects/${project.id}/index.md`,
      title: `Project: ${project.id}`,
      kind: "index",
      sourceIds: [],
      projectIds: [project.id],
      nodeIds: [],
      schemaHash: effectiveHashForProject(input.schemas, project.id),
      sourceHashes: {},
      confidence: 1
    })
  );
  records.push({
    page: emptyGraphPage({
      id: "projects:index",
      path: "projects/index.md",
      title: "Projects",
      kind: "index",
      sourceIds: [],
      projectIds: [],
      nodeIds: [],
      schemaHash: globalSchemaHash,
      sourceHashes: {},
      confidence: 1
    }),
    content: await buildManagedContent(
      path23.join(paths.wikiDir, "projects", "index.md"),
      {
        managedBy: "system",
        compiledFrom: indexCompiledFrom(projectIndexRefs)
      },
      (metadata) => buildProjectsIndex(projectIndexRefs, globalSchemaHash, metadata)
    )
  });
  for (const project of configuredProjects) {
    const projectIndexRef = projectIndexRefs.find((page) => page.projectIds.includes(project.id));
    if (!projectIndexRef) {
      continue;
    }
    const sections = {
      sources: allPages.filter((page) => page.kind === "source" && page.projectIds.includes(project.id)),
      code: allPages.filter((page) => page.kind === "module" && page.projectIds.includes(project.id)),
      concepts: allPages.filter((page) => page.kind === "concept" && page.status !== "candidate" && page.projectIds.includes(project.id)),
      entities: allPages.filter((page) => page.kind === "entity" && page.status !== "candidate" && page.projectIds.includes(project.id)),
      outputs: allPages.filter((page) => page.kind === "output" && page.projectIds.includes(project.id)),
      candidates: allPages.filter((page) => page.status === "candidate" && page.projectIds.includes(project.id))
    };
    records.push({
      page: projectIndexRef,
      content: await buildManagedContent(
        path23.join(paths.wikiDir, projectIndexRef.path),
        {
          managedBy: "system",
          compiledFrom: indexCompiledFrom(Object.values(sections).flat())
        },
        (metadata) => buildProjectIndex({
          projectId: project.id,
          schemaHash: effectiveHashForProject(input.schemas, project.id),
          metadata,
          sections
        })
      )
    });
  }
  records.push({
    page: emptyGraphPage({
      id: "index",
      path: "index.md",
      title: "SwarmVault Index",
      kind: "index",
      sourceIds: [],
      projectIds: [],
      nodeIds: [],
      schemaHash: globalSchemaHash,
      sourceHashes: {},
      confidence: 1
    }),
    content: await buildManagedContent(
      path23.join(paths.wikiDir, "index.md"),
      {
        managedBy: "system",
        compiledFrom: indexCompiledFrom(allPages)
      },
      (metadata) => buildIndexPage(allPages, globalSchemaHash, metadata, projectIndexRefs)
    )
  });
  for (const [relativePath, kind, pages] of [
    ["sources/index.md", "sources", allPages.filter((page) => page.kind === "source")],
    ["code/index.md", "code", modulePages],
    ["concepts/index.md", "concepts", activeConceptPages],
    ["entities/index.md", "entities", activeEntityPages],
    ["outputs/index.md", "outputs", allPages.filter((page) => page.kind === "output")],
    ["memory/index.md", "memory", allPages.filter((page) => page.kind === "memory_task")],
    [
      "dashboards/index.md",
      "dashboards",
      allPages.filter((page) => page.kind === "index" && page.path.startsWith("dashboards/") && page.path !== "dashboards/index.md")
    ],
    ["candidates/index.md", "candidates", candidatePages],
    ["graph/index.md", "graph", allPages.filter((page) => page.kind === "graph_report" || page.kind === "community_summary")]
  ]) {
    records.push({
      page: emptyGraphPage({
        id: `${kind}:index`,
        path: relativePath,
        title: kind,
        kind: "index",
        sourceIds: [],
        projectIds: [],
        nodeIds: [],
        schemaHash: globalSchemaHash,
        sourceHashes: {},
        confidence: 1
      }),
      content: await buildManagedContent(
        path23.join(paths.wikiDir, relativePath),
        {
          managedBy: "system",
          compiledFrom: indexCompiledFrom(pages)
        },
        (metadata) => buildSectionIndex(kind, pages, globalSchemaHash, metadata)
      )
    });
  }
  const nextPagePaths = new Set(records.map((record) => record.page.path));
  const obsoleteGraphPaths = (previousGraph?.pages ?? []).filter((page) => page.kind !== "output" && page.kind !== "insight").map((page) => page.path).filter((relativePath) => !nextPagePaths.has(relativePath));
  const existingProjectIndexPaths = (await listFilesRecursive(paths.projectsDir)).filter((absolutePath) => absolutePath.endsWith(".md")).map((absolutePath) => toPosix(path23.relative(paths.wikiDir, absolutePath))).filter((relativePath) => !nextPagePaths.has(relativePath));
  const obsoletePaths = uniqueStrings4([...obsoleteGraphPaths, ...existingProjectIndexPaths]);
  const changedFiles = [];
  for (const record of records) {
    const absolutePath = path23.join(paths.wikiDir, record.page.path);
    const current = await fileExists(absolutePath) ? await fs18.readFile(absolutePath, "utf8") : null;
    if (current !== record.content) {
      changedPages.push(record.page.path);
      changedFiles.push({ relativePath: record.page.path, content: record.content });
    }
  }
  changedPages.push(...obsoletePaths.filter((relativePath) => !changedPages.includes(relativePath)));
  if (input.approve) {
    const approval = await stageApprovalBundle(paths, changedFiles, obsoletePaths, previousGraph ?? null, graph);
    return {
      graph,
      allPages,
      changedPages,
      promotedPageIds,
      candidatePageCount: candidatePages.length,
      staged: true,
      approvalId: approval.approvalId,
      approvalDir: approval.approvalDir
    };
  }
  const writeChanges = [];
  for (const record of records) {
    await writePage(paths.wikiDir, record.page.path, record.content, writeChanges);
  }
  for (const relativePath of obsoletePaths) {
    await fs18.rm(path23.join(paths.wikiDir, relativePath), { force: true });
  }
  await writeJsonFile(paths.graphPath, graph);
  await writeJsonFile(path23.join(paths.wikiDir, "graph", "report.json"), graphOrientation.report);
  await writeFileIfChanged(path23.join(paths.wikiDir, "graph", "share-card.svg"), graphOrientation.shareSvg);
  await writeGraphShareBundle(paths.wikiDir, graphOrientation.shareBundleFiles);
  await writeJsonFile(paths.codeIndexPath, input.codeIndex);
  await writeJsonFile(paths.compileStatePath, {
    generatedAt: graph.generatedAt,
    rootSchemaHash: input.schemas.root.hash,
    projectSchemaHashes: Object.fromEntries(
      Object.keys(input.schemas.projects).sort((left, right) => left.localeCompare(right)).map((projectId) => [projectId, input.schemas.projects[projectId]?.hash ?? ""])
    ),
    effectiveSchemaHashes: {
      global: input.schemas.effective.global.hash,
      projects: Object.fromEntries(
        Object.keys(input.schemas.effective.projects).sort((left, right) => left.localeCompare(right)).map((projectId) => [projectId, input.schemas.effective.projects[projectId]?.hash ?? input.schemas.effective.global.hash])
      )
    },
    projectConfigHash: projectConfigHash(config),
    analyses: Object.fromEntries(input.analyses.map((analysis) => [analysis.sourceId, analysisSignature(analysis)])),
    sourceHashes: Object.fromEntries(input.manifests.map((manifest) => [manifest.sourceId, manifest.contentHash])),
    sourceSemanticHashes: Object.fromEntries(input.manifests.map((manifest) => [manifest.sourceId, manifest.semanticHash])),
    sourceProjects: input.sourceProjects,
    outputHashes: input.outputHashes,
    insightHashes: input.insightHashes,
    memoryHashes: input.memoryHashes,
    candidateHistory
  });
  await rebuildSearchIndex(paths.searchDbPath, allPages, paths.wikiDir);
  await writeRetrievalManifest(rootDir, graph);
  return {
    graph,
    allPages,
    changedPages: uniqueStrings4([...changedPages, ...writeChanges]),
    promotedPageIds,
    candidatePageCount: candidatePages.length,
    staged: false
  };
}
async function refreshIndexesAndSearch(rootDir, pages) {
  const { config, paths } = await loadVaultConfig(rootDir);
  const schemas = await loadVaultSchemas(rootDir);
  const compileState = await readJsonFile(paths.compileStatePath);
  const globalSchemaHash = schemas.effective.global.hash;
  const currentGraph = await readJsonFile(paths.graphPath);
  const orientationPages = uniqueBy(
    pages.filter((page) => page.kind !== "graph_report" && page.kind !== "community_summary"),
    (page) => page.id
  );
  const basePages = uniqueBy(
    pages.filter(
      (page) => page.kind !== "graph_report" && page.kind !== "community_summary" && !(page.kind === "index" && page.path.startsWith("dashboards/"))
    ),
    (page) => page.id
  );
  const graphOrientation = currentGraph ? await buildGraphOrientationPages(
    {
      ...currentGraph,
      pages: orientationPages
    },
    paths,
    globalSchemaHash,
    compileState?.generatedAt,
    [],
    config
  ) : { records: [], report: null, shareSvg: "", shareBundleFiles: [] };
  const dashboardRecords = currentGraph ? await buildDashboardRecords(
    config,
    paths,
    {
      ...currentGraph,
      pages: [...basePages, ...graphOrientation.records.map((record) => record.page)]
    },
    globalSchemaHash,
    graphOrientation.report
  ) : [];
  const pagesWithGraph = sortGraphPages(
    uniqueBy(
      [...basePages, ...graphOrientation.records.map((record) => record.page), ...dashboardRecords.map((record) => record.page)],
      (page) => page.id
    )
  );
  if (currentGraph) {
    await writeJsonFile(paths.graphPath, {
      ...currentGraph,
      pages: pagesWithGraph
    });
  }
  const configuredProjects = projectEntries(config);
  const projectIndexRefs = configuredProjects.map(
    (project) => emptyGraphPage({
      id: `project:${project.id}:index`,
      path: `projects/${project.id}/index.md`,
      title: `Project: ${project.id}`,
      kind: "index",
      sourceIds: [],
      projectIds: [project.id],
      nodeIds: [],
      schemaHash: effectiveHashForProject(schemas, project.id),
      sourceHashes: {},
      confidence: 1
    })
  );
  await Promise.all([
    ensureDir(path23.join(paths.wikiDir, "sources")),
    ensureDir(path23.join(paths.wikiDir, "code")),
    ensureDir(path23.join(paths.wikiDir, "concepts")),
    ensureDir(path23.join(paths.wikiDir, "entities")),
    ensureDir(path23.join(paths.wikiDir, "outputs")),
    ensureDir(path23.join(paths.wikiDir, "dashboards")),
    ensureDir(path23.join(paths.wikiDir, "graph")),
    ensureDir(path23.join(paths.wikiDir, "graph", "communities")),
    ensureDir(path23.join(paths.wikiDir, "projects")),
    ensureDir(path23.join(paths.wikiDir, "candidates"))
  ]);
  const projectsIndexPath = path23.join(paths.wikiDir, "projects", "index.md");
  await writeFileIfChanged(
    projectsIndexPath,
    await buildManagedContent(
      projectsIndexPath,
      {
        managedBy: "system",
        compiledFrom: indexCompiledFrom(projectIndexRefs)
      },
      (metadata) => buildProjectsIndex(projectIndexRefs, globalSchemaHash, metadata)
    )
  );
  for (const project of configuredProjects) {
    const sections = {
      sources: pages.filter((page) => page.kind === "source" && page.projectIds.includes(project.id)),
      code: pages.filter((page) => page.kind === "module" && page.projectIds.includes(project.id)),
      concepts: pages.filter((page) => page.kind === "concept" && page.status !== "candidate" && page.projectIds.includes(project.id)),
      entities: pages.filter((page) => page.kind === "entity" && page.status !== "candidate" && page.projectIds.includes(project.id)),
      outputs: pages.filter((page) => page.kind === "output" && page.projectIds.includes(project.id)),
      candidates: pages.filter((page) => page.status === "candidate" && page.projectIds.includes(project.id))
    };
    const absolutePath = path23.join(paths.wikiDir, "projects", project.id, "index.md");
    await writeFileIfChanged(
      absolutePath,
      await buildManagedContent(
        absolutePath,
        {
          managedBy: "system",
          compiledFrom: indexCompiledFrom(Object.values(sections).flat())
        },
        (metadata) => buildProjectIndex({
          projectId: project.id,
          schemaHash: effectiveHashForProject(schemas, project.id),
          metadata,
          sections
        })
      )
    );
  }
  const rootIndexPath = path23.join(paths.wikiDir, "index.md");
  await writeFileIfChanged(
    rootIndexPath,
    await buildManagedContent(
      rootIndexPath,
      {
        managedBy: "system",
        compiledFrom: indexCompiledFrom(pagesWithGraph)
      },
      (metadata) => buildIndexPage(pagesWithGraph, globalSchemaHash, metadata, projectIndexRefs)
    )
  );
  for (const [relativePath, kind, sectionPages] of [
    ["sources/index.md", "sources", pagesWithGraph.filter((page) => page.kind === "source")],
    ["code/index.md", "code", pagesWithGraph.filter((page) => page.kind === "module")],
    ["concepts/index.md", "concepts", pagesWithGraph.filter((page) => page.kind === "concept" && page.status !== "candidate")],
    ["entities/index.md", "entities", pagesWithGraph.filter((page) => page.kind === "entity" && page.status !== "candidate")],
    ["outputs/index.md", "outputs", pagesWithGraph.filter((page) => page.kind === "output")],
    [
      "dashboards/index.md",
      "dashboards",
      pagesWithGraph.filter((page) => page.kind === "index" && page.path.startsWith("dashboards/") && page.path !== "dashboards/index.md")
    ],
    ["candidates/index.md", "candidates", pagesWithGraph.filter((page) => page.status === "candidate")],
    ["graph/index.md", "graph", pagesWithGraph.filter((page) => page.kind === "graph_report" || page.kind === "community_summary")]
  ]) {
    const absolutePath = path23.join(paths.wikiDir, relativePath);
    await writeFileIfChanged(
      absolutePath,
      await buildManagedContent(
        absolutePath,
        {
          managedBy: "system",
          compiledFrom: indexCompiledFrom(sectionPages)
        },
        (metadata) => buildSectionIndex(kind, sectionPages, globalSchemaHash, metadata)
      )
    );
  }
  for (const record of graphOrientation.records) {
    await writeFileIfChanged(path23.join(paths.wikiDir, record.page.path), record.content);
  }
  for (const record of dashboardRecords) {
    await writeFileIfChanged(path23.join(paths.wikiDir, record.page.path), record.content);
  }
  if (graphOrientation.report) {
    await writeJsonFile(path23.join(paths.wikiDir, "graph", "report.json"), graphOrientation.report);
    await writeFileIfChanged(path23.join(paths.wikiDir, "graph", "share-card.svg"), graphOrientation.shareSvg);
    await writeGraphShareBundle(paths.wikiDir, graphOrientation.shareBundleFiles);
  }
  const existingProjectIndexPaths = (await listFilesRecursive(paths.projectsDir)).filter((absolutePath) => absolutePath.endsWith(".md")).map((absolutePath) => toPosix(path23.relative(paths.wikiDir, absolutePath)));
  const allowedProjectIndexPaths = /* @__PURE__ */ new Set([
    "projects/index.md",
    ...configuredProjects.map((project) => `projects/${project.id}/index.md`)
  ]);
  await Promise.all(
    existingProjectIndexPaths.filter((relativePath) => !allowedProjectIndexPaths.has(relativePath)).map((relativePath) => fs18.rm(path23.join(paths.wikiDir, relativePath), { force: true }))
  );
  const existingGraphPages = (await listFilesRecursive(path23.join(paths.wikiDir, "graph").replace(/\/$/, "")).catch(() => [])).filter((absolutePath) => absolutePath.endsWith(".md")).map((absolutePath) => toPosix(path23.relative(paths.wikiDir, absolutePath)));
  const allowedGraphPages = /* @__PURE__ */ new Set([
    "graph/index.md",
    "graph/share-kit/share-card.md",
    ...graphOrientation.records.map((record) => record.page.path)
  ]);
  await Promise.all(
    existingGraphPages.filter((relativePath) => !allowedGraphPages.has(relativePath)).map((relativePath) => fs18.rm(path23.join(paths.wikiDir, relativePath), { force: true }))
  );
  const existingDashboardPages = (await listFilesRecursive(path23.join(paths.wikiDir, "dashboards")).catch(() => [])).filter((absolutePath) => absolutePath.endsWith(".md")).map((absolutePath) => toPosix(path23.relative(paths.wikiDir, absolutePath)));
  const allowedDashboardPages = /* @__PURE__ */ new Set(["dashboards/index.md", ...dashboardRecords.map((record) => record.page.path)]);
  await Promise.all(
    existingDashboardPages.filter((relativePath) => !allowedDashboardPages.has(relativePath)).map((relativePath) => fs18.rm(path23.join(paths.wikiDir, relativePath), { force: true }))
  );
  await rebuildSearchIndex(paths.searchDbPath, pagesWithGraph, paths.wikiDir);
  if (currentGraph) {
    await writeRetrievalManifest(rootDir, {
      ...currentGraph,
      pages: pagesWithGraph
    });
  }
}
async function prepareOutputPageSave(rootDir, input) {
  const { paths } = await loadVaultConfig(rootDir);
  const slug = await resolveUniqueOutputSlug(paths.wikiDir, input.slug ?? slugify(input.question));
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const output = buildOutputPage({
    ...input,
    slug,
    metadata: {
      status: "active",
      createdAt: now,
      updatedAt: now,
      compiledFrom: uniqueStrings4(input.relatedSourceIds ?? input.citations),
      managedBy: "system",
      confidence: 0.74
    }
  });
  const absolutePath = path23.join(paths.wikiDir, output.page.path);
  return {
    page: output.page,
    savedPath: absolutePath,
    outputAssets: output.page.outputAssets ?? [],
    content: output.content,
    assetFiles: input.assetFiles ?? []
  };
}
async function persistOutputPage(rootDir, input) {
  const { paths } = await loadVaultConfig(rootDir);
  const prepared = await prepareOutputPageSave(rootDir, input);
  await ensureDir(path23.dirname(prepared.savedPath));
  await fs18.writeFile(prepared.savedPath, prepared.content, "utf8");
  for (const assetFile of prepared.assetFiles) {
    const assetPath = path23.join(paths.wikiDir, assetFile.relativePath);
    await ensureDir(path23.dirname(assetPath));
    if (typeof assetFile.content === "string") {
      await fs18.writeFile(assetPath, assetFile.content, assetFile.encoding ?? "utf8");
    } else {
      await fs18.writeFile(assetPath, assetFile.content);
    }
  }
  return { page: prepared.page, savedPath: prepared.savedPath, outputAssets: prepared.outputAssets };
}
async function prepareExploreHubSave(rootDir, input) {
  const { paths } = await loadVaultConfig(rootDir);
  const slug = await resolveUniqueOutputSlug(paths.wikiDir, input.slug ?? `explore-${slugify(input.question)}`);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const hub = buildExploreHubPage({
    ...input,
    slug,
    metadata: {
      status: "active",
      createdAt: now,
      updatedAt: now,
      compiledFrom: uniqueStrings4(input.citations),
      managedBy: "system",
      confidence: 0.76
    }
  });
  const absolutePath = path23.join(paths.wikiDir, hub.page.path);
  return {
    page: hub.page,
    savedPath: absolutePath,
    outputAssets: hub.page.outputAssets ?? [],
    content: hub.content,
    assetFiles: input.assetFiles ?? []
  };
}
async function persistExploreHub(rootDir, input) {
  const { paths } = await loadVaultConfig(rootDir);
  const prepared = await prepareExploreHubSave(rootDir, input);
  await ensureDir(path23.dirname(prepared.savedPath));
  await fs18.writeFile(prepared.savedPath, prepared.content, "utf8");
  for (const assetFile of prepared.assetFiles) {
    const assetPath = path23.join(paths.wikiDir, assetFile.relativePath);
    await ensureDir(path23.dirname(assetPath));
    if (typeof assetFile.content === "string") {
      await fs18.writeFile(assetPath, assetFile.content, assetFile.encoding ?? "utf8");
    } else {
      await fs18.writeFile(assetPath, assetFile.content);
    }
  }
  return { page: prepared.page, savedPath: prepared.savedPath, outputAssets: prepared.outputAssets };
}
async function stageOutputApprovalBundle(rootDir, stagedPages, options = {}) {
  const { paths } = await loadVaultConfig(rootDir);
  const previousGraph = await readJsonFile(paths.graphPath);
  const changedFiles = stagedPages.flatMap((item) => [
    { relativePath: item.page.path, content: item.content },
    ...(item.assetFiles ?? []).map((assetFile) => ({
      relativePath: assetFile.relativePath,
      content: typeof assetFile.content === "string" ? assetFile.content : Buffer.from(assetFile.content).toString("base64"),
      binary: typeof assetFile.content !== "string"
    }))
  ]);
  const labelsByPath = new Map(stagedPages.filter((item) => item.label).map((item) => [item.page.path, item.label]));
  const approvalId = `schedule-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`;
  const approvalDir = path23.join(paths.approvalsDir, approvalId);
  await ensureDir(approvalDir);
  await ensureDir(path23.join(approvalDir, "wiki"));
  await ensureDir(path23.join(approvalDir, "state"));
  for (const file of changedFiles) {
    const targetPath = path23.join(approvalDir, "wiki", file.relativePath);
    await ensureDir(path23.dirname(targetPath));
    if ("binary" in file && file.binary) {
      await fs18.writeFile(targetPath, Buffer.from(file.content, "base64"));
    } else {
      await fs18.writeFile(targetPath, file.content, "utf8");
    }
  }
  const nextPages = sortGraphPages([
    ...(previousGraph?.pages ?? []).filter((page) => !stagedPages.some((item) => item.page.id === page.id || item.page.path === page.path)),
    ...stagedPages.map((item) => item.page)
  ]);
  const graph = {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    nodes: previousGraph?.nodes ?? [],
    edges: previousGraph?.edges ?? [],
    hyperedges: previousGraph?.hyperedges ?? [],
    sources: previousGraph?.sources ?? [],
    pages: nextPages
  };
  await fs18.writeFile(path23.join(approvalDir, "state", "graph.json"), JSON.stringify(graph, null, 2), "utf8");
  await writeApprovalManifest(paths, {
    approvalId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    bundleType: options.bundleType ?? "generated-output",
    title: options.title,
    sourceSessionId: options.sourceSessionId,
    entries: await buildApprovalEntries(
      paths,
      stagedPages.map((item) => ({ relativePath: item.page.path, content: item.content })),
      [],
      previousGraph ?? null,
      graph,
      labelsByPath
    )
  });
  return { approvalId, approvalDir };
}
async function stageGeneratedOutputPages(rootDir, stagedPages, options = {}) {
  return await stageOutputApprovalBundle(rootDir, stagedPages, options);
}
async function executeQuery(rootDir, question, format, options = {}) {
  const { paths } = await loadVaultConfig(rootDir);
  const schemas = await loadVaultSchemas(rootDir);
  const provider = await getProviderForTask(rootDir, "queryProvider");
  if (!await fileExists(paths.searchDbPath) || !await fileExists(paths.graphPath)) {
    await compileVault(rootDir, {});
  }
  const gapFillTask = options.gapFillTask ?? "queryProvider";
  const webResults = [];
  if (options.gapFill) {
    try {
      const webSearch = await getWebSearchAdapterForTask(rootDir, gapFillTask);
      const results = await webSearch.search(question, 5);
      webResults.push(...results);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `gap-fill requested but no usable "${gapFillTask}" web search provider is configured. ${message} Add webSearch.providers and webSearch.tasks.${gapFillTask} to swarmvault.config.json.`
      );
    }
  }
  const graph = await readJsonFile(paths.graphPath);
  const pageMap2 = new Map((graph?.pages ?? []).map((page) => [page.id, page]));
  const sourceProjects = Object.fromEntries(
    (graph?.pages ?? []).filter((page) => page.kind === "source" && page.sourceIds.length).map((page) => [page.sourceIds[0], page.projectIds[0] ?? null])
  );
  const searchResults = await searchVault(rootDir, question, 5);
  const excerpts = await Promise.all(
    searchResults.map(async (result) => {
      const absolutePath = path23.join(paths.wikiDir, result.path);
      try {
        const content = await fs18.readFile(absolutePath, "utf8");
        const parsed = matter11(content);
        return `# ${result.title}
${truncate(normalizeWhitespace(parsed.content), 1200)}`;
      } catch {
        return `# ${result.title}
${result.snippet}`;
      }
    })
  );
  const relatedPageIds = uniqueBy(
    searchResults.map((result) => result.pageId),
    (item) => item
  );
  const relatedNodeIds = uniqueBy(
    relatedPageIds.flatMap((pageId) => pageMap2.get(pageId)?.nodeIds ?? []),
    (item) => item
  );
  const relatedSourceIds = uniqueBy(
    relatedPageIds.flatMap((pageId) => pageMap2.get(pageId)?.sourceIds ?? []),
    (item) => item
  );
  const schemaProjectIds = schemaProjectIdsFromPages(relatedPageIds, pageMap2);
  const querySchema = composeVaultSchema(
    schemas.root,
    schemaProjectIds.map((projectId) => schemas.projects[projectId]).filter((schema) => Boolean(schema?.hash))
  );
  const pageProjectIds = scopedProjectIdsFromSources(relatedSourceIds, sourceProjects);
  const manifests = await listManifests(rootDir);
  const rawExcerpts = [];
  for (const sourceId of relatedSourceIds.slice(0, 5)) {
    const manifest = manifests.find((item) => item.sourceId === sourceId);
    if (!manifest) {
      continue;
    }
    const text = await readExtractedText(rootDir, manifest);
    if (text) {
      rawExcerpts.push(`# [source:${sourceId}] ${manifest.title}
${truncate(normalizeWhitespace(text), 800)}`);
    }
  }
  const webExcerpts = webResults.map(
    (result) => `# ${result.title} [${result.url}]
${truncate(normalizeWhitespace(result.snippet), 600)}`
  );
  let answer;
  let usage;
  if (provider.type === "heuristic") {
    answer = formatHeuristicAnswer(question, excerpts, rawExcerpts, searchResults, format);
  } else {
    const context = [
      ...webExcerpts.length ? ["Web search evidence:", webExcerpts.join("\n\n---\n\n"), ""] : [],
      "Wiki context:",
      excerpts.join("\n\n---\n\n"),
      ...rawExcerpts.length ? ["", "Raw source material:", rawExcerpts.join("\n\n---\n\n")] : []
    ].join("\n\n");
    const response = await provider.generateText({
      system: buildSchemaPrompt(
        querySchema,
        [
          "Answer using the provided context. Prefer raw source material over wiki summaries when they differ. Cite source IDs and web URLs when they appear in the evidence.",
          outputFormatInstruction(format)
        ].join(" ")
      ),
      prompt: `Question: ${question}

${context}`
    });
    answer = response.text;
    usage = response.usage;
  }
  const webCitations = uniqueBy(
    webResults.map((result) => result.url).filter((url) => Boolean(url)),
    (item) => item
  );
  const citations = uniqueBy([...relatedSourceIds, ...webCitations], (item) => item);
  return {
    answer,
    citations,
    relatedPageIds,
    relatedNodeIds,
    relatedSourceIds,
    schemaHash: querySchema.hash,
    projectIds: pageProjectIds,
    usage
  };
}
async function generateFollowUpQuestions(rootDir, question, answer) {
  const provider = await getProviderForTask(rootDir, "queryProvider");
  const schema = (await loadVaultSchemas(rootDir)).effective.global;
  if (provider.type === "heuristic") {
    return uniqueBy(
      [
        `What evidence best supports ${question}?`,
        `What contradicts ${question}?`,
        `Which sources should be added to answer ${question} better?`
      ],
      (item) => item
    ).slice(0, 3);
  }
  const response = await provider.generateStructured(
    {
      system: buildSchemaPrompt(schema, "Propose concise follow-up research questions for the vault. Return only useful next questions."),
      prompt: `Root question: ${question}

Current answer:
${answer}`
    },
    z7.object({
      questions: z7.array(z7.string().min(1)).max(5)
    })
  );
  return uniqueBy(response.questions, (item) => item).filter((item) => item !== question);
}
async function refreshVaultAfterOutputSave(rootDir) {
  const { config, paths } = await loadVaultConfig(rootDir);
  const schemas = await loadVaultSchemas(rootDir);
  const manifests = await listManifests(rootDir);
  const sourceProjects = resolveSourceProjects(rootDir, manifests, config);
  const cachedAnalyses = manifests.length ? await loadAvailableCachedAnalyses(paths, manifests) : [];
  const codeIndex = await buildCodeIndex(rootDir, manifests, cachedAnalyses);
  const analyses = cachedAnalyses.map((analysis) => {
    const manifest = manifests.find((item) => item.sourceId === analysis.sourceId);
    return manifest ? enrichResolvedCodeImports(manifest, analysis, codeIndex) : analysis;
  });
  const storedOutputs = await loadSavedOutputPages(paths.wikiDir);
  const storedInsights = await loadInsightPages(paths.wikiDir);
  const storedMemoryPages = await loadMemoryTaskPages(rootDir);
  await syncVaultArtifacts(rootDir, {
    schemas,
    manifests,
    analyses,
    codeIndex,
    sourceProjects,
    outputPages: storedOutputs.map((page) => page.page),
    insightPages: storedInsights.map((page) => page.page),
    memoryRecords: storedMemoryPages.map((record) => ({ page: record.page, content: record.content })),
    memoryTasks: storedMemoryPages.map((record) => record.task),
    outputHashes: pageHashes(storedOutputs),
    insightHashes: pageHashes(storedInsights),
    memoryHashes: memoryTaskHashes(storedMemoryPages),
    previousState: await readJsonFile(paths.compileStatePath),
    approve: false,
    promoteCandidates: false
  });
}
function resolveApprovalTargets(manifest, targets) {
  const pendingEntries = manifest.entries.filter((entry) => entry.status === "pending");
  if (!targets.length) {
    return pendingEntries;
  }
  const resolved = pendingEntries.filter(
    (entry) => targets.includes(entry.pageId) || (entry.nextPath ? targets.includes(entry.nextPath) : false) || (entry.previousPath ? targets.includes(entry.previousPath) : false)
  );
  if (!resolved.length) {
    throw new Error(`No pending approval entries matched: ${targets.join(", ")}`);
  }
  return uniqueBy(resolved, (entry) => `${entry.pageId}:${entry.nextPath ?? ""}:${entry.previousPath ?? ""}`);
}
function emptyCompileState() {
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    rootSchemaHash: "",
    projectSchemaHashes: {},
    effectiveSchemaHashes: {
      global: "",
      projects: {}
    },
    projectConfigHash: "",
    analyses: {},
    sourceHashes: {},
    sourceSemanticHashes: {},
    sourceProjects: {},
    outputHashes: {},
    insightHashes: {},
    candidateHistory: {}
  };
}
function updateCandidateHistory(compileState, page, deleted = false) {
  if (!page || page.kind !== "concept" && page.kind !== "entity") {
    return;
  }
  if (deleted) {
    delete compileState.candidateHistory[page.id];
    return;
  }
  compileState.candidateHistory[page.id] = {
    sourceIds: page.sourceIds,
    status: page.status === "candidate" ? "candidate" : "active"
  };
}
function sortGraphPages(pages) {
  return [...pages].sort((left, right) => left.path.localeCompare(right.path) || left.title.localeCompare(right.title));
}
function diffLines(current, staged) {
  const currentLines = current.split("\n");
  const stagedLines = staged.split("\n");
  const n = currentLines.length;
  const m = stagedLines.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i2 = n - 1; i2 >= 0; i2--) {
    for (let j2 = m - 1; j2 >= 0; j2--) {
      dp[i2][j2] = currentLines[i2] === stagedLines[j2] ? dp[i2 + 1][j2 + 1] + 1 : Math.max(dp[i2 + 1][j2], dp[i2][j2 + 1]);
    }
  }
  const lines = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && currentLines[i] === stagedLines[j]) {
      lines.push({ type: "context", value: currentLines[i] });
      i++;
      j++;
    } else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) {
      lines.push({ type: "add", value: stagedLines[j] });
      j++;
    } else {
      lines.push({ type: "remove", value: currentLines[i] });
      i++;
    }
  }
  return lines;
}
function computeUnifiedDiff(current, staged, label) {
  const output = [`--- a/${label}`, `+++ b/${label}`];
  for (const line of diffLines(current, staged)) {
    const prefix = line.type === "add" ? "+" : line.type === "remove" ? "-" : " ";
    output.push(`${prefix}${line.value}`);
  }
  return output.join("\n");
}
var PROTECTED_FRONTMATTER_FIELDS = /* @__PURE__ */ new Set([
  "page_id",
  "source_ids",
  "node_ids",
  "freshness",
  "source_hashes",
  "source_semantic_hashes",
  "schema_hash"
]);
function stableSerialize(value) {
  if (value === void 0) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
}
function compareFrontmatter(currentData, stagedData) {
  const keys = /* @__PURE__ */ new Set([...Object.keys(currentData), ...Object.keys(stagedData)]);
  const changes = [];
  for (const key of keys) {
    const before = currentData[key];
    const after = stagedData[key];
    if (stableSerialize(before) === stableSerialize(after)) continue;
    changes.push({
      key,
      before,
      after,
      protected: PROTECTED_FRONTMATTER_FIELDS.has(key)
    });
  }
  return changes.sort((left, right) => left.key.localeCompare(right.key));
}
function computeStructuredDiff(current, staged, isBinaryAsset) {
  if (isBinaryAsset) {
    return {
      hunks: [],
      addedLines: 0,
      removedLines: 0,
      frontmatterChanges: []
    };
  }
  if (!current && !staged) return void 0;
  let currentData = {};
  let stagedData = {};
  let currentBody = current ?? "";
  let stagedBody = staged ?? "";
  if (current) {
    const parsed = matter11(current);
    currentData = parsed.data ?? {};
    currentBody = parsed.content;
  }
  if (staged) {
    const parsed = matter11(staged);
    stagedData = parsed.data ?? {};
    stagedBody = parsed.content;
  }
  const lines = diffLines(currentBody, stagedBody);
  const addedLines = lines.filter((line) => line.type === "add").length;
  const removedLines = lines.filter((line) => line.type === "remove").length;
  const hunks = lines.length ? [
    {
      oldStart: 1,
      oldLines: currentBody.split("\n").length,
      newStart: 1,
      newLines: stagedBody.split("\n").length,
      lines
    }
  ] : [];
  return {
    hunks,
    addedLines,
    removedLines,
    frontmatterChanges: compareFrontmatter(currentData, stagedData)
  };
}
function computeChangeSummary(current, staged, changeType) {
  if (changeType === "create") return "New page";
  if (changeType === "delete") return "Removed page";
  if (changeType === "promote") return "Promoted from candidate";
  if (!current || !staged) return "Updated page";
  const currentParsed = matter11(current);
  const stagedParsed = matter11(staged);
  const changes = [];
  const currentTags = currentParsed.data.tags ?? [];
  const stagedTags = stagedParsed.data.tags ?? [];
  const addedTags = stagedTags.filter((t) => !currentTags.includes(t));
  const removedTags = currentTags.filter((t) => !stagedTags.includes(t));
  if (addedTags.length) changes.push(`added ${addedTags.length} tag(s)`);
  if (removedTags.length) changes.push(`removed ${removedTags.length} tag(s)`);
  if (currentParsed.data.title !== stagedParsed.data.title) changes.push("updated title");
  const currentLines = currentParsed.content.trim().split("\n").length;
  const stagedLines = stagedParsed.content.trim().split("\n").length;
  const lineDelta = stagedLines - currentLines;
  if (lineDelta > 0) changes.push(`added ${lineDelta} line(s)`);
  else if (lineDelta < 0) changes.push(`removed ${Math.abs(lineDelta)} line(s)`);
  else if (currentParsed.content !== stagedParsed.content) changes.push("modified content");
  return changes.length ? changes.join(", ") : "no visible changes";
}
async function listApprovals(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  const manifests = await Promise.all(
    (await fs18.readdir(paths.approvalsDir, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isDirectory()).map(async (entry) => {
      try {
        return await readApprovalManifest(paths, entry.name);
      } catch {
        return null;
      }
    })
  );
  return manifests.filter((manifest) => Boolean(manifest)).map(approvalSummary).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
async function readApproval(rootDir, approvalId, options) {
  const { paths } = await loadVaultConfig(rootDir);
  const manifest = await readApprovalManifest(paths, approvalId);
  const details = await Promise.all(
    manifest.entries.map(async (entry) => {
      const currentPath = entry.previousPath ?? entry.nextPath;
      const currentContent = currentPath ? await fs18.readFile(path23.join(paths.wikiDir, currentPath), "utf8").catch(() => void 0) : void 0;
      const stagedContent = entry.nextPath ? await fs18.readFile(path23.join(paths.approvalsDir, approvalId, "wiki", entry.nextPath), "utf8").catch(() => void 0) : void 0;
      const detail = {
        ...entry,
        currentContent,
        stagedContent
      };
      detail.changeSummary = computeChangeSummary(detail.currentContent, detail.stagedContent, detail.changeType);
      const isBinaryAsset = detail.kind === "output";
      const structured = computeStructuredDiff(detail.currentContent, detail.stagedContent, isBinaryAsset);
      if (structured) {
        detail.structuredDiff = structured;
        const protectedChanges = structured.frontmatterChanges.filter((change) => change.protected);
        if (protectedChanges.length) {
          detail.warnings = ["protected_frontmatter_changed"];
        }
      }
      if (options?.diff && detail.currentContent && detail.stagedContent && !isBinaryAsset) {
        detail.diff = computeUnifiedDiff(detail.currentContent, detail.stagedContent, detail.nextPath ?? detail.pageId);
      }
      return detail;
    })
  );
  return {
    ...approvalSummary(manifest),
    entries: details
  };
}
async function acceptApproval(rootDir, approvalId, targets = []) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const { paths } = await loadVaultConfig(rootDir);
  const manifest = await readApprovalManifest(paths, approvalId);
  const selectedEntries = resolveApprovalTargets(manifest, targets);
  const bundleGraph = await readJsonFile(approvalGraphPath(paths, approvalId));
  const currentGraph = await readJsonFile(paths.graphPath);
  const basePages = currentGraph?.pages ?? (bundleGraph?.pages ?? []).filter((page) => page.kind === "index" || page.kind === "output" || page.kind === "insight");
  let nextPages = [...basePages];
  const compileState = await readJsonFile(paths.compileStatePath) ?? emptyCompileState();
  for (const entry of selectedEntries) {
    if (entry.changeType !== "delete") {
      if (!entry.nextPath) {
        throw new Error(`Approval entry ${entry.pageId} is missing a staged path.`);
      }
      const stagedAbsolutePath = path23.join(paths.approvalsDir, approvalId, "wiki", entry.nextPath);
      const stagedContent = await fs18.readFile(stagedAbsolutePath, "utf8");
      const targetAbsolutePath = path23.join(paths.wikiDir, entry.nextPath);
      await ensureDir(path23.dirname(targetAbsolutePath));
      await fs18.writeFile(targetAbsolutePath, stagedContent, "utf8");
      if (entry.changeType === "promote" && entry.previousPath) {
        await fs18.rm(path23.join(paths.wikiDir, entry.previousPath), { force: true });
      }
      const nextPage = bundleGraph?.pages.find((page) => page.id === entry.pageId && page.path === entry.nextPath) ?? parseStoredPage(entry.nextPath, stagedContent);
      if (nextPage.kind === "output" && nextPage.outputAssets?.length) {
        const outputAssetDir = path23.join(paths.wikiDir, "outputs", "assets", path23.basename(nextPage.path, ".md"));
        await fs18.rm(outputAssetDir, { recursive: true, force: true });
        for (const asset of nextPage.outputAssets) {
          const stagedAssetPath = path23.join(paths.approvalsDir, approvalId, "wiki", asset.path);
          if (!await fileExists(stagedAssetPath)) {
            continue;
          }
          const targetAssetPath = path23.join(paths.wikiDir, asset.path);
          await ensureDir(path23.dirname(targetAssetPath));
          await fs18.copyFile(stagedAssetPath, targetAssetPath);
        }
      }
      nextPages = nextPages.filter(
        (page) => page.id !== entry.pageId && page.path !== entry.nextPath && (!entry.previousPath || page.path !== entry.previousPath)
      );
      nextPages.push(nextPage);
      updateCandidateHistory(compileState, nextPage);
    } else {
      const deletedPage = nextPages.find((page) => page.id === entry.pageId || page.path === entry.previousPath) ?? bundleGraph?.pages.find((page) => page.id === entry.pageId || page.path === entry.previousPath) ?? null;
      if (entry.previousPath) {
        await fs18.rm(path23.join(paths.wikiDir, entry.previousPath), { force: true });
      }
      if (deletedPage?.kind === "output") {
        await fs18.rm(path23.join(paths.wikiDir, "outputs", "assets", path23.basename(deletedPage.path, ".md")), {
          recursive: true,
          force: true
        });
      }
      nextPages = nextPages.filter((page) => page.id !== entry.pageId && page.path !== entry.previousPath);
      updateCandidateHistory(compileState, deletedPage, true);
    }
    entry.status = "accepted";
  }
  const nextGraph = {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    nodes: currentGraph?.nodes ?? bundleGraph?.nodes ?? [],
    edges: currentGraph?.edges ?? bundleGraph?.edges ?? [],
    hyperedges: currentGraph?.hyperedges ?? bundleGraph?.hyperedges ?? [],
    sources: currentGraph?.sources ?? bundleGraph?.sources ?? [],
    pages: sortGraphPages(nextPages)
  };
  compileState.generatedAt = nextGraph.generatedAt;
  await writeJsonFile(paths.graphPath, nextGraph);
  await writeJsonFile(paths.compileStatePath, compileState);
  await refreshIndexesAndSearch(rootDir, nextGraph.pages);
  await writeApprovalManifest(paths, manifest);
  if (manifest.sourceSessionId) {
    await updateGuidedSourceSessionStatus(rootDir, manifest.sourceSessionId, "accepted");
  }
  await recordSession(rootDir, {
    operation: "review",
    title: `Accepted review entries from ${approvalId}`,
    startedAt,
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    success: true,
    relatedPageIds: selectedEntries.map((entry) => entry.pageId),
    changedPages: selectedEntries.flatMap(
      (entry) => [entry.nextPath, entry.previousPath].filter((value) => Boolean(value))
    ),
    lines: selectedEntries.map((entry) => `accepted=${entry.pageId}`)
  });
  return {
    ...approvalSummary(manifest),
    updatedEntries: selectedEntries.map((entry) => entry.pageId)
  };
}
async function rejectApproval(rootDir, approvalId, targets = []) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const { paths } = await loadVaultConfig(rootDir);
  const manifest = await readApprovalManifest(paths, approvalId);
  const selectedEntries = resolveApprovalTargets(manifest, targets);
  for (const entry of selectedEntries) {
    entry.status = "rejected";
  }
  await writeApprovalManifest(paths, manifest);
  if (manifest.sourceSessionId) {
    await updateGuidedSourceSessionStatus(rootDir, manifest.sourceSessionId, "rejected");
  }
  await recordSession(rootDir, {
    operation: "review",
    title: `Rejected review entries from ${approvalId}`,
    startedAt,
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    success: true,
    relatedPageIds: selectedEntries.map((entry) => entry.pageId),
    changedPages: [],
    lines: selectedEntries.map((entry) => `rejected=${entry.pageId}`)
  });
  return {
    ...approvalSummary(manifest),
    updatedEntries: selectedEntries.map((entry) => entry.pageId)
  };
}
async function listCandidates(rootDir) {
  const pages = await listPages(rootDir);
  const candidates = pages.filter(
    (page) => page.status === "candidate" && (page.kind === "concept" || page.kind === "entity")
  );
  let scoreLookup = null;
  try {
    const { config, paths } = await loadVaultConfig(rootDir);
    const promotionConfig = resolvePromotionConfig(config);
    const graph = await readJsonFile(paths.graphPath);
    if (graph) {
      const compileState = await readJsonFile(paths.compileStatePath) ?? emptyCompileState();
      const now = Date.now();
      const decisions = candidates.map(
        (page) => evaluateCandidateForPromotion(page, graph, compileState.candidateHistory, promotionConfig, now)
      );
      scoreLookup = new Map(
        decisions.map((decision) => [
          decision.pageId,
          {
            score: decision.score,
            breakdown: Object.fromEntries(decision.gates.map((gate) => [gate.gate, gate.value]))
          }
        ])
      );
    }
  } catch {
    scoreLookup = null;
  }
  return candidates.map((page) => {
    const scored = scoreLookup?.get(page.id);
    return {
      pageId: page.id,
      title: page.title,
      kind: page.kind,
      path: page.path,
      activePath: candidateActivePath(page),
      sourceIds: page.sourceIds,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      ...scored ? { score: scored.score, scoreBreakdown: scored.breakdown } : {}
    };
  }).sort((left, right) => {
    const ls = left.score ?? -1;
    const rs = right.score ?? -1;
    if (ls !== rs) return rs - ls;
    return left.title.localeCompare(right.title);
  });
}
function resolveCandidateTarget(pages, target) {
  const candidate = pages.find((page) => page.status === "candidate" && (page.id === target || page.path === target));
  if (!candidate || candidate.kind !== "concept" && candidate.kind !== "entity") {
    throw new Error(`Candidate not found: ${target}`);
  }
  return candidate;
}
async function promoteCandidate(rootDir, target) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const { paths } = await loadVaultConfig(rootDir);
  const graph = await readJsonFile(paths.graphPath);
  const candidate = resolveCandidateTarget(graph?.pages ?? [], target);
  const raw = await fs18.readFile(path23.join(paths.wikiDir, candidate.path), "utf8");
  const parsed = matter11(raw);
  const nextUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const nextContent = matter11.stringify(parsed.content, {
    ...parsed.data,
    status: "active",
    updated_at: nextUpdatedAt,
    tags: uniqueStrings4([candidate.kind, ...Array.isArray(parsed.data.tags) ? parsed.data.tags : []]).filter(
      (tag) => tag !== "candidate"
    )
  });
  const nextPath = candidateActivePath(candidate);
  const nextAbsolutePath = path23.join(paths.wikiDir, nextPath);
  await ensureDir(path23.dirname(nextAbsolutePath));
  await fs18.writeFile(nextAbsolutePath, nextContent, "utf8");
  await fs18.rm(path23.join(paths.wikiDir, candidate.path), { force: true });
  const nextPage = parseStoredPage(nextPath, nextContent, { createdAt: candidate.createdAt, updatedAt: nextUpdatedAt });
  const nextPages = sortGraphPages(
    (graph?.pages ?? []).filter((page) => page.id !== candidate.id && page.path !== candidate.path).concat(nextPage)
  );
  const nextGraph = {
    generatedAt: nextUpdatedAt,
    nodes: graph?.nodes ?? [],
    edges: graph?.edges ?? [],
    hyperedges: graph?.hyperedges ?? [],
    sources: graph?.sources ?? [],
    pages: nextPages
  };
  const compileState = await readJsonFile(paths.compileStatePath) ?? emptyCompileState();
  compileState.generatedAt = nextUpdatedAt;
  updateCandidateHistory(compileState, nextPage);
  await writeJsonFile(paths.graphPath, nextGraph);
  await writeJsonFile(paths.compileStatePath, compileState);
  await refreshIndexesAndSearch(rootDir, nextPages);
  await recordSession(rootDir, {
    operation: "candidate",
    title: `Promoted ${candidate.id}`,
    startedAt,
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    success: true,
    relatedPageIds: [candidate.id],
    changedPages: [candidate.path, nextPath],
    lines: [`promoted=${candidate.id}`]
  });
  return {
    pageId: nextPage.id,
    title: nextPage.title,
    kind: nextPage.kind,
    path: nextPage.path,
    activePath: nextPage.path,
    sourceIds: nextPage.sourceIds,
    createdAt: nextPage.createdAt,
    updatedAt: nextPage.updatedAt
  };
}
function resolvePromotionConfig(config) {
  const overrides = config.candidate?.autoPromote ?? {};
  return { ...DEFAULT_PROMOTION_CONFIG, ...overrides };
}
function promotionSessionTitle(promotionConfig) {
  return promotionConfig.dryRun ? "auto-promote-dry-run" : "auto-promote";
}
async function runAutoPromotion(rootDir, options = {}) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const { config, paths } = await loadVaultConfig(rootDir);
  const base = resolvePromotionConfig(config);
  const promotionConfig = { ...base, dryRun: options.dryRun ?? base.dryRun };
  const graph = await readJsonFile(paths.graphPath);
  const compileState = await readJsonFile(paths.compileStatePath) ?? emptyCompileState();
  const candidates = (graph?.pages ?? []).filter(
    (page) => page.status === "candidate" && (page.kind === "concept" || page.kind === "entity")
  );
  const now = Date.now();
  const decisions = candidates.map(
    (page) => evaluateCandidateForPromotion(page, graph, compileState.candidateHistory, promotionConfig, now)
  );
  const sorted = sortDecisionsForPromotion(decisions);
  const acceptedIds = sorted.filter((decision) => decision.promote).slice(0, promotionConfig.maxPerRun).map((d) => d.pageId);
  const skippedIds = sorted.filter((decision) => !acceptedIds.includes(decision.pageId)).map((d) => d.pageId);
  const promotedPageIds = [];
  if (!promotionConfig.dryRun) {
    for (const pageId of acceptedIds) {
      try {
        await promoteCandidate(rootDir, pageId);
        promotedPageIds.push(pageId);
      } catch {
      }
    }
  }
  const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  const sessionBody = renderPromotionSessionMarkdown(decisions, promotedPageIds, {
    dryRun: promotionConfig.dryRun,
    startedAt,
    finishedAt
  });
  const { sessionPath } = await recordSession(rootDir, {
    operation: "candidate",
    title: promotionSessionTitle(promotionConfig),
    startedAt,
    finishedAt,
    success: true,
    relatedPageIds: decisions.map((decision) => decision.pageId),
    changedPages: promotedPageIds,
    lines: [
      `mode=${promotionConfig.dryRun ? "dry-run" : "applied"}`,
      `evaluated=${decisions.length}`,
      `promoted=${promotedPageIds.length}`,
      ...sessionBody.split("\n")
    ]
  });
  return {
    startedAt,
    finishedAt,
    dryRun: promotionConfig.dryRun,
    promotedPageIds,
    skippedPageIds: skippedIds,
    decisions: sorted,
    sessionPath
  };
}
async function previewCandidatePromotions(rootDir) {
  const { config, paths } = await loadVaultConfig(rootDir);
  const promotionConfig = resolvePromotionConfig(config);
  const graph = await readJsonFile(paths.graphPath);
  const compileState = await readJsonFile(paths.compileStatePath) ?? emptyCompileState();
  const candidates = (graph?.pages ?? []).filter(
    (page) => page.status === "candidate" && (page.kind === "concept" || page.kind === "entity")
  );
  const now = Date.now();
  return sortDecisionsForPromotion(
    candidates.map(
      (page) => evaluateCandidateForPromotion(page, graph, compileState.candidateHistory, promotionConfig, now)
    )
  );
}
async function createSupersessionEdge(rootDir, oldPageIdOrPath, newPageIdOrPath) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const { paths } = await loadVaultConfig(rootDir);
  const graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    throw new Error("No compiled graph found. Run `swarmvault compile` first.");
  }
  const byIdOrPath = (target) => graph.pages.find((page) => page.id === target || page.path === target);
  const oldPage = byIdOrPath(oldPageIdOrPath);
  const newPage = byIdOrPath(newPageIdOrPath);
  if (!oldPage) {
    throw new Error(`Supersession source page not found: ${oldPageIdOrPath}`);
  }
  if (!newPage) {
    throw new Error(`Supersession replacement page not found: ${newPageIdOrPath}`);
  }
  if (oldPage.id === newPage.id) {
    throw new Error("Supersession requires two distinct pages.");
  }
  const now = /* @__PURE__ */ new Date();
  const nextOldPage = markSuperseded(oldPage, newPage.id, now);
  const oldAbsolutePath = path23.join(paths.wikiDir, oldPage.path);
  if (await fileExists(oldAbsolutePath)) {
    const current = await fs18.readFile(oldAbsolutePath, "utf8");
    const parsed = matter11(current);
    const nextData = {
      ...parsed.data,
      freshness: "stale",
      decay_score: 0,
      superseded_by: newPage.id,
      updated_at: nextOldPage.updatedAt
    };
    await fs18.writeFile(oldAbsolutePath, matter11.stringify(parsed.content, nextData), "utf8");
  }
  const resolveNodeId = (pageId) => {
    const node = graph.nodes.find((item) => item.pageId === pageId);
    return node?.id ?? pageId;
  };
  const sourceNodeId = resolveNodeId(oldPage.id);
  const targetNodeId = resolveNodeId(newPage.id);
  const edgeId = `${sourceNodeId}->${targetNodeId}:superseded_by`;
  const edge = {
    id: edgeId,
    source: sourceNodeId,
    target: targetNodeId,
    relation: "superseded_by",
    status: "inferred",
    evidenceClass: "inferred",
    confidence: 1,
    provenance: [oldPage.id, newPage.id]
  };
  const nextEdges = graph.edges.filter((existing) => existing.id !== edgeId).concat(edge);
  const nextPages = graph.pages.map((page) => page.id === oldPage.id ? nextOldPage : page);
  const nextGraph = {
    ...graph,
    generatedAt: now.toISOString(),
    edges: nextEdges,
    pages: nextPages
  };
  await writeJsonFile(paths.graphPath, nextGraph);
  await recordSession(rootDir, {
    operation: "supersede",
    title: `Superseded ${oldPage.id} by ${newPage.id}`,
    startedAt,
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    success: true,
    relatedPageIds: [oldPage.id, newPage.id],
    changedPages: [oldPage.path],
    lines: [`old=${oldPage.id}`, `new=${newPage.id}`, `edge=${edgeId}`]
  });
  return {
    oldPageId: oldPage.id,
    newPageId: newPage.id,
    edgeId,
    graphPath: paths.graphPath,
    updatedPagePath: oldPage.path
  };
}
async function archiveCandidate(rootDir, target) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const { paths } = await loadVaultConfig(rootDir);
  const graph = await readJsonFile(paths.graphPath);
  const candidate = resolveCandidateTarget(graph?.pages ?? [], target);
  await fs18.rm(path23.join(paths.wikiDir, candidate.path), { force: true });
  const nextPages = sortGraphPages((graph?.pages ?? []).filter((page) => page.id !== candidate.id && page.path !== candidate.path));
  const nextGraph = {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    nodes: graph?.nodes ?? [],
    edges: graph?.edges ?? [],
    hyperedges: graph?.hyperedges ?? [],
    sources: graph?.sources ?? [],
    pages: nextPages
  };
  const compileState = await readJsonFile(paths.compileStatePath) ?? emptyCompileState();
  compileState.generatedAt = nextGraph.generatedAt;
  updateCandidateHistory(compileState, candidate, true);
  await writeJsonFile(paths.graphPath, nextGraph);
  await writeJsonFile(paths.compileStatePath, compileState);
  await refreshIndexesAndSearch(rootDir, nextPages);
  await recordSession(rootDir, {
    operation: "candidate",
    title: `Archived ${candidate.id}`,
    startedAt,
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    success: true,
    relatedPageIds: [candidate.id],
    changedPages: [candidate.path],
    lines: [`archived=${candidate.id}`]
  });
  return {
    pageId: candidate.id,
    title: candidate.title,
    kind: candidate.kind,
    path: candidate.path,
    activePath: candidateActivePath(candidate),
    sourceIds: candidate.sourceIds,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt
  };
}
async function ensureObsidianWorkspace(rootDir) {
  const { config } = await loadVaultConfig(rootDir);
  const obsidianDir = path23.join(rootDir, ".obsidian");
  const projectIds = projectEntries(config).map((project) => project.id);
  await ensureDir(obsidianDir);
  await Promise.all([
    writeJsonFile(path23.join(obsidianDir, "app.json"), {
      alwaysUpdateLinks: true,
      newFileLocation: "folder",
      newFileFolderPath: "wiki/insights",
      useMarkdownLinks: false,
      attachmentFolderPath: "raw/assets"
    }),
    writeJsonFile(path23.join(obsidianDir, "core-plugins.json"), [
      "file-explorer",
      "global-search",
      "switcher",
      "graph",
      "backlink",
      "outgoing-link",
      "tag-pane",
      "page-preview"
    ]),
    writeJsonFile(path23.join(obsidianDir, "graph.json"), {
      "collapse-filter": false,
      search: "",
      showTags: true,
      showAttachments: false,
      hideUnresolved: false,
      colorGroups: [
        { query: "tag:#source", color: { a: 1, rgb: 16096779 } },
        { query: "tag:#module", color: { a: 1, rgb: 16478597 } },
        { query: "tag:#concept", color: { a: 1, rgb: 959977 } },
        { query: "tag:#entity", color: { a: 1, rgb: 2278750 } },
        { query: "tag:#rationale", color: { a: 1, rgb: 1357990 } },
        { query: "tag:#symbol", color: { a: 1, rgb: 9133302 } },
        ...projectIds.map((projectId, index) => ({
          query: `tag:#project/${projectId}`,
          color: { a: 1, rgb: [959977, 2278750, 16096779, 16478597, 9133302, 1357990][index % 6] }
        }))
      ],
      localJumps: false
    }),
    writeJsonFile(path23.join(obsidianDir, "types.json"), {
      types: {
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
        cssclasses: "multitext"
      }
    }),
    writeJsonFile(path23.join(obsidianDir, "workspace.json"), {
      active: "root",
      lastOpenFiles: ["wiki/index.md", "wiki/projects/index.md", "wiki/candidates/index.md", "wiki/insights/index.md"],
      left: {
        collapsed: false
      },
      right: {
        collapsed: false
      }
    })
  ]);
}
async function initLiteVault(rootDir, options) {
  const rawDir = path23.join(rootDir, "raw");
  const wikiDir = path23.join(rootDir, "wiki");
  const schemaPath = path23.join(rootDir, PRIMARY_SCHEMA_FILENAME);
  const indexPath = path23.join(wikiDir, "index.md");
  const logPath = path23.join(wikiDir, "log.md");
  await Promise.all([ensureDir(rawDir), ensureDir(wikiDir)]);
  if (!await fileExists(schemaPath)) {
    await fs18.writeFile(schemaPath, defaultVaultSchema("default"), "utf8");
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (!await fileExists(indexPath)) {
    await fs18.writeFile(
      indexPath,
      matter11.stringify(
        [
          "# Wiki Index",
          "",
          "This lite vault is agent-maintained. Drop sources into `raw/`, edit `swarmvault.schema.md` to teach the agent how the wiki should be organized, then ask your agent to read sources and update pages here.",
          "",
          "- Summaries, entity pages, and concept pages live under `wiki/`.",
          "- Append every ingest/query/lint operation to `wiki/log.md`.",
          "- Run `swarmvault init` (without `--lite`) when you want the full toolchain with graph, search, and approvals.",
          ""
        ].join("\n"),
        {
          page_id: "wiki:index",
          kind: "index",
          title: "Wiki Index",
          tags: ["index"],
          source_ids: [],
          project_ids: [],
          node_ids: [],
          freshness: "fresh",
          status: "active",
          confidence: 1,
          created_at: now,
          updated_at: now,
          compiled_from: [],
          managed_by: "agent",
          backlinks: [],
          schema_hash: "",
          source_hashes: {},
          source_semantic_hashes: {}
        }
      ),
      "utf8"
    );
  }
  if (!await fileExists(logPath)) {
    await fs18.writeFile(
      logPath,
      matter11.stringify(
        [
          "# Activity Log",
          "",
          "Append-only chronological record. One line per ingest/query/lint operation, newest at the bottom.",
          "",
          "Format: `## [YYYY-MM-DD] <verb> | <subject>`",
          ""
        ].join("\n"),
        {
          page_id: "wiki:log",
          kind: "index",
          title: "Activity Log",
          tags: ["log", "append-only"],
          source_ids: [],
          project_ids: [],
          node_ids: [],
          freshness: "fresh",
          status: "active",
          confidence: 1,
          created_at: now,
          updated_at: now,
          compiled_from: [],
          managed_by: "agent",
          backlinks: [],
          schema_hash: "",
          source_hashes: {},
          source_semantic_hashes: {}
        }
      ),
      "utf8"
    );
  }
  if (options.obsidian) {
    const obsidianDir = path23.join(rootDir, ".obsidian");
    await ensureDir(obsidianDir);
  }
}
async function initVault(rootDir, options = {}) {
  if (options.lite) {
    await initLiteVault(rootDir, options);
    return;
  }
  const requestedProfile = options.profile ?? "default";
  const { config, paths } = await initWorkspace(rootDir, { profile: requestedProfile });
  const profile = config.profile;
  const isResearchProfile = profile.presets.length > 0 || profile.guidedSessionMode === "canonical_review" || profile.dataviewBlocks;
  await installConfiguredAgents(rootDir);
  const insightsIndexPath = path23.join(paths.wikiDir, "insights", "index.md");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await writeFileIfChanged(
    insightsIndexPath,
    matter11.stringify(
      (isResearchProfile ? [
        "# Insights",
        "",
        "Human-authored research notes live here.",
        "",
        "- Use this folder for thesis notes, reading reflections, synthesis drafts, and decisions you want to keep explicitly human-authored.",
        ...profile.guidedSessionMode === "canonical_review" ? [
          "- Guided sessions can stage approval-queued updates for canonical pages and fall back to `wiki/insights/` when a claim still needs judgment."
        ] : [
          "- Guided sessions fall back to `wiki/insights/` for exploratory synthesis until you decide what should become canonical."
        ],
        "- Treat these pages as the human judgment layer for your vault.",
        ""
      ] : [
        "# Insights",
        "",
        "Human-authored notes live here.",
        "",
        "- SwarmVault can read these pages during compile and query.",
        "- SwarmVault can stage insight-page updates through guided sessions, but it never applies them without review.",
        ""
      ]).join("\n"),
      {
        page_id: "insights:index",
        kind: "index",
        title: "Insights",
        tags: ["index", "insights"],
        source_ids: [],
        project_ids: [],
        node_ids: [],
        freshness: "fresh",
        status: "active",
        confidence: 1,
        created_at: now,
        updated_at: now,
        compiled_from: [],
        managed_by: "human",
        backlinks: [],
        schema_hash: "",
        source_hashes: {},
        source_semantic_hashes: {}
      }
    )
  );
  await writeFileIfChanged(
    path23.join(paths.wikiDir, "projects", "index.md"),
    matter11.stringify(["# Projects", "", "- Run `swarmvault compile` to build project rollups.", ""].join("\n"), {
      page_id: "projects:index",
      kind: "index",
      title: "Projects",
      tags: ["index", "projects"],
      source_ids: [],
      project_ids: [],
      node_ids: [],
      freshness: "fresh",
      status: "active",
      confidence: 1,
      created_at: now,
      updated_at: now,
      compiled_from: [],
      managed_by: "system",
      backlinks: [],
      schema_hash: "",
      source_hashes: {},
      source_semantic_hashes: {}
    })
  );
  await writeFileIfChanged(
    path23.join(paths.wikiDir, "candidates", "index.md"),
    matter11.stringify(["# Candidates", "", "- Run `swarmvault compile` to stage candidate pages.", ""].join("\n"), {
      page_id: "candidates:index",
      kind: "index",
      title: "Candidates",
      tags: ["index", "candidates"],
      source_ids: [],
      project_ids: [],
      node_ids: [],
      freshness: "fresh",
      status: "active",
      confidence: 1,
      created_at: now,
      updated_at: now,
      compiled_from: [],
      managed_by: "system",
      backlinks: [],
      schema_hash: "",
      source_hashes: {},
      source_semantic_hashes: {}
    })
  );
  if (options.obsidian) {
    await ensureObsidianWorkspace(rootDir);
  }
  if (isResearchProfile) {
    await writeFileIfChanged(
      path23.join(paths.wikiDir, "insights", "research-playbook.md"),
      matter11.stringify(
        [
          `# ${requestedProfile === "personal-research" ? "Personal Research Playbook" : "Research Playbook"}`,
          "",
          "- Add one source at a time with `swarmvault ingest <input> --guide` or `swarmvault source add <input> --guide`.",
          "- Resume a guided session with `swarmvault source session <source-id-or-session-id>` whenever you want to answer the session prompts directly.",
          "- Review `wiki/outputs/source-briefs/`, `wiki/outputs/source-reviews/`, `wiki/outputs/source-guides/`, and `wiki/outputs/source-sessions/` before accepting staged updates.",
          ...profile.guidedSessionMode === "canonical_review" ? ["- Use `swarmvault review show --diff` to inspect staged canonical page edits before accepting them."] : ["- Keep exploratory synthesis in `wiki/insights/` until you are ready to promote it into canonical pages."],
          ...profile.dataviewBlocks ? [
            "- Dataview-friendly fields are enabled in the dashboards, but every generated page should still read cleanly as plain markdown."
          ] : [],
          ...profile.presets.length ? [`- Active profile presets: ${profile.presets.map((preset) => `\`${preset}\``).join(", ")}.`] : [],
          "- Keep unresolved questions visible in `wiki/dashboards/open-questions.md`.",
          "- Use `swarmvault review list` and `swarmvault review show --diff` to decide what becomes canonical.",
          ""
        ].join("\n"),
        {
          page_id: "insights:research-playbook",
          kind: "insight",
          title: requestedProfile === "personal-research" ? "Personal Research Playbook" : "Research Playbook",
          tags: ["insight", "research", "playbook"],
          source_ids: [],
          project_ids: [],
          node_ids: [],
          freshness: "fresh",
          status: "active",
          confidence: 1,
          created_at: now,
          updated_at: now,
          compiled_from: [],
          managed_by: "human",
          backlinks: [],
          schema_hash: "",
          source_hashes: {},
          source_semantic_hashes: {}
        }
      )
    );
  }
}
async function runConfiguredBenchmark(rootDir, config) {
  if (config.benchmark?.enabled === false) {
    return { ok: true };
  }
  try {
    await benchmarkVault(rootDir);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
async function compileVault(rootDir, options = {}) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const { config, paths } = await initWorkspace(rootDir);
  const schemas = await loadVaultSchemas(rootDir);
  const provider = await getProviderForTask(rootDir, "compileProvider");
  const manifests = await listManifests(rootDir);
  const sourceProjects = resolveSourceProjects(rootDir, manifests, config);
  const storedOutputPages = await loadSavedOutputPages(paths.wikiDir);
  const storedInsightPages = await loadInsightPages(paths.wikiDir);
  const storedMemoryPages = await loadMemoryTaskPages(rootDir);
  const outputPages = storedOutputPages.map((page) => page.page);
  const insightPages = storedInsightPages.map((page) => page.page);
  const memoryPages = storedMemoryPages.map((page) => page.page);
  const memoryTasks = storedMemoryPages.map((page) => page.task);
  const currentOutputHashes = pageHashes(storedOutputPages);
  const currentInsightHashes = pageHashes(storedInsightPages);
  const currentMemoryHashes = memoryTaskHashes(storedMemoryPages);
  const previousState = await readJsonFile(paths.compileStatePath);
  const rootSchemaChanged = !previousState || previousState.rootSchemaHash !== schemas.root.hash;
  const effectiveSchemaChanged = !previousState || previousGlobalSchemaHash(previousState) !== schemas.effective.global.hash || uniqueStrings4([...Object.keys(previousState?.effectiveSchemaHashes?.projects ?? {}), ...Object.keys(schemas.effective.projects)]).some(
    (projectId) => previousProjectSchemaHash(previousState, projectId) !== effectiveHashForProject(schemas, projectId)
  );
  const nextProjectConfigHash = projectConfigHash(config);
  const projectConfigChanged = !previousState || previousState.projectConfigHash !== nextProjectConfigHash;
  const previousSourceHashes = previousState?.sourceSemanticHashes ?? previousState?.sourceHashes ?? {};
  const previousAnalyses = previousState?.analyses ?? {};
  const previousSourceProjects = previousState?.sourceProjects ?? {};
  const previousOutputHashes = previousState?.outputHashes ?? {};
  const previousInsightHashes = previousState?.insightHashes ?? {};
  const previousMemoryHashes = previousState?.memoryHashes ?? {};
  const currentSourceIds = new Set(manifests.map((item) => item.sourceId));
  const previousSourceIds = new Set(Object.keys(previousSourceHashes));
  const sourcesChanged = currentSourceIds.size !== previousSourceIds.size || [...currentSourceIds].some((sourceId) => !previousSourceIds.has(sourceId));
  const outputsChanged = !recordsEqual(currentOutputHashes, previousOutputHashes);
  const insightsChanged = !recordsEqual(currentInsightHashes, previousInsightHashes);
  const memoryChanged = !recordsEqual(currentMemoryHashes, previousMemoryHashes);
  const artifactsExist = await requiredCompileArtifactsExist(paths);
  const pendingCandidatePromotion = Object.values(previousState?.candidateHistory ?? {}).some((entry) => entry.status === "candidate");
  const dirty = [];
  const clean = [];
  for (const manifest of manifests) {
    const hashChanged = previousSourceHashes[manifest.sourceId] !== manifest.semanticHash;
    const noAnalysis = !previousAnalyses[manifest.sourceId];
    const projectId = sourceProjects[manifest.sourceId] ?? null;
    const projectChanged = (previousSourceProjects[manifest.sourceId] ?? null) !== projectId;
    const effectiveHashChanged = previousProjectSchemaHash(previousState, projectId) !== effectiveHashForProject(schemas, projectId);
    if (hashChanged || noAnalysis || projectChanged || effectiveHashChanged) {
      if (options.codeOnly && manifest.sourceKind !== "code") {
        clean.push(manifest);
      } else {
        dirty.push(manifest);
      }
    } else {
      clean.push(manifest);
    }
  }
  if (dirty.length === 0 && !rootSchemaChanged && !effectiveSchemaChanged && !projectConfigChanged && !sourcesChanged && !outputsChanged && !insightsChanged && !memoryChanged && !pendingCandidatePromotion && artifactsExist && !options.approve) {
    const graph = await readJsonFile(paths.graphPath);
    const benchmark2 = await runConfiguredBenchmark(rootDir, config);
    if (graph && benchmark2.ok) {
      await refreshIndexesAndSearch(rootDir, graph.pages);
    }
    await recordSession(rootDir, {
      operation: "compile",
      title: `Compiled ${manifests.length} source(s)`,
      startedAt,
      finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      providerId: provider.id,
      success: true,
      relatedSourceIds: manifests.map((manifest) => manifest.sourceId),
      relatedPageIds: graph?.pages.map((page) => page.id) ?? [...outputPages, ...insightPages, ...memoryPages].map((page) => page.id),
      changedPages: [],
      lines: [
        `provider=${provider.id}`,
        `pages=${graph?.pages.length ?? outputPages.length + insightPages.length}`,
        `dirty=0`,
        `clean=${manifests.length}`,
        `outputs=${outputPages.length}`,
        `insights=${insightPages.length}`,
        `memory=${memoryPages.length}`,
        `schema=${schemas.effective.global.hash.slice(0, 12)}`,
        `benchmark=${benchmark2.ok ? "ok" : `error:${benchmark2.error}`}`
      ]
    });
    return {
      graphPath: paths.graphPath,
      pageCount: graph?.pages.length ?? outputPages.length + insightPages.length + memoryPages.length,
      changedPages: [],
      sourceCount: manifests.length,
      staged: false,
      promotedPageIds: [],
      candidatePageCount: (graph?.pages ?? []).filter((page) => page.status === "candidate").length
    };
  }
  const analysisProgress = createCompileProgressReporter("analyze", manifests.length);
  const compilePromptConfig = config.prompts?.compile;
  const [dirtyAnalyses, cleanAnalyses] = await Promise.all([
    Promise.all(
      dirty.map(async (manifest) => {
        const analysis = await analyzeSource(
          manifest,
          await readExtractedText(rootDir, manifest),
          provider,
          paths,
          getEffectiveSchema(schemas, sourceProjects[manifest.sourceId] ?? null),
          compilePromptConfig
        );
        analysisProgress.tick(manifest.title);
        return analysis;
      })
    ),
    Promise.all(
      clean.map(async (manifest) => {
        const cached = await readJsonFile(path23.join(paths.analysesDir, `${manifest.sourceId}.json`));
        if (cached) {
          analysisProgress.tick(manifest.title);
          return cached;
        }
        const analysis = await analyzeSource(
          manifest,
          await readExtractedText(rootDir, manifest),
          provider,
          paths,
          getEffectiveSchema(schemas, sourceProjects[manifest.sourceId] ?? null),
          compilePromptConfig
        );
        analysisProgress.tick(manifest.title);
        return analysis;
      })
    )
  ]);
  analysisProgress.finish(`dirty=${dirty.length}, clean=${clean.length}`);
  const initialAnalyses = [...dirtyAnalyses, ...cleanAnalyses];
  const codeIndex = await buildCodeIndex(rootDir, manifests, initialAnalyses);
  const analyses = await Promise.all(
    initialAnalyses.map(async (analysis) => {
      const manifest = manifests.find((item) => item.sourceId === analysis.sourceId);
      if (!manifest || !analysis.code) {
        return analysis;
      }
      const enriched = enrichResolvedCodeImports(manifest, analysis, codeIndex);
      if (analysisSignature(enriched) !== analysisSignature(analysis)) {
        await writeJsonFile(path23.join(paths.analysesDir, `${analysis.sourceId}.json`), enriched);
      }
      return enriched;
    })
  );
  await Promise.all([
    ensureDir(path23.join(paths.wikiDir, "sources")),
    ensureDir(path23.join(paths.wikiDir, "code")),
    ensureDir(path23.join(paths.wikiDir, "concepts")),
    ensureDir(path23.join(paths.wikiDir, "entities")),
    ensureDir(path23.join(paths.wikiDir, "outputs")),
    ensureDir(path23.join(paths.wikiDir, "projects")),
    ensureDir(path23.join(paths.wikiDir, "insights")),
    ensureDir(path23.join(paths.wikiDir, "candidates")),
    ensureDir(path23.join(paths.wikiDir, "candidates", "concepts")),
    ensureDir(path23.join(paths.wikiDir, "candidates", "entities"))
  ]);
  const sync = await syncVaultArtifacts(rootDir, {
    schemas,
    manifests,
    analyses,
    codeIndex,
    sourceProjects,
    outputPages,
    insightPages,
    memoryRecords: storedMemoryPages.map((record) => ({ page: record.page, content: record.content })),
    memoryTasks,
    outputHashes: currentOutputHashes,
    insightHashes: currentInsightHashes,
    memoryHashes: currentMemoryHashes,
    previousState,
    approve: options.approve
  });
  let postPassApprovalId;
  let postPassApprovalDir;
  if (!options.approve && !sync.staged && config.orchestration?.compilePostPass) {
    const roleResults = await runConfiguredRoles(rootDir, ["context", "safety"], {
      title: "Compile post-pass",
      instructions: "Review the compiled vault and optionally propose markdown page updates. Proposals must be complete markdown files with frontmatter.",
      context: [
        `Pages: ${sync.allPages.length}`,
        `Changed pages: ${sync.changedPages.join(", ") || "none"}`,
        "",
        sync.allPages.slice(0, 18).map((page) => [`# ${page.title}`, `path=${page.path}`, `kind=${page.kind}`, `status=${page.status}`].join("\n")).join("\n\n---\n\n")
      ].join("\n")
    });
    const proposals = roleResults.flatMap((result) => result.proposals).map((proposal) => ({
      ...proposal,
      path: toPosix(proposal.path.replace(/^wiki\//, "").replace(/^\/+/, ""))
    })).filter((proposal) => proposal.path.endsWith(".md")).filter((proposal) => !proposal.path.startsWith("insights/")).filter((proposal) => !proposal.path.startsWith("../"));
    if (proposals.length) {
      const proposedPages = proposals.map((proposal) => parseStoredPage(proposal.path, proposal.content));
      const proposalGraph = {
        ...sync.graph,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        pages: sortGraphPages(
          sync.graph.pages.filter((page) => !proposedPages.some((proposalPage) => proposalPage.id === page.id || proposalPage.path === page.path)).concat(proposedPages)
        )
      };
      const staged = await stageApprovalBundle(
        paths,
        proposals.map((proposal) => ({ relativePath: proposal.path, content: proposal.content })),
        [],
        sync.graph,
        proposalGraph
      );
      postPassApprovalId = staged.approvalId;
      postPassApprovalDir = staged.approvalDir;
    }
  }
  if (!options.approve && !sync.staged) {
    try {
      const decayResult = await runDecayPass({
        wikiDir: paths.wikiDir,
        graphPath: paths.graphPath,
        pages: sync.allPages,
        confirmedPageIds: sync.allPages.map((page) => page.id),
        config: config.freshness
      });
      if (decayResult.updatedPaths.length) {
        sync.changedPages = uniqueStrings4([...sync.changedPages, ...decayResult.updatedPaths]);
      }
    } catch {
    }
  }
  if (!options.approve && !sync.staged) {
    try {
      const consolidation = await runConsolidation(rootDir, config.consolidation ?? {});
      if (consolidation.newPages.length) {
        sync.changedPages = uniqueStrings4([...sync.changedPages, ...consolidation.newPages.map((page) => page.path)]);
      }
    } catch {
    }
  }
  const benchmark = options.approve ? { ok: true } : await runConfiguredBenchmark(rootDir, config);
  if (!options.approve && benchmark.ok) {
    await refreshIndexesAndSearch(rootDir, sync.allPages);
  }
  await recordSession(rootDir, {
    operation: "compile",
    title: `Compiled ${manifests.length} source(s)`,
    startedAt,
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    providerId: provider.id,
    success: true,
    relatedSourceIds: manifests.map((manifest) => manifest.sourceId),
    relatedPageIds: sync.allPages.map((page) => page.id),
    changedPages: sync.changedPages,
    lines: [
      `provider=${provider.id}`,
      `pages=${sync.allPages.length}`,
      `dirty=${dirty.length}`,
      `clean=${clean.length}`,
      `outputs=${outputPages.length}`,
      `insights=${insightPages.length}`,
      `memory=${memoryPages.length}`,
      `candidates=${sync.candidatePageCount}`,
      `promoted=${sync.promotedPageIds.length}`,
      `staged=${sync.staged}`,
      `postPassApproval=${postPassApprovalId ?? "none"}`,
      `schema=${schemas.effective.global.hash.slice(0, 12)}`,
      `benchmark=${benchmark.ok ? "ok" : `error:${benchmark.error}`}`
    ]
  });
  let tokenStats;
  if (options.maxTokens && options.maxTokens > 0) {
    const { estimatePageTokens, trimToTokenBudget } = await import("./token-estimation-TTONKT4O.js");
    const nodeDegreeLookup = /* @__PURE__ */ new Map();
    const graph = await readJsonFile(paths.graphPath);
    if (graph) {
      for (const node of graph.nodes) {
        if (node.pageId && node.degree) {
          const existing = nodeDegreeLookup.get(node.pageId) ?? 0;
          nodeDegreeLookup.set(node.pageId, Math.max(existing, node.degree));
        }
      }
    }
    const estimates = await Promise.all(
      sync.allPages.map(async (page) => {
        const fullPath = path23.join(paths.wikiDir, page.path);
        let content = "";
        try {
          content = await fs18.readFile(fullPath, "utf8");
        } catch {
        }
        return estimatePageTokens(page.id, page.path, page.kind, content, nodeDegreeLookup.get(page.id), page.confidence);
      })
    );
    const budgetResult = trimToTokenBudget(estimates, options.maxTokens);
    for (const dropped of budgetResult.dropped) {
      const fullPath = path23.join(paths.wikiDir, dropped.path);
      try {
        await fs18.unlink(fullPath);
      } catch {
      }
    }
    tokenStats = {
      estimatedTokens: budgetResult.totalTokens,
      maxTokens: options.maxTokens,
      pagesKept: budgetResult.kept.length,
      pagesDropped: budgetResult.dropped.length
    };
  }
  let autoPromotionSummary;
  const promotionConfig = resolvePromotionConfig(config);
  const promotedFromAuto = [];
  if (promotionConfig.enabled && !options.approve) {
    const autoRun = await runAutoPromotion(rootDir, { dryRun: promotionConfig.dryRun });
    autoPromotionSummary = {
      evaluated: autoRun.decisions.length,
      promoted: autoRun.promotedPageIds.length,
      dryRun: autoRun.dryRun,
      sessionPath: autoRun.sessionPath
    };
    promotedFromAuto.push(...autoRun.promotedPageIds);
  }
  return {
    graphPath: paths.graphPath,
    pageCount: sync.allPages.length,
    changedPages: sync.changedPages,
    sourceCount: manifests.length,
    staged: sync.staged,
    approvalId: sync.approvalId,
    approvalDir: sync.approvalDir,
    postPassApprovalId,
    postPassApprovalDir,
    promotedPageIds: [...sync.promotedPageIds, ...promotedFromAuto],
    candidatePageCount: sync.candidatePageCount,
    autoPromotion: autoPromotionSummary,
    tokenStats
  };
}
async function queryVault(rootDir, options) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const save = options.save ?? true;
  const review = options.review ?? false;
  const outputFormat = normalizeOutputFormat2(options.format);
  const schemas = await loadVaultSchemas(rootDir);
  const query = await executeQuery(rootDir, options.question, outputFormat, {
    gapFill: options.gapFill,
    gapFillTask: "queryProvider"
  });
  let savedPath;
  let stagedPath;
  let savedPageId;
  let approvalId;
  let approvalDir;
  let outputAssets = [];
  if (save) {
    const assetBundle = await generateOutputArtifacts(rootDir, {
      slug: slugify(options.question),
      title: options.question,
      question: options.question,
      answer: query.answer,
      citations: query.citations,
      format: outputFormat,
      relatedPageCount: query.relatedPageIds.length,
      relatedNodeCount: query.relatedNodeIds.length,
      projectId: query.projectIds[0] ?? null
    });
    outputAssets = assetBundle.outputAssets;
    const outputInput = {
      question: options.question,
      answer: assetBundle.answer,
      citations: query.citations,
      schemaHash: query.schemaHash,
      outputFormat,
      outputAssets: assetBundle.outputAssets,
      relatedPageIds: query.relatedPageIds,
      relatedNodeIds: query.relatedNodeIds,
      relatedSourceIds: query.relatedSourceIds,
      projectIds: query.projectIds,
      extraTags: categoryTagsForSchema(getEffectiveSchema(schemas, query.projectIds[0] ?? null), [options.question, assetBundle.answer]),
      origin: "query"
    };
    if (review) {
      const staged = await prepareOutputPageSave(rootDir, {
        ...outputInput,
        assetFiles: assetBundle.assetFiles
      });
      const approval = await stageOutputApprovalBundle(rootDir, [
        {
          page: staged.page,
          content: staged.content,
          assetFiles: staged.assetFiles
        }
      ]);
      stagedPath = path23.join(approval.approvalDir, "wiki", staged.page.path);
      savedPageId = staged.page.id;
      approvalId = approval.approvalId;
      approvalDir = approval.approvalDir;
    } else {
      const saved = await persistOutputPage(rootDir, {
        ...outputInput,
        assetFiles: assetBundle.assetFiles
      });
      await refreshVaultAfterOutputSave(rootDir);
      savedPath = saved.savedPath;
      savedPageId = saved.page.id;
    }
  }
  const provider = await getProviderForTask(rootDir, "queryProvider");
  await recordSession(rootDir, {
    operation: "query",
    title: options.question,
    startedAt,
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    providerId: provider.id,
    success: true,
    relatedSourceIds: query.relatedSourceIds,
    relatedPageIds: savedPageId ? [...query.relatedPageIds, savedPageId] : query.relatedPageIds,
    relatedNodeIds: query.relatedNodeIds,
    citations: query.citations,
    tokenUsage: query.usage,
    lines: [
      `citations=${query.citations.join(",") || "none"}`,
      `saved=${Boolean(savedPath)}`,
      `staged=${Boolean(stagedPath)}`,
      `format=${outputFormat}`,
      `rawSources=${query.relatedSourceIds.length}`
    ]
  });
  if (options.memoryTaskId) {
    await updateMemoryTask(rootDir, options.memoryTaskId, {
      note: `Query: ${options.question}`,
      pageId: savedPageId,
      sourceId: query.relatedSourceIds[0],
      nodeId: query.relatedNodeIds[0]
    });
  }
  return {
    answer: query.answer,
    savedPath,
    stagedPath,
    savedPageId,
    citations: query.citations,
    relatedPageIds: query.relatedPageIds,
    relatedNodeIds: query.relatedNodeIds,
    relatedSourceIds: query.relatedSourceIds,
    outputFormat,
    saved: Boolean(savedPath),
    staged: Boolean(stagedPath),
    approvalId,
    approvalDir,
    outputAssets
  };
}
async function exploreVault(rootDir, options) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const stepLimit = Math.max(1, options.steps ?? 3);
  const outputFormat = normalizeOutputFormat2(options.format);
  const review = options.review ?? false;
  const schemas = await loadVaultSchemas(rootDir);
  const stepResults = [];
  const stepPages = [];
  const stagedStepPages = [];
  const visited = /* @__PURE__ */ new Set();
  const suggestedQuestions = [];
  const relatedPageIds = /* @__PURE__ */ new Set();
  const relatedNodeIds = /* @__PURE__ */ new Set();
  const relatedSourceIds = /* @__PURE__ */ new Set();
  const tokenUsage = {
    inputTokens: 0,
    outputTokens: 0
  };
  let currentQuestion = options.question;
  let approvalId;
  let approvalDir;
  for (let step = 1; step <= stepLimit; step++) {
    const normalizedQuestion = normalizeWhitespace(currentQuestion).toLowerCase();
    if (!normalizedQuestion || visited.has(normalizedQuestion)) {
      break;
    }
    visited.add(normalizedQuestion);
    const query = await executeQuery(rootDir, currentQuestion, outputFormat, {
      gapFill: options.gapFill,
      gapFillTask: "exploreProvider"
    });
    query.relatedPageIds.forEach((pageId) => {
      relatedPageIds.add(pageId);
    });
    query.relatedNodeIds.forEach((nodeId) => {
      relatedNodeIds.add(nodeId);
    });
    query.relatedSourceIds.forEach((sourceId) => {
      relatedSourceIds.add(sourceId);
    });
    tokenUsage.inputTokens += query.usage?.inputTokens ?? 0;
    tokenUsage.outputTokens += query.usage?.outputTokens ?? 0;
    const roleResults = await runConfiguredRoles(rootDir, ["research", "context", "safety"], {
      title: currentQuestion,
      instructions: "Review this exploration step. Research should suggest follow-up questions, context should highlight cross-links, and safety should flag caveats.",
      context: [
        `Question: ${currentQuestion}`,
        "",
        "Answer:",
        query.answer,
        "",
        `Related pages: ${query.relatedPageIds.join(", ") || "none"}`,
        `Related nodes: ${query.relatedNodeIds.join(", ") || "none"}`,
        `Citations: ${query.citations.join(", ") || "none"}`
      ].join("\n")
    });
    const orchestrationNotes = roleResults.flatMap((result) => result.findings.map((finding) => `- [${result.role}] ${finding.message}`));
    const enrichedAnswer = orchestrationNotes.length ? `${query.answer}

## Agent Review

${orchestrationNotes.join("\n")}
` : query.answer;
    const assetBundle = await generateOutputArtifacts(rootDir, {
      slug: `explore-${slugify(options.question)}-step-${step}`,
      title: `Explore Step ${step}: ${currentQuestion}`,
      question: currentQuestion,
      answer: enrichedAnswer,
      citations: query.citations,
      format: outputFormat,
      relatedPageCount: query.relatedPageIds.length,
      relatedNodeCount: query.relatedNodeIds.length,
      projectId: query.projectIds[0] ?? null
    });
    const outputInput = {
      title: `Explore Step ${step}: ${currentQuestion}`,
      question: currentQuestion,
      answer: assetBundle.answer,
      citations: query.citations,
      schemaHash: query.schemaHash,
      outputFormat,
      outputAssets: assetBundle.outputAssets,
      relatedPageIds: query.relatedPageIds,
      relatedNodeIds: query.relatedNodeIds,
      relatedSourceIds: query.relatedSourceIds,
      projectIds: query.projectIds,
      extraTags: categoryTagsForSchema(getEffectiveSchema(schemas, query.projectIds[0] ?? null), [currentQuestion, assetBundle.answer]),
      origin: "explore",
      slug: `explore-${slugify(options.question)}-step-${step}`
    };
    let savedPathForStep;
    let stagedPathForStep;
    let savedPage;
    let savedAssets;
    if (review) {
      const staged = await prepareOutputPageSave(rootDir, {
        ...outputInput,
        assetFiles: assetBundle.assetFiles
      });
      stagedStepPages.push({
        page: staged.page,
        content: staged.content,
        assetFiles: staged.assetFiles
      });
      savedPage = staged.page;
      savedAssets = staged.outputAssets;
      stagedPathForStep = staged.savedPath;
    } else {
      const saved = await persistOutputPage(rootDir, {
        ...outputInput,
        assetFiles: assetBundle.assetFiles
      });
      savedPage = saved.page;
      savedAssets = saved.outputAssets;
      savedPathForStep = saved.savedPath;
    }
    const followUpQuestions = uniqueBy(
      [...await generateFollowUpQuestions(rootDir, currentQuestion, enrichedAnswer), ...summarizeRoleQuestions(roleResults)],
      (item) => item
    );
    stepResults.push({
      step,
      question: currentQuestion,
      answer: enrichedAnswer,
      savedPath: savedPathForStep,
      stagedPath: stagedPathForStep,
      savedPageId: savedPage.id,
      citations: query.citations,
      followUpQuestions,
      outputFormat,
      outputAssets: savedAssets
    });
    stepPages.push(savedPage);
    suggestedQuestions.push(...followUpQuestions);
    const nextQuestion = followUpQuestions.find((item) => !visited.has(normalizeWhitespace(item).toLowerCase()));
    if (!nextQuestion) {
      break;
    }
    currentQuestion = nextQuestion;
  }
  const allCitations = uniqueBy(
    stepResults.flatMap((step) => step.citations),
    (item) => item
  );
  const hubAssetBundle = await generateOutputArtifacts(rootDir, {
    slug: `explore-${slugify(options.question)}`,
    title: `Explore: ${options.question}`,
    question: options.question,
    answer: stepResults.map((step) => step.answer).join("\n\n"),
    citations: allCitations,
    format: outputFormat,
    relatedPageCount: stepPages.length,
    relatedNodeCount: uniqueStrings4(stepPages.flatMap((page) => page.nodeIds)).length,
    projectId: stepPages[0]?.projectIds[0] ?? null
  });
  const hubInput = {
    question: options.question,
    stepPages,
    followUpQuestions: uniqueBy(suggestedQuestions, (item) => item),
    citations: allCitations,
    schemaHash: composeVaultSchema(
      schemas.root,
      uniqueStrings4(stepPages.flatMap((page) => page.projectIds).sort((left, right) => left.localeCompare(right))).map((projectId) => schemas.projects[projectId]).filter((schema) => Boolean(schema?.hash))
    ).hash,
    outputFormat,
    outputAssets: hubAssetBundle.outputAssets,
    projectIds: scopedProjectIdsFromSources(
      allCitations,
      Object.fromEntries(stepPages.flatMap((page) => page.sourceIds.map((sourceId) => [sourceId, page.projectIds[0] ?? null])))
    ),
    extraTags: categoryTagsForSchema(schemas.effective.global, [options.question, ...stepResults.map((step) => step.answer)]),
    slug: `explore-${slugify(options.question)}`
  };
  let hubPath;
  let stagedHubPath;
  let hubPage;
  let hubAssets;
  let stagedHubRecord;
  if (review) {
    stagedHubRecord = await prepareExploreHubSave(rootDir, {
      ...hubInput,
      assetFiles: hubAssetBundle.assetFiles
    });
    hubPage = stagedHubRecord.page;
    hubAssets = stagedHubRecord.outputAssets;
    stagedHubPath = stagedHubRecord.savedPath;
  } else {
    const savedHub = await persistExploreHub(rootDir, {
      ...hubInput,
      assetFiles: hubAssetBundle.assetFiles
    });
    hubPage = savedHub.page;
    hubAssets = savedHub.outputAssets;
    hubPath = savedHub.savedPath;
  }
  if (review) {
    const approval = await stageOutputApprovalBundle(rootDir, [
      ...stagedStepPages,
      {
        page: stagedHubRecord?.page ?? hubPage,
        content: stagedHubRecord?.content ?? "",
        assetFiles: stagedHubRecord?.assetFiles
      }
    ]);
    approvalId = approval.approvalId;
    approvalDir = approval.approvalDir;
    stepResults.forEach((result, index) => {
      result.stagedPath = path23.join(approval.approvalDir, "wiki", stagedStepPages[index]?.page.path ?? "");
    });
    stagedHubPath = path23.join(approval.approvalDir, "wiki", hubPage.path);
  } else {
    await refreshVaultAfterOutputSave(rootDir);
  }
  const provider = await getProviderForTask(rootDir, "queryProvider");
  await recordSession(rootDir, {
    operation: "explore",
    title: options.question,
    startedAt,
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    providerId: provider.id,
    success: true,
    relatedSourceIds: [...relatedSourceIds],
    relatedPageIds: uniqueStrings4([...relatedPageIds, ...stepPages.map((page) => page.id), hubPage.id]),
    relatedNodeIds: [...relatedNodeIds],
    citations: allCitations,
    tokenUsage: tokenUsage.inputTokens > 0 || tokenUsage.outputTokens > 0 ? {
      inputTokens: tokenUsage.inputTokens,
      outputTokens: tokenUsage.outputTokens
    } : void 0,
    lines: [
      `steps=${stepResults.length}`,
      `hub=${hubPage.id}`,
      `format=${outputFormat}`,
      `citations=${allCitations.join(",") || "none"}`,
      `staged=${review}`
    ]
  });
  if (options.memoryTaskId) {
    await updateMemoryTask(rootDir, options.memoryTaskId, {
      note: `Explore: ${options.question}`,
      pageId: hubPage.id,
      sourceId: [...relatedSourceIds][0],
      nodeId: [...relatedNodeIds][0]
    });
  }
  return {
    rootQuestion: options.question,
    hubPath,
    stagedHubPath,
    hubPageId: hubPage.id,
    stepCount: stepResults.length,
    steps: stepResults,
    suggestedQuestions: uniqueBy(suggestedQuestions, (item) => item),
    outputFormat,
    staged: review,
    approvalId,
    approvalDir,
    hubAssets
  };
}
async function searchVault(rootDir, query, limit = 5) {
  const { paths, config } = await loadVaultConfig(rootDir);
  if (!await fileExists(paths.searchDbPath)) {
    await compileVault(rootDir, {});
  }
  const retrieval = resolveRetrievalConfig(config);
  const hybrid = retrieval.hybrid;
  const ftsResults = searchPages(paths.searchDbPath, query, hybrid ? limit * 3 : limit);
  if (!hybrid || !await fileExists(paths.graphPath)) {
    return ftsResults.slice(0, limit);
  }
  const graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    return ftsResults.slice(0, limit);
  }
  const semanticHits = await semanticPageSearch(rootDir, graph, query, limit * 3).catch(() => []);
  if (!semanticHits.length) {
    return ftsResults.slice(0, limit);
  }
  const merged = mergeSearchResults(ftsResults, semanticHits, limit);
  if (retrieval.rerank && merged.length > 1) {
    return rerankSearchResults(rootDir, query, merged, limit);
  }
  return merged;
}
async function rerankSearchResults(rootDir, query, results, limit) {
  const provider = await getProviderForTask(rootDir, "queryProvider");
  const candidates = results.slice(0, Math.min(results.length, 20)).map((r, i) => `[${i}] ${r.title} \u2014 ${r.snippet || r.path}`).join("\n");
  const prompt = `Given the search query: "${query}"

Rank these results by relevance (most relevant first).

${candidates}`;
  try {
    const indices = await provider.generateStructured(
      { prompt, system: "You are a search result ranker." },
      z7.array(z7.number().int().nonnegative())
    );
    const reranked = [];
    const seen = /* @__PURE__ */ new Set();
    for (const idx of indices) {
      if (idx >= 0 && idx < results.length && !seen.has(idx)) {
        seen.add(idx);
        reranked.push(results[idx]);
      }
    }
    for (let i = 0; i < results.length && reranked.length < limit; i++) {
      if (!seen.has(i)) {
        reranked.push(results[i]);
      }
    }
    return reranked.slice(0, limit);
  } catch {
    return results.slice(0, limit);
  }
}
async function ensureCompiledGraph(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  if (!await fileExists(paths.searchDbPath) || !await fileExists(paths.graphPath)) {
    await compileVault(rootDir, {});
  }
  const graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    throw new Error("Graph artifact not found. Run `swarmvault compile` first.");
  }
  return graph;
}
async function runResolvedGraphQuery(rootDir, graph, question, options = {}) {
  const searchResults = await searchVault(rootDir, question, Math.max(5, options.budget ?? 10));
  const semanticMatches = await semanticGraphMatches(rootDir, graph, question, Math.max(8, options.budget ?? 12)).catch(() => []);
  return queryGraph(graph, question, searchResults, {
    ...options,
    semanticMatches
  });
}
async function queryGraphVault(rootDir, question, options = {}) {
  const graph = await ensureCompiledGraph(rootDir);
  return runResolvedGraphQuery(rootDir, graph, question, options);
}
async function benchmarkVault(rootDir, options = {}) {
  const { config, paths } = await loadVaultConfig(rootDir);
  const graph = await ensureCompiledGraph(rootDir);
  const manifests = await listManifests(rootDir);
  const pageContentsById = /* @__PURE__ */ new Map();
  let corpusWords = 0;
  const perClassCorpusWords = {
    first_party: 0,
    third_party: 0,
    resource: 0,
    generated: 0
  };
  for (const manifest of manifests) {
    const extractedText = await readExtractedText(rootDir, manifest);
    if (extractedText) {
      const words = estimateCorpusWords([extractedText]);
      corpusWords += words;
      const manifestClass = manifest.sourceClass ?? "first_party";
      perClassCorpusWords[manifestClass] = (perClassCorpusWords[manifestClass] ?? 0) + words;
    }
  }
  for (const page of graph.pages) {
    const absolutePath = path23.join(paths.wikiDir, page.path);
    if (!await fileExists(absolutePath)) {
      continue;
    }
    const parsed = matter11(await fs18.readFile(absolutePath, "utf8"));
    pageContentsById.set(page.id, parsed.content);
  }
  const configuredQuestions = (config.benchmark?.questions ?? []).map((question) => normalizeWhitespace(question)).filter(Boolean);
  const maxQuestions = Math.max(1, options.maxQuestions ?? config.benchmark?.maxQuestions ?? 3);
  const questions = (options.questions ?? []).map((question) => normalizeWhitespace(question)).filter(Boolean);
  const sampleQuestions = (questions.length ? questions : configuredQuestions.length ? configuredQuestions : defaultBenchmarkQuestionsForGraph(graph, maxQuestions)).slice(0, maxQuestions);
  const perQuestion = await Promise.all(
    sampleQuestions.map(async (question) => {
      const result = await runResolvedGraphQuery(rootDir, graph, question, { budget: 12 });
      const metrics = benchmarkQueryTokens(graph, result, pageContentsById);
      return {
        question,
        queryTokens: metrics.queryTokens,
        reduction: metrics.reduction,
        visitedNodeIds: result.visitedNodeIds,
        visitedEdgeIds: result.visitedEdgeIds,
        pageIds: result.pageIds
      };
    })
  );
  const perClassPerQuestion = {
    first_party: [],
    third_party: [],
    resource: [],
    generated: []
  };
  for (const sourceClass of ALL_SOURCE_CLASSES) {
    const filteredGraph = filterGraphBySourceClass(graph, sourceClass);
    if (!filteredGraph.nodes.length) {
      continue;
    }
    const classPageContents = /* @__PURE__ */ new Map();
    for (const page of filteredGraph.pages) {
      const content = pageContentsById.get(page.id);
      if (content !== void 0) {
        classPageContents.set(page.id, content);
      }
    }
    const classResults = await Promise.all(
      sampleQuestions.map(async (question) => {
        const result = await runResolvedGraphQuery(rootDir, filteredGraph, question, { budget: 12 });
        const metrics = benchmarkQueryTokens(filteredGraph, result, classPageContents);
        return {
          question,
          queryTokens: metrics.queryTokens,
          reduction: metrics.reduction,
          visitedNodeIds: result.visitedNodeIds,
          visitedEdgeIds: result.visitedEdgeIds,
          pageIds: result.pageIds
        };
      })
    );
    perClassPerQuestion[sourceClass] = classResults;
  }
  const byClass = buildBenchmarkByClass({
    graph,
    perClassCorpusWords,
    perClassPerQuestion
  });
  const artifact = buildBenchmarkArtifact({
    graph,
    corpusWords,
    questions: sampleQuestions,
    perQuestion,
    byClass
  });
  await writeJsonFile(paths.benchmarkPath, artifact);
  await refreshIndexesAndSearch(rootDir, graph.pages);
  const refreshedGraph = await readJsonFile(paths.graphPath) ?? graph;
  const refreshedHash = graphHash(refreshedGraph);
  if (artifact.graphHash === refreshedHash) {
    return artifact;
  }
  const refreshedArtifact = {
    ...artifact,
    graphHash: refreshedHash
  };
  await writeJsonFile(paths.benchmarkPath, refreshedArtifact);
  return refreshedArtifact;
}
async function pathGraphVault(rootDir, from, to) {
  const graph = await ensureCompiledGraph(rootDir);
  return shortestGraphPath(graph, from, to);
}
async function explainGraphVault(rootDir, target) {
  const graph = await ensureCompiledGraph(rootDir);
  return explainGraphTarget(graph, target);
}
async function listGraphHyperedges(rootDir, target, limit = 25) {
  const graph = await ensureCompiledGraph(rootDir);
  return listHyperedges(graph, target, limit);
}
function incrementCount(record, key) {
  if (!key) {
    return;
  }
  record[key] = (record[key] ?? 0) + 1;
}
async function graphStatsVault(rootDir) {
  const graph = await ensureCompiledGraph(rootDir);
  const sourceClasses = Object.fromEntries(
    ALL_SOURCE_CLASSES.map((sourceClass) => [sourceClass, { sources: 0, pages: 0, nodes: 0 }])
  );
  const nodeTypes = {};
  const evidenceClasses = {};
  const edgeRelations = {};
  const hyperedgeRelations = {};
  for (const source of graph.sources) {
    sourceClasses[source.sourceClass ?? "first_party"].sources += 1;
  }
  for (const page of graph.pages) {
    sourceClasses[page.sourceClass ?? "first_party"].pages += 1;
  }
  for (const node of graph.nodes) {
    nodeTypes[node.type] = (nodeTypes[node.type] ?? 0) + 1;
    sourceClasses[node.sourceClass ?? "first_party"].nodes += 1;
  }
  for (const edge of graph.edges) {
    incrementCount(edgeRelations, edge.relation);
    evidenceClasses[edge.evidenceClass] = (evidenceClasses[edge.evidenceClass] ?? 0) + 1;
  }
  for (const hyperedge of graph.hyperedges) {
    incrementCount(hyperedgeRelations, hyperedge.relation);
    evidenceClasses[hyperedge.evidenceClass] = (evidenceClasses[hyperedge.evidenceClass] ?? 0) + 1;
  }
  return {
    generatedAt: graph.generatedAt,
    counts: {
      sources: graph.sources.length,
      pages: graph.pages.length,
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      hyperedges: graph.hyperedges.length,
      communities: graph.communities?.length ?? 0
    },
    nodeTypes,
    evidenceClasses,
    sourceClasses,
    edgeRelations,
    hyperedgeRelations
  };
}
async function refreshGraphClusters(rootDir, options = {}) {
  const { config, paths } = await loadVaultConfig(rootDir);
  const schemas = await loadVaultSchemas(rootDir);
  const graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    throw new Error("No compiled graph found. Run `swarmvault compile` first.");
  }
  const metrics = deriveGraphMetrics(resetGraphNodeMetrics(graph.nodes), graph.edges, {
    resolution: options.resolution ?? config.graph?.communityResolution
  });
  const communities = metrics.communities ?? [];
  const nodes = applyNormLabel(metrics.nodes);
  const edges = pruneDanglingEdges(nodes, graph.edges);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const hyperedges = (graph.hyperedges ?? []).filter((hyperedge) => hyperedge.nodeIds.every((nodeId) => nodeIds.has(nodeId)));
  const refreshedGraph = {
    ...graph,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    nodes,
    edges,
    hyperedges,
    communities
  };
  const orientation = await buildGraphOrientationPages(refreshedGraph, paths, schemas.effective.global.hash, graph.generatedAt, [], config);
  const pages = sortGraphPages(
    uniqueBy(
      [
        ...refreshedGraph.pages.filter((page) => page.kind !== "graph_report" && page.kind !== "community_summary"),
        ...orientation.records.map((record) => record.page)
      ],
      (page) => page.id
    )
  );
  await writeJsonFile(paths.graphPath, {
    ...refreshedGraph,
    pages
  });
  await refreshIndexesAndSearch(rootDir, pages);
  return {
    graphPath: paths.graphPath,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    communityCount: communities.length,
    changedPages: orientation.records.map((record) => record.page.path),
    reportPath: path23.join(paths.wikiDir, "graph", "report.json")
  };
}
async function getGraphCommunityVault(rootDir, target, limit = 25) {
  const graph = await ensureCompiledGraph(rootDir);
  const communities = graph.communities ?? [];
  const normalizedTarget = computeNormLabel(target);
  const community = communities.find(
    (entry) => entry.id === target || computeNormLabel(entry.id) === normalizedTarget || computeNormLabel(entry.label) === normalizedTarget
  );
  if (!community) {
    throw new Error(`Could not resolve graph community: ${target}`);
  }
  const edgeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const nodeIds = new Set(community.nodeIds);
  const nodeById2 = new Map(graph.nodes.map((node) => [node.id, node]));
  const pages = graph.pages.filter((page) => page.nodeIds.some((nodeId) => nodeIds.has(nodeId))).sort((left, right) => left.path.localeCompare(right.path));
  const edges = graph.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)).sort(
    (left, right) => right.confidence - left.confidence || left.relation.localeCompare(right.relation) || left.id.localeCompare(right.id)
  );
  const nodes = community.nodeIds.map((nodeId) => nodeById2.get(nodeId)).filter((node) => Boolean(node)).sort((left, right) => (right.degree ?? 0) - (left.degree ?? 0) || left.label.localeCompare(right.label));
  return {
    generatedAt: graph.generatedAt,
    id: community.id,
    label: community.label,
    nodeCount: nodes.length,
    pageCount: pages.length,
    edgeCount: edges.length,
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      label: node.label,
      pageId: node.pageId,
      sourceClass: node.sourceClass,
      degree: node.degree,
      bridgeScore: node.bridgeScore,
      confidence: node.confidence
    })),
    pages: pages.map((page) => ({
      id: page.id,
      path: page.path,
      title: page.title,
      kind: page.kind,
      sourceClass: page.sourceClass,
      freshness: page.freshness
    })),
    edges: edges.slice(0, edgeLimit).map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceLabel: nodeById2.get(edge.source)?.label,
      targetLabel: nodeById2.get(edge.target)?.label,
      relation: edge.relation,
      evidenceClass: edge.evidenceClass,
      confidence: edge.confidence
    }))
  };
}
async function readGraphReport(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  return readJsonFile(path23.join(paths.wikiDir, "graph", "report.json"));
}
async function listGodNodes(rootDir, limit) {
  const graph = await ensureCompiledGraph(rootDir);
  const { config } = await loadVaultConfig(rootDir);
  const defaults = resolveLargeRepoDefaults({
    nodeCount: graph.nodes.length,
    config
  });
  const effectiveLimit = limit ?? defaults.godNodeLimit;
  return topGodNodes(graph, effectiveLimit);
}
async function blastRadiusVault(rootDir, target, options) {
  const graph = await ensureCompiledGraph(rootDir);
  return blastRadius(graph, target, options);
}
async function listPages(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  const graph = await readJsonFile(paths.graphPath);
  return graph?.pages ?? [];
}
async function readPage(rootDir, relativePath) {
  if (!relativePath) {
    return null;
  }
  const { paths } = await loadVaultConfig(rootDir);
  const absolutePath = path23.resolve(paths.wikiDir, relativePath);
  if (!isPathWithin(paths.wikiDir, absolutePath)) {
    return null;
  }
  const stats = await fs18.stat(absolutePath).catch(() => null);
  if (!stats?.isFile()) {
    return null;
  }
  const raw = await fs18.readFile(absolutePath, "utf8");
  const parsed = matter11(raw);
  return {
    path: relativePath,
    title: typeof parsed.data.title === "string" ? parsed.data.title : path23.basename(relativePath, path23.extname(relativePath)),
    frontmatter: parsed.data,
    content: parsed.content
  };
}
async function getWorkspaceInfo(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  const manifests = await listManifests(rootDir);
  const pages = await listPages(rootDir);
  return {
    rootDir,
    configPath: paths.configPath,
    schemaPath: paths.schemaPath,
    rawDir: paths.rawDir,
    wikiDir: paths.wikiDir,
    stateDir: paths.stateDir,
    agentDir: paths.agentDir,
    inboxDir: paths.inboxDir,
    sourceCount: manifests.length,
    pageCount: pages.length
  };
}
function extractClaimSectionLines(content) {
  const lines = content.split("\n");
  let inClaims = false;
  let found = false;
  const claimLines = [];
  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed === "## Claims") {
      inClaims = true;
      found = true;
      continue;
    }
    if (inClaims) {
      if (/^#{1,2}\s/.test(trimmed)) {
        inClaims = false;
        continue;
      }
      claimLines.push(line);
    }
  }
  return found ? claimLines : null;
}
function isClaimPlaceholderBullet(line) {
  const trimmed = line.trim();
  return /^-\s+No\s+claims\s+extracted\.?$/i.test(trimmed);
}
function tierLintFindings(paths, graph, consolidationConfig, now = /* @__PURE__ */ new Date()) {
  const findings = [];
  const resolved = {
    sessionWindowHours: consolidationConfig?.workingToEpisodic?.sessionWindowHours ?? 24
  };
  const pageIndex = new Map(graph.pages.map((page) => [page.id, page]));
  const staleCutoffMs = now.getTime() - resolved.sessionWindowHours * 60 * 60 * 1e3 * 2;
  for (const page of graph.pages) {
    if (page.kind !== "insight") {
      continue;
    }
    const tier = page.tier ?? "working";
    if (tier === "working" && !page.supersededBy) {
      const updatedMs = Date.parse(page.updatedAt);
      if (!Number.isNaN(updatedMs) && updatedMs < staleCutoffMs) {
        findings.push({
          severity: "info",
          code: "stale_working_tier",
          message: `Working-tier insight ${page.title} has not been consolidated after the session window.`,
          pagePath: path23.join(paths.wikiDir, page.path),
          relatedPageIds: [page.id]
        });
      }
    }
    if ((tier === "episodic" || tier === "semantic" || tier === "procedural") && page.consolidatedFromPageIds?.length) {
      const missing = page.consolidatedFromPageIds.filter((id) => !pageIndex.has(id));
      if (missing.length > 0) {
        findings.push({
          severity: "warning",
          code: "broken_consolidation_basis",
          message: `Tier page ${page.title} references missing lower-tier page ids: ${missing.join(", ")}.`,
          pagePath: path23.join(paths.wikiDir, page.path),
          relatedPageIds: [page.id]
        });
      }
    }
    if (tier === "semantic" && (!page.consolidatedFromPageIds || page.consolidatedFromPageIds.length === 0)) {
      findings.push({
        severity: "warning",
        code: "semantic_without_episodic_basis",
        message: `Semantic-tier page ${page.title} has no episodic basis recorded.`,
        pagePath: path23.join(paths.wikiDir, page.path),
        relatedPageIds: [page.id]
      });
    }
  }
  return findings;
}
function decayLintFindings(paths, graph, freshnessConfig, now = /* @__PURE__ */ new Date()) {
  const findings = [];
  const decayConfig = resolveDecayConfig(freshnessConfig);
  const staleThreshold = decayConfig.staleThreshold ?? 0.3;
  const pageIndex = new Map(graph.pages.map((page) => [page.id, page]));
  for (const page of graph.pages) {
    const score = typeof page.decayScore === "number" ? page.decayScore : 1;
    const belowThreshold = score < staleThreshold;
    const supersededBy = page.supersededBy;
    if (belowThreshold && !supersededBy) {
      findings.push({
        severity: "info",
        code: "decayed-pages",
        message: `Page ${page.title} has decayed (score=${score.toFixed(2)}, below threshold ${staleThreshold}).`,
        pagePath: path23.join(paths.wikiDir, page.path),
        relatedPageIds: [page.id]
      });
    }
    if (supersededBy && !pageIndex.has(supersededBy)) {
      findings.push({
        severity: "warning",
        code: "broken_supersession",
        message: `Page ${page.title} is marked supersededBy ${supersededBy}, but that page does not exist.`,
        pagePath: path23.join(paths.wikiDir, page.path),
        relatedPageIds: [page.id]
      });
    }
    if (page.freshness === "stale" && !supersededBy && score >= staleThreshold) {
      findings.push({
        severity: "info",
        code: "inconsistent_decay",
        message: `Page ${page.title} is marked stale but decay score ${score.toFixed(2)} is above the threshold.`,
        pagePath: path23.join(paths.wikiDir, page.path),
        relatedPageIds: [page.id]
      });
    }
  }
  void now;
  return findings;
}
function structuralLintFindings(_rootDir, paths, graph, schemas, manifests, sourceProjects) {
  const manifestMap = new Map(manifests.map((manifest) => [manifest.sourceId, manifest]));
  const pageMap2 = new Map(graph.pages.map((page) => [page.id, page]));
  return Promise.all(
    graph.pages.map(async (page) => {
      const findings = [];
      if (page.kind === "insight") {
        return findings;
      }
      if (page.schemaHash !== expectedSchemaHashForPage(page, schemas, pageMap2, sourceProjects)) {
        findings.push({
          severity: "warning",
          code: "stale_page",
          message: `Page ${page.title} is stale because the vault schema changed.`,
          pagePath: path23.join(paths.wikiDir, page.path),
          relatedPageIds: [page.id]
        });
      }
      const freshnessHashes = Object.keys(page.sourceSemanticHashes).length ? page.sourceSemanticHashes : page.sourceHashes;
      for (const [sourceId, knownHash] of Object.entries(freshnessHashes)) {
        const manifest = manifestMap.get(sourceId);
        const manifestHash = manifest?.semanticHash ?? manifest?.contentHash;
        if (manifestHash && manifestHash !== knownHash) {
          findings.push({
            severity: "warning",
            code: "stale_page",
            message: `Page ${page.title} is stale because source ${sourceId} changed.`,
            pagePath: path23.join(paths.wikiDir, page.path),
            relatedSourceIds: [sourceId],
            relatedPageIds: [page.id]
          });
        }
      }
      if (page.kind !== "index" && page.backlinks.length === 0) {
        findings.push({
          severity: "info",
          code: "orphan_page",
          message: `Page ${page.title} has no backlinks.`,
          pagePath: path23.join(paths.wikiDir, page.path),
          relatedPageIds: [page.id]
        });
      }
      const absolutePath = path23.join(paths.wikiDir, page.path);
      if (await fileExists(absolutePath)) {
        const content = await fs18.readFile(absolutePath, "utf8");
        const claimLines = extractClaimSectionLines(content);
        if (claimLines !== null) {
          const uncited = claimLines.filter(
            (line) => line.startsWith("- ") && !line.includes("[source:") && !isClaimPlaceholderBullet(line)
          );
          if (uncited.length) {
            findings.push({
              severity: "warning",
              code: "uncited_claims",
              message: `Page ${page.title} contains uncited claim bullets.`,
              pagePath: absolutePath,
              relatedPageIds: [page.id]
            });
          }
        }
      }
      return findings;
    })
  ).then((results) => results.flat());
}
async function lintVault(rootDir, options = {}) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (options.web && !options.deep) {
    throw new Error("`--web` can only be used together with `--deep`.");
  }
  const { config, paths } = await loadVaultConfig(rootDir);
  const schemas = await loadVaultSchemas(rootDir);
  const manifests = await listManifests(rootDir);
  const sourceProjects = resolveSourceProjects(rootDir, manifests, config);
  const graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    const findings2 = [
      {
        severity: "warning",
        code: "graph_missing",
        message: "No graph artifact found. Run `swarmvault compile` first."
      }
    ];
    await recordSession(rootDir, {
      operation: "lint",
      title: "Linted 0 page(s)",
      startedAt,
      finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      success: true,
      lintFindingCount: findings2.length,
      lines: [
        `findings=${findings2.length}`,
        `deep=${Boolean(options.deep)}`,
        `web=${Boolean(options.web)}`,
        `conflicts=${Boolean(options.conflicts)}`
      ]
    });
    return findings2;
  }
  const contradictionFindings = options.conflicts ? graph.edges.filter((edge) => edge.relation === "contradicts").map((edge) => {
    const sourceIdA = edge.provenance[0] ?? edge.source.replace(/^source:/, "");
    const sourceIdB = edge.provenance[1] ?? edge.target.replace(/^source:/, "");
    return {
      severity: "warning",
      code: "contradiction",
      message: `Contradicting claims detected between source "${sourceIdA}" and source "${sourceIdB}".`,
      relatedSourceIds: [sourceIdA, sourceIdB]
    };
  }) : [];
  if (options.conflicts && !options.deep && !options.decay) {
    await recordSession(rootDir, {
      operation: "lint",
      title: `Linted ${graph.pages.length} page(s)`,
      startedAt,
      finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      success: true,
      relatedPageIds: graph.pages.map((page) => page.id),
      relatedSourceIds: uniqueStrings4(graph.pages.flatMap((page) => page.sourceIds)),
      lintFindingCount: contradictionFindings.length,
      lines: [`findings=${contradictionFindings.length}`, `deep=false`, `web=false`, `conflicts=true`]
    });
    return contradictionFindings;
  }
  if (options.decay && !options.deep && !options.conflicts && !options.tiers) {
    const decayFindings = decayLintFindings(paths, graph, config.freshness);
    await recordSession(rootDir, {
      operation: "lint",
      title: `Linted ${graph.pages.length} page(s)`,
      startedAt,
      finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      success: true,
      relatedPageIds: graph.pages.map((page) => page.id),
      relatedSourceIds: uniqueStrings4(graph.pages.flatMap((page) => page.sourceIds)),
      lintFindingCount: decayFindings.length,
      lines: [`findings=${decayFindings.length}`, `deep=false`, `web=false`, `conflicts=false`, `decay=true`]
    });
    return decayFindings;
  }
  if (options.tiers && !options.deep && !options.conflicts && !options.decay) {
    const tierFindings = tierLintFindings(paths, graph, config.consolidation);
    await recordSession(rootDir, {
      operation: "lint",
      title: `Linted ${graph.pages.length} page(s)`,
      startedAt,
      finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      success: true,
      relatedPageIds: graph.pages.map((page) => page.id),
      relatedSourceIds: uniqueStrings4(graph.pages.flatMap((page) => page.sourceIds)),
      lintFindingCount: tierFindings.length,
      lines: [`findings=${tierFindings.length}`, `deep=false`, `web=false`, `conflicts=false`, `tiers=true`]
    });
    return tierFindings;
  }
  const findings = await structuralLintFindings(rootDir, paths, graph, schemas, manifests, sourceProjects);
  findings.push(...decayLintFindings(paths, graph, config.freshness));
  findings.push(...tierLintFindings(paths, graph, config.consolidation));
  if (options.conflicts) {
    findings.push(...contradictionFindings);
  }
  if (options.deep) {
    findings.push(...await runDeepLint(rootDir, findings, { web: options.web }));
  }
  const provider = options.deep ? await getProviderForTask(rootDir, "lintProvider") : void 0;
  await recordSession(rootDir, {
    operation: "lint",
    title: `Linted ${graph.pages.length} page(s)`,
    startedAt,
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    providerId: provider?.id,
    success: true,
    relatedPageIds: graph.pages.map((page) => page.id),
    relatedSourceIds: uniqueStrings4(graph.pages.flatMap((page) => page.sourceIds)),
    lintFindingCount: findings.length,
    lines: [
      `findings=${findings.length}`,
      `deep=${Boolean(options.deep)}`,
      `web=${Boolean(options.web)}`,
      `conflicts=${Boolean(options.conflicts)}`,
      `decay=${Boolean(options.decay)}`
    ]
  });
  return findings;
}
async function bootstrapDemo(rootDir, input) {
  await initVault(rootDir);
  if (!input) {
    return {};
  }
  const manifest = await ingestInput(rootDir, input);
  const compile = await compileVault(rootDir, {});
  return {
    manifestId: manifest.sourceId,
    compile
  };
}
async function consolidateVault(rootDir, options = {}) {
  const { config } = await loadVaultConfig(rootDir);
  return runConsolidation(rootDir, config.consolidation ?? {}, void 0, { dryRun: options.dryRun ?? false });
}

// src/context-packs.ts
var DEFAULT_CONTEXT_BUDGET_TOKENS = 8e3;
var MIN_CONTEXT_BUDGET_TOKENS = 200;
var MAX_PAGE_EXCERPT_CHARS = 2200;
var MAX_NODE_EXCERPT_CHARS = 900;
function uniqueStrings5(values) {
  return uniqueBy(values.filter(Boolean), (value) => value);
}
function contextPackDirs(paths) {
  return {
    stateDir: path24.join(paths.stateDir, "context-packs"),
    wikiDir: path24.join(paths.wikiDir, "context")
  };
}
function contextPackSummary(pack) {
  return {
    id: pack.id,
    title: pack.title,
    goal: pack.goal,
    target: pack.target,
    createdAt: pack.createdAt,
    budgetTokens: pack.budgetTokens,
    estimatedTokens: pack.estimatedTokens,
    artifactPath: pack.artifactPath,
    markdownPath: pack.markdownPath,
    itemCount: pack.items.length,
    omittedCount: pack.omittedItems.length
  };
}
async function ensureCompiledGraph2(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  if (!await fileExists(paths.graphPath) || !await fileExists(paths.searchDbPath)) {
    await compileVault(rootDir, {});
  }
  const graph = await readJsonFile(paths.graphPath);
  if (!graph) {
    throw new Error("Graph artifact not found. Run `swarmvault compile` first.");
  }
  return graph;
}
function candidateId(kind, id) {
  return `${kind}:${id}`;
}
function pageExcerpt(content) {
  return truncate(normalizeWhitespace(content), MAX_PAGE_EXCERPT_CHARS);
}
function nodeExcerpt(node) {
  const parts = [
    `Node type: ${node.type}.`,
    node.freshness ? `Freshness: ${node.freshness}.` : void 0,
    node.confidence === void 0 ? void 0 : `Confidence: ${node.confidence}.`,
    node.degree === void 0 ? void 0 : `Degree: ${node.degree}.`,
    node.bridgeScore === void 0 ? void 0 : `Bridge score: ${node.bridgeScore}.`,
    node.surpriseReason
  ].filter((part) => Boolean(part));
  return truncate(parts.join(" "), MAX_NODE_EXCERPT_CHARS);
}
function edgeTitle(edge, nodesById) {
  const source = nodesById.get(edge.source)?.label ?? edge.source;
  const target = nodesById.get(edge.target)?.label ?? edge.target;
  return `${source} ${edge.relation} ${target}`;
}
function edgeExcerpt(edge) {
  const provenance = edge.provenance.length ? ` Provenance: ${edge.provenance.join(", ")}.` : "";
  return `Relation: ${edge.relation}. Evidence: ${edge.evidenceClass}. Confidence: ${edge.confidence}.${provenance}`;
}
function hyperedgeExcerpt(hyperedge) {
  const sources = hyperedge.sourcePageIds.length ? ` Source pages: ${hyperedge.sourcePageIds.join(", ")}.` : "";
  return `Group pattern: ${hyperedge.relation}. Evidence: ${hyperedge.evidenceClass}. Confidence: ${hyperedge.confidence}. ${hyperedge.why}${sources}`;
}
function normalizeMemoryMatch(value) {
  return (value ?? "").trim().replace(/^wiki\//, "").replace(/^\.\//, "").toLowerCase();
}
function memoryTaskContextScore(task, options) {
  if (options.memoryTaskId && task.id === options.memoryTaskId) {
    return { reason: "active memory task", score: 126 };
  }
  const target = normalizeMemoryMatch(options.target);
  const goal = normalizeMemoryMatch(options.goal);
  const taskTarget = normalizeMemoryMatch(task.target);
  const directTarget = target.length > 0 && (taskTarget.length > 0 && (taskTarget.includes(target) || target.includes(taskTarget)) || task.changedPaths.some((changedPath) => {
    const normalized = normalizeMemoryMatch(changedPath);
    return normalized.length > 0 && (normalized.includes(target) || target.includes(normalized));
  }));
  if (directTarget) {
    return { reason: "directly related memory task", score: task.status === "completed" ? 108 : 116 };
  }
  const taskText = normalizeMemoryMatch(`${task.goal} ${task.title} ${task.decisions.map((decision) => decision.text).join(" ")}`);
  if (goal.length > 0 && taskText.includes(goal)) {
    return { reason: "memory task matches goal", score: 96 };
  }
  if ((task.status === "active" || task.status === "blocked") && task.followUps.length) {
    return { reason: "unresolved memory follow-ups", score: 90 };
  }
  if (task.decisions.length) {
    return { reason: "recent memory decisions", score: 82 };
  }
  return null;
}
async function buildPageCandidate(rootDir, page, reason, score) {
  const stored = await readPage(rootDir, page.path);
  if (!stored) {
    return null;
  }
  return {
    id: candidateId("page", page.id),
    kind: "page",
    title: page.title,
    reason,
    score,
    excerpt: pageExcerpt(stored.content),
    path: page.path,
    pageId: page.id,
    sourceIds: page.sourceIds,
    pageIds: [page.id],
    nodeIds: page.nodeIds,
    edgeIds: [],
    freshness: page.freshness,
    confidence: page.confidence
  };
}
function renderMemoryFallback(task) {
  return [
    task.title,
    `Goal: ${task.goal}`,
    `Status: ${task.status}`,
    task.target ? `Target: ${task.target}` : void 0,
    task.decisions.length ? `Decisions: ${task.decisions.map((decision) => decision.text).join("; ")}` : void 0,
    task.followUps.length ? `Follow-ups: ${task.followUps.join("; ")}` : void 0,
    task.changedPaths.length ? `Changed paths: ${task.changedPaths.join(", ")}` : void 0,
    task.outcome ? `Outcome: ${task.outcome}` : void 0
  ].filter((line) => Boolean(line)).join("\n");
}
async function buildMemoryTaskCandidate(rootDir, task, reason, score) {
  const { paths } = await loadVaultConfig(rootDir);
  const markdownPath = path24.resolve(task.markdownPath);
  const content = await fs19.readFile(markdownPath, "utf8").catch(() => "");
  const pathRef = isPathWithin(paths.wikiDir, markdownPath) ? toPosix(path24.relative(paths.wikiDir, markdownPath)) : toPosix(task.markdownPath);
  const pageId = `memory:${task.id}`;
  const decisionNodeIds = task.decisions.map((decision) => `decision:${task.id}:${decision.id}`);
  return {
    id: candidateId("page", pageId),
    kind: "page",
    title: task.title,
    reason,
    score,
    excerpt: pageExcerpt(content || renderMemoryFallback(task)),
    path: pathRef,
    pageId,
    sourceIds: task.sourceIds,
    pageIds: uniqueStrings5([pageId, ...task.pageIds]),
    nodeIds: uniqueStrings5([pageId, ...decisionNodeIds, ...task.nodeIds]),
    edgeIds: [],
    freshness: task.status === "completed" || task.status === "archived" ? "fresh" : "stale",
    confidence: 1
  };
}
function buildNodeCandidate(node, reason, score) {
  return {
    id: candidateId("node", node.id),
    kind: "node",
    title: node.label,
    reason,
    score,
    excerpt: nodeExcerpt(node),
    pageId: node.pageId,
    nodeId: node.id,
    sourceIds: node.sourceIds,
    pageIds: node.pageId ? [node.pageId] : [],
    nodeIds: [node.id],
    edgeIds: [],
    freshness: node.freshness,
    confidence: node.confidence
  };
}
function buildEdgeCandidate(edge, nodesById, reason, score) {
  return {
    id: candidateId("edge", edge.id),
    kind: "edge",
    title: edgeTitle(edge, nodesById),
    reason,
    score,
    excerpt: edgeExcerpt(edge),
    edgeId: edge.id,
    sourceIds: edge.provenance,
    pageIds: [],
    nodeIds: [edge.source, edge.target],
    edgeIds: [edge.id],
    evidenceClass: edge.evidenceClass,
    confidence: edge.confidence
  };
}
function buildHyperedgeCandidate(hyperedge, reason, score) {
  return {
    id: candidateId("hyperedge", hyperedge.id),
    kind: "hyperedge",
    title: hyperedge.label,
    reason,
    score,
    excerpt: hyperedgeExcerpt(hyperedge),
    hyperedgeId: hyperedge.id,
    sourceIds: [],
    pageIds: hyperedge.sourcePageIds,
    nodeIds: hyperedge.nodeIds,
    edgeIds: [],
    evidenceClass: hyperedge.evidenceClass,
    confidence: hyperedge.confidence
  };
}
function contextItemHeader(item) {
  const lines = [`### ${item.kind}: ${item.title}`, "", `- Reason: ${item.reason}`];
  if (item.path) lines.push(`- Path: wiki/${item.path}`);
  if (item.pageId) lines.push(`- Page ID: ${item.pageId}`);
  if (item.nodeId) lines.push(`- Node ID: ${item.nodeId}`);
  if (item.edgeId) lines.push(`- Edge ID: ${item.edgeId}`);
  if (item.hyperedgeId) lines.push(`- Hyperedge ID: ${item.hyperedgeId}`);
  if (item.freshness) lines.push(`- Freshness: ${item.freshness}`);
  if (item.evidenceClass) lines.push(`- Evidence: ${item.evidenceClass}`);
  if (item.confidence !== void 0) lines.push(`- Confidence: ${item.confidence}`);
  lines.push(`- Sources: ${item.sourceIds.join(", ") || "none"}`);
  return lines.join("\n");
}
function renderContextItem(item) {
  return [contextItemHeader(item), "", item.excerpt ? item.excerpt : "No excerpt available.", ""].join("\n");
}
function withEstimatedTokens(candidate) {
  const item = {
    ...candidate,
    sourceIds: uniqueStrings5(candidate.sourceIds),
    pageIds: uniqueStrings5(candidate.pageIds),
    nodeIds: uniqueStrings5(candidate.nodeIds),
    edgeIds: uniqueStrings5(candidate.edgeIds)
  };
  return {
    ...item,
    estimatedTokens: estimateTokens(renderContextItem({ ...item, estimatedTokens: 0 }))
  };
}
function shrinkItemToBudget(item, remainingTokens) {
  if (!item.excerpt || remainingTokens < 80) {
    return null;
  }
  const charBudget = Math.max(160, remainingTokens * 3);
  const shrunk = {
    ...item,
    excerpt: truncate(item.excerpt, charBudget)
  };
  const estimatedTokens = estimateTokens(renderContextItem({ ...shrunk, estimatedTokens: 0 }));
  if (estimatedTokens > remainingTokens) {
    return null;
  }
  return { ...shrunk, estimatedTokens };
}
function fitItemsToBudget(candidates, budgetTokens) {
  const estimated = candidates.map(withEstimatedTokens).sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
  const items = [];
  const omittedItems = [];
  let usedTokens = estimateTokens("# Context Pack\n\n## Included Context\n\n");
  for (const item of estimated) {
    const remaining = budgetTokens - usedTokens;
    if (item.estimatedTokens <= remaining) {
      items.push(item);
      usedTokens += item.estimatedTokens;
      continue;
    }
    const shrunk = items.length === 0 ? shrinkItemToBudget(item, remaining) : null;
    if (shrunk) {
      items.push(shrunk);
      usedTokens += shrunk.estimatedTokens;
      continue;
    }
    omittedItems.push({
      id: item.id,
      kind: item.kind,
      title: item.title,
      reason: "token_budget_exceeded",
      estimatedTokens: item.estimatedTokens
    });
  }
  return { items, omittedItems };
}
function collectRelatedIds(items, graphQuery) {
  const relatedPageIds = uniqueStrings5([...graphQuery.pageIds, ...items.flatMap((item) => item.pageIds)]);
  const relatedNodeIds = uniqueStrings5([...graphQuery.visitedNodeIds, ...items.flatMap((item) => item.nodeIds)]);
  const relatedSourceIds = uniqueStrings5(items.flatMap((item) => item.sourceIds));
  return {
    citations: relatedSourceIds,
    relatedPageIds,
    relatedNodeIds,
    relatedSourceIds
  };
}
function titleForGoal(goal) {
  return `Context Pack: ${truncate(normalizeWhitespace(goal), 72)}`;
}
async function uniqueContextPackPaths(rootDir, createdAt, goal) {
  const { paths } = await loadVaultConfig(rootDir);
  const dirs = contextPackDirs(paths);
  await ensureDir(dirs.stateDir);
  await ensureDir(dirs.wikiDir);
  const timestamp = createdAt.replace(/[:.]/g, "-");
  const base = `${timestamp}-${slugify(goal)}`;
  let id = base;
  let artifactPath = path24.join(dirs.stateDir, `${id}.json`);
  let markdownPath = path24.join(dirs.wikiDir, `${id}.md`);
  let counter = 2;
  while (await fileExists(artifactPath) || await fileExists(markdownPath)) {
    id = `${base}-${counter}`;
    artifactPath = path24.join(dirs.stateDir, `${id}.json`);
    markdownPath = path24.join(dirs.wikiDir, `${id}.md`);
    counter++;
  }
  return { id, artifactPath, markdownPath };
}
function renderContextPackMarkdown(pack) {
  const lines = [
    `# ${pack.title}`,
    "",
    `Goal: ${pack.goal}`,
    pack.target ? `Target: ${pack.target}` : void 0,
    `Created: ${pack.createdAt}`,
    `Budget: ${pack.budgetTokens} tokens`,
    `Estimated: ${pack.estimatedTokens} tokens`,
    "",
    "## Agent Instructions",
    "",
    "Use this pack as bounded SwarmVault context. Prefer cited source IDs and page IDs over unsupported inference. If the task needs omitted context, ask for a larger budget or a narrower target.",
    "",
    "## Graph Orientation",
    "",
    "```text",
    pack.graphQuery.summary,
    "```",
    "",
    "## Included Context",
    "",
    pack.items.length ? pack.items.map(renderContextItem).join("\n") : "No context items fit the requested token budget.",
    "",
    "## Omitted Context",
    "",
    pack.omittedItems.length ? pack.omittedItems.map((item) => `- ${item.kind}: ${item.title} (${item.reason}, ~${item.estimatedTokens} tokens)`).join("\n") : "- none",
    "",
    "## Citations",
    "",
    pack.citations.length ? pack.citations.map((citation) => `- ${citation}`).join("\n") : "- none",
    ""
  ].filter((line) => line !== void 0);
  return lines.join("\n");
}
function renderContextPackLlms(pack) {
  return [
    `# ${pack.title}`,
    "",
    `Goal: ${pack.goal}`,
    pack.target ? `Target: ${pack.target}` : void 0,
    "",
    "Use these cited vault facts as the working context. Do not treat omitted items as absent from the vault.",
    "",
    "## Files and Pages",
    "",
    pack.items.filter((item) => item.kind === "page").map((item) => `- ${item.path ?? item.pageId}: ${item.title} | sources=${item.sourceIds.join(",") || "none"}`).join("\n") || "- none",
    "",
    "## Evidence",
    "",
    pack.items.map((item) => renderContextItem(item)).join("\n"),
    "",
    "## Omitted",
    "",
    pack.omittedItems.length ? pack.omittedItems.map((item) => `- ${item.id}: ${item.reason}`).join("\n") : "- none",
    ""
  ].filter((line) => line !== void 0).join("\n");
}
function renderForFormat(pack, format) {
  if (format === "json") {
    return JSON.stringify(pack, null, 2);
  }
  if (format === "llms") {
    return renderContextPackLlms(pack);
  }
  return renderContextPackMarkdown(pack);
}
function markdownPageForPack(pack) {
  const relativeArtifactPath = toPosix(path24.relative(path24.dirname(pack.markdownPath), pack.artifactPath));
  return matter12.stringify(renderContextPackMarkdown(pack), {
    page_id: `context:${pack.id}`,
    kind: "output",
    title: pack.title,
    tags: ["context-pack", "agent-memory"],
    source_ids: pack.relatedSourceIds,
    node_ids: pack.relatedNodeIds,
    freshness: "fresh",
    status: "active",
    confidence: 1,
    created_at: pack.createdAt,
    updated_at: pack.createdAt,
    managed_by: "system",
    context_pack_id: pack.id,
    goal: pack.goal,
    target: pack.target,
    budget_tokens: pack.budgetTokens,
    estimated_tokens: pack.estimatedTokens,
    artifact_path: relativeArtifactPath
  });
}
async function buildContextPack(rootDir, options) {
  const goal = normalizeWhitespace(options.goal);
  if (!goal) {
    throw new Error("Context pack goal is required.");
  }
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const format = options.format ?? "markdown";
  const budgetTokens = Math.max(MIN_CONTEXT_BUDGET_TOKENS, options.budgetTokens ?? DEFAULT_CONTEXT_BUDGET_TOKENS);
  const graph = await ensureCompiledGraph2(rootDir);
  const queryText = options.target ? `${goal} ${options.target}` : goal;
  const graphQuery = await queryGraphVault(rootDir, queryText, {
    budget: Math.max(8, Math.min(50, Math.ceil(budgetTokens / 350)))
  });
  const searchResults = await searchVault(rootDir, queryText, 10);
  const pagesById = new Map(graph.pages.map((page) => [page.id, page]));
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const edgesById = new Map(graph.edges.map((edge) => [edge.id, edge]));
  const hyperedgesById = new Map((graph.hyperedges ?? []).map((hyperedge) => [hyperedge.id, hyperedge]));
  const candidates = /* @__PURE__ */ new Map();
  const addCandidate = (candidate) => {
    if (!candidate) return;
    const existing = candidates.get(candidate.id);
    if (!existing || candidate.score > existing.score) {
      candidates.set(candidate.id, candidate);
    }
  };
  if (options.target) {
    const explanation = await explainGraphVault(rootDir, options.target).catch(() => null);
    if (explanation?.node) {
      addCandidate(buildNodeCandidate(explanation.node, "target explanation", 120));
      if (explanation.page) {
        addCandidate(await buildPageCandidate(rootDir, explanation.page, "target page", 118));
      }
      for (const neighbor of explanation.neighbors.slice(0, 6)) {
        const node = nodesById.get(neighbor.nodeId);
        if (node) {
          addCandidate(buildNodeCandidate(node, `target neighbor via ${neighbor.relation}`, 86));
        }
      }
      for (const hyperedge of explanation.hyperedges.slice(0, 4)) {
        addCandidate(buildHyperedgeCandidate(hyperedge, "target group pattern", 84));
      }
    }
  }
  const memorySummaries = await import("./memory-IYJBJKXK.js").then(({ listMemoryTasks: listMemoryTasks2 }) => listMemoryTasks2(rootDir)).catch(() => []);
  const memorySummaryIds = uniqueStrings5([
    ...options.memoryTaskId ? [options.memoryTaskId] : [],
    ...memorySummaries.slice(0, 20).map((summary) => summary.id)
  ]);
  if (memorySummaryIds.length) {
    const { readMemoryTask: readMemoryTask2 } = await import("./memory-IYJBJKXK.js");
    for (const taskId of memorySummaryIds) {
      const task = await readMemoryTask2(rootDir, taskId).catch(() => null);
      if (!task) {
        continue;
      }
      const scored = memoryTaskContextScore(task, options);
      if (!scored) {
        continue;
      }
      addCandidate(await buildMemoryTaskCandidate(rootDir, task, scored.reason, scored.score));
    }
  }
  for (const [index, pageId] of graphQuery.pageIds.entries()) {
    const page = pagesById.get(pageId);
    addCandidate(page ? await buildPageCandidate(rootDir, page, "graph traversal page", 100 - index) : null);
  }
  for (const [index, result] of searchResults.entries()) {
    const page = pagesById.get(result.pageId);
    addCandidate(page ? await buildPageCandidate(rootDir, page, `local search hit: ${result.snippet || result.title}`, 92 - index) : null);
  }
  for (const [index, nodeId] of graphQuery.visitedNodeIds.entries()) {
    const node = nodesById.get(nodeId);
    if (node) {
      addCandidate(buildNodeCandidate(node, "graph traversal node", 76 - Math.min(index, 30)));
    }
  }
  for (const [index, edgeId] of graphQuery.visitedEdgeIds.entries()) {
    const edge = edgesById.get(edgeId);
    if (edge) {
      addCandidate(buildEdgeCandidate(edge, nodesById, "graph traversal edge", 70 - Math.min(index, 25)));
    }
  }
  for (const [index, hyperedgeId] of graphQuery.hyperedgeIds.entries()) {
    const hyperedge = hyperedgesById.get(hyperedgeId);
    if (hyperedge) {
      addCandidate(buildHyperedgeCandidate(hyperedge, "graph group pattern", 68 - Math.min(index, 20)));
    }
  }
  const { items, omittedItems } = fitItemsToBudget([...candidates.values()], budgetTokens);
  const paths = await uniqueContextPackPaths(rootDir, createdAt, goal);
  const related = collectRelatedIds(items, graphQuery);
  const pack = {
    id: paths.id,
    title: titleForGoal(goal),
    goal,
    target: options.target,
    createdAt,
    format,
    budgetTokens,
    estimatedTokens: estimateTokens(items.map(renderContextItem).join("\n")),
    artifactPath: paths.artifactPath,
    markdownPath: paths.markdownPath,
    ...related,
    graphQuery,
    items,
    omittedItems
  };
  await writeJsonFile(paths.artifactPath, pack);
  await fs19.writeFile(paths.markdownPath, markdownPageForPack(pack), "utf8");
  await recordSession(rootDir, {
    operation: "context",
    title: goal,
    startedAt: createdAt,
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    success: true,
    relatedSourceIds: pack.relatedSourceIds,
    relatedPageIds: pack.relatedPageIds,
    relatedNodeIds: pack.relatedNodeIds,
    changedPages: [toPosix(path24.relative(rootDir, paths.markdownPath)), toPosix(path24.relative(rootDir, paths.artifactPath))],
    citations: pack.citations,
    lines: [
      `Context pack: ${pack.id}`,
      `Budget: ${pack.budgetTokens} tokens`,
      `Included: ${pack.items.length}`,
      `Omitted: ${pack.omittedItems.length}`
    ]
  });
  if (options.memoryTaskId) {
    const { updateMemoryTask: updateMemoryTask2 } = await import("./memory-IYJBJKXK.js");
    await updateMemoryTask2(rootDir, options.memoryTaskId, { contextPackId: pack.id });
  }
  return {
    pack,
    artifactPath: paths.artifactPath,
    markdownPath: paths.markdownPath,
    rendered: renderForFormat(pack, format)
  };
}
async function listContextPacks(rootDir) {
  const { paths } = await loadVaultConfig(rootDir);
  const dirs = contextPackDirs(paths);
  const entries = await fs19.readdir(dirs.stateDir, { withFileTypes: true }).catch(() => []);
  const packs = await Promise.all(
    entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map(async (entry) => await readJsonFile(path24.join(dirs.stateDir, entry.name)))
  );
  return packs.filter((pack) => Boolean(pack)).map(contextPackSummary).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
async function resolveContextPackArtifactPath(rootDir, target) {
  const { paths } = await loadVaultConfig(rootDir);
  const dirs = contextPackDirs(paths);
  const direct = path24.resolve(rootDir, target);
  if (isPathWithin(dirs.stateDir, direct) && direct.endsWith(".json") && await fileExists(direct)) {
    return direct;
  }
  const byId = path24.resolve(dirs.stateDir, `${target.replace(/\.json$/, "")}.json`);
  if (isPathWithin(dirs.stateDir, byId) && await fileExists(byId)) {
    return byId;
  }
  const summaries = await listContextPacks(rootDir);
  const match = summaries.find((summary) => summary.id === target || path24.basename(summary.artifactPath, ".json") === target);
  return match?.artifactPath ?? null;
}
async function readContextPack(rootDir, target) {
  const artifactPath = await resolveContextPackArtifactPath(rootDir, target);
  return artifactPath ? await readJsonFile(artifactPath) : null;
}
async function deleteContextPack(rootDir, target) {
  const pack = await readContextPack(rootDir, target);
  if (!pack) {
    return null;
  }
  const { paths } = await loadVaultConfig(rootDir);
  const dirs = contextPackDirs(paths);
  const artifactPath = path24.resolve(pack.artifactPath);
  const markdownPath = path24.resolve(pack.markdownPath);
  if (isPathWithin(dirs.stateDir, artifactPath)) {
    await fs19.rm(artifactPath, { force: true });
  }
  if (isPathWithin(dirs.wikiDir, markdownPath)) {
    await fs19.rm(markdownPath, { force: true });
  }
  return contextPackSummary(pack);
}

// src/memory.ts
var DEFAULT_MEMORY_CONTEXT_BUDGET = 8e3;
var memoryTaskStatusSchema = z8.enum(["active", "blocked", "completed", "archived"]);
var memoryNoteSchema = z8.object({
  id: z8.string().min(1),
  text: z8.string().min(1),
  createdAt: z8.string().min(1)
});
var memoryDecisionSchema = memoryNoteSchema;
var memoryTaskSchema = z8.object({
  id: z8.string().min(1),
  title: z8.string().min(1),
  goal: z8.string().min(1),
  status: memoryTaskStatusSchema,
  target: z8.string().optional(),
  agent: z8.string().optional(),
  createdAt: z8.string().min(1),
  updatedAt: z8.string().min(1),
  contextPackIds: z8.array(z8.string()).default([]),
  sessionIds: z8.array(z8.string()).default([]),
  sourceIds: z8.array(z8.string()).default([]),
  pageIds: z8.array(z8.string()).default([]),
  nodeIds: z8.array(z8.string()).default([]),
  changedPaths: z8.array(z8.string()).default([]),
  gitRefs: z8.array(z8.string()).default([]),
  notes: z8.array(memoryNoteSchema).default([]),
  decisions: z8.array(memoryDecisionSchema).default([]),
  outcome: z8.string().optional(),
  followUps: z8.array(z8.string()).default([]),
  artifactPath: z8.string().min(1),
  markdownPath: z8.string().min(1)
});
function uniqueStrings6(values) {
  return uniqueBy(values.map((value) => value.trim()).filter(Boolean), (value) => value);
}
function memoryDirs(rootDir) {
  const stateDir = path25.join(rootDir, "state", "memory");
  const wikiDir = path25.join(rootDir, "wiki", "memory");
  return {
    stateDir,
    tasksStateDir: path25.join(stateDir, "tasks"),
    wikiDir,
    tasksWikiDir: path25.join(wikiDir, "tasks"),
    indexPath: path25.join(wikiDir, "index.md")
  };
}
function titleForGoal2(goal) {
  return `Memory Task: ${truncate(normalizeWhitespace(goal), 72)}`;
}
function normalizePathRef(value) {
  return toPosix(
    value.trim().replace(/^wiki\//, "").replace(/^\.\//, "")
  );
}
function taskSummary(task) {
  return {
    id: task.id,
    title: task.title,
    goal: task.goal,
    status: task.status,
    target: task.target,
    agent: task.agent,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    contextPackIds: task.contextPackIds,
    changedPaths: task.changedPaths,
    decisionCount: task.decisions.length,
    followUpCount: task.followUps.length,
    artifactPath: task.artifactPath,
    markdownPath: task.markdownPath
  };
}
async function uniqueMemoryTaskPaths(rootDir, createdAt, goal) {
  const dirs = memoryDirs(rootDir);
  await ensureDir(dirs.tasksStateDir);
  await ensureDir(dirs.tasksWikiDir);
  const timestamp = createdAt.replace(/[:.]/g, "-");
  const base = `${timestamp}-${slugify(goal)}`;
  let id = base;
  let artifactPath = path25.join(dirs.tasksStateDir, `${id}.json`);
  let markdownPath = path25.join(dirs.tasksWikiDir, `${id}.md`);
  let counter = 2;
  while (await fileExists(artifactPath) || await fileExists(markdownPath)) {
    id = `${base}-${counter}`;
    artifactPath = path25.join(dirs.tasksStateDir, `${id}.json`);
    markdownPath = path25.join(dirs.tasksWikiDir, `${id}.md`);
    counter++;
  }
  return { id, artifactPath, markdownPath };
}
function noteId(prefix, createdAt, count) {
  return `${prefix}:${createdAt.replace(/[:.]/g, "-")}:${count + 1}`;
}
function normalizeTask(raw) {
  const parsed = memoryTaskSchema.parse(raw);
  return {
    ...parsed,
    contextPackIds: uniqueStrings6(parsed.contextPackIds),
    sessionIds: uniqueStrings6(parsed.sessionIds),
    sourceIds: uniqueStrings6(parsed.sourceIds),
    pageIds: uniqueStrings6(parsed.pageIds),
    nodeIds: uniqueStrings6(parsed.nodeIds),
    changedPaths: uniqueStrings6(parsed.changedPaths.map(normalizePathRef)),
    gitRefs: uniqueStrings6(parsed.gitRefs),
    notes: parsed.notes,
    decisions: parsed.decisions,
    followUps: uniqueStrings6(parsed.followUps)
  };
}
function frontmatterForTask(task) {
  return {
    page_id: `memory:${task.id}`,
    kind: "memory_task",
    title: task.title,
    tags: ["agent-task", "agent-memory", "memory-task", `status/${task.status}`],
    source_ids: task.sourceIds,
    project_ids: [],
    node_ids: [`memory:${task.id}`, ...task.decisions.map((decision) => `decision:${task.id}:${decision.id}`), ...task.nodeIds],
    freshness: task.status === "completed" || task.status === "archived" ? "fresh" : "stale",
    status: task.status,
    confidence: 1,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    compiled_from: task.contextPackIds,
    managed_by: "system",
    backlinks: [],
    schema_hash: "",
    source_hashes: {},
    source_semantic_hashes: {},
    memory_task_id: task.id,
    memory_status: task.status,
    task_id: task.id,
    task_status: task.status,
    goal: task.goal,
    target: task.target,
    agent: task.agent,
    context_pack_ids: task.contextPackIds,
    related_page_ids: task.pageIds,
    related_node_ids: task.nodeIds,
    related_source_ids: task.sourceIds,
    git_refs: task.gitRefs,
    changed_paths: task.changedPaths
  };
}
function markdownList(values, empty = "- none") {
  return values.length ? values.map((value) => `- ${value}`).join("\n") : empty;
}
function datedList(values, empty = "- none") {
  return values.length ? values.map((value) => `- ${value.text} (${value.createdAt})`).join("\n") : empty;
}
function renderMemoryTaskMarkdown(task) {
  const body = [
    `# ${task.title}`,
    "",
    `Goal: ${task.goal}`,
    `Status: ${task.status}`,
    task.target ? `Target: ${task.target}` : void 0,
    task.agent ? `Agent: ${task.agent}` : void 0,
    `Created: ${task.createdAt}`,
    `Updated: ${task.updatedAt}`,
    "",
    "## Context Packs",
    "",
    markdownList(task.contextPackIds),
    "",
    "## Decisions",
    "",
    datedList(task.decisions),
    "",
    "## Notes",
    "",
    datedList(task.notes),
    "",
    "## Changed Paths",
    "",
    markdownList(task.changedPaths),
    "",
    "## Graph Evidence",
    "",
    task.sourceIds.length ? `Sources:
${markdownList(task.sourceIds)}` : "Sources:\n- none",
    "",
    task.pageIds.length ? `Pages:
${markdownList(task.pageIds)}` : "Pages:\n- none",
    "",
    task.nodeIds.length ? `Nodes:
${markdownList(task.nodeIds)}` : "Nodes:\n- none",
    "",
    "## Outcome",
    "",
    task.outcome ?? "Not finished yet.",
    "",
    "## Follow-Ups",
    "",
    markdownList(task.followUps),
    ""
  ].filter((line) => line !== void 0);
  return matter13.stringify(body.join("\n"), frontmatterForTask(task));
}
function renderMemoryTaskIndex(tasks, generatedAt) {
  const active = tasks.filter((task) => task.status === "active" || task.status === "blocked");
  const completed = tasks.filter((task) => task.status === "completed" || task.status === "archived");
  const section = (title, entries) => [
    `## ${title}`,
    "",
    entries.length ? entries.map((task) => `- [${task.title}](tasks/${path25.basename(task.markdownPath)}) \u2014 ${task.status} \u2014 ${task.goal}`).join("\n") : "- none",
    ""
  ];
  return matter13.stringify(["# Agent Tasks", "", ...section("Open Tasks", active), ...section("Completed Tasks", completed)].join("\n"), {
    page_id: "memory:index",
    kind: "index",
    title: "Agent Tasks",
    tags: ["index", "agent-task", "agent-memory"],
    source_ids: [],
    project_ids: [],
    node_ids: tasks.map((task) => `memory:${task.id}`),
    freshness: "fresh",
    status: "active",
    confidence: 1,
    created_at: generatedAt,
    updated_at: generatedAt,
    compiled_from: tasks.map((task) => task.id),
    managed_by: "system",
    backlinks: [],
    schema_hash: "",
    source_hashes: {},
    source_semantic_hashes: {}
  });
}
async function ensureMemoryLedger(rootDir) {
  const dirs = memoryDirs(rootDir);
  await ensureDir(dirs.tasksStateDir);
  await ensureDir(dirs.tasksWikiDir);
  const summaries = await listMemoryTasks(rootDir);
  const content = renderMemoryTaskIndex(summaries, (/* @__PURE__ */ new Date()).toISOString());
  const changed = [];
  if (!await fileExists(dirs.indexPath)) {
    await fs20.writeFile(dirs.indexPath, content, "utf8");
    changed.push(toPosix(path25.relative(rootDir, dirs.indexPath)));
  }
  return { changed };
}
async function persistMemoryTask(rootDir, task) {
  const normalized = normalizeTask(task);
  await writeJsonFile(normalized.artifactPath, normalized);
  await ensureDir(path25.dirname(normalized.markdownPath));
  await fs20.writeFile(normalized.markdownPath, renderMemoryTaskMarkdown(normalized), "utf8");
  await refreshMemoryIndex(rootDir);
  return {
    task: normalized,
    artifactPath: normalized.artifactPath,
    markdownPath: normalized.markdownPath
  };
}
async function refreshMemoryIndex(rootDir) {
  const dirs = memoryDirs(rootDir);
  await ensureDir(dirs.wikiDir);
  const summaries = await listMemoryTasks(rootDir);
  await fs20.writeFile(dirs.indexPath, renderMemoryTaskIndex(summaries, (/* @__PURE__ */ new Date()).toISOString()), "utf8");
}
async function hydrateTaskFromContextPack(rootDir, task, contextPackId) {
  const pack = await readContextPack(rootDir, contextPackId);
  if (!pack) {
    return {
      ...task,
      contextPackIds: uniqueStrings6([...task.contextPackIds, contextPackId])
    };
  }
  return {
    ...task,
    contextPackIds: uniqueStrings6([...task.contextPackIds, pack.id]),
    sourceIds: uniqueStrings6([...task.sourceIds, ...pack.relatedSourceIds]),
    pageIds: uniqueStrings6([...task.pageIds, ...pack.relatedPageIds]),
    nodeIds: uniqueStrings6([...task.nodeIds, ...pack.relatedNodeIds])
  };
}
async function startMemoryTask(rootDir, options) {
  const goal = normalizeWhitespace(options.goal);
  if (!goal) {
    throw new Error("Task goal is required.");
  }
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const paths = await uniqueMemoryTaskPaths(rootDir, createdAt, goal);
  let task = {
    id: paths.id,
    title: titleForGoal2(goal),
    goal,
    status: "active",
    target: options.target,
    agent: options.agent,
    createdAt,
    updatedAt: createdAt,
    contextPackIds: [],
    sessionIds: [],
    sourceIds: [],
    pageIds: [],
    nodeIds: [],
    changedPaths: [],
    gitRefs: [],
    notes: [],
    decisions: [],
    followUps: [],
    artifactPath: paths.artifactPath,
    markdownPath: paths.markdownPath
  };
  if (options.contextPackId) {
    task = await hydrateTaskFromContextPack(rootDir, task, options.contextPackId);
  } else {
    const pack = await buildContextPack(rootDir, {
      goal,
      target: options.target,
      budgetTokens: options.budgetTokens ?? DEFAULT_MEMORY_CONTEXT_BUDGET,
      format: "markdown"
    });
    task = await hydrateTaskFromContextPack(rootDir, task, pack.pack.id);
  }
  return await persistMemoryTask(rootDir, task);
}
async function resolveMemoryTaskArtifactPath(rootDir, target) {
  const dirs = memoryDirs(rootDir);
  const direct = path25.resolve(rootDir, target);
  if (isPathWithin(dirs.tasksStateDir, direct) && direct.endsWith(".json") && await fileExists(direct)) {
    return direct;
  }
  const byId = path25.resolve(dirs.tasksStateDir, `${target.replace(/\.json$/, "")}.json`);
  if (isPathWithin(dirs.tasksStateDir, byId) && await fileExists(byId)) {
    return byId;
  }
  const summaries = await listMemoryTasks(rootDir);
  const match = summaries.find((summary) => summary.id === target || path25.basename(summary.artifactPath, ".json") === target);
  return match?.artifactPath ?? null;
}
async function readMemoryTask(rootDir, target) {
  const artifactPath = await resolveMemoryTaskArtifactPath(rootDir, target);
  const raw = artifactPath ? await readJsonFile(artifactPath) : null;
  return raw ? normalizeTask(raw) : null;
}
async function listMemoryTasks(rootDir) {
  const dirs = memoryDirs(rootDir);
  const entries = await fs20.readdir(dirs.tasksStateDir, { withFileTypes: true }).catch(() => []);
  const tasks = await Promise.all(
    entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map(async (entry) => {
      const raw = await readJsonFile(path25.join(dirs.tasksStateDir, entry.name));
      return raw ? normalizeTask(raw) : null;
    })
  );
  return tasks.filter((task) => Boolean(task)).map(taskSummary).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.title.localeCompare(right.title));
}
async function updateMemoryTask(rootDir, target, options) {
  const task = await readMemoryTask(rootDir, target);
  if (!task) {
    throw new Error(`Task not found: ${target}`);
  }
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const nextStatus = options.status ? memoryTaskStatusSchema.parse(options.status) : task.status;
  let next = {
    ...task,
    status: nextStatus,
    updatedAt,
    sessionIds: uniqueStrings6([...task.sessionIds, options.sessionId ?? ""]),
    sourceIds: uniqueStrings6([...task.sourceIds, options.sourceId ?? ""]),
    pageIds: uniqueStrings6([...task.pageIds, options.pageId ?? ""]),
    nodeIds: uniqueStrings6([...task.nodeIds, options.nodeId ?? ""]),
    changedPaths: uniqueStrings6([...task.changedPaths, options.changedPath ? normalizePathRef(options.changedPath) : ""]),
    gitRefs: uniqueStrings6([...task.gitRefs, options.gitRef ?? ""]),
    notes: options.note ? [...task.notes, { id: noteId("note", updatedAt, task.notes.length), text: normalizeWhitespace(options.note), createdAt: updatedAt }] : task.notes,
    decisions: options.decision ? [
      ...task.decisions,
      { id: noteId("decision", updatedAt, task.decisions.length), text: normalizeWhitespace(options.decision), createdAt: updatedAt }
    ] : task.decisions
  };
  if (options.contextPackId) {
    next = await hydrateTaskFromContextPack(rootDir, next, options.contextPackId);
  }
  return await persistMemoryTask(rootDir, next);
}
async function finishMemoryTask(rootDir, target, options) {
  const outcome = normalizeWhitespace(options.outcome);
  if (!outcome) {
    throw new Error("Task outcome is required.");
  }
  const task = await readMemoryTask(rootDir, target);
  if (!task) {
    throw new Error(`Task not found: ${target}`);
  }
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  return await persistMemoryTask(rootDir, {
    ...task,
    status: "completed",
    updatedAt,
    outcome,
    followUps: uniqueStrings6([...task.followUps, options.followUp ? normalizeWhitespace(options.followUp) : ""])
  });
}
function renderMemoryResumeMarkdown(task, contextSections) {
  return [
    `# Agent Task Resume: ${task.title}`,
    "",
    `Goal: ${task.goal}`,
    `Status: ${task.status}`,
    task.target ? `Target: ${task.target}` : void 0,
    task.agent ? `Agent: ${task.agent}` : void 0,
    "",
    "## Outcome",
    "",
    task.outcome ?? "Not finished yet.",
    "",
    "## Decisions",
    "",
    datedList(task.decisions),
    "",
    "## Follow-Ups",
    "",
    markdownList(task.followUps),
    "",
    "## Changed Paths",
    "",
    markdownList(task.changedPaths),
    "",
    "## Linked Context",
    "",
    contextSections.length ? contextSections.join("\n\n---\n\n") : "- none",
    ""
  ].filter((line) => line !== void 0).join("\n");
}
async function resumeMemoryTask(rootDir, target, options = {}) {
  const task = await readMemoryTask(rootDir, target);
  if (!task) {
    throw new Error(`Task not found: ${target}`);
  }
  const format = options.format ?? "markdown";
  if (format === "json") {
    return { task, rendered: JSON.stringify(task, null, 2) };
  }
  const packs = (await Promise.all(
    task.contextPackIds.map(async (id) => {
      const pack = await readContextPack(rootDir, id);
      if (!pack) {
        return null;
      }
      return format === "llms" ? renderContextPackLlms(pack) : renderContextPackMarkdown(pack);
    })
  )).filter((value) => Boolean(value));
  return {
    task,
    rendered: renderMemoryResumeMarkdown(task, packs)
  };
}
function memoryTaskPageRecord(rootDir, task) {
  const content = renderMemoryTaskMarkdown(task);
  const page = {
    id: `memory:${task.id}`,
    path: toPosix(path25.relative(path25.join(rootDir, "wiki"), task.markdownPath)),
    title: task.title,
    kind: "memory_task",
    sourceIds: task.sourceIds,
    projectIds: [],
    nodeIds: [`memory:${task.id}`, ...task.decisions.map((decision) => `decision:${task.id}:${decision.id}`), ...task.nodeIds],
    freshness: task.status === "completed" || task.status === "archived" ? "fresh" : "stale",
    status: task.status,
    confidence: 1,
    backlinks: [],
    schemaHash: "",
    sourceHashes: {},
    sourceSemanticHashes: {},
    relatedPageIds: task.pageIds,
    relatedNodeIds: task.nodeIds,
    relatedSourceIds: task.sourceIds,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    compiledFrom: task.contextPackIds,
    managedBy: "system"
  };
  return { task, page, content, contentHash: sha256(content) };
}
async function loadMemoryTaskPages(rootDir) {
  const dirs = memoryDirs(rootDir);
  const entries = await fs20.readdir(dirs.tasksStateDir, { withFileTypes: true }).catch(() => []);
  const tasks = await Promise.all(
    entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map(async (entry) => {
      const raw = await readJsonFile(path25.join(dirs.tasksStateDir, entry.name));
      return raw ? normalizeTask(raw) : null;
    })
  );
  return tasks.filter((task) => Boolean(task)).map((task) => memoryTaskPageRecord(rootDir, task)).sort((left, right) => left.page.path.localeCompare(right.page.path));
}
function buildMemoryGraphElements(tasks, pages) {
  const pagesByPath = new Map(pages.map((page) => [page.path, page]));
  const nodes = [];
  const edges = [];
  const pushEdge = (edge) => {
    if (edges.some((existing) => existing.id === edge.id)) {
      return;
    }
    edges.push(edge);
  };
  for (const task of tasks) {
    const taskNodeId = `memory:${task.id}`;
    nodes.push({
      id: taskNodeId,
      type: "memory_task",
      label: task.title,
      pageId: taskNodeId,
      freshness: task.status === "completed" || task.status === "archived" ? "fresh" : "stale",
      confidence: 1,
      sourceIds: task.sourceIds,
      projectIds: [],
      tags: ["agent-task", "agent-memory", `status/${task.status}`]
    });
    for (const [index, decision] of task.decisions.entries()) {
      const decisionNodeId = `decision:${task.id}:${decision.id}`;
      nodes.push({
        id: decisionNodeId,
        type: "decision",
        label: truncate(decision.text, 80),
        pageId: taskNodeId,
        freshness: "fresh",
        confidence: 1,
        sourceIds: task.sourceIds,
        projectIds: [],
        tags: ["agent-task", "agent-memory", "decision"]
      });
      pushEdge({
        id: `${taskNodeId}->${decisionNodeId}:records_decision:${index + 1}`,
        source: taskNodeId,
        target: decisionNodeId,
        relation: "records_decision",
        status: "extracted",
        evidenceClass: "extracted",
        confidence: 1,
        provenance: [task.id]
      });
    }
    for (const [index, nodeId] of task.nodeIds.entries()) {
      if (nodeId === taskNodeId) {
        continue;
      }
      pushEdge({
        id: `${taskNodeId}->${nodeId}:uses_context:${index + 1}`,
        source: taskNodeId,
        target: nodeId,
        relation: "uses_context",
        status: "extracted",
        evidenceClass: "extracted",
        confidence: 0.9,
        provenance: [task.id]
      });
    }
    const touchedNodeIds = uniqueStrings6(
      task.changedPaths.flatMap((changedPath) => {
        const page = pagesByPath.get(changedPath) ?? [...pagesByPath.values()].find((candidate) => candidate.path.endsWith(changedPath));
        return page?.nodeIds ?? [];
      })
    );
    for (const [index, nodeId] of touchedNodeIds.entries()) {
      pushEdge({
        id: `${taskNodeId}->${nodeId}:touched:${index + 1}`,
        source: taskNodeId,
        target: nodeId,
        relation: "touched",
        status: "extracted",
        evidenceClass: "extracted",
        confidence: 0.85,
        provenance: [task.id]
      });
    }
    if (task.outcome) {
      for (const [index, nodeId] of task.nodeIds.slice(0, 12).entries()) {
        pushEdge({
          id: `${taskNodeId}->${nodeId}:produced_output:${index + 1}`,
          source: taskNodeId,
          target: nodeId,
          relation: "produced_output",
          status: "inferred",
          evidenceClass: "inferred",
          confidence: 0.68,
          provenance: [task.id]
        });
      }
    }
    for (const [index, followUp] of task.followUps.entries()) {
      const followUpNodeId = `decision:${task.id}:follow-up-${index + 1}`;
      nodes.push({
        id: followUpNodeId,
        type: "decision",
        label: truncate(`Follow-up: ${followUp}`, 80),
        pageId: taskNodeId,
        freshness: "stale",
        confidence: 0.82,
        sourceIds: task.sourceIds,
        projectIds: [],
        tags: ["agent-task", "agent-memory", "follow-up"]
      });
      pushEdge({
        id: `${taskNodeId}->${followUpNodeId}:follows_up:${index + 1}`,
        source: taskNodeId,
        target: followUpNodeId,
        relation: "follows_up",
        status: "inferred",
        evidenceClass: "inferred",
        confidence: 0.82,
        provenance: [task.id]
      });
    }
  }
  return { nodes, edges };
}
function memoryTaskHashes(records) {
  return Object.fromEntries(records.map((record) => [record.page.id, record.contentHash]));
}
function estimateMemoryTaskTokens(task) {
  return estimateTokens(renderMemoryTaskMarkdown(task));
}

export {
  installAgent,
  installConfiguredAgents,
  DEFAULT_PROMOTION_CONFIG,
  evaluateCandidateForPromotion,
  recordSession,
  appendWatchRun,
  buildGraphShareArtifact,
  renderGraphShareMarkdown,
  renderGraphShareSvg,
  renderGraphSharePreviewHtml,
  renderGraphShareBundleFiles,
  graphDiff,
  blastRadius,
  LARGE_REPO_NODE_THRESHOLD,
  resolveLargeRepoDefaults,
  ALL_SOURCE_CLASSES,
  buildOutputPage,
  normalizeOutputAssets,
  parseStoredPage,
  DEFAULT_CONSOLIDATION_CONFIG,
  resolveConsolidationConfig,
  runConsolidation,
  DEFAULT_REDACTION_PATTERNS,
  buildRedactor,
  resolveRedactionPatterns,
  buildConfiguredRedactor,
  ensureManagedSourcesArtifact,
  loadManagedSources,
  saveManagedSources,
  managedSourceWorkingDir,
  readPendingSemanticRefresh,
  mergePendingSemanticRefresh,
  readWatchStatusArtifact,
  writeWatchStatusArtifact,
  markPagesStaleForSources,
  validateUrlSafety,
  listTrackedRepoRoots,
  syncTrackedRepos,
  syncTrackedReposForWatch,
  ingestInputDetailed,
  ingestInput,
  addInput,
  ingestDirectory,
  importInbox,
  listManifests,
  removeManifestBySourceId,
  readExtractedText,
  graphHash,
  composeVaultSchema,
  loadVaultSchemas,
  loadVaultSchema,
  buildSchemaPrompt,
  createWebSearchAdapter,
  getWebSearchAdapterForTask,
  DEFAULT_HALF_LIFE_DAYS,
  DEFAULT_STALE_THRESHOLD,
  DEFAULT_HALF_LIFE_DAYS_BY_SOURCE_CLASS,
  computeDecayScore,
  applyDecayToPages,
  resetDecay,
  markSuperseded,
  resolveDecayConfig,
  persistDecayFrontmatter,
  runDecayPass,
  renderMemoryTaskMarkdown,
  ensureMemoryLedger,
  startMemoryTask,
  readMemoryTask,
  listMemoryTasks,
  updateMemoryTask,
  finishMemoryTask,
  resumeMemoryTask,
  memoryTaskPageRecord,
  loadMemoryTaskPages,
  buildMemoryGraphElements,
  memoryTaskHashes,
  estimateMemoryTaskTokens,
  searchPages,
  resolveRetrievalConfig,
  writeRetrievalManifest,
  rebuildRetrievalIndex,
  getRetrievalStatus,
  doctorRetrieval,
  readGuidedSourceSession,
  findLatestGuidedSourceSessionByScope,
  writeGuidedSourceSession,
  guidedSourceSessionStatePath,
  stageGeneratedOutputPages,
  refreshVaultAfterOutputSave,
  listApprovals,
  readApproval,
  acceptApproval,
  rejectApproval,
  listCandidates,
  promoteCandidate,
  runAutoPromotion,
  previewCandidatePromotions,
  createSupersessionEdge,
  archiveCandidate,
  initVault,
  compileVault,
  queryVault,
  exploreVault,
  searchVault,
  queryGraphVault,
  benchmarkVault,
  pathGraphVault,
  explainGraphVault,
  listGraphHyperedges,
  graphStatsVault,
  refreshGraphClusters,
  getGraphCommunityVault,
  readGraphReport,
  listGodNodes,
  blastRadiusVault,
  listPages,
  readPage,
  getWorkspaceInfo,
  lintVault,
  bootstrapDemo,
  consolidateVault,
  renderContextPackMarkdown,
  renderContextPackLlms,
  buildContextPack,
  listContextPacks,
  readContextPack,
  deleteContextPack
};

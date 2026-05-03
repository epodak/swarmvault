// src/providers/registry.ts
import path5 from "path";
import { pathToFileURL } from "url";
import { z as z5 } from "zod";

// src/config.ts
import fs2 from "fs/promises";
import path2 from "path";
import { fileURLToPath } from "url";
import { z as z2 } from "zod";

// src/types.ts
import { z } from "zod";
var providerCapabilitySchema = z.enum([
  "responses",
  "chat",
  "structured",
  "tools",
  "vision",
  "embeddings",
  "streaming",
  "local",
  "image_generation",
  "audio"
]);
var providerTypeSchema = z.enum([
  "heuristic",
  "openai",
  "ollama",
  "anthropic",
  "gemini",
  "openai-compatible",
  "openrouter",
  "groq",
  "together",
  "xai",
  "cerebras",
  "local-whisper",
  "custom"
]);
var agentTypeSchema = z.enum([
  "codex",
  "claude",
  "cursor",
  "goose",
  "pi",
  "gemini",
  "opencode",
  "aider",
  "copilot",
  "trae",
  "claw",
  "droid",
  "kiro",
  "hermes",
  "antigravity",
  "vscode",
  "amp",
  "augment",
  "adal",
  "bob",
  "cline",
  "codebuddy",
  "command-code",
  "continue",
  "cortex",
  "crush",
  "deepagents",
  "firebender",
  "iflow",
  "junie",
  "kilo-code",
  "kimi",
  "kode",
  "mcpjam",
  "mistral-vibe",
  "mux",
  "neovate",
  "openclaw",
  "openhands",
  "pochi",
  "qoder",
  "qwen-code",
  "replit",
  "roo-code",
  "trae-cn",
  "warp",
  "windsurf",
  "zencoder"
]);
var webSearchProviderTypeSchema = z.enum(["http-json", "custom"]);

// src/utils.ts
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "item";
}
function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
async function writeJsonFile(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}
`, "utf8");
}
async function appendJsonLine(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.appendFile(filePath, `${JSON.stringify(value)}
`, "utf8");
}
async function writeFileIfChanged(filePath, content) {
  await ensureDir(path.dirname(filePath));
  if (await fileExists(filePath)) {
    const existing = await fs.readFile(filePath, "utf8");
    if (existing === content) {
      return false;
    }
  }
  await fs.writeFile(filePath, content, "utf8");
  return true;
}
function toPosix(value) {
  return value.split(path.sep).join(path.posix.sep);
}
function isPathWithin(rootDir, candidate) {
  const normalizedRoot = path.resolve(rootDir);
  const normalizedCandidate = path.resolve(candidate);
  if (normalizedCandidate === normalizedRoot) {
    return true;
  }
  const withSep = normalizedRoot.endsWith(path.sep) ? normalizedRoot : normalizedRoot + path.sep;
  return normalizedCandidate.startsWith(withSep);
}
function firstSentences(value, count = 3) {
  const sentences = value.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, count).join(" ").trim();
}
function uniqueBy(items, key) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const item of items) {
    const itemKey = key(item);
    if (seen.has(itemKey)) {
      continue;
    }
    seen.add(itemKey);
    result.push(item);
  }
  return result;
}
function extractJson(text) {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }
  const start = text.indexOf("{");
  if (start !== -1) {
    let end = text.lastIndexOf("}");
    while (end > start) {
      const candidate = text.slice(start, end + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        end = text.lastIndexOf("}", end - 1);
      }
    }
  }
  throw new Error("Could not locate JSON object in provider response.");
}
function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}
function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }
  if (maxLength < 4) {
    return value.slice(0, maxLength);
  }
  return `${value.slice(0, maxLength - 3)}...`;
}
async function listFilesRecursive(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(absolutePath));
      continue;
    }
    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}

// src/config.ts
var PRIMARY_CONFIG_FILENAME = "swarmvault.config.json";
var PRIMARY_SCHEMA_FILENAME = "swarmvault.schema.md";
var moduleDir = path2.dirname(fileURLToPath(import.meta.url));
var viewerDistDir = path2.basename(moduleDir) === "src" ? path2.resolve(moduleDir, "../../viewer/dist") : path2.resolve(moduleDir, "viewer");
var providerConfigSchema = z2.object({
  type: providerTypeSchema,
  model: z2.string().min(1),
  baseUrl: z2.string().url().optional(),
  apiKeyEnv: z2.string().min(1).optional(),
  headers: z2.record(z2.string(), z2.string()).optional(),
  module: z2.string().min(1).optional(),
  capabilities: z2.array(providerCapabilitySchema).optional(),
  apiStyle: z2.enum(["responses", "chat"]).optional(),
  binaryPath: z2.string().min(1).optional(),
  modelPath: z2.string().min(1).optional(),
  extraArgs: z2.array(z2.string()).optional(),
  threads: z2.number().int().positive().optional()
});
var sourceClassSchema = z2.enum(["first_party", "third_party", "resource", "generated"]);
var vaultProfilePresetSchema = z2.enum(["reader", "timeline", "diligence", "thesis"]);
var vaultDashboardPackSchema = z2.enum(["default", "reader", "diligence"]);
var guidedSessionModeSchema = z2.enum(["insights_only", "canonical_review"]);
var neo4jGraphSinkConfigSchema = z2.object({
  uri: z2.string().min(1),
  username: z2.string().min(1),
  passwordEnv: z2.string().min(1),
  database: z2.string().min(1).optional(),
  vaultId: z2.string().min(1).optional(),
  includeClasses: z2.array(sourceClassSchema).optional(),
  batchSize: z2.number().int().positive().optional()
});
var scheduleTriggerSchema = z2.object({
  cron: z2.string().min(1).optional(),
  every: z2.string().min(1).optional()
}).refine((value) => Boolean(value.cron || value.every), {
  message: "Schedule triggers require `cron` or `every`."
});
var scheduledTaskSchema = z2.discriminatedUnion("type", [
  z2.object({
    type: z2.literal("compile"),
    approve: z2.boolean().optional()
  }),
  z2.object({
    type: z2.literal("lint"),
    deep: z2.boolean().optional(),
    web: z2.boolean().optional()
  }),
  z2.object({
    type: z2.literal("query"),
    question: z2.string().min(1),
    format: z2.enum(["markdown", "report", "slides", "chart", "image"]).optional(),
    save: z2.boolean().optional()
  }),
  z2.object({
    type: z2.literal("explore"),
    question: z2.string().min(1),
    steps: z2.number().int().positive().optional(),
    format: z2.enum(["markdown", "report", "slides", "chart", "image"]).optional()
  }),
  z2.object({
    type: z2.literal("consolidate"),
    dryRun: z2.boolean().optional()
  })
]);
var roleExecutorConfigSchema = z2.discriminatedUnion("type", [
  z2.object({
    type: z2.literal("provider"),
    provider: z2.string().min(1)
  }),
  z2.object({
    type: z2.literal("command"),
    command: z2.array(z2.string().min(1)).min(1),
    cwd: z2.string().min(1).optional(),
    env: z2.record(z2.string(), z2.string()).optional(),
    timeoutMs: z2.number().int().positive().optional()
  })
]);
var webSearchProviderConfigSchema = z2.object({
  type: webSearchProviderTypeSchema,
  endpoint: z2.string().url().optional(),
  method: z2.enum(["GET", "POST"]).optional(),
  apiKeyEnv: z2.string().min(1).optional(),
  apiKeyHeader: z2.string().min(1).optional(),
  apiKeyPrefix: z2.string().optional(),
  headers: z2.record(z2.string(), z2.string()).optional(),
  queryParam: z2.string().min(1).optional(),
  limitParam: z2.string().min(1).optional(),
  resultsPath: z2.string().min(1).optional(),
  titleField: z2.string().min(1).optional(),
  urlField: z2.string().min(1).optional(),
  snippetField: z2.string().min(1).optional(),
  module: z2.string().min(1).optional()
});
var vaultProfileConfigSchema = z2.object({
  presets: z2.array(vaultProfilePresetSchema).default([]),
  dashboardPack: vaultDashboardPackSchema.default("default"),
  guidedSessionMode: guidedSessionModeSchema.default("insights_only"),
  dataviewBlocks: z2.boolean().default(false),
  guidedIngestDefault: z2.boolean().default(false),
  deepLintDefault: z2.boolean().default(false)
});
var WORKSPACE_DIR_DEFAULTS = {
  rawDir: "raw",
  wikiDir: "wiki",
  stateDir: "state",
  agentDir: "agent",
  inboxDir: "inbox"
};
var vaultConfigSchema = z2.object({
  workspace: z2.object({
    rawDir: z2.string().min(1).default(WORKSPACE_DIR_DEFAULTS.rawDir),
    wikiDir: z2.string().min(1).default(WORKSPACE_DIR_DEFAULTS.wikiDir),
    stateDir: z2.string().min(1).default(WORKSPACE_DIR_DEFAULTS.stateDir),
    agentDir: z2.string().min(1).default(WORKSPACE_DIR_DEFAULTS.agentDir),
    inboxDir: z2.string().min(1).default(WORKSPACE_DIR_DEFAULTS.inboxDir)
  }).default(WORKSPACE_DIR_DEFAULTS),
  providers: z2.record(z2.string(), providerConfigSchema),
  tasks: z2.object({
    compileProvider: z2.string().min(1),
    queryProvider: z2.string().min(1),
    lintProvider: z2.string().min(1),
    visionProvider: z2.string().min(1),
    imageProvider: z2.string().min(1).optional(),
    embeddingProvider: z2.string().min(1).optional(),
    audioProvider: z2.string().min(1).optional()
  }),
  viewer: z2.object({
    port: z2.number().int().positive()
  }),
  profile: vaultProfileConfigSchema.default({
    presets: [],
    dashboardPack: "default",
    guidedSessionMode: "insights_only",
    dataviewBlocks: false,
    guidedIngestDefault: false,
    deepLintDefault: false
  }),
  projects: z2.record(
    z2.string(),
    z2.object({
      roots: z2.array(z2.string().min(1)).min(1),
      schemaPath: z2.string().min(1).optional()
    })
  ).optional(),
  agents: z2.array(agentTypeSchema).default(["codex", "claude", "cursor"]),
  schedules: z2.record(z2.string(), z2.object({ enabled: z2.boolean().optional(), when: scheduleTriggerSchema, task: scheduledTaskSchema })).optional(),
  orchestration: z2.object({
    maxParallelRoles: z2.number().int().positive().optional(),
    compilePostPass: z2.boolean().optional(),
    roles: z2.object({
      research: z2.object({ executor: roleExecutorConfigSchema }).optional(),
      audit: z2.object({ executor: roleExecutorConfigSchema }).optional(),
      context: z2.object({ executor: roleExecutorConfigSchema }).optional(),
      safety: z2.object({ executor: roleExecutorConfigSchema }).optional()
    }).optional()
  }).optional(),
  benchmark: z2.object({
    enabled: z2.boolean().optional(),
    questions: z2.array(z2.string().min(1)).optional(),
    maxQuestions: z2.number().int().positive().optional()
  }).optional(),
  repoAnalysis: z2.object({
    classifyGlobs: z2.partialRecord(sourceClassSchema, z2.array(z2.string().min(1))).optional(),
    extractClasses: z2.array(sourceClassSchema).optional()
  }).optional(),
  graphSinks: z2.object({
    neo4j: neo4jGraphSinkConfigSchema.optional()
  }).optional(),
  graph: z2.object({
    communityResolution: z2.number().positive().optional(),
    similarityIdfFloor: z2.number().min(0).optional(),
    similarityEdgeCap: z2.number().int().positive().optional(),
    godNodeLimit: z2.number().int().positive().optional(),
    foldCommunitiesBelow: z2.number().int().positive().optional()
  }).optional(),
  retrieval: z2.object({
    backend: z2.literal("sqlite").optional(),
    shardSize: z2.number().int().positive().optional(),
    hybrid: z2.boolean().optional(),
    rerank: z2.boolean().optional(),
    embeddingProvider: z2.string().min(1).optional(),
    maxIndexedRows: z2.number().int().positive().optional()
  }).optional(),
  webSearch: z2.object({
    providers: z2.record(z2.string(), webSearchProviderConfigSchema),
    tasks: z2.object({
      deepLintProvider: z2.string().min(1),
      queryProvider: z2.string().min(1).optional(),
      exploreProvider: z2.string().min(1).optional()
    })
  }).optional(),
  search: z2.object({
    hybrid: z2.boolean().optional(),
    rerank: z2.boolean().optional()
  }).optional(),
  autoCommit: z2.boolean().optional(),
  candidate: z2.object({
    autoPromote: z2.object({
      enabled: z2.boolean().default(false),
      minSources: z2.number().int().min(1).default(3),
      minConfidence: z2.number().min(0).max(1).default(0.8),
      minAgreement: z2.number().min(0).max(1).default(0.7),
      minDegree: z2.number().int().min(0).default(2),
      minAgeHours: z2.number().int().min(0).default(24),
      maxPerRun: z2.number().int().positive().default(25),
      dryRun: z2.boolean().default(false)
    }).optional()
  }).optional(),
  redaction: z2.object({
    enabled: z2.boolean().optional(),
    placeholder: z2.string().min(1).optional(),
    useDefaults: z2.boolean().optional(),
    patterns: z2.array(
      z2.object({
        id: z2.string().min(1),
        pattern: z2.string().min(1),
        flags: z2.string().optional(),
        placeholder: z2.string().min(1).optional(),
        description: z2.string().optional()
      })
    ).optional()
  }).optional(),
  freshness: z2.object({
    defaultHalfLifeDays: z2.number().positive().optional(),
    staleThreshold: z2.number().min(0).max(1).optional(),
    halfLifeDaysBySourceClass: z2.object({
      first_party: z2.number().positive().optional(),
      third_party: z2.number().positive().optional(),
      resource: z2.number().positive().optional(),
      generated: z2.number().positive().optional()
    }).optional()
  }).optional(),
  consolidation: z2.object({
    enabled: z2.boolean().optional(),
    workingToEpisodic: z2.object({
      minPages: z2.number().int().min(1).optional(),
      sessionWindowHours: z2.number().positive().optional(),
      minSharedNodeRatio: z2.number().min(0).max(1).optional()
    }).optional(),
    episodicToSemantic: z2.object({
      minOccurrences: z2.number().int().min(1).optional()
    }).optional(),
    semanticToProcedural: z2.object({
      minWorkflowSteps: z2.number().int().min(1).optional()
    }).optional()
  }).optional(),
  watch: z2.object({
    repoRoots: z2.array(z2.string().min(1)).optional(),
    excludeRepoRoots: z2.array(z2.string().min(1)).optional()
  }).optional(),
  prompts: z2.object({
    compile: z2.object({
      systemExtra: z2.array(z2.string()).optional(),
      conceptRules: z2.array(z2.string()).optional(),
      entityRules: z2.array(z2.string()).optional(),
      claimRules: z2.array(z2.string()).optional()
    }).optional(),
    customModule: z2.string().min(1).optional()
  }).optional()
});
function normalizeProfilePresets(presets) {
  return [...new Set(presets)];
}
function inferDashboardPackFromPresets(presets) {
  if (presets.includes("diligence") && !presets.includes("reader")) {
    return "diligence";
  }
  return presets.length ? "reader" : "default";
}
function inferGuidedSessionModeFromPresets(presets) {
  return presets.length ? "canonical_review" : "insights_only";
}
function defaultVaultProfileConfig() {
  return {
    presets: [],
    dashboardPack: "default",
    guidedSessionMode: "insights_only",
    dataviewBlocks: false,
    guidedIngestDefault: false,
    deepLintDefault: false
  };
}
function personalResearchProfileConfig() {
  return {
    presets: ["reader", "timeline", "thesis"],
    dashboardPack: "reader",
    guidedSessionMode: "canonical_review",
    dataviewBlocks: true,
    guidedIngestDefault: true,
    deepLintDefault: true
  };
}
function normalizeVaultProfileConfig(profile) {
  const defaults = defaultVaultProfileConfig();
  const presets = normalizeProfilePresets(profile?.presets ?? defaults.presets);
  return {
    presets,
    dashboardPack: profile?.dashboardPack ?? inferDashboardPackFromPresets(presets),
    guidedSessionMode: profile?.guidedSessionMode ?? inferGuidedSessionModeFromPresets(presets),
    dataviewBlocks: profile?.dataviewBlocks ?? presets.length > 0,
    guidedIngestDefault: profile?.guidedIngestDefault ?? false,
    deepLintDefault: profile?.deepLintDefault ?? false
  };
}
function resolveInitProfile(profile) {
  const value = profile?.trim();
  if (!value || value === "default") {
    return {
      alias: "default",
      profile: defaultVaultProfileConfig()
    };
  }
  if (value === "personal-research") {
    return {
      alias: "personal-research",
      profile: personalResearchProfileConfig()
    };
  }
  const presets = normalizeProfilePresets(
    value.split(",").map((item) => item.trim()).filter(Boolean).map((item) => {
      const parsed = vaultProfilePresetSchema.safeParse(item);
      if (!parsed.success) {
        throw new Error(
          `Unknown init profile or preset: ${item}. Use \`default\`, \`personal-research\`, or a comma-separated list of presets: reader,timeline,diligence,thesis.`
        );
      }
      return parsed.data;
    })
  );
  return {
    alias: presets.join(","),
    profile: normalizeVaultProfileConfig({
      presets
    })
  };
}
function defaultVaultConfig(profile = defaultVaultProfileConfig()) {
  return {
    workspace: { ...WORKSPACE_DIR_DEFAULTS },
    providers: {
      local: {
        type: "heuristic",
        model: "heuristic-v1",
        capabilities: ["chat", "structured", "vision", "local"]
      }
    },
    tasks: {
      compileProvider: "local",
      queryProvider: "local",
      lintProvider: "local",
      visionProvider: "local",
      imageProvider: "local",
      audioProvider: void 0
    },
    viewer: {
      port: 4123
    },
    profile,
    projects: {},
    agents: ["codex", "claude", "cursor"],
    schedules: {},
    orchestration: {
      maxParallelRoles: 2,
      compilePostPass: false,
      roles: {}
    },
    benchmark: {
      enabled: true,
      questions: [],
      maxQuestions: 3
    },
    repoAnalysis: {
      classifyGlobs: {},
      extractClasses: ["first_party"]
    },
    graphSinks: {},
    retrieval: {
      backend: "sqlite",
      shardSize: 25e3,
      hybrid: true,
      rerank: false
    },
    prompts: {
      compile: {
        conceptRules: [
          "Names must be 2-60 characters, human-readable nouns or noun phrases.",
          "Exclude pure numbers, dates, LaTeX symbols, single letters, and punctuation-only strings.",
          "Prefer specific domain terms over generic words (e.g. 'signal masking' not 'dark')."
        ],
        entityRules: [
          "Names must be 2-80 characters, proper nouns or well-known designations.",
          "Exclude generic titles, pronouns, and incomplete fragments.",
          "Each entity must have a description of at least 10 characters explaining what it is."
        ],
        claimRules: [
          "Each claim must be a complete sentence under 200 characters.",
          "Claims must contain substantive information, not trivial observations.",
          "Exclude claims that merely repeat the source title or section heading."
        ]
      }
    }
  };
}
function defaultVaultSchema(profile = "default") {
  const resolvedProfile = typeof profile === "string" ? resolveInitProfile(profile).profile : normalizeVaultProfileConfig(profile);
  const isResearchProfile = resolvedProfile.presets.length > 0 || resolvedProfile.guidedSessionMode === "canonical_review" || resolvedProfile.dataviewBlocks;
  if (isResearchProfile) {
    const presetLines = [];
    if (resolvedProfile.presets.includes("reader")) {
      presetLines.push("- Keep source pages and source guides optimized for rereading, synthesis, and durable summaries.");
    }
    if (resolvedProfile.presets.includes("timeline")) {
      presetLines.push("- Preserve chronology, dates, and source progression so timeline dashboards stay meaningful.");
    }
    if (resolvedProfile.presets.includes("diligence")) {
      presetLines.push("- Track evidence quality, explicit contradictions, and unresolved judgment calls instead of smoothing them away.");
    }
    if (resolvedProfile.presets.includes("thesis")) {
      presetLines.push("- Maintain explicit thesis, hub, or recurring-question pages that evolve as new evidence arrives.");
    }
    return [
      "# SwarmVault Schema",
      "",
      "Edit this file to teach SwarmVault how this research vault should be organized and maintained.",
      "",
      "## Vault Purpose",
      "",
      "- Track a personal research domain, reading program, or evolving thesis.",
      "- Prefer source-grounded summaries that help you revisit what mattered and what changed your mind.",
      "",
      "## Working Style",
      "",
      "- Favor one-source-at-a-time guided ingest and explicit review before treating a claim as canonical.",
      "- Preserve uncertainty, contradictions, and open questions instead of forcing synthesis too early.",
      "- Save useful summaries, briefs, and source guides back into the wiki so they become durable context.",
      ...resolvedProfile.guidedSessionMode === "canonical_review" ? ["- Stage approval-queued updates to canonical source, concept, and entity pages when the evidence is strong enough."] : ["- Prefer insight pages for exploratory integration until you are ready to promote changes into canonical pages."],
      ...presetLines.length ? ["", "## Profile Emphasis", "", ...presetLines] : [],
      "",
      "## Naming Conventions",
      "",
      "- Prefer stable, descriptive page titles.",
      "- Keep concept, thesis, and entity names specific to the subject area.",
      "- Use source pages for grounded notes, concept/entity pages for accumulated understanding, and outputs for guided integration artifacts.",
      "",
      "## Page Structure Rules",
      "",
      "- Source pages should stay grounded in the original material.",
      "- Concept and entity pages should aggregate source-backed claims instead of inventing new ones.",
      "- Summaries should call out what is new, what is reinforcing, and what is conflicting.",
      "- Preserve contradictions instead of smoothing them away.",
      "",
      "## Categories",
      "",
      "- List domain-specific concept categories here.",
      "- Add thesis pages, recurring themes, or reading tracks that should act as canonical hubs.",
      "",
      "## Relationship Types",
      "",
      "- Mentions",
      "- Supports",
      "- Contradicts",
      "- Builds On",
      "- Questions",
      "",
      "## Dashboard Priorities",
      "",
      "- Recent source guides should surface active reading and ingestion progress.",
      "- Open questions should stay visible until resolved or explicitly archived.",
      "- Contradictions and follow-up sources should be easy to scan from dashboards.",
      ...resolvedProfile.dataviewBlocks ? ["- Keep frontmatter and page titles friendly to Dataview queries, but make every dashboard usable as plain markdown first."] : [],
      ""
    ].join("\n");
  }
  return [
    "# SwarmVault Schema",
    "",
    "Edit this file to teach SwarmVault how this vault should be organized and maintained.",
    "",
    "## Vault Purpose",
    "",
    "- Describe the domain this vault covers.",
    "- Note the intended audience and the kinds of questions the vault should answer well.",
    "",
    "## Naming Conventions",
    "",
    "- Prefer stable, descriptive page titles.",
    "- Keep concept and entity names specific to the domain.",
    "",
    "## Page Structure Rules",
    "",
    "- Source pages should stay grounded in the original material.",
    "- Concept and entity pages should aggregate source-backed claims instead of inventing new ones.",
    "- Preserve contradictions instead of smoothing them away.",
    "",
    "## Categories",
    "",
    "- List domain-specific concept categories here.",
    "- List important entity types here.",
    "",
    "## Relationship Types",
    "",
    "- Mentions",
    "- Supports",
    "- Contradicts",
    "- Depends on",
    "",
    "## Grounding Rules",
    "",
    "- Prefer raw sources over summaries.",
    "- Cite source ids whenever claims are stated.",
    "- Do not treat the wiki as a source of truth when the raw material disagrees.",
    "",
    "## Exclusions",
    "",
    "- List topics, claims, or page types the compiler should avoid generating.",
    ""
  ].join("\n");
}
async function findConfigPath(rootDir) {
  const primaryPath = path2.join(rootDir, PRIMARY_CONFIG_FILENAME);
  return primaryPath;
}
async function findSchemaPath(rootDir) {
  const primaryPath = path2.join(rootDir, PRIMARY_SCHEMA_FILENAME);
  return primaryPath;
}
function resolvePaths(rootDir, config, configPath = path2.join(rootDir, PRIMARY_CONFIG_FILENAME), schemaPath = path2.join(rootDir, PRIMARY_SCHEMA_FILENAME)) {
  const effective = config ?? defaultVaultConfig();
  const rawDir = path2.resolve(rootDir, effective.workspace.rawDir);
  const rawSourcesDir = path2.join(rawDir, "sources");
  const rawAssetsDir = path2.join(rawDir, "assets");
  const wikiDir = path2.resolve(rootDir, effective.workspace.wikiDir);
  const outputsAssetsDir = path2.join(wikiDir, "outputs", "assets");
  const projectsDir = path2.join(wikiDir, "projects");
  const candidatesDir = path2.join(wikiDir, "candidates");
  const stateDir = path2.resolve(rootDir, effective.workspace.stateDir);
  const retrievalDir = path2.join(stateDir, "retrieval");
  const schedulesDir = path2.join(stateDir, "schedules");
  const watchDir = path2.join(stateDir, "watch");
  const managedSourcesDir = path2.join(stateDir, "sources");
  const agentDir = path2.resolve(rootDir, effective.workspace.agentDir);
  const inboxDir = path2.resolve(rootDir, effective.workspace.inboxDir);
  return {
    rootDir,
    schemaPath,
    rawDir,
    rawSourcesDir,
    rawAssetsDir,
    wikiDir,
    outputsAssetsDir,
    projectsDir,
    candidatesDir,
    candidateConceptsDir: path2.join(candidatesDir, "concepts"),
    candidateEntitiesDir: path2.join(candidatesDir, "entities"),
    stateDir,
    retrievalDir,
    retrievalManifestPath: path2.join(retrievalDir, "manifest.json"),
    schedulesDir,
    agentDir,
    inboxDir,
    manifestsDir: path2.join(stateDir, "manifests"),
    extractsDir: path2.join(stateDir, "extracts"),
    analysesDir: path2.join(stateDir, "analyses"),
    viewerDistDir,
    graphPath: path2.join(stateDir, "graph.json"),
    searchDbPath: path2.join(retrievalDir, "fts-000.sqlite"),
    compileStatePath: path2.join(stateDir, "compile-state.json"),
    codeIndexPath: path2.join(stateDir, "code-index.json"),
    embeddingsPath: path2.join(stateDir, "embeddings.json"),
    benchmarkPath: path2.join(stateDir, "benchmark.json"),
    jobsLogPath: path2.join(stateDir, "jobs.ndjson"),
    sessionsDir: path2.join(stateDir, "sessions"),
    sourceSessionsDir: path2.join(stateDir, "source-sessions"),
    approvalsDir: path2.join(stateDir, "approvals"),
    watchDir,
    watchStatusPath: path2.join(watchDir, "status.json"),
    pendingSemanticRefreshPath: path2.join(watchDir, "pending-semantic-refresh.json"),
    managedSourcesPath: path2.join(stateDir, "sources.json"),
    managedSourcesDir,
    configPath
  };
}
async function loadVaultConfig(rootDir) {
  const configPath = await findConfigPath(rootDir);
  const schemaPath = await findSchemaPath(rootDir);
  const raw = await readJsonFile(configPath);
  const parsed = vaultConfigSchema.parse(raw ?? defaultVaultConfig());
  const config = {
    ...parsed,
    profile: normalizeVaultProfileConfig(parsed.profile)
  };
  return {
    config,
    paths: resolvePaths(rootDir, config, configPath, schemaPath)
  };
}
async function initWorkspace(rootDir, options = {}) {
  const configPath = await findConfigPath(rootDir);
  const schemaPath = await findSchemaPath(rootDir);
  const initProfile = resolveInitProfile(options.profile);
  const config = await fileExists(configPath) ? (await loadVaultConfig(rootDir)).config : defaultVaultConfig(initProfile.profile);
  const paths = resolvePaths(rootDir, config, configPath, schemaPath);
  const primarySchemaPath = path2.join(rootDir, PRIMARY_SCHEMA_FILENAME);
  await Promise.all([
    ensureDir(paths.rawDir),
    ensureDir(paths.wikiDir),
    ensureDir(paths.outputsAssetsDir),
    ensureDir(paths.projectsDir),
    ensureDir(paths.candidatesDir),
    ensureDir(paths.candidateConceptsDir),
    ensureDir(paths.candidateEntitiesDir),
    ensureDir(paths.stateDir),
    ensureDir(paths.retrievalDir),
    ensureDir(paths.schedulesDir),
    ensureDir(paths.watchDir),
    ensureDir(paths.managedSourcesDir),
    ensureDir(paths.sessionsDir),
    ensureDir(paths.sourceSessionsDir),
    ensureDir(paths.approvalsDir),
    ensureDir(paths.agentDir),
    ensureDir(paths.inboxDir),
    ensureDir(paths.manifestsDir),
    ensureDir(paths.extractsDir),
    ensureDir(paths.analysesDir),
    ensureDir(paths.rawSourcesDir),
    ensureDir(paths.rawAssetsDir)
  ]);
  if (!await fileExists(configPath)) {
    await writeJsonFile(configPath, config);
  }
  if (!await fileExists(primarySchemaPath)) {
    await ensureDir(path2.dirname(primarySchemaPath));
    await fs2.writeFile(primarySchemaPath, defaultVaultSchema(config.profile), "utf8");
  }
  return { config, paths };
}

// src/providers/base.ts
import fs3 from "fs/promises";
import { z as z3 } from "zod";
var BaseProviderAdapter = class {
  constructor(id, type, model, capabilities) {
    this.id = id;
    this.type = type;
    this.model = model;
    this.capabilities = new Set(capabilities);
  }
  id;
  type;
  model;
  capabilities;
  async embedTexts(_texts) {
    throw new Error(`Provider ${this.id} does not support embeddings.`);
  }
  async generateImage(_request) {
    throw new Error(`Provider ${this.id} does not support image generation.`);
  }
  async transcribeAudio(_request) {
    throw new Error(`Provider ${this.id} does not support audio transcription.`);
  }
  async generateStructured(request, schema) {
    const schemaDescription = JSON.stringify(z3.toJSONSchema(schema), null, 2);
    const response = await this.generateText({
      ...request,
      prompt: `${request.prompt}

Return JSON only. Follow this JSON Schema exactly:
${schemaDescription}`
    });
    const parsed = JSON.parse(extractJson(response.text));
    return schema.parse(parsed);
  }
  async encodeAttachments(attachments = []) {
    return Promise.all(
      attachments.map(async (attachment) => ({
        mimeType: attachment.mimeType,
        base64: await fs3.readFile(attachment.filePath, "base64")
      }))
    );
  }
};

// src/providers/anthropic.ts
var AnthropicProviderAdapter = class extends BaseProviderAdapter {
  apiKey;
  headers;
  baseUrl;
  constructor(id, model, options) {
    super(id, "anthropic", model, ["chat", "structured", "tools", "vision", "streaming"]);
    this.apiKey = options.apiKey;
    this.headers = options.headers;
    this.baseUrl = (options.baseUrl ?? "https://api.anthropic.com").replace(/\/+$/, "");
  }
  async generateText(request) {
    const encodedAttachments = await this.encodeAttachments(request.attachments);
    const content = [
      { type: "text", text: request.prompt },
      ...encodedAttachments.map((item) => ({
        type: "image",
        source: {
          type: "base64",
          media_type: item.mimeType,
          data: item.base64
        }
      }))
    ];
    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
        ...this.apiKey ? { "x-api-key": this.apiKey } : {},
        ...this.headers
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: request.maxOutputTokens ?? 1200,
        system: request.system,
        messages: [
          {
            role: "user",
            content
          }
        ]
      })
    });
    if (!response.ok) {
      throw new Error(`Provider ${this.id} failed: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    return {
      text: payload.content?.filter((item) => item.type === "text").map((item) => item.text ?? "").join("\n") ?? "",
      usage: payload.usage ? { inputTokens: payload.usage.input_tokens, outputTokens: payload.usage.output_tokens } : void 0
    };
  }
};

// src/providers/gemini.ts
var GeminiProviderAdapter = class extends BaseProviderAdapter {
  apiKey;
  baseUrl;
  constructor(id, model, options) {
    super(id, "gemini", model, ["chat", "structured", "vision", "tools", "streaming"]);
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
  }
  async generateText(request) {
    const encodedAttachments = await this.encodeAttachments(request.attachments);
    const parts = [
      ...request.system ? [{ text: `System instructions:
${request.system}` }] : [],
      { text: request.prompt },
      ...encodedAttachments.map((item) => ({
        inline_data: {
          mime_type: item.mimeType,
          data: item.base64
        }
      }))
    ];
    const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...this.apiKey ? { "x-goog-api-key": this.apiKey } : {}
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts
          }
        ],
        generationConfig: {
          maxOutputTokens: request.maxOutputTokens ?? 1200
        }
      })
    });
    if (!response.ok) {
      throw new Error(`Provider ${this.id} failed: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "";
    return {
      text,
      usage: payload.usageMetadata ? { inputTokens: payload.usageMetadata.promptTokenCount, outputTokens: payload.usageMetadata.candidatesTokenCount } : void 0
    };
  }
};

// src/providers/heuristic.ts
function summarizePrompt(prompt) {
  const cleaned = normalizeWhitespace(prompt);
  if (!cleaned) {
    return "No prompt content provided.";
  }
  return firstSentences(cleaned, 2) || cleaned.slice(0, 280);
}
var HeuristicProviderAdapter = class extends BaseProviderAdapter {
  constructor(id, model) {
    super(id, "heuristic", model, ["chat", "structured", "vision", "local"]);
  }
  async generateText(request) {
    const attachmentHint = request.attachments?.length ? ` Attachments: ${request.attachments.length}.` : "";
    return {
      text: `Heuristic provider response.${attachmentHint} ${summarizePrompt(request.prompt)}`.trim()
    };
  }
};

// src/providers/local-whisper.ts
import { spawn } from "child_process";
import { constants as fsConstants } from "fs";
import fs4 from "fs/promises";
import os from "os";
import path3 from "path";
var DEFAULT_MODEL = "base.en";
var BINARY_CANDIDATES = ["whisper-cli", "whisper-cpp", "whisper"];
var MIME_TO_EXT = {
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/ogg": "ogg",
  "audio/webm": "webm"
};
var LocalWhisperProviderAdapter = class extends BaseProviderAdapter {
  options;
  constructor(id, model, options = {}) {
    super(id, "local-whisper", model, ["audio", "local"]);
    this.options = options;
  }
  async generateText(_request) {
    throw new Error(`Provider ${this.id} (local-whisper) only supports audio transcription.`);
  }
  async transcribeAudio(request) {
    const binaryPath = await this.resolveBinaryPath();
    const modelPath = await this.resolveModelPath();
    const tmpDir = this.options.tmpDir ?? os.tmpdir();
    const extension = this.extensionForRequest(request);
    const stem = `swarmvault-whisper-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const audioPath = path3.join(tmpDir, `${stem}.${extension}`);
    await fs4.writeFile(audioPath, request.bytes);
    const args = ["-m", modelPath, "-f", audioPath, "-nt"];
    if (request.corpusHint) {
      args.push("--prompt", request.corpusHint);
    }
    if (this.options.threads !== void 0) {
      args.push("-t", String(this.options.threads));
    }
    if (request.language) {
      args.push("-l", request.language);
    }
    if (this.options.extraArgs?.length) {
      args.push(...this.options.extraArgs);
    }
    const runner = this.options.runner ?? defaultWhisperRunner;
    try {
      const result = await runner({ binaryPath, args });
      if (result.code !== 0) {
        const tail = truncate2(result.stderr.trim() || result.stdout.trim(), 240);
        throw new Error(`whisper.cpp exited with code ${result.code}: ${tail}`);
      }
      return { text: normalizeTranscript(result.stdout) };
    } finally {
      await fs4.unlink(audioPath).catch(() => void 0);
    }
  }
  extensionForRequest(request) {
    const fromFile = request.fileName ? path3.extname(request.fileName).slice(1).toLowerCase() : "";
    if (fromFile) return fromFile;
    return MIME_TO_EXT[request.mimeType.toLowerCase()] ?? "wav";
  }
  async resolveBinaryPath() {
    if (this.options.binaryPath) return this.options.binaryPath;
    const env = this.options.env ?? process.env;
    if (env.SWARMVAULT_WHISPER_BINARY) return env.SWARMVAULT_WHISPER_BINARY;
    const pathValue = env.PATH ?? "";
    for (const dir of pathValue.split(path3.delimiter)) {
      if (!dir) continue;
      for (const candidate of BINARY_CANDIDATES) {
        const full = path3.join(dir, candidate);
        if (await isExecutable(full)) return full;
      }
    }
    throw new Error(
      'Local whisper binary not found. Install whisper.cpp (e.g. "brew install whisper-cpp" or "apt install whisper.cpp") or set "localWhisper.binaryPath" in swarmvault.config.json.'
    );
  }
  async resolveModelPath() {
    if (this.options.modelPath) return this.options.modelPath;
    const home = this.options.homeDir ?? (this.options.env ?? process.env).HOME ?? os.homedir();
    const modelName = this.options.model ?? this.model ?? DEFAULT_MODEL;
    const candidate = path3.join(home, ".swarmvault", "models", `ggml-${modelName}.bin`);
    if (await fileExists2(candidate)) return candidate;
    throw new Error(
      `Whisper model "${modelName}" not found at ${candidate}. Run "swarmvault provider setup --local-whisper" to download it.`
    );
  }
};
var defaultWhisperRunner = ({ binaryPath, args }) => new Promise((resolve, reject) => {
  const child = spawn(binaryPath, args, { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString("utf8");
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString("utf8");
  });
  child.on("error", reject);
  child.on("close", (code) => {
    resolve({ code: code ?? 0, stdout, stderr });
  });
});
function normalizeTranscript(stdout) {
  return stdout.split("\n").map((line) => line.trim()).filter((line) => line.length > 0).join(" ").replace(/\s+/g, " ").trim();
}
async function fileExists2(p) {
  try {
    await fs4.access(p);
    return true;
  } catch {
    return false;
  }
}
async function isExecutable(p) {
  try {
    await fs4.access(p, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}
function truncate2(text, maxLen) {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}\u2026`;
}

// src/providers/openai-compatible.ts
import path4 from "path";
import { z as z4 } from "zod";
function buildAuthHeaders(apiKey) {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}
function extractResponsesText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }
  return payload.output?.flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text" && typeof item.text === "string").map((item) => item.text ?? "").join("\n").trim() ?? "";
}
function isJsonSchemaObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function allowNullInSchema(schema) {
  if (Array.isArray(schema.type)) {
    return schema.type.includes("null") ? schema : { ...schema, type: [...schema.type, "null"] };
  }
  if (typeof schema.type === "string") {
    return schema.type === "null" ? schema : { ...schema, type: [schema.type, "null"] };
  }
  if (Array.isArray(schema.enum)) {
    return schema.enum.includes(null) ? schema : { ...schema, enum: [...schema.enum, null] };
  }
  if (Array.isArray(schema.anyOf)) {
    return schema.anyOf.some((item) => isJsonSchemaObject(item) && item.type === "null") ? schema : { ...schema, anyOf: [...schema.anyOf, { type: "null" }] };
  }
  return { anyOf: [schema, { type: "null" }] };
}
function toOpenAiStrictJsonSchema(schema) {
  if (Array.isArray(schema)) {
    return schema.map((item) => toOpenAiStrictJsonSchema(item));
  }
  if (!isJsonSchemaObject(schema)) {
    return schema;
  }
  const normalizedEntries = Object.entries(schema).filter(([key]) => key !== "$schema").map(([key, value]) => [key, toOpenAiStrictJsonSchema(value)]);
  const normalizedSchema = Object.fromEntries(normalizedEntries);
  if (isJsonSchemaObject(normalizedSchema.properties)) {
    const properties = normalizedSchema.properties;
    const originalRequired = Array.isArray(normalizedSchema.required) ? normalizedSchema.required.filter((item) => typeof item === "string") : [];
    const requiredSet = new Set(originalRequired);
    const propertyEntries = Object.entries(properties).map(([key, value]) => {
      const normalizedProperty = isJsonSchemaObject(value) ? value : {};
      return [key, requiredSet.has(key) ? normalizedProperty : allowNullInSchema(normalizedProperty)];
    });
    return {
      ...normalizedSchema,
      properties: Object.fromEntries(propertyEntries),
      required: Object.keys(properties),
      additionalProperties: false
    };
  }
  return normalizedSchema;
}
function stripNullObjectProperties(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripNullObjectProperties(item));
  }
  if (!isJsonSchemaObject(value)) {
    return value;
  }
  const entries = Object.entries(value).filter(([, item]) => item !== null).map(([key, item]) => [key, stripNullObjectProperties(item)]);
  return Object.fromEntries(entries);
}
function buildStructuredFormat(schema) {
  return {
    type: "json_schema",
    name: "swarmvault_response",
    schema: toOpenAiStrictJsonSchema(z4.toJSONSchema(schema)),
    strict: true
  };
}
var OpenAiCompatibleProviderAdapter = class extends BaseProviderAdapter {
  baseUrl;
  apiKey;
  headers;
  apiStyle;
  constructor(id, type, model, options) {
    super(id, type, model, options.capabilities);
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.headers = options.headers;
    this.apiStyle = options.apiStyle ?? "responses";
  }
  async generateText(request) {
    if (this.apiStyle === "chat") {
      return this.generateViaChatCompletions(request);
    }
    return this.generateViaResponses(request);
  }
  async generateStructured(request, schema) {
    if (this.type !== "openai") {
      return super.generateStructured(request, schema);
    }
    const structuredFormat = buildStructuredFormat(schema);
    const text = this.apiStyle === "chat" ? await this.generateStructuredViaChatCompletions(
      {
        ...request
      },
      structuredFormat
    ) : await this.generateStructuredViaResponses(
      {
        ...request
      },
      structuredFormat
    );
    return schema.parse(stripNullObjectProperties(JSON.parse(extractJson(text))));
  }
  async embedTexts(texts) {
    if (!texts.length) {
      return [];
    }
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...buildAuthHeaders(this.apiKey),
        ...this.headers
      },
      body: JSON.stringify({
        model: this.model,
        input: texts
      })
    });
    if (!response.ok) {
      throw new Error(`Provider ${this.id} failed: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    const vectors = payload.data?.map((item) => item.embedding ?? []) ?? [];
    if (vectors.length !== texts.length || vectors.some((vector) => !Array.isArray(vector) || vector.length === 0)) {
      throw new Error(`Provider ${this.id} returned invalid embedding data.`);
    }
    return vectors;
  }
  async generateImage(request) {
    const encodedAttachments = await this.encodeAttachments(request.attachments);
    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...buildAuthHeaders(this.apiKey),
        ...this.headers
      },
      body: JSON.stringify({
        model: this.model,
        prompt: request.prompt,
        size: request.width && request.height ? `${Math.max(256, Math.round(request.width))}x${Math.max(256, Math.round(request.height))}` : void 0,
        response_format: "b64_json",
        ...encodedAttachments.length ? {
          input_image: encodedAttachments.map((item) => `data:${item.mimeType};base64,${item.base64}`)
        } : {}
      })
    });
    if (!response.ok) {
      throw new Error(`Provider ${this.id} failed: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    const image = payload.data?.[0];
    if (!image?.b64_json) {
      throw new Error(`Provider ${this.id} returned no image data.`);
    }
    return {
      mimeType: "image/png",
      bytes: Buffer.from(image.b64_json, "base64"),
      width: request.width,
      height: request.height,
      revisedPrompt: image.revised_prompt
    };
  }
  async transcribeAudio(request) {
    const extension = request.mimeType.split("/")[1]?.split("+")[0] ?? "bin";
    const fileName = request.fileName ?? `audio.${extension}`;
    const formData = new FormData();
    formData.append("file", new File([new Uint8Array(request.bytes)], path4.basename(fileName), { type: request.mimeType }));
    formData.append("model", this.model);
    formData.append("response_format", "verbose_json");
    if (request.language) {
      formData.append("language", request.language);
    }
    if (request.corpusHint) {
      formData.append("prompt", request.corpusHint);
    }
    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        ...buildAuthHeaders(this.apiKey),
        ...this.headers
      },
      body: formData
    });
    if (!response.ok) {
      throw new Error(`Provider ${this.id} audio transcription failed: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    return {
      text: payload.text ?? "",
      duration: payload.duration,
      language: payload.language
    };
  }
  async generateViaResponses(request) {
    const encodedAttachments = await this.encodeAttachments(request.attachments);
    const input = encodedAttachments.length ? [
      {
        role: "user",
        content: [
          { type: "input_text", text: request.prompt },
          ...encodedAttachments.map((item) => ({
            type: "input_image",
            image_url: `data:${item.mimeType};base64,${item.base64}`
          }))
        ]
      }
    ] : request.prompt;
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...buildAuthHeaders(this.apiKey),
        ...this.headers
      },
      body: JSON.stringify({
        model: this.model,
        input,
        instructions: request.system,
        max_output_tokens: request.maxOutputTokens
      })
    });
    if (!response.ok) {
      throw new Error(`Provider ${this.id} failed: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    return {
      text: extractResponsesText(payload),
      usage: payload.usage ? { inputTokens: payload.usage.input_tokens, outputTokens: payload.usage.output_tokens } : void 0
    };
  }
  async generateStructuredViaResponses(request, format) {
    const encodedAttachments = await this.encodeAttachments(request.attachments);
    const input = encodedAttachments.length ? [
      {
        role: "user",
        content: [
          { type: "input_text", text: request.prompt },
          ...encodedAttachments.map((item) => ({
            type: "input_image",
            image_url: `data:${item.mimeType};base64,${item.base64}`
          }))
        ]
      }
    ] : request.prompt;
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...buildAuthHeaders(this.apiKey),
        ...this.headers
      },
      body: JSON.stringify({
        model: this.model,
        input,
        instructions: request.system,
        max_output_tokens: request.maxOutputTokens,
        text: {
          format
        }
      })
    });
    if (!response.ok) {
      throw new Error(`Provider ${this.id} failed: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    return extractResponsesText(payload);
  }
  async generateViaChatCompletions(request) {
    const encodedAttachments = await this.encodeAttachments(request.attachments);
    const content = encodedAttachments.length ? [
      { type: "text", text: request.prompt },
      ...encodedAttachments.map((item) => ({
        type: "image_url",
        image_url: {
          url: `data:${item.mimeType};base64,${item.base64}`
        }
      }))
    ] : request.prompt;
    const messages = [...request.system ? [{ role: "system", content: request.system }] : [], { role: "user", content }];
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...buildAuthHeaders(this.apiKey),
        ...this.headers
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: request.maxOutputTokens
      })
    });
    if (!response.ok) {
      throw new Error(`Provider ${this.id} failed: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    const contentValue = payload.choices?.[0]?.message?.content;
    const text = Array.isArray(contentValue) ? contentValue.map((item) => item.text ?? "").join("\n") : contentValue ?? "";
    return {
      text,
      usage: payload.usage ? { inputTokens: payload.usage.prompt_tokens, outputTokens: payload.usage.completion_tokens } : void 0
    };
  }
  async generateStructuredViaChatCompletions(request, format) {
    const encodedAttachments = await this.encodeAttachments(request.attachments);
    const content = encodedAttachments.length ? [
      { type: "text", text: request.prompt },
      ...encodedAttachments.map((item) => ({
        type: "image_url",
        image_url: {
          url: `data:${item.mimeType};base64,${item.base64}`
        }
      }))
    ] : request.prompt;
    const messages = [...request.system ? [{ role: "system", content: request.system }] : [], { role: "user", content }];
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...buildAuthHeaders(this.apiKey),
        ...this.headers
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: request.maxOutputTokens,
        response_format: {
          type: "json_schema",
          json_schema: format
        }
      })
    });
    if (!response.ok) {
      throw new Error(`Provider ${this.id} failed: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    const contentValue = payload.choices?.[0]?.message?.content;
    return Array.isArray(contentValue) ? contentValue.map((item) => item.text ?? "").join("\n") : contentValue ?? "";
  }
};

// src/providers/registry.ts
var customModuleSchema = z5.object({
  createAdapter: z5.function({
    input: [z5.string(), z5.custom(), z5.string()],
    output: z5.promise(z5.custom())
  })
});
function resolveCapabilities(config, fallback) {
  return config.capabilities?.length ? config.capabilities : fallback;
}
function envOrUndefined(name) {
  return name ? process.env[name] : void 0;
}
function createOpenAiCompatiblePreset(id, type, config, defaults) {
  return new OpenAiCompatibleProviderAdapter(id, type, config.model, {
    baseUrl: config.baseUrl ?? defaults.baseUrl,
    apiKey: envOrUndefined(config.apiKeyEnv ?? defaults.apiKeyEnv),
    headers: config.headers,
    apiStyle: config.apiStyle ?? defaults.apiStyle ?? "chat",
    capabilities: resolveCapabilities(config, defaults.capabilities)
  });
}
async function createProvider(id, config, rootDir) {
  switch (config.type) {
    case "heuristic":
      return new HeuristicProviderAdapter(id, config.model);
    case "openai":
      return new OpenAiCompatibleProviderAdapter(id, "openai", config.model, {
        baseUrl: config.baseUrl ?? "https://api.openai.com/v1",
        apiKey: envOrUndefined(config.apiKeyEnv),
        headers: config.headers,
        apiStyle: config.apiStyle ?? "responses",
        capabilities: resolveCapabilities(config, [
          "responses",
          "chat",
          "structured",
          "tools",
          "vision",
          "embeddings",
          "streaming",
          "image_generation",
          "audio"
        ])
      });
    case "ollama":
      return new OpenAiCompatibleProviderAdapter(id, "ollama", config.model, {
        baseUrl: config.baseUrl ?? "http://localhost:11434/v1",
        apiKey: envOrUndefined(config.apiKeyEnv) ?? "ollama",
        headers: config.headers,
        apiStyle: config.apiStyle ?? "responses",
        capabilities: resolveCapabilities(config, [
          "responses",
          "chat",
          "structured",
          "tools",
          "vision",
          "embeddings",
          "streaming",
          "local",
          "audio"
        ])
      });
    case "openai-compatible":
      return new OpenAiCompatibleProviderAdapter(id, "openai-compatible", config.model, {
        baseUrl: config.baseUrl ?? "http://localhost:8000/v1",
        apiKey: envOrUndefined(config.apiKeyEnv),
        headers: config.headers,
        apiStyle: config.apiStyle ?? "responses",
        capabilities: resolveCapabilities(config, ["chat", "structured", "embeddings", "audio"])
      });
    case "openrouter":
      return createOpenAiCompatiblePreset(id, "openrouter", config, {
        baseUrl: "https://openrouter.ai/api/v1",
        apiKeyEnv: "OPENROUTER_API_KEY",
        apiStyle: "chat",
        capabilities: ["chat", "structured", "embeddings"]
      });
    case "groq":
      return createOpenAiCompatiblePreset(id, "groq", config, {
        baseUrl: "https://api.groq.com/openai/v1",
        apiKeyEnv: "GROQ_API_KEY",
        apiStyle: "chat",
        capabilities: ["chat", "structured", "embeddings", "audio"]
      });
    case "together":
      return createOpenAiCompatiblePreset(id, "together", config, {
        baseUrl: "https://api.together.xyz/v1",
        apiKeyEnv: "TOGETHER_API_KEY",
        apiStyle: "chat",
        capabilities: ["chat", "structured", "embeddings"]
      });
    case "xai":
      return createOpenAiCompatiblePreset(id, "xai", config, {
        baseUrl: "https://api.x.ai/v1",
        apiKeyEnv: "XAI_API_KEY",
        apiStyle: "chat",
        capabilities: ["chat", "structured", "embeddings"]
      });
    case "cerebras":
      return createOpenAiCompatiblePreset(id, "cerebras", config, {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKeyEnv: "CEREBRAS_API_KEY",
        apiStyle: "chat",
        capabilities: ["chat", "structured", "embeddings"]
      });
    case "anthropic":
      return new AnthropicProviderAdapter(id, config.model, {
        apiKey: envOrUndefined(config.apiKeyEnv),
        headers: config.headers,
        baseUrl: config.baseUrl
      });
    case "gemini":
      return new GeminiProviderAdapter(id, config.model, {
        apiKey: envOrUndefined(config.apiKeyEnv),
        baseUrl: config.baseUrl
      });
    case "local-whisper":
      return new LocalWhisperProviderAdapter(id, config.model, {
        binaryPath: config.binaryPath,
        modelPath: config.modelPath,
        extraArgs: config.extraArgs,
        threads: config.threads
      });
    case "custom": {
      if (!config.module) {
        throw new Error(`Provider ${id} is type "custom" but no module path was configured.`);
      }
      const resolvedModule = path5.isAbsolute(config.module) ? config.module : path5.resolve(rootDir, config.module);
      const loaded = await import(pathToFileURL(resolvedModule).href);
      const parsed = customModuleSchema.parse(loaded);
      return parsed.createAdapter(id, config, rootDir);
    }
    default:
      throw new Error(`Unsupported provider type ${String(config.type)}`);
  }
}
async function getProviderForTask(rootDir, task) {
  const { config } = await loadVaultConfig(rootDir);
  const providerId = config.tasks[task];
  if (!providerId) {
    throw new Error(`No provider configured for task "${String(task)}".`);
  }
  const providerConfig = config.providers[providerId];
  if (!providerConfig) {
    throw new Error(`No provider configured with id "${providerId}" for task "${task}".`);
  }
  return createProvider(providerId, providerConfig, rootDir);
}
function assertProviderCapability(provider, capability) {
  if (!provider.capabilities.has(capability)) {
    throw new Error(`Provider ${provider.id} does not support required capability "${capability}".`);
  }
}
async function getResolvedPaths(rootDir) {
  return (await loadVaultConfig(rootDir)).paths;
}

export {
  slugify,
  sha256,
  ensureDir,
  fileExists,
  readJsonFile,
  writeJsonFile,
  appendJsonLine,
  writeFileIfChanged,
  toPosix,
  isPathWithin,
  firstSentences,
  uniqueBy,
  normalizeWhitespace,
  truncate,
  listFilesRecursive,
  PRIMARY_SCHEMA_FILENAME,
  defaultVaultConfig,
  defaultVaultSchema,
  resolvePaths,
  loadVaultConfig,
  initWorkspace,
  LocalWhisperProviderAdapter,
  createProvider,
  getProviderForTask,
  assertProviderCapability,
  getResolvedPaths
};

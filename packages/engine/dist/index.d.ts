import { z } from 'zod';
import { Readable, Writable } from 'node:stream';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

declare const providerCapabilitySchema: z.ZodEnum<{
    responses: "responses";
    chat: "chat";
    structured: "structured";
    tools: "tools";
    vision: "vision";
    embeddings: "embeddings";
    streaming: "streaming";
    local: "local";
    image_generation: "image_generation";
    audio: "audio";
}>;
type ProviderCapability = z.infer<typeof providerCapabilitySchema>;
declare const providerTypeSchema: z.ZodEnum<{
    heuristic: "heuristic";
    openai: "openai";
    ollama: "ollama";
    anthropic: "anthropic";
    gemini: "gemini";
    "openai-compatible": "openai-compatible";
    openrouter: "openrouter";
    groq: "groq";
    together: "together";
    xai: "xai";
    cerebras: "cerebras";
    "local-whisper": "local-whisper";
    custom: "custom";
}>;
type ProviderType = z.infer<typeof providerTypeSchema>;
declare const agentTypeSchema: z.ZodEnum<{
    gemini: "gemini";
    codex: "codex";
    claude: "claude";
    cursor: "cursor";
    goose: "goose";
    pi: "pi";
    opencode: "opencode";
    aider: "aider";
    copilot: "copilot";
    trae: "trae";
    claw: "claw";
    droid: "droid";
    kiro: "kiro";
    hermes: "hermes";
    antigravity: "antigravity";
    vscode: "vscode";
    amp: "amp";
    augment: "augment";
    adal: "adal";
    bob: "bob";
    cline: "cline";
    codebuddy: "codebuddy";
    "command-code": "command-code";
    continue: "continue";
    cortex: "cortex";
    crush: "crush";
    deepagents: "deepagents";
    firebender: "firebender";
    iflow: "iflow";
    junie: "junie";
    "kilo-code": "kilo-code";
    kimi: "kimi";
    kode: "kode";
    mcpjam: "mcpjam";
    "mistral-vibe": "mistral-vibe";
    mux: "mux";
    neovate: "neovate";
    openclaw: "openclaw";
    openhands: "openhands";
    pochi: "pochi";
    qoder: "qoder";
    "qwen-code": "qwen-code";
    replit: "replit";
    "roo-code": "roo-code";
    "trae-cn": "trae-cn";
    warp: "warp";
    windsurf: "windsurf";
    zencoder: "zencoder";
}>;
type AgentType = z.infer<typeof agentTypeSchema>;
type PageKind = "index" | "source" | "module" | "concept" | "entity" | "output" | "insight" | "memory_task" | "graph_report" | "community_summary";
type Freshness = "fresh" | "stale";
/**
 * Consolidation tier for insight pages (LLM Wiki v2 memory model).
 *  - `working`: raw recent observations from ad-hoc query/explore output.
 *  - `episodic`: session-scoped digest rolled up from multiple working pages.
 *  - `semantic`: cross-session durable facts repeated across episodic pages.
 *  - `procedural`: how-to workflows inferred from repeated sequences.
 * Non-insight pages (sources, modules, concepts, entities, outputs) leave
 * `tier` undefined. Pages without a `tier` field default to `working` when
 * loaded so 0.9.0 vaults require no migration.
 */
type MemoryTier = "working" | "episodic" | "semantic" | "procedural";
type ClaimStatus = "extracted" | "inferred" | "conflicted" | "stale";
type EvidenceClass = "extracted" | "inferred" | "ambiguous";
type Polarity = "positive" | "negative" | "neutral";
type OutputOrigin = "query" | "explore" | "source_brief" | "source_review" | "source_guide" | "source_session";
type OutputFormat = "markdown" | "report" | "slides" | "chart" | "image";
type ContextPackFormat = "markdown" | "json" | "llms";
type ContextPackItemKind = "page" | "node" | "edge" | "hyperedge";
type AgentMemoryTaskStatus = "active" | "blocked" | "completed" | "archived";
type AgentMemoryResumeFormat = "markdown" | "json" | "llms";
type OutputAssetRole = "primary" | "preview" | "manifest" | "poster";
type GraphExportFormat = "html" | "html-standalone" | "report" | "svg" | "graphml" | "cypher" | "json" | "obsidian" | "canvas";
type PageStatus = "draft" | "candidate" | "active" | "blocked" | "completed" | "archived";
type PageManager = "system" | "human";
type ApprovalEntryStatus = "pending" | "accepted" | "rejected";
type ApprovalChangeType = "create" | "update" | "delete" | "promote";
type ApprovalBundleType = "compile" | "generated-output" | "source-review" | "guided-source" | "guided-session";
type ApprovalEntryLabel = "source-brief" | "source-review" | "source-guide" | "guided-update";
type GuidedSourceSessionStatus = "awaiting_input" | "ready_to_stage" | "staged" | "accepted" | "rejected";
type VaultProfilePreset = "reader" | "timeline" | "diligence" | "thesis";
type VaultDashboardPack = "default" | "reader" | "diligence";
type GuidedSessionMode = "insights_only" | "canonical_review";
type SourceKind = "markdown" | "text" | "pdf" | "image" | "html" | "docx" | "epub" | "csv" | "xlsx" | "pptx" | "odt" | "odp" | "ods" | "jupyter" | "data" | "bibtex" | "rtf" | "org" | "asciidoc" | "transcript" | "chat_export" | "email" | "calendar" | "audio" | "video" | "youtube" | "binary" | "code";
type SourceCaptureType = "arxiv" | "doi" | "tweet" | "article" | "url";
type SourceClass = "first_party" | "third_party" | "resource" | "generated";
type ManagedSourceKind = "directory" | "file" | "github_repo" | "crawl_url";
type ManagedSourceStatus = "ready" | "missing" | "error";
type CodeLanguage = "javascript" | "jsx" | "typescript" | "tsx" | "bash" | "python" | "go" | "rust" | "java" | "kotlin" | "scala" | "dart" | "lua" | "zig" | "csharp" | "c" | "cpp" | "php" | "ruby" | "powershell" | "swift" | "elixir" | "ocaml" | "objc" | "rescript" | "solidity" | "html" | "css" | "vue" | "sql";
type CodeSymbolKind = "function" | "class" | "interface" | "type_alias" | "enum" | "variable" | "struct" | "trait" | "table" | "view";
type OrchestrationRole = "research" | "audit" | "context" | "safety";
declare const webSearchProviderTypeSchema: z.ZodEnum<{
    custom: "custom";
    "http-json": "http-json";
}>;
type WebSearchProviderType = z.infer<typeof webSearchProviderTypeSchema>;
interface GenerationAttachment {
    mimeType: string;
    filePath: string;
}
interface GenerationRequest {
    system?: string;
    prompt: string;
    attachments?: GenerationAttachment[];
    maxOutputTokens?: number;
}
interface GenerationResponse {
    text: string;
    usage?: {
        inputTokens?: number;
        outputTokens?: number;
    };
}
interface ImageGenerationRequest {
    prompt: string;
    system?: string;
    width?: number;
    height?: number;
    attachments?: GenerationAttachment[];
}
interface ImageGenerationResponse {
    mimeType: string;
    bytes: Uint8Array;
    width?: number;
    height?: number;
    revisedPrompt?: string;
}
interface AudioTranscriptionRequest {
    mimeType: string;
    bytes: Buffer;
    fileName?: string;
    language?: string;
    /**
     * Optional one-sentence domain hint derived from the vault's top god nodes.
     * Providers that accept a prompt (e.g. Whisper) can pass it through to bias
     * transcription toward in-corpus terminology. Providers without prompt
     * support ignore it safely.
     */
    corpusHint?: string;
}
interface AudioTranscriptionResponse {
    text: string;
    duration?: number;
    language?: string;
}
interface ProviderAdapter {
    readonly id: string;
    readonly type: ProviderType;
    readonly model: string;
    readonly capabilities: Set<ProviderCapability>;
    generateText(request: GenerationRequest): Promise<GenerationResponse>;
    generateStructured<T>(request: GenerationRequest, schema: z.ZodType<T>): Promise<T>;
    embedTexts?(texts: string[]): Promise<number[][]>;
    generateImage?(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
    transcribeAudio?(request: AudioTranscriptionRequest): Promise<AudioTranscriptionResponse>;
}
interface ProviderConfig {
    type: ProviderType;
    model: string;
    baseUrl?: string;
    apiKeyEnv?: string;
    headers?: Record<string, string>;
    module?: string;
    capabilities?: ProviderCapability[];
    apiStyle?: "responses" | "chat";
    /** local-whisper: override the binary discovery search. */
    binaryPath?: string;
    /** local-whisper: explicit path to the ggml model file. */
    modelPath?: string;
    /** local-whisper: extra CLI flags forwarded to whisper.cpp. */
    extraArgs?: string[];
    /** local-whisper: thread count passed as `-t`. */
    threads?: number;
}
interface WebSearchProviderConfig {
    type: WebSearchProviderType;
    endpoint?: string;
    method?: "GET" | "POST";
    apiKeyEnv?: string;
    apiKeyHeader?: string;
    apiKeyPrefix?: string;
    headers?: Record<string, string>;
    queryParam?: string;
    limitParam?: string;
    resultsPath?: string;
    titleField?: string;
    urlField?: string;
    snippetField?: string;
    module?: string;
}
interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
}
interface WebSearchAdapter {
    readonly id: string;
    readonly type: WebSearchProviderType;
    search(query: string, limit?: number): Promise<WebSearchResult[]>;
}
interface VaultProfileConfig {
    presets: VaultProfilePreset[];
    dashboardPack: VaultDashboardPack;
    guidedSessionMode: GuidedSessionMode;
    dataviewBlocks: boolean;
    guidedIngestDefault: boolean;
    deepLintDefault: boolean;
}
interface VaultConfig {
    workspace: {
        rawDir: string;
        wikiDir: string;
        stateDir: string;
        agentDir: string;
        inboxDir: string;
    };
    providers: Record<string, ProviderConfig>;
    tasks: {
        compileProvider: string;
        queryProvider: string;
        lintProvider: string;
        visionProvider: string;
        imageProvider?: string;
        embeddingProvider?: string;
        audioProvider?: string;
    };
    viewer: {
        port: number;
    };
    profile: VaultProfileConfig;
    projects?: Record<string, {
        roots: string[];
        schemaPath?: string;
    }>;
    agents: AgentType[];
    schedules?: Record<string, ScheduleJobConfig>;
    orchestration?: OrchestrationConfig;
    benchmark?: {
        enabled?: boolean;
        questions?: string[];
        maxQuestions?: number;
    };
    repoAnalysis?: {
        classifyGlobs?: Partial<Record<SourceClass, string[]>>;
        extractClasses?: SourceClass[];
    };
    graphSinks?: {
        neo4j?: Neo4jGraphSinkConfig;
    };
    graph?: {
        communityResolution?: number;
        /**
         * Minimum IDF weight a similarity feature must carry to contribute to an
         * inferred `semantically_similar_to` edge. Features below the floor are
         * dropped entirely. Defaults to 0.5.
         */
        similarityIdfFloor?: number;
        /**
         * Hard cap on the number of inferred similarity edges emitted. Defaults
         * to `min(5 * nodeCount, 20000)` so very large repos do not produce
         * O(n²) similarity fan-out.
         */
        similarityEdgeCap?: number;
        /**
         * Upper bound on god-node entries surfaced in the graph report and
         * tooling. Defaults to 20 for small repos and 10 for large ones.
         */
        godNodeLimit?: number;
        /**
         * Report rollup threshold: communities with fewer members than this are
         * folded into the fragmented-community rollup instead of listed
         * individually. Defaults to `max(3, ceil(totalCommunities / 50))`.
         */
        foldCommunitiesBelow?: number;
    };
    retrieval?: {
        backend?: "sqlite";
        shardSize?: number;
        hybrid?: boolean;
        rerank?: boolean;
        embeddingProvider?: string;
        maxIndexedRows?: number;
    };
    webSearch?: {
        providers: Record<string, WebSearchProviderConfig>;
        tasks: {
            deepLintProvider: string;
            queryProvider?: string;
            exploreProvider?: string;
        };
    };
    search?: {
        /** @deprecated Use retrieval.hybrid instead. */
        hybrid?: boolean;
        /** @deprecated Use retrieval.rerank instead. */
        rerank?: boolean;
    };
    autoCommit?: boolean;
    candidate?: {
        autoPromote?: CandidatePromotionConfig;
    };
    redaction?: RedactionSettings;
    freshness?: FreshnessConfig;
    consolidation?: ConsolidationConfig;
    watch?: WatchConfig;
    prompts?: CompilePromptConfig;
}
interface CompilePromptConfig {
    compile?: {
        systemExtra?: string[];
        conceptRules?: string[];
        entityRules?: string[];
        claimRules?: string[];
    };
    customModule?: string;
}
/**
 * Explicit user control over which repository roots `swarmvault watch --repo` tracks.
 * Absent config preserves the existing auto-discovery behavior over managed sources and manifests.
 */
interface WatchConfig {
    repoRoots?: string[];
    excludeRepoRoots?: string[];
}
/**
 * Heuristic configuration for the LLM Wiki v2 consolidation tier rollup.
 *
 * Defaults are baked in so 0.9.0 configs keep working without migration:
 *   - enabled: true
 *   - workingToEpisodic: { minPages: 3, sessionWindowHours: 24, minSharedNodeRatio: 0.3 }
 *   - episodicToSemantic: { minOccurrences: 3 }
 *   - semanticToProcedural: { minWorkflowSteps: 3 }
 */
interface ConsolidationConfig {
    enabled?: boolean;
    workingToEpisodic?: {
        minPages?: number;
        sessionWindowHours?: number;
        minSharedNodeRatio?: number;
    };
    episodicToSemantic?: {
        minOccurrences?: number;
    };
    semanticToProcedural?: {
        minWorkflowSteps?: number;
    };
}
interface ConsolidationPromotion {
    pageId: string;
    fromTier: MemoryTier;
    toTier: MemoryTier;
}
interface ConsolidationResult {
    promoted: ConsolidationPromotion[];
    newPages: GraphPage[];
    decisions: string[];
}
interface FreshnessConfig {
    /** Default half-life in days when the page's source class is unknown. Defaults to 365. */
    defaultHalfLifeDays?: number;
    /** Below this score a page is considered stale. Defaults to 0.3. */
    staleThreshold?: number;
    /** Per-source-class half-life overrides in days. */
    halfLifeDaysBySourceClass?: Partial<Record<SourceClass, number>>;
}
interface RedactionPatternConfig {
    id: string;
    pattern: string;
    flags?: string;
    placeholder?: string;
    description?: string;
}
interface RedactionSettings {
    enabled?: boolean;
    placeholder?: string;
    useDefaults?: boolean;
    patterns?: RedactionPatternConfig[];
}
interface RedactionMatchSummary {
    patternId: string;
    count: number;
}
interface RedactionSummary {
    sourceId: string;
    title: string;
    matches: RedactionMatchSummary[];
}
interface CandidatePromotionConfig {
    enabled: boolean;
    minSources: number;
    minConfidence: number;
    minAgreement: number;
    minDegree: number;
    minAgeHours: number;
    maxPerRun: number;
    dryRun: boolean;
}
type PromotionGateKind = "sources" | "confidence" | "agreement" | "degree" | "age";
interface PromotionGateResult {
    gate: PromotionGateKind;
    value: number;
    threshold: number;
    passed: boolean;
}
interface PromotionDecision {
    pageId: string;
    title: string;
    kind: "concept" | "entity";
    promote: boolean;
    score: number;
    gates: PromotionGateResult[];
    reasons: string[];
}
interface PromotionSession {
    startedAt: string;
    finishedAt: string;
    dryRun: boolean;
    promotedPageIds: string[];
    skippedPageIds: string[];
    decisions: PromotionDecision[];
    sessionPath?: string;
}
interface ResolvedPaths {
    rootDir: string;
    schemaPath: string;
    rawDir: string;
    rawSourcesDir: string;
    rawAssetsDir: string;
    wikiDir: string;
    outputsAssetsDir: string;
    projectsDir: string;
    candidatesDir: string;
    candidateConceptsDir: string;
    candidateEntitiesDir: string;
    stateDir: string;
    retrievalDir: string;
    retrievalManifestPath: string;
    schedulesDir: string;
    agentDir: string;
    inboxDir: string;
    manifestsDir: string;
    extractsDir: string;
    analysesDir: string;
    viewerDistDir: string;
    graphPath: string;
    searchDbPath: string;
    compileStatePath: string;
    codeIndexPath: string;
    embeddingsPath: string;
    benchmarkPath: string;
    jobsLogPath: string;
    sessionsDir: string;
    sourceSessionsDir: string;
    approvalsDir: string;
    watchDir: string;
    watchStatusPath: string;
    pendingSemanticRefreshPath: string;
    managedSourcesPath: string;
    managedSourcesDir: string;
    configPath: string;
}
interface SourceAttachment {
    path: string;
    mimeType: string;
    originalPath?: string;
}
type ExtractionKind = "plain_text" | "html_readability" | "pdf_text" | "docx_text" | "epub_text" | "csv_text" | "xlsx_text" | "pptx_text" | "odt_text" | "odp_text" | "ods_text" | "jupyter_text" | "structured_data" | "bibtex_text" | "rtf_text" | "org_text" | "asciidoc_text" | "transcript_text" | "chat_export_text" | "email_text" | "calendar_text" | "image_vision" | "audio_transcription" | "video_transcription" | "youtube_transcript";
interface ExtractionTerm {
    name: string;
    description: string;
}
interface ExtractionClaim {
    text: string;
    confidence: number;
    polarity: Polarity;
}
interface ImageVisionExtraction {
    title?: string;
    summary: string;
    text: string;
    concepts: ExtractionTerm[];
    entities: ExtractionTerm[];
    claims: ExtractionClaim[];
    questions: string[];
}
interface SourceExtractionArtifact {
    extractor: ExtractionKind;
    sourceKind: SourceKind;
    mimeType: string;
    producedAt: string;
    providerId?: string;
    providerModel?: string;
    warnings?: string[];
    pageCount?: number;
    metadata?: Record<string, string>;
    vision?: ImageVisionExtraction;
}
interface IngestOptions {
    includeAssets?: boolean;
    maxAssetSize?: number;
    repoRoot?: string;
    include?: string[];
    exclude?: string[];
    maxFiles?: number;
    gitignore?: boolean;
    swarmvaultignore?: boolean;
    video?: boolean;
    extractClasses?: SourceClass[];
    resume?: string;
    /**
     * Override the config-level redaction flag for this run. Defaults to the
     * effective value in `VaultConfig.redaction.enabled` (which itself defaults
     * to `true` when the config block is absent). Pass `false` to skip
     * redaction entirely for this run.
     */
    redact?: boolean;
}
interface DirectoryIngestSkip {
    path: string;
    reason: string;
}
interface DirectoryIngestFailure {
    path: string;
    error: string;
    stage: "prepare" | "persist";
}
interface DirectoryIngestResult {
    inputDir: string;
    repoRoot: string;
    scannedCount: number;
    imported: SourceManifest[];
    updated: SourceManifest[];
    skipped: DirectoryIngestSkip[];
    failed?: DirectoryIngestFailure[];
    runId?: string;
    statePath?: string;
    /**
     * Per-source redaction counts surfaced to CLI/MCP callers. Empty when
     * redaction was disabled or no matches were found on the ingested inputs.
     */
    redactions?: RedactionSummary[];
}
interface InputIngestResult {
    input: string;
    scannedCount: number;
    created: SourceManifest[];
    updated: SourceManifest[];
    unchanged: SourceManifest[];
    removed: SourceManifest[];
    skipped: DirectoryIngestSkip[];
    /**
     * Per-source redaction counts surfaced to CLI/MCP callers. Empty when
     * redaction was disabled or no matches were found on the ingested inputs.
     */
    redactions?: RedactionSummary[];
}
interface SourceManifest {
    sourceId: string;
    title: string;
    originType: "file" | "url";
    sourceKind: SourceKind;
    sourceType?: SourceCaptureType;
    sourceClass?: SourceClass;
    language?: CodeLanguage;
    originalPath?: string;
    repoRelativePath?: string;
    url?: string;
    storedPath: string;
    extractedTextPath?: string;
    extractedMetadataPath?: string;
    extractionHash?: string;
    mimeType: string;
    contentHash: string;
    semanticHash: string;
    sourceGroupId?: string;
    sourceGroupTitle?: string;
    sourcePartKey?: string;
    partIndex?: number;
    partCount?: number;
    partTitle?: string;
    details?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
    attachments?: SourceAttachment[];
}
interface ManagedSourceSyncCounts {
    scannedCount: number;
    importedCount: number;
    updatedCount: number;
    removedCount: number;
    skippedCount: number;
}
interface ManagedSourceRecord {
    id: string;
    kind: ManagedSourceKind;
    title: string;
    path?: string;
    repoRoot?: string;
    url?: string;
    createdAt: string;
    updatedAt: string;
    status: ManagedSourceStatus;
    sourceIds: string[];
    briefPath?: string;
    lastSyncAt?: string;
    lastSyncStatus?: "success" | "error";
    lastSyncCounts?: ManagedSourceSyncCounts;
    lastError?: string;
    changed?: boolean;
}
interface ManagedSourcesArtifact {
    version: 1;
    sources: ManagedSourceRecord[];
}
interface AnalyzedTerm {
    id: string;
    name: string;
    description: string;
}
interface SourceClaim {
    id: string;
    text: string;
    confidence: number;
    status: ClaimStatus;
    polarity: Polarity;
    citation: string;
}
interface CodeImport {
    specifier: string;
    importedSymbols: string[];
    defaultImport?: string;
    namespaceImport?: string;
    isTypeOnly?: boolean;
    isExternal: boolean;
    reExport: boolean;
    resolvedSourceId?: string;
    resolvedRepoPath?: string;
}
interface CodeDiagnostic {
    code: number;
    category: "warning" | "error" | "message" | "suggestion";
    message: string;
    line: number;
    column: number;
}
interface CodeSymbol {
    id: string;
    name: string;
    kind: CodeSymbolKind;
    signature: string;
    exported: boolean;
    calls: string[];
    extends: string[];
    implements: string[];
}
interface CodeRelation {
    sourceName?: string;
    targetName: string;
    relation: string;
    confidence?: number;
}
interface CodeAnalysis {
    moduleId: string;
    language: CodeLanguage;
    moduleName?: string;
    namespace?: string;
    imports: CodeImport[];
    dependencies: string[];
    symbols: CodeSymbol[];
    exports: string[];
    diagnostics: CodeDiagnostic[];
    relations?: CodeRelation[];
}
interface SourceRationale {
    id: string;
    text: string;
    citation: string;
    /**
     * Structural kind for code rationales (`docstring`, `comment`, `marker`) or
     * the lowercased fixed-prefix marker for non-code rationales (`note`,
     * `why`, `hack`, `important`, `rationale`, `todo`, `fixme`, `warning`,
     * `warn`). Non-code kinds are parser-selected from markdown blockquotes /
     * list items and plain-text paragraphs, never swept from whole files.
     */
    kind: "docstring" | "comment" | "marker" | "note" | "why" | "hack" | "important" | "rationale" | "todo" | "fixme" | "warning" | "warn";
    symbolName?: string;
}
interface CodeIndexEntry {
    sourceId: string;
    moduleId: string;
    language: CodeLanguage;
    repoRelativePath?: string;
    originalPath?: string;
    moduleName?: string;
    namespace?: string;
    aliases: string[];
}
interface CodeIndexArtifact {
    generatedAt: string;
    entries: CodeIndexEntry[];
}
interface SourceAnalysis {
    analysisVersion: number;
    sourceId: string;
    sourceHash: string;
    semanticHash: string;
    extractionHash?: string;
    schemaHash: string;
    title: string;
    summary: string;
    concepts: AnalyzedTerm[];
    entities: AnalyzedTerm[];
    claims: SourceClaim[];
    questions: string[];
    tags: string[];
    rationales: SourceRationale[];
    code?: CodeAnalysis;
    producedAt: string;
}
interface GraphNode {
    id: string;
    type: "source" | "concept" | "entity" | "module" | "symbol" | "rationale" | "memory_task" | "decision";
    label: string;
    /** Lowercased NFKD-normalized label (diacritic-insensitive) for lexical matching. */
    normLabel?: string;
    pageId?: string;
    freshness?: Freshness;
    confidence?: number;
    sourceIds: string[];
    projectIds: string[];
    sourceClass?: SourceClass;
    language?: CodeLanguage;
    moduleId?: string;
    symbolKind?: CodeSymbolKind;
    communityId?: string;
    degree?: number;
    bridgeScore?: number;
    isGodNode?: boolean;
    /**
     * Human-readable explanation of why this node was flagged as a god-node
     * (high-degree hub). Populated for god nodes only. Deterministic.
     */
    surpriseReason?: string;
    tags?: string[];
}
/**
 * Graph edges use an open-string `relation` so new semantics can land
 * without churning every consumer. Commonly produced relations include:
 *   - `mentions`, `contains_code`, `defines`, `exports`, `imports`,
 *     `contradicts`, `supports`, `builds_on`.
 *   - `superseded_by`: the source node/page has been replaced by the
 *     target. The older page is expected to carry `freshness: "stale"`
 *     and `supersededBy` pointing at the target page id. Compile,
 *     ingest, and human review can all produce this relation; lint
 *     surfaces broken supersession links.
 */
interface GraphEdge {
    id: string;
    source: string;
    target: string;
    relation: string;
    status: ClaimStatus;
    evidenceClass: EvidenceClass;
    confidence: number;
    provenance: string[];
    similarityReasons?: Array<"shared_concept" | "shared_entity" | "shared_tag" | "shared_symbol" | "shared_rationale_theme" | "shared_source_type">;
    similarityBasis?: "feature_overlap" | "embeddings";
}
interface GraphHyperedge {
    id: string;
    label: string;
    relation: "participate_in" | "implement" | "form";
    nodeIds: string[];
    evidenceClass: EvidenceClass;
    confidence: number;
    sourcePageIds: string[];
    why: string;
}
interface GraphPage {
    id: string;
    path: string;
    title: string;
    kind: PageKind;
    sourceType?: SourceCaptureType;
    sourceClass?: SourceClass;
    sourceIds: string[];
    projectIds: string[];
    nodeIds: string[];
    freshness: Freshness;
    /**
     * Numeric freshness score in [0, 1] that decays over time based on the
     * source-class half-life. `1` means fully fresh (just confirmed), `0`
     * means fully decayed. Pages that predate decay tracking are treated as
     * `1` so old vaults are not penalized. See `freshness.ts` for the decay
     * function and thresholds.
     */
    decayScore?: number;
    /**
     * ISO timestamp of the last time compile or ingest confirmed this page
     * against a live source/claim. Missing on pages that existed before
     * decay tracking landed.
     */
    lastConfirmedAt?: string;
    /**
     * If set, this page has been superseded by another page. The value is
     * the replacement page id. A matching `superseded_by` relation edge
     * connects the old page's node to the replacement in the graph.
     */
    supersededBy?: string;
    status: PageStatus;
    confidence: number;
    backlinks: string[];
    schemaHash: string;
    sourceHashes: Record<string, string>;
    sourceSemanticHashes: Record<string, string>;
    relatedPageIds: string[];
    relatedNodeIds: string[];
    relatedSourceIds: string[];
    createdAt: string;
    updatedAt: string;
    compiledFrom: string[];
    managedBy: PageManager;
    origin?: OutputOrigin;
    question?: string;
    outputFormat?: OutputFormat;
    outputAssets?: OutputAsset[];
    /**
     * Memory-tier assignment for insight pages. Undefined on non-insight
     * pages. When an insight page on disk is missing this field, callers
     * default it to `"working"` in memory; no on-disk migration happens.
     */
    tier?: MemoryTier;
    /**
     * Lower-tier page ids that were rolled up into this page during a
     * consolidation pass. Populated only on pages produced by
     * `runConsolidation` (episodic/semantic/procedural). Empty/undefined on
     * working-tier or non-insight pages.
     */
    consolidatedFromPageIds?: string[];
    /**
     * Heuristic confidence (0..1) that the consolidation rollup is
     * meaningful. Missing when the page was not produced by consolidation.
     */
    consolidationConfidence?: number;
}
interface GraphArtifact {
    generatedAt: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    hyperedges: GraphHyperedge[];
    communities?: Array<{
        id: string;
        label: string;
        nodeIds: string[];
    }>;
    sources: SourceManifest[];
    pages: GraphPage[];
}
interface GraphStatsResult {
    generatedAt: string;
    counts: {
        sources: number;
        pages: number;
        nodes: number;
        edges: number;
        hyperedges: number;
        communities: number;
    };
    nodeTypes: Partial<Record<GraphNode["type"], number>>;
    evidenceClasses: Partial<Record<EvidenceClass, number>>;
    sourceClasses: Record<SourceClass, {
        sources: number;
        pages: number;
        nodes: number;
    }>;
    edgeRelations: Record<string, number>;
    hyperedgeRelations: Record<string, number>;
}
interface GraphClusterRefreshResult {
    graphPath: string;
    nodeCount: number;
    edgeCount: number;
    communityCount: number;
    changedPages: string[];
    reportPath: string;
}
interface GraphCommunityResult {
    generatedAt: string;
    id: string;
    label: string;
    nodeCount: number;
    pageCount: number;
    edgeCount: number;
    nodes: Array<{
        id: string;
        type: GraphNode["type"];
        label: string;
        pageId?: string;
        sourceClass?: SourceClass;
        degree?: number;
        bridgeScore?: number;
        confidence?: number;
    }>;
    pages: Array<{
        id: string;
        path: string;
        title: string;
        kind: PageKind;
        sourceClass?: SourceClass;
        freshness: Freshness;
    }>;
    edges: Array<{
        id: string;
        source: string;
        target: string;
        sourceLabel?: string;
        targetLabel?: string;
        relation: string;
        evidenceClass: EvidenceClass;
        confidence: number;
    }>;
}
interface GraphQueryMatch {
    type: "node" | "page" | "hyperedge";
    id: string;
    label: string;
    score: number;
}
interface GraphQueryResult {
    question: string;
    traversal: "bfs" | "dfs";
    seedNodeIds: string[];
    seedPageIds: string[];
    visitedNodeIds: string[];
    visitedEdgeIds: string[];
    hyperedgeIds: string[];
    pageIds: string[];
    communities: string[];
    summary: string;
    matches: GraphQueryMatch[];
}
interface GraphPathResult {
    from: string;
    to: string;
    resolvedFromNodeId?: string;
    resolvedToNodeId?: string;
    found: boolean;
    nodeIds: string[];
    edgeIds: string[];
    pageIds: string[];
    summary: string;
}
interface GraphExplainNeighbor {
    nodeId: string;
    label: string;
    type: GraphNode["type"];
    pageId?: string;
    relation: string;
    direction: "incoming" | "outgoing";
    confidence: number;
    evidenceClass: EvidenceClass;
}
interface GraphExplainResult {
    target: string;
    node: GraphNode;
    page?: GraphPage;
    community?: {
        id: string;
        label: string;
    };
    neighbors: GraphExplainNeighbor[];
    hyperedges: GraphHyperedge[];
    summary: string;
}
interface GraphDiffResult {
    addedNodes: Array<{
        id: string;
        label: string;
        type: GraphNode["type"];
    }>;
    removedNodes: Array<{
        id: string;
        label: string;
        type: GraphNode["type"];
    }>;
    addedEdges: Array<{
        id: string;
        source: string;
        target: string;
        relation: string;
        evidenceClass: EvidenceClass;
    }>;
    removedEdges: Array<{
        id: string;
        source: string;
        target: string;
        relation: string;
        evidenceClass: EvidenceClass;
    }>;
    addedPages: Array<{
        id: string;
        path: string;
        title: string;
        kind: PageKind;
    }>;
    removedPages: Array<{
        id: string;
        path: string;
        title: string;
        kind: PageKind;
    }>;
    summary: string;
}
interface ContextPackItem {
    id: string;
    kind: ContextPackItemKind;
    title: string;
    reason: string;
    score: number;
    estimatedTokens: number;
    excerpt?: string;
    path?: string;
    pageId?: string;
    nodeId?: string;
    edgeId?: string;
    hyperedgeId?: string;
    sourceIds: string[];
    pageIds: string[];
    nodeIds: string[];
    edgeIds: string[];
    freshness?: Freshness;
    evidenceClass?: EvidenceClass;
    confidence?: number;
}
interface ContextPackOmittedItem {
    id: string;
    kind: ContextPackItemKind;
    title: string;
    reason: string;
    estimatedTokens: number;
}
interface ContextPack {
    id: string;
    title: string;
    goal: string;
    target?: string;
    createdAt: string;
    format: ContextPackFormat;
    budgetTokens: number;
    estimatedTokens: number;
    artifactPath: string;
    markdownPath: string;
    citations: string[];
    relatedPageIds: string[];
    relatedNodeIds: string[];
    relatedSourceIds: string[];
    graphQuery: GraphQueryResult;
    items: ContextPackItem[];
    omittedItems: ContextPackOmittedItem[];
}
interface ContextPackSummary {
    id: string;
    title: string;
    goal: string;
    target?: string;
    createdAt: string;
    budgetTokens: number;
    estimatedTokens: number;
    artifactPath: string;
    markdownPath: string;
    itemCount: number;
    omittedCount: number;
}
interface BuildContextPackOptions {
    goal: string;
    target?: string;
    budgetTokens?: number;
    format?: ContextPackFormat;
    memoryTaskId?: string;
}
interface BuildContextPackResult {
    pack: ContextPack;
    artifactPath: string;
    markdownPath: string;
    rendered: string;
}
interface AgentMemoryNote {
    id: string;
    text: string;
    createdAt: string;
}
interface AgentMemoryDecision {
    id: string;
    text: string;
    createdAt: string;
}
interface AgentMemoryTask {
    id: string;
    title: string;
    goal: string;
    status: AgentMemoryTaskStatus;
    target?: string;
    agent?: string;
    createdAt: string;
    updatedAt: string;
    contextPackIds: string[];
    sessionIds: string[];
    sourceIds: string[];
    pageIds: string[];
    nodeIds: string[];
    changedPaths: string[];
    gitRefs: string[];
    notes: AgentMemoryNote[];
    decisions: AgentMemoryDecision[];
    outcome?: string;
    followUps: string[];
    artifactPath: string;
    markdownPath: string;
}
interface AgentMemoryTaskSummary {
    id: string;
    title: string;
    goal: string;
    status: AgentMemoryTaskStatus;
    target?: string;
    agent?: string;
    createdAt: string;
    updatedAt: string;
    contextPackIds: string[];
    changedPaths: string[];
    decisionCount: number;
    followUpCount: number;
    artifactPath: string;
    markdownPath: string;
}
interface StartMemoryTaskOptions {
    goal: string;
    target?: string;
    budgetTokens?: number;
    agent?: string;
    contextPackId?: string;
}
interface UpdateMemoryTaskOptions {
    note?: string;
    decision?: string;
    changedPath?: string;
    contextPackId?: string;
    sessionId?: string;
    sourceId?: string;
    pageId?: string;
    nodeId?: string;
    gitRef?: string;
    status?: AgentMemoryTaskStatus;
}
interface FinishMemoryTaskOptions {
    outcome: string;
    followUp?: string;
}
interface AgentMemoryTaskResult {
    task: AgentMemoryTask;
    artifactPath: string;
    markdownPath: string;
}
interface ResumeMemoryTaskOptions {
    format?: AgentMemoryResumeFormat;
}
interface ResumeMemoryTaskResult {
    task: AgentMemoryTask;
    rendered: string;
}
interface ApprovalEntry {
    pageId: string;
    title: string;
    kind: PageKind;
    changeType: ApprovalChangeType;
    status: ApprovalEntryStatus;
    sourceIds: string[];
    nextPath?: string;
    previousPath?: string;
    label?: ApprovalEntryLabel;
}
interface ApprovalManifest {
    approvalId: string;
    createdAt: string;
    bundleType?: ApprovalBundleType;
    title?: string;
    sourceSessionId?: string;
    entries: ApprovalEntry[];
}
interface ApprovalSummary {
    approvalId: string;
    createdAt: string;
    bundleType?: ApprovalBundleType;
    title?: string;
    sourceSessionId?: string;
    entryCount: number;
    pendingCount: number;
    acceptedCount: number;
    rejectedCount: number;
}
type ApprovalDiffLine = {
    type: "add" | "remove" | "context";
    value: string;
};
type ApprovalDiffHunk = {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: ApprovalDiffLine[];
};
type ApprovalFrontmatterChange = {
    key: string;
    before?: unknown;
    after?: unknown;
    protected: boolean;
};
type ApprovalStructuredDiff = {
    hunks: ApprovalDiffHunk[];
    addedLines: number;
    removedLines: number;
    frontmatterChanges: ApprovalFrontmatterChange[];
};
interface ApprovalEntryDetail extends ApprovalEntry {
    currentContent?: string;
    stagedContent?: string;
    changeSummary?: string;
    diff?: string;
    structuredDiff?: ApprovalStructuredDiff;
    warnings?: string[];
}
interface ApprovalDetail extends ApprovalSummary {
    entries: ApprovalEntryDetail[];
}
interface ReviewActionResult extends ApprovalSummary {
    updatedEntries: string[];
}
interface CandidateRecord {
    pageId: string;
    title: string;
    kind: "concept" | "entity";
    path: string;
    activePath: string;
    sourceIds: string[];
    createdAt: string;
    updatedAt: string;
    score?: number;
    scoreBreakdown?: Record<string, number>;
}
interface BlastRadiusResult {
    target: string;
    resolvedModuleId?: string;
    affectedModules: Array<{
        moduleId: string;
        label: string;
        depth: number;
    }>;
    totalAffected: number;
    maxDepth: number;
    summary: string;
}
interface CompileOptions {
    approve?: boolean;
    codeOnly?: boolean;
    maxTokens?: number;
}
interface InitOptions {
    obsidian?: boolean;
    profile?: string;
    lite?: boolean;
}
interface CompileResult {
    graphPath: string;
    pageCount: number;
    changedPages: string[];
    sourceCount: number;
    staged: boolean;
    approvalId?: string;
    approvalDir?: string;
    postPassApprovalId?: string;
    postPassApprovalDir?: string;
    promotedPageIds: string[];
    candidatePageCount: number;
    autoPromotion?: {
        evaluated: number;
        promoted: number;
        dryRun: boolean;
        sessionPath?: string;
    };
    tokenStats?: {
        estimatedTokens: number;
        maxTokens: number;
        pagesKept: number;
        pagesDropped: number;
    };
}
interface SearchResult {
    pageId: string;
    path: string;
    title: string;
    snippet: string;
    rank: number;
    kind?: PageKind;
    status?: PageStatus;
    projectIds: string[];
    sourceType?: SourceCaptureType;
    sourceClass?: SourceClass;
}
interface RetrievalConfig {
    backend: "sqlite";
    shardSize: number;
    hybrid: boolean;
    rerank: boolean;
    embeddingProvider?: string;
    maxIndexedRows?: number;
}
interface RetrievalManifest {
    version: 1;
    backend: "sqlite";
    generatedAt: string;
    graphGeneratedAt?: string;
    graphHash?: string;
    shardCount: number;
    shards: Array<{
        id: string;
        path: string;
        pageCount: number;
    }>;
}
interface RetrievalStatus {
    configured: RetrievalConfig;
    manifestPath: string;
    indexPath: string;
    manifestExists: boolean;
    indexExists: boolean;
    graphExists: boolean;
    stale: boolean;
    pageCount: number;
    shardCount: number;
    warnings: string[];
}
interface RetrievalDoctorResult {
    status: RetrievalStatus;
    ok: boolean;
    repaired: boolean;
    actions: string[];
}
type VaultDoctorStatus = "ok" | "warning" | "error";
interface VaultDoctorAction {
    command: string;
    description: string;
    destructive?: boolean;
}
type VaultDoctorRecommendationPriority = "high" | "medium" | "low";
type VaultDoctorSafeAction = "doctor:repair";
interface VaultDoctorRecommendation {
    id: string;
    label: string;
    summary: string;
    priority: VaultDoctorRecommendationPriority;
    status: VaultDoctorStatus;
    sourceCheckId: string;
    command?: string;
    description?: string;
    safeAction?: VaultDoctorSafeAction;
}
interface VaultDoctorCheck {
    id: string;
    label: string;
    status: VaultDoctorStatus;
    summary: string;
    detail?: string;
    actions?: VaultDoctorAction[];
}
interface VaultDoctorCounts {
    sources: number;
    managedSources: number;
    pages: number;
    nodes: number;
    edges: number;
    approvalsPending: number;
    candidates: number;
    tasks: number;
    pendingSemanticRefresh: number;
}
interface VaultDoctorReport {
    ok: boolean;
    status: VaultDoctorStatus;
    generatedAt: string;
    rootDir: string;
    version: string;
    counts: VaultDoctorCounts;
    checks: VaultDoctorCheck[];
    recommendations: VaultDoctorRecommendation[];
    repaired: string[];
}
interface QueryOptions {
    question: string;
    save?: boolean;
    format?: OutputFormat;
    review?: boolean;
    gapFill?: boolean;
    memoryTaskId?: string;
}
interface QueryResult {
    answer: string;
    savedPath?: string;
    stagedPath?: string;
    savedPageId?: string;
    citations: string[];
    relatedPageIds: string[];
    relatedNodeIds: string[];
    relatedSourceIds: string[];
    outputFormat: OutputFormat;
    saved: boolean;
    staged: boolean;
    approvalId?: string;
    approvalDir?: string;
    outputAssets: OutputAsset[];
}
interface LintFinding {
    severity: "error" | "warning" | "info";
    code: string;
    message: string;
    pagePath?: string;
    relatedSourceIds?: string[];
    relatedPageIds?: string[];
    suggestedQuery?: string;
    evidence?: WebSearchResult[];
}
interface InboxImportSkip {
    path: string;
    reason: string;
}
interface InboxImportResult {
    inputDir: string;
    scannedCount: number;
    attachmentCount: number;
    imported: SourceManifest[];
    skipped: InboxImportSkip[];
}
interface WatchOptions {
    lint?: boolean;
    debounceMs?: number;
    repo?: boolean;
    codeOnly?: boolean;
    overrideRoots?: string[];
}
interface PendingSemanticRefreshEntry {
    id: string;
    repoRoot: string;
    path: string;
    changeType: "added" | "modified" | "removed";
    detectedAt: string;
    sourceId?: string;
    sourceKind?: SourceKind;
}
interface RepoSyncResult {
    repoRoots: string[];
    scannedCount: number;
    imported: SourceManifest[];
    updated: SourceManifest[];
    removed: SourceManifest[];
    skipped: DirectoryIngestSkip[];
}
interface WatchRepoSyncResult extends RepoSyncResult {
    pendingSemanticRefresh: PendingSemanticRefreshEntry[];
    staleSourceIds: string[];
}
interface WatchRunRecord {
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    inputDir: string;
    reasons: string[];
    importedCount: number;
    scannedCount: number;
    attachmentCount: number;
    changedPages: string[];
    repoImportedCount?: number;
    repoUpdatedCount?: number;
    repoRemovedCount?: number;
    repoScannedCount?: number;
    pendingSemanticRefreshCount?: number;
    pendingSemanticRefreshPaths?: string[];
    lintFindingCount?: number;
    success: boolean;
    error?: string;
}
interface WatchStatusResult {
    generatedAt: string;
    watchedRepoRoots: string[];
    lastRun?: WatchRunRecord;
    pendingSemanticRefresh: PendingSemanticRefreshEntry[];
}
interface WatchController {
    close(): Promise<void>;
}
interface InstallAgentOptions {
    hook?: boolean;
}
interface InstallAgentResult {
    agent: AgentType;
    target: string;
    targets: string[];
    warnings?: string[];
}
interface ManagedSourceAddOptions {
    compile?: boolean;
    brief?: boolean;
    review?: boolean;
    guide?: boolean;
    guideAnswers?: GuidedSourceSessionAnswers;
    maxPages?: number;
    maxDepth?: number;
}
interface ManagedSourceReloadOptions extends ManagedSourceAddOptions {
    id?: string;
    all?: boolean;
}
interface ManagedSourceAddResult {
    source: ManagedSourceRecord;
    compile?: CompileResult;
    briefGenerated: boolean;
    review?: SourceReviewResult;
    guide?: SourceGuideResult;
}
interface ManagedSourceReloadResult {
    sources: ManagedSourceRecord[];
    compile?: CompileResult;
    briefPaths: string[];
    reviews: SourceReviewResult[];
    guides: SourceGuideResult[];
}
interface ManagedSourceDeleteResult {
    removed: ManagedSourceRecord;
}
interface GuidedSourceSessionQuestion {
    id: string;
    prompt: string;
    answer?: string;
}
type GuidedSourceSessionAnswers = Record<string, string> | string[];
interface GuidedSourceSessionRecord {
    sessionId: string;
    scopeId: string;
    scopeTitle: string;
    sourceIds: string[];
    kind?: string;
    status: GuidedSourceSessionStatus;
    createdAt: string;
    updatedAt: string;
    questions: GuidedSourceSessionQuestion[];
    briefPath?: string;
    reviewPath?: string;
    guidePath?: string;
    sessionPath?: string;
    approvalId?: string;
    approvalDir?: string;
    targetedPagePaths: string[];
    stagedUpdatePaths: string[];
}
interface SourceReviewResult {
    sourceId: string;
    pageId: string;
    reviewPath: string;
    staged: boolean;
    approvalId?: string;
    approvalDir?: string;
}
interface SourceGuideResult {
    sourceId: string;
    pageId?: string;
    guidePath?: string;
    reviewPageId?: string;
    reviewPath?: string;
    sessionId: string;
    sessionPath: string;
    sessionStatePath: string;
    status: GuidedSourceSessionStatus;
    questions: GuidedSourceSessionQuestion[];
    awaitingInput?: boolean;
    targetedPagePaths: string[];
    stagedUpdatePaths: string[];
    briefPath?: string;
    staged: boolean;
    approvalId?: string;
    approvalDir?: string;
}
interface GitHookStatus {
    repoRoot: string | null;
    postCommit: "installed" | "not_installed" | "other_content";
    postCheckout: "installed" | "not_installed" | "other_content";
}
interface CompileState {
    generatedAt: string;
    rootSchemaHash: string;
    projectSchemaHashes: Record<string, string>;
    effectiveSchemaHashes: {
        global: string;
        projects: Record<string, string>;
    };
    projectConfigHash: string;
    analyses: Record<string, string>;
    sourceHashes: Record<string, string>;
    sourceSemanticHashes: Record<string, string>;
    sourceProjects: Record<string, string | null>;
    outputHashes: Record<string, string>;
    insightHashes: Record<string, string>;
    memoryHashes?: Record<string, string>;
    candidateHistory: Record<string, {
        sourceIds: string[];
        status: "candidate" | "active";
    }>;
}
interface LintOptions {
    deep?: boolean;
    web?: boolean;
    conflicts?: boolean;
    /**
     * When true, only decay-related lint rules run
     * (`decayed-pages`, `broken_supersession`, `inconsistent_decay`).
     */
    decay?: boolean;
    /**
     * When true, only consolidation-tier lint rules run
     * (`stale_working_tier`, `broken_consolidation_basis`,
     * `semantic_without_episodic_basis`).
     */
    tiers?: boolean;
}
interface ExploreOptions {
    question: string;
    steps?: number;
    format?: OutputFormat;
    review?: boolean;
    gapFill?: boolean;
    memoryTaskId?: string;
}
interface ExploreStepResult {
    step: number;
    question: string;
    answer: string;
    savedPath?: string;
    stagedPath?: string;
    savedPageId: string;
    citations: string[];
    followUpQuestions: string[];
    outputFormat: OutputFormat;
    outputAssets: OutputAsset[];
}
interface ExploreResult {
    rootQuestion: string;
    hubPath?: string;
    stagedHubPath?: string;
    hubPageId: string;
    stepCount: number;
    steps: ExploreStepResult[];
    suggestedQuestions: string[];
    outputFormat: OutputFormat;
    staged: boolean;
    approvalId?: string;
    approvalDir?: string;
    hubAssets: OutputAsset[];
}
interface OutputAsset {
    id: string;
    role: OutputAssetRole;
    path: string;
    mimeType: string;
    width?: number;
    height?: number;
    dataPath?: string;
}
interface ChartDatum {
    label: string;
    value: number;
}
interface ChartSpec {
    kind: "bar" | "line";
    title: string;
    subtitle?: string;
    xLabel?: string;
    yLabel?: string;
    seriesLabel?: string;
    data: ChartDatum[];
    notes?: string[];
}
interface SceneElement {
    kind: "shape" | "label";
    shape?: "rect" | "circle" | "line";
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    text?: string;
    fontSize?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
}
interface SceneSpec {
    title: string;
    alt: string;
    background?: string;
    width?: number;
    height?: number;
    elements: SceneElement[];
}
interface GraphExportResult {
    format: GraphExportFormat;
    outputPath: string;
    fileCount?: number;
}
interface Neo4jGraphSinkConfig {
    uri: string;
    username: string;
    passwordEnv: string;
    database?: string;
    vaultId?: string;
    includeClasses?: SourceClass[];
    batchSize?: number;
}
interface GraphPushNeo4jOptions {
    uri?: string;
    username?: string;
    passwordEnv?: string;
    database?: string;
    vaultId?: string;
    includeClasses?: SourceClass[];
    batchSize?: number;
    dryRun?: boolean;
}
interface GraphPushCounts {
    sources: number;
    pages: number;
    nodes: number;
    relationships: number;
    hyperedges: number;
    groupMembers: number;
}
interface GraphPushResult {
    sink: "neo4j";
    uri: string;
    database: string;
    vaultId: string;
    dryRun: boolean;
    graphHash: string;
    includedSourceClasses: SourceClass[];
    counts: GraphPushCounts;
    skipped: GraphPushCounts;
    warnings: string[];
}
interface AddOptions extends IngestOptions {
    author?: string;
    contributor?: string;
}
interface AddResult {
    captureType: SourceCaptureType;
    manifest: SourceManifest;
    normalizedUrl: string;
    title: string;
    fallback: boolean;
}
interface BenchmarkQuestionResult {
    question: string;
    queryTokens: number;
    reduction: number;
    visitedNodeIds: string[];
    visitedEdgeIds: string[];
    pageIds: string[];
}
interface BenchmarkSummary {
    questionCount: number;
    uniqueVisitedNodes: number;
    finalContextTokens: number;
    naiveCorpusTokens: number;
    avgReduction: number;
    reductionRatio: number;
}
/**
 * Per-source-class slice of a benchmark run. The graph-guided tokens are
 * computed against the same traversal seeds that produced the corpus-wide
 * numbers, then narrowed to nodes/edges/pages whose `sourceClass` matches
 * this class. The naive tokens come from manifests whose
 * {@link SourceManifest.sourceClass} matches this class. Empty classes are
 * represented as zeroed entries rather than being omitted so downstream
 * consumers never have to branch on `undefined`.
 */
interface BenchmarkByClassEntry {
    sourceClass: SourceClass;
    sourceCount: number;
    pageCount: number;
    nodeCount: number;
    godNodeCount: number;
    corpusWords: number;
    corpusTokens: number;
    finalContextTokens: number;
    reductionRatio: number;
    perQuestion: BenchmarkQuestionResult[];
}
interface BenchmarkArtifact {
    generatedAt: string;
    graphHash: string;
    corpusWords: number;
    corpusTokens: number;
    nodes: number;
    edges: number;
    avgQueryTokens: number;
    reductionRatio: number;
    sampleQuestions: string[];
    perQuestion: BenchmarkQuestionResult[];
    summary: BenchmarkSummary;
    byClass: Record<SourceClass, BenchmarkByClassEntry>;
}
interface EmbeddingCacheEntry {
    itemId: string;
    kind: "node" | "page" | "hyperedge";
    label: string;
    contentHash: string;
    values: number[];
}
interface EmbeddingCacheArtifact {
    generatedAt: string;
    providerId: string;
    providerModel: string;
    graphHash: string;
    entries: EmbeddingCacheEntry[];
}
interface BenchmarkOptions {
    questions?: string[];
    maxQuestions?: number;
}
interface GraphReportArtifact {
    generatedAt: string;
    graphHash: string;
    overview: {
        nodes: number;
        edges: number;
        pages: number;
        communities: number;
    };
    firstPartyOverview: {
        nodes: number;
        edges: number;
        pages: number;
        communities: number;
    };
    sourceClassBreakdown: Record<SourceClass, {
        sources: number;
        pages: number;
        nodes: number;
    }>;
    warnings: string[];
    benchmark?: {
        generatedAt: string;
        stale: boolean;
        summary: BenchmarkSummary;
        questionCount: number;
        /**
         * Compact per-source-class mirror of the benchmark summary. Populated
         * from {@link BenchmarkArtifact.byClass} whenever the benchmark artifact
         * is available at report build time. Kept optional so older benchmark
         * files without a `byClass` field still produce a valid report.
         */
        byClass?: Record<SourceClass, {
            sourceCount: number;
            pageCount: number;
            nodeCount: number;
            godNodeCount: number;
            finalContextTokens: number;
            naiveCorpusTokens: number;
            reductionRatio: number;
        }>;
    };
    godNodes: Array<{
        nodeId: string;
        label: string;
        pageId?: string;
        degree?: number;
        bridgeScore?: number;
        /**
         * Deterministic one-line explanation of why the node is surfaced as a
         * god-node — e.g. "degree 42 across 7 communities" or
         * "degree 38 (2.1σ above mean)". Omitted when no degree signal exists.
         */
        surpriseReason?: string;
    }>;
    bridgeNodes: Array<{
        nodeId: string;
        label: string;
        pageId?: string;
        degree?: number;
        bridgeScore?: number;
    }>;
    thinCommunities: Array<{
        id: string;
        label: string;
        nodeCount: number;
        pageId?: string;
        path?: string;
        title?: string;
    }>;
    fragmentedCommunityRollup?: {
        totalCommunities: number;
        rolledUpCount: number;
        rolledUpNodes: number;
        exampleLabels: string[];
    };
    surprisingConnections: Array<{
        id: string;
        sourceNodeId: string;
        sourceLabel: string;
        targetNodeId: string;
        targetLabel: string;
        relation: string;
        evidenceClass: EvidenceClass;
        confidence: number;
        pathNodeIds: string[];
        pathEdgeIds: string[];
        pathRelations: string[];
        pathEvidenceClasses: EvidenceClass[];
        pathSummary: string;
        why: string;
        explanation: string;
    }>;
    groupPatterns: GraphHyperedge[];
    suggestedQuestions: string[];
    communityPages: Array<{
        id: string;
        path: string;
        title: string;
    }>;
    recentResearchSources: Array<{
        pageId: string;
        path: string;
        title: string;
        sourceType: SourceCaptureType;
        updatedAt: string;
    }>;
    contradictions: Array<{
        sourceIdA: string;
        sourceIdB: string;
        claimA: string;
        claimB: string;
        confidenceDelta: number;
    }>;
    communityCohesion?: Array<{
        id: string;
        label: string;
        nodeCount: number;
        cohesion: number;
    }>;
    knowledgeGaps?: {
        isolatedNodes: Array<{
            nodeId: string;
            label: string;
            type: GraphNode["type"];
        }>;
        thinCommunityCount: number;
        ambiguousEdgeRatio: number;
        warnings: string[];
    };
}
interface GraphShareArtifact {
    generatedAt: string;
    vaultName: string;
    tagline: string;
    overview: {
        sources: number;
        nodes: number;
        edges: number;
        pages: number;
        communities: number;
    };
    firstPartyOverview: {
        nodes: number;
        edges: number;
        pages: number;
        communities: number;
    };
    highlights: {
        topHubs: Array<{
            nodeId: string;
            label: string;
            degree?: number;
        }>;
        bridgeNodes: Array<{
            nodeId: string;
            label: string;
            bridgeScore?: number;
        }>;
        surprisingConnections: Array<{
            sourceLabel: string;
            targetLabel: string;
            relation: string;
            why: string;
        }>;
        suggestedQuestions: string[];
    };
    knowledgeGaps: string[];
    shortPost: string;
    relatedNodeIds: string[];
    relatedPageIds: string[];
    relatedSourceIds: string[];
}
interface GraphShareBundleFile {
    relativePath: string;
    content: string;
}
interface ScheduledCompileTask {
    type: "compile";
    approve?: boolean;
}
interface ScheduledLintTask {
    type: "lint";
    deep?: boolean;
    web?: boolean;
}
interface ScheduledQueryTask {
    type: "query";
    question: string;
    format?: OutputFormat;
    save?: boolean;
}
interface ScheduledExploreTask {
    type: "explore";
    question: string;
    steps?: number;
    format?: OutputFormat;
}
interface ScheduledConsolidateTask {
    type: "consolidate";
    dryRun?: boolean;
}
type ScheduledTaskConfig = ScheduledCompileTask | ScheduledLintTask | ScheduledQueryTask | ScheduledExploreTask | ScheduledConsolidateTask;
interface ScheduleTriggerConfig {
    cron?: string;
    every?: string;
}
interface ScheduleJobConfig {
    enabled?: boolean;
    when: ScheduleTriggerConfig;
    task: ScheduledTaskConfig;
}
interface ProviderRoleExecutorConfig {
    type: "provider";
    provider: string;
}
interface CommandRoleExecutorConfig {
    type: "command";
    command: string[];
    cwd?: string;
    env?: Record<string, string>;
    timeoutMs?: number;
}
type RoleExecutorConfig = ProviderRoleExecutorConfig | CommandRoleExecutorConfig;
interface OrchestrationRoleConfig {
    executor: RoleExecutorConfig;
}
interface OrchestrationConfig {
    maxParallelRoles?: number;
    compilePostPass?: boolean;
    roles?: Partial<Record<OrchestrationRole, OrchestrationRoleConfig>>;
}
interface OrchestrationFinding {
    role: OrchestrationRole;
    severity: "error" | "warning" | "info";
    message: string;
    relatedPageIds?: string[];
    relatedSourceIds?: string[];
    suggestedQuery?: string;
}
interface OrchestrationProposal {
    path: string;
    content: string;
    reason: string;
}
interface OrchestrationRoleResult {
    role: OrchestrationRole;
    summary?: string;
    findings: OrchestrationFinding[];
    questions: string[];
    proposals: OrchestrationProposal[];
}
interface ScheduleStateRecord {
    jobId: string;
    enabled: boolean;
    taskType: ScheduledTaskConfig["type"];
    nextRunAt?: string;
    lastRunAt?: string;
    lastStatus?: "success" | "failed";
    lastSessionId?: string;
    lastApprovalId?: string;
    error?: string;
}
interface ScheduledRunResult {
    jobId: string;
    taskType: ScheduledTaskConfig["type"];
    startedAt: string;
    finishedAt: string;
    success: boolean;
    approvalId?: string;
    error?: string;
}
interface ScheduleController {
    close(): Promise<void>;
}

declare function installAgent(rootDir: string, agent: AgentType, options?: InstallAgentOptions): Promise<InstallAgentResult>;
declare function installConfiguredAgents(rootDir: string): Promise<InstallAgentResult[]>;

declare function autoCommitWikiChanges(rootDir: string, operation: string, detail?: string, options?: {
    force?: boolean;
}): Promise<string | null>;

declare const DEFAULT_PROMOTION_CONFIG: CandidatePromotionConfig;
declare function evaluateCandidateForPromotion(page: GraphPage, graph: GraphArtifact, history: CompileState["candidateHistory"] | undefined, config: CandidatePromotionConfig, now?: number): PromotionDecision;

declare function defaultVaultConfig(profile?: VaultProfileConfig): VaultConfig;
declare function defaultVaultSchema(profile?: string | VaultProfileConfig): string;
declare function resolvePaths(rootDir: string, config?: VaultConfig, configPath?: string, schemaPath?: string): ResolvedPaths;
declare function loadVaultConfig(rootDir: string): Promise<{
    config: VaultConfig;
    paths: ResolvedPaths;
}>;
declare function initWorkspace(rootDir: string, options?: {
    profile?: string;
}): Promise<{
    config: VaultConfig;
    paths: ResolvedPaths;
}>;

/**
 * LLM Wiki v2 consolidation tiers. This pass is a lightweight deterministic
 * rollup that groups working-tier insight pages into episodic digests and
 * episodic pages into semantic/procedural pages. The LLM provider (if any)
 * is only consulted for nicer titles and summaries — promotion decisions
 * themselves are heuristic so the pass works without any provider access.
 *
 * The function never deletes pages. Lower-tier pages that are rolled up get
 * a `supersededBy` pointer to the new higher-tier page. Consumers use
 * `tier` and `consolidatedFromPageIds` on the generated page to trace the
 * basis of every rollup.
 */
declare const DEFAULT_CONSOLIDATION_CONFIG: Required<{
    enabled: boolean;
    workingToEpisodic: Required<NonNullable<ConsolidationConfig["workingToEpisodic"]>>;
    episodicToSemantic: Required<NonNullable<ConsolidationConfig["episodicToSemantic"]>>;
    semanticToProcedural: Required<NonNullable<ConsolidationConfig["semanticToProcedural"]>>;
}>;
interface RunConsolidationOptions {
    /** When true, compute decisions and return them without writing any files. */
    dryRun?: boolean;
    /** Fixed clock for deterministic tests. */
    now?: Date;
}
/**
 * Resolve the default-backed consolidation config. Missing/partial config
 * objects are treated as "use all defaults".
 */
declare function resolveConsolidationConfig(config?: ConsolidationConfig): {
    enabled: boolean;
    workingToEpisodic: Required<NonNullable<ConsolidationConfig["workingToEpisodic"]>>;
    episodicToSemantic: Required<NonNullable<ConsolidationConfig["episodicToSemantic"]>>;
    semanticToProcedural: Required<NonNullable<ConsolidationConfig["semanticToProcedural"]>>;
};
declare function runConsolidation(rootDir: string, config?: ConsolidationConfig, provider?: ProviderAdapter, options?: RunConsolidationOptions): Promise<ConsolidationResult>;

declare function renderContextPackMarkdown(pack: ContextPack): string;
declare function renderContextPackLlms(pack: ContextPack): string;
declare function buildContextPack(rootDir: string, options: BuildContextPackOptions): Promise<BuildContextPackResult>;
declare function listContextPacks(rootDir: string): Promise<ContextPackSummary[]>;
declare function readContextPack(rootDir: string, target: string): Promise<ContextPack | null>;
declare function deleteContextPack(rootDir: string, target: string): Promise<ContextPackSummary | null>;

interface DoctorVaultOptions {
    repair?: boolean;
}
declare function doctorVault(rootDir: string, options?: DoctorVaultOptions): Promise<VaultDoctorReport>;

/**
 * Decay and supersession helpers for the LLM Wiki v2 lifecycle layer.
 *
 * Pages accumulate a numeric `decayScore` (0..1) that ticks down over time
 * based on the elapsed days since `lastConfirmedAt`, controlled by a
 * source-class half-life. Decay never deletes or hides pages — it informs
 * ranking, lint, and UI prioritization. Callers are expected to:
 *
 *   1. Call `resetDecay` whenever compile or ingest confirms a page still
 *      matches a live source/claim (e.g. same semantic hash reappears).
 *   2. Call `applyDecayToPages` at the end of a compile pass to recompute
 *      `decayScore` and downgrade `freshness` below the threshold.
 *   3. Call `markSuperseded` when a newer page replaces an older one,
 *      emitting a `superseded_by` edge alongside.
 *
 * Defaults (matching the A.3 feature spec):
 *   - defaultHalfLifeDays = 365
 *   - staleThreshold      = 0.3
 *   - halfLifeDaysBySourceClass = {
 *       first_party: 365   (slow decay)
 *       third_party: 90    (fast — deps churn)
 *       resource:    730   (slowest — assets)
 *       generated:   30    (fastest — build output)
 *     }
 */
declare const DEFAULT_HALF_LIFE_DAYS = 365;
declare const DEFAULT_STALE_THRESHOLD = 0.3;
declare const DEFAULT_HALF_LIFE_DAYS_BY_SOURCE_CLASS: Record<SourceClass, number>;
interface DecayConfig {
    halfLifeDaysBySourceClass?: Partial<Record<SourceClass, number>>;
    defaultHalfLifeDays?: number;
    staleThreshold?: number;
}
interface ApplyDecayResult {
    updated: GraphPage[];
    markedStale: string[];
}
/**
 * Compute a numeric decay score using a straight exponential half-life model.
 *
 * score = 0.5 ^ (ageDays / halfLifeDays)
 *
 * `lastConfirmedAt` missing returns 1 so pages from pre-decay vaults are
 * not penalized until they are next reconfirmed. Future timestamps (clock
 * skew) also return 1.
 */
declare function computeDecayScore(lastConfirmedAt: string | undefined, sourceClass: SourceClass | undefined, config: DecayConfig, now?: Date): number;
/**
 * Recompute `decayScore` and `freshness` for the supplied pages. Pure
 * function: returns a new array and does not mutate the inputs. Pages
 * with `supersededBy` set stay `"stale"` regardless of score. Pages
 * above the threshold are upgraded back to `"fresh"` so re-confirmation
 * outside of compile (e.g. human review) can take effect.
 */
declare function applyDecayToPages(pages: GraphPage[], config: DecayConfig, now?: Date): ApplyDecayResult;
/**
 * Reset decay for a single page. Typically invoked when compile or
 * ingest observes the same source/claim signature as before, confirming
 * the page is still anchored in live evidence. Does not touch
 * `supersededBy`: if the page has been superseded it remains stale.
 */
declare function resetDecay(page: GraphPage, now?: Date): GraphPage;
/**
 * Mark an older page as superseded by a replacement. The caller is
 * responsible for emitting the `superseded_by` graph edge separately.
 */
declare function markSuperseded(oldPage: GraphPage, newPageId: string, now?: Date): GraphPage;
/**
 * Build a DecayConfig from the user-facing FreshnessConfig. Missing
 * fields fall back to defaults.
 */
declare function resolveDecayConfig(config?: FreshnessConfig): DecayConfig;
/**
 * Write decay/supersession frontmatter into every page's markdown file
 * on disk. Pages that do not live under `wikiDir` (e.g. ephemeral or
 * missing files) are skipped silently.
 */
declare function persistDecayFrontmatter(wikiDir: string, pages: GraphPage[]): Promise<string[]>;
/**
 * Full compile-time decay pass. For each live page:
 *   - If the page was just produced by compile, reset decay to 1 and
 *     stamp `lastConfirmedAt = now` (it has been re-confirmed by a
 *     live analysis).
 *   - Otherwise, recompute decay from the existing `lastConfirmedAt`.
 *   - Downgrade freshness to "stale" when the score falls below the
 *     configured threshold, upgrade it back to "fresh" when the score
 *     recovers and the page is not superseded.
 *
 * Returns the updated pages so callers can update `graph.json`, plus
 * the paths of any page files whose frontmatter was rewritten on disk.
 */
declare function runDecayPass(input: {
    wikiDir: string;
    graphPath: string;
    pages: GraphPage[];
    /** Pages (by id) that compile confirmed in this run. Their decay resets to 1. */
    confirmedPageIds: Iterable<string>;
    config?: FreshnessConfig;
    now?: Date;
}): Promise<{
    pages: GraphPage[];
    updatedPaths: string[];
    markedStale: string[];
}>;

/**
 * Viewer-only hub node synthesized from a group-pattern hyperedge. Hubs are
 * never written back to `state/graph.json` — callers can treat them as
 * transient UI scaffolding that turns a single `GraphHyperedge` into a tiny
 * star of pairwise edges that Cytoscape (or vis.js) can render natively.
 */
type SynthesizedHubNode = {
    id: string;
    hyperedgeId: string;
    label: string;
    relation: string;
    participantIds: string[];
    confidence: number;
    evidenceClass: string;
    why: string;
};
/**
 * Viewer-only edge that connects a synthesized hub to one of the hyperedge
 * participants. IDs are stable across renders so Cytoscape can reuse them and
 * tests can assert their presence.
 */
type SynthesizedHubEdge = {
    id: string;
    hyperedgeId: string;
    source: string;
    target: string;
    relation: string;
    confidence: number;
    evidenceClass: string;
};
type SynthesizedHyperedgeHubs = {
    hubNodes: SynthesizedHubNode[];
    hubEdges: SynthesizedHubEdge[];
};
type MinimalHyperedge = {
    id: string;
    label: string;
    relation: string;
    nodeIds: string[];
    confidence?: number;
    evidenceClass?: string;
    why?: string;
};
type MinimalNode = {
    id: string;
};
/**
 * Turn every group-pattern hyperedge with `>= 2` participants into a star:
 * one synthetic hub node plus a pairwise edge to each participant. Degenerate
 * hyperedges (zero or one participant) are skipped because a hub with no
 * "group" to anchor is noisy and contributes nothing to the layout. Nothing
 * here mutates `state/graph.json`; the caller layers hubs on top of the real
 * graph for rendering only.
 */
declare function synthesizeHyperedgeHubs(hyperedges: ReadonlyArray<MinimalHyperedge>, nodes: ReadonlyArray<MinimalNode>): SynthesizedHyperedgeHubs;
declare function exportGraphFormat(rootDir: string, format: Exclude<GraphExportFormat, "html" | "report" | "obsidian" | "canvas">, outputPath: string): Promise<GraphExportResult>;
declare function exportGraphReportHtml(rootDir: string, outputPath: string): Promise<GraphExportResult>;
declare function exportObsidianVault(rootDir: string, outputDir: string): Promise<GraphExportResult>;
declare function exportObsidianCanvas(rootDir: string, outputPath: string): Promise<GraphExportResult>;

type PushDriverLike = {
    session(options: {
        database: string;
    }): {
        run(query: string, params?: Record<string, unknown>): Promise<unknown>;
        executeWrite<T>(work: (tx: {
            run(query: string, params?: Record<string, unknown>): Promise<unknown>;
        }) => Promise<T>): Promise<T>;
        close(): Promise<void>;
    };
    close(): Promise<void>;
};
type GraphPushInternalOptions = GraphPushNeo4jOptions & {
    driverFactory?: (uri: string, username: string, password: string) => PushDriverLike;
};
declare function pushGraphNeo4j(rootDir: string, options?: GraphPushInternalOptions): Promise<GraphPushResult>;

declare function buildGraphShareArtifact(input: {
    graph: GraphArtifact;
    report?: GraphReportArtifact | null;
    vaultName?: string;
}): GraphShareArtifact;
declare function renderGraphShareMarkdown(artifact: GraphShareArtifact): string;
declare function renderGraphShareSvg(artifact: GraphShareArtifact): string;
declare function renderGraphSharePreviewHtml(artifact: GraphShareArtifact): string;
declare function renderGraphShareBundleFiles(artifact: GraphShareArtifact): GraphShareBundleFile[];

declare function graphDiff(oldGraph: GraphArtifact, newGraph: GraphArtifact): GraphDiffResult;
/**
 * Compute the blast radius of changing a file/module by tracing reverse import
 * edges via BFS. Returns all modules that transitively depend on the target.
 */
declare function blastRadius(graph: GraphArtifact, target: string, options?: {
    maxDepth?: number;
}): BlastRadiusResult;

declare function getGitHookStatus(rootDir: string): Promise<GitHookStatus>;
declare function installGitHooks(rootDir: string): Promise<GitHookStatus>;
declare function uninstallGitHooks(rootDir: string): Promise<GitHookStatus>;

declare function listTrackedRepoRoots(rootDir: string): Promise<string[]>;
declare function syncTrackedRepos(rootDir: string, options?: IngestOptions, repoRoots?: string[]): Promise<RepoSyncResult>;
declare function syncTrackedReposForWatch(rootDir: string, options?: IngestOptions, repoRoots?: string[]): Promise<WatchRepoSyncResult>;
declare function ingestInputDetailed(rootDir: string, input: string, options?: IngestOptions): Promise<InputIngestResult>;
declare function ingestInput(rootDir: string, input: string, options?: IngestOptions): Promise<SourceManifest>;
declare function addInput(rootDir: string, input: string, options?: AddOptions): Promise<AddResult>;
declare function ingestDirectory(rootDir: string, inputDir: string, options?: IngestOptions): Promise<DirectoryIngestResult>;
declare function importInbox(rootDir: string, inputDir?: string): Promise<InboxImportResult>;
declare function listManifests(rootDir: string): Promise<SourceManifest[]>;
declare function readExtractedText(rootDir: string, manifest: SourceManifest): Promise<string | undefined>;

/**
 * Effective tuning thresholds for graph output. These knobs keep report and
 * similarity surfaces readable on large repositories while preserving
 * friendly defaults on small ones. Every caller that picks a graph limit
 * should route through {@link resolveLargeRepoDefaults} so user-provided
 * overrides stay authoritative and defaults adjust automatically based on
 * node count.
 */
interface ResolvedLargeRepoDefaults {
    /** Upper bound on god-node entries surfaced in the report/tooling. */
    godNodeLimit: number;
    /**
     * Community rollup threshold: any community with fewer than this many
     * members is folded into the rollup summary in the report. Defaults to
     * `max(3, ceil(totalCommunities / 50))` when `totalCommunities` is
     * provided, otherwise to 3.
     */
    foldCommunitiesBelow: number;
    /**
     * Hard cap on the number of inferred similarity edges emitted per graph.
     * Prevents degenerate O(n²) fan-out on very large repos.
     */
    similarityEdgeCap: number;
    /**
     * Minimum IDF weight a similarity feature must carry to contribute to an
     * edge score. Features below the floor are dropped entirely.
     */
    similarityIdfFloor: number;
}
/** Node count at which tighter defaults begin firing. */
declare const LARGE_REPO_NODE_THRESHOLD = 1000;
/**
 * Resolve effective numeric thresholds for a graph of `nodeCount` nodes.
 * User-configured values on `config.graph` always win — defaults only fire
 * when the caller has left the knob unset. Pass `totalCommunities` when the
 * community rollup threshold needs to scale with the community count.
 */
declare function resolveLargeRepoDefaults(input: {
    nodeCount: number;
    totalCommunities?: number;
    config?: VaultConfig | null;
}): ResolvedLargeRepoDefaults;

declare function createMcpServer(rootDir: string): Promise<McpServer>;
declare function startMcpServer(rootDir: string, stdin?: Readable, stdout?: Writable): Promise<{
    close: () => Promise<void>;
}>;

type MemoryTaskStoredPage = {
    task: AgentMemoryTask;
    page: GraphPage;
    content: string;
    contentHash: string;
};
declare function renderMemoryTaskMarkdown(task: AgentMemoryTask): string;
declare function ensureMemoryLedger(rootDir: string): Promise<{
    changed: string[];
}>;
declare function startMemoryTask(rootDir: string, options: StartMemoryTaskOptions): Promise<AgentMemoryTaskResult>;
declare function readMemoryTask(rootDir: string, target: string): Promise<AgentMemoryTask | null>;
declare function listMemoryTasks(rootDir: string): Promise<AgentMemoryTaskSummary[]>;
declare function updateMemoryTask(rootDir: string, target: string, options: UpdateMemoryTaskOptions): Promise<AgentMemoryTaskResult>;
declare function finishMemoryTask(rootDir: string, target: string, options: FinishMemoryTaskOptions): Promise<AgentMemoryTaskResult>;
declare function resumeMemoryTask(rootDir: string, target: string, options?: ResumeMemoryTaskOptions): Promise<ResumeMemoryTaskResult>;
declare function loadMemoryTaskPages(rootDir: string): Promise<MemoryTaskStoredPage[]>;
declare function buildMemoryGraphElements(tasks: AgentMemoryTask[], pages: GraphPage[]): {
    nodes: GraphNode[];
    edges: GraphEdge[];
};
declare function memoryTaskHashes(records: MemoryTaskStoredPage[]): Record<string, string>;

interface MigrationStepContext {
    rootDir: string;
    paths: {
        wikiDir: string;
        stateDir: string;
        rootDir: string;
    };
}
interface MigrationStep {
    id: string;
    fromVersion: string;
    toVersion: string;
    description: string;
    apply(ctx: MigrationStepContext, options: {
        dryRun: boolean;
    }): Promise<{
        changed: string[];
    }>;
}
interface MigrationPlan {
    fromVersion: string | null;
    toVersion: string;
    steps: MigrationStep[];
}
interface MigrationResult {
    planned: number;
    applied: Array<{
        id: string;
        changed: string[];
    }>;
    skipped: Array<{
        id: string;
        reason: string;
    }>;
    dryRun: boolean;
    fromVersion: string | null;
    toVersion: string;
}
interface VaultVersionRecord {
    version: string;
    migratedAt: string;
    appliedSteps: string[];
}
declare const ALL_MIGRATIONS: readonly MigrationStep[];
declare function detectVaultVersion(rootDir: string): Promise<string | null>;
declare function planMigration(rootDir: string, targetVersion?: string): Promise<MigrationPlan>;
declare function runMigration(rootDir: string, options?: {
    targetVersion?: string;
    dryRun?: boolean;
}): Promise<MigrationResult>;

declare abstract class BaseProviderAdapter implements ProviderAdapter {
    readonly id: string;
    readonly type: ProviderType;
    readonly model: string;
    readonly capabilities: Set<ProviderCapability>;
    constructor(id: string, type: ProviderType, model: string, capabilities: ProviderCapability[]);
    abstract generateText(request: GenerationRequest): Promise<GenerationResponse>;
    embedTexts(_texts: string[]): Promise<number[][]>;
    generateImage(_request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
    transcribeAudio(_request: AudioTranscriptionRequest): Promise<AudioTranscriptionResponse>;
    generateStructured<T>(request: GenerationRequest, schema: z.ZodType<T>): Promise<T>;
    protected encodeAttachments(attachments?: GenerationAttachment[]): Promise<Array<{
        mimeType: string;
        base64: string;
    }>>;
}

interface LocalWhisperAdapterOptions {
    binaryPath?: string;
    model?: string;
    modelPath?: string;
    extraArgs?: string[];
    threads?: number;
    /**
     * Replaces the default `child_process.spawn`-based runner. Exposed so unit
     * tests can exercise the adapter without requiring a real whisper.cpp binary
     * on `$PATH`.
     */
    runner?: WhisperRunner;
    /** Overrides the directory used for temp audio files. */
    tmpDir?: string;
    /** Overrides environment variable lookup. */
    env?: NodeJS.ProcessEnv;
    /** Overrides `$HOME` used to resolve the default models directory. */
    homeDir?: string;
}
type WhisperRunner = (input: {
    binaryPath: string;
    args: string[];
}) => Promise<WhisperRunResult>;
interface WhisperRunResult {
    code: number;
    stdout: string;
    stderr: string;
}
declare class LocalWhisperProviderAdapter extends BaseProviderAdapter {
    private readonly options;
    constructor(id: string, model: string, options?: LocalWhisperAdapterOptions);
    generateText(_request: GenerationRequest): Promise<GenerationResponse>;
    transcribeAudio(request: AudioTranscriptionRequest): Promise<AudioTranscriptionResponse>;
    private extensionForRequest;
    private resolveBinaryPath;
    private resolveModelPath;
}

/**
 * Approximate download sizes for the shipped ggml models. Used only for
 * user-facing "this will download ~X MB" summaries — no correctness depends on
 * these being exact.
 */
declare const LOCAL_WHISPER_MODEL_SIZES: Readonly<Record<string, string>>;
interface LocalWhisperDiscoveryOptions {
    env?: NodeJS.ProcessEnv;
}
interface LocalWhisperBinaryDiscovery {
    binaryPath: string | null;
    candidates: string[];
    source: "config" | "env" | "path" | "not-found";
}
declare function discoverLocalWhisperBinary(options?: LocalWhisperDiscoveryOptions): Promise<LocalWhisperBinaryDiscovery>;
declare function expectedModelPath(modelName: string, homeDir?: string): string;
declare function modelDownloadUrl(modelName: string): string;
interface DownloadProgress {
    downloadedBytes: number;
    totalBytes?: number;
}
interface DownloadOptions {
    modelName: string;
    homeDir?: string;
    onProgress?: (progress: DownloadProgress) => void;
    fetchImpl?: typeof fetch;
}
interface DownloadResult {
    path: string;
    bytes: number;
}
declare function downloadWhisperModel(options: DownloadOptions): Promise<DownloadResult>;
interface ProviderRegistrationOptions {
    rootDir: string;
    providerId?: string;
    model: string;
    setAsAudioProvider?: boolean;
    binaryPath?: string;
    modelPath?: string;
    threads?: number;
}
interface ProviderRegistrationResult {
    providerId: string;
    configPath: string;
    providerWasAdded: boolean;
    providerWasUpdated: boolean;
    audioProviderSet: boolean;
    previousAudioProvider?: string;
}
declare function registerLocalWhisperProvider(options: ProviderRegistrationOptions): Promise<ProviderRegistrationResult>;
interface LocalWhisperSetupStatus {
    binary: {
        found: boolean;
        path: string | null;
        source: LocalWhisperBinaryDiscovery["source"];
        installHint: string;
    };
    model: {
        name: string;
        expectedPath: string;
        exists: boolean;
        downloadUrl: string;
        approximateSize: string | undefined;
    };
}
interface SummarizeSetupOptions extends LocalWhisperDiscoveryOptions {
    modelName: string;
    homeDir?: string;
}
declare function summarizeLocalWhisperSetup(options: SummarizeSetupOptions): Promise<LocalWhisperSetupStatus>;

/**
 * Canonical capability matrix for the OpenAI-compatible provider family.
 *
 * OpenAI-compatible implementations differ substantially in which endpoints
 * they support, how strict their structured-output adherence is, and whether
 * they can handle vision or audio tasks. This matrix records the community
 * consensus so downstream code can query support before issuing requests
 * instead of discovering the gap via a runtime error.
 *
 * Entries are normative defaults, not contractual guarantees — a user who
 * configures `capabilities: [...]` on a `ProviderConfig` always wins over
 * the defaults.
 */
interface ProviderPresetCapability {
    readonly presetId: string;
    readonly apiStyle: "chat" | "responses";
    readonly capabilities: readonly ProviderCapability[];
    readonly notes: string;
}
declare const OPENAI_COMPATIBLE_CAPABILITY_MATRIX: Readonly<Record<string, ProviderPresetCapability>>;
type OpenAiCompatiblePresetId = keyof typeof OPENAI_COMPATIBLE_CAPABILITY_MATRIX;
/**
 * Look up the canonical capability list for a known preset id. Returns `null`
 * when the preset is unknown (e.g., `custom` adapters) so callers can decide
 * whether to trust the adapter's declared capability set instead.
 */
declare function lookupPresetCapabilities(presetId: string): ProviderPresetCapability | null;
type DegradeReason = "unsupported" | "unknown";
interface DegradationOutcome<T> {
    readonly supported: boolean;
    readonly reason: DegradeReason | null;
    readonly value: T | null;
}
/**
 * Safe-degradation helper: if the provider advertises the requested
 * capability, run `run()`. Otherwise return the caller-supplied fallback
 * and explain why.
 *
 * This is intentionally a thin wrapper — the cost of misusing it is a
 * silent failure, so it forces the caller to supply an explicit fallback
 * and logs the reason so callers can surface a warning instead of
 * hallucinating a result.
 */
declare function withCapabilityFallback<T>(provider: Pick<ProviderAdapter, "capabilities" | "type">, capability: ProviderCapability, run: () => Promise<T>, fallback: () => T | Promise<T>): Promise<DegradationOutcome<T>>;

declare function createProvider(id: string, config: ProviderConfig, rootDir: string): Promise<ProviderAdapter>;
declare function getProviderForTask(rootDir: string, task: keyof Awaited<ReturnType<typeof loadVaultConfig>>["config"]["tasks"]): Promise<ProviderAdapter>;
declare function assertProviderCapability(provider: ProviderAdapter, capability: ProviderCapability): void;

interface RedactionPattern {
    id: string;
    pattern: RegExp | string;
    placeholder?: string;
    description?: string;
}
interface RedactionMatch {
    patternId: string;
    count: number;
}
interface Redactor {
    redact(text: string): {
        text: string;
        matches: RedactionMatch[];
    };
}
/**
 * Built-in safety-by-default patterns. These cover common cloud, SaaS, and
 * cryptographic credentials that should never be captured verbatim into the
 * immutable `raw/` store or compiled wiki pages. Each pattern is expressed as
 * a named regex literal so readability is preserved when auditing what gets
 * scrubbed.
 */
declare const DEFAULT_REDACTION_PATTERNS: RedactionPattern[];
/**
 * Build a redactor from a list of patterns. Callers should construct this
 * once per ingest run and reuse it across prepared inputs so regex compilation
 * and global-flag normalization happen only once.
 */
declare function buildRedactor(patterns: RedactionPattern[], defaultPlaceholder?: string): Redactor;
interface ConfiguredRedactionPattern {
    id: string;
    pattern: string;
    flags?: string;
    placeholder?: string;
    description?: string;
}
interface RedactionConfig {
    enabled?: boolean;
    placeholder?: string;
    useDefaults?: boolean;
    patterns?: ConfiguredRedactionPattern[];
}
/**
 * Compile a possibly-absent `redaction` config block into a concrete
 * pattern list. Missing config means "enabled with defaults" — this is
 * safety-by-default so a fresh 0.9.0 vault upgrades without silently losing
 * redaction coverage.
 *
 * Invalid user-supplied regex sources throw eagerly with a helpful message
 * so the failure is surfaced at ingest start instead of silently skipped.
 */
declare function resolveRedactionPatterns(config?: RedactionConfig | null): {
    enabled: boolean;
    placeholder: string;
    patterns: RedactionPattern[];
};
/**
 * Convenience helper used by the ingest pipeline: build the redactor once
 * from config, or return `null` if redaction is disabled. Returning `null`
 * makes the caller's fast-path trivial (skip bytes/string work entirely).
 */
declare function buildConfiguredRedactor(config?: RedactionConfig | null): Redactor | null;

declare function resolveRetrievalConfig(config: VaultConfig): RetrievalConfig;
declare function writeRetrievalManifest(rootDir: string, graph: GraphArtifact): Promise<RetrievalManifest>;
declare function rebuildRetrievalIndex(rootDir: string): Promise<RetrievalStatus>;
declare function getRetrievalStatus(rootDir: string): Promise<RetrievalStatus>;
declare function doctorRetrieval(rootDir: string, options?: {
    repair?: boolean;
}): Promise<RetrievalDoctorResult>;

declare function listSchedules(rootDir: string): Promise<ScheduleStateRecord[]>;
declare function runSchedule(rootDir: string, jobId: string): Promise<ScheduledRunResult>;
declare function serveSchedules(rootDir: string, pollMs?: number): Promise<ScheduleController>;

interface VaultSchema {
    path: string;
    content: string;
    hash: string;
}
interface LoadedVaultSchemas {
    root: VaultSchema;
    projects: Record<string, VaultSchema>;
    effective: {
        global: VaultSchema;
        projects: Record<string, VaultSchema>;
    };
}
declare function loadVaultSchemas(rootDir: string): Promise<LoadedVaultSchemas>;
declare function loadVaultSchema(rootDir: string): Promise<VaultSchema>;

type SourceScope = {
    id: string;
    title: string;
    sourceIds: string[];
    kind?: string;
    briefPath?: string;
};
declare function reviewSourceScope(rootDir: string, scope: SourceScope): Promise<SourceReviewResult>;
declare function guideSourceScope(rootDir: string, scope: SourceScope, options?: {
    answers?: GuidedSourceSessionAnswers;
}): Promise<SourceGuideResult>;
declare function reviewManagedSource(rootDir: string, id: string): Promise<SourceReviewResult>;
declare function guideManagedSource(rootDir: string, id: string, options?: {
    answers?: GuidedSourceSessionAnswers;
}): Promise<SourceGuideResult>;
declare function resumeSourceSession(rootDir: string, id: string, options?: {
    answers?: GuidedSourceSessionAnswers;
}): Promise<SourceGuideResult>;
declare function listManagedSourceRecords(rootDir: string): Promise<ManagedSourceRecord[]>;
declare function addManagedSource(rootDir: string, input: string, options?: ManagedSourceAddOptions): Promise<ManagedSourceAddResult>;
declare function reloadManagedSources(rootDir: string, options?: ManagedSourceReloadOptions): Promise<ManagedSourceReloadResult>;
declare function deleteManagedSource(rootDir: string, id: string): Promise<ManagedSourceDeleteResult>;

/**
 * LLM token estimation for context-window budgeting.
 *
 * Distinct from tokenize.ts (NLP tokenizer for search indexing).
 * This module estimates how many LLM tokens a piece of text will consume
 * and provides a priority-based trimming strategy for wiki output.
 */
/**
 * Estimate the number of LLM tokens for a text string.
 * Uses a blended heuristic: ~4 chars/token for prose, ~3 chars/token for code.
 */
declare function estimateTokens(text: string): number;
interface PageTokenEstimate {
    pageId: string;
    path: string;
    kind: string;
    tokens: number;
    priority: number;
}
/**
 * Estimate tokens and priority for a wiki page.
 * Priority is based on page kind, node degree, and confidence.
 */
declare function estimatePageTokens(pageId: string, path: string, kind: string, content: string, nodeDegree?: number, confidence?: number): PageTokenEstimate;
interface TokenBudgetResult {
    kept: PageTokenEstimate[];
    dropped: PageTokenEstimate[];
    totalTokens: number;
    budgetTokens: number;
    keptTokens: number;
}
/**
 * Given a set of page estimates and a token budget, return which pages to keep.
 * Lower-priority pages are dropped first. The boundary page is truncated if needed.
 */
declare function trimToTokenBudget(pages: PageTokenEstimate[], maxTokens: number): TokenBudgetResult;

type GeneratedOutputArtifacts = {
    answer: string;
    outputAssets: OutputAsset[];
    assetFiles: Array<{
        relativePath: string;
        content: string | Uint8Array;
        encoding?: BufferEncoding;
    }>;
};
declare function stageGeneratedOutputPages(rootDir: string, stagedPages: Array<{
    page: GraphPage;
    content: string;
    assetFiles?: GeneratedOutputArtifacts["assetFiles"];
    label?: ApprovalEntryLabel;
}>, options?: {
    bundleType?: ApprovalBundleType;
    title?: string;
    sourceSessionId?: string;
}): Promise<{
    approvalId: string;
    approvalDir: string;
}>;
declare function listApprovals(rootDir: string): Promise<ApprovalSummary[]>;
declare function readApproval(rootDir: string, approvalId: string, options?: {
    diff?: boolean;
}): Promise<ApprovalDetail>;
declare function acceptApproval(rootDir: string, approvalId: string, targets?: string[]): Promise<ReviewActionResult>;
declare function rejectApproval(rootDir: string, approvalId: string, targets?: string[]): Promise<ReviewActionResult>;
declare function listCandidates(rootDir: string): Promise<CandidateRecord[]>;
declare function promoteCandidate(rootDir: string, target: string): Promise<CandidateRecord>;
declare function runAutoPromotion(rootDir: string, options?: {
    dryRun?: boolean;
}): Promise<PromotionSession>;
declare function previewCandidatePromotions(rootDir: string): Promise<PromotionDecision[]>;
/**
 * Human-in-the-loop supersession: wire up a `superseded_by` edge between
 * two existing pages and flip the older page's frontmatter to stale. The
 * edge is written into `state/graph.json` and the older page's markdown
 * file is updated via `markSuperseded`. Caller supplies either page ids
 * or page paths for resolution convenience.
 */
declare function createSupersessionEdge(rootDir: string, oldPageIdOrPath: string, newPageIdOrPath: string): Promise<{
    oldPageId: string;
    newPageId: string;
    edgeId: string;
    graphPath: string;
    updatedPagePath: string;
}>;
declare function archiveCandidate(rootDir: string, target: string): Promise<CandidateRecord>;
declare function initVault(rootDir: string, options?: InitOptions): Promise<void>;
declare function compileVault(rootDir: string, options?: CompileOptions): Promise<CompileResult>;
declare function queryVault(rootDir: string, options: QueryOptions): Promise<QueryResult>;
declare function exploreVault(rootDir: string, options: ExploreOptions): Promise<ExploreResult>;
declare function searchVault(rootDir: string, query: string, limit?: number): Promise<SearchResult[]>;
declare function queryGraphVault(rootDir: string, question: string, options?: {
    traversal?: "bfs" | "dfs";
    budget?: number;
}): Promise<GraphQueryResult>;
declare function benchmarkVault(rootDir: string, options?: BenchmarkOptions): Promise<BenchmarkArtifact>;
declare function pathGraphVault(rootDir: string, from: string, to: string): Promise<GraphPathResult>;
declare function explainGraphVault(rootDir: string, target: string): Promise<GraphExplainResult>;
declare function listGraphHyperedges(rootDir: string, target?: string, limit?: number): Promise<GraphHyperedge[]>;
declare function graphStatsVault(rootDir: string): Promise<GraphStatsResult>;
declare function refreshGraphClusters(rootDir: string, options?: {
    resolution?: number;
}): Promise<GraphClusterRefreshResult>;
declare function getGraphCommunityVault(rootDir: string, target: string, limit?: number): Promise<GraphCommunityResult>;
declare function readGraphReport(rootDir: string): Promise<GraphReportArtifact | null>;
declare function listGodNodes(rootDir: string, limit?: number): Promise<GraphNode[]>;
declare function blastRadiusVault(rootDir: string, target: string, options?: {
    maxDepth?: number;
}): Promise<BlastRadiusResult>;
declare function listPages(rootDir: string): Promise<GraphPage[]>;
declare function readPage(rootDir: string, relativePath: string): Promise<{
    path: string;
    title: string;
    frontmatter: Record<string, unknown>;
    content: string;
} | null>;
declare function getWorkspaceInfo(rootDir: string): Promise<{
    rootDir: string;
    configPath: string;
    schemaPath: string;
    rawDir: string;
    wikiDir: string;
    stateDir: string;
    agentDir: string;
    inboxDir: string;
    sourceCount: number;
    pageCount: number;
}>;
declare function lintVault(rootDir: string, options?: LintOptions): Promise<LintFinding[]>;
declare function bootstrapDemo(rootDir: string, input?: string): Promise<{
    manifestId?: string;
    compile?: CompileResult;
}>;
/**
 * Vault-level wrapper around the consolidation engine so the CLI, MCP,
 * and schedule callers all go through a single entry point. The provider
 * is optional; the rollup is purely heuristic otherwise.
 */
declare function consolidateVault(rootDir: string, options?: {
    dryRun?: boolean;
}): Promise<ConsolidationResult>;

declare function startGraphServer(rootDir: string, port?: number, options?: {
    full?: boolean;
}): Promise<{
    port: number;
    close: () => Promise<void>;
}>;
declare function exportGraphHtml(rootDir: string, outputPath: string, options?: {
    full?: boolean;
}): Promise<string>;

type WatchCycleResult = {
    watchedRepoRoots: string[];
    importedCount: number;
    scannedCount: number;
    attachmentCount: number;
    repoImportedCount: number;
    repoUpdatedCount: number;
    repoRemovedCount: number;
    repoScannedCount: number;
    pendingSemanticRefreshCount: number;
    pendingSemanticRefreshPaths: string[];
    changedPages: string[];
    lintFindingCount?: number;
};
/**
 * Compute the effective list of repository roots that `swarmvault watch --repo` should track.
 * Resolution order (highest wins):
 *   1. `options.overrideRoots` (CLI `--root <path>`) — used verbatim, config and discovery skipped.
 *   2. Explicit `config.watch.repoRoots` — skips auto-discovery but still honors `excludeRepoRoots`.
 *   3. Auto-discovery via `listTrackedRepoRoots` — preserves pre-0.11 behavior.
 * `config.watch.excludeRepoRoots` always applies as a deny list (unless `overrideRoots` is set).
 */
declare function resolveWatchedRepoRoots(rootDir: string, options?: {
    overrideRoots?: string[];
    config?: VaultConfig;
}): Promise<string[]>;
/**
 * Public helper mirroring `resolveWatchedRepoRoots` for CLI and MCP callers that only need the
 * final list without the full watch cycle machinery.
 */
declare function listWatchedRoots(rootDir: string, options?: {
    overrideRoots?: string[];
}): Promise<string[]>;
/**
 * Add a repo root to the persisted `watch.repoRoots` list in `swarmvault.config.json`.
 * Returns the resolved absolute path that was added (or already present). Dedupes on resolved path.
 */
declare function addWatchedRoot(rootDir: string, candidate: string): Promise<string>;
/**
 * Remove a repo root from the persisted `watch.repoRoots` list. Missing path is a no-op.
 * Returns `true` when the path was removed, `false` when it was absent.
 */
declare function removeWatchedRoot(rootDir: string, candidate: string): Promise<boolean>;
declare function runWatchCycle(rootDir: string, options?: WatchOptions): Promise<WatchCycleResult>;
declare function watchVault(rootDir: string, options?: WatchOptions): Promise<WatchController>;
declare function getWatchStatus(rootDir: string): Promise<WatchStatusResult>;

declare function createWebSearchAdapter(id: string, config: WebSearchProviderConfig, rootDir: string): Promise<WebSearchAdapter>;
type WebSearchTaskId = "deepLintProvider" | "queryProvider" | "exploreProvider";
declare function getWebSearchAdapterForTask(rootDir: string, task: WebSearchTaskId): Promise<WebSearchAdapter>;

export { ALL_MIGRATIONS, type AddOptions, type AddResult, type AgentMemoryDecision, type AgentMemoryNote, type AgentMemoryResumeFormat, type AgentMemoryTask, type AgentMemoryTaskResult, type AgentMemoryTaskStatus, type AgentMemoryTaskSummary, type AgentType, type AnalyzedTerm, type ApprovalBundleType, type ApprovalChangeType, type ApprovalDetail, type ApprovalDiffHunk, type ApprovalDiffLine, type ApprovalEntry, type ApprovalEntryDetail, type ApprovalEntryLabel, type ApprovalEntryStatus, type ApprovalFrontmatterChange, type ApprovalManifest, type ApprovalStructuredDiff, type ApprovalSummary, type AudioTranscriptionRequest, type AudioTranscriptionResponse, type BenchmarkArtifact, type BenchmarkByClassEntry, type BenchmarkOptions, type BenchmarkQuestionResult, type BenchmarkSummary, type BlastRadiusResult, type BuildContextPackOptions, type BuildContextPackResult, type CandidatePromotionConfig, type CandidateRecord, type ChartDatum, type ChartSpec, type ClaimStatus, type CodeAnalysis, type CodeDiagnostic, type CodeImport, type CodeIndexArtifact, type CodeIndexEntry, type CodeLanguage, type CodeRelation, type CodeSymbol, type CodeSymbolKind, type CommandRoleExecutorConfig, type CompileOptions, type CompilePromptConfig, type CompileResult, type CompileState, type ConsolidationConfig, type ConsolidationPromotion, type ConsolidationResult, type ContextPack, type ContextPackFormat, type ContextPackItem, type ContextPackItemKind, type ContextPackOmittedItem, type ContextPackSummary, DEFAULT_CONSOLIDATION_CONFIG, DEFAULT_HALF_LIFE_DAYS, DEFAULT_HALF_LIFE_DAYS_BY_SOURCE_CLASS, DEFAULT_PROMOTION_CONFIG, DEFAULT_REDACTION_PATTERNS, DEFAULT_STALE_THRESHOLD, type DegradationOutcome, type DirectoryIngestFailure, type DirectoryIngestResult, type DirectoryIngestSkip, type EmbeddingCacheArtifact, type EmbeddingCacheEntry, type EvidenceClass, type ExploreOptions, type ExploreResult, type ExploreStepResult, type ExtractionClaim, type ExtractionKind, type ExtractionTerm, type FinishMemoryTaskOptions, type Freshness, type FreshnessConfig, type GenerationAttachment, type GenerationRequest, type GenerationResponse, type GitHookStatus, type GraphArtifact, type GraphClusterRefreshResult, type GraphCommunityResult, type GraphDiffResult, type GraphEdge, type GraphExplainNeighbor, type GraphExplainResult, type GraphExportFormat, type GraphExportResult, type GraphHyperedge, type GraphNode, type GraphPage, type GraphPathResult, type GraphPushCounts, type GraphPushNeo4jOptions, type GraphPushResult, type GraphQueryMatch, type GraphQueryResult, type GraphReportArtifact, type GraphShareArtifact, type GraphShareBundleFile, type GraphStatsResult, type GuidedSessionMode, type GuidedSourceSessionAnswers, type GuidedSourceSessionQuestion, type GuidedSourceSessionRecord, type GuidedSourceSessionStatus, type ImageGenerationRequest, type ImageGenerationResponse, type ImageVisionExtraction, type InboxImportResult, type InboxImportSkip, type IngestOptions, type InitOptions, type InputIngestResult, type InstallAgentOptions, type InstallAgentResult, LARGE_REPO_NODE_THRESHOLD, LOCAL_WHISPER_MODEL_SIZES, type LintFinding, type LintOptions, type LocalWhisperAdapterOptions, type LocalWhisperBinaryDiscovery, LocalWhisperProviderAdapter, type LocalWhisperSetupStatus, type ManagedSourceAddOptions, type ManagedSourceAddResult, type ManagedSourceDeleteResult, type ManagedSourceKind, type ManagedSourceRecord, type ManagedSourceReloadOptions, type ManagedSourceReloadResult, type ManagedSourceStatus, type ManagedSourceSyncCounts, type ManagedSourcesArtifact, type MemoryTier, type MigrationPlan, type MigrationResult, type MigrationStep, type Neo4jGraphSinkConfig, OPENAI_COMPATIBLE_CAPABILITY_MATRIX, type OpenAiCompatiblePresetId, type OrchestrationConfig, type OrchestrationFinding, type OrchestrationProposal, type OrchestrationRole, type OrchestrationRoleConfig, type OrchestrationRoleResult, type OutputAsset, type OutputAssetRole, type OutputFormat, type OutputOrigin, type PageKind, type PageManager, type PageStatus, type PendingSemanticRefreshEntry, type Polarity, type PromotionDecision, type PromotionGateKind, type PromotionGateResult, type PromotionSession, type ProviderAdapter, type ProviderCapability, type ProviderConfig, type ProviderPresetCapability, type ProviderRegistrationOptions, type ProviderRegistrationResult, type ProviderRoleExecutorConfig, type ProviderType, type QueryOptions, type QueryResult, type RedactionMatchSummary, type RedactionPatternConfig, type RedactionSettings, type RedactionSummary, type RepoSyncResult, type ResolvedLargeRepoDefaults, type ResolvedPaths, type ResumeMemoryTaskOptions, type ResumeMemoryTaskResult, type RetrievalConfig, type RetrievalDoctorResult, type RetrievalManifest, type RetrievalStatus, type ReviewActionResult, type RoleExecutorConfig, type SceneElement, type SceneSpec, type ScheduleController, type ScheduleJobConfig, type ScheduleStateRecord, type ScheduleTriggerConfig, type ScheduledCompileTask, type ScheduledConsolidateTask, type ScheduledExploreTask, type ScheduledLintTask, type ScheduledQueryTask, type ScheduledRunResult, type ScheduledTaskConfig, type SearchResult, type SourceAnalysis, type SourceAttachment, type SourceCaptureType, type SourceClaim, type SourceClass, type SourceExtractionArtifact, type SourceGuideResult, type SourceKind, type SourceManifest, type SourceRationale, type SourceReviewResult, type StartMemoryTaskOptions, type SynthesizedHubEdge, type SynthesizedHubNode, type SynthesizedHyperedgeHubs, type UpdateMemoryTaskOptions, type VaultConfig, type VaultDashboardPack, type VaultDoctorAction, type VaultDoctorCheck, type VaultDoctorCounts, type VaultDoctorRecommendation, type VaultDoctorRecommendationPriority, type VaultDoctorReport, type VaultDoctorSafeAction, type VaultDoctorStatus, type VaultProfileConfig, type VaultProfilePreset, type VaultVersionRecord, type WatchConfig, type WatchController, type WatchOptions, type WatchRepoSyncResult, type WatchRunRecord, type WatchStatusResult, type WebSearchAdapter, type WebSearchProviderConfig, type WebSearchProviderType, type WebSearchResult, type WhisperRunResult, type WhisperRunner, acceptApproval, addInput, addManagedSource, addWatchedRoot, agentTypeSchema, applyDecayToPages, archiveCandidate, assertProviderCapability, autoCommitWikiChanges, benchmarkVault, blastRadius, blastRadiusVault, bootstrapDemo, buildConfiguredRedactor, buildContextPack, buildGraphShareArtifact, buildMemoryGraphElements, buildRedactor, compileVault, computeDecayScore, consolidateVault, createMcpServer, createProvider, createSupersessionEdge, createWebSearchAdapter, defaultVaultConfig, defaultVaultSchema, deleteContextPack, deleteManagedSource, detectVaultVersion, discoverLocalWhisperBinary, doctorRetrieval, doctorVault, downloadWhisperModel, ensureMemoryLedger, estimatePageTokens, estimateTokens, evaluateCandidateForPromotion, expectedModelPath, explainGraphVault, exploreVault, exportGraphFormat, exportGraphHtml, exportGraphReportHtml, exportObsidianCanvas, exportObsidianVault, finishMemoryTask, getGitHookStatus, getGraphCommunityVault, getProviderForTask, getRetrievalStatus, getWatchStatus, getWebSearchAdapterForTask, getWorkspaceInfo, graphDiff, graphStatsVault, guideManagedSource, guideSourceScope, importInbox, ingestDirectory, ingestInput, ingestInputDetailed, initVault, initWorkspace, installAgent, installConfiguredAgents, installGitHooks, lintVault, listApprovals, listCandidates, listContextPacks, listGodNodes, listGraphHyperedges, listManagedSourceRecords, listManifests, listMemoryTasks, listPages, listSchedules, listTrackedRepoRoots, listWatchedRoots, loadMemoryTaskPages, loadVaultConfig, loadVaultSchema, loadVaultSchemas, lookupPresetCapabilities, markSuperseded, memoryTaskHashes, modelDownloadUrl, pathGraphVault, persistDecayFrontmatter, planMigration, previewCandidatePromotions, promoteCandidate, providerCapabilitySchema, providerTypeSchema, pushGraphNeo4j, queryGraphVault, queryVault, readApproval, readContextPack, readExtractedText, readGraphReport, readMemoryTask, readPage, rebuildRetrievalIndex, refreshGraphClusters, registerLocalWhisperProvider, rejectApproval, reloadManagedSources, removeWatchedRoot, renderContextPackLlms, renderContextPackMarkdown, renderGraphShareBundleFiles, renderGraphShareMarkdown, renderGraphSharePreviewHtml, renderGraphShareSvg, renderMemoryTaskMarkdown, resetDecay, resolveConsolidationConfig, resolveDecayConfig, resolveLargeRepoDefaults, resolvePaths, resolveRedactionPatterns, resolveRetrievalConfig, resolveWatchedRepoRoots, resumeMemoryTask, resumeSourceSession, reviewManagedSource, reviewSourceScope, runAutoPromotion, runConsolidation, runDecayPass, runMigration, runSchedule, runWatchCycle, searchVault, serveSchedules, stageGeneratedOutputPages, startGraphServer, startMcpServer, startMemoryTask, summarizeLocalWhisperSetup, syncTrackedRepos, syncTrackedReposForWatch, synthesizeHyperedgeHubs, trimToTokenBudget, uninstallGitHooks, updateMemoryTask, watchVault, webSearchProviderTypeSchema, withCapabilityFallback, writeRetrievalManifest };

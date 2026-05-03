type ViewerOutputAsset = {
    id: string;
    role: string;
    path: string;
    mimeType: string;
    width?: number;
    height?: number;
    dataPath?: string;
    dataUrl?: string;
};
type ViewerGraphNode = {
    id: string;
    type: string;
    label: string;
    sourceIds: string[];
    projectIds: string[];
    sourceClass?: string;
    pageId?: string;
    language?: string;
    moduleId?: string;
    symbolKind?: string;
    communityId?: string;
    degree?: number;
    bridgeScore?: number;
    isGodNode?: boolean;
};
type ViewerGraphEdge = {
    id: string;
    source: string;
    target: string;
    relation: string;
    status: string;
    evidenceClass?: string;
    confidence?: number;
    similarityReasons?: string[];
};
type ViewerGraphHyperedge = {
    id: string;
    label: string;
    relation: string;
    nodeIds: string[];
    evidenceClass: string;
    confidence: number;
    sourcePageIds: string[];
    why: string;
};
type ViewerGraphPage = {
    pageId: string;
    path: string;
    title: string;
    kind: string;
    status: string;
    sourceType?: string;
    sourceClass?: string;
    projectIds: string[];
    content: string;
    assets: ViewerOutputAsset[];
};
type ViewerGraphArtifact = {
    generatedAt: string;
    nodes: ViewerGraphNode[];
    edges: ViewerGraphEdge[];
    hyperedges: ViewerGraphHyperedge[];
    presentation?: {
        mode: "full" | "overview";
        threshold: number;
        nodeBudget: number;
        totalNodes: number;
        displayedNodes: number;
        totalEdges: number;
        displayedEdges: number;
        totalCommunities: number;
        displayedCommunities: number;
    };
    communities?: Array<{
        id: string;
        label: string;
        nodeIds: string[];
    }>;
    pages?: Array<{
        id: string;
        path: string;
        title: string;
        kind: string;
        status: string;
        sourceType?: string;
        sourceClass?: string;
        projectIds: string[];
        nodeIds: string[];
        backlinks: string[];
        relatedPageIds: string[];
    }>;
};
type ViewerSearchResult = {
    pageId: string;
    path: string;
    title: string;
    snippet: string;
    rank: number;
    kind?: string;
    status?: string;
    projectIds: string[];
    sourceType?: string;
    sourceClass?: string;
};
type ViewerPagePayload = {
    path: string;
    title: string;
    frontmatter: Record<string, unknown>;
    content: string;
    assets: ViewerOutputAsset[];
};
type ViewerGraphQueryResult = {
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
    matches: Array<{
        type: "node" | "page" | "hyperedge";
        id: string;
        label: string;
        score: number;
    }>;
};
type ViewerGraphPathResult = {
    from: string;
    to: string;
    resolvedFromNodeId?: string;
    resolvedToNodeId?: string;
    found: boolean;
    nodeIds: string[];
    edgeIds: string[];
    pageIds: string[];
    summary: string;
};
type ViewerGraphExplainResult = {
    target: string;
    node: ViewerGraphNode;
    page?: {
        id: string;
        path: string;
        title: string;
    };
    community?: {
        id: string;
        label: string;
    };
    neighbors: Array<{
        nodeId: string;
        label: string;
        type: string;
        pageId?: string;
        relation: string;
        direction: "incoming" | "outgoing";
        confidence: number;
        evidenceClass: string;
    }>;
    hyperedges: ViewerGraphHyperedge[];
    summary: string;
};
type ViewerApprovalSummary = {
    approvalId: string;
    createdAt: string;
    entryCount: number;
    pendingCount: number;
    acceptedCount: number;
    rejectedCount: number;
};
type ViewerApprovalDiffLine = {
    type: "add" | "remove" | "context";
    value: string;
};
type ViewerApprovalDiffHunk = {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: ViewerApprovalDiffLine[];
};
type ViewerApprovalFrontmatterChange = {
    key: string;
    before?: unknown;
    after?: unknown;
    protected: boolean;
};
type ViewerApprovalStructuredDiff = {
    hunks: ViewerApprovalDiffHunk[];
    addedLines: number;
    removedLines: number;
    frontmatterChanges: ViewerApprovalFrontmatterChange[];
};
type ViewerApprovalEntry = {
    pageId: string;
    title: string;
    kind: string;
    changeType: string;
    status: string;
    sourceIds: string[];
    nextPath?: string;
    previousPath?: string;
    currentContent?: string;
    stagedContent?: string;
    diff?: string;
    structuredDiff?: ViewerApprovalStructuredDiff;
    warnings?: string[];
};
type ViewerApprovalDetail = ViewerApprovalSummary & {
    entries: ViewerApprovalEntry[];
};
type ViewerReviewActionResult = ViewerApprovalSummary & {
    updatedEntries: string[];
};
type ViewerCandidateRecord = {
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
};
type ViewerMemoryTaskSummary = {
    id: string;
    title: string;
    goal: string;
    status: "active" | "blocked" | "completed" | "archived";
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
};
type ViewerLintFinding = {
    id: string;
    severity: "error" | "warning" | "info";
    category: string;
    message: string;
    pageId?: string;
    pagePath?: string;
    nodeId?: string;
    detectedAt?: string;
};
type ViewerDoctorStatus = "ok" | "warning" | "error";
type ViewerDoctorAction = {
    command: string;
    description: string;
    destructive?: boolean;
};
type ViewerDoctorCheck = {
    id: string;
    label: string;
    status: ViewerDoctorStatus;
    summary: string;
    detail?: string;
    actions?: ViewerDoctorAction[];
};
type ViewerDoctorRecommendation = {
    id: string;
    label: string;
    summary: string;
    priority: "high" | "medium" | "low";
    status: ViewerDoctorStatus;
    sourceCheckId: string;
    command?: string;
    description?: string;
    safeAction?: "doctor:repair";
};
type ViewerDoctorReport = {
    ok: boolean;
    status: ViewerDoctorStatus;
    generatedAt: string;
    rootDir: string;
    version: string;
    counts: {
        sources: number;
        managedSources: number;
        pages: number;
        nodes: number;
        edges: number;
        approvalsPending: number;
        candidates: number;
        tasks: number;
        pendingSemanticRefresh: number;
    };
    checks: ViewerDoctorCheck[];
    recommendations: ViewerDoctorRecommendation[];
    repaired: string[];
};
type ViewerActionResult = {
    ok?: boolean;
    error?: string;
    [key: string]: unknown;
};
type ViewerCapturePayload = {
    url?: string;
    title?: string;
    selectionText?: string;
    selectionHtml?: string;
    markdown?: string;
    tags?: string[];
    sourceMode?: "ingest" | "add" | "inbox";
};
type ViewerWorkspaceBundle = {
    graph: ViewerGraphArtifact;
    approvals: ViewerApprovalSummary[];
    candidates: ViewerCandidateRecord[];
    memoryTasks: ViewerMemoryTaskSummary[];
    watchStatus: ViewerWatchStatus;
    doctor: ViewerDoctorReport | null;
    graphReport: ViewerGraphReport | null;
    lintFindings: ViewerLintFinding[];
};
type ViewerWatchStatus = {
    generatedAt: string;
    watchedRepoRoots: string[];
    lastRun?: {
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
    };
    pendingSemanticRefresh: Array<{
        id: string;
        repoRoot: string;
        path: string;
        changeType: "added" | "modified" | "removed";
        detectedAt: string;
        sourceId?: string;
        sourceKind?: string;
    }>;
};
type ViewerGraphReport = {
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
    sourceClassBreakdown: Record<string, {
        sources: number;
        pages: number;
        nodes: number;
    }>;
    warnings: string[];
    benchmark?: {
        generatedAt: string;
        stale: boolean;
        summary: {
            questionCount: number;
            uniqueVisitedNodes: number;
            finalContextTokens: number;
            naiveCorpusTokens: number;
            avgReduction: number;
            reductionRatio: number;
        };
        questionCount: number;
    };
    surprisingConnections: Array<{
        id: string;
        sourceNodeId: string;
        sourceLabel: string;
        targetNodeId: string;
        targetLabel: string;
        relation: string;
        evidenceClass: string;
        confidence: number;
        pathNodeIds: string[];
        pathEdgeIds: string[];
        pathRelations: string[];
        pathEvidenceClasses: string[];
        pathSummary: string;
        why: string;
        explanation: string;
    }>;
    groupPatterns: ViewerGraphHyperedge[];
    suggestedQuestions: string[];
    recentResearchSources: Array<{
        pageId: string;
        path: string;
        title: string;
        sourceType: string;
        updatedAt: string;
    }>;
};
declare global {
    interface Window {
        __SWARMVAULT_EMBEDDED_DATA__?: {
            graph: ViewerGraphArtifact;
            pages: ViewerGraphPage[];
            report?: ViewerGraphReport;
        };
    }
}
type ViewerSearchOptions = {
    limit?: number;
    kind?: string;
    status?: string;
    project?: string;
    sourceType?: string;
    sourceClass?: string;
};
declare function fetchGraphArtifact(input?: string, init?: RequestInit): Promise<ViewerGraphArtifact>;
declare function searchViewerPages(query: string, options?: ViewerSearchOptions): Promise<ViewerSearchResult[]>;
declare function fetchViewerPage(path: string): Promise<ViewerPagePayload>;
declare function fetchGraphQuery(question: string, options?: {
    traversal?: "bfs" | "dfs";
    budget?: number;
}): Promise<ViewerGraphQueryResult>;
declare function fetchGraphReport(): Promise<ViewerGraphReport | null>;
declare function fetchGraphPath(from: string, to: string): Promise<ViewerGraphPathResult>;
declare function fetchGraphExplain(target: string): Promise<ViewerGraphExplainResult>;
declare function fetchApprovals(): Promise<ViewerApprovalSummary[]>;
declare function fetchApprovalDetail(approvalId: string): Promise<ViewerApprovalDetail>;
declare function applyReviewAction(approvalId: string, action: "accept" | "reject", targets?: string[]): Promise<ViewerReviewActionResult>;
declare function fetchCandidates(): Promise<ViewerCandidateRecord[]>;
declare function fetchMemoryTasks(): Promise<ViewerMemoryTaskSummary[]>;
declare function applyCandidateAction(target: string, action: "promote" | "archive"): Promise<ViewerCandidateRecord>;
declare function fetchWatchStatus(): Promise<ViewerWatchStatus>;
declare function fetchLintFindings(): Promise<ViewerLintFinding[]>;
declare function fetchDoctorReport(options?: {
    repair?: boolean;
}): Promise<ViewerDoctorReport | null>;
declare function captureToVault(payload: ViewerCapturePayload): Promise<ViewerActionResult>;
declare function createContextPack(payload: {
    goal: string;
    target?: string;
    budgetTokens?: number;
    format?: "markdown" | "json" | "llms";
}): Promise<ViewerActionResult>;
declare function createTask(payload: {
    goal: string;
    target?: string;
    budgetTokens?: number;
    agent?: string;
}): Promise<ViewerActionResult>;
declare function fetchWorkspaceBundle(): Promise<ViewerWorkspaceBundle | null>;
type SubgraphExportPayload = {
    generatedAt: string;
    rootNodeId?: string;
    nodes: ViewerGraphNode[];
    edges: ViewerGraphEdge[];
};
declare function buildSubgraphExport(graph: ViewerGraphArtifact, nodeIds: string[]): SubgraphExportPayload;
declare function downloadDataUrl(filename: string, dataUrl: string): void;
declare function downloadText(filename: string, text: string, mime?: string): void;

export { type SubgraphExportPayload, type ViewerActionResult, type ViewerApprovalDetail, type ViewerApprovalDiffHunk, type ViewerApprovalDiffLine, type ViewerApprovalEntry, type ViewerApprovalFrontmatterChange, type ViewerApprovalStructuredDiff, type ViewerApprovalSummary, type ViewerCandidateRecord, type ViewerCapturePayload, type ViewerDoctorAction, type ViewerDoctorCheck, type ViewerDoctorRecommendation, type ViewerDoctorReport, type ViewerDoctorStatus, type ViewerGraphArtifact, type ViewerGraphEdge, type ViewerGraphExplainResult, type ViewerGraphHyperedge, type ViewerGraphNode, type ViewerGraphPage, type ViewerGraphPathResult, type ViewerGraphQueryResult, type ViewerGraphReport, type ViewerLintFinding, type ViewerMemoryTaskSummary, type ViewerOutputAsset, type ViewerPagePayload, type ViewerReviewActionResult, type ViewerSearchOptions, type ViewerSearchResult, type ViewerWatchStatus, type ViewerWorkspaceBundle, applyCandidateAction, applyReviewAction, buildSubgraphExport, captureToVault, createContextPack, createTask, downloadDataUrl, downloadText, fetchApprovalDetail, fetchApprovals, fetchCandidates, fetchDoctorReport, fetchGraphArtifact, fetchGraphExplain, fetchGraphPath, fetchGraphQuery, fetchGraphReport, fetchLintFindings, fetchMemoryTasks, fetchViewerPage, fetchWatchStatus, fetchWorkspaceBundle, searchViewerPages };

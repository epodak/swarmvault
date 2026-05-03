// src/lib.ts
function embeddedData() {
  return typeof window !== "undefined" ? window.__SWARMVAULT_EMBEDDED_DATA__ : void 0;
}
function normalizeGraphTarget(value) {
  return value.trim().toLowerCase();
}
function embeddedNodeById(graph) {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}
function embeddedPageById(graph) {
  return new Map((graph.pages ?? []).map((page) => [page.id, page]));
}
function embeddedResolveNode(graph, target) {
  const normalized = normalizeGraphTarget(target);
  return graph.nodes.find((node) => node.id === target || normalizeGraphTarget(node.label) === normalized || node.pageId === target) ?? null;
}
function embeddedGraphAdjacency(graph) {
  const adjacency = /* @__PURE__ */ new Map();
  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.push({
      nodeId: edge.target,
      edge,
      direction: "outgoing"
    });
    adjacency.get(edge.target)?.push({
      nodeId: edge.source,
      edge,
      direction: "incoming"
    });
  }
  return adjacency;
}
function shortestEmbeddedGraphPath(graph, from, to) {
  const start = embeddedResolveNode(graph, from);
  const end = embeddedResolveNode(graph, to);
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
  const adjacency = embeddedGraphAdjacency(graph);
  const queue = [start.id];
  const visited = /* @__PURE__ */ new Set([start.id]);
  const previous = /* @__PURE__ */ new Map();
  while (queue.length) {
    const current2 = queue.shift();
    if (current2 === end.id) {
      break;
    }
    for (const neighbor of adjacency.get(current2) ?? []) {
      if (visited.has(neighbor.nodeId)) {
        continue;
      }
      visited.add(neighbor.nodeId);
      previous.set(neighbor.nodeId, {
        nodeId: current2,
        edgeId: neighbor.edge.id
      });
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
    if (!prev) {
      break;
    }
    edgeIds.push(prev.edgeId);
    current = prev.nodeId;
  }
  nodeIds.push(start.id);
  nodeIds.reverse();
  edgeIds.reverse();
  const nodes = embeddedNodeById(graph);
  const pageIds = [
    ...new Set(
      nodeIds.flatMap((nodeId) => {
        const pageId = nodes.get(nodeId)?.pageId;
        return pageId ? [pageId] : [];
      })
    )
  ];
  return {
    from,
    to,
    resolvedFromNodeId: start.id,
    resolvedToNodeId: end.id,
    found: true,
    nodeIds,
    edgeIds,
    pageIds,
    summary: nodeIds.map((nodeId) => nodes.get(nodeId)?.label ?? nodeId).join(" -> ")
  };
}
function explainEmbeddedGraphTarget(graph, target) {
  const node = embeddedResolveNode(graph, target);
  if (!node) {
    throw new Error(`Could not resolve graph target: ${target}`);
  }
  const pages = embeddedPageById(graph);
  const page = node.pageId ? pages.get(node.pageId) : void 0;
  const nodes = embeddedNodeById(graph);
  const neighbors = [];
  for (const neighbor of embeddedGraphAdjacency(graph).get(node.id) ?? []) {
    const targetNode = nodes.get(neighbor.nodeId);
    if (!targetNode) {
      continue;
    }
    neighbors.push({
      nodeId: targetNode.id,
      label: targetNode.label,
      type: targetNode.type,
      pageId: targetNode.pageId,
      relation: neighbor.edge.relation,
      direction: neighbor.direction,
      confidence: neighbor.edge.confidence ?? 0,
      evidenceClass: neighbor.edge.evidenceClass ?? "unknown"
    });
  }
  neighbors.sort((left, right) => right.confidence - left.confidence || left.label.localeCompare(right.label));
  const hyperedges = (graph.hyperedges ?? []).filter((hyperedge) => hyperedge.nodeIds.includes(node.id));
  const community = graph.communities?.find((candidate) => candidate.id === node.communityId);
  return {
    target,
    node,
    page: page ? {
      id: page.id,
      path: page.path,
      title: page.title
    } : void 0,
    community: community ? {
      id: community.id,
      label: community.label
    } : void 0,
    neighbors,
    hyperedges,
    summary: [
      `Node: ${node.label}`,
      `Type: ${node.type}`,
      `Community: ${node.communityId ?? "none"}`,
      `Neighbors: ${neighbors.length}`,
      `Group patterns: ${hyperedges.length}`,
      `Page: ${page?.path ?? "none"}`
    ].join("\n")
  };
}
function uniqueByKey(items, key) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const item of items) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    result.push(item);
  }
  return result;
}
function embeddedScoreMatch(query, candidate) {
  const q = query.trim().toLowerCase();
  const c = candidate.trim().toLowerCase();
  if (!q || !c) return 0;
  if (c === q) return 100;
  if (c.startsWith(q)) return 80;
  if (c.includes(q)) return 60;
  const qTokens = q.split(/\s+/).filter(Boolean);
  const cTokens = new Set(c.split(/\s+/).filter(Boolean));
  const overlap = qTokens.filter((token) => cTokens.has(token)).length;
  return overlap ? overlap * 10 : 0;
}
function embeddedGraphQuery(graph, question, searchResults, options) {
  const traversal = options?.traversal ?? "bfs";
  const budget = Math.max(3, Math.min(options?.budget ?? 12, 50));
  const pagesById = new Map((graph.pages ?? []).map((page) => [page.id, page]));
  const pageMatchesRaw = searchResults.map((result) => {
    const page = pagesById.get(result.pageId);
    const score = Math.max(embeddedScoreMatch(question, result.title), embeddedScoreMatch(question, result.path));
    if (!page || score <= 0) return null;
    return { type: "page", id: page.id, label: page.title, score };
  });
  const pageMatches = pageMatchesRaw.filter(
    (match) => match !== null
  );
  const nodeMatches = graph.nodes.map((node) => ({
    type: "node",
    id: node.id,
    label: node.label,
    score: Math.max(embeddedScoreMatch(question, node.label), embeddedScoreMatch(question, node.id))
  })).filter((match) => match.score > 0);
  const hyperedgeMatches = (graph.hyperedges ?? []).map((hyperedge) => ({
    type: "hyperedge",
    id: hyperedge.id,
    label: hyperedge.label,
    score: Math.max(
      embeddedScoreMatch(question, hyperedge.label),
      embeddedScoreMatch(question, hyperedge.why),
      embeddedScoreMatch(question, hyperedge.relation)
    )
  })).filter((match) => match.score > 0);
  const matches = uniqueByKey([...pageMatches, ...nodeMatches, ...hyperedgeMatches], (match) => `${match.type}:${match.id}`).sort((left, right) => right.score - left.score || left.label.localeCompare(right.label)).slice(0, 12);
  const seeds = uniqueByKey(
    [
      ...searchResults.flatMap((result) => pagesById.get(result.pageId)?.nodeIds ?? []),
      ...matches.filter((match) => match.type === "page").flatMap((match) => pagesById.get(match.id)?.nodeIds ?? []),
      ...matches.filter((match) => match.type === "node").map((match) => match.id),
      ...matches.filter((match) => match.type === "hyperedge").flatMap((match) => (graph.hyperedges ?? []).find((hyperedge) => hyperedge.id === match.id)?.nodeIds ?? [])
    ],
    (item) => item
  ).filter(Boolean);
  const adjacency = /* @__PURE__ */ new Map();
  const pushNeighbor = (nodeId, neighbor) => {
    if (!adjacency.has(nodeId)) adjacency.set(nodeId, []);
    adjacency.get(nodeId)?.push(neighbor);
  };
  for (const edge of graph.edges) {
    pushNeighbor(edge.source, { edge, nodeId: edge.target, direction: "outgoing" });
    pushNeighbor(edge.target, { edge, nodeId: edge.source, direction: "incoming" });
  }
  for (const [nodeId, items] of adjacency.entries()) {
    items.sort(
      (left, right) => (right.edge.confidence ?? 0) - (left.edge.confidence ?? 0) || left.edge.relation.localeCompare(right.edge.relation)
    );
    adjacency.set(nodeId, items);
  }
  const visitedNodeIds = [];
  const visitedEdgeIds = /* @__PURE__ */ new Set();
  const seen = /* @__PURE__ */ new Set();
  const frontier = [...seeds];
  while (frontier.length && visitedNodeIds.length < budget) {
    const current = traversal === "dfs" ? frontier.pop() : frontier.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    visitedNodeIds.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      visitedEdgeIds.add(neighbor.edge.id);
      if (!seen.has(neighbor.nodeId)) frontier.push(neighbor.nodeId);
      if (visitedNodeIds.length + frontier.length >= budget * 2) break;
    }
  }
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const pageIds = uniqueByKey(
    [
      ...searchResults.map((result) => result.pageId),
      ...matches.filter((match) => match.type === "page").map((match) => match.id),
      ...visitedNodeIds.flatMap((nodeId) => {
        const node = nodesById.get(nodeId);
        return node?.pageId ? [node.pageId] : [];
      })
    ],
    (item) => item
  );
  const communities = uniqueByKey(
    visitedNodeIds.map((nodeId) => nodesById.get(nodeId)?.communityId).filter((communityId) => Boolean(communityId)),
    (item) => item
  );
  const hyperedgeIds = uniqueByKey(
    (graph.hyperedges ?? []).filter((hyperedge) => hyperedge.nodeIds.some((nodeId) => visitedNodeIds.includes(nodeId))).map((hyperedge) => hyperedge.id),
    (item) => item
  );
  return {
    question,
    traversal,
    seedNodeIds: seeds,
    seedPageIds: uniqueByKey(
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
function normalizeSnippet(content, query) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!query) {
    return normalized.slice(0, 160);
  }
  const index = normalized.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) {
    return normalized.slice(0, 160);
  }
  const start = Math.max(0, index - 50);
  const end = Math.min(normalized.length, index + Math.max(query.length, 40));
  return `${start > 0 ? "..." : ""}${normalized.slice(start, end)}${end < normalized.length ? "..." : ""}`;
}
async function fetchGraphArtifact(input = "/api/graph", init) {
  const embedded = embeddedData();
  if (embedded) {
    return embedded.graph;
  }
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Failed to load graph artifact: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function searchViewerPages(query, options = {}) {
  const embedded = embeddedData();
  const limit = options.limit ?? 10;
  const kind = options.kind ?? "all";
  const status = options.status ?? "all";
  const project = options.project ?? "all";
  const sourceType = options.sourceType ?? "all";
  const sourceClass = options.sourceClass ?? "all";
  if (embedded) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }
    return embedded.pages.filter((page) => kind === "all" ? true : page.kind === kind).filter((page) => status === "all" ? true : page.status === status).filter(
      (page) => project === "all" ? true : project === "unassigned" ? page.projectIds.length === 0 : page.projectIds.includes(project)
    ).filter((page) => sourceType === "all" ? true : (page.sourceType ?? "") === sourceType).filter((page) => sourceClass === "all" ? true : (page.sourceClass ?? "") === sourceClass).map((page) => {
      const haystack = `${page.title}
${page.content}`.toLowerCase();
      const score = haystack.includes(normalizedQuery) ? haystack.indexOf(normalizedQuery) : Number.POSITIVE_INFINITY;
      return {
        pageId: page.pageId,
        path: page.path,
        title: page.title,
        snippet: normalizeSnippet(page.content, query),
        rank: score,
        kind: page.kind,
        status: page.status,
        projectIds: page.projectIds,
        sourceType: page.sourceType,
        sourceClass: page.sourceClass
      };
    }).filter((page) => Number.isFinite(page.rank)).sort((left, right) => left.rank - right.rank || left.title.localeCompare(right.title)).slice(0, limit);
  }
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    kind,
    status,
    project,
    sourceType,
    sourceClass
  });
  const response = await fetch(`/api/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to search pages: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchViewerPage(path) {
  const embedded = embeddedData();
  if (embedded) {
    const page = embedded.pages.find((candidate) => candidate.path === path);
    if (!page) {
      throw new Error(`Page not found: ${path}`);
    }
    return {
      path: page.path,
      title: page.title,
      frontmatter: {
        page_id: page.pageId,
        kind: page.kind,
        status: page.status,
        project_ids: page.projectIds,
        source_type: page.sourceType,
        source_class: page.sourceClass
      },
      content: page.content,
      assets: page.assets ?? []
    };
  }
  const response = await fetch(`/api/page?path=${encodeURIComponent(path)}`);
  if (!response.ok) {
    throw new Error(`Failed to load page: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchGraphQuery(question, options = {}) {
  const embedded = embeddedData();
  if (embedded) {
    const searchResults = await searchViewerPages(question, { limit: 10 });
    return embeddedGraphQuery(embedded.graph, question, searchResults, options);
  }
  const params = new URLSearchParams({
    q: question,
    traversal: options.traversal ?? "bfs",
    budget: String(options.budget ?? 12)
  });
  const response = await fetch(`/api/graph/query?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to query graph: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchGraphReport() {
  const embedded = embeddedData();
  if (embedded) {
    return embedded.report ?? null;
  }
  const response = await fetch("/api/graph-report");
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to load graph report: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchGraphPath(from, to) {
  const embedded = embeddedData();
  if (embedded) {
    return shortestEmbeddedGraphPath(embedded.graph, from, to);
  }
  const params = new URLSearchParams({
    from,
    to
  });
  const response = await fetch(`/api/graph/path?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to find graph path: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchGraphExplain(target) {
  const embedded = embeddedData();
  if (embedded) {
    return explainEmbeddedGraphTarget(embedded.graph, target);
  }
  const response = await fetch(`/api/graph/explain?target=${encodeURIComponent(target)}`);
  if (!response.ok) {
    throw new Error(`Failed to explain graph target: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchApprovals() {
  if (embeddedData()) {
    return [];
  }
  const response = await fetch("/api/reviews");
  if (!response.ok) {
    throw new Error(`Failed to load approvals: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchApprovalDetail(approvalId) {
  if (embeddedData()) {
    throw new Error("Review actions are unavailable in standalone exports.");
  }
  const response = await fetch(`/api/review?id=${encodeURIComponent(approvalId)}`);
  if (!response.ok) {
    throw new Error(`Failed to load approval detail: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function applyReviewAction(approvalId, action, targets = []) {
  if (embeddedData()) {
    throw new Error("Review actions are unavailable in standalone exports.");
  }
  const response = await fetch(`/api/review?action=${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ approvalId, targets })
  });
  if (!response.ok) {
    throw new Error(`Failed to ${action} review entries: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchCandidates() {
  if (embeddedData()) {
    return [];
  }
  const response = await fetch("/api/candidates");
  if (!response.ok) {
    throw new Error(`Failed to load candidates: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchMemoryTasks() {
  if (embeddedData()) {
    return [];
  }
  const response = await fetch("/api/memory-tasks");
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`Failed to load memory tasks: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function applyCandidateAction(target, action) {
  if (embeddedData()) {
    throw new Error("Candidate actions are unavailable in standalone exports.");
  }
  const response = await fetch(`/api/candidate?action=${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ target })
  });
  if (!response.ok) {
    throw new Error(`Failed to ${action} candidate: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchWatchStatus() {
  if (embeddedData()) {
    return {
      generatedAt: "",
      watchedRepoRoots: [],
      pendingSemanticRefresh: []
    };
  }
  const response = await fetch("/api/watch-status");
  if (!response.ok) {
    throw new Error(`Failed to load watch status: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchLintFindings() {
  if (embeddedData()) {
    return [];
  }
  const response = await fetch("/api/lint");
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`Failed to load lint findings: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchDoctorReport(options = {}) {
  if (embeddedData()) {
    return null;
  }
  const response = await fetch("/api/doctor", {
    method: options.repair ? "POST" : "GET",
    headers: options.repair ? { "content-type": "application/json" } : void 0,
    body: options.repair ? JSON.stringify({ repair: true }) : void 0
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to load vault doctor report: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function captureToVault(payload) {
  if (embeddedData()) {
    throw new Error("Capture is unavailable in standalone exports.");
  }
  const response = await fetch("/api/clip", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Failed to capture source: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function createContextPack(payload) {
  if (embeddedData()) {
    throw new Error("Context-pack actions are unavailable in standalone exports.");
  }
  const response = await fetch("/api/context-pack", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Failed to build context pack: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function createTask(payload) {
  if (embeddedData()) {
    throw new Error("Task actions are unavailable in standalone exports.");
  }
  const response = await fetch("/api/task?action=start", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Failed to start task: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchWorkspaceBundle() {
  if (embeddedData()) {
    return null;
  }
  const response = await fetch("/api/workspace");
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load workspace bundle: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
function buildSubgraphExport(graph, nodeIds) {
  const nodeSet = new Set(nodeIds);
  const nodes = graph.nodes.filter((node) => nodeSet.has(node.id));
  const edges = graph.edges.filter((edge) => nodeSet.has(edge.source) && nodeSet.has(edge.target));
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    rootNodeId: nodeIds[0],
    nodes,
    edges
  };
}
function downloadDataUrl(filename, dataUrl) {
  if (typeof document === "undefined") return;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function downloadText(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
export {
  applyCandidateAction,
  applyReviewAction,
  buildSubgraphExport,
  captureToVault,
  createContextPack,
  createTask,
  downloadDataUrl,
  downloadText,
  fetchApprovalDetail,
  fetchApprovals,
  fetchCandidates,
  fetchDoctorReport,
  fetchGraphArtifact,
  fetchGraphExplain,
  fetchGraphPath,
  fetchGraphQuery,
  fetchGraphReport,
  fetchLintFindings,
  fetchMemoryTasks,
  fetchViewerPage,
  fetchWatchStatus,
  fetchWorkspaceBundle,
  searchViewerPages
};

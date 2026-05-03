// src/token-estimation.ts
function estimateTokens(text) {
  if (!text) {
    return 0;
  }
  let codeChars = 0;
  let proseChars = 0;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```") || trimmed.startsWith("- `") || trimmed.startsWith("import ") || trimmed.startsWith("export ") || trimmed.startsWith("const ") || trimmed.startsWith("function ") || trimmed.startsWith("class ") || trimmed.startsWith("def ") || trimmed.startsWith("fn ") || /^\s*[{}[\]();]/.test(trimmed) || /^\w+\s*[=:]\s*/.test(trimmed)) {
      codeChars += line.length;
    } else {
      proseChars += line.length;
    }
  }
  return Math.ceil(codeChars / 3 + proseChars / 4);
}
var KIND_WEIGHTS = {
  index: 10,
  graph_report: 8,
  module: 7,
  concept: 6,
  source: 5,
  community_summary: 5,
  entity: 4,
  output: 3,
  insight: 2
};
function estimatePageTokens(pageId, path, kind, content, nodeDegree, confidence) {
  const tokens = estimateTokens(content);
  const kindWeight = KIND_WEIGHTS[kind] ?? 1;
  const priority = kindWeight * (1 + (nodeDegree ?? 0) * 0.1) * (confidence ?? 0.5);
  return { pageId, path, kind, tokens, priority };
}
function trimToTokenBudget(pages, maxTokens) {
  const totalTokens = pages.reduce((sum, p) => sum + p.tokens, 0);
  if (totalTokens <= maxTokens) {
    return { kept: pages, dropped: [], totalTokens, budgetTokens: maxTokens, keptTokens: totalTokens };
  }
  const sorted = [...pages].sort((a, b) => b.priority - a.priority);
  const kept = [];
  const dropped = [];
  let accumulated = 0;
  for (const page of sorted) {
    if (accumulated + page.tokens <= maxTokens) {
      kept.push(page);
      accumulated += page.tokens;
    } else {
      dropped.push(page);
    }
  }
  return {
    kept,
    dropped,
    totalTokens,
    budgetTokens: maxTokens,
    keptTokens: accumulated
  };
}

export {
  estimateTokens,
  estimatePageTokens,
  trimToTokenBudget
};

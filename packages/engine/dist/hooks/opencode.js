// src/hooks/opencode.ts
import path from "path";
var reportRelativePath = path.join("wiki", "graph", "report.md");
var name = "swarmvault-graph-first";
async function swarmvaultGraphFirst({ client }) {
  let reportSeen = false;
  async function hasReport(cwd) {
    try {
      await Bun.file(path.join(cwd, reportRelativePath)).arrayBuffer();
      return true;
    } catch {
      return false;
    }
  }
  async function note(message) {
    if (client?.app?.log) {
      await client.app.log({
        level: "info",
        message
      });
    }
  }
  return {
    async "session.created"(input) {
      reportSeen = false;
      const cwd = input?.session?.cwd ?? process.cwd();
      if (await hasReport(cwd)) {
        await note("SwarmVault graph report exists. Read wiki/graph/report.md before broad workspace searching.");
      }
    },
    async "tool.execute.before"(input) {
      const cwd = input?.session?.cwd ?? process.cwd();
      if (!await hasReport(cwd)) {
        return;
      }
      const argsText = JSON.stringify(input?.args ?? {});
      if (argsText.includes("wiki/graph/report.md")) {
        reportSeen = true;
        return;
      }
      if (!reportSeen && ["glob", "grep"].includes(String(input?.tool ?? ""))) {
        await note("SwarmVault graph report exists. Read wiki/graph/report.md before broad workspace searching.");
      }
    }
  };
}
export {
  swarmvaultGraphFirst as default,
  name
};

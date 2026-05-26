/**
 * 🚀 Mother MCP - Remote Streamable HTTP Server
 * 
 * Deploy this → Get a URL → Add URL in Claude/Cursor → Done!
 * 
 * Example: https://mcp.yourdomain.com/mcp
 * 
 * Just like: https://mcp.higgsfield.ai/mcp
 */

import http from "http";
import { PluginRegistry } from "./core/plugin-registry.js";
import { CommandRouter } from "./core/command-router.js";

// Import all plugins
import { FacebookAdsPlugin } from "./plugins/ads/facebook-ads.js";
import { GoogleAdsPlugin } from "./plugins/ads/google-ads.js";
import { TikTokAdsPlugin } from "./plugins/ads/tiktok-ads.js";
import { PinterestAdsPlugin } from "./plugins/ads/pinterest-ads.js";
import { LinkedInAdsPlugin } from "./plugins/ads/linkedin-ads.js";
import { XAdsPlugin } from "./plugins/ads/x-ads.js";
import { TagManagerPlugin } from "./plugins/analytics/tag-manager.js";
import { GA4Plugin } from "./plugins/analytics/ga4.js";
import { LookerStudioPlugin } from "./plugins/analytics/looker-studio.js";
import { ClickUpPlugin } from "./plugins/productivity/clickup.js";
import { NotionPlugin } from "./plugins/productivity/notion.js";
import { GoogleDocsPlugin } from "./plugins/productivity/google-docs.js";
import { GoogleSheetsPlugin } from "./plugins/productivity/google-sheets.js";

// ============================================================
// Setup
// ============================================================

const registry = new PluginRegistry();
const router = new CommandRouter(registry);

const plugins = [
  new FacebookAdsPlugin(),
  new GoogleAdsPlugin(),
  new TikTokAdsPlugin(),
  new PinterestAdsPlugin(),
  new LinkedInAdsPlugin(),
  new XAdsPlugin(),
  new TagManagerPlugin(),
  new GA4Plugin(),
  new LookerStudioPlugin(),
  new ClickUpPlugin(),
  new NotionPlugin(),
  new GoogleDocsPlugin(),
  new GoogleSheetsPlugin(),
];

plugins.forEach((plugin) => {
  plugin.loadFromEnv();
  registry.register(plugin);
});

// ============================================================
// Streamable HTTP MCP Server
// ============================================================

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Mcp-Session-Id");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "mother-mcp",
      version: "1.0.0",
      status: "running",
      platforms: plugins.length,
      tools: router.getAllTools().length,
      connected: plugins.filter(p => p.isConfigured()).length,
      endpoint: "/mcp",
    }));
    return;
  }

  // MCP Endpoint - POST /mcp (Streamable HTTP)
  if (req.url === "/mcp" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const message = JSON.parse(body);
        const result = await handleMcpMessage(message);

        if (result === null) {
          // Notification - no response needed
          res.writeHead(202);
          res.end();
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error: " + err.message },
        }));
      }
    });
    return;
  }

  // MCP Endpoint - GET /mcp (SSE for server-initiated messages)
  if (req.url === "/mcp" && req.method === "GET") {
    const accept = req.headers.accept || "";
    if (accept.includes("text/event-stream")) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      });
      // Keep alive - no server-initiated messages for now
      const interval = setInterval(() => res.write(": ping\n\n"), 30000);
      req.on("close", () => clearInterval(interval));
      return;
    }
    res.writeHead(405);
    res.end("Use POST for MCP requests");
    return;
  }

  // MCP Endpoint - DELETE /mcp (session cleanup)
  if (req.url === "/mcp" && req.method === "DELETE") {
    res.writeHead(200);
    res.end();
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found. Use POST /mcp" }));
});

// ============================================================
// MCP Message Handler
// ============================================================

async function handleMcpMessage(message) {
  const { id, method, params } = message;

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "mother-mcp", version: "1.0.0" },
        },
      };

    case "notifications/initialized":
      return null; // No response for notifications

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: router.getAllTools() },
      };

    case "tools/call": {
      const { name, arguments: args } = params;
      try {
        const result = await router.execute(name, args || {});
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{
              type: "text",
              text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
            }],
          },
        };
      } catch (err) {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: `Error: ${err.message}` }],
            isError: true,
          },
        };
      }
    }

    case "ping":
      return { jsonrpc: "2.0", id, result: {} };

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

// ============================================================
// Start
// ============================================================

server.listen(PORT, () => {
  const configured = plugins.filter(p => p.isConfigured()).length;
  console.log(`🚀 Mother MCP Server live!`);
  console.log(`   URL: http://localhost:${PORT}/mcp`);
  console.log(`   ${plugins.length} platforms | ${router.getAllTools().length} tools | ${configured} connected`);
  console.log(`\n   Add this URL in Claude/Cursor: http://localhost:${PORT}/mcp`);
  console.log(`   Or after deploy: https://your-domain.com/mcp`);
});

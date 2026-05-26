/**
 * 🚀 Mother MCP - Vercel Serverless Function
 * 
 * Deploy to Vercel → Get URL → Add in Claude/Cursor → Done!
 * 
 * Your URL will be: https://your-project.vercel.app/mcp
 */

import { PluginRegistry } from "../src/core/plugin-registry.js";
import { CommandRouter } from "../src/core/command-router.js";

import { FacebookAdsPlugin } from "../src/plugins/ads/facebook-ads.js";
import { GoogleAdsPlugin } from "../src/plugins/ads/google-ads.js";
import { TikTokAdsPlugin } from "../src/plugins/ads/tiktok-ads.js";
import { PinterestAdsPlugin } from "../src/plugins/ads/pinterest-ads.js";
import { LinkedInAdsPlugin } from "../src/plugins/ads/linkedin-ads.js";
import { XAdsPlugin } from "../src/plugins/ads/x-ads.js";
import { TagManagerPlugin } from "../src/plugins/analytics/tag-manager.js";
import { GA4Plugin } from "../src/plugins/analytics/ga4.js";
import { LookerStudioPlugin } from "../src/plugins/analytics/looker-studio.js";
import { ClickUpPlugin } from "../src/plugins/productivity/clickup.js";
import { NotionPlugin } from "../src/plugins/productivity/notion.js";
import { GoogleDocsPlugin } from "../src/plugins/productivity/google-docs.js";
import { GoogleSheetsPlugin } from "../src/plugins/productivity/google-sheets.js";

// Setup
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

// MCP Handler
async function handleMcp(method, params, id) {
  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0", id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "mother-mcp", version: "1.0.0" },
        },
      };
    case "notifications/initialized":
      return null;
    case "tools/list":
      return { jsonrpc: "2.0", id, result: { tools: router.getAllTools() } };
    case "tools/call": {
      const { name, arguments: args } = params;
      try {
        const result = await router.execute(name, args || {});
        return {
          jsonrpc: "2.0", id,
          result: {
            content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }],
          },
        };
      } catch (err) {
        return {
          jsonrpc: "2.0", id,
          result: { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true },
        };
      }
    }
    case "ping":
      return { jsonrpc: "2.0", id, result: {} };
    default:
      return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

// Vercel Handler
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Mcp-Session-Id");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // GET / - Health check
  if (req.method === "GET") {
    const configured = plugins.filter(p => p.isConfigured()).length;
    return res.json({
      name: "mother-mcp",
      version: "1.0.0",
      status: "running",
      platforms: plugins.length,
      tools: router.getAllTools().length,
      connected: configured,
      endpoint: "/mcp",
      usage: "Add this URL in Claude Desktop or Cursor as MCP server",
    });
  }

  // DELETE - Session cleanup
  if (req.method === "DELETE") {
    return res.status(200).end();
  }

  // POST /mcp - MCP Protocol
  if (req.method === "POST") {
    try {
      const { id, method, params } = req.body;
      const result = await handleMcp(method, params, id);

      if (result === null) {
        return res.status(202).end();
      }

      return res.json(result);
    } catch (err) {
      return res.status(400).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: " + err.message },
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

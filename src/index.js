/**
 * Mother MCP - Master Control Platform
 * 
 * A unified MCP server that connects and manages all marketing tools,
 * ad platforms, analytics, project management, and AI tools.
 * 
 * Connect once → Control everything.
 * 
 * Uses lightweight built-in MCP protocol implementation (no external deps).
 */

import { MCPServer } from "./core/mcp-server.js";
import { PluginRegistry } from "./core/plugin-registry.js";
import { CommandRouter } from "./core/command-router.js";
import { AuthManager } from "./core/auth-manager.js";
import { ConfigManager } from "./core/config-manager.js";
import { loadEnvAndConfigure } from "./core/env-loader.js";

// Import all platform plugins
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

import { AIToolsPlugin } from "./plugins/ai/ai-tools.js";

// ============================================================
// Initialize Mother MCP
// ============================================================

const config = new ConfigManager();
const auth = new AuthManager(config);
const registry = new PluginRegistry();
const router = new CommandRouter(registry, auth);

// Register all plugins
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
  new AIToolsPlugin(),
];

plugins.forEach((plugin) => registry.register(plugin));

// Auto-configure plugins from .env file
console.error("");
console.error("🔑 Auto-configuring from .env...");
const autoConfigured = loadEnvAndConfigure(registry);
if (autoConfigured > 0) {
  console.error(`   ✅ ${autoConfigured} platform(s) auto-configured!`);
} else {
  console.error("   ℹ️  No .env credentials found. Use 'mother_configure' or edit .env file.");
}
console.error("");

// ============================================================
// MCP Server
// ============================================================

const server = new MCPServer({
  name: "mother-mcp",
  version: "1.0.0",
});

server.onListTools(() => {
  return router.getAllTools();
});

server.onCallTool(async (name, args) => {
  try {
    const result = await router.execute(name, args);
    return {
      content: [
        {
          type: "text",
          text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

server.start();
console.error("🚀 Mother MCP Server running - All systems connected!");
console.error(`📦 ${plugins.length} plugins loaded | ${router.getAllTools().length} tools available`);

/**
 * 🚀 Mother MCP - Master Control Platform
 * 
 * Just add this MCP link → command দাও → কাজ হবে।
 * 
 * All your ad platforms, analytics, and productivity tools
 * controlled from one single MCP connection.
 */

import { MCPServer } from "./core/mcp-server.js";
import { PluginRegistry } from "./core/plugin-registry.js";
import { CommandRouter } from "./core/command-router.js";

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

// ============================================================
// Initialize
// ============================================================

const registry = new PluginRegistry();
const router = new CommandRouter(registry);

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
];

plugins.forEach((plugin) => {
  // Auto-configure from environment variables
  plugin.loadFromEnv();
  registry.register(plugin);
});

// ============================================================
// MCP Server
// ============================================================

const server = new MCPServer({
  name: "mother-mcp",
  version: "1.0.0",
});

server.onListTools(() => router.getAllTools());

server.onCallTool(async (name, args) => {
  try {
    const result = await router.execute(name, args);
    return {
      content: [{
        type: "text",
        text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

server.start();

const configured = plugins.filter(p => p.isConfigured()).length;
console.error(`🚀 Mother MCP running | ${plugins.length} platforms | ${router.getAllTools().length} tools | ${configured} connected`);

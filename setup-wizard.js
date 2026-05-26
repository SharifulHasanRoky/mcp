#!/usr/bin/env node

/**
 * 🚀 Mother MCP - Interactive Setup Wizard
 * 
 * Run: node setup-wizard.js
 * 
 * Guides you through setting up API keys for each platform
 * one by one. Saves everything to .env automatically.
 */

import { createInterface } from "readline";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = join(__dirname, ".env");

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

// Platform definitions
const PLATFORMS = [
  {
    id: "facebook_ads",
    name: "📢 Facebook (Meta) Ads",
    url: "https://developers.facebook.com",
    keys: [
      { env: "FB_ADS_ACCESS_TOKEN", label: "Access Token", required: true },
      { env: "FB_ADS_ACCOUNT_ID", label: "Ad Account ID (act_XXX)", required: true },
    ],
  },
  {
    id: "google_ads",
    name: "📢 Google Ads",
    url: "https://developers.google.com/google-ads/api",
    keys: [
      { env: "GOOGLE_ADS_DEVELOPER_TOKEN", label: "Developer Token", required: true },
      { env: "GOOGLE_ADS_CLIENT_ID", label: "OAuth Client ID", required: true },
      { env: "GOOGLE_ADS_CLIENT_SECRET", label: "OAuth Client Secret", required: true },
      { env: "GOOGLE_ADS_REFRESH_TOKEN", label: "Refresh Token", required: true },
      { env: "GOOGLE_ADS_CUSTOMER_ID", label: "Customer ID (XXX-XXX-XXXX)", required: true },
    ],
  },
  {
    id: "tiktok_ads",
    name: "📢 TikTok Ads",
    url: "https://business-api.tiktok.com/portal/",
    keys: [
      { env: "TIKTOK_ADS_ACCESS_TOKEN", label: "Access Token", required: true },
      { env: "TIKTOK_ADS_ADVERTISER_ID", label: "Advertiser ID", required: true },
    ],
  },
  {
    id: "pinterest_ads",
    name: "📢 Pinterest Ads",
    url: "https://developers.pinterest.com/",
    keys: [
      { env: "PINTEREST_ADS_ACCESS_TOKEN", label: "Access Token", required: true },
      { env: "PINTEREST_ADS_ACCOUNT_ID", label: "Ad Account ID", required: true },
    ],
  },
  {
    id: "linkedin_ads",
    name: "📢 LinkedIn Ads",
    url: "https://www.linkedin.com/developers/",
    keys: [
      { env: "LINKEDIN_ADS_ACCESS_TOKEN", label: "Access Token", required: true },
      { env: "LINKEDIN_ADS_ACCOUNT_ID", label: "Ad Account ID", required: true },
    ],
  },
  {
    id: "x_ads",
    name: "📢 X (Twitter) Ads",
    url: "https://developer.x.com",
    keys: [
      { env: "X_ADS_API_KEY", label: "API Key", required: true },
      { env: "X_ADS_API_SECRET", label: "API Secret", required: true },
      { env: "X_ADS_ACCESS_TOKEN", label: "Access Token", required: true },
      { env: "X_ADS_ACCESS_TOKEN_SECRET", label: "Access Token Secret", required: true },
      { env: "X_ADS_ACCOUNT_ID", label: "Ad Account ID", required: true },
    ],
  },
  {
    id: "ga4",
    name: "📊 Google Analytics 4",
    url: "https://console.cloud.google.com",
    keys: [
      { env: "GA4_ACCESS_TOKEN", label: "Access Token", required: true },
      { env: "GA4_PROPERTY_ID", label: "Property ID", required: true },
    ],
  },
  {
    id: "tag_manager",
    name: "📊 Google Tag Manager",
    url: "https://tagmanager.google.com",
    keys: [
      { env: "GTM_ACCESS_TOKEN", label: "Access Token", required: true },
      { env: "GTM_ACCOUNT_ID", label: "Account ID", required: true },
      { env: "GTM_CONTAINER_ID", label: "Container ID", required: true },
    ],
  },
  {
    id: "looker_studio",
    name: "📊 Looker Studio",
    url: "https://console.cloud.google.com",
    keys: [
      { env: "LOOKER_ACCESS_TOKEN", label: "Access Token", required: true },
    ],
  },
  {
    id: "clickup",
    name: "📋 ClickUp",
    url: "https://app.clickup.com → Settings → Apps",
    keys: [
      { env: "CLICKUP_API_TOKEN", label: "API Token", required: true },
      { env: "CLICKUP_TEAM_ID", label: "Team/Workspace ID", required: true },
    ],
  },
  {
    id: "notion",
    name: "📋 Notion",
    url: "https://www.notion.so/my-integrations",
    keys: [
      { env: "NOTION_API_KEY", label: "Integration Token", required: true },
    ],
  },
  {
    id: "google_docs",
    name: "📋 Google Docs",
    url: "https://console.cloud.google.com",
    keys: [
      { env: "GOOGLE_DOCS_ACCESS_TOKEN", label: "Access Token", required: true },
    ],
  },
  {
    id: "google_sheets",
    name: "📋 Google Sheets",
    url: "https://console.cloud.google.com",
    keys: [
      { env: "GOOGLE_SHEETS_ACCESS_TOKEN", label: "Access Token", required: true },
    ],
  },
  {
    id: "ai_tools",
    name: "🤖 AI Tools (at least one)",
    url: "platform.openai.com / console.anthropic.com",
    keys: [
      { env: "OPENAI_API_KEY", label: "OpenAI API Key", required: false },
      { env: "ANTHROPIC_API_KEY", label: "Anthropic (Claude) API Key", required: false },
      { env: "GEMINI_API_KEY", label: "Google Gemini API Key", required: false },
      { env: "STABILITY_API_KEY", label: "Stability AI API Key", required: false },
    ],
  },
];

// Read existing .env
function loadExistingEnv() {
  if (!existsSync(ENV_FILE)) return {};
  const content = readFileSync(ENV_FILE, "utf-8");
  const vars = {};
  content.split("\n").forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;
    const eq = line.indexOf("=");
    if (eq === -1) return;
    const key = line.substring(0, eq).trim();
    const val = line.substring(eq + 1).trim();
    if (val) vars[key] = val;
  });
  return vars;
}

// Save to .env
function saveEnv(vars) {
  // Read template
  let content = "";
  if (existsSync(join(__dirname, ".env.example"))) {
    content = readFileSync(join(__dirname, ".env.example"), "utf-8");
  }

  // Replace values in template
  Object.entries(vars).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (content.match(regex)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  });

  writeFileSync(ENV_FILE, content);
}

// Main wizard
async function main() {
  console.log("");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       🚀 MOTHER MCP - Interactive Setup Wizard          ║");
  console.log("║                                                          ║");
  console.log("║  শুধু যেগুলো ব্যবহার করবে সেগুলোর key দাও।              ║");
  console.log("║  বাকিগুলো skip করতে Enter চাপো।                         ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");

  const existingVars = loadExistingEnv();
  const newVars = { ...existingVars };
  let configuredCount = 0;

  for (const platform of PLATFORMS) {
    console.log(`\n─────────────────────────────────────────`);
    console.log(`${platform.name}`);
    console.log(`Get credentials: ${platform.url}`);
    console.log(`─────────────────────────────────────────`);

    const setupThis = await ask(`  Setup this platform? (y/n/skip) [n]: `);
    
    if (setupThis.toLowerCase() !== "y") {
      console.log(`  ⏭️  Skipped`);
      continue;
    }

    let allFilled = true;
    for (const key of platform.keys) {
      const existing = existingVars[key.env];
      const hint = existing ? ` [current: ${existing.substring(0, 8)}...]` : "";
      const value = await ask(`  ${key.label}${hint}: `);
      
      if (value.trim()) {
        newVars[key.env] = value.trim();
      } else if (existing) {
        newVars[key.env] = existing;
      } else if (key.required) {
        allFilled = false;
      }
    }

    if (allFilled) {
      configuredCount++;
      console.log(`  ✅ ${platform.name} configured!`);
    } else {
      console.log(`  ⚠️  Some required keys missing, but saved what you provided.`);
    }
  }

  // Save everything
  saveEnv(newVars);
  
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`\n🎉 Done! ${configuredCount} platform(s) configured.`);
  console.log(`\n📁 Saved to: ${ENV_FILE}`);
  console.log(`\n🚀 Next: Restart Claude Desktop / Cursor and try "mother_status"`);
  console.log("");

  rl.close();
}

main().catch((err) => {
  console.error("Error:", err.message);
  rl.close();
  process.exit(1);
});

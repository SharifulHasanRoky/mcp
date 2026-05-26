/**
 * Environment Loader - Reads .env file and auto-configures plugins
 * 
 * No external dependencies needed. Reads .env file,
 * parses it, and maps env vars to plugin credentials automatically.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "../..");

/**
 * Parse a .env file into key-value pairs
 */
function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const content = readFileSync(filePath, "utf-8");
  const vars = {};

  content.split("\n").forEach((line) => {
    // Skip empty lines and comments
    line = line.trim();
    if (!line || line.startsWith("#")) return;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) return;

    const key = line.substring(0, eqIndex).trim();
    let value = line.substring(eqIndex + 1).trim();

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (value) vars[key] = value;
  });

  return vars;
}

/**
 * Mapping: env variable prefixes → plugin ID and credential keys
 */
const ENV_MAPPING = {
  facebook_ads: {
    FB_ADS_ACCESS_TOKEN: "access_token",
    FB_ADS_ACCOUNT_ID: "ad_account_id",
    FB_ADS_APP_ID: "app_id",
    FB_ADS_APP_SECRET: "app_secret",
  },
  google_ads: {
    GOOGLE_ADS_DEVELOPER_TOKEN: "developer_token",
    GOOGLE_ADS_CLIENT_ID: "client_id",
    GOOGLE_ADS_CLIENT_SECRET: "client_secret",
    GOOGLE_ADS_REFRESH_TOKEN: "refresh_token",
    GOOGLE_ADS_CUSTOMER_ID: "customer_id",
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: "login_customer_id",
  },
  tiktok_ads: {
    TIKTOK_ADS_ACCESS_TOKEN: "access_token",
    TIKTOK_ADS_ADVERTISER_ID: "advertiser_id",
    TIKTOK_ADS_APP_ID: "app_id",
    TIKTOK_ADS_SECRET: "secret",
  },
  pinterest_ads: {
    PINTEREST_ADS_ACCESS_TOKEN: "access_token",
    PINTEREST_ADS_ACCOUNT_ID: "ad_account_id",
  },
  linkedin_ads: {
    LINKEDIN_ADS_ACCESS_TOKEN: "access_token",
    LINKEDIN_ADS_ACCOUNT_ID: "ad_account_id",
  },
  x_ads: {
    X_ADS_API_KEY: "api_key",
    X_ADS_API_SECRET: "api_secret",
    X_ADS_ACCESS_TOKEN: "access_token",
    X_ADS_ACCESS_TOKEN_SECRET: "access_token_secret",
    X_ADS_ACCOUNT_ID: "ad_account_id",
  },
  ga4: {
    GA4_ACCESS_TOKEN: "access_token",
    GA4_PROPERTY_ID: "property_id",
  },
  tag_manager: {
    GTM_ACCESS_TOKEN: "access_token",
    GTM_ACCOUNT_ID: "account_id",
    GTM_CONTAINER_ID: "container_id",
  },
  looker_studio: {
    LOOKER_ACCESS_TOKEN: "access_token",
  },
  clickup: {
    CLICKUP_API_TOKEN: "api_token",
    CLICKUP_TEAM_ID: "team_id",
  },
  notion: {
    NOTION_API_KEY: "api_key",
  },
  google_docs: {
    GOOGLE_DOCS_ACCESS_TOKEN: "access_token",
  },
  google_sheets: {
    GOOGLE_SHEETS_ACCESS_TOKEN: "access_token",
  },
  ai_tools: {
    OPENAI_API_KEY: "openai_api_key",
    ANTHROPIC_API_KEY: "anthropic_api_key",
    GEMINI_API_KEY: "gemini_api_key",
    STABILITY_API_KEY: "stability_api_key",
  },
};

/**
 * Load .env and auto-configure all plugins that have credentials
 */
export function loadEnvAndConfigure(registry) {
  // Determine .env file path
  const envPath = process.env.MOTHER_MCP_ENV_FILE || join(PROJECT_ROOT, ".env");
  
  // Parse env file
  const envVars = parseEnvFile(envPath);
  
  // Also include process.env (system env vars override .env file)
  const allVars = { ...envVars };
  Object.keys(ENV_MAPPING).forEach((pluginId) => {
    Object.keys(ENV_MAPPING[pluginId]).forEach((envKey) => {
      if (process.env[envKey]) allVars[envKey] = process.env[envKey];
    });
  });

  let configured = 0;

  // Map env vars to plugin credentials
  Object.entries(ENV_MAPPING).forEach(([pluginId, mapping]) => {
    const creds = {};
    let hasAnyCred = false;

    Object.entries(mapping).forEach(([envKey, credKey]) => {
      if (allVars[envKey]) {
        creds[credKey] = allVars[envKey];
        hasAnyCred = true;
      }
    });

    if (hasAnyCred) {
      const plugin = registry.getPlugin(pluginId);
      if (plugin) {
        plugin.setCredentials(creds);
        configured++;
        console.error(`   🔑 ${plugin.name} - auto-configured from .env`);
      }
    }
  });

  return configured;
}

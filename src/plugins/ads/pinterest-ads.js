import { BasePlugin } from "../../core/base-plugin.js";

const API = "https://api.pinterest.com/v5";

export class PinterestAdsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "pinterest_ads",
      name: "Pinterest Ads",
      category: "ads",
      description: "Manage Pinterest ad campaigns, promoted pins, and analytics.",
    });
  }

  getEnvMapping() {
    return [
      { envKey: "PINTEREST_ACCESS_TOKEN", credKey: "access_token" },
      { envKey: "PINTEREST_AD_ACCOUNT_ID", credKey: "ad_account_id" },
    ];
  }

  getTools() {
    return [
      {
        name: "pinterest_ads_list_campaigns",
        description: "List Pinterest ad campaigns.",
        inputSchema: { type: "object", properties: { status: { type: "string", enum: ["ACTIVE", "PAUSED", "ARCHIVED"] } } },
      },
      {
        name: "pinterest_ads_create_campaign",
        description: "Create a new Pinterest ad campaign.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            objective: { type: "string", enum: ["AWARENESS", "CONSIDERATION", "VIDEO_VIEW", "CONVERSIONS", "CATALOG_SALES"] },
            daily_spend_cap: { type: "number" },
          },
          required: ["name", "objective"],
        },
      },
      {
        name: "pinterest_ads_get_analytics",
        description: "Get Pinterest analytics: impressions, pin clicks, saves, conversions.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string" },
            date_range: { type: "string", enum: ["last_7d", "last_30d", "last_90d"] },
          },
        },
      },
    ];
  }

  async execute(toolName, args) {
    const acct = this.credentials.ad_account_id;
    switch (toolName) {
      case "pinterest_ads_list_campaigns":
        return this.apiRequest(`${API}/ad_accounts/${acct}/campaigns`);
      case "pinterest_ads_create_campaign":
        return this.apiRequest(`${API}/ad_accounts/${acct}/campaigns`, { method: "POST", body: JSON.stringify({ name: args.name, objective_type: args.objective, daily_spend_cap: args.daily_spend_cap, status: "PAUSED" }) });
      case "pinterest_ads_get_analytics":
        return this.apiRequest(`${API}/ad_accounts/${acct}/analytics?start_date=2024-01-01&end_date=2024-12-31&granularity=TOTAL&columns=IMPRESSION,CLICK,SPEND,PIN_CLICK,SAVE`);
      default: throw new Error(`Unknown: ${toolName}`);
    }
  }
}

import { BasePlugin } from "../../core/base-plugin.js";

const API = "https://business-api.tiktok.com/open_api/v1.3";

export class TikTokAdsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "tiktok_ads",
      name: "TikTok Ads",
      category: "ads",
      description: "Manage TikTok ad campaigns, audiences, creatives, and performance.",
    });
  }

  getEnvMapping() {
    return [
      { envKey: "TIKTOK_ACCESS_TOKEN", credKey: "access_token" },
      { envKey: "TIKTOK_ADVERTISER_ID", credKey: "advertiser_id" },
    ];
  }

  getAuthHeaders() {
    return { "Access-Token": this.credentials.access_token };
  }

  getTools() {
    return [
      {
        name: "tiktok_ads_list_campaigns",
        description: "List TikTok ad campaigns.",
        inputSchema: { type: "object", properties: { status: { type: "string", enum: ["ACTIVE", "PAUSED", "DELETE"] } } },
      },
      {
        name: "tiktok_ads_create_campaign",
        description: "Create a new TikTok ad campaign.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            objective: { type: "string", enum: ["TRAFFIC", "CONVERSIONS", "APP_INSTALL", "REACH", "VIDEO_VIEWS", "LEAD_GENERATION"] },
            budget: { type: "number", description: "Daily budget in dollars" },
          },
          required: ["name", "objective"],
        },
      },
      {
        name: "tiktok_ads_get_performance",
        description: "Get performance: impressions, clicks, conversions, CTR, CPM, CPC.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string" },
            date_range: { type: "string", enum: ["today", "yesterday", "last_7d", "last_30d"] },
          },
        },
      },
      {
        name: "tiktok_ads_manage_audience",
        description: "Create or list custom audiences.",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["create", "list"] },
            name: { type: "string" },
            type: { type: "string", enum: ["CUSTOMER_FILE", "ENGAGEMENT", "LOOKALIKE"] },
          },
          required: ["action"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const advId = this.credentials.advertiser_id;
    switch (toolName) {
      case "tiktok_ads_list_campaigns":
        return this.apiRequest(`${API}/campaign/get/?advertiser_id=${advId}&page_size=50`);
      case "tiktok_ads_create_campaign":
        return this.apiRequest(`${API}/campaign/create/`, {
          method: "POST",
          body: JSON.stringify({ advertiser_id: advId, campaign_name: args.name, objective_type: args.objective, budget: args.budget, budget_mode: "BUDGET_MODE_DAY" }),
        });
      case "tiktok_ads_get_performance":
        return this.apiRequest(`${API}/report/integrated/get/`, {
          method: "POST",
          body: JSON.stringify({ advertiser_id: advId, report_type: "BASIC", data_level: "AUCTION_CAMPAIGN", dimensions: ["campaign_id"], metrics: ["impressions", "clicks", "spend", "ctr", "cpc", "conversions"] }),
        });
      case "tiktok_ads_manage_audience":
        if (args.action === "list") return this.apiRequest(`${API}/dmp/custom_audience/list/?advertiser_id=${advId}`);
        return this.apiRequest(`${API}/dmp/custom_audience/create/`, { method: "POST", body: JSON.stringify({ advertiser_id: advId, custom_audience_name: args.name, audience_type: args.type || "CUSTOMER_FILE" }) });
      default: throw new Error(`Unknown: ${toolName}`);
    }
  }
}

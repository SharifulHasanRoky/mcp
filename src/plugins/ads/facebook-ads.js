import { BasePlugin } from "../../core/base-plugin.js";

const API = "https://graph.facebook.com/v19.0";

export class FacebookAdsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "facebook_ads",
      name: "Facebook (Meta) Ads",
      category: "ads",
      description: "Manage Facebook & Instagram ad campaigns, audiences, creatives, and reporting.",
    });
  }

  getEnvMapping() {
    return [
      { envKey: "FB_ACCESS_TOKEN", credKey: "access_token" },
      { envKey: "FB_AD_ACCOUNT_ID", credKey: "ad_account_id" },
    ];
  }

  getTools() {
    return [
      {
        name: "fb_ads_list_campaigns",
        description: "List all Facebook ad campaigns with status and budget.",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ACTIVE", "PAUSED", "ARCHIVED"], description: "Filter by status" },
            limit: { type: "number", description: "Max results" },
          },
        },
      },
      {
        name: "fb_ads_create_campaign",
        description: "Create a new Facebook/Instagram ad campaign.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Campaign name" },
            objective: { type: "string", enum: ["AWARENESS", "TRAFFIC", "ENGAGEMENT", "LEADS", "APP_PROMOTION", "SALES"], description: "Objective" },
            daily_budget: { type: "number", description: "Daily budget in cents" },
            status: { type: "string", enum: ["ACTIVE", "PAUSED"] },
          },
          required: ["name", "objective"],
        },
      },
      {
        name: "fb_ads_get_performance",
        description: "Get campaign performance: impressions, clicks, spend, CTR, CPC, ROAS.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID (optional, all if empty)" },
            date_range: { type: "string", enum: ["today", "yesterday", "last_7d", "last_30d", "this_month"] },
            level: { type: "string", enum: ["campaign", "adset", "ad"] },
          },
        },
      },
      {
        name: "fb_ads_update_campaign",
        description: "Update campaign status, budget, or name.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID" },
            status: { type: "string", enum: ["ACTIVE", "PAUSED"] },
            daily_budget: { type: "number" },
            name: { type: "string" },
          },
          required: ["campaign_id"],
        },
      },
      {
        name: "fb_ads_create_audience",
        description: "Create custom or lookalike audience.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Audience name" },
            type: { type: "string", enum: ["custom", "lookalike"] },
            source: { type: "string", description: "Source for lookalike" },
            country: { type: "string" },
          },
          required: ["name", "type"],
        },
      },
      {
        name: "fb_ads_insights_breakdown",
        description: "Breakdown by age, gender, placement, device, country.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string" },
            breakdown: { type: "string", enum: ["age", "gender", "placement", "device", "country"] },
            date_range: { type: "string", enum: ["last_7d", "last_30d"] },
          },
          required: ["campaign_id"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const acct = this.credentials.ad_account_id;
    switch (toolName) {
      case "fb_ads_list_campaigns": {
        const params = new URLSearchParams({ fields: "id,name,status,objective,daily_budget,lifetime_budget", limit: args.limit || 25 });
        if (args.status) params.append("filtering", JSON.stringify([{ field: "status", operator: "EQUAL", value: args.status }]));
        return this.apiRequest(`${API}/${acct}/campaigns?${params}`);
      }
      case "fb_ads_create_campaign":
        return this.apiRequest(`${API}/${acct}/campaigns`, {
          method: "POST",
          body: JSON.stringify({ name: args.name, objective: args.objective, status: args.status || "PAUSED", daily_budget: args.daily_budget, special_ad_categories: [] }),
        });
      case "fb_ads_get_performance": {
        const params = new URLSearchParams({ fields: "campaign_name,impressions,clicks,spend,ctr,cpc,actions", level: args.level || "campaign", date_preset: args.date_range || "last_7d" });
        const endpoint = args.campaign_id ? `${API}/${args.campaign_id}/insights?${params}` : `${API}/${acct}/insights?${params}`;
        return this.apiRequest(endpoint);
      }
      case "fb_ads_update_campaign": {
        const body = {};
        if (args.status) body.status = args.status;
        if (args.daily_budget) body.daily_budget = args.daily_budget;
        if (args.name) body.name = args.name;
        return this.apiRequest(`${API}/${args.campaign_id}`, { method: "POST", body: JSON.stringify(body) });
      }
      case "fb_ads_create_audience":
        return this.apiRequest(`${API}/${acct}/customaudiences`, {
          method: "POST",
          body: JSON.stringify({ name: args.name, subtype: args.type === "lookalike" ? "LOOKALIKE" : "CUSTOM" }),
        });
      case "fb_ads_insights_breakdown":
        return this.apiRequest(`${API}/${args.campaign_id}/insights?fields=impressions,clicks,spend,ctr,cpc&breakdowns=${args.breakdown}&date_preset=${args.date_range || "last_7d"}`);
      default:
        throw new Error(`Unknown: ${toolName}`);
    }
  }
}

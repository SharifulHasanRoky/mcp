/**
 * Facebook (Meta) Ads Plugin
 * 
 * Connects to Meta Marketing API for managing Facebook & Instagram ads.
 * Supports campaign management, ad sets, creatives, and reporting.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const META_API_BASE = "https://graph.facebook.com/v19.0";

export class FacebookAdsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "facebook_ads",
      name: "Facebook (Meta) Ads",
      category: "ads",
      description: "Manage Facebook & Instagram ad campaigns, audiences, creatives, and performance reporting via Meta Marketing API.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "access_token", description: "Meta Marketing API access token", required: true },
      { key: "ad_account_id", description: "Ad account ID (act_XXXXXXX)", required: true },
      { key: "app_id", description: "Meta App ID", required: false },
      { key: "app_secret", description: "Meta App Secret", required: false },
    ];
  }

  getSetupInstructions() {
    return `1. Go to https://developers.facebook.com
2. Create or select your app
3. Add "Marketing API" product
4. Generate a User Access Token with ads_management permission
5. Find your Ad Account ID in Meta Business Suite → Settings`;
  }

  getTools() {
    return [
      {
        name: "fb_ads_list_campaigns",
        description: "List all ad campaigns in your Facebook Ads account with their status and budget.",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"],
              description: "Filter by campaign status",
            },
            limit: { type: "number", description: "Number of results (default 25)" },
          },
        },
      },
      {
        name: "fb_ads_create_campaign",
        description: "Create a new Facebook ad campaign with objective, budget, and targeting.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Campaign name" },
            objective: {
              type: "string",
              enum: ["AWARENESS", "TRAFFIC", "ENGAGEMENT", "LEADS", "APP_PROMOTION", "SALES"],
              description: "Campaign objective",
            },
            daily_budget: { type: "number", description: "Daily budget in cents (e.g., 5000 = $50)" },
            status: {
              type: "string",
              enum: ["ACTIVE", "PAUSED"],
              description: "Initial status (default PAUSED)",
            },
          },
          required: ["name", "objective"],
        },
      },
      {
        name: "fb_ads_get_performance",
        description: "Get performance metrics for campaigns, ad sets, or ads (impressions, clicks, spend, CTR, CPC, ROAS).",
        inputSchema: {
          type: "object",
          properties: {
            level: {
              type: "string",
              enum: ["campaign", "adset", "ad"],
              description: "Reporting level",
            },
            date_range: {
              type: "string",
              enum: ["today", "yesterday", "last_7d", "last_30d", "this_month"],
              description: "Date range for report",
            },
            campaign_id: { type: "string", description: "Specific campaign ID (optional)" },
          },
        },
      },
      {
        name: "fb_ads_update_campaign",
        description: "Update an existing campaign (name, budget, status, schedule).",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID to update" },
            name: { type: "string", description: "New campaign name" },
            status: { type: "string", enum: ["ACTIVE", "PAUSED"] },
            daily_budget: { type: "number", description: "New daily budget in cents" },
          },
          required: ["campaign_id"],
        },
      },
      {
        name: "fb_ads_create_audience",
        description: "Create a custom or lookalike audience for targeting.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Audience name" },
            type: { type: "string", enum: ["custom", "lookalike"], description: "Audience type" },
            source: { type: "string", description: "Source audience or pixel ID for lookalike" },
            country: { type: "string", description: "Country code for lookalike (e.g., US)" },
            ratio: { type: "number", description: "Lookalike ratio 0.01-0.20" },
          },
          required: ["name", "type"],
        },
      },
      {
        name: "fb_ads_get_insights",
        description: "Get detailed analytics breakdown by age, gender, placement, device, or country.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID" },
            breakdown: {
              type: "string",
              enum: ["age", "gender", "placement", "device", "country"],
              description: "Breakdown dimension",
            },
            date_range: { type: "string", enum: ["last_7d", "last_30d", "this_month"] },
          },
          required: ["campaign_id"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const accountId = this.credentials.ad_account_id;

    switch (toolName) {
      case "fb_ads_list_campaigns":
        return this.listCampaigns(accountId, args);
      case "fb_ads_create_campaign":
        return this.createCampaign(accountId, args);
      case "fb_ads_get_performance":
        return this.getPerformance(accountId, args);
      case "fb_ads_update_campaign":
        return this.updateCampaign(args);
      case "fb_ads_create_audience":
        return this.createAudience(accountId, args);
      case "fb_ads_get_insights":
        return this.getInsights(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async listCampaigns(accountId, args) {
    const params = new URLSearchParams({
      fields: "id,name,status,objective,daily_budget,lifetime_budget,created_time",
      limit: args.limit || 25,
    });
    if (args.status) params.append("filtering", JSON.stringify([{ field: "status", operator: "EQUAL", value: args.status }]));

    return this.apiRequest(`${META_API_BASE}/${accountId}/campaigns?${params}`);
  }

  async createCampaign(accountId, args) {
    const body = {
      name: args.name,
      objective: args.objective,
      status: args.status || "PAUSED",
      special_ad_categories: [],
    };
    if (args.daily_budget) body.daily_budget = args.daily_budget;

    return this.apiRequest(`${META_API_BASE}/${accountId}/campaigns`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getPerformance(accountId, args) {
    const datePresets = {
      today: "today",
      yesterday: "yesterday",
      last_7d: "last_7d",
      last_30d: "last_30d",
      this_month: "this_month",
    };

    const params = new URLSearchParams({
      fields: "campaign_name,impressions,clicks,spend,ctr,cpc,actions,cost_per_action_type",
      level: args.level || "campaign",
      date_preset: datePresets[args.date_range] || "last_7d",
    });

    const endpoint = args.campaign_id
      ? `${META_API_BASE}/${args.campaign_id}/insights?${params}`
      : `${META_API_BASE}/${accountId}/insights?${params}`;

    return this.apiRequest(endpoint);
  }

  async updateCampaign(args) {
    const body = {};
    if (args.name) body.name = args.name;
    if (args.status) body.status = args.status;
    if (args.daily_budget) body.daily_budget = args.daily_budget;

    return this.apiRequest(`${META_API_BASE}/${args.campaign_id}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async createAudience(accountId, args) {
    const body = {
      name: args.name,
      subtype: args.type === "lookalike" ? "LOOKALIKE" : "CUSTOM",
    };
    if (args.type === "lookalike") {
      body.origin_audience_id = args.source;
      body.lookalike_spec = JSON.stringify({
        country: args.country || "US",
        ratio: args.ratio || 0.01,
      });
    }

    return this.apiRequest(`${META_API_BASE}/${accountId}/customaudiences`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getInsights(args) {
    const params = new URLSearchParams({
      fields: "impressions,clicks,spend,ctr,cpc,actions",
      breakdowns: args.breakdown || "age",
      date_preset: args.date_range || "last_7d",
    });

    return this.apiRequest(`${META_API_BASE}/${args.campaign_id}/insights?${params}`);
  }
}

/**
 * TikTok Ads Plugin
 * 
 * Connects to TikTok Marketing API for managing ad campaigns,
 * audiences, creatives, and performance on TikTok.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const TIKTOK_API = "https://business-api.tiktok.com/open_api/v1.3";

export class TikTokAdsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "tiktok_ads",
      name: "TikTok Ads",
      category: "ads",
      description: "Manage TikTok ad campaigns, audiences, creatives, and performance reporting via TikTok Marketing API.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "access_token", description: "TikTok Marketing API access token", required: true },
      { key: "advertiser_id", description: "TikTok Advertiser ID", required: true },
      { key: "app_id", description: "TikTok App ID", required: false },
      { key: "secret", description: "TikTok App Secret", required: false },
    ];
  }

  getSetupInstructions() {
    return `1. Go to https://business-api.tiktok.com/portal/
2. Create a developer app
3. Get your advertiser_id from TikTok Ads Manager
4. Generate access token via OAuth or sandbox`;
  }

  getTools() {
    return [
      {
        name: "tiktok_ads_list_campaigns",
        description: "List all TikTok ad campaigns with budget, status, and objective.",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ACTIVE", "PAUSED", "DELETE"], description: "Filter by status" },
            objective: { type: "string", enum: ["TRAFFIC", "CONVERSIONS", "APP_INSTALL", "REACH", "VIDEO_VIEWS"], description: "Filter by objective" },
          },
        },
      },
      {
        name: "tiktok_ads_create_campaign",
        description: "Create a new TikTok ad campaign.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Campaign name" },
            objective: { type: "string", enum: ["TRAFFIC", "CONVERSIONS", "APP_INSTALL", "REACH", "VIDEO_VIEWS", "LEAD_GENERATION"], description: "Campaign objective" },
            budget: { type: "number", description: "Daily budget in dollars" },
            budget_mode: { type: "string", enum: ["BUDGET_MODE_DAY", "BUDGET_MODE_TOTAL"], description: "Budget type" },
          },
          required: ["name", "objective"],
        },
      },
      {
        name: "tiktok_ads_get_performance",
        description: "Get TikTok campaign performance: impressions, clicks, conversions, CTR, CPM, CPC.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID (optional)" },
            date_range: { type: "string", enum: ["today", "yesterday", "last_7d", "last_30d"], description: "Date range" },
            metrics: {
              type: "array",
              items: { type: "string" },
              description: "Metrics: impressions, clicks, spend, conversions, ctr, cpc, cpm",
            },
          },
        },
      },
      {
        name: "tiktok_ads_manage_audience",
        description: "Create or manage custom audiences for TikTok ads targeting.",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["create", "list", "delete"], description: "Action" },
            name: { type: "string", description: "Audience name (for create)" },
            type: { type: "string", enum: ["CUSTOMER_FILE", "ENGAGEMENT", "APP_ACTIVITY", "LOOKALIKE"], description: "Audience type" },
          },
          required: ["action"],
        },
      },
      {
        name: "tiktok_ads_creative_report",
        description: "Get creative-level performance to see which videos/images perform best.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID" },
            date_range: { type: "string", enum: ["last_7d", "last_30d"] },
            sort_by: { type: "string", enum: ["impressions", "clicks", "conversions", "ctr"], description: "Sort metric" },
          },
        },
      },
    ];
  }

  async execute(toolName, args) {
    const advertiserId = this.credentials.advertiser_id;

    switch (toolName) {
      case "tiktok_ads_list_campaigns":
        return this.listCampaigns(advertiserId, args);
      case "tiktok_ads_create_campaign":
        return this.createCampaign(advertiserId, args);
      case "tiktok_ads_get_performance":
        return this.getPerformance(advertiserId, args);
      case "tiktok_ads_manage_audience":
        return this.manageAudience(advertiserId, args);
      case "tiktok_ads_creative_report":
        return this.creativeReport(advertiserId, args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  getAuthHeaders() {
    return { "Access-Token": this.credentials.access_token };
  }

  async listCampaigns(advertiserId, args) {
    const params = { advertiser_id: advertiserId, page_size: 50 };
    if (args.status) params.filtering = JSON.stringify({ status: args.status });
    if (args.objective) params.filtering = JSON.stringify({ objective_type: args.objective });

    const query = new URLSearchParams(params);
    return this.apiRequest(`${TIKTOK_API}/campaign/get/?${query}`);
  }

  async createCampaign(advertiserId, args) {
    return this.apiRequest(`${TIKTOK_API}/campaign/create/`, {
      method: "POST",
      body: JSON.stringify({
        advertiser_id: advertiserId,
        campaign_name: args.name,
        objective_type: args.objective,
        budget: args.budget,
        budget_mode: args.budget_mode || "BUDGET_MODE_DAY",
      }),
    });
  }

  async getPerformance(advertiserId, args) {
    const metrics = args.metrics || ["impressions", "clicks", "spend", "ctr", "cpc", "conversions"];
    return this.apiRequest(`${TIKTOK_API}/report/integrated/get/`, {
      method: "POST",
      body: JSON.stringify({
        advertiser_id: advertiserId,
        report_type: "BASIC",
        data_level: "AUCTION_CAMPAIGN",
        dimensions: ["campaign_id"],
        metrics,
        filters: args.campaign_id ? [{ field_name: "campaign_id", filter_type: "IN", filter_value: [args.campaign_id] }] : [],
      }),
    });
  }

  async manageAudience(advertiserId, args) {
    if (args.action === "list") {
      return this.apiRequest(`${TIKTOK_API}/dmp/custom_audience/list/?advertiser_id=${advertiserId}`);
    }
    if (args.action === "create") {
      return this.apiRequest(`${TIKTOK_API}/dmp/custom_audience/create/`, {
        method: "POST",
        body: JSON.stringify({
          advertiser_id: advertiserId,
          custom_audience_name: args.name,
          audience_type: args.type || "CUSTOMER_FILE",
        }),
      });
    }
  }

  async creativeReport(advertiserId, args) {
    return this.apiRequest(`${TIKTOK_API}/report/integrated/get/`, {
      method: "POST",
      body: JSON.stringify({
        advertiser_id: advertiserId,
        report_type: "BASIC",
        data_level: "AUCTION_AD",
        dimensions: ["ad_id", "creative_id"],
        metrics: ["impressions", "clicks", "spend", "ctr", "conversions"],
        filters: args.campaign_id ? [{ field_name: "campaign_id", filter_type: "IN", filter_value: [args.campaign_id] }] : [],
      }),
    });
  }
}

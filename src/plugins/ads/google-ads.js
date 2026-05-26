/**
 * Google Ads Plugin
 * 
 * Connects to Google Ads API for managing search, display, video,
 * and shopping campaigns with full reporting.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const GOOGLE_ADS_API = "https://googleads.googleapis.com/v16";

export class GoogleAdsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "google_ads",
      name: "Google Ads",
      category: "ads",
      description: "Manage Google Ads campaigns (Search, Display, Video, Shopping), keywords, bidding, and performance reporting.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "developer_token", description: "Google Ads API developer token", required: true },
      { key: "client_id", description: "OAuth2 Client ID", required: true },
      { key: "client_secret", description: "OAuth2 Client Secret", required: true },
      { key: "refresh_token", description: "OAuth2 Refresh Token", required: true },
      { key: "customer_id", description: "Google Ads Customer ID (XXX-XXX-XXXX)", required: true },
      { key: "login_customer_id", description: "Manager account ID (if using MCC)", required: false },
    ];
  }

  getSetupInstructions() {
    return `1. Go to https://ads.google.com/home/tools/manager-accounts/
2. Apply for API access at https://developers.google.com/google-ads/api/docs/get-started
3. Create OAuth2 credentials in Google Cloud Console
4. Generate refresh token using OAuth2 playground
5. Get your Customer ID from Google Ads dashboard`;
  }

  getTools() {
    return [
      {
        name: "google_ads_list_campaigns",
        description: "List all Google Ads campaigns with status, type, budget, and performance summary.",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ENABLED", "PAUSED", "REMOVED"], description: "Filter by status" },
            type: { type: "string", enum: ["SEARCH", "DISPLAY", "VIDEO", "SHOPPING", "PERFORMANCE_MAX"], description: "Filter by campaign type" },
          },
        },
      },
      {
        name: "google_ads_create_campaign",
        description: "Create a new Google Ads campaign (Search, Display, Video, Shopping, or Performance Max).",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Campaign name" },
            type: { type: "string", enum: ["SEARCH", "DISPLAY", "VIDEO", "SHOPPING", "PERFORMANCE_MAX"], description: "Campaign type" },
            budget_amount: { type: "number", description: "Daily budget in micros (1000000 = $1)" },
            bidding_strategy: { type: "string", enum: ["MAXIMIZE_CLICKS", "MAXIMIZE_CONVERSIONS", "TARGET_CPA", "TARGET_ROAS", "MANUAL_CPC"], description: "Bidding strategy" },
            target_cpa: { type: "number", description: "Target CPA in micros (for TARGET_CPA strategy)" },
            target_roas: { type: "number", description: "Target ROAS percentage (for TARGET_ROAS strategy)" },
          },
          required: ["name", "type", "budget_amount"],
        },
      },
      {
        name: "google_ads_get_performance",
        description: "Get campaign performance metrics: impressions, clicks, conversions, cost, CTR, CPC, ROAS.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID (optional, all if omitted)" },
            date_range: { type: "string", enum: ["TODAY", "YESTERDAY", "LAST_7_DAYS", "LAST_30_DAYS", "THIS_MONTH", "LAST_MONTH"], description: "Date range" },
            metrics: {
              type: "array",
              items: { type: "string" },
              description: "Specific metrics to fetch",
            },
          },
        },
      },
      {
        name: "google_ads_manage_keywords",
        description: "Add, pause, or remove keywords from ad groups.",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["add", "pause", "remove", "list"], description: "Action to perform" },
            ad_group_id: { type: "string", description: "Ad Group ID" },
            keywords: {
              type: "array",
              items: { type: "string" },
              description: "Keywords to add/modify",
            },
            match_type: { type: "string", enum: ["BROAD", "PHRASE", "EXACT"], description: "Keyword match type" },
          },
          required: ["action", "ad_group_id"],
        },
      },
      {
        name: "google_ads_get_recommendations",
        description: "Get Google's optimization recommendations and scores.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID (optional)" },
            type: { type: "string", enum: ["KEYWORD", "BID", "BUDGET", "AD", "ALL"], description: "Recommendation type" },
          },
        },
      },
      {
        name: "google_ads_search_terms_report",
        description: "Get search terms report showing what users searched to trigger your ads.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID" },
            ad_group_id: { type: "string", description: "Ad Group ID (optional)" },
            date_range: { type: "string", enum: ["LAST_7_DAYS", "LAST_30_DAYS", "THIS_MONTH"] },
            min_impressions: { type: "number", description: "Minimum impressions filter" },
          },
          required: ["campaign_id"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const customerId = this.credentials.customer_id.replace(/-/g, "");

    switch (toolName) {
      case "google_ads_list_campaigns":
        return this.listCampaigns(customerId, args);
      case "google_ads_create_campaign":
        return this.createCampaign(customerId, args);
      case "google_ads_get_performance":
        return this.getPerformance(customerId, args);
      case "google_ads_manage_keywords":
        return this.manageKeywords(customerId, args);
      case "google_ads_get_recommendations":
        return this.getRecommendations(customerId, args);
      case "google_ads_search_terms_report":
        return this.getSearchTerms(customerId, args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.credentials.access_token}`,
      "developer-token": this.credentials.developer_token,
      ...(this.credentials.login_customer_id && {
        "login-customer-id": this.credentials.login_customer_id.replace(/-/g, ""),
      }),
    };
  }

  async listCampaigns(customerId, args) {
    let query = `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, 
      campaign_budget.amount_micros, metrics.impressions, metrics.clicks, metrics.cost_micros 
      FROM campaign WHERE campaign.status != 'REMOVED'`;

    if (args.status) query += ` AND campaign.status = '${args.status}'`;
    if (args.type) query += ` AND campaign.advertising_channel_type = '${args.type}'`;

    return this.apiRequest(`${GOOGLE_ADS_API}/customers/${customerId}/googleAds:searchStream`, {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  }

  async createCampaign(customerId, args) {
    const operations = [{
      create: {
        name: args.name,
        advertisingChannelType: args.type,
        status: "PAUSED",
        campaignBudget: { amountMicros: args.budget_amount },
        biddingStrategyType: args.bidding_strategy || "MAXIMIZE_CLICKS",
      },
    }];

    return this.apiRequest(`${GOOGLE_ADS_API}/customers/${customerId}/campaigns:mutate`, {
      method: "POST",
      body: JSON.stringify({ operations }),
    });
  }

  async getPerformance(customerId, args) {
    const dateRange = args.date_range || "LAST_7_DAYS";
    let query = `SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, 
      metrics.conversions, metrics.cost_micros, metrics.ctr, metrics.average_cpc,
      metrics.conversions_value FROM campaign WHERE segments.date DURING ${dateRange}`;

    if (args.campaign_id) query += ` AND campaign.id = ${args.campaign_id}`;

    return this.apiRequest(`${GOOGLE_ADS_API}/customers/${customerId}/googleAds:searchStream`, {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  }

  async manageKeywords(customerId, args) {
    if (args.action === "list") {
      const query = `SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
        ad_group_criterion.status, metrics.impressions, metrics.clicks
        FROM keyword_view WHERE ad_group.id = ${args.ad_group_id}`;
      return this.apiRequest(`${GOOGLE_ADS_API}/customers/${customerId}/googleAds:searchStream`, {
        method: "POST",
        body: JSON.stringify({ query }),
      });
    }

    const operations = (args.keywords || []).map((keyword) => ({
      create: {
        adGroup: `customers/${customerId}/adGroups/${args.ad_group_id}`,
        keyword: { text: keyword, matchType: args.match_type || "BROAD" },
        status: args.action === "pause" ? "PAUSED" : "ENABLED",
      },
    }));

    return this.apiRequest(`${GOOGLE_ADS_API}/customers/${customerId}/adGroupCriteria:mutate`, {
      method: "POST",
      body: JSON.stringify({ operations }),
    });
  }

  async getRecommendations(customerId, args) {
    let query = `SELECT recommendation.type, recommendation.impact, recommendation.campaign 
      FROM recommendation`;
    if (args.type && args.type !== "ALL") query += ` WHERE recommendation.type = '${args.type}'`;

    return this.apiRequest(`${GOOGLE_ADS_API}/customers/${customerId}/googleAds:searchStream`, {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  }

  async getSearchTerms(customerId, args) {
    let query = `SELECT search_term_view.search_term, metrics.impressions, metrics.clicks, 
      metrics.cost_micros, metrics.conversions FROM search_term_view 
      WHERE campaign.id = ${args.campaign_id} AND segments.date DURING ${args.date_range || "LAST_7_DAYS"}`;

    if (args.ad_group_id) query += ` AND ad_group.id = ${args.ad_group_id}`;
    if (args.min_impressions) query += ` AND metrics.impressions > ${args.min_impressions}`;

    return this.apiRequest(`${GOOGLE_ADS_API}/customers/${customerId}/googleAds:searchStream`, {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  }
}

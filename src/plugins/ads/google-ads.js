import { BasePlugin } from "../../core/base-plugin.js";

const API = "https://googleads.googleapis.com/v16";

export class GoogleAdsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "google_ads",
      name: "Google Ads",
      category: "ads",
      description: "Manage Google Ads campaigns (Search, Display, Video, Shopping, PMax), keywords, bidding, and reporting.",
    });
  }

  getEnvMapping() {
    return [
      { envKey: "GOOGLE_ADS_TOKEN", credKey: "access_token" },
      { envKey: "GOOGLE_ADS_DEVELOPER_TOKEN", credKey: "developer_token" },
      { envKey: "GOOGLE_ADS_CUSTOMER_ID", credKey: "customer_id" },
    ];
  }

  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.credentials.access_token}`,
      "developer-token": this.credentials.developer_token,
    };
  }

  getTools() {
    return [
      {
        name: "google_ads_list_campaigns",
        description: "List all Google Ads campaigns with status, type, and budget.",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ENABLED", "PAUSED", "REMOVED"] },
            type: { type: "string", enum: ["SEARCH", "DISPLAY", "VIDEO", "SHOPPING", "PERFORMANCE_MAX"] },
          },
        },
      },
      {
        name: "google_ads_create_campaign",
        description: "Create a new Google Ads campaign.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string", enum: ["SEARCH", "DISPLAY", "VIDEO", "SHOPPING", "PERFORMANCE_MAX"] },
            budget_amount: { type: "number", description: "Daily budget in micros (1000000=$1)" },
            bidding_strategy: { type: "string", enum: ["MAXIMIZE_CLICKS", "MAXIMIZE_CONVERSIONS", "TARGET_CPA", "TARGET_ROAS", "MANUAL_CPC"] },
          },
          required: ["name", "type", "budget_amount"],
        },
      },
      {
        name: "google_ads_get_performance",
        description: "Get performance: impressions, clicks, conversions, cost, CTR, CPC, ROAS.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string" },
            date_range: { type: "string", enum: ["TODAY", "YESTERDAY", "LAST_7_DAYS", "LAST_30_DAYS", "THIS_MONTH"] },
          },
        },
      },
      {
        name: "google_ads_manage_keywords",
        description: "Add, pause, or list keywords in an ad group.",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["add", "pause", "remove", "list"] },
            ad_group_id: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            match_type: { type: "string", enum: ["BROAD", "PHRASE", "EXACT"] },
          },
          required: ["action", "ad_group_id"],
        },
      },
      {
        name: "google_ads_search_terms",
        description: "See what people actually searched to trigger your ads.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string" },
            date_range: { type: "string", enum: ["LAST_7_DAYS", "LAST_30_DAYS"] },
          },
          required: ["campaign_id"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const cid = this.credentials.customer_id.replace(/-/g, "");
    switch (toolName) {
      case "google_ads_list_campaigns": {
        let q = `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign_budget.amount_micros, metrics.impressions, metrics.clicks, metrics.cost_micros FROM campaign WHERE campaign.status != 'REMOVED'`;
        if (args.status) q += ` AND campaign.status = '${args.status}'`;
        if (args.type) q += ` AND campaign.advertising_channel_type = '${args.type}'`;
        return this.apiRequest(`${API}/customers/${cid}/googleAds:searchStream`, { method: "POST", body: JSON.stringify({ query: q }) });
      }
      case "google_ads_create_campaign":
        return this.apiRequest(`${API}/customers/${cid}/campaigns:mutate`, {
          method: "POST",
          body: JSON.stringify({ operations: [{ create: { name: args.name, advertisingChannelType: args.type, status: "PAUSED", biddingStrategyType: args.bidding_strategy || "MAXIMIZE_CLICKS" } }] }),
        });
      case "google_ads_get_performance": {
        let q = `SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.conversions, metrics.cost_micros, metrics.ctr, metrics.average_cpc FROM campaign WHERE segments.date DURING ${args.date_range || "LAST_7_DAYS"}`;
        if (args.campaign_id) q += ` AND campaign.id = ${args.campaign_id}`;
        return this.apiRequest(`${API}/customers/${cid}/googleAds:searchStream`, { method: "POST", body: JSON.stringify({ query: q }) });
      }
      case "google_ads_manage_keywords": {
        if (args.action === "list") {
          const q = `SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, metrics.impressions, metrics.clicks FROM keyword_view WHERE ad_group.id = ${args.ad_group_id}`;
          return this.apiRequest(`${API}/customers/${cid}/googleAds:searchStream`, { method: "POST", body: JSON.stringify({ query: q }) });
        }
        const ops = (args.keywords || []).map(kw => ({ create: { adGroup: `customers/${cid}/adGroups/${args.ad_group_id}`, keyword: { text: kw, matchType: args.match_type || "BROAD" } } }));
        return this.apiRequest(`${API}/customers/${cid}/adGroupCriteria:mutate`, { method: "POST", body: JSON.stringify({ operations: ops }) });
      }
      case "google_ads_search_terms": {
        const q = `SELECT search_term_view.search_term, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM search_term_view WHERE campaign.id = ${args.campaign_id} AND segments.date DURING ${args.date_range || "LAST_7_DAYS"}`;
        return this.apiRequest(`${API}/customers/${cid}/googleAds:searchStream`, { method: "POST", body: JSON.stringify({ query: q }) });
      }
      default: throw new Error(`Unknown: ${toolName}`);
    }
  }
}

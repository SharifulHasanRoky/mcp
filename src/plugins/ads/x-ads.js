/**
 * X (Twitter) Ads Plugin
 * 
 * Connects to X Ads API for managing promoted tweets,
 * campaigns, audiences, and performance analytics.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const X_ADS_API = "https://ads-api.x.com/12";

export class XAdsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "x_ads",
      name: "X (Twitter) Ads",
      category: "ads",
      description: "Manage X/Twitter ad campaigns, promoted tweets, audiences, and analytics via X Ads API.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "api_key", description: "X API Key (Consumer Key)", required: true },
      { key: "api_secret", description: "X API Secret (Consumer Secret)", required: true },
      { key: "access_token", description: "OAuth Access Token", required: true },
      { key: "access_token_secret", description: "OAuth Access Token Secret", required: true },
      { key: "ad_account_id", description: "X Ads Account ID", required: true },
    ];
  }

  getSetupInstructions() {
    return `1. Go to https://developer.x.com/en/portal/dashboard
2. Apply for Ads API access
3. Create an app with OAuth 1.0a
4. Get API Key, Secret, Access Token, and Access Token Secret
5. Get Ad Account ID from ads.x.com`;
  }

  getTools() {
    return [
      {
        name: "x_ads_list_campaigns",
        description: "List all X/Twitter ad campaigns.",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ACTIVE", "PAUSED", "DRAFT"], description: "Filter by status" },
          },
        },
      },
      {
        name: "x_ads_create_campaign",
        description: "Create a new X/Twitter ad campaign.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Campaign name" },
            objective: {
              type: "string",
              enum: ["AWARENESS", "TWEET_ENGAGEMENTS", "VIDEO_VIEWS", "WEBSITE_CLICKS", "APP_INSTALLS", "FOLLOWERS", "REACH"],
              description: "Campaign objective",
            },
            daily_budget: { type: "number", description: "Daily budget in micros (1000000 = $1)" },
            total_budget: { type: "number", description: "Total budget in micros" },
          },
          required: ["name", "objective"],
        },
      },
      {
        name: "x_ads_get_analytics",
        description: "Get X ads performance: impressions, engagements, link clicks, follows, video views.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID" },
            date_range: { type: "string", enum: ["last_7d", "last_30d"] },
            granularity: { type: "string", enum: ["DAY", "TOTAL"], description: "Time granularity" },
            metrics: {
              type: "array",
              items: { type: "string" },
              description: "Metrics: impressions, engagements, clicks, follows, video_views",
            },
          },
        },
      },
      {
        name: "x_ads_promote_tweet",
        description: "Promote an existing tweet as a promoted ad.",
        inputSchema: {
          type: "object",
          properties: {
            tweet_id: { type: "string", description: "Tweet ID to promote" },
            line_item_id: { type: "string", description: "Line item (ad group) ID" },
          },
          required: ["tweet_id", "line_item_id"],
        },
      },
      {
        name: "x_ads_manage_audience",
        description: "Create or manage tailored audiences for targeting.",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["list", "create", "delete"], description: "Action" },
            name: { type: "string", description: "Audience name" },
            type: { type: "string", enum: ["TAILORED_LISTS", "TAILORED_WEB", "FLEXIBLE", "LOOKALIKE"] },
          },
          required: ["action"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const accountId = this.credentials.ad_account_id;
    switch (toolName) {
      case "x_ads_list_campaigns":
        return this.apiRequest(`${X_ADS_API}/accounts/${accountId}/campaigns`);
      case "x_ads_create_campaign":
        return this.apiRequest(`${X_ADS_API}/accounts/${accountId}/campaigns`, {
          method: "POST",
          body: JSON.stringify({
            name: args.name,
            funding_instrument_id: "auto",
            objective: args.objective,
            daily_budget_amount_local_micro: args.daily_budget,
            total_budget_amount_local_micro: args.total_budget,
            status: "PAUSED",
          }),
        });
      case "x_ads_get_analytics":
        return this.apiRequest(
          `${X_ADS_API}/stats/accounts/${accountId}?entity=CAMPAIGN&entity_ids=${args.campaign_id || ""}&granularity=${args.granularity || "TOTAL"}&metric_groups=ENGAGEMENT,BILLING`
        );
      case "x_ads_promote_tweet":
        return this.apiRequest(`${X_ADS_API}/accounts/${accountId}/promoted_tweets`, {
          method: "POST",
          body: JSON.stringify({ line_item_id: args.line_item_id, tweet_ids: [args.tweet_id] }),
        });
      case "x_ads_manage_audience":
        if (args.action === "list") {
          return this.apiRequest(`${X_ADS_API}/accounts/${accountId}/tailored_audiences`);
        }
        if (args.action === "create") {
          return this.apiRequest(`${X_ADS_API}/accounts/${accountId}/tailored_audiences`, {
            method: "POST",
            body: JSON.stringify({ name: args.name, list_type: args.type || "TAILORED_LISTS" }),
          });
        }
        break;
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

import { BasePlugin } from "../../core/base-plugin.js";

const API = "https://ads-api.x.com/12";

export class XAdsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "x_ads",
      name: "X (Twitter) Ads",
      category: "ads",
      description: "Manage X/Twitter ad campaigns, promoted tweets, audiences, and analytics.",
    });
  }

  getEnvMapping() {
    return [
      { envKey: "X_ACCESS_TOKEN", credKey: "access_token" },
      { envKey: "X_AD_ACCOUNT_ID", credKey: "ad_account_id" },
    ];
  }

  getTools() {
    return [
      {
        name: "x_ads_list_campaigns",
        description: "List X/Twitter ad campaigns.",
        inputSchema: { type: "object", properties: { status: { type: "string", enum: ["ACTIVE", "PAUSED", "DRAFT"] } } },
      },
      {
        name: "x_ads_create_campaign",
        description: "Create a new X ad campaign.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            objective: { type: "string", enum: ["AWARENESS", "TWEET_ENGAGEMENTS", "VIDEO_VIEWS", "WEBSITE_CLICKS", "APP_INSTALLS", "FOLLOWERS", "REACH"] },
            daily_budget: { type: "number", description: "Daily budget in micros" },
          },
          required: ["name", "objective"],
        },
      },
      {
        name: "x_ads_get_analytics",
        description: "Get X ads analytics: impressions, engagements, clicks, follows, video views.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string" },
            granularity: { type: "string", enum: ["DAY", "TOTAL"] },
          },
        },
      },
      {
        name: "x_ads_promote_tweet",
        description: "Promote an existing tweet as an ad.",
        inputSchema: {
          type: "object",
          properties: {
            tweet_id: { type: "string" },
            line_item_id: { type: "string" },
          },
          required: ["tweet_id", "line_item_id"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const acct = this.credentials.ad_account_id;
    switch (toolName) {
      case "x_ads_list_campaigns":
        return this.apiRequest(`${API}/accounts/${acct}/campaigns`);
      case "x_ads_create_campaign":
        return this.apiRequest(`${API}/accounts/${acct}/campaigns`, { method: "POST", body: JSON.stringify({ name: args.name, objective: args.objective, daily_budget_amount_local_micro: args.daily_budget, status: "PAUSED" }) });
      case "x_ads_get_analytics":
        return this.apiRequest(`${API}/stats/accounts/${acct}?entity=CAMPAIGN&entity_ids=${args.campaign_id || ""}&granularity=${args.granularity || "TOTAL"}&metric_groups=ENGAGEMENT,BILLING`);
      case "x_ads_promote_tweet":
        return this.apiRequest(`${API}/accounts/${acct}/promoted_tweets`, { method: "POST", body: JSON.stringify({ line_item_id: args.line_item_id, tweet_ids: [args.tweet_id] }) });
      default: throw new Error(`Unknown: ${toolName}`);
    }
  }
}

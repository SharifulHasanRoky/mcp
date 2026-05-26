/**
 * Pinterest Ads Plugin
 * 
 * Connects to Pinterest Marketing API for managing
 * pins, ad campaigns, audiences, and analytics.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const PINTEREST_API = "https://api.pinterest.com/v5";

export class PinterestAdsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "pinterest_ads",
      name: "Pinterest Ads",
      category: "ads",
      description: "Manage Pinterest ad campaigns, promoted pins, audiences, and conversion tracking via Pinterest Marketing API.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "access_token", description: "Pinterest API access token", required: true },
      { key: "ad_account_id", description: "Pinterest Ad Account ID", required: true },
    ];
  }

  getSetupInstructions() {
    return `1. Go to https://developers.pinterest.com/
2. Create an app and get API access
3. Generate access token with ads:read and ads:write scopes
4. Get Ad Account ID from Pinterest Ads Manager`;
  }

  getTools() {
    return [
      {
        name: "pinterest_ads_list_campaigns",
        description: "List all Pinterest ad campaigns.",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ACTIVE", "PAUSED", "ARCHIVED"], description: "Filter by status" },
          },
        },
      },
      {
        name: "pinterest_ads_create_campaign",
        description: "Create a new Pinterest ad campaign.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Campaign name" },
            objective: {
              type: "string",
              enum: ["AWARENESS", "CONSIDERATION", "VIDEO_VIEW", "CONVERSIONS", "CATALOG_SALES"],
              description: "Campaign objective",
            },
            daily_spend_cap: { type: "number", description: "Daily spend cap in micros" },
            status: { type: "string", enum: ["ACTIVE", "PAUSED"] },
          },
          required: ["name", "objective"],
        },
      },
      {
        name: "pinterest_ads_get_analytics",
        description: "Get Pinterest ads analytics: impressions, engagements, pin clicks, saves, conversions.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID" },
            date_range: { type: "string", enum: ["last_7d", "last_30d", "last_90d"] },
            granularity: { type: "string", enum: ["DAY", "WEEK", "MONTH", "TOTAL"] },
          },
        },
      },
      {
        name: "pinterest_ads_manage_pins",
        description: "Create, update, or list promoted pins.",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["list", "create", "update"], description: "Action" },
            pin_id: { type: "string", description: "Pin ID for update" },
            title: { type: "string", description: "Pin title" },
            description: { type: "string", description: "Pin description" },
            link: { type: "string", description: "Destination URL" },
          },
          required: ["action"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const accountId = this.credentials.ad_account_id;
    switch (toolName) {
      case "pinterest_ads_list_campaigns":
        return this.apiRequest(`${PINTEREST_API}/ad_accounts/${accountId}/campaigns`);
      case "pinterest_ads_create_campaign":
        return this.apiRequest(`${PINTEREST_API}/ad_accounts/${accountId}/campaigns`, {
          method: "POST",
          body: JSON.stringify({
            name: args.name,
            objective_type: args.objective,
            daily_spend_cap: args.daily_spend_cap,
            status: args.status || "PAUSED",
          }),
        });
      case "pinterest_ads_get_analytics":
        return this.apiRequest(
          `${PINTEREST_API}/ad_accounts/${accountId}/analytics?start_date=2024-01-01&end_date=2024-12-31&granularity=${args.granularity || "TOTAL"}&columns=IMPRESSION,CLICK,SPEND,PIN_CLICK,SAVE`
        );
      case "pinterest_ads_manage_pins":
        if (args.action === "list") {
          return this.apiRequest(`${PINTEREST_API}/ad_accounts/${accountId}/ads`);
        }
        return this.apiRequest(`${PINTEREST_API}/pins`, {
          method: "POST",
          body: JSON.stringify({ title: args.title, description: args.description, link: args.link }),
        });
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

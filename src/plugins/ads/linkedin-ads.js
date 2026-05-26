import { BasePlugin } from "../../core/base-plugin.js";

const API = "https://api.linkedin.com/rest";

export class LinkedInAdsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "linkedin_ads",
      name: "LinkedIn Ads",
      category: "ads",
      description: "Manage LinkedIn B2B ad campaigns, targeting, lead gen, and analytics.",
    });
  }

  getEnvMapping() {
    return [
      { envKey: "LINKEDIN_ACCESS_TOKEN", credKey: "access_token" },
      { envKey: "LINKEDIN_AD_ACCOUNT_ID", credKey: "ad_account_id" },
    ];
  }

  getTools() {
    return [
      {
        name: "linkedin_ads_list_campaigns",
        description: "List LinkedIn ad campaigns.",
        inputSchema: { type: "object", properties: { status: { type: "string", enum: ["ACTIVE", "PAUSED", "ARCHIVED", "DRAFT"] } } },
      },
      {
        name: "linkedin_ads_create_campaign",
        description: "Create a LinkedIn ad campaign.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            objective: { type: "string", enum: ["BRAND_AWARENESS", "WEBSITE_VISITS", "ENGAGEMENT", "VIDEO_VIEWS", "LEAD_GENERATION", "WEBSITE_CONVERSIONS"] },
            daily_budget: { type: "number", description: "Budget in cents" },
            format: { type: "string", enum: ["SINGLE_IMAGE", "CAROUSEL", "VIDEO", "TEXT_AD", "MESSAGE_AD"] },
          },
          required: ["name", "objective"],
        },
      },
      {
        name: "linkedin_ads_get_analytics",
        description: "Get LinkedIn analytics: impressions, clicks, leads, engagement.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string" },
            date_range: { type: "string", enum: ["last_7d", "last_30d", "last_90d"] },
          },
        },
      },
      {
        name: "linkedin_ads_targeting",
        description: "Set targeting: job titles, industries, seniority, company size.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string" },
            job_titles: { type: "array", items: { type: "string" } },
            industries: { type: "array", items: { type: "string" } },
            seniority: { type: "array", items: { type: "string" } },
            locations: { type: "array", items: { type: "string" } },
          },
          required: ["campaign_id"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const acct = this.credentials.ad_account_id;
    const headers = { "LinkedIn-Version": "202401" };
    switch (toolName) {
      case "linkedin_ads_list_campaigns":
        return this.apiRequest(`${API}/adAccounts/${acct}/adCampaigns`, { headers });
      case "linkedin_ads_create_campaign":
        return this.apiRequest(`${API}/adAccounts/${acct}/adCampaigns`, { method: "POST", headers, body: JSON.stringify({ name: args.name, objectiveType: args.objective, type: "SPONSORED_UPDATES", dailyBudget: { amount: String(args.daily_budget || 5000), currencyCode: "USD" }, status: "PAUSED" }) });
      case "linkedin_ads_get_analytics":
        return this.apiRequest(`${API}/adAnalytics?q=analytics&pivot=CAMPAIGN&campaigns=urn:li:sponsoredCampaign:${args.campaign_id}`, { headers });
      case "linkedin_ads_targeting":
        return this.apiRequest(`${API}/adAccounts/${acct}/adCampaigns/${args.campaign_id}`, { method: "PATCH", headers, body: JSON.stringify({ targetingCriteria: { include: { and: this.buildFacets(args) } } }) });
      default: throw new Error(`Unknown: ${toolName}`);
    }
  }

  buildFacets(args) {
    const f = [];
    if (args.job_titles?.length) f.push({ or: { "urn:li:adTargetingFacet:titles": args.job_titles } });
    if (args.industries?.length) f.push({ or: { "urn:li:adTargetingFacet:industries": args.industries } });
    if (args.seniority?.length) f.push({ or: { "urn:li:adTargetingFacet:seniorities": args.seniority } });
    if (args.locations?.length) f.push({ or: { "urn:li:adTargetingFacet:locations": args.locations } });
    return f;
  }
}

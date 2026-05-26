/**
 * LinkedIn Ads Plugin
 * 
 * Connects to LinkedIn Marketing API for B2B ad campaigns,
 * sponsored content, lead gen forms, and audience targeting.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const LINKEDIN_API = "https://api.linkedin.com/rest";

export class LinkedInAdsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "linkedin_ads",
      name: "LinkedIn Ads",
      category: "ads",
      description: "Manage LinkedIn ad campaigns, sponsored content, lead gen forms, and B2B audience targeting via LinkedIn Marketing API.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "access_token", description: "LinkedIn OAuth2 access token", required: true },
      { key: "ad_account_id", description: "LinkedIn Ad Account ID (sponsoredAccount URN)", required: true },
    ];
  }

  getSetupInstructions() {
    return `1. Go to https://www.linkedin.com/developers/
2. Create an app with Marketing Developer Platform access
3. Request r_ads, w_ads, r_ads_reporting permissions
4. Generate OAuth2 access token
5. Get Ad Account ID from Campaign Manager`;
  }

  getTools() {
    return [
      {
        name: "linkedin_ads_list_campaigns",
        description: "List LinkedIn ad campaigns with status, format, and budget info.",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ACTIVE", "PAUSED", "ARCHIVED", "DRAFT"], description: "Filter by status" },
          },
        },
      },
      {
        name: "linkedin_ads_create_campaign",
        description: "Create a new LinkedIn ad campaign for B2B marketing.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Campaign name" },
            objective: {
              type: "string",
              enum: ["BRAND_AWARENESS", "WEBSITE_VISITS", "ENGAGEMENT", "VIDEO_VIEWS", "LEAD_GENERATION", "WEBSITE_CONVERSIONS", "JOB_APPLICANTS"],
              description: "Campaign objective",
            },
            format: {
              type: "string",
              enum: ["SINGLE_IMAGE", "CAROUSEL", "VIDEO", "TEXT_AD", "MESSAGE_AD", "CONVERSATION_AD"],
              description: "Ad format",
            },
            daily_budget: { type: "number", description: "Daily budget in cents" },
            bid_amount: { type: "number", description: "Bid amount in cents" },
          },
          required: ["name", "objective"],
        },
      },
      {
        name: "linkedin_ads_get_analytics",
        description: "Get LinkedIn campaign analytics: impressions, clicks, leads, engagement, social actions.",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID" },
            date_range: { type: "string", enum: ["last_7d", "last_30d", "last_90d"] },
            pivot: { type: "string", enum: ["CAMPAIGN", "CREATIVE", "COMPANY", "MEMBER_JOB_TITLE", "MEMBER_INDUSTRY"] },
          },
        },
      },
      {
        name: "linkedin_ads_targeting",
        description: "Set up audience targeting (job titles, industries, seniority, company size, skills).",
        inputSchema: {
          type: "object",
          properties: {
            campaign_id: { type: "string", description: "Campaign ID to update targeting" },
            job_titles: { type: "array", items: { type: "string" }, description: "Target job titles" },
            industries: { type: "array", items: { type: "string" }, description: "Target industries" },
            company_sizes: { type: "array", items: { type: "string" }, description: "Company size ranges" },
            seniority: { type: "array", items: { type: "string" }, description: "Seniority levels" },
            locations: { type: "array", items: { type: "string" }, description: "Geographic locations" },
          },
          required: ["campaign_id"],
        },
      },
      {
        name: "linkedin_ads_lead_gen",
        description: "Manage lead generation forms: create, list, or get lead data.",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["list_forms", "get_leads", "create_form"], description: "Action" },
            form_id: { type: "string", description: "Lead Gen Form ID" },
            form_name: { type: "string", description: "Form name (for create)" },
            fields: { type: "array", items: { type: "string" }, description: "Form fields" },
          },
          required: ["action"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const accountId = this.credentials.ad_account_id;
    switch (toolName) {
      case "linkedin_ads_list_campaigns":
        return this.apiRequest(`${LINKEDIN_API}/adAccounts/${accountId}/adCampaigns`, {
          headers: { "LinkedIn-Version": "202401" },
        });
      case "linkedin_ads_create_campaign":
        return this.apiRequest(`${LINKEDIN_API}/adAccounts/${accountId}/adCampaigns`, {
          method: "POST",
          headers: { "LinkedIn-Version": "202401" },
          body: JSON.stringify({
            name: args.name,
            objectiveType: args.objective,
            type: "SPONSORED_UPDATES",
            costType: "CPM",
            dailyBudget: { amount: String(args.daily_budget || 5000), currencyCode: "USD" },
            status: "PAUSED",
          }),
        });
      case "linkedin_ads_get_analytics":
        return this.apiRequest(
          `${LINKEDIN_API}/adAnalytics?q=analytics&pivot=${args.pivot || "CAMPAIGN"}&campaigns=urn:li:sponsoredCampaign:${args.campaign_id}`,
          { headers: { "LinkedIn-Version": "202401" } }
        );
      case "linkedin_ads_targeting":
        return this.apiRequest(`${LINKEDIN_API}/adAccounts/${accountId}/adCampaigns/${args.campaign_id}`, {
          method: "PATCH",
          headers: { "LinkedIn-Version": "202401" },
          body: JSON.stringify({
            targetingCriteria: {
              include: {
                and: this.buildTargetingFacets(args),
              },
            },
          }),
        });
      case "linkedin_ads_lead_gen":
        return this.handleLeadGen(accountId, args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  buildTargetingFacets(args) {
    const facets = [];
    if (args.job_titles?.length) facets.push({ or: { "urn:li:adTargetingFacet:titles": args.job_titles } });
    if (args.industries?.length) facets.push({ or: { "urn:li:adTargetingFacet:industries": args.industries } });
    if (args.seniority?.length) facets.push({ or: { "urn:li:adTargetingFacet:seniorities": args.seniority } });
    if (args.locations?.length) facets.push({ or: { "urn:li:adTargetingFacet:locations": args.locations } });
    return facets;
  }

  async handleLeadGen(accountId, args) {
    if (args.action === "list_forms") {
      return this.apiRequest(`${LINKEDIN_API}/adAccounts/${accountId}/adForms`, {
        headers: { "LinkedIn-Version": "202401" },
      });
    }
    if (args.action === "get_leads") {
      return this.apiRequest(`${LINKEDIN_API}/adForms/${args.form_id}/responses`, {
        headers: { "LinkedIn-Version": "202401" },
      });
    }
    return { message: "Lead gen form creation requires additional setup" };
  }
}

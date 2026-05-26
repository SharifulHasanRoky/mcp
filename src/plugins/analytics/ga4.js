/**
 * Google Analytics 4 (GA4) Plugin
 * 
 * Connects to GA4 Data API and Admin API for analytics reporting,
 * property management, and audience insights.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const GA4_DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const GA4_ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";

export class GA4Plugin extends BasePlugin {
  constructor() {
    super({
      id: "ga4",
      name: "Google Analytics 4",
      category: "analytics",
      description: "Pull GA4 reports, manage properties, track events, and analyze user behavior with Google Analytics 4 Data API.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "access_token", description: "Google OAuth2 access token", required: true },
      { key: "property_id", description: "GA4 Property ID (e.g., 123456789)", required: true },
    ];
  }

  getSetupInstructions() {
    return `1. Go to Google Cloud Console → Enable Analytics Data API
2. Create OAuth2 or service account credentials
3. Get Property ID from GA4 → Admin → Property Settings
4. Ensure analytics.readonly scope is granted`;
  }

  getTools() {
    return [
      {
        name: "ga4_get_report",
        description: "Run a GA4 analytics report with custom dimensions, metrics, and date ranges.",
        inputSchema: {
          type: "object",
          properties: {
            date_range: { type: "string", enum: ["today", "yesterday", "7daysAgo", "30daysAgo", "90daysAgo"], description: "Start date (relative)" },
            metrics: {
              type: "array",
              items: { type: "string" },
              description: "Metrics: sessions, activeUsers, newUsers, screenPageViews, conversions, totalRevenue, engagementRate, bounceRate",
            },
            dimensions: {
              type: "array",
              items: { type: "string" },
              description: "Dimensions: date, country, city, deviceCategory, sessionSource, sessionMedium, pagePath, landingPage",
            },
            limit: { type: "number", description: "Max rows (default 100)" },
            order_by: { type: "string", description: "Metric to sort by (descending)" },
          },
        },
      },
      {
        name: "ga4_realtime_report",
        description: "Get real-time analytics data: active users, pageviews, events happening right now.",
        inputSchema: {
          type: "object",
          properties: {
            metrics: {
              type: "array",
              items: { type: "string" },
              description: "Realtime metrics: activeUsers, screenPageViews, conversions, eventCount",
            },
            dimensions: {
              type: "array",
              items: { type: "string" },
              description: "Realtime dimensions: country, city, deviceCategory, unifiedScreenName",
            },
          },
        },
      },
      {
        name: "ga4_get_top_pages",
        description: "Get top performing pages by views, engagement, or conversions.",
        inputSchema: {
          type: "object",
          properties: {
            date_range: { type: "string", enum: ["7daysAgo", "30daysAgo", "90daysAgo"], description: "Date range start" },
            sort_by: { type: "string", enum: ["screenPageViews", "engagementRate", "conversions", "activeUsers"], description: "Sort metric" },
            limit: { type: "number", description: "Number of pages (default 20)" },
          },
        },
      },
      {
        name: "ga4_get_traffic_sources",
        description: "Analyze traffic sources: organic, paid, social, referral, direct with metrics.",
        inputSchema: {
          type: "object",
          properties: {
            date_range: { type: "string", enum: ["7daysAgo", "30daysAgo", "90daysAgo"] },
            group_by: {
              type: "string",
              enum: ["sessionDefaultChannelGroup", "sessionSource", "sessionMedium", "sessionSourceMedium"],
              description: "How to group traffic",
            },
          },
        },
      },
      {
        name: "ga4_get_conversions",
        description: "Get conversion events data with source attribution.",
        inputSchema: {
          type: "object",
          properties: {
            event_name: { type: "string", description: "Specific conversion event name (optional)" },
            date_range: { type: "string", enum: ["7daysAgo", "30daysAgo", "90daysAgo"] },
            breakdown: {
              type: "string",
              enum: ["sessionSource", "sessionMedium", "country", "deviceCategory"],
              description: "Breakdown dimension",
            },
          },
        },
      },
      {
        name: "ga4_get_user_demographics",
        description: "Get user demographics: country, age, gender, interests, device breakdown.",
        inputSchema: {
          type: "object",
          properties: {
            dimension: {
              type: "string",
              enum: ["country", "city", "userAgeBracket", "userGender", "deviceCategory", "operatingSystem", "browser"],
              description: "Demographic dimension",
            },
            date_range: { type: "string", enum: ["7daysAgo", "30daysAgo", "90daysAgo"] },
          },
        },
      },
      {
        name: "ga4_list_properties",
        description: "List all GA4 properties in your account.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ];
  }

  async execute(toolName, args) {
    const propertyId = this.credentials.property_id;

    switch (toolName) {
      case "ga4_get_report":
        return this.runReport(propertyId, args);
      case "ga4_realtime_report":
        return this.realtimeReport(propertyId, args);
      case "ga4_get_top_pages":
        return this.getTopPages(propertyId, args);
      case "ga4_get_traffic_sources":
        return this.getTrafficSources(propertyId, args);
      case "ga4_get_conversions":
        return this.getConversions(propertyId, args);
      case "ga4_get_user_demographics":
        return this.getUserDemographics(propertyId, args);
      case "ga4_list_properties":
        return this.apiRequest(`${GA4_ADMIN_API}/properties`);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async runReport(propertyId, args) {
    const body = {
      dateRanges: [{ startDate: args.date_range || "30daysAgo", endDate: "today" }],
      metrics: (args.metrics || ["sessions", "activeUsers", "screenPageViews"]).map((m) => ({ name: m })),
      dimensions: (args.dimensions || ["date"]).map((d) => ({ name: d })),
      limit: args.limit || 100,
    };
    if (args.order_by) {
      body.orderBys = [{ metric: { metricName: args.order_by }, desc: true }];
    }
    return this.apiRequest(`${GA4_DATA_API}/properties/${propertyId}:runReport`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async realtimeReport(propertyId, args) {
    return this.apiRequest(`${GA4_DATA_API}/properties/${propertyId}:runRealtimeReport`, {
      method: "POST",
      body: JSON.stringify({
        metrics: (args.metrics || ["activeUsers"]).map((m) => ({ name: m })),
        dimensions: (args.dimensions || ["country"]).map((d) => ({ name: d })),
      }),
    });
  }

  async getTopPages(propertyId, args) {
    return this.apiRequest(`${GA4_DATA_API}/properties/${propertyId}:runReport`, {
      method: "POST",
      body: JSON.stringify({
        dateRanges: [{ startDate: args.date_range || "30daysAgo", endDate: "today" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "engagementRate" }, { name: "averageSessionDuration" }],
        dimensions: [{ name: "pagePath" }],
        orderBys: [{ metric: { metricName: args.sort_by || "screenPageViews" }, desc: true }],
        limit: args.limit || 20,
      }),
    });
  }

  async getTrafficSources(propertyId, args) {
    return this.apiRequest(`${GA4_DATA_API}/properties/${propertyId}:runReport`, {
      method: "POST",
      body: JSON.stringify({
        dateRanges: [{ startDate: args.date_range || "30daysAgo", endDate: "today" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "conversions" }, { name: "engagementRate" }],
        dimensions: [{ name: args.group_by || "sessionDefaultChannelGroup" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
    });
  }

  async getConversions(propertyId, args) {
    const dimensions = [{ name: "eventName" }];
    if (args.breakdown) dimensions.push({ name: args.breakdown });

    return this.apiRequest(`${GA4_DATA_API}/properties/${propertyId}:runReport`, {
      method: "POST",
      body: JSON.stringify({
        dateRanges: [{ startDate: args.date_range || "30daysAgo", endDate: "today" }],
        metrics: [{ name: "conversions" }, { name: "totalRevenue" }],
        dimensions,
        dimensionFilter: args.event_name ? { filter: { fieldName: "eventName", stringFilter: { value: args.event_name } } } : undefined,
      }),
    });
  }

  async getUserDemographics(propertyId, args) {
    return this.apiRequest(`${GA4_DATA_API}/properties/${propertyId}:runReport`, {
      method: "POST",
      body: JSON.stringify({
        dateRanges: [{ startDate: args.date_range || "30daysAgo", endDate: "today" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "engagementRate" }],
        dimensions: [{ name: args.dimension || "country" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 25,
      }),
    });
  }
}

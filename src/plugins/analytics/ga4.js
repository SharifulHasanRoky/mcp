import { BasePlugin } from "../../core/base-plugin.js";

const API = "https://analyticsdata.googleapis.com/v1beta";

export class GA4Plugin extends BasePlugin {
  constructor() {
    super({
      id: "ga4",
      name: "Google Analytics 4",
      category: "analytics",
      description: "Pull GA4 reports, real-time data, traffic sources, and user analytics.",
    });
  }

  getEnvMapping() {
    return [
      { envKey: "GA4_ACCESS_TOKEN", credKey: "access_token" },
      { envKey: "GA4_PROPERTY_ID", credKey: "property_id" },
    ];
  }

  getTools() {
    return [
      {
        name: "ga4_get_report",
        description: "Run a GA4 report with metrics and dimensions.",
        inputSchema: {
          type: "object",
          properties: {
            metrics: { type: "array", items: { type: "string" }, description: "sessions, activeUsers, newUsers, screenPageViews, conversions, totalRevenue, bounceRate" },
            dimensions: { type: "array", items: { type: "string" }, description: "date, country, city, deviceCategory, sessionSource, pagePath" },
            date_range: { type: "string", enum: ["today", "yesterday", "7daysAgo", "30daysAgo", "90daysAgo"] },
            limit: { type: "number" },
          },
        },
      },
      {
        name: "ga4_realtime",
        description: "Get real-time active users and events happening now.",
        inputSchema: {
          type: "object",
          properties: {
            metrics: { type: "array", items: { type: "string" }, description: "activeUsers, screenPageViews, eventCount, conversions" },
            dimensions: { type: "array", items: { type: "string" }, description: "country, city, deviceCategory, unifiedScreenName" },
          },
        },
      },
      {
        name: "ga4_top_pages",
        description: "Get top performing pages.",
        inputSchema: {
          type: "object",
          properties: {
            date_range: { type: "string", enum: ["7daysAgo", "30daysAgo", "90daysAgo"] },
            sort_by: { type: "string", enum: ["screenPageViews", "engagementRate", "conversions", "activeUsers"] },
            limit: { type: "number" },
          },
        },
      },
      {
        name: "ga4_traffic_sources",
        description: "Analyze traffic by channel, source, or medium.",
        inputSchema: {
          type: "object",
          properties: {
            date_range: { type: "string", enum: ["7daysAgo", "30daysAgo", "90daysAgo"] },
            group_by: { type: "string", enum: ["sessionDefaultChannelGroup", "sessionSource", "sessionMedium", "sessionSourceMedium"] },
          },
        },
      },
      {
        name: "ga4_conversions",
        description: "Get conversion data with attribution.",
        inputSchema: {
          type: "object",
          properties: {
            event_name: { type: "string" },
            date_range: { type: "string", enum: ["7daysAgo", "30daysAgo", "90daysAgo"] },
          },
        },
      },
    ];
  }

  async execute(toolName, args) {
    const prop = this.credentials.property_id;
    switch (toolName) {
      case "ga4_get_report":
        return this.apiRequest(`${API}/properties/${prop}:runReport`, {
          method: "POST",
          body: JSON.stringify({
            dateRanges: [{ startDate: args.date_range || "30daysAgo", endDate: "today" }],
            metrics: (args.metrics || ["sessions", "activeUsers"]).map(m => ({ name: m })),
            dimensions: (args.dimensions || ["date"]).map(d => ({ name: d })),
            limit: args.limit || 100,
          }),
        });
      case "ga4_realtime":
        return this.apiRequest(`${API}/properties/${prop}:runRealtimeReport`, {
          method: "POST",
          body: JSON.stringify({
            metrics: (args.metrics || ["activeUsers"]).map(m => ({ name: m })),
            dimensions: (args.dimensions || ["country"]).map(d => ({ name: d })),
          }),
        });
      case "ga4_top_pages":
        return this.apiRequest(`${API}/properties/${prop}:runReport`, {
          method: "POST",
          body: JSON.stringify({
            dateRanges: [{ startDate: args.date_range || "30daysAgo", endDate: "today" }],
            metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "engagementRate" }],
            dimensions: [{ name: "pagePath" }],
            orderBys: [{ metric: { metricName: args.sort_by || "screenPageViews" }, desc: true }],
            limit: args.limit || 20,
          }),
        });
      case "ga4_traffic_sources":
        return this.apiRequest(`${API}/properties/${prop}:runReport`, {
          method: "POST",
          body: JSON.stringify({
            dateRanges: [{ startDate: args.date_range || "30daysAgo", endDate: "today" }],
            metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "conversions" }],
            dimensions: [{ name: args.group_by || "sessionDefaultChannelGroup" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          }),
        });
      case "ga4_conversions":
        return this.apiRequest(`${API}/properties/${prop}:runReport`, {
          method: "POST",
          body: JSON.stringify({
            dateRanges: [{ startDate: args.date_range || "30daysAgo", endDate: "today" }],
            metrics: [{ name: "conversions" }, { name: "totalRevenue" }],
            dimensions: [{ name: "eventName" }],
          }),
        });
      default: throw new Error(`Unknown: ${toolName}`);
    }
  }
}

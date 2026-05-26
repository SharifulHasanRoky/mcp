/**
 * Looker Studio Plugin
 * 
 * Connects to Looker Studio (formerly Google Data Studio) API
 * for managing reports, data sources, and embedded dashboards.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const LOOKER_API = "https://datastudio.googleapis.com/v1";

export class LookerStudioPlugin extends BasePlugin {
  constructor() {
    super({
      id: "looker_studio",
      name: "Looker Studio",
      category: "analytics",
      description: "Manage Looker Studio reports, data sources, permissions, and generate embeddable dashboard links.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "access_token", description: "Google OAuth2 access token", required: true },
    ];
  }

  getSetupInstructions() {
    return `1. Go to Google Cloud Console → Enable Looker Studio API
2. Create OAuth2 credentials with datastudio.readonly scope
3. Generate access token
4. Note: Some features require Looker Studio Pro`;
  }

  getTools() {
    return [
      {
        name: "looker_list_reports",
        description: "List all Looker Studio reports you have access to.",
        inputSchema: {
          type: "object",
          properties: {
            owned_by_me: { type: "boolean", description: "Only show reports owned by me" },
            search: { type: "string", description: "Search by report name" },
          },
        },
      },
      {
        name: "looker_get_report",
        description: "Get details of a specific Looker Studio report.",
        inputSchema: {
          type: "object",
          properties: {
            report_id: { type: "string", description: "Report ID" },
          },
          required: ["report_id"],
        },
      },
      {
        name: "looker_list_datasources",
        description: "List all data sources connected to your Looker Studio.",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", description: "Filter by connector type" },
          },
        },
      },
      {
        name: "looker_copy_report",
        description: "Create a copy of an existing report (useful for templates).",
        inputSchema: {
          type: "object",
          properties: {
            report_id: { type: "string", description: "Source report ID to copy" },
            new_name: { type: "string", description: "Name for the copied report" },
            datasource_mapping: {
              type: "object",
              description: "Map old datasource IDs to new ones",
            },
          },
          required: ["report_id", "new_name"],
        },
      },
      {
        name: "looker_share_report",
        description: "Manage sharing permissions for a report.",
        inputSchema: {
          type: "object",
          properties: {
            report_id: { type: "string", description: "Report ID" },
            email: { type: "string", description: "Email to share with" },
            role: { type: "string", enum: ["viewer", "editor"], description: "Permission level" },
            link_sharing: { type: "string", enum: ["off", "anyone_with_link", "domain"], description: "Link sharing setting" },
          },
          required: ["report_id"],
        },
      },
      {
        name: "looker_get_embed_url",
        description: "Generate an embed URL for a Looker Studio report or specific page.",
        inputSchema: {
          type: "object",
          properties: {
            report_id: { type: "string", description: "Report ID" },
            page_num: { type: "number", description: "Page number (default 1)" },
            params: { type: "object", description: "URL parameters for filtering" },
          },
          required: ["report_id"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    switch (toolName) {
      case "looker_list_reports":
        return this.listReports(args);
      case "looker_get_report":
        return this.apiRequest(`${LOOKER_API}/reports/${args.report_id}`);
      case "looker_list_datasources":
        return this.apiRequest(`${LOOKER_API}/dataSources`);
      case "looker_copy_report":
        return this.apiRequest(`${LOOKER_API}/reports/${args.report_id}:copy`, {
          method: "POST",
          body: JSON.stringify({
            name: args.new_name,
            dataSourceMappings: args.datasource_mapping || {},
          }),
        });
      case "looker_share_report":
        return this.shareReport(args);
      case "looker_get_embed_url":
        return this.getEmbedUrl(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async listReports(args) {
    let url = `${LOOKER_API}/reports`;
    const params = new URLSearchParams();
    if (args.owned_by_me) params.append("ownedByMe", "true");
    if (args.search) params.append("q", args.search);
    const query = params.toString();
    if (query) url += `?${query}`;
    return this.apiRequest(url);
  }

  async shareReport(args) {
    if (args.email) {
      return this.apiRequest(`${LOOKER_API}/reports/${args.report_id}/permissions`, {
        method: "POST",
        body: JSON.stringify({
          emailAddress: args.email,
          role: args.role || "viewer",
        }),
      });
    }
    if (args.link_sharing) {
      return this.apiRequest(`${LOOKER_API}/reports/${args.report_id}/sharing`, {
        method: "PATCH",
        body: JSON.stringify({ linkSharingSetting: args.link_sharing }),
      });
    }
    return { message: "Provide email or link_sharing option" };
  }

  getEmbedUrl(args) {
    const baseUrl = `https://lookerstudio.google.com/embed/reporting/${args.report_id}`;
    const page = args.page_num ? `/page/p${args.page_num}` : "";
    let paramStr = "";
    if (args.params) {
      paramStr = "?" + Object.entries(args.params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    }
    return {
      embed_url: `${baseUrl}${page}${paramStr}`,
      iframe: `<iframe width="800" height="600" src="${baseUrl}${page}${paramStr}" frameborder="0" allowfullscreen></iframe>`,
    };
  }
}

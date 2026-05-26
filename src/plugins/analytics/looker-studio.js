import { BasePlugin } from "../../core/base-plugin.js";

const API = "https://datastudio.googleapis.com/v1";

export class LookerStudioPlugin extends BasePlugin {
  constructor() {
    super({
      id: "looker_studio",
      name: "Looker Studio",
      category: "analytics",
      description: "Manage Looker Studio reports, data sources, and embed links.",
    });
  }

  getEnvMapping() {
    return [
      { envKey: "LOOKER_ACCESS_TOKEN", credKey: "access_token" },
    ];
  }

  getTools() {
    return [
      { name: "looker_list_reports", description: "List all Looker Studio reports.", inputSchema: { type: "object", properties: { search: { type: "string" } } } },
      { name: "looker_get_report", description: "Get report details.", inputSchema: { type: "object", properties: { report_id: { type: "string" } }, required: ["report_id"] } },
      {
        name: "looker_get_embed_url",
        description: "Get embed URL for a report.",
        inputSchema: { type: "object", properties: { report_id: { type: "string" }, page_num: { type: "number" } }, required: ["report_id"] },
      },
      {
        name: "looker_share_report",
        description: "Share a report with someone.",
        inputSchema: {
          type: "object",
          properties: {
            report_id: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["viewer", "editor"] },
          },
          required: ["report_id", "email"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    switch (toolName) {
      case "looker_list_reports": {
        let url = `${API}/reports`;
        if (args.search) url += `?q=${encodeURIComponent(args.search)}`;
        return this.apiRequest(url);
      }
      case "looker_get_report":
        return this.apiRequest(`${API}/reports/${args.report_id}`);
      case "looker_get_embed_url": {
        const page = args.page_num ? `/page/p${args.page_num}` : "";
        return { embed_url: `https://lookerstudio.google.com/embed/reporting/${args.report_id}${page}` };
      }
      case "looker_share_report":
        return this.apiRequest(`${API}/reports/${args.report_id}/permissions`, {
          method: "POST",
          body: JSON.stringify({ emailAddress: args.email, role: args.role || "viewer" }),
        });
      default: throw new Error(`Unknown: ${toolName}`);
    }
  }
}

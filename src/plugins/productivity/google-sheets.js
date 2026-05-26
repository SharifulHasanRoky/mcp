import { BasePlugin } from "../../core/base-plugin.js";

const API = "https://sheets.googleapis.com/v4/spreadsheets";

export class GoogleSheetsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "google_sheets",
      name: "Google Sheets",
      category: "productivity",
      description: "Create, read, write, and format Google Sheets.",
    });
  }

  getEnvMapping() {
    return [
      { envKey: "GOOGLE_ACCESS_TOKEN", credKey: "access_token" },
    ];
  }

  getTools() {
    return [
      {
        name: "gsheets_create",
        description: "Create a new spreadsheet.",
        inputSchema: { type: "object", properties: { title: { type: "string" }, sheets: { type: "array", items: { type: "string" } } }, required: ["title"] },
      },
      {
        name: "gsheets_read",
        description: "Read data from a range.",
        inputSchema: { type: "object", properties: { spreadsheet_id: { type: "string" }, range: { type: "string", description: "e.g. Sheet1!A1:D10" } }, required: ["spreadsheet_id", "range"] },
      },
      {
        name: "gsheets_write",
        description: "Write data to a range.",
        inputSchema: {
          type: "object",
          properties: {
            spreadsheet_id: { type: "string" },
            range: { type: "string" },
            values: { type: "array", items: { type: "array", items: { type: "string" } }, description: "2D array of values" },
          },
          required: ["spreadsheet_id", "range", "values"],
        },
      },
      {
        name: "gsheets_append",
        description: "Append rows to end of sheet.",
        inputSchema: {
          type: "object",
          properties: {
            spreadsheet_id: { type: "string" },
            range: { type: "string" },
            values: { type: "array", items: { type: "array", items: { type: "string" } } },
          },
          required: ["spreadsheet_id", "range", "values"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    switch (toolName) {
      case "gsheets_create": {
        const body = { properties: { title: args.title }, sheets: (args.sheets || ["Sheet1"]).map(name => ({ properties: { title: name } })) };
        const result = await this.apiRequest(API, { method: "POST", body: JSON.stringify(body) });
        return { spreadsheetId: result.spreadsheetId, url: result.spreadsheetUrl };
      }
      case "gsheets_read":
        return this.apiRequest(`${API}/${args.spreadsheet_id}/values/${encodeURIComponent(args.range)}`);
      case "gsheets_write":
        return this.apiRequest(`${API}/${args.spreadsheet_id}/values/${encodeURIComponent(args.range)}?valueInputOption=USER_ENTERED`, { method: "PUT", body: JSON.stringify({ values: args.values }) });
      case "gsheets_append":
        return this.apiRequest(`${API}/${args.spreadsheet_id}/values/${encodeURIComponent(args.range)}:append?valueInputOption=USER_ENTERED`, { method: "POST", body: JSON.stringify({ values: args.values }) });
      default: throw new Error(`Unknown: ${toolName}`);
    }
  }
}

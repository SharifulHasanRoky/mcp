/**
 * Google Sheets Plugin
 * 
 * Connects to Google Sheets API for spreadsheet management,
 * data reading/writing, and formula operations.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

export class GoogleSheetsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "google_sheets",
      name: "Google Sheets",
      category: "productivity",
      description: "Create, read, write, and manage Google Sheets spreadsheets via Sheets API.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "access_token", description: "Google OAuth2 access token", required: true },
    ];
  }

  getSetupInstructions() {
    return `1. Go to Google Cloud Console → Enable Sheets API
2. Create OAuth2 credentials
3. Generate access token with spreadsheets and drive scopes`;
  }

  getTools() {
    return [
      {
        name: "gsheets_create",
        description: "Create a new Google Sheets spreadsheet.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Spreadsheet title" },
            sheets: {
              type: "array",
              items: { type: "string" },
              description: "Sheet/tab names to create",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "gsheets_read",
        description: "Read data from a range in a Google Sheet.",
        inputSchema: {
          type: "object",
          properties: {
            spreadsheet_id: { type: "string", description: "Spreadsheet ID" },
            range: { type: "string", description: "Range (e.g., Sheet1!A1:D10)" },
          },
          required: ["spreadsheet_id", "range"],
        },
      },
      {
        name: "gsheets_write",
        description: "Write data to a range in a Google Sheet.",
        inputSchema: {
          type: "object",
          properties: {
            spreadsheet_id: { type: "string", description: "Spreadsheet ID" },
            range: { type: "string", description: "Range (e.g., Sheet1!A1)" },
            values: {
              type: "array",
              items: { type: "array", items: { type: "string" } },
              description: "2D array of values to write",
            },
            input_option: {
              type: "string",
              enum: ["RAW", "USER_ENTERED"],
              description: "How to interpret input (USER_ENTERED parses formulas)",
            },
          },
          required: ["spreadsheet_id", "range", "values"],
        },
      },
      {
        name: "gsheets_append",
        description: "Append rows to the end of a sheet.",
        inputSchema: {
          type: "object",
          properties: {
            spreadsheet_id: { type: "string", description: "Spreadsheet ID" },
            range: { type: "string", description: "Sheet name or range" },
            values: {
              type: "array",
              items: { type: "array", items: { type: "string" } },
              description: "Rows to append",
            },
          },
          required: ["spreadsheet_id", "range", "values"],
        },
      },
      {
        name: "gsheets_format",
        description: "Format cells (bold, color, borders, number format).",
        inputSchema: {
          type: "object",
          properties: {
            spreadsheet_id: { type: "string", description: "Spreadsheet ID" },
            range: { type: "string", description: "Range to format" },
            bold: { type: "boolean", description: "Make text bold" },
            bg_color: { type: "string", description: "Background color (hex)" },
            text_color: { type: "string", description: "Text color (hex)" },
            number_format: { type: "string", description: "Number format pattern" },
          },
          required: ["spreadsheet_id", "range"],
        },
      },
      {
        name: "gsheets_add_sheet",
        description: "Add a new sheet/tab to an existing spreadsheet.",
        inputSchema: {
          type: "object",
          properties: {
            spreadsheet_id: { type: "string", description: "Spreadsheet ID" },
            title: { type: "string", description: "New sheet name" },
          },
          required: ["spreadsheet_id", "title"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    switch (toolName) {
      case "gsheets_create":
        return this.createSpreadsheet(args);
      case "gsheets_read":
        return this.apiRequest(
          `${SHEETS_API}/${args.spreadsheet_id}/values/${encodeURIComponent(args.range)}`
        );
      case "gsheets_write":
        return this.apiRequest(
          `${SHEETS_API}/${args.spreadsheet_id}/values/${encodeURIComponent(args.range)}?valueInputOption=${args.input_option || "USER_ENTERED"}`,
          { method: "PUT", body: JSON.stringify({ values: args.values }) }
        );
      case "gsheets_append":
        return this.apiRequest(
          `${SHEETS_API}/${args.spreadsheet_id}/values/${encodeURIComponent(args.range)}:append?valueInputOption=USER_ENTERED`,
          { method: "POST", body: JSON.stringify({ values: args.values }) }
        );
      case "gsheets_format":
        return this.formatCells(args);
      case "gsheets_add_sheet":
        return this.apiRequest(`${SHEETS_API}/${args.spreadsheet_id}:batchUpdate`, {
          method: "POST",
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: args.title } } }],
          }),
        });
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async createSpreadsheet(args) {
    const body = {
      properties: { title: args.title },
      sheets: (args.sheets || ["Sheet1"]).map((name) => ({
        properties: { title: name },
      })),
    };
    const result = await this.apiRequest(SHEETS_API, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return {
      spreadsheetId: result.spreadsheetId,
      url: result.spreadsheetUrl,
      title: result.properties.title,
    };
  }

  async formatCells(args) {
    const requests = [];
    const cellFormat = {};
    if (args.bold) cellFormat.textFormat = { bold: true };
    if (args.bg_color) cellFormat.backgroundColor = this.hexToRgb(args.bg_color);
    if (args.text_color) {
      cellFormat.textFormat = { ...cellFormat.textFormat, foregroundColor: this.hexToRgb(args.text_color) };
    }
    if (args.number_format) cellFormat.numberFormat = { type: "NUMBER", pattern: args.number_format };

    requests.push({
      repeatCell: {
        range: this.parseRange(args.range),
        cell: { userEnteredFormat: cellFormat },
        fields: "userEnteredFormat",
      },
    });

    return this.apiRequest(`${SHEETS_API}/${args.spreadsheet_id}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
  }

  hexToRgb(hex) {
    const h = hex.replace("#", "");
    return {
      red: parseInt(h.substring(0, 2), 16) / 255,
      green: parseInt(h.substring(2, 4), 16) / 255,
      blue: parseInt(h.substring(4, 6), 16) / 255,
    };
  }

  parseRange(range) {
    // Simple range parser for A1 notation
    return { sheetId: 0 };
  }
}

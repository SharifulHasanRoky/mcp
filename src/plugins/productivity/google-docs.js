/**
 * Google Docs Plugin
 * 
 * Connects to Google Docs API for creating, reading,
 * and editing documents programmatically.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const DOCS_API = "https://docs.googleapis.com/v1";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

export class GoogleDocsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "google_docs",
      name: "Google Docs",
      category: "productivity",
      description: "Create, read, and edit Google Docs documents via Google Docs API.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "access_token", description: "Google OAuth2 access token", required: true },
    ];
  }

  getSetupInstructions() {
    return `1. Go to Google Cloud Console → Enable Docs API and Drive API
2. Create OAuth2 credentials
3. Generate access token with docs and drive scopes`;
  }

  getTools() {
    return [
      {
        name: "gdocs_create",
        description: "Create a new Google Doc with optional initial content.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Document title" },
            content: { type: "string", description: "Initial text content" },
            folder_id: { type: "string", description: "Google Drive folder ID (optional)" },
          },
          required: ["title"],
        },
      },
      {
        name: "gdocs_read",
        description: "Read the content of a Google Doc.",
        inputSchema: {
          type: "object",
          properties: {
            document_id: { type: "string", description: "Document ID" },
          },
          required: ["document_id"],
        },
      },
      {
        name: "gdocs_append",
        description: "Append text content to the end of a Google Doc.",
        inputSchema: {
          type: "object",
          properties: {
            document_id: { type: "string", description: "Document ID" },
            text: { type: "string", description: "Text to append" },
            style: { type: "string", enum: ["normal", "heading1", "heading2", "heading3"], description: "Text style" },
          },
          required: ["document_id", "text"],
        },
      },
      {
        name: "gdocs_insert_table",
        description: "Insert a table into a Google Doc.",
        inputSchema: {
          type: "object",
          properties: {
            document_id: { type: "string", description: "Document ID" },
            rows: { type: "number", description: "Number of rows" },
            columns: { type: "number", description: "Number of columns" },
            data: { type: "array", items: { type: "array", items: { type: "string" } }, description: "Table data (2D array)" },
          },
          required: ["document_id", "rows", "columns"],
        },
      },
      {
        name: "gdocs_find_replace",
        description: "Find and replace text in a Google Doc.",
        inputSchema: {
          type: "object",
          properties: {
            document_id: { type: "string", description: "Document ID" },
            find: { type: "string", description: "Text to find" },
            replace: { type: "string", description: "Replacement text" },
            match_case: { type: "boolean", description: "Case sensitive match" },
          },
          required: ["document_id", "find", "replace"],
        },
      },
      {
        name: "gdocs_list",
        description: "List Google Docs in your Drive or a specific folder.",
        inputSchema: {
          type: "object",
          properties: {
            folder_id: { type: "string", description: "Folder ID (optional)" },
            search: { type: "string", description: "Search query" },
            limit: { type: "number", description: "Max results (default 20)" },
          },
        },
      },
    ];
  }

  async execute(toolName, args) {
    switch (toolName) {
      case "gdocs_create":
        return this.createDoc(args);
      case "gdocs_read":
        return this.apiRequest(`${DOCS_API}/documents/${args.document_id}`);
      case "gdocs_append":
        return this.appendText(args);
      case "gdocs_insert_table":
        return this.insertTable(args);
      case "gdocs_find_replace":
        return this.findReplace(args);
      case "gdocs_list":
        return this.listDocs(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async createDoc(args) {
    const doc = await this.apiRequest(`${DOCS_API}/documents`, {
      method: "POST",
      body: JSON.stringify({ title: args.title }),
    });

    if (args.content) {
      await this.apiRequest(`${DOCS_API}/documents/${doc.documentId}:batchUpdate`, {
        method: "POST",
        body: JSON.stringify({
          requests: [{ insertText: { location: { index: 1 }, text: args.content } }],
        }),
      });
    }

    if (args.folder_id) {
      await this.apiRequest(`${DRIVE_API}/files/${doc.documentId}?addParents=${args.folder_id}`, { method: "PATCH" });
    }

    return { documentId: doc.documentId, title: doc.title, url: `https://docs.google.com/document/d/${doc.documentId}/edit` };
  }

  async appendText(args) {
    const doc = await this.apiRequest(`${DOCS_API}/documents/${args.document_id}`);
    const endIndex = doc.body.content[doc.body.content.length - 1].endIndex - 1;

    const requests = [{ insertText: { location: { index: endIndex }, text: `\n${args.text}` } }];

    if (args.style && args.style !== "normal") {
      const styleMap = { heading1: "HEADING_1", heading2: "HEADING_2", heading3: "HEADING_3" };
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: endIndex, endIndex: endIndex + args.text.length + 1 },
          paragraphStyle: { namedStyleType: styleMap[args.style] },
          fields: "namedStyleType",
        },
      });
    }

    return this.apiRequest(`${DOCS_API}/documents/${args.document_id}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
  }

  async insertTable(args) {
    return this.apiRequest(`${DOCS_API}/documents/${args.document_id}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        requests: [{ insertTable: { rows: args.rows, columns: args.columns, endOfSegmentLocation: {} } }],
      }),
    });
  }

  async findReplace(args) {
    return this.apiRequest(`${DOCS_API}/documents/${args.document_id}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        requests: [{
          replaceAllText: {
            containsText: { text: args.find, matchCase: args.match_case || false },
            replaceText: args.replace,
          },
        }],
      }),
    });
  }

  async listDocs(args) {
    let query = "mimeType='application/vnd.google-apps.document'";
    if (args.folder_id) query += ` and '${args.folder_id}' in parents`;
    if (args.search) query += ` and name contains '${args.search}'`;

    return this.apiRequest(`${DRIVE_API}/files?q=${encodeURIComponent(query)}&pageSize=${args.limit || 20}&fields=files(id,name,modifiedTime,webViewLink)`);
  }
}

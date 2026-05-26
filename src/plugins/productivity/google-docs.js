import { BasePlugin } from "../../core/base-plugin.js";

const DOCS_API = "https://docs.googleapis.com/v1";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

export class GoogleDocsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "google_docs",
      name: "Google Docs",
      category: "productivity",
      description: "Create, read, and edit Google Docs.",
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
        name: "gdocs_create",
        description: "Create a new Google Doc.",
        inputSchema: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } }, required: ["title"] },
      },
      {
        name: "gdocs_read",
        description: "Read a Google Doc content.",
        inputSchema: { type: "object", properties: { document_id: { type: "string" } }, required: ["document_id"] },
      },
      {
        name: "gdocs_append",
        description: "Append text to a Google Doc.",
        inputSchema: { type: "object", properties: { document_id: { type: "string" }, text: { type: "string" } }, required: ["document_id", "text"] },
      },
      {
        name: "gdocs_find_replace",
        description: "Find and replace text in a doc.",
        inputSchema: { type: "object", properties: { document_id: { type: "string" }, find: { type: "string" }, replace: { type: "string" } }, required: ["document_id", "find", "replace"] },
      },
      {
        name: "gdocs_list",
        description: "List Google Docs in Drive.",
        inputSchema: { type: "object", properties: { search: { type: "string" }, limit: { type: "number" } } },
      },
    ];
  }

  async execute(toolName, args) {
    switch (toolName) {
      case "gdocs_create": {
        const doc = await this.apiRequest(`${DOCS_API}/documents`, { method: "POST", body: JSON.stringify({ title: args.title }) });
        if (args.content) {
          await this.apiRequest(`${DOCS_API}/documents/${doc.documentId}:batchUpdate`, { method: "POST", body: JSON.stringify({ requests: [{ insertText: { location: { index: 1 }, text: args.content } }] }) });
        }
        return { documentId: doc.documentId, url: `https://docs.google.com/document/d/${doc.documentId}/edit` };
      }
      case "gdocs_read":
        return this.apiRequest(`${DOCS_API}/documents/${args.document_id}`);
      case "gdocs_append": {
        const doc = await this.apiRequest(`${DOCS_API}/documents/${args.document_id}`);
        const endIdx = doc.body.content[doc.body.content.length - 1].endIndex - 1;
        return this.apiRequest(`${DOCS_API}/documents/${args.document_id}:batchUpdate`, { method: "POST", body: JSON.stringify({ requests: [{ insertText: { location: { index: endIdx }, text: `\n${args.text}` } }] }) });
      }
      case "gdocs_find_replace":
        return this.apiRequest(`${DOCS_API}/documents/${args.document_id}:batchUpdate`, { method: "POST", body: JSON.stringify({ requests: [{ replaceAllText: { containsText: { text: args.find, matchCase: false }, replaceText: args.replace } }] }) });
      case "gdocs_list": {
        let q = "mimeType='application/vnd.google-apps.document'";
        if (args.search) q += ` and name contains '${args.search}'`;
        return this.apiRequest(`${DRIVE_API}/files?q=${encodeURIComponent(q)}&pageSize=${args.limit || 20}&fields=files(id,name,modifiedTime,webViewLink)`);
      }
      default: throw new Error(`Unknown: ${toolName}`);
    }
  }
}

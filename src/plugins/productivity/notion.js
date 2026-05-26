import { BasePlugin } from "../../core/base-plugin.js";

const API = "https://api.notion.com/v1";

export class NotionPlugin extends BasePlugin {
  constructor() {
    super({
      id: "notion",
      name: "Notion",
      category: "productivity",
      description: "Manage Notion pages, databases, and content.",
    });
  }

  getEnvMapping() {
    return [
      { envKey: "NOTION_TOKEN", credKey: "api_key" },
    ];
  }

  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.credentials.api_key}`,
      "Notion-Version": "2022-06-28",
    };
  }

  getTools() {
    return [
      {
        name: "notion_create_page",
        description: "Create a new Notion page.",
        inputSchema: {
          type: "object",
          properties: {
            parent_id: { type: "string", description: "Parent page or database ID" },
            title: { type: "string" },
            content: { type: "string", description: "Page content text" },
          },
          required: ["parent_id", "title"],
        },
      },
      {
        name: "notion_search",
        description: "Search Notion pages and databases.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" } },
        },
      },
      {
        name: "notion_query_database",
        description: "Query a Notion database with filters.",
        inputSchema: {
          type: "object",
          properties: {
            database_id: { type: "string" },
            filter: { type: "object" },
          },
          required: ["database_id"],
        },
      },
      {
        name: "notion_update_page",
        description: "Update page properties or archive it.",
        inputSchema: {
          type: "object",
          properties: {
            page_id: { type: "string" },
            properties: { type: "object" },
            archived: { type: "boolean" },
          },
          required: ["page_id"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    switch (toolName) {
      case "notion_create_page": {
        const body = {
          parent: { page_id: args.parent_id },
          properties: { title: { title: [{ text: { content: args.title } }] } },
        };
        if (args.content) {
          body.children = args.content.split("\n").filter(Boolean).map(line => ({
            type: "paragraph",
            paragraph: { rich_text: [{ text: { content: line } }] },
          }));
        }
        return this.apiRequest(`${API}/pages`, { method: "POST", body: JSON.stringify(body) });
      }
      case "notion_search":
        return this.apiRequest(`${API}/search`, { method: "POST", body: JSON.stringify({ query: args.query || "" }) });
      case "notion_query_database": {
        const body = { page_size: 100 };
        if (args.filter) body.filter = args.filter;
        return this.apiRequest(`${API}/databases/${args.database_id}/query`, { method: "POST", body: JSON.stringify(body) });
      }
      case "notion_update_page": {
        const body = {};
        if (args.properties) body.properties = args.properties;
        if (args.archived !== undefined) body.archived = args.archived;
        return this.apiRequest(`${API}/pages/${args.page_id}`, { method: "PATCH", body: JSON.stringify(body) });
      }
      default: throw new Error(`Unknown: ${toolName}`);
    }
  }
}

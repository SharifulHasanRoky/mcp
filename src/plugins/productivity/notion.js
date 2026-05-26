/**
 * Notion Plugin
 * 
 * Connects to Notion API for managing pages, databases,
 * blocks, and workspace content.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const NOTION_API = "https://api.notion.com/v1";

export class NotionPlugin extends BasePlugin {
  constructor() {
    super({
      id: "notion",
      name: "Notion",
      category: "productivity",
      description: "Manage Notion pages, databases, blocks, and workspace content via Notion API.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "api_key", description: "Notion Integration Token (Internal Integration)", required: true },
    ];
  }

  getSetupInstructions() {
    return `1. Go to https://www.notion.so/my-integrations
2. Create a new integration
3. Copy the Internal Integration Token
4. Share pages/databases with your integration in Notion`;
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
        description: "Create a new Notion page in a parent page or database.",
        inputSchema: {
          type: "object",
          properties: {
            parent_id: { type: "string", description: "Parent page or database ID" },
            parent_type: { type: "string", enum: ["page_id", "database_id"], description: "Parent type" },
            title: { type: "string", description: "Page title" },
            content: { type: "string", description: "Page content (markdown-like)" },
            properties: { type: "object", description: "Database properties (if parent is database)" },
            icon: { type: "string", description: "Emoji icon" },
          },
          required: ["parent_id", "title"],
        },
      },
      {
        name: "notion_search",
        description: "Search across all Notion pages and databases.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            filter_type: { type: "string", enum: ["page", "database"], description: "Filter by type" },
            sort_direction: { type: "string", enum: ["ascending", "descending"], description: "Sort direction" },
          },
        },
      },
      {
        name: "notion_query_database",
        description: "Query a Notion database with filters and sorts.",
        inputSchema: {
          type: "object",
          properties: {
            database_id: { type: "string", description: "Database ID" },
            filter: { type: "object", description: "Notion filter object" },
            sorts: { type: "array", items: { type: "object" }, description: "Sort conditions" },
            page_size: { type: "number", description: "Results per page (max 100)" },
          },
          required: ["database_id"],
        },
      },
      {
        name: "notion_update_page",
        description: "Update page properties or archive a page.",
        inputSchema: {
          type: "object",
          properties: {
            page_id: { type: "string", description: "Page ID" },
            properties: { type: "object", description: "Properties to update" },
            archived: { type: "boolean", description: "Archive/unarchive the page" },
            icon: { type: "string", description: "New emoji icon" },
          },
          required: ["page_id"],
        },
      },
      {
        name: "notion_add_block",
        description: "Add content blocks to a page (paragraph, heading, list, code, etc).",
        inputSchema: {
          type: "object",
          properties: {
            page_id: { type: "string", description: "Page ID to add blocks to" },
            blocks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item", "numbered_list_item", "code", "quote", "divider", "callout", "toggle"] },
                  content: { type: "string", description: "Block text content" },
                  language: { type: "string", description: "Code language (for code blocks)" },
                },
              },
              description: "Content blocks to add",
            },
          },
          required: ["page_id", "blocks"],
        },
      },
      {
        name: "notion_create_database",
        description: "Create a new database with custom properties/columns.",
        inputSchema: {
          type: "object",
          properties: {
            parent_page_id: { type: "string", description: "Parent page ID" },
            title: { type: "string", description: "Database title" },
            properties: {
              type: "object",
              description: "Database schema: property_name -> {type, options}",
            },
          },
          required: ["parent_page_id", "title"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    switch (toolName) {
      case "notion_create_page":
        return this.createPage(args);
      case "notion_search":
        return this.search(args);
      case "notion_query_database":
        return this.queryDatabase(args);
      case "notion_update_page":
        return this.updatePage(args);
      case "notion_add_block":
        return this.addBlocks(args);
      case "notion_create_database":
        return this.createDatabase(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async createPage(args) {
    const parent = args.parent_type === "database_id"
      ? { database_id: args.parent_id }
      : { page_id: args.parent_id };

    const body = {
      parent,
      properties: args.properties || { title: { title: [{ text: { content: args.title } }] } },
    };
    if (args.icon) body.icon = { emoji: args.icon };
    if (args.content) {
      body.children = this.textToBlocks(args.content);
    }
    return this.apiRequest(`${NOTION_API}/pages`, { method: "POST", body: JSON.stringify(body) });
  }

  async search(args) {
    const body = {};
    if (args.query) body.query = args.query;
    if (args.filter_type) body.filter = { value: args.filter_type, property: "object" };
    if (args.sort_direction) body.sort = { direction: args.sort_direction, timestamp: "last_edited_time" };
    return this.apiRequest(`${NOTION_API}/search`, { method: "POST", body: JSON.stringify(body) });
  }

  async queryDatabase(args) {
    const body = { page_size: args.page_size || 100 };
    if (args.filter) body.filter = args.filter;
    if (args.sorts) body.sorts = args.sorts;
    return this.apiRequest(`${NOTION_API}/databases/${args.database_id}/query`, { method: "POST", body: JSON.stringify(body) });
  }

  async updatePage(args) {
    const body = {};
    if (args.properties) body.properties = args.properties;
    if (args.archived !== undefined) body.archived = args.archived;
    if (args.icon) body.icon = { emoji: args.icon };
    return this.apiRequest(`${NOTION_API}/pages/${args.page_id}`, { method: "PATCH", body: JSON.stringify(body) });
  }

  async addBlocks(args) {
    const children = args.blocks.map((block) => this.createBlock(block));
    return this.apiRequest(`${NOTION_API}/blocks/${args.page_id}/children`, {
      method: "PATCH",
      body: JSON.stringify({ children }),
    });
  }

  async createDatabase(args) {
    const properties = {};
    if (args.properties) {
      Object.entries(args.properties).forEach(([name, config]) => {
        properties[name] = { [config.type || "rich_text"]: config.options || {} };
      });
    }
    properties["Name"] = { title: {} };

    return this.apiRequest(`${NOTION_API}/databases`, {
      method: "POST",
      body: JSON.stringify({
        parent: { page_id: args.parent_page_id },
        title: [{ text: { content: args.title } }],
        properties,
      }),
    });
  }

  createBlock(block) {
    const type = block.type || "paragraph";
    if (type === "divider") return { type: "divider", divider: {} };
    const richText = [{ text: { content: block.content || "" } }];
    if (type === "code") {
      return { type: "code", code: { rich_text: richText, language: block.language || "plain text" } };
    }
    return { type, [type]: { rich_text: richText } };
  }

  textToBlocks(text) {
    return text.split("\n").filter(Boolean).map((line) => ({
      type: "paragraph",
      paragraph: { rich_text: [{ text: { content: line } }] },
    }));
  }
}

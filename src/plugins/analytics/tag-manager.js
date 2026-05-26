import { BasePlugin } from "../../core/base-plugin.js";

const API = "https://www.googleapis.com/tagmanager/v2";

export class TagManagerPlugin extends BasePlugin {
  constructor() {
    super({
      id: "tag_manager",
      name: "Google Tag Manager",
      category: "analytics",
      description: "Manage GTM tags, triggers, variables, and publish versions.",
    });
  }

  getEnvMapping() {
    return [
      { envKey: "GTM_ACCESS_TOKEN", credKey: "access_token" },
      { envKey: "GTM_ACCOUNT_ID", credKey: "account_id" },
      { envKey: "GTM_CONTAINER_ID", credKey: "container_id" },
    ];
  }

  getTools() {
    return [
      { name: "gtm_list_tags", description: "List all tags in the container.", inputSchema: { type: "object", properties: {} } },
      {
        name: "gtm_create_tag",
        description: "Create a tag (GA4, conversion pixel, custom HTML).",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string", enum: ["gaawc", "html", "img"], description: "gaawc=GA4, html=Custom HTML, img=Pixel" },
            trigger_id: { type: "string" },
          },
          required: ["name", "type"],
        },
      },
      { name: "gtm_list_triggers", description: "List all triggers.", inputSchema: { type: "object", properties: {} } },
      {
        name: "gtm_create_trigger",
        description: "Create a trigger (pageview, click, form submit, custom event).",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string", enum: ["pageview", "click", "linkClick", "formSubmission", "customEvent"] },
            event_name: { type: "string", description: "Custom event name (for customEvent)" },
          },
          required: ["name", "type"],
        },
      },
      { name: "gtm_list_variables", description: "List all variables.", inputSchema: { type: "object", properties: {} } },
      {
        name: "gtm_publish",
        description: "Publish the workspace live.",
        inputSchema: {
          type: "object",
          properties: {
            version_name: { type: "string" },
            notes: { type: "string" },
          },
        },
      },
    ];
  }

  async execute(toolName, args) {
    const basePath = `accounts/${this.credentials.account_id}/containers/${this.credentials.container_id}`;
    const ws = `${basePath}/workspaces/default`;
    switch (toolName) {
      case "gtm_list_tags": return this.apiRequest(`${API}/${ws}/tags`);
      case "gtm_create_tag":
        return this.apiRequest(`${API}/${ws}/tags`, { method: "POST", body: JSON.stringify({ name: args.name, type: args.type, firingTriggerId: args.trigger_id ? [args.trigger_id] : [] }) });
      case "gtm_list_triggers": return this.apiRequest(`${API}/${ws}/triggers`);
      case "gtm_create_trigger":
        return this.apiRequest(`${API}/${ws}/triggers`, { method: "POST", body: JSON.stringify({ name: args.name, type: args.type }) });
      case "gtm_list_variables": return this.apiRequest(`${API}/${ws}/variables`);
      case "gtm_publish":
        return this.apiRequest(`${API}/${ws}:create_version`, { method: "POST", body: JSON.stringify({ name: args.version_name || "Published", notes: args.notes || "" }) });
      default: throw new Error(`Unknown: ${toolName}`);
    }
  }
}

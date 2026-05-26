/**
 * Google Tag Manager Plugin
 * 
 * Connects to GTM API for managing containers, tags,
 * triggers, variables, and workspace versions.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const GTM_API = "https://www.googleapis.com/tagmanager/v2";

export class TagManagerPlugin extends BasePlugin {
  constructor() {
    super({
      id: "tag_manager",
      name: "Google Tag Manager",
      category: "analytics",
      description: "Manage GTM containers, tags, triggers, variables, and publish workspace versions.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "access_token", description: "Google OAuth2 access token", required: true },
      { key: "account_id", description: "GTM Account ID", required: true },
      { key: "container_id", description: "GTM Container ID", required: true },
    ];
  }

  getSetupInstructions() {
    return `1. Go to Google Cloud Console → Enable Tag Manager API
2. Create OAuth2 credentials (or use service account)
3. Get Account ID and Container ID from tagmanager.google.com
4. Generate access token with tagmanager.edit.containers scope`;
  }

  getTools() {
    return [
      {
        name: "gtm_list_tags",
        description: "List all tags in a GTM container workspace.",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: { type: "string", description: "Workspace ID (default: latest)" },
          },
        },
      },
      {
        name: "gtm_create_tag",
        description: "Create a new tag in GTM (GA4, conversion, custom HTML, etc).",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Tag name" },
            type: {
              type: "string",
              enum: ["gaawc", "html", "img", "cvt_CONVERSION", "flc", "sp"],
              description: "Tag type (gaawc=GA4 Config, html=Custom HTML, img=Pixel, flc=Floodlight)",
            },
            firing_trigger_id: { type: "string", description: "Trigger ID to fire this tag" },
            parameters: { type: "object", description: "Tag parameters (type-specific)" },
          },
          required: ["name", "type"],
        },
      },
      {
        name: "gtm_list_triggers",
        description: "List all triggers in the container.",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: { type: "string", description: "Workspace ID" },
          },
        },
      },
      {
        name: "gtm_create_trigger",
        description: "Create a new trigger (pageview, click, form submit, custom event, timer, etc).",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Trigger name" },
            type: {
              type: "string",
              enum: ["pageview", "domReady", "windowLoaded", "click", "linkClick", "formSubmission", "customEvent", "timer", "scrollDepth"],
              description: "Trigger type",
            },
            filter: {
              type: "array",
              items: { type: "object" },
              description: "Trigger conditions/filters",
            },
            custom_event_name: { type: "string", description: "Custom event name (for customEvent type)" },
          },
          required: ["name", "type"],
        },
      },
      {
        name: "gtm_list_variables",
        description: "List all variables in the container.",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: { type: "string", description: "Workspace ID" },
          },
        },
      },
      {
        name: "gtm_create_variable",
        description: "Create a new variable (data layer, DOM element, cookie, constant, etc).",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Variable name" },
            type: {
              type: "string",
              enum: ["v", "jsm", "k", "c", "d", "j", "gas"],
              description: "Variable type (v=DataLayer, jsm=CustomJS, k=Cookie, c=Constant, d=DOM, j=JS Variable)",
            },
            parameter_key: { type: "string", description: "Key/path for the variable" },
          },
          required: ["name", "type"],
        },
      },
      {
        name: "gtm_publish_version",
        description: "Create a version from workspace and publish it live.",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: { type: "string", description: "Workspace ID to publish" },
            version_name: { type: "string", description: "Version name" },
            notes: { type: "string", description: "Version notes" },
          },
          required: ["workspace_id"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const { account_id, container_id } = this.credentials;
    const basePath = `accounts/${account_id}/containers/${container_id}`;
    const wsId = args.workspace_id || "default";
    const wsPath = `${basePath}/workspaces/${wsId}`;

    switch (toolName) {
      case "gtm_list_tags":
        return this.apiRequest(`${GTM_API}/${wsPath}/tags`);
      case "gtm_create_tag":
        return this.apiRequest(`${GTM_API}/${wsPath}/tags`, {
          method: "POST",
          body: JSON.stringify({
            name: args.name,
            type: args.type,
            firingTriggerId: args.firing_trigger_id ? [args.firing_trigger_id] : [],
            parameter: args.parameters ? Object.entries(args.parameters).map(([key, value]) => ({ key, type: "template", value })) : [],
          }),
        });
      case "gtm_list_triggers":
        return this.apiRequest(`${GTM_API}/${wsPath}/triggers`);
      case "gtm_create_trigger":
        return this.apiRequest(`${GTM_API}/${wsPath}/triggers`, {
          method: "POST",
          body: JSON.stringify({
            name: args.name,
            type: args.type,
            customEventFilter: args.custom_event_name ? [{ type: "equals", parameter: [{ key: "arg0", type: "template", value: "{{_event}}" }, { key: "arg1", type: "template", value: args.custom_event_name }] }] : undefined,
            filter: args.filter,
          }),
        });
      case "gtm_list_variables":
        return this.apiRequest(`${GTM_API}/${wsPath}/variables`);
      case "gtm_create_variable":
        return this.apiRequest(`${GTM_API}/${wsPath}/variables`, {
          method: "POST",
          body: JSON.stringify({
            name: args.name,
            type: args.type,
            parameter: args.parameter_key ? [{ key: "name", type: "template", value: args.parameter_key }] : [],
          }),
        });
      case "gtm_publish_version":
        const version = await this.apiRequest(`${GTM_API}/${wsPath}:create_version`, {
          method: "POST",
          body: JSON.stringify({ name: args.version_name || "Auto-published", notes: args.notes || "" }),
        });
        if (version.containerVersion) {
          return this.apiRequest(`${GTM_API}/${basePath}/versions/${version.containerVersion.containerVersionId}:publish`, { method: "POST" });
        }
        return version;
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

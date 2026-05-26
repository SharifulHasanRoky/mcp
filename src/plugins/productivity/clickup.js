import { BasePlugin } from "../../core/base-plugin.js";

const API = "https://api.clickup.com/api/v2";

export class ClickUpPlugin extends BasePlugin {
  constructor() {
    super({
      id: "clickup",
      name: "ClickUp",
      category: "productivity",
      description: "Manage ClickUp tasks, lists, spaces, and time tracking.",
    });
  }

  getEnvMapping() {
    return [
      { envKey: "CLICKUP_TOKEN", credKey: "api_token" },
      { envKey: "CLICKUP_TEAM_ID", credKey: "team_id" },
    ];
  }

  getAuthHeaders() {
    return { Authorization: this.credentials.api_token };
  }

  getTools() {
    return [
      {
        name: "clickup_create_task",
        description: "Create a task in ClickUp.",
        inputSchema: {
          type: "object",
          properties: {
            list_id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            priority: { type: "number", enum: [1, 2, 3, 4], description: "1=Urgent 2=High 3=Normal 4=Low" },
            due_date: { type: "string" },
            status: { type: "string" },
          },
          required: ["list_id", "name"],
        },
      },
      {
        name: "clickup_get_tasks",
        description: "Get tasks from a list.",
        inputSchema: {
          type: "object",
          properties: {
            list_id: { type: "string" },
            statuses: { type: "array", items: { type: "string" } },
          },
          required: ["list_id"],
        },
      },
      {
        name: "clickup_update_task",
        description: "Update a task (status, priority, due date).",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "string" },
            status: { type: "string" },
            priority: { type: "number" },
            name: { type: "string" },
            due_date: { type: "string" },
          },
          required: ["task_id"],
        },
      },
      { name: "clickup_get_spaces", description: "List all spaces.", inputSchema: { type: "object", properties: {} } },
      {
        name: "clickup_get_lists",
        description: "Get all lists in a space.",
        inputSchema: { type: "object", properties: { space_id: { type: "string" } }, required: ["space_id"] },
      },
    ];
  }

  async execute(toolName, args) {
    switch (toolName) {
      case "clickup_create_task":
        return this.apiRequest(`${API}/list/${args.list_id}/task`, { method: "POST", body: JSON.stringify({ name: args.name, description: args.description, priority: args.priority, due_date: args.due_date, status: args.status }) });
      case "clickup_get_tasks": {
        const params = new URLSearchParams();
        if (args.statuses) args.statuses.forEach(s => params.append("statuses[]", s));
        return this.apiRequest(`${API}/list/${args.list_id}/task?${params}`);
      }
      case "clickup_update_task": {
        const body = {};
        if (args.status) body.status = args.status;
        if (args.priority) body.priority = args.priority;
        if (args.name) body.name = args.name;
        if (args.due_date) body.due_date = args.due_date;
        return this.apiRequest(`${API}/task/${args.task_id}`, { method: "PUT", body: JSON.stringify(body) });
      }
      case "clickup_get_spaces":
        return this.apiRequest(`${API}/team/${this.credentials.team_id}/space`);
      case "clickup_get_lists":
        return this.apiRequest(`${API}/space/${args.space_id}/list`);
      default: throw new Error(`Unknown: ${toolName}`);
    }
  }
}

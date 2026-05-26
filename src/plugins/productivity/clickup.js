/**
 * ClickUp Plugin
 * 
 * Connects to ClickUp API for task management, spaces,
 * lists, time tracking, and team productivity.
 */

import { BasePlugin } from "../../core/base-plugin.js";

const CLICKUP_API = "https://api.clickup.com/api/v2";

export class ClickUpPlugin extends BasePlugin {
  constructor() {
    super({
      id: "clickup",
      name: "ClickUp",
      category: "productivity",
      description: "Manage ClickUp tasks, lists, spaces, time tracking, and team workflows via ClickUp API.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "api_token", description: "ClickUp Personal API Token or OAuth token", required: true },
      { key: "team_id", description: "ClickUp Workspace/Team ID", required: true },
    ];
  }

  getSetupInstructions() {
    return `1. Go to ClickUp → Settings → Apps → Generate API Token
2. Or use OAuth2 at https://clickup.com/api
3. Get Team ID from workspace URL or API /team endpoint`;
  }

  getAuthHeaders() {
    return { Authorization: this.credentials.api_token };
  }

  getTools() {
    return [
      {
        name: "clickup_create_task",
        description: "Create a new task in ClickUp with assignees, priority, due date, and tags.",
        inputSchema: {
          type: "object",
          properties: {
            list_id: { type: "string", description: "List ID to create task in" },
            name: { type: "string", description: "Task name" },
            description: { type: "string", description: "Task description (supports markdown)" },
            priority: { type: "number", enum: [1, 2, 3, 4], description: "Priority: 1=Urgent, 2=High, 3=Normal, 4=Low" },
            assignees: { type: "array", items: { type: "number" }, description: "User IDs to assign" },
            due_date: { type: "string", description: "Due date (ISO format or unix ms)" },
            tags: { type: "array", items: { type: "string" }, description: "Tag names" },
            status: { type: "string", description: "Task status" },
          },
          required: ["list_id", "name"],
        },
      },
      {
        name: "clickup_get_tasks",
        description: "Get tasks from a list or space with filtering options.",
        inputSchema: {
          type: "object",
          properties: {
            list_id: { type: "string", description: "List ID" },
            statuses: { type: "array", items: { type: "string" }, description: "Filter by statuses" },
            assignees: { type: "array", items: { type: "number" }, description: "Filter by assignee IDs" },
            tags: { type: "array", items: { type: "string" }, description: "Filter by tags" },
            due_date_gt: { type: "string", description: "Due after (unix ms)" },
            due_date_lt: { type: "string", description: "Due before (unix ms)" },
            order_by: { type: "string", enum: ["due_date", "created", "updated", "priority"], description: "Sort order" },
          },
          required: ["list_id"],
        },
      },
      {
        name: "clickup_update_task",
        description: "Update an existing task (status, priority, assignees, due date).",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "string", description: "Task ID" },
            name: { type: "string", description: "New name" },
            status: { type: "string", description: "New status" },
            priority: { type: "number", description: "New priority" },
            due_date: { type: "string", description: "New due date" },
            assignees_add: { type: "array", items: { type: "number" }, description: "Users to add" },
            assignees_remove: { type: "array", items: { type: "number" }, description: "Users to remove" },
          },
          required: ["task_id"],
        },
      },
      {
        name: "clickup_get_spaces",
        description: "List all spaces in the workspace.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "clickup_get_lists",
        description: "Get all lists in a folder or space.",
        inputSchema: {
          type: "object",
          properties: {
            space_id: { type: "string", description: "Space ID" },
            folder_id: { type: "string", description: "Folder ID (optional)" },
          },
          required: ["space_id"],
        },
      },
      {
        name: "clickup_add_comment",
        description: "Add a comment to a task.",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "string", description: "Task ID" },
            comment_text: { type: "string", description: "Comment text" },
          },
          required: ["task_id", "comment_text"],
        },
      },
      {
        name: "clickup_track_time",
        description: "Start/stop time tracking or add manual time entry.",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "string", description: "Task ID" },
            action: { type: "string", enum: ["start", "stop", "add"], description: "Action" },
            duration: { type: "number", description: "Duration in ms (for add)" },
            description: { type: "string", description: "Time entry description" },
          },
          required: ["task_id", "action"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const teamId = this.credentials.team_id;
    switch (toolName) {
      case "clickup_create_task":
        return this.apiRequest(`${CLICKUP_API}/list/${args.list_id}/task`, {
          method: "POST",
          body: JSON.stringify({
            name: args.name,
            description: args.description,
            priority: args.priority,
            assignees: args.assignees,
            due_date: args.due_date,
            tags: args.tags,
            status: args.status,
          }),
        });
      case "clickup_get_tasks":
        const params = new URLSearchParams();
        if (args.statuses) args.statuses.forEach((s) => params.append("statuses[]", s));
        if (args.assignees) args.assignees.forEach((a) => params.append("assignees[]", a));
        if (args.order_by) params.append("order_by", args.order_by);
        return this.apiRequest(`${CLICKUP_API}/list/${args.list_id}/task?${params}`);
      case "clickup_update_task":
        const body = {};
        if (args.name) body.name = args.name;
        if (args.status) body.status = args.status;
        if (args.priority) body.priority = args.priority;
        if (args.due_date) body.due_date = args.due_date;
        if (args.assignees_add || args.assignees_remove) {
          body.assignees = { add: args.assignees_add || [], rem: args.assignees_remove || [] };
        }
        return this.apiRequest(`${CLICKUP_API}/task/${args.task_id}`, { method: "PUT", body: JSON.stringify(body) });
      case "clickup_get_spaces":
        return this.apiRequest(`${CLICKUP_API}/team/${teamId}/space`);
      case "clickup_get_lists":
        if (args.folder_id) return this.apiRequest(`${CLICKUP_API}/folder/${args.folder_id}/list`);
        return this.apiRequest(`${CLICKUP_API}/space/${args.space_id}/list`);
      case "clickup_add_comment":
        return this.apiRequest(`${CLICKUP_API}/task/${args.task_id}/comment`, {
          method: "POST",
          body: JSON.stringify({ comment_text: args.comment_text }),
        });
      case "clickup_track_time":
        if (args.action === "add") {
          return this.apiRequest(`${CLICKUP_API}/task/${args.task_id}/time`, {
            method: "POST",
            body: JSON.stringify({ duration: args.duration, description: args.description }),
          });
        }
        return this.apiRequest(`${CLICKUP_API}/task/${args.task_id}/time/${args.action}`, { method: "POST" });
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

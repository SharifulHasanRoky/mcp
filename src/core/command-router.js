/**
 * Command Router - Routes tool calls to the correct plugin.
 * Simple. No over-engineering.
 */

export class CommandRouter {
  constructor(registry) {
    this.registry = registry;
  }

  getAllTools() {
    const systemTools = [
      {
        name: "mother_status",
        description: "Show all connected platforms, which are active, and available tools count.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "mother_list_tools",
        description: "List all available tools. Filter by category: ads, analytics, productivity.",
        inputSchema: {
          type: "object",
          properties: {
            category: { type: "string", enum: ["ads", "analytics", "productivity"], description: "Filter by category" },
          },
        },
      },
    ];
    return [...systemTools, ...this.registry.getAllTools()];
  }

  async execute(toolName, args) {
    // System commands
    if (toolName === "mother_status") return this.getStatus();
    if (toolName === "mother_list_tools") return this.listTools(args);

    // Plugin commands
    const entry = this.registry.getPluginForTool(toolName);
    if (!entry) {
      throw new Error(`Unknown tool: ${toolName}. Use 'mother_list_tools' to see available commands.`);
    }

    const { plugin } = entry;

    if (!plugin.isConfigured()) {
      return {
        error: "not_configured",
        message: `❌ ${plugin.name} is not connected yet.`,
        fix: `Add these env vars to your MCP config:`,
        env_vars: plugin.getEnvMapping().map(e => e.envKey),
      };
    }

    return plugin.execute(toolName, args);
  }

  getStatus() {
    const plugins = this.registry.listPlugins();
    const active = plugins.filter(p => p.status === "active");
    return {
      title: "🎯 Mother MCP Status",
      total_platforms: plugins.length,
      active: active.length,
      inactive: plugins.length - active.length,
      platforms: plugins,
    };
  }

  listTools(args) {
    let tools = this.registry.getAllTools();
    if (args?.category) {
      tools = tools.filter(t => {
        const entry = this.registry.getPluginForTool(t.name);
        return entry?.plugin.category === args.category;
      });
    }
    return {
      total: tools.length,
      tools: tools.map(t => ({ name: t.name, description: t.description })),
    };
  }
}

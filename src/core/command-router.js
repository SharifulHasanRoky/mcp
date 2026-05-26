/**
 * Command Router - Routes tool calls to the appropriate plugin
 * 
 * Handles authentication checks, argument validation,
 * and delegates execution to the correct plugin handler.
 */

export class CommandRouter {
  constructor(registry, auth) {
    this.registry = registry;
    this.auth = auth;
  }

  /**
   * Get all available tools from the registry
   */
  getAllTools() {
    // Add the mother MCP system tools + all plugin tools
    const systemTools = this.getSystemTools();
    const pluginTools = this.registry.getAllTools();
    return [...systemTools, ...pluginTools];
  }

  /**
   * Execute a tool command
   */
  async execute(toolName, args) {
    // Handle system-level commands first
    if (toolName.startsWith("mother_")) {
      return this.executeSystemCommand(toolName, args);
    }

    // Find the plugin that owns this tool
    const entry = this.registry.getPluginForTool(toolName);
    if (!entry) {
      throw new Error(`Unknown tool: ${toolName}. Use 'mother_list_tools' to see available commands.`);
    }

    const { plugin } = entry;

    // Check if plugin is configured
    if (!plugin.isConfigured()) {
      return {
        status: "needs_setup",
        message: `Plugin "${plugin.name}" needs configuration. Use 'mother_configure' with plugin_id="${plugin.id}" to set it up.`,
        required_credentials: plugin.getRequiredCredentials(),
      };
    }

    // Execute the tool
    return plugin.execute(toolName, args);
  }

  /**
   * System-level Mother MCP commands
   */
  getSystemTools() {
    return [
      {
        name: "mother_status",
        description: "Show status of all connected platforms and tools. See which are configured and ready.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "mother_list_tools",
        description: "List all available tools across all platforms. Filter by category or platform.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Filter by category: ads, analytics, productivity, ai",
              enum: ["ads", "analytics", "productivity", "ai"],
            },
            platform: {
              type: "string",
              description: "Filter by specific platform ID",
            },
          },
        },
      },
      {
        name: "mother_configure",
        description: "Configure a platform plugin with API credentials and settings.",
        inputSchema: {
          type: "object",
          properties: {
            plugin_id: {
              type: "string",
              description: "The plugin ID to configure",
            },
            credentials: {
              type: "object",
              description: "API credentials (keys, tokens, secrets)",
            },
          },
          required: ["plugin_id"],
        },
      },
      {
        name: "mother_help",
        description: "Get help on how to use Mother MCP, available platforms, and example commands.",
        inputSchema: {
          type: "object",
          properties: {
            topic: {
              type: "string",
              description: "Help topic: setup, platforms, commands, examples",
            },
          },
        },
      },
    ];
  }

  /**
   * Handle system-level commands
   */
  async executeSystemCommand(toolName, args) {
    switch (toolName) {
      case "mother_status":
        return this.getStatus();
      case "mother_list_tools":
        return this.listTools(args);
      case "mother_configure":
        return this.configurePlatform(args);
      case "mother_help":
        return this.getHelp(args);
      default:
        throw new Error(`Unknown system command: ${toolName}`);
    }
  }

  getStatus() {
    const plugins = this.registry.listPlugins();
    const configured = plugins.filter((p) => p.status === "configured").length;
    return {
      title: "🎯 Mother MCP Status",
      total_plugins: plugins.length,
      configured: configured,
      needs_setup: plugins.length - configured,
      platforms: plugins,
    };
  }

  listTools(args) {
    let tools = this.registry.getAllTools();
    if (args?.category) {
      tools = tools.filter((t) => {
        const entry = this.registry.getPluginForTool(t.name);
        return entry?.plugin.category === args.category;
      });
    }
    if (args?.platform) {
      tools = tools.filter((t) => {
        const entry = this.registry.getPluginForTool(t.name);
        return entry?.plugin.id === args.platform;
      });
    }
    return {
      total: tools.length,
      tools: tools.map((t) => ({ name: t.name, description: t.description })),
    };
  }

  async configurePlatform(args) {
    const plugin = this.registry.getPlugin(args.plugin_id);
    if (!plugin) {
      throw new Error(`Plugin not found: ${args.plugin_id}`);
    }
    if (args.credentials) {
      await this.auth.saveCredentials(args.plugin_id, args.credentials);
      plugin.setCredentials(args.credentials);
      return {
        status: "configured",
        message: `✅ ${plugin.name} has been configured successfully!`,
        available_tools: plugin.getTools().map((t) => t.name),
      };
    }
    return {
      plugin_id: args.plugin_id,
      name: plugin.name,
      required_credentials: plugin.getRequiredCredentials(),
      instructions: plugin.getSetupInstructions(),
    };
  }

  getHelp(args) {
    const topic = args?.topic || "overview";
    const helpTopics = {
      overview: {
        title: "🚀 Mother MCP - Master Control Platform",
        description: "One connection to rule them all. Mother MCP gives you unified control over all your marketing tools, ad platforms, analytics, and productivity apps.",
        categories: [
          "📢 Ads: Facebook, Google, TikTok, Pinterest, LinkedIn, X",
          "📊 Analytics: GA4, Tag Manager, Looker Studio",
          "📋 Productivity: ClickUp, Notion, Google Docs, Sheets",
          "🤖 AI: OpenAI, Claude, and more",
        ],
        quick_start: "Use 'mother_status' to see all platforms, 'mother_configure' to set up credentials.",
      },
      setup: {
        title: "⚙️ Setup Guide",
        steps: [
          "1. Run 'mother_status' to see available plugins",
          "2. Run 'mother_configure' with a plugin_id to see required credentials",
          "3. Provide your API keys/tokens to configure each platform",
          "4. Use platform-specific tools once configured",
        ],
      },
      examples: {
        title: "💡 Example Commands",
        examples: [
          "fb_ads_create_campaign - Create a Facebook ad campaign",
          "google_ads_get_performance - Get Google Ads performance report",
          "ga4_get_report - Pull GA4 analytics data",
          "notion_create_page - Create a Notion page",
          "clickup_create_task - Create a ClickUp task",
          "ai_generate_ad_copy - Generate ad copy with AI",
        ],
      },
    };
    return helpTopics[topic] || helpTopics.overview;
  }
}

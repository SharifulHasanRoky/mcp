/**
 * Plugin Registry - Manages all connected platform plugins
 * 
 * Each plugin registers itself with its tools, and the registry
 * provides a unified interface to discover and route commands.
 */

export class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.toolMap = new Map(); // toolName -> plugin mapping
  }

  /**
   * Register a plugin into the Mother MCP system
   */
  register(plugin) {
    const id = plugin.id;
    this.plugins.set(id, plugin);

    // Map each tool to its parent plugin
    const tools = plugin.getTools();
    tools.forEach((tool) => {
      this.toolMap.set(tool.name, {
        plugin,
        tool,
      });
    });

    console.error(`✅ Registered plugin: ${plugin.name} (${tools.length} tools)`);
  }

  /**
   * Get all registered tools across all plugins
   */
  getAllTools() {
    const tools = [];
    this.plugins.forEach((plugin) => {
      tools.push(...plugin.getTools());
    });
    return tools;
  }

  /**
   * Find which plugin owns a specific tool
   */
  getPluginForTool(toolName) {
    return this.toolMap.get(toolName);
  }

  /**
   * Get a specific plugin by ID
   */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  /**
   * List all registered plugins
   */
  listPlugins() {
    const list = [];
    this.plugins.forEach((plugin, id) => {
      list.push({
        id,
        name: plugin.name,
        category: plugin.category,
        description: plugin.description,
        toolCount: plugin.getTools().length,
        status: plugin.isConfigured() ? "configured" : "needs_setup",
      });
    });
    return list;
  }
}

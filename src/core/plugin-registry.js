/**
 * Plugin Registry - Tracks all platform plugins and their tools.
 */

export class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.toolMap = new Map();
  }

  register(plugin) {
    this.plugins.set(plugin.id, plugin);
    const tools = plugin.getTools();
    tools.forEach(tool => this.toolMap.set(tool.name, { plugin, tool }));
  }

  getAllTools() {
    const tools = [];
    this.plugins.forEach(plugin => tools.push(...plugin.getTools()));
    return tools;
  }

  getPluginForTool(toolName) {
    return this.toolMap.get(toolName);
  }

  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  listPlugins() {
    const list = [];
    this.plugins.forEach(plugin => {
      list.push({
        id: plugin.id,
        name: plugin.name,
        category: plugin.category,
        tools: plugin.getTools().length,
        status: plugin.isConfigured() ? "active" : "needs_token",
      });
    });
    return list;
  }
}

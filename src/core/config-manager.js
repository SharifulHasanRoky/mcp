/**
 * Config Manager - Handles Mother MCP configuration
 * 
 * Manages global settings, plugin preferences,
 * and environment-specific configurations.
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const CONFIG_DIR = join(process.env.HOME || "~", ".mother-mcp");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export class ConfigManager {
  constructor() {
    this.config = this.getDefaults();
    this.loaded = false;
  }

  getDefaults() {
    return {
      version: "1.0.0",
      log_level: "info",
      default_timeout: 30000,
      retry_attempts: 3,
      plugins: {},
    };
  }

  async load() {
    if (this.loaded) return;
    try {
      if (existsSync(CONFIG_FILE)) {
        const data = await readFile(CONFIG_FILE, "utf-8");
        this.config = { ...this.getDefaults(), ...JSON.parse(data) };
      }
    } catch (err) {
      console.error("Warning: Could not load config:", err.message);
    }
    this.loaded = true;
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    this.persist();
  }

  getPluginConfig(pluginId) {
    return this.config.plugins[pluginId] || {};
  }

  setPluginConfig(pluginId, pluginConfig) {
    this.config.plugins[pluginId] = pluginConfig;
    this.persist();
  }

  async persist() {
    try {
      if (!existsSync(CONFIG_DIR)) {
        await mkdir(CONFIG_DIR, { recursive: true });
      }
      await writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (err) {
      console.error("Warning: Could not save config:", err.message);
    }
  }
}

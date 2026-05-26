/**
 * Auth Manager - Handles credentials storage and retrieval
 * 
 * Manages API keys, OAuth tokens, and refresh flows
 * for all connected platforms.
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";

const CONFIG_DIR = join(process.env.HOME || "~", ".mother-mcp");
const CREDENTIALS_FILE = join(CONFIG_DIR, "credentials.json");

export class AuthManager {
  constructor(config) {
    this.config = config;
    this.credentials = {};
    this.loaded = false;
  }

  /**
   * Load credentials from disk
   */
  async load() {
    if (this.loaded) return;
    try {
      if (existsSync(CREDENTIALS_FILE)) {
        const data = await readFile(CREDENTIALS_FILE, "utf-8");
        this.credentials = JSON.parse(data);
      }
    } catch (err) {
      console.error("Warning: Could not load credentials:", err.message);
      this.credentials = {};
    }
    this.loaded = true;
  }

  /**
   * Save credentials for a plugin
   */
  async saveCredentials(pluginId, creds) {
    await this.load();
    this.credentials[pluginId] = {
      ...creds,
      updated_at: new Date().toISOString(),
    };
    await this.persist();
  }

  /**
   * Get credentials for a plugin
   */
  async getCredentials(pluginId) {
    await this.load();
    return this.credentials[pluginId] || null;
  }

  /**
   * Remove credentials for a plugin
   */
  async removeCredentials(pluginId) {
    await this.load();
    delete this.credentials[pluginId];
    await this.persist();
  }

  /**
   * Persist credentials to disk
   */
  async persist() {
    try {
      if (!existsSync(CONFIG_DIR)) {
        await mkdir(CONFIG_DIR, { recursive: true });
      }
      await writeFile(CREDENTIALS_FILE, JSON.stringify(this.credentials, null, 2));
    } catch (err) {
      console.error("Warning: Could not save credentials:", err.message);
    }
  }
}

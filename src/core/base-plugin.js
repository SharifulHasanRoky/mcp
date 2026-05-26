/**
 * Base Plugin - Every platform plugin extends this.
 * 
 * Each plugin reads its own API tokens from environment variables.
 * User puts tokens in the MCP config "env" section → done.
 */

export class BasePlugin {
  constructor({ id, name, category, description, envPrefix }) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.description = description;
    this.envPrefix = envPrefix; // e.g. "FB_ADS"
    this.credentials = null;
  }

  /**
   * Auto-load credentials from environment variables.
   * User sets these in their MCP config "env" block.
   */
  loadFromEnv() {
    const creds = {};
    let found = false;

    for (const { envKey, credKey } of this.getEnvMapping()) {
      const value = process.env[envKey];
      if (value) {
        creds[credKey] = value;
        found = true;
      }
    }

    if (found) {
      this.credentials = creds;
    }
  }

  isConfigured() {
    return this.credentials !== null;
  }

  setCredentials(creds) {
    this.credentials = creds;
  }

  // Override in each plugin
  getEnvMapping() { return []; }
  getTools() { throw new Error(`${this.id} must implement getTools()`); }
  async execute(toolName, args) { throw new Error(`${this.id} must implement execute()`); }

  /**
   * Make API request with auth
   */
  async apiRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${this.name} API Error (${response.status}): ${error}`);
    }

    return response.json();
  }

  getAuthHeaders() {
    if (this.credentials?.access_token) {
      return { Authorization: `Bearer ${this.credentials.access_token}` };
    }
    return {};
  }
}

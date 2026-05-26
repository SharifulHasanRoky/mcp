/**
 * Base Plugin - Abstract class that all platform plugins extend
 * 
 * Provides the common interface and utilities for all connectors.
 * Each plugin must implement: getTools(), execute(), getRequiredCredentials()
 */

export class BasePlugin {
  constructor({ id, name, category, description }) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.description = description;
    this.credentials = null;
  }

  /**
   * Check if this plugin has been configured with credentials
   */
  isConfigured() {
    return this.credentials !== null;
  }

  /**
   * Set credentials for this plugin
   */
  setCredentials(creds) {
    this.credentials = creds;
  }

  /**
   * Get list of tools this plugin provides (must override)
   */
  getTools() {
    throw new Error(`Plugin ${this.id} must implement getTools()`);
  }

  /**
   * Execute a tool (must override)
   */
  async execute(toolName, args) {
    throw new Error(`Plugin ${this.id} must implement execute()`);
  }

  /**
   * Get required credentials list (must override)
   */
  getRequiredCredentials() {
    throw new Error(`Plugin ${this.id} must implement getRequiredCredentials()`);
  }

  /**
   * Get setup instructions for this plugin
   */
  getSetupInstructions() {
    return `Visit the ${this.name} developer portal to obtain API credentials.`;
  }

  /**
   * Make an authenticated API request
   */
  async apiRequest(url, options = {}) {
    const defaultHeaders = {
      "Content-Type": "application/json",
      ...this.getAuthHeaders(),
    };

    const response = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Get auth headers based on credentials (override per plugin)
   */
  getAuthHeaders() {
    if (this.credentials?.access_token) {
      return { Authorization: `Bearer ${this.credentials.access_token}` };
    }
    return {};
  }
}

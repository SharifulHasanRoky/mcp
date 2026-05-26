/**
 * Lightweight MCP Server Implementation
 * 
 * Implements the Model Context Protocol over stdio transport
 * using JSON-RPC 2.0 — no external dependencies required.
 */

import { createInterface } from "readline";

export class MCPServer {
  constructor({ name, version }) {
    this.name = name;
    this.version = version;
    this.handlers = {};
  }

  onListTools(handler) {
    this.handlers.listTools = handler;
  }

  onCallTool(handler) {
    this.handlers.callTool = handler;
  }

  start() {
    const rl = createInterface({ input: process.stdin, terminal: false });
    let buffer = "";

    rl.on("line", async (line) => {
      buffer += line;
      try {
        const message = JSON.parse(buffer);
        buffer = "";
        await this.handleMessage(message);
      } catch (e) {
        // Incomplete JSON, wait for more
        if (e instanceof SyntaxError) return;
        buffer = "";
      }
    });

    process.stdin.on("end", () => process.exit(0));
  }

  async handleMessage(message) {
    const { id, method, params } = message;

    try {
      let result;

      switch (method) {
        case "initialize":
          result = {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: this.name, version: this.version },
          };
          break;

        case "notifications/initialized":
          // No response needed for notifications
          return;

        case "tools/list":
          const tools = this.handlers.listTools();
          result = { tools };
          break;

        case "tools/call":
          const { name, arguments: args } = params;
          result = await this.handlers.callTool(name, args || {});
          break;

        case "ping":
          result = {};
          break;

        default:
          this.sendError(id, -32601, `Method not found: ${method}`);
          return;
      }

      this.sendResponse(id, result);
    } catch (error) {
      this.sendError(id, -32603, error.message);
    }
  }

  sendResponse(id, result) {
    const response = JSON.stringify({
      jsonrpc: "2.0",
      id,
      result,
    });
    process.stdout.write(response + "\n");
  }

  sendError(id, code, message) {
    const response = JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code, message },
    });
    process.stdout.write(response + "\n");
  }
}

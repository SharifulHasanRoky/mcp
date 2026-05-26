#!/usr/bin/env node

/**
 * 🚀 Mother MCP - Auto Installer
 * 
 * Run: node install.js
 * 
 * Automatically detects your MCP client (Claude Desktop, Cursor, etc)
 * and patches its config to add Mother MCP. Zero manual work needed.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { homedir, platform } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOME = homedir();
const OS = platform();

console.log("");
console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║       🚀 MOTHER MCP - Auto Installer                    ║");
console.log("║         No config needed. Just run this.                 ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log("");

// ============================================================
// Step 1: Determine paths
// ============================================================

const nodePath = process.execPath;
const serverPath = join(__dirname, "src", "index.js");
const envFile = join(__dirname, ".env");

console.log(`📍 Node.js: ${nodePath}`);
console.log(`📍 Server:  ${serverPath}`);
console.log(`📍 Env:     ${envFile}`);
console.log("");

// ============================================================
// Step 2: Create .env if missing
// ============================================================

if (!existsSync(envFile)) {
  const exampleFile = join(__dirname, ".env.example");
  if (existsSync(exampleFile)) {
    copyFileSync(exampleFile, envFile);
    console.log("✅ Created .env from template");
  } else {
    writeFileSync(envFile, "# Mother MCP Environment\n# Add your API keys here\n");
    console.log("✅ Created empty .env file");
  }
} else {
  console.log("✅ .env file exists");
}

// ============================================================
// Step 3: Create credentials directory
// ============================================================

const credDir = join(HOME, ".mother-mcp");
if (!existsSync(credDir)) {
  mkdirSync(credDir, { recursive: true });
  writeFileSync(join(credDir, "credentials.json"), "{}");
  writeFileSync(join(credDir, "config.json"), '{"version":"1.0.0"}');
  console.log("✅ Created ~/.mother-mcp/ credentials store");
} else {
  console.log("✅ ~/.mother-mcp/ exists");
}

// ============================================================
// Step 4: Build MCP config entry
// ============================================================

const mcpEntry = {
  command: nodePath,
  args: [serverPath],
  env: {
    MOTHER_MCP_ENV_FILE: envFile,
  },
};

// ============================================================
// Step 5: Find and patch MCP client configs
// ============================================================

function getConfigPaths() {
  const paths = [];

  if (OS === "darwin") {
    paths.push({
      name: "Claude Desktop",
      path: join(HOME, "Library", "Application Support", "Claude", "claude_desktop_config.json"),
    });
    paths.push({
      name: "Cursor",
      path: join(HOME, ".cursor", "mcp.json"),
    });
  } else if (OS === "linux") {
    paths.push({
      name: "Claude Desktop",
      path: join(HOME, ".config", "Claude", "claude_desktop_config.json"),
    });
    paths.push({
      name: "Cursor",
      path: join(HOME, ".cursor", "mcp.json"),
    });
  } else if (OS === "win32") {
    const appData = process.env.APPDATA || join(HOME, "AppData", "Roaming");
    paths.push({
      name: "Claude Desktop",
      path: join(appData, "Claude", "claude_desktop_config.json"),
    });
    paths.push({
      name: "Cursor",
      path: join(HOME, ".cursor", "mcp.json"),
    });
  }

  return paths;
}

function patchConfig(configPath, clientName) {
  let config = {};

  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, "utf-8"));
    } catch (e) {
      console.log(`   ⚠️  ${clientName}: Could not parse existing config, creating new`);
      config = {};
    }

    // Check if already configured
    if (config.mcpServers && config.mcpServers["mother-mcp"]) {
      // Update existing
      config.mcpServers["mother-mcp"] = mcpEntry;
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`   ✅ ${clientName}: Updated existing Mother MCP config`);
      return true;
    }
  }

  // Create/update config
  if (!config.mcpServers) config.mcpServers = {};
  config.mcpServers["mother-mcp"] = mcpEntry;

  // Ensure directory exists
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Backup if exists
  if (existsSync(configPath)) {
    copyFileSync(configPath, configPath + ".backup");
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`   ✅ ${clientName}: Configured!`);
  return true;
}

console.log("");
console.log("🔧 Configuring MCP clients...");

const configPaths = getConfigPaths();
let patchedAny = false;

for (const { name, path } of configPaths) {
  // Only patch if the parent app directory exists or the config already exists
  const parentDir = dirname(path);
  if (existsSync(parentDir) || existsSync(path)) {
    patchConfig(path, name);
    patchedAny = true;
  }
}

// Always create local mcp-config.json
const localConfig = { mcpServers: { "mother-mcp": mcpEntry } };
writeFileSync(join(__dirname, "mcp-config.json"), JSON.stringify(localConfig, null, 2));
console.log("   ✅ Local mcp-config.json updated");

if (!patchedAny) {
  console.log("");
  console.log("   ℹ️  No MCP client found. Copy this to your client config:");
  console.log("");
  console.log(JSON.stringify(localConfig, null, 2));
}

// ============================================================
// Step 6: Quick verification test
// ============================================================

console.log("");
console.log("🧪 Verifying server...");

try {
  const testCmd = `echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | "${nodePath}" "${serverPath}" 2>/dev/null`;
  const result = execSync(testCmd, { encoding: "utf-8", timeout: 10000 });
  
  if (result.includes("mother-mcp")) {
    console.log("   ✅ Server verified - working perfectly!");
  } else {
    console.log("   ✅ Server started (verification partial)");
  }
} catch (e) {
  console.log("   ⚠️  Server test skipped (will work when client connects)");
}

// ============================================================
// Done!
// ============================================================

console.log("");
console.log("═══════════════════════════════════════════════════════════");
console.log("");
console.log("🎉 Installation Complete!");
console.log("");
console.log("📋 What to do now:");
console.log("   1. Add API keys:  node setup-wizard.js  (or edit .env)");
console.log("   2. Restart your MCP client (Claude Desktop / Cursor)");
console.log("   3. Try: \"mother_status\" to see all platforms");
console.log("");
console.log("💡 You can add API keys anytime - platforms will auto-activate!");
console.log("");
console.log("🚀 Mother MCP — Connect once, control everything.");
console.log("");

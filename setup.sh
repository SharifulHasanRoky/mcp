#!/bin/bash

# ============================================================
# 🚀 Mother MCP - One-Click Setup Script
# ============================================================
# এই script চালালেই সব হয়ে যাবে - কিছু করা লাগবে না!
# Usage: chmod +x setup.sh && ./setup.sh
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║          🚀 MOTHER MCP - MASTER CONTROL PLATFORM        ║${NC}"
echo -e "${PURPLE}║              One Connection. Total Control.              ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${CYAN}📁 Working directory: ${SCRIPT_DIR}${NC}"
echo ""

# ============================================================
# Step 1: Check Node.js
# ============================================================
echo -e "${BLUE}[1/5]${NC} Checking Node.js..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found!${NC}"
    echo -e "${YELLOW}Install Node.js from: https://nodejs.org (v18+ required)${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js v18+ required. You have $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"

# ============================================================
# Step 2: Create .env file if not exists
# ============================================================
echo -e "${BLUE}[2/5]${NC} Setting up environment..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file from template${NC}"
    echo -e "${YELLOW}   → Edit .env to add your API keys (when ready)${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# ============================================================
# Step 3: Create credentials directory
# ============================================================
echo -e "${BLUE}[3/5]${NC} Setting up credentials store..."

CRED_DIR="$HOME/.mother-mcp"
if [ ! -d "$CRED_DIR" ]; then
    mkdir -p "$CRED_DIR"
    echo '{}' > "$CRED_DIR/credentials.json"
    echo '{"version":"1.0.0","log_level":"info"}' > "$CRED_DIR/config.json"
    chmod 700 "$CRED_DIR"
    chmod 600 "$CRED_DIR/credentials.json"
    echo -e "${GREEN}✅ Credentials store created at ~/.mother-mcp/${NC}"
else
    echo -e "${GREEN}✅ Credentials store already exists${NC}"
fi

# ============================================================
# Step 4: Auto-configure Claude Desktop / Cursor / Kiro
# ============================================================
echo -e "${BLUE}[4/5]${NC} Auto-configuring MCP clients..."

NODE_PATH=$(which node)
SERVER_PATH="${SCRIPT_DIR}/src/index.js"

configure_client() {
    local config_path="$1"
    local client_name="$2"
    
    if [ -f "$config_path" ]; then
        # Check if mother-mcp already configured
        if grep -q "mother-mcp" "$config_path" 2>/dev/null; then
            echo -e "${GREEN}   ✅ ${client_name} - already configured${NC}"
            return
        fi
        
        # Backup existing config
        cp "$config_path" "${config_path}.backup"
        
        # Add mother-mcp to existing config using node
        node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('${config_path}', 'utf8'));
if (!config.mcpServers) config.mcpServers = {};
config.mcpServers['mother-mcp'] = {
  command: '${NODE_PATH}',
  args: ['${SERVER_PATH}'],
  env: { MOTHER_MCP_ENV_FILE: '${SCRIPT_DIR}/.env' }
};
fs.writeFileSync('${config_path}', JSON.stringify(config, null, 2));
" 2>/dev/null && echo -e "${GREEN}   ✅ ${client_name} - configured!${NC}" || echo -e "${YELLOW}   ⚠️  ${client_name} - could not auto-configure${NC}"
    else
        # Create the config directory and file
        local config_dir=$(dirname "$config_path")
        if [ -d "$(dirname "$config_dir")" ]; then
            mkdir -p "$config_dir"
            cat > "$config_path" << EOF
{
  "mcpServers": {
    "mother-mcp": {
      "command": "${NODE_PATH}",
      "args": ["${SERVER_PATH}"],
      "env": {
        "MOTHER_MCP_ENV_FILE": "${SCRIPT_DIR}/.env"
      }
    }
  }
}
EOF
            echo -e "${GREEN}   ✅ ${client_name} - created config!${NC}"
        fi
    fi
}

# Claude Desktop
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    configure_client "$HOME/Library/Application Support/Claude/claude_desktop_config.json" "Claude Desktop (macOS)"
    configure_client "$HOME/.cursor/mcp.json" "Cursor (macOS)"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    configure_client "$HOME/.config/Claude/claude_desktop_config.json" "Claude Desktop (Linux)"
    configure_client "$HOME/.cursor/mcp.json" "Cursor (Linux)"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash / WSL)
    configure_client "$APPDATA/Claude/claude_desktop_config.json" "Claude Desktop (Windows)"
    configure_client "$APPDATA/.cursor/mcp.json" "Cursor (Windows)"
fi

# Also create local mcp config for reference
cat > "${SCRIPT_DIR}/mcp-config.json" << EOF
{
  "mcpServers": {
    "mother-mcp": {
      "command": "${NODE_PATH}",
      "args": ["${SERVER_PATH}"],
      "env": {
        "MOTHER_MCP_ENV_FILE": "${SCRIPT_DIR}/.env"
      }
    }
  }
}
EOF

echo -e "${GREEN}   ✅ Local mcp-config.json updated${NC}"

# ============================================================
# Step 5: Verify installation
# ============================================================
echo -e "${BLUE}[5/5]${NC} Verifying installation..."

# Quick test
TEST_RESULT=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node "$SERVER_PATH" 2>/dev/null)

if echo "$TEST_RESULT" | grep -q "mother-mcp"; then
    echo -e "${GREEN}✅ Server verified - all systems operational!${NC}"
else
    echo -e "${YELLOW}⚠️  Server test inconclusive (may need NODE_OPTIONS unset)${NC}"
fi

# ============================================================
# Done!
# ============================================================
echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║               🎉 SETUP COMPLETE!                        ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Mother MCP is now installed and configured!${NC}"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo -e "   1. Edit ${YELLOW}.env${NC} file with your API keys"
echo -e "   2. Or run ${YELLOW}node setup-wizard.js${NC} for guided setup"
echo -e "   3. Restart Claude Desktop / Cursor"
echo -e "   4. Say: ${YELLOW}\"mother_status\"${NC} to see all platforms"
echo ""
echo -e "${CYAN}🔑 Quick API Setup (add keys one by one as you need):${NC}"
echo -e "   • Facebook Ads → ${YELLOW}developers.facebook.com${NC}"
echo -e "   • Google Ads   → ${YELLOW}developers.google.com/google-ads${NC}"
echo -e "   • TikTok Ads   → ${YELLOW}business-api.tiktok.com${NC}"
echo -e "   • GA4           → ${YELLOW}console.cloud.google.com${NC}"
echo -e "   • ClickUp       → ${YELLOW}app.clickup.com/settings${NC}"
echo -e "   • Notion        → ${YELLOW}notion.so/my-integrations${NC}"
echo -e "   • OpenAI        → ${YELLOW}platform.openai.com/api-keys${NC}"
echo ""
echo -e "${GREEN}🚀 Enjoy! Connect once, control everything.${NC}"
echo ""

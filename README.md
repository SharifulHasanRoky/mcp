# 🚀 Mother MCP — Master Control Platform

**One connection. All your tools. Total control.**

Mother MCP is a unified Model Context Protocol (MCP) server that connects and manages ALL your marketing tools, ad platforms, analytics, project management, and AI tools from a single interface. Connect once, command everything.

```
┌─────────────────────────────────────────────────────────────┐
│                     🎯 MOTHER MCP                           │
│              Master Control Platform v1.0                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📢 ADS          📊 ANALYTICS     📋 PRODUCTIVITY   🤖 AI  │
│  ─────────       ────────────     ──────────────    ─────  │
│  Facebook        GA4              ClickUp           OpenAI  │
│  Google          Tag Manager      Notion            Claude  │
│  TikTok          Looker Studio    Google Docs       Gemini  │
│  Pinterest                        Google Sheets     DALL-E  │
│  LinkedIn                                           Stable  │
│  X (Twitter)                                        Diffn   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Key Features

- **14 Platform Connectors** — All major ad, analytics, PM, and AI platforms
- **60+ Tools** — Campaign management, reporting, content creation, and more
- **Plugin Architecture** — Easy to add new platforms
- **Unified Auth** — One credentials store for all platforms
- **AI-Powered** — Generate ad copy, images, analyze data with OpenAI/Claude/Gemini
- **MCP Standard** — Works with Claude Desktop, Cursor, Kiro, and any MCP client

## 📦 Quick Setup

### 1. Install

```bash
cd mother-mcp
npm install
```

### 2. Configure with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mother-mcp": {
      "command": "node",
      "args": ["/path/to/mother-mcp/src/index.js"]
    }
  }
}
```

### 3. Configure Platforms

Once connected, use the built-in configuration tools:

```
→ mother_status            # See all platforms
→ mother_configure         # Set up credentials for a platform
→ mother_list_tools        # See all available tools
→ mother_help              # Get detailed help
```

## 🔑 Platform Setup

### Ad Platforms

| Platform | Required Credentials | Get From |
|----------|---------------------|----------|
| Facebook Ads | `access_token`, `ad_account_id` | [Meta Developers](https://developers.facebook.com) |
| Google Ads | `developer_token`, `client_id`, `client_secret`, `refresh_token`, `customer_id` | [Google Ads API](https://developers.google.com/google-ads/api) |
| TikTok Ads | `access_token`, `advertiser_id` | [TikTok Marketing API](https://business-api.tiktok.com) |
| Pinterest Ads | `access_token`, `ad_account_id` | [Pinterest Developers](https://developers.pinterest.com) |
| LinkedIn Ads | `access_token`, `ad_account_id` | [LinkedIn Marketing](https://www.linkedin.com/developers) |
| X Ads | `api_key`, `api_secret`, `access_token`, `access_token_secret`, `ad_account_id` | [X Developer](https://developer.x.com) |

### Analytics & Tracking

| Platform | Required Credentials | Get From |
|----------|---------------------|----------|
| GA4 | `access_token`, `property_id` | [Google Cloud Console](https://console.cloud.google.com) |
| Tag Manager | `access_token`, `account_id`, `container_id` | [GTM](https://tagmanager.google.com) |
| Looker Studio | `access_token` | [Google Cloud Console](https://console.cloud.google.com) |

### Productivity

| Platform | Required Credentials | Get From |
|----------|---------------------|----------|
| ClickUp | `api_token`, `team_id` | [ClickUp Settings](https://app.clickup.com) |
| Notion | `api_key` | [Notion Integrations](https://www.notion.so/my-integrations) |
| Google Docs | `access_token` | [Google Cloud Console](https://console.cloud.google.com) |
| Google Sheets | `access_token` | [Google Cloud Console](https://console.cloud.google.com) |

### AI Tools

| Provider | Credential | Get From |
|----------|-----------|----------|
| OpenAI | `openai_api_key` | [OpenAI Platform](https://platform.openai.com) |
| Claude | `anthropic_api_key` | [Anthropic Console](https://console.anthropic.com) |
| Gemini | `gemini_api_key` | [AI Studio](https://aistudio.google.com) |
| Stability AI | `stability_api_key` | [Stability Platform](https://platform.stability.ai) |

## 💡 Usage Examples

### Ad Management

```
"Create a Facebook campaign for my new product launch with $50/day budget"
"Show me Google Ads performance for last 30 days"
"Pause all TikTok campaigns with CPC above $2"
"Create a lookalike audience on Facebook from my best customers"
"Get LinkedIn campaign analytics broken down by job title"
```

### Analytics

```
"Show me real-time active users on GA4"
"What are my top 10 pages by conversions this month?"
"Create a new GA4 event tag in GTM for button clicks"
"Generate Looker Studio embed URL for our dashboard"
"Show traffic sources breakdown for last 30 days"
```

### Productivity

```
"Create a ClickUp task for campaign review, assign to John, due Friday"
"Add a new page in Notion with our weekly marketing report"
"Create a Google Sheet with this month's ad spend data"
"Search Notion for all pages about Q4 strategy"
```

### AI-Powered

```
"Generate 5 ad copy variations for TikTok promoting our summer sale"
"Analyze this performance data and tell me what to optimize"
"Generate relevant hashtags for our Instagram fitness post"
"Create an ad image for our new product launch"
"Rewrite this LinkedIn post for a more casual Twitter audience"
```

## 🏗️ Architecture

```
mother-mcp/
├── src/
│   ├── index.js                    # Main MCP server entry point
│   ├── core/
│   │   ├── base-plugin.js          # Base class for all plugins
│   │   ├── plugin-registry.js      # Plugin registration & discovery
│   │   ├── command-router.js       # Routes commands to plugins
│   │   ├── auth-manager.js         # Credentials storage
│   │   └── config-manager.js       # Global configuration
│   └── plugins/
│       ├── ads/
│       │   ├── facebook-ads.js     # Meta Marketing API
│       │   ├── google-ads.js       # Google Ads API
│       │   ├── tiktok-ads.js       # TikTok Marketing API
│       │   ├── pinterest-ads.js    # Pinterest Marketing API
│       │   ├── linkedin-ads.js     # LinkedIn Marketing API
│       │   └── x-ads.js           # X/Twitter Ads API
│       ├── analytics/
│       │   ├── ga4.js              # GA4 Data API
│       │   ├── tag-manager.js      # GTM API
│       │   └── looker-studio.js    # Looker Studio API
│       ├── productivity/
│       │   ├── clickup.js          # ClickUp API
│       │   ├── notion.js           # Notion API
│       │   ├── google-docs.js      # Google Docs API
│       │   └── google-sheets.js    # Google Sheets API
│       └── ai/
│           └── ai-tools.js         # Multi-provider AI tools
├── package.json
├── mcp-config.json                 # MCP client configuration
├── TOOLS_REFERENCE.md              # Complete tools documentation
└── README.md
```

## 🔌 Adding New Plugins

Create a new plugin by extending `BasePlugin`:

```javascript
import { BasePlugin } from "../../core/base-plugin.js";

export class MyPlugin extends BasePlugin {
  constructor() {
    super({
      id: "my_plugin",
      name: "My Platform",
      category: "ads", // ads | analytics | productivity | ai
      description: "Description of what this plugin does",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "api_key", description: "API Key", required: true },
    ];
  }

  getTools() {
    return [
      {
        name: "my_plugin_action",
        description: "What this tool does",
        inputSchema: { type: "object", properties: { /* ... */ } },
      },
    ];
  }

  async execute(toolName, args) {
    // Handle tool execution
  }
}
```

Then register it in `src/index.js`:

```javascript
import { MyPlugin } from "./plugins/category/my-plugin.js";
plugins.push(new MyPlugin());
```

## 📊 Stats

| Metric | Count |
|--------|-------|
| Total Platforms | 14 |
| Total Tools | 60+ |
| Ad Platforms | 6 |
| Analytics Tools | 3 |
| Productivity Tools | 4 |
| AI Providers | 4 |
| Categories | 4 |

## 📄 License

MIT

---

**Built with ❤️ for marketers who want to control everything from one place.**

*Mother MCP — Connect once, control everything.*

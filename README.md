# 🚀 Mother MCP

**একটা link add করো → সব tools চলবে command দিয়ে।**

---

## কী এটা?

Mother MCP হলো একটা master MCP server — এটা একবার connect করলে তুমি একটা AI client (Claude, Cursor, etc) থেকেই সব platform control করতে পারবে:

- **Facebook Ads** — campaign বানাও, performance দেখো
- **Google Ads** — search ads, keywords, bidding manage করো
- **TikTok Ads** — campaign, audience, creative report
- **Pinterest Ads** — promoted pins, analytics
- **LinkedIn Ads** — B2B campaigns, targeting, lead gen
- **X (Twitter) Ads** — promoted tweets, analytics
- **GA4** — analytics report, real-time, traffic sources
- **Google Tag Manager** — tags, triggers, publish
- **Looker Studio** — reports, embed links
- **ClickUp** — tasks, lists, spaces
- **Notion** — pages, databases, search
- **Google Docs** — create, read, edit documents
- **Google Sheets** — read, write, append data

---

## কিভাবে ব্যবহার করবে

### Step 1: Clone করো

```bash
git clone https://github.com/SharifulHasanRoky/mcp.git
```

### Step 2: Claude Desktop / Cursor config-এ add করো

`claude_desktop_config.json` (বা Cursor settings):

```json
{
  "mcpServers": {
    "mother-mcp": {
      "command": "node",
      "args": ["/path/to/mcp/src/index.js"],
      "env": {
        "FB_ACCESS_TOKEN": "তোমার-token",
        "FB_AD_ACCOUNT_ID": "act_xxxxx",
        "GA4_ACCESS_TOKEN": "তোমার-token",
        "GA4_PROPERTY_ID": "123456789",
        "CLICKUP_TOKEN": "তোমার-token",
        "CLICKUP_TEAM_ID": "xxxxx",
        "NOTION_TOKEN": "secret_xxxxx"
      }
    }
  }
}
```

> **শুধু যেগুলো ব্যবহার করবে সেগুলোর token দাও!** বাকিগুলো দিতে হবে না।

### Step 3: Command দাও!

```
"আমার Facebook campaigns দেখাও"
"GA4 থেকে গত ৭ দিনের top pages দাও"
"ClickUp-এ একটা task বানাও"
"Google Ads performance last 30 days"
"Notion-এ search করো 'marketing plan'"
```

**ব্যাস! এটুকুই!** 🎯

---

## Platform Tokens কোথা থেকে পাবে

| Platform | Token | কোথায় পাবে |
|----------|-------|-------------|
| Facebook Ads | `FB_ACCESS_TOKEN`, `FB_AD_ACCOUNT_ID` | [developers.facebook.com](https://developers.facebook.com) |
| Google Ads | `GOOGLE_ADS_TOKEN`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID` | [Google Ads API](https://developers.google.com/google-ads/api) |
| TikTok Ads | `TIKTOK_ACCESS_TOKEN`, `TIKTOK_ADVERTISER_ID` | [business-api.tiktok.com](https://business-api.tiktok.com) |
| Pinterest | `PINTEREST_ACCESS_TOKEN`, `PINTEREST_AD_ACCOUNT_ID` | [developers.pinterest.com](https://developers.pinterest.com) |
| LinkedIn | `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AD_ACCOUNT_ID` | [linkedin.com/developers](https://www.linkedin.com/developers) |
| X (Twitter) | `X_ACCESS_TOKEN`, `X_AD_ACCOUNT_ID` | [developer.x.com](https://developer.x.com) |
| GA4 | `GA4_ACCESS_TOKEN`, `GA4_PROPERTY_ID` | [Google Cloud Console](https://console.cloud.google.com) |
| Tag Manager | `GTM_ACCESS_TOKEN`, `GTM_ACCOUNT_ID`, `GTM_CONTAINER_ID` | [tagmanager.google.com](https://tagmanager.google.com) |
| Looker Studio | `LOOKER_ACCESS_TOKEN` | [Google Cloud Console](https://console.cloud.google.com) |
| ClickUp | `CLICKUP_TOKEN`, `CLICKUP_TEAM_ID` | ClickUp → Settings → Apps |
| Notion | `NOTION_TOKEN` | [notion.so/my-integrations](https://www.notion.so/my-integrations) |
| Google Docs/Sheets | `GOOGLE_ACCESS_TOKEN` | [Google Cloud Console](https://console.cloud.google.com) |

---

## Available Tools (60+)

Use `mother_status` to see which platforms are connected.
Use `mother_list_tools` to see all available commands.

### Ads (6 platforms)
- `fb_ads_list_campaigns`, `fb_ads_create_campaign`, `fb_ads_get_performance`, `fb_ads_update_campaign`, `fb_ads_create_audience`, `fb_ads_insights_breakdown`
- `google_ads_list_campaigns`, `google_ads_create_campaign`, `google_ads_get_performance`, `google_ads_manage_keywords`, `google_ads_search_terms`
- `tiktok_ads_list_campaigns`, `tiktok_ads_create_campaign`, `tiktok_ads_get_performance`, `tiktok_ads_manage_audience`
- `pinterest_ads_list_campaigns`, `pinterest_ads_create_campaign`, `pinterest_ads_get_analytics`
- `linkedin_ads_list_campaigns`, `linkedin_ads_create_campaign`, `linkedin_ads_get_analytics`, `linkedin_ads_targeting`
- `x_ads_list_campaigns`, `x_ads_create_campaign`, `x_ads_get_analytics`, `x_ads_promote_tweet`

### Analytics (3 platforms)
- `ga4_get_report`, `ga4_realtime`, `ga4_top_pages`, `ga4_traffic_sources`, `ga4_conversions`
- `gtm_list_tags`, `gtm_create_tag`, `gtm_list_triggers`, `gtm_create_trigger`, `gtm_list_variables`, `gtm_publish`
- `looker_list_reports`, `looker_get_report`, `looker_get_embed_url`, `looker_share_report`

### Productivity (4 platforms)
- `clickup_create_task`, `clickup_get_tasks`, `clickup_update_task`, `clickup_get_spaces`, `clickup_get_lists`
- `notion_create_page`, `notion_search`, `notion_query_database`, `notion_update_page`
- `gdocs_create`, `gdocs_read`, `gdocs_append`, `gdocs_find_replace`, `gdocs_list`
- `gsheets_create`, `gsheets_read`, `gsheets_write`, `gsheets_append`

---

## Architecture

```
mcp/
├── src/
│   ├── index.js              ← Entry point (start server)
│   ├── core/
│   │   ├── mcp-server.js     ← MCP protocol handler
│   │   ├── base-plugin.js    ← Plugin base class
│   │   ├── plugin-registry.js ← Plugin registration
│   │   └── command-router.js  ← Routes commands
│   └── plugins/
│       ├── ads/              ← FB, Google, TikTok, Pinterest, LinkedIn, X
│       ├── analytics/        ← GA4, GTM, Looker Studio
│       └── productivity/     ← ClickUp, Notion, Docs, Sheets
├── mcp-config.json           ← Example config (copy to your client)
├── package.json
└── README.md
```

**No external dependencies. Just Node.js.**

---

## License

MIT

**Mother MCP — Link add করো, command দাও, কাজ হবে।** 🔥

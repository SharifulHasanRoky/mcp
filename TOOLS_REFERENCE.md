# Mother MCP - Complete Tools Reference

> All available commands organized by platform. Use `mother_help` for quick start.

---

## 🎛️ System Commands

| Tool | Description |
|------|-------------|
| `mother_status` | Show all connected platforms and their config status |
| `mother_list_tools` | List all tools (filter by category or platform) |
| `mother_configure` | Set up API credentials for a platform |
| `mother_help` | Get help on usage, platforms, and examples |

---

## 📢 Ad Platforms

### Facebook (Meta) Ads — `facebook_ads`

| Tool | Description |
|------|-------------|
| `fb_ads_list_campaigns` | List campaigns with status and budget |
| `fb_ads_create_campaign` | Create campaign (AWARENESS, TRAFFIC, LEADS, SALES, etc) |
| `fb_ads_get_performance` | Get metrics: impressions, clicks, spend, CTR, CPC, ROAS |
| `fb_ads_update_campaign` | Update name, budget, status, schedule |
| `fb_ads_create_audience` | Create custom or lookalike audiences |
| `fb_ads_get_insights` | Breakdown by age, gender, placement, device, country |

### Google Ads — `google_ads`

| Tool | Description |
|------|-------------|
| `google_ads_list_campaigns` | List Search, Display, Video, Shopping, PMax campaigns |
| `google_ads_create_campaign` | Create with bidding strategy and budget |
| `google_ads_get_performance` | Impressions, clicks, conversions, cost, ROAS |
| `google_ads_manage_keywords` | Add, pause, remove keywords with match types |
| `google_ads_get_recommendations` | Google's optimization suggestions |
| `google_ads_search_terms_report` | See actual search queries triggering ads |

### TikTok Ads — `tiktok_ads`

| Tool | Description |
|------|-------------|
| `tiktok_ads_list_campaigns` | List campaigns with status and objective |
| `tiktok_ads_create_campaign` | Create for TRAFFIC, CONVERSIONS, APP_INSTALL, etc |
| `tiktok_ads_get_performance` | Impressions, clicks, conversions, CTR, CPM, CPC |
| `tiktok_ads_manage_audience` | Create/list custom audiences |
| `tiktok_ads_creative_report` | Creative-level performance (which videos win) |

### Pinterest Ads — `pinterest_ads`

| Tool | Description |
|------|-------------|
| `pinterest_ads_list_campaigns` | List campaigns |
| `pinterest_ads_create_campaign` | Create for AWARENESS, CONSIDERATION, CONVERSIONS |
| `pinterest_ads_get_analytics` | Impressions, pin clicks, saves, conversions |
| `pinterest_ads_manage_pins` | Create/manage promoted pins |

### LinkedIn Ads — `linkedin_ads`

| Tool | Description |
|------|-------------|
| `linkedin_ads_list_campaigns` | List B2B campaigns |
| `linkedin_ads_create_campaign` | Create with objectives and ad formats |
| `linkedin_ads_get_analytics` | Impressions, clicks, leads, social actions |
| `linkedin_ads_targeting` | Target by job title, industry, seniority, company size |
| `linkedin_ads_lead_gen` | Manage lead gen forms and get lead data |

### X (Twitter) Ads — `x_ads`

| Tool | Description |
|------|-------------|
| `x_ads_list_campaigns` | List campaigns |
| `x_ads_create_campaign` | Create for engagement, clicks, video views, followers |
| `x_ads_get_analytics` | Impressions, engagements, link clicks, follows |
| `x_ads_promote_tweet` | Promote an existing tweet |
| `x_ads_manage_audience` | Create/manage tailored audiences |

---

## 📊 Analytics & Tracking

### Google Analytics 4 — `ga4`

| Tool | Description |
|------|-------------|
| `ga4_get_report` | Custom report with any dimensions and metrics |
| `ga4_realtime_report` | Live active users and events |
| `ga4_get_top_pages` | Top pages by views, engagement, conversions |
| `ga4_get_traffic_sources` | Traffic by channel, source, medium |
| `ga4_get_conversions` | Conversion events with attribution |
| `ga4_get_user_demographics` | Users by country, device, browser, age |
| `ga4_list_properties` | List all GA4 properties |

### Google Tag Manager — `tag_manager`

| Tool | Description |
|------|-------------|
| `gtm_list_tags` | List all tags in container |
| `gtm_create_tag` | Create GA4, HTML, pixel, or conversion tags |
| `gtm_list_triggers` | List all triggers |
| `gtm_create_trigger` | Create pageview, click, form, custom event triggers |
| `gtm_list_variables` | List all variables |
| `gtm_create_variable` | Create data layer, DOM, cookie, JS variables |
| `gtm_publish_version` | Publish workspace changes live |

### Looker Studio — `looker_studio`

| Tool | Description |
|------|-------------|
| `looker_list_reports` | List all reports |
| `looker_get_report` | Get report details |
| `looker_list_datasources` | List connected data sources |
| `looker_copy_report` | Copy/template a report |
| `looker_share_report` | Manage sharing permissions |
| `looker_get_embed_url` | Generate embed URL or iframe |

---

## 📋 Productivity & Project Management

### ClickUp — `clickup`

| Tool | Description |
|------|-------------|
| `clickup_create_task` | Create task with assignees, priority, due date, tags |
| `clickup_get_tasks` | Get tasks with filters (status, assignee, tags) |
| `clickup_update_task` | Update status, priority, assignees, due date |
| `clickup_get_spaces` | List all spaces |
| `clickup_get_lists` | Get lists in a space or folder |
| `clickup_add_comment` | Add comment to a task |
| `clickup_track_time` | Start/stop/add time tracking |

### Notion — `notion`

| Tool | Description |
|------|-------------|
| `notion_create_page` | Create page in a parent page or database |
| `notion_search` | Search all pages and databases |
| `notion_query_database` | Query database with filters and sorts |
| `notion_update_page` | Update properties or archive |
| `notion_add_block` | Add content blocks (text, headings, code, lists) |
| `notion_create_database` | Create database with custom properties |

### Google Docs — `google_docs`

| Tool | Description |
|------|-------------|
| `gdocs_create` | Create new document |
| `gdocs_read` | Read document content |
| `gdocs_append` | Append text with styling |
| `gdocs_insert_table` | Insert a table |
| `gdocs_find_replace` | Find and replace text |
| `gdocs_list` | List documents in Drive |

### Google Sheets — `google_sheets`

| Tool | Description |
|------|-------------|
| `gsheets_create` | Create new spreadsheet |
| `gsheets_read` | Read data from a range |
| `gsheets_write` | Write data to a range |
| `gsheets_append` | Append rows to end |
| `gsheets_format` | Format cells (bold, color, borders) |
| `gsheets_add_sheet` | Add new sheet/tab |

---

## 🤖 AI Tools

### AI Tools Hub — `ai_tools`

| Tool | Description |
|------|-------------|
| `ai_generate_ad_copy` | Generate ad copy for any platform |
| `ai_generate_image` | Generate images with DALL-E 3 or Stability AI |
| `ai_analyze_performance` | AI analysis of marketing data |
| `ai_summarize_content` | Summarize reports and content |
| `ai_generate_hashtags` | Generate hashtags for social posts |
| `ai_rewrite_content` | Rewrite for different platforms/tones |

---

## 📊 Total: 14 Platforms • 60+ Tools • 1 Connection

All managed through a single Mother MCP interface.

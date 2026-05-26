/**
 * AI Tools Plugin
 * 
 * Unified connector for various AI tools and APIs including
 * OpenAI, Claude, Gemini, Stability AI, and more.
 * Generate ad copy, images, analyze data, and automate content.
 */

import { BasePlugin } from "../../core/base-plugin.js";

export class AIToolsPlugin extends BasePlugin {
  constructor() {
    super({
      id: "ai_tools",
      name: "AI Tools Hub",
      category: "ai",
      description: "Unified AI tools: generate ad copy, images, analyze data, summarize content using OpenAI, Claude, Gemini, and more.",
    });
  }

  getRequiredCredentials() {
    return [
      { key: "openai_api_key", description: "OpenAI API Key", required: false },
      { key: "anthropic_api_key", description: "Anthropic (Claude) API Key", required: false },
      { key: "gemini_api_key", description: "Google Gemini API Key", required: false },
      { key: "stability_api_key", description: "Stability AI API Key (for images)", required: false },
    ];
  }

  isConfigured() {
    // At least one AI provider must be configured
    return this.credentials && (
      this.credentials.openai_api_key ||
      this.credentials.anthropic_api_key ||
      this.credentials.gemini_api_key
    );
  }

  getSetupInstructions() {
    return `Configure at least one AI provider:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Google Gemini: https://aistudio.google.com/apikey
- Stability AI: https://platform.stability.ai/`;
  }

  getTools() {
    return [
      {
        name: "ai_generate_ad_copy",
        description: "Generate ad copy for any platform (Facebook, Google, TikTok, LinkedIn, etc).",
        inputSchema: {
          type: "object",
          properties: {
            platform: {
              type: "string",
              enum: ["facebook", "google_search", "google_display", "tiktok", "linkedin", "pinterest", "x", "instagram"],
              description: "Target ad platform",
            },
            product: { type: "string", description: "Product/service description" },
            target_audience: { type: "string", description: "Target audience description" },
            tone: { type: "string", enum: ["professional", "casual", "urgent", "playful", "luxury", "technical"], description: "Copy tone" },
            cta: { type: "string", description: "Call to action" },
            variations: { type: "number", description: "Number of variations (default 3)" },
            provider: { type: "string", enum: ["openai", "anthropic", "gemini"], description: "AI provider to use" },
          },
          required: ["platform", "product"],
        },
      },
      {
        name: "ai_generate_image",
        description: "Generate images for ads, social media, or marketing using AI.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "Image generation prompt" },
            style: { type: "string", enum: ["photorealistic", "illustration", "3d", "minimal", "abstract", "flat"], description: "Image style" },
            size: { type: "string", enum: ["1024x1024", "1792x1024", "1024x1792"], description: "Image dimensions" },
            provider: { type: "string", enum: ["openai", "stability"], description: "Image AI provider" },
          },
          required: ["prompt"],
        },
      },
      {
        name: "ai_analyze_performance",
        description: "AI-powered analysis of marketing performance data with recommendations.",
        inputSchema: {
          type: "object",
          properties: {
            data: { type: "string", description: "Performance data (JSON or text)" },
            analysis_type: {
              type: "string",
              enum: ["trends", "anomalies", "optimization", "competitor", "forecast"],
              description: "Type of analysis",
            },
            context: { type: "string", description: "Additional context (industry, goals, etc)" },
          },
          required: ["data"],
        },
      },
      {
        name: "ai_summarize_content",
        description: "Summarize long content, reports, or data into key insights.",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string", description: "Content to summarize" },
            format: { type: "string", enum: ["bullet_points", "executive_summary", "one_liner", "detailed"], description: "Summary format" },
            max_length: { type: "number", description: "Max words in summary" },
          },
          required: ["content"],
        },
      },
      {
        name: "ai_generate_hashtags",
        description: "Generate relevant hashtags for social media posts.",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string", description: "Post content or topic" },
            platform: { type: "string", enum: ["instagram", "tiktok", "linkedin", "x", "pinterest"], description: "Target platform" },
            count: { type: "number", description: "Number of hashtags (default 15)" },
            mix: { type: "string", enum: ["popular", "niche", "mixed"], description: "Hashtag popularity mix" },
          },
          required: ["content"],
        },
      },
      {
        name: "ai_rewrite_content",
        description: "Rewrite content for different platforms, tones, or audiences.",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string", description: "Original content" },
            target_platform: { type: "string", description: "Target platform" },
            target_tone: { type: "string", enum: ["formal", "casual", "humorous", "inspirational", "urgent"], description: "Target tone" },
            target_length: { type: "string", enum: ["shorter", "same", "longer"], description: "Length adjustment" },
          },
          required: ["content"],
        },
      },
    ];
  }

  async execute(toolName, args) {
    const provider = args.provider || this.getDefaultProvider();

    switch (toolName) {
      case "ai_generate_ad_copy":
        return this.generateAdCopy(provider, args);
      case "ai_generate_image":
        return this.generateImage(args);
      case "ai_analyze_performance":
        return this.analyzePerformance(provider, args);
      case "ai_summarize_content":
        return this.summarizeContent(provider, args);
      case "ai_generate_hashtags":
        return this.generateHashtags(provider, args);
      case "ai_rewrite_content":
        return this.rewriteContent(provider, args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  getDefaultProvider() {
    if (this.credentials.openai_api_key) return "openai";
    if (this.credentials.anthropic_api_key) return "anthropic";
    if (this.credentials.gemini_api_key) return "gemini";
    throw new Error("No AI provider configured");
  }

  async callAI(provider, prompt, systemPrompt) {
    if (provider === "openai") return this.callOpenAI(prompt, systemPrompt);
    if (provider === "anthropic") return this.callAnthropic(prompt, systemPrompt);
    if (provider === "gemini") return this.callGemini(prompt, systemPrompt);
    throw new Error(`Unknown provider: ${provider}`);
  }

  async callOpenAI(prompt, systemPrompt) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.credentials.openai_api_key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      }),
    });
    const data = await response.json();
    return data.choices[0].message.content;
  }

  async callAnthropic(prompt, systemPrompt) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.credentials.anthropic_api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    return data.content[0].text;
  }

  async callGemini(prompt, systemPrompt) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.credentials.gemini_api_key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
        }),
      }
    );
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async generateAdCopy(provider, args) {
    const systemPrompt = "You are an expert digital marketing copywriter. Generate compelling ad copy optimized for the specified platform.";
    const prompt = `Generate ${args.variations || 3} ad copy variations for ${args.platform}:
Product: ${args.product}
${args.target_audience ? `Target Audience: ${args.target_audience}` : ""}
${args.tone ? `Tone: ${args.tone}` : ""}
${args.cta ? `CTA: ${args.cta}` : ""}

For each variation provide: Headline, Primary Text, Description, and CTA button text.
Format as JSON array.`;

    const result = await this.callAI(provider, prompt, systemPrompt);
    return { provider, platform: args.platform, result };
  }

  async generateImage(args) {
    const provider = args.provider || "openai";
    if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.credentials.openai_api_key}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `${args.style ? `Style: ${args.style}. ` : ""}${args.prompt}`,
          n: 1,
          size: args.size || "1024x1024",
        }),
      });
      return response.json();
    }
    if (provider === "stability") {
      const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.credentials.stability_api_key}`,
        },
        body: JSON.stringify({
          text_prompts: [{ text: args.prompt, weight: 1 }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          style_preset: args.style || "photographic",
        }),
      });
      return response.json();
    }
  }

  async analyzePerformance(provider, args) {
    const systemPrompt = "You are a digital marketing analytics expert. Analyze the data and provide actionable insights.";
    const prompt = `Analyze this marketing performance data:
${args.data}
Analysis type: ${args.analysis_type || "optimization"}
${args.context ? `Context: ${args.context}` : ""}

Provide: Key findings, trends, anomalies, and specific recommendations.`;

    const result = await this.callAI(provider, prompt, systemPrompt);
    return { analysis_type: args.analysis_type, result };
  }

  async summarizeContent(provider, args) {
    const systemPrompt = "You are an expert content summarizer.";
    const prompt = `Summarize the following content in ${args.format || "bullet_points"} format${args.max_length ? ` (max ${args.max_length} words)` : ""}:\n\n${args.content}`;

    const result = await this.callAI(provider, prompt, systemPrompt);
    return { format: args.format, result };
  }

  async generateHashtags(provider, args) {
    const systemPrompt = "You are a social media expert specializing in hashtag strategy.";
    const prompt = `Generate ${args.count || 15} ${args.mix || "mixed"} hashtags for ${args.platform || "instagram"}:
Content/Topic: ${args.content}
Return as JSON array of hashtags.`;

    const result = await this.callAI(provider, prompt, systemPrompt);
    return { platform: args.platform, result };
  }

  async rewriteContent(provider, args) {
    const systemPrompt = "You are a content adaptation expert.";
    const prompt = `Rewrite this content:
"${args.content}"
Target platform: ${args.target_platform || "general"}
Target tone: ${args.target_tone || "casual"}
Length: ${args.target_length || "same"}`;

    const result = await this.callAI(provider, prompt, systemPrompt);
    return { result };
  }
}

"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Anthropic } from "@anthropic-ai/sdk";

const MAX_MESSAGES = 50;
const MAX_TOTAL_CHARS = 100_000;
const MAX_PROMPT_CHARS = 4_000;

const DEFAULT_SYSTEM_PROMPT = `You are TanStack Chat, an AI assistant. Respond in clear, well-structured Markdown: use headers for sections, bullet points or numbered steps for lists, fenced code blocks with a language tag for code, and keep answers concise with short focused paragraphs.`;

// Runs on the server. ANTHROPIC_API_KEY lives in the Convex deployment env.
export const generate = action({
  args: {
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    systemPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Server is missing ANTHROPIC_API_KEY");
    }

    const messages = args.messages
      .filter(
        (m) =>
          m.content.trim() !== "" &&
          !m.content.startsWith("Sorry, I encountered an error")
      )
      .map((m) => ({ role: m.role, content: m.content.trim() }));

    if (messages.length === 0) {
      throw new Error("No valid messages to send");
    }
    const totalChars = messages.reduce((n, m) => n + m.content.length, 0);
    if (messages.length > MAX_MESSAGES || totalChars > MAX_TOTAL_CHARS) {
      throw new Error("Conversation is too long. Start a new chat.");
    }
    if ((args.systemPrompt?.length ?? 0) > MAX_PROMPT_CHARS) {
      throw new Error("Custom prompt is too long.");
    }

    await ctx.runMutation(internal.usage.consume, { userId });

    const system = args.systemPrompt
      ? `${DEFAULT_SYSTEM_PROMPT}\n\n${args.systemPrompt}`
      : DEFAULT_SYSTEM_PROMPT;

    const anthropic = new Anthropic({ apiKey, timeout: 60_000 });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 4096,
      system,
      messages,
    });

    return response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");
  },
});

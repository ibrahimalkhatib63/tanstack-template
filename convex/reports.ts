import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Lets users flag an AI response as harmful or inappropriate
// (App Store guideline 1.2 for apps with generated content).
export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }
    const message = conversation.messages.find((m) => m.id === args.messageId);
    if (!message) throw new Error("Message not found");
    await ctx.db.insert("reports", {
      userId,
      conversationId: args.conversationId,
      messageId: args.messageId,
      content: message.content,
      reason: args.reason.slice(0, 500),
    });
  },
});

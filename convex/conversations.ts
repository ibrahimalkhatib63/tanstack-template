import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }
  return userId;
}

// Returns the conversation only if it belongs to the caller.
async function getOwned(
  ctx: QueryCtx | MutationCtx,
  id: Id<"conversations">
): Promise<Doc<"conversations">> {
  const userId = await requireUserId(ctx);
  const conversation = await ctx.db.get(id);
  if (!conversation || conversation.userId !== userId) {
    throw new Error("Conversation not found");
  }
  return conversation;
}

const messageValidator = v.object({
  id: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
});

// Get the caller's conversations
export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get a specific conversation (must be the caller's)
export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const conversation = await ctx.db.get(args.id);
    return conversation && conversation.userId === userId ? conversation : null;
  },
});

// Create a new conversation
export const create = mutation({
  args: {
    title: v.string(),
    messages: v.optional(v.array(messageValidator)),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db.insert("conversations", {
      userId,
      title: args.title,
      messages: args.messages || [],
    });
  },
});

// Update conversation title
export const updateTitle = mutation({
  args: {
    id: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await getOwned(ctx, args.id);
    return await ctx.db.patch(args.id, { title: args.title });
  },
});

// Add a message to a conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    message: messageValidator,
  },
  handler: async (ctx, args) => {
    const conversation = await getOwned(ctx, args.conversationId);
    return await ctx.db.patch(args.conversationId, {
      messages: [...conversation.messages, args.message],
    });
  },
});

// Delete a conversation
export const remove = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    await getOwned(ctx, args.id);
    await ctx.db.delete(args.id);
  },
});

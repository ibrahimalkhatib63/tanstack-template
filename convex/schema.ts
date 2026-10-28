import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  }).index("by_user", ["userId"]),
  // One row per user per UTC day, used to cap Claude usage.
  usage: defineTable({
    userId: v.id("users"),
    day: v.string(),
    count: v.number(),
  }).index("by_user_day", ["userId", "day"]),
});

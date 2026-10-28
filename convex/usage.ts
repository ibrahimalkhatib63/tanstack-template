import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const DAILY_LIMIT = 50;

// Counts one Claude request for the user today; throws once the cap is hit.
export const consume = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const day = new Date().toISOString().slice(0, 10);
    const row = await ctx.db
      .query("usage")
      .withIndex("by_user_day", (q) => q.eq("userId", args.userId).eq("day", day))
      .unique();
    if (row && row.count >= DAILY_LIMIT) {
      throw new Error("Daily message limit reached. Try again tomorrow.");
    }
    if (row) {
      await ctx.db.patch(row._id, { count: row.count + 1 });
    } else {
      await ctx.db.insert("usage", { userId: args.userId, day, count: 1 });
    }
  },
});

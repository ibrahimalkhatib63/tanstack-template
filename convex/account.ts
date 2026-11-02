import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Permanently deletes the signed-in user and everything tied to them.
// Required by App Store guideline 5.1.1(v).
export const deleteAccount = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const c of conversations) await ctx.db.delete(c._id);

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const r of reports) await ctx.db.delete(r._id);

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_user_day", (q) => q.eq("userId", userId))
      .collect();
    for (const u of usage) await ctx.db.delete(u._id);

    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const s of sessions) {
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", s._id))
        .collect();
      for (const t of tokens) await ctx.db.delete(t._id);
      await ctx.db.delete(s._id);
    }

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const a of accounts) {
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", a._id))
        .collect();
      for (const c of codes) await ctx.db.delete(c._id);
      await ctx.db.delete(a._id);
    }

    await ctx.db.delete(userId);
  },
});

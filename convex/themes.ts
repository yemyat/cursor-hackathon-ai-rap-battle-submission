import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * List all battle themes
 */
export const listThemes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("themes"),
      _creationTime: v.number(),
      name: v.string(),
      side1Name: v.string(),
      side2Name: v.string(),
      description: v.string(),
      order: v.number(),
    })
  ),
  handler: async (ctx) => {
    const themes = await ctx.db.query("themes").order("asc").collect();
    // Sort by order field
    return themes.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get single theme by ID
 */
export const getTheme = query({
  args: { themeId: v.id("themes") },
  returns: v.union(
    v.object({
      _id: v.id("themes"),
      _creationTime: v.number(),
      name: v.string(),
      side1Name: v.string(),
      side2Name: v.string(),
      description: v.string(),
      order: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => await ctx.db.get(args.themeId),
});

/**
 * Initialize predefined themes (run once)
 */
export const seedThemes = mutation({
  args: {},
  returns: v.array(v.id("themes")),
  handler: async (ctx) => {
    // Check if themes already exist
    const existing = await ctx.db.query("themes").first();
    if (existing) {
      throw new Error("Themes already seeded");
    }

    const themes = [
      {
        name: "Claude vs Gemini",
        side1Name: "Claude",
        side2Name: "Gemini",
        description: "Battle of the AI titans - Anthropic's Claude faces off against Google's Gemini",
        order: 1,
      },
      {
        name: "Supabase vs Convex",
        side1Name: "Supabase",
        side2Name: "Convex",
        description: "Backend battle royale - open source PostgreSQL vs reactive real-time platform",
        order: 2,
      },
      {
        name: "Python vs Javascript",
        side1Name: "Python",
        side2Name: "Javascript",
        description: "Classic programming language showdown - snake simplicity vs web domination",
        order: 3,
      },
      {
        name: "GPT vs Grok",
        side1Name: "GPT",
        side2Name: "Grok",
        description: "OpenAI's flagship model battles xAI's rebellious challenger",
        order: 4,
      },
    ];

    const ids: Array<Id<"themes">> = [];
    for (const theme of themes) {
      const id = await ctx.db.insert("themes", theme);
      ids.push(id);
    }

    return ids;
  },
});


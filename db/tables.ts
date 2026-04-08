import { column, defineTable, NOW } from "astro:db";

export const AdCopies = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    userId: column.text(),
    title: column.text(),
    campaignName: column.text({ optional: true }),
    channel: column.text({
      enum: [
        "google-search",
        "facebook",
        "instagram",
        "linkedin",
        "x",
        "email",
        "display",
        "general",
      ],
    }),
    audience: column.text({ optional: true }),
    offer: column.text({ optional: true }),
    callToAction: column.text({ optional: true }),
    headline: column.text({ optional: true }),
    primaryText: column.text({ optional: true }),
    secondaryText: column.text({ optional: true }),
    notes: column.text({ optional: true }),
    status: column.text({ enum: ["draft", "active", "paused"], default: "draft" }),
    isFavorite: column.boolean({ default: false }),
    isArchived: column.boolean({ default: false }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
  indexes: [
    { on: ["userId"] },
    { on: ["userId", "channel"] },
    { on: ["userId", "status"] },
    { on: ["userId", "isFavorite"] },
    { on: ["userId", "isArchived"] },
    { on: ["userId", "updatedAt"] },
  ],
});

export const adCopyAssistantTables = {
  AdCopies,
} as const;

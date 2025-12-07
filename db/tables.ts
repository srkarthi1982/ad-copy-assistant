/**
 * Ad Copy Assistant - generate and manage ad copy variations for campaigns.
 *
 * Design goals:
 * - Group ad copies under campaigns (per product or objective).
 * - Support multiple channels (Google Ads, Meta, LinkedIn, etc.).
 * - Track variations and performance metadata (future-ready).
 */

import { defineTable, column, NOW } from "astro:db";

export const AdCampaigns = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),
    name: column.text(),                           // e.g. "Black Friday 2025 - Shoes"
    objective: column.text({ optional: true }),    // "traffic", "leads", "sales"
    productName: column.text({ optional: true }),
    targetAudience: column.text({ optional: true }),
    notes: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const AdCopies = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    campaignId: column.text({
      references: () => AdCampaigns.columns.id,
    }),
    userId: column.text(),                         // duplicated for convenience
    platform: column.text({ optional: true }),     // "google", "facebook", "instagram", etc.
    headline: column.text({ optional: true }),
    primaryText: column.text(),                    // main ad copy
    description: column.text({ optional: true }),  // optional second line
    callToAction: column.text({ optional: true }), // e.g. "Sign up", "Shop now"
    tone: column.text({ optional: true }),         // "formal", "funny", etc.
    variantLabel: column.text({ optional: true }), // "A", "B", "C"
    url: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const AdPerformance = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    adCopyId: column.text({
      references: () => AdCopies.columns.id,
    }),
    date: column.date({ optional: true }),
    impressions: column.number({ optional: true }),
    clicks: column.number({ optional: true }),
    conversions: column.number({ optional: true }),
    spend: column.number({ optional: true }),
    currency: column.text({ optional: true }),
    notes: column.text({ optional: true }),
  },
});

export const tables = {
  AdCampaigns,
  AdCopies,
  AdPerformance,
} as const;

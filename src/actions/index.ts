import { defineAction, ActionError, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import {
  AdCampaigns,
  AdCopies,
  AdPerformance,
  and,
  db,
  eq,
} from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

async function getOwnedCampaign(campaignId: string, userId: string) {
  const [campaign] = await db
    .select()
    .from(AdCampaigns)
    .where(and(eq(AdCampaigns.id, campaignId), eq(AdCampaigns.userId, userId)));

  if (!campaign) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Campaign not found.",
    });
  }

  return campaign;
}

async function getOwnedAdCopy(adCopyId: string, userId: string) {
  const [adCopy] = await db
    .select()
    .from(AdCopies)
    .where(and(eq(AdCopies.id, adCopyId), eq(AdCopies.userId, userId)));

  if (!adCopy) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Ad copy not found.",
    });
  }

  return adCopy;
}

export const server = {
  createCampaign: defineAction({
    input: z.object({
      name: z.string().min(1),
      objective: z.string().optional(),
      productName: z.string().optional(),
      targetAudience: z.string().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const [campaign] = await db
        .insert(AdCampaigns)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          name: input.name,
          objective: input.objective,
          productName: input.productName,
          targetAudience: input.targetAudience,
          notes: input.notes,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        success: true,
        data: { campaign },
      };
    },
  }),

  updateCampaign: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1).optional(),
        objective: z.string().optional(),
        productName: z.string().optional(),
        targetAudience: z.string().optional(),
        notes: z.string().optional(),
      })
      .refine(
        (input) =>
          input.name !== undefined ||
          input.objective !== undefined ||
          input.productName !== undefined ||
          input.targetAudience !== undefined ||
          input.notes !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedCampaign(input.id, user.id);

      const [campaign] = await db
        .update(AdCampaigns)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.objective !== undefined ? { objective: input.objective } : {}),
          ...(input.productName !== undefined ? { productName: input.productName } : {}),
          ...(input.targetAudience !== undefined
            ? { targetAudience: input.targetAudience }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: new Date(),
        })
        .where(eq(AdCampaigns.id, input.id))
        .returning();

      return {
        success: true,
        data: { campaign },
      };
    },
  }),

  listCampaigns: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const user = requireUser(context);

      const campaigns = await db
        .select()
        .from(AdCampaigns)
        .where(eq(AdCampaigns.userId, user.id));

      return {
        success: true,
        data: { items: campaigns, total: campaigns.length },
      };
    },
  }),

  createAdCopy: defineAction({
    input: z.object({
      campaignId: z.string().min(1),
      platform: z.string().optional(),
      headline: z.string().optional(),
      primaryText: z.string().min(1),
      description: z.string().optional(),
      callToAction: z.string().optional(),
      tone: z.string().optional(),
      variantLabel: z.string().optional(),
      url: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedCampaign(input.campaignId, user.id);
      const now = new Date();

      const [adCopy] = await db
        .insert(AdCopies)
        .values({
          id: crypto.randomUUID(),
          campaignId: input.campaignId,
          userId: user.id,
          platform: input.platform,
          headline: input.headline,
          primaryText: input.primaryText,
          description: input.description,
          callToAction: input.callToAction,
          tone: input.tone,
          variantLabel: input.variantLabel,
          url: input.url,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        success: true,
        data: { adCopy },
      };
    },
  }),

  updateAdCopy: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        campaignId: z.string().min(1),
        platform: z.string().optional(),
        headline: z.string().optional(),
        primaryText: z.string().optional(),
        description: z.string().optional(),
        callToAction: z.string().optional(),
        tone: z.string().optional(),
        variantLabel: z.string().optional(),
        url: z.string().optional(),
      })
      .refine(
        (input) =>
          input.platform !== undefined ||
          input.headline !== undefined ||
          input.primaryText !== undefined ||
          input.description !== undefined ||
          input.callToAction !== undefined ||
          input.tone !== undefined ||
          input.variantLabel !== undefined ||
          input.url !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedCampaign(input.campaignId, user.id);

      const [existing] = await db
        .select()
        .from(AdCopies)
        .where(
          and(
            eq(AdCopies.id, input.id),
            eq(AdCopies.campaignId, input.campaignId),
            eq(AdCopies.userId, user.id)
          )
        );

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Ad copy not found.",
        });
      }

      const [adCopy] = await db
        .update(AdCopies)
        .set({
          ...(input.platform !== undefined ? { platform: input.platform } : {}),
          ...(input.headline !== undefined ? { headline: input.headline } : {}),
          ...(input.primaryText !== undefined ? { primaryText: input.primaryText } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.callToAction !== undefined ? { callToAction: input.callToAction } : {}),
          ...(input.tone !== undefined ? { tone: input.tone } : {}),
          ...(input.variantLabel !== undefined ? { variantLabel: input.variantLabel } : {}),
          ...(input.url !== undefined ? { url: input.url } : {}),
          updatedAt: new Date(),
        })
        .where(eq(AdCopies.id, input.id))
        .returning();

      return {
        success: true,
        data: { adCopy },
      };
    },
  }),

  deleteAdCopy: defineAction({
    input: z.object({
      id: z.string().min(1),
      campaignId: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedCampaign(input.campaignId, user.id);

      const result = await db
        .delete(AdCopies)
        .where(
          and(
            eq(AdCopies.id, input.id),
            eq(AdCopies.campaignId, input.campaignId),
            eq(AdCopies.userId, user.id)
          )
        );

      if (result.rowsAffected === 0) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Ad copy not found.",
        });
      }

      return { success: true };
    },
  }),

  listAdCopies: defineAction({
    input: z.object({
      campaignId: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedCampaign(input.campaignId, user.id);

      const copies = await db
        .select()
        .from(AdCopies)
        .where(
          and(
            eq(AdCopies.campaignId, input.campaignId),
            eq(AdCopies.userId, user.id)
          )
        );

      return {
        success: true,
        data: { items: copies, total: copies.length },
      };
    },
  }),

  logAdPerformance: defineAction({
    input: z.object({
      adCopyId: z.string().min(1),
      date: z.date().optional(),
      impressions: z.number().optional(),
      clicks: z.number().optional(),
      conversions: z.number().optional(),
      spend: z.number().optional(),
      currency: z.string().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const adCopy = await getOwnedAdCopy(input.adCopyId, user.id);
      await getOwnedCampaign(adCopy.campaignId, user.id);

      const [performance] = await db
        .insert(AdPerformance)
        .values({
          id: crypto.randomUUID(),
          adCopyId: input.adCopyId,
          date: input.date ?? new Date(),
          impressions: input.impressions,
          clicks: input.clicks,
          conversions: input.conversions,
          spend: input.spend,
          currency: input.currency,
          notes: input.notes,
        })
        .returning();

      return {
        success: true,
        data: { performance },
      };
    },
  }),

  listAdPerformance: defineAction({
    input: z.object({
      adCopyId: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const adCopy = await getOwnedAdCopy(input.adCopyId, user.id);
      await getOwnedCampaign(adCopy.campaignId, user.id);

      const performances = await db
        .select()
        .from(AdPerformance)
        .where(eq(AdPerformance.adCopyId, input.adCopyId));

      return {
        success: true,
        data: { items: performances, total: performances.length },
      };
    },
  }),
};

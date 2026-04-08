import { defineAction, ActionError } from "astro:actions";
import type { ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import {
  AD_COPY_CHANNELS,
  AD_COPY_STATUSES,
  archiveAdCopyForUser,
  createAdCopyForUser,
  createAdCopyVariantForUser,
  getAdCopyDetailForUser,
  listAdCopiesForUser,
  parseAdCopyVariantInput,
  restoreAdCopyForUser,
  toggleAdCopyFavoriteForUser,
  toggleAdCopyVariantFavoriteForUser,
  updateAdCopyForUser,
  updateAdCopyVariantForUser,
} from "../lib/adCopies";

function requireUser(context: ActionAPIContext) {
  const user = (context.locals as App.Locals | undefined)?.user;
  if (!user) {
    throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in to continue." });
  }
  return user;
}

const adCopyInput = z.object({
  title: z.string().trim().min(1),
  campaignName: z.string().trim().optional(),
  channel: z.enum(AD_COPY_CHANNELS),
  audience: z.string().trim().optional(),
  offer: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(AD_COPY_STATUSES).default("draft"),
});

const variantInput = z.object({
  label: z.string().trim().optional(),
  headline: z.string().trim().optional(),
  primaryText: z.string().trim().optional(),
  secondaryText: z.string().trim().optional(),
  callToAction: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const server = {
  createAdCopy: defineAction({
    input: adCopyInput,
    handler: async (input, context) => {
      const user = requireUser(context);
      return { adCopy: await createAdCopyForUser(user.id, input) };
    },
  }),
  updateAdCopy: defineAction({
    input: adCopyInput.extend({ id: z.number().int() }),
    handler: async ({ id, ...input }, context) => {
      const user = requireUser(context);
      return { adCopy: await updateAdCopyForUser(user.id, id, input) };
    },
  }),
  createAdCopyVariant: defineAction({
    input: variantInput.extend({ adCopyId: z.number().int() }),
    handler: async ({ adCopyId, ...input }, context) => {
      const user = requireUser(context);
      return {
        variant: await createAdCopyVariantForUser(user.id, adCopyId, parseAdCopyVariantInput(input)),
      };
    },
  }),
  updateAdCopyVariant: defineAction({
    input: variantInput.extend({ adCopyId: z.number().int(), variantId: z.number().int() }),
    handler: async ({ adCopyId, variantId, ...input }, context) => {
      const user = requireUser(context);
      return {
        variant: await updateAdCopyVariantForUser(
          user.id,
          adCopyId,
          variantId,
          parseAdCopyVariantInput(input),
        ),
      };
    },
  }),
  toggleAdCopyVariantFavorite: defineAction({
    input: z.object({ adCopyId: z.number().int(), variantId: z.number().int() }),
    handler: async ({ adCopyId, variantId }, context) => {
      const user = requireUser(context);
      return {
        variant: await toggleAdCopyVariantFavoriteForUser(user.id, adCopyId, variantId),
      };
    },
  }),
  toggleAdCopyFavorite: defineAction({
    input: z.object({ id: z.number().int() }),
    handler: async ({ id }, context) => {
      const user = requireUser(context);
      return { adCopy: await toggleAdCopyFavoriteForUser(user.id, id) };
    },
  }),
  archiveAdCopy: defineAction({
    input: z.object({ id: z.number().int() }),
    handler: async ({ id }, context) => {
      const user = requireUser(context);
      return { adCopy: await archiveAdCopyForUser(user.id, id) };
    },
  }),
  restoreAdCopy: defineAction({
    input: z.object({ id: z.number().int() }),
    handler: async ({ id }, context) => {
      const user = requireUser(context);
      return { adCopy: await restoreAdCopyForUser(user.id, id) };
    },
  }),
  listAdCopies: defineAction({
    input: z.object({
      search: z.string().trim().optional(),
      channel: z.enum(AD_COPY_CHANNELS).optional(),
      status: z.enum(AD_COPY_STATUSES).optional(),
      favoriteOnly: z.boolean().optional(),
      archived: z.boolean().optional(),
    }).optional(),
    handler: async (input, context) => {
      const user = requireUser(context);
      return { adCopies: await listAdCopiesForUser(user.id, input ?? {}) };
    },
  }),
  getAdCopyDetail: defineAction({
    input: z.object({ id: z.number().int() }),
    handler: async ({ id }, context) => {
      const user = requireUser(context);
      return { adCopy: await getAdCopyDetailForUser(user.id, id) };
    },
  }),
};

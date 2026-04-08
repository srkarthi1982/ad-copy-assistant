import { ActionError } from "astro:actions";
import { AdCopies, and, db, desc, eq } from "astro:db";

export const AD_COPY_CHANNELS = [
  "google-search",
  "facebook",
  "instagram",
  "linkedin",
  "x",
  "email",
  "display",
  "general",
] as const;

export const AD_COPY_STATUSES = ["draft", "active", "paused"] as const;

export type AdCopyChannel = (typeof AD_COPY_CHANNELS)[number];
export type AdCopyStatus = (typeof AD_COPY_STATUSES)[number];

export type AdCopyInput = {
  title: string;
  campaignName?: string | null;
  channel: AdCopyChannel;
  audience?: string | null;
  offer?: string | null;
  callToAction?: string | null;
  headline?: string | null;
  primaryText?: string | null;
  secondaryText?: string | null;
  notes?: string | null;
  status?: AdCopyStatus;
};

export type AdCopyListFilters = {
  search?: string;
  channel?: AdCopyChannel | "";
  status?: AdCopyStatus | "";
  favoriteOnly?: boolean;
  archived?: boolean;
};

function asOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function ensureChannel(value: string): AdCopyChannel {
  if ((AD_COPY_CHANNELS as readonly string[]).includes(value)) {
    return value as AdCopyChannel;
  }
  throw new ActionError({ code: "BAD_REQUEST", message: "Invalid channel." });
}

function ensureStatus(value: string): AdCopyStatus {
  if ((AD_COPY_STATUSES as readonly string[]).includes(value)) {
    return value as AdCopyStatus;
  }
  throw new ActionError({ code: "BAD_REQUEST", message: "Invalid status." });
}

function ensureTitle(value: string) {
  const title = value.trim();
  if (!title) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Title is required." });
  }
  return title;
}

export function parseAdCopyInput(input: Record<string, FormDataEntryValue | null>): AdCopyInput {
  return {
    title: ensureTitle(String(input.title ?? "")),
    campaignName: asOptional(String(input.campaignName ?? "")),
    channel: ensureChannel(String(input.channel ?? "")),
    audience: asOptional(String(input.audience ?? "")),
    offer: asOptional(String(input.offer ?? "")),
    callToAction: asOptional(String(input.callToAction ?? "")),
    headline: asOptional(String(input.headline ?? "")),
    primaryText: asOptional(String(input.primaryText ?? "")),
    secondaryText: asOptional(String(input.secondaryText ?? "")),
    notes: asOptional(String(input.notes ?? "")),
    status: ensureStatus(String(input.status ?? "draft")),
  };
}

async function loadOwnedAdCopy(userId: string, id: number) {
  const [record] = await db
    .select()
    .from(AdCopies)
    .where(and(eq(AdCopies.userId, userId), eq(AdCopies.id, id)))
    .limit(1);

  if (!record) {
    throw new ActionError({ code: "NOT_FOUND", message: "Ad copy record not found." });
  }

  return record;
}

export async function listAdCopiesForUser(userId: string, filters: AdCopyListFilters = {}) {
  const records = await db
    .select()
    .from(AdCopies)
    .where(eq(AdCopies.userId, userId))
    .orderBy(desc(AdCopies.updatedAt));

  const query = (filters.search ?? "").trim().toLowerCase();
  return records.filter((record) => {
    const matchesArchived = typeof filters.archived === "boolean" ? record.isArchived === filters.archived : true;
    const matchesChannel = filters.channel ? record.channel === filters.channel : true;
    const matchesStatus = filters.status ? record.status === filters.status : true;
    const matchesFavorite = filters.favoriteOnly ? record.isFavorite : true;
    const matchesSearch = query
      ? [
          record.title,
          record.campaignName ?? "",
          record.channel,
          record.headline ?? "",
          record.primaryText ?? "",
          record.notes ?? "",
        ].some((value) => value.toLowerCase().includes(query))
      : true;

    return matchesArchived && matchesChannel && matchesStatus && matchesFavorite && matchesSearch;
  });
}

export async function getAdCopyDetailForUser(userId: string, id: number) {
  return loadOwnedAdCopy(userId, id);
}

export async function createAdCopyForUser(userId: string, input: AdCopyInput) {
  const now = new Date();
  const [record] = await db
    .insert(AdCopies)
    .values({
      userId,
      title: input.title,
      campaignName: input.campaignName ?? null,
      channel: input.channel,
      audience: input.audience ?? null,
      offer: input.offer ?? null,
      callToAction: input.callToAction ?? null,
      headline: input.headline ?? null,
      primaryText: input.primaryText ?? null,
      secondaryText: input.secondaryText ?? null,
      notes: input.notes ?? null,
      status: input.status ?? "draft",
      isFavorite: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return record;
}

export async function updateAdCopyForUser(userId: string, id: number, input: AdCopyInput) {
  await loadOwnedAdCopy(userId, id);
  const [record] = await db
    .update(AdCopies)
    .set({
      title: input.title,
      campaignName: input.campaignName ?? null,
      channel: input.channel,
      audience: input.audience ?? null,
      offer: input.offer ?? null,
      callToAction: input.callToAction ?? null,
      headline: input.headline ?? null,
      primaryText: input.primaryText ?? null,
      secondaryText: input.secondaryText ?? null,
      notes: input.notes ?? null,
      status: input.status ?? "draft",
      updatedAt: new Date(),
    })
    .where(and(eq(AdCopies.userId, userId), eq(AdCopies.id, id)))
    .returning();

  return record;
}

export async function toggleAdCopyFavoriteForUser(userId: string, id: number) {
  const existing = await loadOwnedAdCopy(userId, id);
  const [record] = await db
    .update(AdCopies)
    .set({
      isFavorite: !existing.isFavorite,
      updatedAt: new Date(),
    })
    .where(and(eq(AdCopies.userId, userId), eq(AdCopies.id, id)))
    .returning();

  return record;
}

export async function archiveAdCopyForUser(userId: string, id: number) {
  const existing = await loadOwnedAdCopy(userId, id);
  if (existing.isArchived) return existing;

  const [record] = await db
    .update(AdCopies)
    .set({
      isArchived: true,
      updatedAt: new Date(),
    })
    .where(and(eq(AdCopies.userId, userId), eq(AdCopies.id, id)))
    .returning();

  return record;
}

export async function restoreAdCopyForUser(userId: string, id: number) {
  const existing = await loadOwnedAdCopy(userId, id);
  if (!existing.isArchived) return existing;

  const [record] = await db
    .update(AdCopies)
    .set({
      isArchived: false,
      updatedAt: new Date(),
    })
    .where(and(eq(AdCopies.userId, userId), eq(AdCopies.id, id)))
    .returning();

  return record;
}

export async function summarizeAdCopiesForUser(userId: string) {
  const records = await listAdCopiesForUser(userId);
  return {
    total: records.length,
    active: records.filter((record) => !record.isArchived).length,
    archived: records.filter((record) => record.isArchived).length,
    favorites: records.filter((record) => record.isFavorite).length,
  };
}

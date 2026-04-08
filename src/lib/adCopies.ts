import { ActionError } from "astro:actions";
import { AdCopies, AdCopyVariants, and, asc, db, desc, eq } from "astro:db";

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
  notes?: string | null;
  status?: AdCopyStatus;
};

export type AdCopyVariantInput = {
  label?: string | null;
  headline?: string | null;
  primaryText?: string | null;
  secondaryText?: string | null;
  callToAction?: string | null;
  notes?: string | null;
};

export type AdCopyListFilters = {
  search?: string;
  channel?: AdCopyChannel | "";
  status?: AdCopyStatus | "";
  favoriteOnly?: boolean;
  archived?: boolean;
};

type AdCopyRecord = Awaited<ReturnType<typeof loadOwnedAdCopy>>;
type AdCopyVariantRecord = Awaited<ReturnType<typeof listVariantsForRecord>>[number];

export type AdCopyVariantView = AdCopyVariantRecord;

export type AdCopyListItem = AdCopyRecord & {
  variantCount: number;
  hasFavoriteVariant: boolean;
  previewVariant: AdCopyVariantView | null;
};

export type AdCopyDetail = AdCopyRecord & {
  variants: AdCopyVariantView[];
  previewVariant: AdCopyVariantView | null;
  hasFavoriteVariant: boolean;
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

function ensureVariantHasMeaningfulCopy(input: AdCopyVariantInput) {
  if (!input.headline && !input.primaryText) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Each variant needs at least a headline or primary text.",
    });
  }
}

function buildVariantLabel(inputLabel: string | null | undefined, sortOrder: number) {
  const label = inputLabel?.trim();
  return label || `Variant ${sortOrder}`;
}

function recordHasLegacyVariantContent(record: AdCopyRecord) {
  return Boolean(
    record.headline ||
      record.primaryText ||
      record.secondaryText ||
      record.callToAction ||
      record.notes ||
      record.isFavorite,
  );
}

export function parseAdCopyInput(input: Record<string, FormDataEntryValue | null>): AdCopyInput {
  return {
    title: ensureTitle(String(input.title ?? "")),
    campaignName: asOptional(String(input.campaignName ?? "")),
    channel: ensureChannel(String(input.channel ?? "")),
    audience: asOptional(String(input.audience ?? "")),
    offer: asOptional(String(input.offer ?? "")),
    notes: asOptional(String(input.notes ?? "")),
    status: ensureStatus(String(input.status ?? "draft")),
  };
}

export function parseAdCopyVariantInput(input: Record<string, FormDataEntryValue | null>): AdCopyVariantInput {
  const parsed = {
    label: asOptional(String(input.label ?? "")),
    headline: asOptional(String(input.headline ?? "")),
    primaryText: asOptional(String(input.primaryText ?? "")),
    secondaryText: asOptional(String(input.secondaryText ?? "")),
    callToAction: asOptional(String(input.callToAction ?? "")),
    notes: asOptional(String(input.notes ?? "")),
  };

  ensureVariantHasMeaningfulCopy(parsed);
  return parsed;
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

async function listVariantsForRecord(userId: string, adCopyId: number) {
  return db
    .select()
    .from(AdCopyVariants)
    .where(and(eq(AdCopyVariants.userId, userId), eq(AdCopyVariants.adCopyId, adCopyId)))
    .orderBy(asc(AdCopyVariants.sortOrder), asc(AdCopyVariants.id));
}

async function loadOwnedVariant(userId: string, adCopyId: number, variantId: number) {
  const [variant] = await db
    .select()
    .from(AdCopyVariants)
    .where(
      and(
        eq(AdCopyVariants.userId, userId),
        eq(AdCopyVariants.adCopyId, adCopyId),
        eq(AdCopyVariants.id, variantId),
      ),
    )
    .limit(1);

  if (!variant) {
    throw new ActionError({ code: "NOT_FOUND", message: "Ad copy variant not found." });
  }

  return variant;
}

async function touchAdCopy(userId: string, adCopyId: number) {
  await db
    .update(AdCopies)
    .set({ updatedAt: new Date() })
    .where(and(eq(AdCopies.userId, userId), eq(AdCopies.id, adCopyId)));
}

async function ensureLegacyVariantForRecord(userId: string, record: AdCopyRecord) {
  const existing = await listVariantsForRecord(userId, record.id);
  if (existing.length || !recordHasLegacyVariantContent(record)) {
    return existing;
  }

  const now = new Date();
  await db.insert(AdCopyVariants).values({
    adCopyId: record.id,
    userId,
    label: "Variant 1",
    headline: record.headline ?? null,
    primaryText: record.primaryText ?? null,
    secondaryText: record.secondaryText ?? null,
    callToAction: record.callToAction ?? null,
    notes: record.notes ?? null,
    isFavorite: record.isFavorite,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  });

  await touchAdCopy(userId, record.id);
  return listVariantsForRecord(userId, record.id);
}

function getPreviewVariant(variants: AdCopyVariantView[]) {
  return variants.find((variant) => variant.isFavorite) ?? variants[0] ?? null;
}

function matchesSearch(record: AdCopyRecord, variants: AdCopyVariantView[], query: string) {
  if (!query) return true;
  const haystack = [
    record.title,
    record.campaignName ?? "",
    record.channel,
    record.notes ?? "",
    ...variants.flatMap((variant) => [
      variant.label,
      variant.headline ?? "",
      variant.primaryText ?? "",
      variant.secondaryText ?? "",
      variant.callToAction ?? "",
      variant.notes ?? "",
    ]),
  ].map((value) => value.toLowerCase());

  return haystack.some((value) => value.includes(query));
}

export async function listAdCopiesForUser(userId: string, filters: AdCopyListFilters = {}) {
  const records = await db
    .select()
    .from(AdCopies)
    .where(eq(AdCopies.userId, userId))
    .orderBy(desc(AdCopies.updatedAt));

  const query = (filters.search ?? "").trim().toLowerCase();
  const items: AdCopyListItem[] = [];

  for (const record of records) {
    const variants = await ensureLegacyVariantForRecord(userId, record);
    const previewVariant = getPreviewVariant(variants);
    const hasFavoriteVariant = variants.some((variant) => variant.isFavorite);

    const matchesArchived = typeof filters.archived === "boolean" ? record.isArchived === filters.archived : true;
    const matchesChannel = filters.channel ? record.channel === filters.channel : true;
    const matchesStatus = filters.status ? record.status === filters.status : true;
    const matchesFavorite = filters.favoriteOnly ? record.isFavorite || hasFavoriteVariant : true;
    const matchesQuery = matchesSearch(record, variants, query);

    if (matchesArchived && matchesChannel && matchesStatus && matchesFavorite && matchesQuery) {
      items.push({
        ...record,
        variantCount: variants.length,
        hasFavoriteVariant,
        previewVariant,
      });
    }
  }

  return items;
}

export async function getAdCopyDetailForUser(userId: string, id: number) {
  const record = await loadOwnedAdCopy(userId, id);
  const variants = await ensureLegacyVariantForRecord(userId, record);
  return {
    ...record,
    variants,
    previewVariant: getPreviewVariant(variants),
    hasFavoriteVariant: variants.some((variant) => variant.isFavorite),
  } satisfies AdCopyDetail;
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
  const existing = await loadOwnedAdCopy(userId, id);
  await ensureLegacyVariantForRecord(userId, existing);
  const [record] = await db
    .update(AdCopies)
    .set({
      title: input.title,
      campaignName: input.campaignName ?? null,
      channel: input.channel,
      audience: input.audience ?? null,
      offer: input.offer ?? null,
      notes: input.notes ?? null,
      status: input.status ?? "draft",
      updatedAt: new Date(),
    })
    .where(and(eq(AdCopies.userId, userId), eq(AdCopies.id, id)))
    .returning();

  return record;
}

async function nextVariantSortOrder(userId: string, adCopyId: number) {
  const variants = await listVariantsForRecord(userId, adCopyId);
  return variants.length ? Math.max(...variants.map((variant) => variant.sortOrder)) + 1 : 1;
}

export async function createAdCopyVariantForUser(userId: string, adCopyId: number, input: AdCopyVariantInput) {
  await loadOwnedAdCopy(userId, adCopyId);
  const sortOrder = await nextVariantSortOrder(userId, adCopyId);
  const now = new Date();

  const [variant] = await db
    .insert(AdCopyVariants)
    .values({
      adCopyId,
      userId,
      label: buildVariantLabel(input.label, sortOrder),
      headline: input.headline ?? null,
      primaryText: input.primaryText ?? null,
      secondaryText: input.secondaryText ?? null,
      callToAction: input.callToAction ?? null,
      notes: input.notes ?? null,
      isFavorite: false,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await touchAdCopy(userId, adCopyId);
  return variant;
}

export async function updateAdCopyVariantForUser(
  userId: string,
  adCopyId: number,
  variantId: number,
  input: AdCopyVariantInput,
) {
  const existing = await loadOwnedVariant(userId, adCopyId, variantId);
  const [variant] = await db
    .update(AdCopyVariants)
    .set({
      label: buildVariantLabel(input.label, existing.sortOrder),
      headline: input.headline ?? null,
      primaryText: input.primaryText ?? null,
      secondaryText: input.secondaryText ?? null,
      callToAction: input.callToAction ?? null,
      notes: input.notes ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(AdCopyVariants.userId, userId),
        eq(AdCopyVariants.adCopyId, adCopyId),
        eq(AdCopyVariants.id, variantId),
      ),
    )
    .returning();

  await touchAdCopy(userId, adCopyId);
  return variant;
}

export async function toggleAdCopyVariantFavoriteForUser(userId: string, adCopyId: number, variantId: number) {
  const existing = await loadOwnedVariant(userId, adCopyId, variantId);
  const [variant] = await db
    .update(AdCopyVariants)
    .set({
      isFavorite: !existing.isFavorite,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(AdCopyVariants.userId, userId),
        eq(AdCopyVariants.adCopyId, adCopyId),
        eq(AdCopyVariants.id, variantId),
      ),
    )
    .returning();

  await touchAdCopy(userId, adCopyId);
  return variant;
}

export async function toggleAdCopyFavoriteForUser(userId: string, id: number) {
  const existing = await loadOwnedAdCopy(userId, id);
  await ensureLegacyVariantForRecord(userId, existing);
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
    favorites: records.filter((record) => record.isFavorite || record.hasFavoriteVariant).length,
  };
}

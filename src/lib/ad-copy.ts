export const APP_KEY = "ad-copy-assistant";
export const STORAGE_KEY = `${APP_KEY}:draft:v1`;

export const PLATFORM_OPTIONS = [
  "Google Search",
  "Facebook / Instagram",
  "LinkedIn",
  "Generic",
] as const;

export const TONE_OPTIONS = ["Professional", "Bold", "Friendly", "Urgent"] as const;

export type PlatformOption = (typeof PLATFORM_OPTIONS)[number];
export type ToneOption = (typeof TONE_OPTIONS)[number];

export type VariantId = "A" | "B" | "C";

export interface CampaignFields {
  campaignName: string;
  brandName: string;
  audience: string;
  objective: string;
  offerCta: string;
}

export interface AdVariant {
  id: VariantId;
  label: `Variant ${VariantId}`;
  headline: string;
  secondaryHeadline: string;
  body: string;
  cta: string;
  notes: string;
}

export interface AdDraft {
  campaign: CampaignFields;
  selectedPlatform: PlatformOption;
  selectedTone: ToneOption;
  activeVariantId: VariantId;
  variants: AdVariant[];
}

export function createDefaultVariants(): AdVariant[] {
  return ["A", "B", "C"].map((id) => ({
    id: id as VariantId,
    label: `Variant ${id}`,
    headline: "",
    secondaryHeadline: "",
    body: "",
    cta: "",
    notes: "",
  }));
}

export function createDefaultDraft(): AdDraft {
  return {
    campaign: {
      campaignName: "",
      brandName: "",
      audience: "",
      objective: "",
      offerCta: "",
    },
    selectedPlatform: "Generic",
    selectedTone: "Professional",
    activeVariantId: "A",
    variants: createDefaultVariants(),
  };
}

export function normalizeDraft(raw: unknown): AdDraft {
  const defaults = createDefaultDraft();
  if (!raw || typeof raw !== "object") return defaults;

  const candidate = raw as Partial<AdDraft>;
  const incomingVariants = Array.isArray(candidate.variants) ? candidate.variants : [];
  const byId = new Map(incomingVariants.map((variant) => [variant?.id, variant]));

  const variants = defaults.variants.map((fallbackVariant) => {
    const source = byId.get(fallbackVariant.id) as Partial<AdVariant> | undefined;
    return {
      ...fallbackVariant,
      headline: source?.headline ?? "",
      secondaryHeadline: source?.secondaryHeadline ?? "",
      body: source?.body ?? "",
      cta: source?.cta ?? "",
      notes: source?.notes ?? "",
    };
  });

  return {
    campaign: {
      campaignName: candidate.campaign?.campaignName ?? "",
      brandName: candidate.campaign?.brandName ?? "",
      audience: candidate.campaign?.audience ?? "",
      objective: candidate.campaign?.objective ?? "",
      offerCta: candidate.campaign?.offerCta ?? "",
    },
    selectedPlatform: PLATFORM_OPTIONS.includes(candidate.selectedPlatform as PlatformOption)
      ? (candidate.selectedPlatform as PlatformOption)
      : defaults.selectedPlatform,
    selectedTone: TONE_OPTIONS.includes(candidate.selectedTone as ToneOption)
      ? (candidate.selectedTone as ToneOption)
      : defaults.selectedTone,
    activeVariantId: (["A", "B", "C"] as const).includes(candidate.activeVariantId as VariantId)
      ? (candidate.activeVariantId as VariantId)
      : defaults.activeVariantId,
    variants,
  };
}

export function assembleVariantCopy(draft: AdDraft, variant: AdVariant): string {
  return [
    `Campaign: ${draft.campaign.campaignName || "Untitled campaign"}`,
    `Brand / Product: ${draft.campaign.brandName || "Not specified"}`,
    `Audience: ${draft.campaign.audience || "Not specified"}`,
    `Platform: ${draft.selectedPlatform}`,
    `Objective: ${draft.campaign.objective || "Not specified"}`,
    `Offer / CTA: ${draft.campaign.offerCta || "Not specified"}`,
    `Tone: ${draft.selectedTone}`,
    "",
    `${variant.label}`,
    `Headline: ${variant.headline || "-"}`,
    `Secondary headline: ${variant.secondaryHeadline || "-"}`,
    `Body: ${variant.body || "-"}`,
    `CTA line: ${variant.cta || "-"}`,
    `Notes / angle: ${variant.notes || "-"}`,
  ].join("\n");
}

export function assembleFullCopySet(draft: AdDraft): string {
  return draft.variants.map((variant) => assembleVariantCopy(draft, variant)).join("\n\n---\n\n");
}

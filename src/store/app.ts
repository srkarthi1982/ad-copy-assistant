import {
  STORAGE_KEY,
  PLATFORM_OPTIONS,
  TONE_OPTIONS,
  createDefaultDraft,
  normalizeDraft,
  assembleVariantCopy,
  assembleFullCopySet,
  type AdDraft,
  type AdVariant,
  type VariantId,
} from "../lib/ad-copy";

interface AdCopyStore {
  draft: AdDraft;
  platformOptions: readonly string[];
  toneOptions: readonly string[];
  resetConfirmOpen: boolean;
  statusMessage: string;
  init: () => void;
  readonly activeVariant: AdVariant;
  setVariant: (id: VariantId) => void;
  save: () => void;
  copyCurrentVariant: () => Promise<void>;
  copyFullSet: () => Promise<void>;
  openResetConfirm: () => void;
  cancelReset: () => void;
  resetDraft: () => void;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function createAdCopyStore(): AdCopyStore {
  return {
    draft: createDefaultDraft(),
    platformOptions: PLATFORM_OPTIONS,
    toneOptions: TONE_OPTIONS,
    resetConfirmOpen: false,
    statusMessage: "",

    init() {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.save();
        return;
      }

      try {
        this.draft = normalizeDraft(JSON.parse(raw));
      } catch {
        this.draft = createDefaultDraft();
      }

      this.save();
    },

    get activeVariant() {
      return this.draft.variants.find((variant) => variant.id === this.draft.activeVariantId) ?? this.draft.variants[0];
    },

    setVariant(id) {
      this.draft.activeVariantId = id;
      this.save();
    },

    save() {
      if (typeof window === "undefined") return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.draft));
    },

    async copyCurrentVariant() {
      const copied = await copyText(assembleVariantCopy(this.draft, this.activeVariant));
      this.statusMessage = copied ? "Current variant copied." : "Unable to copy. Please copy manually.";
    },

    async copyFullSet() {
      const copied = await copyText(assembleFullCopySet(this.draft));
      this.statusMessage = copied ? "All variants copied." : "Unable to copy. Please copy manually.";
    },

    openResetConfirm() {
      this.resetConfirmOpen = true;
    },

    cancelReset() {
      this.resetConfirmOpen = false;
    },

    resetDraft() {
      this.draft = createDefaultDraft();
      this.resetConfirmOpen = false;
      this.statusMessage = "Draft reset.";
      this.save();
    },
  };
}

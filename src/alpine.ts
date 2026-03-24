import type { Alpine } from "alpinejs";
import { createAdCopyStore } from "./store/app";

export default function initAlpine(Alpine: Alpine) {
  Alpine.store("app", createAdCopyStore());
}

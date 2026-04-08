import { defineDb } from "astro:db";
import { AdCopies, AdCopyVariants } from "./tables";

export default defineDb({
  tables: {
    AdCopies,
    AdCopyVariants,
  },
});

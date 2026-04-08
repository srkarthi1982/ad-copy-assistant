import { defineDb } from "astro:db";
import { AdCopies } from "./tables";

export default defineDb({
  tables: {
    AdCopies,
  },
});

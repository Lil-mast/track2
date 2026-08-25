import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

type SeedResult = { skipped: boolean; message: string };

/** Public wrapper to seed demo data (run once after deploy). */
export const runSeedDemo = mutation({
  args: {},
  handler: async (ctx): Promise<SeedResult> => {
    return ctx.runMutation(internal.seed.seedDemo, {});
  },
});

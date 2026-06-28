import { mockDataRepository } from "./mock/MockDataRepository";
import { auroraDataRepository } from "./aurora/AuroraDataRepository";
import { isAuroraActive } from "@/config/aws";
import type { IDataRepository } from "./interfaces/IDataRepository";

/**
 * Data access layer entry point.
 *
 * Uses Aurora whenever the runtime can reach it (see isAuroraActive), otherwise
 * mock data for local dev. The same resolver drives DEFAULT_LENDER_ID so the
 * active repository and the lender id never disagree.
 */
export function getDataRepository(): IDataRepository {
  return isAuroraActive() ? auroraDataRepository : mockDataRepository;
}

export { type IDataRepository } from "./interfaces/IDataRepository";

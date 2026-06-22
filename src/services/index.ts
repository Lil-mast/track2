import { mockDataRepository } from "./mock/MockDataRepository";
import { auroraDataRepository } from "./aurora/AuroraDataRepository";
import type { IDataRepository } from "./interfaces/IDataRepository";

/**
 * Data access layer entry point.
 * Uses Aurora when AURORA_ENABLED=true; otherwise mock data for local dev.
 */
export function getDataRepository(): IDataRepository {
  if (process.env.AURORA_ENABLED === "true") {
    return auroraDataRepository;
  }
  return mockDataRepository;
}

export { type IDataRepository } from "./interfaces/IDataRepository";

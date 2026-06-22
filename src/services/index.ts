import { mockDataRepository } from "./mock/MockDataRepository";
import { auroraDataRepository } from "./aurora/AuroraDataRepository";
import type { IDataRepository } from "./interfaces/IDataRepository";

/**
 * Data access layer entry point.
 *
 * AURORA_ENABLED=true  → AuroraDataRepository  Vercel)
 * unset / anything else → MockDataRepository  
 */
export function getDataRepository(): IDataRepository {
  if (process.env.AURORA_ENABLED === "true") {
    return auroraDataRepository;
  }
  return mockDataRepository;
}

export { type IDataRepository } from "./interfaces/IDataRepository";
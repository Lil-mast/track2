import { mockDataRepository } from "./mock/MockDataRepository";
import type { IDataRepository } from "./interfaces/IDataRepository";

/**
 * Data access layer entry point.
 * Replace mockDataRepository with auroraDataRepository when AWS is connected.
 */
export function getDataRepository(): IDataRepository {
  return mockDataRepository;
}

export { type IDataRepository } from "./interfaces/IDataRepository";

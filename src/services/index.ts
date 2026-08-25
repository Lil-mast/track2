import { convexDataRepository } from "./convex/ConvexDataRepository";
import type { IDataRepository } from "./interfaces/IDataRepository";

/**
 * Data access layer entry point — always uses Convex.
 */
export function getDataRepository(): IDataRepository {
  return convexDataRepository;
}

export { type IDataRepository } from "./interfaces/IDataRepository";

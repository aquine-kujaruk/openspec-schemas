import type { Change } from "../../domain/services/work-order-assessment.service.ts";

export type DrawingProjection = { root: string; changes: string[]; dispose(): void };

export interface DrawingProjectionRepositoryInterface {
  listWorkOrders(root: string): Change[];
  mergeDrawings(root: string, changes: string[]): DrawingProjection;
}

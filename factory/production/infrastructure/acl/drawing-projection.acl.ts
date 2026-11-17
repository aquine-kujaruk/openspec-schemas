import type { DrawingProjection } from "../../application/repository-interfaces/drawing-projection.repository-interface.ts";

export interface DrawingProjectionAcl {
  openspec(root: string, args: string[]): { status: number; output: string };
  mergeDrawings(root: string, changes: string[]): DrawingProjection;
}

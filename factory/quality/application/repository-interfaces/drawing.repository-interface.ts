import type { Drawing } from "../../domain/entities/drawing.entity.ts";
import type { Gauge } from "../../domain/value-objects/gauge.value-object.ts";

export type GaugeBatch = { exitStatus: number; drawings: Drawing[]; gauges: Gauge[] };

export interface DrawingRepositoryInterface {
  makeGauges(args: readonly string[]): Promise<GaugeBatch>;
}

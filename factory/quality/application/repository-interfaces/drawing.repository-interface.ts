import type { DrawingEntity } from "../../domain/entities/drawing.entity.ts";
import type { GaugeValueObject } from "../../domain/value-objects/gauge.value-object.ts";

export type GaugeBatch = { exitStatus: number; drawings: DrawingEntity[]; gauges: GaugeValueObject[] };

export interface DrawingRepositoryInterface {
  makeGauges(args: readonly string[]): Promise<GaugeBatch>;
}

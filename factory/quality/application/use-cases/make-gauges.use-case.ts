import { DrawingEntity } from "../../domain/entities/drawing.entity.ts";
import { GaugeValueObject } from "../../domain/value-objects/gauge.value-object.ts";
import type { DrawingRepositoryInterface, GaugeBatch } from "../repository-interfaces/drawing.repository-interface.ts";

export class MakeGaugesUseCase {
  private readonly repository: DrawingRepositoryInterface;

  constructor(repository: DrawingRepositoryInterface) {
    this.repository = repository;
  }

  async execute(args: readonly string[]): Promise<GaugeBatch> {
    const { exitStatus, drawings } = await this.repository.makeGauges(args);

    return {
      exitStatus,
      drawings: drawings.map((drawing) => DrawingEntity.from(drawing)),
      gauges: drawings.map(({ path, file }) => new GaugeValueObject({ drawing: path, file })),
    };
  }
}

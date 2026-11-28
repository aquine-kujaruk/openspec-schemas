import { GaugeBatchRecordSchema, type GaugeBatchRecord } from "../../domain/schemas/drawing.schema.ts";
import type { DrawingPort } from "../acl/drawing.acl.ts";
import type { DrawingRepositoryInterface } from "../../application/repository-interfaces/drawing.repository-interface.ts";

export class DrawingRepositoryImplementation implements DrawingRepositoryInterface {
  private readonly make: DrawingPort;

  constructor(make: DrawingPort) {
    this.make = make;
  }

  async makeGauges(args: readonly string[]): Promise<GaugeBatchRecord> {
    return GaugeBatchRecordSchema.parse(await this.make(args));
  }
}

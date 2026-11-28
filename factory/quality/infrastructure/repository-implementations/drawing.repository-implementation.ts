import { GaugeBatchRecordSchema, type GaugeBatchRecord } from "../../domain/schemas/drawing.schema.ts";
import type { DrawingAcl } from "../acl/drawing.acl.ts";
import type { DrawingRepositoryInterface } from "../../application/repository-interfaces/drawing.repository-interface.ts";

export class DrawingRepositoryImplementation implements DrawingRepositoryInterface {
  private readonly tool: DrawingAcl;

  constructor(tool: DrawingAcl) {
    this.tool = tool;
  }

  async makeGauges(args: readonly string[]): Promise<GaugeBatchRecord> {
    return GaugeBatchRecordSchema.parse(await this.tool.makeGauges(args));
  }
}

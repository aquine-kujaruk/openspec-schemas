import type { DrawingRepositoryInterface, GaugeBatch } from "../repository-interfaces/drawing.repository-interface.ts";

export class MakeGaugesUseCase {
  private readonly repository: DrawingRepositoryInterface;

  constructor(repository: DrawingRepositoryInterface) {
    this.repository = repository;
  }

  execute(args: readonly string[]): Promise<GaugeBatch> {
    return this.repository.makeGauges(args);
  }
}

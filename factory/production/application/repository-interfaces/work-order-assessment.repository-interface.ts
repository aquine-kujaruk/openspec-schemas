import type { Change, JudgementRequest, Validator } from "../../domain/services/work-order-assessment.service.ts";
import type { Consolidated } from "../../domain/services/standing-records.service.ts";

export type Judge = { model: string; ask(request: JudgementRequest): Promise<number> };

export type WorkOrderProcess = { validator: Validator; workstreams: string[]; spike?: string };

export interface WorkOrderAssessmentRepositoryInterface {
  findWorkOrder(root: string, name: string): Change | undefined;
  findArchivedWorkOrder(root: string, name: string): Change | undefined;
  listWorkOrders(root: string): string[];
  isWorkOrderStarted(root: string, name: string): boolean;
  listStanding(root: string): Consolidated;
  listProcesses(): string[];
  loadProcess(name: string): Promise<WorkOrderProcess>;
  listProducts(root: string): Promise<Record<string, { schema: string }>>;
  findJudge(root: string, product?: string): Promise<Judge | null>;
  findJudgement(root: string, name: string, model: string, request: JudgementRequest): number | undefined;
  recordJudgement(root: string, name: string, model: string, request: JudgementRequest, probability: number): void;
}

import type { Judge } from "../../application/repository-interfaces/work-order-assessment.repository-interface.ts";
import type { JudgementRequest } from "../../domain/services/work-order-assessment.service.ts";

export interface DecisionJudgeAcl {
  judgeOf(root: string, product?: string): Promise<Judge | null>;
  recorded(root: string, name: string, model: string, request: JudgementRequest): number | undefined;
  record(root: string, name: string, model: string, request: JudgementRequest, probability: number): void;
}

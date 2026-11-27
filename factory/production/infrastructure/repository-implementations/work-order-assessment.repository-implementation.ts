import type { WorkOrderAssessmentRepositoryInterface } from "../../application/repository-interfaces/work-order-assessment.repository-interface.ts";
import { indexStanding } from "../../domain/services/standing-records.service.ts";
import { DECISIONS, PROCEDURES, type StandingRecordAcl } from "../acl/standing-record.acl.ts";
import type { WorkOrderAssessmentAcl } from "../acl/work-order-assessment.acl.ts";
import type { WorkOrderRecordAcl } from "../acl/work-order-record.acl.ts";
import type { DecisionJudgeAcl } from "../acl/decision-judge.acl.ts";
import type { JudgementRequest } from "../../domain/services/work-order-assessment.service.ts";

export class WorkOrderAssessmentRepositoryImplementation implements WorkOrderAssessmentRepositoryInterface {
  private readonly orders: WorkOrderRecordAcl;
  private readonly standing: StandingRecordAcl;
  private readonly processes: WorkOrderAssessmentAcl;
  private readonly judges: DecisionJudgeAcl;

  constructor(orders: WorkOrderRecordAcl, standing: StandingRecordAcl, processes: WorkOrderAssessmentAcl, judges: DecisionJudgeAcl) {
    this.orders = orders;
    this.standing = standing;
    this.processes = processes;
    this.judges = judges;
  }

  findWorkOrder(root: string, name: string) { return this.orders.readChange(root, name); }
  findArchivedWorkOrder(root: string, name: string) { return this.orders.readArchivedChange(root, name); }
  listWorkOrders(root: string) { return this.orders.activeChanges(root); }
  isWorkOrderStarted(root: string, name: string) { return this.orders.isStarted(root, name); }
  listStanding(root: string) {
    return {
      decisions: indexStanding(this.standing.readDocuments(root, DECISIONS), "Decision"),
      procedures: indexStanding(this.standing.readDocuments(root, PROCEDURES), "Procedure"),
    };
  }
  listProcesses() { return this.processes.listProcesses(); }
  loadProcess(name: string) { return this.processes.loadProcess(name); }
  listProducts(root: string) { return this.processes.listProducts(root); }
  findJudge(root: string, product?: string) { return this.judges.judgeOf(root, product); }
  findJudgement(root: string, name: string, model: string, request: JudgementRequest) {
    return this.judges.recorded(root, name, model, request);
  }
  recordJudgement(root: string, name: string, model: string, request: JudgementRequest, probability: number) {
    this.judges.record(root, name, model, request, probability);
  }
}

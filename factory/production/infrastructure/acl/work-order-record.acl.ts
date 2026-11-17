import type { Change } from "../../domain/services/work-order-assessment.service.ts";

export interface WorkOrderRecordAcl {
  isStarted(root: string, name: string): boolean;
  readChange(root: string, name: string): Change | undefined;
  readArchivedChange(root: string, name: string): Change | undefined;
  activeChanges(root: string): string[];
}

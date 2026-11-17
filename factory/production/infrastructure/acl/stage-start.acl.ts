export interface StageStartAcl {
  validateWorkOrder(name: string): Promise<{ rule: string; message: string }[]>;
  prepareStage(name: string, title: string): Promise<{ success: boolean; output: string }>;
}

export interface AndonRepositoryInterface {
  readPlan(name: string): Promise<string>;
  savePlan(name: string, text: string): Promise<void>;
  closeSignal(name: string, source: string): Promise<void>;
}

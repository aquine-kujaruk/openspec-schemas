import type { StageStartRepositoryInterface } from "../../application/repository-interfaces/stage-start.repository-interface.ts";
import type { StageStartAcl } from "../acl/stage-start.acl.ts";

export class StageStartRepositoryImplementation implements StageStartRepositoryInterface {
  private readonly control: StageStartAcl;

  constructor(control: StageStartAcl) {
    this.control = control;
  }

  validateWorkOrder(name: string) { return this.control.validateWorkOrder(name); }
  prepareStage(name: string, title: string) { return this.control.prepareStage(name, title); }
}

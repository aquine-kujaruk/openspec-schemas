import { expect } from "vitest";
import { planInstruction } from "../../schemas/spec-plan/schema.ts";

const criteria: Record<string, { finding: string; instruction: string }> = {
  "a module check isolates a passing module": {
    finding: "result with a defect deliberately placed in a second module",
    instruction: "command, relevant input and observed result",
  },
  "moved specs generate tests where verify looks": {
    finding: "generation and verification result on one moved spec",
    instruction: "each unproven tool assumption",
  },
  "a retirement fails on a spec with example rows": {
    finding: "observed failure and revised prerequisite or approach",
    instruction: "observed result",
  },
  "the required tool is built by a later phase": {
    finding: "dependency and first phase that can run the probe",
    instruction: "record why and the earliest phase that can run it",
  },
  "a spec has no generated test in the factory repo": {
    finding: "planned test coverage and any final personal attestation",
    instruction: "For each affected spec, name the evidence and any personal attestation",
  },
};

export function createSteps() {
  let dependency: string;
  let instruction: string;
  return {
    phaseDependsOn(assumption: string): void {
      dependency = assumption;
    },
    prepareForApproval(): void {
      instruction = planInstruction();
    },
    proposalRecords(finding: string): void {
      const criterion = criteria[dependency];
      expect(criterion?.finding).toBe(finding);
      expect(instruction).toContain(criterion!.instruction);
      expect(instruction).toContain("Before approval");
    },
  };
}

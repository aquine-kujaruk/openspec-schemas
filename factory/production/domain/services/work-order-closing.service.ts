type Certificate = { verdict: string; digest: string };
type ValidationFinding = { rule: string; message: string; block?: string };

const TAG_RULES = new Set(["operation-tag-holds", "operation-records-base", "one-operation-tag"]);

export class WorkOrderClosingService {
  closingOrder(active: Array<{ name: string; created: string }>): string[] {
    return [...active]
      .sort((a, b) => a.created.localeCompare(b.created) || a.name.localeCompare(b.name))
      .map((order) => order.name);
  }

  async certificateHold(certificate: Certificate | null, currentDigest: () => Promise<string>): Promise<string | undefined> {
    if (!certificate) return "it has no evidence: verify it first";
    if (certificate.verdict !== "verified") return "its evidence reports it not verified";
    if (certificate.digest !== await currentDigest()) return "the change or the product changed since it was verified: verify it again";

    return undefined;
  }

  staleTags(findings: ValidationFinding[]): Array<Required<Pick<ValidationFinding, "block">> & ValidationFinding> {
    return findings.filter((finding): finding is ValidationFinding & { block: string } => Boolean(finding.block) && TAG_RULES.has(finding.rule));
  }

  validationHold(findings: ValidationFinding[]): string | undefined {
    const stale = this.staleTags(findings);
    if (stale.length) return `a tag of its plan no longer holds: ${stale.map(({ block }) => block).join(", ")}`;

    const [first] = findings;
    if (!first) return undefined;

    return first.rule === "not-validatable" ? first.message : `validation reports it not ready: ${first.message}`;
  }
}

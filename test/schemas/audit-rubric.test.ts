import { expect, it } from "vitest";
import { loadSchema } from "../../factory/sdk.ts";
import { AuditRubricService } from "../../factory/quality/domain/services/audit-rubric.service.ts";
import { AuditAdapter } from "../../factory/quality/infrastructure/adapters/audit.adapter.ts";
import { AuditRepositoryImplementation } from "../../factory/quality/infrastructure/repository-implementations/audit.repository-implementation.ts";
import { PACKAGE_ROOT } from "../../factory/shared/infrastructure/adapters/paths.adapter.ts";

it("loads the actual clean-react rubric after the core's rubric", async () => {
    const { rubrics } = await loadSchema("clean-react");
    const repository = new AuditRepositoryImplementation(new AuditAdapter(async () => new Map(), () => "abc123"));
    const read = (paths: string[]) => new AuditRubricService().loadDocuments(
      repository.listRubrics(PACKAGE_ROOT, paths),
      repository.listPackageNames(PACKAGE_ROOT),
    );
    const rows = read(rubrics);
    expect(rows.slice(0, 16)).toEqual(read(rubrics.slice(0, 1)));
    expect(rows.slice(16).map((row) => row.id)).toEqual(["S01", "S02", "S03", "S04", "S21", "S22", "S23"]);
    expect(rows.slice(16).filter((row) => row.verdict === "rejected")).toEqual([]);
  });

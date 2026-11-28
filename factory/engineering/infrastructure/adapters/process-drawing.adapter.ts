import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { stringify } from "yaml";
import type { CatalogSchema } from "../acl/process.acl.ts";

export const schemaFiles = (schema: CatalogSchema): Record<string, string> => {
  const d = schema.definition;

  const knows = [
    `Workstreams a task may name: ${d.workstreams.map((w) => `\`${w}\``).join(", ")}.`,
    schema.questions.trim(),
  ].join("\n\n");

  return {
    "schema.yaml": stringify(
      {
        name: d.name,
        version: 1,
        description: d.description,
        artifacts: d.artifacts.map(({ decides, ...artifact }) => ({
          ...artifact,
          instruction: `${[artifact.instruction.trim(), ...(decides ? [knows] : [])].join("\n\n")}\n`,
        })),
        apply: { ...d.apply, instruction: `${d.apply.instruction.trim()}\n` },
      },
      { lineWidth: 0 },
    ),
    ...Object.fromEntries(
      Object.entries(schema.templates).map(([name, text]) => [
        `templates/${name}`,
        text,
      ]),
    ),
  };
};

export const emitSchema = (schema: CatalogSchema, dir: string): string[] => {
  const files = schemaFiles(schema);

  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }

  return Object.keys(files);
};

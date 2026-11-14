import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { stringify } from "yaml";
import type { Schema } from "./schema.ts";

/**
 * The files of a schema as the specification tool reads it: `schema.yaml` and the templates its
 * artifacts name. The instruction of the artifact that decides ends with what only the schema
 * knows: the workstreams a task may name and its question policy.
 */
export const schemaFiles = (schema: Schema): Record<string, string> => {
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
      Object.entries(schema.templates).map(([name, text]) => [`templates/${name}`, text]),
    ),
  };
};

/** Writes the schema's files under `dir`. */
export const emitSchema = (schema: Schema, dir: string): string[] => {
  const files = schemaFiles(schema);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return Object.keys(files);
};

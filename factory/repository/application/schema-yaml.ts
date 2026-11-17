import type { Schema } from "../domain/schema.ts";
import type { SchemaYamlPorts } from "../domain/schema-yaml.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createSchemaYaml = ({
  mkdirSync,
  writeFileSync,
  dirname,
  join,
  stringify,
}: SchemaYamlPorts): typeof import("../domain/schema-yaml.ts") => {
  /**
   * The files of a schema as the specification tool reads it: `schema.yaml` and the templates its
   * artifacts name. The instruction of the artifact that decides ends with what only the schema
   * knows: the workstreams a task may name and its question policy.
   */
  const schemaFiles = (schema: Schema): Record<string, string> => {
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

  /** Writes the schema's files under `dir`. */
  const emitSchema = (schema: Schema, dir: string): string[] => {
    const files = schemaFiles(schema);
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), text);
    }
    return Object.keys(files);
  };
  return { schemaFiles, emitSchema };
};

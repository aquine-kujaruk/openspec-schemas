import { createSchemasCommand } from "./repository/framework/schemas.ts";
import type { Commands } from "./shared/domain/command.ts";
import { createCommands } from "./repository/framework/commands.ts";
import { createGenerated } from "./repository/application/generated.ts";
import { createInstalled } from "./repository/application/installed.ts";
import { createProducts } from "./repository/application/products.ts";
import { createSchemaYaml } from "./repository/application/schema-yaml.ts";
import { createSchema } from "./repository/application/schema.ts";
import { createSchemas } from "./repository/application/schemas.ts";
import * as validation from "./repository/domain/validation.ts";
import * as shared from "./shared.ts";
import {
  fileSystem,
  path,
  yaml,
  urls,
} from "./repository/infrastructure/adapters/resources.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.ts";
const installed: typeof import("./repository/domain/installed.ts") =
  createInstalled({
    existsSync: fileSystem.existsSync,
    readFileSync: fileSystem.readFileSync,
    join: path.join,
    SETUP_ASSETS: shared.paths.SETUP_ASSETS,
    INSTALLED: shared.paths.INSTALLED,
  });
const schemaYaml: typeof import("./repository/domain/schema-yaml.ts") =
  createSchemaYaml({
    mkdirSync: fileSystem.mkdirSync,
    writeFileSync: fileSystem.writeFileSync,
    dirname: path.dirname,
    join: path.join,
    stringify: yaml.stringify,
  });
const schema: typeof import("./repository/domain/schema.ts") = createSchema({
  existsSync: fileSystem.existsSync,
  readdirSync: fileSystem.readdirSync,
  readFileSync: fileSystem.readFileSync,
  dirname: path.dirname,
  join: path.join,
  resolve: path.resolve,
  pathToFileURL: urls.pathToFileURL,
  PACKAGE_ROOT: shared.paths.PACKAGE_ROOT,
  SOURCE_EXT: shared.paths.SOURCE_EXT,
  loadModule: runtime.loadModule,
});
const products: typeof import("./repository/domain/products.ts") =
  createProducts({
    existsSync: fileSystem.existsSync,
    join: path.join,
    posix: path.posix,
    resolve: path.resolve,
    pathToFileURL: urls.pathToFileURL,
    resolveConfig: shared.config.resolveConfig,
    PACKAGE_ROOT: shared.paths.PACKAGE_ROOT,
    loadDefinition: schema.loadDefinition,
    loadHolder: schema.loadHolder,
    projectSchemaName: schema.projectSchemaName,
    loadModule: runtime.loadModule,
    environment: runtime.environment,
  });
const generated: typeof import("./repository/domain/generated.ts") =
  createGenerated({
    globSync: fileSystem.globSync,
    basename: path.basename,
    dirname: path.dirname,
    join: path.join,
    relative: path.relative,
    ARCHITECTURE_SPECS: shared.paths.ARCHITECTURE_SPECS,
    PACKAGE_ROOT: shared.paths.PACKAGE_ROOT,
    SOURCE_EXT: shared.paths.SOURCE_EXT,
    productOf: products.productOf,
    holderNames: schema.holderNames,
    loadHolder: schema.loadHolder,
  });
const schemasPorts: Parameters<typeof createSchemas>[0] = {
  readInstalled: installed.readInstalled,
  PROJECT_ROOT: shared.paths.PROJECT_ROOT,
  loadDefinition: schema.loadDefinition,
  schemaNames: schema.schemaNames,
  declaresProducts: products.declaresProducts,
  projectProducts: products.projectProducts,
};
const schemasApplication = createSchemas(schemasPorts);
const schemas: typeof import("./repository/domain/schemas.ts") = {
  ...schemasApplication,
  run: createSchemasCommand({ ...schemasPorts, ...schemasApplication }),
};
export {
  generated,
  installed,
  products,
  schemaYaml,
  schema,
  schemas,
  validation,
};

export const commands: Commands = createCommands({ schemas: schemas.run });
export const sdkLoadSchema: typeof schema.loadSchema = schema.loadSchema;

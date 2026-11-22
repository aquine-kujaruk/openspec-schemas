# unit

## reference

```ts src/module/domain/value-objects/invoice.value-object.ts
import { validateSchema } from "../../../shared/domain/schemas/validation.schema";
import { InvoiceSchema, type InvoiceProps } from "../schemas/invoice.schema";
export class InvoiceValueObject {
  public readonly total!: number;
  constructor(props: InvoiceProps) {
    validateSchema(this, InvoiceSchema, props);
  }
}
```

```ts test/unit/module/domain/value-objects/invoice.value-object.test.ts
import { expect, test } from "vitest";
import { InvoiceValueObject } from "../../../../../src/module/domain/value-objects/invoice.value-object";
import { InvoiceStatus } from "../../../../../src/module/domain/schemas/invoice.schema";
test("an invoice retains its total", () => {
  const invoice = new InvoiceValueObject({ id: "1", total: 10, status: InvoiceStatus.PAID });
  expect(invoice.total).toBe(10);
});
```

## unit-test-targets-core-file

### test-without-target

```ts test/unit/module/domain/entities/ghost.entity.test.ts
export const run = () => 1;
```

```expect
- test/unit/module/domain/entities/ghost.entity.test.ts (archunit)
```

### test-outside-module-folder

```ts test/unit/invoice.test.ts
export const run = () => 1;
```

```expect
- test/unit/invoice.test.ts (archunit)
```

### test-of-infrastructure

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export class InvoiceRepositoryImplementation {}
```

```ts test/unit/module/infrastructure/repository-implementations/invoice.repository-implementation.test.ts
export const run = () => 1;
```

```expect
- test/unit/module/infrastructure/repository-implementations/invoice.repository-implementation.test.ts (archunit)
```

## unit-imports-only-the-core

### test-imports-adapter

```ts src/module/infrastructure/adapters/invoice.adapter.ts
export class InvoiceAdapter {}
```

```ts test/unit/module/domain/entities/invoice.entity.test.ts
import { InvoiceAdapter } from "../../../../../src/module/infrastructure/adapters/invoice.adapter";
export const run = () => new InvoiceAdapter();
```

```expect
- test/unit/module/domain/entities/invoice.entity.test.ts (fallow)
```

### test-imports-repository-implementation

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export class InvoiceRepositoryImplementation {}
```

```ts test/unit/module/domain/entities/invoice.entity.test.ts
import { InvoiceRepositoryImplementation } from "../../../../../src/module/infrastructure/repository-implementations/invoice.repository-implementation";
export const run = () => new InvoiceRepositoryImplementation();
```

```expect
- test/unit/module/domain/entities/invoice.entity.test.ts (fallow)
```

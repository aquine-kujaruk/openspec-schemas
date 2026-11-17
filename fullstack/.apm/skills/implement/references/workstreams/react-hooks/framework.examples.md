# framework

## reference

```ts src/shared/domain/exceptions/domain.exceptions.ts
export class DomainException extends Error {
  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
  }
}
```

```ts src/shared/domain/exceptions/validation.exceptions.ts
import { DomainException } from "./domain.exceptions";
export class ValidationException extends DomainException {
  constructor(
    public readonly source: string,
    cause: unknown,
  ) {
    super(`${source} rejected its props`, { cause });
  }
}
```

```ts src/shared/domain/schemas/validation.schema.ts
import type { z } from "zod";
import { ValidationException } from "../exceptions/validation.exceptions";
export const validateSchema = <S extends z.ZodType>(
  target: object,
  schema: S,
  props: unknown,
): z.output<S> => {
  const result = schema.safeParse(props);
  if (!result.success) throw new ValidationException(target.constructor.name, result.error);
  Object.assign(target, result.data);
  return result.data;
};
```

```ts src/module/application/repository-interfaces/invoice.repository-interface.ts
import type { InvoiceProps } from "../../domain/schemas/invoice.schema";
export interface InvoiceRepositoryInterface {
  listInvoices(): Promise<InvoiceProps[]>;
  findInvoice(invoiceId: string): Promise<InvoiceProps | null>;
  saveInvoice(invoice: InvoiceProps): Promise<void>;
}
```

```ts src/module/application/use-cases/list-invoices.use-case.ts
import { InvoiceEntity } from "../../domain/entities/invoice.entity";
import type { InvoiceRepositoryInterface } from "../repository-interfaces/invoice.repository-interface";
export class ListInvoicesUseCase {
  constructor(private readonly invoices: InvoiceRepositoryInterface) {}
  async execute() {
    return (await this.invoices.listInvoices()).map((props) => new InvoiceEntity(props));
  }
}
```

```ts src/module/domain/entities/invoice.entity.ts
import { validateSchema } from "../../../shared/domain/schemas/validation.schema";
import { InvoiceAlreadyPaidException } from "../exceptions/invoice.exceptions";
import { InvoiceSchema, InvoiceStatus, type InvoiceProps } from "../schemas/invoice.schema";
export class InvoiceEntity {
  public readonly id!: string;
  public readonly total!: number;
  public readonly status!: InvoiceStatus;
  constructor(props: InvoiceProps) {
    validateSchema(this, InvoiceSchema, props);
  }
  get isPaid() {
    return this.status === InvoiceStatus.PAID;
  }
  pay() {
    if (this.isPaid) throw new InvoiceAlreadyPaidException(this.id);
    return new InvoiceEntity({ id: this.id, total: this.total, status: InvoiceStatus.PAID });
  }
}
```

```ts src/module/domain/schemas/invoice.schema.ts
import { z } from "zod";
export enum InvoiceStatus {
  PAID = "paid",
  PENDING = "pending",
}
export const InvoiceSchema = z.object({
  id: z.string().min(1),
  total: z.number().int(),
  status: z.enum(InvoiceStatus),
});
export type InvoiceProps = z.infer<typeof InvoiceSchema>;
```

```ts src/module/framework/queries/list-invoices.query.ts
import { useQuery } from "@tanstack/react-query";
import { ListInvoicesUseCase } from "../../application/use-cases/list-invoices.use-case";
import { invoiceAdapter } from "../../infrastructure/adapters/invoice.adapter";
import { InvoiceRepositoryImplementation } from "../../infrastructure/repository-implementations/invoice.repository-implementation";
const listInvoices = new ListInvoicesUseCase(new InvoiceRepositoryImplementation(invoiceAdapter));
export const listInvoicesQueryKey = () => ["invoices"] as const;
export const useListInvoicesQuery = () =>
  useQuery({ queryKey: listInvoicesQueryKey(), queryFn: () => listInvoices.execute() });
```

```ts src/module/framework/queries/get-invoice.query.ts
import { useQuery } from "@tanstack/react-query";
import { GetInvoiceUseCase } from "../../application/use-cases/get-invoice.use-case";
import { invoiceAdapter } from "../../infrastructure/adapters/invoice.adapter";
import { InvoiceRepositoryImplementation } from "../../infrastructure/repository-implementations/invoice.repository-implementation";
const getInvoice = new GetInvoiceUseCase(new InvoiceRepositoryImplementation(invoiceAdapter));
export const getInvoiceQueryKey = (invoiceId: string) => ["invoices", invoiceId] as const;
export const useGetInvoiceQuery = (invoiceId: string) =>
  useQuery({ queryKey: getInvoiceQueryKey(invoiceId), queryFn: () => getInvoice.execute(invoiceId) });
```

```ts src/module/framework/controllers/invoices.controller.ts
import { InvoiceStatus } from "../../domain/schemas/invoice.schema";
import { useListInvoicesQuery } from "../queries/list-invoices.query";
import { useInvoicesStore } from "../stores/invoices.store";
import { invoiceRowViewModel } from "../view-models/invoice-row.view-model";
import { invoiceStatusOptions } from "../view-models/invoice-status.view-model";
const ALL = "all";
export const useInvoicesController = () => {
  const { status, setStatus } = useInvoicesStore();
  const query = useListInvoicesQuery();
  const rows = (query.data ?? [])
    .filter((invoice) => !status || invoice.status === status)
    .map(invoiceRowViewModel);
  return {
    rows,
    isEmpty: query.isSuccess && rows.length === 0,
    filter: status ?? ALL,
    filterOptions: [{ value: ALL, label: "All" }, ...invoiceStatusOptions()],
    onFilter: (value: string) =>
      setStatus(Object.values(InvoiceStatus).find((s) => s === value) ?? null),
  };
};
```

```ts src/module/framework/view-models/invoice-row.view-model.ts
import type { InvoiceEntity } from "../../domain/entities/invoice.entity";
import { invoiceStatusLabel } from "./invoice-status.view-model";
export const invoiceRowViewModel = (invoice: InvoiceEntity) => ({
  id: invoice.id,
  label: `#${invoice.id}`,
  status: invoiceStatusLabel(invoice.status),
});
```

```ts src/module/infrastructure/acl/invoice.acl.ts
import type { z } from "zod";
import { InvoiceSchema } from "../../domain/schemas/invoice.schema";
export const InvoiceRecordSchema = InvoiceSchema;
export type InvoiceRecord = z.infer<typeof InvoiceRecordSchema>;
export interface InvoiceAcl {
  listInvoices(): Promise<InvoiceRecord[]>;
  findInvoice(invoiceId: string): Promise<InvoiceRecord | null>;
  saveInvoice(invoice: InvoiceRecord): Promise<void>;
}
```

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
import { InvoiceUnavailableException } from "../../domain/exceptions/invoice.exceptions";
import { HttpApiAdapter } from "../../../shared/infrastructure/adapters/http-api.adapter";
import { InvoiceRecordSchema, type InvoiceAcl, type InvoiceRecord } from "../acl/invoice.acl";
const unavailable = (response: Response) => new InvoiceUnavailableException({ cause: response });
export class HttpInvoiceAdapter implements InvoiceAcl {
  constructor(private readonly api = new HttpApiAdapter("/api")) {}
  listInvoices(): Promise<InvoiceRecord[]> {
    return this.api.get("/invoices", InvoiceRecordSchema.array(), unavailable);
  }
  findInvoice(invoiceId: string): Promise<InvoiceRecord | null> {
    return this.api.find(`/invoices/${invoiceId}`, InvoiceRecordSchema, unavailable);
  }
  saveInvoice(invoice: InvoiceRecord): Promise<void> {
    return this.api.put(`/invoices/${invoice.id}`, invoice, unavailable);
  }
}
```

```ts src/module/infrastructure/adapters/in-memory-invoice.adapter.ts
import { InvoiceRecordSchema, type InvoiceAcl, type InvoiceRecord } from "../acl/invoice.acl";
const SEED: InvoiceRecord[] = InvoiceRecordSchema.array().parse([
  { id: "1", total: 10, status: "paid" },
  { id: "2", total: 25, status: "pending" },
]);
export class InMemoryInvoiceAdapter implements InvoiceAcl {
  private readonly rows = SEED.map((row) => ({ ...row }));
  async listInvoices(): Promise<InvoiceRecord[]> {
    return [...this.rows];
  }
  async findInvoice(invoiceId: string): Promise<InvoiceRecord | null> {
    return this.rows.find((row) => row.id === invoiceId) ?? null;
  }
  async saveInvoice(invoice: InvoiceRecord): Promise<void> {
    const at = this.rows.findIndex((row) => row.id === invoice.id);
    if (at < 0) this.rows.push({ ...invoice });
    else this.rows[at] = { ...invoice };
  }
}
```

```ts src/module/infrastructure/adapters/invoice.adapter.ts
import type { InvoiceAcl } from "../acl/invoice.acl";
import { HttpInvoiceAdapter } from "./http-invoice.adapter";
import { InMemoryInvoiceAdapter } from "./in-memory-invoice.adapter";
export const invoiceAdapter: InvoiceAcl = import.meta.env.DEV
  ? new InMemoryInvoiceAdapter()
  : new HttpInvoiceAdapter();
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
import type { InvoiceRepositoryInterface } from "../../application/repository-interfaces/invoice.repository-interface";
import type { InvoiceProps } from "../../domain/schemas/invoice.schema";
import type { InvoiceAcl } from "../acl/invoice.acl";
export class InvoiceRepositoryImplementation implements InvoiceRepositoryInterface {
  constructor(private readonly invoices: InvoiceAcl) {}
  listInvoices(): Promise<InvoiceProps[]> {
    return this.invoices.listInvoices();
  }
  findInvoice(invoiceId: string): Promise<InvoiceProps | null> {
    return this.invoices.findInvoice(invoiceId);
  }
  saveInvoice(invoice: InvoiceProps): Promise<void> {
    return this.invoices.saveInvoice(invoice);
  }
}
```

```ts src/module/framework/mutations/pay-invoice.mutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PayInvoiceUseCase } from "../../application/use-cases/pay-invoice.use-case";
import { invoiceAdapter } from "../../infrastructure/adapters/invoice.adapter";
import { InvoiceRepositoryImplementation } from "../../infrastructure/repository-implementations/invoice.repository-implementation";
import { getInvoiceQueryKey } from "../queries/get-invoice.query";
import { listInvoicesQueryKey } from "../queries/list-invoices.query";
const payInvoice = new PayInvoiceUseCase(new InvoiceRepositoryImplementation(invoiceAdapter));
export const usePayInvoiceMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => payInvoice.execute(invoiceId),
    onSuccess: (_paid, invoiceId) =>
      Promise.all([
        client.invalidateQueries({ queryKey: listInvoicesQueryKey() }),
        client.invalidateQueries({ queryKey: getInvoiceQueryKey(invoiceId) }),
      ]),
  });
};
```

```ts src/module/framework/stores/invoices.store.ts
import { create } from "zustand";
import type { InvoiceStatus } from "../../domain/schemas/invoice.schema";
type InvoicesState = {
  status: InvoiceStatus | null;
  setStatus: (status: InvoiceStatus | null) => void;
};
export const useInvoicesStore = create<InvoicesState>((set) => ({
  status: null,
  setStatus: (status) => set({ status }),
}));
```

```ts src/module/framework/controllers/invoice-detail.controller.ts
import { ModuleException } from "../../domain/exceptions/invoice.exceptions";
import { usePayInvoiceMutation } from "../mutations/pay-invoice.mutation";
import { useGetInvoiceQuery } from "../queries/get-invoice.query";
import { invoiceDetailViewModel } from "../view-models/invoice-detail.view-model";
export const useInvoiceDetailController = (invoiceId: string) => {
  const query = useGetInvoiceQuery(invoiceId);
  const payment = usePayInvoiceMutation();
  const failure = query.error ?? payment.error;
  return {
    invoice: query.data ? invoiceDetailViewModel(query.data) : null,
    notice: failure instanceof ModuleException ? failure.message : null,
    canPay: query.data ? !query.data.isPaid : false,
    isPaying: payment.isPending,
    onPay: () => payment.mutate(invoiceId),
  };
};
```

```ts src/module/framework/view-models/invoice-status.view-model.ts
import { InvoiceStatus } from "../../domain/schemas/invoice.schema";
const LABEL: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PAID]: "Paid",
  [InvoiceStatus.PENDING]: "Pending",
};
export const invoiceStatusLabel = (status: InvoiceStatus) => LABEL[status];
export const invoiceStatusOptions = () =>
  Object.values(InvoiceStatus).map((value) => ({ value, label: LABEL[value] }));
```

```ts src/module/framework/view-models/invoice-detail.view-model.ts
import type { InvoiceEntity } from "../../domain/entities/invoice.entity";
import { invoiceStatusLabel } from "./invoice-status.view-model";
export const invoiceDetailViewModel = (invoice: InvoiceEntity) => ({
  title: `Invoice #${invoice.id}`,
  total: String(invoice.total),
  status: invoiceStatusLabel(invoice.status),
});
```


## scaffolds

```ejs src/<module>/framework/queries/<name>.query.ts
import { useQuery } from "@tanstack/react-query";
import { <%= Name %>UseCase } from "../../application/use-cases/<%= name %>.use-case";
import { <%= resourceCamel %>Adapter } from "../../infrastructure/adapters/<%= resource %>.adapter";
import { <%= Resource %>RepositoryImplementation } from "../../infrastructure/repository-implementations/<%= resource %>.repository-implementation";
const <%= camel %> = new <%= Name %>UseCase(new <%= Resource %>RepositoryImplementation(<%= resourceCamel %>Adapter));
export const <%= camel %>QueryKey = () => ["<%= name %>"] as const;
export const use<%= Name %>Query = () =>
  useQuery({ queryKey: <%= camel %>QueryKey(), queryFn: () => <%= camel %>.execute() });
```

```ejs src/<module>/framework/mutations/<name>.mutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { <%= Name %>UseCase } from "../../application/use-cases/<%= name %>.use-case";
import { <%= resourceCamel %>Adapter } from "../../infrastructure/adapters/<%= resource %>.adapter";
import { <%= Resource %>RepositoryImplementation } from "../../infrastructure/repository-implementations/<%= resource %>.repository-implementation";
import { <%= queryCamel %>QueryKey } from "../queries/<%= query %>.query";
const <%= camel %> = new <%= Name %>UseCase(new <%= Resource %>RepositoryImplementation(<%= resourceCamel %>Adapter));
export const use<%= Name %>Mutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => <%= camel %>.execute(id),
    onSuccess: () => client.invalidateQueries({ queryKey: <%= queryCamel %>QueryKey() }),
  });
};
```

## framework-vocabulary

### folder-outside-vocabulary

```ts src/module/framework/utils/format.ts
export const format = (s: string) => s;
```

```expect
- src/module/framework/utils/format.ts (archunit)
```

### wrong-suffix

```ts src/module/framework/queries/list-invoices.ts
export const listInvoicesQueryKey = () => ["invoices"] as const;
```

```expect
- src/module/framework/queries/list-invoices.ts (archunit)
```

### controller-inside-ui

```ts src/module/framework/ui/invoices/invoices.controller.ts
export const useInvoicesController = () => ({ rows: [] as string[] });
```

```expect
- src/module/framework/ui/invoices/invoices.controller.ts (archunit)
```

## query-bridges-use-case

### news-an-adapter

```ts src/module/application/use-cases/list-invoices.use-case.ts
export class ListInvoicesUseCase {
  constructor(private repository: { listInvoices(): Promise<string[]> }) {}
  execute() {
    return this.repository.listInvoices();
  }
}
```

```ts src/module/framework/queries/list-invoices.query.ts
import { useQuery } from "@tanstack/react-query";
import { ListInvoicesUseCase } from "../../application/use-cases/list-invoices.use-case";
import { HttpInvoiceAdapter } from "../../infrastructure/adapters/http-invoice.adapter";
import { InvoiceRepositoryImplementation } from "../../infrastructure/repository-implementations/invoice.repository-implementation";
export const listInvoicesQueryKey = () => ["invoices"] as const;
export const useListInvoicesQuery = () =>
  useQuery({
    queryKey: listInvoicesQueryKey(),
    queryFn: () =>
      new ListInvoicesUseCase(new InvoiceRepositoryImplementation(new HttpInvoiceAdapter())).execute(),
  });
```

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
export class HttpInvoiceAdapter {
  async listInvoices() {
    return [];
  }
}
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export class InvoiceRepositoryImplementation {
  constructor(private readonly invoices: { listInvoices(): Promise<never[]> }) {}
  listInvoices() {
    return this.invoices.listInvoices();
  }
}
```

```expect
- src/module/framework/queries/list-invoices.query.ts (archunit)
```

### no-use-case

```ts src/module/framework/queries/list-invoices.query.ts
import { useQuery } from "@tanstack/react-query";
export const listInvoicesQueryKey = () => ["invoices"] as const;
export const useListInvoicesQuery = () =>
  useQuery({ queryKey: listInvoicesQueryKey(), queryFn: async () => [] });
```

```expect
- src/module/framework/queries/list-invoices.query.ts (archunit)
```

### imports-repository-instance

```ts src/module/application/use-cases/list-invoices.use-case.ts
export class ListInvoicesUseCase {
  constructor(private repository: { listInvoices(): Promise<string[]> }) {}
  execute() {
    return this.repository.listInvoices();
  }
}
```

```ts src/module/framework/queries/list-invoices.query.ts
import { useQuery } from "@tanstack/react-query";
import { ListInvoicesUseCase } from "../../application/use-cases/list-invoices.use-case";
import { invoiceRepository } from "../../infrastructure/repository-implementations/invoice.repository-implementation";
export const listInvoicesQueryKey = () => ["invoices"] as const;
export const useListInvoicesQuery = () =>
  useQuery({
    queryKey: listInvoicesQueryKey(),
    queryFn: () => new ListInvoicesUseCase(invoiceRepository).execute(),
  });
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export const invoiceRepository = { listInvoices: async () => [] as string[] };
```

```expect
- src/module/framework/queries/list-invoices.query.ts (archunit)
```

## one-hook-per-file

### two-hooks-in-one-file

```ts src/module/framework/queries/invoices.query.ts
import { useQuery } from "@tanstack/react-query";
export const invoicesQueryKey = () => ["invoices"] as const;
export const useListInvoicesQuery = () =>
  useQuery({ queryKey: invoicesQueryKey(), queryFn: async () => [] });
export const useGetInvoiceQuery = () =>
  useQuery({ queryKey: invoicesQueryKey(), queryFn: async () => null });
```

```expect
- src/module/framework/queries/invoices.query.ts (archunit)
```

### file-name-differs-from-hook

```ts src/module/framework/queries/invoices.query.ts
import { useQuery } from "@tanstack/react-query";
export const invoicesQueryKey = () => ["invoices"] as const;
export const useListInvoicesQuery = () =>
  useQuery({ queryKey: invoicesQueryKey(), queryFn: async () => [] });
```

```expect
- src/module/framework/queries/invoices.query.ts (archunit)
```

## use-case-bridged-once

### use-case-without-bridge

```ts src/module/application/use-cases/list-invoices.use-case.ts
export class ListInvoicesUseCase {
  execute() {
    return [];
  }
}
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (archunit)
```

### use-case-with-two-bridges

```ts src/module/application/use-cases/list-invoices.use-case.ts
export class ListInvoicesUseCase {
  execute() {
    return [];
  }
}
```

```ts src/module/framework/queries/list-invoices.query.ts
import { useQuery } from "@tanstack/react-query";
import { ListInvoicesUseCase } from "../../application/use-cases/list-invoices.use-case";
export const listInvoicesQueryKey = () => ["list-invoices"] as const;
export const useListInvoicesQuery = () =>
  useQuery({
    queryKey: listInvoicesQueryKey(),
    queryFn: () => new ListInvoicesUseCase().execute(),
  });
```

```ts src/module/framework/queries/paid-invoices.query.ts
import { useQuery } from "@tanstack/react-query";
import { ListInvoicesUseCase } from "../../application/use-cases/list-invoices.use-case";
export const paidInvoicesQueryKey = () => ["paid-invoices"] as const;
export const usePaidInvoicesQuery = () =>
  useQuery({
    queryKey: paidInvoicesQueryKey(),
    queryFn: () => new ListInvoicesUseCase().execute(),
  });
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (archunit)
```

## controller-exports-no-types

### controller-exports-a-type

```ts src/module/framework/controllers/invoices.controller.ts
export type InvoicesController = { rows: string[] };
export const useInvoicesController = (): InvoicesController => ({ rows: [] });
```

```expect
- src/module/framework/controllers/invoices.controller.ts (archunit)
```

## query-keys-from-factory

### literal-query-key

```ts src/module/application/use-cases/pay-invoice.use-case.ts
export class PayInvoiceUseCase {
  async execute() {}
}
```

```ts src/module/framework/mutations/pay-invoice.mutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PayInvoiceUseCase } from "../../application/use-cases/pay-invoice.use-case";
export const usePayInvoiceMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => new PayInvoiceUseCase().execute(),
    onSuccess: () => client.invalidateQueries({ queryKey: ["invoices"] }),
  });
};
```

```expect
- src/module/framework/mutations/pay-invoice.mutation.ts (archunit)
```

## controller-reaches-core-through-queries

### imports-infrastructure

```ts src/module/framework/controllers/invoices.controller.ts
import { invoiceRepository } from "../../infrastructure/repository-implementations/invoice.repository-implementation";
export const useInvoicesController = () => ({ rows: invoiceRepository.list() });
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export const invoiceRepository = { list: () => [] as string[] };
```

```expect
- src/module/framework/controllers/invoices.controller.ts (fallow)
```

### imports-ui

```ts src/module/framework/controllers/invoices.controller.ts
import { InvoiceRows } from "../ui/invoices/invoice-rows";
export const useInvoicesController = () => ({ rows: [] as string[], Rows: InvoiceRows });
```

```tsx src/module/framework/ui/invoices/invoice-rows.tsx
export const InvoiceRows = () => <ul />;
```

```expect
- src/module/framework/controllers/invoices.controller.ts (fallow)
```

### reads-cache-itself

```ts src/module/framework/controllers/invoices.controller.ts
import { useQueryClient } from "@tanstack/react-query";
export const useInvoicesController = () => ({ client: useQueryClient() });
```

```expect
- src/module/framework/controllers/invoices.controller.ts (oxlint)
```

## view-model-imports-only-domain

### imports-application

```ts src/module/application/use-cases/list-invoices.use-case.ts
export class ListInvoicesUseCase {
  execute() {
    return [];
  }
}
```

```ts src/module/framework/view-models/invoice-row.view-model.ts
import { ListInvoicesUseCase } from "../../application/use-cases/list-invoices.use-case";
export const invoiceRowViewModel = () => new ListInvoicesUseCase().execute();
```

```expect
- src/module/framework/view-models/invoice-row.view-model.ts (fallow)
```

## no-framework-import

### view-model-imports-react

```ts src/module/framework/view-models/invoice-row.view-model.ts
import { useMemo } from "react";
export const invoiceRowViewModel = () => useMemo;
```

```expect
- src/module/framework/view-models/invoice-row.view-model.ts (oxlint)
```

## store-imports-domain-and-view-models

### imports-react-query

```ts src/module/framework/stores/selection.store.ts
import { useQuery } from "@tanstack/react-query";
export const useSelectionStore = () => useQuery;
```

```expect
- src/module/framework/stores/selection.store.ts (oxlint)
```

### imports-infrastructure

```ts src/module/framework/stores/selection.store.ts
import { invoiceRepository } from "../../infrastructure/repository-implementations/invoice.repository-implementation";
export const useSelectionStore = () => invoiceRepository;
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export const invoiceRepository = { list: () => [] as string[] };
```

```expect
- src/module/framework/stores/selection.store.ts (fallow)
```

## no-environment

### store-calls-environment

```ts src/module/framework/stores/selection.store.ts
export const useSelectionStore = () => localStorage.getItem("selection");
```

```expect
- src/module/framework/stores/selection.store.ts (fallow, oxlint)
```

### controller-calls-environment

```ts src/module/framework/controllers/invoices.controller.ts
export const useInvoicesController = () => ({ rows: [] as string[], at: window.location.href });
```

```expect
- src/module/framework/controllers/invoices.controller.ts (oxlint)
```

## no-hooks

### core-exports-a-hook

```ts src/module/domain/entities/invoice.entity.ts
export class Invoice {
  constructor(public readonly id: string) {}
}
export const useInvoice = (id: string) => new Invoice(id);
```

```expect
- src/module/domain/entities/invoice.entity.ts (archunit)
```

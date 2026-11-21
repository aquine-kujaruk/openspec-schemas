## MODIFIED Requirements

### Requirement: Verify proves the product works as a whole

`@by:person`

Verify SHALL run, besides every workstream's check and the product tests, the whole-product checks and, for a product whose platform is `web`, its end-to-end tests. It SHALL record each end-to-end test in the evidence with its result. A failing whole-product check or end-to-end test SHALL make the change not verified and SHALL be raised as feedback on the workstream that owns the file it names, or on the change when it names none. Verify SHALL change no file of the product.

#### Scenario Outline: on a `<platform>` product, `<failure>` makes the change `<verdict>`, feedback on `<raisedOn>`

- **GIVEN** a built change of a `<platform>` product <!-- builtChangeOfPlatform -->
- **AND** `<failure>` <!-- wholeProductFailure -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the change is reported `<verdict>` <!-- changeReportedAs -->
- **AND** feedback is raised on `<raisedOn>` <!-- feedbackRaisedOn -->

##### Examples:

  | platform | failure                                                                              | verdict      | raisedOn          |
  | -------- | ------------------------------------------------------------------------------------ | ------------ | ----------------- |
  | web      | nothing fails                                                                        | verified     | nothing           |
  | web      | no-unused-files names src/orders/framework/ui/orders-list/old-row.component.tsx      | not verified | react             |
  | web      | duplication-below-threshold names src/orders/domain/entities/order.entity.ts         | not verified | app-domain        |
  | web      | the end-to-end test cancel-order fails                                               | not verified | the change        |
  | node     | no-unused-files names src/orders/infrastructure/acl/order.acl.ts                     | not verified | infrastructure    |
  | node     | nothing fails, and it has no end-to-end tests                                        | verified     | nothing           |

#### Scenario Outline: the end-to-end test `<test>` `<result>` is recorded `<recorded>`

- **GIVEN** a built change of a `<platform>` product <!-- builtChangeOfPlatform -->
- **AND** the end-to-end test `<test>` `<result>` <!-- e2eTestResult -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence records `<test>` as `<recorded>` <!-- evidenceRecordsE2e -->

##### Examples:

  | platform | test         | result | recorded |
  | -------- | ------------ | ------ | -------- |
  | web      | cancel-order | passes | passed   |
  | web      | cancel-order | fails  | failed   |

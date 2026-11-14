# orders/list-customer-orders Specification

## Purpose
Let a caller list the orders belonging to a customer, newest first, retaining each order's identity, customer identity, total in cents and placement date.

## Requirements

### Requirement: List only the requested customer's orders newest first

The system SHALL return all orders belonging to the requested customer, ordered by placement date from newest to oldest. Each returned order SHALL retain its id, customer id, integer total in cents and placement date.

#### Scenario Outline: List orders newest first for `<customerId>`

- **GIVEN** these orders exist <!-- ordersExist -->
  | id | customerId | totalCents | placedAt |
  | order-old | customer-a | 1234 | 2026-01-01T10:00:00Z |
  | order-other | customer-b | 5678 | 2026-01-04T10:00:00Z |
  | order-new | customer-a | 9099 | 2026-01-03T10:00:00Z |
  | order-middle | customer-a | 2501 | 2026-01-02T10:00:00Z |
- **WHEN** orders are listed for customer `<customerId>` <!-- listCustomerOrders -->
- **THEN** the returned orders are exactly these rows in this order <!-- listedOrdersAre -->
  | id | customerId | totalCents | placedAt |
  | <firstId> | <customerId> | <firstTotalCents> | <firstPlacedAt> |
  | <secondId> | <customerId> | <secondTotalCents> | <secondPlacedAt> |
  | <thirdId> | <customerId> | <thirdTotalCents> | <thirdPlacedAt> |

##### Examples:

  | customerId | firstId | firstTotalCents | firstPlacedAt | secondId | secondTotalCents | secondPlacedAt | thirdId | thirdTotalCents | thirdPlacedAt |
  | ---------- | ------- | --------------- | ------------- | -------- | ---------------- | -------------- | ------- | --------------- | ------------- |
  | customer-a | order-new | 9099 | 2026-01-03T10:00:00Z | order-middle | 2501 | 2026-01-02T10:00:00Z | order-old | 1234 | 2026-01-01T10:00:00Z |

#### Scenario Outline: Return a single order for `<customerId>`

- **GIVEN** these orders exist <!-- ordersExist -->
  | id | customerId | totalCents | placedAt |
  | order-old | customer-a | 1234 | 2026-01-01T10:00:00Z |
  | order-other | customer-b | 5678 | 2026-01-04T10:00:00Z |
- **WHEN** orders are listed for customer `<customerId>` <!-- listCustomerOrders -->
- **THEN** the returned orders are exactly these rows in this order <!-- listedOrdersAre -->
  | id | customerId | totalCents | placedAt |
  | <orderId> | <customerId> | <totalCents> | <placedAt> |

##### Examples:

  | customerId | orderId | totalCents | placedAt |
  | ---------- | ------- | ---------- | -------- |
  | customer-b | order-other | 5678 | 2026-01-04T10:00:00Z |

### Requirement: An empty customer order history is an empty list

The system SHALL return an empty list when the requested customer has no orders.

#### Scenario Outline: No orders returned for `<customerId>`

- **GIVEN** these orders exist <!-- ordersExist -->
  | id | customerId | totalCents | placedAt |
  | order-other | customer-b | 5678 | 2026-01-04T10:00:00Z |
- **WHEN** orders are listed for customer `<customerId>` <!-- listCustomerOrders -->
- **THEN** the returned order count is `<count>` <!-- listedOrderCountIs -->

##### Examples:

  | customerId | count |
  | ---------- | ----- |
  | customer-without-orders | 0 |
